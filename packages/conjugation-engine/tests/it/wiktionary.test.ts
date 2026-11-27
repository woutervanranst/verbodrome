/**
 * The en.wiktionary second oracle (grammar design §8.4): the parser on samples cut from real responses, then every cell
 * of the 63 pinned pages, through the corrections ledger, against the engine's bare forms.
 */
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { wiktionaryItalianCorrection, wiktionaryRules } from '../../scripts/corpus/corrections/wiktionary-it.ts';
import { parseWiktionaryItalian, wiktionaryPins } from '../../scripts/corpus/sources/wiktionary-it.ts';
import type { WiktionaryCell, WiktionaryFixture } from '../../scripts/corpus/sources/wiktionary-it.ts';
import { conjugate, renderParts } from '../../src/index.js';

const sample = (name: string): string => readFileSync(new URL(`./wiktionary-samples/${name}.html`, import.meta.url), 'utf8');
const parse = (name: string) => parseWiktionaryItalian(sample(name), name);
const cell = (page: { cells: readonly WiktionaryCell[] }, key: string): WiktionaryCell => page.cells.find(c => c.key === key)!;
const fixture = JSON.parse(readFileSync(new URL('../fixtures/wiktionary-it.json', import.meta.url), 'utf8')) as WiktionaryFixture;

describe('en.wiktionary parser', () => {
  it('parses a regular table', () => {
    const p = parse('parlare');
    expect(p.cells).toHaveLength(57 - 1); // the auxiliary is separate
    expect(cell(p, 'indicative.present.1sg').forms.map(f => f.text)).toEqual(['parlo']);
    expect(cell(p, 'conditional.present.3sg').forms.map(f => f.text)).toEqual(['parlerebbe']);
    expect(cell(p, 'imperative.negative.2sg').forms.map(f => f.text)).toEqual(['non parlare']);
    expect(p.auxiliaries).toEqual([{ lemma: 'avere', notes: [] }]);
  });

  it('reads clitics and alternatives', () => {
    expect(cell(parse('lavarsi'), 'imperative.negative.2sg').forms.map(f => f.text).sort()).toEqual(['non lavarti', 'non ti lavare']);
    expect(cell(parse('lavarsi'), 'participle.past').scope).toBe('unmodelled');
    expect(cell(parse('andare'), 'imperative.present.2sg').forms.map(f => f.text)).toEqual(['vai', "va'"]);
  });

  it('uses only the first table', () => { expect(cell(parse('andare'), 'indicative.present.1sg').forms.map(f => f.text)).toEqual(['vado']); });
});

const subjectOf = (c: WiktionaryCell): string | undefined => c.subject === null ? undefined
  : c.mood === 'imperative' && c.subject === '3sg' ? '3sg.formal' : c.mood === 'imperative' && c.subject === '3pl' ? '3pl.formal'
    : c.subject === '3sg' ? '3sg.m' : c.subject;

describe('en.wiktionary oracle', () => {
  it('has every pinned page, with its attribution', () => {
    expect(fixture.pages.map(page => [page.title, page.revid])).toEqual(wiktionaryPins.pages.map(page => [page.title, page.revid]));
    expect([fixture.licence, fixture.attribution]).toEqual(['CC BY-SA 4.0', 'English Wiktionary contributors']);
    for (const page of fixture.pages) expect(page.url).toBe(`https://en.wiktionary.org/w/index.php?title=${encodeURIComponent(page.title)}&oldid=${page.revid}`);
  });

  it.each(fixture.pages.map(page => [page.title, page] as const))('%s', (_, page) => {
    const results = [{}, { mood: 'imperative', subject: '3sg.formal' }, { mood: 'imperative', subject: '3pl.formal' }]
      .map(options => conjugate({ language: 'it', infinitive: page.title, ...options } as never));
    const forms = results.flatMap(result => result.forms);
    const unavailable = results.flatMap(result => result.unavailableTargets);
    const analysis = results[0]!.analysis;
    const auxiliaries = [...new Set([analysis, ...analysis.alternatives ?? []].flatMap(a => a.auxiliaries))].sort();
    const auxiliaryCell = { key: 'auxiliary', mood: 'auxiliary', tense: '', subject: null, forms: page.auxiliaries.map(a => ({ text: a.lemma, notes: a.notes })), unavailable: false };
    const auxiliaryFix = wiktionaryItalianCorrection(page, auxiliaryCell);
    expect(auxiliaries, `${page.title} auxiliaries`).toEqual([...auxiliaryFix?.expected ?? page.auxiliaries.map(a => a.lemma)].sort());
    for (const c of page.cells) {
      if (c.scope === 'unmodelled') continue;
      const fix = wiktionaryItalianCorrection(page, c);
      const expected = fix?.expected ?? c.forms.map(form => form.text);
      const subject = subjectOf(c);
      const matches = (target: { mood: string; tense: string; subject?: string }) =>
        target.mood === c.mood && target.tense === c.tense && (subject === undefined || target.subject === subject);
      const generated = forms.filter(form => matches(form.target)).map(form => renderParts('it', form.parts, { bare: true }));
      if (fix?.unavailable ?? c.unavailable) {
        expect(generated, `${page.title} ${c.key} is unavailable`).toEqual([]);
        expect(unavailable.some(u => matches(u.target)), `${page.title} ${c.key} is declared unavailable`).toBe(true);
        continue;
      }
      for (const form of expected) expect(generated, `${page.title} ${c.key}: ${form}`).toContain(form);
    }
  });

  it('pins the size of the oracle and its ledger', () => {
    expect(fixture.pages).toHaveLength(63);
    expect(fixture.pages.reduce((sum, page) => sum + page.cells.length, 0)).toBe(OracleCells);
    expect(fixture.pages.flatMap(page => page.cells).filter(c => c.scope === 'unmodelled')).toHaveLength(OracleUnmodelled);
    expect(wiktionaryRules).toHaveLength(LedgerRules);
    for (const rule of wiktionaryRules) {
      expect(rule.reason.length, rule.reason).toBeGreaterThan(30);
      expect(rule.source).toMatch(/^https:\/\/www\.treccani\.it\//u);
    }
  });
});

const OracleCells = 3361;
const OracleUnmodelled = 6;
const LedgerRules = 8;
