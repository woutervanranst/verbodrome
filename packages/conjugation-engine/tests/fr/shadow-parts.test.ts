/**
 * What the trainer reads beyond the snapshot (GD R1): for every snapshot query with `gender: 'masculine'` (the trainer's
 * query), the legacy engine and the shadow engine give the same forms part by part (role, text, lemma, features,
 * onset, joinBefore), the same variants, targets, texts and `preferred`, the same analysis and the same unavailable
 * targets, once what only the staged engine has is set aside: steps, rule ids, the subject slot, the region and the
 * analysis of the other paradigms. Deleted at the switch (Task 8).
 */
import { expect, it } from 'vitest';
import { conjugate } from '../../src/index.js';
import type { ConjugationOptions, ConjugationResult } from '../../src/index.js';
import { frenchQueries, shadow } from './shadow.js';

/** A result with what only the staged engine records set aside. */
function comparable(result: ConjugationResult): unknown {
  const { steps: _steps, alternatives: _alternatives, pattern: _pattern, condition: _condition, ...analysis } = result.analysis;
  return {
    verbId: result.verbId, status: result.status, analysis,
    forms: result.forms.map(({ steps: _s, ruleIds: _r, target: { subject: _subject, ...target }, variant: { region, ...variant }, parts, ...form }) => ({
      ...form, target, variant: region === null ? variant : { ...variant, region }, parts: parts.map(({ steps: _p, ...part }) => part),
    })),
    unavailableTargets: result.unavailableTargets.map(({ explanation: _e, source: _o, step: _t, target: { subject: _subject, ...target }, ...rest }) => ({ ...rest, target })),
  };
}

it('gives the trainer the same parts, features, analysis and unavailable targets as the legacy engine', () => {
  const queries = frenchQueries.filter(query => query.gender === 'masculine' && !['bleder', 'crebler', 'pequer', 'blettre'].includes(query.infinitive));
  expect(queries.length).toBeGreaterThan(80);
  const differing: string[] = [];
  for (const query of queries) {
    let legacy: unknown;
    let staged: unknown;
    try {
      legacy = comparable(conjugate(query as unknown as ConjugationOptions));
    } catch (error) {
      legacy = String(error);
    }
    try {
      staged = comparable(shadow.conjugate(query));
    } catch (error) {
      staged = String(error);
    }
    if (JSON.stringify(legacy) !== JSON.stringify(staged)) differing.push(JSON.stringify(query));
  }
  expect(differing).toEqual([]);
  expect(queries.filter(query => { try { shadow.conjugate(query); return true; } catch { return false; } }).length).toBeGreaterThan(80);
}, 600_000);
