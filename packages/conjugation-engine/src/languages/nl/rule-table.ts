/**
 * Every rule the Dutch staged grammar records, keyed by id (`nl.<stage>.<name>`). Messages live in
 * `src/i18n/locales/{en,nl}/nl.ts`, citations in `sources.ts`. The four `default-*` rules are the assumptions made for a
 * verb the lexicon does not know; their English messages are the sentences the analysis has always shown.
 */
import { defineRules } from '../../core/derivation.js';

export const dutchRules = defineRules({
  // classify: {before} is the lemma, or the base verb of a derivative.
  'nl.classify.lexicon': { stage: 'classify', kind: 'lexical' },
  'nl.classify.loan': { stage: 'classify' },
  'nl.classify.separable': { stage: 'classify', params: { particle: 'text' } },
  'nl.classify.inseparable': { stage: 'classify', params: { prefix: 'text' } },
  'nl.classify.default-weak': { stage: 'classify', kind: 'assumption' },
  'nl.classify.default-syllables': { stage: 'classify', kind: 'assumption' },
  'nl.classify.default-hebben': { stage: 'classify', kind: 'assumption' },
  'nl.classify.default-unprefixed': { stage: 'classify', kind: 'assumption' },
  // stem: {before} and {after} are the stem before and after the rule.
  'nl.stem.drop-en': { stage: 'stem' },
  'nl.stem.undouble-consonant': { stage: 'stem' },
  'nl.stem.lengthen-vowel': { stage: 'stem' },
  'nl.stem.unstressed-e': { stage: 'stem' },
  'nl.stem.devoice': { stage: 'stem' },
  'nl.stem.lexical': { stage: 'stem', kind: 'lexical' },
});
