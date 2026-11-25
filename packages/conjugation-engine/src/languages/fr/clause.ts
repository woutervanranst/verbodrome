/**
 * The French clause (GD §6): the subject's gender form by form, the agreement of the past participle, and the order of
 * the words (que, the subject pronoun, the reflexive pronoun, the verbs, en).
 */
import { wordPart } from '../../core/clause.js';
import type { ChainWord, ClauseContext, ClauseGrammar } from '../../core/clause.js';
import { step } from '../../core/derivation.js';
import type { DerivationStep } from '../../core/derivation.js';
import { one } from '../../core/fork.js';
import type { Fork } from '../../core/fork.js';
import type { Agreement, Gender, GrammaticalNumber } from '../../core/grammar.js';
import { grammaticalPart, itemAt } from '../../parts.js';
import type { ConjugationPart, PartFeatures, ResolvedTarget } from '../../types.js';
import type { FrenchConjugationOptions } from '../../types.js';
import type { FrenchLexeme } from './grammar.js';
import { isCompound } from './availability.js';
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

/** Whether the past participle of this construction agrees with the subject (GD §6.3): with être, unless it never agrees or the reflexive pronoun is not its direct object. */
function agreesWithSubject({ query, lexeme, auxiliary }: ClauseContext<FrenchLexeme>): boolean {
  const { precedingDirectObject } = query as FrenchConjugationOptions;
  return auxiliary === 'être' && !invariable(lexeme) && !(lexeme.reflexive && (lexeme.indirect || precedingDirectObject !== undefined));
}

/**
 * The subject genders a form shows (GD §6.3): none for an impersonal il; il/elle (ils/elles) in the third person, and
 * je, tu, nous, vous in a compound tense whose participle agrees with the subject, both or the one the `gender` option
 * names; none otherwise.
 */
function subjectGenders(context: ClauseContext<FrenchLexeme>): Fork<Gender | null> {
  const { query, lexeme, target } = context;
  if (target.person === null) return one(null);
  if (impersonalSubject(lexeme, target)) return one(null, [step(frenchRules['fr.clause.impersonal-subject'], null, null)]);
  if (target.person !== 3 && !(isCompound(target) && agreesWithSubject(context))) return one(null);
  return genderOptions(query).flatMap(gender =>
    one(gender, [step(frenchRules['fr.clause.subject-gender'], null, null, { gender: genderTerm(gender) })]));
}

const masculineSingular: Agreement = { gender: 'masculine', number: 'singular' };

/**
 * The agreements of the past participle (GD §6.3). Standing alone: none when it is invariable, masculine singular for
 * an impersonal verb, otherwise every gender and number the options allow, gender first. In a compound tense: none when
 * invariable; a preceding direct object with avoir or a pronominal verb; masculine singular with avoir or an indirect
 * reflexive; with être, the subject's gender and number, or the options', or all of them.
 */
function agreements(context: ClauseContext<FrenchLexeme>): Fork<Agreement | null> {
  const { query, lexeme, target, agreeing, auxiliary } = context;
  if (!agreeing.some(cell => cell.kind === 'nonFinite' && cell.form === 'pastParticiple')) return one(null);
  if (invariable(lexeme)) return one(null, [step(frenchRules['fr.clause.invariable-participle'], null, null)]);
  const { agreement, gender, precedingDirectObject } = query as FrenchConjugationOptions;
  const numberTerm = (number: GrammaticalNumber) => ({ term: 'number' as const, id: number });
  if (target.mood === 'participle' && target.tense === 'past') {
    const chosen = (allowed: Agreement) => one(allowed, [step(frenchRules['fr.clause.participle-forms'], null, null, {
      gender: genderTerm(allowed.gender), number: numberTerm(allowed.number),
    })]);
    if (lexeme.family?.flags.impersonal) return chosen(masculineSingular);
    const forGender: readonly Gender[] = agreement?.gender ? [agreement.gender] : gender ? [gender] : genders;
    const forNumber: readonly GrammaticalNumber[] = agreement?.number ? [agreement.number] : numbers;
    return forGender.flatMap(g => forNumber.flatMap(n => chosen({ gender: g, number: n })));
  }
  if (precedingDirectObject && (auxiliary === 'avoir' || lexeme.reflexive)) {
    return one(precedingDirectObject, [step(frenchRules['fr.clause.agree-object'], null, null)]);
  }
  if (auxiliary === 'avoir') return one(masculineSingular, [step(frenchRules['fr.clause.no-agreement-avoir'], null, null)]);
  if (lexeme.reflexive && lexeme.indirect) return one(masculineSingular, [step(frenchRules['fr.clause.no-agreement-indirect'], null, null)]);
  const forGender: readonly Gender[] = target.gender ? [target.gender] : agreement?.gender ? [agreement.gender] : gender ? [gender] : genders;
  const forNumber: readonly GrammaticalNumber[] = target.number ? [target.number] : agreement?.number ? [agreement.number] : numbers;
  return forGender.flatMap(g => forNumber.flatMap(n => one({ gender: g, number: n }, [step(frenchRules['fr.clause.agree-subject'], null, null)])));
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

/** The elisions the renderer will make (je, me, te, se, que, de before a vowel or mute h), as steps. */
function elisions(parts: readonly ConjugationPart[], rendering: ClauseContext<FrenchLexeme>['rendering']): DerivationStep[] {
  return parts.slice(0, -1).flatMap((left, index) => {
    const elided = rendering.sandhi(left, parts[index + 1]!);
    return elided === null ? [] : [step(frenchRules['fr.clause.elision'], left.text, elided, { word: left.text })];
  });
}

/**
 * The words of a form in order (GD §6.2): [que] subject [reflexive] verbs in a finite tense, the reflexive pronoun just
 * before the infinitive after aller or venir de; the verb then the reflexive pronoun, joined by a hyphen, in the
 * imperative; en [reflexive] verbs in the gerund; the past participle alone. The plural of a verb impersonal in the
 * singular is figurative; a verb with two auxiliaries says which one each compound form uses.
 */
function assemble(words: readonly ChainWord[], { lexeme, target, subject, rendering }: ClauseContext<FrenchLexeme>): Fork<readonly ConjugationPart[]> {
  const steps: DerivationStep[] = [];
  const onsetFlags = { aspiratedH: lexeme.aspiratedH };
  const parts = words.map(word => {
    const features = word.cell?.kind === 'nonFinite' ? nonFiniteFeatures[word.cell.form] ?? {} : {};
    return word.role === 'lexicalVerb' ? wordPart(rendering, word, features, { onsetFlags }) : wordPart(rendering, word, features);
  });
  const imperative = target.mood === 'imperative';
  const pastParticiple = target.mood === 'participle' && target.tense === 'past';
  const reflexive = lexeme.reflexive && !pastParticiple;
  const pronoun = reflexivePronoun(target, imperative && words.length === 1);
  if (reflexive) {
    const clitic = grammaticalPart(rendering, 'reflexivePronoun', pronoun, null, { person: target.person, number: target.number }, imperative ? 'hyphen' : 'space');
    // Before the first verb, or after aller / venir de, just before the infinitive; after the verb in the imperative.
    const named = words.some(word => word.role === 'auxiliary' && (word.lemma === 'aller' || word.lemma === 'venir'));
    const at = imperative ? parts.length : named ? words.findIndex(word => word.role === 'lexicalVerb') : words.findIndex(word => word.lemma !== null);
    parts.splice(at, 0, clitic);
    steps.push(step(frenchRules[imperative ? 'fr.clause.reflexive-imperative' : 'fr.clause.reflexive-pronoun'], null, null, { pronoun }));
  }
  const before: ConjugationPart[] = [];
  const opening: DerivationStep[] = [];
  if (!imperative) {
    if (target.mood === 'subjunctive') {
      before.push(grammaticalPart(rendering, 'moodMarker', 'que'));
      opening.push(step(frenchRules['fr.clause.que'], null, null));
    }
    if (target.person !== null && subject !== null && subject.pronoun !== null) {
      const text = subjectPronoun(subject.pronoun, target);
      before.push(grammaticalPart(rendering, 'subject', text, null, { person: target.person, number: target.number, gender: target.gender }));
      opening.push(step(frenchRules['fr.clause.subject'], null, null, { pronoun: text }));
    }
    if (target.mood === 'gerund' && !words.some(word => word.role === 'moodMarker')) {
      before.push(grammaticalPart(rendering, 'moodMarker', 'en'));
      opening.push(step(frenchRules['fr.clause.gerund-en'], null, null));
    } else if (target.mood === 'gerund') {
      opening.push(step(frenchRules['fr.clause.gerund-en'], null, null));
    }
  }
  const all = [...before, ...parts];
  const helper = words.find(word => word.role === 'auxiliary');
  const condition = lexeme.family?.flags.impersonal === 'figurativePlural' && target.number === 'plural' ? 'figurative'
    : helper && lexeme.auxiliaryChoice ? `${helper.lemma}: auxiliary choice depends on construction or lexical sense.` : null;
  return one(all, [...opening, ...steps, ...elisions(all, rendering)], condition === null ? {} : { condition });
}
export const frenchClause: ClauseGrammar<FrenchLexeme> = { subjectGenders, agreements, assemble };
