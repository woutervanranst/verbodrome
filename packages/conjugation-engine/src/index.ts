export { conjugate } from './conjugate.js';
export { conjugationOptions, ConjugationOptionsBuilder, parseConjugationOptions } from './options.js';
export { renderParts } from './render.js';
export { normalizeForComparison } from './normalize.js';
export { getCatalogue, getSubjects } from './catalogue.js';
export { explain } from './explain.js';
export { languages } from './default-engine.js';
export { equivalentTenses } from './equivalence/index.js';
// A consumer can assemble an engine of its own: some of the built-in packs and catalogs, or more.
export { createEngine } from './core/engine.js';
export { packs } from './languages/index.js';
export { locales } from './i18n/locales/index.js';
export { ConjugationError } from './errors.js';
export type { ConjugationErrorCode } from './errors.js';
export type * from './types.js';
export type { CatalogueEntry, SubjectSlot } from './core/pack.js';
export type { Engine } from './core/engine.js';
export type { EquivalenceOptions, TenseEquivalence, TenseEquivalent, TenseRef } from './equivalence/index.js';
export type { Catalog, Locale, Explainable, ExplainedStep, Explanation } from './explain.js';
