/**
 * The whole-pack review's last round: spelling of the input (breves, wrong macrons), homograph order, the deponent
 * assumption, and the lexicon gaps. Every expectation is from the authority named beside it, not from the engine.
 */
import { describe, expect, it } from 'vitest';
import { conjugate, parseConjugationOptions } from '../../src/index.js';
import { latinPack } from '../../src/languages/la/pack.js';
import type { VerbAnalysis } from '../../src/types.js';
import { forms } from './helpers.js';

const analysis = (infinitive: string, extra: Record<string, unknown> = {}): VerbAnalysis =>
  latinPack.engine(parseConjugationOptions({ language: 'la', infinitive, ...extra } as never)).analysis;
const ids = (a: VerbAnalysis): string[] => a.steps!.map(s => s.rule);
const pf = (infinitive: string): string[] => forms(infinitive, 'indicative', 'perfect', 'active', { subject: '1sg' });

describe('I2: a typed breve means short', () => {
  it('matches an unmarked lexicon vowel (capĕre is capere, regĕre is regere)', () => {
    expect(pf('capĕre')).toEqual(['cēpī']); // A&G §188
    expect(pf('regĕre')).toEqual(['rēxī']); // A&G §211
    expect(pf('lĕgĕre')).toEqual(['lēgī']); // A&G §211
    expect(analysis('capĕre')).toMatchObject({ lemma: 'capere', classificationSource: 'lexicon' });
  });

  it('is never copied into the output of an unknown verb', () => {
    const texts = conjugate({ language: 'la', infinitive: 'tregĕre' } as never).forms.map(f => f.text);
    expect(texts.length).toBeGreaterThan(0);
    expect(texts.some(text => /̆/u.test(text.normalize('NFD')))).toBe(false);
    expect(ids(analysis('tregĕre'))).not.toContain('la.classify.assume-third'); // the breve says the e is short: third conjugation
  });
});

describe('I3: a wrong vowel length on a verb the lexicon knows', () => {
  it('resolves to the lexicon verb with an assumption that names the spelling', () => {
    for (const [typed, lemma, perfect] of [['regēre', 'regere', 'rēxī'], ['capēre', 'capere', 'cēpī'], ['āmāre', 'amāre', 'amāvī'], ['mōnēre', 'monēre', 'monuī']]) {
      const a = analysis(typed!);
      expect(a.lemma, typed).toBe(lemma);
      expect(a.classificationSource, typed).toBe('lexicon');
      const step = a.steps!.find(s => s.rule === 'la.classify.assume-spelling')!;
      expect(step.kind, typed).toBe('assumption');
      expect(step.after, typed).toBe(lemma);
      expect(pf(typed!), typed).toEqual([perfect]);
    }
  });

  it('reads ēsse as edō (A&G §201: edō, ēsse, ēdī, ēsum) and keeps esse for sum', () => {
    expect(analysis('ēsse')).toMatchObject({ lemma: 'edere' });
    expect(analysis('ēsse').alternatives).toBeUndefined();
    expect(analysis('esse')).toMatchObject({ lemma: 'esse' });
    expect(analysis('esse').alternatives).toBeUndefined();
  });
});

describe('I4: homograph order is data', () => {
  it('puts the common verb first', () => {
    expect(analysis('venire').lemma).toBe('venīre'); // veniō before vēneō
    expect(analysis('venire').alternatives!.map(a => a.lemma)).toEqual(['vēnīre']);
    expect(forms('venire', 'indicative', 'present', 'active', { subject: '1sg' })[0]).toBe('veniō');
    expect(analysis('occidere').lemma).toBe('occīdere'); // occīdō 'kill' before occidō 'fall'
  });
});

describe('I6: an unknown verb with a passive infinitive', () => {
  it('is read as deponent by an assumption', () => {
    const a = analysis('blorpārī');
    expect(a.classification).toBe('first-deponent');
    const step = a.steps!.find(s => s.rule === 'la.classify.assume-deponent')!;
    expect(step.kind).toBe('assumption');
    expect(ids(a)).not.toContain('la.classify.deponent');
    expect(ids(analysis('hortārī'))).toContain('la.classify.deponent'); // a lexicon deponent keeps the rule step
  });
});

describe('I1: the lexicon gaps', () => {
  it('has the compounds of nōscō as A&G §211.e prints them (cō-gnit-, ā-gnit-) and ignōscō (L&S)', () => {
    expect([pf('cognōscere'), forms('cognōscere', 'supine')]).toEqual([['cognōvī'], ['cognitum']]);
    expect([pf('agnōscere'), forms('agnōscere', 'supine')]).toEqual([['agnōvī'], ['agnitum']]);
    expect([pf('ignōscere'), forms('ignōscere', 'supine')]).toEqual([['ignōvī'], ['ignōtum']]);
    expect(analysis('cognoscere').alternatives).toBeUndefined();
  });

  it('drops the reduplication in compounds, as a stated rule (Bennett §118.4.a Notes 1–2)', () => {
    expect([pf('respondēre'), forms('respondēre', 'supine')]).toEqual([['respondī'], ['respōnsum']]);
    expect(pf('dēspondēre')).toEqual(['dēspondī']);
    expect(pf('attondēre')).toEqual(['attondī']);
    expect(pf('dētondēre')).toEqual(['dētondī', 'dētotondī']); // L&S detondeo: totondi and tondi
    expect([pf('contundere'), forms('contundere', 'supine')]).toEqual([['contudī'], ['contūsum']]);
    expect(analysis('respondēre').steps!.find(s => s.rule === 'la.classify.compound-reduplication')).toMatchObject({ before: 'spopondī', after: '-spondī' });
    expect(pf('ēdiscere')).toEqual(['ēdidicī']); // discō keeps it
  });

  it('lists the compounds of mordeō and pendeō as Lewis & Short gives them', () => {
    expect(pf('dēmordēre')).toEqual([]);
    expect(forms('dēmordēre', 'supine')).toEqual(['dēmorsum']);
    expect(pf('impendēre')).toEqual([]);
    expect([pf('prōpendēre'), forms('prōpendēre', 'supine')]).toEqual([['prōpendī'], ['prōpēnsum']]);
  });

  it('has ostendō, refellō, benedīcō and maledīcō (L&S) with the short imperative of dīcō (A&G §182)', () => {
    expect([pf('ostendere'), forms('ostendere', 'supine')]).toEqual([['ostendī'], ['ostēnsum', 'ostentum']]);
    expect(forms('refellere', 'supine')).toEqual([]);
    expect(forms('benedīcere', 'imperative', 'present')).toEqual(['benedīc', 'benedīcite']);
    expect(pf('maledīcere')).toEqual(['maledīxī']);
  });

  it('models the parenthesised compound forms of A&G §211 (ēlicuī; -sēdī; -tūsum)', () => {
    expect([pf('ēlicere'), forms('ēlicere', 'supine')]).toEqual([['ēlicuī'], ['ēlicitum']]);
    expect([pf('cōnsīdere'), forms('cōnsīdere', 'supine')]).toEqual([['cōnsēdī'], ['cōnsessum']]);
  });
});
