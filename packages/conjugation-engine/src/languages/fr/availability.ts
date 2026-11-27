/**
 * Which French targets have no form, and why (GD §4.7). Asked once per paradigm. The reason printed is the first that
 * applies in this order: pronominal past imperative, no imperative, impersonal, a defective cell (or compound), third
 * person only.
 */
import { step } from '../../core/derivation.js';
import type { Unavailability } from '../../core/staged.js';
import type { ResolvedTarget } from '../../types.js';
import { cellNames } from './family.js';
import type { FamilyParadigm } from './family.js';
import type { FrenchLexeme } from './grammar.js';
import { frenchRules } from './rules.js';
import { frenchCitations } from './sources.js';
import { feedingPart, hintedParts, partValues } from './stems.js';

/** The compound tenses (GD §4.5): every one is built on the past participle. */
const compoundTenses = new Set(['perfect', 'pluperfect', 'past_anterior', 'future_perfect', 'past']);

export function isCompound(target: ResolvedTarget): boolean {
  return !(target.mood === 'participle' && target.tense === 'past') && compoundTenses.has(target.tense);
}

/** The cell whose form a simple target needs; the near future and recent past need the infinitive. */
function simpleIndex(target: ResolvedTarget): number {
  const { mood, tense, person, number } = target;
  if (tense === 'near_future' || tense === 'recent_past' || mood === 'infinitive') return 50;
  if (mood === 'participle' && tense === 'past') return 46;
  if (mood === 'participle' || mood === 'gerund') return 45;
  const slot = (number === 'plural' ? 3 : 0) + (person ?? 1) - 1;
  if (mood === 'imperative') return slot === 1 ? 42 : slot === 3 ? 43 : 44;
  const row = ['indicative.present', 'indicative.imperfect', 'indicative.simple_past', 'indicative.future', 'subjunctive.present',
    'subjunctive.imperfect', 'conditional.present'].indexOf(`${mood}.${tense}`);
  return row * 6 + slot;
}

/**
 * Whether the paradigm of `lexeme` has a form in the cell at `index` (GD §5.2): listed, or fed by a part it has and not
 * a gap. The persons and moods a flag rules out are left to the rules that name them (impersonal, third person only,
 * no imperative).
 */
export function hasCell(lexeme: FrenchLexeme, index: number): boolean {
  if (index === 50 || lexeme.group !== null) return true;
  const part = feedingPart(index);
  const hinted = lexeme.hints !== null && part !== null && partValues(hintedParts(lexeme.hints, lexeme.group).parts,
    part === 'SJ1' ? 'P3' : part === 'SJ2' ? 'P2' : part).length > 0;
  if (hinted) return true;
  const family = lexeme.family;
  if (family === null) return false;
  const paradigm = lexeme.paradigm as FamilyParadigm;
  const name = cellNames[index]!;
  if (paradigm.cells[name]) return true;
  if (paradigm.gaps.includes(name)) return false;
  const { parts } = paradigm;
  if (index === 45 && family.flags.presentParticipleFromSubjunctive) return partValues(parts, 'SJ2').length > 0;
  if (index >= 42 && index <= 44) {
    const present = ['pres.2s', 'pres.1p', 'pres.2p'][index - 42] as 'pres.2s';
    if (paradigm.cells[present]) return true;
    if (family.flags.imperativeFromSubjunctive) return partValues(parts, index === 42 ? 'SJ1' : 'SJ2').length > 0;
  }
  return part !== null && partValues(parts, part).length > 0;
}

/**
 * The address an unavailable target cites: the page that states the forms the verb lacks (`gapsSource`), else the table
 * its family agrees with, else the rule's own citation. A table that prints the form is cited only by
 * `fr.avail.unattested` and `fr.avail.pronominal-imperative-past`, whose steps say that it prints it.
 */
function sourceOf(lexeme: FrenchLexeme, rule: keyof typeof frenchCitations): string {
  const { gapsSource, verified } = lexeme.family?.flags ?? {};
  if (rule !== 'fr.avail.pronominal-imperative-past') {
    if (gapsSource) return gapsSource;
    if (verified) return `https://www.dictionnaire-academie.fr/conjuguer/${verified.academie}`;
  }
  const cited = frenchCitations[rule];
  const first = Array.isArray(cited) ? cited[0] : cited;
  return (first as { url?: string } | undefined)?.url ?? 'https://www.dictionnaire-academie.fr/';
}

type AvailabilityRule = 'fr.avail.defective' | 'fr.avail.third-person-only' | 'fr.avail.impersonal' | 'fr.avail.no-imperative'
  | 'fr.avail.pronominal-imperative-past' | 'fr.avail.unattested';

/** The unavailability, with the rule `fr.avail.unattested` in place of `rule` where the family's gaps are secondary only. */
function unavailable(lexeme: FrenchLexeme, rule: AvailabilityRule, reason: Unavailability['reason']): Unavailability {
  const own = lexeme.family?.flags.secondaryGaps && rule !== 'fr.avail.pronominal-imperative-past' ? 'fr.avail.unattested' : rule;
  return { reason, step: step(frenchRules[own], null, null), source: sourceOf(lexeme, own) };
}

/** Why `target` has no form in the paradigm of `lexeme` (GD §4.7), or null. */
export function frenchAvailability(lexeme: FrenchLexeme, target: ResolvedTarget): Unavailability | null {
  const { mood, tense, person, number } = target;
  const flags = lexeme.family?.flags ?? {};
  if (lexeme.reflexive && mood === 'imperative' && tense === 'past') return unavailable(lexeme, 'fr.avail.pronominal-imperative-past', 'noImperative');
  if ((flags.noImperative || lexeme.restriction.noImperative) && mood === 'imperative') return unavailable(lexeme, 'fr.avail.no-imperative', 'noImperative');
  if (flags.impersonal && person !== null && (person !== 3 || (flags.impersonal === 'singular' && number === 'plural'))) {
    return unavailable(lexeme, 'fr.avail.impersonal', 'impersonal');
  }
  const defective = isCompound(target)
    ? flags.compounds === 'none' || (flags.compounds === 'nonFinite' && person !== null) || !hasCell(lexeme, 46)
    : !hasCell(lexeme, simpleIndex(target));
  if (defective) return unavailable(lexeme, 'fr.avail.defective', 'defective');
  if ((flags.thirdPersonOnly || lexeme.restriction.thirdPersonOnly) && person !== null && person !== 3) {
    return unavailable(lexeme, 'fr.avail.third-person-only', 'defective');
  }
  return null;
}
