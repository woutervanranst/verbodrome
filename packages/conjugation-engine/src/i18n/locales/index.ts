import type { Locale } from '../catalog.js';
import { en } from './en/index.js';
import { nl } from './nl/index.js';

/** The built-in catalogs by locale; adding a locale is one directory here and one line below. */
export const locales = { en, nl };

export function isLocale(value: string): value is Locale {
  return Object.hasOwn(locales, value);
}
