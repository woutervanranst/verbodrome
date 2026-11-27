import { step } from '../../core/derivation.js';
import type { Unavailability } from '../../core/staged.js';
import type { ResolvedTarget } from '../../types.js';
import type { ItalianLexeme } from './lexicon.js';
import { italianRules as R } from './rules.js';
import { vocabolarioOf } from './sources.js';

/** The subject an impersonal verb keeps: the unmarked third person singular (piove). */
const impersonalSubjects: ReadonlySet<string> = new Set(['3sg.m']);

/**
 * Why a target has no form (grammar design §4.1, §5.4): an impersonal verb outside the unmarked third persons and in the
 * imperative; a verb without an imperative (potere, dovere, parere, solere); a tense the lexicon marks missing, and a
 * present participle the Vocabolario says is lacking (sapere, potere, parere).
 */
export function availabilityOf(lexeme: ItalianLexeme, target: ResolvedTarget): Unavailability | null {
  const source = vocabolarioOf(lexeme.base);
  const entry = lexeme.entry;
  if (lexeme.impersonal && target.person !== null && (target.mood === 'imperative' || !impersonalSubjects.has(target.subject ?? ''))) {
    return { reason: 'impersonal', step: step(R['it.avail.impersonal'], null, null), source };
  }
  if (entry?.flags?.includes('thirdPerson') && target.person !== null && target.person !== 3) {
    return { reason: 'defective', step: step(R['it.avail.third-person'], null, null), source };
  }
  if (target.mood === 'imperative' && entry?.flags?.includes('noImperative')) {
    return { reason: 'noImperative', step: step(R['it.avail.no-imperative'], null, null), source };
  }
  const key = `${target.mood}.${target.tense}`;
  if (entry?.defective?.includes(key) || (key === 'participle.present' && entry?.presentParticiple === null)) {
    return { reason: 'defective', step: step(R['it.avail.defective'], null, null, { mood: { term: 'mood', id: target.mood }, tense: { term: 'tense', id: target.tense } }), source };
  }
  return null;
}
