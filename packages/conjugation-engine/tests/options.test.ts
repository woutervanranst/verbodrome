import { describe, expect, it } from 'vitest';
import type { LanguagePack } from '../src/core/pack.js';
import { expandTargets } from '../src/catalogue.js';
import { ConjugationError } from '../src/errors.js';
import { agreementKeys, parseOptions } from '../src/core/options.js';
import type { FieldSpec } from '../src/core/options.js';
import { packs } from '../src/languages/index.js';
import { conjugationOptions, parseConjugationOptions } from '../src/options.js';

describe('grammatical options', () => {
  it('builds the same precise request as an object', () => {
    expect(conjugationOptions('fr', ' ALLER ').indicative('perfect').person(1, 'plural').gender('feminine').build())
      .toEqual({ language: 'fr', infinitive: 'aller', mood: 'indicative', tense: 'perfect', person: 1, number: 'plural', gender: 'feminine' });
  });

  it('expands only valid slots and retains explicit inapplicability', () => {
    const all = expandTargets({ language: 'fr', infinitive: 'aimer' });
    expect(all).toHaveLength(109);
    expect(all.filter(t => t.mood === 'imperative')).toHaveLength(6);
    expect(all.filter(t => t.person === null)).toHaveLength(7);
    expect(expandTargets({ language: 'nl', infinitive: 'werken' })).toHaveLength(53);
    expect(expandTargets({ language: 'fr', infinitive: 'aimer', person: 1 }).some(t => t.person === null)).toBe(false);
  });

  it.each([
    { language: 'xx', infinitive: 'aimer' },
    { language: 'fr', infinitive: '' },
    { language: 'fr', infinitive: 'aimer', person: 0 },
    { language: 'fr', infinitive: 'aimer', mood: 'imperative', person: 3 },
    { language: 'fr', infinitive: 'aimer', mood: 'participle', person: 1 },
    { language: 'nl', infinitive: 'werken', gender: 'feminine' },
    { language: 'fr', infinitive: 'aimer', stems: { future: '' } },
    { language: 'fr', infinitive: 'aimer', gender: 'neuter' },
    { language: 'fr', infinitive: 'aimer', agreement: { gender: 'neuter' } },
    { language: 'fr', infinitive: 'aimer', voice: 'passive' },
  ])('rejects an invalid request explicitly: %j', options => {
    expect(() => parseConjugationOptions(options)).toThrow(ConjugationError);
  });

  it('names the registered languages when rejecting another', () => {
    expect(() => parseConjugationOptions({ language: 'xx', infinitive: 'aimer' }))
      .toThrow(expect.objectContaining({ code: 'UNSUPPORTED_LANGUAGE', message: 'Language must be one of: fr, nl, en, de, es.' }));
  });

  it('normalizes spelling without dropping accents', () => {
    expect(parseConjugationOptions({ language: 'fr', infinitive: ' S’AIMER ' }).infinitive).toBe("s'aimer");
    expect(parseConjugationOptions({ language: 'fr', infinitive: 'ME\u0301FIER' }).infinitive).toBe('méfier');
    expect(parseConjugationOptions({ language: 'fr', infinitive: 'ressortir', model: ' FINIR ', stems: { future: 'RESSORTIR' } }))
      .toEqual({ language: 'fr', infinitive: 'ressortir', model: 'finir', stems: { future: 'ressortir' } });
    expect(parseConjugationOptions({ language: 'nl', infinitive: 'opzorpen', separablePrefix: 'OP', stems: { stem: 'ZORP' } }))
      .toEqual({ language: 'nl', infinitive: 'opzorpen', separablePrefix: 'op', stems: { stem: 'zorp' } });
  });

  it('clones nested inputs without removing their undefined properties', () => {
    const agreement = Object.freeze({ gender: 'feminine', number: undefined });
    const stems = Object.freeze({ future: undefined });
    const input = Object.freeze({ language: 'fr', infinitive: 'aimer', agreement, stems });
    const parsed = parseConjugationOptions(input);
    expect(parsed).toEqual({ language: 'fr', infinitive: 'aimer', agreement: { gender: 'feminine' }, stems: {} });
    expect(Object.hasOwn(agreement, 'number')).toBe(true);
    expect(Object.hasOwn(stems, 'future')).toBe(true);
    expect(JSON.parse(JSON.stringify(parsed))).toEqual(parsed);
  });

  it('derives accepted option keys from the pack schema', () => {
    expect(() => parseConjugationOptions({ language: 'nl', infinitive: 'werken', aspiratedH: true }))
      .toThrow(expect.objectContaining({ code: 'INVALID_REQUEST', message: 'Unknown nl option: aspiratedH.' }));
  });

  it('installs builder sugar per language', () => {
    expect(conjugationOptions('nl', 'werken').inversion().build()).toMatchObject({ inversion: true });
    expect('gerund' in conjugationOptions('nl', 'werken')).toBe(false);
    expect(conjugationOptions('fr', 'aimer').gerund().build()).toMatchObject({ mood: 'gerund' });
  });

  it('validates a pack with an unknown language purely from its own schema', () => {
    const xx = {
      ...packs.fr,
      language: 'xx',
      options: {
        fields: {
          mode: { kind: 'enum', values: ['a', 'b'] },
          tag: { kind: 'word', pattern: /^[a-z]+$/u, code: 'INVALID_HINT', message: 'tag must be letters.' },
          flag: { kind: 'boolean' },
        },
        check: options => { if (options.mode === 'b' && options.flag) throw new ConjugationError('INVALID_HINT', 'b excludes flag.'); },
      },
    } satisfies LanguagePack;
    const parse = (value: unknown) => parseOptions({ xx }, value);
    expect(parse({ language: 'xx', infinitive: 'ab', mode: 'a', tag: ' ABC ', flag: true }))
      .toEqual({ language: 'xx', infinitive: 'ab', mode: 'a', tag: 'abc', flag: true });
    expect(() => parse({ language: 'xx', infinitive: 'ab', gender: 'feminine' }))
      .toThrow(expect.objectContaining({ code: 'INVALID_REQUEST', message: 'Unknown xx option: gender.' }));
    expect(() => parse({ language: 'xx', infinitive: 'ab', mode: 'c' }))
      .toThrow(expect.objectContaining({ code: 'INVALID_REQUEST', message: 'Invalid mode: c.' }));
    expect(() => parse({ language: 'xx', infinitive: 'ab', tag: '1' }))
      .toThrow(expect.objectContaining({ code: 'INVALID_HINT', message: 'tag must be letters.' }));
    expect(() => parse({ language: 'xx', infinitive: 'ab', mode: 'b', flag: true }))
      .toThrow(expect.objectContaining({ code: 'INVALID_HINT', message: 'b excludes flag.' }));
  });

  it('validates agreement fields against the genders and cases the pack declares', () => {
    const invalid = (message: string) => expect.objectContaining({ code: 'INVALID_REQUEST', message });
    expect(() => parseConjugationOptions({ language: 'fr', infinitive: 'aimer', agreement: { gender: 'neuter' } }))
      .toThrow(invalid('Invalid agreement.gender: neuter.'));
    expect(() => parseConjugationOptions({ language: 'fr', infinitive: 'aimer', precedingDirectObject: { gender: 'neuter', number: 'singular' } }))
      .toThrow(invalid('Invalid precedingDirectObject.gender: neuter.'));
    expect(() => parseConjugationOptions({ language: 'fr', infinitive: 'aimer', agreement: { gender: 'feminine', case: 'ablative' } }))
      .toThrow(invalid('agreement must contain only gender and number.'));

    const declined: FieldSpec = {
      kind: 'agreement', required: false, genders: ['masculine', 'feminine', 'neuter'], cases: ['nominative', 'ablative'],
    };
    const xx = { ...packs.fr, language: 'xx', options: { fields: { agreement: declined } } } satisfies LanguagePack;
    const parse = (agreement: unknown) => parseOptions({ xx }, { language: 'xx', infinitive: 'ab', agreement });
    expect(parse({ gender: 'neuter', number: 'singular', case: 'ablative' }))
      .toEqual({ language: 'xx', infinitive: 'ab', agreement: { gender: 'neuter', number: 'singular', case: 'ablative' } });
    expect(() => parse({ gender: 'neuter', case: 'locative' })).toThrow(invalid('Invalid agreement.case: locative.'));
    expect(() => parse({ gender: 'neuter', mood: 'x' })).toThrow(invalid('agreement must contain only gender, number and case.'));
    expect(agreementKeys(declined)).toEqual(['gender', 'number', 'case']);
    expect(agreementKeys(packs.fr.options.fields.agreement as Extract<FieldSpec, { kind: 'agreement' }>)).toEqual(['gender', 'number']);
  });

  it('keeps the shared hint checks in the pack schemas', () => {
    expect(() => parseConjugationOptions({ language: 'fr', infinitive: 'aimer', stems: { future: 'aime' } }))
      .toThrow(expect.objectContaining({ code: 'INVALID_HINT', message: 'A French future stem must include its final r.' }));
    expect(() => parseConjugationOptions({ language: 'nl', infinitive: 'opzorpen', separablePrefix: 'op', inseparablePrefix: 'ver' }))
      .toThrow(expect.objectContaining({ code: 'INVALID_HINT', message: 'A prefix cannot be both separable and inseparable.' }));
  });

  it('reports an unregistered builder language when building, not when constructing', () => {
    const builder = conjugationOptions('xx' as never, 'aimer');
    expect(() => builder.build()).toThrow(expect.objectContaining({ code: 'UNSUPPORTED_LANGUAGE' }));
  });

  describe('a pack whose names collide with the builder\'s methods', () => {
    /** The French pack with its schema (and moods) changed, registered as `xx` for the duration of `run`. */
    function withPack(extra: Partial<LanguagePack>, run: () => void): void {
      const registry = packs as unknown as Record<string, LanguagePack>;
      registry.xx = { ...packs.fr, language: 'xx', ...extra } as LanguagePack;
      try {
        run();
      } finally {
        delete registry.xx;
      }
    }
    const construct = () => conjugationOptions('xx' as never, 'aimer');
    const collision = (name: string) => expect.objectContaining({
      code: 'INVALID_REQUEST', message: `The xx pack has a ${name.startsWith('mood:') ? 'mood' : 'option field'} named "${name.replace('mood:', '')}", which collides with a method of the options builder.`,
    });

    it.each(['build', 'mood', 'tense', 'person', 'number', 'subject', 'constructor'])('throws at construction for a schema field named %s', name => {
      withPack({ options: { fields: { ...packs.fr.options.fields, [name]: { kind: 'boolean' } } } }, () => {
        expect(construct).toThrow(collision(name));
      });
    });

    it('throws for a mood named like a builder method', () => {
      withPack({ catalogue: packs.fr.catalogue.map(entry => entry.mood === 'gerund' ? { ...entry, mood: 'build' as never } : entry) }, () => {
        expect(construct).toThrow(collision('mood:build'));
      });
    });

    it('throws for a field named like a mood, and still shares auxiliary, classHint and stems', () => {
      withPack({ options: { fields: { ...packs.fr.options.fields, indicative: { kind: 'boolean' } } } }, () => {
        expect(construct).toThrow(collision('indicative'));
      });
      withPack({}, () => {
        expect(construct).not.toThrow();
        expect(typeof (construct() as unknown as { gender: unknown }).gender).toBe('function');
      });
    });
  });
});
