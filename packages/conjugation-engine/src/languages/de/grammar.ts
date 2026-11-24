import type { StagedGrammar } from '../../core/staged.js';
import type { LexemeBase } from '../../core/grammar.js';
import { ConjugationError } from '../../errors.js';

export type GermanLexeme = LexemeBase;

function notBuilt(hook: string): never {
  throw new ConjugationError('GENERATION_FAILURE', `German ${hook} is not built yet.`);
}

/** The German grammar: classification, then stems, endings and spelling rules, compound tenses and the main clause. */
export const germanGrammar: StagedGrammar<GermanLexeme> = {
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
