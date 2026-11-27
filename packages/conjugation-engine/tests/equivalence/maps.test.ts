/**
 * The tense maps of the registry (`src/equivalence/index.ts`), checked against the catalogues and the note catalogs.
 * It runs over `Object.entries(maps)`, so a language that gets its map needs no edit here.
 */
import { describe, expect, it } from 'vitest';
import { getCatalogue } from '../../src/catalogue.js';
import { languages } from '../../src/default-engine.js';
import { concepts } from '../../src/equivalence/concepts.js';
import type { ConceptLink } from '../../src/equivalence/concepts.js';
import { maps, passiveLanguages } from '../../src/equivalence/index.js';
import { locales } from '../../src/i18n/locales/index.js';
import type { Language } from '../../src/types.js';

const entries = Object.entries(maps) as [Language, Readonly<Record<string, readonly ConceptLink[]>>][];

/** The catalogue tense counts of every language, as its pack implements it. */
const tenseCounts: Readonly<Record<Language, number>> = { fr: 25, nl: 12, de: 19, es: 23, it: 22, la: 21, en: 24 };

const isTenth = (weight: number): boolean => Math.abs(weight * 10 - Math.round(weight * 10)) < 1e-9;

describe('tense maps', () => {
  it('maps only registered languages', () => {
    expect(entries.length).toBeGreaterThan(0);
    for (const [code] of entries) expect(languages).toContain(code);
  });

  it.each(entries)('%s: lists every catalogue tense, in catalogue order', (code, map) => {
    const catalogue = getCatalogue(code);
    for (const entry of catalogue) {
      expect(entry.mood, `${code} mood`).not.toContain('.');
      expect(entry.tense, `${code} tense`).not.toContain('.');
    }
    expect(Object.keys(map)).toEqual(catalogue.map(entry => `${entry.mood}.${entry.tense}`));
    expect(Object.keys(map)).toHaveLength(tenseCounts[code]);
  });

  it.each(entries)('%s: links known concepts with weights in tenths and notes of both locales', (code, map) => {
    for (const [tense, links] of Object.entries(map)) {
      for (const link of links) {
        const where = `${code} ${tense} ${link.concept}`;
        expect(Object.hasOwn(concepts, link.concept), where).toBe(true);
        expect(link.weight > 0 && link.weight <= 1 && isTenth(link.weight), `${where} weight ${link.weight}`).toBe(true);
        if (link.note !== undefined) {
          expect(locales.en[link.note], where).toBeDefined();
          expect(locales.nl[link.note], where).toBeDefined();
        }
        if (link.only !== undefined) expect(link.note, `${where}: a link with only needs a note`).toBeDefined();
      }
    }
  });

  it.each(entries)('%s: gives every tense a link it can use as a source and one as a target', (code, map) => {
    for (const [tense, links] of Object.entries(map)) {
      expect(links.some(link => link.only !== 'target'), `${code} ${tense} as a source`).toBe(true);
      expect(links.some(link => link.only !== 'source'), `${code} ${tense} as a target`).toBe(true);
    }
  });

  it('models the passive of exactly the mapped languages whose catalogue has one', () => {
    const voiced = entries.map(([code]) => code)
      .filter(code => getCatalogue(code).some(entry => entry.voices?.includes('passive')));
    expect([...passiveLanguages].sort()).toEqual(voiced.sort());
  });

  it('freezes the registry', () => {
    expect(Object.isFrozen(maps)).toBe(true);
    for (const [, map] of entries) {
      expect(Object.isFrozen(map)).toBe(true);
      for (const links of Object.values(map)) {
        expect(Object.isFrozen(links)).toBe(true);
        for (const link of links) expect(Object.isFrozen(link)).toBe(true);
      }
    }
  });
});
