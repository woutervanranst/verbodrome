/**
 * The Dutch staged grammar's first stages: classification (with the assumptions made for a verb the lexicon does not
 * know) and the present stem, each recorded as rule steps. The legacy resolver is the specification: the English
 * assumption sentences are the ones the frozen snapshot holds in its `A` lines.
 */
import { describe, expect, it } from 'vitest';
import type { DerivationStep } from '../../src/core/derivation.js';
import type { Cell } from '../../src/core/staged.js';
import { renderStep } from '../../src/i18n/explain.js';
import { locales } from '../../src/i18n/locales/index.js';
import { dutchGrammar } from '../../src/languages/nl/grammar.js';
import type { DutchLexeme } from '../../src/languages/nl/lexicon.js';
import { dutchPack } from '../../src/languages/nl/pack.js';

const present1sg: Cell = { kind: 'finite', mood: 'indicative', tense: 'present', person: 1, number: 'singular' };

/** The one paradigm `classify` returns for a query, with its classification steps. */
function classified(infinitive: string, options: Readonly<Record<string, unknown>> = {}): { lexeme: DutchLexeme; steps: readonly DerivationStep[] } {
  const paradigms = dutchGrammar.classify({ language: 'nl', infinitive, ...options });
  expect(paradigms).toHaveLength(1);
  return { lexeme: paradigms[0]!.value, steps: paradigms[0]!.steps };
}

/** The present stem the grammar's `stem` hook gives, with its steps as `rule: before -> after`. */
function stemOf(infinitive: string, options: Readonly<Record<string, unknown>> = {}): { stem: string; steps: string[] } {
  const stems = dutchGrammar.stem(classified(infinitive, options).lexeme, present1sg);
  expect(stems).toHaveLength(1);
  return { stem: stems[0]!.value, steps: stems[0]!.steps.map(s => `${s.rule}: ${s.before} -> ${s.after}`) };
}

const english = (steps: readonly DerivationStep[]): string[] =>
  steps.map(s => renderStep(s, { pack: dutchPack, catalog: locales.en, locale: 'en', mood: null }));
const assumptions = (infinitive: string, options: Readonly<Record<string, unknown>> = {}): string[] =>
  english(classified(infinitive, options).steps.filter(s => s.kind === 'assumption'));

/** The four sentences the legacy engine records for an unlisted verb (the snapshot's `A` lines). */
const unlisted = {
  weak: 'An unlisted Dutch verb defaults to the weak native model.',
  syllables: 'Ordinary open/closed syllables are inferred; use a stem or stress hint when pronunciation differs.',
  hebben: 'An unlisted verb defaults to hebben; lexical meaning may require zijn.',
  prefix: 'No separable particle or unstressed prefix is read in this verb, so it is conjugated as a verb without one.',
};

describe('Dutch present stem', () => {
  it.each([
    ['werken', 'werk', ['nl.stem.drop-en: werken -> werk']],
    ['bakken', 'bak', ['nl.stem.drop-en: bakken -> bakk', 'nl.stem.undouble-consonant: bakk -> bak']],
    ['lopen', 'loop', ['nl.stem.drop-en: lopen -> lop', 'nl.stem.lengthen-vowel: lop -> loop']],
    ['leven', 'leef', ['nl.stem.drop-en: leven -> lev', 'nl.stem.lengthen-vowel: lev -> leev', 'nl.stem.devoice: leev -> leef']],
    ['reizen', 'reis', ['nl.stem.drop-en: reizen -> reiz', 'nl.stem.devoice: reiz -> reis']],
    ['wandelen', 'wandel', ['nl.stem.drop-en: wandelen -> wandel', 'nl.stem.unstressed-e: wandel -> wandel']],
    // Invented verbs: the same rules, nothing listed.
    ['zorven', 'zorf', ['nl.stem.drop-en: zorven -> zorv', 'nl.stem.devoice: zorv -> zorf']],
    ['trapen', 'traap', ['nl.stem.drop-en: trapen -> trap', 'nl.stem.lengthen-vowel: trap -> traap']],
    ['kunnen', 'kan', ['nl.stem.lexical: kunnen -> kan']],
  ])('%s: %s-', (infinitive, stem, steps) => {
    expect(stemOf(infinitive)).toEqual({ stem, steps });
  });

  it('keeps the underlying v or z that the written stem hides', () => {
    expect(classified('leven').lexeme.stem).toMatchObject({ written: 'leef', underlying: 'leev' });
    expect(classified('reizen').lexeme.stem).toMatchObject({ written: 'reis', underlying: 'reiz' });
    expect(classified('werken').lexeme.stem).toMatchObject({ written: 'werk', underlying: 'werk' });
  });

  it('follows the stress the lexicon or a hint gives', () => {
    // proberen: the lexicon says the last syllable is stressed, so the e is long.
    expect(stemOf('proberen').stem).toBe('probeer');
    expect(stemOf('zorpelen', { stems: { unstressedFinalSyllable: false } }).stem).toBe('zorpeel');
    expect(stemOf('trapen', { stems: { unstressedFinalSyllable: true } })).toEqual({
      stem: 'trap', steps: ['nl.stem.drop-en: trapen -> trap', 'nl.stem.unstressed-e: trap -> trap'],
    });
    // A hinted stress can keep any vowel single, so the message does not name the e.
    const hinted = dutchGrammar.stem(classified('trapen', { stems: { unstressedFinalSyllable: true } }).lexeme, present1sg)[0]!.steps;
    expect(english(hinted.slice(1))).toEqual(['The last syllable of trap- is unstressed, so its vowel is not written double: the stem stays trap-.']);
  });

  it('does not count an unstressed prefix when it infers stress', () => {
    // herinneren: her- is left out, so inner has two syllables and its e is unstressed.
    expect(stemOf('herinneren').stem).toBe('herinner');
    // The same verb shape with an inseparable prefix given: ver + teren, one syllable, a long e.
    expect(stemOf('verteren', { inseparablePrefix: 'ver' }).stem).toBe('teer');
  });

  it('forms the stem of a derivative from its base verb', () => {
    expect(stemOf('verwerken')).toEqual({ stem: 'werk', steps: ['nl.stem.drop-en: werken -> werk'] });
    expect(stemOf('opstaan')).toEqual({ stem: 'sta', steps: ['nl.stem.lexical: staan -> sta'] });
  });

  it('takes a listed loan stem or a hinted stem as it is', () => {
    expect(stemOf('skaten')).toEqual({ stem: 'skate', steps: ['nl.stem.lexical: skaten -> skate'] });
    expect(stemOf('zorpen', { stems: { stem: 'zorv' } })).toEqual({
      stem: 'zorf', steps: ['nl.stem.lexical: zorpen -> zorv', 'nl.stem.devoice: zorv -> zorf'],
    });
  });

  it('cannot form a stem without -en and without a listed stem', () => {
    expect(() => classified('blaan')).toThrow(expect.objectContaining({ code: 'AMBIGUOUS_CLASSIFICATION' }));
    expect(stemOf('blaan', { stems: { stem: 'bla' } }).stem).toBe('bla');
    // misstaan is mis- + staan, whose stem is listed.
    expect(stemOf('misstaan')).toEqual({ stem: 'sta', steps: ['nl.stem.lexical: staan -> sta'] });
  });
});

describe('Dutch classification', () => {
  it('records the four assumptions for an unlisted verb, in English as the snapshot has them (the last through its sentence-level ledger entry)', () => {
    expect(assumptions('zorpen')).toEqual([unlisted.weak, unlisted.syllables, unlisted.hebben, unlisted.prefix]);
    const { lexeme } = classified('zorpen');
    expect(lexeme).toMatchObject({ lemma: 'zorpen', verbId: 'zorpen', classId: 'weak', classSource: 'regularRule', auxiliaries: ['hebben'] });
  });

  it('drops each assumption that a hint or the lexicon answers', () => {
    expect(assumptions('zorpen', { classHint: 'weak' })).toEqual([unlisted.syllables, unlisted.hebben, unlisted.prefix]);
    expect(assumptions('zorpen', { stems: { stem: 'zorp' } })).toEqual([unlisted.weak, unlisted.hebben, unlisted.prefix]);
    expect(assumptions('zorpen', { stems: { unstressedFinalSyllable: true } })).toEqual([unlisted.weak, unlisted.hebben, unlisted.prefix]);
    expect(assumptions('zorpen', { auxiliary: 'zijn' })).toEqual([unlisted.weak, unlisted.syllables, unlisted.prefix]);
    expect(assumptions('opzorpen', { separablePrefix: 'op' })).toEqual([unlisted.weak, unlisted.syllables, unlisted.hebben]);
    // A listed derivative of an unlisted base: the prefix is known, the base's class and auxiliary are assumed.
    expect(assumptions('verwerken')).toEqual([unlisted.weak, unlisted.syllables, unlisted.hebben]);
    // A verb listed with its unstressed prefix is a checked weak verb: nothing is assumed (final review N3).
    expect(assumptions('betalen')).toEqual([]);
    expect(assumptions('lopen')).toEqual([]);
    expect(assumptions('downloaden')).toEqual([]);
  });

  it('records what the lexicon says about a listed verb', () => {
    const { lexeme, steps } = classified('lopen');
    expect(english(steps)).toEqual(['lopen is an irregular verb: its past tense, liep, is in the verb list.']);
    expect(lexeme).toMatchObject({ classId: 'strong', classSource: 'lexicon', auxiliaries: ['hebben', 'zijn'], defaultAuxiliaries: ['hebben', 'zijn'] });
    expect(lexeme.entry.pastSingular).toEqual(['liep']);
    expect(english(classified('bakken').steps)).toEqual(['bakken is half irregular: its past tense is regular, its past participle gebakken is in the verb list.']);
    // wandelen is listed for its auxiliaries only, kopen for its irregular past tense (not a strong one).
    expect(english(classified('wandelen').steps)).toEqual(['wandelen is a weak verb; the verb list records which auxiliary it takes.']);
    expect(english(classified('kopen').steps)).toEqual(['kopen is an irregular verb: its past tense, kocht, is in the verb list.']);
  });

  it('records a separable and an inseparable prefix, and the base the forms are built on', () => {
    const opstaan = classified('opstaan');
    expect(opstaan.steps.map(s => s.rule)).toEqual(['nl.classify.separable', 'nl.classify.irregular']);
    expect(english(opstaan.steps)[0]).toBe('opstaan is a separable verb: op carries the stress and can stand apart from the verb.');
    expect(opstaan.lexeme).toMatchObject({ base: 'staan', particle: { text: 'op', separable: true }, inseparablePrefix: '', auxiliaries: ['zijn'] });
    const begrijpen = classified('begrijpen');
    expect(begrijpen.steps.map(s => s.rule)).toEqual(['nl.classify.inseparable', 'nl.classify.irregular']);
    expect(begrijpen.lexeme).toMatchObject({ base: 'grijpen', particle: { text: 'be', separable: false }, inseparablePrefix: 'be', classId: 'strong' });
    // beloven is listed with its unstressed prefix but is not a derivative: no particle, the stem keeps be-.
    expect(classified('beloven').lexeme).toMatchObject({ base: 'beloven', particle: null, inseparablePrefix: 'be' });
  });

  it('classifies loans, reflexives and the infinitives of zijn', () => {
    expect(classified('downloaden').steps.map(s => s.rule)).toEqual(['nl.classify.loan']);
    expect(classified('downloaden').lexeme).toMatchObject({ classId: 'loan', classSource: 'lexicon', loan: { stem: 'download', pastSuffix: 'd' } });
    expect(classified('zich vergissen').lexeme).toMatchObject({ lemma: 'vergissen', verbId: 'zich vergissen', reflexive: true });
    expect(classified('schamen').lexeme).toMatchObject({ verbId: 'zich schamen', reflexive: true });
    expect(classified('zijn').lexeme.infinitives).toEqual(['zijn', 'wezen']);
    expect(classified('werken', { auxiliary: 'zijn' }).lexeme).toMatchObject({ auxiliaries: ['zijn'], defaultAuxiliaries: ['hebben'] });
  });

  it('lifts the impersonal restrictions of a personal derivative', () => {
    expect(classified('vriezen').lexeme.entry).toMatchObject({ impersonal: true, noImperative: true });
    expect(classified('bevriezen').lexeme.entry).toMatchObject({ impersonal: false, singularOnly: false, noImperative: false });
  });

  it.each([
    ['zorp', {}, 'AMBIGUOUS_CLASSIFICATION'],
    ['zorpen', { classHint: 'loan' }, 'AMBIGUOUS_CLASSIFICATION'],
    ['zorpen', { classHint: 'strong' }, 'AMBIGUOUS_CLASSIFICATION'],
    ['lopen', { classHint: 'weak' }, 'INVALID_HINT'],
    ['opstaan', { inseparablePrefix: 'op' }, 'INVALID_HINT'],
    ['opstaan', { separablePrefix: 'o' }, 'INVALID_HINT'],
    ['opstaan', { separablePrefix: 'opstaan' }, 'INVALID_HINT'],
    ['beloven', { separablePrefix: 'be' }, 'INVALID_HINT'],
    ['vergissen', { reflexive: false }, 'INVALID_HINT'],
    ['komen', { auxiliary: 'hebben' }, 'INVALID_HINT'],
    ['zorp en', {}, 'INVALID_INFINITIVE'],
  ])('rejects %s with %j: %s', (infinitive, options, code) => {
    expect(() => classified(infinitive, options)).toThrow(expect.objectContaining({ code }));
  });

  it('gives a named verb its own lexeme without hints', () => {
    expect(dutchGrammar.lexemeOf('zullen')).toMatchObject({ lemma: 'zullen', classId: 'strong', stem: { written: 'zal' } });
    expect(dutchGrammar.lexemeOf('hebben')).toMatchObject({ lemma: 'hebben', auxiliaries: ['hebben'], stem: { written: 'heb' } });
  });
});
