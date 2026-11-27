/**
 * German endings (GD §4.3): the ending sets as data, and which one a cell takes. Spelling at the boundary (schwa,
 * contraction, the sibilant rule) is left to `orthography.ts`.
 */
import { step } from '../../core/derivation.js';
import { one } from '../../core/fork.js';
import type { Fork } from '../../core/fork.js';
import type { Cell } from '../../core/staged.js';
import { ConjugationError } from '../../errors.js';
import type { GermanLexeme } from './classify.js';
import { shortSubjunctive } from './lexicon.js';
import { germanRules as rules } from './rules.js';
import { indexOf, isElEr, participleParts, presentStem, preteriteStems, takesWeakPreterite } from './stems.js';
import type { FiniteCell } from './stems.js';

/** Person order 1sg 2sg 3sg 1pl 2pl 3pl. */
export const endingSets = {
  present: ['e', 'st', 't', 'en', 't', 'en'],
  /** Preterite-present verbs, singular: no ending in the ich and er forms. */
  preteritePresent: ['', 'st', ''],
  /** -te and the personal ending. */
  preteriteWeak: ['te', 'test', 'te', 'ten', 'tet', 'ten'],
  preteriteStrong: ['', 'st', '', 'en', 't', 'en'],
  subjunctiveI: ['e', 'est', 'e', 'en', 'et', 'en'],
  subjunctiveII: ['e', 'est', 'e', 'en', 'et', 'en'],
} as const satisfies Record<string, readonly string[]>;

const at = (set: readonly string[], index: number): string => set[index]!;

const add = (rule: keyof typeof rules, stem: string, ending: string, params: Parameters<typeof step>[3] = {}): Fork<string> =>
  one(ending, [step(rules[rule], stem, stem + ending, params)]);

/** The obstruent + nasal stems (atm, rechn, öffn) whose du-imperative needs -e. */
const obstruentNasal = /(?:[bdfgkpstvxzß]|ch|m)n$|(?:[bdfgkpstvxzß]|ch)m$/u;

function nonFinite(lexeme: GermanLexeme, form: string, stem: string): Fork<string> {
  if (form === 'infinitive') return add('de.end.infinitive', stem, lexeme.base.slice(stem.length));
  if (form === 'presentParticiple') return add('de.end.present-participle', stem, 'end');
  if (form !== 'pastParticiple') throw new ConjugationError('GENERATION_FAILURE', `German has no non-finite form ${form}.`);
  const parts = participleParts(lexeme).filter(item => item.stem === stem);
  if (!parts.length) throw new ConjugationError('GENERATION_FAILURE', `${stem} is not a Partizip II stem of ${lexeme.lemma}.`);
  return parts.flatMap(part => add(part.ending === 't' ? 'de.end.participle-weak' : 'de.end.participle-strong', stem, part.ending)
    .map(outcome => ({ ...outcome, tags: part.tags })));
}

/** The strong Präteritum: after s, ß, z, x, d or t the du-form has -est first and -st second (DWDS, Duden). */
function strongPreterite(cell: FiniteCell, stem: string): Fork<string> {
  const index = indexOf(cell);
  if (index === 1 && /[sßzxdt]$/u.test(stem)) {
    return [
      ...one('est', [step(rules['de.end.preterite-2sg'], stem, `${stem}est`)]),
      ...one('st', [step(rules['de.end.preterite-2sg'], stem, `${stem}st`)], { pattern: 'short' }),
    ];
  }
  const ending = at(endingSets.preteriteStrong, index);
  return add('de.end.preterite-strong', stem, ending, { ending });
}

/** Konjunktiv II of a non-weak stem; the du and ihr forms of an umlauted stem may drop the e (kämst, wärt). */
function subjunctiveII(lexeme: GermanLexeme, cell: FiniteCell, stem: string): Fork<string> {
  const index = indexOf(cell);
  const ending = at(endingSets.subjunctiveII, index);
  const full = add('de.end.subjunctive-ii', stem, ending, { ending });
  const preterites = lexeme.entry === null ? [] : preteriteStems(lexeme).map(item => item.stem.text);
  const printed = Object.hasOwn(shortSubjunctive, lexeme.root) ? shortSubjunctive[lexeme.root] : undefined;
  const shortens = printed !== undefined && (index === 1 || index === 4) && !preterites.includes(stem) && !/(?:[dt]|(?:[bdfgkpstvxzß]|ch)[mn]|[sßzx])$/u.test(stem);
  if (!shortens) return full;
  const short = ending.slice(1);
  const steps = [step(rules['de.end.subjunctive-ii-short'], stem, stem + short), ...(printed === 'duden' ? [step(rules['de.stem.duden-only'], stem, stem + short)] : [])];
  return [...full, ...one(short, steps, { pattern: 'short' })];
}

/** The du-imperative: an i-stem bare; -e after obstruent + nasal, -el/-er and d/t; otherwise bare, then -e (long). */
function imperativeSingular(lexeme: GermanLexeme, stem: string): Fork<string> {
  const present = presentStem(lexeme.base);
  const bare = add('de.end.imperative-singular', stem, '', { ending: '' });
  const withE = add('de.end.imperative-singular', stem, 'e', { ending: 'e' });
  // An i-stem, and a stem in -ie (knie: kniee would contract to knie again), take no -e.
  if (stem !== present || stem.endsWith('ie')) return bare;
  if (obstruentNasal.test(stem) || isElEr(lexeme.base) || /[dt]$/u.test(stem)) return withE;
  return [...bare, ...withE.map(outcome => ({ ...outcome, tags: { pattern: 'long' } }))];
}

/** The ending a stem takes in a cell. */
export function germanEnding(lexeme: GermanLexeme, cell: Cell, stem: string): Fork<string> {
  if (cell.kind === 'nonFinite') return nonFinite(lexeme, cell.form, stem);
  const index = indexOf(cell);
  const key = `${cell.mood}.${cell.tense}`;
  switch (key) {
    case 'indicative.present': {
      if (lexeme.conjugation === 'preteritePresent' && cell.number === 'singular') {
        const ending = at(endingSets.preteritePresent, index);
        return add('de.end.preterite-present', stem, ending, { ending });
      }
      const ending = at(endingSets.present, index);
      return add('de.end.present', stem, ending, {
        ending, person: { term: 'person', id: String(cell.person) }, number: { term: 'number', id: cell.number },
      });
    }
    case 'subjunctive.present': {
      const ending = at(endingSets.subjunctiveI, index);
      return add('de.end.subjunctive-i', stem, ending, { ending });
    }
    case 'indicative.past': {
      if (!takesWeakPreterite(lexeme, stem)) return strongPreterite(cell, stem);
      const ending = at(endingSets.preteriteWeak, index);
      return add('de.end.preterite-weak', stem, ending, { ending });
    }
    case 'subjunctive.past': {
      const listedSubjunctive = lexeme.entry?.subjunctive !== undefined;
      if (!listedSubjunctive && takesWeakPreterite(lexeme, stem)) {
        const ending = at(endingSets.preteriteWeak, index);
        return add('de.end.preterite-weak', stem, ending, { ending });
      }
      return subjunctiveII(lexeme, cell, stem);
    }
    case 'imperative.present': {
      if (index === 1) return imperativeSingular(lexeme, stem);
      if (index === 4) return add('de.end.imperative-plural', stem, 't');
      return add('de.end.imperative-polite', stem, 'en');
    }
    default:
      throw new ConjugationError('GENERATION_FAILURE', `German has no simple cell ${key}.`);
  }
}
