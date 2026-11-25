import { describe, expect, it } from 'vitest';
import { conjugate } from '../../src/index.js';
import { forms } from './helpers.js';

describe('Latin non-finite forms', () => {
  it('gives citation forms without agreement', () => {
    expect(forms('amāre', 'participle')).toEqual(['amāns', 'amātus', 'amātūrus', 'amandus']);
    expect(forms('amāre', 'gerund')).toEqual(['amandī']);
    expect(forms('amāre', 'supine')).toEqual(['amātum']);
    expect(forms('amāre', 'infinitive')).toEqual(['amāre', 'amārī', 'amāvisse', 'amātus esse', 'amātūrus esse', 'amātum īrī']);
    expect(forms('tegere', 'participle', 'gerundive')).toEqual(['tegendus', 'tegundus']); // second: usage 'dated', pattern 'undus'
    expect(forms('audīre', 'participle', 'present')).toEqual(['audiēns']);
    expect(forms('īre', 'participle', 'present')).toEqual(['iēns']);
  });

  it('declines in full when agreement is asked', () => {
    const present = conjugate({ language: 'la', infinitive: 'amāre', mood: 'participle', tense: 'present', agreement: {} }).forms;
    expect(present.filter(f => f.target.agreement!.gender === 'masculine').map(f => f.text)).toEqual([
      'amāns', 'amantis', 'amantī', 'amantem', 'amante', 'amantī', 'amāns',
      'amantēs', 'amantium', 'amantibus', 'amantēs', 'amantīs', 'amantibus', 'amantēs']);
    expect(present.find(f => f.text === 'amantī' && f.target.agreement!.case === 'ablative')!.variant.pattern).toBe('adjectival');
    expect(forms('amāre', 'participle', 'perfect', undefined, { agreement: { case: 'genitive', number: 'plural' } })).toEqual(['amātōrum', 'amātārum', 'amātōrum']);
    expect(forms('amāre', 'participle', 'perfect', undefined, { agreement: { case: 'vocative', gender: 'masculine', number: 'singular' } })).toEqual(['amāte']);
    expect(forms('amāre', 'gerund', undefined, undefined, { agreement: {} })).toEqual(['amandī', 'amandō', 'amandum', 'amandō']);
    expect(forms('amāre', 'supine', undefined, undefined, { agreement: {} })).toEqual(['amātum', 'amātū']);
    expect(forms('amāre', 'infinitive', 'future', 'active', { agreement: { gender: 'masculine', number: 'singular', case: 'accusative' } })).toEqual(['amātūrum esse']);
    expect(forms('esse', 'infinitive', 'future', 'active', { agreement: { gender: 'masculine', number: 'singular', case: 'accusative' } })).toEqual(['futūrum esse', 'fore']);
  });

  it('drops a target the agreement excludes without failing', () => {
    const r = conjugate({ language: 'la', infinitive: 'amāre', agreement: { gender: 'masculine' } });
    expect(r.forms.some(f => f.target.mood === 'gerund')).toBe(false);
    expect(r.forms.some(f => f.target.mood === 'indicative' && f.target.tense === 'present')).toBe(true);
  });
});
