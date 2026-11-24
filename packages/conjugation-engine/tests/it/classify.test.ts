import { describe, expect, it } from 'vitest';
import type { DerivationStep } from '../../src/core/derivation.js';
import { parseConjugationOptions } from '../../src/index.js';
import { resolveFamily } from '../../src/languages/it/families.js';
import { italianLexicon } from '../../src/languages/it/lexicon.js';
import { italianPack } from '../../src/languages/it/pack.js';
import { lexiconVerification } from '../../src/languages/it/sources.js';
import type { VerbAnalysis } from '../../src/types.js';

/** The analysis of a verb: classification only, so it does not depend on the later stages. */
function analysis(infinitive: string, options: Record<string, unknown> = {}): VerbAnalysis {
  return italianPack.engine(parseConjugationOptions({ language: 'it', infinitive, mood: 'infinitive', ...options } as never)).analysis;
}
const ruleIds = (steps: readonly DerivationStep[] | undefined) => (steps ?? []).map(s => s.rule);

describe('Italian classification', () => {
  it('classifies by ending with assumptions', () => {
    const a = analysis('blorpare');
    expect(a.classification).toBe('are');
    expect(ruleIds(a.steps)).toEqual(['it.classify.conjugation', 'it.classify.assume-regular', 'it.classify.assume-avere']);
    expect(ruleIds(analysis('tronire').steps)).toEqual(['it.classify.conjugation', 'it.classify.assume-regular', 'it.classify.assume-isc', 'it.classify.assume-avere']);
    expect(ruleIds(analysis('trebiare').steps)).toContain('it.classify.assume-unstressed-i');
    expect(ruleIds(analysis('sbonciare').steps)).not.toContain('it.classify.assume-unstressed-i'); // graphic i
    expect(ruleIds(analysis('frogliare').steps)).not.toContain('it.classify.assume-unstressed-i');
  });

  it('reads the lexicon and side lists', () => {
    expect(analysis('venire')).toMatchObject({ classification: 'ire', classificationSource: 'lexicon', auxiliaries: ['essere'] });
    expect(analysis('essere').classification).toBe('irregular');
    expect(analysis('dormire').classification).toBe('ire');
    expect(analysis('finire').classification).toBe('ire-isc');
    expect(analysis('correre').auxiliaries).toEqual(['essere', 'avere']);
    expect(ruleIds(analysis('inviare').steps)).toContain('it.classify.stressed-i');
    expect(analysis('inviare').steps!.find(s => s.rule === 'it.classify.stressed-i')!.after).toBe('invio');
    expect(analysis('smentire').classification).toBe('ire-isc');
    expect(analysis('arrivare').auxiliaries).toEqual(['essere']);
    expect(analysis('fare')).toMatchObject({ classification: 'contracted', auxiliaries: ['avere'] });
    expect(ruleIds(analysis('fare').steps)).toEqual(['it.classify.lexicon', 'it.classify.contracted', 'it.classify.auxiliary']);
  });

  it('returns two paradigms for isc/plain verbs', () => {
    const a = analysis('mentire');
    expect(a.alternatives).toHaveLength(1);
    expect([a.pattern, a.alternatives![0]!.pattern]).toEqual(['plain', 'isc']);
    expect([a.classification, a.alternatives![0]!.classification]).toEqual(['ire', 'ire-isc']);
    expect(analysis('mentire', { classHint: 'plain' }).alternatives).toBeUndefined();
    expect(analysis('mentire', { classHint: 'isc' }).classification).toBe('ire-isc');
    expect(analysis('assorbire').pattern).toBe('isc');
    expect(analysis('apparire').alternatives).toBeUndefined();
  });

  it('handles reflexives', () => {
    const a = analysis('lavarsi');
    expect(a).toMatchObject({ lemma: 'lavarsi', reflexive: true, auxiliaries: ['essere'] });
    expect(ruleIds(a.steps)).toEqual(expect.arrayContaining(['it.classify.reflexive', 'it.classify.reflexive-essere']));
    expect(ruleIds(a.steps)).not.toContain('it.classify.assume-avere');
    expect(analysis('lavare', { reflexive: true }).reflexive).toBe(true);
    expect(analysis('porsi').steps!.find(s => s.rule === 'it.classify.reflexive')!.after).toBe('porre');
    expect(analysis('farsi').steps!.find(s => s.rule === 'it.classify.reflexive')!.after).toBe('fare');
    expect(analysis('accorgersi')).toMatchObject({ classificationSource: 'lexicon', auxiliaries: ['essere'] });
  });

  it('inherits through families safely', () => {
    expect(ruleIds(analysis('comporre').steps)).toEqual(['it.classify.family', 'it.classify.contracted', 'it.classify.assume-avere']);
    expect(ruleIds(analysis('sbradurre').steps)).toEqual(expect.arrayContaining(['it.classify.contracted', 'it.classify.assume-family']));
    expect(analysis('sbradurre').assumptions).toEqual(['it.classify.assume-family', 'it.classify.assume-avere']);
    expect(ruleIds(analysis('stramettere').steps)).toEqual(expect.arrayContaining(['it.classify.family', 'it.classify.assume-avere']));
    expect(ruleIds(analysis('blomettere').steps)).toContain('it.classify.assume-regular');
    expect(ruleIds(analysis('restare').steps)).toContain('it.classify.no-inherit');
    expect(analysis('restare').auxiliaries).toEqual(['essere']);
    expect(analysis('percorrere').auxiliaries).toEqual(['avere']); // auxiliary never inherited from correre
    expect(analysis('accorrere').auxiliaries).toEqual(['essere']);
  });

  it('finds the base of a derived verb', () => {
    expect(resolveFamily('produrre')).toMatchObject({ prefix: 'pro', base: 'durre', assumed: false, entry: { long: 'produc', past: ['produssi'], participle: ['prodotto'] } });
    expect(resolveFamily('attendere')).toMatchObject({ prefix: 'at', base: 'tendere', entry: { past: ['attesi'], participle: ['atteso'] } });
    expect(resolveFamily('sopravvivere')).toMatchObject({ prefix: 'soprav', base: 'vivere', entry: { participle: ['sopravvissuto'] } });
    expect(resolveFamily('riscoprire')).toMatchObject({ prefix: 'ri', base: 'scoprire', entry: { participle: ['riscoperto'] } });
    expect(resolveFamily('ottenere')).toMatchObject({ base: 'tenere', entry: { future: ['otterr'] } });
    expect(resolveFamily('rifare')).toMatchObject({ prefix: 'ri', base: 'fare', entry: { long: 'rifac', participle: ['rifatto'] } });
    expect(resolveFamily('rifare')!.entry.auxiliaries).toBeUndefined();
    expect(resolveFamily('predire')!.entry.cells).not.toHaveProperty(['imperative.present.2.singular']);
    for (const lookalike of ['restare', 'mandare', 'blomettere', 'prestare', 'parlare']) expect(resolveFamily(lookalike), lookalike).toBeNull();
  });

  it('applies hints', () => {
    expect(analysis('tronire', { classHint: 'plain' }).classification).toBe('ire');
    expect(analysis('tronire', { classHint: 'plain' }).assumptions).not.toContain('it.classify.assume-isc');
    expect(analysis('correre', { auxiliary: 'avere' }).auxiliaries).toEqual(['avere']);
    expect(analysis('blorpare', { auxiliary: 'essere' })).toMatchObject({ auxiliaries: ['essere'], assumptions: ['it.classify.assume-regular'] });
    expect(analysis('trebiare', { stems: { stressedI: true } }).assumptions).not.toContain('it.classify.assume-unstressed-i');
    expect(() => analysis('venire', { auxiliary: 'avere' })).toThrow(expect.objectContaining({ code: 'INVALID_HINT' }));
    expect(() => analysis('parlare', { classHint: 'isc' })).toThrow(expect.objectContaining({ code: 'INVALID_HINT' }));
    expect(() => analysis('finire', { classHint: 'plain' })).toThrow(expect.objectContaining({ code: 'INVALID_HINT' }));
    expect(() => analysis('lavarsi', { auxiliary: 'avere' })).toThrow(expect.objectContaining({ code: 'INVALID_HINT' }));
  });

  it('rejects what it cannot model and tolerates dictionary accents', () => {
    for (const bad of ['andarsene', 'farcela', 'blorrre', 'parlar']) expect(() => analysis(bad), bad).toThrow(expect.objectContaining({ code: 'INVALID_INFINITIVE' }));
    expect(analysis('créscere').lemma).toBe('crescere');
    expect(analysis('Parlàre').lemma).toBe('parlare');
    expect(analysis('PARLARE').classification).toBe('are');
    expect(analysis('invïare').steps).toEqual(analysis('inviare').steps);
  });

  it('verifies every lexicon lemma', () => {
    for (const lemma of Object.keys(italianLexicon)) expect(lexiconVerification[lemma], lemma).toBeDefined();
    expect(Object.values(lexiconVerification).filter(record => record.status !== 'vocabolario').map(record => record.url))
      .toEqual(['https://www.treccani.it/vocabolario/riavviare/']);
  });
});
