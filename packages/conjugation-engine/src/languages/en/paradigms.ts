/**
 * The English endings (design §4.3): ∅, -s, -ed and -ing on the plain form. Listed cells (stems.ts) bypass them.
 */
import { step } from '../../core/derivation.js';
import { one } from '../../core/fork.js';
import type { Fork } from '../../core/fork.js';
import type { Cell } from '../../core/staged.js';
import { ConjugationError } from '../../errors.js';
import type { EnglishLexeme } from './classify.js';
import { englishRules } from './rules.js';

const rules = englishRules;

/** The ending of one cell on `stem`, with the step that adds it. */
export function englishEnding(_lexeme: EnglishLexeme, cell: Cell, stem: string): Fork<string> {
  if (cell.kind === 'nonFinite') {
    if (cell.form === 'plain') return one('', [step(rules['en.end.plain-form'], stem, stem)]);
    if (cell.form === 'presentParticiple') return one('ing', [step(rules['en.end.ing'], stem, `${stem}ing`)]);
    if (cell.form === 'pastParticiple') return one('ed', [step(rules['en.end.participle-ed'], stem, `${stem}ed`)]);
    throw new ConjugationError('GENERATION_FAILURE', `English has no non-finite form ${cell.form}.`);
  }
  const { mood, tense, person, number } = cell;
  if (mood === 'indicative' && tense === 'present') {
    if (person === 3 && number === 'singular') return one('s', [step(rules['en.end.third-s'], stem, `${stem}s`)]);
    return one('', [step(rules['en.end.present-plain'], stem, stem, {
      person: { term: 'person', id: String(person) }, number: { term: 'number', id: number },
    })]);
  }
  if (mood === 'indicative' && tense === 'past') return one('ed', [step(rules['en.end.past-ed'], stem, `${stem}ed`)]);
  if (mood === 'subjunctive' && tense === 'present') return one('', [step(rules['en.end.subjunctive-plain'], stem, stem)]);
  if (mood === 'subjunctive' && tense === 'past') {
    return one('ed', [step(rules['en.end.irrealis-past'], null, null), step(rules['en.end.past-ed'], stem, `${stem}ed`)]);
  }
  if (mood === 'imperative' && tense === 'present') return one('', [step(rules['en.end.imperative-plain'], stem, stem)]);
  throw new ConjugationError('GENERATION_FAILURE', `English has no simple ${mood} ${tense}.`);
}
