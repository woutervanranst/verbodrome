/**
 * The macron-insensitive key of a Latin spelling (GD §3.2 step 1, §6.6): macrons and breves removed, lower case, j
 * written i, trimmed, runs of white space as one space. Lexicon look-up and answer comparison both use it, so amāverīs,
 * amaveris and AMAVERIS compare equal, and iubeō equals jubeo. Consonantal v and u are not merged (A&G and Bennett
 * write v).
 */
export function latinKey(text: string): string {
  return text.normalize('NFD').replace(/[̄̆]/gu, '').normalize('NFC').toLowerCase()
    .replace(/j/gu, 'i').trim().replace(/\s+/gu, ' ');
}

/** True when `text` carries at least one macron (or breve), so its quantities are given. */
export function hasQuantityMarks(text: string): boolean {
  return /[̄̆]/u.test(text.normalize('NFD'));
}
