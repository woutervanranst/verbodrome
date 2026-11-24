/**
 * The Dutch lexicon lives in `lexicon.ts`. This module keeps its old import path for the legacy resolver (`index.ts`,
 * `rules.ts`) and the characterization query builder until the legacy resolver is removed; `DutchLexeme` here is the
 * lexicon entry type, which `lexicon.ts` calls `DutchEntry`.
 */
export {
  ambiguousPrefixVerbs, dutchExceptions, dutchLoans, inseparableDerivatives, inseparableVerbs, separableVerbs,
} from './lexicon.js';
export type { DutchDerivative, DutchEntry as DutchLexeme, DutchLoan } from './lexicon.js';
