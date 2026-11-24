export interface Stats {
  readonly streak: number;
  readonly best: number;
  readonly xp: number;
}

/** XP for a correct answer given the streak before it: 10, plus 2 per streak step up to +20. */
export const gainFor = (streakBefore: number): number => 10 + Math.min(streakBefore, 10) * 2;

/** `factor` scales the XP of a right answer: typing it is harder than picking it (see APP.typedXpFactor). */
export function applyAnswer(stats: Stats, correct: boolean, factor = 1): Stats & { gain: number } {
  const streak = correct ? stats.streak + 1 : 0;
  const gain = correct ? Math.round(gainFor(stats.streak) * factor) : 0;
  return { streak, best: Math.max(stats.best, streak), xp: stats.xp + gain, gain };
}
