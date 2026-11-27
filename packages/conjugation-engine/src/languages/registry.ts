import type { FrenchSpec } from './fr/spec.js';
import type { DutchSpec } from './nl/spec.js';
import type { EnglishSpec } from './en/spec.js';
import type { GermanSpec } from './de/spec.js';
import type { SpanishSpec } from './es/spec.js';
import type { ItalianSpec } from './it/spec.js';

/** Adding a language is one line here plus one spec file. */
export interface LanguageRegistry {
  fr: FrenchSpec;
  nl: DutchSpec;
  en: EnglishSpec;
  de: GermanSpec;
  es: SpanishSpec;
  it: ItalianSpec;
}

export type Language = keyof LanguageRegistry;
