/**
 * Real verbs outside both oracles (design §8.2): principal parts as the grammar prints them and forms derived by rule.
 * Each `it` names its authority.
 */
import { describe, expect, it } from 'vitest';
import { conjugate } from '../../src/index.js';
import { forms } from './helpers.js';

const pf = (infinitive: string, extra: Record<string, unknown> = {}): string[] => forms(infinitive, 'indicative', 'perfect', 'active', { subject: '1sg', ...extra });
const supine = (infinitive: string, extra: Record<string, unknown> = {}): string[] => forms(infinitive, 'supine', undefined, undefined, extra);
const unavailable = (query: Record<string, unknown>): string[] => conjugate({ language: 'la', ...query } as never).unavailableTargets.map(u => u.reason);

describe('real verbs (design §8.2)', () => {
  it('first conjugation, A&G §209.a; secātūrus Bennett §119.4', () => {
    expect([pf('secāre'), supine('secāre'), forms('secāre', 'participle', 'future')]).toEqual([['secuī'], ['sectum'], ['sectūrus', 'secātūrus']]);
    expect([pf('crepāre'), supine('crepāre')]).toEqual([['crepuī'], ['crepitum']]);
    expect([pf('vetāre'), supine('vetāre')]).toEqual([['vetuī'], ['vetitum']]);
  });

  it('second conjugation, A&G §210.c', () => {
    expect([pf('augēre'), supine('augēre')]).toEqual([['auxī'], ['auctum']]);
    expect(forms('augēre', 'indicative', 'pluperfect', 'active', { subject: '1sg' })).toEqual(['auxeram']);
    expect(forms('augēre', 'indicative', 'perfect', 'passive', { subject: '1sg.m' })).toEqual(['auctus sum']);
    expect([pf('rīdēre'), supine('rīdēre')]).toEqual([['rīsī'], ['rīsum']]);
  });

  it('third conjugation and its compounds, A&G §211; families design §3.4', () => {
    expect([pf('claudere'), forms('claudere', 'participle', 'perfect')]).toEqual([['clausī'], ['clausus']]);
    expect([pf('inclūdere'), supine('inclūdere')]).toEqual([['inclūsī'], ['inclūsum']]);
    expect([pf('gerere'), supine('gerere')]).toEqual([['gessī'], ['gestum']]);
    expect([pf('vīvere'), supine('vīvere')]).toEqual([['vīxī'], ['vīctum']]);
    expect([pf('trahere'), supine('trahere')]).toEqual([['trāxī'], ['trāctum']]);
    expect([pf('caedere'), supine('caedere')]).toEqual([['cecīdī'], ['caesum']]);
    expect([pf('occīdere'), supine('occīdere')]).toEqual([['occīdī'], ['occīsum']]);
    expect([pf('cadere'), supine('cadere')]).toEqual([['cecidī'], ['cāsum']]);
    expect([pf('occidere', { stems: { present: 'occidō' } }), supine('occidere', { stems: { present: 'occidō' } })]).toEqual([['occidī'], ['occāsum']]);
    expect([pf('tangere'), supine('tangere')]).toEqual([['tetigī'], ['tāctum']]);
    expect([pf('contingere'), supine('contingere')]).toEqual([['contigī'], ['contāctum']]);
    expect([pf('quaerere'), supine('quaerere')]).toEqual([['quaesīvī'], ['quaesītum']]);
    expect(pf('requīrere')).toEqual(['requīsīvī']);
    expect([pf('frangere'), supine('frangere')]).toEqual([['frēgī'], ['frāctum']]);
    expect([pf('vertere'), supine('vertere')]).toEqual([['vertī'], ['versum']]);
  });

  it('fourth conjugation, A&G §212.b', () => {
    expect([pf('sepelīre'), supine('sepelīre')]).toEqual([['sepelīvī'], ['sepultum']]);
    expect([pf('haurīre'), supine('haurīre'), forms('haurīre', 'participle', 'future')]).toEqual([['hausī'], ['haustum'], ['hausūrus']]);
  });

  it('deponents and semi-deponents, A&G §§191–192; Bennett §119.4', () => {
    expect(forms('oblīvīscī', 'indicative', 'perfect', 'active', { subject: '1sg.m' })).toEqual(['oblītus sum']);
    expect(forms('oblīvīscī', 'infinitive', 'present', 'active')).toEqual(['oblīvīscī']);
    expect(forms('orīrī', 'indicative', 'perfect', 'active', { subject: '1sg.m' })).toEqual(['ortus sum']);
    expect(forms('orīrī', 'participle', 'future')).toEqual(['oritūrus']);
    expect(forms('orīrī', 'infinitive', 'present', 'active')).toEqual(['orīrī']);
    expect(forms('fīdere', 'indicative', 'imperfect', 'active', { subject: '1sg' })).toEqual(['fīdēbam']);
    expect(forms('fīdere', 'indicative', 'perfect', 'active', { subject: '1sg.m' })).toEqual(['fīsus sum']);
  });

  it('prōsum, A&G §198.a; possum, A&G p. 109; mālō, A&G p. 110', () => {
    expect(forms('prōdesse', 'indicative', 'present')).toEqual(['prōsum', 'prōdes', 'prōdest', 'prōsumus', 'prōdestis', 'prōsunt']);
    expect(forms('prōdesse', 'indicative', 'imperfect', 'active', { subject: '1sg' })).toEqual(['prōderam']);
    expect(pf('prōdesse')).toEqual(['prōfuī']);
    expect(forms('prōdesse', 'infinitive', 'present', 'active')).toEqual(['prōdesse']);
    expect(unavailable({ infinitive: 'posse', mood: 'imperative', tense: 'present', voice: 'active', subject: '2sg' })).toEqual(['noImperative']);
    expect(unavailable({ infinitive: 'mālle', mood: 'participle', tense: 'present' })).toEqual(['defective']);
  });

  it('coepī and meminī, A&G §205; Bennett §133', () => {
    expect(forms('coepisse', 'indicative', 'perfect', 'active', { subject: '2sg' })).toEqual(['coepistī']);
    expect(forms('coepisse', 'indicative', 'pluperfect', 'active', { subject: '1sg' })).toEqual(['coeperam']);
    expect(forms('coepisse', 'infinitive', 'perfect', 'active')).toEqual(['coepisse']);
    expect(forms('coepisse', 'participle', 'future')).toEqual(['coeptūrus']);
    expect(unavailable({ infinitive: 'coepisse', mood: 'indicative', tense: 'present', voice: 'active', subject: '1sg' })).toEqual(['defective']);
    expect(forms('meminisse', 'imperative', 'future')).toEqual(['mementō', 'mementōte']);
  });

  it('faciō with fīō in the passive, A&G §204', () => {
    expect(forms('facere', 'indicative', 'present', 'passive').slice(0, 3)).toEqual(['fīō', 'fīs', 'fit']);
    expect(forms('facere', 'indicative', 'perfect', 'passive', { subject: '1sg.m' })).toEqual(['factus sum']);
    expect(forms('facere', 'infinitive', 'present', 'passive')).toEqual(['fierī']);
    expect(forms('facere', 'imperative', 'present')[0]).toBe('fac');
  });

  it('afferō, A&G §200.a; adeō passive, A&G p. 114', () => {
    expect([pf('afferre'), supine('afferre')]).toEqual([['attulī'], ['allātum']]);
    expect(forms('afferre', 'indicative', 'present', 'active', { subject: '3sg' })).toEqual(['affert']);
    expect(forms('adīre', 'indicative', 'present', 'passive')).toEqual(['adeor', 'adīris', 'adīre', 'adītur', 'adīmur', 'adīminī', 'adeuntur']);
    expect(forms('adīre', 'indicative', 'perfect', 'passive', { subject: '1sg.m' })).toEqual(['aditus sum']);
    expect(forms('adīre', 'infinitive', 'present', 'passive')).toEqual(['adīrī']);
  });
});
