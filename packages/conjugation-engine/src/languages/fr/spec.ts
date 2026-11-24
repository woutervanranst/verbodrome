import type { LanguageSpec } from '../../core/spec.js';
import type { Agreement, AgreementQuery, Gender } from '../../types.js';

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

export interface FrenchStemHints {
  readonly singular?: string;
  readonly plural?: string;
  readonly thirdPlural?: string;
  readonly future?: string;
  readonly past?: string;
  readonly pastVowel?: 'a' | 'i' | 'u' | 'in';
  readonly pastParticiple?: string;
}

export interface FrenchSpec extends LanguageSpec {
  tenses: FrenchTenses;
  nonFinite: 'infinitive' | 'participle' | 'gerund';
  auxiliary: 'avoir' | 'être';
  classHint: FrenchClassHint;
  stems: FrenchStemHints;
  context: {
    readonly gender?: Gender;
    readonly agreement?: AgreementQuery;
    readonly precedingDirectObject?: Agreement;
    readonly reflexiveObject?: 'direct' | 'indirect';
    readonly model?: string;
    readonly aspiratedH?: boolean;
    readonly preferredOrthography?: 'rectified' | 'traditional';
  };
}
