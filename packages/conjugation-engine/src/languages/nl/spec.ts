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

/** The Dutch subject slots: person and number for the default subject, with the pronoun added for the others. */
export type DutchSubject = '1sg' | '2sg' | '2sg.je' | '2sg.u' | '3sg' | '3sg.zij' | '3sg.ze' | '3sg.het' | '1pl' | '1pl.we' | '2pl' | '3pl' | '3pl.ze';

export interface DutchStemHints {
  readonly stem?: string;
  readonly pastSingular?: string;
  readonly pastPlural?: string;
  readonly pastParticiple?: string;
  readonly pastSuffix?: 'd' | 't' | 'both';
  readonly unstressedFinalSyllable?: boolean;
}

export interface DutchSpec extends LanguageSpec<DutchTenses> {
  tenses: DutchTenses;
  nonFinite: 'infinitive' | 'participle';
  auxiliary: 'hebben' | 'zijn';
  classHint: DutchClassHint;
  stems: DutchStemHints;
  subject: DutchSubject;
  context: {
    readonly pronoun?: DutchPronoun;
    readonly inversion?: boolean;
    readonly reflexive?: boolean;
    readonly separablePrefix?: string;
    readonly inseparablePrefix?: string;
  };
}
