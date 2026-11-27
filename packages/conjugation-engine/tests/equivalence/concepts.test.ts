import { describe, expect, it } from 'vitest';
import { concepts, link, moodRelaxation } from '../../src/equivalence/concepts.js';
import type { ConceptDef } from '../../src/equivalence/concepts.js';

const ids = Object.keys(concepts) as (keyof typeof concepts)[];

/** The dimensions that tell two concepts apart, as one string. */
const signature = (def: ConceptDef): string =>
  JSON.stringify([def.finiteness, def.mood, def.time, def.relative, def.aspect, def.remoteness ?? null, def.polarity ?? null]);

describe('tense concepts', () => {
  it('has the 41 concepts of the inventory, in its order', () => {
    expect(ids).toHaveLength(41);
    expect([ids[0], ids[16], ids[40]]).toEqual(['PRESENT', 'COND_PRESENT', 'SUPINE']);
  });

  it('never gives two concepts the same dimensions', () => {
    const seen = new Map<string, string>();
    for (const id of ids) {
      const key = signature(concepts[id]);
      expect(seen.get(key), `${id} has the dimensions of ${seen.get(key)}`).toBeUndefined();
      seen.set(key, id);
    }
  });

  it('defines the concepts the plan corrects against note N7', () => {
    expect(concepts.NEAR_FUTURE).toEqual({
      finiteness: 'finite', mood: 'indicative', time: 'present', relative: 'posterior', aspect: 'neutral', remoteness: 'near',
    });
    expect(concepts.PART_PAST.time).toBe('past');
    expect(concepts.PART_PERFECT.time).toBe('present');
    expect(concepts.SUBJ_IMPERFECT.aspect).toBe('imperfective');
    expect(concepts.SUPINE.finiteness).toBe('supine');
    expect(concepts.GERUNDIVE.finiteness).toBe('verbalAdjective');
    expect(concepts.IMP_NEGATIVE.polarity).toBe('negative');
  });

  it('gives a mood to exactly the finite concepts', () => {
    for (const id of ids) {
      const def = concepts[id];
      if (def.finiteness === 'finite') expect(def.mood, id).not.toBeNull();
      else expect(def.mood, id).toBeNull();
    }
  });

  it('builds a link with only the keys it was given', () => {
    expect(link('PRESENT', 1)).toStrictEqual({ concept: 'PRESENT', weight: 1 });
    expect(Object.keys(link('PRESENT', 1))).toEqual(['concept', 'weight']);
    expect(link('PRESENT', 0.5, { note: 'eq.nl.present-future' })).toStrictEqual({ concept: 'PRESENT', weight: 0.5, note: 'eq.nl.present-future' });
    expect(link('PAST_PERFECTIVE', 1, { register: 'literary', only: 'target', note: 'eq.nl.compound-inf-perfect' }))
      .toStrictEqual({ concept: 'PAST_PERFECTIVE', weight: 1, register: 'literary', only: 'target', note: 'eq.nl.compound-inf-perfect' });
  });

  it('relaxes the subjunctive and the conditional to the indicative, and nothing else', () => {
    expect(moodRelaxation).toEqual({ subjunctive: ['indicative'], conditional: ['indicative'] });
  });
});
