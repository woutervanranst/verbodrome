import { describe, expect, it } from 'vitest';
import { conjugate, explain } from '../../src/index.js';
import type { GrammaticalNumber, Person } from '../../src/types.js';
import { placeParticle } from '../../src/languages/shared/germanic.js';
import type { ChainWord } from '../../src/core/clause.js';

const result = (lemma: string, mood: string, tense?: string, person?: Person, number?: GrammaticalNumber, extra: Record<string, unknown> = {}) =>
  conjugate({
    language: 'de', infinitive: lemma, mood, ...(tense === undefined ? {} : { tense }),
    ...(person === undefined ? {} : { person, number }), ...extra,
  } as never);
const texts = (...args: Parameters<typeof result>) => result(...args).forms.map(f => f.text);
const parts = (...args: Parameters<typeof result>) => result(...args).forms[0]!.parts.map(p => [p.role, p.text]);
const clauseIds = (...args: Parameters<typeof result>) => (result(...args).forms[0]!.steps ?? []).filter(s => s.stage === 'clause').map(s => s.rule);
const byPattern = (...args: Parameters<typeof result>) => {
  const groups: Record<string, string[]> = {};
  for (const form of result(...args).forms) (groups[form.variant.pattern ?? 'none'] ??= []).push(form.text);
  return groups;
};
const subjectForms = (lemma: string, extra: Record<string, unknown>) =>
  conjugate({ language: 'de', infinitive: lemma, ...extra } as never).forms.map(f => f.text);

describe('German main clause', () => {
  it('places a separable particle at the end, or attaches it to a non-finite verb', () => {
    expect(parts('abschreiben', 'indicative', 'present', 1, 'singular')).toEqual([['subject', 'ich'], ['lexicalVerb', 'schreibe'], ['particle', 'ab']]);
    expect(clauseIds('abschreiben', 'indicative', 'present', 1, 'singular')).toEqual(['de.clause.subject', 'de.clause.particle-final']);
    expect(texts('abschreiben', 'indicative', 'perfect', 1, 'singular')).toEqual(['ich habe abgeschrieben']);
    expect(texts('abschreiben', 'indicative', 'future', 1, 'singular')).toEqual(['ich werde abschreiben']);
    expect(texts('abschreiben', 'participle', 'present')).toEqual(['abschreibend']);
    expect(texts('abschreiben', 'infinitive', 'perfect')).toEqual(['abgeschrieben haben']);
    expect(texts('abschreiben', 'imperative', 'present', 2, 'singular')).toEqual(['schreib ab', 'schreibe ab']);
    expect(texts('abschreiben', 'imperative', 'present', 1, 'plural')).toEqual(['schreiben wir ab']);
    expect(clauseIds('abschreiben', 'imperative', 'present', 1, 'plural')).toEqual(['de.clause.imperative-pronoun', 'de.clause.particle-final']);
    expect(texts('herumfahren', 'indicative', 'past', 1, 'singular')).toEqual(['ich fuhr herum']);
    expect(byPattern('anerkennen', 'indicative', 'perfect', 1, 'singular')).toEqual({ separable: ['ich habe anerkannt'], inseparable: ['ich habe anerkannt'] });
  });

  it('puts the formal Sie and the other subjects in place', () => {
    expect(subjectForms('abschreiben', { mood: 'imperative', subject: '2.formal' })).toEqual(['schreiben Sie ab']);
    expect(subjectForms('sein', { mood: 'imperative', subject: '2.formal' })).toEqual(['seien Sie']);
    expect(subjectForms('machen', { mood: 'indicative', tense: 'present', subject: '2.formal' })).toEqual(['Sie machen']);
    // backen has a weak and a strong paradigm (GD §3.5): Sie backen once in each, tagged.
    expect(conjugate({ language: 'de', infinitive: 'backen', mood: 'indicative', tense: 'present', subject: '2.formal' }).forms
      .map(f => [f.text, f.variant.pattern])).toEqual([['Sie backen', 'weak'], ['Sie backen', 'strong']]);
    expect(subjectForms('machen', { mood: 'indicative', tense: 'present', subject: '3sg.n' })).toEqual(['es macht']);
    expect(subjectForms('machen', { mood: 'indicative', tense: 'present', subject: '3sg.f' })).toEqual(['sie macht']);
    expect(subjectForms('sein', { mood: 'imperative' })).toEqual(['sei', 'seien wir', 'seid']);
  });

  it('keeps two paradigms apart', () => {
    expect(byPattern('umziehen', 'indicative', 'perfect', 1, 'singular')).toEqual({
      separable: ['ich bin umgezogen', 'ich habe umgezogen'], inseparable: ['ich habe umzogen'] });
    expect(byPattern('umziehen', 'indicative', 'present', 1, 'singular')).toEqual({ separable: ['ich ziehe um'], inseparable: ['ich umziehe'] });
    expect(byPattern('bewegen', 'indicative', 'past', 1, 'singular')).toEqual({ weak: ['ich bewegte'], strong: ['ich bewog'] });
    expect(byPattern('anerkennen', 'indicative', 'present', 1, 'singular')).toEqual({ separable: ['ich erkenne an'], inseparable: ['ich anerkenne'] });
    expect(byPattern('widerspiegeln', 'indicative', 'perfect', 3, 'singular')).toEqual({
      separable: ['er hat widergespiegelt'], inseparable: ['er hat widergespiegelt'] });
    expect(texts('umziehen', 'indicative', 'present', 1, 'singular', { separablePrefix: 'um' })).toEqual(['ich ziehe um']);
  });

  it('explains every step in English and Dutch', () => {
    const { forms, analysis } = conjugate({ language: 'de', infinitive: 'abschreiben' });
    for (const locale of ['en', 'nl']) {
      for (const subject of [...forms, analysis]) {
        const sections = explain('de', subject, locale as never).sections;
        for (const text of sections.flatMap(section => section.steps.map(s => s.text))) expect(text).not.toMatch(/[{}]|undefined/u);
      }
    }
  });
});

describe('the shared particle placement', () => {
  const word = (role: ChainWord['role'], text: string, finite: boolean): ChainWord => ({
    role, text, lemma: 'x', steps: [],
    cell: finite ? { kind: 'finite', mood: 'indicative', tense: 'present', person: 1, number: 'singular' } : { kind: 'nonFinite', form: 'pastParticiple' },
  });

  it('leaves a finite lexical verb alone and attaches the particle to a non-finite one', () => {
    const finite = [word('lexicalVerb', 'schreibe', true)];
    expect(placeParticle(finite, { text: 'ab', separable: true })).toEqual({ words: finite, final: 'ab' });
    const perfect = [word('auxiliary', 'habe', true), word('lexicalVerb', 'geschrieben', false)];
    const placed = placeParticle(perfect, { text: 'ab', separable: true });
    expect([placed.words.map(w => w.text), placed.final]).toEqual([['habe', 'abgeschrieben'], null]);
    expect(placeParticle(finite, { text: 'an', separable: false }).words.map(w => w.text)).toEqual(['anschreibe']);
    expect(placeParticle(finite, null)).toEqual({ words: finite, final: null });
  });
});
