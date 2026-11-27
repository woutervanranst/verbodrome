/**
 * The Italian corpus (grammar design §9): 20 one-verb pages, 96 cells each, under `Italiano`. Three labelled queries
 * answer every cell: the default subjects, and the imperative of the courtesy subjects Lei and Loro (not default slots),
 * which the page prints in its rows lui and loro.
 */
import { italianCorrection } from '../corrections/it.ts';
import { italianCellsPerFile, parseItalian } from '../parsers/it.ts';
import { infinitiveFromFileName } from '../model.ts';
import type { CorpusLanguage } from '../model.ts';

const congiuntivo = 'https://www.treccani.it/enciclopedia/congiuntivo_(La-grammatica-italiana)/';
const imperativo = 'https://www.treccani.it/enciclopedia/imperativo_(La-grammatica-italiana)/';
const formal = (subject: string): boolean => subject === '3sg.formal' || subject === '3pl.formal';

export const italian: CorpusLanguage = {
  language: 'it',
  directory: 'Italiano',
  encoding: 'utf-8',
  expectedFiles: 20,
  cellsPerFile: italianCellsPerFile,
  parse: parseItalian,
  context: name => ({ infinitive: infinitiveFromFileName(name), gender: null, auxiliary: null, pattern: 'default' }),
  correction: italianCorrection,
  remaps: [
    {
      heading: 'Congiuntivo/Passato prossimo', occurrence: 0, target: { mood: 'subjunctive', tense: 'past' },
      reason: 'The congiuntivo has four tenses, presente, imperfetto, passato and trapassato; "passato prossimo" is a tense of the indicative, and the column holds io sia andato, the congiuntivo passato.',
      source: congiuntivo,
    },
    {
      heading: 'Imperativo/lui', occurrence: 0, target: { mood: 'imperative', tense: 'present', person: 3, number: 'singular', subject: '3sg.formal' },
      reason: 'The third-person imperative is the courtesy form addressed to Lei, taken from the present subjunctive, not an order to a third party.',
      source: imperativo,
    },
    {
      heading: 'Imperativo/loro', occurrence: 0, target: { mood: 'imperative', tense: 'present', person: 3, number: 'plural', subject: '3pl.formal' },
      reason: 'The third-person plural imperative is the courtesy form addressed to Loro, taken from the present subjunctive.',
      source: imperativo,
    },
  ],
  unmodelled: { 'compound-participle': 'Italian has no compound participle; the source pairs avente/essente with the past participle mechanically.' },
  requireTaggedExtras: true,
  query: file => [
    { label: 'default', options: { language: 'it', infinitive: file.infinitive } },
    { label: 'formal-sg', options: { language: 'it', infinitive: file.infinitive, mood: 'imperative', subject: '3sg.formal' } },
    { label: 'formal-pl', options: { language: 'it', infinitive: file.infinitive, mood: 'imperative', subject: '3pl.formal' } },
  ],
  /** A courtesy cell takes the forms of its own query, every other cell those of the default query. */
  applicable: (_file, cell, forms, label) => (label === 'default') === !formal(cell.subject ?? '') ? forms : [],
};
