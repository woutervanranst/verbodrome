export interface Stats {
  readonly streak: number;
  readonly best: number;
  readonly xp: number;
}

/** XP for a correct answer given the streak before it: 10, plus 2 per streak step up to +20. */
export const gainFor = (streakBefore: number): number => 10 + Math.min(streakBefore, 10) * 2;

export function applyAnswer(stats: Stats, correct: boolean): Stats & { gain: number } {
  const streak = correct ? stats.streak + 1 : 0;
  const gain = correct ? gainFor(stats.streak) : 0;
  return { streak, best: Math.max(stats.best, streak), xp: stats.xp + gain, gain };
}
