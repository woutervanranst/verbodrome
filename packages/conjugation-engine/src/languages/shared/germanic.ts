/**
 * Mechanisms the Germanic packs share, with the data passed in: splitting a derivative into particle, prefix and root;
 * the several paradigms of one lemma as tagged outcomes; and the place of a separable particle in a main clause. Nothing
 * here knows a language: the particle tables, the lexicon and the rules a pack records are the pack's own.
 */
import type { ChainWord } from '../../core/clause.js';
import type { DerivationStep } from '../../core/derivation.js';
import type { Fork, VariantTags } from '../../core/fork.js';
import type { LexemeBase } from '../../core/grammar.js';

/** A language's closed lists of verbal particles and prefixes, and what a plausible root looks like. */
export interface ParticleTables {
  /** Particles that are always separable (stressed). */
  readonly separable: readonly string[];
  /** Particles that are separable when stressed and inseparable when not; which reading a verb has is lexical. */
  readonly dual: readonly string[];
  /** Prefixes that never separate. */
  readonly inseparable: readonly string[];
  /** The consonant clusters a word may start with. */
  readonly onsets: readonly string[];
  /** The infinitive ending, stripped before a root is judged. */
  readonly infinitiveEnding: RegExp;
}

/** One analysis of a lemma: an optional separable or dual particle, then an optional inseparable prefix, then the root. */
export interface DerivativeSplit {
  readonly particle: string | null;
  readonly prefix: string | null;
  readonly root: string;
}

const vowel = /[aeiouyäöü]/u;

/** The consonant cluster `word` starts with (`qu` counts as one consonant), or '' when it starts with a vowel. */
function initialCluster(word: string): string {
  return /^(?:qu|[^aeiouyäöü])*/u.exec(word)?.[0] ?? '';
}

/**
 * Whether `root` can be a verb of its own: without its infinitive ending it has at least two letters and a vowel, and
 * it starts with a vowel or with one of the language's word-initial consonant clusters.
 */
export function isPlausibleRoot(root: string, tables: ParticleTables): boolean {
  const stem = root.replace(tables.infinitiveEnding, '');
  if (stem.length < 2 || !vowel.test(stem)) return false;
  const cluster = initialCluster(stem);
  return cluster === '' || tables.onsets.includes(cluster);
}

const longestFirst = (items: readonly string[]): string[] => [...items].sort((a, b) => b.length - a.length);

/**
 * Every analysis of `lemma` into [separable or dual particle] + [inseparable prefix] + root, longest particle first and,
 * for one particle, the analysis with a prefix before the one without; then the analyses with a prefix only. Only
 * plausible roots are kept, and the unsplit reading is not included.
 */
export function splitDerivative(lemma: string, tables: ParticleTables): readonly DerivativeSplit[] {
  const splits: DerivativeSplit[] = [];
  const prefixes = longestFirst(tables.inseparable);
  const withPrefix = (rest: string, particle: string | null): DerivativeSplit[] => prefixes.flatMap(prefix => {
    const root = rest.slice(prefix.length);
    return rest.startsWith(prefix) && isPlausibleRoot(root, tables) ? [{ particle, prefix, root }] : [];
  });
  for (const particle of longestFirst([...tables.separable, ...tables.dual])) {
    if (!lemma.startsWith(particle)) continue;
    const rest = lemma.slice(particle.length);
    splits.push(...withPrefix(rest, particle));
    if (isPlausibleRoot(rest, tables)) splits.push({ particle, prefix: null, root: rest });
  }
  splits.push(...withPrefix(lemma, null));
  return splits;
}

/** One paradigm of a lemma: its pattern label (no `.`), when it applies, its lexeme and its own classification steps. */
export interface ParadigmChoice<X> {
  readonly pattern: string;
  readonly condition?: string;
  readonly lexeme: X;
  readonly steps: readonly DerivationStep[];
}

/** The paradigms of one lemma as a fork, in the given order, each tagged with its pattern and condition. */
export function paradigmFork<X>(choices: readonly ParadigmChoice<X>[]): Fork<X> {
  return choices.map(({ pattern, condition, lexeme, steps }) => {
    const tags: VariantTags = condition === undefined ? { pattern } : { pattern, condition };
    return { value: lexeme, steps, tags };
  });
}

/**
 * Where a verbal particle goes in a verb-second main clause. A separable particle of a finite lexical verb stands apart
 * at the end of the clause: the words are unchanged and `final` is the particle. Otherwise (the lexical verb is
 * non-finite, or the particle does not separate) it is written together with the lexical verb's word and `final` is
 * null. The words keep their steps; the pack records the step that explains the placement.
 */
export function placeParticle(words: readonly ChainWord[], particle: LexemeBase['particle']): { readonly words: readonly ChainWord[]; readonly final: string | null } {
  if (particle === null) return { words, final: null };
  const lexical = words.find(word => word.role === 'lexicalVerb');
  if (particle.separable && lexical?.cell?.kind === 'finite') return { words, final: particle.text };
  return { words: words.map(word => word === lexical ? { ...word, text: particle.text + word.text } : word), final: null };
}
