/**
 * The works the French rules cite, and the citation of each rule (GD §1). Every page cited here was opened when the
 * rule was implemented. *Le Bon Usage* is listed but cited nowhere: its § numbers were not checked in a copy.
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
  24224: 'la-grammaire/le-verbe/auxiliaires/emploi-des-auxiliaires-avoir-et-etre',
  24222: 'la-grammaire/le-verbe/accord-du-participe-passe/avec-lauxiliaire-etre/synthese-des-regles-daccord-du-participe-passe-employe-avec-etre',
  24122: 'la-grammaire/le-verbe/temps-grammaticaux/futur/le-futur-proche',
  24237: 'la-grammaire/le-verbe/conjugaison/formes-du-subjonctif',
  24584: 'la-grammaire/le-verbe/auxiliaires/tableau-synthese-de-lemploi-des-auxiliaires-avoir-et-etre',
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

/** A rule or note of the 1990 rectifications (Journal officiel). */
const jo1990 = (locator: string): Citation => ({ work: 'jo1990', locator, url: frenchWorks.jo1990.url });

/** The Académie's article and conjugation table of each verb, without a fixed address (the rule cites the verb's own). */
const verbArticle: Citation = { work: 'academie', locator: 'article et tableau de conjugaison du verbe' };

export const frenchCitations = {
  'fr.classify.reflexive': oqlf(22942, 'Verbes occasionnellement pronominaux'),
  'fr.classify.essentially-pronominal': oqlf(22940, 'Verbes essentiellement pronominaux'),
  'fr.classify.canonical-spelling': [jo1990('III, Liste H : assoir, interpeler ; II.4 : connaitre'), oqlf(23838, 'ASSEOIR et ASSOIR')],
  'fr.classify.lexicon': verbArticle,
  'fr.classify.family-suffix': verbArticle,
  'fr.classify.group': [oqlf(24654, 'Grammaire traditionnelle : trois groupes'), conjugation('A9C1222', 'céder (verbe du 1er groupe)')],
  'fr.classify.assume-regular': oqlf(24654, 'Verbes réguliers en -er : seule conjugaison productive'),
  'fr.classify.spelling-model': oqlf(24212, 'Radical des verbes réguliers'),
  'fr.classify.class-hint': oqlf(24654, 'Verbes réguliers et irréguliers'),
  'fr.classify.model-hint': verbArticle,
  'fr.classify.principal-parts-hint': [oqlf(24214, 'Radical des verbes irréguliers'), oqlf(24207, 'Passé simple')],
  'fr.classify.assume-ils-stem': [oqlf(24214, 'Radical des verbes irréguliers au présent'), oqlf(24237, 'Modification du radical au subjonctif présent')],
  'fr.classify.paradigm': [conjugation('A9P1095', 'payer'), conjugation('A9A2823', 'asseoir'), conjugation('A9F0105', 'faillir'), conjugation('A9C2105', 'choir')],
  'fr.classify.aux-etre': [oqlf(24584, 'Emploi de l’auxiliaire être'), conjugation('A9A1226', 'aller')],
  'fr.classify.aux-dual': [oqlf(24224, 'Emploi de avoir ou de être'), oqlf(24584, 'Tableau-synthèse')],
  'fr.classify.aux-avoir': oqlf(24224, 'Emploi de l’auxiliaire avoir'),
  'fr.classify.aux-pronominal': oqlf(24224, 'Verbes pronominaux'),
  'fr.classify.aux-hint': oqlf(24224, 'Emploi de avoir ou de être'),
  'fr.classify.assume-avoir': oqlf(24224, 'Emploi de l’auxiliaire avoir : la plupart des verbes intransitifs'),
  'fr.classify.indirect-reflexive': oqlf(22942, 'Le pronom réfléchi est complément indirect'),
  'fr.classify.assume-direct-reflexive': oqlf(22942, 'Le pronom réfléchi est le complément direct'),
  'fr.classify.aspirated-h': [oqlf(21745, 'Élision interdite devant le h aspiré'), { work: 'academie', locator: 'tableau de conjugaison du verbe : « H aspiré »' }],
  'fr.classify.assume-mute-h': oqlf(21737, 'Élision devant le h muet'),
  'fr.stem.group-stem': [oqlf(24212, 'Radical des verbes réguliers'), oqlf(24654, 'Verbes réguliers')],
  'fr.stem.hint': oqlf(24214, 'Radical des verbes irréguliers'),
  'fr.end.present-singular': oqlf(24213, 'Terminaisons du présent'),
  'fr.end.present-plural': oqlf(24213, 'Terminaisons du présent'),
  'fr.end.imperfect': [oqlf(24195, 'Formes de l’imparfait'), oqlf(24137, 'Formes du conditionnel')],
  'fr.end.future': oqlf(24655, 'Formes du futur simple'),
  'fr.end.simple-past': oqlf(24207, 'Formes du passé simple'),
  'fr.end.subjunctive': oqlf(24237, 'Le subjonctif présent'),
  'fr.end.subjunctive-imperfect': oqlf(24237, 'Le subjonctif imparfait'),
  'fr.end.imperative': oqlf(24203, 'Formes de l’impératif'),
  'fr.end.present-participle': [conjugation('A9C1222', 'céder (participe présent)'), oqlf(22915, 'La forme en -ant')],
  'fr.end.past-participle': [conjugation('A9C1222', 'céder (participe passé)'), oqlf(24222, 'Synthèse des règles d’accord')],
  'fr.end.infinitive': oqlf(24654, 'Terminaisons de l’infinitif'),
  'fr.orth.eler-eter': [jo1990('II.5'), oqlf(23169, 'Verbes en -eler et en -eter'), conjugation('A9A2203', 'appeler'), conjugation('A9A0377', 'acheter')],
  'fr.orth.mute-e-grave': [oqlf(24212, 'Verbes en -e.er'), oqlf(24655, 'Futur simple'), conjugation('A9A0377', 'acheter')],
  'fr.orth.closed-e-grave': [oqlf(24212, 'Verbes en -é.er'), jo1990('II.3 a'), oqlf(23165, 'Accent grave au futur et au conditionnel'), conjugation('A9C1222', 'céder')],
  'fr.orth.c-cedilla': [oqlf(24212, 'Verbes en -cer'), oqlf(24207, 'C cédille')],
  'fr.orth.g-e': [oqlf(24212, 'Verbes en -ger'), oqlf(24195, 'Verbes en -ger')],
  'fr.orth.y-to-i': [oqlf(24212, 'Verbes en -yer'), oqlf(24137, 'Verbes en -oyer, -uyer, -ayer'), conjugation('A9P1095', 'payer')],
  'fr.orth.diaeresis': [conjugation('A9H0071', 'haïr'), oqlf(24207, 'Haïr et ouïr : le tréma')],
  'fr.orth.t-after-dental': oqlf(24213, 'Radical en d, t ou c à la 3e personne du singulier'),
  'fr.orth.tt-singular': [conjugation('A9B0652', 'battre'), conjugation('A9M1992', 'mettre')],
  'fr.orth.1990-circumflex': [jo1990('II.4'), oqlf(23166, 'Accent circonflexe : rectifications')],
  'fr.stem.present-singular': [oqlf(24214, 'Radical des verbes irréguliers au présent'), oqlf(24213, 'Terminaisons -s, -s, -t ; -x, -x, -t ; -e, -es, -e')],
  'fr.stem.nous': [oqlf(24195, 'Radical de l’imparfait : celui de la 1re personne du pluriel'), oqlf(24214, 'Radical des verbes irréguliers au présent')],
  'fr.stem.ils': [oqlf(24237, 'Modification du radical au subjonctif présent'), oqlf(24214, 'Radical des verbes irréguliers au présent')],
  'fr.stem.future': [oqlf(24655, 'Formes du futur simple'), oqlf(24137, 'Formes du conditionnel')],
  'fr.stem.past': oqlf(24207, 'Terminaisons en -is, -us, -ins'),
  'fr.stem.participle': [verbArticle, oqlf(24222, 'Synthèse des règles d’accord')],
  'fr.stem.subjunctive': oqlf(24237, 'Modification du radical pour plusieurs verbes irréguliers'),
  'fr.stem.imperative-from-subjunctive': [oqlf(24203, 'Avoir, être, savoir et vouloir'), conjugation('A9S0657', 'savoir')],
  'fr.stem.participle-from-subjunctive': [conjugation('A9S0657', 'savoir (sachant)'), conjugation('A9A3461', 'avoir (ayant)')],
  'fr.stem.suppletive': [oqlf(24213, 'Avoir, être et aller ; dites, faites'), verbArticle],
  'fr.stem.listed-spelling': [conjugation('A9E1359', 'enclore : il enclôt ou enclot'), conjugation('A9E0262', 'éclore : il éclôt ou éclot')],
  'fr.orth.circumflex-before-t': [oqlf(23701, 'Il clôt, il gît, il plaît'), jo1990('II.4 : plait'), conjugation('A9G0655', 'gésir'), conjugation('A9C2658', 'clore')],
  'fr.orth.croitre-homograph': [jo1990('II.4 b : le verbe croître'), oqlf(23166, 'Exceptions : croître'), conjugation('A9C5057', 'croître')],
  'fr.orth.1990-assoir': [jo1990('III, Liste H : assoir, rassoir, sursoir'), oqlf(23838, 'ASSEOIR et ASSOIR')],
  'fr.orth.1990-sursoir-future': jo1990('III, Liste H : sursoir (l’infinitif)'),
  'fr.orth.1990-interpeler': [jo1990('III, Anomalies : interpeler'), oqlf(23169, 'Appeler, jeter et leurs dérivés, y compris interpeler')],
  'fr.orth.1990-absout': [jo1990('III, Liste : absout, absoute'), conjugation('A9A0175', 'absoudre')],
  'fr.periphrasis.perfect': [oqlf(24224, 'Avoir et être forment les temps composés'), conjugation('A9C1222', 'céder (passé composé)')],
  'fr.periphrasis.pluperfect': [oqlf(24224, 'Avoir et être forment les temps composés'), conjugation('A9C1222', 'céder (plus-que-parfait)')],
  'fr.periphrasis.past-anterior': [oqlf(24224, 'Avoir et être forment les temps composés'), conjugation('A9C1222', 'céder (passé antérieur)')],
  'fr.periphrasis.future-perfect': [oqlf(24224, 'Avoir et être forment les temps composés'), conjugation('A9C1222', 'céder (futur antérieur)')],
  'fr.periphrasis.subjunctive-past': [oqlf(24237, 'Le subjonctif passé'), conjugation('A9C1222', 'céder (subjonctif passé)')],
  'fr.periphrasis.subjunctive-pluperfect': [jo1990('II.4 a : plus-que-parfait du subjonctif'), conjugation('A9C1222', 'céder (subjonctif plus-que-parfait)')],
  'fr.periphrasis.conditional-past': [oqlf(24224, 'Avoir et être forment les temps composés'), conjugation('A9C1222', 'céder (conditionnel passé)')],
  'fr.periphrasis.conditional-past-second': jo1990('II.4 a : conditionnel passé deuxième forme'),
  'fr.periphrasis.imperative-past': [oqlf(24203, 'Impératif passé'), conjugation('A9C1222', 'céder (impératif passé)')],
  'fr.periphrasis.infinitive-past': oqlf(24224, 'Avoir et être forment les temps composés'),
  'fr.periphrasis.participle-perfect': [conjugation('A9C1222', 'céder (ayant cédé)'), oqlf(24224, 'Avoir et être forment les temps composés')],
  'fr.periphrasis.gerund-past': [oqlf(22915, 'Gérondif : en + forme en -ant'), oqlf(24224, 'Avoir et être forment les temps composés')],
  'fr.periphrasis.near-future': oqlf(24122, 'Le futur proche : aller au présent suivi d’un infinitif'),
  'fr.periphrasis.recent-past': { work: 'cnrtl', locator: 'venir, C. — Venir de + inf. : l’action exprimée par l’inf. s’est achevée très récemment', url: 'https://www.cnrtl.fr/definition/venir' },
  'fr.clause.agree-subject': oqlf(24222, 'Le participe passé employé avec être s’accorde avec le sujet'),
  'fr.clause.agree-object': [oqlf(24221, 'Accord avec le complément direct placé avant le verbe'), oqlf(22942, 'Verbes occasionnellement pronominaux')],
  'fr.clause.no-agreement-avoir': oqlf(24221, 'Sans complément direct placé avant : pas d’accord'),
  'fr.clause.no-agreement-indirect': oqlf(22942, 'Le pronom réfléchi est complément indirect : pas d’accord'),
  'fr.clause.elision': [oqlf(21737, 'Élision obligatoire'), oqlf(21745, 'Élision interdite devant le h aspiré')],
  'fr.avail.defective': [entry('A9C2658', 'clore (verbe défectif)'), entry('A9G0655', 'gésir (verbe défectif)')],
  'fr.avail.third-person-only': entry('A9S1259', 'seoir (uniquement à la 3e personne)'),
  'fr.avail.impersonal': [entry('A9F0145', 'falloir (verbe impersonnel)'), oqlf(24584, 'Verbes essentiellement impersonnels')],
  'fr.avail.no-imperative': [conjugation('A9P3829', 'pouvoir (sans impératif)'), conjugation('A9F0145', 'falloir (sans impératif)')],
  // No checked authority states this rule (Le Bon Usage was not opened); the citation is the Académie table the message
  // names, which prints the form (docs/grammar/fr.md, open decisions).
  'fr.avail.pronominal-imperative-past': conjugation('A9A2823', 'asseoir, voix pronominale : imprime l’impératif passé sois-toi assis'),
  'fr.clause.subject': [conjugation('A9C1222', 'céder'), oqlf(24203, 'Formes de l’impératif, introduction')],
  'fr.clause.subject-gender': [oqlf(24222, 'Synthèse des règles d’accord'), conjugation('A9C1222', 'céder')],
  'fr.clause.impersonal-subject': entry('A9F0145', 'falloir'),
  'fr.clause.que': [conjugation('A9C1222', 'céder'), oqlf(24237, 'Le subjonctif présent')],
  'fr.clause.gerund-en': oqlf(22915, 'Participe présent'),
  'fr.clause.reflexive-pronoun': [conjugation('A9A2823', 'asseoir (voix pronominale)'), oqlf(22942, 'Le pronom réfléchi')],
  'fr.clause.reflexive-imperative': [oqlf(24206, 'Trait d’union'), conjugation('A9A2823', 'asseoir (voix pronominale)')],
  'fr.clause.participle-forms': conjugation('A9C1222', 'céder'),
  'fr.clause.invariable-participle': [conjugation('A9D3072', 'dormir'), conjugation('A9F0145', 'falloir')],
} as const satisfies Record<FrenchRuleId, Citation | readonly Citation[]>;
