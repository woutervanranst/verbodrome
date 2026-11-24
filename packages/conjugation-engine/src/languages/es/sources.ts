/**
 * The works the Spanish pack cites and the citation of each rule.
 *
 * Status of the sources (24 Nov 2026): rae.es and dle.rae.es answer HTTP 403 to automated fetching, and no browser was
 * connected for a manual check, so every NGLE, Ortografía, DLE, DPD and GTG locator below rests on the grammar design's
 * search snippets and copies, not on a page read by the implementer. The exceptions are the secondary copies marked
 * "read" below and the RAE note on iros, which was fetched and read in full. `secondaryOnly` lists the rules whose only
 * source that was read is a secondary copy of an RAE text.
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

/** The citation of each rule, filled in as the rules are added. */
export const spanishCitations = {} as const satisfies Record<SpanishRuleId, Citation | readonly Citation[]>;

/** Rules whose only source the implementer could read is a secondary copy of an RAE text (see the header). */
export const secondaryOnly: ReadonlySet<SpanishRuleId> = new Set<SpanishRuleId>([]);
