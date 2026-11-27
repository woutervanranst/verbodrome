/** Compiled by `npm run typecheck`: the map types reject a missing or foreign tense, an unknown note or concept. */
import { link } from '../../src/equivalence/concepts.js';
import type { LanguageMap, TenseKeyFor } from '../../src/equivalence/concepts.js';
import { fr } from '../../src/equivalence/fr.js';
import { maps } from '../../src/equivalence/index.js';
import { nl } from '../../src/equivalence/nl.js';
import type { Language } from '../../src/types.js';

export const nearFuture: TenseKeyFor<'fr'> = 'indicative.near_future';
// @ts-expect-error French has an imperfect, no indicative past.
export const frenchPast: TenseKeyFor<'fr'> = 'indicative.past';

const { 'indicative.present': _present, ...withoutPresent } = fr;
// @ts-expect-error A map without one of the catalogue tenses is not total.
export const partial: LanguageMap<'fr'> = withoutPresent;

// @ts-expect-error Dutch has no near future.
export const foreign = { ...nl, 'indicative.near_future': [link('NEAR_FUTURE', 1)] } satisfies LanguageMap<'nl'>;

// @ts-expect-error A note must be a key of the eq.* catalog.
export const unknownNote = link('PRESENT', 1, { note: 'eq.no-such-key' });
// @ts-expect-error A concept must be one of the inventory.
export const unknownConcept = link('NO_SUCH', 1);

export const registry: { readonly [L in Language]: LanguageMap<L> } = maps;
// @ts-expect-error A registered language without a map does not compile.
export const unmapped: { readonly [L in Language]: LanguageMap<L> } = { fr, nl };
