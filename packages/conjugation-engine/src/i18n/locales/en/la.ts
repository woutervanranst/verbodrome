import type { latinRules } from '../../../languages/la/rules.js';

/** English messages of the Latin rules: one sentence each, written for a learner (GD §4). */
export const la = {
  'la.classify.lexicon': '{before} is in the lexicon: {parts}.',
  'la.classify.compound': '{before} is {prefix}- + {base}; compounds of {base} go {parts}.',
  'la.classify.conjugation': '{before} ends in -{ending}: {conjugation, select, first {first} second {second} third {third} thirdIo {third (-iō)} fourth {fourth} other {irregular}} conjugation.',
  'la.classify.io': 'The first person {after} ends in -iō: a third-conjugation verb in -iō, which keeps its i before a, o, u and long ē.',
  'la.classify.deponent': '{before} has a passive infinitive: the verb is deponent, with passive forms and active meaning.',
  'la.classify.semi-deponent': '{before} is semi-deponent: active forms in the present system, passive forms with active meaning in the perfect system.',
  'la.classify.assume-third': 'No macron marks the e of -ere, so the verb is taken to be of the third conjugation; write -ēre or give the first person in -eō for the second.',
  'la.classify.assume-second-deponent': 'No macron marks -eri, so the verb is taken to be a second-conjugation deponent (-ērī).',
  'la.classify.assume-consonant-stem': 'Without a first person in -iō the verb is not taken to be an -iō verb.',
  'la.classify.assume-quantity': 'The lengths of the stem vowels are not known: vowels written without a macron are left without one.',
  'la.classify.assume-passive': 'The verb is assumed to have a full passive, as a transitive verb does.',
  'la.classify.assume-compound': 'Compounds of {base} vary; {prefix}- + {base} is assumed to follow the listed compound form.',
  'la.classify.default-parts': 'Not in the lexicon: the regular {conjugation, select, first {first-conjugation} second {second-conjugation} fourth {fourth-conjugation} other {}} perfect and supine are assumed.',
  'la.classify.default-sigmatic': 'Not in the lexicon: an s-perfect is assumed, the commonest third-conjugation type for a stem in a stop consonant.',
  'la.classify.default-uo': 'Not in the lexicon: a verb in -uō is assumed to have the perfect -uī and the supine -ūtum.',
  'la.classify.default-sco': 'Not in the lexicon: an inceptive in -scō is assumed to drop -sc- and add -vī and -tum.',
  'la.classify.default-u': 'Not in the lexicon: a stem in l, m, n, r, s or x is assumed to have the perfect -uī and the supine -itum.',
} as const satisfies Record<keyof typeof latinRules, string>;
