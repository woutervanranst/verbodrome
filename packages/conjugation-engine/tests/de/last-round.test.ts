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

describe('German derivatives of two-paradigm roots', () => {
  it('take only the paradigms DWDS gives the derivative itself', () => {
    expect([...er('abschaffen', 'past'), ...participle('abschaffen')]).toEqual(['er schaffte ab', 'abgeschafft']);
    expect([...er('anschaffen', 'past'), ...participle('anschaffen')]).toEqual(['er schaffte an', 'angeschafft']);
    expect([...er('erschaffen', 'past'), ...participle('erschaffen')]).toEqual(['er erschuf', 'erschaffen']);
    expect([...er('mitschleifen', 'past'), ...ich('mitschleifen', 'perfect')]).toEqual(['er schleifte mit', 'ich habe mitgeschleift']);
    expect([...er('entwenden', 'past'), ...participle('entwenden')]).toEqual(['er entwendete', 'entwendet']);
    expect(ich('aufwachsen', 'perfect')).toEqual(['ich bin aufgewachsen']);
    expect(participle('fortbewegen')).toEqual(['fortbewegt']);
    expect(participle('aufwiegen')).toEqual(['aufgewogen']);
    expect(participle('aufhängen')[0]).toBe('aufgehängt');
    expect(result('verwenden', 'participle', 'past').forms.map(f => [f.text, f.variant.pattern, f.variant.condition]))
      .toEqual([['verwandt', 'mixed', null], ['verwendet', 'weak', null]]);
  });

  it('never carry the root glosses', () => {
    for (const lemma of ['abschaffen', 'verwenden', 'anwenden', 'nachwachsen', 'aufhängen', 'mitschleifen', 'absenden', 'zurückschaffen']) {
      const conditions = result(lemma, 'indicative', 'perfect', 1, 'singular').forms.map(f => f.variant.condition ?? '');
      expect(conditions.join(' '), lemma).not.toMatch(/create|manage|wax|grow|turn over|broadcast|send|hang|drag|sharpen|induce/u);
    }
  });

  it('give an unrecorded derivative both paradigms by pattern, as an assumption', () => {
    const forms = result('zurückschaffen', 'indicative', 'past', 3, 'singular').forms;
    expect(forms.map(f => [f.text, f.variant.pattern])).toEqual([['er schuf zurück', 'strong'], ['er schaffte zurück', 'weak']]);
    expect(ruleIds('zurückschaffen')).toContain('de.classify.assume-root-paradigm');
    expect(result('zurückschaffen', 'indicative', 'past', 3, 'singular', { classHint: 'weak' }).forms.map(f => f.text)).toEqual(['er schaffte zurück']);
    expect(ruleIds('abschaffen')).not.toContain('de.classify.assume-root-paradigm');
  });
});

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

describe('German labels the review found too narrow', () => {
  const conditions = (lemma: string, tense: string) => result(lemma, 'indicative', tense, 1, 'singular').forms.map(f => [f.text, f.variant.condition]);
  it('labels umfahren, übernehmen, senden, wenden and aufstehen as the dictionaries do', () => {
    expect(conditions('umfahren', 'present')[0]).toEqual(['ich fahre um', 'knock down; take a detour']);
    expect(conditions('übernehmen', 'present')[1]).toEqual(['ich nehme über', 'sling over the shoulder (colloquial); take on water or cargo (nautical)']);
    expect(conditions('senden', 'past')).toEqual([['ich sandte', 'send'], ['ich sendete', 'broadcast; also send (less often)']]);
    expect(conditions('wenden', 'past')[1]![1]).toMatch(/also turn \(oneself\)/u);
    expect(conditions('aufstehen', 'perfect')[1]).toEqual(['ich habe aufgestanden', 'stand open (a door, a window; colloquial)']);
  });

  it('derives the plural Präteritum of werden from wurd- (only wurde, wurdest and ward are listed)', () => {
    const forms = result('werden', 'indicative', 'past').forms;
    expect(forms.map(f => f.text)).toEqual(['ich wurde', 'ich ward', 'du wurdest', 'du wardst', 'er wurde', 'er ward', 'wir wurden', 'ihr wurdet', 'sie wurden']);
    const rules = explain('de', forms.find(f => f.text === 'ihr wurdet')!, 'en').sections.flatMap(section => section.steps.map(step => step.rule));
    expect(rules).toEqual(expect.arrayContaining(['de.stem.preterite', 'de.end.preterite-strong', 'de.orth.schwa-dental']));
    expect(rules).not.toContain('de.stem.lexical-cell');
  });
});

export { er };
