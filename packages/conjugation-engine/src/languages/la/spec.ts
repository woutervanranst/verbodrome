import type { Agreement, Voice } from '../../core/grammar.js';
import type { LanguageSpec } from '../../core/spec.js';

/** The Latin catalogue's tenses by mood (A&G §§153–155): gerund and supine are moods with one tense, `present`. */
export type LatinTenses = {
  indicative: 'present' | 'imperfect' | 'future' | 'perfect' | 'pluperfect' | 'future_perfect';
  subjunctive: 'present' | 'imperfect' | 'perfect' | 'pluperfect';
  imperative: 'present' | 'future';
  infinitive: 'present' | 'perfect' | 'future';
  participle: 'present' | 'perfect' | 'future' | 'gerundive';
  gerund: 'present';
  supine: 'present';
};

/** The conjugation a verb is told to follow; `thirdIo` is the third conjugation in -iō (capiō). */
export type LatinClassHint = 'first' | 'second' | 'third' | 'thirdIo' | 'fourth';

export type LatinGender = 'masculine' | 'feminine' | 'neuter';

/** Principal parts beyond the infinitive (A&G §172), and the semi-deponent flag. */
export interface LatinStemHints {
  /** The first person singular present: amō, hortor, capiō. */
  readonly present?: string;
  /** The first person singular perfect active: amāvī. */
  readonly perfect?: string;
  /** The supine (amātum) or the perfect participle (amātus). */
  readonly supine?: string;
  readonly semiDeponent?: boolean;
}

type LatinPersonNumber = '1sg' | '2sg' | '3sg' | '1pl' | '2pl' | '3pl';

/** The ungendered default slot of each person and number, then its masculine, feminine and neuter slots. */
export type LatinSubject = LatinPersonNumber | `${LatinPersonNumber}.${'m' | 'f' | 'n'}`;

export interface LatinSpec extends LanguageSpec<LatinTenses> {
  tenses: LatinTenses;
  nonFinite: 'infinitive' | 'participle' | 'gerund' | 'supine';
  auxiliary: never;
  classHint: LatinClassHint;
  stems: LatinStemHints;
  subject: LatinSubject;
  context: {
    readonly voice?: Voice;
    readonly gender?: LatinGender;
    /** Present (even `{}`): non-finite forms are declined in full and filtered by the given keys. */
    readonly agreement?: Partial<Agreement>;
  };
}
