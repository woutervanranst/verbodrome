/**
 * The acceptance test: French to Dutch reproduces the trainer's tables. The app maps ten French tenses to a Dutch tense
 * directly (`DIRECT`), shows the four subjunctives as a Dutch `dat` clause in an indicative tense (`SUBJUNCTIVE`) and
 * composes the other eleven by hand; this file reads the two tables out of the app's source (a drift guard: a change
 * there fails here first) and pins the eleven others. When the app switches to `equivalentTenses`, the tables and this
 * guard go.
 */
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { getCatalogue } from '../../src/catalogue.js';
import type { NoteKey } from '../../src/equivalence/concepts.js';
import type { MatchType } from '../../src/equivalence/derive.js';
import { equivalentTenses } from '../../src/equivalence/index.js';
import type { TenseRef } from '../../src/equivalence/index.js';

const source = readFileSync(new URL('../../../../apps/verbodrome/src/trainer/prompt.ts', import.meta.url), 'utf8');

/** The lines of the object literal that starts at `const <name>`. */
function table(name: string): string[] {
  const start = source.indexOf(`const ${name}`);
  expect(start, name).toBeGreaterThanOrEqual(0);
  return source.slice(start, source.indexOf('};', start)).split('\n').slice(1).filter(line => line.trim() !== '');
}

const direct = table('DIRECT').map(line => {
  const found = /^\s*'(\w+\.\w+)': \['(\w+)', '(\w+)'\],$/u.exec(line);
  if (!found) throw new Error(`unexpected DIRECT line: ${line}`);
  return [found[1]!, `${found[2]!}.${found[3]!}`] as const;
});
const subjunctive = table('SUBJUNCTIVE').map(line => {
  const found = /^\s*'(subjunctive\.\w+)': '(\w+)',$/u.exec(line);
  if (!found) throw new Error(`unexpected SUBJUNCTIVE line: ${line}`);
  return [found[1]!, `indicative.${found[2]!}`] as const;
});

/** The French tenses the app composes by hand, with the top Dutch tense, its score, match type and notes. */
const composed: readonly (readonly [french: string, dutch: string, score: number, match: MatchType, notes: readonly NoteKey[]])[] = [
  ['indicative.near_future', 'indicative.present', 1, 'override', ['eq.pair.fr-nl.near-future']],
  ['indicative.recent_past', 'indicative.perfect', 1, 'override', ['eq.pair.fr-nl.recent-past']],
  ['imperative.present', 'imperative.present', 1, 'override', ['eq.pair.fr-nl.hortative']],
  ['imperative.past', 'participle.past', 0.4, 'approximate', ['eq.nl.compound-imp-perfect']],
  ['infinitive.present', 'infinitive.present', 1, 'exact', []],
  ['infinitive.past', 'participle.past', 0.4, 'approximate', ['eq.nl.compound-inf-perfect']],
  ['participle.present', 'participle.present', 1, 'exact', []],
  ['participle.past', 'participle.past', 1, 'exact', []],
  ['participle.perfect', 'participle.past', 0.4, 'approximate', ['eq.nl.compound-part-perfect']],
  ['gerund.present', 'participle.present', 0.5, 'exact', ['eq.nl.gerund-as-participle']],
  ['gerund.past', 'participle.past', 0.4, 'approximate', ['eq.nl.compound-gerund-perfect']],
];

const directScores: Readonly<Record<string, number>> = {
  'indicative.present': 1, 'indicative.perfect': 0.8, 'indicative.imperfect': 1, 'indicative.pluperfect': 1,
  'indicative.simple_past': 0.7, 'indicative.past_anterior': 1, 'indicative.future': 1, 'indicative.future_perfect': 1,
  'conditional.present': 1, 'conditional.past': 1,
};

function ref(key: string): TenseRef<'fr'> {
  const [mood, tense] = key.split('.');
  return { mood, tense } as TenseRef<'fr'>;
}

const top = (french: string) => equivalentTenses('fr', 'nl', ref(french)).matches[0];
const keyOf = (tense: { readonly mood: string; readonly tense: string } | undefined) => tense && `${tense.mood}.${tense.tense}`;

describe('French to Dutch reproduces the trainer', () => {
  it('reads the trainer tables (drift guard)', () => {
    expect(direct).toHaveLength(10);
    expect(subjunctive).toHaveLength(4);
  });

  it('accounts for every French tense in exactly one table', () => {
    const tables = [...direct.map(([french]) => french), ...subjunctive.map(([french]) => french), ...composed.map(([french]) => french)];
    expect(tables).toHaveLength(25);
    expect([...tables].sort()).toEqual(getCatalogue('fr').map(entry => `${entry.mood}.${entry.tense}`).sort());
  });

  it.each(direct)('%s: the Dutch %s first, as the DIRECT table', (french, dutch) => {
    const entry = top(french);
    expect(keyOf(entry?.tense)).toBe(dutch);
    expect(entry?.score).toBe(directScores[french]);
    if (french === 'indicative.past_anterior') {
      expect([entry?.match, entry?.relaxed]).toEqual(['approximate', ['aspect']]);
    } else {
      expect([entry?.match, entry?.relaxed]).toEqual(['exact', []]);
    }
  });

  it.each(subjunctive)('%s: the Dutch %s first, as the SUBJUNCTIVE table', (french, dutch) => {
    const entry = top(french);
    expect(keyOf(entry?.tense)).toBe(dutch);
    expect([entry?.score, entry?.match, entry?.relaxed]).toEqual([1, 'approximate', ['mood']]);
    expect(entry?.notes).toContain('eq.note.no-subjunctive');
  });

  it.each(composed)('%s: the Dutch %s first, as the app composes it', (french, dutch, score, match, notes) => {
    const entry = top(french);
    expect([keyOf(entry?.tense), entry?.score, entry?.match, entry?.notes]).toEqual([dutch, score, match, notes]);
  });

  it('keeps the Dutch future second for the near future, after the gaan override', () => {
    const second = equivalentTenses('fr', 'nl', { mood: 'indicative', tense: 'near_future' }).matches[1];
    expect([keyOf(second?.tense), second?.score, second?.match]).toEqual(['indicative.future', 0.6, 'exact']);
  });
});
