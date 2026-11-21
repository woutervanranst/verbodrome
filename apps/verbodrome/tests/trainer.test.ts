import { describe, expect, it } from 'vitest';
import { TENSES, tenseById } from '../src/config/tenses';
import { VERBS, verbByFr } from '../src/config/verbs';
import { diff, subjectLength } from '../src/trainer/diff';
import { mistakes } from '../src/trainer/distractors';
import { formAt, verbForms } from '../src/trainer/forms';
import { dutchPrompt } from '../src/trainer/prompt';
import { askable, makeQuestion } from '../src/trainer/question';
import type { Question } from '../src/trainer/question';
import { rule } from '../src/trainer/rules';
import { applyAnswer } from '../src/trainer/score';
import { matchingLevel, sanitize, selectionForLevel, tensesForLevel, verbsForLevel } from '../src/trainer/selection';

const verb = (fr: string) => verbByFr(fr)!;
const tense = (id: string) => tenseById(id)!;
const prompt = (fr: string, id: string, slot: string) => dutchPrompt(verb(fr), tense(id), slot);

/** Deterministic pseudo-random generator so failures are reproducible. */
function seeded(seed: number): () => number {
  let state = seed;
  return () => {
    state = (state * 1664525 + 1013904223) % 4294967296;
    return state / 4294967296;
  };
}

describe('configuration', () => {
  it('covers every engine tense and has no duplicate verbs', () => {
    expect(TENSES).toHaveLength(25);
    expect(new Set(VERBS.map(v => v.fr)).size).toBe(VERBS.length);
    expect(VERBS.length).toBeGreaterThanOrEqual(84);
  });

  it('places tenses at the level where Flemish schools introduce them', () => {
    expect(tensesForLevel('lager')).toEqual(['indicative.present']);
    expect(tensesForLevel('g1')).toEqual(expect.arrayContaining(['indicative.perfect', 'indicative.imperfect', 'indicative.recent_past']));
    expect(tensesForLevel('g1')).not.toContain('indicative.future');
    expect(tensesForLevel('g2')).toEqual(expect.arrayContaining(['indicative.future', 'gerund.present']));
    expect(tensesForLevel('g3')).toHaveLength(15);
    expect(tensesForLevel('g3')).not.toContain('subjunctive.imperfect');
  });

  it('keeps quick-picks cumulative and leaves rare verbs out', () => {
    expect(verbsForLevel('g1')).toEqual(expect.arrayContaining(verbsForLevel('lager')));
    expect(verbsForLevel('g3')).not.toContain('gésir');
    expect(matchingLevel(tensesForLevel('g2'), tensesForLevel)).toBe('g2');
    expect(matchingLevel(['indicative.present', 'indicative.future'], tensesForLevel)).toBeNull();
  });

  it('drops unknown ids from a stored selection', () => {
    expect(sanitize({ verbs: ['être', 'nope'], tenses: ['indicative.present', 'x.y'] }))
      .toEqual({ verbs: ['être'], tenses: ['indicative.present'] });
    expect(sanitize({ verbs: [], tenses: ['indicative.present'] })).toBeNull();
    expect(sanitize('garbage')).toBeNull();
  });
});

describe('forms come from conjugation-engine', () => {
  it('conjugates every configured verb and gives each askable form a Dutch prompt', () => {
    const withoutPrompt: string[] = [];
    for (const v of VERBS) {
      const forms = verbForms(v.fr);
      expect(forms.all.length, v.fr).toBeGreaterThan(0);
      for (const form of forms.all) {
        if (dutchPrompt(v, form.tense, form.slot) === null) withoutPrompt.push(`${v.fr} ${form.tense.id} ${form.slot}`);
      }
    }
    // Dutch "moeten" has no imperative, so "dois !" / "devez !" cannot be prompted and are never asked.
    expect(withoutPrompt).toEqual(['devoir imperative.present 2s', 'devoir imperative.present 2p']);
  });

  it('shows imperatives as commands and elides like French does', () => {
    const etre = verbForms('être');
    expect(formAt(etre, 'imperative.present', '2s')?.text).toBe('sois !');
    expect(formAt(etre, 'indicative.perfect', '1s')?.text).toBe("j'ai été");
    expect(formAt(etre, 'subjunctive.present', '3s')?.text).toBe("qu'il soit");
    expect(formAt(verbForms('aller'), 'indicative.perfect', '1p')?.text).toBe('nous sommes allés');
  });

  it('keeps accepted variants together so they are never offered as wrong answers', () => {
    expect(formAt(verbForms('payer'), 'indicative.present', '1s')?.accepted).toEqual(['je paie', 'je paye']);
  });

  it('restricts impersonal verbs to the forms the engine reports', () => {
    const falloir = verbForms('falloir');
    expect(falloir.impersonal).toBe(true);
    expect(falloir.byTense.get('indicative.present')?.map(f => f.text)).toEqual(['il faut']);
  });
});

describe('Dutch prompts', () => {
  it('uses the engine for tenses Dutch shares with French', () => {
    expect(prompt('être', 'indicative.future', '1s')).toBe('ik zal zijn');
    expect(prompt('boire', 'indicative.imperfect', '2p')).toBe('jullie dronken');
    expect(prompt('partir', 'indicative.perfect', '1s')).toBe('ik ben vertrokken');
    expect(prompt('aller', 'conditional.present', '3p')).toBe('zij zouden gaan');
  });

  it('composes the tenses Dutch has no direct counterpart for', () => {
    expect(prompt('manger', 'indicative.near_future', '1s')).toBe('ik ga eten');
    expect(prompt('manger', 'indicative.recent_past', '3s')).toBe('hij heeft net gegeten');
    expect(prompt('être', 'subjunctive.present', '1s')).toBe('…dat ik ben');
    expect(prompt('manger', 'subjunctive.past', '1s')).toBe('…dat ik gegeten heb');
    expect(prompt('être', 'imperative.present', '2s')).toBe('wees! (jij)');
    expect(prompt('être', 'imperative.present', '1p')).toBe('laten we zijn!');
    expect(prompt('être', 'imperative.present', '2p')).toBe('wees! (jullie)');
    expect(prompt('manger', 'gerund.present', '-')).toBe('al etend');
    expect(prompt('manger', 'infinitive.past', '-')).toBe('gegeten hebben');
  });

  it('handles separable verbs, complements and impersonal subjects', () => {
    expect(prompt('rendre', 'indicative.present', '1s')).toBe('ik geef terug');
    expect(prompt('rendre', 'subjunctive.present', '1s')).toBe('…dat ik teruggeef');
    expect(prompt('naître', 'indicative.future', '1s')).toBe('ik zal geboren worden');
    expect(prompt('falloir', 'indicative.present', '3s')).toBe('het moet');
    expect(prompt('pleuvoir', 'indicative.imperfect', '3s')).toBe('het regende');
  });
});

describe('wrong answers', () => {
  const wrong = (fr: string, id: string, slot: string) => {
    const forms = verbForms(fr);
    return mistakes(forms, formAt(forms, id, slot)!);
  };

  it('swaps the auxiliary and keeps elision natural', () => {
    expect(wrong('aller', 'indicative.perfect', '1s')).toContainEqual({ text: "j'ai allé", label: 'verkeerd hulpwerkwoord' });
    expect(wrong('faire', 'indicative.perfect', '1s')).toContainEqual({ text: 'je suis fait', label: 'verkeerd hulpwerkwoord' });
    expect(wrong('manger', 'indicative.perfect', '1s')).toContainEqual({ text: "j'ai manger", label: 'infinitief in plaats van deelwoord' });
  });

  it('regularises irregular future stems and uses the indicative after que', () => {
    expect(wrong('être', 'indicative.future', '1s')).toContainEqual({ text: "j'êtrai", label: 'verkeerde stam' });
    expect(wrong('aller', 'conditional.present', '2s')).toContainEqual({ text: 'tu allerais', label: 'verkeerde stam' });
    expect(wrong('être', 'subjunctive.present', '1s')).toContainEqual({ text: 'que je suis', label: 'indicatief na que' });
    expect(wrong('faire', 'indicative.near_future', '1s')).toContainEqual({ text: 'je vais fait', label: 'deelwoord in plaats van infinitief' });
  });

  it('offers subjectless look-alikes for the imperative', () => {
    expect(wrong('manger', 'imperative.present', '2s')).toContainEqual({ text: 'manges !', label: 'présent zonder onderwerp' });
    expect(wrong('être', 'imperative.present', '2p').map(m => m.text)).toContain('êtes !');
  });

  it('never proposes an accepted spelling as a mistake', () => {
    for (const v of VERBS) {
      const forms = verbForms(v.fr);
      for (const form of forms.all) {
        for (const mistake of mistakes(forms, form)) expect(form.accepted, `${v.fr} ${form.text}`).not.toContain(mistake.text);
      }
    }
  });
});

describe('questions', () => {
  it('builds ten unique options with exactly one correct answer, for every level', () => {
    for (const level of ['lager', 'g1', 'g2', 'g3'] as const) {
      const selection = selectionForLevel(level);
      const random = seeded(level.length * 7919);
      let previous: Question | null = null;
      for (let i = 0; i < 150; i++) {
        const question: Question = makeQuestion(selection, previous, random)!;
        expect(question).not.toBeNull();
        expect(selection.tenses).toContain(question.tense.id);
        expect(selection.verbs).toContain(question.verb.fr);
        const texts = question.options.map(option => option.text);
        expect(new Set(texts).size, question.correct).toBe(texts.length);
        expect(question.options.filter(option => option.correct).map(option => option.text)).toEqual([question.correct]);
        expect(texts.length, `${question.verb.fr} ${question.tense.id}`).toBe(10);
        if (previous) {
          expect(`${question.verb.fr}|${question.tense.id}|${question.slot}`)
            .not.toBe(`${previous.verb.fr}|${previous.tense.id}|${previous.slot}`);
        }
        previous = question;
      }
    }
  });

  it('can ask every verb in every tense without failing, and always offers a choice', () => {
    const random = seeded(42);
    for (const v of VERBS) {
      for (const t of TENSES) {
        if (!askable(v, new Set([t.id])).length) continue;
        const question = makeQuestion({ verbs: [v.fr], tenses: [t.id] }, null, random)!;
        expect(question.options.length, `${v.fr} ${t.id}`).toBeGreaterThanOrEqual(4);
        expect(question.options.every(option => option.text.length > 0)).toBe(true);
      }
    }
  });

  it('labels real distractors with their tense and Dutch meaning, and mistakes with their kind', () => {
    const question = makeQuestion({ verbs: ['boire'], tenses: ['indicative.present'] }, null, seeded(3))!;
    for (const option of question.options.filter(o => !o.correct)) {
      expect(option.label).not.toBe('');
      if (option.nl) expect(option.label).toMatch(/ · |participe|infinitif|gérondif/);
    }
  });

  it('shows the tense only when the Dutch prompt is ambiguous within the selection', () => {
    const ask = (tenses: string[]) => {
      const random = seeded(11);
      let question;
      do { question = makeQuestion({ verbs: ['être'], tenses }, null, random)!; }
      while (question.tense.id !== 'indicative.imperfect');
      return question;
    };
    expect(ask(['indicative.imperfect', 'indicative.present']).showTense).toBe(false);
    const ambiguous = ask(['indicative.imperfect', 'indicative.simple_past']);
    expect(ambiguous.showTense).toBe(true);
    expect(ambiguous.prompt).toMatch(/was|waren/);
  });

  it('never offers a real form with the same Dutch meaning as a wrong answer when the tense is hidden', () => {
    const random = seeded(5);
    for (let i = 0; i < 300; i++) {
      const question = makeQuestion(selectionForLevel('g3'), null, random)!;
      if (question.showTense) continue;
      for (const option of question.options.filter(o => !o.correct)) expect(option.nl, `${question.correct} / ${option.text}`).not.toBe(question.prompt);
    }
  });

  it('prefers distractors from the tenses being practised', () => {
    const random = seeded(8);
    for (let i = 0; i < 50; i++) {
      const question = makeQuestion({ verbs: ['finir'], tenses: tensesForLevel('g1') }, null, random)!;
      const labels = question.options.filter(o => !o.correct && o.nl).map(o => o.label);
      expect(labels.some(label => /subjonctif|antérieur|passé simple/.test(label)), labels.join(' | ')).toBe(false);
    }
  });

  it('returns null for a selection with nothing to ask', () => {
    expect(makeQuestion({ verbs: ['falloir'], tenses: ['imperative.present'] })).toBeNull();
    expect(makeQuestion({ verbs: [], tenses: ['indicative.present'] })).toBeNull();
  });
});

describe('feedback helpers', () => {
  it('highlights only the differing middle, and not when the subject already differs', () => {
    expect(diff('vous buviez', 'vous buvez', subjectLength('vous buviez', true))).toEqual(['vous buv', 'i', 'ez']);
    expect(diff("j'ai été", 'je suis été', subjectLength("j'ai été", true))).toEqual(["j'ai été", '', '']);
    expect(diff('nous allons', null)).toEqual(['nous allons', '', '']);
    expect(subjectLength("qu'il soit", true)).toBe(6);
    expect(subjectLength('mangeant', false)).toBe(0);
  });

  it('explains formation with stems read from the engine', () => {
    expect(rule(verb('être'), tense('indicative.future'))).toBe('Onregelmatige stam ser- + -ai, -as, -a, -ons, -ez, -ont.');
    expect(rule(verb('parler'), tense('indicative.future'))).toContain('Neem de infinitief (parler)');
    expect(rule(verb('boire'), tense('indicative.imperfect'))).toContain('nous buvons');
    expect(rule(verb('être'), tense('indicative.imperfect'))).toContain('Uitzondering: stam ét-');
    expect(rule(verb('aller'), tense('indicative.perfect'))).toBe('Hulpwerkwoord être in de présent + voltooid deelwoord allé. Met être past het deelwoord zich aan het onderwerp aan.');
    expect(rule(verb('parler'), tense('indicative.present'))).toContain('stam parl-');
    for (const v of VERBS) for (const t of TENSES) expect(rule(v, t).length, `${v.fr} ${t.id}`).toBeGreaterThan(10);
  });

  it('scores streaks like the design: 10 XP plus 2 per streak step, capped', () => {
    expect(applyAnswer({ streak: 0, best: 0, xp: 0 }, true)).toEqual({ streak: 1, best: 1, xp: 10, gain: 10 });
    expect(applyAnswer({ streak: 3, best: 5, xp: 100 }, true)).toEqual({ streak: 4, best: 5, xp: 116, gain: 16 });
    expect(applyAnswer({ streak: 25, best: 25, xp: 0 }, true).gain).toBe(30);
    expect(applyAnswer({ streak: 7, best: 9, xp: 50 }, false)).toEqual({ streak: 0, best: 9, xp: 50, gain: 0 });
  });
});
