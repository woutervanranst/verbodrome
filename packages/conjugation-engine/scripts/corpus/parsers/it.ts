/**
 * The Italian corpus parser (grammar design §9.1–9.2). A page's content lies between the `Full_width_text` markers in
 * five `div.column` blocks headed `Nominal Forms`, `Indicativo`, `Congiuntivo`, `Condizionale` and `Imperativo`.
 *
 * - Nominal Forms: four labelled lines (infinitive, present participle, gerund, past participle) and three compound
 *   lines (infinitive past, gerund past, and a mechanical "avente/essente + participle" that is not an Italian form).
 * - The finite blocks: one `<p>` per tense, a `<b>` label and six lines, each a pronoun (`io`, `tu`, `lui`, `noi`, `voi`,
 *   `loro`) and one or more forms separated by `; `.
 * - Imperativo: six lines without a table; line 0 is a template placeholder.
 *
 * Cells keep the page's reading of their heading; the language module's remaps correct the congiuntivo "Passato
 * prossimo" and the imperative rows lui and loro. A finite cell expects `pronoun form` (`io vado`), an imperative cell
 * the form alone. A `notused` span marks a form the page itself declares unused.
 */
import { load } from 'cheerio';
import type { Mood, Tense } from '../../../src/types.js';
import { corpusCell, normalizeText } from '../model.ts';
import type { CorpusCell, ParsedCorpus } from '../model.ts';

export const italianCellsPerFile = 96;

const text = (html: string): string => normalizeText(load(`<p>${html}</p>`)('p').text());

/** The forms of one line: the text of each form span, in order. */
function forms(line: string): { forms: string[]; notused: boolean } {
  const spans = [...line.replace(/<font\b.*?<\/font>/su, '').matchAll(/<span class="(\w+)">(.*?)<\/span>/gsu)];
  return { forms: spans.map(([, , inner]) => text(inner!)).filter(Boolean), notused: spans.some(([, cls]) => cls === 'notused') };
}

const pronounOf = (line: string): string => text(/<font\b.*?<span class="normal">(.*?)<\/span>/su.exec(line)?.[1] ?? '');

const subjects: Readonly<Record<string, string>> = { io: '1sg', tu: '2sg', lui: '3sg.m', noi: '1pl', voi: '2pl', loro: '3pl' };

const tenses: Readonly<Record<string, Readonly<Record<string, Tense>>>> = {
  Indicativo: {
    Presente: 'present', 'Passato prossimo': 'perfect', Imperfetto: 'imperfect', 'Trapassato prossimo': 'pluperfect', Futuro: 'future',
    'Futuro anteriore': 'future_perfect', 'Passato remoto': 'simple_past', 'Trapassato remoto': 'past_anterior',
  },
  // The page's own reading: "Passato prossimo" is the indicative's name (remapped to the congiuntivo passato).
  Congiuntivo: { Presente: 'present', 'Passato prossimo': 'perfect', Imperfetto: 'imperfect', 'Trapassato prossimo': 'pluperfect' },
  Condizionale: { Presente: 'present', Passato: 'past' },
};
const moods: Readonly<Record<string, Mood>> = { Indicativo: 'indicative', Congiuntivo: 'subjunctive', Condizionale: 'conditional' };
const tenseCounts: Readonly<Record<string, number>> = { Indicativo: 8, Congiuntivo: 4, Condizionale: 2 };

function fail(name: string, why: string): never {
  throw new Error(`${name}: not a page of 96 Italian cells (${why}).`);
}

/** The lines of a `<p>`, split on `<br>`, without empty ones. */
const lines = (html: string): string[] => html.split(/<br\s*\/?>/u).filter(line => /<span/u.test(line));

function nominal(block: string, name: string): CorpusCell[] {
  const [labelled, compound] = [...block.matchAll(/<p>(.*?)<\/p>/gsu)].map(match => match[1]!);
  if (labelled === undefined || compound === undefined) fail(name, 'no nominal forms');
  const byLabel = new Map(lines(labelled).map(line => [text(/<b>(.*?)<\/b>/su.exec(line)?.[1] ?? '').replace(/:$/u, ''), forms(line).forms]));
  const cell = (label: string, mood: Mood, tense: Tense, index: number): CorpusCell => {
    const found = byLabel.get(label);
    if (!found?.length) fail(name, `no ${label}`);
    return corpusCell({ mood, tense, original: found.join('; '), index, expected: found, heading: `Nominal Forms/${label}` });
  };
  const compounds = lines(compound).map(line => forms(line).forms.join('; '));
  if (compounds.length !== 3 || !/^(?:avere|essere) /u.test(compounds[0]!) || !/^(?:avendo|essendo) /u.test(compounds[1]!) || !/^(?:avente|essente) /u.test(compounds[2]!)) {
    fail(name, 'unexpected compound nominal forms');
  }
  return [
    cell('Infinito', 'infinitive', 'present', 0), cell('Participio presente', 'participle', 'present', 1),
    cell('Gerundio', 'gerund', 'present', 2), cell('Participio passato', 'participle', 'past', 3),
    corpusCell({ mood: 'infinitive', tense: 'past', original: compounds[0]!, index: 4, heading: 'Nominal Forms/compound 1' }),
    corpusCell({ mood: 'gerund', tense: 'past', original: compounds[1]!, index: 5, heading: 'Nominal Forms/compound 2' }),
    corpusCell({
      mood: 'participle', tense: 'past', original: compounds[2]!, index: 6, heading: 'Nominal Forms/compound 3',
      scope: 'unmodelled', reason: 'compound-participle',
    }),
  ];
}

function finite(block: string, heading: string, name: string): CorpusCell[] {
  const mood = moods[heading]!;
  const paragraphs = [...block.matchAll(/<p>(.*?)<\/p>/gsu)].map(match => match[1]!);
  if (paragraphs.length !== tenseCounts[heading]) fail(name, `${heading} has ${paragraphs.length} tenses`);
  return paragraphs.flatMap(paragraph => {
    const label = text(/<b>(.*?)<\/b>/su.exec(paragraph)?.[1] ?? '');
    const tense = tenses[heading]![label];
    if (tense === undefined) fail(name, `unknown ${heading} tense ${label}`);
    const rows = lines(paragraph.replace(/<b>.*?<\/b>/su, ''));
    if (rows.length !== 6) fail(name, `${heading}/${label} has ${rows.length} rows`);
    return rows.map((row, index) => {
      const pronoun = pronounOf(row);
      const subject = subjects[pronoun];
      const { forms: found, notused } = forms(row);
      if (subject === undefined || !found.length) fail(name, `${heading}/${label} row ${index}`);
      return corpusCell({
        mood, tense, original: found.join('; '), index, pronoun, subject, notused,
        expected: found.map(form => `${pronoun} ${form}`), heading: `${heading}/${label}`,
      });
    });
  });
}

function imperative(block: string, name: string): { cells: CorpusCell[]; placeholders: number } {
  const paragraph = /<p class="verbtable">(.*?)<\/p>/su.exec(block)?.[1];
  if (paragraph === undefined) fail(name, 'no imperative');
  const rows = lines(paragraph);
  // Line 0 is the template's placeholder for io: an empty span, or io with an empty notused span.
  if (rows.length !== 6 || forms(rows[0]!).forms.length || !['', 'io'].includes(pronounOf(rows[0]!))) fail(name, 'the imperative does not have its six lines');
  const cells = rows.slice(1).map((row, offset) => {
    const pronoun = pronounOf(row);
    const { forms: found, notused } = forms(row);
    if (subjects[pronoun] === undefined || !found.length) fail(name, `imperative row ${pronoun}`);
    return corpusCell({
      mood: 'imperative', tense: 'present', original: found.join('; '), index: offset + 1, pronoun,
      subject: subjects[pronoun], notused, expected: found, heading: `Imperativo/${pronoun}`,
    });
  });
  return { cells, placeholders: 1 };
}

/** The 96 cells of an Italian page, in page order (design §9.2). */
export function parseItalian(html: string, name: string): ParsedCorpus {
  const start = html.indexOf('#BeginEditable "Full_width_text"');
  const end = html.indexOf('#EndEditable', start);
  if (start < 0 || end < 0) fail(name, 'no content markers');
  const blocks = new Map<string, string>();
  const content = html.slice(start, end);
  const headings = [...content.matchAll(/<h3>(.*?)<\/h3>/gsu)];
  for (const [index, match] of headings.entries()) {
    blocks.set(text(match[1]!), content.slice(match.index! + match[0].length, headings[index + 1]?.index ?? content.length));
  }
  for (const heading of ['Nominal Forms', 'Indicativo', 'Congiuntivo', 'Condizionale', 'Imperativo']) {
    if (!blocks.has(heading)) fail(name, `no ${heading}`);
  }
  const { cells: commands, placeholders } = imperative(blocks.get('Imperativo')!, name);
  const cells = [
    ...nominal(blocks.get('Nominal Forms')!, name),
    ...finite(blocks.get('Indicativo')!, 'Indicativo', name), ...finite(blocks.get('Congiuntivo')!, 'Congiuntivo', name),
    ...finite(blocks.get('Condizionale')!, 'Condizionale', name), ...commands,
  ];
  if (cells.length !== italianCellsPerFile) fail(name, `${cells.length} cells`);
  return { cells, templatePlaceholders: placeholders };
}
