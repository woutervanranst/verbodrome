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
  'sg-439': { id: 'sg-439', title: 'grammis, Systematische Grammatik: Formenbestand (Indikativ und Konjunktiv)', author: ids, url: 'https://grammis.ids-mannheim.de/systematische-grammatik/439' },
  'sg-1275': { id: 'sg-1275', title: 'grammis, Systematische Grammatik: Imperativ, Formenbestand', author: ids, url: 'https://grammis.ids-mannheim.de/systematische-grammatik/1275' },
  'sg-290': { id: 'sg-290', title: 'grammis, Systematische Grammatik: Imperativparadigma und Aufforderungsformen', author: ids, url: 'https://grammis.ids-mannheim.de/systematische-grammatik/290' },
  'sg-1283': { id: 'sg-1283', title: 'grammis, Systematische Grammatik: Partizip II', author: ids, url: 'https://grammis.ids-mannheim.de/systematische-grammatik/1283' },
  'sg-1285': { id: 'sg-1285', title: 'grammis, Systematische Grammatik: Verbale Präfixe', author: ids, url: 'https://grammis.ids-mannheim.de/systematische-grammatik/1285' },
  'sg-232': { id: 'sg-232', title: 'grammis, Systematische Grammatik: Formenbestand des deutschen Tempussystems', author: ids, url: 'https://grammis.ids-mannheim.de/systematische-grammatik/232' },
  'sg-312': { id: 'sg-312', title: 'grammis, Systematische Grammatik: Würde-Formen', author: ids, url: 'https://grammis.ids-mannheim.de/systematische-grammatik/312' },
  'sg-1219': { id: 'sg-1219', title: 'grammis, Systematische Grammatik: Bestimmung des Perfekthilfsverbs', author: ids, url: 'https://grammis.ids-mannheim.de/systematische-grammatik/1219' },
  'sg-380': { id: 'sg-380', title: 'grammis, Systematische Grammatik: Modalverben', author: ids, url: 'https://grammis.ids-mannheim.de/systematische-grammatik/380' },
  'f-109': { id: 'f-109', title: 'grammis, Grammatik in Fragen und Antworten: Präverbfügungen und Komposita', author: ids, url: 'https://grammis.ids-mannheim.de/fragen/109' },
  'f-162': { id: 'f-162', title: 'grammis, Grammatik in Fragen und Antworten: würde-Periphrase statt Konjunktiv Präteritum', author: ids, url: 'https://grammis.ids-mannheim.de/fragen/162' },
  'vg-2269': { id: 'vg-2269', title: 'grammis, Verbalkomplex: rechte Satzklammer', author: ids, url: 'https://grammis.ids-mannheim.de/vggf/2269' },
  'regelwerk-2024': {
    id: 'regelwerk-2024', title: 'Amtliches Regelwerk der deutschen Rechtschreibung. Regeln und Wörterverzeichnis', author: 'Rat für deutsche Rechtschreibung',
    year: 2024, url: 'https://www.rechtschreibrat.com/DOX/RfdR_Amtliches-Regelwerk_2024.pdf',
  },
  'duden-sprachwissen': { id: 'duden-sprachwissen', title: 'Duden Sprachwissen: Sprachratgeber', author: 'Dudenredaktion', url: 'https://www.duden.de/sprachwissen/sprachratgeber' },
  dwds: { id: 'dwds', title: 'DWDS, Digitales Wörterbuch der deutschen Sprache: Wörterbuch und Flexionstabellen', author: 'Berlin-Brandenburgische Akademie der Wissenschaften', url: 'https://www.dwds.de' },
  duden: { id: 'duden', title: 'Duden online: Wörterbuch und Konjugationstabellen', author: 'Dudenredaktion', url: 'https://www.duden.de' },
  'duden-grammatik': { id: 'duden-grammatik', title: 'Duden. Die Grammatik (Duden Band 4), 10. Auflage', author: 'Dudenredaktion', year: 2022 },
} as const satisfies Record<string, Work>;

/** Every rule's source: the grammar section that states it, and the lexicon for the rules that read it. */
export const germanCitations = {} as const satisfies Record<GermanRuleId, Citation | readonly Citation[]>;

/** Rules whose claim no online authority states: they cite the Duden-Grammatik by chapter only (GD §1.2). */
export const printOnly: ReadonlySet<GermanRuleId> = new Set<GermanRuleId>();

/**
 * Lexicon entries that rest on one authority only, and the places where DWDS and Duden disagree, keyed by lemma. DWDS
 * decides the forms and their labels; Duden is the cross-check.
 */
export const lexiconNotes: Readonly<Record<string, string>> = {};
