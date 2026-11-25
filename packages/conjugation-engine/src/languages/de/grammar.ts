import { step } from '../../core/derivation.js';
import { validateGrammar } from '../../core/staged.js';
import type { Cell, StagedGrammar, Unavailability } from '../../core/staged.js';
import type { ResolvedTarget } from '../../types.js';
import { classifyGerman, germanLexemeOf } from './classify.js';
import type { GermanLexeme } from './classify.js';
import { germanClause } from './clause.js';
import { germanOrthography } from './orthography.js';
import { germanEnding } from './paradigms.js';
import { germanPeriphrases } from './periphrasis.js';
import { germanRules as rules } from './rules.js';
import { germanCell, germanStem } from './stems.js';

export type { GermanLexeme } from './classify.js';

/** The one-word tenses: Präsens, Präteritum, Konjunktiv I and II and the imperative; every other finite tense is a compound. */
const simple = new Set(['indicative.present', 'indicative.past', 'subjunctive.present', 'subjunctive.past', 'imperative.present']);

/** The cell of a one-word target; null for a compound tense (built by a periphrasis). */
export function germanCellOf(target: ResolvedTarget): Cell | null {
  if (target.mood === 'infinitive') return target.tense === 'present' ? { kind: 'nonFinite', form: 'infinitive' } : null;
  if (target.mood === 'participle') return { kind: 'nonFinite', form: target.tense === 'present' ? 'presentParticiple' : 'pastParticiple' };
  if (target.person === null || target.number === null || !simple.has(`${target.mood}.${target.tense}`)) return null;
  return { kind: 'finite', mood: target.mood, tense: target.tense, person: target.person, number: target.number };
}

/**
 * The forms a verb does not have (GD §4.7): no imperative for the modal verbs, third-person-only and weather verbs;
 * only the third person for geschehen; only the es-form for weather verbs.
 */
export function germanAvailability(lexeme: GermanLexeme, target: ResolvedTarget): Unavailability | null {
  if (target.person === null) return null;
  const { flags } = lexeme;
  if (target.mood === 'imperative' && (flags.has('noImperative') || flags.has('thirdPersonOnly') || flags.has('impersonal'))) {
    return { reason: 'noImperative', step: step(rules['de.avail.no-imperative'], null, null), source: 'grammis, Systematische Grammatik: Modalverb; Duden, Konjugationstabelle' };
  }
  if (flags.has('thirdPersonOnly') && (target.person !== 3 || target.subject === '2.formal')) {
    return { reason: 'defective', step: step(rules['de.avail.third-person-only'], null, null), source: 'Duden, Konjugationstabelle geschehen' };
  }
  const esForm = target.person === 3 && target.number === 'singular' && (target.subject === undefined || target.subject === '3sg' || target.subject === '3sg.n');
  if (flags.has('impersonal') && !esForm) {
    return { reason: 'impersonal', step: step(rules['de.avail.impersonal'], null, null), source: 'Duden, Konjugationstabelle regnen (unpersönlich)' };
  }
  return null;
}

/** The German grammar: classification, then stems, endings and spelling rules, compound tenses and the main clause. */
export const germanGrammar: StagedGrammar<GermanLexeme> = {
  classify: classifyGerman,
  lexemeOf: germanLexemeOf,
  cellOf: germanCellOf,
  availability: germanAvailability,
  cell: germanCell,
  stem: germanStem,
  ending: germanEnding,
  orthography: germanOrthography,
  periphrases: germanPeriphrases,
  clause: germanClause,
};
validateGrammar(germanGrammar);
