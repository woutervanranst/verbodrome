import { wordPart } from '../../core/clause.js';
import { step } from '../../core/derivation.js';
import { one } from '../../core/fork.js';
import type { Fork } from '../../core/fork.js';
import type { Cell, StagedGrammar } from '../../core/staged.js';
import { synthesize, validateGrammar } from '../../core/staged.js';
import type { ResolvedTarget } from '../../types.js';
import { classifyLatin, lexemeOfLatin } from './classify.js';
import { finiteEnding, unbuilt } from './endings.js';
import type { LatinLexeme } from './lexicon.js';
import { latinOrthography, onPresentStem } from './orthography.js';
import { isPerfectTense } from './paradigms.js';
import { latinRules } from './rules.js';
import { lexicalStem, perfectStems, presentStem } from './stems.js';

/** The key of a cell in an entry's `cells`: `indicative.present.active.2s`, or the non-finite form id. */
export function cellKeyOf(cell: Cell): string {
  return cell.kind === 'finite'
    ? `${cell.mood}.${cell.tense}.${cell.voice ?? 'active'}.${cell.person}${cell.number === 'singular' ? 's' : 'p'}`
    : cell.form;
}

/**
 * The simple cell of a target (GD §6.2): the present system of a deponent is a cell with passive endings; the perfect
 * system is a cell on the perfect stem only in the active of a verb with a perfect stem, otherwise a periphrasis.
 */
function cellOf(target: ResolvedTarget, lexeme: LatinLexeme): Cell | null {
  if (target.person === null || target.number === null) return null;
  const passive = (target.voice ?? 'active') === 'passive';
  const base = { kind: 'finite', mood: target.mood, tense: target.tense, person: target.person, number: target.number } as const;
  if (isPerfectTense(target.mood, target.tense)) return passive || lexeme.perfectSystem === 'participle' ? null : base;
  return passive || lexeme.voiceClass === 'deponent' ? { ...base, voice: 'passive' } : base;
}

/** Whole words the lexicon lists for a cell (`la.lex.cell`); faciō takes the passive of its present system from fīō. */
function lexicalCell(lexeme: LatinLexeme, cell: Cell): Fork<string> | null {
  const listed = lexeme.cells[cellKeyOf(cell)];
  if (listed) {
    return listed.map(form => ({
      value: form.text,
      steps: [step(latinRules['la.lex.cell'], lexeme.lemma, form.text)],
      tags: { ...(form.usage && form.usage !== 'standard' ? { usage: form.usage } : {}), ...(form.pattern ? { pattern: form.pattern } : {}) },
    }));
  }
  if (lexeme.flags.has('passiveIsFio') && cell.voice === 'passive' && onPresentStem(cell)) {
    // A&G §204: "The passive of faciō is fīō": the active forms of fīō.
    const { voice: _voice, ...active } = cell;
    const fio = lexemeOfLatin('fierī');
    return synthesize(latinGrammar, fio, cell.kind === 'nonFinite' && cell.form === 'presentInfinitivePassive'
      ? { kind: 'nonFinite', form: 'presentInfinitive' } : active as Cell);
  }
  return null;
}

function stemOf(lexeme: LatinLexeme, cell: Cell): Fork<string> {
  if (cell.kind === 'finite') {
    if (isPerfectTense(cell.mood, cell.tense)) return perfectStems(lexeme);
    if (cell.mood === 'subjunctive' && cell.tense === 'present') return lexicalStem(lexeme, 'optative') ?? presentStem(lexeme);
    return presentStem(lexeme);
  }
  return unbuilt(`non-finite stem ${cell.form}`);
}

/** The Latin staged grammar. */
export const latinGrammar: StagedGrammar<LatinLexeme> = {
  classify: classifyLatin,
  lexemeOf: lexemeOfLatin,
  cellOf,
  availability: () => null,
  cell: lexicalCell,
  stem: stemOf,
  ending: (lexeme, cell, stem) => cell.kind === 'finite' ? finiteEnding(lexeme, cell, stem) : unbuilt(`non-finite ending ${cell.form}`),
  orthography: latinOrthography,
  periphrases: [],
  clause: {
    agreements: () => one(null),
    assemble: (words, { rendering }) => one(words.map(word => wordPart(rendering, word))),
  },
};
validateGrammar(latinGrammar);
