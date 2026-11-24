/**
 * The works the Dutch rules cite and the citation of every rule: grammar from the e-ANS (Algemene Nederlandse
 * Spraakkunst, Instituut voor de Nederlandse Taal), spelling from the Taalunie's Leidraad on woordenlijst.org. Every URL
 * below was opened and checked to be the section named in its locator.
 */
import type { Citation, Work } from '../../core/sources.js';
import type { dutchRules } from './rule-table.js';

export const dutchWorks = {
  'e-ans': {
    id: 'e-ans', title: 'Algemene Nederlandse Spraakkunst (e-ANS)', author: 'Instituut voor de Nederlandse Taal',
    url: 'https://e-ans.ivdnt.org/',
  },
  leidraad: { id: 'leidraad', title: 'Leidraad, Woordenlijst Nederlandse Taal', author: 'Taalunie', url: 'https://woordenlijst.org/leidraad' },
} as const satisfies Record<string, Work>;

const eAns = (locator: string, pid: string): Citation => ({ work: 'e-ans', locator, url: `https://e-ans.ivdnt.org/topics/pid/${pid}` });
/** The Leidraad sections cited, by number. */
const leidraadSections = {
  '2.1': 'verenkeling van lange klinkers in een open lettergreep',
  '2.2': 'verdubbeling van medeklinkers op het eind van een gesloten lettergreep',
  '11.1': 'zoek de stam',
  '12.2': 'vervoeging van Engelse werkwoorden',
} as const;
const leidraad = (section: keyof typeof leidraadSections): Citation => ({
  work: 'leidraad', locator: `${section} ${leidraadSections[section]}`,
  url: `https://woordenlijst.org/zoeken/leidraad/${section.replace('.', '/')}.html`,
});

/** The principal parts of irregular verbs, half (bakken: gebakken) and wholly irregular (lopen: liep, gelopen). */
const irregularVerbs = eAns('2.3.5.1 Lijsten van onregelmatige werkwoorden: inleiding', 'ans02030501lingtopic');
/** ge- in the past participle: placed after a separable part, left out after an unstressed prefix. */
const pastParticiple = eAns('2.3.2.7 Het voltooid deelwoord, punt 2', 'ans02030207lingtopic');
/** The stem: the infinitive without its ending as pronounced, with its underlying final consonant. */
const stem = eAns('2.3.2.3 De stam', 'ans02030203lingtopic');

export const dutchCitations = {
  'nl.classify.lexicon': irregularVerbs,
  'nl.classify.loan': leidraad('12.2'),
  'nl.classify.separable': pastParticiple,
  'nl.classify.inseparable': pastParticiple,
  'nl.classify.default-weak': [eAns('2.3.3 Overzicht van de vervoeging van de regelmatige werkwoorden', 'ans020303lingtopic'), irregularVerbs],
  'nl.classify.default-syllables': [leidraad('11.1'), leidraad('2.1')],
  'nl.classify.default-hebben': eAns('2.3.2.8.iv De keuze tussen hebben en zijn', 'ans0203020804lingtopic'),
  'nl.classify.default-unprefixed': pastParticiple,
  'nl.stem.drop-en': [leidraad('11.1'), stem],
  'nl.stem.undouble-consonant': [leidraad('11.1'), leidraad('2.2')],
  'nl.stem.lengthen-vowel': [leidraad('2.1'), leidraad('11.1')],
  'nl.stem.unstressed-e': [leidraad('11.1'), stem],
  'nl.stem.devoice': [leidraad('11.1'), stem],
  'nl.stem.lexical': [stem, eAns('2.3.6 De onregelmatige werkwoorden-b', 'ans020306lingtopic'), leidraad('12.2')],
} as const satisfies Record<keyof typeof dutchRules, Citation | readonly Citation[]>;
