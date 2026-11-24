import type { ResolvedTarget } from '../types.js';

/** Identifies a catalogue slot. The voice takes part only when the target has one, so voiceless keys keep their old form. */
export function targetKey(target: ResolvedTarget): string {
  const key = `${target.mood}/${target.tense}/${target.person ?? '-'}/${target.number ?? '-'}`;
  return target.voice ? `${key}/${target.voice}` : key;
}

/** Identifies a resolved target. Voice and agreement case are appended only when present, so other keys keep their old form. */
export function resolvedTargetKey(target: ResolvedTarget): string {
  const key: unknown[] = [
    target.mood, target.tense, target.person, target.number, target.gender,
    target.agreement?.gender ?? null, target.agreement?.number ?? null,
  ];
  const extra: Record<string, string> = {};
  if (target.voice) extra.voice = target.voice;
  if (target.agreement?.case) extra.case = target.agreement.case;
  if (Object.keys(extra).length) key.push(extra);
  return JSON.stringify(key);
}
