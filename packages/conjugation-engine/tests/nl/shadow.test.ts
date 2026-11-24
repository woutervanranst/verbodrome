/**
 * The Dutch staged grammar, run beside the legacy resolver that still serves `conjugate`. A shadow engine conjugates
 * every query of the frozen Dutch snapshot with the staged grammar. A query listed in `shadow-pending.txt` (one header
 * line each, in snapshot order) needs a stage that is not migrated yet, and must stop there with a NotMigratedError;
 * every other query must reproduce its frozen block exactly. Each task that migrates a stage deletes the queries that
 * now match and lowers PINNED: the list may only shrink.
 */
import { readFileSync } from 'node:fs';
import { gunzipSync } from 'node:zlib';
import { describe, expect, it } from 'vitest';
import { analysisLine, characterize, queryHeader } from '../../scripts/characterize/serialize.ts';
import type { CharacterizationQuery } from '../../scripts/characterize/serialize.ts';
import { createEngine } from '../../src/core/engine.js';
import { parseOptions } from '../../src/core/options.js';
import type { LanguagePack } from '../../src/core/pack.js';
import { stagedEngine } from '../../src/core/staged.js';
import { engine as legacyEngine } from '../../src/default-engine.js';
import { renderStep } from '../../src/i18n/explain.js';
import { locales } from '../../src/i18n/locales/index.js';
import { dutchSubjects, dutchSubjectsFor } from '../../src/languages/nl/catalogue.js';
import { dutchGrammar, NotMigratedError } from '../../src/languages/nl/grammar.js';
import { dutchPack } from '../../src/languages/nl/pack.js';
import type { ResolvedTarget } from '../../src/types.js';

/** How many snapshot queries still need an unmigrated stage; lowered by each task that migrates one. */
const PINNED = 1450;

/** The Dutch pack with the staged grammar and the subject slots, which the registered pack gets when Dutch switches. */
const shadowPack: LanguagePack<'nl'> = {
  ...dutchPack,
  subjects: dutchSubjects,
  subjectsFor: dutchSubjectsFor,
  engine: query => stagedEngine(dutchGrammar, dutchPack.rendering, query),
};
const shadowDutch = createEngine({ nl: shadowPack }, locales);

const directory = new URL('../characterization/', import.meta.url);
const queries = new Map((JSON.parse(readFileSync(new URL('nl.queries.json', directory), 'utf8')) as CharacterizationQuery[])
  .map(query => [queryHeader(query), query] as const));
const headers = [...queries.keys()];
const frozen = new Map(gunzipSync(readFileSync(new URL('nl.tsv.gz', directory))).toString('utf8').split('\n\n').map(block => {
  const lines = block.replace(/\n$/u, '').split('\n');
  return [lines[0] ?? '', lines] as const;
}));
const pendingLines = readFileSync(new URL('./shadow-pending.txt', import.meta.url), 'utf8').split('\n').filter(line => line !== '');
const pending = new Set(pendingLines);

/** What the shadow engine does with one query: its block, or the stage it is waiting for, or the error it threw. */
type Shadow = { readonly block: string[] } | { readonly waitsFor: string } | { readonly error: unknown };

const results = new Map<string, Shadow>();
function shadow(header: string): Shadow {
  let result = results.get(header);
  if (!result) {
    try {
      result = { block: characterize(queries.get(header)!, shadowDutch) };
    } catch (error) {
      result = error instanceof NotMigratedError ? { waitsFor: error.stage } : { error };
    }
    results.set(header, result);
  }
  return result;
}

function describeShadow(result: Shadow, expected: readonly string[]): string {
  if ('waitsFor' in result) return `waits for the ${result.waitsFor} stage`;
  if ('error' in result) return `throws ${result.error instanceof Error ? `${result.error.name}: ${result.error.message}` : String(result.error)}`;
  const index = result.block.findIndex((line, at) => line !== expected[at]);
  const at = index < 0 ? result.block.length : index;
  return `differs at line ${at}: was ${expected[at] ?? '(end of block)'}, now ${result.block[at] ?? '(end of block)'}`;
}

describe('Dutch shadow engine', () => {
  it('lists only snapshot queries as pending, each once and in snapshot order', () => {
    expect(pendingLines.length).toBe(pending.size);
    expect(pendingLines).toEqual(headers.filter(header => pending.has(header)));
  });

  it('only ever shrinks its pending list', () => {
    expect(pending.size).toBeLessThanOrEqual(PINNED);
  });

  it('reproduces the frozen block of every query that is not pending', () => {
    const mismatches = headers.filter(header => !pending.has(header)).flatMap(header => {
      const result = shadow(header);
      const expected = frozen.get(header) ?? [];
      return 'block' in result && result.block.join('\n') === expected.join('\n') ? [] : [`${header}: ${describeShadow(result, expected)}`];
    });
    expect(mismatches.slice(0, 20), `${mismatches.length} queries differ`).toEqual([]);
  });

  it('stops every pending query at a stage that is not migrated yet, and at nothing else', () => {
    const wrong = pendingLines.flatMap(header => {
      const result = shadow(header);
      if ('waitsFor' in result) return [];
      const matches = 'block' in result && result.block.join('\n') === frozen.get(header)?.join('\n');
      return [`${header}: ${matches ? 'now matches the frozen block: delete it from shadow-pending.txt and lower PINNED' : describeShadow(result, frozen.get(header) ?? [])}`];
    });
    expect(wrong.slice(0, 20), `${wrong.length} pending queries are not waiting for a migration`).toEqual([]);
  });

  it('classifies every pending query as its frozen analysis line says', () => {
    // Classification is migrated: a pending query's verb id, class, source, reflexivity, auxiliaries and English
    // assumptions already match, although its forms wait for later stages.
    const english = { pack: shadowPack, catalog: locales.en, locale: 'en', mood: null };
    const mismatches = pendingLines.flatMap(header => {
      const { verbId, analysis } = shadowPack.engine(parseOptions({ nl: shadowPack }, queries.get(header)));
      const assumptions = [...new Set((analysis.steps ?? []).filter(s => s.kind === 'assumption').map(s => renderStep(s, english)))];
      const line = analysisLine({ verbId, analysis: { ...analysis, assumptions } });
      const expected = frozen.get(header)?.[1];
      return line === expected ? [] : [`${header}\n  was: ${expected}\n  now: ${line}`];
    });
    expect(mismatches.slice(0, 20), `${mismatches.length} analysis lines differ`).toEqual([]);
  });

  it.each([undefined, 'ik', 'jij', 'je', 'u', 'hij', 'zij', 'ze', 'het', 'wij', 'we', 'jullie'])(
    'expands the targets of the legacy pronoun option through subject slots: %s',
    pronoun => {
      const options = { language: 'nl', infinitive: 'werken', ...(pronoun === undefined ? {} : { pronoun }) };
      const withoutSubject = (targets: readonly ResolvedTarget[]) => targets.map(({ subject: _, ...target }) => target);
      const staged = shadowDutch.expandTargets(options);
      expect(withoutSubject(staged)).toEqual(legacyEngine.expandTargets(options));
      const slots = new Set(staged.flatMap(target => target.subject === undefined ? [] : [target.subject]));
      const pronouns = new Set(dutchSubjects.filter(slot => slots.has(slot.id)).map(slot => slot.pronoun));
      expect([...pronouns]).toEqual(pronoun === undefined ? ['ik', 'jij', 'hij', 'wij', 'jullie', 'zij'] : [pronoun]);
    },
  );
});
