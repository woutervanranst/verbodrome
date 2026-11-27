import { step } from '../../core/derivation.js';
import { one } from '../../core/fork.js';
import type { JunctureRule } from '../../core/juncture.js';
import type { Cell } from '../../core/staged.js';
import { consonantSpelling } from '../shared/romance.js';
import type { ItalianLexeme } from './lexicon.js';
import { italianRules as R } from './rules.js';

export type SpellingContext = { readonly lexeme: ItalianLexeme; readonly cell: Cell };

/** The cells stressed on the stem: present indicative and subjunctive io, tu, lui/lei, loro; imperative tu, Lei, Loro. */
export function rootStressed(cell: Cell): boolean {
  if (cell.kind !== 'finite' || cell.tense !== 'present') return false;
  const stemStressed = cell.number === 'singular' || cell.person === 3;
  if (cell.mood === 'indicative' || cell.mood === 'subjunctive') return stemStressed;
  return cell.mood === 'imperative' && stemStressed && !(cell.person === 1);
}

/** 1. -care / -gare: c and g keep their hard sound before e and i (cerchi, pagherò). */
const velarH: JunctureRule<SpellingContext> = consonantSpelling({
  info: R['it.orth.velar-h'], letters: { c: 'ch', g: 'gh' }, before: /^[ei]/u, applies: ({ lexeme }) => lexeme.conjugation === 'are',
  describe: before => ({ letter: before.stem.slice(-1) }),
});

/** 2. -ciare / -giare / -sciare: the i only marks the soft sound and is not written before e and i (comincerò, mangi). */
const palatalIDrop: JunctureRule<SpellingContext> = consonantSpelling({
  info: R['it.orth.palatal-i-drop'], letters: { ci: 'c', gi: 'g' }, before: /^[ei]/u,
  applies: ({ lexeme }) => lexeme.conjugation === 'are' && !lexeme.stressedI,
});

/**
 * 3. An unstressed i at the end of the stem and the i of the ending are written once (studi, tagliamo, inviamo), except
 * where a stressed i is stressed (tu invii, che scìino). Besides -iare verbs this also covers the -ere stems in i
 * (scegli-, togli-, pai-).
 */
const iMerge: JunctureRule<SpellingContext> = {
  info: R['it.orth.i-merge'],
  apply: (j, { lexeme, cell }) => {
    if (!j.stem.endsWith('i') || !j.ending.startsWith('i')) return null;
    // Rule 14's exception: a stressed i decides against the merge the learner would expect (studi, but invii).
    if (lexeme.stressedI && rootStressed(cell)) return one(j, [step(R['it.orth.stressed-i-kept'], j.stem + j.ending, j.stem + j.ending)]);
    return one({ stem: j.stem, ending: j.ending.slice(1) });
  },
};

/** 4. A regular -ere past participle in -uto keeps a soft c with an i (conosciuto, taciuto). */
const participleCi: JunctureRule<SpellingContext> = {
  info: R['it.orth.participle-ci'],
  apply: (j, { lexeme, cell }) => lexeme.conjugation === 'ere' && cell.kind === 'nonFinite' && cell.form === 'participle'
    && j.stem.endsWith('c') && j.ending.startsWith('u') ? one({ stem: `${j.stem}i`, ending: j.ending }) : null,
};

/** The stressed monosyllables a derived verb puts its prefix before, with their written accent. */
const accented: Readonly<Record<string, string>> = { fa: 'fà', fo: 'fò', sta: 'stà', sto: 'stò', do: 'dò', da: 'dà', so: 'sò', sa: 'sà', va: 'và' };

/**
 * 5. A word of several syllables stressed on its last vowel is written with an accent: a prefix before a stressed
 * monosyllable of the base (ri + fa → rifà). It applies where the juncture is the derived verb's prefix and the base's
 * whole word, which `cell` builds for a derived verb's lexical cells.
 */
export const finalAccent: JunctureRule<SpellingContext> = {
  info: R['it.orth.final-accent'],
  apply: (j, { lexeme }) => lexeme.family !== null && j.stem === lexeme.family.prefix && Object.hasOwn(accented, j.ending)
    ? one({ stem: j.stem, ending: accented[j.ending]! }) : null,
};

/** The spelling rules, in the order they apply (grammar design §4.4). */
export const italianSpelling: readonly JunctureRule<SpellingContext>[] = [velarH, palatalIDrop, iMerge, participleCi, finalAccent];
