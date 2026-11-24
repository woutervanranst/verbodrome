import { createEngine } from './core/engine.js';
import { packs } from './languages/index.js';
import type { Language } from './types.js';

/** The engine behind the package-level functions, built from every built-in pack. */
export const engine = createEngine(packs);

/** The languages the package conjugates. */
export const languages = engine.languages as readonly Language[];
