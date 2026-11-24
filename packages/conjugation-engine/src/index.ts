export { conjugate } from './conjugate.js';
export { conjugationOptions, ConjugationOptionsBuilder, parseConjugationOptions } from './options.js';
export { renderParts } from './render.js';
export { getCatalogue, getSubjects } from './catalogue.js';
export { explain } from './explain.js';
export { languages } from './default-engine.js';
// A consumer can assemble an engine of its own: some of the built-in packs and catalogs, or more.
export { createEngine } from './core/engine.js';
export { packs } from './languages/index.js';
export { locales } from './i18n/locales/index.js';
export { ConjugationError } from './errors.js';
export type { ConjugationErrorCode } from './errors.js';
export type * from './types.js';
export type { CatalogueEntry, SubjectSlot } from './core/pack.js';
export type { Engine } from './core/engine.js';
export type { Catalog, Locale, Explainable, ExplainedStep, Explanation } from './explain.js';
import { comparisonFor } from './core/compare.js';
import { packs as builtInPacks } from './languages/index.js';
import type { Language } from './types.js';

/** The key answers are compared by in `language`: equal keys are the same answer (Latin ignores macrons). */
export const normalizeForComparison: (language: Language, text: string) => string = comparisonFor(builtInPacks);
