import type { Catalog } from '../../catalog.js';
import { core } from './core.js';

/** The English catalog: the core messages plus each built-in language's messages (spread them in here as languages migrate). */
export const en: Catalog = { ...core };
