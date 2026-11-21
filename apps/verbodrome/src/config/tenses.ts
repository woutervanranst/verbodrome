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
}

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

/** Display order inside a level follows this list, then engine order. */
const ORDER = Object.keys(TENSE_LEVELS);

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
    } satisfies TenseDef;
  })
  .sort((a, b) => {
    const ia = ORDER.indexOf(a.id), ib = ORDER.indexOf(b.id);
    return (ia < 0 ? 999 : ia) - (ib < 0 ? 999 : ib);
  });

export const tenseById = (id: string): TenseDef | undefined => TENSES.find(tense => tense.id === id);
