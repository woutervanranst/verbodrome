/**
 * The en.wiktionary second oracle (grammar design §8.4): the parser on samples cut from real responses, then every cell
 * of the 63 pinned pages, through the corrections ledger, against the engine's forms for the cell's target.
 */
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { wiktionaryLatinCorrection } from '../../scripts/corpus/corrections/wiktionary-la.ts';
import type { CorpusCell } from '../../scripts/corpus/model.ts';
import { attribution, parseWiktionaryLatin, parseWiktionaryLatinNotes, wiktionaryPins, wiktionaryUnmodelled } from '../../scripts/corpus/sources/wiktionary-la.ts';
import type { WiktionaryFixture } from '../../scripts/corpus/sources/wiktionary-la.ts';
import { targetKey } from '../../src/catalogue.js';
import { conjugate } from '../../src/index.js';
import type { ConjugatedForm, ResolvedTarget } from '../../src/types.js';

const sample = (name: string): string => readFileSync(new URL(`./wiktionary-samples/${name}.html`, import.meta.url), 'utf8');
const fixture = JSON.parse(readFileSync(new URL('../fixtures/wiktionary-la.json', import.meta.url), 'utf8')) as WiktionaryFixture;
const find = (cells: readonly CorpusCell[], mood: string, tense: string, voice?: string, subject?: string): CorpusCell =>
  cells.find(c => c.target.mood === mood && c.target.tense === tense && (voice === undefined || c.voice === voice) && (subject === undefined || c.subject === subject) && !c.scope)!;

describe('en.wiktionary parser', () => {
  it('reads tagged cells, alternatives, footnotes and compound infinitives', () => {
    const laudo = parseWiktionaryLatin(sample('laudo'), 'laudō');
    expect(find(laudo, 'indicative', 'present', 'passive', '2sg.m').expected).toEqual(['laudāris', 'laudāre']);
    expect(find(laudo, 'indicative', 'perfect', 'active', '2sg.m').original).toBe('laudāvistī, laudāstī[2]');
    expect(find(laudo, 'infinitive', 'future', 'active').target.agreement).toEqual({ gender: 'masculine', number: 'singular', case: 'accusative' });
    expect(find(laudo, 'infinitive', 'future', 'passive')).toMatchObject({ expected: ['laudātum īrī'], target: { agreement: null } });
    expect(find(laudo, 'participle', 'gerundive').expected).toEqual(['laudandus']);
    expect(find(laudo, 'supine', 'present').target).toMatchObject({ person: null, number: null, agreement: { case: 'accusative' } });
    expect(find(laudo, 'imperative', 'future', 'passive', '2pl.m')).toMatchObject({ expected: [], sourceUnavailable: true });
    expect(laudo.filter(c => c.scope === 'unmodelled').map(c => c.reason)).toEqual(['not-in-catalogue', 'not-in-catalogue']);
    expect(parseWiktionaryLatinNotes(sample('laudo'), 'laudō')['2']).toBe('At least one rare poetic syncopated perfect form is attested.');
  });

  it('treats deponent forms as active', () => {
    const conor = parseWiktionaryLatin(sample('conor'), 'cōnor');
    expect(find(conor, 'indicative', 'present', 'active', '1sg.m').expected).toEqual(['cōnor']);
    expect(find(conor, 'imperative', 'future', 'active', '3pl.m').expected).toEqual(['cōnantor']);
    expect(find(conor, 'participle', 'perfect').expected).toEqual(['cōnātus']);
    expect(find(conor, 'infinitive', 'present', 'passive')).toMatchObject({ sourceUnavailable: true });
  });

  it('marks the sigmatic rows unmodelled and fails loudly on a missing verb', () => {
    const facio = parseWiktionaryLatin(sample('facio'), 'faciō');
    expect(facio.filter(c => c.reason === 'archaic-sigmatic').length).toBeGreaterThan(0);
    expect(find(facio, 'indicative', 'present', 'passive', '1sg.m').expected).toEqual(['fīō']);
    expect(() => parseWiktionaryLatin(sample('facio'), 'legō')).toThrow('No Latin conjugation table for legō');
  });
});

/** The forms a query generated for the cell's (corrected) target, voice, subject and agreement (as tests/corpus.test.ts). */
function targetForms(cell: CorpusCell, target: CorpusCell['target'], forms: readonly ConjugatedForm[]): ConjugatedForm[] {
  const wanted = { ...target, gender: null, ...(cell.voice ? { voice: cell.voice } : {}), ...(cell.subject ? { subject: cell.subject } : {}) } as ResolvedTarget;
  return forms.filter(form => targetKey(form.target) === targetKey(wanted) && (!target.agreement || (form.target.agreement !== null
    && form.target.agreement.gender === target.agreement.gender && form.target.agreement.number === target.agreement.number
    && form.target.agreement.case === target.agreement.case)));
}

const ledger = fixture.pages.flatMap(page => page.cells.flatMap((cell, index) => {
  const correction = wiktionaryLatinCorrection(page, cell, index);
  return correction ? [correction] : [];
}));

describe('en.wiktionary oracle', () => {
  it('has every pinned page, with its licence, attribution and revisions', () => {
    expect(fixture.pages.map(page => [page.title, page.lemma, page.revid])).toEqual(wiktionaryPins.pages.map(page => [page.title, page.lemma, page.revid]));
    expect([fixture.licence, fixture.licenceUrl, fixture.attribution]).toEqual(['CC BY-SA 4.0', 'https://creativecommons.org/licenses/by-sa/4.0/', attribution]);
    expect(attribution).toMatch(/adapted/u);
    expect(fixture.modules).toEqual(wiktionaryPins.modules);
    for (const page of fixture.pages) {
      expect(page.url).toBe(`https://en.wiktionary.org/w/index.php?title=${encodeURIComponent(page.title)}&oldid=${page.revid}`);
      expect(page.history).toBe(`https://en.wiktionary.org/w/index.php?title=${encodeURIComponent(page.title)}&action=history`);
    }
  });

  it.each(fixture.pages.map(page => [page.title, page] as const))('%s', (_, page) => {
    const forms = conjugate({ language: 'la', infinitive: page.infinitive, gender: 'masculine', agreement: {} } as never).forms;
    page.cells.forEach((cell, index) => {
      if (cell.scope === 'unmodelled') return;
      const fix = wiktionaryLatinCorrection(page, cell, index);
      const target = fix?.correctedTarget ?? cell.target;
      const generated = targetForms(cell, target, forms).map(form => form.text);
      const label = `${page.title} ${target.mood}.${target.tense} ${cell.voice ?? ''} ${cell.subject ?? ''}`;
      if (fix?.unavailable ?? cell.sourceUnavailable) {
        expect(generated, `${label} is unavailable`).toEqual([]);
        return;
      }
      for (const form of fix?.expected ?? cell.expected) expect(generated, `${label}: ${form}`).toContain(form);
    });
  });

  it('keeps a sourced ledger and pins the size of the oracle', () => {
    expect(fixture.pages).toHaveLength(63);
    const cells = fixture.pages.flatMap(page => page.cells);
    expect(cells).toHaveLength(OracleCells);
    expect(cells.filter(c => c.scope === 'unmodelled')).toHaveLength(OracleUnmodelled);
    expect(new Set(cells.flatMap(c => c.reason ? [c.reason] : []))).toEqual(new Set(Object.keys(wiktionaryUnmodelled)));
    expect(ledger).toHaveLength(LedgerCells);
    for (const correction of ledger) {
      expect(correction.reason.length, correction.reason).toBeGreaterThan(30);
      expect(correction.source).toMatch(/^https:\/\//u);
      expect(correction.source).not.toMatch(/wiktionary\.org/u);
    }
  });
});

const OracleCells = 6678;
const OracleUnmodelled = 196;
const LedgerCells = 602;
