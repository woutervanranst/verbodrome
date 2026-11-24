/** Grammatical vocabulary shared by every language; each pack decides which values it uses. */

export type Person = 1 | 2 | 3;
export type GrammaticalNumber = 'singular' | 'plural';
export type Gender = 'masculine' | 'feminine' | 'neuter';
export type Voice = 'active' | 'passive';
export type Case = 'nominative' | 'genitive' | 'dative' | 'accusative' | 'ablative';

export interface Agreement {
  readonly gender: Gender;
  readonly number: GrammaticalNumber;
  /** Only where participles decline (Latin). */
  readonly case?: Case;
}

export interface AgreementQuery {
  readonly gender?: Gender;
  readonly number?: GrammaticalNumber;
}
