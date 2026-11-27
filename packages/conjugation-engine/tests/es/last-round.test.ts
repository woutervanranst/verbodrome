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

describe('C2 and I2: regular variants are derived by rule, the irregular one is the lexical item', () => {
  const ruleIds = (forms: readonly ConjugatedForm[]) => forms.map(form => form.ruleIds.filter(id => id.startsWith('es.stem') || id.startsWith('es.end') || id.startsWith('es.cell')));
  it('derives predeciré first and lists prediré second; the other -decir verbs the other way round', () => {
    expect(row('predecir', 'indicative', 'future')[0]).toBe('predeciré / prediré');
    expect(row('predecir', 'conditional', 'present')[0]).toBe('predeciría / prediría');
    const [regular, irregular] = one('predecir', 'indicative', 'future', 1, 'singular');
    expect(ruleIds([regular!])[0]).toEqual(['es.stem.future-infinitive', 'es.end.future']);
    expect(ruleIds([irregular!])[0]).toEqual(['es.stem.future-lexical', 'es.end.future']);
    expect([regular!.variant.pattern, irregular!.variant.pattern]).toEqual(['regular', 'irregular']);
    expect(row('contradecir', 'indicative', 'future')[0]).toBe('contradiré / contradeciré');
    expect(row('desdecir', 'conditional', 'present')[0]).toBe('desdiría / desdeciría');
    for (const [verb, first, preterite, command] of [['antedecir', 'antedigo', 'antedije', 'antedice'], ['interdecir', 'interdigo', 'interdije', 'interdice'],
      ['contradecir', 'contradigo', 'contradije', 'contradice'], ['desdecir', 'desdigo', 'desdije', 'desdice'], ['predecir', 'predigo', 'predije', 'predice']]) {
      expect(row(verb!, 'indicative', 'present')[0]).toBe(first);
      expect(row(verb!, 'indicative', 'simple_past')[0]).toBe(preterite);
      expect(row(verb!, 'imperative', 'present')[0]).toBe(command);
    }
    expect(row('antedecir', 'indicative', 'future')[0]).toBe('antediré / antedeciré');
    expect(row('bendecir', 'indicative', 'future')[0]).toBe('bendeciré');
  });

  it('derives the regular tú command of yacer and satisfacer', () => {
    expect(row('yacer', 'imperative', 'present')[0]).toBe('yace / yaz');
    expect(row('satisfacer', 'imperative', 'present')[0]).toBe('satisfaz / satisface');
    const [yace, yaz] = one('yacer', 'imperative', 'present', 2, 'singular');
    expect(ruleIds([yace!])[0]).toEqual(['es.stem.root', 'es.end.imperative-tu']);
    expect(ruleIds([yaz!])[0]).toEqual(['es.cell.imperative-short']);
    expect(explained(yace!)).not.toContain('short');
  });

  it('derives roo by the regular rules beside roigo and royo', () => {
    expect(row('roer', 'indicative', 'present')[0]).toBe('roo / roigo / royo');
    expect(row('roer', 'subjunctive', 'present')[0]).toBe('roa / roiga / roya');
    const [roo] = one('roer', 'indicative', 'present', 1, 'singular');
    expect(ruleIds([roo!])[0]).toEqual(['es.stem.root', 'es.end.present']);
    expect(roo!.variant.pattern).toBe('regular');
  });
});

export { analysisOf, explained, ids, texts };
