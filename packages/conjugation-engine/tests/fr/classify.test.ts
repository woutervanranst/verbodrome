/**
 * French classification (GD §3) through the shadow engine: the model a verb follows, where that came from, the
 * assumptions made, the 1990 infinitives, and the errors a bad hint gives.
 */
import { describe, expect, it } from 'vitest';
import { classifyFrench } from '../../src/languages/fr/classify.js';
import { characterize } from '../../scripts/characterize/serialize.ts';
import { engine as shadow } from '../../src/default-engine.js';

const shadowFrench = (query: { readonly language: 'fr'; readonly infinitive: string }) => characterize(query);

const analysis = (infinitive: string, options: Readonly<Record<string, unknown>> = {}) =>
  shadow.conjugate({ language: 'fr', infinitive, mood: 'indicative', tense: 'present', ...options }).analysis;

describe('French classification', () => {
  it.each([
    ['parler', 'aimer', 'regularRule'], ['placer', 'placer', 'regularRule'], ['lever', 'lever', 'regularRule'],
    ['appeler', 'appeler', 'lexicon'], ['finir', 'finir', 'regularRule'], ['rendre', 'rendre', 'regularRule'],
    ['venir', 'venir', 'lexicon'], ['conduire', 'cuire', 'lexicon'], ['bleder', 'lever', 'regularRule'],
  ])('labels %s as %s (%s)', (infinitive, model, source) => {
    const result = analysis(infinitive);
    expect([result.classification, result.classificationSource]).toEqual([model, source]);
  });

  it('reproduces the legacy assumption sentences', () => {
    expect(analysis('blouper').assumptions).toEqual([
      'blouper uses the regular er model; lexical meaning and nonproductive classes cannot be inferred from spelling.',
      'An unlisted non-reflexive verb defaults to avoir.',
    ]);
    expect(analysis('conduire').assumptions).toEqual(['conduire is inflected like cuire from its -uire ending.']);
    expect(analysis('s\'asseoir').assumptions).toEqual(['The reflexive pronoun is assumed direct; specify indirect-object context when needed.']);
    expect(analysis('hérouper').assumptions).toContain('An unlisted initial h is assumed mute.');
  });

  it('maps 1990 infinitives to the traditional lemma', () => {
    expect(shadow.conjugate({ language: 'fr', infinitive: 'assoir', mood: 'infinitive' }).verbId).toBe('asseoir');
    expect(shadow.conjugate({ language: 'fr', infinitive: 'interpeler', mood: 'infinitive' }).verbId).toBe('interpeller');
    const [, ...rectified] = shadowFrench({ language: 'fr', infinitive: 'connaitre' });
    const [, ...traditional] = shadowFrench({ language: 'fr', infinitive: 'connaître' });
    expect(rectified).toEqual(traditional);
    expect(rectified[0]).toBe('A\tconnaître\tconnaître\tlexicon\t0\tavoir\tconnaître is inflected like connaître from its -aître ending.');
  });

  it('keeps the legacy hint errors', () => {
    const code = (options: Readonly<Record<string, unknown>>) => {
      try {
        shadow.conjugate({ language: 'fr', mood: 'indicative', tense: 'present', ...options });
        return 'none';
      } catch (error) {
        return (error as { code: string }).code;
      }
    };
    expect(code({ infinitive: 'ressortir', model: 'aimer' })).toBe('INVALID_HINT');
    expect(code({ infinitive: 'ressortir', model: 'finir', classHint: 're' })).toBe('INVALID_HINT');
    expect(code({ infinitive: 'glouloir' })).toBe('AMBIGUOUS_CLASSIFICATION');
    expect(code({ infinitive: 'dormir', precedingDirectObject: { gender: 'feminine', number: 'plural' } })).toBe('INVALID_HINT');
    expect(code({ infinitive: 'bl0uper' })).toBe('INVALID_INFINITIVE');
  });

  it('returns payer as two paradigms in order', () => {
    const paradigms = classifyFrench({ language: 'fr', infinitive: 'payer' });
    expect(paradigms.map(outcome => outcome.tags.pattern)).toEqual(['y-to-i', 'keep-y']);
    expect(paradigms.map(outcome => outcome.steps.at(-1)?.rule)).not.toContain(undefined);
    expect(analysis('payer').alternatives).toHaveLength(1);
  });

  it('takes the auxiliaries from the lists, the reflexive and the hint', () => {
    expect(analysis('aller').auxiliaries).toEqual(['être']);
    expect(analysis('monter').auxiliaries).toEqual(['avoir', 'être']);
    expect(analysis('se laver').auxiliaries).toEqual(['être']);
    expect(analysis('monter', { auxiliary: 'avoir' }).auxiliaries).toEqual(['avoir']);
    expect(analysis('se laver').reflexive).toBe(true);
    expect(shadow.conjugate({ language: 'fr', infinitive: 'se laver', mood: 'infinitive' }).verbId).toBe('se laver');
    expect(shadow.conjugate({ language: 'fr', infinitive: 's\'asseoir', mood: 'infinitive' }).verbId).toBe('s\'asseoir');
  });
});
