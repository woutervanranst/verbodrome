/**
 * English explanations of the German rules, for a learner: one sentence each, naming the forms through {before},
 * {after} and the rule's params. An apostrophe directly before a placeholder is written twice.
 */
import type { germanRules } from '../../../languages/de/rules.js';

export const de = {} as const satisfies Record<keyof typeof germanRules, string>;
