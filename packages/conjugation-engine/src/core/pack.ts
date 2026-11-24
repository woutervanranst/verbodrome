import { ConjugationError } from '../errors.js';
import type { RuleInfo } from './derivation.js';
import { usageRank } from './fork.js';
import type { OptionSchema } from './options.js';
import type { Citation, Work } from './sources.js';
import type {
  ConjugationPart, FormVariant, GeneratedForm, GenerationResult, GrammaticalNumber, Mood, Onset, Orthography, Person,
  ResolvedTarget, Tense, VerbAnalysis, Voice,
} from '../types.js';

/** What a pack's engine gives the orchestrator for one query: the verb's analysis and the forms of each target. */
export interface LanguageEngine {
  readonly verbId: string;
  readonly analysis: VerbAnalysis;
  generate(target: ResolvedTarget): GenerationResult;
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
}

export interface PackRendering {
  onset(text: string, flags: { readonly aspiratedH?: boolean }): Onset;
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
