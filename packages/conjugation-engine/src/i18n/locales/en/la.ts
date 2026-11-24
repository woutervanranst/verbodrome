import type { latinRules } from '../../../languages/la/rules.js';

/** English messages of the Latin rules: one sentence each, written for a learner. */
export const la = {} as const satisfies Record<keyof typeof latinRules, string>;
