/**
 * The staged French grammar against the frozen snapshot, section by section (plan 3, shadow mode). Every section not
 * listed in `shadow-pending.txt` must equal the frozen one; a query with no pending section must equal its frozen block
 * line for line. The pending list only shrinks: a listed section that now matches fails until it is removed, and
 * `FR_SHADOW_UPDATE=1 npx vitest run tests/fr/shadow.test.ts` rewrites the file with the listed sections that still
 * differ (it never adds one). Lower PINNED with it.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { expect, it } from 'vitest';
import { frenchQueries, frozenBlocks, queryHeader, sections, shadowFrench } from './shadow.js';

const PINNED = 25_134;

const pendingFile = new URL('./shadow-pending.txt', import.meta.url);
const pending = readFileSync(pendingFile, 'utf8').split('\n').filter(line => line !== '');
const update = process.env.FR_SHADOW_UPDATE === '1';

/** Where two sections first differ. */
function difference(key: string, expected: readonly string[], actual: readonly string[] | undefined): string {
  const lines = actual ?? [];
  let index = 0;
  while (index < expected.length && expected[index] === lines[index]) index++;
  return `${key}\n  was: ${expected[index] ?? '(end of section)'}\n  now: ${lines[index] ?? (actual ? '(end of section)' : '(no such section)')}`;
}

it('reproduces every frozen section that is not pending, and lists only sections that still differ', () => {
  const frozen = frozenBlocks();
  const listed = new Set(pending);
  const unknown = new Set(pending);
  const mismatches: string[] = [];
  const stale: string[] = [];
  const stillPending: string[] = [];
  for (const query of frenchQueries) {
    const header = queryHeader(query);
    const expected = frozen.get(header);
    if (!expected) throw new Error(`No frozen block for ${header}`);
    const actual = shadowFrench(query);
    const got = sections(actual);
    let anyPending = false;
    for (const [name, lines] of sections(expected)) {
      const key = `${header}\t${name}`;
      const same = JSON.stringify(lines) === JSON.stringify(got.get(name));
      if (listed.has(key)) {
        unknown.delete(key);
        anyPending = true;
        if (same) stale.push(key);
        else stillPending.push(key);
      } else if (!same) {
        mismatches.push(difference(key, lines, got.get(name)));
      }
    }
    if (!anyPending && JSON.stringify(expected) !== JSON.stringify(actual)) {
      const index = expected.findIndex((line, i) => line !== actual[i]);
      mismatches.push(`${header}: the block differs at line ${index < 0 ? expected.length : index}: ${actual[index < 0 ? expected.length : index] ?? '(end of block)'}`);
    }
  }
  if (update) writeFileSync(pendingFile, stillPending.map(key => `${key}\n`).join(''));
  expect([...unknown], 'pending entries that name no frozen section').toEqual([]);
  expect(mismatches.slice(0, 20), `${mismatches.length} sections differ from the frozen snapshot`).toEqual([]);
  if (!update) expect(stale.slice(0, 20), `${stale.length} sections now match: remove them from shadow-pending.txt (FR_SHADOW_UPDATE=1)`).toEqual([]);
  expect(pending.length).toBeLessThanOrEqual(PINNED);
}, 600_000);
