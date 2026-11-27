import { italianLexicon } from './lexicon.js';
import type { ItalianEntry, PastSeries, WholeForm } from './lexicon.js';

/**
 * Derived verbs take over the irregular forms of their base (grammar design §3.4), never its auxiliary.
 *
 * - Distinctive-suffix families: any verb ending in -durre, -porre, -trarre or -cludere is conjugated like condurre,
 *   porre, trarre or concludere; the members below are listed (checked in the Vocabolario, which says "coniug. come
 *   porre"), any other is an assumption.
 * - Prefix families: a closed list of prefixes before an irregular verb of the lexicon of at least six letters
 *   (ri + prendere, com + mettere), also with the doubled consonant of assimilation (a-t-tendere, sopra-v-vivere), and
 *   recursively (ri + scoprire, s + coprire).
 * - Short bases (fare, dire, dare, stare) only through their explicit lists, since a prefix before them is not reliable.
 */

const suffixFamilies: Readonly<Record<string, { readonly model: string; readonly members: readonly string[] }>> = {
  durre: { model: 'condurre', members: ['addurre', 'dedurre', 'indurre', 'introdurre', 'produrre', 'ridurre', 'sedurre'] },
  porre: { model: 'porre', members: ['comporre', 'deporre', 'disporre', 'esporre', 'imporre', 'opporre', 'proporre', 'riporre', 'supporre'] },
  trarre: { model: 'trarre', members: ['attrarre', 'contrarre', 'distrarre', 'estrarre', 'ritrarre', 'sottrarre'] },
  cludere: { model: 'concludere', members: ['accludere', 'escludere', 'includere', 'precludere'] },
  // Vocabolario: "coniug. come accludere / assumere / annettere / distruggere / emergere"; the headers of the -sistere,
  // -primere, -ludere and -cidere verbs print the same strong forms as their model.
  sistere: {
    model: 'esistere',
    members: ['assistere', 'coesistere', 'consistere', 'desistere', 'insistere', 'persistere', 'preesistere', 'resistere', 'sussistere'],
  },
  primere: { model: 'esprimere', members: ['comprimere', 'deprimere', 'imprimere', 'opprimere', 'reprimere', 'sopprimere'] },
  ludere: { model: 'alludere', members: ['deludere', 'illudere'] },
  cidere: { model: 'decidere', members: ['coincidere', 'incidere'] },
  sumere: { model: 'assumere', members: ['presumere', 'riassumere'] },
  nettere: { model: 'annettere', members: ['connettere'] },
  struggere: { model: 'distruggere', members: ['struggere'] },
  mergere: { model: 'emergere', members: ['sommergere'] },
};

/**
 * Derived verbs the prefix list does not find, each with its base: those of the short verbs fare, dire, dare, stare,
 * sapere, andare (a prefix before them is not reliable) and two whose prefix is not a productive one.
 */
const listedBases: Readonly<Record<string, string>> = {
  rifare: 'fare', disfare: 'fare', soddisfare: 'fare', contraffare: 'fare', sopraffare: 'fare', strafare: 'fare', assuefare: 'fare',
  liquefare: 'fare', putrefare: 'fare', rarefare: 'fare', stupefare: 'fare', tumefare: 'fare',
  predire: 'dire', contraddire: 'dire', disdire: 'dire', ridire: 'dire', interdire: 'dire', benedire: 'dire', maledire: 'dire',
  ridare: 'dare', sottostare: 'stare', soprastare: 'stare', ristare: 'stare', risapere: 'sapere', riandare: 'andare',
  appartenere: 'tenere',
};

/**
 * Derived verbs whose Vocabolario header was read and says "coniug. come" their base (or prints its forms): found by
 * prefix, they are listed facts, not assumptions.
 */
const listedDerivatives: ReadonlySet<string> = new Set([
  'raccogliere', 'raggiungere', 'rimpiangere', 'sottintendere', 'equivalere', 'sostenere', 'soprassedere', 'scommettere', 'ottenere',
  'mantenere', 'contenere', 'trattenere', 'attendere', 'sorprendere', 'comprendere', 'permettere', 'promettere', 'ammettere',
  'descrivere', 'iscrivere', 'soccorrere', 'interrompere', 'convincere', 'coinvolgere', 'accogliere', 'aggiungere', 'possedere',
  'intravedere', 'rinascere', 'ricadere', 'decadere', 'riapparire', 'rivenire', 'confondere', 'diffondere', 'infondere', 'riaprire',
  'ricoprire', 'scoprire', 'riscoprire', 'risalire', 'riuscire', 'avvenire', 'divenire', 'intervenire', 'pervenire', 'provenire',
  'svenire', 'sopravvenire', 'convenire', 'prevenire', 'accadere', 'scadere', 'dispiacere', 'occorrere', 'accorrere', 'percorrere',
  'ricorrere', 'risorgere', 'decrescere', 'sopravvivere', 'convivere', 'scomparire', 'ricuocere', 'stracuocere',
]);

/** The derived verbs listed by name: the members of the suffix families, the listed bases and derivatives. */
export const listedFamilyMembers: readonly string[] = [
  ...Object.values(suffixFamilies).flatMap(family => family.members), ...Object.keys(listedBases), ...listedDerivatives,
];

/**
 * The closed prefix list. `sott` and `sopr` are sotto- and sopra- elided before a vowel (sott-intendere); a prefix that
 * ends in a vowel may double the base's first consonant (a-t-tendere, ra-c-cogliere, sopra-v-vivere).
 */
export const prefixes: readonly string[] = [
  'a', 'ab', 'ac', 'ad', 'af', 'ag', 'al', 'am', 'an', 'ap', 'ar', 'as', 'at', 'av', 'co', 'com', 'con', 'cor', 'col', 'contra', 'contro', 'de',
  'di', 'dis', 'e', 'equi', 'es', 'ex', 'fra', 'i', 'im', 'in', 'ir', 'inter', 'intra', 'intro', 'man', 'o', 'ob', 'oc', 'op', 'per', 'pos',
  'pre', 'pro', 'ra', 're', 'ri', 'rim', 'rin', 's', 'sc', 'so', 'sop', 'sopr', 'sor', 'sos', 'sot', 'sott', 'sotto', 'sopra', 'sovra', 'sov',
  'stra', 'sub', 'super', 'tra', 'tras',
];
const elided: ReadonlySet<string> = new Set(['sott', 'sopr']);

/**
 * Verbs that only look like a prefix and a known verb (`noInherit`), and verbs that come from a known verb but are
 * conjugated differently (`derivedDifferently`): both are conjugated on their own.
 */
export const noInherit: ReadonlyMap<string, string> = new Map([
  ['restare', 'stare'], ['prestare', 'stare'], ['costare', 'stare'], ['contrastare', 'stare'],
  ['mandare', 'dare'], ['guardare', 'dare'], ['sudare', 'dare'], ['ricordare', 'dare'],
  ['ardire', 'dire'], ['spedire', 'dire'], ['trasalire', 'salire'],
]);
export const derivedDifferently: ReadonlyMap<string, string> = new Map([['smentire', 'mentire'], ['sparire', 'apparire']]);

/** A lexicon verb that a prefix can be put before. */
function prefixBase(lemma: string): ItalianEntry | null {
  const entry = Object.hasOwn(italianLexicon, lemma) ? italianLexicon[lemma]! : null;
  return entry !== null && entry.class !== 'irregular' && lemma.length >= 6 ? entry : null;
}

export interface Family {
  /** What is put before the base, without a doubled consonant: com (comporre), ris (riscoprire), so (sostenere). */
  readonly prefix: string;
  /** The verb whose forms are taken over: a lexicon verb (tenere), or the model of a suffix family (condurre). */
  readonly base: string;
  /** For a suffix family, its ending (durre); null for a prefix family. */
  readonly suffix: string | null;
  /** The prefix doubles the base's first consonant (so-s-tenere). */
  readonly doubled: boolean;
  /** The base's lexical data with every stem and form moved onto the derived verb, without its auxiliary. */
  readonly entry: ItalianEntry;
  /** Not a listed member of its family: conjugated like it by assumption. */
  readonly assumed: boolean;
}

/** Replaces `from` at the start of `form` by `to`: condussi with con → pro is produssi. */
function moved(form: string, from: string, to: string): string {
  // `*` and `*isc` stand for the regular form, which the derived verb builds by rule on its own stem.
  if (form.startsWith('*')) return form;
  return form.startsWith(from) ? to + form.slice(from.length) : form;
}

/**
 * The base's entry for a verb that puts `to` where the base has `from`: every stem and strong form moves, whole-word
 * cells keep their text (the clause of `cell` prefixes them, with the written accent rule), the auxiliary is dropped.
 */
export function rebase(entry: ItalianEntry, from: string, to: string): ItalianEntry {
  const move = (forms: readonly string[] | undefined) => forms?.map(form => moved(form, from, to));
  const { auxiliaries: _, familyDrops, cells, ...rest } = entry;
  const present = entry.present === undefined ? undefined
    : Object.fromEntries(Object.entries(entry.present).map(([slot, stems]) => [slot, move(stems)!]));
  const series = entry.pastSeries?.map(item => (item.startsWith('=') ? `=${moved(item.slice(1), from, to)}` : item) as PastSeries);
  const kept = cells === undefined ? undefined : Object.fromEntries(Object.entries(cells).filter(([key]) => !familyDrops?.includes(key)));
  const derived: ItalianEntry = {
    ...rest,
    ...(entry.long === undefined ? {} : { long: moved(entry.long, from, to) }),
    ...(present === undefined ? {} : { present }),
    ...(entry.unstressed === undefined ? {} : { unstressed: move(entry.unstressed)! }),
    ...(entry.subjunctive === undefined ? {} : { subjunctive: move(entry.subjunctive)! }),
    ...(entry.past === undefined ? {} : { past: move(entry.past)! }),
    ...(series === undefined ? {} : { pastSeries: series }),
    ...(entry.participle === undefined ? {} : { participle: move(entry.participle)! }),
    ...(entry.future === undefined ? {} : { future: move(entry.future)! }),
    ...(entry.presentParticiple === undefined || entry.presentParticiple === null ? {} : { presentParticiple: move(entry.presentParticiple)! }),
    ...(entry.usage === undefined ? {} : { usage: Object.fromEntries(Object.entries(entry.usage).map(([form, usage]) => [moved(form, from, to), usage])) }),
    ...(kept === undefined ? {} : { cells: kept as Readonly<Record<string, readonly WholeForm[]>> }),
  };
  return derived;
}

function bySuffix(lemma: string): Family | null {
  for (const suffix of Object.keys(suffixFamilies).sort((a, b) => b.length - a.length)) {
    const { model, members } = suffixFamilies[suffix]!;
    if (!lemma.endsWith(suffix) || lemma === model) continue;
    const prefix = lemma.slice(0, -suffix.length);
    const entry = rebase(italianLexicon[model]!, model.slice(0, -suffix.length), prefix);
    return { prefix, base: model, suffix, doubled: false, entry, assumed: !members.includes(lemma) };
  }
  return null;
}

/**
 * The regular -are present forms the Vocabolario prints beside the forms of fare (soddisfare: "io soddisfàccio o
 * soddisfò o soddisfo, tu soddisfài o soddisfi, ... noi soddisfacciamo e fam. soddisfiamo"; disfare likewise).
 */
const regularAre: Readonly<Record<string, ItalianEntry['regularAre']>> = {
  soddisfare: { indicative: ['1sg', '2sg', '3sg', '1pl', '3pl'], subjunctive: ['1sg', '2sg', '3sg', '3pl'] },
  disfare: { indicative: ['1sg', '2sg', '3sg', '1pl', '3pl'], subjunctive: ['1sg', '2sg', '3sg', '1pl', '2pl', '3pl'] },
};

function byListedBase(lemma: string): Family | null {
  const base = Object.hasOwn(listedBases, lemma) ? listedBases[lemma]! : null;
  if (base === null) return null;
  const prefix = lemma.slice(0, -base.length);
  const entry = rebase(italianLexicon[base]!, '', prefix);
  const extra = regularAre[lemma];
  return { prefix, base, suffix: null, doubled: false, entry: extra === undefined ? entry : { ...entry, regularAre: extra }, assumed: false };
}

/** The ways `text` is one or two prefixes of the list; an elided prefix only before a vowel. */
function prefixSplits(text: string, next: string): boolean {
  const fits = (prefix: string, after: string) => !elided.has(prefix) || /^[aeiou]/u.test(after);
  if (prefixes.includes(text)) return fits(text, next);
  return prefixes.some(first => text.startsWith(first) && text.length > first.length && prefixes.includes(text.slice(first.length))
    && fits(first, text.slice(first.length)) && fits(text.slice(first.length), next));
}

/**
 * A lexicon verb of at least six letters after one or two prefixes, possibly with the doubled consonant of
 * assimilation; the longest base wins (ri + scoprire is ris + coprire: coprire is the lexicon verb).
 */
function byPrefix(lemma: string): Family | null {
  for (let cut = 1; cut <= lemma.length - 6; cut++) {
    const base = lemma.slice(cut);
    const entry = prefixBase(base);
    if (entry === null) continue;
    const before = lemma.slice(0, cut);
    const doubledBy = before.slice(0, -1);
    // The doubled consonant of assimilation follows one prefix that ends in a vowel (a-m-mettere, sopra-s-sedere).
    if (before.endsWith(base.charAt(0)) && /[aeiou]$/u.test(doubledBy) && !/[aeiou]/u.test(base.charAt(0)) && prefixes.includes(doubledBy)) {
      return { prefix: doubledBy, base, suffix: null, doubled: true, entry: rebase(entry, '', before), assumed: false };
    }
    if (prefixSplits(before, base)) return { prefix: before, base, suffix: null, doubled: false, entry: rebase(entry, '', before), assumed: false };
  }
  return null;
}

/** The family `base` (a lemma without -si) belongs to, or null. Listed lexicon verbs are not looked up here. */
export function resolveFamily(base: string): Family | null {
  if (noInherit.has(base) || derivedDifferently.has(base)) return null;
  const family = bySuffix(base) ?? byListedBase(base) ?? byPrefix(base);
  if (family === null || family.suffix !== null) return family;
  return { ...family, assumed: !listedDerivatives.has(base) && !Object.hasOwn(listedBases, base) };
}
