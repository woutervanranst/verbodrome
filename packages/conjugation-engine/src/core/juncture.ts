import { step } from './derivation.js';
import type { RuleInfo, StepParam } from './derivation.js';
import { mergeMarks, mergeTags, one, withMarks } from './fork.js';
import type { Fork, Outcome } from './fork.js';

/** The stem/ending boundary where spelling rules operate. */
export interface Juncture { readonly stem: string; readonly ending: string }

export interface JunctureRule<C> {
  readonly info: RuleInfo;
  /** null = rule does not apply. More than one outcome = spelling variants (tagged). */
  apply(juncture: Juncture, context: C): Fork<Juncture> | null;
  /** Step params; defaults to {}. */
  describe?(before: Juncture, after: Juncture, context: C): Readonly<Record<string, StepParam>>;
}

/** Applies rules in order to every live branch; records one step per rule that changed stem + ending. */
export function applyJunctureRules<C>(rules: readonly JunctureRule<C>[], start: Juncture, context: C): Fork<Juncture> {
  let branches: Fork<Juncture> = one(start);
  for (const rule of rules) {
    branches = applyRule(rule, branches, context);
  }
  return branches;
}

function applyRule<C>(rule: JunctureRule<C>, branches: Fork<Juncture>, context: C): Fork<Juncture> {
  const next: Outcome<Juncture>[] = [];
  for (const branch of branches) {
    const results = rule.apply(branch.value, context);
    if (results === null) {
      next.push(branch);
      continue;
    }
    for (const result of results) {
      const tags = mergeTags(branch.tags, result.tags);
      if (tags === null) continue;
      const before = branch.value.stem + branch.value.ending;
      const after = result.value.stem + result.value.ending;
      const recorded = before === after
        ? []
        : [step(rule.info, before, after, rule.describe?.(branch.value, result.value, context))];
      next.push({ value: result.value, steps: [...branch.steps, ...result.steps, ...recorded], tags, ...withMarks(mergeMarks(branch.marks, result.marks)) });
    }
  }
  return next;
}
