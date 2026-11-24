import type { FormVariant } from '../types.js';
import type { DerivationStep } from './derivation.js';

/** Labels a spelling variant. A key that is absent (or undefined) is compatible with any value on the other side. */
export interface VariantTags {
  readonly orthography?: 'rectified' | 'traditional';
  readonly pattern?: string;
  readonly usage?: FormVariant['usage'];
  readonly region?: string;
  readonly condition?: string;
}

export interface Outcome<T> {
  readonly value: T;
  readonly steps: readonly DerivationStep[];
  readonly tags: VariantTags;
}

/** Every way a rule can come out; [] = no form. */
export type Fork<T> = readonly Outcome<T>[];

export function one<T>(value: T, steps: readonly DerivationStep[] = [], tags: VariantTags = {}): Fork<T> {
  return [{ value, steps, tags }];
}

const TAG_KEYS = ['orthography', 'pattern', 'usage', 'region', 'condition'] as const;

/** Union of both tag sets; null when one key holds two different values. */
export function mergeTags(a: VariantTags, b: VariantTags): VariantTags | null {
  const merged: Record<string, unknown> = {};
  for (const key of TAG_KEYS) {
    const left = a[key];
    const right = b[key];
    if (left !== undefined && right !== undefined && left !== right) return null;
    const value = left ?? right;
    if (value !== undefined) merged[key] = value;
  }
  return merged as VariantTags;
}

/** Continues every outcome through `next`; steps are concatenated, tags merged, conflicting branches dropped. */
export function chain<A, B>(fork: Fork<A>, next: (value: A) => Fork<B>): Fork<B> {
  const result: Outcome<B>[] = [];
  for (const first of fork) {
    for (const second of next(first.value)) {
      const tags = mergeTags(first.tags, second.tags);
      if (tags === null) continue;
      result.push({ value: second.value, steps: [...first.steps, ...second.steps], tags });
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
