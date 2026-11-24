import type { FrenchSpec } from './fr/spec.js';
import type { DutchSpec } from './nl/spec.js';
import type { GermanSpec } from './de/spec.js';

/** Adding a language is one line here plus one spec file. */
export interface LanguageRegistry {
  fr: FrenchSpec;
  nl: DutchSpec;
  de: GermanSpec;
}

export type Language = keyof LanguageRegistry;
