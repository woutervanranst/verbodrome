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
  '7.2': 'hoe klinkerbotsing te vermijden?',
  '11.1': 'zoek de stam',
  '11.2': 'tegenwoordige tijd',
  '11.3': 'verleden tijd van regelmatige werkwoorden',
  '11.4': 'voltooid deelwoord van regelmatige werkwoorden',
  '11.5': 'verleden tijd van onregelmatige werkwoorden',
  '11.6': 'voltooid deelwoord van onregelmatige werkwoorden',
  '11.7': 'gebiedende wijs',
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
/** hebben, kunnen, mogen, willen, zijn and zullen, form by form. */
const irregularB = eAns('2.3.6 De onregelmatige werkwoorden-b', 'ans020306lingtopic');
/** Persons and impersonal verbs: het as the only subject of weather verbs such as vriezen. */
const impersonal = eAns('2.2.5 Persoonlijke en onpersoonlijke werkwoorden', 'ans020205lingtopic');
/** The tenses: two main forms and the compound tenses with hebben or zijn and zullen. */
const tenses = eAns('2.3.2.8.i De hoofdvormen en de werkwoordstijden: inleiding', 'ans0203020801lingtopic');
const auxiliaryChoice = eAns('2.3.2.8.iv De keuze tussen hebben en zijn', 'ans0203020804lingtopic');
/** The regular paradigms, with the subject pronouns and the form before je. */
const regularVerbs = eAns('2.3.3 Overzicht van de vervoeging van de regelmatige werkwoorden', 'ans020303lingtopic');

export const dutchCitations = {
  'nl.classify.lexicon': irregularVerbs,
  'nl.classify.loan': leidraad('12.2'),
  'nl.classify.separable': pastParticiple,
  'nl.classify.inseparable': pastParticiple,
  'nl.classify.default-weak': [regularVerbs, irregularVerbs],
  'nl.classify.default-syllables': [leidraad('11.1'), leidraad('2.1')],
  'nl.classify.default-hebben': auxiliaryChoice,
  'nl.classify.default-unprefixed': pastParticiple,
  'nl.stem.drop-en': [leidraad('11.1'), stem],
  'nl.stem.undouble-consonant': [leidraad('11.1'), leidraad('2.2')],
  'nl.stem.lengthen-vowel': [leidraad('2.1'), leidraad('11.1')],
  'nl.stem.unstressed-e': [leidraad('11.1'), stem],
  'nl.stem.devoice': [leidraad('11.1'), stem],
  'nl.stem.lexical': [stem, irregularB, leidraad('12.2')],
  'nl.avail.impersonal': impersonal,
  'nl.avail.singular-only': impersonal,
  'nl.avail.no-imperative': eAns('2.3.2.5 De imperatief (gebiedende wijs)', 'ans02030205lingtopic'),
  'nl.avail.no-compound': eAns('2.3.6.6 Zullen', 'ans02030606lingtopic'),
  'nl.cell.lexical': [irregularB, irregularVerbs],
  'nl.cell.formal': eAns('2.3.6.1 Hebben', 'ans02030601lingtopic'),
  'nl.end.present': [leidraad('11.2'), eAns('2.3.2.8.ii De vorming van het presens', 'ans0203020802lingtopic')],
  'nl.end.present-t-drop': leidraad('11.2'),
  'nl.end.inversion-t-drop': [leidraad('11.2'), regularVerbs],
  'nl.end.past-weak': [leidraad('11.3'), eAns('2.3.2.8.iii De vorming van het imperfectum', 'ans0203020803lingtopic')],
  'nl.end.past-strong': [leidraad('11.5'), irregularVerbs],
  'nl.end.past-plural-strong': leidraad('11.5'),
  'nl.imp.stem': [leidraad('11.7'), eAns('2.3.2.5 De imperatief (gebiedende wijs)', 'ans02030205lingtopic')],
  'nl.part.present': eAns('2.3.2.6 Het tegenwoordig deelwoord', 'ans02030206lingtopic'),
  'nl.part.weak': [leidraad('11.4'), pastParticiple],
  'nl.part.strong': [leidraad('11.6'), irregularVerbs],
  'nl.part.ge-blocked': pastParticiple,
  'nl.part.ge-prefix': [pastParticiple, leidraad('11.4')],
  'nl.part.ge-diaeresis': leidraad('7.2'),
  'nl.orth.dental-kofschip': [leidraad('11.3'), leidraad('11.4')],
  'nl.orth.double-a': [leidraad('2.1'), leidraad('11.2')],
  'nl.periphrasis.perfect': [tenses, auxiliaryChoice],
  'nl.periphrasis.pluperfect': [tenses, auxiliaryChoice],
  'nl.periphrasis.future': tenses,
  'nl.periphrasis.future-perfect': [tenses, auxiliaryChoice],
  'nl.periphrasis.conditional': tenses,
  'nl.periphrasis.conditional-perfect': [tenses, auxiliaryChoice],
  'nl.clause.subject': regularVerbs,
  'nl.clause.inversion': [leidraad('11.2'), regularVerbs],
  'nl.clause.reflexive': eAns('2.2.4 Wederkerende en niet-wederkerende werkwoorden', 'ans020204lingtopic'),
  'nl.clause.particle-final': [pastParticiple, eAns('21.3.4.3.2 Het eerste deel van een scheidbaar werkwoord', 'ans2103040302lingtopic')],
  'nl.clause.particle-attached': pastParticiple,
} as const satisfies Record<keyof typeof dutchRules, Citation | readonly Citation[]>;
