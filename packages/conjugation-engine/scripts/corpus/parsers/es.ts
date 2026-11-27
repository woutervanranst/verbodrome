/**
 * The Spanish corpus parser (grammar design §9.1–9.3). A page has 28 content cells (`td[valign="top"]`) under block
 * headings (`Indicative`, `Subjunctive`, `Infinitive` and `Gerundive` side by side, `Participle`) and column labels in
 * the grey header rows. Each cell holds six `<br />`-separated lines (`(yo) am<b>o</b>`) or one; a `/` inside a bold
 * segment separates two endings (`p<b>udrí/odrí</b>` is pudrí and podrí). Cells keep the page's own reading of their
 * heading; the language module's remaps correct the six headings that name the wrong tense, and those cells carry
 * `heading`. The imperative columns have a dash in the yo line and the participle table two empty columns: four
 * template placeholders per page.
 */
import { load } from 'cheerio';
import type { Mood, Tense } from '../../../src/types.js';
import { corpusCell, normalizeText } from '../model.ts';
import type { CorpusCell, ParsedCorpus } from '../model.ts';

/** How a content cell is read: its lines, the mood and tense its heading states, and the variant its column is. */
interface Column {
  readonly path: string;
  readonly mood: Mood;
  readonly tense: Tense;
  readonly lines: 1 | 6;
  readonly imperative?: true;
  readonly placeholder?: true;
  readonly pattern?: string;
}

const finite = (path: string, mood: Mood, tense: Tense, extra: Partial<Column> = {}): Column => ({ path, mood, tense, lines: 6, ...extra });
const single = (path: string, mood: Mood, tense: Tense, extra: Partial<Column> = {}): Column => ({ path, mood, tense, lines: 1, ...extra });

/** The 28 content cells in page order (design §9.2), each with the mood and tense its heading states. */
export const spanishColumns: readonly Column[] = [
  finite('Indicative/Present', 'indicative', 'present'),
  finite('Indicative/Present perfect', 'indicative', 'perfect'),
  finite('Indicative/Imperfect', 'indicative', 'imperfect'),
  finite('Indicative/Pluperfect', 'indicative', 'pluperfect'),
  finite('Indicative/Simple past', 'indicative', 'simple_past'),
  // "Past perfect" names the pluperfect; the cell holds hube amado (remapped to the past anterior).
  finite('Indicative/Past perfect', 'indicative', 'pluperfect'),
  finite('Indicative/Future', 'indicative', 'future'),
  // "Past future" reads as a future in the past (the conditional); the cell holds habré amado (remapped).
  finite('Indicative/Past future', 'conditional', 'present'),
  finite('Indicative/Conditional', 'conditional', 'present'),
  finite('Indicative/Past conditional', 'conditional', 'past'),
  finite('Indicative/Imperative', 'imperative', 'present', { imperative: true }),
  finite('Indicative/Imperative negative', 'imperative', 'negative', { imperative: true }),
  finite('Subjunctive/Present', 'subjunctive', 'present'),
  finite('Subjunctive/Past', 'subjunctive', 'past'),
  finite('Subjunctive/Imperfect', 'subjunctive', 'imperfect', { pattern: 'ra' }),
  finite('Subjunctive/Pluperfect', 'subjunctive', 'pluperfect', { pattern: 'ra' }),
  finite('Subjunctive/Imperfect (2)', 'subjunctive', 'imperfect', { pattern: 'se' }),
  finite('Subjunctive/Pluperfect (2)', 'subjunctive', 'pluperfect', { pattern: 'se' }),
  finite('Subjunctive/Future', 'subjunctive', 'future'),
  // Read as the future: the cell holds hubiere amado (remapped to the future perfect).
  finite('Subjunctive/Past future', 'subjunctive', 'future'),
  single('Infinitive/Present', 'infinitive', 'present'),
  single('Infinitive/Past', 'infinitive', 'past'),
  // A gerundive is a verbal adjective, read as a participle; the cells hold amando, habiendo amado (remapped).
  single('Gerundive/Present', 'participle', 'present'),
  single('Gerundive/Past', 'participle', 'perfect'),
  single('Participle/Participle past', 'participle', 'past'),
  // The second participle column: a second, irregular participle where the verb has one.
  single('Participle/Participle past', 'participle', 'past', { pattern: 'irregular' }),
  single('Participle/', 'participle', 'past', { placeholder: true }),
  single('Participle/', 'participle', 'past', { placeholder: true }),
];

/** The headings the language module's remaps correct: their cells carry `heading`. */
export const spanishRemappedHeadings: readonly string[] = [
  'Indicative/Past perfect', 'Indicative/Past future', 'Subjunctive/Past', 'Subjunctive/Past future', 'Gerundive/Present', 'Gerundive/Past',
];

export const spanishCellsPerFile = spanishColumns.reduce((sum, column) => sum + (column.placeholder ? 0 : column.imperative ? 5 : column.lines), 0);

const pronouns = ['yo', 'tú', 'él', 'ns', 'vs', 'ellos'] as const;
const pronounText: Readonly<Record<string, string>> = { yo: 'yo', tú: 'tú', él: 'él', ns: 'nosotros', vs: 'vosotros', ellos: 'ellos' };
const subjects = ['1sg', '2sg', '3sg', '1pl', '2pl', '3pl'] as const;
/** The imperative lines 1–5 are the commands of tú, usted, nosotros, vosotros and ustedes, at their own person and number. */
const imperativeSubjects = ['', '2sg', '2sg.formal', '1pl', '2pl', '2pl.formal'] as const;

/** The text of an HTML fragment: tags dropped, entities decoded, whitespace normalised. */
function textOf(html: string): string {
  return normalizeText(load(`<p>${html}</p>`)('p').text());
}

/** The alternatives of one line: one per `/`-separated ending in its bold segment, or the line itself. */
export function lineAlternatives(html: string, where: string): { original: string; expected: string[] } {
  const bold = [...html.matchAll(/<b>(.*?)<\/b>/gu)].filter(match => match[1]!.includes('/'));
  if (bold.length > 1) throw new Error(`${where}: more than one bold segment with alternatives.`);
  if (!bold.length) {
    const text = textOf(html);
    return { original: text, expected: text === '-' ? [] : [text] };
  }
  const [match] = bold;
  const before = html.slice(0, match!.index);
  const after = html.slice(match!.index! + match![0].length);
  const expected = match![1]!.split('/').map(ending => textOf(`${before}${ending}${after}`));
  return { original: expected.join('/'), expected };
}

/** A finite line without its pronoun label, which must be the one of its row: `(ns) amamos` → `nosotros amamos`. */
function withPronoun(text: string, index: number, where: string): string {
  const match = /^(que )?\(([^)]+)\) (.*)$/u.exec(text);
  if (!match) {
    if (text === '-') return text;
    throw new Error(`${where}: line ${index} has no pronoun label: ${text}`);
  }
  const [, que = '', label, rest] = match;
  if (label !== pronouns[index]) throw new Error(`${where}: line ${index} has the pronoun label (${label}).`);
  return `${que}${pronounText[label!]!} ${rest}`;
}

/** The heading path of every content cell, in page order: the block heading above its column, then its column label. */
function headingPaths($: ReturnType<typeof load>): string[] {
  const paths: string[] = [];
  let blocks: string[] = [];
  $('table').each((_, table) => {
    const headings = $(table).find('font[size="4"] b').map((__, b) => normalizeText($(b).text())).get();
    if (headings.length) {
      blocks = headings;
      return;
    }
    let labels: string[] = [];
    $(table).find('tr').each((__, row) => {
      if ($(row).attr('bgcolor') === '#EEEEEE') {
        labels = $(row).find('td').map((___, td) => normalizeText($(td).text())).get();
        return;
      }
      $(row).find('td[valign="top"]').each((column, ___) => {
        const block = blocks.length === 1 ? blocks[0]! : blocks[Math.floor(column / (4 / blocks.length))] ?? '';
        paths.push(`${block}/${labels[column] ?? ''}`);
      });
    });
  });
  return paths;
}

/** Alternatives written as the page shows them: the word that differs joined with `/` (`yo pudrí/podrí`). */
function joined(alternatives: readonly string[]): string {
  const words = alternatives.map(text => text.split(' '));
  const [first] = words;
  const differing = first!.map((_, at) => words.some(other => other[at] !== first![at]));
  if (words.some(other => other.length !== first!.length) || differing.filter(Boolean).length !== 1) return alternatives.join('/');
  return first!.map((word, at) => differing[at] ? words.map(other => other[at]).join('/') : word).join(' ');
}

/** Parses one page into its 124 cells and four template placeholders. */
export function parseSpanish(html: string, file: string): ParsedCorpus {
  const $ = load(html);
  const tds = $('td[valign="top"]').toArray();
  if (tds.length !== spanishColumns.length) throw new Error(`${file}: expected ${spanishColumns.length} Spanish table cells, found ${tds.length}.`);
  const paths = headingPaths($);
  const cells: CorpusCell[] = [];
  let placeholders = 0;
  for (const [position, column] of spanishColumns.entries()) {
    const where = `${file} cell ${position + 1}`;
    if (paths[position] !== column.path) throw new Error(`${where}: unexpected heading ${paths[position] ?? '(none)'}, expected ${column.path}.`);
    const lines = ($(tds[position]!).html() ?? '').split(/<br\s*\/?>/iu);
    if (lines.length !== column.lines) throw new Error(`${where}: expected ${column.lines} lines, found ${lines.length}.`);
    if (column.placeholder) {
      if (textOf(lines[0]!) !== '') throw new Error(`${where}: the template placeholder is not empty.`);
      placeholders++;
      continue;
    }
    const heading = spanishRemappedHeadings.includes(column.path) ? { heading: column.path } : {};
    const variant = column.pattern ? { variant: { pattern: column.pattern } } : {};
    for (const [index, line] of lines.entries()) {
      const { original, expected } = lineAlternatives(line, `${where} line ${index}`);
      if (column.imperative && index === 0) {
        if (original !== '-') throw new Error(`${where}: the yo line of an imperative is not a dash.`);
        placeholders++;
        continue;
      }
      const label = (text: string) => column.lines === 6 && !column.imperative ? withPronoun(text, index, where) : text;
      const subject = column.lines === 1 ? {} : { subject: column.imperative ? imperativeSubjects[index]! : subjects[index]! };
      const labelled = expected.map(label);
      cells.push(corpusCell({
        mood: column.mood, tense: column.tense, original: labelled.length > 1 ? joined(labelled) : label(original), index, expected: labelled,
        ...subject, ...variant, ...heading,
      }));
    }
  }
  return { cells, templatePlaceholders: placeholders };
}
