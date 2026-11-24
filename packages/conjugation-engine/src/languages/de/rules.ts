import { defineRules } from '../../core/derivation.js';

/** Every rule the German pack records, by stage; the ids and params follow the German grammar design (GD §4). */
export const germanRules = defineRules({});

export type GermanRuleId = keyof typeof germanRules;
