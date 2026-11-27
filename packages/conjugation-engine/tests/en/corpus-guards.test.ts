import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { conjugate, getCatalogue, parseConjugationOptions } from '../../src/index.js';
import { targetKey } from '../../src/catalogue.js';
import type { ConjugatedForm } from '../../src/index.js';
import { english } from '../../scripts/corpus/languages/en.ts';
import type { CorpusCell, CorpusCorrection, CorpusFile } from '../../scripts/corpus/model.ts';

const read = (name: string): string => readFileSync(new URL(`../fixtures/${name}.json`, import.meta.url), 'utf8');
const enFiles = JSON.parse(read('en')) as CorpusFile[];
const enCells = enFiles.flatMap(file => file.cells);
const englishCorrections = (JSON.parse(read('corrections')) as CorpusCorrection[]).filter(c => c.file.startsWith('en/'));
const ledger = new Map(englishCorrections.map(c => [`${c.file}:${c.cell}`, c]));
const generated = new Map<string, readonly ConjugatedForm[]>();

/** The engine forms of the file's query for the cell's target and subject, narrowed as the corpus test narrows them. */
function formsFor(file: CorpusFile, cell: CorpusCell): readonly ConjugatedForm[] {
  const forms = generated.get(file.file) ?? conjugate(parseConjugationOptions(english.query(file)[0]!.options)).forms;
  generated.set(file.file, forms);
  const wanted = targetKey({ ...cell.target, gender: null, ...(cell.subject ? { subject: cell.subject } : {}) });
  return english.applicable(file, cell, forms.filter(form => targetKey(form.target) === wanted), 'default');
}
const expectedOf = (file: CorpusFile, index: number): readonly string[] => ledger.get(`${file.file}:${index}`)?.expected ?? file.cells[index]!.expected;
const countByInfinitive = (corrections: readonly CorpusCorrection[]) =>
  corrections.reduce<Record<string, number>>((counts, c) => ({ ...counts, [c.file.slice(3)]: (counts[c.file.slice(3)] ?? 0) + 1 }), {});
const cellsByHeading = (heading: string) => enCells.filter(c => c.heading === heading).length;

describe('English corpus guards', () => {
  it('pins every correction rule', () => {
    expect(countByInfinitive(englishCorrections)).toEqual({
      bear: 37, bend: 37, cast: 49, dig: 49, fly: 1, rid: 49, shake: 12, shut: 49, slide: 37, spin: 12, spit: 49, strike: 49, strive: 49, teach: 1,
    });
    expect(englishCorrections).toHaveLength(480);
    for (const c of englishCorrections) expect(c.source).toMatch(/^https:\/\/(www\.ldoceonline\.com|www\.ahdictionary\.com|assets\.publishing\.service\.gov\.uk)\//u);
  });

  it('pins the remaps and the tagged cells', () => {
    expect(cellsByHeading('Subjunctive › Present #2')).toBe(870);
    expect(cellsByHeading('Subjunctive › Imperfect')).toBe(870);
    expect(cellsByHeading('Nominal Forms › Gerund')).toBe(145);
    expect(enCells.filter(c => c.heading === 'Subjunctive › Present #2').every(c => c.target.tense === 'perfect')).toBe(true);
    expect(enCells.filter(c => c.heading === 'Nominal Forms › Gerund').every(c => c.target.mood === 'participle' && c.target.tense === 'present')).toBe(true);
    expect(enCells.filter(c => /\([UE]\)/u.test(c.original))).toHaveLength(172);
    expect(enCells.filter(c => c.original.includes('Let´s'))).toHaveLength(145);
  });

  it('checks region labels where the source gives them', () => {
    // `applicable` turns gotten (US) into "gotten (US)": an unlabelled engine form would not match.
    const getFile = enFiles.find(file => file.infinitive === 'get')!;
    const getParticipleCell = getFile.cells.find(c => c.target.mood === 'participle' && c.target.tense === 'past')!;
    expect(formsFor(getFile, getParticipleCell).map(f => f.text)).toEqual(['got', 'gotten (US)']);
    const walkLike = enFiles.find(file => file.infinitive === 'win')!;
    expect(formsFor(walkLike, walkLike.cells[1]!).map(f => f.text)).toEqual(['won']);
  });

  it('tags every generated form the source does not list', () => {
    for (const file of enFiles) for (const [i, cell] of file.cells.entries()) {
      const expected = expectedOf(file, i);
      const extra = formsFor(file, cell).filter(f => !expected.includes(f.text));
      for (const f of extra) {
        expect([f.variant.pattern, f.variant.region, f.variant.condition].some(v => v !== null) || f.variant.usage !== 'standard', `${file.file}:${i} ${f.text}`).toBe(true);
      }
    }
  });

  it('covers every catalogue entry with corpus cells', () => {
    expect(new Set(enCells.map(c => `${c.target.mood}.${c.target.tense}`))).toEqual(new Set(getCatalogue('en').map(e => `${e.mood}.${e.tense}`)));
    expect(english.requireTaggedExtras).toBe(true);
  });
});
