import type { LanguagePack } from './pack.js';

/** The key of a language without its own: NFC, lower case, trimmed, every run of white space one space; accents kept. */
export function plainComparisonKey(text: string): string {
  return text.normalize('NFC').toLowerCase().trim().replace(/\s+/gu, ' ');
}

/** The key of `text` in `pack`: the pack's `compareKey`, or `plainComparisonKey`. */
export function comparisonKey(pack: LanguagePack, text: string): string {
  return pack.compareKey ? pack.compareKey(text) : plainComparisonKey(text);
}
