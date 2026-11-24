/**
 * English messages of the Dutch rules, one per rule id. A message may use the rule's params and {before} / {after}.
 * The four `default-*` assumptions are the exact sentences the Dutch analysis has always shown in English.
 */
import type { dutchRules } from '../../../languages/nl/rule-table.js';

export const dutch = {
  'nl.classify.lexicon': '{before} is in the list of verbs as a {after, select, strong {strong verb} mixed {mixed verb} other {weak verb}}.',
  'nl.classify.loan': '{before} is a verb from English: its stem keeps the English spelling.',
  'nl.classify.separable': '{before} is a separable verb: {particle} carries the stress and can stand apart from the verb.',
  'nl.classify.inseparable': '{before} starts with the unstressed prefix {prefix}-, which never splits off, so the past participle gets no ge-.',
  'nl.classify.default-weak': 'An unlisted Dutch verb defaults to the weak native model.',
  'nl.classify.default-syllables': 'Ordinary open/closed syllables are inferred; use a stem or stress hint when pronunciation differs.',
  'nl.classify.default-hebben': 'An unlisted verb defaults to hebben; lexical meaning may require zijn.',
  'nl.classify.default-unprefixed': 'Separability is not inferred by stripping an unknown written prefix.',
  'nl.stem.drop-en': 'Take -en off {before} to get the stem: {after}-.',
  'nl.stem.undouble-consonant': 'A word does not end in a double consonant, so {before}- becomes {after}-.',
  'nl.stem.lengthen-vowel': 'A long vowel in a closed syllable is written with two letters, so {before}- becomes {after}-.',
  'nl.stem.unstressed-e': 'The e in the last syllable of {before}- is unstressed, so it is not written double: the stem stays {after}-.',
  'nl.stem.devoice': 'At the end of a word, v and z are written f and s, so {before}- becomes {after}-.',
  'nl.stem.lexical': 'The stem of {before} is {after}-: learn it by heart, it does not follow from the rules.',
} as const satisfies Record<keyof typeof dutchRules, string>;
