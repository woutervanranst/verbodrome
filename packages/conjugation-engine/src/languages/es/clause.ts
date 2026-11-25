/**
 * The Spanish clause (grammar design §6): que before a subjunctive form, the subject pronoun before a finite verb that
 * is not a command, then the verb chain. Participles after haber do not agree.
 */
import { wordPart } from '../../core/clause.js';
import type { ChainWord, ClauseGrammar } from '../../core/clause.js';
import { step } from '../../core/derivation.js';
import type { DerivationStep } from '../../core/derivation.js';
import { one } from '../../core/fork.js';
import { grammaticalPart } from '../../parts.js';
import type { ConjugationPart, PartFeatures } from '../../types.js';
import type { SpanishLexeme } from './classify.js';
import { spanishRules as rules } from './rules.js';

/** The mood, tense and verb form a non-finite word's part carries. */
const nonFiniteFeatures: Readonly<Record<string, Partial<PartFeatures>>> = {
  infinitive: { mood: 'infinitive', tense: 'present', verbForm: 'infinitive' },
  gerund: { mood: 'gerund', tense: 'present', verbForm: 'gerund' },
  participle: { mood: 'participle', tense: 'past', verbForm: 'pastParticiple' },
  'compound-participle': { mood: 'participle', tense: 'past', verbForm: 'pastParticiple' },
};

export function featuresOf(word: ChainWord): Partial<PartFeatures> {
  return word.cell?.kind === 'nonFinite' ? nonFiniteFeatures[word.cell.form] ?? {} : {};
}

export const spanishClause: ClauseGrammar<SpanishLexeme> = {
  agreements: () => one(null),
  assemble(words, { target, subject, rendering }) {
    const parts: ConjugationPart[] = [];
    const steps: DerivationStep[] = [];
    if (target.mood === 'subjunctive') {
      parts.push(grammaticalPart(rendering, 'moodMarker', 'que'));
      steps.push(step(rules['es.clause.que'], null, null));
    }
    if (subject !== null && subject.pronoun !== null && target.mood !== 'imperative') {
      parts.push(grammaticalPart(rendering, 'subject', subject.pronoun, null, { person: subject.person, number: subject.number, gender: subject.gender ?? null }));
      steps.push(step(rules['es.clause.subject'], null, null, { pronoun: subject.pronoun }));
    }
    parts.push(...words.map(word => wordPart(rendering, word, featuresOf(word))));
    return one(parts, steps);
  },
};
