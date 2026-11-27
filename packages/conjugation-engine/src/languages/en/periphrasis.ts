/**
 * The English compound tenses (design §6): have, be, will, would, let's and to with the main verb's plain form, -ing
 * form or past participle. English has one perfect auxiliary, so have is named by lemma and the rules take no params.
 */
import type { ChainElement, Periphrasis } from '../../core/periphrasis.js';
import type { EnglishLexeme } from './classify.js';
import { englishRules } from './rules.js';

const rules = englishRules;

const have = { lemma: 'have' } as const;
const be = { lemma: 'be' } as const;
const presentOf = (verb: typeof have | typeof be): ChainElement => ({ verb, finite: { mood: 'indicative', tense: 'present' } });
const pastOf = (verb: typeof have | typeof be): ChainElement => ({ verb, finite: { mood: 'indicative', tense: 'past' } });
const plain = (verb: typeof have | typeof be): ChainElement => ({ verb, nonFinite: 'plain' });
const been: ChainElement = { verb: be, nonFinite: 'pastParticiple' };
const will: ChainElement = { word: 'will', role: 'moodMarker' };
const would: ChainElement = { word: 'would', role: 'moodMarker' };
const mainPlain: ChainElement = { verb: 'main', nonFinite: 'plain' };
const mainIng: ChainElement = { verb: 'main', nonFinite: 'presentParticiple' };
const mainParticiple: ChainElement = { verb: 'main', nonFinite: 'pastParticiple' };

export const englishPeriphrases: readonly Periphrasis<EnglishLexeme>[] = [
  { mood: 'indicative', tense: 'perfect', rule: rules['en.periphrasis.perfect'], chain: [presentOf(have), mainParticiple] },
  { mood: 'indicative', tense: 'pluperfect', rule: rules['en.periphrasis.pluperfect'], chain: [pastOf(have), mainParticiple] },
  { mood: 'indicative', tense: 'future', rule: rules['en.periphrasis.future'], chain: [will, mainPlain] },
  { mood: 'indicative', tense: 'future_perfect', rule: rules['en.periphrasis.future-perfect'], chain: [will, plain(have), mainParticiple] },
  { mood: 'indicative', tense: 'present_progressive', rule: rules['en.periphrasis.present-progressive'], chain: [presentOf(be), mainIng] },
  { mood: 'indicative', tense: 'past_progressive', rule: rules['en.periphrasis.past-progressive'], chain: [pastOf(be), mainIng] },
  { mood: 'indicative', tense: 'perfect_progressive', rule: rules['en.periphrasis.perfect-progressive'], chain: [presentOf(have), been, mainIng] },
  { mood: 'indicative', tense: 'pluperfect_progressive', rule: rules['en.periphrasis.pluperfect-progressive'], chain: [pastOf(have), been, mainIng] },
  { mood: 'indicative', tense: 'future_progressive', rule: rules['en.periphrasis.future-progressive'], chain: [will, plain(be), mainIng] },
  {
    mood: 'indicative', tense: 'future_perfect_progressive', rule: rules['en.periphrasis.future-perfect-progressive'],
    chain: [will, plain(have), been, mainIng],
  },
  { mood: 'conditional', tense: 'present', rule: rules['en.periphrasis.conditional'], chain: [would, mainPlain] },
  { mood: 'conditional', tense: 'past', rule: rules['en.periphrasis.conditional-perfect'], chain: [would, plain(have), mainParticiple] },
  { mood: 'conditional', tense: 'present_progressive', rule: rules['en.periphrasis.conditional-progressive'], chain: [would, plain(be), mainIng] },
  {
    mood: 'conditional', tense: 'past_progressive', rule: rules['en.periphrasis.conditional-perfect-progressive'],
    chain: [would, plain(have), been, mainIng],
  },
  // The perfect subjunctive has the plain form have for every person: (that) he have walked.
  { mood: 'subjunctive', tense: 'perfect', rule: rules['en.periphrasis.subjunctive-perfect'], chain: [plain(have), mainParticiple] },
  { mood: 'subjunctive', tense: 'pluperfect', rule: rules['en.periphrasis.subjunctive-pluperfect'], chain: [pastOf(have), mainParticiple] },
  // Only the 1st person plural: the 2nd person imperative is a simple cell (cellOf), so this recipe does not run for it.
  { mood: 'imperative', tense: 'present', rule: rules['en.periphrasis.lets'], chain: [{ word: "let's", role: 'moodMarker' }, mainPlain] },
  { mood: 'infinitive', tense: 'present', rule: rules['en.periphrasis.to-infinitive'], chain: [{ word: 'to', role: 'particle' }, mainPlain] },
];
