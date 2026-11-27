import { describe, expect, it } from 'vitest';
import { conjugate, parseConjugationOptions } from '../../src/index.js';
import { englishLexemeOf, needsStress, prefixParse, vowelGroups } from '../../src/languages/en/classify.js';
import {
  consonantVariants, doublesUnstressed, finalStress, irregulars, keepsE, keepsEBritish, lNotDoubled, mostlyImperative, noDoubling,
  noInherit, nonFinalStress, notModal, plainS, takesEs,
} from '../../src/languages/en/lexicon.js';
import { derivativesChecked, lexiconChecked, secondaryOnly, sideListsChecked } from '../../src/languages/en/sources.js';

const analysis = (q: Record<string, unknown>) => conjugate(parseConjugationOptions({ language: 'en', mood: 'participle', tense: 'past', ...q })).analysis;
const rules = (q: Record<string, unknown>) => analysis(q).steps!.map(s => s.rule);

describe('English classification', () => {
  it('reads an irregular verb from the lexicon', () => {
    expect(analysis({ infinitive: 'swim' })).toMatchObject({ classification: 'irregular', classificationSource: 'lexicon', auxiliaries: ['have'] });
    expect(analysis({ infinitive: 'swim' }).steps![0]).toMatchObject({ rule: 'en.classify.lexicon', params: { past: 'swam', participle: 'swum' } });
    expect(analysis({ infinitive: 'be' }).classification).toBe('suppletive');
    expect(rules({ infinitive: 'be' })).toEqual(['en.classify.suppletive', 'en.classify.keeps-e']);
  });

  it('returns both paradigms of a homograph and lets a hint choose', () => {
    const hang = analysis({ infinitive: 'hang' });
    expect(hang.alternatives).toHaveLength(1);
    expect(hang).toMatchObject({ pattern: 'hung', condition: 'hang up, be suspended', classification: 'irregular' });
    expect(hang.alternatives![0]).toMatchObject({ pattern: 'hanged', condition: 'kill by hanging', classification: 'regular' });
    expect(rules({ infinitive: 'hang', classHint: 'regular' })).toEqual(['en.classify.homograph', 'en.classify.hint-regular']);
    expect(rules({ infinitive: 'hang', classHint: 'irregular' })).toEqual(['en.classify.homograph', 'en.classify.lexicon']);
    expect(() => analysis({ infinitive: 'go', classHint: 'regular' })).toThrow(expect.objectContaining({ code: 'INVALID_HINT' }));
    expect(() => analysis({ infinitive: 'walk', classHint: 'irregular' })).toThrow(expect.objectContaining({ code: 'INVALID_HINT' }));
  });

  it('narrows a verb with regular and listed forms to the class the hint names', () => {
    const learn = (classHint: string) => conjugate(parseConjugationOptions({ language: 'en', infinitive: 'learn', classHint }));
    expect(learn('regular').analysis.steps!.map(s => s.rule)).toEqual(['en.classify.hint-regular']);
    expect(learn('irregular').analysis.steps![0]).toMatchObject({ rule: 'en.classify.lexicon', params: { past: 'learnt', participle: 'learnt' } });
    expect(rules({ infinitive: 'walk', classHint: 'regular' })).toEqual(['en.classify.hint-regular']);
  });

  it('inherits through the closed prefix list only', () => {
    expect(analysis({ infinitive: 'outswim' }).steps![0]).toMatchObject({ rule: 'en.classify.prefixed', params: { prefix: 'out', base: 'swim' } });
    expect(rules({ infinitive: 'misunderstand' })).toContain('en.classify.prefixed');
    expect(analysis({ infinitive: 'misunderstand' }).steps![0]!.params).toEqual({ prefix: 'mis', base: 'understand' });
    expect(englishLexemeOf('misunderstand').past).toEqual([{ form: 'misunderstood' }]);
    expect(analysis({ infinitive: 'underlie' }).alternatives).toBeUndefined(); // only lay / lain
    expect(englishLexemeOf('underlie')).toMatchObject({ past: [{ form: 'underlay' }], participle: [{ form: 'underlain' }] });
    expect(englishLexemeOf('outbid')).toMatchObject({ past: [{ form: 'outbid' }], participle: [{ form: 'outbid' }] }); // not outbade
    expect(englishLexemeOf('relearn')).toMatchObject({ classId: 'regular', past: [] }); // learnt is British: not inherited
    expect(rules({ infinitive: 'behave' })).toEqual(['en.classify.no-inherit']);
    expect(analysis({ infinitive: 'behave' }).steps![0]!.params).toEqual({ prefix: 'be', base: 'have', source: 'both' });
    expect(rules({ infinitive: 'relay' })).toEqual(['en.classify.no-inherit']);
    expect(rules({ infinitive: 'belay' })).toEqual(['en.classify.no-inherit']);
    expect(rules({ infinitive: 'forecast' })).toEqual(['en.classify.lexicon']); // listed, has forecasted
    expect(rules({ infinitive: 'reblit' })).toEqual(['en.classify.assume-regular', 'en.classify.assume-final-stress']);
  });

  it('decides stress only when doubling depends on it', () => {
    expect(rules({ infinitive: 'walk' })).toEqual(['en.classify.assume-regular']);
    expect(rules({ infinitive: 'zamic' })).toEqual(['en.classify.assume-regular']);
    expect(rules({ infinitive: 'prefer' })).toEqual(['en.classify.listed-regular', 'en.classify.stress-listed']);
    expect(rules({ infinitive: 'enter' })).toEqual(['en.classify.listed-regular', 'en.classify.stress-listed']);
    expect(rules({ infinitive: 'trimbit' })).toEqual(['en.classify.assume-regular', 'en.classify.assume-nonfinal-stress']);
    expect(rules({ infinitive: 'fuel' })).toContain('en.classify.assume-nonfinal-stress');
    expect(rules({ infinitive: 'trimbit', stress: 'final' })).toEqual(['en.classify.assume-regular', 'en.classify.stress-hint']);
    expect(rules({ infinitive: 'reblit', stress: 'nonFinal' })).toEqual(['en.classify.assume-regular', 'en.classify.stress-hint']);
    expect(rules({ infinitive: 'begin' })).toEqual(['en.classify.lexicon', 'en.classify.stress-listed']);
    expect(rules({ infinitive: 'kidnap' })).toEqual(['en.classify.listed-regular', 'en.classify.doubles-unstressed']);
    expect(analysis({ infinitive: 'reblit' }).assumptions).toEqual([
      'Assuming reblit is regular (-ed): it is not in the list of irregular verbs.',
      'Assuming the last syllable of reblit is stressed: it looks like the prefix re- plus a one-syllable root.',
    ]);
  });

  it('pins the stress heuristic on the verified evidence verbs', () => {
    // finalStress decided by list or parse; design §8b evidence
    const final = ['admit', 'compel', 'control', 'excel', 'occur', 'patrol', 'prefer', 'acquit', 'commit', 'regret'];
    const nonFinal = ['visit', 'benefit', 'focus', 'target', 'combat', 'enter', 'conquer', 'profit', 'interpret', 'offer', 'develop', 'travel', 'cancel', 'label', 'model', 'equal'];
    for (const v of final) expect(englishLexemeOf(v).finalStress, v).toBe(true);
    for (const v of nonFinal) expect(englishLexemeOf(v).finalStress, v).toBe(false);
    for (const v of finalStress) expect(englishLexemeOf(v).finalStress, v).toBe(true);
    for (const v of nonFinalStress) expect(englishLexemeOf(v).finalStress, v).toBe(false);
  });

  it('reads syllables and prefixes from the spelling', () => {
    expect(['walk', 'quit', 'squip', 'dial', 'fuel', 'equal', 'plory', 'travel', 'develop'].map(vowelGroups)).toEqual([1, 1, 1, 2, 2, 2, 2, 2, 3]);
    expect(['reblit', 'prefer', 'compel', 'excel', 'control', 'proffer', 'reckon', 'exit', 'develop'].map(prefixParse))
      .toEqual(['re', 'pre', 'com', 'ex', 'con', null, null, null, null]);
    expect(['travel', 'fuel', 'dial', 'stop', 'quiz', 'zamic', 'walk', 'play', 'fix', 'equal'].map(needsStress))
      .toEqual([true, true, true, true, true, false, false, false, false, true]);
  });

  it('normalises input and rejects what it cannot conjugate', () => {
    expect(analysis({ infinitive: 'To Walk' }).lemma).toBe('walk');
    for (const bad of ['give up', 'must', 'ought']) expect(() => analysis({ infinitive: bad })).toThrow(expect.objectContaining({ code: 'INVALID_INFINITIVE' }));
    expect(analysis({ infinitive: 'glorp', stems: { past: 'glarp', pastParticiple: 'glorpen' } })).toMatchObject({ classification: 'irregular', classificationSource: 'explicitHint' });
    expect(rules({ infinitive: 'glorp', stems: { past: 'glarp', pastParticiple: 'glorpen' } })).toEqual(['en.classify.hint-irregular']);
    expect(() => analysis({ infinitive: 'swim', stems: { past: 'swimmed', pastParticiple: 'swimmed' } })).toThrow(expect.objectContaining({ code: 'INVALID_HINT' }));
    expect(() => analysis({ infinitive: 'outswim', stems: { past: 'outswimmed', pastParticiple: 'outswimmed' } })).toThrow(expect.objectContaining({ code: 'INVALID_HINT' }));
  });

  it('records where every lexicon entry and side-list verb was checked, verb by verb', () => {
    expect(Object.keys(irregulars)).toHaveLength(186);
    expect(Object.keys(irregulars).filter(lemma => irregulars[lemma]!.paradigms.length > 1)).toEqual(['hang', 'lie', 'shine']);
    // The record is literal: every lexicon key has one, and it names no verb the lexicon does not have.
    expect(Object.keys(lexiconChecked).sort()).toEqual(Object.keys(irregulars).sort());
    const sideListed = [
      ...finalStress, ...nonFinalStress, ...Object.keys(noInherit), ...doublesUnstressed, ...Object.keys(consonantVariants), ...noDoubling,
      ...keepsE, ...keepsEBritish, ...plainS, ...takesEs, ...lNotDoubled, ...notModal, ...mostlyImperative,
    ].filter(lemma => !Object.hasOwn(irregulars, lemma));
    for (const lemma of sideListed) expect(sideListsChecked[lemma], lemma).toBeDefined();
    const oneSource = [...Object.entries(lexiconChecked), ...Object.entries(sideListsChecked), ...Object.entries(derivativesChecked)]
      .filter(([, check]) => check !== 'ldoce+ahd').map(([lemma]) => lemma);
    expect(Object.keys(secondaryOnly).sort()).toEqual([...new Set(oneSource)].sort());
  });
});
