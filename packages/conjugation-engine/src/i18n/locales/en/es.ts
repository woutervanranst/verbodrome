/**
 * The Spanish pack's explanation messages in English, for a learner: one sentence each, naming the forms through
 * `{before}` / `{after}` and the rule's params. An apostrophe directly before a placeholder is written `''`.
 */
import type { SpanishRuleId } from '../../../languages/es/rules.js';

export const es = {
  'es.classify.conjugation': '{before} ends in {ending}, so its regular model is {model}.',
  'es.classify.reflexive': '{before} is reflexive: the verb is {base}, and every form takes a reflexive pronoun (me, te, se, nos, os).',
  'es.classify.restore-accent': 'Infinitives in -eír and -oír always have an accent on the i, so {before} is written {after}.',
  'es.classify.lexicon': 'The dictionary lists {before}, which is conjugated like {model}.',
  'es.classify.two-paradigms': '{before} has two conjugations with different meanings; this one is conjugated like {model}.',
  'es.classify.prefixed': '{before} is {prefix} + {base}, so it has the same irregular forms as {base}.',
  'es.classify.family': 'Verbs ending in {suffix} share their irregular forms, so {before} is conjugated like {model}.',
  'es.classify.uar-stress': 'In -uar verbs like {before} the u is stressed on its own when the stem is stressed (actúo), but not after g or c (averiguo).',
  'es.classify.hint': 'The hint {hint} decides how {before} is conjugated.',
  'es.classify.assume-regular': '{before} is not in the dictionary, so it is taken to be regular, with no vowel change in the stem.',
  'es.classify.assume-glide': 'The {vowel} before -ar in {before} is taken to share a syllable with the next vowel, as in cambiar (cambio), not as in enviar (envío).',
  'es.classify.assume-diphthong': 'The vowels {vowels} in {before} are taken to form one syllable, as in causar (causo), not as in aislar (aíslo).',
  'es.classify.assume-zc': '{before} is taken to add a z before the c, as conocer does (conozco).',
} as const satisfies Record<SpanishRuleId, string>;
