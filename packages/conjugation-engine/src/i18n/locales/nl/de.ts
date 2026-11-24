/**
 * Dutch explanations of the German rules, for Dutch-speaking secondary-school pupils: one sentence each in plain Dutch
 * with the school-grammar terms they know, naming the forms through {before}, {after} and the rule's params. An
 * apostrophe directly before a placeholder is written twice.
 */
import type { germanRules } from '../../../languages/de/rules.js';

export const de = {} as const satisfies Record<keyof typeof germanRules, string>;
