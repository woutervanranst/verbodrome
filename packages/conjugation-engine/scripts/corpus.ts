import { load } from 'cheerio';
import type { Cheerio } from 'cheerio';
import type { AnyNode } from 'domhandler';
import type { Agreement, DutchPronoun, Gender, Language, Mood, Person, ResolvedTarget, Tense } from '../src/types.js';

export const corpusRevision = '3a9a01de3982049f9267326b4a4bd94f468d9439';
export const corpusBasePath = 'code/VerbodromeX.Database.Parsers/SourceFiles';

export interface CorpusCell {
  readonly target: Pick<ResolvedTarget, 'mood' | 'tense' | 'person' | 'number' | 'agreement'>;
  readonly original: string;
  readonly expected: readonly string[];
  readonly sourceUnavailable: boolean;
  readonly construction: string | null;
  readonly availabilityMarker: 'dash' | 'notused' | null;
  readonly pronoun: DutchPronoun | null;
}

export interface ParsedCorpus {
  readonly cells: readonly CorpusCell[];
  readonly templatePlaceholders: number;
}

export interface CorpusFile {
  readonly file: string;
  readonly language: Language;
  readonly infinitive: string;
  readonly gender: Gender | null;
  readonly auxiliary: string | null;
  readonly pattern: 'default' | 'second';
  readonly templatePlaceholders: number;
  readonly cells: readonly CorpusCell[];
}

export interface CorpusCorrection {
  readonly file: string;
  readonly cell: number;
  readonly original: string;
  readonly expected: readonly string[];
  readonly unavailable: boolean;
  readonly reason: string;
  readonly source: string;
  readonly target: CorpusCell['target'];
  readonly correctedTarget: CorpusCell['target'] | null;
}

export interface CorpusStats {
  readonly files: number;
  readonly baseInfinitives: number;
  readonly cells: number;
  readonly targets: number;
  readonly availableCells: number;
  readonly unavailableCells: number;
  readonly expectedForms: number;
  readonly correctionCount: number;
  readonly templatePlaceholders: number;
  readonly checksum: string;
}

export interface CorpusManifest {
  readonly revision: string;
  readonly files: readonly Omit<CorpusFile, 'cells'>[];
  readonly fixtures: Readonly<Record<Language, CorpusStats>>;
  readonly corrections: { readonly count: number; readonly checksum: string };
}

export function summarizeCorpus(files: readonly CorpusFile[], corrections: readonly CorpusCorrection[]): Omit<CorpusStats, 'checksum'> {
  const ledger = new Map(corrections.map(correction => [`${correction.file}:${correction.cell}`, correction]));
  const targets = new Set<string>();
  let cells = 0;
  let unavailableCells = 0;
  let expectedForms = 0;
  let correctionCount = 0;
  for (const file of files) for (const [index, cell] of file.cells.entries()) {
    const correction = ledger.get(`${file.file}:${index}`);
    const target = correction?.correctedTarget ?? cell.target;
    targets.add(JSON.stringify([
      file.file, target.mood, target.tense, target.person, target.number,
      target.agreement?.gender ?? null, target.agreement?.number ?? null,
    ]));
    cells++;
    if (correction) correctionCount++;
    if (correction?.unavailable ?? cell.sourceUnavailable) unavailableCells++;
    else {
      const expected = correction?.expected ?? cell.expected;
      if (!expected.length) throw new Error(`Unaccounted available cell: ${file.file}:${index}.`);
      expectedForms += expected.length;
    }
  }
  return {
    files: files.length, baseInfinitives: new Set(files.map(file => file.infinitive)).size,
    cells, targets: targets.size, availableCells: cells - unavailableCells, unavailableCells,
    expectedForms, correctionCount,
    templatePlaceholders: files.reduce((count, file) => count + file.templatePlaceholders, 0),
  };
}

export function normalizeText(text: string): string {
  return text.normalize('NFC').replace(/[’ʼ]/gu, "'").replace(/\s+/gu, ' ').trim();
}

function lines(node: Cheerio<AnyNode>): string[] {
  const copy = node.clone();
  copy.find('br').replaceWith('\n');
  const result = copy.text().split('\n').map(normalizeText);
  while (result.length && result[result.length - 1] === '') result.pop();
  while (result.length && result[0] === '') result.shift();
  return result;
}

export function alternatives(text: string): string[] {
  if (!text || text === '-') return [];
  const words = text.replace(/;\s+/gu, ';').split(' ');
  if (words.filter(word => /[;/]/u.test(word)).length > 1) {
    throw new Error(`Correlated alternatives need an explicit source interpretation: ${text}`);
  }
  let results = [''];
  for (const word of words) {
    const variants = word.split(/[;/]/u);
    const prefix = variants[0]?.match(/^(.*')/u)?.[1] ?? '';
    const expanded = variants.map((variant, i) => i > 0 && prefix && !variant.includes("'") ? prefix + variant : variant);
    results = results.flatMap(result => expanded.map(variant => normalizeText(`${result} ${variant}`)));
  }
  return [...new Set(results)];
}

interface DutchLine {
  readonly text: string;
  readonly notused: boolean;
  readonly pronoun: DutchPronoun | null;
}

const dutchPronouns: readonly DutchPronoun[] = ['ik', 'jij', 'je', 'u', 'hij', 'zij', 'ze', 'het', 'wij', 'we', 'jullie'];

function dutchLines(node: Cheerio<AnyNode>): DutchLine[] {
  return (node.html() ?? '').split(/<br\s*\/?\s*>/iu).map(html => {
    const $ = load(html);
    const rawPronoun = normalizeText($('font').first().text());
    const pronoun = dutchPronouns.find(value => value === rawPronoun) ?? null;
    return { text: normalizeDutch($.text()), notused: $('.notused').length > 0, pronoun };
  }).filter(line => line.text);
}

const frenchMoods: Readonly<Record<string, Mood>> = {
  Indicatif: 'indicative', Subjonctif: 'subjunctive', Conditionnel: 'conditional',
  Impératif: 'imperative', Participe: 'participle', Infinitif: 'infinitive', Gérondif: 'gerund',
};

function frenchTense(mood: Mood, label: string): Tense {
  const common: Readonly<Record<string, Tense>> = {
    Présent: 'present', Passé: 'past', Imparfait: 'imperfect',
    'Plus-que-parfait': 'pluperfect', 'Passé composé': 'perfect',
    'Passé simple': 'simple_past', 'Passé antérieur': 'past_anterior',
    'Futur simple': 'future', 'Futur antérieur': 'future_perfect',
    'Passé première forme': 'past', 'Passé deuxième forme': 'past',
    'Futur proche': 'near_future', 'Passé récent': 'recent_past',
  };
  const tense = common[label];
  if (!tense) throw new Error(`Unknown French section: ${mood} ${label}.`);
  return tense;
}

function cell(mood: Mood, tense: Tense, original: string, index: number, agreement: Agreement | null = null, construction: string | null = null, notused = false, pronoun: DutchPronoun | null = null): CorpusCell {
  const finite = !['infinitive', 'participle', 'gerund'].includes(mood);
  const person: Person | null = finite ? ((index % 3) === 0 ? 1 : (index % 3) === 1 ? 2 : 3) : null;
  return {
    target: { mood, tense, person, number: finite ? (index < 3 ? 'singular' : 'plural') : null, agreement },
    original, expected: alternatives(original), sourceUnavailable: original === '-' || notused, construction,
    availabilityMarker: notused ? 'notused' : original === '-' ? 'dash' : null,
    pronoun,
  };
}

export function parseFrench(html: string, file: string): ParsedCorpus {
  const $ = load(html);
  const cells: CorpusCell[] = [];
  $('table').each((_, table) => {
    const modeLabel = normalizeText($(table).prevAll('p.mode').first().text());
    const tableMood = frenchMoods[modeLabel];
    let headers: string[] = [];
    $(table).find('tr').filter((_, tr) => $(tr).parents('table').first().get(0) === table).each((_, row) => {
      const columns = $(row).children('td');
      if (columns.find('u').length) {
        headers = columns.toArray().map(td => normalizeText($(td).find('u').first().text()));
        return;
      }
      columns.each((column, td) => {
        const label = headers[column];
        if (!label) return;
        const mood = label === 'Futur proche' || label === 'Passé récent' ? 'indicative' : tableMood;
        if (!mood) return;
        const tense = frenchTense(mood, label);
        const values = lines($(td));
        const count = ['indicative', 'subjunctive', 'conditional'].includes(mood) ? 6
          : mood === 'imperative' ? 3 : mood === 'participle' && tense === 'past' ? 5 : 1;
        if (values.length !== count) throw new Error(`${file}: ${mood}/${label}: expected ${count} rows, found ${values.length}.`);
        values.forEach((value, index) => {
          if (mood === 'imperative') {
            cells.push(cell(mood, tense, value, [1, 3, 4][index] ?? -1));
          } else if (mood === 'participle' && tense === 'past') {
            if (index === 4) cells.push(cell(mood, 'perfect', value, 0));
            else cells.push(cell(mood, tense, value, 0, {
              gender: index % 2 === 0 ? 'masculine' : 'feminine',
              number: index < 2 ? 'singular' : 'plural',
            }));
          } else {
            cells.push(cell(mood, tense, value, index, null, label === 'Passé deuxième forme' ? 'second' : null));
          }
        });
      });
    });
  });
  if (cells.length !== 118) throw new Error(`${file}: expected 118 French cells; found ${cells.length}.`);
  return { cells, templatePlaceholders: 0 };
}

const dutchSections: readonly (readonly [string, Mood, Tense])[] = [
  ['Onvoltooid tegenwoordige tijd', 'indicative', 'present'],
  ['Voltooid tegenwoordige tijd', 'indicative', 'perfect'],
  ['Onvoltooid verleden tijd', 'indicative', 'past'],
  ['Voltooid verleden tijd', 'indicative', 'pluperfect'],
  ['Onvoltooid tegenwoordige toekomende tijd', 'indicative', 'future'],
  ['Voltooid tegenwoordige toekomende tijd', 'indicative', 'future_perfect'],
  ['Onvoltooid verleden toekomende tijd', 'conditional', 'present'],
  ['Voltooid verleden toekomende tijd', 'conditional', 'past'],
];

function normalizeDutch(text: string): string {
  return normalizeText(text.normalize('NFD').replace(/[\u0301\u0304]/gu, '').normalize('NFC'));
}

export function parseDutch(html: string, file: string): ParsedCorpus {
  const $ = load(html);
  const cells: CorpusCell[] = [];
  const sections = new Set<string>();
  $('p').each((_, p) => {
    const values = dutchLines($(p));
    const heading = values[0]?.text ?? '';
    for (const [label, mood, tense] of dutchSections) {
      if (!heading.includes(label)) continue;
      if (sections.has(label)) throw new Error(`${file}: repeated ${label}.`);
      sections.add(label);
      const rows = values.slice(1);
      if (rows.length !== 6 && rows.length !== 0) throw new Error(`${file}: ${label}: expected 6 rows, found ${rows.length}.`);
      for (let index = 0; index < 6; index++) {
        const row = rows[index];
        cells.push(cell(mood, tense, row?.text || '-', index, null, null, row?.notused, row?.pronoun));
      }
    }
    for (const line of values) {
      const value = line.text;
      if (value.includes('Onbepaalde wijs:')) {
        cells.push(cell('infinitive', 'present', value.split('Onbepaalde wijs:')[1]?.trim() || '-', 0, null, null, line.notused));
      }
      if (value.includes('Tegenwoordig deelwoord:')) {
        cells.push(cell('participle', 'present', value.split('Tegenwoordig deelwoord:')[1]?.trim() || '-', 0, null, null, line.notused));
      }
      if (value.includes('Verleden deelwoord:')) {
        cells.push(cell('participle', 'past', value.split('Verleden deelwoord:')[1]?.trim() || '-', 0, null, null, line.notused));
      }
    }
  });
  const imperative = $('th').filter((_, th) => $(th).text().includes('Gebiedende wijs'));
  const commandNode = imperative.closest('tr').next('tr').find('p').first();
  const templateSlots = commandNode.find('br').length;
  if (templateSlots !== 0 && templateSlots !== 6) throw new Error(`${file}: expected zero or six imperative template slots.`);
  const commandRows = dutchLines(commandNode);
  if (commandRows.length > 1) throw new Error(`${file}: unaccounted imperative template content.`);
  const command = commandRows[0];
  cells.push(cell('imperative', 'present', command?.text.replace(/^(jij|je)\s+/u, '') || '-', 1, null, null, command?.notused));
  if (cells.length !== 52 || sections.size !== 8) {
    throw new Error(`${file}: expected 52 Dutch cells in 8 finite sections; found ${cells.length} / ${sections.size}.`);
  }
  return { cells, templatePlaceholders: templateSlots ? templateSlots - 1 : 0 };
}
