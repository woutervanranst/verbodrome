/**
 * The tense equivalence registry: one total tense map per language, the languages whose passive is modelled, and the
 * data the derivation reads. A language registered in `src/languages/registry.ts` gets its map here.
 */
import type { Language } from '../types.js';
import type { ConceptLink, LanguageMap } from './concepts.js';
import type { EquivalenceData } from './derive.js';
import { fr } from './fr.js';
import { nl } from './nl.js';

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

export const equivalenceData: EquivalenceData = Object.freeze({ maps, overrides: Object.freeze([]), passiveLanguages });
