import { ConjugationError } from './errors.js';
import type { ConjugationOptions, DutchPronoun, Language, Mood, Person, ResolvedTarget, Tense } from './types.js';

export interface CatalogueEntry {
  readonly mood: Mood;
  readonly tense: Tense;
  readonly moodLabel: string;
  readonly tenseLabel: string;
  readonly finite: boolean;
}

function entries(mood: Mood, moodLabel: string, tenses: readonly (readonly [Tense, string])[]): CatalogueEntry[] {
  return tenses.map(([tense, tenseLabel]) => Object.freeze({
    mood, tense, moodLabel, tenseLabel,
    finite: !['infinitive', 'participle', 'gerund'].includes(mood),
  }));
}

export const frenchCatalogue: readonly CatalogueEntry[] = Object.freeze([
  ...entries('indicative', 'Indicatif', [
    ['present', 'Présent'], ['perfect', 'Passé composé'], ['imperfect', 'Imparfait'],
    ['pluperfect', 'Plus-que-parfait'], ['simple_past', 'Passé simple'],
    ['past_anterior', 'Passé antérieur'], ['future', 'Futur simple'],
    ['future_perfect', 'Futur antérieur'], ['near_future', 'Futur proche'], ['recent_past', 'Passé récent'],
  ]),
  ...entries('subjunctive', 'Subjonctif', [
    ['present', 'Présent'], ['past', 'Passé'], ['imperfect', 'Imparfait'], ['pluperfect', 'Plus-que-parfait'],
  ]),
  ...entries('conditional', 'Conditionnel', [['present', 'Présent'], ['past', 'Passé']]),
  ...entries('imperative', 'Impératif', [['present', 'Présent'], ['past', 'Passé']]),
  ...entries('infinitive', 'Infinitif', [['present', 'Présent'], ['past', 'Passé']]),
  ...entries('participle', 'Participe', [
    ['present', 'Présent'], ['past', 'Passé'], ['perfect', 'Passé (forme composée)'],
  ]),
  ...entries('gerund', 'Gérondif', [['present', 'Présent'], ['past', 'Passé']]),
]);

export const dutchCatalogue: readonly CatalogueEntry[] = Object.freeze([
  ...entries('indicative', 'Aantonende wijs', [
    ['present', 'Onvoltooid tegenwoordige tijd'], ['past', 'Onvoltooid verleden tijd'],
    ['future', 'Onvoltooid tegenwoordige toekomende tijd'], ['perfect', 'Voltooid tegenwoordige tijd'],
    ['pluperfect', 'Voltooid verleden tijd'], ['future_perfect', 'Voltooid tegenwoordige toekomende tijd'],
  ]),
  ...entries('conditional', 'Voorwaardelijke wijs', [
    ['present', 'Onvoltooid verleden toekomende tijd'], ['past', 'Voltooid verleden toekomende tijd'],
  ]),
  ...entries('imperative', 'Gebiedende wijs', [['present', 'Tegenwoordig']]),
  ...entries('infinitive', 'Onbepaalde wijs', [['present', 'Tegenwoordig']]),
  ...entries('participle', 'Deelwoord', [['present', 'Tegenwoordig deelwoord'], ['past', 'Voltooid deelwoord']]),
]);

export function getCatalogue(language: Language): readonly CatalogueEntry[] {
  if (language !== 'fr' && language !== 'nl') throw new ConjugationError('UNSUPPORTED_LANGUAGE', 'Language must be fr or nl.');
  return language === 'fr' ? frenchCatalogue : dutchCatalogue;
}

function pronounMatches(pronoun: DutchPronoun, person: Person, number: 'singular' | 'plural'): boolean {
  if (pronoun === 'ik') return person === 1 && number === 'singular';
  if (['jij', 'je', 'u'].includes(pronoun)) return person === 2 && number === 'singular';
  if (pronoun === 'hij' || pronoun === 'het') return person === 3 && number === 'singular';
  if (pronoun === 'wij' || pronoun === 'we') return person === 1 && number === 'plural';
  if (pronoun === 'jullie') return person === 2 && number === 'plural';
  return person === 3;
}

export function expandTargets(options: ConjugationOptions): ResolvedTarget[] {
  const targets: ResolvedTarget[] = [];
  for (const entry of getCatalogue(options.language)) {
    if (options.mood !== undefined && options.mood !== entry.mood) continue;
    if (options.tense !== undefined && options.tense !== entry.tense) continue;
    if (!entry.finite) {
      if (options.person !== undefined || options.number !== undefined) continue;
      targets.push({ mood: entry.mood, tense: entry.tense, person: null, number: null, gender: null, agreement: null });
      continue;
    }
    for (const number of ['singular', 'plural'] as const) {
      for (const person of [1, 2, 3] as const) {
        if (options.number !== undefined && options.number !== number) continue;
        if (options.person !== undefined && options.person !== person) continue;
        if (options.language === 'nl' && options.pronoun && !pronounMatches(options.pronoun, person, number)) continue;
        if (entry.mood === 'imperative'
          && (options.language === 'fr'
            ? !(person === 2 || (person === 1 && number === 'plural'))
            : person !== 2)) continue;
        targets.push({ mood: entry.mood, tense: entry.tense, person, number, gender: null, agreement: null });
      }
    }
  }
  if (!targets.length) {
    throw new ConjugationError('INVALID_TARGET', 'The grammatical filters do not match any supported target.');
  }
  return targets;
}

export function targetKey(target: ResolvedTarget): string {
  return `${target.mood}/${target.tense}/${target.person ?? '-'}/${target.number ?? '-'}`;
}

export function resolvedTargetKey(target: ResolvedTarget): string {
  return JSON.stringify([
    target.mood, target.tense, target.person, target.number, target.gender,
    target.agreement?.gender ?? null, target.agreement?.number ?? null,
  ]);
}

export function labelsFor(language: Language, target: ResolvedTarget): { mood: string; tense: string } {
  const entry = getCatalogue(language).find(item => item.mood === target.mood && item.tense === target.tense);
  if (!entry) throw new ConjugationError('GENERATION_FAILURE', `Missing catalogue entry for ${targetKey(target)}.`);
  return { mood: entry.moodLabel, tense: entry.tenseLabel };
}
