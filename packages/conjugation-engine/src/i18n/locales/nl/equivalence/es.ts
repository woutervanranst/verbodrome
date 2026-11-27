/** De Nederlandse teksten van de noten bij de Spaanse tijden (`src/equivalence/es.ts`). */
import type { esNotes as english } from '../../en/equivalence/es.js';

export const esNotes = {
  'eq.es.perfect-spain': 'In Spanje drukt het pretérito perfecto compuesto een recent verleden uit; in een groot deel van Latijns-Amerika gebruikt men daarvoor de enkelvoudige verleden tijd.',
  'eq.es.future-conjecture': 'De toekomende tijd drukt ook een vermoeden uit (será verdad).',
  'eq.es.subjunctive-pluperfect-conditional': 'De vorm op -ra van deze tijd wordt ook in voorwaardelijke zinnen gebruikt (hubiera ido).',
  'eq.es.gerund-as-participle': 'Het Spaans heeft geen tegenwoordig deelwoord: het gerundio neemt zijn plaats in, en het samengestelde gerundio die van een samengesteld deelwoord (entró riendo; habiendo llegado, se sentó); een bijvoeglijk deelwoord wordt een betrekkelijke bijzin (el niño que ríe).',
} as const satisfies Record<keyof typeof english, string>;
