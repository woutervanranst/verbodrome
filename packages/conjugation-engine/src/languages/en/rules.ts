import { defineRules } from '../../core/derivation.js';

/** Every rule the English pack records (design §4). */
export const englishRules = defineRules({
  // classify (design §4.1)
  'en.classify.lexicon': { stage: 'classify', kind: 'lexical', params: { past: 'text', participle: 'text' } },
  'en.classify.suppletive': { stage: 'classify', kind: 'lexical' },
  'en.classify.homograph': { stage: 'classify', kind: 'lexical', params: { meaning: 'text' } },
  'en.classify.prefixed': { stage: 'classify', params: { prefix: 'text', base: 'text' } },
  'en.classify.no-inherit': { stage: 'classify', kind: 'lexical', params: { prefix: 'text', base: 'text' } },
  'en.classify.assume-regular': { stage: 'classify', kind: 'assumption' },
  'en.classify.hint-regular': { stage: 'classify' },
  'en.classify.hint-irregular': { stage: 'classify', params: { past: 'text', participle: 'text' } },
  'en.classify.stress-listed': { stage: 'classify', kind: 'lexical', params: { stress: 'text' } },
  'en.classify.stress-hint': { stage: 'classify', params: { stress: 'text' } },
  'en.classify.assume-final-stress': { stage: 'classify', kind: 'assumption', params: { prefix: 'text' } },
  'en.classify.assume-nonfinal-stress': { stage: 'classify', kind: 'assumption' },
  'en.classify.keeps-e': { stage: 'classify', kind: 'lexical' },
  'en.classify.doubles-unstressed': { stage: 'classify', kind: 'lexical' },
  'en.classify.l-not-doubled': { stage: 'classify', kind: 'lexical' },
  'en.classify.plain-s': { stage: 'classify', kind: 'lexical' },
});
