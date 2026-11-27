/**
 * The English clause (design §6): the subject pronoun of the slot before the verb chain, which stays in recipe order;
 * the imperative has no subject. Nothing agrees, and there are no clitics, particles or inversion.
 */
import { wordPart } from '../../core/clause.js';
import type { ChainWord, ClauseGrammar } from '../../core/clause.js';
import { step } from '../../core/derivation.js';
import { one } from '../../core/fork.js';
import { grammaticalPart } from '../../parts.js';
import type { PartFeatures } from '../../types.js';
import type { EnglishLexeme } from './classify.js';
import { englishRules } from './rules.js';

const rules = englishRules;

/** The mood, tense and verb form of a non-finite word: the plain form is the infinitive's, the participles the participle's. */
const nonFiniteFeatures: Readonly<Record<string, Partial<PartFeatures>>> = {
  plain: { mood: 'infinitive', tense: 'present', verbForm: 'infinitive' },
  presentParticiple: { mood: 'participle', tense: 'present', verbForm: 'presentParticiple' },
  pastParticiple: { mood: 'participle', tense: 'past', verbForm: 'pastParticiple' },
};

/** The features a word adds to those of its cell; every verb word of a progressive tense has the progressive aspect. */
function featuresOf(word: ChainWord, progressive: boolean): Partial<PartFeatures> {
  const own = word.cell?.kind === 'nonFinite' ? nonFiniteFeatures[word.cell.form] ?? {} : {};
  return progressive && word.cell !== null ? { ...own, aspect: 'progressive' } : own;
}

export const englishClause: ClauseGrammar<EnglishLexeme> = {
  agreements: () => one(null),
  assemble(words, { target, subject, rendering }) {
    const progressive = target.tense.endsWith('_progressive');
    const verbs = words.map(word => wordPart(rendering, word, featuresOf(word, progressive)));
    if (target.mood === 'imperative') return one(verbs, [step(rules['en.clause.imperative-subject'], null, null)]);
    if (subject === null || subject.pronoun === null) return one(verbs);
    const pronoun = grammaticalPart(rendering, 'subject', subject.pronoun, null, {
      person: subject.person, number: subject.number, gender: subject.gender ?? null,
    });
    return one([pronoun, ...verbs], [step(rules['en.clause.subject'], null, null, { pronoun: subject.pronoun })]);
  },
};
