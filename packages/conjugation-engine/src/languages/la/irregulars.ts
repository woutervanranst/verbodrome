/**
 * Irregular, defective and impersonal verbs (GD §5.2), transcribed from the 1903 A&G scans (pp. 81–83, 108–121) and
 * Bennett, with Lewis & Short where A&G is silent. Only words no rule derives are whole-word cells (`la.lex.cell`); a
 * regular word is always derived by the stages, never stored beside an irregular one.
 */
import type { LatinEntry, LexicalForm, LexiconCheck } from './entries.js';
import { agScan, bennettUrl, lsUrl } from './entries.js';

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
const lsRead = (lemma: string): LexiconCheck => ({ url: lsUrl(lemma), status: 'ls' });

/** A&G §170 note a: forem is used for essem, but not in the compound tenses; the clause reads this mark. */
export const foremMark = 'forem';

/** The present system of sum (A&G §170, pp. 81–83), all whole words: no rule derives sum from a stem. */
export const sumCells: Cells = {
  ...tense('indicative.present', 'sum es est sumus estis sunt'),
  ...tense('indicative.imperfect', 'eram erās erat erāmus erātis erant'),
  ...tense('indicative.future', 'erō eris erit erimus eritis erunt'),
  ...tense('subjunctive.present', 'sim sīs sit sīmus sītis sint'),
  ...tense('subjunctive.imperfect', 'essem/forem essēs/forēs esset/foret essēmus essētis essent/forent', () => ({ marks: [foremMark] })),
  ...tense('imperative.present', 'es este'),
  ...tense('imperative.future', 'estō estō estōte suntō'),
  presentInfinitive: [{ text: 'esse' }],
  fore: [{ text: 'fore' }],
};

/** A&G §170, pp. 81–83: no gerund, no supine, no participle but the future; forem and fore beside essem and futūrus esse. */
const sum: LatinEntry = {
  present: 'sum', infinitive: 'esse', perfect: ['fuī'], futureParticiple: ['futūrus'], conjugation: 'irregular', stemClass: 'consonant',
  passive: 'none', lacks: ['presentParticiple', 'supineStem', 'gerund'], cells: sumCells, flags: ['fore'], compound: { prefixes: [] },
  source: { work: 'ag', locator: 'A&G §170' }, checked: agPrint(82),
};

/**
 * The compounds of sum (A&G §198: ab, ad, dē, in, inter, ob, prae, prō, sub, super, "without any change of inflection";
 * perfects and the participles absēns, praesēns from Bennett §125). Their present system is sum's forms behind the
 * prefix (`la.lex.sum-compound`): `vowel` before a form of sum that starts with a vowel, `consonant` before the others.
 */
function sumCompound(vowel: string, consonant: string, perfect: string, participle?: string, spellings?: readonly string[]): LatinEntry {
  return {
    present: `${consonant}sum`, infinitive: `${vowel}esse`, perfect: [`${perfect}fuī`], futureParticiple: [`${perfect}futūrus`],
    conjugation: 'irregular', stemClass: 'consonant', passive: 'none', sumCompound: { vowel, consonant },
    lacks: [...(participle ? [] : ['presentParticiple' as const]), 'supineStem', 'gerund'],
    ...(participle ? { stems: { presentParticiple: participle } } : {}), ...(spellings ? { spellings } : {}),
    compound: { prefixes: [] },
    source: { work: 'bennett', locator: 'A&G §198; Bennett §125' }, checked: { url: bennettUrl(125), status: 'secondary' },
  };
}

const sumCompounds: LatinEntry[] = [
  sumCompound('ab', 'ab', 'ā', 'abs'), sumCompound('ad', 'ad', 'ad'), sumCompound('de', 'dē', 'dē', undefined, ['dēesse']),
  sumCompound('in', 'īn', 'īn'), sumCompound('inter', 'inter', 'inter'), sumCompound('ob', 'ob', 'ob'),
  sumCompound('prae', 'prae', 'prae', 'praes'), sumCompound('sub', 'sub', 'sub'), sumCompound('super', 'super', 'super'),
  // prōsum is printed in full on A&G p. 108: prōd- before e.
  { ...sumCompound('prōd', 'prō', 'prō'), source: { work: 'ag', locator: 'A&G §198.a' }, checked: agPrint(108) },
];

/** possum: pot- + sum (A&G §198.b, p. 109): no imperative, gerund or supine; potēns is an adjective. */
const possum: LatinEntry = {
  present: 'possum', infinitive: 'posse', perfect: ['potuī'], conjugation: 'irregular', stemClass: 'consonant', passive: 'none',
  sumCompound: { vowel: 'pot', consonant: 'pos', pot: true },
  lacks: ['imperative', 'supineStem', 'gerund'], stems: { presentParticiple: 'pot' }, compound: { prefixes: [] },
  source: { work: 'ag', locator: 'A&G §198.b' }, checked: agPrint(109),
};

/** volō, nōlō, mālō (A&G §199, pp. 109–110): no gerund, no supine; only nōlō has an imperative, only mālō no participle. */
const volo: LatinEntry[] = [
  {
    present: 'volō', infinitive: 'velle', perfect: ['voluī'], conjugation: 'irregular', stemClass: 'consonant', passive: 'none',
    lacks: ['imperative', 'supineStem', 'gerund'], stems: { optative: 'vel' }, compound: { prefixes: [] },
    cells: {
      ...tense('indicative.present', 'volō vīs vult volumus vultis volunt'),
      ...tense('subjunctive.imperfect', 'vellem vellēs vellet vellēmus vellētis vellent'),
      presentInfinitive: [{ text: 'velle' }],
    },
    source: { work: 'ag', locator: 'A&G §199' }, checked: agPrint(109),
  },
  {
    present: 'nōlō', infinitive: 'nōlle', perfect: ['nōluī'], conjugation: 'irregular', stemClass: 'consonant', passive: 'none',
    lacks: ['supineStem', 'gerund'], stems: { optative: 'nōl' }, compound: { prefixes: [] },
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
    lacks: ['imperative', 'presentParticiple', 'supineStem', 'gerund'], stems: { optative: 'māl' }, compound: { prefixes: [] },
    cells: {
      ...tense('indicative.present', 'mālō māvīs māvult mālumus māvultis mālunt'),
      ...tense('subjunctive.imperfect', 'māllem māllēs māllet māllēmus māllētis māllent'),
      presentInfinitive: [{ text: 'mālle' }],
    },
    source: { work: 'ag', locator: 'A&G §199' }, checked: agPrint(109),
  },
];

/**
 * ferō (A&G §200, pp. 110–111): athematic before s, t and r; short imperative fer. Its compounds are a family
 * ("conjugated like the simple verb", §200.a) with their own perfect and supine where the prefix changes: the nine of
 * the §200.a table, and trāns-, prae-, per-, prō-, dē-, circum- from Lewis & Short. Another prefix is assumed to
 * follow tulī, lātum (an assumption step).
 */
const fero: LatinEntry = {
  present: 'ferō', infinitive: 'ferre', perfect: ['tulī'], supine: ['lātum'], conjugation: 'irregular', stemClass: 'consonant',
  flags: ['athematic', 'shortImperative'],
  compound: {
    assumeUnlisted: true,
    overrides: {
      ad: { perfect: ['attulī'], supine: ['allātum'] }, ab: { perfect: ['abstulī'], supine: ['ablātum'] },
      com: { perfect: ['contulī'], supine: ['collātum'] }, dis: { perfect: ['distulī'], supine: ['dīlātum'] },
      ex: { perfect: ['extulī'], supine: ['ēlātum'] }, in: { perfect: ['intulī'], supine: ['illātum'] },
      ob: { perfect: ['obtulī'], supine: ['oblātum'] }, re: { perfect: ['rettulī'], supine: ['relātum'] },
      sub: { perfect: ['sustulī'], supine: ['sublātum'] },
      trāns: { perfect: ['trānstulī'], supine: ['trānslātum', 'trālātum'] }, prae: { perfect: ['praetulī'], supine: ['praelātum'] },
      per: { perfect: ['pertulī'], supine: ['perlātum'] }, prō: { perfect: ['prōtulī'], supine: ['prōlātum'] },
      dē: { perfect: ['dētulī'], supine: ['dēlātum'] }, circum: { perfect: ['circumtulī'], supine: ['circumlātum'] },
    },
  },
  source: { work: 'ag', locator: 'A&G §200, §200.a; L&S s.v. transfero, praefero, perfero, profero, defero, circumfero' }, checked: agPrint(110),
};

/**
 * edō 'eat' (A&G §201, p. 112): regular of the third conjugation, with alternative forms from the root ēd- (ēs, ēst,
 * ēsse …, in full-faced type) and an archaic subjunctive edim; only those are listed, beside the derived forms. The
 * scan of p. 112 is missing on DCC (AG124.jpg answers 404): the forms are read from DCC's transcription of that page
 * and Bennett §128; ēssem is Bennett's.
 */
const athematic = (): Omit<LexicalForm, 'text'> => ({ pattern: 'athematic' });
const edo: LatinEntry = {
  present: 'edō', infinitive: 'edere', perfect: ['ēdī'], supine: ['ēsum'], conjugation: 'irregular', stemClass: 'consonant',
  gloss: 'eat', compound: { prefixes: [] }, cellsBeside: true,
  cells: {
    ...tense('indicative.present', '- ~ēs ~ēst - ~ēstis -', athematic),
    ...tense('subjunctive.present', '~edim ~edīs ~edit ~edīmus ~edītis ~edint', () => ({ usage: 'dated', pattern: 'edim' })),
    ...tense('subjunctive.imperfect', '~ēssem ~ēssēs ~ēsset ~ēssēmus ~ēssētis ~ēssent', athematic),
    ...tense('imperative.present', '~ēs ~ēste', athematic),
    ...tense('imperative.future', '~ēstō ~ēstō ~ēstōte -', athematic),
    ...tense('indicative.present', '- - ~ēstur - - -', athematic, 'passive'),
    ...tense('subjunctive.imperfect', '- - ~ēssētur - - -', athematic, 'passive'),
    presentInfinitive: [{ text: 'ēsse', pattern: 'athematic' }],
  },
  source: { work: 'ag', locator: 'A&G §201; Bennett §128' },
  checked: { url: 'https://dcc.dickinson.edu/grammar/latin/irregular-verbs-fer%C5%8D-and-ed%C5%8D', status: 'ag-text' },
};

/**
 * dō (A&G §202, p. 113): short a everywhere but dās and dā; the 1sg present passive and present subjunctive passive
 * are printed "—". Its first-conjugation compounds circum-, inter-, pessum-, satis-, super-, vēnum-dō (§209.a Note)
 * are listed; the other compounds are the -dō verbs of the third conjugation (abdō, reddō …).
 */
function dareEntry(prefix: string, check: LexiconCheck, locator: string): LatinEntry {
  return {
    present: `${prefix}dō`, infinitive: `${prefix}dare`, perfect: [`${prefix}dedī`], supine: [`${prefix}datum`],
    conjugation: 'irregular', stemClass: 'a', compound: { prefixes: [] },
    cells: { ...tense('indicative.present', `- ${prefix}dās - - - -`), ...tense('imperative.present', `${prefix}dā -`) },
    notAttested: ['indicative.present.passive.1s', 'subjunctive.present.passive.1s'],
    source: { work: check.status === 'ls' ? 'ls' : 'ag', locator }, checked: check,
  };
}

const dare: LatinEntry[] = [
  dareEntry('', agPrint(113), 'A&G §202'),
  dareEntry('circum', lsRead('circumdo'), 'A&G §209.a Note; L&S s.v. circumdo'),
  dareEntry('super', lsRead('superdo'), 'A&G §209.a Note; L&S s.v. superdo'),
  dareEntry('vēnum', lsRead('venumdo'), 'A&G §209.a Note; L&S s.v. venumdo'),
  dareEntry('inter', agPrint(121), 'A&G §209.a Note'),
  dareEntry('pessum', agPrint(121), 'A&G §209.a Note'),
  dareEntry('satis', agPrint(121), 'A&G §209.a Note'),
];

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

/** The transitive compounds of eō, inflected in full in the passive (A&G §203.a: adeō, ineō "and some others"). */
const transitiveEo = ['ad', 'in', 'ob', 'praeter', 'sub', 'trāns', 'circum'];

/** The prefixes of eō's compounds that take a personal passive. */
export const transitiveEoPrefixes: ReadonlySet<string> = new Set(transitiveEo);

/**
 * eō (A&G §203, pp. 114–115): ī becomes e before a, o, u; ībam, ībō; iēns, euntis; eundum; its passive is impersonal.
 * The perfect stem is i- (iī), with īv- (īvī) "very rare in the simple verb and unusual in the compounds" (note b);
 * ii before s contracts to ī (note c: īstī, īsse), a rule of the perfect system (`la.orth.ii-contraction`).
 */
const eo: LatinEntry = {
  present: 'eō', infinitive: 'īre', perfect: ['iī', 'īvī'], supine: ['itum'], conjugation: 'irregular', stemClass: 'i',
  passive: 'impersonal', flags: ['eoRoot'], stems: { presentParticipleOblique: 'eunt', gerund: 'eund' }, alternativeUsage: 'literary',
  compound: { prefixes: ['ab', 'ad', 'ante', 'circum', 'com', 'ex', 'in', 'inter', 'ob', 'per', 'prae', 'praeter', 'prō', 're', 'sub', 'trāns'] },
  source: { work: 'ag', locator: 'A&G §203' }, checked: agPrint(114),
};

/** vēneō 'be sold' (vēnum + eō, A&G §§192.b, 203; L&S vēneo, īvi or ii, ītum): active forms, passive meaning. */
const veneo: LatinEntry = {
  ...eo, present: 'vēneō', infinitive: 'vēnīre', perfect: ['vēniī', 'vēnīvī'], supine: ['vēnitum'], passive: 'none', gloss: 'be sold',
  stems: { presentParticipleOblique: 'vēneunt', gerund: 'vēneund' },
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
 * fīō (A&G §204, p. 115): "regular of the fourth conjugation, but the subjunctive imperfect is fierem, and the
 * infinitive fierī"; the bracketed fīmus, fītis and imperatives fī, fīte, fītō are "not used in good prose" (dated),
 * and no plural future imperative is printed. The perfect system is factus sum; gerundive faciendus; no present or
 * future participle, gerund or supine of its own; future infinitive factum īrī.
 */
const fio: LatinEntry = {
  present: 'fīō', infinitive: 'fierī', supine: ['factum'], conjugation: 'irregular', stemClass: 'i', passive: 'none',
  flags: ['longBeforeVowel'], lacks: ['presentParticiple', 'futureParticiple', 'gerund', 'supine'], stems: { present: 'fī', gerund: 'faciend' },
  cells: {
    ...tense('subjunctive.imperfect', 'fierem fierēs fieret fierēmus fierētis fierent'),
    presentInfinitive: [{ text: 'fierī' }],
  },
  dated: ['indicative.present.active.1p', 'indicative.present.active.2p', 'imperative.present.active.2s', 'imperative.present.active.2p',
    'imperative.future.active.2s', 'imperative.future.active.3s'],
  notAttested: ['imperative.future.active.2p', 'imperative.future.active.3p'],
  compound: { prefixes: [] }, source: { work: 'ag', locator: 'A&G §204' }, checked: agPrint(115),
};

/**
 * coepī, ōdī, meminī (A&G §205, p. 116): only the perfect system; mementō, mementōte; coeptūrus, coeptus, ōsūrus, ōsus;
 * no supine of their own. nōvī (from nōscō) is used the same way with a present meaning (§205 Note 2; L&S nosco).
 */
const defectives: LatinEntry[] = [
  { present: null, infinitive: 'coepisse', perfect: ['coepī'], supine: ['coeptum'], conjugation: 'irregular', stemClass: 'consonant',
    passive: 'none', lacks: ['present', 'supine'], compound: { prefixes: [] }, source: { work: 'ag', locator: 'A&G §205' }, checked: agPrint(116) },
  { present: null, infinitive: 'ōdisse', perfect: ['ōdī'], supine: ['ōsum'], conjugation: 'irregular', stemClass: 'consonant',
    passive: 'none', lacks: ['present', 'supine'], compound: { prefixes: [] }, source: { work: 'ag', locator: 'A&G §205' }, checked: agPrint(116) },
  { present: null, infinitive: 'meminisse', perfect: ['meminī'], conjugation: 'irregular', stemClass: 'consonant', passive: 'none',
    lacks: ['present', 'supineStem'], cells: tense('imperative.future', 'mementō - mementōte -'), compound: { prefixes: [] },
    source: { work: 'ag', locator: 'A&G §205' }, checked: agPrint(116) },
  { present: null, infinitive: 'nōvisse', perfect: ['nōvī'], supine: ['nōtum'], conjugation: 'irregular', stemClass: 'consonant',
    passive: 'none', lacks: ['present', 'supine'], gloss: 'know (perfect of nōscō)', compound: { prefixes: [] },
    source: { work: 'ag', locator: 'A&G §205 Note 2; L&S s.v. nosco' }, checked: agPrint(116) },
];

/**
 * Verbs of which only some forms occur (A&G §206, pp. 117–119; L&S, each entry printing the forms in use). Only the
 * printed forms exist (`attested`); everything else is reported as not attested. āiō, inquam, quaesō and cedo have no
 * infinitive: they are looked up by the form A&G heads them with.
 */
const sparse: LatinEntry[] = [
  {
    present: 'āiō', infinitive: 'āiō', conjugation: 'irregular', stemClass: 'consonant', passive: 'none',
    lacks: ['perfect', 'supineStem'], stems: { presentParticiple: 'āi' }, compound: { prefixes: [] },
    cells: {
      ...tense('indicative.present', 'āiō ais ait - - āiunt'),
      ...tense('indicative.imperfect', 'āiēbam āiēbās āiēbat āiēbāmus āiēbātis āiēbant'),
      ...tense('subjunctive.present', '- āiās āiat - - āiant'),
      ...tense('imperative.present', 'aī -'),
    },
    attested: ['indicative.present.active.1s', 'indicative.present.active.2s', 'indicative.present.active.3s', 'indicative.present.active.3p',
      ...['1s', '2s', '3s', '1p', '2p', '3p'].map(slot => `indicative.imperfect.active.${slot}`),
      'subjunctive.present.active.2s', 'subjunctive.present.active.3s', 'subjunctive.present.active.3p', 'imperative.present.active.2s',
      'participle.present'],
    source: { work: 'ag', locator: 'A&G §206.a; L&S s.v. aio' }, checked: agPrint(117),
  },
  {
    present: 'inquam', infinitive: 'inquam', conjugation: 'irregular', stemClass: 'consonant', passive: 'none',
    lacks: ['supineStem'], compound: { prefixes: [] },
    cells: {
      ...tense('indicative.present', 'inquam inquis inquit inquimus ~inquitis inquiunt', () => ({ pattern: 'late' })),
      ...tense('indicative.imperfect', '- - inquiēbat - - -'),
      ...tense('indicative.future', '- inquiēs inquiet - - -'),
      ...tense('indicative.perfect', 'inquiī inquīstī - - - -'),
      ...tense('imperative.present', 'inque -'),
      ...tense('imperative.future', 'inquitō - - -'),
    },
    attested: [...['1s', '2s', '3s', '1p', '2p', '3p'].map(slot => `indicative.present.active.${slot}`), 'indicative.imperfect.active.3s',
      'indicative.future.active.2s', 'indicative.future.active.3s', 'indicative.perfect.active.1s', 'indicative.perfect.active.2s',
      'imperative.present.active.2s', 'imperative.future.active.2s'],
    source: { work: 'ag', locator: 'A&G §206.b; L&S s.v. inquam' }, checked: agPrint(117),
  },
  {
    present: 'for', infinitive: 'fārī', supine: ['fātum'], conjugation: 'first', voice: 'deponent', compound: { prefixes: [] },
    attested: ['indicative.present.active.3s', 'indicative.present.active.3p', 'indicative.future.active.1s', 'indicative.future.active.3s',
      'indicative.perfect.active.3s', 'indicative.perfect.active.3p', 'indicative.pluperfect.active.1s', 'indicative.pluperfect.active.3s',
      'imperative.present.active.2s', 'infinitive.present.active', 'participle.present', 'participle.perfect', 'participle.gerundive',
      'gerund.present', 'supine.present'],
    attestedCases: { gerund: ['genitive', 'ablative'], supine: ['ablative'] },
    source: { work: 'ag', locator: 'A&G §206.c; L&S s.v. for' }, checked: agPrint(117),
  },
  {
    present: 'quaesō', infinitive: 'quaesō', conjugation: 'irregular', stemClass: 'consonant', passive: 'none', lacks: ['supineStem'],
    compound: { prefixes: [] }, cells: tense('indicative.present', 'quaesō - - quaesumus - -'),
    attested: ['indicative.present.active.1s', 'indicative.present.active.1p'],
    source: { work: 'ag', locator: 'A&G §206.e; L&S s.v. quaeso' }, checked: agPrint(119),
  },
  {
    present: null, infinitive: 'cedo', conjugation: 'irregular', stemClass: 'consonant', passive: 'none', lacks: ['supineStem', 'present'],
    compound: { prefixes: [] }, gloss: 'give (here)!',
    cells: tense('imperative.present', 'cedo cedite/cette', () => ({ pattern: 'cette' })),
    attested: ['imperative.present.active.2s', 'imperative.present.active.2p'],
    source: { work: 'ag', locator: 'A&G §206.g; L&S s.v. cedo (2)' }, checked: agPrint(119),
  },
  {
    present: 'salveō', infinitive: 'salvēre', conjugation: 'second', passive: 'none', lacks: ['perfect', 'supineStem'], compound: { prefixes: [] },
    attested: ['imperative.present.active.2s', 'imperative.present.active.2p', 'imperative.future.active.2s', 'infinitive.present.active',
      'indicative.present.active.1s', 'indicative.present.active.2p', 'indicative.future.active.2s'],
    source: { work: 'ag', locator: 'A&G §206.g; L&S s.v. salveo' }, checked: agPrint(119),
  },
  {
    present: 'aveō', infinitive: 'avēre', conjugation: 'second', passive: 'none', lacks: ['perfect', 'supineStem'], compound: { prefixes: [] },
    gloss: 'fare well (a greeting)', cellsBeside: true, cells: tense('imperative.present', '~havē -', () => ({ pattern: 'havē' })),
    attested: ['imperative.present.active.2s', 'imperative.present.active.2p', 'imperative.future.active.2s', 'infinitive.present.active'],
    source: { work: 'ag', locator: 'A&G §206.g; L&S s.v. aveo (2)' }, checked: agPrint(119),
  },
];

/**
 * Impersonal verbs (A&G §§207–208, pp. 119–120): only the third person singular, the infinitives and what the grammar
 * prints. `perfect` is the third person singular as printed (licuit), from which the perfect stem is taken. A&G prints
 * the perfect of licet only (licuit, -itum est; licitūrum esse); the other perfects are Bennett's (§138), and §208.b–c
 * Notes add libitum est, pigitum est, paenitūrus, paenitendus, pudendus.
 */
function impersonal(third: string, infinitive: string, conjugation: 'first' | 'second' | 'third', perfect: string | null, bennett: boolean, extra: Partial<LatinEntry> = {}): LatinEntry {
  return {
    present: third, infinitive, conjugation, impersonal: true, passive: 'none',
    ...(perfect ? { perfect: [perfect] } : {}),
    lacks: [...(perfect ? [] : ['perfect' as const]), 'imperative', 'presentParticiple', 'gerund', 'supine', ...(extra.supine ? [] : ['supineStem' as const])],
    compound: { prefixes: [] },
    source: bennett ? { work: 'bennett', locator: 'A&G §208; Bennett §138' } : { work: 'ag', locator: 'A&G §§207–208' },
    checked: bennett ? { url: bennettUrl(138), status: 'secondary' } : agPrint(119),
    ...extra,
  };
}

const passiveForm = (text: string): Partial<LatinEntry> => ({ cellsBeside: true, cells: { 'indicative.perfect.active.3s': [{ text, pattern: 'passive-form' }] } });

const impersonals: LatinEntry[] = [
  impersonal('licet', 'licēre', 'second', 'licuit', false, { supine: ['licitum'], ...passiveForm('licitum est') }),
  impersonal('oportet', 'oportēre', 'second', 'oportuit', true), impersonal('decet', 'decēre', 'second', 'decuit', true),
  impersonal('libet', 'libēre', 'second', 'libuit', true, passiveForm('libitum est')),
  impersonal('piget', 'pigēre', 'second', 'piguit', true, passiveForm('pigitum est')),
  impersonal('pudet', 'pudēre', 'second', 'puduit', true, { stems: { gerund: 'pudend' } }),
  impersonal('paenitet', 'paenitēre', 'second', 'paenituit', true, { stems: { gerund: 'paenitend' }, futureParticiple: ['paenitūrus'] }),
  impersonal('taedet', 'taedēre', 'second', 'taeduit', true), impersonal('miseret', 'miserēre', 'second', 'miseruit', true),
  impersonal('pluit', 'pluere', 'third', 'pluit', true), impersonal('ningit', 'ningere', 'third', 'ninxit', true),
  impersonal('tonat', 'tonāre', 'first', 'tonuit', true, { gloss: 'it thunders' }), impersonal('grandinat', 'grandināre', 'first', null, true),
  impersonal('fulgurat', 'fulgurāre', 'first', null, false), impersonal('rōrat', 'rōrāre', 'first', null, false),
  impersonal('vesperāscit', 'vesperāscere', 'third', null, false), impersonal('lūcīscit', 'lūcīscere', 'third', null, false),
];

export const irregularEntries: readonly LatinEntry[] = [
  sum, ...sumCompounds, possum, ...volo, fero, edo, ...dare, ...sto, eo, veneo, ambio, ...queo, fio, ...defectives, ...sparse, ...impersonals,
];
