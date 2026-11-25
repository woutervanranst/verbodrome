import { describe, expect, it } from 'vitest';
import { isListedLemma as isListedFrenchLemma } from '../src/languages/fr/classify.js';
import { ConjugationError } from '../src/errors.js';
import { conjugate } from '../src/conjugate.js';
import type { FrenchConjugationOptions } from '../src/types.js';

/** The distinct texts of a query's forms, in output order. */
function french(options: FrenchConjugationOptions): string[] {
  return [...new Set(conjugate(options).forms.map(form => form.text))];
}

describe('French grammatical generation', () => {
  it.each([
    ['blouper', 'nous bloupons'], ['ploucer', 'nous plouçons'],
    ['glonger', 'nous glongeons'], ['brumir', 'nous brumissons'],
  ])('conjugates invented %s from productive rules', (infinitive, expected) => {
    expect(french({ language: 'fr', infinitive, mood: 'indicative', tense: 'present', person: 1, number: 'plural' })).toEqual([expected]);
    expect(isListedFrenchLemma(infinitive)).toBe(false);
  });

  it('retains complete payer and rectified/traditional alternatives', () => {
    expect(french({ language: 'fr', infinitive: 'payer', mood: 'indicative', tense: 'present', person: 1, number: 'singular' })).toEqual(['je paie', 'je paye']);
    expect(french({ language: 'fr', infinitive: 'céder', mood: 'indicative', tense: 'future', person: 1, number: 'singular' })).toEqual(['je cèderai', 'je céderai']);
  });

  it('derives compounds and separates participle and subject agreement', () => {
    expect(french({ language: 'fr', infinitive: 'aller', mood: 'indicative', tense: 'perfect', person: 1, number: 'plural' })).toEqual(['nous sommes allés', 'nous sommes allées']);
    expect(french({ language: 'fr', infinitive: 'aimer', mood: 'indicative', tense: 'perfect', person: 1, number: 'plural', gender: 'feminine' })).toEqual(['nous avons aimé']);
    expect(french({ language: 'fr', infinitive: 'aimer', mood: 'indicative', tense: 'perfect', person: 1, number: 'plural', precedingDirectObject: { gender: 'feminine', number: 'plural' } })).toEqual(['nous avons aimées']);
  });

  it('handles reflexive order, elision, and indirect objects', () => {
    expect(french({ language: 'fr', infinitive: "s'aimer", mood: 'indicative', tense: 'near_future', person: 1, number: 'singular' })).toEqual(["je vais m'aimer"]);
    expect(french({ language: 'fr', infinitive: 'se laver', mood: 'imperative', tense: 'present', person: 2, number: 'singular' })).toEqual(['lave-toi']);
    expect(french({ language: 'fr', infinitive: 'se parler', mood: 'indicative', tense: 'perfect', person: 1, number: 'plural', gender: 'feminine' })).toEqual(['nous nous sommes parlé']);
  });

  it('uses principal parts for irregular and verified derivative families', () => {
    expect(french({ language: 'fr', infinitive: 'faire', mood: 'subjunctive', tense: 'present', person: 1, number: 'singular' })).toEqual(['que je fasse']);
    expect(french({ language: 'fr', infinitive: 'venir', mood: 'indicative', tense: 'simple_past', person: 1, number: 'plural' })).toEqual(['nous vînmes']);
    expect(french({ language: 'fr', infinitive: 'reprendre', mood: 'indicative', tense: 'present', person: 3, number: 'plural', gender: 'masculine' })).toEqual(['ils reprennent']);
    expect(french({ language: 'fr', infinitive: 'interdire', mood: 'indicative', tense: 'present', person: 2, number: 'plural' })).toEqual(['vous interdisez']);
  });

  it.each([
    ['serrer', 'je serre'], ['presser', 'je presse'], ['rester', 'je reste'],
    ['interpeller', "j'interpelle"], ['léguer', 'je lègue'], ['sécher', 'je sèche'],
    ['pénétrer', 'je pénètre'], ['sevrer', 'je sèvre'],
  ])('applies spelling rules outside the corpus to %s', (infinitive, expected) => {
    expect(french({ language: 'fr', infinitive, mood: 'indicative', tense: 'present', person: 1, number: 'singular' })).toEqual([expected]);
  });

  it('respects explicitly selected regular models instead of automatic families', () => {
    const options = { language: 'fr', infinitive: 'ressortir', mood: 'indicative', tense: 'present', person: 3, number: 'singular', gender: 'masculine' } as const;
    expect(french(options)).toEqual(['il ressort']);
    expect(french({ ...options, model: 'finir' })).toEqual(['il ressortit']);
    expect(french({ ...options, classHint: 'ir' })).toEqual(['il ressortit']);
    expect(() => french({ ...options, model: 'aimer' })).toThrow(ConjugationError);
    expect(() => french({ ...options, model: 'finir', classHint: 're' })).toThrow(ConjugationError);
  });

  it('preserves exceptional future stems and restricts derivative circumflexes', () => {
    expect(french({ language: 'fr', infinitive: 'renvoyer', mood: 'indicative', tense: 'future', person: 1, number: 'singular' })).toEqual(['je renverrai']);
    expect(french({ language: 'fr', infinitive: 'blouper', mood: 'indicative', tense: 'future', person: 1, number: 'singular', stems: { future: 'bloupr' } })).toEqual(['je blouprai']);
    expect(french({ language: 'fr', infinitive: 'émouvoir', mood: 'participle', tense: 'past', agreement: { gender: 'masculine', number: 'singular' } })).toEqual(['ému']);
    expect(french({ language: 'fr', infinitive: 'accroître', mood: 'indicative', tense: 'present', person: 1, number: 'singular' })).toEqual(["j'accrois"]);
    expect(french({ language: 'fr', infinitive: 'accroître', mood: 'participle', tense: 'past', agreement: { gender: 'feminine', number: 'plural' } })).toEqual(['accrues']);
  });

  it('retains both rectified and traditional croître participle spellings without changing finite crûs', () => {
    const options = { language: 'fr', infinitive: 'croître', mood: 'participle', tense: 'past' } as const;
    expect(french({ ...options, agreement: { gender: 'feminine', number: 'singular' } })).toEqual(['crûe', 'crue']);
    expect(french({ ...options, agreement: { gender: 'masculine', number: 'plural' } })).toEqual(['crûs', 'crus']);
    expect(french({ ...options, agreement: { gender: 'feminine', number: 'plural' } })).toEqual(['crûes', 'crues']);
    expect(french({ ...options, preferredOrthography: 'traditional', agreement: { gender: 'feminine', number: 'singular' } })).toEqual(['crue', 'crûe']);
    expect(french({ language: 'fr', infinitive: 'croître', mood: 'indicative', tense: 'simple_past', person: 1, number: 'singular' })).toEqual(['je crûs']);
    expect(french({ language: 'fr', infinitive: 'croître', mood: 'subjunctive', tense: 'imperfect', person: 1, number: 'singular' })).toEqual(['que je crûsse']);
  });

  it('does not misclassify regular asservir as a servir derivative', () => {
    expect(french({ language: 'fr', infinitive: 'asservir', mood: 'indicative', tense: 'present', person: 1, number: 'singular' })).toEqual(["j'asservis"]);
    expect(french({ language: 'fr', infinitive: 'asservir', mood: 'indicative', tense: 'present', person: 1, number: 'plural' })).toEqual(['nous asservissons']);
    expect(french({ language: 'fr', infinitive: 'desservir', mood: 'indicative', tense: 'present', person: 1, number: 'plural' })).toEqual(['nous desservons']);
  });

  it('retains both convenir auxiliaries and restricts unipersonal advenir', () => {
    const options = { language: 'fr', infinitive: 'convenir', mood: 'indicative', tense: 'perfect', person: 1, number: 'plural', gender: 'feminine' } as const;
    expect(french({ ...options, auxiliary: 'avoir' })).toEqual(['nous avons convenu']);
    expect(french({ ...options, auxiliary: 'être' })).toEqual(['nous sommes convenues']);
    expect(french({ language: 'fr', infinitive: 'advenir', mood: 'indicative', tense: 'present', person: 1, number: 'singular' })).toEqual([]);
    expect(french({ language: 'fr', infinitive: 'advenir', mood: 'indicative', tense: 'present', person: 3, number: 'singular', gender: 'masculine' })).toEqual(['il advient']);
    expect(french({ language: 'fr', infinitive: 'advenir', mood: 'imperative', tense: 'present', person: 2, number: 'singular' })).toEqual([]);
  });

  it('shares interpeler/interpeller identity and derives both complete spelling patterns', () => {
    for (const infinitive of ['interpeler', 'interpeller']) {
      const options = { language: 'fr', infinitive, mood: 'indicative', tense: 'present', person: 1, number: 'plural' } as const;
      const result = conjugate(options);
      expect(result.verbId).toBe('interpeller');
      expect(result.forms.map(form => form.text)).toEqual(['nous interpelons', 'nous interpellons']);
      expect(conjugate({ ...options, preferredOrthography: 'traditional' }).forms.map(form => form.text)).toEqual(['nous interpellons', 'nous interpelons']);
      expect(french({ language: 'fr', infinitive, mood: 'indicative', tense: 'imperfect', person: 1, number: 'singular' })).toEqual(["j'interpelais", "j'interpellais"]);
      expect(french({ language: 'fr', infinitive, mood: 'indicative', tense: 'future', person: 1, number: 'singular' })).toEqual(["j'interpellerai"]);
      expect(french({ language: 'fr', infinitive, mood: 'participle', tense: 'past', agreement: { gender: 'feminine', number: 'plural' } })).toEqual(['interpelées', 'interpellées']);
      expect(french({ language: 'fr', infinitive, mood: 'infinitive', tense: 'present' })).toEqual(['interpeler', 'interpeller']);
    }
  });
});
