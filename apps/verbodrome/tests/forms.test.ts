import { describe, expect, it } from 'vitest';
import { formAt, verbForms } from '../src/trainer/forms';

describe('feminine answers in the accepted forms', () => {
  it('keeps the card masculine and accepts the feminine twin where the prompt leaves gender open', () => {
    const aller = verbForms('aller');
    const first = formAt(aller, 'indicative.perfect', '1s')!;
    expect(first.text).toBe('je suis allé');
    expect(first.subject).toBe('je');
    expect(first.accepted).toEqual(['je suis allé', 'je suis allée']);
    expect(formAt(aller, 'indicative.perfect', '1p')?.accepted).toEqual(['nous sommes allés', 'nous sommes allées']);
    expect(formAt(aller, 'indicative.perfect', '3p')?.accepted).toEqual(['ils sont allés', 'elles sont allées']);
    expect(formAt(aller, 'imperative.past', '2s')?.accepted).toEqual(['sois allé !', 'sois allée !']);
  });

  it('accepts only the masculine subject in the third person singular, where the prompt says "hij"', () => {
    expect(formAt(verbForms('aller'), 'indicative.perfect', '3s')?.accepted).toEqual(['il est allé']);
    expect(formAt(verbForms('parler'), 'indicative.present', '3s')?.accepted).toEqual(['il parle']);
  });

  it('adds nothing where the form does not show gender, and no duplicates', () => {
    expect(formAt(verbForms('parler'), 'indicative.present', '1s')?.accepted).toEqual(['je parle']);
    expect(formAt(verbForms('manger'), 'indicative.perfect', '1s')?.accepted).toEqual(["j'ai mangé"]);
    // "zij" is gender-neutral: the feminine subject is right too.
    expect(formAt(verbForms('parler'), 'indicative.present', '3p')?.accepted).toEqual(['ils parlent', 'elles parlent']);
  });

  it('never adds a feminine form to a non-finite form', () => {
    expect(formAt(verbForms('aller'), 'participle.past', '-')?.accepted).toEqual(['allé']);
    expect(formAt(verbForms('aller'), 'infinitive.past', '-')?.accepted).toEqual(['être allé']);
  });

  it('asks exactly the forms it asked before: the cards do not change', () => {
    // Measured on the masculine-only query before feminine answers were accepted.
    expect(verbForms('aller').all).toHaveLength(109);
  });
});
