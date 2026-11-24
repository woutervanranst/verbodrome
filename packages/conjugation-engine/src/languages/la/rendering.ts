import type { PackRendering } from '../../core/pack.js';

/**
 * Latin rendering (GD §6.5): a word starts with a vowel when its first letter is one, with or without a macron; no
 * sandhi (elision is metrical, not written); a bare form omits nothing, since no part is a subject.
 */
export const latinRendering: PackRendering = {
  onset: text => /^[aeiouy]/iu.test(text.normalize('NFD')) ? 'vowel' : 'consonant',
  sandhi: () => null,
  bareOmits: () => false,
};
