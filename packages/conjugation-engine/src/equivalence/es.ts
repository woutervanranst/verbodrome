/**
 * The Spanish tense map (Spanish design, section 10; 23 catalogue tenses). The pretérito perfecto simple is the
 * perfective past, standard in speech and writing; the compound perfect is a present perfect. The subjunctive future
 * and future perfect are the only `dated` links of the inventory: offered only when nothing else corresponds.
 *
 * Not in the design: the negative imperative also links `IMP_PRESENT 0.6` as a source only, so that a language without
 * a negative imperative gets its plain imperative (polarity never relaxes); its note says the negation is added. And
 * Spanish has no present participle: the gerundio stands in for it, and the compound gerundio for a compound participle
 * (`only: 'target'`, as the Dutch stand-ins), so a French participe présent or a German Partizip I asks for the
 * gerundio instead of finding nothing.
 */
import { link } from './concepts.js';
import type { LanguageMap } from './concepts.js';

export const es = {
  'indicative.present': [link('PRESENT', 1)],
  'indicative.perfect': [link('PRESENT_PERFECT', 1, { note: 'eq.es.perfect-spain' }), link('PAST_PERFECTIVE', 0.6)],
  'indicative.imperfect': [link('PAST_IMPERFECTIVE', 1)],
  'indicative.pluperfect': [link('PLUPERFECT', 1)],
  'indicative.simple_past': [link('PAST_PERFECTIVE', 1)],
  'indicative.past_anterior': [link('PAST_ANTERIOR', 1, { register: 'literary' })],
  'indicative.future': [link('FUTURE', 1, { note: 'eq.es.future-conjecture' })],
  'indicative.future_perfect': [link('FUTURE_PERFECT', 1)],
  'conditional.present': [link('COND_PRESENT', 1)],
  'conditional.past': [link('COND_PERFECT', 1)],
  'subjunctive.present': [link('SUBJ_PRESENT', 1)],
  'subjunctive.past': [link('SUBJ_PERFECT', 1)],
  'subjunctive.imperfect': [link('SUBJ_IMPERFECT', 1)],
  'subjunctive.pluperfect': [link('SUBJ_PLUPERFECT', 1), link('COND_PERFECT', 0.5, { note: 'eq.es.subjunctive-pluperfect-conditional' })],
  'subjunctive.future': [link('SUBJ_FUTURE', 1, { register: 'dated' })],
  'subjunctive.future_perfect': [link('SUBJ_FUTURE_PERFECT', 1, { register: 'dated' })],
  'imperative.present': [link('IMP_PRESENT', 1)],
  'imperative.negative': [link('IMP_NEGATIVE', 1), link('IMP_PRESENT', 0.6, { note: 'eq.note.negation-added', only: 'source' })],
  'infinitive.present': [link('INF_PRESENT', 1)],
  'infinitive.past': [link('INF_PERFECT', 1)],
  'gerund.present': [link('GERUND', 1), link('PART_PRESENT', 0.5, { note: 'eq.es.gerund-as-participle', only: 'target' })],
  'gerund.past': [link('GERUND_PERFECT', 1), link('PART_PERFECT', 0.5, { note: 'eq.es.gerund-as-participle', only: 'target' })],
  'participle.past': [link('PART_PAST', 1)],
} satisfies LanguageMap<'es'>;
