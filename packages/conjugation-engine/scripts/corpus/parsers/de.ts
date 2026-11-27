/**
 * The German corpus pages (design §9.1–9.3). `#ctl00_ch_divSimple` holds 11 and `#ctl00_ch_divComplex` 8 data blocks
 * (`<font face="Arial" size="2">`), always in the same order; their headings (the `<h3>` above a block, then the
 * block's own underlined `<u><i>` tense) are read only to assert that order. A block's rows are split at `<br>`; a
 * row is the text of its `<i>` segments joined. In a finite block the maroon segment is the person label: rows with
 * the same label are one cell's alternates, an empty row is a cell with no form, and the label becomes the default
 * pronoun (`er/sie/es` → er, `sie/Sie` → sie). In the imperative block a maroon `wir` or `Sie` marks the 1pl and the
 * Sie rows. Cells keep the page's own reading of the heading; the language module's remaps correct the five headings
 * that name the wrong tense. Anything else the page does is an error naming the file.
 */
import { load } from 'cheerio';
import type { Mood, Tense } from '../../../src/types.js';
import { corpusCell, normalizeText } from '../model.ts';
import type { CorpusCell, ParsedCorpus } from '../model.ts';

export const germanCellsPerFile = 92;

/** The 19 blocks in page order: the heading the page prints and the mood and tense that heading states. */
export const germanBlocks: readonly (readonly [string, Mood, Tense])[] = [
  ['Infinitiv Präsens', 'infinitive', 'present'],
  ['Partizip/Präsens', 'participle', 'present'],
  ['Partizip/Perfekt', 'participle', 'past'],
  ['Indikativ/Präsens', 'indicative', 'present'],
  ['Indikativ/Präteritum', 'indicative', 'past'],
  ['Indikativ/Futur I', 'indicative', 'future'],
  ['Imperativ', 'imperative', 'present'],
  ['Konjunktiv I/Präsens', 'subjunctive', 'present'],
  ['Konjunktiv I/Futur I', 'subjunctive', 'future'],
  ['Konjunktiv II/Präsens', 'subjunctive', 'present'],
  ['Konjunktiv II/Futur I', 'subjunctive', 'future'],
  ['Infinitiv Perfekt', 'infinitive', 'perfect'],
  ['Indikativ/Perfekt', 'indicative', 'perfect'],
  ['Indikativ/Plusquamperfekt', 'indicative', 'pluperfect'],
  ['Indikativ/Futur II', 'indicative', 'future_perfect'],
  ['Konjunktiv I/Präteritum', 'subjunctive', 'past'],
  ['Konjunktiv I/Futur II', 'subjunctive', 'future_perfect'],
  ['Konjunktiv II/Präteritum', 'subjunctive', 'past'],
  ['Konjunktiv II/Futur II', 'subjunctive', 'future_perfect'],
];

/** The headings a remap of the language module corrects: their cells carry `heading`. */
export const germanRemappedHeadings: readonly string[] = [
  'Konjunktiv II/Präsens', 'Konjunktiv II/Futur I', 'Konjunktiv I/Präteritum', 'Konjunktiv II/Präteritum', 'Konjunktiv II/Futur II',
];

/** The person labels of a finite block in row order, their subject slots and the pronoun a form is written with. */
const labels = ['ich', 'du', 'er/sie/es', 'wir', 'ihr', 'sie/Sie'] as const;
const slots = ['1sg', '2sg', '3sg', '1pl', '2pl', '3pl'] as const;
const pronouns = ['ich', 'du', 'er', 'wir', 'ihr', 'sie'] as const;

/** One row: its segments (text, maroon or not), in order. */
interface Segment { readonly text: string; readonly maroon: boolean }
type Row = readonly Segment[];

const decode = (html: string): string => load(`<p>${html}</p>`)('p').text();

function rowsOf(block: string): { heading: string | null; rows: Row[] } {
  const pieces = block.split(/<br\s*\/?>/iu);
  // The text after the last <br> is the closing of the block (nothing): drop it.
  if (pieces.length && !/\S/u.test(decode(pieces.at(-1)!))) pieces.pop();
  let heading: string | null = null;
  if (pieces.length && /<u>/iu.test(pieces[0]!)) heading = normalizeText(decode(pieces.shift()!));
  const rows = pieces.map(piece => [...piece.matchAll(/<i\b([^>]*)>([\s\S]*?)<\/i>/giu)]
    .map(match => ({ text: decode(match[2]!), maroon: /color:\s*maroon/iu.test(match[1]!) })));
  return { heading, rows };
}

const textOf = (row: Row): string => normalizeText(row.map(segment => segment.text).join(''));
const labelOf = (row: Row): string | null => {
  const label = row.find(segment => segment.maroon);
  return label === undefined ? null : normalizeText(label.text);
};

/** The six cells of a finite block: rows grouped by repeated label, the label replaced by the default pronoun. */
export function finiteGroups(rows: readonly Row[], where: string): (readonly string[])[] {
  const groups: { label: string | null; texts: string[] }[] = [];
  for (const row of rows) {
    const text = textOf(row);
    if (!text) {
      groups.push({ label: null, texts: [] });
      continue;
    }
    const label = labelOf(row);
    if (label === null) throw new Error(`${where}: a row without a person label: ${text}`);
    const last = groups.at(-1);
    if (last !== undefined && last.label === label) last.texts.push(text);
    else groups.push({ label, texts: [text] });
  }
  if (groups.length !== 6) throw new Error(`${where}: expected 6 person groups, found ${groups.length}`);
  return groups.map(({ label, texts }, index) => {
    if (label === null) return [];
    if (label !== labels[index]) throw new Error(`${where}: row ${index + 1} is labelled ${label}, expected ${labels[index]}`);
    return texts.map(text => {
      if (!text.startsWith(`${label} `)) throw new Error(`${where}: ${text} does not start with its label ${label}`);
      return `${pronouns[index]} ${text.slice(label.length + 1)}`;
    });
  });
}

/** The four imperative cells: du rows, the rows with wir, the ihr rows, the rows with Sie. */
export function imperativeGroups(rows: readonly Row[], where: string): { readonly subject: string; readonly texts: readonly string[] }[] {
  const marked = (row: Row, word: string) => row.some(segment => segment.maroon && normalizeText(segment.text) === word);
  const wir = rows.flatMap((row, index) => marked(row, 'wir') ? [index] : []);
  const sie = rows.flatMap((row, index) => marked(row, 'Sie') ? [index] : []);
  if (!wir.length || !sie.length) throw new Error(`${where}: the imperative has no wir or no Sie row`);
  const group = (from: number, to: number) => rows.slice(from, to).map(textOf).filter(Boolean);
  for (const [index, row] of rows.entries()) {
    const inWir = index >= wir[0]! && index <= wir.at(-1)!;
    const inSie = index >= sie[0]! && index <= sie.at(-1)!;
    if ((inWir && !marked(row, 'wir') && textOf(row)) || (inSie && !marked(row, 'Sie') && textOf(row))) {
      throw new Error(`${where}: an imperative row out of place: ${textOf(row)}`);
    }
  }
  if (sie[0]! < wir.at(-1)!) throw new Error(`${where}: the Sie rows come before the wir rows`);
  return [
    { subject: '2sg', texts: group(0, wir[0]!) },
    { subject: '1pl', texts: group(wir[0]!, wir.at(-1)! + 1) },
    { subject: '2pl', texts: group(wir.at(-1)! + 1, sie[0]!) },
    { subject: '2.formal', texts: group(sie[0]!, sie.at(-1)! + 1) },
  ];
}

/** The blocks of one of the two divisions, each with the heading above it and its own underlined tense. */
function blocksOf(html: string): { heading: string; body: string }[] {
  const marks = [...html.matchAll(/<h3>([\s\S]*?)<\/h3>|<font face="Arial" size="2">([\s\S]*?)<\/font>/giu)];
  const blocks: { heading: string; body: string }[] = [];
  let h3 = '';
  for (const mark of marks) {
    if (mark[1] !== undefined) h3 = normalizeText(decode(mark[1]));
    else blocks.push({ heading: h3, body: mark[2]! });
  }
  return blocks;
}

function cell(mood: Mood, tense: Tense, index: number, texts: readonly string[], heading: string, subject?: string): CorpusCell {
  return corpusCell({
    mood, tense, index, original: texts.length ? texts.join(' | ') : '-', expected: texts,
    ...(subject === undefined ? {} : { subject }),
    ...(germanRemappedHeadings.includes(heading) ? { heading } : {}),
  });
}

/** The 92 cells of a page, in block order. */
export function parseGerman(html: string, file: string): ParsedCorpus {
  const $ = load(html);
  const blocks = ['#ctl00_ch_divSimple', '#ctl00_ch_divComplex'].flatMap(id => blocksOf($(id).html() ?? ''));
  if (blocks.length !== germanBlocks.length) throw new Error(`${file}: expected ${germanBlocks.length} German blocks, found ${blocks.length}`);
  const cells: CorpusCell[] = [];
  for (const [position, { heading: h3, body }] of blocks.entries()) {
    const [expectedHeading, mood, tense] = germanBlocks[position]!;
    const { heading: own, rows } = rowsOf(body);
    const heading = own === null ? h3 : `${h3}/${own}`;
    if (heading !== expectedHeading) throw new Error(`${file}: block ${position} is headed ${heading}, expected ${expectedHeading}`);
    const where = `${file}: ${heading}`;
    if (mood === 'infinitive' || mood === 'participle') {
      cells.push(cell(mood, tense, 0, rows.map(textOf).filter(Boolean), heading));
    } else if (mood === 'imperative') {
      for (const { subject, texts } of imperativeGroups(rows, where)) {
        const index = subject === '2sg' ? 1 : subject === '1pl' ? 3 : subject === '2pl' ? 4 : 5;
        cells.push(cell(mood, tense, index, texts, heading, subject));
      }
    } else {
      for (const [index, texts] of finiteGroups(rows, where).entries()) cells.push(cell(mood, tense, index, texts, heading, slots[index]));
    }
  }
  if (cells.length !== germanCellsPerFile) throw new Error(`${file}: expected ${germanCellsPerFile} cells, found ${cells.length}`);
  return { cells, templatePlaceholders: 0 };
}
