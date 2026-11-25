/**
 * The Dutch lexicon and how a query becomes a lexeme. The tables list what the rules cannot derive: the principal parts
 * and flags of strong, mixed and otherwise special verbs (`dutchExceptions`), verbs with an unstressed prefix
 * (`inseparableVerbs`), separable and inseparable derivatives with their base verb, English loans with their stem, and
 * the lemmas that are separable in one sense and inseparable in another. `classifyDutch` reads them, with the query's
 * hints, into the one paradigm of a verb and records each classification as a step: the class the lexicon gives, a loan,
 * a separable or inseparable prefix, and the four assumptions made for a verb the lexicon does not know.
 */
import { step } from '../../core/derivation.js';
import type { DerivationStep } from '../../core/derivation.js';
import { one } from '../../core/fork.js';
import type { Fork } from '../../core/fork.js';
import type { LexemeBase } from '../../core/grammar.js';
import { ConjugationError } from '../../errors.js';
import { itemAt } from '../../parts.js';
import type { DutchConjugationOptions } from '../../types.js';
import { dutchRules } from './rules.js';
import type { DutchStemHints } from './spec.js';
import { presentStem } from './stems.js';
import type { PresentStem } from './stems.js';

/** What the lexicon lists for one verb: its principal parts where the rules cannot derive them, and its flags. */
export interface DutchEntry {
  readonly stem?: string;
  readonly pastSingular?: readonly string[];
  readonly pastPlural?: readonly string[];
  readonly participles?: readonly string[];
  readonly presentCells?: Readonly<Partial<Record<number, string>>>;
  readonly presentAlternatives?: Readonly<Partial<Record<number, readonly string[]>>>;
  readonly formalPresent?: readonly string[];
  readonly imperative?: string;
  readonly auxiliary?: 'hebben' | 'zijn' | 'both';
  readonly alsoWeakPast?: boolean;
  readonly alsoWeakParticiple?: boolean;
  readonly noImperative?: boolean;
  readonly impersonal?: boolean;
  readonly singularOnly?: boolean;
  readonly noCompound?: boolean;
  readonly reflexive?: boolean;
  readonly unstressedFinalSyllable?: boolean;
}

function strong(past: string, participle: string | null, extra: DutchEntry = {}): DutchEntry {
  return { pastSingular: past.split('/'), ...(participle ? { participles: participle.split('/') } : {}), ...extra };
}

function mixed(participle: string, extra: DutchEntry = {}): DutchEntry {
  return { participles: participle.split('/'), ...extra };
}

export const dutchExceptions: Readonly<Record<string, DutchEntry>> = {
  bakken: mixed('gebakken'),
  bannen: mixed('gebannen'),
  barsten: mixed('gebarsten', { auxiliary: 'zijn' }),
  bederven: strong('bedierf', 'bedorven', { auxiliary: 'both' }),
  bedriegen: strong('bedroog', 'bedrogen'),
  beginnen: strong('begon', 'begonnen', { auxiliary: 'zijn' }),
  behangen: strong('behing', 'behangen'),
  bergen: strong('borg', 'geborgen'),
  bevelen: strong('beval', 'bevolen'),
  bezwijken: strong('bezweek', 'bezweken', { auxiliary: 'zijn' }),
  bidden: strong('bad', 'gebeden'),
  bieden: strong('bood', 'geboden'),
  bijten: strong('beet', 'gebeten'),
  binden: strong('bond', 'gebonden'),
  blazen: strong('blies', 'geblazen'),
  blijken: strong('bleek', 'gebleken', { auxiliary: 'zijn', noImperative: true }),
  blijven: strong('bleef', 'gebleven', { auxiliary: 'zijn' }),
  blinken: strong('blonk', 'geblonken'),
  braden: mixed('gebraden'),
  breken: strong('brak', 'gebroken', { auxiliary: 'both' }),
  brengen: strong('bracht', 'gebracht'),
  brouwen: mixed('gebrouwen', { alsoWeakParticiple: true }),
  buigen: strong('boog', 'gebogen'),
  denken: strong('dacht', 'gedacht'),
  dingen: strong('dong', 'gedongen'),
  doen: strong('deed', 'gedaan', { stem: 'doe' }),
  dragen: strong('droeg', 'gedragen'),
  drijven: strong('dreef', 'gedreven', { auxiliary: 'both' }),
  dringen: strong('drong', 'gedrongen', { auxiliary: 'both' }),
  drinken: strong('dronk', 'gedronken'),
  druipen: strong('droop', 'gedropen', { auxiliary: 'both' }),
  duiken: strong('dook', 'gedoken', { auxiliary: 'both' }),
  dwingen: strong('dwong', 'gedwongen'),
  eten: strong('at', 'gegeten'),
  fluiten: strong('floot', 'gefloten'),
  gaan: strong('ging', 'gegaan', { stem: 'ga', auxiliary: 'zijn' }),
  gelden: strong('gold', 'gegolden'),
  genezen: strong('genas', 'genezen', { auxiliary: 'both' }),
  genieten: strong('genoot', 'genoten'),
  geven: strong('gaf', 'gegeven'),
  gieten: strong('goot', 'gegoten'),
  glijden: strong('gleed', 'gegleden', { presentAlternatives: { 0: ['glij'] }, auxiliary: 'zijn' }),
  glimmen: strong('glom', 'geglommen'),
  graven: strong('groef', 'gegraven'),
  grijpen: strong('greep', 'gegrepen'),
  hangen: strong('hing', 'gehangen'),
  hebben: strong('had', 'gehad', { pastPlural: ['hadden'], presentCells: { 2: 'heeft' }, formalPresent: ['hebt', 'heeft'] }),
  heffen: strong('hief', 'geheven'),
  helpen: strong('hielp', 'geholpen'),
  heten: mixed('geheten'),
  hijsen: strong('hees', 'gehesen', { pastPlural: ['hesen'] }),
  hoeven: mixed('gehoefd/gehoeven', { noImperative: true }),
  houden: strong('hield', 'gehouden', { presentAlternatives: { 0: ['hou'] } }),
  houwen: strong('hieuw', 'gehouwen'),
  jagen: strong('joeg', null, { alsoWeakPast: true }),
  kiezen: strong('koos', 'gekozen'),
  kijken: strong('keek', 'gekeken'),
  klimmen: strong('klom', 'geklommen', { auxiliary: 'both' }),
  klinken: strong('klonk', 'geklonken'),
  kluiven: strong('kloof', 'gekloven'),
  knijpen: strong('kneep', 'geknepen'),
  komen: strong('kwam', 'gekomen', { stem: 'kom', auxiliary: 'zijn' }),
  kopen: strong('kocht', 'gekocht'),
  krijgen: strong('kreeg', 'gekregen'),
  krimpen: strong('kromp', 'gekrompen', { auxiliary: 'zijn' }),
  kruipen: strong('kroop', 'gekropen', { auxiliary: 'both' }),
  kunnen: strong('kon', 'gekund', {
    stem: 'kan', pastPlural: ['konden'], presentCells: { 1: 'kunt', 2: 'kan' },
    presentAlternatives: { 1: ['kan'] }, formalPresent: ['kunt', 'kan'], noImperative: true,
  }),
  kwijten: strong('kweet', 'gekweten'),
  lachen: mixed('gelachen'),
  laden: mixed('geladen'),
  laten: strong('liet', 'gelaten'),
  lezen: strong('las', 'gelezen'),
  liegen: strong('loog', 'gelogen'),
  liggen: strong('lag', 'gelegen'),
  lijden: strong('leed', 'geleden'),
  lijken: strong('leek', 'geleken'),
  lopen: strong('liep', 'gelopen', { auxiliary: 'both' }),
  malen: mixed('gemalen', { alsoWeakParticiple: true }),
  melken: strong('molk', 'gemolken', { alsoWeakPast: true, alsoWeakParticiple: true }),
  meten: strong('mat', 'gemeten'),
  mijden: strong('meed', 'gemeden'),
  moeten: strong('moest', 'gemoeten', { noImperative: true }),
  mogen: strong('mocht', 'gemogen', { stem: 'mag', presentCells: { 1: 'mag', 2: 'mag' }, noImperative: true }),
  nemen: strong('nam', 'genomen'),
  nijgen: strong('neeg', 'genegen'),
  ontginnen: strong('ontgon', 'ontgonnen'),
  ontluiken: strong('ontlook', 'ontloken', { auxiliary: 'zijn' }),
  pluizen: strong('ploos', 'geplozen'),
  prijzen: strong('prees', 'geprezen'),
  raden: strong('ried', 'geraden', { alsoWeakPast: true }),
  rijden: strong('reed', 'gereden', { presentAlternatives: { 0: ['rij'] }, auxiliary: 'both' }),
  rijgen: strong('reeg', 'geregen'),
  rijten: strong('reet', 'gereten'),
  rijzen: strong('rees', 'gerezen', { auxiliary: 'zijn' }),
  roepen: strong('riep', 'geroepen'),
  ruiken: strong('rook', 'geroken'),
  scheiden: mixed('gescheiden', { auxiliary: 'both' }),
  schelden: strong('schold', 'gescholden'),
  schenden: strong('schond', 'geschonden'),
  schenken: strong('schonk', 'geschonken'),
  scheppen: strong('schiep', 'geschapen', { alsoWeakPast: true, alsoWeakParticiple: true }),
  scheren: strong('schoor', 'geschoren'),
  schieten: strong('schoot', 'geschoten', { auxiliary: 'both' }),
  schijnen: strong('scheen', 'geschenen'),
  schijten: strong('scheet', 'gescheten'),
  schrijven: strong('schreef', 'geschreven'),
  schrikken: strong('schrok', 'geschrokken', { alsoWeakPast: true, alsoWeakParticiple: true, auxiliary: 'both' }),
  schuilen: strong('school', 'gescholen', { alsoWeakPast: true, alsoWeakParticiple: true }),
  schuiven: strong('schoof', 'geschoven', { auxiliary: 'both' }),
  slaan: strong('sloeg', 'geslagen', { stem: 'sla' }),
  slapen: strong('sliep', 'geslapen'),
  slijpen: strong('sleep', 'geslepen'),
  slijten: strong('sleet', 'gesleten', { auxiliary: 'both' }),
  slinken: strong('slonk', 'geslonken', { auxiliary: 'zijn' }),
  sluipen: strong('sloop', 'geslopen', { auxiliary: 'both' }),
  sluiten: strong('sloot', 'gesloten'),
  smelten: strong('smolt', 'gesmolten', { alsoWeakPast: true, auxiliary: 'both' }),
  smijten: strong('smeet', 'gesmeten'),
  snijden: strong('sneed', 'gesneden', { presentAlternatives: { 0: ['snij'] } }),
  snuiten: strong('snoot', 'gesnoten'),
  snuiven: strong('snoof', 'gesnoven'),
  spannen: mixed('gespannen'),
  spijten: strong('speet', 'gespeten', { impersonal: true, noImperative: true }),
  spinnen: strong('spon', 'gesponnen'),
  splijten: strong('spleet', 'gespleten', { auxiliary: 'both' }),
  spreken: strong('sprak', 'gesproken'),
  springen: strong('sprong', 'gesprongen', { auxiliary: 'both' }),
  spruiten: strong('sproot', 'gesproten', { auxiliary: 'zijn' }),
  spuiten: strong('spoot', 'gespoten'),
  staan: strong('stond', 'gestaan', { stem: 'sta' }),
  steken: strong('stak', 'gestoken'),
  stelen: strong('stal', 'gestolen'),
  sterven: strong('stierf', 'gestorven', { auxiliary: 'zijn' }),
  stijgen: strong('steeg', 'gestegen', { auxiliary: 'zijn' }),
  stijven: strong('steef', 'gesteven', { alsoWeakPast: true, alsoWeakParticiple: true }),
  stinken: strong('stonk', 'gestonken'),
  stoten: strong('stiet', 'gestoten', { alsoWeakPast: true }),
  strijden: strong('streed', 'gestreden'),
  strijken: strong('streek', 'gestreken'),
  stuiven: strong('stoof', 'gestoven', { auxiliary: 'both' }),
  treden: strong('trad', 'getreden', { auxiliary: 'both' }),
  treffen: strong('trof', 'getroffen'),
  trekken: strong('trok', 'getrokken', { auxiliary: 'both' }),
  vallen: strong('viel', 'gevallen', { auxiliary: 'zijn' }),
  vangen: strong('ving', 'gevangen'),
  varen: strong('voer', 'gevaren', { auxiliary: 'both' }),
  vechten: strong('vocht', 'gevochten'),
  verdrieten: strong('verdroot', 'verdroten'),
  verdwijnen: strong('verdween', 'verdwenen', { auxiliary: 'zijn' }),
  vergeten: strong('vergat', 'vergeten', { auxiliary: 'both' }),
  verliezen: strong('verloor', 'verloren'),
  vinden: strong('vond', 'gevonden'),
  vlechten: strong('vlocht', 'gevlochten', { alsoWeakPast: true, alsoWeakParticiple: true }),
  vliegen: strong('vloog', 'gevlogen', { auxiliary: 'both' }),
  vouwen: mixed('gevouwen'),
  vragen: strong('vroeg', null, { alsoWeakPast: true }),
  vreten: strong('vrat', 'gevreten'),
  vriezen: strong('vroor', 'gevroren', { auxiliary: 'both', noImperative: true, impersonal: true, singularOnly: true }),
  wassen: mixed('gewassen'),
  wegen: strong('woog', 'gewogen'),
  werpen: strong('wierp', 'geworpen'),
  werven: strong('wierf', 'geworven'),
  weten: strong('wist', 'geweten'),
  weven: mixed('geweven'),
  wijken: strong('week', 'geweken', { auxiliary: 'zijn' }),
  wijten: strong('weet', 'geweten'),
  wijzen: strong('wees', 'gewezen'),
  winden: strong('wond', 'gewonden'),
  winnen: strong('won', 'gewonnen'),
  worden: strong('werd', 'geworden', { auxiliary: 'zijn' }),
  wrijven: strong('wreef', 'gewreven'),
  wringen: strong('wrong', 'gewrongen'),
  zeggen: strong('zei/zegde', 'gezegd', { pastPlural: ['zeiden', 'zegden'] }),
  zenden: strong('zond', 'gezonden'),
  zien: strong('zag', 'gezien', { stem: 'zie' }),
  zijn: strong('was', 'geweest', {
    stem: 'ben', pastPlural: ['waren'], presentCells: { 0: 'ben', 1: 'bent', 2: 'is' },
    formalPresent: ['bent'], imperative: 'wees', auxiliary: 'zijn',
  }),
  zingen: strong('zong', 'gezongen'),
  zinken: strong('zonk', 'gezonken', { auxiliary: 'zijn' }),
  zinnen: strong('zon', 'gezonnen'),
  zitten: strong('zat', 'gezeten'),
  zoeken: strong('zocht', 'gezocht'),
  zuigen: strong('zoog', 'gezogen'),
  zuipen: strong('zoop', 'gezopen'),
  zullen: strong('zou', null, {
    stem: 'zal', pastPlural: ['zouden'], presentCells: { 1: 'zult', 2: 'zal' },
    presentAlternatives: { 1: ['zal'] },
    formalPresent: ['zult', 'zal'], noImperative: true, noCompound: true,
  }),
  zwelgen: strong('zwolg', 'gezwolgen'),
  zwellen: strong('zwol', 'gezwollen', { auxiliary: 'zijn' }),
  zwemmen: strong('zwom', 'gezwommen', { auxiliary: 'both' }),
  zweren: strong('zwoor/zwoer', 'gezworen', { alsoWeakPast: true, alsoWeakParticiple: true }),
  zwerven: strong('zwierf', 'gezworven'),
  zwijgen: strong('zweeg', 'gezwegen'),
  willen: mixed('gewild', {
    stem: 'wil', pastSingular: ['wou'], pastPlural: ['wouden'], alsoWeakPast: true,
    presentCells: { 1: 'wilt', 2: 'wil' }, presentAlternatives: { 1: ['wil'] },
    formalPresent: ['wilt', 'wil'],
  }),
  waaien: strong('woei', null, { alsoWeakPast: true }),
  wandelen: { auxiliary: 'both' },
  reizen: { auxiliary: 'both' },
  vergissen: { reflexive: true },
  kosten: { noImperative: true },
  schamen: { reflexive: true },
  bemoeien: { reflexive: true },
  proberen: { unstressedFinalSyllable: false },
  studeren: { unstressedFinalSyllable: false },
  // Verbs with an unstressed prefix (`inseparableVerbs`) and what woordenlijst.org gives them beyond their prefix: the
  // strong forms of vergelijken and ervaren, and the perfect auxiliary of the others (verb features "hebben/zijn" or
  // "zijn"; https://woordenlijst.org/zoeken/?q=verhuizen and so on).
  vergelijken: strong('vergeleek', 'vergeleken'),
  ervaren: strong('ervoer', 'ervaren', { alsoWeakPast: true }),
  verhuizen: { auxiliary: 'both' },
  veranderen: { auxiliary: 'both' },
  verbeteren: { auxiliary: 'both' },
  verklaren: { auxiliary: 'both' },
  verzamelen: { auxiliary: 'both' },
  ontmoeten: { auxiliary: 'both' },
  herstellen: { auxiliary: 'both' },
  ontsnappen: { auxiliary: 'zijn' },
  gebeuren: { auxiliary: 'zijn' },
};

export const inseparableVerbs: Readonly<Record<string, string>> = {
  bederven: 'be', bedriegen: 'be', beginnen: 'be', behangen: 'be', beloven: 'be', betalen: 'be',
  bevelen: 'be', bezwijken: 'be', geloven: 'ge', genezen: 'ge', genieten: 'ge',
  ontdekken: 'ont', ontginnen: 'ont', ontluiken: 'ont', verdrieten: 'ver',
  verdwijnen: 'ver', vergeten: 'ver', vergissen: 'ver', verliezen: 'ver',
  bestellen: 'be', behandelen: 'be', bedanken: 'be', gebruiken: 'ge',
  herkennen: 'her', herinneren: 'her', proberen: '', studeren: '',
  // Common verbs with an unstressed prefix, each checked on woordenlijst.org: listed as not separable, with a past
  // participle without ge- (verhuisd: https://woordenlijst.org/zoeken/?q=verhuizen and so on).
  beantwoorden: 'be', bedekken: 'be', bedoelen: 'be', behagen: 'be', belegeren: 'be', beleven: 'be', bemoeien: 'be',
  bepalen: 'be', bereiken: 'be', beschermen: 'be', beslissen: 'be', bestormen: 'be', betekenen: 'be', bewaren: 'be',
  beweren: 'be', erkennen: 'er', ervaren: 'er', gebeuren: 'ge', gehoorzamen: 'ge', herhalen: 'her', herstellen: 'her',
  ontmoeten: 'ont', ontsnappen: 'ont', ontwikkelen: 'ont', veranderen: 'ver', verbeteren: 'ver', verdedigen: 'ver',
  verdienen: 'ver', vergelijken: 'ver', verhuizen: 'ver', verklaren: 'ver', vermoeden: 'ver', verrassen: 'ver',
  versturen: 'ver', vertalen: 'ver', vertellen: 'ver', vertrouwen: 'ver', verwachten: 'ver', verzamelen: 'ver',
};

export interface DutchDerivative {
  readonly prefix: string;
  readonly base: string;
  readonly auxiliary?: 'hebben' | 'zijn' | 'both';
  readonly personal?: boolean;
}

export const separableVerbs: Readonly<Record<string, DutchDerivative>> = {
  aanbieden: { prefix: 'aan', base: 'bieden' },
  aankomen: { prefix: 'aan', base: 'komen' },
  aanzetten: { prefix: 'aan', base: 'zetten' },
  opbellen: { prefix: 'op', base: 'bellen' },
  opstaan: { prefix: 'op', base: 'staan', auxiliary: 'zijn' },
  uitgaan: { prefix: 'uit', base: 'gaan' },
  uitnodigen: { prefix: 'uit', base: 'nodigen' },
  terugkomen: { prefix: 'terug', base: 'komen' },
  meenemen: { prefix: 'mee', base: 'nemen' },
  weggaan: { prefix: 'weg', base: 'gaan' },
  invriezen: { prefix: 'in', base: 'vriezen', auxiliary: 'hebben', personal: true },
};

export const inseparableDerivatives: Readonly<Record<string, DutchDerivative>> = {
  begrijpen: { prefix: 'be', base: 'grijpen' },
  verkrijgen: { prefix: 'ver', base: 'krijgen' },
  ontvangen: { prefix: 'ont', base: 'vangen' },
  verkopen: { prefix: 'ver', base: 'kopen' },
  behouden: { prefix: 'be', base: 'houden' },
  bezoeken: { prefix: 'be', base: 'zoeken' },
  verwerken: { prefix: 'ver', base: 'werken' },
  herlezen: { prefix: 'her', base: 'lezen' },
  vermijden: { prefix: 'ver', base: 'mijden' },
  verwijzen: { prefix: 'ver', base: 'wijzen' },
  ontstaan: { prefix: 'ont', base: 'staan', auxiliary: 'zijn' },
  bestaan: { prefix: 'be', base: 'staan', auxiliary: 'hebben' },
  begaan: { prefix: 'be', base: 'gaan', auxiliary: 'hebben' },
  vergaan: { prefix: 'ver', base: 'gaan' },
  vertrekken: { prefix: 'ver', base: 'trekken', auxiliary: 'zijn' },
  bevriezen: { prefix: 'be', base: 'vriezen', auxiliary: 'both', personal: true },
  // Common strong derivatives, each checked on woordenlijst.org: not separable, the forms of the base without ge- in
  // the participle (besloot, besloten), and the auxiliary woordenlijst.org gives (https://woordenlijst.org/zoeken/?q=besluiten
  // and so on).
  bedenken: { prefix: 'be', base: 'denken', auxiliary: 'hebben' },
  bekijken: { prefix: 'be', base: 'kijken', auxiliary: 'hebben' },
  beschrijven: { prefix: 'be', base: 'schrijven', auxiliary: 'hebben' },
  besluiten: { prefix: 'be', base: 'sluiten', auxiliary: 'hebben' },
  bespreken: { prefix: 'be', base: 'spreken', auxiliary: 'hebben' },
  bevallen: { prefix: 'be', base: 'vallen', auxiliary: 'both' },
  bewegen: { prefix: 'be', base: 'wegen', auxiliary: 'hebben' },
  bewijzen: { prefix: 'be', base: 'wijzen', auxiliary: 'hebben' },
  bezitten: { prefix: 'be', base: 'zitten', auxiliary: 'hebben' },
  ontbijten: { prefix: 'ont', base: 'bijten', auxiliary: 'hebben' },
  ontbreken: { prefix: 'ont', base: 'breken', auxiliary: 'hebben' },
  onthouden: { prefix: 'ont', base: 'houden', auxiliary: 'hebben' },
  verbergen: { prefix: 'ver', base: 'bergen', auxiliary: 'hebben' },
  verbieden: { prefix: 'ver', base: 'bieden', auxiliary: 'hebben' },
  verbinden: { prefix: 'ver', base: 'binden', auxiliary: 'hebben' },
  vergeven: { prefix: 'ver', base: 'geven', auxiliary: 'hebben' },
  verlaten: { prefix: 'ver', base: 'laten', auxiliary: 'hebben' },
  verschijnen: { prefix: 'ver', base: 'schijnen', auxiliary: 'zijn' },
  verstaan: { prefix: 'ver', base: 'staan', auxiliary: 'hebben' },
  vervallen: { prefix: 'ver', base: 'vallen', auxiliary: 'zijn' },
  vervangen: { prefix: 'ver', base: 'vangen', auxiliary: 'hebben' },
  verwerven: { prefix: 'ver', base: 'werven', auxiliary: 'hebben' },
};

export interface DutchLoan {
  readonly stem: string;
  readonly pastSuffix?: 'd' | 't' | 'both';
}

export const dutchLoans: Readonly<Record<string, DutchLoan>> = {
  downloaden: { stem: 'download', pastSuffix: 'd' },
  faxen: { stem: 'fax', pastSuffix: 't' },
  skaten: { stem: 'skate', pastSuffix: 't' },
  updaten: { stem: 'update', pastSuffix: 't' },
  upgraden: { stem: 'upgrade', pastSuffix: 'd' },
  saven: { stem: 'save', pastSuffix: 'd' },
  leasen: { stem: 'lease', pastSuffix: 'both' },
  golfen: { stem: 'golf', pastSuffix: 'both' },
  briefen: { stem: 'brief', pastSuffix: 'both' },
  bridgen: { stem: 'bridge', pastSuffix: 'both' },
  pushen: { stem: 'push', pastSuffix: 't' },
  stretchen: { stem: 'stretch', pastSuffix: 't' },
  crossen: { stem: 'cros', pastSuffix: 't' },
  paintballen: { stem: 'paintball', pastSuffix: 'd' },
  volleyballen: { stem: 'volleybal', pastSuffix: 'd' },
  snookeren: { stem: 'snooker', pastSuffix: 'd' },
  faceliften: { stem: 'facelift', pastSuffix: 't' },
  rugbyen: { stem: 'rugby', pastSuffix: 'd' },
  barbecueën: { stem: 'barbecue', pastSuffix: 'd' },
  scoren: { stem: 'scoor', pastSuffix: 'd' },
  promoten: { stem: 'promoot', pastSuffix: 't' },
  'e-mailen': { stem: 'e-mail', pastSuffix: 'd' },
};

/**
 * The separable particles that are never an unstressed prefix: the closed lists of e-ANS 12.3.4.1 (particles that are
 * also adpositions) and 12.3.4.2 (other particles, single and compound), without those that e-ANS also names as a
 * prefix (`dualPrefixes`). An unlisted verb that starts with one is split: opzorpen, ik zorp op.
 */
export const separableParticles: readonly string[] = [
  'af', 'bij', 'binnen', 'boven', 'buiten', 'heen', 'in', 'langs', 'mee', 'na', 'op', 'rond', 'tegen', 'toe', 'uit', 'voorbij',
  'neer', 'samen', 'terecht', 'terug', 'thuis', 'voort', 'weg',
  'achteraan', 'achteraf', 'vooraf', 'voorop', 'achterna', 'achterom', 'achterop', 'achteruit', 'omhoog', 'omlaag', 'vooruit',
  'achterover', 'omver', 'onderuit', 'voorover', 'aaneen', 'bijeen', 'dooreen', 'ineen', 'opeen', 'uiteen',
];

/** How many of the verbs woordenlijst.org lists with a dual prefix read it as a separable particle, and how many keep it. */
interface DualCount { readonly separable: number; readonly inseparable: number }

/**
 * The particles that e-ANS also names as unstressed prefixes: door-, mis-, om-, onder-, over- (12.3.2.1.5-9), aan
 * (aanbídden, 12.3.4.1.1), achter (achtervólgen, 12.3.4.1.2), voor (voorkómen, 12.3.4.1.22), weer (weerspréken,
 * 12.3.4.2.8) and vol (vol-dóen, 12.3.2.1, table 2), with how the verbs woordenlijst.org lists with each read it,
 * counted on 2026-11-25 with its lexicon service (https://woordenlijst.org/MolexServe/lexicon/find_wordform, database
 * gig_pro_wrdlst; every verb starting with the prefix and with no longer particle): `separable` is marked separable, or
 * has ge- after the prefix in its participle (aangehold); `inseparable` has the prefix and no ge- in its participle
 * (aanbeden); a lemma with both readings counts once for each, and verbs with ge- before the whole word (achterklappen)
 * are left out. An unlisted verb with the prefix gets its default reading (`dualReading`).
 */
export const dualPrefixCounts: Readonly<Record<string, DualCount>> = {
  aan: { separable: 295, inseparable: 4 },
  achter: { separable: 9, inseparable: 3 },
  door: { separable: 228, inseparable: 79 },
  mis: { separable: 20, inseparable: 40 },
  om: { separable: 134, inseparable: 67 },
  onder: { separable: 39, inseparable: 54 },
  over: { separable: 129, inseparable: 109 },
  vol: { separable: 37, inseparable: 13 },
  voor: { separable: 80, inseparable: 10 },
  weer: { separable: 6, inseparable: 9 },
};

export const dualPrefixes: readonly string[] = Object.keys(dualPrefixCounts);

/** The share of separable readings from which an unlisted verb with a dual prefix is read as separable. */
const separableShare = 0.6;

/**
 * The default reading of an unlisted verb with dual prefix `prefix`, and why: separable when at least 60% of the verbs
 * woordenlijst.org lists with it are separable (aan, achter, door, om, vol, voor: `most`); otherwise inseparable, because
 * most keep it (mis, onder, weer: `most`) or because the two readings are close to even (over, 54% separable: `close`),
 * where keeping the verb whole is the safer guess: its forms keep the spelling of the infinitive.
 */
export function dualReading(prefix: string): { readonly separable: boolean; readonly why: 'most' | 'close' } {
  const { separable, inseparable } = dualPrefixCounts[prefix]!;
  const share = separable / (separable + inseparable);
  return share >= separableShare ? { separable: true, why: 'most' } : { separable: false, why: share >= 0.5 ? 'close' : 'most' };
}

/** A verb with a dual prefix that keeps it, checked on woordenlijst.org: the prefix, its auxiliary, its lemma id and participle there. */
interface DualInseparable {
  readonly prefix: string;
  readonly auxiliary: 'hebben' | 'zijn' | 'both';
  readonly id: number;
  readonly participle: string;
}

/**
 * The verbs woordenlijst.org lists only with the inseparable reading of a dual prefix whose default is separable
 * (aanbidden, achtervolgen, doorgronden, omhelzen, voldoen, voorzien): read as inseparable derivatives of what follows
 * the prefix, with the auxiliary woordenlijst.org gives. Compiled with the counts above, each checked: the forms the
 * engine gives it as a derivative are the present, past and participle woordenlijst.org lists. Left out: doordesemen
 * (its base desemen has an unstressed last syllable the rules cannot see) and four verbs with a second particle inside
 * (vooraanmelden, voorinvullen, voorinschrijven, voorintekenen).
 */
export const dualInseparableVerbs: Readonly<Record<string, DualInseparable>> = {
  aanbidden: { prefix: 'aan', auxiliary: 'hebben', id: 110371, participle: 'aanbeden' },
  aanschouwen: { prefix: 'aan', auxiliary: 'hebben', id: 103957, participle: 'aanschouwd' },
  aanvaarden: { prefix: 'aan', auxiliary: 'hebben', id: 103965, participle: 'aanvaard' },
  achterhalen: { prefix: 'achter', auxiliary: 'hebben', id: 103989, participle: 'achterhaald' },
  achtervolgen: { prefix: 'achter', auxiliary: 'hebben', id: 103991, participle: 'achtervolgd' },
  achterwaren: { prefix: 'achter', auxiliary: 'hebben', id: 103992, participle: 'achterwaard' },
  dooraderen: { prefix: 'door', auxiliary: 'hebben', id: 949467, participle: 'dooraderd' },
  doordrenken: { prefix: 'door', auxiliary: 'hebben', id: 105179, participle: 'doordrenkt' },
  doorgronden: { prefix: 'door', auxiliary: 'hebben', id: 105182, participle: 'doorgrond' },
  doorlijden: { prefix: 'door', auxiliary: 'hebben', id: 944757, participle: 'doorleden' },
  doorschouwen: { prefix: 'door', auxiliary: 'hebben', id: 105195, participle: 'doorschouwd' },
  doorspekken: { prefix: 'door', auxiliary: 'hebben', id: 105198, participle: 'doorspekt' },
  doorvorsen: { prefix: 'door', auxiliary: 'hebben', id: 105209, participle: 'doorvorst' },
  doorweken: { prefix: 'door', auxiliary: 'hebben', id: 105214, participle: 'doorweekt' },
  doorzeven: { prefix: 'door', auxiliary: 'hebben', id: 105218, participle: 'doorzeefd' },
  omarmen: { prefix: 'om', auxiliary: 'hebben', id: 106976, participle: 'omarmd' },
  omboorden: { prefix: 'om', auxiliary: 'hebben', id: 106978, participle: 'omboord' },
  omcirkelen: { prefix: 'om', auxiliary: 'hebben', id: 106979, participle: 'omcirkeld' },
  omdijken: { prefix: 'om', auxiliary: 'hebben', id: 106980, participle: 'omdijkt' },
  omfloersen: { prefix: 'om', auxiliary: 'hebben', id: 106981, participle: 'omfloerst' },
  omgrachten: { prefix: 'om', auxiliary: 'hebben', id: 153678, participle: 'omgracht' },
  omgrenzen: { prefix: 'om', auxiliary: 'hebben', id: 106984, participle: 'omgrensd' },
  omheinen: { prefix: 'om', auxiliary: 'hebben', id: 106986, participle: 'omheind' },
  omhelzen: { prefix: 'om', auxiliary: 'hebben', id: 106987, participle: 'omhelsd' },
  omhullen: { prefix: 'om', auxiliary: 'hebben', id: 106988, participle: 'omhuld' },
  omhulzen: { prefix: 'om', auxiliary: 'hebben', id: 154337, participle: 'omhulsd' },
  omkaderen: { prefix: 'om', auxiliary: 'hebben', id: 106989, participle: 'omkaderd' },
  omkasten: { prefix: 'om', auxiliary: 'hebben', id: 152272, participle: 'omkast' },
  omklemmen: { prefix: 'om', auxiliary: 'hebben', id: 106991, participle: 'omklemd' },
  omknellen: { prefix: 'om', auxiliary: 'hebben', id: 106992, participle: 'omkneld' },
  omkransen: { prefix: 'om', auxiliary: 'hebben', id: 106993, participle: 'omkranst' },
  omkringen: { prefix: 'om', auxiliary: 'hebben', id: 165529, participle: 'omkringd' },
  omlijnen: { prefix: 'om', auxiliary: 'hebben', id: 106995, participle: 'omlijnd' },
  omlijsten: { prefix: 'om', auxiliary: 'hebben', id: 106996, participle: 'omlijst' },
  ommantelen: { prefix: 'om', auxiliary: 'hebben', id: 160685, participle: 'ommanteld' },
  ommuren: { prefix: 'om', auxiliary: 'hebben', id: 106997, participle: 'ommuurd' },
  ompalen: { prefix: 'om', auxiliary: 'hebben', id: 106998, participle: 'ompaald' },
  omranden: { prefix: 'om', auxiliary: 'hebben', id: 106999, participle: 'omrand' },
  omrasteren: { prefix: 'om', auxiliary: 'hebben', id: 107000, participle: 'omrasterd' },
  omringen: { prefix: 'om', auxiliary: 'hebben', id: 107001, participle: 'omringd' },
  omschrijven: { prefix: 'om', auxiliary: 'hebben', id: 107002, participle: 'omschreven' },
  omsingelen: { prefix: 'om', auxiliary: 'hebben', id: 107003, participle: 'omsingeld' },
  omsluieren: { prefix: 'om', auxiliary: 'hebben', id: 107005, participle: 'omsluierd' },
  omsluiten: { prefix: 'om', auxiliary: 'hebben', id: 107006, participle: 'omsloten' },
  omspinnen: { prefix: 'om', auxiliary: 'hebben', id: 107011, participle: 'omsponnen' },
  omstralen: { prefix: 'om', auxiliary: 'hebben', id: 107013, participle: 'omstraald' },
  omstrengelen: { prefix: 'om', auxiliary: 'hebben', id: 107014, participle: 'omstrengeld' },
  omtuinen: { prefix: 'om', auxiliary: 'hebben', id: 168450, participle: 'omtuind' },
  omvangen: { prefix: 'om', auxiliary: 'hebben', id: 107017, participle: 'omvangen' },
  omvatten: { prefix: 'om', auxiliary: 'hebben', id: 107018, participle: 'omvat' },
  omwallen: { prefix: 'om', auxiliary: 'hebben', id: 107020, participle: 'omwald' },
  omwolken: { prefix: 'om', auxiliary: 'hebben', id: 107024, participle: 'omwolkt' },
  omzwachtelen: { prefix: 'om', auxiliary: 'hebben', id: 107029, participle: 'omzwachteld' },
  volbrengen: { prefix: 'vol', auxiliary: 'hebben', id: 109681, participle: 'volbracht' },
  voldingen: { prefix: 'vol', auxiliary: 'hebben', id: 153929, participle: 'voldongen' },
  voldoen: { prefix: 'vol', auxiliary: 'hebben', id: 109682, participle: 'voldaan' },
  voleinden: { prefix: 'vol', auxiliary: 'hebben', id: 109683, participle: 'voleind' },
  voleindigen: { prefix: 'vol', auxiliary: 'hebben', id: 109684, participle: 'voleindigd' },
  volgroeien: { prefix: 'vol', auxiliary: 'zijn', id: 109686, participle: 'volgroeid' },
  volharden: { prefix: 'vol', auxiliary: 'hebben', id: 109687, participle: 'volhard' },
  volstaan: { prefix: 'vol', auxiliary: 'hebben', id: 109693, participle: 'volstaan' },
  voltooien: { prefix: 'vol', auxiliary: 'hebben', id: 109695, participle: 'voltooid' },
  voltrekken: { prefix: 'vol', auxiliary: 'hebben', id: 109696, participle: 'voltrokken' },
  volvoeren: { prefix: 'vol', auxiliary: 'hebben', id: 109697, participle: 'volvoerd' },
  vooronderstellen: { prefix: 'voor', auxiliary: 'hebben', id: 109703, participle: 'voorondersteld' },
  voorvoelen: { prefix: 'voor', auxiliary: 'hebben', id: 109707, participle: 'voorvoeld' },
  voorzien: { prefix: 'voor', auxiliary: 'hebben', id: 109709, participle: 'voorzien' },
};

/** How a verb on the no-split list was checked on woordenlijst.org: its lemma id, and its past participle there. */
interface SimplexCheck {
  /** The lemma id in the woordenlijst.org lexicon service (database gig_pro_wrdlst). */
  readonly id: number;
  /** The past participle woordenlijst.org gives, with ge- before the whole word; null when it lists only the infinitive. */
  readonly participle: string | null;
}

/**
 * The no-split list: verbs whose spelling begins with a particle's or a dual prefix's letters but which have neither
 * (naderen, informeren, missioneren), so the inference reads them whole. Compiled from the woordenlijst.org lexicon
 * service (https://woordenlijst.org/MolexServe/lexicon/find_wordform, database gig_pro_wrdlst) on 2026-11-25: for each
 * separable particle and dual prefix, every verb it lists that starts with it and is not marked separable (sep=yes),
 * and that the other guards would split or read with a prefix; for a dual prefix (vol included), only those whose
 * participle has ge- before the whole word (gemissioneerd, gevoltigeerd), as the others have a reading of the prefix. Left
 * out are the four whose participle shows the particle split off after all (weggeweest, voorafgebeeld,
 * voorafgeschaduwd, voorafgespiegeld). Each entry records the check: its lemma id and its participle there.
 */
export const simplexVerbs: Readonly<Record<string, SimplexCheck>> = {
  achterklappen: { id: 103990, participle: 'geachterklapt' },
  affecteren: { id: 149757, participle: 'geaffecteerd' },
  afficheren: { id: 104012, participle: 'geafficheerd' },
  affiliëren: { id: 110287, participle: 'geaffilieerd' },
  affineren: { id: 166925, participle: 'geaffineerd' },
  affirmeren: { id: 104013, participle: 'geaffirmeerd' },
  affronteren: { id: 104014, participle: 'geaffronteerd' },
  afrikaniseren: { id: 104015, participle: 'geafrikaniseerd' },
  afrokappen: { id: 170549, participle: null },
  afstandshamen: { id: 920185, participle: null },
  afvalscheiden: { id: 170615, participle: null },
  bovengisten: { id: 952304, participle: null },
  bovenwinkelwonen: { id: 172972, participle: null },
  incarneren: { id: 106015, participle: 'geïncarneerd' },
  incasseren: { id: 106016, participle: 'geïncasseerd' },
  inclineren: { id: 106017, participle: 'geïnclineerd' },
  includeren: { id: 155086, participle: 'geïncludeerd' },
  incorporeren: { id: 106018, participle: 'geïncorporeerd' },
  incrimineren: { id: 157071, participle: 'geïncrimineerd' },
  incuberen: { id: 163879, participle: 'geïncubeerd' },
  indexbeleggen: { id: 179650, participle: null },
  indexeren: { id: 106019, participle: 'geïndexeerd' },
  indiceren: { id: 106020, participle: 'geïndiceerd' },
  individualiseren: { id: 106021, participle: 'geïndividualiseerd' },
  indoctrineren: { id: 106022, participle: 'geïndoctrineerd' },
  indoornachtvliegen: { id: 179667, participle: null },
  indoorroeien: { id: 179669, participle: null },
  indoorvliegeren: { id: 179673, participle: null },
  indosseren: { id: 106023, participle: 'geïndosseerd' },
  induceren: { id: 106024, participle: 'geïnduceerd' },
  industrialiseren: { id: 106025, participle: 'geïndustrialiseerd' },
  infantiliseren: { id: 106027, participle: 'geïnfantiliseerd' },
  infecteren: { id: 106028, participle: 'geïnfecteerd' },
  infiltreren: { id: 106029, participle: 'geïnfiltreerd' },
  inflateren: { id: 167686, participle: 'geïnflateerd' },
  influencen: { id: 937473, participle: 'geïnfluencet' },
  influenceren: { id: 106030, participle: 'geïnfluenceerd' },
  informatiseren: { id: 106031, participle: 'geïnformatiseerd' },
  informeren: { id: 106032, participle: 'geïnformeerd' },
  infunderen: { id: 159117, participle: 'geïnfundeerd' },
  infuseren: { id: 149436, participle: 'geïnfuseerd' },
  inhaleren: { id: 106034, participle: 'geïnhaleerd' },
  inhiberen: { id: 168929, participle: 'geïnhibeerd' },
  injecteren: { id: 106035, participle: 'geïnjecteerd' },
  inlineskaten: { id: 110066, participle: 'geïnlineskatet' },
  innerveren: { id: 154730, participle: 'geïnnerveerd' },
  innoveren: { id: 106038, participle: 'geïnnoveerd' },
  inscriberen: { id: 901501, participle: 'geïnscribeerd' },
  insemineren: { id: 106039, participle: 'geïnsemineerd' },
  insereren: { id: 159167, participle: 'geïnsereerd' },
  insinueren: { id: 106040, participle: 'geïnsinueerd' },
  insisteren: { id: 106041, participle: 'geïnsisteerd' },
  insourcen: { id: 152238, participle: 'geïnsourcet' },
  inspecteren: { id: 106042, participle: 'geïnspecteerd' },
  inspireren: { id: 106043, participle: 'geïnspireerd' },
  instagrammen: { id: 179813, participle: 'geïnstagramd' },
  installeren: { id: 106044, participle: 'geïnstalleerd' },
  instantiëren: { id: 153287, participle: 'geïnstantieerd' },
  instigeren: { id: 106045, participle: 'geïnstigeerd' },
  institueren: { id: 106046, participle: 'geïnstitueerd' },
  institutionaliseren: { id: 106047, participle: 'geïnstitutionaliseerd' },
  instrueren: { id: 106048, participle: 'geïnstrueerd' },
  instrumentaliseren: { id: 165096, participle: 'geïnstrumentaliseerd' },
  instrumenteren: { id: 106049, participle: 'geïnstrumenteerd' },
  instrumentvliegen: { id: 890736, participle: null },
  intaken: { id: 198825, participle: null },
  integreren: { id: 106050, participle: 'geïntegreerd' },
  intenderen: { id: 106051, participle: 'geïntendeerd' },
  intensifiëren: { id: 110327, participle: 'geïntensifieerd' },
  intensiveren: { id: 106052, participle: 'geïntensiveerd' },
  interacteren: { id: 150637, participle: 'geïnteracteerd' },
  interageren: { id: 150412, participle: 'geïnterageerd' },
  intercepteren: { id: 106053, participle: 'geïntercepteerd' },
  interculturaliseren: { id: 162414, participle: 'geïnterculturaliseerd' },
  interesseren: { id: 106054, participle: 'geïnteresseerd' },
  interfacen: { id: 948341, participle: 'geïnterfacet' },
  interfereren: { id: 106055, participle: 'geïnterfereerd' },
  interliniëren: { id: 110328, participle: 'geïnterlinieerd' },
  intermediëren: { id: 160134, participle: 'geïntermedieerd' },
  internaliseren: { id: 106057, participle: 'geïnternaliseerd' },
  internationaliseren: { id: 106058, participle: 'geïnternationaliseerd' },
  interneppen: { id: 950142, participle: 'geïnternept' },
  interneren: { id: 106059, participle: 'geïnterneerd' },
  internetbankieren: { id: 110261, participle: 'geïnternetbankierd' },
  internetbellen: { id: 179905, participle: 'geïnternetbeld' },
  internetdaten: { id: 166364, participle: 'geïnternetdatet' },
  internetgokken: { id: 179953, participle: null },
  internetparkeren: { id: 180000, participle: null },
  internetsparen: { id: 180030, participle: null },
  internetten: { id: 110061, participle: 'geïnternet' },
  internetwinkelen: { id: 165845, participle: 'geïnternetwinkeld' },
  interpelleren: { id: 106060, participle: 'geïnterpelleerd' },
  interpoleren: { id: 106061, participle: 'geïnterpoleerd' },
  interpreteren: { id: 106062, participle: 'geïnterpreteerd' },
  interpungeren: { id: 106063, participle: 'geïnterpungeerd' },
  interrumperen: { id: 106064, participle: 'geïnterrumpeerd' },
  interveniëren: { id: 110329, participle: 'geïntervenieerd' },
  interviewen: { id: 106065, participle: 'geïnterviewd' },
  intimideren: { id: 106066, participle: 'geïntimideerd' },
  intoneren: { id: 106067, participle: 'geïntoneerd' },
  intoxiceren: { id: 170091, participle: 'geïntoxiceerd' },
  intrigeren: { id: 106068, participle: 'geïntrigeerd' },
  introduceren: { id: 106069, participle: 'geïntroduceerd' },
  intuberen: { id: 152942, participle: 'geïntubeerd' },
  invalideren: { id: 106071, participle: 'geïnvalideerd' },
  inventariseren: { id: 106072, participle: 'geïnventariseerd' },
  inverteren: { id: 159448, participle: 'geïnverteerd' },
  investeren: { id: 106073, participle: 'geïnvesteerd' },
  investigeren: { id: 149869, participle: 'geïnvestigeerd' },
  inviteren: { id: 106074, participle: 'geïnviteerd' },
  involveren: { id: 106075, participle: 'geïnvolveerd' },
  langstuderen: { id: 181642, participle: null },
  meegolven: { id: 106733, participle: null },
  meerderen: { id: 106736, participle: 'gemeerderd' },
  meergeneratiewonen: { id: 182675, participle: null },
  meerkatten: { id: 903780, participle: 'gemeerkat' },
  meesmuilen: { id: 106737, participle: 'gemeesmuild' },
  meesteren: { id: 106738, participle: 'gemeesterd' },
  misinterpreteren: { id: 153160, participle: 'gemisinterpreteerd' },
  missioneren: { id: 106826, participle: 'gemissioneerd' },
  nachtbraken: { id: 106901, participle: 'genachtbraakt' },
  nachtvliegen: { id: 106902, participle: null },
  nachtvliegeren: { id: 179668, participle: null },
  nachtzweten: { id: 51163, participle: null },
  naderen: { id: 106903, participle: 'genaderd' },
  nagelbijten: { id: 106904, participle: null },
  nagelen: { id: 106905, participle: 'genageld' },
  napperen: { id: 160932, participle: 'genappeerd' },
  narcotiseren: { id: 106907, participle: 'genarcotiseerd' },
  nasaleren: { id: 106909, participle: 'genasaleerd' },
  nationaliseren: { id: 106911, participle: 'genationaliseerd' },
  naturaliseren: { id: 106913, participle: 'genaturaliseerd' },
  navelstaren: { id: 106914, participle: null },
  navetteren: { id: 183663, participle: 'genavetteerd' },
  navigeren: { id: 106915, participle: 'genavigeerd' },
  nazificeren: { id: 948138, participle: 'genazificeerd' },
  omberen: { id: 106977, participle: 'geomberd' },
  omitteren: { id: 156163, participle: 'geomitteerd' },
  opperen: { id: 107264, participle: 'geopperd' },
  oppervlaktesurfen: { id: 184564, participle: null },
  opponeren: { id: 107265, participle: 'geopponeerd' },
  optimaliseren: { id: 107268, participle: 'geoptimaliseerd' },
  tegenwindfietsen: { id: 948366, participle: null },
  terugkoken: { id: 190272, participle: null },
  thuisbankieren: { id: 108700, participle: 'gethuisbankierd' },
  thuisbranden: { id: 190361, participle: null },
  thuiskopiëren: { id: 190379, participle: null },
  thuistappen: { id: 190394, participle: null },
  thuiswinkelen: { id: 190404, participle: null },
  toekomstdenken: { id: 124557, participle: null },
  toernooien: { id: 108728, participle: 'getoernooid' },
  toerschaatsen: { id: 190512, participle: null },
  toeteren: { id: 108729, participle: 'getoeterd' },
  volksdansen: { id: 109688, participle: 'gevolksdanst' },
  volleren: { id: 109689, participle: 'gevolleerd' },
  volleyen: { id: 109691, participle: 'gevolleyd' },
  volmachtigen: { id: 150856, participle: 'gevolmachtigd' },
  voltigeren: { id: 109694, participle: 'gevoltigeerd' },
  vooroverlijden: { id: 157107, participle: null },
  weerlichten: { id: 109794, participle: 'geweerlicht' },
  wegwielrennen: { id: 805461, participle: null },
};

/** One reading of a lemma that is separable in one sense and inseparable in another: what it means, its auxiliary. */
interface Reading { readonly meaning: string; readonly auxiliary: 'hebben' | 'zijn' | 'both' }

/** The prefix of such a lemma and its two readings. */
interface Readings { readonly prefix: string; readonly separable: Reading; readonly inseparable: Reading }

/**
 * Lemmas that are separable in one sense and inseparable in another: two paradigms, each with its meaning (its
 * `condition`) and its perfect auxiliary, unless a prefix hint names one, which then has that reading's auxiliary. The
 * stress mark shows where the stress falls. Meanings and auxiliaries as woordenlijst.org gives each reading
 * (https://woordenlijst.org/zoeken/?q=voorkomen and so on).
 */
export const ambiguousPrefixVerbs: Readonly<Record<string, Readings>> = {
  voorkomen: {
    prefix: 'voor',
    separable: { meaning: 'vóórkomen: to occur, to appear, to seem', auxiliary: 'zijn' },
    inseparable: { meaning: 'voorkómen: to prevent', auxiliary: 'hebben' },
  },
  overleggen: {
    prefix: 'over',
    separable: { meaning: 'óverleggen: to hand over, to show', auxiliary: 'hebben' },
    inseparable: { meaning: 'overléggen: to discuss, to confer', auxiliary: 'hebben' },
  },
  doorlopen: {
    prefix: 'door',
    separable: { meaning: 'dóórlopen: to walk on, to wear out by walking', auxiliary: 'both' },
    inseparable: { meaning: 'doorlópen: to pass through, to go through', auxiliary: 'both' },
  },
  overlopen: {
    prefix: 'over',
    separable: { meaning: 'óverlopen: to defect, to overflow', auxiliary: 'zijn' },
    inseparable: { meaning: 'overlópen: to walk all over, to visit too often', auxiliary: 'hebben' },
  },
  ondergaan: {
    prefix: 'onder',
    separable: { meaning: 'óndergaan: to go down, to perish', auxiliary: 'zijn' },
    inseparable: { meaning: 'ondergáán: to undergo, to endure', auxiliary: 'hebben' },
  },
};

export type DutchAuxiliary = 'hebben' | 'zijn';

/**
 * A Dutch verb as the stages read it. `lemma` is the infinitive without `zich`; `classId` is `weak`, `strong`, `mixed`
 * or `loan`; `particle` is a derivative's prefix, written before the forms of its base: separable (op in opstaan) or
 * not (ver in verwerken); `auxiliaries` are the perfect auxiliaries after an `auxiliary` hint.
 */
export interface DutchLexeme extends LexemeBase {
  /** The verb the forms are built on: the lemma without a derivative's prefix (werken for verwerken, staan for opstaan). */
  readonly base: string;
  /**
   * The unstressed prefix that keeps ge- out of the past participle (be in beloven and begrijpen, and in terugbetalen);
   * '' when there is none.
   */
  readonly inseparablePrefix: string;
  /**
   * The unstressed prefix of the rest of a separable verb that is an inseparable derivative, written before every word
   * of the base, inside the separable particle (ver in uitverkopen: kocht → verkocht → uitverkocht); '' for none.
   */
  readonly innerPrefix: string;
  /**
   * The lexicon's entry for the base, {} when it has none: principal parts and flags. A derivative listed as personal
   * (bevriezen) does not take over the impersonal flags of its base.
   */
  readonly entry: DutchEntry;
  /** The loan table's entry for the base, or null. */
  readonly loan: DutchLoan | null;
  /** The principal parts the query gives (the `stems` option); {} when it gives none. */
  readonly hints: DutchStemHints;
  /** The present stem, with the steps that form it: werk, loop, leef (underlying leev). */
  readonly stem: PresentStem;
  /** The perfect auxiliaries the verb takes before an `auxiliary` hint narrows them, in output order. */
  readonly defaultAuxiliaries: readonly DutchAuxiliary[];
  /**
   * The infinitives of the base, in output order, before the clause attaches a particle (staan for opstaan): zijn has
   * the spoken alternative wezen.
   */
  readonly infinitives: readonly string[];
}

/**
 * What the lexicon says about a listed verb: an irregular past tense (liep), only an irregular past participle (bakken:
 * gebakken), or, for a weak verb, the detail it is listed for (its auxiliary, reflexive pronoun, missing imperative or
 * stress).
 */
function listedClass(base: string, entry: DutchEntry): DerivationStep {
  if (entry.pastSingular) return step(dutchRules['nl.classify.irregular'], base, itemAt(entry.pastSingular, 0));
  if (entry.participles) return step(dutchRules['nl.classify.half-irregular'], base, itemAt(entry.participles, 0));
  const detail = entry.auxiliary ? 'auxiliary' : entry.reflexive ? 'reflexive' : entry.noImperative ? 'imperative'
    : entry.unstressedFinalSyllable !== undefined ? 'stress' : 'other';
  return step(dutchRules['nl.classify.listed-weak'], base, null, { detail });
}

/** The options classification reads. */
type DutchQuery = Pick<DutchConjugationOptions, 'infinitive' | 'auxiliary' | 'classHint' | 'stems' | 'reflexive' | 'separablePrefix' | 'inseparablePrefix'>;

/** The entry of `key` in `table`: only the table's own keys count, so a lemma such as `constructor` is not listed. */
function lookup<T>(table: Readonly<Record<string, T>>, key: string): T | undefined {
  return Object.hasOwn(table, key) ? table[key] : undefined;
}

/**
 * A prefix a lemma is read with although no hint names it: one reading of an ambiguous lemma, or one inferred from the
 * spelling of an unlisted verb (`assumed`, recorded as an assumption).
 */
export interface ImpliedPrefix {
  readonly prefix: string;
  readonly separable: boolean;
  readonly assumed: boolean;
  /**
   * For a dual prefix, why it is read this way: the reading `most` verbs with it have, the safer reading when the two are
   * `close`, or the inseparable reading because the `rest` cannot stand as a split-off verb.
   */
  readonly why?: 'most' | 'close' | 'rest';
}

/** Every separable particle and dual prefix, longest first, so voorbij is found before voor. */
const knownPrefixes = [
  ...separableParticles.map(prefix => ({ prefix, dual: false })), ...dualPrefixes.map(prefix => ({ prefix, dual: true })),
].sort((a, b) => b.prefix.length - a.prefix.length);

/** Whether `verb` is in the lexicon: listed, a loan, or a listed derivative or prefixed verb. */
function inLexicon(verb: string): boolean {
  return Boolean(lookup(dutchExceptions, verb) || lookup(dutchLoans, verb) || lookup(separableVerbs, verb)
    || lookup(inseparableDerivatives, verb) || lookup(dualInseparableVerbs, verb) || lookup(inseparableVerbs, verb) !== undefined);
}

/**
 * Whether `rest`, after `prefix`, can be a verb of its own:
 * - never when a particle that ends in a vowel meets a vowel: that would be written with a hyphen (na-apen), so naaien
 *   is not na + aien;
 * - always when it is a verb in the lexicon (opeten: eten);
 * - for a split (`separable`), never when it begins with a vowel and is not in the lexicon (openen is not op + enen,
 *   opereren not op + ereren);
 * - otherwise when it is -en after a root of two letters or more with a vowel.
 */
function plausibleBase(prefix: string, rest: string, separable: boolean): boolean {
  if (/[aeiouy]$/u.test(prefix) && /^[aeiouy]/u.test(rest)) return false;
  if (inLexicon(rest)) return true;
  if (separable && /^[aeiouy]/u.test(rest)) return false;
  const root = rest.endsWith('en') ? rest.slice(0, -2) : '';
  return root.length >= 2 && /[aeiouy]/u.test(root);
}

/**
 * The particle or dual prefix `lemma` is spelled with, the longest that leaves a plausible base verb, and how it is read,
 * or null. A particle is split. A dual prefix gets its default reading (`dualReading`); when that is separable but the
 * rest cannot be split off (it begins with a vowel and is not a verb in the lexicon: omarmen), it is read as inseparable.
 */
export function spelledPrefix(lemma: string): ImpliedPrefix | null {
  for (const { prefix, dual } of knownPrefixes) {
    if (!lemma.startsWith(prefix)) continue;
    const rest = lemma.slice(prefix.length);
    if (!dual) {
      if (plausibleBase(prefix, rest, true)) return { prefix, separable: true, assumed: true };
      continue;
    }
    const reading = dualReading(prefix);
    if (reading.separable && plausibleBase(prefix, rest, true)) return { prefix, separable: true, assumed: true, why: 'most' };
    if (plausibleBase(prefix, rest, false)) return { prefix, separable: false, assumed: true, why: reading.separable ? 'rest' : reading.why };
  }
  return null;
}

/** The inseparable derivative `verb` is listed as: an entry of `inseparableDerivatives` or `dualInseparableVerbs`. */
function inseparableDerivativeOf(verb: string): DutchDerivative | undefined {
  const dual = lookup(dualInseparableVerbs, verb);
  return lookup(inseparableDerivatives, verb)
    ?? (dual ? { prefix: dual.prefix, base: verb.slice(dual.prefix.length), auxiliary: dual.auxiliary } : undefined);
}

/** The unstressed prefixes of e-ANS 12.3.2.1 that never split off, longest first. */
const unstressedPrefixes = ['ver', 'ont', 'her', 'be', 'ge', 'er'];

/**
 * How the rest of a separable verb is read, like any verb: as an inseparable derivative (verkopen in uitverkopen: ver +
 * kopen, whose forms it takes), as a verb listed with an unstressed prefix (betalen in terugbetalen), or, when the
 * lexicon does not know it, as a verb with an unstressed prefix it starts with (`assumed`: bereiden in voorbereiden),
 * provided a consonant follows the prefix and a root with a vowel follows that (not bellen in opbellen, beelden in
 * uitbeelden); otherwise as a plain verb.
 */
interface Rest {
  /** The rest as a word: betalen, verkopen. */
  readonly verb: string;
  /** Its unstressed prefix, which keeps ge- out of the participle; '' for none. */
  readonly prefix: string;
  /** The prefix written before every word of `base` (ver for verkopen: kocht → verkocht); '' when the base is the rest. */
  readonly inner: string;
  /** The verb the forms are built on: kopen for verkopen, betalen for betalen. */
  readonly base: string;
  readonly auxiliary?: DutchDerivative['auxiliary'];
  readonly assumed: boolean;
}

function restOf(verb: string): Rest {
  const derivative = inseparableDerivativeOf(verb);
  if (derivative) return { verb, prefix: derivative.prefix, inner: derivative.prefix, base: derivative.base, auxiliary: derivative.auxiliary, assumed: false };
  const listed = lookup(inseparableVerbs, verb);
  const plain: Rest = { verb, prefix: listed ?? '', inner: '', base: verb, assumed: false };
  if (listed !== undefined || inLexicon(verb)) return plain;
  const prefix = unstressedPrefixes.find(candidate => {
    const after = verb.slice(candidate.length);
    const root = after.endsWith('en') ? after.slice(0, -2) : '';
    return verb.startsWith(candidate) && !/^[aeiouy]/u.test(after) && root.length >= 2 && /[aeiouyëï]/u.test(root);
  });
  return prefix === undefined ? plain : { ...plain, prefix, assumed: true };
}

/** The prefix an unlisted lemma is read with: the one it is spelled with, none for a verb on the no-split list. */
export function inferredPrefix(lemma: string): ImpliedPrefix | null {
  return lookup(simplexVerbs, lemma) === undefined ? spelledPrefix(lemma) : null;
}

/**
 * The lexeme of a verb and the steps that classify it, or a ConjugationError for a query that cannot be conjugated
 * (checked in this order): a malformed infinitive; a prefix hint that is not a proper prefix, contradicts the lexicon,
 * or names another separable prefix than the listed one; a class hint without the principal parts it needs, or `weak`
 * for a verb listed as strong only; no stem (no -en and nothing listed); `reflexive: false` for a reflexive verb; and an
 * `auxiliary` hint that a listed verb does not take. `reading` is the reading of an ambiguous lemma to classify. Without
 * a prefix hint or a class hint, an unlisted lemma that starts with a known particle is read as its derivative.
 */
function classification(options: DutchQuery, reading?: ImpliedPrefix): { readonly lexeme: DutchLexeme; readonly steps: readonly DerivationStep[] } {
  const { classHint, auxiliary, stems: hints = {} } = options;
  const expressedReflexive = options.infinitive.startsWith('zich ');
  const lemma = options.infinitive.replace(/^zich /u, '');
  if (!/^[\p{L}][\p{L}\p{M}'-]*$/u.test(lemma)) throw new ConjugationError('INVALID_INFINITIVE', 'Expected a Dutch infinitive, optionally prefixed with zich.');
  if (lookup(ambiguousPrefixVerbs, lemma) && !options.separablePrefix && !options.inseparablePrefix && reading === undefined) {
    throw new ConjugationError('GENERATION_FAILURE', `${lemma} has a separable and an inseparable reading: classify it once for each.`);
  }
  // The prefixes the user gives; a reading or an inferred prefix is filled in below.
  let { separablePrefix, inseparablePrefix } = options;
  if (separablePrefix && inseparablePrefix) throw new ConjugationError('INVALID_HINT', 'A Dutch prefix cannot be both separable and inseparable.');
  const hintedPrefix = separablePrefix ?? inseparablePrefix;
  if (hintedPrefix && (!lemma.startsWith(hintedPrefix) || lemma === hintedPrefix)) {
    throw new ConjugationError('INVALID_HINT', `Prefix ${hintedPrefix} is not a proper prefix of ${lemma}.`);
  }
  const listedInseparable = lookup(inseparableVerbs, lemma);
  if (separablePrefix && listedInseparable) throw new ConjugationError('INVALID_HINT', `${lemma} has a lexical inseparable prefix.`);
  const knownSeparable = lookup(separableVerbs, lemma);
  if (inseparablePrefix && knownSeparable) throw new ConjugationError('INVALID_HINT', `${lemma} has a lexical separable prefix.`);
  const knownInseparable = inseparableDerivativeOf(lemma);
  if (separablePrefix && knownSeparable && separablePrefix !== knownSeparable.prefix) {
    throw new ConjugationError('INVALID_HINT', `The verified separable prefix of ${lemma} is ${knownSeparable.prefix}.`);
  }
  const unlisted = !lookup(dutchExceptions, lemma) && !lookup(dutchLoans, lemma) && !knownSeparable && !knownInseparable
    && listedInseparable === undefined && !lookup(ambiguousPrefixVerbs, lemma);
  const implied = hintedPrefix ? null : reading ?? (unlisted && !classHint ? inferredPrefix(lemma) : null);
  if (implied?.separable) separablePrefix = implied.prefix;
  else if (implied) inseparablePrefix = implied.prefix;
  // A prefix hint makes the lemma a derivative of what follows the prefix; an inseparable hint on a listed verb only
  // marks its prefix. A reading of an ambiguous lemma brings its own auxiliary.
  const readings = lookup(ambiguousPrefixVerbs, lemma);
  const readingOf = (prefix: string, separable: boolean): { readonly auxiliary?: Reading['auxiliary'] } =>
    readings?.prefix === prefix ? { auxiliary: readings[separable ? 'separable' : 'inseparable'].auxiliary } : {};
  const derivative: DutchDerivative | undefined = separablePrefix
    ? { prefix: separablePrefix, base: lemma.slice(separablePrefix.length), ...readingOf(separablePrefix, true) }
    : inseparablePrefix && !lookup(dutchExceptions, lemma)
      ? { prefix: inseparablePrefix, base: lemma.slice(inseparablePrefix.length), ...readingOf(inseparablePrefix, false) }
      : knownSeparable ?? knownInseparable;
  const separable = separablePrefix ?? knownSeparable?.prefix ?? '';
  // The rest of a separable verb is classified like any verb: terugbetalen keeps the be- of betalen (terugbetaald),
  // uitverkopen takes the forms of verkopen (uitverkocht).
  const rest = separable && derivative ? restOf(derivative.base) : null;
  const inseparable = rest ? rest.prefix : inseparablePrefix ?? knownInseparable?.prefix ?? listedInseparable ?? '';
  const base = rest?.base ?? derivative?.base ?? lemma;
  const listedBase = lookup(dutchExceptions, base);
  const personal = derivative?.personal ?? knownSeparable?.personal ?? knownInseparable?.personal;
  const entry: DutchEntry = personal ? { ...listedBase, impersonal: false, singularOnly: false, noImperative: false } : listedBase ?? {};
  const loan = lookup(dutchLoans, base) ?? null;
  const isLoan = classHint === 'loan' || loan !== null;
  if (classHint === 'loan' && !loan && !hints.stem) {
    throw new ConjugationError('AMBIGUOUS_CLASSIFICATION', 'An unlisted English loan needs its pronounced/written stem; silent e cannot be inferred from spelling.');
  }
  if (classHint === 'strong' && !entry.pastSingular && (!hints.pastSingular || !hints.pastParticiple)) {
    throw new ConjugationError('AMBIGUOUS_CLASSIFICATION', 'An unlisted strong verb needs a past singular and past participle.');
  }
  if (classHint === 'weak' && entry.pastSingular && !entry.alsoWeakPast) {
    throw new ConjugationError('INVALID_HINT', `${lemma} is not a weak verb in the verified lexical model.`);
  }
  const stem = presentStem({
    infinitive: base,
    listed: hints.stem ?? loan?.stem ?? entry.stem,
    unstressed: hints.unstressedFinalSyllable ?? entry.unstressedFinalSyllable,
    prefix: rest && !rest.inner ? rest.prefix : derivative ? lookup(inseparableVerbs, base) ?? '' : inseparable,
  });
  const reflexive = expressedReflexive || options.reflexive === true || entry.reflexive === true;
  if (options.reflexive === false && (expressedReflexive || entry.reflexive)) {
    throw new ConjugationError('INVALID_HINT', `${lemma} requires a reflexive pronoun.`);
  }
  const defaultAuxiliary = derivative?.auxiliary ?? knownSeparable?.auxiliary ?? knownInseparable?.auxiliary ?? rest?.auxiliary ?? entry.auxiliary ?? 'hebben';
  const defaultAuxiliaries: readonly DutchAuxiliary[] = defaultAuxiliary === 'both' ? ['hebben', 'zijn'] : [defaultAuxiliary];
  if (auxiliary && listedBase && !defaultAuxiliaries.includes(auxiliary)) {
    throw new ConjugationError('INVALID_HINT', `${lemma} does not accept auxiliary ${auxiliary} in this lexical model.`);
  }
  const classId = isLoan ? 'loan' : classHint === 'strong' || entry.pastSingular ? 'strong' : entry.participles ? 'mixed' : 'weak';
  const classSource = classHint || Object.keys(hints).length || hintedPrefix ? 'explicitHint'
    : implied?.assumed ? 'regularRule'
      : listedBase || loan || derivative || listedInseparable ? 'lexicon' : 'regularRule';

  const steps: DerivationStep[] = [];
  if (separable) steps.push(step(dutchRules['nl.classify.separable'], lemma, null, { particle: separable }));
  if (rest?.assumed) steps.push(step(dutchRules['nl.classify.assume-rest-prefix'], rest.verb, null, { prefix: rest.prefix }));
  else if (inseparable) steps.push(step(dutchRules['nl.classify.inseparable'], rest?.verb ?? lemma, null, { prefix: inseparable }));
  if (isLoan) steps.push(step(dutchRules['nl.classify.loan'], base, null));
  else if (listedBase) steps.push(listedClass(base, listedBase));
  // A verb whose base is neither listed nor a loan: each guess the lexicon would otherwise answer, unless a hint does.
  if (!listedBase && !loan) {
    if (!classHint) steps.push(step(dutchRules['nl.classify.default-weak'], base, null));
    if (!hints.stem && hints.unstressedFinalSyllable === undefined) steps.push(step(dutchRules['nl.classify.default-syllables'], base, null));
    if (!auxiliary && !derivative?.auxiliary) steps.push(step(dutchRules['nl.classify.default-hebben'], lemma, null));
    if (!hintedPrefix && !implied && !knownSeparable && !knownInseparable && !listedInseparable) {
      steps.push(step(dutchRules['nl.classify.default-unprefixed'], lemma, null));
    }
  }
  if (implied?.assumed) {
    steps.push(implied.why === undefined ? step(dutchRules['nl.classify.assume-separable'], lemma, null, { particle: implied.prefix })
      : implied.separable ? step(dutchRules['nl.classify.assume-dual-separable'], lemma, null, { prefix: implied.prefix })
        : step(dutchRules['nl.classify.assume-inseparable'], lemma, null, { prefix: implied.prefix, why: implied.why }));
  }

  const prefix = derivative?.prefix ?? '';
  return {
    lexeme: {
      lemma,
      verbId: reflexive ? `zich ${lemma}` : lemma,
      classId,
      classSource,
      reflexive,
      auxiliaries: auxiliary ? [auxiliary] : defaultAuxiliaries,
      particle: prefix ? { text: prefix, separable: separable !== '' } : null,
      base,
      inseparablePrefix: inseparable,
      innerPrefix: rest?.inner ?? '',
      entry,
      loan,
      hints,
      stem,
      defaultAuxiliaries,
      infinitives: lemma === 'zijn' ? ['zijn', 'wezen'] : [base],
    },
    steps,
  };
}

/**
 * The paradigms of the verb a query names, with their classification steps: one, or for a lemma that is separable in
 * one sense and inseparable in another (`ambiguousPrefixVerbs`) one per reading, separable first, tagged with the
 * reading (`pattern`) and its meaning (`condition`). A prefix hint keeps the one it names, untagged; a reading that
 * another hint rules out is left out, and none left is that hint's error.
 */
export function classifyDutch(query: Readonly<Record<string, unknown>>): Fork<DutchLexeme> {
  // The core has parsed the query against the Dutch option schema (`dutchOptions`), so these keys have these types.
  const options = query as DutchQuery;
  const readings = lookup(ambiguousPrefixVerbs, options.infinitive.replace(/^zich /u, ''));
  if (readings === undefined || options.separablePrefix || options.inseparablePrefix) {
    const { lexeme, steps } = classification(options);
    return one(lexeme, steps);
  }
  const errors: ConjugationError[] = [];
  const paradigms = [true, false].flatMap(separable => {
    try {
      const { lexeme, steps } = classification(options, { prefix: readings.prefix, separable, assumed: false });
      return one(lexeme, steps, { pattern: separable ? 'separable' : 'inseparable', condition: readings[separable ? 'separable' : 'inseparable'].meaning });
    } catch (error) {
      if (!(error instanceof ConjugationError)) throw error;
      errors.push(error);
      return [];
    }
  });
  if (!paradigms.length) throw errors[0]!;
  return paradigms;
}

/** The lexeme of a verb a periphrasis names (hebben, zijn, zullen): the lemma alone, without hints. */
export function dutchLexemeOf(lemma: string): DutchLexeme {
  return classification({ infinitive: lemma }).lexeme;
}
