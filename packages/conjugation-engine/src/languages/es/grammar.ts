import type { LexemeBase, StagedGrammar } from '../../core/staged.js';
import { validateGrammar } from '../../core/staged.js';
import { ConjugationError } from '../../errors.js';

/** Declared with the lexicon (Task 2); the skeleton grammar knows only the base. */
export type SpanishLexeme = LexemeBase;

const notBuilt = (hook: string): never => {
  throw new ConjugationError('GENERATION_FAILURE', `Spanish ${hook} is not built yet.`);
};

/** The Spanish staged grammar. */
export const spanishGrammar: StagedGrammar<SpanishLexeme> = {
  classify: () => notBuilt('classify'),
  lexemeOf: () => notBuilt('lexemeOf'),
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
