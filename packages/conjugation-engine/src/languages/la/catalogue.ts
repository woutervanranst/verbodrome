import type { Gender, GrammaticalNumber, Person } from '../../core/grammar.js';
import { allPersons, moodEntries, noPersons } from '../../core/pack.js';
import type { CatalogueEntry, SubjectSlot } from '../../core/pack.js';

const bothVoices = Object.freeze(['active', 'passive'] as const);

/** Entries 1–15 (finite moods and the infinitive) exist in both voices, active first. */
const voiced = (entries: readonly CatalogueEntry[]): CatalogueEntry[] =>
  entries.map(entry => Object.freeze({ ...entry, voices: bothVoices }));

/**
 * The 21 entries of the Latin catalogue (A&G §§153–155; GD §2.1), labelled with the school terms written without
 * macrons. The present imperative has the second persons; the future imperative the second and third persons.
 */
export const latinCatalogue: readonly CatalogueEntry[] = Object.freeze([
  ...voiced(moodEntries('indicative', 'Indicativus', allPersons, [
    ['present', 'Praesens'], ['imperfect', 'Imperfectum'], ['future', 'Futurum'], ['perfect', 'Perfectum'],
    ['pluperfect', 'Plusquamperfectum'], ['future_perfect', 'Futurum exactum'],
  ])),
  ...voiced(moodEntries('subjunctive', 'Coniunctivus', allPersons, [
    ['present', 'Praesens'], ['imperfect', 'Imperfectum'], ['perfect', 'Perfectum'], ['pluperfect', 'Plusquamperfectum'],
  ])),
  ...voiced(moodEntries('imperative', 'Imperativus', [[2, 'singular'], [2, 'plural']], [['present', 'Praesens']])),
  ...voiced(moodEntries('imperative', 'Imperativus', [[2, 'singular'], [3, 'singular'], [2, 'plural'], [3, 'plural']], [['future', 'Futurum']])),
  ...voiced(moodEntries('infinitive', 'Infinitivus', noPersons, [['present', 'Praesens'], ['perfect', 'Perfectum'], ['future', 'Futurum']])),
  ...moodEntries('participle', 'Participium', noPersons, [
    ['present', 'Praesens'], ['perfect', 'Perfectum'], ['future', 'Futurum'], ['gerundive', 'Gerundivum'],
  ]),
  ...moodEntries('gerund', 'Gerundium', noPersons, [['present', 'Gerundium']]),
  ...moodEntries('supine', 'Supinum', noPersons, [['present', 'Supinum']]),
]);

const genderSuffixes: readonly (readonly [string, Gender])[] = [['m', 'masculine'], ['f', 'feminine'], ['n', 'neuter']];

function slotsOf(person: Person, number: GrammaticalNumber): SubjectSlot[] {
  const id = `${person}${number === 'singular' ? 'sg' : 'pl'}`;
  return [
    { id, person, number, pronoun: null, default: true },
    ...genderSuffixes.map(([suffix, gender]): SubjectSlot => ({ id: `${id}.${suffix}`, person, number, pronoun: null, gender, default: false })),
  ];
}

/**
 * Latin drops the subject pronoun, so no slot has one (GD §2.2). Each person and number has an ungendered default slot
 * and, on request, a masculine, feminine and neuter slot: the gender shows only in compound forms (amātus / amāta /
 * amātum sum).
 */
export const latinSubjects: readonly SubjectSlot[] = Object.freeze(allPersons.flatMap(([person, number]) => slotsOf(person, number)).map(slot => Object.freeze(slot)));
