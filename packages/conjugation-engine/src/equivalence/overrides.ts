/**
 * Pair overrides: the few (source language, source tense, target language) lookups where the concepts alone do not
 * give what a learner expects. Each says why in `reason`, and `tests/equivalence/api.test.ts` checks that each one
 * changes the derived list (an override that changes nothing is dead weight).
 */
import type { Language } from '../types.js';
import type { NoteKey, TenseKeyFor } from './concepts.js';
import type { RawOverride } from './derive.js';

export interface PairOverride<F extends Language = Language, T extends Language = Language> {
  readonly from: F;
  readonly to: T;
  readonly tense: TenseKeyFor<F>;
  /** `replace`: the result is the list; `prepend`: it goes first; `exclude`: its tenses are removed. */
  readonly mode: 'replace' | 'prepend' | 'exclude';
  readonly result: readonly { readonly tense: TenseKeyFor<T>; readonly note?: NoteKey }[];
  /** Why this pair does not line up; more than 30 characters. */
  readonly reason: string;
}

/** Types one override against its two languages' tenses. */
export function override<F extends Language, T extends Language>(entry: PairOverride<F, T>): RawOverride {
  return Object.freeze({ ...entry, result: Object.freeze(entry.result.map(result => Object.freeze({ ...result }))) });
}

export const overrides: readonly RawOverride[] = Object.freeze([
  // App parity, French to Dutch: the near future is gaan plus infinitive, and two notes the app shows.
  override({
    from: 'fr', to: 'nl', tense: 'indicative.near_future', mode: 'prepend',
    result: [{ tense: 'indicative.present', note: 'eq.pair.fr-nl.near-future' }],
    reason: 'The app shows the Dutch gaan plus infinitive, which is the present of gaan; the pivot alone ranks the Dutch future (0.60) first.',
  }),
  override({
    from: 'fr', to: 'nl', tense: 'indicative.recent_past', mode: 'prepend',
    result: [{ tense: 'indicative.perfect', note: 'eq.pair.fr-nl.recent-past' }],
    reason: 'The pivot already ranks the Dutch perfect first (0.50); the override only attaches the note that the app adds the word net.',
  }),
  override({
    from: 'fr', to: 'nl', tense: 'imperative.present', mode: 'prepend',
    result: [{ tense: 'imperative.present', note: 'eq.pair.fr-nl.hortative' }],
    reason: 'The pivot already ranks the Dutch imperative first; the override only attaches the note that the first person plural is laten we plus infinitive.',
  }),
  // A subjunctive of a subordinate clause is the Dutch indicative: an exact conditional link of the source would otherwise
  // rank the Dutch conditional first.
  override({
    from: 'es', to: 'nl', tense: 'subjunctive.pluperfect', mode: 'prepend',
    result: [{ tense: 'indicative.pluperfect', note: 'eq.pair.subjunctive-clause' }],
    reason: 'The Spanish -ra pluperfect subjunctive links COND_PERFECT 0.5, an exact match that ranks the Dutch conditional past first and hides the indicative pluperfect that renders a Spanish subordinate clause.',
  }),
  override({
    from: 'la', to: 'nl', tense: 'subjunctive.imperfect', mode: 'prepend',
    result: [{ tense: 'indicative.past', note: 'eq.pair.subjunctive-clause' }],
    reason: 'The Latin imperfect subjunctive links COND_PRESENT 0.6, an exact match that ranks the Dutch conditional first and hides the indicative past that renders a Latin subordinate clause (cum amaret).',
  }),
  override({
    from: 'la', to: 'nl', tense: 'subjunctive.pluperfect', mode: 'prepend',
    result: [{ tense: 'indicative.pluperfect', note: 'eq.pair.subjunctive-clause' }],
    reason: 'The Latin pluperfect subjunctive links COND_PERFECT 0.6, an exact match that ranks the Dutch conditional past first and hides the indicative pluperfect that renders a Latin subordinate clause (cum amavisset).',
  }),
  // The written narrative past is the German Präteritum, though the spoken Perfekt links the perfective past higher.
  override({
    from: 'fr', to: 'de', tense: 'indicative.simple_past', mode: 'prepend',
    result: [{ tense: 'indicative.past', note: 'eq.de.past-written' }],
    reason: 'The passé simple is the written narrative past, which German writes in the Präteritum; the pivot ranks the Perfekt first (0.90 against 0.80) because the Perfekt is the usual spoken past.',
  }),
  override({
    from: 'it', to: 'de', tense: 'indicative.simple_past', mode: 'prepend',
    result: [{ tense: 'indicative.past', note: 'eq.de.past-written' }],
    reason: 'The passato remoto is the narrative past, which German writes in the Präteritum; the pivot ranks the Perfekt first (0.90 against 0.80) because the Perfekt is the usual spoken past.',
  }),
  // Structural: the passato prossimo before the literary passato remoto. The ranking orders by score and uses the register
  // only to break ties, and a standard source with a full-weight perfective past reaches the passato remoto at 1.00, so
  // only an override puts the standard tense first (ruling 3: a literary tense is never first when a standard one
  // corresponds). No weight can do it without also ranking the passato prossimo first for the passé simple.
  override({
    from: 'fr', to: 'it', tense: 'indicative.perfect', mode: 'prepend',
    result: [{ tense: 'indicative.perfect', note: 'eq.it.perfect-spoken' }],
    reason: 'The passé composé is the ordinary spoken past, as the passato prossimo is; the pivot ranks the literary passato remoto first (1.00 against 0.48) because it shares PAST_PERFECTIVE at full weight and the passato prossimo only at 0.4.',
  }),
  override({
    from: 'en', to: 'it', tense: 'indicative.past', mode: 'prepend',
    result: [{ tense: 'indicative.perfect', note: 'eq.it.perfect-spoken' }],
    reason: 'The English simple past of a finished event is the spoken passato prossimo, as it is the French passé composé; the pivot ranks the literary passato remoto first (0.60 against 0.24) because the passato prossimo links PAST_PERFECTIVE only at 0.4.',
  }),
  override({
    from: 'es', to: 'it', tense: 'indicative.simple_past', mode: 'prepend',
    result: [{ tense: 'indicative.perfect', note: 'eq.it.perfect-spoken' }],
    reason: 'The Spanish simple past is the standard past of speech and writing, which spoken Italian renders with the passato prossimo; the pivot ranks the literary passato remoto first (1.00 against 0.40).',
  }),
  override({
    from: 'la', to: 'it', tense: 'indicative.perfect', mode: 'prepend',
    result: [{ tense: 'indicative.perfect', note: 'eq.it.perfect-spoken' }],
    reason: 'The Latin perfect is also a present perfect, which the passato prossimo renders; the pivot ranks the literary passato remoto first (1.00 against 0.90) because the historic perfect shares PAST_PERFECTIVE at full weight.',
  }),
  // Ruling 2: the passé composé gives the English simple past first, and the present perfect with the note on when it fits.
  override({
    from: 'fr', to: 'en', tense: 'indicative.perfect', mode: 'prepend',
    result: [{ tense: 'indicative.past', note: 'eq.fr.perfect.spoken-past' }, { tense: 'indicative.perfect', note: 'eq.pair.fr-en.perfect-result' }],
    reason: 'The passé composé of a finished event is the English simple past, and the present perfect only when the result still matters; the pivot ranks the present perfect first (0.80 against 0.60), and the approved design fixes the opposite order.',
  }),
  // Ruling 3: Konjunktiv II is first of all the French conditionnel; the imparfait of a si-clause comes next.
  override({
    from: 'de', to: 'fr', tense: 'subjunctive.past', mode: 'prepend',
    result: [{ tense: 'conditional.present', note: 'eq.de.subjunctive-unreal' }],
    reason: 'Konjunktiv II is the German conditional of a main clause (ich wäre: je serais); the pivot ranks the imparfait of a si-clause and the literary subjonctif imparfait first (1.00 against 0.90), because Konjunktiv II also links SUBJ_IMPERFECT at full weight.',
  }),
  override({
    from: 'de', to: 'fr', tense: 'subjunctive.pluperfect', mode: 'prepend',
    result: [{ tense: 'conditional.past', note: 'eq.de.subjunctive-unreal' }],
    reason: 'The Konjunktiv II pluperfect is the German conditional past of a main clause (ich wäre gekommen: je serais venu); the pivot ranks the plus-que-parfait of a si-clause and the literary subjonctif first (1.00 against 0.90).',
  }),
  // Review I5: the plain imperative plus a negation word is false for Latin, which forbids with nōlī plus the infinitive.
  override({
    from: 'es', to: 'la', tense: 'imperative.negative', mode: 'exclude',
    result: [{ tense: 'imperative.present' }, { tense: 'imperative.future' }],
    reason: 'Latin forbids with nōlī or nōlīte plus the infinitive, not with the imperative plus a negation word; the source-only plain imperative of the negative imperative would offer the Latin imperatives with a note that is false for Latin.',
  }),
  override({
    from: 'it', to: 'la', tense: 'imperative.negative', mode: 'exclude',
    result: [{ tense: 'imperative.present' }, { tense: 'imperative.future' }],
    reason: 'Latin forbids with nōlī or nōlīte plus the infinitive, not with the imperative plus a negation word; the source-only plain imperative of the negative imperative would offer the Latin imperatives with a note that is false for Latin.',
  }),
]);
