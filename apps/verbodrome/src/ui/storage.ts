/** localStorage that never throws (private windows, blocked storage). */
export function read<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw === null ? fallback : JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export function write(key: string, value: unknown): void {
  try { localStorage.setItem(key, JSON.stringify(value)); } catch { /* storage unavailable: play on without saving */ }
}

export const KEYS = {
  /** Same key and shape as the design prototype: `{ xp, best }`. */
  stats: 'fr-conj-v1',
  selection: 'verbodrome-traject-v1',
  welcomed: 'verbodrome-welkom-v1',
} as const;
