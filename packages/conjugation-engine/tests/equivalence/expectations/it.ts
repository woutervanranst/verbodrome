/** Italian lookups (plan B3). */
import type { Expectation } from './types.js';

export const expectations: readonly Expectation[] = [
  ['fr', 'indicative.simple_past', 'it', 'indicative.simple_past', 1, 'exact', { notes: ['eq.it.simple-past-remote'], second: 'indicative.perfect' }],
  ['it', 'indicative.perfect', 'fr', 'indicative.perfect', 0.48, 'exact', { notes: ['eq.it.perfect-spoken'], second: 'indicative.simple_past' }],
  ['it', 'indicative.past_anterior', 'es', 'indicative.past_anterior', 1, 'exact', { second: 'indicative.pluperfect' }],
  ['fr', 'gerund.past', 'it', 'gerund.past', 1, 'exact'],
  ['it', 'conditional.past', 'fr', 'conditional.past', 1, 'exact', { notes: ['eq.it.cond-past-future-in-past'] }],
  ['it', 'indicative.future', 'nl', 'indicative.future', 1, 'exact', { notes: ['eq.it.future-supposition'], second: 'indicative.present' }],
  ['en', 'subjunctive.past', 'it', 'subjunctive.imperfect', 1, 'exact', { notes: ['eq.en.subjunctive-irrealis'] }],
  ['it', 'indicative.past_anterior', 'nl', 'indicative.pluperfect', 0.6, 'exact'],
  // Not in the plan: the spoken pasts give each other first, the narrative ones too (overrides; the pivot alone ranks
  // the literary passato remoto first for the passé composé and the Perfekt, the Perfekt first for the passato remoto).
  ['fr', 'indicative.perfect', 'it', 'indicative.perfect', 1, 'override', { notes: ['eq.it.perfect-spoken'], second: 'indicative.simple_past' }],
  ['de', 'indicative.perfect', 'it', 'indicative.perfect', 1, 'override', { notes: ['eq.it.perfect-spoken'], second: 'indicative.simple_past' }],
  ['it', 'indicative.simple_past', 'de', 'indicative.past', 1, 'override', { notes: ['eq.de.past-written'], second: 'indicative.perfect' }],
  ['nl', 'indicative.perfect', 'it', 'indicative.perfect', 0.6, 'exact', { notes: ['eq.it.perfect-spoken'], second: 'indicative.simple_past' }],
  ['it', 'indicative.simple_past', 'fr', 'indicative.perfect', 1, 'exact', { notes: ['eq.it.simple-past-remote', 'eq.fr.perfect.spoken-past'], second: 'indicative.simple_past' }],
  // Not in the plan: the compound gerundio stands in for the compound participle Italian lacks.
  ['fr', 'participle.perfect', 'it', 'gerund.past', 0.5, 'approximate', { notes: ['eq.it.gerund-as-participle'] }],
  ['it', 'gerund.present', 'de', null, 0, 'none', { notes: ['eq.note.no-counterpart'] }],
];
