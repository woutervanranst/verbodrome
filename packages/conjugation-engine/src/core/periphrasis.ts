import type { FormVariant, ResolvedTarget } from '../types.js';
import { step } from './derivation.js';
import type { DerivationStep, RuleInfo } from './derivation.js';
import type { Voice } from './grammar.js';
import type { LexemeBase } from './staged.js';

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
 * `validateGrammar` checks the declaration once; nesting is checked when a target is generated. `X` is the lexeme type
 * of the pack's grammar, so `applies` can read the pack's own lexical data without a cast.
 */
export interface Periphrasis<X extends LexemeBase = LexemeBase> {
  readonly mood: string;
  readonly tense: string;
  /**
   * Matched exactly: a periphrasis without `voice` builds only targets without a voice, so a language whose catalogue
   * has voices writes `voice: 'active'` explicitly on its active compound tenses.
   */
  readonly voice?: Voice;
  /**
   * Whether this recipe builds the target for `lexeme`, the verb being conjugated (never an auxiliary the chain names):
   * a deponent verb's perfect is a compound tense where an ordinary verb's is one word. Absent: applies to every verb.
   * Only the periphrases that apply to a verb are considered for it; a target the verb's `cellOf` already maps to a cell
   * is built from that cell, and no periphrasis runs for it.
   */
  readonly applies?: (lexeme: X) => boolean;
  /** Stage 'periphrasis'. Declares one `auxiliary` text param when the chain uses `perfectAuxiliary`, and no params otherwise. */
  readonly rule: RuleInfo;
  readonly chain: readonly ChainElement[];
  readonly pattern?: string;
  readonly usage?: FormVariant['usage'];
  /**
   * The verb a form reports as its `variant.auxiliary` (`'main'`: none). By default the perfect auxiliary when the chain
   * uses one, otherwise the first verb the chain names by lemma, otherwise none.
   */
  readonly reports?: VerbRef;
}

/**
 * The periphrases that build `target` for `lexeme`: same mood and tense, the same voice or both without one, and
 * applying to the lexeme.
 */
export function periphrasesFor<X extends LexemeBase>(periphrases: readonly Periphrasis<X>[], target: ResolvedTarget, lexeme: X): Periphrasis<X>[] {
  return periphrases.filter(p =>
    p.mood === target.mood && p.tense === target.tense && (p.voice ?? null) === (target.voice ?? null) && (p.applies?.(lexeme) ?? true));
}

export function usesPerfectAuxiliary(periphrasis: Pick<Periphrasis, 'chain'>): boolean {
  return periphrasis.chain.some(element => 'verb' in element && element.verb === 'perfectAuxiliary');
}

/** The lemma a form built by `periphrasis` reports as its auxiliary; `perfectAuxiliary` is the one this run uses, if any. */
export function reportedAuxiliary(periphrasis: Pick<Periphrasis, 'chain' | 'reports'>, perfectAuxiliary: string | null): string | null {
  const reported = periphrasis.reports ?? (usesPerfectAuxiliary(periphrasis) ? 'perfectAuxiliary' : firstNamedVerb(periphrasis.chain));
  if (reported === 'main') return null;
  return reported === 'perfectAuxiliary' ? perfectAuxiliary : reported.lemma;
}

/** The first verb a chain names by lemma, or `'main'` when it names none. */
function firstNamedVerb(chain: readonly ChainElement[]): VerbRef {
  for (const element of chain) if ('verb' in element && typeof element.verb === 'object') return element.verb;
  return 'main';
}

/** The form-level step that names the construction; `auxiliary` is the perfect auxiliary this run uses, if any. */
export function periphrasisStep(periphrasis: Pick<Periphrasis, 'rule'>, auxiliary: string | null): DerivationStep {
  return step(periphrasis.rule, null, null, auxiliary === null ? {} : { auxiliary });
}
