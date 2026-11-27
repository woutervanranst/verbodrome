import type { Catalog } from '../../catalog.js';
import { core } from './core.js';
import { fr } from './fr.js';
import { dutch } from './nl.js';
import { english } from './en.js';
import { de } from './de.js';
import { es } from './es.js';

/** The English catalog: the core messages plus each built-in language's messages (spread them in here as languages migrate). */
export const en: Catalog = { ...core, ...dutch, ...fr, ...english, ...de, ...es };
