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
import type { DutchConjugationOptions } from '../../types.js';
import { dutchRules } from './rule-table.js';
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
  glijden: strong('gleed', 'gegleden', { presentAlternatives: { 0: ['glij'] }, imperative: 'glijd', auxiliary: 'zijn' }),
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
  houden: strong('hield', 'gehouden', { presentAlternatives: { 0: ['hou'] }, imperative: 'houd' }),
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
  rijden: strong('reed', 'gereden', { presentAlternatives: { 0: ['rij'] }, imperative: 'rijd', auxiliary: 'both' }),
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
  snijden: strong('sneed', 'gesneden', { presentAlternatives: { 0: ['snij'] }, imperative: 'snijd' }),
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
    formalPresent: ['wilt', 'wil'], imperative: 'wil',
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
};

export const inseparableVerbs: Readonly<Record<string, string>> = {
  bederven: 'be', bedriegen: 'be', beginnen: 'be', behangen: 'be', beloven: 'be', betalen: 'be',
  bevelen: 'be', bezwijken: 'be', geloven: 'ge', genezen: 'ge', genieten: 'ge',
  ontdekken: 'ont', ontginnen: 'ont', ontluiken: 'ont', verdrieten: 'ver',
  verdwijnen: 'ver', vergeten: 'ver', vergissen: 'ver', verliezen: 'ver',
  bestellen: 'be', behandelen: 'be', bedanken: 'be', gebruiken: 'ge',
  herkennen: 'her', herinneren: 'her', proberen: '', studeren: '',
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

/** Lemmas that are separable in one sense and inseparable in another: a prefix hint must say which one is meant. */
export const ambiguousPrefixVerbs: ReadonlySet<string> = new Set(['voorkomen', 'overleggen', 'doorlopen', 'overlopen', 'ondergaan']);

export type DutchAuxiliary = 'hebben' | 'zijn';

/**
 * A Dutch verb as the stages read it. `lemma` is the infinitive without `zich`; `classId` is `weak`, `strong`, `mixed`
 * or `loan`; `particle` is a derivative's prefix, written before the forms of its base: separable (op in opstaan) or
 * not (ver in verwerken); `auxiliaries` are the perfect auxiliaries after an `auxiliary` hint.
 */
export interface DutchLexeme extends LexemeBase {
  /** The verb the forms are built on: the lemma without a derivative's prefix (werken for verwerken, staan for opstaan). */
  readonly base: string;
  /** The unstressed prefix that keeps ge- out of the past participle (be in beloven and begrijpen); '' when there is none. */
  readonly inseparablePrefix: string;
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

/** The options classification reads. */
type DutchQuery = Pick<DutchConjugationOptions, 'infinitive' | 'auxiliary' | 'classHint' | 'stems' | 'reflexive' | 'separablePrefix' | 'inseparablePrefix'>;

/** The entry of `key` in `table`: only the table's own keys count, so a lemma such as `constructor` is not listed. */
function lookup<T>(table: Readonly<Record<string, T>>, key: string): T | undefined {
  return Object.hasOwn(table, key) ? table[key] : undefined;
}

/**
 * The lexeme of a verb and the steps that classify it, or a ConjugationError for a query that cannot be conjugated
 * (checked in this order): a malformed infinitive; a lemma whose prefix is ambiguous without a prefix hint; a prefix hint
 * that is not a proper prefix, contradicts the lexicon, or names another separable prefix than the listed one; a class
 * hint without the principal parts it needs, or `weak` for a verb listed as strong only; no stem (no -en and nothing
 * listed); `reflexive: false` for a reflexive verb; and an `auxiliary` hint that a listed verb does not take.
 */
function classification(options: DutchQuery): { readonly lexeme: DutchLexeme; readonly steps: readonly DerivationStep[] } {
  const { separablePrefix, inseparablePrefix, classHint, auxiliary, stems: hints = {} } = options;
  const expressedReflexive = options.infinitive.startsWith('zich ');
  const lemma = options.infinitive.replace(/^zich /u, '');
  if (!/^[\p{L}][\p{L}\p{M}'-]*$/u.test(lemma)) throw new ConjugationError('INVALID_INFINITIVE', 'Expected a Dutch infinitive, optionally prefixed with zich.');
  if (ambiguousPrefixVerbs.has(lemma) && !separablePrefix && !inseparablePrefix) {
    throw new ConjugationError('AMBIGUOUS_CLASSIFICATION', `${lemma} has separable and inseparable senses; supply a prefix hint.`);
  }
  if (separablePrefix && inseparablePrefix) throw new ConjugationError('INVALID_HINT', 'A Dutch prefix cannot be both separable and inseparable.');
  const hintedPrefix = separablePrefix ?? inseparablePrefix;
  if (hintedPrefix && (!lemma.startsWith(hintedPrefix) || lemma === hintedPrefix)) {
    throw new ConjugationError('INVALID_HINT', `Prefix ${hintedPrefix} is not a proper prefix of ${lemma}.`);
  }
  const listedInseparable = lookup(inseparableVerbs, lemma);
  if (separablePrefix && listedInseparable) throw new ConjugationError('INVALID_HINT', `${lemma} has a lexical inseparable prefix.`);
  const knownSeparable = lookup(separableVerbs, lemma);
  if (inseparablePrefix && knownSeparable) throw new ConjugationError('INVALID_HINT', `${lemma} has a lexical separable prefix.`);
  const knownInseparable = lookup(inseparableDerivatives, lemma);
  if (separablePrefix && knownSeparable && separablePrefix !== knownSeparable.prefix) {
    throw new ConjugationError('INVALID_HINT', `The verified separable prefix of ${lemma} is ${knownSeparable.prefix}.`);
  }
  // A prefix hint makes the lemma a derivative of what follows the prefix; an inseparable hint on a listed verb only
  // marks its prefix.
  const derivative: DutchDerivative | undefined = separablePrefix
    ? { prefix: separablePrefix, base: lemma.slice(separablePrefix.length) }
    : inseparablePrefix && !lookup(dutchExceptions, lemma)
      ? { prefix: inseparablePrefix, base: lemma.slice(inseparablePrefix.length) }
      : knownSeparable ?? knownInseparable;
  const separable = separablePrefix ?? knownSeparable?.prefix ?? '';
  const inseparable = inseparablePrefix ?? knownInseparable?.prefix ?? listedInseparable ?? '';
  const base = derivative?.base ?? lemma;
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
    prefix: derivative ? lookup(inseparableVerbs, base) ?? '' : inseparable,
  });
  const reflexive = expressedReflexive || options.reflexive === true || entry.reflexive === true;
  if (options.reflexive === false && (expressedReflexive || entry.reflexive)) {
    throw new ConjugationError('INVALID_HINT', `${lemma} requires a reflexive pronoun.`);
  }
  const defaultAuxiliary = derivative?.auxiliary ?? knownSeparable?.auxiliary ?? knownInseparable?.auxiliary ?? entry.auxiliary ?? 'hebben';
  const defaultAuxiliaries: readonly DutchAuxiliary[] = defaultAuxiliary === 'both' ? ['hebben', 'zijn'] : [defaultAuxiliary];
  if (auxiliary && listedBase && !defaultAuxiliaries.includes(auxiliary)) {
    throw new ConjugationError('INVALID_HINT', `${lemma} does not accept auxiliary ${auxiliary} in this lexical model.`);
  }
  const classId = isLoan ? 'loan' : classHint === 'strong' || entry.pastSingular ? 'strong' : entry.participles ? 'mixed' : 'weak';
  const classSource = classHint || Object.keys(hints).length || hintedPrefix ? 'explicitHint'
    : listedBase || loan || derivative || listedInseparable ? 'lexicon' : 'regularRule';

  const steps: DerivationStep[] = [];
  if (separable) steps.push(step(dutchRules['nl.classify.separable'], lemma, null, { particle: separable }));
  if (inseparable) steps.push(step(dutchRules['nl.classify.inseparable'], lemma, null, { prefix: inseparable }));
  if (isLoan) steps.push(step(dutchRules['nl.classify.loan'], base, null));
  else if (listedBase) steps.push(step(dutchRules['nl.classify.lexicon'], base, classId));
  // A verb whose base is neither listed nor a loan: each guess the lexicon would otherwise answer, unless a hint does.
  if (!listedBase && !loan) {
    if (!classHint) steps.push(step(dutchRules['nl.classify.default-weak'], base, null));
    if (!hints.stem && hints.unstressedFinalSyllable === undefined) steps.push(step(dutchRules['nl.classify.default-syllables'], base, null));
    if (!auxiliary && !derivative?.auxiliary) steps.push(step(dutchRules['nl.classify.default-hebben'], lemma, null));
    if (!hintedPrefix && !knownSeparable && !knownInseparable && !listedInseparable) {
      steps.push(step(dutchRules['nl.classify.default-unprefixed'], lemma, null));
    }
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

/** The one paradigm of the verb a query names, with its classification steps. */
export function classifyDutch(query: Readonly<Record<string, unknown>>): Fork<DutchLexeme> {
  // The core has parsed the query against the Dutch option schema (`dutchOptions`), so these keys have these types.
  const { lexeme, steps } = classification(query as DutchQuery);
  return one(lexeme, steps);
}

/** The lexeme of a verb a periphrasis names (hebben, zijn, zullen): the lemma alone, without hints. */
export function dutchLexemeOf(lemma: string): DutchLexeme {
  return classification({ infinitive: lemma }).lexeme;
}
