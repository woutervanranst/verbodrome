import type { PackRendering } from '../../core/pack.js';

export const dutchRendering: PackRendering = {
  /** Dutch has no h-sensitive sandhi, so an initial h is an ordinary consonant. */
  onset: text => /^[aeiouyàâäéèêëîïôöùûüœæ]/u.test(text.toLowerCase()) ? 'vowel' : 'consonant',
  sandhi: () => null,
  bareOmits: () => false,
};
