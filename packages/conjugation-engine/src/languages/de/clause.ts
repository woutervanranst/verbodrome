/**
 * The German main clause (GD §6.2): subject, conjugated verb, the other verb forms, and a separable particle at the
 * end (verb-second order). The imperative has no subject except wir and Sie, which follow the verb; weather verbs take
 * es. German participles do not agree, so there is no agreement to choose.
 */
import { wordPart } from '../../core/clause.js';
import type { ChainWord, ClauseGrammar } from '../../core/clause.js';
import { step } from '../../core/derivation.js';
import type { DerivationStep } from '../../core/derivation.js';
import { one } from '../../core/fork.js';
import type { VariantTags } from '../../core/fork.js';
import { grammaticalPart } from '../../parts.js';
import type { ConjugationPart, PartFeatures } from '../../types.js';
import { placeParticle } from '../shared/germanic.js';
import type { GermanLexeme } from './classify.js';
import { germanRules as rules } from './rules.js';

const nonFiniteFeatures: Readonly<Record<string, Partial<PartFeatures>>> = {
  infinitive: { mood: 'infinitive', tense: 'present', verbForm: 'infinitive' },
  presentParticiple: { mood: 'participle', tense: 'present', verbForm: 'presentParticiple' },
  pastParticiple: { mood: 'participle', tense: 'past', verbForm: 'pastParticiple' },
};

const featuresOf = (word: ChainWord): Partial<PartFeatures> => word.cell?.kind === 'nonFinite' ? nonFiniteFeatures[word.cell.form] ?? {} : {};

export const germanClause: ClauseGrammar<GermanLexeme> = {
  agreements: () => one(null),
  assemble(words, { lexeme, target, subject, auxiliary, rendering }) {
    const formSteps: DerivationStep[] = [];
    // The particle: at the end after a finite lexical verb, else written together with the lexical verb.
    const placed = placeParticle(words, lexeme.particle);
    const verbs = placed.words.map((word, index) => {
      const original = words[index]!;
      if (word.text === original.text || lexeme.particle === null) return wordPart(rendering, word, featuresOf(word));
      const attached = step(rules['de.clause.particle-attached'], original.text, word.text, { particle: lexeme.particle.text });
      return wordPart(rendering, { ...word, steps: [...word.steps, attached] }, featuresOf(word));
    });
    const imperative = target.mood === 'imperative';
    const pronoun = subject === null ? null
      : lexeme.flags.has('impersonal') && target.person === 3 && target.number === 'singular' ? 'es' : subject.pronoun;
    const subjectPart = (text: string): ConjugationPart => grammaticalPart(
      rendering, 'subject', text, null, { person: subject!.person, number: subject!.number, gender: subject!.gender ?? null },
    );
    let parts: ConjugationPart[];
    if (subject === null || pronoun === null) parts = verbs;
    else if (!imperative) {
      formSteps.push(step(rules['de.clause.subject'], null, null));
      if (lexeme.flags.has('impersonal')) formSteps.push(step(rules['de.clause.impersonal-es'], subject.pronoun, pronoun));
      parts = [subjectPart(pronoun), ...verbs];
    } else if (target.person === 2) parts = verbs;
    else {
      formSteps.push(step(rules['de.clause.imperative-pronoun'], null, null, { pronoun }));
      parts = [verbs[0]!, subjectPart(pronoun), ...verbs.slice(1)];
    }
    if (placed.final !== null) {
      formSteps.push(step(rules['de.clause.particle-final'], null, null, { particle: placed.final }));
      parts = [...parts, grammaticalPart(rendering, 'particle', placed.final)];
    }
    // The condition and region of the perfect auxiliary this form is built with.
    const use = auxiliary === null ? undefined : lexeme.auxiliaryUses.find(item => item.verb === auxiliary);
    const tags: VariantTags = {
      ...(use?.condition === undefined ? {} : { condition: use.condition }),
      ...(use?.region === undefined ? {} : { region: use.region }),
    };
    return one(parts, formSteps, tags);
  },
};
