/**
 * The French rules in shadow mode. `tests/i18n/completeness.test.ts` checks a pack's messages and citations only once
 * the registered pack declares `rules` (plan 3 Task 8); until then this test holds the rules that are implemented to the
 * same standard: each has a message in both locales and a citation, and a rule without one has neither.
 */
import { describe, expect, it } from 'vitest';
import type { Citation } from '../../src/core/sources.js';
import { formatMessage, placeholders } from '../../src/i18n/format.js';
import { fr as en } from '../../src/i18n/locales/en/fr.js';
import { locales } from '../../src/i18n/locales/index.js';
import { fr as nl } from '../../src/i18n/locales/nl/fr.js';
import { frenchRules } from '../../src/languages/fr/rules.js';
import { frenchCitations, frenchWorks } from '../../src/languages/fr/sources.js';

const ids = Object.keys(frenchRules);

describe('French rules', () => {
  it('declares the 94 rules of the grammar design, by stage', () => {
    const byStage: Record<string, number> = {};
    for (const rule of Object.values(frenchRules)) byStage[rule.stage] = (byStage[rule.stage] ?? 0) + 1;
    expect(byStage).toEqual({ classify: 22, stem: 13, ending: 11, orthography: 15, periphrasis: 14, clause: 14, availability: 5 });
    expect(ids.every(id => /^fr\.[a-z]+\.[a-z0-9]+(-[a-z0-9]+)*$/u.test(id))).toBe(true);
  });

  it('gives every implemented rule a message in both locales and a citation, and no other rule either', () => {
    const cited = Object.keys(frenchCitations).sort();
    expect(Object.keys(en).sort()).toEqual(cited);
    expect(Object.keys(nl).sort()).toEqual(cited);
    for (const id of cited) expect(ids).toContain(id);
  });

  it('merges the messages into both catalogs', () => {
    for (const [locale, messages] of [['en', en], ['nl', nl]] as const) {
      for (const [id, text] of Object.entries(messages)) expect(locales[locale][id]).toBe(text);
    }
  });

  it('writes well-formed messages that use only the rule\'s params', () => {
    const problems: string[] = [];
    for (const [locale, messages] of [['en', en], ['nl', nl]] as const) {
      for (const [id, text] of Object.entries(messages)) {
        const params = frenchRules[id as keyof typeof frenchRules].params;
        const allowed = new Set([...Object.keys(params), 'before', 'after']);
        const used = placeholders(text);
        for (const name of used.keys()) if (!allowed.has(name)) problems.push(`${id} (${locale}) uses {${name}}`);
        const rendered = formatMessage(text, Object.fromEntries([...used.keys()].map(name => [name, 'x'])), locale);
        if (/\{[A-Za-z_]\w*\}/u.test(rendered) || /(?<!')(?:'')*'\{/u.test(text)) problems.push(`${id} (${locale}) quotes a placeholder`);
      }
    }
    expect(problems).toEqual([]);
  });

  it('cites listed works with https addresses', () => {
    const problems: string[] = [];
    for (const [id, cited] of Object.entries(frenchCitations)) {
      const citations: readonly Citation[] = Array.isArray(cited) ? cited : [cited as Citation];
      if (!citations.length) problems.push(`${id} has no citation`);
      for (const citation of citations) {
        if (!Object.hasOwn(frenchWorks, citation.work)) problems.push(`${id} cites ${citation.work}`);
        if (citation.url !== undefined && !citation.url.startsWith('https://')) problems.push(`${id} has a url that is not https`);
      }
    }
    expect(problems).toEqual([]);
  });
});
