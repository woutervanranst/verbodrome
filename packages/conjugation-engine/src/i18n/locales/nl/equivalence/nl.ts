/** De Nederlandse teksten van de noten bij de Nederlandse tijden (`src/equivalence/nl.ts`). */
import type { nlNotes as english } from '../../en/equivalence/nl.js';

export const nlNotes = {
  'eq.nl.present-future': 'In het Nederlands drukt de onvoltooid tegenwoordige tijd vaak de toekomst uit, meestal met een tijdsaanduiding (ik kom morgen).',
  'eq.nl.perfect.spoken-past': 'In het Nederlands is de voltooid tegenwoordige tijd in gesprekken de gewone tijd voor afgeronde gebeurtenissen; de onvoltooid verleden tijd gebruik je vooral om te vertellen.',
  'eq.nl.gerund-as-participle': 'Het Nederlands heeft geen gerundium; het tegenwoordig deelwoord neemt de plaats ervan in, vaak na al (al lopend).',
  'eq.nl.compound-inf-perfect': 'De voltooide infinitief is in het Nederlands een samengestelde vorm: het voltooid deelwoord met hebben of zijn (gewerkt hebben).',
  'eq.nl.compound-part-perfect': 'Het voltooid tegenwoordig deelwoord is in het Nederlands een samengestelde vorm: het voltooid deelwoord met hebbende of zijnde (gewerkt hebbende).',
  'eq.nl.compound-gerund-perfect': 'Het Nederlands heeft geen voltooid gerundium: gebruik na met het voltooid deelwoord en te hebben of te zijn (na gewerkt te hebben).',
  'eq.nl.compound-imp-perfect': 'Een voltooide gebiedende wijs is in het Nederlands een samengestelde vorm: het voltooid deelwoord met de gebiedende wijs van hebben of zijn (heb gewerkt).',
} as const satisfies Record<keyof typeof english, string>;
