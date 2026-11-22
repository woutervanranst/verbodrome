import { TENSES } from '../config/tenses';
import type { TenseDef } from '../config/tenses';
import { skills } from './coach';
import type { History, Skill } from './coach';
import { kindLabel } from './question';
import type { Selection } from './question';

export interface TenseScore {
  readonly tense: TenseDef;
  /** Null when the tense has not been asked yet. */
  readonly skill: Skill | null;
}

export interface MistakeScore {
  readonly kind: string;
  readonly label: string;
  readonly count: number;
  /** The most recent example: what was picked and what was right. */
  readonly pick: string;
  readonly want: string;
}

export interface VerbScore {
  readonly verb: string;
  readonly asked: number;
  readonly wrong: number;
}

export interface Report {
  readonly answered: number;
  readonly correct: number;
  /** Answers given today (local time) and how many of them were right. */
  readonly today: { readonly answered: number; readonly correct: number };
  /** Tenses that are being practised or have been asked, in time-axis order. */
  readonly tenses: readonly TenseScore[];
  /** Most frequent kinds of mistake first. */
  readonly mistakes: readonly MistakeScore[];
  /** Verbs that go wrong most often (asked at least 3 times). */
  readonly verbs: readonly VerbScore[];
}

export function buildReport(history: History, selection: Selection, now = Date.now()): Report {
  const { answers } = history;
  const known = skills(answers);
  const midnight = new Date(now).setHours(0, 0, 0, 0);
  const today = answers.filter(answer => answer.at >= midnight);

  const mistakes = new Map<string, MistakeScore>();
  for (const answer of answers) {
    if (answer.ok || !answer.kind) continue;
    mistakes.set(answer.kind, {
      kind: answer.kind, label: kindLabel(answer.kind), count: (mistakes.get(answer.kind)?.count ?? 0) + 1,
      pick: answer.pick ?? '', want: answer.want ?? '',
    });
  }

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
    mistakes: [...mistakes.values()].sort((a, b) => b.count - a.count).slice(0, 6),
    verbs,
  };
}
