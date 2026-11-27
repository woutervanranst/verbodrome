/**
 * Tense equivalence between the registered languages: for a tense of one language, the ranked tenses of another that a
 * trainer can ask for. The registry below holds one total tense map per language, the languages whose passive is
 * modelled and the pair overrides; `equivalentTenses` validates a lookup and hands it to the derivation. It reads no
 * language pack (only their types), so this subpath loads without them.
 */
import { ConjugationError } from '../errors.js';
import type { Language, MoodFor, TenseFor } from '../types.js';
import type { ConceptId, ConceptLink, LanguageMap, NoteKey, Register } from './concepts.js';
import { deriveEquivalents } from './derive.js';
import type { EquivalenceData, EquivalenceOptions, EquivalentFound, MatchType, RawEquivalence, Relaxation } from './derive.js';
import { fr } from './fr.js';
import { nl } from './nl.js';
import { overrides } from './overrides.js';

/** The registered languages that have a tense map so far. */
export type MappedLanguage = Extract<Language, 'fr' | 'nl'>;

/** Freezes the registry and each map's link lists (the links themselves are frozen by `link`). */
function frozen<T extends Readonly<Record<string, Readonly<Record<string, readonly ConceptLink[]>>>>>(registry: T): T {
  for (const map of Object.values(registry)) {
    for (const links of Object.values(map)) Object.freeze(links);
    Object.freeze(map);
  }
  return Object.freeze(registry);
}

export const maps = frozen({ fr, nl } satisfies { readonly [L in MappedLanguage]: LanguageMap<L> });

/** The languages with a modelled passive: a passive lookup may start only from one of them. */
export const passiveLanguages: readonly MappedLanguage[] = Object.freeze([]);

export const equivalenceData: EquivalenceData = Object.freeze({ maps, overrides, passiveLanguages });

/** A tense of language `L` as a mood and one of that mood's tenses. */
export type TenseRef<L extends Language> = { [M in MoodFor<L>]: { readonly mood: M; readonly tense: TenseFor<L, M> } }[MoodFor<L>];

/** One ranked tense of the target language `L`. */
export type TenseEquivalent<L extends Language = Language> = Omit<EquivalentFound, 'tense'> & { readonly tense: TenseRef<L> };

/**
 * The answer to a lookup: the ranked `matches` (empty when nothing corresponds) and the `notes` of the lookup as a
 * whole, which say why when `matches` is empty (`eq.note.no-counterpart` and the source tense's own notes).
 */
export interface TenseEquivalence<L extends Language = Language> {
  readonly matches: readonly TenseEquivalent<L>[];
  readonly notes: readonly NoteKey[];
}

const mapOf = (language: string): Readonly<Record<string, readonly ConceptLink[]>> | undefined =>
  Object.hasOwn(maps, language) ? (maps as Readonly<Record<string, Readonly<Record<string, readonly ConceptLink[]>>>>)[language] : undefined;

function tenseRef<L extends Language>(key: string): TenseRef<L> {
  const dot = key.indexOf('.');
  return Object.freeze({ mood: key.slice(0, dot), tense: key.slice(dot + 1) }) as TenseRef<L>;
}

/**
 * The tenses of `to` that correspond to `tense` of `from`, best first. A match is `exact` (a shared concept),
 * `approximate` (the ladder relaxed a dimension, named in `relaxed`, or a stand-in) or `override` (a pair override);
 * `register` is the target tense's, and `notes` are message keys of the core catalogs. With `{ voice: 'passive' }`
 * the source tense is passive: only a language with a modelled passive can be the source, and a target without one
 * gets its active tenses, flagged approximate.
 */
export function equivalentTenses<F extends MappedLanguage, T extends MappedLanguage>(
  from: F, to: T, tense: TenseRef<F>, options: EquivalenceOptions = {},
): TenseEquivalence<T> {
  for (const language of [from, to]) {
    if (mapOf(language) === undefined) {
      throw new ConjugationError('UNSUPPORTED_LANGUAGE', `Language must be one of: ${Object.keys(maps).join(', ')}.`);
    }
  }
  const { mood, tense: name } = (typeof tense === 'object' && tense !== null ? tense : {}) as { mood?: unknown; tense?: unknown };
  const key = `${String(mood)}.${String(name)}`;
  if (typeof mood !== 'string' || typeof name !== 'string' || !Object.hasOwn(mapOf(from)!, key)) {
    throw new ConjugationError('INVALID_TARGET', `${from} has no tense ${key}.`);
  }
  if (options.voice !== undefined && options.voice !== 'active' && options.voice !== 'passive') {
    throw new ConjugationError('INVALID_REQUEST', `Voice must be one of: active, passive.`);
  }
  const { matches, notes } = deriveEquivalents(equivalenceData, from, to, key, options);
  return Object.freeze({
    matches: Object.freeze(matches.map(entry => Object.freeze({ ...entry, tense: tenseRef<T>(entry.tense) }))),
    notes,
  });
}

/** One lookup of the matrix: a source tense (a `mood.tense` key) into one target language. */
export interface MatrixRow {
  readonly from: MappedLanguage;
  readonly tense: string;
  readonly to: MappedLanguage;
  readonly results: RawEquivalence;
}

/**
 * Every lookup between the mapped languages, active voice: source languages by code, their tenses in catalogue order,
 * target languages by code. `tests/equivalence/matrix.tsv` is this matrix, checked in.
 */
export function equivalenceMatrix(): readonly MatrixRow[] {
  const codes = (Object.keys(maps) as MappedLanguage[]).sort();
  return Object.freeze(codes.flatMap(from => Object.keys(mapOf(from)!).flatMap(tense => codes.map(to =>
    Object.freeze({ from, tense, to, results: deriveEquivalents(equivalenceData, from, to, tense) })))));
}

export type { ConceptId, EquivalenceOptions, MatchType, NoteKey, Register, Relaxation };
