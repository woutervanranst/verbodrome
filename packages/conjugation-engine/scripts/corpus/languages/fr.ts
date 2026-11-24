import { frenchCorrection } from '../corrections/fr.ts';
import { frenchCellsPerFile, parseFrench } from '../parsers/fr.ts';
import { normalizeText } from '../model.ts';
import type { CorpusLanguage } from '../model.ts';

export const french: CorpusLanguage = {
  language: 'fr',
  directory: 'Français',
  encoding: 'windows-1252',
  expectedFiles: 222,
  cellsPerFile: frenchCellsPerFile,
  parse: parseFrench,
  context: name => ({
    infinitive: normalizeText(name.slice(0, -5).split('_')[0] ?? ''),
    gender: name.includes('feminin') ? 'feminine' : 'masculine',
    auxiliary: name.includes('auxiliaire-avoir') ? 'avoir' : name.includes('auxiliaire-etre') ? 'être' : null,
    pattern: name.includes('deuxieme-forme') ? 'second' : 'default',
  }),
  correction: frenchCorrection,
  query: file => [
    {
      language: 'fr', infinitive: file.infinitive,
      ...(file.gender ? { gender: file.gender } : {}),
      ...(file.auxiliary ? { auxiliary: file.auxiliary } : {}),
    },
    // A gendered query restricts participle agreement; the fixture lists every gender and number.
    { language: 'fr', infinitive: file.infinitive, mood: 'participle', tense: 'past' },
  ],
  applicable: (file, cell, forms) => {
    // The figurative pleuvoir table is its own pattern: it answers only the figurative variants, the default table all others.
    if (file.infinitive !== 'pleuvoir' || cell.target.person === null) return forms;
    return forms.filter(form => (file.pattern === 'second') === (form.variant.condition === 'figurative'));
  },
};
