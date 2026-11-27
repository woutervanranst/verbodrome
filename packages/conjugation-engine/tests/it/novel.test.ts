/** The invented verbs of grammar design §8.1: every expectation is written by hand from the rules, never generated. */
import { describe, expect, it } from 'vitest';
import { conjugate } from '../../src/index.js';
import { bare, bareOf, texts } from './helpers.js';

const assumptions = (infinitive: string, options: Record<string, unknown> = {}) =>
  conjugate({ language: 'it', infinitive, mood: 'infinitive', tense: 'present', ...options } as never).analysis.steps!
    .filter(step => step.kind === 'assumption').map(step => step.rule);
const R = 'it.classify.assume-regular';
const AV = 'it.classify.assume-avere';

describe('Italian invented verbs (GD §8.1)', () => {
  it('blorpare: regular -are', () => {
    expect(bare('blorpare', 'indicative', 'present')).toEqual(['blorpo', 'blorpi', 'blorpa', 'blorpa', 'blorpiamo', 'blorpate', 'blorpano']);
    expect(bareOf('blorpare', 'indicative', 'imperfect', '1sg')).toBe('blorpavo');
    expect(bare('blorpare', 'indicative', 'simple_past')).toEqual(['blorpai', 'blorpasti', 'blorpò', 'blorpò', 'blorpammo', 'blorpaste', 'blorparono']);
    expect(bareOf('blorpare', 'indicative', 'future', '1sg')).toBe('blorperò');
    expect(bareOf('blorpare', 'conditional', 'present', '1sg')).toBe('blorperei');
    expect([bareOf('blorpare', 'subjunctive', 'present', '1sg'), bareOf('blorpare', 'subjunctive', 'present', '3pl')]).toEqual(['blorpi', 'blorpino']);
    expect(bareOf('blorpare', 'subjunctive', 'imperfect', '1sg')).toBe('blorpassi');
    expect(bare('blorpare', 'imperative', 'present')).toEqual(['blorpa', 'blorpiamo', 'blorpate']);
    expect(bare('blorpare', 'imperative', 'present', { subject: '3sg.formal' })).toEqual(['blorpi']);
    expect(bare('blorpare', 'imperative', 'present', { subject: '3pl.formal' })).toEqual(['blorpino']);
    expect(bare('blorpare', 'imperative', 'negative')[0]).toBe('non blorpare');
    expect([bare('blorpare', 'gerund', 'present')[0], bare('blorpare', 'participle', 'present')[0], bare('blorpare', 'participle', 'past')[0]]).toEqual(['blorpando', 'blorpante', 'blorpato']);
    expect(bareOf('blorpare', 'indicative', 'perfect', '1sg')).toBe('ho blorpato');
    expect(assumptions('blorpare')).toEqual([R, AV]);
  });

  it('flugare and tricare: c and g keep their hard sound', () => {
    expect(bare('flugare', 'indicative', 'present')).toEqual(['flugo', 'flughi', 'fluga', 'fluga', 'flughiamo', 'flugate', 'flugano']);
    expect([bareOf('flugare', 'indicative', 'future', '1sg'), bareOf('flugare', 'subjunctive', 'present', '1sg'), bareOf('flugare', 'subjunctive', 'present', '3pl')]).toEqual(['flugherò', 'flughi', 'flughino']);
    expect([bareOf('flugare', 'indicative', 'simple_past', '1sg'), bareOf('flugare', 'indicative', 'simple_past', '3sg.m')]).toEqual(['flugai', 'flugò']);
    expect([bareOf('tricare', 'indicative', 'present', '2sg'), bareOf('tricare', 'indicative', 'present', '1pl'), bareOf('tricare', 'indicative', 'future', '1sg'), bareOf('tricare', 'subjunctive', 'present', '3pl')])
      .toEqual(['trichi', 'trichiamo', 'tricherò', 'trichino']);
  });

  it('sbonciare, sbasciare, trongiare: the graphic i drops before e and i', () => {
    expect(bare('sbonciare', 'indicative', 'present').slice(0, 6)).toEqual(['sboncio', 'sbonci', 'sboncia', 'sboncia', 'sbonciamo', 'sbonciate']);
    expect([bareOf('sbonciare', 'indicative', 'future', '1sg'), bareOf('sbonciare', 'conditional', 'present', '1sg'), bareOf('sbonciare', 'subjunctive', 'present', '1sg'), bareOf('sbonciare', 'subjunctive', 'present', '3pl'), bareOf('sbonciare', 'indicative', 'simple_past', '1sg')])
      .toEqual(['sboncerò', 'sboncerei', 'sbonci', 'sboncino', 'sbonciai']);
    expect([bareOf('sbasciare', 'indicative', 'present', '2sg'), bareOf('sbasciare', 'indicative', 'present', '1pl'), bareOf('sbasciare', 'indicative', 'future', '1sg')]).toEqual(['sbasci', 'sbasciamo', 'sbascerò']);
    expect([bareOf('trongiare', 'indicative', 'present', '2sg'), bareOf('trongiare', 'indicative', 'present', '1pl'), bareOf('trongiare', 'indicative', 'future', '1sg')]).toEqual(['trongi', 'trongiamo', 'trongerò']);
  });

  it('trebiare: unstressed i by default, stressed with the hint', () => {
    expect(bare('trebiare', 'indicative', 'present')).toEqual(['trebio', 'trebi', 'trebia', 'trebia', 'trebiamo', 'trebiate', 'trebiano']);
    expect([bareOf('trebiare', 'subjunctive', 'present', '1sg'), bareOf('trebiare', 'subjunctive', 'present', '3pl'), bareOf('trebiare', 'indicative', 'future', '1sg')]).toEqual(['trebi', 'trebino', 'trebierò']);
    expect(assumptions('trebiare')).toEqual([R, 'it.classify.assume-unstressed-i', AV]);
    const stressed = { stems: { stressedI: true } };
    expect([bareOf('trebiare', 'indicative', 'present', '2sg', stressed), bareOf('trebiare', 'indicative', 'present', '1pl', stressed), bareOf('trebiare', 'subjunctive', 'present', '1sg', stressed), bareOf('trebiare', 'subjunctive', 'present', '3pl', stressed)])
      .toEqual(['trebii', 'trebiamo', 'trebii', 'trebiino']);
    expect(bare('trebiare', 'imperative', 'present', { ...stressed, subject: '3pl.formal' })).toEqual(['trebiino']);
    expect(assumptions('trebiare', stressed)).toEqual([R, AV]);
  });

  it('frogliare and strognare: no spelling rule', () => {
    expect([bareOf('frogliare', 'indicative', 'present', '2sg'), bareOf('frogliare', 'indicative', 'present', '1pl'), bareOf('frogliare', 'indicative', 'future', '1sg'), bareOf('frogliare', 'subjunctive', 'present', '3pl')]).toEqual(['frogli', 'frogliamo', 'froglierò', 'froglino']);
    expect(bare('strognare', 'indicative', 'present').slice(4, 6)).toEqual(['strogniamo', 'strognate']);
    expect(bare('strognare', 'subjunctive', 'present').slice(4)).toEqual(['strogniamo', 'strogniate', 'strognino']);
    expect(bare('strognare', 'indicative', 'present').join('/')).not.toContain('strognamo');
  });

  it('blendere: regular -ere with both passato remoto series', () => {
    expect(bare('blendere', 'indicative', 'present')).toEqual(['blendo', 'blendi', 'blende', 'blende', 'blendiamo', 'blendete', 'blendono']);
    expect(bare('blendere', 'indicative', 'simple_past')).toEqual(['blendetti/blendei', 'blendesti', 'blendette/blendé', 'blendette/blendé', 'blendemmo', 'blendeste', 'blendettero/blenderono']);
    expect([bareOf('blendere', 'indicative', 'imperfect', '1sg'), bareOf('blendere', 'indicative', 'future', '1sg'), bareOf('blendere', 'subjunctive', 'present', '1sg'), bareOf('blendere', 'subjunctive', 'present', '2pl'), bareOf('blendere', 'subjunctive', 'imperfect', '1sg')])
      .toEqual(['blendevo', 'blenderò', 'blenda', 'blendiate', 'blendessi']);
    expect([bare('blendere', 'imperative', 'present')[0], bare('blendere', 'participle', 'past')[0], bare('blendere', 'gerund', 'present')[0], bare('blendere', 'participle', 'present')[0]]).toEqual(['blendi', 'blenduto', 'blendendo', 'blendente']);
  });

  it('flattere: -ei only after t; flacere: participle-ci', () => {
    expect([bareOf('flattere', 'indicative', 'simple_past', '1sg'), bareOf('flattere', 'indicative', 'simple_past', '3sg.m'), bareOf('flattere', 'indicative', 'simple_past', '3pl')]).toEqual(['flattei', 'flatté', 'flatterono']);
    expect([bareOf('flacere', 'indicative', 'present', '1sg'), bareOf('flacere', 'indicative', 'present', '2sg'), bareOf('flacere', 'indicative', 'present', '3sg.m'), bare('flacere', 'participle', 'past')[0]]).toEqual(['flaco', 'flaci', 'flace', 'flaciuto']);
  });

  it('tronire: -isc- by default, plain with the hint', () => {
    expect(bare('tronire', 'indicative', 'present')).toEqual(['tronisco', 'tronisci', 'tronisce', 'tronisce', 'troniamo', 'tronite', 'troniscono']);
    expect([bareOf('tronire', 'subjunctive', 'present', '1sg'), bareOf('tronire', 'subjunctive', 'present', '3pl'), bare('tronire', 'imperative', 'present')[0], bareOf('tronire', 'imperative', 'present', '3sg.formal')]).toEqual(['tronisca', 'troniscano', 'tronisci', 'tronisca']);
    expect([bareOf('tronire', 'indicative', 'imperfect', '1sg'), bareOf('tronire', 'indicative', 'simple_past', '1sg'), bareOf('tronire', 'indicative', 'simple_past', '3sg.m'), bareOf('tronire', 'indicative', 'future', '1sg')]).toEqual(['tronivo', 'tronii', 'tronì', 'tronirò']);
    expect([bare('tronire', 'participle', 'past')[0], bare('tronire', 'gerund', 'present')[0], bare('tronire', 'participle', 'present')[0]]).toEqual(['tronito', 'tronendo', 'tronente']);
    expect(assumptions('tronire')).toEqual([R, 'it.classify.assume-isc', AV]);
    const plain = { classHint: 'plain' };
    expect(bare('tronire', 'indicative', 'present', plain)).toEqual(['trono', 'troni', 'trone', 'trone', 'troniamo', 'tronite', 'tronono']);
    expect(bareOf('tronire', 'subjunctive', 'present', '1sg', plain)).toBe('trona');
    expect(assumptions('tronire', plain)).toEqual([R, AV]);
  });

  it('sbradurre: the -durre family', () => {
    expect(bare('sbradurre', 'indicative', 'present')).toEqual(['sbraduco', 'sbraduci', 'sbraduce', 'sbraduce', 'sbraduciamo', 'sbraducete', 'sbraducono']);
    expect([bareOf('sbradurre', 'indicative', 'imperfect', '1sg'), bareOf('sbradurre', 'indicative', 'simple_past', '1sg'), bareOf('sbradurre', 'indicative', 'simple_past', '2sg'), bareOf('sbradurre', 'indicative', 'simple_past', '3sg.m'), bareOf('sbradurre', 'indicative', 'simple_past', '3pl')])
      .toEqual(['sbraducevo', 'sbradussi', 'sbraducesti', 'sbradusse', 'sbradussero']);
    expect([bareOf('sbradurre', 'indicative', 'future', '1sg'), bareOf('sbradurre', 'conditional', 'present', '1sg'), bareOf('sbradurre', 'subjunctive', 'present', '1sg'), bareOf('sbradurre', 'subjunctive', 'imperfect', '1sg')]).toEqual(['sbradurrò', 'sbradurrei', 'sbraduca', 'sbraducessi']);
    expect([bare('sbradurre', 'imperative', 'present')[0], bare('sbradurre', 'participle', 'past')[0], bare('sbradurre', 'gerund', 'present')[0], bare('sbradurre', 'participle', 'present')[0]]).toEqual(['sbraduci', 'sbradotto', 'sbraducendo', 'sbraducente']);
    expect(assumptions('sbradurre')).toEqual(['it.classify.assume-family', AV]);
  });

  it('stramettere vs blomettere', () => {
    expect([bareOf('stramettere', 'indicative', 'simple_past', '1sg'), bareOf('stramettere', 'indicative', 'simple_past', '3sg.m'), bareOf('stramettere', 'indicative', 'simple_past', '2sg'), bare('stramettere', 'participle', 'past')[0]]).toEqual(['stramisi', 'stramise', 'stramettesti', 'stramesso']);
    expect(assumptions('stramettere')).toEqual(['it.classify.assume-family', AV]);
    expect([bareOf('blomettere', 'indicative', 'simple_past', '1sg'), bareOf('blomettere', 'indicative', 'simple_past', '2sg'), bareOf('blomettere', 'indicative', 'simple_past', '3sg.m'), bare('blomettere', 'participle', 'past')[0]]).toEqual(['blomettei', 'blomettesti', 'blometté', 'blomettuto']);
    expect(assumptions('blomettere')).toEqual([R, AV]);
  });

  it('blorparsi: reflexive, essere, agreement', () => {
    expect([texts('blorparsi', 'indicative', 'present', { subject: '1sg' })[0], texts('blorparsi', 'indicative', 'present', { subject: '3sg.f' })[0], texts('blorparsi', 'indicative', 'present', { subject: '1pl' })[0]]).toEqual(['io mi blorpo', 'lei si blorpa', 'noi ci blorpiamo']);
    expect(texts('blorparsi', 'indicative', 'perfect').slice(0, 2)).toEqual(['io mi sono blorpato', 'io mi sono blorpata']);
    expect(texts('blorparsi', 'indicative', 'perfect', { subject: '1pl' })).toEqual(['noi ci siamo blorpati', 'noi ci siamo blorpate']);
    expect(bare('blorparsi', 'imperative', 'present')).toEqual(['blorpati', 'blorpiamoci', 'blorpatevi']);
    expect(bare('blorparsi', 'imperative', 'present', { subject: '3sg.formal' })).toEqual(['si blorpi']);
    expect(bare('blorparsi', 'imperative', 'negative')[0]).toBe('non ti blorpare/non blorparti');
    expect([bare('blorparsi', 'infinitive', 'present')[0], bare('blorparsi', 'gerund', 'present')[0], bare('blorparsi', 'infinitive', 'past')[0]]).toEqual(['blorparsi', 'blorpandosi', 'essersi blorpato']);
    expect(assumptions('blorparsi')).toEqual([R]);
  });

  it('blorpare with the essere hint', () => {
    expect(bare('blorpare', 'indicative', 'perfect', { auxiliary: 'essere', subject: '1sg' })).toEqual(['sono blorpato', 'sono blorpata']);
    expect(assumptions('blorpare', { auxiliary: 'essere' })).toEqual([R]);
  });
});
