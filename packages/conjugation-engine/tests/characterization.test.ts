/**
 * The characterization snapshots: the complete output of `conjugate` for every query in
 * `characterization/<language>.queries.json`, frozen in `characterization/<language>.tsv.gz` (written once by
 * `npm run characterize:write`, never regenerated). The current engine must reproduce each frozen block, apart from the
 * intended differences recorded in `characterization/intended-diffs.json`, each with its reason and source, in one of
 * three forms:
 * - a line-level entry `{ query, was, now, after?, reason, source }` replaces, removes or adds one line of the frozen
 *   block of `query`;
 * - a block-level entry `{ query, block: true, reason, source }` supersedes the whole frozen block of `query` by the
 *   block with the same header in `characterization/<language>.accepted.tsv.gz` (same line format and gzip as the frozen
 *   file), written from the current engine by `npm run characterize:accept`;
 * - a sentence-level entry `{ sentence: { was, now }, reason, source }` rewords the assumption sentence `was` into `now`
 *   (or removes it when `now` is null) in the analysis line of every block that lists it, after the line-level entries
 *   of the block and never in an accepted block: for a sentence reworded throughout the snapshot.
 * Every accepted block has exactly one block-level entry and every block-level entry one accepted block; a query has
 * either one block-level entry or only line-level ones; every line-level and block-level entry is used exactly once and
 * every sentence-level entry at least once. The number of entries of each form is pinned, so a change to the ledger is
 * deliberate. The ledger lists the line-level and block-level entries sorted by query, then the sentence-level entries
 * sorted by the sentence they reword.
 */
import { existsSync, readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { characterize, isBlockDiff, isSentenceDiff, queryHeader, replaceSentence, snapshotBlocks, snapshotFile } from '../scripts/characterize/serialize.ts';
import type { BlockDiff, CharacterizationQuery, IntendedDiff, LineDiff, SentenceDiff } from '../scripts/characterize/serialize.ts';

const FR_QUERY_COUNT = 1003;
const NL_QUERY_COUNT = 1478;
/**
 * Pinned: the analysis lines of the 11 Dutch verbs the lexicon lists with an unstressed prefix, which no longer record
 * the assumptions for an unlisted verb (final review fix wave), 4 queries each; and the 165 French lines of the
 * whitelist probes of GD §9.3 (bleder, crebler, pequer: è before a mute ending; blettre: one t in the singular).
 */
const LINE_ENTRY_COUNT = 44 + 912;
/**
 * Pinned: the Dutch queries of the two approved behaviour changes of the staged switch (56), of the lexicon
 * corrections of wrong Dutch that followed it (44), and of the unstressed prefix read from the spelling of an unlisted
 * verb (bezorpelen, verzorpen: 8).
 */
const BLOCK_ENTRY_COUNT = 108;
/** Pinned: the Dutch default-unprefixed sentence, reworded because it was no longer true (final review fix wave). */
const SENTENCE_ENTRY_COUNT = 1;

const directory = new URL('./characterization/', import.meta.url);
const read = (name: string): string => readFileSync(new URL(name, directory), 'utf8');
const queries = {
  fr: JSON.parse(read('fr.queries.json')) as CharacterizationQuery[],
  nl: JSON.parse(read('nl.queries.json')) as CharacterizationQuery[],
};
const ledger = JSON.parse(read('intended-diffs.json')) as IntendedDiff[];

/** The frozen blocks of a language, keyed by header line. */
const frozenBlocks = (language: 'fr' | 'nl') => snapshotBlocks(readFileSync(new URL(`${language}.tsv.gz`, directory)));

/** The accepted blocks of a language, keyed by header line; none when it has no accepted file. */
function acceptedBlocks(language: 'fr' | 'nl'): Map<string, string[]> {
  const file = new URL(`${language}.accepted.tsv.gz`, directory);
  return existsSync(file) ? snapshotBlocks(readFileSync(file)) : new Map();
}

/** Where an added line goes: after its `after` line, after the analysis line when `after` is null, else at the end. */
function insertionIndex(lines: readonly string[], diff: LineDiff, header: string): number {
  if (diff.after === undefined) return lines.length;
  const anchor = diff.after === null ? lines.findIndex(line => line.startsWith('A\t')) : lines.indexOf(diff.after);
  if (anchor < 0) {
    throw new Error(`Ledger entry for ${header} inserts after ${diff.after === null ? 'the analysis line' : `a line the block does not have: ${diff.after}`}`);
  }
  return anchor + 1;
}

/**
 * One block with the entries of its query applied, counting each application in `applied`: the accepted block for a
 * block-level entry, else the frozen block with its line-level entries applied in ledger order.
 */
function applyEntries(entries: readonly IntendedDiff[], stored: readonly string[], accepted: ReadonlyMap<string, readonly string[]>,
  applied: Map<IntendedDiff, number>): string[] {
  const header = stored[0] ?? '';
  const own = entries.filter(entry => !isSentenceDiff(entry) && entry.query === header);
  const whole = own.filter(isBlockDiff);
  if (whole.length) {
    if (own.length > 1) throw new Error(`Ledger has a block-level entry for ${header} and ${own.length - 1} other entries`);
    const block = accepted.get(header);
    if (!block) throw new Error(`Ledger has a block-level entry for ${header}, but there is no accepted block for it`);
    applied.set(whole[0]!, (applied.get(whole[0]!) ?? 0) + 1);
    return [...block];
  }
  const lines = [...stored];
  for (const diff of own as readonly LineDiff[]) {
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
  for (const diff of entries.filter(isSentenceDiff)) {
    const index = lines.findIndex(line => replaceSentence(line, diff.sentence.was, diff.sentence.now) !== null);
    if (index < 0) continue;
    lines[index] = replaceSentence(lines[index]!, diff.sentence.was, diff.sentence.now)!;
    applied.set(diff, (applied.get(diff) ?? 0) + 1);
  }
  return lines;
}

/** The blocks with the ledger applied (a missing block stays missing), and how often each entry was applied. */
function applyLedger(entries: readonly IntendedDiff[], blocks: readonly (readonly string[] | undefined)[],
  accepted: ReadonlyMap<string, readonly string[]> = new Map()) {
  const applied = new Map<IntendedDiff, number>();
  return { blocks: blocks.map(block => block && applyEntries(entries, block, accepted, applied)), applied };
}

/** Each line-level or block-level entry applied other than exactly once, and each sentence-level entry never applied, described. */
function misapplied(entries: readonly IntendedDiff[], applied: ReadonlyMap<IntendedDiff, number>): string[] {
  return entries.flatMap(entry => {
    const count = applied.get(entry) ?? 0;
    if (isSentenceDiff(entry)) return count > 0 ? [] : [`sentence-level entry applied to no block: ${entry.sentence.was}`];
    return count === 1 ? [] : [`${entry.query}: applied ${count} times, not once: ${isBlockDiff(entry) ? '(block)' : entry.was ?? entry.now}`];
  });
}

/**
 * How the block-level entries and the accepted blocks fail to pair up, described: an accepted block without exactly
 * one block-level entry, a block-level entry without an accepted block, and a query with a block-level entry and other
 * entries.
 */
function unpaired(entries: readonly IntendedDiff[], accepted: ReadonlyMap<string, readonly string[]>): string[] {
  const blockEntries = entries.filter(isBlockDiff);
  return [
    ...[...accepted.keys()].flatMap(header => {
      const count = blockEntries.filter(entry => entry.query === header).length;
      return count === 1 ? [] : [`${header}: accepted block with ${count} block-level entries, not one`];
    }),
    ...blockEntries.filter(entry => !accepted.has(entry.query)).map(entry => `${entry.query}: block-level entry without an accepted block`),
    ...[...new Set(blockEntries.map(entry => entry.query))].flatMap(header => {
      const others = entries.filter(entry => !isSentenceDiff(entry) && entry.query === header).length - 1;
      return others ? [`${header}: block-level entry with ${others} other entries`] : [];
    }),
  ];
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
  const stored = frozenBlocks(language);
  return { stored: stored.size, ...applyLedger(ledger, queries[language].map(query => stored.get(queryHeader(query))), acceptedBlocks(language)) };
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

  it('writes a snapshot file as the same bytes every time, and reads it back block by block', () => {
    const blocks = [['# {"infinitive":"a","language":"nl"}', 'E\tX'], ['# {"infinitive":"b","language":"nl"}', 'A\tb', 'F\tc']];
    expect(snapshotFile(blocks).equals(snapshotFile(blocks))).toBe(true);
    expect([...snapshotBlocks(snapshotFile(blocks)).values()]).toEqual(blocks);
    expect(() => snapshotBlocks(snapshotFile([blocks[0]!, blocks[0]!]))).toThrow('two blocks');
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
  it('keeps a sourced ledger, sorted, with pinned counts of each form', () => {
    expect(ledger.filter(entry => !isBlockDiff(entry) && !isSentenceDiff(entry))).toHaveLength(LINE_ENTRY_COUNT);
    expect(ledger.filter(isBlockDiff)).toHaveLength(BLOCK_ENTRY_COUNT);
    expect(ledger.filter(isSentenceDiff)).toHaveLength(SENTENCE_ENTRY_COUNT);
    for (const entry of ledger) {
      const label = isSentenceDiff(entry) ? entry.sentence.was : entry.query;
      expect(entry.reason.length, label).toBeGreaterThan(30);
      expect(entry.source.startsWith('https://'), label).toBe(true);
    }
    const key = (entry: IntendedDiff) => (isSentenceDiff(entry) ? `~${entry.sentence.was}` : entry.query);
    const order = ledger.map(key);
    expect(order).toEqual([...order].sort((a, b) => (a < b ? -1 : a > b ? 1 : 0)));
  });

  it('pairs every accepted block with exactly one block-level entry, and the other way round', () => {
    const accepted = new Map([...acceptedBlocks('fr'), ...acceptedBlocks('nl')]);
    expect(accepted.size).toBe(acceptedBlocks('fr').size + acceptedBlocks('nl').size);
    expect(unpaired(ledger, accepted)).toEqual([]);
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
  const entry = (fields: Partial<LineDiff>): LineDiff =>
    ({ query: header, was: null, now: null, reason: 'synthetic', source: 'https://example.org/', ...fields });
  const whole = (query = header): BlockDiff => ({ query, block: true, reason: 'synthetic', source: 'https://example.org/' });

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

  describe('block-level entries', () => {
    const acceptedBlock = [header, 'A\tzorpen\tweak\tregularRule\t0\thebben\tnew', 'F\tnew'];
    const accepted = new Map([[header, acceptedBlock]]);

    it('supersede the whole frozen block by the accepted block, once', () => {
      const entries = [whole()];
      const { blocks, applied } = applyLedger(entries, [block], accepted);
      expect(blocks).toEqual([acceptedBlock]);
      expect(misapplied(entries, applied)).toEqual([]);
      expect(unpaired(entries, accepted)).toEqual([]);
      // A block without an entry keeps its frozen lines, whatever is accepted.
      expect(applyLedger([], [block], accepted).blocks).toEqual([block]);
    });

    it('fail without an accepted block, and an accepted block fails without exactly one entry', () => {
      expect(() => applyLedger([whole()], [block])).toThrow('there is no accepted block');
      expect(unpaired([whole()], new Map())).toEqual([`${header}: block-level entry without an accepted block`]);
      expect(unpaired([], accepted)).toEqual([`${header}: accepted block with 0 block-level entries, not one`]);
      expect(unpaired([whole(), whole()], accepted)).toEqual([
        `${header}: accepted block with 2 block-level entries, not one`, `${header}: block-level entry with 1 other entries`,
      ]);
    });

    it('cannot be mixed with line-level entries for the same query', () => {
      const entries = [whole(), entry({ was: 'F\tone', now: 'F\tx' })];
      expect(() => applyLedger(entries, [block], accepted)).toThrow('a block-level entry for');
      expect(unpaired(entries, accepted)).toEqual([`${header}: block-level entry with 1 other entries`]);
    });

    it('count as unused when their query is not in the snapshot', () => {
      const elsewhere = whole('# {"infinitive":"elders","language":"nl"}');
      const { applied } = applyLedger([elsewhere], [block], accepted);
      expect(misapplied([elsewhere], applied)).toEqual(['# {"infinitive":"elders","language":"nl"}: applied 0 times, not once: (block)']);
    });
  });

  describe('sentence-level entries', () => {
    const analysis = 'A\tzorpen\tweak\tregularRule\t0\thebben\tOld one. | Kept.';
    const withSentence = [header, analysis, 'F\tone'];
    const reword = (was: string, now: string | null): SentenceDiff => ({ sentence: { was, now }, reason: 'synthetic', source: 'https://example.org/' });

    it('reword or remove a sentence in the analysis line of every block that lists it', () => {
      const other = ['# {"infinitive":"elders","language":"nl"}', 'A\telders\tweak\tregularRule\t0\thebben\tOld one.', 'F\ttwo'];
      const entries = [reword('Old one.', 'New one.')];
      const { blocks, applied } = applyLedger(entries, [withSentence, other, block]);
      expect(blocks).toEqual([
        [header, 'A\tzorpen\tweak\tregularRule\t0\thebben\tNew one. | Kept.', 'F\tone'],
        ['# {"infinitive":"elders","language":"nl"}', 'A\telders\tweak\tregularRule\t0\thebben\tNew one.', 'F\ttwo'],
        block,
      ]);
      expect(applied.get(entries[0]!)).toBe(2);
      expect(misapplied(entries, applied)).toEqual([]);
      expect(applyLedger([reword('Old one.', null)], [withSentence, other]).blocks).toEqual([
        [header, 'A\tzorpen\tweak\tregularRule\t0\thebben\tKept.', 'F\tone'],
        ['# {"infinitive":"elders","language":"nl"}', 'A\telders\tweak\tregularRule\t0\thebben\t-', 'F\ttwo'],
      ]);
    });

    it('match whole sentences only, and fail when they match no block', () => {
      const partial = reword('Old', 'New');
      const { blocks, applied } = applyLedger([partial], [withSentence]);
      expect(blocks).toEqual([withSentence]);
      expect(misapplied([partial], applied)).toEqual(['sentence-level entry applied to no block: Old']);
    });

    it('apply after the line-level entries of a block, and never to an accepted block', () => {
      const replaced = 'A\tzorpen\tweak\tregularRule\t0\thebben\tOld one.';
      const line = entry({ was: analysis, now: replaced });
      expect(applyLedger([line, reword('Old one.', 'New one.')], [withSentence]).blocks)
        .toEqual([[header, 'A\tzorpen\tweak\tregularRule\t0\thebben\tNew one.', 'F\tone']]);
      const acceptedBlock = [header, 'A\tzorpen\tweak\tregularRule\t0\thebben\tOld one.'];
      expect(applyLedger([whole(), reword('Old one.', 'New one.')], [withSentence], new Map([[header, acceptedBlock]])).blocks).toEqual([acceptedBlock]);
    });

    it('leave lines other than the analysis line alone', () => {
      expect(replaceSentence('F\tOld one.', 'Old one.', 'New.')).toBeNull();
      expect(replaceSentence('A\tx\tweak\tlexicon\t0\thebben\t-', 'Old one.', 'New.')).toBeNull();
    });
  });

  it('shows the first line that differs, also when one block is a prefix of the other', () => {
    expect(firstDifference(header, ['a', 'b', 'c'], ['a', 'b', 'c'])).toBeNull();
    expect(firstDifference(header, ['a', 'b', 'c'], ['a', 'x', 'c'])).toBe(`${header}\n  was: b\n  now: x`);
    expect(firstDifference(header, ['a', 'b', 'c'], ['a', 'b'])).toBe(`${header}\n  was: c\n  now: (end of block)`);
    expect(firstDifference(header, ['a', 'b'], ['a', 'b', 'c'])).toBe(`${header}\n  was: (end of block)\n  now: c`);
  });
});
