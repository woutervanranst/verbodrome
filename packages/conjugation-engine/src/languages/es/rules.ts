import { defineRules } from '../../core/derivation.js';

/**
 * Every rule the Spanish pack records, by stage. Ids are `es.<stage>.<name>`; each has an English and a Dutch message
 * (`src/i18n/locales/{en,nl}/es.ts`) and a citation (`sources.ts`).
 */
export const spanishRules = defineRules({});

export type SpanishRuleId = keyof typeof spanishRules;
