/**
 * Dutch spelling at the stem/ending boundary: the d or t of a weak past tense and past participle ('t kofschip, decided
 * on the stem as pronounced, so leven takes -de although its stem is written leef), a long a written aa before -t
 * (gaat), and ge- before a weak past participle, with a diaeresis before e, i or u (geëindigd) but not before ui or ij (geuit). A prefix that keeps
 * ge- out (verhuisd) is recorded by the participle's ending.
 */
import { step } from '../../core/derivation.js';
import type { DerivationStep } from '../../core/derivation.js';
import { one } from '../../core/fork.js';
import type { JunctureRule } from '../../core/juncture.js';
import type { Cell } from '../../core/staged.js';
import type { DutchLexeme } from './lexicon.js';
import { dutchRules } from './rules.js';

export type SpellingContext = { readonly lexeme: DutchLexeme; readonly cell: Cell };

/** The d or t a weak ending starts with, and the step that says why. */
export interface Dental {
  readonly dental: 'd' | 't';
  /** The step that explains the choice, for the word `after` that has the ending. */
  readonly steps: (after: string) => readonly DerivationStep[];
}

/** The last sound of a pronounced stem: ch or sh, or the last letter. */
const lastSound = /(?:ch|sh|.)$/u;
/** The stem ends in a voiceless sound: the sounds of 't kofschip, and sh, x, c and h, which are voiceless too. */
const voiceless = /(?:ch|sh|[tkfschpx])$/u;
/** The sounds of 't kofschip themselves. */
const kofschip: ReadonlySet<string> = new Set(['t', 'k', 'f', 's', 'ch', 'p']);

/**
 * The consonants a weak ending can start with, in output order. The loan table or a `pastSuffix` hint gives them (d, t,
 * or both for a stem pronounced either way: `nl.orth.dental-given`); otherwise the stem as pronounced decides, without
 * a final silent e: t after a sound of 't kofschip (`nl.orth.dental-kofschip`) or after another voiceless sound, sh, x,
 * c or h (`nl.orth.dental-voiceless`), d after anything else.
 */
export function dentals(lexeme: DutchLexeme): readonly Dental[] {
  const given = lexeme.hints.pastSuffix ?? lexeme.loan?.pastSuffix;
  const givenStep = (dental: 'd' | 't') => (after: string) => [step(dutchRules['nl.orth.dental-given'], lexeme.base, after, { dental })];
  if (given === 'both') return [{ dental: 'd', steps: givenStep('d') }, { dental: 't', steps: givenStep('t') }];
  if (given !== undefined) return [{ dental: given, steps: givenStep(given) }];
  const pronounced = lexeme.stem.underlying.replace(/e$/u, '');
  const dental = voiceless.test(pronounced) ? 't' : 'd';
  const sound = pronounced.match(lastSound)?.[0] ?? pronounced;
  return [{
    dental,
    steps: after => [dental === 't' && !kofschip.has(sound)
      ? step(dutchRules['nl.orth.dental-voiceless'], lexeme.stem.underlying, after, { sound })
      : step(dutchRules['nl.orth.dental-kofschip'], lexeme.stem.underlying, after, { sound, dental })],
  }];
}

const isPresent = (cell: Cell): boolean => cell.kind === 'finite' && cell.mood === 'indicative' && cell.tense === 'present';
const isParticiple = (cell: Cell): boolean => cell.kind === 'nonFinite' && cell.form === 'participle';
/** A word such as e-mail starts with a letter and a hyphen: ge- is joined with a hyphen. */
const hyphenated = /^\p{L}-/u;
const diaeresis: Readonly<Record<string, string>> = { e: 'ë', i: 'ï', u: 'ü' };
/** The diaeresis ge- puts on the first letter of `stem`, if any: never on the first letter of ui or ij (geuit, geijkt; Leidraad 7.4). */
const tremaOf = (stem: string): string | undefined => (/^(?:ui|ij)/u.test(stem) ? undefined : diaeresis[stem.charAt(0)]);

/** A stem ending in a single long a writes it aa before -t, in the closed syllable: ga + t → gaat. */
const doubleA: JunctureRule<SpellingContext> = {
  info: dutchRules['nl.orth.double-a'],
  apply: (j, { cell }) => isPresent(cell) && j.ending === 't' && /(^|[^a])a$/u.test(j.stem)
    ? one({ stem: `${j.stem}a`, ending: j.ending }) : null,
};

/** A weak past participle starts with ge- (ge- before a word with a hyphen), unless an unstressed prefix keeps it out. */
const gePrefix: JunctureRule<SpellingContext> = {
  info: dutchRules['nl.part.ge-prefix'],
  apply: (j, { lexeme, cell }) => isParticiple(cell) && !lexeme.inseparablePrefix && (hyphenated.test(j.stem) || !tremaOf(j.stem))
    ? one({ stem: `${hyphenated.test(j.stem) ? 'ge-' : 'ge'}${j.stem}`, ending: j.ending }) : null,
};

/** ge- before e, i or u: the vowel gets a diaeresis (geëindigd). */
const geDiaeresis: JunctureRule<SpellingContext> = {
  info: dutchRules['nl.part.ge-diaeresis'],
  apply: (j, { lexeme, cell }) => {
    const marked = tremaOf(j.stem);
    if (!isParticiple(cell) || lexeme.inseparablePrefix || hyphenated.test(j.stem) || marked === undefined) return null;
    return one({ stem: `ge${marked}${j.stem.slice(1)}`, ending: j.ending });
  },
  describe: before => ({ vowel: before.stem.charAt(0) }),
};

/** The spelling rules of the staged grammar, in the order they apply. */
export const dutchOrthography: readonly JunctureRule<SpellingContext>[] = [doubleA, gePrefix, geDiaeresis];
