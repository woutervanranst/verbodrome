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

/** A lexeme for these tests: aimer, or a verb of the family `family`. */
function lexeme(lemma: string, family?: string): FrenchLexeme {
  const entry = family === undefined ? null : frenchFamilies.find(candidate => candidate.id === family)!;
  return {
    lemma, verbId: lemma, classId: family ?? 'aimer', classSource: family ? 'lexicon' : 'regularRule', reflexive: false,
    auxiliaries: ['avoir'], particle: null, group: family ? null : 'er', family: entry,
    paradigm: entry ? entry.paradigms[0]! : { pattern: null }, label: family ?? 'aimer', hints: null, indirect: false,
    aspiratedH: false, restriction: {},
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
