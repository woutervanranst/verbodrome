/**
 * School levels used by the quick-picks. Levels are cumulative: picking a level
 * selects everything up to and including it. `extra` sits on top of the 3e graad:
 * picking it selects everything.
 */
export type Level = 'lager' | 'g1' | 'g2' | 'g3' | 'extra';

export interface LevelDef {
  readonly id: Level;
  readonly name: string;
  readonly detail: string;
}

export const LEVELS: readonly LevelDef[] = [
  { id: 'lager', name: 'Lager onderwijs', detail: '5e en 6e leerjaar' },
  { id: 'g1', name: '1e graad secundair', detail: '1e en 2e middelbaar' },
  { id: 'g2', name: '2e graad secundair', detail: '3e en 4e middelbaar' },
  { id: 'g3', name: '3e graad secundair', detail: '5e en 6e middelbaar' },
  { id: 'extra', name: 'Extra', detail: '3e graad + literair en zeldzaam' },
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
