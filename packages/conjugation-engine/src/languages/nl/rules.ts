/**
 * Every rule the Dutch staged grammar records, keyed by id (`nl.<stage>.<name>`). Messages live in
 * `src/i18n/locales/{en,nl}/nl.ts`, citations in `sources.ts`. The four `default-*` rules and the two `assume-*` rules
 * are the assumptions made for a verb the lexicon does not know, and the four `avail` rules say why a form does not
 * exist; the English messages of the `default-*` and `avail` rules are the sentences the analysis and the unavailable
 * targets showed before the staged grammar.
 */
import { defineRules } from '../../core/derivation.js';

/** The text of the form an unavailable target names, `<mood>/<tense>`. */
const unavailable = { stage: 'availability', kind: 'unavailable', params: { form: 'text' } } as const;
/** The perfect auxiliary a compound tense uses. */
const withAuxiliary = { stage: 'periphrasis', params: { auxiliary: 'text' } } as const;

export const dutchRules = defineRules({
  // classify: {before} is the lemma, or the base verb of a derivative.
  // {after}: the listed past tense or past participle; {detail}: what the list records about a weak verb.
  'nl.classify.irregular': { stage: 'classify', kind: 'lexical' },
  'nl.classify.half-irregular': { stage: 'classify', kind: 'lexical' },
  'nl.classify.listed-weak': { stage: 'classify', kind: 'lexical', params: { detail: 'text' } },
  'nl.classify.loan': { stage: 'classify' },
  'nl.classify.separable': { stage: 'classify', params: { particle: 'text' } },
  'nl.classify.inseparable': { stage: 'classify', params: { prefix: 'text' } },
  'nl.classify.default-weak': { stage: 'classify', kind: 'assumption' },
  'nl.classify.default-syllables': { stage: 'classify', kind: 'assumption' },
  'nl.classify.default-hebben': { stage: 'classify', kind: 'assumption' },
  'nl.classify.default-unprefixed': { stage: 'classify', kind: 'assumption' },
  'nl.classify.assume-separable': { stage: 'classify', kind: 'assumption', params: { particle: 'text' } },
  'nl.classify.assume-inseparable': { stage: 'classify', kind: 'assumption', params: { prefix: 'text' } },
  // availability: {before} is the lemma.
  'nl.avail.impersonal': unavailable,
  'nl.avail.singular-only': unavailable,
  'nl.avail.no-imperative': unavailable,
  'nl.avail.no-compound': unavailable,
  // stem: {before} and {after} are the stem before and after the rule.
  'nl.stem.drop-en': { stage: 'stem' },
  'nl.stem.undouble-consonant': { stage: 'stem' },
  'nl.stem.lengthen-vowel': { stage: 'stem' },
  'nl.stem.unstressed-e': { stage: 'stem' },
  'nl.stem.devoice': { stage: 'stem' },
  'nl.stem.lexical': { stage: 'stem', kind: 'lexical' },
  // Whole forms the lexicon lists: {before} is the verb, {after} the form.
  'nl.cell.lexical': { stage: 'stem', kind: 'lexical' },
  'nl.cell.d-dropped': { stage: 'stem', kind: 'lexical' },
  'nl.cell.spoken-infinitive': { stage: 'stem', kind: 'lexical' },
  'nl.cell.formal': { stage: 'stem', kind: 'lexical' },
  // ending: {before} is the stem, {after} the word with its ending.
  'nl.end.present': { stage: 'ending', params: { ending: 'text', person: 'term', number: 'term' } },
  'nl.end.present-t-drop': { stage: 'ending' },
  'nl.end.inversion-t-drop': { stage: 'ending' },
  'nl.end.past-weak': { stage: 'ending', params: { ending: 'text' } },
  'nl.end.past-strong': { stage: 'ending', kind: 'lexical' },
  'nl.end.past-plural-strong': { stage: 'ending' },
  'nl.imp.stem': { stage: 'ending' },
  'nl.part.present': { stage: 'ending' },
  'nl.part.weak': { stage: 'ending', params: { ending: 'text' } },
  'nl.part.weak-no-ending': { stage: 'ending', params: { dental: 'text' } },
  'nl.part.strong': { stage: 'ending', kind: 'lexical' },
  'nl.part.ge-blocked': { stage: 'ending', params: { prefix: 'text' } },
  'nl.part.ge-prefix': { stage: 'orthography' },
  'nl.part.ge-diaeresis': { stage: 'orthography', params: { vowel: 'text' } },
  'nl.orth.dental-kofschip': { stage: 'orthography', params: { sound: 'text', dental: 'text' } },
  'nl.orth.dental-voiceless': { stage: 'orthography', params: { sound: 'text' } },
  'nl.orth.dental-given': { stage: 'orthography', params: { dental: 'text' } },
  'nl.orth.double-a': { stage: 'orthography' },
  // periphrasis
  'nl.periphrasis.perfect': withAuxiliary,
  'nl.periphrasis.pluperfect': withAuxiliary,
  'nl.periphrasis.future': { stage: 'periphrasis' },
  'nl.periphrasis.future-perfect': withAuxiliary,
  'nl.periphrasis.conditional': { stage: 'periphrasis' },
  'nl.periphrasis.conditional-perfect': withAuxiliary,
  // clause
  'nl.clause.subject': { stage: 'clause', params: { pronoun: 'text' } },
  'nl.clause.impersonal-subject': { stage: 'clause' },
  'nl.clause.inversion': { stage: 'clause', params: { pronoun: 'text' } },
  'nl.clause.reflexive': { stage: 'clause', params: { pronoun: 'text' } },
  'nl.clause.particle-final': { stage: 'clause', params: { particle: 'text' } },
  'nl.clause.particle-attached': { stage: 'clause', params: { particle: 'text' } },
  'nl.clause.prefix-attached': { stage: 'clause', params: { prefix: 'text' } },
});
