import { parseTable } from './table.js';
import type { ModelKind, Paradigm } from './table.js';

/**
 * A conjugation model: which infinitives it covers, how many letters to strip to
 * obtain the stem, and the ending table(s) appended to that stem.
 *
 * Selection: an infinitive listed in `lemmas` uses that model; otherwise the model
 * with the longest matching entry in `suffixes` wins, unless the infinitive is in
 * that model's `except` list. Coverage grows by adding a model or a selector, never
 * by listing individual derivatives.
 */
export interface FrenchModel {
  readonly id: string;
  readonly kind: ModelKind;
  /** Regular classes and their spelling subclasses; they also cover invented verbs. */
  readonly productive: boolean;
  readonly suffixes: readonly string[];
  readonly lemmas: readonly string[];
  readonly except: readonly string[];
  /** Endings the suffixes must not cover (the productive -ir class excludes unknown -oir verbs). */
  readonly exceptEndings: readonly string[];
  readonly strip: number;
  readonly paradigms: readonly Paradigm[];
  /** The verbal past participle never agrees (dormi, plu, été). */
  readonly invariableParticiple: boolean;
  /** `singular`: only `il` (falloir); `figurativePlural`: third persons, plural only figuratively (pleuvoir). */
  readonly impersonal: 'singular' | 'figurativePlural' | null;
  readonly thirdPersonOnly: boolean;
  readonly noImperative: boolean;
  /** `none`: no compound tenses; `nonFinite`: only infinitive/participle/gerund compounds. */
  readonly compounds: 'all' | 'nonFinite' | 'none';
}

type ModelSpec = Partial<Omit<FrenchModel, 'id' | 'paradigms' | 'strip'>> & { readonly strip: number };

function model(id: string, spec: ModelSpec, ...paradigms: Paradigm[]): FrenchModel {
  return {
    id, kind: 'irregular', productive: false, suffixes: [], lemmas: [], except: [], exceptEndings: [],
    invariableParticiple: false, impersonal: null, thirdPersonOnly: false, noImperative: false, compounds: 'all',
    ...spec, paradigms,
  };
}

const table = parseTable;

/** `-e?er` verbs whose mute `e` becomes `è` before a mute ending (semer, mener, receper, peser, lever, sevrer). */
const muteE = ['emer', 'ener', 'eper', 'erer', 'eser', 'ever', 'evrer'];
/** `-é?er` verbs whose `é` becomes `è` before a mute ending (céder, sécher, régler). */
const closedE = [
  'b', 'd', 'f', 'j', 'k', 'l', 'm', 'n', 'p', 'r', 's', 't', 'v', 'z',
  'bl', 'br', 'ch', 'cl', 'cr', 'dr', 'fl', 'fr', 'gl', 'gn', 'gr', 'gu', 'ph', 'pl', 'pr', 'qu', 'th', 'tr', 'vr',
].map(onset => `é${onset}er`);

const regular: readonly FrenchModel[] = [
  model('aimer', { kind: 'er', productive: true, suffixes: ['er'], strip: 2 }, table(`
    e es e ons ez ent
    ais ais ait ions iez aient
    ai as a âmes âtes èrent
    erai eras era erons erez eront
    e es e ions iez ent
    asse asses ât assions assiez assent
    erais erais erait erions eriez eraient
    e ons ez ant é ée és ées er
  `)),
  model('placer', { kind: 'er', productive: true, suffixes: ['cer'], strip: 3 }, table(`
    ce ces ce çons cez cent
    çais çais çait cions ciez çaient
    çai ças ça çâmes çâtes cèrent
    cerai ceras cera cerons cerez ceront
    ce ces ce cions ciez cent
    çasse çasses çât çassions çassiez çassent
    cerais cerais cerait cerions ceriez ceraient
    ce çons cez çant cé cée cés cées cer
  `)),
  model('manger', { kind: 'er', productive: true, suffixes: ['ger'], strip: 3 }, table(`
    ge ges ge geons gez gent
    geais geais geait gions giez geaient
    geai geas gea geâmes geâtes gèrent
    gerai geras gera gerons gerez geront
    ge ges ge gions giez gent
    geasse geasses geât geassions geassiez geassent
    gerais gerais gerait gerions geriez geraient
    ge geons gez geant gé gée gés gées ger
  `)),
  model('lever', {
    kind: 'er', productive: true, strip: 2,
    suffixes: [
      ...muteE,
      // -eler/-eter verbs that take è rather than a doubled consonant in both spellings.
      'geler', 'ciseler', 'marteler', 'modeler', 'harceler', 'écarteler', 'démanteler', 'encasteler',
      'acheter', 'bégueter', 'corseter', 'crocheter', 'fileter', 'fureter', 'haleter',
    ],
    lemmas: ['celer', 'déceler', 'receler', 'peler'],
  }, table(`
    ^e ^es ^e ons ez ^ent
    ais ais ait ions iez aient
    ai as a âmes âtes èrent
    ^erai ^eras ^era ^erons ^erez ^eront
    ^e ^es ^e ions iez ^ent
    asse asses ât assions assiez assent
    ^erais ^erais ^erait ^erions ^eriez ^eraient
    ^e ons ez ant é ée és ées er
  `)),
  model('dépecer', { kind: 'er', productive: true, suffixes: ['ecer'], strip: 3 }, table(`
    ^ce ^ces ^ce çons cez ^cent
    çais çais çait cions ciez çaient
    çai ças ça çâmes çâtes cèrent
    ^cerai ^ceras ^cera ^cerons ^cerez ^ceront
    ^ce ^ces ^ce cions ciez ^cent
    çasse çasses çât çassions çassiez çassent
    ^cerais ^cerais ^cerait ^cerions ^ceriez ^ceraient
    ^ce çons cez çant cé cée cés cées cer
  `)),
  // Traditional spelling keeps é in the future and conditional; 1990 spelling writes è.
  model('céder', { kind: 'er', productive: true, suffixes: closedE, strip: 2 }, table(`
    ^e ^es ^e ons ez ^ent
    ais ais ait ions iez aient
    ai as a âmes âtes èrent
    t:erai/r:^erai t:eras/r:^eras t:era/r:^era t:erons/r:^erons t:erez/r:^erez t:eront/r:^eront
    ^e ^es ^e ions iez ^ent
    asse asses ât assions assiez assent
    t:erais/r:^erais t:erais/r:^erais t:erait/r:^erait t:erions/r:^erions t:eriez/r:^eriez t:eraient/r:^eraient
    ^e ons ez ant é ée és ées er
  `)),
  model('rapiécer', { kind: 'er', productive: true, suffixes: ['écer'], strip: 3 }, table(`
    ^ce ^ces ^ce çons cez ^cent
    çais çais çait cions ciez çaient
    çai ças ça çâmes çâtes cèrent
    t:cerai/r:^cerai t:ceras/r:^ceras t:cera/r:^cera t:cerons/r:^cerons t:cerez/r:^cerez t:ceront/r:^ceront
    ^ce ^ces ^ce cions ciez ^cent
    çasse çasses çât çassions çassiez çassent
    t:cerais/r:^cerais t:cerais/r:^cerais t:cerait/r:^cerait t:cerions/r:^cerions t:ceriez/r:^ceriez t:ceraient/r:^ceraient
    ^ce çons cez çant cé cée cés cées cer
  `)),
  model('protéger', { kind: 'er', productive: true, suffixes: ['éger'], strip: 3 }, table(`
    ^ge ^ges ^ge geons gez ^gent
    geais geais geait gions giez geaient
    geai geas gea geâmes geâtes gèrent
    t:gerai/r:^gerai t:geras/r:^geras t:gera/r:^gera t:gerons/r:^gerons t:gerez/r:^gerez t:geront/r:^geront
    ^ge ^ges ^ge gions giez ^gent
    geasse geasses geât geassions geassiez geassent
    t:gerais/r:^gerais t:gerais/r:^gerais t:gerait/r:^gerait t:gerions/r:^gerions t:geriez/r:^geriez t:geraient/r:^geraient
    ^ge geons gez geant gé gée gés gées ger
  `)),
  // Doubling in both spellings.
  model('appeler', { kind: 'er', productive: true, suffixes: ['appeler'], strip: 2 }, table(`
    le les le ons ez lent
    ais ais ait ions iez aient
    ai as a âmes âtes èrent
    lerai leras lera lerons lerez leront
    le les le ions iez lent
    asse asses ât assions assiez assent
    lerais lerais lerait lerions leriez leraient
    le ons ez ant é ée és ées er
  `)),
  model('jeter', { kind: 'er', productive: true, suffixes: ['jeter'], strip: 2 }, table(`
    te tes te ons ez tent
    ais ais ait ions iez aient
    ai as a âmes âtes èrent
    terai teras tera terons terez teront
    te tes te ions iez tent
    asse asses ât assions assiez assent
    terais terais terait terions teriez teraient
    te ons ez ant é ée és ées er
  `)),
  // Traditional spelling doubles the consonant; 1990 spelling writes è.
  model('renouveler', { kind: 'er', productive: true, suffixes: ['eler'], strip: 2 }, table(`
    t:le/r:^e t:les/r:^es t:le/r:^e ons ez t:lent/r:^ent
    ais ais ait ions iez aient
    ai as a âmes âtes èrent
    t:lerai/r:^erai t:leras/r:^eras t:lera/r:^era t:lerons/r:^erons t:lerez/r:^erez t:leront/r:^eront
    t:le/r:^e t:les/r:^es t:le/r:^e ions iez t:lent/r:^ent
    asse asses ât assions assiez assent
    t:lerais/r:^erais t:lerais/r:^erais t:lerait/r:^erait t:lerions/r:^erions t:leriez/r:^eriez t:leraient/r:^eraient
    t:le/r:^e ons ez ant é ée és ées er
  `)),
  model('feuilleter', { kind: 'er', productive: true, suffixes: ['eter', 'cacheter', 'tacheter'], strip: 2 }, table(`
    t:te/r:^e t:tes/r:^es t:te/r:^e ons ez t:tent/r:^ent
    ais ais ait ions iez aient
    ai as a âmes âtes èrent
    t:terai/r:^erai t:teras/r:^eras t:tera/r:^era t:terons/r:^erons t:terez/r:^erez t:teront/r:^eront
    t:te/r:^e t:tes/r:^es t:te/r:^e ions iez t:tent/r:^ent
    asse asses ât assions assiez assent
    t:terais/r:^erais t:terais/r:^erais t:terait/r:^erait t:terions/r:^erions t:teriez/r:^eriez t:teraient/r:^eraient
    t:te/r:^e ons ez ant é ée és ées er
  `)),
  model('payer', { kind: 'er', productive: true, suffixes: ['ayer'], strip: 3 }, table(`
    ie ies ie yons yez ient
    yais yais yait yions yiez yaient
    yai yas ya yâmes yâtes yèrent
    ierai ieras iera ierons ierez ieront
    ie ies ie yions yiez ient
    yasse yasses yât yassions yassiez yassent
    ierais ierais ierait ierions ieriez ieraient
    ie yons yez yant yé yée yés yées yer
  `, 'y-to-i'), table(`
    ye yes ye yons yez yent
    yais yais yait yions yiez yaient
    yai yas ya yâmes yâtes yèrent
    yerai yeras yera yerons yerez yeront
    ye yes ye yions yiez yent
    yasse yasses yât yassions yassiez yassent
    yerais yerais yerait yerions yeriez yeraient
    ye yons yez yant yé yée yés yées yer
  `, 'keep-y')),
  model('nettoyer', { kind: 'er', productive: true, suffixes: ['oyer', 'uyer'], strip: 3 }, table(`
    ie ies ie yons yez ient
    yais yais yait yions yiez yaient
    yai yas ya yâmes yâtes yèrent
    ierai ieras iera ierons ierez ieront
    ie ies ie yions yiez ient
    yasse yasses yât yassions yassiez yassent
    ierais ierais ierait ierions ieriez ieraient
    ie yons yez yant yé yée yés yées yer
  `)),
  model('grasseyer', { kind: 'er', productive: true, suffixes: ['eyer', 'éyer'], strip: 3 }, table(`
    ye yes ye yons yez yent
    yais yais yait yions yiez yaient
    yai yas ya yâmes yâtes yèrent
    yerai yeras yera yerons yerez yeront
    ye yes ye yions yiez yent
    yasse yasses yât yassions yassiez yassent
    yerais yerais yerait yerions yeriez yeraient
    ye yons yez yant yé yée yés yées yer
  `)),
  model('finir', { kind: 'ir', productive: true, suffixes: ['ir'], exceptEndings: ['oir'], strip: 2 }, table(`
    is is it issons issez issent
    issais issais issait issions issiez issaient
    is is it îmes îtes irent
    irai iras ira irons irez iront
    isse isses isse issions issiez issent
    isse isses ît issions issiez issent
    irais irais irait irions iriez iraient
    is issons issez issant i ie is ies ir
  `)),
  // Second group with a diaeresis, for unlisted -ïr verbs.
  model('ïr', { kind: 'ir', productive: true, suffixes: ['ïr'], strip: 2 }, table(`
    ïs ïs ït ïssons ïssez ïssent
    ïssais ïssais ïssait ïssions ïssiez ïssaient
    ïs ïs ït ïmes ïtes ïrent
    ïrai ïras ïra ïrons ïrez ïront
    ïsse ïsses ïsse ïssions ïssiez ïssent
    ïsse ïsses ït ïssions ïssiez ïssent
    ïrais ïrais ïrait ïrions ïriez ïraient
    ïs ïssons ïssez ïssant ï ïe ïs ïes ïr
  `)),
  model('rendre', { kind: 're', productive: true, suffixes: ['dre', 'tre'], strip: 2 }, table(`
    s s 0 ons ez ent
    ais ais ait ions iez aient
    is is it îmes îtes irent
    rai ras ra rons rez ront
    e es e ions iez ent
    isse isses ît issions issiez issent
    rais rais rait rions riez raient
    s ons ez ant u ue us ues re
  `)),
  model('rompre', { kind: 're', productive: true, suffixes: ['re'], strip: 2 }, table(`
    s s t ons ez ent
    ais ais ait ions iez aient
    is is it îmes îtes irent
    rai ras ra rons rez ront
    e es e ions iez ent
    isse isses ît issions issiez issent
    rais rais rait rions riez raient
    s ons ez ant u ue us ues re
  `)),
];

/** Irregular models, mostly families selected by a shared suffix. */
const irregular: readonly FrenchModel[] = [
  model('être', { lemmas: ['être'], strip: 4, invariableParticiple: true },
    table(`
    suis es est sommes êtes sont
    étais étais était étions étiez étaient
    fus fus fut fûmes fûtes furent
    serai seras sera serons serez seront
    sois sois soit soyons soyez soient
    fusse fusses fût fussions fussiez fussent
    serais serais serait serions seriez seraient
    sois soyons soyez étant été - - - être
  `)),
  model('avoir', { lemmas: ['avoir'], strip: 5 },
    table(`
    ai as a avons avez ont
    avais avais avait avions aviez avaient
    eus eus eut eûmes eûtes eurent
    aurai auras aura aurons aurez auront
    aie aies ait ayons ayez aient
    eusse eusses eût eussions eussiez eussent
    aurais aurais aurait aurions auriez auraient
    aie ayons ayez ayant eu eue eus eues avoir
  `)),
  model('aller', { lemmas: ['aller'], strip: 5 },
    table(`
    vais vas va allons allez vont
    allais allais allait allions alliez allaient
    allai allas alla allâmes allâtes allèrent
    irai iras ira irons irez iront
    aille ailles aille allions alliez aillent
    allasse allasses allât allassions allassiez allassent
    irais irais irait irions iriez iraient
    va allons allez allant allé allée allés allées aller
  `)),
  model('falloir', { lemmas: ['falloir'], strip: 7, invariableParticiple: true, impersonal: 'singular', noImperative: true },
    table(`
    - - faut - - -
    - - fallait - - -
    - - fallut - - -
    - - faudra - - -
    - - faille - - -
    - - fallût - - -
    - - faudrait - - -
    - - - - fallu - - - falloir
  `)),
  model('pleuvoir', { suffixes: ['pleuvoir'], strip: 8, invariableParticiple: true, impersonal: 'figurativePlural', noImperative: true },
    table(`
    - - pleut - - pleuvent
    - - pleuvait - - pleuvaient
    - - plut - - plurent
    - - pleuvra - - pleuvront
    - - pleuve - - pleuvent
    - - plût - - plussent
    - - pleuvrait - - pleuvraient
    - - - pleuvant plu - - - pleuvoir
  `)),
  model('pouvoir', { lemmas: ['pouvoir'], strip: 7, invariableParticiple: true, noImperative: true },
    table(`
    peux/puis peux peut pouvons pouvez peuvent
    pouvais pouvais pouvait pouvions pouviez pouvaient
    pus pus put pûmes pûtes purent
    pourrai pourras pourra pourrons pourrez pourront
    puisse puisses puisse puissions puissiez puissent
    pusse pusses pût pussions pussiez pussent
    pourrais pourrais pourrait pourrions pourriez pourraient
    - - - pouvant pu - - - pouvoir
  `)),
  model('savoir', { lemmas: ['savoir'], strip: 6 },
    table(`
    sais sais sait savons savez savent
    savais savais savait savions saviez savaient
    sus sus sut sûmes sûtes surent
    saurai sauras saura saurons saurez sauront
    sache saches sache sachions sachiez sachent
    susse susses sût sussions sussiez sussent
    saurais saurais saurait saurions sauriez sauraient
    sache sachons sachez sachant su sue sus sues savoir
  `)),
  model('gésir', { lemmas: ['gésir'], strip: 5, compounds: 'none' },
    table(`
    gis gis t:gît/r:git gisons gisez gisent
    gisais gisais gisait gisions gisiez gisaient
    - - - - - -
    - - - - - -
    - - - - - -
    - - - - - -
    - - - - - -
    - - - gisant - - - - gésir
  `)),
  model('seoir', { lemmas: ['seoir'], strip: 5, invariableParticiple: true, compounds: 'none', thirdPersonOnly: true },
    table(`
    - - sied - - siéent
    - - seyait - - seyaient
    - - - - - -
    - - siéra - - siéront
    - - siée - - siéent
    - - - - - -
    - - siérait - - siéraient
    - - - séant/seyant sis - - - seoir
  `)),
  model('messeoir', { lemmas: ['messeoir'], strip: 8, invariableParticiple: true, compounds: 'none', thirdPersonOnly: true },
    table(`
    - - messied - - messiéent
    - - messeyait - - messeyaient
    - - - - - -
    - - messiéra - - messiéront
    - - messiée - - messiéent
    - - - - - -
    - - messiérait - - messiéraient
    - - - messéant/messeyant messis - - - messeoir
  `)),
  model('ouïr', { lemmas: ['ouïr'], strip: 4 },
    table(`
    ouïs ouïs ouït ouïssons ouïssez ouïssent
    ouïssais ouïssais ouïssait ouïssions ouïssiez ouïssaient
    ouïs ouïs ouït ouïmes ouïtes ouïrent
    ouïrai ouïras ouïra ouïrons ouïrez ouïront
    ouïsse ouïsses ouïsse ouïssions ouïssiez ouïssent
    ouïsse ouïsses ouït ouïssions ouïssiez ouïssent
    ouïrais ouïrais ouïrait ouïrions ouïriez ouïraient
    ouïs ouïssons ouïssez ouïssant ouï ouïe ouïs ouïes ouïr
  `, 'ouïs'),
    table(`
    ois ois oit oyons oyez oient
    oyais oyais oyait oyions oyiez oyaient
    ouïs ouïs ouït ouïmes ouïtes ouïrent
    ouïrai/orrai/oirai ouïras/orras/oiras ouïra/orra/oira ouïrons/orrons/oirons ouïrez/orrez/oirez ouïront/orront/oiront
    oie oies oie oyions oyiez oient
    ouïsse ouïsses ouït ouïssions ouïssiez ouïssent
    ouïrais/orrais/oirais ouïrais/orrais/oirais ouïrait/orrait/oirait ouïrions/orrions/oirions ouïriez/orriez/oiriez ouïraient/orraient/oiraient
    ois oyons oyez oyant ouï ouïe ouïs ouïes ouïr
  `, 'ois', 'dated')),
  model('choir', { lemmas: ['choir'], strip: 5 },
    table(`
    chois chois choit choyons choyez choient
    - - - - - -
    chus chus chut chûmes chûtes churent
    choirai choiras choira choirons choirez choiront
    - - - - - -
    - - chût - - -
    choirais choirais choirait choirions choiriez choiraient
    - - - - chu chue chus chues choir
  `, 'choirai', 'dated'),
    table(`
    chois chois choit choyons choyez choient
    - - - - - -
    chus chus chut chûmes chûtes churent
    cherrai cherras cherra cherrons cherrez cherront
    - - - - - -
    - - chût - - -
    cherrais cherrais cherrait cherrions cherriez cherraient
    - - - - chu chue chus chues choir
  `, 'cherrai', 'dated')),
  model('échoir', { suffixes: ['échoir'], strip: 6, thirdPersonOnly: true },
    table(`
    - - échoit - - échoient
    - - échoyait - - échoyaient
    - - échut - - échurent
    - - échoira - - échoiront
    - - échoie - - échoient
    - - échût - - échussent
    - - échoirait - - échoiraient
    - - - échéant échu échue échus échues échoir
  `, 'échoit'),
    table(`
    - - échet - - échéent
    - - échoyait - - échoyaient
    - - échut - - échurent
    - - écherra - - écherront
    - - échée - - échéent
    - - échût - - échussent
    - - écherrait - - écherraient
    - - - échéant échu échue échus échues échoir
  `, 'échet')),
  model('déchoir', { suffixes: ['déchoir'], strip: 7 },
    table(`
    déchois déchois déchoit déchoyons déchoyez déchoient
    - - - - - -
    déchus déchus déchut déchûmes déchûtes déchurent
    déchoirai/décherrai déchoiras/décherras déchoira/décherra déchoirons/décherrons déchoirez/décherrez déchoiront/décherront
    déchoie déchoies déchoie déchoyions déchoyiez déchoient
    déchusse déchusses déchût déchussions déchussiez déchussent
    déchoirais/décherrais déchoirais/décherrais déchoirait/décherrait déchoirions/décherrions déchoiriez/décherriez déchoiraient/décherraient
    - - - - déchu déchue déchus déchues déchoir
  `)),
  model('croître', { lemmas: ['croître'], strip: 7 },
    table(`
    croîs croîs croît croissons croissez croissent
    croissais croissais croissait croissions croissiez croissaient
    crûs crûs crût crûmes crûtes crûrent
    t:croîtrai/r:croitrai t:croîtras/r:croitras t:croîtra/r:croitra t:croîtrons/r:croitrons t:croîtrez/r:croitrez t:croîtront/r:croitront
    croisse croisses croisse croissions croissiez croissent
    crûsse crûsses crût crûssions crûssiez crûssent
    t:croîtrais/r:croitrais t:croîtrais/r:croitrais t:croîtrait/r:croitrait t:croîtrions/r:croitrions t:croîtriez/r:croitriez t:croîtraient/r:croitraient
    croîs croissons croissez croissant crû t:crue/r:crûe t:crus/r:crûs t:crues/r:crûes t:croître/r:croitre
  `)),
  model('accroître', { suffixes: ['accroître', 'décroître', 'recroître'], strip: 7 },
    table(`
    crois crois t:croît/r:croit croissons croissez croissent
    croissais croissais croissait croissions croissiez croissaient
    crus crus crut crûmes crûtes crurent
    t:croîtrai/r:croitrai t:croîtras/r:croitras t:croîtra/r:croitra t:croîtrons/r:croitrons t:croîtrez/r:croitrez t:croîtront/r:croitront
    croisse croisses croisse croissions croissiez croissent
    crusse crusses crût crussions crussiez crussent
    t:croîtrais/r:croitrais t:croîtrais/r:croitrais t:croîtrait/r:croitrait t:croîtrions/r:croitrions t:croîtriez/r:croitriez t:croîtraient/r:croitraient
    crois croissons croissez croissant cru crue crus crues t:croître/r:croitre
  `)),
  model('naître', { lemmas: ['naître', 'renaître'], strip: 6 },
    table(`
    nais nais t:naît/r:nait naissons naissez naissent
    naissais naissais naissait naissions naissiez naissaient
    naquis naquis naquit naquîmes naquîtes naquirent
    t:naîtrai/r:naitrai t:naîtras/r:naitras t:naîtra/r:naitra t:naîtrons/r:naitrons t:naîtrez/r:naitrez t:naîtront/r:naitront
    naisse naisses naisse naissions naissiez naissent
    naquisse naquisses naquît naquissions naquissiez naquissent
    t:naîtrais/r:naitrais t:naîtrais/r:naitrais t:naîtrait/r:naitrait t:naîtrions/r:naitrions t:naîtriez/r:naitriez t:naîtraient/r:naitraient
    nais naissons naissez naissant né née nés nées t:naître/r:naitre
  `)),
  model('paître', { lemmas: ['paître'], strip: 6, compounds: 'nonFinite' },
    table(`
    pais pais t:paît/r:pait paissons paissez paissent
    paissais paissais paissait paissions paissiez paissaient
    - - - - - -
    t:paîtrai/r:paitrai t:paîtras/r:paitras t:paîtra/r:paitra t:paîtrons/r:paitrons t:paîtrez/r:paitrez t:paîtront/r:paitront
    paisse paisses paisse paissions paissiez paissent
    - - - - - -
    t:paîtrais/r:paitrais t:paîtrais/r:paitrais t:paîtrait/r:paitrait t:paîtrions/r:paitrions t:paîtriez/r:paitriez t:paîtraient/r:paitraient
    pais paissons paissez paissant pu pue pus pues t:paître/r:paitre
  `)),
  model('repaître', { suffixes: ['repaître'], strip: 8 },
    table(`
    repais repais t:repaît/r:repait repaissons repaissez repaissent
    repaissais repaissais repaissait repaissions repaissiez repaissaient
    repus repus reput repûmes repûtes repurent
    t:repaîtrai/r:repaitrai t:repaîtras/r:repaitras t:repaîtra/r:repaitra t:repaîtrons/r:repaitrons t:repaîtrez/r:repaitrez t:repaîtront/r:repaitront
    repaisse repaisses repaisse repaissions repaissiez repaissent
    repusse repusses repût repussions repussiez repussent
    t:repaîtrais/r:repaitrais t:repaîtrais/r:repaitrais t:repaîtrait/r:repaitrait t:repaîtrions/r:repaitrions t:repaîtriez/r:repaitriez t:repaîtraient/r:repaitraient
    repais repaissons repaissez repaissant repu repue repus repues t:repaître/r:repaitre
  `)),
  model('connaître', { suffixes: ['aître'], strip: 5 },
    table(`
    ais ais t:aît/r:ait aissons aissez aissent
    aissais aissais aissait aissions aissiez aissaient
    us us ut ûmes ûtes urent
    t:aîtrai/r:aitrai t:aîtras/r:aitras t:aîtra/r:aitra t:aîtrons/r:aitrons t:aîtrez/r:aitrez t:aîtront/r:aitront
    aisse aisses aisse aissions aissiez aissent
    usse usses ût ussions ussiez ussent
    t:aîtrais/r:aitrais t:aîtrais/r:aitrais t:aîtrait/r:aitrait t:aîtrions/r:aitrions t:aîtriez/r:aitriez t:aîtraient/r:aitraient
    ais aissons aissez aissant u ue us ues t:aître/r:aitre
  `)),
  model('mouvoir', { lemmas: ['mouvoir'], strip: 7 },
    table(`
    meus meus meut mouvons mouvez meuvent
    mouvais mouvais mouvait mouvions mouviez mouvaient
    mus mus mut mûmes mûtes murent
    mouvrai mouvras mouvra mouvrons mouvrez mouvront
    meuve meuves meuve mouvions mouviez meuvent
    musse musses mût mussions mussiez mussent
    mouvrais mouvrais mouvrait mouvrions mouvriez mouvraient
    meus mouvons mouvez mouvant t:mû/r:mu mue mus mues mouvoir
  `)),
  model('émouvoir', { suffixes: ['émouvoir', 'promouvoir'], strip: 7 },
    table(`
    meus meus meut mouvons mouvez meuvent
    mouvais mouvais mouvait mouvions mouviez mouvaient
    mus mus mut mûmes mûtes murent
    mouvrai mouvras mouvra mouvrons mouvrez mouvront
    meuve meuves meuve mouvions mouviez meuvent
    musse musses mût mussions mussiez mussent
    mouvrais mouvrais mouvrait mouvrions mouvriez mouvraient
    meus mouvons mouvez mouvant mu mue mus mues mouvoir
  `)),
  model('dire', { lemmas: ['dire', 'redire'], strip: 4 },
    table(`
    dis dis dit disons dites disent
    disais disais disait disions disiez disaient
    dis dis dit dîmes dîtes dirent
    dirai diras dira dirons direz diront
    dise dises dise disions disiez disent
    disse disses dît dissions dissiez dissent
    dirais dirais dirait dirions diriez diraient
    dis disons dites disant dit dite dits dites dire
  `)),
  model('interdire', { suffixes: ['dire'], strip: 4 },
    table(`
    dis dis dit disons disez disent
    disais disais disait disions disiez disaient
    dis dis dit dîmes dîtes dirent
    dirai diras dira dirons direz diront
    dise dises dise disions disiez disent
    disse disses dît dissions dissiez dissent
    dirais dirais dirait dirions diriez diraient
    dis disons disez disant dit dite dits dites dire
  `)),
  model('écrire', { suffixes: ['crire'], strip: 5 },
    table(`
    cris cris crit crivons crivez crivent
    crivais crivais crivait crivions criviez crivaient
    crivis crivis crivit crivîmes crivîtes crivirent
    crirai criras crira crirons crirez criront
    crive crives crive crivions criviez crivent
    crivisse crivisses crivît crivissions crivissiez crivissent
    crirais crirais crirait cririons cririez criraient
    cris crivons crivez crivant crit crite crits crites crire
  `)),
  model('lire', { suffixes: ['lire'], strip: 4 },
    table(`
    lis lis lit lisons lisez lisent
    lisais lisais lisait lisions lisiez lisaient
    lus lus lut lûmes lûtes lurent
    lirai liras lira lirons lirez liront
    lise lises lise lisions lisiez lisent
    lusse lusses lût lussions lussiez lussent
    lirais lirais lirait lirions liriez liraient
    lis lisons lisez lisant lu lue lus lues lire
  `)),
  model('rire', { suffixes: ['rire'], strip: 4, invariableParticiple: true },
    table(`
    ris ris rit rions riez rient
    riais riais riait riions riiez riaient
    ris ris rit rîmes rîtes rirent
    rirai riras rira rirons rirez riront
    rie ries rie riions riiez rient
    risse risses rît rissions rissiez rissent
    rirais rirais rirait ririons ririez riraient
    ris rions riez riant ri - - - rire
  `)),
  model('cuire', { suffixes: ['uire'], strip: 4 },
    table(`
    uis uis uit uisons uisez uisent
    uisais uisais uisait uisions uisiez uisaient
    uisis uisis uisit uisîmes uisîtes uisirent
    uirai uiras uira uirons uirez uiront
    uise uises uise uisions uisiez uisent
    uisisse uisisses uisît uisissions uisissiez uisissent
    uirais uirais uirait uirions uiriez uiraient
    uis uisons uisez uisant uit uite uits uites uire
  `)),
  model('confire', { suffixes: ['confire'], strip: 4 },
    table(`
    fis fis fit fisons fisez fisent
    fisais fisais fisait fisions fisiez fisaient
    fis fis fit fîmes fîtes firent
    firai firas fira firons firez firont
    fise fises fise fisions fisiez fisent
    fisse fisses fît fissions fissiez fissent
    firais firais firait firions firiez firaient
    fis fisons fisez fisant fit fite fits fites fire
  `)),
  model('conclure', { suffixes: ['clure'], strip: 5 },
    table(`
    clus clus clut cluons cluez cluent
    cluais cluais cluait cluions cluiez cluaient
    clus clus clut clûmes clûtes clurent
    clurai cluras clura clurons clurez cluront
    clue clues clue cluions cluiez cluent
    clusse clusses clût clussions clussiez clussent
    clurais clurais clurait clurions cluriez cluraient
    clus cluons cluez cluant clu clue clus clues clure
  `)),
  model('plaire', { suffixes: ['plaire'], strip: 6, invariableParticiple: true },
    table(`
    plais plais t:plaît/r:plait plaisons plaisez plaisent
    plaisais plaisais plaisait plaisions plaisiez plaisaient
    plus plus plut plûmes plûtes plurent
    plairai plairas plaira plairons plairez plairont
    plaise plaises plaise plaisions plaisiez plaisent
    plusse plusses plût plussions plussiez plussent
    plairais plairais plairait plairions plairiez plairaient
    plais plaisons plaisez plaisant plu - - - plaire
  `)),
  model('faire', { suffixes: ['faire'], strip: 5 },
    table(`
    fais fais fait faisons faites font
    faisais faisais faisait faisions faisiez faisaient
    fis fis fit fîmes fîtes firent
    ferai feras fera ferons ferez feront
    fasse fasses fasse fassions fassiez fassent
    fisse fisses fît fissions fissiez fissent
    ferais ferais ferait ferions feriez feraient
    fais faisons faites faisant fait faite faits faites faire
  `)),
  model('traire', { suffixes: ['traire'], lemmas: ['raire'], strip: 5 },
    table(`
    rais rais rait rayons rayez raient
    rayais rayais rayait rayions rayiez rayaient
    - - - - - -
    rairai rairas raira rairons rairez rairont
    raie raies raie rayions rayiez raient
    - - - - - -
    rairais rairais rairait rairions rairiez rairaient
    rais rayons rayez rayant rait raite raits raites raire
  `)),
  model('résoudre', { suffixes: ['résoudre'], strip: 8 },
    table(`
    résous résous résout résolvons résolvez résolvent
    résolvais résolvais résolvait résolvions résolviez résolvaient
    résolus résolus résolut résolûmes résolûtes résolurent
    résoudrai résoudras résoudra résoudrons résoudrez résoudront
    résolve résolves résolve résolvions résolviez résolvent
    résolusse résolusses résolût résolussions résolussiez résolussent
    résoudrais résoudrais résoudrait résoudrions résoudriez résoudraient
    résous résolvons résolvez résolvant résolu résolue résolus résolues résoudre
  `)),
  model('absoudre', { suffixes: ['soudre'], strip: 6 },
    table(`
    sous sous sout solvons solvez solvent
    solvais solvais solvait solvions solviez solvaient
    - - - - - -
    soudrai soudras soudra soudrons soudrez soudront
    solve solves solve solvions solviez solvent
    - - - - - -
    soudrais soudrais soudrait soudrions soudriez soudraient
    sous solvons solvez solvant t:sous/r:sout soute t:sous/r:souts soutes soudre
  `)),
  model('coudre', { suffixes: ['coudre'], strip: 6 },
    table(`
    couds couds coud cousons cousez cousent
    cousais cousais cousait cousions cousiez cousaient
    cousis cousis cousit cousîmes cousîtes cousirent
    coudrai coudras coudra coudrons coudrez coudront
    couse couses couse cousions cousiez cousent
    cousisse cousisses cousît cousissions cousissiez cousissent
    coudrais coudrais coudrait coudrions coudriez coudraient
    couds cousons cousez cousant cousu cousue cousus cousues coudre
  `)),
  model('moudre', { suffixes: ['moudre'], strip: 6 },
    table(`
    mouds mouds moud moulons moulez moulent
    moulais moulais moulait moulions mouliez moulaient
    moulus moulus moulut moulûmes moulûtes moulurent
    moudrai moudras moudra moudrons moudrez moudront
    moule moules moule moulions mouliez moulent
    moulusse moulusses moulût moulussions moulussiez moulussent
    moudrais moudrais moudrait moudrions moudriez moudraient
    mouds moulons moulez moulant moulu moulue moulus moulues moudre
  `)),
  model('craindre', { suffixes: ['aindre'], strip: 6 },
    table(`
    ains ains aint aignons aignez aignent
    aignais aignais aignait aignions aigniez aignaient
    aignis aignis aignit aignîmes aignîtes aignirent
    aindrai aindras aindra aindrons aindrez aindront
    aigne aignes aigne aignions aigniez aignent
    aignisse aignisses aignît aignissions aignissiez aignissent
    aindrais aindrais aindrait aindrions aindriez aindraient
    ains aignons aignez aignant aint ainte aints aintes aindre
  `)),
  model('peindre', { suffixes: ['eindre'], strip: 6 },
    table(`
    eins eins eint eignons eignez eignent
    eignais eignais eignait eignions eigniez eignaient
    eignis eignis eignit eignîmes eignîtes eignirent
    eindrai eindras eindra eindrons eindrez eindront
    eigne eignes eigne eignions eigniez eignent
    eignisse eignisses eignît eignissions eignissiez eignissent
    eindrais eindrais eindrait eindrions eindriez eindraient
    eins eignons eignez eignant eint einte eints eintes eindre
  `)),
  model('joindre', { suffixes: ['oindre'], strip: 6 },
    table(`
    oins oins oint oignons oignez oignent
    oignais oignais oignait oignions oigniez oignaient
    oignis oignis oignit oignîmes oignîtes oignirent
    oindrai oindras oindra oindrons oindrez oindront
    oigne oignes oigne oignions oigniez oignent
    oignisse oignisses oignît oignissions oignissiez oignissent
    oindrais oindrais oindrait oindrions oindriez oindraient
    oins oignons oignez oignant oint ointe oints ointes oindre
  `)),
  model('prendre', { suffixes: ['prendre'], strip: 7 },
    table(`
    prends prends prend prenons prenez prennent
    prenais prenais prenait prenions preniez prenaient
    pris pris prit prîmes prîtes prirent
    prendrai prendras prendra prendrons prendrez prendront
    prenne prennes prenne prenions preniez prennent
    prisse prisses prît prissions prissiez prissent
    prendrais prendrais prendrait prendrions prendriez prendraient
    prends prenons prenez prenant pris prise pris prises prendre
  `)),
  model('battre', { suffixes: ['battre'], strip: 6 },
    table(`
    bats bats bat battons battez battent
    battais battais battait battions battiez battaient
    battis battis battit battîmes battîtes battirent
    battrai battras battra battrons battrez battront
    batte battes batte battions battiez battent
    battisse battisses battît battissions battissiez battissent
    battrais battrais battrait battrions battriez battraient
    bats battons battez battant battu battue battus battues battre
  `)),
  model('mettre', { suffixes: ['mettre'], strip: 6 },
    table(`
    mets mets met mettons mettez mettent
    mettais mettais mettait mettions mettiez mettaient
    mis mis mit mîmes mîtes mirent
    mettrai mettras mettra mettrons mettrez mettront
    mette mettes mette mettions mettiez mettent
    misse misses mît missions missiez missent
    mettrais mettrais mettrait mettrions mettriez mettraient
    mets mettons mettez mettant mis mise mis mises mettre
  `)),
  model('vaincre', { suffixes: ['vaincre'], strip: 7 },
    table(`
    vaincs vaincs vainc vainquons vainquez vainquent
    vainquais vainquais vainquait vainquions vainquiez vainquaient
    vainquis vainquis vainquit vainquîmes vainquîtes vainquirent
    vaincrai vaincras vaincra vaincrons vaincrez vaincront
    vainque vainques vainque vainquions vainquiez vainquent
    vainquisse vainquisses vainquît vainquissions vainquissiez vainquissent
    vaincrais vaincrais vaincrait vaincrions vaincriez vaincraient
    vaincs vainquons vainquez vainquant vaincu vaincue vaincus vaincues vaincre
  `)),
  model('vivre', { suffixes: ['vivre'], strip: 5 },
    table(`
    vis vis vit vivons vivez vivent
    vivais vivais vivait vivions viviez vivaient
    vécus vécus vécut vécûmes vécûtes vécurent
    vivrai vivras vivra vivrons vivrez vivront
    vive vives vive vivions viviez vivent
    vécusse vécusses vécût vécussions vécussiez vécussent
    vivrais vivrais vivrait vivrions vivriez vivraient
    vis vivons vivez vivant vécu vécue vécus vécues vivre
  `)),
  model('suivre', { suffixes: ['suivre'], strip: 6 },
    table(`
    suis suis suit suivons suivez suivent
    suivais suivais suivait suivions suiviez suivaient
    suivis suivis suivit suivîmes suivîtes suivirent
    suivrai suivras suivra suivrons suivrez suivront
    suive suives suive suivions suiviez suivent
    suivisse suivisses suivît suivissions suivissiez suivissent
    suivrais suivrais suivrait suivrions suivriez suivraient
    suis suivons suivez suivant suivi suivie suivis suivies suivre
  `)),
  model('boire', { suffixes: ['boire'], strip: 5 },
    table(`
    bois bois boit buvons buvez boivent
    buvais buvais buvait buvions buviez buvaient
    bus bus but bûmes bûtes burent
    boirai boiras boira boirons boirez boiront
    boive boives boive buvions buviez boivent
    busse busses bût bussions bussiez bussent
    boirais boirais boirait boirions boiriez boiraient
    bois buvons buvez buvant bu bue bus bues boire
  `)),
  model('croire', { suffixes: ['croire'], strip: 6 },
    table(`
    crois crois croit croyons croyez croient
    croyais croyais croyait croyions croyiez croyaient
    crus crus crut crûmes crûtes crurent
    croirai croiras croira croirons croirez croiront
    croie croies croie croyions croyiez croient
    crusse crusses crût crussions crussiez crussent
    croirais croirais croirait croirions croiriez croiraient
    crois croyons croyez croyant cru crue crus crues croire
  `)),
  model('clore', { suffixes: ['clore'], strip: 5 },
    table(`
    clos clos t:clôt/r:clot - - closent
    - - - - - -
    - - - - - -
    clorai cloras clora clorons clorez cloront
    close closes close closions closiez closent
    - - - - - -
    clorais clorais clorait clorions cloriez cloraient
    clos - - closant clos close clos closes clore
  `)),
  model('acquérir', { suffixes: ['quérir'], strip: 6 },
    table(`
    quiers quiers quiert quérons quérez quièrent
    quérais quérais quérait quérions quériez quéraient
    quis quis quit quîmes quîtes quirent
    querrai querras querra querrons querrez querront
    quière quières quière quérions quériez quièrent
    quisse quisses quît quissions quissiez quissent
    querrais querrais querrait querrions querriez querraient
    quiers quérons quérez quérant quis quise quis quises quérir
  `)),
  model('assaillir', { suffixes: ['assaillir', 'tressaillir', 'défaillir'], strip: 6 },
    table(`
    aille ailles aille aillons aillez aillent
    aillais aillais aillait aillions ailliez aillaient
    aillis aillis aillit aillîmes aillîtes aillirent
    aillirai ailliras aillira aillirons aillirez ailliront
    aille ailles aille aillions ailliez aillent
    aillisse aillisses aillît aillissions aillissiez aillissent
    aillirais aillirais aillirait aillirions ailliriez ailliraient
    aille aillons aillez aillant ailli aillie aillis aillies aillir
  `)),
  model('faillir', { suffixes: ['faillir'], strip: 7, noImperative: true },
    table(`
    faillis faillis faillit faillissons faillissez faillissent
    faillissais faillissais faillissait faillissions faillissiez faillissaient
    faillis faillis faillit faillîmes faillîtes faillirent
    faillirai failliras faillira faillirons faillirez failliront
    faillisse faillisses faillisse faillissions faillissiez faillissent
    faillisse faillisses faillît faillissions faillissiez faillissent
    faillirais faillirais faillirait faillirions failliriez failliraient
    - - - faillissant failli faillie faillis faillies faillir
  `, 'faillis'),
    table(`
    faillis faillis faillit faillissons faillissez faillissent
    faillissais faillissais faillissait faillissions faillissiez faillissaient
    faillis faillis faillit faillîmes faillîtes faillirent
    faudrai faudras faudra faudrons faudrez faudront
    faillisse faillisses faillisse faillissions faillissiez faillissent
    faillisse faillisses faillît faillissions faillissiez faillissent
    faudrais faudrais faudrait faudrions faudriez faudraient
    - - - faillissant failli faillie faillis faillies faillir
  `, 'faudrai'),
    table(`
    faillis faillis faillit faillissons faillissez faillissent
    faillissais faillissais faillissait faillissions faillissiez faillissaient
    faillis faillis faillit faillîmes faillîtes faillirent
    faudrai faudras faudra faudrons faudrez faudront
    faille failles faille faillions failliez faillent
    faillisse faillisses faillît faillissions faillissiez faillissent
    faudrais faudrais faudrait faudrions faudriez faudraient
    - - - faillissant failli faillie faillis faillies faillir
  `, 'faille'),
    table(`
    faux faux faut faillons faillez faillent
    faillais faillais faillait faillions failliez faillaient
    faillis faillis faillit faillîmes faillîtes faillirent
    faillirai failliras faillira faillirons faillirez failliront
    faillisse faillisses faillisse faillissions faillissiez faillissent
    faillisse faillisses faillît faillissions faillissiez faillissent
    faillirais faillirais faillirait faillirions failliriez failliraient
    - - - faillant failli faillie faillis faillies faillir
  `, 'faux', 'dated')),
  model('bouillir', { suffixes: ['bouillir'], strip: 8 },
    table(`
    bous bous bout bouillons bouillez bouillent
    bouillais bouillais bouillait bouillions bouilliez bouillaient
    bouillis bouillis bouillit bouillîmes bouillîtes bouillirent
    bouillirai bouilliras bouillira bouillirons bouillirez bouilliront
    bouille bouilles bouille bouillions bouilliez bouillent
    bouillisse bouillisses bouillît bouillissions bouillissiez bouillissent
    bouillirais bouillirais bouillirait bouillirions bouilliriez bouilliraient
    bous bouillons bouillez bouillant bouilli bouillie bouillis bouillies bouillir
  `)),
  model('cueillir', { suffixes: ['cueillir'], strip: 8 },
    table(`
    cueille cueilles cueille cueillons cueillez cueillent
    cueillais cueillais cueillait cueillions cueilliez cueillaient
    cueillis cueillis cueillit cueillîmes cueillîtes cueillirent
    cueillerai cueilleras cueillera cueillerons cueillerez cueilleront
    cueille cueilles cueille cueillions cueilliez cueillent
    cueillisse cueillisses cueillît cueillissions cueillissiez cueillissent
    cueillerais cueillerais cueillerait cueillerions cueilleriez cueilleraient
    cueille cueillons cueillez cueillant cueilli cueillie cueillis cueillies cueillir
  `)),
  model('courir', { suffixes: ['courir'], strip: 6 },
    table(`
    cours cours court courons courez courent
    courais courais courait courions couriez couraient
    courus courus courut courûmes courûtes coururent
    courrai courras courra courrons courrez courront
    coure coures coure courions couriez courent
    courusse courusses courût courussions courussiez courussent
    courrais courrais courrait courrions courriez courraient
    cours courons courez courant couru courue courus courues courir
  `)),
  model('mourir', { suffixes: ['mourir'], strip: 6 },
    table(`
    meurs meurs meurt mourons mourez meurent
    mourais mourais mourait mourions mouriez mouraient
    mourus mourus mourut mourûmes mourûtes moururent
    mourrai mourras mourra mourrons mourrez mourront
    meure meures meure mourions mouriez meurent
    mourusse mourusses mourût mourussions mourussiez mourussent
    mourrais mourrais mourrait mourrions mourriez mourraient
    meurs mourons mourez mourant mort morte morts mortes mourir
  `)),
  model('ouvrir', { suffixes: ['ouvrir', 'ffrir'], strip: 3 },
    table(`
    re res re rons rez rent
    rais rais rait rions riez raient
    ris ris rit rîmes rîtes rirent
    rirai riras rira rirons rirez riront
    re res re rions riez rent
    risse risses rît rissions rissiez rissent
    rirais rirais rirait ririons ririez riraient
    re rons rez rant ert erte erts ertes rir
  `)),
  model('dormir', { suffixes: ['dormir'], strip: 6, invariableParticiple: true },
    table(`
    dors dors dort dormons dormez dorment
    dormais dormais dormait dormions dormiez dormaient
    dormis dormis dormit dormîmes dormîtes dormirent
    dormirai dormiras dormira dormirons dormirez dormiront
    dorme dormes dorme dormions dormiez dorment
    dormisse dormisses dormît dormissions dormissiez dormissent
    dormirais dormirais dormirait dormirions dormiriez dormiraient
    dors dormons dormez dormant dormi - - - dormir
  `)),
  model('endormir', { suffixes: ['ndormir'], strip: 6 },
    table(`
    dors dors dort dormons dormez dorment
    dormais dormais dormait dormions dormiez dormaient
    dormis dormis dormit dormîmes dormîtes dormirent
    dormirai dormiras dormira dormirons dormirez dormiront
    dorme dormes dorme dormions dormiez dorment
    dormisse dormisses dormît dormissions dormissiez dormissent
    dormirais dormirais dormirait dormirions dormiriez dormiraient
    dors dormons dormez dormant dormi dormie dormis dormies dormir
  `)),
  model('partir', { suffixes: ['partir', 'sortir', 'sentir', 'mentir', 'repentir'], except: ['impartir', 'répartir', 'assortir', 'désassortir', 'rassortir', 'réassortir'], strip: 3 },
    table(`
    s s t tons tez tent
    tais tais tait tions tiez taient
    tis tis tit tîmes tîtes tirent
    tirai tiras tira tirons tirez tiront
    te tes te tions tiez tent
    tisse tisses tît tissions tissiez tissent
    tirais tirais tirait tirions tiriez tiraient
    s tons tez tant ti tie tis ties tir
  `)),
  model('servir', { suffixes: ['servir'], except: ['asservir'], strip: 6 },
    table(`
    sers sers sert servons servez servent
    servais servais servait servions serviez servaient
    servis servis servit servîmes servîtes servirent
    servirai serviras servira servirons servirez serviront
    serve serves serve servions serviez servent
    servisse servisses servît servissions servissiez servissent
    servirais servirais servirait servirions serviriez serviraient
    sers servons servez servant servi servie servis servies servir
  `)),
  model('fuir', { suffixes: ['fuir'], strip: 4 },
    table(`
    fuis fuis fuit fuyons fuyez fuient
    fuyais fuyais fuyait fuyions fuyiez fuyaient
    fuis fuis fuit fuîmes fuîtes fuirent
    fuirai fuiras fuira fuirons fuirez fuiront
    fuie fuies fuie fuyions fuyiez fuient
    fuisse fuisses fuît fuissions fuissiez fuissent
    fuirais fuirais fuirait fuirions fuiriez fuiraient
    fuis fuyons fuyez fuyant fui fuie fuis fuies fuir
  `)),
  model('haïr', { suffixes: ['haïr'], strip: 4 },
    table(`
    hais hais hait haïssons haïssez haïssent
    haïssais haïssais haïssait haïssions haïssiez haïssaient
    haïs haïs haït haïmes haïtes haïrent
    haïrai haïras haïra haïrons haïrez haïront
    haïsse haïsses haïsse haïssions haïssiez haïssent
    haïsse haïsses haït haïssions haïssiez haïssent
    haïrais haïrais haïrait haïrions haïriez haïraient
    hais haïssons haïssez haïssant haï haïe haïs haïes haïr
  `)),
  model('tenir', { suffixes: ['tenir'], strip: 5 },
    table(`
    tiens tiens tient tenons tenez tiennent
    tenais tenais tenait tenions teniez tenaient
    tins tins tint tînmes tîntes tinrent
    tiendrai tiendras tiendra tiendrons tiendrez tiendront
    tienne tiennes tienne tenions teniez tiennent
    tinsse tinsses tînt tinssions tinssiez tinssent
    tiendrais tiendrais tiendrait tiendrions tiendriez tiendraient
    tiens tenons tenez tenant tenu tenue tenus tenues tenir
  `)),
  model('venir', { suffixes: ['venir'], strip: 5 },
    table(`
    viens viens vient venons venez viennent
    venais venais venait venions veniez venaient
    vins vins vint vînmes vîntes vinrent
    viendrai viendras viendra viendrons viendrez viendront
    vienne viennes vienne venions veniez viennent
    vinsse vinsses vînt vinssions vinssiez vinssent
    viendrais viendrais viendrait viendrions viendriez viendraient
    viens venons venez venant venu venue venus venues venir
  `)),
  model('vêtir', { suffixes: ['vêtir'], strip: 5 },
    table(`
    vêts vêts vêt vêtons vêtez vêtent
    vêtais vêtais vêtait vêtions vêtiez vêtaient
    vêtis vêtis vêtit vêtîmes vêtîtes vêtirent
    vêtirai vêtiras vêtira vêtirons vêtirez vêtiront
    vête vêtes vête vêtions vêtiez vêtent
    vêtisse vêtisses vêtît vêtissions vêtissiez vêtissent
    vêtirais vêtirais vêtirait vêtirions vêtiriez vêtiraient
    vêts vêtons vêtez vêtant vêtu vêtue vêtus vêtues vêtir
  `)),
  model('asseoir', { suffixes: ['asseoir'], strip: 7 },
    table(`
    assois assois assoit assoyons assoyez assoient
    assoyais assoyais assoyait assoyions assoyiez assoyaient
    assis assis assit assîmes assîtes assirent
    t:asseoirai/r:assoirai t:asseoiras/r:assoiras t:asseoira/r:assoira t:asseoirons/r:assoirons t:asseoirez/r:assoirez t:asseoiront/r:assoiront
    assoie assoies assoie assoyions assoyiez assoient
    assisse assisses assît assissions assissiez assissent
    t:asseoirais/r:assoirais t:asseoirais/r:assoirais t:asseoirait/r:assoirait t:asseoirions/r:assoirions t:asseoiriez/r:assoiriez t:asseoiraient/r:assoiraient
    assois assoyons assoyez assoyant assis assise assis assises t:asseoir/r:assoir
  `, 'assois'),
    table(`
    assieds assieds assied asseyons asseyez asseyent
    asseyais asseyais asseyait asseyions asseyiez asseyaient
    assis assis assit assîmes assîtes assirent
    assiérai assiéras assiéra assiérons assiérez assiéront
    asseye asseyes asseye asseyions asseyiez asseyent
    assisse assisses assît assissions assissiez assissent
    assiérais assiérais assiérait assiérions assiériez assiéraient
    assieds asseyons asseyez asseyant assis assise assis assises t:asseoir/r:assoir
  `, 'assieds')),
  model('surseoir', { suffixes: ['surseoir'], strip: 8 },
    table(`
    sursois sursois sursoit sursoyons sursoyez sursoient
    sursoyais sursoyais sursoyait sursoyions sursoyiez sursoyaient
    sursis sursis sursit sursîmes sursîtes sursirent
    t:surseoirai/r:sursoirai t:surseoiras/r:sursoiras t:surseoira/r:sursoira t:surseoirons/r:sursoirons t:surseoirez/r:sursoirez t:surseoiront/r:sursoiront
    sursoie sursoies sursoie sursoyions sursoyiez sursoient
    sursisse sursisses sursît sursissions sursissiez sursissent
    t:surseoirais/r:sursoirais t:surseoirais/r:sursoirais t:surseoirait/r:sursoirait t:surseoirions/r:sursoirions t:surseoiriez/r:sursoiriez t:surseoiraient/r:sursoiraient
    sursois sursoyons sursoyez sursoyant sursis sursise sursis sursises t:surseoir/r:sursoir
  `)),
  model('voir', { suffixes: ['voir'], strip: 4 },
    table(`
    vois vois voit voyons voyez voient
    voyais voyais voyait voyions voyiez voyaient
    vis vis vit vîmes vîtes virent
    verrai verras verra verrons verrez verront
    voie voies voie voyions voyiez voient
    visse visses vît vissions vissiez vissent
    verrais verrais verrait verrions verriez verraient
    vois voyons voyez voyant vu vue vus vues voir
  `)),
  model('prévoir', { suffixes: ['prévoir'], strip: 7 },
    table(`
    prévois prévois prévoit prévoyons prévoyez prévoient
    prévoyais prévoyais prévoyait prévoyions prévoyiez prévoyaient
    prévis prévis prévit prévîmes prévîtes prévirent
    prévoirai prévoiras prévoira prévoirons prévoirez prévoiront
    prévoie prévoies prévoie prévoyions prévoyiez prévoient
    prévisse prévisses prévît prévissions prévissiez prévissent
    prévoirais prévoirais prévoirait prévoirions prévoiriez prévoiraient
    prévois prévoyons prévoyez prévoyant prévu prévue prévus prévues prévoir
  `)),
  model('pourvoir', { suffixes: ['pourvoir'], strip: 8 },
    table(`
    pourvois pourvois pourvoit pourvoyons pourvoyez pourvoient
    pourvoyais pourvoyais pourvoyait pourvoyions pourvoyiez pourvoyaient
    pourvus pourvus pourvut pourvûmes pourvûtes pourvurent
    pourvoirai pourvoiras pourvoira pourvoirons pourvoirez pourvoiront
    pourvoie pourvoies pourvoie pourvoyions pourvoyiez pourvoient
    pourvusse pourvusses pourvût pourvussions pourvussiez pourvussent
    pourvoirais pourvoirais pourvoirait pourvoirions pourvoiriez pourvoiraient
    pourvois pourvoyons pourvoyez pourvoyant pourvu pourvue pourvus pourvues pourvoir
  `)),
  model('recevoir', { suffixes: ['cevoir'], strip: 6 },
    table(`
    çois çois çoit cevons cevez çoivent
    cevais cevais cevait cevions ceviez cevaient
    çus çus çut çûmes çûtes çurent
    cevrai cevras cevra cevrons cevrez cevront
    çoive çoives çoive cevions ceviez çoivent
    çusse çusses çût çussions çussiez çussent
    cevrais cevrais cevrait cevrions cevriez cevraient
    çois cevons cevez cevant çu çue çus çues cevoir
  `)),
  model('devoir', { suffixes: ['devoir'], strip: 6 },
    table(`
    dois dois doit devons devez doivent
    devais devais devait devions deviez devaient
    dus dus dut dûmes dûtes durent
    devrai devras devra devrons devrez devront
    doive doives doive devions deviez doivent
    dusse dusses dût dussions dussiez dussent
    devrais devrais devrait devrions devriez devraient
    dois devons devez devant dû due dus dues devoir
  `)),
  model('valoir', { suffixes: ['valoir'], strip: 6 },
    table(`
    vaux vaux vaut valons valez valent
    valais valais valait valions valiez valaient
    valus valus valut valûmes valûtes valurent
    vaudrai vaudras vaudra vaudrons vaudrez vaudront
    vaille vailles vaille valions valiez vaillent
    valusse valusses valût valussions valussiez valussent
    vaudrais vaudrais vaudrait vaudrions vaudriez vaudraient
    vaux valons valez valant valu value valus values valoir
  `)),
  model('vouloir', { suffixes: ['vouloir'], strip: 7 },
    table(`
    veux veux veut voulons voulez veulent
    voulais voulais voulait voulions vouliez voulaient
    voulus voulus voulut voulûmes voulûtes voulurent
    voudrai voudras voudra voudrons voudrez voudront
    veuille veuilles veuille voulions/veuillions vouliez/veuilliez veuillent
    voulusse voulusses voulût voulussions voulussiez voulussent
    voudrais voudrais voudrait voudrions voudriez voudraient
    veux/veuille voulons/veuillons voulez/veuillez voulant voulu voulue voulus voulues vouloir
  `)),
  model('envoyer', { kind: 'er', suffixes: ['envoyer'], strip: 7 },
    table(`
    envoie envoies envoie envoyons envoyez envoient
    envoyais envoyais envoyait envoyions envoyiez envoyaient
    envoyai envoyas envoya envoyâmes envoyâtes envoyèrent
    enverrai enverras enverra enverrons enverrez enverront
    envoie envoies envoie envoyions envoyiez envoient
    envoyasse envoyasses envoyât envoyassions envoyassiez envoyassent
    enverrais enverrais enverrait enverrions enverriez enverraient
    envoie envoyons envoyez envoyant envoyé envoyée envoyés envoyées envoyer
  `)),
  model('interpeller', { kind: 'er', lemmas: ['interpeller'], strip: 4 },
    table(`
    lle lles lle t:llons/r:lons t:llez/r:lez llent
    t:llais/r:lais t:llais/r:lais t:llait/r:lait t:llions/r:lions t:lliez/r:liez t:llaient/r:laient
    t:llai/r:lai t:llas/r:las t:lla/r:la t:llâmes/r:lâmes t:llâtes/r:lâtes t:llèrent/r:lèrent
    llerai lleras llera llerons llerez lleront
    lle lles lle t:llions/r:lions t:lliez/r:liez llent
    t:llasse/r:lasse t:llasses/r:lasses t:llât/r:lât t:llassions/r:lassions t:llassiez/r:lassiez t:llassent/r:lassent
    llerais llerais llerait llerions lleriez lleraient
    lle t:llons/r:lons t:llez/r:lez t:llant/r:lant t:llé/r:lé t:llée/r:lée t:llés/r:lés t:llées/r:lées t:ller/r:ler
  `)),
];

/** Families and defective verbs absent from the irregular inventory above. */
const families: readonly FrenchModel[] = [
  model('taire', { lemmas: ['taire'], strip: 4 }, table(`
    ais ais ait aisons aisez aisent
    aisais aisais aisait aisions aisiez aisaient
    us us ut ûmes ûtes urent
    airai airas aira airons airez airont
    aise aises aise aisions aisiez aisent
    usse usses ût ussions ussiez ussent
    airais airais airait airions airiez airaient
    ais aisons aisez aisant u ue us ues aire
  `)),
  model('suffire', { lemmas: ['suffire'], strip: 4, invariableParticiple: true }, table(`
    fis fis fit fisons fisez fisent
    fisais fisais fisait fisions fisiez fisaient
    fis fis fit fîmes fîtes firent
    firai firas fira firons firez firont
    fise fises fise fisions fisiez fisent
    fisse fisses fît fissions fissiez fissent
    firais firais firait firions firiez firaient
    fis fisons fisez fisant fi - - - fire
  `)),
  model('circoncire', { lemmas: ['circoncire'], strip: 3 }, table(`
    is is it isons isez isent
    isais isais isait isions isiez isaient
    is is it îmes îtes irent
    irai iras ira irons irez iront
    ise ises ise isions isiez isent
    isse isses ît issions issiez issent
    irais irais irait irions iriez iraient
    is isons isez isant is ise is ises ire
  `)),
  model('frire', { lemmas: ['frire'], strip: 4 }, table(`
    ris ris rit - - -
    - - - - - -
    - - - - - -
    rirai riras rira rirons rirez riront
    - - - - - -
    - - - - - -
    rirais rirais rirait ririons ririez riraient
    ris - - - rit rite rits rites rire
  `)),
  model('maudire', { lemmas: ['maudire'], strip: 4 }, table(`
    dis dis dit dissons dissez dissent
    dissais dissais dissait dissions dissiez dissaient
    dis dis dit dîmes dîtes dirent
    dirai diras dira dirons direz diront
    disse disses disse dissions dissiez dissent
    disse disses dît dissions dissiez dissent
    dirais dirais dirait dirions diriez diraient
    dis dissons dissez dissant dit dite dits dites dire
  `)),
  model('nuire', { suffixes: ['nuire', 'luire'], strip: 4, invariableParticiple: true }, table(`
    uis uis uit uisons uisez uisent
    uisais uisais uisait uisions uisiez uisaient
    uisis uisis uisit uisîmes uisîtes uisirent
    uirai uiras uira uirons uirez uiront
    uise uises uise uisions uisiez uisent
    uisisse uisisses uisît uisissions uisissiez uisissent
    uirais uirais uirait uirions uiriez uiraient
    uis uisons uisez uisant ui - - - uire
  `)),
  model('bruire', { lemmas: ['bruire'], strip: 4, invariableParticiple: true }, table(`
    uis uis uit - - uissent
    - - uissait - - uissaient
    - - - - - -
    uirai uiras uira uirons uirez uiront
    - - uisse - - uissent
    - - - - - -
    uirais uirais uirait uirions uiriez uiraient
    - - - uissant uit - - - uire
  `)),
  model('braire', { lemmas: ['braire'], strip: 4, invariableParticiple: true, thirdPersonOnly: true }, table(`
    - - ait - - aient
    - - ayait - - ayaient
    - - - - - -
    - - aira - - airont
    - - aie - - aient
    - - - - - -
    - - airait - - airaient
    - - - ayant ait - - - aire
  `)),
  model('foutre', { suffixes: ['foutre'], strip: 6 }, table(`
    fous fous fout foutons foutez foutent
    foutais foutais foutait foutions foutiez foutaient
    foutis foutis foutit foutîmes foutîtes foutirent
    foutrai foutras foutra foutrons foutrez foutront
    foute foutes foute foutions foutiez foutent
    foutisse foutisses foutît foutissions foutissiez foutissent
    foutrais foutrais foutrait foutrions foutriez foutraient
    fous foutons foutez foutant foutu foutue foutus foutues foutre
  `)),
  model('inclure', { suffixes: ['inclure', 'occlure', 'reclure'], strip: 5 }, table(`
    clus clus clut cluons cluez cluent
    cluais cluais cluait cluions cluiez cluaient
    clus clus clut clûmes clûtes clurent
    clurai cluras clura clurons clurez cluront
    clue clues clue cluions cluiez cluent
    clusse clusses clût clussions clussiez clussent
    clurais clurais clurait clurions cluriez cluraient
    clus cluons cluez cluant clus cluse clus cluses clure
  `)),
  model('enclore', { suffixes: ['enclore'], strip: 5 }, table(`
    clos clos t:clôt/r:clot closons closez closent
    - - - - - -
    - - - - - -
    clorai cloras clora clorons clorez cloront
    close closes close closions closiez closent
    - - - - - -
    clorais clorais clorait clorions cloriez cloraient
    clos - - closant clos close clos closes clore
  `)),
  model('prévaloir', { suffixes: ['prévaloir'], strip: 6 }, table(`
    vaux vaux vaut valons valez valent
    valais valais valait valions valiez valaient
    valus valus valut valûmes valûtes valurent
    vaudrai vaudras vaudra vaudrons vaudrez vaudront
    vale vales vale valions valiez valent
    valusse valusses valût valussions valussiez valussent
    vaudrais vaudrais vaudrait vaudrions vaudriez vaudraient
    vaux valons valez valant valu value valus values valoir
  `)),
  // Verbs used only in the infinitive (faire accroire, ester en justice).
  model('ester', { lemmas: ['accroire', 'assavoir', 'bienvenir', 'courre', 'ester', 'malfaire', 'méfaire', 'quérir', 'ravoir'], strip: 0 }, table(`
    - - - - - -
    - - - - - -
    - - - - - -
    - - - - - -
    - - - - - -
    - - - - - -
    - - - - - -
    - - - - - - - - 0
  `)),
  // Verbs surviving only in the infinitive and past participle.
  model('férir', { lemmas: ['férir'], strip: 3 }, table(`
    - - - - - -
    - - - - - -
    - - - - - -
    - - - - - -
    - - - - - -
    - - - - - -
    - - - - - -
    - - - - ru rue rus rues rir
  `)),
  model('issir', { lemmas: ['issir'], strip: 3 }, table(`
    - - - - - -
    - - - - - -
    - - - - - -
    - - - - - -
    - - - - - -
    - - - - - -
    - - - - - -
    - - - - su sue sus sues sir
  `)),
  model('rassir', { lemmas: ['rassir'], strip: 2 }, table(`
    - - - - - -
    - - - - - -
    - - - - - -
    - - - - - -
    - - - - - -
    - - - - - -
    - - - - - -
    - - - - is ise is ises ir
  `)),
  model('occire', { lemmas: ['occire'], strip: 3 }, table(`
    - - - - - -
    - - - - - -
    - - - - - -
    - - - - - -
    - - - - - -
    - - - - - -
    - - - - - -
    - - - - is ise is ises ire
  `)),
];

export const frenchModels: readonly FrenchModel[] = [...regular, ...irregular, ...families];

const byId = new Map(frenchModels.map(entry => [entry.id, entry]));

export function modelById(id: string): FrenchModel | undefined {
  return byId.get(id);
}

export interface ModelChoice {
  readonly model: FrenchModel;
  /** The selector that matched: the whole infinitive, or the suffix it ends with. */
  readonly selector: string;
  readonly listed: boolean;
}

/** Selects the model for an infinitive: a listed lemma, else the longest matching suffix. */
export function selectModel(lemma: string, candidates: readonly FrenchModel[] = frenchModels): ModelChoice | undefined {
  let best: ModelChoice | undefined;
  for (const entry of candidates) {
    if (entry.except.includes(lemma) || entry.exceptEndings.some(ending => lemma.endsWith(ending))) continue;
    if (entry.lemmas.includes(lemma)) return { model: entry, selector: lemma, listed: true };
    for (const suffix of entry.suffixes) {
      if (lemma.endsWith(suffix) && (!best || suffix.length > best.selector.length)) {
        best = { model: entry, selector: suffix, listed: suffix === lemma };
      }
    }
  }
  return best;
}
