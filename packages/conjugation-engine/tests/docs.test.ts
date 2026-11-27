/**
 * Drift guards for the documents. `docs/pack-authoring.md`, the guide pack authors work from, must keep naming the hooks
 * a grammar has, each signature block must still be a whole declaration of the file it names, and its toy examples must
 * still be in the toy pack or its messages. The counts in `README.md`, `docs/grammar.md` and `docs/api.md` are computed
 * here from the packs and the corpus manifest, and the API reference names every export and subpath.
 */
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { expandTargets, getCatalogue } from '../src/catalogue.js';
import { languages } from '../src/default-engine.js';
import { frenchFamilies } from '../src/languages/fr/families.js';
import { germanLexicon } from '../src/languages/de/lexicon.js';
import { irregulars as englishIrregulars } from '../src/languages/en/lexicon.js';
import { entries as spanishEntries } from '../src/languages/es/lexicon.js';
import { packs } from '../src/languages/index.js';
import { italianLexicon } from '../src/languages/it/lexicon.js';
import { latinEntries } from '../src/languages/la/lexicon.js';
import { dutchExceptions } from '../src/languages/nl/lexicon.js';
import type { Language } from '../src/types.js';
import { reviewedUntagged } from '../scripts/corpus/languages/de.ts';
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

/** A number as the documents write it: 26,196. */
const written = (value: number): string => value.toLocaleString('en-US');
/** The cells of the Markdown table rows of `text` whose first cell matches `first`. */
function rows(text: string, first: RegExp): string[][] {
  return text.split('\n').filter(line => line.startsWith('| ')).map(line => line.slice(2, -2).split(' | ').map(cell => cell.trim()))
    .filter(cells => first.test(cells[0]!));
}

const manifest = JSON.parse(read('./fixtures/manifest.json')) as {
  readonly fixtures: Readonly<Record<string, {
    readonly files: number; readonly cells: number; readonly targets: number; readonly availableCells: number; readonly unavailableCells: number;
    readonly unmodelledCells?: number; readonly expectedForms: number; readonly correctionCount: number; readonly templatePlaceholders: number;
  }>>;
  readonly corrections: { readonly count: number };
};
const names: Readonly<Record<Language, string>> = { fr: 'French', nl: 'Dutch', en: 'English', de: 'German', es: 'Spanish', it: 'Italian', la: 'Latin' };
/** Each pack's main lexicon, as the README's table counts it (side lists are not counted). */
const lexiconEntries: Readonly<Record<Language, number>> = {
  fr: frenchFamilies.length,
  nl: Object.keys(dutchExceptions).length,
  en: Object.keys(englishIrregulars).length,
  de: Object.keys(germanLexicon).length,
  es: Object.keys(spanishEntries).length,
  it: Object.keys(italianLexicon).length,
  la: latinEntries.length,
};
const ruleCount = (language: Language): number => Object.keys(packs[language].rules ?? {}).length;
const sum = (values: readonly number[]): number => values.reduce((total, value) => total + value, 0);

/** The package's documents and the workspace README. */
const documents = [
  '../README.md', '../../../README.md',
  ...readdirSync(new URL('../docs/', import.meta.url)).filter(name => name.endsWith('.md')).map(name => `../docs/${name}`),
  ...readdirSync(new URL('../docs/grammar/', import.meta.url)).filter(name => name.endsWith('.md')).map(name => `../docs/grammar/${name}`),
];

describe('README.md', () => {
  const readme = read('../README.md');

  it('has a row per registered language with the counts computed from the packs and the corpus manifest', () => {
    const table = rows(readme, /^(French|Dutch|English|German|Spanish|Italian|Latin|\*\*Total\*\*)$/u);
    const expected = languages.map(language => {
      const corpus = manifest.fixtures[language]!;
      return [names[language], `\`${language}\``, written(ruleCount(language)), written(lexiconEntries[language]), written(corpus.files), written(corpus.cells), written(corpus.correctionCount)];
    });
    const total = (pick: (language: Language) => number) => written(sum(languages.map(pick)));
    expected.push(['**Total**', '', total(ruleCount), total(language => lexiconEntries[language]),
      total(language => manifest.fixtures[language]!.files), total(language => manifest.fixtures[language]!.cells), total(language => manifest.fixtures[language]!.correctionCount)]);
    expect(table).toEqual(expected);
    expect(sum(languages.map(language => manifest.fixtures[language]!.correctionCount))).toBe(manifest.corrections.count);
  });

  it('links the architecture, the API reference, the grammar pages and the pack-authoring guide', () => {
    for (const target of ['docs/architecture.md', 'docs/api.md', 'docs/grammar.md', 'docs/pack-authoring.md']) {
      expect(readme, target).toContain(`(${target})`);
      expect(existsSync(new URL(`../${target}`, import.meta.url)), target).toBe(true);
    }
  });
});

describe('docs/grammar.md', () => {
  const grammar = read('../docs/grammar.md');

  it('links one existing grammar page per registered language', () => {
    const linked = [...grammar.matchAll(/\]\(grammar\/(\w+)\.md\)/gu)].map(match => match[1]!);
    expect([...new Set(linked)].sort()).toEqual([...languages].sort());
    for (const language of languages) expect(existsSync(new URL(`../docs/grammar/${language}.md`, import.meta.url)), language).toBe(true);
  });

  it('gives the number of reviewed German forms the extra-forms guard excuses', () => {
    expect(grammar).toContain(`${reviewedUntagged.length} reviewed forms`);
    expect(read('../docs/grammar/de.md')).toMatch(new RegExp(`\\(\`reviewedUntagged\`,\\s+${reviewedUntagged.length}:`, 'u'));
  });

  it('gives the corpus accounting of the manifest', () => {
    const table = rows(grammar, /^`\w\w`$/u);
    expect(table).toEqual(languages.map(language => {
      const corpus = manifest.fixtures[language]!;
      return [`\`${language}\``, ...[corpus.files, corpus.cells, corpus.targets, corpus.availableCells, corpus.unavailableCells, corpus.unmodelledCells ?? 0,
        corpus.expectedForms, corpus.correctionCount, corpus.templatePlaceholders].map(written)];
    }));
  });
});

describe('docs/api.md', () => {
  const api = read('../docs/api.md');
  /** The names a module exports: `export { a, b as c }`, `export type { ... }`, and its own declarations. */
  const exportsOf = (source: string): string[] => [
    ...[...source.matchAll(/export (?:type )?\{([^}]*)\}/gu)].flatMap(match => match[1]!.split(',')).map(name => name.trim().split(/\s+as\s+/u).pop()!),
    ...[...source.matchAll(/^export (?:interface|type|const|function|class) (\w+)/gmu)].map(match => match[1]!),
  ].filter(Boolean);
  const named = (name: string): boolean => new RegExp(`\`${name}(?=[\`(<.\\s])`, 'u').test(api);

  it('names every export of the package root, its types included', () => {
    const root = read('../src/index.ts');
    expect(root).toContain("export type * from './types.js';");
    const all = [...new Set([...exportsOf(root), ...exportsOf(read('../src/types.ts'))])];
    expect(all.length).toBeGreaterThan(90);
    expect(all.filter(name => !named(name))).toEqual([]);
  });

  it('names every subpath of the export map', () => {
    const exportMap: Record<string, unknown> = JSON.parse(read('../package.json')).exports;
    const subpaths = Object.keys(exportMap).filter(key => key !== '.').map(key => `conjugation-engine/${key.slice(2)}`);
    expect(subpaths.filter(subpath => !api.includes(`\`${subpath}\``))).toEqual([]);
  });

  it('lists every registered language, with its catalogue as getCatalogue returns it', () => {
    expect(api).toContain(`\`[${languages.map(language => `'${language}'`).join(', ')}]\``);
    for (const language of languages) {
      const start = api.indexOf(`\n### ${names[language]} (\`${language}\`)\n`);
      expect(start, `${language} has no catalogue section`).toBeGreaterThan(-1);
      const end = api.indexOf('\n#', start + 1);
      const table = rows(api.slice(start, end), /^`\w+` \/ /u);
      const catalogue = getCatalogue(language);
      const moods = [...new Set(catalogue.map(entry => entry.mood))];
      expect(table, language).toEqual(moods.map(mood => {
        const entries = catalogue.filter(entry => entry.mood === mood);
        return [`\`${mood}\` / ${entries[0]!.moodLabel}`, entries.map(entry => `\`${entry.tense}\`: ${entry.tenseLabel}`).join('; ')];
      }));
    }
  });

  it('gives the size of each catalogue', () => {
    const table = rows(api, /^(French|Dutch|English|German|Spanish|Italian|Latin)$/u);
    expect(table).toEqual(languages.map(language => [names[language], `\`${language}\``, written(getCatalogue(language).length),
      written(expandTargets({ language, infinitive: 'x' } as never).length)]));
  });
});

describe('the documents', () => {
  it('do not mention the deleted plan', () => {
    expect(existsSync(new URL('../docs/PLAN.md', import.meta.url))).toBe(false);
    expect(documents.filter(path => read(path).includes('PLAN.md'))).toEqual([]);
  });
});
