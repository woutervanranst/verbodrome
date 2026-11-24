/**
 * The English pack's explanation messages in English, for a learner of English. Exported as `english`, not `en`: `en`
 * is the English locale catalog's own name.
 */
import type { englishRules } from '../../../languages/en/rules.js';

export const english = {
  'en.classify.lexicon': '{before} is an irregular verb: past {past}, past participle {participle}.',
  'en.classify.suppletive': '{before} is completely irregular: its forms are listed one by one.',
  'en.classify.homograph': 'This paradigm of {before} means "{meaning}".',
  'en.classify.prefixed': '{before} is {prefix}- + {base}, so it has the irregular forms of {base}.',
  'en.classify.no-inherit': '{before} looks like {prefix}- + {base} but is a regular verb.',
  'en.classify.assume-regular': 'Assuming {before} is regular (-ed): it is not in the list of irregular verbs.',
  'en.classify.hint-regular': 'You asked for the regular forms of {before}.',
  'en.classify.hint-irregular': 'You gave the past {past} and the past participle {participle} of {before}.',
  'en.classify.stress-listed': '{before} is stressed on {stress, select, final {its last syllable} other {an earlier syllable}}.',
  'en.classify.stress-hint': 'You said {before} is stressed on {stress, select, final {its last syllable} other {an earlier syllable}}.',
  'en.classify.assume-final-stress': 'Assuming the last syllable of {before} is stressed: it looks like the prefix {prefix}- plus a one-syllable root.',
  'en.classify.assume-nonfinal-stress': 'Assuming the last syllable of {before} is not stressed: spelling does not show stress.',
  'en.classify.keeps-e': '{before} keeps its final e before -ing.',
  'en.classify.doubles-unstressed': '{before} doubles its last consonant although its last syllable is not stressed.',
  'en.classify.l-not-doubled': '{before} never doubles its final l.',
  'en.classify.plain-s': '{before} takes only -s in the 3rd person singular.',
} as const satisfies Record<keyof typeof englishRules, string>;
