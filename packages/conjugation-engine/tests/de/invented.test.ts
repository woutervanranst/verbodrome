/**
 * Invented verbs (GD §8.1): every expected form follows from the cited rules, and every default the engine had to
 * assume is an assumption step that names the option overriding it.
 */
import { describe, expect, it } from 'vitest';
import { conjugate } from '../../src/index.js';
import type { GrammaticalNumber, Person } from '../../src/types.js';

type Query = Record<string, unknown>;
const forms = (lemma: string, mood: string, tense: string, person?: Person, number?: GrammaticalNumber, extra: Query = {}) =>
  conjugate({ language: 'de', infinitive: lemma, mood, tense, ...(person === undefined ? {} : { person, number }), ...extra } as never).forms.map(f => f.text);
const present = (lemma: string, person: Person, number: GrammaticalNumber, extra: Query = {}) => forms(lemma, 'indicative', 'present', person, number, extra);
const past = (lemma: string, person: Person, number: GrammaticalNumber, extra: Query = {}) => forms(lemma, 'indicative', 'past', person, number, extra);
const perfect = (lemma: string, extra: Query = {}) => forms(lemma, 'indicative', 'perfect', 1, 'singular', extra);
const imperative = (lemma: string, person: Person, number: GrammaticalNumber, extra: Query = {}) => forms(lemma, 'imperative', 'present', person, number, extra);
const participle = (lemma: string, extra: Query = {}) => forms(lemma, 'participle', 'past', undefined, undefined, extra);
const analysis = (lemma: string, extra: Query = {}) => conjugate({ language: 'de', infinitive: lemma, mood: 'infinitive', tense: 'present', ...extra } as never).analysis;
const assumptionRules = (lemma: string, extra: Query = {}) => (analysis(lemma, extra).steps ?? []).filter(s => s.kind === 'assumption').map(s => s.rule);

describe('German invented verbs', () => {
  it('schlinken: weak, haben, stressed on the first syllable, all assumed', () => {
    expect([present('schlinken', 1, 'singular'), present('schlinken', 2, 'singular'), present('schlinken', 3, 'singular')].flat())
      .toEqual(['ich schlinke', 'du schlinkst', 'er schlinkt']);
    expect([past('schlinken', 1, 'singular'), past('schlinken', 2, 'plural')].flat()).toEqual(['ich schlinkte', 'ihr schlinktet']);
    expect(forms('schlinken', 'subjunctive', 'present', 2, 'singular')).toEqual(['du schlinkest']);
    expect(forms('schlinken', 'subjunctive', 'past', 1, 'singular')).toEqual(['ich schlinkte']);
    expect(perfect('schlinken')).toEqual(['ich habe geschlinkt']);
    expect(imperative('schlinken', 2, 'singular')).toEqual(['schlink', 'schlinke']);
    expect(forms('schlinken', 'participle', 'present')).toEqual(['schlinkend']);
    expect(assumptionRules('schlinken')).toEqual(['de.classify.default-weak', 'de.classify.default-haben', 'de.classify.default-stress']);
  });

  it('schlinken with a strong class and principal parts', () => {
    const hints = { classHint: 'strong', stems: { preterite: 'schlank', participle: 'geschlunken' } };
    expect([past('schlinken', 1, 'singular', hints), past('schlinken', 1, 'plural', hints), past('schlinken', 2, 'singular', hints)].flat())
      .toEqual(['ich schlank', 'wir schlanken', 'du schlankst']);
    expect(forms('schlinken', 'subjunctive', 'past', 1, 'singular', hints)).toEqual(['ich schlänke']);
    // No short du-form: the short Konjunktiv II is printed by Duden for listed verbs only (kämst), never invented.
    expect(forms('schlinken', 'subjunctive', 'past', 2, 'singular', hints)).toEqual(['du schlänkest']);
    expect(perfect('schlinken', hints)).toEqual(['ich habe geschlunken']);
    expect(analysis('schlinken', hints).classificationSource).toBe('explicitHint');
    expect(assumptionRules('schlinken', hints)).not.toContain('de.classify.default-weak');
  });

  it('schlinken with sein', () => {
    expect(perfect('schlinken', { auxiliary: 'sein' })).toEqual(['ich bin geschlinkt']);
    expect(assumptionRules('schlinken', { auxiliary: 'sein' })).not.toContain('de.classify.default-haben');
  });

  it('fralten, blagnen: an e after a dental and after a consonant + n', () => {
    expect([present('fralten', 2, 'singular'), present('fralten', 3, 'singular'), present('fralten', 2, 'plural')].flat())
      .toEqual(['du fraltest', 'er fraltet', 'ihr fraltet']);
    expect([past('fralten', 1, 'singular'), past('fralten', 2, 'singular')].flat()).toEqual(['ich fraltete', 'du fraltetest']);
    expect(participle('fralten')).toEqual(['gefraltet']);
    expect(imperative('fralten', 2, 'singular')).toEqual(['fralte']);
    expect(forms('fralten', 'subjunctive', 'present', 2, 'singular')).toEqual(['du fraltest']);
    expect([present('blagnen', 2, 'singular'), present('blagnen', 3, 'singular'), past('blagnen', 1, 'singular')].flat())
      .toEqual(['du blagnest', 'er blagnet', 'ich blagnete']);
    expect(participle('blagnen')).toEqual(['geblagnet']);
    expect(imperative('blagnen', 2, 'singular')).toEqual(['blagne']);
  });

  it('plaxen, trissen: -st after x and ss loses its s', () => {
    expect([present('plaxen', 2, 'singular'), present('plaxen', 3, 'singular'), past('plaxen', 2, 'singular')].flat())
      .toEqual(['du plaxt', 'er plaxt', 'du plaxtest']);
    expect(participle('plaxen')).toEqual(['geplaxt']);
    expect(imperative('plaxen', 2, 'singular')).toEqual(['plax', 'plaxe']);
    expect([present('trissen', 2, 'singular'), present('trissen', 3, 'singular'), present('trissen', 2, 'plural'), past('trissen', 1, 'singular')].flat())
      .toEqual(['du trisst', 'er trisst', 'ihr trisst', 'ich trisste']);
    expect(participle('trissen')).toEqual(['getrisst']);
    expect(imperative('trissen', 2, 'singular')).toEqual(['triss', 'trisse']);
  });

  it('wumpeln: the e of -el', () => {
    expect(present('wumpeln', 1, 'singular')).toEqual(['ich wumpele', 'ich wumple']);
    expect([present('wumpeln', 2, 'singular'), present('wumpeln', 1, 'plural'), present('wumpeln', 2, 'plural')].flat())
      .toEqual(['du wumpelst', 'wir wumpeln', 'ihr wumpelt']);
    expect(past('wumpeln', 1, 'singular')).toEqual(['ich wumpelte']);
    expect(participle('wumpeln')).toEqual(['gewumpelt']);
    expect(forms('wumpeln', 'participle', 'present')).toEqual(['wumpelnd']);
    expect(forms('wumpeln', 'subjunctive', 'present', 1, 'singular')).toEqual(['ich wumpele', 'ich wumple']);
    expect(forms('wumpeln', 'subjunctive', 'present', 2, 'singular')).toEqual(['du wumpelst', 'du wumplest']);
    expect(imperative('wumpeln', 2, 'singular')).toEqual(['wumpele', 'wumple']);
  });

  it('flompieren: no ge- and no stress assumption', () => {
    expect([present('flompieren', 3, 'singular'), past('flompieren', 1, 'singular'), perfect('flompieren')].flat())
      .toEqual(['er flompiert', 'ich flompierte', 'ich habe flompiert']);
    expect(assumptionRules('flompieren')).toEqual(['de.classify.default-weak', 'de.classify.default-haben']);
  });

  it('verschlinken: an inseparable prefix on an unknown root', () => {
    expect([present('verschlinken', 1, 'singular'), past('verschlinken', 1, 'singular'), perfect('verschlinken')].flat())
      .toEqual(['ich verschlinke', 'ich verschlinkte', 'ich habe verschlinkt']);
    expect((analysis('verschlinken').steps ?? []).find(s => s.rule === 'de.classify.inseparable')?.params).toEqual({ prefix: 'ver' });
  });

  it('aufschlinken: an unknown verb with a separable particle', () => {
    expect([present('aufschlinken', 1, 'singular'), past('aufschlinken', 1, 'singular'), perfect('aufschlinken')].flat())
      .toEqual(['ich schlinke auf', 'ich schlinkte auf', 'ich habe aufgeschlinkt']);
    expect(forms('aufschlinken', 'indicative', 'future', 1, 'singular')).toEqual(['ich werde aufschlinken']);
    expect(forms('aufschlinken', 'conditional', 'present', 1, 'singular')).toEqual(['ich würde aufschlinken']);
    expect(imperative('aufschlinken', 2, 'singular')).toEqual(['schlink auf', 'schlinke auf']);
    expect(imperative('aufschlinken', 1, 'plural')).toEqual(['schlinken wir auf']);
    expect(imperative('aufschlinken', 2, 'plural')).toEqual(['schlinkt auf']);
    expect(conjugate({ language: 'de', infinitive: 'aufschlinken', mood: 'imperative', subject: '2.formal' }).forms.map(f => f.text)).toEqual(['schlinken Sie auf']);
    expect(forms('aufschlinken', 'participle', 'present')).toEqual(['aufschlinkend']);
    expect(forms('aufschlinken', 'infinitive', 'perfect')).toEqual(['aufgeschlinkt haben']);
    expect((analysis('aufschlinken').steps ?? []).find(s => s.rule === 'de.classify.assume-separable')?.params).toEqual({ particle: 'auf' });
  });

  it('umschlinken: a dual particle, separable by assumption, inseparable on request', () => {
    expect(present('umschlinken', 1, 'singular')).toEqual(['ich schlinke um']);
    expect(participle('umschlinken')).toEqual(['umgeschlinkt']);
    expect((analysis('umschlinken').steps ?? []).find(s => s.rule === 'de.classify.assume-separable')?.params).toEqual({ particle: 'um' });
    expect(present('umschlinken', 1, 'singular', { inseparablePrefix: 'um' })).toEqual(['ich umschlinke']);
    expect(perfect('umschlinken', { inseparablePrefix: 'um' })).toEqual(['ich habe umschlinkt']);
  });

  it('beschlinken: be- is never separable', () => {
    expect(() => present('beschlinken', 1, 'singular', { separablePrefix: 'be' })).toThrow(expect.objectContaining({ code: 'INVALID_HINT' }));
  });
});
