/**
 * Whole-word cells (design §4.2): be's present and past and its irrealis were, has, and the listed past and past
 * participle forms. A listed form is a lexical fact; a regular alternate beside it (`form: null`) is derived by the
 * regular stages. In a cell with two or more alternates each is tagged `pattern: 'irregular'` or `'regular'`, and an
 * alternate's region and usage become its tags.
 */
import { step } from '../../core/derivation.js';
import { chain, one } from '../../core/fork.js';
import type { Fork, VariantTags } from '../../core/fork.js';
import type { Cell } from '../../core/staged.js';
import { itemAt } from '../../parts.js';
import type { EnglishLexeme } from './classify.js';
import type { Alternate } from './lexicon.js';
import { englishRules } from './rules.js';

type FiniteCell = Extract<Cell, { kind: 'finite' }>;

const rules = englishRules;

/** be's indicative forms, singular 1-2-3 then plural 1-2-3. */
const beForms = {
  present: ['am', 'are', 'is', 'are', 'are', 'are'],
  past: ['was', 'were', 'was', 'were', 'were', 'were'],
} as const;

function slot(cell: FiniteCell): number {
  return (cell.number === 'plural' ? 3 : 0) + cell.person - 1;
}

/** The tags of one alternate in a cell; `several` adds whether it is the listed or the regular form. */
function alternateTags(alternate: Alternate, several: boolean): VariantTags {
  return {
    ...(alternate.region === undefined ? {} : { region: alternate.region }),
    ...(alternate.usage === undefined ? {} : { usage: alternate.usage }),
    ...(several ? { pattern: alternate.form === null ? 'regular' : 'irregular' } : {}),
  };
}

/**
 * The forms of a past or past participle cell from its alternates, or null when there is nothing listed (a regular
 * verb, or a regular paradigm such as hanged). `regularCell` is the cell the regular alternate is derived in.
 */
function alternatesCell(
  lexeme: EnglishLexeme,
  alternates: readonly Alternate[],
  rule: (typeof rules)['en.cell.past-listed' | 'en.cell.participle-listed'],
  regularCell: Cell,
  regular: (cell: Cell) => Fork<string>,
): Fork<string> | null {
  const [only] = alternates;
  if (only === undefined || (alternates.length === 1 && only.form === null && only.region === undefined && only.usage === undefined)) return null;
  const several = alternates.length > 1;
  return alternates.flatMap(alternate => {
    const tags = alternateTags(alternate, several);
    if (alternate.form === null) return chain(one(null, [], tags), () => regular(regularCell));
    return one(alternate.form, [step(rule, lexeme.lemma, alternate.form)], tags);
  });
}

/**
 * The `cell` hook: the whole word of a cell when the lexicon lists it, otherwise null (the stages derive it).
 * `regular` derives a cell of the lexeme as a regular verb, for the -ed alternates of a listed cell.
 */
export function listedCell(lexeme: EnglishLexeme, cell: Cell, regular: (cell: Cell) => Fork<string>): Fork<string> | null {
  if (cell.kind === 'nonFinite') {
    return cell.form === 'pastParticiple' ? alternatesCell(lexeme, lexeme.participle, rules['en.cell.participle-listed'], cell, regular) : null;
  }
  if (lexeme.classId === 'suppletive') {
    if (cell.mood === 'indicative' && (cell.tense === 'present' || cell.tense === 'past')) {
      const word = itemAt(beForms[cell.tense], slot(cell));
      return one(word, [step(rules['en.cell.be'], lexeme.lemma, word, {
        person: { term: 'person', id: String(cell.person) }, number: { term: 'number', id: cell.number }, tense: { term: 'tense', id: cell.tense },
      })]);
    }
    if (cell.mood === 'subjunctive' && cell.tense === 'past') return one('were', [step(rules['en.cell.irrealis-were'], lexeme.lemma, 'were')]);
    return null;
  }
  if (lexeme.lemma === 'have' && cell.mood === 'indicative' && cell.tense === 'present' && cell.person === 3 && cell.number === 'singular') {
    return one('has', [step(rules['en.cell.has'], lexeme.lemma, 'has')]);
  }
  if (cell.tense !== 'past' || (cell.mood !== 'indicative' && cell.mood !== 'subjunctive')) return null;
  // The past subjunctive is the past form: the regular alternate is the indicative past's.
  const pastCell: Cell = { kind: 'finite', mood: 'indicative', tense: 'past', person: cell.person, number: cell.number };
  const listed = alternatesCell(lexeme, lexeme.past, rules['en.cell.past-listed'], pastCell, regular);
  if (listed === null || cell.mood === 'indicative') return listed;
  return chain(one(null, [step(rules['en.end.irrealis-past'], null, null)]), () => listed);
}

/** The stem of every cell the stages derive: the plain form itself. */
export function stemOf(lexeme: EnglishLexeme): Fork<string> {
  return one(lexeme.lemma);
}
