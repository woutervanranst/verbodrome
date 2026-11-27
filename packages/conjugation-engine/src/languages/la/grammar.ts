import { step } from '../../core/derivation.js';
import type { Fork, Outcome } from '../../core/fork.js';
import type { Cell, StagedGrammar } from '../../core/staged.js';
import { deriveWords, validateGrammar } from '../../core/staged.js';
import type { ResolvedTarget } from '../../types.js';
import { classifyLatin, lexemeOfLatin } from './classify.js';
import { latinAvailability } from './availability.js';
import { cellKeyOf } from './cells.js';
import { latinClause } from './clause.js';
import { isOblique } from './declension.js';
import { finiteEnding, nonFiniteEnding } from './endings.js';
import { foremMark, sumCells } from './irregulars.js';
import type { LatinLexeme } from './lexicon.js';
import type { LexicalForm } from './entries.js';
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

/** A word of sum behind the prefix of one of its compounds (A&G §198), or pot-/pos- for possum (§198.b). */
function sumCompoundWord(lexeme: LatinLexeme, form: LexicalForm): Outcome<string> {
  const { vowel, consonant, pot } = lexeme.entry!.sumCompound!;
  const word = form.text;
  const marks = form.marks ? { marks: form.marks } : {};
  if (pot) {
    const text = word.startsWith('ess') ? `po${word.slice(1)}` : word.startsWith('s') ? `pos${word}` : `pot${word}`;
    return { value: text, steps: [step(latinRules['la.lex.pot-sum'], word, text)], tags: {}, ...marks };
  }
  // forem and fore belong to the root of fuī and take the prefix of the perfect: āfuī, āforem, āfore (A&G §§170.a, 198).
  // A&G prints them for sum only (p. 108 gives prōsum without them), so a compound's are tagged.
  const fu = word.startsWith('f');
  const prefix = fu ? lexeme.entry!.perfect![0]!.slice(0, -'fuī'.length) : /^[aeiouāēīōū]/u.test(word) ? vowel : consonant;
  const tags = fu ? { pattern: word === 'fore' ? 'fore' : 'forem' } : {};
  return { value: prefix + word, steps: [step(latinRules['la.lex.sum-compound'], word, prefix + word, { prefix })], tags, ...marks };
}

/**
 * Whole words the lexicon gives for a cell (`la.lex.cell`), beside the derived words where the entry says so (edō's ēs
 * beside edis); the present system of sum's compounds and possum from sum's words; and faciō's present-system passive,
 * which is fīō's active (A&G §204), with the step that says so.
 */
function lexicalCell(lexeme: LatinLexeme, cell: Cell): Fork<string> | null {
  const key = cellKeyOf(cell);
  const entry = lexeme.entry;
  if (entry?.sumCompound && cell.voice === undefined && (cell.kind === 'finite' ? onPresentStem(cell) : ['presentInfinitive', 'fore'].includes(cell.form))) {
    const words = sumCells[key];
    // The compounds inflect as sum "without any change" (A&G §198), forem and fore included; possum has neither (p. 109).
    if (words) return words.filter(form => !entry.sumCompound!.pot || !form.marks?.includes(foremMark)).map(form => sumCompoundWord(lexeme, form));
  }
  const listed = lexeme.cells[key];
  if (listed) {
    const words: Fork<string> = listed.map(form => ({
      value: form.text,
      steps: [step(latinRules[form.rule ?? 'la.lex.cell'], lexeme.lemma, form.text)],
      tags: { ...(form.usage && form.usage !== 'standard' ? { usage: form.usage } : {}), ...(form.pattern ? { pattern: form.pattern } : {}) },
      ...(form.marks ? { marks: form.marks } : {}),
    }));
    return entry?.cellsBeside ? [...deriveWords(latinGrammar, lexeme, cell), ...words] : words;
  }
  const passivePresent = cell.kind === 'finite' ? cell.voice === 'passive' && onPresentStem(cell) : cell.form === 'presentInfinitivePassive';
  if (lexeme.flags.has('passiveIsFio') && passivePresent) {
    const fio = lexemeOfLatin('fierī');
    const active: Cell = cell.kind === 'nonFinite' ? { kind: 'nonFinite', form: 'presentInfinitive' }
      : { kind: 'finite', mood: cell.mood, tense: cell.tense, person: cell.person, number: cell.number };
    const prefix = lexeme.stems.fio ?? '';
    const words = lexicalCell(fio, active) ?? deriveWords(latinGrammar, fio, active);
    return words.map(outcome => ({
      ...outcome, value: prefix + outcome.value,
      steps: [...outcome.steps, step(latinRules['la.lex.passive-fio'], lexeme.lemma, prefix + outcome.value)],
    }));
  }
  return null;
}

/** The tags of a cell's words: fīō's bracketed forms are dated (A&G p. 115). */
function withDated(lexeme: LatinLexeme, cell: Cell, words: Fork<string>): Fork<string> {
  if (!lexeme.entry?.dated?.includes(cellKeyOf(cell))) return words;
  return words.map(outcome => ({ ...outcome, tags: { ...outcome.tags, usage: 'dated' as const } }));
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
  ending: (lexeme, cell, stem) => withDated(lexeme, cell, cell.kind === 'finite' ? finiteEnding(lexeme, cell, stem) : nonFiniteEnding(lexeme, cell, stem)),
  orthography: latinOrthography,
  periphrases: latinPeriphrases,
  clause: latinClause,
};
validateGrammar(latinGrammar);
