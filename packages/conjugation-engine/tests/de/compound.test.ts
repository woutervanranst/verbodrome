import { describe, expect, it } from 'vitest';
import { conjugate } from '../../src/index.js';
import type { GrammaticalNumber, Person } from '../../src/types.js';

const result = (lemma: string, mood: string, tense?: string, person?: Person, number?: GrammaticalNumber, extra: Record<string, unknown> = {}) =>
  conjugate({
    language: 'de', infinitive: lemma, mood, ...(tense === undefined ? {} : { tense }),
    ...(person === undefined ? {} : { person, number }), ...extra,
  } as never);
const texts = (...args: Parameters<typeof result>) => result(...args).forms.map(f => f.text);
const forms = (...args: Parameters<typeof result>) => result(...args).forms.map(({ text, variant }) => ({
  text,
  ...(variant.auxiliary === null ? {} : { auxiliary: variant.auxiliary }),
  ...(variant.condition === null ? {} : { condition: variant.condition }),
  ...(variant.pattern === null ? {} : { pattern: variant.pattern }),
}));
const unavailable = (...args: Parameters<typeof result>) => result(...args).unavailableTargets.map(u => [u.reason, u.step?.rule]);

describe('German compound tenses and non-finite forms', () => {
  it('builds the perfect with the auxiliaries of the verb', () => {
    expect(forms('fahren', 'indicative', 'perfect', 1, 'singular')).toEqual([
      { text: 'ich bin gefahren', auxiliary: 'sein', condition: expect.any(String) },
      { text: 'ich habe gefahren', auxiliary: 'haben', condition: expect.any(String) }]);
    expect(texts('machen', 'indicative', 'perfect', 1, 'singular')).toEqual(['ich habe gemacht']);
    expect(texts('stehen', 'indicative', 'perfect', 1, 'singular')).toEqual(['ich habe gestanden', 'ich bin gestanden']);
    expect(result('stehen', 'indicative', 'perfect', 1, 'singular').forms[1]!.variant.region).toBe('south');
    expect(texts('machen', 'indicative', 'pluperfect', 2, 'singular')).toEqual(['du hattest gemacht']);
    expect(texts('kommen', 'indicative', 'pluperfect', 1, 'plural')).toEqual(['wir waren gekommen']);
  });

  it('builds the non-finite forms', () => {
    expect(texts('studieren', 'participle', 'past')).toEqual(['studiert']);
    expect(texts('verschlafen', 'participle', 'past')).toEqual(['verschlafen']);
    expect(texts('schreien', 'participle', 'past')).toEqual(['geschrien']);
    expect(texts('sammeln', 'participle', 'present')).toEqual(['sammelnd']);
    expect(texts('tun', 'participle', 'present')).toEqual(['tuend']);
    expect(texts('sein', 'participle', 'present')).toEqual(['seiend']);
    expect(texts('fahren', 'infinitive', 'present')).toEqual(['fahren']);
    expect(texts('fahren', 'infinitive', 'perfect')).toEqual(['gefahren sein', 'gefahren haben']);
  });

  it('builds the future, the Konjunktiv compounds and the würde-forms', () => {
    expect(forms('fahren', 'indicative', 'future', 1, 'singular')).toEqual([{ text: 'ich werde fahren', auxiliary: 'werden' }]);
    expect(texts('fahren', 'conditional', 'present', 1, 'singular')).toEqual(['ich würde fahren']);
    expect(texts('kommen', 'subjunctive', 'perfect', 3, 'singular')).toEqual(['er sei gekommen']);
    expect(texts('kommen', 'subjunctive', 'perfect', 2, 'singular')).toEqual(['du seiest gekommen', 'du seist gekommen']);
    expect(texts('machen', 'subjunctive', 'pluperfect', 1, 'singular')).toEqual(['ich hätte gemacht']);
    expect(texts('machen', 'subjunctive', 'future', 2, 'singular')).toEqual(['du werdest machen']);
    expect(texts('machen', 'indicative', 'future_perfect', 1, 'singular')).toEqual(['ich werde gemacht haben']);
    expect(forms('machen', 'indicative', 'future_perfect', 1, 'singular')[0]!.auxiliary).toBe('haben');
    expect(texts('kommen', 'subjunctive', 'future_perfect', 3, 'singular')).toEqual(['er werde gekommen sein']);
    expect(texts('machen', 'conditional', 'past', 1, 'singular')).toEqual(['ich würde gemacht haben']);
    expect(texts('können', 'conditional', 'present', 1, 'singular')).toEqual(['ich würde können']);
    expect(texts('können', 'conditional', 'past', 1, 'singular')).toEqual(['ich würde gekonnt haben']);
  });

  it('declares the forms a verb does not have', () => {
    expect(unavailable('können', 'imperative')).toEqual([
      ['noImperative', 'de.avail.no-imperative'], ['noImperative', 'de.avail.no-imperative'], ['noImperative', 'de.avail.no-imperative']]);
    expect(unavailable('geschehen', 'indicative', 'present', 1, 'singular')).toEqual([['defective', 'de.avail.third-person-only']]);
    expect(unavailable('geschehen', 'indicative', 'perfect', 2, 'plural')).toEqual([['defective', 'de.avail.third-person-only']]);
    expect(unavailable('geschehen', 'imperative', 'present', 2, 'singular')).toEqual([['noImperative', 'de.avail.no-imperative']]);
    expect(texts('geschehen', 'indicative', 'present', 3, 'singular')).toEqual(['er geschieht']);
    expect(texts('geschehen', 'indicative', 'perfect', 3, 'plural')).toEqual(['sie sind geschehen']);
    expect(texts('regnen', 'indicative', 'present', 3, 'singular')).toEqual(['es regnet']);
    expect(texts('regnen', 'indicative', 'perfect', 3, 'singular')).toEqual(['es hat geregnet']);
    expect(unavailable('regnen', 'indicative', 'present', 1, 'singular')).toEqual([['impersonal', 'de.avail.impersonal']]);
    expect(unavailable('regnen', 'indicative', 'present', 3, 'plural')).toEqual([['impersonal', 'de.avail.impersonal']]);
    expect(unavailable('regnen', 'imperative', 'present', 2, 'plural')).toEqual([['noImperative', 'de.avail.no-imperative']]);
    expect(result('regnen', 'participle', 'past').forms.map(f => f.text)).toEqual(['geregnet']);
  });
});
