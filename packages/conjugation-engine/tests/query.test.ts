import { describe, expect, it } from 'vitest';
import { conjugate, conjugationOptions, ConjugationError, parseConjugationOptions, renderParts } from '../src/index.js';
import { expandTargets, targetKey } from '../src/catalogue.js';
import type { ConjugationOptions, ConjugatedForm, PartRole } from '../src/types.js';

function component(form: ConjugatedForm, role: PartRole) {
  const found = form.parts.find(part => part.role === role);
  if (!found) throw new Error(`Missing ${role}.`);
  return found;
}

function first(options: ConjugationOptions): ConjugatedForm {
  const form = conjugate(options).forms[0];
  if (!form) throw new Error('Missing form.');
  return form;
}

describe('public wildcard engine', () => {
  it.each([
    { language: 'fr', infinitive: 'aimer' },
    { language: 'fr', infinitive: 'finir' },
    { language: 'nl', infinitive: 'werken' },
  ] as const)('covers every catalogue slot for $infinitive', options => {
    const result = conjugate(options);
    expect(result.status).toBe('available');
    expect(new Set(result.forms.map(form => targetKey(form.target))))
      .toEqual(new Set(expandTargets(options).map(targetKey)));
    expect(result.forms.every(form => form.parts.length && form.text === renderParts(options.language, form.parts))).toBe(true);
  });

  it('equals the union of the corresponding precise requests', () => {
    const options = { language: 'fr', infinitive: 'payer', mood: 'indicative', tense: 'present' } as const;
    const broad = conjugate(options);
    const exact = expandTargets(options).flatMap(target => conjugate(parseConjugationOptions({
      ...options, person: target.person, number: target.number,
    })).forms);
    expect(broad.forms).toEqual(exact);
    const feminine = conjugate({ ...options, gender: 'feminine' });
    expect(feminine.forms).toEqual(broad.forms.filter(form => form.target.gender !== 'masculine'));
  });

  it('keeps non-finite applicability distinct from participle agreement', () => {
    const result = conjugate({ language: 'fr', infinitive: 'aimer', mood: 'participle', tense: 'past' });
    expect(result.forms.map(form => form.text)).toEqual(['aimé', 'aimés', 'aimée', 'aimées']);
    expect(result.forms.every(form => form.target.person === null && form.target.number === null)).toBe(true);
    expect(result.forms.map(form => form.target.agreement)).toHaveLength(4);
    expect(conjugate({ language: 'fr', infinitive: 'aimer', mood: 'participle', tense: 'past', agreement: { gender: 'feminine' } }).forms.map(form => form.text)).toEqual(['aimée', 'aimées']);
  });

  it('orders preferred spelling without losing accepted alternatives', () => {
    const options = { language: 'fr', infinitive: 'absoudre', mood: 'participle', tense: 'past', agreement: { gender: 'masculine', number: 'singular' } } as const;
    const rectified = conjugate(options);
    const traditional = conjugate({ ...options, preferredOrthography: 'traditional' });
    expect(rectified.forms.map(form => form.text)).toEqual(['absout', 'absous']);
    expect(traditional.forms.map(form => form.text)).toEqual(['absous', 'absout']);
    expect(rectified.forms.map(form => form.preferred)).toEqual([true, false]);
  });

  it('keeps auxiliary narrowing equivalent to filtering the broad result', () => {
    const options = { language: 'fr', infinitive: 'croître', mood: 'indicative', tense: 'perfect', person: 1, number: 'plural' } as const;
    const broad = conjugate(options);
    for (const auxiliary of ['avoir', 'être'] as const) {
      const narrow = conjugate({ ...options, auxiliary });
      expect(narrow.forms).toEqual(broad.forms.filter(form => form.variant.auxiliary === auxiliary));
    }
    expect(broad.forms.filter(form => form.variant.auxiliary === 'avoir').every(form => form.target.gender === null)).toBe(true);
    const agreeing = conjugate({ ...options, agreement: { gender: 'feminine', number: 'plural' } });
    expect(agreeing.forms).toEqual(broad.forms.filter(form => form.target.agreement?.gender === 'feminine' && form.target.agreement.number === 'plural'));
  });

  it('uses null agreement for invariant verbal participles without suppressing agreeing derivatives', () => {
    const invariant = conjugate({ language: 'fr', infinitive: 'dormir', mood: 'participle', tense: 'past' });
    expect(invariant.forms).toHaveLength(1);
    expect(invariant.forms[0]?.text).toBe('dormi');
    expect(invariant.forms[0]?.target.agreement).toBeNull();
    expect(invariant.forms[0]?.parts[0]?.features.gender).toBeNull();
    expect(invariant.forms[0]?.parts[0]?.features.number).toBeNull();
    for (const [infinitive, participle] of [['endormir', 'endormi'], ['rendormir', 'rendormi']] as const) {
      expect(conjugate({ language: 'fr', infinitive, mood: 'participle', tense: 'past' }).forms.map(form => form.text))
        .toEqual([participle, `${participle}s`, `${participle}e`, `${participle}es`]);
    }
    expect(() => conjugate({ language: 'fr', infinitive: 'dormir', precedingDirectObject: { gender: 'feminine', number: 'plural' } })).toThrow(/invariant/u);
    expect(() => conjugate({ language: 'fr', infinitive: 'dormir', mood: 'participle', tense: 'past', agreement: { gender: 'feminine' } })).toThrow(/agreement filters/u);
  });

  it.each([
    { language: 'fr', infinitive: 'blouper' }, { language: 'nl', infinitive: 'zorpen' },
  ] as const)('does not let an empty $language lexical hint hide a regular-class assumption', options => {
    const result = conjugate({ ...options, stems: {} });
    expect(result.analysis.classificationSource).toBe('regularRule');
    expect(result.analysis.assumptions.length).toBeGreaterThan(0);
  });

  it.each([
    { language: 'fr', infinitive: 'blouper', stems: { future: 'bloupr' } },
    { language: 'nl', infinitive: 'zorpen', stems: { stem: 'zorp' } },
  ] as const)('discloses unspecified lexical defaults alongside explicit $language stem hints', options => {
    const result = conjugate(options);
    expect(result.analysis.classificationSource).toBe('explicitHint');
    expect(result.analysis.assumptions.some(assumption => /defaults to avoir|defaults to hebben/u.test(assumption))).toBe(true);
  });

  it('constrains Dutch pronoun/person compatibility', () => {
    const result = conjugate({ language: 'nl', infinitive: 'werken', mood: 'indicative', tense: 'present', pronoun: 'u' });
    expect(result.forms.map(form => form.text)).toEqual(['u werkt']);
    expect(() => conjugate(parseConjugationOptions({ language: 'nl', infinitive: 'werken', pronoun: 'u', person: 1 }))).toThrow(ConjugationError);
  });

  it('distinguishes unavailability from invalid requests and classification failures', () => {
    const unavailable = conjugate({ language: 'fr', infinitive: 'falloir', mood: 'indicative', tense: 'present', person: 1, number: 'singular' });
    expect(unavailable.status).toBe('unavailable');
    expect(unavailable.forms).toEqual([]);
    expect(unavailable.unavailableTargets[0]?.reason).toBe('impersonal');
    expect(conjugate({ language: 'fr', infinitive: 'falloir' }).status).toBe('partiallyAvailable');
    expect(() => conjugate(parseConjugationOptions({ language: 'nl', infinitive: 'werken', mood: 'subjunctive' }))).toThrow(ConjugationError);
    expect(() => conjugate({ language: 'fr', infinitive: 'glouloir' })).toThrow(/No productive French model/u);
  });

  it('makes the builder equivalent to the options object', () => {
    const built = conjugationOptions('fr', 'aller').indicative('perfect').person(1, 'plural').gender('feminine').build();
    expect(conjugate(built)).toEqual(conjugate({ language: 'fr', infinitive: 'aller', mood: 'indicative', tense: 'perfect', person: 1, number: 'plural', gender: 'feminine' }));
  });

  it('returns immutable serializable components and a normalized reflexive identity', () => {
    const result = conjugate({ language: 'fr', infinitive: '  S’AIMER ', mood: 'indicative', tense: 'present', person: 1, number: 'singular' });
    expect(result.verbId).toBe("s'aimer");
    expect(result.analysis.lemma).toBe('aimer');
    expect(Object.isFrozen(result.forms[0]?.parts[0]?.features)).toBe(true);
    expect(JSON.parse(JSON.stringify(result))).toEqual(result);
  });
});

describe('authentic component recombination', () => {
  it('re-renders elision and does not repair deliberate mismatches', () => {
    const jeAime = first({ language: 'fr', infinitive: 'aimer', mood: 'indicative', tense: 'present', person: 1, number: 'singular' });
    const nousAimons = first({ language: 'fr', infinitive: 'aimer', mood: 'indicative', tense: 'present', person: 1, number: 'plural' });
    const jeFais = first({ language: 'fr', infinitive: 'faire', mood: 'indicative', tense: 'present', person: 1, number: 'singular' });
    const nousFaisons = first({ language: 'fr', infinitive: 'faire', mood: 'indicative', tense: 'present', person: 1, number: 'plural' });
    const tuFasses = first({ language: 'fr', infinitive: 'faire', mood: 'subjunctive', tense: 'present', person: 2, number: 'singular' });
    expect(component(jeAime, 'subject').text).toBe('je');
    expect(renderParts('fr', [component(jeAime, 'subject'), component(jeFais, 'lexicalVerb')])).toBe('je fais');
    expect(renderParts('fr', [component(nousAimons, 'subject'), component(jeAime, 'lexicalVerb')])).toBe('nous aime');
    expect(renderParts('fr', [component(tuFasses, 'moodMarker'), component(tuFasses, 'subject'), component(nousFaisons, 'lexicalVerb')])).toBe('que tu faisons');
  });

  it('exposes the actual auxiliary tenses and both Dutch auxiliaries', () => {
    const fr = first({ language: 'fr', infinitive: 'aimer', mood: 'indicative', tense: 'perfect', person: 1, number: 'plural' });
    expect(component(fr, 'auxiliary').features.tense).toBe('present');
    expect(component(fr, 'lexicalVerb').features.person).toBeNull();
    const nl = first({ language: 'nl', infinitive: 'werken', mood: 'indicative', tense: 'future_perfect', person: 1, number: 'singular' });
    expect(nl.text).toBe('ik zal gewerkt hebben');
    expect(nl.parts.map(part => [part.role, part.text])).toEqual([
      ['subject', 'ik'], ['auxiliary', 'zal'], ['lexicalVerb', 'gewerkt'], ['auxiliary', 'hebben'],
    ]);
  });
});
