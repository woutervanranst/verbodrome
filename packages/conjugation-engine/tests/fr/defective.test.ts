/**
 * Suppletive and defective French verbs (GD §4.7, §5.2): which targets have no form, with which reason and rule, and
 * the listed words that stand in for formation.
 */
import { describe, expect, it } from 'vitest';
import { engine as shadow } from '../../src/default-engine.js';

type Query = Readonly<Record<string, unknown>>;
const conjugate = (infinitive: string, query: Query = {}) => shadow.conjugate({ language: 'fr', infinitive, ...query });
const gaps = (infinitive: string, query: Query = {}) => conjugate(infinitive, query).unavailableTargets
  .map(item => `${item.target.mood}/${item.target.tense}/${item.target.person ?? '-'}/${item.target.number ?? '-'} ${item.reason}`);
const rules = (infinitive: string, query: Query = {}) => conjugate(infinitive, query).unavailableTargets.map(item => item.step?.rule);
const texts = (infinitive: string, query: Query = {}) => conjugate(infinitive, query).forms.map(form => form.text);
const present = { mood: 'indicative', tense: 'present' };

describe('French defective verbs', () => {
  it('falloir: only il faut; 1sg and 3pl impersonal; no present participle (defective); no imperative', () => {
    expect(texts('falloir', present)).toEqual(['il faut']);
    expect(gaps('falloir', present)).toEqual([
      'indicative/present/1/singular impersonal', 'indicative/present/2/singular impersonal', 'indicative/present/1/plural impersonal',
      'indicative/present/2/plural impersonal', 'indicative/present/3/plural impersonal',
    ]);
    expect(rules('falloir', { ...present, person: 1, number: 'singular' })).toEqual(['fr.avail.impersonal']);
    expect(gaps('falloir', { mood: 'participle', tense: 'present' })).toEqual(['participle/present/-/- defective']);
    expect(gaps('falloir', { mood: 'imperative', tense: 'present' })).toEqual([
      'imperative/present/2/singular noImperative', 'imperative/present/1/plural noImperative', 'imperative/present/2/plural noImperative',
    ]);
    expect(conjugate('falloir', { ...present, person: 1, number: 'singular' }).unavailableTargets[0]!.explanation)
      .not.toContain('fr.avail');
  });

  it('pleuvoir: il pleut; ils pleuvent and elles pleuvent with condition figurative', () => {
    const forms = conjugate('pleuvoir', present).forms.map(form => [form.text, form.variant.condition]);
    expect(forms).toEqual([['il pleut', null], ['ils pleuvent', 'figurative'], ['elles pleuvent', 'figurative']]);
  });

  it('clore: il clot (rectified) / il clôt (traditional); imparfait defective in all persons; nous allons clore available', () => {
    expect(conjugate('clore', { ...present, person: 3, number: 'singular' }).forms.map(form => [form.text, form.variant.orthography]))
      .toEqual([['il clot', 'rectified'], ['il clôt', 'traditional'], ['elle clot', 'rectified'], ['elle clôt', 'traditional']]);
    expect(gaps('clore', { mood: 'indicative', tense: 'imperfect' })).toHaveLength(6);
    // Available: only the infinitive is needed (the periphrasis itself comes with the compound tenses).
    expect(gaps('clore', { mood: 'indicative', tense: 'near_future' }).filter(line => / (defective|impersonal|noImperative)$/u.test(line))).toEqual([]);
  });

  it('gésir: no compound tense (defective), no subjunctive', () => {
    expect(gaps('gésir', { mood: 'indicative', tense: 'perfect' })).toHaveLength(6);
    expect(new Set(gaps('gésir', { mood: 'subjunctive' }).map(line => line.split(' ')[1]))).toEqual(new Set(['defective']));
    expect(gaps('gésir', { mood: 'subjunctive' })).toHaveLength(24);
    expect(texts('gésir', { ...present, person: 3, number: 'singular' })).toEqual(['il git', 'il gît', 'elle git', 'elle gît']);
  });

  it('seoir: il sied, séant then seyant; je: defective; compounds defective', () => {
    expect(texts('seoir', { ...present, person: 3, number: 'singular' })).toEqual(['il sied', 'elle sied']);
    expect(texts('seoir', { mood: 'participle', tense: 'present' })).toEqual(['séant', 'seyant']);
    expect(gaps('seoir', { ...present, person: 1, number: 'singular' })).toEqual(['indicative/present/1/singular defective']);
    expect(rules('seoir', { ...present, person: 1, number: 'singular' })).toEqual(['fr.avail.third-person-only']);
    expect(gaps('seoir', { mood: 'indicative', tense: 'perfect', person: 3, number: 'singular' })).toEqual(['indicative/perfect/3/singular defective']);
  });

  it('advenir: 1sg defective, imperative noImperative; ensuivre: 3rd person only', () => {
    expect(gaps('advenir', { ...present, person: 1, number: 'singular' })).toEqual(['indicative/present/1/singular defective']);
    expect(gaps('advenir', { mood: 'imperative', tense: 'present', person: 2, number: 'singular' })).toEqual(['imperative/present/2/singular noImperative']);
    expect(gaps('s\'ensuivre', { ...present, person: 2, number: 'plural' })).toEqual(['indicative/present/2/plural defective']);
    expect(texts('s\'ensuivre', { ...present, person: 3, number: 'singular' })).toEqual(['il s\'ensuit', 'elle s\'ensuit']);
  });

  it('ester / accroire: infinitive only; férir: féru as participle, everything else defective', () => {
    expect(texts('accroire', { mood: 'infinitive', tense: 'present' })).toEqual(['accroire']);
    expect(gaps('ester', { mood: 'indicative', tense: 'present' })).toHaveLength(6);
    expect(texts('férir', { mood: 'participle', tense: 'past', agreement: { gender: 'masculine', number: 'singular' } })).toEqual(['féru']);
    expect(gaps('férir', { mood: 'participle', tense: 'present' })).toEqual(['participle/present/-/- defective']);
  });

  it('reports a target once when every paradigm of choir lacks it', () => {
    expect(gaps('choir', { mood: 'indicative', tense: 'imperfect', person: 1, number: 'singular' })).toEqual(['indicative/imperfect/1/singular defective']);
    expect(texts('choir', { mood: 'indicative', tense: 'future', person: 1, number: 'singular' })).toEqual(['je choirai', 'je cherrai']);
  });

  it('se laver: imperative past is noImperative for every person', () => {
    expect(gaps('se laver', { mood: 'imperative', tense: 'past' })).toEqual([
      'imperative/past/2/singular noImperative', 'imperative/past/1/plural noImperative', 'imperative/past/2/plural noImperative',
    ]);
    expect(rules('se laver', { mood: 'imperative', tense: 'past' })).toEqual(Array(3).fill('fr.avail.pronominal-imperative-past'));
  });
});
