import { LEVELS } from '../config/levels';
import { tenseById } from '../config/tenses';
import { verbByFr } from '../config/verbs';
import type { VerbDef } from '../config/verbs';
import type { FrForm } from './forms';
import { askable, kindLabel, questionFor } from './question';
import type { Option, Question, Random, Selection } from './question';

/**
 * The coach decides what to ask next. It reads the answer log to learn which
 * tenses and verbs need work, brings missed questions back after a while, and
 * slips in easy questions after two misses in a row. Everything here is pure:
 * state goes in, new state comes out; saving it is the caller's business.
 */

/** One answered question, as kept in the log. */
export interface Answer {
  /** Time of the answer (ms since epoch). */
  readonly at: number;
  readonly verb: string;
  readonly tense: string;
  readonly slot: string;
  readonly ok: boolean;
  /** For a wrong answer: the card that was picked, the right one, and the category of the mistake. */
  readonly pick?: string;
  readonly want?: string;
  readonly kind?: string;
  /** The question was a repeat of an earlier miss. */
  readonly review?: boolean;
  /** The question was an easy one, served after two misses in a row. */
  readonly easy?: boolean;
}

/** A missed question waiting to be asked again. */
export interface Review {
  readonly verb: string;
  readonly tense: string;
  readonly slot: string;
  /** Asked again once the learner has answered this many questions in total. */
  readonly due: number;
  /** 0: last answer was wrong. 1: answered right once since; one more right answer clears it. */
  readonly stage: 0 | 1;
  /** The most recent wrong answer and its category. */
  readonly pick: string;
  readonly kind: string;
  /** How many times this question has been missed. */
  readonly misses: number;
}

export interface History {
  /** Questions answered in total; the clock that reviews are scheduled on. */
  readonly count: number;
  /** Most recent answers, oldest first (capped at MAX_ANSWERS). */
  readonly answers: readonly Answer[];
  readonly reviews: readonly Review[];
}

export const EMPTY_HISTORY: History = { count: 0, answers: [], reviews: [] };

/** CONFIGURATION of the coach. */
export const COACH = {
  /** A missed question returns after this many other questions (random within the range). */
  retryAfter: [4, 8] as const,
  /** After the first right answer it returns once more, this many questions later. */
  confirmAfter: 15,
  /** At least this many other questions between two repeats (so at most one in three). */
  reviewSpacing: 2,
  /** Misses in a row that trigger easy questions, and how many easy ones follow. */
  missesBeforeEasy: 2,
  easyCount: 2,
  /** How fast a skill follows recent answers (0–1; higher forgets older answers sooner). */
  learningRate: 0.25,
  /** Share of attention a mastered tense or verb still gets, next to (1 − skill). */
  baseWeight: 0.3,
  /** Extra weight for a tense answered fewer than `probeUntil` times, to find out where the learner stands. */
  probeBonus: 0.3,
  probeUntil: 2,
  maxAnswers: 5000,
} as const;

export interface Skill {
  readonly asked: number;
  readonly correct: number;
  /** 0–1, weighted towards recent answers. 0.5 before anything is known. */
  readonly level: number;
}

const UNKNOWN: Skill = { asked: 0, correct: 0, level: 0.5 };

function tally(answers: readonly Answer[], key: (answer: Answer) => string): Map<string, Skill> {
  const out = new Map<string, Skill>();
  for (const answer of answers) {
    const before = out.get(key(answer)) ?? UNKNOWN;
    out.set(key(answer), {
      asked: before.asked + 1,
      correct: before.correct + (answer.ok ? 1 : 0),
      level: before.level + COACH.learningRate * ((answer.ok ? 1 : 0) - before.level),
    });
  }
  return out;
}

export interface Skills {
  readonly tenses: ReadonlyMap<string, Skill>;
  readonly verbs: ReadonlyMap<string, Skill>;
}

export function skills(answers: readonly Answer[]): Skills {
  return { tenses: tally(answers, answer => answer.tense), verbs: tally(answers, answer => answer.verb) };
}

/** A question together with why the coach chose it. */
export interface Asked {
  readonly question: Question;
  /** Set when this is a repeat of an earlier miss. */
  readonly review: Review | null;
  readonly easy: boolean;
}

const sameItem = (a: { verb: string; tense: string; slot: string }, b: { verb: string; tense: string; slot: string }): boolean =>
  a.verb === b.verb && a.tense === b.tense && a.slot === b.slot;

const itemOf = (question: Question) => ({ verb: question.verb.fr, tense: question.tense.id, slot: question.slot });

/** Are easy questions due? True after N misses in a row, until `easyCount` easy ones have been served. */
export function wantsEasy(answers: readonly Answer[]): boolean {
  let served = 0;
  let at = answers.length - 1;
  while (at >= 0 && answers[at]!.easy && served < COACH.easyCount) { served++; at--; }
  if (served >= COACH.easyCount) return false;
  // Before the easy ones already served there must be the run of misses that triggered them.
  const run = answers.slice(Math.max(0, at + 1 - COACH.missesBeforeEasy), at + 1);
  return run.length === COACH.missesBeforeEasy && run.every(answer => !answer.ok && !answer.easy);
}

function weighted<T>(items: readonly T[], weight: (item: T) => number, random: Random): T {
  const weights = items.map(weight);
  let roll = random() * weights.reduce((sum, value) => sum + value, 0);
  for (let i = 0; i < items.length; i++) {
    roll -= weights[i]!;
    if (roll < 0) return items[i]!;
  }
  return items[items.length - 1]!;
}

const LEVEL_ORDER = LEVELS.map(level => level.id);
const levelRank = (tenseId: string): number => LEVEL_ORDER.indexOf(tenseById(tenseId)?.level ?? 'extra');
const indexes = new WeakMap<Selection, Map<VerbDef, FrForm[]>>();

/** Everything that can be asked within a selection, per verb. */
function askIndex(selection: Selection): Map<VerbDef, FrForm[]> {
  let index = indexes.get(selection);
  if (!index) {
    index = new Map();
    const tenses = new Set(selection.tenses);
    for (const fr of selection.verbs) {
      const verb = verbByFr(fr);
      const forms = verb ? askable(verb, tenses) : [];
      if (verb && forms.length) index.set(verb, forms);
    }
    indexes.set(selection, index);
  }
  return index;
}

/**
 * Choose the next question:
 * 1. after two misses in a row, two easy ones (strongest tense, a verb that goes well);
 * 2. else a missed question that is due, at most one in three;
 * 3. else a tense and verb drawn by need: weak and unexplored ones come up more often.
 */
export function nextQuestion(
  history: History, selection: Selection, previous: Question | null,
  random: Random = Math.random, optionCount?: number,
): Asked | null {
  const index = askIndex(selection);
  if (!index.size) return null;
  const known = skills(history.answers);
  const tenseSkill = (id: string): Skill => known.tenses.get(id) ?? UNKNOWN;
  const verbSkill = (fr: string): Skill => known.verbs.get(fr) ?? UNKNOWN;
  const last = previous && itemOf(previous);
  const fresh = (item: { verb: string; tense: string; slot: string }): boolean => !last || !sameItem(item, last);
  const ask = (verb: VerbDef, form: FrForm): Question | null =>
    questionFor(selection, { verb: verb.fr, tense: form.tense.id, slot: form.slot }, random, optionCount);
  const tenseIds = [...new Set([...index.values()].flatMap(forms => forms.map(form => form.tense.id)))];
  const verbsWith = (tenseId: string): VerbDef[] => [...index.keys()].filter(verb => index.get(verb)!.some(form => form.tense.id === tenseId));
  const formOf = (verb: VerbDef, tenseId: string): FrForm => {
    const forms = index.get(verb)!.filter(form => form.tense.id === tenseId);
    const unseen = forms.filter(form => fresh({ verb: verb.fr, tense: tenseId, slot: form.slot }));
    const pool = unseen.length ? unseen : forms;
    return pool[Math.floor(random() * pool.length)]!;
  };

  if (wantsEasy(history.answers)) {
    const tried = tenseIds.filter(id => tenseSkill(id).asked > 0);
    const tenseId = tried.length
      ? tried.reduce((best, id) => tenseSkill(id).level > tenseSkill(best).level ? id : best)
      : [...tenseIds].sort((a, b) => levelRank(a) - levelRank(b))[0]!;
    const verbs = verbsWith(tenseId)
      .sort((a, b) => verbSkill(b.fr).level - verbSkill(a.fr).level || LEVEL_ORDER.indexOf(a.level) - LEVEL_ORDER.indexOf(b.level))
      .slice(0, 3);
    const verb = verbs[Math.floor(random() * verbs.length)]!;
    const question = ask(verb, formOf(verb, tenseId));
    if (question) return { question, review: null, easy: true };
  }

  const recent = history.answers.slice(-COACH.reviewSpacing);
  if (!recent.some(answer => answer.review)) {
    const due = history.reviews
      .filter(review => review.due <= history.count && fresh(review))
      .sort((a, b) => a.due - b.due);
    for (const review of due) {
      const question = questionFor(selection, review, random, optionCount, { text: review.pick, kind: review.kind });
      if (question) return { question, review, easy: false };
    }
  }

  const need = (skill: Skill): number => COACH.baseWeight + (1 - skill.level);
  const tenseId = weighted(tenseIds, id => need(tenseSkill(id)) + (tenseSkill(id).asked < COACH.probeUntil ? COACH.probeBonus : 0), random);
  const verb = weighted(verbsWith(tenseId), candidate => need(verbSkill(candidate.fr)), random);
  const question = ask(verb, formOf(verb, tenseId));
  return question ? { question, review: null, easy: false } : null;
}

/** The log and review list after one answer. */
export function record(history: History, asked: Asked, option: Option, random: Random = Math.random, now = Date.now()): History {
  const { question } = asked;
  const item = itemOf(question);
  const count = history.count + 1;
  const answer: Answer = {
    at: now, ...item, ok: option.correct,
    ...(option.correct ? {} : { pick: option.text, want: question.correct, kind: option.kind }),
    ...(asked.review ? { review: true } : {}),
    ...(asked.easy ? { easy: true } : {}),
  };
  const existing = history.reviews.find(review => sameItem(review, item));
  const others = history.reviews.filter(review => review !== existing);
  let reviews: readonly Review[] = history.reviews;
  if (!option.correct) {
    const [min, max] = COACH.retryAfter;
    const gap = min + Math.floor(random() * (max - min + 1));
    reviews = [...others, { ...item, due: count + gap, stage: 0, pick: option.text, kind: option.kind, misses: (existing?.misses ?? 0) + 1 }];
  } else if (existing) {
    reviews = existing.stage === 0 ? [...others, { ...existing, stage: 1, due: count + COACH.confirmAfter }] : others;
  }
  return { count, answers: [...history.answers, answer].slice(-COACH.maxAnswers), reviews };
}

/** What the feedback says about a repeated question. */
export interface Recall {
  readonly tone: 'good' | 'bad';
  readonly text: string;
}

const quote = (text: string): string => `„${text}”`;

/** Compare this answer with the earlier attempt(s) at the same question. Null when it is not a repeat. */
export function recall(review: Review | null, option: Option): Recall | null {
  if (!review) return null;
  if (option.correct) {
    return review.stage === 0
      ? { tone: 'good', text: `Vorige keer koos je hier ${quote(review.pick)}. Nu heb je hem juist.` }
      : { tone: 'good', text: 'Opnieuw juist. Deze vraag zit erin en komt niet meer terug.' };
  }
  const when = review.stage === 0 ? 'vorige keer' : 'eerder';
  const lead = review.stage === 0 ? '' : 'Vorige keer had je deze juist, nu niet. ';
  const body = option.text === review.pick
    ? `Exact dezelfde fout als ${when}: opnieuw ${quote(option.text)}.`
    : option.kind === review.kind
      ? `Dezelfde soort fout als ${when} (${kindLabel(option.kind)}): toen ${quote(review.pick)}, nu ${quote(option.text)}.`
      : `Een andere fout dan ${when}: toen ${kindLabel(review.kind)} (${quote(review.pick)}), nu ${kindLabel(option.kind)}.`;
  const times = review.misses + 1;
  const tail = times >= 3 ? ` Dat is de ${times}e keer fout; deze vraag blijft terugkomen.` : '';
  return { tone: 'bad', text: lead + body + tail };
}
