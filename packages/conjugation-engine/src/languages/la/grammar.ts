import { step } from '../../core/derivation.js';
import type { Fork } from '../../core/fork.js';
import type { Cell, StagedGrammar } from '../../core/staged.js';
import { synthesize, validateGrammar } from '../../core/staged.js';
import type { ResolvedTarget } from '../../types.js';
import { classifyLatin, lexemeOfLatin } from './classify.js';
import { latinAvailability } from './availability.js';
import { cellKeyOf } from './cells.js';
import { latinClause } from './clause.js';
import { isOblique } from './declension.js';
import { finiteEnding, nonFiniteEnding } from './endings.js';
import type { LatinLexeme } from './lexicon.js';
import { latinOrthography, onPresentStem } from './orthography.js';
import { isPerfectTense } from './paradigms.js';
import { latinRules } from './rules.js';
import { latinPeriphrases } from './periphrasis.js';
import { futureParticipleStems, lexicalStem, perfectStems, presentStem, supineStems } from './stems.js';

export { cellKeyOf } from './cells.js';

/** The non-finite cell of a target, or null where it is periphrastic (GD §6.2). */
function nonFiniteCellOf(target: ResolvedTarget, lexeme: LatinLexeme): Cell | null {
  const passive = target.voice === 'passive';
  const form = (name: string): Cell => ({ kind: 'nonFinite', form: name });
  switch (target.mood) {
    case 'infinitive':
      if (target.tense === 'present') return form(passive || lexeme.voiceClass === 'deponent' ? 'presentInfinitivePassive' : 'presentInfinitive');
      if (target.tense === 'perfect') return !passive && lexeme.perfectSystem === 'stem' ? form('perfectInfinitive') : null;
      return null;
    case 'participle':
      return form({ present: 'presentParticiple', perfect: 'perfectParticiple', future: 'futureParticiple' }[target.tense as string] ?? 'gerundive');
    case 'gerund': return form('gerund');
    case 'supine': return form('supine');
    default: return null;
  }
}
/**
 * The simple cell of a target (GD §6.2): the present system of a deponent is a cell with passive endings; the perfect
 * system is a cell on the perfect stem only in the active of a verb with a perfect stem, otherwise a periphrasis.
 */
function cellOf(target: ResolvedTarget, lexeme: LatinLexeme): Cell | null {
  if (target.person === null || target.number === null) return nonFiniteCellOf(target, lexeme);
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
  const passivePresent = cell.kind === 'finite' ? cell.voice === 'passive' && onPresentStem(cell) : cell.form === 'presentInfinitivePassive';
  if (lexeme.flags.has('passiveIsFio') && passivePresent) {
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
  switch (cell.form) {
    case 'perfectInfinitive': return perfectStems(lexeme);
    case 'perfectParticiple': case 'supine': return supineStems(lexeme);
    case 'futureParticiple': return futureParticipleStems(lexeme);
    case 'gerund': case 'gerundive': return lexicalStem(lexeme, 'gerund') ?? presentStem(lexeme);
    case 'presentParticiple':
      if (isOblique(cell.agreement)) {
        const oblique = lexicalStem(lexeme, 'presentParticipleOblique');
        if (oblique) return oblique;
      }
      return lexicalStem(lexeme, 'presentParticiple') ?? presentStem(lexeme);
    default: return presentStem(lexeme);
  }
}

/** The Latin staged grammar. */
export const latinGrammar: StagedGrammar<LatinLexeme> = {
  classify: classifyLatin,
  lexemeOf: lexemeOfLatin,
  cellOf,
  availability: latinAvailability,
  cell: lexicalCell,
  stem: stemOf,
  ending: (lexeme, cell, stem) => cell.kind === 'finite' ? finiteEnding(lexeme, cell, stem) : nonFiniteEnding(lexeme, cell, stem),
  orthography: latinOrthography,
  periphrases: latinPeriphrases,
  clause: latinClause,
};
validateGrammar(latinGrammar);
