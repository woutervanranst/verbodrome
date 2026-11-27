/**
 * The Dutch staged grammar. Classification (`lexicon.ts`) gives the verb's one paradigm; a simple cell (`paradigms.ts`)
 * is the present stem (`stems.ts`) plus an ending, spelled by `orthography.ts`, or a cell with listed material built
 * whole from the lexicon and the same derivation; the compound tenses are `periphrasis.ts`; `clause.ts` orders the
 * words; `tests/characterization.test.ts` holds its output to the frozen Dutch snapshot.
 */
import { deriveWords, validateGrammar } from '../../core/staged.js';
import type { StagedGrammar } from '../../core/staged.js';
import { dutchClause } from './clause.js';
import { classifyDutch, dutchLexemeOf } from './lexicon.js';
import type { DutchLexeme } from './lexicon.js';
import { dutchOrthography } from './orthography.js';
import { dutchAvailability, dutchCellOf, dutchEnding, dutchStem, listedCell } from './paradigms.js';
import { dutchPeriphrases } from './periphrasis.js';

export const dutchGrammar: StagedGrammar<DutchLexeme> = {
  classify: classifyDutch,
  lexemeOf: dutchLexemeOf,
  cellOf: target => dutchCellOf(target),
  availability: dutchAvailability,
  // A cell with listed words takes its regular ones from the engine's own derivation.
  cell: (lexeme, cell) => listedCell(lexeme, cell, () => deriveWords(dutchGrammar, lexeme, cell)),
  stem: lexeme => dutchStem(lexeme),
  ending: dutchEnding,
  orthography: dutchOrthography,
  periphrases: dutchPeriphrases,
  clause: dutchClause,
};
validateGrammar(dutchGrammar);
