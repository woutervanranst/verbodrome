import { describe, expect, it } from 'vitest';
import { conjugate } from '../src/index.js';
import { frenchExceptions } from '../src/languages/fr/exceptions.js';
import { dutchExceptions } from '../src/languages/nl/exceptions.js';

describe('independent productive-rule goldens', () => {
  it.each([
    ['blouper', ['je bloupe', 'tu bloupes', 'il bloupe', 'nous bloupons', 'vous bloupez', 'ils bloupent']],
    ['ploucer', ['je plouce', 'tu plouces', 'il plouce', 'nous plouçons', 'vous ploucez', 'ils ploucent']],
    ['glonger', ['je glonge', 'tu glonges', 'il glonge', 'nous glongeons', 'vous glongez', 'ils glongent']],
    ['brumir', ['je brumis', 'tu brumis', 'il brumit', 'nous brumissons', 'vous brumissez', 'ils brumissent']],
    ['plordre', ['je plords', 'tu plords', 'il plord', 'nous plordons', 'vous plordez', 'ils plordent']],
  ] as const)('generates every present person of invented %s', (infinitive, expected) => {
    const result = conjugate({ language: 'fr', infinitive, mood: 'indicative', tense: 'present', gender: 'masculine' });
    expect(result.forms.map(form => form.text)).toEqual(expected);
    expect(result.analysis.classificationSource).toBe('regularRule');
    expect(frenchExceptions).not.toHaveProperty(infinitive);
  });

  it.each([
    { mood: 'indicative', tense: 'imperfect', expected: ['je brumissais', 'tu brumissais', 'il brumissait', 'nous brumissions', 'vous brumissiez', 'ils brumissaient'] },
    { mood: 'indicative', tense: 'simple_past', expected: ['je brumis', 'tu brumis', 'il brumit', 'nous brumîmes', 'vous brumîtes', 'ils brumirent'] },
    { mood: 'indicative', tense: 'future', expected: ['je brumirai', 'tu brumiras', 'il brumira', 'nous brumirons', 'vous brumirez', 'ils brumiront'] },
    { mood: 'conditional', tense: 'present', expected: ['je brumirais', 'tu brumirais', 'il brumirait', 'nous brumirions', 'vous brumiriez', 'ils brumiraient'] },
    { mood: 'subjunctive', tense: 'present', expected: ['que je brumisse', 'que tu brumisses', "qu'il brumisse", 'que nous brumissions', 'que vous brumissiez', "qu'ils brumissent"] },
    { mood: 'subjunctive', tense: 'imperfect', expected: ['que je brumisse', 'que tu brumisses', "qu'il brumît", 'que nous brumissions', 'que vous brumissiez', "qu'ils brumissent"] },
  ] as const)('generates every brumir $mood/$tense slot from explicit goldens', ({ expected, ...target }) => {
    expect(conjugate({ language: 'fr', infinitive: 'brumir', gender: 'masculine', ...target }).forms.map(form => form.text)).toEqual(expected);
  });

  it('accounts for valid invented imperatives and non-finite forms', () => {
    expect(conjugate({ language: 'fr', infinitive: 'brumir', mood: 'imperative', tense: 'present' }).forms.map(form => form.text))
      .toEqual(['brumis', 'brumissons', 'brumissez']);
    expect(conjugate({ language: 'fr', infinitive: 'brumir', mood: 'participle', tense: 'present' }).forms.map(form => form.text))
      .toEqual(['brumissant']);
    expect(conjugate({ language: 'fr', infinitive: 'brumir', mood: 'gerund', tense: 'present' }).forms.map(form => form.text))
      .toEqual(['en brumissant']);
    expect(conjugate({ language: 'nl', infinitive: 'zorpen', mood: 'imperative', tense: 'present' }).forms.map(form => [form.target.number, form.text]))
      .toEqual([['singular', 'zorp'], ['plural', 'zorp']]);
    expect(conjugate({ language: 'nl', infinitive: 'zorpen', mood: 'participle', tense: 'present' }).forms.map(form => form.text))
      .toEqual(['zorpend']);
  });

  it.each([
    ['zorpen', ['ik zorp', 'jij zorpt', 'hij zorpt', 'wij zorpen', 'jullie zorpen', 'zij zorpen'],
      ['ik zorpte', 'jij zorpte', 'hij zorpte', 'wij zorpten', 'jullie zorpten', 'zij zorpten'], 'gezorpt'],
    ['zorven', ['ik zorf', 'jij zorft', 'hij zorft', 'wij zorven', 'jullie zorven', 'zij zorven'],
      ['ik zorfde', 'jij zorfde', 'hij zorfde', 'wij zorfden', 'jullie zorfden', 'zij zorfden'], 'gezorfd'],
    ['zollen', ['ik zol', 'jij zolt', 'hij zolt', 'wij zollen', 'jullie zollen', 'zij zollen'],
      ['ik zolde', 'jij zolde', 'hij zolde', 'wij zolden', 'jullie zolden', 'zij zolden'], 'gezold'],
    ['trapen', ['ik traap', 'jij traapt', 'hij traapt', 'wij trapen', 'jullie trapen', 'zij trapen'],
      ['ik traapte', 'jij traapte', 'hij traapte', 'wij traapten', 'jullie traapten', 'zij traapten'], 'getraapt'],
  ] as const)('generates every weak person and participle of invented %s', (infinitive, present, past, participle) => {
    expect(conjugate({ language: 'nl', infinitive, mood: 'indicative', tense: 'present' }).forms.map(form => form.text)).toEqual(present);
    expect(conjugate({ language: 'nl', infinitive, mood: 'indicative', tense: 'past' }).forms.map(form => form.text)).toEqual(past);
    expect(conjugate({ language: 'nl', infinitive, mood: 'participle', tense: 'past' }).forms.map(form => form.text)).toEqual([participle]);
    expect(dutchExceptions).not.toHaveProperty(infinitive);
  });

  it('applies deterministic regular suffix invariants without dictionary entries', () => {
    for (const root of ['darp', 'forp', 'nalp', 'zilp']) {
      const infinitive = `${root}er`;
      expect(frenchExceptions).not.toHaveProperty(infinitive);
      expect(conjugate({ language: 'fr', infinitive, mood: 'indicative', tense: 'present', gender: 'masculine' }).forms.map(form => form.text))
        .toEqual([`je ${root}e`, `tu ${root}es`, `il ${root}e`, `nous ${root}ons`, `vous ${root}ez`, `ils ${root}ent`]);
      expect(conjugate({ language: 'fr', infinitive, mood: 'participle', tense: 'past' }).forms.map(form => form.text))
        .toEqual([`${root}é`, `${root}és`, `${root}ée`, `${root}ées`]);
    }
  });
});
