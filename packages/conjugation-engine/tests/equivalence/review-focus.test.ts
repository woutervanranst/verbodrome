/**
 * The five points of the plan's "Review Focus", as explicit tests (the matrix snapshot shows them too, but a snapshot
 * can be regenerated past a regression). They follow the controller's rulings: a lookup without a counterpart has no
 * match and says why in its own notes; the French passé composé gives the English simple past first.
 */
import { describe, expect, it } from 'vitest';
import { equivalentTenses, maps } from '../../src/equivalence/index.js';
import type { EquivalenceOptions } from '../../src/equivalence/index.js';
import type { Language } from '../../src/types.js';

type Result = ReturnType<typeof equivalentTenses>;

const all: readonly Language[] = ['de', 'en', 'es', 'fr', 'it', 'la', 'nl'];

function lookup(from: Language, tense: string, to: Language, options?: EquivalenceOptions): Result {
  const dot = tense.indexOf('.');
  const ref = { mood: tense.slice(0, dot), tense: tense.slice(dot + 1) } as Parameters<typeof equivalentTenses>[2];
  return equivalentTenses(from, to, ref, options);
}

/** The matches as `[tense, score, match, register]`. */
const ranked = (result: Result) =>
  result.matches.map(entry => [`${entry.tense.mood}.${entry.tense.tense}`, entry.score, entry.match, entry.register]);

const top = (from: Language, tense: string, to: Language) => {
  const entry = lookup(from, tense, to).matches[0];
  return entry && { tense: `${entry.tense.mood}.${entry.tense.tense}`, score: entry.score, match: entry.match, relaxed: entry.relaxed, notes: entry.notes };
};

describe('1. A tense with no counterpart', () => {
  for (const [tense, note] of [
    ['supine.present', 'eq.la.supine'], ['participle.gerundive', 'eq.la.gerundive'],
    ['participle.future', 'eq.la.participle-future'], ['infinitive.future', 'eq.la.infinitive-future'],
  ] as const) {
    it(`Latin ${tense} has no match in any other language, and says why`, () => {
      for (const to of all.filter(code => code !== 'la')) {
        expect(lookup('la', tense, to), to).toEqual({ matches: [], notes: ['eq.note.no-counterpart', note] });
      }
    });
  }

  it('an English progressive always has a match, and the present progressive is the Dutch present', () => {
    const progressives = ['indicative.present_progressive', 'indicative.past_progressive', 'indicative.perfect_progressive',
      'indicative.pluperfect_progressive', 'indicative.future_progressive', 'indicative.future_perfect_progressive',
      'conditional.present_progressive', 'conditional.past_progressive'];
    for (const tense of progressives) {
      for (const to of all) expect(lookup('en', tense, to).matches.length, `${tense} -> ${to}`).toBeGreaterThan(0);
    }
    expect(top('en', 'indicative.present_progressive', 'nl'))
      .toEqual({ tense: 'indicative.present', score: 0.9, match: 'exact', relaxed: [], notes: ['eq.en.progressive'] });
  });

  it('a passive Latin tense into a language without a modelled passive gives its active tenses, approximate', () => {
    for (const to of ['fr', 'nl'] as const) {
      const active = lookup('la', 'indicative.perfect', to);
      const passive = lookup('la', 'indicative.perfect', to, { voice: 'passive' });
      expect(passive.matches.map(entry => entry.tense)).toEqual(active.matches.map(entry => entry.tense));
      for (const entry of passive.matches) {
        expect(entry.match, to).not.toBe('exact');
        expect(entry.notes.at(-1), to).toBe('eq.note.passive-not-modelled');
      }
    }
  });
});

describe('2. A literary tense', () => {
  it('never outranks a standard tense of equal score (Latin perfect into French)', () => {
    expect(ranked(lookup('la', 'indicative.perfect', 'fr')).slice(0, 2))
      .toEqual([['indicative.perfect', 1, 'exact', 'standard'], ['indicative.simple_past', 1, 'exact', 'literary']]);
  });

  it('never outranks a standard tense of equal score anywhere in the matrix', () => {
    const rank = { standard: 0, literary: 1, dated: 2 } as const;
    for (const from of all) {
      for (const tense of Object.keys(maps[from])) {
        for (const to of all) {
          const found = lookup(from, tense, to).matches.filter(entry => entry.match !== 'override' && entry.rank > (from === to ? 1 : 0));
          found.forEach((entry, index) => {
            const before = found[index - 1];
            if (before && before.score === entry.score) expect(rank[before.register], `${from} ${tense} -> ${to}`).toBeLessThanOrEqual(rank[entry.register]);
          });
        }
      }
    }
  });

  // Ruling I6: the register is the last rung of the ladder. "Er sagt, er werde kommen" is "dice que vendrá", never the
  // archaic futuro de subjuntivo, which is offered only when even relaxing the mood finds nothing.
  it('offers a dated tense only when even relaxing the mood finds nothing', () => {
    expect(top('de', 'subjunctive.future', 'es')).toMatchObject({ tense: 'indicative.future', match: 'approximate', relaxed: ['mood'] });
    expect(top('de', 'subjunctive.future_perfect', 'es')).toMatchObject({ tense: 'indicative.future_perfect', match: 'approximate', relaxed: ['mood'] });
    for (const from of all.filter(code => code !== 'es')) {
      for (const tense of Object.keys(maps[from])) {
        expect(lookup(from, tense, 'es').matches.map(entry => entry.register), `${from} ${tense}`).not.toContain('dated');
      }
    }
    expect(top('es', 'subjunctive.future', 'es')).toMatchObject({ tense: 'subjunctive.future', match: 'exact' });
  });

  it('carries the register of the target tense', () => {
    expect(ranked(lookup('fr', 'indicative.simple_past', 'it'))[0]).toEqual(['indicative.simple_past', 1, 'exact', 'literary']);
    expect(ranked(lookup('it', 'indicative.past_anterior', 'es'))[0]).toEqual(['indicative.past_anterior', 1, 'exact', 'literary']);
  });
});

describe('3. A subjunctive or conditional into a language without one', () => {
  it('the French subjunctives give the Dutch indicative of the same time, as the app does', () => {
    for (const [french, dutch] of [['subjunctive.present', 'indicative.present'], ['subjunctive.past', 'indicative.perfect'],
      ['subjunctive.imperfect', 'indicative.past'], ['subjunctive.pluperfect', 'indicative.pluperfect']] as const) {
      expect(top('fr', french, 'nl'), french).toEqual({ tense: dutch, score: 1, match: 'approximate', relaxed: ['mood'], notes: ['eq.note.no-subjunctive'] });
    }
  });

  it('the English present subjunctive gives the Dutch present', () => {
    expect(top('en', 'subjunctive.present', 'nl')).toEqual({
      tense: 'indicative.present', score: 1, match: 'approximate', relaxed: ['mood'], notes: ['eq.en.subjunctive-mandative', 'eq.note.no-subjunctive'],
    });
  });

  it('the Latin present and perfect subjunctives give the Dutch present and perfect', () => {
    expect(top('la', 'subjunctive.present', 'nl')).toMatchObject({ tense: 'indicative.present', match: 'approximate', relaxed: ['mood'], notes: ['eq.note.no-subjunctive'] });
    expect(top('la', 'subjunctive.perfect', 'nl')).toMatchObject({ tense: 'indicative.perfect', match: 'approximate', relaxed: ['mood'], notes: ['eq.note.no-subjunctive'] });
  });

  it('German Konjunktiv I gives the Dutch present, and its future the French future', () => {
    expect(top('de', 'subjunctive.present', 'nl')).toEqual({
      tense: 'indicative.present', score: 1, match: 'approximate', relaxed: ['mood'], notes: ['eq.de.subjunctive-reported', 'eq.note.no-subjunctive'],
    });
    expect(top('de', 'subjunctive.future', 'fr')).toMatchObject({ tense: 'indicative.future', match: 'approximate', relaxed: ['mood'] });
  });

  it('a negative imperative into a language without one is the plain imperative, with a note', () => {
    for (const from of ['es', 'it'] as const) {
      for (const to of ['fr', 'nl', 'de', 'en', 'la'] as const) {
        expect(top(from, 'imperative.negative', to), `${from} -> ${to}`)
          .toEqual({ tense: 'imperative.present', score: 0.6, match: 'exact', relaxed: [], notes: ['eq.note.negation-added'] });
      }
    }
  });
});

describe('4. The passé composé against the simple past and the present perfect', () => {
  it('French to Dutch and back is not symmetric', () => {
    expect(ranked(lookup('fr', 'indicative.perfect', 'nl'))).toEqual([['indicative.perfect', 0.8, 'exact', 'standard'], ['indicative.past', 0.7, 'exact', 'standard']]);
    expect(ranked(lookup('fr', 'indicative.simple_past', 'nl'))).toEqual([['indicative.past', 0.7, 'exact', 'standard'], ['indicative.perfect', 0.6, 'exact', 'standard']]);
    expect(ranked(lookup('nl', 'indicative.past', 'fr'))).toEqual([
      ['indicative.imperfect', 1, 'exact', 'standard'], ['indicative.perfect', 0.7, 'exact', 'standard'], ['indicative.simple_past', 0.7, 'exact', 'literary'],
    ]);
  });

  it('French and Spanish give each other their perfective pasts first', () => {
    expect(top('fr', 'indicative.perfect', 'es')).toMatchObject({ tense: 'indicative.simple_past', score: 1, match: 'exact' });
    expect(top('es', 'indicative.simple_past', 'fr')).toMatchObject({ tense: 'indicative.perfect', score: 1, match: 'exact' });
  });

  it('the passé composé gives the English simple past first, the present perfect second with a note', () => {
    const [first, second] = lookup('fr', 'indicative.perfect', 'en').matches;
    expect([first?.tense, first?.match]).toEqual([{ mood: 'indicative', tense: 'past' }, 'override']);
    expect([second?.tense, second?.match, second?.notes]).toEqual([{ mood: 'indicative', tense: 'perfect' }, 'override', ['eq.pair.fr-en.perfect-result']]);
    expect(top('en', 'indicative.past', 'fr')).toMatchObject({ tense: 'indicative.perfect', score: 0.6 });
  });
});

describe('5. Non-finite forms', () => {
  it('a French gerund is a Dutch present participle; the compound forms use Dutch stand-ins', () => {
    expect(top('fr', 'gerund.present', 'nl')).toEqual({ tense: 'participle.present', score: 0.5, match: 'exact', relaxed: [], notes: ['eq.nl.gerund-as-participle'] });
    for (const [french, note] of [['infinitive.past', 'eq.nl.compound-inf-perfect'], ['participle.perfect', 'eq.nl.compound-part-perfect'],
      ['gerund.past', 'eq.nl.compound-gerund-perfect'], ['imperative.past', 'eq.nl.compound-imp-perfect']] as const) {
      expect(top('fr', french, 'nl'), french).toEqual({ tense: 'participle.past', score: 0.4, match: 'approximate', relaxed: [], notes: [note] });
    }
  });

  it('a stand-in is offered only when its language is the target', () => {
    expect(ranked(lookup('nl', 'participle.past', 'fr'))).toEqual([['participle.past', 1, 'exact', 'standard']]);
  });

  it('German has no gerund at all', () => {
    expect(lookup('fr', 'gerund.present', 'de')).toEqual({ matches: [], notes: ['eq.note.no-counterpart'] });
    expect(lookup('es', 'gerund.present', 'de')).toEqual({ matches: [], notes: ['eq.note.no-counterpart'] });
  });
});
