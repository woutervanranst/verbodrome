/** De Nederlandse teksten van de noten bij de Franse tijden (`src/equivalence/fr.ts`). */
import type { frNotes as english } from '../../en/equivalence/fr.js';

export const frNotes = {
  'eq.fr.perfect.spoken-past': 'In gesproken taal is de passé composé de gewone tijd voor afgeronde gebeurtenissen; de passé simple komt alleen in geschreven taal voor.',
} as const satisfies Record<keyof typeof english, string>;
