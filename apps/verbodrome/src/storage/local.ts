/** The slice of the Web Storage API the app needs; tests pass an in-memory one. */
export interface KeyValue {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

/** The browser's localStorage, or null where it is unavailable (private windows, blocked storage). */
export function browserStorage(): KeyValue | null {
  try { return typeof localStorage === 'undefined' ? null : localStorage; } catch { return null; }
}

/** Read JSON without ever throwing. */
export function read(storage: KeyValue | null, key: string): unknown {
  try {
    const raw = storage?.getItem(key);
    return raw === null || raw === undefined ? null : JSON.parse(raw);
  } catch {
    return null;
  }
}

export function write(storage: KeyValue | null, key: string, value: unknown): void {
  try { storage?.setItem(key, JSON.stringify(value)); } catch { /* storage unavailable or full: play on without saving */ }
}

export function remove(storage: KeyValue | null, key: string): void {
  try { storage?.removeItem(key); } catch { /* nothing to do */ }
}
