import { describe, expect, it } from 'vitest';
import { step } from '../../src/core/derivation.js';
import { defineRules } from '../../src/core/derivation.js';
import { germanParticles } from '../../src/languages/de/lexicon.js';
import { isPlausibleRoot, paradigmFork, splitDerivative } from '../../src/languages/shared/germanic.js';

const split = (lemma: string) => splitDerivative(lemma, germanParticles);

describe('the shared Germanic derivative splitter, with the German tables', () => {
  it('lists every particle + prefix + root analysis, longest particle first', () => {
    expect(split('herumfahren')).toEqual([
      { particle: 'herum', prefix: null, root: 'fahren' }, { particle: 'her', prefix: null, root: 'umfahren' }]);
    expect(split('anerkennen')[0]).toEqual({ particle: 'an', prefix: 'er', root: 'kennen' });
    expect(split('anerkennen')[1]).toEqual({ particle: 'an', prefix: null, root: 'erkennen' });
    expect(split('verschlafen')).toEqual([{ particle: null, prefix: 'ver', root: 'schlafen' }]);
    expect(split('vorbereiten')).toEqual([
      { particle: 'vor', prefix: 'be', root: 'reiten' }, { particle: 'vor', prefix: null, root: 'bereiten' }]);
  });

  it('keeps only plausible roots', () => {
    for (const lemma of ['beten', 'erben', 'zuckern', 'herrschen', 'machen']) expect(split(lemma)).toEqual([]);
    expect(isPlausibleRoot('ugen', germanParticles)).toBe(true);
    expect(isPlausibleRoot('ckern', germanParticles)).toBe(false);
    expect(isPlausibleRoot('quellen', germanParticles)).toBe(true);
    expect(isPlausibleRoot('ten', germanParticles)).toBe(false);
  });

  it('tags each paradigm with its pattern and condition', () => {
    const rules = defineRules({ 'xx.classify.reading': { stage: 'classify' } });
    const steps = [step(rules['xx.classify.reading'], null, null)];
    expect(paradigmFork([
      { pattern: 'separable', condition: 'move house', lexeme: 'a', steps },
      { pattern: 'inseparable', lexeme: 'b', steps: [] },
    ])).toEqual([
      { value: 'a', steps, tags: { pattern: 'separable', condition: 'move house' } },
      { value: 'b', steps: [], tags: { pattern: 'inseparable' } },
    ]);
  });
});
