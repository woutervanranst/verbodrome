import { conjugationOptions } from '../src/index.js';
import type { LanguageRegistry } from '../src/languages/registry.js';
import type { LanguageSpec, OptionFieldsOf } from '../src/core/spec.js';
import type { LanguagePack } from '../src/core/pack.js';
import type { OptionSchema } from '../src/core/options.js';
import type {
  Case, ConjugationOptions, ConjugationOptionsBuilder, ConjugationOptionsOf, DutchConjugationOptions, FrenchConjugationOptions, Language,
  Mood, MoodFor, PartFeatures, TenseFor, UnavailableTarget, VerbForm,
} from '../src/index.js';

export const french: FrenchConjugationOptions = conjugationOptions('fr', 'aller').indicative('perfect').gender('feminine').build();
export const dutch: DutchConjugationOptions = conjugationOptions('nl', 'werken').indicative('present').pronoun('u').build();

// @ts-expect-error Dutch options have no French gender.
export const dutchGender: ConjugationOptions = { language: 'nl', infinitive: 'werken', gender: 'feminine' };
// @ts-expect-error French indicative has imperfect, not past.
export const frenchTense: ConjugationOptions = { language: 'fr', infinitive: 'aimer', mood: 'indicative', tense: 'past' };
// @ts-expect-error The imperative has no future tense.
export const imperativeTense: ConjugationOptions = { language: 'fr', infinitive: 'aimer', mood: 'imperative', tense: 'future' };
// @ts-expect-error A participle has no finite person.
export const nonFinitePerson: ConjugationOptions = { language: 'fr', infinitive: 'aimer', mood: 'participle', person: 1 };
// @ts-expect-error Infinitive agreement is not a finite number.
export const nonFiniteNumber: ConjugationOptions = { language: 'nl', infinitive: 'werken', mood: 'infinitive', number: 'plural' };
// @ts-expect-error Dutch has no supported subjunctive.
export const dutchSubjunctive: ConjugationOptions = { language: 'nl', infinitive: 'werken', mood: 'subjunctive' };
// @ts-expect-error French stems do not have a Dutch pastSuffix hint.
export const frenchStems: ConjugationOptions = { language: 'fr', infinitive: 'aimer', stems: { pastSuffix: 't' } };
// @ts-expect-error French has no neuter subject gender.
export const frenchNeuter: ConjugationOptions = { language: 'fr', infinitive: 'aimer', gender: 'neuter' };
// @ts-expect-error French participles do not agree in the neuter.
export const frenchNeuterAgreement: ConjugationOptions = { language: 'fr', infinitive: 'aimer', agreement: { gender: 'neuter' } };

// A language's `subject` option names one of its slots, in a query or on a builder.
export const frenchSubject: ConjugationOptions = { language: 'fr', infinitive: 'aimer', mood: 'indicative', subject: '3pl' };
// @ts-expect-error French has no slot x.
export const frenchUnknownSubject: ConjugationOptions = { language: 'fr', infinitive: 'aimer', subject: 'x' };
// @ts-expect-error Dutch declares no subject slots.
export const dutchSubject: ConjugationOptions = { language: 'nl', infinitive: 'werken', mood: 'indicative', subject: 'x' };

/** The registry shape of a language whose slots are `1sg`, `2sg` and `3sg`, with one non-finite mood. */
interface SlottedSpec extends LanguageSpec {
  tenses: { indicative: 'present' | 'past'; infinitive: 'present' };
  nonFinite: 'infinitive';
  auxiliary: never;
  classHint: never;
  stems: object;
  context: object;
  subject: '1sg' | '2sg' | '3sg';
}
type SlottedOptions = ConjugationOptionsOf<'xx', SlottedSpec>;
export const slotted: SlottedOptions[] = [
  { language: 'xx', infinitive: 'a', subject: '2sg' },
  { language: 'xx', infinitive: 'a', mood: 'indicative', tense: 'past', person: 3, subject: '3sg' },
  { language: 'xx', infinitive: 'a', mood: 'infinitive' },
];
// @ts-expect-error A slot the language does not declare.
export const unknownSlot: SlottedOptions = { language: 'xx', infinitive: 'a', subject: '4sg' };
// @ts-expect-error A non-finite query has no subject, as it has no person.
export const nonFiniteSubject: SlottedOptions = { language: 'xx', infinitive: 'a', mood: 'infinitive', subject: '1sg' };

// The vocabulary every language shares: Latin's cases and extra verb forms, and the progressive aspect.
export const vocative: Case = 'vocative';
export const verbForms: VerbForm[] = ['finite', 'infinitive', 'presentParticiple', 'pastParticiple', 'gerund', 'gerundive', 'supine', 'futureParticiple'];
export const noPassive: UnavailableTarget['reason'] = 'noPassive';
export const progressive: Partial<PartFeatures> = { voice: 'passive', case: 'vocative', aspect: 'progressive' };
export const unmarked: Partial<PartFeatures> = { voice: null, case: null, aspect: null };
// @ts-expect-error Only the progressive aspect is named.
export const perfectiveAspect: Partial<PartFeatures> = { aspect: 'perfective' };

export function checkBuilderLanguageConstraints(): void {
  conjugationOptions('fr', 'aimer').subject('1sg');
  // @ts-expect-error French has no slot x.
  conjugationOptions('fr', 'aimer').subject('x');
  // @ts-expect-error Dutch has no subject slots to name.
  conjugationOptions('nl', 'werken').subject('x');
  // @ts-expect-error Dutch builders cannot set French gender.
  conjugationOptions('nl', 'werken').gender('feminine');
  // @ts-expect-error French builders cannot set a Dutch pronoun.
  conjugationOptions('fr', 'aimer').pronoun('jij');
  // @ts-expect-error Dutch builders do not support gerunds.
  conjugationOptions('nl', 'werken').gerund('present');
  // @ts-expect-error No future subjunctive.
  conjugationOptions('fr', 'aimer').subjunctive('future');
  // @ts-expect-error Language-specific auxiliary.
  conjugationOptions('fr', 'aimer').auxiliary('hebben');
}

type Equal<A, B> = (<T>() => T extends A ? 1 : 2) extends (<T>() => T extends B ? 1 : 2) ? true : false;
export const moods: Equal<Mood, 'indicative' | 'subjunctive' | 'conditional' | 'imperative' | 'infinitive' | 'participle' | 'gerund'> = true;
export const dutchMoods: Equal<MoodFor<'nl'>, 'indicative' | 'conditional' | 'imperative' | 'infinitive' | 'participle'> = true;
export const frenchSubjunctive: Equal<TenseFor<'fr', 'subjunctive'>, 'present' | 'past' | 'imperfect' | 'pluperfect'> = true;

// A builder builds the options of its own language.
export const frenchBuild: Equal<ReturnType<ConjugationOptionsBuilder<'fr'>['build']>, FrenchConjugationOptions> = true;
export const dutchBuild: Equal<ReturnType<ConjugationOptionsBuilder<'nl'>['build']>, DutchConjugationOptions> = true;

// No language's context key may shadow a builder method or a mood method.
export const noCollision: Extract<keyof LanguageRegistry[Language]['context'], keyof ConjugationOptionsBuilder<Language> | Mood> extends never ? true : false = true;

// A builder over any language still builds options `conjugate` accepts.
export function anyLanguage(language: Language): ConjugationOptions {
  return conjugationOptions(language, 'zorpen').build();
}

// A spec's `nonFinite` names moods of its tenses.
export interface GoodSpec extends LanguageSpec<{ indicative: 'present'; infinitive: 'present' }> {
  nonFinite: 'infinitive';
  auxiliary: never; classHint: never; stems: object; context: object; subject: never;
}
// @ts-expect-error `gerund` is not a mood of these tenses.
export interface BadSpec extends LanguageSpec<{ indicative: 'present'; infinitive: 'present' }> {
  nonFinite: 'gerund';
  auxiliary: never; classHint: never; stems: object; context: object; subject: never;
}

// The schema of a registered language is typed against its spec: its context keys plus auxiliary, classHint and stems.
export const dutchFields: Equal<
  OptionFieldsOf<LanguageRegistry['nl']>,
  'pronoun' | 'inversion' | 'reflexive' | 'separablePrefix' | 'inseparablePrefix' | 'auxiliary' | 'classHint' | 'stems'
> = true;
export const noContextFields: Equal<OptionFieldsOf<GoodSpec>, 'auxiliary' | 'classHint' | 'stems'> = true;

const stemsField = { kind: 'stems', words: ['stem'], enums: {} } as const;
const hintField = { kind: 'enum', values: ['a'] } as const;
// @ts-expect-error The Dutch schema lacks the `pronoun`, `inversion`, `reflexive` and prefix fields its spec declares.
export const missingField: LanguagePack<'nl'>['options'] = { fields: { stems: stemsField, auxiliary: hintField, classHint: hintField } };
export const extraField: LanguagePack<'nl'>['options'] = {
  fields: {
    stems: stemsField, auxiliary: hintField, classHint: hintField, pronoun: hintField, inversion: { kind: 'boolean' }, reflexive: { kind: 'boolean' },
    separablePrefix: hintField, inseparablePrefix: hintField,
    // @ts-expect-error `gender` is a French option, not a field of the Dutch spec.
    gender: hintField,
  },
};
// A language outside the registry (the toy) has no spec to check against: any field names are accepted.
export const unregistered: LanguagePack<'xx'>['options'] = { fields: { voice: hintField, anything: { kind: 'boolean' } } };
export const generic: OptionSchema = unregistered;
// A schema for a registered language is still a pack option schema in general.
export const widened: OptionSchema = {} as LanguagePack<'fr'>['options'];
