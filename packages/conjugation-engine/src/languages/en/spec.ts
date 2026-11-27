import type { LanguageSpec } from '../../core/spec.js';

/** The English tenses by mood (design §2); progressive tense ids keep `*_progressive`, their labels say "continuous". */
export type EnglishTenses = {
  indicative: 'present' | 'past' | 'perfect' | 'pluperfect' | 'future' | 'future_perfect'
    | 'present_progressive' | 'past_progressive' | 'perfect_progressive' | 'pluperfect_progressive'
    | 'future_progressive' | 'future_perfect_progressive';
  conditional: 'present' | 'past' | 'present_progressive' | 'past_progressive';
  subjunctive: 'present' | 'past' | 'perfect' | 'pluperfect';
  imperative: 'present';
  infinitive: 'present';
  participle: 'present' | 'past';
};

/** `regular` keeps the -ed paradigm of a verb that has one (hanged); `irregular` keeps the listed ones (hung). */
export type EnglishClassHint = 'regular' | 'irregular';

/** The principal parts of an invented irregular verb; both are given together. */
export interface EnglishStemHints {
  readonly past?: string;
  readonly pastParticiple?: string;
}

export interface EnglishSpec extends LanguageSpec<EnglishTenses> {
  tenses: EnglishTenses;
  nonFinite: 'infinitive' | 'participle';
  auxiliary: 'have';
  classHint: EnglishClassHint;
  stems: EnglishStemHints;
  subject: '1sg' | '2sg' | '3sg.m' | '3sg.f' | '3sg.n' | '1pl' | '2pl' | '3pl';
  context: {
    /** Where the stress falls in a polysyllable, for consonant doubling and the British final l. */
    readonly stress?: 'final' | 'nonFinal';
    /** Keeps only forms without a region or of this region, and ranks this region first. */
    readonly region?: 'GB' | 'US';
    /** Whether a verb ending in consonant + o or in ch takes -s or -es, where spelling cannot tell (demos, vetoes). */
    readonly sEnding?: 's' | 'es';
  };
}
