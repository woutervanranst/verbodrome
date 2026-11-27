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
import { isPlausibleRoot, paradigmFork, splitDerivative } from '../shared/germanic.js';
import {
  denominalPrefixes, derivativeAuxiliaries, derivedParadigms, dualPrefixLemmas, generalConditions, germanLexicon, germanParticles, impersonalVerbs, inseparableReadings,
  lookalikes, noInherit, nonInitialStress, particleVerbs, shortRootDerivatives, weakWithSein,
} from './lexicon.js';
import type { Alternate, AuxiliaryUse, DualEntry, GermanEntry, PrefixReading, WeakEntry } from './lexicon.js';
import { germanRules } from './rules.js';
import { verification } from './verification.js';
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
  /**
   * The condition of a reading (umziehen: move house; change clothes) whose auxiliaries carry conditions of their own:
   * the clause puts it on the forms built without such an auxiliary, so a compound form shows only its auxiliary's.
   */
  readonly readingCondition: string | null;
  /** The words of a separable particle at the end of the clause: stacked particles stand apart (stellt wieder her). */
  readonly particleWords: readonly string[];
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
    || Object.hasOwn(inseparableReadings, word) || Object.hasOwn(derivativeAuxiliaries, word) || Object.hasOwn(shortRootDerivatives, word)
    || Object.hasOwn(particleVerbs, word) || Object.hasOwn(derivedParadigms, word);
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

/** What a base (a word without separable particle) is: its inseparable prefixes, its root and how they were found. */
interface BaseAnalysis {
  /** The inseparable prefixes in front of the root, outside in: missverstehen → ['miss', 'ver']. */
  readonly prefixes: readonly string[];
  readonly root: string;
  /** The root (or the word itself) is listed, so nothing about its class is assumed. */
  readonly known: boolean;
  readonly kind: 'root' | 'derived' | 'weak' | 'notDerived' | 'denominal' | 'unlisted';
  /** Steps before every other: a transliterated word or root. */
  readonly lead: readonly DerivationStep[];
  /** The steps that read the base, outside in: each prefix layer, the denominal or non-derived reading. */
  readonly chain: readonly DerivationStep[];
  /** The base as finally read (transliteration applied). */
  readonly word: string;
}

const prefixOf = (base: BaseAnalysis): string | null => base.prefixes.length ? base.prefixes.join('') : null;

/**
 * The listed verb an unlisted word ends in behind a first element of two letters or more (teilnehmen: nehmen), or null:
 * such a word is not split unless it is listed as a particle verb, and the analysis says so.
 */
function embeddedVerb(word: string): string | null {
  for (let start = 2; start <= word.length - 4; start++) {
    const rest = word.slice(start);
    if (isListed(rest)) return rest;
  }
  return null;
}

function denominal(word: string): string | null {
  for (const prefix of denominalPrefixes) {
    if (!word.startsWith(prefix)) continue;
    const rest = word.slice(prefix.length);
    // be-dauern, ver-hindern: the rest is a verb of its own, so this is a prefix verb, not a noun with a particle.
    if (isListed(rest)) continue;
    if (sep.some(particle => rest.startsWith(particle) && isPlausibleRoot(rest.slice(particle.length), germanParticles))) return prefix;
  }
  return null;
}

/** The inseparable prefix a listed weak verb starts with (begegnen, erwachen), or none. */
const weakPrefix = (word: string): readonly string[] => {
  const split = splitDerivative(word, germanParticles).find(item => item.particle === null);
  return split?.prefix ? [split.prefix] : [];
};

/**
 * A base, outside in: an exact entry, a non-derived or listed weak verb, a transliteration, a denominal verb, or an
 * inseparable prefix in front of a base that is itself analysed the same way (miss + ver + stehen), else unlisted.
 */
function analyseBase(word: string): BaseAnalysis {
  if (Object.hasOwn(germanLexicon, word)) return { prefixes: [], root: word, known: true, kind: 'root', lead: [], chain: [], word };
  if (Object.hasOwn(noInherit, word)) {
    return { prefixes: weakPrefix(word), root: word, known: true, kind: 'notDerived', lead: [], chain: [step(rules['de.classify.not-derived'], word, null, { root: noInherit[word]! })], word };
  }
  if (listedWeak(word)) {
    const prefixes = lookalikes.includes(word) || Object.hasOwn(nonInitialStress, word) ? [] : weakPrefix(word);
    return { prefixes, root: word, known: true, kind: 'weak', lead: [], chain: [step(rules['de.classify.lexicon'], word, 'weak')], word };
  }
  const read = isListed(word) ? null : transliterated(word, isListed);
  if (read !== null) {
    const analysis = analyseBase(read);
    return { ...analysis, lead: [step(rules['de.classify.transliteration'], null, null, { written: word, read }), ...analysis.lead] };
  }
  const nominal = denominal(word);
  if (nominal !== null) {
    return { prefixes: [nominal], root: word.slice(nominal.length), known: true, kind: 'denominal', lead: [], chain: [step(rules['de.classify.denominal'], word, null, { prefix: nominal })], word };
  }
  let unknown: BaseAnalysis | null = null;
  for (const split of splitDerivative(word, germanParticles)) {
    if (split.particle !== null || split.prefix === null) continue;
    const inner = analyseBase(split.root);
    const layer = [step(rules['de.classify.inseparable'], word, null, { prefix: split.prefix })];
    if (inner.known) {
      const derived = inner.kind === 'root' || inner.kind === 'derived';
      const derivative = derived ? [step(rules['de.classify.derivative'], word, null, { prefix: split.prefix, root: inner.word })] : [];
      return {
        prefixes: [split.prefix, ...inner.prefixes], root: inner.root, known: true, kind: derived ? 'derived' : inner.kind,
        lead: inner.lead, chain: [...derivative, ...layer, ...inner.chain], word: split.prefix + inner.word,
      };
    }
    // An unknown remainder: the prefix is a guess (bereit-stellen is not be- + reitstellen), and a loan in -ieren
    // (generieren, verifizieren) is not split at all.
    if (isIeren(word)) continue;
    const assumed = [step(rules['de.classify.assume-inseparable'], word, null, { prefix: split.prefix })];
    unknown ??= { ...inner, prefixes: [split.prefix, ...inner.prefixes], kind: 'unlisted', chain: [...assumed, ...inner.chain], word };
  }
  return unknown ?? { prefixes: [], root: word, known: false, kind: 'unlisted', lead: [], chain: [], word };
}

// ---------------------------------------------------------------------------------------------------------------------
// Segmentations of a lemma

/** One reading of the lemma into particle and base, before the root's paradigms are known. */
interface Segmentation {
  readonly lemma: string;
  readonly particle: { readonly text: string; readonly separable: boolean } | null;
  /** The particles one by one (wieder, her); one entry for a single particle. */
  readonly particleWords: readonly string[];
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

function listedAuxiliaries(lemma: string): readonly AuxiliaryUse[] | null {
  if (Object.hasOwn(derivativeAuxiliaries, lemma)) return derivativeAuxiliaries[lemma]!;
  if (Object.hasOwn(shortRootDerivatives, lemma)) return shortRootDerivatives[lemma]!;
  if (Object.hasOwn(inseparableReadings, lemma)) return inseparableReadings[lemma]!;
  if (Object.hasOwn(weakWithSein, lemma)) return weakWithSein[lemma]!;
  return null;
}

/**
 * A segmentation: a particle (or none) in front of a base. A particle in front of a known base takes its forms
 * (derivative step), then the particle step, then the base's own steps.
 */
function segment(written: string, particle: { text: string; separable: boolean } | null, base: BaseAnalysis, particleSteps: readonly DerivationStep[], more: Partial<Segmentation> = {}): Segmentation {
  // A transliterated base changes the lemma: aufheissen is aufheißen.
  const lemma = base.lead.some(s => s.rule === 'de.classify.transliteration') ? (particle?.text ?? '') + base.word : written;
  const derivative = particle !== null && base.known && base.kind !== 'denominal' && !Object.hasOwn(noInherit, lemma)
    ? [step(rules['de.classify.derivative'], lemma, null, { prefix: particle.text, root: base.word })] : [];
  return {
    lemma, particle, particleWords: particle === null ? [] : [particle.text], base,
    steps: [...base.lead, ...derivative, ...particleSteps, ...base.chain],
    tags: {}, auxiliaries: listedAuxiliaries(lemma), listed: isListed(lemma), hinted: false, ...more,
  };
}

function particleOf(lemma: string, particles: readonly string[]): string | null {
  return [...particles].sort((a, b) => b.length - a.length).find(particle => lemma.startsWith(particle) && isPlausibleRoot(lemma.slice(particle.length), germanParticles)) ?? null;
}

const separableStep = (lemma: string, particle: string, assumed: boolean): DerivationStep =>
  step(rules[assumed ? 'de.classify.assume-separable' : 'de.classify.separable'], lemma, null, { particle });

/** Particles stacked in front of a base, outside in (wieder + her + stellen), and that base. */
interface Particles { readonly particles: readonly string[]; readonly base: BaseAnalysis }

/** The particle reading of `word` whose base is known, outside in; stacked particles are read one by one. */
function knownParticles(word: string): Particles | null {
  for (const split of splitDerivative(word, germanParticles)) {
    if (split.particle === null || split.prefix !== null) continue;
    const base = analyseBase(split.root);
    if (base.known) return { particles: [split.particle], base };
    const inner = knownParticles(split.root);
    if (inner !== null) return { particles: [split.particle, ...inner.particles], base: inner.base };
  }
  return null;
}

/** The outermost particles of `word` when no reading has a known base: the first particle and any stacked behind it. */
function unknownParticles(word: string): Particles | null {
  const split = splitDerivative(word, germanParticles).find(item => item.particle !== null && item.prefix === null);
  if (split === undefined) return null;
  const inner = unknownParticles(split.root);
  return inner === null ? { particles: [split.particle!], base: analyseBase(split.root) } : { particles: [split.particle!, ...inner.particles], base: inner.base };
}

/** How stacked particles stand at the end of the clause: as one word (stimmt überein), apart only after wieder (stellt wieder her). */
function particleWordsOf(particles: readonly string[]): readonly string[] {
  const words: string[] = [];
  for (const particle of particles) {
    if (words.length && words.at(-1) !== 'wieder') words[words.length - 1] += particle;
    else words.push(particle);
  }
  return words;
}

function particleSegmentation(lemma: string, { particles, base }: Particles, known: boolean): Segmentation {
  const steps = particles.map(particle => separableStep(lemma, particle, !known || (dual.includes(particle) && !isListed(lemma))));
  return { ...segment(lemma, { text: particles.join(''), separable: true }, base, steps), particleWords: particleWordsOf(particles) };
}

/** The two readings of a lemma whose particle is separable in one sense and inseparable in another. */
function dualPrefixSegmentations(lemma: string): Segmentation[] {
  const { separable, inseparable: unseparated, inseparableFirst } = dualPrefixLemmas[lemma]!;
  const particle = particleOf(lemma, [...sep, ...dual])!;
  const base = analyseBase(lemma.slice(particle.length));
  const reading = (kind: 'separable' | 'inseparable', { condition, auxiliaries, stressed }: PrefixReading): Segmentation => {
    const tags: VariantTags = condition === undefined ? { pattern: kind } : { pattern: kind, condition };
    const listedAux = { auxiliaries: auxiliaries ?? null, listed: true, tags };
    if (kind === 'separable') return segment(lemma, { text: particle, separable: true }, base, [separableStep(lemma, particle, false)], listedAux);
    if (stressed) {
      return segment(lemma, { text: particle, separable: false }, base, [step(rules['de.classify.unseparated'], lemma, null, { particle })], listedAux);
    }
    const derived = base.known && (base.kind === 'root' || base.kind === 'derived');
    const prefixed: BaseAnalysis = {
      ...base, prefixes: [particle, ...base.prefixes], kind: derived ? 'derived' : base.kind, word: lemma,
      chain: [
        ...(derived ? [step(rules['de.classify.derivative'], lemma, null, { prefix: particle, root: base.word })] : []),
        step(rules['de.classify.inseparable'], lemma, null, { prefix: particle }), ...base.chain,
      ],
    };
    return segment(lemma, null, prefixed, [], listedAux);
  };
  const readings = [reading('separable', separable), reading('inseparable', unseparated)];
  return inseparableFirst ? readings.reverse() : readings;
}

/** The reading of a dual-prefix lemma with the given pattern. */
function dualReading(lemma: string, kind: 'separable' | 'inseparable'): Segmentation {
  return dualPrefixSegmentations(lemma).find(reading => reading.tags.pattern === kind)!;
}

/** A lemma whose dual particle is listed as an inseparable prefix. */
function inseparableSegmentation(lemma: string): Segmentation {
  const prefix = particleOf(lemma, dual)!;
  const layer = step(rules['de.classify.inseparable'], lemma, null, { prefix });
  // umringen is formed from Ring, not from ringen: weak, with its prefix.
  if (Object.hasOwn(noInherit, lemma)) {
    const notDerived = step(rules['de.classify.not-derived'], lemma, null, { root: noInherit[lemma]! });
    return segment(lemma, null, { prefixes: [prefix], root: lemma, known: true, kind: 'notDerived', lead: [], chain: [notDerived, layer], word: lemma }, []);
  }
  const root = analyseBase(lemma.slice(prefix.length));
  const derived = root.known && (root.kind === 'root' || root.kind === 'derived');
  const chain = derived
    ? [step(rules['de.classify.derivative'], lemma, null, { prefix, root: root.word }), layer, ...root.chain]
    : [step(rules['de.classify.lexicon'], lemma, 'weak'), layer];
  return segment(lemma, null, { ...root, prefixes: [prefix, ...(derived ? root.prefixes : [])], known: true, kind: derived ? 'derived' : 'weak', chain, word: lemma }, []);
}

/** The readings of a lemma without hints (GD §3.2, steps 3 to 6), outside in. */
function segmentations(lemma: string): Segmentation[] {
  if (Object.hasOwn(dualPrefixLemmas, lemma)) return dualPrefixSegmentations(lemma);
  if (Object.hasOwn(inseparableReadings, lemma)) return [inseparableSegmentation(lemma)];
  // A particle verb built on a weak homograph of a listed strong verb (durchweichen: weichen 'soften', not 'yield').
  const noInheritParticle = Object.hasOwn(noInherit, lemma) ? particleOf(lemma, [...sep, ...dual]) : null;
  if (noInheritParticle !== null && lemma.slice(noInheritParticle.length) === noInherit[lemma]) {
    const root = noInherit[lemma]!;
    const weakBase: BaseAnalysis = { prefixes: [], root, known: true, kind: 'weak', lead: [], word: root, chain: [step(rules['de.classify.lexicon'], lemma, 'weak')] };
    return [particleSegmentation(lemma, { particles: [noInheritParticle], base: weakBase }, true)];
  }
  if (Object.hasOwn(particleVerbs, lemma)) {
    const particle = particleVerbs[lemma]!;
    return [particleSegmentation(lemma, { particles: [particle], base: analyseBase(lemma.slice(particle.length)) }, true)];
  }
  const whole = analyseBase(lemma);
  if (whole.known && (whole.kind !== 'derived' || isListed(lemma))) return [segment(lemma, null, whole, [])];
  // A separable or dual particle (stacked particles one by one) whose base is known; else an inseparable prefix
  // with a listed root; else an unknown particle verb, an unknown prefix verb or an unknown simplex.
  const particles = knownParticles(lemma);
  if (particles !== null) return [particleSegmentation(lemma, particles, true)];
  if (whole.known) return [segment(lemma, null, whole, [])];
  const unknown = unknownParticles(lemma);
  if (unknown !== null) return [particleSegmentation(lemma, unknown, false)];
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
    const separable = dualReading(lemma, 'separable');
    if (separable!.particle?.text !== particle) invalidHint(`The separable particle of ${lemma} is not ${particle}.`);
    return [{ ...separable!, steps: [hint, ...separable!.steps], tags: {}, hinted: true }];
  }
  const base = analyseBase(lemma.slice(particle.length));
  return [segment(lemma, { text: particle, separable: true }, base, [hint, separableStep(lemma, particle, false)], { hinted: true })];
}

function withInseparableHint(lemma: string, prefix: string): Segmentation[] {
  const hint = step(rules['de.classify.hint'], lemma, null, { hint: 'inseparablePrefix', value: prefix });
  if (!proper(lemma, prefix)) invalidHint(`${prefix} is not a prefix of ${lemma}.`);
  if (Object.hasOwn(dualPrefixLemmas, lemma)) {
    const unseparated = dualReading(lemma, 'inseparable');
    const own = unseparated!.particle?.text ?? unseparated!.base.prefixes[0];
    if (own !== prefix) invalidHint(`The inseparable prefix of ${lemma} is not ${prefix}.`);
    return [{ ...unseparated!, steps: [hint, ...unseparated!.steps], tags: {}, hinted: true }];
  }
  if (sep.includes(prefix)) invalidHint(`${prefix}- is a separable particle: it is never an inseparable prefix.`);
  const root = analyseBase(lemma.slice(prefix.length));
  const derived = root.known && (root.kind === 'root' || root.kind === 'derived');
  const base: BaseAnalysis = {
    ...root, prefixes: [prefix, ...root.prefixes], kind: derived ? 'derived' : root.kind === 'root' ? 'derived' : root.kind, word: lemma,
    chain: [...(derived ? [step(rules['de.classify.derivative'], lemma, null, { prefix, root: root.word })] : []), step(rules['de.classify.inseparable'], lemma, null, { prefix }), ...root.chain],
  };
  return [segment(lemma, null, base, [hint], { hinted: true })];
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
  /** The auxiliaries are recorded for the derivative itself (not inherited from the root). */
  readonly ownAuxiliaries?: true;
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

/**
 * A root's auxiliaries as a derivative takes them: never a regional or one-dictionary use (stehen's southern sein is not
 * aufstehen's), and never the root's sense gloss (schleifen's 'drag along the ground' is not mitschleifen's): one
 * auxiliary carries no condition, two keep only the general ones (with or without a direct object, movement).
 */
const inherited = (uses: readonly AuxiliaryUse[]): readonly AuxiliaryUse[] => {
  const kept = uses.filter(use => use.region === undefined && use.source === undefined);
  if (kept.length <= 1) return [{ verb: kept[0]?.verb ?? 'haben' }];
  return kept.map(use => ({
    verb: use.verb,
    condition: use.condition !== undefined && generalConditions.includes(use.condition) ? use.condition : use.verb === 'sein' ? generalConditions[0]! : generalConditions[1]!,
  }));
};

/**
 * The perfect auxiliaries of a segmentation's paradigm and the assumption made, if any: listed for the lemma (or its
 * reading); the root's for the root itself; for an unlisted derivative, haben behind an inseparable prefix and the
 * root's (without regional uses) behind a particle, each recorded as an assumption; haben for an unknown verb.
 */
function auxiliariesOf(segmentation: Segmentation, paradigm: RootParadigm, rootListed: boolean): { uses: readonly AuxiliaryUse[]; assumed: DerivationStep | null } {
  const { lemma, particle, base } = segmentation;
  if (segmentation.auxiliaries !== null) return { uses: segmentation.auxiliaries, assumed: null };
  if (paradigm.ownAuxiliaries) return { uses: paradigm.auxiliaries, assumed: null };
  const exact = particle === null && base.prefixes.length === 0;
  if (exact && (rootListed || base.known || segmentation.listed)) return { uses: paradigm.auxiliaries, assumed: null };
  if (!base.known && !segmentation.listed) return { uses: [{ verb: 'haben' }], assumed: step(rules['de.classify.default-haben'], lemma, null) };
  // A verb formed from a noun (beantragen, vereinsamen unlisted) has no root to take an auxiliary from.
  if (base.kind === 'denominal') return { uses: [{ verb: 'haben' }], assumed: step(rules['de.classify.default-haben'], lemma, null) };
  if (base.prefixes.length > 0 && base.kind !== 'notDerived' && !Object.hasOwn(listedAuxiliariesOf, base.word)) {
    return { uses: [{ verb: 'haben' }], assumed: step(rules['de.classify.assume-prefix-haben'], lemma, null) };
  }
  if (particle !== null) {
    const listedBase = listedAuxiliaries(base.word);
    return { uses: inherited(listedBase ?? paradigm.auxiliaries), assumed: step(rules['de.classify.assume-root-auxiliary'], lemma, null, { root: base.word }) };
  }
  return { uses: paradigm.auxiliaries, assumed: null };
}

/** The lemmas whose auxiliaries the lexicon lists, for a base behind a particle. */
const listedAuxiliariesOf: Readonly<Record<string, true>> = Object.fromEntries(
  [...Object.keys(derivativeAuxiliaries), ...Object.keys(shortRootDerivatives), ...Object.keys(inseparableReadings), ...Object.keys(weakWithSein)].map(lemma => [lemma, true]),
);

/** The lexemes of a segmentation: one per paradigm of its root, with the defaults and hints applied. */
function build(segmentation: Segmentation, hints: Hints): Built[] {
  const { lemma, particle, base } = segmentation;
  const rootListed = base.known && (base.kind === 'root' || base.kind === 'derived');
  const ofRoot = rootListed ? rootParadigms(base.root) : [{ entry: null, conjugation: 'weak' as const, auxiliaries: [{ verb: 'haben' as const }], tags: {} }];
  // A derivative of a two-paradigm root takes the paradigms recorded for it, with its own labels, never the root's
  // glosses (abschaffen weak only, erschaffen strong only); an unrecorded one takes both, by pattern, as an assumption.
  const derivedFromDual = rootListed && ofRoot.length > 1 && (particle !== null || base.kind === 'derived');
  const recorded = derivedFromDual && Object.hasOwn(derivedParadigms, lemma) ? derivedParadigms[lemma]! : null;
  const all: RootParadigm[] = !derivedFromDual ? ofRoot : recorded === null
    ? ofRoot.map(paradigm => ({ ...paradigm, tags: { pattern: paradigm.tags.pattern! } }))
    : recorded.map(({ pattern, condition, usage, auxiliaries }) => ({
      ...ofRoot.find(paradigm => paradigm.tags.pattern === pattern)!,
      tags: { ...(recorded.length > 1 ? { pattern } : {}), ...(condition === undefined ? {} : { condition }), ...(usage === undefined ? {} : { usage }) },
      ...(auxiliaries === undefined ? {} : { auxiliaries, ownAuxiliaries: true as const }),
    }));
  const assumedParadigm = derivedFromDual && recorded === null ? step(rules['de.classify.assume-root-paradigm'], lemma, null, { root: base.root }) : null;
  // A class hint keeps the root's paradigms of that class; an unlisted verb takes any class (strong and mixed need stems).
  const known = rootListed || base.known || segmentation.listed;
  const paradigms = hints.classHint === undefined || !known ? all : all.filter(paradigm => paradigm.conjugation === hints.classHint);
  if (!paradigms.length) invalidHint(`${lemma} has no ${hints.classHint} conjugation.`);
  return paradigms.map(paradigm => {
    const steps: DerivationStep[] = [...segmentation.steps];
    if (assumedParadigm !== null && hints.classHint === undefined) steps.push(assumedParadigm);
    if (rootListed && base.kind === 'root' && particle === null) steps.push(step(rules['de.classify.lexicon'], lemma, paradigm.conjugation));
    // A listed lemma that DWDS has no table for rests on Duden alone, and says so.
    if (verification[lemma]?.dwds === null) steps.push(step(rules['de.classify.duden-only'], lemma, null));
    if (!base.known && !segmentation.listed) {
      const embedded = particle === null && base.prefixes.length === 0 && !segmentation.hinted ? embeddedVerb(lemma) : null;
      if (embedded !== null) steps.push(step(rules['de.classify.assume-unsplit'], lemma, null, { root: embedded }));
      steps.push(step(rules['de.classify.default-weak'], lemma, null));
    }
    const { uses, assumed } = auxiliariesOf(segmentation, paradigm, rootListed);
    const ownPrefixOfRoot = paradigm.entry === null ? null : ownPrefix(base.root, firstText(paradigm.entry.participle));
    const weakOwnPrefix = paradigm.entry === null && rootListed && base.prefixes.length === 0 ? ownPrefix(base.root, null) : null;
    const prefix = prefixOf(base) === null ? ownPrefixOfRoot ?? weakOwnPrefix : prefixOf(base)! + (ownPrefixOfRoot ?? '');
    const rootHasGe = paradigm.entry !== null && ownPrefixOfRoot === null;
    const entry = paradigm.entry === null ? null : prefixed(paradigm.entry, prefixOf(base), rootHasGe);
    const baseWord = particle === null ? lemma : lemma.slice(particle.text.length);
    // A reading's condition goes on the forms of its auxiliaries only when they carry no condition of their own.
    let tags = mergeTags(segmentation.tags, paradigm.tags) ?? segmentation.tags;
    let readingCondition: string | null = null;
    if (tags.condition !== undefined && uses.some(use => use.condition !== undefined)) {
      readingCondition = tags.condition;
      const { condition: _, ...rest } = tags;
      tags = rest;
    }
    const lexeme: GermanLexeme = {
      lemma, verbId: lemma, classId: paradigm.conjugation, classSource: 'regularRule', reflexive: false,
      auxiliaries: uses.map(use => use.verb), particle, base: baseWord, root: base.root, prefix, conjugation: paradigm.conjugation,
      entry, auxiliaryUses: uses, geBlocked: null, flags: flagsOf(lemma, entry), participleWithGe: null, readingCondition,
      particleWords: segmentation.particleWords,
    };
    return applyHints({ lexeme, steps, tags }, segmentation, hints, assumed, rootListed);
  });
}

/** The class, stem and auxiliary hints, then stress: the lexeme, its steps (assumptions first), and its source. */
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
        class: hints.classHint, preterite: stems.preterite!, participle: stems.participle!, auxiliaries: lexeme.auxiliaryUses, hinted: true,
        ...(stems.present2 === undefined ? {} : { present2: stems.present2 }),
        ...(stems.subjunctive === undefined ? {} : { subjunctive: [{ text: stems.subjunctive }] }),
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
    const entry = lexeme.entry!;
    if (!entry.hinted) {
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
  // A stressed first syllable undoes an assumed prefix (beamen is not be- + amen): the verb takes ge-.
  const assumedPrefix = steps.some(s => s.rule === 'de.classify.assume-inseparable');
  if (unstressed === false && assumedPrefix) {
    lexeme = { ...lexeme, prefix: null };
    steps = steps.filter(s => s.rule !== 'de.classify.assume-inseparable');
  }
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
  // Assumptions first, then the hints, then what the lexicon and the rules say.
  const ordered = [...steps.filter(s => s.kind === 'assumption'), ...hintSteps, ...steps.filter(s => s.kind !== 'assumption')];
  return { lexeme: { ...lexeme, geBlocked, participleWithGe, classSource }, steps: ordered, tags: built.tags };
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
  const withOpening = built.map(item => ({ ...item, steps: [...opening, ...item.steps] }));
  // Several paradigms are a fork of tagged choices (each with its pattern); one paradigm is one outcome.
  if (withOpening.length > 1 && withOpening.every(item => item.tags.pattern !== undefined)) {
    return paradigmFork(withOpening.map(({ lexeme, steps, tags }) => ({
      pattern: tags.pattern!, ...(tags.condition === undefined ? {} : { condition: tags.condition }), lexeme, steps,
    })));
  }
  return withOpening.map(({ lexeme, steps, tags }): Outcome<GermanLexeme> => ({ value: lexeme, steps, tags }));
}

/** The lexeme of a verb a compound tense names (haben, sein, werden): its first paradigm, without hints. */
export function germanLexemeOf(lemma: string): GermanLexeme {
  return classifyGerman({ infinitive: lemma })[0]!.value;
}
