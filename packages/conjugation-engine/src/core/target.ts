import type { ResolvedTarget } from '../types.js';

/**
 * Identifies a catalogue slot. The voice and then the subject id take part only when the target has them, so keys
 * without them keep their old form.
 */
export function targetKey(target: ResolvedTarget): string {
  const key = `${target.mood}/${target.tense}/${target.person ?? '-'}/${target.number ?? '-'}`;
  return [key, ...(target.voice ? [target.voice] : []), ...(target.subject ? [target.subject] : [])].join('/');
}

/**
 * Identifies a resolved target. Voice, agreement case and subject id are appended only when present, so other keys
 * keep their old form.
 */
export function resolvedTargetKey(target: ResolvedTarget): string {
  const key: unknown[] = [
    target.mood, target.tense, target.person, target.number, target.gender,
    target.agreement?.gender ?? null, target.agreement?.number ?? null,
  ];
  const extra: Record<string, string> = {};
  if (target.voice) extra.voice = target.voice;
  if (target.agreement?.case) extra.case = target.agreement.case;
  if (target.subject) extra.subject = target.subject;
  if (Object.keys(extra).length) key.push(extra);
  return JSON.stringify(key);
}
