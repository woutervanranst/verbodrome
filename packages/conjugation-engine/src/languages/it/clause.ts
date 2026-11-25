import { wordPart } from '../../core/clause.js';
import type { ChainWord, ClauseGrammar } from '../../core/clause.js';
import { step } from '../../core/derivation.js';
import type { DerivationStep } from '../../core/derivation.js';
import { one } from '../../core/fork.js';
import { grammaticalPart } from '../../parts.js';
import type { ConjugationPart, PartFeatures } from '../../types.js';
import type { ItalianLexeme } from './lexicon.js';
import { italianRules as R } from './rules.js';

/** The mood, tense and verb form of a non-finite word, which its cell does not say. */
const nonFiniteFeatures: Readonly<Record<string, Partial<PartFeatures>>> = {
  infinitive: { mood: 'infinitive', tense: 'present', verbForm: 'infinitive' },
  gerund: { mood: 'gerund', tense: 'present', verbForm: 'gerund' },
  presentParticiple: { mood: 'participle', tense: 'present', verbForm: 'presentParticiple' },
  participle: { mood: 'participle', tense: 'past', verbForm: 'pastParticiple' },
};

const featuresOf = (word: ChainWord): Partial<PartFeatures> =>
  word.cell?.kind === 'nonFinite' ? nonFiniteFeatures[word.cell.form] ?? {} : {};

export const italianClause: ClauseGrammar<ItalianLexeme> = {
  agreements: () => one(null),
  /**
   * The subject pronoun of a finite form (none in the imperative, none for an impersonal verb), then the verbs in recipe
   * order; a negative imperative puts non first.
   */
  assemble(words, { lexeme, target, subject, rendering }) {
    const steps: DerivationStep[] = [];
    const verbs: ConjugationPart[] = words.map(word => wordPart(rendering, word, featuresOf(word)));
    const parts: ConjugationPart[] = [];
    if (subject !== null && subject.pronoun !== null && target.mood !== 'imperative' && !lexeme.impersonal) {
      const formal = subject.register === 'formal';
      steps.push(step(formal ? R['it.clause.formal-subject'] : R['it.clause.subject'], null, null, { pronoun: subject.pronoun }));
      parts.push(grammaticalPart(rendering, 'subject', subject.pronoun, null, {
        person: subject.person, number: subject.number, gender: subject.gender ?? null,
      }));
    }
    if (target.mood === 'imperative' && target.tense === 'negative') {
      const infinitive = words.some(word => word.cell?.kind === 'nonFinite');
      steps.push(step(infinitive ? R['it.clause.negative-infinitive'] : R['it.clause.negative'], null, null));
      parts.push(grammaticalPart(rendering, 'particle', 'non'));
    }
    return one([...parts, ...verbs], steps);
  },
};
