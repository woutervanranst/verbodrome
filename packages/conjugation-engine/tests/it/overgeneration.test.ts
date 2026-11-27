import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { italian } from '../../scripts/corpus/languages/it.ts';
import type { CorpusCorrection, CorpusFile } from '../../scripts/corpus/model.ts';
import { resolvedTargetKey } from '../../src/core/target.js';
import { conjugate } from '../../src/index.js';

const read = <T>(name: string): T => JSON.parse(readFileSync(new URL(`../fixtures/${name}.json`, import.meta.url), 'utf8')) as T;
const italianFixture = read<CorpusFile[]>('it');
const corrections = read<CorpusCorrection[]>('corrections');
const cellOf = (infinitive: string, mood: string, tense: string, subject?: string) => italianFixture.find(file => file.infinitive === infinitive)!
  .cells.find(cell => cell.target.mood === mood && cell.target.tense === tense && (subject === undefined || cell.subject === subject))!;

describe('Italian corpus fixtures and guards', () => {
  it('imports the pages as GD §9 describes', () => {
    expect(cellOf('dare', 'indicative', 'simple_past', '3sg.m').expected).toEqual(['lui diede', 'lui dette', 'lui dètte']);
    expect(cellOf('salire', 'participle', 'present').expected).toEqual(['salente', 'saliente']);
    expect(italianFixture.flatMap(file => file.cells).filter(cell => cell.scope === 'unmodelled')).toHaveLength(20);
    expect(cellOf('andare', 'subjunctive', 'past', '1sg')).toMatchObject({ heading: 'Congiuntivo/Passato prossimo', expected: ['io sia andato'] });
  });

  it('pins the ledger', () => {
    const ledger = corrections.filter(correction => correction.file.startsWith('it/'));
    expect(ledger).toHaveLength(67);
    expect(ledger.filter(correction => correction.unavailable)).toHaveLength(7); // dovere imperative ×5, sapere and potere participle.present
    for (const correction of ledger) expect(correction.source, correction.reason).toMatch(/^https:\/\/www\.treccani\.it\//u);
  });

  it('tags every extra form: an untagged form beside the first of its target is one the corrected page expects', () => {
    const ledger = new Map(corrections.filter(c => c.file.startsWith('it/')).map(c => [`${c.file}:${c.cell}`, c]));
    for (const file of italianFixture) {
      const forms = italian.query(file).flatMap(({ options }) => conjugate(options as never).forms);
      file.cells.forEach((cell, index) => {
        if (cell.scope === 'unmodelled') return;
        const expected = ledger.get(`${file.file}:${index}`)?.expected ?? cell.expected;
        const target = ledger.get(`${file.file}:${index}`)?.correctedTarget ?? cell.target;
        const groups = new Map<string, typeof forms>();
        for (const form of forms.filter(f => f.target.mood === target.mood && f.target.tense === target.tense && f.target.person === target.person
          && f.target.number === target.number && (cell.subject === undefined || f.target.subject === cell.subject))) {
          groups.set(resolvedTargetKey(form.target), [...groups.get(resolvedTargetKey(form.target)) ?? [], form]);
        }
        for (const group of groups.values()) {
          const [first, ...rest] = group;
          for (const form of rest) {
            const tagged = form.variant.auxiliary !== first!.variant.auxiliary || form.variant.pattern !== first!.variant.pattern
              || form.variant.usage !== first!.variant.usage || form.variant.condition !== first!.variant.condition;
            expect(tagged || expected.includes(form.text), `${file.file}:${index} ${form.text} beside ${first!.text}`).toBe(true);
          }
        }
      });
    }
  });
});
