import { englishCorrection } from '../corrections/en.ts';
import { englishCellsPerFile, parseEnglish } from '../parsers/en.ts';
import { infinitiveFromFileName } from '../model.ts';
import type { CorpusLanguage } from '../model.ts';

const cgel = 'https://doi.org/10.1017/9781316423530';

export const english: CorpusLanguage = {
  language: 'en',
  directory: 'English',
  encoding: 'utf-8',
  expectedFiles: 145,
  cellsPerFile: englishCellsPerFile,
  requireTaggedExtras: true,
  parse: parseEnglish,
  context: name => ({ infinitive: infinitiveFromFileName(name), gender: null, auxiliary: null, pattern: 'default' }),
  correction: englishCorrection,
  remaps: [
    {
      heading: 'Subjunctive › Present #2', occurrence: 'all', target: { mood: 'subjunctive', tense: 'perfect' },
      reason: 'The second "Present" block of the subjunctive holds have + past participle for every person (have arisen): the perfect subjunctive.',
      source: cgel,
    },
    {
      heading: 'Subjunctive › Imperfect', occurrence: 'all', target: { mood: 'subjunctive', tense: 'past' },
      reason: 'English has no imperfect: this block is the past (irrealis) subjunctive, with were for every person of be.',
      source: 'https://www.ahdictionary.com/word/search.html?q=were',
    },
    {
      heading: 'Nominal Forms › Gerund', occurrence: 'all', target: { mood: 'participle', tense: 'present' },
      reason: 'The "gerund" is the -ing form (the gerund-participle), which the catalogue lists as the participle present.',
      source: 'https://assets.publishing.service.gov.uk/media/5a7ccc06ed915d63cc65ce61/English_Appendix_1_-_Spelling.pdf',
    },
  ],
  unmodelled: {},
  query: file => [{ label: 'default', options: { language: 'en', infinitive: file.infinitive } }],
  /**
   * A cell whose page tags an alternate with a region (`gotten (U)`) is compared region by region: its expected texts
   * carry ` (US)` / ` (GB)`, and so does every engine form labelled with a region. Other cells compare plain text.
   */
  applicable: (_file, cell, forms) => /\((?:U|E)\)/u.test(cell.original)
    ? forms.map(form => form.variant.region ? { ...form, text: `${form.text} (${form.variant.region})` } : form)
    : forms,
};
