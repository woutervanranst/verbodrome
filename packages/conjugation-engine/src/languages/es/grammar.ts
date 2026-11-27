import { step } from '../../core/derivation.js';
import type { Cell, StagedGrammar, Unavailability } from '../../core/staged.js';
import { deriveWords, validateGrammar } from '../../core/staged.js';
import type { ResolvedTarget } from '../../types.js';
import { classifySpanish, spanishLexemeOf } from './classify.js';
import type { SpanishLexeme } from './classify.js';
import { spanishClause } from './clause.js';
import { spanishOrthography } from './orthography.js';
import { spanishPeriphrases } from './periphrasis.js';
import { spanishRules as rules } from './rules.js';
import { endingFork, lexicalCell, stemFork } from './stems.js';

export type { SpanishLexeme } from './classify.js';

/** The tenses that are one word, by mood; every other finite tense is a periphrasis. */
const simpleTenses: Readonly<Record<string, readonly string[]>> = {
  indicative: ['present', 'imperfect', 'simple_past', 'future'],
  conditional: ['present'],
  subjunctive: ['present', 'imperfect', 'future'],
  imperative: ['present'],
};

/** soler's missing tenses (grammar design §5.6): the future and conditional, simple and compound, and the commands. */
const solerGaps: ReadonlySet<string> = new Set([
  'indicative.future', 'indicative.future_perfect', 'conditional.present', 'conditional.past',
  'imperative.present', 'imperative.negative', 'subjunctive.future', 'subjunctive.future_perfect',
]);

/** balbucir's missing forms: those with -zc- (the 1sg present, the present subjunctive and the commands built on it). */
function balbucirGap(target: ResolvedTarget): boolean {
  if (target.mood === 'indicative' && target.tense === 'present') return target.person === 1 && target.number === 'singular';
  if (target.mood === 'subjunctive' && target.tense === 'present') return true;
  if (target.mood === 'imperative') return target.tense === 'negative' || target.person !== 2;
  return false;
}

/** The forms of a verb used only where the ending begins with i (embaír): every root-stressed form is missing. */
function iEndingGap(target: ResolvedTarget): boolean {
  if (target.mood === 'indicative' && target.tense === 'present') return !(target.person !== 3 && target.number === 'plural');
  if (target.mood === 'subjunctive' && target.tense === 'present') return true;
  if (target.mood === 'imperative') return target.tense === 'negative' || !(target.person === 2 && target.number === 'plural');
  return false;
}

/** Why a target has no form for the lexeme (grammar design §4.8, NGLE §4.14), or null. */
function availability(lexeme: SpanishLexeme, target: ResolvedTarget): Unavailability | null {
  const { entry } = lexeme;
  if (entry.noImperative && target.mood === 'imperative') {
    return { reason: 'noImperative', step: step(rules['es.avail.no-imperative'], null, null), source: 'https://www.rae.es/dpd/haber' };
  }
  // Weather verbs have no subject: only the third person singular, without a pronoun (llueve); no command.
  if (entry.impersonal && target.person !== null && target.subject !== '3sg' && target.subject !== '3sg.f') {
    return { reason: 'impersonal', step: step(rules['es.avail.impersonal'], null, null), source: 'https://www.rae.es/dpd/llover' };
  }
  const defective = entry.defective;
  if (defective === undefined) return null;
  const gap = defective === 'soler' ? solerGaps.has(`${target.mood}.${target.tense}`)
    : defective === 'third-person' ? target.person !== null && (target.mood === 'imperative' || target.person !== 3 || target.subject?.endsWith('formal') === true)
      : defective === 'balbucir' ? balbucirGap(target) : iEndingGap(target);
  if (!gap) return null;
  const kind = defective === 'third-person' ? 'third' : defective === 'i-endings' ? 'iendings' : defective;
  const source = defective === 'i-endings' ? 'https://dle.rae.es/emba%C3%ADr' : `https://www.rae.es/dpd/${defective === 'third-person' ? 'concernir' : defective}`;
  return { reason: 'defective', step: step(rules['es.avail.defective'], null, null, { verb: lexeme.infinitive, kind }), source };
}

/** The Spanish staged grammar. */
export const spanishGrammar: StagedGrammar<SpanishLexeme> = {
  classify: classifySpanish,
  lexemeOf: spanishLexemeOf,
  cellOf(target): Cell | null {
    if (target.mood === 'infinitive') return target.tense === 'present' ? { kind: 'nonFinite', form: 'infinitive' } : null;
    if (target.mood === 'gerund') return target.tense === 'present' ? { kind: 'nonFinite', form: 'gerund' } : null;
    if (target.mood === 'participle') return { kind: 'nonFinite', form: 'participle' };
    if (target.person === null || target.number === null) return null;
    if (!(simpleTenses[target.mood]?.includes(target.tense) ?? false)) return null;
    return { kind: 'finite', mood: target.mood, tense: target.tense, person: target.person, number: target.number };
  },
  availability,
  cell: (lexeme, cell) => lexicalCell(lexeme, cell, other => deriveWords(spanishGrammar, lexeme, other)),
  stem: stemFork,
  ending: endingFork,
  orthography: spanishOrthography,
  periphrases: spanishPeriphrases,
  clause: spanishClause,
};
validateGrammar(spanishGrammar);
