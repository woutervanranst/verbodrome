import type { StagedGrammar } from '../../core/staged.js';
import { validateGrammar } from '../../core/staged.js';
import { ConjugationError } from '../../errors.js';
import { classifySpanish, spanishLexemeOf } from './classify.js';
import type { SpanishLexeme } from './classify.js';

export type { SpanishLexeme } from './classify.js';

const notBuilt = (hook: string): never => {
  throw new ConjugationError('GENERATION_FAILURE', `Spanish ${hook} is not built yet.`);
};

/** The Spanish staged grammar. */
export const spanishGrammar: StagedGrammar<SpanishLexeme> = {
  classify: classifySpanish,
  lexemeOf: spanishLexemeOf,
  cellOf: () => notBuilt('cellOf'),
  availability: () => notBuilt('availability'),
  stem: () => notBuilt('stem'),
  ending: () => notBuilt('ending'),
  orthography: [],
  periphrases: [],
  clause: {
    agreements: () => notBuilt('agreements'),
    assemble: () => notBuilt('assemble'),
  },
};
validateGrammar(spanishGrammar);
