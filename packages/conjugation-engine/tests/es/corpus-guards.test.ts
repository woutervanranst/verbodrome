/** Guards over the Spanish corpus fixtures: tagged variants, coverage, remaps and the ledger (plan task 6). */
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { resolvedTargetKey } from '../../src/catalogue.js';
import { conjugate, parseConjugationOptions } from '../../src/index.js';
import type { ConjugatedForm } from '../../src/index.js';
import { spanishCatalogue } from '../../src/languages/es/catalogue.js';
import { spanishWorks } from '../../src/languages/es/sources.js';
import { spanish } from '../../scripts/corpus/languages/es.ts';
import { spanishLedgerRows } from '../../scripts/corpus/corrections/es.ts';
import type { CorpusCorrection, CorpusFile } from '../../scripts/corpus/model.ts';

const read = (name: string): string => readFileSync(new URL(`../fixtures/${name}.json`, import.meta.url), 'utf8');
const files = JSON.parse(read('es')) as CorpusFile[];
const cells = files.flatMap(file => file.cells);
const corrections = (JSON.parse(read('corrections')) as CorpusCorrection[]).filter(c => c.file.startsWith('es/'));
const ledger = new Map(corrections.map(c => [`${c.file}:${c.cell}`, c]));
const generated = new Map(files.map(file => [file.file, spanish.query(file).flatMap(query => conjugate(parseConjugationOptions(query.options)).forms)]));
const tagged = (form: ConjugatedForm) =>
  form.variant.pattern !== null || form.variant.condition !== null || (form.variant.region ?? null) !== null || form.variant.usage !== 'standard';

/** For every cell, the applicable forms the engine generates beyond the (corrected) expected ones. */
function extras(): { file: string; text: string; tagged: boolean }[] {
  const found: { file: string; text: string; tagged: boolean }[] = [];
  for (const file of files) {
    file.cells.forEach((cell, index) => {
      const correction = ledger.get(`${file.file}:${index}`);
      const target = correction?.correctedTarget ?? cell.target;
      const expected = correction?.expected ?? cell.expected;
      const forms = generated.get(file.file)!.filter(form => form.target.mood === target.mood && form.target.tense === target.tense
        && (form.target.person ?? null) === target.person && (form.target.number ?? null) === target.number
        && (cell.subject === undefined || form.target.subject === cell.subject));
      for (const form of spanish.applicable(file, cell, forms, 'default')) {
        if (!expected.includes(form.text)) found.push({ file: file.infinitive, text: form.text, tagged: tagged(form) });
      }
    });
  }
  return found;
}

describe('Spanish corpus guards', () => {
  it('tags every form the page does not print (review focus 4)', () => {
    const all = extras();
    expect(all.filter(extra => !extra.tagged)).toEqual([]);
    const texts = all.map(extra => `${extra.file}: ${extra.text}`);
    for (const known of ['yacer: yo yazco', 'yacer: yo yago', 'roer: yo roigo', 'roer: yo royo', 'erguir: yo irgo', 'satisfacer: satisface',
      'predecir: yo prediré', 'ir: vamos', 'yacer: yaz', 'errar: yo erro', 'raer: yo rayo', 'podrir: pudrir']) {
      expect(texts).toContain(known);
    }
  });

  it('never returns two indistinguishable forms: every form after the preferred one carries a tag', () => {
    for (const [file, forms] of generated) {
      const byTarget = new Map<string, ConjugatedForm[]>();
      for (const form of forms) byTarget.set(resolvedTargetKey(form.target), [...byTarget.get(resolvedTargetKey(form.target)) ?? [], form]);
      for (const group of byTarget.values()) for (const form of group.slice(1)) expect(tagged(form), `${file}: ${form.text}`).toBe(true);
    }
  });

  it('covers every catalogue entry with at least one cell', () => {
    const covered = new Set(cells.map(cell => `${cell.target.mood}.${cell.target.tense}`));
    for (const correction of corrections) if (correction.correctedTarget) covered.add(`${correction.correctedTarget.mood}.${correction.correctedTarget.tense}`);
    expect(spanishCatalogue.map(entry => `${entry.mood}.${entry.tense}`).filter(id => !covered.has(id))).toEqual([]);
  });

  it('gives every cell under a remapped heading that remap\'s target', () => {
    const remapped = cells.filter(cell => cell.heading !== undefined);
    expect(remapped).toHaveLength((6 + 6 + 6 + 6 + 1 + 1) * 89);
    for (const remap of spanish.remaps!) {
      const under = remapped.filter(cell => cell.heading === remap.heading);
      expect(under.length).toBeGreaterThan(0);
      for (const cell of under) expect(`${cell.target.mood}.${cell.target.tense}`).toBe(`${remap.target.mood}.${remap.target.tense}`);
    }
  });

  it('pins the ledger and sources it from the RAE or a listed work', () => {
    expect(corrections).toHaveLength(116);
    expect(spanishLedgerRows).toBe(98);   // the other 18 corrections drop the pronoun of llover's forms
    const hosts = new Set(['www.rae.es', 'dle.rae.es', ...Object.values(spanishWorks).flatMap(work => 'url' in work ? [new URL(work.url).host] : [])]);
    for (const correction of corrections) {
      expect(hosts.has(new URL(correction.source).host), correction.source).toBe(true);
      expect(correction.reason.length).toBeGreaterThan(30);
    }
  });
});
