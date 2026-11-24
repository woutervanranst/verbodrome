import { catalogueLabels } from './core/engine.js';
import type { CatalogueEntry } from './core/pack.js';
import { engine } from './default-engine.js';
import type { ConjugationOptions, Language, ResolvedTarget } from './types.js';

export { resolvedTargetKey, targetKey } from './core/target.js';
export type { CatalogueEntry } from './core/pack.js';

export function getCatalogue(language: Language): readonly CatalogueEntry[] {
  return engine.getCatalogue(language);
}

export function expandTargets(options: ConjugationOptions): ResolvedTarget[] {
  return engine.expandTargets(options);
}

export function labelsFor(language: Language, target: ResolvedTarget): { mood: string; tense: string } {
  return catalogueLabels(engine.getCatalogue(language), target);
}
