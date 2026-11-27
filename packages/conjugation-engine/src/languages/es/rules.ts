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
  'es.classify.eir': { stage: 'classify' },
  'es.classify.both-stress': { stage: 'classify', kind: 'lexical', params: { diphthong: 'text', hiatus: 'text' } },
  'es.classify.regional-variant': { stage: 'classify', kind: 'lexical', params: { region: 'text' } },
  'es.classify.oir': { stage: 'classify' },
  'es.classify.uar-stress': { stage: 'classify' },
  'es.classify.hint': { stage: 'classify', params: { hint: 'text' } },
  'es.classify.assume-regular': { stage: 'classify', kind: 'assumption' },
  'es.classify.assume-glide': { stage: 'classify', kind: 'assumption', params: { vowel: 'text' } },
  'es.classify.assume-diphthong': { stage: 'classify', kind: 'assumption', params: { vowels: 'text' } },
  'es.classify.assume-zc': { stage: 'classify', kind: 'assumption' },

  // Stems and whole-word lexical cells (§4.2)
  'es.stem.root': { stage: 'stem', params: { ending: 'text', empty: 'text' } },
  'es.stem.diphthong': { stage: 'stem', params: { from: 'text', to: 'text' } },
  'es.stem.e-i': { stage: 'stem' },
  'es.stem.raising': { stage: 'stem', params: { from: 'text', to: 'text' } },
  'es.stem.present-1sg': { stage: 'stem', kind: 'lexical', params: { stem: 'text' } },
  'es.stem.subjunctive-from-1sg': { stage: 'stem', params: { stem: 'text' } },
  'es.stem.zc': { stage: 'stem' },
  'es.stem.y-insertion': { stage: 'stem' },
  'es.stem.strong-preterite': { stage: 'stem', kind: 'lexical', params: { stem: 'text' } },
  'es.stem.ducir-preterite': { stage: 'stem' },
  'es.stem.future-infinitive': { stage: 'stem' },
  'es.stem.future-lexical': { stage: 'stem', kind: 'lexical', params: { stem: 'text' } },
  'es.stem.preterite-3pl': { stage: 'stem', params: { base: 'text' } },
  'es.stem.lexical': { stage: 'stem', kind: 'lexical', params: { stem: 'text' } },
  'es.cell.lexical': { stage: 'stem', kind: 'lexical', params: { form: 'text' } },
  'es.cell.imperative-short': { stage: 'stem', kind: 'lexical', params: { form: 'text' } },
  'es.cell.participle': { stage: 'stem', kind: 'lexical', params: { form: 'text' } },
  'es.cell.gerund': { stage: 'stem', kind: 'lexical', params: { form: 'text' } },
  'es.cell.infinitive-variant': { stage: 'stem', kind: 'lexical', params: { form: 'text' } },

  // Endings (§4.3)
  'es.end.present': { stage: 'ending', params: { ending: 'text' } },
  'es.end.imperfect': { stage: 'ending', params: { ending: 'text' } },
  'es.end.preterite': { stage: 'ending', params: { ending: 'text' } },
  'es.end.preterite-strong': { stage: 'ending', params: { ending: 'text' } },
  'es.end.future': { stage: 'ending', params: { ending: 'text' } },
  'es.end.conditional': { stage: 'ending', params: { ending: 'text' } },
  'es.end.subjunctive-present': { stage: 'ending', params: { ending: 'text' } },
  'es.end.subjunctive-imperfect': { stage: 'ending', params: { ending: 'text' } },
  'es.end.subjunctive-future': { stage: 'ending', params: { ending: 'text' } },
  'es.end.imperative-tu': { stage: 'ending' },
  'es.end.imperative-vosotros': { stage: 'ending' },
  'es.end.imperative-subjunctive': { stage: 'ending' },
  'es.end.infinitive': { stage: 'ending' },
  'es.end.gerund': { stage: 'ending', params: { ending: 'text' } },
  'es.end.participle': { stage: 'ending', params: { ending: 'text' } },

  // Spelling and the written accent (§4.4, §4.5)
  'es.orth.c-qu': { stage: 'orthography', params: { vowel: 'text' } },
  'es.orth.g-gu': { stage: 'orthography', params: { vowel: 'text' } },
  'es.orth.gu-diaeresis': { stage: 'orthography', params: { vowel: 'text' } },
  'es.orth.z-c': { stage: 'orthography', params: { vowel: 'text' } },
  'es.orth.c-z': { stage: 'orthography', params: { vowel: 'text' } },
  'es.orth.g-j': { stage: 'orthography', params: { vowel: 'text' } },
  'es.orth.gu-g': { stage: 'orthography', params: { vowel: 'text' } },
  'es.orth.qu-c': { stage: 'orthography', params: { vowel: 'text' } },
  'es.orth.u-diaeresis-y': { stage: 'orthography' },
  'es.orth.i-y': { stage: 'orthography' },
  'es.orth.i-absorbed': { stage: 'orthography', params: { letter: 'text' } },
  'es.orth.initial-diphthong': { stage: 'orthography' },
  'es.orth.g-diphthong': { stage: 'orthography' },
  'es.orth.accent-hiatus': { stage: 'orthography' },
  'es.orth.both-stress': { stage: 'orthography', params: { reading: 'text' } },
  'es.orth.accent-general': { stage: 'orthography', params: { stress: 'text' } },
  'es.orth.monosyllable': { stage: 'orthography' },
  'es.orth.diacritic': { stage: 'orthography', params: { word: 'text' } },

  // Compound tenses and the negative imperative (§4.6)
  'es.periphrasis.perfect': { stage: 'periphrasis', params: { auxiliary: 'text' } },
  'es.periphrasis.pluperfect': { stage: 'periphrasis', params: { auxiliary: 'text' } },
  'es.periphrasis.past-anterior': { stage: 'periphrasis', params: { auxiliary: 'text' } },
  'es.periphrasis.future-perfect': { stage: 'periphrasis', params: { auxiliary: 'text' } },
  'es.periphrasis.conditional-perfect': { stage: 'periphrasis', params: { auxiliary: 'text' } },
  'es.periphrasis.subjunctive-perfect': { stage: 'periphrasis', params: { auxiliary: 'text' } },
  'es.periphrasis.subjunctive-pluperfect': { stage: 'periphrasis', params: { auxiliary: 'text' } },
  'es.periphrasis.subjunctive-future-perfect': { stage: 'periphrasis', params: { auxiliary: 'text' } },
  'es.periphrasis.infinitive-perfect': { stage: 'periphrasis', params: { auxiliary: 'text' } },
  'es.periphrasis.gerund-perfect': { stage: 'periphrasis', params: { auxiliary: 'text' } },
  'es.periphrasis.negative-imperative': { stage: 'periphrasis' },

  // Clause (§4.7)
  'es.clause.subject': { stage: 'clause', params: { pronoun: 'text' } },
  'es.clause.que': { stage: 'clause' },
  'es.clause.proclitic': { stage: 'clause', params: { pronoun: 'text' } },
  'es.clause.enclitic': { stage: 'clause', params: { pronoun: 'text' } },
  'es.clause.enclitic-d-drop': { stage: 'clause' },
  'es.clause.enclitic-s-drop': { stage: 'clause' },
  'es.clause.enclitic-accent': { stage: 'clause', params: { stress: 'text' } },
  'es.clause.iros': { stage: 'clause' },

  // Availability (§4.8)
  'es.avail.impersonal': { stage: 'availability', kind: 'unavailable' },
  'es.avail.defective': { stage: 'availability', kind: 'unavailable', params: { verb: 'text', kind: 'text' } },
  'es.avail.no-imperative': { stage: 'availability', kind: 'unavailable' },
});

export type SpanishRuleId = keyof typeof spanishRules;
