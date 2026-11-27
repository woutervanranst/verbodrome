import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { expandTargets } from '../../src/catalogue.js';
import {
  ConjugationError, getCatalogue, getSubjects, languages, normalizeForComparison, parseConjugationOptions,
} from '../../src/index.js';

const cli = fileURLToPath(new URL('../../dist/cli.js', import.meta.url));

describe('Latin pack skeleton', () => {
  it('registers Latin', () => {
    expect(languages).toContain('la');
  });

  it('has the 21 catalogue entries in order', () => {
    expect(getCatalogue('la').map(e => `${e.mood}.${e.tense}`)).toEqual([
      'indicative.present', 'indicative.imperfect', 'indicative.future', 'indicative.perfect', 'indicative.pluperfect',
      'indicative.future_perfect', 'subjunctive.present', 'subjunctive.imperfect', 'subjunctive.perfect', 'subjunctive.pluperfect',
      'imperative.present', 'imperative.future', 'infinitive.present', 'infinitive.perfect', 'infinitive.future',
      'participle.present', 'participle.perfect', 'participle.future', 'participle.gerundive', 'gerund.present', 'supine.present']);
    expect(getCatalogue('la')[5]).toMatchObject({ moodLabel: 'Indicativus', tenseLabel: 'Futurum exactum', voices: ['active', 'passive'] });
    expect(getCatalogue('la')[18]!.voices).toBeUndefined();
  });

  it('declares 24 pronoun-less subject slots', () => {
    const slots = getSubjects('la');
    expect(slots.slice(0, 4).map(s => [s.id, s.gender ?? null, s.default])).toEqual([
      ['1sg', null, true], ['1sg.m', 'masculine', false], ['1sg.f', 'feminine', false], ['1sg.n', 'neuter', false]]);
    expect(slots).toHaveLength(24);
    expect(slots.every(s => s.pronoun === null)).toBe(true);
  });

  it('expands targets', () => {
    expect(expandTargets({ language: 'la', infinitive: 'amāre' })).toHaveLength(144);
    const feminine = expandTargets({ language: 'la', infinitive: 'amāre', gender: 'feminine', mood: 'indicative', tense: 'perfect', voice: 'passive' });
    expect(feminine.map(t => [t.subject, t.gender])).toEqual([
      ['1sg.f', 'feminine'], ['2sg.f', 'feminine'], ['3sg.f', 'feminine'], ['1pl.f', 'feminine'], ['2pl.f', 'feminine'], ['3pl.f', 'feminine']]);
  });

  it('validates options', () => {
    expect(() => parseConjugationOptions({ language: 'la', infinitive: 'amāre', agreement: { case: 'vocative' } })).not.toThrow();
    expect(() => parseConjugationOptions({ language: 'la', infinitive: 'amāre', agreement: { case: 'locative' } } as never)).toThrow('agreement.case');
    expect(() => parseConjugationOptions({ language: 'la', infinitive: 'amāre', stems: { perfect: 'amāv' } })).toThrow(ConjugationError);
    expect(() => parseConjugationOptions({ language: 'la', infinitive: 'hortārī', stems: { present: 'hortō' } })).toThrow(ConjugationError);
    expect(() => parseConjugationOptions({ language: 'la', infinitive: 'amāre', auxiliary: 'esse' } as never)).toThrow(ConjugationError);
    expect(() => parseConjugationOptions({ language: 'la', infinitive: 'amāre', subject: '3sg.f', gender: 'masculine' })).toThrow(ConjugationError);
  });

  it('compares without macrons', () => {
    expect(normalizeForComparison('la', 'Amāverīs')).toBe(normalizeForComparison('la', 'amaveris'));
    expect(normalizeForComparison('la', 'jubeō')).toBe('iubeo');
    expect(normalizeForComparison('fr', 'Été')).toBe('été'); // other languages keep their diacritics
  });

  it('the CLI lists Latin', () => {
    const result = spawnSync(process.execPath, [cli, '--help'], { encoding: 'utf8', timeout: 10_000 });
    expect(result.status).toBe(0);
    expect(result.stdout).toContain('Latin (la)');
  });
});
