import { load } from 'cheerio';
import type { Cheerio } from 'cheerio';
import type { AnyNode } from 'domhandler';
import type { DutchPronoun, Mood, Tense } from '../../../src/types.js';
import { corpusCell, normalizeText } from '../model.ts';
import type { ParsedCorpus, CorpusCell } from '../model.ts';

export const dutchCellsPerFile = 52;

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
        cells.push(corpusCell({ mood, tense, original: row?.text || '-', index, notused: row?.notused, pronoun: row?.pronoun }));
      }
    }
    for (const line of values) {
      const value = line.text;
      if (value.includes('Onbepaalde wijs:')) {
        cells.push(corpusCell({ mood: 'infinitive', tense: 'present', original: value.split('Onbepaalde wijs:')[1]?.trim() || '-', index: 0, notused: line.notused }));
      }
      if (value.includes('Tegenwoordig deelwoord:')) {
        cells.push(corpusCell({ mood: 'participle', tense: 'present', original: value.split('Tegenwoordig deelwoord:')[1]?.trim() || '-', index: 0, notused: line.notused }));
      }
      if (value.includes('Verleden deelwoord:')) {
        cells.push(corpusCell({ mood: 'participle', tense: 'past', original: value.split('Verleden deelwoord:')[1]?.trim() || '-', index: 0, notused: line.notused }));
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
  cells.push(corpusCell({ mood: 'imperative', tense: 'present', original: command?.text.replace(/^(jij|je)\s+/u, '') || '-', index: 1, notused: command?.notused }));
  if (cells.length !== dutchCellsPerFile || sections.size !== 8) {
    throw new Error(`${file}: expected ${dutchCellsPerFile} Dutch cells in 8 finite sections; found ${cells.length} / ${sections.size}.`);
  }
  return { cells, templatePlaceholders: templateSlots ? templateSlots - 1 : 0 };
}
