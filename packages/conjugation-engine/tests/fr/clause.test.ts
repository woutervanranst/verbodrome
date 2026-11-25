/**
 * The French clause on its own (GD §6): which subject genders a form shows, and how the participle agrees.
 */
import { describe, expect, it } from 'vitest';
import type { ClauseContext } from '../../src/core/clause.js';
import { frenchSubjects } from '../../src/languages/fr/catalogue.js';
import { frenchClause } from '../../src/languages/fr/clause.js';
import { frenchFamilies } from '../../src/languages/fr/families.js';
import type { FrenchLexeme } from '../../src/languages/fr/grammar.js';
import { frenchRendering } from '../../src/languages/fr/rendering.js';
import type { ResolvedTarget } from '../../src/types.js';
import { engine as shadow } from '../../src/default-engine.js';

/** A lexeme for these tests: aimer, or a verb of the family `family`. */
function lexeme(lemma: string, family?: string): FrenchLexeme {
  const entry = family === undefined ? null : frenchFamilies.find(candidate => candidate.id === family)!;
  return {
    lemma, verbId: lemma, classId: family ?? 'aimer', classSource: family ? 'lexicon' : 'regularRule', reflexive: false,
    auxiliaries: ['avoir'], particle: null, group: family ? null : 'er', family: entry,
    paradigm: entry ? entry.paradigms[0]! : { pattern: null }, label: family ?? 'aimer', hints: null, indirect: false,
    aspiratedH: false, auxiliaryChoice: false, restriction: {},
  };
}

function context(verb: FrenchLexeme, target: Partial<ResolvedTarget>, query: Readonly<Record<string, unknown>> = {}): ClauseContext<FrenchLexeme> {
  const full: ResolvedTarget = { mood: 'indicative', tense: 'present', person: 3, number: 'singular', gender: null, agreement: null, ...target };
  const subject = frenchSubjects.find(slot => slot.person === full.person && slot.number === full.number) ?? null;
  return {
    query: { language: 'fr', infinitive: verb.lemma, ...query }, lexeme: verb, target: subject ? { ...full, subject: subject.id } : full,
    subject, agreeing: [], auxiliary: null, rendering: frenchRendering,
  };
}

const genders = (ctx: ClauseContext<FrenchLexeme>) => frenchClause.subjectGenders!(ctx).map(outcome => outcome.value);
const rules = (ctx: ClauseContext<FrenchLexeme>) => frenchClause.subjectGenders!(ctx).map(outcome => outcome.steps.map(step => step.rule));

describe('French subject genders', () => {
  it('forks a third-person subject into il and elle', () => {
    expect(genders(context(lexeme('aimer'), {}))).toEqual(['masculine', 'feminine']);
    expect(rules(context(lexeme('aimer'), { number: 'plural' }))).toEqual([['fr.clause.subject-gender'], ['fr.clause.subject-gender']]);
  });

  it('shows no gender for je, tu, nous, vous in a simple tense', () => {
    for (const [person, number] of [[1, 'singular'], [2, 'singular'], [1, 'plural'], [2, 'plural']] as const) {
      expect(genders(context(lexeme('aimer'), { person, number }))).toEqual([null]);
    }
  });

  it('gives the impersonal il of falloir no gender, with the impersonal step', () => {
    expect(genders(context(lexeme('falloir', 'falloir'), {}))).toEqual([null]);
    expect(rules(context(lexeme('falloir', 'falloir'), {}))).toEqual([['fr.clause.impersonal-subject']]);
    // pleuvoir is impersonal in the singular only: ils pleuvent and elles pleuvent are figurative.
    expect(genders(context(lexeme('pleuvoir', 'pleuvoir'), {}))).toEqual([null]);
    expect(genders(context(lexeme('pleuvoir', 'pleuvoir'), { number: 'plural' }))).toEqual(['masculine', 'feminine']);
  });

  it('keeps only the gender the query names', () => {
    expect(genders(context(lexeme('aimer'), {}, { gender: 'feminine' }))).toEqual(['feminine']);
  });

  it('shows no gender for a target without a person', () => {
    expect(genders(context(lexeme('aimer'), { mood: 'infinitive', person: null, number: null }))).toEqual([null]);
  });
});

type Query = Readonly<Record<string, unknown>>;
const conjugate = (infinitive: string, query: Query) => shadow.conjugate({ language: 'fr', infinitive, ...query });
const lines = (infinitive: string, query: Query) => conjugate(infinitive, query).forms.map(form =>
  `${form.text} ${form.target.gender ?? '-'}/${form.target.agreement ? `${form.target.agreement.gender}.${form.target.agreement.number}` : '-'}`);
const texts = (infinitive: string, query: Query) => conjugate(infinitive, query).forms.map(form => form.text);
const perfect = (person: 1 | 2 | 3, number: 'singular' | 'plural') => ({ mood: 'indicative', tense: 'perfect', person, number });

describe('French compound tenses and the clause', () => {
  it('aller perfect 1sg: je suis allé (masculine/masculine.singular), je suis allée (feminine/feminine.singular)', () => {
    expect(lines('aller', perfect(1, 'singular'))).toEqual(['je suis allé masculine/masculine.singular', 'je suis allée feminine/feminine.singular']);
  });

  it('monter perfect: both auxiliaries, in the legacy order, each with its condition', () => {
    expect(lines('monter', perfect(1, 'singular'))).toEqual([
      'j\'ai monté -/masculine.singular', 'je suis monté masculine/masculine.singular', 'je suis montée feminine/feminine.singular',
    ]);
    const third = conjugate('monter', perfect(3, 'singular')).forms;
    expect(third.map(form => [form.text, form.preferred])).toEqual([
      ['il a monté', true], ['il est monté', false], ['elle a monté', true], ['elle est montée', true],
    ]);
    expect(third[1]!.variant.condition).toBe('être: auxiliary choice depends on construction or lexical sense.');
  });

  it('aimer + precedingDirectObject feminine plural: nous avons aimées', () => {
    expect(texts('aimer', { ...perfect(1, 'plural'), precedingDirectObject: { gender: 'feminine', number: 'plural' } })).toEqual(['nous avons aimées']);
  });

  it('se laver indirect: je me suis lavé, elle s\'est lavé', () => {
    const indirect = { reflexiveObject: 'indirect' };
    expect(lines('se laver', { ...perfect(1, 'singular'), ...indirect })).toEqual(['je me suis lavé -/masculine.singular']);
    expect(lines('se laver', { ...perfect(3, 'singular'), ...indirect })).toEqual([
      'il s\'est lavé masculine/masculine.singular', 'elle s\'est lavé feminine/masculine.singular',
    ]);
    expect(texts('se parler', perfect(1, 'plural'))).toEqual(['nous nous sommes parlé']);
  });

  it('s\'asseoir: je me suis assise (assois then assieds); s\'être assis for masculine plural', () => {
    const assise = conjugate('s\'asseoir', { ...perfect(1, 'singular'), gender: 'feminine' }).forms;
    expect(assise.map(form => [form.text, form.variant.pattern])).toEqual([['je me suis assise', 'assois'], ['je me suis assise', 'assieds']]);
    expect(conjugate('s\'asseoir', { mood: 'infinitive', tense: 'past', agreement: { gender: 'masculine', number: 'plural' } }).forms
      .map(form => form.text)).toEqual(['s\'être assis', 's\'être assis']);
  });

  it('reflexive near future and recent past: je vais me laver; je viens de me laver; je vais m\'asseoir (rectified assoir first)', () => {
    const near = { mood: 'indicative', tense: 'near_future', person: 1, number: 'singular' };
    expect(texts('se laver', near)).toEqual(['je vais me laver']);
    expect(texts('se laver', { ...near, tense: 'recent_past' })).toEqual(['je viens de me laver']);
    expect(conjugate('s\'asseoir', near).forms.map(form => [form.text, form.variant.pattern, form.variant.orthography])).toEqual([
      ['je vais m\'assoir', 'assois', 'rectified'], ['je vais m\'assoir', 'assieds', 'rectified'],
      ['je vais m\'asseoir', 'assois', 'traditional'], ['je vais m\'asseoir', 'assieds', 'traditional'],
    ]);
  });

  it('conditional past: j\'aurais aimé (past-first, standard), j\'eusse aimé (past-second, literary)', () => {
    const forms = conjugate('aimer', { mood: 'conditional', tense: 'past', person: 1, number: 'singular' }).forms;
    expect(forms.map(form => [form.text, form.variant.pattern, form.variant.usage, form.preferred])).toEqual([
      ['j\'aurais aimé', 'past-first', 'standard', true], ['j\'eusse aimé', 'past-second', 'literary', false],
    ]);
    expect(conjugate('payer', { mood: 'conditional', tense: 'past', person: 1, number: 'singular' }).forms[0]!.variant.pattern).toBe('y-to-i.past-first');
  });

  it('participle forms: monté, montés, montée, montées; dormi only; fallu; ayant aimé; en ayant aimé', () => {
    expect(texts('monter', { mood: 'participle', tense: 'past' })).toEqual(['monté', 'montés', 'montée', 'montées']);
    expect(texts('dormir', { mood: 'participle', tense: 'past' })).toEqual(['dormi']);
    expect(texts('falloir', { mood: 'participle', tense: 'past' })).toEqual(['fallu']);
    expect(texts('aimer', { mood: 'participle', tense: 'perfect' })).toEqual(['ayant aimé']);
    expect(texts('aimer', { mood: 'gerund', tense: 'past' })).toEqual(['en ayant aimé']);
  });

  it('elision and aspirated h: j\'aime, qu\'il aille, je viens d\'aimer; je hais, j\'hais with aspiratedH false', () => {
    expect(texts('aimer', { mood: 'indicative', tense: 'present', person: 1, number: 'singular' })).toEqual(['j\'aime']);
    expect(texts('aller', { mood: 'subjunctive', tense: 'present', person: 3, number: 'singular', gender: 'masculine' })).toEqual(['qu\'il aille']);
    expect(texts('aimer', { mood: 'indicative', tense: 'recent_past', person: 1, number: 'singular' })).toEqual(['je viens d\'aimer']);
    expect(texts('haïr', { mood: 'indicative', tense: 'present', person: 1, number: 'singular' })).toEqual(['je hais']);
    expect(texts('haïr', { mood: 'indicative', tense: 'present', person: 1, number: 'singular', aspiratedH: false })).toEqual(['j\'hais']);
    const elision = conjugate('aimer', { mood: 'indicative', tense: 'present', person: 1, number: 'singular' }).forms[0]!.steps!.at(-1);
    expect([elision!.rule, elision!.before, elision!.after]).toEqual(['fr.clause.elision', 'je', 'j\'']);
  });

  it('records the steps of je suis allée: periphrasis, subject gender, agree-subject, auxiliary word, participle ending', () => {
    const form = conjugate('aller', { ...perfect(1, 'singular'), gender: 'feminine' }).forms[0]!;
    expect(form.text).toBe('je suis allée');
    expect(form.steps!.map(step => step.rule)).toEqual([
      'fr.periphrasis.perfect', 'fr.clause.subject-gender', 'fr.clause.agree-subject', 'fr.clause.subject',
    ]);
    expect(form.parts.find(part => part.role === 'auxiliary')!.steps!.map(step => step.rule)).toEqual(['fr.stem.present-singular', 'fr.end.present-singular']);
    expect(form.parts.at(-1)!.steps!.map(step => step.rule)).toEqual(['fr.stem.participle', 'fr.end.past-participle']);
  });
});
