/** The German corpus parser on small pages built from the page layout (design §9.1–9.3); no source file is copied. */
import { describe, expect, it } from 'vitest';
import { applyRemaps } from '../../scripts/corpus/model.ts';
import { german } from '../../scripts/corpus/languages/de.ts';
import { germanBlocks, germanCellsPerFile, parseGerman } from '../../scripts/corpus/parsers/de.ts';

type Row = string;
const segment = (text: string, maroon = false, style = 'normal') =>
  `<tt></tt><i style="font-style:${style};color:${maroon ? 'maroon' : '#003EAD'}">${text}</i>`;
/** A finite row: the maroon person label, then the form. */
const row = (label: string, form: string, style = 'normal'): Row => `${segment(`${label} `, true, style)}${segment(form, false, style)}<br>`;
/** Imperative rows from `|`-separated segments; `wir`, `Sie` and the ending t are maroon, as on the page. */
const imperative = (rows: string[]): Row[] => rows.map(text => {
  const parts = text.split('|');
  const spaced = (part: string, index: number) => (index < parts.length - 1 && parts[index + 1] !== 't' ? `${part} ` : part);
  return `${parts.map((part, index) => segment(spaced(part, index), index > 0 && ['wir', 'Sie', 't'].includes(part))).join('')}<br>`;
});
const persons = ['ich', 'du', 'er/sie/es', 'wir', 'ihr', 'sie/Sie'];
const finite = (form: string): Row[] => persons.map(label => row(label, form));
const block = (heading: string | null, rows: readonly Row[]) =>
  `<td valign="top"><font face="Arial" size="2">${heading === null ? '' : `<u><i>${heading} </i></u><br>`}${rows.join('')}</font></td>`;
const section = (h3: string, blocks: string[]) => `<table><tr><td><h3> ${h3} </h3></td></tr><tr>${blocks.join('')}</tr></table>`;

/** A page in the corpus layout; `rows` replaces the rows of a block given by its position (0–18). */
function page(rows: Readonly<Record<number, readonly Row[]>> = {}, drop: number | null = null): string {
  const at = (position: number, heading: string | null, fallback: readonly Row[]) =>
    position === drop ? '' : block(heading, rows[position] ?? fallback);
  const simple = [
    section('Infinitiv Präsens', [at(0, null, [segment('x') + '<br>'])]),
    section('Partizip', [at(1, 'Präsens', [segment('backend') + '<br>']), at(2, 'Perfekt', [segment('ge') + segment('backen') + '<br>'])]),
    section('Indikativ', [at(3, 'Präsens', finite('backe')), at(4, 'Präteritum', finite('backte')), at(5, 'Futur I', finite('werde backen'))]),
    section('Imperativ', [at(6, null, imperative(['backe', 'back', 'backen|wir', 'back|t', 'backen|Sie']))]),
    section('Konjunktiv I', [at(7, 'Präsens', finite('backe')), at(8, 'Futur I', finite('werde backen'))]),
    section('Konjunktiv II', [at(9, 'Präsens', finite('backte')), at(10, 'Futur I', finite('würde backen'))]),
  ];
  const complex = [
    section('Infinitiv Perfekt', [at(11, null, [segment('gebacken haben') + '<br>'])]),
    section('Indikativ', [at(12, 'Perfekt', finite('habe gebacken')), at(13, 'Plusquamperfekt', finite('hatte gebacken')), at(14, 'Futur II', finite('werde gebacken haben'))]),
    section('Konjunktiv I', [at(15, 'Präteritum', finite('habe gebacken')), at(16, 'Futur II', finite('werde gebacken haben'))]),
    section('Konjunktiv II', [at(17, 'Präteritum', finite('hätte gebacken')), at(18, 'Futur II', finite('würde gebacken haben'))]),
  ];
  return `<html><body><div id="ctl00_ch_divSimple">${simple.join('')}</div><div id="ctl00_ch_divComplex">${complex.join('')}</div></body></html>`;
}

const cellsOf = (position: number, rows: readonly Row[]) => {
  const { cells } = parseGerman(page({ [position]: rows }), 'test.html');
  const start = [0, 1, 2, 3, 9, 15, 21, 25, 31, 37, 43, 49, 50, 56, 62, 68, 74, 80, 86][position]!;
  const size = position === 6 ? 4 : [0, 1, 2, 11].includes(position) ? 1 : 6;
  return cells.slice(start, start + size);
};

describe('German corpus parser', () => {
  it('reads 19 blocks into 92 cells with no template placeholders', () => {
    const parsed = parseGerman(page(), 'test.html');
    expect(parsed.cells).toHaveLength(germanCellsPerFile);
    expect(parsed.templatePlaceholders).toBe(0);
    expect(germanBlocks).toHaveLength(19);
    expect(parsed.cells[0]!.expected).toEqual(['x']);
    expect(parsed.cells[2]!.expected).toEqual(['gebacken']);
    expect(parsed.cells[49]!.expected).toEqual(['gebacken haben']);
  });

  it('groups rows by repeated person label and writes the default pronoun', () => {
    const cells = cellsOf(4, [
      row('ich', 'bewegte'), row('ich', 'bewog', 'ormal'), row('du', 'bewegtest'), row('du', 'bewogst', 'ormal'), row('er/sie/es', 'bewegte'),
      row('wir', 'bewegten'), row('ihr', 'bewegtet'), row('sie/Sie', 'bewegten'), row('sie/Sie', 'bewogen', 'ormal'),
    ]);
    expect(cells.map(c => [c.subject, c.expected])).toEqual([
      ['1sg', ['ich bewegte', 'ich bewog']], ['2sg', ['du bewegtest', 'du bewogst']], ['3sg', ['er bewegte']],
      ['1pl', ['wir bewegten']], ['2pl', ['ihr bewegtet']], ['3pl', ['sie bewegten', 'sie bewogen']],
    ]);
    expect(cells[0]!.original).toBe('ich bewegte | ich bewog');
    expect(cells[0]!.target).toMatchObject({ mood: 'indicative', tense: 'past', person: 1, number: 'singular' });
  });

  it('makes an empty row a cell without forms', () => {
    const cells = cellsOf(3, ['<br>', '<br>', row('er/sie/es', 'geschieht'), '<br>', '<br>', row('sie/Sie', 'geschehen')]);
    expect(cells.map(c => c.sourceUnavailable)).toEqual([true, true, false, true, true, false]);
    expect(cells[0]).toMatchObject({ original: '-', expected: [], availabilityMarker: 'dash' });
    expect(cells[2]!.expected).toEqual(['er geschieht']);
  });

  it('splits the imperative at the wir and Sie rows and keeps the pronoun', () => {
    const cells = cellsOf(6, imperative([
      'umziehe', 'umzieh', 'ziehe|um', 'zieh|um', 'umziehen|wir', 'ziehen|wir|um', 'umzieh|t', 'zieh|t|um', 'umziehen|Sie', 'ziehen|Sie|um',
    ]));
    expect(cells.map(c => [c.subject, c.expected])).toEqual([
      ['2sg', ['umziehe', 'umzieh', 'ziehe um', 'zieh um']], ['1pl', ['umziehen wir', 'ziehen wir um']],
      ['2pl', ['umzieht', 'zieht um']], ['2.formal', ['umziehen Sie', 'ziehen Sie um']],
    ]);
    expect(cells.map(c => [c.target.person, c.target.number])).toEqual([[2, 'singular'], [1, 'plural'], [2, 'plural'], [3, 'plural']]);
  });

  it('marks the five misnamed headings and the language module remaps them', () => {
    const { cells } = parseGerman(page(), 'test.html');
    const { cells: remapped, matched } = applyRemaps(cells, german.remaps!);
    expect(matched).toEqual([true, true, true, true, true]);
    const at = (index: number) => [remapped[index]!.heading, remapped[index]!.target.mood, remapped[index]!.target.tense];
    expect(at(37)).toEqual(['Konjunktiv II/Präsens', 'subjunctive', 'past']);
    expect(at(43)).toEqual(['Konjunktiv II/Futur I', 'conditional', 'present']);
    expect(at(68)).toEqual(['Konjunktiv I/Präteritum', 'subjunctive', 'perfect']);
    expect(at(80)).toEqual(['Konjunktiv II/Präteritum', 'subjunctive', 'pluperfect']);
    expect(at(86)).toEqual(['Konjunktiv II/Futur II', 'conditional', 'past']);
    expect(remapped.filter(c => c.heading !== undefined)).toHaveLength(30);
    expect(remapped[31]!.heading).toBeUndefined();
  });

  it('refuses a page that breaks the layout', () => {
    expect(() => parseGerman(page({}, 18), 'bad.html')).toThrow('bad.html: expected 19 German blocks');
    expect(() => cellsOf(3, [...finite('backe'), row('ich', 'backe')])).toThrow('expected 6 person groups');
    expect(() => cellsOf(3, [row('wir', 'backen'), ...finite('backe').slice(1)])).toThrow(/labelled wir, expected ich/u);
    expect(() => cellsOf(6, imperative(['backe', 'back|t']))).toThrow(/no wir or no Sie row/u);
  });
});
