import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { ConjugationError, getCatalogue, getSubjects, parseConjugationOptions } from '../../src/index.js';

const cli = fileURLToPath(new URL('../../dist/cli.js', import.meta.url));

describe('English pack skeleton', () => {
  it('lists 24 catalogue entries', () => {
    expect(getCatalogue('en').map(e => `${e.mood}.${e.tense}`)).toHaveLength(24);
    expect(getCatalogue('en').find(e => e.mood === 'imperative')?.persons).toEqual([[2, 'singular'], [1, 'plural'], [2, 'plural']]);
    expect(getCatalogue('en').filter(e => !e.finite).map(e => `${e.mood}.${e.tense}`)).toEqual(['infinitive.present', 'participle.present', 'participle.past']);
    expect(getCatalogue('en').find(e => e.mood === 'indicative' && e.tense === 'present_progressive')?.tenseLabel).toBe('Present continuous');
  });

  it('declares eight subject slots, she and it on request only', () => {
    expect(getSubjects('en').map(s => s.id)).toEqual(['1sg', '2sg', '3sg.m', '3sg.f', '3sg.n', '1pl', '2pl', '3pl']);
    expect(getSubjects('en').filter(s => !s.default).map(s => s.pronoun)).toEqual(['she', 'it']);
  });

  it('validates English options', () => {
    expect(() => parseConjugationOptions({ language: 'en', infinitive: 'walk', stress: 'final', region: 'US' })).not.toThrow();
    expect(() => parseConjugationOptions({ language: 'en', infinitive: 'walk', stress: 'late' })).toThrow('Invalid stress');
    expect(() => parseConjugationOptions({ language: 'en', infinitive: 'walk', region: 'AU' })).toThrow('Invalid region');
    expect(() => parseConjugationOptions({ language: 'en', infinitive: 'glorp', stems: { past: 'glarp' } })).toThrow(/pastParticiple/u);
    expect(() => parseConjugationOptions({ language: 'en', infinitive: 'glorp', classHint: 'regular', stems: { past: 'glarp', pastParticiple: 'glorpen' } }))
      .toThrow(ConjugationError);
    expect(() => parseConjugationOptions({ language: 'en', infinitive: 'glorp', classHint: 'regular', stems: { past: 'glarp', pastParticiple: 'glorpen' } }))
      .toThrow(expect.objectContaining({ code: 'INVALID_HINT' }));
  });

  it('is listed by the CLI', () => {
    const result = spawnSync(process.execPath, [cli, '--help'], { encoding: 'utf8', timeout: 10_000 });
    const english = result.stdout.split('\n\n').find(section => section.startsWith('English (en):'));
    expect(english).toContain('--stress <final|nonFinal>');
    expect(english).toContain('--region <GB|US>');
    expect(english).toContain('--class <regular|irregular>');
  });
});
