/** Lexical facts that spelling cannot predict: auxiliaries, pronominal use, aspirated h, restricted persons. */

export const etreVerbs: ReadonlySet<string> = new Set([
  'aller', 'arriver', 'entrer', 'rentrer', 'rester', 'tomber', 'retomber',
  'naître', 'renaître', 'mourir', 'décéder', 'venir', 'advenir', 'devenir',
  'intervenir', 'parvenir', 'provenir', 'revenir', 'survenir', 'échoir', 'redevenir',
  'partir', 'repartir', 'sortir', 'ressortir',
]);

export const dualAuxiliary: ReadonlySet<string> = new Set([
  'choir', 'croître', 'déchoir', 'accourir', 'convenir', 'descendre', 'monter', 'remonter',
  'passer', 'repasser', 'retourner', 'rentrer', 'sortir', 'ressortir', 'demeurer',
  // « avoir ou être » in their Académie tables (fix wave, 2026-11-27).
  'paraître', 'apparaître', 'réapparaître', 'disparaître', 'éclore', 'redescendre', 'ressusciter',
]);

/**
 * Verbs whose compound tenses take avoir, each checked in its Académie conjugation table (the passé composé it prints;
 * stint 1 and the fix wave, 2026-11-25/27), plus the snapshot's productive verbs the legacy lexicon listed. A verb not
 * listed here, not pronominal and not on the être or dual lists has its avoir recorded as an assumption.
 */
export const knownAvoirVerbs: ReadonlySet<string> = new Set([
  'absoudre', 'accroître', 'acheter', 'acquérir', 'aimer', 'appeler', 'apprécier', 'assaillir', 'asseoir',
  'asservir', 'assiéger', 'atteindre', 'avoir', 'battre', 'boire', 'bouillir', 'braire', 'broyer', 'bruire',
  'cacheter', 'celer', 'circoncire', 'circonvenir', 'clore', 'comprendre', 'compromettre', 'conclure', 'conduire',
  'confire', 'connaître', 'construire', 'coudre', 'courir', 'couvrir', 'craindre', 'croire', 'créer', 'cueillir',
  'cuire', 'céder', 'devoir', 'dire', 'dissoudre', 'dormir', 'déceler', 'décrire', 'démentir', 'enclore', 'endormir',
  'envoyer', 'exclure', 'faillir', 'faire', 'falloir', 'finir', 'foutre', 'frire', 'fuir', 'haleter', 'harceler', 'haïr', 'inclure',
  'inscrire', 'interdire', 'interpeller', 'jeter', 'joindre', 'laver', 'lire', 'luire', 'manger', 'maudire',
  'mentir', 'mettre', 'modeler', 'moudre', 'mouvoir', 'méfaire', 'nuire', 'occire', 'ouvrir', 'ouïr', 'parler',
  'payer', 'paître', 'peindre', 'peler', 'peser', 'placer', 'plaindre', 'plaire', 'pleuvoir', 'pourvoir', 'pouvoir',
  'prendre', 'prévaloir', 'prévoir', 'raire', 'rassir', 'rebattre', 'receler', 'recevoir', 'redire', 'repaître',
  'rire', 'résoudre', 'savoir', 'sentir', 'servir', 'sourire', 'suffire', 'suivre', 'surseoir', 'taire', 'tenir',
  'traire', 'vaincre', 'valoir', 'vivre', 'voir', 'vouloir', 'vêtir', 'écrire', 'émouvoir', 'être',
]);

export const indirectReflexives: ReadonlySet<string> = new Set(['parler', 'téléphoner', 'mentir', 'nuire', 'succéder', 'sourire']);
export const essentialReflexives: ReadonlySet<string> = new Set(['méfier', 'souvenir', 'enfuir', 'abstenir', 'évanouir', 'repentir']);
/**
 * Verbs whose initial h is aspirated: each table at the Académie reads « Ce verbe ne fait pas l'élision ni la liaison
 * (H aspiré) » (9th edition; handicaper and harceler 10th, read 2026-11-27). Any other initial h is assumed mute.
 */
export const aspiratedH: ReadonlySet<string> = new Set([
  'hâbler', 'hacher', 'haïr', 'haler', 'hâler', 'haleter', 'handicaper', 'hanter', 'happer', 'haranguer', 'harasser',
  'harceler', 'harnacher', 'harponner', 'hasarder', 'hâter', 'hausser', 'héler', 'hennir', 'hérisser', 'heurter',
  'hiérarchiser', 'hisser', 'hocher', 'honnir', 'hoqueter', 'houspiller', 'huer', 'humer', 'hurler',
]);

export interface LexicalRestriction {
  readonly thirdPersonOnly?: boolean;
  readonly noImperative?: boolean;
}

/** Restrictions of individual verbs whose model has the full paradigm (advenir follows venir). */
export const restrictions: Readonly<Record<string, LexicalRestriction>> = {
  advenir: { thirdPersonOnly: true, noImperative: true },
  ensuivre: { thirdPersonOnly: true },
};

/** Maps 1990 spellings of an infinitive to the traditional spelling that identifies the verb. */
export function canonicalLemma(lemma: string): string {
  return lemma
    .replace(/assoir$/u, 'asseoir').replace(/sursoir$/u, 'surseoir')
    .replace(/interpeler$/u, 'interpeller')
    .replace(/([ao])itre$/u, '$1ître');
}
