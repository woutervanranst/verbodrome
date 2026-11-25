/**
 * The Dutch simple cells: which target is one word (`dutchCellOf`), which has none (`dutchAvailability`), and how each
 * word is built. A regular word is the present stem plus an ending (`dutchStem`, `dutchEnding`), spelled by the rules
 * in `orthography.ts`. A cell with listed material (a whole form such as ben or kunt, a spoken alternative such as hou,
 * a strong past tense or past participle, a hinted principal part) or one not built on the stem (the plural present,
 * the infinitive, the present participle) is built whole by `listedCell`, which takes its regular members from the same
 * derivation, so the words come out in the order of the lexicon and the rules.
 *
 * The 2nd person singular present has three sets of forms, all built here: the plain forms (jij werkt), the forms after
 * the verb (werk jij, marked `afterVerb`) and the formal forms of u that are not plain forms (u heeft, marked `formal`).
 * The clause keeps the set its subject and word order need (`clause.ts`): the cell of an auxiliary cannot see the
 * subject, and building the sets here keeps the order of a compound tense's forms. The marks are not steps: a step is
 * recorded only for what a rule did to the word.
 */
import { step } from '../../core/derivation.js';
import type { DerivationStep } from '../../core/derivation.js';
import { one } from '../../core/fork.js';
import type { Fork, Marks, Outcome } from '../../core/fork.js';
import type { Cell, Unavailability } from '../../core/staged.js';
import { ConjugationError } from '../../errors.js';
import { itemAt } from '../../parts.js';
import type { ResolvedTarget } from '../../types.js';
import { inseparableVerbs } from './lexicon.js';
import type { DutchLexeme } from './lexicon.js';
import { dentals } from './orthography.js';
import { dutchRules } from './rules.js';

export type FiniteCell = Extract<Cell, { kind: 'finite' }>;

/** The mark of a 2nd person singular present form used when jij or je follows the verb (werk jij). */
export const afterVerb = 'after-verb';
/** The mark of a formal form of u that is not a plain 2nd person singular form (u heeft). */
export const formal = 'formal';
/** The mark of the spoken infinitive wezen, which the clause labels with its condition. */
export const spoken = 'spoken';

/** Where the e-ANS describes the conjugation as a whole: the source every unavailable target names. */
const availabilitySource = 'https://e-ans.ivdnt.org/topics/pid/ans0203lingtopic';

/** The simple cell of a target, or null for a compound tense (perfect, future and the rest). */
export function dutchCellOf(target: ResolvedTarget): Cell | null {
  if (target.mood === 'infinitive') return { kind: 'nonFinite', form: 'infinitive' };
  if (target.mood === 'participle') return { kind: 'nonFinite', form: target.tense === 'present' ? 'presentParticiple' : 'participle' };
  if (target.person === null || target.number === null) return null;
  if (target.mood === 'imperative') return { kind: 'finite', mood: 'imperative', tense: 'present', person: target.person, number: target.number };
  if (target.mood === 'indicative' && (target.tense === 'present' || target.tense === 'past')) {
    return { kind: 'finite', mood: 'indicative', tense: target.tense, person: target.person, number: target.number };
  }
  return null;
}

/**
 * Why a target has no form: an impersonal verb has only the 3rd person, a verb used only in the singular (vriezen) no
 * plural, some verbs no imperative, and zullen nothing beyond its present, past, infinitive and (as the legacy
 * resolver had it) present participle.
 * When several apply, the last of these is the reason given.
 */
export function dutchAvailability(lexeme: DutchLexeme, target: ResolvedTarget): Unavailability | null {
  const { entry } = lexeme;
  let found: { readonly rule: (typeof dutchRules)[keyof typeof dutchRules]; readonly reason: Unavailability['reason'] } | null = null;
  if (entry.impersonal && target.person !== null && target.person !== 3) found = { rule: dutchRules['nl.avail.impersonal'], reason: 'impersonal' };
  if (entry.singularOnly && target.person !== null && target.number === 'plural') found = { rule: dutchRules['nl.avail.singular-only'], reason: 'impersonal' };
  if (entry.noImperative && target.mood === 'imperative') found = { rule: dutchRules['nl.avail.no-imperative'], reason: 'noImperative' };
  const simple = target.mood === 'infinitive' || (target.mood === 'participle' && target.tense === 'present')
    || (target.mood === 'indicative' && (target.tense === 'present' || target.tense === 'past'));
  if (entry.noCompound && !simple) found = { rule: dutchRules['nl.avail.no-compound'], reason: 'defective' };
  if (found === null) return null;
  return { reason: found.reason, step: step(found.rule, lexeme.lemma, null, { form: `${target.mood}/${target.tense}` }), source: availabilitySource };
}

/** The present stem, which every regular word starts from. */
export function dutchStem(lexeme: DutchLexeme): Fork<string> {
  return one(lexeme.stem.written, lexeme.stem.steps);
}

/** 0-5: singular 1-2-3, then plural 1-2-3. */
function slot(cell: FiniteCell): number {
  return (cell.number === 'plural' ? 3 : 0) + cell.person - 1;
}

export const isSecondSingularPresent = (cell: Cell | null): boolean => cell !== null && cell.kind === 'finite'
  && cell.mood === 'indicative' && cell.tense === 'present' && cell.person === 2 && cell.number === 'singular';

function presentStep(cell: FiniteCell, before: string, after: string, ending: string): DerivationStep {
  return step(dutchRules['nl.end.present'], before, after, {
    ending, person: { term: 'person', id: String(cell.person) }, number: { term: 'number', id: cell.number },
  });
}

/**
 * The 2nd or 3rd person singular present: stem + t, or the stem alone when it already ends in t. The step shows the word
 * as it is written, ga + t as gaat, which `nl.orth.double-a` then explains.
 */
function presentT(cell: FiniteCell, stem: string): Fork<string> {
  if (stem.endsWith('t')) return one('', [step(dutchRules['nl.end.present-t-drop'], stem, stem)]);
  return one('t', [presentStep(cell, stem, `${stem}${/(^|[^a])a$/u.test(stem) ? 'a' : ''}t`, 't')]);
}

const isMarked = (mark: string) => (outcome: Outcome<string>): boolean => outcome.marks?.includes(mark) ?? false;
const isAfterVerb = isMarked(afterVerb);
/** The same outcome with `marks` instead of its own. */
const marked = (outcome: Outcome<string>, marks: Marks): Outcome<string> => ({ ...outcome, marks });

/**
 * The 2nd person singular after the verb (werk jij): the stem without the -t of the plain form, or, after a stem that
 * already ends in t, the stem as it is (zet jij).
 */
function afterVerbEnding(stem: string): Fork<string> {
  const ending = stem.endsWith('t') ? step(dutchRules['nl.end.present-t-drop'], stem, stem) : step(dutchRules['nl.end.inversion-t-drop'], null, stem);
  return one('', [ending], {}, [afterVerb]);
}

/** The prefixed past participle a derivative with an inseparable prefix ends up with: ver + huisd, uit + ver + kocht. */
const prefixed = (lexeme: DutchLexeme, word: string): string => (lexeme.particle?.text ?? '') + lexeme.innerPrefix + word;

/** The step for the absent ge- after an unstressed prefix; {after} is the whole participle. */
const geBlocked = (lexeme: DutchLexeme, before: string, word: string): DerivationStep =>
  step(dutchRules['nl.part.ge-blocked'], before, prefixed(lexeme, word), { prefix: lexeme.inseparablePrefix });

/**
 * The ending of a regular word: the present singular (with the form after the verb in the 2nd person), the weak past
 * tense and past participle (d or t by `dentals`, no second d or t after a stem that ends in one), the imperative. The
 * plural present, the infinitive and the present participle are built whole by `listedCell`.
 */
export function dutchEnding(lexeme: DutchLexeme, cell: Cell, stem: string): Fork<string> {
  if (cell.kind === 'nonFinite') {
    if (cell.form !== 'participle') throw new ConjugationError('GENERATION_FAILURE', `The Dutch ${cell.form} is built whole, not from the stem.`);
    return dentals(lexeme).flatMap(({ dental, steps }) => {
      // No second d or t: the stem zet makes gezet, and 't kofschip has nothing to decide.
      const ending = stem.endsWith(dental) ? '' : dental;
      const word = stem + ending;
      const blocked = lexeme.inseparablePrefix ? [geBlocked(lexeme, word, word)] : [];
      const added = ending === ''
        ? [step(dutchRules['nl.part.weak-no-ending'], stem, word, { dental })]
        : [step(dutchRules['nl.part.weak'], stem, word, { ending }), ...steps(word)];
      return one(ending, [...added, ...blocked]);
    });
  }
  if (cell.mood === 'imperative') return one('', [step(dutchRules['nl.imp.stem'], stem, stem)]);
  if (cell.tense === 'past') {
    return dentals(lexeme).flatMap(({ dental, steps }) => {
      const ending = `${dental}e${cell.number === 'plural' ? 'n' : ''}`;
      return one(ending, [step(dutchRules['nl.end.past-weak'], stem, stem + ending, { ending }), ...steps(stem + ending)]);
    });
  }
  const index = slot(cell);
  if (index === 0) return one('', [presentStep(cell, stem, stem, '')]);
  if (index === 1) return [...presentT(cell, stem), ...afterVerbEnding(stem)];
  if (index === 2) return presentT(cell, stem);
  throw new ConjugationError('GENERATION_FAILURE', 'The Dutch plural present is the infinitive, built whole.');
}

const listed = (lexeme: DutchLexeme, form: string): Fork<string> => one(form, [step(dutchRules['nl.cell.lexical'], lexeme.base, form)]);

/**
 * A listed alternative form: the stem without its final d after a vowel (hou, rij, glij, snij), or another form the
 * lexicon lists (jij kan, jij zal).
 */
function alternative(lexeme: DutchLexeme, form: string): Fork<string> {
  const stem = lexeme.stem.written;
  return stem.endsWith('d') && form === stem.slice(0, -1)
    ? one(form, [step(dutchRules['nl.cell.d-dropped'], stem, form)])
    : listed(lexeme, form);
}
const alternatives = (lexeme: DutchLexeme, forms: readonly string[] | undefined): Fork<string> => (forms ?? []).flatMap(form => alternative(lexeme, form));

/**
 * The present of a cell with listed material, or null when the stem and ending build it alone. The plural is the
 * infinitive. Singular: the listed whole form, or else the regular one, followed by the listed alternatives of that
 * person. The 2nd person singular adds the forms after the verb (each listed plain form without its -t, bent → ben;
 * without a listed form, the stem and the alternatives of the 1st and 2nd person) and the formal forms that are not
 * plain forms.
 */
function present(lexeme: DutchLexeme, cell: FiniteCell, regular: () => Fork<string>): Fork<string> | null {
  const index = slot(cell);
  const { entry } = lexeme;
  if (index > 2) return one(lexeme.base, [presentStep(cell, lexeme.stem.written, lexeme.base, 'en')]);
  const whole = entry.presentCells?.[index];
  const own = entry.presentAlternatives?.[index];
  const firstAlternatives = entry.presentAlternatives?.[0];
  const formalForms = entry.formalPresent;
  const second = index === 1;
  if (whole === undefined && own === undefined && !(second && (formalForms !== undefined || firstAlternatives !== undefined))) return null;
  const derived = whole === undefined ? regular() : [];
  const plain = [...(whole === undefined ? derived.filter(o => !isAfterVerb(o)) : listed(lexeme, whole)), ...alternatives(lexeme, own)];
  if (!second) return plain;
  // After the verb: each listed plain form without its -t (kunt → kun; kan stays kan, with no step), or else the stem
  // and the alternatives of the 1st and 2nd person (houd, hou).
  const afterTheVerb = whole !== undefined
    ? plain.map(o => {
      const form = o.value.replace(/t$/u, '');
      return { ...o, value: form, steps: form === o.value ? o.steps : [...o.steps, step(dutchRules['nl.end.inversion-t-drop'], null, form)], marks: [afterVerb] };
    })
    : [...derived.filter(isAfterVerb), ...alternatives(lexeme, [...firstAlternatives ?? [], ...own ?? []]).map(o => marked(o, [afterVerb]))];
  const plainForms = new Set(plain.map(o => o.value));
  const formalOnly = (formalForms ?? []).filter(form => !plainForms.has(form))
    .flatMap(form => one(form, [step(dutchRules['nl.cell.formal'], lexeme.base, form)], {}, [formal]));
  return [...plain, ...afterTheVerb, ...formalOnly];
}

/**
 * The plural of a strong past tense from its singular: -de/-te + n; after a short o the consonant doubles (won →
 * wonnen); a final f or s is v or z before -en (gaf → gaven); a long vowel written double is single in the open syllable
 * (sloot → sloten).
 */
export function strongPastPlural(singular: string): string {
  if (/(de|te)$/u.test(singular)) return `${singular}n`;
  if (/(^|[^aeiouy])o[bcdfghjklmnpqrstvwxz]$/u.test(singular)) return `${singular}${singular.slice(-1)}en`;
  let stem = singular;
  if (/[fs]$/u.test(stem)) stem = stem.slice(0, -1) + (stem.endsWith('f') ? 'v' : 'z');
  stem = stem.replace(/([aeou])\1([bcdfghjklmnpqrstvwxz])$/u, '$1$2');
  return `${stem}en`;
}

/** A listed (or hinted) strong past form. */
const strongPast = (lexeme: DutchLexeme, form: string): Fork<string> => one(form, [step(dutchRules['nl.end.past-strong'], lexeme.base, form)]);

/** The plural of a listed or hinted singular: listed itself, or formed from the singular. */
function strongPlural(lexeme: DutchLexeme, singular: string, plural: string | undefined): Fork<string> {
  if (plural !== undefined) return strongPast(lexeme, plural);
  const formed = strongPastPlural(singular);
  return one(formed, [step(dutchRules['nl.end.past-strong'], lexeme.base, singular), step(dutchRules['nl.end.past-plural-strong'], singular, formed)]);
}

/**
 * The past tense of a cell with listed material, or null for a weak verb: a hinted plural; a hinted singular (and the
 * plural made from it); the strong forms the lexicon lists, then the weak ones of a verb that has both.
 */
function past(lexeme: DutchLexeme, cell: FiniteCell, regular: () => Fork<string>): Fork<string> | null {
  const { hints, entry } = lexeme;
  const plural = cell.number === 'plural';
  if (plural && hints.pastPlural) return strongPast(lexeme, hints.pastPlural);
  if (hints.pastSingular) return plural ? strongPlural(lexeme, hints.pastSingular, hints.pastPlural) : strongPast(lexeme, hints.pastSingular);
  if (!entry.pastSingular) return null;
  const strong = entry.pastSingular.flatMap((singular, index) =>
    plural ? strongPlural(lexeme, singular, entry.pastPlural?.[index]) : strongPast(lexeme, singular));
  return [...strong, ...(entry.alsoWeakPast ? regular() : [])];
}

/** Whether the base verb itself starts with an unstressed prefix the lexicon lists. */
const baseHasPrefix = (lexeme: DutchLexeme): boolean => Boolean(Object.hasOwn(inseparableVerbs, lexeme.base) && inseparableVerbs[lexeme.base]);

/**
 * The past participle with listed material, or null for a weak one: a hinted participle, or the listed ones followed by
 * the weak one of a verb that has both. A derivative with an inseparable prefix drops the ge- of its listed participle
 * (verkopen: gekocht → kocht, which the clause makes verkocht), unless its base verb has such a prefix itself.
 */
function participle(lexeme: DutchLexeme, regular: () => Fork<string>): Fork<string> | null {
  const { hints, entry } = lexeme;
  const strong = (form: string): Fork<string> => one(form, [step(dutchRules['nl.part.strong'], lexeme.base, form)]);
  const forms = hints.pastParticiple ? strong(hints.pastParticiple)
    : entry.participles ? [...entry.participles.flatMap(strong), ...(entry.alsoWeakParticiple ? regular() : [])] : null;
  if (forms === null || lexeme.particle === null || !lexeme.inseparablePrefix || baseHasPrefix(lexeme)) return forms;
  return forms.map(outcome => {
    const without = outcome.value.replace(/^ge/u, '');
    if (without === outcome.value) return outcome;
    return { ...outcome, value: without, steps: [...outcome.steps, geBlocked(lexeme, outcome.value, without)] };
  });
}

/**
 * The words of a cell that has listed material or is not built on the stem, or null when the stem and ending build it.
 * `regular` derives the same cell from the stem, for a cell that mixes listed and regular words.
 */
export function listedCell(lexeme: DutchLexeme, cell: Cell, regular: () => Fork<string>): Fork<string> | null {
  if (cell.kind === 'nonFinite') {
    if (cell.form === 'infinitive') {
      // zijn has the spoken infinitive wezen, marked for the clause to label.
      const [first, ...spokenForms] = lexeme.infinitives;
      return [...one(first ?? itemAt(lexeme.infinitives, 0)),
        ...spokenForms.flatMap(form => one(form, [step(dutchRules['nl.cell.spoken-infinitive'], lexeme.base, form)], {}, [spoken]))];
    }
    if (cell.form === 'presentParticiple') return one(`${lexeme.base}d`, [step(dutchRules['nl.part.present'], lexeme.base, `${lexeme.base}d`)]);
    return participle(lexeme, regular);
  }
  if (cell.mood === 'imperative') {
    const { imperative } = lexeme.entry;
    const short = lexeme.entry.presentAlternatives?.[0];
    if (imperative === undefined && short === undefined) return null;
    return [...(imperative === undefined ? regular() : listed(lexeme, imperative)), ...alternatives(lexeme, short)];
  }
  return cell.tense === 'past' ? past(lexeme, cell, regular) : present(lexeme, cell, regular);
}
