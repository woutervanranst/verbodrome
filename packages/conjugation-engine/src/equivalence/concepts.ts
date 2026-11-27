/**
 * The closed inventory of language-neutral tense concepts that every language's tense map links to, and the types of
 * those maps. A concept is a point in the dimensions below; the names make the matrix reviewable, the dimensions drive
 * the relaxation ladder of `derive.ts`. Voice is not a dimension: a passive tense looks up the concept of its active
 * tense, and the lookup takes a `voice` qualifier.
 */
import type { equivalence } from '../i18n/locales/en/equivalence/index.js';
import type { Language, MoodFor, TenseFor } from '../types.js';

export type Finiteness = 'finite' | 'infinitive' | 'participle' | 'gerund' | 'verbalAdjective' | 'supine';
/** The mood of a finite concept; `null` for a non-finite one. */
export type ConceptMood = 'indicative' | 'subjunctive' | 'conditional' | 'imperative' | null;
/** The reference time. */
export type Time = 'past' | 'present' | 'future';
/** The event against the reference time: a perfect is `anterior`, a near future `posterior`. */
export type Relative = 'anterior' | 'simultaneous' | 'posterior';
export type Aspect = 'neutral' | 'perfective' | 'imperfective' | 'progressive';

export interface ConceptDef {
  readonly finiteness: Finiteness;
  readonly mood: ConceptMood;
  readonly time: Time;
  readonly relative: Relative;
  readonly aspect: Aspect;
  readonly remoteness?: 'near';
  readonly polarity?: 'negative';
}

const definitions = {
  PRESENT: { finiteness: 'finite', mood: 'indicative', time: 'present', relative: 'simultaneous', aspect: 'neutral' },
  PRESENT_PROGRESSIVE: { finiteness: 'finite', mood: 'indicative', time: 'present', relative: 'simultaneous', aspect: 'progressive' },
  PAST_PERFECTIVE: { finiteness: 'finite', mood: 'indicative', time: 'past', relative: 'simultaneous', aspect: 'perfective' },
  PAST_IMPERFECTIVE: { finiteness: 'finite', mood: 'indicative', time: 'past', relative: 'simultaneous', aspect: 'imperfective' },
  PAST_PROGRESSIVE: { finiteness: 'finite', mood: 'indicative', time: 'past', relative: 'simultaneous', aspect: 'progressive' },
  PRESENT_PERFECT: { finiteness: 'finite', mood: 'indicative', time: 'present', relative: 'anterior', aspect: 'neutral' },
  PRESENT_PERFECT_PROGRESSIVE: { finiteness: 'finite', mood: 'indicative', time: 'present', relative: 'anterior', aspect: 'progressive' },
  PLUPERFECT: { finiteness: 'finite', mood: 'indicative', time: 'past', relative: 'anterior', aspect: 'neutral' },
  PLUPERFECT_PROGRESSIVE: { finiteness: 'finite', mood: 'indicative', time: 'past', relative: 'anterior', aspect: 'progressive' },
  PAST_ANTERIOR: { finiteness: 'finite', mood: 'indicative', time: 'past', relative: 'anterior', aspect: 'perfective' },
  FUTURE: { finiteness: 'finite', mood: 'indicative', time: 'future', relative: 'simultaneous', aspect: 'neutral' },
  FUTURE_PROGRESSIVE: { finiteness: 'finite', mood: 'indicative', time: 'future', relative: 'simultaneous', aspect: 'progressive' },
  FUTURE_PERFECT: { finiteness: 'finite', mood: 'indicative', time: 'future', relative: 'anterior', aspect: 'neutral' },
  FUTURE_PERFECT_PROGRESSIVE: { finiteness: 'finite', mood: 'indicative', time: 'future', relative: 'anterior', aspect: 'progressive' },
  NEAR_FUTURE: { finiteness: 'finite', mood: 'indicative', time: 'present', relative: 'posterior', aspect: 'neutral', remoteness: 'near' },
  RECENT_PAST: { finiteness: 'finite', mood: 'indicative', time: 'present', relative: 'anterior', aspect: 'neutral', remoteness: 'near' },
  COND_PRESENT: { finiteness: 'finite', mood: 'conditional', time: 'present', relative: 'simultaneous', aspect: 'neutral' },
  COND_PROGRESSIVE: { finiteness: 'finite', mood: 'conditional', time: 'present', relative: 'simultaneous', aspect: 'progressive' },
  COND_PERFECT: { finiteness: 'finite', mood: 'conditional', time: 'present', relative: 'anterior', aspect: 'neutral' },
  COND_PERFECT_PROGRESSIVE: { finiteness: 'finite', mood: 'conditional', time: 'present', relative: 'anterior', aspect: 'progressive' },
  SUBJ_PRESENT: { finiteness: 'finite', mood: 'subjunctive', time: 'present', relative: 'simultaneous', aspect: 'neutral' },
  SUBJ_IMPERFECT: { finiteness: 'finite', mood: 'subjunctive', time: 'past', relative: 'simultaneous', aspect: 'imperfective' },
  SUBJ_PERFECT: { finiteness: 'finite', mood: 'subjunctive', time: 'present', relative: 'anterior', aspect: 'neutral' },
  SUBJ_PLUPERFECT: { finiteness: 'finite', mood: 'subjunctive', time: 'past', relative: 'anterior', aspect: 'neutral' },
  SUBJ_FUTURE: { finiteness: 'finite', mood: 'subjunctive', time: 'future', relative: 'simultaneous', aspect: 'neutral' },
  SUBJ_FUTURE_PERFECT: { finiteness: 'finite', mood: 'subjunctive', time: 'future', relative: 'anterior', aspect: 'neutral' },
  IMP_PRESENT: { finiteness: 'finite', mood: 'imperative', time: 'present', relative: 'simultaneous', aspect: 'neutral' },
  IMP_NEGATIVE: { finiteness: 'finite', mood: 'imperative', time: 'present', relative: 'simultaneous', aspect: 'neutral', polarity: 'negative' },
  IMP_FUTURE: { finiteness: 'finite', mood: 'imperative', time: 'future', relative: 'simultaneous', aspect: 'neutral' },
  IMP_PERFECT: { finiteness: 'finite', mood: 'imperative', time: 'present', relative: 'anterior', aspect: 'neutral' },
  INF_PRESENT: { finiteness: 'infinitive', mood: null, time: 'present', relative: 'simultaneous', aspect: 'neutral' },
  INF_PERFECT: { finiteness: 'infinitive', mood: null, time: 'present', relative: 'anterior', aspect: 'neutral' },
  INF_FUTURE: { finiteness: 'infinitive', mood: null, time: 'future', relative: 'simultaneous', aspect: 'neutral' },
  PART_PRESENT: { finiteness: 'participle', mood: null, time: 'present', relative: 'simultaneous', aspect: 'neutral' },
  PART_PAST: { finiteness: 'participle', mood: null, time: 'past', relative: 'anterior', aspect: 'neutral' },
  PART_PERFECT: { finiteness: 'participle', mood: null, time: 'present', relative: 'anterior', aspect: 'neutral' },
  PART_FUTURE: { finiteness: 'participle', mood: null, time: 'future', relative: 'simultaneous', aspect: 'neutral' },
  GERUND: { finiteness: 'gerund', mood: null, time: 'present', relative: 'simultaneous', aspect: 'neutral' },
  GERUND_PERFECT: { finiteness: 'gerund', mood: null, time: 'present', relative: 'anterior', aspect: 'neutral' },
  GERUNDIVE: { finiteness: 'verbalAdjective', mood: null, time: 'future', relative: 'simultaneous', aspect: 'neutral' },
  SUPINE: { finiteness: 'supine', mood: null, time: 'present', relative: 'simultaneous', aspect: 'neutral' },
} as const satisfies Record<string, ConceptDef>;

export type ConceptId = keyof typeof definitions;

/** The 41 concepts, in the order of the inventory. */
export const concepts: { readonly [id in ConceptId]: ConceptDef } = definitions;

/** How common a tense is today, ranked in this order: a `dated` tense is offered only when nothing else corresponds. */
export type Register = 'standard' | 'literary' | 'dated';

/** A note of the equivalence: a key of the `eq.*` messages in the core catalogs. */
export type NoteKey = keyof typeof equivalence;

/**
 * One weighted link from a language's tense to a concept. `only: 'target'` is a stand-in: used when the language is the
 * target of a lookup and never when it is the source (the Dutch past participle builds a perfect infinitive, but is not
 * one). `only: 'source'` is the reverse. A link with `only` carries a note that says how the stand-in is used.
 */
export interface ConceptLink {
  readonly concept: ConceptId;
  /** A multiple of 0.1 in (0, 1]: how well the concept describes the tense. */
  readonly weight: number;
  /** `standard` when absent. */
  readonly register?: Register;
  readonly note?: NoteKey;
  readonly only?: 'source' | 'target';
}

export interface LinkExtra {
  readonly register?: Register;
  readonly note?: NoteKey;
  readonly only?: 'source' | 'target';
}

/** A frozen link with only the keys it was given. */
export function link(concept: ConceptId, weight: number, extra: LinkExtra = {}): ConceptLink {
  return Object.freeze({ concept, weight, ...extra });
}

/** The only mood relaxations of the ladder: a subjunctive or conditional falls back to the indicative, an imperative never. */
export const moodRelaxation: Readonly<Record<'subjunctive' | 'conditional', readonly ['indicative']>> = Object.freeze({
  subjunctive: Object.freeze(['indicative'] as const),
  conditional: Object.freeze(['indicative'] as const),
});

/** The tenses of a language as map keys: `'indicative.near_future'`. */
export type TenseKeyFor<L extends Language> = { [M in MoodFor<L>]: `${M}.${TenseFor<L, M> & string}` }[MoodFor<L>];

/** A language's total tense map: every catalogue tense, and only those, with at least one link. */
export type LanguageMap<L extends Language> = { readonly [K in TenseKeyFor<L>]: readonly [ConceptLink, ...ConceptLink[]] };
