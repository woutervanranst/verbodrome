import type { Citation, Work } from '../../core/sources.js';
import { derivedDifferently, listedFamilyMembers, noInherit } from './families.js';
import { italianLexicon } from './lexicon.js';
import { avereVerbs, dualVerbs, essereVerbs, impersonalVerbs, iscBothVerbs, iscVerbs, nonIscVerbs, palatalVerbs, stressedIVerbs } from './lists.js';
import type { italianRules } from './rules.js';
import { readPages } from './verification.js';

/** The works the Italian pack cites (grammar design §1.1). */
export const italianWorks = {
  'treccani-edi': {
    id: 'treccani-edi', title: "Enciclopedia dell'Italiano", author: 'Istituto della Enciclopedia Italiana', year: 2010,
    url: 'https://www.treccani.it/enciclopedia/',
  },
  'treccani-lgi': { id: 'treccani-lgi', title: 'La grammatica italiana', author: 'Treccani', year: 2012, url: 'https://www.treccani.it/enciclopedia/' },
  'treccani-voc': { id: 'treccani-voc', title: 'Vocabolario Treccani', author: 'Istituto della Enciclopedia Italiana', url: 'https://www.treccani.it/vocabolario/' },
  serianni: {
    id: 'serianni', title: 'Grammatica italiana. Italiano comune e lingua letteraria', author: 'Luca Serianni', year: 1989,
  },
  dop: {
    id: 'dop', title: "DOP – Dizionario d'ortografia e di pronunzia", author: 'B. Migliorini, C. Tagliavini, P. Fiorelli',
    url: 'https://www.dizionario.rai.it/',
  },
} as const satisfies Record<string, Work>;

type Url = `https://${string}`;

/** Enciclopedia dell'Italiano entries (signed, 2010–2011). */
const edi = {
  coniugazione: "https://www.treccani.it/enciclopedia/coniugazione-verbale_(Enciclopedia-dell'Italiano)/",
  passatoRemoto: "https://www.treccani.it/enciclopedia/passato-remoto_(Enciclopedia-dell'Italiano)/",
  ausiliari: "https://www.treccani.it/enciclopedia/verbi-ausiliari_(Enciclopedia-dell'Italiano)/",
  enclitiche: "https://www.treccani.it/enciclopedia/parole-enclitiche_(Enciclopedia-dell'Italiano)/",
  clitici: "https://www.treccani.it/enciclopedia/clitici_(Enciclopedia-dell'Italiano)/",
  accento: "https://www.treccani.it/enciclopedia/accento-grafico_(Enciclopedia-dell'Italiano)/",
  sincope: "https://www.treccani.it/enciclopedia/sincope_(Enciclopedia-dell'Italiano)/",
  soggetto: "https://www.treccani.it/enciclopedia/soggetto_(Enciclopedia-dell'Italiano)/",
} as const satisfies Record<string, Url>;

/** La grammatica italiana entries (2012). */
const lgi = {
  incoativi: 'https://www.treccani.it/enciclopedia/verbi-incoativi_(La-grammatica-italiana)/',
  prima: 'https://www.treccani.it/enciclopedia/prima-coniugazione_(La-grammatica-italiana)/',
  seconda: 'https://www.treccani.it/enciclopedia/seconda-coniugazione_(La-grammatica-italiana)/',
  terza: 'https://www.treccani.it/enciclopedia/terza-coniugazione_(La-grammatica-italiana)/',
  imperativo: 'https://www.treccani.it/enciclopedia/imperativo_(La-grammatica-italiana)/',
  avereEssere: 'https://www.treccani.it/enciclopedia/avere-o-essere_(La-grammatica-italiana)/',
  concordanza: 'https://www.treccani.it/enciclopedia/concordanza_(La-grammatica-italiana)/',
  congiuntivo: 'https://www.treccani.it/enciclopedia/congiuntivo_(La-grammatica-italiana)/',
} as const satisfies Record<string, Url>;

/** The Vocabolario page of an entry (`venire`, `dovere2`). */
export const vocabolario = (entry: string): Url => `https://www.treccani.it/vocabolario/${entry}/`;

const encyclopedia = (page: keyof typeof edi, locator: string): Citation => ({ work: 'treccani-edi', locator, url: edi[page] });
const grammar = (page: keyof typeof lgi, locator: string): Citation => ({ work: 'treccani-lgi', locator, url: lgi[page] });
const entry = (lemma: string, locator = `s.v. ${lemma.replace(/\d$/u, '')}`): Citation => ({ work: 'treccani-voc', locator, url: vocabolario(lemma) });
/** The Vocabolario as the lexicon's source: each verb's own entry, whose header gives its forms and auxiliary. */
const perVerb: Citation = { work: 'treccani-voc', locator: "the verb's own entry (header)", url: 'https://www.treccani.it/vocabolario/' };
const serianni: Citation = { work: 'serianni', locator: 'cap. XI, Il verbo' };

/**
 * Sources whose locator or content has not been checked against the page or book. Serianni's paragraph numbers were not
 * checked (the print book was not at hand): every rule citing Serianni also cites a Treccani page that was read. The DOP
 * was not fetched and is not cited by any rule yet.
 */
export const unverifiedSources: Readonly<Record<string, { readonly unverified: true; readonly why: string }>> = {
  serianni: { unverified: true, why: 'Chapter XI paragraph numbers not checked: the print book was not at hand.' },
  dop: { unverified: true, why: 'Not fetched; listed only as the second witness for written accents.' },
};

/** Where each rule is stated (grammar design §4, §1.2). */
export const italianCitations = {
  'it.classify.lexicon': perVerb,
  'it.classify.conjugation': encyclopedia('coniugazione', 'Coniugazione verbale (R. Cimaglia, 2010), §2.1'),
  'it.classify.contracted': encyclopedia('coniugazione', 'Coniugazione verbale, §4 (porre < ponere, condurre < conducere)'),
  'it.classify.reflexive': grammar('avereEssere', 'Avere o essere?'),
  'it.classify.reflexive-essere': encyclopedia('ausiliari', 'Ausiliari, verbi (R. Cimaglia, 2010), §3'),
  'it.classify.family': perVerb,
  'it.classify.assume-family': encyclopedia('coniugazione', 'Coniugazione verbale, §4'),
  'it.classify.suffix-family': [perVerb, encyclopedia('coniugazione', 'Coniugazione verbale, §4')],
  'it.classify.prefix-doubling': perVerb,
  'it.classify.derived-differently': perVerb,
  'it.classify.no-inherit': perVerb,
  'it.classify.assume-regular': [encyclopedia('coniugazione', 'Coniugazione verbale, §4.1'), serianni],
  'it.classify.isc': grammar('incoativi', 'Incoativi, verbi'),
  'it.classify.no-isc': [perVerb, grammar('terza', 'Terza coniugazione')],
  'it.classify.isc-both': grammar('terza', 'Terza coniugazione'),
  'it.classify.assume-isc': encyclopedia('coniugazione', 'Coniugazione verbale, §4.1'),
  'it.classify.auxiliary': perVerb,
  'it.classify.auxiliaries': [perVerb, encyclopedia('ausiliari', 'Ausiliari, verbi, §3')],
  'it.classify.assume-inherit-auxiliary': [grammar('avereEssere', 'Avere o essere?'), perVerb],
  'it.classify.assume-avere': grammar('avereEssere', 'Avere o essere?'),
  'it.classify.stressed-i': grammar('prima', 'Prima coniugazione'),
  'it.classify.assume-unstressed-i': grammar('prima', 'Prima coniugazione'),
  'it.classify.hint': [encyclopedia('coniugazione', 'Coniugazione verbale, §2–4'), serianni],
  'it.avail.no-imperative': [entry('potere2'), entry('dovere2')],
  'it.avail.impersonal': [encyclopedia('ausiliari', 'Ausiliari, verbi, §3 (verbi atmosferici)'), entry('piovere')],
  'it.avail.defective': [entry('sapere2'), entry('parere2'), entry('potere2'), entry('solere')],
  'it.stem.infinitive': encyclopedia('coniugazione', 'Coniugazione verbale, §2.1'),
  'it.stem.long': encyclopedia('coniugazione', 'Coniugazione verbale, §4'),
  'it.stem.isc': grammar('incoativi', 'Incoativi, verbi'),
  'it.stem.lexical': perVerb,
  'it.stem.subjunctive-from-1sg': [entry('venire'), entry('uscire'), entry('salire'), serianni],
  'it.stem.subjunctive-from-1pl': [entry('dovere2'), entry('sapere2'), serianni],
  'it.stem.strong-past': encyclopedia('passatoRemoto', 'Passato remoto (E. Wiberg, 2011), §2b'),
  'it.stem.future': encyclopedia('coniugazione', 'Coniugazione verbale, §3d'),
  'it.stem.future-syncope': [perVerb, encyclopedia('sincope', 'Sincope (L. Romito, 2011), §3')],
  'it.stem.strong-participle': perVerb,
  'it.stem.palatal': [grammar('seconda', 'Seconda coniugazione'), entry('cuocere')],
  'it.cell.lexical': perVerb,
  'it.cell.prefix': perVerb,
  'it.end.present': encyclopedia('coniugazione', 'Coniugazione verbale, §2'),
  'it.end.imperfect': encyclopedia('coniugazione', 'Coniugazione verbale, §2'),
  'it.end.past': encyclopedia('passatoRemoto', 'Passato remoto, §2a'),
  'it.end.past-etti': grammar('seconda', 'Seconda coniugazione'),
  'it.end.past-strong': encyclopedia('passatoRemoto', 'Passato remoto, §2b'),
  'it.end.future': encyclopedia('coniugazione', 'Coniugazione verbale, §3d'),
  'it.end.future-ar-er': encyclopedia('coniugazione', 'Coniugazione verbale, §3d (amare habeo > amarò > amerò)'),
  'it.end.conditional': encyclopedia('coniugazione', 'Coniugazione verbale, §3e'),
  'it.end.subjunctive-present': [grammar('prima', 'Prima coniugazione (ripudino)'), serianni],
  'it.end.subjunctive-imperfect': [grammar('congiuntivo', 'Congiuntivo'), serianni],
  'it.end.imperative': [grammar('imperativo', 'Imperativo'), encyclopedia('coniugazione', 'Coniugazione verbale, §2.3')],
  'it.end.imperative-subjunctive': grammar('imperativo', 'Imperativo'),
  'it.end.infinitive': encyclopedia('coniugazione', 'Coniugazione verbale, §2.1'),
  'it.end.gerund': [encyclopedia('coniugazione', 'Coniugazione verbale, §2'), serianni],
  'it.end.present-participle': grammar('terza', 'Terza coniugazione (-ente / -iente)'),
  'it.end.participle': [grammar('concordanza', 'Concordanza'), serianni],
  'it.orth.velar-h': grammar('prima', 'Prima coniugazione'),
  'it.orth.palatal-i-drop': grammar('prima', 'Prima coniugazione'),
  'it.orth.i-merge': grammar('prima', 'Prima coniugazione'),
  'it.orth.stressed-i-kept': grammar('prima', 'Prima coniugazione (invìi, scìino)'),
  'it.orth.participle-ci': grammar('seconda', 'Seconda coniugazione (taciuto, cresciuto)'),
  'it.orth.final-accent': encyclopedia('accento', 'Accento grafico (S. Demartini; A. Viviani, 2010), §1'),
  'it.periphrasis.perfect': grammar('avereEssere', 'Avere o essere?'),
  'it.periphrasis.pluperfect': [grammar('avereEssere', 'Avere o essere? (mi ero vestito)'), serianni],
  'it.periphrasis.past-anterior': [grammar('avereEssere', 'Avere o essere?'), serianni],
  'it.periphrasis.future-perfect': [grammar('avereEssere', 'Avere o essere?'), serianni],
  'it.periphrasis.subjunctive-past': grammar('congiuntivo', 'Congiuntivo'),
  'it.periphrasis.subjunctive-pluperfect': grammar('congiuntivo', 'Congiuntivo'),
  'it.periphrasis.conditional-past': [grammar('avereEssere', 'Avere o essere?'), serianni],
  'it.periphrasis.infinitive-past': [grammar('avereEssere', 'Avere o essere?'), serianni],
  'it.periphrasis.gerund-past': [grammar('avereEssere', 'Avere o essere?'), serianni],
  'it.clause.subject': [encyclopedia('soggetto', 'Soggetto (M. Palermo, 2011), §7.1'), serianni],
  'it.clause.formal-subject': [grammar('imperativo', 'Imperativo'), serianni],
  'it.clause.agree-subject': grammar('concordanza', 'Concordanza'),
  'it.clause.avere-invariable': grammar('concordanza', 'Concordanza'),
  'it.clause.participle-forms': grammar('concordanza', 'Concordanza'),
  'it.clause.reflexive-pronoun': grammar('avereEssere', 'Avere o essere? (mi sono lavato)'),
  'it.clause.enclitic': encyclopedia('enclitiche', 'Parole enclitiche (L. Gaeta, 2011), §2–3'),
  'it.clause.infinitive-e-drop': encyclopedia('enclitiche', 'Parole enclitiche, §3 (farlo)'),
  'it.clause.enclitic-doubling': [
    encyclopedia('enclitiche', 'Parole enclitiche, §2'), entry('enclisi'), encyclopedia('clitici', 'Clitici (C. Schwarze, 2010), §3.1 (not gli)'),
  ],
  'it.clause.negative-infinitive': grammar('imperativo', 'Imperativo'),
  'it.clause.negative': grammar('imperativo', 'Imperativo'),
} as const satisfies Record<keyof typeof italianRules, Citation | readonly Citation[]>;

/**
 * Facts about a verb that its Vocabolario header does not state, with where they come from: the grammar design (from
 * memory, unverified), en.wiktionary (secondary), or the pack's reading of the entry's body.
 */
const otherSources: Readonly<Record<string, readonly { readonly fact: string; readonly source: 'grammar design' | 'en.wiktionary' | 'entry body' }[]>> = {
  parere: [{ fact: 'no imperative', source: 'grammar design' }, { fact: 'no present participle ("Non è usato il part. pres.")', source: 'entry body' }],
  sapere: [{ fact: 'no present participle ("Il part. pres. manca")', source: 'entry body' }],
  solere: [{ fact: 'only the simple indicative (not the future), the subjunctive and the present infinitive ("negli altri tempi è sostituito dalla locuz. essere solito")', source: 'entry body' }],
  sedere: [{ fact: 'auxiliary essere (the Vocabolario states none; the en.wiktionary table gives essere)', source: 'en.wiktionary' }],
  provenire: [{ fact: 'auxiliary essere (the header says only "coniug. come venire")', source: 'grammar design' }],
  muovere: [{ fact: 'avere or essere when intransitive ("aus. avere o essere, ma i tempi composti sono rari")', source: 'entry body' }],
  cuocere: [{ fact: 'essere when intransitive (sense 2: "intr. (aus. essere)")', source: 'entry body' }],
  udire: [{ fact: 'present participle udente o, meno com., udiente', source: 'entry body' }],
  dormire: [{ fact: 'present participle dormiente, also dormente (entry dormiente)', source: 'entry body' }],
  offrire: [{ fact: 'present participle offerente, offrente not in use (entry offerente)', source: 'entry body' }],
  seguire: [{ fact: 'essere in the intransitive use ("uso assol. e intr. (aus. essere)")', source: 'entry body' }],
  bastare: [{ fact: 'auxiliary essere (not stated in the header)', source: 'grammar design' }],
  soffrire: [{ fact: 'past participle sofferto (not in the header; used in the entry: "avrei sofferto")', source: 'entry body' }],
  spingere: [{ fact: 'past participle spinto (not in the header; used in the entry)', source: 'entry body' }],
  esistere: [{ fact: 'past participle esistito (not in the header; used in the entry: "non sono mai esistite")', source: 'entry body' }],
  esigere: [{ fact: 'past participle esatto ("Part. pass. esatto, poco com.")', source: 'entry body' }],
  espandere: [{ fact: 'past participle espanso ("Part. pass. espanso")', source: 'entry body' }],
  fare: [{ fact: 'present participle faciente o più com. facente', source: 'entry body' }],
  rifare: [{ fact: "imperative rifai, rifa' (the header says only \"coniug. come fare\")", source: 'en.wiktionary' }],
  predire: [{ fact: 'imperative predici (contraddire, benedire, maledire print -dici; predire says "coniug. come dire")', source: 'en.wiktionary' }],
  ridare: [{ fact: "imperative ridai, rida' (\"coniug. come dare\")", source: 'grammar design' }],
  sottostare: [{ fact: "imperative sottostai, sottosta' (\"coniug. come stare\")", source: 'grammar design' }],
};

export interface LexiconVerification {
  readonly url: Url;
  /** read: the Vocabolario page was read on `retrieved`; unread: it was not (the lemma has no page, or it was not fetched). */
  readonly status: 'read' | 'unread';
  readonly retrieved?: string;
  readonly otherSources?: readonly { readonly fact: string; readonly source: 'grammar design' | 'en.wiktionary' | 'entry body' }[];
}

/** Every lemma the lexicon, the side lists and the family lists name, with how it was checked. */
export const lexiconVerification: Readonly<Record<string, LexiconVerification>> = Object.fromEntries([
  ...Object.keys(italianLexicon), ...nonIscVerbs, ...iscVerbs, ...Object.keys(iscBothVerbs), ...essereVerbs, ...avereVerbs, ...Object.keys(dualVerbs),
  ...stressedIVerbs, ...palatalVerbs, ...impersonalVerbs, ...listedFamilyMembers, ...noInherit.keys(), ...derivedDifferently.keys(),
].map(lemma => {
  const read = Object.hasOwn(readPages, lemma) ? readPages[lemma]! : null;
  const facts = Object.hasOwn(otherSources, lemma) ? { otherSources: otherSources[lemma]! } : {};
  const record: LexiconVerification = read === null
    ? { url: vocabolario(lemma), status: 'unread', ...facts }
    : { url: vocabolario(read[0]), status: 'read', retrieved: read[1], ...facts };
  return [lemma, record];
}));

/** The Vocabolario page of a lemma: the one read for it, otherwise the plain lemma. */
export const vocabolarioOf = (lemma: string): Url => vocabolario(Object.hasOwn(readPages, lemma) ? readPages[lemma]![0] : lemma);
