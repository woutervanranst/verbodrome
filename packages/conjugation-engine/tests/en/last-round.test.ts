/**
 * The whole-pack review's last round: usage labels only where a dictionary marks a form, the asked region preferred,
 * rend and cleave, compounds the prefix list does not reach, and final-stressed compounds (LDOCE and AHD, 2026-11-27).
 */
import { describe, expect, it } from 'vitest';
import { conjugate, parseConjugationOptions } from '../../src/index.js';

const forms = (infinitive: string, mood: string, tense: string, extra: Record<string, unknown> = {}) => conjugate(parseConjugationOptions({
  language: 'en', infinitive, mood, tense, ...(mood === 'indicative' ? { person: 1, number: 'singular' } : {}), ...extra,
})).forms;
const texts = (infinitive: string, mood: string, tense: string, extra: Record<string, unknown> = {}) =>
  forms(infinitive, mood, tense, extra).map(f => f.text.replace(/^I /u, ''));
const preferred = (infinitive: string, mood: string, tense: string, extra: Record<string, unknown> = {}) =>
  forms(infinitive, mood, tense, extra).find(f => f.preferred)!.text.replace(/^I /u, '');
const usages = (infinitive: string, mood: string, tense: string) => forms(infinitive, mood, tense).map(f => f.variant.usage);

describe('usage labels only where a dictionary marks the form', () => {
  it.each([
    ['strive', 'participle', 'past', ['striven', 'strived']], ['broadcast', 'indicative', 'past', ['broadcast', 'broadcasted']],
    ['swell', 'participle', 'past', ['swollen', 'swelled']], ['show', 'participle', 'past', ['shown', 'showed']],
    ['strike', 'participle', 'past', ['struck', 'stricken']], ['nonplus', 'indicative', 'past', ['nonplussed', 'nonplused']],
    ['program', 'indicative', 'past', ['programmed', 'programed']], ['output', 'indicative', 'past', ['output', 'outputted']],
    ['wake', 'indicative', 'past', ['woke', 'waked']], ['forecast', 'indicative', 'past', ['forecast', 'forecasted']],
    ['thrive', 'participle', 'past', ['thrived', 'thriven']], ['thrive', 'indicative', 'past', ['thrived', 'throve']],
    ['write', 'participle', 'past', ['written', 'writ']], ['smite', 'participle', 'past', ['smitten', 'smote']],
    ['beget', 'participle', 'past', ['begotten', 'begot']], ['forbid', 'indicative', 'past', ['forbade', 'forbad']],
    ['sing', 'indicative', 'past', ['sang', 'sung']], ['shoe', 'indicative', 'past', ['shod', 'shoed']],
  ])('%s %s %s: standard, the second not preferred', (verb, mood, tense, expected) => {
    expect(texts(verb, mood, tense)).toEqual(expected);
    expect(usages(verb, mood, tense)).toEqual(['standard', 'standard']);
    expect(preferred(verb, mood, tense)).toBe(expected[0]);
  });

  it('keeps literary where LDOCE marks it, and never inherits a form only one dictionary prints', () => {
    expect(usages('bid', 'participle', 'past')).toEqual(['standard', 'literary']);
    expect(usages('hew', 'participle', 'past')).toEqual(['standard', 'literary']);
    expect(texts('rewrite', 'participle', 'past')).toEqual(['rewritten']);
    expect(texts('outsing', 'indicative', 'past')).toEqual(['outsang']);
  });
});

describe('the asked region is preferred', () => {
  it('prefers the form marked for the region, or the American dictionary\'s first form for US', () => {
    expect(preferred('burn', 'indicative', 'past', { region: 'US' })).toBe('burned');
    expect(preferred('burn', 'indicative', 'past', { region: 'GB' })).toBe('burnt');
    expect(preferred('burn', 'indicative', 'past')).toBe('burnt');
    expect(preferred('age', 'participle', 'present', { region: 'GB' })).toBe('ageing');
    expect(preferred('age', 'participle', 'present', { region: 'US' })).toBe('aging');
    expect(preferred('age', 'participle', 'present')).toBe('aging');
    expect(preferred('travel', 'indicative', 'past', { region: 'US' })).toBe('traveled');
    expect(preferred('get', 'participle', 'past', { region: 'US' })).toBe('gotten');
    expect(preferred('light', 'indicative', 'past', { region: 'US' })).toBe('lighted');
  });
});

describe('verbs the lexicon lacked', () => {
  it('rend, cleave and nonplus', () => {
    expect(texts('rend', 'indicative', 'past')).toEqual(['rent', 'rended']);
    expect(texts('cleave', 'indicative', 'past')).toEqual(['cleaved', 'clove', 'cleft']);
    expect(texts('cleave', 'participle', 'past')).toEqual(['cleaved', 'cloven', 'cleft']);
    expect(preferred('cleave', 'participle', 'past', { region: 'US' })).toBe('cleft');
    expect(texts('nonplus', 'indicative', 'present', { person: 3 })).toEqual(['he nonplusses', 'he nonpluses']);
    expect(texts('bus', 'indicative', 'present', { person: 3 })).toEqual(['he buses', 'he busses']);
  });

  it.each([
    ['typecast', 'typecast', 'typecast'], ['backslide', 'backslid', 'backslid'], ['spoon-feed', 'spoon-fed', 'spoon-fed'],
    ['gainsay', 'gainsaid', 'gainsaid'], ['handwrite', 'handwrote', 'handwritten'], ['typewrite', 'typewrote', 'typewritten'],
    ['housesit', 'housesat', 'housesat'], ['lip-read', 'lip-read', 'lip-read'], ['spotlight', 'spotlighted', 'spotlighted'],
    ['floodlight', 'floodlighted', 'floodlighted'],
  ])('%s', (verb, past, participle) => {
    expect(texts(verb, 'indicative', 'past')[0]).toBe(past);
    expect(texts(verb, 'participle', 'past')[0]).toBe(participle);
  });

  it('gives the -ing forms and the second forms of the compounds', () => {
    expect(texts('housesit', 'participle', 'present')).toEqual(['housesitting']);
    expect(texts('spoon-feed', 'participle', 'present')).toEqual(['spoon-feeding']);
    expect(texts('spotlight', 'indicative', 'past')).toEqual(['spotlighted', 'spotlit']);
    expect(() => texts('spoonfeed', 'indicative', 'past')).not.toThrow();
    expect(() => texts('test-drive', 'indicative', 'past')).toThrow(expect.objectContaining({ code: 'INVALID_INFINITIVE' }));
  });

  it.each([
    ['wiretap', 'wiretapped'], ['bootleg', 'bootlegged'], ['sandbag', 'sandbagged'], ['leapfrog', 'leapfrogged'],
    ['hobnob', 'hobnobbed'], ['gift-wrap', 'gift-wrapped'], ['abut', 'abutted'], ['trepan', 'trepanned'], ['rappel', 'rappelled'],
  ])('%s doubles its consonant in both spellings', (verb, past) => {
    expect(texts(verb, 'indicative', 'past')).toEqual([past]);
    expect(conjugate(parseConjugationOptions({ language: 'en', infinitive: verb, mood: 'participle', tense: 'past' })).analysis.assumptions).toEqual([]);
  });

  it('forks bedevil without an assumption', () => {
    expect(forms('bedevil', 'indicative', 'past').map(f => [f.text, f.variant.region])).toEqual([['I bedevilled', 'GB'], ['I bedeviled', 'US']]);
    expect(conjugate(parseConjugationOptions({ language: 'en', infinitive: 'bedevil', mood: 'participle', tense: 'past' })).analysis.assumptions).toEqual([]);
  });

  it('still reaches the prefixed compounds by inheritance', () => {
    for (const [verb, past] of [['overhear', 'overheard'], ['withhold', 'withheld'], ['undercut', 'undercut'], ['oversleep', 'overslept'],
      ['overdraw', 'overdrew'], ['mislead', 'misled'], ['retake', 'retook'], ['rewind', 'rewound'], ['foretell', 'foretold'],
      ['underpay', 'underpaid'], ['rebind', 'rebound'], ['befall', 'befell'], ['miscast', 'miscast'], ['recast', 'recast']] as const) {
      expect(texts(verb, 'indicative', 'past')[0], verb).toBe(past);
    }
  });
});
