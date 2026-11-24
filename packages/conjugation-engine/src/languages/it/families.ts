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
};

/** Verbs built on fare, dire, dare and stare, which are too short to be found by their prefix. */
const shortBases: Readonly<Record<string, string>> = {
  rifare: 'fare', disfare: 'fare', soddisfare: 'fare', contraffare: 'fare', sopraffare: 'fare', strafare: 'fare', assuefare: 'fare',
  liquefare: 'fare', putrefare: 'fare', rarefare: 'fare', stupefare: 'fare', tumefare: 'fare',
  predire: 'dire', contraddire: 'dire', disdire: 'dire', ridire: 'dire', interdire: 'dire', benedire: 'dire', maledire: 'dire',
  ridare: 'dare', sottostare: 'stare', soprastare: 'stare',
};

/** The derived verbs listed by name: the members of the suffix families and the short-base lists. */
export const listedFamilyMembers: readonly string[] = [...Object.values(suffixFamilies).flatMap(family => family.members), ...Object.keys(shortBases)];

/** The closed prefix list, longest first. */
export const prefixes: readonly string[] = [
  'a', 'ab', 'ac', 'ad', 'af', 'ag', 'al', 'am', 'an', 'ap', 'ar', 'as', 'at', 'av', 'co', 'com', 'con', 'cor', 'col', 'contra', 'contro', 'de',
  'di', 'dis', 'e', 'es', 'ex', 'im', 'in', 'ir', 'inter', 'intra', 'intro', 'man', 'o', 'ob', 'oc', 'op', 'per', 'pos', 'pre', 'pro', 're',
  'ri', 'rin', 's', 'sc', 'so', 'sop', 'sor', 'sot', 'sotto', 'sopra', 'sovra', 'sov', 'stra', 'sub', 'super', 'tra', 'tras',
].sort((a, b) => b.length - a.length);

/** Verbs that only look like a prefix and a known verb: they are conjugated on their own (the look-alike base). */
export const noInherit: ReadonlyMap<string, string> = new Map([
  ['restare', 'stare'], ['prestare', 'stare'], ['costare', 'stare'], ['contrastare', 'stare'],
  ['mandare', 'dare'], ['guardare', 'dare'], ['sudare', 'dare'], ['ricordare', 'dare'],
  ['ardire', 'dire'], ['spedire', 'dire'], ['smentire', 'mentire'], ['sparire', 'apparire'],
]);

/** A lexicon verb that a prefix can be put before. */
function prefixBase(lemma: string): ItalianEntry | null {
  const entry = Object.hasOwn(italianLexicon, lemma) ? italianLexicon[lemma]! : null;
  return entry !== null && entry.class !== 'irregular' && lemma.length >= 6 ? entry : null;
}

export interface Family {
  /** What is put before the base: com (comporre), ri (riscoprire), assue (assuefare). */
  readonly prefix: string;
  /** The base named in explanations: porre, scoprire, durre (the -durre verbs). */
  readonly base: string;
  /** The base's lexical data with every stem and form moved onto the derived verb, without its auxiliary. */
  readonly entry: ItalianEntry;
  /** Not a listed member of its family: conjugated like it by assumption. */
  readonly assumed: boolean;
}

/** Replaces `from` at the start of `form` by `to`: condussi with con → pro is produssi. */
function moved(form: string, from: string, to: string): string {
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
  for (const [suffix, { model, members }] of Object.entries(suffixFamilies)) {
    if (!lemma.endsWith(suffix) || lemma === model) continue;
    const modelPrefix = model.slice(0, -suffix.length);
    const prefix = lemma.slice(0, -suffix.length);
    const base = modelPrefix === '' ? model : suffix;
    return { prefix, base, entry: rebase(italianLexicon[model]!, modelPrefix, prefix), assumed: !members.includes(lemma) };
  }
  return null;
}

function byShortBase(lemma: string): Family | null {
  const base = Object.hasOwn(shortBases, lemma) ? shortBases[lemma]! : null;
  if (base === null) return null;
  const prefix = lemma.slice(0, -base.length);
  return { prefix, base, entry: rebase(italianLexicon[base]!, '', prefix), assumed: false };
}

/** The verb a prefix leaves, and the prefix: a lexicon verb, or (recursively) a derived one. */
function byPrefix(lemma: string, depth = 0): Family | null {
  if (depth > 2) return null;
  for (const prefix of prefixes) {
    if (!lemma.startsWith(prefix) || lemma.length <= prefix.length) continue;
    const rest = lemma.slice(prefix.length);
    // Assimilation doubles the consonant after a prefix that ends in a vowel: a + t + tendere, sopra + v + vivere.
    const candidates: [string, string][] = [[prefix, rest]];
    if (/[aeiou]$/u.test(prefix) && rest.length > 2 && rest[0] === rest[1] && !/[aeiou]/u.test(rest[0]!)) candidates.push([prefix + rest[0], rest.slice(1)]);
    for (const [before, base] of candidates) {
      const entry = prefixBase(base);
      if (entry !== null) return { prefix: before, base, entry: rebase(entry, '', before), assumed: false };
      const inner = byPrefix(base, depth + 1);
      if (inner !== null && prefixBase(base) === null) return { prefix: before, base, entry: rebase(inner.entry, '', before), assumed: false };
    }
  }
  return null;
}

/** The family `base` (a lemma without -si) belongs to, or null. Listed lexicon verbs are not looked up here. */
export function resolveFamily(base: string): Family | null {
  if (noInherit.has(base)) return null;
  return bySuffix(base) ?? byShortBase(base) ?? byPrefix(base);
}
