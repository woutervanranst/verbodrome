/**
 * Mechanisms the Romance packs share, with the data passed in: the sound-preserving respelling of a stem's last
 * consonant before the ending (French plaçons, Spanish busqué, Italian cerchi). Nothing here knows a language: the
 * grapheme table, the vowels, the condition and the rule a pack records are the pack's own.
 */
import type { RuleInfo } from '../../core/derivation.js';
import { one } from '../../core/fork.js';
import type { Juncture, JunctureRule } from '../../core/juncture.js';

/** One respelling: which stem endings change, into what, before which endings, and for which verbs. */
export interface ConsonantSpelling<C> {
  /** The pack's rule; its step is recorded by the juncture runner when the word changes. */
  readonly info: RuleInfo;
  /** The stem's last letters and how they are written instead, tried in order: `{ c: 'qu' }`, `{ c: 'ch', g: 'gh' }`. */
  readonly letters: Readonly<Record<string, string>>;
  /** The start of an ending that calls for the respelling (a front or a back vowel). */
  readonly before: RegExp;
  /** Whether this verb, and this stem, take it: an infinitive ending, a conjugation, a lexical flag, a stem exception. */
  readonly applies: (context: C, juncture: Juncture) => boolean;
  /** The step's params, as the rule declares them; none when absent. */
  readonly describe?: JunctureRule<C>['describe'];
}

/** The juncture rule of a respelling: the stem's last letters in `letters` become their value before `before`. */
export function consonantSpelling<C>({ info, letters, before, applies, describe }: ConsonantSpelling<C>): JunctureRule<C> {
  const endings = Object.keys(letters);
  return {
    info,
    apply(juncture, context) {
      const end = endings.find(letter => juncture.stem.endsWith(letter));
      if (end === undefined || !before.test(juncture.ending) || !applies(context, juncture)) return null;
      return one({ stem: juncture.stem.slice(0, -end.length) + letters[end]!, ending: juncture.ending });
    },
    ...(describe === undefined ? {} : { describe }),
  };
}
