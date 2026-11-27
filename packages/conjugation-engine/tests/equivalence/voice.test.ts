/**
 * The passive voice (plan B4): Latin is the only language whose passive is modelled. A passive Latin tense looks up the
 * concepts of the active one; into a language without a modelled passive its matches are the active tenses, flagged.
 */
import { describe, expect, it } from 'vitest';
import { getCatalogue } from '../../src/catalogue.js';
import { equivalentTenses, passiveLanguages, passiveTenses } from '../../src/equivalence/index.js';
import { ConjugationError } from '../../src/errors.js';

const perfect = { mood: 'indicative', tense: 'perfect' } as const;
const passive = { voice: 'passive' } as const;

describe('a passive lookup', () => {
  it('models the passive of Latin only, for the tenses its catalogue voices', () => {
    expect(passiveLanguages).toEqual(['la']);
    expect(passiveTenses.la).toEqual(getCatalogue('la').filter(entry => entry.voices?.includes('passive')).map(entry => `${entry.mood}.${entry.tense}`));
    expect(passiveTenses.la).toHaveLength(15);
  });

  it('within Latin, is the active lookup', () => {
    expect(equivalentTenses('la', 'la', perfect, passive)).toEqual(equivalentTenses('la', 'la', perfect));
  });

  it('into a language without a modelled passive, gives the active tenses, approximate, with a note', () => {
    const active = equivalentTenses('la', 'fr', perfect);
    const result = equivalentTenses('la', 'fr', perfect, passive);
    expect(result.matches.map(entry => entry.tense)).toEqual(active.matches.map(entry => entry.tense));
    expect(result.matches.map(entry => entry.score)).toEqual(active.matches.map(entry => entry.score));
    for (const entry of result.matches) {
      expect(entry.match).toBe('approximate');
      expect(entry.notes.at(-1)).toBe('eq.note.passive-not-modelled');
    }
    expect(result.matches[0]).toMatchObject({
      tense: { mood: 'indicative', tense: 'perfect' }, score: 1, notes: ['eq.la.perfect-both', 'eq.fr.perfect.spoken-past', 'eq.note.passive-not-modelled'],
    });
    expect(result.notes).toEqual([]);
  });

  it('keeps an override an override, with the note', () => {
    const [first] = equivalentTenses('la', 'nl', { mood: 'subjunctive', tense: 'imperfect' }, passive).matches;
    expect([first?.match, first?.notes]).toEqual(['override', ['eq.pair.subjunctive-clause', 'eq.note.passive-not-modelled']]);
  });

  it('leaves a lookup without a match as it is', () => {
    const supine = { mood: 'supine', tense: 'present' } as const;
    expect(equivalentTenses('la', 'fr', supine, passive)).toEqual(equivalentTenses('la', 'fr', supine));
    expect(equivalentTenses('la', 'fr', supine, passive)).toEqual({ matches: [], notes: ['eq.note.no-counterpart', 'eq.la.supine'] });
  });

  it('treats a tense without a voice (a participle, the gerund, the supine) as active', () => {
    const participle = { mood: 'participle', tense: 'perfect' } as const;
    expect(equivalentTenses('la', 'fr', participle, passive)).toEqual(equivalentTenses('la', 'fr', participle));
  });

  it('is rejected from a language without a modelled passive', () => {
    expect(() => equivalentTenses('fr', 'la', { mood: 'indicative', tense: 'perfect' }, passive)).toThrow(ConjugationError);
    try {
      equivalentTenses('fr', 'la', { mood: 'indicative', tense: 'perfect' }, passive);
    } catch (error) {
      expect((error as ConjugationError).code).toBe('INVALID_REQUEST');
    }
  });
});
