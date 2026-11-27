/** English lookups (plan B5), with the controller's ruling on the passé composé. */
import type { Expectation } from './types.js';

export const expectations: readonly Expectation[] = [
  // Ruling 2 (replaces the plan's present perfect 0.80 first): the simple past first, the present perfect second with a note.
  ['fr', 'indicative.perfect', 'en', 'indicative.past', 1, 'override', { notes: ['eq.fr.perfect.spoken-past'], second: 'indicative.perfect' }],
  ['en', 'indicative.past', 'fr', 'indicative.perfect', 0.6, 'exact', { notes: ['eq.en.past-both', 'eq.fr.perfect.spoken-past'], second: 'indicative.simple_past' }],
  ['en', 'indicative.present_progressive', 'fr', 'indicative.present', 0.9, 'exact', { notes: ['eq.en.progressive'] }],
  ['en', 'indicative.perfect_progressive', 'nl', 'indicative.present', 0.5, 'exact', { notes: ['eq.en.duration'], second: 'indicative.perfect' }],
  ['en', 'subjunctive.past', 'nl', 'indicative.past', 1, 'approximate', { relaxed: ['mood'], notes: ['eq.en.subjunctive-irrealis', 'eq.note.no-subjunctive'], second: 'indicative.perfect' }],
  ['fr', 'subjunctive.imperfect', 'en', 'subjunctive.past', 1, 'exact', { notes: ['eq.en.subjunctive-irrealis'] }],
  ['fr', 'indicative.near_future', 'en', 'indicative.future', 0.6, 'exact', { second: 'indicative.future_progressive' }],
  ['en', 'indicative.present_progressive', 'en', 'indicative.present_progressive', 1, 'exact', { second: 'indicative.present' }],
  ['en', 'participle.present', 'fr', 'participle.present', 0.6, 'exact', { second: 'gerund.present' }],
  ['en', 'indicative.pluperfect_progressive', 'nl', 'indicative.past', 0.5, 'exact', { notes: ['eq.en.duration'], second: 'indicative.pluperfect' }],
  ['nl', 'indicative.present', 'en', 'indicative.present', 1, 'exact', { second: 'indicative.present_progressive' }],
  // Not in the plan: the spoken Italian past first for the English and Spanish simple pasts (overrides, as fr -> it).
  ['en', 'indicative.past', 'it', 'indicative.perfect', 1, 'override', { notes: ['eq.it.perfect-spoken'], second: 'indicative.simple_past' }],
  ['es', 'indicative.simple_past', 'it', 'indicative.perfect', 1, 'override', { notes: ['eq.it.perfect-spoken'], second: 'indicative.simple_past' }],
  // Not in the plan (open question 6): stand-ins on the English past participle for the compound non-finite forms.
  ['fr', 'infinitive.past', 'en', 'participle.past', 0.4, 'approximate', { notes: ['eq.en.compound-inf-perfect'] }],
  ['fr', 'participle.perfect', 'en', 'participle.past', 0.4, 'approximate', { notes: ['eq.en.compound-having'] }],
  ['es', 'gerund.past', 'en', 'participle.past', 0.4, 'approximate', { notes: ['eq.en.compound-having'] }],
  ['en', 'participle.past', 'fr', 'participle.past', 1, 'exact'],
  ['fr', 'imperative.past', 'en', null, 0, 'none', { notes: ['eq.note.no-counterpart'] }],
  // Not in the plan: the aspect-neutral Dutch and German pasts give the English simple past first (overrides; the pivot
  // alone gives the past progressive first), and the English unreal subjunctives give the French indicative after si.
  ['nl', 'indicative.past', 'en', 'indicative.past', 1, 'override', { notes: ['eq.en.past-both'], second: 'indicative.past_progressive' }],
  ['de', 'indicative.past', 'en', 'indicative.past', 1, 'override', { notes: ['eq.en.past-both'], second: 'indicative.past_progressive' }],
  ['fr', 'indicative.imperfect', 'en', 'indicative.past_progressive', 0.9, 'exact', { notes: ['eq.en.progressive'], second: 'indicative.pluperfect_progressive' }],
  ['en', 'subjunctive.past', 'fr', 'indicative.imperfect', 1, 'override', { notes: ['eq.pair.en-fr.si-clause'], second: 'subjunctive.imperfect' }],
  ['en', 'subjunctive.pluperfect', 'fr', 'indicative.pluperfect', 1, 'override', { notes: ['eq.pair.en-fr.si-clause'], second: 'subjunctive.pluperfect' }],
  ['en', 'subjunctive.past', 'it', 'subjunctive.imperfect', 1, 'exact', { notes: ['eq.en.subjunctive-irrealis'] }],
];
