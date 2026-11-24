import { describe, expect, it } from 'vitest';
import { alternatives, normalizeText } from '../scripts/corpus/model.ts';
import { parseDutch } from '../scripts/corpus/parsers/nl.ts';
import { parseFrench } from '../scripts/corpus/parsers/fr.ts';

describe('corpus import safeguards', () => {
  it('preserves source alternatives and apostrophe prefixes', () => {
    expect(alternatives("j'orrai/oirai")).toEqual(["j'orrai", "j'oirai"]);
    expect(alternatives('ik zal gegaan zijn; wezen')).toEqual(['ik zal gegaan zijn', 'ik zal gegaan wezen']);
    expect(alternatives('-')).toEqual([]);
  });

  it('normalizes typography but keeps grammatical diacritics', () => {
    expect(normalizeText('  qu’il  eu\u0302t   e\u0301te\u0301 ')).toBe("qu'il eût été");
  });

  it('fails explicitly rather than accepting incomplete or unrecognized pages', () => {
    expect(() => parseFrench('<html><p>No verb</p></html>', 'bad.html')).toThrow('118 French cells');
    expect(() => parseDutch('<html></html>', 'bad.html')).toThrow('52 Dutch cells');
  });
});
