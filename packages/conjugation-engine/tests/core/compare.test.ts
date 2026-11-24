import { describe, expect, it } from 'vitest';
import { comparisonFor, plainComparisonKey } from '../../src/core/compare.js';
import { normalizeForComparison } from '../../src/index.js';
import { toyPack } from '../toy/pack.js';

describe('comparison keys', () => {
  it('normalises case, Unicode form and spacing by default', () => {
    expect(plainComparisonKey('  Je  te\u0301lé ')).toBe('je télé');
  });

  it('uses a pack\'s own key when it declares one, and the plain key otherwise', () => {
    const compare = comparisonFor({ xx: toyPack, yy: { ...toyPack, language: 'yy', compareKey: text => text.replace(/h/gu, '') } });
    expect(compare('xx', 'Placa ')).toBe('placa');
    expect(compare('yy', 'pha')).toBe('pa');
    expect(() => compare('zz', 'a')).toThrow(expect.objectContaining({ code: 'UNSUPPORTED_LANGUAGE', message: 'Language must be one of: xx, yy.' }));
  });

  it('is exported from the package root over the built-in packs', () => {
    expect(normalizeForComparison('nl', ' Ik  Werk')).toBe('ik werk');
    expect(() => normalizeForComparison('xx' as never, 'a')).toThrow(expect.objectContaining({ code: 'UNSUPPORTED_LANGUAGE' }));
  });
});
