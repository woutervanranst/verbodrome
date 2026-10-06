export type PastVowel = 'a' | 'i' | 'u' | 'in';

export interface FrenchParadigm {
  readonly kind: 'er' | 'ir' | 're' | 'irregular';
  readonly singular: string;
  readonly plural: string;
  readonly thirdPlural: string;
  readonly future: string;
  readonly past: string;
  readonly pastVowel: PastVowel;
  readonly participle: string;
  readonly feminineParticiple?: string;
  readonly singularEndings?: readonly [string, string, string];
  readonly presentCells?: Readonly<Partial<Record<number, string>>>;
  readonly presentAlternatives?: Readonly<Partial<Record<number, readonly string[]>>>;
  readonly subjunctiveSingular?: string;
  readonly subjunctivePlural?: string;
  readonly subjunctivePluralAlternatives?: readonly string[];
  readonly subjunctiveCells?: Readonly<Partial<Record<number, string>>>;
  readonly imperativeCells?: Readonly<Partial<Record<number, string>>>;
  readonly imperativeAlternatives?: Readonly<Partial<Record<number, readonly string[]>>>;
  readonly presentParticiple?: string;
  readonly presentParticipleAlternatives?: readonly string[];
  readonly diaeresisPast?: boolean;
  readonly pattern?: string;
  readonly usage?: 'standard' | 'dated';
  readonly orthography?: 'rectified' | 'traditional';
  readonly futureAlternatives?: readonly string[];
  readonly lexicalFuture?: boolean;
  readonly invariableParticiple?: boolean;
}

function principal(
  singular: string, plural: string, thirdPlural: string, future: string,
  past: string, pastVowel: PastVowel, participle: string,
  extra: Partial<FrenchParadigm> = {},
): FrenchParadigm {
  return { kind: 'irregular', singular, plural, thirdPlural, future, past, pastVowel, participle, ...extra };
}

const xEndings = ['x', 'x', 't'] as const;
const erEndings = ['e', 'es', 'e'] as const;

export const frenchExceptions: Readonly<Record<string, readonly FrenchParadigm[]>> = {
  absoudre: [
    principal('absou', 'absolv', 'absolv', 'absoudr', '', 'i', 'absout', { orthography: 'rectified' }),
    principal('absou', 'absolv', 'absolv', 'absoudr', '', 'i', 'absous', { feminineParticiple: 'absoute', orthography: 'traditional' }),
  ],
  acquérir: [principal('acquier', 'acquér', 'acquièr', 'acquerr', 'acqu', 'i', 'acquis')],
  conquérir: [principal('conquier', 'conquér', 'conquièr', 'conquerr', 'conqu', 'i', 'conquis')],
  requérir: [principal('requier', 'requér', 'requièr', 'requerr', 'requ', 'i', 'requis')],
  aller: [principal('va', 'all', 'v', 'ir', 'all', 'a', 'allé', {
    presentCells: { 0: 'vais', 1: 'vas', 2: 'va', 3: 'allons', 4: 'allez', 5: 'vont' },
    subjunctiveSingular: 'aill', subjunctivePlural: 'all', imperativeCells: { 1: 'va' },
  })],
  assaillir: [principal('assaill', 'assaill', 'assaill', 'assaillir', 'assaill', 'i', 'assailli', { singularEndings: erEndings })],
  asseoir: [
    principal('assoi', 'assoy', 'assoi', 'assoir', 'ass', 'i', 'assis', { pattern: 'assois' }),
    principal('assied', 'assey', 'assey', 'assiér', 'ass', 'i', 'assis', {
      singularEndings: ['s', 's', ''], pattern: 'assieds',
    }),
  ],
  avoir: [principal('a', 'av', 'av', 'aur', 'e', 'u', 'eu', {
    presentCells: { 0: 'ai', 1: 'as', 2: 'a', 3: 'avons', 4: 'avez', 5: 'ont' },
    subjunctiveCells: { 0: 'aie', 1: 'aies', 2: 'ait', 3: 'ayons', 4: 'ayez', 5: 'aient' },
    imperativeCells: { 1: 'aie', 3: 'ayons', 4: 'ayez' }, presentParticiple: 'ayant',
  })],
  battre: [principal('bat', 'batt', 'batt', 'battr', 'batt', 'i', 'battu')],
  boire: [principal('boi', 'buv', 'boiv', 'boir', 'b', 'u', 'bu')],
  bouillir: [principal('bou', 'bouill', 'bouill', 'bouillir', 'bouill', 'i', 'bouilli')],
  choir: [
    principal('choi', 'choy', 'choi', 'choir', 'ch', 'u', 'chu', { pattern: 'choirai', usage: 'dated' }),
    principal('choi', 'choy', 'choi', 'cherr', 'ch', 'u', 'chu', { pattern: 'cherrai', usage: 'dated' }),
  ],
  clore: [principal('clo', 'clos', 'clos', 'clor', '', 'i', 'clos')],
  conclure: [principal('conclu', 'conclu', 'conclu', 'conclur', 'concl', 'u', 'conclu')],
  confire: [principal('confi', 'confis', 'confis', 'confir', 'conf', 'i', 'confit')],
  connaître: [principal('connai', 'connaiss', 'connaiss', 'connaitr', 'conn', 'u', 'connu')],
  coudre: [principal('coud', 'cous', 'cous', 'coudr', 'cous', 'i', 'cousu')],
  courir: [principal('cour', 'cour', 'cour', 'courr', 'cour', 'u', 'couru')],
  couvrir: [principal('couvr', 'couvr', 'couvr', 'couvrir', 'couvr', 'i', 'couvert', { singularEndings: erEndings })],
  craindre: [principal('crain', 'craign', 'craign', 'craindr', 'craign', 'i', 'craint')],
  croire: [principal('croi', 'croy', 'croi', 'croir', 'cr', 'u', 'cru')],
  croître: [principal('croî', 'croiss', 'croiss', 'croitr', 'cr', 'u', 'crû')],
  cueillir: [principal('cueill', 'cueill', 'cueill', 'cueiller', 'cueill', 'i', 'cueilli', { singularEndings: erEndings })],
  cuire: [principal('cui', 'cuis', 'cuis', 'cuir', 'cuis', 'i', 'cuit')],
  devoir: [principal('doi', 'dev', 'doiv', 'devr', 'd', 'u', 'dû')],
  dire: [principal('di', 'dis', 'dis', 'dir', 'd', 'i', 'dit', { presentCells: { 4: 'dites' } })],
  dormir: [principal('dor', 'dorm', 'dorm', 'dormir', 'dorm', 'i', 'dormi', { invariableParticiple: true })],
  déchoir: [principal('déchoi', 'déchoy', 'déchoi', 'déchoir', 'déch', 'u', 'déchu', { futureAlternatives: ['décherr'] })],
  envoyer: [principal('envoi', 'envoy', 'envoi', 'enverr', 'envoy', 'a', 'envoyé', {
    kind: 'er', singularEndings: erEndings, lexicalFuture: true,
  })],
  faillir: [
    principal('failli', 'failliss', 'failliss', 'faillir', 'faill', 'i', 'failli', { pattern: 'faillis' }),
    principal('failli', 'failliss', 'failliss', 'faudr', 'faill', 'i', 'failli', { pattern: 'faudrai' }),
    principal('failli', 'failliss', 'failliss', 'faudr', 'faill', 'i', 'failli', {
      pattern: 'faille', subjunctiveSingular: 'faill', subjunctivePlural: 'faill',
    }),
    principal('fau', 'faill', 'faill', 'faillir', 'faill', 'i', 'failli', {
      singularEndings: xEndings, subjunctiveSingular: 'failliss', subjunctivePlural: 'failliss', pattern: 'faux', usage: 'dated',
    }),
  ],
  faire: [principal('fai', 'fais', 'f', 'fer', 'f', 'i', 'fait', {
    presentCells: { 2: 'fait', 4: 'faites', 5: 'font' }, subjunctiveSingular: 'fass', subjunctivePlural: 'fass',
  })],
  falloir: [principal('fau', 'fall', 'fall', 'faudr', 'fall', 'u', 'fallu', {
    presentCells: { 2: 'faut' }, subjunctiveSingular: 'faill', subjunctivePlural: 'faill',
    invariableParticiple: true,
  })],
  fuir: [principal('fui', 'fuy', 'fui', 'fuir', 'fu', 'i', 'fui')],
  gésir: [principal('gî', 'gis', 'gis', '', '', 'i', '', { presentCells: { 0: 'gis', 1: 'gis', 2: 'gît' } })],
  haïr: [principal('hai', 'haïss', 'haïss', 'haïr', 'ha', 'i', 'haï', { diaeresisPast: true })],
  joindre: [principal('join', 'joign', 'joign', 'joindr', 'joign', 'i', 'joint')],
  lire: [principal('li', 'lis', 'lis', 'lir', 'l', 'u', 'lu')],
  messeoir: [principal('messied', 'messey', 'messié', 'messiér', '', 'i', 'messis', {
    feminineParticiple: 'messis',
    invariableParticiple: true,
    presentParticiple: 'messéant', presentParticipleAlternatives: ['messeyant'],
  })],
  mettre: [principal('met', 'mett', 'mett', 'mettr', 'm', 'i', 'mis')],
  moudre: [principal('moud', 'moul', 'moul', 'moudr', 'moul', 'u', 'moulu')],
  mourir: [principal('meur', 'mour', 'meur', 'mourr', 'mour', 'u', 'mort')],
  mouvoir: [principal('meu', 'mouv', 'meuv', 'mouvr', 'm', 'u', 'mû')],
  naître: [principal('nai', 'naiss', 'naiss', 'naitr', 'naqu', 'i', 'né')],
  offrir: [principal('offr', 'offr', 'offr', 'offrir', 'offr', 'i', 'offert', { singularEndings: erEndings })],
  ouvrir: [principal('ouvr', 'ouvr', 'ouvr', 'ouvrir', 'ouvr', 'i', 'ouvert', { singularEndings: erEndings })],
  ouïr: [
    principal('oi', 'oy', 'oi', 'ouïr', 'ou', 'i', 'ouï', {
      diaeresisPast: true, pattern: 'ois', usage: 'dated', futureAlternatives: ['orr', 'oir'],
    }),
    principal('ouï', 'ouïss', 'ouïss', 'ouïr', 'ou', 'i', 'ouï', { diaeresisPast: true, pattern: 'ouïs' }),
  ],
  paître: [principal('pai', 'paiss', 'paiss', 'paitr', '', 'u', 'pu')],
  peindre: [principal('pein', 'peign', 'peign', 'peindr', 'peign', 'i', 'peint')],
  plaire: [principal('plai', 'plais', 'plais', 'plair', 'pl', 'u', 'plu', { invariableParticiple: true })],
  pleuvoir: [principal('pleu', 'pleuv', 'pleuv', 'pleuvr', 'pl', 'u', 'plu', { invariableParticiple: true })],
  pourvoir: [principal('pourvoi', 'pourvoy', 'pourvoi', 'pourvoir', 'pourv', 'u', 'pourvu')],
  pouvoir: [principal('peu', 'pouv', 'peuv', 'pourr', 'p', 'u', 'pu', {
    singularEndings: xEndings, presentAlternatives: { 0: ['puis'] },
    subjunctiveSingular: 'puiss', subjunctivePlural: 'puiss',
    invariableParticiple: true,
  })],
  prendre: [principal('prend', 'pren', 'prenn', 'prendr', 'pr', 'i', 'pris')],
  recevoir: [principal('reçoi', 'recev', 'reçoiv', 'recevr', 'reç', 'u', 'reçu')],
  résoudre: [principal('résou', 'résolv', 'résolv', 'résoudr', 'résol', 'u', 'résolu')],
  repaître: [principal('repai', 'repaiss', 'repaiss', 'repaitr', 'rep', 'u', 'repu')],
  repentir: [principal('repen', 'repent', 'repent', 'repentir', 'repent', 'i', 'repenti')],
  rire: [principal('ri', 'ri', 'ri', 'rir', 'r', 'i', 'ri', { invariableParticiple: true })],
  savoir: [principal('sai', 'sav', 'sav', 'saur', 's', 'u', 'su', {
    subjunctiveSingular: 'sach', subjunctivePlural: 'sach', presentParticiple: 'sachant',
    imperativeCells: { 1: 'sache', 3: 'sachons', 4: 'sachez' },
  })],
  sentir: [principal('sen', 'sent', 'sent', 'sentir', 'sent', 'i', 'senti')],
  seoir: [principal('sied', 'sey', 'sié', 'siér', '', 'i', 'sis', {
    feminineParticiple: 'sis',
    invariableParticiple: true,
    presentParticiple: 'séant', presentParticipleAlternatives: ['seyant'],
  })],
  servir: [principal('ser', 'serv', 'serv', 'servir', 'serv', 'i', 'servi')],
  suivre: [principal('sui', 'suiv', 'suiv', 'suivr', 'suiv', 'i', 'suivi')],
  souffrir: [principal('souffr', 'souffr', 'souffr', 'souffrir', 'souffr', 'i', 'souffert', { singularEndings: erEndings })],
  surseoir: [principal('sursoi', 'sursoy', 'sursoi', 'sursoir', 'surs', 'i', 'sursis')],
  tenir: [principal('tien', 'ten', 'tienn', 'tiendr', 't', 'in', 'tenu')],
  traire: [principal('trai', 'tray', 'trai', 'trair', '', 'i', 'trait')],
  vaincre: [principal('vainc', 'vainqu', 'vainqu', 'vaincr', 'vainqu', 'i', 'vaincu', { singularEndings: ['s', 's', ''] })],
  valoir: [principal('vau', 'val', 'val', 'vaudr', 'val', 'u', 'valu', {
    singularEndings: xEndings, subjunctiveSingular: 'vaill', subjunctivePlural: 'val',
  })],
  venir: [principal('vien', 'ven', 'vienn', 'viendr', 'v', 'in', 'venu')],
  vivre: [principal('vi', 'viv', 'viv', 'vivr', 'véc', 'u', 'vécu')],
  voir: [principal('voi', 'voy', 'voi', 'verr', 'v', 'i', 'vu')],
  vouloir: [principal('veu', 'voul', 'veul', 'voudr', 'voul', 'u', 'voulu', {
    singularEndings: xEndings, subjunctiveSingular: 'veuill', subjunctivePlural: 'voul',
    subjunctivePluralAlternatives: ['veuill'],
    imperativeAlternatives: { 1: ['veuille'], 3: ['veuillons'], 4: ['veuillez'] },
  })],
  vêtir: [principal('vêt', 'vêt', 'vêt', 'vêtir', 'vêt', 'i', 'vêtu')],
  échoir: [
    principal('échoi', 'échoy', 'échoi', 'échoir', 'éch', 'u', 'échu', { presentParticiple: 'échéant', pattern: 'échoit' }),
    principal('éche', 'échoy', 'éché', 'écherr', 'éch', 'u', 'échu', { presentParticiple: 'échéant', pattern: 'échet' }),
  ],
  écrire: [principal('écri', 'écriv', 'écriv', 'écrir', 'écriv', 'i', 'écrit')],
  être: [principal('sui', 'ét', 's', 'ser', 'f', 'u', 'été', {
    presentCells: { 0: 'suis', 1: 'es', 2: 'est', 3: 'sommes', 4: 'êtes', 5: 'sont' },
    subjunctiveCells: { 0: 'sois', 1: 'sois', 2: 'soit', 3: 'soyons', 4: 'soyez', 5: 'soient' },
    imperativeCells: { 1: 'sois', 3: 'soyons', 4: 'soyez' }, presentParticiple: 'étant',
    invariableParticiple: true,
  })],
};

export const frenchDerivativeFamilies: Readonly<Record<string, readonly string[]>> = {
  acquérir: ['ré'],
  battre: ['a', 'com', 'dé', 'ra'],
  connaître: ['re', 'mé'],
  coudre: ['dé', 're'],
  courir: ['ac', 'con', 'dis', 'en', 'par', 're', 'se'],
  couvrir: ['dé', 're', 'entre'],
  craindre: [],
  croître: ['ac', 'dé', 're'],
  cueillir: ['ac', 're'],
  dire: ['re', 'contre', 'inter', 'mé', 'pré'],
  dormir: ['en', 're', 'ren'],
  envoyer: ['r'],
  faire: ['dé', 're', 'satis', 'contre', 'par'],
  fuir: ['en'],
  joindre: ['ad', 'con', 'dis', 're'],
  lire: ['é', 're'],
  mettre: ['ad', 'com', 'dé', 'é', 'o', 'per', 'pro', 're', 'sou', 'trans'],
  naître: ['re'],
  mouvoir: ['é', 'pro'],
  peindre: ['dé', 're'],
  plaire: ['com', 'dé'],
  pleuvoir: ['re'],
  prendre: ['ap', 'com', 'entre', 'mé', 're', 'sur', 'réap', 'désap'],
  sentir: ['con', 'pres', 'res'],
  servir: ['des', 'res'],
  suivre: ['pour'],
  tenir: ['abs', 'appar', 'con', 'dé', 'entre', 'main', 'ob', 're', 'sou'],
  traire: ['abs', 'dis', 'ex', 're', 'sous'],
  vaincre: ['con'],
  venir: ['ad', 'con', 'contre', 'de', 'inter', 'par', 'pré', 'pro', 're', 'sou', 'sur'],
  vivre: ['re', 'sur'],
  voir: ['entre', 're'],
  vêtir: ['dé', 're'],
  écrire: ['dé', 'ins', 'pres', 'ré', 'trans'],
};
