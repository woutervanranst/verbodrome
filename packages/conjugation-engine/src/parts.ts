import type { PackRendering } from './core/pack.js';
import { ConjugationError } from './errors.js';
import type { ConjugationPart, PartFeatures, PartRole, ResolvedTarget } from './types.js';

export const emptyFeatures: PartFeatures = Object.freeze({
  mood: null, tense: null, person: null, number: null, gender: null, verbForm: null,
});

export function grammaticalPart(
  rendering: PackRendering,
  role: PartRole,
  text: string,
  lemma: string | null = null,
  features: Partial<PartFeatures> = {},
  joinBefore: ConjugationPart['joinBefore'] = 'space',
  aspiratedH = false,
): ConjugationPart {
  if (!text) throw new ConjugationError('GENERATION_FAILURE', `Empty ${role} component.`);
  const normalized = text.normalize('NFC');
  const onset = rendering.onset(normalized, { aspiratedH });
  return { role, text: normalized, lemma, features: { ...emptyFeatures, ...features }, phonology: { onset }, joinBefore };
}

export function finiteFeatures(target: ResolvedTarget): Partial<PartFeatures> {
  return {
    mood: target.mood, tense: target.tense, person: target.person,
    number: target.number, gender: null, verbForm: 'finite',
  };
}

export function personIndex(target: ResolvedTarget): number {
  if (target.person === null || target.number === null) {
    throw new ConjugationError('GENERATION_FAILURE', 'A finite inflection requires person and number.');
  }
  return (target.number === 'plural' ? 3 : 0) + target.person - 1;
}

export function itemAt<T>(items: readonly T[], index: number): T {
  const value = items[index];
  if (value === undefined) throw new ConjugationError('GENERATION_FAILURE', `Missing grammatical item at index ${index}.`);
  return value;
}

/** Freezes `value` and everything reachable from it, also inside containers that are already frozen; cycles are fine. */
export function deepFreeze<T>(value: T): T {
  const visited = new WeakSet<object>();
  const freeze = (item: unknown): void => {
    if (item === null || typeof item !== 'object' || visited.has(item)) return;
    visited.add(item);
    Object.freeze(item);
    for (const child of Object.values(item)) freeze(child);
  };
  freeze(value);
  return value;
}
