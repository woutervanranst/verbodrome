import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { createEngine } from '../../src/core/engine.js';
import { getCatalogue, getSubjects, parseConjugationOptions } from '../../src/index.js';
import { packs } from '../../src/languages/index.js';

const engine = createEngine(packs);
const targets = (options: Record<string, unknown>) => engine.expandTargets({ language: 'de', infinitive: 'machen', ...options });
const cli = fileURLToPath(new URL('../../dist/cli.js', import.meta.url));

describe('German pack', () => {
  it('lists the German catalogue', () => {
    expect(getCatalogue('de').map(e => `${e.mood}.${e.tense}`)).toEqual([
      'indicative.present', 'indicative.past', 'indicative.perfect', 'indicative.pluperfect', 'indicative.future',
      'indicative.future_perfect', 'subjunctive.present', 'subjunctive.perfect', 'subjunctive.future',
      'subjunctive.future_perfect', 'subjunctive.past', 'subjunctive.pluperfect', 'conditional.present', 'conditional.past',
      'imperative.present', 'infinitive.present', 'infinitive.perfect', 'participle.present', 'participle.past']);
    const past = getCatalogue('de').find(e => e.mood === 'subjunctive' && e.tense === 'past')!;
    expect([past.moodLabel, past.tenseLabel]).toEqual(['Konjunktiv II', 'Präteritum']);
    const present = getCatalogue('de').find(e => e.mood === 'subjunctive' && e.tense === 'present')!;
    expect([present.moodLabel, present.tenseLabel]).toEqual(['Konjunktiv I', 'Präsens']);
    const conditional = getCatalogue('de').find(e => e.mood === 'conditional' && e.tense === 'past')!;
    expect([conditional.moodLabel, conditional.tenseLabel]).toEqual(['Konjunktiv II (würde-Form)', 'Futur II']);
  });

  it('declares the subject slots', () => {
    expect(getSubjects('de').map(s => [s.id, s.pronoun, s.person, s.number, s.default])).toEqual([
      ['1sg', 'ich', 1, 'singular', true], ['2sg', 'du', 2, 'singular', true], ['3sg', 'er', 3, 'singular', true],
      ['3sg.f', 'sie', 3, 'singular', false], ['3sg.n', 'es', 3, 'singular', false], ['1pl', 'wir', 1, 'plural', true],
      ['2pl', 'ihr', 2, 'plural', true], ['3pl', 'sie', 3, 'plural', true], ['2.formal', 'Sie', 3, 'plural', false]]);
    expect(getSubjects('de').find(s => s.id === '2.formal')).toMatchObject({ register: 'formal' });
  });

  it('expands the imperative to du, wir, ihr and, on request, Sie', () => {
    expect(targets({ mood: 'imperative' }).map(t => t.subject)).toEqual(['2sg', '1pl', '2pl']);
    expect(targets({ mood: 'imperative', subject: '2.formal' }).map(t => [t.person, t.number, t.subject])).toEqual([[3, 'plural', '2.formal']]);
    expect(() => targets({ mood: 'imperative', subject: '3sg.f' })).toThrow(expect.objectContaining({ code: 'INVALID_TARGET' }));
    expect(() => targets({ mood: 'imperative', person: 3 })).toThrow(expect.objectContaining({ code: 'INVALID_TARGET' }));
  });

  it('expands a finite tense to the six default subjects, and Sie as a third person plural on request', () => {
    expect(targets({ mood: 'indicative', tense: 'present' }).map(t => t.subject)).toEqual(['1sg', '2sg', '3sg', '1pl', '2pl', '3pl']);
    expect(targets({ mood: 'indicative', tense: 'present', subject: '2.formal' }).map(t => [t.person, t.number])).toEqual([[3, 'plural']]);
    expect(targets({ mood: 'infinitive' }).map(t => [t.tense, t.subject])).toEqual([['present', undefined], ['perfect', undefined]]);
  });

  it('validates German options', () => {
    expect(parseConjugationOptions({ language: 'de', infinitive: ' UMZIEHEN ', separablePrefix: 'UM' }))
      .toEqual({ language: 'de', infinitive: 'umziehen', separablePrefix: 'um' });
    expect(() => parseConjugationOptions({ language: 'de', infinitive: 'umziehen', separablePrefix: 'um', inseparablePrefix: 'um' }))
      .toThrow(expect.objectContaining({ code: 'INVALID_HINT' }));
    expect(() => parseConjugationOptions({ language: 'de', infinitive: 'x', classHint: 'irregular' })).toThrow(expect.objectContaining({ code: 'INVALID_REQUEST' }));
    expect(() => parseConjugationOptions({ language: 'de', infinitive: 'machen', separablePrefix: 'a-b' })).toThrow(expect.objectContaining({ code: 'INVALID_HINT' }));
    expect(() => parseConjugationOptions({ language: 'de', infinitive: 'machen', stems: { preterite: 'machte', future: 'x' } }))
      .toThrow(expect.objectContaining({ code: 'INVALID_HINT' }));
    expect(parseConjugationOptions({ language: 'de', infinitive: 'schlinken', classHint: 'strong', auxiliary: 'sein', stems: { preterite: 'SCHLANK', unstressedFirstSyllable: false } }))
      .toEqual({ language: 'de', infinitive: 'schlinken', classHint: 'strong', auxiliary: 'sein', stems: { preterite: 'schlank', unstressedFirstSyllable: false } });
  });

  it('is listed by the CLI', () => {
    const result = spawnSync(process.execPath, [cli, '--help'], { encoding: 'utf8', timeout: 10_000 });
    expect(result.status).toBe(0);
    expect(result.stdout).toContain('German (de):');
    expect(result.stdout).toContain('--separable-prefix <word>');
    expect(result.stdout).toContain('--class <weak|strong|mixed>');
  });
});
