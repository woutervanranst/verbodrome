/**
 * The six Dutch compound tenses. The perfect and pluperfect are the present or past of the perfect auxiliary (hebben or
 * zijn, once for each the verb takes) and the past participle; the future and the conditional are the present or past of
 * zullen and the infinitive; their perfect forms add the past participle and the infinitive of the perfect auxiliary
 * (ik zal gewerkt hebben). The infinitive of zijn has the spoken alternative wezen as a second word, so ik zal geweest
 * zijn is followed by ik zal geweest wezen. A form reports the perfect auxiliary when it has one, else zullen.
 */
import type { ChainElement, Periphrasis } from '../../core/periphrasis.js';
import type { DutchLexeme } from './lexicon.js';
import { dutchRules } from './rules.js';

const present = { mood: 'indicative', tense: 'present' } as const;
const past = { mood: 'indicative', tense: 'past' } as const;
const zullen = { lemma: 'zullen' } as const;
const participle: ChainElement = { verb: 'main', nonFinite: 'participle' };
const infinitive: ChainElement = { verb: 'main', nonFinite: 'infinitive' };
const auxiliaryInfinitive: ChainElement = { verb: 'perfectAuxiliary', nonFinite: 'infinitive' };

export const dutchPeriphrases: readonly Periphrasis<DutchLexeme>[] = [
  { mood: 'indicative', tense: 'perfect', rule: dutchRules['nl.periphrasis.perfect'], chain: [{ verb: 'perfectAuxiliary', finite: present }, participle] },
  { mood: 'indicative', tense: 'pluperfect', rule: dutchRules['nl.periphrasis.pluperfect'], chain: [{ verb: 'perfectAuxiliary', finite: past }, participle] },
  { mood: 'indicative', tense: 'future', rule: dutchRules['nl.periphrasis.future'], chain: [{ verb: zullen, finite: present }, infinitive] },
  {
    mood: 'indicative', tense: 'future_perfect', rule: dutchRules['nl.periphrasis.future-perfect'],
    chain: [{ verb: zullen, finite: present }, participle, auxiliaryInfinitive],
  },
  { mood: 'conditional', tense: 'present', rule: dutchRules['nl.periphrasis.conditional'], chain: [{ verb: zullen, finite: past }, infinitive] },
  {
    mood: 'conditional', tense: 'past', rule: dutchRules['nl.periphrasis.conditional-perfect'],
    chain: [{ verb: zullen, finite: past }, participle, auxiliaryInfinitive],
  },
];
