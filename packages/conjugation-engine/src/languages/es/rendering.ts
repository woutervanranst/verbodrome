import type { PackRendering } from '../../core/pack.js';

/** Spanish has no sandhi; a bare form drops the subject pronoun and the que that lists subjunctive forms, never no. */
export const spanishRendering: PackRendering = {
  onset: text => /^[aeiouáéíóúü]/u.test(text.toLowerCase()) ? 'vowel' : 'consonant',
  sandhi: () => null,
  bareOmits: part => part.role === 'moodMarker' && part.text === 'que',
};
