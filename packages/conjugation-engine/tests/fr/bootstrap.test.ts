/**
 * The generated principal-part lexicon reproduces the legacy model tables it was bootstrapped from: every traditional
 * cell of every family paradigm is either derived from the parts by the formation rules (GD §4.2-4.3) or listed as a
 * suppletive cell, and every cell whose rectified spelling differs is assigned to a spelling rule (GD §4.4) or to the
 * listed spellings. Deleted with the legacy tables (plan Task 8).
 */
import { describe, expect, it } from 'vitest';
import { derive, extract, spellingRulesOf } from '../../scripts/fr/bootstrap-families.ts';
import { erEndings, irEndings, reEndings } from '../../src/languages/fr/ending-sets.js';
import { cellNames } from '../../src/languages/fr/family.js';
import { frenchFamilies } from '../../src/languages/fr/families.js';
import { frenchModels } from '../../src/languages/fr/models.js';
import type { FrenchModel } from '../../src/languages/fr/models.js';
import { cellTexts } from '../../src/languages/fr/table.js';
import type { Spelling } from '../../src/languages/fr/table.js';

const families = frenchModels.filter(model => !model.productive);
const entryOf = (model: FrenchModel) => frenchFamilies.find(entry => entry.id === model.id)!;
const legacy = (model: FrenchModel, paradigm: number, cell: number, spelling: Spelling) =>
  cellTexts('', model.paradigms[paradigm]!.cells[cell]!, spelling, model.kind === 'er');

describe('bootstrapped French families', () => {
  it('has one family per non-productive model, in model order', () => {
    expect(frenchFamilies.map(entry => entry.id)).toEqual(families.map(model => model.id));
    expect(frenchFamilies).toHaveLength(94);
  });

  it('is what the script extracts from the model tables', () => {
    for (const model of families) expect(entryOf(model)).toEqual(extract(model));
  });

  it('derives every traditional cell of every family exactly, apart from its listed cells', () => {
    const mismatches: string[] = [];
    let compared = 0;
    for (const model of families) {
      const entry = entryOf(model);
      entry.paradigms.forEach((paradigm, p) => {
        cellNames.forEach((name, i) => {
          compared++;
          const actual = paradigm.cells[name] ?? derive(entry, p, i);
          const expected = legacy(model, p, i, 'traditional');
          if (JSON.stringify(actual) !== JSON.stringify(expected)) {
            mismatches.push(`${model.id}#${p} ${name}: ${JSON.stringify(actual)} ≠ ${JSON.stringify(expected)}`);
          }
        });
      });
    }
    expect(compared).toBe(101 * 51);
    expect(mismatches).toEqual([]);
  });

  it('lists exactly the measured suppletive cells', () => {
    const counts = Object.fromEntries(frenchFamilies.flatMap(entry => {
      const count = entry.paradigms.reduce((sum, paradigm) => sum + Object.keys(paradigm.cells).length, 0);
      return count ? [[entry.id, count]] : [];
    }));
    expect(counts).toEqual({ être: 10, avoir: 7, aller: 3, faire: 2, dire: 1, pouvoir: 1, seoir: 1, messeoir: 1, échoir: 2 });
    expect(Object.values(counts).reduce((sum, count) => sum + count, 0)).toBe(28);
    expect(frenchFamilies.find(entry => entry.id === 'être')!.paradigms[0]!.cells).toEqual({
      'pres.2s': ['es'], 'pres.3s': ['est'], 'pres.1p': ['sommes'], 'pres.2p': ['êtes'], 'pres.3p': ['sont'],
      'subj.1s': ['sois'], 'subj.2s': ['sois'], 'subj.3s': ['soit'], 'subj.1p': ['soyons'], 'subj.2p': ['soyez'],
    });
    expect(frenchFamilies.find(entry => entry.id === 'pouvoir')!.paradigms[0]!.cells).toEqual({ 'pres.1s': ['peux', 'puis'] });
    expect(frenchFamilies.find(entry => entry.id === 'seoir')!.paradigms[0]!.cells).toEqual({ ppres: ['séant', 'seyant'] });
  });

  it('leaves exactly the measured spelling obligations to the rules', () => {
    const splits: Record<string, number> = {};
    const byRule: Record<string, number> = {};
    const unexplained: string[] = [];
    for (const model of families) {
      const entry = entryOf(model);
      model.paradigms.forEach((paradigm, p) => {
        const key = model.paradigms.length > 1 ? `${model.id}#${paradigm.pattern}` : model.id;
        cellNames.forEach((name, i) => {
          const rectified = legacy(model, p, i, 'rectified');
          const traditional = legacy(model, p, i, 'traditional');
          if (JSON.stringify(rectified) === JSON.stringify(traditional)) return;
          splits[key] = (splits[key] ?? 0) + 1;
          const { rules, words } = spellingRulesOf(entry, p, i);
          if (!rules.length || JSON.stringify(words) !== JSON.stringify(rectified)) {
            unexplained.push(`${key} ${name}: ${JSON.stringify(words)} by ${rules.join(', ') || 'no rule'} ≠ ${JSON.stringify(rectified)}`);
          }
          for (const rule of rules) byRule[rule] = (byRule[rule] ?? 0) + 1;
        });
      });
    }
    expect(unexplained).toEqual([]);
    expect(splits).toEqual({
      gésir: 1, croître: 16, accroître: 14, naître: 14, paître: 14, repaître: 14, connaître: 14, mouvoir: 1, plaire: 1,
      absoudre: 2, clore: 1, enclore: 1, 'asseoir#assois': 13, 'asseoir#assieds': 1, surseoir: 13, interpeller: 30,
    });
    expect(Object.values(splits).reduce((sum, count) => sum + count, 0)).toBe(150);
    expect(byRule).toEqual({
      'fr.orth.circumflex-before-t': 7,
      'fr.orth.1990-circumflex': 79,
      'fr.orth.1990-assoir': 27,
      'fr.orth.1990-interpeler': 30,
      'fr.orth.1990-absout': 2,
      'fr.stem.listed-spelling': 5,
    });
  });

  it('generates the three productive ending sets', () => {
    expect(erEndings.slice(0, 6)).toEqual(['e', 'es', 'e', 'ons', 'ez', 'ent']);
    expect(irEndings[3]).toBe('issons');
    expect(reEndings[2]).toBe('t');
    expect(erEndings[18]).toBe('erai');
    for (const set of [erEndings, irEndings, reEndings]) expect(set).toHaveLength(51);
  });
});
