/** French and Dutch lookups pinned beside the acceptance test: Dutch as the source, and lookups within one language. */
import type { Expectation } from './types.js';

export const expectations: readonly Expectation[] = [
  ['nl', 'indicative.present', 'fr', 'indicative.present', 1, 'exact', { second: 'indicative.future' }],
  ['nl', 'indicative.past', 'fr', 'indicative.imperfect', 1, 'exact', { second: 'indicative.perfect' }],
  ['nl', 'indicative.perfect', 'fr', 'indicative.perfect', 0.8, 'exact', { second: 'indicative.simple_past' }],
  ['nl', 'indicative.pluperfect', 'fr', 'indicative.pluperfect', 1, 'exact'],
  ['nl', 'conditional.past', 'fr', 'conditional.past', 1, 'exact'],
  ['nl', 'imperative.present', 'fr', 'imperative.present', 1, 'exact'],
  ['nl', 'participle.present', 'fr', 'participle.present', 1, 'exact', { second: 'gerund.present' }],
  ['nl', 'participle.past', 'fr', 'participle.past', 1, 'exact'],
  ['fr', 'indicative.simple_past', 'fr', 'indicative.simple_past', 1, 'exact', { second: 'indicative.perfect' }],
  ['nl', 'indicative.past', 'nl', 'indicative.past', 1, 'exact', { second: 'indicative.perfect' }],
  ['fr', 'participle.perfect', 'fr', 'participle.perfect', 1, 'exact'],
];
