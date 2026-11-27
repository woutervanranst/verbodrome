import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { formLabel, targetLabel, unavailableLine } from '../src/cli-labels.js';
import { createEngine } from '../src/core/engine.js';
import { locales } from '../src/i18n/locales/index.js';
import { conjugate, explain } from '../src/index.js';
import type { ConjugatedForm, ConjugationResult, ResolvedTarget } from '../src/index.js';
import { en as toyEn, nl as toyNl } from './toy/messages.js';
import { toyPack } from './toy/pack.js';

const cli = fileURLToPath(new URL('../dist/cli.js', import.meta.url));
const exact = ['fr', 'aimer', '--mood', 'indicative', '--tense', 'present', '--person', '1', '--number', 'plural'];

function run(args: readonly string[]) {
  const result = spawnSync(process.execPath, [cli, ...args], { encoding: 'utf8', timeout: 10_000 });
  if (result.error) throw result.error;
  expect(result.signal).toBeNull();
  return result;
}

describe('compiled CLI', () => {
  it('prints only the preferred phrase for one target', () => {
    const result = run(exact);
    expect(result.status).toBe(0);
    expect(result.stdout).toBe('nous aimons\n');
    expect(result.stderr).toBe('');
    expect(run(['fr', 'payer', '--mood', 'indicative', '--tense', 'present', '--person', '1', '--number', 'singular']).stdout).toBe('je paie\n');
  });

  it('labels every wildcard target and retains accepted alternatives', () => {
    const result = run(['fr', 'payer', '--mood', 'indicative', '--tense', 'present', '--gender', 'masculine']);
    expect(result.status).toBe(0);
    expect(result.stderr).toBe('');
    expect(result.stdout.trim().split('\n')).toHaveLength(12);
    expect(result.stdout).toContain('Indicatif / Présent / 1 singular / y-to-i / 1sg: je paie');
    expect(result.stdout).toContain('Indicatif / Présent / 1 singular / keep-y / 1sg: je paye');
    expect(result.stdout).toContain('Indicatif / Présent / 1 plural / y-to-i / 1pl: nous payons');
    expect(result.stdout).toContain('Indicatif / Présent / 3 singular / masculine / y-to-i / 3sg: il paie');
  });

  it('returns the complete JSON result without diagnostic noise', () => {
    const result = run([...exact, '--json']);
    expect(result.status).toBe(0);
    expect(result.stderr).toBe('');
    const json: ConjugationResult = JSON.parse(result.stdout);
    expect(json.forms[0]?.text).toBe('nous aimons');
    expect(json.forms[0]?.parts.map(part => part.role)).toEqual(['subject', 'lexicalVerb']);
    expect(json.status).toBe('available');
  });

  it('projects bare output but leaves JSON structured and complete', () => {
    const args = ['fr', 'faire', '--mood', 'subjunctive', '--tense', 'present', '--person', '2', '--number', 'singular'];
    expect(run([...args, '--bare']).stdout).toBe('fasses\n');
    const json: ConjugationResult = JSON.parse(run([...args, '--json', '--bare']).stdout);
    expect(json.forms[0]?.text).toBe('que tu fasses');
    expect(run(['fr', 'se laver', '--mood', 'indicative', '--tense', 'near_future', '--person', '1', '--number', 'singular', '--bare']).stdout).toBe('vais me laver\n');
    expect(run(['fr', 'aimer', '--mood', 'gerund', '--tense', 'present', '--bare']).stdout).toBe('en aimant\n');
    expect(run(['nl', 'opstaan', '--mood', 'indicative', '--tense', 'future_perfect', '--person', '1', '--number', 'singular', '--bare', '--json']).status).toBe(0);
  });

  it('passes language-specific flags and JSON agreement context through', () => {
    expect(run(['fr', 'aller', '--mood', 'indicative', '--tense', 'perfect', '--person', '1', '--number', 'plural', '--gender', 'feminine']).stdout).toBe('nous sommes allées\n');
    expect(run(['fr', 'aimer', '--mood', 'participle', '--tense', 'past', '--agreement', '{"gender":"feminine","number":"plural"}']).stdout).toBe('aimées\n');
    expect(run(['nl', 'gaan', '--mood', 'indicative', '--tense', 'present', '--person', '2', '--number', 'singular', '--inversion', '--pronoun', 'u']).stdout).toBe('gaat u\n');
  });

  it('displays partial availability without an error exit', () => {
    const result = run(['fr', 'falloir', '--mood', 'indicative', '--tense', 'present']);
    expect(result.status).toBe(0);
    expect(result.stderr).toBe('');
    expect(result.stdout).toContain(': il faut');
    expect(result.stdout.match(/: unavailable /gu)).toHaveLength(5);
  });

  it('reports grammatical unavailability with exit 3, including JSON', () => {
    const args = ['fr', 'falloir', '--mood', 'indicative', '--tense', 'present', '--person', '1', '--number', 'singular'];
    const plain = run(args);
    expect(plain.status).toBe(3);
    expect(plain.stdout).toContain(': unavailable ');
    expect(plain.stderr).toBe('');
    const json = run([...args, '--json']);
    expect(json.status).toBe(3);
    expect(JSON.parse(json.stdout)).toMatchObject({ status: 'unavailable', forms: [] });
  });

  it.each([
    ['xx', 'aimer'],
    ['fr', 'aimer', '--person', '0'],
    ['nl', 'werken', '--mood', 'subjunctive'],
    ['fr', 'aimer', '--mood', 'participle', '--person', '1'],
    ['fr', 'glouloir'],
    ['nl', 'werken', '--stems', '{broken'],
    ['nl', 'werken', '--unknown'],
    ['nl', 'werken', '--reflexive', '--no-reflexive'],
  ])('keeps invalid request %j off stdout', (...args) => {
    const result = run(args);
    expect(result.status).toBe(1);
    expect(result.stdout).toBe('');
    expect(result.stderr.length).toBeGreaterThan(0);
  });

  it('provides usage independently of conjugation', () => {
    const result = run(['--help']);
    expect(result.status).toBe(0);
    expect(result.stdout).toContain('Usage: conjugation-engine <fr|nl|en|de|es|it> <infinitive>');
    expect(result.stderr).toBe('');
  });

  it('derives one help section per registered language from its option schema', () => {
    const help = run(['--help']).stdout;
    const sections = help.split('\n\n');
    const dutch = sections.find(section => section.startsWith('Dutch (nl):'));
    const french = sections.find(section => section.startsWith('French (fr):'));
    expect(dutch).toContain('--separable-prefix');
    expect(dutch).toContain('--reflexive / --no-reflexive');
    expect(dutch).toContain('--auxiliary <hebben|zijn>');
    expect(dutch).not.toContain('--gender');
    expect(french).toContain('--auxiliary <avoir|être>');
    expect(french).toContain('--orthography <rectified|traditional>');
    expect(french).toContain('--class <er|ir|re>');
    expect(french).toContain('--agreement <JSON>');
    expect(french).toMatch(/--agreement <JSON>\s+keys: gender, number\n/u);
    expect(french).toMatch(/--preceding-direct-object <JSON>\s+keys: gender, number\n/u);
    expect(french).not.toContain('--pronoun');
    expect(sections.find(section => section.startsWith('Common options:'))).toContain('--mood <id>');
  });

  it('reports an unregistered language with the registered ones', () => {
    const result = run(['xx', 'aimer']);
    expect(result.status).toBe(1);
    expect(result.stdout).toBe('');
    expect(result.stderr).toBe('UNSUPPORTED_LANGUAGE: Language must be one of: fr, nl, en, de, es, it.\n');
  });

  it('accepts negated boolean flags for every boolean option', () => {
    const base = ['nl', 'opstaan', '--mood', 'indicative', '--tense', 'present', '--person', '1', '--number', 'singular'];
    const json = (...flags: string[]): { forms: { text: string }[] } => JSON.parse(run([...base, ...flags, '--json']).stdout);
    expect(json('--inversion').forms[0]?.text).toBe('sta ik op');
    expect(json('--no-inversion').forms[0]?.text).toBe('ik sta op');
    expect(run([...base, '--inversion', '--no-inversion']).status).toBe(1);
    expect(run(['fr', 'haïr', '--mood', 'indicative', '--tense', 'present', '--person', '1', '--number', 'singular', '--no-aspirated-h']).status).toBe(0);
  });

  it('lets the engine reject a flag the language does not declare', () => {
    const result = run(['nl', 'werken', '--gender', 'feminine']);
    expect(result.status).toBe(1);
    expect(result.stderr).toBe('INVALID_REQUEST: Unknown nl option: gender.\n');
  });

  it('passes --subject to the engine, which selects that slot or rejects an unknown one', () => {
    const common = run(['--help']).stdout.split('\n\n').find(section => section.startsWith('Common options:'));
    expect(common).toContain('--subject <id>');
    expect(run(['fr', 'aimer', '--mood', 'indicative', '--tense', 'present', '--subject', '1sg']).stdout).toBe('j\'aime\n');
    const result = run(['fr', 'aimer', '--subject', '4sg']);
    expect(result.status).toBe(1);
    expect(result.stdout).toBe('');
    expect(result.stderr).toBe('INVALID_REQUEST: Invalid subject: 4sg.\n');
  });

  it('prints no step lines for a form that records no steps', () => {
    const args = ['nl', 'werken', '--mood', 'infinitive', '--tense', 'present'];
    const explained = run([...args, '--explain']);
    expect(explained.status).toBe(0);
    expect(explained.stdout).toBe(run(args).stdout);
    expect(explained.stdout).toBe('werken\n');
    expect(explained.stderr).toBe('');
  });

  it('prints the steps of a French form under it, in the chosen locale', () => {
    const args = ['fr', 'placer', '--mood', 'indicative', '--tense', 'present', '--person', '1', '--number', 'plural', '--explain'];
    expect(run([...args, '--locale', 'nl']).stdout).toBe([
      'nous plaçons',
      '    Haal de uitgang van het hele werkwoord placer weg: de stam is plac-.',
      '    Présent meervoud: zet -ons achter plac-.',
      '    De c krijgt een cedille vóór a, o of u, zodat hij als s blijft klinken: placons wordt plaçons.',
      '    Het onderwerp nous staat vóór het werkwoord.',
      '',
    ].join('\n'));
  });

  it('prints the steps of a Dutch form under it, in the chosen locale', () => {
    const args = ['nl', 'leven', '--mood', 'indicative', '--tense', 'past', '--person', '1', '--number', 'singular', '--explain'];
    expect(run(args).stdout).toBe([
      'ik leefde',
      '    Take -en off leven: lev-.',
      '    A long vowel in a closed syllable is written with two letters, so lev- becomes leev-.',
      '    At the end of a word, v and z are written f and s, so leev- becomes leef-.',
      '    Weak verb: the past tense is the stem + de: leefde.',
      "    v is not one of the sounds of 't kofschip (t, k, f, s, ch, p), so the ending starts with d: leefde.",
      '    The subject is ik.',
      '',
    ].join('\n'));
    const dutch = run([...args, '--locale', 'nl']).stdout.split('\n');
    expect(dutch[0]).toBe('ik leefde');
    expect(dutch).toContain("    v zit niet in 't kofschip (t, k, f, s, ch, p), dus de uitgang begint met d: leefde.");
  });

  it('words person and number in the chosen locale, and keeps the default labels in English', () => {
    const args = ['nl', 'werken', '--mood', 'indicative', '--tense', 'present', '--number', 'plural', '--person', '3'];
    expect(run([...args, '--pronoun', 'zij', '--locale', 'nl']).stdout).toBe('zij werken\n');
    const all = ['nl', 'werken', '--mood', 'indicative', '--tense', 'present'];
    expect(run([...all, '--locale', 'nl']).stdout).toContain('Aantonende wijs / Onvoltooid tegenwoordige tijd / 1e persoon enkelvoud / 1sg: ik werk');
    expect(run(all).stdout).toContain('Aantonende wijs / Onvoltooid tegenwoordige tijd / 1 singular / 1sg: ik werk');
  });

  it('prints the reason a Dutch form does not exist in the chosen locale', () => {
    const result = run(['nl', 'spijten', '--mood', 'indicative', '--tense', 'present', '--person', '1', '--number', 'singular', '--locale', 'nl']);
    expect(result.status).toBe(3);
    expect(result.stdout).toBe('Aantonende wijs / Onvoltooid tegenwoordige tijd / 1e persoon enkelvoud / 1sg: unavailable (spijten is een onpersoonlijk werkwoord: het heeft alleen vormen in de 3e persoon.)\n');
  });

  it('adds an explanation to every form in JSON only when asked', () => {
    const args = ['fr', 'aimer', '--mood', 'infinitive', '--tense', 'present', '--json'];
    const plain: ConjugationResult = JSON.parse(run(args).stdout);
    expect(plain.forms[0]).not.toHaveProperty('explanation');
    const explained: { forms: { text: string; explanation: { summary: string; sections: unknown[] } }[] } = JSON.parse(run([...args, '--explain']).stdout);
    expect(explained.forms[0]?.text).toBe('aimer');
    expect(explained.forms[0]?.explanation.summary).toBe('aimer: Infinitif, Présent');
    expect(explained.forms[0]?.explanation.sections).toHaveLength(1);
  });

  it('rejects an unknown locale and lists the flags in the help', () => {
    const result = run(['fr', 'aimer', '--mood', 'infinitive', '--tense', 'present', '--locale', 'xx']);
    expect(result.status).toBe(1);
    expect(result.stdout).toBe('');
    expect(result.stderr).toBe('INVALID_REQUEST: Locale must be one of: en, nl.\n');
    const common = run(['--help']).stdout.split('\n\n').find(section => section.startsWith('Common options:'));
    expect(common).toContain('--explain');
    expect(common).toContain('--locale <en|nl>');
  });
});

describe('form and target labels', () => {
  const target: ResolvedTarget = { mood: 'indicative', tense: 'present', person: 3, number: 'singular', gender: null, agreement: null };
  const labels = { mood: 'Indicative', tense: 'Present' };
  const variant = { orthography: 'both', auxiliary: null, pattern: null, usage: 'standard', condition: null } as const;
  const formOf = (over: Partial<ConjugatedForm>): ConjugatedForm => ({
    target, parts: [], variant, ruleIds: [], text: '', preferred: true, labels, ...over,
  });

  it('prints what it always printed for a target without voice, case, region or subject', () => {
    expect(formLabel(formOf({}))).toBe('Indicative / Present / 3 singular');
    expect(targetLabel(target, labels)).toBe('Indicative / Present / 3 singular');
    const participle = formOf({
      target: { ...target, person: null, number: null, gender: 'feminine', agreement: { gender: 'feminine', number: 'plural' } },
      variant: { ...variant, orthography: 'rectified', pattern: 'y-to-i', usage: 'dated', condition: 'old' },
    });
    expect(formLabel(participle)).toBe('Indicative / Present / feminine / participle feminine plural / rectified / y-to-i / dated / old');
  });

  it('appends voice, agreement case, region and subject, in that order, only when present', () => {
    const everything = formOf({
      target: { ...target, voice: 'passive', subject: '3sg.f', agreement: { gender: 'feminine', number: 'singular', case: 'ablative' } },
      variant: { ...variant, pattern: 'long', usage: 'literary', condition: 'old', region: 'AT' },
    });
    expect(formLabel(everything)).toBe('Indicative / Present / 3 singular / participle feminine singular / long / literary / old / passive / ablative / AT / 3sg.f');
    expect(formLabel(formOf({ variant: { ...variant, region: 'AT' } }))).toBe('Indicative / Present / 3 singular / AT');
    expect(formLabel(formOf({ variant: { ...variant, region: null } }))).toBe('Indicative / Present / 3 singular');
    expect(formLabel(formOf({ target: { ...target, voice: null } }))).toBe('Indicative / Present / 3 singular');
    // An unavailable target has no variant, so no region.
    expect(targetLabel({ ...target, voice: 'passive', subject: '3sg.f' }, labels)).toBe('Indicative / Present / 3 singular / passive / 3sg.f');
  });

  it('labels the forms of a language with voices and subject slots', () => {
    const toy = createEngine({ xx: toyPack });
    const forms = toy.conjugate({ language: 'xx', infinitive: 'placa', mood: 'indicative', tense: 'present', person: 3, number: 'singular', voice: 'passive' }).forms;
    expect(forms.map(form => formLabel(form))).toEqual(['Indicative / Present / 3 singular / passive / 3sg']);
  });
});

describe('unavailable target lines', () => {
  const toy = createEngine({ xx: toyPack }, { en: { ...locales.en, ...toyEn }, nl: { ...locales.nl, ...toyNl } });
  const [absent] = toy.conjugate({ language: 'xx', infinitive: 'solea', mood: 'participle', tense: 'past' }).unavailableTargets;
  const labels = { mood: 'Participle', tense: 'Past' };

  it('gives the reason of a target that records its rule in the chosen locale', () => {
    expect(unavailableLine(absent!, labels, toy.explain('xx', absent!, 'en')))
      .toBe('Participle / Past: unavailable (This verb has no participle, so the perfect and the past participle do not exist.)');
    expect(unavailableLine(absent!, labels, toy.explain('xx', absent!, 'nl')))
      .toBe('Participle / Past: unavailable (Dit werkwoord heeft geen deelwoord, dus het perfectum en het voltooid deelwoord bestaan niet.)');
  });

  it('keeps the pack\'s own sentence for a target that records no rule', () => {
    const { step: _rule, ...withoutRule } = absent!;
    const own = { ...withoutRule, explanation: 'The pack says why.' };
    expect(unavailableLine(own, labels, toy.explain('xx', own, 'nl'))).toBe('Participle / Past: unavailable (The pack says why.)');
  });

  it('gives the reason of a French target in the chosen locale', () => {
    const [impersonal] = conjugate({ language: 'fr', infinitive: 'falloir', mood: 'indicative', tense: 'present', person: 1, number: 'singular' }).unavailableTargets;
    expect(unavailableLine(impersonal!, { mood: 'Indicatif', tense: 'Présent' }, explain('fr', impersonal!, 'nl')))
      .toBe('Indicatif / Présent / 1 singular / 1sg: unavailable (Dit werkwoord is onpersoonlijk: het bestaat alleen met il, dus deze persoon heeft geen vorm.)');
  });
});
