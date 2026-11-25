import { frenchCorrection } from '../corrections/fr.ts';
import { frenchCellsPerFile, parseFrench } from '../parsers/fr.ts';
import { infinitiveFromFileName } from '../model.ts';
import type { CorpusLanguage } from '../model.ts';

export const french: CorpusLanguage = {
  language: 'fr',
  directory: 'Français',
  encoding: 'windows-1252',
  expectedFiles: 222,
  cellsPerFile: frenchCellsPerFile,
  fixturesWithoutSubjects: true,
  parse: parseFrench,
  context: name => ({
    infinitive: infinitiveFromFileName(name),
    gender: name.includes('feminin') ? 'feminine' : 'masculine',
    auxiliary: name.includes('auxiliaire-avoir') ? 'avoir' : name.includes('auxiliaire-etre') ? 'être' : null,
    pattern: name.includes('deuxieme-forme') ? 'second' : 'default',
  }),
  correction: frenchCorrection,
  query: file => {
    const base = {
      language: 'fr', infinitive: file.infinitive,
      ...(file.gender ? { gender: file.gender } : {}),
      ...(file.auxiliary ? { auxiliary: file.auxiliary } : {}),
    };
    return [
      { label: 'default', options: base },
      // A gendered query restricts participle agreement; the fixture lists every gender and number.
      { label: 'participle', options: { language: 'fr', infinitive: file.infinitive, mood: 'participle', tense: 'past' } },
      // The figurative pleuvoir table is its own page; it is answered by the figurative variants of the default query.
      ...file.infinitive === 'pleuvoir' && file.pattern === 'second' ? [{ label: 'figurative', options: base }] : [],
    ];
  },
  applicable: (file, cell, forms, label) => {
    // Agreeing past participles (every gender and number) come from the ungendered query alone.
    if (cell.target.mood === 'participle' && cell.target.agreement) return label === 'participle' ? forms : [];
    if (label === 'participle') return [];
    // The figurative pleuvoir table answers only the figurative variants of the finite cells, the default table all others.
    if (file.infinitive !== 'pleuvoir' || cell.target.person === null) return forms;
    if (label === 'figurative') return forms.filter(form => form.variant.condition === 'figurative');
    return file.pattern === 'second' ? [] : forms.filter(form => form.variant.condition !== 'figurative');
  },
};
