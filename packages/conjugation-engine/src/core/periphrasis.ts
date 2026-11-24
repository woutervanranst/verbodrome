import type { FormVariant, ResolvedTarget } from '../types.js';
import { step } from './derivation.js';
import type { DerivationStep, RuleInfo } from './derivation.js';
import type { Voice } from './grammar.js';

/** The verb a chain element conjugates: the queried verb, its perfect auxiliary (one run per auxiliary), or a named verb. */
export type VerbRef = 'main' | 'perfectAuxiliary' | { readonly lemma: string };

/**
 * One word of a compound tense, in recipe order. A verb element names a simple cell of the same grammar: a finite
 * mood/tense (person and number come from the target) or a non-finite form; periphrases never nest. `agree` marks the
 * element that takes the agreement the clause grammar chooses. A `word` element is literal text.
 */
export type ChainElement =
  | { readonly verb: VerbRef; readonly finite: { readonly mood: string; readonly tense: string } }
  | { readonly verb: VerbRef; readonly nonFinite: string; readonly agree?: true }
  | { readonly word: string; readonly role: 'linker' | 'particle' | 'moodMarker' };

/**
 * A compound tense as a recipe. Several entries for one target are named variants (`pattern`, `usage`).
 * A periphrasis without `voice` builds only targets without a voice.
 */
export interface Periphrasis {
  readonly mood: string;
  readonly tense: string;
  readonly voice?: Voice;
  /** Stage 'periphrasis'. Declares one `auxiliary` text param when the chain uses `perfectAuxiliary`, and no params otherwise. */
  readonly rule: RuleInfo;
  readonly chain: readonly ChainElement[];
  readonly pattern?: string;
  readonly usage?: FormVariant['usage'];
}

/** The periphrases that build `target`: same mood and tense, and the same voice or both without one. */
export function periphrasesFor(periphrases: readonly Periphrasis[], target: ResolvedTarget): Periphrasis[] {
  return periphrases.filter(p => p.mood === target.mood && p.tense === target.tense && (p.voice ?? null) === (target.voice ?? null));
}

export function usesPerfectAuxiliary(periphrasis: Periphrasis): boolean {
  return periphrasis.chain.some(element => 'verb' in element && element.verb === 'perfectAuxiliary');
}

/** The form-level step that names the construction; `auxiliary` is the perfect auxiliary this run uses, if any. */
export function periphrasisStep(periphrasis: Periphrasis, auxiliary: string | null): DerivationStep {
  return step(periphrasis.rule, null, null, auxiliary === null ? {} : { auxiliary });
}
