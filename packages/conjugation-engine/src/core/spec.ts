/**
 * The shape every language contributes to the registry: its grammar vocabulary and its option surface. A spec extends
 * `LanguageSpec<ItsTenses>`, so a `nonFinite` that is not one of its moods does not compile.
 */
export interface LanguageSpec<Tenses extends Record<string, string> = Record<string, string>> {
  /** Mood -> tense ids. */
  tenses: Tenses;
  /** Moods without person or number; each is a mood of `tenses`. */
  nonFinite: keyof Tenses & string;
  auxiliary: string;
  classHint: string;
  stems: object;
  /** The union of the language's subject slot ids; `never` for a language without slots. */
  subject: string;
  /** Every other language-specific option. */
  context: object;
}

/**
 * The option fields a language's pack must declare in its schema: every key of its `context`, plus the three shared
 * ones (`auxiliary`, `classHint`, `stems`). A pack's schema is typed against this, so a missing or extra field is a
 * compile error.
 */
export type OptionFieldsOf<S extends LanguageSpec> = (keyof S['context'] & string) | 'auxiliary' | 'classHint' | 'stems';
