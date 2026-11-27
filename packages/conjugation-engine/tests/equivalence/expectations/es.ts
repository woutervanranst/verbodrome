/** Spanish lookups (plan B2). */
import type { Expectation } from './types.js';

export const expectations: readonly Expectation[] = [
  ['fr', 'indicative.perfect', 'es', 'indicative.simple_past', 1, 'exact', { notes: ['eq.fr.perfect.spoken-past'], second: 'indicative.perfect' }],
  ['es', 'indicative.simple_past', 'fr', 'indicative.perfect', 1, 'exact', { notes: ['eq.fr.perfect.spoken-past'], second: 'indicative.simple_past' }],
  ['es', 'subjunctive.future', 'fr', 'indicative.future', 1, 'approximate', { relaxed: ['mood'], notes: ['eq.note.no-subjunctive'], second: 'indicative.near_future' }],
  ['de', 'subjunctive.future', 'es', 'subjunctive.future', 1, 'approximate', { relaxed: ['register'], notes: ['eq.de.subjunctive-reported', 'eq.note.relaxed-register'] }],
  ['es', 'imperative.negative', 'it', 'imperative.negative', 1, 'exact', { second: 'imperative.present' }],
  ['es', 'imperative.negative', 'fr', 'imperative.present', 0.6, 'exact', { notes: ['eq.note.negation-added'] }],
  ['es', 'subjunctive.pluperfect', 'nl', 'indicative.pluperfect', 1, 'override', { notes: ['eq.pair.subjunctive-clause'], second: 'conditional.past' }],
  ['es', 'indicative.perfect', 'en', 'indicative.perfect', 1, 'exact', { notes: ['eq.es.perfect-spain'], second: 'indicative.perfect_progressive' }],
  ['en', 'indicative.past', 'es', 'indicative.simple_past', 0.6, 'exact', { notes: ['eq.en.past-both'], second: 'indicative.imperfect' }],
  ['fr', 'imperative.present', 'es', 'imperative.present', 1, 'exact'],
  ['es', 'subjunctive.future', 'es', 'subjunctive.future', 1, 'exact'],
  ['es', 'indicative.past_anterior', 'nl', 'indicative.pluperfect', 1, 'approximate', { relaxed: ['aspect'], notes: ['eq.note.relaxed-aspect'] }],
  // Not in the plan: the gerundio stands in for the participles Spanish lacks, only when Spanish is the target.
  ['fr', 'participle.present', 'es', 'gerund.present', 0.5, 'approximate', { notes: ['eq.es.gerund-as-participle'] }],
  ['de', 'participle.present', 'es', 'gerund.present', 0.5, 'approximate', { notes: ['eq.es.gerund-as-participle'] }],
  ['fr', 'participle.perfect', 'es', 'gerund.past', 0.5, 'approximate', { notes: ['eq.es.gerund-as-participle'] }],
  ['es', 'gerund.present', 'fr', 'gerund.present', 1, 'exact'],
  ['es', 'gerund.present', 'de', null, 0, 'none', { notes: ['eq.note.no-counterpart'] }],
];
