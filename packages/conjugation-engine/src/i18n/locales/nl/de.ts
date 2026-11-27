/**
 * Dutch explanations of the German rules, for Dutch-speaking secondary-school pupils: one sentence each in plain Dutch
 * with the school-grammar terms they know, naming the forms through {before}, {after} and the rule's params. An
 * apostrophe directly before a placeholder is written twice.
 */
import type { germanRules } from '../../../languages/de/rules.js';

/** The class names `{after}` of `de.classify.lexicon` can be. */
const classes = 'weak {een zwak werkwoord} strong {een sterk werkwoord} mixed {een gemengd werkwoord} preteritePresent {een werkwoord dat vervoegd wordt zoals de modale werkwoorden} irregular {een onregelmatig werkwoord} other {een {after} werkwoord}';

/** The particles that can also be unstressed prefixes. */
const dual = (text: string) => ['durch', 'hinter', 'über', 'um', 'unter', 'voll', 'wider', 'wieder'].map(particle => `${particle} {${text}}`).join(' ');

/** The names of the paradigms of a verb with several (the title of each paradigm's explanation). */
const labels = {
  'de.label.pattern.separable': 'scheidbaar voorvoegsel',
  'de.label.pattern.inseparable': 'onscheidbaar voorvoegsel',
  'de.label.pattern.weak': 'zwakke vervoeging',
  'de.label.pattern.strong': 'sterke vervoeging',
  'de.label.pattern.mixed': 'gemengde vervoeging',
} as const;

export const de = {
  ...labels,
  'de.classify.lexicon': `{before} staat in de woordenlijst als {after, select, ${classes}}.`,
  'de.classify.derivative': '{before} is {prefix} + {root}, dus het wordt vervoegd zoals {root}.',
  'de.classify.separable': '{particle}- is een scheidbaar voorvoegsel: het krijgt de klemtoon en staat los van de persoonsvorm.',
  'de.classify.inseparable': '{prefix}- is hier een onscheidbaar voorvoegsel: het blijft altijd aan het werkwoord vast.',
  'de.classify.assume-separable': `{particle, select, ${dual('Aangenomen dat {particle}- de klemtoon krijgt en scheidbaar is, want het werkwoord staat niet in de woordenlijst; zonder klemtoon zou het een onscheidbaar voorvoegsel zijn; de optie inseparablePrefix gaat hier voor.')} other {Aangenomen dat {particle}- een scheidbaar voorvoegsel is, want het werkwoord staat niet in de woordenlijst; de optie inseparablePrefix gaat hier voor.}}`,
  'de.classify.denominal': 'Een werkwoord met {prefix}- vóór een scheidbaar voorvoegsel is afgeleid van een zelfstandig naamwoord: het is zwak en onscheidbaar.',
  'de.classify.not-derived': '{before} is niet afgeleid van {root}: het wordt op zichzelf vervoegd.',
  'de.classify.default-weak': 'Aangenomen dat het een zwak werkwoord is, want het staat niet in de woordenlijst; de optie classHint (met stems) gaat hier voor.',
  'de.classify.default-haben': 'Aangenomen dat de voltooide tijd met haben gevormd wordt; de optie auxiliary gaat hier voor.',
  'de.classify.default-stress': 'Aangenomen dat de klemtoon op de eerste lettergreep ligt, dus het voltooid deelwoord (Partizip II) krijgt ge-; de optie stems.unstressedFirstSyllable gaat hier voor.',
  'de.classify.ieren': 'Werkwoorden op -ieren hebben de klemtoon op -ier-, dus het voltooid deelwoord (Partizip II) krijgt geen ge-.',
  'de.classify.assume-root-auxiliary': 'Aangenomen dat {before} de voltooide tijd met hetzelfde hulpwerkwoord vormt als {root}; de optie auxiliary gaat hier voor.',
  'de.classify.transliteration': '{written} wordt gelezen als {read}: ss staat voor ß, en ae, oe, ue voor ä, ö, ü (geen optie gaat hier voor: typ ß of de Umlaut).',
  'de.classify.hint': 'Zoals gevraagd is {hint} {value}.',
  'de.classify.duden-only': '{before} is alleen in Duden nagekeken: DWDS heeft er geen tabel van.',
  'de.classify.assume-prefix-haben': 'Aangenomen dat {before} de voltooide tijd met haben vormt, zoals de meeste werkwoorden met een onscheidbaar voorvoegsel; de optie auxiliary gaat hier voor.',
  'de.classify.unseparated': '{particle}- krijgt de klemtoon, maar blijft in deze betekenis aan het werkwoord vast.',
  // Stems.
  'de.stem.present': 'Laat de uitgang van het hele werkwoord {before} weg: de stam is {after}-.',
  'de.stem.present2': 'Sterke werkwoorden veranderen van klinker in de du- en er-vorm: {before}- wordt {after}-.',
  'de.stem.present-singular': 'Dit werkwoord heeft in het enkelvoud van het Präsens een eigen stam: {before}- wordt {after}-.',
  'de.stem.preterite': 'De stam van het Präteritum van {before} is {after}-.',
  'de.stem.subjunctive-umlaut': 'Konjunktiv II: de stam van het Präteritum krijgt een Umlaut, {before}- wordt {after}-.',
  'de.stem.subjunctive-plain': 'Konjunktiv II houdt de stam van het Präteritum, {after}-: er is geen a, o of u die een Umlaut kan krijgen.',
  'de.stem.subjunctive-lexical': 'De stam van de Konjunktiv II van {before} is {after}-.',
  'de.stem.subjunctive-weak': 'De Konjunktiv II van een zwak Präteritum is gelijk aan het Präteritum, met de stam {after}-.',
  'de.stem.imperative-i': 'Werkwoorden waarvan de du- en er-vorm de klinker in i of ie veranderen, houden {after}- in de gebiedende wijs met du, zonder -e.',
  'de.stem.participle': 'De stam van het voltooid deelwoord (Partizip II) van {before} is {after}-.',
  'de.stem.ge-prefix': 'Het voltooid deelwoord krijgt ge-, want de klemtoon ligt op de eerste lettergreep: {after}-.',
  'de.stem.ge-after-particle': 'Het voltooid deelwoord krijgt ge- vóór de stam, na het voorvoegsel {particle}-: {after}-.',
  'de.stem.ge-blocked-prefix': 'Geen ge-: het werkwoord begint met het onbeklemtoonde voorvoegsel {prefix}-.',
  'de.stem.ge-blocked-stress': 'Geen ge-: de klemtoon ligt niet op de eerste lettergreep van het werkwoord.',
  'de.stem.duden-only': 'Alleen Duden geeft de vorm {after}; DWDS niet: een minder gewone vorm.',
  'de.stem.lexical-cell': '{before} is hier onregelmatig: de hele vorm is {after}.',
  // Endings.
  'de.end.present': 'Präsens, {person} {number}: voeg -{ending} toe.',
  'de.end.preterite-present': '{ending, select, st {Modale werkwoorden en wissen krijgen -st in de du-vorm van het Präsens.} other {Modale werkwoorden en wissen hebben geen uitgang in de ich- en er-vorm van het Präsens.}}',
  'de.end.preterite-weak': 'Het zwakke Präteritum: voeg -{ending} toe, dat is -te plus de persoonsuitgang.',
  'de.end.preterite-strong': '{ending, select, en {Het sterke Präteritum: voeg -en toe.} t {Het sterke Präteritum: voeg -t toe.} st {Het sterke Präteritum: voeg -st toe.} other {Het sterke Präteritum: de ich- en er-vorm hebben geen uitgang.}}',
  'de.end.preterite-2sg': 'De du-vorm van het sterke Präteritum heeft na {before}- twee uitgangen, -est en -st: {after}.',
  'de.end.subjunctive-i': 'Konjunktiv I: de stam van het hele werkwoord plus -{ending}.',
  'de.end.subjunctive-ii': 'Konjunktiv II: voeg -{ending} toe aan de stam van de Konjunktiv II.',
  'de.end.subjunctive-ii-short': 'In de du- en ihr-vorm van de Konjunktiv II mag de e van de uitgang wegvallen: {after}.',
  'de.end.imperative-singular': '{ending, select, e {Gebiedende wijs met du: de stam plus -e.} other {Gebiedende wijs met du: de stam zonder uitgang.}}',
  'de.end.imperative-plural': 'Gebiedende wijs met ihr: de ihr-vorm van het Präsens zonder het persoonlijk voornaamwoord.',
  'de.end.imperative-polite': 'Gebiedende wijs met wir en Sie: de meervoudsvorm van het Präsens, gevolgd door het persoonlijk voornaamwoord.',
  'de.end.infinitive': 'Het hele werkwoord is de stam plus -en (-n na -el, -er en een klinker).',
  'de.end.participle-weak': 'Een zwak voltooid deelwoord eindigt op -t.',
  'de.end.participle-strong': 'Een sterk voltooid deelwoord eindigt op -en (-n na een klinker).',
  'de.end.present-participle': 'Tegenwoordig deelwoord (Partizip I): de stam van het hele werkwoord plus -end.',
  // Spelling.
  'de.orth.ie-contraction': 'Na -ie valt de e van de uitgang weg: {before} wordt {after}.',
  'de.orth.el-er-schwa': 'Na onbeklemtoond -el of -er valt één e weg, in de uitgang of (bij -el) in de stam: {before} wordt {after}.',
  'de.orth.el-elision': 'Voor de uitgang -e mag de e van -el of -er wegvallen: {before} wordt {after}.',
  'de.orth.schwa-dental': 'Na d of t komt er een e voor de uitgang: {before} wordt {after}.',
  'de.orth.schwa-nasal': 'Na een medeklinker met m of n erachter komt er een e voor de uitgang: {before} wordt {after}.',
  'de.orth.t-merge': 'Een veranderde stam op t krijgt in de er-vorm geen tweede t: {before} wordt {after}.',
  'de.orth.sibilant-2sg': 'Na s, ß, z of x verliest de du-uitgang -st zijn s: {before} wordt {after}.',
  // Compound tenses.
  'de.periphrasis.perfect': 'Perfekt: het Präsens van {auxiliary} plus het voltooid deelwoord (Partizip II).',
  'de.periphrasis.pluperfect': 'Plusquamperfekt: het Präteritum van {auxiliary} plus het voltooid deelwoord (Partizip II).',
  'de.periphrasis.future': 'Futur I: het Präsens van werden plus het hele werkwoord.',
  'de.periphrasis.future-perfect': 'Futur II: het Präsens van werden, het voltooid deelwoord en het hele werkwoord {auxiliary}.',
  'de.periphrasis.subjunctive-perfect': 'Konjunktiv I Perfekt: de Konjunktiv I van {auxiliary} plus het voltooid deelwoord (Partizip II).',
  'de.periphrasis.subjunctive-pluperfect': 'Konjunktiv II Plusquamperfekt: de Konjunktiv II van {auxiliary} plus het voltooid deelwoord (Partizip II).',
  'de.periphrasis.subjunctive-future': 'Konjunktiv I Futur I: de Konjunktiv I van werden plus het hele werkwoord.',
  'de.periphrasis.subjunctive-future-perfect': 'Konjunktiv I Futur II: de Konjunktiv I van werden, het voltooid deelwoord en het hele werkwoord {auxiliary}.',
  'de.periphrasis.conditional': 'würde-vorm: de Konjunktiv II van werden (würde) plus het hele werkwoord.',
  'de.periphrasis.conditional-perfect': 'würde-vorm van het verleden: de Konjunktiv II van werden (würde), het voltooid deelwoord en het hele werkwoord {auxiliary}.',
  'de.periphrasis.infinitive-perfect': 'Infinitiv Perfekt: het voltooid deelwoord plus het hele werkwoord {auxiliary}.',
  // The main clause.
  'de.clause.subject': 'Hoofdzin: eerst het onderwerp, dan de persoonsvorm; de andere werkwoordsvormen staan achteraan.',
  'de.clause.particle-final': 'Het scheidbare voorvoegsel {particle} staat achteraan in de zin.',
  'de.clause.particle-attached': 'Het voorvoegsel {particle} wordt aan {before} vastgeschreven: {after}.',
  'de.clause.imperative-pronoun': 'In deze gebiedende wijs staat het persoonlijk voornaamwoord {pronoun} na het werkwoord, en het mag niet wegvallen.',
  'de.clause.duden-only': 'Alleen Duden geeft dit hulpwerkwoord hier; DWDS niet.',
  'de.clause.impersonal-es': 'Werkwoorden van het weer hebben es als onderwerp: {before} wordt {after}.',
  // Missing forms.
  'de.avail.third-person-only': 'Dit werkwoord wordt alleen in de derde persoon gebruikt.',
  'de.avail.no-imperative': 'Dit werkwoord heeft geen gebiedende wijs.',
  'de.avail.impersonal': 'Werkwoorden van het weer hebben alleen de vorm met es.',
} as const satisfies Record<keyof typeof germanRules | keyof typeof labels, string>;
