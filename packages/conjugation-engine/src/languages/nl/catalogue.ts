import { allPersons, defaultSubjectsFor, moodEntries, noPersons } from '../../core/pack.js';
import type { CatalogueEntry, SubjectSlot } from '../../core/pack.js';
import type { DutchSubject } from './spec.js';

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

/**
 * The Dutch subjects, in output order within each person and number. A slot id is the person and number (`1sg` ...
 * `3pl`) for the default subject, with the pronoun added for the others (`2sg.u`, `3sg.het`, `3pl.ze`). `u` conjugates
 * as a second person singular. The gender of `hij`, `zij`, `ze` and `het` is for the clause to read: Dutch targets
 * carry no gender.
 */
export const dutchSubjects: readonly SubjectSlot[] = Object.freeze([
  { id: '1sg', person: 1, number: 'singular', pronoun: 'ik', default: true },
  { id: '2sg', person: 2, number: 'singular', pronoun: 'jij', default: true },
  { id: '2sg.je', person: 2, number: 'singular', pronoun: 'je', default: false },
  { id: '2sg.u', person: 2, number: 'singular', pronoun: 'u', register: 'formal', default: false },
  { id: '3sg', person: 3, number: 'singular', pronoun: 'hij', gender: 'masculine', default: true },
  { id: '3sg.zij', person: 3, number: 'singular', pronoun: 'zij', gender: 'feminine', default: false },
  { id: '3sg.ze', person: 3, number: 'singular', pronoun: 'ze', gender: 'feminine', default: false },
  { id: '3sg.het', person: 3, number: 'singular', pronoun: 'het', gender: 'neuter', default: false },
  { id: '1pl', person: 1, number: 'plural', pronoun: 'wij', default: true },
  { id: '1pl.we', person: 1, number: 'plural', pronoun: 'we', default: false },
  { id: '2pl', person: 2, number: 'plural', pronoun: 'jullie', default: true },
  { id: '3pl', person: 3, number: 'plural', pronoun: 'zij', default: true },
  { id: '3pl.ze', person: 3, number: 'plural', pronoun: 'ze', default: false },
] satisfies (SubjectSlot & { readonly id: DutchSubject })[]);

/**
 * The slots a query expands: with the `pronoun` option, every slot with that pronoun (`zij` and `ze` are a singular and
 * a plural subject, `u` and `het` one slot each), narrowed to the `subject` option if that is given too; otherwise the
 * core's default (the slot `subject` names, else the default slots).
 */
export function dutchSubjectsFor(query: Readonly<Record<string, unknown>>): readonly SubjectSlot[] {
  const { pronoun, subject } = query;
  if (pronoun === undefined) return defaultSubjectsFor(dutchSubjects, query);
  return dutchSubjects.filter(slot => slot.pronoun === pronoun && (subject === undefined || slot.id === subject));
}
