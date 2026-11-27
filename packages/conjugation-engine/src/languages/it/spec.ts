import type { LanguageSpec } from '../../core/spec.js';

export type ItalianTenses = {
  indicative:
    | 'present' | 'perfect' | 'imperfect' | 'pluperfect'
    | 'simple_past' | 'past_anterior' | 'future' | 'future_perfect';
  subjunctive: 'present' | 'past' | 'imperfect' | 'pluperfect';
  conditional: 'present' | 'past';
  imperative: 'present' | 'negative';
  infinitive: 'present' | 'past';
  participle: 'present' | 'past';
  gerund: 'present' | 'past';
};

/** For a verb in -ire: with -isc- in the forms stressed on the stem (finisco) or without (dormo). */
export type ItalianClassHint = 'isc' | 'plain';

/** Italian participles agree in two genders. */
export type ItalianGender = 'masculine' | 'feminine';

/** Hints for a verb the lexicon does not list; each replaces the default it names. */
export interface ItalianStemHints {
  /** The strong passato remoto, 1st person singular (presi). */
  readonly past?: string;
  /** The past participle, masculine singular (preso). */
  readonly participle?: string;
  /** The future and conditional stem, with its final r (vedr). */
  readonly future?: string;
  /** Whether the i of an -iare verb is stressed (invìo) or not (studio). */
  readonly stressedI?: boolean;
}

/** The subject slots: io, tu, lui, lei, Lei (courtesy), noi, voi, loro, Loro (courtesy). */
export type ItalianSubject = '1sg' | '2sg' | '3sg.m' | '3sg.f' | '3sg.formal' | '1pl' | '2pl' | '3pl' | '3pl.formal';

export interface ItalianSpec extends LanguageSpec<ItalianTenses> {
  tenses: ItalianTenses;
  nonFinite: 'infinitive' | 'participle' | 'gerund';
  auxiliary: 'avere' | 'essere';
  classHint: ItalianClassHint;
  stems: ItalianStemHints;
  subject: ItalianSubject;
  context: {
    /** Conjugate the verb reflexively (lavare + reflexive = lavarsi). */
    readonly reflexive?: boolean;
    /** Keep the subjects and participle agreements of this gender only. */
    readonly gender?: ItalianGender;
  };
}
