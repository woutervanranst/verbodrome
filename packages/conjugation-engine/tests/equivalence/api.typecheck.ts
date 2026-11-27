/** Compiled by `npm run typecheck`: `equivalentTenses` takes a tense of its source and types the target's tenses. */
import { equivalentTenses } from '../../src/index.js';
import type { TenseEquivalence, TenseEquivalent, TenseRef } from '../../src/index.js';

export const result: TenseEquivalence<'nl'> = equivalentTenses('fr', 'nl', { mood: 'indicative', tense: 'perfect' });
export const first: TenseEquivalent<'nl'> | undefined = result.matches[0];
export const dutchTense: TenseRef<'nl'> | undefined = first?.tense;
export const nearFuture: TenseRef<'fr'> = { mood: 'indicative', tense: 'near_future' };

// @ts-expect-error French has an imperfect, no indicative past.
export const frenchPast = equivalentTenses('fr', 'nl', { mood: 'indicative', tense: 'past' });
// @ts-expect-error A tense is a mood and a tense, nothing more.
export const extraKey = equivalentTenses('fr', 'nl', { mood: 'infinitive', tense: 'present', extra: 1 });
// @ts-expect-error Not a language.
export const unknownLanguage = equivalentTenses('xx', 'nl', { mood: 'indicative', tense: 'present' });
// @ts-expect-error Not a language.
export const unknownTarget = equivalentTenses('fr', 'xx', { mood: 'indicative', tense: 'present' });
// @ts-expect-error A Dutch result has no subjunctive.
export const dutchSubjunctive = first?.tense.mood === 'subjunctive';
// @ts-expect-error There is no 'none' match: an empty list of matches says so, with the result's notes.
export const noneMatch = first?.match === 'none';
