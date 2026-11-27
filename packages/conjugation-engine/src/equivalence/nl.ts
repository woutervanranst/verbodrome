/**
 * The Dutch tense map. No design has a Dutch table: it follows the app's French to Dutch tables (note N6), the Dutch
 * catalogue and the German design. The weights decide the passé composé without an override: the perfect is first a
 * present perfect (`PAST_PERFECTIVE` 0.6), the past first an imperfective past (`PAST_PERFECTIVE` 0.7), so the French
 * passé composé ranks the perfect first (0.80 against 0.70) and the passé simple the past (0.70 against 0.60). The
 * margins are thin on purpose and pinned by `tests/equivalence/fr-nl.test.ts`: change a weight only with that test.
 *
 * The four `only: 'target'` links on the past participle are the stand-ins a trainer composes by hand (the participle
 * plus an auxiliary) for the compound non-finite forms and the perfect imperative Dutch has no tense for. They are never
 * offered when Dutch is the source: a Dutch past participle is not a perfect infinitive.
 */
import { link } from './concepts.js';
import type { LanguageMap } from './concepts.js';

export const nl = {
  'indicative.present': [link('PRESENT', 1), link('FUTURE', 0.4, { note: 'eq.nl.present-future' })],
  'indicative.past': [link('PAST_IMPERFECTIVE', 1), link('PAST_PERFECTIVE', 0.7)],
  'indicative.future': [link('FUTURE', 1)],
  'indicative.perfect': [link('PRESENT_PERFECT', 1), link('PAST_PERFECTIVE', 0.6, { note: 'eq.nl.perfect.spoken-past' })],
  'indicative.pluperfect': [link('PLUPERFECT', 1)],
  'indicative.future_perfect': [link('FUTURE_PERFECT', 1)],
  'conditional.present': [link('COND_PRESENT', 1)],
  'conditional.past': [link('COND_PERFECT', 1)],
  'imperative.present': [link('IMP_PRESENT', 1)],
  'infinitive.present': [link('INF_PRESENT', 1)],
  'participle.present': [link('PART_PRESENT', 1), link('GERUND', 0.5, { note: 'eq.nl.gerund-as-participle' })],
  'participle.past': [
    link('PART_PAST', 1),
    link('INF_PERFECT', 0.4, { note: 'eq.nl.compound-inf-perfect', only: 'target' }),
    link('PART_PERFECT', 0.4, { note: 'eq.nl.compound-part-perfect', only: 'target' }),
    link('GERUND_PERFECT', 0.4, { note: 'eq.nl.compound-gerund-perfect', only: 'target' }),
    link('IMP_PERFECT', 0.4, { note: 'eq.nl.compound-imp-perfect', only: 'target' }),
  ],
} satisfies LanguageMap<'nl'>;
