import type { Cell, StagedGrammar } from '../../core/staged.js';
import { ConjugationError } from '../../errors.js';
import type { ResolvedTarget } from '../../types.js';
import { classifyGerman, germanLexemeOf } from './classify.js';
import type { GermanLexeme } from './classify.js';
import { germanOrthography } from './orthography.js';
import { germanEnding } from './paradigms.js';
import { germanCell, germanStem } from './stems.js';

export type { GermanLexeme } from './classify.js';

function notBuilt(hook: string): never {
  throw new ConjugationError('GENERATION_FAILURE', `German ${hook} is not built yet.`);
}

/** The one-word tenses: Präsens, Präteritum, Konjunktiv I and II and the imperative; every other finite tense is a compound. */
const simple = new Set(['indicative.present', 'indicative.past', 'subjunctive.present', 'subjunctive.past', 'imperative.present']);

/** The cell of a one-word target; null for a compound tense (built by a periphrasis). */
export function germanCellOf(target: ResolvedTarget): Cell | null {
  if (target.mood === 'infinitive') return target.tense === 'present' ? { kind: 'nonFinite', form: 'infinitive' } : null;
  if (target.mood === 'participle') return { kind: 'nonFinite', form: target.tense === 'present' ? 'presentParticiple' : 'pastParticiple' };
  if (target.person === null || target.number === null || !simple.has(`${target.mood}.${target.tense}`)) return null;
  return { kind: 'finite', mood: target.mood, tense: target.tense, person: target.person, number: target.number };
}

/** The German grammar: classification, then stems, endings and spelling rules, compound tenses and the main clause. */
export const germanGrammar: StagedGrammar<GermanLexeme> = {
  classify: classifyGerman,
  lexemeOf: germanLexemeOf,
  cellOf: germanCellOf,
  availability: () => notBuilt('availability'),
  cell: germanCell,
  stem: germanStem,
  ending: germanEnding,
  orthography: germanOrthography,
  periphrases: [],
  clause: {
    agreements: () => notBuilt('agreements'),
    assemble: () => notBuilt('assemble'),
  },
};
