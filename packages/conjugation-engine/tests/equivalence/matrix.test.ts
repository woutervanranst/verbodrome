/**
 * The whole equivalence matrix, checked in as `tests/equivalence/matrix.tsv` and read by a person: regenerate it with
 * `npm run equivalence:matrix` (never edit it by hand) and read the diff. The invariants below hold for every lookup.
 */
import { describe, expect, it } from 'vitest';
import { getCatalogue } from '../../src/catalogue.js';
import { concepts } from '../../src/equivalence/concepts.js';
import { equivalenceMatrix, maps } from '../../src/equivalence/index.js';
import { locales } from '../../src/i18n/locales/index.js';
import type { Language } from '../../src/types.js';
import { formatMatrix } from './matrix.js';

const rows = equivalenceMatrix();
const mapped = (Object.keys(maps) as Language[]).sort();

describe('the equivalence matrix', () => {
  it('matches the checked-in snapshot', async () => {
    await expect(formatMatrix(rows)).toMatchFileSnapshot('./matrix.tsv');
  });

  it('has one lookup for every source tense and target language, in canonical order', () => {
    const expected = mapped.flatMap(from => getCatalogue(from).flatMap(entry => mapped.map(to => `${from} ${entry.mood}.${entry.tense} ${to}`)));
    expect(rows.map(row => `${row.from} ${row.tense} ${row.to}`)).toEqual(expected);
  });

  it('answers a tense with itself first within its own language', () => {
    for (const row of rows.filter(row => row.from === row.to)) {
      expect(row.results.matches[0], `${row.from} ${row.tense}`).toMatchObject({ tense: row.tense, rank: 1, score: 1, match: 'exact' });
    }
  });

  it('never leaves a lookup without a match and without a note', () => {
    for (const { from, tense, to, results: { matches, notes } } of rows) {
      const where = `${from} ${tense} -> ${to}`;
      expect(matches.length > 0 || notes.length > 0, where).toBe(true);
      expect(notes.length > 0, `${where}: the lookup has notes exactly when it has no match`).toBe(matches.length === 0);
      if (matches.length === 0) expect(notes[0], where).toBe('eq.note.no-counterpart');
      for (const entry of matches) {
        if (entry.match === 'approximate') expect(entry.notes.length, `${where} ${entry.tense}`).toBeGreaterThan(0);
      }
    }
  });

  it('uses only notes that both locales define', () => {
    const used = new Set(rows.flatMap(row => [...row.results.notes, ...row.results.matches.flatMap(entry => entry.notes)]));
    for (const note of used) {
      expect(locales.en[note], note).toBeDefined();
      expect(locales.nl[note], note).toBeDefined();
    }
  });

  it('ranks 1 to n with scores that never rise', () => {
    for (const { from, tense, to, results: { matches } } of rows) {
      expect(matches.map(entry => entry.rank), `${from} ${tense} -> ${to}`).toEqual(matches.map((_, index) => index + 1));
      matches.forEach((entry, index) => {
        if (index > 0) expect(entry.score, `${from} ${tense} -> ${to} ${entry.tense}`).toBeLessThanOrEqual(matches[index - 1]!.score);
      });
    }
  });

  it('never relaxes finiteness, time, relative time or polarity', () => {
    for (const { from, tense, to, results: { matches } } of rows) {
      for (const { via, tense: target } of matches) {
        if (via === null) continue;
        const [source, found] = [concepts[via[0]], concepts[via[1]]];
        const where = `${from} ${tense} -> ${to} ${target} via ${via.join(' ')}`;
        expect([found.finiteness, found.time, found.relative, found.polarity], where)
          .toEqual([source.finiteness, source.time, source.relative, source.polarity]);
      }
    }
  });

  it('contains the sample lines of the plan', () => {
    const text = formatMatrix(rows);
    for (const line of [
      'fr\tindicative.perfect\tnl\tindicative.perfect 0.80 exact | indicative.past 0.70 exact\t- | eq.fr.perfect.spoken-past',
      'fr\tsubjunctive.imperfect\tnl\tindicative.past 1.00 approximate(mood) | indicative.perfect 0.60 approximate(aspect+mood)\teq.note.no-subjunctive | eq.nl.perfect.spoken-past,eq.note.relaxed-aspect,eq.note.no-subjunctive',
      'fr\tindicative.simple_past\tfr\tindicative.simple_past 1.00 exact | indicative.perfect 1.00 exact\t- | eq.fr.perfect.spoken-past',
      'fr\tgerund.present\tnl\tparticiple.present 0.50 exact\teq.nl.gerund-as-participle',
    ]) expect(text.split('\n')).toContain(line);
  });
});
