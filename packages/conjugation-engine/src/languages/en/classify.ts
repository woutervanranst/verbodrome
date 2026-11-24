/**
 * English classification (design §3): normalise the infinitive, read the lexicon (one outcome per paradigm), inherit
 * through a closed list of prefixes, default to regular, apply the hints, then record the spelling-relevant lexical
 * flags and, when doubling depends on it, where the stress falls.
 */
import { step } from '../../core/derivation.js';
import type { DerivationStep } from '../../core/derivation.js';
import type { Fork, Outcome, VariantTags } from '../../core/fork.js';
import { applyJunctureRules } from '../../core/juncture.js';
import type { LexemeBase } from '../../core/staged.js';
import { ConjugationError } from '../../errors.js';
import { needsStress, onset, vowelGroups } from './letters.js';
import {
  doublesUnstressed, finalStress, inheritPrefixes, irregulars, keepsE, legalOnsets, lNotDoubled, modals, neverBase, noInherit,
  nonFinalStress, plainS, stressPrefixes,
} from './lexicon.js';
import type { Alternate } from './lexicon.js';
import { englishOrthography } from './orthography.js';
import { englishRules } from './rules.js';
import type { EnglishClassHint, EnglishStemHints } from './spec.js';

export interface EnglishLexeme extends LexemeBase {
  readonly classId: 'regular' | 'irregular' | 'suppletive';
  /** The past alternates in order of preference; [] is the regular -ed past. */
  readonly past: readonly Alternate[];
  /** The past participle alternates in order of preference; [] is the regular -ed participle. */
  readonly participle: readonly Alternate[];
  /** For a verb inheriting a listed verb's forms (outswim), the prefix those forms are written after; otherwise null. */
  readonly prefix: string | null;
  /** The last syllable is stressed: monosyllables, inherited verbs, listed verbs and the stress decision's outcome. */
  readonly finalStress: boolean;
  /** `stress`: a final consonant doubles in a stressed last syllable; `always`: whatever the stress; `alwaysUsSingle`: and American spelling may keep one. */
  readonly doubling: 'stress' | 'always' | 'alwaysUsSingle';
  readonly keepsE: boolean;
  readonly plainS: boolean;
  readonly lNotDoubled: boolean;
}

const rules = englishRules;

// --- Stress ------------------------------------------------------------------------------------------------------

export { needsStress, vowelGroups } from './letters.js';

/** The prefix of a prefix + one-syllable-root parse (re·blit, pre·fer, con·trol), or null (design §3). */
export function prefixParse(word: string): string | null {
  for (const prefix of stressPrefixes) {
    if (!word.startsWith(prefix)) continue;
    const root = word.slice(prefix.length);
    if (root.length >= 3 && vowelGroups(root) === 1 && legalOnsets.has(onset(root))) return prefix;
  }
  return null;
}

// --- Readings: the paradigms before the hints, flags and stress --------------------------------------------------------

/** One paradigm as the lexicon or a rule reads it, before the hints, the flags and the stress decision. */
interface Reading {
  readonly classId: EnglishLexeme['classId'];
  readonly classSource: EnglishLexeme['classSource'];
  readonly past: readonly Alternate[];
  readonly participle: readonly Alternate[];
  readonly prefix: string | null;
  readonly listedFinalStress: boolean;
  /** Steps that say which paradigm this is (homograph); kept when a hint narrows it. */
  readonly identity: readonly DerivationStep[];
  /** Steps that say how the class was found; a hint replaces them. */
  readonly classSteps: readonly DerivationStep[];
  /** The class comes from the lexicon's listed forms: the lexicon step names them, once the lexeme can spell the -ed form. */
  readonly listedStep: boolean;
  readonly tags: VariantTags;
}

/** The regular -ed form of a lexeme, spelled by the spelling rules (betted, dived, thrived). */
function regularForm(lexeme: EnglishLexeme): string {
  const [spelled] = applyJunctureRules(englishOrthography, { stem: lexeme.lemma, ending: 'ed' }, { lexeme, cell: { kind: 'nonFinite', form: 'pastParticiple' } });
  return spelled!.value.stem + spelled!.value.ending;
}

/** The alternates as a learner reads them: `swam`, `learned / learnt`, `thrived / throve`. */
function alternatesText(lexeme: EnglishLexeme, alternates: readonly Alternate[]): string {
  return alternates.length ? alternates.map(alternate => alternate.form ?? regularForm(lexeme)).join(' / ') : regularForm(lexeme);
}

const hasListed = (alternates: readonly Alternate[]): boolean => alternates.some(alternate => alternate.form !== null);
const hasRegular = (alternates: readonly Alternate[]): boolean => !alternates.length || alternates.some(alternate => alternate.form === null);

function lexiconStep(lexeme: EnglishLexeme): DerivationStep {
  return step(rules['en.classify.lexicon'], lexeme.lemma, null, {
    past: alternatesText(lexeme, lexeme.past), participle: alternatesText(lexeme, lexeme.participle),
  });
}

/** A verb read as regular, with `steps` saying why. */
function regularReading(classSource: EnglishLexeme['classSource'], classSteps: readonly DerivationStep[]): Reading {
  return {
    classId: 'regular', classSource, past: [], participle: [], prefix: null, listedFinalStress: false, identity: [], classSteps,
    listedStep: false, tags: {},
  };
}

/** The listed paradigms of `lemma`: one outcome each, tagged with their label and meaning when there are several. */
function listedReadings(lemma: string): Reading[] {
  const entry = irregulars[lemma]!;
  const several = entry.paradigms.length > 1;
  return entry.paradigms.map(paradigm => {
    const irregular = hasListed(paradigm.past) || hasListed(paradigm.participle);
    const identity = several && paradigm.meaning !== undefined
      ? [step(rules['en.classify.homograph'], lemma, null, { meaning: paradigm.meaning })] : [];
    const classId = lemma === 'be' ? 'suppletive' : irregular ? 'irregular' : 'regular';
    const classSteps = classId === 'suppletive' ? [step(rules['en.classify.suppletive'], lemma, null)] : [];
    const tags: VariantTags = several ? {
      ...(paradigm.label === undefined ? {} : { pattern: paradigm.label }),
      ...(paradigm.meaning === undefined ? {} : { condition: paradigm.meaning }),
    } : {};
    return {
      classId, classSource: 'lexicon', past: paradigm.past, participle: paradigm.participle, prefix: null,
      listedFinalStress: entry.finalStress === true, identity, classSteps, listedStep: classId === 'irregular', tags,
    };
  });
}

/** A listed verb that can be the base of a prefixed verb. */
const isBase = (word: string): boolean => word.length >= 2 && Object.hasOwn(irregulars, word) && !neverBase.has(word);

/** How `lemma` splits into prefix + listed verb, with at most two prefixes (mis + under + stand), or null. */
function inheritance(lemma: string): { readonly prefix: string; readonly base: string; readonly shownPrefix: string; readonly shownBase: string } | null {
  for (const prefix of inheritPrefixes) {
    if (!lemma.startsWith(prefix)) continue;
    const rest = lemma.slice(prefix.length);
    if (isBase(rest)) return { prefix, base: rest, shownPrefix: prefix, shownBase: rest };
    for (const inner of inheritPrefixes) {
      const root = rest.slice(inner.length);
      if (rest.startsWith(inner) && isBase(root)) return { prefix: prefix + inner, base: root, shownPrefix: prefix, shownBase: rest };
    }
  }
  return null;
}

/** The first prefix + listed verb a no-inherit verb looks like, for its step (welcome is wel + come). */
function lookalike(lemma: string): { readonly prefix: string; readonly base: string } {
  const split = inheritance(lemma);
  if (split !== null) return { prefix: split.shownPrefix, base: split.shownBase };
  const base = Object.keys(irregulars).filter(verb => lemma.endsWith(verb) && verb.length < lemma.length).sort((a, b) => b.length - a.length)[0];
  return base === undefined ? { prefix: lemma, base: '' } : { prefix: lemma.slice(0, -base.length), base };
}

/** A prefixed verb's forms: the base's first paradigm, standard usage only, written after the prefix. */
function inheritedReading(lemma: string, split: NonNullable<ReturnType<typeof inheritance>>): Reading {
  const [paradigm] = irregulars[split.base]!.paradigms;
  const inherit = (alternates: readonly Alternate[]): Alternate[] => alternates
    .filter(alternate => alternate.usage === undefined)
    .map(alternate => alternate.form === null ? alternate : { ...alternate, form: split.prefix + alternate.form });
  const past = inherit(paradigm!.past);
  const participle = inherit(paradigm!.participle);
  return {
    classId: hasListed(past) || hasListed(participle) ? 'irregular' : 'regular', classSource: 'lexicon', past, participle,
    prefix: split.prefix, listedFinalStress: false, identity: [],
    classSteps: [step(rules['en.classify.prefixed'], lemma, null, { prefix: split.shownPrefix, base: split.shownBase })],
    listedStep: false, tags: {},
  };
}

/** Whether the lexicon knows `lemma`: listed, inherited or known regular. */
function known(lemma: string): boolean {
  return Object.hasOwn(irregulars, lemma) || noInherit.has(lemma) || inheritance(lemma) !== null;
}

/** The paradigms of `lemma` before the class hint: from the stems hint, the lexicon, a prefix, or the regular default. */
function readingsOf(lemma: string, stems: EnglishStemHints | undefined): Reading[] {
  if (stems !== undefined) {
    if (known(lemma)) {
      throw new ConjugationError('INVALID_HINT', `${lemma} is in the lexicon, so it takes no stems hint: that is for a verb the lexicon does not know.`);
    }
    const past = [{ form: stems.past! }];
    const participle = [{ form: stems.pastParticiple! }];
    return [{
      classId: 'irregular', classSource: 'explicitHint', past, participle, prefix: null, listedFinalStress: false, identity: [],
      classSteps: [step(rules['en.classify.hint-irregular'], lemma, null, { past: stems.past!, participle: stems.pastParticiple! })],
      listedStep: false, tags: {},
    }];
  }
  if (Object.hasOwn(irregulars, lemma)) return listedReadings(lemma);
  if (noInherit.has(lemma)) return [regularReading('lexicon', [step(rules['en.classify.no-inherit'], lemma, null, lookalike(lemma))])];
  const split = inheritance(lemma);
  if (split !== null) return [inheritedReading(lemma, split)];
  return [regularReading('regularRule', [step(rules['en.classify.assume-regular'], lemma, null)])];
}

/**
 * The readings a class hint keeps. `regular` keeps a regular paradigm and narrows one that has -ed in both cells to
 * its -ed forms (hanged; learned); `irregular` drops regular paradigms and narrows each cell to its listed forms
 * where it has any (hung; learnt). A hint that keeps nothing is an INVALID_HINT.
 */
function withClassHint(lemma: string, readings: readonly Reading[], hint: EnglishClassHint | undefined): Reading[] {
  if (hint === undefined) return [...readings];
  if (hint === 'regular') {
    const kept = readings.filter(reading => hasRegular(reading.past) && hasRegular(reading.participle));
    if (!kept.length) throw new ConjugationError('INVALID_HINT', `${lemma} has no regular -ed forms.`);
    const regularOnly = (alternates: readonly Alternate[]): Alternate[] => alternates.filter(alternate => alternate.form === null);
    return kept.map(reading => ({
      ...reading, classId: 'regular', past: regularOnly(reading.past), participle: regularOnly(reading.participle), prefix: null,
      classSteps: [step(rules['en.classify.hint-regular'], lemma, null)], listedStep: false,
    }));
  }
  const kept = readings.filter(reading => reading.classId !== 'regular');
  if (!kept.length) throw new ConjugationError('INVALID_HINT', `${lemma} is a regular verb: it has no irregular forms.`);
  const listedOnly = (alternates: readonly Alternate[]): readonly Alternate[] =>
    hasListed(alternates) ? alternates.filter(alternate => alternate.form !== null) : alternates;
  return kept.map(reading => ({ ...reading, past: listedOnly(reading.past), participle: listedOnly(reading.participle) }));
}

/** Where the stress falls (design §3 step 7), and the step that says so. */
function stressOf(lemma: string, reading: Reading, hint: unknown): { readonly final: boolean; readonly steps: readonly DerivationStep[] } {
  if (vowelGroups(lemma) <= 1) return { final: true, steps: [] };
  if (hint === 'final' || hint === 'nonFinal') {
    return { final: hint === 'final', steps: [step(rules['en.classify.stress-hint'], lemma, null, { stress: hint })] };
  }
  if (reading.prefix !== null) return { final: true, steps: [] };
  if (finalStress.has(lemma) || reading.listedFinalStress) {
    return { final: true, steps: [step(rules['en.classify.stress-listed'], lemma, null, { stress: 'final' })] };
  }
  if (nonFinalStress.has(lemma)) return { final: false, steps: [step(rules['en.classify.stress-listed'], lemma, null, { stress: 'nonFinal' })] };
  const prefix = prefixParse(lemma);
  if (prefix !== null) return { final: true, steps: [step(rules['en.classify.assume-final-stress'], lemma, null, { prefix })] };
  return { final: false, steps: [step(rules['en.classify.assume-nonfinal-stress'], lemma, null)] };
}

/** The lexeme of one reading, with its flag steps and, when doubling depends on it, its stress step. */
function lexemeOutcome(lemma: string, reading: Reading, stressHint: unknown): Outcome<EnglishLexeme> {
  const unstressed = Object.hasOwn(doublesUnstressed, lemma) ? doublesUnstressed[lemma]! : null;
  const doubling = unstressed === null ? 'stress' : unstressed.usSingle ? 'alwaysUsSingle' : 'always';
  const stress = stressOf(lemma, reading, stressHint);
  const flags = { keepsE: keepsE.has(lemma), plainS: plainS.has(lemma), lNotDoubled: lNotDoubled.has(lemma) };
  const flagSteps = [
    ...(flags.keepsE ? [step(rules['en.classify.keeps-e'], lemma, null)] : []),
    ...(flags.plainS ? [step(rules['en.classify.plain-s'], lemma, null)] : []),
    ...(flags.lNotDoubled ? [step(rules['en.classify.l-not-doubled'], lemma, null)] : []),
    ...(unstressed !== null ? [step(rules['en.classify.doubles-unstressed'], lemma, null)] : []),
  ];
  const stressMatters = needsStress(lemma) && doubling === 'stress';
  const lexeme: EnglishLexeme = {
    lemma, verbId: lemma, classId: reading.classId, classSource: reading.classSource, reflexive: false, auxiliaries: ['have'],
    particle: null, past: reading.past, participle: reading.participle, prefix: reading.prefix, finalStress: stress.final, doubling,
    ...flags,
  };
  const classSteps = reading.listedStep ? [lexiconStep(lexeme)] : reading.classSteps;
  return {
    value: lexeme,
    steps: [...reading.identity, ...classSteps, ...flagSteps, ...(stressMatters ? stress.steps : [])],
    tags: reading.tags,
  };
}

/** The lemma of an infinitive: a leading `to` dropped; one word of plain letters, not a modal. */
function lemmaOf(infinitive: unknown): string {
  const text = String(infinitive);
  const lemma = text.startsWith('to ') ? text.slice(3) : text;
  if (!/^[a-z]+$/u.test(lemma)) throw new ConjugationError('INVALID_INFINITIVE', 'Give one English verb without particles, e.g. walk.');
  if (modals.has(lemma)) throw new ConjugationError('INVALID_INFINITIVE', `${lemma} is a modal verb; modal verbs are not conjugated.`);
  return lemma;
}

/** One outcome per paradigm of the queried verb (design §3). */
export function classifyEnglish(query: Readonly<Record<string, unknown>>): Fork<EnglishLexeme> {
  const lemma = lemmaOf(query.infinitive);
  const readings = withClassHint(lemma, readingsOf(lemma, query.stems as EnglishStemHints | undefined), query.classHint as EnglishClassHint | undefined);
  return readings.map(reading => lexemeOutcome(lemma, reading, query.stress));
}

/** The lexeme of a verb in its first paradigm, without hints: an auxiliary a periphrasis names (be, have). */
export function englishLexemeOf(lemma: string): EnglishLexeme {
  return classifyEnglish({ infinitive: lemma })[0]!.value;
}
