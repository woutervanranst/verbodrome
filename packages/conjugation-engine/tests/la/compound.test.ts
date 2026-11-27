import { describe, expect, it } from 'vitest';
import { conjugate } from '../../src/index.js';
import { forms } from './helpers.js';

describe('Latin compound tenses', () => {
  it('returns three genders for a compound form, once for a simple one', () => {
    const perfect = conjugate({ language: 'la', infinitive: 'amāre', mood: 'indicative', tense: 'perfect', voice: 'passive', subject: '1sg' }).forms;
    expect(perfect.map(f => [f.text, f.target.agreement!.gender, f.variant.auxiliary])).toEqual([
      ['amātus sum', 'masculine', 'esse'], ['amāta sum', 'feminine', 'esse'], ['amātum sum', 'neuter', 'esse']]);
    expect(perfect[0]!.steps!.map(s => s.rule)).toEqual(['la.periphrasis.perfect', 'la.clause.agree-subject']);
    expect(forms('amāre', 'indicative', 'present', 'active', { subject: '1sg' })).toEqual(['amō']);
    expect(forms('amāre', 'indicative', 'perfect', 'passive', { subject: '3sg.f' })).toEqual(['amāta est']);
    expect(forms('amāre', 'subjunctive', 'pluperfect', 'passive', { gender: 'neuter', person: 3, number: 'plural' })).toEqual(['amāta essent']);
  });

  it('builds the perfect of deponents, semi-deponents and fīō as participle + esse in the active', () => {
    const hortatus = conjugate({ language: 'la', infinitive: 'hortārī', mood: 'indicative', tense: 'perfect', voice: 'active', subject: '1sg.m' }).forms;
    expect(hortatus.map(f => f.text)).toEqual(['hortātus sum']);
    expect(hortatus[0]!.ruleIds).toEqual(expect.arrayContaining(['la.periphrasis.perfect', 'la.clause.deponent']));
    expect(forms('hortārī', 'infinitive', 'perfect', 'active')).toEqual(['hortātus esse']);
    expect(forms('audēre', 'indicative', 'perfect', 'active', { subject: '1sg.m' })).toEqual(['ausus sum']);
    expect(forms('audēre', 'indicative', 'future', 'active', { subject: '1sg' })).toEqual(['audēbō']);
    expect(forms('fierī', 'indicative', 'perfect', 'active', { subject: '3sg.n' })).toEqual(['factum est']);
    expect(forms('fierī', 'infinitive', 'future', 'active')).toEqual(['factum īrī']);
    expect(forms('amāre', 'indicative', 'perfect', 'active', { subject: '1sg' })).toEqual(['amāvī']); // no periphrasis step
  });

  it('makes the passive of intransitive eō impersonal', () => {
    expect(forms('īre', 'indicative', 'perfect', 'passive', { subject: '3sg.m' })).toEqual(['itum est']);
    expect(forms('īre', 'participle', 'gerundive')).toEqual(['eundum']);
  });

  it('gives faciō the passive of fīō', () => {
    expect(forms('facere', 'indicative', 'present', 'passive', { subject: '1sg' })).toEqual(['fīō']);
    expect(forms('facere', 'infinitive', 'present', 'passive')).toEqual(['fierī']);
    expect(forms('facere', 'indicative', 'perfect', 'passive', { subject: '1sg.m' })).toEqual(['factus sum']);
  });
});
