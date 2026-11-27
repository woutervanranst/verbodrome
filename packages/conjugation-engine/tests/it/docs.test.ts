import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { italianRules } from '../../src/languages/it/rules.js';

const doc = readFileSync(new URL('../../docs/grammar/it.md', import.meta.url), 'utf8');
const inventory = doc.slice(doc.indexOf('## Rule inventory'));

describe('docs/grammar/it.md', () => {
  it('lists every rule exactly once in its inventory', () => {
    for (const id of Object.keys(italianRules)) expect(inventory.split(`| \`${id}\` |`).length - 1, id).toBe(1);
    expect((inventory.match(/^\| `it\./gmu) ?? []).length).toBe(Object.keys(italianRules).length);
  });

  it('states the corpus and oracle counts', () => {
    for (const count of ['1,920', '67', '63', '442']) expect(doc, count).toContain(count);
  });
});
