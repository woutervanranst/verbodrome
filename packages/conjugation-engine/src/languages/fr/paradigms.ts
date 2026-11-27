/**
 * The data of the productive classes and of the formation rules (GD §3.1-3.2, §4.3, §4.4 rule 1): the three ending sets,
 * the formation endings that principal parts take, the -eler/-eter lists, and the label a productive verb reports.
 */
import { erEndings, irEndings, reEndings } from './ending-sets.js';
import type { SingularSet, Theme } from './family.js';

export { erEndings, irEndings, reEndings } from './ending-sets.js';

export type Group = 'er' | 'ir' | 're';

/** The 51 endings of each productive group, in cell order. */
export const groupEndings: Readonly<Record<Group, readonly string[]>> = { er: erEndings, ir: irEndings, re: reEndings };

/** Formation endings of the present singular, by the ending set of P1. */
export const presentSingular: Readonly<Record<SingularSet, readonly string[]>> = { e: ['e', 'es', 'e'], s: ['s', 's', 't'], x: ['x', 'x', 't'] };
export const presentPlural = ['ons', 'ez', 'ent'] as const;
/** The imparfait endings, which the conditionnel adds to the future stem. */
export const imperfect = ['ais', 'ais', 'ait', 'ions', 'iez', 'aient'] as const;
export const future = ['ai', 'as', 'a', 'ons', 'ez', 'ont'] as const;
export const subjunctive = ['e', 'es', 'e', 'ions', 'iez', 'ent'] as const;
export const simplePast: Readonly<Record<Theme, readonly string[]>> = {
  a: ['ai', 'as', 'a', 'âmes', 'âtes', 'èrent'],
  i: ['is', 'is', 'it', 'îmes', 'îtes', 'irent'],
  u: ['us', 'us', 'ut', 'ûmes', 'ûtes', 'urent'],
  in: ['ins', 'ins', 'int', 'înmes', 'întes', 'inrent'],
  ï: ['ïs', 'ïs', 'ït', 'ïmes', 'ïtes', 'ïrent'],
};
export const subjunctiveImperfect: Readonly<Record<Theme, readonly string[]>> = {
  a: ['asse', 'asses', 'ât', 'assions', 'assiez', 'assent'],
  i: ['isse', 'isses', 'ît', 'issions', 'issiez', 'issent'],
  u: ['usse', 'usses', 'ût', 'ussions', 'ussiez', 'ussent'],
  in: ['insse', 'insses', 'înt', 'inssions', 'inssiez', 'inssent'],
  ï: ['ïsse', 'ïsses', 'ït', 'ïssions', 'ïssiez', 'ïssent'],
};

/**
 * How an -eler/-eter verb writes the l or t before a silent e (GD §4.4 rule 1, JO 1990 II.5): `double` in both
 * spellings (appeler, jeter and their derivatives); `fork`, doubled in traditional spelling and è in the 1990 one (the
 * rest); `grave`, è in both (the verbs the Académie already conjugated like peler and acheter).
 */
export type ElerEterClass = 'double' | 'fork' | 'grave';

const elerEterSuffixes: Readonly<Record<ElerEterClass, readonly string[]>> = {
  double: ['appeler', 'jeter'],
  fork: ['eler', 'eter', 'cacheter', 'tacheter'],
  grave: [
    'geler', 'ciseler', 'marteler', 'modeler', 'harceler', 'écarteler', 'démanteler', 'encasteler',
    'acheter', 'bégueter', 'corseter', 'crocheter', 'fileter', 'fureter', 'haleter',
  ],
};
/** Verbs in -eler listed by name (not as a suffix) with the è of peler. */
const elerEterLemmas: Readonly<Record<string, ElerEterClass>> = { celer: 'grave', déceler: 'grave', receler: 'grave', peler: 'grave' };

/** The -eler/-eter class of an infinitive: its listed lemma first, otherwise the longest suffix that ends it. */
export function elerEterClass(lemma: string): ElerEterClass | null {
  if (Object.hasOwn(elerEterLemmas, lemma)) return elerEterLemmas[lemma]!;
  let best: { readonly kind: ElerEterClass; readonly length: number } | null = null;
  for (const [kind, suffixes] of Object.entries(elerEterSuffixes) as [ElerEterClass, readonly string[]][]) {
    for (const suffix of suffixes) {
      if (lemma.endsWith(suffix) && (best === null || suffix.length > best.length)) best = { kind, length: suffix.length };
    }
  }
  return best?.kind ?? null;
}

/** The vowels, as rules 2 and 3 tell them from consonants. */
const vowelLetters = 'aeiouyàâäéèêëîïôöùûüœæ';

/**
 * The endings that select the productive spelling classes besides the -eler/-eter lists (the legacy model selectors,
 * GD §3): an infinitive that is one of them, like the probe ïr, counts as listed, as it did.
 */
const productiveSuffixes: readonly string[] = [
  'er', 'cer', 'ger', 'emer', 'ener', 'eper', 'erer', 'eser', 'ever', 'evrer', 'ecer', 'écer', 'éger',
  ...['b', 'd', 'f', 'j', 'k', 'l', 'm', 'n', 'p', 'r', 's', 't', 'v', 'z', 'bl', 'br', 'ch', 'cl', 'cr', 'dr', 'fl', 'fr', 'gl', 'gn', 'gr', 'gu', 'ph', 'pl', 'pr', 'qu', 'th', 'tr', 'vr']
    .map(consonants => `é${consonants}er`),
  'ayer', 'oyer', 'uyer', 'eyer', 'éyer', 'ir', 'ïr', 'dre', 'tre', 're',
];

/** Whether a productive verb is listed by name: its infinitive is a listed lemma or a whole selector of its class. */
export function isListedProductive(lemma: string): boolean {
  return Object.hasOwn(elerEterLemmas, lemma) || Object.values(elerEterSuffixes).some(suffixes => suffixes.includes(lemma))
    || productiveSuffixes.includes(lemma);
}

/** The vowels, and the consonant or consonant cluster that opens the next syllable (GD §4.4). */
const vowel = vowelLetters;
const onset = 'bl|br|ch|cl|cr|dr|fl|fr|gl|gn|gr|gu|ph|pl|pr|qu|th|tr|vr|[bcdfgjklmnprstvz]';
/** A stem whose last syllable has a mute e (lev-, achet-, dépec-, zegu-): rule 2's trigger. */
export const muteEStem = new RegExp(`(^|[^${vowel}]|[gq]u)e(${onset})$`, 'u');
/** A stem whose last syllable has a closed é (céd-, régn-, protég-): rule 3's trigger. */
export const closedEStem = new RegExp(`é(${onset})$`, 'u');

/** A silent ending: e, es, ent, or one that starts with the er of the future and conditional (erai, erais). */
export function mute(ending: string): boolean {
  return ending === 'e' || ending === 'es' || ending === 'ent' || (ending.startsWith('er') && ending.length > 2);
}

/** The group of an infinitive by its ending: -er, -ir or -ïr (not -oir), -re. */
export function groupOf(lemma: string): Group | null {
  if (lemma.endsWith('er')) return 'er';
  if (/[iï]r$/u.test(lemma) && !lemma.endsWith('oir')) return 'ir';
  if (lemma.endsWith('re')) return 're';
  return null;
}

/**
 * The model id a productive verb reports (GD §3.2): computed from the spelling rules its stem triggers, first match
 * wins. It reproduces the legacy productive model ids.
 */
export function productiveLabel(lemma: string, group: Group): string {
  const stem = lemma.slice(0, -2);
  if (group === 'ir') return lemma.endsWith('ïr') ? 'ïr' : 'finir';
  if (group === 're') return /[dt]$/u.test(stem) ? 'rendre' : 'rompre';
  const elerEter = /e[lt]$/u.test(stem) ? elerEterClass(lemma) : null;
  if (elerEter === 'double') return stem.endsWith('l') ? 'appeler' : 'jeter';
  if (elerEter === 'fork') return stem.endsWith('l') ? 'renouveler' : 'feuilleter';
  if (muteEStem.test(stem)) return stem.endsWith('c') ? 'dépecer' : 'lever';
  if (closedEStem.test(stem)) return stem.endsWith('c') ? 'rapiécer' : stem.endsWith('g') ? 'protéger' : 'céder';
  if (stem.endsWith('c')) return 'placer';
  if (stem.endsWith('g')) return 'manger';
  if (stem.endsWith('ay')) return 'payer';
  if (/[ou]y$/u.test(stem)) return 'nettoyer';
  if (/[eé]y$/u.test(stem)) return 'grasseyer';
  return 'aimer';
}

/** The labels a productive verb can report; `model` names one of them only for the verb whose label it is. */
export const productiveLabels: readonly string[] = [
  'aimer', 'placer', 'manger', 'lever', 'dépecer', 'céder', 'rapiécer', 'protéger', 'appeler', 'jeter', 'renouveler',
  'feuilleter', 'payer', 'nettoyer', 'grasseyer', 'finir', 'ïr', 'rendre', 'rompre',
];
