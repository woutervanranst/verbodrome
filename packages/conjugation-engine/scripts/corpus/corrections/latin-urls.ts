/**
 * The authority addresses the two Latin ledgers cite (the scraped corpus and en.wiktionary): A&G's 1903 page scans and
 * DCC text, Bennett on Project Gutenberg, Lewis & Short on Logeion. The corpus tooling may not import engine code, so
 * this mirrors `src/languages/la/urls.ts`.
 */
export const scan = (page: number): string => `https://dcc.dickinson.edu/sites/default/files/AG${String(page + 12).padStart(3, '0')}.jpg`;
export const ag = (slug: string): string => `https://dcc.dickinson.edu/grammar/latin/${slug}`;
export const bennett = (section: number): string => `https://www.gutenberg.org/files/15665/15665-h/15665-h.htm#sect${section}`;
export const lewisShort = (lemma: string): string => `https://logeion.uchicago.edu/${lemma}`;
