/**
 * The tense equivalence notes: message keys `eq.*` in the core catalogs of both locales, one file per source of notes
 * (`shared.ts` for the ladder, voice, negation and pair notes; `<code>.ts` for a language's own), plain text that the
 * formatter returns unchanged, so a trainer can show `locales[locale][key]` as it is.
 */
import { readdirSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { formatMessage, placeholders } from '../../src/i18n/format.js';
import { locales } from '../../src/i18n/locales/index.js';

type Locale = keyof typeof locales;

const eqKeys = (locale: Locale): string[] => Object.keys(locales[locale]).filter(key => key.startsWith('eq.'));

/** The note files of a locale's `equivalence/` directory (without the index), with the one object each exports. */
async function noteFiles(locale: Locale): Promise<readonly (readonly [name: string, notes: Readonly<Record<string, string>>])[]> {
  const directory = new URL(`../../src/i18n/locales/${locale}/equivalence/`, import.meta.url);
  const names = readdirSync(directory).filter(name => name.endsWith('.ts') && name !== 'index.ts').sort();
  return Promise.all(names.map(async name => {
    const module = await import(new URL(name, directory).href) as Readonly<Record<string, Readonly<Record<string, string>>>>;
    const exported = Object.values(module);
    if (exported.length !== 1) throw new Error(`${locale}/equivalence/${name} exports ${exported.length} values, not one`);
    return [name.replace(/\.ts$/u, ''), exported[0]!] as const;
  }));
}

describe('equivalence note catalogs', () => {
  it('defines the same eq. keys in en and nl', () => {
    const en = eqKeys('en');
    const nl = eqKeys('nl');
    expect(en.filter(key => !nl.includes(key))).toEqual([]);
    expect(nl.filter(key => !en.includes(key))).toEqual([]);
    expect(en.length).toBeGreaterThanOrEqual(20);
  });

  it.each(['en', 'nl'] as const)('%s: every note is plain text with no placeholder and no straight apostrophe', locale => {
    for (const key of eqKeys(locale)) {
      const text = locales[locale][key]!;
      expect(placeholders(text).size, key).toBe(0);
      expect(formatMessage(text, {}, locale), key).toBe(text);
      expect(text, key).not.toMatch(/['{}]/u);
    }
  });

  it.each(['en', 'nl'] as const)('%s: each file holds the keys of its prefix, no key is in two files, every eq. key is in a file', async locale => {
    const files = await noteFiles(locale);
    expect(files.map(([name]) => name)).toContain('shared');
    const owner = new Map<string, string>();
    for (const [name, notes] of files) {
      const prefixes = name === 'shared' ? ['eq.note.', 'eq.pair.'] : [`eq.${name}.`];
      for (const key of Object.keys(notes)) {
        expect(prefixes.some(prefix => key.startsWith(prefix)), `${name}: ${key}`).toBe(true);
        expect(owner.get(key), `${key} is in ${owner.get(key)} and ${name}`).toBeUndefined();
        owner.set(key, name);
        expect(locales[locale][key], key).toBe(notes[key]);
      }
    }
    expect(eqKeys(locale).filter(key => !owner.has(key))).toEqual([]);
  });

  it('has the English text of the review and its Dutch translation', () => {
    expect(locales.en['eq.note.no-counterpart']).toBe('The target language has no tense that corresponds to this form.');
    expect(locales.nl['eq.pair.fr-nl.near-future']).toMatch(/^Het Franse aller /u);
  });

  it.each(['en', 'nl'] as const)('%s: speaks to the learner, never of the engine (review M14)', locale => {
    for (const key of eqKeys(locale)) {
      expect(locales[locale][key], key).not.toMatch(/catalog|catalogus|modelled|gemodelleerd|\bask for\b|\bvraag\b/iu);
    }
  });
});
