import { ConjugationError } from '../errors.js';
import type { LanguageEngine } from '../languages/adapter.js';
import type {
  ConjugationPart, FormVariant, GeneratedForm, GrammaticalNumber, Mood, Onset, Orthography, Person, ResolvedTarget, Tense,
} from '../types.js';

export interface CatalogueEntry {
  readonly mood: Mood; readonly tense: Tense; readonly moodLabel: string; readonly tenseLabel: string; readonly finite: boolean;
  /** Finite entries: the person/number slots that exist, in output order. Empty for non-finite entries. */
  readonly persons: readonly (readonly [Person, GrammaticalNumber])[];
}

export interface PackRendering {
  onset(text: string, flags: { readonly aspiratedH?: boolean }): Onset;
  /** Text of `left` when it fuses with `right` (French elision), or null. The renderer then joins without a space. */
  sandhi(left: ConjugationPart, right: ConjugationPart): string | null;
  bareOmits(part: ConjugationPart): boolean;
}

export interface LanguagePack<L extends string = string> {
  readonly language: L;
  readonly catalogue: readonly CatalogueEntry[];
  readonly rendering: PackRendering;
  /** Extra target filter from language-specific options (Dutch `pronoun`). */
  acceptsTarget?(query: Readonly<Record<string, unknown>>, target: ResolvedTarget): boolean;
  /** Extra form filter after generation (French `agreement`). */
  acceptsForm?(query: Readonly<Record<string, unknown>>, form: GeneratedForm): boolean;
  /** Sort key within one target; lower sorts first. */
  rank(form: GeneratedForm, query: Readonly<Record<string, unknown>>): number;
  engine(query: Readonly<Record<string, unknown>>): LanguageEngine;
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

/** Sort key for a variant: standard before literary before dated usage, then the preferred spelling first. */
export function variantRank(variant: FormVariant, preferred: Orthography): number {
  return (variant.usage === 'standard' ? 0 : variant.usage === 'literary' ? 10 : 20)
    + (variant.orthography === 'both' || variant.orthography === preferred ? 0 : 1);
}
