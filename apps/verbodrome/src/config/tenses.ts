import { getCatalogue } from 'conjugation-engine';
import type { FrenchTenses } from 'conjugation-engine';
import type { Level } from './levels';

export type FrenchMood = keyof FrenchTenses;

export interface TenseDef {
  /** `${mood}.${tense}`, using conjugation-engine identifiers. */
  readonly id: string;
  readonly mood: FrenchMood;
  readonly tense: string;
  /** French name as used in Flemish classrooms, e.g. "passé composé". */
  readonly label: string;
  readonly finite: boolean;
  readonly level: Level;
  /** Where the tense sits on the time axis. */
  readonly era: Era;
}

/** The time axis of the picker, from furthest past to furthest future. */
export type Era = 'voorverleden' | 'verleden' | 'nu' | 'straks' | 'later';

export const ERAS: readonly { readonly id: Era; readonly label: string }[] = [
  { id: 'voorverleden', label: 'nog vroeger' },
  { id: 'verleden', label: 'verleden' },
  { id: 'nu', label: 'nu' },
  { id: 'straks', label: 'straks' },
  { id: 'later', label: 'later' },
];

/**
 * CONFIGURATION — chronological order of the tenses, earliest first.
 * Tenses are shown in this order everywhere; the era groups them on the axis.
 */
const TIMELINE: readonly (readonly [Era, readonly string[]])[] = [
  ['voorverleden', ['indicative.pluperfect', 'indicative.past_anterior', 'subjunctive.pluperfect']],
  ['verleden', [
    'indicative.simple_past', 'indicative.imperfect', 'indicative.perfect', 'indicative.recent_past',
    'subjunctive.imperfect', 'subjunctive.past', 'conditional.past', 'imperative.past',
    'infinitive.past', 'participle.past', 'participle.perfect', 'gerund.past',
  ]],
  ['nu', [
    'indicative.present', 'imperative.present', 'subjunctive.present', 'conditional.present',
    'infinitive.present', 'participle.present', 'gerund.present',
  ]],
  ['straks', ['indicative.near_future']],
  ['later', ['indicative.future_perfect', 'indicative.future']],
];
const ORDER: readonly string[] = TIMELINE.flatMap(([, ids]) => ids);
const eraOf = (id: string): Era => TIMELINE.find(([, ids]) => ids.includes(id))?.[0] ?? 'nu';

/**
 * CONFIGURATION — at which level each tense is introduced.
 * Any engine tense not listed here lands in `extra`. To move a tense, change its level.
 */
const TENSE_LEVELS: Readonly<Record<string, Level>> = {
  'indicative.present': 'lager',

  'imperative.present': 'g1',
  'indicative.near_future': 'g1',
  'indicative.recent_past': 'g1',
  'indicative.perfect': 'g1',
  'indicative.imperfect': 'g1',

  'indicative.future': 'g2',
  'conditional.present': 'g2',
  'indicative.pluperfect': 'g2',
  'gerund.present': 'g2',
  'participle.present': 'g2',

  'subjunctive.present': 'g3',
  'conditional.past': 'g3',
  'indicative.future_perfect': 'g3',
  'indicative.simple_past': 'g3',
};

function label(mood: string, moodLabel: string, tenseLabel: string): string {
  const tense = tenseLabel.toLowerCase();
  return mood === 'indicative' ? tense : `${moodLabel.toLowerCase()} ${tense}`;
}

/** Every French tense the engine knows; the engine's catalogue is the source of truth. */
export const TENSES: readonly TenseDef[] = getCatalogue('fr')
  .map(entry => {
    const id = `${entry.mood}.${entry.tense}`;
    return {
      id,
      mood: entry.mood as FrenchMood,
      tense: entry.tense,
      label: label(entry.mood, entry.moodLabel, entry.tenseLabel),
      finite: entry.finite,
      level: TENSE_LEVELS[id] ?? 'extra',
      era: eraOf(id),
    } satisfies TenseDef;
  })
  .sort((a, b) => {
    const ia = ORDER.indexOf(a.id), ib = ORDER.indexOf(b.id);
    return (ia < 0 ? 999 : ia) - (ib < 0 ? 999 : ib);
  });

export const tenseById = (id: string): TenseDef | undefined => TENSES.find(tense => tense.id === id);
