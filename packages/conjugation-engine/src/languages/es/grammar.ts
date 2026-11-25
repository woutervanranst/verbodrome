import type { Cell, StagedGrammar } from '../../core/staged.js';
import { validateGrammar } from '../../core/staged.js';
import { classifySpanish, spanishLexemeOf } from './classify.js';
import type { SpanishLexeme } from './classify.js';
import { spanishClause } from './clause.js';
import { spanishOrthography } from './orthography.js';
import { endingFork, lexicalCell, stemFork } from './stems.js';

export type { SpanishLexeme } from './classify.js';

/** The tenses that are one word, by mood; every other finite tense is a periphrasis. */
const simpleTenses: Readonly<Record<string, readonly string[]>> = {
  indicative: ['present', 'imperfect', 'simple_past', 'future'],
  conditional: ['present'],
  subjunctive: ['present', 'imperfect', 'future'],
  imperative: ['present'],
};

/** The Spanish staged grammar. */
export const spanishGrammar: StagedGrammar<SpanishLexeme> = {
  classify: classifySpanish,
  lexemeOf: spanishLexemeOf,
  cellOf(target): Cell | null {
    if (target.person === null || target.number === null) return null;
    if (!(simpleTenses[target.mood]?.includes(target.tense) ?? false)) return null;
    return { kind: 'finite', mood: target.mood, tense: target.tense, person: target.person, number: target.number };
  },
  availability: () => null,
  cell: lexicalCell,
  stem: stemFork,
  ending: endingFork,
  orthography: spanishOrthography,
  periphrases: [],
  clause: spanishClause,
};
validateGrammar(spanishGrammar);
