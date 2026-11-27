/**
 * English classification (design §3): normalise the infinitive, read the lexicon (one outcome per paradigm), inherit
 * through a closed list of prefixes, default to regular, apply the hints, then record the spelling-relevant lexical
 * facts and, where the spelling depends on them and nothing records them, the assumptions (stress, -s or -es).
 * Assumption steps come first. A hint overrides an assumption; a hint that contradicts a recorded lexical fact is an
 * INVALID_HINT.
 */
import { step } from '../../core/derivation.js';
import type { DerivationStep } from '../../core/derivation.js';
import type { Fork, Outcome, VariantTags } from '../../core/fork.js';
import { applyJunctureRules } from '../../core/juncture.js';
import type { LexemeBase } from '../../core/staged.js';
import { ConjugationError } from '../../errors.js';
import { needsStress, onset, vowelGroups } from './letters.js';
import {
  consonantVariants, doublesUnstressed, finalStress, inheritPrefixes, irregulars, keepsE, keepsEBritish, legalOnsets, lNotDoubled,
  modals, mostlyImperative, neverBase, noDoubling, noInherit, nonFinalStress, notModal, plainS, sideListed, stressPrefixes, sVariant,
  takesEs,
} from './lexicon.js';
import type { Alternate, ConsonantVariant } from './lexicon.js';
import { englishOrthography } from './orthography.js';
import { englishRules } from './rules.js';
import { checkedIn } from './sources.js';
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
  /** `stress`: a final consonant doubles in a stressed last syllable; `always`: whatever the stress; `never`: it is silent (debut). */
  readonly doubling: 'stress' | 'always' | 'never';
  /** A single-consonant variant beside the doubled form (kidnaped), or the single form preferred (bused). */
  readonly consonantVariant: ConsonantVariant | null;
  readonly keepsE: boolean;
  /** Drops its e before -ing, with a British variant that keeps it (aging, ageing). */
  readonly keepsEBritish: boolean;
  /** Takes only -s where spelling would add -es (solos, stomachs): from the lexicon or the `sEnding` hint. */
  readonly plainS: boolean;
  /** Takes -es and also -s only (tangoes, tangos). */
  readonly sVariant: boolean;
  /** Keeps one l in standard spelling, with a doubled British variant (paralleled, parallelled). */
  readonly lNotDoubled: boolean;
}

const rules = englishRules;

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

/** One paradigm as the lexicon or a rule reads it, before the hints, the flags and the assumptions. */
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
/** An alternate both dictionaries print, neither regional nor marked by usage: the only kind a prefixed verb inherits. */
const unmarked = (alternate: Alternate): boolean => alternate.region === undefined && alternate.usage === undefined && alternate.source === undefined;

function lexiconStep(lexeme: EnglishLexeme): DerivationStep {
  return step(rules['en.classify.lexicon'], lexeme.lemma, null, {
    past: alternatesText(lexeme, lexeme.past), participle: alternatesText(lexeme, lexeme.participle), source: checkedIn(lexeme.lemma),
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
    const identity = several && paradigm.label !== undefined
      ? [step(rules['en.classify.homograph'], lemma, null, { paradigm: paradigm.label })] : [];
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

/**
 * A prefixed verb's forms: the base's first paradigm, unmarked forms only (no regional, literary or one-dictionary variant of
 * the base: rewritten, never *rewrit), written after the prefix; null when no listed form is left (the verb is then
 * read as regular).
 */
function inheritedReading(lemma: string): Reading | null {
  const split = inheritance(lemma);
  if (split === null) return null;
  const [paradigm] = irregulars[split.base]!.paradigms;
  const inherit = (alternates: readonly Alternate[]): Alternate[] => alternates
    .filter(unmarked)
    .map(alternate => alternate.form === null ? alternate : { ...alternate, form: split.prefix + alternate.form });
  const past = inherit(paradigm!.past);
  const participle = inherit(paradigm!.participle);
  if (!hasListed(past) && !hasListed(participle)) return null;
  return {
    classId: 'irregular', classSource: 'lexicon', past, participle, prefix: split.prefix, listedFinalStress: false, identity: [],
    classSteps: [step(rules['en.classify.prefixed'], lemma, null, { prefix: split.shownPrefix, base: split.shownBase })],
    listedStep: false, tags: {},
  };
}

/** Whether the lexicon knows `lemma`: listed, inherited, known regular or recorded in a side list. */
function known(lemma: string): boolean {
  return Object.hasOwn(irregulars, lemma) || Object.hasOwn(noInherit, lemma) || inheritance(lemma) !== null || sideListed(lemma);
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
  if (Object.hasOwn(noInherit, lemma)) {
    return [regularReading('lexicon', [step(rules['en.classify.no-inherit'], lemma, null, { ...noInherit[lemma]!, source: checkedIn(lemma) })])];
  }
  const inherited = inheritedReading(lemma);
  if (inherited !== null) return [inherited];
  if (sideListed(lemma)) return [regularReading('lexicon', [step(rules['en.classify.listed-regular'], lemma, null, { source: checkedIn(lemma) })])];
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

/**
 * The readings that keep a form in each listed cell for the `region` asked: a cell whose every listed or -ed form is
 * labelled for the other region has none. A query that leaves no reading (spell with classHint regular and region GB:
 * only the American spelled) is an INVALID_HINT naming the region.
 */
function withRegion(lemma: string, readings: readonly Reading[], region: unknown): Reading[] {
  if (region !== 'GB' && region !== 'US') return [...readings];
  const keeps = (alternates: readonly Alternate[]): boolean => !alternates.length || alternates.some(a => a.region === undefined || a.region === region);
  const kept = readings.filter(reading => keeps(reading.past) && keeps(reading.participle));
  if (!kept.length) {
    throw new ConjugationError('INVALID_HINT', `${lemma} has no such forms in ${region === 'GB' ? 'British' : 'American'} spelling: leave out the region or the class hint.`);
  }
  return kept;
}

/** With `region: 'US'`, the forms AHD prints first come first (burned, lighted); the order is otherwise LDOCE's. */
function americanOrder(reading: Reading): Reading {
  const order = (alternates: readonly Alternate[]): Alternate[] => [...alternates.filter(a => a.americanFirst), ...alternates.filter(a => !a.americanFirst)];
  return { ...reading, past: order(reading.past), participle: order(reading.participle) };
}

/** Where the stress falls (design §3 step 7), and the step that says so; a hint that contradicts listed stress is refused. */
function stressOf(lemma: string, reading: Reading, hint: unknown): { readonly final: boolean; readonly steps: readonly DerivationStep[] } {
  if (vowelGroups(lemma) <= 1) return { final: true, steps: [] };
  const listed = finalStress.has(lemma) || reading.listedFinalStress ? 'final' : nonFinalStress.has(lemma) ? 'nonFinal' : null;
  if (listed !== null) {
    if ((hint === 'final' || hint === 'nonFinal') && hint !== listed) {
      throw new ConjugationError('INVALID_HINT', `${lemma} is stressed on ${listed === 'final' ? 'its last syllable' : 'an earlier syllable'} (LDOCE, AHD); the stress hint contradicts it.`);
    }
    return { final: listed === 'final', steps: [step(rules['en.classify.stress-listed'], lemma, null, { stress: listed })] };
  }
  if (hint === 'final' || hint === 'nonFinal') {
    return { final: hint === 'final', steps: [step(rules['en.classify.stress-hint'], lemma, null, { stress: hint })] };
  }
  if (reading.prefix !== null) return { final: true, steps: [] };
  const prefix = prefixParse(lemma);
  if (prefix !== null) return { final: true, steps: [step(rules['en.classify.assume-final-stress'], lemma, null, { prefix })] };
  return { final: false, steps: [step(rules['en.classify.assume-nonfinal-stress'], lemma, null)] };
}

/**
 * Whether -s or -es follows a final o or ch, which spelling cannot tell: the letters, or null when spelling decides
 * (-tch, a consonant + ch and a vowel pair + ch sound /tʃ/; a vowel + o takes -s).
 */
function esLetters(lemma: string): 'o' | 'ch' | null {
  if (/[^aeiou]o$/u.test(lemma)) return 'o';
  return /(?:^|[^aeiou])[aeiouy]ch$/u.test(lemma) ? 'ch' : null;
}

/** Whether the verb takes only -s where spelling would add -es, and the step that says so (design §4.4 #1, #2). */
function sEndingOf(lemma: string, reading: Reading, hint: unknown): { readonly plain: boolean; readonly steps: readonly DerivationStep[] } {
  const letters = esLetters(lemma);
  if (letters === null) return { plain: false, steps: [] };
  const listed = plainS.has(lemma) ? 's' : takesEs.has(lemma) || reading.classSource === 'lexicon' ? 'es' : null;
  if (listed !== null) {
    if ((hint === 's' || hint === 'es') && hint !== listed) {
      throw new ConjugationError('INVALID_HINT', `${lemma} takes -${listed} (LDOCE, AHD); the sEnding hint contradicts it.`);
    }
    return { plain: listed === 's', steps: listed === 's' ? [step(rules['en.classify.plain-s'], lemma, null)] : [] };
  }
  if (hint === 's' || hint === 'es') return { plain: hint === 's', steps: [step(rules['en.classify.es-hint'], lemma, null, { ending: hint })] };
  return { plain: false, steps: [step(rules['en.classify.assume-es'], lemma, null, { letters })] };
}

/** The lexeme of one reading, with its lexical-fact steps and its assumptions, assumptions first. */
function lexemeOutcome(lemma: string, reading: Reading, query: Readonly<Record<string, unknown>>): Outcome<EnglishLexeme> {
  const doubling = noDoubling.has(lemma) ? 'never' : doublesUnstressed.has(lemma) ? 'always' : 'stress';
  const variant = Object.hasOwn(consonantVariants, lemma) ? consonantVariants[lemma]! : null;
  const ending = sEndingOf(lemma, reading, query.sEnding);
  const flags = { keepsE: keepsE.has(lemma), keepsEBritish: keepsEBritish.has(lemma), lNotDoubled: lNotDoubled.has(lemma), sVariant: sVariant.has(lemma) };
  // The stress decides the spelling only where a final consonant may double and nothing else decides it.
  const stressMatters = needsStress(lemma) && doubling === 'stress' && !flags.lNotDoubled;
  const stress = stressMatters ? stressOf(lemma, reading, query.stress) : { final: vowelGroups(lemma) <= 1 || reading.prefix !== null, steps: [] };
  const factSteps = [
    ...(notModal.has(lemma) ? [step(rules['en.classify.not-modal'], lemma, null)] : []),
    ...(mostlyImperative.has(lemma) ? [step(rules['en.classify.mostly-imperative'], lemma, null)] : []),
    ...(flags.keepsE ? [step(rules['en.classify.keeps-e'], lemma, null)] : []),
    ...(flags.lNotDoubled ? [step(rules['en.classify.l-not-doubled'], lemma, null)] : []),
    ...(doubling === 'always' ? [step(rules['en.classify.doubles-unstressed'], lemma, null)] : []),
    ...(doubling === 'never' ? [step(rules['en.classify.silent-consonant'], lemma, null)] : []),
  ];
  const lexeme: EnglishLexeme = {
    lemma, verbId: lemma, classId: reading.classId, classSource: reading.classSource, reflexive: false, auxiliaries: ['have'],
    particle: null, past: reading.past, participle: reading.participle, prefix: reading.prefix, finalStress: stress.final, doubling,
    consonantVariant: variant, plainS: ending.plain, ...flags,
  };
  const classSteps = reading.listedStep ? [lexiconStep(lexeme)] : reading.classSteps;
  const steps = [...reading.identity, ...classSteps, ...factSteps, ...ending.steps, ...stress.steps];
  return {
    value: lexeme,
    steps: [...steps.filter(s => s.kind === 'assumption'), ...steps.filter(s => s.kind !== 'assumption')],
    tags: reading.tags,
  };
}

/** The lemma of an infinitive: a leading `to` dropped; one word of plain letters, not a modal. */
function lemmaOf(infinitive: unknown): string {
  const text = String(infinitive);
  const lemma = text.startsWith('to ') ? text.slice(3) : text;
  // A hyphen only in a lemma the dictionaries print with one (spoon-feed, lip-read, gift-wrap).
  const listedHyphen = /^[a-z]+-[a-z]+$/u.test(lemma) && (Object.hasOwn(irregulars, lemma) || sideListed(lemma));
  if (!/^[a-z]+$/u.test(lemma) && !listedHyphen) throw new ConjugationError('INVALID_INFINITIVE', 'Give one English verb without particles, e.g. walk.');
  if (modals.has(lemma)) throw new ConjugationError('INVALID_INFINITIVE', `${lemma} is a modal verb; modal verbs are not conjugated.`);
  return lemma;
}

/** One outcome per paradigm of the queried verb (design §3). */
export function classifyEnglish(query: Readonly<Record<string, unknown>>): Fork<EnglishLexeme> {
  const lemma = lemmaOf(query.infinitive);
  const hinted = withClassHint(lemma, readingsOf(lemma, query.stems as EnglishStemHints | undefined), query.classHint as EnglishClassHint | undefined);
  return withRegion(lemma, hinted, query.region).map(reading => lexemeOutcome(lemma, query.region === 'US' ? americanOrder(reading) : reading, query));
}

/** The lexeme of a verb in its first paradigm, without hints: an auxiliary a periphrasis names (be, have). */
export function englishLexemeOf(lemma: string): EnglishLexeme {
  return classifyEnglish({ infinitive: lemma })[0]!.value;
}
