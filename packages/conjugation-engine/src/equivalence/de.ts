/**
 * The German tense map (German design, section 10, link for link; 19 catalogue tenses). The Präteritum covers both
 * aspects of the past and is the written one; the Perfekt is first a present perfect and also the spoken past. Konjunktiv
 * II (`subjunctive.past`, `subjunctive.pluperfect`) is the subjunctive of the unreal and also the conditional of other
 * languages (`COND_PRESENT`, `COND_PERFECT` 0.9); the würde-form `conditional.past` is rare (0.6). German has no gerund.
 *
 * A tension to know about (review M9): the Präteritum links the imperfective past at full weight, so the Romance and
 * Latin imperfects come first for it, though it is as neutral in aspect as the English simple past (ich ging is I went).
 */
import { link } from './concepts.js';
import type { LanguageMap } from './concepts.js';

export const de = {
  'indicative.present': [link('PRESENT', 1), link('FUTURE', 0.5, { note: 'eq.de.present-future' })],
  'indicative.past': [link('PAST_IMPERFECTIVE', 1, { note: 'eq.de.past-written' }), link('PAST_PERFECTIVE', 0.8)],
  'indicative.perfect': [link('PRESENT_PERFECT', 1), link('PAST_PERFECTIVE', 0.9, { note: 'eq.de.perfect-spoken' })],
  'indicative.pluperfect': [link('PLUPERFECT', 1)],
  'indicative.future': [link('FUTURE', 1, { note: 'eq.de.future-supposition' })],
  'indicative.future_perfect': [link('FUTURE_PERFECT', 1)],
  'subjunctive.present': [link('SUBJ_PRESENT', 1, { note: 'eq.de.subjunctive-reported' })],
  'subjunctive.perfect': [link('SUBJ_PERFECT', 1, { note: 'eq.de.subjunctive-reported' })],
  'subjunctive.future': [link('SUBJ_FUTURE', 1, { note: 'eq.de.subjunctive-reported' })],
  'subjunctive.future_perfect': [link('SUBJ_FUTURE_PERFECT', 1, { note: 'eq.de.subjunctive-reported' })],
  'subjunctive.past': [link('SUBJ_IMPERFECT', 1, { note: 'eq.de.subjunctive-unreal' }), link('COND_PRESENT', 0.9)],
  'subjunctive.pluperfect': [link('SUBJ_PLUPERFECT', 1, { note: 'eq.de.subjunctive-unreal' }), link('COND_PERFECT', 0.9)],
  'conditional.present': [link('COND_PRESENT', 1)],
  'conditional.past': [link('COND_PERFECT', 0.6, { note: 'eq.de.conditional-past-rare' })],
  'imperative.present': [link('IMP_PRESENT', 1)],
  'infinitive.present': [link('INF_PRESENT', 1)],
  'infinitive.perfect': [link('INF_PERFECT', 1)],
  'participle.present': [link('PART_PRESENT', 1)],
  'participle.past': [link('PART_PAST', 1)],
} satisfies LanguageMap<'de'>;
