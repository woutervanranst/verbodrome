/**
 * German classification (GD §3.2): the paradigms of a lemma, each a lexeme with the steps that classified it. Hints come
 * first and narrow or override; then the lemma is looked up (as written, then read with ß and umlauts), split into a
 * separable particle, an inseparable prefix and a root, and the root's parts are inherited; what is not listed is weak,
 * takes haben and is stressed on its first syllable, each recorded as an assumption.
 */
import { step } from '../../core/derivation.js';
import type { DerivationStep } from '../../core/derivation.js';
import { mergeTags } from '../../core/fork.js';
import type { Fork, Outcome, VariantTags } from '../../core/fork.js';
import type { LexemeBase } from '../../core/grammar.js';
import { ConjugationError } from '../../errors.js';
import { isPlausibleRoot, splitDerivative } from '../shared/germanic.js';
import {
  denominalPrefixes, derivativeAuxiliaries, dualPrefixLemmas, germanLexicon, germanParticles, impersonalVerbs, inseparableReadings,
  lookalikes, noInherit, nonInitialStress, shortRootDerivatives, weakWithSein,
} from './lexicon.js';
import type { Alternate, AuxiliaryUse, DualEntry, GermanEntry, PrefixReading, WeakEntry } from './lexicon.js';
import { germanRules } from './rules.js';
import type { GermanClassHint, GermanStemHints } from './spec.js';

export type Conjugation = 'weak' | 'strong' | 'mixed' | 'preteritePresent' | 'irregular';
export type LexemeFlag = 'thirdPersonOnly' | 'noImperative' | 'impersonal';

export interface GermanLexeme extends LexemeBase {
  /** The word without its separable particle: 'verschlafen', 'erkennen'. */
  readonly base: string;
  /** The lexicon or unlisted root: 'schlafen', 'kennen', 'schlinken'. */
  readonly root: string;
  /** The inseparable prefix of `base`: 'ver', or a root's own ('be' in befehlen). */
  readonly prefix: string | null;
  readonly conjugation: Conjugation;
  /** The root's entry with the prefix already prepended to every stored part; null for a weak verb. */
  readonly entry: GermanEntry | null;
  /** The perfect auxiliaries with their conditions; `auxiliaries` are their verbs, in order. */
  readonly auxiliaryUses: readonly AuxiliaryUse[];
  /** Why Partizip II has no ge-: an unstressed prefix, or the stress of the verb; null when it has ge-. */
  readonly geBlocked: 'prefix' | 'stress' | null;
  readonly flags: ReadonlySet<LexemeFlag>;
  /** A Partizip II with ge- that a verb without ge- also has (gebenedeit beside benedeit), or null. */
  readonly participleWithGe: string | null;
}

const rules = germanRules;
const sep = germanParticles.separable;
const dual = germanParticles.dual;
const inseparable = germanParticles.inseparable;

type Hints = {
  readonly separablePrefix?: string;
  readonly inseparablePrefix?: string;
  readonly classHint?: GermanClassHint;
  readonly stems?: GermanStemHints;
  readonly auxiliary?: 'haben' | 'sein';
};

const invalidHint = (message: string): never => { throw new ConjugationError('INVALID_HINT', message); };

// ---------------------------------------------------------------------------------------------------------------------
// Lookups

const listedWeak = (word: string): boolean =>
  Object.hasOwn(weakWithSein, word) || lookalikes.includes(word) || impersonalVerbs.includes(word) || Object.hasOwn(nonInitialStress, word);

/** Whether `word` is a lemma the lexicon or a side list names. */
function isListed(word: string): boolean {
  return Object.hasOwn(germanLexicon, word) || listedWeak(word) || Object.hasOwn(noInherit, word) || Object.hasOwn(dualPrefixLemmas, word)
    || Object.hasOwn(inseparableReadings, word) || Object.hasOwn(derivativeAuxiliaries, word) || Object.hasOwn(shortRootDerivatives, word);
}

/** Every spelling of `word` with ae, oe, ue read as ä, ö, ü and ss as ß, in any combination (the word itself excluded). */
function readings(word: string): string[] {
  const pieces = word.split(/(ae|oe|ue|ss)/u);
  let spellings = [''];
  for (const piece of pieces) {
    const options = piece === 'ae' ? ['ae', 'ä'] : piece === 'oe' ? ['oe', 'ö'] : piece === 'ue' ? ['ue', 'ü'] : piece === 'ss' ? ['ss', 'ß'] : [piece];
    spellings = spellings.flatMap(start => options.map(option => start + option));
  }
  return spellings.filter(spelling => spelling !== word);
}

/** The one listed lemma `word` is a transliteration of, or null (none, or more than one). */
function transliterated(word: string, known: (word: string) => boolean): string | null {
  const found = readings(word).filter(known);
  return found.length === 1 ? found[0]! : null;
}

const isDual = (entry: GermanEntry | DualEntry): entry is DualEntry => 'paradigms' in entry;

/** The `-ieren` subclass: the part before -ieren has a vowel (stud-ieren; not zieren, frieren, schmieren). */
export const isIeren = (word: string): boolean => word.endsWith('ieren') && /[aeiouäöüy]/u.test(word.slice(0, -5));

/**
 * The inseparable prefix a listed root starts with (befehlen, vergessen, bewegen), judged from its Partizip II: a root
 * whose Partizip II starts with ge + its own first letter has ge- and so no prefix (gelten → gegolten, bergen → geborgen).
 */
function ownPrefix(root: string, participle: string | null): string | null {
  const prefix = [...inseparable].sort((a, b) => b.length - a.length)
    .find(candidate => root.startsWith(candidate) && isPlausibleRoot(root.slice(candidate.length), germanParticles));
  if (prefix === undefined) return null;
  return participle !== null && participle.startsWith(`ge${root.charAt(0)}`) ? null : prefix;
}

const firstText = (value: string | readonly Alternate[]): string => typeof value === 'string' ? value : value[0]!.text;

// ---------------------------------------------------------------------------------------------------------------------
// Analysing a word without its separable particle

/** What a base (a word without separable particle) is: its inseparable prefix, its root and how they were found. */
interface BaseAnalysis {
  readonly prefix: string | null;
  readonly root: string;
  /** The root (or the word itself) is listed, so nothing about its class is assumed. */
  readonly known: boolean;
  readonly kind: 'root' | 'derived' | 'weak' | 'notDerived' | 'denominal' | 'unlisted';
  /** Steps that come before any particle step: a transliterated root. */
  readonly lead: readonly DerivationStep[];
  /** Steps that come after the particle step: the prefix, the denominal or non-derived reading. */
  readonly trail: readonly DerivationStep[];
  /** The base as finally read (transliteration applied). */
  readonly word: string;
}

function rootAnalysis(word: string, root: string, prefix: string | null, lead: readonly DerivationStep[]): BaseAnalysis | null {
  if (Object.hasOwn(germanLexicon, root)) {
    const trail = prefix === null ? [] : [step(rules['de.classify.inseparable'], word, null, { prefix })];
    return { prefix, root, known: true, kind: prefix === null ? 'root' : 'derived', lead, trail, word };
  }
  return null;
}

function denominal(word: string): string | null {
  for (const prefix of denominalPrefixes) {
    if (!word.startsWith(prefix)) continue;
    const rest = word.slice(prefix.length);
    if (sep.some(particle => rest.startsWith(particle) && isPlausibleRoot(rest.slice(particle.length), germanParticles))) return prefix;
  }
  return null;
}

/** A base: exact entry, listed weak verb, non-derived verb, denominal verb, prefix + listed root, or unlisted. */
function analyseBase(word: string): BaseAnalysis {
  const exact = rootAnalysis(word, word, null, []);
  if (exact) return exact;
  if (Object.hasOwn(noInherit, word)) {
    const prefix = splitDerivative(word, germanParticles).find(split => split.particle === null)?.prefix ?? null;
    return { prefix, root: word, known: true, kind: 'notDerived', lead: [], trail: [step(rules['de.classify.not-derived'], word, null, { root: noInherit[word]! })], word };
  }
  if (listedWeak(word)) {
    const prefix = lookalikes.includes(word) ? null : splitDerivative(word, germanParticles).find(split => split.particle === null)?.prefix ?? null;
    return { prefix, root: word, known: true, kind: 'weak', lead: [], trail: [step(rules['de.classify.lexicon'], word, 'weak')], word };
  }
  const read = isListed(word) ? null : transliterated(word, isListed);
  if (read !== null) {
    const analysis = analyseBase(read);
    return { ...analysis, lead: [step(rules['de.classify.transliteration'], null, null, { written: word, read }), ...analysis.lead] };
  }
  const nominal = denominal(word);
  if (nominal !== null) {
    return { prefix: nominal, root: word.slice(nominal.length), known: true, kind: 'denominal', lead: [], trail: [step(rules['de.classify.denominal'], word, null, { prefix: nominal })], word };
  }
  for (const split of splitDerivative(word, germanParticles)) {
    if (split.particle !== null || split.prefix === null) continue;
    const derived = rootAnalysis(word, split.root, split.prefix, []);
    if (derived) return derived;
    const read = transliterated(split.root, root => Object.hasOwn(germanLexicon, root));
    if (read !== null) {
      const lead = [step(rules['de.classify.transliteration'], null, null, { written: split.root, read })];
      return rootAnalysis(split.prefix + read, read, split.prefix, lead)!;
    }
  }
  const prefixOnly = splitDerivative(word, germanParticles).find(split => split.particle === null);
  if (prefixOnly) {
    return { prefix: prefixOnly.prefix, root: prefixOnly.root, known: false, kind: 'unlisted', lead: [], trail: [step(rules['de.classify.inseparable'], word, null, { prefix: prefixOnly.prefix! })], word };
  }
  return { prefix: null, root: word, known: false, kind: 'unlisted', lead: [], trail: [], word };
}

// ---------------------------------------------------------------------------------------------------------------------
// Segmentations of a lemma

/** One reading of the lemma into particle and base, before the root's paradigms are known. */
interface Segmentation {
  readonly lemma: string;
  readonly particle: { readonly text: string; readonly separable: boolean } | null;
  readonly base: BaseAnalysis;
  /** Steps before the root's own: hints, transliteration, derivative and particle steps. */
  readonly steps: readonly DerivationStep[];
  readonly tags: VariantTags;
  /** Auxiliaries the lexicon lists for this lemma or reading; null when they come from the root or a default. */
  readonly auxiliaries: readonly AuxiliaryUse[] | null;
  /** The lemma itself is listed (so an unlisted root is not an assumption). */
  readonly listed: boolean;
  /** A hint decided the class or a prefix. */
  readonly hinted: boolean;
}

/** `an + er`: the particle and prefix in front of a root, for the derivative step. */
const prefixLabel = (particle: string | null, prefix: string | null): string => [particle, prefix].filter(part => part !== null).join(' + ');

function derivativeStep(lemma: string, particle: string | null, base: BaseAnalysis): DerivationStep[] {
  if (!base.known || base.kind === 'root' && particle === null) return [];
  if (base.kind !== 'root' && base.kind !== 'derived') return [];
  return [step(rules['de.classify.derivative'], lemma, null, { prefix: prefixLabel(particle, base.prefix), root: base.root })];
}

function listedAuxiliaries(lemma: string): readonly AuxiliaryUse[] | null {
  if (Object.hasOwn(derivativeAuxiliaries, lemma)) return derivativeAuxiliaries[lemma]!;
  if (Object.hasOwn(shortRootDerivatives, lemma)) return shortRootDerivatives[lemma]!;
  if (Object.hasOwn(inseparableReadings, lemma)) return inseparableReadings[lemma]!;
  if (Object.hasOwn(weakWithSein, lemma)) return weakWithSein[lemma]!;
  return null;
}

function segment(written: string, particle: { text: string; separable: boolean } | null, base: BaseAnalysis, middle: readonly DerivationStep[], more: Partial<Segmentation> = {}): Segmentation {
  // A transliterated base changes the lemma: aufheissen is aufheißen.
  const lemma = base.lead.some(s => s.rule === 'de.classify.transliteration') ? (particle?.text ?? '') + base.word : written;
  return {
    lemma, particle, base,
    steps: [...base.lead, ...derivativeStep(lemma, particle?.text ?? null, base), ...middle, ...base.trail],
    tags: {}, auxiliaries: listedAuxiliaries(lemma), listed: isListed(lemma), hinted: false, ...more,
  };
}

function particleOf(lemma: string, particles: readonly string[]): string | null {
  return [...particles].sort((a, b) => b.length - a.length).find(particle => lemma.startsWith(particle) && isPlausibleRoot(lemma.slice(particle.length), germanParticles)) ?? null;
}

/** The two readings of a lemma whose particle is separable in one sense and inseparable in another. */
function dualPrefixSegmentations(lemma: string): Segmentation[] {
  const { separable, inseparable: unseparated } = dualPrefixLemmas[lemma]!;
  const particle = particleOf(lemma, [...sep, ...dual])!;
  const base = analyseBase(lemma.slice(particle.length));
  const reading = (kind: 'separable' | 'inseparable', { condition, auxiliaries, stressed }: PrefixReading): Segmentation => {
    const tags: VariantTags = { pattern: kind, condition };
    const listedAux = { auxiliaries: auxiliaries ?? null, listed: true, tags };
    if (kind === 'separable') {
      return segment(lemma, { text: particle, separable: true }, base, [step(rules['de.classify.separable'], lemma, null, { particle })], listedAux);
    }
    const inseparableStep = step(rules['de.classify.inseparable'], lemma, null, { prefix: particle });
    if (stressed) return segment(lemma, { text: particle, separable: false }, base, [inseparableStep], listedAux);
    const prefixed: BaseAnalysis = { ...base, prefix: particle, kind: base.known ? 'derived' : 'unlisted', word: lemma, trail: [] };
    return segment(lemma, null, prefixed, [inseparableStep], listedAux);
  };
  return [reading('separable', separable), reading('inseparable', unseparated)];
}

/** A lemma whose dual particle is listed as an inseparable prefix. */
function inseparableSegmentation(lemma: string): Segmentation {
  const prefix = particleOf(lemma, dual)!;
  const root = analyseBase(lemma.slice(prefix.length));
  const base: BaseAnalysis = { ...root, prefix, kind: root.known ? 'derived' : 'weak', word: lemma, trail: [] };
  const lexical = root.known ? [] : [step(rules['de.classify.lexicon'], lemma, 'weak')];
  return segment(lemma, null, { ...base, known: true }, [...lexical, step(rules['de.classify.inseparable'], lemma, null, { prefix })]);
}

/** The readings of a lemma without hints (GD §3.2, steps 3 to 6). */
function segmentations(lemma: string): Segmentation[] {
  if (Object.hasOwn(dualPrefixLemmas, lemma)) return dualPrefixSegmentations(lemma);
  if (Object.hasOwn(inseparableReadings, lemma)) return [inseparableSegmentation(lemma)];
  const whole = analyseBase(lemma);
  if (whole.known && (whole.kind !== 'derived' || isListed(lemma))) return [segment(lemma, null, whole, [])];
  // A separable or dual particle whose remainder is known; else an inseparable prefix with a listed root.
  const particleSplits = splitDerivative(lemma, germanParticles).filter(split => split.particle !== null && split.prefix === null);
  for (const split of particleSplits) {
    const base = analyseBase(split.root);
    if (!base.known) continue;
    const separableStep = dual.includes(split.particle!) && !isListed(lemma)
      ? step(rules['de.classify.assume-separable'], lemma, null, { particle: split.particle! })
      : step(rules['de.classify.separable'], lemma, null, { particle: split.particle! });
    return [segment(lemma, { text: split.particle!, separable: true }, base, [separableStep])];
  }
  if (whole.known) return [segment(lemma, null, whole, [])];
  const first = particleSplits[0];
  if (first) {
    const base = analyseBase(first.root);
    return [segment(lemma, { text: first.particle!, separable: true }, base, [step(rules['de.classify.assume-separable'], lemma, null, { particle: first.particle! })])];
  }
  return [segment(lemma, null, whole, [])];
}

// ---------------------------------------------------------------------------------------------------------------------
// Prefix hints

function proper(lemma: string, prefix: string): boolean {
  return lemma.startsWith(prefix) && isPlausibleRoot(lemma.slice(prefix.length), germanParticles);
}

function withSeparableHint(lemma: string, particle: string): Segmentation[] {
  const hint = step(rules['de.classify.hint'], lemma, null, { hint: 'separablePrefix', value: particle });
  if (inseparable.includes(particle)) invalidHint(`${particle}- is an inseparable prefix: it is never separated.`);
  if (!proper(lemma, particle)) invalidHint(`${particle} is not a prefix of ${lemma}.`);
  if (Object.hasOwn(inseparableReadings, lemma)) invalidHint(`${lemma} is listed with the inseparable prefix ${particle}- only.`);
  if (Object.hasOwn(dualPrefixLemmas, lemma)) {
    const [separable] = dualPrefixSegmentations(lemma);
    if (separable!.particle?.text !== particle) invalidHint(`The separable particle of ${lemma} is not ${particle}.`);
    return [{ ...separable!, steps: [hint, ...separable!.steps], tags: {}, hinted: true }];
  }
  const base = analyseBase(lemma.slice(particle.length));
  return [segment(lemma, { text: particle, separable: true }, base, [hint, step(rules['de.classify.separable'], lemma, null, { particle })], { hinted: true })];
}

function withInseparableHint(lemma: string, prefix: string): Segmentation[] {
  const hint = step(rules['de.classify.hint'], lemma, null, { hint: 'inseparablePrefix', value: prefix });
  if (!proper(lemma, prefix)) invalidHint(`${prefix} is not a prefix of ${lemma}.`);
  if (Object.hasOwn(dualPrefixLemmas, lemma)) {
    const [, unseparated] = dualPrefixSegmentations(lemma);
    const own = unseparated!.particle?.text ?? unseparated!.base.prefix;
    if (own !== prefix) invalidHint(`The inseparable prefix of ${lemma} is not ${prefix}.`);
    return [{ ...unseparated!, steps: [hint, ...unseparated!.steps], tags: {}, hinted: true }];
  }
  if (sep.includes(prefix)) invalidHint(`${prefix}- is a separable particle: it is never an inseparable prefix.`);
  const root = analyseBase(lemma.slice(prefix.length));
  const base: BaseAnalysis = { ...root, prefix, kind: root.known ? 'derived' : 'unlisted', word: lemma, trail: [] };
  return [segment(lemma, null, base, [hint, step(rules['de.classify.inseparable'], lemma, null, { prefix })], { hinted: true })];
}

// ---------------------------------------------------------------------------------------------------------------------
// Paradigms of a segmentation

/** `entry` with `prefix` in front of every stored form; the root's ge- goes, since the prefix blocks it. */
function prefixed(entry: GermanEntry, prefix: string | null, rootHasGe: boolean): GermanEntry {
  if (prefix === null) return entry;
  const add = (text: string): string => prefix + text;
  const list = (value: string | readonly Alternate[]): string | readonly Alternate[] =>
    typeof value === 'string' ? add(value) : value.map(item => ({ ...item, text: add(item.text) }));
  const participle = (text: string): string => prefix + (rootHasGe && text.startsWith('ge') ? text.slice(2) : text);
  const participles = typeof entry.participle === 'string' ? participle(entry.participle) : entry.participle.map(item => ({ ...item, text: participle(item.text) }));
  return {
    ...entry,
    ...(entry.present2 === undefined ? {} : { present2: list(entry.present2) }),
    ...(entry.presentSingular === undefined ? {} : { presentSingular: add(entry.presentSingular) }),
    preterite: list(entry.preterite),
    participle: participles,
    ...(entry.subjunctive === undefined ? {} : { subjunctive: list(entry.subjunctive) as readonly Alternate[] }),
    ...(entry.imperative === undefined ? {} : { imperative: list(entry.imperative) as readonly Alternate[] }),
    ...(entry.cells === undefined ? {} : {
      cells: Object.fromEntries(Object.entries(entry.cells).map(([key, value]) => [key, list(value!) as readonly Alternate[]])),
    }),
  };
}

/** One root paradigm: its entry (null = weak), its class, pattern and condition. */
interface RootParadigm {
  readonly entry: GermanEntry | null;
  readonly conjugation: Conjugation;
  readonly auxiliaries: readonly AuxiliaryUse[];
  readonly tags: VariantTags;
}

function rootParadigms(root: string): RootParadigm[] {
  if (!Object.hasOwn(germanLexicon, root)) return [{ entry: null, conjugation: 'weak', auxiliaries: [{ verb: 'haben' }], tags: {} }];
  const listed = germanLexicon[root]!;
  const of = (entry: GermanEntry | WeakEntry, pattern?: string, condition?: string): RootParadigm => {
    const tags: VariantTags = pattern === undefined ? {} : condition === undefined ? { pattern } : { pattern, condition };
    const byPattern = pattern === 'weak' || pattern === 'strong' || pattern === 'mixed' ? pattern : null;
    return entry.class === 'weak'
      ? { entry: null, conjugation: 'weak', auxiliaries: entry.auxiliaries, tags }
      : { entry, conjugation: byPattern ?? entry.class, auxiliaries: entry.auxiliaries, tags };
  };
  return isDual(listed) ? listed.paradigms.map(({ pattern, condition, entry }) => of(entry, pattern, condition)) : [of(listed)];
}

const flagsOf = (lemma: string, entry: GermanEntry | null): ReadonlySet<LexemeFlag> => new Set<LexemeFlag>([
  ...(entry?.flags ?? []).filter((flag): flag is LexemeFlag => flag !== 'nonInitialStress'),
  ...(impersonalVerbs.includes(lemma) ? ['impersonal' as const] : []),
]);

interface Built { readonly lexeme: GermanLexeme; readonly steps: readonly DerivationStep[]; readonly tags: VariantTags }

/** The lexemes of a segmentation: one per paradigm of its root, with the defaults and hints applied. */
function build(segmentation: Segmentation, hints: Hints): Built[] {
  const { lemma, particle, base } = segmentation;
  const rootListed = base.known && (base.kind === 'root' || base.kind === 'derived');
  const all = rootListed ? rootParadigms(base.root) : [{ entry: null, conjugation: 'weak' as const, auxiliaries: [{ verb: 'haben' as const }], tags: {} }];
  // A class hint keeps the root's paradigms of that class; an unlisted verb takes any class (strong and mixed need stems).
  const known = rootListed || base.known || segmentation.listed;
  const paradigms = hints.classHint === undefined || !known ? all : all.filter(paradigm => paradigm.conjugation === hints.classHint);
  if (!paradigms.length) invalidHint(`${lemma} has no ${hints.classHint} conjugation.`);
  return paradigms.map(paradigm => {
    const steps: DerivationStep[] = [...segmentation.steps];
    if (rootListed && base.kind === 'root' && particle === null) steps.push(step(rules['de.classify.lexicon'], lemma, paradigm.conjugation));
    const unknown = !base.known && !segmentation.listed;
    if (unknown) steps.push(step(rules['de.classify.default-weak'], lemma, null));
    // Auxiliaries: listed for the lemma, the root's (assumed for a derivative), or the default.
    let auxiliaries: readonly AuxiliaryUse[];
    let assumedAuxiliary: DerivationStep | null = null;
    if (segmentation.auxiliaries !== null) auxiliaries = segmentation.auxiliaries;
    else if (rootListed && (base.kind === 'derived' || particle !== null)) {
      auxiliaries = paradigm.auxiliaries;
      assumedAuxiliary = step(rules['de.classify.assume-root-auxiliary'], lemma, null, { root: base.root });
    } else if (rootListed || base.kind === 'weak' || base.kind === 'notDerived' || segmentation.listed) auxiliaries = paradigm.auxiliaries;
    else {
      auxiliaries = [{ verb: 'haben' }];
      assumedAuxiliary = step(rules['de.classify.default-haben'], lemma, null);
    }
    const ownPrefixOfRoot = paradigm.entry === null ? null : ownPrefix(base.root, firstText(paradigm.entry.participle));
    const weakOwnPrefix = paradigm.entry === null && rootListed && base.prefix === null ? ownPrefix(base.root, null) : null;
    const prefix = base.prefix ?? ownPrefixOfRoot ?? weakOwnPrefix;
    const rootHasGe = paradigm.entry !== null && ownPrefixOfRoot === null;
    const entry = paradigm.entry === null ? null : prefixed(paradigm.entry, base.prefix, rootHasGe);
    const baseWord = particle === null ? lemma : lemma.slice(particle.text.length);
    const lexeme: GermanLexeme = {
      lemma, verbId: lemma, classId: paradigm.conjugation, classSource: 'regularRule', reflexive: false,
      auxiliaries: auxiliaries.map(use => use.verb), particle, base: baseWord, root: base.root, prefix, conjugation: paradigm.conjugation,
      entry, auxiliaryUses: auxiliaries, geBlocked: null, flags: flagsOf(lemma, entry), participleWithGe: null,
    };
    return applyHints({ lexeme, steps, tags: mergeTags(segmentation.tags, paradigm.tags) ?? segmentation.tags }, segmentation, hints, assumedAuxiliary, rootListed);
  });
}

/** The class, stem and auxiliary hints, then stress: the lexeme, its steps in order, and its source. */
function applyHints(built: Built, segmentation: Segmentation, hints: Hints, assumedAuxiliary: DerivationStep | null, rootListed: boolean): Built {
  let { lexeme } = built;
  const hintSteps: DerivationStep[] = [];
  let steps = [...built.steps];
  const hint = (name: string, value: string) => hintSteps.push(step(rules['de.classify.hint'], lexeme.lemma, null, { hint: name, value }));
  const stems = hints.stems ?? {};
  const parts = (['present2', 'preterite', 'subjunctive', 'participle'] as const).filter(key => stems[key] !== undefined);
  if (hints.classHint !== undefined) {
    hint('classHint', hints.classHint);
    if (hints.classHint !== 'weak' && lexeme.entry === null) {
      if (stems.preterite === undefined || stems.participle === undefined) {
        invalidHint(`A ${hints.classHint} verb the lexicon does not list needs stems.preterite and stems.participle.`);
      }
      const entry: GermanEntry = {
        class: hints.classHint, preterite: stems.preterite!, participle: stems.participle!, auxiliaries: lexeme.auxiliaryUses,
        ...(stems.present2 === undefined ? {} : { present2: stems.present2 }),
        ...(stems.subjunctive === undefined ? {} : { subjunctive: [{ text: stems.subjunctive }] }),
        source: 'https://www.dwds.de/',
      };
      lexeme = { ...lexeme, entry, conjugation: hints.classHint, classId: hints.classHint };
      steps = steps.filter(s => s.rule !== 'de.classify.default-weak');
    } else if (hints.classHint === 'weak' && lexeme.conjugation === 'weak') {
      steps = steps.filter(s => s.rule !== 'de.classify.default-weak');
    }
  }
  if (parts.length) {
    if (lexeme.entry === null) invalidHint('Principal parts (stems.present2, preterite, subjunctive, participle) need classHint strong or mixed for a weak verb.');
    for (const key of parts) hint(`stems.${key}`, stems[key]!);
    if (hints.classHint === undefined || lexeme.entry!.source !== 'https://www.dwds.de/') {
      const entry = lexeme.entry!;
      lexeme = {
        ...lexeme,
        entry: {
          ...entry,
          ...(stems.present2 === undefined ? {} : { present2: stems.present2 }),
          ...(stems.preterite === undefined ? {} : { preterite: stems.preterite }),
          ...(stems.participle === undefined ? {} : { participle: stems.participle }),
          ...(stems.subjunctive === undefined ? {} : { subjunctive: [{ text: stems.subjunctive }] }),
        },
      };
    }
  }
  // The perfect auxiliary: a hint narrows listed auxiliaries and replaces assumed ones.
  if (hints.auxiliary !== undefined) {
    hint('auxiliary', hints.auxiliary);
    const kept = lexeme.auxiliaryUses.filter(use => use.verb === hints.auxiliary);
    const uses = assumedAuxiliary !== null ? [{ verb: hints.auxiliary }] : kept;
    if (!uses.length) invalidHint(`${lexeme.lemma} does not form its perfect with ${hints.auxiliary}.`);
    lexeme = { ...lexeme, auxiliaryUses: uses, auxiliaries: uses.map(use => use.verb) };
    assumedAuxiliary = null;
  }
  if (assumedAuxiliary !== null) steps.push(assumedAuxiliary);
  // Stress and ge-.
  const unstressed = stems.unstressedFirstSyllable;
  if (unstressed !== undefined) hint('stems.unstressedFirstSyllable', String(unstressed));
  let geBlocked: GermanLexeme['geBlocked'] = null;
  let participleWithGe: string | null = null;
  if (lexeme.prefix !== null) geBlocked = 'prefix';
  else if (unstressed !== undefined) geBlocked = unstressed ? 'stress' : null;
  else if (isIeren(lexeme.base)) {
    geBlocked = 'stress';
    steps.push(step(rules['de.classify.ieren'], lexeme.base, null));
  } else if (Object.hasOwn(nonInitialStress, lexeme.lemma) || lexeme.entry?.flags?.includes('nonInitialStress')) {
    geBlocked = 'stress';
    participleWithGe = nonInitialStress[lexeme.lemma] ?? null;
  } else if (lexeme.entry === null && !rootListed && !segmentation.listed && !segmentation.base.known) {
    steps.push(step(rules['de.classify.default-stress'], lexeme.lemma, null));
  }
  const hinted = segmentation.hinted || hints.classHint !== undefined;
  const listed = rootListed || segmentation.listed || segmentation.base.known;
  const classSource: GermanLexeme['classSource'] = hinted ? 'explicitHint' : listed ? 'lexicon' : 'regularRule';
  return { lexeme: { ...lexeme, geBlocked, participleWithGe, classSource }, steps: [...hintSteps, ...steps], tags: built.tags };
}

// ---------------------------------------------------------------------------------------------------------------------
// Entry points

function hintsOf(query: Readonly<Record<string, unknown>>): Hints {
  return {
    ...(typeof query.separablePrefix === 'string' ? { separablePrefix: query.separablePrefix } : {}),
    ...(typeof query.inseparablePrefix === 'string' ? { inseparablePrefix: query.inseparablePrefix } : {}),
    ...(typeof query.classHint === 'string' ? { classHint: query.classHint as GermanClassHint } : {}),
    ...(query.stems !== undefined ? { stems: query.stems as GermanStemHints } : {}),
    ...(query.auxiliary === 'haben' || query.auxiliary === 'sein' ? { auxiliary: query.auxiliary } : {}),
  };
}

/** The class hint keeps the paradigms of that class; none is an INVALID_HINT. */
function byClass(built: Built[], hints: Hints): Built[] {
  if (hints.classHint === undefined) return built;
  const kept = built.filter(({ lexeme }) => lexeme.conjugation === hints.classHint);
  if (!kept.length) invalidHint(`${built[0]!.lexeme.lemma} is not a ${hints.classHint} verb.`);
  return kept;
}

/** The paradigms of the queried verb (GD §3.2, in that order). */
export function classifyGerman(query: Readonly<Record<string, unknown>>): Fork<GermanLexeme> {
  const written = String(query.infinitive);
  if (/^sich\s/u.test(written)) throw new ConjugationError('INVALID_INFINITIVE', 'Reflexive verbs are not supported yet.');
  if (!/^\p{L}+n$/u.test(written)) throw new ConjugationError('INVALID_INFINITIVE', 'A German infinitive is one word ending in -n.');
  const hints = hintsOf(query);
  let lemma = written;
  const opening: DerivationStep[] = [];
  if (!isListed(written)) {
    const read = transliterated(written, isListed);
    if (read !== null) {
      lemma = read;
      opening.push(step(rules['de.classify.transliteration'], null, null, { written, read }));
    }
  }
  const readingsOfLemma = hints.separablePrefix !== undefined ? withSeparableHint(lemma, hints.separablePrefix)
    : hints.inseparablePrefix !== undefined ? withInseparableHint(lemma, hints.inseparablePrefix)
      : segmentations(lemma);
  const built = byClass(readingsOfLemma.flatMap(segmentation => build(segmentation, hints)), hints);
  return built.map(({ lexeme, steps, tags }): Outcome<GermanLexeme> => ({ value: lexeme, steps: [...opening, ...steps], tags }));
}

/** The lexeme of a verb a compound tense names (haben, sein, werden): its first paradigm, without hints. */
export function germanLexemeOf(lemma: string): GermanLexeme {
  return classifyGerman({ infinitive: lemma })[0]!.value;
}
