import type { LanguageSpec } from '../../core/spec.js';

export type GermanTenses = {
  indicative: 'present' | 'past' | 'perfect' | 'pluperfect' | 'future' | 'future_perfect';
  subjunctive: 'present' | 'perfect' | 'future' | 'future_perfect' | 'past' | 'pluperfect';
  conditional: 'present' | 'past';
  imperative: 'present';
  infinitive: 'present' | 'perfect';
  participle: 'present' | 'past';
};

export type GermanClassHint = 'weak' | 'strong' | 'mixed';

/**
 * Principal parts for a verb the lexicon does not list, or overriding a listed verb's: `present2` the du/er stem of the
 * Präsens (`fähr`), `preterite` the Präteritum stem (`fuhr`; for a mixed verb the stem before -te, `brann`),
 * `subjunctive` the Konjunktiv II stem (`führ`), `participle` the whole Partizip II (`gefahren`), and
 * `unstressedFirstSyllable` when the first syllable is not stressed, so the Partizip II has no ge-.
 */
export interface GermanStemHints {
  readonly present2?: string;
  readonly preterite?: string;
  readonly subjunctive?: string;
  readonly participle?: string;
  readonly unstressedFirstSyllable?: boolean;
}

/** The subject slots: the six default persons, the feminine and neuter third person singular, and formal Sie. */
export type GermanSubject = '1sg' | '2sg' | '3sg' | '3sg.f' | '3sg.n' | '1pl' | '2pl' | '3pl' | '2.formal';

export interface GermanSpec extends LanguageSpec<GermanTenses> {
  tenses: GermanTenses;
  nonFinite: 'infinitive' | 'participle';
  auxiliary: 'haben' | 'sein';
  classHint: GermanClassHint;
  stems: GermanStemHints;
  subject: GermanSubject;
  context: {
    readonly separablePrefix?: string;
    readonly inseparablePrefix?: string;
  };
}
