import { validateGrammar } from '../../core/staged.js';
import type { Cell, StagedGrammar } from '../../core/staged.js';
import type { ResolvedTarget } from '../../types.js';
import { classifyItalian, lexemeOfItalian } from './classify.js';
import { italianClause } from './clause.js';
import type { ItalianLexeme } from './lexicon.js';
import { italianSpelling } from './orthography.js';
import { endingOf, stemOf, wholeCell } from './stems.js';

/** The non-finite targets that are one word, and their cells. */
const nonFiniteCells: Readonly<Record<string, string>> = {
  'infinitive.present': 'infinitive', 'gerund.present': 'gerund', 'participle.present': 'presentParticiple', 'participle.past': 'participle',
};

/** The simple finite tenses; every other finite tense is a compound (grammar design §6.1). */
const simpleTenses: ReadonlySet<string> = new Set([
  'indicative.present', 'indicative.imperfect', 'indicative.simple_past', 'indicative.future', 'subjunctive.present', 'subjunctive.imperfect',
  'conditional.present', 'imperative.present',
]);

/**
 * The cell a target maps to: a simple tense to its own cell, the negative imperative of tu to the infinitive and its
 * other persons to the imperative, the one-word non-finite forms to their cells; a compound tense to none.
 */
export function cellOfItalian(target: ResolvedTarget, _lexeme: ItalianLexeme): Cell | null {
  const key = `${target.mood}.${target.tense}`;
  if (Object.hasOwn(nonFiniteCells, key)) return { kind: 'nonFinite', form: nonFiniteCells[key]! };
  if (target.person === null || target.number === null) return null;
  if (key === 'imperative.negative') {
    return target.person === 2 && target.number === 'singular'
      ? { kind: 'nonFinite', form: 'infinitive' }
      : { kind: 'finite', mood: 'imperative', tense: 'present', person: target.person, number: target.number };
  }
  if (!simpleTenses.has(key)) return null;
  return { kind: 'finite', mood: target.mood, tense: target.tense, person: target.person, number: target.number };
}

export const italianGrammar: StagedGrammar<ItalianLexeme> = {
  classify: classifyItalian,
  lexemeOf: lexemeOfItalian,
  cellOf: cellOfItalian,
  availability: () => null,
  cell: wholeCell,
  stem: stemOf,
  ending: endingOf,
  orthography: italianSpelling,
  periphrases: [],
  clause: italianClause,
};
validateGrammar(italianGrammar);
