import type { Explainable } from '../../src/index.js';
import type { LanguageEngine as RootLanguageEngine } from '../../src/core/index.js';
import type { LanguageEngine as CoreLanguageEngine } from '../../src/core/pack.js';
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

// LanguageEngine belongs to the core pack contract; the `./core` barrel names the same type.
export const coreEngine = (engine: RootLanguageEngine): CoreLanguageEngine => engine;
export const barrelEngine = (engine: CoreLanguageEngine): RootLanguageEngine => engine;
