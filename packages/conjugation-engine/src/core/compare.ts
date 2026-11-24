import { packFor } from './pack.js';
import type { LanguagePack } from './pack.js';

/** A language's comparison key: two spellings of an answer count as the same when their keys are equal. */
export type ComparisonKey = (text: string) => string;

/**
 * What a pack adds to the pack contract to compare answers its own way (Latin ignores macrons and writes j as i). A
 * pack without `compareKey` compares with `plainComparisonKey`.
 */
export interface ComparesSpelling {
  readonly compareKey?: ComparisonKey;
}

/** The key of a language without its own: NFC, lower case, trimmed, every run of white space one space. */
export function plainComparisonKey(text: string): string {
  return text.normalize('NFC').toLowerCase().trim().replace(/\s+/gu, ' ');
}

/**
 * `normalizeForComparison(language, text)` over a set of packs: the key of `text` in the pack of `language`, by that
 * pack's `compareKey` or else `plainComparisonKey`. A language that is not among the packs throws
 * UNSUPPORTED_LANGUAGE, naming them.
 */
export function comparisonFor(packs: Readonly<Record<string, LanguagePack & ComparesSpelling>>): (language: string, text: string) => string {
  return (language, text) => {
    const pack: LanguagePack & ComparesSpelling = packFor(packs, language);
    return (pack.compareKey ?? plainComparisonKey)(text);
  };
}
