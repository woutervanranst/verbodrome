import type { LanguageSpec } from '../../core/spec.js';

export type DutchTenses = {
  indicative: 'present' | 'past' | 'future' | 'perfect' | 'pluperfect' | 'future_perfect';
  conditional: 'present' | 'past';
  imperative: 'present';
  infinitive: 'present';
  participle: 'present' | 'past';
};

export type DutchClassHint = 'weak' | 'strong' | 'loan';

export type DutchPronoun = 'ik' | 'jij' | 'je' | 'u' | 'hij' | 'zij' | 'ze' | 'het' | 'wij' | 'we' | 'jullie';

export interface DutchStemHints {
  readonly stem?: string;
  readonly pastSingular?: string;
  readonly pastPlural?: string;
  readonly pastParticiple?: string;
  readonly pastSuffix?: 'd' | 't' | 'both';
  readonly unstressedFinalSyllable?: boolean;
}

export interface DutchSpec extends LanguageSpec {
  tenses: DutchTenses;
  nonFinite: 'infinitive' | 'participle';
  auxiliary: 'hebben' | 'zijn';
  classHint: DutchClassHint;
  stems: DutchStemHints;
  subject: never;
  context: {
    readonly pronoun?: DutchPronoun;
    readonly inversion?: boolean;
    readonly reflexive?: boolean;
    readonly separablePrefix?: string;
    readonly inseparablePrefix?: string;
  };
}
