/**
 * The French tense map (French design, section 10). The passé composé is first of all the spoken past of a finished
 * event (`PAST_PERFECTIVE`) and only then a present perfect; the passé simple is the same past, written.
 *
 * Not in the design (review I3): the subjonctif imparfait and plus-que-parfait are literary, so the imparfait and the
 * plus-que-parfait stand in for them when French is the target (`only: 'target'`): an unreal si-clause is in the
 * indicative (si tuviera, if I were: si j’étais), and at equal score the standard tense comes before the literary one.
 * The near future and the recent past reach other languages only through their plain future and perfect: the notes on
 * those links point to the go-construction or the word for just (review M1, M2).
 */
import { link } from './concepts.js';
import type { LanguageMap } from './concepts.js';

export const fr = {
  'indicative.present': [link('PRESENT', 1)],
  'indicative.perfect': [link('PAST_PERFECTIVE', 1, { note: 'eq.fr.perfect.spoken-past' }), link('PRESENT_PERFECT', 0.8)],
  'indicative.imperfect': [link('PAST_IMPERFECTIVE', 1), link('SUBJ_IMPERFECT', 1, { note: 'eq.fr.si-imperfect', only: 'target' })],
  'indicative.pluperfect': [link('PLUPERFECT', 1), link('SUBJ_PLUPERFECT', 1, { note: 'eq.fr.si-pluperfect', only: 'target' })],
  'indicative.simple_past': [link('PAST_PERFECTIVE', 1, { register: 'literary' })],
  'indicative.past_anterior': [link('PAST_ANTERIOR', 1, { register: 'literary' })],
  'indicative.future': [link('FUTURE', 1)],
  'indicative.future_perfect': [link('FUTURE_PERFECT', 1)],
  'indicative.near_future': [link('NEAR_FUTURE', 1), link('FUTURE', 0.6, { note: 'eq.fr.near-future' })],
  'indicative.recent_past': [link('RECENT_PAST', 1), link('PRESENT_PERFECT', 0.5, { note: 'eq.fr.recent-past' })],
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
