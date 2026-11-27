import { deNotes } from './de.js';
import { esNotes } from './es.js';
import { frNotes } from './fr.js';
import { itNotes } from './it.js';
import { laNotes } from './la.js';
import { nlNotes } from './nl.js';
import { sharedNotes } from './shared.js';

/**
 * The English notes of the tense equivalence (`src/equivalence/`), merged into the English catalog. Their keys are the
 * type `NoteKey`: a map or override that names a note this object lacks does not compile.
 */
export const equivalence = { ...sharedNotes, ...frNotes, ...nlNotes, ...deNotes, ...esNotes, ...itNotes, ...laNotes };
