import { dutchCorrection } from '../corrections/nl.ts';
import { dutchCellsPerFile, parseDutch } from '../parsers/nl.ts';
import { infinitiveFromFileName } from '../model.ts';
import type { CorpusLanguage } from '../model.ts';

export const dutch: CorpusLanguage = {
  language: 'nl',
  directory: 'Nederlands',
  encoding: 'utf-8',
  expectedFiles: 207,
  cellsPerFile: dutchCellsPerFile,
  parse: parseDutch,
  context: name => ({
    infinitive: infinitiveFromFileName(name),
    gender: null,
    auxiliary: null,
    pattern: 'default',
  }),
  correction: dutchCorrection,
  query: file => [
    { label: 'default', options: { language: 'nl', infinitive: file.infinitive } },
    // Cells labelled `het` belong to a query with that subject pronoun.
    ...file.cells.some(cell => cell.pronoun === 'het')
      ? [{ label: 'het', options: { language: 'nl', infinitive: file.infinitive, pronoun: 'het' } }] : [],
  ],
  applicable: (_file, cell, forms, label) => {
    if (cell.pronoun !== 'het') return label === 'default' ? forms : [];
    return label === 'het' ? forms.filter(form => form.parts.some(part => part.role === 'subject' && part.text === 'het')) : [];
  },
};
