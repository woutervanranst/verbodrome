import { conjugate, renderParts } from 'conjugation-engine';
import type { ConjugationPart, FrenchConjugationOptions } from 'conjugation-engine';
import { formAt } from './forms';
import type { FrForm, VerbForms } from './forms';

/** A deliberately wrong answer and the Dutch name of the mistake it represents. */
export interface Mistake {
  readonly text: string;
  readonly label: string;
}

const FUTURE_ENDINGS = ['ai', 'as', 'a', 'ons', 'ez', 'ont'];
const IMPERFECT_ENDINGS = ['ais', 'ais', 'ait', 'ions', 'iez', 'aient'];
const SLOT_INDEX: Readonly<Record<string, number>> = { '1s': 0, '2s': 1, '3s': 2, '1p': 3, '2p': 4, '3p': 5 };

/** Typical ending slips, tried in order on the conjugated verb itself. */
const ENDING_SLIPS: readonly (readonly [RegExp, string])[] = [
  [/x$/, 's'], [/ent$/, 'ont'], [/ont$/, 'ent'], [/ons$/, 'ont'], [/ez$/, 'é'], [/ais$/, 'ait'],
  [/ait$/, 'ais'], [/er$/, 'é'], [/s$/, 't'], [/t$/, 's'], [/ai$/, 'é'], [/e$/, 'es'],
  [/é$/, 'er'], [/i$/, 'it'], [/u$/, 'ue'],
];

const isLexical = (part: ConjugationPart): boolean => part.role === 'lexicalVerb';
const isAuxiliary = (part: ConjugationPart): boolean =>
  part.role === 'auxiliary' && (part.lemma === 'avoir' || part.lemma === 'être');

/** Re-render recombined engine parts the way a card shows them. */
function render(target: FrForm, parts: readonly ConjugationPart[], bare = false): string {
  const text = renderParts('fr', parts, { bare });
  return target.tense.mood === 'imperative' ? `${text} !` : text;
}

/** Replace one part's text, recomputing its onset so elision ("j'", "qu'") follows the new word. */
function swap(parts: readonly ConjugationPart[], index: number, text: string): ConjugationPart[] {
  const onset = /^h/i.test(text) ? 'muteH' : /^[aeiouyàâäéèêëîïôöùûüœæ]/i.test(text) ? 'vowel' : 'consonant';
  return parts.map((part, at) => at === index ? { ...part, text, phonology: { onset } } : part);
}

/** The same auxiliary slot, but conjugated from the other auxiliary verb. */
function otherAuxiliary(auxiliary: ConjugationPart): ConjugationPart | null {
  const { mood, tense, person, number } = auxiliary.features;
  if (!mood || !tense) return null;
  try {
    const query = {
      language: 'fr', infinitive: auxiliary.lemma === 'avoir' ? 'être' : 'avoir', mood, tense,
      ...(person && number ? { person, number, gender: 'masculine' } : {}),
    } as FrenchConjugationOptions;
    const forms = conjugate(query).forms;
    const verb = (forms.find(form => form.preferred) ?? forms[0])?.parts.find(isLexical);
    return verb ? { ...verb, role: 'auxiliary' } : null;
  } catch {
    return null;
  }
}

/**
 * Plausible wrong answers for one target form. They are produced by recombining
 * or editing the engine's own grammatical parts, so elision and spacing stay
 * natural ("j'ai allé", "que je suis"). conjugation-engine itself never emits
 * wrong forms; that is this module's job.
 */
export function mistakes(forms: VerbForms, target: FrForm): Mistake[] {
  const out: Mistake[] = [];
  const parts = target.form.parts;
  const id = target.tense.id;
  const lexicalAt = parts.findLastIndex(isLexical);
  const lexical = parts[lexicalAt];
  const auxiliaryAt = parts.findIndex(isAuxiliary);
  const auxiliary = parts[auxiliaryAt];
  const infinitive = formAt(forms, 'infinitive.present', '-')?.form.parts.find(isLexical)?.text;
  const participle = formAt(forms, 'participle.past', '-')?.form.parts.find(isLexical)?.text;
  const compound = lexical?.features.verbForm === 'pastParticiple' && auxiliary !== undefined;

  if (compound && auxiliary) {
    const other = otherAuxiliary(auxiliary);
    if (other) out.push({ text: render(target, parts.map((part, at) => at === auxiliaryAt ? other : part)), label: 'verkeerd hulpwerkwoord' });
    if (infinitive && infinitive !== lexical.text) {
      out.push({ text: render(target, swap(parts, lexicalAt, infinitive)), label: 'infinitief in plaats van deelwoord' });
    }
  }

  if (lexical && infinitive && (id === 'indicative.future' || id === 'conditional.present')) {
    const ending = (id === 'indicative.future' ? FUTURE_ENDINGS : IMPERFECT_ENDINGS)[SLOT_INDEX[target.slot] ?? -1];
    if (ending && lexical.text.endsWith(ending)) {
      const regular = (infinitive.endsWith('e') ? infinitive.slice(0, -1) : infinitive) + ending;
      if (regular !== lexical.text) out.push({ text: render(target, swap(parts, lexicalAt, regular)), label: 'verkeerde stam' });
    }
  }

  if (id === 'subjunctive.present') {
    const marker = parts.find(part => part.role === 'moodMarker');
    const indicative = formAt(forms, 'indicative.present', target.slot);
    if (marker && indicative) out.push({ text: render(target, [marker, ...indicative.form.parts]), label: 'indicatief na que' });
  }

  if (lexical && participle && (id === 'indicative.near_future' || id === 'indicative.recent_past') && participle !== lexical.text) {
    out.push({ text: render(target, swap(parts, lexicalAt, participle)), label: 'deelwoord in plaats van infinitief' });
  }

  if (target.tense.mood === 'imperative' && !compound) {
    for (const [tenseId, label] of [
      ['indicative.present', 'présent zonder onderwerp'], ['subjunctive.present', 'subjonctif zonder onderwerp'],
      ['indicative.future', 'futur zonder onderwerp'], ['indicative.imperfect', 'imparfait zonder onderwerp'],
    ] as const) {
      const source = formAt(forms, tenseId, target.slot);
      if (source) out.push({ text: render(target, source.form.parts, true), label });
    }
    const present = formAt(forms, 'indicative.present', target.slot);
    if (present) out.push({ text: `${present.text} !`, label: 'met onderwerp: geen gebiedende wijs' });
  }

  const stripped = target.text.normalize('NFD').replace(/[̀-ͯ]/g, '').normalize('NFC');
  if (stripped !== target.text) out.push({ text: stripped, label: 'accent vergeten' });

  if (lexical) {
    let found = 0;
    for (const [pattern, replacement] of ENDING_SLIPS) {
      const match = pattern.exec(lexical.text);
      // Leave very short words alone: "ont" → "ent" is noise, not a plausible slip.
      if (!match || lexical.text.length - match[0].length < 2) continue;
      out.push({ text: render(target, swap(parts, lexicalAt, lexical.text.replace(pattern, replacement))), label: 'verkeerde uitgang' });
      if (++found === 3) break;
    }
  }

  return out.filter(mistake => !target.accepted.includes(mistake.text));
}
