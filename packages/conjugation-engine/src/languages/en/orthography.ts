/**
 * The English spelling rules at the stem/ending boundary (design §4.4), in the order they apply. A rule sees the stem
 * as the earlier rules left it. The British final l (#9) and the American single consonant (#8 for kidnap, program,
 * worship) fork into regional spellings; their American branch keeps the word as it is, so it carries its own step
 * (`en.orth.single-l-american`, `en.orth.single-consonant-american`): the engine records no step for an unchanged juncture.
 */
import { step } from '../../core/derivation.js';
import { one } from '../../core/fork.js';
import type { Fork } from '../../core/fork.js';
import type { Juncture, JunctureRule } from '../../core/juncture.js';
import type { Cell } from '../../core/staged.js';
import type { EnglishLexeme } from './classify.js';
import { britishLEnvironment, endsInDoublingConsonant } from './letters.js';
import { englishRules } from './rules.js';

type SpellingContext = { readonly lexeme: EnglishLexeme; readonly cell: Cell };

const rules = englishRules;
const vowelEnding = (j: Juncture): boolean => j.ending === 'ed' || j.ending === 'ing';
/**
 * The stem is still the plain form: no earlier rule shortened it. c→ck, doubling and the British l read the verb's own
 * last letters, never those an e-drop left (facing, becoming, not facking, becomming).
 */
const unchanged = (j: Juncture, lexeme: EnglishLexeme): boolean => j.stem === lexeme.lemma;

/** The American, older or other accepted spelling a rule leaves unchanged, with the step that names it. */
function variantOf(j: Juncture, variant: 'single' | 'second' | 'keepE' | 's', tags: Fork<Juncture>[number]['tags']): Fork<Juncture> {
  return one(j, [step(rules['en.orth.spelling-variant'], null, j.stem + j.ending, { variant })], tags);
}

/** 1. After s, x, z, sh and ch the ending -s is written -es (watches, fixes, quizzes), unless ch sounds k (stomachs). */
const esSibilant: JunctureRule<SpellingContext> = {
  info: rules['en.orth.es-sibilant'],
  apply: (j, { lexeme }) => j.ending === 's' && /(?:s|x|z|sh|ch)$/u.test(j.stem) && !lexeme.plainS ? one({ stem: j.stem, ending: 'es' }) : null,
};

/** 2. After a consonant + o, -s is written -es (goes, vetoes), except in a verb that takes -s (solos); tango has both. */
const esO: JunctureRule<SpellingContext> = {
  info: rules['en.orth.es-o'],
  apply(j, { lexeme }) {
    if (j.ending !== 's' || !/[^aeiou]o$/u.test(j.stem) || lexeme.plainS) return null;
    const es = one({ stem: j.stem, ending: 'es' });
    return lexeme.sVariant ? [...es, ...variantOf(j, 's', { pattern: 'variant' })] : es;
  },
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

/**
 * 6. A silent e after a consonant or u is dropped before -ing (hoping, arguing); ee, oe and ye keep it, and so do be
 * and singe. age also keeps it in a British variant (ageing).
 */
const dropE: JunctureRule<SpellingContext> = {
  info: rules['en.orth.drop-e'],
  apply(j, { lexeme }) {
    if (j.ending !== 'ing' || !/(?:[^aeiouy]|u)e$/u.test(j.stem) || lexeme.keepsE) return null;
    const dropped = one({ stem: j.stem.slice(0, -1), ending: j.ending });
    return lexeme.keepsEBritish ? [...dropped, ...variantOf(j, 'keepE', { region: 'GB', pattern: 'variant' })] : dropped;
  },
};

/** 7. A final c after a vowel becomes ck before -ed and -ing (panicked, bivouacked). */
const cToCk: JunctureRule<SpellingContext> = {
  info: rules['en.orth.c-to-ck'],
  apply: (j, { lexeme }) => vowelEnding(j) && unchanged(j, lexeme) && /[aeiou]c$/u.test(j.stem)
    ? one({ stem: `${j.stem}k`, ending: j.ending }) : null,
};

/**
 * 8. One consonant after one vowel is doubled before -ed and -ing (and z before -es) when the last syllable is stressed
 * or the verb always doubles; a silent consonant never does (debuted), and an unstressed final l is left to #9. Some
 * verbs also keep one consonant: American kidnaped, programed as a second spelling; bus prefers it (bused, bussed).
 */
const doubleConsonant: JunctureRule<SpellingContext> = {
  info: rules['en.orth.double-consonant'],
  apply(j, { lexeme }) {
    // Before -es only a final z doubles (quizzes), and the s of a verb with a single-consonant variant (nonplusses, busses).
    const sBeforeEs = j.ending === 'es' && j.stem.endsWith('s') && lexeme.consonantVariant !== null;
    const before = vowelEnding(j) || (j.ending === 'es' && j.stem.endsWith('z')) || sBeforeEs;
    const doubles = lexeme.doubling === 'always' || (lexeme.doubling === 'stress' && lexeme.finalStress);
    if (!before || !unchanged(j, lexeme) || !endsInDoublingConsonant(j.stem) || !doubles || (j.stem.endsWith('l') && !lexeme.finalStress)) return null;
    const doubled = one({ stem: j.stem + j.stem.charAt(j.stem.length - 1), ending: j.ending });
    const variant = lexeme.consonantVariant;
    if (variant === null || (!vowelEnding(j) && !sBeforeEs)) return doubled;
    if (variant.first === 'single') return [...variantOf(j, 'single', {}), ...doubled.map(o => ({ ...o, tags: { pattern: 'variant' } }))];
    if (variant.single.region === 'US') {
      return [...doubled, ...one(j, [step(rules['en.orth.single-consonant-american'], null, j.stem + j.ending)], { region: 'US', pattern: 'variant' })];
    }
    return [...doubled, ...variantOf(j, 'second', { pattern: 'variant' })];
  },
  describe: (_, after, { lexeme }) => ({
    consonant: after.stem.charAt(after.stem.length - 1), reason: lexeme.doubling === 'stress' ? 'stressed' : 'listed', ending: after.ending,
  }),
};

/**
 * 9. British spelling doubles a final l after a vowel without stress (travelled); American spelling keeps one
 * (traveled). parallel keeps one l in both, with a British variant that doubles it (parallelled).
 */
const doubleLBritish: JunctureRule<SpellingContext> = {
  info: rules['en.orth.double-l-british'],
  apply(j, { lexeme }) {
    if (!vowelEnding(j) || !unchanged(j, lexeme) || lexeme.finalStress || !britishLEnvironment(j.stem)) return null;
    const doubled = one({ stem: `${j.stem}l`, ending: j.ending }, [], { region: 'GB' });
    if (lexeme.lNotDoubled) return [...one(j), ...doubled.map(o => ({ ...o, tags: { region: 'GB', pattern: 'variant' } }))];
    const single = step(rules['en.orth.single-l-american'], null, j.stem + j.ending);
    return [...doubled, ...one(j, [single], { region: 'US' })];
  },
};

/** The spelling rules, in order (design §4.4 #1–#9; #10 and #11 are the American branches' steps). */
export const englishOrthography: readonly JunctureRule<SpellingContext>[] = [
  esSibilant, esO, yToI, ieToY, ePlusEd, dropE, cToCk, doubleConsonant, doubleLBritish,
];
