import type { Explanation } from './i18n/explain.js';
import type { ConjugatedForm, ResolvedTarget, UnavailableTarget } from './types.js';

/** How a label words a person and number: `1 singular` by default, or in a locale's terms (`1e persoon enkelvoud`). */
export type PersonLabel = (person: number, number: string) => string;
const plainPerson: PersonLabel = (person, number) => `${person} ${number}`;

/** What a target says about itself, as today's labels print it: person and number, gender, participle agreement. */
function targetParts(target: ResolvedTarget, labels: { mood: string; tense: string }, person: PersonLabel): string[] {
  return [
    labels.mood, labels.tense, ...(target.person ? [person(target.person, target.number ?? '')] : []),
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
export function targetLabel(target: ResolvedTarget, labels: { mood: string; tense: string }, person: PersonLabel = plainPerson): string {
  return [...targetParts(target, labels, person), ...extraParts(target)].join(' / ');
}

/** The label of a form: its target, then its variant, then voice, case, region and subject where it has them. */
export function formLabel(form: ConjugatedForm, person: PersonLabel = plainPerson): string {
  return [
    ...targetParts(form.target, form.labels, person),
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
export function unavailableLine(unavailable: UnavailableTarget, labels: { mood: string; tense: string }, explanation: Explanation,
  person: PersonLabel = plainPerson): string {
  const steps = explanation.sections.flatMap(section => section.steps.map(s => s.text));
  return `${targetLabel(unavailable.target, labels, person)}: unavailable (${steps.length ? steps.join(' ') : unavailable.explanation})`;
}
