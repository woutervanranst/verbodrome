/**
 * The scraped Latin pages at two levels (design §9.5): with the form ledger alone every cell passes when vowel length
 * is ignored; the macron ledger changes vowel length only; with both, the shared corpus test compares macron for
 * macron. And the over-generation guard and the catalogue coverage.
 */
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { latinCorrection, latinFormCorrection, latinMacronCorrection } from '../../scripts/corpus/corrections/la.ts';
import { startCorrection, untaggedExtras } from '../../scripts/corpus/model.ts';
import type { CorpusCell, CorpusCorrection, CorpusFile } from '../../scripts/corpus/model.ts';
import { resolvedTargetKey } from '../../src/catalogue.js';
import { conjugate } from '../../src/index.js';
import { latinCatalogue } from '../../src/languages/la/catalogue.js';
import { latinKey } from '../../src/languages/la/key.js';
import type { ConjugatedForm } from '../../src/types.js';

const files = JSON.parse(readFileSync(new URL('../fixtures/la.json', import.meta.url), 'utf8')) as CorpusFile[];
const corrections = JSON.parse(readFileSync(new URL('../fixtures/corrections.json', import.meta.url), 'utf8')) as CorpusCorrection[];
const formsOf = new Map(files.map(file => [file.file, conjugate({ language: 'la', infinitive: file.infinitive, gender: 'masculine', agreement: {} } as never).forms]));

/** The engine's forms for a cell's target (mood, tense, person, number, voice, subject and agreement). */
function candidates(file: CorpusFile, cell: CorpusCell, target: CorpusCell['target']): ConjugatedForm[] {
  return formsOf.get(file.file)!.filter(form => form.target.mood === target.mood && form.target.tense === target.tense
    && form.target.person === target.person && form.target.number === target.number && form.target.voice === cell.voice
    && form.target.subject === cell.subject
    && (target.agreement === null || (form.target.agreement?.gender === target.agreement.gender
      && form.target.agreement.number === target.agreement.number && (form.target.agreement.case ?? null) === (target.agreement.case ?? null))));
}

const modelled = files.flatMap(file => file.cells.map((cell, index) => ({ file, cell, index })).filter(({ cell }) => cell.scope !== 'unmodelled'));

describe('Latin corpus at two levels', () => {
  it('passes macron-insensitively with the form ledger alone', () => {
    const failures = modelled.flatMap(({ file, cell, index }) => {
      const draft = startCorrection(file, cell, index);
      latinFormCorrection(file, cell, index, draft);
      const got = candidates(file, cell, draft.correctedTarget ?? cell.target).map(form => latinKey(form.text));
      const ok = draft.unavailable ? got.length === 0 : draft.expected.every(form => got.includes(latinKey(form)));
      return ok ? [] : [`${file.file}#${index}`];
    });
    expect(failures).toEqual([]);
  });

  it('keeps the macron ledger to vowel length', () => {
    let changed = 0;
    for (const { file, cell, index } of modelled) {
      const before = startCorrection(file, cell, index);
      latinFormCorrection(file, cell, index, before);
      const after = startCorrection(file, cell, index);
      latinFormCorrection(file, cell, index, after);
      latinMacronCorrection(file, cell, index, after);
      if (JSON.stringify(before.expected) === JSON.stringify(after.expected)) continue;
      changed += 1;
      expect(after.expected.map(latinKey), `${file.file}#${index}`).toEqual(before.expected.map(latinKey));
    }
    expect(changed).toBe(147);
  });

  it('pins the ledgers', () => {
    let form = 0;
    for (const { file, cell, index } of modelled) {
      const draft = startCorrection(file, cell, index);
      latinFormCorrection(file, cell, index, draft);
      if (draft.finish()) form += 1;
    }
    expect(form).toBe(107);
    expect(corrections.filter(correction => correction.file.startsWith('la/'))).toHaveLength(254);
    expect(modelled.filter(({ file, cell, index }) => latinCorrection(file, cell, index)).length).toBe(254);
  });

  it('never generates an untagged extra form', () => {
    const failures = modelled.flatMap(({ file, cell, index }) => {
      const correction = latinCorrection(file, cell, index);
      if (correction?.unavailable ?? cell.sourceUnavailable) return [];
      const expected = correction?.expected ?? cell.expected;
      const extras = untaggedExtras(candidates(file, cell, correction?.correctedTarget ?? cell.target), expected, resolvedTargetKey);
      return extras.map(form => `${file.file}#${index} ${form.text}`);
    });
    expect(failures).toEqual([]);
  });

  it('covers every catalogue entry in both voices', () => {
    const covered = new Set(files.flatMap(file => file.cells.map(cell => `${cell.target.mood}.${cell.target.tense}${cell.voice ? `.${cell.voice}` : ''}`)));
    for (const entry of latinCatalogue) {
      for (const voice of entry.voices ?? [undefined]) expect(covered, `${entry.mood}.${entry.tense}.${voice ?? ''}`).toContain(`${entry.mood}.${entry.tense}${voice ? `.${voice}` : ''}`);
    }
  });
});
