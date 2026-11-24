import type { FrenchSpec } from './fr/spec.js';
import type { DutchSpec } from './nl/spec.js';
import type { SpanishSpec } from './es/spec.js';

/** Adding a language is one line here plus one spec file. */
export interface LanguageRegistry {
  fr: FrenchSpec;
  nl: DutchSpec;
  es: SpanishSpec;
}

export type Language = keyof LanguageRegistry;
