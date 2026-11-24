/**
 * Compound verbs: a prefix allomorph plus a family's compound form (GD §3.4; A&G §§16, 267). Parsing is
 * macron-insensitive, longest allomorph first, one prefix only; the output keeps the allomorph with its quantity
 * (conficere → cōnficere, A&G §10.d).
 */
import { latinKey } from './key.js';
import { latinFamilies, noInherit } from './lexicon.js';
import type { LatinFamily } from './lexicon.js';

export interface PrefixAllomorph {
  /** The prefix the allomorph belongs to (ad for ac-). */
  readonly prefix: string;
  /** The allomorph as written, with its quantity. */
  readonly form: string;
  /** The onsets (of the base, macron-insensitive) it stands before; absent: elsewhere. */
  readonly before?: RegExp;
}

const table: readonly (readonly [string, string, RegExp?])[] = [
  ['ab', 'ā', /^[mv]/u], ['ab', 'abs', /^[ct]/u], ['ab', 'au', /^f/u], ['ab', 'ab'],
  ['ad', 'ac', /^[cq]/u], ['ad', 'af', /^f/u], ['ad', 'ag', /^g/u], ['ad', 'al', /^l/u], ['ad', 'ap', /^p/u], ['ad', 'ar', /^r/u],
  ['ad', 'as', /^s/u], ['ad', 'at', /^t/u], ['ad', 'a', /^(?:sc|sp|st|gn)/u], ['ad', 'ad'],
  ['ante', 'ante'], ['circum', 'circu', /^i/u], ['circum', 'circum'], ['inter', 'intel', /^l/u], ['inter', 'inter'],
  ['per', 'pel', /^l/u], ['per', 'per'], ['post', 'post'], ['prae', 'prae'], ['praeter', 'praeter'], ['super', 'super'],
  ['com', 'co', /^[aeiouh]/u], ['com', 'col', /^l/u], ['com', 'cor', /^r/u], ['com', 'com', /^[bpm]/u], ['com', 'cōn', /^[fs]/u], ['com', 'con'],
  ['dē', 'dē'],
  ['ex', 'ē', /^[bdglmnrv]/u], ['ex', 'ef', /^f/u], ['ex', 'ex'],
  ['dis', 'dī', /^[dglmrv]/u], ['dis', 'dif', /^f/u], ['dis', 'dir', /^[aeiou]/u], ['dis', 'dis'],
  ['in', 'im', /^[bmp]/u], ['in', 'il', /^l/u], ['in', 'ir', /^r/u], ['in', 'īn', /^[fs]/u], ['in', 'in'],
  ['ob', 'oc', /^c/u], ['ob', 'of', /^f/u], ['ob', 'og', /^g/u], ['ob', 'op', /^p/u], ['ob', 'o', /^m/u], ['ob', 'ob'],
  ['prō', 'prōd', /^[aeiou]/u], ['prō', 'prō'],
  ['re', 'red', /^[aeiouh]/u], ['re', 're'],
  ['sē', 'sēd', /^[aeiou]/u], ['sē', 'sē'],
  ['sub', 'suc', /^c/u], ['sub', 'suf', /^f/u], ['sub', 'sug', /^g/u], ['sub', 'sum', /^m/u], ['sub', 'sup', /^p/u], ['sub', 'sur', /^r/u],
  ['sub', 'sus', /^[cpt]/u], ['sub', 'sub'],
  ['trāns', 'trā', /^[dilmn]/u], ['trāns', 'trāns'],
];

/** The closed prefix list with assimilation, longest allomorph first and, at one length, onset-bound before elsewhere. */
export const prefixAllomorphs: readonly PrefixAllomorph[] = table
  .map(([prefix, form, before]) => ({ prefix, form, ...(before ? { before } : {}) }))
  .sort((a, b) => latinKey(b.form).length - latinKey(a.form).length || Number(b.before !== undefined) - Number(a.before !== undefined));

export interface CompoundMatch {
  readonly prefix: string;
  /** The allomorph as it is written in the compound. */
  readonly allomorph: string;
  readonly family: LatinFamily;
}

/**
 * The families `key` is a compound of, through the first allomorph (longest first) that yields any; [] for a key on the
 * no-inherit list or none. A family with a weakened form is matched only in that form (recapere is not capiō's).
 */
export function resolveCompound(key: string): readonly CompoundMatch[] {
  if (noInherit.has(key)) return [];
  for (const allomorph of prefixAllomorphs) {
    const head = latinKey(allomorph.form);
    if (!key.startsWith(head)) continue;
    const rest = key.slice(head.length);
    if (allomorph.before && !allomorph.before.test(rest)) continue;
    const matches = (latinFamilies[rest] ?? [])
      .filter(family => family.prefixes === undefined || family.prefixes.includes(allomorph.prefix))
      .map(family => ({ prefix: allomorph.prefix, allomorph: allomorph.form, family }));
    if (matches.length) return matches;
  }
  return [];
}
