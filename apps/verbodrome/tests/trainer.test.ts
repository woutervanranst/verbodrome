import { describe, expect, it } from 'vitest';
import { TENSES, tenseById } from '../src/config/tenses';
import { VERBS, verbByFr } from '../src/config/verbs';
import { diff, subjectLength } from '../src/trainer/diff';
import { mistakes } from '../src/trainer/distractors';
import { exampleOf, formAt, verbForms } from '../src/trainer/forms';
import { dutchPrompt } from '../src/trainer/prompt';
import { askable, inPerson, makeQuestion, questionFor } from '../src/trainer/question';
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

  it('treats Extra as the level above the 3e graad: it selects everything', () => {
    expect(tensesForLevel('extra')).toHaveLength(25);
    expect(verbsForLevel('extra')).toHaveLength(VERBS.length);
    expect(matchingLevel(TENSES.map(t => t.id), tensesForLevel)).toBe('extra');
  });

  it('orders tenses along the time axis, from furthest past to future', () => {
    const order = TENSES.map(t => t.id);
    const at = (id: string) => order.indexOf(id);
    expect(at('indicative.pluperfect')).toBeLessThan(at('indicative.imperfect'));
    expect(at('indicative.imperfect')).toBeLessThan(at('indicative.perfect'));
    expect(at('indicative.recent_past')).toBeLessThan(at('indicative.present'));
    expect(at('indicative.present')).toBeLessThan(at('indicative.near_future'));
    expect(at('indicative.near_future')).toBeLessThan(at('indicative.future'));
    expect(tensesForLevel('g1')).toEqual(['indicative.imperfect', 'indicative.perfect', 'indicative.recent_past', 'indicative.present', 'imperative.present', 'indicative.near_future']);
    expect(tenseById('indicative.pluperfect')?.era).toBe('voorverleden');
    expect(tenseById('indicative.near_future')?.era).toBe('straks');
  });

  it('illustrates every tense with an example form', () => {
    expect(exampleOf('parler', 'indicative.imperfect')).toBe('je parlais');
    expect(exampleOf('parler', 'imperative.present')).toBe('parle !');
    expect(exampleOf('parler', 'gerund.present')).toBe('en parlant');
    for (const t of TENSES) expect(exampleOf('parler', t.id), t.id).not.toBeNull();
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

  it('keeps a fixed tail word after the verb (houden van)', () => {
    expect(prompt('aimer', 'indicative.present', '1s')).toBe('ik houd van');
    expect(prompt('aimer', 'indicative.perfect', '3s')).toBe('hij heeft gehouden van');
    expect(prompt('aimer', 'indicative.future', '1p')).toBe('wij zullen houden van');
    expect(prompt('aimer', 'imperative.present', '2s')).toBe('houd van! (jij)');
    expect(prompt('aimer', 'imperative.present', '1p')).toBe('laten we houden van!');
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

  it('never offers the feminine twin of the right answer as a wrong card', () => {
    const selection = { verbs: ['aller', 'venir'], tenses: tensesForLevel('g3') };
    for (const [fr, feminine] of [['aller', 'je suis allée'], ['venir', 'je suis venue']] as const) {
      for (let draw = 0; draw < 50; draw++) {
        const question = questionFor(selection, { verb: fr, tense: 'indicative.perfect', slot: '1s' }, seeded(draw))!;
        expect(question.options.filter(option => !option.correct).map(option => option.text), `${fr} draw ${draw}`).not.toContain(feminine);
      }
    }
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

  it('says another person\'s form with the asked subject', () => {
    const partir = verbForms('partir'), aimer = verbForms('aimer'), mefier = verbForms('se méfier');
    expect(inPerson(partir, formAt(partir, 'indicative.present', '3p')!, '1s')).toBe('je partent');
    expect(inPerson(aimer, formAt(aimer, 'indicative.present', '1p')!, '1s')).toBe("j'aimons");
    expect(inPerson(aimer, formAt(aimer, 'indicative.perfect', '1s')!, '1p')).toBe('nous ai aimé');
    expect(inPerson(partir, formAt(partir, 'subjunctive.present', '1p')!, '3s')).toBe("qu'il partions");
    expect(inPerson(mefier, formAt(mefier, 'indicative.present', '2p')!, '1s')).toBe('je me méfiez');
  });

  it('never gives the answer away through the subject: every option keeps the asked person', () => {
    const pronoun = /^(?:que |qu')?(j'|je |tu |il |elle |on |nous |vous |ils |elles )/;
    const random = seeded(11);
    for (const level of ['g1', 'g3', 'extra'] as const) {
      const selection = selectionForLevel(level);
      let last: Question | null = null;
      for (let round = 0; round < 300; round++) {
        const question: Question = makeQuestion(selection, last, random)!;
        last = question;
        const asked = pronoun.exec(question.correct)?.[1]?.replace("j'", 'je ');
        if (!asked) continue;
        for (const option of question.options) {
          const said = pronoun.exec(option.text)?.[1]?.replace("j'", 'je ');
          if (said) expect(`${option.text} ← ${said}`).toBe(`${option.text} ← ${asked}`);
        }
      }
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

  it('never asks a tense that is excluded for a verb', () => {
    expect(verb('aller').exclude).toEqual(['indicative.near_future']);
    expect(makeQuestion({ verbs: ['aller'], tenses: ['indicative.near_future'] })).toBeNull();
    expect(makeQuestion({ verbs: ['naître'], tenses: ['indicative.perfect'] })).toBeNull();
    expect(askable(verb('aller'), new Set(['indicative.near_future', 'indicative.present'])).map(f => f.tense.id))
      .toEqual(Array(6).fill('indicative.present'));
    const random = seeded(21);
    for (let i = 0; i < 200; i++) {
      const question = makeQuestion({ verbs: ['aller', 'naître'], tenses: tensesForLevel('g2') }, null, random)!;
      expect(`${question.verb.fr} ${question.tense.id}`).not.toMatch(/aller indicative\.near_future|naître indicative\.perfect/);
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

  it('highlights an accent slip on the first letter of a form without subject, but not a whole different word', () => {
    expect(diff('ecris !', 'écris !')).toEqual(['', 'e', 'cris !']);
    expect(diff('écris !', 'ecris !')).toEqual(['', 'é', 'cris !']);
    expect(diff('parlant', 'ayant parlé')).toEqual(['parlant', '', '']);
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

  it('gives more XP for a typed answer, rounded', () => {
    expect(applyAnswer({ streak: 3, best: 5, xp: 100 }, true, 1.5)).toEqual({ streak: 4, best: 5, xp: 124, gain: 24 });
    expect(applyAnswer({ streak: 0, best: 0, xp: 0 }, true, 1.25).gain).toBe(13);
    expect(applyAnswer({ streak: 3, best: 5, xp: 100 }, false, 1.5).gain).toBe(0);
  });
});
