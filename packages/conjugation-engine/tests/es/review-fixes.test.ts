/**
 * The findings of the stint-1 review (`.superpowers/sdd/lang-es/stint-1-review.md`), one block per finding: the forms
 * the review found wrong or missing, and the explanation defects.
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
function row(infinitive: string, mood: string, tense: string): string[] {
  const byTarget = new Map<string, string[]>();
  for (const form of conjugated(infinitive, { mood, tense }).forms) {
    const key = resolvedTargetKey(form.target);
    byTarget.set(key, [...byTarget.get(key) ?? [], bare(form)]);
  }
  return [...byTarget.values()].map(forms => forms.join(' / '));
}
const analysisOf = (infinitive: string) => packs.es.engine(parseConjugationOptions({ language: 'es', infinitive })).analysis;
const ids = (infinitive: string) => analysisOf(infinitive).steps!.map(s => s.rule);
const explained = (form: ConjugatedForm, locale = 'en') =>
  engine.explain('es', form, locale).sections.flatMap(section => section.steps.map(s => s.text)).join('\n');

describe('review C4: every -eír verb follows reír, every -oír verb follows oír', () => {
  it('conjugates unlisted -eír verbs like reír', () => {
    expect(row('sofreír', 'indicative', 'present')).toEqual(['sofrío', 'sofríes', 'sofríe', 'sofreímos', 'sofreís', 'sofríen']);
    expect(row('sofreír', 'indicative', 'simple_past')[2]).toBe('sofrió');
    expect(row('sofreír', 'subjunctive', 'present')[3]).toBe('sofriamos');
    expect(texts('sofreír', { mood: 'gerund', tense: 'present' })).toEqual(['sofriendo']);
    expect(row('refreír', 'indicative', 'present')[0]).toBe('refrío');
    expect(row('engreír', 'indicative', 'present')[0]).toBe('engrío');
    expect(row('desleír', 'indicative', 'present')[0]).toBe('deslío');
    expect(row('reír', 'indicative', 'present')).toEqual(['río', 'ríes', 'ríe', 'reímos', 'reís', 'ríen']);
    expect(ids('engreír')).toContain('es.classify.eir');
    expect(ids('engreír')).not.toContain('es.classify.prefixed');
    expect(analysisOf('engreír').classification).toBe('reír');
    expect(analysisOf('reír').classification).toBe('reír');
  });

  it('conjugates unlisted -oír verbs like oír', () => {
    expect(row('entreoír', 'indicative', 'present')).toEqual(['entreoigo', 'entreoyes', 'entreoye', 'entreoímos', 'entreoís', 'entreoyen']);
    expect(row('desoír', 'subjunctive', 'present')[0]).toBe('desoiga');
    expect(row('entreoír', 'indicative', 'simple_past')[2]).toBe('entreoyó');
    expect(ids('entreoír')).toContain('es.classify.oir');
    expect(analysisOf('entreoír').classification).toBe('oír');
  });
});

describe('review C1: pudrir and podrir are one verb', () => {
  it('gives pudr- everywhere but the participle podrido, and podrir as a second infinitive', () => {
    for (const verb of ['pudrir', 'podrir']) {
      expect(texts(verb, { mood: 'participle' })).toEqual(['podrido']);
      expect(texts(verb, { mood: 'infinitive', tense: 'present' })).toEqual(['pudrir', 'podrir']);
      expect(texts(verb, { mood: 'indicative', tense: 'perfect', person: 1, number: 'singular' })).toEqual(['yo he podrido']);
      expect(row(verb, 'indicative', 'present')[0]).toBe('pudro');
      expect(row(verb, 'indicative', 'future')[0]).toBe('pudriré');
      expect(row(verb, 'imperative', 'present')[3]).toBe('pudrid');
    }
    expect(conjugated('pudrir', { mood: 'infinitive', tense: 'present' }).forms.map(form => form.variant.pattern)).toEqual([null, 'podrir']);
    expect(analysisOf('podrir').classification).toBe('pudrir');
  });
});

describe('review M2 and row 8: derivatives listed with their base', () => {
  it('takes the participle and the stem vowel of the listed base', () => {
    expect(texts('devolver', { mood: 'participle' })).toEqual(['devuelto']);
    expect(row('devolver', 'indicative', 'present')[0]).toBe('devuelvo');
    expect(texts('descubrir', { mood: 'participle' })).toEqual(['descubierto']);
    expect(texts('entreabrir', { mood: 'participle' })).toEqual(['entreabierto']);
    expect(row('recocer', 'indicative', 'present')).toEqual(['recuezo', 'recueces', 'recuece', 'recocemos', 'recocéis', 'recuecen']);
    expect(analysisOf('devolver').classification).toBe('volver');
    expect(ids('devolver')).toEqual(['es.classify.conjugation', 'es.classify.lexicon']);
  });
});

describe('review M3: models and assumptions', () => {
  it('names construir as the model of -uir verbs and assumes nothing for ui', () => {
    expect(analysisOf('huir').classification).toBe('construir');
    expect(analysisOf('argüir').classification).toBe('construir');
    expect(ids('cuidar')).not.toContain('es.classify.assume-diphthong');
    expect(ids('blaular')).toContain('es.classify.assume-diphthong');
  });
});

export { analysisOf, bare, conjugated, explained, ids, row, texts };
