import type { Catalog } from '../../catalog.js';
import { core } from './core.js';
import { fr } from './fr.js';
import { dutch } from './nl.js';
import { english } from './en.js';
import { de } from './de.js';
import { es } from './es.js';
import { it } from './it.js';
import { la } from './la.js';
import { equivalence } from './equivalence/index.js';

/** The Dutch catalog: the core messages plus each built-in language's messages (spread them in here as languages migrate), and the tense equivalence notes. */
export const nl: Catalog = { ...core, ...dutch, ...fr, ...english, ...de, ...es, ...it, ...la, ...equivalence };
