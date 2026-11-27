/**
 * The Latin corpus (grammar design §9): 18 one-verb pages, 185 cells each, under `Latina`, masculine pages only. One
 * labelled query answers every cell: the masculine subjects and full declension (`agreement: {}`), since the pages
 * print the participles, gerundive, gerund and supine in every case.
 */
import { latinCorrection } from '../corrections/la.ts';
import { LATIN_FILES, latinCellsPerFile, parseLatin } from '../parsers/la.ts';
import type { CorpusLanguage } from '../model.ts';

export { LATIN_FILES };

export const latin: CorpusLanguage = {
  language: 'la',
  directory: 'Latina',
  encoding: 'windows-1252',
  expectedFiles: 18,
  cellsPerFile: latinCellsPerFile,
  parse: (html, name) => parseLatin(html, name),
  context: name => ({ infinitive: LATIN_FILES[name] ?? name, gender: 'masculine', auxiliary: null, pattern: 'default' }),
  correction: latinCorrection,
  remaps: [],
  unmodelled: {
    'gerund-nominative': 'The gerund has no nominative; the infinitive serves (A&G §159.a). The row repeats the present infinitive, which the Infinitive present cell already checks.',
  },
  requireTaggedExtras: true,
  query: file => [{ label: 'masculine', options: { language: 'la', infinitive: file.infinitive, gender: 'masculine', agreement: {} } }],
  applicable: (_file, _cell, forms) => forms,
};
