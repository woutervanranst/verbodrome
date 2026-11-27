/**
 * What the French pack claims about its sources (fix wave I5, I6, I8, minors): `verified` only where the Académie table
 * agrees, unavailable targets that never cite a table printing the form, and steps that say only what happened.
 */
import { describe, expect, it } from 'vitest';
import { engine } from '../../src/default-engine.js';
import { frenchFamilies } from '../../src/languages/fr/families.js';
import { frenchCitations } from '../../src/languages/fr/sources.js';

type Query = Readonly<Record<string, unknown>>;
const conjugate = (infinitive: string, query: Query) => engine.conjugate({ language: 'fr', infinitive, ...query });
const sources = (infinitive: string, query: Query) => [...new Set(conjugate(infinitive, query).unavailableTargets.map(item => item.source))];

describe('French verification flags (I6)', () => {
  it('marks verified only the 70 families whose Académie table agrees in every printed cell and auxiliary', () => {
    const unverified = frenchFamilies.filter(family => !family.flags.verified).map(family => family.id).sort();
    expect(unverified).toEqual([
      'absoudre', 'asseoir', 'bouillir', 'braire', 'bruire', 'choir', 'clore', 'déchoir', 'échoir', 'éclore', 'enclore',
      'faillir', 'férir', 'frire', 'gésir', 'issir', 'messeoir', 'ouïr', 'paître', 'prévaloir', 'rassir', 'seoir',
      'surseoir', 'traire', 'vouloir',
    ].sort());
    expect(frenchFamilies.length - unverified.length).toBe(70);
  });
});

describe('French unavailable targets cite what supports them (I8)', () => {
  it('cites the Académie article that states the restriction, not the table that prints the form', () => {
    expect(sources('absoudre', { mood: 'indicative', tense: 'simple_past', person: 1, number: 'singular' }))
      .toEqual(['https://www.dictionnaire-academie.fr/article/A9A0175']);
    expect(sources('gésir', { mood: 'imperative', tense: 'present' })).toEqual(['https://www.dictionnaire-academie.fr/article/A9G0655']);
    expect(sources('paître', { mood: 'indicative', tense: 'perfect', person: 1, number: 'singular' }))
      .toEqual(['https://www.dictionnaire-academie.fr/article/A9P0092']);
  });

  it('cites the agreeing table of a verified family', () => {
    expect(sources('falloir', { mood: 'imperative', tense: 'present' })).toEqual(['https://www.dictionnaire-academie.fr/conjuguer/A9F0145']);
  });
});

describe('French pronominal past imperative (I5)', () => {
  it('stays unavailable, says the Académie prints it, and cites no page that is silent on it', () => {
    const result = conjugate('se laver', { mood: 'imperative', tense: 'past' });
    expect(result.forms).toEqual([]);
    expect(result.unavailableTargets[0]!.explanation).toContain('sois-toi assis');
    const cited = ([] as { url?: string }[]).concat(frenchCitations['fr.avail.pronominal-imperative-past']);
    expect(cited.map(citation => citation.url)).not.toContain(expect.stringContaining('oqlf'));
  });
});

describe('French steps say only what happened (minors)', () => {
  const texts = (subject: Parameters<typeof engine.explain>[1]) =>
    engine.explain('fr', subject, 'en').sections.flatMap(section => section.steps.map(step => step.text));

  it('names the infinitive without se in the reflexive step', () => {
    const { analysis } = conjugate('se laver', { mood: 'indicative', tense: 'present', person: 1, number: 'singular' });
    expect(texts(analysis)).toContain('The se in front of laver marks a pronominal verb: se laver is conjugated with a reflexive pronoun.');
  });

  it('states no auxiliary for a verb without compound tenses (gésir)', () => {
    const { analysis } = conjugate('gésir', { mood: 'indicative', tense: 'present', person: 3, number: 'singular', gender: 'masculine' });
    expect(texts(analysis).filter(text => /compound tenses|avoir/u.test(text))).toEqual([]);
  });

  it('says the -ttre rule also covers the imperative', () => {
    const [form] = conjugate('blettre', { mood: 'imperative', tense: 'present', person: 2, number: 'singular' }).forms;
    expect(texts(form!).find(text => text.includes('-ttre'))).toMatch(/imperative/u);
  });
});
