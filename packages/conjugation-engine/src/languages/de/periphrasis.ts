/**
 * The German compound tenses (GD §6.1): the eleven chains of an auxiliary and a non-finite form. A verb with two perfect
 * auxiliaries (fahren: sein and haben) runs each chain that uses one once per auxiliary, in the lexicon's order.
 */
import type { ChainElement, Periphrasis } from '../../core/periphrasis.js';
import type { GermanLexeme } from './classify.js';
import { germanRules as rules } from './rules.js';

const finite = (verb: 'perfectAuxiliary' | { readonly lemma: string }, mood: string, tense: string): ChainElement => ({ verb, finite: { mood, tense } });
const werden = { lemma: 'werden' } as const;
const participle: ChainElement = { verb: 'main', nonFinite: 'pastParticiple' };
const infinitive: ChainElement = { verb: 'main', nonFinite: 'infinitive' };
const auxiliaryInfinitive: ChainElement = { verb: 'perfectAuxiliary', nonFinite: 'infinitive' };

export const germanPeriphrases: readonly Periphrasis<GermanLexeme>[] = [
  { mood: 'indicative', tense: 'perfect', rule: rules['de.periphrasis.perfect'], chain: [finite('perfectAuxiliary', 'indicative', 'present'), participle] },
  { mood: 'indicative', tense: 'pluperfect', rule: rules['de.periphrasis.pluperfect'], chain: [finite('perfectAuxiliary', 'indicative', 'past'), participle] },
  { mood: 'indicative', tense: 'future', rule: rules['de.periphrasis.future'], chain: [finite(werden, 'indicative', 'present'), infinitive] },
  {
    mood: 'indicative', tense: 'future_perfect', rule: rules['de.periphrasis.future-perfect'],
    chain: [finite(werden, 'indicative', 'present'), participle, auxiliaryInfinitive],
  },
  { mood: 'subjunctive', tense: 'perfect', rule: rules['de.periphrasis.subjunctive-perfect'], chain: [finite('perfectAuxiliary', 'subjunctive', 'present'), participle] },
  { mood: 'subjunctive', tense: 'pluperfect', rule: rules['de.periphrasis.subjunctive-pluperfect'], chain: [finite('perfectAuxiliary', 'subjunctive', 'past'), participle] },
  { mood: 'subjunctive', tense: 'future', rule: rules['de.periphrasis.subjunctive-future'], chain: [finite(werden, 'subjunctive', 'present'), infinitive] },
  {
    mood: 'subjunctive', tense: 'future_perfect', rule: rules['de.periphrasis.subjunctive-future-perfect'],
    chain: [finite(werden, 'subjunctive', 'present'), participle, auxiliaryInfinitive],
  },
  { mood: 'conditional', tense: 'present', rule: rules['de.periphrasis.conditional'], chain: [finite(werden, 'subjunctive', 'past'), infinitive] },
  {
    mood: 'conditional', tense: 'past', rule: rules['de.periphrasis.conditional-perfect'],
    chain: [finite(werden, 'subjunctive', 'past'), participle, auxiliaryInfinitive],
  },
  { mood: 'infinitive', tense: 'perfect', rule: rules['de.periphrasis.infinitive-perfect'], chain: [participle, auxiliaryInfinitive] },
];
