import type { locales } from './locales/index.js';

/**
 * Message sources by key. A pack's rule id is its own key; the core catalog holds `term.<kind>.<id>`,
 * `explain.summary.<subject>` and `explain.section.<name>`. Sources use the ICU subset of `formatMessage`.
 */
export type Catalog = Readonly<Record<string, string>>;

/** The locales of the default engine: the keys of the locale index. */
export type Locale = keyof typeof locales;
