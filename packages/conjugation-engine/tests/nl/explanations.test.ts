/**
 * The truth of Dutch explanations: the full English and Dutch text of every step, in order and with the part it belongs
 * to, for everyday forms, analyses and unavailable targets. Together they use every Dutch rule, and they pin each case a
 * review found false (noted per case: C1-C6, I1-I4 and M1-M7 of the Task 8 review), and the two behaviour changes of the
 * switch (split particle verbs, verbs with two readings). A wording change is a visible diff here. The characterization snapshot stores no steps, so nothing else compares explanations.
 */
import { describe, expect, it } from 'vitest';
import type { Explainable } from '../../src/i18n/explain.js';
import { dutchRules } from '../../src/languages/nl/rules.js';
import { engine } from '../../src/default-engine.js';

interface Pinned {
  readonly verb: string;
  readonly query: Readonly<Record<string, unknown>>;
  /** The form with this text, the verb's analysis, or the first unavailable target. */
  readonly form?: string;
  readonly analysis?: true;
  readonly unavailable?: true;
  readonly en: readonly string[];
  readonly nl: readonly string[];
}

const pinned: readonly Pinned[] = [
  {
    // the four assumptions for an unlisted verb
    verb: 'zorpen', query: {}, analysis: true,
    en: [
      'The verb: An unlisted Dutch verb defaults to the weak native model.',
      'The verb: Ordinary open/closed syllables are inferred; use a stem or stress hint when pronunciation differs.',
      'The verb: An unlisted verb defaults to hebben; lexical meaning may require zijn.',
      'The verb: Separability is not inferred by stripping an unknown written prefix.',
    ],
    nl: [
      'Het werkwoord: zorpen staat niet in de lijst met werkwoorden, dus we nemen aan dat het een zwak werkwoord is.',
      'Het werkwoord: De stam van zorpen schrijven we volgens de regels voor open en gesloten lettergrepen; spreek je het anders uit, geef dan zelf de stam of de klemtoon op.',
      "Het werkwoord: We nemen aan dat zorpen in de voltooide tijden het hulpwerkwoord 'hebben' krijgt, al vraagt de betekenis soms om 'zijn'.",
      'Het werkwoord: zorpen staat niet in de lijst en we lezen er geen scheidbaar deel of voorvoegsel in, dus behandelen we het als een werkwoord zonder voorvoegsel. Aan de spelling zie je niet altijd of een werkwoord scheidbaar is.',
    ],
  },
  {
    // an irregular verb (C5: not 'strong')
    verb: 'lopen', query: {}, analysis: true,
    en: [
      'The verb: lopen is an irregular verb: its past tense, liep, is in the verb list.',
    ],
    nl: [
      'Het werkwoord: lopen is een onregelmatig werkwoord: de verleden tijd, liep, staat in de werkwoordenlijst.',
    ],
  },
  {
    // a half-irregular verb
    verb: 'bakken', query: {}, analysis: true,
    en: [
      'The verb: bakken is half irregular: its past tense is regular, its past participle gebakken is in the verb list.',
    ],
    nl: [
      'Het werkwoord: bakken is half onregelmatig: de verleden tijd is regelmatig, het voltooid deelwoord gebakken staat in de werkwoordenlijst.',
    ],
  },
  {
    // a weak verb listed for its auxiliary
    verb: 'wandelen', query: {}, analysis: true,
    en: [
      'The verb: wandelen is a weak verb; the verb list records which auxiliary it takes.',
    ],
    nl: [
      'Het werkwoord: wandelen is een zwak werkwoord; de werkwoordenlijst legt vast welk hulpwerkwoord het krijgt.',
    ],
  },
  {
    // a separable verb
    verb: 'opstaan', query: {}, analysis: true,
    en: [
      'The verb: opstaan is a separable verb: op carries the stress and can stand apart from the verb.',
      'The verb: staan is an irregular verb: its past tense, stond, is in the verb list.',
    ],
    nl: [
      'Het werkwoord: opstaan is een scheidbaar werkwoord: op krijgt de klemtoon en kan los van het werkwoord staan.',
      'Het werkwoord: staan is een onregelmatig werkwoord: de verleden tijd, stond, staat in de werkwoordenlijst.',
    ],
  },
  {
    // an inseparable derivative
    verb: 'begrijpen', query: {}, analysis: true,
    en: [
      'The verb: begrijpen starts with the unstressed prefix be-, which never splits off, so the past participle gets no ge-.',
      'The verb: grijpen is an irregular verb: its past tense, greep, is in the verb list.',
    ],
    nl: [
      'Het werkwoord: begrijpen begint met het onbeklemtoonde voorvoegsel be-, dat nooit loskomt, dus het voltooid deelwoord krijgt geen ge-.',
      'Het werkwoord: grijpen is een onregelmatig werkwoord: de verleden tijd, greep, staat in de werkwoordenlijst.',
    ],
  },
  {
    // a loan
    verb: 'downloaden', query: {}, analysis: true,
    en: [
      'The verb: downloaden is a verb borrowed from English, so its stem is the one given for it, not one formed by the Dutch stem rules.',
    ],
    nl: [
      'Het werkwoord: downloaden is een werkwoord dat uit het Engels geleend is, dus de stam is de stam die ervoor is opgegeven en wordt niet met de Nederlandse regels gevormd.',
    ],
  },
  {
    // the stem alone
    verb: 'werken', query: { mood: 'indicative', tense: 'present', person: 1, number: 'singular' }, form: 'ik werk',
    en: [
      'werk: Take -en off werken: werk-.',
      'werk: 1st person singular present: the stem alone, werk.',
      'The whole form: The subject is ik.',
    ],
    nl: [
      'werk: Haal -en van werken af: werk-.',
      'werk: Tegenwoordige tijd, 1e persoon enkelvoud: alleen de stam, werk.',
      'De hele vorm: Het onderwerp is ik.',
    ],
  },
  {
    // stem + t
    verb: 'werken', query: { mood: 'indicative', tense: 'present', person: 2, number: 'singular' }, form: 'jij werkt',
    en: [
      'werkt: Take -en off werken: werk-.',
      'werkt: 2nd person singular present: stem + t, werkt.',
      'The whole form: The subject is jij.',
    ],
    nl: [
      'werkt: Haal -en van werken af: werk-.',
      'werkt: Tegenwoordige tijd, 2e persoon enkelvoud: stam + t, werkt.',
      'De hele vorm: Het onderwerp is jij.',
    ],
  },
  {
    // werk jij: the -t falls away
    verb: 'werken', query: { mood: 'indicative', tense: 'present', person: 2, number: 'singular', inversion: true }, form: 'werk jij',
    en: [
      'werk: Take -en off werken: werk-.',
      'werk: When jij or je comes after the verb, the -t of the 2nd person falls away: werk.',
      'The whole form: The subject is jij.',
      'The whole form: The finite verb comes before the subject jij.',
    ],
    nl: [
      'werk: Haal -en van werken af: werk-.',
      'werk: Als jij of je achter de persoonsvorm staat, valt de -t van de 2e persoon weg: werk.',
      'De hele vorm: Het onderwerp is jij.',
      'De hele vorm: De persoonsvorm staat vóór het onderwerp jij.',
    ],
  },
  {
    // the plural is the infinitive
    verb: 'werken', query: { mood: 'indicative', tense: 'present', person: 1, number: 'plural' }, form: 'wij werken',
    en: [
      'werken: 1st person plural present: the plural is the infinitive, werken.',
      'The whole form: The subject is wij.',
    ],
    nl: [
      'werken: Tegenwoordige tijd, 1e persoon meervoud: het meervoud is het hele werkwoord, werken.',
      'De hele vorm: Het onderwerp is wij.',
    ],
  },
  {
    // no second t
    verb: 'zetten', query: { mood: 'indicative', tense: 'present', person: 3, number: 'singular' }, form: 'hij zet',
    en: [
      'zet: Take -en off zetten: zett-.',
      'zet: A word does not end in a double consonant, so zett- becomes zet-.',
      'zet: The stem zet- already ends in t, so no t is added: zet.',
      'The whole form: The subject is hij.',
    ],
    nl: [
      'zet: Haal -en van zetten af: zett-.',
      'zet: Aan het eind van een woord schrijf je geen dubbele medeklinker, dus zett- wordt zet-.',
      'zet: De stam zet- eindigt al op t, dus er komt geen t bij: zet.',
      'De hele vorm: Het onderwerp is hij.',
    ],
  },
  {
    // zet jij: no t to drop (C1)
    verb: 'zetten', query: { mood: 'indicative', tense: 'present', person: 2, number: 'singular', inversion: true }, form: 'zet jij',
    en: [
      'zet: Take -en off zetten: zett-.',
      'zet: A word does not end in a double consonant, so zett- becomes zet-.',
      'zet: The stem zet- already ends in t, so no t is added: zet.',
      'The whole form: The subject is jij.',
      'The whole form: The finite verb comes before the subject jij.',
    ],
    nl: [
      'zet: Haal -en van zetten af: zett-.',
      'zet: Aan het eind van een woord schrijf je geen dubbele medeklinker, dus zett- wordt zet-.',
      'zet: De stam zet- eindigt al op t, dus er komt geen t bij: zet.',
      'De hele vorm: Het onderwerp is jij.',
      'De hele vorm: De persoonsvorm staat vóór het onderwerp jij.',
    ],
  },
  {
    // gaat: the long a written aa (C4)
    verb: 'gaan', query: { mood: 'indicative', tense: 'present', person: 3, number: 'singular' }, form: 'hij gaat',
    en: [
      'gaat: The stem of gaan is ga-, as given for this verb.',
      'gaat: 3rd person singular present: stem + t, gaat.',
      'gaat: In the closed syllable the long a is written aa: gaat.',
      'The whole form: The subject is hij.',
    ],
    nl: [
      'gaat: De stam van gaan is ga-, zoals die voor dit werkwoord is opgegeven.',
      'gaat: Tegenwoordige tijd, 3e persoon enkelvoud: stam + t, gaat.',
      'gaat: In de gesloten lettergreep schrijf je de lange a als aa: gaat.',
      'De hele vorm: Het onderwerp is hij.',
    ],
  },
  {
    // ga jij: the -t of gaat falls away
    verb: 'gaan', query: { mood: 'indicative', tense: 'present', person: 2, number: 'singular', inversion: true }, form: 'ga jij',
    en: [
      'ga: The stem of gaan is ga-, as given for this verb.',
      'ga: When jij or je comes after the verb, the -t of the 2nd person falls away: ga.',
      'The whole form: The subject is jij.',
      'The whole form: The finite verb comes before the subject jij.',
    ],
    nl: [
      'ga: De stam van gaan is ga-, zoals die voor dit werkwoord is opgegeven.',
      'ga: Als jij of je achter de persoonsvorm staat, valt de -t van de 2e persoon weg: ga.',
      'De hele vorm: Het onderwerp is jij.',
      'De hele vorm: De persoonsvorm staat vóór het onderwerp jij.',
    ],
  },
  {
    // kun jij: the -t of kunt falls away
    verb: 'kunnen', query: { mood: 'indicative', tense: 'present', person: 2, number: 'singular', inversion: true }, form: 'kun jij',
    en: [
      'kun: kunnen has the listed form kunt here.',
      'kun: When jij or je comes after the verb, the -t of the 2nd person falls away: kun.',
      'The whole form: The subject is jij.',
      'The whole form: The finite verb comes before the subject jij.',
    ],
    nl: [
      'kun: kunnen heeft hier de vaste vorm kunt.',
      'kun: Als jij of je achter de persoonsvorm staat, valt de -t van de 2e persoon weg: kun.',
      'De hele vorm: Het onderwerp is jij.',
      'De hele vorm: De persoonsvorm staat vóór het onderwerp jij.',
    ],
  },
  {
    // kan jij: nothing falls away (C1)
    verb: 'kunnen', query: { mood: 'indicative', tense: 'present', person: 2, number: 'singular', inversion: true }, form: 'kan jij',
    en: [
      'kan: kunnen has the listed form kan here.',
      'The whole form: The subject is jij.',
      'The whole form: The finite verb comes before the subject jij.',
    ],
    nl: [
      'kan: kunnen heeft hier de vaste vorm kan.',
      'De hele vorm: Het onderwerp is jij.',
      'De hele vorm: De persoonsvorm staat vóór het onderwerp jij.',
    ],
  },
  {
    // hou jij: the dropped d, no -t step (C1)
    verb: 'houden', query: { mood: 'indicative', tense: 'present', person: 2, number: 'singular', inversion: true }, form: 'hou jij',
    en: [
      'hou: After a vowel, the d at the end of the stem houd- is often left out: hou.',
      'The whole form: The subject is jij.',
      'The whole form: The finite verb comes before the subject jij.',
    ],
    nl: [
      'hou: Na een klinker valt de d aan het eind van de stam houd- vaak weg: hou.',
      'De hele vorm: Het onderwerp is jij.',
      'De hele vorm: De persoonsvorm staat vóór het onderwerp jij.',
    ],
  },
  {
    // ik hou: the dropped d
    verb: 'houden', query: { mood: 'indicative', tense: 'present', person: 1, number: 'singular' }, form: 'ik hou',
    en: [
      'hou: After a vowel, the d at the end of the stem houd- is often left out: hou.',
      'The whole form: The subject is ik.',
    ],
    nl: [
      'hou: Na een klinker valt de d aan het eind van de stam houd- vaak weg: hou.',
      'De hele vorm: Het onderwerp is ik.',
    ],
  },
  {
    // u heeft: the formal form
    verb: 'hebben', query: { mood: 'indicative', tense: 'present', person: 2, number: 'singular', pronoun: 'u' }, form: 'u heeft',
    en: [
      'heeft: With u, hebben also has the form heeft.',
      'The whole form: The subject is u.',
    ],
    nl: [
      'heeft: Met u als onderwerp heeft hebben ook de vorm heeft.',
      'De hele vorm: Het onderwerp is u.',
    ],
  },
  {
    // a listed whole form
    verb: 'zijn', query: { mood: 'indicative', tense: 'present', person: 1, number: 'singular' }, form: 'ik ben',
    en: [
      'ben: zijn has the listed form ben here.',
      'The whole form: The subject is ik.',
    ],
    nl: [
      'ben: zijn heeft hier de vaste vorm ben.',
      'De hele vorm: Het onderwerp is ik.',
    ],
  },
  {
    // an unstressed last syllable
    verb: 'wandelen', query: { mood: 'indicative', tense: 'present', person: 1, number: 'singular' }, form: 'ik wandel',
    en: [
      'wandel: Take -en off wandelen: wandel-.',
      'wandel: The last syllable of wandel- is unstressed, so its vowel is not written double: the stem stays wandel-.',
      'wandel: 1st person singular present: the stem alone, wandel.',
      'The whole form: The subject is ik.',
    ],
    nl: [
      'wandel: Haal -en van wandelen af: wandel-.',
      'wandel: De laatste lettergreep van wandel- heeft geen klemtoon, dus de klinker schrijf je niet dubbel: de stam blijft wandel-.',
      'wandel: Tegenwoordige tijd, 1e persoon enkelvoud: alleen de stam, wandel.',
      'De hele vorm: Het onderwerp is ik.',
    ],
  },
  {
    // werkte: 't kofschip
    verb: 'werken', query: { mood: 'indicative', tense: 'past', person: 1, number: 'singular' }, form: 'ik werkte',
    en: [
      'werkte: Take -en off werken: werk-.',
      'werkte: Weak verb: the past tense is the stem + te: werkte.',
      "werkte: k is one of the sounds of 't kofschip (t, k, f, s, ch, p), so the ending starts with t: werkte.",
      'The whole form: The subject is ik.',
    ],
    nl: [
      'werkte: Haal -en van werken af: werk-.',
      'werkte: Zwak werkwoord: de verleden tijd is de stam + te: werkte.',
      "werkte: k zit in 't kofschip (t, k, f, s, ch, p), dus de uitgang begint met t: werkte.",
      'De hele vorm: Het onderwerp is ik.',
    ],
  },
  {
    // leefde: the pronounced v
    verb: 'leven', query: { mood: 'indicative', tense: 'past', person: 1, number: 'singular' }, form: 'ik leefde',
    en: [
      'leefde: Take -en off leven: lev-.',
      'leefde: A long vowel in a closed syllable is written with two letters, so lev- becomes leev-.',
      'leefde: At the end of a word, v and z are written f and s, so leev- becomes leef-.',
      'leefde: Weak verb: the past tense is the stem + de: leefde.',
      "leefde: v is not one of the sounds of 't kofschip (t, k, f, s, ch, p), so the ending starts with d: leefde.",
      'The whole form: The subject is ik.',
    ],
    nl: [
      'leefde: Haal -en van leven af: lev-.',
      'leefde: Een lange klank in een gesloten lettergreep schrijf je met twee klinkers, dus lev- wordt leev-.',
      'leefde: Aan het eind van een woord schrijf je geen v of z maar f of s, dus leev- wordt leef-.',
      'leefde: Zwak werkwoord: de verleden tijd is de stam + de: leefde.',
      "leefde: v zit niet in 't kofschip (t, k, f, s, ch, p), dus de uitgang begint met d: leefde.",
      'De hele vorm: Het onderwerp is ik.',
    ],
  },
  {
    // reisde: the pronounced z
    verb: 'reizen', query: { mood: 'indicative', tense: 'past', person: 1, number: 'singular' }, form: 'ik reisde',
    en: [
      'reisde: Take -en off reizen: reiz-.',
      'reisde: At the end of a word, v and z are written f and s, so reiz- becomes reis-.',
      'reisde: Weak verb: the past tense is the stem + de: reisde.',
      "reisde: z is not one of the sounds of 't kofschip (t, k, f, s, ch, p), so the ending starts with d: reisde.",
      'The whole form: The subject is ik.',
    ],
    nl: [
      'reisde: Haal -en van reizen af: reiz-.',
      'reisde: Aan het eind van een woord schrijf je geen v of z maar f of s, dus reiz- wordt reis-.',
      'reisde: Zwak werkwoord: de verleden tijd is de stam + de: reisde.',
      "reisde: z zit niet in 't kofschip (t, k, f, s, ch, p), dus de uitgang begint met d: reisde.",
      'De hele vorm: Het onderwerp is ik.',
    ],
  },
  {
    // mixte: x is pronounced ks (C6)
    verb: 'mixen', query: { mood: 'indicative', tense: 'past', person: 1, number: 'singular' }, form: 'ik mixte',
    en: [
      'mixte: Take -en off mixen: mix-.',
      'mixte: Weak verb: the past tense is the stem + te: mixte.',
      "mixte: x is pronounced ks, and s is one of the sounds of 't kofschip, so the ending starts with t: mixte.",
      'The whole form: The subject is ik.',
    ],
    nl: [
      'mixte: Haal -en van mixen af: mix-.',
      'mixte: Zwak werkwoord: de verleden tijd is de stam + te: mixte.',
      "mixte: x spreek je uit als ks, en s zit in 't kofschip, dus de uitgang begint met t: mixte.",
      'De hele vorm: Het onderwerp is ik.',
    ],
  },
  {
    // skatete: a d/t given for a loan (I3)
    verb: 'skaten', query: { mood: 'indicative', tense: 'past', person: 1, number: 'singular' }, form: 'ik skatete',
    en: [
      'skatete: The stem of skaten is skate-, as given for this verb.',
      'skatete: Weak verb: the past tense is the stem + te: skatete.',
      'skatete: For skaten the ending starts with t, as given for this verb: skatete.',
      'The whole form: The subject is ik.',
    ],
    nl: [
      'skatete: De stam van skaten is skate-, zoals die voor dit werkwoord is opgegeven.',
      'skatete: Zwak werkwoord: de verleden tijd is de stam + te: skatete.',
      'skatete: Bij skaten begint de uitgang met t, zoals voor dit werkwoord is opgegeven: skatete.',
      'De hele vorm: Het onderwerp is ik.',
    ],
  },
  {
    // bakten: the plural -ten
    verb: 'bakken', query: { mood: 'indicative', tense: 'past', person: 1, number: 'plural' }, form: 'wij bakten',
    en: [
      'bakten: Take -en off bakken: bakk-.',
      'bakten: A word does not end in a double consonant, so bakk- becomes bak-.',
      'bakten: Weak verb: the past tense is the stem + ten: bakten.',
      "bakten: k is one of the sounds of 't kofschip (t, k, f, s, ch, p), so the ending starts with t: bakten.",
      'The whole form: The subject is wij.',
    ],
    nl: [
      'bakten: Haal -en van bakken af: bakk-.',
      'bakten: Aan het eind van een woord schrijf je geen dubbele medeklinker, dus bakk- wordt bak-.',
      'bakten: Zwak werkwoord: de verleden tijd is de stam + ten: bakten.',
      "bakten: k zit in 't kofschip (t, k, f, s, ch, p), dus de uitgang begint met t: bakten.",
      'De hele vorm: Het onderwerp is wij.',
    ],
  },
  {
    // liep: a listed past tense
    verb: 'lopen', query: { mood: 'indicative', tense: 'past', person: 1, number: 'singular' }, form: 'ik liep',
    en: [
      'liep: lopen has an irregular past tense: liep.',
      'The whole form: The subject is ik.',
    ],
    nl: [
      'liep: lopen heeft een onregelmatige verleden tijd: liep.',
      'De hele vorm: Het onderwerp is ik.',
    ],
  },
  {
    // liepen: the plural from the singular (C3)
    verb: 'lopen', query: { mood: 'indicative', tense: 'past', person: 1, number: 'plural' }, form: 'wij liepen',
    en: [
      'liepen: lopen has an irregular past tense: liep.',
      'liepen: The past tense liep becomes liepen in the plural.',
      'The whole form: The subject is wij.',
    ],
    nl: [
      'liepen: lopen heeft een onregelmatige verleden tijd: liep.',
      'liepen: De verleden tijd liep wordt in het meervoud liepen.',
      'De hele vorm: Het onderwerp is wij.',
    ],
  },
  {
    // gewerkt: ge- and a t after the stem (I2)
    verb: 'werken', query: { mood: 'participle', tense: 'past' }, form: 'gewerkt',
    en: [
      'gewerkt: Take -en off werken: werk-.',
      'gewerkt: Weak verb: in the past participle a t comes after the stem: werkt.',
      "gewerkt: k is one of the sounds of 't kofschip (t, k, f, s, ch, p), so the ending starts with t: werkt.",
      'gewerkt: The past participle starts with ge-: gewerkt.',
    ],
    nl: [
      'gewerkt: Haal -en van werken af: werk-.',
      'gewerkt: Zwak werkwoord: in het voltooid deelwoord komt er een t achter de stam: werkt.',
      "gewerkt: k zit in 't kofschip (t, k, f, s, ch, p), dus de uitgang begint met t: werkt.",
      'gewerkt: Het voltooid deelwoord begint met ge-: gewerkt.',
    ],
  },
  {
    // gezet: no ending and no 't kofschip (C2)
    verb: 'zetten', query: { mood: 'participle', tense: 'past' }, form: 'gezet',
    en: [
      'gezet: Take -en off zetten: zett-.',
      'gezet: A word does not end in a double consonant, so zett- becomes zet-.',
      'gezet: The stem zet- already ends in t, so no extra t is added: zet.',
      'gezet: The past participle starts with ge-: gezet.',
    ],
    nl: [
      'gezet: Haal -en van zetten af: zett-.',
      'gezet: Aan het eind van een woord schrijf je geen dubbele medeklinker, dus zett- wordt zet-.',
      'gezet: De stam zet- eindigt al op t, dus er komt geen t meer bij: zet.',
      'gezet: Het voltooid deelwoord begint met ge-: gezet.',
    ],
  },
  {
    // geantwoord: no ending (C2)
    verb: 'antwoorden', query: { mood: 'participle', tense: 'past' }, form: 'geantwoord',
    en: [
      'geantwoord: Take -en off antwoorden: antwoord-.',
      'geantwoord: The stem antwoord- already ends in d, so no extra d is added: antwoord.',
      'geantwoord: The past participle starts with ge-: geantwoord.',
    ],
    nl: [
      'geantwoord: Haal -en van antwoorden af: antwoord-.',
      'geantwoord: De stam antwoord- eindigt al op d, dus er komt geen d meer bij: antwoord.',
      'geantwoord: Het voltooid deelwoord begint met ge-: geantwoord.',
    ],
  },
  {
    // geëindigd: the diaeresis (M1)
    verb: 'eindigen', query: { mood: 'participle', tense: 'past' }, form: 'geëindigd',
    en: [
      'geëindigd: Take -en off eindigen: eindig-.',
      'geëindigd: Weak verb: in the past participle a d comes after the stem: eindigd.',
      "geëindigd: g is not one of the sounds of 't kofschip (t, k, f, s, ch, p), so the ending starts with d: eindigd.",
      'geëindigd: The past participle starts with ge-, and the e after it gets a diaeresis: geëindigd.',
    ],
    nl: [
      'geëindigd: Haal -en van eindigen af: eindig-.',
      'geëindigd: Zwak werkwoord: in het voltooid deelwoord komt er een d achter de stam: eindigd.',
      "geëindigd: g zit niet in 't kofschip (t, k, f, s, ch, p), dus de uitgang begint met d: eindigd.",
      'geëindigd: Het voltooid deelwoord begint met ge-, en de e erna krijgt een trema: geëindigd.',
    ],
  },
  {
    // gelopen: a listed participle
    verb: 'lopen', query: { mood: 'participle', tense: 'past' }, form: 'gelopen',
    en: [
      'gelopen: lopen has an irregular past participle: gelopen.',
    ],
    nl: [
      'gelopen: lopen heeft een onregelmatig voltooid deelwoord: gelopen.',
    ],
  },
  {
    // begrepen: no ge- after be-, shown whole (I1)
    verb: 'begrijpen', query: { mood: 'participle', tense: 'past' }, form: 'begrepen',
    en: [
      'begrepen: grijpen has an irregular past participle: gegrepen.',
      'begrepen: After the prefix be- the past participle has no ge-: begrepen.',
    ],
    nl: [
      'begrepen: grijpen heeft een onregelmatig voltooid deelwoord: gegrepen.',
      'begrepen: Na het voorvoegsel be- krijgt het voltooid deelwoord geen ge-: begrepen.',
    ],
  },
  {
    // verkocht: the inseparable prefix (I1)
    verb: 'verkopen', query: { mood: 'indicative', tense: 'past', person: 1, number: 'singular' }, form: 'ik verkocht',
    en: [
      'verkocht: kopen has an irregular past tense: kocht.',
      'verkocht: ver- is an inseparable prefix and always stays in front of the verb: kocht becomes verkocht.',
      'The whole form: The subject is ik.',
    ],
    nl: [
      'verkocht: kopen heeft een onregelmatige verleden tijd: kocht.',
      'verkocht: ver- is een onscheidbaar voorvoegsel en staat altijd vast vóór het werkwoord: kocht wordt verkocht.',
      'De hele vorm: Het onderwerp is ik.',
    ],
  },
  {
    // verhuisd: a hinted prefix (I1)
    verb: 'verhuizen', query: { mood: 'participle', tense: 'past', inseparablePrefix: 'ver' }, form: 'verhuisd',
    en: [
      'verhuisd: Take -en off huizen: huiz-.',
      'verhuisd: At the end of a word, v and z are written f and s, so huiz- becomes huis-.',
      'verhuisd: Weak verb: in the past participle a d comes after the stem: huisd.',
      "verhuisd: z is not one of the sounds of 't kofschip (t, k, f, s, ch, p), so the ending starts with d: huisd.",
      'verhuisd: After the prefix ver- the past participle has no ge-: verhuisd.',
    ],
    nl: [
      'verhuisd: Haal -en van huizen af: huiz-.',
      'verhuisd: Aan het eind van een woord schrijf je geen v of z maar f of s, dus huiz- wordt huis-.',
      'verhuisd: Zwak werkwoord: in het voltooid deelwoord komt er een d achter de stam: huisd.',
      "verhuisd: z zit niet in 't kofschip (t, k, f, s, ch, p), dus de uitgang begint met d: huisd.",
      'verhuisd: Na het voorvoegsel ver- krijgt het voltooid deelwoord geen ge-: verhuisd.',
    ],
  },
  {
    // ik verwerk: the inseparable prefix (I1)
    verb: 'verwerken', query: { mood: 'indicative', tense: 'present', person: 1, number: 'singular' }, form: 'ik verwerk',
    en: [
      'verwerk: Take -en off werken: werk-.',
      'verwerk: 1st person singular present: the stem alone, werk.',
      'verwerk: ver- is an inseparable prefix and always stays in front of the verb: werk becomes verwerk.',
      'The whole form: The subject is ik.',
    ],
    nl: [
      'verwerk: Haal -en van werken af: werk-.',
      'verwerk: Tegenwoordige tijd, 1e persoon enkelvoud: alleen de stam, werk.',
      'verwerk: ver- is een onscheidbaar voorvoegsel en staat altijd vast vóór het werkwoord: werk wordt verwerk.',
      'De hele vorm: Het onderwerp is ik.',
    ],
  },
  {
    // ik sta op: the separable part at the end
    verb: 'opstaan', query: { mood: 'indicative', tense: 'present', person: 1, number: 'singular' }, form: 'ik sta op',
    en: [
      'sta: The stem of staan is sta-, as given for this verb.',
      'sta: 1st person singular present: the stem alone, sta.',
      'The whole form: The subject is ik.',
      'The whole form: The separable part op goes to the end of the clause.',
    ],
    nl: [
      'sta: De stam van staan is sta-, zoals die voor dit werkwoord is opgegeven.',
      'sta: Tegenwoordige tijd, 1e persoon enkelvoud: alleen de stam, sta.',
      'De hele vorm: Het onderwerp is ik.',
      'De hele vorm: Het scheidbare deel op komt achteraan in de zin.',
    ],
  },
  {
    // opgestaan: the separable part written on
    verb: 'opstaan', query: { mood: 'participle', tense: 'past' }, form: 'opgestaan',
    en: [
      'opgestaan: staan has an irregular past participle: gestaan.',
      'opgestaan: op is written together with the verb: gestaan becomes opgestaan.',
    ],
    nl: [
      'opgestaan: staan heeft een onregelmatig voltooid deelwoord: gestaan.',
      'opgestaan: op wordt aan het werkwoord vastgeschreven: gestaan wordt opgestaan.',
    ],
  },
  {
    // werk: the imperative
    verb: 'werken', query: { mood: 'imperative', tense: 'present', person: 2, number: 'singular' }, form: 'werk',
    en: [
      'werk: Take -en off werken: werk-.',
      'werk: Imperative: the stem alone, werk.',
    ],
    nl: [
      'werk: Haal -en van werken af: werk-.',
      'werk: Gebiedende wijs: alleen de stam, werk.',
    ],
  },
  {
    // wees: a listed imperative
    verb: 'zijn', query: { mood: 'imperative', tense: 'present', person: 2, number: 'singular' }, form: 'wees',
    en: [
      'wees: zijn has the listed form wees here.',
    ],
    nl: [
      'wees: zijn heeft hier de vaste vorm wees.',
    ],
  },
  {
    // hou: the imperative with the dropped d (I4)
    verb: 'houden', query: { mood: 'imperative', tense: 'present', person: 2, number: 'singular' }, form: 'hou',
    en: [
      'hou: After a vowel, the d at the end of the stem houd- is often left out: hou.',
    ],
    nl: [
      'hou: Na een klinker valt de d aan het eind van de stam houd- vaak weg: hou.',
    ],
  },
  {
    // werkend
    verb: 'werken', query: { mood: 'participle', tense: 'present' }, form: 'werkend',
    en: [
      'werkend: Present participle: the infinitive + d, werkend.',
    ],
    nl: [
      'werkend: Tegenwoordig deelwoord: het hele werkwoord + d, werkend.',
    ],
  },
  {
    // wezen: the spoken infinitive (M4)
    verb: 'zijn', query: { mood: 'infinitive', tense: 'present' }, form: 'wezen',
    en: [
      'wezen: In speech, zijn also has the infinitive wezen.',
    ],
    nl: [
      'wezen: In spreektaal heeft zijn ook het hele werkwoord wezen.',
    ],
  },
  {
    // the perfect
    verb: 'werken', query: { mood: 'indicative', tense: 'perfect', person: 1, number: 'singular' }, form: 'ik heb gewerkt',
    en: [
      'heb: Take -en off hebben: hebb-.',
      'heb: A word does not end in a double consonant, so hebb- becomes heb-.',
      'heb: 1st person singular present: the stem alone, heb.',
      'gewerkt: Take -en off werken: werk-.',
      'gewerkt: Weak verb: in the past participle a t comes after the stem: werkt.',
      "gewerkt: k is one of the sounds of 't kofschip (t, k, f, s, ch, p), so the ending starts with t: werkt.",
      'gewerkt: The past participle starts with ge-: gewerkt.',
      'The whole form: Present perfect: the present tense of hebben + the past participle.',
      'The whole form: The subject is ik.',
    ],
    nl: [
      'heb: Haal -en van hebben af: hebb-.',
      'heb: Aan het eind van een woord schrijf je geen dubbele medeklinker, dus hebb- wordt heb-.',
      'heb: Tegenwoordige tijd, 1e persoon enkelvoud: alleen de stam, heb.',
      'gewerkt: Haal -en van werken af: werk-.',
      'gewerkt: Zwak werkwoord: in het voltooid deelwoord komt er een t achter de stam: werkt.',
      "gewerkt: k zit in 't kofschip (t, k, f, s, ch, p), dus de uitgang begint met t: werkt.",
      'gewerkt: Het voltooid deelwoord begint met ge-: gewerkt.',
      'De hele vorm: Voltooid tegenwoordige tijd: de tegenwoordige tijd van hebben + het voltooid deelwoord.',
      'De hele vorm: Het onderwerp is ik.',
    ],
  },
  {
    // the pluperfect with zijn
    verb: 'gaan', query: { mood: 'indicative', tense: 'pluperfect', person: 1, number: 'singular' }, form: 'ik was gegaan',
    en: [
      'was: zijn has an irregular past tense: was.',
      'gegaan: gaan has an irregular past participle: gegaan.',
      'The whole form: Past perfect: the past tense of zijn + the past participle.',
      'The whole form: The subject is ik.',
    ],
    nl: [
      'was: zijn heeft een onregelmatige verleden tijd: was.',
      'gegaan: gaan heeft een onregelmatig voltooid deelwoord: gegaan.',
      'De hele vorm: Voltooid verleden tijd: de verleden tijd van zijn + het voltooid deelwoord.',
      'De hele vorm: Het onderwerp is ik.',
    ],
  },
  {
    // the future
    verb: 'werken', query: { mood: 'indicative', tense: 'future', person: 1, number: 'singular' }, form: 'ik zal werken',
    en: [
      'zal: The stem of zullen is zal-, as given for this verb.',
      'zal: 1st person singular present: the stem alone, zal.',
      'The whole form: Future: the present tense of zullen + the infinitive.',
      'The whole form: The subject is ik.',
    ],
    nl: [
      'zal: De stam van zullen is zal-, zoals die voor dit werkwoord is opgegeven.',
      'zal: Tegenwoordige tijd, 1e persoon enkelvoud: alleen de stam, zal.',
      'De hele vorm: Onvoltooid tegenwoordige toekomende tijd: de tegenwoordige tijd van zullen + het hele werkwoord.',
      'De hele vorm: Het onderwerp is ik.',
    ],
  },
  {
    // the future perfect
    verb: 'werken', query: { mood: 'indicative', tense: 'future_perfect', person: 1, number: 'singular' }, form: 'ik zal gewerkt hebben',
    en: [
      'zal: The stem of zullen is zal-, as given for this verb.',
      'zal: 1st person singular present: the stem alone, zal.',
      'gewerkt: Take -en off werken: werk-.',
      'gewerkt: Weak verb: in the past participle a t comes after the stem: werkt.',
      "gewerkt: k is one of the sounds of 't kofschip (t, k, f, s, ch, p), so the ending starts with t: werkt.",
      'gewerkt: The past participle starts with ge-: gewerkt.',
      'The whole form: Future perfect: the present tense of zullen + the past participle + hebben.',
      'The whole form: The subject is ik.',
    ],
    nl: [
      'zal: De stam van zullen is zal-, zoals die voor dit werkwoord is opgegeven.',
      'zal: Tegenwoordige tijd, 1e persoon enkelvoud: alleen de stam, zal.',
      'gewerkt: Haal -en van werken af: werk-.',
      'gewerkt: Zwak werkwoord: in het voltooid deelwoord komt er een t achter de stam: werkt.',
      "gewerkt: k zit in 't kofschip (t, k, f, s, ch, p), dus de uitgang begint met t: werkt.",
      'gewerkt: Het voltooid deelwoord begint met ge-: gewerkt.',
      'De hele vorm: Voltooid tegenwoordige toekomende tijd: de tegenwoordige tijd van zullen + het voltooid deelwoord + hebben.',
      'De hele vorm: Het onderwerp is ik.',
    ],
  },
  {
    // the conditional
    verb: 'werken', query: { mood: 'conditional', tense: 'present', person: 1, number: 'singular' }, form: 'ik zou werken',
    en: [
      'zou: zullen has an irregular past tense: zou.',
      'The whole form: Conditional: the past tense of zullen (zou, zouden) + the infinitive.',
      'The whole form: The subject is ik.',
    ],
    nl: [
      'zou: zullen heeft een onregelmatige verleden tijd: zou.',
      'De hele vorm: Onvoltooid verleden toekomende tijd: zou of zouden + het hele werkwoord.',
      'De hele vorm: Het onderwerp is ik.',
    ],
  },
  {
    // the conditional perfect
    verb: 'werken', query: { mood: 'conditional', tense: 'past', person: 1, number: 'singular' }, form: 'ik zou gewerkt hebben',
    en: [
      'zou: zullen has an irregular past tense: zou.',
      'gewerkt: Take -en off werken: werk-.',
      'gewerkt: Weak verb: in the past participle a t comes after the stem: werkt.',
      "gewerkt: k is one of the sounds of 't kofschip (t, k, f, s, ch, p), so the ending starts with t: werkt.",
      'gewerkt: The past participle starts with ge-: gewerkt.',
      'The whole form: Conditional perfect: the past tense of zullen (zou, zouden) + the past participle + hebben.',
      'The whole form: The subject is ik.',
    ],
    nl: [
      'zou: zullen heeft een onregelmatige verleden tijd: zou.',
      'gewerkt: Haal -en van werken af: werk-.',
      'gewerkt: Zwak werkwoord: in het voltooid deelwoord komt er een t achter de stam: werkt.',
      "gewerkt: k zit in 't kofschip (t, k, f, s, ch, p), dus de uitgang begint met t: werkt.",
      'gewerkt: Het voltooid deelwoord begint met ge-: gewerkt.',
      'De hele vorm: Voltooid verleden toekomende tijd: zou of zouden + het voltooid deelwoord + hebben.',
      'De hele vorm: Het onderwerp is ik.',
    ],
  },
  {
    // the reflexive pronoun
    verb: 'vergissen', query: { mood: 'indicative', tense: 'present', person: 1, number: 'singular' }, form: 'ik vergis me',
    en: [
      'vergis: Take -en off vergissen: vergiss-.',
      'vergis: A word does not end in a double consonant, so vergiss- becomes vergis-.',
      'vergis: 1st person singular present: the stem alone, vergis.',
      'The whole form: The subject is ik.',
      'The whole form: vergissen is a reflexive verb: the reflexive pronoun me goes with it.',
    ],
    nl: [
      'vergis: Haal -en van vergissen af: vergiss-.',
      'vergis: Aan het eind van een woord schrijf je geen dubbele medeklinker, dus vergiss- wordt vergis-.',
      'vergis: Tegenwoordige tijd, 1e persoon enkelvoud: alleen de stam, vergis.',
      'De hele vorm: Het onderwerp is ik.',
      'De hele vorm: vergissen is een wederkerend werkwoord: het wederkerend voornaamwoord me hoort erbij.',
    ],
  },
  {
    // het spijt: the impersonal subject (M2)
    verb: 'spijten', query: { mood: 'indicative', tense: 'present', person: 3, number: 'singular' }, form: 'het spijt',
    en: [
      'spijt: Take -en off spijten: spijt-.',
      'spijt: The stem spijt- already ends in t, so no t is added: spijt.',
      'The whole form: spijten is impersonal: its subject is het.',
    ],
    nl: [
      'spijt: Haal -en van spijten af: spijt-.',
      'spijt: De stam spijt- eindigt al op t, dus er komt geen t bij: spijt.',
      'De hele vorm: spijten is een onpersoonlijk werkwoord: het onderwerp is het.',
    ],
  },
  {
    // an impersonal verb has no 1st person (M3)
    verb: 'spijten', query: { mood: 'indicative', tense: 'present', person: 1, number: 'singular' }, unavailable: true,
    en: [
      'Availability: spijten has no modern indicative/present form in this slot.',
    ],
    nl: [
      'Beschikbaarheid: spijten is een onpersoonlijk werkwoord: het heeft alleen vormen in de 3e persoon.',
    ],
  },
  {
    // vriezen has no plural
    verb: 'vriezen', query: { mood: 'indicative', tense: 'past', person: 3, number: 'plural' }, unavailable: true,
    en: [
      'Availability: vriezen has no modern indicative/past form in this slot.',
    ],
    nl: [
      'Beschikbaarheid: vriezen heeft hier alleen vormen in het enkelvoud, met het als onderwerp.',
    ],
  },
  {
    // no imperative
    verb: 'kunnen', query: { mood: 'imperative', tense: 'present', person: 2, number: 'singular' }, unavailable: true,
    en: [
      'Availability: kunnen has no modern imperative/present form in this slot.',
    ],
    nl: [
      'Beschikbaarheid: kunnen heeft geen gebiedende wijs.',
    ],
  },
  {
    // zullen has no compound tenses (M7)
    verb: 'zullen', query: { mood: 'indicative', tense: 'perfect', person: 1, number: 'singular' }, unavailable: true,
    en: [
      'Availability: zullen has no modern indicative/perfect form in this slot.',
    ],
    nl: [
      'Beschikbaarheid: zullen heeft geen voltooid deelwoord, geen gebiedende wijs en geen tijden die met zullen of een voltooid deelwoord gevormd worden.',
    ],
  },
  {
    // an unknown verb split at a separable particle (change 1)
    verb: 'opzorpen', query: {}, analysis: true,
    en: [
      'The verb: opzorpen is a separable verb: op carries the stress and can stand apart from the verb.',
      'The verb: An unlisted Dutch verb defaults to the weak native model.',
      'The verb: Ordinary open/closed syllables are inferred; use a stem or stress hint when pronunciation differs.',
      'The verb: An unlisted verb defaults to hebben; lexical meaning may require zijn.',
      'The verb: opzorpen is not in the lexicon and starts with the separable particle op, so it is conjugated as a separable verb. If op- is a prefix that stays on the verb here, give it as the inseparable prefix; if the verb has no prefix, give its class (weak or strong).',
    ],
    nl: [
      'Het werkwoord: opzorpen is een scheidbaar werkwoord: op krijgt de klemtoon en kan los van het werkwoord staan.',
      'Het werkwoord: zorpen staat niet in de lijst met werkwoorden, dus we nemen aan dat het een zwak werkwoord is.',
      'Het werkwoord: De stam van zorpen schrijven we volgens de regels voor open en gesloten lettergrepen; spreek je het anders uit, geef dan zelf de stam of de klemtoon op.',
      "Het werkwoord: We nemen aan dat opzorpen in de voltooide tijden het hulpwerkwoord 'hebben' krijgt, al vraagt de betekenis soms om 'zijn'.",
      'Het werkwoord: opzorpen staat niet in de lijst en begint met het scheidbare deel op, dus we vervoegen het als scheidbaar werkwoord: op komt los van het werkwoord. Blijft op- hier vast aan het werkwoord, geef het dan op als onscheidbaar voorvoegsel; heeft het werkwoord geen voorvoegsel, geef dan op of het zwak of sterk is.',
    ],
  },
  {
    // ik zorp op: the split verb
    verb: 'opzorpen', query: { mood: 'indicative', tense: 'present', person: 1, number: 'singular' }, form: 'ik zorp op',
    en: [
      'zorp: Take -en off zorpen: zorp-.',
      'zorp: 1st person singular present: the stem alone, zorp.',
      'The whole form: The subject is ik.',
      'The whole form: The separable part op goes to the end of the clause.',
    ],
    nl: [
      'zorp: Haal -en van zorpen af: zorp-.',
      'zorp: Tegenwoordige tijd, 1e persoon enkelvoud: alleen de stam, zorp.',
      'De hele vorm: Het onderwerp is ik.',
      'De hele vorm: Het scheidbare deel op komt achteraan in de zin.',
    ],
  },
  {
    // an unknown verb with a dual prefix, taken as inseparable (change 1)
    verb: 'overwinnen', query: {}, analysis: true,
    en: [
      'The verb: overwinnen starts with the unstressed prefix over-, which never splits off, so the past participle gets no ge-.',
      'The verb: winnen is an irregular verb: its past tense, won, is in the verb list.',
      'The verb: overwinnen is not in the lexicon and starts with over-, which can be a separable particle or an unstressed prefix: it is taken as a prefix that stays on the verb. If over is separable here, give it as the separable prefix; if the verb has no prefix, give its class (weak or strong).',
    ],
    nl: [
      'Het werkwoord: overwinnen begint met het onbeklemtoonde voorvoegsel over-, dat nooit loskomt, dus het voltooid deelwoord krijgt geen ge-.',
      'Het werkwoord: winnen is een onregelmatig werkwoord: de verleden tijd, won, staat in de werkwoordenlijst.',
      'Het werkwoord: overwinnen staat niet in de lijst en begint met over-, dat een scheidbaar deel of een onbeklemtoond voorvoegsel kan zijn: we nemen aan dat het een voorvoegsel is dat altijd aan het werkwoord vast blijft. Is over hier scheidbaar, geef het dan op als scheidbaar deel; heeft het werkwoord geen voorvoegsel, geef dan op of het zwak of sterk is.',
    ],
  },
  {
    // overwonnen
    verb: 'overwinnen', query: { mood: 'participle', tense: 'past' }, form: 'overwonnen',
    en: [
      'overwonnen: winnen has an irregular past participle: gewonnen.',
      'overwonnen: After the prefix over- the past participle has no ge-: overwonnen.',
    ],
    nl: [
      'overwonnen: winnen heeft een onregelmatig voltooid deelwoord: gewonnen.',
      'overwonnen: Na het voorvoegsel over- krijgt het voltooid deelwoord geen ge-: overwonnen.',
    ],
  },
  {
    // a lemma with a separable and an inseparable reading (change 2)
    verb: 'voorkomen', query: {}, analysis: true,
    en: [
      'The verb (separable): voorkomen is a separable verb: voor carries the stress and can stand apart from the verb.',
      'The verb (separable): komen is an irregular verb: its past tense, kwam, is in the verb list.',
      'The verb (inseparable): voorkomen starts with the unstressed prefix voor-, which never splits off, so the past participle gets no ge-.',
      'The verb (inseparable): komen is an irregular verb: its past tense, kwam, is in the verb list.',
    ],
    nl: [
      'Het werkwoord (scheidbaar): voorkomen is een scheidbaar werkwoord: voor krijgt de klemtoon en kan los van het werkwoord staan.',
      'Het werkwoord (scheidbaar): komen is een onregelmatig werkwoord: de verleden tijd, kwam, staat in de werkwoordenlijst.',
      'Het werkwoord (onscheidbaar): voorkomen begint met het onbeklemtoonde voorvoegsel voor-, dat nooit loskomt, dus het voltooid deelwoord krijgt geen ge-.',
      'Het werkwoord (onscheidbaar): komen is een onregelmatig werkwoord: de verleden tijd, kwam, staat in de werkwoordenlijst.',
    ],
  },
  {
    // hij voorkomt: the inseparable reading
    verb: 'voorkomen', query: { mood: 'indicative', tense: 'present', person: 3, number: 'singular' }, form: 'hij voorkomt',
    en: [
      'voorkomt: The stem of komen is kom-, as given for this verb.',
      'voorkomt: 3rd person singular present: stem + t, komt.',
      'voorkomt: voor- is an inseparable prefix and always stays in front of the verb: komt becomes voorkomt.',
      'The whole form: The subject is hij.',
    ],
    nl: [
      'voorkomt: De stam van komen is kom-, zoals die voor dit werkwoord is opgegeven.',
      'voorkomt: Tegenwoordige tijd, 3e persoon enkelvoud: stam + t, komt.',
      'voorkomt: voor- is een onscheidbaar voorvoegsel en staat altijd vast vóór het werkwoord: komt wordt voorkomt.',
      'De hele vorm: Het onderwerp is hij.',
    ],
  },
];

function subjectOf({ verb, query, form, analysis }: Pinned): Explainable {
  const result = engine.conjugate({ language: 'nl', infinitive: verb, ...query });
  const subject = form !== undefined ? result.forms.find(item => item.text === form) : analysis ? result.analysis : result.unavailableTargets[0];
  if (subject === undefined) throw new Error(`${verb} ${JSON.stringify(query)} has no ${form ?? 'unavailable target'}.`);
  return subject;
}

/** Each step as `<section title>: <text>`, in order. */
const lines = (subject: Explainable, locale: string): string[] =>
  engine.explain('nl', subject, locale).sections.flatMap(section => section.steps.map(s => `${section.title}: ${s.text}`));

describe('Dutch explanations', () => {
  it.each(pinned.map(item => [item.form ?? `${item.verb} ${item.analysis ? 'analysis' : 'unavailable'}`, item] as const))('%s', (_, item) => {
    const subject = subjectOf(item);
    expect(lines(subject, 'en')).toEqual(item.en);
    expect(lines(subject, 'nl')).toEqual(item.nl);
  });

  it('uses every Dutch rule', () => {
    const used = new Set(pinned.flatMap(item => engine.explain('nl', subjectOf(item), 'en').sections.flatMap(section => section.steps.map(s => s.rule))));
    expect(Object.keys(dutchRules).filter(rule => !used.has(rule))).toEqual([]);
    expect(pinned.length).toBeGreaterThanOrEqual(40);
  });
});
