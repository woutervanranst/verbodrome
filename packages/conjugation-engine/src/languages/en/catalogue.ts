import { allPersons, moodEntries, noPersons } from '../../core/pack.js';
import type { CatalogueEntry, SubjectSlot } from '../../core/pack.js';

/**
 * The 24 English catalogue entries (design §2), with the labels Dutch and Flemish school English uses: "Present simple",
 * "Present continuous". The imperative has the 2nd person singular and plural (the plain form) and the 1st person plural
 * (let's + the plain form).
 */
export const englishCatalogue: readonly CatalogueEntry[] = Object.freeze([
  ...moodEntries('indicative', 'Indicative', allPersons, [
    ['present', 'Present simple'], ['past', 'Past simple'], ['perfect', 'Present perfect'], ['pluperfect', 'Past perfect'],
    ['future', 'Future simple'], ['future_perfect', 'Future perfect'],
    ['present_progressive', 'Present continuous'], ['past_progressive', 'Past continuous'],
    ['perfect_progressive', 'Present perfect continuous'], ['pluperfect_progressive', 'Past perfect continuous'],
    ['future_progressive', 'Future continuous'], ['future_perfect_progressive', 'Future perfect continuous'],
  ]),
  ...moodEntries('conditional', 'Conditional', allPersons, [
    ['present', 'Conditional simple'], ['past', 'Conditional perfect'],
    ['present_progressive', 'Conditional continuous'], ['past_progressive', 'Conditional perfect continuous'],
  ]),
  ...moodEntries('subjunctive', 'Subjunctive', allPersons, [
    ['present', 'Present'], ['past', 'Past'], ['perfect', 'Perfect'], ['pluperfect', 'Pluperfect'],
  ]),
  ...moodEntries('imperative', 'Imperative', [[2, 'singular'], [1, 'plural'], [2, 'plural']], [['present', 'Imperative']]),
  ...moodEntries('infinitive', 'Infinitive', noPersons, [['present', 'To-infinitive']]),
  ...moodEntries('participle', 'Participle', noPersons, [['present', '-ing form'], ['past', 'Past participle']]),
]);

/** I, you, he, we, you, they by default; she and it only when a query names them (their gender is for information). */
export const englishSubjects: readonly SubjectSlot[] = Object.freeze([
  { id: '1sg', person: 1, number: 'singular', pronoun: 'I', default: true },
  { id: '2sg', person: 2, number: 'singular', pronoun: 'you', default: true },
  { id: '3sg.m', person: 3, number: 'singular', pronoun: 'he', gender: 'masculine', default: true },
  { id: '3sg.f', person: 3, number: 'singular', pronoun: 'she', gender: 'feminine', default: false },
  { id: '3sg.n', person: 3, number: 'singular', pronoun: 'it', gender: 'neuter', default: false },
  { id: '1pl', person: 1, number: 'plural', pronoun: 'we', default: true },
  { id: '2pl', person: 2, number: 'plural', pronoun: 'you', default: true },
  { id: '3pl', person: 3, number: 'plural', pronoun: 'they', default: true },
]);
