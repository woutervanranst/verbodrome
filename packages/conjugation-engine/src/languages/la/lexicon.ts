/**
 * The Latin lexicon (GD §5): entries keyed by the macron-insensitive key of their infinitive, the compound families
 * stored once on their base (GD §3.4), and the side lists (GD §5.4). The data is in `entries.ts` and `irregulars.ts`.
 */
import type { LexemeBase } from '../../core/grammar.js';
import { infinitiveOf, regularEntries } from './entries.js';
import type { LatinConjugation, LatinEntry, LatinFlag, LatinLack, LatinStemClass, LexicalForm } from './entries.js';
import { irregularEntries } from './irregulars.js';
import { latinKey } from './key.js';

export type { LatinConjugation, LatinEntry, LatinFlag, LatinLack, LatinStemClass, LexicalForm } from './entries.js';

/** Every entry, in lexicon order (the order of the paradigms of a homograph). */
export const latinEntries: readonly LatinEntry[] = [...irregularEntries, ...regularEntries];

function byKey(entries: readonly LatinEntry[]): Readonly<Record<string, readonly LatinEntry[]>> {
  const map: Record<string, LatinEntry[]> = {};
  for (const entry of entries) (map[latinKey(entry.infinitive)] ??= []).push(entry);
  return map;
}

/** The verbs that can be looked up, keyed by `latinKey(infinitive)`; a homograph key has several entries. */
export const latinLexicon: Readonly<Record<string, readonly LatinEntry[]>> = byKey(latinEntries.filter(entry => !entry.familyOnly));

/** A compound family: the form its compounds take (weakened or the simple one), stored once on the base. */
export interface LatinFamily {
  readonly base: LatinEntry;
  readonly present: string;
  readonly infinitive: string;
  readonly perfect?: readonly string[];
  readonly supine?: readonly string[];
  /** The only prefixes the family takes; absent: any prefix. */
  readonly prefixes?: readonly string[];
  /** The compounds take a weakened form (-cipiō), so they do not inherit the simple verb's lexical quirks. */
  readonly weakened: boolean;
  readonly vary: boolean;
}

/** The root of an infinitive key (amare → am, sequi → sequ), for the minimum family root of three letters (GD §3.4). */
function rootOf(key: string): string {
  return key.replace(/(?:are|ere|ire|ari|eri|iri|i)$/u, '');
}

function familyOf(entry: LatinEntry): LatinFamily | null {
  const compound = entry.compound;
  if (entry.present === null || entry.impersonal) return null;
  if (compound?.present !== undefined) {
    const deponent = entry.voice === 'deponent';
    const infinitive = compound.infinitive ?? infinitiveOf(compound.present, entry.conjugation, deponent);
    return {
      base: entry, present: compound.present, infinitive, ...(compound.perfect ? { perfect: compound.perfect } : {}),
      ...(compound.supine ? { supine: compound.supine } : {}), ...(compound.prefixes ? { prefixes: compound.prefixes } : {}),
      weakened: compound.present !== entry.present, vary: compound.vary === true,
    };
  }
  if (compound?.prefixes !== undefined && compound.prefixes.length === 0) return null;
  const listed = compound?.prefixes !== undefined;
  // A simple-form family: any regular verb whose root has at least three letters, or a family that lists its prefixes.
  if (!listed && !entry.familyOnly && (entry.conjugation === 'irregular' || rootOf(latinKey(entry.infinitive)).length < 3)) return null;
  return {
    base: entry, present: entry.present, infinitive: entry.infinitive, ...(entry.perfect ? { perfect: entry.perfect } : {}),
    ...(entry.supine ? { supine: entry.supine } : {}), ...(listed ? { prefixes: compound!.prefixes! } : {}),
    weakened: false, vary: compound?.vary === true,
  };
}

const familyList: readonly LatinFamily[] = latinEntries.flatMap(entry => familyOf(entry) ?? []);

/** Families keyed by the key of the infinitive their compounds end in (cipere, ducere). */
export const latinFamilies: Readonly<Record<string, readonly LatinFamily[]>> = (() => {
  const map: Record<string, LatinFamily[]> = {};
  for (const family of familyList) (map[latinKey(family.infinitive)] ??= []).push(family);
  return map;
})();

/** The families with a form of their own (a weakened form or a closed prefix list): the 32 of GD §3.4 and more. */
export const familyCount: number = familyList.filter(family => family.weakened || family.prefixes !== undefined).length;

/**
 * Lemmas never read as prefix + family (GD §3.4): own entries or regular verbs that only look like compounds. Keys
 * (macron-insensitive infinitives).
 */
export const noInherit: ReadonlySet<string> = new Set([
  'ambire', 'intellegere', 'neglegere', 'diligere', 'cogere', 'degere', 'comere', 'demere', 'promere', 'sumere', 'pergere',
  'surgere', 'aperire', 'operire', 'reperire', 'comperire', 'debere', 'praebere', 'exercere', 'coercere', 'circumdare', 'venire',
]);

/** Glosses of homograph compounds, from their Lewis & Short entries (the `condition` of each paradigm, GD §3.6). */
export const compoundGlosses: Readonly<Record<string, string>> = {
  occīdō: 'kill', occidō: 'fall down', incīdō: 'cut into', incidō: 'fall into', concīdō: 'cut up', concidō: 'fall down',
  dēcīdō: 'cut off', dēcidō: 'fall off', recīdō: 'cut away', recidō: 'fall back',
};

/**
 * Intransitive verbs whose passive is only impersonal (A&G §§203.a, 208.d), by 1sg present, as Lewis & Short labels
 * them (v. n., with an impersonal passive cited, or no passive at all). Left out because L&S contradicts the design:
 * studeō and parcō (also v. a.) and ambulō (L&S cites a personal passive). eō itself is marked in its entry.
 */
export const impersonalPassive: ReadonlySet<string> = new Set([
  'veniō', 'currō', 'cadō', 'stō', 'sedeō', 'iaceō', 'pūgnō', 'noceō', 'pāreō', 'faveō', 'serviō', 'persuādeō', 'resistō',
]);

/** Where a stem comes from: a principal part (listed or hinted), or the default of an unknown verb (GD §3.3). */
export type StemSource =
  | {
    readonly kind: 'listed'; readonly part: string; readonly stem: string; readonly hinted: boolean;
    readonly usage?: LexicalForm['usage']; readonly pattern?: string;
  }
  | {
    readonly kind: 'default'; readonly base: string; readonly suffix: string; readonly joined: string;
    readonly junction: { readonly consonant: string; readonly result: string } | null; readonly stem: string;
  };

/** The present stem: `from` without -`ending` (amāre without -re: amā), or a stem the lexicon gives. */
export interface PresentStem { readonly from: string; readonly ending: string; readonly stem: string; readonly lexical: boolean }


/** A verb as the grammar reads it: one paradigm of a lemma (GD §5.1). */
export interface LatinLexeme extends LexemeBase {
  readonly key: string;
  /** The entry the verb comes from (for a compound, its own parts on the family's entry); null for an unknown verb. */
  readonly entry: LatinEntry | null;
  readonly family: { readonly prefix: string; readonly base: string } | null;
  readonly conjugation: LatinConjugation;
  readonly stemClass: LatinStemClass;
  readonly voiceClass: 'active' | 'deponent' | 'semiDeponent';
  /** 'participle' for deponents, semi-deponents and fīō: the perfect system is participle + esse (GD §6.2). */
  readonly perfectSystem: 'stem' | 'participle';
  /** The present stem and where it comes from; null for a verb with no present system (coepī). */
  readonly presentStem: PresentStem | null;
  /** The perfect stems (the first preferred); empty for a perfect system built on the participle. */
  readonly perfectStems: readonly StemSource[];
  readonly supineStems: readonly StemSource[];
  /** Listed future participles (moritūrus) as stems before -ūrus; empty: the supine stem + ūrus. */
  readonly futureParticipleStems: readonly StemSource[];
  /** A compound in a weakened form (cōnficiō): it does not inherit the simple verb's short imperative or fīō passive. */
  readonly weakened: boolean;
  readonly passive: 'personal' | 'impersonal' | 'none';
  readonly impersonal: boolean;
  readonly lacks: ReadonlySet<LatinLack>;
  readonly flags: ReadonlySet<LatinFlag>;
  readonly cells: Readonly<Record<string, readonly LexicalForm[]>>;
  readonly stems: Readonly<Record<string, string>>;
  /** amō, amāre, amāvī, amātum */
  readonly principalParts: string;
}
