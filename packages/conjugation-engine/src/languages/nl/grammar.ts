/**
 * The Dutch staged grammar. Classification (`lexicon.ts`) gives the verb's one paradigm; a simple cell (`paradigms.ts`)
 * is the present stem (`stems.ts`) plus an ending, spelled by `orthography.ts`, or a cell with listed material built
 * whole from the lexicon and the same derivation; the compound tenses are `periphrasis.ts`; `clause.ts` orders the
 * words. The legacy resolver still serves `conjugate`; `tests/nl/shadow.test.ts` runs the frozen Dutch snapshot through
 * this grammar.
 */
import { chain, one } from '../../core/fork.js';
import type { Fork } from '../../core/fork.js';
import { applyJunctureRules } from '../../core/juncture.js';
import { validateGrammar } from '../../core/staged.js';
import type { Cell, StagedGrammar } from '../../core/staged.js';
import { dutchClause } from './clause.js';
import { classifyDutch, dutchLexemeOf } from './lexicon.js';
import type { DutchLexeme } from './lexicon.js';
import { dutchOrthography } from './orthography.js';
import { dutchAvailability, dutchCellOf, dutchEnding, dutchStem, listedCell } from './paradigms.js';
import { dutchPeriphrases } from './periphrasis.js';

/** The regular word of a cell: stem, ending and spelling, exactly as the engine derives a cell without listed material. */
function regular(lexeme: DutchLexeme, cell: Cell): Fork<string> {
  return chain(dutchStem(lexeme), stem => chain(dutchEnding(lexeme, cell, stem), ending =>
    chain(applyJunctureRules(dutchOrthography, { stem, ending }, { lexeme, cell }), spelled => one(spelled.stem + spelled.ending))));
}

export const dutchGrammar: StagedGrammar<DutchLexeme> = {
  classify: classifyDutch,
  lexemeOf: dutchLexemeOf,
  cellOf: target => dutchCellOf(target),
  availability: dutchAvailability,
  cell: (lexeme, cell) => listedCell(lexeme, cell, () => regular(lexeme, cell)),
  stem: lexeme => dutchStem(lexeme),
  ending: dutchEnding,
  orthography: dutchOrthography,
  periphrases: dutchPeriphrases,
  clause: dutchClause,
};
validateGrammar(dutchGrammar);
