import type { Citation, Work } from '../../core/sources.js';
import { irregulars } from './lexicon.js';
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
  'en.classify.plain-s': ahd('solo'),
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
  'en.orth.c-to-ck': [ldoce('panic'), ahd('panic'), ahd('picnic')],
  'en.orth.double-consonant': [
    dfe(8, 'Year 2: adding -ing, -ed, -er, -est and -y to words of one syllable ending in a single consonant letter after a single vowel letter'),
    dfe(11, 'Years 3–4: adding vowel suffixes to words of more than one syllable (forgetting, beginning, preferred)'),
    utwente('doubling of consonants'),
  ],
  'en.orth.double-l-british': [utwente('doubling of a final -l after a short vowel'), ldoce('travel'), ldoce('cancel')],
  'en.orth.single-l-american': [ahd('travel'), ldoce('travel', 'verb entry header: traveled American English')],
  'en.orth.single-consonant-american': [ldoce('kidnap', 'verb entry header: also kidnaped American English'), ahd('program')],
  'en.clause.subject': cgel('ch. 2 "Syntactic overview"'),
  'en.clause.imperative-subject': cgel('ch. 10 "Clause type and illocutionary force"'),
} as const satisfies Record<keyof typeof englishRules, Citation | readonly Citation[]>;

/** Which dictionaries a lexicon entry or side-list verb was checked in (by reading the page for the lemma). */
export type LexiconCheck = 'ldoce+ahd' | 'ldoce' | 'ahd';

/**
 * Every irregular verb of the lexicon was read in both LDOCE and AHD on 2026-11-24: design §5.1 for the design, design
 * §5.2 for this pack (no form was copied from the corpus or taken from memory).
 */
export const lexiconChecked: Readonly<Record<string, LexiconCheck>> = Object.fromEntries(
  Object.keys(irregulars).map(lemma => [lemma, 'ldoce+ahd' as const]),
);

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
};

/** Entries checked in one dictionary only, and why. */
export const secondaryOnly: Readonly<Record<string, string>> = {
  appal: 'AHD has no entry for the British spelling appal (its search finds none); LDOCE prints appal, appalled with the stress on -pal.',
};
