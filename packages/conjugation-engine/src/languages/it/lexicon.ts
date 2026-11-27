import type { LexemeBase } from '../../core/grammar.js';

/** The six persons of a finite tense, singular 1-2-3 then plural 1-2-3. */
export const slots = ['1sg', '2sg', '3sg', '1pl', '2pl', '3pl'] as const;
export type Slot = typeof slots[number];

/** A whole word the lexicon gives for a cell, with its usage when it is not standard. */
export interface WholeForm { readonly text: string; readonly usage?: 'literary' | 'dated' }

/**
 * How the passato remoto of a verb is formed in the persons stressed on the stem (io, lui/lei, loro), in the order the
 * Vocabolario prints them: `=presi` is a strong form (its io form), `ei` and `etti` the two weak series of -ere verbs,
 * `weak` the weak forms of -are and -ire verbs.
 */
export type PastSeries = 'ei' | 'etti' | 'weak' | `=${string}`;

export type EntryFlag = 'noImperative' | 'impersonal' | 'palatal' | 'stressedI' | 'imperative2plSubjunctive';

export interface Auxiliary { readonly lemma: 'avere' | 'essere'; readonly condition?: string }

/**
 * What the lexicon knows of a verb (grammar design §5.1). Stems are given without their endings; every form is spelled
 * without the Vocabolario's pronunciation accents. Only what differs from the regular conjugation is stored. Where the
 * Vocabolario prints a regular form beside an irregular one, a list holds `*` in its place (and `*isc` for the -isc- stem):
 * the regular form is then derived by the rules, never stored (vedere: participle `['visto', '*']`, visto and veduto).
 */
export interface ItalianEntry {
  readonly class: 'are' | 'ere' | 'ire' | 'contracted' | 'irregular';
  /** The long stem of a shortened infinitive (fare: fac). */
  readonly long?: string;
  /** -ire verbs: with -isc- (yes), without (no), or both paradigms; a listed -ire verb without it is 'no'. */
  readonly isc?: 'yes' | 'no' | 'both';
  /** For `isc: 'both'`: the Vocabolario prints the -isc- forms first. */
  readonly iscFirst?: boolean;
  /** Lexical present stems by person, in the Vocabolario's order (venire: veng, vien). */
  readonly present?: Partial<Record<Slot, readonly string[]>>;
  /** The stems used where the ending is stressed, when the Vocabolario gives two (cuocere: cuoc, coc). */
  readonly unstressed?: readonly string[];
  /** The present-subjunctive stems of io, tu, lui/lei and loro when they do not come from io (sapere: sappi). */
  readonly subjunctive?: readonly string[];
  /** Strong passato remoto, io form (prendere: presi). */
  readonly past?: readonly string[];
  /** The passato remoto series in the Vocabolario's order, when there is more than one or it is not the default. */
  readonly pastSeries?: readonly PastSeries[];
  /** Past participle, masculine singular, preferred first (vedere: visto, veduto). */
  readonly participle?: readonly string[];
  /** Future and conditional stems with their r, preferred first (morire: morir, morr). */
  readonly future?: readonly string[];
  /** Present participle forms; null: the verb has none. */
  readonly presentParticiple?: readonly string[] | null;
  /** Whole words, keyed `mood.tense.person.number`. */
  readonly cells?: Readonly<Record<string, readonly WholeForm[]>>;
  /** The perfect auxiliaries in the Vocabolario's order, with when each applies. Absent: not stated. */
  readonly auxiliaries?: readonly Auxiliary[];
  readonly flags?: readonly EntryFlag[];
  /** Targets the verb lacks, `mood.tense`. */
  readonly defective?: readonly string[];
  /** The usage of a form named by its full text (essente: literary). */
  readonly usage?: Readonly<Record<string, 'literary' | 'dated'>>;
  /** Cells a derived verb does not take over from this one (dire: di' is not predi'). */
  readonly familyDrops?: readonly string[];
}

type Forms = string | WholeForm | readonly (string | WholeForm)[] | null;

const whole = (forms: Forms): readonly WholeForm[] =>
  (forms === null ? [] : Array.isArray(forms) ? forms : [forms]).map(form => typeof form === 'string' ? { text: form } : form);

const keyOf = (prefix: string, slot: Slot): string =>
  `${prefix}.${slot.charAt(0)}.${slot.endsWith('sg') ? 'singular' : 'plural'}`;

/** The cells of one tense, person by person; null leaves a person to the rules. */
function tense(prefix: string, forms: readonly [Forms, Forms, Forms, Forms, Forms, Forms]): Record<string, readonly WholeForm[]> {
  return Object.fromEntries(slots.flatMap((slot, index) => forms[index] === null ? [] : [[keyOf(prefix, slot), whole(forms[index]!)]]));
}

/** One cell. */
function cell(prefix: string, slot: Slot, forms: Forms): Record<string, readonly WholeForm[]> {
  return { [keyOf(prefix, slot)]: whole(forms) };
}

const avere: Auxiliary = { lemma: 'avere' };
const essere: Auxiliary = { lemma: 'essere' };
const transitive = { lemma: 'avere', condition: 'transitive use, with a direct object' } as const;
const intransitive = { lemma: 'essere', condition: 'intransitive use' } as const;
const servile = [
  { lemma: 'avere', condition: 'alone, or with an infinitive that takes avere' },
  { lemma: 'essere', condition: 'with an infinitive that takes essere' },
] as const;
const stressed = (stems: readonly string[]): Partial<Record<Slot, readonly string[]>> =>
  ({ '1sg': stems, '2sg': stems, '3sg': stems, '3pl': stems });

/**
 * The irregular verbs (grammar design §5.2), each checked against the header of its Treccani Vocabolario entry
 * (`sources.ts`, `lexiconVerification`). Forms the Vocabolario marks ant., poet., pop., dial. or tosc. are left out.
 */
export const italianLexicon: Readonly<Record<string, ItalianEntry>> = {
  // A. Verbs with whole-word cells.
  essere: {
    class: 'irregular', auxiliaries: [essere], future: ['sar'], participle: ['stato'], presentParticiple: ['essente'],
    usage: { essente: 'literary' }, flags: ['imperative2plSubjunctive'],
    cells: {
      ...tense('indicative.present', ['sono', 'sei', 'è', 'siamo', 'siete', 'sono']),
      ...tense('indicative.imperfect', ['ero', 'eri', 'era', 'eravamo', 'eravate', 'erano']),
      ...tense('indicative.simple_past', ['fui', 'fosti', 'fu', 'fummo', 'foste', 'furono']),
      ...tense('subjunctive.present', ['sia', 'sia', 'sia', 'siamo', 'siate', 'siano']),
      ...tense('subjunctive.imperfect', ['fossi', 'fossi', 'fosse', 'fossimo', 'foste', 'fossero']),
      ...cell('imperative.present', '2sg', 'sii'),
    },
  },
  avere: {
    class: 'irregular', auxiliaries: [avere], present: { '1pl': ['abb'] }, subjunctive: ['abbi'], past: ['ebbi'], future: ['avr'],
    flags: ['imperative2plSubjunctive'],
    cells: { ...tense('indicative.present', ['ho', 'hai', 'ha', null, null, 'hanno']), ...cell('imperative.present', '2sg', 'abbi') },
  },
  andare: {
    class: 'irregular', auxiliaries: [essere], subjunctive: ['vad'], future: ['andr'],
    cells: {
      ...tense('indicative.present', [['vado', { text: 'vo', usage: 'literary' }], 'vai', 'va', null, null, 'vanno']),
      ...cell('imperative.present', '2sg', ['vai', "va'"]),
    },
  },
  dare: {
    class: 'irregular', auxiliaries: [avere], subjunctive: ['di'], future: ['dar'],
    cells: {
      ...tense('indicative.present', ['do', 'dai', 'dà', null, null, 'danno']),
      ...tense('indicative.simple_past', [['diedi', 'detti'], 'desti', ['diede', 'dette'], 'demmo', 'deste', ['diedero', 'dettero']]),
      ...tense('subjunctive.imperfect', ['dessi', 'dessi', 'desse', 'dessimo', 'deste', 'dessero']),
      ...cell('imperative.present', '2sg', ['dai', "da'"]),
    },
  },
  stare: {
    class: 'irregular', auxiliaries: [essere], subjunctive: ['sti'], future: ['star'],
    cells: {
      ...tense('indicative.present', ['sto', 'stai', 'sta', null, null, 'stanno']),
      ...tense('indicative.simple_past', ['stetti', 'stesti', 'stette', 'stemmo', 'steste', 'stettero']),
      ...tense('subjunctive.imperfect', ['stessi', 'stessi', 'stesse', 'stessimo', 'steste', 'stessero']),
      ...cell('imperative.present', '2sg', ['stai', "sta'"]),
    },
  },
  fare: {
    class: 'contracted', long: 'fac', auxiliaries: [avere], present: { '1pl': ['facc'] }, subjunctive: ['facci'], past: ['feci'],
    participle: ['fatto'], presentParticiple: ['*', 'faciente'],
    cells: {
      ...tense('indicative.present', [['faccio', 'fo'], 'fai', 'fa', null, 'fate', 'fanno']),
      ...cell('imperative.present', '2sg', ['fai', "fa'"]),
    },
  },
  dire: {
    class: 'contracted', long: 'dic', auxiliaries: [avere], past: ['dissi'], participle: ['detto'],
    cells: { ...cell('indicative.present', '2pl', 'dite'), ...cell('imperative.present', '2sg', "di'") },
    familyDrops: ['imperative.present.2.singular'],
  },
  sapere: {
    class: 'irregular', auxiliaries: [avere], present: { '1pl': ['sapp'] }, subjunctive: ['sappi'], past: ['seppi'], future: ['sapr'],
    presentParticiple: null, flags: ['imperative2plSubjunctive'],
    cells: { ...tense('indicative.present', ['so', 'sai', 'sa', null, null, 'sanno']), ...cell('imperative.present', '2sg', 'sappi') },
  },
  potere: {
    class: 'irregular', auxiliaries: servile, present: { '1sg': ['poss'], '1pl': ['poss'], '3pl': ['poss'] },
    pastSeries: ['ei', 'etti'], future: ['potr'], presentParticiple: null, flags: ['noImperative'],
    cells: tense('indicative.present', [null, 'puoi', 'può', null, null, null]),
  },
  dovere: {
    class: 'irregular', auxiliaries: servile, future: ['dovr'], flags: ['noImperative'],
    present: { '1sg': ['dev', 'debb'], '2sg': ['dev'], '3sg': ['dev'], '1pl': ['dobb'], '3pl': ['dev', 'debb'] },
  },
  volere: {
    class: 'irregular', auxiliaries: servile, past: ['volli'], future: ['vorr'], flags: ['imperative2plSubjunctive'],
    present: { '1sg': ['vogli'], '3sg': ['vuol'], '1pl': ['vogl'], '3pl': ['vogli'] },
    cells: { ...cell('indicative.present', '2sg', 'vuoi'), ...cell('imperative.present', '2sg', 'vogli') },
  },
  // B. Lexical present stems, with strong parts.
  venire: {
    class: 'ire', isc: 'no', auxiliaries: [essere], present: { '1sg': ['veng'], '2sg': ['vien'], '3sg': ['vien'], '3pl': ['veng'] },
    past: ['venni'], future: ['verr'], participle: ['venuto'], presentParticiple: ['veniente'],
  },
  tenere: {
    class: 'ere', auxiliaries: [avere], present: { '1sg': ['teng'], '2sg': ['tien'], '3sg': ['tien'], '3pl': ['teng'] },
    past: ['tenni'], future: ['terr'],
  },
  rimanere: {
    class: 'ere', auxiliaries: [essere], present: { '1sg': ['rimang'], '3pl': ['rimang'] }, past: ['rimasi'], future: ['rimarr'],
    participle: ['rimasto'],
  },
  salire: {
    class: 'ire', isc: 'no', auxiliaries: [intransitive, transitive], present: { '1sg': ['salg'], '3pl': ['salg'] },
    presentParticiple: ['*', 'saliente'],
  },
  valere: {
    class: 'ere', present: { '1sg': ['valg'], '3pl': ['valg'] }, past: ['valsi'], future: ['varr'], participle: ['valso'],
    auxiliaries: [{ lemma: 'essere', condition: 'most senses' }, { lemma: 'avere', condition: 'some senses' }],
  },
  parere: {
    class: 'ere', auxiliaries: [essere], present: { '1sg': ['pai'], '1pl': ['pai'], '3pl': ['pai'] }, past: ['parvi'], future: ['parr'],
    participle: ['parso'], presentParticiple: null, flags: ['noImperative'],
  },
  porre: { class: 'contracted', long: 'pon', auxiliaries: [avere], present: { '1sg': ['pong'], '3pl': ['pong'] }, past: ['posi'], participle: ['posto'] },
  trarre: {
    class: 'contracted', long: 'tra', auxiliaries: [avere], present: { '1sg': ['tragg'], '3pl': ['tragg'] }, past: ['trassi'],
    participle: ['tratto'],
  },
  condurre: { class: 'contracted', long: 'conduc', auxiliaries: [avere], past: ['condussi'], participle: ['condotto'] },
  tradurre: { class: 'contracted', long: 'traduc', auxiliaries: [avere], past: ['tradussi'], participle: ['tradotto'] },
  uscire: { class: 'ire', isc: 'no', auxiliaries: [essere], present: stressed(['esc']) },
  udire: { class: 'ire', isc: 'no', auxiliaries: [avere], present: stressed(['od']), future: ['*', 'udr'] },
  morire: {
    class: 'ire', isc: 'no', auxiliaries: [essere], present: { '1sg': ['muoi'], '2sg': ['muor'], '3sg': ['muor'], '3pl': ['muoi'] },
    future: ['*', 'morr'], participle: ['morto'],
  },
  sedere: { class: 'ere', present: stressed(['sied']), pastSeries: ['ei', 'etti'], future: ['*', 'sieder'] },
  cuocere: { class: 'ere', auxiliaries: [avere], unstressed: ['*', 'coc'], past: ['cossi'], participle: ['cotto'], flags: ['palatal'] },
  piacere: { class: 'ere', auxiliaries: [essere], present: { '1sg': ['piacci'], '1pl': ['piacc'], '3pl': ['piacci'] }, past: ['piacqui'] },
  tacere: { class: 'ere', auxiliaries: [avere], present: { '1sg': ['tacci'], '1pl': ['tacc'], '3pl': ['tacci'] }, past: ['tacqui'] },
  giacere: { class: 'ere', auxiliaries: [essere], present: { '1sg': ['giacci'], '1pl': ['giacc'], '3pl': ['giacci'] }, past: ['giacqui'] },
  nuocere: {
    class: 'ere', auxiliaries: [avere], present: { '1sg': ['nocci', 'nuocci'], '2sg': ['nuoc'], '3sg': ['nuoc'], '3pl': ['nocci', 'nuocci'] },
    unstressed: ['*', 'noc'], past: ['nocqui'], participle: ['nociuto'],
  },
  scegliere: { class: 'ere', auxiliaries: [avere], present: { '1sg': ['scelg'], '3pl': ['scelg'] }, past: ['scelsi'], participle: ['scelto'] },
  togliere: { class: 'ere', auxiliaries: [avere], present: { '1sg': ['tolg'], '3pl': ['tolg'] }, past: ['tolsi'], participle: ['tolto'] },
  cogliere: { class: 'ere', auxiliaries: [avere], present: { '1sg': ['colg'], '3pl': ['colg'] }, past: ['colsi'], participle: ['colto'] },
  sciogliere: { class: 'ere', auxiliaries: [avere], present: { '1sg': ['sciolg'], '3pl': ['sciolg'] }, past: ['sciolsi'], participle: ['sciolto'] },
  dolere: {
    class: 'ere', auxiliaries: [avere, essere], present: { '1sg': ['dolg'], '2sg': ['duol'], '3sg': ['duol'], '3pl': ['dolg'] },
    past: ['dolsi'], future: ['dorr'],
  },
  solere: {
    class: 'ere', present: { '1sg': ['sogli'], '2sg': ['suol'], '3sg': ['suol'], '1pl': ['sogl'], '3pl': ['sogli'] },
    pastSeries: ['ei'], participle: ['solito'], flags: ['noImperative'],
    // Vocabolario: used in the simple tenses of the indicative (not the future), the subjunctive and the present infinitive;
    // "negli altri tempi è sostituito dalla locuz. essere solito".
    defective: [
      'indicative.perfect', 'indicative.pluperfect', 'indicative.past_anterior', 'indicative.future', 'indicative.future_perfect',
      'subjunctive.past', 'subjunctive.pluperfect', 'conditional.present', 'conditional.past', 'infinitive.past', 'participle.present',
      'gerund.present', 'gerund.past',
    ],
  },
  apparire: {
    class: 'ire', isc: 'no', auxiliaries: [essere],
    present: { '1sg': ['appai', '*isc'], '2sg': ['*', '*isc'], '3sg': ['*', '*isc'], '3pl': ['appai', '*isc'] },
    pastSeries: ['=apparvi', 'weak', '=apparsi'], participle: ['apparso'],
  },
  comparire: {
    class: 'ire', isc: 'no', auxiliaries: [essere],
    present: { '1sg': ['*isc', 'compai'], '2sg': ['*isc', '*'], '3sg': ['*isc', '*'], '3pl': ['*isc', 'compai'] },
    pastSeries: ['=comparvi', 'weak', '=comparsi'], participle: ['comparso'],
  },
  muovere: { class: 'ere', auxiliaries: [avere], unstressed: ['*', 'mov'], past: ['mossi'], participle: ['mosso'] },
  vedere: { class: 'ere', auxiliaries: [avere], past: ['vidi'], future: ['vedr'], participle: ['visto', '*'] },
  provvedere: { class: 'ere', auxiliaries: [avere], past: ['provvidi'], participle: ['provvisto', '*'] },
  prevedere: { class: 'ere', auxiliaries: [avere], past: ['previdi'], future: ['prevedr', '*'], participle: ['previsto', '*'] },
  godere: { class: 'ere', auxiliaries: [avere], future: ['godr', '*'] },
  cadere: { class: 'ere', auxiliaries: [essere], past: ['caddi'], future: ['cadr'] },
  bere: { class: 'contracted', long: 'bev', auxiliaries: [avere], pastSeries: ['=bevvi', 'etti'], future: ['berr'] },
  vivere: {
    class: 'ere', past: ['vissi'], future: ['vivr'], participle: ['vissuto'],
    auxiliaries: [{ lemma: 'essere', condition: 'most senses' }, { lemma: 'avere', condition: 'some senses (to live through, to experience)' }],
  },
  // C. Strong passato remoto and participle, regular present.
  accendere: { class: 'ere', auxiliaries: [avere], past: ['accesi'], participle: ['acceso'] },
  aprire: { class: 'ire', isc: 'no', auxiliaries: [avere], pastSeries: ['weak', '=apersi'], participle: ['aperto'] },
  coprire: { class: 'ire', isc: 'no', auxiliaries: [avere], pastSeries: ['weak', '=copersi'], participle: ['coperto'] },
  offrire: { class: 'ire', isc: 'no', auxiliaries: [avere], pastSeries: ['weak', '=offersi'], participle: ['offerto'] },
  costruire: { class: 'ire', isc: 'yes', auxiliaries: [avere], pastSeries: ['weak', '=costrussi'], participle: ['*', 'costrutto'] },
  prendere: { class: 'ere', auxiliaries: [avere], past: ['presi'], participle: ['preso'] },
  chiudere: { class: 'ere', auxiliaries: [avere], past: ['chiusi'], participle: ['chiuso'] },
  rendere: { class: 'ere', auxiliaries: [avere], past: ['resi'], participle: ['reso'] },
  scendere: { class: 'ere', auxiliaries: [intransitive, transitive], past: ['scesi'], participle: ['sceso'] },
  spendere: { class: 'ere', auxiliaries: [avere], past: ['spesi'], participle: ['speso'] },
  dipendere: { class: 'ere', auxiliaries: [essere], past: ['dipesi'], participle: ['dipeso'] },
  tendere: { class: 'ere', auxiliaries: [avere], past: ['tesi'], participle: ['teso'] },
  appendere: { class: 'ere', auxiliaries: [avere], past: ['appesi'], participle: ['appeso'] },
  difendere: { class: 'ere', auxiliaries: [avere], past: ['difesi'], participle: ['difeso'] },
  offendere: { class: 'ere', auxiliaries: [avere], past: ['offesi'], participle: ['offeso'] },
  ridere: { class: 'ere', auxiliaries: [avere], past: ['risi'], participle: ['riso'] },
  dividere: { class: 'ere', auxiliaries: [avere], past: ['divisi'], participle: ['diviso'] },
  decidere: { class: 'ere', auxiliaries: [avere], past: ['decisi'], participle: ['deciso'] },
  uccidere: { class: 'ere', auxiliaries: [avere], past: ['uccisi'], participle: ['ucciso'] },
  concludere: { class: 'ere', auxiliaries: [avere], past: ['conclusi'], participle: ['concluso'] },
  rodere: { class: 'ere', auxiliaries: [avere], past: ['rosi'], participle: ['roso'] },
  esplodere: {
    class: 'ere', past: ['esplosi'], participle: ['esploso'],
    auxiliaries: [{ lemma: 'essere', condition: 'said of the explosive itself' }, { lemma: 'avere', condition: 'said of a weapon that is fired' }],
  },
  invadere: { class: 'ere', auxiliaries: [avere], past: ['invasi'], participle: ['invaso'] },
  evadere: { class: 'ere', auxiliaries: [intransitive, transitive], past: ['evasi'], participle: ['evaso'] },
  persuadere: { class: 'ere', auxiliaries: [avere], past: ['persuasi'], participle: ['persuaso'] },
  mordere: { class: 'ere', auxiliaries: [avere], past: ['morsi'], participle: ['morso'] },
  perdere: { class: 'ere', auxiliaries: [avere], pastSeries: ['=persi', 'etti'], participle: ['perso', '*'] },
  chiedere: { class: 'ere', auxiliaries: [avere], past: ['chiesi'], participle: ['chiesto'] },
  rispondere: { class: 'ere', auxiliaries: [avere], past: ['risposi'], participle: ['risposto'] },
  nascondere: { class: 'ere', auxiliaries: [avere], past: ['nascosi'], participle: ['nascosto'] },
  porgere: { class: 'ere', auxiliaries: [avere], past: ['porsi'], participle: ['porto'] },
  sorgere: { class: 'ere', auxiliaries: [essere], past: ['sorsi'], participle: ['sorto'] },
  scorgere: { class: 'ere', auxiliaries: [avere], past: ['scorsi'], participle: ['scorto'] },
  accorgere: { class: 'ere', auxiliaries: [essere], past: ['accorsi'], participle: ['accorto'] },
  spargere: { class: 'ere', auxiliaries: [avere], past: ['sparsi'], participle: ['sparso'] },
  emergere: { class: 'ere', auxiliaries: [essere], past: ['emersi'], participle: ['emerso'] },
  immergere: { class: 'ere', auxiliaries: [avere], past: ['immersi'], participle: ['immerso'] },
  giungere: { class: 'ere', auxiliaries: [intransitive, transitive], past: ['giunsi'], participle: ['giunto'] },
  ungere: { class: 'ere', auxiliaries: [avere], past: ['unsi'], participle: ['unto'] },
  pungere: { class: 'ere', auxiliaries: [avere], past: ['punsi'], participle: ['punto'] },
  spingere: { class: 'ere', auxiliaries: [avere], past: ['spinsi'], participle: ['spinto'] },
  tingere: { class: 'ere', auxiliaries: [avere], past: ['tinsi'], participle: ['tinto'] },
  fingere: { class: 'ere', auxiliaries: [avere], past: ['finsi'], participle: ['finto'] },
  dipingere: { class: 'ere', auxiliaries: [avere], past: ['dipinsi'], participle: ['dipinto'] },
  stringere: { class: 'ere', auxiliaries: [avere], past: ['strinsi'], participle: ['stretto'] },
  piangere: { class: 'ere', auxiliaries: [avere], past: ['piansi'], participle: ['pianto'] },
  vincere: { class: 'ere', auxiliaries: [avere], past: ['vinsi'], participle: ['vinto'] },
  torcere: { class: 'ere', auxiliaries: [avere], past: ['torsi'], participle: ['torto'] },
  volgere: { class: 'ere', auxiliaries: [avere], past: ['volsi'], participle: ['volto'] },
  assolvere: { class: 'ere', auxiliaries: [avere], pastSeries: ['ei', 'etti', '=assolsi'], participle: ['assolto'] },
  risolvere: { class: 'ere', auxiliaries: [avere], pastSeries: ['ei', 'etti', '=risolsi'], participle: ['risoluto', 'risolto'] },
  esprimere: { class: 'ere', auxiliaries: [avere], past: ['espressi'], participle: ['espresso'] },
  scuotere: { class: 'ere', auxiliaries: [avere], unstressed: ['*', 'scot'], past: ['scossi'], participle: ['scosso'] },
  percuotere: { class: 'ere', auxiliaries: [avere], unstressed: ['*', 'percot'], past: ['percossi'], participle: ['percosso'] },
  discutere: { class: 'ere', auxiliaries: [avere], past: ['discussi'], participle: ['discusso'] },
  mettere: { class: 'ere', auxiliaries: [avere], past: ['misi'], participle: ['messo'] },
  leggere: { class: 'ere', auxiliaries: [avere], past: ['lessi'], participle: ['letto'] },
  reggere: { class: 'ere', auxiliaries: [avere], past: ['ressi'], participle: ['retto'] },
  proteggere: { class: 'ere', auxiliaries: [avere], past: ['protessi'], participle: ['protetto'] },
  friggere: { class: 'ere', auxiliaries: [avere], past: ['frissi'], participle: ['fritto'] },
  distruggere: { class: 'ere', auxiliaries: [avere], past: ['distrussi'], participle: ['distrutto'] },
  scrivere: { class: 'ere', auxiliaries: [avere], past: ['scrissi'], participle: ['scritto'] },
  conoscere: { class: 'ere', auxiliaries: [avere], past: ['conobbi'] },
  crescere: {
    class: 'ere', past: ['crebbi'],
    auxiliaries: [{ lemma: 'essere', condition: 'intransitive use (to grow)' }, { lemma: 'avere', condition: 'transitive use (to raise)' }],
  },
  nascere: { class: 'ere', auxiliaries: [essere], past: ['nacqui'], participle: ['nato'] },
  rompere: { class: 'ere', auxiliaries: [avere], past: ['ruppi'], participle: ['rotto'] },
  concedere: { class: 'ere', auxiliaries: [avere], pastSeries: ['=concessi', 'ei', 'etti'], participle: ['concesso', '*'] },
  succedere: { class: 'ere', auxiliaries: [essere], pastSeries: ['=successi', 'ei', 'etti'], participle: ['successo', '*'] },
  esistere: { class: 'ere', auxiliaries: [essere], participle: ['esistito'] },
  // The stint-2 sweep of common irregular verbs (each header read in the Vocabolario).
  soffrire: { class: 'ire', isc: 'no', auxiliaries: [avere], pastSeries: ['weak', '=soffersi'], participle: ['sofferto'] },
  riavere: {
    class: 'irregular', auxiliaries: [avere], present: { '1pl': ['riabb'] }, subjunctive: ['riabbi'], past: ['riebbi'], future: ['riavr'],
    flags: ['imperative2plSubjunctive'],
    cells: { ...tense('indicative.present', ['riò', 'riai', 'rià', null, null, 'rianno']), ...cell('imperative.present', '2sg', 'riabbi') },
  },
  dissolvere: { class: 'ere', auxiliaries: [avere], past: ['dissolsi'], participle: ['dissolto'] },
  annettere: { class: 'ere', auxiliaries: [avere], pastSeries: ['ei', '=annessi'], participle: ['annesso'] },
  alludere: { class: 'ere', auxiliaries: [avere], past: ['allusi'], participle: ['alluso'] },
  assumere: { class: 'ere', auxiliaries: [avere], past: ['assunsi'], participle: ['assunto'] },
  distinguere: { class: 'ere', auxiliaries: [avere], past: ['distinsi'], participle: ['distinto'] },
  estinguere: { class: 'ere', auxiliaries: [avere], past: ['estinsi'], participle: ['estinto'] },
  fondere: { class: 'ere', auxiliaries: [avere], past: ['fusi'], participle: ['fuso'] },
  spegnere: { class: 'ere', auxiliaries: [avere], present: { '1sg': ['speng'], '3pl': ['speng'] }, past: ['spensi'], participle: ['spento'] },
  dirigere: { class: 'ere', auxiliaries: [avere], past: ['diressi'], participle: ['diretto'] },
  redigere: { class: 'ere', auxiliaries: [avere], past: ['redassi'], participle: ['redatto'] },
  erigere: { class: 'ere', auxiliaries: [avere], past: ['eressi'], participle: ['eretto'] },
  esigere: { class: 'ere', auxiliaries: [avere], pastSeries: ['ei', 'etti'], participle: ['esatto'] },
  cingere: { class: 'ere', auxiliaries: [avere], past: ['cinsi'], participle: ['cinto'] },
  ardere: { class: 'ere', past: ['arsi'], participle: ['arso'] },
  radere: { class: 'ere', auxiliaries: [avere], past: ['rasi'], participle: ['raso'] },
  ledere: { class: 'ere', auxiliaries: [avere], past: ['lesi'], participle: ['leso'] },
  sconfiggere: { class: 'ere', auxiliaries: [avere], past: ['sconfissi'], participle: ['sconfitto'] },
  affliggere: { class: 'ere', auxiliaries: [avere], past: ['afflissi'], participle: ['afflitto'] },
  espellere: { class: 'ere', auxiliaries: [avere], past: ['espulsi'], participle: ['espulso'] },
  eccellere: { class: 'ere', past: ['eccelsi'], participle: ['eccelso'] },
  espandere: { class: 'ere', auxiliaries: [avere], past: ['espansi'], participle: ['espanso'] },
  scindere: { class: 'ere', auxiliaries: [avere], past: ['scissi'], participle: ['scisso'] },
  mungere: { class: 'ere', auxiliaries: [avere], past: ['munsi'], participle: ['munto'] },
  frangere: { class: 'ere', auxiliaries: [avere], past: ['fransi'], participle: ['franto'] },
  redimere: { class: 'ere', auxiliaries: [avere], past: ['redensi'], participle: ['redento'] },
  seppellire: { class: 'ire', isc: 'yes', auxiliaries: [avere], participle: ['sepolto', '*'] },
  piovere: {
    class: 'ere', past: ['piovvi'], flags: ['impersonal'],
    auxiliaries: [{ lemma: 'essere', condition: 'the usual auxiliary' }, { lemma: 'avere', condition: 'to stress a longer duration' }],
  },
  correre: {
    class: 'ere', past: ['corsi'], participle: ['corso'],
    auxiliaries: [{ lemma: 'essere', condition: 'towards a goal' }, { lemma: 'avere', condition: 'the action in itself' }],
  },
};

/** An Italian verb as the grammar sees it: one paradigm of one lemma. */
export interface ItalianLexeme extends LexemeBase {
  /** The lemma without -si (lavare for lavarsi). */
  readonly base: string;
  readonly conjugation: 'are' | 'ere' | 'ire';
  /** The stem before the endings: parl, cred, fin, fac (the long stem of a shortened infinitive). */
  readonly root: string;
  /** One paradigm: a verb with both becomes two lexemes. */
  readonly isc: 'yes' | 'no';
  readonly stressedI: boolean;
  readonly palatal: boolean;
  /** The lexical data the verb has, its own or taken over from its family, with the stem hints of the query. */
  readonly entry: ItalianEntry | null;
  readonly family: { readonly prefix: string; readonly base: string } | null;
  /** The condition under which each auxiliary is used, for a verb with two. */
  readonly auxiliaryConditions: Readonly<Record<string, string>>;
  /** A weather verb used only in the third person (piove, piovono). */
  readonly impersonal: boolean;
}
