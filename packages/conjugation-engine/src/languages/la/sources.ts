import type { Citation, Work } from '../../core/sources.js';
import type { LexiconCheck } from './entries.js';
import { latinEntries } from './lexicon.js';
import type { latinRules } from './rules.js';

/** The works Latin rules cite (GD §1.1). Wiktionary and the scraped corpus are data, never cited for a rule. */
export const latinWorks = {
  ag: {
    id: 'ag', title: 'New Latin Grammar (ed. M. Ayer, Dickinson College Commentaries, 2014)',
    author: 'J. H. Allen and J. B. Greenough', year: 1903, url: 'https://dcc.dickinson.edu/grammar/latin/index',
  },
  'ag-print': {
    id: 'ag-print', title: 'New Latin Grammar, page scans of the 1903 print (Dickinson College Commentaries)',
    author: 'J. H. Allen and J. B. Greenough', year: 1903, url: 'https://dcc.dickinson.edu/grammar/latin/index',
  },
  bennett: {
    id: 'bennett', title: 'New Latin Grammar (Project Gutenberg #15665)', author: 'C. E. Bennett', year: 1918,
    url: 'https://www.gutenberg.org/files/15665/15665-h/15665-h.htm',
  },
  ls: {
    id: 'ls', title: 'A Latin Dictionary (via Logeion)', author: 'C. T. Lewis and C. Short', year: 1879,
    url: 'https://logeion.uchicago.edu/',
  },
} as const satisfies Record<string, Work>;

/** A&G in the DCC edition: `slug` is the page of the section, `section` its number (e.g. '§172'). */
export function ag(slug: string, section: string): Citation {
  return { work: 'ag', locator: `A&G ${section}`, url: `https://dcc.dickinson.edu/grammar/latin/${slug}` };
}

/** The 1903 A&G print page `page`, whose scan is the file AG<page + 12>.jpg. */
export function agPage(page: number): Citation {
  return { work: 'ag-print', locator: `A&G p. ${page}`, url: `https://dcc.dickinson.edu/sites/default/files/AG${String(page + 12).padStart(3, '0')}.jpg` };
}

export function bennett(section: number, sub = ''): Citation {
  return { work: 'bennett', locator: `Bennett §${section}${sub}`, url: `https://www.gutenberg.org/files/15665/15665-h/15665-h.htm#sect${section}` };
}

/** Lewis & Short's entry for `lemma` (written without macrons, as Logeion addresses it). */
export function ls(lemma: string): Citation {
  return { work: 'ls', locator: `Lewis & Short, s.v. ${lemma}`, url: `https://logeion.uchicago.edu/${lemma}` };
}

/** Lewis & Short as a whole, for rules that read the lexicon. */
const lsWhole: Citation = { work: 'ls', locator: 'Lewis & Short', url: 'https://logeion.uchicago.edu/' };
const thirdLists = (sub: string): Citation => ag('classified-lists-verbs-3rd-conjugation', `§211.${sub}`);

/** Where each rule is stated (GD §4). */
export const latinCitations = {
  'la.classify.lexicon': [ag('four-conjugations', '§172'), lsWhole],
  'la.classify.compound': [ag('compound-words', '§267.a, Note 2'), ag('phonetic-changes', '§16')],
  'la.classify.conjugation': [ag('four-conjugations', '§171'), bennett(98)],
  'la.classify.io': [ag('forms-conjugation', '§179.c.1'), ag('3rd-conjugation-io-verbs', '§188'), bennett(109)],
  'la.classify.deponent': [ag('deponent-verbs', '§190'), ag('verb-conjugations', '§156.b')],
  'la.classify.semi-deponent': [ag('deponent-verbs', '§192'), bennett(114)],
  'la.classify.assume-third': ag('four-conjugations', '§171'),
  'la.classify.assume-second-deponent': ag('deponent-verbs', '§190'),
  'la.classify.assume-consonant-stem': ag('3rd-conjugation-io-verbs', '§188'),
  'la.classify.assume-quantity': ag('quantity-syllables', '§10'),
  'la.classify.assume-passive': [ag('verb-conjugations', '§154.a'), ag('impersonal-verbs', '§208.d')],
  'la.classify.assume-compound': bennett(118, ' (4.a, Note 1)'),
  'la.classify.default-parts': ag('forms-conjugation', '§179.a.2, b.2, d'),
  'la.classify.default-sigmatic': [ag('perfect-stem', '§177.b'), thirdLists('a')],
  'la.classify.default-uo': thirdLists('f'),
  'la.classify.default-sco': thirdLists('c'),
  'la.classify.default-u': thirdLists('c'),
  'la.stem.present': [ag('present-stem', '§175'), bennett(97)],
  'la.stem.perfect': [ag('four-conjugations', '§172'), ag('perfect-system', '§169')],
  'la.stem.perfect-regular': ag('perfect-stem', '§177.a–b'),
  'la.stem.supine': ag('formation-supine', '§178'),
  'la.stem.supine-regular': ag('formation-supine', '§178.a–b'),
  'la.stem.s-junction': [ag('phonetic-changes', '§15'), bennett(118, ' (3.a)')],
  'la.stem.t-junction': [ag('formation-supine', '§178 Note 1'), bennett(119, ' (1.a)')],
  'la.stem.lexical': [ag('irregular-verbs-d%C5%8D-e%C5%8D-and-ade%C5%8D', '§§202–203'), ag('irregular-verbs-vol%C5%8D-n%C5%8Dl%C5%8D-m%C4%81l%C5%8D', '§199')],
  'la.lex.cell': [ag('sum', '§170'), ag('irregular-verbs-compounds-sum', '§198'), ag('irregular-verbs-vol%C5%8D-n%C5%8Dl%C5%8D-m%C4%81l%C5%8D', '§199'), ag('irregular-verbs-d%C5%8D-e%C5%8D-and-ade%C5%8D', '§§202–203'), ag('irregular-verbs-f%C4%AB%C5%8D', '§204'), bennett(100)],
  'la.end.personal': [ag('personal-endings', '§163'), agPage(89)],
  'la.end.thematic': [ag('forms-conjugation', '§179.c.1, d'), ag('present-stem', '§176.b')],
  'la.end.imperfect': [ag('present-system', '§168.b'), ag('forms-conjugation', '§179.c.1, d')],
  'la.end.future-b': [ag('present-system', '§168.c'), ag('peculiarities', '§183')],
  'la.end.future-e': ag('present-system', '§168.d'),
  'la.end.subjunctive': [ag('present-system', '§168.e'), ag('forms-conjugation', '§179.a.1, b.1')],
  'la.end.imperfect-subjunctive': ag('present-system', '§168.f'),
  'la.end.perfect': [ag('personal-endings', '§163.a'), ag('perfect-system', '§169.a')],
  'la.end.pluperfect': ag('perfect-system', '§169.b'),
  'la.end.future-perfect': ag('perfect-system', '§169.c'),
  'la.end.perfect-subjunctive': [bennett(101), ag('perfect-system', '§169.d Note')],
  'la.end.pluperfect-subjunctive': ag('perfect-system', '§169.e'),
  'la.end.imperative': [ag('personal-endings', '§163.b'), ag('forms-conjugation', '§179.e'), agPage(93)],
  'la.end.infinitive': [ag('verb-endings', '§166'), ag('present-stem', '§175')],
  'la.end.ere': [ag('personal-endings', '§163.a'), agPage(93), bennett(101)],
  'la.end.re': [agPage(94), agPage(104), bennett(96)],
  'la.end.short-imperative': [ag('peculiarities', '§182'), bennett(116, ' (3)')],
  'la.end.athematic': [ag('present-stem', '§174'), ag('irregular-verbs-fer%C5%8D-and-ed%C5%8D', '§200 fn. 3, §201'), bennett(129)],
  'la.end.optative': ag('present-system', '§168.e Note 2'),
  'la.orth.io-drop-i': [ag('forms-conjugation', '§179.c.1'), ag('3rd-conjugation-io-verbs', '§188'), bennett(109)],
  'la.orth.eo-root': ag('irregular-verbs-d%C5%8D-e%C5%8D-and-ade%C5%8D', '§203 fn. 1'),
  'la.orth.a-lost': [ag('forms-conjugation', '§179.a.1'), agPage(92), agPage(94)],
  'la.orth.short-before-vowel': [ag('quantity-syllables', '§10.a'), bennett(5, ' (2.b)'), ag('irregular-verbs-f%C4%AB%C5%8D', '§204')],
  'la.orth.short-before-nt': [ag('quantity-syllables', '§10.e'), ag('verb-endings', '§167'), bennett(5, ' (2.a)')],
  'la.orth.short-final': ag('verb-endings', '§167'),
  'la.orth.long-before-ns': [ag('quantity-syllables', '§10.d'), bennett(5, ' (1.a)')],
} as const satisfies Record<keyof typeof latinRules, Citation | readonly Citation[]>;

/**
 * How each lexicon entry was checked, keyed by its first principal part (or its infinitive for coepī, ōdī, meminī):
 * `ag-print` against the 1903 A&G page scan, `ag-text` against the DCC text of A&G only (a page whose scan is missing,
 * or a model verb of §172), `ls` against Lewis & Short via Logeion, `secondary` against Bennett only.
 */
export const lexiconVerification: Readonly<Record<string, LexiconCheck>> = Object.fromEntries(
  latinEntries.map(entry => [entry.present ?? entry.infinitive, entry.checked]),
);
