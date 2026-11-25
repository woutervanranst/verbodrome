/**
 * Spanish spelling rules at the stem/ending boundary, in order (grammar design §4.4): the consonant spellings, y and
 * the absorbed i, the h and y of a word-initial diphthong, ü after g, then the written accent, computed from where the
 * ending or the stem puts the stress (§4.5). The order differs from the design's table in one place: `i-y` runs before
 * `u-diaeresis-y`, so that the y it writes after ü (argüyó) also loses the diaeresis (arguyó).
 */
import { step } from '../../core/derivation.js';
import { one } from '../../core/fork.js';
import type { Fork } from '../../core/fork.js';
import type { Juncture, JunctureRule } from '../../core/juncture.js';
import type { Cell } from '../../core/staged.js';
import type { SpanishLexeme } from './classify.js';
import { diacritics } from './lexicon.js';
import { hasStrongPreterite, imperativeSource, slotOf, stressOf } from './paradigms.js';
import { spanishRules as rules } from './rules.js';
import { endingStress, rootStressIn, stripAccents, vowelIndices, writeAccent } from './syllables.js';
import type { Accent } from './syllables.js';

export interface SpellingContext { readonly lexeme: SpanishLexeme; readonly cell: Cell }
type Rule = JunctureRule<SpellingContext>;

const front = /^[eiéí]/u;
const back = /^[aoáó]/u;
const hasTilde = (text: string): boolean => /[áéíóú]/u.test(text);
const split = (word: string, stemLength: number): Juncture => ({ stem: word.slice(0, stemLength), ending: word.slice(stemLength) });

/** Whether the cell's stem is one the lexicon stores (a stored stem never uses the hiatus flag). */
export function isStoredStem(lexeme: SpanishLexeme, cell: Cell): boolean {
  if (cell.kind !== 'finite') return false;
  const { entry } = lexeme;
  if (cell.mood === 'indicative' && cell.tense === 'present') return slotOf(cell) === 0 && entry.present1 !== undefined;
  const subjunctive = (cell.mood === 'subjunctive' && cell.tense === 'present') || (cell.mood === 'imperative' && imperativeSource(cell) === 'subjunctive');
  if (subjunctive) return entry.present1 !== undefined || entry.subjunctive !== undefined;
  return cell.mood === 'indicative' && cell.tense === 'simple_past' && entry.preterite !== undefined;
}

/**
 * The index of the stressed vowel of `stem + ending`: counted from the end for an ending-stressed cell; on the stem
 * for a root-stressed one (the prefix never takes it; on the ending's first vowel when the stem has none, and always
 * for estar and dar outside the preterite). `hiatus` reads the stem as a hiatus verb's.
 */
export function stressedIndex(lexeme: SpanishLexeme, cell: Cell, juncture: Juncture, hiatus = lexeme.stress === 'hiatus'): number {
  const word = juncture.stem + juncture.ending;
  const spec = stressOf(lexeme, cell);
  if (typeof spec === 'number') return endingStress(word, spec);
  const inEnding = vowelIndices(stripAccents(word)).filter(index => index >= juncture.stem.length);
  const preterite = cell.kind === 'finite' && cell.tense === 'simple_past';
  if (lexeme.entry.endingStress && !preterite) return endingStress(word, inEnding.length);
  const root = rootStressIn(word, juncture.stem.length, { prefixLength: lexeme.prefix.length, hiatus, stored: isStoredStem(lexeme, cell) });
  return root ?? inEnding[0]!;
}

/** A consonant spelling at the boundary: `stemEnd` written `written` before a front (e, i) or back (a, o) vowel. */
function consonant(
  info: Rule['info'], stemEnd: string, written: string, before: RegExp, infinitive: RegExp, unless?: RegExp,
): Rule {
  return {
    info,
    apply: (j, { lexeme }) => j.stem.endsWith(stemEnd) && before.test(j.ending) && infinitive.test(lexeme.infinitive) && !(unless?.test(j.stem) ?? false)
      ? one({ stem: j.stem.slice(0, -stemEnd.length) + written, ending: j.ending }) : null,
    describe: before => ({ vowel: before.ending.charAt(0) }),
  };
}

/** The ending begins with an i that is not stressed, followed by a vowel. */
function unstressedInitialI(j: Juncture, context: SpellingContext): boolean {
  return /^i[aeiouáéíóú]/u.test(j.ending) && stressedIndex(context.lexeme, context.cell, j) !== j.stem.length;
}

const iY: Rule = {
  info: rules['es.orth.i-y'],
  apply: (j, context) => {
    const pronounced = /[aeoü]$/u.test(j.stem) || (j.stem.endsWith('u') && !/[gq]u$/u.test(j.stem));
    return pronounced && unstressedInitialI(j, context) ? one({ stem: j.stem, ending: `y${j.ending.slice(1)}` }) : null;
  },
};

const iAbsorbed: Rule = {
  info: rules['es.orth.i-absorbed'],
  apply: (j, context) => {
    const strong = context.cell.kind === 'finite' && context.cell.tense === 'simple_past' && hasStrongPreterite(context.lexeme);
    const after = /(?:ñ|ll|i)$/u.test(j.stem) || (strong && j.stem.endsWith('j'));
    return after && unstressedInitialI(j, context) ? one({ stem: j.stem, ending: j.ending.slice(1) }) : null;
  },
  describe: before => ({ letter: /ll$/u.test(before.stem) ? 'll' : before.stem.slice(-1) }),
};

const uDiaeresisY: Rule = {
  info: rules['es.orth.u-diaeresis-y'],
  apply: j => {
    if (j.stem.includes('üy')) return one({ stem: j.stem.replace('üy', 'uy'), ending: j.ending });
    return j.stem.endsWith('ü') && j.ending.startsWith('y') ? one({ stem: `${j.stem.slice(0, -1)}u`, ending: j.ending }) : null;
  },
};

const initialDiphthong: Rule = {
  info: rules['es.orth.initial-diphthong'],
  apply: (j, { lexeme }) => {
    if (lexeme.alternation === null) return null;
    if (j.stem.startsWith('desue')) return one({ stem: `deshue${j.stem.slice(5)}`, ending: j.ending });
    if (j.stem.startsWith('ue')) return one({ stem: `h${j.stem}`, ending: j.ending });
    if (j.stem.startsWith('ie')) return one({ stem: `y${j.stem.slice(1)}`, ending: j.ending });
    return null;
  },
};

const gDiphthong: Rule = {
  info: rules['es.orth.g-diphthong'],
  apply: (j, { lexeme }) => {
    const at = lexeme.root.lastIndexOf('go');
    const oUe = lexeme.alternation === 'o-ue' && at >= 0 && at === lexeme.root.lastIndexOf('o') - 1;
    return oUe && j.stem.slice(at, at + 3) === 'gue'
      ? one({ stem: `${j.stem.slice(0, at)}güe${j.stem.slice(at + 3)}`, ending: j.ending }) : null;
  },
};

/** The juncture written as `accent` says, when it is of `kind`. */
function written(j: Juncture, accent: Accent, kind: Accent['kind']): Fork<Juncture> | null {
  return accent.kind === kind ? one(split(accent.written, j.stem.length)) : null;
}

const accentHiatus: Rule = {
  info: rules['es.orth.accent-hiatus'],
  apply: (j, context) => {
    const word = j.stem + j.ending;
    if (hasTilde(word)) return null;
    const { lexeme, cell } = context;
    if (lexeme.stress === 'both') {
      const diphthong = stressedIndex(lexeme, cell, j, false);
      const hiatus = stressedIndex(lexeme, cell, j, true);
      if (diphthong !== hiatus) {
        const accent = writeAccent(word, hiatus);
        return [...one(j, [], { pattern: 'diphthong' }), ...one(split(accent.written, j.stem.length), [], { pattern: 'hiatus' })];
      }
    }
    return written(j, writeAccent(word, stressedIndex(lexeme, cell, j)), 'hiatus');
  },
};

const accentGeneral: Rule = {
  info: rules['es.orth.accent-general'],
  apply: (j, { lexeme, cell }) => {
    const word = j.stem + j.ending;
    return hasTilde(word) ? null : written(j, writeAccent(word, stressedIndex(lexeme, cell, j)), 'general');
  },
  describe: (before, _, { lexeme, cell }) => ({ stress: writeAccent(before.stem + before.ending, stressedIndex(lexeme, cell, before)).stress }),
};

const monosyllable: Rule = {
  info: rules['es.orth.monosyllable'],
  apply: (j, { lexeme, cell }) => {
    const word = j.stem + j.ending;
    if (hasTilde(word) || writeAccent(word, stressedIndex(lexeme, cell, j)).kind !== 'monosyllable') return null;
    // The word does not change, so the step is the rule's own: the runner records only steps that change the text.
    return one(j, [step(rules['es.orth.monosyllable'], word, word)]);
  },
};

const diacritic: Rule = {
  info: rules['es.orth.diacritic'],
  apply: (j, { lexeme }) => {
    const word = j.stem + j.ending;
    const marked = withDiacritic(lexeme, word).word;
    return marked === word ? null : one(split(marked, j.stem.length));
  },
  describe: before => ({ word: before.stem + before.ending }),
};

/** The spelling rules, in the order they apply. */
export const spanishOrthography: readonly Rule[] = [
  consonant(rules['es.orth.c-qu'], 'c', 'qu', front, /car$/u),
  consonant(rules['es.orth.g-gu'], 'g', 'gu', front, /gar$/u),
  consonant(rules['es.orth.gu-diaeresis'], 'gu', 'gü', front, /guar$/u),
  consonant(rules['es.orth.z-c'], 'z', 'c', front, /zar$/u),
  consonant(rules['es.orth.c-z'], 'c', 'z', back, /c(?:er|ir|ír)$/u, /zc$/u),
  consonant(rules['es.orth.g-j'], 'g', 'j', back, /g(?:er|ir)$/u),
  consonant(rules['es.orth.gu-g'], 'gu', 'g', back, /guir$/u),
  consonant(rules['es.orth.qu-c'], 'qu', 'c', back, /quir$/u),
  iY,
  iAbsorbed,
  uDiaeresisY,
  initialDiphthong,
  gDiphthong,
  accentHiatus,
  accentGeneral,
  monosyllable,
  diacritic,
];

/** A whole word with the diacritic tilde, if its lemma has one for it (sé of saber and ser), and the step. */
export function withDiacritic(lexeme: SpanishLexeme, word: string): { word: string; steps: ReturnType<typeof step>[] } {
  if (!Object.hasOwn(diacritics, lexeme.base) || diacritics[lexeme.base] !== word) return { word, steps: [] };
  const marked = word.replace(/[aeiou]/u, letter => ({ a: 'á', e: 'é', i: 'í', o: 'ó', u: 'ú' })[letter]!);
  return { word: marked, steps: [step(rules['es.orth.diacritic'], word, marked, { word })] };
}
