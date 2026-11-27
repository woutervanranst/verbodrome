import { deNotes } from './de.js';
import { frNotes } from './fr.js';
import { nlNotes } from './nl.js';
import { sharedNotes } from './shared.js';

/** The Dutch notes of the tense equivalence, merged into the Dutch catalog; each file has exactly the English keys. */
export const equivalence = { ...sharedNotes, ...frNotes, ...nlNotes, ...deNotes };
