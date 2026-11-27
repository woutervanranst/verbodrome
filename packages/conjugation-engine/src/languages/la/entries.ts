/**
 * The Latin lexicon's data and the types it is written in (GD §5). Principal parts are transcribed from the 1903 print
 * of Allen & Greenough (page scans on DCC), checked against Lewis & Short via Logeion where A&G is silent; every entry
 * records how it was checked in `checked`. Nothing is copied from the scraped corpus or from Wiktionary.
 *
 * Normalisations of the print (reported, not silent): breves are not written (ĕs → es, cecĭdī → cecidī, fīdĕre →
 * fīdere); a final -o / -i of a first principal part that the print left without its macron is written long (lūdō,
 * sternuō, nūpsī), as every 1sg present in -ō and perfect in -ī is (A&G §§163, 172).
 */

export type LatinConjugation = 'first' | 'second' | 'third' | 'thirdIo' | 'fourth' | 'irregular';
export type LatinStemClass = 'a' | 'e' | 'consonant' | 'io' | 'i';
/** What a verb lacks; `supine` is the supine itself where the stem exists for the participle (fīō: factus, factum īrī). */
export type LatinLack = 'present' | 'perfect' | 'supineStem' | 'supine' | 'imperative' | 'presentParticiple' | 'futureParticiple' | 'gerund';
/** `intransitive`: a deponent or semi-deponent whose gerundive is only impersonal (moriendum est, A&G §190.d). */
export type LatinFlag = 'shortImperative' | 'athematic' | 'eoRoot' | 'longBeforeVowel' | 'fore' | 'passiveIsFio' | 'intransitive';

export interface LexicalForm {
  readonly text: string;
  readonly usage?: 'standard' | 'literary' | 'dated';
  readonly pattern?: string;
  /** Marks a clause reads to keep a word out of a construction (forem is not used in the compound tenses). */
  readonly marks?: readonly string[];
}

/**
 * What was read to check an entry: the 1903 A&G scan, the A&G text of the DCC edition, the Lewis & Short entry, or
 * Bennett only (`secondary`); `unverified` when nothing was read (the default for a new entry).
 */
export interface LexiconCheck {
  readonly url?: `https://${string}`;
  readonly status: 'ag-print' | 'ag-text' | 'ls' | 'secondary' | 'unverified';
}

/** The weakened form a family's compounds take (A&G §267 Note 2): `-cipiō, -cipere, -cēpī, -ceptum` for capiō. */
export interface CompoundForm {
  readonly present?: string;
  readonly infinitive?: string;
  readonly perfect?: readonly string[];
  readonly supine?: readonly string[];
  /** The only prefixes the family takes (a short root, or a closed list in the grammar); `[]` takes none. */
  readonly prefixes?: readonly string[];
  /** Compounds disagree (currō: -currī / -cucurrī): inheriting is an assumption. */
  readonly vary?: true;
  /** The prefixes (table ids) whose compounds keep the simple verb's form beside the weakened ones (perlegō, relegō). */
  readonly simplePrefixes?: readonly string[];
  /** A compound's own perfect and supine, by prefix id (ferō: ad- attulī allātum, A&G §200.a). */
  readonly overrides?: Readonly<Record<string, { readonly perfect: readonly string[]; readonly supine: readonly string[] }>>;
  /** A compound with a prefix the overrides do not list is assumed to follow the simple verb (an assumption step). */
  readonly assumeUnlisted?: true;
}

/** A compound of sum: the prefix before a form of sum that starts with a vowel or a consonant (prōd-es, prō-sum). */
export interface SumCompound {
  readonly vowel: string;
  readonly consonant: string;
  /** possum: pot- before a vowel, pos- before s, and potess- shortened to poss- (A&G §198.b). */
  readonly pot?: true;
}

export interface LatinEntry {
  /** The 1sg present as printed (amō, hortor); null for coepī, meminī, ōdī. */
  readonly present: string | null;
  readonly infinitive: string;
  /** 1sg perfect active, preferred first; absent for deponents and for a verb without a perfect. */
  readonly perfect?: readonly string[];
  /** The supine (amātum); for deponents and semi-deponents the neuter of the participle (hortātum). */
  readonly supine?: readonly string[];
  /** Only where it is not supine stem + ūrus (moritūrus, futūrus). */
  readonly futureParticiple?: readonly string[];
  readonly conjugation: LatinConjugation;
  /** The stem class an irregular verb's derived cells follow. */
  readonly stemClass?: LatinStemClass;
  readonly voice?: 'deponent' | 'semiDeponent';
  readonly passive?: 'impersonal' | 'none';
  readonly impersonal?: true;
  readonly lacks?: readonly LatinLack[];
  /** Whole words, keyed `indicative.present.active.2s` or by non-finite form id (`presentInfinitive`). */
  readonly cells?: Readonly<Record<string, readonly LexicalForm[]>>;
  /** Special stems: `presentParticiple` (pot), `presentParticipleOblique` (eunt), `gerund` (eund), `optative` (vel). */
  readonly stems?: Readonly<Record<string, string>>;
  readonly flags?: readonly LatinFlag[];
  readonly compound?: CompoundForm;
  /** Only its compounds are verbs (-cutiō, -spiciō): the entry is a family and never matched by itself. */
  readonly familyOnly?: true;
  /** English gloss, for the `condition` of a homograph's paradigm. */
  readonly gloss?: string;
  /** A paradigm-level label (lavere, literary). */
  readonly usage?: 'literary' | 'dated';
  /** Other spellings of the infinitive the entry answers to (dēesse beside deesse). */
  readonly spellings?: readonly string[];
  /** The usage of the perfects after the first (eō: īvī beside iī, A&G §203 note b). */
  readonly alternativeUsage?: 'literary' | 'dated';
  /** Listed cells are added beside the derived word, not instead of it (edō: ēs beside edis). */
  readonly cellsBeside?: true;
  /** A compound of sum, whose present system is built from sum's forms. */
  readonly sumCompound?: SumCompound;
  /** Targets (`indicative.present.active.1s`, `participle.present`, `infinitive.present.active`) the grammar prints; no others exist. */
  readonly attested?: readonly string[];
  /** Targets the grammar prints as missing although the verb has the rest (dō: no 1sg present passive). */
  readonly notAttested?: readonly string[];
  /** The cases a declined form is attested in (fārī: gerund fandī, fandō). */
  readonly attestedCases?: Readonly<Record<string, readonly ('nominative' | 'genitive' | 'dative' | 'accusative' | 'ablative' | 'vocative')[]>>;
  /** Targets whose forms are dated (fīō: fīmus, fītis, the imperatives; A&G p. 115 brackets). */
  readonly dated?: readonly string[];
  readonly source: { readonly work: 'ag' | 'bennett' | 'ls'; readonly locator: string };
  readonly checked: LexiconCheck;
}

/** Extra data of one row. */
type Extra = Partial<Omit<LatinEntry, 'present' | 'perfect' | 'supine' | 'futureParticiple' | 'source' | 'checked'>> & {
  readonly fp?: string;
};

/** One row of a list: 1sg present, perfect(s) (`a|b`, '' for none), supine or participle stem(s) as printed ('' for none). */
type Row = readonly [present: string, perfect: string, supine: string, extra?: Extra];

const scan = (page: number): `https://${string}` => `https://dcc.dickinson.edu/sites/default/files/AG${String(page + 12).padStart(3, '0')}.jpg`;
const lsUrl = (lemma: string): `https://${string}` => `https://logeion.uchicago.edu/${lemma}`;
const bennettUrl = (section: number): `https://${string}` => `https://www.gutenberg.org/files/15665/15665-h/15665-h.htm#sect${section}`;

/** The 1sg ending is long: a print that left it unmarked is normalised. */
function present(text: string): string {
  return text.replace(/o$/u, 'ō').replace(/or$/u, 'or');
}

/** The infinitive of a regular verb from its 1sg present and conjugation (A&G §§171, 190). */
export function infinitiveOf(first: string, conjugation: LatinConjugation, deponent: boolean): string {
  const swap = (active: [string, string], passive: [string, string]): string => {
    const [ending, replacement] = deponent ? passive : active;
    if (!first.endsWith(ending)) throw new Error(`Latin lexicon: ${first} does not end in -${ending}.`);
    return first.slice(0, -ending.length) + replacement;
  };
  switch (conjugation) {
    case 'first': return swap(['ō', 'āre'], ['or', 'ārī']);
    case 'second': return swap(['eō', 'ēre'], ['eor', 'ērī']);
    case 'third': return swap(['ō', 'ere'], ['or', 'ī']);
    case 'thirdIo': return swap(['iō', 'ere'], ['ior', 'ī']);
    case 'fourth': return swap(['iō', 'īre'], ['ior', 'īrī']);
    case 'irregular': throw new Error(`Latin lexicon: ${first} is irregular; give its infinitive.`);
  }
}

/** A printed supine stem (tēct, claus) or supine (fartum) as the supine in -um; a participle (lāpsus) when `participle`. */
function supineOf(printed: string, participle: boolean): string {
  if (participle) return `${printed.slice(0, -2)}um`;
  return printed.endsWith('um') ? printed : `${printed}um`;
}

const alternatives = (text: string, map: (item: string) => string = item => item): readonly string[] | undefined =>
  text === '' ? undefined : text.split('|').map(map);

/** The entries of one printed list. */
function list(conjugation: LatinConjugation, locator: string, checked: LexiconCheck, rows: readonly Row[], work: 'ag' | 'bennett' | 'ls' = 'ag'): LatinEntry[] {
  return rows.map(([first, perfect, supine, extra = {}]) => {
    const { fp, conjugation: own, ...rest } = extra;
    const conj = own ?? conjugation;
    const p = present(first);
    const deponent = rest.voice === 'deponent';
    const supines = alternatives(supine, printed => supineOf(printed, deponent || rest.voice === 'semiDeponent'));
    const perfects = alternatives(perfect);
    const semi = rest.voice === 'semiDeponent';
    const lacks = new Set(rest.lacks ?? []);
    if (!perfects && !deponent && !semi) lacks.add('perfect');
    if (!supines) lacks.add('supineStem');
    const { lacks: _lacks, infinitive, ...data } = rest;
    return {
      present: p,
      infinitive: infinitive ?? infinitiveOf(p, conj, deponent),
      conjugation: conj,
      ...(perfects ? { perfect: perfects } : {}),
      ...(supines ? { supine: supines } : {}),
      ...(fp ? { futureParticiple: fp.split('|') } : {}),
      ...(lacks.size ? { lacks: [...lacks] } : {}),
      ...data,
      source: { work, locator },
      checked,
    };
  });
}

const ag = (page: number): LexiconCheck => ({ url: scan(page), status: 'ag-print' });
const lsCheck = (lemma: string): LexiconCheck => ({ url: lsUrl(lemma), status: 'ls' });

const dep = { voice: 'deponent' } as const;
const io = { conjugation: 'thirdIo' } as const;
const short = { flags: ['shortImperative'] } as const;

// The five model verbs, A&G §172 (DCC text, checked against the paradigm pages viewed in the design pass).
const models: LatinEntry[] = [
  ...list('first', 'A&G §172', { url: 'https://dcc.dickinson.edu/grammar/latin/four-conjugations', status: 'ag-text' }, [['amō', 'amāvī', 'amāt']]),
  ...list('second', 'A&G §172', { url: 'https://dcc.dickinson.edu/grammar/latin/four-conjugations', status: 'ag-text' }, [['moneō', 'monuī', 'monit']]),
  ...list('fourth', 'A&G §172', { url: 'https://dcc.dickinson.edu/grammar/latin/four-conjugations', status: 'ag-text' }, [['audiō', 'audīvī', 'audīt']]),
];

// A&G §209.a, p. 121: first conjugation, perfect and supine formed irregularly. stō is in the irregular group (stō's
// compounds are listed there too); plicō, whose simple parts the print gives only for compounds, is left out.
const first209: LatinEntry[] = list('first', 'A&G §209.a', ag(121), [
  ['crepō', 'crepuī', 'crepit'], ['cubō', 'cubuī', 'cubit'], ['domō', 'domuī', 'domit'], ['fricō', 'fricuī', 'frict'],
  ['iuvō', 'iūvī', 'iūt', { fp: 'iūtūrus|iuvātūrus' }], ['micō', 'micuī', ''], ['necō', 'necāvī', 'necāt'],
  ['pōtō', 'pōtāvī', 'pōt'], ['secō', 'secuī', 'sect', { fp: 'sectūrus|secātūrus' }],
  ['sonō', 'sonuī', 'sonit', { fp: 'sonitūrus|sonātūrus' }], ['tonō', 'tonuī', 'tonit', { gloss: 'thunder' }], ['vetō', 'vetuī', 'vetit'],
]);

// A&G §210, pp. 121–122: second conjugation.
const second210: LatinEntry[] = [
  ...list('second', 'A&G §210.a', ag(122), [
    ['arceō', 'arcuī', ''], ['careō', 'caruī', '', { fp: 'caritūrus' }], ['egeō', 'eguī', ''], ['timeō', 'timuī', ''], ['maereō', '', ''],
  ]),
  ...list('second', 'A&G §210.b', ag(122), [
    ['dēleō', 'dēlēvī', 'dēlēt'], ['fleō', 'flēvī', 'flēt'], ['neō', 'nēvī', 'nēt'], ['vieō', 'viēvī', 'viēt'],
    ['pleō', 'plēvī', 'plēt', { familyOnly: true, compound: { prefixes: ['com', 'ex', 'in', 're', 'sub'] } }],
  ]),
  ...list('second', 'A&G §210.c', ag(122), [
    ['algeō', 'alsī', ''], ['ārdeō', 'ārsī', '', { fp: 'ārsūrus' }], ['augeō', 'auxī', 'auct'], ['caveō', 'cāvī', 'caut'],
    ['cēnseō', 'cēnsuī', 'cēns'], ['cieō', 'cīvī', 'cit'], ['doceō', 'docuī', 'doct'], ['faveō', 'fāvī', 'faut'],
    ['ferveō', 'fervī|ferbuī', ''], ['foveō', 'fōvī', 'fōt'], ['fulgeō', 'fulsī', ''], ['haereō', 'haesī', 'haes'],
    ['indulgeō', 'indulsī', 'indult'], ['iubeō', 'iussī', 'iuss'], ['liqueō', 'licuī|līquī', ''], ['lūceō', 'lūxī', ''],
    ['lūgeō', 'lūxī', ''], ['maneō', 'mānsī', 'māns'], ['misceō', 'miscuī', 'mixt|mist'],
    ['mordeō', 'momordī', 'mors', { compound: { prefixes: [] } }], ['moveō', 'mōvī', 'mōt'], ['mulceō', 'mulsī', 'muls'],
    ['mulgeō', 'mulsī', 'muls'], ['cōnīveō', 'cōnīvī|cōnīxī', ''], ['aboleō', 'abolēvī', 'abolit'],
    // L&S pendeō: "pependi, 2, v. n." with no supine; A&G's -pēns- is the compounds'.
    ['pendeō', 'pependī', '', { gloss: 'hang', compound: { prefixes: [] } }], ['prandeō', 'prandī', 'prāns'],
    ['rīdeō', 'rīsī', 'rīs'],
    ['sedeō', 'sēdī', 'sess', { compound: { present: 'sideō', perfect: ['sēdī'], supine: ['sessum'] } }],
    ['sorbeō', 'sorbuī|sorpsī', ''], ['spondeō', 'spopondī', 'spōns', { compound: { prefixes: [] } }],
    ['strīdeō', 'strīdī', ''], ['suādeō', 'suāsī', 'suās'],
    ['teneō', 'tenuī', 'tent', { compound: { present: 'tineō', perfect: ['tinuī'], supine: ['tentum'] } }],
    ['tergeō', 'tersī', 'ters'], ['tondeō', 'totondī', 'tōns', { compound: { prefixes: [] } }], ['torqueō', 'torsī', 'tort'],
    ['torreō', 'torruī', 'tost'], ['turgeō', 'tursī', ''], ['urgeō', 'ursī', ''], ['videō', 'vīdī', 'vīs'], ['voveō', 'vōvī', 'vōt'],
  ]),
];

// A&G §211, pp. 122–125: third conjugation.
const third211: LatinEntry[] = [
  ...list('third', 'A&G §211.a', ag(123), [
    ['angō', 'ānxī', ''], ['carpō', 'carpsī', 'carpt'], ['cēdō', 'cessī', 'cess'], ['cingō', 'cīnxī', 'cīnct'],
    ['claudō', 'clausī', 'claus', { gloss: 'shut', compound: { present: 'clūdō', perfect: ['clūsī'], supine: ['clūsum'] } }],
    ['cōmō', 'cōmpsī', 'cōmpt'], ['coquō', 'coxī', 'coct'],
    ['cutiō', 'cussī', 'cuss', { ...io, familyOnly: true }],
    ['dēmō', 'dēmpsī', 'dēmpt'], ['dīcō', 'dīxī', 'dict', short], ['dīvidō', 'dīvīsī', 'dīvīs'], ['dūcō', 'dūxī', 'duct', short],
    ['ēmungō', 'ēmūnxī', 'ēmūnct'], ['fīgō', 'fīxī', 'fīx'], ['fingō', 'fīnxī', 'fict'], ['flectō', 'flexī', 'flex'],
    ['flīgō', 'flīxī', 'flīct', { familyOnly: true }], ['fluō', 'flūxī', 'flux'], ['frendō', '', 'frēs|fress'],
    ['frīgō', 'frīxī', 'frīct'], ['gerō', 'gessī', 'gest'], ['iungō', 'iūnxī', 'iūnct'], ['laedō', 'laesī', 'laes'],
    ['liciō', 'lexī', 'lect', { ...io, familyOnly: true }], ['lūdō', 'lūsī', 'lūs'], ['mergō', 'mersī', 'mers'],
    ['mittō', 'mīsī', 'miss'], ['nectō', 'nexī|nexuī', 'nex'], ['nūbō', 'nūpsī', 'nūpt'], ['pectō', 'pexī', 'pex'],
    ['pergō', 'perrēxī', 'perrēct'], ['pingō', 'pīnxī', 'pict'], ['plangō', 'plānxī', 'plānct'],
    ['plaudō', 'plausī', 'plaus', { compound: { present: 'plōdō', perfect: ['plōsī'], supine: ['plōsum'] } }],
    ['plectō', 'plexī', 'plex'],
    ['premō', 'pressī', 'press', { compound: { present: 'primō', perfect: ['pressī'], supine: ['pressum'] } }],
    ['prōmō', 'prōmpsī', 'prōmpt'],
    ['quatiō', '', 'quass', { ...io, compound: { present: 'cutiō', perfect: ['cussī'], supine: ['cussum'] } }],
    ['rādō', 'rāsī', 'rās'], ['regō', 'rēxī', 'rēct', { compound: { present: 'rigō', perfect: ['rēxī'], supine: ['rēctum'] } }],
    ['rēpō', 'rēpsī', ''], ['rōdō', 'rōsī', 'rōs'], ['scalpō', 'scalpsī', 'scalpt'], ['scrībō', 'scrīpsī', 'scrīpt'],
    ['sculpō', 'sculpsī', 'sculpt'], ['serpō', 'serpsī', ''], ['spargō', 'sparsī', 'spars', { compound: { present: 'spergō', perfect: ['spersī'], supine: ['spersum'] } }],
    ['spiciō', 'spexī', 'spect', { ...io, familyOnly: true }], ['stinguō', 'stīnxī', 'stīnct', { familyOnly: true }],
    ['stringō', 'strīnxī', 'strict'], ['struō', 'strūxī', 'strūct'], ['sūgō', 'sūxī', 'sūct'], ['sūmō', 'sūmpsī', 'sūmpt'],
    ['surgō', 'surrēxī', 'surrēct'], ['tegō', 'tēxī', 'tēct'], ['temnō', 'tempsī', 'tempt'], ['tergō', 'tersī', 'ters'],
    ['tingō', 'tīnxī', 'tīnct', { compound: { prefixes: [] } }], ['trahō', 'trāxī', 'trāct'], ['trūdō', 'trūsī', 'trūs'], ['unguō', 'ūnxī', 'ūnct'],
    ['ūrō', 'ussī', 'ust'], ['vādō', 'vāsī', 'vās'], ['vehō', 'vēxī', 'vect'], ['vīvō', 'vīxī', 'vīct'],
  ]),
  ...list('third', 'A&G §211.b', ag(123), [
    ['cadō', 'cecidī', 'cās', { gloss: 'fall', compound: { present: 'cidō', perfect: ['cidī'], supine: ['cāsum'] } }],
    ['caedō', 'cecīdī', 'caes', { gloss: 'cut', compound: { present: 'cīdō', perfect: ['cīdī'], supine: ['cīsum'] } }],
    ['canō', 'cecinī', '', { compound: { present: 'cinō', perfect: ['cinuī'], supine: ['centum'] } }],
    ['currō', 'cucurrī', 'curs', { compound: { present: 'currō', perfect: ['currī', 'cucurrī'], supine: ['cursum'], vary: true } }],
    ['discō', 'didicī', ''], ['fallō', 'fefellī', 'fals', { compound: { prefixes: [] } }],
    ['pangō', 'pepigī', 'pāct', { compound: { prefixes: [] } }],
    ['parcō', 'pepercī|parsī', '', { fp: 'parsūrus', compound: { prefixes: [] } }],
    ['pariō', 'peperī', 'part', { ...io, fp: 'paritūrus', gloss: 'bring forth', compound: { prefixes: [] } }],
    ['pellō', 'pepulī', 'puls', { compound: { present: 'pellō', perfect: ['pulī'], supine: ['pulsum'] } }],
    ['pendō', 'pependī', 'pēns', { gloss: 'weigh', compound: { present: 'pendō', perfect: ['pendī'], supine: ['pēnsum'] } }],
    ['poscō', 'poposcī', ''],
    ['pungō', 'pupugī', 'pūnct', { compound: { present: 'pungō', perfect: ['pūnxī'], supine: ['pūnctum'] } }],
    ['sistō', 'stitī', 'stat'],
    ['tangō', 'tetigī', 'tāct', { compound: { present: 'tingō', perfect: ['tigī'], supine: ['tāctum'] } }],
    ['tendō', 'tetendī', 'tent', { compound: { present: 'tendō', perfect: ['tendī'], supine: ['tentum'] } }],
    ['tundō', 'tutudī', 'tūns|tūs', { compound: { prefixes: [] } }],
  ]),
  // -dō (A&G §211.b, root DHA): the compounds listed with it.
  ...list('third', 'A&G §211.b (-dō)', ag(123), ['abdō', 'addō', 'condō', 'crēdō', 'dēdō', 'ēdō', 'indō', 'perdō', 'prōdō', 'reddō', 'subdō', 'trādō', 'vēndō']
    .map((verb): Row => [verb, `${verb.slice(0, -1)}idī`, `${verb.slice(0, -1)}it`, verb === 'ēdō' ? { gloss: 'give out', compound: { prefixes: [] } } : { compound: { prefixes: [] } }])),
  ...list('third', 'A&G §211.c', ag(124), [
    ['alō', 'aluī', 'alt|alit'], ['cernō', 'crēvī', 'crēt'], ['colō', 'coluī', 'cult'], ['compēscō', 'compēscuī', ''],
    ['cōnsulō', 'cōnsuluī', 'cōnsult'], ['crēscō', 'crēvī', 'crēt'], ['cumbō', 'cubuī', 'cubit', { familyOnly: true }],
    ['depsō', 'depsuī', 'depst'], ['fremō', 'fremuī', ''], ['gemō', 'gemuī', ''], ['gignō', 'genuī', 'genit'],
    ['metō', 'messuī', 'mess'], ['molō', 'moluī', 'molit'], ['occulō', 'occuluī', 'occult'], ['adolēscō', 'adolēvī', 'adult'],
    ['pāscō', 'pāvī', 'pāst'], ['percellō', 'perculī', 'perculs'], ['pōnō', 'posuī', 'posit'], ['quiēscō', 'quiēvī', 'quiēt'],
    ['rapiō', 'rapuī', 'rapt', { ...io, compound: { present: 'ripiō', perfect: ['ripuī'], supine: ['reptum'] } }],
    ['scīscō', 'scīvī', 'scīt'], ['serō', 'sēvī', 'sat', { gloss: 'sow' }], ['serō', 'seruī', 'sert', { gloss: 'entwine' }],
    ['sinō', 'sīvī', 'sit'], ['spernō', 'sprēvī', 'sprēt'], ['sternō', 'strāvī', 'strāt'], ['stertō', 'stertuī', ''],
    ['strepō', 'strepuī', ''], ['suēscō', 'suēvī', 'suēt'], ['texō', 'texuī', 'text'], ['tremō', 'tremuī', ''], ['vomō', 'vomuī', ''],
  ]),
  ...list('third', 'A&G §211.d', ag(124), [
    ['arcessō', 'arcessīvī', 'arcessīt'], ['capessō', 'capessīvī', ''], ['cupiō', 'cupīvī', 'cupīt', io],
    ['incessō', 'incessīvī', ''], ['lacessō', 'lacessīvī', 'lacessīt'], ['petō', 'petīvī', 'petīt'],
    ['quaerō', 'quaesīvī', 'quaesīt', { compound: { present: 'quīrō', perfect: ['quīsīvī'], supine: ['quīsītum'] } }],
    ['rudō', 'rudīvī', ''], ['sapiō', 'sapīvī', '', io], ['terō', 'trīvī', 'trīt'],
  ]),
  ...list('third', 'A&G §211.e', ag(124), [
    ['agō', 'ēgī', 'āct', { compound: { present: 'igō', perfect: ['ēgī'], supine: ['āctum'], prefixes: ['ab', 'ad', 'ex', 're', 'sub', 'trāns'] } }],
    ['capiō', 'cēpī', 'capt', { ...io, compound: { present: 'cipiō', perfect: ['cēpī'], supine: ['ceptum'] } }],
    ['emō', 'ēmī', 'ēmpt', { compound: { present: 'imō', perfect: ['ēmī'], supine: ['ēmptum'], prefixes: ['ad', 'dis', 'ex', 'inter', 'per', 're'] } }],
    ['faciō', 'fēcī', 'fact', { ...io, flags: ['shortImperative', 'passiveIsFio'], stems: { fio: '' }, compound: { present: 'ficiō', perfect: ['fēcī'], supine: ['fectum'] } }],
    ['fodiō', 'fōdī', 'foss', io], ['frangō', 'frēgī', 'frāct', { compound: { present: 'fringō', perfect: ['frēgī'], supine: ['frāctum'] } }], ['fugiō', 'fūgī', '', { ...io, fp: 'fugitūrus' }],
    ['fundō', 'fūdī', 'fūs'],
    ['iaciō', 'iēcī', 'iact', { ...io, gloss: 'throw', compound: { present: 'iciō', perfect: ['iēcī'], supine: ['iectum'] } }],
    ['legō', 'lēgī', 'lēct', { compound: { present: 'ligō', perfect: ['lēgī'], supine: ['lēctum'], simplePrefixes: ['per', 're'] } }],
    ['linō', 'lēvī|līvī', 'lit'], ['linquō', 'līquī', 'lict'], ['nōscō', 'nōvī', 'nōt'], ['rumpō', 'rūpī', 'rupt'],
    ['scabō', 'scābī', ''], ['vincō', 'vīcī', 'vict'],
  ]),
  // §211.e fn. 2: these compounds of legō have -lēxī.
  ...list('third', 'A&G §211.e fn. 2', ag(124), [['dīligō', 'dīlēxī', 'dīlēct'], ['intellegō', 'intellēxī', 'intellēct'], ['neglegō', 'neglēxī', 'neglēct']]),
  ...list('third', 'A&G §211.f', ag(125), [
    ['acuō', 'acuī', 'acūt'], ['arguō', 'arguī', 'argūt'], ['bibō', 'bibī', ''], ['cendō', 'cendī', 'cēns', { familyOnly: true }],
    ['congruō', 'congruī', ''], ['cūdō', 'cūdī', 'cūs'], ['facessō', 'facessiī|facessī', 'facessīt'],
    ['fendō', 'fendī', 'fēns', { familyOnly: true }], ['findō', 'fidī', 'fiss'], ['īcō', 'īcī', 'ict'], ['imbuō', 'imbuī', 'imbūt'],
    ['luō', 'luī', 'lūt'], ['mandō', 'mandī', 'māns'], ['metuō', 'metuī', 'metūt'], ['minuō', 'minuī', 'minūt'],
    ['nuō', 'nuī', '', { familyOnly: true }], ['pandō', 'pandī', 'pāns|pass'], ['pīnsō', 'pīnsī', 'pīns|pīnst|pīst'],
    ['prehendō', 'prehendī', 'prehēns'], ['ruō', 'ruī', 'rut', { fp: 'ruitūrus' }],
    ['scandō', '', '', { compound: { present: 'scendō', perfect: ['scendī'], supine: ['scēnsum'] } }],
    ['scindō', 'scidī', 'sciss'], ['sīdō', 'sīdī|sēdī', 'sess'], ['solvō', 'solvī', 'solūt'], ['spuō', 'spuī', ''],
    ['statuō', 'statuī', 'statūt', { compound: { present: 'stituō', perfect: ['stituī'], supine: ['stitūtum'] } }],
    ['sternuō', 'sternuī', ''], ['strīdō', 'strīdī', ''], ['suō', 'suī', 'sūt'], ['exuō', 'exuī', 'exūt'], ['tribuō', 'tribuī', 'tribūt'],
    ['vellō', 'vellī|vulsī', 'vuls'], ['verrō', 'verrī', 'vers'], ['vertō', 'vertī', 'vers'], ['vīsō', 'vīsī', 'vīs'], ['volvō', 'volvī', 'volūt'],
  ]),
  // §211 Note: no perfect or supine; tollō takes sustulī, sublātum from sufferō.
  ...list('third', 'A&G §211 Note', ag(125), [
    ['claudō', '', '', { gloss: 'limp', infinitive: 'claudere' }], ['fatīscō', '', ''], ['hīscō', '', ''], ['vergō', '', ''],
    ['tollō', 'sustulī', 'sublāt', { compound: { prefixes: [] } }],
  ]),
];

// A&G §212.b, p. 125: fourth conjugation with special perfects or supines.
const fourth212: LatinEntry[] = list('fourth', 'A&G §212.b', ag(125), [
  ['amiciō', 'amixī|amicuī', 'amict'], ['aperiō', 'aperuī', 'apert'], ['comperiō', 'comperī', 'compert'], ['farciō', 'farsī', 'fartum'],
  ['feriō', '', ''], ['fulciō', 'fulsī', 'fult'], ['hauriō', 'hausī', 'haust', { fp: 'hausūrus' }], ['operiō', 'operuī', 'opert'],
  ['reperiō', 'repperī', 'repert'], ['saepiō', 'saepsī', 'saept'],
  ['saliō', 'saluī|saliī', 'salt', { compound: { present: 'siliō', perfect: ['siluī'], supine: ['sultum'] } }],
  ['sanciō', 'sānxī', 'sānct'], ['sarciō', 'sarsī', 'sart'], ['sentiō', 'sēnsī', 'sēns'], ['sepeliō', 'sepelīvī', 'sepult'],
  ['veniō', 'vēnī', 'vent', { gloss: 'come' }], ['vinciō', 'vīnxī', 'vīnct'],
]);

// A&G §§190–192, pp. 103–106: deponents with their participles, and the semi-deponents.
const deponents191: LatinEntry[] = [
  ...list('first', 'A&G §190', ag(103), [['mīror', '', 'mīrātus', dep]]),
  ...list('second', 'A&G §190', ag(103), [['vereor', '', 'veritus', dep]]),
  ...list('fourth', 'A&G §190', ag(103), [['partior', '', 'partītus', dep]]),
  ...list('third', 'A&G §191', ag(105), [
    ['apīscor', '', 'aptus', { ...dep, compound: { present: 'ipīscor', supine: ['eptum'] } }], ['dēfetīscor', '', 'dēfessus', dep],
    ['expergīscor', '', 'experrēctus', dep], ['fruor', '', 'frūctus|fruitus', { ...dep, fp: 'fruitūrus' }], ['fungor', '', 'fūnctus', dep],
    ['gradior', '', 'gressus', { ...dep, ...io, flags: ['intransitive'], compound: { present: 'gredior', supine: ['gressum'] } }], ['īrāscor', '', 'īrātus', dep],
    ['lābor', '', 'lāpsus', { ...dep, flags: ['intransitive'] }], ['loquor', '', 'locūtus', dep], ['minīscor', '', 'mentus', { ...dep, familyOnly: true }],
    ['morior', '', 'mortuus', { ...dep, ...io, fp: 'moritūrus', flags: ['intransitive'] }], ['nancīscor', '', 'nactus|nānctus', dep], ['nāscor', '', 'nātus', dep],
    ['nītor', '', 'nīsus|nīxus', dep], ['oblīvīscor', '', 'oblītus', dep], ['orior', '', 'ortus', { ...dep, ...io, fp: 'oritūrus', infinitive: 'orīrī', cells: { presentInfinitivePassive: [{ text: 'orīrī' }] } }],
    ['pacīscor', '', 'pactus', dep], ['patior', '', 'passus', { ...dep, ...io, compound: { present: 'petior', supine: ['pessum'] } }],
    ['plector', '', 'plexus', { ...dep, familyOnly: true }], ['proficīscor', '', 'profectus', { ...dep, flags: ['intransitive'] }], ['queror', '', 'questus', dep],
    ['revertor', '', 'reversus', dep], ['ringor', '', 'rictus', dep], ['sequor', '', 'secūtus', dep], ['ulcīscor', '', 'ultus', dep],
    ['ūtor', '', 'ūsus', dep],
  ]),
  ...list('fourth', 'A&G §191', ag(105), [
    ['adsentior', '', 'adsēnsus', dep], ['experior', '', 'expertus', dep], ['mētior', '', 'mēnsus', dep], ['opperior', '', 'oppertus', dep],
    ['ōrdior', '', 'ōrsus', dep],
  ]),
  ...list('second', 'A&G §191', ag(105), [
    ['fateor', '', 'fassus', { ...dep, compound: { present: 'fiteor', supine: ['fessum'] } }], ['reor', '', 'ratus', dep], ['tueor', '', 'tuitus|tūtus', dep],
  ]),
  // §191.a, p. 106: no supine stem.
  ...list('third', 'A&G §191.a', ag(106), [
    ['dēvertor', '', '', dep], ['fatīscor', '', '', dep], ['līquor', '', '', dep], ['reminīscor', '', '', dep], ['vescor', '', '', dep],
  ]),
  ...list('second', 'A&G §191.a', ag(106), [['diffiteor', '', '', dep], ['medeor', '', '', dep]]),
  ...list('second', 'A&G §192', ag(106), [
    ['audeō', '', 'ausus', { voice: 'semiDeponent', lacks: ['supine'] }], ['gaudeō', '', 'gāvīsus', { voice: 'semiDeponent', lacks: ['supine'] }],
    ['soleō', '', 'solitus', { voice: 'semiDeponent', lacks: ['supine'] }],
  ]),
  ...list('third', 'A&G §192', ag(106), [['fīdō', '', 'fīsus', { voice: 'semiDeponent', lacks: ['supine'], flags: ['intransitive'] }]]),
];

/**
 * Regular verbs and deponents whose stem quantities A&G's lists do not give, as Lewis & Short prints them (GD §5.3
 * group K). Left out because L&S marks no quantity the engine would not keep anyway or contradicts the design: ōrnō,
 * vāstō, nūntiō and exīstimō (L&S orno, vasto, nuntio, existimo: hidden quantities unmarked), and mōror, which L&S
 * gives as "to be foolish"; "delay" is mŏror. pūgnō, rēgnō and mōnstrō keep the long vowel A&G §10.d gives before gn
 * and ns.
 */
const groupK: LatinEntry[] = [
  ...['hortor', 'cōnor', 'arbitror', 'cōnspicor', 'moror', 'precor', 'vēnor'].flatMap(lemma =>
    list('first', `L&S s.v. ${lemma}`, lsCheck(lemma.normalize('NFD').replace(/\u0304/gu, '')), [[lemma, '', `${lemma.slice(0, -2)}ātus`, dep]], 'ls')),
  ...['polliceor', 'mereor', 'misereor'].flatMap(lemma =>
    list('second', `L&S s.v. ${lemma}`, lsCheck(lemma), [[lemma, '', `${lemma.slice(0, -3)}itus`, dep]], 'ls')),
  ...['largior', 'potior', 'mentior', 'blandior', 'sortior'].flatMap(lemma =>
    list('fourth', `L&S s.v. ${lemma}`, lsCheck(lemma), [[lemma, '', `${lemma.slice(0, -3)}ītus`, dep]], 'ls')),
  ...['cēnō', 'clāmō', 'cōgitō', 'cūrō', 'dēclārō', 'dōnō', 'ēducō', 'explōrō', 'festīnō', 'iūdicō', 'labōrō', 'līberō', 'mōnstrō',
    'mūtō', 'nāvigō', 'nōminō', 'ōrō', 'pūgnō', 'rēgnō', 'sānō', 'spērō', 'vītō'].flatMap(lemma =>
    list('first', `L&S s.v. ${lemma}`, lsCheck(lemma.normalize('NFD').replace(/\u0304/gu, '')), [[lemma, `${lemma.slice(0, -1)}āvī`, `${lemma.slice(0, -1)}āt`]], 'ls')),
  ...['dormiō', 'fīniō', 'mūniō', 'nesciō', 'sciō', 'serviō'].flatMap(lemma =>
    list('fourth', `L&S s.v. ${lemma}`, lsCheck(lemma.normalize('NFD').replace(/\u0304/gu, '')), [[lemma, `${lemma.slice(0, -2)}īvī`, `${lemma.slice(0, -2)}īt`]], 'ls')),
  // Homographs and intransitives A&G's lists do not print (L&S): iaceō, pāreō, noceō.
  ...list('second', 'L&S s.v. iaceo', lsCheck('iaceo'), [['iaceō', 'iacuī', 'iacit', { gloss: 'lie' }]], 'ls'),
  ...list('second', 'L&S s.v. pareo', lsCheck('pareo'), [['pāreō', 'pāruī', 'pārit', { gloss: 'obey' }]], 'ls'),
  ...list('second', 'L&S s.v. noceo', lsCheck('noceo'), [['noceō', 'nocuī', 'nocit']], 'ls'),
  // Common second-conjugation verbs, so that a spelling without macrons finds them (L&S, each its own entry).
  ...([
    ['habeō', 'habuī', 'habit', { compound: { present: 'hibeō', perfect: ['hibuī'], supine: ['hibitum'], prefixes: ['ad', 'ex', 'com', 'in'] } }],
    ['prohibeō', 'prohibuī', 'prohibit'], ['dēbeō', 'dēbuī', 'dēbit'], ['praebeō', 'praebuī', 'praebit'],
    ['placeō', 'placuī', 'placit', { compound: { present: 'pliceō', perfect: ['plicuī'], supine: ['plicitum'], prefixes: ['dis'] } }],
    ['valeō', 'valuī', 'valit'], ['taceō', 'tacuī', 'tacit'], ['terreō', 'terruī', 'territ'], ['doleō', 'doluī', 'dolit'],
    ['studeō', 'studuī', ''], ['pateō', 'patuī', ''], ['lateō', 'latuī', ''], ['exerceō', 'exercuī', 'exercit'],
    ['coerceō', 'coercuī', 'coercit'], ['mereō', 'meruī', 'merit'], ['caleō', 'caluī', '', { fp: 'calitūrus' }], ['sileō', 'siluī', ''],
    ['horreō', 'horruī', ''], ['flōreō', 'flōruī', ''], ['niteō', '', ''], ['rubeō', '', ''],
  ] as const).flatMap(([lemma, perfect, supine, extra]) =>
    list('second', `L&S s.v. ${lemma.normalize('NFD').replace(/\u0304/gu, '')}`, lsCheck(lemma.normalize('NFD').replace(/\u0304/gu, '')), [[lemma, perfect, supine, extra ?? {}] as Row], 'ls')),
  // cōgō, dēgō: contracted compounds of agō (L&S cōgo, coēgi, coactum; dēgo, dēgi).
  ...list('third', 'L&S s.v. cogo', lsCheck('cogo'), [['cōgō', 'coēgī', 'coāct']], 'ls'),
  ...list('third', 'L&S s.v. dego', lsCheck('dego'), [['dēgō', 'dēgī', '']], 'ls'),
  // profiteor: pro- short (L&S prŏfĭtĕor, fessus); the other compounds of fateor are the -fiteor family.
  ...list('second', 'L&S s.v. profiteor', lsCheck('profiteor'), [['profiteor', '', 'professus', dep]], 'ls'),
  // -faciō compounds that keep a and take -fīō in the passive (A&G §204.b; L&S calefacio, satisfacio).
  ...list('thirdIo', 'A&G §204.b; L&S s.v. calefacio', ag(115), [
    ['calefaciō', 'calefēcī', 'calefact', { flags: ['shortImperative', 'passiveIsFio'], stems: { fio: 'cale' }, compound: { prefixes: [] } }],
    ['benefaciō', 'benefēcī', 'benefact', { flags: ['shortImperative', 'passiveIsFio'], stems: { fio: 'bene' }, compound: { prefixes: [] } }],
    ['satisfaciō', 'satisfēcī', 'satisfact', { flags: ['shortImperative', 'passiveIsFio'], stems: { fio: 'satis' }, compound: { prefixes: [] } }],
  ]),
  // lavō: first conjugation with lāvī and three supines, and the parallel literary lavere (A&G §§189, 211.e; L&S lavo).
  ...list('first', 'A&G §211.e; L&S s.v. lavo', ag(124), [['lavō', 'lāvī', 'laut|lōt|lavāt', { fp: 'lavātūrus' }]]),
];

export const regularEntries: readonly LatinEntry[] = [
  ...models, ...first209, ...second210, ...third211, ...fourth212, ...deponents191, ...groupK,
  ...list('third', 'A&G §189; §211.e', ag(124), [['lavō', 'lāvī', 'lōt|laut', { usage: 'literary' }]]),
];

export { bennettUrl, lsUrl, scan as agScan };
