import type { PackRendering } from '../../core/pack.js';
import type { ConjugationPart } from '../../types.js';

function canElide(part: ConjugationPart): boolean {
  return (part.role === 'subject' && part.text === 'je')
    || (part.role === 'reflexivePronoun' && ['me', 'te', 'se'].includes(part.text))
    || (part.role === 'moodMarker' && part.text === 'que')
    || (part.role === 'linker' && part.text === 'de');
}

export const frenchRendering: PackRendering = {
  onset(text, flags) {
    const aspiratedH = flags.aspiratedH ?? false;
    const initial = text.toLowerCase();
    return initial.startsWith('h')
      ? (aspiratedH ? 'aspiratedH' : 'muteH')
      : (/^[aeiouyàâäéèêëîïôöùûüœæ]/u.test(initial) ? 'vowel' : 'consonant');
  },
  /** Elision: je, me, te, se, que and de lose their final vowel before a vowel or mute h. */
  sandhi: (left, right) => canElide(left) && ['vowel', 'muteH'].includes(right.phonology.onset)
    ? `${left.text.slice(0, -1)}'` : null,
  /** A bare form drops the subjunctive marker que along with the subject. */
  bareOmits: part => part.role === 'moodMarker' && part.text === 'que',
};
