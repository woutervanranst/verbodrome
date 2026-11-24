/** The shape every language contributes to the registry: its grammar vocabulary and its option surface. */
export interface LanguageSpec {
  /** Mood -> tense ids. */
  tenses: Record<string, string>;
  /** Moods without person or number. */
  nonFinite: string;
  auxiliary: string;
  classHint: string;
  stems: object;
  /** The union of the language's subject slot ids; `never` for a language without slots. */
  subject: string;
  /** Every other language-specific option. */
  context: object;
}
