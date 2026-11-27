import type { LanguageSpec } from '../../core/spec.js';

/** The Spanish tenses by mood, named after the NGLE (§4.3); compound tenses and the negative imperative are periphrases. */
export type SpanishTenses = {
  indicative: 'present' | 'perfect' | 'imperfect' | 'pluperfect' | 'simple_past' | 'past_anterior' | 'future' | 'future_perfect';
  conditional: 'present' | 'past';
  subjunctive: 'present' | 'past' | 'imperfect' | 'pluperfect' | 'future' | 'future_perfect';
  imperative: 'present' | 'negative';
  infinitive: 'present' | 'past';
  gerund: 'present' | 'past';
  participle: 'past';
};

/** The stem-vowel alternation of a verb the lexicon does not list (or the paradigm of a two-paradigm lemma). */
export type SpanishClassHint = 'regular' | 'e-ie' | 'o-ue' | 'u-ue' | 'i-ie' | 'e-i';

export interface SpanishStemHints {
  /** Whether the i of -iar or the close vowel of a root vowel group is stressed on its own (hiatus: envío) or not (cambio). */
  readonly stress?: 'hiatus' | 'diphthong';
  /** Force (true) or block (false) the zc of vowel + -cer/-cir (conozco). */
  readonly zc?: boolean;
}

/** The subject slots, in output order within one person and number. */
export type SpanishSubject =
  | '1sg' | '2sg' | '3sg' | '3sg.f' | '2sg.formal' | '1pl' | '1pl.f' | '2pl' | '2pl.f' | '3pl' | '3pl.f' | '2pl.formal';

export interface SpanishSpec extends LanguageSpec<SpanishTenses> {
  tenses: SpanishTenses;
  nonFinite: 'infinitive' | 'gerund' | 'participle';
  auxiliary: 'haber';
  classHint: SpanishClassHint;
  stems: SpanishStemHints;
  subject: SpanishSubject;
  context: {
    readonly reflexive?: boolean;
    readonly gender?: 'masculine' | 'feminine';
  };
}
