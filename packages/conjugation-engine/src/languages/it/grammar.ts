import type { ClauseGrammar } from '../../core/clause.js';
import { validateGrammar } from '../../core/staged.js';
import type { StagedGrammar } from '../../core/staged.js';
import { ConjugationError } from '../../errors.js';
import type { ItalianLexeme } from './lexicon.js';

function notBuilt(stage: string): never {
  throw new ConjugationError('GENERATION_FAILURE', `Italian ${stage} is not built yet.`);
}

const clause: ClauseGrammar<ItalianLexeme> = {
  agreements: () => notBuilt('agreement'),
  assemble: () => notBuilt('clause'),
};

/** The Italian grammar; its stages are filled in by the pack's later tasks. */
export const italianGrammar: StagedGrammar<ItalianLexeme> = {
  classify: () => notBuilt('classification'),
  lexemeOf: () => notBuilt('classification'),
  cellOf: () => notBuilt('cell selection'),
  availability: () => notBuilt('availability'),
  stem: () => notBuilt('stem formation'),
  ending: () => notBuilt('ending'),
  orthography: [],
  periphrases: [],
  clause,
};
validateGrammar(italianGrammar);
