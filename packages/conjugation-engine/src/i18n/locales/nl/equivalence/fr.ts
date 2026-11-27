/** De Nederlandse teksten van de noten bij de Franse tijden (`src/equivalence/fr.ts`). */
import type { frNotes as english } from '../../en/equivalence/fr.js';

export const frNotes = {
  'eq.fr.perfect.spoken-past': 'In gesproken taal is de passé composé de gewone tijd voor afgeronde gebeurtenissen; de passé simple komt alleen in geschreven taal voor.',
  'eq.fr.si-imperfect': 'Na si zet het Frans het onwerkelijke in de imparfait (si j’étais), en na que gebruikt het de subjonctif présent (je voulais qu’il vienne); de subjonctif imparfait is alleen nog literair.',
  'eq.fr.si-pluperfect': 'Na si zet het Frans het onwerkelijke verleden in de plus-que-parfait (si j’avais su), en na que gebruikt het de subjonctif passé (je regrettais qu’il soit parti); de subjonctif plus-que-parfait is alleen nog literair.',
  'eq.fr.near-future': 'Aller plus infinitief is de nabije toekomst: andere talen gebruiken hun toekomende tijd, een eigen constructie met gaan (I am going to eat, voy a comer) of de tegenwoordige tijd met een woord als zo meteen (ich esse gleich).',
  'eq.fr.recent-past': 'Venir de plus infinitief is het recente verleden: andere talen gebruiken hun voltooide tijd met een woord als net (I have just eaten, ich habe gerade gegessen, ho appena mangiato) of een eigen constructie (acabo de comer).',
} as const satisfies Record<keyof typeof english, string>;
