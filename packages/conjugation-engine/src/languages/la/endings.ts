/**
 * The ending of a Latin cell on one stem (GD §4.3): the ending set of the stem class (`paradigms.ts`), the rule that
 * names it, and the tagged second outcomes (literary -re and -ēre, the short imperative).
 */
import { step } from '../../core/derivation.js';
import type { DerivationStep } from '../../core/derivation.js';
import { one } from '../../core/fork.js';
import type { Fork } from '../../core/fork.js';
import type { Cell } from '../../core/staged.js';
import { ConjugationError } from '../../errors.js';
import type { LatinLexeme } from './lexicon.js';
import { citation, declineNs, declineUs, usEnding } from './declension.js';
import { endingsFor, infinitiveEnding, isPerfectTense, optativeEndings, passiveReVariant, perfectEndings } from './paradigms.js';
import type { EndingColumn } from './paradigms.js';
import { latinRules } from './rules.js';

type FiniteCell = Extract<Cell, { kind: 'finite' }>;

/** The slot of a finite cell in its ending list: six persons, or the imperative's own slots. */
function slotOf(cell: FiniteCell): number {
  if (cell.mood === 'imperative') {
    if (cell.tense === 'present') return cell.number === 'singular' ? 0 : 1;
    return (cell.number === 'singular' ? 0 : 2) + cell.person - 2;
  }
  return (cell.number === 'plural' ? 3 : 0) + cell.person - 1;
}

/** The ending column of a lexeme in a tense: eō and queō take the first-conjugation imperfect and future indicative (ībam, ībō). */
export function columnOf(lexeme: LatinLexeme, mood: string, tense: string): EndingColumn {
  if (lexeme.flags.has('eoRoot') && mood === 'indicative' && (tense === 'imperfect' || tense === 'future')) return 'a';
  switch (lexeme.stemClass) {
    case 'a': return 'a';
    case 'e': return 'e';
    case 'i': return 'i';
    default: return 'c';
  }
}

const perfectRules = {
  'indicative.perfect': 'la.end.perfect',
  'indicative.pluperfect': 'la.end.pluperfect',
  'indicative.future_perfect': 'la.end.future-perfect',
  'subjunctive.perfect': 'la.end.perfect-subjunctive',
  'subjunctive.pluperfect': 'la.end.pluperfect-subjunctive',
} as const;

/** The step of a present-system ending under the rule of its cell. */
function presentStep(cell: FiniteCell, column: EndingColumn, stem: string, ending: string): DerivationStep {
  const after = stem + ending;
  const text = { ending };
  switch (`${cell.mood}.${cell.tense}`) {
    case 'indicative.present':
      return column === 'c' || (column === 'i' && cell.person === 3 && cell.number === 'plural')
        ? step(latinRules['la.end.thematic'], stem, after, text)
        : step(latinRules['la.end.personal'], stem, after, {
          ending, person: { term: 'person', id: String(cell.person) }, number: { term: 'number', id: cell.number },
          voice: { term: 'voice', id: cell.voice ?? 'active' },
        });
    case 'indicative.imperfect': return step(latinRules['la.end.imperfect'], stem, after, text);
    case 'indicative.future': return step(latinRules[column === 'a' || column === 'e' ? 'la.end.future-b' : 'la.end.future-e'], stem, after, text);
    case 'subjunctive.present': return step(latinRules['la.end.subjunctive'], stem, after, text);
    case 'subjunctive.imperfect': return step(latinRules['la.end.imperfect-subjunctive'], stem, after, text);
    default: return step(latinRules['la.end.imperative'], stem, after, { ending: ending || '-', tense: { term: 'tense', id: cell.tense } });
  }
}

/** The literary -re beside a second singular passive in -ris (A&G p. 94: amāris (-re)). */
function withReVariant(cell: FiniteCell, stem: string, ending: string, steps: DerivationStep[]): Fork<string> {
  const standard = one(ending, steps);
  const literary = cell.voice === 'passive' && cell.person === 2 && cell.number === 'singular' && cell.mood !== 'imperative'
    ? passiveReVariant(ending) : null;
  if (literary === null) return standard;
  return [...standard, ...one(literary, [...steps, step(latinRules['la.end.re'], stem + ending, stem + literary)], { usage: 'literary', pattern: 're' })];
}

/** The ending of a finite cell of the present system on `stem`. */
function presentEnding(lexeme: LatinLexeme, cell: FiniteCell, stem: string): Fork<string> {
  const slot = slotOf(cell);
  const key = `${cell.mood}.${cell.tense}.${cell.voice ?? 'active'}`;
  if (cell.mood === 'subjunctive' && cell.tense === 'present' && lexeme.stems.optative === stem) {
    const ending = optativeEndings[slot]!;
    return one(ending, [step(latinRules['la.end.optative'], stem, stem + ending, { ending })]);
  }
  const column = columnOf(lexeme, cell.mood, cell.tense);
  if (lexeme.flags.has('athematic')) {
    // ferō: an ending of the long-stem column that starts with s, t or r goes straight on the root (A&G §200 fn. 3).
    const long = endingsFor('i', key)[slot]!;
    if (/^[str]/u.test(long)) return withReVariant(cell, stem, long, [step(latinRules['la.end.athematic'], stem, stem + long)]);
  }
  const ending = endingsFor(lexeme.flags.has('athematic') ? 'c' : column, key)[slot]!;
  if (ending === 'x') return [];
  const steps = [presentStep(cell, lexeme.flags.has('athematic') ? 'c' : column, stem, ending)];
  if (cell.mood === 'imperative' && cell.tense === 'present' && cell.voice === undefined && slot === 0
    && lexeme.flags.has('shortImperative') && !lexeme.weakened) {
    // dīc, dūc, fac, fer and their compounds, but not the compounds in -ficiō (A&G §182).
    return one('', [...steps, step(latinRules['la.end.short-imperative'], lexeme.lemma, null)]);
  }
  return withReVariant(cell, stem, ending, steps);
}

/** The ending of a finite cell of the perfect system: one set for every verb, -ēre beside -ērunt. */
function perfectEnding(cell: FiniteCell, stem: string): Fork<string> {
  const tenseKey = `${cell.mood}.${cell.tense}` as keyof typeof perfectRules;
  const ending = perfectEndings(tenseKey)[slotOf(cell)]!;
  const steps = [step(latinRules[perfectRules[tenseKey]], stem, stem + ending, { ending })];
  const standard = one(ending, steps);
  if (ending !== 'ērunt') return standard;
  return [...standard, ...one('ēre', [...steps, step(latinRules['la.end.ere'], stem + ending, `${stem}ēre`)], { usage: 'literary', pattern: 'ēre' })];
}

/** The `ending` hook for finite cells. */
export function finiteEnding(lexeme: LatinLexeme, cell: FiniteCell, stem: string): Fork<string> {
  return isPerfectTense(cell.mood, cell.tense) ? perfectEnding(cell, stem) : presentEnding(lexeme, cell, stem);
}

type NonFiniteCell = Extract<Cell, { kind: 'nonFinite' }>;

const gerundCases: Readonly<Record<string, string>> = { genitive: 'ī', dative: 'ō', accusative: 'um', ablative: 'ō' };

/** -und- beside -end- in the gerund and gerundive of the third and fourth conjugations, dated (A&G §179 fn. 2). */
function withUndus(main: Fork<string>, undus: Fork<string>): Fork<string> {
  return [...main, ...undus.map(outcome => ({ ...outcome, tags: { ...outcome.tags, usage: 'dated' as const, pattern: 'undus' } }))];
}

/** The `ending` hook for non-finite cells: infinitives, participles (declined by their agreement), gerund and supine. */
export function nonFiniteEnding(lexeme: LatinLexeme, cell: NonFiniteCell, stem: string): Fork<string> {
  const column = columnOf(lexeme, 'infinitive', 'present');
  const vowel = column === 'a' || column === 'e' ? '' : 'e';
  const agreement = cell.agreement;
  switch (cell.form) {
    case 'presentInfinitive': case 'presentInfinitivePassive': {
      const passive = cell.form === 'presentInfinitivePassive';
      if (lexeme.flags.has('athematic')) {
        const long = infinitiveEnding('i', passive);
        return one(long, [step(latinRules['la.end.athematic'], stem, stem + long)]);
      }
      const ending = infinitiveEnding(column, passive);
      return one(ending, [step(latinRules['la.end.infinitive'], stem, stem + ending, { ending, tense: { term: 'tense', id: 'present' } })]);
    }
    case 'perfectInfinitive':
      return one('isse', [step(latinRules['la.end.infinitive'], stem, `${stem}isse`, { ending: 'isse', tense: { term: 'tense', id: 'perfect' } })]);
    case 'presentParticiple': {
      const oblique = stem === lexeme.stems.presentParticipleOblique;
      return declineNs(stem, vowel, agreement, oblique);
    }
    case 'perfectParticiple':
      return declineUs(stem, '', agreement, [step(latinRules['la.end.perfect-participle'], stem, `${stem}us`)]);
    case 'futureParticiple':
      return declineUs(stem, 'ūr', agreement, [step(latinRules['la.end.future-participle'], stem, `${stem}ūrus`)]);
    case 'gerundive': {
      if (stem === lexeme.stems.gerund) {
        const ending = usEnding(agreement ?? citation);
        return one(ending, [step(latinRules['la.end.gerundive'], stem, stem + ending, { ending })]);
      }
      const nd = `${vowel}nd`;
      const main = declineUs(stem, nd, agreement, [step(latinRules['la.end.gerundive'], stem, `${stem}${nd}us`, { ending: `${nd}us` })]);
      if (vowel === '') return main;
      return withUndus(main, declineUs(stem, 'und', agreement, [
        step(latinRules['la.end.gerundive'], stem, `${stem}${nd}us`, { ending: `${nd}us` }), step(latinRules['la.end.undus'], `${stem}${nd}us`, `${stem}undus`),
      ]));
    }
    case 'gerund': {
      const caseEnding = gerundCases[agreement?.case ?? 'genitive'] ?? 'ī';
      if (stem === lexeme.stems.gerund) return one(caseEnding, [step(latinRules['la.end.gerund'], stem, stem + caseEnding, { ending: caseEnding })]);
      const ending = `${vowel}nd${caseEnding}`;
      const main = one(ending, [step(latinRules['la.end.gerund'], stem, stem + ending, { ending })]);
      if (vowel === '') return main;
      return withUndus(main, one(`und${caseEnding}`, [
        step(latinRules['la.end.gerund'], stem, stem + ending, { ending }), step(latinRules['la.end.undus'], stem + ending, `${stem}und${caseEnding}`),
      ]));
    }
    case 'supine': {
      const ending = agreement?.case === 'ablative' ? 'ū' : 'um';
      return one(ending, [step(latinRules['la.end.supine'], stem, stem + ending, { ending })]);
    }
    default:
      throw new ConjugationError('GENERATION_FAILURE', `Latin has no non-finite form ${cell.form} to derive; it must be a listed cell.`);
  }
}
