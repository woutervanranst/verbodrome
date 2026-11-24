import type { Citation, Work } from '../../core/sources.js';
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

/** Where each rule is stated. */
export const latinCitations = {} as const satisfies Record<keyof typeof latinRules, Citation | readonly Citation[]>;

/** How a lexicon entry was checked: against the 1903 A&G print, against Lewis & Short, or only a secondary source. */
export interface LexiconVerification {
  readonly url: `https://${string}`;
  readonly status: 'ag-print' | 'ls' | 'secondary';
}

/** The verification of every lexicon entry, keyed by its first principal part (or infinitive for a defective verb). */
export const lexiconVerification: Readonly<Record<string, LexiconVerification>> = {};
