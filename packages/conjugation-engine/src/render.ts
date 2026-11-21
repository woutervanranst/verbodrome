import { ConjugationError } from './errors.js';
import type { ConjugationPart, Language, RenderContext } from './types.js';

function canElide(part: ConjugationPart): boolean {
  return (part.role === 'subject' && part.text === 'je')
    || (part.role === 'reflexivePronoun' && ['me', 'te', 'se'].includes(part.text))
    || (part.role === 'moodMarker' && part.text === 'que')
    || (part.role === 'linker' && part.text === 'de');
}

export function renderParts(language: Language, components: readonly ConjugationPart[], context: RenderContext = {}): string {
  if (language !== 'fr' && language !== 'nl') {
    throw new ConjugationError('UNSUPPORTED_LANGUAGE', 'Renderer language must be fr or nl.');
  }
  const parts = context.bare
    ? components.filter(p => p.role !== 'subject' && !(p.role === 'moodMarker' && p.text === 'que'))
    : components;
  if (!parts.length) throw new ConjugationError('GENERATION_FAILURE', 'Cannot render an empty component sequence.');
  let text = '';
  let attachNext = false;
  for (let index = 0; index < parts.length; index++) {
    const part = parts[index];
    if (!part || !part.text) throw new ConjugationError('GENERATION_FAILURE', 'Invalid grammatical component.');
    const next = parts[index + 1];
    const elide = language === 'fr' && canElide(part) && next !== undefined
      && ['vowel', 'muteH'].includes(next.phonology.onset);
    const separator = index === 0 || attachNext || part.joinBefore === 'attached'
      ? '' : part.joinBefore === 'hyphen' ? '-' : ' ';
    text += separator + (elide ? `${part.text.slice(0, -1)}'` : part.text);
    attachNext = elide;
  }
  return text;
}
