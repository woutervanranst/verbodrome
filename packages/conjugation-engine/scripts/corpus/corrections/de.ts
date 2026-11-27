/**
 * Source errors in the German corpus (design §9.5, C1–C12, and C13 found by the import), each against the rule or
 * dictionary page that gives the correct form. Every expected string written here is literal or built from the cell's
 * own texts.
 */
import { startCorrection } from '../model.ts';
import type { CorpusCell, CorpusCorrection, CorpusFile } from '../model.ts';

const regelwerk = 'https://www.rechtschreibrat.com/DOX/RfdR_Amtliches-Regelwerk_2024.pdf';
const formenbestand = 'https://grammis.ids-mannheim.de/systematische-grammatik/439';
const aufforderung = 'https://grammis.ids-mannheim.de/systematische-grammatik/290';
const wuerdeFormen = 'https://grammis.ids-mannheim.de/systematische-grammatik/312';
const modalverben = 'https://www.duden.de/sprachwissen/sprachratgeber/modalverben';

/** d/t-stem verbs whose bare du-imperative (find, halt) the DWDS inflection table marks colloquial (ugs.), checked one by one. */
const colloquialBareImperative: readonly string[] = [
  'bieten', 'binden', 'bitten', 'empfinden', 'finden', 'gleiten', 'halten', 'leiden', 'meiden', 'raten', 'reiten', 'scheiden',
  'schneiden', 'schreiten', 'schwinden', 'streiten',
];

const modals: Readonly<Record<string, string>> = {
  dürfen: 'gedurft', können: 'gekonnt', mögen: 'gemocht', müssen: 'gemusst', sollen: 'gesollt', wollen: 'gewollt',
};
const wuerde: Readonly<Record<string, string>> = {
  '1sg': 'ich würde', '2sg': 'du würdest', '3sg': 'er würde', '1pl': 'wir würden', '2pl': 'ihr würdet', '3pl': 'sie würden',
};
/** The haben form of each sein form a compound tense uses. */
const habenFor: Readonly<Record<string, string>> = {
  bin: 'habe', bist: 'hast', ist: 'hat', sind: 'haben', seid: 'habt',
  war: 'hatte', warst: 'hattest', waren: 'hatten', wart: 'hattet',
  sei: 'habe', seiest: 'habest', seist: 'habest', seien: 'haben', seiet: 'habet',
  wäre: 'hätte', wärest: 'hättest', wärst: 'hättest', wären: 'hätten', wäret: 'hättet', wärt: 'hättet',
  sein: 'haben',
};

/** Every spelling of `text` with one or more of its ß written ss. */
function ssSpellings(text: string): string[] {
  const parts = text.split('ß');
  const spellings: string[] = [];
  for (let mask = 1; mask < 2 ** (parts.length - 1); mask++) {
    spellings.push(parts.slice(1).reduce((joined, part, i) => joined + ((mask >> i) & 1 ? 'ss' : 'ß') + part, parts[0]!));
  }
  return spellings;
}

function keep(draft: ReturnType<typeof startCorrection>, kept: string[], reason: string, url: string): void {
  if (kept.length === draft.expected.length) return;
  draft.expected = kept;
  draft.note(reason, url);
}

/** A cell built with the perfect auxiliary (targets after the remaps, which the importer applies first). */
const isCompound = (cell: CorpusCell): boolean =>
  ['perfect', 'pluperfect', 'future_perfect'].includes(cell.target.tense) || (cell.target.mood === 'conditional' && cell.target.tense === 'past');

export function germanCorrection(file: CorpusFile, cell: CorpusCell, index: number): CorpusCorrection | null {
  const draft = startCorrection(file, cell, index);
  const verb = file.infinitive;
  const { mood, tense } = cell.target;

  // C1: the page adds the pre-1996 spelling with ß after a short vowel next to the current ss form.
  keep(draft, draft.expected.filter(text => !ssSpellings(text).some(spelling => draft.expected.includes(spelling))),
    'Since the 1996 reform ss is written after a short vowel (muss, isst, gewusst); the ß spelling beside the ss form is the old one.',
    regelwerk);

  // C2: ihr takes -t after the -te of the weak Präteritum and Konjunktiv II.
  if (verb === 'bewegen') {
    draft.change('The ihr form of the weak Präteritum ends in -tet: ihr bewegtet, not ihr bewegte.',
      'https://www.dwds.de/lemma/flexion/bewegen', text => text === 'ihr bewegte' ? 'ihr bewegtet' : text);
  }
  if (mood === 'subjunctive' && tense === 'present') {
    // C3: the Konjunktiv I 3rd person plural ends in -en.
    draft.change('The Konjunktiv I has the ending -en in the 3rd person plural: sie beginnen, not sie beginne.',
      formenbestand, text => /^sie (?:beginne|gerinne|gewinne)$/u.test(text) ? `${text}n` : text);
    // C4: the Konjunktiv I is built on the present stem.
    draft.change('The Konjunktiv I is built on the present stem: wir schwören; schworen is the Präteritum.',
      formenbestand, text => text === 'wir schworen' ? 'wir schwören' : text);
  }
  if (mood === 'imperative') {
    // C5: sein's wir- and Sie-forms.
    draft.change('The wir- and Sie-forms of sein used as a command are seien wir and seien Sie (or sind Sie), never the infinitive sein.',
      aufforderung, text => text.replace(/^sein (wir|Sie)$/u, 'seien $1'));
    // C6: modal verbs have no imperative.
    if (Object.hasOwn(modals, verb) && cell.subject !== '2sg') {
      draft.markUnavailable('Modal verbs form no imperative: there is no command form of dürfen, können, mögen, müssen, sollen or wollen.', modalverben);
    }
    // C12: the bare du-imperative of these d/t-stem verbs is colloquial (DWDS: ugs.); laden's lad is not marked.
    if (cell.subject === '2sg' && colloquialBareImperative.includes(verb)) {
      keep(draft, draft.expected.filter(text => !(/[dt]$/u.test(text) && draft.expected.includes(`${text}e`))),
        'After a stem ending in d or t the du-imperative keeps its -e (finde, halte); DWDS marks the bare form colloquial (ugs.).',
        `https://www.dwds.de/lemma/flexion/${verb}`);
    }
  }
  // C7: geschehen has only 3rd-person forms.
  if (verb === 'geschehen' && cell.subject !== undefined && !['3sg', '3pl'].includes(cell.subject)) {
    draft.markUnavailable('geschehen has only 3rd-person forms (es geschieht, sie geschehen): Duden prints no ich, du, wir or ihr forms.',
      'https://www.duden.de/konjugation/geschehen');
  }
  // C8, C9: the weak transitive erschrecken and the weak wachsen ('wax') take haben.
  const weak = verb === 'erschrecken' ? 'erschreckt' : verb === 'wachsen' ? 'gewachst' : null;
  if (weak !== null && isCompound(cell)) {
    const before = draft.expected;
    const rewritten = [...new Set(before.map(text => text.split(' ').includes(weak) ? text.split(' ').map(word => habenFor[word] ?? word).join(' ') : text))];
    if (JSON.stringify(rewritten) !== JSON.stringify(before)) {
      draft.expected = rewritten;
      draft.note(verb === 'erschrecken'
        ? 'The weak transitive erschrecken (jemanden erschrecken, erschreckt) takes haben; only the strong erschrocken takes sein.'
        : 'The weak wachsen (to wax, gewachst) takes haben; only the strong wachsen (to grow, gewachsen) takes sein.',
      `https://www.dwds.de/wb/${verb}`);
    }
  }
  // C10: the Konjunktiv II of schreien is spelled like the Präteritum.
  if (verb === 'schreien') {
    draft.change('After -ie the e of the ending is not written twice: the Konjunktiv II of schreien is schrie, schriest, schrien, schriet.',
      'https://www.dwds.de/lemma/flexion/schreien', text => text.replace(/\bschriee(st|n|t)?$/u, (_, ending: string | undefined) => `schrie${ending ?? ''}`));
  }
  // C13 (found in the import): an archaic e before -st after sch.
  if (verb === 'erlöschen' && mood === 'indicative' && tense === 'past') {
    keep(draft, draft.expected.filter(text => text !== 'du erloschest'),
      'DWDS and Duden print only du erloschst; an e inserted after sch before -st in a strong Präteritum is archaic (grammis).',
      'https://www.dwds.de/lemma/flexion/erlöschen');
  }
  // C11: the würde-forms of the modal verbs exist.
  if (Object.hasOwn(modals, verb) && mood === 'conditional' && cell.subject !== undefined) {
    draft.expected = [`${wuerde[cell.subject]!} ${tense === 'past' ? `${modals[verb]!} haben` : verb}`];
    draft.unavailable = false;
    draft.note('Modal verbs have würde-forms like every verb (ich würde können, ich würde gekonnt haben); the page leaves them empty.', wuerdeFormen);
  }
  return draft.finish();
}
