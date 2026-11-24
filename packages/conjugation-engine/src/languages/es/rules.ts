import { defineRules } from '../../core/derivation.js';

/**
 * Every rule the Spanish pack records, by stage (grammar design §4). Ids are `es.<stage>.<name>`; each has an English
 * and a Dutch message (`src/i18n/locales/{en,nl}/es.ts`) and a citation (`sources.ts`).
 */
export const spanishRules = defineRules({
  // Classification (§4.1)
  'es.classify.conjugation': { stage: 'classify', params: { ending: 'text', model: 'text' } },
  'es.classify.reflexive': { stage: 'classify', params: { base: 'text' } },
  'es.classify.restore-accent': { stage: 'classify' },
  'es.classify.lexicon': { stage: 'classify', kind: 'lexical', params: { model: 'text' } },
  'es.classify.two-paradigms': { stage: 'classify', kind: 'lexical', params: { model: 'text' } },
  'es.classify.prefixed': { stage: 'classify', kind: 'lexical', params: { prefix: 'text', base: 'text' } },
  'es.classify.family': { stage: 'classify', params: { suffix: 'text', model: 'text' } },
  'es.classify.uar-stress': { stage: 'classify' },
  'es.classify.hint': { stage: 'classify', params: { hint: 'text' } },
  'es.classify.assume-regular': { stage: 'classify', kind: 'assumption' },
  'es.classify.assume-glide': { stage: 'classify', kind: 'assumption', params: { vowel: 'text' } },
  'es.classify.assume-diphthong': { stage: 'classify', kind: 'assumption', params: { vowels: 'text' } },
  'es.classify.assume-zc': { stage: 'classify', kind: 'assumption' },
});

export type SpanishRuleId = keyof typeof spanishRules;
