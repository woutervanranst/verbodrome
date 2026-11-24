import { ConjugationError } from '../errors.js';
import type { ConjugationPart, RenderContext } from '../types.js';
import type { PackRendering } from './pack.js';

/**
 * Joins parts as each asks (space, hyphen or attached), fusing a part with the next where the pack's sandhi says so.
 * `bare` drops subjects and whatever else the pack omits from a bare form.
 */
export function renderWith(rendering: PackRendering, components: readonly ConjugationPart[], context: RenderContext = {}): string {
  const parts = context.bare
    ? components.filter(p => p.role !== 'subject' && !rendering.bareOmits(p))
    : components;
  if (!parts.length) throw new ConjugationError('GENERATION_FAILURE', 'Cannot render an empty component sequence.');
  let text = '';
  let attachNext = false;
  for (let index = 0; index < parts.length; index++) {
    const part = parts[index];
    if (!part || !part.text) throw new ConjugationError('GENERATION_FAILURE', 'Invalid grammatical component.');
    const next = parts[index + 1];
    const fused = next === undefined ? null : rendering.sandhi(part, next);
    const separator = index === 0 || attachNext || part.joinBefore === 'attached'
      ? '' : part.joinBefore === 'hyphen' ? '-' : ' ';
    text += separator + (fused ?? part.text);
    attachNext = fused !== null;
  }
  return text;
}
