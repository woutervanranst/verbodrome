import { ConjugationError } from '../errors.js';
import { packFor } from './pack.js';
import type { LanguagePack } from './pack.js';

// Interim: the French/Dutch validation moved out of src/options.ts so an engine can validate against its own packs
// without an import cycle. Only the language check is pack-driven; the French and Dutch checks below are still
// hard-coded here and belong in the packs.
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

function stemHints(value: unknown, language: string): void {
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

function assertOptions(packs: Readonly<Record<string, LanguagePack>>, value: unknown): asserts value is Record<string, unknown> {
  if (!isRecord(value)) throw new ConjugationError('INVALID_REQUEST', 'Conjugation options must be an object.');
  const { catalogue } = packFor(packs, value.language);
  const language = String(value.language);
  const allowed = [...commonKeys, ...(language === 'fr' ? frenchKeys : dutchKeys)];
  for (const key of Object.keys(value)) {
    if (!allowed.includes(key)) throw new ConjugationError('INVALID_REQUEST', `Unknown ${language} option: ${key}.`);
  }
  if (typeof value.infinitive !== 'string' || !value.infinitive || !/^[\p{L}\p{M}' -]+$/u.test(value.infinitive)) {
    throw new ConjugationError('INVALID_INFINITIVE', 'Infinitive must be a nonempty verb spelling.');
  }
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

/**
 * Normalizes spelling, validates against the registered packs and returns a clone without undefined values.
 * Does not check that the grammatical filters match a target; the engine's target expansion does.
 */
export function parseOptions(packs: Readonly<Record<string, LanguagePack>>, value: unknown): Record<string, unknown> {
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
  assertOptions(packs, normalized);
  const parsed = structuredClone(normalized);
  removeUndefined(parsed);
  return parsed;
}
