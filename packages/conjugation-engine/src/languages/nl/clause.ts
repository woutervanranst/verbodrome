/**
 * The Dutch clause: the subject before the finite verb, or after it with the `inversion` option (werk jij); the
 * reflexive pronoun after them (ik vergis me, vergis jij je); the rest of the verb chain; and a separable particle at the
 * end of the clause when the main verb is finite (ik sta op). Elsewhere the particle is written onto the main verb
 * (opgestaan, opstaan, verwerk). An impersonal verb has `het` as its 3rd person singular subject unless the query names
 * one. The imperative has no subject; the infinitive and the present participle put the reflexive pronoun first (zich
 * vergissen); the past participle stands alone.
 *
 * For the 2nd person singular present, the cell gives its plain forms, the forms after the verb and the extra formal
 * forms (`paradigms.ts`); the clause keeps the formal set for u (u hebt, u heeft), the forms after the verb when jij or
 * je follows it, and the plain forms otherwise. Two conditions label forms as the legacy resolver did: the spoken
 * infinitive wezen, and the choice of hebben or zijn for a verb that takes both.
 */
import { wordPart } from '../../core/clause.js';
import type { ChainWord, ClauseContext, ClauseGrammar } from '../../core/clause.js';
import { step } from '../../core/derivation.js';
import type { DerivationStep } from '../../core/derivation.js';
import { one } from '../../core/fork.js';
import type { VariantTags } from '../../core/fork.js';
import { ConjugationError } from '../../errors.js';
import { grammaticalPart, itemAt } from '../../parts.js';
import type { ConjugationPart, PartFeatures } from '../../types.js';
import type { DutchLexeme } from './lexicon.js';
import { isSecondSingularPresent } from './paradigms.js';
import { dutchRules } from './rule-table.js';

const reflexivePronouns = ['me', 'je', 'zich', 'ons', 'jullie', 'zich'] as const;
const spokenInfinitive = 'Spoken infinitive alternative to zijn.';
const auxiliaryChoice = 'Auxiliary choice depends on transitivity, movement or change of state.';

const nonFiniteFeatures: Readonly<Record<string, Partial<PartFeatures>>> = {
  infinitive: { mood: 'infinitive', tense: 'present', verbForm: 'infinitive' },
  presentParticiple: { mood: 'participle', tense: 'present', verbForm: 'presentParticiple' },
  participle: { mood: 'participle', tense: 'past', verbForm: 'pastParticiple' },
};

type Context = ClauseContext<DutchLexeme>;

/**
 * Whether a word belongs to the set of 2nd person singular present forms this clause needs: the formal set for u (the
 * plain forms and the formal ones), the forms after the verb when jij or je follows it, the plain forms otherwise.
 * Every other word belongs.
 */
function inSet(word: ChainWord, { subject, query }: Context): boolean {
  if (!isSecondSingularPresent(word.cell)) return true;
  const afterVerb = word.steps.some(s => s.rule === 'nl.end.inversion-t-drop');
  const formal = word.steps.some(s => s.rule === 'nl.cell.formal');
  if (subject?.register === 'formal') return !afterVerb;
  if (query.inversion === true) return afterVerb;
  return !afterVerb && !formal;
}

/** The subject pronoun: `het` for an impersonal verb's 3rd person singular unless the query names a subject. */
function subjectPronoun({ subject, lexeme, target, query }: Context): string {
  if (subject === null || subject.pronoun === null) throw new ConjugationError('GENERATION_FAILURE', 'A Dutch finite form needs a subject slot.');
  const named = query.pronoun !== undefined || query.subject !== undefined;
  return !named && lexeme.entry.impersonal && target.number === 'singular' ? 'het' : subject.pronoun;
}

/** The reflexive pronoun: zich without a person and with u (u in the imperative), else the person's own. */
function reflexivePronoun({ subject, target }: Context): string {
  if (target.person === null || target.number === null) return 'zich';
  if (subject?.register === 'formal') return target.mood === 'imperative' ? 'u' : 'zich';
  return itemAt(reflexivePronouns, (target.number === 'plural' ? 3 : 0) + target.person - 1);
}

/** The condition a form carries: the spoken infinitive wezen, else the hebben/zijn choice of a compound tense. */
function condition(words: readonly ChainWord[], { lexeme, auxiliary }: Context): VariantTags {
  if (words.some(word => word.text === 'wezen' && word.cell?.kind === 'nonFinite' && word.cell.form === 'infinitive')) return { condition: spokenInfinitive };
  return auxiliary !== null && lexeme.defaultAuxiliaries.length > 1 ? { condition: auxiliaryChoice } : {};
}

export const dutchClause: ClauseGrammar<DutchLexeme> = {
  /** Dutch participles do not agree. */
  agreements: () => one(null),
  assemble(words, context) {
    if (!words.every(word => inSet(word, context))) return [];
    const { lexeme, target, query, rendering } = context;
    const particle = lexeme.particle;
    const finiteMain = words.some(word => word.role === 'lexicalVerb' && word.cell?.kind === 'finite');
    const detached = particle !== null && particle.separable && finiteMain;
    const verbs = words.map(word => {
      const features = word.cell?.kind === 'nonFinite' ? nonFiniteFeatures[word.cell.form] ?? {} : {};
      if (word.role !== 'lexicalVerb' || particle === null || detached) return wordPart(rendering, word, features);
      const attached = particle.text + word.text;
      const attach = step(dutchRules['nl.clause.particle-attached'], word.text, attached, { particle: particle.text });
      return wordPart(rendering, { ...word, text: attached, steps: [...word.steps, attach] }, features);
    });
    const tags = condition(words, context);
    // The past participle stands alone, without the reflexive pronoun.
    const alone = target.mood === 'participle' && target.tense === 'past';
    if (alone) return one(verbs, [], tags);
    const steps: DerivationStep[] = [];
    const personal = { person: target.person, number: target.number };
    const clitics: ConjugationPart[] = [];
    if (lexeme.reflexive) {
      const pronoun = reflexivePronoun(context);
      clitics.push(grammaticalPart(rendering, 'reflexivePronoun', pronoun, null, personal));
      steps.push(step(dutchRules['nl.clause.reflexive'], lexeme.lemma, null, { pronoun }));
    }
    const particles = detached ? [grammaticalPart(rendering, 'particle', particle.text)] : [];
    if (detached) steps.push(step(dutchRules['nl.clause.particle-final'], null, null, { particle: particle.text }));
    // The infinitive and the present participle take the reflexive pronoun first.
    if (target.person === null) return one([...clitics, ...verbs], steps, tags);
    const [finite, ...rest] = verbs;
    if (finite === undefined) throw new ConjugationError('GENERATION_FAILURE', 'A Dutch finite form needs a verb.');
    if (target.mood === 'imperative') return one([finite, ...clitics, ...rest, ...particles], steps, tags);
    const pronoun = subjectPronoun(context);
    const subject = grammaticalPart(rendering, 'subject', pronoun, null, personal);
    const inverted = query.inversion === true;
    const clauseSteps = [
      step(dutchRules['nl.clause.subject'], null, null, { pronoun }),
      ...(inverted ? [step(dutchRules['nl.clause.inversion'], null, null, { pronoun })] : []),
      ...steps,
    ];
    return one([...(inverted ? [finite, subject] : [subject, finite]), ...clitics, ...rest, ...particles], clauseSteps, tags);
  },
};
