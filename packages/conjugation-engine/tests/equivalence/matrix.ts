/**
 * The text of `tests/equivalence/matrix.tsv`: a header, then one line per lookup (source language, source tense, target
 * language) with its ranked matches and their notes. A match is `<mood.tense> <score> <match>`, the match being `exact`,
 * `override` or `approximate(<relaxed, joined by +>)`; a lookup without a match is `none`, and its notes column is the
 * notes of the lookup (why nothing corresponds). Otherwise the notes column has each match's notes, comma-joined, `-`
 * for none, in the order of the matches.
 */
import type { EquivalentFound } from '../../src/equivalence/derive.js';
import type { MatrixRow } from '../../src/equivalence/index.js';

const matchText = (entry: EquivalentFound): string => {
  if (entry.match !== 'approximate') return entry.match;
  return entry.relaxed.length === 0 ? 'approximate' : `approximate(${entry.relaxed.join('+')})`;
};

const notesText = (notes: readonly string[]): string => notes.length === 0 ? '-' : notes.join(',');

export function formatMatrix(rows: readonly MatrixRow[]): string {
  const lines = ['from\ttense\tto\tranked\tnotes'];
  for (const { from, tense, to, results: { matches, notes } } of rows) {
    if (matches.length > 0 && notes.length > 0) throw new Error(`${from} ${tense} ${to}: notes of the lookup beside its matches have no column`);
    const ranked = matches.length === 0 ? 'none' : matches.map(entry => `${entry.tense} ${entry.score.toFixed(2)} ${matchText(entry)}`).join(' | ');
    const noted = matches.length === 0 ? notesText(notes) : matches.map(entry => notesText(entry.notes)).join(' | ');
    lines.push([from, tense, to, ranked, noted].join('\t'));
  }
  return `${lines.join('\n')}\n`;
}
