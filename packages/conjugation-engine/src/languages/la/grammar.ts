import { ConjugationError } from '../../errors.js';
import type { StagedGrammar } from '../../core/staged.js';
import { validateGrammar } from '../../core/staged.js';
import type { LatinLexeme } from './lexicon.js';

function notBuilt(hook: string): never {
  throw new ConjugationError('GENERATION_FAILURE', `Latin ${hook} is not built yet.`);
}

/** The Latin staged grammar. */
export const latinGrammar: StagedGrammar<LatinLexeme> = {
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
validateGrammar(latinGrammar);
