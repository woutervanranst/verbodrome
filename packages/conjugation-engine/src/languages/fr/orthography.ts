/**
 * The French spelling rules at the stem/ending boundary (GD §4.4), in the order they apply. Rules 1-6 act only on the
 * er group (a family stores its parts already spelt); a rule with two outcomes makes the traditional and the 1990
 * (rectified) spelling. Every form is born in both spellings.
 */
import { one } from '../../core/fork.js';
import type { Juncture, JunctureRule } from '../../core/juncture.js';
import type { Cell } from '../../core/staged.js';
import type { FrenchLexeme } from './grammar.js';
import { closedEStem, elerEterClass, mute, muteEStem } from './paradigms.js';
import { frenchRules } from './rules.js';
import { cellIndex, cellNameOf, familyPrefix } from './stems.js';

export type SpellingContext = { readonly lexeme: FrenchLexeme; readonly cell: Cell };
type Rule = JunctureRule<SpellingContext>;

const er = (lexeme: FrenchLexeme): boolean => lexeme.group === 'er';
const traditional = (j: Juncture) => one(j, [], { orthography: 'traditional' });
const rectified = (j: Juncture) => one(j, [], { orthography: 'rectified' });

/** 1. -eler/-eter: the l or t doubles before a silent e (appelle); for most verbs only in traditional spelling. */
const elerEter: Rule = {
  info: frenchRules['fr.orth.eler-eter'],
  apply(j, { lexeme }) {
    if (!er(lexeme) || !/e[lt]$/u.test(j.stem) || !mute(j.ending)) return null;
    const kind = elerEterClass(lexeme.lemma);
    const doubled = { stem: j.stem + j.stem.slice(-1), ending: j.ending };
    if (kind === 'double') return one(doubled);
    return kind === 'fork' ? [...traditional(doubled), ...rectified(j)] : null;
  },
};

/** 2. The mute e of the stem's last syllable becomes è before a silent ending (lève, achète, dépèce, lèverai). */
const muteEGrave: Rule = {
  info: frenchRules['fr.orth.mute-e-grave'],
  apply(j, { lexeme }) {
    if (!er(lexeme) || !mute(j.ending) || !muteEStem.test(j.stem)) return null;
    return one({ stem: j.stem.replace(muteEStem, (_, before: string, after: string) => `${before}è${after}`), ending: j.ending });
  },
};

/** 3. The é of the stem's last syllable becomes è before a silent ending; before the future's er only in 1990 spelling. */
const closedEGrave: Rule = {
  info: frenchRules['fr.orth.closed-e-grave'],
  apply(j, { lexeme }) {
    if (!er(lexeme) || !mute(j.ending) || !closedEStem.test(j.stem)) return null;
    const grave = { stem: j.stem.replace(closedEStem, (_, after: string) => `è${after}`), ending: j.ending };
    return j.ending.startsWith('er') ? [...traditional(j), ...rectified(grave)] : one(grave);
  },
};

/** 4. c takes a cedilla before a, o, u to keep the sound s (plaçons). */
const cCedilla: Rule = {
  info: frenchRules['fr.orth.c-cedilla'],
  apply: (j, { lexeme }) => er(lexeme) && j.stem.endsWith('c') && /^[aoâôuû]/u.test(j.ending)
    ? one({ stem: `${j.stem.slice(0, -1)}ç`, ending: j.ending }) : null,
};

/** 5. g takes an e before a, o to keep the soft sound (mangeons). */
const gE: Rule = {
  info: frenchRules['fr.orth.g-e'],
  apply: (j, { lexeme }) => er(lexeme) && j.stem.endsWith('g') && /^[aoâô]/u.test(j.ending)
    ? one({ stem: `${j.stem}e`, ending: j.ending }) : null,
};

/** 6. y becomes i before a silent ending: always after o and u, after a only in the y-to-i paradigm, never after e. */
const yToI: Rule = {
  info: frenchRules['fr.orth.y-to-i'],
  apply(j, { lexeme }) {
    if (!er(lexeme) || !j.stem.endsWith('y') || !mute(j.ending)) return null;
    const before = j.stem.slice(-2, -1);
    const changes = before === 'o' || before === 'u' || (before === 'a' && lexeme.paradigm.pattern === 'y-to-i');
    return changes ? one({ stem: `${j.stem.slice(0, -1)}i`, ending: j.ending }) : null;
  },
};

/** 7. In an -ïr verb of the second group, the i of the ending is written ï (blouïs, blouït). */
const diaeresis: Rule = {
  info: frenchRules['fr.orth.diaeresis'],
  apply: (j, { lexeme }) => lexeme.group === 'ir' && lexeme.lemma.includes('ï') && /^[iî]/u.test(j.ending)
    ? one({ stem: j.stem, ending: `ï${j.ending.slice(1)}` }) : null,
};

/** 8. The t of the present 3sg is not written after d, t or c (il rend, il met, il vainc). */
const tAfterDental: Rule = {
  info: frenchRules['fr.orth.t-after-dental'],
  apply: (j, { cell }) => j.ending === 't' && /[dtc]$/u.test(j.stem) && cellIndex(cell) === 2 ? one({ stem: j.stem, ending: '' }) : null,
};

/** 9. An -ttre verb of the third group keeps one t in the present singular and the imperative 2sg (bats, met). */
const ttSingular: Rule = {
  info: frenchRules['fr.orth.tt-singular'],
  apply: (j, { lexeme, cell }) => lexeme.group === 're' && j.stem.endsWith('tt') && [0, 1, 2, 42].includes(cellIndex(cell))
    ? one({ stem: j.stem.slice(0, -1), ending: j.ending }) : null,
};

/**
 * 10. The stem vowel before the 3sg t takes a circumflex: i in -aître and -oître verbs, plaire and gésir (connaît,
 * plaît, gît), only in traditional spelling (JO 1990 II.4: il plait); o in clore and its derivatives (clôt), which the
 * 1990 rules leave alone.
 */
const circumflexBeforeT: Rule = {
  info: frenchRules['fr.orth.circumflex-before-t'],
  apply(j, { lexeme, cell }) {
    if (!lexeme.family?.flags.circumflexBeforeT || j.ending !== 't' || cellIndex(cell) !== 2) return null;
    if (j.stem.endsWith('o')) return one({ stem: `${j.stem.slice(0, -1)}ô`, ending: j.ending });
    if (!j.stem.endsWith('i')) return null;
    return [...traditional({ stem: `${j.stem.slice(0, -1)}î`, ending: j.ending }), ...rectified(j)];
  },
};

/** 11. croître writes û in the endings of its passé simple and imperfect subjunctive, unlike croire (crûs, crûsse). */
const croitreHomograph: Rule = {
  info: frenchRules['fr.orth.croitre-homograph'],
  apply(j, { lexeme, cell }) {
    const index = cellIndex(cell);
    const past = (index >= 12 && index < 18) || (index >= 30 && index < 36);
    return lexeme.family?.id === 'croître' && past && j.ending.startsWith('u') ? one({ stem: j.stem, ending: `û${j.ending.slice(1)}` }) : null;
  },
};

/** The cells of croître whose circumflex tells it from croire (rule 11): present singular, imperative, passé simple, subj. imperfect, crû. */
function croitreHomographCell(index: number): boolean {
  return [0, 1, 2, 42, 46].includes(index) || (index >= 12 && index < 18) || (index >= 30 && index < 36);
}

/** Where the 1990 spelling keeps the circumflex (JO 1990 II.4 b): croître's homographs of croire, dû, jeûne(s). */
function protectedCircumflex(lexeme: FrenchLexeme, cell: Cell, j: Juncture): boolean {
  const index = cellIndex(cell);
  if (lexeme.family?.id === 'croître' && croitreHomographCell(index)) return true;
  if (lexeme.family?.id === 'devoir' && index === 46) return true;
  return j.stem.endsWith('jeûn') && (j.ending === 'e' || j.ending === 'es');
}

/** 12. The 1990 spelling drops the circumflex on the i and u of the stem; endings keep theirs. */
const circumflex1990: Rule = {
  info: frenchRules['fr.orth.1990-circumflex'],
  apply(j, { lexeme, cell }) {
    if (!/[îû]/u.test(j.stem) || protectedCircumflex(lexeme, cell, j)) return null;
    return [...traditional(j), ...rectified({ stem: j.stem.replace(/î/gu, 'i').replace(/û/gu, 'u'), ending: j.ending })];
  },
};

/** 13. The 1990 spelling writes assoir and sursoir: the e of -eoi- goes (assoirai, assoir). */
const assoir1990: Rule = {
  info: frenchRules['fr.orth.1990-assoir'],
  apply(j, { lexeme }) {
    const id = lexeme.family?.id;
    if ((id !== 'asseoir' && id !== 'surseoir') || !j.stem.includes('seoi')) return null;
    return [...traditional(j), ...rectified({ stem: j.stem.replace('seoi', 'soi'), ending: j.ending })];
  },
};

/** 14. The 1990 spelling writes interpeler, conjugated like appeler: ll only before a silent e (interpelle, interpelons). */
const interpeler1990: Rule = {
  info: frenchRules['fr.orth.1990-interpeler'],
  apply(j, { lexeme }) {
    if (lexeme.family?.id !== 'interpeller') return null;
    const at = j.stem.lastIndexOf('ll');
    if (at < 0 || mute((j.stem + j.ending).slice(at + 2))) return null;
    return [...traditional(j), ...rectified({ stem: j.stem.slice(0, at) + j.stem.slice(at + 1), ending: j.ending })];
  },
};

/** 15. The 1990 spelling writes absout, dissout like their feminine absoute (masculine singular and plural). */
const absout1990: Rule = {
  info: frenchRules['fr.orth.1990-absout'],
  apply(j, { lexeme, cell }) {
    const index = cellIndex(cell);
    if (lexeme.family?.id !== 'absoudre' || (index !== 46 && index !== 48) || !j.stem.endsWith('sous')) return null;
    return [...traditional(j), ...rectified({ stem: `${j.stem.slice(0, -1)}t`, ending: index === 48 ? 's' : '' })];
  },
};

/**
 * A spelling the family lists for the 1990 spelling, with no rule behind it (GD O1, O2: il clot, crûe): the derived
 * word stays the traditional one. Secondary-only (`sources.ts`).
 */
const listedSpelling: Rule = {
  info: frenchRules['fr.stem.listed-spelling'],
  apply(j, { lexeme, cell }) {
    if (lexeme.family === null || !('spellings' in lexeme.paradigm)) return null;
    const listed = lexeme.paradigm.spellings[cellNameOf(cell)];
    if (!listed) return null;
    const prefix = familyPrefix(lexeme);
    return [...traditional(j), ...listed.rectified.flatMap(word => rectified({ stem: prefix + word, ending: '' }))];
  },
};

/** The spelling rules, in the order of GD §4.4, then the listed spellings. */
export const frenchOrthography: readonly Rule[] = [
  elerEter, muteEGrave, closedEGrave, cCedilla, gE, yToI, diaeresis, tAfterDental, ttSingular, circumflexBeforeT, croitreHomograph,
  circumflex1990, assoir1990, interpeler1990, absout1990, listedSpelling,
];
