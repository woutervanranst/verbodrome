/**
 * School levels used by the quick-picks. Levels are cumulative: picking a level
 * selects everything up to and including it. `extra` sits on top of the 3e graad:
 * picking it selects everything.
 */
export type Level = 'lager' | 'g1' | 'g2' | 'g3' | 'extra';

export interface LevelDef {
  readonly id: Level;
  /** Métro-style line number shown in the roundel. */
  readonly line: string;
  readonly name: string;
  readonly detail: string;
  readonly color: string;
  /** Readable text colour on top of `color`. */
  readonly ink: string;
}

export const LEVELS: readonly LevelDef[] = [
  { id: 'lager', line: '1', name: 'Lager onderwijs', detail: '5e en 6e leerjaar', color: '#f2c931', ink: '#1c1a17' },
  { id: 'g1', line: '2', name: '1e graad secundair', detail: '1e en 2e middelbaar', color: '#2a6bd1', ink: '#ffffff' },
  { id: 'g2', line: '3', name: '2e graad secundair', detail: '3e en 4e middelbaar', color: '#2f9e6a', ink: '#ffffff' },
  { id: 'g3', line: '4', name: '3e graad secundair', detail: '5e en 6e middelbaar', color: '#b0409a', ink: '#ffffff' },
  { id: 'extra', line: '+', name: 'Extra', detail: '3e graad + literair en zeldzaam', color: '#8b8378', ink: '#ffffff' },
];

export const QUICK_LEVELS: readonly Level[] = ['lager', 'g1', 'g2', 'g3', 'extra'];

export const levelDef = (id: Level): LevelDef => {
  const found = LEVELS.find(level => level.id === id);
  if (!found) throw new Error(`Unknown level ${id}`);
  return found;
};

/** True when something taught at `itemLevel` belongs to the cumulative quick-pick `pick`. */
export function levelIncludes(pick: Level, itemLevel: Level): boolean {
  return QUICK_LEVELS.indexOf(itemLevel) <= QUICK_LEVELS.indexOf(pick);
}
