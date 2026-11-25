/**
 * Which targets a Latin verb has no form for, and why (GD §4.5). This is the only place the pack says that a form does
 * not exist; `source` is the cited page.
 */
import { step } from '../../core/derivation.js';
import type { Unavailability } from '../../core/staged.js';
import type { ResolvedTarget } from '../../types.js';
import { cellKeyOf } from './cells.js';
import type { LatinLexeme } from './lexicon.js';
import { isPerfectTense } from './paradigms.js';
import { latinRules } from './rules.js';
import { latinCitations } from './sources.js';

type AvailabilityRule = Extract<keyof typeof latinRules, `la.avail.${string}`>;

function unavailable(rule: AvailabilityRule, reason: Unavailability['reason'], lexeme: LatinLexeme, params: Readonly<Record<string, string>> = {}): Unavailability {
  const citation = latinCitations[rule];
  const first = Array.isArray(citation) ? citation[0]! : citation as { url?: string; locator: string };
  return { reason, step: step(latinRules[rule], lexeme.lemma, null, params), source: first.url ?? first.locator };
}

const presentNonFinite = (target: ResolvedTarget): boolean =>
  (target.mood === 'infinitive' && target.tense === 'present') || (target.mood === 'participle' && (target.tense === 'present' || target.tense === 'gerundive')) || target.mood === 'gerund';

/** Whether the target is built on the supine stem: participles perfect and future, supine, the perfect system on the participle. */
function needsSupine(lexeme: LatinLexeme, target: ResolvedTarget): boolean {
  const passive = target.voice === 'passive';
  if (target.mood === 'supine') return true;
  if (target.mood === 'participle') return target.tense === 'perfect' || (target.tense === 'future' && !lexeme.futureParticipleStems.length);
  if (target.mood === 'infinitive') {
    if (target.tense === 'perfect') return passive || lexeme.perfectSystem === 'participle';
    if (target.tense === 'future') return passive || lexeme.entry?.infinitive === 'fierī' || !lexeme.futureParticipleStems.length;
    return false;
  }
  return isPerfectTense(target.mood, target.tense) && (passive || lexeme.perfectSystem === 'participle');
}

export function latinAvailability(lexeme: LatinLexeme, target: ResolvedTarget): Unavailability | null {
  const finite = target.person !== null;
  const passive = target.voice === 'passive';
  const perfectSystem = isPerfectTense(target.mood, target.tense) || (target.mood === 'infinitive' && target.tense === 'perfect');
  if (lexeme.lacks.has('present') && ((finite && !isPerfectTense(target.mood, target.tense) && !lexeme.cells[cellKeyOf({
    kind: 'finite', mood: target.mood, tense: target.tense, person: target.person!, number: target.number!,
  })]) || presentNonFinite(target))) return unavailable('la.avail.no-present', 'defective', lexeme);
  if (lexeme.impersonal && finite && (target.person !== 3 || target.number !== 'singular')) return unavailable('la.avail.impersonal', 'impersonal', lexeme);
  if (passive && lexeme.passive === 'none') return unavailable('la.avail.no-passive', 'noPassive', lexeme);
  if (lexeme.passive === 'impersonal' && ((passive && (target.mood === 'imperative' || (finite && (target.person !== 3 || target.number !== 'singular'))))
    || (target.mood === 'participle' && target.tense === 'perfect'))) return unavailable('la.avail.impersonal-passive', 'impersonal', lexeme);
  if (target.mood === 'imperative') {
    // A verb that lists some imperatives of a tense (fīō, A&G p. 115: fī, fīte, fītō) has no others.
    const voice = passive ? 'passive' : 'active';
    const listed = Object.keys(lexeme.cells).filter(key => key.startsWith(`imperative.${target.tense}.${voice}.`));
    const key = cellKeyOf({ kind: 'finite', mood: 'imperative', tense: target.tense, person: target.person!, number: target.number!, ...(passive ? { voice: 'passive' as const } : {}) });
    if (lexeme.lacks.has('imperative') || (listed.length > 0 && !lexeme.cells[key] && !lexeme.lacks.has('present'))) {
      return unavailable('la.avail.no-imperative', 'noImperative', lexeme);
    }
    if (target.tense === 'future' && target.person === 2 && target.number === 'plural' && (passive || lexeme.voiceClass === 'deponent')) {
      return unavailable('la.avail.no-future-imperative-plural', 'defective', lexeme);
    }
  }
  if (target.mood === 'participle' && target.tense === 'present' && lexeme.lacks.has('presentParticiple')) {
    return unavailable('la.avail.no-participle', 'defective', lexeme, { tense: 'present' });
  }
  if (target.mood === 'participle' && target.tense === 'future' && lexeme.lacks.has('futureParticiple')) {
    return unavailable('la.avail.no-participle', 'defective', lexeme, { tense: 'future' });
  }
  if (lexeme.lacks.has('gerund') && (target.mood === 'gerund' || (target.mood === 'participle' && target.tense === 'gerundive' && lexeme.stems.gerund === undefined))) {
    return unavailable('la.avail.no-gerund', 'defective', lexeme);
  }
  if ((lexeme.lacks.has('supineStem') && needsSupine(lexeme, target)) || (lexeme.lacks.has('supine') && target.mood === 'supine')) {
    return unavailable('la.avail.no-supine', 'defective', lexeme);
  }
  if (lexeme.lacks.has('perfect') && perfectSystem && !passive && lexeme.perfectSystem === 'stem') return unavailable('la.avail.no-perfect', 'defective', lexeme);
  return null;
}
