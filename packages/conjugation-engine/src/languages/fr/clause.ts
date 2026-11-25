/**
 * The French clause (GD §6): the subject's gender form by form, the agreement of the past participle, and the order of
 * the words (que, the subject pronoun, the reflexive pronoun, the verbs, en).
 */
import { wordPart } from '../../core/clause.js';
import type { ChainWord, ClauseContext, ClauseGrammar } from '../../core/clause.js';
import { ConjugationError } from '../../errors.js';
import { step } from '../../core/derivation.js';
import type { DerivationStep } from '../../core/derivation.js';
import { one } from '../../core/fork.js';
import type { Fork } from '../../core/fork.js';
import type { Agreement, Gender, GrammaticalNumber } from '../../core/grammar.js';
import { grammaticalPart, itemAt } from '../../parts.js';
import type { ConjugationPart, PartFeatures, ResolvedTarget } from '../../types.js';
import type { FrenchConjugationOptions } from '../../types.js';
import type { FrenchLexeme } from './grammar.js';
import { frenchRules } from './rules.js';

const genders = ['masculine', 'feminine'] as const;
const numbers = ['singular', 'plural'] as const;
const reflexivePronouns = ['me', 'te', 'se', 'nous', 'vous', 'se'] as const;

/** A gender as a step param. */
const genderTerm = (gender: Gender) => ({ term: 'gender' as const, id: gender });

/** The features of a non-finite verb word, by its cell's form (the participles' gender and number come from the cell). */
const nonFiniteFeatures: Readonly<Record<string, Partial<PartFeatures>>> = {
  infinitive: { mood: 'infinitive', tense: 'present', verbForm: 'infinitive' },
  presentParticiple: { mood: 'participle', tense: 'present', verbForm: 'presentParticiple' },
  pastParticiple: { mood: 'participle', tense: 'past', verbForm: 'pastParticiple' },
};

/** Whether the subject of `target` is the neuter il of an impersonal verb: falloir, and pleuvoir in the singular. */
export function impersonalSubject(lexeme: FrenchLexeme, target: ResolvedTarget): boolean {
  const impersonal = lexeme.family?.flags.impersonal;
  return impersonal === 'singular' || (impersonal === 'figurativePlural' && target.number === 'singular');
}

/** The genders the query lets a form take: the `gender` option, else both. */
function genderOptions(query: Readonly<Record<string, unknown>>): readonly Gender[] {
  const { gender } = query as FrenchConjugationOptions;
  return gender ? [gender] : genders;
}

/** Whether the main verb's past participle never agrees (été, dormi, plu). */
const invariable = (lexeme: FrenchLexeme): boolean => lexeme.family?.flags.invariableParticiple === true;

/**
 * The subject genders a form shows (GD §6.3): none for an impersonal il; il/elle (ils/elles) in the third person, or
 * the gender the `gender` option names; none for je, tu, nous, vous in a simple tense.
 */
function subjectGenders({ query, lexeme, target }: ClauseContext<FrenchLexeme>): Fork<Gender | null> {
  if (target.person === null) return one(null);
  if (impersonalSubject(lexeme, target)) return one(null, [step(frenchRules['fr.clause.impersonal-subject'], null, null)]);
  if (target.person !== 3) return one(null);
  return genderOptions(query).flatMap(gender =>
    one(gender, [step(frenchRules['fr.clause.subject-gender'], null, null, { gender: genderTerm(gender) })]));
}

/**
 * The agreements of the past participle standing alone (GD §6.3, first row): none when it is invariable; masculine
 * singular for an impersonal verb; otherwise every gender and number the options allow, gender first.
 */
function agreements({ query, lexeme, target, agreeing }: ClauseContext<FrenchLexeme>): Fork<Agreement | null> {
  if (!agreeing.some(cell => cell.kind === 'nonFinite' && cell.form === 'pastParticiple')) return one(null);
  if (target.mood !== 'participle' || target.tense !== 'past') {
    throw new ConjugationError('GENERATION_FAILURE', 'fr.clause agreement in compound tenses not migrated yet');
  }
  if (invariable(lexeme)) return one(null, [step(frenchRules['fr.clause.invariable-participle'], null, null)]);
  const { agreement, gender } = query as FrenchConjugationOptions;
  const chosen = (allowed: Agreement) => one(allowed, [step(frenchRules['fr.clause.participle-forms'], null, null, {
    gender: genderTerm(allowed.gender), number: { term: 'number', id: allowed.number },
  })]);
  if (lexeme.family?.flags.impersonal) return chosen({ gender: 'masculine', number: 'singular' });
  const forGender: readonly Gender[] = agreement?.gender ? [agreement.gender] : gender ? [gender] : genders;
  const forNumber: readonly GrammaticalNumber[] = agreement?.number ? [agreement.number] : numbers;
  return forGender.flatMap(g => forNumber.flatMap(n => chosen({ gender: g, number: n })));
}

/** The reflexive pronoun of `target` (se without a person); in the affirmative imperative te becomes toi. */
function reflexivePronoun(target: ResolvedTarget, imperative: boolean): string {
  if (target.person === null || target.number === null) return 'se';
  if (imperative && target.person === 2 && target.number === 'singular') return 'toi';
  return itemAt(reflexivePronouns, (target.number === 'plural' ? 3 : 0) + target.person - 1);
}

/** The subject pronoun: the slot's, elle/elles for a feminine third person. */
function subjectPronoun(pronoun: string, target: ResolvedTarget): string {
  if (target.person !== 3 || target.gender !== 'feminine') return pronoun;
  return target.number === 'plural' ? 'elles' : 'elle';
}

/**
 * The words of a simple form in order (GD §6.2): [que] subject [reflexive] verb in a finite tense; the verb then the
 * reflexive pronoun, joined by a hyphen, in the imperative; [reflexive] infinitive; [reflexive] present participle;
 * the past participle alone; en [reflexive] present participle in the gerund.
 */
function assemble(words: readonly ChainWord[], { lexeme, target, subject, rendering }: ClauseContext<FrenchLexeme>): Fork<readonly ConjugationPart[]> {
  if (words.length !== 1 || words[0]!.role !== 'lexicalVerb') {
    throw new ConjugationError('GENERATION_FAILURE', 'fr.clause compound word order not migrated yet');
  }
  const word = words[0]!;
  const steps: DerivationStep[] = [];
  const onsetFlags = { aspiratedH: lexeme.aspiratedH };
  const features = word.cell?.kind === 'nonFinite' ? nonFiniteFeatures[word.cell.form] ?? {} : {};
  const verb = wordPart(rendering, word, features, { onsetFlags });
  const imperative = target.mood === 'imperative';
  const pastParticiple = target.mood === 'participle' && target.tense === 'past';
  const reflexive = lexeme.reflexive && !pastParticiple;
  const pronoun = reflexivePronoun(target, imperative);
  const clitic = reflexive
    ? [grammaticalPart(rendering, 'reflexivePronoun', pronoun, null, { person: target.person, number: target.number }, imperative ? 'hyphen' : 'space')]
    : [];
  if (reflexive) {
    steps.push(step(frenchRules[imperative ? 'fr.clause.reflexive-imperative' : 'fr.clause.reflexive-pronoun'], null, null, { pronoun }));
  }
  // The plural of a verb that is impersonal in the singular is figurative (ils pleuvent).
  const tags = lexeme.family?.flags.impersonal === 'figurativePlural' && target.number === 'plural' ? { condition: 'figurative' } : {};
  if (imperative) return one([verb, ...clitic], steps, tags);
  const before: ConjugationPart[] = [];
  if (target.mood === 'subjunctive') {
    before.push(grammaticalPart(rendering, 'moodMarker', 'que'));
    steps.unshift(step(frenchRules['fr.clause.que'], null, null));
  }
  if (target.person !== null && subject !== null && subject.pronoun !== null) {
    const text = subjectPronoun(subject.pronoun, target);
    before.push(grammaticalPart(rendering, 'subject', text, null, { person: target.person, number: target.number, gender: target.gender }));
    steps.splice(target.mood === 'subjunctive' ? 1 : 0, 0, step(frenchRules['fr.clause.subject'], null, null, { pronoun: text }));
  }
  if (target.mood === 'gerund') {
    before.push(grammaticalPart(rendering, 'moodMarker', 'en'));
    steps.unshift(step(frenchRules['fr.clause.gerund-en'], null, null));
  }
  return one([...before, ...clitic, verb], steps, tags);
}

export const frenchClause: ClauseGrammar<FrenchLexeme> = { subjectGenders, agreements, assemble };
