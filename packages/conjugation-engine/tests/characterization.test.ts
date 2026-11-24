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
const applied = new Map<IntendedDiff, number>();

/** Splits a stored .tsv.gz into its blocks, keyed by header line. */
function blocksOf(language: 'fr' | 'nl'): Map<string, string[]> {
  const blocks = new Map<string, string[]>();
  for (const block of gunzipSync(readFileSync(new URL(`${language}.tsv.gz`, directory))).toString('utf8').split('\n\n')) {
    const lines = block.replace(/\n$/u, '').split('\n');
    blocks.set(lines[0] ?? '', lines);
  }
  return blocks;
}

/** The stored block with the recorded intended differences of its query applied. */
function expectedBlock(header: string, stored: readonly string[]): string[] {
  const lines = [...stored];
  for (const diff of ledger.filter(entry => entry.query === header)) {
    applied.set(diff, (applied.get(diff) ?? 0) + 1);
    if (diff.was === null) {
      if (diff.now !== null) lines.push(diff.now);
      continue;
    }
    const index = lines.indexOf(diff.was);
    if (index < 0) throw new Error(`Ledger entry for ${header} does not match a frozen line: ${diff.was}`);
    if (diff.now === null) lines.splice(index, 1);
    else lines[index] = diff.now;
  }
  return lines;
}

describe.each(['fr', 'nl'] as const)('characterization: %s', language => {
  it('reproduces the frozen output, apart from recorded intended differences', () => {
    const blocks = blocksOf(language);
    expect(blocks.size).toBe(queries[language].length);
    const mismatches: string[] = [];
    for (const query of queries[language]) {
      const header = queryHeader(query);
      const stored = blocks.get(header);
      if (!stored) {
        mismatches.push(`no frozen block: ${header}`);
        continue;
      }
      const actual = characterize(query);
      const expected = expectedBlock(header, stored);
      if (actual.length !== expected.length || actual.some((line, index) => line !== expected[index])) {
        const index = actual.findIndex((line, at) => line !== expected[at]);
        mismatches.push(`${header}\n  was: ${expected[index] ?? '(end of block)'}\n  now: ${actual[index] ?? '(end of block)'}`);
      }
    }
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
    // runs after the per-language tests above, which populate `applied`
    for (const entry of ledger) expect(applied.get(entry), entry.query).toBe(1);
  });

  it('pins the query inventory', () => {
    expect(queries.fr.length).toBe(FR_QUERY_COUNT);
    expect(queries.nl.length).toBe(NL_QUERY_COUNT);
  });
});
