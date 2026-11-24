import { readFileSync } from 'node:fs';
import { gunzipSync } from 'node:zlib';
import { describe, expect, it } from 'vitest';
import { characterize, queryHeader } from '../scripts/characterize/serialize.ts';
import type { CharacterizationQuery, IntendedDiff } from '../scripts/characterize/serialize.ts';

const FR_QUERY_COUNT = 1003;
const NL_QUERY_COUNT = 1478;

const directory = new URL('./characterization/', import.meta.url);
const read = (name: string): string => readFileSync(new URL(name, directory), 'utf8');
const queries = {
  fr: JSON.parse(read('fr.queries.json')) as CharacterizationQuery[],
  nl: JSON.parse(read('nl.queries.json')) as CharacterizationQuery[],
};
const ledger = JSON.parse(read('intended-diffs.json')) as IntendedDiff[];

/** Splits a stored .tsv.gz into its blocks, keyed by header line. */
function blocksOf(language: 'fr' | 'nl'): Map<string, string[]> {
  const blocks = new Map<string, string[]>();
  for (const block of gunzipSync(readFileSync(new URL(`${language}.tsv.gz`, directory))).toString('utf8').split('\n\n')) {
    const lines = block.replace(/\n$/u, '').split('\n');
    blocks.set(lines[0] ?? '', lines);
  }
  return blocks;
}

/** Where an added line goes: after its `after` line, after the analysis line when `after` is null, else at the end. */
function insertionIndex(lines: readonly string[], diff: IntendedDiff, header: string): number {
  if (diff.after === undefined) return lines.length;
  const anchor = diff.after === null ? lines.findIndex(line => line.startsWith('A\t')) : lines.indexOf(diff.after);
  if (anchor < 0) {
    throw new Error(`Ledger entry for ${header} inserts after ${diff.after === null ? 'the analysis line' : `a line the block does not have: ${diff.after}`}`);
  }
  return anchor + 1;
}

/** One block with the entries of its query applied, in ledger order; counts each application in `applied`. */
function applyEntries(entries: readonly IntendedDiff[], stored: readonly string[], applied: Map<IntendedDiff, number>): string[] {
  const header = stored[0] ?? '';
  const lines = [...stored];
  for (const diff of entries.filter(entry => entry.query === header)) {
    applied.set(diff, (applied.get(diff) ?? 0) + 1);
    if (diff.was === null) {
      if (diff.now !== null) lines.splice(insertionIndex(lines, diff, header), 0, diff.now);
      continue;
    }
    if (diff.after !== undefined) throw new Error(`Ledger entry for ${header} replaces or removes a line but sets after: ${diff.was}`);
    const index = lines.indexOf(diff.was);
    if (index < 0) throw new Error(`Ledger entry for ${header} does not match a frozen line: ${diff.was}`);
    if (diff.now === null) lines.splice(index, 1);
    else lines[index] = diff.now;
  }
  return lines;
}

/** The blocks with the ledger applied (a missing block stays missing), and how often each entry was applied. */
function applyLedger(entries: readonly IntendedDiff[], blocks: readonly (readonly string[] | undefined)[]) {
  const applied = new Map<IntendedDiff, number>();
  return { blocks: blocks.map(block => block && applyEntries(entries, block, applied)), applied };
}

/** Each entry applied other than exactly once, described. */
function misapplied(entries: readonly IntendedDiff[], applied: ReadonlyMap<IntendedDiff, number>): string[] {
  return entries.flatMap(entry => {
    const count = applied.get(entry) ?? 0;
    return count === 1 ? [] : [`${entry.query}: applied ${count} times, not once: ${entry.was ?? entry.now}`];
  });
}

/** Where `actual` first differs from `expected`, or null when they are equal; past the end of a block is `(end of block)`. */
function firstDifference(header: string, expected: readonly string[], actual: readonly string[]): string | null {
  const length = Math.max(expected.length, actual.length);
  let index = 0;
  while (index < length && expected[index] === actual[index]) index++;
  if (index === length) return null;
  return `${header}\n  was: ${expected[index] ?? '(end of block)'}\n  now: ${actual[index] ?? '(end of block)'}`;
}

/** A language's frozen blocks in query order with the ledger applied: what the per-language test and the ledger test both read. */
function expectedBlocks(language: 'fr' | 'nl') {
  const stored = blocksOf(language);
  return { stored: stored.size, ...applyLedger(ledger, queries[language].map(query => stored.get(queryHeader(query)))) };
}

describe.each(['fr', 'nl'] as const)('characterization: %s', language => {
  it('reproduces the frozen output, apart from recorded intended differences', () => {
    const { stored, blocks } = expectedBlocks(language);
    expect(stored).toBe(queries[language].length);
    const mismatches: string[] = [];
    queries[language].forEach((query, index) => {
      const header = queryHeader(query);
      const expected = blocks[index];
      if (!expected) {
        mismatches.push(`no frozen block: ${header}`);
        return;
      }
      const difference = firstDifference(header, expected, characterize(query));
      if (difference !== null) mismatches.push(difference);
    });
    expect(mismatches.slice(0, 20), `${mismatches.length} queries differ`).toEqual([]);
  }, 120_000);
});

describe('characterization helpers', () => {
  it('records errors as E lines', () => {
    expect(characterize({ language: 'fr', infinitive: 'plotoir' })).toEqual(['# {"infinitive":"plotoir","language":"fr"}', 'E\tAMBIGUOUS_CLASSIFICATION']);
  });

  it('sorts header keys recursively', () => {
    expect(queryHeader({ language: 'nl', infinitive: 'zorpen', stems: { stem: 'zorp', pastPlural: 'zurpen' } }))
      .toBe('# {"infinitive":"zorpen","language":"nl","stems":{"pastPlural":"zurpen","stem":"zorp"}}');
  });

  it('serializes analysis, forms and unavailable targets', () => {
    const lines = characterize({ language: 'fr', infinitive: 'aller', mood: 'indicative', tense: 'perfect', person: 1, number: 'singular', gender: 'masculine' });
    expect(lines[1]).toBe('A\taller\taller\tlexicon\t0\têtre\t-');
    expect(lines[2]).toBe('F\tindicative/perfect/1/singular/masculine/masculine.singular\tje suis allé\tsav\tboth\têtre\t-\tstandard\t-\t1');
    expect(characterize({ language: 'fr', infinitive: 'pleuvoir', mood: 'indicative', tense: 'present', person: 1, number: 'singular' }).at(-1))
      .toMatch(/^U\tindicative\/present\/1\/singular\t/u);
  });
});

describe('characterization ledger', () => {
  it('keeps a sourced ledger with no unused entries', () => {
    expect(ledger).toHaveLength(0); // pinned; raised deliberately by later plans
    for (const entry of ledger) {
      expect(entry.reason.length, entry.query).toBeGreaterThan(30);
      expect(entry.source.startsWith('https://'), entry.query).toBe(true);
    }
  });

  it('applies every ledger entry exactly once', () => {
    // Computed here, from the same helper the per-language tests use, so it holds whatever runs first or alone.
    const applied = new Map<IntendedDiff, number>();
    for (const language of ['fr', 'nl'] as const) {
      for (const [entry, count] of expectedBlocks(language).applied) applied.set(entry, (applied.get(entry) ?? 0) + count);
    }
    expect(misapplied(ledger, applied)).toEqual([]);
  });

  it('pins the query inventory', () => {
    expect(queries.fr.length).toBe(FR_QUERY_COUNT);
    expect(queries.nl.length).toBe(NL_QUERY_COUNT);
  });
});

describe('characterization ledger mechanics', () => {
  const header = '# {"infinitive":"zorpen","language":"nl"}';
  const block = [header, 'A\tzorpen\tweak\tregularRule\t0\thebben\t-', 'F\tone', 'F\ttwo', 'U\tthree'];
  const entry = (fields: Partial<IntendedDiff>): IntendedDiff =>
    ({ query: header, was: null, now: null, reason: 'synthetic', source: 'https://example.org/', ...fields });

  it('replaces, removes and inserts lines, in ledger order', () => {
    const entries = [
      entry({ was: 'F\tone', now: 'F\tone*' }),
      entry({ was: 'U\tthree', now: null }),
      entry({ was: null, now: 'F\tafter one', after: 'F\tone*' }),
      entry({ was: null, now: 'F\tfirst', after: null }),
      entry({ was: null, now: 'U\tlast' }),
    ];
    const { blocks, applied } = applyLedger(entries, [block, undefined]);
    expect(blocks).toEqual([[header, block[1], 'F\tfirst', 'F\tone*', 'F\tafter one', 'F\ttwo', 'U\tlast'], undefined]);
    expect(misapplied(entries, applied)).toEqual([]);
    expect(block).toEqual([header, 'A\tzorpen\tweak\tregularRule\t0\thebben\t-', 'F\tone', 'F\ttwo', 'U\tthree']);
  });

  it('detects an entry that is never applied and one applied twice', () => {
    const unused = entry({ query: '# {"infinitive":"elders","language":"nl"}', was: 'F\tone', now: 'F\tz' });
    const twice = entry({ was: 'F\ttwo', now: null });
    const { applied } = applyLedger([unused, twice], [block, block]);
    expect(misapplied([unused, twice], applied)).toEqual([
      '# {"infinitive":"elders","language":"nl"}: applied 0 times, not once: F\tone',
      `${header}: applied 2 times, not once: F\ttwo`,
    ]);
  });

  it('rejects an entry whose line is not in the block', () => {
    expect(() => applyLedger([entry({ was: 'F\tmissing', now: 'F\tx' })], [block])).toThrow('does not match a frozen line: F\tmissing');
    expect(() => applyLedger([entry({ was: null, now: 'F\tx', after: 'F\tmissing' })], [block])).toThrow('F\tmissing');
    expect(() => applyLedger([entry({ was: 'F\tone', now: 'F\tx', after: 'F\ttwo' })], [block])).toThrow('after');
  });

  it('shows the first line that differs, also when one block is a prefix of the other', () => {
    expect(firstDifference(header, ['a', 'b', 'c'], ['a', 'b', 'c'])).toBeNull();
    expect(firstDifference(header, ['a', 'b', 'c'], ['a', 'x', 'c'])).toBe(`${header}\n  was: b\n  now: x`);
    expect(firstDifference(header, ['a', 'b', 'c'], ['a', 'b'])).toBe(`${header}\n  was: c\n  now: (end of block)`);
    expect(firstDifference(header, ['a', 'b'], ['a', 'b', 'c'])).toBe(`${header}\n  was: (end of block)\n  now: c`);
  });
});
