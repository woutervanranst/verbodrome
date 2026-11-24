import { parseOptions } from './core/options.js';
import type { LanguagePack } from './core/pack.js';
import { engine } from './default-engine.js';
import { packs } from './languages/index.js';
import type { LanguageRegistry } from './languages/registry.js';
import type {
  ConjugationOptions, ConjugationOptionsFor, GrammaticalNumber, Language, MoodFor, Person, TenseFor,
} from './types.js';

export function parseConjugationOptions(value: unknown): ConjugationOptions {
  const parsed = parseOptions(packs, value) as ConjugationOptions;
  engine.expandTargets(parsed);
  return parsed;
}

/** One method per mood of `L`; the tense argument is optional and, when omitted, clears any tense. */
export type MoodSugar<L extends Language> = {
  readonly [M in MoodFor<L>]: (tense?: TenseFor<L, M>) => Builder<L>;
};

/** One setter per context option of `L`; boolean options default to `true`. */
export type ContextSugar<L extends Language> = {
  readonly [K in keyof LanguageRegistry[L]['context']]-?: [Required<LanguageRegistry[L]['context']>[K]] extends [boolean]
    ? (value?: boolean) => Builder<L>
    : (value: Required<LanguageRegistry[L]['context']>[K]) => Builder<L>;
};

export type Builder<L extends Language> = ConjugationOptionsBuilder<L> & MoodSugar<L> & ContextSugar<L>;

/**
 * Collects options for one verb. The language-independent setters are methods here; the mood and context-option
 * methods of the chosen language are installed on the instance from that language's pack (`packs`, the same map
 * the default engine is built from).
 */
export class ConjugationOptionsBuilder<L extends Language> {
  private readonly values: Record<string, unknown> = {};
  private readonly language: L;
  private readonly infinitiveValue: string;

  constructor(language: L, infinitive: string) {
    this.language = language;
    this.infinitiveValue = infinitive;
    // An unregistered language gets no sugar; build() reports it as UNSUPPORTED_LANGUAGE.
    const pack: LanguagePack | undefined = Object.hasOwn(packs, language) ? packs[language] : undefined;
    if (pack) this.installSugar(pack);
  }

  private installSugar(pack: LanguagePack): void {
    const install = (name: string, method: (value?: unknown) => this): void => {
      Object.defineProperty(this, name, { value: method });
    };
    for (const mood of new Set(pack.catalogue.map(entry => entry.mood))) {
      install(mood, tense => {
        this.values.mood = mood;
        if (tense === undefined) delete this.values.tense;
        else this.values.tense = tense;
        return this;
      });
    }
    for (const [key, spec] of Object.entries(pack.options.fields)) {
      if (key in ConjugationOptionsBuilder.prototype) continue; // auxiliary, classHint and stems are shared methods
      const isBoolean = spec.kind === 'boolean';
      install(key, value => {
        this.values[key] = isBoolean ? value ?? true : value;
        return this;
      });
    }
  }

  mood(mood: MoodFor<L>): this {
    this.values.mood = mood;
    return this;
  }

  tense(tense: TenseFor<L>): this {
    this.values.tense = tense;
    return this;
  }

  person(person: Person, number?: GrammaticalNumber): this {
    this.values.person = person;
    if (number !== undefined) this.values.number = number;
    return this;
  }

  number(number: GrammaticalNumber): this {
    this.values.number = number;
    return this;
  }

  auxiliary(auxiliary: LanguageRegistry[L]['auxiliary']): this {
    this.values.auxiliary = auxiliary;
    return this;
  }

  classHint(hint: LanguageRegistry[L]['classHint']): this {
    this.values.classHint = hint;
    return this;
  }

  stems(stems: LanguageRegistry[L]['stems']): this {
    this.values.stems = stems;
    return this;
  }

  /** A subject slot of the language (`never` for a language without slots). */
  subject(subject: LanguageRegistry[L]['subject']): this {
    this.values.subject = subject;
    return this;
  }

  /** The options of language `L`, validated at runtime. */
  build(): ConjugationOptionsFor<L> {
    return parseConjugationOptions({
      ...this.values,
      language: this.language,
      infinitive: this.infinitiveValue,
    }) as ConjugationOptionsFor<L>;
  }
}

export function conjugationOptions<L extends Language>(language: L, infinitive: string): Builder<L> {
  return new ConjugationOptionsBuilder(language, infinitive) as Builder<L>;
}
