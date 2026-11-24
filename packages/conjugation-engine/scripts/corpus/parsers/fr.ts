import { load } from 'cheerio';
import type { Cheerio } from 'cheerio';
import type { AnyNode } from 'domhandler';
import type { Mood, Tense } from '../../../src/types.js';
import { corpusCell, normalizeText } from '../model.ts';
import type { CorpusCell, ParsedCorpus } from '../model.ts';

export const frenchCellsPerFile = 118;

function lines(node: Cheerio<AnyNode>): string[] {
  const copy = node.clone();
  copy.find('br').replaceWith('\n');
  const result = copy.text().split('\n').map(normalizeText);
  while (result.length && result[result.length - 1] === '') result.pop();
  while (result.length && result[0] === '') result.shift();
  return result;
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
            cells.push(corpusCell(mood, tense, value, [1, 3, 4][index] ?? -1));
          } else if (mood === 'participle' && tense === 'past') {
            if (index === 4) cells.push(corpusCell(mood, 'perfect', value, 0));
            else cells.push(corpusCell(mood, tense, value, 0, {
              gender: index % 2 === 0 ? 'masculine' : 'feminine',
              number: index < 2 ? 'singular' : 'plural',
            }));
          } else {
            cells.push(corpusCell(mood, tense, value, index, null, label === 'Passé deuxième forme' ? 'second' : null));
          }
        });
      });
    });
  });
  if (cells.length !== frenchCellsPerFile) throw new Error(`${file}: expected ${frenchCellsPerFile} French cells; found ${cells.length}.`);
  return { cells, templatePlaceholders: 0 };
}
