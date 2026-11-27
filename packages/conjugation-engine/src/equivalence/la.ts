/**
 * The Latin tense map (Latin design, section 10; 21 catalogue tenses). Every entry describes the active tense: the
 * passive of a voiced tense is the same entry looked up with `{ voice: 'passive' }`. The perfect is both a perfective
 * past and a present perfect (A&G §161), the historic past first (0.9 for the present perfect, review M3: veni, vidi,
 * vici is vine, vi, vencí and I came, I saw, I conquered); the imperfect and pluperfect subjunctives stand for the conditional of other
 * languages in unreal conditions (0.6). The future infinitive, the future participle, the gerundive and the supine have
 * no counterpart in the other six languages: their notes say what a learner uses instead. Latin forbids with nōlī or
 * nōlīte plus the present infinitive, so the infinitive stands in for a negative imperative (review I5).
 */
import { link } from './concepts.js';
import type { LanguageMap } from './concepts.js';

export const la = {
  'indicative.present': [link('PRESENT', 1)],
  'indicative.imperfect': [link('PAST_IMPERFECTIVE', 1)],
  'indicative.future': [link('FUTURE', 1)],
  'indicative.perfect': [link('PAST_PERFECTIVE', 1, { note: 'eq.la.perfect-both' }), link('PRESENT_PERFECT', 0.9)],
  'indicative.pluperfect': [link('PLUPERFECT', 1)],
  'indicative.future_perfect': [link('FUTURE_PERFECT', 1)],
  'subjunctive.present': [link('SUBJ_PRESENT', 1)],
  'subjunctive.imperfect': [link('SUBJ_IMPERFECT', 1), link('COND_PRESENT', 0.6, { note: 'eq.la.subjunctive-unreal' })],
  'subjunctive.perfect': [link('SUBJ_PERFECT', 1)],
  'subjunctive.pluperfect': [link('SUBJ_PLUPERFECT', 1), link('COND_PERFECT', 0.6, { note: 'eq.la.subjunctive-unreal' })],
  'imperative.present': [link('IMP_PRESENT', 1)],
  'imperative.future': [link('IMP_FUTURE', 1, { note: 'eq.la.imperative-future' }), link('IMP_PRESENT', 0.4, { note: 'eq.la.imperative-future' })],
  'infinitive.present': [link('INF_PRESENT', 1), link('IMP_NEGATIVE', 0.7, { note: 'eq.la.prohibition', only: 'target' })],
  'infinitive.perfect': [link('INF_PERFECT', 1)],
  'infinitive.future': [link('INF_FUTURE', 1, { note: 'eq.la.infinitive-future' })],
  'participle.present': [link('PART_PRESENT', 1)],
  'participle.perfect': [link('PART_PAST', 1, { note: 'eq.la.deponent-participle' })],
  'participle.future': [link('PART_FUTURE', 1, { note: 'eq.la.participle-future' })],
  'participle.gerundive': [link('GERUNDIVE', 1, { note: 'eq.la.gerundive' })],
  'gerund.present': [link('GERUND', 1)],
  'supine.present': [link('SUPINE', 1, { note: 'eq.la.supine' })],
} satisfies LanguageMap<'la'>;
