import { parseOptions } from './core/options.js';
import { engine } from './default-engine.js';
import { packs } from './languages/index.js';
import type {
  Agreement, AgreementQuery, ConjugationOptions, DutchClassHint, DutchConjugationOptions, DutchPronoun,
  DutchStemHints, FrenchClassHint, FrenchConjugationOptions, FrenchStemHints, Gender, GrammaticalNumber,
  Language, MoodFor, Person, TenseFor,
} from './types.js';

export function parseConjugationOptions(value: unknown): ConjugationOptions {
  const parsed = parseOptions(packs, value) as ConjugationOptions;
  engine.expandTargets(parsed);
  return parsed;
}

export class ConjugationOptionsBuilder<L extends Language> {
  private readonly values: Record<string, unknown> = {};
  private readonly language: L;
  private readonly infinitiveValue: string;

  constructor(language: L, infinitive: string) {
    this.language = language;
    this.infinitiveValue = infinitive;
  }

  mood(mood: MoodFor<L>): this {
    this.values.mood = mood;
    return this;
  }

  tense(tense: TenseFor<L>): this {
    this.values.tense = tense;
    return this;
  }

  indicative(tense?: L extends 'fr' ? import('./types.js').FrenchTenses['indicative'] : import('./types.js').DutchTenses['indicative']): this {
    this.values.mood = 'indicative';
    if (tense === undefined) delete this.values.tense;
    else this.values.tense = tense;
    return this;
  }

  conditional(tense?: 'present' | 'past'): this {
    this.values.mood = 'conditional';
    if (tense === undefined) delete this.values.tense;
    else this.values.tense = tense;
    return this;
  }

  subjunctive(this: ConjugationOptionsBuilder<'fr'>, tense?: 'present' | 'past' | 'imperfect' | 'pluperfect'): ConjugationOptionsBuilder<'fr'> {
    this.values.mood = 'subjunctive';
    if (tense === undefined) delete this.values.tense;
    else this.values.tense = tense;
    return this;
  }

  imperative(tense?: L extends 'fr' ? 'present' | 'past' : 'present'): this {
    this.values.mood = 'imperative';
    if (tense === undefined) delete this.values.tense;
    else this.values.tense = tense;
    return this;
  }

  infinitive(tense?: L extends 'fr' ? 'present' | 'past' : 'present'): this {
    this.values.mood = 'infinitive';
    if (tense === undefined) delete this.values.tense;
    else this.values.tense = tense;
    return this;
  }

  participle(tense?: L extends 'fr' ? 'present' | 'past' | 'perfect' : 'present' | 'past'): this {
    this.values.mood = 'participle';
    if (tense === undefined) delete this.values.tense;
    else this.values.tense = tense;
    return this;
  }

  gerund(this: ConjugationOptionsBuilder<'fr'>, tense?: 'present' | 'past'): ConjugationOptionsBuilder<'fr'> {
    this.values.mood = 'gerund';
    if (tense === undefined) delete this.values.tense;
    else this.values.tense = tense;
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

  gender(this: ConjugationOptionsBuilder<'fr'>, gender: Gender): ConjugationOptionsBuilder<'fr'> {
    this.values.gender = gender;
    return this;
  }

  agreement(this: ConjugationOptionsBuilder<'fr'>, agreement: AgreementQuery): ConjugationOptionsBuilder<'fr'> {
    this.values.agreement = agreement;
    return this;
  }

  precedingDirectObject(this: ConjugationOptionsBuilder<'fr'>, agreement: Agreement): ConjugationOptionsBuilder<'fr'> {
    this.values.precedingDirectObject = agreement;
    return this;
  }

  reflexiveObject(this: ConjugationOptionsBuilder<'fr'>, role: 'direct' | 'indirect'): ConjugationOptionsBuilder<'fr'> {
    this.values.reflexiveObject = role;
    return this;
  }

  auxiliary(auxiliary: L extends 'fr' ? 'avoir' | 'être' : 'hebben' | 'zijn'): this {
    this.values.auxiliary = auxiliary;
    return this;
  }

  classHint(hint: L extends 'fr' ? FrenchClassHint : DutchClassHint): this {
    this.values.classHint = hint;
    return this;
  }

  model(this: ConjugationOptionsBuilder<'fr'>, infinitive: string): ConjugationOptionsBuilder<'fr'> {
    this.values.model = infinitive;
    return this;
  }

  stems(stems: L extends 'fr' ? FrenchStemHints : DutchStemHints): this {
    this.values.stems = stems;
    return this;
  }

  aspiratedH(this: ConjugationOptionsBuilder<'fr'>, aspirated = true): ConjugationOptionsBuilder<'fr'> {
    this.values.aspiratedH = aspirated;
    return this;
  }

  preferredOrthography(this: ConjugationOptionsBuilder<'fr'>, orthography: 'rectified' | 'traditional'): ConjugationOptionsBuilder<'fr'> {
    this.values.preferredOrthography = orthography;
    return this;
  }

  pronoun(this: ConjugationOptionsBuilder<'nl'>, pronoun: DutchPronoun): ConjugationOptionsBuilder<'nl'> {
    this.values.pronoun = pronoun;
    return this;
  }

  inversion(this: ConjugationOptionsBuilder<'nl'>, inverted = true): ConjugationOptionsBuilder<'nl'> {
    this.values.inversion = inverted;
    return this;
  }

  reflexive(this: ConjugationOptionsBuilder<'nl'>, reflexive = true): ConjugationOptionsBuilder<'nl'> {
    this.values.reflexive = reflexive;
    return this;
  }

  separablePrefix(this: ConjugationOptionsBuilder<'nl'>, prefix: string): ConjugationOptionsBuilder<'nl'> {
    this.values.separablePrefix = prefix;
    return this;
  }

  inseparablePrefix(this: ConjugationOptionsBuilder<'nl'>, prefix: string): ConjugationOptionsBuilder<'nl'> {
    this.values.inseparablePrefix = prefix;
    return this;
  }

  build(this: ConjugationOptionsBuilder<'fr'>): FrenchConjugationOptions;
  build(this: ConjugationOptionsBuilder<'nl'>): DutchConjugationOptions;
  build(): ConjugationOptions;
  build(): ConjugationOptions {
    return parseConjugationOptions({
      ...this.values,
      language: this.language,
      infinitive: this.infinitiveValue,
    });
  }
}

export function conjugationOptions<L extends Language>(language: L, infinitive: string): ConjugationOptionsBuilder<L> {
  return new ConjugationOptionsBuilder(language, infinitive);
}
