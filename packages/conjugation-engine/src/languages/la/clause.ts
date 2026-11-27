/**
 * The Latin clause (GD §§6.3–6.4): which agreements a participle takes, and the words in recipe order. Latin drops the
 * subject pronoun, so no subject part is added.
 */
import { wordPart } from '../../core/clause.js';
import type { ClauseGrammar } from '../../core/clause.js';
import { step } from '../../core/derivation.js';
import type { DerivationStep } from '../../core/derivation.js';
import { one } from '../../core/fork.js';
import type { Fork } from '../../core/fork.js';
import type { Agreement, Gender } from '../../core/grammar.js';
import type { PartFeatures } from '../../types.js';
import { agreementsFor } from './declension.js';
import { foremMark } from './irregulars.js';
import type { LatinLexeme } from './lexicon.js';
import { latinRules } from './rules.js';

const genders: readonly Gender[] = ['masculine', 'feminine', 'neuter'];

/** The features of a non-finite word (GD §6.4): its mood, tense and verb form, which the cell does not carry. */
const nonFiniteFeatures: Readonly<Record<string, Partial<PartFeatures>>> = {
  presentInfinitive: { mood: 'infinitive', tense: 'present', verbForm: 'infinitive' },
  presentInfinitivePassive: { mood: 'infinitive', tense: 'present', verbForm: 'infinitive', voice: 'passive' },
  perfectInfinitive: { mood: 'infinitive', tense: 'perfect', verbForm: 'infinitive' },
  presentParticiple: { mood: 'participle', tense: 'present', verbForm: 'presentParticiple' },
  perfectParticiple: { mood: 'participle', tense: 'perfect', verbForm: 'pastParticiple' },
  futureParticiple: { mood: 'participle', tense: 'future', verbForm: 'futureParticiple' },
  gerundive: { mood: 'participle', tense: 'gerundive', verbForm: 'gerundive' },
  gerund: { mood: 'gerund', tense: 'present', verbForm: 'gerund' },
  supine: { mood: 'supine', tense: 'present', verbForm: 'supine' },
  fore: { mood: 'infinitive', tense: 'future', verbForm: 'infinitive' },
};

const unagreeing = new Set(['presentInfinitive', 'presentInfinitivePassive', 'perfectInfinitive']);

export const latinClause: ClauseGrammar<LatinLexeme> = {
  /**
   * The subject gender a form shows, as in French: a compound finite form of an ungendered slot (the perfect passive, a
   * deponent's perfect) shows the three genders of its participle (amātus, amāta, amātum sum). A gendered slot, an
   * impersonal form and every other form keep the target's own. The agreement step says why, so this records no step.
   */
  subjectGenders({ lexeme, target, agreeing }): Fork<Gender | null> {
    if (target.gender !== null || target.person === null || target.number === null) return one(target.gender);
    const [cell] = agreeing;
    if (cell === undefined || cell.kind !== 'nonFinite' || unagreeing.has(cell.form)) return one(target.gender);
    if ((lexeme.passive === 'impersonal' && target.voice === 'passive') || lexeme.impersonal) return one(target.gender);
    return genders.flatMap(gender => one<Gender | null>(gender));
  },

  agreements({ query, lexeme, target, subject, agreeing }): Fork<Agreement | null> {
    const [cell] = agreeing;
    if (cell === undefined || cell.kind !== 'nonFinite' || unagreeing.has(cell.form)) return one(null);
    // An impersonal passive (itum est) and an impersonal verb (licitūrum esse, A&G §207) stand in the neuter singular.
    const impersonal = (lexeme.passive === 'impersonal' && target.voice === 'passive') || lexeme.impersonal;
    if (target.person !== null && target.number !== null) {
      // A compound finite form agrees with its subject; an impersonal passive stands in the neuter singular.
      if (impersonal) return one({ gender: 'neuter', number: 'singular', case: 'nominative' }, [step(latinRules['la.clause.agree-impersonal'], null, null)]);
      const chosen = target.gender ?? subject?.gender;
      const number = target.number;
      return (chosen ? [chosen] : genders).flatMap(gender => one<Agreement | null>({ gender, number, case: 'nominative' }, [
        step(latinRules['la.clause.agree-subject'], null, null, { gender: { term: 'gender', id: gender }, number: { term: 'number', id: number } }),
      ]));
    }
    const infinitive = target.mood === 'infinitive';
    const agreements = agreementsFor(cell.form, query, lexeme, infinitive, impersonal);
    return agreements.flatMap(agreement => {
      const steps: DerivationStep[] = infinitive && impersonal ? [step(latinRules['la.clause.agree-impersonal'], null, null)]
        : infinitive && query.agreement !== undefined
          ? [step(latinRules['la.clause.agree-subject'], null, null, { gender: { term: 'gender', id: agreement.gender }, number: { term: 'number', id: agreement.number } })]
          : [];
      return one<Agreement | null>(agreement, steps);
    });
  },

  assemble(words, { lexeme, target, rendering }) {
    // forem is not used in the compound tenses (they are built with essem, GD §2.4): sum's cell marks it.
    if (words.some(word => word.role === 'auxiliary' && word.marks?.includes(foremMark))) return [];
    const parts = words.map(word => wordPart(rendering, word, word.cell?.kind === 'nonFinite' ? nonFiniteFeatures[word.cell.form] ?? {} : {}));
    const active = target.voice === 'active';
    const steps: DerivationStep[] = [];
    if (lexeme.voiceClass === 'deponent' && active && !(target.mood === 'infinitive' && target.tense === 'future')) {
      steps.push(step(latinRules['la.clause.deponent'], null, null));
    }
    const perfectSystem = ['perfect', 'pluperfect', 'future_perfect'].includes(target.tense);
    if (lexeme.voiceClass === 'semiDeponent' && active && perfectSystem) steps.push(step(latinRules['la.clause.semi-deponent'], null, null));
    return one(parts, steps);
  },
};
