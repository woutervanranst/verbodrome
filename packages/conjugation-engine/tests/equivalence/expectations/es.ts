/** Spanish lookups (plan B2). */
import type { Expectation } from './types.js';

export const expectations: readonly Expectation[] = [
  ['fr', 'indicative.perfect', 'es', 'indicative.simple_past', 1, 'exact', { notes: ['eq.fr.perfect.spoken-past'], second: 'indicative.perfect' }],
  ['es', 'indicative.simple_past', 'fr', 'indicative.perfect', 1, 'exact', { notes: ['eq.fr.perfect.spoken-past'], second: 'indicative.simple_past' }],
  ['es', 'subjunctive.future', 'fr', 'indicative.future', 1, 'approximate', { relaxed: ['mood'], notes: ['eq.note.no-subjunctive'], second: 'indicative.near_future' }],
  // Ruling I6 (replaces the plan's dated subjunctive future): reported speech is the indicative future (dice que vendrá).
  ['de', 'subjunctive.future', 'es', 'indicative.future', 1, 'approximate', { relaxed: ['mood'], notes: ['eq.de.subjunctive-reported', 'eq.es.future-conjecture', 'eq.note.no-subjunctive'], second: null }],
  ['es', 'imperative.negative', 'it', 'imperative.negative', 1, 'exact', { second: 'imperative.present' }],
  ['es', 'imperative.negative', 'fr', 'imperative.present', 0.6, 'exact', { notes: ['eq.note.negation-added'], second: null }],
  ['es', 'subjunctive.pluperfect', 'nl', 'indicative.pluperfect', 1, 'override', { notes: ['eq.pair.subjunctive-clause'], second: 'conditional.past' }],
  // Review I3: si tuviera is si j’avais, never the literary qu’il eût.
  ['es', 'subjunctive.imperfect', 'fr', 'indicative.imperfect', 1, 'approximate', { notes: ['eq.fr.si-imperfect'] }],
  ['es', 'subjunctive.pluperfect', 'fr', 'indicative.pluperfect', 1, 'approximate', { notes: ['eq.fr.si-pluperfect'] }],
  ['es', 'indicative.perfect', 'en', 'indicative.perfect', 1, 'exact', { notes: ['eq.es.perfect-spain'], second: 'indicative.past' }],
  ['en', 'indicative.past', 'es', 'indicative.simple_past', 1, 'exact', { notes: ['eq.en.past-both'], second: 'indicative.imperfect' }],
  ['fr', 'imperative.present', 'es', 'imperative.present', 1, 'exact', { second: null }],
  ['es', 'subjunctive.future', 'es', 'subjunctive.future', 1, 'exact', { second: null }],
  ['es', 'indicative.past_anterior', 'nl', 'indicative.pluperfect', 1, 'approximate', { relaxed: ['aspect'], notes: ['eq.note.relaxed-aspect'], second: null }],
  // Not in the plan: the gerundio stands in for the participles Spanish lacks, only when Spanish is the target.
  ['fr', 'participle.present', 'es', 'gerund.present', 0.5, 'approximate', { notes: ['eq.es.gerund-as-participle'], second: null }],
  ['de', 'participle.present', 'es', 'gerund.present', 0.5, 'approximate', { notes: ['eq.es.gerund-as-participle'], second: null }],
  ['fr', 'participle.perfect', 'es', 'gerund.past', 0.5, 'approximate', { notes: ['eq.es.gerund-as-participle'], second: null }],
  ['es', 'gerund.present', 'fr', 'gerund.present', 1, 'exact', { second: null }],
  ['es', 'gerund.present', 'de', null, 0, 'none', { notes: ['eq.note.no-counterpart'] }],
];
