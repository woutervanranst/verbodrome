import type { Citation, Work } from '../../core/sources.js';
import type { GermanRuleId } from './rules.js';

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
} as const satisfies Record<GermanRuleId, Citation | readonly Citation[]>;

/** Rules whose claim no online authority states: they cite the Duden-Grammatik by chapter only (GD §1.2). */
export const printOnly: ReadonlySet<GermanRuleId> = new Set<GermanRuleId>(['de.classify.denominal']);

/** What the lexicon notes per lemma, before the DWDS-only lemmas are marked. */
const notes: Readonly<Record<string, string>> = {
  // Forms Duden prints that DWDS does not: kept as tagged variants.
  tun: 'The du-imperative tue is printed by Duden only (DWDS: tu); it is kept, tagged long.',
  stehlen: 'Konjunktiv II stöhle is printed by Duden only (DWDS: stähle); it is kept, tagged alternate.',
  verderben: 'Konjunktiv II: DWDS verdärbe, Duden verdürbe; DWDS first, verdürbe tagged alternate.',
  schleifen: 'Strong paradigm: Duden gives habe/bin geschliffen, DWDS hat geschliffen only; sein is kept from Duden with its condition.',
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
  spleißen: 'DWDS grammar line gives the weak conjugation (spleißte, gespleißt) first and prints the strong one (spliss, gesplissen) too; Duden prints only the strong one. Two paradigms, weak first.',
  melken: 'DWDS: weak (melkte, gemelkt) in the grammar line, strong (milkt, molk, gemolken) as a second table; Duden: melkte/molk, gemolken. Two paradigms, weak first.',
  sieden: 'DWDS: weak (siedete, gesiedet) in the grammar line, strong (sott, gesotten) as a second table; Duden: weak only. Two paradigms, weak first.',
  saugen: 'DWDS: weak (saugte, gesaugt) in the grammar line, strong (sog, gesogen) as a second table. Two paradigms, weak first.',
  gären: 'DWDS: weak (gärte, gegärt) in the grammar line, strong (gor, gegoren) as a second table, both with hat / ist; Duden: gärte/gor, gegoren. Two paradigms, weak first.',
  glimmen: 'DWDS: strong (glomm, geglommen) in the grammar line, weak (glimmte, geglimmt) as a second table. Two paradigms, strong first.',
  dingen: 'DWDS: weak (dingte, gedingt) in the grammar line, strong (dang, gedungen) as a second table. Two paradigms, weak first.',
  stieben: 'DWDS: weak (stiebte, gestiebt) in the grammar line, strong (stob, gestoben) as a second table, both ist / hat. Two paradigms, weak first.',
  triefen: 'DWDS: weak (triefte) in the grammar line, strong (troff) as a second table, both getrieft; the design marked troff dated, DWDS does not. Two paradigms, weak first.',
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
  laden: 'DWDS prints a second table per homograph with the present ladest, ladet; only the lädt set (the design, Duden) is modelled.',
  schmelzen: 'DWDS also prints a weak table (schmelzte, geschmelzt) under ²schmelzen; not modelled.',
  fechten: 'DWDS also prints a weak table (fechtete, gefechtet); not modelled.',
  flechten: 'DWDS also prints a weak table (flechtete, geflechtet); not modelled.',
  sprießen: 'DWDS also prints a weak Präteritum table (sprießte); not modelled.',
  erlöschen: 'DWDS also prints a weak table (erlöschte, erlöscht); not modelled.',
  übernehmen: 'DWDS also prints a separable reading (nimmt über, übergenommen); only the inseparable reading is modelled (design §3.4).',
  übersehen: 'DWDS also prints a separable reading (sieht über, übergesehen); only the inseparable reading is modelled.',
  hinterlassen: 'DWDS also prints a separable reading (lässt hinter, hintergelassen); only the inseparable reading is modelled.',
  hintergehen: 'DWDS also prints a separable reading (geht hinter, ist hintergegangen); only the inseparable reading is modelled.',
  umfassen: 'DWDS also prints a separable reading (fasst um, umgefasst); only the inseparable reading is modelled.',
  lassen: 'The Partizip II lassen (Ersatzinfinitiv) DWDS prints beside gelassen is not modelled; the same holds for the modal verbs.',
  werden: 'The Partizip II worden (passive) is not modelled; the dated Präteritum ward, wardst is.',
};

/** Lemmas Duden has no conjugation table for: they rest on DWDS alone. */
export const dwdsOnly: readonly string[] = [
  'schmeißen', 'stieben', 'sprießen', 'triefen', 'saugen', 'wägen', 'erwägen', 'schmelzen', 'glimmen', 'dingen', 'gelingen',
  'misslingen', 'bergen', 'sehen', 'schaffen', 'heißen', 'lassen', 'scheren',
];

/**
 * Lexicon entries that rest on one authority only, and the places where DWDS and Duden disagree or where DWDS prints
 * more than is modelled, keyed by lemma. DWDS decides the forms and their labels; Duden is the cross-check.
 */
export const lexiconNotes: Readonly<Record<string, string>> = Object.fromEntries([
  ...Object.entries(notes).map(([lemma, note]) => [lemma, dwdsOnly.includes(lemma) ? `DWDS only (no Duden table). ${note}` : note] as const),
  ...dwdsOnly.filter(lemma => !Object.hasOwn(notes, lemma)).map(lemma => [lemma, 'DWDS only: Duden has no conjugation table for this lemma.'] as const),
]);
