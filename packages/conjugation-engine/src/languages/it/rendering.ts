import type { PackRendering } from '../../core/pack.js';

/**
 * Italian renders word by word: no elision at render time (mi alzo, not m'alzo), and a bare form drops only the
 * subject. A silent h before a vowel (ho, hanno) counts as a vowel onset.
 */
export const italianRendering: PackRendering = {
  onset: text => /^h?[aeiouàèéìíòóùú]/iu.test(text) ? 'vowel' : 'consonant',
  sandhi: () => null,
  bareOmits: () => false,
};
