/**
 * The pack-authoring API, importable as `conjugation-engine/core`: everything a language pack is written with. The
 * package root keeps the consumer API (`conjugate`, `renderParts`, `getCatalogue`...). `docs/pack-authoring.md` is the guide.
 */
export { createEngine } from './engine.js';
export { deriveWords, stagedEngine, validateGrammar } from './staged.js';
export { defineRules, step } from './derivation.js';
export { one, chain, combine, mergeTags, mergeMarks, usageRank } from './fork.js';
export { applyJunctureRules } from './juncture.js';
export { wordPart } from './clause.js';
export { grammaticalPart, itemAt } from '../parts.js';
export { allPersons, noPersons, moodEntries, variantRank, defaultSubjectsFor } from './pack.js';
export { ConjugationError } from '../errors.js';

export type { Engine } from './engine.js';
export type { LanguageEngine, LanguagePack, SubjectSlot, CatalogueEntry, PackRendering } from './pack.js';
export type { OptionSchema, FieldSpec } from './options.js';
export type { LanguageSpec, OptionFieldsOf } from './spec.js';
export type { StagedGrammar, Cell, LexemeBase, Unavailability } from './staged.js';
export type { ClauseGrammar, ClauseContext, ChainWord, WordPartOptions } from './clause.js';
export type { Periphrasis, ChainElement, VerbRef } from './periphrasis.js';
export type { Fork, Marks, Outcome, VariantTags } from './fork.js';
export type { JunctureRule, Juncture } from './juncture.js';
export type { DerivationStep, RuleInfo, Stage, StepKind, StepParam, ParamKind, TermRef } from './derivation.js';
export type { Work, Citation } from './sources.js';
export type { Catalog } from '../i18n/catalog.js';
export type { ConjugationErrorCode } from '../errors.js';
export type {
  Agreement, Case, ConjugationPart, FormVariant, GeneratedForm, GenerationResult, Gender, GrammaticalNumber, Mood, Onset,
  Orthography, PartFeatures, PartRole, Person, ResolvedTarget, Tense, UnavailableTarget, VerbAnalysis, VerbForm, Voice,
} from '../types.js';
