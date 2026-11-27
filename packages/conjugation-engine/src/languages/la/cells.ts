import type { Cell } from '../../core/staged.js';

/** The key of a cell in an entry's `cells`: `indicative.present.active.2s`, or the non-finite form id. */
export function cellKeyOf(cell: Cell): string {
  return cell.kind === 'finite'
    ? `${cell.mood}.${cell.tense}.${cell.voice ?? 'active'}.${cell.person}${cell.number === 'singular' ? 's' : 'p'}`
    : cell.form;
}
