import { describe, expect, it } from 'vitest';
import { defineRules, step } from '../../src/core/derivation.js';
import { chain, combine, mergeTags, one } from '../../src/core/fork.js';
import { applyJunctureRules } from '../../src/core/juncture.js';
import type { JunctureRule } from '../../src/core/juncture.js';

const rules = defineRules({
  'xx.orth.c-cedilla': { stage: 'orthography', params: { vowel: 'text' } },
  'xx.orth.variant': { stage: 'orthography' },
  'xx.lex.irregular': { stage: 'stem', kind: 'lexical', params: { n: 'number', tense: 'term' } },
});

const cedilla: JunctureRule<null> = {
  info: rules['xx.orth.c-cedilla'],
  apply: j => /c$/.test(j.stem) && /^[ao]/.test(j.ending) ? one({ stem: j.stem.slice(0, -1) + 'ç', ending: j.ending }) : null,
  describe: (_, after) => ({ vowel: after.ending[0]! }),
};

describe('derivation steps', () => {
  it('records one step per rule that changed the spelling', () => {
    expect(applyJunctureRules([cedilla], { stem: 'plac', ending: 'ons' }, null)).toEqual([{
      value: { stem: 'plaç', ending: 'ons' }, tags: {},
      steps: [{ rule: 'xx.orth.c-cedilla', stage: 'orthography', kind: 'rule', before: 'placons', after: 'plaçons', params: { vowel: 'o' } }],
    }]);
    expect(applyJunctureRules([cedilla], { stem: 'plac', ending: 'ez' }, null)[0]!.steps).toEqual([]);
  });

  it('defines rules with defaults for kind and params', () => {
    expect(rules['xx.orth.variant']).toEqual({ id: 'xx.orth.variant', stage: 'orthography', kind: 'rule', params: {} });
    expect(rules['xx.lex.irregular'].kind).toBe('lexical');
  });

  it('rejects a step whose params do not match the rule', () => {
    const fails = () => expect.objectContaining({ code: 'GENERATION_FAILURE' });
    expect(() => step(rules['xx.orth.c-cedilla'], 'a', 'b', {})).toThrow(fails());
    expect(() => step(rules['xx.orth.c-cedilla'], 'a', 'b', { vowel: 3 })).toThrow(fails());
    expect(() => step(rules['xx.orth.c-cedilla'], 'a', 'b', { vowel: 'o', extra: 'x' })).toThrow(fails());
    expect(() => step(rules['xx.orth.variant'], 'a', 'b', { extra: 1 })).toThrow(fails());
    expect(() => step(rules['xx.lex.irregular'], null, null, { n: 1, tense: 'present' })).toThrow(fails());
  });

  it('accepts text, number and term params', () => {
    const tense = { term: 'tense', id: 'present' } as const;
    expect(step(rules['xx.lex.irregular'], null, 'x', { n: 2, tense })).toEqual({
      rule: 'xx.lex.irregular', stage: 'stem', kind: 'lexical', before: null, after: 'x', params: { n: 2, tense },
    });
  });
});

describe('forks', () => {
  it('drops branches whose orthography or region conflict', () => {
    const a = [...one('x', [], { orthography: 'traditional' }), ...one('y', [], { orthography: 'rectified' })];
    expect(chain(a, v => one(v + '!', [], { orthography: 'rectified' })).map(o => o.value)).toEqual(['y!']);
    expect(mergeTags({ orthography: 'traditional' }, { orthography: 'rectified' })).toBeNull();
    expect(mergeTags({ region: 'be' }, { region: 'nl' })).toBeNull();
    expect(mergeTags({ region: 'be', pattern: 'a' }, { region: 'be', pattern: 'b' })).toEqual({ region: 'be', pattern: 'a.b' });
  });

  it('treats absent or undefined tags as compatible and merges them', () => {
    expect(mergeTags({ pattern: 'a' }, { usage: 'literary' })).toEqual({ pattern: 'a', usage: 'literary' });
    expect(mergeTags({ pattern: 'a' }, { pattern: 'a', region: 'be' })).toEqual({ pattern: 'a', region: 'be' });
    expect(mergeTags({ pattern: undefined } as never, { pattern: 'b' })).toEqual({ pattern: 'b' });
  });

  it('joins distinct patterns in order and does not repeat one', () => {
    expect(mergeTags({ pattern: 'A' }, { pattern: 'ra' })).toEqual({ pattern: 'A.ra' });
    expect(mergeTags({ pattern: 'ra' }, { pattern: 'A' })).toEqual({ pattern: 'ra.A' });
    expect(mergeTags({ pattern: 'A' }, { pattern: 'A' })).toEqual({ pattern: 'A' });
    // A joined pattern is a list of labels, so merging is the same whichever way the merges are grouped.
    expect(mergeTags({ pattern: 'A.ra' }, { pattern: 'ra' })).toEqual({ pattern: 'A.ra' });
    expect(chain(chain(one(1, [], { pattern: 'A' }), () => one(2, [], { pattern: 'ra' })), () => one(3, [], { pattern: 'A' }))[0]!.tags)
      .toEqual({ pattern: 'A.ra' });
  });

  it('keeps the most marked usage', () => {
    expect(mergeTags({ usage: 'dated' }, { usage: 'literary' })).toEqual({ usage: 'dated' });
    expect(mergeTags({ usage: 'literary' }, { usage: 'dated' })).toEqual({ usage: 'dated' });
    expect(mergeTags({ usage: 'standard' }, { usage: 'literary' })).toEqual({ usage: 'literary' });
    expect(mergeTags({ usage: 'standard' }, { usage: 'standard' })).toEqual({ usage: 'standard' });
  });

  it('joins distinct conditions with a semicolon', () => {
    expect(mergeTags({ condition: 'before a vowel' }, { condition: 'in Belgium' })).toEqual({ condition: 'before a vowel; in Belgium' });
    expect(mergeTags({ condition: 'in Belgium' }, { condition: 'in Belgium' })).toEqual({ condition: 'in Belgium' });
  });

  it('keeps labels apart from constraints when chaining', () => {
    const stem = [...one('graph', [], { orthography: 'traditional', pattern: 'A' }), ...one('graf', [], { orthography: 'rectified', pattern: 'A' })];
    const ending = (s: string) => one(`${s}ra`, [], { orthography: 'rectified', pattern: 'ra', usage: 'dated' });
    expect(chain(stem, ending).map(o => [o.value, o.tags])).toEqual([['grafra', { orthography: 'rectified', pattern: 'A.ra', usage: 'dated' }]]);
  });

  it('concatenates steps and merges tags when chaining', () => {
    const s1 = step(rules['xx.orth.variant'], 'a', 'b');
    const s2 = step(rules['xx.orth.variant'], 'b', 'c');
    const result = chain(one('a', [s1], { pattern: 'p' }), v => one(v + 'c', [s2], { usage: 'dated' }));
    expect(result).toEqual([{ value: 'ac', steps: [s1, s2], tags: { pattern: 'p', usage: 'dated' } }]);
    expect(chain(one('a'), () => [])).toEqual([]);
  });

  it('combines forks as an ordered product, dropping conflicts', () => {
    const left = [...one('a', [], { orthography: 'rectified' }), ...one('b', [], { orthography: 'traditional' })];
    const right = [...one(1, [], { orthography: 'rectified' }), ...one(2)];
    expect(combine<[string, number]>([left, right]).map(o => o.value)).toEqual([['a', 1], ['a', 2], ['b', 2]]);
    const labelled = combine<[string, number]>([one('a', [], { pattern: 'p' }), one(1, [], { pattern: 'q', condition: 'c' })]);
    expect(labelled.map(o => o.tags)).toEqual([{ pattern: 'p.q', condition: 'c' }]);
    expect(combine<[]>([])).toEqual(one([]));
    expect(combine<[string, number]>([left, []])).toEqual([]);
  });
});

describe('applyJunctureRules', () => {
  const variants: JunctureRule<null> = {
    info: rules['xx.orth.variant'],
    apply: j => [
      ...one({ stem: j.stem, ending: 'ez' }, [], { orthography: 'traditional' }),
      ...one({ stem: j.stem, ending: 'es' }, [], { orthography: 'rectified' }),
    ],
  };
  const unchanged: JunctureRule<null> = { info: rules['xx.orth.variant'], apply: j => one(j) };
  const restrict: JunctureRule<null> = {
    info: rules['xx.orth.c-cedilla'],
    apply: j => one({ stem: j.stem + '-', ending: j.ending }, [], { orthography: 'rectified' }),
    describe: () => ({ vowel: 'e' }),
  };

  it('branches on several outcomes and continues each through later rules', () => {
    const result = applyJunctureRules([variants, restrict], { stem: 'ab', ending: '' }, null);
    expect(result.map(o => [o.value, o.tags])).toEqual([[{ stem: 'ab-', ending: 'es' }, { orthography: 'rectified' }]]);
    expect(result[0]!.steps.map(s => s.rule)).toEqual(['xx.orth.variant', 'xx.orth.c-cedilla']);
  });

  it('merges a rule outcome\'s labels into its branch and drops it only on a constraint conflict', () => {
    const labelled: JunctureRule<null> = {
      info: rules['xx.orth.variant'],
      apply: j => [
        ...one({ stem: j.stem, ending: 'ez' }, [], { pattern: 'z', orthography: 'traditional' }),
        ...one({ stem: j.stem, ending: 'es' }, [], { pattern: 's', orthography: 'traditional' }),
      ],
    };
    const relabel: JunctureRule<null> = { info: rules['xx.orth.variant'], apply: j => one(j, [], { pattern: 'x', usage: 'literary' }) };
    expect(applyJunctureRules([labelled, relabel], { stem: 'ab', ending: '' }, null).map(o => [o.value.ending, o.tags])).toEqual([
      ['ez', { orthography: 'traditional', pattern: 'z.x', usage: 'literary' }],
      ['es', { orthography: 'traditional', pattern: 's.x', usage: 'literary' }],
    ]);
    expect(applyJunctureRules([labelled, restrict], { stem: 'ab', ending: '' }, null)).toEqual([]);
  });

  it('adds no step for an unchanged juncture and keeps a branch when a rule does not apply', () => {
    expect(applyJunctureRules([unchanged], { stem: 'a', ending: 'b' }, null)).toEqual([{ value: { stem: 'a', ending: 'b' }, steps: [], tags: {} }]);
    expect(applyJunctureRules([cedilla, unchanged], { stem: 'chant', ending: 'ons' }, null)[0]!.steps).toEqual([]);
  });

  it('does not mutate its input and yields no form when a rule yields none', () => {
    const start = { stem: 'plac', ending: 'ons' };
    applyJunctureRules([cedilla], start, null);
    expect(start).toEqual({ stem: 'plac', ending: 'ons' });
    const none: JunctureRule<null> = { info: rules['xx.orth.variant'], apply: () => [] };
    expect(applyJunctureRules([none, cedilla], start, null)).toEqual([]);
  });
});

describe('defineRules', () => {
  it('rejects a param named before or after, naming the rule', () => {
    for (const name of ['before', 'after']) {
      expect(() => defineRules({ 'xx.bad.param': { stage: 'stem', params: { [name]: 'text' } } }))
        .toThrow(expect.objectContaining({ code: 'GENERATION_FAILURE', message: expect.stringContaining('xx.bad.param') }));
    }
    expect(() => defineRules({ 'xx.ok.param': { stage: 'stem', params: { beforehand: 'text' } } })).not.toThrow();
  });
});
