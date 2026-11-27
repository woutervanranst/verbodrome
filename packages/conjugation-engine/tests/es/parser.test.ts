/** The Spanish corpus parser on small pages built from the page layout (grammar design §9.2–9.3); no source file is copied. */
import { describe, expect, it } from 'vitest';
import { applyRemaps } from '../../scripts/corpus/model.ts';
import { spanish } from '../../scripts/corpus/languages/es.ts';
import { lineAlternatives, parseSpanish, spanishCellsPerFile, spanishColumns } from '../../scripts/corpus/parsers/es.ts';

const labels = ['(yo)', '(t&uacute;)', '(&eacute;l)', '(ns)', '(vs)', '(ellos)'];
const finite = (form: string, que = false) => labels.map(label => `${que ? 'que ' : ''}${label} ${form}`).join('<br />');
const imperative = (form: string) => ['-', ...Array(5).fill(form)].join('<br />');
const content = (cells: readonly string[]) => `<tr>${cells.map(cell => `<td width="25%" valign="top">${cell}</td>`).join('')}</tr>`;
const header = (titles: readonly string[]) => `<tr bgcolor="#EEEEEE">${titles.map(title => `<td width="25%"><b><i>${title}</i></b></td>`).join('')}</tr>`;
const heading = (...titles: string[]) => `<table><tr bgcolor="#EEEEEE">${titles.map(title => `<td><font size="4" color="#4186CB"><b>${title}</b></font></td>`).join('')}</tr></table>`;

/** A page in the corpus layout; `override` replaces the HTML of a content cell by its position (0–27). */
function page(override: Readonly<Record<number, string>> = {}, indicativeHeading = 'Indicative'): string {
  const cell = (position: number, fallback: string) => override[position] ?? fallback;
  const indicative = [
    ['Present', 'Present perfect', 'Imperfect', 'Pluperfect'], ['Simple past', 'Past perfect', 'Future', 'Past future'],
    ['Conditional', 'Past conditional', 'Imperative', 'Imperative negative'],
  ];
  const subjunctive = [['Present', 'Past', 'Imperfect', 'Pluperfect'], ['Imperfect (2)', 'Pluperfect (2)', 'Future', 'Past future']];
  let position = 0;
  const rows = (groups: string[][], fill: (index: number) => string) => groups.map(titles =>
    header(titles) + content(titles.map(() => { const at = position++; return cell(at, fill(at)); }))).join('');
  return `<html><body><table><tr><td><b><font size="5">amar</font></b></td></tr></table>`
    + heading(indicativeHeading) + `<table>${rows(indicative, at => at === 10 || at === 11 ? imperative('am<b>a</b>') : finite('am<b>o</b>'))}</table>`
    + heading('Subjunctive') + `<table>${rows(subjunctive, () => finite('am<b>e</b>', true))}</table>`
    + heading('Infinitive', 'Gerundive') + `<table>${rows([['Present', 'Past', 'Present', 'Past']], () => 'am<b>ar</b>')}</table>`
    + heading('Participle') + `<table>${rows([['Participle past', 'Participle past', '&nbsp;', '&nbsp;']], at => at >= 26 ? '&nbsp;' : at === 25 ? '-' : 'am<b>ado</b>')}</table>`
    + '</body></html>';
}

describe('Spanish corpus parser', () => {
  it('splits a bold segment with alternatives into whole forms', () => {
    expect(lineAlternatives('(yo) p<b>udrí/odrí</b>', 'x')).toEqual({ original: '(yo) pudrí/(yo) podrí', expected: ['(yo) pudrí', '(yo) podrí'] });
    const parsed = parseSpanish(page({ 4: `(yo) p<b>udr&iacute;/odr&iacute;</b><br />${finite('p<b>udriste</b>').split('<br />').slice(1).join('<br />')}` }), 'a.html');
    const first = parsed.cells.find(cell => cell.target.tense === 'simple_past')!;
    expect(first).toMatchObject({ original: 'yo pudrí/podrí', expected: ['yo pudrí', 'yo podrí'], subject: '1sg' });
  });

  it('reads the pronoun labels, que and the subject slots', () => {
    const { cells, templatePlaceholders } = parseSpanish(page(), 'a.html');
    expect(cells).toHaveLength(spanishCellsPerFile);
    expect(spanishCellsPerFile).toBe(124);
    expect(templatePlaceholders).toBe(4);
    expect(cells[3]).toMatchObject({ expected: ['nosotros amo'], subject: '1pl', target: { person: 1, number: 'plural' } });
    expect(cells.find(cell => cell.target.mood === 'subjunctive')!.expected).toEqual(['que yo ame']);
    const commands = cells.filter(cell => cell.target.mood === 'imperative' && cell.target.tense === 'present');
    expect(commands.map(cell => cell.subject)).toEqual(['2sg', '2sg.formal', '1pl', '2pl', '2pl.formal']);
    expect(commands.map(cell => `${cell.target.person}${cell.target.number}`)).toEqual(['2singular', '3singular', '1plural', '2plural', '3plural']);
    expect(cells.filter(cell => cell.variant?.pattern === 'se')).toHaveLength(12);
    expect(cells.at(-1)).toMatchObject({ target: { mood: 'participle', tense: 'past' }, variant: { pattern: 'irregular' }, sourceUnavailable: true });
  });

  it('remaps the six mislabelled headings', () => {
    const { cells } = applyRemaps(parseSpanish(page(), 'a.html').cells, spanish.remaps!);
    const tenses = (heading: string) => [...new Set(cells.filter(cell => cell.heading === heading).map(cell => `${cell.target.mood}.${cell.target.tense}`))];
    expect(tenses('Indicative/Past perfect')).toEqual(['indicative.past_anterior']);
    expect(tenses('Indicative/Past future')).toEqual(['indicative.future_perfect']);
    expect(tenses('Subjunctive/Past future')).toEqual(['subjunctive.future_perfect']);
    expect(tenses('Gerundive/Present')).toEqual(['gerund.present']);
    expect(cells.filter(cell => cell.heading !== undefined)).toHaveLength(6 + 6 + 6 + 6 + 1 + 1);
  });

  it('refuses a page that is not the template', () => {
    expect(() => parseSpanish('<html></html>', 'bad.html')).toThrow('28 Spanish table cells');
    expect(() => parseSpanish(page({}, 'Present tense'), 'bad.html')).toThrow('unexpected heading');
    expect(() => parseSpanish(page({ 0: 'am<b>o</b>' }), 'bad.html')).toThrow('expected 6 lines');
    expect(() => parseSpanish(page({ 0: finite('am<b>o</b>').replace('(t&uacute;)', '(vs)') }), 'bad.html')).toThrow('pronoun label');
    expect(() => parseSpanish(page({ 10: imperative('am<b>a</b>').replace('-', 'am<b>a</b>') }), 'bad.html')).toThrow('not a dash');
    expect(spanishColumns).toHaveLength(28);
  });
});
