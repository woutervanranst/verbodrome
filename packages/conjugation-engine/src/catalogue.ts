import { catalogueLabels } from './core/engine.js';
import type { CatalogueEntry, SubjectSlot } from './core/pack.js';
import { engine } from './default-engine.js';
import type { ConjugationOptions, Language, ResolvedTarget } from './types.js';

export { resolvedTargetKey, targetKey } from './core/target.js';
export type { CatalogueEntry, SubjectSlot } from './core/pack.js';

export function getCatalogue(language: Language): readonly CatalogueEntry[] {
  return engine.getCatalogue(language);
}

/** The subject slots of `language`; empty for a language without slots. */
export function getSubjects(language: Language): readonly SubjectSlot[] {
  return engine.getSubjects(language);
}

export function expandTargets(options: ConjugationOptions): ResolvedTarget[] {
  return engine.expandTargets(options);
}

export function labelsFor(language: Language, target: ResolvedTarget): { mood: string; tense: string } {
  return catalogueLabels(engine.getCatalogue(language), target);
}
