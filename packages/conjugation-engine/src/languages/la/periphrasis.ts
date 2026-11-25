/**
 * The compound tenses (GD §6.1; A&G §§164.3, 179.g, 170.a, 203.a): participle + a form of esse, the supine + īrī, and
 * fore. Each finite recipe exists twice: in the passive for every verb, in the active for the verbs whose perfect system
 * is built on the participle (deponents, semi-deponents, fīō), which `cellOf` sends here by returning null.
 */
import type { ChainElement, Periphrasis } from '../../core/periphrasis.js';
import type { LatinLexeme } from './lexicon.js';
import { latinRules } from './rules.js';

const participle: ChainElement = { verb: 'main', nonFinite: 'perfectParticiple', agree: true };
const esse = (mood: string, tense: string): ChainElement => ({ verb: { lemma: 'esse' }, finite: { mood, tense } });
const esseInfinitive: ChainElement = { verb: { lemma: 'esse' }, nonFinite: 'presentInfinitive' };
const onParticiple = (lexeme: LatinLexeme): boolean => lexeme.perfectSystem === 'participle';
const isFio = (lexeme: LatinLexeme): boolean => lexeme.entry?.infinitive === 'fierī';

const finite = [
  ['indicative', 'perfect', 'indicative', 'present', latinRules['la.periphrasis.perfect']],
  ['indicative', 'pluperfect', 'indicative', 'imperfect', latinRules['la.periphrasis.pluperfect']],
  ['indicative', 'future_perfect', 'indicative', 'future', latinRules['la.periphrasis.future-perfect']],
  ['subjunctive', 'perfect', 'subjunctive', 'present', latinRules['la.periphrasis.perfect-subjunctive']],
  ['subjunctive', 'pluperfect', 'subjunctive', 'imperfect', latinRules['la.periphrasis.pluperfect-subjunctive']],
] as const;

const futurePassive: readonly ChainElement[] = [{ verb: 'main', nonFinite: 'supine' }, { verb: { lemma: 'īre' }, nonFinite: 'presentInfinitivePassive' }];

export const latinPeriphrases: readonly Periphrasis<LatinLexeme>[] = [
  ...finite.flatMap(([mood, tense, auxMood, auxTense, rule]): Periphrasis<LatinLexeme>[] => [
    { mood, tense, voice: 'passive', rule, chain: [participle, esse(auxMood, auxTense)] },
    { mood, tense, voice: 'active', applies: onParticiple, rule, chain: [participle, esse(auxMood, auxTense)] },
  ]),
  { mood: 'infinitive', tense: 'perfect', voice: 'passive', rule: latinRules['la.periphrasis.perfect-infinitive'], chain: [participle, esseInfinitive] },
  { mood: 'infinitive', tense: 'perfect', voice: 'active', applies: onParticiple, rule: latinRules['la.periphrasis.perfect-infinitive'], chain: [participle, esseInfinitive] },
  {
    mood: 'infinitive', tense: 'future', voice: 'active', applies: lexeme => !isFio(lexeme), rule: latinRules['la.periphrasis.future-infinitive'],
    chain: [{ verb: 'main', nonFinite: 'futureParticiple', agree: true }, esseInfinitive],
  },
  {
    mood: 'infinitive', tense: 'future', voice: 'active', applies: lexeme => lexeme.flags.has('fore'), rule: latinRules['la.periphrasis.fore'],
    chain: [{ verb: 'main', nonFinite: 'fore', agree: true }],
  },
  { mood: 'infinitive', tense: 'future', voice: 'passive', rule: latinRules['la.periphrasis.future-infinitive-passive'], chain: futurePassive },
  { mood: 'infinitive', tense: 'future', voice: 'active', applies: isFio, rule: latinRules['la.periphrasis.future-infinitive-passive'], chain: futurePassive },
];
