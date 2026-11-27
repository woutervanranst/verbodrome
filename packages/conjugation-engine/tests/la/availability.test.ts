import { describe, expect, it } from 'vitest';
import { conjugate } from '../../src/index.js';
import { forms } from './helpers.js';

const unavailable = (query: Record<string, unknown>): [string, string][] =>
  conjugate({ language: 'la', ...query } as never).unavailableTargets.map(u => [u.reason, u.step!.rule]);

// A finite query without a voice expands both voices, so the queries that test one active target name the voice.
describe('Latin availability', () => {
  it('declares every missing form with its reason', () => {
    expect(unavailable({ infinitive: 'hortārī', mood: 'indicative', tense: 'present', voice: 'passive', subject: '1sg' })).toEqual([['noPassive', 'la.avail.no-passive']]);
    expect(unavailable({ infinitive: 'īre', mood: 'indicative', tense: 'present', voice: 'passive', subject: '1sg' })).toEqual([['impersonal', 'la.avail.impersonal-passive']]);
    expect(unavailable({ infinitive: 'posse', mood: 'imperative', tense: 'present', voice: 'active', subject: '2sg' })).toEqual([['noImperative', 'la.avail.no-imperative']]);
    expect(unavailable({ infinitive: 'mālle', mood: 'participle', tense: 'present' })).toEqual([['defective', 'la.avail.no-participle']]);
    expect(unavailable({ infinitive: 'esse', mood: 'gerund' })).toEqual([['defective', 'la.avail.no-gerund']]);
    expect(unavailable({ infinitive: 'coepisse', mood: 'indicative', tense: 'present', voice: 'active', subject: '1sg' })).toEqual([['defective', 'la.avail.no-present']]);
    expect(unavailable({ infinitive: 'oportēre', mood: 'indicative', tense: 'present', voice: 'active', subject: '1sg' })).toEqual([['impersonal', 'la.avail.impersonal']]);
    expect(forms('oportēre', 'indicative', 'present', 'active', { subject: '3sg' })).toEqual(['oportet']);
    expect(unavailable({ infinitive: 'amāre', mood: 'imperative', tense: 'future', voice: 'passive', subject: '2pl' })).toEqual([['defective', 'la.avail.no-future-imperative-plural']]);
    expect(unavailable({ infinitive: 'hortārī', mood: 'imperative', tense: 'future', voice: 'active', subject: '2pl' })).toEqual([['defective', 'la.avail.no-future-imperative-plural']]);
    expect(unavailable({ infinitive: 'posse', mood: 'infinitive', tense: 'future', voice: 'active' })).toEqual([['defective', 'la.avail.no-supine']]);
  });

  it('never leaves an available target without a form', () => {
    for (const infinitive of ['amāre', 'monēre', 'tegere', 'capere', 'audīre', 'hortārī', 'sequī', 'patī', 'esse', 'posse', 'velle', 'nōlle', 'mālle', 'ferre', 'īre', 'fierī', 'audēre', 'dare', 'edere'])
      expect(() => conjugate({ language: 'la', infinitive, agreement: {} }), infinitive).not.toThrow();
  });
});
