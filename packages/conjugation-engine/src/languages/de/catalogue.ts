import { allPersons, moodEntries, noPersons } from '../../core/pack.js';
import type { CatalogueEntry, SubjectSlot } from '../../core/pack.js';

/**
 * The German tenses with the labels of the Duden conjugation tables. Konjunktiv I and II are one mood, `subjunctive`,
 * built in two calls so that each entry carries its own mood label; the würde-forms are the `conditional`. The
 * imperative lists its subject slots (du, wir, ihr, Sie), so the third person plural slot, which shares the person and
 * number of Sie, never reaches it.
 */
export const germanCatalogue: readonly CatalogueEntry[] = Object.freeze([
  ...moodEntries('indicative', 'Indikativ', allPersons, [
    ['present', 'Präsens'], ['past', 'Präteritum'], ['perfect', 'Perfekt'], ['pluperfect', 'Plusquamperfekt'],
    ['future', 'Futur I'], ['future_perfect', 'Futur II'],
  ]),
  ...moodEntries('subjunctive', 'Konjunktiv I', allPersons, [
    ['present', 'Präsens'], ['perfect', 'Perfekt'], ['future', 'Futur I'], ['future_perfect', 'Futur II'],
  ]),
  ...moodEntries('subjunctive', 'Konjunktiv II', allPersons, [['past', 'Präteritum'], ['pluperfect', 'Plusquamperfekt']]),
  ...moodEntries('conditional', 'Konjunktiv II (würde-Form)', allPersons, [['present', 'Futur I'], ['past', 'Futur II']]),
  ...moodEntries('imperative', 'Imperativ', [[2, 'singular'], [1, 'plural'], [2, 'plural'], [3, 'plural']], [['present', 'Präsens']], {
    slots: ['2sg', '1pl', '2pl', '2.formal'],
  }),
  ...moodEntries('infinitive', 'Infinitiv', noPersons, [['present', 'Präsens'], ['perfect', 'Perfekt']]),
  ...moodEntries('participle', 'Partizip', noPersons, [['present', 'Partizip I'], ['past', 'Partizip II']]),
]);

/**
 * The subjects, in output order within one person and number. sie (feminine) and es take the verb form of er and are
 * returned only on request; Sie addresses one or several people and always conjugates as a third person plural.
 */
export const germanSubjects: readonly SubjectSlot[] = Object.freeze([
  { id: '1sg', person: 1, number: 'singular', pronoun: 'ich', default: true },
  { id: '2sg', person: 2, number: 'singular', pronoun: 'du', register: 'informal', default: true },
  { id: '3sg', person: 3, number: 'singular', pronoun: 'er', gender: 'masculine', default: true },
  { id: '3sg.f', person: 3, number: 'singular', pronoun: 'sie', gender: 'feminine', default: false },
  { id: '3sg.n', person: 3, number: 'singular', pronoun: 'es', gender: 'neuter', default: false },
  { id: '1pl', person: 1, number: 'plural', pronoun: 'wir', default: true },
  { id: '2pl', person: 2, number: 'plural', pronoun: 'ihr', register: 'informal', default: true },
  { id: '3pl', person: 3, number: 'plural', pronoun: 'sie', default: true },
  { id: '2.formal', person: 3, number: 'plural', pronoun: 'Sie', register: 'formal', default: false },
] satisfies SubjectSlot[]);
