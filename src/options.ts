import { expandTargets, getCatalogue } from './catalogue.js';
import { ConjugationError } from './errors.js';
import type {
  Agreement, AgreementQuery, ConjugationOptions, DutchClassHint, DutchConjugationOptions, DutchPronoun,
  DutchStemHints, FrenchClassHint, FrenchConjugationOptions, FrenchStemHints, Gender, GrammaticalNumber,
  Language, MoodFor, Person, TenseFor,
} from './types.js';

const commonKeys = ['language', 'infinitive', 'mood', 'tense', 'person', 'number'];
const frenchKeys = [
  'gender', 'agreement', 'precedingDirectObject', 'reflexiveObject', 'auxiliary',
  'classHint', 'model', 'stems', 'aspiratedH', 'preferredOrthography',
];
const dutchKeys = [
  'pronoun', 'inversion', 'reflexive', 'auxiliary', 'classHint', 'stems',
  'separablePrefix', 'inseparablePrefix',
];

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function removeUndefined(value: Record<string, unknown>): void {
  for (const [key, item] of Object.entries(value)) {
    if (item === undefined) delete value[key];
    else if (isRecord(item)) removeUndefined(item);
  }
}

function member(value: unknown, choices: readonly unknown[], key: string): void {
  if (value !== undefined && !choices.includes(value)) {
    throw new ConjugationError('INVALID_REQUEST', `Invalid ${key}: ${String(value)}.`);
  }
}

function agreement(value: unknown, required: boolean, key: string): void {
  if (value === undefined) return;
  if (!isRecord(value) || Object.keys(value).some(k => !['gender', 'number'].includes(k))) {
    throw new ConjugationError('INVALID_REQUEST', `${key} must contain only gender and number.`);
  }
  member(value.gender, ['masculine', 'feminine'], `${key}.gender`);
  member(value.number, ['singular', 'plural'], `${key}.number`);
  if (required && (value.gender === undefined || value.number === undefined)) {
    throw new ConjugationError('INVALID_REQUEST', `${key} requires gender and number.`);
  }
}

function stemHints(value: unknown, language: Language): void {
  if (value === undefined) return;
  const words = language === 'fr'
    ? ['singular', 'plural', 'thirdPlural', 'future', 'past', 'pastParticiple']
    : ['stem', 'pastSingular', 'pastPlural', 'pastParticiple'];
  const other = language === 'fr' ? ['pastVowel'] : ['pastSuffix', 'unstressedFinalSyllable'];
  if (!isRecord(value) || Object.keys(value).some(k => ![...words, ...other].includes(k))) {
    throw new ConjugationError('INVALID_HINT', `Unknown ${language} stem hint.`);
  }
  for (const key of words) {
    if (value[key] !== undefined && (typeof value[key] !== 'string' || !/^[\p{L}\p{M}-]+$/u.test(value[key]))) {
      throw new ConjugationError('INVALID_HINT', `${key} must be a nonempty grammatical stem.`);
    }
  }
  member(value.pastVowel, ['a', 'i', 'u', 'in'], 'stems.pastVowel');
  member(value.pastSuffix, ['d', 't', 'both'], 'stems.pastSuffix');
  member(value.unstressedFinalSyllable, [true, false], 'stems.unstressedFinalSyllable');
  if (language === 'fr' && typeof value.future === 'string' && !value.future.endsWith('r')) {
    throw new ConjugationError('INVALID_HINT', 'A French future stem must include its final r.');
  }
}

function assertOptions(value: unknown): asserts value is ConjugationOptions {
  if (!isRecord(value)) throw new ConjugationError('INVALID_REQUEST', 'Conjugation options must be an object.');
  if (value.language !== 'fr' && value.language !== 'nl') {
    throw new ConjugationError('UNSUPPORTED_LANGUAGE', 'Language must be fr or nl.');
  }
  const language = value.language;
  const allowed = [...commonKeys, ...(language === 'fr' ? frenchKeys : dutchKeys)];
  for (const key of Object.keys(value)) {
    if (!allowed.includes(key)) throw new ConjugationError('INVALID_REQUEST', `Unknown ${language} option: ${key}.`);
  }
  if (typeof value.infinitive !== 'string' || !value.infinitive || !/^[\p{L}\p{M}' -]+$/u.test(value.infinitive)) {
    throw new ConjugationError('INVALID_INFINITIVE', 'Infinitive must be a nonempty verb spelling.');
  }
  const catalogue = getCatalogue(language);
  member(value.mood, catalogue.map(e => e.mood), 'mood');
  member(value.tense, catalogue.map(e => e.tense), 'tense');
  member(value.person, [1, 2, 3], 'person');
  member(value.number, ['singular', 'plural'], 'number');
  stemHints(value.stems, language);
  if (language === 'fr') {
    member(value.gender, ['masculine', 'feminine'], 'gender');
    member(value.auxiliary, ['avoir', 'être'], 'auxiliary');
    member(value.classHint, ['er', 'ir', 're'], 'classHint');
    member(value.reflexiveObject, ['direct', 'indirect'], 'reflexiveObject');
    member(value.aspiratedH, [true, false], 'aspiratedH');
    member(value.preferredOrthography, ['rectified', 'traditional'], 'preferredOrthography');
    agreement(value.agreement, false, 'agreement');
    agreement(value.precedingDirectObject, true, 'precedingDirectObject');
    if (value.model !== undefined && (typeof value.model !== 'string' || !/^[\p{L}\p{M}-]+$/u.test(value.model))) {
      throw new ConjugationError('INVALID_HINT', 'model must be a French model infinitive.');
    }
  } else {
    member(value.auxiliary, ['hebben', 'zijn'], 'auxiliary');
    member(value.classHint, ['weak', 'strong', 'loan'], 'classHint');
    member(value.pronoun, ['ik', 'jij', 'je', 'u', 'hij', 'zij', 'ze', 'het', 'wij', 'we', 'jullie'], 'pronoun');
    member(value.inversion, [true, false], 'inversion');
    member(value.reflexive, [true, false], 'reflexive');
    for (const key of ['separablePrefix', 'inseparablePrefix']) {
      if (value[key] !== undefined && (typeof value[key] !== 'string' || !/^[\p{L}\p{M}]+$/u.test(value[key]))) {
        throw new ConjugationError('INVALID_HINT', `${key} must be a nonempty prefix.`);
      }
    }
    if (value.separablePrefix !== undefined && value.inseparablePrefix !== undefined) {
      throw new ConjugationError('INVALID_HINT', 'A prefix cannot be both separable and inseparable.');
    }
  }
}

export function parseConjugationOptions(value: unknown): ConjugationOptions {
  if (!isRecord(value)) throw new ConjugationError('INVALID_REQUEST', 'Conjugation options must be an object.');
  const normalized = { ...value };
  const spelling = (text: string): string => text.normalize('NFC').toLowerCase()
    .replace(/[’ʼ]/gu, "'").trim().replace(/ +/gu, ' ');
  for (const key of ['infinitive', 'model', 'separablePrefix', 'inseparablePrefix']) {
    if (typeof normalized[key] === 'string') normalized[key] = spelling(normalized[key]);
  }
  if (isRecord(normalized.stems)) {
    normalized.stems = Object.fromEntries(Object.entries(normalized.stems).map(([key, item]) => [
      key, typeof item === 'string' ? spelling(item) : item,
    ]));
  }
  assertOptions(normalized);
  const parsed = structuredClone(normalized);
  removeUndefined(parsed);
  expandTargets(parsed);
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
