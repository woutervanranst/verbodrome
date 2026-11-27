import { describe, expect, it } from 'vitest';
import { deriveEquivalents } from '../../src/equivalence/derive.js';
import * as sub from '../../src/equivalence/index.js';
import { equivalenceData, equivalentTenses, maps } from '../../src/equivalence/index.js';
import { overrides } from '../../src/equivalence/overrides.js';
import { ConjugationError } from '../../src/errors.js';
import { locales } from '../../src/i18n/locales/index.js';
import * as root from '../../src/index.js';

/** The code of the ConjugationError `call` throws. */
function codeOf(call: () => unknown): string {
  try {
    call();
  } catch (error) {
    expect(error).toBeInstanceOf(ConjugationError);
    return (error as ConjugationError).code;
  }
  throw new Error('expected a ConjugationError');
}

const registry = maps as unknown as Readonly<Record<string, Readonly<Record<string, unknown>>>>;

describe('equivalentTenses', () => {
  it('ranks the target tenses as { mood, tense } objects', () => {
    const result = equivalentTenses('fr', 'nl', { mood: 'indicative', tense: 'perfect' });
    expect(result.notes).toEqual([]);
    expect(result.matches[0]).toEqual({
      match: 'exact', tense: { mood: 'indicative', tense: 'perfect' }, rank: 1, score: 0.8, register: 'standard',
      relaxed: [], via: ['PRESENT_PERFECT', 'PRESENT_PERFECT'], notes: [],
    });
    expect(result.matches[1]?.tense).toEqual({ mood: 'indicative', tense: 'past' });
  });

  it('returns frozen results', () => {
    const result = equivalentTenses('fr', 'nl', { mood: 'indicative', tense: 'perfect' });
    for (const value of [result, result.matches, result.notes, result.matches[0], result.matches[0]?.tense, result.matches[0]?.notes]) {
      expect(Object.isFrozen(value)).toBe(true);
    }
  });

  it('offers a stand-in only when its language is the target', () => {
    // The Dutch past participle stands in for the French perfect infinitive, never the reverse.
    expect(equivalentTenses('fr', 'nl', { mood: 'infinitive', tense: 'past' }).matches.map(entry => [entry.tense, entry.match]))
      .toEqual([[{ mood: 'participle', tense: 'past' }, 'approximate']]);
    expect(equivalentTenses('nl', 'fr', { mood: 'participle', tense: 'past' }).matches.map(entry => entry.tense))
      .toEqual([{ mood: 'participle', tense: 'past' }]);
  });

  it('rejects an unmapped language and a tense the language does not have', () => {
    expect(codeOf(() => equivalentTenses('xx' as never, 'nl', { mood: 'indicative', tense: 'present' } as never))).toBe('UNSUPPORTED_LANGUAGE');
    expect(codeOf(() => equivalentTenses('fr', 'xx' as never, { mood: 'indicative', tense: 'present' }))).toBe('UNSUPPORTED_LANGUAGE');
    expect(() => equivalentTenses('fr', 'xx' as never, { mood: 'indicative', tense: 'present' })).toThrow(/must be one of: .*fr, .*nl/u);
    expect(codeOf(() => equivalentTenses('fr', 'nl', { mood: 'indicative', tense: 'past' } as never))).toBe('INVALID_TARGET');
    expect(codeOf(() => equivalentTenses('fr', 'nl', null as never))).toBe('INVALID_TARGET');
    expect(codeOf(() => equivalentTenses('fr', 'nl', { mood: 'indicative', tense: 'present' }, { voice: 'middle' as never }))).toBe('INVALID_REQUEST');
  });

  it('rejects a passive lookup from a language without a modelled passive', () => {
    expect(codeOf(() => equivalentTenses('fr', 'fr', { mood: 'indicative', tense: 'present' }, { voice: 'passive' }))).toBe('INVALID_REQUEST');
  });

  it('is the same function on the root and on the ./equivalence subpath', () => {
    expect(root.equivalentTenses).toBe(sub.equivalentTenses);
  });
});

describe('pair overrides', () => {
  it('has at least the three French to Dutch overrides', () => {
    expect(overrides.filter(entry => entry.from === 'fr' && entry.to === 'nl').map(entry => entry.tense))
      .toEqual(['indicative.near_future', 'indicative.recent_past', 'imperative.present']);
  });

  it.each(overrides.map(entry => [`${entry.from} ${entry.tense} -> ${entry.to}`, entry] as const))('%s is valid, documented and changes something', (_, entry) => {
    expect(Object.hasOwn(registry, entry.from) && Object.hasOwn(registry, entry.to)).toBe(true);
    expect(Object.hasOwn(registry[entry.from]!, entry.tense)).toBe(true);
    expect(entry.result.length).toBeGreaterThan(0);
    for (const result of entry.result) {
      expect(Object.hasOwn(registry[entry.to]!, result.tense), result.tense).toBe(true);
      if (result.note !== undefined) {
        expect(locales.en[result.note]).toBeDefined();
        expect(locales.nl[result.note]).toBeDefined();
      }
    }
    expect(entry.reason.length).toBeGreaterThan(30);
    const without = deriveEquivalents({ ...equivalenceData, overrides: [] }, entry.from, entry.to, entry.tense);
    const withIt = deriveEquivalents(equivalenceData, entry.from, entry.to, entry.tense);
    const shape = (list: typeof withIt) => list.matches.map(match => [match.tense, match.match, match.notes]);
    expect(shape(withIt)).not.toEqual(shape(without));
  });

  it('has one override at most for a source tense and a target language', () => {
    const keys = overrides.map(entry => `${entry.from} ${entry.to} ${entry.tense}`);
    expect(new Set(keys).size).toBe(keys.length);
  });
});
