import type { LanguagePack } from '../core/pack.js';
import { frenchPack } from './fr/pack.js';
import { dutchPack } from './nl/pack.js';
import { italianPack } from './it/pack.js';
import type { Language } from './registry.js';

/** Every built-in language pack, keyed by language code. */
export const packs = { fr: frenchPack, nl: dutchPack, it: italianPack } satisfies { [L in Language]: LanguagePack<L> };
