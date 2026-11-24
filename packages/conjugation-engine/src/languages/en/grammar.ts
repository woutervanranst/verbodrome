import { synthesize, validateGrammar } from '../../core/staged.js';
import type { Cell, StagedGrammar } from '../../core/staged.js';
import type { ResolvedTarget } from '../../types.js';
import { classifyEnglish, englishLexemeOf } from './classify.js';
import type { EnglishLexeme } from './classify.js';
import { englishClause } from './clause.js';
import { englishOrthography } from './orthography.js';
import { englishEnding } from './paradigms.js';
import { englishPeriphrases } from './periphrasis.js';
import { listedCell, stemOf } from './stems.js';

/** The same verb as a regular verb: what the -ed alternate of a listed cell is derived from. */
function asRegular(lexeme: EnglishLexeme): EnglishLexeme {
  return { ...lexeme, classId: 'regular', past: [], participle: [] };
}

/**
 * The simple cell of a target: the present and past of the indicative and the subjunctive, the 2nd person imperative,
 * and the two participles (non-finite forms `presentParticiple`, `pastParticiple`; chains also use `plain`). Every other
 * target is a periphrasis, the 1st person plural imperative (let's) and the to-infinitive included.
 */
function cellOf(target: ResolvedTarget, _lexeme: EnglishLexeme): Cell | null {
  const { mood, tense, person, number } = target;
  if (mood === 'participle') return { kind: 'nonFinite', form: tense === 'present' ? 'presentParticiple' : 'pastParticiple' };
  if (person === null || number === null) return null;
  if ((mood === 'indicative' || mood === 'subjunctive') && (tense === 'present' || tense === 'past')) {
    return { kind: 'finite', mood, tense, person, number };
  }
  if (mood === 'imperative' && person === 2) return { kind: 'finite', mood, tense: 'present', person, number };
  return null;
}

export const englishGrammar: StagedGrammar<EnglishLexeme> = {
  classify: classifyEnglish,
  lexemeOf: englishLexemeOf,
  cellOf,
  /** No English verb in scope is defective: modal verbs are rejected at classification instead (design D7). */
  availability: () => null,
  cell: (lexeme, cell) => listedCell(lexeme, cell, regularCell => synthesize(englishGrammar, asRegular(lexeme), regularCell)),
  stem: stemOf,
  ending: englishEnding,
  orthography: englishOrthography,
  periphrases: englishPeriphrases,
  clause: englishClause,
};
validateGrammar(englishGrammar);
