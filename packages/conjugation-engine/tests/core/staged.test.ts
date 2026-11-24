import { describe, expect, it } from 'vitest';
import { createEngine } from '../../src/core/engine.js';
import { resolvedTargetKey, targetKey } from '../../src/core/target.js';
import * as catalogue from '../../src/catalogue.js';
import { step } from '../../src/core/derivation.js';
import type { DerivationStep } from '../../src/core/derivation.js';
import { one } from '../../src/core/fork.js';
import type { Fork } from '../../src/core/fork.js';
import type { Periphrasis } from '../../src/core/periphrasis.js';
import { stagedEngine, synthesize, validateGrammar } from '../../src/core/staged.js';
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
      { rule: 'xx.orth.c-qu', stage: 'orthography', kind: 'rule', before: 'placetes', after: 'plaquetes', params: { vowel: 'e' } },
    ]);
  });

  it('records describe() params on a spelling step', () => {
    expect(toyRules['xx.orth.c-qu'].params).toEqual({ vowel: 'text' });
    const verb = only({ language: 'xx', infinitive: 'roca', mood: 'indicative', tense: 'present', person: 2, number: 'plural' }).parts.at(-1)!;
    expect(verb.steps!.find(s => s.rule === 'xx.orth.c-qu')!.params).toEqual({ vowel: 'e' });
  });

  it('carries variant tags from words to the form', () => {
    const variant = (form: ConjugatedForm) => [form.text, form.variant.orthography, form.variant.usage, form.variant.pattern];
    const spelled = toy.conjugate({ language: 'xx', infinitive: 'grapha', mood: 'indicative', tense: 'present', person: 1, number: 'singular', voice: 'active' }).forms;
    expect(spelled.map(variant)).toEqual([
      ['mi grafo', 'rectified', 'standard', null],
      ['mi grapho', 'traditional', 'standard', null],
    ]);
    expect(rules(spelled[0]!.parts.at(-1)!.steps)).toContain('xx.orth.ph-f');
    expect(rules(spelled[1]!.parts.at(-1)!.steps)).not.toContain('xx.orth.ph-f');
    const long = toy.conjugate({ language: 'xx', infinitive: 'canta', mood: 'indicative', tense: 'present', person: 1, number: 'plural', voice: 'active' }).forms;
    expect(long.map(variant)).toEqual([
      ['nos cantamos', 'both', 'standard', null],
      ['nos cantamusse', 'both', 'literary', 'long'],
    ]);
  });

  it('drops chains whose words carry conflicting tags', () => {
    const cell: Cell = { kind: 'nonFinite', form: 'participle' };
    expect(synthesize(toyGrammar, toyGrammar.lexemeOf('grapha'), cell).map(o => [o.value, o.tags.orthography]))
      .toEqual([['graphado', 'traditional'], ['grafado', 'rectified']]);
    const forms = toy.conjugate({ language: 'xx', infinitive: 'grapha', mood: 'indicative', tense: 'perfect', person: 3, number: 'singular', voice: 'active' }).forms;
    expect(forms.map(f => [f.text, f.variant.orthography, f.variant.auxiliary])).toEqual([
      ['il efat grafado', 'rectified', 'epha'],
      ['il ephat graphado', 'traditional', 'epha'],
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
    expect(texts({ language: 'xx', infinitive: 'zorpa', mood: 'indicative', tense: 'perfect', person: 1, number: 'plural', voice: 'active' }))
      .toEqual(['nos habamos zorpado']);
    const feminine = result.forms[2]!;
    expect(feminine.steps).toEqual([
      { rule: 'xx.periphrasis.perfect', stage: 'periphrasis', kind: 'rule', before: null, after: null, params: { auxiliary: 'esta' } },
      { rule: 'xx.agree.gender', stage: 'clause', kind: 'rule', before: null, after: null, params: { gender: { term: 'gender', id: 'feminine' } } },
    ]);
    expect(feminine.parts.at(-1)!.features).toMatchObject({ gender: 'feminine', number: 'singular', verbForm: 'pastParticiple' });
  });

  it('forks a standalone participle over agreement', () => {
    const forms = toy.conjugate({ language: 'xx', infinitive: 'zorpa', mood: 'participle', tense: 'past' }).forms;
    expect(forms.map(f => [f.text, f.target.agreement])).toEqual([
      ['zorpado', { gender: 'masculine', number: 'singular' }],
      ['zorpada', { gender: 'feminine', number: 'singular' }],
    ]);
    for (const form of forms) expect(form.steps!.some(s => s.stage === 'periphrasis')).toBe(false);
    expect(forms[1]!.steps).toEqual([
      { rule: 'xx.agree.gender', stage: 'clause', kind: 'rule', before: null, after: null, params: { gender: { term: 'gender', id: 'feminine' } } },
    ]);
    expect(forms[1]!.parts[0]!.features).toMatchObject({ gender: 'feminine', number: 'singular', verbForm: 'pastParticiple' });
  });

  it('asks clause.agreements for non-finite simple targets only, and changes nothing on a null outcome', () => {
    const asked: string[] = [];
    const engine = toyWith({
      ...toyGrammar,
      clause: {
        ...toyGrammar.clause,
        agreements: context => {
          asked.push(targetKey(context.target));
          return toyGrammar.clause.agreements(context);
        },
      },
    });
    engine.conjugate({ language: 'xx', infinitive: 'zorpa', mood: 'indicative', tense: 'present' });
    expect(asked).toEqual([]);
    for (const tense of ['present', 'past']) engine.conjugate({ language: 'xx', infinitive: 'zorpa', mood: 'participle', tense });
    engine.conjugate({ language: 'xx', infinitive: 'zorpa', mood: 'infinitive' });
    expect(asked).toEqual(['participle/present/-/-', 'participle/past/-/-', 'infinitive/present/-/-']);
    for (const [mood, tense, text] of [['infinitive', 'present', 'zorpa'], ['participle', 'present', 'zorpante']] as const) {
      const forms = toy.conjugate({ language: 'xx', infinitive: 'zorpa', mood, tense }).forms;
      expect(forms.map(f => [f.text, f.target.agreement, f.steps])).toEqual([[text, null, []]]);
    }
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
    const participle = toy.conjugate({ language: 'xx', infinitive: 'apzorpa', mood: 'participle', tense: 'past' }).forms;
    expect(participle.map(f => f.text)).toEqual(['apzorpado', 'apzorpada']);
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
    expect(passivePerfect.variant.auxiliary).toBe('esta');
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
    expect(toy.conjugate({ language: 'xx', infinitive: 'solea', mood: 'participle', tense: 'present' }).status).toBe('available');
    expect(toy.conjugate({ language: 'xx', infinitive: 'solea', mood: 'participle', tense: 'past' }).status).toBe('unavailable');
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
    // ruleIds follow the surviving form's own steps, not the derivation that collapsed into it.
    expect(form.ruleIds).toEqual(['xx.stem.drop-a', 'xx.end.present', 'xx.orth.c-qu']);
    const recorded = new Set([...form.steps!, ...form.parts.flatMap(p => p.steps ?? [])].map(s => s.rule));
    for (const id of form.ruleIds) expect(recorded).toContain(id);
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
    expect(forms.map(f => f.variant.auxiliary)).toEqual(['vada', 'haba']);
    expect('voice' in forms[0]!.target).toBe(false);
  });

  it('reports the perfect auxiliary, else the first named verb of the periphrasis, else none', () => {
    const reported = (query: Query) => toy.conjugate({ language: 'xx', infinitive: 'zorpa', person: 3, number: 'singular', ...query }).forms
      .map(form => [form.text, form.variant.auxiliary]);
    expect(reported({ mood: 'indicative', tense: 'perfect', voice: 'active' })).toEqual([['il habat zorpado', 'haba']]);
    expect(reported({ mood: 'indicative', tense: 'perfect', voice: 'passive' })).toEqual([['il estat zorpado', 'esta'], ['il estat zorpada', 'esta']]);
    expect(reported({ mood: 'indicative', tense: 'future' })).toEqual([['il vadat a zorpa', 'vada'], ['il zorpa habat', 'haba']]);
    expect(reported({ mood: 'conditional', tense: 'past' })).toEqual([['il vadit zorpa', 'vada']]);
    expect(reported({ mood: 'indicative', tense: 'present', voice: 'active' })).toEqual([['il zorpat', null]]);
    expect(reported({ mood: 'indicative', tense: 'past' })).toEqual([['il zorpit', null]]);
    for (const mood of ['infinitive', 'participle']) {
      expect(toy.conjugate({ language: 'xx', infinitive: 'zorpa', mood }).forms.map(form => form.variant.auxiliary).every(a => a === null)).toBe(true);
    }
  });

  it('reports the verb a periphrasis names in `reports` instead', () => {
    const [, , future] = toyGrammar.periphrases as [Periphrasis, Periphrasis, Periphrasis];
    const twoNamed: Periphrasis = {
      mood: 'indicative', tense: 'future', rule: toyRules['xx.periphrasis.future'], pattern: 'two', reports: { lemma: 'haba' },
      chain: [{ verb: { lemma: 'vada' }, finite: { mood: 'indicative', tense: 'present' } }, { verb: { lemma: 'haba' }, nonFinite: 'infinitive' }, { verb: 'main', nonFinite: 'participle' }],
    };
    const engine = toyWith({ ...toyGrammar, periphrases: [{ ...future, reports: 'main' }, twoNamed] });
    expect(engine.conjugate({ language: 'xx', infinitive: 'zorpa', mood: 'indicative', tense: 'future', person: 3, number: 'singular' }).forms
      .map(form => [form.text, form.variant.auxiliary])).toEqual([['il vadat a zorpa', null], ['il vadat haba zorpado', 'haba']]);
  });

  it('keeps a stem pattern and an ending pattern on one form', () => {
    const engine = toyWith({
      ...toyGrammar,
      stem: (lexeme, cell) => toyGrammar.stem(lexeme, cell).map(outcome => ({ ...outcome, tags: { ...outcome.tags, pattern: 'A' } })),
    });
    const forms = engine.conjugate({ language: 'xx', infinitive: 'canta', mood: 'indicative', tense: 'present', person: 1, number: 'plural', voice: 'active' }).forms;
    expect(forms.map(f => [f.text, f.variant.pattern, f.variant.usage])).toEqual([
      ['nos cantamos', 'A', 'standard'],
      ['nos cantamusse', 'A.long', 'literary'],
    ]);
    // A word's pattern comes before the periphrasis's, and the most marked usage of either wins.
    const inverted = engine.conjugate({ language: 'xx', infinitive: 'canta', mood: 'indicative', tense: 'future', person: 3, number: 'singular' }).forms;
    expect(inverted.map(f => [f.text, f.variant.pattern, f.variant.usage])).toEqual([
      ['il vadat a canta', 'A', 'standard'],
      ['il canta habat', 'A.inverted', 'literary'],
    ]);
  });

  it('narrows the perfect auxiliaries to the one the query names', () => {
    const query = { language: 'xx', infinitive: 'vena', mood: 'indicative', tense: 'perfect', person: 3, number: 'singular', voice: 'active' };
    const esta = toy.conjugate({ ...query, auxiliary: 'esta' });
    expect(esta.analysis.auxiliaries).toEqual(['esta']);
    expect(esta.forms.map(f => [f.text, f.variant.auxiliary])).toEqual([['il estat venado', 'esta'], ['il estat venada', 'esta']]);
    const haba = toy.conjugate({ ...query, auxiliary: 'haba' });
    expect([haba.analysis.auxiliaries, haba.forms.map(f => f.text)]).toEqual([['haba'], ['il habat venado']]);
    expect(toy.conjugate(query).analysis.auxiliaries).toEqual(['haba', 'esta']);
    expect(() => toy.conjugate({ ...query, infinitive: 'zorpa', auxiliary: 'esta' }))
      .toThrow(expect.objectContaining({ code: 'INVALID_HINT', message: 'zorpa does not take the auxiliary esta.' }));
    expect(() => toy.conjugate({ ...query, auxiliary: 'vada' })).toThrow(expect.objectContaining({ code: 'INVALID_REQUEST' }));
  });

  it('freezes its results without freezing data the pack owns', () => {
    const lexiconAuxiliaries = toyGrammar.lexemeOf('vena').auxiliaries;
    const result = toy.conjugate({ language: 'xx', infinitive: 'vena', mood: 'indicative', tense: 'perfect', person: 3, number: 'singular' });
    expect(Object.isFrozen(result.analysis.auxiliaries)).toBe(true);
    expect(Object.isFrozen(lexiconAuxiliaries)).toBe(false);
    expect(Object.isFrozen(result.analysis.steps)).toBe(true);

    // A whole-word fork the pack keeps between calls, and a step it keeps for its unavailable targets.
    const kept: Fork<string> = one('so', [step(toyRules['xx.lex.present'], 'esa', 'so')]);
    const keptStep = step(toyRules['xx.avail.no-participle'], null, null);
    const engine = toyWith({
      ...toyGrammar,
      cell: (lexeme, cell) => lexeme.lemma === 'esa' && cell.kind === 'finite' ? kept : null,
      availability: lexeme => lexeme.hasParticiple ? null : { reason: 'defective', step: keptStep, source: 'Toy grammar §4' },
    });
    const form = engine.conjugate({ language: 'xx', infinitive: 'esa', mood: 'indicative', tense: 'present', person: 1, number: 'singular', voice: 'active' }).forms[0]!;
    expect(form.text).toBe('mi so');
    expect(Object.isFrozen(form.parts.at(-1)!.steps)).toBe(true);
    expect([Object.isFrozen(kept), Object.isFrozen(kept[0]), Object.isFrozen(kept[0]!.steps), Object.isFrozen(kept[0]!.steps[0])])
      .toEqual([false, false, false, false]);
    const unavailable = engine.conjugate({ language: 'xx', infinitive: 'solea', mood: 'infinitive' }).unavailableTargets[0]!;
    expect(Object.isFrozen(unavailable.step)).toBe(true);
    expect(Object.isFrozen(keptStep)).toBe(false);
  });

  it('validates a grammar the first time an engine is built from it', () => {
    const [perfect] = toyGrammar.periphrases as [Periphrasis];
    const broken: StagedGrammar<ToyLexeme> = { ...toyGrammar, periphrases: [{ ...perfect, rule: toyRules['xx.periphrasis.future'] }] };
    let expected = '';
    try {
      validateGrammar(broken);
    } catch (error) {
      expected = (error as Error).message;
    }
    expect(expected).toContain('perfectAuxiliary');
    // The infinitive does not use the broken periphrasis: only the validation on first use can fail it.
    const engine = toyWith(broken);
    for (let use = 0; use < 2; use++) {
      expect(() => engine.conjugate({ language: 'xx', infinitive: 'placa', mood: 'infinitive' }))
        .toThrow(expect.objectContaining({ code: 'GENERATION_FAILURE', message: expected }));
    }
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

describe('a target that is available but left without a form', () => {
  const present = { language: 'xx', infinitive: 'zorpa', mood: 'indicative', tense: 'present', person: 1, number: 'singular', voice: 'active' };
  const perfect = { ...present, tense: 'perfect', person: 3 };
  const participle = { language: 'xx', infinitive: 'zorpa', mood: 'participle', tense: 'past' };
  // Tags the haba auxiliary traditional and every other word rectified, so no perfect has a consistent spelling.
  const mismatched = (lexeme: ToyLexeme, cell: Cell) => toyGrammar.stem(lexeme, cell)
    .map(outcome => ({ ...outcome, tags: { orthography: lexeme.lemma === 'haba' ? 'traditional' as const : 'rectified' as const } }));

  it.each<[string, Partial<StagedGrammar<ToyLexeme>>, Query, string, string]>([
    ['cell', { cell: () => [] }, present, 'indicative/present/1/singular/active', 'cell'],
    ['stem', { stem: () => [] }, present, 'indicative/present/1/singular/active', 'stem'],
    ['ending', { ending: () => [] }, present, 'indicative/present/1/singular/active', 'ending'],
    ['orthography', { orthography: [{ info: toyRules['xx.orth.c-qu'], apply: () => [] }] }, present, 'indicative/present/1/singular/active', 'orthography'],
    ['agreements', { clause: { ...toyGrammar.clause, agreements: () => [] } }, participle, 'participle/past/-/-', 'agreements'],
    ['assemble', { clause: { ...toyGrammar.clause, assemble: () => [] } }, present, 'indicative/present/1/singular/active', 'assemble'],
    ['assemble, when no words combine', { stem: mismatched }, perfect, 'indicative/perfect/3/singular/active', 'assemble'],
    ['assemble, when no words combine with the paradigm', {
      classify: query => toyGrammar.classify(query).map(paradigm => ({ ...paradigm, tags: { region: 'north' } })),
      stem: (lexeme, cell) => toyGrammar.stem(lexeme, cell).map(outcome => ({ ...outcome, tags: { region: 'south' } })),
    }, present, 'indicative/present/1/singular/active', 'assemble'],
  ])('is a generation failure naming the target, the lemma and the %s stage', (_, hooks, query, key, stage) => {
    const engine = toyWith({ ...toyGrammar, ...hooks });
    const failure = (text: string) => expect.objectContaining({ code: 'GENERATION_FAILURE', message: expect.stringContaining(text) });
    for (const text of [key, 'zorpa', `the ${stage} stage`, 'availability']) expect(() => engine.conjugate(query)).toThrow(failure(text));
  });

  it('names the word whose synthesis came back empty', () => {
    const engine = toyWith({ ...toyGrammar, stem: (lexeme, cell) => lexeme.lemma === 'haba' ? [] : toyGrammar.stem(lexeme, cell) });
    expect(() => engine.conjugate(perfect)).toThrow(expect.objectContaining({
      code: 'GENERATION_FAILURE', message: expect.stringMatching(/indicative\/perfect\/3\/singular\/active\/3sg of zorpa: the stem stage came back empty for haba\b/u),
    }));
    const withoutAuxiliary = toyWith({
      ...toyGrammar,
      classify: query => toyGrammar.classify(query).map(paradigm => ({ ...paradigm, value: { ...paradigm.value, auxiliaries: [] } })),
    });
    expect(() => withoutAuxiliary.conjugate(perfect)).toThrow(expect.objectContaining({
      code: 'GENERATION_FAILURE', message: expect.stringContaining('of zorpa: no periphrasis ran, because the verb lists no perfect auxiliary'),
    }));
  });

  it('keeps the forms of a target when only some branches come back empty', () => {
    // roca's listed stem roqu- gets no ending; the derived stem still makes the form.
    const engine = toyWith({ ...toyGrammar, ending: (lexeme, cell, stem) => stem === 'roqu' ? [] : toyGrammar.ending(lexeme, cell, stem) });
    expect(engine.conjugate({ ...present, infinitive: 'roca', person: 2, number: 'plural' }).forms.map(f => f.text)).toEqual(['vos roquetes']);
  });
});

describe('several paradigms for one lemma', () => {
  // apvena is separable, intransitive and conjugated with esta in one reading; inseparable, transitive and with haba in the other.
  const perfect = { language: 'xx', infinitive: 'apvena', mood: 'indicative', tense: 'perfect', person: 3, number: 'singular', voice: 'active' };
  const present = { ...perfect, tense: 'present' };
  const variantOf = (form: ConjugatedForm) => [form.text, form.variant.pattern, form.variant.condition, form.variant.auxiliary];
  const readingOf = (lexeme: ToyLexeme) => lexeme.particle?.separable === false ? 'inseparable' : 'separable';

  it('returns the forms of each paradigm, first paradigm first, each tagged with its paradigm', () => {
    expect(toy.conjugate(perfect).forms.map(variantOf)).toEqual([
      ['il estat apvenado', 'separable', 'intransitive', 'esta'],
      ['il estat apvenada', 'separable', 'intransitive', 'esta'],
      ['il habat apvenido', 'inseparable', 'transitive', 'haba'],
    ]);
    // When ranks tie, the first paradigm's form is preferred.
    expect(toy.conjugate(present).forms.map(f => [f.text, f.variant.pattern, f.preferred])).toEqual([
      ['il venat ap', 'separable', true],
      ['il apvenat', 'inseparable', false],
    ]);
    // Ranking runs across both paradigms; the paradigm's pattern comes before the periphrasis's.
    const future = { language: 'xx', infinitive: 'apvena', mood: 'indicative', tense: 'future', person: 3, number: 'singular' };
    expect(toy.conjugate(future).forms.map(f => [f.text, f.variant.pattern, f.variant.usage, f.variant.condition])).toEqual([
      ['il vadat a apvena', 'separable', 'standard', 'intransitive'],
      ['il vadat a apvena', 'inseparable', 'standard', 'transitive'],
      ['il apvena habat', 'separable.inverted', 'literary', 'intransitive'],
      ['il apvena habat', 'inseparable.inverted', 'literary', 'transitive'],
    ]);
  });

  it('never crosses one paradigm\'s auxiliaries or participles with another\'s', () => {
    // The participle cell is the same in both paradigms: words are cached per lexeme, never per lemma.
    const forms = toy.conjugate({ language: 'xx', infinitive: 'apvena' }).forms;
    const reading = (form: ConjugatedForm) => form.variant.pattern!.split('.')[0];
    const participles = (name: string) => new Set(forms.filter(f => reading(f) === name).flatMap(f => f.parts)
      .filter(part => part.features.verbForm === 'pastParticiple').map(part => part.text));
    expect(participles('separable')).toEqual(new Set(['apvenado', 'apvenada']));
    expect(participles('inseparable')).toEqual(new Set(['apvenido', 'apvenida']));
    const perfects = forms.filter(f => f.target.tense === 'perfect' && f.target.voice === 'active');
    expect(new Set(perfects.map(f => `${reading(f)} ${f.variant.auxiliary}`))).toEqual(new Set(['separable esta', 'inseparable haba']));
    expect(perfects).toHaveLength(6 * 3);
  });

  it('returns only the paradigm a prefix hint names', () => {
    const inseparable = toy.conjugate({ ...perfect, prefix: 'inseparable' });
    expect(inseparable.forms.map(variantOf)).toEqual([['il habat apvenido', 'inseparable', 'transitive', 'haba']]);
    expect(Object.hasOwn(inseparable.analysis, 'alternatives')).toBe(false);
    expect([inseparable.analysis.auxiliaries, rules(inseparable.analysis.steps)]).toEqual([['haba'], ['xx.classify.listed', 'xx.classify.inseparable']]);
    expect(toy.conjugate({ ...present, prefix: 'separable' }).forms.map(variantOf)).toEqual([['il venat ap', 'separable', 'intransitive', null]]);
    // The auxiliary hint keeps the paradigms that take the auxiliary.
    expect(toy.conjugate({ ...perfect, auxiliary: 'esta' }).forms.map(f => f.text)).toEqual(['il estat apvenado', 'il estat apvenada']);
    expect(() => toy.conjugate({ ...perfect, auxiliary: 'epha' }))
      .toThrow(expect.objectContaining({ code: 'INVALID_HINT', message: 'apvena does not take the auxiliary epha.' }));
    expect(() => toy.conjugate({ ...perfect, prefix: 'separable', auxiliary: 'haba' }))
      .toThrow(expect.objectContaining({ code: 'INVALID_HINT', message: 'apvena does not take the auxiliary haba.' }));
    // A verb with one reading accepts the hint that matches it and rejects the other.
    expect(texts({ ...present, infinitive: 'apzorpa', prefix: 'separable' })).toEqual(['il zorpat ap']);
    expect(() => toy.conjugate({ ...present, infinitive: 'apzorpa', prefix: 'inseparable' }))
      .toThrow(expect.objectContaining({ code: 'INVALID_HINT', message: 'apzorpa has no inseparable particle.' }));
    expect(() => toy.conjugate({ ...present, infinitive: 'zorpa', prefix: 'separable' }))
      .toThrow(expect.objectContaining({ code: 'INVALID_HINT', message: 'zorpa has no separable particle.' }));
  });

  it('analyses the first paradigm and lists the others as alternatives', () => {
    const result = toy.conjugate(perfect);
    const listed = { rule: 'xx.classify.listed', stage: 'classify', kind: 'lexical', before: 'apvena', after: 'a-verb', params: {} };
    const verb = { lemma: 'apvena', classification: 'a-verb', classificationSource: 'lexicon', reflexive: false, assumptions: [] };
    expect(result.verbId).toBe('apvena');
    expect(result.analysis).toEqual({
      ...verb,
      auxiliaries: ['esta'],
      steps: [listed, { rule: 'xx.classify.separable', stage: 'classify', kind: 'rule', before: 'apvena', after: null, params: { particle: 'ap' } }],
      alternatives: [{
        ...verb,
        auxiliaries: ['haba'],
        steps: [listed, { rule: 'xx.classify.inseparable', stage: 'classify', kind: 'rule', before: 'apvena', after: null, params: { particle: 'ap' } }],
      }],
    });
    expect(result.analysis.alternatives).toHaveLength(1);
    expect(Object.hasOwn(result.analysis.alternatives![0]!, 'alternatives')).toBe(false);
    expect(Object.isFrozen(result.analysis.alternatives![0]!.steps)).toBe(true);
    for (const infinitive of ['placa', 'apzorpa', 'esa']) {
      expect(Object.hasOwn(toy.conjugate({ language: 'xx', infinitive, mood: 'infinitive' }).analysis, 'alternatives')).toBe(false);
    }
  });

  it('merges a paradigm\'s tags into each form: labels join, constraints keep only the forms that agree', () => {
    const traditional = toyWith({
      ...toyGrammar,
      classify: query => toyGrammar.classify(query).map(paradigm => ({ ...paradigm, tags: { orthography: 'traditional', condition: 'old' } })),
    });
    const query = { language: 'xx', infinitive: 'grapha', mood: 'indicative', tense: 'present', person: 1, number: 'singular', voice: 'active' };
    expect(traditional.conjugate(query).forms.map(f => [f.text, f.variant.orthography, f.variant.condition]))
      .toEqual([['mi grapho', 'traditional', 'old']]);
  });

  it('asks availability per paradigm and reports a target unavailable in every paradigm once, as the first paradigm does', () => {
    const asked: string[] = [];
    const unavailableIn = (readings: readonly string[]) => toyWith({
      ...toyGrammar,
      availability: (lexeme, target) => {
        asked.push(readingOf(lexeme));
        if (target.tense !== 'perfect' || !readings.includes(readingOf(lexeme))) return toyGrammar.availability(lexeme, target);
        const reason = readingOf(lexeme) === 'separable' ? 'defective' : 'impersonal';
        return { reason, step: step(toyRules['xx.avail.no-participle'], null, null), source: `the ${readingOf(lexeme)} reading` };
      },
    });
    const partly = unavailableIn(['separable']).conjugate(perfect);
    expect([partly.status, partly.unavailableTargets, partly.forms.map(variantOf)])
      .toEqual(['available', [], [['il habat apvenido', 'inseparable', 'transitive', 'haba']]]);
    expect(asked).toEqual(['separable', 'inseparable']);
    expect(unavailableIn(['inseparable']).conjugate(perfect).forms.map(f => f.text)).toEqual(['il estat apvenado', 'il estat apvenada']);
    const neither = unavailableIn(['inseparable', 'separable']).conjugate(perfect);
    expect(neither.status).toBe('unavailable');
    expect(neither.unavailableTargets.map(u => [u.reason, u.source, u.step!.rule]))
      .toEqual([['defective', 'the separable reading', 'xx.avail.no-participle']]);
  });

  it('collapses a form two paradigms share into the first paradigm\'s', () => {
    // A second paradigm of zorpa that lists its present whole: the same words by other steps, with the same tags.
    const engine = toyWith({
      ...toyGrammar,
      classify: query => toyGrammar.classify(query).flatMap(paradigm => [paradigm, {
        ...paradigm, value: { ...paradigm.value, present: ['zorpo', 'zorpas', 'zorpat', 'zorpamos', 'zorpetes', 'zorpant'] },
      }]),
    });
    const result = engine.conjugate({ language: 'xx', infinitive: 'zorpa', mood: 'indicative', tense: 'present', voice: 'active' });
    expect(result.forms.map(f => f.text)).toEqual(['mi zorpo', 'tu zorpas', 'il zorpat', 'nos zorpamos', 'vos zorpetes', 'ils zorpant']);
    for (const form of result.forms) expect(rules(form.parts.at(-1)!.steps)).toEqual(['xx.stem.drop-a', 'xx.end.present']);
    expect(result.analysis.alternatives).toHaveLength(1);
  });

  it('fails when classify returns no paradigm, naming the lemma', () => {
    const engine = toyWith({ ...toyGrammar, classify: () => [] });
    expect(() => engine.conjugate({ language: 'xx', infinitive: 'zorpa', mood: 'infinitive' }))
      .toThrow(expect.objectContaining({ code: 'GENERATION_FAILURE', message: expect.stringContaining('no paradigm for zorpa') }));
  });

  it('names the paradigm that left an available target without a form', () => {
    const engine = toyWith({ ...toyGrammar, stem: (lexeme, cell) => readingOf(lexeme) === 'inseparable' ? [] : toyGrammar.stem(lexeme, cell) });
    expect(() => engine.conjugate(present)).toThrow(expect.objectContaining({
      code: 'GENERATION_FAILURE',
      message: expect.stringContaining('indicative/present/3/singular/active/3sg of apvena (paradigm 2, inseparable): the stem stage came back empty.'),
    }));
  });
});

describe('validateGrammar', () => {
  const [perfect, , future] = toyGrammar.periphrases as [Periphrasis, Periphrasis, Periphrasis];
  const auxiliaryRule = toyRules['xx.periphrasis.perfect'];

  it('accepts the toy grammar', () => {
    expect(() => validateGrammar(toyGrammar)).not.toThrow();
  });

  it.each<[string, Periphrasis, string, string]>([
    ['a rule of another stage', { ...future, rule: toyRules['xx.orth.ph-f'] }, 'indicative/future', 'stage orthography'],
    ['a perfect auxiliary without the auxiliary param', { ...perfect, rule: toyRules['xx.periphrasis.future'] }, 'indicative/perfect/active', 'perfectAuxiliary'],
    ['an auxiliary param of the wrong kind', { ...perfect, rule: { ...auxiliaryRule, params: { auxiliary: 'number' } } }, 'indicative/perfect/active', 'perfectAuxiliary'],
    ['an auxiliary param beside another', { ...perfect, rule: { ...auxiliaryRule, params: { auxiliary: 'text', mood: 'term' } } }, 'indicative/perfect/active', 'perfectAuxiliary'],
    ['an auxiliary param without a perfect auxiliary', { ...future, rule: auxiliaryRule }, 'indicative/future', 'without perfectAuxiliary'],
    ['an empty chain', { ...future, chain: [] }, 'indicative/future', 'no verb'],
    ['a chain without a verb', { ...future, chain: [{ word: 'a', role: 'linker' }] }, 'indicative/future', 'no verb'],
    ['reporting a perfect auxiliary the chain does not use', { ...future, reports: 'perfectAuxiliary' }, 'indicative/future', 'reports perfectAuxiliary'],
  ])('rejects %s, naming the periphrasis', (_, periphrasis, name, reason) => {
    const broken = { ...toyGrammar, periphrases: [toyGrammar.periphrases[1]!, periphrasis] };
    expect(() => validateGrammar(broken)).toThrow(expect.objectContaining({ code: 'GENERATION_FAILURE', message: expect.stringContaining(name) }));
    expect(() => validateGrammar(broken)).toThrow(expect.objectContaining({ message: expect.stringContaining(reason) }));
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

  it('keeps the catalogue wrapper exporting the same key functions', () => {
    expect(catalogue.targetKey).toBe(targetKey);
    expect(catalogue.resolvedTargetKey).toBe(resolvedTargetKey);
  });
});
