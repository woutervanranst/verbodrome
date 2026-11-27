/**
 * The Spanish lexicon: irregular, defective and participle entries, the stem-vowel alternation list, the stress lists
 * and the side lists the classifier reads. Data only; `classify.ts` and `stems.ts` read it.
 *
 * Verification (24 Nov 2026): the authority for every lemma is its DLE conjugation table (https://dle.rae.es/<lemma>)
 * and, where marked, its DPD entry (https://www.rae.es/dpd/<lemma>). Both sites answered HTTP 403 to automated
 * fetching and no browser was connected for a manual check, so no lemma below has been verified against them:
 * `verification.ts` records, lemma by lemma, the DLE page to check and the pages that were read instead. The variant lists of raer,
 * roer, yacer, satisfacer, erguir, predecir and ir, and the participles of imprimir and proveer, were cross-checked
 * against the English Wiktionary conjugation tables (a secondary source, which does not make them verified); raer
 * follows that check (raigo / rayo) instead of the grammar design's raigo / rao. Nothing here is copied from the corpus.
 *
 * Accents are never stored in stems or endings: only whole-word forms (`cells`) carry their tildes.
 */
import type { FormVariant } from '../../types.js';

export type Alternation = 'e-ie' | 'o-ue' | 'u-ue' | 'i-ie' | 'e-i';

/** A lexical variant: its value and the tags its forms carry. */
export interface Variant<T> {
  readonly value: T;
  readonly pattern: string;
  readonly usage?: FormVariant['usage'];
  readonly region?: string;
  readonly condition?: string;
}


export interface SpanishEntry {
  /** The model shown to learners (`analysis.classification`); default: the lemma itself. */
  readonly model?: string;
  /** The stem-vowel alternation; variants for a verb with two (erguir) or with a variant without one (errar: erro; null). */
  readonly alternation?: Alternation | readonly Variant<Alternation | null>[];
  /** -ir verbs whose e or o does not rise to i or u (discernir, adquirir). */
  readonly raising?: false;
  readonly stress?: 'hiatus' | 'diphthong' | 'both';
  /** The stored stem of the 1sg present indicative, which the present subjunctive is built on (teng-o, teng-a). */
  readonly present1?: string | readonly Variant<string>[];
  /** The present subjunctive stem, only where it differs from `present1` (saber: sep-a). */
  readonly subjunctive?: string;
  /** The strong preterite stem (tuv-e). */
  readonly preterite?: string;
  /** The preterite takes the -er/-ir endings (dar: di, diste, dio). */
  readonly preteriteConjugation?: 'er';
  /** The future and conditional stem, where it is not the infinitive (tendr-é). */
  readonly future?: string | readonly Variant<string>[];
  /**
   * The regular form is in use too beside a stored irregular one (`first` or `second` in output order): the lexicon
   * holds only the irregular value and the rules derive the regular one (predeciré beside prediré, yace beside yaz, roo
   * beside roigo and royo).
   */
  readonly regularToo?: { readonly future?: 'first' | 'second'; readonly imperative2sg?: 'first' | 'second'; readonly present1?: 'first' | 'second' };
  /** The whole tú command, where it is not the él form of the present (pon). */
  readonly imperative2sg?: string | readonly Variant<string>[];
  /** The irregular participle (puesto). */
  readonly participle?: string;
  /**
   * The regular participle is in use too, also after haber (NGLE §4.12: freír, imprimir, proveer): the stored one comes
   * first and the regular one is derived by the participle rule.
   */
  readonly participleDoublet?: true;
  readonly gerund?: string;
  /** The stem of the root-stressed forms where it keeps the h of its base word (desosar: deshues-, from hueso). */
  readonly hueStem?: string;
  /** The imperfect stem (ver: ve-ía). */
  readonly imperfect?: string;
  /** The stem of every form, where it is not the infinitive minus its ending (podrir: pudr-). */
  readonly root?: string;
  /** Further infinitives of the same verb, with the tags of their forms (pudrir: podrir). */
  readonly infinitiveVariants?: readonly Variant<string>[];
  /** The root-stressed forms are stressed on the ending (estar: estás, esté; dar: das). */
  readonly endingStress?: true;
  /** Adds y before an ending that does not begin with i, like the -uir verbs (oír: oyes). */
  readonly yInsertion?: true;
  /** Whole words, keyed `mood.tense.<person><sg|pl>`, written with their tildes. */
  readonly cells?: Readonly<Record<string, string | readonly Variant<string>[]>>;
  /** Used only in the third person singular (weather verbs). */
  readonly impersonal?: true;
  /**
   * Lacks some forms (NGLE §4.14): soler the future tenses, conditional and imperative (grammar design §5.6); concernir
   * and the like every form but the third persons; balbucir the forms with -zc-.
   */
  readonly defective?: 'soler' | 'third-person' | 'balbucir';
  /** Has no imperative (haber as an auxiliary). */
  readonly noImperative?: true;
}

const six = (mood: string, tense: string, words: string): Record<string, string> => {
  const forms = words.split(' ');
  const keys = ['1sg', '2sg', '3sg', '1pl', '2pl', '3pl'];
  return Object.fromEntries(keys.map((key, index) => [`${mood}.${tense}.${key}`, forms[index]!]));
};

const fuiFueron = six('indicative', 'simple_past', 'fui fuiste fue fuimos fuisteis fueron');

/** Irregular, defective and participle entries (grammar design §5.2). */
export const entries: Readonly<Record<string, SpanishEntry>> = {
  ser: {
    cells: { ...six('indicative', 'present', 'soy eres es somos sois son'), ...six('indicative', 'imperfect', 'era eras era éramos erais eran'), ...fuiFueron },
    subjunctive: 'se', imperative2sg: 'se',
  },
  ir: {
    cells: {
      ...six('indicative', 'present', 'voy vas va vamos vais van'), ...six('indicative', 'imperfect', 'iba ibas iba íbamos ibais iban'), ...fuiFueron,
      'imperative.present.1pl': [{ value: 'vamos', pattern: 'vamos' }, { value: 'vayamos', pattern: 'vayamos' }],
    },
    subjunctive: 'vay', imperative2sg: 've', gerund: 'yendo',
  },
  haber: { cells: six('indicative', 'present', 'he has ha hemos habéis han'), subjunctive: 'hay', preterite: 'hub', future: 'habr', noImperative: true },
  estar: { cells: { 'indicative.present.1sg': 'estoy' }, endingStress: true, preterite: 'estuv' },
  dar: { cells: { 'indicative.present.1sg': 'doy' }, endingStress: true, preteriteConjugation: 'er' },
  ver: { present1: 've', imperfect: 've', participle: 'visto' },
  hacer: { present1: 'hag', preterite: 'hic', future: 'har', imperative2sg: 'haz', participle: 'hecho' },
  satisfacer: {
    present1: 'satisfag', preterite: 'satisfic', future: 'satisfar', participle: 'satisfecho',
    imperative2sg: 'satisfaz', regularToo: { imperative2sg: 'second' },
  },
  decir: { alternation: 'e-i', present1: 'dig', preterite: 'dij', future: 'dir', imperative2sg: 'di', participle: 'dicho' },
  predecir: {
    alternation: 'e-i', present1: 'predig', preterite: 'predij', participle: 'predicho',
    // DPD «predecir» (unverified): both futures, the regular one the more common today.
    future: 'predir', regularToo: { future: 'first' },
  },
  contradecir: {
    alternation: 'e-i', present1: 'contradig', preterite: 'contradij', participle: 'contradicho',
    future: 'contradir', regularToo: { future: 'second' },
  },
  desdecir: {
    alternation: 'e-i', present1: 'desdig', preterite: 'desdij', participle: 'desdicho',
    future: 'desdir', regularToo: { future: 'second' },
  },
  antedecir: { alternation: 'e-i', present1: 'antedig', preterite: 'antedij', participle: 'antedicho', future: 'antedir', regularToo: { future: 'second' } },
  interdecir: { alternation: 'e-i', present1: 'interdig', preterite: 'interdij', participle: 'interdicho', future: 'interdir', regularToo: { future: 'second' } },
  // yerro everywhere; the regular erro in large parts of America (DPD «errar», unverified).
  errar: { alternation: [{ value: 'e-ie', pattern: 'ye' }, { value: null, pattern: 'regular', region: 'America' }] },
  // The regular conjugation is the usual one now; engrueso is also in use (DPD «engrosar», unverified).
  engrosar: { alternation: [{ value: null, pattern: 'regular' }, { value: 'o-ue', pattern: 'ue' }] },
  bendecir: { alternation: 'e-i', present1: 'bendig', preterite: 'bendij' },
  maldecir: { alternation: 'e-i', present1: 'maldig', preterite: 'maldij' },
  poner: { present1: 'pong', preterite: 'pus', future: 'pondr', imperative2sg: 'pon', participle: 'puesto' },
  tener: { alternation: 'e-ie', present1: 'teng', preterite: 'tuv', future: 'tendr', imperative2sg: 'ten' },
  venir: { alternation: 'e-ie', present1: 'veng', preterite: 'vin', future: 'vendr', imperative2sg: 'ven' },
  querer: { alternation: 'e-ie', preterite: 'quis', future: 'querr' },
  poder: { alternation: 'o-ue', preterite: 'pud', future: 'podr', gerund: 'pudiendo' },
  saber: { cells: { 'indicative.present.1sg': 'se' }, subjunctive: 'sep', preterite: 'sup', future: 'sabr' },
  caber: { present1: 'quep', preterite: 'cup', future: 'cabr' },
  andar: { preterite: 'anduv' },
  traer: { present1: 'traig', preterite: 'traj' },
  caer: { present1: 'caig' },
  oír: { present1: 'oig', yInsertion: true },
  salir: { present1: 'salg', future: 'saldr', imperative2sg: 'sal' },
  valer: { present1: 'valg', future: 'valdr' },
  asir: { present1: 'asg' },
  yacer: {
    present1: [{ value: 'yazc', pattern: 'zc' }, { value: 'yazg', pattern: 'zg' }, { value: 'yag', pattern: 'g' }],
    imperative2sg: 'yaz', regularToo: { imperative2sg: 'first' },
  },
  placer: {},
  roer: { present1: [{ value: 'roig', pattern: 'ig' }, { value: 'roy', pattern: 'y' }], regularToo: { present1: 'first' } },
  raer: { present1: [{ value: 'raig', pattern: 'ig' }, { value: 'ray', pattern: 'y' }] },
  erguir: { alternation: [{ value: 'e-ie', pattern: 'ye' }, { value: 'e-i', pattern: 'i' }] },
  // One verb with two infinitives (DPD «pudrir»): pudr- in every form except the participle podrido.
  pudrir: { participle: 'podrido', infinitiveVariants: [{ value: 'podrir', pattern: 'podrir' }] },
  podrir: { model: 'pudrir', root: 'pudr', participle: 'podrido', infinitiveVariants: [{ value: 'podrir', pattern: 'podrir' }] },
  freír: { model: 'reír', alternation: 'e-i', participle: 'frito', participleDoublet: true },
  morir: { alternation: 'o-ue', participle: 'muerto' },
  abrir: { participle: 'abierto' },
  cubrir: { participle: 'cubierto' },
  romper: { participle: 'roto' },
  imprimir: { participle: 'impreso', participleDoublet: true },
  proveer: { participle: 'provisto', participleDoublet: true },
  volver: { alternation: 'o-ue', participle: 'vuelto' },
  resolver: { alternation: 'o-ue', participle: 'resuelto' },
  absolver: { model: 'resolver', alternation: 'o-ue', participle: 'absuelto' },
  disolver: { model: 'resolver', alternation: 'o-ue', participle: 'disuelto' },
  adquirir: { alternation: 'i-ie', raising: false },
  inquirir: { model: 'adquirir', alternation: 'i-ie', raising: false },
  discernir: { alternation: 'e-ie', raising: false },
  concernir: { model: 'discernir', alternation: 'e-ie', raising: false, defective: 'third-person' },
  cernir: { model: 'discernir', alternation: 'e-ie', raising: false },
  // des- + a base whose own forms begin with hue- (hueso, huevo): the h stays where the stem is stressed (DLE, unverified).
  desosar: { model: 'contar', alternation: 'o-ue', hueStem: 'deshues' },
  desovar: { model: 'contar', alternation: 'o-ue', hueStem: 'deshuev' },
  // Used only in the third persons (DPD «concernir», «atañer»; NGLE §4.14).
  atañer: { defective: 'third-person' },
  acaecer: { defective: 'third-person' },
  acontecer: { defective: 'third-person' },
  // No forms with -zc- (balbuzco): balbucear replaces them (DPD «balbucir»).
  balbucir: { defective: 'balbucir' },
  soler: { alternation: 'o-ue', defective: 'soler' },
  llover: { alternation: 'o-ue', impersonal: true },
  nevar: { alternation: 'e-ie', impersonal: true },
  granizar: { model: 'amar', impersonal: true },
  lloviznar: { model: 'amar', impersonal: true },
  diluviar: { model: 'amar', impersonal: true },
  relampaguear: { model: 'amar', impersonal: true },
};

/** Lemmas with two complete conjugations and different meanings (grammar design §5.2, last paragraph). */
export const twoParadigms: Readonly<Record<string, readonly { readonly entry: SpanishEntry; readonly pattern: string; readonly condition: string }[]>> = {
  apostar: [
    { entry: { alternation: 'o-ue' }, pattern: 'o-ue', condition: 'to bet' },
    { entry: {}, pattern: 'regular', condition: 'to post (a guard)' },
  ],
  aterrar: [
    { entry: { alternation: 'e-ie' }, pattern: 'e-ie', condition: 'to cover with earth' },
    { entry: {}, pattern: 'regular', condition: 'to terrify' },
  ],
  atestar: [
    { entry: { alternation: 'e-ie' }, pattern: 'e-ie', condition: 'to cram' },
    { entry: {}, pattern: 'regular', condition: 'to testify' },
  ],
};

const listed = (alternation: Alternation, lemmas: string): Record<string, Alternation> =>
  Object.fromEntries(lemmas.split(/\s+/u).filter(Boolean).map(lemma => [lemma, alternation]));

/**
 * Stem-vowel alternation, lexical and never inherited by a prefix (grammar design §5.3). The verbs of §5.2 that
 * alternate carry it in their entry.
 */
export const alternations: Readonly<Record<string, Alternation>> = {
  ...listed('e-ie', `acertar alentar apacentar apretar arrendar asentar aserrar atravesar aventar calentar cegar cerrar comenzar
    concertar confesar decentar desconcertar desenterrar despertar desplegar empedrar empezar encerrar encomendar enmendar
    enterrar escarmentar fregar gobernar helar herrar invernar manifestar mentar merendar negar pensar plegar quebrar
    recomendar regar renegar reventar segar sembrar sentar serrar sosegar soterrar temblar tentar tropezar
    denegar desterrar acrecentar recalentar desalentar replegar restregar remendar deshelar desmembrar ensangrentar`),
  ...listed('e-ie', `ascender atender cerner condescender contender defender descender encender entender extender heder hender
    perder tender trascender verter desatender sobrentender sobreentender desentender malentender distender`),
  ...listed('e-ie', `adherir advertir arrepentir asentir consentir controvertir convertir desmentir diferir digerir divertir herir
    hervir inferir ingerir invertir mentir pervertir preferir presentir proferir referir requerir resentir revertir sentir
    sugerir transferir zaherir interferir conferir deferir disentir subvertir reconvertir malherir`),
  ...listed('o-ue', `acordar acostar almorzar aprobar avergonzar colar colgar comprobar concordar consolar contar costar degollar
    demostrar descontar desollar encontrar esforzar forzar mostrar poblar probar recordar recostar reforzar
    renovar reprobar rodar rogar soldar soltar sonar soñar tostar trocar tronar volar volcar
    holgar agorar descolgar desaprobar reencontrar recontar resonar desconsolar revolcar amolar desolar descollar`),
  ...listed('o-ue', 'cocer conmover doler escocer moler morder mover oler promover remover retorcer torcer demoler remorder condoler destorcer'),
  ...listed('o-ue', 'dormir'),
  ...listed('e-i', `ceñir colegir competir concebir conseguir constreñir corregir derretir desteñir despedir elegir embestir expedir
    gemir henchir impedir investir medir pedir perseguir proseguir reelegir regir rendir reñir repetir revestir seguir servir
    teñir travestir vestir desvestir reexpedir`),
  ...listed('u-ue', 'jugar'),
};

const words = (text: string): readonly string[] => text.split(/\s+/u).filter(Boolean);

/** -iar verbs and root vowel groups whose close vowel is stressed on its own: envío, aíslo, reúno (§5.4). */
export const hiatusVerbs: ReadonlySet<string> = new Set(words(`
  aliar ampliar ansiar arriar ataviar averiar aviar chirriar confiar contrariar desafiar desataviar descarriar
  desconfiar desliar desvariar desviar enfriar enviar escalofriar espiar esquiar estriar expiar extasiar extraviar
  hastiar inventariar malcriar porfiar reenviar resfriar rociar vaciar variar amnistiar gloriar
  autografiar biografiar cablegrafiar caligrafiar cartografiar cinematografiar coreografiar fotografiar mecanografiar
  radiografiar taquigrafiar telegrafiar
  anticuar
  ahijar ahilar ahincar ahitar ahuchar ahumar ahusar airar aislar sahumar amohinar arcaizar aullar aunar aupar cohibir descafeinar
  desenraizar embaular enraizar europeizar hebraizar homogeneizar judaizar maullar prohibir prohijar rehilar rehuir rehundir
  rehusar reunir sobrehilar`));

/** Verbs with both stresses, the diphthong one first (agrio / agrío; evacuo / evacúo). */
export const bothStressVerbs: ReadonlySet<string> = new Set(words('agriar auxiliar expatriar historiar paliar repatriar vidriar adecuar evacuar licuar'));

/** Vowel + -cer/-cir verbs without zc (§4.2): mezo, cuezo; the others have a stored 1sg stem. */
export const zcExceptions: ReadonlySet<string> = new Set(words(`hacer deshacer rehacer contrahacer satisfacer cocer escocer recocer
  mecer remecer decir bendecir maldecir predecir contradecir desdecir antedecir interdecir yacer`));

/** Strong bases of five letters or more, whose irregularity a prefixed verb inherits (§3.3). */
export const strongBases: readonly string[] = words('andar caber hacer poner querer saber salir tener traer valer venir');

/**
 * The closed list of prefixes through which a strong base passes on its irregularity (§3.3), longest first. `subs` is
 * added to the design's list so that substraer inherits like sustraer.
 */
export const prefixes: readonly string[] = words(`a ab abs ad ante bien circun co com con contra de des di dis e en entre equi ex
  im in inter man mal o ob pos pre pro re retro sobre sos su sub subs super sus tras trans yuxta`).slice().sort((a, b) => b.length - a.length);

/**
 * Lemmas that look like a prefix + strong base but do not inherit: decir's derivatives have entries of their own,
 * satisfacer is listed, and comandar is regular (comandé), not com + andar.
 */
export const noInherit: ReadonlySet<string> = new Set(words('decir satisfacer comandar'));

/**
 * Derivatives listed one by one with the verb they are conjugated like (§3.3): the short bases, which the closed prefix
 * list does not reach, and derivatives whose stored participle or stem vowel come from their base (devuelto, recuezo).
 * The derivative takes the base's lexical data with the part before the base as its prefix.
 */
export const listedDerivatives: Readonly<Record<string, string>> = {
  prever: 'ver', entrever: 'ver', rever: 'ver',
  decaer: 'caer', recaer: 'caer',
  releer: 'leer',
  descreer: 'creer',
  corroer: 'roer',
  entreabrir: 'abrir', reabrir: 'abrir',
  descubrir: 'cubrir', encubrir: 'cubrir', recubrir: 'cubrir',
  devolver: 'volver', envolver: 'volver', revolver: 'volver', desenvolver: 'volver',
  recocer: 'cocer',
  sofreír: 'freír', refreír: 'freír',
  reimprimir: 'imprimir',
  desproveer: 'proveer',
};

/**
 * Suffix families (§3.2 step 5): -ducir (zc and the preterite in -duj-), -scribir (participle in -scrito), and the
 * rule classes -eír (every one conjugated like reír) and -oír (every one like oír).
 */
export const families: readonly { readonly suffix: 'ducir' | 'scribir' | 'eír' | 'oír'; readonly model: string }[] = [
  { suffix: 'ducir', model: 'conducir' },
  { suffix: 'scribir', model: 'escribir' },
  { suffix: 'eír', model: 'reír' },
  { suffix: 'oír', model: 'oír' },
];

/** The monosyllables that keep a diacritic tilde, by lemma: dé (dar), sé (saber, ser). */
export const diacritics: Readonly<Record<string, string>> = { dar: 'de', saber: 'se', ser: 'se' };
