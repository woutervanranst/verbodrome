import { engine } from './default-engine.js';
import type { ConjugationOptions, ConjugationResult } from './types.js';

export function conjugate(options: ConjugationOptions): ConjugationResult {
  return engine.conjugate(options);
}
