/**
 * Invented verbs (design §8a): every key form, and exactly the assumptions the pack makes for each. The forms follow
 * from the cited rules (DfE Appendix 1, the UT style guide); none of these verbs is in a dictionary.
 */
import { describe, expect, it } from 'vitest';
import { conjugate, parseConjugationOptions } from '../../src/index.js';

const texts = (infinitive: string, filters: Record<string, unknown>, extra: Record<string, unknown>) =>
  conjugate(parseConjugationOptions({ language: 'en', infinitive, ...filters, ...extra })).forms.map(f => f.text);
const he = { person: 3, number: 'singular' };
const assumptions = (infinitive: string, extra: Record<string, unknown>) =>
  conjugate(parseConjugationOptions({ language: 'en', infinitive, mood: 'participle', tense: 'past', ...extra })).analysis.steps!
    .filter(s => s.kind === 'assumption').map(s => s.rule);
const steps = (infinitive: string, extra: Record<string, unknown>) =>
  conjugate(parseConjugationOptions({ language: 'en', infinitive, mood: 'participle', tense: 'past', ...extra })).analysis.steps!.map(s => s.rule);

const regular = ['en.classify.assume-regular'];
const nonFinal = [...regular, 'en.classify.assume-nonfinal-stress'];

describe('invented verbs (design §8a)', () => {
  it.each([
    ['glorp', {}, 'glorps', 'glorped', 'glorped', 'glorping', regular],
    ['blit', {}, 'blits', 'blitted', 'blitted', 'blitting', regular],
    ['frobe', {}, 'frobes', 'frobed', 'frobed', 'frobing', regular],
    ['glish', {}, 'glishes', 'glished', 'glished', 'glishing', regular],
    ['glotch', {}, 'glotches', 'glotched', 'glotched', 'glotching', regular],
    ['flox', {}, 'floxes', 'floxed', 'floxed', 'floxing', regular],
    ['bliz', {}, 'blizzes', 'blizzed', 'blizzed', 'blizzing', regular],
    ['plaw', {}, 'plaws', 'plawed', 'plawed', 'plawing', regular],
    ['plory', {}, 'plories', 'ploried', 'ploried', 'plorying', regular],
    ['floy', {}, 'floys', 'floyed', 'floyed', 'floying', regular],
    ['snie', {}, 'snies', 'snied', 'snied', 'snying', regular],
    ['sklee', {}, 'sklees', 'skleed', 'skleed', 'skleeing', regular],
    ['ploe', {}, 'ploes', 'ploed', 'ploed', 'ploeing', regular],
    ['blye', {}, 'blyes', 'blyed', 'blyed', 'blyeing', regular],
    ['plargue', {}, 'plargues', 'plargued', 'plargued', 'plarguing', regular],
    ['ploto', {}, 'plotoes', 'plotoed', 'plotoed', 'plotoing', [...regular, 'en.classify.assume-es']],
    ['ploto', { sEnding: 's' }, 'plotos', 'plotoed', 'plotoed', 'plotoing', regular],
    ['zamic', {}, 'zamics', 'zamicked', 'zamicked', 'zamicking', regular],
    ['squip', {}, 'squips', 'squipped', 'squipped', 'squipping', regular],
    ['trimbit', {}, 'trimbits', 'trimbited', 'trimbited', 'trimbiting', nonFinal],
    ['trimbit', { stress: 'final' }, 'trimbits', 'trimbitted', 'trimbitted', 'trimbitting', regular],
    ['reblit', {}, 'reblits', 'reblitted', 'reblitted', 'reblitting', [...regular, 'en.classify.assume-final-stress']],
    ['reblit', { stress: 'nonFinal' }, 'reblits', 'reblited', 'reblited', 'rebliting', regular],
    ['outswim', {}, 'outswims', 'outswam', 'outswum', 'outswimming', []],
    ['glorp', { stems: { past: 'glarp', pastParticiple: 'glorpen' } }, 'glorps', 'glarp', 'glorpen', 'glorping', []],
  ])('%s %j', (verb, extra, s3, past, pp, ing, assumed) => {
    expect(texts(verb, { mood: 'indicative', tense: 'present', ...he }, extra)).toEqual([`he ${s3}`]);
    expect(texts(verb, { mood: 'indicative', tense: 'past', ...he }, extra)).toEqual([`he ${past}`]);
    expect(texts(verb, { mood: 'participle', tense: 'past' }, extra)).toEqual([pp]);
    expect(texts(verb, { mood: 'participle', tense: 'present' }, extra)).toEqual([ing]);
    expect(texts(verb, { mood: 'indicative', tense: 'perfect', ...he }, extra)).toEqual([`he has ${pp}`]);
    expect(texts(verb, { mood: 'indicative', tense: 'present_progressive', ...he }, extra)).toEqual([`he is ${ing}`]);
    expect(assumptions(verb, extra)).toEqual(assumed);
  });

  it('frandel: British and American l, with a stress assumption', () => {
    expect(texts('frandel', { mood: 'indicative', tense: 'present', ...he }, {})).toEqual(['he frandels']);
    expect(texts('frandel', { mood: 'indicative', tense: 'past', ...he }, {})).toEqual(['he frandelled', 'he frandeled']);
    expect(texts('frandel', { mood: 'indicative', tense: 'perfect', ...he }, {})).toEqual(['he has frandelled', 'he has frandeled']);
    expect(texts('frandel', { mood: 'indicative', tense: 'present_progressive', ...he }, {})).toEqual(['he is frandelling', 'he is frandeling']);
    expect(assumptions('frandel', {})).toEqual(nonFinal);
  });

  it('records the hint, not an assumption, where a hint decides', () => {
    expect(steps('outswim', {})).toEqual(['en.classify.prefixed']);
    expect(steps('glorp', { stems: { past: 'glarp', pastParticiple: 'glorpen' } })).toEqual(['en.classify.hint-irregular']);
    expect(steps('trimbit', { stress: 'final' })).toEqual(['en.classify.assume-regular', 'en.classify.stress-hint']);
    expect(steps('ploto', { sEnding: 's' })).toEqual(['en.classify.assume-regular', 'en.classify.es-hint']);
  });
});
