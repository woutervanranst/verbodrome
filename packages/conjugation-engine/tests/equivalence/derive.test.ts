/**
 * The derivation over two made-up languages: `aa` has the one tense `indicative.t` with the source links of each case,
 * `bb` the target map of the case. Nothing here knows a real language.
 */
import { describe, expect, it } from 'vitest';
import { link } from '../../src/equivalence/concepts.js';
import type { ConceptLink, NoteKey } from '../../src/equivalence/concepts.js';
import { deriveEquivalents } from '../../src/equivalence/derive.js';
import type { EquivalenceData, EquivalenceOptions, RawEquivalence, RawOverride } from '../../src/equivalence/derive.js';
import { ConjugationError } from '../../src/errors.js';

type TargetMap = Readonly<Record<string, readonly ConceptLink[]>>;

function data(source: readonly ConceptLink[], target: TargetMap, extra: Partial<EquivalenceData> = {}): EquivalenceData {
  return { maps: { aa: { 'indicative.t': source }, bb: target }, overrides: [], passiveLanguages: [], ...extra };
}

function run(source: readonly ConceptLink[], target: TargetMap, options?: EquivalenceOptions): RawEquivalence {
  return deriveEquivalents(data(source, target), 'aa', 'bb', 'indicative.t', options);
}

/** The entries as `[tense, score, match, relaxed, notes]`. */
const rows = (result: RawEquivalence) => result.matches.map(entry => [entry.tense, entry.score, entry.match, entry.relaxed, entry.notes]);

/** The result when nothing corresponds: no match, and the notes that say why. */
const none = (...notes: NoteKey[]) => ({ matches: [], notes: ['eq.note.no-counterpart', ...notes] });

describe('deriveEquivalents', () => {
  it('ranks by the product of the weights', () => {
    expect(rows(run([link('PAST_PERFECTIVE', 0.8), link('PRESENT_PERFECT', 1)], {
      a: [link('PAST_PERFECTIVE', 0.9)], b: [link('PRESENT_PERFECT', 0.5)],
    }))).toEqual([['a', 0.72, 'exact', [], []], ['b', 0.5, 'exact', [], []]]);
  });

  it('uses the best pair of one tense', () => {
    const result = run([link('PAST_PERFECTIVE', 0.8), link('PRESENT_PERFECT', 1)], {
      a: [link('PAST_PERFECTIVE', 0.9), link('PRESENT_PERFECT', 0.9)],
    });
    expect(rows(result)).toEqual([['a', 0.9, 'exact', [], []]]);
    expect(result.matches[0]?.via).toEqual(['PRESENT_PERFECT', 'PRESENT_PERFECT']);
  });

  it('breaks ties: standard before literary, then catalogue order', () => {
    const result = run([link('PAST_PERFECTIVE', 1)], {
      x: [link('PAST_PERFECTIVE', 1, { register: 'literary' })], y: [link('PAST_PERFECTIVE', 1)], z: [link('PAST_PERFECTIVE', 1)],
    });
    expect(result.matches.map(entry => [entry.tense, entry.register])).toEqual([['y', 'standard'], ['z', 'standard'], ['x', 'literary']]);
  });

  it('rounds products to two decimals', () => {
    expect(rows(run([link('PAST_PERFECTIVE', 0.9)], { a: [link('PAST_PERFECTIVE', 0.9)] }))).toEqual([['a', 0.81, 'exact', [], []]]);
  });

  it('does not offer a dated target while a standard one exists', () => {
    expect(rows(run([link('FUTURE', 1)], { old: [link('FUTURE', 1, { register: 'dated' })], new: [link('FUTURE', 0.5)] })))
      .toEqual([['new', 0.5, 'exact', [], []]]);
  });

  it('offers a dated target alone at the register step', () => {
    const result = run([link('FUTURE', 1)], { old: [link('FUTURE', 1, { register: 'dated' })] });
    expect(rows(result)).toEqual([['old', 1, 'approximate', ['register'], ['eq.note.relaxed-register']]]);
    expect(result.matches[0]?.register).toBe('dated');
  });

  it('admits a dated target for a dated source', () => {
    expect(rows(run([link('FUTURE', 1, { register: 'dated' })], { old: [link('FUTURE', 1, { register: 'dated' })] })))
      .toEqual([['old', 1, 'exact', [], []]]);
  });

  it('relaxes remoteness', () => {
    expect(rows(run([link('RECENT_PAST', 1)], { p: [link('PRESENT_PERFECT', 1)] })))
      .toEqual([['p', 1, 'approximate', ['remoteness'], ['eq.note.relaxed-remoteness']]]);
  });

  it('relaxes aspect', () => {
    expect(rows(run([link('PAST_ANTERIOR', 1)], { p: [link('PLUPERFECT', 1)] })))
      .toEqual([['p', 1, 'approximate', ['aspect'], ['eq.note.relaxed-aspect']]]);
  });

  it('relaxes mood from the subjunctive', () => {
    expect(rows(run([link('SUBJ_PRESENT', 1)], { p: [link('PRESENT', 1)] })))
      .toEqual([['p', 1, 'approximate', ['mood'], ['eq.note.no-subjunctive']]]);
  });

  it('relaxes mood from the conditional', () => {
    expect(rows(run([link('COND_PRESENT', 1)], { p: [link('PRESENT', 1)] })))
      .toEqual([['p', 1, 'approximate', ['mood'], ['eq.note.no-conditional']]]);
  });

  it('relaxes aspect and mood together', () => {
    const result = run([link('SUBJ_IMPERFECT', 1)], { p: [link('PAST_PERFECTIVE', 1)] });
    expect(rows(result)).toEqual([['p', 1, 'approximate', ['aspect', 'mood'], ['eq.note.relaxed-aspect', 'eq.note.no-subjunctive']]]);
    expect(result.matches[0]?.via).toEqual(['SUBJ_IMPERFECT', 'PAST_PERFECTIVE']);
  });

  it('stops at the first level with a result', () => {
    const target = { p: [link('PAST_IMPERFECTIVE', 0.5)], q: [link('PAST_PERFECTIVE', 1)] };
    expect(rows(run([link('SUBJ_IMPERFECT', 1)], target))).toEqual([
      ['q', 1, 'approximate', ['aspect', 'mood'], ['eq.note.relaxed-aspect', 'eq.note.no-subjunctive']],
      ['p', 0.5, 'approximate', ['mood'], ['eq.note.no-subjunctive']],
    ]);
    expect(rows(run([link('SUBJ_IMPERFECT', 1)], { ...target, r: [link('SUBJ_IMPERFECT', 0.3)] })))
      .toEqual([['r', 0.3, 'exact', [], []]]);
  });

  it('never relaxes the mood of an imperative', () => {
    expect(run([link('IMP_PRESENT', 1)], { p: [link('PRESENT', 1)] })).toEqual(none());
  });

  it('never relaxes finiteness', () => {
    expect(run([link('GERUND', 1)], { p: [link('PART_PRESENT', 1)] })).toEqual(none());
  });

  it('never relaxes time', () => {
    expect(run([link('FUTURE', 1)], { p: [link('PRESENT', 1)] })).toEqual(none());
  });

  it('never relaxes relative time', () => {
    expect(run([link('INF_PERFECT', 1)], { p: [link('INF_PRESENT', 1)] })).toEqual(none());
  });

  it('never relaxes polarity', () => {
    expect(run([link('IMP_NEGATIVE', 1)], { p: [link('IMP_PRESENT', 1)] })).toEqual(none());
  });

  it('ignores a target-only link of the source', () => {
    const source = [link('INF_PERFECT', 1, { note: 'eq.nl.compound-inf-perfect', only: 'target' }), link('PART_PAST', 1)];
    expect(rows(run(source, { p: [link('PART_PAST', 1)], q: [link('INF_PERFECT', 1)] }))).toEqual([['p', 1, 'exact', [], []]]);
  });

  it('uses a target-only link of the target, as an approximate match', () => {
    const result = run([link('INF_PERFECT', 1)], {
      p: [link('PART_PAST', 1), link('INF_PERFECT', 0.4, { note: 'eq.nl.compound-inf-perfect', only: 'target' })],
    });
    expect(rows(result)).toEqual([['p', 0.4, 'approximate', [], ['eq.nl.compound-inf-perfect']]]);
  });

  it('ignores a source-only link of the target', () => {
    expect(run([link('IMP_PRESENT', 1)], {
      p: [link('IMP_NEGATIVE', 1), link('IMP_PRESENT', 0.6, { note: 'eq.note.negation-added', only: 'source' })],
    })).toEqual(none());
  });

  it('lists notes once each: the source link, the target link, then the relaxations', () => {
    expect(rows(run([link('SUBJ_PRESENT', 1, { note: 'eq.note.negation-added' })], { p: [link('PRESENT', 1, { note: 'eq.note.negation-added' })] })))
      .toEqual([['p', 1, 'approximate', ['mood'], ['eq.note.negation-added', 'eq.note.no-subjunctive']]]);
  });

  it('says why nothing corresponds, with the notes of the source links', () => {
    // Any source note will do: the derivation carries it without reading it.
    expect(run([link('SUPINE', 1, { note: 'eq.nl.gerund-as-participle' })], { p: [link('PRESENT', 1)] }))
      .toEqual(none('eq.nl.gerund-as-participle'));
    expect(run([link('SUPINE', 1)], {})).toEqual(none());
  });

  describe('within one language', () => {
    const map = {
      'indicative.t': [link('PAST_PERFECTIVE', 1, { register: 'literary' })],
      'indicative.sibling': [link('PAST_PERFECTIVE', 1)],
      'indicative.alone': [link('PAST_ANTERIOR', 1)],
      'indicative.near': [link('PLUPERFECT', 1)],
    };
    const same: EquivalenceData = { maps: { aa: map }, overrides: [], passiveLanguages: [] };

    it('puts the tense itself first, then its siblings', () => {
      const result = deriveEquivalents(same, 'aa', 'aa', 'indicative.t');
      expect(result.notes).toEqual([]);
      expect(result.matches).toEqual([
        { match: 'exact', tense: 'indicative.t', rank: 1, score: 1, register: 'literary', relaxed: [], via: ['PAST_PERFECTIVE', 'PAST_PERFECTIVE'], notes: [] },
        { match: 'exact', tense: 'indicative.sibling', rank: 2, score: 1, register: 'standard', relaxed: [], via: ['PAST_PERFECTIVE', 'PAST_PERFECTIVE'], notes: [] },
      ]);
    });

    it('never runs the ladder: a tense without a sibling is alone, never without a match', () => {
      // PLUPERFECT would answer PAST_ANTERIOR by relaxing aspect between two languages.
      expect(rows(deriveEquivalents(same, 'aa', 'aa', 'indicative.alone'))).toEqual([['indicative.alone', 1, 'exact', [], []]]);
    });
  });

  describe('pair overrides', () => {
    const target = {
      a: [link('PAST_PERFECTIVE', 1)],
      b: [link('PAST_PERFECTIVE', 0.5)],
      c: [link('PRESENT', 1, { register: 'literary' })],
    };
    const source = [link('PAST_PERFECTIVE', 1)];
    const withOverride = (mode: RawOverride['mode'], result: RawOverride['result']) => deriveEquivalents(
      data(source, target, { overrides: [{ from: 'aa', to: 'bb', tense: 'indicative.t', mode, result, reason: 'a test override, long enough to read' }] }),
      'aa', 'bb', 'indicative.t',
    );

    it('replaces the list', () => {
      const result = withOverride('replace', [{ tense: 'c', note: 'eq.pair.subjunctive-clause' }, { tense: 'b' }]);
      expect(result.matches).toEqual([
        { match: 'override', tense: 'c', rank: 1, score: 1, register: 'literary', relaxed: [], via: null, notes: ['eq.pair.subjunctive-clause'] },
        { match: 'override', tense: 'b', rank: 2, score: 1, register: 'standard', relaxed: [], via: null, notes: [] },
      ]);
    });

    it('prepends to the list, removing the same tenses from what follows', () => {
      const result = withOverride('prepend', [{ tense: 'b' }]);
      expect(result.matches.map(entry => [entry.tense, entry.rank, entry.match, entry.score])).toEqual([['b', 1, 'override', 1], ['a', 2, 'exact', 1]]);
    });

    it('excludes tenses from the list', () => {
      expect(withOverride('exclude', [{ tense: 'a' }]).matches.map(entry => [entry.tense, entry.rank, entry.score])).toEqual([['b', 1, 0.5]]);
    });

    it('says why nothing corresponds when an exclusion empties the list', () => {
      expect(withOverride('exclude', [{ tense: 'a' }, { tense: 'b' }])).toEqual(none());
    });

    it('applies only to its own pair and tense', () => {
      const overrides: RawOverride[] = [{ from: 'bb', to: 'aa', tense: 'indicative.t', mode: 'exclude', result: [{ tense: 'a' }], reason: 'the other direction, long enough to read' }];
      expect(rows(deriveEquivalents(data(source, target, { overrides }), 'aa', 'bb', 'indicative.t')).map(([tense]) => tense)).toEqual(['a', 'b']);
    });
  });

  describe('voice', () => {
    const source = [link('PAST_PERFECTIVE', 1)];
    const target = { a: [link('PAST_PERFECTIVE', 1)], b: [link('PAST_PERFECTIVE', 0.5, { note: 'eq.nl.perfect.spoken-past' })] };
    const passive = { voice: 'passive' } as const;
    const call = (passiveLanguages: readonly string[], from = 'aa', to = 'bb', links: readonly ConceptLink[] = source) =>
      deriveEquivalents(data(links, target, { passiveLanguages }), from, to, 'indicative.t', passive);

    it('leaves the list as it is when both languages have a passive', () => {
      expect(call(['aa', 'bb'])).toEqual(run(source, target));
    });

    it('flags every match approximate with a note when the target has no modelled passive', () => {
      const result = call(['aa']);
      expect(rows(result)).toEqual([
        ['a', 1, 'approximate', [], ['eq.note.passive-not-modelled']],
        ['b', 0.5, 'approximate', [], ['eq.nl.perfect.spoken-past', 'eq.note.passive-not-modelled']],
      ]);
      expect(result.notes).toEqual([]);
    });

    it('leaves a lookup without a match as it is', () => {
      expect(call(['aa'], 'aa', 'bb', [link('SUPINE', 1)])).toEqual(none());
    });

    it('treats the active voice as no voice at all', () => {
      expect(deriveEquivalents(data(source, target), 'aa', 'bb', 'indicative.t', { voice: 'active' })).toEqual(run(source, target));
    });

    it('rejects a passive lookup from a language without a modelled passive', () => {
      expect(() => call(['aa'], 'bb', 'aa')).toThrow(ConjugationError);
      try {
        call(['aa'], 'bb', 'aa');
      } catch (error) {
        expect((error as ConjugationError).code).toBe('INVALID_REQUEST');
      }
    });
  });

  it('returns frozen results', () => {
    const result = run([link('PAST_PERFECTIVE', 1)], { a: [link('PAST_PERFECTIVE', 1)] });
    expect(Object.isFrozen(result)).toBe(true);
    expect(Object.isFrozen(result.matches)).toBe(true);
    expect(Object.isFrozen(result.notes)).toBe(true);
    expect(Object.isFrozen(result.matches[0])).toBe(true);
    expect(Object.isFrozen(result.matches[0]?.notes)).toBe(true);
    expect(Object.isFrozen(result.matches[0]?.relaxed)).toBe(true);
    expect(Object.isFrozen(result.matches[0]?.via)).toBe(true);
    expect(Object.isFrozen(run([link('SUPINE', 1)], {}).notes)).toBe(true);
  });
});
