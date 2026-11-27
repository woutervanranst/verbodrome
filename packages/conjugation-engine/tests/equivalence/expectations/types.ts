import type { MatchType, NoteKey, Relaxation } from '../../../src/equivalence/index.js';
import type { Language } from '../../../src/types.js';

/**
 * One pinned lookup, as a teacher would accept it (never a copy of what the derivation happens to return): the first
 * match of `equivalentTenses(from, tense, to)` is `top` with `score` and `match`, its `relaxed` and `notes` are
 * `extra.relaxed ?? []` and `extra.notes ?? []`. `extra.second` is the second match when a teacher would accept it too,
 * `null` when there must be no second match, and absent when the second match is not pinned (because it is a weak
 * relative, not an answer). With `match: 'none'` (and `top: null`, `score: 0`) the lookup has no match and
 * `extra.notes` are the notes of the lookup.
 */
export type Expectation = readonly [
  from: Language, tense: string, to: Language, top: string | null, score: number, match: MatchType | 'none',
  extra?: { readonly relaxed?: readonly Relaxation[]; readonly notes?: readonly NoteKey[]; readonly second?: string | null },
];
