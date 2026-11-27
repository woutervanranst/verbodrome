import { step } from '../../core/derivation.js';
import { chain, one } from '../../core/fork.js';
import type { Fork, Outcome } from '../../core/fork.js';
import { applyJunctureRules } from '../../core/juncture.js';
import type { Cell } from '../../core/staged.js';
import { ConjugationError } from '../../errors.js';
import { itemAt } from '../../parts.js';
import { slots } from './lexicon.js';
import type { ItalianLexeme, PastSeries, Slot, WholeForm } from './lexicon.js';
import {
  agreementVowels, conditionalAreEndings, conditionalEndings, futureAreEndings, futureEndings, gerundEndings, imperativeEndings,
  imperfectEndings, participleStems, pastEndings, pastEttiEndings, pastStrongEndings, presentEndings, presentParticipleEndings,
  subjunctiveEndings, subjunctiveImperfectEndings,
} from './paradigms.js';
import { finalAccent, italianSpelling } from './orthography.js';
import { italianRules as R } from './rules.js';

type Finite = Extract<Cell, { kind: 'finite' }>;

const slotOf = (cell: Finite): Slot => `${cell.person}${cell.number === 'singular' ? 'sg' : 'pl'}` as Slot;
const indexOf = (slot: Slot): number => slots.indexOf(slot);
const keyOf = (cell: Finite): string => `${cell.mood}.${cell.tense}.${cell.person}.${cell.number}`;
/** io, tu, lui/lei and loro: the persons stressed on the stem in the present. */
const stemStressed = (slot: Slot): boolean => slot !== '1pl' && slot !== '2pl';
const finite = (mood: string, tense: string, from: Finite): Finite => ({ kind: 'finite', mood, tense, person: from.person, number: from.number });

// Stems.

/** The regular stem: the infinitive without -are/-ere/-ire, or the long stem of a shortened infinitive (fac-). */
function rootStem(lexeme: ItalianLexeme): Fork<string> {
  // compiere and adempiere are conjugated on comp-, ademp- like -ire verbs (Vocabolario: "le altre forme sono da compire").
  if (lexeme.entry?.long !== undefined && lexeme.entry.class !== 'contracted') return lexicalStems(lexeme, [lexeme.root]);
  return lexeme.entry?.class === 'contracted'
    ? one(lexeme.root, [step(R['it.stem.long'], lexeme.base, lexeme.root)])
    : one(lexeme.root, [step(R['it.stem.infinitive'], lexeme.base, lexeme.root, { ending: lexeme.conjugation })]);
}

/** Stems the lexicon gives for a form. */
function lexicalStems(lexeme: ItalianLexeme, stems: readonly string[]): Fork<string> {
  return stems.flatMap(stem => one(stem, [step(R['it.stem.lexical'], lexeme.base, stem)]));
}

/** The stem where the ending is stressed: the root, or the Vocabolario's two forms (cuoc-, coc-). */
function unstressedStems(lexeme: ItalianLexeme): Fork<string> {
  const listed = lexeme.entry?.unstressed;
  if (listed === undefined) return rootStem(lexeme);
  return listed.flatMap(stem => stem === '*' || stem === lexeme.root ? rootStem(lexeme) : lexicalStems(lexeme, [stem]));
}

/** A listed stem, or the regular stem a `*` (root) or `*isc` (-isc- stem) stands for. */
function listedStem(lexeme: ItalianLexeme, stem: string): Fork<string> {
  return stem === '*' ? rootStem(lexeme) : stem === '*isc' ? iscStem(lexeme) : lexicalStems(lexeme, [stem]);
}

function iscStem(lexeme: ItalianLexeme): Fork<string> {
  return chain(rootStem(lexeme), root => one(`${root}isc`, [step(R['it.stem.isc'], root, `${root}isc`)]));
}

/** The present indicative stems of a person (also those of the imperative of tu and voi). */
function presentStems(lexeme: ItalianLexeme, slot: Slot): Fork<string> {
  const listed = lexeme.entry?.present?.[slot];
  if (listed !== undefined) return listed.flatMap(stem => listedStem(lexeme, stem));
  if (!stemStressed(slot)) return unstressedStems(lexeme);
  return lexeme.isc === 'yes' ? iscStem(lexeme) : rootStem(lexeme);
}

/** The io form a present-subjunctive stem comes from (vengo, cucio). */
const ioForm = (lexeme: ItalianLexeme, stem: string): string => `${stem}${lexeme.palatal ? 'io' : 'o'}`;
/** The noi form a stem makes (dobbiamo, paiamo). */
const noiForm = (stem: string): string => `${stem}${stem.endsWith('i') ? 'amo' : 'iamo'}`;

/** The present subjunctive: from the stem of io, and in noi and voi from the stem of noi. */
function subjunctiveStems(lexeme: ItalianLexeme, slot: Slot): Fork<string> {
  const entry = lexeme.entry;
  if (!stemStressed(slot)) {
    const noi = entry?.present?.['1pl'];
    if (noi === undefined) return unstressedStems(lexeme);
    return noi.flatMap(stem => one(stem, [step(R['it.stem.subjunctive-from-1pl'], noiForm(stem), stem, { base: noiForm(stem) })]));
  }
  if (entry?.subjunctive !== undefined) return lexicalStems(lexeme, entry.subjunctive);
  const io = entry?.present?.['1sg'];
  if (io !== undefined) {
    return io.flatMap(stem => stem.startsWith('*') ? listedStem(lexeme, stem)
      : one(stem, [step(R['it.stem.subjunctive-from-1sg'], ioForm(lexeme, stem), stem, { base: ioForm(lexeme, stem) })]));
  }
  return lexeme.isc === 'yes' ? iscStem(lexeme) : rootStem(lexeme);
}

/** The passato remoto series of a verb, in order (grammar design §4.6): -ere has -etti and -ei, -ei only after t. */
function pastSeriesOf(lexeme: ItalianLexeme): readonly PastSeries[] {
  const entry = lexeme.entry;
  if (entry?.pastSeries !== undefined) return entry.pastSeries;
  if (entry?.past !== undefined) return entry.past.map(form => `=${form}` as const);
  if (lexeme.conjugation !== 'ere') return ['weak'];
  return lexeme.root.endsWith('t') ? ['ei'] : ['etti', 'ei'];
}

const strongStems = (lexeme: ItalianLexeme): string[] =>
  pastSeriesOf(lexeme).flatMap(item => item.startsWith('=') ? [item.slice(1, -1)] : []);

/** io, lui/lei and loro of the passato remoto: one stem per series, strong or the regular one, in the series' order. */
function pastStems(lexeme: ItalianLexeme, slot: Slot): Fork<string> {
  if (!stemStressed(slot) || slot === '2sg') return unstressedStems(lexeme);
  let weak = false;
  return pastSeriesOf(lexeme).flatMap(item => {
    if (item.startsWith('=')) {
      const stem = item.slice(1, -1);
      return one(stem, [step(R['it.stem.strong-past'], lexeme.base, stem)]);
    }
    if (weak) return [];
    weak = true;
    return unstressedStems(lexeme);
  });
}

/** The future and conditional stem: -are verbs keep the root (amerò), the others take the infinitive without -e. */
function futureStems(lexeme: ItalianLexeme): Fork<string> {
  const infinitive = lexeme.base.slice(0, -1);
  const listed = lexeme.entry?.future;
  if (listed !== undefined) {
    return listed.flatMap(stem => stem === infinitive || stem === '*' ? one(infinitive, [step(R['it.stem.future'], lexeme.base, infinitive)])
      : stem.length < infinitive.length ? one(stem, [step(R['it.stem.future-syncope'], lexeme.base, stem)])
        : lexicalStems(lexeme, [stem]));
  }
  if (lexeme.conjugation === 'are') return rootStem(lexeme);
  const unstressed = lexeme.entry?.unstressed;
  if (unstressed === undefined) return one(infinitive, [step(R['it.stem.future'], lexeme.base, infinitive)]);
  return unstressed.map(stem => stem === '*' ? lexeme.root : stem).flatMap(stem => `${stem}er` === infinitive
    ? one(infinitive, [step(R['it.stem.future'], lexeme.base, infinitive)]) : lexicalStems(lexeme, [`${stem}er`]));
}

/** The forms where a soft c needs its i: io and loro of the present, and the present subjunctive outside noi and voi. */
function palatalCell(cell: Finite): boolean {
  const slot = slotOf(cell);
  if (cell.tense !== 'present') return false;
  if (cell.mood === 'indicative') return slot === '1sg' || slot === '3pl';
  return cell.mood === 'subjunctive' && stemStressed(slot);
}

function palatalized(lexeme: ItalianLexeme, cell: Finite, stems: Fork<string>): Fork<string> {
  if (!lexeme.palatal || !palatalCell(cell)) return stems;
  return chain(stems, stem => stem.endsWith('c') ? one(`${stem}i`, [step(R['it.stem.palatal'], stem, `${stem}i`)]) : one(stem));
}

/** The stems of a cell (stage stem). */
export function stemOf(lexeme: ItalianLexeme, cell: Cell): Fork<string> {
  if (cell.kind === 'nonFinite') {
    const participle = lexeme.entry?.participle;
    if (cell.form === 'participle' && participle !== undefined) {
      // A participle with a sense of its own (riflettere: riflesso of light, riflettuto of thought) carries its condition.
      const tagged = (form: string, fork: Fork<string>): Fork<string> => {
        const condition = lexeme.entry?.conditions?.[form];
        return condition === undefined ? fork : fork.map(outcome => ({ ...outcome, tags: { ...outcome.tags, condition } }));
      };
      return participle.flatMap(form => form === '*' ? tagged(form, unstressedStems(lexeme))
        : tagged(form, one(form.slice(0, -1), [step(R['it.stem.strong-participle'], lexeme.base, form.slice(0, -1))])));
    }
    const gerundStem = lexeme.entry?.gerundStem;
    if ((cell.form === 'gerund' || cell.form === 'presentParticiple') && gerundStem !== undefined) return lexicalStems(lexeme, [gerundStem]);
    return unstressedStems(lexeme);
  }
  const slot = slotOf(cell);
  switch (`${cell.mood}.${cell.tense}`) {
    case 'indicative.present': case 'imperative.present': return palatalized(lexeme, cell, presentStems(lexeme, slot));
    case 'subjunctive.present': return palatalized(lexeme, cell, subjunctiveStems(lexeme, slot));
    case 'indicative.simple_past': return pastStems(lexeme, slot);
    case 'indicative.future': case 'conditional.present': return futureStems(lexeme);
    case 'indicative.imperfect': case 'subjunctive.imperfect': return unstressedStems(lexeme);
    default: throw new ConjugationError('GENERATION_FAILURE', `No Italian simple cell ${cell.mood}/${cell.tense}.`);
  }
}

// Endings.

function ending(rule: typeof R[keyof typeof R], stem: string, text: string): Fork<string> {
  return one(text, [step(rule, stem, stem + text, { ending: text })]);
}

/** io, lui/lei and loro of the passato remoto: the strong endings on a strong stem, otherwise each weak series. */
function pastEnding(lexeme: ItalianLexeme, slot: '1sg' | '3sg' | '3pl', stem: string): Fork<string> {
  if (strongStems(lexeme).includes(stem)) return ending(R['it.end.past-strong'], stem, pastStrongEndings[slot]);
  return pastSeriesOf(lexeme).flatMap(item => item === 'etti' ? ending(R['it.end.past-etti'], stem, pastEttiEndings[slot])
    : item === 'ei' ? ending(R['it.end.past'], stem, itemAt(pastEndings.ere, indexOf(slot)))
      : item === 'weak' ? ending(R['it.end.past'], stem, itemAt(pastEndings[lexeme.conjugation], indexOf(slot))) : []);
}

/** The ending added to one stem of a cell (stage ending). */
export function endingOf(lexeme: ItalianLexeme, cell: Cell, stem: string): Fork<string> {
  const conjugation = lexeme.conjugation;
  if (cell.kind === 'nonFinite') {
    if (cell.form === 'gerund') return ending(R['it.end.gerund'], stem, gerundEndings[conjugation]);
    if (cell.form === 'presentParticiple') return ending(R['it.end.present-participle'], stem, presentParticipleEndings[conjugation]);
    if (cell.form !== 'participle') throw new ConjugationError('GENERATION_FAILURE', `No Italian ending for the ${cell.form}.`);
    const agreement = cell.agreement;
    const vowel = agreement === undefined ? 'o' : agreementVowels[agreement.gender === 'feminine' ? 'feminine' : 'masculine'][agreement.number];
    const lexical = lexeme.entry?.participle?.some(form => form !== '*' && form.slice(0, -1) === stem) ?? false;
    return ending(R['it.end.participle'], stem, lexical ? vowel : participleStems[conjugation] + vowel);
  }
  const slot = slotOf(cell);
  const index = indexOf(slot);
  const lexicalFuture = lexeme.entry?.future !== undefined;
  switch (`${cell.mood}.${cell.tense}`) {
    case 'indicative.present': {
      const text = itemAt(presentEndings[conjugation], index);
      return one(text, [step(R['it.end.present'], stem, stem + text, {
        ending: text, person: { term: 'person', id: String(cell.person) }, number: { term: 'number', id: cell.number },
      })]);
    }
    case 'indicative.imperfect': return ending(R['it.end.imperfect'], stem, itemAt(imperfectEndings[conjugation], index));
    case 'indicative.simple_past':
      return slot === '1sg' || slot === '3sg' || slot === '3pl' ? pastEnding(lexeme, slot, stem) : ending(R['it.end.past'], stem, itemAt(pastEndings[conjugation], index));
    case 'indicative.future':
      return conjugation === 'are' && !lexicalFuture ? ending(R['it.end.future-ar-er'], stem, itemAt(futureAreEndings, index))
        : ending(R['it.end.future'], stem, itemAt(futureEndings, index));
    case 'conditional.present':
      return conjugation === 'are' && !lexicalFuture ? ending(R['it.end.future-ar-er'], stem, itemAt(conditionalAreEndings, index))
        : ending(R['it.end.conditional'], stem, itemAt(conditionalEndings, index));
    case 'subjunctive.present': {
      const set = conjugation === 'are' && stem === lexeme.root ? subjunctiveEndings.are : subjunctiveEndings.other;
      return ending(R['it.end.subjunctive-present'], stem, itemAt(set, index));
    }
    case 'subjunctive.imperfect': return ending(R['it.end.subjunctive-imperfect'], stem, itemAt(subjunctiveImperfectEndings[conjugation], index));
    case 'imperative.present': {
      if (slot !== '2sg' && slot !== '2pl') throw new ConjugationError('GENERATION_FAILURE', `The Italian imperative of ${slot} comes from the subjunctive.`);
      return ending(R['it.end.imperative'], stem, imperativeEndings[conjugation][slot]);
    }
    default: throw new ConjugationError('GENERATION_FAILURE', `No Italian ending for ${cell.mood}/${cell.tense}.`);
  }
}

// Whole words.

/** The lexicon's words for a cell; a derived verb puts its prefix before them, with the written accent rule. */
function lexicalWords(lexeme: ItalianLexeme, forms: readonly WholeForm[]): Fork<string> {
  return forms.flatMap(({ text, usage }): Outcome<string>[] => {
    const tags = usage === undefined ? {} : { usage };
    const lexical = step(R['it.cell.lexical'], null, text);
    if (lexeme.family === null) return [{ value: text, steps: [lexical], tags }];
    // A derived verb's word is its prefix before the base's irregular word (ri + fai), then the written accent (rifà).
    const { prefix, base } = lexeme.family;
    const prefixed = step(R['it.cell.prefix'], text, prefix + text, { prefix, base });
    return applyJunctureRules([finalAccent], { stem: prefix, ending: text }, { lexeme, cell: { kind: 'nonFinite', form: 'infinitive' } })
      .map(outcome => ({ value: outcome.value.stem + outcome.value.ending, steps: [lexical, prefixed, ...outcome.steps], tags }));
  });
}

/**
 * The regular -are forms some derived verbs of fare also have in the present (soddisfo, soddisfi; disfino): the
 * Vocabolario prints them beside the forms of fare. Null for any other cell.
 */
function regularAreWords(lexeme: ItalianLexeme, cell: Finite): Fork<string> | null {
  const slots = cell.mood === 'indicative' || cell.mood === 'subjunctive' ? lexeme.entry?.regularAre?.[cell.mood] : undefined;
  if (cell.tense !== 'present' || slots === undefined || !slots.includes(slotOf(cell))) return null;
  const asAre: ItalianLexeme = { ...lexeme, conjugation: 'are', root: lexeme.base.slice(0, -3), entry: null, family: null, isc: 'no' };
  return derived(asAre, cell);
}

/** A cell derived by stem, ending and spelling rules. */
function derived(lexeme: ItalianLexeme, cell: Cell): Fork<string> {
  return chain(stemOf(lexeme, cell), stem => chain(endingOf(lexeme, cell, stem), end =>
    chain(applyJunctureRules(italianSpelling, { stem, ending: end }, { lexeme, cell }), spelled => one(spelled.stem + spelled.ending))));
}

/** One word of a cell: the whole word if the lexicon has it, otherwise stem, ending and spelling rules. */
export function wordOf(lexeme: ItalianLexeme, cell: Cell): Fork<string> {
  return wholeCell(lexeme, cell) ?? derived(lexeme, cell);
}

/** Lei, noi and Loro (and voi of essere, avere, sapere, volere): the imperative is the present subjunctive. */
function fromSubjunctive(lexeme: ItalianLexeme, cell: Finite): Fork<string> {
  return wordOf(lexeme, finite('subjunctive', 'present', cell)).map(outcome => ({
    ...outcome, steps: [...outcome.steps, step(R['it.end.imperative-subjunctive'], null, outcome.value)],
  }));
}

/**
 * Whole words: the infinitive, a lexical present participle, the lexicon's cells, the imperative persons that are
 * subjunctive forms, and an imperative voi that is a lexical present (fate, dite). Null: derive by stem and ending.
 */
export function wholeCell(lexeme: ItalianLexeme, cell: Cell): Fork<string> | null {
  const entry = lexeme.entry;
  if (cell.kind === 'nonFinite') {
    if (cell.form === 'infinitive') return one(lexeme.base, [step(R['it.end.infinitive'], null, lexeme.base)]);
    const listed = entry?.presentParticiple;
    if (cell.form === 'presentParticiple' && listed) {
      // A derived verb's list is already moved onto it (proveniente), so no prefix is added here.
      return listed.flatMap(text => {
        if (text === '*') return chain(unstressedStems(lexeme), stem => chain(endingOf(lexeme, cell, stem), end => one(stem + end)));
        const usage = entry?.usage?.[text];
        const condition = entry?.conditions?.[text];
        return one(text, [step(R['it.cell.lexical'], null, text)], { ...(usage === undefined ? {} : { usage }), ...(condition === undefined ? {} : { condition }) });
      });
    }
    return null;
  }
  const cells = entry?.cells;
  const own = cells?.[keyOf(cell)];
  const regular = regularAreWords(lexeme, cell);
  if (regular !== null) return [...(own === undefined ? derived(lexeme, cell) : lexicalWords(lexeme, own)), ...regular];
  if (own !== undefined) return lexicalWords(lexeme, own);
  if (cell.mood !== 'imperative') return null;
  const slot = slotOf(cell);
  if (slot === '2sg') return null;
  if (slot !== '2pl') return fromSubjunctive(lexeme, cell);
  if (entry?.flags?.includes('imperative2plSubjunctive')) return fromSubjunctive(lexeme, cell);
  const present = cells?.['indicative.present.2.plural'];
  return present === undefined ? null : lexicalWords(lexeme, present);
}
