import { germanCorrection } from '../corrections/de.ts';
import { germanCellsPerFile, parseGerman } from '../parsers/de.ts';
import { infinitiveFromFileName } from '../model.ts';
import type { CorpusLanguage } from '../model.ts';

const formenbestand = 'https://grammis.ids-mannheim.de/systematische-grammatik/439';
const wuerdeFormen = 'https://grammis.ids-mannheim.de/systematische-grammatik/312';

export const german: CorpusLanguage = {
  language: 'de',
  directory: 'Deutsch',
  encoding: 'utf-8',
  expectedFiles: 139,
  cellsPerFile: germanCellsPerFile,
  parse: parseGerman,
  context: name => ({ infinitive: infinitiveFromFileName(name), gender: null, auxiliary: null, pattern: 'default' }),
  correction: germanCorrection,
  remaps: [
    {
      heading: 'Konjunktiv II/Präsens', occurrence: 0, target: { mood: 'subjunctive', tense: 'past' },
      reason: 'The simple Konjunktiv II (gäbe, führe) is built on the Präteritum stem: grammis calls it Konjunktiv Präteritum, the catalogue subjunctive past.',
      source: formenbestand,
    },
    {
      heading: 'Konjunktiv II/Futur I', occurrence: 0, target: { mood: 'conditional', tense: 'present' },
      reason: 'würde + Infinitiv (ich würde backen) is the würde-form of Konjunktiv II, which the catalogue lists as the conditional present.',
      source: wuerdeFormen,
    },
    {
      heading: 'Konjunktiv I/Präteritum', occurrence: 0, target: { mood: 'subjunctive', tense: 'perfect' },
      reason: 'habe gebacken is the Konjunktiv I of the Perfekt (haben/sein in Konjunktiv I + Partizip II), not a Präteritum: the catalogue subjunctive perfect.',
      source: formenbestand,
    },
    {
      heading: 'Konjunktiv II/Präteritum', occurrence: 0, target: { mood: 'subjunctive', tense: 'pluperfect' },
      reason: 'hätte gebacken is the Konjunktiv II of the Plusquamperfekt (haben/sein in Konjunktiv II + Partizip II): the catalogue subjunctive pluperfect.',
      source: formenbestand,
    },
    {
      heading: 'Konjunktiv II/Futur II', occurrence: 0, target: { mood: 'conditional', tense: 'past' },
      reason: 'würde + Infinitiv Perfekt (ich würde gebacken haben) is the past würde-form of Konjunktiv II: the catalogue conditional past.',
      source: wuerdeFormen,
    },
  ],
  unmodelled: {},
  /**
   * Two queries: every cell but the Sie-imperative is answered by the default query (whose subjects are the six default
   * slots); the Sie-imperative by the query that names the formal slot.
   */
  query: file => [
    { label: 'default', options: { language: 'de', infinitive: file.infinitive } },
    { label: 'formal', options: { language: 'de', infinitive: file.infinitive, mood: 'imperative', subject: '2.formal' } },
  ],
  applicable: (_file, cell, forms, label) => (label === 'formal') === (cell.subject === '2.formal') ? forms : [],
};
