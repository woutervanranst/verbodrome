import { afterEach, describe, expect, it, vi } from 'vitest';
import { conjugate, ConjugationError } from '../src/index.js';
import * as french from '../src/languages/fr/index.js';

afterEach(() => vi.restoreAllMocks());

describe('typed generation failures', () => {
  it('rejects an adapter with no grammatical availability decision', () => {
    const options = { language: 'fr', infinitive: 'aimer', mood: 'indicative', tense: 'present', person: 1, number: 'singular' } as const;
    const engine = french.resolveFrench(options);
    vi.spyOn(french, 'resolveFrench').mockReturnValue({ ...engine, generate: () => ({ forms: [], unavailable: [] }) });
    expect(() => conjugate(options)).toThrowError(expect.objectContaining({ code: 'GENERATION_FAILURE' }));
    expect(() => conjugate(options)).toThrow(ConjugationError);
  });

  it.each(['empty-components', 'wrong-target'] as const)('rejects an adapter returning %s instead of a valid form', failure => {
    const options = { language: 'fr', infinitive: 'aimer', mood: 'indicative', tense: 'present', person: 1, number: 'singular' } as const;
    const engine = french.resolveFrench(options);
    vi.spyOn(french, 'resolveFrench').mockReturnValue({
      ...engine,
      generate(target) {
        const form = engine.generate(target).forms[0];
        if (!form) throw new Error('Missing test seed form.');
        return {
          forms: [{ ...form, ...(failure === 'empty-components' ? { parts: [] } : { target: { ...form.target, person: 2 } }) }],
          unavailable: [],
        };
      },
    });
    expect(() => conjugate(options)).toThrowError(expect.objectContaining({ code: 'GENERATION_FAILURE' }));
  });
});
