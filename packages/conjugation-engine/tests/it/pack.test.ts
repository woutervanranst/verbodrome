import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { ConjugationError, getCatalogue, getSubjects, languages, parseConjugationOptions } from '../../src/index.js';

const cli = fileURLToPath(new URL('../../dist/cli.js', import.meta.url));

describe('Italian pack skeleton', () => {
  it('registers Italian', () => { expect(languages).toContain('it'); });

  it('has the 22 catalogue entries in order', () => {
    expect(getCatalogue('it').map(e => `${e.mood}.${e.tense}`)).toEqual([
      'indicative.present', 'indicative.perfect', 'indicative.imperfect', 'indicative.pluperfect', 'indicative.simple_past',
      'indicative.past_anterior', 'indicative.future', 'indicative.future_perfect', 'subjunctive.present', 'subjunctive.past',
      'subjunctive.imperfect', 'subjunctive.pluperfect', 'conditional.present', 'conditional.past', 'imperative.present',
      'imperative.negative', 'infinitive.present', 'infinitive.past', 'participle.present', 'participle.past', 'gerund.present', 'gerund.past']);
    expect(getCatalogue('it')[4]!.tenseLabel).toBe('Passato remoto');
    for (const tense of ['present', 'negative']) {
      expect(getCatalogue('it').find(e => e.mood === 'imperative' && e.tense === tense)!.slots).toEqual(['2sg', '3sg.formal', '1pl', '2pl', '3pl.formal']);
    }
  });

  it('declares the subject slots', () => {
    expect(getSubjects('it').map(s => [s.id, s.pronoun, s.default])).toEqual([
      ['1sg', 'io', true], ['2sg', 'tu', true], ['3sg.m', 'lui', true], ['3sg.f', 'lei', true], ['3sg.formal', 'Lei', false],
      ['1pl', 'noi', true], ['2pl', 'voi', true], ['3pl', 'loro', true], ['3pl.formal', 'Loro', false]]);
    expect(getSubjects('it').find(s => s.id === '3sg.formal')!.person).toBe(3);
    expect(getSubjects('it').find(s => s.id === '3pl.formal')!.person).toBe(3);
  });

  it('validates options', () => {
    expect(() => parseConjugationOptions({ language: 'it', infinitive: 'vedere', stems: { future: 'ved' } })).toThrow(ConjugationError);
    expect(() => parseConjugationOptions({ language: 'it', infinitive: 'prendere', stems: { past: 'pres' } })).toThrow(ConjugationError);
    expect(() => parseConjugationOptions({ language: 'it', infinitive: 'prendere', stems: { participle: 'pres' } })).toThrow(ConjugationError);
    expect(() => parseConjugationOptions({ language: 'it', infinitive: 'x', gender: 'neuter' } as never)).toThrow('Invalid gender');
    expect(() => parseConjugationOptions({ language: 'it', infinitive: 'x', auxiliary: 'haben' } as never)).toThrow('Invalid auxiliary');
    expect(parseConjugationOptions({ language: 'it', infinitive: 'Vedere', stems: { future: 'VEDR', stressedI: false }, subject: '3sg.formal' }))
      .toEqual({ language: 'it', infinitive: 'vedere', stems: { future: 'vedr', stressedI: false }, subject: '3sg.formal' });
  });

  it('the CLI lists Italian', () => {
    const result = spawnSync(process.execPath, [cli, '--help'], { encoding: 'utf8', timeout: 10_000 });
    expect(result.status).toBe(0);
    expect(result.stdout).toContain('Italian (it):');
    expect(result.stdout).toContain('--class <isc|plain>');
  });
});
