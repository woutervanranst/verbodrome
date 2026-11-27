/**
 * The English tense map (English design, section 10, reconciled by the plan; 24 catalogue tenses). Each progressive tense
 * links its own progressive concept at 1, so that within English a progressive answers itself first, and the design's
 * plain concept at the design's weight, so that other languages find their plain tense. The simple past covers both
 * aspects (0.6 perfective, 0.4 imperfective); the -ing form is both a participle and a gerund.
 *
 * Not in the design (plan open question 6): English has no perfect infinitive, participle or gerund in its catalogue,
 * so the past participle stands in for them when English is the target (`only: 'target'`, as the Dutch stand-ins):
 * to have worked, having worked.
 */
import { link } from './concepts.js';
import type { LanguageMap } from './concepts.js';

export const en = {
  'indicative.present': [link('PRESENT', 1)],
  'indicative.past': [link('PAST_PERFECTIVE', 0.6, { note: 'eq.en.past-both' }), link('PAST_IMPERFECTIVE', 0.4)],
  'indicative.perfect': [link('PRESENT_PERFECT', 1)],
  'indicative.pluperfect': [link('PLUPERFECT', 1)],
  'indicative.future': [link('FUTURE', 1)],
  'indicative.future_perfect': [link('FUTURE_PERFECT', 1)],
  'indicative.present_progressive': [link('PRESENT_PROGRESSIVE', 1), link('PRESENT', 0.9, { note: 'eq.en.progressive' })],
  'indicative.past_progressive': [link('PAST_PROGRESSIVE', 1), link('PAST_IMPERFECTIVE', 0.9, { note: 'eq.en.progressive' })],
  'indicative.perfect_progressive': [
    link('PRESENT_PERFECT_PROGRESSIVE', 1),
    link('PRESENT_PERFECT', 0.5, { note: 'eq.en.duration' }),
    link('PRESENT', 0.5, { note: 'eq.en.duration' }),
  ],
  'indicative.pluperfect_progressive': [
    link('PLUPERFECT_PROGRESSIVE', 1),
    link('PLUPERFECT', 0.5, { note: 'eq.en.duration' }),
    link('PAST_IMPERFECTIVE', 0.5, { note: 'eq.en.duration' }),
  ],
  'indicative.future_progressive': [link('FUTURE_PROGRESSIVE', 1), link('FUTURE', 0.9, { note: 'eq.en.progressive' })],
  'indicative.future_perfect_progressive': [link('FUTURE_PERFECT_PROGRESSIVE', 1), link('FUTURE_PERFECT', 0.9, { note: 'eq.en.progressive' })],
  'conditional.present': [link('COND_PRESENT', 1)],
  'conditional.past': [link('COND_PERFECT', 1)],
  'conditional.present_progressive': [link('COND_PROGRESSIVE', 1), link('COND_PRESENT', 0.9, { note: 'eq.en.progressive' })],
  'conditional.past_progressive': [link('COND_PERFECT_PROGRESSIVE', 1), link('COND_PERFECT', 0.9, { note: 'eq.en.progressive' })],
  'subjunctive.present': [link('SUBJ_PRESENT', 1, { note: 'eq.en.subjunctive-mandative' })],
  'subjunctive.past': [link('SUBJ_IMPERFECT', 1, { note: 'eq.en.subjunctive-irrealis' })],
  'subjunctive.perfect': [link('SUBJ_PERFECT', 1)],
  'subjunctive.pluperfect': [link('SUBJ_PLUPERFECT', 1)],
  'imperative.present': [link('IMP_PRESENT', 1)],
  'infinitive.present': [link('INF_PRESENT', 1)],
  'participle.present': [link('PART_PRESENT', 0.6), link('GERUND', 0.4, { note: 'eq.en.ing-both' })],
  'participle.past': [
    link('PART_PAST', 1),
    link('INF_PERFECT', 0.4, { note: 'eq.en.compound-inf-perfect', only: 'target' }),
    link('PART_PERFECT', 0.4, { note: 'eq.en.compound-having', only: 'target' }),
    link('GERUND_PERFECT', 0.4, { note: 'eq.en.compound-having', only: 'target' }),
  ],
} satisfies LanguageMap<'en'>;
