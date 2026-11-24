import { describe, expect, it } from 'vitest';
import { conjugate, createEngine, getCatalogue, languages, renderParts } from '../src/index.js';
import { packs } from '../src/languages/index.js';

describe('language packs', () => {
  it('lists registered languages and rejects others by name', () => {
    expect(languages).toEqual(['fr', 'nl']);
    for (const call of [() => conjugate({ language: 'xx', infinitive: 'a' } as never), () => getCatalogue('xx' as never), () => renderParts('xx' as never, [])]) {
      expect(call).toThrow(expect.objectContaining({ code: 'UNSUPPORTED_LANGUAGE', message: 'Language must be one of: fr, nl.' }));
    }
  });

  it('keeps imperative slots as catalogue data', () => {
    const imperative = (l: 'fr' | 'nl') => getCatalogue(l).find(e => e.mood === 'imperative' && e.tense === 'present')!.persons;
    expect(imperative('fr')).toEqual([[2, 'singular'], [1, 'plural'], [2, 'plural']]);
    expect(imperative('nl')).toEqual([[2, 'singular'], [2, 'plural']]);
  });

  it('computes onsets per language', () => {
    const part = (l: 'fr' | 'nl', verb: string) => conjugate({ language: l, infinitive: verb, mood: 'indicative', tense: 'present', person: 1, number: 'singular' }).forms[0]!.parts.at(-1)!;
    expect(part('fr', 'habiter').phonology.onset).toBe('muteH');
    expect(part('nl', 'hebben').phonology.onset).toBe('consonant');
  });

  it('runs a pack that is not in the default registry', () => {
    const engine = createEngine({ fr: packs.fr });
    expect(engine.languages).toEqual(['fr']);
    expect(engine.conjugate({ language: 'fr', infinitive: 'aimer', mood: 'infinitive' }).forms[0]!.text).toBe('aimer');
    const unsupported = expect.objectContaining({ code: 'UNSUPPORTED_LANGUAGE', message: 'Language must be one of: fr.' });
    expect(() => engine.conjugate({ language: 'nl', infinitive: 'werken' })).toThrow(unsupported);
    expect(() => engine.getCatalogue('nl')).toThrow(unsupported);
    expect(() => engine.expandTargets({ language: 'nl', infinitive: 'werken' })).toThrow(unsupported);
    expect(() => engine.renderParts('nl', [])).toThrow(unsupported);
  });
});
