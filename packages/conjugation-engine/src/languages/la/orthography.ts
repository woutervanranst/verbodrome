/**
 * The quantity and spelling rules at the stem/ending junction (GD §4.4; A&G §§10, 167, 179, 203 fn. 1; Bennett §5), in
 * the order they apply, and the quantity lint the tests and the authority cells use.
 */
import { one } from '../../core/fork.js';
import type { JunctureRule } from '../../core/juncture.js';
import type { Cell } from '../../core/staged.js';
import type { LatinLexeme } from './lexicon.js';
import { latinRules } from './rules.js';

type Context = { readonly lexeme: LatinLexeme; readonly cell: Cell };

const longOf: Readonly<Record<string, string>> = { a: 'ā', e: 'ē', i: 'ī', o: 'ō', u: 'ū' };
const shortOf: Readonly<Record<string, string>> = { ā: 'a', ē: 'e', ī: 'i', ō: 'o', ū: 'u' };
const vowel = /^[aeiouāēīōū]/u;

/** Non-finite forms built on the present stem. */
const presentForms = new Set(['presentInfinitive', 'presentInfinitivePassive', 'presentParticiple', 'gerund', 'gerundive']);

/** Whether the cell is built on the present stem (the present system, A&G §164). */
export function onPresentStem(cell: Cell): boolean {
  return cell.kind === 'finite' ? ['present', 'imperfect', 'future'].includes(cell.tense) : presentForms.has(cell.form);
}

/** Re-splits a word changed by `change` at the old stem length (a vowel's quantity never changes the length in NFC). */
function respelled(stem: string, ending: string, change: (word: string) => string): { stem: string; ending: string } | null {
  const word = stem + ending;
  const changed = change(word);
  return changed === word ? null : { stem: changed.slice(0, stem.length), ending: changed.slice(stem.length) };
}

/** Verbs in -iō drop the stem's i before a consonant, ĭ, ī or ĕ: capi + is → capis, faci + e → face. */
const ioDropI: JunctureRule<Context> = {
  info: latinRules['la.orth.io-drop-i'],
  apply(j, { lexeme, cell }) {
    if (lexeme.stemClass !== 'io' || !j.stem.endsWith('i') || !onPresentStem(cell)) return null;
    if (cell.kind === 'nonFinite' && ['gerund', 'gerundive', 'presentParticiple'].includes(cell.form)) return null;
    if (!/^(?:[^aeiouāēīōū]|[iīe])/u.test(j.ending)) return null;
    return one({ stem: j.stem.slice(0, -1), ending: j.ending });
  },
};

/** The root ī of eō becomes e before a, o and u: ī + ō → eō, ī + unt → eunt. */
const eoRoot: JunctureRule<Context> = {
  info: latinRules['la.orth.eo-root'],
  apply: (j, { lexeme }) => lexeme.flags.has('eoRoot') && j.stem.endsWith('ī') && /^[aoōuāū]/u.test(j.ending)
    ? one({ stem: `${j.stem.slice(0, -1)}e`, ending: j.ending }) : null,
};

/** The stem vowel a is lost before another vowel: amā + ō → amō, amā + ēm → amēm. */
const aLost: JunctureRule<Context> = {
  info: latinRules['la.orth.a-lost'],
  apply: (j, { lexeme }) => lexeme.stemClass === 'a' && /[āa]$/u.test(j.stem) && vowel.test(j.ending)
    ? one({ stem: j.stem.slice(0, -1), ending: j.ending }) : null,
};

/** A vowel before another vowel is short: monē + ō → moneō; fīō keeps its ī except before er (fierem). */
const shortBeforeVowel: JunctureRule<Context> = {
  info: latinRules['la.orth.short-before-vowel'],
  apply(j, { lexeme }) {
    if (!/[ēī]$/u.test(j.stem) || !vowel.test(j.ending)) return null;
    if (lexeme.flags.has('longBeforeVowel') && !j.ending.startsWith('er')) return null;
    return one({ stem: j.stem.slice(0, -1) + shortOf[j.stem.slice(-1)]!, ending: j.ending });
  },
};

/**
 * Replaces the matches of `pattern` that lie at the junction, from the stem's last letter on: a rule of the junction
 * never changes a stem vowel the lexicon or the user gives (nūntiō keeps its ū before nt; L&S nuntio, A&G §10.e).
 */
function atJunction(stem: string, ending: string, pattern: RegExp, change: (vowel: string) => string): { stem: string; ending: string } | null {
  return respelled(stem, ending, word => word.replace(pattern, (vowel, offset: number) => offset >= stem.length - 1 ? change(vowel) : vowel));
}

/** A vowel before nt or nd is short: amā + nt → amant, teg + ēnt → tegent. */
const shortBeforeNt: JunctureRule<Context> = {
  info: latinRules['la.orth.short-before-nt'],
  apply: j => {
    const result = atJunction(j.stem, j.ending, /[āēīōū](?=n[td])/gu, long => shortOf[long]!);
    return result ? one(result) : null;
  },
};

/** A long vowel is short before a final m, t or r: amāt → amat, amābām → amābam. */
const shortFinal: JunctureRule<Context> = {
  info: latinRules['la.orth.short-final'],
  apply: j => {
    const result = respelled(j.stem, j.ending, word => word.replace(/[āēīōū](?=[mtr]$)/u, long => shortOf[long]!));
    return result ? one(result) : null;
  },
};

/** A vowel before ns or nf is long: teg + ens → tegēns. */
const longBeforeNs: JunctureRule<Context> = {
  info: latinRules['la.orth.long-before-ns'],
  apply: j => {
    const result = atJunction(j.stem, j.ending, /[aeiou](?=n[sf])/gu, short => longOf[short]!);
    return result ? one(result) : null;
  },
};

/** In the perfect of eō and its compounds, ii before s contracts to ī: i + istī → īstī, i + isse → īsse (A&G §203.c). */
const iiContraction: JunctureRule<Context> = {
  info: latinRules['la.orth.ii-contraction'],
  apply: (j, { lexeme, cell }) => lexeme.flags.has('eoRoot') && !onPresentStem(cell) && /(?:^|[^ī])i$/u.test(j.stem) && j.ending.startsWith('is')
    ? one({ stem: `${j.stem.slice(0, -1)}ī`, ending: j.ending.slice(1) }) : null,
};

/** dīc, dūc, fac, fer and their compounds, but not the compounds in -ficiō (A&G §182): face → fac. */
const shortImperative: JunctureRule<Context> = {
  info: latinRules['la.end.short-imperative'],
  apply: (j, { lexeme, cell }) => cell.kind === 'finite' && cell.mood === 'imperative' && cell.tense === 'present' && cell.voice === undefined
    && cell.number === 'singular' && lexeme.flags.has('shortImperative') && !lexeme.weakened && j.ending === 'e'
    ? one({ stem: j.stem, ending: '' }) : null,
};

/** The rules of GD §4.4 in order, with the eō contraction and the short imperative after the vowel rules. */
export const latinOrthography: readonly JunctureRule<Context>[] = [ioDropI, eoRoot, aLost, shortBeforeVowel, shortBeforeNt, shortFinal, longBeforeNs, iiContraction, shortImperative];

/**
 * What breaks the quantity rules in `word` (GD §4.4 lint): a long vowel before nt, nd or another vowel (fī- before a
 * vowel other than er excepted), or a short vowel before ns or nf. Empty when the word is sound.
 */
export function quantityProblems(word: string, stem?: string): string[] {
  const problems: string[] = [];
  const text = word.normalize('NFC');
  // With the stem given, only the junction and the ending are checked: a stem's hidden quantity (nūntiō) is lexical.
  if (stem !== undefined && text.startsWith(stem)) return quantityProblems(text.slice(Math.max(0, stem.length - 1)));
  for (const match of text.matchAll(/[āēīōū](?=n[td])/gu)) problems.push(`long ${match[0]} before n${text[match.index + 2]!} at ${match.index}`);
  for (const match of text.matchAll(/[āēīōū](?=[aeiouāēīōū])/gu)) {
    const fi = match[0] === 'ī' && text[match.index - 1] === 'f' && !text.startsWith('er', match.index + 1);
    if (!fi) problems.push(`long ${match[0]} before a vowel at ${match.index}`);
  }
  for (const match of text.matchAll(/[aeiou](?=n[sf])/gu)) problems.push(`short ${match[0]} before n${text[match.index + 2]!} at ${match.index}`);
  return problems;
}
