import { describe, expect, it } from 'vitest';
import { createEngine, resolvedTargetKey, targetKey } from '../../src/core/engine.js';
import type { DerivationStep } from '../../src/core/derivation.js';
import type { Periphrasis } from '../../src/core/periphrasis.js';
import { stagedEngine, synthesize } from '../../src/core/staged.js';
import type { Cell } from '../../src/core/staged.js';
import { packs } from '../../src/languages/index.js';
import type { ConjugatedForm, ResolvedTarget } from '../../src/types.js';
import { toyGrammar, toyPack, toyRendering, toyRules } from '../toy/pack.js';
import type { ToyLexeme } from '../toy/pack.js';
import type { StagedGrammar } from '../../src/core/staged.js';

const toy = createEngine({ xx: toyPack });
type Query = Readonly<Record<string, unknown>>;

/** The one active-voice form a query yields (the toy's present and perfect also have a passive voice). */
function only(query: Query): ConjugatedForm {
  const forms = toy.conjugate(query).forms.filter(form => form.target.voice !== 'passive');
  expect(forms).toHaveLength(1);
  return forms[0]!;
}

const texts = (query: Query): string[] => toy.conjugate(query).forms.map(form => form.text);
const rules = (steps: readonly DerivationStep[] | undefined): string[] => (steps ?? []).map(s => s.rule);

/** An engine over the toy pack with a modified grammar. */
function toyWith(grammar: StagedGrammar<ToyLexeme>) {
  return createEngine({ xx: { ...toyPack, engine: query => stagedEngine(grammar, toyRendering, query) } });
}

describe('staged engine', () => {
  it('derives a simple form through stem, ending and spelling with one step each', () => {
    const form = only({ language: 'xx', infinitive: 'placa', mood: 'indicative', tense: 'present', person: 1, number: 'plural' });
    expect(form.text).toBe('nos placamos');
    expect(form.parts.at(-1)!.steps!.map(s => s.rule)).toEqual(['xx.stem.drop-a', 'xx.end.present']);
    const second = only({ language: 'xx', infinitive: 'placa', mood: 'indicative', tense: 'present', person: 2, number: 'plural' });
    expect(second.parts.at(-1)!.text).toBe('plaquetes');
    expect(second.parts.at(-1)!.steps!.map(s => s.rule)).toEqual(['xx.stem.drop-a', 'xx.end.present', 'xx.orth.c-qu']);
  });

  it('records each step with its before and after spelling and the rule parameters', () => {
    const verb = only({ language: 'xx', infinitive: 'placa', mood: 'indicative', tense: 'present', person: 2, number: 'plural' }).parts.at(-1)!;
    expect(verb.steps).toEqual([
      { rule: 'xx.stem.drop-a', stage: 'stem', kind: 'rule', before: 'placa', after: 'plac', params: {} },
      {
        rule: 'xx.end.present', stage: 'ending', kind: 'rule', before: 'plac', after: 'placetes',
        params: { ending: 'etes', person: { term: 'person', id: '2' }, number: { term: 'number', id: 'plural' } },
      },
      { rule: 'xx.orth.c-qu', stage: 'orthography', kind: 'rule', before: 'placetes', after: 'plaquetes', params: {} },
    ]);
  });

  it('conjugates the auxiliary through the same grammar', () => {
    const form = only({ language: 'xx', infinitive: 'zorpa', mood: 'indicative', tense: 'perfect', person: 3, number: 'singular' });
    expect(form.text).toBe('il habat zorpado');
    expect(form.steps!.map(s => s.rule)).toContain('xx.periphrasis.perfect');
    expect(form.parts.find(p => p.role === 'auxiliary')!.steps!.length).toBeGreaterThan(0);
    expect(form.parts.map(p => [p.role, p.text, p.lemma])).toEqual([
      ['subject', 'il', null], ['auxiliary', 'habat', 'haba'], ['lexicalVerb', 'zorpado', 'zorpa'],
    ]);
    expect(rules(form.parts[1]!.steps)).toEqual(['xx.stem.drop-a', 'xx.end.present']);
    expect(form.steps).toEqual([
      { rule: 'xx.periphrasis.perfect', stage: 'periphrasis', kind: 'rule', before: null, after: null, params: { auxiliary: 'haba' } },
    ]);
    expect(form.ruleIds).toEqual(['xx.periphrasis.perfect', 'xx.stem.drop-a', 'xx.end.present', 'xx.end.participle']);
    expect(form.variant).toEqual({ orthography: 'both', auxiliary: 'haba', pattern: null, usage: 'standard', condition: null, region: null });
  });

  it('forks over auxiliaries and agreement', () => {
    const result = toy.conjugate({ language: 'xx', infinitive: 'vena', mood: 'indicative', tense: 'perfect', person: 3, number: 'singular', voice: 'active' });
    expect(result.analysis.auxiliaries).toEqual(['haba', 'esta']);
    expect(result.forms.map(f => [f.text, f.variant.auxiliary, f.target.agreement])).toEqual([
      ['il habat venado', 'haba', null],
      ['il estat venado', 'esta', { gender: 'masculine', number: 'singular' }],
      ['il estat venada', 'esta', { gender: 'feminine', number: 'singular' }],
    ]);
    const feminine = result.forms[2]!;
    expect(feminine.steps).toEqual([
      { rule: 'xx.periphrasis.perfect', stage: 'periphrasis', kind: 'rule', before: null, after: null, params: { auxiliary: 'esta' } },
      { rule: 'xx.agree.gender', stage: 'clause', kind: 'rule', before: null, after: null, params: { gender: { term: 'gender', id: 'feminine' } } },
    ]);
    expect(feminine.parts.at(-1)!.features).toMatchObject({ gender: 'feminine', number: 'singular', verbForm: 'pastParticiple' });
  });

  it('places a separable particle and keeps it attached in non-finite forms', () => {
    const present = only({ language: 'xx', infinitive: 'apzorpa', mood: 'indicative', tense: 'present', person: 1, number: 'singular' });
    expect(present.text).toBe('mi zorpo ap');
    expect(present.parts.map(p => p.role)).toEqual(['subject', 'lexicalVerb', 'particle']);
    expect(present.steps).toEqual([
      { rule: 'xx.clause.particle-final', stage: 'clause', kind: 'rule', before: null, after: null, params: { particle: 'ap' } },
    ]);
    expect(rules(present.parts[1]!.steps)).toEqual(['xx.stem.drop-a', 'xx.end.present']);

    expect(only({ language: 'xx', infinitive: 'apzorpa', mood: 'indicative', tense: 'perfect', person: 3, number: 'singular' }).text)
      .toBe('il habat apzorpado');
    const participle = toy.conjugate({ language: 'xx', infinitive: 'apzorpa', mood: 'participle' }).forms;
    expect(participle.map(f => f.text)).toEqual(['apzorpado']);
    expect(participle[0]!.parts).toHaveLength(1);
    expect(participle[0]!.parts[0]!.steps!.at(-1)).toEqual(
      { rule: 'xx.clause.particle-attached', stage: 'clause', kind: 'rule', before: 'zorpado', after: 'apzorpado', params: { particle: 'ap' } },
    );
    expect(texts({ language: 'xx', infinitive: 'apzorpa', mood: 'infinitive' })).toEqual(['apzorpa']);
  });

  it('supports a voice dimension', () => {
    const query = { language: 'xx', infinitive: 'placa', mood: 'indicative', tense: 'present', person: 1, number: 'plural' };
    const both = toy.conjugate(query).forms;
    expect(both.map(f => [f.target.voice, f.text])).toEqual([['active', 'nos placamos'], ['passive', 'nos placuramos']]);
    expect(rules(both[1]!.parts.at(-1)!.steps)).toEqual(['xx.stem.drop-a', 'xx.end.passive', 'xx.end.present']);
    expect(texts({ ...query, voice: 'passive' })).toEqual(['nos placuramos']);
    expect(texts({ ...query, tense: 'perfect', person: 3, number: 'singular', voice: 'passive' })).toEqual(['il estat placado', 'il estat placada']);
    const passivePerfect = toy.conjugate({ ...query, tense: 'perfect', voice: 'passive' }).forms[0]!;
    expect(passivePerfect.variant.auxiliary).toBeNull();
    expect(rules(passivePerfect.steps)).toEqual(['xx.periphrasis.passive-perfect', 'xx.agree.gender']);

    const targets = toy.expandTargets({ language: 'xx', infinitive: 'placa', mood: 'indicative', tense: 'present' });
    expect(targets.map(t => `${t.voice} ${t.person}${t.number![0]}`)).toEqual([
      'active 1s', 'active 2s', 'active 3s', 'active 1p', 'active 2p', 'active 3p',
      'passive 1s', 'passive 2s', 'passive 3s', 'passive 1p', 'passive 2p', 'passive 3p',
    ]);
    expect(toy.expandTargets({ language: 'xx', infinitive: 'placa', voice: 'passive' }).every(t => t.voice === 'passive')).toBe(true);
    expect(Object.hasOwn(toy.expandTargets({ language: 'xx', infinitive: 'placa', mood: 'participle' })[0]!, 'voice')).toBe(false);
    expect(() => toy.conjugate({ ...query, voice: 'middle' })).toThrow(expect.objectContaining({ code: 'INVALID_REQUEST' }));
  });

  it('uses whole-cell lexical forms with a lexical step', () => {
    const form = only({ language: 'xx', infinitive: 'esa', mood: 'indicative', tense: 'present', person: 1, number: 'singular' });
    expect(form.text).toBe('mi so');
    expect(form.parts.at(-1)!.steps).toEqual([{ rule: 'xx.lex.present', stage: 'stem', kind: 'lexical', before: 'esa', after: 'so', params: {} }]);
    expect(only({ language: 'xx', infinitive: 'esa', mood: 'indicative', tense: 'perfect', person: 1, number: 'singular' }).text).toBe('mi habo esado');
  });

  it('reports unavailable targets with a step', () => {
    const result = toy.conjugate({ language: 'xx', infinitive: 'solea', mood: 'indicative', tense: 'perfect', person: 1, number: 'singular' });
    expect(result.status).toBe('unavailable');
    expect(result.forms).toEqual([]);
    expect(result.unavailableTargets).toHaveLength(2);
    expect(result.unavailableTargets[0]).toMatchObject({
      reason: 'defective', explanation: 'xx.avail.no-participle', source: 'Toy grammar §4',
      step: { rule: 'xx.avail.no-participle', stage: 'availability', kind: 'unavailable', before: null, after: null, params: {} },
    });
    expect(toy.conjugate({ language: 'xx', infinitive: 'solea', mood: 'indicative', tense: 'present', person: 1 }).status).toBe('available');
  });

  it('deduplicates forms that differ only in steps', () => {
    const cell: Cell = { kind: 'finite', mood: 'indicative', tense: 'present', person: 2, number: 'plural' };
    const derivations = synthesize(toyGrammar, toyGrammar.lexemeOf('roca'), cell);
    expect(derivations.map(o => [o.value, rules(o.steps)])).toEqual([
      ['roquetes', ['xx.stem.drop-a', 'xx.end.present', 'xx.orth.c-qu']],
      ['roquetes', ['xx.stem.listed', 'xx.end.present']],
    ]);
    const form = only({ language: 'xx', infinitive: 'roca', mood: 'indicative', tense: 'present', person: 2, number: 'plural' });
    expect(form.text).toBe('vos roquetes');
    expect(rules(form.parts.at(-1)!.steps)).toEqual(['xx.stem.drop-a', 'xx.end.present', 'xx.orth.c-qu']);
    // ruleIds name every rule path that produced the surviving form.
    expect(form.ruleIds).toEqual(['xx.stem.drop-a', 'xx.end.present', 'xx.orth.c-qu', 'xx.stem.listed']);
  });

  it('rejects a periphrasis that references a periphrastic cell', () => {
    const nested: Periphrasis = {
      mood: 'indicative', tense: 'future', rule: toyRules['xx.periphrasis.perfect'],
      chain: [{ verb: 'perfectAuxiliary', finite: { mood: 'indicative', tense: 'perfect' } }, { verb: 'main', nonFinite: 'participle' }],
    };
    const engine = toyWith({ ...toyGrammar, periphrases: [nested] });
    expect(() => engine.conjugate({ language: 'xx', infinitive: 'placa', mood: 'indicative', tense: 'future', person: 1, number: 'singular' }))
      .toThrow(expect.objectContaining({ code: 'GENERATION_FAILURE', message: expect.stringContaining('indicative/perfect') }));
  });

  it('fails on a target with neither a simple cell nor a periphrasis, naming it', () => {
    const engine = toyWith({ ...toyGrammar, periphrases: [] });
    expect(() => engine.conjugate({ language: 'xx', infinitive: 'placa', mood: 'indicative', tense: 'future', person: 1, number: 'singular' }))
      .toThrow(expect.objectContaining({ code: 'GENERATION_FAILURE', message: expect.stringContaining('indicative/future/1/singular') }));
  });

  it('runs literal chain words and named periphrasis variants', () => {
    const forms = toy.conjugate({ language: 'xx', infinitive: 'apzorpa', mood: 'indicative', tense: 'future', person: 3, number: 'singular' }).forms;
    expect(forms.map(f => [f.text, f.variant.pattern, f.variant.usage, f.preferred])).toEqual([
      ['il vadat a apzorpa', null, 'standard', true],
      ['il apzorpa habat', 'inverted', 'literary', false],
    ]);
    expect(forms[0]!.parts.map(p => [p.role, p.text])).toEqual([
      ['subject', 'il'], ['auxiliary', 'vadat'], ['linker', 'a'], ['lexicalVerb', 'apzorpa'],
    ]);
    expect(forms[0]!.parts[2]!.steps).toEqual([]);
    expect(forms[0]!.variant.auxiliary).toBeNull();
    expect('voice' in forms[0]!.target).toBe(false);
  });

  it('records classification steps and assumptions in the analysis', () => {
    const unlisted = toy.conjugate({ language: 'xx', infinitive: 'placa', mood: 'infinitive' });
    expect(unlisted.verbId).toBe('placa');
    expect(unlisted.analysis).toEqual({
      lemma: 'placa', classification: 'a-verb', classificationSource: 'regularRule', reflexive: false, auxiliaries: ['haba'],
      assumptions: ['xx.assume.unlisted'],
      steps: [
        { rule: 'xx.classify.a-verb', stage: 'classify', kind: 'rule', before: 'placa', after: 'a-verb', params: {} },
        { rule: 'xx.assume.unlisted', stage: 'classify', kind: 'assumption', before: null, after: null, params: {} },
      ],
    });
    const listed = toy.conjugate({ language: 'xx', infinitive: 'esa', mood: 'infinitive' }).analysis;
    expect([listed.classification, listed.classificationSource, listed.assumptions, rules(listed.steps)])
      .toEqual(['suppletive', 'lexicon', [], ['xx.classify.listed']]);
    expect(() => toy.conjugate({ language: 'xx', infinitive: 'plac' })).toThrow(expect.objectContaining({ code: 'INVALID_INFINITIVE' }));
  });

  it('memoises synthesis per engine instance', () => {
    const calls: string[] = [];
    const engine = toyWith({
      ...toyGrammar,
      stem: (lexeme, cell) => {
        calls.push(`${lexeme.lemma} ${cell.kind}`);
        return toyGrammar.stem(lexeme, cell);
      },
    });
    const query = { language: 'xx', infinitive: 'zorpa', mood: 'indicative', tense: 'perfect', voice: 'active' };
    expect(engine.conjugate(query).forms).toHaveLength(6);
    expect(calls.filter(c => c === 'zorpa nonFinite')).toHaveLength(1);
    expect(calls.filter(c => c === 'haba finite')).toHaveLength(6);
    engine.conjugate(query);
    expect(calls.filter(c => c === 'zorpa nonFinite')).toHaveLength(2);
  });
});

describe('target identity', () => {
  const base: ResolvedTarget = { mood: 'indicative', tense: 'present', person: 1, number: 'plural', gender: null, agreement: null };

  it('keeps the keys of targets without voice or case unchanged', () => {
    expect(targetKey(base)).toBe('indicative/present/1/plural');
    expect(resolvedTargetKey({ ...base, agreement: { gender: 'feminine', number: 'plural' } }))
      .toBe('["indicative","present",1,"plural",null,"feminine","plural"]');
    expect(Object.keys(createEngine(packs).expandTargets({ language: 'fr', infinitive: 'aimer' })[0]!))
      .toEqual(['mood', 'tense', 'person', 'number', 'gender', 'agreement']);
  });

  it('distinguishes targets by voice and agreement case', () => {
    expect(targetKey({ ...base, voice: 'passive' })).not.toBe(targetKey({ ...base, voice: 'active' }));
    expect(targetKey({ ...base, voice: 'passive' })).not.toBe(targetKey(base));
    expect(resolvedTargetKey({ ...base, voice: 'passive' })).not.toBe(resolvedTargetKey(base));
    const agreement = { gender: 'neuter', number: 'singular' } as const;
    expect(resolvedTargetKey({ ...base, agreement: { ...agreement, case: 'ablative' } }))
      .not.toBe(resolvedTargetKey({ ...base, agreement: { ...agreement, case: 'nominative' } }));
    expect(resolvedTargetKey({ ...base, voice: null })).toBe(resolvedTargetKey(base));
  });
});
