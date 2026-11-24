/**
 * The English pack's explanation messages in Dutch, for Dutch-speaking pupils learning English: plain Dutch, the school
 * terms they know, the English tense names their textbooks use. Exported as `english`, like the English locale's.
 */
import type { englishRules } from '../../../languages/en/rules.js';

export const english = {} as const satisfies Record<keyof typeof englishRules, string>;
