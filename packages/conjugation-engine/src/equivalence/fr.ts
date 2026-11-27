/**
 * The French tense map (French design, section 10). The passé composé is first of all the spoken past of a finished
 * event (`PAST_PERFECTIVE`) and only then a present perfect; the passé simple is the same past, written.
 */
import { link } from './concepts.js';
import type { LanguageMap } from './concepts.js';

export const fr = {
  'indicative.present': [link('PRESENT', 1)],
  'indicative.perfect': [link('PAST_PERFECTIVE', 1, { note: 'eq.fr.perfect.spoken-past' }), link('PRESENT_PERFECT', 0.8)],
  'indicative.imperfect': [link('PAST_IMPERFECTIVE', 1)],
  'indicative.pluperfect': [link('PLUPERFECT', 1)],
  'indicative.simple_past': [link('PAST_PERFECTIVE', 1, { register: 'literary' })],
  'indicative.past_anterior': [link('PAST_ANTERIOR', 1, { register: 'literary' })],
  'indicative.future': [link('FUTURE', 1)],
  'indicative.future_perfect': [link('FUTURE_PERFECT', 1)],
  'indicative.near_future': [link('NEAR_FUTURE', 1), link('FUTURE', 0.6)],
  'indicative.recent_past': [link('RECENT_PAST', 1), link('PRESENT_PERFECT', 0.5)],
  'subjunctive.present': [link('SUBJ_PRESENT', 1)],
  'subjunctive.past': [link('SUBJ_PERFECT', 1)],
  'subjunctive.imperfect': [link('SUBJ_IMPERFECT', 1, { register: 'literary' })],
  'subjunctive.pluperfect': [link('SUBJ_PLUPERFECT', 1, { register: 'literary' })],
  'conditional.present': [link('COND_PRESENT', 1)],
  'conditional.past': [link('COND_PERFECT', 1)],
  'imperative.present': [link('IMP_PRESENT', 1)],
  'imperative.past': [link('IMP_PERFECT', 1)],
  'infinitive.present': [link('INF_PRESENT', 1)],
  'infinitive.past': [link('INF_PERFECT', 1)],
  'participle.present': [link('PART_PRESENT', 1)],
  'participle.past': [link('PART_PAST', 1)],
  'participle.perfect': [link('PART_PERFECT', 1)],
  'gerund.present': [link('GERUND', 1)],
  'gerund.past': [link('GERUND_PERFECT', 1)],
} satisfies LanguageMap<'fr'>;
