import { describe, expect, it } from 'vitest';
import { alternatives, applyRemaps, corpusCell, infinitiveFromFileName, normalizeText, remapRun, summarizeCorpus, uncoveredRuns } from '../scripts/corpus/model.ts';
import type { CorpusFile, CorpusRemap } from '../scripts/corpus/model.ts';
import { parseDutch } from '../scripts/corpus/parsers/nl.ts';
import { parseFrench } from '../scripts/corpus/parsers/fr.ts';

describe('corpus import safeguards', () => {
  it('preserves source alternatives and apostrophe prefixes', () => {
    expect(alternatives("j'orrai/oirai")).toEqual(["j'orrai", "j'oirai"]);
    expect(alternatives('ik zal gegaan zijn; wezen')).toEqual(['ik zal gegaan zijn', 'ik zal gegaan wezen']);
    expect(alternatives('-')).toEqual([]);
  });

  it('normalizes typography but keeps grammatical diacritics', () => {
    expect(normalizeText('  qu’il  eût   été ')).toBe("qu'il eût été");
  });

  it('fails explicitly rather than accepting incomplete or unrecognized pages', () => {
    expect(() => parseFrench('<html><p>No verb</p></html>', 'bad.html')).toThrow('118 French cells');
    expect(() => parseDutch('<html></html>', 'bad.html')).toThrow('52 Dutch cells');
  });

  it('reads the infinitive from the part of a file name before the first underscore', () => {
    expect(infinitiveFromFileName('aimer.html')).toBe('aimer');
    expect(infinitiveFromFileName('pleuvoir_deuxieme-forme.html')).toBe('pleuvoir');
    expect(infinitiveFromFileName('levantarse.html')).toBe('levantarse');
    // A decomposed accent in the file name is composed (NFC), as the fixtures need.
    expect(infinitiveFromFileName('oi\u0301r.html')).toBe('o\u00edr');
  });
});

describe('corpusCell', () => {
  it('builds the same cell as before and omits every optional field that is absent', () => {
    const cell = corpusCell({ mood: 'indicative', tense: 'present', original: 'ik werk', index: 4 });
    expect(cell).toEqual({
      target: { mood: 'indicative', tense: 'present', person: 2, number: 'plural', agreement: null },
      original: 'ik werk', expected: ['ik werk'], sourceUnavailable: false, construction: null, availabilityMarker: null, pronoun: null,
    });
    expect(Object.keys(cell)).toEqual(['target', 'original', 'expected', 'sourceUnavailable', 'construction', 'availabilityMarker', 'pronoun']);
    expect(Object.keys(cell.target)).toEqual(['mood', 'tense', 'person', 'number', 'agreement']);
  });

  it('keeps the pronoun key and the dash and notused markers', () => {
    expect(corpusCell({ mood: 'indicative', tense: 'present', original: '-', index: 0, notused: true, pronoun: 'het' }))
      .toMatchObject({ sourceUnavailable: true, availabilityMarker: 'notused', pronoun: 'het', expected: [] });
    expect(corpusCell({ mood: 'infinitive', tense: 'present', original: '-', index: 0 }))
      .toMatchObject({ sourceUnavailable: true, availabilityMarker: 'dash', target: { person: null, number: null } });
  });

  it('adds voice, subject, variant, scope with reason and heading after the pronoun, in that order', () => {
    const cell = corpusCell({
      mood: 'indicative', tense: 'present', original: 'amat', index: 2, voice: 'passive', subject: '3sg',
      variant: { pattern: 'a', region: 'GB' }, scope: 'unmodelled', reason: 'compound-participle', heading: 'Indicative/Present',
    });
    expect(Object.keys(cell).slice(7)).toEqual(['voice', 'subject', 'variant', 'scope', 'reason', 'heading']);
    expect(cell).toMatchObject({ voice: 'passive', subject: '3sg', variant: { pattern: 'a', region: 'GB' }, scope: 'unmodelled', reason: 'compound-participle' });
  });

  it('takes the expected forms from the page when the source does not use the alternative notation', () => {
    expect(corpusCell({ mood: 'indicative', tense: 'present', original: 'a | b', index: 0, expected: ['a', 'b'] }).expected).toEqual(['a', 'b']);
  });

  it('removes repeated expected forms when they are passed explicitly, keeping the first occurrence order', () => {
    expect(corpusCell({ mood: 'indicative', tense: 'present', original: 'b | a | b', index: 0, expected: ['b', 'a', 'b'] }).expected).toEqual(['b', 'a']);
  });

  it('accepts undefined for every optional field, as looked-up values are', () => {
    const cell = corpusCell({
      mood: 'indicative', tense: 'present', original: 'x', index: 0, agreement: undefined, construction: undefined, notused: undefined,
      pronoun: undefined, expected: undefined, voice: undefined, subject: undefined, variant: undefined, scope: undefined, reason: undefined, heading: undefined,
    });
    expect(Object.keys(cell)).toEqual(['target', 'original', 'expected', 'sourceUnavailable', 'construction', 'availabilityMarker', 'pronoun']);
    expect(cell).toMatchObject({ pronoun: null, construction: null, expected: ['x'] });
  });

  it('refuses a scope without a reason and a reason without a scope', () => {
    expect(() => corpusCell({ mood: 'indicative', tense: 'present', original: 'x', index: 0, scope: 'unmodelled' })).toThrow('reason');
    expect(() => corpusCell({ mood: 'indicative', tense: 'present', original: 'x', index: 0, reason: 'why' })).toThrow('scope');
  });
});

describe('remaps', () => {
  const at = (heading: string, index: number) => corpusCell({ mood: 'subjunctive', tense: 'present', original: 'x', index, heading });
  const cells = [
    ...[0, 1].map(index => at('A', index)), ...[0, 1].map(index => at('B', index)), ...[0, 1].map(index => at('A', index)),
    corpusCell({ mood: 'infinitive', tense: 'present', original: 'x', index: 0 }),
  ];
  const remap = (heading: string, occurrence: number | 'all'): CorpusRemap => ({
    heading, occurrence, target: { mood: 'subjunctive', tense: 'past' }, reason: 'The page labels this table with the wrong tense.', source: 'https://example.org/',
  });

  it('finds the nth run of consecutive cells under a heading, counting from zero', () => {
    expect(remapRun(cells, 'A', 0)).toEqual([0, 1]);
    expect(remapRun(cells, 'A', 1)).toEqual([4, 5]);
    expect(remapRun(cells, 'A', 2)).toEqual([]);
    expect(remapRun(cells, 'B', 0)).toEqual([2, 3]);
    expect(remapRun(cells, 'missing', 0)).toEqual([]);
  });

  it('sets mood and tense of the run and keeps everything else, reporting which remaps matched', () => {
    const { cells: remapped, matched } = applyRemaps(cells, [remap('A', 1), remap('C', 0)]);
    expect(matched).toEqual([true, false]);
    expect(remapped.map(cell => cell.target.tense)).toEqual(['present', 'present', 'present', 'present', 'past', 'past', 'present']);
    expect(remapped[4]?.target).toEqual({ mood: 'subjunctive', tense: 'past', person: 1, number: 'singular', agreement: null });
    expect(Object.keys(remapped[4]?.target ?? {})).toEqual(['mood', 'tense', 'person', 'number', 'agreement']);
    expect(remapped[4]?.heading).toBe('A');
    expect(cells[4]?.target.tense).toBe('present');
  });

  it('can correct person, number, subject and voice besides mood and tense', () => {
    const { cells: remapped } = applyRemaps(cells, [{ ...remap('B', 0), target: { mood: 'imperative', tense: 'present', person: 3, number: 'plural', subject: '3pl.formal', voice: 'active' } }]);
    expect(remapped[2]?.target).toEqual({ mood: 'imperative', tense: 'present', person: 3, number: 'plural', agreement: null });
    expect(remapped[2]).toMatchObject({ subject: '3pl.formal', voice: 'active' });
    expect(remapped[3]).toMatchObject({ subject: '3pl.formal', voice: 'active', target: { person: 3, number: 'plural' } });
    // A field the remap does not name stays as it was.
    const { cells: only } = applyRemaps(cells, [remap('B', 0)]);
    expect(only[2]?.target).toMatchObject({ person: 1, number: 'singular' });
    expect(only[2]?.subject).toBeUndefined();
  });

  it('counts every run of the heading with occurrence "all"', () => {
    expect(remapRun(cells, 'A', 'all')).toEqual([0, 1, 4, 5]);
    const { cells: remapped, matched } = applyRemaps(cells, [remap('A', 'all')]);
    expect(matched).toEqual([true]);
    expect(remapped.map(cell => cell.target.tense)).toEqual(['past', 'past', 'present', 'present', 'past', 'past', 'present']);
  });

  it('reports runs of a remapped heading that are neither remapped nor exempted', () => {
    expect(uncoveredRuns(cells, [remap('A', 0), remap('B', 0)], [])).toEqual([{ heading: 'A', occurrence: 1 }]);
    expect(uncoveredRuns(cells, [remap('A', 0), remap('B', 0)], [{ heading: 'A', occurrence: 1, reason: 'The second table is correctly headed in the source.' }])).toEqual([]);
    expect(uncoveredRuns(cells, [remap('A', 'all'), remap('B', 0)], [])).toEqual([]);
    // A heading no remap mentions is not audited.
    expect(uncoveredRuns(cells, [remap('B', 0)], [])).toEqual([]);
  });
});

describe('summarizeCorpus', () => {
  const file = (cells: CorpusFile['cells']): CorpusFile => ({
    file: 'xx/x', language: 'fr', infinitive: 'x', gender: null, auxiliary: null, pattern: 'default', templatePlaceholders: 0, cells,
  });
  const base = { mood: 'indicative', tense: 'present', index: 0 } as const;

  it('keeps unmodelled cells out of the available, unavailable and expected-form counts', () => {
    const stats = summarizeCorpus([file([
      corpusCell({ ...base, original: 'a/b' }),
      corpusCell({ ...base, index: 1, original: '-' }),
      corpusCell({ ...base, index: 2, original: 'c', scope: 'unmodelled', reason: 'no-such-form' }),
      corpusCell({ ...base, index: 3, original: '-', scope: 'unmodelled', reason: 'no-such-form' }),
    ])], []);
    expect(stats).toMatchObject({ cells: 4, availableCells: 1, unavailableCells: 1, unmodelledCells: 2, expectedForms: 2 });
    expect(stats.availableCells + stats.unavailableCells + (stats.unmodelledCells ?? 0)).toBe(stats.cells);
    expect(summarizeCorpus([file([corpusCell({ ...base, original: 'a' })])], [])).not.toHaveProperty('unmodelledCells');
  });

  it('tells targets apart by agreement case, voice and subject', () => {
    const cells = [
      corpusCell({ mood: 'participle', tense: 'past', index: 0, original: 'a', agreement: { gender: 'masculine', number: 'singular', case: 'nominative' } }),
      corpusCell({ mood: 'participle', tense: 'past', index: 0, original: 'a', agreement: { gender: 'masculine', number: 'singular', case: 'accusative' } }),
      corpusCell({ ...base, original: 'a', voice: 'active' }),
      corpusCell({ ...base, original: 'a', voice: 'passive' }),
      corpusCell({ ...base, original: 'a', subject: '1sg' }),
      corpusCell({ ...base, original: 'a', subject: '2sg' }),
      corpusCell({ ...base, original: 'a' }),
    ];
    expect(summarizeCorpus([file(cells)], []).targets).toBe(7);
  });
});
