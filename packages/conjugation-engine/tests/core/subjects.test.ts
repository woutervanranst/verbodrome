import { describe, expect, it } from 'vitest';
import { createEngine } from '../../src/core/engine.js';
import type { LanguagePack, SubjectSlot } from '../../src/core/pack.js';
import { stagedEngine } from '../../src/core/staged.js';
import { resolvedTargetKey, targetKey } from '../../src/core/target.js';
import { getSubjects } from '../../src/index.js';
import { packs } from '../../src/languages/index.js';
import type { ConjugatedForm, ResolvedTarget } from '../../src/types.js';
import { toyCatalogue, toyGrammar, toyPack, toyRendering, toySubjects } from '../toy/pack.js';

const toy = createEngine({ xx: toyPack });
const present = { language: 'xx', infinitive: 'placa', mood: 'indicative', tense: 'present', voice: 'active' } as const;

function slot(id: string): SubjectSlot {
  const found = toySubjects.find(subject => subject.id === id);
  if (!found) throw new Error(`No toy slot ${id}.`);
  return found;
}

const invalid = (code: string, message?: unknown) => expect.objectContaining({ code, ...(message === undefined ? {} : { message }) });
const summary = (form: ConjugatedForm) => [form.text, form.target.subject, form.preferred];

describe('subject slots', () => {
  it('expands default slots only', () => {
    const forms = toy.conjugate(present).forms;
    expect(forms.map(form => form.text)).toEqual(['mi placo', 'tu placas', 'il placat', 'nos placamos', 'vos plaquetes', 'ils placant']);
    expect(forms.map(form => form.target.subject)).toEqual(['1sg', '2sg', '3sg', '1pl', '2pl', '3pl']);
    expect(forms.map(form => form.parts[0]!.text)).toEqual(['mi', 'tu', 'il', 'nos', 'vos', 'ils']);
    // il is masculine, but without genderedTargets a slot's gender stays off the target.
    expect(forms.every(form => form.target.gender === null)).toBe(true);
    const { voice: _, ...bothVoices } = present;
    expect(toy.expandTargets(bothVoices).map(target => `${target.voice} ${target.subject}`)).toEqual([
      'active 1sg', 'active 2sg', 'active 3sg', 'active 1pl', 'active 2pl', 'active 3pl',
      'passive 1sg', 'passive 2sg', 'passive 3sg', 'passive 1pl', 'passive 2pl', 'passive 3pl',
    ]);
  });

  it('returns a non-default slot on request', () => {
    const [form, ...rest] = toy.conjugate({ ...present, subject: '3sg.f' }).forms;
    expect(rest).toEqual([]);
    expect(form!.text).toBe('ila placat');
    expect(form!.target).toEqual({ mood: 'indicative', tense: 'present', person: 3, number: 'singular', gender: null, agreement: null, voice: 'active', subject: '3sg.f' });
    expect(form!.parts[0]!.features).toMatchObject({ person: 3, number: 'singular', gender: 'feminine' });

    const gendered = createEngine({ xx: { ...toyPack, genderedTargets: true } });
    expect(gendered.conjugate({ ...present, subject: '3sg.f' }).forms.map(f => [f.text, f.target.gender])).toEqual([['ila placat', 'feminine']]);
    // Default slots carry their gender too; a slot without one stays null.
    expect(gendered.conjugate({ ...present, number: 'singular' }).forms.map(f => [f.text, f.target.gender])).toEqual([
      ['mi placo', null], ['tu placas', null], ['il placat', 'masculine'],
    ]);
  });

  it('conjugates a formal slot with the person it governs', () => {
    const forms = toy.conjugate({ ...present, subject: '2sg.formal' }).forms;
    expect(forms.map(form => [form.text, form.target.person, form.target.number, form.target.subject]))
      .toEqual([['Vu placat', 3, 'singular', '2sg.formal']]);
    // The person and number filters select the verb's person, not the one the slot addresses.
    expect(toy.conjugate({ ...present, subject: '2sg.formal', person: 3 }).forms.map(form => form.text)).toEqual(['Vu placat']);
    expect(() => toy.conjugate({ ...present, subject: '2sg.formal', person: 2 })).toThrow(invalid('INVALID_TARGET'));
  });

  it('rejects an unknown subject and a subject on a pack without slots', () => {
    expect(() => toy.conjugate({ ...present, subject: '4sg' })).toThrow(invalid('INVALID_REQUEST', 'Invalid subject: 4sg.'));
    const legacy = createEngine(packs);
    expect(() => legacy.conjugate({ language: 'fr', infinitive: 'aimer', subject: '1sg' }))
      .toThrow(invalid('INVALID_REQUEST', 'Unknown fr option: subject.'));
    expect(() => legacy.conjugate({ language: 'nl', infinitive: 'werken', subject: '1sg' }))
      .toThrow(invalid('INVALID_REQUEST', 'Unknown nl option: subject.'));
  });

  it('rejects a subject the tense does not have', () => {
    const imperative = { language: 'xx', infinitive: 'placa', mood: 'imperative', tense: 'present' } as const;
    // The toy imperative has only 2sg, and the toy clause gives it no subject pronoun.
    const forms = toy.conjugate(imperative).forms;
    expect(forms.map(form => [form.text, form.target.subject, form.parts.map(part => part.role)])).toEqual([['plaque', '2sg', ['lexicalVerb']]]);
    expect(() => toy.conjugate({ ...imperative, subject: '2sg.formal' })).toThrow(invalid('INVALID_TARGET'));
  });

  it('keeps legacy targets structurally unchanged', () => {
    const legacy = createEngine(packs);
    for (const [language, infinitive] of [['fr', 'aimer'], ['nl', 'werken']] as const) {
      const targets = legacy.expandTargets({ language, infinitive });
      expect(targets.some(target => Object.hasOwn(target, 'subject'))).toBe(false);
      const finite = targets.find(target => target.person !== null)!;
      expect(Object.keys(finite)).toEqual(['mood', 'tense', 'person', 'number', 'gender', 'agreement']);
      const query = { language, infinitive, mood: 'indicative', tense: 'present', person: 1, number: 'singular' };
      expect(Object.hasOwn(legacy.conjugate(query).forms[0]!.target, 'subject')).toBe(false);
      expect(legacy.getSubjects(language)).toEqual([]);
    }
  });

  it('asking for a subject excludes entries without one', () => {
    const targets = toy.expandTargets({ language: 'xx', infinitive: 'placa', subject: '3sg.f' });
    expect(targets.every(target => target.subject === '3sg.f' && target.person === 3)).toBe(true);
    expect(targets.map(target => `${target.mood}/${target.tense}`)).toEqual([
      'indicative/present', 'indicative/present', 'indicative/past', 'indicative/perfect', 'indicative/perfect',
      'indicative/future', 'indicative/simple_past', 'conditional/past',
    ]);
    const unfiltered = toy.expandTargets({ language: 'xx', infinitive: 'placa', mood: 'participle' });
    expect(unfiltered.map(target => Object.hasOwn(target, 'subject'))).toEqual([false, false]);
  });

  it('orders the slots of one person by the pack\'s subjects and ranks each slot as its own target', () => {
    const everyDefault = createEngine({ xx: { ...toyPack, subjects: toySubjects.map(subject => ({ ...subject, default: true })) } });
    // grapha has a rectified and a traditional spelling: each slot keeps both and prefers its own rectified form.
    const forms = everyDefault.conjugate({ ...present, infinitive: 'grapha', person: 3, number: 'singular' }).forms;
    expect(forms.map(summary)).toEqual([
      ['il grafat', '3sg', true], ['il graphat', '3sg', false],
      ['ila grafat', '3sg.f', true], ['ila graphat', '3sg.f', false],
      ['Vu grafat', '2sg.formal', true], ['Vu graphat', '2sg.formal', false],
    ]);
    expect(new Set(forms.map(form => resolvedTargetKey(form.target))).size).toBe(3);
  });

  it('lets a pack choose the slots through subjectsFor, then applies person and number', () => {
    const queries: unknown[] = [];
    const chosen: LanguagePack = {
      ...toyPack,
      subjectsFor(query) {
        queries.push(query.infinitive);
        return [slot('2sg.formal'), slot('3sg.f'), slot('1pl')];
      },
    };
    const engine = createEngine({ xx: chosen });
    expect(engine.conjugate(present).forms.map(form => form.text)).toEqual(['ila placat', 'Vu placat', 'nos placamos']);
    expect(engine.conjugate({ ...present, person: 3 }).forms.map(form => form.text)).toEqual(['ila placat', 'Vu placat']);
    expect(() => engine.conjugate({ ...present, number: 'plural', person: 3 })).toThrow(invalid('INVALID_TARGET'));
    expect(queries.every(infinitive => infinitive === 'placa')).toBe(true);
  });

  it('gives the clause the slot the core resolved, and fails when generate is given another', () => {
    const engine = stagedEngine(toyGrammar, toyRendering, present);
    const target: ResolvedTarget = { mood: 'indicative', tense: 'present', person: 3, number: 'singular', gender: null, agreement: null, voice: 'active', subject: '3sg.f' };
    expect(engine.generate(target, slot('3sg.f')).forms.map(form => form.parts.map(part => part.text))).toEqual([['ila', 'placat']]);
    for (const given of [undefined, null, slot('3sg')]) {
      expect(() => engine.generate(target, given)).toThrow(invalid('GENERATION_FAILURE', expect.stringContaining('3sg.f')));
    }
  });

  it('lists a language\'s slots', () => {
    expect(toy.getSubjects('xx')).toBe(toySubjects);
    expect(toySubjects.filter(subject => subject.default).map(subject => subject.pronoun)).toEqual(['mi', 'tu', 'il', 'nos', 'vos', 'ils']);
    expect(getSubjects('fr')).toEqual([]);
    expect(getSubjects('nl')).toEqual([]);
    expect(() => toy.getSubjects('zz')).toThrow(invalid('UNSUPPORTED_LANGUAGE'));
  });

  it('rejects a pack that declares one slot id twice', () => {
    expect(() => createEngine({ xx: { ...toyPack, subjects: [...toySubjects, { ...slot('3sg.f'), pronoun: 'ela' }] } }))
      .toThrow(invalid('INVALID_REQUEST', 'The xx pack declares the subject 3sg.f twice.'));
  });
});

describe('catalogue entries that restrict their slots', () => {
  const imperative = { language: 'xx', infinitive: 'placa', mood: 'imperative', tense: 'present' } as const;
  /** Every slot is a default one, so only `slots` decides which ones an entry has. */
  const everyDefault = toySubjects.map(subject => ({ ...subject, default: true }));
  const restricted = (slots: readonly string[]): LanguagePack => ({
    ...toyPack,
    subjects: everyDefault,
    catalogue: toyCatalogue.map(entry => entry.mood === 'imperative' ? { ...entry, slots } : entry),
  });

  it('expands exactly the listed slots, each with its own person and number', () => {
    const engine = createEngine({ xx: restricted(['2sg.formal', '2pl']) });
    const targets = engine.expandTargets(imperative);
    // 2sg.formal governs the 3sg, and the default 3sg slot of the same person and number is not listed, so it is not there.
    // The entry's own persons (2sg only) are ignored, and the order is the pack's.
    expect(targets.map(target => [target.subject, target.person, target.number])).toEqual([
      ['2sg.formal', 3, 'singular'], ['2pl', 2, 'plural'],
    ]);
    expect(engine.conjugate(imperative).forms.map(form => [form.text, form.target.subject])).toEqual([['plaque', '2sg.formal'], ['plaque', '2pl']]);
    // The person and number filters still apply, to the slot's own person and number.
    expect(engine.expandTargets({ ...imperative, person: 3 }).map(target => target.subject)).toEqual(['2sg.formal']);
    expect(() => engine.expandTargets({ ...imperative, person: 2, number: 'singular' })).toThrow(invalid('INVALID_TARGET'));
  });

  it('lists only the slots the query selects', () => {
    // 2sg.formal is not a default slot of the toy, so a query without a subject does not select it.
    const engine = createEngine({ xx: { ...restricted(['2sg.formal', '2pl']), subjects: toySubjects } });
    expect(engine.expandTargets(imperative).map(target => target.subject)).toEqual(['2pl']);
    expect(engine.expandTargets({ ...imperative, subject: '2sg.formal' }).map(target => target.subject)).toEqual(['2sg.formal']);
  });

  it('leaves entries without slots as they are, and the toy imperative lists its slot', () => {
    expect(toyCatalogue.find(entry => entry.mood === 'imperative')!.slots).toEqual(['2sg']);
    expect(toy.expandTargets(imperative).map(target => target.subject)).toEqual(['2sg']);
    expect(toy.expandTargets({ language: 'xx', infinitive: 'placa', mood: 'indicative', tense: 'past' }).map(target => target.subject))
      .toEqual(['1sg', '2sg', '3sg', '1pl', '2pl', '3pl']);
  });

  it('rejects an entry that lists a slot the pack does not declare', () => {
    expect(() => createEngine({ xx: restricted(['2sg', 'du']) }))
      .toThrow(invalid('INVALID_REQUEST', 'The xx pack lists the subject slot du in imperative/present, but does not declare it.'));
    expect(() => createEngine({ xx: { ...restricted(['2sg']), subjects: [] } }))
      .toThrow(invalid('INVALID_REQUEST', 'The xx pack lists the subject slot 2sg in imperative/present, but does not declare it.'));
  });
});

describe('subject slots the core cannot trust', () => {
  it('fails when subjectsFor returns a slot the pack does not declare', () => {
    const ghost: SubjectSlot = { ...slot('3sg'), id: 'ghost' };
    const engine = createEngine({ xx: { ...toyPack, subjectsFor: () => [slot('3sg'), ghost] } });
    expect(() => engine.conjugate(present)).toThrow(invalid('GENERATION_FAILURE', expect.stringMatching(/ghost.*xx|xx.*ghost/u)));
    expect(() => engine.expandTargets(present)).toThrow(invalid('GENERATION_FAILURE'));
  });

  it.each(['active', 'passive', 'a/b', '/'])('rejects a slot id that would collide with another target-key segment: %s', id => {
    expect(() => createEngine({ xx: { ...toyPack, subjects: [...toySubjects, { ...slot('3sg.f'), id }] } }))
      .toThrow(invalid('INVALID_REQUEST', expect.stringContaining(`"${id}"`)));
  });
});

describe('target keys with a subject', () => {
  const base: ResolvedTarget = { mood: 'indicative', tense: 'present', person: 3, number: 'singular', gender: null, agreement: null };

  it('include the subject id when present and keep keys without it unchanged', () => {
    expect(targetKey(base)).toBe('indicative/present/3/singular');
    expect(targetKey({ ...base, subject: '3sg.f' })).toBe('indicative/present/3/singular/3sg.f');
    expect(targetKey({ ...base, voice: 'active', subject: '3sg.f' })).toBe('indicative/present/3/singular/active/3sg.f');
    expect(resolvedTargetKey(base)).toBe('["indicative","present",3,"singular",null,null,null]');
    expect(resolvedTargetKey({ ...base, subject: '3sg.f' })).toBe('["indicative","present",3,"singular",null,null,null,{"subject":"3sg.f"}]');
    expect(resolvedTargetKey({ ...base, subject: '3sg.f' })).not.toBe(resolvedTargetKey({ ...base, subject: '2sg.formal' }));
  });
});
