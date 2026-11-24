import { ConjugationError } from '../errors.js';
import type { RuleInfo } from './derivation.js';
import { usageRank } from './fork.js';
import type { OptionSchema } from './options.js';
import type { Citation, Work } from './sources.js';
import type {
  ConjugationPart, FormVariant, Gender, GeneratedForm, GenerationResult, GrammaticalNumber, Mood, Onset, Orthography, Person,
  ResolvedTarget, Tense, VerbAnalysis, Voice,
} from '../types.js';

/** What a pack's engine gives the orchestrator for one query: the verb's analysis and the forms of each target. */
export interface LanguageEngine {
  readonly verbId: string;
  readonly analysis: VerbAnalysis;
  /**
   * The forms of `target`, or why it has none. `subject` is the slot `target.subject` names; the orchestrator always
   * passes it (null for a target without a subject), so an engine never looks a slot up itself.
   */
  generate(target: ResolvedTarget, subject?: SubjectSlot | null): GenerationResult;
}

/**
 * One subject a finite form can have. The verb agrees with `person` and `number`, which need not be the person the
 * subject addresses: a formal 'you' that conjugates as a third person is a slot with person 3.
 */
export interface SubjectSlot {
  /**
   * Unique within the pack, e.g. '3sg.f', '2sg.formal'; the value of the `subject` option and of `ResolvedTarget.subject`.
   * It becomes a segment of the target key, so it must not contain `/` or equal a voice name (`active`, `passive`);
   * `createEngine` rejects such a pack.
   */
  readonly id: string;
  readonly person: Person;
  readonly number: GrammaticalNumber;
  /** null for a pro-drop language's unmarked subject. */
  readonly pronoun: string | null;
  /** Becomes `target.gender` only for a pack with `genderedTargets`; otherwise it is for the clause to read. */
  readonly gender?: Gender;
  readonly register?: 'formal' | 'informal';
  /** Part of a query that does not name a subject. */
  readonly default: boolean;
}

export interface CatalogueEntry {
  readonly mood: Mood; readonly tense: Tense; readonly moodLabel: string; readonly tenseLabel: string; readonly finite: boolean;
  /** Finite entries: the person/number slots that exist, in output order. Empty for non-finite entries. */
  readonly persons: readonly (readonly [Person, GrammaticalNumber])[];
  /**
   * The voices the entry exists in, in output order; each slot becomes one target per voice. Absent: the entry has no
   * voice dimension and its targets have no `voice`. A pack with voices declares a `voice` enum option to filter by.
   */
  readonly voices?: readonly Voice[];
  /**
   * For a finite entry of a pack with `subjects`: the ids of the slots the entry has, which replace `persons` for
   * expansion (`persons` is then ignored, though `finite` must still be true). The entry expands to those of the query's
   * selected slots (`subjectsFor`) whose id is listed, in the pack's order, each with its own person and number, so a
   * formal slot that governs another person is there and a default slot with the same person and number that is not
   * listed is not (the German imperative lists du, wir, ihr and Sie, never the third-person plural). Absent: the entry
   * has every selected slot of each of its `persons`. `createEngine` rejects an id the pack does not declare.
   */
  readonly slots?: readonly string[];
}

export interface PackRendering {
  /**
   * The onset of `text`. `flags` are the pack's own phonological hints for the word (French reads `aspiratedH`); a
   * rendering reads the flags it knows and ignores the rest.
   */
  onset(text: string, flags: Readonly<Record<string, boolean>>): Onset;
  /** Text of `left` when it fuses with `right` (French elision), or null. The renderer then joins without a space. */
  sandhi(left: ConjugationPart, right: ConjugationPart): string | null;
  bareOmits(part: ConjugationPart): boolean;
}

export interface LanguagePack<L extends string = string> {
  readonly language: L;
  /** The language's English name, used for headings such as `Dutch (nl):` in CLI help. */
  readonly label: string;
  readonly catalogue: readonly CatalogueEntry[];
  readonly rendering: PackRendering;
  /** The language's own option keys and how each is validated; the common keys are validated by the core. */
  readonly options: OptionSchema;
  /**
   * The subjects a finite target can have, in output order within one person and number. A pack that declares slots
   * gets one target per selected slot and accepts the common `subject` option; without slots, a finite target is one
   * person and number with no `subject`.
   */
  readonly subjects?: readonly SubjectSlot[];
  /**
   * Slots to expand for this query, out of `subjects`; the person and number filters apply afterwards. Default
   * (`defaultSubjectsFor`): the slot named by the common `subject` option, else every default slot.
   */
  subjectsFor?(query: Readonly<Record<string, unknown>>): readonly SubjectSlot[];
  /** The subject's gender changes the verb phrase (French, Italian, Latin), so a target carries its slot's gender. */
  readonly genderedTargets?: boolean;
  /** Extra target filter from language-specific options (Dutch `pronoun`). */
  acceptsTarget?(query: Readonly<Record<string, unknown>>, target: ResolvedTarget): boolean;
  /** Extra form filter after generation (French `agreement`). */
  acceptsForm?(query: Readonly<Record<string, unknown>>, form: GeneratedForm): boolean;
  /** Sort key within one target; lower sorts first. */
  rank(form: GeneratedForm, query: Readonly<Record<string, unknown>>): number;
  engine(query: Readonly<Record<string, unknown>>): LanguageEngine;
  /** The rules the pack's steps record, keyed by id (the `defineRules` result). Absent while a pack records no steps. */
  readonly rules?: Readonly<Record<string, RuleInfo>>;
  /** The works the pack's citations name, keyed by `Work.id`. */
  readonly works?: Readonly<Record<string, Work>>;
  /** Where each rule is described, keyed by rule id. */
  readonly citations?: Readonly<Record<string, Citation | readonly Citation[]>>;
}

/** The pack registered for `language`; anything else is UNSUPPORTED_LANGUAGE, naming the registered languages. */
export function packFor(packs: Readonly<Record<string, LanguagePack>>, language: unknown): LanguagePack {
  const pack = typeof language === 'string' && Object.hasOwn(packs, language) ? packs[language] : undefined;
  if (!pack) throw new ConjugationError('UNSUPPORTED_LANGUAGE', `Language must be one of: ${Object.keys(packs).join(', ')}.`);
  return pack;
}

/** The default `subjectsFor`: the slot the common `subject` option names, else every default slot. */
export function defaultSubjectsFor(subjects: readonly SubjectSlot[], query: Readonly<Record<string, unknown>>): readonly SubjectSlot[] {
  return query.subject === undefined ? subjects.filter(slot => slot.default) : subjects.filter(slot => slot.id === query.subject);
}

/** Every person/number slot, number-major: singular 1-2-3, then plural 1-2-3. */
export const allPersons: readonly (readonly [Person, GrammaticalNumber])[] = [
  [1, 'singular'], [2, 'singular'], [3, 'singular'], [1, 'plural'], [2, 'plural'], [3, 'plural'],
];

/** The person/number slots of a non-finite mood. */
export const noPersons: readonly (readonly [Person, GrammaticalNumber])[] = [];

/** Frozen catalogue entries for the tenses of one mood; an entry is finite when it has person/number slots. */
export function moodEntries(
  mood: Mood,
  moodLabel: string,
  persons: readonly (readonly [Person, GrammaticalNumber])[],
  tenses: readonly (readonly [Tense, string])[],
): CatalogueEntry[] {
  const slots = Object.freeze(persons.map(slot => Object.freeze([...slot] as const)));
  return tenses.map(([tense, tenseLabel]) => Object.freeze({
    mood, tense, moodLabel, tenseLabel, finite: slots.length > 0, persons: slots,
  }));
}

/** Sort key for a variant: standard before literary before dated usage (`usageRank`), then the preferred spelling first. */
export function variantRank(variant: FormVariant, preferred: Orthography): number {
  return usageRank[variant.usage] * 10 + (variant.orthography === 'both' || variant.orthography === preferred ? 0 : 1);
}
