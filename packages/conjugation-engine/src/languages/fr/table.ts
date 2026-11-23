import { ConjugationError } from '../../errors.js';
import { personIndex } from '../../parts.js';
import type { Gender, GrammaticalNumber, ResolvedTarget } from '../../types.js';

export type Spelling = 'rectified' | 'traditional';
export type ModelKind = 'er' | 'ir' | 're' | 'irregular';

/** One accepted ending for a cell. */
export interface Alternative {
  /** Text appended to the stem (the infinitive minus the model's `strip` letters). */
  readonly ending: string;
  /** Rewrites the stem's last `e`/`é` to `è` before appending (`lev-` → `lèv-e`). */
  readonly grave: boolean;
  /** Restricts the alternative to one spelling; `null` means both. */
  readonly orthography: Spelling | null;
}

/** `null` marks a cell the model does not have. */
export type Cell = readonly Alternative[] | null;

export interface Paradigm {
  readonly pattern: string | null;
  readonly usage: 'standard' | 'dated';
  readonly cells: readonly Cell[];
}

/**
 * Row layout of an ending table. Rows 1–7 hold six persons each; row 8 holds the
 * imperative (tu, nous, vous), the present participle, the four past participles
 * (masculine/feminine × singular/plural), and the infinitive.
 */
const finiteRows = [
  'indicative.present', 'indicative.imperfect', 'indicative.simple_past', 'indicative.future',
  'subjunctive.present', 'subjunctive.imperfect', 'conditional.present',
] as const;
const imperativeSlots: Readonly<Record<number, number>> = { 1: 42, 3: 43, 4: 44 };
export const presentParticipleSlot = 45;
export const infinitiveSlot = 50;
const cellCount = 51;

export function finiteSlot(target: ResolvedTarget): number {
  const index = personIndex(target);
  if (target.mood === 'imperative') {
    const slot = imperativeSlots[index];
    if (slot === undefined) throw new ConjugationError('GENERATION_FAILURE', 'French imperatives exist only for tu, nous, and vous.');
    return slot;
  }
  const row = finiteRows.indexOf(`${target.mood}.${target.tense}` as (typeof finiteRows)[number]);
  if (row < 0) throw new ConjugationError('GENERATION_FAILURE', `No French simple-form row for ${target.mood}/${target.tense}.`);
  return row * 6 + index;
}

export function pastParticipleSlot(gender: Gender | null, number: GrammaticalNumber | null): number {
  return 46 + (gender === 'feminine' ? 1 : 0) + (number === 'plural' ? 2 : 0);
}

function alternative(source: string): Alternative {
  let text = source;
  let orthography: Spelling | null = null;
  if (text.startsWith('t:')) orthography = 'traditional';
  else if (text.startsWith('r:')) orthography = 'rectified';
  if (orthography) text = text.slice(2);
  const grave = text.startsWith('^');
  if (grave) text = text.slice(1);
  return { ending: text === '0' ? '' : text, grave, orthography };
}

/**
 * Parses an eight-row ending table. Cells are separated by whitespace; `-` marks a
 * missing cell, `/` separates accepted alternatives, `t:`/`r:` restrict an
 * alternative to traditional/1990 spelling, `^` requests the grave stem, and `0`
 * is an empty ending.
 */
export function parseTable(source: string, pattern: string | null = null, usage: Paradigm['usage'] = 'standard'): Paradigm {
  const rows = source.trim().split('\n').map(row => row.trim().split(/\s+/u));
  const sizes = rows.map(row => row.length);
  if (rows.length !== 8 || sizes.slice(0, 7).some(size => size !== 6) || sizes[7] !== 9) {
    throw new ConjugationError('GENERATION_FAILURE', `Malformed French ending table (${sizes.join(',')}).`);
  }
  const cells = rows.flat().map(cell => cell === '-' ? null : cell.split('/').map(alternative));
  if (cells.length !== cellCount) throw new ConjugationError('GENERATION_FAILURE', 'Malformed French ending table.');
  return { pattern, usage, cells };
}

const graveVowel = /[eé](?=[^eé]*$)/u;

/** Applies a cell to a stem, returning the texts accepted in one spelling, or `null` for a missing cell. */
export function cellTexts(stem: string, cell: Cell, spelling: Spelling, rectifyStem: boolean): string[] | null {
  if (cell === null) return null;
  const base = spelling === 'rectified' && rectifyStem ? stem.replace(/î/gu, 'i').replace(/û/gu, 'u') : stem;
  return cell.filter(item => item.orthography === null || item.orthography === spelling).map(item => {
    if (!item.grave) return base + item.ending;
    if (!graveVowel.test(base)) throw new ConjugationError('GENERATION_FAILURE', `No vowel for a grave stem in ${stem}.`);
    return base.replace(graveVowel, 'è') + item.ending;
  });
}
