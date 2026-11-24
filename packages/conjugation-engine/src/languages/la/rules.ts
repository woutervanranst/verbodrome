import { defineRules } from '../../core/derivation.js';

/** Every rule the Latin pack records (GD §4); ids `la.<stage>.<name>`. */
export const latinRules = defineRules({
  // Classification (GD §4.1)
  'la.classify.lexicon': { stage: 'classify', kind: 'lexical', params: { parts: 'text' } },
  'la.classify.compound': { stage: 'classify', params: { prefix: 'text', base: 'text', parts: 'text' } },
  'la.classify.conjugation': { stage: 'classify', params: { ending: 'text', conjugation: 'text' } },
  'la.classify.io': { stage: 'classify' },
  'la.classify.deponent': { stage: 'classify' },
  'la.classify.semi-deponent': { stage: 'classify', kind: 'lexical' },
  'la.classify.assume-third': { stage: 'classify', kind: 'assumption' },
  'la.classify.assume-second-deponent': { stage: 'classify', kind: 'assumption' },
  'la.classify.assume-consonant-stem': { stage: 'classify', kind: 'assumption' },
  'la.classify.assume-quantity': { stage: 'classify', kind: 'assumption' },
  'la.classify.assume-passive': { stage: 'classify', kind: 'assumption' },
  'la.classify.assume-compound': { stage: 'classify', kind: 'assumption', params: { prefix: 'text', base: 'text' } },
  'la.classify.default-parts': { stage: 'classify', kind: 'assumption', params: { conjugation: 'text' } },
  'la.classify.default-sigmatic': { stage: 'classify', kind: 'assumption' },
  'la.classify.default-uo': { stage: 'classify', kind: 'assumption' },
  'la.classify.default-sco': { stage: 'classify', kind: 'assumption' },
  'la.classify.default-u': { stage: 'classify', kind: 'assumption' },
});
