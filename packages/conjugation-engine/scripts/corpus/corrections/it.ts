/**
 * The Italian corrections ledger (grammar design §9.4). Each rule names the cells it corrects, the reason and the page
 * that states the correct form; every page was read for this pack (Treccani Vocabolario headers and the La grammatica
 * italiana / Enciclopedia dell'Italiano entries cited).
 */
import { startCorrection } from '../model.ts';
import type { CorpusCell, CorpusCorrection, CorpusFile } from '../model.ts';

const vocabolario = (page: string): string => `https://www.treccani.it/vocabolario/${page}/`;
const accento = "https://www.treccani.it/enciclopedia/accento-grafico_(Enciclopedia-dell'Italiano)/";
const compoundTenses: ReadonlySet<string> = new Set([
  'indicative.perfect', 'indicative.pluperfect', 'indicative.future_perfect', 'indicative.past_anterior', 'subjunctive.past',
  'subjunctive.pluperfect', 'conditional.past', 'infinitive.past', 'gerund.past',
]);

/** Each form of avere the page uses for essere's compound tenses, and the form of essere that belongs there. */
const essereFor: Readonly<Record<string, string>> = {
  ho: 'sono', hai: 'sei', ha: 'è', abbiamo: 'siamo', avete: 'siete', hanno: 'sono',
  avevo: 'ero', avevi: 'eri', aveva: 'era', avevamo: 'eravamo', avevate: 'eravate', avevano: 'erano',
  avrò: 'sarò', avrai: 'sarai', avrà: 'sarà', avremo: 'saremo', avrete: 'sarete', avranno: 'saranno',
  ebbi: 'fui', avesti: 'fosti', ebbe: 'fu', avemmo: 'fummo', aveste: 'foste', ebbero: 'furono',
  abbia: 'sia', abbiate: 'siate', abbiano: 'siano',
  avessi: 'fossi', avesse: 'fosse', avessimo: 'fossimo', avessero: 'fossero',
  avrei: 'sarei', avresti: 'saresti', avrebbe: 'sarebbe', avremmo: 'saremmo', avreste: 'sareste', avrebbero: 'sarebbero',
  avere: 'essere', avendo: 'essendo',
};

const key = (cell: CorpusCell): string => `${cell.target.mood}.${cell.target.tense}`;
const is = (cell: CorpusCell, target: string, subject?: string): boolean => key(cell) === target && (subject === undefined || cell.subject === subject);

export function italianCorrection(file: CorpusFile, cell: CorpusCell, index: number): CorpusCorrection | null {
  const draft = startCorrection(file, cell, index);
  const verb = file.infinitive;
  if (verb === 'essere' && compoundTenses.has(key(cell))) {
    const plural = cell.target.number === 'plural';
    draft.change(
      `The compound tenses of essere take essere, and the participle agrees with the subject (sono stato, siamo stati); the page builds them with avere (${cell.original}).`,
      vocabolario('essere1'),
      form => form.split(' ').map(word => essereFor[word] ?? (word === 'stato' && plural ? 'stati' : word)).join(' '),
    );
  }
  if (verb === 'dare' && is(cell, 'indicative.present', '3pl')) {
    draft.change('The accent is written only on words stressed on the last vowel and on monosyllables that need it: danno, not dànno (the Vocabolario prints dànno only as a pronunciation aid).', accento, form => form.replace('dànno', 'danno'));
  }
  if (verb === 'dare' && is(cell, 'indicative.simple_past', '3sg.m')) {
    draft.expected = draft.expected.filter(form => form !== 'lui dètte');
    draft.note('dètte is dette with a pronunciation accent, which standard spelling does not write on a word not stressed on its last vowel.', accento);
  }
  if (verb === 'volere' && is(cell, 'indicative.present', '1sg')) {
    draft.expected = draft.expected.filter(form => form !== 'io vò');
    draft.note("The Vocabolario gives only vòglio for io, with a Tuscan proclitic vo' in brackets; vò is not a standard form.", vocabolario('volere2'));
  }
  if (verb === 'volere' && is(cell, 'indicative.simple_past') && ['1sg', '3sg.m', '3pl'].includes(cell.subject ?? '')) {
    draft.expected = draft.expected.filter(form => !/ vols/u.test(form));
    draft.note('The Vocabolario prints the passato remoto volli, volle, vollero and marks volsi, volse, volsero as old ([ant. vòlsi]).', vocabolario('volere2'));
  }
  if (verb === 'sapere' && is(cell, 'imperative.present', '2pl')) {
    draft.change('The imperative of sapere is sappi, sappiate (Vocabolario: "imperat. sappi, sappiate"), not sapete.', vocabolario('sapere2'), form => form.replace('sapete', 'sappiate'));
  }
  if (verb === 'sapere' && is(cell, 'participle.present')) {
    draft.markUnavailable('sapere has no present participle: "Il part. pres. manca (sapiènte ha solo funzione di agg. o di sost.)".', vocabolario('sapere2'));
  }
  if (verb === 'potere' && is(cell, 'participle.present')) {
    draft.markUnavailable('The Vocabolario gives potente only as an adjective and noun ("part. pres. potènte, solo come agg. e sost."), not as a form of potere.', vocabolario('potere2'));
  }
  if (verb === 'dovere' && cell.target.mood === 'imperative') {
    draft.markUnavailable('dovere has no imperative: the Vocabolario says "manca l\'imperativo"; the page fills the row from the subjunctive and the present.', vocabolario('dovere2'));
  }
  if (verb === 'dovere' && is(cell, 'subjunctive.present') && ['1sg', '2sg', '3sg.m', '3pl'].includes(cell.subject ?? '')) {
    const deva = (form: string): string => form.replace('debba', 'deva').replace('debbano', 'devano');
    draft.expected = [...new Set([...draft.expected.map(deva), ...draft.expected])];
    draft.note('The Vocabolario prints both present subjunctives, "dèva o dèbba ..., dèvano o dèbbano"; the page gives only debba, debbano.', vocabolario('dovere2'));
  }
  if (verb === 'tradurre' && is(cell, 'participle.present')) {
    draft.change('The forms of tradurre other than the infinitive are built on the stem traduc-: "Part. pres. traducènte".', vocabolario('tradurre'), () => 'traducente');
  }
  if (verb === 'tradurre' && is(cell, 'gerund.present')) {
    draft.change('The forms of tradurre other than the infinitive are built on the stem traduc- (io traduco, tradussi): the gerund is traducendo.', vocabolario('tradurre'), () => 'traducendo');
  }
  if (verb === 'venire' && is(cell, 'participle.present')) {
    draft.change('The present participle of venire is veniente (Vocabolario: "part. pres. veniènte").', vocabolario('venire'), () => 'veniente');
  }
  if (verb === 'fare' && is(cell, 'participle.present')) {
    draft.expected = [...draft.expected, 'faciente'];
    draft.note('The Vocabolario prints "Part. pres. faciente o più com. facente"; the page gives only facente.', vocabolario('fare2'));
  }
  if (verb === 'fare' && is(cell, 'indicative.present', '1sg')) {
    draft.expected = [...draft.expected, 'io fo'];
    draft.note('The Vocabolario prints "pres. fo o fàccio" with no label; the page gives only faccio.', vocabolario('fare2'));
  }
  return draft.finish();
}
