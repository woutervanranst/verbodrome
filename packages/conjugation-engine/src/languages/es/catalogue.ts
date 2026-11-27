import { allPersons, moodEntries, noPersons } from '../../core/pack.js';
import type { CatalogueEntry, SubjectSlot } from '../../core/pack.js';
import type { GrammaticalNumber, Person } from '../../core/grammar.js';

/** The persons of a command: tú, usted (a third person), nosotros, vosotros, ustedes (a third person). */
const commandPersons: readonly (readonly [Person, GrammaticalNumber])[] = [[2, 'singular'], [3, 'singular'], [1, 'plural'], [2, 'plural'], [3, 'plural']];

/**
 * The command slots: each expands at its own person and number, so él/ella/ellos/ellas have no imperative (their
 * jussive `que venga` is a subjunctive) and usted/ustedes are commands of the third person.
 */
const commandSlots = ['2sg', '2sg.formal', '1pl', '1pl.f', '2pl', '2pl.f', '2pl.formal'] as const;

/** The NGLE's tense names (§4.3); the conditional is a mood of its own, as in the French and Dutch catalogues. */
export const spanishCatalogue: readonly CatalogueEntry[] = Object.freeze([
  ...moodEntries('indicative', 'Indicativo', allPersons, [
    ['present', 'Presente'], ['perfect', 'Pretérito perfecto compuesto'], ['imperfect', 'Pretérito imperfecto'],
    ['pluperfect', 'Pretérito pluscuamperfecto'], ['simple_past', 'Pretérito perfecto simple'], ['past_anterior', 'Pretérito anterior'],
    ['future', 'Futuro simple'], ['future_perfect', 'Futuro compuesto'],
  ]),
  ...moodEntries('conditional', 'Condicional', allPersons, [['present', 'Condicional simple'], ['past', 'Condicional compuesto']]),
  ...moodEntries('subjunctive', 'Subjuntivo', allPersons, [
    ['present', 'Presente'], ['past', 'Pretérito perfecto compuesto'], ['imperfect', 'Pretérito imperfecto'],
    ['pluperfect', 'Pretérito pluscuamperfecto'], ['future', 'Futuro simple'], ['future_perfect', 'Futuro compuesto'],
  ]),
  ...moodEntries('imperative', 'Imperativo', commandPersons, [['present', 'Afirmativo'], ['negative', 'Negativo']], { slots: commandSlots }),
  ...moodEntries('infinitive', 'Infinitivo', noPersons, [['present', 'Simple'], ['past', 'Compuesto']]),
  ...moodEntries('gerund', 'Gerundio', noPersons, [['present', 'Simple'], ['past', 'Compuesto']]),
  ...moodEntries('participle', 'Participio', noPersons, [['past', 'Participio']]),
]);

/**
 * The subjects: the masculine (or genderless) slots by default; ella, nosotras, vosotras, ellas, usted and ustedes on
 * request. usted and ustedes address the listener but conjugate as third persons.
 */
export const spanishSubjects: readonly SubjectSlot[] = Object.freeze([
  { id: '1sg', person: 1, number: 'singular', pronoun: 'yo', default: true },
  { id: '2sg', person: 2, number: 'singular', pronoun: 'tú', register: 'informal', default: true },
  { id: '3sg', person: 3, number: 'singular', pronoun: 'él', gender: 'masculine', default: true },
  { id: '3sg.f', person: 3, number: 'singular', pronoun: 'ella', gender: 'feminine', default: false },
  { id: '2sg.formal', person: 3, number: 'singular', pronoun: 'usted', register: 'formal', default: false },
  { id: '1pl', person: 1, number: 'plural', pronoun: 'nosotros', gender: 'masculine', default: true },
  { id: '1pl.f', person: 1, number: 'plural', pronoun: 'nosotras', gender: 'feminine', default: false },
  { id: '2pl', person: 2, number: 'plural', pronoun: 'vosotros', gender: 'masculine', register: 'informal', default: true },
  { id: '2pl.f', person: 2, number: 'plural', pronoun: 'vosotras', gender: 'feminine', register: 'informal', default: false },
  { id: '3pl', person: 3, number: 'plural', pronoun: 'ellos', gender: 'masculine', default: true },
  { id: '3pl.f', person: 3, number: 'plural', pronoun: 'ellas', gender: 'feminine', default: false },
  { id: '2pl.formal', person: 3, number: 'plural', pronoun: 'ustedes', register: 'formal', default: false },
] satisfies SubjectSlot[]);
