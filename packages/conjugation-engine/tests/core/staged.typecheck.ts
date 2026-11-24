import type { Explainable, LanguageEngine as RootLanguageEngine } from '../../src/index.js';
import type { LanguageEngine as CoreLanguageEngine } from '../../src/core/pack.js';
import type { LanguageEngine as AdapterLanguageEngine } from '../../src/languages/adapter.js';
import { validateGrammar } from '../../src/core/staged.js';
import type { LexemeBase, StagedGrammar } from '../../src/core/staged.js';
import { toyGrammar } from '../toy/pack.js';
import type { ToyLexeme } from '../toy/pack.js';

// A grammar over a stricter lexeme type is accepted, with the lexeme type inferred or given.
export function checkValidateGrammarIsGeneric(strict: StagedGrammar<ToyLexeme>): void {
  validateGrammar(strict);
  validateGrammar<ToyLexeme>(toyGrammar);
  validateGrammar<LexemeBase>(toyGrammar as unknown as StagedGrammar);
}

// @ts-expect-error A lexeme type must extend LexemeBase.
export type NotAGrammar = StagedGrammar<{ readonly lemma: string }>;

// The subject union `explain` accepts is part of the public surface.
export const explainable: Explainable | null = null;

// LanguageEngine belongs to the core pack contract; the old adapter path and the package root name the same type.
export const coreEngine = (engine: AdapterLanguageEngine | RootLanguageEngine): CoreLanguageEngine => engine;
export const adapterEngine = (engine: CoreLanguageEngine): AdapterLanguageEngine & RootLanguageEngine => engine;
