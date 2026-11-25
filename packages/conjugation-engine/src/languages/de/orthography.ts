/**
 * German spelling at the stem/ending boundary (GD §4.4), applied in this order: ie + e, the e of -el/-er, e-insertion
 * after d/t and after a consonant + m/n, the er-form of a changed stem in t, and -st after an s-sound.
 */
import { one } from '../../core/fork.js';
import type { Juncture, JunctureRule } from '../../core/juncture.js';
import type { Cell } from '../../core/staged.js';
import type { GermanLexeme } from './classify.js';
import { germanRules as rules } from './rules.js';
import { isElEr, presentStem, takesWeakPreterite } from './stems.js';

type Context = { readonly lexeme: GermanLexeme; readonly cell: Cell };

const is = (cell: Cell, mood: string, tense: string): boolean => cell.kind === 'finite' && cell.mood === mood && cell.tense === tense;

/** The present stem of an -el/-er verb (not a changed or listed stem). */
const elErStem = (j: Juncture, { lexeme }: Context): boolean => isElEr(lexeme.base) && j.stem === presentStem(lexeme.base) && /e[lr]$/u.test(j.stem);

/**
 * Whether an e goes between this stem and an ending that starts with s or t. Not after the changed du/er stem of a
 * strong verb (du hältst), not in the du-form of the strong Präteritum (its own rule gives -est and -st), and not after
 * a listed stem of a mixed verb, a modal or haben before the weak -te or -t (sandte, gesandt, hatte).
 */
function takesSchwa(j: Juncture, { lexeme, cell }: Context): boolean {
  if (!/^[st]/u.test(j.ending)) return false;
  const present = presentStem(lexeme.base);
  if (is(cell, 'indicative', 'present') && j.stem !== present && !(cell.kind === 'finite' && cell.number === 'plural')) return false;
  if (is(cell, 'indicative', 'past') && cell.kind === 'finite' && cell.person === 2 && cell.number === 'singular' && !takesWeakPreterite(lexeme, j.stem)) return false;
  const listedStem = lexeme.entry !== null && lexeme.conjugation !== 'weak' && j.stem !== present && j.stem !== `ge${present}`;
  const weakSuffix = j.ending.startsWith('te') || (cell.kind === 'nonFinite' && cell.form === 'pastParticiple' && j.ending === 't');
  return !(listedStem && weakSuffix);
}

const ieContraction: JunctureRule<Context> = {
  info: rules['de.orth.ie-contraction'],
  apply: j => /ie$/u.test(j.stem) && j.ending.startsWith('e') ? one({ stem: j.stem, ending: j.ending.slice(1) }) : null,
};

const elErSchwa: JunctureRule<Context> = {
  info: rules['de.orth.el-er-schwa'],
  apply: (j, context) => {
    if (!elErStem(j, context) || !['en', 'est', 'et', 'end'].includes(j.ending)) return null;
    const dropped = one({ stem: j.stem, ending: j.ending.slice(1) });
    if (!j.stem.endsWith('el') || (j.ending !== 'est' && j.ending !== 'et')) return dropped;
    return [...dropped, ...one({ stem: `${j.stem.slice(0, -2)}l`, ending: j.ending }, [], { pattern: 'elided' })];
  },
};

const elElision: JunctureRule<Context> = {
  info: rules['de.orth.el-elision'],
  apply: (j, context) => elErStem(j, context) && j.ending === 'e'
    ? [...one(j), ...one({ stem: `${j.stem.slice(0, -2)}${j.stem.slice(-1)}`, ending: j.ending }, [], { pattern: 'elided' })]
    : null,
};

const schwaDental: JunctureRule<Context> = {
  info: rules['de.orth.schwa-dental'],
  apply: (j, context) => /[dt]$/u.test(j.stem) && takesSchwa(j, context) ? one({ stem: j.stem, ending: `e${j.ending}` }) : null,
};

const schwaNasal: JunctureRule<Context> = {
  info: rules['de.orth.schwa-nasal'],
  apply: (j, context) => /(?:[bdfgkpstvxzß]|ch)[mn]$/u.test(j.stem) && takesSchwa(j, context) ? one({ stem: j.stem, ending: `e${j.ending}` }) : null,
};

const tMerge: JunctureRule<Context> = {
  info: rules['de.orth.t-merge'],
  apply: (j, { lexeme, cell }) => is(cell, 'indicative', 'present') && j.stem !== presentStem(lexeme.base) && j.stem.endsWith('t') && j.ending === 't'
    ? one({ stem: j.stem, ending: '' }) : null,
};

const sibilant2sg: JunctureRule<Context> = {
  info: rules['de.orth.sibilant-2sg'],
  apply: j => /[sßzx]$/u.test(j.stem) && j.ending === 'st' ? one({ stem: j.stem, ending: 't' }) : null,
};

export const germanOrthography: readonly JunctureRule<Context>[] = [
  ieContraction, elErSchwa, elElision, schwaDental, schwaNasal, tMerge, sibilant2sg,
];
