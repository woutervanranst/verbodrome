import type { GenerationResult, ResolvedTarget, VerbAnalysis } from '../types.js';

export interface LanguageEngine {
  readonly verbId: string;
  readonly analysis: VerbAnalysis;
  generate(target: ResolvedTarget): GenerationResult;
}
