/**
 * English explanations of the German rules, for a learner: one sentence each, naming the forms through {before},
 * {after} and the rule's params. An apostrophe directly before a placeholder is written twice.
 */
import type { germanRules } from '../../../languages/de/rules.js';

/** The class names `{after}` of `de.classify.lexicon` can be. */
const classes = 'weak {a weak verb} strong {a strong verb} mixed {a mixed verb} preteritePresent {a verb conjugated like the modal verbs} irregular {an irregular verb} other {a {after} verb}';

/** The particles that can also be unstressed prefixes. */
const dual = (text: string) => ['durch', 'hinter', 'über', 'um', 'unter', 'voll', 'wider', 'wieder'].map(particle => `${particle} {${text}}`).join(' ');

export const de = {
  'de.classify.lexicon': `{before} is listed in the lexicon as {after, select, ${classes}}.`,
  'de.classify.derivative': '{before} is {prefix} + {root}, so it takes the forms of {root}.',
  'de.classify.separable': '{particle}- is a separable particle: it is stressed and stands apart from the conjugated verb.',
  'de.classify.inseparable': '{prefix}- is an inseparable prefix here: it always stays on the verb.',
  'de.classify.assume-separable': `{particle, select, ${dual('Assuming {particle}- is stressed and separable, because the verb is not in the lexicon; unstressed, it would be an inseparable prefix.')} other {Assuming {particle}- is a separable particle, because the verb is not in the lexicon.}}`,
  'de.classify.denominal': 'A verb with {prefix}- before a separable particle is formed from a noun: it is weak and inseparable.',
  'de.classify.not-derived': '{before} is not formed from {root}: it is conjugated on its own.',
  'de.classify.default-weak': 'Assuming a weak verb, because the verb is not in the lexicon.',
  'de.classify.default-haben': 'Assuming the perfect is formed with haben.',
  'de.classify.default-stress': 'Assuming the stress is on the first syllable, so Partizip II takes ge-.',
  'de.classify.ieren': 'Verbs in -ieren are stressed on -ier-, so Partizip II has no ge-.',
  'de.classify.assume-root-auxiliary': 'Assuming {before} forms its perfect with the same auxiliary as {root}.',
  'de.classify.transliteration': 'Reading {written} as {read}: ss stands for ß, and ae, oe, ue for ä, ö, ü.',
  'de.classify.hint': 'As requested, {hint} is {value}.',
} as const satisfies Record<keyof typeof germanRules, string>;
