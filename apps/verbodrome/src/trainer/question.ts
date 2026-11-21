import type { TenseDef } from '../config/tenses';
import type { VerbDef } from '../config/verbs';
import { verbByFr } from '../config/verbs';
import { mistakes } from './distractors';
import { verbForms } from './forms';
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

const LEVEL_RANK: readonly string[] = ['lager', 'g1', 'g2', 'g3', 'extra'];

function build(
  verb: VerbDef, target: FrForm, candidates: readonly FrForm[],
  selected: ReadonlySet<string>, random: Random, optionCount: number,
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

  type Candidate = { text: string; label: string };
  const asCandidate = (form: FrForm): Candidate => ({ text: form.text, label: describe(form) });
  const finite = target.slot !== '-';

  const sameSlot = forms.all.filter(form => form.tense.id !== target.tense.id
    && (finite ? form.slot === target.slot : form.slot === '-'));
  const otherTenses = sameSlot.filter(form => selected.has(form.tense.id)).map(asCandidate);
  const otherPersons = (forms.byTense.get(target.tense.id) ?? [])
    .filter(form => form.slot !== target.slot)
    .map(asCandidate);
  const errors = mistakes(forms, target);
  const imperative = target.tense.mood === 'imperative';

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

  // A balanced first draw from what the learner is practising, then the rest of it.
  if (imperative) { take(errors, 5); take(otherPersons, 2); take(otherTenses, 2); }
  else { take(otherTenses, 4); take(otherPersons, 3); take(errors, 2); }
  take(errors, 99); take(otherTenses, 99); take(otherPersons, 99);
  // Still short: tenses outside the selection, nearest school level first.
  for (const level of LEVEL_RANK) take(sameSlot.filter(form => form.tense.level === level).map(asCandidate), 99);
  for (const level of LEVEL_RANK) take(forms.all.filter(form => form.tense.level === level).map(asCandidate), 99);

  const options: Option[] = picked.map(candidate => {
    const match = real.get(candidate.text);
    return {
      text: candidate.text,
      correct: false,
      label: match ? describe(match) : candidate.label,
      nl: match ? dutchPrompt(verb, match.tense, match.slot) : null,
    };
  });
  options.push({ text: target.text, correct: true, label: '', nl: prompt });

  return {
    verb, tense: target.tense, slot: target.slot, correct: target.text, prompt, showTense,
    options: shuffle(options, random),
  };
}
