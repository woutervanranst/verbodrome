import { ConjugationError } from '../../errors.js';
import type { LexemeBase, StagedGrammar } from '../../core/staged.js';

function notBuilt(): never {
  throw new ConjugationError('GENERATION_FAILURE', 'The English pack is not built yet.');
}

/** The English grammar; its stages are filled in task by task. */
export const englishGrammar: StagedGrammar<LexemeBase> = {
  classify: notBuilt,
  lexemeOf: notBuilt,
  cellOf: notBuilt,
  availability: () => null,
  stem: notBuilt,
  ending: notBuilt,
  orthography: [],
  periphrases: [],
  clause: { agreements: notBuilt, assemble: notBuilt },
};
