/**
 * The Dutch staged grammar, run beside the legacy resolver that still serves `conjugate`. A shadow engine conjugates
 * every query of the frozen Dutch snapshot with the staged grammar, and each must reproduce its frozen block exactly,
 * except the queries listed in `shadow-pending.txt` (one header line each, in snapshot order). Every stage is migrated,
 * so the list is empty and PINNED is 0: the list may only shrink. Dutch switches to the staged grammar when the legacy
 * resolver goes; this test goes with it.
 */
import { readFileSync } from 'node:fs';
import { gunzipSync } from 'node:zlib';
import { describe, expect, it } from 'vitest';
import { characterize, queryHeader } from '../../scripts/characterize/serialize.ts';
import type { CharacterizationQuery } from '../../scripts/characterize/serialize.ts';
import { engine as legacyEngine } from '../../src/default-engine.js';
import { dutchSubjects } from '../../src/languages/nl/catalogue.js';
import type { ResolvedTarget } from '../../src/types.js';
import { shadowDutch } from './shadow-engine.js';

/** How many snapshot queries the staged grammar does not reproduce yet; it may only be lowered. */
const PINNED = 0;

const directory = new URL('../characterization/', import.meta.url);
const queries = new Map((JSON.parse(readFileSync(new URL('nl.queries.json', directory), 'utf8')) as CharacterizationQuery[])
  .map(query => [queryHeader(query), query] as const));
const headers = [...queries.keys()];
const frozen = new Map(gunzipSync(readFileSync(new URL('nl.tsv.gz', directory))).toString('utf8').split('\n\n').map(block => {
  const lines = block.replace(/\n$/u, '').split('\n');
  return [lines[0] ?? '', lines] as const;
}));
const pendingLines = readFileSync(new URL('./shadow-pending.txt', import.meta.url), 'utf8').split('\n').filter(line => line !== '');
const pending = new Set(pendingLines);

/** Where the shadow block of a query first differs from its frozen block, or null when they are equal. */
function difference(header: string): string | null {
  let block: string[];
  try {
    block = characterize(queries.get(header)!, shadowDutch);
  } catch (error) {
    return `throws ${error instanceof Error ? `${error.name}: ${error.message}` : String(error)}`;
  }
  const expected = frozen.get(header) ?? [];
  const length = Math.max(block.length, expected.length);
  let at = 0;
  while (at < length && block[at] === expected[at]) at++;
  return at === length ? null : `differs at line ${at}: was ${expected[at] ?? '(end of block)'}, now ${block[at] ?? '(end of block)'}`;
}

describe('Dutch shadow engine', () => {
  it('lists only snapshot queries as pending, each once and in snapshot order', () => {
    expect(pendingLines.length).toBe(pending.size);
    expect(pendingLines).toEqual(headers.filter(header => pending.has(header)));
  });

  it('only ever shrinks its pending list', () => {
    expect(pending.size).toBeLessThanOrEqual(PINNED);
  });

  it('reproduces the frozen block of every query that is not pending', () => {
    const mismatches = headers.filter(header => !pending.has(header)).flatMap(header => {
      const found = difference(header);
      return found === null ? [] : [`${header}: ${found}`];
    });
    expect(mismatches.slice(0, 20), `${mismatches.length} queries differ`).toEqual([]);
  });

  it('keeps a query pending only while it still differs', () => {
    const stale = pendingLines.filter(header => difference(header) === null);
    expect(stale, 'these now match: delete them from shadow-pending.txt and lower PINNED').toEqual([]);
  });

  it.each([undefined, 'ik', 'jij', 'je', 'u', 'hij', 'zij', 'ze', 'het', 'wij', 'we', 'jullie'])(
    'expands the targets of the legacy pronoun option through subject slots: %s',
    pronoun => {
      const options = { language: 'nl', infinitive: 'werken', ...(pronoun === undefined ? {} : { pronoun }) };
      const withoutSubject = (targets: readonly ResolvedTarget[]) => targets.map(({ subject: _, ...target }) => target);
      const staged = shadowDutch.expandTargets(options);
      expect(withoutSubject(staged)).toEqual(legacyEngine.expandTargets(options));
      const slots = new Set(staged.flatMap(target => target.subject === undefined ? [] : [target.subject]));
      const pronouns = new Set(dutchSubjects.filter(slot => slots.has(slot.id)).map(slot => slot.pronoun));
      expect([...pronouns]).toEqual(pronoun === undefined ? ['ik', 'jij', 'hij', 'wij', 'jullie', 'zij'] : [pronoun]);
    },
  );
});
