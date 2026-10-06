import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import type { ConjugationResult } from '../src/index.js';

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
    expect(result.stdout).toContain('Usage: verbodrome <fr|nl> <infinitive>');
    expect(result.stderr).toBe('');
  });
});
