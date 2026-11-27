/**
 * The Latin corpus parser (grammar design §9.1–9.2). A page's content runs from the `h1` "Conjugation: <lemma>" to the
 * end anchor, in three blocks introduced by a `td colspan="3"` cell: ACTIVE (or none), PASSIVE or NO PASSIVE, and
 * PARTICIPLE. Every heading is a `div` with class `tima1|tima2|tima3` (active), `timp1|timp2|timp3` (passive) or
 * `timz1` (participles), followed by a value `div` whose rows are split at `<br>`. The page's HTML leaves the
 * infinitive value `div`s open, so a value is read only up to the next `<div` or `</div>`.
 *
 * Rows: ` / ` separates whole alternative forms (*futūrum esse / fore*); `-` is a missing form. A NO PASSIVE block, and a
 * page without the gerundive and gerund sections (esse, velle, nōlle, mālle), get synthesized `-` cells, counted as
 * template placeholders. Row 0 of the gerund repeats the present infinitive: it is `unmodelled` (the gerund has no
 * nominative, A&G §159.a). Cells come in the canonical order of design §9.2 whatever the page's column order.
 */
import { load } from 'cheerio';
import type { Agreement, Case, GrammaticalNumber, Mood, Tense } from '../../../src/types.js';
import { corpusCell, normalizeText } from '../model.ts';
import type { CorpusCell, ParsedCorpus } from '../model.ts';

export const latinCellsPerFile = 185;

/** Source file name → infinitive with macrons (design §9.4); a page's `h1` must name the same lemma. */
export const LATIN_FILES: Readonly<Record<string, string>> = {
  'amare.html': 'amāre', 'audire.html': 'audīre', 'capere.html': 'capere', 'esse.html': 'esse', 'ferre.html': 'ferre',
  'fieri.html': 'fierī', 'hortari.html': 'hortārī', 'ire.html': 'īre', 'largiri.html': 'largīrī', 'malle.html': 'mālle',
  'monere.html': 'monēre', 'nolle.html': 'nōlle', 'pati.html': 'patī', 'posse.html': 'posse', 'sequi.html': 'sequī',
  'tegere.html': 'tegere', 'velle.html': 'velle', 'vereri.html': 'verērī',
};

function fail(name: string, why: string): never {
  throw new Error(`${name}: not a page of ${latinCellsPerFile} Latin cells (${why}).`);
}

const decode = (html: string): string => normalizeText(load(`<p>${html}</p>`)('p').text());

/** The finite and infinitive headings of a voice block, in canonical order, with the slots their rows fill. */
const verbHeadings: readonly (readonly [string, Mood, Tense, readonly number[]])[] = [
  ['Indicative present', 'indicative', 'present', [0, 1, 2, 3, 4, 5]],
  ['Indicative imperfect', 'indicative', 'imperfect', [0, 1, 2, 3, 4, 5]],
  ['Indicative future', 'indicative', 'future', [0, 1, 2, 3, 4, 5]],
  ['Indicative perfect', 'indicative', 'perfect', [0, 1, 2, 3, 4, 5]],
  ['Indicative pluperfect', 'indicative', 'pluperfect', [0, 1, 2, 3, 4, 5]],
  ['Indicative future perfect', 'indicative', 'future_perfect', [0, 1, 2, 3, 4, 5]],
  ['Subjunctive present', 'subjunctive', 'present', [0, 1, 2, 3, 4, 5]],
  ['Subjunctive imperfect', 'subjunctive', 'imperfect', [0, 1, 2, 3, 4, 5]],
  ['Subjunctive perfect', 'subjunctive', 'perfect', [0, 1, 2, 3, 4, 5]],
  ['Subjunctive pluperfect', 'subjunctive', 'pluperfect', [0, 1, 2, 3, 4, 5]],
  ['Infinitive present', 'infinitive', 'present', [0]],
  ['Infinitive perfect', 'infinitive', 'perfect', [0]],
  ['Infinitive future', 'infinitive', 'future', [0]],
  // The slot index of an imperative row gives its person and number (1 = 2sg, 2 = 3sg, 4 = 2pl, 5 = 3pl).
  ['Imperative present', 'imperative', 'present', [1, 4]],
  ['Imperative future', 'imperative', 'future', [1, 2, 4, 5]],
];

const cases: readonly Case[] = ['nominative', 'genitive', 'dative', 'accusative', 'ablative'];

/** The participle headings, in canonical order; each yields its rows' agreements. */
const participleHeadings: readonly (readonly [string, Mood, Tense, readonly Agreement[], number | null])[] = [
  ['Participle present active', 'participle', 'present', declined('masculine'), null],
  ['Participle future active', 'participle', 'future', declined('masculine'), null],
  ['Participle perfect passive', 'participle', 'perfect', declined('masculine'), null],
];

function declined(gender: Agreement['gender'], numbers: readonly GrammaticalNumber[] = ['singular', 'plural']): Agreement[] {
  return numbers.flatMap(number => cases.map(grammaticalCase => ({ gender, number, case: grammaticalCase })));
}

interface Heading { readonly block: 'active' | 'passive' | 'participle'; readonly label: string; readonly rows: readonly string[] }

/** The headings of the page in page order, each with the rows of its value `div` (empty rows kept). */
function headingsOf(body: string, name: string): Heading[] {
  const found: Heading[] = [];
  for (const match of body.matchAll(/<div class="tim([apz])\d">(.*?)<\/div>\s*<div>(.*?)(?=<div|<\/div>)/gsu)) {
    const block = match[1] === 'a' ? 'active' : match[1] === 'p' ? 'passive' : 'participle';
    const rows = match[3]!.split(/<br\s*\/?>/u).map(row => decode(row));
    while (rows.length && rows.at(-1) === '') rows.pop();
    found.push({ block, label: decode(match[2]!), rows });
  }
  if (!found.length) fail(name, 'no headings');
  return found;
}

/** A row's alternatives: ` / ` separates whole forms; `-` is none. */
const formsOf = (row: string): string[] | undefined => row === '-' ? undefined : row.split(' / ').map(normalizeText);

/** The supine is a mood without persons; the shared cell builder reads moods it does not know as finite. */
const nonFinite = (cell: CorpusCell): CorpusCell => ({ ...cell, target: { ...cell.target, person: null, number: null } });

function voiceCells(headings: readonly Heading[], voice: 'active' | 'passive', name: string): CorpusCell[] {
  const byLabel = new Map(headings.map(heading => [heading.label, heading]));
  for (const heading of headings) if (!verbHeadings.some(([label]) => label === heading.label)) fail(name, `unknown ${voice} heading ${heading.label}`);
  return verbHeadings.flatMap(([label, mood, tense, slots]) => {
    const heading = byLabel.get(label);
    if (!heading || heading.rows.length !== slots.length) fail(name, `${voice} ${label} has ${heading?.rows.length ?? 0} rows`);
    return heading.rows.map((row, offset) => {
      const index = slots[offset]!;
      const expected = formsOf(row);
      if (mood === 'infinitive') {
        // The future active and the perfect passive infinitive print the accusative (amātūrum esse, amātum esse), and so
        // does a deponent's or fīō's active perfect infinitive written in two words; one word has no agreement.
        const agrees = row.includes(' ') && !/ īrī$/u.test(row);
        const agreement: Agreement | null = agrees ? { gender: 'masculine', number: 'singular', case: 'accusative' } : null;
        return corpusCell({ mood, tense, original: row, index, voice, agreement, ...(expected ? { expected } : {}) });
      }
      const person = index % 3 + 1;
      const number = index < 3 ? 'sg' : 'pl';
      return corpusCell({ mood, tense, original: row, index, voice, subject: `${person}${number}.m`, ...(expected ? { expected } : {}) });
    });
  });
}

/** The 69 cells of a voice the page prints as NO PASSIVE: every one a synthesized `-`. */
function absentVoice(voice: 'passive'): CorpusCell[] {
  return verbHeadings.flatMap(([, mood, tense, slots]) => slots.map(index => mood === 'infinitive'
    ? corpusCell({ mood, tense, original: '-', index, voice })
    : corpusCell({ mood, tense, original: '-', index, voice, subject: `${index % 3 + 1}${index < 3 ? 'sg' : 'pl'}.m` })));
}

/** The participle, gerundive, gerund and supine cells; `missing` counts the synthesized ones. */
function participleCells(headings: readonly Heading[], name: string): { cells: CorpusCell[]; missing: number } {
  const byLabel = (label: string): Heading[] => headings.filter(heading => heading.label === label);
  for (const heading of headings) {
    if (![...participleHeadings.map(([label]) => label), 'Gerundive', 'Gerund', 'Supine'].includes(heading.label)) fail(name, `unknown participle heading ${heading.label}`);
  }
  const cells: CorpusCell[] = [];
  for (const [label, mood, tense, agreements] of participleHeadings) {
    const [heading] = byLabel(label);
    // Ten rows with an empty separator between the singular and the plural.
    const rows = heading?.rows.filter((row, index) => !(index === 5 && row === ''));
    if (!rows || rows.length !== 10) fail(name, `${label} has ${rows?.length ?? 0} rows`);
    rows.forEach((row, index) => {
      const expected = formsOf(row);
      cells.push(corpusCell({ mood, tense, original: row, index, agreement: agreements[index]!, ...(expected ? { expected } : {}) }));
    });
  }
  const gerundives = byLabel('Gerundive');
  const gerund = byLabel('Gerund');
  let missing = 0;
  const gerundiveAgreements = [...declined('masculine', ['singular']), ...declined('masculine', ['plural'])];
  const gerundCases: readonly Case[] = ['genitive', 'dative', 'accusative', 'ablative'];
  if (!gerundives.length && !gerund.length) {
    // The page has no gerundive or gerund section: 15 synthesized cells, the gerund's first row unmodelled as always.
    gerundiveAgreements.forEach((agreement, index) => cells.push(corpusCell({ mood: 'participle', tense: 'gerundive', original: '-', index, agreement })));
    cells.push(corpusCell({ mood: 'gerund', tense: 'present', original: '-', index: 0, scope: 'unmodelled', reason: 'gerund-nominative' }));
    gerundCases.forEach((grammaticalCase, index) => cells.push(corpusCell({
      mood: 'gerund', tense: 'present', original: '-', index: index + 1, agreement: { gender: 'neuter', number: 'singular', case: grammaticalCase },
    })));
    missing = 15;
  } else {
    if (gerundives.length !== 2 || gerund.length !== 1) fail(name, 'the gerundive or gerund section is incomplete');
    const rows = [...gerundives[0]!.rows, ...gerundives[1]!.rows];
    if (rows.length !== 10 || gerund[0]!.rows.length !== 5) fail(name, 'the gerundive or gerund has the wrong number of rows');
    rows.forEach((row, index) => {
      const expected = formsOf(row);
      cells.push(corpusCell({ mood: 'participle', tense: 'gerundive', original: row, index, agreement: gerundiveAgreements[index]!, ...(expected ? { expected } : {}) }));
    });
    const [first, ...oblique] = gerund[0]!.rows;
    cells.push(corpusCell({ mood: 'gerund', tense: 'present', original: first!, index: 0, scope: 'unmodelled', reason: 'gerund-nominative' }));
    oblique.forEach((row, index) => {
      const expected = formsOf(row);
      cells.push(corpusCell({
        mood: 'gerund', tense: 'present', original: row, index: index + 1,
        agreement: { gender: 'neuter', number: 'singular', case: gerundCases[index]! }, ...(expected ? { expected } : {}),
      }));
    });
  }
  const [supine] = byLabel('Supine');
  if (!supine || supine.rows.length !== 2) fail(name, 'no supine');
  supine.rows.forEach((row, index) => {
    const expected = formsOf(row);
    cells.push(nonFinite(corpusCell({
      mood: 'supine', tense: 'present', original: row, index,
      agreement: { gender: 'masculine', number: 'singular', case: index === 0 ? 'accusative' : 'ablative' }, ...(expected ? { expected } : {}),
    })));
  });
  return { cells, missing };
}

/** The 185 cells of a Latin page in canonical order (design §9.2); `files` maps the file name to the lemma. */
export function parseLatin(html: string, name: string, files: Readonly<Record<string, string>> = LATIN_FILES): ParsedCorpus {
  const title = /<h1>Conjugation:\s*(.*?)<\/h1>/su.exec(html);
  if (!title) fail(name, 'no "Conjugation" heading');
  const lemma = decode(title[1]!);
  if (lemma !== files[name]) throw new Error(`${name}: the page's lemma ${lemma} is not ${files[name] ?? '(no lemma listed for this file)'}.`);
  const start = title.index;
  const end = html.indexOf("<a id='end'>", start);
  const body = html.slice(start, end < 0 ? html.length : end);
  const blocks = [...body.matchAll(/<td colspan="3" class="tim[apz]2"><b>(ACTIVE|PASSIVE|NO PASSIVE|PARTICIPLE)<\/b><\/td>/gsu)].map(match => match[1]!);
  if (blocks.join(',') !== 'ACTIVE,PASSIVE,PARTICIPLE' && blocks.join(',') !== 'ACTIVE,NO PASSIVE,PARTICIPLE') fail(name, `blocks ${blocks.join(', ')}`);
  const headings = headingsOf(body, name);
  const passive = blocks[1] === 'PASSIVE';
  const { cells: participles, missing } = participleCells(headings.filter(heading => heading.block === 'participle'), name);
  const cells = [
    ...voiceCells(headings.filter(heading => heading.block === 'active'), 'active', name),
    ...passive ? voiceCells(headings.filter(heading => heading.block === 'passive'), 'passive', name) : absentVoice('passive'),
    ...participles,
  ];
  if (cells.length !== latinCellsPerFile) fail(name, `${cells.length} cells`);
  return { cells, templatePlaceholders: (passive ? 0 : 69) + missing };
}
