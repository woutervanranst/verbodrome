import type { DerivationStep } from './core/derivation.js';
import type { Agreement, Case, Gender, GrammaticalNumber, Person, Voice } from './core/grammar.js';
import type { LanguageSpec } from './core/spec.js';
import type { Language, LanguageRegistry } from './languages/registry.js';

export type { DerivationStep } from './core/derivation.js';
export type { Agreement, AgreementQuery, Case, Gender, GrammaticalNumber, Person, Voice } from './core/grammar.js';

export type { Language } from './languages/registry.js';
export type {
  FrenchAgreement, FrenchClassHint, FrenchGender, FrenchSpec, FrenchStemHints, FrenchTenses,
} from './languages/fr/spec.js';
export type {
  DutchClassHint, DutchPronoun, DutchSpec, DutchStemHints, DutchTenses,
} from './languages/nl/spec.js';
export type { LatinClassHint, LatinGender, LatinSpec, LatinStemHints, LatinSubject, LatinTenses } from './languages/la/spec.js';

export type Orthography = 'rectified' | 'traditional' | 'both';

export type TensesFor<L extends Language> = LanguageRegistry[L]['tenses'];
export type MoodFor<L extends Language> = L extends Language ? keyof TensesFor<L> & string : never;
export type TenseFor<L extends Language, M extends MoodFor<L> = MoodFor<L>> =
  L extends Language ? M extends keyof TensesFor<L> ? TensesFor<L>[M] : never : never;
export type Mood = MoodFor<Language>;
export type Tense = TenseFor<Language>;

/** What only a finite query has: a person and number, and a subject slot (`never` for a language without slots). */
type FiniteConstraints<S extends LanguageSpec> = {
  readonly person?: Person;
  readonly number?: GrammaticalNumber;
  readonly subject?: S['subject'];
};

type NonFiniteConstraints = {
  readonly person?: never;
  readonly number?: never;
  readonly subject?: never;
};

type TargetQuery<S extends LanguageSpec> =
  | ({ readonly mood?: undefined; readonly tense?: S['tenses'][keyof S['tenses']] } & FiniteConstraints<S>)
  | {
    [M in keyof S['tenses']]: {
      readonly mood: M;
      readonly tense?: S['tenses'][M];
    } & (M extends S['nonFinite'] ? NonFiniteConstraints : FiniteConstraints<S>);
  }[keyof S['tenses']];

/** The options of a language called `L` whose registry entry is `S`. */
export type ConjugationOptionsOf<L extends string, S extends LanguageSpec> = {
  readonly language: L;
  readonly infinitive: string;
  readonly auxiliary?: S['auxiliary'];
  readonly classHint?: S['classHint'];
  readonly stems?: S['stems'];
} & S['context'] & TargetQuery<S>;

/** The options of language `L`; over a union of languages, the union of each language's options. */
export type ConjugationOptionsFor<L extends Language> = L extends Language ? ConjugationOptionsOf<L, LanguageRegistry[L]> : never;

export type FrenchConjugationOptions = ConjugationOptionsFor<'fr'>;
export type DutchConjugationOptions = ConjugationOptionsFor<'nl'>;
export type LatinConjugationOptions = ConjugationOptionsFor<'la'>;

export type ConjugationOptions = { [L in Language]: ConjugationOptionsFor<L> }[Language];

export interface ResolvedTarget {
  readonly mood: Mood;
  readonly tense: Tense;
  readonly person: Person | null;
  readonly number: GrammaticalNumber | null;
  readonly gender: Gender | null;
  readonly agreement: Agreement | null;
  /** Present only for catalogue entries that have voices; `null` and absent both mean no voice dimension. */
  readonly voice?: Voice | null;
  /** The id of the pack's subject slot; present only on finite targets of a pack that declares subjects. */
  readonly subject?: string;
}

export type PartRole = 'moodMarker' | 'subject' | 'reflexivePronoun' | 'auxiliary' | 'lexicalVerb' | 'particle' | 'linker';
export type VerbForm =
  | 'finite' | 'infinitive' | 'presentParticiple' | 'pastParticiple' | 'gerund' | 'gerundive' | 'supine' | 'futureParticiple';
export type Onset = 'vowel' | 'consonant' | 'muteH' | 'aspiratedH';

export interface PartFeatures {
  readonly mood: Mood | null;
  readonly tense: Tense | null;
  readonly person: Person | null;
  readonly number: GrammaticalNumber | null;
  readonly gender: Gender | null;
  readonly verbForm: VerbForm | null;
  /**
   * The voice of the construction the word belongs to: the cell's voice for a simple target, the periphrasis's for every
   * verb word of a voiced compound tense. Absent for an active word, since active is the unmarked voice (never 'active').
   */
  readonly voice?: Voice | null;
  /** The case of a declined word (a Latin participle), from its agreement. */
  readonly case?: Case | null;
  readonly aspect?: 'progressive' | null;
}

export interface ConjugationPart {
  readonly role: PartRole;
  readonly text: string;
  readonly lemma: string | null;
  readonly features: PartFeatures;
  readonly phonology: { readonly onset: Onset };
  readonly joinBefore: 'space' | 'hyphen' | 'attached';
  readonly steps?: readonly DerivationStep[];
}

export interface FormVariant {
  readonly orthography: Orthography;
  readonly auxiliary: string | null;
  readonly pattern: string | null;
  readonly usage: 'standard' | 'literary' | 'dated';
  readonly condition: string | null;
  readonly region?: string | null;
}

export interface GeneratedForm {
  readonly target: ResolvedTarget;
  readonly parts: readonly ConjugationPart[];
  readonly variant: FormVariant;
  /** @deprecated Use steps. */
  readonly ruleIds: readonly string[];
  readonly steps?: readonly DerivationStep[];
}

export interface ConjugatedForm extends GeneratedForm {
  readonly text: string;
  readonly preferred: boolean;
  readonly labels: { readonly mood: string; readonly tense: string };
}

export interface UnavailableTarget {
  readonly target: ResolvedTarget;
  readonly reason: 'impersonal' | 'defective' | 'noImperative' | 'noPassive';
  readonly explanation: string;
  readonly source: string;
  readonly step?: DerivationStep;
}

/** The analysis of a verb; for a lemma with several paradigms, the first paradigm's, with the others in `alternatives`. */
export interface VerbAnalysis {
  readonly lemma: string;
  readonly classification: string;
  readonly classificationSource: 'lexicon' | 'regularRule' | 'explicitHint';
  readonly reflexive: boolean;
  readonly auxiliaries: readonly string[];
  readonly assumptions: readonly string[];
  readonly steps?: readonly DerivationStep[];
  /**
   * For a lemma with several paradigms: this paradigm's `pattern` and `condition` tags, the labels its forms carry as
   * `variant.pattern` and `variant.condition`. Absent for a lemma with one paradigm, and when the paradigm has no such tag.
   */
  readonly pattern?: string;
  readonly condition?: string;
  /**
   * The analyses of the lemma's other paradigms, in order, each without `alternatives` of its own. Absent when the
   * lemma has one paradigm.
   */
  readonly alternatives?: readonly VerbAnalysis[];
}

export interface ConjugationResult {
  readonly language: Language;
  readonly verbId: string;
  readonly query: ConjugationOptions;
  readonly status: 'available' | 'partiallyAvailable' | 'unavailable';
  readonly forms: readonly ConjugatedForm[];
  readonly unavailableTargets: readonly UnavailableTarget[];
  readonly analysis: VerbAnalysis;
}

export interface GenerationResult {
  readonly forms: readonly GeneratedForm[];
  readonly unavailable: readonly UnavailableTarget[];
}

export interface RenderContext {
  readonly bare?: boolean;
}
