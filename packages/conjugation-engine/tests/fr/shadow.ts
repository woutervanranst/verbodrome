/**
 * The French grammar in shadow mode (plan 3): an engine whose `fr` pack is the staged grammar with its subject slots,
 * and the frozen snapshot split into sections. A target whose stage is not migrated yet comes back as an unavailable
 * target with the reason `not migrated`, which no frozen line has, so its section stays pending while the rest of the
 * query is compared. Deleted when French switches (Task 8).
 */
import { readFileSync } from 'node:fs';
import { gunzipSync } from 'node:zlib';
import { characterize, queryHeader } from '../../scripts/characterize/serialize.ts';
import type { CharacterizationQuery } from '../../scripts/characterize/serialize.ts';
import { createEngine } from '../../src/core/engine.js';
import type { LanguageEngine, LanguagePack } from '../../src/core/pack.js';
import { stagedEngine } from '../../src/core/staged.js';
import { ConjugationError } from '../../src/errors.js';
import { locales } from '../../src/i18n/locales/index.js';
import { frenchCatalogueWithSlots, frenchSubjects } from '../../src/languages/fr/catalogue.js';
import { frenchGrammar } from '../../src/languages/fr/grammar.js';
import { frenchRank } from '../../src/languages/fr/rank.js';
import { frenchPack } from '../../src/languages/fr/pack.js';
import { frenchRules } from '../../src/languages/fr/rules.js';
import { frenchCitations, frenchWorks } from '../../src/languages/fr/sources.js';
import { packs } from '../../src/languages/index.js';
import type { UnavailableTarget } from '../../src/types.js';

/** The staged engine for one query, with the targets a not-yet-migrated stage throws on reported as `not migrated`. */
function shadowEngine(query: Readonly<Record<string, unknown>>): LanguageEngine {
  const engine = stagedEngine(frenchGrammar, frenchPack.rendering, query);
  return {
    ...engine,
    generate(target, subject) {
      try {
        return engine.generate(target, subject);
      } catch (error) {
        if (!(error instanceof ConjugationError) || !/ not migrated yet$/u.test(error.message)) throw error;
        const reason = 'not migrated' as UnavailableTarget['reason'];
        return { forms: [], unavailable: [{ target, reason, explanation: error.message, source: 'shadow' }] };
      }
    },
  };
}

/** The French pack as it will be registered at the switch: staged engine, subject slots, rules, works and citations. */
export const shadowPack: LanguagePack = {
  ...frenchPack,
  catalogue: frenchCatalogueWithSlots,
  rank: frenchRank,
  subjects: frenchSubjects,
  genderedTargets: true,
  engine: shadowEngine,
  rules: frenchRules,
  works: frenchWorks,
  citations: frenchCitations,
};

export const shadow = createEngine({ ...packs, fr: shadowPack }, locales);

/** The snapshot block of `query` as the shadow engine produces it. */
export function shadowFrench(query: CharacterizationQuery): string[] {
  return characterize(query, shadow);
}

const directory = new URL('../characterization/', import.meta.url);

export const frenchQueries: readonly CharacterizationQuery[] = JSON.parse(readFileSync(new URL('fr.queries.json', directory), 'utf8'));

/** The frozen French blocks, keyed by header line. */
export function frozenBlocks(): Map<string, string[]> {
  const blocks = new Map<string, string[]>();
  for (const block of gunzipSync(readFileSync(new URL('fr.tsv.gz', directory))).toString('utf8').split('\n\n')) {
    const lines = block.replace(/\n$/u, '').split('\n');
    blocks.set(lines[0] ?? '', lines);
  }
  return blocks;
}

/**
 * A block's sections, in block order: `analysis` (the A line), `error` (the E line), and per `mood/tense` that tense's
 * F lines followed by its U lines.
 */
export function sections(lines: readonly string[]): Map<string, string[]> {
  const result = new Map<string, string[]>();
  const forms = new Map<string, string[]>();
  const gaps = new Map<string, string[]>();
  const tenses: string[] = [];
  for (const line of lines.slice(1)) {
    const [kind = '', target = ''] = line.split('\t');
    if (kind === 'A') result.set('analysis', [line]);
    else if (kind === 'E') result.set('error', [line]);
    else {
      const name = target.split('/').slice(0, 2).join('/');
      if (!tenses.includes(name)) tenses.push(name);
      const bucket = kind === 'F' ? forms : gaps;
      bucket.set(name, [...(bucket.get(name) ?? []), line]);
    }
  }
  for (const name of tenses) result.set(name, [...(forms.get(name) ?? []), ...(gaps.get(name) ?? [])]);
  return result;
}

export { queryHeader };
