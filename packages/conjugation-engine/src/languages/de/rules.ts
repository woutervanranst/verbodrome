import { defineRules } from '../../core/derivation.js';

/** Every rule the German pack records, by stage; the ids and params follow the German grammar design (GD §4). */
export const germanRules = defineRules({
  // Classification (GD §4.1).
  'de.classify.lexicon': { stage: 'classify', kind: 'lexical' },
  'de.classify.derivative': { stage: 'classify', params: { prefix: 'text', root: 'text' } },
  'de.classify.separable': { stage: 'classify', params: { particle: 'text' } },
  'de.classify.inseparable': { stage: 'classify', params: { prefix: 'text' } },
  'de.classify.assume-separable': { stage: 'classify', kind: 'assumption', params: { particle: 'text' } },
  'de.classify.denominal': { stage: 'classify', params: { prefix: 'text' } },
  'de.classify.not-derived': { stage: 'classify', params: { root: 'text' } },
  'de.classify.default-weak': { stage: 'classify', kind: 'assumption' },
  'de.classify.default-haben': { stage: 'classify', kind: 'assumption' },
  'de.classify.default-stress': { stage: 'classify', kind: 'assumption' },
  'de.classify.ieren': { stage: 'classify' },
  'de.classify.assume-root-auxiliary': { stage: 'classify', kind: 'assumption', params: { root: 'text' } },
  'de.classify.transliteration': { stage: 'classify', kind: 'assumption', params: { written: 'text', read: 'text' } },
  'de.classify.hint': { stage: 'classify', params: { hint: 'text', value: 'text' } },
});

export type GermanRuleId = keyof typeof germanRules;
