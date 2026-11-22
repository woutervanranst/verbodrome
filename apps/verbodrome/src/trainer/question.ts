import { tenseById } from '../config/tenses';
import type { TenseDef } from '../config/tenses';
import type { VerbDef } from '../config/verbs';
import { verbByFr } from '../config/verbs';
import { renderParts } from 'conjugation-engine';
import { mistakes } from './distractors';
import { formAt, verbForms } from './forms';
import type { FrForm, VerbForms } from './forms';
import { dutchPrompt } from './prompt';

export interface Selection {
  /** French infinitives. */
  readonly verbs: readonly string[];
  /** Tense ids (`mood.tense`). */
  readonly tenses: readonly string[];
}

export interface Option {
  readonly text: string;
  readonly correct: boolean;
  /** What this answer is: "imparfait · vous", or the kind of mistake. Empty for the correct one. */
  readonly label: string;
  /** Dutch meaning when the option is a real form of the verb. */
  readonly nl: string | null;
  /**
   * Stable category of the mistake, for the answer log: `persoon` (another person's form),
   * `tijd:<tense id>` (another tense), or the Dutch name of a made-up error. Empty for the correct one.
   */
  readonly kind: string;
}

/** A wrong answer the learner gave before; it is offered again so the same slip can show up. */
export interface Earlier {
  readonly text: string;
  readonly kind: string;
}

export const WRONG_TENSE = 'verkeerde tijd';

/**
 * The category a mistake is counted under, with the same name in the feedback
 * and in the report. Every mix-up of two tenses is one category.
 */
export function categoryOf(kind: string): string {
  if (kind === 'persoon') return 'vorm van een andere persoon';
  return kind.startsWith('tijd:') ? WRONG_TENSE : kind;
}

/** The mistake in detail, naming the tense it was confused with: "verward met imparfait", "vorm van een andere persoon". */
export function kindLabel(kind: string): string {
  if (kind === 'persoon') return 'vorm van een andere persoon';
  if (kind.startsWith('tijd:')) return `verward met ${tenseById(kind.slice(5))?.label ?? 'een andere tijd'}`;
  return kind;
}

export interface Question {
  readonly verb: VerbDef;
  readonly tense: TenseDef;
  readonly slot: string;
  readonly correct: string;
  /** Dutch prompt. */
  readonly prompt: string;
  /** True when the prompt alone does not identify the tense within the selection. */
  readonly showTense: boolean;
  readonly options: readonly Option[];
}

export type Random = () => number;

const pickOne = <T>(items: readonly T[], random: Random): T => items[Math.floor(random() * items.length)]!;

export function shuffle<T>(items: readonly T[], random: Random): T[] {
  const out = items.slice();
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [out[i], out[j]] = [out[j]!, out[i]!];
  }
  return out;
}

const IMPERATIVE_PERSON: Readonly<Record<string, string>> = { '2s': 'tu', '1p': 'nous', '2p': 'vous' };

/** "imparfait · vous", "impératif présent · tu", "participe passé". */
export function describe(form: FrForm): string {
  const who = form.subject ?? IMPERATIVE_PERSON[form.slot];
  return who ? `${form.tense.label} · ${who}` : form.tense.label;
}

/** Forms of one verb that can be asked: in a selected tense, not excluded for the verb, and with a Dutch prompt. */
export function askable(verb: VerbDef, tenses: ReadonlySet<string>): FrForm[] {
  let forms: VerbForms;
  try { forms = verbForms(verb.fr); } catch { return []; }
  return forms.all.filter(form => tenses.has(form.tense.id)
    && !verb.exclude?.includes(form.tense.id)
    && dutchPrompt(verb, form.tense, form.slot) !== null);
}

/**
 * Does another selected tense of this verb produce the same Dutch prompt?
 * ("ik was" is both imparfait and passé simple.)
 */
export function isAmbiguous(verb: VerbDef, target: FrForm, candidates: readonly FrForm[]): boolean {
  const prompt = dutchPrompt(verb, target.tense, target.slot);
  return candidates.some(other => other.tense.id !== target.tense.id
    && other.text !== target.text
    && dutchPrompt(verb, other.tense, other.slot) === prompt);
}

const PERSONAL = new Set(['subject', 'reflexivePronoun']);

/**
 * A form of another person, said with the asked person's pronouns: "nous partons" → "je partons".
 * The subject would otherwise give the answer away; the verb after it is the real trap.
 * Null when the form has no subject to replace or the result cannot be built.
 */
export function inPerson(forms: VerbForms, source: FrForm, slot: string): string | null {
  if (source.slot === slot) return source.text;
  if (source.subject === null) return null;
  const own = formAt(forms, source.tense.id, slot)?.form.parts.filter(part => PERSONAL.has(part.role));
  if (!own) return null;
  let used = 0;
  const parts = source.form.parts.map(part => PERSONAL.has(part.role) ? own[used++] : part);
  if (used !== own.length || parts.some(part => part === undefined)) return null;
  return renderParts('fr', parts as FrForm['form']['parts']);
}

export const DEFAULT_OPTION_COUNT = 10;

/**
 * Build the next question from the current selection, or null when the
 * selection yields nothing to ask.
 */
export function makeQuestion(
  selection: Selection,
  previous: Question | null = null,
  random: Random = Math.random,
  optionCount = DEFAULT_OPTION_COUNT,
): Question | null {
  const tenses = new Set(selection.tenses);
  const verbs = shuffle(selection.verbs.map(verbByFr).filter((verb): verb is VerbDef => verb !== undefined), random);

  for (let attempt = 0; attempt < 2; attempt++) {
    for (const verb of verbs) {
      const candidates = askable(verb, tenses);
      if (!candidates.length) continue;
      const tenseId = pickOne([...new Set(candidates.map(form => form.tense.id))], random);
      const target = pickOne(candidates.filter(form => form.tense.id === tenseId), random);
      const repeat = previous && previous.verb.fr === verb.fr && previous.tense.id === tenseId && previous.slot === target.slot;
      // First pass avoids repeating the previous question; a one-question selection may repeat.
      if (repeat && attempt === 0) continue;
      return build(verb, target, candidates, tenses, random, optionCount);
    }
  }
  return null;
}

/** The question for one specific form, or null when it cannot be asked within the selection. */
export function questionFor(
  selection: Selection, item: { readonly verb: string; readonly tense: string; readonly slot: string },
  random: Random = Math.random, optionCount = DEFAULT_OPTION_COUNT, earlier: Earlier | null = null,
): Question | null {
  const verb = verbByFr(item.verb);
  if (!verb || !selection.verbs.includes(item.verb)) return null;
  const tenses = new Set(selection.tenses);
  const candidates = askable(verb, tenses);
  const target = candidates.find(form => form.tense.id === item.tense && form.slot === item.slot);
  return target ? build(verb, target, candidates, tenses, random, optionCount, earlier) : null;
}

const LEVEL_RANK: readonly string[] = ['lager', 'g1', 'g2', 'g3', 'extra'];

function build(
  verb: VerbDef, target: FrForm, candidates: readonly FrForm[],
  selected: ReadonlySet<string>, random: Random, optionCount: number, earlier: Earlier | null = null,
): Question {
  const forms = verbForms(verb.fr);
  const prompt = dutchPrompt(verb, target.tense, target.slot)!;
  const showTense = isAmbiguous(verb, target, candidates);
  const real = new Map<string, FrForm>();
  // "je finis" is both présent and passé simple: name it after the tense the learner knows best.
  const familiarity = (form: FrForm): number => (selected.has(form.tense.id) ? 0 : 10) + LEVEL_RANK.indexOf(form.tense.level);
  for (const form of [...forms.all].sort((x, y) => familiarity(x) - familiarity(y))) {
    if (!real.has(form.text)) real.set(form.text, form);
  }

  type Candidate = { text: string; label: string; kind?: string };
  const asCandidate = (form: FrForm): Candidate => ({ text: form.text, label: describe(form) });
  const finite = target.slot !== '-';

  const sameSlot = forms.all.filter(form => form.tense.id !== target.tense.id
    && (finite ? form.slot === target.slot : form.slot === '-'));
  const otherTenses = sameSlot.filter(form => selected.has(form.tense.id)).map(asCandidate);
  const imperative = target.tense.mood === 'imperative';
  // With a visible subject, every option keeps that subject: only the verb may differ.
  const keepSubject = target.subject !== null;
  const recast = (pool: readonly FrForm[]): Candidate[] => !keepSubject ? pool.map(asCandidate) : pool.flatMap(form => {
    if (form.subject === null || form.slot === target.slot) return [asCandidate(form)];
    const text = inPerson(forms, form, target.slot);
    const tense = form.tense.id === target.tense.id ? '' : `${form.tense.label} · `;
    return text ? [{ text, label: `${tense}vorm van ${form.subject}`, kind: 'persoon' }] : [];
  });
  const otherPersons = recast((forms.byTense.get(target.tense.id) ?? []).filter(form => form.slot !== target.slot));
  const errors = mistakes(forms, target);

  const seen = new Set<string>(target.accepted);
  const picked: Candidate[] = [];
  const take = (pool: readonly Candidate[], count: number): void => {
    for (const candidate of shuffle(pool, random)) {
      if (picked.length >= optionCount - 1 || count <= 0) return;
      if (seen.has(candidate.text)) continue;
      seen.add(candidate.text);
      // A real form that means the same in Dutch would be a second right answer,
      // unless the tense is shown and tells them apart.
      const match = real.get(candidate.text);
      if (match && !showTense && dutchPrompt(verb, match.tense, match.slot) === prompt) continue;
      picked.push(candidate);
      count--;
    }
  };

  if (earlier) take([{ text: earlier.text, label: kindLabel(earlier.kind), kind: earlier.kind }], 1);
  // A balanced first draw from what the learner is practising, then the rest of it.
  if (imperative) { take(errors, 5); take(otherPersons, 2); take(otherTenses, 2); }
  else { take(otherTenses, 4); take(otherPersons, 3); take(errors, 2); }
  take(errors, 99); take(otherTenses, 99); take(otherPersons, 99);
  // Still short: tenses outside the selection, nearest school level first.
  for (const level of LEVEL_RANK) take(sameSlot.filter(form => form.tense.level === level).map(asCandidate), 99);
  for (const level of LEVEL_RANK) take(recast(forms.all.filter(form => form.tense.level === level)), 99);

  const options: Option[] = picked.map(candidate => {
    const match = real.get(candidate.text);
    return {
      text: candidate.text,
      correct: false,
      label: match ? describe(match) : candidate.label,
      nl: match ? dutchPrompt(verb, match.tense, match.slot) : null,
      kind: candidate.kind ?? (!match ? candidate.label : match.tense.id === target.tense.id ? 'persoon' : `tijd:${match.tense.id}`),
    };
  });
  options.push({ text: target.text, correct: true, label: '', nl: prompt, kind: '' });

  return {
    verb, tense: target.tense, slot: target.slot, correct: target.text, prompt, showTense,
    options: shuffle(options, random),
  };
}
