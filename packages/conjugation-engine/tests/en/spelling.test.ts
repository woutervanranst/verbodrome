import { describe, expect, it } from 'vitest';
import { conjugate, parseConjugationOptions } from '../../src/index.js';

/** The texts of a target; the indicative is asked in the 3rd person singular (he). */
const form = (infinitive: string, mood: string, tense: string, extra: Record<string, unknown> = {}) =>
  conjugate(parseConjugationOptions({
    language: 'en', infinitive, mood, tense, ...extra, ...(mood === 'indicative' ? { person: 3, number: 'singular' } : {}),
  })).forms.map(f => f.text);

describe('English spelling rules on invented verbs (design §8a)', () => {
  it.each([
    ['glorp', 'he glorps', 'he glorped', 'glorped', 'glorping', {}],
    ['blit', 'he blits', 'he blitted', 'blitted', 'blitting', {}],
    ['frobe', 'he frobes', 'he frobed', 'frobed', 'frobing', {}],
    ['glish', 'he glishes', 'he glished', 'glished', 'glishing', {}],
    ['glotch', 'he glotches', 'he glotched', 'glotched', 'glotching', {}],
    ['flox', 'he floxes', 'he floxed', 'floxed', 'floxing', {}],
    ['bliz', 'he blizzes', 'he blizzed', 'blizzed', 'blizzing', {}],
    ['plaw', 'he plaws', 'he plawed', 'plawed', 'plawing', {}],
    ['plory', 'he plories', 'he ploried', 'ploried', 'plorying', {}],
    ['floy', 'he floys', 'he floyed', 'floyed', 'floying', {}],
    ['snie', 'he snies', 'he snied', 'snied', 'snying', {}],
    ['sklee', 'he sklees', 'he skleed', 'skleed', 'skleeing', {}],
    ['ploe', 'he ploes', 'he ploed', 'ploed', 'ploeing', {}],
    ['blye', 'he blyes', 'he blyed', 'blyed', 'blyeing', {}],
    ['plargue', 'he plargues', 'he plargued', 'plargued', 'plarguing', {}],
    ['ploto', 'he plotoes', 'he plotoed', 'plotoed', 'plotoing', {}],
    ['zamic', 'he zamics', 'he zamicked', 'zamicked', 'zamicking', {}],
    ['squip', 'he squips', 'he squipped', 'squipped', 'squipping', {}],
    ['trimbit', 'he trimbits', 'he trimbited', 'trimbited', 'trimbiting', {}],
    ['trimbit', 'he trimbits', 'he trimbitted', 'trimbitted', 'trimbitting', { stress: 'final' }],
    ['reblit', 'he reblits', 'he reblitted', 'reblitted', 'reblitting', {}],
    ['reblit', 'he reblits', 'he reblited', 'reblited', 'rebliting', { stress: 'nonFinal' }],
    ['outswim', 'he outswims', 'he outswam', 'outswum', 'outswimming', {}],
    ['glorp', 'he glorps', 'he glarp', 'glorpen', 'glorping', { stems: { past: 'glarp', pastParticiple: 'glorpen' } }],
  ])('%s %j', (verb, s3, past, pp, ing, extra) => {
    expect(form(verb, 'indicative', 'present', extra)).toEqual([s3]);
    expect(form(verb, 'indicative', 'past', extra)).toEqual([past]);
    expect(form(verb, 'participle', 'past', extra)).toEqual([pp]);
    expect(form(verb, 'participle', 'present', extra)).toEqual([ing]);
  });

  it('applies c→ck, doubling and the British l only to a stem no earlier rule changed', () => {
    expect(form('face', 'participle', 'present')).toEqual(['facing']);
    expect(form('place', 'participle', 'present')).toEqual(['placing']);
    expect(form('become', 'participle', 'present')).toEqual(['becoming']);
    expect(form('forgive', 'participle', 'present')).toEqual(['forgiving']);
    expect(form('frobe', 'participle', 'present', { stress: 'final' })).toEqual(['frobing']);
    expect(form('frandele', 'participle', 'present')).toEqual(['frandeling']);
  });

  it('forks British and American l', () => {
    expect(form('frandel', 'indicative', 'present')).toEqual(['he frandels']);
    expect(form('frandel', 'indicative', 'past')).toEqual(['he frandelled', 'he frandeled']);
    expect(form('frandel', 'indicative', 'past', { region: 'US' })).toEqual(['he frandeled']);
    expect(form('frandel', 'indicative', 'past', { region: 'GB' })).toEqual(['he frandelled']);
    expect(form('frandel', 'participle', 'past')).toEqual(['frandelled', 'frandeled']);
    expect(form('frandel', 'participle', 'present')).toEqual(['frandelling', 'frandeling']);
  });
});
