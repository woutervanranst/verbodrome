import { conjugate, renderParts } from 'conjugation-engine';
import type { ConjugatedForm, ConjugationPart, DutchConjugationOptions, DutchTenses, GrammaticalNumber, Person } from 'conjugation-engine';
import type { TenseDef } from '../config/tenses';
import type { DutchCounterpart, VerbDef } from '../config/verbs';
import { verbForms } from './forms';

type NlMood = keyof DutchTenses;

interface Subject { readonly person: Person; readonly number: GrammaticalNumber }

function subjectOf(slot: string): Subject | null {
  if (slot === '-') return null;
  return { person: Number(slot[0]) as Person, number: slot[1] === 's' ? 'singular' : 'plural' };
}

/** A free-standing word we weave into engine parts ("net", "geboren"). */
function word(text: string): ConjugationPart {
  return {
    role: 'particle', text, lemma: null,
    features: { mood: null, tense: null, person: null, number: null, gender: null, verbForm: null },
    phonology: { onset: 'consonant' }, joinBefore: 'space',
  };
}

function hints(nl: DutchCounterpart): Partial<DutchConjugationOptions> {
  const { infinitive: _infinitive, complement: _complement, tail: _tail, ...rest } = nl;
  return rest;
}

/** Preferred Dutch form for one target, or null when the engine has none. */
function dutch(nl: DutchCounterpart, mood: NlMood, tense: string, subject: Subject | null, impersonal: boolean): ConjugatedForm | null {
  const query = {
    language: 'nl', infinitive: nl.infinitive, ...hints(nl), mood, tense,
    ...(subject ? { person: subject.person, number: subject.number } : {}),
    ...(impersonal && subject?.person === 3 && subject.number === 'singular' ? { pronoun: 'het' } : {}),
  } as DutchConjugationOptions;
  try {
    const forms = conjugate(query).forms;
    return forms.find(form => form.preferred) ?? forms[0] ?? null;
  } catch {
    return null;
  }
}

const isFinite = (part: ConjugationPart): boolean => part.features.verbForm === 'finite';

/** Main clause, with optional words placed right after the finite verb (and its reflexive pronoun). */
function mainClause(parts: readonly ConjugationPart[], extra: readonly string[]): string {
  if (!extra.length) return renderParts('nl', parts);
  let at = parts.findIndex(isFinite) + 1;
  while (parts[at]?.role === 'reflexivePronoun') at++;
  return renderParts('nl', [...parts.slice(0, at), ...extra.map(word), ...parts.slice(at)]);
}

/** Subordinate word order: "…dat ik teruggeef", "…dat ik gegeten heb". */
function subordinate(parts: readonly ConjugationPart[], complement: string | undefined): string {
  const finite = parts.find(isFinite);
  if (!finite) return renderParts('nl', parts);
  const prefix = finite.role === 'lexicalVerb'
    ? parts.filter(part => part.role === 'particle').map(part => part.text).join('')
    : '';
  const before = parts.filter(part => part.role === 'subject' || part.role === 'reflexivePronoun');
  const rest = parts.filter(part => part !== finite && !before.includes(part)
    && !(prefix && part.role === 'particle'));
  const ordered = [
    ...before, ...(complement ? [word(complement)] : []), ...rest,
    { ...finite, text: prefix + finite.text },
  ];
  return `…dat ${renderParts('nl', ordered)}`;
}

const text = (form: ConjugatedForm | null): string | null => form ? form.text : null;

/** Past participle and perfect auxiliary of the Dutch verb, read from a third-person perfect. */
function perfectPieces(nl: DutchCounterpart, impersonal: boolean): { participle: string; auxiliary: string } | null {
  const perfect = dutch(nl, 'indicative', 'perfect', { person: 3, number: 'singular' }, impersonal);
  const participle = perfect?.parts.find(part => part.features.verbForm === 'pastParticiple');
  const auxiliary = perfect?.parts.find(part => part.role === 'auxiliary');
  if (!participle || !auxiliary) return null;
  return { participle: participle.text, auxiliary: auxiliary.lemma ?? perfect?.variant.auxiliary ?? 'hebben' };
}

const join = (...words: (string | undefined)[]): string => words.filter(Boolean).join(' ');

/** French tense → Dutch tense the engine can produce directly. */
const DIRECT: Readonly<Record<string, readonly [NlMood, string]>> = {
  'indicative.present': ['indicative', 'present'],
  'indicative.perfect': ['indicative', 'perfect'],
  'indicative.imperfect': ['indicative', 'past'],
  'indicative.pluperfect': ['indicative', 'pluperfect'],
  'indicative.simple_past': ['indicative', 'past'],
  'indicative.past_anterior': ['indicative', 'pluperfect'],
  'indicative.future': ['indicative', 'future'],
  'indicative.future_perfect': ['indicative', 'future_perfect'],
  'conditional.present': ['conditional', 'present'],
  'conditional.past': ['conditional', 'past'],
};

/** French subjunctives are shown as a Dutch "dat" clause in the matching tense. */
const SUBJUNCTIVE: Readonly<Record<string, string>> = {
  'subjunctive.present': 'present',
  'subjunctive.past': 'perfect',
  'subjunctive.imperfect': 'past',
  'subjunctive.pluperfect': 'pluperfect',
};

const cache = new Map<string, string | null>();

/**
 * The Dutch prompt for a French verb form. All Dutch verb forms come from
 * conjugation-engine; this only arranges them where Dutch has no one-to-one
 * tense (futur proche, passé récent, subjonctif, impératif, non-finite forms).
 */
export function dutchPrompt(verb: VerbDef, tense: TenseDef, slot: string): string | null {
  const key = `${verb.fr}|${tense.id}|${slot}`;
  const cached = cache.get(key);
  if (cached !== undefined) return cached;
  const value = withTail(compose(verb, tense, slot), verb.nl.tail);
  cache.set(key, value);
  return value;
}

/** "houden van": the fixed word closes the phrase, before any exclamation mark. */
function withTail(prompt: string | null, tail: string | undefined): string | null {
  if (!prompt || !tail) return prompt;
  const bang = prompt.indexOf('!');
  return bang < 0 ? `${prompt} ${tail}` : `${prompt.slice(0, bang)} ${tail}${prompt.slice(bang)}`;
}

function compose(verb: VerbDef, tense: TenseDef, slot: string): string | null {
  const nl = verb.nl;
  const impersonal = verbForms(verb.fr).impersonal;
  const subject = subjectOf(slot);
  const complement = nl.complement ? [nl.complement] : [];
  const infinitive = text(dutch(nl, 'infinitive', 'present', null, false));
  if (!infinitive) return null;

  if (subject) {
    const direct = DIRECT[tense.id];
    if (direct) {
      const form = dutch(nl, direct[0], direct[1], subject, impersonal);
      return form ? mainClause(form.parts, complement) : null;
    }
    const sub = SUBJUNCTIVE[tense.id];
    if (sub) {
      const form = dutch(nl, 'indicative', sub, subject, impersonal);
      return form ? subordinate(form.parts, nl.complement) : null;
    }
    if (tense.id === 'indicative.near_future') {
      const going = dutch({ infinitive: 'gaan' }, 'indicative', 'present', subject, impersonal);
      return going ? join(going.text, nl.complement, infinitive) : null;
    }
    if (tense.id === 'indicative.recent_past') {
      const form = dutch(nl, 'indicative', 'perfect', subject, impersonal);
      return form ? mainClause(form.parts, ['net', ...complement]) : null;
    }
    if (tense.mood === 'imperative') {
      const who = slot === '2s' ? 'jij' : slot === '2p' ? 'jullie' : null;
      if (tense.tense === 'present') {
        if (!who) return `laten we ${join(nl.complement, infinitive)}!`;
        const form = dutch(nl, 'imperative', 'present', { person: 2, number: 'singular' }, false);
        return form ? `${join(form.text, nl.complement)}! (${who})` : null;
      }
      const pieces = perfectPieces(nl, impersonal);
      if (!pieces) return null;
      if (!who) return `laten we ${join(nl.complement, pieces.participle, pieces.auxiliary)}!`;
      const command = dutch({ infinitive: pieces.auxiliary }, 'imperative', 'present', { person: 2, number: 'singular' }, false);
      return command ? `${join(command.text, nl.complement, pieces.participle)}! (${who})` : null;
    }
    return null;
  }

  switch (tense.id) {
    case 'infinitive.present': return join(nl.complement, infinitive);
    case 'participle.present': return join(nl.complement, text(dutch(nl, 'participle', 'present', null, false)) ?? undefined);
    case 'gerund.present': {
      const participle = text(dutch(nl, 'participle', 'present', null, false));
      return participle ? join('al', nl.complement, participle) : null;
    }
  }
  const pieces = perfectPieces(nl, impersonal);
  if (!pieces) return null;
  switch (tense.id) {
    case 'participle.past': return join(nl.complement, pieces.participle);
    case 'infinitive.past': return join(nl.complement, pieces.participle, pieces.auxiliary);
    case 'participle.perfect': {
      const having = text(dutch({ infinitive: pieces.auxiliary }, 'participle', 'present', null, false));
      return having ? join(nl.complement, pieces.participle, having) : null;
    }
    case 'gerund.past': return join('na', nl.complement, pieces.participle, 'te', pieces.auxiliary);
  }
  return null;
}
