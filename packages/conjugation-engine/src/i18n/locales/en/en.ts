/**
 * The English pack's explanation messages in English, for a learner of English. Exported as `english`, not `en`: `en`
 * is the English locale catalog's own name.
 */
import type { englishRules } from '../../../languages/en/rules.js';

export const english = {} as const satisfies Record<keyof typeof englishRules, string>;
