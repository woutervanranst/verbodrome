import { describe, expect, it } from 'vitest';
import { italian } from '../../scripts/corpus/languages/it.ts';
import { applyRemaps } from '../../scripts/corpus/model.ts';
import { parseItalian } from '../../scripts/corpus/parsers/it.ts';
import { verbixPage } from './verbix-page.js';
import type { PageSpec } from './verbix-page.js';

const six = (forms: readonly string[]): string[][] => forms.map(form => [form]);
const compound = (aux: readonly string[], participle: string): string[][] => six(aux.map(a => `${a} ${participle}`));

/** andare's rows, written out by hand from the shape of the source page. */
const andareLike: PageSpec = {
  infinitive: 'andare',
  nominal: [['andare'], ['andante'], ['andando'], ['andato']],
  compound: ['essere andato', 'essendo andato', 'essente andato'],
  finite: {
    Indicativo: [
      ['Presente', [['vado', 'vo'], ['vai'], ['va'], ['andiamo'], ['andate'], ['vanno']]],
      ['Passato prossimo', compound(['sono', 'sei', 'è', 'siamo', 'siete', 'sono'], 'andato')],
      ['Imperfetto', six(['andavo', 'andavi', 'andava', 'andavamo', 'andavate', 'andavano'])],
      ['Trapassato prossimo', compound(['ero', 'eri', 'era', 'eravamo', 'eravate', 'erano'], 'andato')],
      ['Futuro', six(['andrò', 'andrai', 'andrà', 'andremo', 'andrete', 'andranno'])],
      ['Futuro anteriore', compound(['sarò', 'sarai', 'sarà', 'saremo', 'sarete', 'saranno'], 'andato')],
      ['Passato remoto', six(['andai', 'andasti', 'andò', 'andammo', 'andaste', 'andarono'])],
      ['Trapassato remoto', compound(['fui', 'fosti', 'fu', 'fummo', 'foste', 'furono'], 'andato')],
    ],
    Congiuntivo: [
      ['Presente', six(['vada', 'vada', 'vada', 'andiamo', 'andiate', 'vadano'])],
      ['Passato prossimo', compound(['sia', 'sia', 'sia', 'siamo', 'siate', 'siano'], 'andato')],
      ['Imperfetto', six(['andassi', 'andassi', 'andasse', 'andassimo', 'andaste', 'andassero'])],
      ['Trapassato prossimo', compound(['fossi', 'fossi', 'fosse', 'fossimo', 'foste', 'fossero'], 'andato')],
    ],
    Condizionale: [
      ['Presente', six(['andrei', 'andresti', 'andrebbe', 'andremmo', 'andreste', 'andrebbero'])],
      ['Passato', compound(['sarei', 'saresti', 'sarebbe', 'saremmo', 'sareste', 'sarebbero'], 'andato')],
    ],
  },
  imperative: [["va'", 'vai'], ['vada'], ['andiamo'], ['andate'], ['vadano']],
};

describe('Italian corpus parser', () => {
  const page = verbixPage(andareLike);

  it('reads 96 cells in order', () => { expect(parseItalian(page, 'andare.html').cells).toHaveLength(96); });

  it('reads rows with their pronouns, alternates and entities', () => {
    const cells = parseItalian(page, 'andare.html').cells;
    expect(cells[7]).toMatchObject({ target: { mood: 'indicative', tense: 'present', person: 1, number: 'singular' }, subject: '1sg', expected: ['io vado', 'io vo'] });
    expect(cells[9]!.expected).toEqual(['lui va']);
    expect(cells[13]!.expected).toEqual(['io sono andato']);
    expect(cells[15]!.expected).toEqual(['lui è andato']);
    expect(cells[91]).toMatchObject({ target: { mood: 'imperative', person: 2 }, expected: ["va'", 'vai'] });
    expect(cells.slice(0, 6).map(cell => `${cell.target.mood}.${cell.target.tense}`)).toEqual([
      'infinitive.present', 'participle.present', 'gerund.present', 'participle.past', 'infinitive.past', 'gerund.past']);
  });

  it('maps the mislabelled congiuntivo heading and the courtesy imperative through the remaps', () => {
    const parsed = parseItalian(page, 'andare.html').cells;
    expect(parsed[61]).toMatchObject({ target: { mood: 'subjunctive', tense: 'perfect' }, heading: 'Congiuntivo/Passato prossimo' });
    const { cells, matched } = applyRemaps(parsed, italian.remaps!);
    expect(matched).toEqual([true, true, true]);
    expect(cells[61]).toMatchObject({ target: { mood: 'subjunctive', tense: 'past' }, expected: ['io sia andato'] });
    expect(cells[73]).toMatchObject({ target: { mood: 'subjunctive', tense: 'pluperfect' }, heading: 'Congiuntivo/Trapassato prossimo' });
    expect(cells[92]).toMatchObject({ target: { mood: 'imperative', person: 3, number: 'singular' }, subject: '3sg.formal', expected: ['vada'] });
    expect(cells[95]).toMatchObject({ subject: '3pl.formal', expected: ['vadano'] });
  });

  it('keeps the compound participle unmodelled, counts the placeholder, reads notused', () => {
    const parsed = parseItalian(page, 'andare.html');
    expect(parsed.cells[6]).toMatchObject({ scope: 'unmodelled', reason: 'compound-participle' });
    expect(parsed.templatePlaceholders).toBe(1);
    expect(parseItalian(verbixPage({ ...andareLike, notused: true }), 'potere.html').cells[91]!.sourceUnavailable).toBe(true);
  });

  it('fails loudly on a page it does not recognise', () => { expect(() => parseItalian('<html></html>', 'x.html')).toThrow('96 Italian cells'); });
});
