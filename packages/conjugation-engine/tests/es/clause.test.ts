import { describe, expect, it } from 'vitest';
import { createEngine } from '../../src/core/engine.js';
import { locales } from '../../src/i18n/locales/index.js';
import { packs } from '../../src/languages/index.js';
import type { GrammaticalNumber, Person } from '../../src/types.js';

const engine = createEngine(packs, locales);
const forms = (infinitive: string, options: Record<string, unknown>) => engine.conjugate({ language: 'es', infinitive, ...options }).forms;
const texts = (infinitive: string, options: Record<string, unknown>) => forms(infinitive, options).map(form => form.text);
const bare = (infinitive: string, options: Record<string, unknown>) => forms(infinitive, options).map(form => engine.renderParts('es', form.parts, { bare: true }));
const ruleIdsOfForm = (infinitive: string, mood: string, tense: string, person: Person, number: GrammaticalNumber) =>
  forms(infinitive, { mood, tense, person, number })[0]!.ruleIds;

describe('Spanish clause', () => {
  it('places and re-accents reflexive pronouns', () => {
    expect(texts('levantarse', { mood: 'imperative', tense: 'present' })).toEqual(['levántate', 'levántese', 'levantémonos', 'levantaos', 'levántense']);
    expect(texts('levantarse', { mood: 'imperative', tense: 'negative' })).toEqual(['no te levantes', 'no se levante', 'no nos levantemos', 'no os levantéis', 'no se levanten']);
    expect(texts('levantarse', { mood: 'indicative', tense: 'perfect', person: 1, number: 'singular' })).toEqual(['yo me he levantado']);
    expect(texts('levantarse', { mood: 'indicative', tense: 'present' })).toEqual(['yo me levanto', 'tú te levantas', 'él se levanta', 'nosotros nos levantamos', 'vosotros os levantáis', 'ellos se levantan']);
    expect(texts('levantarse', { mood: 'gerund' })).toEqual(['levantándose', 'habiéndose levantado']);
    expect(texts('levantarse', { mood: 'infinitive' })).toEqual(['levantarse', 'haberse levantado']);
    expect(texts('levantarse', { mood: 'participle' })).toEqual(['levantado']);
    expect(texts('irse', { mood: 'imperative', tense: 'present' })).toEqual(['vete', 'váyase', 'vámonos', 'vayámonos', 'idos', 'iros', 'váyanse']);   // iros: GD §11 row 3
    expect(texts('reírse', { mood: 'imperative', tense: 'present', person: 2, number: 'plural' })).toEqual(['reíos']);
    expect(texts('reírse', { mood: 'imperative', tense: 'present', person: 2, number: 'singular' })).toEqual(['ríete']);
    expect(texts('vestirse', { mood: 'imperative', tense: 'present', person: 1, number: 'plural' })).toEqual(['vistámonos']);
    expect(texts('vestirse', { mood: 'imperative', tense: 'present', person: 2, number: 'plural' })).toEqual(['vestíos']);
    expect(texts('sentarse', { mood: 'imperative', tense: 'present', person: 2, number: 'singular' })).toEqual(['siéntate']);
    expect(bare('levantarse', { mood: 'subjunctive', tense: 'present', person: 1, number: 'singular' })).toEqual(['me levante']);
    expect(texts('levantarse', { mood: 'subjunctive', tense: 'past', person: 1, number: 'singular' })).toEqual(['que yo me haya levantado']);
    expect(texts('levantar', { reflexive: true, mood: 'imperative', tense: 'present', person: 2, number: 'singular' })).toEqual(['levántate']);
  });

  it('tags iros as a variant beside idos', () => {
    const plural = forms('irse', { mood: 'imperative', tense: 'present', person: 2, number: 'plural' });
    expect(plural.map(form => form.variant.pattern)).toEqual([null, 'iros']);   // whole-pack review I1
    expect(plural[1]!.ruleIds).toContain('es.clause.iros');
  });

  it('gives the formal subject its pronoun', () => {
    expect(texts('amar', { subject: '2sg.formal', mood: 'indicative', tense: 'present' })).toEqual(['usted ama']);
    expect(texts('amar', { subject: '2pl.formal', mood: 'subjunctive', tense: 'present' })).toEqual(['que ustedes amen']);
    expect(texts('amar', { gender: 'feminine', mood: 'indicative', tense: 'present', person: 3 })).toEqual(['ella ama', 'ellas aman']);
    expect(texts('amar', { gender: 'feminine', mood: 'indicative', tense: 'present', person: 1, number: 'plural' })).toEqual(['nosotras amamos']);
    expect(texts('levantarse', { subject: '2sg.formal', mood: 'indicative', tense: 'present' })).toEqual(['usted se levanta']);
  });

  it('explains enclitic re-accentuation', () => {
    expect(ruleIdsOfForm('levantarse', 'imperative', 'present', 1, 'plural')).toEqual(expect.arrayContaining(['es.clause.enclitic', 'es.clause.enclitic-s-drop', 'es.clause.enclitic-accent']));
    expect(ruleIdsOfForm('levantarse', 'imperative', 'present', 2, 'plural')).toEqual(expect.arrayContaining(['es.clause.enclitic', 'es.clause.enclitic-d-drop']));
    expect(ruleIdsOfForm('levantarse', 'imperative', 'present', 2, 'plural')).not.toContain('es.clause.enclitic-accent');
    expect(ruleIdsOfForm('levantarse', 'imperative', 'negative', 2, 'singular')).toEqual(expect.arrayContaining(['es.periphrasis.negative-imperative', 'es.clause.proclitic']));
    const [levantate] = forms('levantarse', { mood: 'imperative', tense: 'present', person: 2, number: 'singular' });
    expect(levantate!.parts.map(part => [part.role, part.text, part.joinBefore])).toEqual([['lexicalVerb', 'levánta', 'space'], ['reflexivePronoun', 'te', 'attached']]);
    const steps = engine.explain('es', levantate!, 'en').sections.flatMap(section => section.steps.map(s => s.text));
    expect(steps.join('\n')).toContain('levantate becomes levántate');
  });
});
