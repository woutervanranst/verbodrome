/**
 * Dutch forms from the staged grammar, step by step: endings and 't kofschip, ge- and its exceptions, a compound tense,
 * the forms after the verb, particles, reflexive pronouns, the formal u, wezen, the hebben/zijn condition and the forms
 * that do not exist. The shadow test checks every snapshot query's output; this file pins how the forms are explained.
 */
import { describe, expect, it } from 'vitest';
import type { DerivationStep } from '../../src/core/derivation.js';
import { dutchExceptions } from '../../src/languages/nl/lexicon.js';
import type { ConjugatedForm, ConjugationResult } from '../../src/types.js';
import { shadowDutch } from './shadow-engine.js';

function conjugate(infinitive: string, options: Readonly<Record<string, unknown>> = {}): ConjugationResult {
  return shadowDutch.conjugate({ language: 'nl', infinitive, ...options });
}

/** The forms of one mood, tense, person and number. */
function cell(infinitive: string, mood: string, tense: string, person: number | null, number: string | null, options: Readonly<Record<string, unknown>> = {}): ConjugatedForm[] {
  return conjugate(infinitive, { mood, tense, ...(person === null ? {} : { person, number }), ...options }).forms as ConjugatedForm[];
}

const rules = (steps: readonly DerivationStep[] | undefined): string[] => (steps ?? []).map(s => s.rule);
/** Each part's rule ids, and the form's own (`form`). */
const explained = (form: ConjugatedForm): Record<string, string[]> => ({
  ...Object.fromEntries(form.parts.map(part => [part.text, rules(part.steps)])), form: rules(form.steps),
});
const english = (form: ConjugatedForm): string[] => shadowDutch.explain('nl', form, 'en').sections.flatMap(section => section.steps.map(s => s.text));
const texts = (forms: readonly ConjugatedForm[]): string[] => forms.map(form => form.text);

describe('Dutch endings and spelling', () => {
  it('ik werkte: a weak past tense in -te after a sound of \'t kofschip', () => {
    const [form] = cell('werken', 'indicative', 'past', 1, 'singular');
    expect(form!.text).toBe('ik werkte');
    expect(explained(form!)).toEqual({ ik: [], werkte: ['nl.stem.drop-en', 'nl.end.past-weak', 'nl.orth.dental-kofschip'], form: ['nl.clause.subject'] });
    expect(english(form!)).toContain("k is one of the sounds of 't kofschip (t, k, f, s, ch, p), so the ending starts with t: werkte.");
  });

  it('ik leefde: -de after the v of leven, although the stem is written leef', () => {
    const [form] = cell('leven', 'indicative', 'past', 1, 'singular');
    expect(form!.text).toBe('ik leefde');
    expect(explained(form!).leefde).toEqual([
      'nl.stem.drop-en', 'nl.stem.lengthen-vowel', 'nl.stem.devoice', 'nl.end.past-weak', 'nl.orth.dental-kofschip',
    ]);
    expect(english(form!)).toContain("v is not one of the sounds of 't kofschip (t, k, f, s, ch, p), so the ending starts with d: leefde.");
  });

  it('gewerkt: ge-, the stem and the d or t of the past tense', () => {
    const [form] = cell('werken', 'participle', 'past', null, null);
    expect(form!.text).toBe('gewerkt');
    expect(explained(form!).gewerkt).toEqual(['nl.stem.drop-en', 'nl.part.weak', 'nl.orth.dental-kofschip', 'nl.part.ge-prefix']);
  });

  it('verhuisd: no ge- after an unstressed prefix', () => {
    const [form] = cell('verhuizen', 'participle', 'past', null, null, { inseparablePrefix: 'ver' });
    expect(form!.text).toBe('verhuisd');
    // ge-blocked shows the whole participle, so no separate step attaches the prefix.
    expect(explained(form!).verhuisd).toEqual(['nl.stem.drop-en', 'nl.stem.devoice', 'nl.part.weak', 'nl.orth.dental-kofschip', 'nl.part.ge-blocked']);
    expect(english(form!)).toContain('After the prefix ver- the past participle has no ge-: verhuisd.');
  });

  it('geëindigd: a diaeresis after ge- before e', () => {
    const [form] = cell('eindigen', 'participle', 'past', null, null);
    expect(form!.text).toBe('geëindigd');
    expect(explained(form!).geëindigd).toEqual(['nl.stem.drop-en', 'nl.part.weak', 'nl.orth.dental-kofschip', 'nl.part.ge-diaeresis']);
  });

  it('gaat: a long a before -t is written aa; zet: no second t', () => {
    expect(explained(cell('gaan', 'indicative', 'present', 3, 'singular')[0]!).gaat).toEqual(['nl.stem.lexical', 'nl.end.present', 'nl.orth.double-a']);
    expect(explained(cell('zetten', 'indicative', 'present', 3, 'singular')[0]!).zet).toEqual(['nl.stem.drop-en', 'nl.stem.undouble-consonant', 'nl.end.present-t-drop']);
    expect(texts(cell('zetten', 'participle', 'past', null, null))).toEqual(['gezet']);
  });

  it('builds strong pasts from the lexicon and the plural from the singular', () => {
    const [singular] = cell('lopen', 'indicative', 'past', 1, 'singular');
    expect(explained(singular!).liep).toEqual(['nl.end.past-strong']);
    const [plural] = cell('geven', 'indicative', 'past', 1, 'plural');
    expect(plural!.text).toBe('wij gaven');
    expect(explained(plural!).gaven).toEqual(['nl.end.past-strong', 'nl.end.past-plural-strong']);
    // jagen has a strong and a weak past: the strong one first.
    expect(texts(cell('jagen', 'indicative', 'past', 1, 'singular'))).toEqual(['ik joeg', 'ik jaagde']);
  });
});

describe('Dutch compound tenses', () => {
  it('ik heb gewerkt: the auxiliary part has its own steps, the form has the periphrasis step', () => {
    const [form] = cell('werken', 'indicative', 'perfect', 1, 'singular');
    expect(form!.text).toBe('ik heb gewerkt');
    expect(explained(form!)).toEqual({
      ik: [],
      heb: ['nl.stem.drop-en', 'nl.stem.undouble-consonant', 'nl.end.present'],
      gewerkt: ['nl.stem.drop-en', 'nl.part.weak', 'nl.orth.dental-kofschip', 'nl.part.ge-prefix'],
      form: ['nl.periphrasis.perfect', 'nl.clause.subject'],
    });
    expect(form!.variant.auxiliary).toBe('hebben');
    expect(english(form!)).toContain('Present perfect: the present tense of hebben + the past participle.');
  });

  it('reports zullen for the future and conditional, the perfect auxiliary for their perfect forms', () => {
    const auxiliary = (tense: string, mood = 'indicative') => cell('gaan', mood, tense, 1, 'singular')[0]!.variant.auxiliary;
    expect([auxiliary('future'), auxiliary('future_perfect'), auxiliary('present', 'conditional'), auxiliary('past', 'conditional')])
      .toEqual(['zullen', 'zijn', 'zullen', 'zijn']);
  });

  it('gives zijn the spoken infinitive wezen, labelled as such, right after zijn', () => {
    const forms = cell('gaan', 'indicative', 'future_perfect', 2, 'singular');
    expect(forms.map(form => [form.text, form.variant.condition])).toEqual([
      ['jij zult gegaan zijn', null], ['jij zult gegaan wezen', 'Spoken infinitive alternative to zijn.'],
      ['jij zal gegaan zijn', null], ['jij zal gegaan wezen', 'Spoken infinitive alternative to zijn.'],
    ]);
    expect(cell('zijn', 'infinitive', 'present', null, null).map(form => [form.text, form.variant.condition]))
      .toEqual([['zijn', null], ['wezen', 'Spoken infinitive alternative to zijn.']]);
  });

  it('labels the compound forms of a verb that takes hebben and zijn, except the wezen form', () => {
    const forms = cell('lopen', 'indicative', 'future_perfect', 1, 'singular');
    const choice = 'Auxiliary choice depends on transitivity, movement or change of state.';
    expect(forms.map(form => [form.text, form.variant.auxiliary, form.variant.condition])).toEqual([
      ['ik zal gelopen hebben', 'hebben', choice],
      ['ik zal gelopen zijn', 'zijn', choice],
      ['ik zal gelopen wezen', 'zijn', 'Spoken infinitive alternative to zijn.'],
    ]);
    expect(cell('lopen', 'indicative', 'present', 1, 'singular')[0]!.variant.condition).toBeNull();
  });
});

describe('Dutch clause', () => {
  it('werk jij: without -t when jij follows the verb', () => {
    const [form] = cell('werken', 'indicative', 'present', 2, 'singular', { inversion: true });
    expect(form!.text).toBe('werk jij');
    expect(explained(form!)).toEqual({ werk: ['nl.stem.drop-en', 'nl.end.inversion-t-drop'], jij: [], form: ['nl.clause.subject', 'nl.clause.inversion'] });
    expect(texts(cell('werken', 'indicative', 'present', 2, 'singular'))).toEqual(['jij werkt']);
    // u keeps its -t after the verb.
    expect(texts(cell('werken', 'indicative', 'present', 2, 'singular', { inversion: true, pronoun: 'u' }))).toEqual(['werkt u']);
    // houden after the verb also has the spoken short form.
    expect(texts(cell('houden', 'indicative', 'present', 2, 'singular', { inversion: true }))).toEqual(['houd jij', 'hou jij']);
  });

  it('ik sta op / opgestaan: the separable part goes to the end, or onto the participle', () => {
    const [present] = cell('opstaan', 'indicative', 'present', 1, 'singular');
    expect(present!.text).toBe('ik sta op');
    expect(present!.parts.map(part => part.role)).toEqual(['subject', 'lexicalVerb', 'particle']);
    expect(explained(present!)).toEqual({ ik: [], sta: ['nl.stem.lexical', 'nl.end.present'], op: [], form: ['nl.clause.subject', 'nl.clause.particle-final'] });
    const [participle] = cell('opstaan', 'participle', 'past', null, null);
    expect(participle!.text).toBe('opgestaan');
    expect(explained(participle!).opgestaan).toEqual(['nl.part.strong', 'nl.clause.particle-attached']);
    expect(texts(cell('opstaan', 'indicative', 'perfect', 1, 'singular'))).toEqual(['ik ben opgestaan']);
    expect(texts(cell('verwerken', 'indicative', 'present', 1, 'singular'))).toEqual(['ik verwerk']);
  });

  it('zich vergissen with inversion: the reflexive pronoun after the verb and the subject', () => {
    const result = conjugate('vergissen', { inversion: true });
    const at = (mood: string, tense: string, person: number, number: string) => result.forms
      .filter(form => form.target.mood === mood && form.target.tense === tense && form.target.person === person && form.target.number === number)
      .map(form => `${form.text} ${form.parts.map(part => part.role).join(',')}`);
    // As in the frozen snapshot.
    expect(at('indicative', 'present', 2, 'singular')).toEqual(['vergis jij je lexicalVerb,subject,reflexivePronoun']);
    expect(at('indicative', 'present', 3, 'singular')).toEqual(['vergist hij zich lexicalVerb,subject,reflexivePronoun']);
    expect(at('indicative', 'perfect', 2, 'singular')).toEqual(['heb jij je vergist auxiliary,subject,reflexivePronoun,lexicalVerb']);
    expect(at('indicative', 'future_perfect', 2, 'singular')).toEqual([
      'zul jij je vergist hebben auxiliary,subject,reflexivePronoun,lexicalVerb,auxiliary',
      'zal jij je vergist hebben auxiliary,subject,reflexivePronoun,lexicalVerb,auxiliary',
    ]);
    const vergis = result.forms.find(form => form.text === 'vergis jij je')!;
    expect(vergis.steps!.map(s => s.rule)).toEqual(['nl.clause.subject', 'nl.clause.inversion', 'nl.clause.reflexive']);
    expect(texts(cell('vergissen', 'infinitive', 'present', null, null))).toEqual(['zich vergissen']);
    const [participle] = cell('vergissen', 'participle', 'past', null, null);
    expect(participle!.text).toBe('vergist');
    expect(participle!.steps).toEqual([]);
  });

  it('gives an impersonal verb het as its subject unless the query names one', () => {
    expect(texts(cell('spijten', 'indicative', 'present', 3, 'singular'))).toEqual(['het spijt']);
    expect(texts(cell('spijten', 'indicative', 'present', 3, 'plural'))).toEqual(['zij spijten']);
    expect(texts(cell('regenen', 'indicative', 'present', 3, 'singular'))).toEqual(['hij regent']);
  });

  it('gives u the formal forms, in the order of the auxiliary first', () => {
    expect(texts(cell('hebben', 'indicative', 'present', 2, 'singular', { pronoun: 'u' }))).toEqual(['u hebt', 'u heeft']);
    expect(texts(cell('hebben', 'indicative', 'present', 2, 'singular'))).toEqual(['jij hebt']);
    expect(texts(cell('hoeven', 'indicative', 'perfect', 2, 'singular', { pronoun: 'u' }))).toEqual([
      'u hebt gehoefd', 'u hebt gehoeven', 'u heeft gehoefd', 'u heeft gehoeven',
    ]);
    expect(texts(cell('vergissen', 'imperative', 'present', 2, 'singular', { pronoun: 'u' }))).toEqual(['vergis u']);
  });

  it('lists the formal forms of a verb after its plain 2nd person singular forms', () => {
    // The clause keeps the plain forms and the extra formal ones for u: the lexicon must list the plain ones first.
    for (const [lemma, entry] of Object.entries(dutchExceptions).filter(([, item]) => item.formalPresent)) {
      const plain = cell(lemma, 'indicative', 'present', 2, 'singular').map(form => form.parts.at(-1)!.text);
      expect(entry.formalPresent!.slice(0, plain.length), lemma).toEqual(plain);
    }
  });
});

describe('Dutch forms that do not exist', () => {
  const unavailable = (infinitive: string, options: Readonly<Record<string, unknown>>) => conjugate(infinitive, options).unavailableTargets;

  it.each([
    ['spijten', { mood: 'indicative', tense: 'present', person: 1, number: 'singular' }, 'impersonal', 'nl.avail.impersonal', 'spijten has no modern indicative/present form in this slot.'],
    ['vriezen', { mood: 'indicative', tense: 'past', person: 3, number: 'plural' }, 'impersonal', 'nl.avail.singular-only', 'vriezen has no modern indicative/past form in this slot.'],
    ['kunnen', { mood: 'imperative' }, 'noImperative', 'nl.avail.no-imperative', 'kunnen has no modern imperative/present form in this slot.'],
    ['zullen', { mood: 'indicative', tense: 'perfect', person: 1, number: 'singular' }, 'defective', 'nl.avail.no-compound', 'zullen has no modern indicative/perfect form in this slot.'],
    // zullen has no imperative either: the later reason, defective, is the one given.
    ['zullen', { mood: 'imperative', person: 2, number: 'singular' }, 'defective', 'nl.avail.no-compound', 'zullen has no modern imperative/present form in this slot.'],
  ])('%s %j: %s', (infinitive, options, reason, rule, explanation) => {
    const [first] = unavailable(infinitive, options);
    expect(first).toMatchObject({ reason, explanation, source: 'https://e-ans.ivdnt.org/topics/pid/ans0203lingtopic' });
    expect(first!.step!.rule).toBe(rule);
  });

  it('keeps the personal forms of a personal derivative of an impersonal verb', () => {
    expect(unavailable('bevriezen', {})).toEqual([]);
    expect(texts(cell('bevriezen', 'indicative', 'present', 1, 'plural'))).toEqual(['wij bevriezen']);
  });
});
