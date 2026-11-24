import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { formLabel, targetLabel } from '../src/cli-labels.js';
import { createEngine } from '../src/core/engine.js';
import type { ConjugatedForm, ConjugationResult, ResolvedTarget } from '../src/index.js';
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
    expect(result.stdout).toContain('Indicatif / Présent / 1 singular / y-to-i: je paie');
    expect(result.stdout).toContain('Indicatif / Présent / 1 singular / keep-y: je paye');
    expect(result.stdout).toContain('Indicatif / Présent / 1 plural / y-to-i: nous payons');
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
    expect(result.stdout).toContain('Usage: conjugation-engine <fr|nl|en> <infinitive>');
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
    expect(result.stderr).toBe('UNSUPPORTED_LANGUAGE: Language must be one of: fr, nl, en.\n');
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

  it('passes --subject to the engine, which rejects it for a language without subject slots', () => {
    const common = run(['--help']).stdout.split('\n\n').find(section => section.startsWith('Common options:'));
    expect(common).toContain('--subject <id>');
    const result = run(['fr', 'aimer', '--subject', '1sg']);
    expect(result.status).toBe(1);
    expect(result.stdout).toBe('');
    expect(result.stderr).toBe('INVALID_REQUEST: Unknown fr option: subject.\n');
  });

  it('prints no step lines for a language that records no steps yet', () => {
    const args = ['fr', 'aimer', '--mood', 'infinitive', '--tense', 'present'];
    const explained = run([...args, '--explain']);
    expect(explained.status).toBe(0);
    expect(explained.stdout).toBe(run(args).stdout);
    expect(explained.stdout).toBe('aimer\n');
    expect(explained.stderr).toBe('');
    expect(run([...args, '--explain', '--locale', 'nl']).stdout).toBe('aimer\n');
  });

  it('adds an explanation to every form in JSON only when asked', () => {
    const args = ['fr', 'aimer', '--mood', 'infinitive', '--tense', 'present', '--json'];
    const plain: ConjugationResult = JSON.parse(run(args).stdout);
    expect(plain.forms[0]).not.toHaveProperty('explanation');
    const explained: { forms: { text: string; explanation: { summary: string; sections: unknown[] } }[] } = JSON.parse(run([...args, '--explain']).stdout);
    expect(explained.forms[0]?.text).toBe('aimer');
    expect(explained.forms[0]?.explanation).toEqual({ summary: 'aimer: Infinitif, Présent', sections: [] });
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
    expect(forms.map(formLabel)).toEqual(['Indicative / Present / 3 singular / passive / 3sg']);
  });
});
