import type { MatchType, Relaxation } from '../../../src/equivalence/index.js';
import type { Language } from '../../../src/types.js';

/**
 * One pinned lookup: the first match of `equivalentTenses(from, tense, to)` is `top` with `score` and `match`, its
 * `relaxed` and `notes` are `extra.relaxed ?? []` and `extra.notes ?? []`, and the second match is `extra.second`
 * (there is none when `second` is absent). With `match: 'none'` (and `top: null`, `score: 0`) the lookup has no match
 * and `extra.notes` are the notes of the lookup. Notes are plain strings: a row may name the notes of a language that has
 * no map yet, and is checked once both of its languages have one.
 */
export type Expectation = readonly [
  from: Language, tense: string, to: Language, top: string | null, score: number, match: MatchType | 'none',
  extra?: { readonly relaxed?: readonly Relaxation[]; readonly notes?: readonly string[]; readonly second?: string },
];
