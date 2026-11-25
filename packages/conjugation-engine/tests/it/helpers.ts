import { conjugate, renderParts } from '../../src/index.js';
import type { ConjugatedForm } from '../../src/index.js';
import { resolvedTargetKey } from '../../src/core/target.js';

type Options = Readonly<Record<string, unknown>>;

/** The forms of a query, in the engine's order (catalogue, slot, then rank). */
export function all(infinitive: string, mood: string, tense: string, options: Options = {}): readonly ConjugatedForm[] {
  return conjugate({ language: 'it', infinitive, mood, tense, ...options } as never).forms;
}

/** A form without its subject pronoun: the pro-drop form. */
export const bareText = (form: ConjugatedForm): string => renderParts('it', form.parts, { bare: true });

/** One entry per resolved target, in order: its forms' texts joined with `/` in rank order. */
function grouped(forms: readonly ConjugatedForm[], text: (form: ConjugatedForm) => string): string[] {
  const groups = new Map<string, string[]>();
  for (const form of forms) {
    const key = resolvedTargetKey(form.target);
    groups.set(key, [...groups.get(key) ?? [], text(form)]);
  }
  return [...groups.values()].map(texts => [...new Set(texts)].join('/'));
}

/** Bare texts per target (alternatives joined with `/`). */
export const bare = (infinitive: string, mood: string, tense: string, options: Options = {}): string[] =>
  grouped(all(infinitive, mood, tense, options), bareText);

/** Full texts (with the subject pronoun), one per form. */
export const texts = (infinitive: string, mood: string, tense: string, options: Options = {}): string[] =>
  all(infinitive, mood, tense, options).map(form => form.text);

/** The bare forms of one subject, joined with `/`. */
export const bareOf = (infinitive: string, mood: string, tense: string, subject: string, options: Options = {}): string =>
  bare(infinitive, mood, tense, { ...options, subject }).join('/');

/** The forms of one subject. */
export const forms = (infinitive: string, mood: string, tense: string, subject: string, options: Options = {}): readonly ConjugatedForm[] =>
  all(infinitive, mood, tense, { ...options, subject });

/** The preferred form of one subject (and gender, when given), with its text and rule ids. */
export function formWith(infinitive: string, mood: string, tense: string, subject: string, gender?: string): ConjugatedForm & { readonly rules: readonly string[] } {
  const found = forms(infinitive, mood, tense, subject, gender === undefined ? {} : { gender })
    .find(f => gender === undefined || f.target.agreement === null || f.target.agreement.gender === gender);
  if (!found) throw new Error(`No form of ${infinitive} ${mood} ${tense} ${subject}`);
  return { ...found, rules: found.ruleIds };
}

export const form = (infinitive: string, mood: string, tense: string, subject: string) => formWith(infinitive, mood, tense, subject);
