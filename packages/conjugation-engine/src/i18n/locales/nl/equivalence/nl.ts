/** De Nederlandse teksten van de noten bij de Nederlandse tijden (`src/equivalence/nl.ts`). */
import type { nlNotes as english } from '../../en/equivalence/nl.js';

export const nlNotes = {
  'eq.nl.present-future': 'In het Nederlands drukt de onvoltooid tegenwoordige tijd vaak de toekomst uit, meestal met een tijdsaanduiding (ik kom morgen).',
  'eq.nl.perfect.spoken-past': 'In het Nederlands is de voltooid tegenwoordige tijd in gesprekken de gewone tijd voor afgeronde gebeurtenissen; de onvoltooid verleden tijd gebruik je vooral om te vertellen.',
  'eq.nl.gerund-as-participle': 'Het Nederlands heeft geen gerundium; het tegenwoordig deelwoord neemt die plaats in, vaak na al (al lopend).',
  'eq.nl.compound-inf-perfect': 'Het Nederlands heeft geen aparte voltooide infinitief in de catalogus: vorm die met het voltooid deelwoord plus hebben of zijn (gewerkt hebben).',
  'eq.nl.compound-part-perfect': 'Het Nederlands heeft geen samengesteld deelwoord in de catalogus: vorm het met het voltooid deelwoord plus het deelwoord van hebben of zijn (gewerkt hebbende).',
  'eq.nl.compound-gerund-perfect': 'Het Nederlands heeft geen voltooid gerundium: gebruik na met het voltooid deelwoord en te hebben of te zijn (na gewerkt te hebben).',
  'eq.nl.compound-imp-perfect': 'Het Nederlands heeft geen voltooide gebiedende wijs in de catalogus: vorm die met het voltooid deelwoord plus de gebiedende wijs van hebben of zijn (heb gewerkt).',
} as const satisfies Record<keyof typeof english, string>;
