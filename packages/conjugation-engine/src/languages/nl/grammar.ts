/**
 * The Dutch staged grammar, while it is being migrated from the legacy resolver (which still serves `conjugate`).
 * Classification (`classify`, `lexemeOf`) and the present stem are recorded rules; every other hook throws a
 * NotMigratedError naming its stage, so a query that needs one stops there and cannot be mistaken for a grammar that
 * produced a wrong form. The shadow test (`tests/nl/shadow.test.ts`) runs the frozen Dutch snapshot through it.
 */
import { one } from '../../core/fork.js';
import { validateGrammar } from '../../core/staged.js';
import type { StagedGrammar } from '../../core/staged.js';
import { classifyDutch, dutchLexemeOf } from './lexicon.js';
import type { DutchLexeme } from './lexicon.js';

/**
 * Thrown by a hook of the Dutch staged grammar that has not been migrated yet. It is not a ConjugationError on purpose:
 * it reports where the migration stands, never what the language allows, and nothing catches it as a conjugation result.
 */
export class NotMigratedError extends Error {
  /** The hook or stage that is missing: `availability`, `cellOf`, `ending` or `clause`. */
  readonly stage: string;

  constructor(stage: string) {
    super(`The Dutch staged grammar has no ${stage} stage yet: it is not migrated from the legacy resolver.`);
    this.name = 'NotMigratedError';
    this.stage = stage;
  }
}

function notMigrated(stage: string): never {
  throw new NotMigratedError(stage);
}

export const dutchGrammar: StagedGrammar<DutchLexeme> = {
  classify: classifyDutch,
  lexemeOf: dutchLexemeOf,
  cellOf: () => notMigrated('cellOf'),
  availability: () => notMigrated('availability'),
  /** The present stem, which every regular cell starts from. */
  stem: lexeme => one(lexeme.stem.written, lexeme.stem.steps),
  ending: () => notMigrated('ending'),
  orthography: [],
  periphrases: [],
  clause: {
    agreements: () => notMigrated('clause'),
    assemble: () => notMigrated('clause'),
  },
};
validateGrammar(dutchGrammar);
