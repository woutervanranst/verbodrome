import { ConjugationError } from '../../errors.js';
import type { StagedGrammar } from '../../core/staged.js';
import { classifyEnglish, englishLexemeOf } from './classify.js';
import type { EnglishLexeme } from './classify.js';

function notBuilt(): never {
  throw new ConjugationError('GENERATION_FAILURE', 'The English pack is not built yet.');
}

/** The English grammar; its stages are filled in task by task. */
export const englishGrammar: StagedGrammar<EnglishLexeme> = {
  classify: classifyEnglish,
  lexemeOf: englishLexemeOf,
  cellOf: notBuilt,
  availability: () => null,
  stem: notBuilt,
  ending: notBuilt,
  orthography: [],
  periphrases: [],
  clause: { agreements: notBuilt, assemble: notBuilt },
};
