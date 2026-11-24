import { describe, expect, it } from 'vitest';
import { ConjugationError, parseConjugationOptions } from '../../src/index.js';
import { irregularEntries } from '../../src/languages/la/irregulars.js';
import { familyCount, latinLexicon } from '../../src/languages/la/lexicon.js';
import { latinPack } from '../../src/languages/la/pack.js';
import { lexiconVerification } from '../../src/languages/la/sources.js';
import type { VerbAnalysis } from '../../src/types.js';

const analysis = (infinitive: string, extra: Record<string, unknown> = {}): VerbAnalysis =>
  latinPack.engine(parseConjugationOptions({ language: 'la', infinitive, ...extra } as never)).analysis;
const ids = (a: VerbAnalysis): string[] => a.steps!.map(s => s.rule);

describe('Latin classification', () => {
  it('finds lexicon verbs without macrons', () => {
    const a = analysis('monere');
    expect(a).toMatchObject({ lemma: 'monēre', classification: 'second', classificationSource: 'lexicon', assumptions: [] });
    expect(ids(a)).toEqual(['la.classify.lexicon']);
    expect(analysis('tegere').lemma).toBe('tegere');
  });

  it('records every assumption for an invented verb', () => {
    expect(ids(analysis('tregere'))).toEqual(['la.classify.conjugation', 'la.classify.assume-third',
      'la.classify.assume-consonant-stem', 'la.classify.assume-quantity', 'la.classify.assume-passive', 'la.classify.default-sigmatic']);
    const second = analysis('tregere', { stems: { present: 'tregeō' } });
    expect(second.classification).toBe('second');
    expect(ids(second)).not.toContain('la.classify.assume-third');
    expect(ids(analysis('blorpāre'))).toEqual(['la.classify.conjugation', 'la.classify.assume-quantity', 'la.classify.assume-passive', 'la.classify.default-parts']);
    expect(ids(analysis('flēscere'))).toContain('la.classify.default-sco');
    expect(ids(analysis('frolere'))).toContain('la.classify.default-u');
  });

  it('classifies deponents and semi-deponents', () => {
    expect(analysis('hortari')).toMatchObject({ lemma: 'hortārī', classification: 'first-deponent' });
    expect(analysis('blorpari').classification).toBe('first-deponent');
    expect(ids(analysis('trapī'))).toContain('la.classify.assume-consonant-stem');
    expect(analysis('audēre').classification).toBe('second-semi-deponent');
    expect(analysis('patī').classification).toBe('thirdIo-deponent');
  });

  it('returns both paradigms of a macron-less homograph', () => {
    const a = analysis('parere');
    expect(a.alternatives).toHaveLength(1);
    expect([a.lemma, a.alternatives![0]!.lemma].sort()).toEqual(['parere', 'pārēre']);
    expect(analysis('pārēre').alternatives).toBeUndefined();
    expect(analysis('parere', { stems: { present: 'pariō' } }).alternatives).toBeUndefined();
    expect(analysis('occidere').alternatives).toHaveLength(1);
  });

  it('resolves compounds through their families only', () => {
    const accipere = analysis('accipere');
    expect(accipere.steps!.find(s => s.rule === 'la.classify.compound')!.params).toMatchObject({ prefix: 'ac', base: 'capiō' });
    expect(analysis('conficere').lemma).toBe('cōnficere');
    expect(ids(analysis('recapere'))).not.toContain('la.classify.compound');
    expect(analysis('ambire')).toMatchObject({ classification: 'fourth' });
    expect(ids(analysis('ambire'))).not.toContain('la.classify.compound');
    expect(analysis('abesse').classification).toBe('irregular');
  });

  it('rejects a passive infinitive and an impossible infinitive', () => {
    expect(() => analysis('amārī')).toThrow(/voice: 'passive'/u);
    expect(() => analysis('blesse')).toThrow(ConjugationError);
    expect(() => analysis('trānsesse')).toThrow(ConjugationError);
  });

  it('keeps the lexicon verified', () => {
    let entries = 0;
    for (const [key, list] of Object.entries(latinLexicon)) {
      for (const entry of list) {
        entries += 1;
        expect(lexiconVerification[entry.present ?? entry.infinitive], key).toBeDefined();
      }
    }
    // Pinned after transcription: 65 irregular, defective and impersonal entries (with the listed compounds of sum, ferō
    // and stō), 365 principal-part entries from A&G §§172, 190–192, 209–212 and Lewis & Short (the family-only bases such
    // as -cutiō are not counted), and 27 families with a weakened form or a prefix list of their own.
    expect({ entries, irregular: irregularEntries.length, families: familyCount }).toEqual({ entries: 430, irregular: 65, families: 27 });
  });
});
