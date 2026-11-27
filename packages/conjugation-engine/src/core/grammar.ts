import type { VerbAnalysis } from '../types.js';

/** Grammatical vocabulary shared by every language; each pack decides which values it uses. */

export type Person = 1 | 2 | 3;
export type GrammaticalNumber = 'singular' | 'plural';
export type Gender = 'masculine' | 'feminine' | 'neuter';
export type Voice = 'active' | 'passive';
export type Case = 'nominative' | 'genitive' | 'dative' | 'accusative' | 'ablative' | 'vocative';

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

/** What every staged grammar knows about a verb; a grammar extends it with its own lexical data. */
export interface LexemeBase {
  readonly lemma: string;
  readonly verbId: string;
  readonly classId: string;
  readonly classSource: VerbAnalysis['classificationSource'];
  readonly reflexive: boolean;
  /** Perfect auxiliaries, in output order; a periphrasis using `perfectAuxiliary` runs once per entry. */
  readonly auxiliaries: readonly string[];
  /** A verbal particle (de/nl prefix); the clause places it. */
  readonly particle: { readonly text: string; readonly separable: boolean } | null;
}
