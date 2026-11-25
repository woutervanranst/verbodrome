import type { StagedGrammar } from '../../core/staged.js';
import { ConjugationError } from '../../errors.js';
import { classifyGerman, germanLexemeOf } from './classify.js';
import type { GermanLexeme } from './classify.js';

export type { GermanLexeme } from './classify.js';

function notBuilt(hook: string): never {
  throw new ConjugationError('GENERATION_FAILURE', `German ${hook} is not built yet.`);
}

/** The German grammar: classification, then stems, endings and spelling rules, compound tenses and the main clause. */
export const germanGrammar: StagedGrammar<GermanLexeme> = {
  classify: classifyGerman,
  lexemeOf: germanLexemeOf,
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
