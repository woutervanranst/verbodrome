/**
 * The whole-pack review's wrong forms (last round): each expectation is a form the verb's Vocabolario header prints
 * (read on 2026-11-27), or the auxiliary it states.
 */
import { describe, expect, it } from 'vitest';
import { conjugate } from '../../src/index.js';
import { bare, bareOf, texts } from './helpers.js';

const auxiliaries = (infinitive: string) => conjugate({ language: 'it', infinitive, mood: 'infinitive', tense: 'present' }).analysis.auxiliaries;
const assumptionsOf = (infinitive: string) => conjugate({ language: 'it', infinitive, mood: 'infinitive', tense: 'present' }).analysis.steps!
  .filter(s => s.kind === 'assumption').map(s => s.rule);

describe('Italian last round', () => {
  it.each([
    ['riempire', 'indicative', 'present', '1sg', 'riempio'], ['riempire', 'indicative', 'present', '3sg.m', 'riempie'],
    ['riempire', 'indicative', 'present', '3pl', 'riempiono'], ['riempire', 'subjunctive', 'present', '1sg', 'riempia'],
    ['empire', 'indicative', 'present', '2sg', 'empi'], ['empire', 'indicative', 'present', '2pl', 'empite'],
    ['compiere', 'indicative', 'imperfect', '1sg', 'compivo'], ['compiere', 'indicative', 'future', '1sg', 'compirò'],
    ['compiere', 'indicative', 'simple_past', '1sg', 'compii'], ['compiere', 'subjunctive', 'imperfect', '1sg', 'compissi'],
    ['compiere', 'indicative', 'present', '2pl', 'compite'], ['adempiere', 'indicative', 'present', '1sg', 'adempio/adempisco'],
    ['assalire', 'indicative', 'present', '1sg', 'assalgo/assalisco'], ['assalire', 'indicative', 'simple_past', '1sg', 'assalii/assalsi'],
    ['svestire', 'indicative', 'present', '1sg', 'svesto'], ['susseguire', 'indicative', 'present', '3pl', 'susseguono'],
    ['indire', 'indicative', 'simple_past', '1sg', 'indissi'], ['rivolere', 'indicative', 'present', '1sg', 'rivoglio'],
    ['sfare', 'indicative', 'present', '1sg', 'sfaccio/sfò'], ['trasparire', 'indicative', 'present', '3sg.m', 'traspare/trasparisce'],
    ['prescindere', 'indicative', 'simple_past', '1sg', 'prescindei/prescissi'], ['flettere', 'indicative', 'simple_past', '1sg', 'flettei/flessi'],
    ['transigere', 'indicative', 'simple_past', '1sg', 'transigei/transigetti'],
  ] as const)('%s %s.%s %s: %s', (verb, mood, tense, subject, expected) => {
    expect(bareOf(verb, mood, tense, subject)).toBe(expected);
  });

  it.each([
    ['empire', 'empito/empiuto'], ['compiere', 'compiuto'], ['adempiere', 'adempiuto/adempito'], ['prefiggere', 'prefisso'], ['affiggere', 'affisso'],
    ['crocifiggere', 'crocifisso'], ['trafiggere', 'trafitto'], ['configgere', 'confitto'], ['infliggere', 'inflitto'], ['incutere', 'incusso'],
    ['suddividere', 'suddiviso'], ['dissuadere', 'dissuaso'], ['circoscrivere', 'circoscritto'], ['capovolgere', 'capovolto'],
    ['misconoscere', 'misconosciuto'], ['prediligere', 'prediletto'], ['fungere', 'funto'], ['convergere', 'converso'], ['aspergere', 'asperso'],
    ['tergere', 'terso'], ['detergere', 'deterso'], ['ergere', 'erto'], ['intridere', 'intriso'], ['flettere', 'flesso/flettuto'], ['elidere', 'eliso'],
    ['indulgere', 'indulto'], ['transigere', 'transatto'], ['sospendere', 'sospeso'], ['prescindere', 'prescisso'], ['trasparire', 'trasparito'],
    ['riflettere', 'riflettuto/riflesso'], ['avvedere', 'avveduto'], ['ravvedere', 'ravveduto'], ['indire', 'indetto'],
  ] as const)('%s: participle %s', (verb, participle) => {
    expect(bare(verb, 'participle', 'past')[0]).toBe(participle);
  });

  it('gives each lemma its own auxiliary (C2, I2)', () => {
    for (const verb of ['possedere', 'prevenire', 'compiacere', 'contravvenire', 'rinvenire']) expect(auxiliaries(verb), verb).toEqual(['avere']);
    for (const verb of ['incorrere', 'decorrere', 'rincrescere', 'ricrescere', 'riemergere', 'ascendere', 'rivivere', 'constare', 'susseguire']) {
      expect(auxiliaries(verb), verb).toEqual(['essere']);
    }
    for (const verb of ['trascorrere', 'sopraggiungere', 'scorrere', 'discendere', 'prevalere', 'ardere']) expect(auxiliaries(verb), verb).toHaveLength(2);
    expect(texts('possedere', 'indicative', 'perfect', { subject: '1sg' })).toEqual(['io ho posseduto']);
    expect(assumptionsOf('possedere')).toEqual([]);
  });

  it('has two senses of ripartire (I5)', () => {
    const forms = conjugate({ language: 'it', infinitive: 'ripartire', mood: 'indicative', tense: 'perfect', subject: '3sg.m' }).forms;
    expect(forms.map(f => [f.text, f.variant.pattern, f.variant.condition])).toEqual([
      ['lui è ripartito', 'plain', 'to leave again'], ['lui ha ripartito', 'isc', 'to divide, to share out']]);
    expect(bareOf('ripartire', 'indicative', 'present', '1sg')).toBe('riparto/ripartisco');
  });

  it('keeps only the cells defective verbs have (I7)', () => {
    for (const verb of ['concernere', 'vigere', 'urgere', 'competere', 'esimere']) {
      const result = conjugate({ language: 'it', infinitive: verb, mood: 'indicative', tense: 'perfect' });
      expect(result.forms, verb).toEqual([]);
      expect(conjugate({ language: 'it', infinitive: verb, mood: 'participle', tense: 'past' }).forms, verb).toEqual([]);
    }
    expect(bare('urgere', 'indicative', 'present')[0]).toBe('urgo');
    expect(bareOf('vigere', 'indicative', 'present', '3sg.m')).toBe('vige');
    expect(conjugate({ language: 'it', infinitive: 'vigere', mood: 'indicative', tense: 'present', subject: '1sg' }).unavailableTargets[0]!.explanation)
      .toBe('This verb is used only in the third person.');
    expect(bareOf('addirsi', 'indicative', 'present', '3sg.m')).toBe('si addice');
    expect(bareOf('confarsi', 'indicative', 'present', '3sg.m')).toBe('si confà');
  });

  it('names the real base (C4) and keeps the weather message true (C3)', () => {
    const steps = conjugate({ language: 'it', infinitive: 'sospendere', mood: 'infinitive', tense: 'present' }).analysis.steps!.map(s => s.rule);
    expect(steps).not.toContain('it.classify.family');
    expect(conjugate({ language: 'it', infinitive: 'piovere', mood: 'indicative', tense: 'present', subject: '3pl' }).unavailableTargets[0]!.explanation)
      .toBe('This verb is impersonal: it is used only in the third person singular.');
  });
});
