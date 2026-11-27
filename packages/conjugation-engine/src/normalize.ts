import { engine } from './default-engine.js';
import type { Language } from './types.js';

/** The key answers in `language` are compared by: equal keys are the same answer (Latin ignores macrons). */
export function normalizeForComparison(language: Language, text: string): string {
  return engine.normalizeForComparison(language, text);
}
