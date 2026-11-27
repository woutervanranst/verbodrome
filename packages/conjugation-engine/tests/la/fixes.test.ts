/** The cases of the stint-1 review (wrong forms, explanations, Critical and Important issues), one test per finding. */
import { describe, expect, it } from 'vitest';
import { conjugate, ConjugationError, explain } from '../../src/index.js';
import type { ConjugatedForm, VerbAnalysis } from '../../src/types.js';
import { explainIds, forms } from './helpers.js';

const one = (infinitive: string, mood: string, tense: string, voice: string, subject: string, extra: Record<string, unknown> = {}): ConjugatedForm[] =>
  [...conjugate({ language: 'la', infinitive, mood, tense, voice, subject, ...extra } as never).forms];
const analysis = (infinitive: string, extra: Record<string, unknown> = {}): VerbAnalysis =>
  conjugate({ language: 'la', infinitive, mood: 'infinitive', tense: 'present', ...extra } as never).analysis;
const unavailable = (query: Record<string, unknown>): [string, string][] =>
  conjugate({ language: 'la', ...query } as never).unavailableTargets.map(u => [u.reason, u.step!.rule]);
const sentence = (query: Record<string, unknown>, locale: 'en' | 'nl'): string =>
  explain('la', conjugate({ language: 'la', ...query } as never).unavailableTargets[0]!, locale).sections[0]!.steps[0]!.text;

describe('C1: impersonal verbs have well-formed perfects', () => {
  it('licet', () => {
    expect(forms('licēre', 'indicative', 'perfect', 'active', { subject: '3sg' })).toEqual(['licuit', 'licitum est']);
    expect(forms('licēre', 'indicative', 'pluperfect', 'active', { subject: '3sg' })).toEqual(['licuerat']);
    expect(forms('licēre', 'indicative', 'future_perfect', 'active', { subject: '3sg' })).toEqual(['licuerit']);
    expect(forms('licēre', 'subjunctive', 'perfect', 'active', { subject: '3sg' })).toEqual(['licuerit']);
    expect(forms('licēre', 'infinitive', 'perfect', 'active')).toEqual(['licuisse']);
    expect(forms('licēre', 'infinitive', 'future', 'active')).toEqual(['licitūrum esse']); // A&G §207: -itūrum esse
  });
  it('the other impersonals (Bennett §138)', () => {
    expect(forms('oportēre', 'infinitive', 'perfect', 'active')).toEqual(['oportuisse']);
    expect(forms('oportēre', 'indicative', 'perfect', 'active', { subject: '3sg' })).toEqual(['oportuit']);
    expect(forms('pluere', 'indicative', 'perfect', 'active', { subject: '3sg' })).toEqual(['pluit', 'plūvit']); // L&S pluo: plūvi in Plautus and Livy
    expect(forms('ningere', 'indicative', 'perfect', 'active', { subject: '3sg' })).toEqual(['ninxit']);
    expect(forms('taedēre', 'indicative', 'pluperfect', 'active', { subject: '3sg' })).toEqual(['taeduerat']);
    expect(forms('paenitēre', 'indicative', 'perfect', 'active', { subject: '3sg' })).toEqual(['paenituit']);
  });
  it('I10: an impersonal has no participles but what the grammar names', () => {
    expect(unavailable({ infinitive: 'oportēre', mood: 'participle', tense: 'present' })).toEqual([['defective', 'la.avail.not-attested']]);
    // "Many verbs ... appear only in the 3rd person singular, the infinitive, and the gerund" (A&G §207).
    expect(forms('oportēre', 'gerund')).toEqual(['oportendī']);
    expect(unavailable({ infinitive: 'oportēre', mood: 'participle', tense: 'gerundive' })).toEqual([['defective', 'la.avail.not-attested']]);
    expect(forms('paenitēre', 'participle', 'gerundive')).toEqual(['paenitendus']); // A&G §208.b Note
    expect(forms('pudēre', 'participle', 'gerundive')).toEqual(['pudendus']);
  });
});

describe('C2: dare has its imperative; only what the grammar prints as missing is missing', () => {
  it('dā, date', () => {
    expect(forms('dare', 'imperative', 'present')).toEqual(['dā', 'date']);
    expect(unavailable({ infinitive: 'dare', mood: 'indicative', tense: 'present', voice: 'passive', subject: '1sg' })).toEqual([['defective', 'la.avail.not-attested']]);
    expect(forms('dare', 'indicative', 'present', 'passive').slice(0, 2)).toEqual(['daris', 'dare']);
  });
  it('fīō has no plural future imperative, with a true reason', () => {
    expect(unavailable({ infinitive: 'fierī', mood: 'imperative', tense: 'future', voice: 'active', subject: '2pl' })).toEqual([['defective', 'la.avail.not-attested']]);
    expect(forms('fierī', 'imperative', 'future', 'active', { number: 'singular' })).toEqual(['fītō', 'fītō']);
    expect(sentence({ infinitive: 'fierī', mood: 'imperative', tense: 'future', voice: 'active', subject: '2pl' }, 'en')).not.toContain('no imperative');
  });
});

describe('C3, C4, I5: compounds take their family forms', () => {
  it('red-', () => {
    expect(forms('redigere', 'indicative', 'perfect', 'active', { subject: '1sg' })).toEqual(['redēgī']);
    expect(forms('redigere', 'participle', 'perfect')).toEqual(['redāctus']);
    expect(forms('redimere', 'indicative', 'perfect', 'active', { subject: '1sg' })).toEqual(['redēmī']);
    expect(forms('redimere', 'participle', 'perfect')).toEqual(['redēmptus']);
  });
  it('attingō, contingō from tangō, never from tingō', () => {
    expect(forms('attingere', 'indicative', 'perfect', 'active', { subject: '1sg' })).toEqual(['attigī']);
    expect(forms('attingere', 'participle', 'perfect')).toEqual(['attāctus']);
    expect(forms('contingere', 'indicative', 'perfect', 'active', { subject: '1sg' })).toEqual(['contigī']);
    expect(analysis('attingere').alternatives).toBeUndefined();
  });
  it('-faciō with -fīō, the first-conjugation dō compounds, ē- before i, por-, -fiteor, simple legō, -fringō, -spergō', () => {
    expect(forms('calefacere', 'indicative', 'present', 'active', { subject: '1sg' })).toEqual(['calefaciō']);
    expect(forms('calefacere', 'indicative', 'perfect', 'active', { subject: '1sg' })).toEqual(['calefēcī']);
    expect(forms('calefacere', 'indicative', 'present', 'passive', { subject: '1sg' })).toEqual(['calefīō']);
    expect(forms('satisfacere', 'indicative', 'present', 'passive', { subject: '3sg' })).toEqual(['satisfit']);
    expect(analysis('circumdare').lemma).toBe('circumdare');
    expect(forms('circumdare', 'indicative', 'perfect', 'active', { subject: '1sg' })).toEqual(['circumdedī']);
    expect(forms('circumdare', 'participle', 'perfect')).toEqual(['circumdatus']);
    expect(forms('ēicere', 'indicative', 'perfect', 'active', { subject: '1sg' })).toEqual(['ēiēcī']);
    expect(forms('possidēre', 'indicative', 'perfect', 'active', { subject: '1sg' })).toEqual(['possēdī']);
    expect(forms('possidēre', 'participle', 'perfect')).toEqual(['possessus']);
    expect(forms('cōnfitērī', 'indicative', 'perfect', 'active', { subject: '1sg.m' })).toEqual(['cōnfessus sum']);
    expect(forms('profitērī', 'indicative', 'perfect', 'active', { subject: '1sg.m' })).toEqual(['professus sum']);
    expect(forms('perlegere', 'indicative', 'perfect', 'active', { subject: '1sg' })).toEqual(['perlēgī']);
    expect(forms('colligere', 'indicative', 'perfect', 'active', { subject: '1sg' })).toEqual(['collēgī']);
    expect(forms('cōnfringere', 'indicative', 'perfect', 'active', { subject: '1sg' })).toEqual(['cōnfrēgī']);
    expect(forms('cōnspergere', 'indicative', 'perfect', 'active', { subject: '1sg' })).toEqual(['cōnspersī']);
  });
  it('I4: ferō compounds are a family; an unlisted prefix is an assumption, not an error', () => {
    expect(forms('trānsferre', 'indicative', 'perfect', 'active', { subject: '1sg' })).toEqual(['trānstulī']);
    expect(forms('trānsferre', 'supine')).toEqual(['trānslātum', 'trālātum']);
    expect(forms('praeferre', 'indicative', 'perfect', 'active', { subject: '1sg' })).toEqual(['praetulī']);
    expect(forms('perferre', 'indicative', 'perfect', 'active', { subject: '1sg' })).toEqual(['pertulī']);
    expect(forms('dēferre', 'indicative', 'perfect', 'active', { subject: '1sg' })).toEqual(['dētulī']);
    expect(forms('prōferre', 'indicative', 'perfect', 'active', { subject: '1sg' })).toEqual(['prōtulī']);
    expect(forms('afferre', 'indicative', 'perfect', 'active', { subject: '1sg' })).toEqual(['attulī']);
    expect(forms('afferre', 'indicative', 'present', 'active', { subject: '3sg' })).toEqual(['affert']);
    expect(forms('afferre', 'imperative', 'present')).toEqual(['affer', 'afferte']);
    expect(forms('referre', 'indicative', 'perfect', 'active', { subject: '1sg' })).toEqual(['rettulī']);
    const ante = analysis('anteferre');
    expect(ante.steps!.map(s => s.rule)).toEqual(['la.classify.compound', 'la.classify.assume-compound']);
    expect(forms('anteferre', 'indicative', 'perfect', 'active', { subject: '1sg' })).toEqual(['antetulī']);
  });
});

describe('C5: availability explanations say what the verb is', () => {
  it('no passive', () => {
    const velle = { infinitive: 'velle', mood: 'indicative', tense: 'present', voice: 'passive', subject: '1sg' };
    expect(sentence(velle, 'en')).toBe('velle has no passive.');
    expect(sentence(velle, 'nl')).toBe('velle heeft geen passivum.');
    expect(sentence({ ...velle, infinitive: 'hortārī' }, 'en')).toContain('deponent');
    expect(sentence({ ...velle, infinitive: 'posse' }, 'en')).not.toMatch(/deponent|intransitive/u);
  });
  it('possum and the compounds of sum are explained from sum', () => {
    expect(explainIds(one('posse', 'indicative', 'present', 'active', '2sg')[0]!)).toEqual(['la.lex.pot-sum']);
    expect(one('posse', 'subjunctive', 'imperfect', 'active', '1sg').map(f => f.text)).toEqual(['possem']);
    expect(explainIds(one('prōdesse', 'indicative', 'present', 'active', '2sg')[0]!)).toEqual(['la.lex.sum-compound']);
    expect(forms('prōdesse', 'indicative', 'present')).toEqual(['prōsum', 'prōdes', 'prōdest', 'prōsumus', 'prōdestis', 'prōsunt']);
  });
});

describe('I1, I2, I3, I6: identifying a verb', () => {
  it('rejects a passive infinitive and a perfect typed as the infinitive', () => {
    for (const infinitive of ['gerī', 'quaerī', 'quaeri', 'amārī', 'amāvī'])
      expect(() => analysis(infinitive), infinitive).toThrow(ConjugationError);
    expect(() => analysis('gerī')).toThrow(/gerere/u);
  });
  it('reads j as i with or without macrons', () => {
    expect(forms('jubēre', 'indicative', 'perfect', 'active', { subject: '1sg' })).toEqual(['iussī']);
    expect(forms('juvāre', 'indicative', 'perfect', 'active', { subject: '1sg' })).toEqual(['iūvī']);
  });
  it('finds the common second-conjugation verbs without macrons', () => {
    expect(analysis('habere')).toMatchObject({ lemma: 'habēre', classification: 'second', classificationSource: 'lexicon' });
    expect(forms('habere', 'indicative', 'present', 'active', { subject: '1sg' })).toEqual(['habeō']);
    expect(forms('debere', 'indicative', 'perfect', 'active', { subject: '1sg' })).toEqual(['dēbuī']);
    expect(forms('placere', 'indicative', 'perfect', 'active', { subject: '1sg' })).toEqual(['placuī']);
    expect(forms('prohibere', 'indicative', 'perfect', 'active', { subject: '1sg' })).toEqual(['prohibuī']);
    expect(forms('cogere', 'indicative', 'perfect', 'active', { subject: '1sg' })).toEqual(['coēgī']);
    expect(forms('cōgere', 'participle', 'perfect')).toEqual(['coāctus']);
    expect(forms('dēgere', 'indicative', 'perfect', 'active', { subject: '1sg' })).toEqual(['dēgī']);
    expect(unavailable({ infinitive: 'dēgere', mood: 'supine' })).toEqual([['defective', 'la.avail.no-supine']]);
  });
  it('returns both readings of an unknown -ere without macrons', () => {
    const a = analysis('tregere');
    expect([a.classification, a.alternatives!.map(alt => alt.classification)]).toEqual(['third', ['second']]);
    expect(a.alternatives![0]!.steps!.map(s => s.rule)).toContain('la.classify.assume-second');
    expect(forms('tregere', 'indicative', 'present', 'active', { subject: '1sg' })).toEqual(['tregō', 'tregeō']);
    expect(analysis('tregēre').alternatives).toBeUndefined();
    expect(analysis('blorperi').alternatives!.map(alt => alt.classification)).toEqual(['third-deponent']);
  });
  it('tells homographs apart by a hint with macrons', () => {
    expect(analysis('edere', { stems: { present: 'edō' } })).toMatchObject({ lemma: 'edere' });
    expect(analysis('edere', { stems: { present: 'edō' } }).alternatives).toBeUndefined();
    expect(analysis('occidere', { stems: { present: 'occīdō' } })).toMatchObject({ lemma: 'occīdere' });
    expect(analysis('occidere', { stems: { present: 'occīdō' } }).alternatives).toBeUndefined();
  });
  it('accepts dēesse and partial macrons that fit one entry', () => {
    expect(analysis('dēesse').lemma).toBe('deesse');
    expect(analysis('pārere').lemma).toBe('pārēre');
  });
});

describe('I7, I8, I9: rules at the junction, eō, faciō', () => {
  it('keeps a stem vowel before nt', () => {
    expect(forms('nūntiāre', 'indicative', 'present', 'active', { subject: '1sg' })).toEqual(['nūntiō']);
    expect(forms('nūntiāre', 'indicative', 'present', 'active', { subject: '3pl' })).toEqual(['nūntiant']);
  });
  it('derives the perfect of eō with the contraction', () => {
    expect(forms('īre', 'indicative', 'perfect').slice(0, 4)).toEqual(['iī', 'īvī', 'īstī', 'īvistī']);
    expect(explainIds(one('īre', 'indicative', 'perfect', 'active', '2sg')[0]!)).toEqual(['la.stem.perfect', 'la.end.perfect', 'la.orth.ii-contraction']);
    expect(forms('īre', 'infinitive', 'perfect', 'active')).toEqual(['īsse', 'īvisse']);
    expect(forms('redīre', 'indicative', 'perfect', 'active', { subject: '1sg' })).toEqual(['rediī', 'redīvī']);
    expect(forms('adīre', 'subjunctive', 'pluperfect', 'active', { subject: '3sg' })).toEqual(['adīsset', 'adīvisset']);
  });
  it('explains faciō\'s passive by fīō', () => {
    const fio = one('facere', 'indicative', 'present', 'passive', '1sg');
    expect(fio.map(f => f.text)).toEqual(['fīō']);
    expect(explainIds(fio[0]!)).toContain('la.lex.passive-fio');
    expect(forms('cōnficere', 'indicative', 'present', 'passive', { subject: '1sg' })).toEqual(['cōnficior']);
  });
  it('fac: the io rule, then the short imperative', () => {
    expect(explainIds(one('facere', 'imperative', 'present', 'active', '2sg')[0]!)).toEqual(['la.stem.present', 'la.end.imperative', 'la.orth.io-drop-i', 'la.end.short-imperative']);
  });
});

describe('Minor findings', () => {
  it('lavere is literary; no invented supines; no -undus after qu', () => {
    expect(one('lavere', 'indicative', 'present', 'active', '1sg').every(f => f.variant.usage === 'literary')).toBe(true);
    for (const infinitive of ['audēre', 'gaudēre', 'solēre', 'fīdere', 'coepisse', 'ōdisse'])
      expect(unavailable({ infinitive, mood: 'supine' }), infinitive).toEqual([['defective', 'la.avail.no-supine']]);
    expect(forms('sequī', 'participle', 'gerundive')).toEqual(['sequendus']);
    expect(forms('morī', 'participle', 'gerundive')).toEqual(['moriendum', 'moriundum']); // impersonal only (A&G §190.d)
  });
  it('tonāre has a personal and an impersonal paradigm, each with its gloss', () => {
    const a = analysis('tonāre');
    expect([a.condition, a.alternatives?.[0]?.condition].sort()).toEqual(['it thunders', 'thunder']);
  });
  it('careō has its future participle (L&S caritūrus)', () => {
    expect(forms('carēre', 'participle', 'future')).toEqual(['caritūrus']);
  });
});

describe('Defective verbs with only their attested forms (A&G §206)', () => {
  it('inquam, āiō, quaesō, cedo', () => {
    expect(forms('inquam', 'indicative', 'present')).toEqual(['inquam', 'inquis', 'inquit', 'inquimus', 'inquitis', 'inquiunt']);
    expect(forms('inquam', 'indicative', 'future')).toEqual(['inquiēs', 'inquiet']);
    expect(forms('āiō', 'indicative', 'present')).toEqual(['āiō', 'ais', 'ait', 'āiunt']);
    expect(forms('aio', 'subjunctive', 'present')).toEqual(['āiās', 'āiat', 'āiant']);
    expect(forms('āiō', 'participle', 'present')).toEqual(['āiēns']);
    expect(unavailable({ infinitive: 'āiō', mood: 'indicative', tense: 'present', voice: 'active', subject: '1pl' })).toEqual([['defective', 'la.avail.not-attested']]);
    expect(forms('quaesō', 'indicative', 'present')).toEqual(['quaesō', 'quaesumus']);
    expect(forms('cedo', 'imperative', 'present')).toEqual(['cedo', 'cedite', 'cette']);
  });
  it('fārī, salvē, avē', () => {
    expect(forms('fārī', 'indicative', 'present')).toEqual(['fātur', 'fantur']);
    expect(forms('fārī', 'gerund', undefined, undefined, { agreement: {} })).toEqual(['fandī', 'fandō']);
    expect(forms('fārī', 'supine')).toEqual(['fātū']);
    expect(forms('salvēre', 'imperative', 'present')).toEqual(['salvē', 'salvēte']);
    expect(forms('avēre', 'imperative', 'present')).toEqual(['avē', 'havē', 'avēte']);
    const r = conjugate({ language: 'la', infinitive: 'quaesō' });
    expect(r.forms.map(f => f.text)).toEqual(['quaesō', 'quaesumus']);
  });
  it('nōvī', () => {
    expect(forms('nōvisse', 'indicative', 'perfect', 'active', { subject: '1sg' })).toEqual(['nōvī']);
    expect(unavailable({ infinitive: 'nōvisse', mood: 'indicative', tense: 'present', voice: 'active', subject: '1sg' })).toEqual([['defective', 'la.avail.no-present']]);
  });
});

describe('found by the en.wiktionary oracle (Task 9)', () => {
  it('gives the compounds of sum forem and fore with the prefix of the perfect (A&G §§170.a, 198)', () => {
    expect(forms('abesse', 'subjunctive', 'imperfect', 'active', { subject: '3sg' })).toEqual(['abesset', 'āforet']);
    expect(forms('prōdesse', 'infinitive', 'future', 'active', { agreement: { gender: 'masculine', number: 'singular', case: 'accusative' } })).toEqual(['prōfutūrum esse', 'prōfore']);
    expect(forms('posse', 'subjunctive', 'imperfect', 'active', { subject: '1sg' })).toEqual(['possem']);
  });

  it('uses scītō for the imperative of sciō (A&G §182.a)', () => {
    expect(forms('scīre', 'imperative', 'present')).toEqual(['scītō', 'scītōte', 'scīte']);
  });

  it('prints the future participles the authorities print', () => {
    expect(forms('stāre', 'participle', 'future')).toEqual(['stātūrus']); // Bennett §120.IV
    expect(forms('lavāre', 'participle', 'future')).toEqual(['lavātūrus', 'lautūrus', 'lōtūrus']); // A&G §211 lōt- (laut-)
    expect(forms('nāscī', 'participle', 'future')).toEqual(['nāscitūrus']); // Lewis & Short s.v. nascor
  });

  it('syncopates queō like any -īvī perfect, and gives an impersonal verb its gerund (A&G §§181.b, 207)', () => {
    expect(forms('quīre', 'indicative', 'perfect', 'active', { subject: '1sg' })).toEqual(['quīvī', 'quiī']);
    expect(forms('pluere', 'gerund', undefined, undefined, { agreement: {} })).toEqual(expect.arrayContaining(['pluendī', 'pluendō', 'pluendum']));
  });
});
