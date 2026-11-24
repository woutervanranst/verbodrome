import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { conjugate, parseConjugationOptions } from '../src/index.js';
import { targetKey } from '../src/catalogue.js';
import { corpusRevision, summarizeCorpus } from '../scripts/corpus/model.ts';
import type { CorpusCell, CorpusCorrection, CorpusFile, CorpusManifest } from '../scripts/corpus/model.ts';
import { corpusLanguages } from '../scripts/corpus/languages/index.ts';
import type { ConjugatedForm, Language } from '../src/types.js';

/** Pinned accounting per corpus language; a corpus language missing here fails the test. */
const pinned: Readonly<Partial<Record<Language, { files: number; infinitives: number; cells: number; placeholders: number }>>> = {
  fr: { files: 222, infinitives: 84, cells: 26_196, placeholders: 0 },
  nl: { files: 207, infinitives: 207, cells: 10_764, placeholders: 1_030 },
};

const read = (name: string): string => readFileSync(new URL(`./fixtures/${name}.json`, import.meta.url), 'utf8');
const manifest = JSON.parse(read('manifest')) as CorpusManifest;
const files = corpusLanguages.flatMap(language => JSON.parse(read(language.language)) as CorpusFile[]);
const corrections = JSON.parse(read('corrections')) as CorpusCorrection[];
const ledger = new Map(corrections.map(correction => [`${correction.file}:${correction.cell}`, correction]));
const languageOf = (file: CorpusFile) => {
  const language = corpusLanguages.find(candidate => candidate.language === file.language);
  if (!language) throw new Error(`No corpus language for ${file.file}.`);
  return language;
};

/** Forms generated for the cell's (corrected) grammatical target; the language narrows them further. */
function targetForms(target: CorpusCell['target'], forms: readonly ConjugatedForm[]): ConjugatedForm[] {
  return forms.filter(form => {
    if (targetKey(form.target) !== targetKey({ ...target, gender: null })) return false;
    return !target.agreement || JSON.stringify(target.agreement) === JSON.stringify(form.target.agreement);
  });
}

describe('complete pinned corpus accounting', () => {
  it('retains every file, grammatical cell, template placeholder, and fixture checksum', () => {
    expect(manifest.revision).toBe(corpusRevision);
    const total = corpusLanguages.reduce((sum, language) => sum + (pinned[language.language]?.files ?? 0), 0);
    expect(manifest.files).toHaveLength(total);
    expect(files).toHaveLength(total);
    expect(new Set(files.map(file => file.file)).size).toBe(total);
    for (const language of corpusLanguages) {
      const pins = pinned[language.language];
      expect(pins, `${language.language} has no pinned accounting`).toBeDefined();
      const stats = manifest.fixtures[language.language];
      expect(stats, `${language.language} is missing from the manifest`).toBeDefined();
      if (!pins || !stats) continue;
      const subset = files.filter(file => file.language === language.language);
      expect(language.expectedFiles).toBe(pins.files);
      expect(subset).toHaveLength(pins.files);
      expect(new Set(subset.map(file => file.infinitive)).size).toBe(pins.infinitives);
      expect(subset.reduce((sum, file) => sum + file.cells.length, 0)).toBe(pins.cells);
      expect(subset.reduce((sum, file) => sum + file.templatePlaceholders, 0)).toBe(pins.placeholders);
      expect(createHash('sha256').update(read(language.language)).digest('hex')).toBe(stats.checksum);
      expect(summarizeCorpus(subset, corrections)).toEqual((({ checksum: _, ...rest }) => rest)(stats));
      expect(stats.availableCells + stats.unavailableCells).toBe(stats.cells);
      for (const file of subset) expect(file.cells).toHaveLength(language.cellsPerFile);
    }
    expect(Object.keys(manifest.fixtures)).toEqual(corpusLanguages.map(language => language.language));
    for (const file of files) {
      const { cells: _, ...metadata } = file;
      expect(manifest.files.find(entry => entry.file === file.file)).toEqual(metadata);
    }
  });

  it('keeps a reproducible sourced ledger, never silent skips or engine-generated expectations', () => {
    expect(ledger.size).toBe(corrections.length);
    expect(corrections.length).toBe(manifest.corrections.count);
    expect(createHash('sha256').update(read('corrections')).digest('hex')).toBe(manifest.corrections.checksum);
    const reproduced = files.flatMap(file => file.cells.flatMap((cell, index) => {
      const correction = languageOf(file).correction(file, cell, index);
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
    const language = languageOf(file);
    const forms = language.query(file).flatMap(query => conjugate(parseConjugationOptions(query)).forms);
    for (const [index, cell] of file.cells.entries()) {
      const correction = ledger.get(`${file.file}:${index}`);
      const expected = correction?.expected ?? cell.expected;
      const unavailable = correction?.unavailable ?? cell.sourceUnavailable;
      const target = correction?.correctedTarget ?? cell.target;
      const candidates = language.applicable(file, cell, targetForms(target, forms));
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
