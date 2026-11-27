/**
 * The corrections ledger of the en.wiktionary second oracle for Italian (grammar design §8.4). Wiktionary's tables are
 * the output of another engine (Module:it-verb): where they differ from this pack, a record states what the authority
 * says, with a Treccani page read for this pack.
 */
import type { WiktionaryCell, WiktionaryPage } from '../sources/wiktionary-it.ts';

export interface WiktionaryCorrection { readonly expected: string[]; readonly unavailable: boolean; readonly reason: string; readonly source: string }

const vocabolario = (page: string): string => `https://www.treccani.it/vocabolario/${page}/`;

interface Rule {
  readonly title: string;
  /** The cell key, or a test on the key. */
  readonly key: string | ((key: string) => boolean);
  readonly edit: (forms: readonly string[]) => { expected: string[]; unavailable?: boolean };
  readonly reason: string;
  readonly source: string;
}

const drop = (...unwanted: string[]) => (forms: readonly string[]) => ({ expected: forms.filter(form => !unwanted.includes(form)) });
const unavailable = () => ({ expected: [], unavailable: true });

export const wiktionaryRules: readonly Rule[] = [
  {
    title: 'arrivare', key: 'auxiliary', edit: drop('avere'), source: vocabolario('arrivare'),
    reason: 'The Vocabolario gives arrivare "(aus. essere)"; the rare transitive use with avere that the table notes is not modelled.',
  },
  {
    title: 'prendere', key: 'auxiliary', edit: drop('essere'), source: vocabolario('prendere'),
    reason: 'prendere is a transitive verb with avere; the table adds essere only for the idiom "to happen unexpectedly", which is not modelled.',
  },
  {
    title: 'vedere', key: 'participle.present', edit: drop('veggente'), source: vocabolario('vedere'),
    reason: 'The Vocabolario prints "part. pres. veggènte, soprattutto con uso di sost., accanto a vedènte": veggente is mainly a noun; the participle generated is vedente.',
  },
  {
    title: 'parere', key: 'participle.present', edit: unavailable, source: vocabolario('parere2'),
    reason: 'The Vocabolario: "Non è usato il part. pres. se non nell\'ant. forma parvènte"; the old parvente is not generated, and the cell has no current form.',
  },
  {
    title: 'piovere', key: key => /\.(?:1sg|2sg|1pl|2pl|3pl)$/u.test(key) || (/^imperative\./u.test(key)), edit: unavailable,
    source: vocabolario('piovere'),
    reason: 'piovere "di norma ha uso impersonale nel sign. proprio" (Vocabolario): it is modelled in the third person singular only; the personal and figurative uses the table fills in are not.',
  },
  {
    title: 'solere', key: 'gerund.present', edit: unavailable, source: vocabolario('solere'),
    reason: 'The Vocabolario says solere is used in the simple tenses of the indicative (not the future), in the subjunctive and in the present infinitive, and is replaced by essere solito elsewhere: no gerund.',
  },
  {
    title: 'essere', key: 'auxiliary', edit: () => ({ expected: ['essere'] }), source: vocabolario('essere1'),
    reason: 'The table names no auxiliary for essere; the Vocabolario says "I tempi composti si coniugano con l\'aus. essere: sono stato".',
  },
  {
    title: 'morire', key: 'auxiliary', edit: drop('avere'), source: vocabolario('morire'),
    reason: 'The Vocabolario gives morire "(aus. essere)"; the transitive use with avere that the table notes (morire una morte) is not modelled.',
  },
];

export function wiktionaryItalianCorrection(page: Pick<WiktionaryPage, 'title'>, cell: WiktionaryCell): WiktionaryCorrection | null {
  const rule = wiktionaryRules.find(candidate => candidate.title === page.title
    && (typeof candidate.key === 'string' ? candidate.key === cell.key : candidate.key(cell.key)));
  if (rule === undefined) return null;
  const edited = rule.edit(cell.forms.map(form => form.text));
  return { expected: edited.expected, unavailable: edited.unavailable ?? false, reason: rule.reason, source: rule.source };
}

