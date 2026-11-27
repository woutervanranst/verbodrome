import type { FormVariant } from '../types.js';
import type { DerivationStep } from './derivation.js';

/** The value of each variant tag. */
interface TagValues {
  readonly orthography: 'rectified' | 'traditional';
  /** One or more pattern labels, joined with `.`. */
  readonly pattern: string;
  readonly usage: FormVariant['usage'];
  readonly region: string;
  /** One or more conditions, joined with `; `. */
  readonly condition: string;
}

/**
 * Labels a spelling variant. A key that is absent (or undefined) is compatible with any value on the other side.
 * `orthography` and `region` are constraints: an outcome tagged with one value cannot combine with an outcome tagged with
 * another. `pattern`, `usage` and `condition` are labels, which combine (see `mergeTags`).
 */
export type VariantTags = { readonly [K in keyof TagValues]?: TagValues[K] };

/**
 * Names a grammar puts on a word's outcome for its own clause to read, such as which set of forms the word belongs to.
 * Marks are not explanations and not variant labels: they travel with the outcome to the word (`ChainWord.marks`) and
 * never reach a form's variant or its steps.
 */
export type Marks = readonly string[];

export interface Outcome<T> {
  readonly value: T;
  readonly steps: readonly DerivationStep[];
  readonly tags: VariantTags;
  /** The outcome's marks; absent when it has none. */
  readonly marks?: Marks;
}

/**
 * Every way a rule can come out. An empty fork drops the branch it continues; it is not how a staged grammar says that
 * a form does not exist. `availability` declares that, with its rule and source, and an available target that ends with
 * no form at all is a GENERATION_FAILURE naming the stage that came back empty.
 */
export type Fork<T> = readonly Outcome<T>[];

export function one<T>(value: T, steps: readonly DerivationStep[] = [], tags: VariantTags = {}, marks: Marks = []): Fork<T> {
  return [{ value, steps, tags, ...withMarks(marks) }];
}

/** The marks of both outcomes, those of `a` first, each once. */
export function mergeMarks(a: Marks | undefined, b: Marks | undefined): Marks {
  return [...new Set([...a ?? [], ...b ?? []])];
}

/** The `marks` property of an outcome: absent for no marks, so an outcome without marks has no such key. */
export function withMarks(marks: Marks): { readonly marks?: Marks } {
  return marks.length ? { marks } : {};
}

/** How marked each usage is, standard lowest; a new usage value does not compile until it is ranked here. */
export const usageRank: Readonly<Record<FormVariant['usage'], number>> = { standard: 0, literary: 1, dated: 2 };

/** Combines two defined values of one tag: the merged value, or null when they conflict. */
type TagMerge<T> = (left: T, right: T) => T | null;

/** A constraint: equal values agree, different values conflict. */
const constraint = <T>(left: T, right: T): T | null => left === right ? left : null;

/** A list of labels: the labels of both sides in order, each once. */
const labels = (separator: string): TagMerge<string> => (left, right) => {
  const joined = left.split(separator);
  for (const label of right.split(separator)) if (!joined.includes(label)) joined.push(label);
  return joined.join(separator);
};

/** The merge rule of every tag, in output order; a tag without a rule here does not compile. */
const tagMerges: { readonly [K in keyof TagValues]: TagMerge<TagValues[K]> } = {
  orthography: constraint,
  pattern: labels('.'),
  usage: (left, right) => usageRank[right] > usageRank[left] ? right : left,
  region: constraint,
  condition: labels('; '),
};

/** The tags, in output order: exactly the keys of `tagMerges`, whose type lists every tag. */
const tagKeys = Object.keys(tagMerges) as readonly (keyof TagValues)[];

type MutableTags = { -readonly [K in keyof TagValues]?: TagValues[K] };

/** Merges one tag of `a` and `b` into `merged`; false on a conflict. */
function mergeTag<K extends keyof TagValues>(key: K, a: VariantTags, b: VariantTags, merged: MutableTags): boolean {
  const left: TagValues[K] | undefined = a[key];
  const right: TagValues[K] | undefined = b[key];
  const merge: TagMerge<TagValues[K]> = tagMerges[key];
  const value = left === undefined ? right : right === undefined ? left : merge(left, right);
  if (value === null) return false;
  if (value !== undefined) merged[key] = value;
  return true;
}

/**
 * Both tag sets in one: constraints (orthography, region) must agree; patterns join with `.` and conditions with `; `,
 * in order and each label once; the most marked usage wins. Null when a constraint has two different values.
 */
export function mergeTags(a: VariantTags, b: VariantTags): VariantTags | null {
  const merged: MutableTags = {};
  for (const key of tagKeys) {
    if (!mergeTag(key, a, b, merged)) return null;
  }
  return merged;
}

/** Continues every outcome through `next`; steps are concatenated, tags and marks merged, conflicting branches dropped. */
export function chain<A, B>(fork: Fork<A>, next: (value: A) => Fork<B>): Fork<B> {
  const result: Outcome<B>[] = [];
  for (const first of fork) {
    for (const second of next(first.value)) {
      const tags = mergeTags(first.tags, second.tags);
      if (tags === null) continue;
      result.push({ value: second.value, steps: [...first.steps, ...second.steps], tags, ...withMarks(mergeMarks(first.marks, second.marks)) });
    }
  }
  return result;
}

/** Cartesian product of forks, in order; conflicting combinations are dropped. */
export function combine<T extends readonly unknown[]>(forks: { [K in keyof T]: Fork<T[K]> }): Fork<T> {
  let acc: Fork<readonly unknown[]> = one<readonly unknown[]>([]);
  for (const fork of forks as readonly Fork<unknown>[]) {
    acc = chain(acc, values => chain(fork, value => one([...values, value])));
  }
  return acc as Fork<T>;
}
