/**
 * The findings of the whole-pack review (`.superpowers/sdd/lang-es/whole-pack-review.md`) and the controller's last-round
 * rulings, one block per finding.
 */
import { describe, expect, it } from 'vitest';
import { createEngine } from '../../src/core/engine.js';
import { resolvedTargetKey } from '../../src/core/target.js';
import { locales } from '../../src/i18n/locales/index.js';
import { parseConjugationOptions } from '../../src/index.js';
import { packs } from '../../src/languages/index.js';
import type { ConjugatedForm } from '../../src/types.js';

const engine = createEngine(packs, locales);
const conjugated = (infinitive: string, options: Record<string, unknown> = {}) => engine.conjugate({ language: 'es', infinitive, ...options });
const bare = (form: ConjugatedForm) => engine.renderParts('es', form.parts, { bare: true });
const texts = (infinitive: string, options: Record<string, unknown>) => conjugated(infinitive, options).forms.map(form => form.text);
function row(infinitive: string, mood: string, tense: string, extra: Record<string, unknown> = {}): string[] {
  const byTarget = new Map<string, string[]>();
  for (const form of conjugated(infinitive, { mood, tense, ...extra }).forms) {
    const key = resolvedTargetKey(form.target);
    byTarget.set(key, [...byTarget.get(key) ?? [], bare(form)]);
  }
  return [...byTarget.values()].map(forms => forms.join(' / '));
}
const one = (infinitive: string, mood: string, tense: string, person?: 1 | 2 | 3, number?: 'singular' | 'plural') =>
  conjugated(infinitive, { mood, tense, ...(person === undefined ? {} : { person, number }) }).forms;
const analysisOf = (infinitive: string, extra: Record<string, unknown> = {}) => packs.es.engine(parseConjugationOptions({ language: 'es', infinitive, ...extra })).analysis;
const ids = (infinitive: string, extra: Record<string, unknown> = {}) => analysisOf(infinitive, extra).steps!.map(s => s.rule);
const explained = (subject: Parameters<typeof engine.explain>[1], locale = 'en') =>
  engine.explain('es', subject, locale).sections.flatMap(section => section.steps.map(s => s.text)).join('\n');

describe('C1: the h of hue- only at the start of a word; desosar and desovar are lexical', () => {
  it('conjugates desollar without an h and keeps it in deshueso, deshuevo, huelo', () => {
    expect(row('desollar', 'indicative', 'present')).toEqual(['desuello', 'desuellas', 'desuella', 'desollamos', 'desolláis', 'desuellan']);
    expect(row('desollar', 'subjunctive', 'present')[0]).toBe('desuelle');
    expect(row('desollar', 'imperative', 'present')[0]).toBe('desuella');
    expect(row('desosar', 'indicative', 'present')[0]).toBe('deshueso');
    expect(row('desovar', 'indicative', 'present')[0]).toBe('deshuevo');
    expect(row('desosar', 'indicative', 'present')[3]).toBe('desosamos');
    expect(row('oler', 'indicative', 'present')[0]).toBe('huelo');
    expect(row('desolar', 'indicative', 'present')[0]).toBe('desuelo');
    expect(row('descollar', 'indicative', 'present')[0]).toBe('descuello');
    expect(row('desconsolar', 'indicative', 'present')[0]).toBe('desconsuelo');
    expect(one('desosar', 'indicative', 'present', 1, 'singular')[0]!.ruleIds).toContain('es.stem.hue');
    expect(explained(one('oler', 'indicative', 'present', 1, 'singular')[0]!)).not.toContain('des-');
  });
});

export { analysisOf, explained, ids, texts };
