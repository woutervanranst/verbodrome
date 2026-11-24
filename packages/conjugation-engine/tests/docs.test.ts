/**
 * Drift guards for `docs/pack-authoring.md`, the guide pack authors work from. It must keep naming the hooks a grammar
 * has, its signatures must still be in the source, and its toy examples must still be in the toy pack or its messages.
 */
import { readdirSync, readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { toyGrammar } from './toy/pack.js';

const read = (path: string): string => readFileSync(new URL(path, import.meta.url), 'utf8');
const guide = read('../docs/pack-authoring.md');
const coreDir = new URL('../src/core/', import.meta.url);
const coreSource = readdirSync(coreDir).filter(file => file.endsWith('.ts')).map(file => readFileSync(new URL(file, coreDir), 'utf8')).join('\n');
const toySource = read('./toy/pack.ts') + read('./toy/messages.ts');

/** The text with all whitespace removed, so indentation and line breaks do not matter. */
const squeeze = (text: string): string => text.replace(/\s+/gu, '');

/** The guide's section `number` (`## 1. ...` up to the next `## `). */
function section(number: number): string {
  const start = guide.indexOf(`\n## ${number}. `);
  const end = guide.indexOf('\n## ', start + 1);
  expect(start).toBeGreaterThan(-1);
  return guide.slice(start, end === -1 ? undefined : end);
}

/** The lines of every fenced block whose info string is `ts <kind>`. */
function blockLines(kind: 'signature' | 'toy'): string[] {
  const blocks = [...guide.matchAll(new RegExp('```ts ' + kind + '\\n([\\s\\S]*?)```', 'gu'))];
  return blocks.flatMap(block => block[1]!.split('\n')).map(line => line.trim()).filter(line => line !== '' && line !== '// ...');
}

describe('docs/pack-authoring.md', () => {
  it('names exactly the hooks of the grammar in its first section', () => {
    const named = [...section(1).matchAll(/^### `([\w.]+)`$/gmu)].map(match => match[1]!);
    const hooks = [
      ...Object.keys(toyGrammar).filter(key => key !== 'clause'),
      ...Object.keys(toyGrammar.clause).map(key => `clause.${key}`),
    ];
    expect([...named].sort()).toEqual([...hooks].sort());
  });

  it('has the signatures of the source', () => {
    const lines = blockLines('signature');
    expect(lines.length).toBeGreaterThan(50);
    const source = squeeze(coreSource);
    expect(lines.filter(line => !source.includes(squeeze(line)))).toEqual([]);
  });

  it('shows examples that are in the toy pack and its messages', () => {
    const lines = blockLines('toy');
    expect(lines.length).toBeGreaterThan(50);
    const source = squeeze(toySource);
    expect(lines.filter(line => !source.includes(squeeze(line)))).toEqual([]);
  });
});
