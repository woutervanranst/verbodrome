import type { Citation, Work } from '../../core/sources.js';
import type { GermanRuleId } from './rules.js';
import { verification } from './verification.js';

const ids = 'Leibniz-Institut für Deutsche Sprache';

/** The works the German rules cite, keyed by id (the keys of the grammar design's source table, lower-cased). */
export const germanWorks = {
  'grammis-4047': { id: 'grammis-4047', title: 'grammis, Propädeutische Grammatik: Verbflexion nach Tempus und Modus', author: ids, url: 'https://grammis.ids-mannheim.de/progr@mm/4047' },
  'grammis-4069': { id: 'grammis-4069', title: 'grammis, Propädeutische Grammatik: Verbflexion', author: ids, url: 'https://grammis.ids-mannheim.de/progr@mm/4069' },
  'grammis-4070': { id: 'grammis-4070', title: 'grammis, Propädeutische Grammatik: Verbflexion nach Person und Numerus', author: ids, url: 'https://grammis.ids-mannheim.de/progr@mm/4070' },
  'grammis-4071': { id: 'grammis-4071', title: 'grammis, Propädeutische Grammatik: Flexionsklassen der Verben', author: ids, url: 'https://grammis.ids-mannheim.de/progr@mm/4071' },
  'grammis-4073': { id: 'grammis-4073', title: 'grammis, Propädeutische Grammatik: Schwache Verben', author: ids, url: 'https://grammis.ids-mannheim.de/progr@mm/4073' },
  'grammis-4074': { id: 'grammis-4074', title: 'grammis, Propädeutische Grammatik: Starke Verben', author: ids, url: 'https://grammis.ids-mannheim.de/progr@mm/4074' },
  'grammis-4075': { id: 'grammis-4075', title: 'grammis, Propädeutische Grammatik: Flexion der Modalverben', author: ids, url: 'https://grammis.ids-mannheim.de/progr@mm/4075' },
  'grammis-4076': { id: 'grammis-4076', title: 'grammis, Propädeutische Grammatik: Flexion der Hilfsverben', author: ids, url: 'https://grammis.ids-mannheim.de/progr@mm/4076' },
  'grammis-4119': { id: 'grammis-4119', title: 'grammis, Propädeutische Grammatik: Schwa bei den Flexionsmarkern der Verbflexion', author: ids, url: 'https://grammis.ids-mannheim.de/progr@mm/4119' },
  'sg-439': { id: 'sg-439', title: 'grammis, Systematische Grammatik: Formenbestand von Indikativ und Konjunktiv', author: ids, url: 'https://grammis.ids-mannheim.de/systematische-grammatik/439' },
  'sg-1275': { id: 'sg-1275', title: 'grammis, Systematische Grammatik: Imperativ: Formenbestand', author: ids, url: 'https://grammis.ids-mannheim.de/systematische-grammatik/1275' },
  'sg-290': { id: 'sg-290', title: 'grammis, Systematische Grammatik: Imperativparadigma und Aufforderungsformen', author: ids, url: 'https://grammis.ids-mannheim.de/systematische-grammatik/290' },
  'sg-1283': { id: 'sg-1283', title: 'grammis, Systematische Grammatik: Partizip II', author: ids, url: 'https://grammis.ids-mannheim.de/systematische-grammatik/1283' },
  'sg-1285': { id: 'sg-1285', title: 'grammis, Systematische Grammatik: Explizite Verbderivate', author: ids, url: 'https://grammis.ids-mannheim.de/systematische-grammatik/1285' },
  'sg-232': { id: 'sg-232', title: 'grammis, Systematische Grammatik: Formenbestand des deutschen Tempussystems', author: ids, url: 'https://grammis.ids-mannheim.de/systematische-grammatik/232' },
  'sg-312': { id: 'sg-312', title: 'grammis, Systematische Grammatik: Würde-Formen', author: ids, url: 'https://grammis.ids-mannheim.de/systematische-grammatik/312' },
  'sg-1219': { id: 'sg-1219', title: 'grammis, Systematische Grammatik: Bestimmung des Perfekthilfsverbs', author: ids, url: 'https://grammis.ids-mannheim.de/systematische-grammatik/1219' },
  'sg-380': { id: 'sg-380', title: 'grammis, Systematische Grammatik: Modalverb', author: ids, url: 'https://grammis.ids-mannheim.de/systematische-grammatik/380' },
  'f-109': { id: 'f-109', title: 'grammis, Grammatik in Fragen und Antworten: Umfährt er ihn oder fährt er ihn um? Verbkomposita und Präverbfügungen', author: ids, url: 'https://grammis.ids-mannheim.de/fragen/109' },
  'f-162': { id: 'f-162', title: 'grammis, Grammatik in Fragen und Antworten: Der Konjunktiv und die würde-Form', author: ids, url: 'https://grammis.ids-mannheim.de/fragen/162' },
  'vg-2269': { id: 'vg-2269', title: 'grammis, Verbalkomplex: Satzklammer', author: ids, url: 'https://grammis.ids-mannheim.de/vggf/2269' },
  'regelwerk-2024': {
    id: 'regelwerk-2024', title: 'Amtliches Regelwerk der deutschen Rechtschreibung. Regeln und Wörterverzeichnis', author: 'Rat für deutsche Rechtschreibung',
    year: 2024, url: 'https://www.rechtschreibrat.com/DOX/RfdR_Amtliches-Regelwerk_2024.pdf',
  },
  'duden-sprachwissen': { id: 'duden-sprachwissen', title: 'Duden Sprachwissen: Sprachratgeber', author: 'Dudenredaktion', url: 'https://www.duden.de/sprachwissen/sprachratgeber' },
  dwds: { id: 'dwds', title: 'DWDS, Digitales Wörterbuch der deutschen Sprache: Wörterbuch und Flexionstabellen', author: 'Berlin-Brandenburgische Akademie der Wissenschaften', url: 'https://www.dwds.de' },
  duden: { id: 'duden', title: 'Duden online: Wörterbuch und Konjugationstabellen', author: 'Dudenredaktion', url: 'https://www.duden.de' },
  'duden-grammatik': { id: 'duden-grammatik', title: 'Duden. Die Grammatik (Duden Band 4), 10. Auflage', author: 'Dudenredaktion', year: 2022 },
} as const satisfies Record<string, Work>;

const cite = (work: keyof typeof germanWorks, locator: string): Citation => ({ work, locator });
/** The lexicon's authority: the DWDS inflection table of the lemma, with Duden as cross-check. */
const lexicon: readonly Citation[] = [cite('dwds', 'Flexionstabelle des Lemmas (lemma/flexion)'), cite('duden', 'Konjugationstabelle des Lemmas (cross-check)')];
const verbClasses = cite('grammis-4071', 'Flexionsklassen der Verben');
const prefixes = cite('sg-1285', 'Explizite Verbderivate: Präfixverben mit be-, ent-, er-, ver-, zer-');
const geWithParticle = cite('grammis-4071', 'Flexionsklassen der Verben: Partizip II bei festem Präfix und abtrennbarem Präverb');
const particleVerbs = cite('f-109', 'Verbkomposita und Präverbfügungen: trennbare und untrennbare Verben');
const perfectAuxiliary = cite('sg-1219', 'Bestimmung des Perfekthilfsverbs');
const verbChapter = (section: string): Citation => cite('duden-grammatik', `Das Verb: Flexion, ${section}`);
const tenses = cite('sg-232', 'Formenbestand des deutschen Tempussystems');
const wuerde = cite('sg-312', 'Würde-Formen: Konjunktiv Präteritum von werden + Infinitiv vom Voll- oder Modalverb');
const clauseOrder = cite('vg-2269', 'Satzklammer: linke und rechte Satzklammer, Verbpartikel');

/** Every rule's source: the grammar section that states it, and the lexicon for the rules that read it. */
export const germanCitations = {
  'de.classify.lexicon': [...lexicon, verbClasses],
  'de.classify.derivative': [verbClasses, prefixes, particleVerbs],
  'de.classify.separable': [particleVerbs, geWithParticle, cite('regelwerk-2024', '§ 34 (Zusammensetzungen mit Verben: Partikeln)')],
  'de.classify.inseparable': [prefixes, particleVerbs, geWithParticle],
  'de.classify.assume-separable': [particleVerbs, geWithParticle],
  'de.classify.denominal': verbChapter('Präfix- und Partikelverben'),
  'de.classify.not-derived': lexicon,
  'de.classify.default-weak': cite('grammis-4071', 'Flexionsklassen der Verben: die schwache Flexion ist produktiv'),
  'de.classify.default-haben': perfectAuxiliary,
  'de.classify.default-stress': cite('grammis-4071', 'Flexionsklassen der Verben: Partizip II mit ge-'),
  'de.classify.ieren': [cite('grammis-4071', 'Flexionsklassen der Verben: Partizip II ohne ge-'), cite('sg-1283', 'Partizip II')],
  'de.classify.assume-root-auxiliary': perfectAuxiliary,
  'de.classify.transliteration': cite('regelwerk-2024', '§ 25 E2 (ss für ß)'),
  'de.classify.hint': verbClasses,
  'de.classify.assume-prefix-haben': [perfectAuxiliary, prefixes],
  'de.classify.unseparated': [particleVerbs, ...lexicon],
  'de.classify.assume-root-paradigm': [verbClasses, ...lexicon],
  'de.classify.assume-inseparable': [prefixes, particleVerbs],
  'de.classify.assume-unsplit': [particleVerbs, verbClasses],
  'de.classify.particle-verb': [particleVerbs, ...lexicon],
  'de.classify.duden-only': cite('duden', 'Konjugationstabelle des Lemmas'),
  'de.stem.present': cite('grammis-4071', 'Verbale Stammparadigmen'),
  'de.stem.present2': [cite('grammis-4074', 'Starke Verben: Vokalwechsel im Präsens'), ...lexicon],
  'de.stem.present-singular': [cite('grammis-4075', 'Flexion der Modalverben'), ...lexicon],
  'de.stem.preterite': [cite('grammis-4074', 'Starke Verben: Ablaut'), ...lexicon],
  'de.stem.subjunctive-umlaut': [cite('sg-439', 'Konjunktiv Präteritum'), cite('regelwerk-2024', '§ 13 (ä), § 16 (äu)')],
  'de.stem.subjunctive-plain': cite('sg-439', 'Konjunktiv Präteritum'),
  'de.stem.subjunctive-lexical': lexicon,
  'de.stem.subjunctive-weak': [cite('grammis-4073', 'Schwache Verben'), cite('sg-439', 'Konjunktiv Präteritum')],
  'de.stem.imperative-i': [cite('sg-1275', 'Imperativ Singular: mit Vokalwechsel und ohne auslautendes e'), cite('grammis-4074', 'Starke Verben')],
  'de.stem.participle': [cite('grammis-4074', 'Starke Verben: Stammformen'), ...lexicon],
  'de.stem.ge-prefix': [cite('grammis-4071', 'Bildung des Partizip II'), cite('sg-1283', 'Partizip II')],
  'de.stem.ge-after-particle': [geWithParticle, cite('sg-1283', 'Partizip II')],
  'de.stem.ge-blocked-prefix': [geWithParticle, cite('sg-1283', 'Partizip II')],
  'de.stem.ge-blocked-stress': cite('sg-1283', 'Partizip II'),
  'de.stem.duden-only': cite('duden', 'Konjugationstabelle des Lemmas'),
  'de.stem.dwds-only': cite('dwds', 'Flexionstabelle des Lemmas (lemma/flexion)'),
  'de.stem.lexical-cell': [cite('grammis-4076', 'Flexion der Hilfsverben'), cite('grammis-4075', 'Flexion der Modalverben'), ...lexicon],
  'de.end.present': [cite('sg-439', 'Indikativ Präsens'), cite('grammis-4070', 'Verbflexion nach Person und Numerus')],
  'de.end.preterite-present': cite('grammis-4075', 'Flexion der Modalverben: endungslose 1. und 3. Person Singular'),
  'de.end.preterite-weak': [cite('sg-439', 'Indikativ Präteritum: schwache Verben'), cite('grammis-4073', 'Schwache Verben')],
  'de.end.preterite-strong': cite('sg-439', 'Indikativ Präteritum: starke Verben'),
  'de.end.preterite-2sg': [cite('sg-439', 'e-Einfügung in der 2. Person Singular Präteritum'), ...lexicon],
  'de.end.subjunctive-i': cite('sg-439', 'Konjunktiv Präsens'),
  'de.end.subjunctive-ii': cite('sg-439', 'Konjunktiv Präteritum'),
  'de.end.subjunctive-ii-short': [cite('grammis-4119', 'Schwa im Konjunktiv'), cite('duden', 'Konjugationstabelle kommen: kämest, kämst')],
  'de.end.imperative-singular': [cite('sg-1275', 'Imperativ Singular'), cite('duden-sprachwissen', 'Bildung des Imperativs')],
  'de.end.imperative-plural': cite('sg-1275', 'Imperativ Plural'),
  'de.end.imperative-polite': cite('sg-290', 'Distanzform und Adhortativform'),
  'de.end.infinitive': cite('grammis-4071', 'Verbale Stammparadigmen'),
  'de.end.participle-weak': cite('sg-1283', 'Partizip II'),
  'de.end.participle-strong': cite('sg-1283', 'Partizip II'),
  'de.end.present-participle': verbChapter('Partizip I'),
  'de.orth.ie-contraction': cite('regelwerk-2024', '§ 19'),
  'de.orth.el-er-schwa': [cite('grammis-4119', 'Verbstämme auf -el und -er'), ...lexicon],
  'de.orth.el-elision': [cite('grammis-4119', 'Verbstämme auf -el und -er: sammele, sammle'), ...lexicon],
  'de.orth.schwa-dental': [cite('grammis-4073', 'Schwache Verben'), cite('grammis-4119', 'Schwa nach Dentalen'), cite('sg-439', 'Indikativ Präsens: e-Einfügung')],
  'de.orth.schwa-nasal': [cite('grammis-4073', 'Schwache Verben'), cite('grammis-4119', 'Schwa nach Obstruent und Nasal'), cite('sg-439', 'Indikativ Präsens: e-Einfügung')],
  'de.orth.t-merge': [cite('grammis-4119', 'Schwa bei den Flexionsmarkern'), verbChapter('Präsens starker Verben')],
  'de.orth.sibilant-2sg': [cite('regelwerk-2024', '§ 26'), cite('grammis-4119', 'Schwa bei den Flexionsmarkern')],
  'de.periphrasis.perfect': [tenses, perfectAuxiliary],
  'de.periphrasis.pluperfect': [tenses, perfectAuxiliary],
  'de.periphrasis.future': tenses,
  'de.periphrasis.future-perfect': [tenses, perfectAuxiliary],
  'de.periphrasis.subjunctive-perfect': [tenses, cite('sg-439', 'Formenbestand: Konjunktiv'), perfectAuxiliary],
  'de.periphrasis.subjunctive-pluperfect': [tenses, cite('sg-439', 'Formenbestand: Konjunktiv'), perfectAuxiliary],
  'de.periphrasis.subjunctive-future': [tenses, cite('sg-439', 'Formenbestand: Konjunktiv')],
  'de.periphrasis.subjunctive-future-perfect': [tenses, cite('sg-439', 'Formenbestand: Konjunktiv'), perfectAuxiliary],
  'de.periphrasis.conditional': [wuerde, cite('f-162', 'Der Konjunktiv und die würde-Form')],
  'de.periphrasis.conditional-perfect': [wuerde, perfectAuxiliary],
  'de.periphrasis.infinitive-perfect': [tenses, perfectAuxiliary],
  'de.clause.subject': clauseOrder,
  'de.clause.particle-final': [clauseOrder, cite('regelwerk-2024', '§ 34')],
  'de.clause.particle-attached': [cite('regelwerk-2024', '§ 34'), geWithParticle],
  'de.clause.imperative-pronoun': cite('sg-290', 'Distanzform und Adhortativform'),
  'de.clause.duden-only': cite('duden', 'Konjugationstabelle des Lemmas (Perfekt: habe/bin)'),
  'de.clause.impersonal-es': cite('duden', 'Konjugationstabelle regnen (unpersönlich)'),
  'de.avail.third-person-only': [cite('duden', 'Konjugationstabelle geschehen (1. und 2. Person: –)'), verbChapter('defektive Verben')],
  'de.avail.no-imperative': [cite('grammis-4075', 'Flexion der Modalverben'), cite('sg-380', 'Modalverb: bilden keinen Imperativ'), cite('duden-sprachwissen', 'Modalverben und ihre Bedeutung')],
  'de.avail.impersonal': cite('duden', 'Konjugationstabelle regnen (unpersönlich)'),
} as const satisfies Record<GermanRuleId, Citation | readonly Citation[]>;

/** Rules whose claim no online authority states: they cite the Duden-Grammatik by chapter only (GD §1.2). */
export const printOnly: ReadonlySet<GermanRuleId> = new Set<GermanRuleId>(['de.classify.denominal', 'de.end.present-participle', 'de.orth.t-merge']);

/** What the lexicon notes per lemma, before the DWDS-only lemmas are marked. */
const notes: Readonly<Record<string, string>> = {
  // Forms Duden prints that DWDS does not: kept as tagged variants.
  tun: 'The du-imperative tue is printed by Duden only (DWDS: tu); it is kept, tagged long.',
  stehlen: 'Konjunktiv II stöhle is printed by Duden only (DWDS: stähle); it is kept, tagged alternate.',
  verderben: 'Konjunktiv II: Duden prints verdürbe, verdürbest, verdürbst (dictionary: "du verdürbest"); DWDS verdärbe, verdärbest only. verdürbe is preferred (Duden only), verdärbe kept as an alternate marked DWDS only; no short form of verdärb- is emitted, as neither prints one.',
  helfen: 'Konjunktiv II: Duden\'s dictionary "du hülfest, selten hälfest" (an example also has "hülfe (veraltend)/(selten:) hälfe"); both tables list hälfe, hülfe unmarked. The explicit "selten" decides: hülfe preferred, hälfe alternate.',
  schelten: 'Konjunktiv II: DWDS schälte, schölte (va.); Duden prints schöltest only. schölte is dated (DWDS mark); schälte is DWDS only.',
  schwimmen: 'Konjunktiv II: DWDS schwämme, schwömme (va.); Duden\'s dictionary "du schwömmest, auch schwämmest". DWDS\'s explicit mark is followed (schwömme dated); the conflict is recorded here.',
  gewinnen: 'Konjunktiv II: DWDS gewänne, gewönne (va.); Duden\'s dictionary "du gewönnest, auch gewännest". DWDS\'s explicit mark is followed (gewönne dated).',
  empfehlen: 'Konjunktiv II: DWDS empfähle, empföhle (va.); Duden\'s dictionary "du empföhlest, auch empfählest". DWDS\'s explicit mark is followed (empföhle dated).',
  beginnen: 'Konjunktiv II: DWDS begänne, begönne (va.); Duden\'s dictionary "du begännest, seltener begönnest": both mark begönne.',
  schleifen: 'Strong paradigm: DWDS "hat geschliffen" only; Duden also prints ist geschliffen for its sense 4 "auf einer Schleife schlittern" (landschaftlich), emitted with that condition and marked Duden only. Weak paradigm: "hat / ist geschleift" (DWDS).',
  liegen: 'sein (southern German, Austria, Switzerland) from the Duden table (habe/bin gelegen); DWDS gives hat gelegen.',
  sitzen: 'sein (southern German, Austria, Switzerland) from the Duden table (habe/bin gesessen); DWDS gives hat gesessen.',
  stehen: 'sein (southern German, Austria, Switzerland) from the Duden table (habe/bin gestanden); DWDS gives hat gestanden.',
  hängen: 'Strong paradigm: DWDS "hat / seltener ist gehangen", Duden habe/bin; sein is tagged region south as in the other three verbs of position.',
  // Conflicts and choices.
  gebären: 'DWDS grammar line "gebärt / gebiert", DWDS inflection table and the design "gebiert / gebärt", Duden "gebärt, gebiert"; the inflection table order is used.',
  dreschen: 'DWDS drosch / drasch (both unmarked), Duden drosch only; drasch is tagged alternate.',
  heben: 'Duden also prints the Präteritum hub; DWDS has hob only (Konjunktiv II hübe marked va.). hub is not emitted.',
  klimmen: 'Duden also prints klimmte, geklimmt; DWDS has klomm, geklommen only, which are emitted.',
  hauen: 'DWDS gehauen (haute / hieb), Duden gehaut; DWDS is followed.',
  spleißen: 'DWDS prints two complete sets (spleißte, gespleißt; spliss, gesplissen), Duden "starkes und schwaches Verb" without a difference in sense. Two paradigms, weak first as in DWDS, without a condition.',
  melken: 'DWDS: melkte, hat gemelkt in the grammar line, milkt, molk, hat gemolken as a second line; Duden: "melkt/milkt, melkte/molk, hat gemelkt/(häufiger:) gemolken", "melk[e]/(veraltet:) milk". One paradigm: gemolken preferred (Duden: häufiger), milkst, milkt and milk dated, molk an unmarked alternate as in Duden.',
  sieden: 'DWDS: siedete, gesiedet in the grammar line, sott, gesotten as a second line; Duden: "Fachsprache nur: siedete, gesiedet" and "meist: sott, gesotten" for cooking. Two paradigms with those conditions.',
  saugen: 'DWDS: saugte, gesaugt in the grammar line, sog, gesogen as a second line; Duden: "schwaches und starkes Verb", only weak for vacuum cleaning and technical suction. Two paradigms with those conditions.',
  gären: 'DWDS: gärte, hat / ist gegärt in the grammar line, gor, gegoren as a second line; Duden: literal "gärte/gor, hat/ist gegoren/(seltener:) gegärt", figurative "gärte/(selten:) gor". Two paradigms: weak mostly figurative, strong mostly literal.',
  glimmen: 'DWDS: glomm, hat geglommen in the grammar line, glimmte, geglimmt as a second line; Duden: "starkes, auch schwaches Verb". One paradigm, the weak forms tagged.',
  dingen: 'DWDS: dingte, hat gedingt in the grammar line, dang, gedungen as a second line; Duden: "dingte/(selten:) dang, hat gedungen/(seltener:) gedingt". One paradigm in the DWDS order, dang and gedungen tagged alternate.',
  stieben: 'DWDS: stiebte, ist / hat gestiebt in the grammar line, "Nebenform" stob, gestoben; Duden "stob/stiebte", "gestiebt/gestoben". One paradigm in the DWDS order, stob and gestoben tagged alternate.',
  triefen: 'DWDS: triefte, ist / hat getrieft in the grammar line, "Nebenform gehoben, veraltend" troff; Duden "triefte/(gehoben:) troff, getrieft/(selten:) getroffen". One paradigm: troff tagged literary; getroffen (Duden only, rare) is not modelled.',
  schinden: 'DWDS grammar line "schund (Präteritum ungebräuchlich)", DWDS also prints schindete; Duden schund. schindete first, schund tagged alternate, as the design lists schindete.',
  umziehen: 'DWDS grammar line "hat / ist umgezogen"; sein is listed first because DWDS sense 1 (move house) takes sein.',
  unterziehen: 'DWDS prints untergezogen for the inseparable reading too; Duden and the inseparable-prefix rule give unterzogen, which is emitted.',
  unterstellen: 'Unverified at DWDS (no inflection table); both readings rest on Duden (unterstellen_untergestellt, unterstellen_unterstellt).',
  willfahren: 'DWDS willfährt, Duden willfahrt (3rd person singular); the weak present (Duden) is emitted. Partizip II willfahrt / gewillfahrt as DWDS.',
  offenbaren: 'DWDS offenbart / geoffenbart (both unmarked), Duden offenbart; geoffenbart is tagged alternate (the design had dated).',
  erschrecken: 'Strong paradigm: DWDS "ist / hat erschrocken"; hat belongs to the reflexive sich erschrecken, which is not modelled.',
  regnen: 'DWDS prints a full table and "hat / ist geregnet" (ist for the personal use, Konfetti ist geregnet); Duden shows only the third person. Impersonal, haben only.',
  schneien: 'DWDS prints a full table and "hat / ist geschneit" (ist for the personal use); Duden shows only the third person. Impersonal, haben only.',
  geschehen: 'DWDS prints a full table and the imperative geschieh; Duden shows the third person only, which is followed (third person only, no imperative).',
  abonnieren: 'DWDS "hat / ist abonniert"; ist (the state: ist abonniert) is not modelled.',
  begegnen: 'DWDS "ist / veraltet hat begegnet"; the dated haben is not modelled.',
  vergehen: 'DWDS "ist / hat vergangen"; hat belongs to the reflexive sich vergehen, which is not modelled.',
  flüchten: 'DWDS "ist / hat geflüchtet"; hat belongs to the reflexive sich flüchten, which is not modelled.',
  // Homographs and second tables DWDS prints that are not modelled.
  weichen: 'DWDS also has the weak ¹weichen (soften: weichte, geweicht); only the strong ²weichen (give way) is modelled.',
  quellen: 'DWDS also has the weak ²quellen (soak: quellte, gequellt); only the strong ¹quellen is modelled.',
  schwellen: 'DWDS also has the weak ²schwellen (swell something: schwellte, geschwellt); only the strong ¹schwellen is modelled.',
  verlöschen: 'DWDS also has the weak transitive ¹verlöschen (verlöschte, verlöscht); only the strong ²verlöschen is modelled.',
  heißen: 'DWDS also has the weak ²heißen (hoist: heißte, geheißt); only the strong ¹heißen is modelled.',
  raten: 'DWDS also has the weak ³raten (rate: ratete, geratet); only the strong one is modelled.',
  winden: 'DWDS also has the weak ²winden (windete, gewindet); only the strong ¹winden is modelled.',
  backen: 'DWDS also has ²backen (stick: backt/bäckt, backte, ist gebacken/gebackt), not modelled; ¹backen has the weak and the strong set modelled here.',
  laden: 'DWDS prints a second table per homograph with the present ladest, ladet; only the lädt set (the design, Duden) is modelled. That table marks the bare du-imperative lad ugs., so it is not emitted (lade only), like find and halt.',
  schmelzen: 'DWDS also prints a weak table (schmelzte, geschmelzt) under ²schmelzen; not modelled.',
  fechten: 'DWDS also prints a weak table (fechtete, gefechtet); not modelled.',
  flechten: 'DWDS also prints a weak table (flechtete, geflechtet); not modelled.',
  sprießen: 'DWDS also prints a weak Präteritum table (sprießte); not modelled.',
  erlöschen: 'DWDS also prints a weak table (erlöschte, erlöscht); not modelled.',
  übernehmen: 'DWDS prints both readings: nimmt über, hat übergenommen (sling over, put on a coat); übernimmt, hat übernommen. Two paradigms, the common inseparable one first.',
  übersehen: 'DWDS also prints a separable reading (sieht über, übergesehen), only reflexive (sich etwas übersehen, colloquial); reflexive verbs are out, so only the inseparable reading is modelled.',
  hinterlassen: 'DWDS also prints a separable reading (lässt hinter, hintergelassen), marked East Central German, southern and colloquial; only the inseparable reading is modelled.',
  hintergehen: 'DWDS also prints a separable reading (geht hinter, ist hintergegangen), marked East Central German, southern and colloquial; only the inseparable reading is modelled.',
  überschneiden: 'DWDS: reflexive only (überschneidet sich, überschnitt sich, hat sich überschnitten); the inseparable forms are modelled, without the reflexive pronoun.',
  überfressen: 'DWDS: reflexive only (überfrisst sich, überfraß sich, hat sich überfressen); the inseparable forms are modelled, without the reflexive pronoun.',
  hintersinnen: 'DWDS: reflexive only (hintersinnt sich, hintersann sich, hat sich hintersonnen); the inseparable forms are modelled, without the reflexive pronoun.',
  unterwinden: 'DWDS: reflexive only (unterwindet sich, unterwand sich, hat sich unterwunden); the inseparable forms are modelled, without the reflexive pronoun.',
  durchfrieren: 'DWDS: friert durch, fror durch, ist durchgefroren / durchfroren; the second participle durchfroren is not modelled.',
  erstehen: 'DWDS has two homographs: erstehen (buy), hat erstanden; erstehen (arise, literary), ist erstanden. Both auxiliaries with those conditions.',
  behängen: 'DWDS: behängte / behing, hat behängt / behangen; the strong forms come from hängen.',
  erhängen: 'DWDS: erhängte / erhing, hat erhängt / erhangen; the strong forms come from hängen.',
  umfassen: 'DWDS also prints a separable reading (fasst um, umgefasst); only the inseparable reading is modelled.',
  bedingen: 'DWDS also prints a strong table (bedang, bedungen), the old derivative of dingen; only the weak bedingen is modelled (design §3.4).',
  bereiten: 'DWDS also prints the strong bereiten (beritt, beritten: break in a horse); only the weak bereiten (prepare) is modelled (design §3.4).',
  umringen: 'Formed from Ring, not from ringen: DWDS umringte, umringt. Listed as not derived (not in the design lists).',
  begleiten: 'Formed from Geleit, not from gleiten: DWDS begleitete, hat begleitet. Not derived.',
  verleiden: 'Formed from leid, not from leiden: DWDS verleidete, hat verleidet. Not derived.',
  bevorstehen: 'DWDS: steht bevor, stand bevor, hat bevorgestanden. bevor- is not a particle of the closed list (bevormunden is a denominal verb), so this lemma lists its particle.',
  überfallen: 'DWDS prints both readings: fällt über, ist übergefallen; überfällt, hat überfallen. Two paradigms.',
  überholen: 'DWDS prints both readings: holt über, hat übergeholt; überholt, hat überholt. Two paradigms.',
  durchdringen: 'DWDS prints both readings: dringt durch, ist durchgedrungen; durchdringt, hat durchdrungen. Two paradigms.',
  bewillkommnen: 'DWDS bewillkommnete, bewillkommnet: an e is inserted after mn as after a consonant + n (the one such stem; grammis SG-1275 excludes nasals generally).',
  lassen: 'The Partizip II lassen (Ersatzinfinitiv) DWDS prints beside gelassen is not modelled; the same holds for the modal verbs.',
  werden: 'The Partizip II worden (passive) is not modelled; the dated Präteritum ward, wardst is.',
};

/**
 * Lemmas for which no Duden conjugation table was found under the plain slug or the homograph slugs Duden's search
 * listed (sehen, lassen, heißen and schaffen may well have one under a slug the search did not show): they rest on
 * DWDS alone.
 */
export const dwdsOnly: readonly string[] = Object.entries(verification).filter(([, record]) => record.dwds !== null && !record.duden.length).map(([lemma]) => lemma);

/** Lemmas checked in Duden only: DWDS has no table for them (their analysis says so). */
export const dudenOnly: readonly string[] = Object.entries(verification).filter(([, record]) => record.dwds === null).map(([lemma]) => lemma);

/**
 * Lexicon entries that rest on one authority only, and the places where DWDS and Duden disagree or where DWDS prints
 * more than is modelled, keyed by lemma. DWDS decides the forms and their labels; Duden is the cross-check.
 */
export const lexiconNotes: Readonly<Record<string, string>> = Object.fromEntries([
  ...Object.entries(notes).map(([lemma, note]) => [lemma, dwdsOnly.includes(lemma) ? `DWDS only (no Duden table found). ${note}` : note] as const),
  ...dwdsOnly.filter(lemma => !Object.hasOwn(notes, lemma)).map(lemma => [lemma, 'DWDS only: no Duden conjugation table was found for this lemma.'] as const),
]);
