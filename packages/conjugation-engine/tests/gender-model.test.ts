/**
 * One gender model for every pack: `target.gender` is the subject gender a form shows. A consumer finds the feminine
 * twin of a form by `target.gender === 'feminine'`, whether the pack forks the gender form by form (French, Italian,
 * Latin) or takes it from a gendered subject slot (Italian lui / lei, Spanish nosotras).
 */
import { describe, expect, it } from 'vitest';
import { conjugate } from '../src/index.js';
import type { ConjugatedForm } from '../src/types.js';

const forms = (query: Record<string, unknown>): readonly ConjugatedForm[] => conjugate(query as never).forms;
const byGender = (list: readonly ConjugatedForm[], gender: string | null) => list.filter(form => form.target.gender === gender).map(form => form.text);

describe('target.gender is the subject gender a form shows, in every language', () => {
  it.each([
    ['fr', { language: 'fr', infinitive: 'aller', mood: 'indicative', tense: 'perfect', person: 1, number: 'singular' }, 'je suis allé', 'je suis allée'],
    ['it', { language: 'it', infinitive: 'andare', mood: 'indicative', tense: 'perfect', person: 1, number: 'singular' }, 'io sono andato', 'io sono andata'],
    ['la', { language: 'la', infinitive: 'amāre', mood: 'indicative', tense: 'perfect', person: 1, number: 'singular', voice: 'passive' }, 'amātus sum', 'amāta sum'],
  ])('%s: the feminine twin of a 1st-person form', (_, query, masculine, feminine) => {
    const list = forms(query);
    expect(byGender(list, 'masculine')).toEqual([masculine]);
    expect(byGender(list, 'feminine')).toEqual([feminine]);
  });

  it('es: the feminine 1st person plural is found by its gender, on request as Spanish gives it', () => {
    const query = { language: 'es', infinitive: 'ir', mood: 'indicative', tense: 'perfect', person: 1, number: 'plural' };
    expect(byGender(forms(query), 'masculine')).toEqual(['nosotros hemos ido']);
    expect(byGender(forms({ ...query, gender: 'feminine' }), 'feminine')).toEqual(['nosotras hemos ido']);
  });

  it('de, en: a gendered pronoun slot gives its gender; nl keeps none (its output is frozen by the snapshot)', () => {
    const third = { mood: 'indicative', tense: 'present', person: 3, number: 'singular' };
    expect(forms({ language: 'de', infinitive: 'machen', ...third, subject: '3sg.f' }).map(form => [form.text, form.target.gender])).toEqual([['sie macht', 'feminine']]);
    expect(forms({ language: 'en', infinitive: 'walk', ...third, subject: '3sg.f' }).map(form => [form.text, form.target.gender])).toEqual([['she walks', 'feminine']]);
    expect(forms({ language: 'en', infinitive: 'walk', ...third }).map(form => [form.text, form.target.gender])).toEqual([['he walks', 'masculine']]);
    expect(forms({ language: 'nl', infinitive: 'werken', ...third, subject: '3sg.zij' }).map(form => [form.text, form.target.gender])).toEqual([['zij werkt', null]]);
  });

  it('gives no gender where the form shows none', () => {
    expect(forms({ language: 'fr', infinitive: 'manger', mood: 'indicative', tense: 'perfect', person: 1, number: 'singular' }).map(form => form.target.gender)).toEqual([null]);
    expect(forms({ language: 'it', infinitive: 'parlare', mood: 'indicative', tense: 'perfect', person: 1, number: 'singular' }).map(form => form.target.gender)).toEqual([null]);
    expect(forms({ language: 'la', infinitive: 'amāre', mood: 'indicative', tense: 'perfect', person: 1, number: 'singular', voice: 'active' }).map(form => form.target.gender)).toEqual([null]);
    expect(forms({ language: 'es', infinitive: 'ir', mood: 'indicative', tense: 'perfect', person: 1, number: 'singular' }).map(form => form.target.gender)).toEqual([null]);
  });

  it('keeps what a gender-filtered query returns', () => {
    expect(forms({ language: 'it', infinitive: 'andare', mood: 'indicative', tense: 'perfect', person: 1, number: 'singular', gender: 'feminine' })
      .map(form => [form.text, form.target.gender])).toEqual([['io sono andata', 'feminine']]);
    expect(forms({ language: 'la', infinitive: 'amāre', mood: 'indicative', tense: 'perfect', person: 1, number: 'singular', voice: 'passive', gender: 'neuter' })
      .map(form => [form.text, form.target.gender, form.target.subject])).toEqual([['amātum sum', 'neuter', '1sg.n']]);
  });
});
