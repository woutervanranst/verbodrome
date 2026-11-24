import type { Catalog } from '../../catalog.js';
import { core } from './core.js';
import { fr } from './fr.js';

/** The Dutch catalog: the core messages plus each built-in language's messages (spread them in here as languages migrate). */
export const nl: Catalog = { ...core, ...fr };
