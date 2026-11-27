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
  override({
    from: 'fr', to: 'de', tense: 'indicative.simple_past', mode: 'prepend',
    result: [{ tense: 'indicative.past', note: 'eq.de.past-written' }],
    reason: 'The passé simple is the written narrative past, which German writes in the Präteritum; the pivot ranks the Perfekt first (0.90 against 0.80) because the Perfekt is the usual spoken past.',
  }),
  override({
    from: 'es', to: 'nl', tense: 'subjunctive.pluperfect', mode: 'prepend',
    result: [{ tense: 'indicative.pluperfect', note: 'eq.pair.subjunctive-clause' }],
    reason: 'The Spanish -ra pluperfect subjunctive links COND_PERFECT 0.5, an exact match that ranks the Dutch conditional past first and hides the indicative pluperfect that renders a Spanish subordinate clause.',
  }),
  override({
    from: 'fr', to: 'it', tense: 'indicative.perfect', mode: 'prepend',
    result: [{ tense: 'indicative.perfect', note: 'eq.it.perfect-spoken' }],
    reason: 'The passé composé is the ordinary spoken past, as the passato prossimo is; the pivot ranks the literary passato remoto first (1.00 against 0.48) because it shares PAST_PERFECTIVE at full weight and the passato prossimo only at 0.4.',
  }),
  override({
    from: 'de', to: 'it', tense: 'indicative.perfect', mode: 'prepend',
    result: [{ tense: 'indicative.perfect', note: 'eq.it.perfect-spoken' }],
    reason: 'The Perfekt is the ordinary spoken past, as the passato prossimo is; the pivot ranks the literary passato remoto first (0.90 against 0.60) because the passato prossimo links PAST_PERFECTIVE only at 0.4.',
  }),
  override({
    from: 'it', to: 'de', tense: 'indicative.simple_past', mode: 'prepend',
    result: [{ tense: 'indicative.past', note: 'eq.de.past-written' }],
    reason: 'The passato remoto is the narrative past, which German writes in the Präteritum; the pivot ranks the Perfekt first (0.90 against 0.80) because the Perfekt is the usual spoken past.',
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
  override({
    from: 'fr', to: 'en', tense: 'indicative.perfect', mode: 'prepend',
    result: [{ tense: 'indicative.past', note: 'eq.fr.perfect.spoken-past' }, { tense: 'indicative.perfect', note: 'eq.pair.fr-en.perfect-result' }],
    reason: 'The passé composé of a finished event is the English simple past, and the present perfect only when the result still matters; the pivot ranks the present perfect first (0.80 against 0.60), and the approved design fixes the opposite order.',
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
    from: 'nl', to: 'en', tense: 'indicative.past', mode: 'prepend',
    result: [{ tense: 'indicative.past', note: 'eq.en.past-both' }],
    reason: 'The Dutch simple past is as neutral in aspect as the English one (ik liep, I walked); the pivot ranks the past progressive first (0.90 against 0.42) because the Dutch past links PAST_IMPERFECTIVE at full weight, which ranks the French imparfait first.',
  }),
  override({
    from: 'de', to: 'en', tense: 'indicative.past', mode: 'prepend',
    result: [{ tense: 'indicative.past', note: 'eq.en.past-both' }],
    reason: 'The Präteritum is as neutral in aspect as the English simple past (ich ging, I went); the pivot ranks the past progressive first (0.90 against 0.48) because the Präteritum links PAST_IMPERFECTIVE at full weight, which ranks the French imparfait first.',
  }),
  override({
    from: 'en', to: 'fr', tense: 'subjunctive.past', mode: 'prepend',
    result: [{ tense: 'indicative.imperfect', note: 'eq.pair.en-fr.si-clause' }],
    reason: 'The English past subjunctive is the unreal after if, which French puts in the indicative imperfect after si; the pivot offers only the literary subjonctif imparfait, the other SUBJ_IMPERFECT.',
  }),
  override({
    from: 'en', to: 'fr', tense: 'subjunctive.pluperfect', mode: 'prepend',
    result: [{ tense: 'indicative.pluperfect', note: 'eq.pair.en-fr.si-clause' }],
    reason: 'The English pluperfect subjunctive is the unreal past after if, which French puts in the indicative pluperfect after si; the pivot offers only the literary subjonctif plus-que-parfait.',
  }),
]);
