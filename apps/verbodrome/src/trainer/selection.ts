import { levelIncludes, QUICK_LEVELS } from '../config/levels';
import type { Level } from '../config/levels';
import { TENSES } from '../config/tenses';
import { VERBS } from '../config/verbs';
import type { Selection } from './question';

export const DEFAULT_LEVEL: Level = 'g1';

export const tensesForLevel = (level: Level): string[] =>
  TENSES.filter(tense => levelIncludes(level, tense.level)).map(tense => tense.id);

export const verbsForLevel = (level: Level): string[] =>
  VERBS.filter(verb => levelIncludes(level, verb.level)).map(verb => verb.fr);

export const selectionForLevel = (level: Level): Selection =>
  ({ verbs: verbsForLevel(level), tenses: tensesForLevel(level) });

const sameSet = (a: readonly string[], b: readonly string[]): boolean =>
  a.length === b.length && a.every(item => b.includes(item));

/** The quick-pick level a list of ids corresponds to exactly, if any. */
export function matchingLevel(ids: readonly string[], forLevel: (level: Level) => string[]): Level | null {
  return QUICK_LEVELS.find(level => sameSet(ids, forLevel(level))) ?? null;
}

/** Drop ids that no longer exist in the configuration (after a config change). */
export function sanitize(value: unknown): Selection | null {
  if (!value || typeof value !== 'object') return null;
  const { verbs, tenses } = value as { verbs?: unknown; tenses?: unknown };
  if (!Array.isArray(verbs) || !Array.isArray(tenses)) return null;
  const selection = {
    verbs: VERBS.map(verb => verb.fr).filter(fr => verbs.includes(fr)),
    tenses: TENSES.map(tense => tense.id).filter(id => tenses.includes(id)),
  };
  return selection.verbs.length && selection.tenses.length ? selection : null;
}

export function toggle(ids: readonly string[], id: string): string[] {
  return ids.includes(id) ? ids.filter(item => item !== id) : [...ids, id];
}
