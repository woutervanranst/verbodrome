/**
 * The whole-pack review's findings, one expectation each. Expected forms are independently known: the DWDS grammar
 * line or inflection table of the lemma (https://www.dwds.de/wb/<lemma>, /lemma/flexion/<lemma>) and Duden's entry
 * where it is named.
 */
import { describe, expect, it } from 'vitest';
import { conjugate, explain } from '../../src/index.js';
import type { ConjugatedForm, GrammaticalNumber, Person } from '../../src/types.js';

type Query = Record<string, unknown>;
const result = (lemma: string, mood: string, tense?: string, person?: Person, number?: GrammaticalNumber, extra: Query = {}) =>
  conjugate({
    language: 'de', infinitive: lemma, mood, ...(tense === undefined ? {} : { tense }),
    ...(person === undefined ? {} : { person, number }), ...extra,
  } as never);
const texts = (...args: Parameters<typeof result>) => result(...args).forms.map(f => f.text);
const ich = (lemma: string, tense: string, extra: Query = {}) => texts(lemma, 'indicative', tense, 1, 'singular', extra);
const er = (lemma: string, tense: string, extra: Query = {}) => texts(lemma, 'indicative', tense, 3, 'singular', extra);
const participle = (lemma: string, extra: Query = {}) => texts(lemma, 'participle', 'past', undefined, undefined, extra);
const imperative = (lemma: string) => texts(lemma, 'imperative', 'present', 2, 'singular');
const analysis = (lemma: string, extra: Query = {}) => result(lemma, 'infinitive', 'present', undefined, undefined, extra).analysis;
const ruleIds = (lemma: string, extra: Query = {}) => (analysis(lemma, extra).steps ?? []).map(s => s.rule);
const explained = (form: ConjugatedForm, locale: 'en' | 'nl') => explain('de', form, locale).sections.flatMap(s => s.steps.map(step => step.text));

describe('German Konjunktiv II and usage labels (an explicit mark in either dictionary decides)', () => {
  it('gives laden the du-imperative lade only: the bare lad is colloquial (DWDS: ugs.)', () => {
    expect(imperative('laden')).toEqual(['lade']);
    expect(imperative('einladen')).toEqual(['lade ein']);
  });

  it('says only which dictionary prints a form', () => {
    for (const locale of ['en', 'nl'] as const) {
      const kaemst = result('kommen', 'subjunctive', 'past', 2, 'singular').forms.find(f => f.text === 'du kämst')!;
      const steps = explained(kaemst, locale);
      expect(steps.join(' ')).not.toMatch(/less common|minder gewone/u);
      expect(steps).toContain(locale === 'en' ? 'Duden prints kämst; DWDS does not.' : 'Duden geeft kämst; DWDS niet.');
    }
  });
});

describe('German explanation steps that were false', () => {
  it('reads bedauern, behindern, verhindern as prefix + verb, not as nouns', () => {
    for (const lemma of ['bedauern', 'behindern', 'verhindern']) {
      expect(ruleIds(lemma), lemma).not.toContain('de.classify.denominal');
      expect(ruleIds(lemma), lemma).toContain('de.classify.inseparable');
    }
    expect(participle('bedauern')).toEqual(['bedauert']);
  });

  it('does not split a loan in -ieren into a prefix and a remainder', () => {
    for (const lemma of ['generieren', 'verifizieren', 'zertifizieren', 'eruieren', 'gestikulieren']) {
      const ids = ruleIds(lemma);
      expect(ids, lemma).toContain('de.classify.ieren');
      expect(ids.filter(id => id.includes('inseparable')), lemma).toEqual([]);
    }
    expect(participle('generieren')).toEqual(['generiert']);
  });

  it('records a prefix of an unknown remainder as an assumption, which the stress option undoes', () => {
    expect(ruleIds('beamen')).toContain('de.classify.assume-inseparable');
    expect(ruleIds('beamen')).not.toContain('de.classify.inseparable');
    expect(participle('beamen', { stems: { unstressedFirstSyllable: false } })).toEqual(['gebeamt']);
  });

  it('names the real guess for an unlisted compound: that it is not split', () => {
    expect(ruleIds('heiraten')[0]).toBe('de.classify.assume-unsplit');
    expect(analysis('heiraten').steps!.find(s => s.rule === 'de.classify.assume-unsplit')!.params).toEqual({ root: 'raten' });
    expect(ich('heiraten', 'perfect')).toEqual(['ich habe geheiratet']);
  });

  it('records the haben assumption for a verb formed from a noun', () => {
    expect(ruleIds('beantragen')).toEqual(expect.arrayContaining(['de.classify.default-haben', 'de.classify.denominal']));
    expect(analysis('beantragen').assumptions).toHaveLength(1);
  });
});

export { er };
