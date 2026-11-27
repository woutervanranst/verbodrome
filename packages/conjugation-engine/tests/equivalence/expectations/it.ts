/** Italian lookups (plan B3). */
import type { Expectation } from './types.js';

export const expectations: readonly Expectation[] = [
  ['fr', 'indicative.simple_past', 'it', 'indicative.simple_past', 1, 'exact', { notes: ['eq.it.simple-past-remote'], second: 'indicative.perfect' }],
  // Review I7: the passato prossimo is the full present perfect and the spoken past of most of Italy.
  ['it', 'indicative.perfect', 'fr', 'indicative.perfect', 0.8, 'exact', { notes: ['eq.it.perfect-spoken'], second: 'indicative.simple_past' }],
  ['it', 'indicative.perfect', 'en', 'indicative.perfect', 1, 'exact', { notes: ['eq.it.perfect-spoken'], second: 'indicative.past' }],
  ['it', 'indicative.perfect', 'nl', 'indicative.perfect', 1, 'exact', { notes: ['eq.it.perfect-spoken'], second: 'indicative.past' }],
  ['it', 'indicative.past_anterior', 'es', 'indicative.past_anterior', 1, 'exact', { second: 'indicative.pluperfect' }],
  ['fr', 'gerund.past', 'it', 'gerund.past', 1, 'exact', { second: null }],
  // Review M2: ho appena mangiato.
  ['fr', 'indicative.recent_past', 'it', 'indicative.perfect', 0.5, 'exact', { notes: ['eq.fr.recent-past', 'eq.it.perfect-spoken'], second: null }],
  ['it', 'conditional.past', 'fr', 'conditional.past', 1, 'exact', { notes: ['eq.it.cond-past-future-in-past'], second: null }],
  ['it', 'indicative.future', 'nl', 'indicative.future', 1, 'exact', { notes: ['eq.it.future-supposition'], second: 'indicative.present' }],
  ['en', 'subjunctive.past', 'it', 'subjunctive.imperfect', 1, 'exact', { notes: ['eq.en.subjunctive-irrealis'], second: null }],
  ['it', 'indicative.past_anterior', 'nl', 'indicative.pluperfect', 0.6, 'exact', { second: null }],
  // Review I3: se avessi is si j’avais.
  ['it', 'subjunctive.imperfect', 'fr', 'indicative.imperfect', 1, 'approximate', { notes: ['eq.fr.si-imperfect'] }],
  ['it', 'subjunctive.pluperfect', 'fr', 'indicative.pluperfect', 1, 'approximate', { notes: ['eq.fr.si-pluperfect'] }],
  // Not in the plan: the spoken pasts give each other first, the narrative ones too (overrides for the passé composé
  // and the passato remoto; the Perfekt reaches the passato prossimo by the weights of review I7).
  ['fr', 'indicative.perfect', 'it', 'indicative.perfect', 1, 'override', { notes: ['eq.it.perfect-spoken'], second: 'indicative.simple_past' }],
  ['de', 'indicative.perfect', 'it', 'indicative.perfect', 1, 'exact', { notes: ['eq.it.perfect-spoken'], second: 'indicative.simple_past' }],
  ['it', 'indicative.simple_past', 'de', 'indicative.past', 1, 'override', { notes: ['eq.de.past-written'], second: 'indicative.perfect' }],
  ['nl', 'indicative.perfect', 'it', 'indicative.perfect', 1, 'exact', { notes: ['eq.it.perfect-spoken'], second: 'indicative.simple_past' }],
  ['it', 'indicative.simple_past', 'fr', 'indicative.perfect', 1, 'exact', { notes: ['eq.it.simple-past-remote', 'eq.fr.perfect.spoken-past'], second: 'indicative.simple_past' }],
  // Not in the plan: the compound gerundio stands in for the compound participle Italian lacks.
  ['fr', 'participle.perfect', 'it', 'gerund.past', 0.5, 'approximate', { notes: ['eq.it.gerund-as-participle'], second: null }],
  ['it', 'gerund.present', 'de', null, 0, 'none', { notes: ['eq.note.no-counterpart'] }],
];
