import { formAt, verbForms } from './forms';
import { wrongAnswers } from './question';
import type { Option, Question } from './question';

/**
 * A typed answer, turned into the same Option a card would be, so the log, the
 * repeats, the feedback and the report treat both ways of answering alike.
 * A slip that matches a card's trap gets that card's label; anything else is
 * an accent or spelling mistake.
 */

/** Same name as the card trap in distractors.ts, so the report counts both ways of answering together. */
export const FORGOTTEN_ACCENT = 'accent vergeten';
export const WRONG_ACCENT = 'verkeerd accent';
export const SPELLING = 'spelfout';

/** What does not count when comparing: capitals, spacing, the kind of apostrophe and a closing "!". */
export function normalize(text: string): string {
  return text.normalize('NFC').toLowerCase()
    .replace(/[’‘ʼ`´]/g, "'")
    .replace(/\s+/g, ' ')
    .replace(/' /g, "'")
    .trim()
    .replace(/\s*!$/, '');
}

const strip = (text: string): string => text.normalize('NFD').replace(/\p{M}/gu, '').normalize('NFC');
/** The letters without their accents, for "right but for the accents". */
const bare = (text: string): string => strip(text).replace(/œ/g, 'oe').replace(/æ/g, 'ae');

/** Every letter is the right one or the right one without its accent: accents were left out, none put wrong. */
function onlyLeftOut(typed: string, right: string): boolean {
  const have = [...typed];
  const want = [...right];
  return have.length === want.length && have.every((letter, at) => letter === want[at] || letter === strip(want[at]!));
}

/**
 * Check a typed answer, in order: an accepted spelling; a wrong answer a card
 * could have shown; the right form with an accent left out or wrong; a card's
 * wrong answer with an accent off (the bigger mistake is named); else a spelling mistake.
 */
export function classify(question: Question, typed: string, tenses: readonly string[]): Option {
  const target = formAt(verbForms(question.verb.fr), question.tense.id, question.slot);
  const text = normalize(typed);
  const accepted = (target?.accepted ?? [question.correct]).map(normalize);
  if (accepted.includes(text)) return { text: question.correct, correct: true, label: '', nl: question.prompt, kind: '' };

  // Shown like a card, so the comparison and the report line it up with the right answer.
  const shown = question.tense.mood === 'imperative' ? `${text} !` : text;
  const mistake = (kind: string): Option => ({ text: shown, correct: false, label: kind, nl: null, kind });
  const pool = target ? wrongAnswers(question.verb, target, new Set(tenses)) : [];

  const exact = pool.find(option => normalize(option.text) === text);
  if (exact) return exact;
  const right = accepted.find(variant => bare(variant) === bare(text));
  if (right !== undefined) return mistake(onlyLeftOut(text, right) ? FORGOTTEN_ACCENT : WRONG_ACCENT);
  const near = pool.find(option => bare(normalize(option.text)) === bare(text));
  if (near) return { ...near, text: shown };
  return mistake(SPELLING);
}
