import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { conjugate, parseConjugationOptions } from '../src/index.js';
import { targetKey } from '../src/catalogue.js';
import { candidateForms, corpusRevision, hasVariantTag, remapRun, summarizeCorpus, untaggedExtras } from '../scripts/corpus/model.ts';
import type { CorpusCell, CorpusCorrection, CorpusFile, CorpusLanguage, CorpusManifest, CorpusRemapRecord } from '../scripts/corpus/model.ts';
import { corpusLanguages } from '../scripts/corpus/languages/index.ts';
import type { ConjugatedForm, FormVariant, Language, ResolvedTarget } from '../src/types.js';

/** Pinned accounting per corpus language; a corpus language missing here fails the test. */
const pinned: Readonly<Partial<Record<Language, {
  files: number; infinitives: number; cells: number; modelled: number; unmodelled: number; placeholders: number; remaps: number;
}>>> = {
  fr: { files: 222, infinitives: 84, cells: 26_196, modelled: 26_196, unmodelled: 0, placeholders: 0, remaps: 0 },
  nl: { files: 207, infinitives: 207, cells: 10_764, modelled: 10_764, unmodelled: 0, placeholders: 1_030, remaps: 0 },
};

const read = (name: string): string => readFileSync(new URL(`./fixtures/${name}.json`, import.meta.url), 'utf8');
const manifest = JSON.parse(read('manifest')) as CorpusManifest;
const files = corpusLanguages.flatMap(language => JSON.parse(read(language.language)) as CorpusFile[]);
const corrections = JSON.parse(read('corrections')) as CorpusCorrection[];
const remapRecords = JSON.parse(read('remaps')) as CorpusRemapRecord[];
const ledger = new Map(corrections.map(correction => [`${correction.file}:${correction.cell}`, correction]));
const languageOf = (file: CorpusFile) => {
  const language = corpusLanguages.find(candidate => candidate.language === file.language);
  if (!language) throw new Error(`No corpus language for ${file.file}.`);
  return language;
};

/** Forms generated for the cell's (corrected) grammatical target, voice and subject; the language narrows them further. */
function targetForms(target: CorpusCell['target'], cell: CorpusCell, forms: readonly ConjugatedForm[]): ConjugatedForm[] {
  const wanted: ResolvedTarget = {
    ...target, gender: null,
    ...(cell.voice ? { voice: cell.voice } : {}),
    ...(cell.subject ? { subject: cell.subject } : {}),
  };
  return forms.filter(form => {
    if (targetKey(form.target) !== targetKey(wanted)) return false;
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
      const unmodelled = subset.reduce((sum, file) => sum + file.cells.filter(cell => cell.scope === 'unmodelled').length, 0);
      expect(unmodelled).toBe(pins.unmodelled);
      expect(pins.cells - unmodelled).toBe(pins.modelled);
      expect(stats.unmodelledCells ?? 0).toBe(pins.unmodelled);
      expect(stats.remaps ?? 0).toBe(pins.remaps);
      expect((language.remaps ?? []).length).toBe(pins.remaps);
      expect(createHash('sha256').update(read(language.language)).digest('hex')).toBe(stats.checksum);
      const remaps = remapRecords.filter(record => record.language === language.language);
      expect(summarizeCorpus(subset, corrections, remaps)).toEqual((({ checksum: _, ...rest }) => rest)(stats));
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

  it('records every remap with its reason and source, and every remapped cell carries the corrected target', () => {
    expect(remapRecords).toEqual(corpusLanguages.flatMap(language => (language.remaps ?? []).map(remap => ({ language: language.language, ...remap }))));
    for (const remap of remapRecords) {
      expect(remap.source).toMatch(/^https:\/\//u);
      expect(remap.reason.length).toBeGreaterThan(30);
      expect(Number.isInteger(remap.occurrence) && remap.occurrence >= 0).toBe(true);
      const matched = files.filter(file => file.language === remap.language).flatMap(file => {
        const run = remapRun(file.cells, remap.heading, remap.occurrence);
        for (const index of run) expect(file.cells[index]?.target, `${file.file}:${index}`).toMatchObject(remap.target);
        return run;
      });
      expect(matched.length, `remap ${remap.heading} #${remap.occurrence} matches no cell`).toBeGreaterThan(0);
    }
  });

  it('accounts for unmodelled cells with a declared reason, and declares no unused reason', () => {
    for (const language of corpusLanguages) {
      const used = new Set<string>();
      for (const file of files.filter(file => file.language === language.language)) {
        for (const [index, cell] of file.cells.entries()) {
          if (cell.scope !== 'unmodelled') {
            expect(cell.reason, `${file.file}:${index} has a reason without the scope`).toBeUndefined();
            continue;
          }
          expect(Object.keys(language.unmodelled ?? {}), `${file.file}:${index}`).toContain(cell.reason);
          used.add(cell.reason ?? '');
        }
      }
      expect([...used].sort()).toEqual(Object.keys(language.unmodelled ?? {}).sort());
    }
  });

  it.each(files)('$file', file => {
    const language = languageOf(file);
    const queries = language.query(file);
    expect(new Set(queries.map(query => query.label)).size, `${file.file}: query labels must be unique`).toBe(queries.length);
    for (const query of queries) expect(query.label).not.toBe('');
    const generated = new Map(queries.map(query => [query.label, conjugate(parseConjugationOptions(query.options)).forms] as const));
    for (const [index, cell] of file.cells.entries()) {
      if (cell.scope === 'unmodelled') continue;
      const correction = ledger.get(`${file.file}:${index}`);
      const expected = correction?.expected ?? cell.expected;
      const unavailable = correction?.unavailable ?? cell.sourceUnavailable;
      const target = correction?.correctedTarget ?? cell.target;
      const byLabel = new Map([...generated].map(([label, forms]) => [label, targetForms(target, cell, forms)] as const));
      const candidates = candidateForms(language, file, cell, byLabel);
      const texts = new Set(candidates.map(form => form.text));
      const location = `${file.file}:${index} ${target.mood}/${target.tense}/${target.person ?? '-'}/${target.number ?? '-'} ${cell.original}`;
      if (unavailable) {
        expect([...texts], location).toEqual([]);
      } else {
        expect(expected.length, location).toBeGreaterThan(0);
        for (const text of expected) expect(texts.has(text), `${location}: missing ${text}; generated ${[...texts].join(' | ')}`).toBe(true);
        if (language.requireTaggedExtras) {
          const untagged = untaggedExtras(candidates, expected).map(form => form.text);
          expect(untagged, `${location}: generated beyond the expected forms without a variant tag`).toEqual([]);
        }
      }
    }
  });
});

describe('how a cell is compared with the engine', () => {
  const variant: FormVariant = { orthography: 'both', auxiliary: null, pattern: null, usage: 'standard', condition: null };
  const target: ResolvedTarget = { mood: 'indicative', tense: 'present', person: 1, number: 'singular', gender: null, agreement: null };
  const form = (text: string, tags: Partial<FormVariant> = {}): ConjugatedForm => ({
    target, parts: [], variant: { ...variant, ...tags }, ruleIds: [], text, preferred: true, labels: { mood: 'indicative', tense: 'present' },
  });
  const cell: CorpusCell = {
    target, original: 'x', expected: ['x'], sourceUnavailable: false, construction: null, availabilityMarker: null, pronoun: null,
  };
  const file: CorpusFile = {
    file: 'xx/x', language: 'fr', infinitive: 'x', gender: null, auxiliary: null, pattern: 'default', templatePlaceholders: 0, cells: [cell],
  };
  const answers = (label: string): CorpusLanguage['applicable'] => (_file, _cell, forms, asked) => asked === label ? forms : [];

  it('is satisfied only by forms from queries whose applicable accepts the cell', () => {
    const byLabel = new Map([['a', [form('x')]], ['b', [form('y')]]]);
    const onlyA = candidateForms({ applicable: answers('a') }, file, cell, byLabel);
    expect(onlyA.map(candidate => candidate.text)).toEqual(['x']);
    // The form `y` came from a query that rejects the cell, so it contributes nothing.
    const onlyB = candidateForms({ applicable: answers('b') }, file, cell, byLabel);
    expect(onlyB.map(candidate => candidate.text)).toEqual(['y']);
    expect(onlyB.some(candidate => candidate.text === cell.expected[0])).toBe(false);
    expect(candidateForms({ applicable: answers('c') }, file, cell, byLabel)).toEqual([]);
  });

  it('takes the forms of every label that accepts the cell together', () => {
    const byLabel = new Map([['a', [form('x')]], ['b', [form('y')]]]);
    const both = candidateForms({ applicable: (_file, _cell, forms) => forms }, file, cell, byLabel);
    expect(both.map(candidate => candidate.text).sort()).toEqual(['x', 'y']);
  });

  it('passes the label and the narrowed forms to applicable', () => {
    const seen: string[] = [];
    candidateForms({ applicable: (_file, _cell, forms, label) => { seen.push(`${label}:${forms.map(f => f.text)}`); return forms; } }, file, cell,
      new Map([['a', [form('x'), form('z')]], ['b', []]]));
    expect(seen).toEqual(['a:x,z', 'b:']);
  });

  it('recognises non-default variant tags', () => {
    expect(hasVariantTag(variant)).toBe(false);
    expect(hasVariantTag({ ...variant, pattern: 'strong' })).toBe(true);
    expect(hasVariantTag({ ...variant, region: 'GB' })).toBe(true);
    expect(hasVariantTag({ ...variant, region: null })).toBe(false);
    expect(hasVariantTag({ ...variant, usage: 'literary' })).toBe(true);
    expect(hasVariantTag({ ...variant, usage: 'dated' })).toBe(true);
    expect(hasVariantTag({ ...variant, orthography: 'rectified' })).toBe(true);
    expect(hasVariantTag({ ...variant, orthography: 'traditional' })).toBe(true);
    // An auxiliary or a condition alone is not a variant tag of the corpus guard.
    expect(hasVariantTag({ ...variant, auxiliary: 'have', condition: 'figurative' })).toBe(false);
  });

  it('fails an untagged extra form and accepts tagged ones', () => {
    const forms = [form('x'), form('y'), form('z', { pattern: 'variant' }), form('w', { region: 'US' }), form('v', { usage: 'dated' })];
    expect(untaggedExtras(forms, ['x']).map(extra => extra.text)).toEqual(['y']);
    expect(untaggedExtras(forms.filter(candidate => candidate.text !== 'y'), ['x'])).toEqual([]);
    // Expected forms never count as extras, whatever their tags.
    expect(untaggedExtras([form('x'), form('y', { region: 'GB' })], ['x', 'y'])).toEqual([]);
    expect(untaggedExtras([form('x'), form('y')], ['x', 'y'])).toEqual([]);
  });
});
