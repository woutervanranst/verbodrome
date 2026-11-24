import type { ConjugatedForm, ResolvedTarget } from './types.js';

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
