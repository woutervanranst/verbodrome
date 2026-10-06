export type Language = 'fr' | 'nl';
export type Person = 1 | 2 | 3;
export type GrammaticalNumber = 'singular' | 'plural';
export type Gender = 'masculine' | 'feminine';
export type Orthography = 'rectified' | 'traditional' | 'both';

export interface FrenchTenses {
  indicative:
    | 'present' | 'perfect' | 'imperfect' | 'pluperfect'
    | 'simple_past' | 'past_anterior' | 'future' | 'future_perfect'
    | 'near_future' | 'recent_past';
  subjunctive: 'present' | 'past' | 'imperfect' | 'pluperfect';
  conditional: 'present' | 'past';
  imperative: 'present' | 'past';
  infinitive: 'present' | 'past';
  participle: 'present' | 'past' | 'perfect';
  gerund: 'present' | 'past';
}

export interface DutchTenses {
  indicative: 'present' | 'past' | 'future' | 'perfect' | 'pluperfect' | 'future_perfect';
  conditional: 'present' | 'past';
  imperative: 'present';
  infinitive: 'present';
  participle: 'present' | 'past';
}

export type Mood = keyof FrenchTenses;
export type Tense = FrenchTenses[keyof FrenchTenses] | DutchTenses[keyof DutchTenses];
export type TensesFor<L extends Language> = L extends 'fr' ? FrenchTenses : DutchTenses;
export type MoodFor<L extends Language> = keyof TensesFor<L>;
export type TenseFor<L extends Language> = TensesFor<L>[keyof TensesFor<L>];

type FiniteConstraints = {
  readonly person?: Person;
  readonly number?: GrammaticalNumber;
};

type NonFiniteConstraints = {
  readonly person?: never;
  readonly number?: never;
};

type TargetQuery<T> =
  | ({ readonly mood?: undefined; readonly tense?: T[keyof T] } & FiniteConstraints)
  | {
    [M in keyof T]: {
      readonly mood: M;
      readonly tense?: T[M];
    } & (M extends 'infinitive' | 'participle' | 'gerund'
      ? NonFiniteConstraints
      : FiniteConstraints);
  }[keyof T];

export interface Agreement {
  readonly gender: Gender;
  readonly number: GrammaticalNumber;
}

export interface AgreementQuery {
  readonly gender?: Gender;
  readonly number?: GrammaticalNumber;
}

export type FrenchClassHint = 'er' | 'ir' | 're';
export type DutchClassHint = 'weak' | 'strong' | 'loan';

export interface FrenchStemHints {
  readonly singular?: string;
  readonly plural?: string;
  readonly thirdPlural?: string;
  readonly future?: string;
  readonly past?: string;
  readonly pastVowel?: 'a' | 'i' | 'u' | 'in';
  readonly pastParticiple?: string;
}

export type FrenchConjugationOptions = {
  readonly language: 'fr';
  readonly infinitive: string;
  readonly gender?: Gender;
  readonly agreement?: AgreementQuery;
  readonly precedingDirectObject?: Agreement;
  readonly reflexiveObject?: 'direct' | 'indirect';
  readonly auxiliary?: 'avoir' | 'être';
  readonly classHint?: FrenchClassHint;
  readonly model?: string;
  readonly stems?: FrenchStemHints;
  readonly aspiratedH?: boolean;
  readonly preferredOrthography?: 'rectified' | 'traditional';
} & TargetQuery<FrenchTenses>;

export type DutchPronoun = 'ik' | 'jij' | 'je' | 'u' | 'hij' | 'zij' | 'ze' | 'het' | 'wij' | 'we' | 'jullie';

export interface DutchStemHints {
  readonly stem?: string;
  readonly pastSingular?: string;
  readonly pastPlural?: string;
  readonly pastParticiple?: string;
  readonly pastSuffix?: 'd' | 't' | 'both';
  readonly unstressedFinalSyllable?: boolean;
}

export type DutchConjugationOptions = {
  readonly language: 'nl';
  readonly infinitive: string;
  readonly pronoun?: DutchPronoun;
  readonly inversion?: boolean;
  readonly reflexive?: boolean;
  readonly auxiliary?: 'hebben' | 'zijn';
  readonly classHint?: DutchClassHint;
  readonly stems?: DutchStemHints;
  readonly separablePrefix?: string;
  readonly inseparablePrefix?: string;
} & TargetQuery<DutchTenses>;

export type ConjugationOptions = FrenchConjugationOptions | DutchConjugationOptions;

export interface ResolvedTarget {
  readonly mood: Mood;
  readonly tense: Tense;
  readonly person: Person | null;
  readonly number: GrammaticalNumber | null;
  readonly gender: Gender | null;
  readonly agreement: Agreement | null;
}

export type PartRole = 'moodMarker' | 'subject' | 'reflexivePronoun' | 'auxiliary' | 'lexicalVerb' | 'particle' | 'linker';
export type VerbForm = 'finite' | 'infinitive' | 'presentParticiple' | 'pastParticiple';
export type Onset = 'vowel' | 'consonant' | 'muteH' | 'aspiratedH';

export interface PartFeatures {
  readonly mood: Mood | null;
  readonly tense: Tense | null;
  readonly person: Person | null;
  readonly number: GrammaticalNumber | null;
  readonly gender: Gender | null;
  readonly verbForm: VerbForm | null;
}

export interface ConjugationPart {
  readonly role: PartRole;
  readonly text: string;
  readonly lemma: string | null;
  readonly features: PartFeatures;
  readonly phonology: { readonly onset: Onset };
  readonly joinBefore: 'space' | 'hyphen' | 'attached';
}

export interface FormVariant {
  readonly orthography: Orthography;
  readonly auxiliary: string | null;
  readonly pattern: string | null;
  readonly usage: 'standard' | 'literary' | 'dated';
  readonly condition: string | null;
}

export interface GeneratedForm {
  readonly target: ResolvedTarget;
  readonly parts: readonly ConjugationPart[];
  readonly variant: FormVariant;
  readonly ruleIds: readonly string[];
}

export interface ConjugatedForm extends GeneratedForm {
  readonly text: string;
  readonly preferred: boolean;
  readonly labels: { readonly mood: string; readonly tense: string };
}

export interface UnavailableTarget {
  readonly target: ResolvedTarget;
  readonly reason: 'impersonal' | 'defective' | 'noImperative';
  readonly explanation: string;
  readonly source: string;
}

export interface VerbAnalysis {
  readonly lemma: string;
  readonly classification: string;
  readonly classificationSource: 'lexicon' | 'regularRule' | 'explicitHint';
  readonly reflexive: boolean;
  readonly auxiliaries: readonly string[];
  readonly assumptions: readonly string[];
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
