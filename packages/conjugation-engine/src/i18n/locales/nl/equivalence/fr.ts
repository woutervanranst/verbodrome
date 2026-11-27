/** De Nederlandse teksten van de noten bij de Franse tijden (`src/equivalence/fr.ts`). */
import type { frNotes as english } from '../../en/equivalence/fr.js';

export const frNotes = {
  'eq.fr.perfect.spoken-past': 'In gesproken taal is de passé composé de gewone tijd voor afgeronde gebeurtenissen; de passé simple komt alleen in geschreven taal voor.',
  'eq.fr.si-imperfect': 'Na si zet het Frans het onwerkelijke in de imparfait (si j’étais), en na que gebruikt het de subjonctif présent (je voulais qu’il vienne); de subjonctif imparfait is alleen nog literair.',
  'eq.fr.si-pluperfect': 'Na si zet het Frans het onwerkelijke verleden in de plus-que-parfait (si j’avais su), en na que gebruikt het de subjonctif passé (je regrettais qu’il soit parti); de subjonctif plus-que-parfait is alleen nog literair.',
} as const satisfies Record<keyof typeof english, string>;
