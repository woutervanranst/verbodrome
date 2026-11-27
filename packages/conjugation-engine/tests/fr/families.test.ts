/**
 * Family forms the whole-pack review found wrong (fix wave C1, I1, I2, I7), with the authority for each.
 */
import { describe, expect, it } from 'vitest';
import { engine } from '../../src/default-engine.js';

type Query = Readonly<Record<string, unknown>>;
const forms = (infinitive: string, query: Query) => [...new Set(engine.conjugate({ language: 'fr', infinitive, ...query }).forms
  .map(form => form.variant.orthography === 'both' ? form.text : `${form.text} (${form.variant.orthography})`))];
const steps = (infinitive: string, query: Query) => engine.conjugate({ language: 'fr', infinitive, ...query }).forms
  .map(form => `${form.text}: ${form.ruleIds.join(' ')}`);

describe('French family corrections', () => {
  it('croître: crû, crue, crus, crues in both spellings (JO 1990 II.4 keeps only; Académie A9C5057)', () => {
    expect(forms('croître', { mood: 'participle', tense: 'past' })).toEqual(['crû', 'crus', 'crue', 'crues']);
  });

  it('clore: il clôt in both spellings (JO 1990 II.4 keeps ô; Académie A9C2658)', () => {
    expect(forms('clore', { mood: 'indicative', tense: 'present', person: 3, number: 'singular', gender: 'masculine' })).toEqual(['il clôt']);
    expect(forms('déclore', { mood: 'indicative', tense: 'present', person: 3, number: 'singular', gender: 'masculine' })).toEqual(['il déclôt']);
  });

  it('enclore and éclore: the Académie prints « enclôt ou enclot », « éclôt ou éclot » (A9E1359, A9E0262), both spellings', () => {
    const third = { mood: 'indicative', tense: 'present', person: 3, number: 'singular', gender: 'masculine' } as const;
    expect(forms('enclore', third)).toEqual(['il enclôt', 'il enclot']);
    expect(forms('éclore', third)).toEqual(['il éclôt', 'il éclot']);
    expect(steps('enclore', third)[1]).toMatch(/fr\.stem\.listed-spelling/u);
  });

  it('surseoir: je sursoirai (built on the 1990 infinitive sursoir) and je surseoirai, with their own rule', () => {
    const future = { mood: 'indicative', tense: 'future', person: 1, number: 'singular' } as const;
    expect(forms('surseoir', future)).toEqual(['je sursoirai (rectified)', 'je surseoirai (traditional)']);
    expect(steps('surseoir', future)[0]).toMatch(/fr\.orth\.1990-sursoir-future/u);
    expect(steps('surseoir', future)[0]).not.toMatch(/fr\.orth\.1990-assoir/u);
    expect(forms('surseoir', { mood: 'infinitive', tense: 'present' })).toEqual(['sursoir (rectified)', 'surseoir (traditional)']);
  });

  it('asseoir: j\'assoirai in both spellings for the assois series (JO 1990 note (a); Académie A9A2823)', () => {
    expect(forms('asseoir', { mood: 'indicative', tense: 'future', person: 1, number: 'singular' })).toEqual(['j\'assoirai', 'j\'assiérai']);
    expect(forms('asseoir', { mood: 'conditional', tense: 'present', person: 1, number: 'singular' })).toEqual(['j\'assoirais', 'j\'assiérais']);
  });

  it('faillir: avoir only, participle invariable (Académie A9F0105)', () => {
    expect(forms('faillir', { mood: 'indicative', tense: 'perfect', person: 1, number: 'singular' })).toEqual(['j\'ai failli']);
    expect(forms('faillir', { mood: 'participle', tense: 'past' })).toEqual(['failli']);
    expect(engine.conjugate({ language: 'fr', infinitive: 'faillir', mood: 'infinitive' }).analysis.auxiliaries).toEqual(['avoir']);
  });

  it('redevoir: redu in the 1990 spelling, redû traditionally (JO 1990 II.4: not the derivatives of dû)', () => {
    expect(forms('redevoir', { mood: 'participle', tense: 'past', agreement: { gender: 'masculine', number: 'singular' } }))
      .toEqual(['redu (rectified)', 'redû (traditional)']);
    expect(forms('devoir', { mood: 'participle', tense: 'past', agreement: { gender: 'masculine', number: 'singular' } })).toEqual(['dû']);
  });
});

describe('French hinted stems (fix wave I4)', () => {
  const stems = { singular: 'plessoi', plural: 'plessoy', future: 'plessoir', past: 'pless', pastVowel: 'i', pastParticiple: 'plessu' } as const;
  const third = { mood: 'indicative', tense: 'present', person: 3, number: 'plural', gender: 'masculine' } as const;
  const subjunctive = { mood: 'subjunctive', tense: 'present', person: 1, number: 'singular' } as const;

  it('writes y as i before a mute ending in a hinted part (BDL 24212: voient, croient, fuient)', () => {
    expect(forms('plessoir', { stems, ...third })).toEqual(['ils plessoient']);
    expect(forms('plessoir', { stems, ...subjunctive })).toEqual(['que je plessoie']);
    expect(forms('plessoir', { stems, mood: 'indicative', tense: 'present', person: 1, number: 'plural' })).toEqual(['nous plessoyons']);
    const blouvoir = { singular: 'blouvoi', plural: 'blouvoy', future: 'blouvoir', past: 'blouv', pastVowel: 'i', pastParticiple: 'blouvu' } as const;
    expect(forms('blouvoir', { stems: blouvoir, ...third })).toEqual(['ils blouvoient']);
    expect(forms('blouvoir', third)).toEqual(['ils blouvoient']);
  });

  it('records the ils stem taken from the nous stem as an assumption, and none when thirdPlural is given', () => {
    const assumptions = (hints: Readonly<Record<string, string>>) =>
      engine.conjugate({ language: 'fr', infinitive: 'plessoir', stems: hints, ...third }).analysis.assumptions;
    const ils = 'The ils stem is taken from the nous stem you gave, plessoy-; give thirdPlural when it differs.';
    expect(assumptions(stems)).toContain(ils);
    expect(assumptions({ ...stems, thirdPlural: 'plessoi' })).not.toContain(ils);
    expect(forms('plessoir', { stems: { ...stems, thirdPlural: 'plessoi' }, ...third })).toEqual(['ils plessoient']);
  });
});
