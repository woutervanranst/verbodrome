/**
 * The works the Dutch rules cite and the citation of every rule: grammar from the e-ANS (Algemene Nederlandse
 * Spraakkunst, Instituut voor de Nederlandse Taal), spelling from the Taalunie's Leidraad on woordenlijst.org. Every URL
 * below was opened and checked to be the section named in its locator.
 */
import type { Citation, Work } from '../../core/sources.js';
import type { dutchRules } from './rules.js';

export const dutchWorks = {
  'e-ans': {
    id: 'e-ans', title: 'Algemene Nederlandse Spraakkunst (e-ANS)', author: 'Instituut voor de Nederlandse Taal',
    url: 'https://e-ans.ivdnt.org/',
  },
  leidraad: { id: 'leidraad', title: 'Leidraad, Woordenlijst Nederlandse Taal', author: 'Taalunie', url: 'https://woordenlijst.org/leidraad' },
  woordenlijst: { id: 'woordenlijst', title: 'Woordenlijst Nederlandse Taal', author: 'Taalunie', url: 'https://woordenlijst.org/' },
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
/** The closed lists of separable particles. */
const particles = [
  eAns('12.3.4.1 Samenkoppelingen met een partikel corresponderend met een adpositie', 'topic-16531765141029304'),
  eAns('12.3.4.2 Samenkoppelingen met andere partikels', 'topic-19059235502398710'),
];
/** The particles that e-ANS also names as unstressed prefixes. */
const dualPrefixes = [
  eAns('12.3.2.1.5 Het voorvoegsel door-', 'topic-16131019751135534'),
  eAns('12.3.2.1.6 Het voorvoegsel mis-', 'topic-10736514965277082'),
  eAns('12.3.2.1.7 Het voorvoegsel om-', 'topic-19065733157797735'),
  eAns('12.3.2.1.8 Het voorvoegsel onder-', 'topic-15955547301744486'),
  eAns('12.3.2.1.9 Het voorvoegsel over-', 'topic-12953722418251955'),
  eAns('12.3.4.1.1 Samenkoppelingen met aan (aanbídden)', 'topic-14781130780092856'),
  eAns('12.3.4.1.2 Samenkoppelingen met achter (achtervólgen)', 'topic-12837118759979596'),
  eAns('12.3.4.1.22 Samenkoppelingen met voor (voorkómen)', 'topic-16418926026532594'),
  eAns('12.3.4.2.8 Samenkoppelingen met weer (weerspréken)', 'topic-17227872050078844'),
  eAns('12.3.2.1 Prefigering, tabel 2 (vol-dóen)', 'topic-14428052248902267'),
];
/** The counts behind the default reading of each dual prefix (`dualPrefixCounts` in `lexicon.ts`). */
const dualCounts: Citation = {
  work: 'woordenlijst', locator: 'lexicon service, verbs listed per prefix, separable or not (counted 2026-11-25)',
  url: 'https://woordenlijst.org/',
};

export const dutchCitations = {
  'nl.classify.irregular': [irregularVerbs, irregularB],
  'nl.classify.half-irregular': eAns('2.3.5.2 Half onregelmatige werkwoorden', 'ans02030502lingtopic'),
  'nl.classify.listed-weak': regularVerbs,
  'nl.classify.loan': leidraad('12.2'),
  'nl.classify.separable': pastParticiple,
  'nl.classify.inseparable': pastParticiple,
  'nl.classify.default-weak': [regularVerbs, irregularVerbs],
  'nl.classify.default-syllables': [leidraad('11.1'), leidraad('2.1')],
  'nl.classify.default-hebben': auxiliaryChoice,
  'nl.classify.default-unprefixed': pastParticiple,
  'nl.classify.assume-separable': [...particles, leidraad('7.2')],
  'nl.classify.assume-dual-separable': [...dualPrefixes, dualCounts, ...particles],
  'nl.classify.assume-inseparable': [...dualPrefixes, dualCounts, pastParticiple],
  'nl.stem.drop-en': [leidraad('11.1'), stem],
  'nl.stem.undouble-consonant': [leidraad('11.1'), leidraad('2.2')],
  'nl.stem.lengthen-vowel': [leidraad('2.1'), leidraad('2.2'), leidraad('11.1')],
  'nl.stem.unstressed-e': [leidraad('11.1'), stem],
  'nl.stem.devoice': [leidraad('11.1'), stem],
  'nl.stem.lexical': [stem, irregularB, leidraad('12.2')],
  'nl.avail.impersonal': impersonal,
  'nl.avail.singular-only': impersonal,
  'nl.avail.no-imperative': eAns('2.3.2.5 De imperatief (gebiedende wijs)', 'ans02030205lingtopic'),
  'nl.avail.no-compound': eAns('2.3.6.6 Zullen', 'ans02030606lingtopic'),
  'nl.cell.lexical': [irregularB, irregularVerbs],
  'nl.cell.d-dropped': eAns('2.3.2.8.ii De vorming van het presens, opmerking (hou, rij, snij)', 'ans0203020802lingtopic'),
  'nl.cell.spoken-infinitive': eAns('2.3.6.5 Zijn (wezen)', 'ans02030605lingtopic'),
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
  'nl.part.weak-no-ending': [leidraad('11.4'), leidraad('11.1')],
  'nl.part.strong': [leidraad('11.6'), irregularVerbs],
  'nl.part.ge-blocked': pastParticiple,
  'nl.part.ge-prefix': [pastParticiple, leidraad('11.4')],
  'nl.part.ge-diaeresis': leidraad('7.2'),
  'nl.orth.dental-kofschip': [leidraad('11.3'), leidraad('11.4')],
  'nl.orth.dental-voiceless': [leidraad('11.3'), leidraad('12.2')],
  'nl.orth.dental-given': leidraad('12.2'),
  'nl.orth.double-a': [leidraad('2.1'), leidraad('11.2')],
  'nl.periphrasis.perfect': [tenses, auxiliaryChoice],
  'nl.periphrasis.pluperfect': [tenses, auxiliaryChoice],
  'nl.periphrasis.future': tenses,
  'nl.periphrasis.future-perfect': [tenses, auxiliaryChoice],
  'nl.periphrasis.conditional': tenses,
  'nl.periphrasis.conditional-perfect': [tenses, auxiliaryChoice],
  'nl.clause.subject': regularVerbs,
  'nl.clause.impersonal-subject': impersonal,
  'nl.clause.inversion': [leidraad('11.2'), regularVerbs],
  'nl.clause.reflexive': eAns('2.2.4 Wederkerende en niet-wederkerende werkwoorden', 'ans020204lingtopic'),
  'nl.clause.particle-final': [pastParticiple, eAns('21.3.4.3.2 Het eerste deel van een scheidbaar werkwoord', 'ans2103040302lingtopic')],
  'nl.clause.particle-attached': [pastParticiple, eAns('12.3.4 Samenkoppeling', 'topic-11721585681016076')],
  'nl.clause.prefix-attached': [eAns('12.3.2.1 Prefigering', 'topic-14428052248902267'), pastParticiple],
} as const satisfies Record<keyof typeof dutchRules, Citation | readonly Citation[]>;
