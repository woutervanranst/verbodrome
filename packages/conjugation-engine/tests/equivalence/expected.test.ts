/** The pinned lookups of every file in `expectations/` (one per language, `core.ts` for French and Dutch). */
import { readdirSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { equivalentTenses } from '../../src/equivalence/index.js';
import type { Expectation } from './expectations/types.js';

const directory = new URL('./expectations/', import.meta.url);
const files = readdirSync(directory).filter(name => name.endsWith('.ts') && name !== 'types.ts').sort();
const loaded = await Promise.all(files.map(async name =>
  [name, (await import(new URL(name, directory).href) as { expectations: readonly Expectation[] }).expectations] as const));

function ref(key: string): Parameters<typeof equivalentTenses>[2] {
  const dot = key.indexOf('.');
  return { mood: key.slice(0, dot), tense: key.slice(dot + 1) } as Parameters<typeof equivalentTenses>[2];
}

const keyOf = (tense: { readonly mood: string; readonly tense: string } | undefined): string | undefined => tense && `${tense.mood}.${tense.tense}`;

describe.each(loaded)('expectations/%s', (_, rows) => {
  for (const row of rows) it(`${row[0]} ${row[1]} -> ${row[2]}`, () => {
    const [from, tense, to, top, score, match, extra = {}] = row;
    const result = equivalentTenses(from, to, ref(tense));
    if (match === 'none') {
      expect([top, score, result.matches]).toEqual([null, 0, []]);
      expect(result.notes).toEqual(extra.notes ?? []);
      return;
    }
    const [first, second] = result.matches;
    expect({ top: keyOf(first?.tense), score: first?.score, match: first?.match, relaxed: first?.relaxed, notes: first?.notes })
      .toEqual({ top, score, match, relaxed: extra.relaxed ?? [], notes: extra.notes ?? [] });
    expect(keyOf(second?.tense)).toBe(extra.second);
    expect(result.notes).toEqual([]);
  });
});
