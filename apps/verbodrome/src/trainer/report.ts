import { TENSES, tenseById } from '../config/tenses';
import type { TenseDef } from '../config/tenses';
import { skills } from './coach';
import type { History, Skill } from './coach';
import { categoryOf, WRONG_TENSE } from './question';
import type { Selection } from './question';

export interface TenseScore {
  readonly tense: TenseDef;
  /** Null when the tense has not been asked yet. */
  readonly skill: Skill | null;
}

export interface MistakeExample {
  readonly pick: string;
  readonly want: string;
}

/** Within "verkeerde tijd": one pair of tenses that gets mixed up. */
export interface MistakeGroup {
  readonly label: string;
  readonly count: number;
  readonly examples: readonly MistakeExample[];
}

export interface MistakeScore {
  /** Category name, as shown in the feedback after a question. */
  readonly category: string;
  readonly count: number;
  /** Newest first. */
  readonly examples: readonly MistakeExample[];
  /** Only for mixed-up tenses: the pairs, most frequent first. */
  readonly groups: readonly MistakeGroup[];
}

export interface VerbScore {
  readonly verb: string;
  readonly asked: number;
  readonly wrong: number;
}

/** Examples kept per category and per pair. */
const MAX_EXAMPLES = 12;

export interface Report {
  readonly answered: number;
  readonly correct: number;
  /** Answers given today (local time) and how many of them were right. */
  readonly today: { readonly answered: number; readonly correct: number };
  /** Tenses that are being practised or have been asked, in time-axis order. */
  readonly tenses: readonly TenseScore[];
  /** Most frequent categories of mistake first. */
  readonly mistakes: readonly MistakeScore[];
  /** Verbs that go wrong most often (asked at least 3 times). */
  readonly verbs: readonly VerbScore[];
}

export function buildReport(history: History, selection: Selection, now = Date.now()): Report {
  const { answers } = history;
  const known = skills(answers);
  const midnight = new Date(now).setHours(0, 0, 0, 0);
  const today = answers.filter(answer => answer.at >= midnight);

  type Bucket = { count: number; examples: MistakeExample[] };
  const add = (map: Map<string, Bucket>, key: string, example: MistakeExample): void => {
    const bucket = map.get(key) ?? { count: 0, examples: [] };
    bucket.count++;
    if (bucket.examples.length < MAX_EXAMPLES) bucket.examples.push(example);
    map.set(key, bucket);
  };
  const byCount = <T extends { count: number }>(a: T, b: T): number => b.count - a.count;
  const categories = new Map<string, Bucket>();
  const pairs = new Map<string, Bucket>();
  // Newest first, so the examples kept are the most recent ones.
  for (const answer of [...answers].reverse()) {
    if (answer.ok || !answer.kind) continue;
    const example = { pick: answer.pick ?? '', want: answer.want ?? '' };
    const category = categoryOf(answer.kind);
    add(categories, category, example);
    if (category === WRONG_TENSE) {
      const order = (id: string): number => TENSES.findIndex(tense => tense.id === id);
      const pair = [answer.tense, answer.kind.slice(5)].sort((a, b) => order(a) - order(b));
      add(pairs, pair.map(id => tenseById(id)?.label ?? id).join(' ↔ '), example);
    }
  }
  const mistakes: MistakeScore[] = [...categories].map(([category, bucket]) => ({
    category, ...bucket,
    groups: category === WRONG_TENSE ? [...pairs].map(([label, pair]) => ({ label, ...pair })).sort(byCount) : [],
  })).sort(byCount);

  const verbs = [...known.verbs]
    .map(([verb, skill]) => ({ verb, asked: skill.asked, wrong: skill.asked - skill.correct }))
    .filter(score => score.asked >= 3 && score.wrong > 0)
    .sort((a, b) => b.wrong / b.asked - a.wrong / a.asked || b.wrong - a.wrong)
    .slice(0, 5);

  return {
    answered: answers.length,
    correct: answers.filter(answer => answer.ok).length,
    today: { answered: today.length, correct: today.filter(answer => answer.ok).length },
    tenses: TENSES
      .filter(tense => selection.tenses.includes(tense.id) || known.tenses.has(tense.id))
      .map(tense => ({ tense, skill: known.tenses.get(tense.id) ?? null })),
    mistakes,
    verbs,
  };
}
