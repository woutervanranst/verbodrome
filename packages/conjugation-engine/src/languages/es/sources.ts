/**
 * The works the Spanish pack cites and the citation of each rule.
 *
 * Status of the sources (24 Nov 2026): rae.es and dle.rae.es answer HTTP 403 to automated fetching, and no browser was
 * connected for a manual check, so every NGLE, Ortografía, DLE, DPD and GTG locator below rests on the grammar design's
 * search snippets and copies, not on a page read by the implementer. The exceptions are the secondary copies marked
 * "read" below and the RAE note on iros, which was fetched and read in full. Every citation of an RAE work carries
 * "(unverified: not yet read)" in its locator, which `explain` shows. `secondaryOnly` lists the rules whose only source
 * that was read is a secondary copy of an RAE text. The record of what was read per lexicon lemma is `verification.ts`.
 */
import type { Citation, Work } from '../../core/sources.js';
import type { SpanishRuleId } from './rules.js';

export const spanishWorks = {
  ngle: {
    id: 'ngle', title: 'Nueva gramática de la lengua española, cap. 4: La flexión verbal', author: 'Real Academia Española y Asociación de Academias de la Lengua Española', year: 2009,
    url: 'https://www.rae.es/gram%C3%A1tica/morfolog%C3%ADa/',
  },
  orto: {
    id: 'orto', title: 'Ortografía de la lengua española', author: 'Real Academia Española y Asociación de Academias de la Lengua Española', year: 2010,
    url: 'https://www.rae.es/ortograf%C3%ADa/reglas-de-acentuaci%C3%B3n',
  },
  // Read: a copy of the RAE's own summary of the 2010 Ortografía.
  'orto-novedades': {
    id: 'orto-novedades', title: 'Principales novedades de la última edición de la Ortografía de la lengua española (2010)', author: 'Real Academia Española',
    url: 'https://www.edu.xunta.gal/centros/cpicovaterrena/system/files/Principales%20novedades%20de%20la%20Ortograf%C3%ADa%20de%20la%20RAE.pdf',
  },
  // Read: the DPD entry "tilde²", reproduced by the Universidad del Rosario.
  'dpd-tilde': {
    id: 'dpd-tilde', title: 'Diccionario panhispánico de dudas, «tilde²» (copia de la Universidad del Rosario)', author: 'Real Academia Española', year: 2005,
    url: 'https://induccion.urosario.edu.co/sites/default/files/2023-02/material-de-apoyo-la-tilde-segun-la-rae.pdf',
  },
  dle: { id: 'dle', title: 'Diccionario de la lengua española', author: 'Real Academia Española', url: 'https://dle.rae.es/' },
  dpd: { id: 'dpd', title: 'Diccionario panhispánico de dudas', author: 'Real Academia Española y Asociación de Academias de la Lengua Española', year: 2005, url: 'https://www.rae.es/dpd/' },
  gtg: { id: 'gtg', title: 'Glosario de términos gramaticales', author: 'Real Academia Española y Asociación de Academias de la Lengua Española', year: 2019, url: 'https://www.rae.es/gtg/' },
  // Read in full (24 Nov 2026).
  'rae-iros': {
    id: 'rae-iros', title: 'Nota sobre la aceptación de iros como forma de imperativo de 2.ª pers. plural', author: 'Real Academia Española',
    url: 'https://www.rae.es/gram%C3%A1tica/docs/%C2%ABiros%C2%BB%20imperativo.pdf',
  },
  'nrfh-abolir': {
    id: 'nrfh-abolir', title: 'Verbos defectivos: el caso de abolir', author: 'Ponce de León', year: 2021,
    url: 'https://www.redalyc.org/journal/602/60266067008/html/',
  },
  'aml-minucias': {
    id: 'aml-minucias', title: 'Minucias del lenguaje: licuo y licúo', author: 'Academia Mexicana de la Lengua',
    url: 'https://academia.org.mx/consultas/obras-de-consulta-en-linea/diccionario-minucias-del-lenguaje/item/licuo-y-licuo',
  },
  saarland: {
    id: 'saarland', title: 'Irregularidad sistemática (apuntes de curso)', author: 'Universität des Saarlandes',
    url: 'https://www.aula.uni-saarland.de/wp-content/uploads/2026/09/Envio_3_1_Irregularidad-sistematica_rev_.pdf',
  },
} as const satisfies Record<string, Work>;


/**
 * Every NGLE, Ortografía, DLE, DPD and GTG locator is marked: none of those pages was read by the implementer (the RAE
 * site refuses automated reading), so they rest on the grammar design's search snippets until someone opens them.
 */
const unread = (locator: string): string => `${locator} (unverified: not yet read)`;

const ngle = (locator: string): Citation => ({ work: 'ngle', locator: unread(locator) });
const orto = (locator: string, path = 'reglas-de-acentuaci%C3%B3n'): Citation => ({ work: 'orto', locator: unread(locator), url: `https://www.rae.es/ortograf%C3%ADa/${path}` });
const dpd = (entry: string, path = entry): Citation => ({ work: 'dpd', locator: unread(`«${entry}»`), url: `https://www.rae.es/dpd/${path}` });
const dle = (locator: string): Citation => ({ work: 'dle', locator: unread(locator) });
const dpdTilde = (locator: string): Citation => ({ work: 'dpd-tilde', locator });
const gtg = (term: string, path: string): Citation => ({ work: 'gtg', locator: unread(`«${term}»`), url: `https://www.rae.es/gtg/${path}` });
const letters = [{ work: 'orto', locator: unread('the letters c, z, g and j') }, gtg('verbo regular', 'verbo-regular')] as const satisfies readonly Citation[];
const endings = ngle('§4.4–4.6');
const models = ngle('§4.15 (model tables)');
const clitics = dpd('pronombres personales átonos', 'pronombres%20personales%20%C3%A1tonos');
const iros: Citation = { work: 'rae-iros', locator: 'paragraphs 1–2', url: 'https://www.rae.es/gram%C3%A1tica/docs/%C2%ABiros%C2%BB%20imperativo.pdf' };

/** The citation of each rule (grammar design §4, cite columns). */
export const spanishCitations = {
  'es.classify.conjugation': ngle('§4.3, §4.6'),
  'es.classify.reflexive': clitics,
  'es.classify.restore-accent': [orto('§3.4.2', 'palabras-con-hiato'), dpdTilde('§2.2.2')],
  'es.classify.lexicon': dle('the verb\'s entry and its conjugation table'),
  'es.classify.two-paradigms': [dle('the numbered homographs of the verb'), dpd('lemas con superíndice', 'ayuda/lemas-con-superindice')],
  'es.classify.prefixed': ngle('§4.16'),
  'es.classify.family': [ngle('§4.11, §4.12'), dpd('conducir')],
  'es.classify.eir': [ngle('§4.10'), dpd('reír')],
  'es.classify.both-stress': [ngle('§4.9'), dpd('averiguar'), { work: 'aml-minucias', locator: 'licuo y licúo' }],
  'es.classify.regional-variant': dpd('errar'),
  'es.classify.oir': [ngle('§4.11'), dpd('oír')],
  'es.classify.uar-stress': [ngle('§4.9'), dpd('averiguar'), { work: 'aml-minucias', locator: 'licuo y licúo' }],
  'es.classify.hint': ngle('§4.10'),
  'es.classify.assume-regular': ngle('§4.6'),
  'es.classify.assume-glide': ngle('§4.9'),
  'es.classify.iar-single-vowel': [ngle('§4.9'), { work: 'orto-novedades', locator: 'item 4' }],
  'es.classify.assume-diphthong': ngle('§4.9'),
  'es.classify.assume-zc': ngle('§4.11'),
  'es.stem.root': ngle('§4.3'),
  'es.stem.diphthong': ngle('§4.10'),
  'es.stem.e-i': ngle('§4.10'),
  'es.stem.raising': ngle('§4.10'),
  'es.stem.present-1sg': [ngle('§4.11'), dle('the verb\'s conjugation table')],
  'es.stem.subjunctive-from-1sg': ngle('§4.11'),
  'es.stem.zc': ngle('§4.11'),
  'es.stem.y-insertion': ngle('§4.9'),
  'es.stem.strong-preterite': ngle('§4.12'),
  'es.stem.ducir-preterite': [ngle('§4.12'), dpd('conducir')],
  'es.stem.future-infinitive': ngle('§4.5'),
  'es.stem.future-lexical': [ngle('§4.15'), dle('the verb\'s conjugation table')],
  'es.stem.preterite-3pl': ngle('§4.5'),
  'es.stem.lexical': dle('the verb\'s conjugation table'),
  'es.stem.hue': [dle('desosar, desovar'), { work: 'orto', locator: unread('the letters h and y') }],
  'es.cell.lexical': [ngle('§4.13'), dle('the verb\'s conjugation table')],
  'es.cell.imperative-short': [ngle('§4.15'), dle('the verb\'s conjugation table')],
  'es.cell.participle': ngle('§4.12'),
  'es.cell.gerund': [ngle('§4.15'), dle('the verb\'s conjugation table')],
  'es.cell.infinitive-variant': dpd('pudrir'),
  'es.end.present': endings,
  'es.end.imperfect': endings,
  'es.end.preterite': endings,
  'es.end.preterite-strong': ngle('§4.12'),
  'es.end.future': endings,
  'es.end.conditional': endings,
  'es.end.subjunctive-present': endings,
  'es.end.subjunctive-imperfect': ngle('§4.4–4.6, §24.2c'),
  'es.end.subjunctive-future': [endings, gtg('futuro simple de subjuntivo', 'futuro-simple-de-subjuntivo')],
  'es.end.imperative-tu': ngle('§4.6, §4.15'),
  'es.end.imperative-vosotros': ngle('§4.6, §4.15'),
  'es.end.imperative-subjunctive': ngle('§4.6, §4.15'),
  'es.end.infinitive': ngle('§4.6'),
  'es.end.gerund': ngle('§4.6'),
  'es.end.participle': ngle('§4.6'),
  'es.orth.c-qu': letters,
  'es.orth.g-gu': letters,
  'es.orth.gu-diaeresis': [{ work: 'orto', locator: unread('the diaeresis') }, dpd('averiguar')],
  'es.orth.z-c': letters,
  'es.orth.c-z': letters,
  'es.orth.g-j': letters,
  'es.orth.gu-g': letters,
  'es.orth.qu-c': letters,
  'es.orth.u-diaeresis-y': [{ work: 'orto', locator: unread('the diaeresis') }, ngle('§4.9')],
  'es.orth.i-y': [ngle('§4.9'), dpd('leer')],
  'es.orth.i-absorbed': ngle('§4.9'),
  'es.orth.initial-diphthong': [{ work: 'orto', locator: unread('the letters h and y') }, ngle('§4.10')],
  'es.orth.g-diphthong': { work: 'orto', locator: unread('the diaeresis') },
  'es.orth.accent-hiatus': [orto('§3.4.2', 'palabras-con-hiato'), dpdTilde('§2.2.2')],
  'es.orth.both-stress': [ngle('§4.9'), { work: 'aml-minucias', locator: 'licuo y licúo' }],
  'es.orth.accent-general': [orto('§3.4.1'), dpdTilde('§1.1')],
  'es.orth.monosyllable': [orto('§3.4.3'), { work: 'orto-novedades', locator: 'item 4' }],
  'es.orth.diacritic': [orto('§3.4.3'), dpdTilde('§3.1')],
  'es.clause.subject': ngle('§4.4'),
  'es.clause.que': ngle('§4.5'),
  'es.periphrasis.perfect': models,
  'es.periphrasis.pluperfect': models,
  'es.periphrasis.past-anterior': models,
  'es.periphrasis.future-perfect': models,
  'es.periphrasis.conditional-perfect': models,
  'es.periphrasis.subjunctive-perfect': models,
  'es.periphrasis.subjunctive-pluperfect': models,
  'es.periphrasis.subjunctive-future-perfect': [models, gtg('futuro compuesto de subjuntivo', 'futuro-compuesto-de-subjuntivo')],
  'es.periphrasis.infinitive-perfect': models,
  'es.periphrasis.gerund-perfect': models,
  'es.periphrasis.negative-imperative': gtg('imperativo', 'imperativo'),
  'es.clause.proclitic': clitics,
  'es.clause.enclitic': clitics,
  'es.clause.enclitic-d-drop': [clitics, iros],
  'es.clause.enclitic-s-drop': clitics,
  'es.clause.enclitic-accent': [orto('§3.4.5', 'formas-verbales-con-pronombres-cl%C3%ADticos'), dpdTilde('§4.3')],
  'es.clause.iros': [iros, ngle('§4.13i')],
  'es.avail.impersonal': [ngle('§4.14'), dpd('llover')],
  'es.avail.defective': [ngle('§4.14'), dpd('soler'), dpd('concernir'), dpd('balbucir')],
  'es.avail.no-imperative': dpd('haber'),
} as const satisfies Record<SpanishRuleId, Citation | readonly Citation[]>;

/** Rules whose only source the implementer could read is a secondary copy of an RAE text (see the header). */
export const secondaryOnly: ReadonlySet<SpanishRuleId> = new Set<SpanishRuleId>([
  'es.classify.restore-accent', 'es.orth.accent-hiatus', 'es.orth.accent-general', 'es.orth.monosyllable', 'es.orth.diacritic',
  'es.clause.enclitic-accent',
]);
