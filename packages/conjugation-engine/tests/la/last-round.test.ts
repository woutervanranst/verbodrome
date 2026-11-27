/**
 * The whole-pack review's last round: spelling of the input (breves, wrong macrons), homograph order, the deponent
 * assumption, and the lexicon gaps. Every expectation is from the authority named beside it, not from the engine.
 */
import { describe, expect, it } from 'vitest';
import { conjugate, explain, parseConjugationOptions } from '../../src/index.js';
import { latinPack } from '../../src/languages/la/pack.js';
import type { ConjugatedForm, VerbAnalysis } from '../../src/types.js';
import { explainIds, forms } from './helpers.js';

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

describe('I8: the imperative of sciō', () => {
  it('explains scītō, scītōte by A&G §182.a and tags scīte', () => {
    const present = conjugate({ language: 'la', infinitive: 'scīre', mood: 'imperative', tense: 'present', voice: 'active' } as never).forms;
    expect(present.map(f => f.text)).toEqual(['scītō', 'scītōte', 'scīte']);
    for (const f of present.filter(form => form.text !== 'scīte')) {
      expect(f.parts.flatMap(part => part.steps ?? []).map(s => s.rule)).toEqual(['la.lex.scito']);
    }
    const scite = present.find(f => f.text === 'scīte')!;
    expect([scite.preferred, scite.variant.pattern]).toEqual([false, 'scīte']);
    expect(forms('nescīre', 'imperative', 'present')).toEqual(['nescī', 'nescīte']); // L&S nescio prints no imperative: derived
  });
});

describe('the minor findings', () => {
  it('M1: soleō is intransitive (L&S "v. n."): its gerundive is impersonal only', () => {
    expect(forms('solēre', 'participle', 'gerundive')).toEqual(['solendum']);
  });

  it('M2: morior has no supine (L&S: mortuus, moritūrus)', () => {
    expect(forms('morī', 'supine')).toEqual([]);
  });

  it('M3: no -undus doublet on the gerund of an impersonal verb', () => {
    expect(forms('pluere', 'gerund', undefined, undefined, { agreement: {} })).toEqual(['pluendī', 'pluendō', 'pluendum', 'pluendō']);
  });

  it('M4: an invented dental stem has ss after a short vowel in the perfect as in the supine (A&G §15)', () => {
    expect(forms('fludere', 'indicative', 'perfect', 'active', { subject: '1sg' })[0]).toBe('flussī');
    expect(forms('fludere', 'supine')[0]).toBe('flussum');
  });

  it('M5: the compounds of sistō have -stitum, resistō none (L&S consisto, resisto)', () => {
    expect([pf('cōnsistere'), forms('cōnsistere', 'supine')]).toEqual([['cōnstitī'], ['cōnstitum']]);
    expect([pf('resistere'), forms('resistere', 'supine')]).toEqual([['restitī'], []]);
  });

  it('M10: the perfects L&S prints beside the common one, tagged (plūvit, reperī)', () => {
    const pluit = conjugate({ language: 'la', infinitive: 'pluere', mood: 'indicative', tense: 'perfect', voice: 'active', subject: '3sg' } as never).forms;
    expect(pluit.map(f => [f.text, f.preferred])).toEqual([['pluit', true], ['plūvit', false]]);
    expect(pluit[1]!.variant.pattern).not.toBeNull();
    const reperi = conjugate({ language: 'la', infinitive: 'reperīre', mood: 'indicative', tense: 'perfect', voice: 'active', subject: '1sg' } as never).forms;
    expect(reperi.map(f => [f.text, f.preferred])).toEqual([['repperī', true], ['reperī', false]]);
  });

  it('M11, M12: nāscitūrus is tagged late, potēns tagged adjective', () => {
    const fp = conjugate({ language: 'la', infinitive: 'nāscī', mood: 'participle', tense: 'future' } as never).forms;
    expect(fp.map(f => [f.text, f.variant.usage, f.variant.pattern])).toEqual([['nāscitūrus', 'dated', 'late']]);
    const potens = conjugate({ language: 'la', infinitive: 'posse', mood: 'participle', tense: 'present' } as never).forms;
    expect(potens.map(f => [f.text, f.variant.pattern])).toEqual([['potēns', 'adjective']]);
  });

  it('orior: the imperfect subjunctive orerer, and orīrer beside it (L&S orior: "oreretur … the more usual forms")', () => {
    const orior = conjugate({ language: 'la', infinitive: 'orīrī', mood: 'subjunctive', tense: 'imperfect', voice: 'active', subject: '3sg' } as never).forms;
    expect(orior.map(f => [f.text, f.preferred])).toEqual([['orerētur', true], ['orīrētur', false]]);
    expect(orior[1]!.variant.pattern).not.toBeNull();
  });
});

describe('M7: wording', () => {
  const texts = (form: ConjugatedForm, locale: 'en' | 'nl' = 'en'): string[] =>
    explain('la', form, locale).sections.flatMap(section => section.steps.map(s => s.text));
  const first = (query: Record<string, unknown>): ConjugatedForm => conjugate({ language: 'la', ...query } as never).forms[0]!;

  it('names esse the present infinitive of sum, not a listed form of itself', () => {
    const esse = first({ infinitive: 'esse', mood: 'infinitive', tense: 'present', voice: 'active' });
    expect(texts(esse).join(' ')).toContain('esse is the present infinitive of sum');
    expect(texts(esse, 'nl').join(' ')).toContain('esse is de infinitivus praesentis van sum');
  });

  it('does not make ferō its own model', () => {
    const fert = first({ infinitive: 'ferre', mood: 'indicative', tense: 'present', voice: 'active', subject: '3sg' });
    expect(texts(fert).join(' ')).not.toContain('Like ferō');
    const affert = first({ infinitive: 'afferre', mood: 'indicative', tense: 'present', voice: 'active', subject: '3sg' });
    expect(texts(affert).join(' ')).toContain('Like ferō');
  });

  it('says that dō lacks only the forms A&G prints as a dash', () => {
    const dor = conjugate({ language: 'la', infinitive: 'dare', mood: 'indicative', tense: 'present', voice: 'passive', subject: '1sg' } as never).unavailableTargets[0]!;
    expect(explain('la', dor, 'en').sections[0]!.steps[0]!.text).toContain('A&G prints a dash');
  });

  it('reads tregere with -ēre in its second reading', () => {
    const second = conjugate({ language: 'la', infinitive: 'tregere', mood: 'infinitive', tense: 'present' } as never).analysis.alternatives![0]!;
    expect(explain('la', second, 'en').sections.flatMap(s => s.steps.map(t => t.text))[0]).toBe('tregere is read with -ēre: second conjugation.');
  });

  it('explains calefīō from the passive of calefaciō first', () => {
    const calefio = first({ infinitive: 'calefacere', mood: 'indicative', tense: 'present', voice: 'passive', subject: '1sg' });
    expect(explainIds(calefio)[0]).toBe('la.lex.passive-fio');
  });
});
