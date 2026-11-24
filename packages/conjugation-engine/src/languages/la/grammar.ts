import type { StagedGrammar } from '../../core/staged.js';
import { validateGrammar } from '../../core/staged.js';
import { ConjugationError } from '../../errors.js';
import { classifyLatin, lexemeOfLatin } from './classify.js';
import type { LatinLexeme } from './lexicon.js';

function notBuilt(hook: string): never {
  throw new ConjugationError('GENERATION_FAILURE', `Latin ${hook} is not built yet.`);
}

/** The Latin staged grammar. */
export const latinGrammar: StagedGrammar<LatinLexeme> = {
  classify: classifyLatin,
  lexemeOf: lexemeOfLatin,
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
