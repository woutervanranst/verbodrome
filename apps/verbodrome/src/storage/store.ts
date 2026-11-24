import { COACH, EMPTY_HISTORY } from '../trainer/coach';
import type { Answer, History, Review } from '../trainer/coach';
import type { Selection } from '../trainer/question';
import { sanitize } from '../trainer/selection';
import { browserStorage, read, remove, write } from './local';
import type { KeyValue } from './local';

/**
 * Everything verbodrome remembers on this device, in three documents under one
 * versioned prefix:
 *
 *   verbodrome:v2:settings  — what the learner chose to practise, and how they answer
 *   verbodrome:v2:progress  — XP and record streak
 *   verbodrome:v2:history   — the answer log and the questions waiting to be repeated
 *
 * Each document is validated when read, so a damaged or outdated value falls
 * back to its default instead of breaking the app. To change a shape, bump the
 * version and add a migration next to `migrateV1`.
 */
const PREFIX = 'verbodrome:v2';
export const KEYS = {
  settings: `${PREFIX}:settings`,
  progress: `${PREFIX}:progress`,
  history: `${PREFIX}:history`,
} as const;

/** Keys of the first version: loose values, one per concern. */
const V1 = { stats: 'fr-conj-v1', selection: 'verbodrome-traject-v1', welcomed: 'verbodrome-welkom-v1' } as const;

/** How the learner answers: pick one of the cards (multiple choice), or type the form. */
export type AnswerMode = 'cards' | 'typing';

export interface Settings {
  /** Null until the learner has chosen; the app then starts from its default level. */
  readonly selection: Selection | null;
  /** False on the very first visit, when the picker opens by itself. */
  readonly welcomed: boolean;
  readonly mode: AnswerMode;
}

export interface Progress {
  readonly xp: number;
  readonly best: number;
}

const isRecord = (value: unknown): value is Record<string, unknown> => typeof value === 'object' && value !== null;
const count = (value: unknown): number => typeof value === 'number' && Number.isFinite(value) && value > 0 ? Math.floor(value) : 0;
const text = (value: unknown): value is string => typeof value === 'string' && value.length > 0;

export function parseSettings(value: unknown): Settings {
  if (!isRecord(value)) return { selection: null, welcomed: false, mode: 'cards' };
  return { selection: sanitize(value.selection), welcomed: value.welcomed === true, mode: value.mode === 'typing' ? 'typing' : 'cards' };
}

export function parseProgress(value: unknown): Progress {
  return isRecord(value) ? { xp: count(value.xp), best: count(value.best) } : { xp: 0, best: 0 };
}

function parseAnswer(value: unknown): Answer | null {
  if (!isRecord(value) || !text(value.verb) || !text(value.tense) || !text(value.slot) || typeof value.ok !== 'boolean') return null;
  return {
    at: count(value.at), verb: value.verb, tense: value.tense, slot: value.slot, ok: value.ok,
    ...(text(value.pick) ? { pick: value.pick } : {}),
    ...(text(value.want) ? { want: value.want } : {}),
    ...(text(value.kind) ? { kind: value.kind } : {}),
    ...(value.review === true ? { review: true } : {}),
    ...(value.easy === true ? { easy: true } : {}),
    ...(value.typed === true ? { typed: true } : {}),
  };
}

function parseReview(value: unknown): Review | null {
  if (!isRecord(value) || !text(value.verb) || !text(value.tense) || !text(value.slot) || !text(value.pick) || !text(value.kind)) return null;
  return {
    verb: value.verb, tense: value.tense, slot: value.slot, due: count(value.due),
    stage: value.stage === 1 ? 1 : 0, pick: value.pick, kind: value.kind, misses: Math.max(1, count(value.misses)),
  };
}

const list = <T>(value: unknown, parse: (item: unknown) => T | null): T[] =>
  Array.isArray(value) ? value.map(parse).filter((item): item is T => item !== null) : [];

export function parseHistory(value: unknown): History {
  if (!isRecord(value)) return EMPTY_HISTORY;
  const answers = list(value.answers, parseAnswer).slice(-COACH.maxAnswers);
  return { count: Math.max(count(value.count), answers.length), answers, reviews: list(value.reviews, parseReview) };
}

export interface Store {
  loadSettings(): Settings;
  saveSettings(settings: Settings): void;
  loadProgress(): Progress;
  saveProgress(progress: Progress): void;
  loadHistory(): History;
  saveHistory(history: History): void;
  /** Forget results (progress and history); what the learner chose to practise stays. */
  clearResults(): void;
}

/** Carry the first version's values over, once, and remove them. */
function migrateV1(storage: KeyValue | null): void {
  if (!storage || storage.getItem(KEYS.settings) !== null) return;
  const selection = read(storage, V1.selection);
  const welcomed = read(storage, V1.welcomed);
  const stats = read(storage, V1.stats);
  if (selection === null && welcomed === null && stats === null) return;
  write(storage, KEYS.settings, { selection, welcomed: welcomed === true, mode: 'cards' });
  write(storage, KEYS.progress, parseProgress(stats));
  for (const key of Object.values(V1)) remove(storage, key);
}

export function createStore(storage: KeyValue | null = browserStorage()): Store {
  try { migrateV1(storage); } catch { /* a failed migration only loses old preferences */ }
  return {
    loadSettings: () => parseSettings(read(storage, KEYS.settings)),
    saveSettings: settings => write(storage, KEYS.settings, settings),
    loadProgress: () => parseProgress(read(storage, KEYS.progress)),
    saveProgress: progress => write(storage, KEYS.progress, { xp: progress.xp, best: progress.best }),
    loadHistory: () => parseHistory(read(storage, KEYS.history)),
    saveHistory: history => write(storage, KEYS.history, history),
    clearResults: () => { remove(storage, KEYS.progress); remove(storage, KEYS.history); },
  };
}
