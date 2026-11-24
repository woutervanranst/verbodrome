import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { createEngine } from '../../src/core/engine.js';
import { locales } from '../../src/i18n/locales/index.js';
import { conjugate, getCatalogue, getSubjects, languages } from '../../src/index.js';
import { packs } from '../../src/languages/index.js';

const engine = createEngine(packs, locales);
const targets = (options: Record<string, unknown>) => engine.expandTargets({ language: 'es', infinitive: 'amar', ...options });

describe('Spanish pack skeleton', () => {
  it('is registered', () => {
    expect(languages).toContain('es');
    expect(packs.es.label).toBe('Spanish');
  });

  it('lists the Spanish catalogue and subjects', () => {
    expect(getCatalogue('es').map(e => `${e.mood}.${e.tense}`)).toEqual([
      'indicative.present', 'indicative.perfect', 'indicative.imperfect', 'indicative.pluperfect', 'indicative.simple_past',
      'indicative.past_anterior', 'indicative.future', 'indicative.future_perfect', 'conditional.present', 'conditional.past',
      'subjunctive.present', 'subjunctive.past', 'subjunctive.imperfect', 'subjunctive.pluperfect', 'subjunctive.future',
      'subjunctive.future_perfect', 'imperative.present', 'imperative.negative', 'infinitive.present', 'infinitive.past',
      'gerund.present', 'gerund.past', 'participle.past',
    ]);
    expect(getSubjects('es').map(s => s.id)).toEqual(['1sg', '2sg', '3sg', '3sg.f', '2sg.formal', '1pl', '1pl.f', '2pl', '2pl.f', '3pl', '3pl.f', '2pl.formal']);
    expect(getSubjects('es').map(s => s.pronoun)).toEqual(['yo', 'tú', 'él', 'ella', 'usted', 'nosotros', 'nosotras', 'vosotros', 'vosotras', 'ellos', 'ellas', 'ustedes']);
    const imperative = getCatalogue('es').filter(e => e.mood === 'imperative');
    for (const entry of imperative) {
      expect(entry.slots).toEqual(['2sg', '2sg.formal', '1pl', '1pl.f', '2pl', '2pl.f', '2pl.formal']);
      expect(entry.persons).toEqual([[2, 'singular'], [3, 'singular'], [1, 'plural'], [2, 'plural'], [3, 'plural']]);
    }
    expect(getCatalogue('es').find(e => e.mood === 'indicative' && e.tense === 'simple_past')).toMatchObject({
      moodLabel: 'Indicativo', tenseLabel: 'Pretérito perfecto simple',
    });
  });

  it('expands an unfiltered query to 111 targets with formal imperatives', () => {
    const all = targets({});
    expect(all).toHaveLength(111);
    expect(all.filter(t => t.mood === 'indicative' && t.tense === 'present').map(t => t.subject)).toEqual(['1sg', '2sg', '3sg', '1pl', '2pl', '3pl']);
    expect(all.filter(t => t.mood === 'imperative' && t.tense === 'present').map(t => t.subject)).toEqual(['2sg', '2sg.formal', '1pl', '2pl', '2pl.formal']);
    expect(all.filter(t => t.mood === 'imperative' && t.tense === 'present').map(t => `${t.person}${t.number}`))
      .toEqual(['2singular', '3singular', '1plural', '2plural', '3plural']);
    expect(all.every(t => t.gender === null)).toBe(true);
  });

  it('selects formal and feminine slots on request', () => {
    expect(targets({ subject: '2sg.formal' })).toHaveLength(18);
    expect(targets({ subject: '2sg.formal', mood: 'indicative', tense: 'present' }).map(t => `${t.subject} ${t.person}${t.number}`))
      .toEqual(['2sg.formal 3singular']);
    expect(targets({ gender: 'feminine', mood: 'indicative', tense: 'present' }).map(t => t.subject)).toEqual(['1sg', '2sg', '3sg.f', '1pl.f', '2pl.f', '3pl.f']);
    expect(targets({ gender: 'masculine', mood: 'imperative', tense: 'present' }).map(t => t.subject)).toEqual(['2sg', '2sg.formal', '1pl', '2pl', '2pl.formal']);
    expect(targets({ gender: 'feminine', mood: 'imperative', tense: 'negative' }).map(t => t.subject)).toEqual(['2sg', '2sg.formal', '1pl.f', '2pl.f', '2pl.formal']);
  });

  it('rejects a subject the tense does not have', () => {
    // conjugate validates options and expands targets before the grammar runs; the imperative's `slots` exclude 3sg
    expect(() => conjugate({ language: 'es', infinitive: 'amar', subject: '3sg', mood: 'imperative' })).toThrow(expect.objectContaining({ code: 'INVALID_TARGET' }));
    expect(() => conjugate({ language: 'es', infinitive: 'amar', subject: 'vos' } as never)).toThrow(expect.objectContaining({ code: 'INVALID_REQUEST' }));
    expect(() => conjugate({ language: 'es', infinitive: 'amar', classHint: 'a-b' } as never)).toThrow(expect.objectContaining({ code: 'INVALID_REQUEST' }));
    expect(() => conjugate({ language: 'es', infinitive: 'amar', stems: { stress: 'final' } } as never)).toThrow(expect.objectContaining({ code: 'INVALID_REQUEST' }));
  });

  it('shows Spanish in the CLI help', () => {
    const cli = fileURLToPath(new URL('../../dist/cli.js', import.meta.url));
    const result = spawnSync(process.execPath, [cli, '--help'], { encoding: 'utf8', timeout: 10_000 });
    expect(result.status).toBe(0);
    const spanish = result.stdout.split('\n\n').find(section => section.startsWith('Spanish (es):'));
    expect(spanish).toBeDefined();
    expect(spanish).toContain('--class <regular|e-ie|o-ue|u-ue|i-ie|e-i>');
    expect(spanish).toMatch(/--stems <JSON>\s+keys: stress, zc/u);
    expect(spanish).toContain('--reflexive / --no-reflexive');
  });
});
