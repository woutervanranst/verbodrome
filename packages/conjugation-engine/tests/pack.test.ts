import { describe, expect, it } from 'vitest';
import { conjugate, createEngine, getCatalogue, languages, renderParts } from '../src/index.js';
import { allPersons, moodEntries, noPersons, variantRank } from '../src/core/pack.js';
import { packs } from '../src/languages/index.js';
import type { FormVariant, Orthography } from '../src/types.js';

describe('catalogue entries from moodEntries', () => {
  const tenses = [['present', 'Present']] as const;

  it('makes an entry finite when it has persons, and non-finite when it has none', () => {
    expect(moodEntries('indicative', 'Indicative', allPersons, tenses)[0]).toMatchObject({ finite: true, persons: allPersons });
    const infinitive = moodEntries('infinitive', 'Infinitive', noPersons, tenses)[0]!;
    expect(infinitive).toMatchObject({ finite: false, persons: [] });
    expect(infinitive).not.toHaveProperty('slots');
  });

  it('makes an entry with slots finite whatever its persons, and keeps the slots', () => {
    const [entry] = moodEntries('imperative', 'Imperative', noPersons, tenses, { slots: ['2sg', '2pl'] });
    expect(entry).toMatchObject({ finite: true, persons: [], slots: ['2sg', '2pl'] });
    expect(Object.isFrozen(entry) && Object.isFrozen(entry!.slots)).toBe(true);
    // Persons are ignored for expansion when slots are present, so they may be given or left out.
    expect(moodEntries('imperative', 'Imperative', [[2, 'singular']], tenses, { slots: ['2sg'] })[0]).toMatchObject({ finite: true, slots: ['2sg'] });
  });

  it('leaves the French and Dutch catalogues as they were, apart from the French imperative slots', () => {
    for (const language of ['fr', 'nl'] as const) {
      const catalogue = getCatalogue(language);
      expect(catalogue.filter(entry => entry.finite === (entry.persons.length > 0))).toHaveLength(catalogue.length);
    }
    expect(getCatalogue('nl').some(entry => 'slots' in entry)).toBe(false);
    expect(getCatalogue('fr').filter(entry => 'slots' in entry).map(entry => [entry.mood, entry.tense, entry.slots])).toEqual([
      ['imperative', 'present', ['2sg', '1pl', '2pl']], ['imperative', 'past', ['2sg', '1pl', '2pl']],
    ]);
  });
});

describe('language packs', () => {
  it('lists registered languages and rejects others by name', () => {
    expect(languages).toEqual(['fr', 'nl']);
    for (const call of [() => conjugate({ language: 'xx', infinitive: 'a' } as never), () => getCatalogue('xx' as never), () => renderParts('xx' as never, [])]) {
      expect(call).toThrow(expect.objectContaining({ code: 'UNSUPPORTED_LANGUAGE', message: 'Language must be one of: fr, nl.' }));
    }
  });

  it('keeps imperative slots as catalogue data', () => {
    const imperative = (l: 'fr' | 'nl') => getCatalogue(l).find(e => e.mood === 'imperative' && e.tense === 'present')!.persons;
    expect(imperative('fr')).toEqual([[2, 'singular'], [1, 'plural'], [2, 'plural']]);
    expect(imperative('nl')).toEqual([[2, 'singular'], [2, 'plural']]);
  });

  it('computes onsets per language', () => {
    const part = (l: 'fr' | 'nl', verb: string) => conjugate({ language: l, infinitive: verb, mood: 'indicative', tense: 'present', person: 1, number: 'singular' }).forms[0]!.parts.at(-1)!;
    expect(part('fr', 'habiter').phonology.onset).toBe('muteH');
    expect(part('nl', 'hebben').phonology.onset).toBe('consonant');
  });

  it('runs a pack that is not in the default registry', () => {
    const engine = createEngine({ fr: packs.fr });
    expect(engine.languages).toEqual(['fr']);
    expect(engine.conjugate({ language: 'fr', infinitive: 'aimer', mood: 'infinitive' }).forms[0]!.text).toBe('aimer');
    const unsupported = expect.objectContaining({ code: 'UNSUPPORTED_LANGUAGE', message: 'Language must be one of: fr.' });
    expect(() => engine.conjugate({ language: 'nl', infinitive: 'werken' })).toThrow(unsupported);
    expect(() => engine.getCatalogue('nl')).toThrow(unsupported);
    expect(() => engine.expandTargets({ language: 'nl', infinitive: 'werken' })).toThrow(unsupported);
    expect(() => engine.renderParts('nl', [])).toThrow(unsupported);
  });

  it('ranks standard before literary before dated usage, then the preferred spelling first', () => {
    const variant = (usage: FormVariant['usage'], orthography: Orthography): FormVariant =>
      ({ orthography, auxiliary: null, pattern: null, usage, condition: null });
    const ranks = (['standard', 'literary', 'dated'] as const).flatMap(usage =>
      (['both', 'rectified', 'traditional'] as const).map(orthography => variantRank(variant(usage, orthography), 'rectified')));
    expect(ranks).toEqual([0, 0, 1, 10, 10, 11, 20, 20, 21]);
    expect(variantRank(variant('standard', 'rectified'), 'traditional')).toBe(1);
  });

  it('rejects a pack registered under another language code', () => {
    expect(() => createEngine({ fr: packs.fr, de: packs.nl })).toThrow(expect.objectContaining({
      code: 'INVALID_REQUEST', message: 'The pack registered as de is the pack for nl.',
    }));
  });
});
