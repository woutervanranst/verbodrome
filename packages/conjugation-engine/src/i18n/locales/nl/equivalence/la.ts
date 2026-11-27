/** De Nederlandse teksten van de noten bij de Latijnse tijden (`src/equivalence/la.ts`). */
import type { laNotes as english } from '../../en/equivalence/la.js';

export const laNotes = {
  'eq.la.perfect-both': 'Het Latijnse perfectum dekt zowel de voltooid tegenwoordige tijd (ik heb bemind) als de verleden tijd (ik beminde).',
  'eq.la.subjunctive-unreal': 'In een irreële voorwaarde staat de coniunctivus; deze tijd vervangt dan de voorwaardelijke wijs van andere talen.',
  'eq.la.imperative-future': 'De imperativus futuri wordt gebruikt voor formele en juridische bevelen.',
  'eq.la.deponent-participle': 'Het participium perfectum van een deponens heeft een actieve betekenis.',
  'eq.la.infinitive-future': 'Het Latijn heeft een infinitivus futuri (amaturum esse); andere talen gebruiken daarvoor een bijzin.',
  'eq.la.participle-future': 'Het participium futuri (amaturus) betekent op het punt staan iets te doen; andere talen gebruiken een omschrijving.',
  'eq.la.gerundive': 'Het gerundivum (amandus) betekent dat iets gedaan moet of kan worden; andere talen gebruiken een omschrijving.',
  'eq.la.supine': 'Het supinum drukt een doel uit na werkwoorden van beweging (venit spectatum); andere talen gebruiken een infinitiefconstructie (hij kwam om te kijken).',
} as const satisfies Record<keyof typeof english, string>;
