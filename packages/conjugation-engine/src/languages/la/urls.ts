/**
 * The addresses of the Latin pack's authorities, in one place (the lexicon's `checked` records and the rules' citations
 * use them): the 1903 A&G page scans and the DCC text, Bennett on Project Gutenberg, Lewis & Short on Logeion.
 */

/** The scan of the 1903 A&G print page `page`: the file AG<page + 12>.jpg. */
export const agScanUrl = (page: number): `https://${string}` => `https://dcc.dickinson.edu/sites/default/files/AG${String(page + 12).padStart(3, '0')}.jpg`;

/** A section page of A&G's DCC edition. */
export const agTextUrl = (slug: string): `https://${string}` => `https://dcc.dickinson.edu/grammar/latin/${slug}`;

/** A section of Bennett's New Latin Grammar (Project Gutenberg #15665). */
export const bennettUrl = (section: number): `https://${string}` => `https://www.gutenberg.org/files/15665/15665-h/15665-h.htm#sect${section}`;

/** Lewis & Short's entry for `lemma` (written without macrons, as Logeion addresses it). */
export const lsUrl = (lemma: string): `https://${string}` => `https://logeion.uchicago.edu/${lemma}`;
