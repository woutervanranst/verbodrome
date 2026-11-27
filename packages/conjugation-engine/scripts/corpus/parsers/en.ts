/**
 * The English corpus pages (design §9.1–9.2). The content between the `Full_width_text` comments holds 22 `<p>` blocks
 * in a fixed order: one nominal block (infinitive, participle, gerund), 20 blocks of six person rows, and the imperative.
 * A row's value spans are alternates separated by `; `; an alternate with fewer words than the first takes the missing
 * leading words from it (`have betted; bet` → `have bet`). A region tag `(U)` / `(E)` stays on its alternate as the
 * suffix ` (US)` / ` (GB)`, which the language module's `applicable` matches against labelled engine forms. Anything
 * else the page does is an error naming the file.
 */
import { load } from 'cheerio';
import type { Mood, Tense } from '../../../src/types.js';
import { corpusCell, normalizeText } from '../model.ts';
import type { CorpusCell, ParsedCorpus } from '../model.ts';

export const englishCellsPerFile = 126;

const begin = '<!-- #BeginEditable "Full_width_text" -->';
const end = '<!-- #EndEditable -->';

/** The subject slot of each person row, in page order (I, you, he, we, you, they). */
const slots = ['1sg', '2sg', '3sg.m', '1pl', '2pl', '3pl'] as const;
const pronouns = ['I', 'you', 'he', 'we', 'you', 'they'] as const;

/**
 * The 22 blocks in page order: the heading path the page prints and the mood and tense it states. Where the page's
 * label is wrong (a second "Present", "Imperfect", "Gerund") the cells keep the page's own label here and a remap of
 * the language module corrects them.
 */
const blocks: readonly (readonly [string, Mood, Tense])[] = [
  ['Nominal Forms', 'infinitive', 'present'],
  ['Indicative › Present', 'indicative', 'present'],
  ['Indicative › Perfect', 'indicative', 'perfect'],
  ['Indicative › Past', 'indicative', 'past'],
  ['Indicative › Pluperfect', 'indicative', 'pluperfect'],
  ['Indicative › Future', 'indicative', 'future'],
  ['Indicative › Future perfect', 'indicative', 'future_perfect'],
  ['Subjunctive › Present', 'subjunctive', 'present'],
  ['Subjunctive › Present #2', 'subjunctive', 'present'],
  ['Subjunctive › Imperfect', 'subjunctive', 'imperfect'],
  ['Subjunctive › Pluperfect', 'subjunctive', 'pluperfect'],
  ['Conditional › Present', 'conditional', 'present'],
  ['Conditional › Perfect', 'conditional', 'past'],
  ['Imperative', 'imperative', 'present'],
  ['Progressive (Continuous) Forms › Indicative › Present', 'indicative', 'present_progressive'],
  ['Progressive (Continuous) Forms › Indicative › Perfect', 'indicative', 'perfect_progressive'],
  ['Progressive (Continuous) Forms › Indicative › Past', 'indicative', 'past_progressive'],
  ['Progressive (Continuous) Forms › Indicative › Pluperfect', 'indicative', 'pluperfect_progressive'],
  ['Progressive (Continuous) Forms › Indicative › Future', 'indicative', 'future_progressive'],
  ['Progressive (Continuous) Forms › Indicative › Future perfect', 'indicative', 'future_perfect_progressive'],
  ['Progressive (Continuous) Forms › Conditional › Present', 'conditional', 'present_progressive'],
  ['Progressive (Continuous) Forms › Conditional › Perfect', 'conditional', 'past_progressive'],
];

/** The nominal block's three labelled rows: the page's label, and the mood and tense it states. */
const nominal: readonly (readonly [string, Mood, Tense])[] = [
  ['Infinitive', 'infinitive', 'present'],
  ['Participle', 'participle', 'past'],
  ['Gerund', 'gerund', 'present'],
];

/** One line of a block: its label (`<b>`), its pronoun (`<font>`), and the value spans in order. */
interface Line {
  readonly label: string;
  readonly pronoun: string;
  readonly values: readonly string[];
}

function lineOf(html: string, fail: (message: string) => never): Line {
  const $ = load(html, null, false);
  const label = normalizeText($('b').text()).replace(/:$/u, '');
  const pronoun = normalizeText($('font').text());
  $('b, font').remove();
  const values = $('span').toArray().map(span => normalizeText($(span).text()));
  const text = normalizeText($.root().text());
  // Between the value spans, in order, the page prints only the alternative separator.
  let rest = text;
  for (const value of values) {
    const at = rest.indexOf(value);
    if (at < 0 || !/^[\s;]*$/u.test(rest.slice(0, at))) fail(`unexpected text between values: ${text}`);
    rest = rest.slice(at + value.length);
  }
  if (!/^[\s;]*$/u.test(rest)) fail(`unexpected text after the values: ${text}`);
  return { label, pronoun, values };
}

/** A value with its region tag moved to a `(US)` / `(GB)` suffix: `gotten (U)` → `gotten`, `US`. */
function regionOf(value: string): { readonly text: string; readonly region: 'US' | 'GB' | null } {
  const match = /^(.*) \((U|E)\)$/u.exec(value);
  return match ? { text: match[1]!, region: match[2] === 'U' ? 'US' : 'GB' } : { text: value, region: null };
}

/** The alternates of a row: later ones take the leading words they lack from the first; region tags become suffixes. */
function expand(values: readonly string[]): string[] {
  const [first] = values.map(regionOf);
  if (first === undefined) return [];
  const firstWords = first.text.split(' ');
  return values.map(regionOf).map(({ text, region }) => {
    const words = text.split(' ');
    const full = words.length < firstWords.length ? [...firstWords.slice(0, firstWords.length - words.length), ...words].join(' ') : text;
    return region === null ? full : `${full} (${region})`;
  });
}

/** `Let´s get` → `let's get`: the page's acute accent is an apostrophe, its capital the sentence start. */
function imperativeText(value: string): string {
  return value.replace(/^Let´s /u, "let's ");
}

export function parseEnglish(html: string, name: string): ParsedCorpus {
  const fail = (message: string): never => {
    throw new Error(`en: ${name}: ${message}`);
  };
  const from = html.indexOf(begin);
  const to = from < 0 ? -1 : html.indexOf(end, from);
  if (from < 0 || to < 0) fail('no Full_width_text section');
  const $ = load(html.slice(from + begin.length, to));
  let h2 = '';
  let h3 = '';
  const headings: string[] = [];
  const blockLines: Line[][] = [];
  for (const element of $('h2, h3, p').toArray()) {
    const text = normalizeText($(element).text());
    if (element.tagName === 'h2') {
      h2 = text;
      continue;
    }
    if (element.tagName === 'h3') {
      h3 = text;
      continue;
    }
    const block = $(element);
    // A person block's heading is its first <b> (sometimes with a <br> inside); the nominal block labels every row.
    const label = h3 === 'Nominal Forms' || h3 === 'Imperative' ? '' : normalizeText(block.find('b').first().text());
    if (label) block.find('b').remove();
    const lines = (block.html() ?? '').split(/<br\s*\/?\s*>/iu).map(part => lineOf(part, fail)).filter(line => line.values.length || line.label);
    const path = [h2, h3, label].filter(Boolean).join(' › ');
    const repeated = headings.filter(heading => heading === path || heading.startsWith(`${path} #`)).length;
    headings.push(repeated ? `${path} #${repeated + 1}` : path);
    blockLines.push(lines);
  }
  if (headings.length !== blocks.length) fail(`${headings.length} blocks instead of ${blocks.length}`);
  const cells: CorpusCell[] = [];
  let placeholders = 0;
  for (const [index, [heading, mood, tense]] of blocks.entries()) {
    if (headings[index] !== heading) fail(`block ${index} is "${headings[index]}", expected "${heading}"`);
    const lines = blockLines[index]!;
    if (heading === 'Nominal Forms') {
      if (lines.length !== nominal.length) fail(`the nominal block has ${lines.length} rows`);
      for (const [row, [label, nominalMood, nominalTense]] of nominal.entries()) {
        const line = lines[row]!;
        if (line.label !== label) fail(`nominal row ${row} is "${line.label}", expected "${label}"`);
        cells.push(corpusCell({
          mood: nominalMood, tense: nominalTense, original: line.values.join('; '), index: 0, expected: expand(line.values),
          heading: `Nominal Forms › ${label}`,
        }));
      }
      continue;
    }
    if (lines.length !== 6) fail(`${heading} has ${lines.length} rows instead of 6`);
    for (const [row, line] of lines.entries()) {
      if (mood === 'imperative') {
        // The page prints the imperative in rows 1, 3 and 4 (you, we, you); rows 0, 2 and 5 are empty template rows.
        const blank = line.values.every(value => value === '');
        if ([0, 2, 5].includes(row)) {
          if (!blank) fail(`imperative row ${row} is not empty`);
          placeholders++;
          continue;
        }
        if (blank || line.values.length !== 1) fail(`imperative row ${row} has ${line.values.length} values`);
        cells.push(corpusCell({
          mood, tense, original: line.values[0]!, index: row, expected: [imperativeText(line.values[0]!)], subject: slots[row], heading,
        }));
        continue;
      }
      if (line.pronoun !== pronouns[row]) fail(`${heading} row ${row} has the pronoun "${line.pronoun}"`);
      if (!line.values.length || line.values.some(value => !value)) fail(`${heading} row ${row} has an empty value`);
      cells.push(corpusCell({
        mood, tense, original: `${line.pronoun} ${line.values.join('; ')}`, index: row,
        expected: expand(line.values).map(value => `${line.pronoun} ${value}`), subject: slots[row], heading,
      }));
    }
  }
  if (cells.length !== englishCellsPerFile) fail(`${cells.length} cells instead of ${englishCellsPerFile}`);
  return { cells, templatePlaceholders: placeholders };
}
