import { ConjugationError } from '../errors.js';
import type { ConjugationErrorCode } from '../errors.js';
import { packFor } from './pack.js';
import type { LanguagePack } from './pack.js';

/** How one option field of a language is validated. Messages are generated from the field name and these values. */
export type FieldSpec =
  /** One of `values` (strings, numbers or booleans). */
  | { readonly kind: 'enum'; readonly values: readonly (string | number | boolean)[] }
  | { readonly kind: 'boolean' }
  /** A string matching `pattern`; anything else throws `code` with `message`. Normalized like the infinitive. */
  | { readonly kind: 'word'; readonly pattern: RegExp; readonly code: ConjugationErrorCode; readonly message: string }
  /** `{ gender?, number? }`; `required` demands both. */
  | { readonly kind: 'agreement'; readonly required: boolean }
  /** An object of stem `words` (each a grammatical stem) and `enums` (each one of the listed values); no other keys. */
  | { readonly kind: 'stems'; readonly words: readonly string[]; readonly enums: Readonly<Record<string, readonly unknown[]>> };

export interface OptionSchema {
  /** The language's own option keys, validated in declaration order. */
  readonly fields: Readonly<Record<string, FieldSpec>>;
  /** Cross-field checks, run after every field is valid; throws ConjugationError. */
  check?(options: Readonly<Record<string, unknown>>): void;
}

const infinitivePattern = /^[\p{L}\p{M}' -]+$/u;
const stemPattern = /^[\p{L}\p{M}-]+$/u;
const genders = ['masculine', 'feminine'];
const numbers = ['singular', 'plural'];

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function removeUndefined(value: Record<string, unknown>): void {
  for (const [key, item] of Object.entries(value)) {
    if (item === undefined) delete value[key];
    else if (isRecord(item)) removeUndefined(item);
  }
}

function spelling(text: string): string {
  return text.normalize('NFC').toLowerCase().replace(/[’ʼ]/gu, "'").trim().replace(/ +/gu, ' ');
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
  member(value.gender, genders, `${key}.gender`);
  member(value.number, numbers, `${key}.number`);
  if (required && (value.gender === undefined || value.number === undefined)) {
    throw new ConjugationError('INVALID_REQUEST', `${key} requires gender and number.`);
  }
}

function stems(value: unknown, spec: Extract<FieldSpec, { kind: 'stems' }>, language: string): void {
  if (value === undefined) return;
  const known = [...spec.words, ...Object.keys(spec.enums)];
  if (!isRecord(value) || Object.keys(value).some(k => !known.includes(k))) {
    throw new ConjugationError('INVALID_HINT', `Unknown ${language} stem hint.`);
  }
  for (const key of spec.words) {
    const stem = value[key];
    if (stem !== undefined && (typeof stem !== 'string' || !stemPattern.test(stem))) {
      throw new ConjugationError('INVALID_HINT', `${key} must be a nonempty grammatical stem.`);
    }
  }
  for (const [key, choices] of Object.entries(spec.enums)) member(value[key], choices, `stems.${key}`);
}

function validateField(key: string, spec: FieldSpec, value: unknown, language: string): void {
  switch (spec.kind) {
    case 'enum': return member(value, spec.values, key);
    case 'boolean': return member(value, [true, false], key);
    case 'word':
      if (value !== undefined && (typeof value !== 'string' || !spec.pattern.test(value))) {
        throw new ConjugationError(spec.code, spec.message);
      }
      return;
    case 'agreement': return agreement(value, spec.required, key);
    case 'stems': return stems(value, spec, language);
  }
}

/** Lowercases/NFC-normalizes the infinitive, every `word` field and every string inside `stems`. */
function normalizeSpelling(normalized: Record<string, unknown>, schema: OptionSchema): void {
  const words = ['infinitive', ...Object.entries(schema.fields).filter(([, spec]) => spec.kind === 'word').map(([key]) => key)];
  for (const key of words) {
    const item = normalized[key];
    if (typeof item === 'string') normalized[key] = spelling(item);
  }
  for (const [key, spec] of Object.entries(schema.fields)) {
    const item = normalized[key];
    if (spec.kind === 'stems' && isRecord(item)) {
      normalized[key] = Object.fromEntries(Object.entries(item).map(([stem, text]) => [
        stem, typeof text === 'string' ? spelling(text) : text,
      ]));
    }
  }
}

/**
 * Normalizes spelling, validates against the registered packs and returns a clone without undefined values.
 * Every language's keys, values and cross-field rules come from its pack's option schema.
 * Does not check that the grammatical filters match a target; the engine's target expansion does.
 */
export function parseOptions(packs: Readonly<Record<string, LanguagePack>>, value: unknown): Record<string, unknown> {
  if (!isRecord(value)) throw new ConjugationError('INVALID_REQUEST', 'Conjugation options must be an object.');
  const { catalogue, options: schema } = packFor(packs, value.language);
  const language = String(value.language);
  const normalized = { ...value };
  normalizeSpelling(normalized, schema);

  const common = ['language', 'infinitive', 'mood', 'tense', 'person', 'number'];
  for (const key of Object.keys(normalized)) {
    if (!common.includes(key) && !Object.hasOwn(schema.fields, key)) {
      throw new ConjugationError('INVALID_REQUEST', `Unknown ${language} option: ${key}.`);
    }
  }
  if (typeof normalized.infinitive !== 'string' || !normalized.infinitive || !infinitivePattern.test(normalized.infinitive)) {
    throw new ConjugationError('INVALID_INFINITIVE', 'Infinitive must be a nonempty verb spelling.');
  }
  member(normalized.mood, catalogue.map(e => e.mood), 'mood');
  member(normalized.tense, catalogue.map(e => e.tense), 'tense');
  member(normalized.person, [1, 2, 3], 'person');
  member(normalized.number, numbers, 'number');
  for (const [key, spec] of Object.entries(schema.fields)) validateField(key, spec, normalized[key], language);
  schema.check?.(normalized);

  const parsed = structuredClone(normalized);
  removeUndefined(parsed);
  return parsed;
}
