import { allPersons, moodEntries, noPersons } from '../../core/pack.js';
import type { CatalogueEntry } from '../../core/pack.js';

export const frenchCatalogue: readonly CatalogueEntry[] = Object.freeze([
  ...moodEntries('indicative', 'Indicatif', allPersons, [
    ['present', 'Présent'], ['perfect', 'Passé composé'], ['imperfect', 'Imparfait'],
    ['pluperfect', 'Plus-que-parfait'], ['simple_past', 'Passé simple'],
    ['past_anterior', 'Passé antérieur'], ['future', 'Futur simple'],
    ['future_perfect', 'Futur antérieur'], ['near_future', 'Futur proche'], ['recent_past', 'Passé récent'],
  ]),
  ...moodEntries('subjunctive', 'Subjonctif', allPersons, [
    ['present', 'Présent'], ['past', 'Passé'], ['imperfect', 'Imparfait'], ['pluperfect', 'Plus-que-parfait'],
  ]),
  ...moodEntries('conditional', 'Conditionnel', allPersons, [['present', 'Présent'], ['past', 'Passé']]),
  ...moodEntries('imperative', 'Impératif', [[2, 'singular'], [1, 'plural'], [2, 'plural']], [['present', 'Présent'], ['past', 'Passé']]),
  ...moodEntries('infinitive', 'Infinitif', noPersons, [['present', 'Présent'], ['past', 'Passé']]),
  ...moodEntries('participle', 'Participe', noPersons, [
    ['present', 'Présent'], ['past', 'Passé'], ['perfect', 'Passé (forme composée)'],
  ]),
  ...moodEntries('gerund', 'Gérondif', noPersons, [['present', 'Présent'], ['past', 'Passé']]),
]);
