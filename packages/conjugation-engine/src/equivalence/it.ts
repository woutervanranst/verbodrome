/**
 * The Italian tense map (Italian design, section 10, reconciled by the plan; 22 catalogue tenses). The passato prossimo
 * is a present perfect (0.6) that also serves as the spoken past (0.4); the passato remoto is the literary or remote
 * perfective past. The trapassato remoto links `PAST_ANTERIOR` as the French and Spanish past anteriors do, and the
 * pluperfect at 0.6. The design's epistemic and future-in-the-past concepts have the dimensions of `PRESENT`,
 * `FUTURE_PERFECT` and `COND_PERFECT`: they are dropped, and their readings are notes on the future and the conditional
 * past. The negative imperative has the source-only plain imperative, as in Spanish. Not in the design: Italian has no
 * compound participle, so the compound gerundio stands in for it when Italian is the target (avendo cantato).
 */
import { link } from './concepts.js';
import type { LanguageMap } from './concepts.js';

export const it = {
  'indicative.present': [link('PRESENT', 1)],
  'indicative.perfect': [link('PRESENT_PERFECT', 0.6, { note: 'eq.it.perfect-spoken' }), link('PAST_PERFECTIVE', 0.4)],
  'indicative.imperfect': [link('PAST_IMPERFECTIVE', 1)],
  'indicative.pluperfect': [link('PLUPERFECT', 1)],
  'indicative.simple_past': [link('PAST_PERFECTIVE', 1, { register: 'literary', note: 'eq.it.simple-past-remote' })],
  'indicative.past_anterior': [link('PAST_ANTERIOR', 1, { register: 'literary' }), link('PLUPERFECT', 0.6, { register: 'literary' })],
  'indicative.future': [link('FUTURE', 1, { note: 'eq.it.future-supposition' })],
  'indicative.future_perfect': [link('FUTURE_PERFECT', 1)],
  'subjunctive.present': [link('SUBJ_PRESENT', 1)],
  'subjunctive.past': [link('SUBJ_PERFECT', 1)],
  'subjunctive.imperfect': [link('SUBJ_IMPERFECT', 1)],
  'subjunctive.pluperfect': [link('SUBJ_PLUPERFECT', 1)],
  'conditional.present': [link('COND_PRESENT', 1)],
  'conditional.past': [link('COND_PERFECT', 1, { note: 'eq.it.cond-past-future-in-past' })],
  'imperative.present': [link('IMP_PRESENT', 1)],
  'imperative.negative': [link('IMP_NEGATIVE', 1), link('IMP_PRESENT', 0.6, { note: 'eq.note.negation-added', only: 'source' })],
  'infinitive.present': [link('INF_PRESENT', 1)],
  'infinitive.past': [link('INF_PERFECT', 1)],
  'participle.present': [link('PART_PRESENT', 1)],
  'participle.past': [link('PART_PAST', 1)],
  'gerund.present': [link('GERUND', 1)],
  'gerund.past': [link('GERUND_PERFECT', 1), link('PART_PERFECT', 0.5, { note: 'eq.it.gerund-as-participle', only: 'target' })],
} satisfies LanguageMap<'it'>;
