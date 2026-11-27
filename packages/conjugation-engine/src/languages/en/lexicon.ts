/**
 * The English lexicon (design §3, §5): the irregular verbs with their past and past participle, and the side lists the
 * classification and the spelling rules read. Every entry was read in the Longman Dictionary of Contemporary English
 * (LDOCE) and the American Heritage Dictionary (AHD); `sources.ts` records, verb by verb, where.
 *
 * Labelling policy (controller ruling after the stint-1 review):
 * - `region` only where a dictionary marks the form: LDOCE's "(especially) American English" is US, "(especially)
 *   British English" is GB. A form is never regional because only one dictionary prints it.
 * - A form both dictionaries print without a label is standard; LDOCE's order is the order of preference.
 * - A form only one dictionary prints (AHD's second choices "X or Y", "also Y"; LDOCE's verb table only) is accepted but
 *   never preferred: `usage: 'dated'`, no region. So are the forms the dictionaries mark old (writ, smote, begot).
 * - A form LDOCE labels literary is `usage: 'literary'` (bade, bidden, hewn).
 * - Forms restricted to one sense (hanged, shined) are a second paradigm or left out.
 */

export type Region = 'GB' | 'US';

/** One past or past participle form; `form: null` is the regular -ed form, derived by the spelling rules. */
export interface Alternate {
  readonly form: string | null;
  readonly region?: Region;
  readonly usage?: 'literary' | 'dated';
}

export interface Paradigm {
  /** In order of preference; `[{ form: null }]` alone is a regular past. */
  readonly past: readonly Alternate[];
  readonly participle: readonly Alternate[];
  /** The pattern tag of one paradigm of a verb with two (the past form: `hung`, `hanged`). */
  readonly label?: string;
  /** What the verb means in this paradigm (the condition tag). */
  readonly meaning?: string;
}

export interface IrregularEntry {
  readonly paradigms: readonly Paradigm[];
  /** A polysyllable stressed on its last syllable (begin, forget): it doubles its final consonant. */
  readonly finalStress?: true;
}

const ed: Alternate = { form: null };
const edUS: Alternate = { form: null, region: 'US' };
const edGB: Alternate = { form: null, region: 'GB' };
const edDated: Alternate = { form: null, usage: 'dated' };
const w = (form: string): Alternate => ({ form });
const us = (form: string): Alternate => ({ form, region: 'US' });
const gb = (form: string): Alternate => ({ form, region: 'GB' });
const literary = (form: string): Alternate => ({ form, usage: 'literary' });
const dated = (form: string): Alternate => ({ form, usage: 'dated' });

/** One paradigm from its past and participle alternates. */
function parts(past: readonly Alternate[], participle: readonly Alternate[], extra: { finalStress?: true } = {}): IrregularEntry {
  return { paradigms: [{ past, participle }], ...extra };
}

/** A verb whose past and past participle are the same single listed form. */
const same = (form: string): IrregularEntry => parts([w(form)], [w(form)]);
/** A verb with one listed past and one listed participle. */
const two = (past: string, participle: string, extra: { finalStress?: true } = {}): IrregularEntry => parts([w(past)], [w(participle)], extra);

/**
 * The irregular verbs (hang, lie and shine have two paradigms each). Section A was read for the design (design §5.1),
 * section B for this pack (design §5.2), section C after the stint-1 review; `sources.ts` records each check.
 * A "dated" form below is one only AHD prints (or only LDOCE's verb table), per the policy above.
 */
export const irregulars: Readonly<Record<string, IrregularEntry>> = {
  // A. Design §5.1.
  awake: parts([w('awoke'), edDated], [w('awoken'), edDated]),
  bear: two('bore', 'borne'),
  beat: parts([w('beat')], [w('beaten'), dated('beat')]),
  bend: same('bent'),
  bet: parts([w('bet'), ed], [w('bet'), ed]),
  bid: parts([w('bid'), literary('bade')], [w('bid'), literary('bidden')]),
  broadcast: parts([w('broadcast'), edDated], [w('broadcast'), edDated]),
  burn: parts([w('burnt'), ed], [w('burnt'), ed]),
  cast: same('cast'),
  dive: parts([ed, us('dove')], [ed]),
  dream: parts([ed, w('dreamt')], [ed, w('dreamt')]),
  dwell: parts([w('dwelt'), ed], [w('dwelt'), ed]),
  fit: parts([ed, us('fit')], [ed, us('fit')]),
  forbid: parts([w('forbade'), dated('forbad')], [w('forbidden'), dated('forbid')], { finalStress: true }),
  forecast: parts([w('forecast'), ed], [w('forecast'), ed]),
  forget: parts([w('forgot')], [w('forgotten'), dated('forgot')], { finalStress: true }),
  get: parts([w('got')], [w('got'), us('gotten')]),
  hang: {
    paradigms: [
      { past: [w('hung')], participle: [w('hung')], label: 'hung', meaning: 'hang up, be suspended' },
      { past: [ed], participle: [ed], label: 'hanged', meaning: 'kill by hanging' },
    ],
  },
  input: parts([ed, w('input')], [ed, w('input')]),
  kneel: parts([w('knelt'), edUS], [w('knelt'), edUS]),
  knit: parts([ed, w('knit')], [ed, w('knit')]),
  lean: parts([ed, gb('leant')], [ed, gb('leant')]),
  leap: parts([gb('leapt'), edUS], [gb('leapt'), edUS]),
  learn: parts([ed, gb('learnt')], [ed, gb('learnt')]),
  lie: {
    paradigms: [
      { past: [w('lay')], participle: [w('lain')], label: 'lay', meaning: 'be flat, be situated' },
      { past: [ed], participle: [ed], label: 'lied', meaning: 'say something untrue' },
    ],
  },
  light: parts([w('lit'), ed], [w('lit'), ed]),
  mow: parts([ed], [w('mown'), ed]),
  plead: parts([ed, us('pled')], [ed, us('pled')]),
  prove: parts([ed], [ed, us('proven')]),
  quit: parts([w('quit'), edGB], [w('quit'), edGB]),
  rid: parts([w('rid'), ed], [w('rid'), ed]),
  sew: parts([ed], [w('sewn'), ed]),
  shine: {
    paradigms: [
      { past: [w('shone')], participle: [w('shone')], label: 'shone', meaning: 'give out light' },
      { past: [ed], participle: [ed], label: 'shined', meaning: 'polish' },
    ],
  },
  show: parts([ed], [w('shown'), edDated]),
  shrink: parts([w('shrank'), dated('shrunk')], [w('shrunk'), dated('shrunken')]),
  shut: same('shut'),
  sing: parts([w('sang'), dated('sung')], [w('sung')]),
  sink: parts([w('sank'), us('sunk')], [w('sunk')]),
  slay: parts([w('slew'), edDated], [w('slain'), edDated]),
  slide: same('slid'),
  smell: parts([gb('smelt'), edUS], [gb('smelt'), edUS]),
  sneak: parts([ed, us('snuck')], [ed, us('snuck')]),
  sow: parts([ed], [w('sown'), ed]),
  speed: parts([w('sped'), ed], [w('sped'), ed]),
  spell: parts([gb('spelt'), edUS], [gb('spelt'), edUS]),
  spill: parts([gb('spilt'), edUS], [gb('spilt'), edUS]),
  spin: same('spun'),
  spit: parts([w('spat'), us('spit')], [w('spat'), us('spit')]),
  spoil: parts([ed, gb('spoilt')], [ed, gb('spoilt')]),
  spring: parts([w('sprang'), us('sprung')], [w('sprung')]),
  stink: parts([w('stank'), dated('stunk')], [w('stunk')]),
  strike: parts([w('struck')], [w('struck'), dated('stricken')]),
  strive: parts([w('strove'), edDated], [w('striven'), edDated]),
  swell: parts([ed], [w('swollen'), edDated]),
  thrive: parts([ed, w('throve')], [ed, dated('thriven')]),
  tread: parts([w('trod'), edDated], [w('trodden'), dated('trod'), edDated]),
  wake: parts([w('woke'), edDated], [w('woken'), edDated]),
  weave: two('wove', 'woven'),
  wet: parts([w('wet'), ed], [w('wet'), ed]),
  wind: same('wound'),

  // B. Design §5.2, read for this pack.
  // Suppletive and special: be's finite forms are whole words (stems.ts); have's 3rd person singular is has.
  be: parts([], [w('been')]),
  have: same('had'),
  do: two('did', 'done'),
  go: two('went', 'gone'),
  // No change. (cost: LDOCE sense 4 and AHD tr. sense 3 "costed", estimate a cost, is left out as sense-restricted.)
  burst: same('burst'), cost: same('cost'), cut: same('cut'), hit: same('hit'), hurt: same('hurt'), let: same('let'),
  put: same('put'), read: same('read'), set: same('set'), shed: same('shed'), slit: same('slit'), split: same('split'),
  spread: same('spread'), thrust: same('thrust'),
  // Past = participle. (grind: AHD "grinded" for a slang and a skateboarding sense; pay: AHD "payed" for a nautical sense;
  // stick: AHD "sticked" for a gardening and a printing sense; all left out as sense-restricted.)
  bind: same('bound'), bleed: same('bled'), breed: same('bred'), bring: same('brought'), build: same('built'),
  buy: same('bought'), catch: same('caught'), cling: same('clung'), creep: same('crept'), deal: same('dealt'),
  dig: same('dug'), feed: same('fed'), feel: same('felt'), fight: same('fought'), find: same('found'), flee: same('fled'),
  fling: same('flung'), grind: same('ground'), hear: same('heard'), hold: same('held'), keep: same('kept'),
  lay: same('laid'), lead: same('led'), leave: same('left'), lend: same('lent'), lose: same('lost'), make: same('made'),
  mean: same('meant'), meet: same('met'), pay: same('paid'), say: same('said'), seek: same('sought'), sell: same('sold'),
  send: same('sent'), shoot: same('shot'), sit: same('sat'), sleep: same('slept'), sling: same('slung'),
  // slink: AHD "slunk also slinked"; LDOCE "slunk" only.
  slink: parts([w('slunk'), edDated], [w('slunk'), edDated]),
  spend: same('spent'), stand: same('stood'), stick: same('stuck'), sting: same('stung'), string: same('strung'),
  sweep: same('swept'), swing: same('swung'), teach: same('taught'), tell: same('told'), think: same('thought'),
  weep: same('wept'), win: same('won'), wring: same('wrung'),
  // An -en or -n participle. (fly: LDOCE fly³ and AHD sense 7 "flied", baseball, left out as sense-restricted.)
  arise: two('arose', 'arisen'),
  begin: two('began', 'begun', { finalStress: true }),
  bite: parts([w('bit')], [w('bitten'), dated('bit')]),
  blow: two('blew', 'blown'), break: two('broke', 'broken'), choose: two('chose', 'chosen'), draw: two('drew', 'drawn'),
  drive: two('drove', 'driven'), eat: two('ate', 'eaten'), fall: two('fell', 'fallen'), fly: two('flew', 'flown'),
  forsake: two('forsook', 'forsaken'), freeze: two('froze', 'frozen'), give: two('gave', 'given'), grow: two('grew', 'grown'),
  hide: parts([w('hid')], [w('hidden'), dated('hid')]),
  know: two('knew', 'known'), ride: two('rode', 'ridden'), rise: two('rose', 'risen'), see: two('saw', 'seen'),
  shake: two('shook', 'shaken'), speak: two('spoke', 'spoken'), steal: two('stole', 'stolen'), swear: two('swore', 'sworn'),
  take: two('took', 'taken'), tear: two('tore', 'torn'), throw: two('threw', 'thrown'), wear: two('wore', 'worn'),
  // write: AHD "written also writ"; beget: AHD "begotten or begot"; smite: AHD "smitten or smote"; LDOCE prints none.
  write: parts([w('wrote')], [w('written'), dated('writ')]),
  beget: parts([w('begot')], [w('begotten'), dated('begot')], { finalStress: true }),
  smite: parts([w('smote')], [w('smitten'), dated('smote')]),
  stride: two('strode', 'stridden'),
  // A regular past and an -n participle. hew: LDOCE "hewed or hewn literary", AHD "hewn or hewed".
  hew: parts([ed], [ed, literary('hewn')]),
  saw: parts([ed], [w('sawn'), edUS]),
  shear: parts([ed], [ed, w('shorn')]),
  strew: parts([ed], [w('strewn'), ed]),
  // Past and participle differ by the vowel only. (ring: LDOCE ring³ / AHD ring¹ "ringed", encircle, left out.)
  come: two('came', 'come'), drink: two('drank', 'drunk'), ring: two('rang', 'rung'), run: two('ran', 'run'),
  swim: two('swam', 'swum'),
  // Compounds the prefix list does not reach.
  browbeat: two('browbeat', 'browbeaten'), babysit: same('babysat'), hamstring: same('hamstrung'),
  partake: two('partook', 'partaken'), proofread: same('proofread'), waylay: same('waylaid'),

  // C. Added after the stint-1 review.
  // misspell: LDOCE "misspelt or misspelled", AHD "misspelled or misspelt", unlabelled: listed, since a prefixed verb
  // inherits only its base's unmarked forms.
  misspell: parts([w('misspelt'), ed], [w('misspelt'), ed]),
  // output: LDOCE "output"; AHD "outputted or output".
  output: parts([w('output'), edDated], [w('output'), edDated]),
  // retrofit: LDOCE "retrofitted"; AHD "retrofitted or retrofit".
  retrofit: parts([ed, dated('retrofit')], [ed, dated('retrofit')]),
  // shoe: LDOCE header "shod", its verb table also shoed; AHD "shod, shod or shodden".
  shoe: parts([w('shod'), dated('shoed')], [w('shod'), dated('shodden')]),
  // beseech: LDOCE "besought or beseeched", AHD "besought or beseeched".
  beseech: parts([w('besought'), ed], [w('besought'), ed]),
  // wed: LDOCE "wedded or wed", AHD "wedded, wed or wedded".
  wed: parts([ed, w('wed')], [ed, w('wed')]),
  // Compounds LDOCE has no entry for (AHD only): typeset, breastfeed, ghostwrite.
  typeset: same('typeset'), breastfeed: same('breastfed'), ghostwrite: two('ghostwrote', 'ghostwritten'),
};

/**
 * Prefixes through which an unlisted verb inherits a listed verb's irregular forms (outswim → outswam), longest first.
 * Members are chosen so that no listed base gives a wrong verb (design §3); off, pre, sub, in and inter were added after
 * the stint-1 review (offset, preset, sublet, inset, inlay, prepay, interweave, interbreed: LDOCE and AHD).
 */
export const inheritPrefixes: readonly string[] = [
  'under', 'inter', 'fore', 'over', 'with', 'mis', 'out', 'for', 'off', 'pre', 'sub', 'be', 're', 'un', 'up', 'in',
];

/** Verbs that look like prefix + listed verb but are regular (LDOCE and AHD: behaved, belied, ...), with what they look like. */
export const noInherit: Readonly<Record<string, { readonly prefix: string; readonly base: string }>> = {
  behave: { prefix: 'be', base: 'have' }, belie: { prefix: 'be', base: 'lie' }, befit: { prefix: 'be', base: 'fit' },
  refit: { prefix: 're', base: 'fit' }, outfit: { prefix: 'out', base: 'fit' }, relay: { prefix: 're', base: 'lay' },
  welcome: { prefix: 'wel', base: 'come' }, belay: { prefix: 'be', base: 'lay' }, reprove: { prefix: 're', base: 'prove' },
  retread: { prefix: 're', base: 'tread' },
};

/** Listed verbs that are never the base of a prefixed verb. */
export const neverBase: ReadonlySet<string> = new Set(['be', 'have']);

/** Prefixes the stress default recognises (prefix + a one-syllable root is stressed on the root: re·blit). */
export const stressPrefixes: readonly string[] = [
  'inter', 'trans', 'under', 'with', 'fore', 'over', 'com', 'con', 'dis', 'for', 'mis', 'out', 'per', 'pre', 'pro', 'sub', 'sur',
  'ab', 'ac', 'ad', 'be', 'de', 'em', 'en', 'ex', 'im', 'in', 'ob', 're', 'un', 'up',
];

/** The consonant letters a one-syllable root may begin with (`qu` counts as one consonant). */
export const legalOnsets: ReadonlySet<string> = new Set([
  'b', 'c', 'd', 'f', 'g', 'h', 'j', 'k', 'l', 'm', 'n', 'p', 'qu', 'r', 's', 't', 'v', 'w', 'y', 'z',
  'bl', 'br', 'ch', 'cl', 'cr', 'dr', 'dw', 'fl', 'fr', 'gl', 'gr', 'kn', 'ph', 'pl', 'pr', 'sc', 'sch', 'scr', 'sh', 'shr',
  'sk', 'sl', 'sm', 'sn', 'sp', 'spl', 'spr', 'squ', 'st', 'str', 'sw', 'th', 'thr', 'tr', 'tw', 'wh', 'wr',
]);

/** Regular verbs stressed on the last syllable (LDOCE and AHD: admitted, compelled, preferred, allotted, ...). */
export const finalStress: ReadonlySet<string> = new Set([
  'abet', 'abhor', 'acquit', 'admit', 'allot', 'annul', 'appal', 'commit', 'compel', 'concur', 'confer', 'control', 'corral',
  'defer', 'deter', 'dispel', 'distil', 'emit', 'enrol', 'equip', 'excel', 'expel', 'extol', 'fulfil', 'impel', 'incur', 'infer',
  'instil', 'nonplus', 'occur', 'omit', 'patrol', 'permit', 'prefer', 'propel', 'rebel', 'recur', 'refer', 'regret', 'remit',
  'repel', 'submit', 'transfer', 'transmit',
]);

/** Regular verbs the prefix parse would wrongly stress on the last syllable (LDOCE and AHD: entered, profited, devilled, ...). */
export const nonFinalStress: ReadonlySet<string> = new Set([
  'bevel', 'combat', 'conquer', 'debit', 'devil', 'enter', 'interpret', 'profit', 'prosper', 'revel',
]);

/** Verbs that double their last consonant although the last syllable is unstressed (formatted, kidnapped, zigzagged). */
export const doublesUnstressed: ReadonlySet<string> = new Set([
  'babysit', 'eavesdrop', 'format', 'handicap', 'input', 'kidnap', 'output', 'program', 'retrofit', 'sidestep', 'typeset',
  'worship', 'zigzag',
]);

/**
 * Verbs whose doubled form has a single-consonant variant. `first: 'double'`: the doubled form is preferred and the
 * single one carries `single` (kidnaped: LDOCE "also kidnaped American English"; programed, nonplused: AHD only, so
 * dated). `first: 'single'`: both dictionaries print the single form first (bus: "bused or bussed").
 */
export const consonantVariants: Readonly<Record<string, {
  readonly first: 'double' | 'single';
  readonly single: { readonly region?: Region; readonly usage?: 'dated' };
}>> = {
  kidnap: { first: 'double', single: { region: 'US' } },
  worship: { first: 'double', single: { region: 'US' } },
  corral: { first: 'double', single: { region: 'US' } },
  program: { first: 'double', single: { usage: 'dated' } },
  nonplus: { first: 'double', single: { usage: 'dated' } },
  bus: { first: 'single', single: {} },
};

/** Verbs whose final consonant is silent and never doubles (debuted: LDOCE and AHD). */
export const noDoubling: ReadonlySet<string> = new Set(['debut']);

/** Verbs that keep their final e before -ing (being, singeing). */
export const keepsE: ReadonlySet<string> = new Set(['be', 'singe']);

/** Verbs that drop their final e before -ing, with a British variant that keeps it (LDOCE: "aging or ageing British English"). */
export const keepsEBritish: ReadonlySet<string> = new Set(['age']);

/** Verbs ending in consonant + o or in ch that take only -s (LDOCE / AHD: solos, demos, stomachs). */
export const plainS: ReadonlySet<string> = new Set(['solo', 'demo', 'disco', 'photo', 'ditto', 'stomach']);

/** Verbs ending in consonant + o or in an ambiguous ch that take -es (LDOCE and AHD: vetoes, echoes, psyches). */
export const takesEs: ReadonlySet<string> = new Set(['veto', 'echo', 'psych', 'tango']);

/** Verbs written with -es and also with -s only (tango: LDOCE tangoes, AHD tangos). */
export const sVariant: ReadonlySet<string> = new Set(['tango']);

/** Verbs whose final l is single in standard spelling, with a doubled British variant (LDOCE: "paralleled also parallelled British English"). */
export const lNotDoubled: ReadonlySet<string> = new Set(['parallel']);

/** Verbs that are also modal verbs; this pack conjugates the ordinary verb (LDOCE can³ "canned", will³ "willed"). */
export const notModal: ReadonlySet<string> = new Set(['can', 'will']);

/** Verbs used mostly in the imperative and the infinitive (LDOCE beware: "transitive only in imperative and infinitive"). */
export const mostlyImperative: ReadonlySet<string> = new Set(['beware']);

/** Modal verbs: they have no infinitive, participles or -s, and are rejected. */
export const modals: ReadonlySet<string> = new Set(['must', 'ought', 'shall', 'should', 'would', 'could', 'might', 'may']);

/** Whether a side list records `lemma`: its spelling was read in the dictionaries, so the pack assumes nothing about it. */
export function sideListed(lemma: string): boolean {
  return [finalStress, nonFinalStress, doublesUnstressed, noDoubling, keepsE, keepsEBritish, plainS, takesEs, lNotDoubled, notModal, mostlyImperative]
    .some(list => list.has(lemma)) || Object.hasOwn(consonantVariants, lemma);
}
