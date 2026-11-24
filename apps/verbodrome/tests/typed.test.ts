import { describe, expect, it } from 'vitest';
import { questionFor } from '../src/trainer/question';
import type { Question } from '../src/trainer/question';
import { classify } from '../src/trainer/typed';

const selection = {
  verbs: ['écrire', 'aller', 'partir', 'payer', 'céder'],
  tenses: ['indicative.present', 'indicative.perfect', 'indicative.imperfect', 'indicative.future', 'imperative.present'],
};
const ask = (verb: string, tense: string, slot: string): Question => questionFor(selection, { verb, tense, slot })!;
const check = (question: Question, typed: string) => classify(question, typed, selection.tenses);

describe('typed answers', () => {
  it('accepts the right form whatever the capitals, spacing, apostrophe or missing exclamation mark', () => {
    const present = ask('écrire', 'indicative.present', '1s');
    for (const typed of ["j'écris", "J'ÉCRIS", '  j’écris ', "j' écris", "j'écris "]) {
      expect(check(present, typed), typed).toMatchObject({ correct: true, kind: '', label: '' });
    }
    const imperative = ask('écrire', 'imperative.present', '2s');
    expect(check(imperative, 'écris').correct).toBe(true);
    expect(check(imperative, 'écris!').correct).toBe(true);
  });

  it('accepts every spelling the engine accepts', () => {
    const question = ask('payer', 'indicative.present', '1s');
    expect(check(question, 'je paie').correct).toBe(true);
    expect(check(question, 'je paye').correct).toBe(true);
  });

  it("labels another person's form, said with its own subject or with the asked one", () => {
    const question = ask('partir', 'indicative.present', '1s');
    const own = check(question, 'nous partons');
    expect(own).toMatchObject({ correct: false, kind: 'persoon', text: 'nous partons' });
    expect(own.label).toContain('nous');
    expect(own.nl).not.toBeNull();
    expect(check(question, 'je partons')).toMatchObject({ correct: false, kind: 'persoon', label: 'vorm van nous' });
  });

  it('labels a form of another tense with that tense', () => {
    expect(check(ask('aller', 'indicative.perfect', '1p'), 'nous allions'))
      .toMatchObject({ correct: false, kind: 'tijd:indicative.imperfect', text: 'nous allions' });
  });

  it('recognises the mistakes the cards are made of', () => {
    expect(check(ask('aller', 'indicative.perfect', '1s'), "j'ai allé"))
      .toMatchObject({ correct: false, kind: 'verkeerd hulpwerkwoord', label: 'verkeerd hulpwerkwoord', nl: null });
  });

  it('counts a missing accent as "accent vergeten", the same category as the card', () => {
    expect(check(ask('écrire', 'indicative.present', '1s'), "j'ecris"))
      .toMatchObject({ correct: false, kind: 'accent vergeten', label: 'accent vergeten', text: "j'ecris" });
    expect(check(ask('écrire', 'imperative.present', '2s'), 'ecris'))
      .toMatchObject({ correct: false, kind: 'accent vergeten', text: 'ecris !' });
    // One of two accents left out is still a forgotten accent.
    expect(check(ask('céder', 'indicative.perfect', '1s'), "j'ai céde"))
      .toMatchObject({ correct: false, kind: 'accent vergeten', text: "j'ai céde" });
  });

  it('counts a different accent as "verkeerd accent"', () => {
    expect(check(ask('écrire', 'indicative.present', '1s'), "j'êcris"))
      .toMatchObject({ correct: false, kind: 'verkeerd accent', label: 'verkeerd accent', nl: null, text: "j'êcris" });
  });

  it('names the bigger mistake when a wrong tense also lacks an accent', () => {
    expect(check(ask('écrire', 'indicative.present', '1s'), "j'ecrivais"))
      .toMatchObject({ correct: false, kind: 'tijd:indicative.imperfect', text: "j'ecrivais" });
  });

  it('calls anything else a spelling mistake and keeps what was typed', () => {
    expect(check(ask('écrire', 'indicative.present', '1s'), 'Je  écris'))
      .toEqual({ text: 'je écris', correct: false, label: 'spelfout', nl: null, kind: 'spelfout' });
  });
});
