/**
 * The French compound tenses as recipes (GD §4.5), in output order: the perfect auxiliary (avoir or être) in a simple
 * tense plus the agreeing past participle; the near future (aller + infinitive) and the recent past (venir de +
 * infinitive). Every French verb uses every recipe; availability removes those a defective verb lacks.
 */
import type { ChainElement, Periphrasis } from '../../core/periphrasis.js';
import type { FrenchLexeme } from './grammar.js';
import { frenchRules } from './rules.js';

const participle: ChainElement = { verb: 'main', nonFinite: 'pastParticiple', agree: true };
const auxiliary = (mood: string, tense: string): ChainElement => ({ verb: 'perfectAuxiliary', finite: { mood, tense } });

export const frenchPeriphrases: readonly Periphrasis<FrenchLexeme>[] = [
  { mood: 'indicative', tense: 'perfect', rule: frenchRules['fr.periphrasis.perfect'], chain: [auxiliary('indicative', 'present'), participle] },
  { mood: 'indicative', tense: 'pluperfect', rule: frenchRules['fr.periphrasis.pluperfect'], chain: [auxiliary('indicative', 'imperfect'), participle] },
  { mood: 'indicative', tense: 'past_anterior', rule: frenchRules['fr.periphrasis.past-anterior'], chain: [auxiliary('indicative', 'simple_past'), participle] },
  { mood: 'indicative', tense: 'future_perfect', rule: frenchRules['fr.periphrasis.future-perfect'], chain: [auxiliary('indicative', 'future'), participle] },
  { mood: 'subjunctive', tense: 'past', rule: frenchRules['fr.periphrasis.subjunctive-past'], chain: [auxiliary('subjunctive', 'present'), participle] },
  { mood: 'subjunctive', tense: 'pluperfect', rule: frenchRules['fr.periphrasis.subjunctive-pluperfect'], chain: [auxiliary('subjunctive', 'imperfect'), participle] },
  {
    mood: 'conditional', tense: 'past', rule: frenchRules['fr.periphrasis.conditional-past'], pattern: 'past-first',
    chain: [auxiliary('conditional', 'present'), participle],
  },
  {
    // The pluperfect subjunctive in the role of a conditional (JO 1990 II.4 a: « conditionnel passé deuxième forme »).
    mood: 'conditional', tense: 'past', rule: frenchRules['fr.periphrasis.conditional-past-second'], pattern: 'past-second', usage: 'literary',
    chain: [auxiliary('subjunctive', 'imperfect'), participle],
  },
  { mood: 'imperative', tense: 'past', rule: frenchRules['fr.periphrasis.imperative-past'], chain: [auxiliary('imperative', 'present'), participle] },
  {
    mood: 'infinitive', tense: 'past', rule: frenchRules['fr.periphrasis.infinitive-past'],
    chain: [{ verb: 'perfectAuxiliary', nonFinite: 'infinitive' }, participle],
  },
  {
    mood: 'participle', tense: 'perfect', rule: frenchRules['fr.periphrasis.participle-perfect'],
    chain: [{ verb: 'perfectAuxiliary', nonFinite: 'presentParticiple' }, participle],
  },
  {
    mood: 'gerund', tense: 'past', rule: frenchRules['fr.periphrasis.gerund-past'],
    chain: [{ word: 'en', role: 'moodMarker' }, { verb: 'perfectAuxiliary', nonFinite: 'presentParticiple' }, participle],
  },
  {
    mood: 'indicative', tense: 'near_future', rule: frenchRules['fr.periphrasis.near-future'],
    chain: [{ verb: { lemma: 'aller' }, finite: { mood: 'indicative', tense: 'present' } }, { verb: 'main', nonFinite: 'infinitive' }],
  },
  {
    mood: 'indicative', tense: 'recent_past', rule: frenchRules['fr.periphrasis.recent-past'],
    chain: [
      { verb: { lemma: 'venir' }, finite: { mood: 'indicative', tense: 'present' } }, { word: 'de', role: 'linker' },
      { verb: 'main', nonFinite: 'infinitive' },
    ],
  },
];
