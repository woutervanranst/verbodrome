import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { conjugate, parseConjugationOptions } from '../src/index.js';
import { targetKey } from '../src/catalogue.js';
import { corpusRevision, summarizeCorpus } from '../scripts/corpus.ts';
import type { CorpusCorrection, CorpusFile, CorpusManifest } from '../scripts/corpus.ts';
import { corpusCorrection } from '../scripts/corrections.ts';
import type { ConjugatedForm } from '../src/types.js';

const read = (name: string): string => readFileSync(new URL(`./fixtures/${name}.json`, import.meta.url), 'utf8');
const manifest = JSON.parse(read('manifest')) as CorpusManifest;
const files = [...JSON.parse(read('fr')), ...JSON.parse(read('nl'))] as CorpusFile[];
const corrections = JSON.parse(read('corrections')) as CorpusCorrection[];
const ledger = new Map(corrections.map(correction => [`${correction.file}:${correction.cell}`, correction]));

function applicableForms(file: CorpusFile, target: CorpusFile['cells'][number]['target'], forms: readonly ConjugatedForm[]): ConjugatedForm[] {
  return forms.filter(form => {
    if (targetKey(form.target) !== targetKey({ ...target, gender: null })) return false;
    if (target.agreement && JSON.stringify(target.agreement) !== JSON.stringify(form.target.agreement)) return false;
    if (file.infinitive === 'pleuvoir' && target.person !== null) {
      return file.pattern === 'second' ? form.variant.condition === 'figurative' : form.variant.condition !== 'figurative';
    }
    return true;
  });
}

describe('complete pinned corpus accounting', () => {
  it('retains every file, grammatical cell, template placeholder, and fixture checksum', () => {
    expect(manifest.revision).toBe(corpusRevision);
    expect(manifest.files).toHaveLength(429);
    expect(files).toHaveLength(429);
    expect(new Set(files.map(file => file.file)).size).toBe(429);
    for (const language of ['fr', 'nl'] as const) {
      const subset = files.filter(file => file.language === language);
      expect(subset).toHaveLength(language === 'fr' ? 222 : 207);
      expect(new Set(subset.map(file => file.infinitive)).size).toBe(language === 'fr' ? 84 : 207);
      expect(subset.reduce((sum, file) => sum + file.cells.length, 0)).toBe(language === 'fr' ? 26_196 : 10_764);
      expect(subset.reduce((sum, file) => sum + file.templatePlaceholders, 0)).toBe(language === 'fr' ? 0 : 1_030);
      expect(createHash('sha256').update(read(language)).digest('hex')).toBe(manifest.fixtures[language].checksum);
      expect(summarizeCorpus(subset, corrections)).toEqual((({ checksum: _, ...stats }) => stats)(manifest.fixtures[language]));
      expect(manifest.fixtures[language].availableCells + manifest.fixtures[language].unavailableCells).toBe(manifest.fixtures[language].cells);
    }
    for (const file of files) {
      const { cells, ...metadata } = file;
      expect(manifest.files.find(entry => entry.file === file.file)).toEqual(metadata);
      expect(cells).toHaveLength(file.language === 'fr' ? 118 : 52);
    }
  });

  it('keeps a reproducible sourced ledger, never silent skips or engine-generated expectations', () => {
    expect(ledger.size).toBe(corrections.length);
    expect(corrections.length).toBe(manifest.corrections.count);
    expect(createHash('sha256').update(read('corrections')).digest('hex')).toBe(manifest.corrections.checksum);
    const reproduced = files.flatMap(file => file.cells.flatMap((cell, index) => {
      const correction = corpusCorrection(file, cell, index);
      return correction ? [correction] : [];
    }));
    expect(reproduced).toEqual(corrections);
    for (const correction of corrections) {
      const file = files.find(file => file.file === correction.file);
      expect(file?.cells[correction.cell]?.original).toBe(correction.original);
      expect(correction.source).toMatch(/^https:\/\//u);
      expect(correction.reason.length).toBeGreaterThan(30);
    }
  });

  it.each(files)('$file', file => {
    const options = parseConjugationOptions({
      language: file.language, infinitive: file.infinitive,
      ...(file.gender ? { gender: file.gender } : {}),
      ...(file.auxiliary ? { auxiliary: file.auxiliary } : {}),
    });
    const result = conjugate(options);
    const participles = file.language === 'fr' ? conjugate({
      language: 'fr', infinitive: file.infinitive, mood: 'participle', tense: 'past',
    }).forms : result.forms;
    const neuter = file.language === 'nl' && file.cells.some(cell => cell.pronoun === 'het') ? conjugate({
      language: 'nl', infinitive: file.infinitive, pronoun: 'het',
    }).forms : result.forms;
    for (const [index, cell] of file.cells.entries()) {
      const correction = ledger.get(`${file.file}:${index}`);
      const expected = correction?.expected ?? cell.expected;
      const unavailable = correction?.unavailable ?? cell.sourceUnavailable;
      const target = correction?.correctedTarget ?? cell.target;
      const pool = cell.target.mood === 'participle' && cell.target.tense === 'past' ? participles
        : cell.pronoun === 'het' ? neuter : result.forms;
      const candidates = applicableForms(file, target, pool);
      const texts = new Set(candidates.map(form => form.text));
      const location = `${file.file}:${index} ${target.mood}/${target.tense}/${target.person ?? '-'}/${target.number ?? '-'} ${cell.original}`;
      if (unavailable) {
        expect([...texts], location).toEqual([]);
      } else {
        expect(expected.length, location).toBeGreaterThan(0);
        for (const text of expected) expect(texts.has(text), `${location}: missing ${text}; generated ${[...texts].join(' | ')}`).toBe(true);
      }
    }
  });
});
