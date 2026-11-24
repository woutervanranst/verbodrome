/**
 * The works the French rules cite, and the citation of each rule (GD §1). Every page cited here was opened when the
 * rule was implemented. *Le Bon Usage* is listed but cited nowhere: its § numbers were not checked in a copy.
 *
 * `frenchCitations` grows task by task while the grammar runs in shadow mode: a rule is cited in the task that
 * implements it, together with its messages, and never with a placeholder.
 */
import type { Citation, Work } from '../../core/sources.js';
import type { FrenchRuleId } from './rules.js';

export const frenchWorks = {
  academie: {
    id: 'academie', title: 'Dictionnaire de l’Académie française, 9e édition', author: 'Académie française', year: 2024,
    url: 'https://www.dictionnaire-academie.fr/',
  },
  jo1990: {
    id: 'jo1990', title: 'Les rectifications de l’orthographe (Journal officiel, Documents administratifs n° 100)',
    author: 'Conseil supérieur de la langue française', year: 1990,
    url: 'https://www.academie-francaise.fr/sites/academie-francaise.fr/files/rectifications.pdf',
  },
  'academie-annexe': {
    id: 'academie-annexe', title: 'Rectifications de l’orthographe (annexe du Dictionnaire)', author: 'Académie française',
    url: 'https://www.dictionnaire-academie.fr/annexes/rectifications-orthographe.html',
  },
  oqlf: {
    id: 'oqlf', title: 'Banque de dépannage linguistique', author: 'Office québécois de la langue française',
    url: 'https://vitrinelinguistique.oqlf.gouv.qc.ca/banque-de-depannage-linguistique',
  },
  cnrtl: { id: 'cnrtl', title: 'Trésor de la langue française informatisé', author: 'CNRTL', url: 'https://www.cnrtl.fr/definition/' },
  'bon-usage': { id: 'bon-usage', title: 'Le Bon Usage, 16e édition', author: 'Maurice Grevisse, André Goosse', year: 2016 },
} as const satisfies Record<string, Work>;

/** The OQLF pages cited, by their stable number; each URL is the page's canonical address. */
const oqlfPages = {
  21737: 'lorthographe/elision-et-apostrophe/elision-obligatoire',
  21745: 'lorthographe/elision-et-apostrophe/elision-interdite',
  22915: 'la-grammaire/le-verbe/modes/distinction-entre-le-participe-present-et-ladjectif-participe',
  22940: 'la-grammaire/le-verbe/accord-du-participe-passe/avec-lauxiliaire-etre/accord-du-participe-passe-des-verbes-essentiellement-pronominaux',
  22942: 'la-grammaire/le-verbe/accord-du-participe-passe/avec-lauxiliaire-etre/accord-du-participe-passe-des-verbes-occasionnellement-pronominaux',
  23165: 'lorthographe/rectifications-de-lorthographe/rectifications-liees-aux-accents-et-au-trema/rectifications-liees-au-remplacement-de-laccent-aigu-par-laccent-grave',
  23166: 'lorthographe/rectifications-de-lorthographe/rectifications-liees-aux-accents-et-au-trema/rectifications-liees-a-laccent-circonflexe',
  23169: 'lorthographe/rectifications-de-lorthographe/rectifications-liees-aux-consonnes-doubles/rectifications-liees-a-la-conjugaison-des-verbes-en-eler-et-en-eter',
  23701: 'lorthographe/accents-trema-et-cedille/accent-circonflexe/laccent-circonflexe-dans-les-formes-verbales',
  23838: 'la-grammaire/le-verbe/conjugaison/emplois-du-verbe-asseoir',
  24137: 'la-grammaire/le-verbe/conjugaison/formes-du-conditionnel',
  24195: 'la-grammaire/le-verbe/conjugaison/formes-de-limparfait',
  24203: 'la-grammaire/le-verbe/conjugaison/formes-de-limperatif',
  24206: 'la-grammaire/les-pronoms/pronoms-personnels/pronoms-personnels-employes-avec-un-verbe-a-limperatif',
  24207: 'la-grammaire/le-verbe/conjugaison/formes-du-passe-simple',
  24212: 'la-grammaire/le-verbe/conjugaison/radical-des-verbes-reguliers-au-present-de-lindicatif',
  24213: 'la-grammaire/le-verbe/conjugaison/terminaison-des-verbes-reguliers-et-irreguliers-au-present-de-lindicatif',
  24214: 'la-grammaire/le-verbe/conjugaison/radical-des-verbes-irreguliers-au-present-de-lindicatif',
  24221: 'la-grammaire/le-verbe/accord-du-participe-passe/avec-lauxiliaire-avoir/synthese-des-regles-daccord-du-participe-passe-employe-avec-avoir',
  24222: 'la-grammaire/le-verbe/accord-du-participe-passe/avec-lauxiliaire-etre/synthese-des-regles-daccord-du-participe-passe-employe-avec-etre',
  24237: 'la-grammaire/le-verbe/conjugaison/formes-du-subjonctif',
  24654: 'la-grammaire/le-verbe/conjugaison/verbes-reguliers-et-irreguliers',
  24655: 'la-grammaire/le-verbe/conjugaison/formes-du-futur-simple',
} as const;

/** A page of the OQLF's Banque de dépannage linguistique. */
const oqlf = (page: keyof typeof oqlfPages, locator: string): Citation =>
  ({ work: 'oqlf', locator, url: `https://vitrinelinguistique.oqlf.gouv.qc.ca/${page}/${oqlfPages[page]}` });

/** The Académie's conjugation table of the verb whose entry is `id` (A9xNNNN). */
const conjugation = (id: string, verb: string): Citation =>
  ({ work: 'academie', locator: `${verb}, conjugaison`, url: `https://www.dictionnaire-academie.fr/conjuguer/${id}` });

/** The Académie's entry `id` (A9xNNNN). */
const entry = (id: string, verb: string): Citation =>
  ({ work: 'academie', locator: `article ${verb}`, url: `https://www.dictionnaire-academie.fr/article/${id}` });

export const frenchCitations: Partial<Record<FrenchRuleId, Citation | readonly Citation[]>> = {
  'fr.clause.subject': [conjugation('A9C1222', 'céder'), oqlf(24203, 'Formes de l’impératif, introduction')],
  'fr.clause.subject-gender': [oqlf(24222, 'Synthèse des règles d’accord'), conjugation('A9C1222', 'céder')],
  'fr.clause.impersonal-subject': entry('A9F0145', 'falloir'),
  'fr.clause.que': [conjugation('A9C1222', 'céder'), oqlf(24237, 'Le subjonctif présent')],
  'fr.clause.gerund-en': oqlf(22915, 'Participe présent'),
  'fr.clause.reflexive-pronoun': [conjugation('A9A2823', 'asseoir (voix pronominale)'), oqlf(22942, 'Le pronom réfléchi')],
  'fr.clause.reflexive-imperative': [oqlf(24206, 'Trait d’union'), conjugation('A9A2823', 'asseoir (voix pronominale)')],
  'fr.clause.participle-forms': conjugation('A9C1222', 'céder'),
  'fr.clause.invariable-participle': [conjugation('A9D3072', 'dormir'), conjugation('A9F0145', 'falloir')],
};
