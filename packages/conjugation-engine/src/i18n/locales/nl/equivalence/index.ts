import { deNotes } from './de.js';
import { enNotes } from './en.js';
import { esNotes } from './es.js';
import { frNotes } from './fr.js';
import { itNotes } from './it.js';
import { laNotes } from './la.js';
import { nlNotes } from './nl.js';
import { sharedNotes } from './shared.js';

/** The Dutch notes of the tense equivalence, merged into the Dutch catalog; each file has exactly the English keys. */
export const equivalence = { ...sharedNotes, ...frNotes, ...nlNotes, ...deNotes, ...esNotes, ...itNotes, ...laNotes, ...enNotes };
