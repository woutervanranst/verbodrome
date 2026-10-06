import { describe, expect, it } from 'vitest';
import { expandTargets } from '../src/catalogue.js';
import { ConjugationError } from '../src/errors.js';
import { conjugationOptions, parseConjugationOptions } from '../src/options.js';

describe('grammatical options', () => {
  it('builds the same precise request as an object', () => {
    expect(conjugationOptions('fr', ' ALLER ').indicative('perfect').person(1, 'plural').gender('feminine').build())
      .toEqual({ language: 'fr', infinitive: 'aller', mood: 'indicative', tense: 'perfect', person: 1, number: 'plural', gender: 'feminine' });
  });

  it('expands only valid slots and retains explicit inapplicability', () => {
    const all = expandTargets({ language: 'fr', infinitive: 'aimer' });
    expect(all).toHaveLength(109);
    expect(all.filter(t => t.mood === 'imperative')).toHaveLength(6);
    expect(all.filter(t => t.person === null)).toHaveLength(7);
    expect(expandTargets({ language: 'nl', infinitive: 'werken' })).toHaveLength(53);
    expect(expandTargets({ language: 'fr', infinitive: 'aimer', person: 1 }).some(t => t.person === null)).toBe(false);
  });

  it.each([
    { language: 'xx', infinitive: 'aimer' },
    { language: 'fr', infinitive: '' },
    { language: 'fr', infinitive: 'aimer', person: 0 },
    { language: 'fr', infinitive: 'aimer', mood: 'imperative', person: 3 },
    { language: 'fr', infinitive: 'aimer', mood: 'participle', person: 1 },
    { language: 'nl', infinitive: 'werken', gender: 'feminine' },
    { language: 'fr', infinitive: 'aimer', stems: { future: '' } },
  ])('rejects an invalid request explicitly: %j', options => {
    expect(() => parseConjugationOptions(options)).toThrow(ConjugationError);
  });

  it('normalizes spelling without dropping accents', () => {
    expect(parseConjugationOptions({ language: 'fr', infinitive: ' S’AIMER ' }).infinitive).toBe("s'aimer");
    expect(parseConjugationOptions({ language: 'fr', infinitive: 'ME\u0301FIER' }).infinitive).toBe('méfier');
    expect(parseConjugationOptions({ language: 'fr', infinitive: 'ressortir', model: ' FINIR ', stems: { future: 'RESSORTIR' } }))
      .toEqual({ language: 'fr', infinitive: 'ressortir', model: 'finir', stems: { future: 'ressortir' } });
    expect(parseConjugationOptions({ language: 'nl', infinitive: 'opzorpen', separablePrefix: 'OP', stems: { stem: 'ZORP' } }))
      .toEqual({ language: 'nl', infinitive: 'opzorpen', separablePrefix: 'op', stems: { stem: 'zorp' } });
  });

  it('clones nested inputs without removing their undefined properties', () => {
    const agreement = Object.freeze({ gender: 'feminine', number: undefined });
    const stems = Object.freeze({ future: undefined });
    const input = Object.freeze({ language: 'fr', infinitive: 'aimer', agreement, stems });
    const parsed = parseConjugationOptions(input);
    expect(parsed).toEqual({ language: 'fr', infinitive: 'aimer', agreement: { gender: 'feminine' }, stems: {} });
    expect(Object.hasOwn(agreement, 'number')).toBe(true);
    expect(Object.hasOwn(stems, 'future')).toBe(true);
    expect(JSON.parse(JSON.stringify(parsed))).toEqual(parsed);
  });
});
