/**
 * Drift guards for `docs/pack-authoring.md`, the guide pack authors work from. It must keep naming the hooks a grammar
 * has, each signature block must still be a whole declaration of the file it names, and its toy examples must still be
 * in the toy pack or its messages.
 */
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { toyGrammar } from './toy/pack.js';

const read = (path: string): string => readFileSync(new URL(path, import.meta.url), 'utf8');
const guide = read('../docs/pack-authoring.md');
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

/** The source without its comments (block comments, and line comments that start a line or follow a space). */
function withoutComments(source: string): string {
  return source.replace(/\/\*[\s\S]*?\*\//gu, '').replace(/(^|\s)\/\/[^\n]*/gmu, '');
}

/** The lines of every ```ts toy block. */
function toyLines(): string[] {
  const blocks = [...guide.matchAll(/```ts toy\n([\s\S]*?)```/gu)];
  return blocks.flatMap(block => block[1]!.split('\n')).map(line => line.trim()).filter(line => line !== '' && line !== '// ...');
}

/** Every ```ts signature <file> block: the file it names (relative to the package) and its declaration. */
function signatureBlocks(): { readonly file: string; readonly text: string }[] {
  return [...guide.matchAll(/```ts signature (\S+)\n([\s\S]*?)```/gu)].map(block => ({ file: block[1]!, text: block[2]! }));
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

  it('has each signature block as a whole declaration of the file it names', () => {
    const blocks = signatureBlocks();
    expect(blocks.length).toBeGreaterThan(50);
    // The count of ```ts signature fences without a file would be a block this guard skips.
    expect([...guide.matchAll(/```ts signature\b/gu)]).toHaveLength(blocks.length);
    const sources = new Map<string, string>();
    const missing = blocks.filter(({ file, text }) => {
      if (!sources.has(file)) sources.set(file, squeeze(withoutComments(read(`../${file}`))));
      return !sources.get(file)!.includes(squeeze(text));
    });
    expect(missing.map(({ file, text }) => `${file}: ${text.split('\n')[0]}`)).toEqual([]);
  });

  it('shows complete declarations: every signature block has balanced brackets', () => {
    const unbalanced = signatureBlocks().filter(({ text }) => {
      const depth = [...text].reduce((sum, char) => sum + ('{(['.includes(char) ? 1 : '})]'.includes(char) ? -1 : 0), 0);
      return depth !== 0 || text.trim() === '';
    });
    expect(unbalanced.map(({ file, text }) => `${file}: ${text.split('\n')[0]}`)).toEqual([]);
  });

  it('shows examples that are in the toy pack and its messages', () => {
    const lines = toyLines();
    expect(lines.length).toBeGreaterThan(50);
    const source = squeeze(toySource);
    expect(lines.filter(line => !source.includes(squeeze(line)))).toEqual([]);
  });

  it('lists every name of the ./core barrel in the API reference', () => {
    const barrel = read('../src/core/index.ts');
    const names = [...barrel.matchAll(/export (?:type )?\{([^}]*)\} from/gu)].flatMap(match => match[1]!.split(',')).map(name => name.trim()).filter(Boolean);
    expect(names.length).toBeGreaterThan(50);
    const api = read('../docs/api.md');
    expect(names.filter(name => !api.includes(`\`${name}\``))).toEqual([]);
  });
});
