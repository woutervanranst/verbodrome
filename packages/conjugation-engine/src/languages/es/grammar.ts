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

function unavailable(rule: 'es.avail.impersonal' | 'es.avail.defective' | 'es.avail.no-imperative', reason: Unavailability['reason'], source: string): Unavailability {
  return { reason, step: step(rules[rule], null, null), source };
}

/** Why a target has no form for the lexeme (grammar design §4.8), or null. */
function availability(lexeme: SpanishLexeme, target: ResolvedTarget): Unavailability | null {
  const { entry } = lexeme;
  if (entry.noImperative && target.mood === 'imperative') return unavailable('es.avail.no-imperative', 'noImperative', 'https://www.rae.es/dpd/haber');
  if (entry.impersonal && target.person !== null) {
    // Weather verbs have only the él form (llueve); no command, and no usted that would share its person.
    const third = target.person === 3 && target.number === 'singular' && target.subject !== '2sg.formal';
    if (target.mood === 'imperative' || !third) return unavailable('es.avail.impersonal', 'impersonal', 'https://www.rae.es/dpd/llover');
  }
  if (entry.defective === 'soler' && solerGaps.has(`${target.mood}.${target.tense}`)) {
    return unavailable('es.avail.defective', 'defective', 'https://www.rae.es/dpd/soler');
  }
  return null;
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
