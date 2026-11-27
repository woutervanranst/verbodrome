/**
 * Real verbs outside the corpus (design §8b), against LDOCE and AHD as read for this pack, with the region and usage
 * labels of the controller's ruling (a region only where LDOCE marks it; a form only one dictionary prints is dated).
 * The regular verbs' 3rd person, past and -ing forms are in forms.test.ts; here their past participles.
 */
import { describe, expect, it } from 'vitest';
import { conjugate, parseConjugationOptions } from '../../src/index.js';

type Labelled = readonly [string, string | null, string];
const labelled = (infinitive: string, mood: string, tense: string): Labelled[] => conjugate(parseConjugationOptions({
  language: 'en', infinitive, mood, tense, ...(mood === 'indicative' ? { person: 1, number: 'singular' } : {}),
})).forms.map(f => [f.text.replace(/^I /u, ''), f.variant.region ?? null, f.variant.usage] as const);
const std = (form: string): Labelled => [form, null, 'standard'];
const us = (form: string): Labelled => [form, 'US', 'standard'];
const gb = (form: string): Labelled => [form, 'GB', 'standard'];
const dated = (form: string): Labelled => [form, null, 'dated'];

describe('irregular verbs outside the corpus (design §8b)', () => {
  it.each([
    ['dive', [std('dived'), us('dove')], [std('dived')]],
    ['prove', [std('proved')], [std('proved'), us('proven')]],
    ['learn', [std('learned'), gb('learnt')], [std('learned'), gb('learnt')]],
    ['spell', [gb('spelt'), us('spelled')], [gb('spelt'), us('spelled')]],
    ['sneak', [std('sneaked'), us('snuck')], [std('sneaked'), us('snuck')]],
    ['light', [std('lit'), std('lighted')], [std('lit'), std('lighted')]],
    ['spring', [std('sprang'), us('sprung')], [std('sprung')]],
    ['awake', [std('awoke'), dated('awaked')], [std('awoken'), dated('awaked')]],
    ['show', [std('showed')], [std('shown'), dated('showed')]],
    ['sew', [std('sewed')], [std('sewn'), std('sewed')]],
    ['thrive', [std('thrived'), std('throve')], [std('thrived'), dated('thriven')]],
    ['input', [std('inputted'), std('input')], [std('inputted'), std('input')]],
    ['slay', [std('slew'), dated('slayed')], [std('slain'), dated('slayed')]],
  ])('%s', (verb, past, participle) => {
    expect(labelled(verb, 'indicative', 'past')).toEqual(past);
    expect(labelled(verb, 'participle', 'past')).toEqual(participle);
  });

  it('keeps inheritance to what the base allows', () => {
    // misspell: LDOCE "misspelt or misspelled", AHD "misspelled or misspelt", neither labelled.
    expect(labelled('misspell', 'indicative', 'past')).toEqual([std('misspelt'), std('misspelled')]);
    expect(labelled('underlie', 'indicative', 'past')).toEqual([std('underlay')]);
    expect(labelled('underlie', 'participle', 'past')).toEqual([std('underlain')]);
    expect(labelled('outbid', 'indicative', 'past')).toEqual([std('outbid')]);
    expect(labelled('behave', 'indicative', 'past')).toEqual([std('behaved')]);
    expect(labelled('relay', 'indicative', 'past')).toEqual([std('relayed')]);
  });
});

describe('regular verbs outside the corpus: past participles (design §8b)', () => {
  it.each([
    ['walk', ['walked']], ['stop', ['stopped']], ['hope', ['hoped']], ['try', ['tried']], ['panic', ['panicked']],
    ['travel', ['travelled', 'traveled']], ['equal', ['equalled', 'equaled']], ['dial', ['dialled', 'dialed']],
    ['compel', ['compelled']], ['prefer', ['preferred']], ['visit', ['visited']], ['benefit', ['benefited']],
    ['focus', ['focused']], ['combat', ['combated']], ['enter', ['entered']], ['format', ['formatted']],
    ['kidnap', ['kidnapped', 'kidnaped']], ['program', ['programmed', 'programed']], ['worship', ['worshipped', 'worshiped']],
    ['parallel', ['paralleled', 'parallelled']], ['quiz', ['quizzed']], ['veto', ['vetoed']], ['die', ['died']],
    ['dye', ['dyed']], ['singe', ['singed']], ['agree', ['agreed']], ['queue', ['queued']], ['solo', ['soloed']],
    ['gas', ['gassed']], ['fulfil', ['fulfilled']], ['fulfill', ['fulfilled']],
  ])('%s', (verb, participle) => {
    expect(labelled(verb, 'participle', 'past').map(([form]) => form)).toEqual(participle);
  });
});
