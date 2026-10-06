import { ConjugationError } from './errors.js';
import type { ConjugationPart, Onset, PartFeatures, PartRole, ResolvedTarget } from './types.js';

export const emptyFeatures: PartFeatures = Object.freeze({
  mood: null, tense: null, person: null, number: null, gender: null, verbForm: null,
});

export function grammaticalPart(
  role: PartRole,
  text: string,
  lemma: string | null = null,
  features: Partial<PartFeatures> = {},
  joinBefore: ConjugationPart['joinBefore'] = 'space',
  aspiratedH = false,
): ConjugationPart {
  if (!text) throw new ConjugationError('GENERATION_FAILURE', `Empty ${role} component.`);
  const normalized = text.normalize('NFC');
  const initial = normalized.toLowerCase();
  const onset: Onset = initial.startsWith('h')
    ? (aspiratedH ? 'aspiratedH' : 'muteH')
    : (/^[aeiouyàâäéèêëîïôöùûüœæ]/u.test(initial) ? 'vowel' : 'consonant');
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

export function deepFreeze<T>(value: T): T {
  if (value !== null && typeof value === 'object' && !Object.isFrozen(value)) {
    Object.freeze(value);
    for (const child of Object.values(value)) deepFreeze(child);
  }
  return value;
}
