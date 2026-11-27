import { describe, expect, it } from 'vitest';
import * as lexicon from '../../src/languages/es/lexicon.js';
import { spanishCitations } from '../../src/languages/es/sources.js';
import { lexiconVerification } from '../../src/languages/es/verification.js';

/** Every lemma the lexicon names: entries, two-paradigm lemmas, the alternation and stress lists, listed derivatives. */
const lemmas = new Set([
  ...Object.keys(lexicon.entries), ...Object.keys(lexicon.twoParadigms), ...Object.keys(lexicon.alternations),
  ...lexicon.hiatusVerbs, ...lexicon.bothStressVerbs, ...Object.keys(lexicon.listedDerivatives),
]);

describe('Spanish lexicon verification record', () => {
  it('has exactly one line for every lemma of the lexicon', () => {
    expect([...lemmas].filter(lemma => !Object.hasOwn(lexiconVerification, lemma))).toEqual([]);
    expect(Object.keys(lexiconVerification).filter(lemma => !lemmas.has(lemma))).toEqual([]);
  });

  it('points every lemma at its DLE page and records which pages were read', () => {
    for (const [lemma, record] of Object.entries(lexiconVerification)) {
      expect(record.dle).toBe(`https://dle.rae.es/${encodeURIComponent(lemma)}`);
      // No RAE page could be opened (HTTP 403, no browser): nothing may claim to be checked against the RAE.
      expect(record.raeRead).toBe(false);
      for (const page of record.secondary) expect(page.url).toMatch(/^https:\/\//u);
    }
    expect(lexiconVerification.raer!.secondary.map(page => page.url)).toEqual(['https://en.wiktionary.org/wiki/raer']);
    expect(lexiconVerification.tener!.secondary).toEqual([]);
  });

  it('marks every citation of an RAE work as not yet read', () => {
    const citations = Object.values(spanishCitations).flatMap(cited => Array.isArray(cited) ? cited : [cited]);
    for (const citation of citations.filter(c => ['ngle', 'orto', 'dle', 'dpd', 'gtg'].includes(c.work))) {
      expect(citation.locator).toMatch(/\(unverified: not yet read\)$/u);
    }
  });
});
