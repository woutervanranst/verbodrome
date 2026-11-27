/**
 * The runtime i18n check: every form, every unavailable target and every verb analysis a language produces for its
 * queries explains in every locale without throwing, and no rendered text (summary, section title, step) has a
 * placeholder left in it (`{`, `}`) or the word `undefined`. A language adds one entry to `checked`, with the engine
 * that conjugates it and the queries to run; a query that the engine rejects with a ConjugationError has nothing to
 * explain and is skipped.
 */
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import type { Engine } from '../../src/core/engine.js';
import { ConjugationError } from '../../src/errors.js';
import { locales } from '../../src/i18n/locales/index.js';
import type { Explainable } from '../../src/i18n/explain.js';
import type { ConjugationResult } from '../../src/types.js';
import { engine } from '../../src/default-engine.js';

interface Checked {
  readonly language: string;
  readonly engine: Engine;
  readonly queries: readonly Readonly<Record<string, unknown>>[];
}

/** The queries of a language's characterization snapshot. */
const snapshotQueries = (language: string): Readonly<Record<string, unknown>>[] =>
  JSON.parse(readFileSync(new URL(`../characterization/${language}.queries.json`, import.meta.url), 'utf8')) as Readonly<Record<string, unknown>>[];

const checked: readonly Checked[] = [
  { language: 'nl', engine, queries: snapshotQueries('nl') },
  { language: 'fr', engine, queries: snapshotQueries('fr') },
  { language: 'en', engine, queries: [...(JSON.parse(readFileSync(new URL('../fixtures/en.json', import.meta.url), 'utf8')) as { infinitive: string }[]).map(file => file.infinitive), 'glorp', 'blit', 'frobe', 'glish', 'glotch', 'flox', 'bliz', 'plaw', 'plory', 'floy', 'snie', 'sklee', 'ploe', 'blye', 'plargue', 'ploto', 'zamic', 'squip', 'trimbit', 'reblit', 'frandel', 'outswim', 'walk', 'stop', 'hope', 'hop', 'try', 'panic', 'picnic', 'travel', 'cancel', 'label', 'model', 'equal', 'fuel', 'dial', 'compel', 'control', 'patrol', 'excel', 'prefer', 'occur', 'admit', 'visit', 'benefit', 'focus', 'target', 'combat', 'enter', 'conquer', 'profit', 'interpret', 'offer', 'develop', 'format', 'handicap', 'kidnap', 'program', 'worship', 'parallel', 'quiz', 'veto', 'echo', 'die', 'tie', 'dye', 'hoe', 'singe', 'agree', 'argue', 'glue', 'queue', 'solo', 'gas', 'fulfil', 'fulfill', 'dive', 'prove', 'learn', 'spell', 'sneak', 'light', 'spring', 'awake', 'show', 'sew', 'thrive', 'input', 'slay', 'misspell', 'underlie', 'outbid', 'behave', 'relay'].map(infinitive => ({ language: 'en', infinitive })) },
];

const leftover = /[{}]|undefined/u;

/** What is wrong with the explanations of one query's result, in every locale. */
function problemsOf({ language, engine }: Checked, query: Readonly<Record<string, unknown>>): string[] {
  let result: ConjugationResult;
  try {
    result = engine.conjugate(query);
  } catch (error) {
    if (error instanceof ConjugationError) return [];
    throw error;
  }
  const subjects: Explainable[] = [...result.forms, ...result.unavailableTargets, result.analysis];
  return Object.keys(locales).flatMap(locale => subjects.flatMap(subject => {
    const where = `${JSON.stringify(query)} (${locale})`;
    try {
      const { summary, sections } = engine.explain(language, subject, locale);
      const texts = [summary, ...sections.flatMap(section => [section.title, ...section.steps.map(s => s.text)])];
      return texts.filter(text => leftover.test(text)).map(text => `${where}: ${text}`);
    } catch (error) {
      return [`${where}: ${error instanceof Error ? error.message : String(error)}`];
    }
  }));
}

describe('runtime i18n', () => {
  it.each(checked.map(entry => [entry.language, entry] as const))('%s: every form, unavailable target and analysis explains in every locale', (_, entry) => {
    expect(entry.queries.length).toBeGreaterThan(0);
    const problems = entry.queries.flatMap(query => problemsOf(entry, query));
    expect(problems.slice(0, 20), `${problems.length} problems`).toEqual([]);
  }, 120_000);
});
