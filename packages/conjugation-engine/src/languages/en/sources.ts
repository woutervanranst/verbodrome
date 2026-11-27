import type { Citation, Work } from '../../core/sources.js';
import { ConjugationError } from '../../errors.js';
import type { englishRules } from './rules.js';

/**
 * The works the English pack cites (design §1). CGEL is cited by chapter only: its chapter numbers 2, 3 and 18 were
 * checked against the book's contents as Wikipedia lists them; section numbers and chapter 10 are unverified (the
 * publisher's pages refuse automated reading), and Quirk et al. was not opened (design Q1).
 */
export const englishWorks = {
  cgel: {
    id: 'cgel', title: 'The Cambridge Grammar of the English Language', author: 'Rodney Huddleston and Geoffrey K. Pullum', year: 2002,
    url: 'https://doi.org/10.1017/9781316423530',
  },
  quirk: {
    id: 'quirk', title: 'A Comprehensive Grammar of the English Language',
    author: 'Randolph Quirk, Sidney Greenbaum, Geoffrey Leech and Jan Svartvik', year: 1985,
  },
  dfe: {
    id: 'dfe', title: 'The national curriculum in England: English Appendix 1: Spelling', author: 'Department for Education', year: 2013,
    url: 'https://assets.publishing.service.gov.uk/media/5a7ccc06ed915d63cc65ce61/English_Appendix_1_-_Spelling.pdf',
  },
  utwente: {
    id: 'utwente', title: 'English Style Guide: Tricky spelling of common words', author: 'University of Twente Language Centre',
    url: 'https://www.utwente.nl/en/language-centre/translation-editing-services/english-styleguide/tricky/spelling/',
  },
  ldoce: { id: 'ldoce', title: 'Longman Dictionary of Contemporary English Online', author: 'Pearson Longman', url: 'https://www.ldoceonline.com/' },
  ahd: {
    id: 'ahd', title: 'The American Heritage Dictionary of the English Language, 5th edition', author: 'Houghton Mifflin Harcourt',
    url: 'https://www.ahdictionary.com/',
  },
} as const satisfies Record<string, Work>;

const cgel = (locator: string): Citation => ({ work: 'cgel', locator });
const dfe = (page: number, locator: string): Citation => ({ work: 'dfe', locator: `p. ${page}, ${locator}`, url: englishWorks.dfe.url });
const utwente = (locator: string): Citation => ({ work: 'utwente', locator, url: englishWorks.utwente.url });
const ldoce = (lemma: string, locator = 'verb entry header'): Citation =>
  ({ work: 'ldoce', locator: `${lemma}, ${locator}`, url: `https://www.ldoceonline.com/dictionary/${lemma}` });
const ahd = (lemma: string, locator = 'verb entry, inflected forms'): Citation =>
  ({ work: 'ahd', locator: `${lemma}, ${locator}`, url: `https://www.ahdictionary.com/word/search.html?q=${lemma}` });

const theVerb = cgel('ch. 3 "The verb"');
const inflection = cgel('ch. 18 "Inflectional morphology and related matters"');

/** Which dictionaries a lexicon entry or side-list verb was checked in (by reading the page for the lemma). */
export type LexiconCheck = 'ldoce+ahd' | 'ldoce' | 'ahd';

/** Where each rule is described. */
export const englishCitations = {
  'en.classify.lexicon': [ldoce('swim', 'verb entry header: past tense, past participle'), ahd('swim')],
  'en.classify.suppletive': [theVerb, ahd('be')],
  'en.classify.homograph': [ldoce('hang', 'verb entry, sense 3 "hanged"'), ahd('hang', 'verb, transitive sense 3 "hanged"')],
  'en.classify.prefixed': [{ work: 'quirk', locator: 'Appendix I, Word-formation: prefixation' }, ahd('overcome'), ldoce('overcome')],
  'en.classify.no-inherit': [ahd('behave'), ldoce('behave', 'verb table'), ahd('relay')],
  'en.classify.assume-regular': [inflection, theVerb],
  'en.classify.hint-regular': theVerb,
  'en.classify.hint-irregular': theVerb,
  'en.classify.stress-listed': [ldoce('prefer', 'pronunciation and inflected forms'), ahd('prefer', 'pronunciation and inflected forms')],
  'en.classify.stress-hint': dfe(11, 'Years 3–4: adding vowel suffixes to words of more than one syllable'),
  'en.classify.assume-final-stress': [dfe(11, 'Years 3–4: adding vowel suffixes to words of more than one syllable'), inflection],
  'en.classify.assume-nonfinal-stress': dfe(11, 'Years 3–4: the consonant is not doubled if the syllable is unstressed'),
  'en.classify.keeps-e': [dfe(8, 'Year 2: adding -ing to a word ending in -e, "Exception: being"'), ahd('singe')],
  'en.classify.doubles-unstressed': [utwente('doubling of consonants: formatted, handicapped, kidnapped, worshipped'), ldoce('kidnap'), ahd('program')],
  'en.classify.l-not-doubled': utwente('doubling of a final -l: exception parallel, paralleled'),
  'en.classify.plain-s': [ahd('solo'), ldoce('stomach', 'verb table: stomachs'), ahd('disco')],
  'en.classify.listed-regular': [ldoce('kidnap'), ahd('kidnap')],
  'en.classify.assume-es': [dfe(3, 'Year 1: adding s and es to words'), ldoce('veto'), ahd('tango'), ldoce('stomach', 'verb table: stomachs')],
  'en.classify.es-hint': dfe(3, 'Year 1: adding s and es to words'),
  'en.classify.silent-consonant': [ldoce('debut', 'verb table: debuted'), ahd('debut')],
  'en.classify.not-modal': [ldoce('can', 'can³, verb: canned'), ldoce('will', 'will³, verb: willed'), ahd('can')],
  'en.classify.mostly-imperative': ldoce('beware', 'verb [intransitive, transitive only in imperative and infinitive]'),
  'en.cell.past-listed': [ldoce('swim', 'verb entry header: past tense'), ahd('swim')],
  'en.cell.participle-listed': [ldoce('swim', 'verb entry header: past participle'), ahd('swim')],
  'en.cell.has': [ahd('have'), ldoce('have', 'auxiliary entry header: third person singular has')],
  'en.cell.be': [theVerb, ahd('be')],
  'en.cell.irrealis-were': [ahd('were', 'entry: past subjunctive of be'), theVerb],
  'en.end.present-plain': theVerb,
  'en.end.third-s': dfe(3, 'Year 1: adding s and es to words (plural of nouns and the third person singular of verbs)'),
  'en.end.past-ed': dfe(3, 'Year 1: adding the endings -ing, -ed and -er to verbs'),
  'en.end.irrealis-past': theVerb,
  'en.end.subjunctive-plain': theVerb,
  'en.end.imperative-plain': theVerb,
  'en.end.plain-form': theVerb,
  'en.end.ing': dfe(3, 'Year 1: adding the endings -ing, -ed and -er to verbs'),
  'en.end.participle-ed': dfe(3, 'Year 1: adding the endings -ing, -ed and -er to verbs'),
  'en.orth.es-sibilant': dfe(3, 'Year 1: adding s and es, "catches"'),
  'en.orth.es-o': [ldoce('veto'), ahd('veto'), ahd('echo')],
  'en.orth.y-to-i': dfe(8, 'Year 2: adding -es, -ed, -er and -est to a root word ending in -y with a consonant before it'),
  'en.orth.ie-to-y': [ldoce('die'), ahd('tie')],
  'en.orth.e-plus-ed': dfe(8, 'Year 2: adding the endings -ing, -ed, -er, -est and -y to words ending in -e with a consonant before it'),
  'en.orth.drop-e': dfe(8, 'Year 2: adding the endings -ing, -ed, -er, -est and -y to words ending in -e with a consonant before it ("Exception: being")'),
  'en.orth.c-to-ck': [ldoce('panic'), ahd('panic'), ahd('picnic'), ldoce('bivouac')],
  'en.orth.double-consonant': [
    dfe(8, 'Year 2: adding -ing, -ed, -er, -est and -y to words of one syllable ending in a single consonant letter after a single vowel letter'),
    dfe(11, 'Years 3–4: adding vowel suffixes to words of more than one syllable (forgetting, beginning, preferred)'),
    utwente('doubling of consonants'),
  ],
  'en.orth.double-l-british': [utwente('doubling of a final -l after a short vowel'), ldoce('travel'), ldoce('cancel')],
  'en.orth.single-l-american': [ahd('travel'), ldoce('travel', 'verb entry header: traveled American English')],
  'en.orth.single-consonant-american': [ldoce('kidnap', 'verb entry header: also kidnaped American English'), ldoce('worship')],
  'en.orth.spelling-variant': [ldoce('age', 'verb: aging or ageing British English'), ldoce('bus'), ahd('program'), ahd('tango')],
  'en.periphrasis.perfect': theVerb,
  'en.periphrasis.pluperfect': theVerb,
  'en.periphrasis.future': [theVerb, ldoce('will', 'modal verb, sense 1: "used to make future tenses"')],
  'en.periphrasis.future-perfect': theVerb,
  'en.periphrasis.present-progressive': theVerb,
  'en.periphrasis.past-progressive': theVerb,
  'en.periphrasis.perfect-progressive': theVerb,
  'en.periphrasis.pluperfect-progressive': theVerb,
  'en.periphrasis.future-progressive': theVerb,
  'en.periphrasis.future-perfect-progressive': theVerb,
  'en.periphrasis.conditional': [theVerb, ldoce('would', 'modal verb, sense 2: the result of an imagined situation')],
  'en.periphrasis.conditional-perfect': [theVerb, ldoce('would', 'modal verb, sense 2: something that did not happen')],
  'en.periphrasis.conditional-progressive': theVerb,
  'en.periphrasis.conditional-perfect-progressive': theVerb,
  'en.periphrasis.subjunctive-perfect': theVerb,
  'en.periphrasis.subjunctive-pluperfect': theVerb,
  'en.periphrasis.lets': [
    { work: 'ldoce', locator: 'let\'s, entry: "the short form of let us, used especially to make suggestions"', url: 'https://www.ldoceonline.com/dictionary/let-s' },
    cgel('ch. 10 "Clause type and illocutionary force"'),
  ],
  'en.periphrasis.to-infinitive': theVerb,
  'en.clause.subject': cgel('ch. 2 "Syntactic overview"'),
  'en.clause.imperative-subject': cgel('ch. 10 "Clause type and illocutionary force"'),
} as const satisfies Record<keyof typeof englishRules, Citation | readonly Citation[]>;


/**
 * Where each irregular verb of the lexicon was read, verb by verb (a literal record: a new entry is not checked until
 * it is written here). Section A was read for the design on 2026-11-24 (design §5.1), section B for stint 1 on
 * 2026-11-24, section C after the stint-1 review on 2026-11-25, each at
 * https://www.ldoceonline.com/dictionary/<lemma> and https://www.ahdictionary.com/word/search.html?q=<lemma>.
 */
export const lexiconChecked: Readonly<Record<string, LexiconCheck>> = {
  // A
  awake: 'ldoce+ahd', bear: 'ldoce+ahd', beat: 'ldoce+ahd', bend: 'ldoce+ahd', bet: 'ldoce+ahd', bid: 'ldoce+ahd', broadcast: 'ldoce+ahd', burn: 'ldoce+ahd',
  cast: 'ldoce+ahd', dive: 'ldoce+ahd', dream: 'ldoce+ahd', dwell: 'ldoce+ahd', fit: 'ldoce+ahd', forbid: 'ldoce+ahd', forecast: 'ldoce+ahd', forget: 'ldoce+ahd',
  get: 'ldoce+ahd', hang: 'ldoce+ahd', input: 'ldoce+ahd', kneel: 'ldoce+ahd', knit: 'ldoce+ahd', lean: 'ldoce+ahd', leap: 'ldoce+ahd', learn: 'ldoce+ahd',
  lie: 'ldoce+ahd', light: 'ldoce+ahd', mow: 'ldoce+ahd', plead: 'ldoce+ahd', prove: 'ldoce+ahd', quit: 'ldoce+ahd', rid: 'ldoce+ahd', sew: 'ldoce+ahd',
  shine: 'ldoce+ahd', show: 'ldoce+ahd', shrink: 'ldoce+ahd', shut: 'ldoce+ahd', sing: 'ldoce+ahd', sink: 'ldoce+ahd', slay: 'ldoce+ahd', slide: 'ldoce+ahd',
  smell: 'ldoce+ahd', sneak: 'ldoce+ahd', sow: 'ldoce+ahd', speed: 'ldoce+ahd', spell: 'ldoce+ahd', spill: 'ldoce+ahd', spin: 'ldoce+ahd', spit: 'ldoce+ahd',
  spoil: 'ldoce+ahd', spring: 'ldoce+ahd', stink: 'ldoce+ahd', strike: 'ldoce+ahd', strive: 'ldoce+ahd', swell: 'ldoce+ahd', thrive: 'ldoce+ahd', tread: 'ldoce+ahd',
  wake: 'ldoce+ahd', weave: 'ldoce+ahd', wet: 'ldoce+ahd', wind: 'ldoce+ahd',
  // B
  be: 'ldoce+ahd', have: 'ldoce+ahd', do: 'ldoce+ahd', go: 'ldoce+ahd', burst: 'ldoce+ahd', cost: 'ldoce+ahd', cut: 'ldoce+ahd', hit: 'ldoce+ahd',
  hurt: 'ldoce+ahd', let: 'ldoce+ahd', put: 'ldoce+ahd', read: 'ldoce+ahd', set: 'ldoce+ahd', shed: 'ldoce+ahd', slit: 'ldoce+ahd', split: 'ldoce+ahd',
  spread: 'ldoce+ahd', thrust: 'ldoce+ahd', bind: 'ldoce+ahd', bleed: 'ldoce+ahd', breed: 'ldoce+ahd', bring: 'ldoce+ahd', build: 'ldoce+ahd', buy: 'ldoce+ahd',
  catch: 'ldoce+ahd', cling: 'ldoce+ahd', creep: 'ldoce+ahd', deal: 'ldoce+ahd', dig: 'ldoce+ahd', feed: 'ldoce+ahd', feel: 'ldoce+ahd', fight: 'ldoce+ahd',
  find: 'ldoce+ahd', flee: 'ldoce+ahd', fling: 'ldoce+ahd', grind: 'ldoce+ahd', hear: 'ldoce+ahd', hold: 'ldoce+ahd', keep: 'ldoce+ahd', lay: 'ldoce+ahd',
  lead: 'ldoce+ahd', leave: 'ldoce+ahd', lend: 'ldoce+ahd', lose: 'ldoce+ahd', make: 'ldoce+ahd', mean: 'ldoce+ahd', meet: 'ldoce+ahd', pay: 'ldoce+ahd',
  say: 'ldoce+ahd', seek: 'ldoce+ahd', sell: 'ldoce+ahd', send: 'ldoce+ahd', shoot: 'ldoce+ahd', sit: 'ldoce+ahd', sleep: 'ldoce+ahd', sling: 'ldoce+ahd',
  slink: 'ldoce+ahd', spend: 'ldoce+ahd', stand: 'ldoce+ahd', stick: 'ldoce+ahd', sting: 'ldoce+ahd', string: 'ldoce+ahd', sweep: 'ldoce+ahd', swing: 'ldoce+ahd',
  teach: 'ldoce+ahd', tell: 'ldoce+ahd', think: 'ldoce+ahd', weep: 'ldoce+ahd', win: 'ldoce+ahd', wring: 'ldoce+ahd', arise: 'ldoce+ahd', begin: 'ldoce+ahd',
  bite: 'ldoce+ahd', blow: 'ldoce+ahd', break: 'ldoce+ahd', choose: 'ldoce+ahd', draw: 'ldoce+ahd', drive: 'ldoce+ahd', eat: 'ldoce+ahd', fall: 'ldoce+ahd',
  fly: 'ldoce+ahd', forsake: 'ldoce+ahd', freeze: 'ldoce+ahd', give: 'ldoce+ahd', grow: 'ldoce+ahd', hide: 'ldoce+ahd', know: 'ldoce+ahd', ride: 'ldoce+ahd',
  rise: 'ldoce+ahd', see: 'ldoce+ahd', shake: 'ldoce+ahd', speak: 'ldoce+ahd', steal: 'ldoce+ahd', swear: 'ldoce+ahd', take: 'ldoce+ahd', tear: 'ldoce+ahd',
  throw: 'ldoce+ahd', wear: 'ldoce+ahd', write: 'ldoce+ahd', beget: 'ldoce+ahd', smite: 'ldoce+ahd', stride: 'ldoce+ahd', hew: 'ldoce+ahd', saw: 'ldoce+ahd',
  shear: 'ldoce+ahd', strew: 'ldoce+ahd', come: 'ldoce+ahd', drink: 'ldoce+ahd', ring: 'ldoce+ahd', run: 'ldoce+ahd', swim: 'ldoce+ahd', browbeat: 'ldoce+ahd',
  babysit: 'ldoce+ahd', hamstring: 'ldoce+ahd', partake: 'ldoce+ahd', proofread: 'ldoce+ahd', waylay: 'ldoce+ahd',
  // C (typeset, breastfeed, ghostwrite: LDOCE has no entry; see secondaryOnly)
  misspell: 'ldoce+ahd', output: 'ldoce+ahd', retrofit: 'ldoce+ahd', shoe: 'ldoce+ahd', beseech: 'ldoce+ahd', wed: 'ldoce+ahd', typeset: 'ahd', breastfeed: 'ahd',
  ghostwrite: 'ahd',
};

/**
 * The side lists (lexicon.ts), each verb read in LDOCE and AHD for its inflected forms and stress on 2026-11-24, except
 * where `secondaryOnly` says otherwise.
 */
export const sideListsChecked: Readonly<Record<string, LexiconCheck>> = {
  // finalStress
  abet: 'ldoce+ahd', abhor: 'ldoce+ahd', acquit: 'ldoce+ahd', admit: 'ldoce+ahd', appal: 'ldoce', commit: 'ldoce+ahd',
  compel: 'ldoce+ahd', concur: 'ldoce+ahd', confer: 'ldoce+ahd', control: 'ldoce+ahd', defer: 'ldoce+ahd', deter: 'ldoce+ahd',
  dispel: 'ldoce+ahd', distil: 'ldoce+ahd', emit: 'ldoce+ahd', enrol: 'ldoce+ahd', equip: 'ldoce+ahd', excel: 'ldoce+ahd',
  expel: 'ldoce+ahd', extol: 'ldoce+ahd', fulfil: 'ldoce+ahd', impel: 'ldoce+ahd', incur: 'ldoce+ahd', infer: 'ldoce+ahd',
  instil: 'ldoce+ahd', occur: 'ldoce+ahd', omit: 'ldoce+ahd', patrol: 'ldoce+ahd', permit: 'ldoce+ahd', prefer: 'ldoce+ahd',
  propel: 'ldoce+ahd', rebel: 'ldoce+ahd', recur: 'ldoce+ahd', refer: 'ldoce+ahd', regret: 'ldoce+ahd', remit: 'ldoce+ahd',
  repel: 'ldoce+ahd', submit: 'ldoce+ahd', transfer: 'ldoce+ahd', transmit: 'ldoce+ahd',
  // nonFinalStress
  combat: 'ldoce+ahd', conquer: 'ldoce+ahd', debit: 'ldoce+ahd', enter: 'ldoce+ahd', interpret: 'ldoce+ahd', profit: 'ldoce+ahd',
  prosper: 'ldoce+ahd',
  // noInherit
  behave: 'ldoce+ahd', belie: 'ldoce+ahd', befit: 'ldoce+ahd', refit: 'ldoce+ahd', outfit: 'ldoce+ahd', relay: 'ldoce+ahd',
  welcome: 'ldoce+ahd', belay: 'ldoce+ahd',
  // doublesUnstressed, keepsE, plainS, lNotDoubled
  format: 'ldoce+ahd', handicap: 'ldoce+ahd', kidnap: 'ldoce+ahd', program: 'ldoce+ahd', worship: 'ldoce+ahd', input: 'ldoce+ahd',
  babysit: 'ldoce+ahd', singe: 'ldoce+ahd', solo: 'ldoce+ahd', parallel: 'ldoce+ahd',
  // Added after the stint-1 review (read 2026-11-25).
  allot: 'ldoce+ahd', annul: 'ldoce+ahd', corral: 'ldoce+ahd', nonplus: 'ahd', devil: 'ahd', revel: 'ldoce+ahd', bevel: 'ahd',
  debut: 'ldoce+ahd', eavesdrop: 'ldoce+ahd', sidestep: 'ldoce+ahd', zigzag: 'ldoce+ahd', bus: 'ldoce+ahd', age: 'ldoce+ahd',
  demo: 'ldoce', disco: 'ahd', photo: 'ahd', ditto: 'ahd', stomach: 'ldoce+ahd', psych: 'ldoce+ahd', tango: 'ldoce+ahd',
  veto: 'ldoce+ahd', echo: 'ldoce+ahd', can: 'ldoce+ahd', will: 'ldoce+ahd', beware: 'ldoce+ahd', reprove: 'ldoce+ahd',
  retread: 'ahd',
};

/** Prefixed verbs read to confirm that inheritance through the prefixes added after the review gives their forms. */
export const derivativesChecked: Readonly<Record<string, LexiconCheck>> = {
  offset: 'ldoce+ahd', sublet: 'ldoce+ahd', inset: 'ldoce+ahd', prepay: 'ldoce+ahd', interweave: 'ldoce+ahd', interbreed: 'ldoce+ahd',
  preset: 'ahd', inlay: 'ahd',
};

/** Entries checked in one dictionary only, and why. */
export const secondaryOnly: Readonly<Record<string, string>> = {
  appal: 'AHD has no entry for the British spelling appal (its search finds none); LDOCE prints appal, appalled with the stress on -pal.',
  typeset: 'LDOCE has no entry (its page offers spelling suggestions); AHD prints typeset, typesetting.',
  breastfeed: 'LDOCE has no entry under this spelling (it suggests breast-feed); AHD prints breastfed, breastfeeding.',
  ghostwrite: 'LDOCE has no entry (its page offers spelling suggestions); AHD prints ghostwrote, ghostwritten.',
  nonplus: 'LDOCE has no verb entry; AHD prints nonplussed, nonplussing also nonplused, with the stress on -plus.',
  devil: 'LDOCE has no verb entry; AHD prints deviled or devilled, with the stress on the first syllable.',
  bevel: 'LDOCE has no verb entry; AHD prints beveled or bevelled, with the stress on the first syllable.',
  demo: 'AHD prints no inflected forms for the verb; the LDOCE verb table prints demos, demoed.',
  disco: 'LDOCE has no verb entry; AHD prints discoed, discoing, discos.',
  photo: 'LDOCE has no verb entry for photo (its verb is photograph); AHD prints photoed, photoing, photos.',
  ditto: 'LDOCE has no verb entry; AHD prints dittoed, dittoing, dittos.',
  retread: 'LDOCE has no verb entry; AHD prints retreaded, retreading, retreads.',
  preset: 'The LDOCE verb entry prints no forms; AHD prints preset, presetting.',
  inlay: 'LDOCE has no verb entry; AHD prints inlaid, inlaying.',
};

/**
 * The dictionaries a verb was checked in, as a step param: `both`, `ldoce` or `ahd`. Every verb the lexicon or a side
 * list records has a check; asking for another is a pack bug.
 */
export function checkedIn(lemma: string): 'both' | 'ldoce' | 'ahd' {
  const check = Object.hasOwn(lexiconChecked, lemma) ? lexiconChecked[lemma] : Object.hasOwn(sideListsChecked, lemma) ? sideListsChecked[lemma] : undefined;
  if (check === undefined) throw new ConjugationError('GENERATION_FAILURE', `The English lexicon records no dictionary check for ${lemma}.`);
  return check === 'ldoce+ahd' ? 'both' : check;
}
