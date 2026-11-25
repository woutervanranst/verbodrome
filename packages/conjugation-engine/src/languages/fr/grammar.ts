/**
 * The French grammar on the staged core (GD). It runs in shadow mode until plan 3 Task 8: the registered pack keeps the
 * legacy engine, and `tests/fr/shadow.test.ts` compares this grammar with the frozen snapshot section by section. A
 * stage that is not migrated yet throws GENERATION_FAILURE `fr.<stage> not migrated yet`.
 */
import type { LexemeBase } from '../../core/grammar.js';
import { validateGrammar } from '../../core/staged.js';
import type { Cell, StagedGrammar } from '../../core/staged.js';
import type { FrenchStemHints, ResolvedTarget } from '../../types.js';
import { classifyFrench, frenchLexemeOf } from './classify.js';
import { frenchClause } from './clause.js';
import type { FamilyEntry, FamilyParadigm } from './family.js';
import type { LexicalRestriction } from './lexicon.js';
import { frenchOrthography } from './orthography.js';
import { frenchEnding, frenchStem, notMigrated } from './stems.js';

export { notMigrated } from './stems.js';

/** A productive verb's paradigm: payer-class verbs have two (`y-to-i`, `keep-y`), every other one has one. */
export interface ProductiveParadigm { readonly pattern: 'y-to-i' | 'keep-y' | null }

export interface FrenchLexeme extends LexemeBase {
  /** The productive group (er, ir, re) whose endings the verb takes; null for a family or a principal-parts hint. */
  readonly group: 'er' | 'ir' | 're' | null;
  readonly family: FamilyEntry | null;
  /** The family paradigm being built, or the productive verb's. */
  readonly paradigm: FamilyParadigm | ProductiveParadigm;
  /** The model id `analysis.classification` reports: the family, or the label the productive rules compute (GD §3.2). */
  readonly label: string;
  /** The principal parts a `stems` hint gives, which replace the verb's own. */
  readonly hints: FrenchStemHints | null;
  /** The reflexive pronoun is an indirect object (se parler): the participle does not agree with it. */
  readonly indirect: boolean;
  /** The initial h is aspirated: no elision before the verb. */
  readonly aspiratedH: boolean;
  /** Persons or moods the verb lacks although its family has them (advenir, ensuivre). */
  readonly restriction: LexicalRestriction;
}

const simpleFinite: Readonly<Record<string, readonly string[]>> = {
  indicative: ['present', 'imperfect', 'simple_past', 'future'],
  subjunctive: ['present', 'imperfect'],
  conditional: ['present'],
  imperative: ['present'],
};

/**
 * The simple cell of a target, or null for a compound one (GD §2): the finite simple tenses are cells of their own
 * mood and tense; the present infinitive and both participles are non-finite cells; the present gerund is the present
 * participle (the clause adds en). Every other target is a periphrasis.
 */
export function frenchCellOf(target: ResolvedTarget): Cell | null {
  const { mood, tense, person, number } = target;
  if (mood === 'infinitive') return tense === 'present' ? { kind: 'nonFinite', form: 'infinitive' } : null;
  if (mood === 'participle') {
    if (tense === 'present') return { kind: 'nonFinite', form: 'presentParticiple' };
    return tense === 'past' ? { kind: 'nonFinite', form: 'pastParticiple' } : null;
  }
  if (mood === 'gerund') return tense === 'present' ? { kind: 'nonFinite', form: 'presentParticiple' } : null;
  if (person === null || number === null || !simpleFinite[mood]?.includes(tense)) return null;
  return { kind: 'finite', mood, tense, person, number };
}

export const frenchGrammar: StagedGrammar<FrenchLexeme> = {
  classify: classifyFrench,
  lexemeOf: frenchLexemeOf,
  cellOf(target) {
    const cell = frenchCellOf(target);
    if (cell === null) throw notMigrated('periphrasis');
    return cell;
  },
  /** Not migrated yet (Task 5): a verb that can lack a form is reported as not migrated; any other has every form. */
  availability(lexeme, target) {
    const flags = lexeme.family?.flags;
    if (flags?.impersonal || flags?.thirdPersonOnly || flags?.noImperative || flags?.compounds
      || lexeme.restriction.thirdPersonOnly || lexeme.restriction.noImperative) throw notMigrated('availability');
    if (lexeme.reflexive && target.mood === 'imperative' && target.tense === 'past') throw notMigrated('availability');
    return null;
  },
  stem: frenchStem,
  ending: frenchEnding,
  orthography: frenchOrthography,
  periphrases: [],
  clause: frenchClause,
};
validateGrammar(frenchGrammar);
