/**
 * Irregular, defective and impersonal verbs (GD §5.2), transcribed from the 1903 A&G scans (pp. 81–83, 108–111,
 * 113–120) and Bennett. Present-system words that no rule derives are whole-word cells (`la.lex.cell`); everything else
 * is derived by the stages from the stems and flags given here.
 */
import type { LatinEntry, LexicalForm, LexiconCheck } from './entries.js';
import { agScan, bennettUrl } from './entries.js';

type Cells = Record<string, readonly LexicalForm[]>;

const finiteSlots = ['1s', '2s', '3s', '1p', '2p', '3p'] as const;
const imperativeSlots: Readonly<Record<string, readonly string[]>> = {
  'imperative.present': ['2s', '2p'],
  'imperative.future': ['2s', '3s', '2p', '3p'],
};

/** Cells of one tense from its words in slot order: `-` skips a slot, `a/b` adds b tagged by `tag`, `~a` tags a, `·` is a space. */
export function tense(key: string, words: string, tag: (word: string) => Omit<LexicalForm, 'text'> = () => ({}), voice = 'active'): Cells {
  const [mood, name] = key.split('.') as [string, string];
  const slots = imperativeSlots[key] ?? finiteSlots;
  const cells: Cells = {};
  words.split(' ').forEach((item, index) => {
    if (item === '-') return;
    cells[`${mood}.${name}.${voice}.${slots[index]!}`] = item.split('/').map((word, alternative) => {
      const text = word.replace(/^~/u, '').replace(/·/gu, ' ');
      return { text, ...(alternative === 0 && !word.startsWith('~') ? {} : tag(text)) };
    });
  });
  return cells;
}

const agPrint = (page: number): LexiconCheck => ({ url: agScan(page), status: 'ag-print' });

const sumCells: Cells = {
  ...tense('indicative.present', 'sum es est sumus estis sunt'),
  ...tense('indicative.imperfect', 'eram erās erat erāmus erātis erant'),
  ...tense('indicative.future', 'erō eris erit erimus eritis erunt'),
  ...tense('subjunctive.present', 'sim sīs sit sīmus sītis sint'),
  ...tense('subjunctive.imperfect', 'essem/forem essēs/forēs esset/foret essēmus essētis essent/forent'),
  ...tense('imperative.present', 'es este'),
  ...tense('imperative.future', 'estō estō estōte suntō'),
  presentInfinitive: [{ text: 'esse' }],
  fore: [{ text: 'fore' }],
};

/** A&G §170, pp. 81–83: no gerund, no supine, no participle but the future; forem and fore beside essem and futūrus esse. */
const sum: LatinEntry = {
  present: 'sum', infinitive: 'esse', perfect: ['fuī'], futureParticiple: ['futūrus'], conjugation: 'irregular', stemClass: 'consonant',
  passive: 'none', lacks: ['presentParticiple', 'supineStem', 'gerund'], cells: sumCells, flags: ['fore'],
  source: { work: 'ag', locator: 'A&G §170' }, checked: agPrint(82),
};

/**
 * The compounds of sum (A&G §198: ab, ad, dē, in, inter, ob, prae, prō, sub, super, without change of inflection;
 * perfects and present participles from Bennett §125). `vowel` and `consonant` are the prefix before a form of sum that
 * starts with a vowel or a consonant (prōd-es, prō-sum); `perfect` the prefix of fuī and futūrus.
 */
function sumCompound(vowel: string, consonant: string, perfect: string, participle?: string): LatinEntry {
  const cells: Cells = {};
  for (const [key, forms] of Object.entries(sumCells)) {
    if (key === 'fore') continue;
    const kept = forms.filter(form => !form.text.startsWith('for'));
    cells[key] = kept.map(form => ({ ...form, text: (/^[aeiouāēīōū]/u.test(form.text) ? vowel : consonant) + form.text }));
  }
  return {
    present: `${consonant}sum`, infinitive: `${vowel}esse`, perfect: [`${perfect}fuī`], futureParticiple: [`${perfect}futūrus`],
    conjugation: 'irregular', stemClass: 'consonant', passive: 'none',
    lacks: [...(participle ? [] : ['presentParticiple' as const]), 'supineStem', 'gerund'], cells,
    ...(participle ? { stems: { presentParticiple: participle } } : {}),
    source: { work: 'bennett', locator: 'A&G §198; Bennett §125' }, checked: { url: bennettUrl(125), status: 'secondary' },
  };
}

const sumCompounds: LatinEntry[] = [
  sumCompound('ab', 'ab', 'ā', 'abs'), sumCompound('ad', 'ad', 'ad'), sumCompound('de', 'dē', 'dē'), sumCompound('in', 'īn', 'īn'),
  sumCompound('inter', 'inter', 'inter'), sumCompound('ob', 'ob', 'ob'), sumCompound('prae', 'prae', 'prae', 'praes'),
  sumCompound('sub', 'sub', 'sub'), sumCompound('super', 'super', 'super'),
  // prōsum is printed in full on A&G p. 108: prōd- before e.
  { ...sumCompound('prōd', 'prō', 'prō'), source: { work: 'ag', locator: 'A&G §198.a' }, checked: agPrint(108) },
];

/** pot- + sum, with pos- before s and posse, possem from pot-esse, pot-essem (A&G §198.b, p. 109). */
function possumCells(): Cells {
  const cells: Cells = {};
  for (const [key, forms] of Object.entries(sumCells)) {
    if (key === 'fore' || key.startsWith('imperative')) continue;
    cells[key] = forms.filter(form => !form.text.startsWith('for')).map(form => ({
      ...form,
      text: form.text.startsWith('ess') ? `po${form.text.slice(1)}` : form.text.startsWith('s') ? `pos${form.text}` : `pot${form.text}`,
    }));
  }
  return cells;
}

const possum: LatinEntry = {
  present: 'possum', infinitive: 'posse', perfect: ['potuī'], conjugation: 'irregular', stemClass: 'consonant', passive: 'none',
  lacks: ['imperative', 'supineStem', 'gerund'], cells: possumCells(), stems: { presentParticiple: 'pot' },
  source: { work: 'ag', locator: 'A&G §198.b' }, checked: agPrint(109),
};

/** volō, nōlō, mālō (A&G §199, pp. 109–110): no gerund, no supine; only nōlō has an imperative, only mālō no participle. */
const volo: LatinEntry[] = [
  {
    present: 'volō', infinitive: 'velle', perfect: ['voluī'], conjugation: 'irregular', stemClass: 'consonant', passive: 'none',
    lacks: ['imperative', 'supineStem', 'gerund'], stems: { optative: 'vel' },
    cells: {
      ...tense('indicative.present', 'volō vīs vult volumus vultis volunt'),
      ...tense('subjunctive.imperfect', 'vellem vellēs vellet vellēmus vellētis vellent'),
      presentInfinitive: [{ text: 'velle' }],
    },
    source: { work: 'ag', locator: 'A&G §199' }, checked: agPrint(109),
  },
  {
    present: 'nōlō', infinitive: 'nōlle', perfect: ['nōluī'], conjugation: 'irregular', stemClass: 'consonant', passive: 'none',
    lacks: ['supineStem', 'gerund'], stems: { optative: 'nōl' },
    cells: {
      ...tense('indicative.present', 'nōlō nōn·vīs nōn·vult nōlumus nōn·vultis nōlunt'),
      ...tense('subjunctive.imperfect', 'nōllem nōllēs nōllet nōllēmus nōllētis nōllent'),
      ...tense('imperative.present', 'nōlī nōlīte'),
      // A&G prints "nōlītō, etc."; Bennett §130 gives nōlītō, nōlītō, nōlītōte, nōluntō.
      ...tense('imperative.future', 'nōlītō nōlītō nōlītōte nōluntō'),
      presentInfinitive: [{ text: 'nōlle' }],
    },
    source: { work: 'ag', locator: 'A&G §199; Bennett §130' }, checked: agPrint(110),
  },
  {
    present: 'mālō', infinitive: 'mālle', perfect: ['māluī'], conjugation: 'irregular', stemClass: 'consonant', passive: 'none',
    lacks: ['imperative', 'presentParticiple', 'supineStem', 'gerund'], stems: { optative: 'māl' },
    cells: {
      ...tense('indicative.present', 'mālō māvīs māvult mālumus māvultis mālunt'),
      ...tense('subjunctive.imperfect', 'māllem māllēs māllet māllēmus māllētis māllent'),
      presentInfinitive: [{ text: 'mālle' }],
    },
    source: { work: 'ag', locator: 'A&G §199' }, checked: agPrint(109),
  },
];

/** ferō (A&G §200, pp. 110–111): athematic before s, t and r; short imperative fer. Its compounds are listed, not derived. */
function fero(present: string, infinitive: string, perfect: string, supine: string, check: LexiconCheck, locator: string): LatinEntry {
  return {
    present, infinitive, perfect: [perfect], supine: [supine], conjugation: 'irregular', stemClass: 'consonant',
    flags: ['athematic', 'shortImperative'], compound: { prefixes: [] }, source: { work: 'ag', locator }, checked: check,
  };
}

const feroEntries: LatinEntry[] = [
  fero('ferō', 'ferre', 'tulī', 'lātum', agPrint(110), 'A&G §200'),
  ...([
    ['adferō', 'adferre', 'attulī', 'allātum'], ['auferō', 'auferre', 'abstulī', 'ablātum'], ['cōnferō', 'cōnferre', 'contulī', 'collātum'],
    ['differō', 'differre', 'distulī', 'dīlātum'], ['efferō', 'efferre', 'extulī', 'ēlātum'], ['īnferō', 'īnferre', 'intulī', 'illātum'],
    ['offerō', 'offerre', 'obtulī', 'oblātum'], ['referō', 'referre', 'rettulī', 'relātum'], ['sufferō', 'sufferre', 'sustulī', 'sublātum'],
  ] as const).map(([p, i, pf, s]) => fero(p, i, pf, s, agPrint(111), 'A&G §200.a')),
  // Bennett §129 spells the ad- compound assimilated.
  { ...fero('afferō', 'afferre', 'attulī', 'allātum', { url: bennettUrl(129), status: 'secondary' }, 'Bennett §129'), source: { work: 'bennett', locator: 'Bennett §129' } },
];

/**
 * edō 'eat' (A&G §201, p. 112: regular third conjugation with alternative forms from the root, in full-faced type, and
 * an archaic present subjunctive edim). The scan of p. 112 is missing on DCC (AG124.jpg answers 404), so the forms are
 * read from DCC's transcription of that page and Bennett §128; ēssem is Bennett's.
 */
const athematic = (): Omit<LexicalForm, 'text'> => ({ pattern: 'athematic' });
const edo: LatinEntry = {
  present: 'edō', infinitive: 'edere', perfect: ['ēdī'], supine: ['ēsum'], conjugation: 'irregular', stemClass: 'consonant',
  gloss: 'eat', compound: { prefixes: [] },
  cells: {
    ...tense('indicative.present', 'edō edis/ēs edit/ēst edimus editis/ēstis edunt', athematic),
    ...tense('subjunctive.present', 'edam/edim edās/edīs edat/edit edāmus/edīmus edātis/edītis edant/edint', () => ({ usage: 'dated', pattern: 'edim' })),
    ...tense('subjunctive.imperfect', 'ederem/ēssem ederēs/ēssēs ederet/ēsset ederēmus/ēssēmus ederētis/ēssētis ederent/ēssent', athematic),
    ...tense('imperative.present', 'ede/ēs edite/ēste', athematic),
    ...tense('imperative.future', 'editō/ēstō editō/ēstō editōte/ēstōte eduntō', athematic),
    ...tense('indicative.present', '- - editur/ēstur - - -', athematic, 'passive'),
    ...tense('subjunctive.imperfect', '- - ederētur/ēssētur - - -', athematic, 'passive'),
    presentInfinitive: [{ text: 'edere' }, { text: 'ēsse', pattern: 'athematic' }],
  },
  source: { work: 'ag', locator: 'A&G §201; Bennett §128' },
  checked: { url: 'https://dcc.dickinson.edu/grammar/latin/irregular-verbs-fer%C5%8D-and-ed%C5%8D', status: 'ag-text' },
};


/** dō (A&G §202, p. 113): short a everywhere but dās and dā; only the circum-, inter-, satis-… compounds are of the first conjugation. */
const dare: LatinEntry = {
  present: 'dō', infinitive: 'dare', perfect: ['dedī'], supine: ['datum'], conjugation: 'irregular', stemClass: 'a',
  compound: { prefixes: [] },
  cells: { ...tense('indicative.present', '- dās - - - -'), ...tense('imperative.present', 'dā -') },
  source: { work: 'ag', locator: 'A&G §202' }, checked: agPrint(113),
};

/**
 * stō (A&G §209.a, p. 121) and its compounds as the Note lists them: -stitī or -stetī, mostly without a supine; dī-stō
 * and ex-stō have no perfect (ex-stātūrus).
 */
const sto: LatinEntry[] = [
  { present: 'stō', infinitive: 'stāre', perfect: ['stetī'], supine: ['statum'], conjugation: 'first', compound: { prefixes: [] },
    source: { work: 'ag', locator: 'A&G §209.a' }, checked: agPrint(121) },
  ...([
    ['cōnstō', 'cōnstitī', null, 'cōnstātūrus'], ['adstō', 'adstitī', null, null], ['restō', 'restitī', null, null],
    ['antestō', 'antestetī', null, null], ['interstō', 'interstetī', null, null], ['superstō', 'superstetī', null, null],
    ['circumstō', 'circumstetī|circumstitī', null, null], ['praestō', 'praestitī', 'praestitum|praestātum', null],
    ['distō', null, null, null], ['exstō', null, null, 'exstātūrus'],
  ] as const).map(([present, perfect, supine, participle]): LatinEntry => ({
    present, infinitive: `${present.slice(0, -1)}āre`, conjugation: 'first',
    ...(perfect ? { perfect: perfect.split('|') } : {}), ...(supine ? { supine: supine.split('|') } : {}),
    ...(participle ? { futureParticiple: [participle] } : {}),
    lacks: [...(perfect ? [] : ['perfect' as const]), ...(supine ? [] : ['supineStem' as const])],
    compound: { prefixes: [] }, source: { work: 'ag', locator: 'A&G §209.a Note' }, checked: agPrint(121),
  })),
];

const perfectEndings: Readonly<Record<string, string>> = {
  'indicative.perfect': 'ī istī it imus istis ērunt',
  'indicative.pluperfect': 'eram erās erat erāmus erātis erant',
  'indicative.future_perfect': 'erō eris erit erimus eritis erint',
  'subjunctive.perfect': 'erim erīs erit erīmus erītis erint',
  'subjunctive.pluperfect': 'issem issēs isset issēmus issētis issent',
};

/**
 * The perfect system of eō on iī (A&G §203, p. 114: iī (īvī), ieram (īveram), ierō, ierim, īssem (īvissem), īsse
 * (īvisse); note b: the v forms "very rare in the simple verb and unusual in the compounds"; note c: ii before s
 * contracts to ī). The persons A&G does not print follow from these rules.
 */
function eoPerfect(): Cells {
  const cells: Cells = {};
  const contract = (ending: string): string => ending.startsWith('is') ? `ī${ending.slice(1)}` : `i${ending}`;
  const v = (ending: string): LexicalForm => ({ text: `īv${ending}`, usage: 'literary', pattern: 'v' });
  for (const [key, endings] of Object.entries(perfectEndings)) {
    endings.split(' ').forEach((ending, index) => {
      const forms: LexicalForm[] = [{ text: contract(ending) }];
      if (ending === 'ērunt') forms.push({ text: 'iēre', usage: 'literary', pattern: 'ēre' });
      forms.push(v(ending));
      cells[`${key}.active.${finiteSlots[index]!}`] = forms;
    });
  }
  cells.perfectInfinitive = [{ text: 'īsse' }, v('isse')];
  return cells;
}

/** The transitive compounds of eō, inflected in full in the passive (A&G §203.a: adeō, ineō "and some others"). */
const transitiveEo = ['ad', 'in', 'ob', 'praeter', 'sub', 'trāns', 'circum'];

/** eō (A&G §203, pp. 114–115): ī becomes e before a, o, u; ībam, ībō; iēns, euntis; eundum; its passive is impersonal. */
const eo: LatinEntry = {
  present: 'eō', infinitive: 'īre', perfect: ['iī', 'īvī'], supine: ['itum'], conjugation: 'irregular', stemClass: 'i',
  passive: 'impersonal', flags: ['eoRoot'], stems: { presentParticipleOblique: 'eunt', gerund: 'eund' }, cells: eoPerfect(),
  compound: { prefixes: ['ab', 'ad', 'ante', 'circum', 'com', 'ex', 'in', 'inter', 'ob', 'per', 'prae', 'praeter', 'prō', 're', 'sub', 'trāns'] },
  source: { work: 'ag', locator: 'A&G §203' }, checked: agPrint(114),
};

/** The prefixes of eō's compounds that take a personal passive. */
export const transitiveEoPrefixes: ReadonlySet<string> = new Set(transitiveEo);

/** vēneō 'be sold' (vēnum + eō, A&G §§192.b, 203; L&S vēneo, īvi or ii, ītum): active forms, passive meaning. */
const veneo: LatinEntry = {
  ...eo, present: 'vēneō', infinitive: 'vēnīre', perfect: ['vēniī', 'vēnīvī'], supine: ['vēnitum'], passive: 'none', gloss: 'be sold',
  stems: { presentParticipleOblique: 'vēneunt', gerund: 'vēneund' },
  cells: Object.fromEntries(Object.entries(eoPerfect()).map(([key, forms]) => [key, forms.map(form => ({ ...form, text: `vēn${form.text}` }))])),
  compound: { prefixes: [] }, source: { work: 'ag', locator: 'A&G §§192.b, 203' }, checked: agPrint(114),
};

/** ambiō is a regular fourth-conjugation verb (A&G §203.d, p. 115), not a compound of eō. */
const ambio: LatinEntry = {
  present: 'ambiō', infinitive: 'ambīre', perfect: ['ambīvī'], supine: ['ambītum'], conjugation: 'fourth', compound: { prefixes: [] },
  source: { work: 'ag', locator: 'A&G §203.d' }, checked: agPrint(115),
};

/**
 * queō, nequeō (A&G §206.d, p. 118: conjugated like eō; the imperative, gerund and supine are wanting; the passive
 * forms are not classical).
 */
const queo: LatinEntry[] = (['qu', 'nequ'] as const).map(stem => ({
  present: `${stem}eō`, infinitive: `${stem}īre`, perfect: [`${stem}īvī`], conjugation: 'irregular', stemClass: 'i', passive: 'none',
  flags: ['eoRoot'], lacks: ['imperative', 'gerund', 'supineStem'], stems: { presentParticipleOblique: `${stem}eunt` },
  compound: { prefixes: [] }, source: { work: 'ag', locator: 'A&G §206.d' }, checked: agPrint(118),
}));

/**
 * fīō (A&G §204, p. 115): regular of the fourth conjugation, but fierem and fierī; the bracketed fīmus, fītis and
 * imperatives are "not used in good prose"; the perfect system is factus sum; gerundive faciendus; no present or
 * future participle, gerund or supine of its own; future infinitive factum īrī.
 */
const dated = (): Omit<LexicalForm, 'text'> => ({ usage: 'dated' });
const fio: LatinEntry = {
  present: 'fīō', infinitive: 'fierī', supine: ['factum'], conjugation: 'irregular', stemClass: 'i', passive: 'none',
  flags: ['longBeforeVowel'], lacks: ['presentParticiple', 'futureParticiple', 'gerund', 'supine'], stems: { present: 'fī', gerund: 'faciend' },
  cells: {
    ...tense('indicative.present', 'fīō fīs fit ~fīmus ~fītis fīunt', dated),
    ...tense('subjunctive.imperfect', 'fierem fierēs fieret fierēmus fierētis fierent'),
    ...tense('imperative.present', '~fī ~fīte', dated),
    ...tense('imperative.future', '~fītō ~fītō - -', dated),
    presentInfinitive: [{ text: 'fierī' }],
  },
  compound: { prefixes: [] }, source: { work: 'ag', locator: 'A&G §204' }, checked: agPrint(115),
};

/** coepī, ōdī, meminī (A&G §205, p. 116): only the perfect system; mementō, mementōte; coeptūrus, ōsūrus. */
const defectives: LatinEntry[] = [
  { present: null, infinitive: 'coepisse', perfect: ['coepī'], supine: ['coeptum'], conjugation: 'irregular', stemClass: 'consonant',
    passive: 'none', lacks: ['present'], compound: { prefixes: [] }, source: { work: 'ag', locator: 'A&G §205' }, checked: agPrint(116) },
  { present: null, infinitive: 'ōdisse', perfect: ['ōdī'], supine: ['ōsum'], conjugation: 'irregular', stemClass: 'consonant',
    passive: 'none', lacks: ['present'], compound: { prefixes: [] }, source: { work: 'ag', locator: 'A&G §205' }, checked: agPrint(116) },
  { present: null, infinitive: 'meminisse', perfect: ['meminī'], conjugation: 'irregular', stemClass: 'consonant', passive: 'none',
    lacks: ['present', 'supineStem'], cells: tense('imperative.future', 'mementō - mementōte -'), compound: { prefixes: [] },
    source: { work: 'ag', locator: 'A&G §205' }, checked: agPrint(116) },
];

/**
 * Impersonal verbs (A&G §§207–208, pp. 119–120): only the third person singular. A&G prints the perfect of licet
 * only; the other perfects are Bennett's (§138), and a verb neither prints a perfect for has none here.
 */
function impersonal(third: string, infinitive: string, conjugation: 'first' | 'second' | 'third', perfect: string | null, bennett: boolean): LatinEntry {
  return {
    present: third, infinitive, conjugation, impersonal: true, passive: 'none',
    ...(perfect ? { perfect: [perfect] } : {}),
    lacks: [...(perfect ? [] : ['perfect' as const]), 'imperative', 'supineStem'],
    compound: { prefixes: [] },
    source: bennett ? { work: 'bennett', locator: 'A&G §208; Bennett §138' } : { work: 'ag', locator: 'A&G §207' },
    checked: bennett ? { url: bennettUrl(138), status: 'secondary' } : agPrint(119),
  };
}

const impersonals: LatinEntry[] = [
  impersonal('licet', 'licēre', 'second', 'licuit', false),
  impersonal('oportet', 'oportēre', 'second', 'oportuit', true), impersonal('decet', 'decēre', 'second', 'decuit', true),
  impersonal('libet', 'libēre', 'second', 'libuit', true), impersonal('piget', 'pigēre', 'second', 'piguit', true),
  impersonal('pudet', 'pudēre', 'second', 'puduit', true), impersonal('paenitet', 'paenitēre', 'second', 'paenituit', true),
  impersonal('taedet', 'taedēre', 'second', 'taeduit', true), impersonal('miseret', 'miserēre', 'second', 'miseruit', true),
  impersonal('pluit', 'pluere', 'third', 'pluit', true), impersonal('ningit', 'ningere', 'third', 'ninxit', true),
  impersonal('tonat', 'tonāre', 'first', 'tonuit', true), impersonal('grandinat', 'grandināre', 'first', null, true),
  impersonal('fulgurat', 'fulgurāre', 'first', null, false), impersonal('rōrat', 'rōrāre', 'first', null, false),
  impersonal('vesperāscit', 'vesperāscere', 'third', null, false), impersonal('lūcīscit', 'lūcīscere', 'third', null, false),
];

export const irregularEntries: readonly LatinEntry[] = [
  sum, ...sumCompounds, possum, ...volo, ...feroEntries, edo, dare, ...sto, eo, veneo, ambio, ...queo, fio, ...defectives, ...impersonals,
];
