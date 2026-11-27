import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { latinRules } from '../../src/languages/la/rules.js';

const doc = readFileSync(new URL('../../docs/grammar/la.md', import.meta.url), 'utf8');
const inventory = doc.slice(doc.indexOf('## Rule inventory'));

describe('docs/grammar/la.md', () => {
  it('lists every rule exactly once in its inventory', () => {
    for (const id of Object.keys(latinRules)) expect(inventory.split(`| \`${id}\` |`).length - 1, id).toBe(1);
    expect((inventory.match(/^\| `la\./gmu) ?? []).length).toBe(Object.keys(latinRules).length);
  });

  it('states the corpus and oracle counts the tests pin', () => {
    for (const count of ['3,330', '107', '147', '254', '1,249', '63', '6,678', '196', '569']) expect(doc, count).toContain(count);
  });

  it('names the sources and the Wiktionary licence and attribution', () => {
    for (const text of ['Allen and Greenough', 'Bennett', 'Lewis and Short', 'CC BY-SA 4.0', 'adapted: the Latin conjugation tables were parsed into cells']) {
      expect(doc, text).toContain(text);
    }
  });
});
