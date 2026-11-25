/** Shared helpers of the Latin tests. */
import { conjugate } from '../../src/index.js';
import type { ConjugatedForm } from '../../src/types.js';

const finiteMoods = ['indicative', 'subjunctive', 'imperative'];

/**
 * The texts of the forms of a query, in output order. `voice` defaults to active for the finite moods and is left out
 * for the others unless given; an omitted `tense` is left out too.
 */
export function forms(infinitive: string, mood: string, tense?: string, voice?: string, extra: Record<string, unknown> = {}): string[] {
  const chosen = voice ?? (finiteMoods.includes(mood) ? 'active' : undefined);
  return conjugate({
    language: 'la', infinitive, mood, ...(tense === undefined ? {} : { tense }), ...(chosen === undefined ? {} : { voice: chosen }), ...extra,
  } as never).forms.map(form => form.text);
}

/** The preferred form of one active target. */
export function form(infinitive: string, mood: string, tense: string, subject: string): ConjugatedForm {
  const found = conjugate({ language: 'la', infinitive, mood, tense, voice: 'active', subject } as never).forms.find(item => item.preferred);
  if (!found) throw new Error(`No form for ${infinitive} ${mood} ${tense} ${subject}.`);
  return found;
}

/** The rule ids of a form's part steps, in order. */
export function explainIds(form: ConjugatedForm): string[] {
  return form.parts.flatMap(part => part.steps ?? []).map(step => step.rule);
}
