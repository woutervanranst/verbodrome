import { allPersons, moodEntries, noPersons } from '../../core/pack.js';
import type { CatalogueEntry, SubjectSlot } from '../../core/pack.js';
import type { FrenchSubject } from './spec.js';

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
  // The imperative has the tu, nous and vous slots (its persons stay listed for consumers that read them).
  ...moodEntries('imperative', 'Impératif', [[2, 'singular'], [1, 'plural'], [2, 'plural']], [['present', 'Présent'], ['past', 'Passé']], {
    slots: ['2sg', '1pl', '2pl'],
  }),
  ...moodEntries('infinitive', 'Infinitif', noPersons, [['present', 'Présent'], ['past', 'Passé']]),
  ...moodEntries('participle', 'Participe', noPersons, [
    ['present', 'Présent'], ['past', 'Passé'], ['perfect', 'Passé (forme composée)'],
  ]),
  ...moodEntries('gerund', 'Gérondif', noPersons, [['present', 'Présent'], ['past', 'Passé']]),
]);

/**
 * The six French subject slots (GD §2), all default and all without a gender: a form shows the subject's gender itself
 * (il/elle, je suis allé/allée) through the clause's `subjectGenders`.
 */
export const frenchSubjects: readonly (SubjectSlot & { readonly id: FrenchSubject })[] = Object.freeze([
  { id: '1sg', person: 1, number: 'singular', pronoun: 'je', default: true },
  { id: '2sg', person: 2, number: 'singular', pronoun: 'tu', default: true },
  { id: '3sg', person: 3, number: 'singular', pronoun: 'il', default: true },
  { id: '1pl', person: 1, number: 'plural', pronoun: 'nous', default: true },
  { id: '2pl', person: 2, number: 'plural', pronoun: 'vous', default: true },
  { id: '3pl', person: 3, number: 'plural', pronoun: 'ils', default: true },
] as const);

