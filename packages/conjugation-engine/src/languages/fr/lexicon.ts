/** Lexical facts that spelling cannot predict: auxiliaries, pronominal use, aspirated h, restricted persons. */

export const etreVerbs: ReadonlySet<string> = new Set([
  'aller', 'arriver', 'entrer', 'rentrer', 'rester', 'tomber', 'retomber',
  'naître', 'renaître', 'mourir', 'décéder', 'venir', 'advenir', 'devenir',
  'intervenir', 'parvenir', 'provenir', 'revenir', 'survenir', 'échoir',
  'partir', 'repartir', 'sortir', 'ressortir',
]);

export const dualAuxiliary: ReadonlySet<string> = new Set([
  'choir', 'croître', 'déchoir', 'faillir', 'accourir', 'convenir', 'descendre', 'monter', 'remonter',
  'passer', 'repasser', 'retourner', 'rentrer', 'sortir', 'ressortir', 'demeurer',
]);

export const knownAvoirVerbs: ReadonlySet<string> = new Set([
  'aimer', 'apprécier', 'assiéger', 'broyer', 'créer', 'céder', 'finir', 'jeter',
  'manger', 'modeler', 'payer', 'peser', 'placer', 'acheter', 'appeler', 'laver', 'parler',
  'asservir', 'interpeller',
]);

export const indirectReflexives: ReadonlySet<string> = new Set(['parler', 'téléphoner', 'mentir', 'nuire', 'succéder', 'sourire']);
export const essentialReflexives: ReadonlySet<string> = new Set(['méfier', 'souvenir', 'enfuir', 'abstenir', 'évanouir', 'repentir']);
export const aspiratedH: ReadonlySet<string> = new Set(['haïr', 'hacher', 'haleter', 'hanter', 'harceler', 'hâter', 'hisser', 'huer', 'hurler']);

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
