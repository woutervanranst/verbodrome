/** Latin lookups (plan B4), active voice; the passive is in `tests/equivalence/voice.test.ts`. */
import type { Expectation } from './types.js';

export const expectations: readonly Expectation[] = [
  ['la', 'indicative.perfect', 'fr', 'indicative.perfect', 1, 'exact', { notes: ['eq.la.perfect-both', 'eq.fr.perfect.spoken-past'], second: 'indicative.simple_past' }],
  ['fr', 'indicative.imperfect', 'la', 'indicative.imperfect', 1, 'exact', { second: null }],
  ['la', 'subjunctive.imperfect', 'nl', 'indicative.past', 1, 'override', { notes: ['eq.pair.subjunctive-clause'], second: 'conditional.present' }],
  ['la', 'infinitive.future', 'en', null, 0, 'none', { notes: ['eq.note.no-counterpart', 'eq.la.infinitive-future'] }],
  ['la', 'supine.present', 'fr', null, 0, 'none', { notes: ['eq.note.no-counterpart', 'eq.la.supine'] }],
  ['la', 'participle.gerundive', 'la', 'participle.gerundive', 1, 'exact', { second: null }],
  // Review M5: the note on the future imperative is shown where the learner meets it.
  ['la', 'imperative.future', 'es', 'imperative.present', 0.4, 'exact', { notes: ['eq.la.imperative-future'], second: null }],
  ['de', 'subjunctive.past', 'la', 'subjunctive.imperfect', 1, 'exact', { notes: ['eq.de.subjunctive-unreal'], second: null }],
  ['la', 'gerund.present', 'nl', 'participle.present', 0.5, 'exact', { notes: ['eq.nl.gerund-as-participle'], second: null }],
  ['la', 'participle.perfect', 'fr', 'participle.past', 1, 'exact', { notes: ['eq.la.deponent-participle'], second: null }],
  ['en', 'participle.present', 'la', 'participle.present', 0.6, 'exact', { second: 'gerund.present' }],
  ['la', 'participle.future', 'en', null, 0, 'none', { notes: ['eq.note.no-counterpart', 'eq.la.participle-future'] }],
  ['la', 'infinitive.perfect', 'nl', 'participle.past', 0.4, 'approximate', { notes: ['eq.nl.compound-inf-perfect'], second: null }],
  // Review M3 and I1: the historic perfect is the narrative past (vine, vi, vencí; I came, I saw, I conquered).
  ['la', 'indicative.perfect', 'es', 'indicative.simple_past', 1, 'exact', { notes: ['eq.la.perfect-both'], second: 'indicative.perfect' }],
  ['la', 'indicative.perfect', 'en', 'indicative.past', 1, 'exact', { notes: ['eq.la.perfect-both', 'eq.en.past-both'], second: 'indicative.perfect' }],
  ['la', 'subjunctive.pluperfect', 'nl', 'indicative.pluperfect', 1, 'override', { notes: ['eq.pair.subjunctive-clause'], second: 'conditional.past' }],
];
