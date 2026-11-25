import type { GrammaticalNumber } from '../../core/grammar.js';
import type { LanguageSpec } from '../../core/spec.js';

export type FrenchTenses = {
  indicative:
    | 'present' | 'perfect' | 'imperfect' | 'pluperfect'
    | 'simple_past' | 'past_anterior' | 'future' | 'future_perfect'
    | 'near_future' | 'recent_past';
  subjunctive: 'present' | 'past' | 'imperfect' | 'pluperfect';
  conditional: 'present' | 'past';
  imperative: 'present' | 'past';
  infinitive: 'present' | 'past';
  participle: 'present' | 'past' | 'perfect';
  gerund: 'present' | 'past';
};

export type FrenchClassHint = 'er' | 'ir' | 're';

/** French has no neuter: its gender and agreement options take only these two. */
export type FrenchGender = 'masculine' | 'feminine';

export interface FrenchAgreement {
  readonly gender: FrenchGender;
  readonly number: GrammaticalNumber;
}

/**
 * The French subject slots: je, tu, il, nous, vous, ils, all without a gender (the clause shows il/elle and an agreeing
 * participle's gender form by form).
 */
export type FrenchSubject = '1sg' | '2sg' | '3sg' | '1pl' | '2pl' | '3pl';

export interface FrenchStemHints {
  readonly singular?: string;
  readonly plural?: string;
  readonly thirdPlural?: string;
  readonly future?: string;
  readonly past?: string;
  readonly pastVowel?: 'a' | 'i' | 'u' | 'in';
  readonly pastParticiple?: string;
}

export interface FrenchSpec extends LanguageSpec<FrenchTenses> {
  tenses: FrenchTenses;
  nonFinite: 'infinitive' | 'participle' | 'gerund';
  auxiliary: 'avoir' | 'être';
  classHint: FrenchClassHint;
  stems: FrenchStemHints;
  subject: FrenchSubject;
  context: {
    readonly gender?: FrenchGender;
    readonly agreement?: Partial<FrenchAgreement>;
    readonly precedingDirectObject?: FrenchAgreement;
    readonly reflexiveObject?: 'direct' | 'indirect';
    readonly model?: string;
    readonly aspiratedH?: boolean;
    readonly preferredOrthography?: 'rectified' | 'traditional';
  };
}
