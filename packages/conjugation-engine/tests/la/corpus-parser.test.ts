import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { LATIN_FILES, parseLatin } from '../../scripts/corpus/parsers/la.ts';

const page = readFileSync(new URL('./samples/synthetic-page.html', import.meta.url), 'utf8');
const files = { ...LATIN_FILES, 'blorpare.html': 'blorpāre' };

describe('Latin corpus parser', () => {
  it('reads 185 cells in canonical order', () => {
    const { cells, templatePlaceholders } = parseLatin(page, 'blorpare.html', files);
    expect(cells).toHaveLength(185);
    expect(templatePlaceholders).toBe(69 + 15);
    expect(cells[0]).toMatchObject({ target: { mood: 'indicative', tense: 'present', person: 1, number: 'singular' }, voice: 'active', subject: '1sg.m', expected: ['blorpō'] });
  });

  it('maps the infinitives, participles, gerund and supine', () => {
    const { cells } = parseLatin(page, 'blorpare.html', files);
    expect(cells[60]!.target).toMatchObject({ mood: 'infinitive', tense: 'present', agreement: null });
    expect(cells[62]).toMatchObject({ target: { mood: 'infinitive', tense: 'future', agreement: { gender: 'masculine', number: 'singular', case: 'accusative' } }, voice: 'active' });
    expect(cells[63]).toMatchObject({ target: { mood: 'imperative', tense: 'present', person: 2, number: 'singular' }, subject: '2sg.m', expected: ['blorpā'] });
    expect(cells[68]).toMatchObject({ target: { mood: 'imperative', tense: 'future', person: 3, number: 'plural' }, subject: '3pl.m', expected: ['blorpantō'] });
    expect(cells[139]!.target.agreement).toEqual({ gender: 'masculine', number: 'singular', case: 'genitive' });
    expect(cells[143]).toMatchObject({ target: { agreement: { number: 'plural', case: 'nominative' } }, expected: ['blorpantēs'] });
    expect(cells[178]).toMatchObject({ scope: 'unmodelled', reason: 'gerund-nominative' });
    expect(cells[184]!.target).toMatchObject({ mood: 'supine', person: null, number: null, agreement: { gender: 'masculine', number: 'singular', case: 'ablative' } });
  });

  it('splits whole-row alternatives and synthesizes absent blocks', () => {
    const { cells } = parseLatin(page, 'blorpare.html', files);
    expect(cells.find(c => c.original.includes(' / '))!.expected).toEqual(['blorpāvērunt', 'blorpāvēre']);
    expect(cells.slice(69, 138).every(c => c.sourceUnavailable && c.voice === 'passive')).toBe(true);
    expect(cells.slice(168, 183).every(c => c.sourceUnavailable)).toBe(true);
  });

  it('fails loudly', () => {
    expect(() => parseLatin('<html></html>', 'amare.html')).toThrow('185 Latin cells');
    expect(() => parseLatin(page.replace('Conjugation: blorp', 'Conjugation: x'), 'blorpare.html', files)).toThrow('lemma');
    expect(() => parseLatin(page.replace('Indicative future perfect', 'Indicative futurum'), 'blorpare.html', files)).toThrow('unknown active heading');
  });
});
