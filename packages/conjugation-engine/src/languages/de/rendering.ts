import type { PackRendering } from '../../core/pack.js';

/** German has no elision between the words of a verb form and drops nothing in a bare form but the subject. */
export const germanRendering: PackRendering = {
  onset: text => /^[aeiouäöü]/iu.test(text) ? 'vowel' : 'consonant',
  sandhi: () => null,
  bareOmits: () => false,
};
