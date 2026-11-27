import { allPersons, moodEntries, noPersons } from '../../core/pack.js';
import type { CatalogueEntry, SubjectSlot } from '../../core/pack.js';

/** The imperative has tu, noi and voi, and the courtesy forms for Lei and Loro (taken from the present subjunctive). */
const imperativeSlots = ['2sg', '3sg.formal', '1pl', '2pl', '3pl.formal'] as const;

/** The 22 moods and tenses, in the order of a grammar's paradigm table, with their Italian names. */
export const italianCatalogue: readonly CatalogueEntry[] = Object.freeze([
  ...moodEntries('indicative', 'Indicativo', allPersons, [
    ['present', 'Presente'], ['perfect', 'Passato prossimo'], ['imperfect', 'Imperfetto'], ['pluperfect', 'Trapassato prossimo'],
    ['simple_past', 'Passato remoto'], ['past_anterior', 'Trapassato remoto'], ['future', 'Futuro semplice'], ['future_perfect', 'Futuro anteriore'],
  ]),
  ...moodEntries('subjunctive', 'Congiuntivo', allPersons, [
    ['present', 'Presente'], ['past', 'Passato'], ['imperfect', 'Imperfetto'], ['pluperfect', 'Trapassato'],
  ]),
  ...moodEntries('conditional', 'Condizionale', allPersons, [['present', 'Presente'], ['past', 'Passato']]),
  ...moodEntries('imperative', 'Imperativo', noPersons, [['present', 'Presente'], ['negative', 'Negativo']], { slots: imperativeSlots }),
  ...moodEntries('infinitive', 'Infinito', noPersons, [['present', 'Presente'], ['past', 'Passato']]),
  ...moodEntries('participle', 'Participio', noPersons, [['present', 'Presente'], ['past', 'Passato']]),
  ...moodEntries('gerund', 'Gerundio', noPersons, [['present', 'Presente'], ['past', 'Passato']]),
]);

/**
 * The subjects. Lei and Loro address the listener but govern the third person, so they are slots of person 3; they are
 * not default (a query names them). Only lui and lei carry a gender: elsewhere gender shows only in an agreeing
 * participle, which the clause forks (io sono andato / andata).
 */
export const italianSubjects: readonly SubjectSlot[] = Object.freeze([
  { id: '1sg', person: 1, number: 'singular', pronoun: 'io', default: true },
  { id: '2sg', person: 2, number: 'singular', pronoun: 'tu', register: 'informal', default: true },
  { id: '3sg.m', person: 3, number: 'singular', pronoun: 'lui', gender: 'masculine', default: true },
  { id: '3sg.f', person: 3, number: 'singular', pronoun: 'lei', gender: 'feminine', default: true },
  { id: '3sg.formal', person: 3, number: 'singular', pronoun: 'Lei', register: 'formal', default: false },
  { id: '1pl', person: 1, number: 'plural', pronoun: 'noi', default: true },
  { id: '2pl', person: 2, number: 'plural', pronoun: 'voi', register: 'informal', default: true },
  { id: '3pl', person: 3, number: 'plural', pronoun: 'loro', default: true },
  { id: '3pl.formal', person: 3, number: 'plural', pronoun: 'Loro', register: 'formal', default: false },
].map(slot => Object.freeze(slot)) as SubjectSlot[]);
