/**
 * The Spanish corpus (grammar design §9): 89 one-verb pages, 124 cells each, under `Español`. The unfiltered query
 * answers every cell but the commands of usted and ustedes, which formal address gives only on request: two imperative
 * queries name those slots (as the German corpus asks for Sie). A cell of a variant column (-ra / -se, the second
 * participle) is answered by the forms of that pattern only.
 */
import { spanishCorrection } from '../corrections/es.ts';
import { spanishCellsPerFile, parseSpanish } from '../parsers/es.ts';
import { infinitiveFromFileName } from '../model.ts';
import type { CorpusLanguage } from '../model.ts';

const tenseNames = 'https://www.rae.es/gram%C3%A1tica/morfolog%C3%ADa/';
const notRead = 'The NGLE page was not read (rae.es refuses automated reading); the tense names are those of the grammar design §2.1.';

export const spanish: CorpusLanguage = {
  language: 'es',
  directory: 'Español',
  encoding: 'iso-8859-15',
  expectedFiles: 89,
  cellsPerFile: spanishCellsPerFile,
  parse: parseSpanish,
  context: name => ({ infinitive: infinitiveFromFileName(name), gender: null, auxiliary: null, pattern: 'default' }),
  correction: spanishCorrection,
  remaps: [
    {
      heading: 'Indicative/Past perfect', occurrence: 0, target: { mood: 'indicative', tense: 'past_anterior' },
      reason: `The column holds hube amado, the pretérito anterior; "past perfect" would name the pluperfect, which the page lists separately. ${notRead}`,
      source: tenseNames,
    },
    {
      heading: 'Indicative/Past future', occurrence: 0, target: { mood: 'indicative', tense: 'future_perfect' },
      reason: `The column holds habré amado, the futuro compuesto (future perfect), not a future in the past. ${notRead}`,
      source: tenseNames,
    },
    {
      heading: 'Subjunctive/Past', occurrence: 0, target: { mood: 'subjunctive', tense: 'past' },
      reason: `The column holds haya amado, the pretérito perfecto compuesto of the subjunctive, whereas "past subjunctive" usually means amara. ${notRead}`,
      source: tenseNames,
    },
    {
      heading: 'Subjunctive/Past future', occurrence: 0, target: { mood: 'subjunctive', tense: 'future_perfect' },
      reason: `The column holds hubiere amado, the futuro compuesto of the subjunctive (future perfect). ${notRead}`,
      source: tenseNames,
    },
    {
      heading: 'Gerundive/Present', occurrence: 0, target: { mood: 'gerund', tense: 'present' },
      reason: `The column holds amando, the gerundio; a gerundive is a Latin verbal adjective, which Spanish does not have. ${notRead}`,
      source: tenseNames,
    },
    {
      heading: 'Gerundive/Past', occurrence: 0, target: { mood: 'gerund', tense: 'past' },
      reason: `The column holds habiendo amado, the gerundio compuesto (perfect gerund). ${notRead}`,
      source: tenseNames,
    },
  ],
  unmodelled: {},
  requireTaggedExtras: true,
  query: file => [
    { label: 'default', options: { language: 'es', infinitive: file.infinitive } },
    { label: 'usted', options: { language: 'es', infinitive: file.infinitive, mood: 'imperative', subject: '2sg.formal' } },
    { label: 'ustedes', options: { language: 'es', infinitive: file.infinitive, mood: 'imperative', subject: '2pl.formal' } },
  ],
  /**
   * A command of usted or ustedes is answered by the query that names its slot, every other cell by the default query; a
   * variant column (ra, se, irregular) takes the forms of its pattern, every other cell all the forms of its target.
   */
  applicable: (_file, cell, forms, label) => {
    const own = cell.subject === '2sg.formal' ? 'usted' : cell.subject === '2pl.formal' ? 'ustedes' : 'default';
    if (label !== own) return [];
    const pattern = cell.variant?.pattern;
    return pattern === undefined ? forms : forms.filter(form => (form.variant.pattern ?? '').split('.').includes(pattern));
  },
};
