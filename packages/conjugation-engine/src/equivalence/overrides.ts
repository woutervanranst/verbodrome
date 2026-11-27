/**
 * Pair overrides: the few (source language, source tense, target language) lookups where the concepts alone do not
 * give what a learner expects. Each says why in `reason`, and `tests/equivalence/api.test.ts` checks that each one
 * changes the derived list (an override that changes nothing is dead weight).
 */
import type { Language } from '../types.js';
import type { NoteKey, TenseKeyFor } from './concepts.js';
import type { RawOverride } from './derive.js';

export interface PairOverride<F extends Language = Language, T extends Language = Language> {
  readonly from: F;
  readonly to: T;
  readonly tense: TenseKeyFor<F>;
  /** `replace`: the result is the list; `prepend`: it goes first; `exclude`: its tenses are removed. */
  readonly mode: 'replace' | 'prepend' | 'exclude';
  readonly result: readonly { readonly tense: TenseKeyFor<T>; readonly note?: NoteKey }[];
  /** Why this pair does not line up; more than 30 characters. */
  readonly reason: string;
}

/** Types one override against its two languages' tenses. */
export function override<F extends Language, T extends Language>(entry: PairOverride<F, T>): RawOverride {
  return Object.freeze({ ...entry, result: Object.freeze(entry.result.map(result => Object.freeze({ ...result }))) });
}

export const overrides: readonly RawOverride[] = Object.freeze([
  override({
    from: 'fr', to: 'nl', tense: 'indicative.near_future', mode: 'prepend',
    result: [{ tense: 'indicative.present', note: 'eq.pair.fr-nl.near-future' }],
    reason: 'The app shows the Dutch gaan plus infinitive, which is the present of gaan; the pivot alone ranks the Dutch future (0.60) first.',
  }),
  override({
    from: 'fr', to: 'nl', tense: 'indicative.recent_past', mode: 'prepend',
    result: [{ tense: 'indicative.perfect', note: 'eq.pair.fr-nl.recent-past' }],
    reason: 'The pivot already ranks the Dutch perfect first (0.50); the override only attaches the note that the app adds the word net.',
  }),
  override({
    from: 'fr', to: 'nl', tense: 'imperative.present', mode: 'prepend',
    result: [{ tense: 'imperative.present', note: 'eq.pair.fr-nl.hortative' }],
    reason: 'The pivot already ranks the Dutch imperative first; the override only attaches the note that the first person plural is laten we plus infinitive.',
  }),
]);
