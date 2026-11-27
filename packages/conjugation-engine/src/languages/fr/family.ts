/**
 * The shape of a French verb family: principal parts relative to the stripped infinitive, from which formation rules
 * derive every simple cell (GD §4.2). `families.ts` holds the data; this module holds its types and the 51-cell
 * vocabulary the data and the formation rules share.
 */

/**
 * The 51 simple cells of a French verb, in table order: seven finite rows of six persons (present, imparfait, passé
 * simple, futur, subjonctif présent, subjonctif imparfait, conditionnel), then imperative 2sg/1pl/2pl, participe
 * présent, the four past participles (masculine/feminine × singular/plural) and the infinitive.
 */
export const cellNames = [
  'pres.1s', 'pres.2s', 'pres.3s', 'pres.1p', 'pres.2p', 'pres.3p',
  'impf.1s', 'impf.2s', 'impf.3s', 'impf.1p', 'impf.2p', 'impf.3p',
  'ps.1s', 'ps.2s', 'ps.3s', 'ps.1p', 'ps.2p', 'ps.3p',
  'fut.1s', 'fut.2s', 'fut.3s', 'fut.1p', 'fut.2p', 'fut.3p',
  'subj.1s', 'subj.2s', 'subj.3s', 'subj.1p', 'subj.2p', 'subj.3p',
  'subjimpf.1s', 'subjimpf.2s', 'subjimpf.3s', 'subjimpf.1p', 'subjimpf.2p', 'subjimpf.3p',
  'cond.1s', 'cond.2s', 'cond.3s', 'cond.1p', 'cond.2p', 'cond.3p',
  'imp.2s', 'imp.1p', 'imp.2p', 'ppres', 'pp.ms', 'pp.fs', 'pp.mp', 'pp.fp', 'inf',
] as const;

export type CellName = (typeof cellNames)[number];

/** One principal part; several values are a fork, in this order. */
export type Part = string | readonly string[];

/** The present-singular ending set of P1: e/es/e, s/s/t or x/x/t. */
export type SingularSet = 'e' | 's' | 'x';

/** The theme vowel of the passé simple and subjonctif imparfait. */
export type Theme = 'a' | 'i' | 'u' | 'in' | 'ï';

/**
 * Principal parts in traditional spelling, relative to the stripped infinitive (GD §4.2). An absent part is a missing
 * form; P3 defaults to P2, SJ1 to P3 and SJ2 to P2, and those defaults are not written out.
 */
export interface PrincipalParts {
  /** Present-singular stem, with its ending set. */
  readonly P1?: Part;
  readonly set?: SingularSet;
  /** The nous stem: present 1pl/2pl, imparfait, participe présent, subjunctive 1pl/2pl, imperative 1pl/2pl. */
  readonly P2?: Part;
  /** The ils stem: present 3pl, subjunctive singular and 3pl. */
  readonly P3?: Part;
  /** The future stem, ending in r: futur and conditionnel. */
  readonly F?: Part;
  /** The past stem, with its theme vowel: passé simple and subjonctif imparfait. */
  readonly PS?: Part;
  readonly theme?: Theme;
  /** The masculine singular past participle. */
  readonly PP?: Part;
  /** The base of the feminine past participle where it is not PP (absous, absoute). */
  readonly PPF?: Part;
  /** The subjunctive stem of the singular and 3pl. */
  readonly SJ1?: Part;
  /** The subjunctive stem of the 1pl and 2pl. */
  readonly SJ2?: Part;
}

/** One complete conjugation of a family (most families have one). */
export interface FamilyParadigm {
  readonly pattern: string | null;
  readonly usage: 'standard' | 'dated';
  readonly parts: PrincipalParts;
  /** Cells absent although the part that feeds them exists. */
  readonly gaps: readonly CellName[];
  /** Suppletive cells: whole words that no formation rule produces. */
  readonly cells: Readonly<Partial<Record<CellName, readonly string[]>>>;
  /**
   * Other words the Académie's conjugation table prints for a cell after « ou » (enclôt ou enclot), relative to the
   * stripped infinitive; they come in both spellings, after the derived word.
   */
  readonly spellings: Readonly<Partial<Record<CellName, readonly string[]>>>;
}

export interface FamilyFlags {
  /** The verbal past participle never agrees (été, dormi, plu). */
  readonly invariableParticiple?: true;
  /** `singular`: only the neuter il (falloir); `figurativePlural`: third persons, the plural only figuratively (pleuvoir). */
  readonly impersonal?: 'singular' | 'figurativePlural';
  readonly thirdPersonOnly?: true;
  readonly noImperative?: true;
  /** `nonFinite`: only infinitive, participle and gerund compounds; `none`: no compound tenses. */
  readonly compounds?: 'nonFinite' | 'none';
  /** The imperative is the subjunctive's (sache, sachons, sachez); with several SJ2 values, one series per value. */
  readonly imperativeFromSubjunctive?: true;
  /** The participe présent is SJ2 + ant (ayant, sachant). */
  readonly presentParticipleFromSubjunctive?: true;
  /** The stem vowel before the 3sg t takes a circumflex (connaît, plaît, gît, clôt). */
  readonly circumflexBeforeT?: true;
  /**
   * The Académie's conjugation table `https://www.dictionnaire-academie.fr/conjuguer/<academie>`, read on `date`, agrees
   * with the family's representative verb in the traditional spelling: every cell the table prints has the same words
   * (or the table also prints the 1990 word), the family has no cell the table leaves out, and the auxiliaries match
   * (strict comparison of 2026-11-27). The families that disagree are listed in `docs/grammar/fr.md`.
   */
  readonly verified?: { readonly academie: string; readonly date: string };
  /**
   * The Académie entry (A9…) whose « Conjugaison » remark states which forms the verb lacks: the family's unavailable
   * targets cite that article, whose table may print more (`docs/grammar/fr.md` lists where).
   */
  readonly article?: string;
}

/**
 * A verb family: the lemmas and suffixes that select it (a listed lemma first, otherwise the longest suffix that ends the
 * infinitive, skipping `except` lemmas and `exceptEndings`), how many letters of the infinitive the parts replace, and
 * one paradigm per accepted conjugation.
 */
export interface FamilyEntry {
  readonly id: string;
  readonly lemmas: readonly string[];
  readonly suffixes: readonly string[];
  readonly except: readonly string[];
  readonly exceptEndings: readonly string[];
  readonly strip: number;
  readonly paradigms: readonly FamilyParadigm[];
  readonly flags: FamilyFlags;
}

/** The values of a part, in fork order; none for an absent part. */
export function values(part: Part | undefined): readonly string[] {
  return part === undefined ? [] : typeof part === 'string' ? [part] : part;
}
