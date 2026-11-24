import { engine } from './default-engine.js';
import type { Catalog, Locale } from './i18n/catalog.js';
import type { Explainable, Explanation } from './i18n/explain.js';
import type { Language } from './types.js';

export type { Catalog, Locale };
export type { ExplainedStep, Explanation } from './i18n/explain.js';

/** A form, an unavailable target or a verb analysis of `language`, step by step in the language of `locale`. */
export function explain(language: Language, subject: Explainable, locale: Locale): Explanation {
  return engine.explain(language, subject, locale);
}
