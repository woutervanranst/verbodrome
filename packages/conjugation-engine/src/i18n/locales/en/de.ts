/**
 * English explanations of the German rules, for a learner: one sentence each, naming the forms through {before},
 * {after} and the rule's params. An apostrophe directly before a placeholder is written twice.
 */
import type { germanRules } from '../../../languages/de/rules.js';

/** The class names `{after}` of `de.classify.lexicon` can be. */
const classes = 'weak {a weak verb} strong {a strong verb} mixed {a mixed verb} preteritePresent {a verb conjugated like the modal verbs} irregular {an irregular verb} other {a {after} verb}';

/** The particles that can also be unstressed prefixes. */
const dual = (text: string) => ['durch', 'hinter', 'über', 'um', 'unter', 'voll', 'wider', 'wieder'].map(particle => `${particle} {${text}}`).join(' ');

/** The names of the paradigms of a verb with several (the title of each paradigm's explanation). */
const labels = {
  'de.label.pattern.separable': 'separable particle',
  'de.label.pattern.inseparable': 'inseparable prefix',
  'de.label.pattern.weak': 'weak conjugation',
  'de.label.pattern.strong': 'strong conjugation',
  'de.label.pattern.mixed': 'mixed conjugation',
} as const;

export const de = {
  ...labels,
  'de.classify.lexicon': `{before} is listed in the lexicon as {after, select, ${classes}}.`,
  'de.classify.derivative': '{before} is {prefix} + {root}, so it takes the forms of {root}.',
  'de.classify.separable': '{particle}- is a separable particle: it is stressed and stands apart from the conjugated verb.',
  'de.classify.inseparable': '{prefix}- is an inseparable prefix here: it always stays on the verb.',
  'de.classify.assume-separable': `{particle, select, ${dual('Assuming {particle}- is stressed and separable, because the verb is not in the lexicon; unstressed, it would be an inseparable prefix; the option inseparablePrefix overrides this.')} other {Assuming {particle}- is a separable particle, because the verb is not in the lexicon; the option inseparablePrefix overrides this.}}`,
  'de.classify.denominal': 'A verb with {prefix}- before a separable particle is formed from a noun: it is weak and inseparable.',
  'de.classify.not-derived': '{before} is not formed from {root}: it is conjugated on its own.',
  'de.classify.default-weak': 'Assuming a weak verb, because the verb is not in the lexicon; the option classHint (with stems) overrides this.',
  'de.classify.default-haben': 'Assuming the perfect is formed with haben; the option auxiliary overrides this.',
  'de.classify.default-stress': 'Assuming the stress is on the first syllable, so Partizip II takes ge-; the option stems.unstressedFirstSyllable overrides this.',
  'de.classify.ieren': 'Verbs in -ieren are stressed on -ier-, so Partizip II has no ge-.',
  'de.classify.assume-root-auxiliary': 'Assuming {before} forms its perfect with the same auxiliary as {root}; the option auxiliary overrides this.',
  'de.classify.transliteration': 'Reading {written} as {read}: ss stands for ß, and ae, oe, ue for ä, ö, ü (no option overrides this: type ß or the umlaut).',
  'de.classify.hint': 'As requested, {hint} is {value}.',
  'de.classify.duden-only': '{before} is checked in Duden only: DWDS has no table for it.',
  'de.classify.assume-prefix-haben': 'Assuming {before} forms its perfect with haben, as most verbs with an inseparable prefix do; the option auxiliary overrides this.',
  'de.classify.unseparated': '{particle}- is stressed but stays on the verb in this reading.',
  // Stems.
  'de.stem.present': 'Drop the infinitive ending of {before}: the stem is {after}-.',
  'de.stem.present2': 'Strong verbs change their vowel in the du and er forms: {before}- becomes {after}-.',
  'de.stem.present-singular': 'This verb has its own stem in the singular of the Präsens: {before}- becomes {after}-.',
  'de.stem.preterite': 'The Präteritum stem of {before} is {after}-.',
  'de.stem.subjunctive-umlaut': 'Konjunktiv II: the Präteritum stem with Umlaut, {before}- becomes {after}-.',
  'de.stem.subjunctive-plain': 'Konjunktiv II keeps the Präteritum stem {after}-: it has no a, o or u to take an Umlaut.',
  'de.stem.subjunctive-lexical': 'The Konjunktiv II stem of {before} is {after}-.',
  'de.stem.subjunctive-weak': 'Konjunktiv II of a weak Präteritum is the same as the Präteritum, on the stem {after}-.',
  'de.stem.imperative-i': 'Verbs whose du and er forms change the vowel to i or ie keep {after}- in the du-imperative, without -e.',
  'de.stem.participle': 'The Partizip II stem of {before} is {after}-.',
  'de.stem.ge-prefix': 'Partizip II takes ge- because the first syllable is stressed: {after}-.',
  'de.stem.ge-after-particle': 'Partizip II takes ge- before the stem, behind the particle {particle}-: {after}-.',
  'de.stem.ge-blocked-prefix': 'No ge-: the verb starts with the unstressed prefix {prefix}-.',
  'de.stem.ge-blocked-stress': 'No ge-: the first syllable of the verb is not stressed.',
  'de.stem.duden-only': 'Only Duden prints the form {after}, DWDS does not: a less common form.',
  'de.stem.lexical-cell': '{before} is irregular here: the whole form is {after}.',
  // Endings.
  'de.end.present': 'Präsens, {person} {number}: add -{ending}.',
  'de.end.preterite-present': '{ending, select, st {Modal verbs and wissen add -st in the du-form of the Präsens.} other {Modal verbs and wissen have no ending in the ich and er forms of the Präsens.}}',
  'de.end.preterite-weak': 'Weak Präteritum: add -{ending}, that is -te and the personal ending.',
  'de.end.preterite-strong': '{ending, select, en {Strong Präteritum: add -en.} t {Strong Präteritum: add -t.} st {Strong Präteritum: add -st.} other {Strong Präteritum: the ich and er forms have no ending.}}',
  'de.end.preterite-2sg': 'The du-form of the strong Präteritum after {before}- has two endings, -est and -st: {after}.',
  'de.end.subjunctive-i': 'Konjunktiv I: the stem of the infinitive plus -{ending}.',
  'de.end.subjunctive-ii': 'Konjunktiv II: add -{ending} to the Konjunktiv II stem.',
  'de.end.subjunctive-ii-short': 'In the du and ihr forms of Konjunktiv II the e of the ending may be dropped: {after}.',
  'de.end.imperative-singular': '{ending, select, e {du-imperative: the stem plus -e.} other {du-imperative: the stem without an ending.}}',
  'de.end.imperative-plural': 'ihr-imperative: the ihr-form of the Präsens without the pronoun.',
  'de.end.imperative-polite': 'wir- and Sie-imperative: the plural form of the Präsens, followed by the pronoun.',
  'de.end.infinitive': 'The infinitive is the stem plus -en (-n after -el, -er and a vowel).',
  'de.end.participle-weak': 'A weak Partizip II ends in -t.',
  'de.end.participle-strong': 'A strong Partizip II ends in -en (-n after a vowel).',
  'de.end.present-participle': 'Partizip I: the stem of the infinitive plus -end.',
  // Spelling.
  'de.orth.ie-contraction': 'After -ie the e of the ending is dropped: {before} becomes {after}.',
  'de.orth.el-er-schwa': 'After unstressed -el or -er one e is dropped, from the ending or (with -el) from the stem: {before} becomes {after}.',
  'de.orth.el-elision': 'Before the ending -e the e of -el or -er may be dropped: {before} becomes {after}.',
  'de.orth.schwa-dental': 'After d or t an e is inserted before the ending: {before} becomes {after}.',
  'de.orth.schwa-nasal': 'After a consonant followed by m or n an e is inserted before the ending: {before} becomes {after}.',
  'de.orth.t-merge': 'A changed stem that ends in t takes no second t in the er-form: {before} becomes {after}.',
  'de.orth.sibilant-2sg': 'After s, ß, z or x the du-ending -st loses its s: {before} becomes {after}.',
  // Compound tenses.
  'de.periphrasis.perfect': 'Perfekt: the Präsens of {auxiliary} plus Partizip II.',
  'de.periphrasis.pluperfect': 'Plusquamperfekt: the Präteritum of {auxiliary} plus Partizip II.',
  'de.periphrasis.future': 'Futur I: the Präsens of werden plus the infinitive.',
  'de.periphrasis.future-perfect': 'Futur II: the Präsens of werden, Partizip II and the infinitive {auxiliary}.',
  'de.periphrasis.subjunctive-perfect': 'Konjunktiv I Perfekt: the Konjunktiv I of {auxiliary} plus Partizip II.',
  'de.periphrasis.subjunctive-pluperfect': 'Konjunktiv II Plusquamperfekt: the Konjunktiv II of {auxiliary} plus Partizip II.',
  'de.periphrasis.subjunctive-future': 'Konjunktiv I Futur I: the Konjunktiv I of werden plus the infinitive.',
  'de.periphrasis.subjunctive-future-perfect': 'Konjunktiv I Futur II: the Konjunktiv I of werden, Partizip II and the infinitive {auxiliary}.',
  'de.periphrasis.conditional': 'würde-form: the Konjunktiv II of werden (würde) plus the infinitive.',
  'de.periphrasis.conditional-perfect': 'würde-form of the past: the Konjunktiv II of werden (würde), Partizip II and the infinitive {auxiliary}.',
  'de.periphrasis.infinitive-perfect': 'Infinitiv Perfekt: Partizip II plus the infinitive {auxiliary}.',
  // The main clause.
  'de.clause.subject': 'Main clause: the subject, then the conjugated verb; the other verb forms go to the end.',
  'de.clause.particle-final': 'The separable particle {particle} goes to the end of the clause.',
  'de.clause.particle-attached': 'The particle {particle} is written together with {before}: {after}.',
  'de.clause.imperative-pronoun': 'In this imperative the pronoun {pronoun} follows the verb and cannot be left out.',
  'de.clause.duden-only': 'Only Duden prints this auxiliary here, DWDS does not.',
  'de.clause.impersonal-es': 'Weather verbs have es as their subject: {before} becomes {after}.',
  // Missing forms.
  'de.avail.third-person-only': 'This verb is only used in the third person.',
  'de.avail.no-imperative': 'This verb has no imperative.',
  'de.avail.impersonal': 'Weather verbs have only the es-form.',
} as const satisfies Record<keyof typeof germanRules | keyof typeof labels, string>;
