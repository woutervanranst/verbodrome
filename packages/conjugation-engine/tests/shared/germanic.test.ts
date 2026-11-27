/** The Germanic mechanisms German and Dutch share, each with a German and a Dutch table. */
import { describe, expect, it } from 'vitest';
import type { ChainWord } from '../../src/core/clause.js';
import { defineRules, step } from '../../src/core/derivation.js';
import { conjugate } from '../../src/index.js';
import { paradigmFork, placeParticle } from '../../src/languages/shared/germanic.js';

const word = (role: ChainWord['role'], text: string, finite: boolean): ChainWord => ({
  role, text, lemma: null, steps: [],
  cell: finite ? { kind: 'finite', mood: 'indicative', tense: 'present', person: 1, number: 'singular' } : { kind: 'nonFinite', form: 'participle' },
});
const texts = (query: Record<string, unknown>) => conjugate(query as never).forms.map(form => form.text);

describe('placeParticle: a separable particle at the end after a finite lexical verb, else on the verb', () => {
  const table: readonly (readonly [string, readonly ChainWord[], { text: string; separable: boolean } | null, readonly string[], string | null])[] = [
    // German
    ['de: ich schreibe ab', [word('lexicalVerb', 'schreibe', true)], { text: 'ab', separable: true }, ['schreibe'], 'ab'],
    ['de: ich habe abgeschrieben', [word('auxiliary', 'habe', true), word('lexicalVerb', 'geschrieben', false)], { text: 'ab', separable: true }, ['habe', 'abgeschrieben'], null],
    ['de: ich verstehe', [word('lexicalVerb', 'stehe', true)], { text: 'ver', separable: false }, ['verstehe'], null],
    // Dutch
    ['nl: ik sta op', [word('lexicalVerb', 'sta', true)], { text: 'op', separable: true }, ['sta'], 'op'],
    ['nl: ik ben opgestaan', [word('auxiliary', 'ben', true), word('lexicalVerb', 'gestaan', false)], { text: 'op', separable: true }, ['ben', 'opgestaan'], null],
    ['nl: ik verwerk', [word('lexicalVerb', 'werk', true)], { text: 'ver', separable: false }, ['verwerk'], null],
    ['nl: ik werk', [word('lexicalVerb', 'werk', true)], null, ['werk'], null],
  ];

  it.each(table)('%s', (_, words, particle, placed, final) => {
    const result = placeParticle(words, particle);
    expect(result.words.map(item => item.text)).toEqual(placed);
    expect(result.final).toBe(final);
  });

  it('places the particle the same way in both languages', () => {
    expect(texts({ language: 'de', infinitive: 'aufstehen', mood: 'indicative', tense: 'present', person: 1, number: 'singular' })).toEqual(['ich stehe auf']);
    expect(texts({ language: 'nl', infinitive: 'opstaan', mood: 'indicative', tense: 'present', person: 1, number: 'singular' })).toEqual(['ik sta op']);
    expect(texts({ language: 'de', infinitive: 'aufstehen', mood: 'indicative', tense: 'perfect', person: 1, number: 'singular' })[0]).toBe('ich bin aufgestanden');
    expect(texts({ language: 'nl', infinitive: 'opstaan', mood: 'indicative', tense: 'perfect', person: 1, number: 'singular' })).toEqual(['ik ben opgestaan']);
    // Dutch writes the unstressed prefix of the rest onto the verb first: uit + ver + kocht.
    expect(texts({ language: 'nl', infinitive: 'uitverkopen', mood: 'indicative', tense: 'past', person: 1, number: 'singular' })).toEqual(['ik verkocht uit']);
    expect(texts({ language: 'nl', infinitive: 'uitverkopen', mood: 'participle', tense: 'past' })).toEqual(['uitverkocht']);
  });
});

describe('paradigmFork: the paradigms of one lemma, tagged with their pattern and condition', () => {
  const rules = defineRules({ 'xx.classify.reading': { stage: 'classify' } });
  const steps = [step(rules['xx.classify.reading'], null, null)];

  it.each([
    ['de umziehen', 'separable', 'move house', 'inseparable', 'wrap around'],
    ['nl voorkomen', 'separable', 'to occur', 'inseparable', 'to prevent'],
    ['nl bedelen', 'unprefixed', 'to ask for alms', 'inseparable', 'to allot'],
  ])('%s', (_, first, firstCondition, second, secondCondition) => {
    expect(paradigmFork([
      { pattern: first, condition: firstCondition, lexeme: 'a', steps },
      { pattern: second, condition: secondCondition, lexeme: 'b', steps: [] },
    ])).toEqual([
      { value: 'a', steps, tags: { pattern: first, condition: firstCondition } },
      { value: 'b', steps: [], tags: { pattern: second, condition: secondCondition } },
    ]);
  });

  it('gives both languages their readings in order, tagged', () => {
    const tags = (query: Record<string, unknown>) => [...new Set(conjugate(query as never).forms.map(form => form.variant.pattern))];
    expect(tags({ language: 'de', infinitive: 'umziehen', mood: 'indicative', tense: 'present', person: 1, number: 'singular' })).toEqual(['separable', 'inseparable']);
    expect(tags({ language: 'nl', infinitive: 'voorkomen', mood: 'indicative', tense: 'present', person: 1, number: 'singular' })).toEqual(['separable', 'inseparable']);
    expect(tags({ language: 'nl', infinitive: 'bedelen', mood: 'indicative', tense: 'present', person: 1, number: 'singular' })).toEqual(['unprefixed', 'inseparable']);
  });
});
