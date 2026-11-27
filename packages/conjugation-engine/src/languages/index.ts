import type { LanguagePack } from '../core/pack.js';
import { frenchPack } from './fr/pack.js';
import { dutchPack } from './nl/pack.js';
import { englishPack } from './en/pack.js';
import { germanPack } from './de/pack.js';
import { spanishPack } from './es/pack.js';
import { italianPack } from './it/pack.js';
import { latinPack } from './la/pack.js';
import type { Language } from './registry.js';

/** Every built-in language pack, keyed by language code. */
export const packs = { fr: frenchPack, nl: dutchPack, en: englishPack, de: germanPack, es: spanishPack, it: italianPack, la: latinPack } satisfies { [L in Language]: LanguagePack<L> };
