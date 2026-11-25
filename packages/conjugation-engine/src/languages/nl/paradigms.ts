/**
 * The Dutch simple cells: which target is one word (`dutchCellOf`), which has none (`dutchAvailability`), and how each
 * word is built. A regular word is the present stem plus an ending (`dutchStem`, `dutchEnding`), spelled by the rules
 * in `orthography.ts`. A cell with listed material (a whole form such as ben or kunt, a spoken alternative such as hou,
 * a strong past tense or past participle, a hinted principal part) or one not built on the stem (the plural present,
 * the infinitive, the present participle) is built whole by `listedCell`, which takes its regular members from the same
 * derivation, so the words come out in the order of the lexicon and the rules.
 *
 * The 2nd person singular present has three sets of forms, all built here: the plain forms (jij werkt), the forms after
 * the verb (werk jij, recorded with `nl.end.inversion-t-drop`) and the formal forms of u that are not plain forms (u
 * heeft, recorded with `nl.cell.formal`). The clause keeps the set its subject and word order need (`clause.ts`): the
 * cell of an auxiliary cannot see the subject, and building the sets here keeps the order of a compound tense's forms.
 */
import { step } from '../../core/derivation.js';
import type { DerivationStep } from '../../core/derivation.js';
import { one } from '../../core/fork.js';
import type { Fork, Outcome } from '../../core/fork.js';
import type { Cell, Unavailability } from '../../core/staged.js';
import { ConjugationError } from '../../errors.js';
import { itemAt } from '../../parts.js';
import type { ResolvedTarget } from '../../types.js';
import { inseparableVerbs } from './lexicon.js';
import type { DutchLexeme } from './lexicon.js';
import { dentals } from './orthography.js';
import { dutchRules } from './rule-table.js';

export type FiniteCell = Extract<Cell, { kind: 'finite' }>;

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
 * plural, some verbs no imperative, and zullen nothing beyond its present, past, infinitive and present participle.
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

/** The 2nd or 3rd person singular present: stem + t, or the stem alone when it already ends in t. */
function presentT(cell: FiniteCell, stem: string): Fork<string> {
  return stem.endsWith('t') ? one('', [step(dutchRules['nl.end.present-t-drop'], stem, stem)]) : one('t', [presentStep(cell, stem, `${stem}t`, 't')]);
}

const afterVerbStep = (form: string): DerivationStep => step(dutchRules['nl.end.inversion-t-drop'], null, form);
const isAfterVerb = (outcome: Outcome<string>): boolean => outcome.steps.some(s => s.rule === 'nl.end.inversion-t-drop');

/**
 * The ending of a regular word: the present singular (with the form after the verb in the 2nd person), the weak past
 * tense and past participle (d or t by `dentals`, no second d or t after a stem that ends in one), the imperative. The
 * plural present, the infinitive and the present participle are built whole by `listedCell`.
 */
export function dutchEnding(lexeme: DutchLexeme, cell: Cell, stem: string): Fork<string> {
  if (cell.kind === 'nonFinite') {
    if (cell.form !== 'participle') throw new ConjugationError('GENERATION_FAILURE', `The Dutch ${cell.form} is built whole, not from the stem.`);
    return dentals(lexeme).flatMap(({ dental, steps }) => {
      const ending = stem.endsWith(dental) ? '' : dental;
      const word = stem + ending;
      const blocked = lexeme.inseparablePrefix ? [step(dutchRules['nl.part.ge-blocked'], word, word, { prefix: lexeme.inseparablePrefix })] : [];
      return one(ending, [step(dutchRules['nl.part.weak'], stem, word, { ending }), ...steps(word), ...blocked]);
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
  if (index === 1) return [...presentT(cell, stem), ...one('', [afterVerbStep(stem)])];
  if (index === 2) return presentT(cell, stem);
  throw new ConjugationError('GENERATION_FAILURE', 'The Dutch plural present is the infinitive, built whole.');
}

const listed = (lexeme: DutchLexeme, form: string): Fork<string> => one(form, [step(dutchRules['nl.cell.lexical'], lexeme.base, form)]);
const listedAll = (lexeme: DutchLexeme, forms: readonly string[] | undefined): Fork<string> => (forms ?? []).flatMap(form => listed(lexeme, form));
/** `outcome` as the form after the verb, `form`. */
const afterVerb = (outcome: Outcome<string>, form: string): Outcome<string> =>
  ({ ...outcome, value: form, steps: [...outcome.steps, afterVerbStep(form)] });

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
  const alternatives = entry.presentAlternatives?.[index];
  const firstAlternatives = entry.presentAlternatives?.[0];
  const formal = entry.formalPresent;
  const second = index === 1;
  if (whole === undefined && alternatives === undefined && !(second && (formal !== undefined || firstAlternatives !== undefined))) return null;
  const derived = whole === undefined ? regular() : [];
  const plain = [...(whole === undefined ? derived.filter(o => !isAfterVerb(o)) : listed(lexeme, whole)), ...listedAll(lexeme, alternatives)];
  if (!second) return plain;
  const afterTheVerb = whole !== undefined
    ? plain.map(o => afterVerb(o, o.value === 'bent' ? 'ben' : o.value.replace(/t$/u, '')))
    : [...derived.filter(isAfterVerb), ...[...firstAlternatives ?? [], ...alternatives ?? []].flatMap(form => listed(lexeme, form).map(o => afterVerb(o, form)))];
  const plainForms = new Set(plain.map(o => o.value));
  const formalOnly = (formal ?? []).filter(form => !plainForms.has(form)).flatMap(form => one(form, [step(dutchRules['nl.cell.formal'], lexeme.base, form)]));
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
    const blocked = step(dutchRules['nl.part.ge-blocked'], outcome.value, without, { prefix: lexeme.inseparablePrefix });
    return { ...outcome, value: without, steps: [...outcome.steps, blocked] };
  });
}

/**
 * The words of a cell that has listed material or is not built on the stem, or null when the stem and ending build it.
 * `regular` derives the same cell from the stem, for a cell that mixes listed and regular words.
 */
export function listedCell(lexeme: DutchLexeme, cell: Cell, regular: () => Fork<string>): Fork<string> | null {
  if (cell.kind === 'nonFinite') {
    if (cell.form === 'infinitive') return [...one(itemAt(lexeme.infinitives, 0)), ...listedAll(lexeme, lexeme.infinitives.slice(1))];
    if (cell.form === 'presentParticiple') return one(`${lexeme.base}d`, [step(dutchRules['nl.part.present'], lexeme.base, `${lexeme.base}d`)]);
    return participle(lexeme, regular);
  }
  if (cell.mood === 'imperative') {
    const { imperative } = lexeme.entry;
    const alternatives = lexeme.entry.presentAlternatives?.[0];
    if (imperative === undefined && alternatives === undefined) return null;
    return [...(imperative === undefined ? regular() : listed(lexeme, imperative)), ...listedAll(lexeme, alternatives)];
  }
  return cell.tense === 'past' ? past(lexeme, cell, regular) : present(lexeme, cell, regular);
}
