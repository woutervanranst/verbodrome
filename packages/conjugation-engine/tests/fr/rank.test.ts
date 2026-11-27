/**
 * The order `frenchRank` gives where the core's build order (periphrases, then auxiliaries; `core/staged.ts`
 * `constructions`) would otherwise decide: choir's dated conditional pasts, and faillir's four paradigms.
 */
import { describe, expect, it } from 'vitest';
import { engine } from '../../src/default-engine.js';

const order = (infinitive: string) => engine.conjugate({
  language: 'fr', infinitive, mood: 'conditional', tense: 'past', person: 3, number: 'singular', gender: 'masculine',
}).forms.map(form => `${form.text} ${form.variant.pattern} ${form.variant.usage}`);

describe('French form order', () => {
  it('choir: per paradigm, its avoir forms before its être forms, though the core builds them interleaved', () => {
    expect(order('choir')).toEqual([
      'il aurait chu choirai.past-first dated', 'il eût chu choirai.past-second dated',
      'il serait chu choirai.past-first dated', 'il fût chu choirai.past-second dated',
      'il aurait chu cherrai.past-first dated', 'il eût chu cherrai.past-second dated',
      'il serait chu cherrai.past-first dated', 'il fût chu cherrai.past-second dated',
    ]);
  });

  it('faillir: standard before literary before dated, its paradigms in order within each', () => {
    expect(order('faillir')).toEqual([
      'il aurait failli faillis.past-first standard', 'il aurait failli faudrai.past-first standard',
      'il aurait failli faille.past-first standard', 'il eût failli faillis.past-second literary',
      'il eût failli faudrai.past-second literary', 'il eût failli faille.past-second literary',
      'il aurait failli faux.past-first dated', 'il eût failli faux.past-second dated',
    ]);
  });
});
