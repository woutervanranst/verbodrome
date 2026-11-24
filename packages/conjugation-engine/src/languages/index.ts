import type { LanguagePack } from '../core/pack.js';
import { frenchPack } from './fr/pack.js';
import { dutchPack } from './nl/pack.js';
import { spanishPack } from './es/pack.js';
import type { Language } from './registry.js';

/** Every built-in language pack, keyed by language code. */
export const packs = { fr: frenchPack, nl: dutchPack, es: spanishPack } satisfies { [L in Language]: LanguagePack<L> };
