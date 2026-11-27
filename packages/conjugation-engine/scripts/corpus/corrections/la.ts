/**
 * The Latin corrections ledgers (grammar design §9.5), applied to one draft per cell: first the form ledger (forms or
 * availability the source gets wrong; with it alone the macron-insensitive comparison passes), then the macron ledger
 * (vowel length only: every entry keeps the macron-insensitive key of each form). Each reason names the rule and each
 * source is the authority page read for it.
 */
import { startCorrection } from '../model.ts';
import type { CorpusCell, CorpusCorrection, CorpusFile, CorrectionDraft } from '../model.ts';

const scan = (page: number): string => `https://dcc.dickinson.edu/sites/default/files/AG${String(page + 12).padStart(3, '0')}.jpg`;
const ag = (slug: string): string => `https://dcc.dickinson.edu/grammar/latin/${slug}`;
const bennett = (section: number): string => `https://www.gutenberg.org/files/15665/15665-h/15665-h.htm#sect${section}`;

const deponents: ReadonlySet<string> = new Set(['hortārī', 'largīrī', 'patī', 'sequī', 'verērī']);
const at = (cell: CorpusCell, mood: string, tense: string, voice?: string): boolean =>
  cell.target.mood === mood && cell.target.tense === tense && (voice === undefined || cell.voice === voice);
const slot = (cell: CorpusCell): string => `${cell.target.person}${cell.target.number === 'singular' ? 's' : 'p'}`;
const compoundPerfect = (cell: CorpusCell): boolean =>
  ['indicative.perfect', 'indicative.pluperfect', 'indicative.future_perfect', 'subjunctive.perfect', 'subjunctive.pluperfect']
    .includes(`${cell.target.mood}.${cell.target.tense}`);

/** The form ledger: what the source gets wrong beyond vowel length (107 cells). */
export function latinFormCorrection(file: CorpusFile, cell: CorpusCell, _index: number, draft: CorrectionDraft): void {
  if (cell.scope === 'unmodelled') return;
  const verb = file.infinitive;
  if (deponents.has(verb) && at(cell, 'imperative', 'future', 'active') && cell.expected.some(form => !form.endsWith('r'))) {
    draft.note(
      `A deponent has only the passive-form future imperative (hortātor, hortantor; A&G p. 104, Bennett §113); the active-form ${cell.expected.filter(form => !form.endsWith('r')).join(', ')} beside it is not a form of a deponent.`,
      scan(104),
    );
    draft.expected = draft.expected.filter(form => form.endsWith('r'));
  }
  if (verb === 'esse' && at(cell, 'subjunctive', 'present') && cell.expected.length > 1) {
    draft.note('fuam, fuās, fuat, fuant are old forms of the present subjunctive (A&G §170 Note); the classical forms are sim, sīs, sit, sint.', ag('sum'));
    draft.expected = draft.expected.filter(form => !form.startsWith('fu'));
  }
  if (verb === 'posse' && (at(cell, 'participle', 'gerundive') || at(cell, 'gerund', 'present'))) {
    draft.markUnavailable('possum has no gerund or gerundive: A&G p. 109 and Bennett §126 print none (its only participle is the adjective potēns).', scan(109));
  }
  if (verb === 'mālle' && at(cell, 'participle', 'present')) {
    draft.markUnavailable('mālō has no present participle: A&G p. 110 prints volēns and nōlēns but none for mālō (Bennett §130 likewise).', scan(110));
  }
  if (verb === 'fierī') {
    if (at(cell, 'infinitive', 'future', 'active')) {
      draft.expected = ['factum īrī'];
      draft.correctedTarget = { ...cell.target, agreement: null };
      draft.note('The future infinitive of fīō is factum īrī (A&G p. 115); fīō has no future participle to form factūrum esse with.', scan(115));
    }
    if (at(cell, 'participle', 'present') || at(cell, 'participle', 'future') || at(cell, 'gerund', 'present')
      || at(cell, 'supine', 'present') || (at(cell, 'imperative', 'future', 'active') && slot(cell) === '3p')) {
      draft.markUnavailable('fīō has no present or future participle, gerund, supine or third plural future imperative: A&G p. 115 prints none of them.', scan(115));
    }
    if (at(cell, 'participle', 'gerundive')) {
      draft.change('The gerundive of fīō is faciendus, from faciō (A&G p. 115; Bennett §131), not fiendus.', scan(115), form => form.replace(/^fiend/u, 'faciend'));
    }
  }
  if (verb === 'īre') {
    if (cell.voice === 'passive' && compoundPerfect(cell) && cell.expected.some(form => form.startsWith('itus '))) {
      draft.change(
        'The passive of eō is impersonal: its participle stands in the neuter singular, itum est (A&G p. 114, §203.a; §208.d), not itus est.',
        scan(114), form => form.replace(/^itus /u, 'itum '),
      );
    }
    if (at(cell, 'infinitive', 'perfect', 'passive') && cell.target.agreement?.gender === 'masculine') {
      draft.correctedTarget = { ...cell.target, agreement: { gender: 'neuter', number: 'singular', case: 'accusative' } };
      draft.note('itum esse is the impersonal passive of eō, in the neuter singular (A&G §207 table, pūgnātum esse), not a masculine form.', ag('impersonal-verbs'));
    }
    if (at(cell, 'participle', 'perfect')) {
      draft.markUnavailable('A&G prints no perfect participle for eō (p. 114; Bennett §132): its passive is only impersonal (itum est).', scan(114));
    }
    if (at(cell, 'participle', 'gerundive')) {
      draft.markUnavailable('eō has only the impersonal gerundive eundum (A&G p. 114; §190.d: an intransitive verb has the gerundive only impersonally).', scan(114));
    }
  }
}

/** The macron ledger: vowel length only (147 cells). */
export function latinMacronCorrection(file: CorpusFile, cell: CorpusCell, _index: number, draft: CorrectionDraft): void {
  if (cell.scope === 'unmodelled') return;
  const verb = file.infinitive;
  if (verb === 'sequī') {
    draft.change('sequor\'s participle is secūtus, with a short e (A&G p. 104, §191; Lewis & Short sĕcūtus), not sēcūtus.', scan(104), form => form.replace(/sēcūt/gu, 'secūt'));
  }
  if (verb === 'largīrī') {
    draft.change('largior\'s participle is largītus, with a long ī (Bennett §113; Lewis & Short largĭor, ītus), not largitus.', bennett(113), form => form.replace(/largit/gu, 'largīt'));
  }
  if (at(cell, 'imperative', 'future', 'passive') && slot(cell) === '3p') {
    if (verb === 'amāre') draft.change('A vowel before nt is short (A&G §10.e): amantor, not amāntor.', ag('quantity-syllables'), form => form.replace('āntor', 'antor'));
    if (verb === 'audīre') draft.change('A vowel before another vowel is short (A&G §10.a): audiuntor, not audīuntor.', ag('quantity-syllables'), form => form.replace('īuntor', 'iuntor'));
  }
  if (verb === 'velle' && at(cell, 'participle', 'present')) {
    draft.change('A vowel before ns is long (A&G §10.d); A&G p. 110 prints volēns, not volens.', scan(110), form => form.replace(/ens$/u, 'ēns'));
  }
  if (at(cell, 'subjunctive', 'perfect', 'active') && ['2s', '1p', '2p'].includes(slot(cell))) {
    draft.change(
      'Not a source error but a choice between authorities: A&G prints the perfect subjunctive with -eris, -erimus, -eritis (p. 93), as this page does; Bennett §101 prints -erīs, -erīmus, -erītis, and the engine follows Bennett, as the design decides.',
      bennett(101), form => form.replace(/eris$/u, 'erīs').replace(/erimus$/u, 'erīmus').replace(/eritis$/u, 'erītis'),
    );
  }
}

export function latinCorrection(file: CorpusFile, cell: CorpusCell, index: number): CorpusCorrection | null {
  const draft = startCorrection(file, cell, index);
  latinFormCorrection(file, cell, index, draft);
  latinMacronCorrection(file, cell, index, draft);
  return draft.finish();
}
