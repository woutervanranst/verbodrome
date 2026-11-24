import { describe, expect, it } from 'vitest';
import { COACH, EMPTY_HISTORY, nextQuestion, recall, record, skills, wantsEasy } from '../src/trainer/coach';
import type { Answer, Asked, History } from '../src/trainer/coach';
import { WRONG_TENSE, categoryOf, questionFor } from '../src/trainer/question';
import type { Option } from '../src/trainer/question';
import { buildReport } from '../src/trainer/report';
import { selectionForLevel } from '../src/trainer/selection';
import { KEYS, createStore, parseHistory, parseSettings } from '../src/storage/store';
import type { KeyValue } from '../src/storage/local';

function seeded(seed: number): () => number {
  let state = seed;
  return () => {
    state = (state * 1664525 + 1013904223) % 4294967296;
    return state / 4294967296;
  };
}

const selection = selectionForLevel('g1');
const right = (asked: Asked): Option => asked.question.options.find(option => option.correct)!;
const wrong = (asked: Asked, at = 0): Option => asked.question.options.filter(option => !option.correct)[at]!;
const answer = (ok: boolean, extra: Partial<Answer> = {}): Answer =>
  ({ at: 0, verb: 'parler', tense: 'indicative.present', slot: '1s', ok, ...extra });
const boire = (random = seeded(1)): Asked => ({
  question: questionFor(selection, { verb: 'boire', tense: 'indicative.perfect', slot: '2s' }, random)!, review: null, easy: false,
});

/** Play `rounds` questions, answering with `decide`; returns the final history and what was asked. */
function play(rounds: number, decide: (asked: Asked, history: History) => boolean, seed = 5, start: History = EMPTY_HISTORY) {
  const random = seeded(seed);
  let history = start;
  let previous: Asked | null = null;
  const log: Asked[] = [];
  for (let round = 0; round < rounds; round++) {
    const asked: Asked = nextQuestion(history, selection, previous?.question ?? null, random)!;
    history = record(history, asked, decide(asked, history) ? right(asked) : wrong(asked), random, round);
    log.push(asked);
    previous = asked;
  }
  return { history, log };
}

describe('repeating missed questions', () => {
  it('schedules a miss 4 to 8 questions later, never straight away', () => {
    for (let seed = 1; seed < 30; seed++) {
      const history = record(EMPTY_HISTORY, boire(), wrong(boire()), seeded(seed));
      const gap = history.reviews[0]!.due - history.count;
      expect(gap).toBeGreaterThanOrEqual(4);
      expect(gap).toBeLessThanOrEqual(8);
    }
  });

  it('brings the question back with the earlier wrong card among the options', () => {
    let missedAt = -1;
    const { log, history } = play(14, (_, state) => {
      if (state.count === 0) { missedAt = 0; return false; }
      return true;
    });
    const first = log[0]!.question;
    const back = log.findIndex((asked, at) => at > 0 && asked.review !== null);
    expect(missedAt).toBe(0);
    // 4 to 8 other questions sit in between.
    expect(back - 1).toBeGreaterThanOrEqual(4);
    expect(back - 1).toBeLessThanOrEqual(8);
    expect(log[back]!.question.correct).toBe(first.correct);
    expect(log[back]!.question.options.map(option => option.text)).toContain(log[back]!.review!.pick);
    // Right once: it stays on the list for one more check, 15 questions later.
    expect(history.reviews).toHaveLength(1);
    expect(history.reviews[0]!.stage).toBe(1);
  });

  it('never brings back a typed spelling mistake as a card, but does bring back an accent slip', () => {
    const item = { verb: 'boire', tense: 'indicative.perfect', slot: '2s' };
    const due = (pick: string, kind: string): History => ({
      count: 10, answers: [], reviews: [{ ...item, due: 10, stage: 0, pick, kind, misses: 1 }],
    });
    const typo = nextQuestion(due('tu as bou', 'spelfout'), selection, null, seeded(2))!;
    expect(typo.review).not.toBeNull();
    expect(typo.question.options.map(option => option.text)).not.toContain('tu as bou');
    const accent = nextQuestion(due('tu as bû', 'verkeerd accent'), selection, null, seeded(2))!;
    expect(accent.question.options.map(option => option.text)).toContain('tu as bû');
  });

  it('marks an answer that was typed', () => {
    const asked = boire();
    expect(record(EMPTY_HISTORY, asked, right(asked), seeded(1), 0, true).answers[0]!.typed).toBe(true);
    expect(record(EMPTY_HISTORY, asked, right(asked), seeded(1), 0).answers[0]).not.toHaveProperty('typed');
  });

  it('clears a question after two right answers and restarts it after a new miss', () => {
    const asked = boire();
    const missed = record(EMPTY_HISTORY, asked, wrong(asked), seeded(2));
    const review = missed.reviews[0]!;
    const once = record(missed, { ...asked, review }, right(asked), seeded(2));
    expect(once.reviews[0]).toMatchObject({ stage: 1, due: once.count + COACH.confirmAfter });
    const twice = record(once, { ...asked, review: once.reviews[0]! }, right(asked), seeded(2));
    expect(twice.reviews).toHaveLength(0);
    const again = record(once, { ...asked, review: once.reviews[0]! }, wrong(asked, 1), seeded(2));
    expect(again.reviews[0]).toMatchObject({ stage: 0, misses: 2 });
  });

  it('asks at most one repeat in three questions', () => {
    const { log } = play(120, () => false, 9);
    for (let at = 0; at < log.length - 2; at++) {
      expect(log.slice(at, at + 3).filter(asked => asked.review).length).toBeLessThanOrEqual(1);
    }
    expect(log.some(asked => asked.review)).toBe(true);
  });

  it('says how this answer compares with the earlier one', () => {
    const asked = boire();
    const [first, second] = [wrong(asked, 0), wrong(asked, 1)];
    const review = record(EMPTY_HISTORY, asked, first, seeded(3)).reviews[0]!;
    expect(recall(null, first)).toBeNull();
    expect(recall(review, right(asked))).toMatchObject({ tone: 'good' });
    expect(recall(review, right(asked))!.text).toContain(first.text);
    expect(recall(review, first)!.text).toMatch(/^Exact dezelfde fout als vorige keer/);
    expect(recall(review, { ...second, kind: first.kind })!.text).toMatch(/^Dezelfde soort fout als vorige keer/);
    expect(recall(review, { ...second, kind: 'iets anders' })!.text).toMatch(/^Een andere fout dan vorige keer/);
    expect(recall({ ...review, stage: 1 }, first)!.text).toMatch(/^Vorige keer had je deze juist, nu niet\. Exact dezelfde fout als eerder/);
    expect(recall({ ...review, stage: 1 }, right(asked))!.text).toMatch(/komt niet meer terug/);
    expect(recall({ ...review, misses: 2 }, first)!.text).toMatch(/3e keer fout/);
  });
});

describe('choosing what to ask', () => {
  it('follows recent answers: a skill rises with right answers and falls with wrong ones', () => {
    const good = skills([answer(true), answer(true), answer(true)]).tenses.get('indicative.present')!;
    const bad = skills([answer(true), answer(false), answer(false)]).tenses.get('indicative.present')!;
    expect(good).toMatchObject({ asked: 3, correct: 3 });
    expect(good.level).toBeGreaterThan(0.75);
    expect(bad.level).toBeLessThan(0.4);
  });

  it('asks weak tenses more often than strong ones, without dropping the strong ones', () => {
    const weak = 'indicative.imperfect';
    const { log } = play(600, asked => asked.question.tense.id !== weak, 21);
    const count = (id: string) => log.filter(asked => !asked.review && !asked.easy && asked.question.tense.id === id).length;
    const others = selection.tenses.filter(id => id !== weak).map(count);
    const average = others.reduce((sum, value) => sum + value, 0) / others.length;
    expect(count(weak)).toBeGreaterThan(average * 2);
    expect(Math.min(...others)).toBeGreaterThan(0);
  });

  it('tries every selected tense early on', () => {
    const { log } = play(40, () => true, 4);
    expect(new Set(log.map(asked => asked.question.tense.id)).size).toBe(selection.tenses.length);
  });

  it('serves two easy questions after two misses in a row, then goes back to work', () => {
    expect(wantsEasy([answer(true), answer(false)])).toBe(false);
    expect(wantsEasy([answer(false), answer(false)])).toBe(true);
    expect(wantsEasy([answer(false), answer(false), answer(true, { easy: true })])).toBe(true);
    expect(wantsEasy([answer(false), answer(false), answer(true, { easy: true }), answer(true, { easy: true })])).toBe(false);
    expect(wantsEasy([answer(false), answer(false), answer(false, { easy: true }), answer(false, { easy: true })])).toBe(false);

    // Strong in the présent, then two misses elsewhere.
    const warmUp: History = {
      count: 8, reviews: [],
      answers: [...Array.from({ length: 6 }, () => answer(true)), answer(false, { tense: 'indicative.imperfect' }), answer(false, { tense: 'indicative.perfect' })],
    };
    const easy = nextQuestion(warmUp, selection, null, seeded(8))!;
    expect(easy.easy).toBe(true);
    expect(easy.question.tense.id).toBe('indicative.present');
    expect(easy.question.verb.fr).toBe('parler');
  });

  it('never repeats the question it just asked and stays inside the selection', () => {
    const { log } = play(300, (_, history) => history.count % 3 !== 0, 13);
    for (let at = 1; at < log.length; at++) {
      const [a, b] = [log[at - 1]!.question, log[at]!.question];
      expect(`${b.verb.fr}|${b.tense.id}|${b.slot}`).not.toBe(`${a.verb.fr}|${a.tense.id}|${a.slot}`);
      expect(selection.tenses).toContain(b.tense.id);
      expect(selection.verbs).toContain(b.verb.fr);
    }
  });

  it('leaves repeats outside the current selection waiting', () => {
    const asked = boire();
    const missed = { ...record(EMPTY_HISTORY, asked, wrong(asked), seeded(2)), count: 50 };
    const lager = selectionForLevel('lager');
    for (let seed = 0; seed < 20; seed++) expect(nextQuestion(missed, lager, null, seeded(seed))!.review).toBeNull();
    expect(nextQuestion(missed, selection, null, seeded(1))!.review).not.toBeNull();
  });
});

describe('report', () => {
  it('summarises totals, tenses, and typical mistakes', () => {
    const { history } = play(200, (asked, state) => asked.question.tense.id !== 'indicative.imperfect' && state.count % 7 !== 0, 31);
    const report = buildReport(history, selection, 1000);
    expect(report.answered).toBe(200);
    expect(report.correct).toBe(history.answers.filter(item => item.ok).length);
    expect(report.tenses.map(score => score.tense.id)).toEqual(expect.arrayContaining([...selection.tenses]));
    const imparfait = report.tenses.find(score => score.tense.id === 'indicative.imperfect')!.skill!;
    expect(imparfait.correct).toBe(0);
    expect(report.mistakes.length).toBeGreaterThan(0);
    expect(report.mistakes[0]!.count).toBeGreaterThanOrEqual(report.mistakes.at(-1)!.count);
    expect(report.mistakes.reduce((sum, mistake) => sum + mistake.count, 0)).toBe(200 - report.correct);
    expect(report.mistakes[0]!.examples[0]!.pick).toBe(history.answers.findLast(item => !item.ok && categoryOf(item.kind!) === report.mistakes[0]!.category)!.pick);
    // Every mix-up of two tenses is one category, split into pairs inside.
    const tense = report.mistakes.find(mistake => mistake.category === WRONG_TENSE)!;
    expect(report.mistakes.filter(mistake => mistake.category.startsWith('verward'))).toHaveLength(0);
    expect(tense.groups.reduce((sum, group) => sum + group.count, 0)).toBe(tense.count);
    expect(tense.groups[0]!.label).toMatch(/ ↔ /);
    expect(report.mistakes.find(mistake => mistake.category !== WRONG_TENSE)!.groups).toEqual([]);
    expect(buildReport(EMPTY_HISTORY, selection).answered).toBe(0);
  });
});

describe('storage', () => {
  function memory(initial: Record<string, string> = {}): KeyValue & { data: Map<string, string> } {
    const data = new Map(Object.entries(initial));
    return { data, getItem: key => data.get(key) ?? null, setItem: (key, value) => { data.set(key, value); }, removeItem: key => { data.delete(key); } };
  }

  it('keeps settings, progress and history apart and reads them back', () => {
    const storage = memory();
    const store = createStore(storage);
    const { history } = play(12, (_, state) => state.count % 2 === 0);
    store.saveSettings({ selection, welcomed: true, mode: 'typing' });
    store.saveProgress({ xp: 120, best: 7 });
    store.saveHistory(history);
    expect([...storage.data.keys()].sort()).toEqual([KEYS.history, KEYS.progress, KEYS.settings]);
    const again = createStore(storage);
    expect(again.loadSettings()).toEqual({ selection, welcomed: true, mode: 'typing' });
    expect(again.loadProgress()).toEqual({ xp: 120, best: 7 });
    expect(again.loadHistory()).toEqual(history);
    again.clearResults();
    expect(again.loadHistory()).toEqual(EMPTY_HISTORY);
    expect(again.loadProgress()).toEqual({ xp: 0, best: 0 });
    expect(again.loadSettings().welcomed).toBe(true);
  });

  it('carries the first version over once', () => {
    const storage = memory({
      'fr-conj-v1': '{"xp":50,"best":3}',
      'verbodrome-traject-v1': JSON.stringify(selection),
      'verbodrome-welkom-v1': 'true',
    });
    const store = createStore(storage);
    expect(store.loadSettings()).toEqual({ selection, welcomed: true, mode: 'cards' });
    expect(store.loadProgress()).toEqual({ xp: 50, best: 3 });
    expect(storage.data.has('fr-conj-v1')).toBe(false);
  });

  it('remembers how the learner answers, multiple choice unless typing was chosen', () => {
    expect(parseSettings({ welcomed: true }).mode).toBe('cards');
    expect(parseSettings({ welcomed: true, mode: 'typing' }).mode).toBe('typing');
    expect(parseSettings({ welcomed: true, mode: 'voice' }).mode).toBe('cards');
  });

  it('keeps the typed mark in the answer log', () => {
    expect(parseHistory({ count: 1, answers: [answer(true, { typed: true })], reviews: [] }).answers[0]!.typed).toBe(true);
    expect(parseHistory({ count: 1, answers: [{ ...answer(true), typed: 'yes' }], reviews: [] }).answers[0]).not.toHaveProperty('typed');
  });

  it('survives damaged or missing storage', () => {
    expect(parseHistory('nonsense')).toEqual(EMPTY_HISTORY);
    expect(parseHistory({ count: 1, answers: [{ verb: 'parler' }, answer(true)], reviews: [{}] }))
      .toEqual({ count: 1, answers: [answer(true)], reviews: [] });
    const broken = createStore(memory({ [KEYS.history]: '{not json', [KEYS.settings]: '[]' }));
    expect(broken.loadHistory()).toEqual(EMPTY_HISTORY);
    expect(broken.loadSettings()).toEqual({ selection: null, welcomed: false, mode: 'cards' });
    const none = createStore(null);
    none.saveProgress({ xp: 1, best: 1 });
    expect(none.loadProgress()).toEqual({ xp: 0, best: 0 });
  });
});
