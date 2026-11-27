/** Guards over the German corpus fixtures: tagged variants, current spelling, coverage, remaps and the ledger. */
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { conjugate, parseConjugationOptions } from '../../src/index.js';
import { resolvedTargetKey } from '../../src/catalogue.js';
import type { ConjugatedForm } from '../../src/index.js';
import { germanCatalogue } from '../../src/languages/de/catalogue.js';
import { german } from '../../scripts/corpus/languages/de.ts';
import type { CorpusCorrection, CorpusFile } from '../../scripts/corpus/model.ts';

const read = (name: string): string => readFileSync(new URL(`../fixtures/${name}.json`, import.meta.url), 'utf8');
const files = JSON.parse(read('de')) as CorpusFile[];
const cells = files.flatMap(file => file.cells);
const corrections = (JSON.parse(read('corrections')) as CorpusCorrection[]).filter(c => c.file.startsWith('de/'));

/** Every form of every query the corpus test runs for a file. */
const generated = new Map(files.map(file => [file.file, german.query(file).flatMap(query => conjugate(parseConjugationOptions(query.options)).forms)]));
const allForms = [...generated.values()].flat();
const formsOf = (infinitive: string) => generated.get(`de/${infinitive}`)!;
const tagged = (form: ConjugatedForm) =>
  form.variant.pattern !== null || form.variant.condition !== null || (form.variant.region ?? null) !== null || form.variant.usage !== 'standard';

describe('German corpus guards', () => {
  it('never returns two indistinguishable forms: every form after the preferred one carries a tag', () => {
    for (const [file, forms] of generated) {
      const byTarget = new Map<string, ConjugatedForm[]>();
      for (const form of forms) byTarget.set(resolvedTargetKey(form.target), [...byTarget.get(resolvedTargetKey(form.target)) ?? [], form]);
      for (const group of byTarget.values()) {
        for (const form of group.slice(1)) expect(tagged(form), `${file}: ${form.text}`).toBe(true);
      }
    }
  });

  it('tags the known extras the page omits or prints alone', () => {
    const find = (infinitive: string, text: string) => formsOf(infinitive).find(form => form.text === text)?.variant;
    expect(find('fahren', 'ich habe gefahren')?.condition).not.toBeNull();
    expect(find('brennen', 'brenne')?.pattern).toBe('long');
    expect(find('schwören', 'ich schwur')?.usage).toBe('dated');
    expect(find('kommen', 'du kämst')?.pattern).toBe('short');
    expect(find('leihen', 'leihe')?.pattern).toBe('long');
    expect(find('stehen', 'ich bin gestanden')?.region).toBe('south');
  });

  it('emits no spelling the 1996 reform replaced', () => {
    const records = corrections.filter(c => c.reason.startsWith('Since the 1996 reform'));
    expect(records).toHaveLength(165);
    // The ß spellings these records drop (müssen's ihr-imperative also loses müsst: modal verbs have no imperative).
    const removed = records.flatMap(c => files.find(file => file.file === c.file)!.cells[c.cell]!.expected.filter(text => !c.expected.includes(text) && text.includes('ß')));
    expect(removed).toHaveLength(165);
    expect(removed).toEqual(expect.arrayContaining(['ich muß', 'du ißt', 'gewußt', 'iß', 'laß', 'ich müßte']));
    const texts = new Set(allForms.map(form => form.text));
    expect(removed.filter(text => texts.has(text))).toEqual([]);
    expect(allForms.filter(form => /geschrieen|gespieen|\bdaß\b/u.test(form.text))).toEqual([]);
  });

  it('covers every catalogue entry and the seven subject slots', () => {
    const targets = new Set(cells.map(cell => `${cell.target.mood}.${cell.target.tense}`));
    for (const entry of germanCatalogue) expect(targets, `${entry.mood}.${entry.tense}`).toContain(`${entry.mood}.${entry.tense}`);
    expect(new Set(cells.flatMap(cell => cell.subject ?? []))).toEqual(new Set(['1sg', '2sg', '3sg', '1pl', '2pl', '3pl', '2.formal']));
  });

  it('gives every remapped cell the target its remap names', () => {
    const remapped = cells.filter(cell => cell.heading !== undefined);
    expect(remapped).toHaveLength(5 * 6 * 139);
    for (const cell of remapped) {
      const remap = german.remaps!.find(candidate => candidate.heading === cell.heading)!;
      expect({ mood: cell.target.mood, tense: cell.target.tense }, cell.heading).toEqual(remap.target);
    }
  });

  it('pins the ledger: 412 design records and one found by the import, each with an authority URL', () => {
    expect(corrections).toHaveLength(413);
    const hosts = new Set(corrections.map(c => new URL(c.source).host));
    expect([...hosts].sort()).toEqual(['grammis.ids-mannheim.de', 'www.duden.de', 'www.dwds.de', 'www.rechtschreibrat.com']);
    for (const c of corrections) expect(c.reason.length, c.file).toBeGreaterThan(30);
    expect(corrections.filter(c => c.file === 'de/erlöschen')).toHaveLength(1);
  });
});
