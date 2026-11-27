/** German lookups (plan B1). The rows of German with Italian, Latin and Spanish live in those languages' files. */
import type { Expectation } from './types.js';

export const expectations: readonly Expectation[] = [
  ['fr', 'indicative.perfect', 'de', 'indicative.perfect', 0.9, 'exact', { notes: ['eq.fr.perfect.spoken-past', 'eq.de.perfect-spoken'], second: 'indicative.past' }],
  ['de', 'indicative.past', 'fr', 'indicative.imperfect', 1, 'exact', { notes: ['eq.de.past-written'], second: 'indicative.perfect' }],
  ['de', 'indicative.past', 'nl', 'indicative.past', 1, 'exact', { notes: ['eq.de.past-written'], second: 'indicative.perfect' }],
  ['nl', 'indicative.perfect', 'de', 'indicative.perfect', 1, 'exact', { second: 'indicative.past' }],
  ['de', 'subjunctive.future', 'fr', 'indicative.future', 1, 'approximate', { relaxed: ['mood'], notes: ['eq.de.subjunctive-reported', 'eq.note.no-subjunctive'], second: 'indicative.near_future' }],
  ['de', 'subjunctive.past', 'fr', 'subjunctive.imperfect', 1, 'exact', { notes: ['eq.de.subjunctive-unreal'], second: 'conditional.present' }],
  ['de', 'subjunctive.past', 'nl', 'conditional.present', 0.9, 'exact', { second: null }],
  ['de', 'infinitive.perfect', 'fr', 'infinitive.past', 1, 'exact', { second: null }],
  ['de', 'infinitive.perfect', 'nl', 'participle.past', 0.4, 'approximate', { notes: ['eq.nl.compound-inf-perfect'], second: null }],
  ['de', 'indicative.perfect', 'en', 'indicative.perfect', 1, 'exact', { second: 'indicative.past' }],
  ['en', 'indicative.perfect_progressive', 'de', 'indicative.present', 0.5, 'exact', { notes: ['eq.en.duration'], second: 'indicative.perfect' }],
  ['fr', 'gerund.present', 'de', null, 0, 'none', { notes: ['eq.note.no-counterpart'] }],
  ['de', 'indicative.present', 'fr', 'indicative.present', 1, 'exact', { second: 'indicative.future' }],
  // Not in the plan: the written narrative past is the Präteritum (an override; the pivot alone ranks the Perfekt first).
  ['fr', 'indicative.simple_past', 'de', 'indicative.past', 1, 'override', { notes: ['eq.de.past-written'], second: 'indicative.perfect' }],
  ['fr', 'conditional.past', 'de', 'subjunctive.pluperfect', 0.9, 'exact', { second: 'conditional.past' }],
];
