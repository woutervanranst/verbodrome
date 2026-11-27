/**
 * Authority cells (grammar design §8.3): forms a Treccani page prints, transcribed with the page they come from. Each
 * cell's forms must all be generated for its query, and none of its `excluded` forms.
 */
import { readdirSync, readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { bare } from './helpers.js';

interface AuthorityFile {
  readonly source: { readonly work: string; readonly entry: string; readonly url: string | null; readonly retrieved: string | null };
  readonly cells: readonly {
    readonly lemma: string; readonly query: { readonly mood: string; readonly tense: string; readonly subject?: string };
    readonly forms: readonly string[]; readonly printed: string; readonly excluded?: readonly { readonly form: string; readonly reason: string }[];
  }[];
}

const directory = new URL('../goldens/it/authority/', import.meta.url);
const files = readdirSync(directory).filter(name => name.endsWith('.json')).sort();
const read = (name: string): AuthorityFile => JSON.parse(readFileSync(new URL(name, directory), 'utf8')) as AuthorityFile;

describe('Italian authority cells', () => {
  it('has the eleven source files and pins their cells', () => {
    expect(files).toHaveLength(11);
    expect(files.reduce((sum, name) => sum + read(name).cells.length, 0)).toBe(509);
    expect(read('serianni.json').cells).toEqual([]); // the print book was not at hand: nothing is reconstructed from memory
  });

  it.each(files)('%s', name => {
    for (const cell of read(name).cells) {
      const { mood, tense, subject } = cell.query;
      const generated = bare(cell.lemma, mood, tense, subject === undefined ? {} : { subject }).flatMap(text => text.split('/'));
      for (const form of cell.forms) expect(generated, `${cell.lemma} ${mood}.${tense} ${subject ?? ''}: ${form}`).toContain(form);
      for (const { form } of cell.excluded ?? []) expect(generated, `${cell.lemma}: ${form} is excluded`).not.toContain(form);
    }
  });
});
