import { engine } from './default-engine.js';
import type { ConjugationPart, Language, RenderContext } from './types.js';

export function renderParts(language: Language, components: readonly ConjugationPart[], context?: RenderContext): string {
  return engine.renderParts(language, components, context);
}
