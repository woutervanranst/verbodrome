import { wordPart } from '../../core/clause.js';
import type { ChainWord, ClauseContext, ClauseGrammar } from '../../core/clause.js';
import { step } from '../../core/derivation.js';
import type { DerivationStep } from '../../core/derivation.js';
import { one } from '../../core/fork.js';
import type { Fork, VariantTags } from '../../core/fork.js';
import type { Agreement, GrammaticalNumber } from '../../core/grammar.js';
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

const reflexivePronouns: Readonly<Record<string, string>> = {
  '1.singular': 'mi', '2.singular': 'ti', '3.singular': 'si', '1.plural': 'ci', '2.plural': 'vi', '3.plural': 'si',
};

const genders = ['masculine', 'feminine'] as const;
const numbers = ['singular', 'plural'] as const;

/**
 * Agreement of the past participle (grammar design §6.2): none after avere; after essere (every reflexive verb) with
 * the subject, in the slot's gender (lui, lei) or in both; a bare participle and a non-finite compound in all four forms;
 * `gender` keeps one gender. A verb with two auxiliaries labels each form with when its auxiliary is used.
 */
function agreementsOf({ lexeme, target, agreeing, auxiliary, query, subject }: ClauseContext<ItalianLexeme>): Fork<Agreement | null> {
  const condition = auxiliary !== null && lexeme.auxiliaries.length > 1 ? lexeme.auxiliaryConditions[auxiliary] : undefined;
  const tags: VariantTags = condition === undefined ? {} : { condition };
  if (!agreeing.some(cell => cell.kind === 'nonFinite' && cell.form === 'participle')) return one(null, [], tags);
  if (auxiliary === 'avere') return one(null, [step(R['it.clause.avere-invariable'], null, null)], tags);
  const rule = auxiliary === null ? R['it.clause.participle-forms'] : R['it.clause.agree-subject'];
  const agreement = (gender: 'masculine' | 'feminine', number: GrammaticalNumber): Fork<Agreement> =>
    one({ gender, number }, [step(rule, null, null, { gender: { term: 'gender', id: gender }, number: { term: 'number', id: number } })], tags);
  const allowed = genders.filter(gender => query.gender === undefined || query.gender === gender);
  // An impersonal (weather) verb has no subject and only the masculine singular (è piovuto, essendo piovuto), whatever `gender`.
  if (lexeme.impersonal) return agreement('masculine', 'singular');
  if (target.number !== null) {
    const slotGender = subject?.gender === 'masculine' || subject?.gender === 'feminine' ? subject.gender : undefined;
    return (slotGender === undefined ? allowed : [slotGender]).flatMap(gender => agreement(gender, target.number!));
  }
  return numbers.flatMap(number => allowed.flatMap(gender => agreement(gender, number)));
}

/** One way to assemble a form: its parts, its clause steps and its tags. */
interface Assembly { readonly parts: readonly ConjugationPart[]; readonly steps: readonly DerivationStep[]; readonly tags?: VariantTags }

const isInfinitive = (word: ChainWord): boolean => word.cell?.kind === 'nonFinite' && word.cell.form === 'infinitive';

/**
 * The reflexive pronoun attached to the end of `word` (lavati, lavarsi, fatti): an infinitive first loses its final -e
 * (porre its -re); after a one-syllable imperative with an apostrophe the pronoun's consonant doubles. Null when the
 * word is the long imperative of a verb that has a one-syllable one (fai beside fa': only fatti).
 */
function enclitic(word: ChainWord, pronoun: string, lexeme: ItalianLexeme, ctx: ClauseContext<ItalianLexeme>): Assembly | null {
  const { rendering } = ctx;
  const steps: DerivationStep[] = [];
  let verb = word.text;
  if (verb.endsWith("'")) {
    // The doubled consonant is written on the verb (fat + ti), so the pronoun part stays the pronoun.
    const doubled = `${verb.slice(0, -1)}${pronoun.charAt(0)}`;
    steps.push(step(R['it.clause.enclitic-doubling'], verb, doubled + pronoun, { pronoun }));
    verb = doubled;
  } else {
    const short = lexeme.entry?.cells?.['imperative.present.2.singular']?.some(form => form.text.endsWith("'")) ?? false;
    if (short && word.cell?.kind === 'finite' && word.cell.mood === 'imperative' && word.cell.person === 2 && word.cell.number === 'singular') return null;
    if (isInfinitive(word)) {
      const dropped = verb.endsWith('rre') ? verb.slice(0, -2) : verb.slice(0, -1);
      steps.push(step(R['it.clause.infinitive-e-drop'], verb, dropped));
      verb = dropped;
    }
    steps.push(step(R['it.clause.enclitic'], verb, verb + pronoun, { pronoun }));
  }
  const pronounPart = grammaticalPart(rendering, 'reflexivePronoun', pronoun, null, {
    person: ctx.target.person, number: ctx.target.number,
  }, 'attached');
  return { parts: [wordPart(rendering, { ...word, text: verb }, featuresOf(word)), pronounPart], steps };
}

/** The ways the verb words and a reflexive pronoun are ordered (grammar design §6.3). */
function reflexiveOrders(words: readonly ChainWord[], ctx: ClauseContext<ItalianLexeme>): readonly Assembly[] {
  const { lexeme, target, rendering } = ctx;
  const verbs = words.map(word => wordPart(rendering, word, featuresOf(word)));
  const first = words[0]!;
  // Past and present participles standing alone take no clitic here (the lavatosi type is not modelled).
  if (target.mood === 'participle') return [{ parts: verbs, steps: [] }];
  const pronoun = target.person === null || target.number === null ? 'si' : reflexivePronouns[`${target.person}.${target.number}`]!;
  const proclitic: Assembly = {
    parts: [grammaticalPart(rendering, 'reflexivePronoun', pronoun, null, { person: target.person, number: target.number }), ...verbs],
    steps: [step(R['it.clause.reflexive-pronoun'], null, null, { pronoun })],
  };
  const attached = (): Assembly | null => {
    const clitic = enclitic(first, pronoun, lexeme, ctx);
    return clitic === null ? null : { parts: [...clitic.parts, ...verbs.slice(1)], steps: clitic.steps };
  };
  if (target.mood !== 'imperative') {
    if (target.person !== null) return [proclitic];
    return [attached()!];
  }
  const courtesy = target.person === 3;
  if (target.tense !== 'negative') return courtesy ? [proclitic] : [attached()].filter(order => order !== null);
  if (courtesy) return [proclitic];
  const enc = attached();
  return [{ ...proclitic, tags: { pattern: 'proclitic' } }, ...(enc === null ? [] : [{ ...enc, tags: { pattern: 'enclitic' } }])];
}

export const italianClause: ClauseGrammar<ItalianLexeme> = {
  agreements: agreementsOf,
  /**
   * The subject pronoun of a finite form (none in the imperative, none for an impersonal verb), then non in a negative
   * imperative, then the verbs with a reflexive verb's pronoun before them or attached to the first.
   */
  assemble(words, ctx) {
    const { lexeme, target, subject, rendering } = ctx;
    const head: ConjugationPart[] = [];
    const steps: DerivationStep[] = [];
    if (subject !== null && subject.pronoun !== null && target.mood !== 'imperative' && !lexeme.impersonal) {
      const formal = subject.register === 'formal';
      steps.push(step(formal ? R['it.clause.formal-subject'] : R['it.clause.subject'], null, null, { pronoun: subject.pronoun }));
      head.push(grammaticalPart(rendering, 'subject', subject.pronoun, null, {
        person: subject.person, number: subject.number, gender: subject.gender ?? null,
      }));
    }
    if (target.mood === 'imperative' && target.tense === 'negative') {
      steps.push(step(words.some(isInfinitive) ? R['it.clause.negative-infinitive'] : R['it.clause.negative'], null, null));
      head.push(grammaticalPart(rendering, 'particle', 'non'));
    }
    const orders: readonly Assembly[] = lexeme.reflexive
      ? reflexiveOrders(words, ctx)
      : [{ parts: words.map(word => wordPart(rendering, word, featuresOf(word))), steps: [] }];
    return orders.flatMap(order => one([...head, ...order.parts], [...steps, ...order.steps], order.tags ?? {}));
  },
};
