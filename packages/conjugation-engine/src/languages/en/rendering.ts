import type { PackRendering } from '../../core/pack.js';

/** English has no sandhi the forms show (no elision, no liaison); the onset is read from the first letter. */
export const englishRendering: PackRendering = {
  onset: text => /^[aeiou]/iu.test(text) ? 'vowel' : 'consonant',
  sandhi: () => null,
  bareOmits: () => false,
};
