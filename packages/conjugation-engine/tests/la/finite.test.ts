import { describe, expect, it } from 'vitest';
import { conjugate } from '../../src/index.js';
import { quantityProblems } from '../../src/languages/la/orthography.js';
import { explainIds, form, forms } from './helpers.js';

describe('Latin simple finite tenses', () => {
  it('conjugates the five models in the present system', () => {
    expect(forms('amāre', 'indicative', 'present')).toEqual(['amō', 'amās', 'amat', 'amāmus', 'amātis', 'amant']);
    expect(forms('monēre', 'subjunctive', 'present')).toEqual(['moneam', 'moneās', 'moneat', 'moneāmus', 'moneātis', 'moneant']);
    expect(forms('tegere', 'indicative', 'future')).toEqual(['tegam', 'tegēs', 'teget', 'tegēmus', 'tegētis', 'tegent']);
    expect(forms('capere', 'indicative', 'present')).toEqual(['capiō', 'capis', 'capit', 'capimus', 'capitis', 'capiunt']);
    expect(forms('audīre', 'indicative', 'imperfect')).toEqual(['audiēbam', 'audiēbās', 'audiēbat', 'audiēbāmus', 'audiēbātis', 'audiēbant']);
    expect(forms('capere', 'subjunctive', 'imperfect')[0]).toBe('caperem');
    expect(forms('capere', 'imperative', 'future')).toEqual(['capitō', 'capitō', 'capitōte', 'capiuntō']);
    expect(forms('tegere', 'imperative', 'present')).toEqual(['tege', 'tegite']);
  });

  it('explains amat and amem step by step', () => {
    expect(explainIds(form('amāre', 'indicative', 'present', '3sg'))).toEqual(['la.stem.present', 'la.end.personal', 'la.orth.short-final']);
    expect(explainIds(form('amāre', 'subjunctive', 'present', '1sg'))).toEqual(['la.stem.present', 'la.end.subjunctive', 'la.orth.a-lost', 'la.orth.short-final']);
    expect(explainIds(form('capere', 'indicative', 'present', '2sg'))).toContain('la.orth.io-drop-i');
  });

  it('gives the passive with the literary -re beside -ris', () => {
    const second = conjugate({ language: 'la', infinitive: 'amāre', mood: 'indicative', tense: 'present', voice: 'passive', subject: '2sg' }).forms;
    expect(second.map(f => [f.text, f.variant.usage, f.variant.pattern])).toEqual([['amāris', 'standard', null], ['amāre', 'literary', 're']]);
    expect(forms('tegere', 'indicative', 'present', 'passive').slice(0, 4)).toEqual(['tegor', 'tegeris', 'tegere', 'tegitur']);
    expect(forms('tegere', 'indicative', 'future', 'passive')).toContain('tegēris');
  });

  it('builds the active perfect system on the perfect stem', () => {
    expect(forms('amāre', 'indicative', 'perfect')).toEqual(['amāvī', 'amāvistī', 'amāvit', 'amāvimus', 'amāvistis', 'amāvērunt', 'amāvēre']);
    expect(forms('amāre', 'subjunctive', 'perfect')).toEqual(['amāverim', 'amāverīs', 'amāverit', 'amāverīmus', 'amāverītis', 'amāverint']);
    expect(forms('amāre', 'indicative', 'future_perfect')).toEqual(['amāverō', 'amāveris', 'amāverit', 'amāverimus', 'amāveritis', 'amāverint']);
    expect(explainIds(form('tegere', 'indicative', 'perfect', '1sg'))).toEqual(['la.stem.perfect', 'la.end.perfect']);
    expect(forms('tegere', 'indicative', 'perfect')[0]).toBe('tēxī');
  });

  it('conjugates the irregular verbs', () => {
    expect(forms('esse', 'indicative', 'present')).toEqual(['sum', 'es', 'est', 'sumus', 'estis', 'sunt']);
    expect(forms('esse', 'subjunctive', 'imperfect').slice(0, 2)).toEqual(['essem', 'forem']);
    expect(forms('ferre', 'indicative', 'present')).toEqual(['ferō', 'fers', 'fert', 'ferimus', 'fertis', 'ferunt']);
    expect(forms('ferre', 'subjunctive', 'imperfect')[0]).toBe('ferrem');
    expect(forms('īre', 'indicative', 'present')).toEqual(['eō', 'īs', 'it', 'īmus', 'ītis', 'eunt']);
    expect(forms('īre', 'indicative', 'future')[0]).toBe('ībō');
    expect(forms('īre', 'imperative', 'future')).toEqual(['ītō', 'ītō', 'ītōte', 'euntō']);
    expect(forms('īre', 'indicative', 'perfect').slice(0, 4)).toEqual(['iī', 'īvī', 'īstī', 'īvistī']);
    expect(forms('velle', 'indicative', 'present')).toEqual(['volō', 'vīs', 'vult', 'volt', 'volumus', 'vultis', 'voltis', 'volunt']); // volt, voltis dated (A&G p. 109)
    expect(forms('nōlle', 'indicative', 'present')[1]).toBe('nōn vīs');
    expect(forms('dare', 'indicative', 'present')).toEqual(['dō', 'dās', 'dat', 'damus', 'datis', 'dant']);
    expect(forms('dare', 'subjunctive', 'present').slice(0, 2)).toEqual(['dem', 'dēs']);
    expect(forms('fierī', 'indicative', 'present')).toEqual(['fīō', 'fīs', 'fit', 'fīmus', 'fītis', 'fīunt']);
  });

  it('shortens the imperative of dīcō, dūcō, faciō, ferō only', () => {
    expect(forms('dūcere', 'imperative', 'present')).toEqual(['dūc', 'dūcite']);
    expect(forms('ēdūcere', 'imperative', 'present')[0]).toBe('ēdūc');
    expect(forms('facere', 'imperative', 'present')[0]).toBe('fac');
    expect(forms('ferre', 'imperative', 'present')).toEqual(['fer', 'ferte']);
    expect(forms('cōnficere', 'imperative', 'present')[0]).toBe('cōnfice');
    expect(forms('dūcāre', 'imperative', 'present')[0]).toBe('dūcā');
  });

  it('conjugates a deponent with passive endings in the active', () => {
    expect(forms('hortārī', 'indicative', 'present')).toEqual(['hortor', 'hortāris', 'hortāre', 'hortātur', 'hortāmur', 'hortāminī', 'hortantur']);
    // the 2nd plural is declared unavailable in Task 4; ask for the singular only here
    expect(forms('hortārī', 'imperative', 'future', 'active', { number: 'singular' })).toEqual(['hortātor', 'hortātor']);
  });

  it('never breaks a quantity rule in the model paradigms', () => {
    for (const infinitive of ['amāre', 'monēre', 'tegere', 'capere', 'audīre', 'hortārī', 'ferre', 'īre'])
      for (const tense of ['present', 'imperfect', 'future'])
        for (const f of conjugate({ language: 'la', infinitive, mood: 'indicative', tense, voice: 'active' } as never).forms)
          expect(quantityProblems(f.text), f.text).toEqual([]);
  });
});
