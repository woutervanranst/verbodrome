import { describe, expect, it } from 'vitest';
import { comparisonKey, plainComparisonKey } from '../../src/core/compare.js';
import { createEngine } from '../../src/core/engine.js';
import { normalizeForComparison } from '../../src/index.js';
import { toyPack } from '../toy/pack.js';

describe('comparison keys', () => {
  it('normalises case, Unicode form and spacing by default, keeping accents', () => {
    expect(plainComparisonKey('  Je  télé ')).toBe('je télé');
    expect(plainComparisonKey('Één')).toBe('één');
  });

  it("uses a pack's own compareKey when it declares one, and the plain key otherwise", () => {
    const own = { ...toyPack, language: 'yy', compareKey: (text: string) => text.replace(/h/gu, '') };
    expect(comparisonKey(toyPack, 'Placa ')).toBe('placa');
    expect(comparisonKey(own, 'pha')).toBe('pa');
    const engine = createEngine({ xx: toyPack, yy: own });
    expect(engine.normalizeForComparison('xx', ' Placa')).toBe('placa');
    expect(engine.normalizeForComparison('yy', 'pha')).toBe('pa');
    expect(() => engine.normalizeForComparison('zz', 'a')).toThrow(expect.objectContaining({ code: 'UNSUPPORTED_LANGUAGE', message: 'Language must be one of: xx, yy.' }));
  });

  it('is exported from the package root over the built-in packs', () => {
    expect(normalizeForComparison('nl', ' Ik  Werk')).toBe('ik werk');
    expect(normalizeForComparison('fr', 'Été')).toBe('été');
    expect(normalizeForComparison('la', 'Amāverīs')).toBe('amaveris');
    expect(() => normalizeForComparison('xx' as never, 'a')).toThrow(expect.objectContaining({ code: 'UNSUPPORTED_LANGUAGE' }));
  });
});
