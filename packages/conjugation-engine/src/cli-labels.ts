import type { Explanation } from './i18n/explain.js';
import type { ConjugatedForm, ResolvedTarget, UnavailableTarget } from './types.js';

/** What a target says about itself, as today's labels print it: person and number, gender, participle agreement. */
function targetParts(target: ResolvedTarget, labels: { mood: string; tense: string }): string[] {
  return [
    labels.mood, labels.tense, ...(target.person ? [`${target.person} ${target.number}`] : []),
    ...(target.gender ? [target.gender] : []),
    ...(target.agreement ? [`participle ${target.agreement.gender} ${target.agreement.number}`] : []),
  ];
}

/**
 * What a language with voices, declined participles, regions and subject slots adds, in this order and only when present:
 * the voice, the participle's case, the region (a form's, so never for a target alone) and the subject slot's id.
 */
function extraParts(target: ResolvedTarget, region?: string | null): string[] {
  return [
    ...(target.voice ? [target.voice] : []),
    ...(target.agreement?.case ? [target.agreement.case] : []),
    ...(region ? [region] : []),
    ...(target.subject ? [target.subject] : []),
  ];
}

/** The label of a target that has no form (no variant, so no region). */
export function targetLabel(target: ResolvedTarget, labels: { mood: string; tense: string }): string {
  return [...targetParts(target, labels), ...extraParts(target)].join(' / ');
}

/** The label of a form: its target, then its variant, then voice, case, region and subject where it has them. */
export function formLabel(form: ConjugatedForm): string {
  return [
    ...targetParts(form.target, form.labels),
    ...(form.variant.orthography !== 'both' ? [form.variant.orthography] : []),
    ...(form.variant.pattern ? [form.variant.pattern] : []),
    ...(form.variant.usage !== 'standard' ? [form.variant.usage] : []),
    ...(form.variant.condition ? [form.variant.condition] : []),
    ...extraParts(form.target, form.variant.region),
  ].join(' / ');
}

/**
 * The line for a target that has no form: its label and, in brackets, the reason as `explanation` words it (the text of
 * its steps, in the locale it was explained in). A target that records no step (a pack without rules) keeps the pack's
 * own sentence, `unavailable.explanation`.
 */
export function unavailableLine(unavailable: UnavailableTarget, labels: { mood: string; tense: string }, explanation: Explanation): string {
  const steps = explanation.sections.flatMap(section => section.steps.map(s => s.text));
  return `${targetLabel(unavailable.target, labels)}: unavailable (${steps.length ? steps.join(' ') : unavailable.explanation})`;
}
