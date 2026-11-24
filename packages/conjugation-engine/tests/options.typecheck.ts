import { conjugationOptions } from '../src/index.js';
import type { LanguageRegistry } from '../src/languages/registry.js';
import type {
  ConjugationOptions, ConjugationOptionsBuilder, DutchConjugationOptions, FrenchConjugationOptions, Language, Mood, MoodFor, TenseFor,
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

export function checkBuilderLanguageConstraints(): void {
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
