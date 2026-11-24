/**
 * The English spelling rules at the stem/ending boundary (design §4.4), in the order they apply. A rule sees the stem
 * as the earlier rules left it. The British final l (#9) and the American single consonant (#8 for kidnap, program,
 * worship) fork into regional spellings; their American branch keeps the word as it is, so it carries its own step
 * (`en.orth.single-l-american`, `en.orth.single-consonant-american`): the engine records no step for an unchanged juncture.
 */
import { step } from '../../core/derivation.js';
import { one } from '../../core/fork.js';
import type { Juncture, JunctureRule } from '../../core/juncture.js';
import type { Cell } from '../../core/staged.js';
import type { EnglishLexeme } from './classify.js';
import { britishLEnvironment, endsInDoublingConsonant, singleVowelBeforeFinal } from './letters.js';
import { englishRules } from './rules.js';

type SpellingContext = { readonly lexeme: EnglishLexeme; readonly cell: Cell };

const rules = englishRules;
const vowelEnding = (j: Juncture): boolean => j.ending === 'ed' || j.ending === 'ing';
/**
 * The stem is still the plain form: no earlier rule shortened it. c→ck, doubling and the British l read the verb's own
 * last letters, never those an e-drop left (facing, becoming, not facking, becomming).
 */
const unchanged = (j: Juncture, lexeme: EnglishLexeme): boolean => j.stem === lexeme.lemma;

/** 1. After s, x, z, sh and ch the ending -s is written -es (watches, fixes, quizzes). */
const esSibilant: JunctureRule<SpellingContext> = {
  info: rules['en.orth.es-sibilant'],
  apply: j => j.ending === 's' && /(?:s|x|z|sh|ch)$/u.test(j.stem) ? one({ stem: j.stem, ending: 'es' }) : null,
};

/** 2. After a consonant + o, -s is written -es (goes, vetoes), except in a verb listed as taking -s (solos). */
const esO: JunctureRule<SpellingContext> = {
  info: rules['en.orth.es-o'],
  apply: (j, { lexeme }) => j.ending === 's' && /[^aeiou]o$/u.test(j.stem) && !lexeme.plainS ? one({ stem: j.stem, ending: 'es' }) : null,
};

/** 3. After a consonant, y becomes i before -es and -ed (tries, tried). */
const yToI: JunctureRule<SpellingContext> = {
  info: rules['en.orth.y-to-i'],
  apply: j => (j.ending === 's' || j.ending === 'ed') && /[^aeiou]y$/u.test(j.stem)
    ? one({ stem: `${j.stem.slice(0, -1)}i`, ending: j.ending === 's' ? 'es' : 'ed' }) : null,
};

/** 4. ie becomes y before -ing (dying). */
const ieToY: JunctureRule<SpellingContext> = {
  info: rules['en.orth.ie-to-y'],
  apply: j => j.ending === 'ing' && j.stem.endsWith('ie') ? one({ stem: `${j.stem.slice(0, -2)}y`, ending: j.ending }) : null,
};

/** 5. A verb ending in e adds only -d (hoped, agreed, died). */
const ePlusEd: JunctureRule<SpellingContext> = {
  info: rules['en.orth.e-plus-ed'],
  apply: j => j.ending === 'ed' && j.stem.endsWith('e') ? one({ stem: j.stem, ending: 'd' }) : null,
};

/** 6. A silent e after a consonant or u is dropped before -ing (hoping, arguing); ee, oe and ye keep it, and so do be and singe. */
const dropE: JunctureRule<SpellingContext> = {
  info: rules['en.orth.drop-e'],
  apply: (j, { lexeme }) => j.ending === 'ing' && /(?:[^aeiouy]|u)e$/u.test(j.stem) && !lexeme.keepsE
    ? one({ stem: j.stem.slice(0, -1), ending: j.ending }) : null,
};

/** 7. A final c after one vowel becomes ck before -ed and -ing (panicked). */
const cToCk: JunctureRule<SpellingContext> = {
  info: rules['en.orth.c-to-ck'],
  apply: (j, { lexeme }) => vowelEnding(j) && unchanged(j, lexeme) && j.stem.endsWith('c') && singleVowelBeforeFinal(j.stem)
    ? one({ stem: `${j.stem}k`, ending: j.ending }) : null,
};

/**
 * 8. One consonant after one vowel is doubled before -ed and -ing (and z before -es) when the last syllable is stressed
 * or the verb always doubles; an unstressed final l is left to #9. kidnap, program and worship also keep one consonant
 * in American spelling.
 */
const doubleConsonant: JunctureRule<SpellingContext> = {
  info: rules['en.orth.double-consonant'],
  apply(j, { lexeme }) {
    const before = vowelEnding(j) || (j.ending === 'es' && j.stem.endsWith('z'));
    const doubles = lexeme.finalStress || lexeme.doubling !== 'stress';
    if (!before || !unchanged(j, lexeme) || !endsInDoublingConsonant(j.stem) || !doubles || (j.stem.endsWith('l') && !lexeme.finalStress)) return null;
    const doubled = one({ stem: j.stem + j.stem.charAt(j.stem.length - 1), ending: j.ending });
    if (lexeme.doubling !== 'alwaysUsSingle') return doubled;
    const single = step(rules['en.orth.single-consonant-american'], null, j.stem + j.ending);
    return [...doubled, ...one(j, [single], { region: 'US', pattern: 'variant' })];
  },
  describe: (_, after, { lexeme }) => ({
    consonant: after.stem.charAt(after.stem.length - 1), reason: lexeme.doubling === 'stress' ? 'stressed' : 'listed',
  }),
};

/** 9. British spelling doubles a final l after one vowel without stress (travelled); American spelling keeps one (traveled). */
const doubleLBritish: JunctureRule<SpellingContext> = {
  info: rules['en.orth.double-l-british'],
  apply(j, { lexeme }) {
    if (!vowelEnding(j) || !unchanged(j, lexeme) || lexeme.finalStress || lexeme.lNotDoubled || !britishLEnvironment(j.stem)) return null;
    const single = step(rules['en.orth.single-l-american'], null, j.stem + j.ending);
    return [...one({ stem: `${j.stem}l`, ending: j.ending }, [], { region: 'GB' }), ...one(j, [single], { region: 'US' })];
  },
};

/** The spelling rules, in order (design §4.4 #1–#9; #10 and #11 are the American branches' steps). */
export const englishOrthography: readonly JunctureRule<SpellingContext>[] = [
  esSibilant, esO, yToI, ieToY, ePlusEd, dropE, cToCk, doubleConsonant, doubleLBritish,
];
