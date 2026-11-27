import { describe, expect, it } from 'vitest';
import { conjugate, explain, getCatalogue, parseConjugationOptions } from '../../src/index.js';
import type { ConjugatedForm } from '../../src/index.js';

const forms = (verb: string, filters: Record<string, unknown> = {}) =>
  conjugate(parseConjugationOptions({ language: 'en', infinitive: verb, ...filters })).forms;
const texts = (verb: string, filters: Record<string, unknown> = {}) => forms(verb, filters).map(f => f.text);
/** The 3rd person singular forms of one target. */
const all = (verb: string, mood: string, tense: string) => forms(verb, { mood, tense, person: 3, number: 'singular' });
const one = (verb: string, mood: string, tense: string): ConjugatedForm => all(verb, mood, tense).find(f => f.preferred)!;
const auxOf = (verb: string, mood: string, tense: string) => one(verb, mood, tense).variant.auxiliary;
const subjectParts = (verb: string, filters: Record<string, unknown>) => forms(verb, filters).flatMap(f => f.parts.filter(p => p.role === 'subject'));

describe('English compound tenses and clause', () => {
  it('builds every catalogue entry for walk, 3rd person singular', () => {
    const he = conjugate(parseConjugationOptions({ language: 'en', infinitive: 'walk', person: 3, number: 'singular' })).forms.map(f => f.text);
    expect(he).toEqual([
      'he walks', 'he walked', 'he has walked', 'he had walked', 'he will walk', 'he will have walked',
      'he is walking', 'he was walking', 'he has been walking', 'he had been walking', 'he will be walking', 'he will have been walking',
      'he would walk', 'he would have walked', 'he would be walking', 'he would have been walking',
      'he walk', 'he walked', 'he have walked', 'he had walked',
    ]);
  });

  it('builds the non-finite forms and the imperative', () => {
    expect(texts('walk', { mood: 'infinitive' })).toEqual(['to walk']);
    expect(forms('walk', { mood: 'infinitive' })[0]!.parts.map(p => [p.role, p.text])).toEqual([['particle', 'to'], ['lexicalVerb', 'walk']]);
    expect(texts('go', { mood: 'imperative' })).toEqual(['go', "let's go", 'go']);
    expect(subjectParts('go', { mood: 'imperative' })).toEqual([]);
    expect(forms('go', { mood: 'imperative', person: 1 })[0]!.steps!.map(s => s.rule)).toEqual(['en.periphrasis.lets', 'en.clause.imperative-subject']);
    expect(() => texts('go', { mood: 'imperative', subject: '3sg.m' })).toThrow(expect.objectContaining({ code: 'INVALID_TARGET' }));
    expect(texts('walk', { mood: 'participle' })).toEqual(['walking', 'walked']);
  });

  it('reports the auxiliary of each construction', () => {
    expect(auxOf('walk', 'indicative', 'perfect')).toBe('have');
    expect(auxOf('walk', 'indicative', 'present_progressive')).toBe('be');
    expect(auxOf('walk', 'indicative', 'future')).toBeNull();
    expect(auxOf('walk', 'indicative', 'future_progressive')).toBe('be');
    expect(auxOf('walk', 'indicative', 'future_perfect_progressive')).toBe('have');
    expect(auxOf('walk', 'conditional', 'present')).toBeNull();
    expect(auxOf('walk', 'indicative', 'present')).toBeNull();
  });

  it('never mixes regions inside one form', () => {
    expect(all('travel', 'conditional', 'past').map(f => [f.text, f.variant.region])).toEqual([['he would have travelled', 'GB'], ['he would have traveled', 'US']]);
    expect(all('travel', 'indicative', 'perfect_progressive').map(f => [f.text, f.variant.region])).toEqual([['he has been travelling', 'GB'], ['he has been traveling', 'US']]);
    expect(forms('travel', { mood: 'conditional', tense: 'past', person: 1, number: 'singular', region: 'US' }).map(f => f.text)).toEqual(['I would have traveled']);
  });

  it('conjugates be through itself and takes the subject slot', () => {
    expect(texts('be', { mood: 'indicative', tense: 'perfect_progressive', person: 3, number: 'singular' })).toEqual(['he has been being']);
    expect(texts('be', { mood: 'subjunctive', tense: 'perfect', person: 1, number: 'singular' })).toEqual(['I have been']);
    expect(texts('walk', { mood: 'indicative', tense: 'present', subject: '3sg.f' })).toEqual(['she walks']);
    expect(texts('walk', { mood: 'indicative', tense: 'future', subject: '3sg.n' })).toEqual(['it will walk']);
    expect(texts('swim', { mood: 'indicative', tense: 'pluperfect_progressive', person: 3, number: 'plural' })).toEqual(['they had been swimming']);
  });

  it('gives each word its features and role', () => {
    const progressive = one('walk', 'indicative', 'perfect_progressive');
    expect(progressive.parts.map(p => [p.role, p.text, p.features.mood, p.features.verbForm, p.features.aspect ?? null])).toEqual([
      ['subject', 'he', null, null, null],
      ['auxiliary', 'has', 'indicative', 'finite', 'progressive'],
      ['auxiliary', 'been', 'participle', 'pastParticiple', 'progressive'],
      ['lexicalVerb', 'walking', 'participle', 'presentParticiple', 'progressive'],
    ]);
    expect(one('walk', 'indicative', 'future').parts.map(p => [p.role, p.text, p.features.verbForm])).toEqual([
      ['subject', 'he', null], ['moodMarker', 'will', null], ['lexicalVerb', 'walk', 'infinitive'],
    ]);
  });

  it('explains every form in English and Dutch', () => {
    for (const verb of ['walk', 'be', 'have', 'go', 'travel', 'hang', 'outswim', 'reblit', 'kidnap', 'learn'])
      for (const f of conjugate(parseConjugationOptions({ language: 'en', infinitive: verb })).forms)
        for (const locale of ['en', 'nl'] as const) expect(() => explain('en', f, locale), `${f.text} ${locale}`).not.toThrow();
    expect(explain('en', one('swim', 'indicative', 'perfect'), 'nl').sections.at(-1)!.steps[0]!.rule).toBe('en.periphrasis.perfect');
    const swum = explain('en', one('swim', 'indicative', 'perfect'), 'en').sections.map(s => [s.title, s.steps.map(x => x.text)]);
    expect(swum).toEqual([
      ['has', ['The 3rd person singular present of have is has.']],
      ['swum', ['The past participle of swim is swum.']],
      ['The whole form', ['Present perfect: the present of have plus the past participle.', 'The subject he comes before the verb.']],
    ]);
  });

  it('builds every target of the catalogue for unfiltered queries', () => {
    const catalogue = getCatalogue('en');
    const expected = catalogue.reduce((n, e) => n + (e.finite ? e.persons.length : 1), 0);
    expect(expected).toBe(20 * 6 + 3 + 3);
    for (const verb of ['walk', 'be', 'have', 'swim', 'go']) expect(forms(verb).filter(f => f.preferred), verb).toHaveLength(expected);
  });
});
