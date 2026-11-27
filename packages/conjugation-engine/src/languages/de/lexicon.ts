/**
 * The German lexicon: the strong, mixed, preterite-present and irregular roots with their principal parts, the verbs
 * with two paradigms, and the side lists classification reads. Every entry was checked against the DWDS inflection
 * table and dictionary entry of its lemma (`source`), with the Duden conjugation table as cross-check (`crossCheck`,
 * absent where Duden has no table). DWDS decides the forms, their order and their labels: `(va.)` becomes
 * `usage: 'dated'`, an unmarked second form `pattern: 'alternate'`, and `(ugs.)` forms are not listed. What DWDS prints
 * under another homograph (another meaning) is not modelled unless the lemma has two paradigms here; `lexiconNotes` in
 * `sources.ts` lists those cases and every conflict with Duden. Weak verbs are never listed as roots: weak is the default.
 */
import type { ParticleTables } from '../shared/germanic.js';
import { verification } from './verification.js';

export type Auxiliary = 'haben' | 'sein';

/** One perfect auxiliary of a verb, with when it is used and, for a regional use, where. */
export interface AuxiliaryUse {
  readonly verb: Auxiliary;
  readonly condition?: string;
  readonly region?: 'south';
  /** Printed by Duden only, not by DWDS: the form says so in its explanation. */
  readonly source?: 'duden';
}

/**
 * One listed form. A second form is tagged: `usage` for a dated one, `pattern` for a standard one (`alternate`, or
 * `long` for an imperative with -e). In a Präteritum list, `pattern: 'weak'` marks a weak Präteritum: the stem before
 * -te (mahl → mahlte).
 */
export interface Alternate {
  readonly text: string;
  readonly usage?: 'dated' | 'literary';
  readonly pattern?: string;
  /** Printed by Duden only, not by DWDS: the form says so in its explanation. */
  readonly source?: 'duden';
}

export type SlotKey = '1sg' | '2sg' | '3sg' | '1pl' | '2pl' | '3pl';
/** A whole-word cell: `mood.tense.slot`, the imperative Sie-form being `imperative.present.3pl`. */
export type CellKey = `${'indicative' | 'subjunctive' | 'imperative'}.${'present' | 'past'}.${SlotKey}`;

export type Dwds = `https://www.dwds.de/${string}`;
export type Duden = `https://www.duden.de/${string}`;

export interface GermanEntry {
  readonly class: 'strong' | 'mixed' | 'preteritePresent' | 'irregular';
  /** The du/er stem of the Präsens when it changes its vowel: 'fähr', 'gib', 'lies', 'hält'. */
  readonly present2?: string | readonly Alternate[];
  /** Preterite-present verbs: the stem of the Präsens singular, 'kann', 'weiß'. */
  readonly presentSingular?: string;
  /** The Präteritum stem: 'fuhr'; for a mixed, modal or haben-like verb the stem before -te: 'brann', 'konn', 'hat'. */
  readonly preterite: string | readonly Alternate[];
  /** The Partizip II as DWDS prints it: 'gefahren', 'befohlen' (alternates where DWDS gives two: gesalzen, gesalzt). */
  readonly participle: string | readonly Alternate[];
  /** Konjunktiv II stems when the umlaut of the Präteritum does not give them: 'stürb', 'hälf' + 'hülf'. */
  readonly subjunctive?: readonly Alternate[];
  /** Whole du-imperatives when the rules do not give them: 'sieh' + 'siehe'. */
  readonly imperative?: readonly Alternate[];
  readonly auxiliaries: readonly AuxiliaryUse[];
  /** Whole words: 'indicative.present.1sg' → bin. */
  readonly cells?: Readonly<Partial<Record<CellKey, readonly Alternate[]>>>;
  readonly flags?: readonly ('thirdPersonOnly' | 'noImperative' | 'impersonal' | 'nonInitialStress')[];
  /** The DWDS inflection table the entry was verified against (from `verification`); absent for an entry built from hints. */
  readonly source?: Dwds;
  /** The Duden conjugation table that confirms it; absent when no Duden table was found. */
  readonly crossCheck?: Duden;
  /** Built from the stems and classHint options for a verb the lexicon does not list. */
  readonly hinted?: true;
}

/** The weak paradigm of a verb with two: forms by rule, only the auxiliaries listed. */
export interface WeakEntry {
  readonly class: 'weak';
  readonly auxiliaries: readonly AuxiliaryUse[];
  readonly source?: Dwds;
  readonly crossCheck?: Duden;
}

/** A verb with two complete paradigms, in output order; `pattern` names each and `condition` says when it applies. */
export interface DualEntry {
  readonly paradigms: readonly { readonly pattern: string; readonly condition?: string; readonly entry: GermanEntry | WeakEntry }[];
}

/**
 * The DWDS table and the first Duden table the lemma was checked against, as recorded in `verification.ts`. A listed
 * lemma without a record is a programming error: nothing here is defaulted.
 */
function checked(lemma: string): { readonly source?: Dwds; readonly crossCheck?: Duden } {
  const record = verification[lemma];
  if (record === undefined) throw new Error(`The German lexicon lists ${lemma} without a verification record.`);
  return { ...(record.dwds === null ? {} : { source: record.dwds }), ...(record.duden.length ? { crossCheck: record.duden[0]! } : {}) };
}

type Parts = Omit<GermanEntry, 'source' | 'crossCheck' | 'class' | 'auxiliaries'>;

const H: readonly AuxiliaryUse[] = [{ verb: 'haben' }];
const S: readonly AuxiliaryUse[] = [{ verb: 'sein' }];
const intransitive = 'without a direct object: movement or a change of state';
const transitive = 'with a direct object';
const motion = 'movement to a place or over a distance';
const activity = 'the activity itself, or with a direct object';
/** sein for movement and change of state, haben with a direct object; DWDS gives sein first ("ist / hat"). */
const SH: readonly AuxiliaryUse[] = [{ verb: 'sein', condition: intransitive }, { verb: 'haben', condition: transitive }];
/** The same uses where DWDS gives haben first ("hat / ist"). */
const HS: readonly AuxiliaryUse[] = [{ verb: 'haben', condition: transitive }, { verb: 'sein', condition: intransitive }];
/** Verbs of motion: sein for the movement, haben for the activity or with an object. */
const MOTION: readonly AuxiliaryUse[] = [{ verb: 'sein', condition: motion }, { verb: 'haben', condition: activity }];
/** haben, and sein in southern German, Austria and Switzerland. */
const SOUTH: readonly AuxiliaryUse[] = [{ verb: 'haben' }, { verb: 'sein', region: 'south', source: 'duden' }];
/** hängen: DWDS itself prints "hat / seltener ist gehangen"; sein is the southern use. */
const SOUTH_DWDS: readonly AuxiliaryUse[] = [{ verb: 'haben' }, { verb: 'sein', region: 'south' }];

const dated = (text: string): Alternate => ({ text, usage: 'dated' });
const literary = (text: string): Alternate => ({ text, usage: 'literary' });
const dudenOnly = (text: string): Alternate => ({ text, pattern: 'alternate', source: 'duden' });
const alternate = (text: string): Alternate => ({ text, pattern: 'alternate' });
const weakPreterite = (stem: string): Alternate => ({ text: stem, pattern: 'weak' });

function strong(lemma: string, preterite: GermanEntry['preterite'], participle: GermanEntry['participle'], auxiliaries: readonly AuxiliaryUse[], more: Partial<Parts> = {}): GermanEntry {
  return { class: 'strong', preterite, participle, auxiliaries, ...more, ...checked(lemma) };
}

function mixed(lemma: string, preterite: GermanEntry['preterite'], participle: GermanEntry['participle'], subjunctive: string | readonly Alternate[], auxiliaries: readonly AuxiliaryUse[]): GermanEntry {
  const kii = typeof subjunctive === 'string' ? [{ text: subjunctive }] : subjunctive;
  return { class: 'mixed', preterite, participle, subjunctive: kii, auxiliaries, ...checked(lemma) };
}

function modal(lemma: string, presentSingular: string, preterite: string, participle: string, subjunctive: string, more: Partial<Parts> = {}): GermanEntry {
  return {
    class: 'preteritePresent', presentSingular, preterite, participle, subjunctive: [{ text: subjunctive }], auxiliaries: H,
    flags: ['noImperative'], ...more, ...checked(lemma),
  };
}

function weak(lemma: string, auxiliaries: readonly AuxiliaryUse[] = H): WeakEntry {
  return { class: 'weak', auxiliaries, ...checked(lemma) };
}

/** A verb with a weak and a strong conjugation of the same meaning, DWDS's order. */
function weakAndStrong(lemma: string, strongEntry: GermanEntry, auxiliaries: readonly AuxiliaryUse[] = H, strongFirst = false): DualEntry {
  const pair = [{ pattern: 'weak', entry: weak(lemma, auxiliaries) }, { pattern: 'strong', entry: strongEntry }];
  return { paradigms: strongFirst ? pair.reverse() : pair };
}

const whole = (...texts: (string | Alternate)[]): readonly Alternate[] => texts.map(text => typeof text === 'string' ? { text } : text);

/** The strong, mixed, preterite-present and irregular roots (184 lemmas), by Ablaut pattern as in GD §5.2. */
export const germanLexicon: Readonly<Record<string, GermanEntry | DualEntry>> = {
  // 1a ei – i – i
  beißen: strong('beißen', 'biss', 'gebissen', H),
  gleichen: strong('gleichen', 'glich', 'geglichen', H),
  gleiten: strong('gleiten', 'glitt', 'geglitten', S),
  greifen: strong('greifen', 'griff', 'gegriffen', H),
  kneifen: strong('kneifen', 'kniff', 'gekniffen', H),
  leiden: strong('leiden', 'litt', 'gelitten', H),
  pfeifen: strong('pfeifen', 'pfiff', 'gepfiffen', H),
  reißen: strong('reißen', 'riss', 'gerissen', HS),
  reiten: strong('reiten', 'ritt', 'geritten', MOTION),
  schleichen: strong('schleichen', 'schlich', 'geschlichen', MOTION),
  schleifen: {
    paradigms: [
      {
        pattern: 'strong', condition: 'sharpen, polish',
        entry: strong('schleifen', 'schliff', 'geschliffen', [
          { verb: 'haben', condition: 'sharpen, polish' }, { verb: 'sein', condition: 'slide on an ice track (regional)', source: 'duden' }]),
      },
      { pattern: 'weak', condition: 'drag; raze', entry: weak('schleifen', [{ verb: 'haben', condition: transitive }, { verb: 'sein', condition: 'drag along the ground' }]) },
    ],
  },
  schmeißen: strong('schmeißen', 'schmiss', 'geschmissen', H),
  schneiden: strong('schneiden', 'schnitt', 'geschnitten', H),
  schreiten: strong('schreiten', 'schritt', 'geschritten', S),
  spleißen: weakAndStrong('spleißen', strong('spleißen', 'spliss', 'gesplissen', H)),
  streichen: strong('streichen', 'strich', 'gestrichen', HS),
  streiten: strong('streiten', 'stritt', 'gestritten', H),
  weichen: strong('weichen', 'wich', 'gewichen', S),
  // 1b ei – ie – ie
  bleiben: strong('bleiben', 'blieb', 'geblieben', S),
  gedeihen: strong('gedeihen', 'gedieh', 'gediehen', S),
  leihen: strong('leihen', 'lieh', 'geliehen', H),
  meiden: strong('meiden', 'mied', 'gemieden', H),
  preisen: strong('preisen', 'pries', 'gepriesen', H),
  reiben: strong('reiben', 'rieb', 'gerieben', H),
  scheiden: strong('scheiden', 'schied', 'geschieden', HS),
  scheinen: strong('scheinen', 'schien', 'geschienen', H),
  schreiben: strong('schreiben', 'schrieb', 'geschrieben', H),
  schreien: strong('schreien', 'schrie', 'geschrien', H),
  schweigen: strong('schweigen', 'schwieg', 'geschwiegen', H),
  speien: strong('speien', 'spie', 'gespien', H),
  steigen: strong('steigen', 'stieg', 'gestiegen', S),
  treiben: strong('treiben', 'trieb', 'getrieben', HS),
  weisen: strong('weisen', 'wies', 'gewiesen', H),
  zeihen: strong('zeihen', 'zieh', 'geziehen', H),
  // 2a ie – o – o (long)
  biegen: strong('biegen', 'bog', 'gebogen', HS),
  bieten: strong('bieten', 'bot', 'geboten', H),
  fliegen: strong('fliegen', 'flog', 'geflogen', MOTION),
  fliehen: strong('fliehen', 'floh', 'geflohen', MOTION),
  frieren: strong('frieren', 'fror', 'gefroren', [{ verb: 'haben', condition: 'feel cold' }, { verb: 'sein', condition: 'freeze, turn to ice' }]),
  schieben: strong('schieben', 'schob', 'geschoben', HS),
  stieben: strong('stieben', whole(weakPreterite('stieb'), alternate('stob')), whole('gestiebt', alternate('gestoben')), MOTION),
  verlieren: strong('verlieren', 'verlor', 'verloren', H),
  wiegen: {
    paradigms: [
      { pattern: 'strong', condition: 'weigh', entry: strong('wiegen', 'wog', 'gewogen', H) },
      { pattern: 'weak', condition: 'rock, sway', entry: weak('wiegen') },
    ],
  },
  ziehen: strong('ziehen', 'zog', 'gezogen', HS),
  // 2b ie – o – o (short)
  fließen: strong('fließen', 'floss', 'geflossen', S),
  genießen: strong('genießen', 'genoss', 'genossen', H),
  gießen: strong('gießen', 'goss', 'gegossen', H),
  kriechen: strong('kriechen', 'kroch', 'gekrochen', MOTION),
  riechen: strong('riechen', 'roch', 'gerochen', H),
  schießen: strong('schießen', 'schoss', 'geschossen', HS),
  schließen: strong('schließen', 'schloss', 'geschlossen', H),
  sieden: {
    paradigms: [
      { pattern: 'weak', condition: 'boil (the only form in technical use)', entry: weak('sieden') },
      { pattern: 'strong', condition: 'cook in boiling water (usually strong)', entry: strong('sieden', 'sott', 'gesotten', H) },
    ],
  },
  sprießen: strong('sprießen', 'spross', 'gesprossen', S),
  triefen: strong('triefen', whole(weakPreterite('trief'), literary('troff')), 'getrieft', MOTION),
  verdrießen: strong('verdrießen', 'verdross', 'verdrossen', H),
  // 2c other vowels – o – o
  lügen: strong('lügen', 'log', 'gelogen', H),
  trügen: strong('trügen', 'trog', 'getrogen', H),
  saugen: {
    paradigms: [
      { pattern: 'weak', condition: 'any sense; the only form for vacuum cleaning and technical suction', entry: weak('saugen') },
      { pattern: 'strong', condition: 'suck, draw in (not for vacuum cleaning)', entry: strong('saugen', 'sog', 'gesogen', H) },
    ],
  },
  heben: strong('heben', 'hob', 'gehoben', H, { subjunctive: whole('höb', dated('hüb')) }),
  schwören: strong('schwören', whole('schwor', dated('schwur')), 'geschworen', H),
  gären: {
    paradigms: [
      { pattern: 'weak', condition: 'mostly figurative (unrest, anger brews)', entry: weak('gären') },
      { pattern: 'strong', condition: 'mostly literal (wine, dough ferments)', entry: strong('gären', 'gor', 'gegoren', [{ verb: 'haben', condition: 'ferment' }, { verb: 'sein', condition: 'turn into something by fermenting' }]) },
    ],
  },
  wägen: strong('wägen', whole('wog', weakPreterite('wäg')), 'gewogen', H),
  bewegen: {
    paradigms: [
      { pattern: 'weak', condition: 'set in motion, move', entry: weak('bewegen') },
      { pattern: 'strong', condition: 'induce, persuade', entry: strong('bewegen', 'bewog', 'bewogen', H) },
    ],
  },
  erwägen: strong('erwägen', 'erwog', 'erwogen', H),
  melken: strong('melken', whole(weakPreterite('melk'), alternate('molk')), whole('gemelkt', alternate('gemolken')), H, {
    present2: whole('melk', alternate('milk')), imperative: whole('melk', { text: 'melke', pattern: 'long' }, alternate('milk')),
  }),
  quellen: strong('quellen', 'quoll', 'gequollen', S, { present2: 'quill' }),
  schmelzen: strong('schmelzen', 'schmolz', 'geschmolzen', SH, { present2: 'schmilz' }),
  schwellen: strong('schwellen', 'schwoll', 'geschwollen', S, { present2: 'schwill' }),
  dreschen: strong('dreschen', whole('drosch', alternate('drasch')), 'gedroschen', H, { present2: 'drisch' }),
  fechten: strong('fechten', 'focht', 'gefochten', H, { present2: 'ficht' }),
  flechten: strong('flechten', 'flocht', 'geflochten', H, { present2: 'flicht' }),
  scheren: strong('scheren', 'schor', 'geschoren', H),
  glimmen: strong('glimmen', whole('glomm', { text: 'glimm', pattern: 'weak' }), whole('geglommen', alternate('geglimmt')), H),
  klimmen: strong('klimmen', 'klomm', 'geklommen', S),
  erlöschen: strong('erlöschen', 'erlosch', 'erloschen', S, { present2: 'erlisch' }),
  verlöschen: strong('verlöschen', 'verlosch', 'verloschen', S, { present2: 'verlisch' }),
  saufen: strong('saufen', 'soff', 'gesoffen', H, { present2: 'säuf' }),
  // 3a i – a – u
  binden: strong('binden', 'band', 'gebunden', H),
  dingen: strong('dingen', whole(weakPreterite('ding'), alternate('dang')), whole('gedingt', alternate('gedungen')), H),
  dringen: strong('dringen', 'drang', 'gedrungen', MOTION),
  finden: strong('finden', 'fand', 'gefunden', H),
  gelingen: strong('gelingen', 'gelang', 'gelungen', S),
  klingen: strong('klingen', 'klang', 'geklungen', H),
  misslingen: strong('misslingen', 'misslang', 'misslungen', S),
  ringen: strong('ringen', 'rang', 'gerungen', H),
  schinden: strong('schinden', whole(weakPreterite('schind'), alternate('schund')), 'geschunden', H),
  schlingen: strong('schlingen', 'schlang', 'geschlungen', H),
  schwinden: strong('schwinden', 'schwand', 'geschwunden', S),
  schwingen: strong('schwingen', 'schwang', 'geschwungen', HS),
  singen: strong('singen', 'sang', 'gesungen', H),
  sinken: strong('sinken', 'sank', 'gesunken', S),
  springen: strong('springen', 'sprang', 'gesprungen', S),
  stinken: strong('stinken', 'stank', 'gestunken', H),
  trinken: strong('trinken', 'trank', 'getrunken', H),
  winden: strong('winden', 'wand', 'gewunden', H),
  wringen: strong('wringen', 'wrang', 'gewrungen', H),
  zwingen: strong('zwingen', 'zwang', 'gezwungen', H),
  // 3b i – a – o
  beginnen: strong('beginnen', 'begann', 'begonnen', H, { subjunctive: whole('begänn', dated('begönn')) }),
  gewinnen: strong('gewinnen', 'gewann', 'gewonnen', H, { subjunctive: whole('gewänn', dated('gewönn')) }),
  rinnen: strong('rinnen', 'rann', 'geronnen', SH, { subjunctive: whole('ränn', dated('rönn')) }),
  sinnen: strong('sinnen', 'sann', 'gesonnen', H, { subjunctive: whole('sänn', dated('sönn')) }),
  spinnen: strong('spinnen', 'spann', 'gesponnen', H, { subjunctive: whole('spänn', dated('spönn')) }),
  schwimmen: strong('schwimmen', 'schwamm', 'geschwommen', MOTION, { subjunctive: whole('schwämm', dated('schwömm')) }),
  // 3c e – a – o, e → i
  bergen: strong('bergen', 'barg', 'geborgen', H, { present2: 'birg' }),
  bersten: strong('bersten', 'barst', 'geborsten', S, {
    present2: 'birst',
    cells: { 'indicative.present.2sg': whole('birst'), 'indicative.present.3sg': whole('birst'), 'indicative.past.2sg': whole('barst', { text: 'barstest', pattern: 'long' }) },
  }),
  gelten: strong('gelten', 'galt', 'gegolten', H, { present2: 'gilt', subjunctive: whole('gält', dated('gölt')) }),
  helfen: strong('helfen', 'half', 'geholfen', H, { present2: 'hilf', subjunctive: whole('hälf', alternate('hülf')) }),
  schelten: strong('schelten', 'schalt', 'gescholten', H, { present2: 'schilt', subjunctive: whole('schält', dated('schölt')) }),
  sterben: strong('sterben', 'starb', 'gestorben', S, { present2: 'stirb', subjunctive: whole('stürb') }),
  verderben: strong('verderben', 'verdarb', 'verdorben', SH, { present2: 'verdirb', subjunctive: whole('verdärb', dudenOnly('verdürb')) }),
  werben: strong('werben', 'warb', 'geworben', H, { present2: 'wirb', subjunctive: whole('würb') }),
  werfen: strong('werfen', 'warf', 'geworfen', H, { present2: 'wirf', subjunctive: whole('würf') }),
  // 4 e – a – o, e → i(e)
  befehlen: strong('befehlen', 'befahl', 'befohlen', H, { present2: 'befiehl', subjunctive: whole('befähl', dated('beföhl')) }),
  brechen: strong('brechen', 'brach', 'gebrochen', SH, { present2: 'brich' }),
  empfehlen: strong('empfehlen', 'empfahl', 'empfohlen', H, { present2: 'empfiehl', subjunctive: whole('empfähl', dated('empföhl')) }),
  gebären: strong('gebären', 'gebar', 'geboren', H, {
    present2: whole('gebier', alternate('gebär')), imperative: whole('gebier', alternate('gebär'), { text: 'gebäre', pattern: 'long' }),
  }),
  nehmen: strong('nehmen', 'nahm', 'genommen', H, { present2: 'nimm' }),
  sprechen: strong('sprechen', 'sprach', 'gesprochen', H, { present2: 'sprich' }),
  stechen: strong('stechen', 'stach', 'gestochen', HS, { present2: 'stich' }),
  stehlen: strong('stehlen', 'stahl', 'gestohlen', H, { present2: 'stiehl', subjunctive: whole('stähl', dudenOnly('stöhl')) }),
  treffen: strong('treffen', 'traf', 'getroffen', HS, { present2: 'triff' }),
  erschrecken: {
    paradigms: [
      { pattern: 'weak', condition: 'transitive: frighten', entry: weak('erschrecken') },
      { pattern: 'strong', condition: 'intransitive: be frightened', entry: strong('erschrecken', 'erschrak', 'erschrocken', S, { present2: 'erschrick' }) },
    ],
  },
  kommen: strong('kommen', 'kam', 'gekommen', S),
  // 5 e – a – e
  essen: strong('essen', 'aß', 'gegessen', H, { present2: 'iss' }),
  fressen: strong('fressen', 'fraß', 'gefressen', H, { present2: 'friss' }),
  geben: strong('geben', 'gab', 'gegeben', H, { present2: 'gib' }),
  genesen: strong('genesen', 'genas', 'genesen', S),
  geschehen: strong('geschehen', 'geschah', 'geschehen', S, { present2: 'geschieh', flags: ['thirdPersonOnly'] }),
  lesen: strong('lesen', 'las', 'gelesen', H, { present2: 'lies' }),
  messen: strong('messen', 'maß', 'gemessen', H, { present2: 'miss' }),
  sehen: strong('sehen', 'sah', 'gesehen', H, { present2: 'sieh', imperative: whole('sieh', { text: 'siehe', pattern: 'long' }) }),
  treten: strong('treten', 'trat', 'getreten', SH, { present2: 'tritt' }),
  vergessen: strong('vergessen', 'vergaß', 'vergessen', H, { present2: 'vergiss' }),
  bitten: strong('bitten', 'bat', 'gebeten', H),
  liegen: strong('liegen', 'lag', 'gelegen', SOUTH),
  sitzen: strong('sitzen', 'saß', 'gesessen', SOUTH),
  // 6 a – u – a
  backen: {
    paradigms: [
      { pattern: 'weak', entry: strong('backen', whole(weakPreterite('back')), 'gebacken', H) },
      { pattern: 'strong', entry: strong('backen', whole(dated('buk')), 'gebacken', H, { present2: 'bäck' }) },
    ],
  },
  fahren: strong('fahren', 'fuhr', 'gefahren', [{ verb: 'sein', condition: 'movement, travel' }, { verb: 'haben', condition: 'drive a vehicle, transport' }], { present2: 'fähr' }),
  graben: strong('graben', 'grub', 'gegraben', H, { present2: 'gräb' }),
  laden: strong('laden', 'lud', 'geladen', H, { present2: 'läd', imperative: whole('lad', { text: 'lade', pattern: 'long' }) }),
  mahlen: strong('mahlen', whole(weakPreterite('mahl')), 'gemahlen', H),
  schaffen: {
    paradigms: [
      { pattern: 'strong', condition: 'create', entry: strong('schaffen', 'schuf', 'geschaffen', H) },
      { pattern: 'weak', condition: 'manage, accomplish', entry: weak('schaffen') },
    ],
  },
  schlagen: strong('schlagen', 'schlug', 'geschlagen', HS, { present2: 'schläg' }),
  tragen: strong('tragen', 'trug', 'getragen', H, { present2: 'träg' }),
  wachsen: {
    paradigms: [
      { pattern: 'strong', condition: 'grow', entry: strong('wachsen', 'wuchs', 'gewachsen', S, { present2: 'wächs' }) },
      { pattern: 'weak', condition: 'wax', entry: weak('wachsen') },
    ],
  },
  waschen: strong('waschen', 'wusch', 'gewaschen', [{ verb: 'haben' }, { verb: 'sein', condition: 'be washed (ashore, away)' }], { present2: 'wäsch' }),
  // 7 reduplicating
  blasen: strong('blasen', 'blies', 'geblasen', H, { present2: 'bläs' }),
  braten: strong('braten', 'briet', 'gebraten', H, { present2: 'brät' }),
  fallen: strong('fallen', 'fiel', 'gefallen', S, { present2: 'fäll' }),
  fangen: strong('fangen', 'fing', 'gefangen', H, { present2: 'fäng' }),
  halten: strong('halten', 'hielt', 'gehalten', H, { present2: 'hält' }),
  hängen: {
    paradigms: [
      { pattern: 'weak', condition: 'transitive: hang up', entry: weak('hängen') },
      { pattern: 'strong', condition: 'intransitive: hang', entry: strong('hängen', 'hing', 'gehangen', SOUTH_DWDS) },
    ],
  },
  hauen: strong('hauen', whole(weakPreterite('hau'), alternate('hieb')), 'gehauen', [{ verb: 'haben' }, { verb: 'sein', condition: 'bump into, run against' }]),
  heißen: strong('heißen', 'hieß', 'geheißen', H),
  laufen: strong('laufen', 'lief', 'gelaufen', MOTION, { present2: 'läuf' }),
  lassen: strong('lassen', 'ließ', 'gelassen', H, { present2: 'läss' }),
  raten: strong('raten', 'riet', 'geraten', H, { present2: 'rät' }),
  rufen: strong('rufen', 'rief', 'gerufen', H),
  salzen: strong('salzen', whole(weakPreterite('salz')), whole('gesalzen', alternate('gesalzt')), H),
  schlafen: strong('schlafen', 'schlief', 'geschlafen', H, { present2: 'schläf' }),
  spalten: strong('spalten', whole(weakPreterite('spalt')), whole('gespalten', alternate('gespaltet')), H),
  stoßen: strong('stoßen', 'stieß', 'gestoßen', HS, { present2: 'stöß' }),
  gehen: strong('gehen', 'ging', 'gegangen', S),
  stehen: strong('stehen', 'stand', 'gestanden', SOUTH, { subjunctive: whole('ständ', alternate('stünd')) }),
  // mixed
  dünken: mixed('dünken', whole('dünk', alternate('deuch')), whole('gedünkt', alternate('gedeucht')), whole('dünkt', alternate('deucht')), H),
  brennen: mixed('brennen', 'brann', 'gebrannt', 'brennt', H),
  bringen: mixed('bringen', 'brach', 'gebracht', 'brächt', H),
  denken: mixed('denken', 'dach', 'gedacht', 'dächt', H),
  kennen: mixed('kennen', 'kann', 'gekannt', 'kennt', H),
  nennen: mixed('nennen', 'nann', 'genannt', 'nennt', H),
  rennen: mixed('rennen', 'rann', 'gerannt', 'rennt', MOTION),
  senden: {
    paradigms: [
      { pattern: 'mixed', condition: 'send', entry: mixed('senden', 'sand', 'gesandt', 'sendet', H) },
      { pattern: 'weak', condition: 'broadcast', entry: weak('senden') },
    ],
  },
  wenden: {
    paradigms: [
      { pattern: 'mixed', condition: 'turn (oneself), apply', entry: mixed('wenden', 'wand', 'gewandt', 'wendet', H) },
      { pattern: 'weak', condition: 'turn over, turn round', entry: weak('wenden') },
    ],
  },
  // preterite-present
  dürfen: modal('dürfen', 'darf', 'durf', 'gedurft', 'dürft'),
  können: modal('können', 'kann', 'konn', 'gekonnt', 'könnt'),
  mögen: modal('mögen', 'mag', 'moch', 'gemocht', 'möcht'),
  müssen: modal('müssen', 'muss', 'muss', 'gemusst', 'müsst'),
  sollen: modal('sollen', 'soll', 'soll', 'gesollt', 'sollt'),
  wollen: modal('wollen', 'will', 'woll', 'gewollt', 'wollt'),
  wissen: modal('wissen', 'weiß', 'wuss', 'gewusst', 'wüsst', { flags: [], imperative: whole('wisse') }),
  // irregular
  sein: {
    class: 'irregular', preterite: 'war', participle: 'gewesen', auxiliaries: S, imperative: whole('sei'),
    cells: {
      'indicative.present.1sg': whole('bin'), 'indicative.present.2sg': whole('bist'), 'indicative.present.3sg': whole('ist'),
      'indicative.present.1pl': whole('sind'), 'indicative.present.2pl': whole('seid'), 'indicative.present.3pl': whole('sind'),
      'subjunctive.present.1sg': whole('sei'), 'subjunctive.present.2sg': whole('seiest', { text: 'seist', pattern: 'short' }),
      'subjunctive.present.3sg': whole('sei'), 'subjunctive.present.1pl': whole('seien'), 'subjunctive.present.2pl': whole('seiet'),
      'subjunctive.present.3pl': whole('seien'),
      'imperative.present.1pl': whole('seien'), 'imperative.present.2pl': whole('seid'), 'imperative.present.3pl': whole('seien'),
    },
    ...checked('sein'),
  },
  haben: {
    class: 'irregular', preterite: 'hat', participle: 'gehabt', subjunctive: whole('hätt'), auxiliaries: H,
    imperative: whole('hab', { text: 'habe', pattern: 'long' }),
    cells: { 'indicative.present.2sg': whole('hast'), 'indicative.present.3sg': whole('hat') },
    ...checked('haben'),
  },
  werden: {
    class: 'irregular', preterite: 'wurd', participle: 'geworden', subjunctive: whole('würd'), auxiliaries: S, imperative: whole('werde'),
    cells: {
      'indicative.present.2sg': whole('wirst'), 'indicative.present.3sg': whole('wird'),
      'indicative.past.1sg': whole('wurde', dated('ward')), 'indicative.past.2sg': whole('wurdest', dated('wardst')),
      'indicative.past.3sg': whole('wurde', dated('ward')), 'indicative.past.1pl': whole('wurden'),
      'indicative.past.2pl': whole('wurdet'), 'indicative.past.3pl': whole('wurden'),
    },
    ...checked('werden'),
  },
  tun: {
    class: 'irregular', preterite: 'tat', participle: 'getan', auxiliaries: H, imperative: whole('tu', { text: 'tue', pattern: 'long', source: 'duden' }),
    cells: {
      'indicative.present.1pl': whole('tun'), 'indicative.present.3pl': whole('tun'),
      'imperative.present.1pl': whole('tun'), 'imperative.present.3pl': whole('tun'),
    },
    ...checked('tun'),
  },
};

/** Weak verbs whose perfect takes sein, or sein and haben (DWDS grammar line), in DWDS's order. */
export const weakWithSein: Readonly<Record<string, readonly AuxiliaryUse[]>> = {
  reisen: S, wandern: S, begegnen: S, klettern: S, stolpern: S, rutschen: S, platzen: S, explodieren: S, marschieren: S,
  erwachen: S, verreisen: S, verwelken: S, erstarren: S, flüchten: S,
  folgen: [{ verb: 'sein', condition: 'follow, come after' }, { verb: 'haben', condition: 'obey' }],
  landen: [{ verb: 'sein', condition: 'land, arrive' }, { verb: 'haben', condition: 'land an aircraft, bring ashore' }],
  eilen: [{ verb: 'sein', condition: 'hurry somewhere' }, { verb: 'haben', condition: 'be urgent' }],
  rasen: [{ verb: 'haben', condition: 'rage' }, { verb: 'sein', condition: 'race, speed' }],
  passieren: [{ verb: 'sein', condition: 'happen' }, { verb: 'haben', condition: 'pass, go through' }],
  segeln: MOTION, joggen: [{ verb: 'haben', condition: activity }, { verb: 'sein', condition: motion }],
  tauchen: [{ verb: 'haben', condition: activity }, { verb: 'sein', condition: motion }],
  starten: [{ verb: 'sein', condition: 'set off, take off' }, { verb: 'haben', condition: 'start something' }],
  stürzen: [{ verb: 'sein', condition: 'fall, rush' }, { verb: 'haben', condition: 'overthrow, tip over' }],
  kentern: [{ verb: 'sein', condition: 'capsize' }, { verb: 'haben', condition: 'capsize a boat' }],
};

/** Derivatives of listed roots whose auxiliaries are listed instead of assumed from the root (DWDS grammar line). */
export const derivativeAuxiliaries: Readonly<Record<string, readonly AuxiliaryUse[]>> = {
  vertreten: H, erscheinen: S, verschwinden: S, entkommen: S, gerinnen: S,
  gefallen: H, befallen: H, besteigen: H, betreten: H, auferstehen: S, beitreten: S, verfallen: S, einschlafen: S,
  zergehen: S, entfliehen: S, ertrinken: S, zerfallen: S, entfallen: S, erfahren: H, befahren: H, vergeben: H, begeben: H,
  entgleiten: S, mitgehen: S, ankommen: S, losgehen: S, missverstehen: H, verschlafen: H, bevorstehen: H,
  verlaufen: [{ verb: 'sein', condition: 'run, proceed; run (colours)' }, { verb: 'haben', condition: 'run, extend (a road, a border)' }],
  ergehen: [{ verb: 'sein', condition: 'be issued; fare' }, { verb: 'haben', condition: 'walk about (literary)' }],
  verfahren: [{ verb: 'haben', condition: 'proceed, act; use up driving' }, { verb: 'sein', condition: 'take a wrong turn (sich verfahren is not modelled)' }],
  abfahren: [{ verb: 'sein', condition: 'depart, leave' }, { verb: 'haben', condition: 'travel along; wear down; take away' }],
  // Derivatives checked at DWDS (dictionary grammar line) whose auxiliaries the defaults would get wrong; two auxiliaries
  // in DWDS's order, sein for the intransitive and haben for the transitive use.
  belaufen: HS, beschlagen: HS, bewachsen: HS, durchbiegen: H, durchbrennen: S, durchgären: S, durchklingen: SH,
  durchschieben: H, durchschleifen: H, durchschmelzen: S, durchtreiben: H, durchtreten: HS, durchwaschen: H,
  durchweichen: SH, entbrennen: S, entfahren: S, entfliegen: S, entfließen: S, entglimmen: S, entlaufen: S,
  entquellen: S, entrinnen: S, entschlafen: S, entschreiten: S, entschwinden: S, entsinken: S, entsprießen: S,
  entspringen: S, entsteigen: S, entwachsen: S, entweichen: S, erfließen: S, erfrieren: SH, erglimmen: S,
  erklingen: S, erliegen: S, ersaufen: S, ersprießen: S, ersterben: S, erwachsen: S, gefrieren: S,
  geraten: S, missraten: S, umhauen: H, umrennen: H, umschießen: H, umschmelzen: H, umstoßen: H, umtreiben: H,
  umwenden: HS, unterkriechen: S, verbleiben: S, verbrennen: HS, verfliegen: HS, verfließen: S, verfrieren: S,
  verglimmen: S, verklingen: S, verkommen: S, verquellen: S, verrinnen: S, versaufen: HS, verscheiden: S,
  verschmelzen: HS, verschwellen: S, verschwimmen: S, versinken: S, verspringen: HS, versterben: S, verstreichen: HS,
  verwachsen: SH, verziehen: HS, vollhauen: H, volllaufen: S, vollschlagen: H, wiederschlagen: H, wiedertreffen: H,
  zerbersten: S, zerbrechen: HS, zerfließen: S, zerlaufen: S, zerreißen: HS, zerrinnen: S, zerschmelzen: S,
  zerspringen: S, zerstieben: S, überschießen: S, übersieden: S,
  bekommen: [{ verb: 'haben', condition: 'get, receive' }, { verb: 'sein', condition: 'agree with someone (food)' }],
  erstehen: [{ verb: 'haben', condition: 'buy, acquire' }, { verb: 'sein', condition: 'arise, rise again (literary)' }],
  erweichen: HS, zerweichen: HS, vergären: HS, versalzen: HS, verschießen: HS, verbacken: HS, verstieben: S, durchfrieren: S,
};

/** Derivatives of the short roots gehen, tun, sein and stehen, checked one by one at DWDS, with their auxiliaries. */
export const shortRootDerivatives: Readonly<Record<string, readonly AuxiliaryUse[]>> = {
  ausgehen: S, eingehen: S, vergehen: S, entgehen: S,
  angehen: [{ verb: 'haben', condition: 'concern; tackle' }, { verb: 'sein', condition: 'come on, start burning; be acceptable' }],
  begehen: H, abtun: H, antun: H, zutun: H, auftun: H, dastehen: H,
  aufstehen: [{ verb: 'sein', condition: 'get up, stand up' }, { verb: 'haben', condition: 'stand open (a door, a window)' }],
  verstehen: H, entstehen: S, bestehen: H, gestehen: H,
};

/** One reading of a lemma whose particle is separable in one sense and inseparable in another. */
export interface PrefixReading {
  /** When the reading applies; absent where the sources give the two readings without a gloss to tell them apart. */
  readonly condition?: string;
  readonly auxiliaries?: readonly AuxiliaryUse[];
  /** The particle keeps its stress and stays on the verb without becoming a prefix: Partizip II with ge- after it. */
  readonly stressed?: true;
}

/** Lemmas with a separable and an inseparable reading (two paradigms, separable first), checked at DWDS and Duden. */
export const dualPrefixLemmas: Readonly<Record<string, {
  readonly separable: PrefixReading; readonly inseparable: PrefixReading;
  /** The inseparable reading is the common one and comes first. */
  readonly inseparableFirst?: true;
}>> = {
  umziehen: {
    separable: { condition: 'move house; change clothes', auxiliaries: [{ verb: 'sein', condition: 'move house' }, { verb: 'haben', condition: 'change clothes, change someone' }] },
    inseparable: { condition: 'surround, cover', auxiliaries: H },
  },
  umfahren: {
    separable: { condition: 'knock down', auxiliaries: [{ verb: 'haben', condition: 'knock down' }, { verb: 'sein', condition: 'take a detour' }] },
    inseparable: { condition: 'drive round', auxiliaries: H },
  },
  umgehen: { separable: { condition: 'deal with; go round', auxiliaries: S }, inseparable: { condition: 'avoid, bypass', auxiliaries: H } },
  umschreiben: { separable: { condition: 'rewrite', auxiliaries: H }, inseparable: { condition: 'paraphrase, describe', auxiliaries: H } },
  umstellen: { separable: { condition: 'rearrange, switch over', auxiliaries: H }, inseparable: { condition: 'surround', auxiliaries: H } },
  übersetzen: {
    separable: { condition: 'ferry across', auxiliaries: [{ verb: 'haben', condition: 'ferry someone across' }, { verb: 'sein', condition: 'cross over' }] },
    inseparable: { condition: 'translate', auxiliaries: H },
  },
  überlegen: { separable: { condition: 'lay over', auxiliaries: H }, inseparable: { condition: 'think about, consider', auxiliaries: H } },
  überziehen: { separable: { condition: 'put on (a garment)', auxiliaries: H }, inseparable: { condition: 'cover; overdraw', auxiliaries: H } },
  übergehen: { separable: { condition: 'pass into, change over', auxiliaries: S }, inseparable: { condition: 'pass over, ignore', auxiliaries: H } },
  übertreten: {
    separable: { condition: 'step over, convert', auxiliaries: [{ verb: 'sein', condition: 'step over, convert' }, { verb: 'haben', condition: 'step over the line (sport)' }] },
    inseparable: { condition: 'break (a rule)', auxiliaries: H },
  },
  unterhalten: { separable: { condition: 'hold underneath', auxiliaries: H }, inseparable: { condition: 'entertain; maintain', auxiliaries: H } },
  unterstellen: { separable: { condition: 'put under shelter', auxiliaries: H }, inseparable: { condition: 'insinuate; place under', auxiliaries: H } },
  unterziehen: { separable: { condition: 'put on underneath', auxiliaries: H }, inseparable: { condition: 'subject to', auxiliaries: H } },
  durchbrechen: {
    separable: { condition: 'break in two', auxiliaries: [{ verb: 'haben', condition: transitive }, { verb: 'sein', condition: 'break, break through' }] },
    inseparable: { condition: 'break through (a barrier)', auxiliaries: H },
  },
  durchlaufen: {
    separable: { condition: 'run through; wear through', auxiliaries: [{ verb: 'sein', condition: motion }, { verb: 'haben', condition: 'wear through (shoes)' }] },
    inseparable: { condition: 'pass through (a stage)', auxiliaries: H },
  },
  durchschauen: { separable: { condition: 'look through', auxiliaries: H }, inseparable: { condition: 'see through (someone)', auxiliaries: H } },
  durchsetzen: { separable: { condition: 'enforce, push through', auxiliaries: H }, inseparable: { condition: 'permeate, intersperse', auxiliaries: H } },
  durchsuchen: { separable: { condition: 'search through', auxiliaries: H }, inseparable: { condition: 'search (a place)', auxiliaries: H } },
  wiederholen: { separable: { condition: 'fetch back', auxiliaries: H }, inseparable: { condition: 'repeat', auxiliaries: H } },
  überholen: { separable: { condition: 'ferry across; heel over', auxiliaries: H }, inseparable: { condition: 'overtake; overhaul', auxiliaries: H } },
  überfallen: { separable: { condition: 'fall over forwards', auxiliaries: S }, inseparable: { condition: 'attack, raid; overcome', auxiliaries: H } },
  durchdringen: { separable: { condition: 'get through, penetrate', auxiliaries: S }, inseparable: { condition: 'permeate, pervade', auxiliaries: H } },
  // Checked at DWDS: the dictionary gives each a separable and an inseparable reading, without a gloss to tell them apart
  // here; the pattern labels name the readings.
durchbeißen: { separable: { auxiliaries: H }, inseparable: { auxiliaries: H } },
  durchfahren: { separable: { auxiliaries: S }, inseparable: { auxiliaries: H } },
  durchfallen: { separable: { auxiliaries: S }, inseparable: { auxiliaries: H } },
  durchfliegen: { separable: { auxiliaries: S }, inseparable: { auxiliaries: H } },
  durchhauen: { separable: { auxiliaries: H }, inseparable: { auxiliaries: H } },
  durchkriechen: { separable: { auxiliaries: S }, inseparable: { auxiliaries: H } },
  durchlesen: { separable: { auxiliaries: H }, inseparable: { auxiliaries: H } },
  durchreiten: { separable: { auxiliaries: SH }, inseparable: { auxiliaries: H } },
  durchrennen: { separable: { auxiliaries: S }, inseparable: { auxiliaries: H } },
  durchrinnen: { separable: { auxiliaries: S }, inseparable: { auxiliaries: H } },
  durchschlafen: { separable: { auxiliaries: H }, inseparable: { auxiliaries: H } },
  durchschlagen: { separable: { auxiliaries: HS }, inseparable: { auxiliaries: H } },
  durchschneiden: { separable: { auxiliaries: H }, inseparable: { auxiliaries: H } },
  durchschwimmen: { separable: { auxiliaries: S }, inseparable: { auxiliaries: H } },
  durchspalten: { separable: { auxiliaries: H }, inseparable: { auxiliaries: H } },
  durchspringen: { separable: { auxiliaries: S }, inseparable: { auxiliaries: H } },
  durchstechen: { separable: { auxiliaries: HS }, inseparable: { auxiliaries: H } },
  durchsteigen: { separable: { auxiliaries: S }, inseparable: { auxiliaries: H } },
  durchstoßen: { separable: { auxiliaries: S }, inseparable: { auxiliaries: H } },
  durchstreichen: { separable: { auxiliaries: H }, inseparable: { auxiliaries: H } },
  durchtrinken: { separable: { auxiliaries: H }, inseparable: { auxiliaries: H } },
  durchziehen: { separable: { auxiliaries: HS }, inseparable: { auxiliaries: H } },
  hinterbringen: { separable: { auxiliaries: H }, inseparable: { auxiliaries: H } },
  hinterlaufen: { separable: { auxiliaries: S }, inseparable: { auxiliaries: H } },
  hinterziehen: { separable: { auxiliaries: H }, inseparable: { auxiliaries: H } },
  umbinden: { separable: { auxiliaries: H }, inseparable: { auxiliaries: H } },
  umbrechen: { separable: { auxiliaries: HS }, inseparable: { auxiliaries: H } },
  umfliegen: { separable: { auxiliaries: S }, inseparable: { auxiliaries: H } },
  umhängen: { separable: { auxiliaries: H }, inseparable: { auxiliaries: H } },
  umlaufen: { separable: { auxiliaries: HS }, inseparable: { auxiliaries: H } },
  umreißen: { separable: { auxiliaries: H }, inseparable: { auxiliaries: H } },
  umschlagen: { separable: { auxiliaries: SH }, inseparable: { auxiliaries: H } },
  umschlingen: { separable: { auxiliaries: H }, inseparable: { auxiliaries: H } },
  umspringen: { separable: { auxiliaries: S }, inseparable: { auxiliaries: H } },
  umstechen: { separable: { auxiliaries: H }, inseparable: { auxiliaries: H } },
  umstreichen: { separable: { auxiliaries: H }, inseparable: { auxiliaries: H } },
  unterbinden: { separable: { auxiliaries: H }, inseparable: { auxiliaries: H } },
  untergraben: { separable: { auxiliaries: H }, inseparable: { auxiliaries: H } },
  unterschieben: { separable: { auxiliaries: H }, inseparable: { auxiliaries: H } },
  unterschlagen: { separable: { auxiliaries: H }, inseparable: { auxiliaries: H } },
  widerscheinen: { separable: { auxiliaries: H }, inseparable: { auxiliaries: H } },
  überbraten: { separable: { auxiliaries: H }, inseparable: { auxiliaries: H } },
  überfließen: { separable: { auxiliaries: S }, inseparable: { auxiliaries: H } },
  übergeben: { separable: { auxiliaries: H }, inseparable: { auxiliaries: H } },
  überkommen: { separable: { auxiliaries: S }, inseparable: { auxiliaries: HS } },
  überlaufen: { separable: { auxiliaries: S }, inseparable: { auxiliaries: H } },
  überschlagen: { separable: { auxiliaries: HS }, inseparable: { auxiliaries: H } },
  überspringen: { separable: { auxiliaries: S }, inseparable: { auxiliaries: H } },
  übersteigen: { separable: { auxiliaries: S }, inseparable: { auxiliaries: H } },
  widerspiegeln: { separable: { condition: 'reflect', auxiliaries: H }, inseparable: { condition: 'reflect (less common)', auxiliaries: H, stressed: true } },
  anerkennen: { separable: { condition: 'recognise, acknowledge', auxiliaries: H }, inseparable: { condition: 'less common, especially Swiss', auxiliaries: H, stressed: true } },
  übernehmen: { separable: { condition: 'sling over, put on (a coat)', auxiliaries: H }, inseparable: { condition: 'take over, take on', auxiliaries: H }, inseparableFirst: true },
};

/** Verbs whose dual particle is an inseparable prefix (they have no separable reading here), with their auxiliaries. */
export const inseparableReadings: Readonly<Record<string, readonly AuxiliaryUse[]>> = {
  überzeugen: H, überraschen: H, überleben: H, übernachten: H,
  unterlaufen: [{ verb: 'sein', condition: 'slip in (an error)' }, { verb: 'haben', condition: 'get under, undermine' }],
  // Checked at DWDS: the dictionary gives these verbs an inseparable reading only.
  durchdenken: H, durchflechten: H, durchfließen: H, durchleiden: H, durchmessen: H, durchschießen: H,
  durchschreiten: H, durchspinnen: H, durchwinden: H, hinterbleiben: S, hintertreiben: H, umfangen: H, umflechten: H,
  umfließen: H, umgreifen: H, umpfeifen: H, umreiten: H, umschleichen: H, umschließen: H, umschreiten: H,
  umsingen: H, umspinnen: H, umstehen: H, umwachsen: H, umwerben: H, umwinden: H, unterbieten: H, unterbleiben: S,
  unterfahren: H, unterfangen: H, unterfliegen: H, unterlassen: H, unterliegen: SH, unternehmen: H,
  unterschneiden: H, unterschreiten: H, unterstreichen: H, untertreiben: H, unterwaschen: H, unterweisen: H,
  unterwerfen: H, widerfahren: S, widerraten: H, widerrufen: H, widerstreiten: H, überbacken: H, überbieten: H,
  überblasen: H, überbringen: H, überdenken: H, überfliegen: H, überfrieren: S, überheben: H, überladen: H,
  überlassen: H, überlesen: H, überreiten: H, überreißen: H, überrennen: H, überschlafen: H, überschreiben: H,
  überschreien: H, überschreiten: H, übersenden: H, überspinnen: H, überstreichen: H, übertragen: H, übertreffen: H,
  überwachsen: H, überwiegen: H, überweisen: H, übertreiben: H, überprüfen: H, überqueren: H, überwinden: H,
  übersehen: H, unterrichten: H, unterschreiben: H, unterstützen: H, unterbrechen: H, untersuchen: H, unterscheiden: H,
  unterdrücken: H, umarmen: H, umgeben: H, umfassen: H, umringen: H, durchqueren: H, widersprechen: H, widerstehen: H,
  hinterlassen: H, hintergehen: H, vollenden: H, vollziehen: H, vollbringen: H,
  // Reflexive in use (sich überschneiden …), inseparable in form at DWDS.
  überschneiden: H, überfressen: H, hintersinnen: H, unterwinden: H,
};

/** Weak verbs that start like a particle or prefix verb but are not one: never split. */
export const lookalikes: readonly string[] = [
  'angeln', 'ankern', 'beben', 'beichten', 'beugen', 'dauern', 'einigen', 'entern', 'festigen', 'geizen', 'hindern', 'mitteln',
  'abonnieren', 'animieren', 'annoncieren', 'antizipieren',
];

/** Weak verbs that look like derivatives of a listed root but are conjugated on their own, with that root. */
export const noInherit: Readonly<Record<string, string>> = {
  bedingen: 'dingen', bereiten: 'reiten', handhaben: 'haben', willfahren: 'fahren', umringen: 'ringen',
  begleiten: 'gleiten', verleiden: 'leiden',
  bekneifen: 'kneifen', bepreisen: 'preisen', beringen: 'ringen', bescheren: 'scheren', beschwingen: 'schwingen', erweichen: 'weichen',
  zerweichen: 'weichen', gehaben: 'haben', beschaffen: 'schaffen', verschaffen: 'schaffen',
  // A particle verb on the weak weichen (soften), not the strong one (give way).
  durchweichen: 'weichen',
};

/** Particle verbs whose particle is not in the closed particle lists: bevorstehen (steht bevor, bevorgestanden). */
export const particleVerbs: Readonly<Record<string, string>> = { bevorstehen: 'bevor' };

/**
 * Strong verbs whose Konjunktiv II has a short du- and ihr-form beside -est and -et (kämst, kämt), as the Duden
 * conjugation table prints it; `dwds` where DWDS prints it too (only sein: wärst, wärt).
 */
export const shortSubjunctive: Readonly<Record<string, 'duden' | 'dwds'>> = Object.fromEntries([
  ...['fliehen', 'frieren', 'schieben', 'verlieren', 'ziehen', 'kriechen', 'riechen', 'lügen', 'trügen', 'heben', 'schwören', 'dreschen',
    'erlöschen', 'sinken', 'stinken', 'beginnen', 'gewinnen', 'rinnen', 'sinnen', 'spinnen', 'schwimmen', 'helfen', 'sterben', 'verderben',
    'werben', 'werfen', 'befehlen', 'brechen', 'empfehlen', 'gebären', 'nehmen', 'sprechen', 'stechen', 'stehlen', 'treffen', 'kommen',
    'geben', 'backen', 'fahren', 'graben', 'waschen'].map(lemma => [lemma, 'duden' as const]),
  ['sein', 'dwds' as const],
]);

/** The inseparable prefixes that make a verb from a noun with a separable particle in it (be-antrag-en, ver-anlass-en). */
export const denominalPrefixes: readonly string[] = ['be', 'ver'];

/**
 * Weak verbs not stressed on the first syllable (Partizip II without ge-), with the Partizip II with ge- that DWDS also
 * prints, if any.
 */
export const nonInitialStress: Readonly<Record<string, string | null>> = {
  frohlocken: null, kredenzen: null, posaunen: null, prophezeien: null, kasteien: null, rumoren: null, schmarotzen: null,
  trompeten: null, miauen: null, krakeelen: null, benedeien: 'gebenedeit', offenbaren: 'geoffenbart', willfahren: 'gewillfahrt',
};

/** Weather verbs: only the es-form (third person singular). */
export const impersonalVerbs: readonly string[] = ['regnen', 'schneien', 'hageln', 'nieseln', 'donnern', 'blitzen'];

/** The German particles and prefixes (GD §3.3); a dual particle is separable when stressed, inseparable when not. */
export const germanParticles: ParticleTables = {
  separable: [
    'ab', 'an', 'auf', 'aus', 'bei', 'da', 'dabei', 'dagegen', 'daher', 'dahin', 'daneben', 'dar', 'davon', 'davor', 'dazu',
    'dazwischen', 'ein', 'empor', 'entgegen', 'entlang', 'entzwei', 'fest', 'fort', 'frei', 'gegenüber', 'heim', 'her', 'herab',
    'heran', 'herauf', 'heraus', 'herbei', 'herein', 'herüber', 'herum', 'herunter', 'hervor', 'hin', 'hinab', 'hinauf', 'hinaus',
    'hinein', 'hinüber', 'hinunter', 'hinweg', 'hinzu', 'hoch', 'los', 'mit', 'nach', 'nieder', 'vor', 'voran', 'voraus', 'vorbei',
    'vorüber', 'vorweg', 'weg', 'weiter', 'zu', 'zurecht', 'zurück', 'zusammen', 'zuvor',
  ],
  dual: ['durch', 'hinter', 'über', 'um', 'unter', 'voll', 'wider', 'wieder'],
  inseparable: ['be', 'emp', 'ent', 'er', 'ge', 'miss', 'ver', 'zer'],
  onsets: [
    'b', 'bl', 'br', 'ch', 'd', 'dr', 'f', 'fl', 'fr', 'g', 'gl', 'gn', 'gr', 'h', 'j', 'k', 'kl', 'kn', 'kr', 'l', 'm', 'n', 'p',
    'pf', 'pfl', 'pfr', 'pl', 'pr', 'qu', 'r', 's', 'sch', 'schl', 'schm', 'schn', 'schr', 'schw', 'sk', 'sl', 'sm', 'sn', 'sp',
    'spl', 'spr', 'st', 'str', 't', 'tr', 'ts', 'tsch', 'v', 'w', 'wr', 'z', 'zw',
  ],
  infinitiveEnding: /e?n$/u,
  vowels: /[aeiouyäöü]/u,
  digraphs: ['qu'],
};
