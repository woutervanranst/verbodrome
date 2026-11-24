import { allPersons, moodEntries, noPersons } from '../../core/pack.js';
import type { CatalogueEntry } from '../../core/pack.js';

export const dutchCatalogue: readonly CatalogueEntry[] = Object.freeze([
  ...moodEntries('indicative', 'Aantonende wijs', allPersons, [
    ['present', 'Onvoltooid tegenwoordige tijd'], ['past', 'Onvoltooid verleden tijd'],
    ['future', 'Onvoltooid tegenwoordige toekomende tijd'], ['perfect', 'Voltooid tegenwoordige tijd'],
    ['pluperfect', 'Voltooid verleden tijd'], ['future_perfect', 'Voltooid tegenwoordige toekomende tijd'],
  ]),
  ...moodEntries('conditional', 'Voorwaardelijke wijs', allPersons, [
    ['present', 'Onvoltooid verleden toekomende tijd'], ['past', 'Voltooid verleden toekomende tijd'],
  ]),
  ...moodEntries('imperative', 'Gebiedende wijs', [[2, 'singular'], [2, 'plural']], [['present', 'Tegenwoordig']]),
  ...moodEntries('infinitive', 'Onbepaalde wijs', noPersons, [['present', 'Tegenwoordig']]),
  ...moodEntries('participle', 'Deelwoord', noPersons, [['present', 'Tegenwoordig deelwoord'], ['past', 'Voltooid deelwoord']]),
]);
