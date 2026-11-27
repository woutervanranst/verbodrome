import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const root = fileURLToPath(new URL('../', import.meta.url));

/**
 * Runs the built module at `entry` (a file URL) with every import resolved inside a vm context, which refuses anything
 * but a relative path (so any `node:*` or package import fails); `body` runs after it evaluates and prints JSON.
 */
function inBrowserGraph(entry: string, body: string): unknown {
  const output = execFileSync(process.execPath, ['--experimental-vm-modules', '--no-warnings', '--input-type=module', '-e', `
    import { readFile } from 'node:fs/promises';
    import { SourceTextModule, createContext } from 'node:vm';
    const context = createContext({ structuredClone });
    const modules = new Map();
    function load(url) {
      if (!modules.has(url.href)) modules.set(url.href, readFile(url, 'utf8')
        .then(source => new SourceTextModule(source, { context, identifier: url.href })));
      return modules.get(url.href);
    }
    const entry = await load(new URL(${JSON.stringify(entry)}));
    await entry.link((specifier, parent) => {
      if (!specifier.startsWith('./') && !specifier.startsWith('../')) throw new Error('Non-browser dependency: ' + specifier);
      return load(new URL(specifier, parent.identifier));
    });
    await entry.evaluate();
    const namespace = entry.namespace;
    const urls = [...modules.keys()];
    if (urls.some(url => /\\/(cli\\.js|fixtures|scripts|tests)(\\/|$)/.test(new URL(url).pathname))) throw new Error('Node/tooling code reached the graph');
    ${body}
  `], { cwd: root, encoding: 'utf8' });
  return JSON.parse(output);
}

describe('built package boundaries', () => {
  it('loads the public ESM export through package self-reference', () => {
    const output = execFileSync(process.execPath, ['--input-type=module', '-e', `
      import { conjugate, conjugationOptions, renderParts, getCatalogue } from 'conjugation-engine';
      const query = conjugationOptions('fr', 'aller').indicative('perfect').person(1, 'plural').gender('feminine').build();
      const result = conjugate(query);
      console.log(JSON.stringify({
        text: result.forms[0].text, bare: renderParts('fr', result.forms[0].parts, { bare: true }),
        frozen: Object.isFrozen(result.forms[0].parts), catalogue: getCatalogue('nl').length
      }));
    `], { cwd: root, encoding: 'utf8' });
    expect(JSON.parse(output)).toEqual({ text: 'nous sommes allées', bare: 'sommes allées', frozen: true, catalogue: 12 });
  });

  it('runs the entire library import graph without Node or corpus runtime dependencies', () => {
    const entry = new URL('../dist/index.js', import.meta.url).href;
    const output = execFileSync(process.execPath, ['--experimental-vm-modules', '--no-warnings', '--input-type=module', '-e', `
      import { readFile } from 'node:fs/promises';
      import { SourceTextModule, createContext } from 'node:vm';
      const context = createContext({ structuredClone });
      const modules = new Map();
      function load(url) {
        if (!modules.has(url.href)) modules.set(url.href, readFile(url, 'utf8')
          .then(source => new SourceTextModule(source, { context, identifier: url.href })));
        return modules.get(url.href);
      }
      const entry = await load(new URL(${JSON.stringify(entry)}));
      await entry.link((specifier, parent) => {
        if (!specifier.startsWith('./') && !specifier.startsWith('../')) throw new Error('Non-browser dependency: ' + specifier);
        return load(new URL(specifier, parent.identifier));
      });
      await entry.evaluate();
      const { conjugate } = entry.namespace;
      const fr = conjugate({ language: 'fr', infinitive: 'glonger', mood: 'indicative', tense: 'present', person: 1, number: 'plural' });
      const nl = conjugate({ language: 'nl', infinitive: 'zorpen', mood: 'indicative', tense: 'past', person: 1, number: 'singular' });
      const urls = [...modules.keys()];
      if (urls.some(url => /\\/(cli\\.js|fixtures|scripts)(\\/|$)/.test(new URL(url).pathname))) throw new Error('Node/tooling code reached the library');
      console.log(JSON.stringify({ fr: fr.forms[0].text, nl: nl.forms[0].text }));
    `], { cwd: root, encoding: 'utf8' });
    expect(JSON.parse(output)).toEqual({ fr: 'nous glongeons', nl: 'ik zorpte' });
  });

  it('exposes the pack-authoring API on the ./core subpath, and not on the root', () => {
    const output = execFileSync(process.execPath, ['--input-type=module', '-e', `
      import * as root from 'conjugation-engine';
      import * as core from 'conjugation-engine/core';
      const authoring = ['stagedEngine', 'validateGrammar', 'defineRules', 'step', 'one', 'chain', 'combine', 'mergeTags', 'applyJunctureRules', 'wordPart', 'grammaticalPart'];
      console.log(JSON.stringify({
        core: authoring.filter(name => typeof core[name] !== 'function'),
        root: authoring.filter(name => name in root),
        engine: [typeof root.createEngine, typeof core.createEngine, root.packs && Object.keys(root.packs), root.locales && Object.keys(root.locales)],
      }));
    `], { cwd: root, encoding: 'utf8' });
    expect(JSON.parse(output)).toEqual({ core: [], root: [], engine: ['function', 'function', ['fr', 'nl', 'en', 'de', 'es', 'it', 'la'], ['en', 'nl']] });
  });

  it('runs the ./core import graph without Node, corpus or fixture code', () => {
    const entry = new URL('../dist/core/index.js', import.meta.url).href;
    const result = inBrowserGraph(entry, `
      const { stagedEngine, createEngine, defineRules } = namespace;
      console.log(JSON.stringify({ staged: typeof stagedEngine, engine: typeof createEngine, rules: Object.keys(defineRules({ 'xx.a.b': { stage: 'stem' } })), modules: urls.length > 5 }));
    `);
    expect(result).toEqual({ staged: 'function', engine: 'function', rules: ['xx.a.b'], modules: true });
  });

  it('runs the ./equivalence import graph without Node code and without the language packs', () => {
    const entry = new URL('../dist/equivalence/index.js', import.meta.url).href;
    const result = inBrowserGraph(entry, `
      const { matches } = namespace.equivalentTenses('fr', 'nl', { mood: 'indicative', tense: 'simple_past' });
      const note = namespace.equivalenceNotes.nl[matches[1].notes[0]];
      console.log(JSON.stringify({ tense: matches[0].tense.tense, note, packs: urls.filter(url => new URL(url).pathname.includes('/languages/')) }));
    `);
    expect(result).toEqual({ tense: 'past', note: expect.stringMatching(/^In het Nederlands is de voltooid tegenwoordige tijd/u), packs: [] });
  });

  it('loads the ./equivalence subpath through package self-reference', () => {
    const output = execFileSync(process.execPath, ['--input-type=module', '-e', `
      import { equivalentTenses } from 'conjugation-engine/equivalence';
      import * as root from 'conjugation-engine';
      const { matches, notes } = equivalentTenses('fr', 'nl', { mood: 'indicative', tense: 'simple_past' });
      console.log(JSON.stringify({ top: matches[0].tense, notes, same: root.equivalentTenses === equivalentTenses }));
    `], { cwd: root, encoding: 'utf8' });
    expect(JSON.parse(output)).toEqual({ top: { mood: 'indicative', tense: 'past' }, notes: [], same: true });
  });

  /** The named export each subpath of the export map documents (docs/api.md). */
  const subpaths: Readonly<Record<string, string>> = {
    '.': 'conjugate',
    './core': 'createEngine',
    './languages/fr': 'frenchPack',
    './languages/nl': 'dutchPack',
    './languages/de': 'germanPack',
    './languages/en': 'englishPack',
    './languages/es': 'spanishPack',
    './languages/it': 'italianPack',
    './languages/la': 'latinPack',
    './locales/en': 'en',
    './locales/nl': 'nl',
    './equivalence': 'equivalentTenses',
  };
  const manifestExports = (): Record<string, { types: string; import: string }> =>
    JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8')).exports;

  it('resolves every subpath of the export map through the package name, to the built files', () => {
    const exportMap = manifestExports();
    expect(Object.keys(exportMap)).toEqual(Object.keys(subpaths));
    for (const [subpath, target] of Object.entries(exportMap)) {
      expect(existsSync(new URL(`../${target.import}`, import.meta.url)), target.import).toBe(true);
      expect(existsSync(new URL(`../${target.types}`, import.meta.url)), target.types).toBe(true);
      expect(target.import, subpath).toMatch(/^\.\/dist\/.+\.js$/u);
    }
    const output = execFileSync(process.execPath, ['--input-type=module', '-e', `
      const subpaths = ${JSON.stringify(subpaths)};
      const found = {};
      for (const [subpath, name] of Object.entries(subpaths)) {
        const module = await import(subpath === '.' ? 'conjugation-engine' : 'conjugation-engine/' + subpath.slice(2));
        found[subpath] = typeof module[name];
      }
      console.log(JSON.stringify(found));
    `], { cwd: root, encoding: 'utf8' });
    const found: Record<string, string> = JSON.parse(output);
    for (const subpath of Object.keys(subpaths)) expect(found[subpath], subpath).toMatch(/^(function|object)$/u);
  });

  it('builds an engine from subpath imports alone: one pack, one locale', () => {
    const output = execFileSync(process.execPath, ['--input-type=module', '-e', `
      import { createEngine } from 'conjugation-engine/core';
      import { germanPack } from 'conjugation-engine/languages/de';
      import { en } from 'conjugation-engine/locales/en';
      const engine = createEngine({ de: germanPack }, { en });
      const result = engine.conjugate({ language: 'de', infinitive: 'machen', mood: 'indicative', tense: 'past', person: 1, number: 'singular' });
      const form = result.forms[0];
      const sections = engine.explain('de', form, 'en').sections;
      console.log(JSON.stringify({ text: form.text, explained: sections.some(section => section.steps.length > 0), languages: engine.languages }));
    `], { cwd: root, encoding: 'utf8' });
    expect(JSON.parse(output)).toEqual({ text: 'ich machte', explained: true, languages: ['de'] });
  });

  it('loads one language pack without the others, and a locale without any pack', () => {
    const others = (code: string) => `urls.map(url => new URL(url).pathname)
      .filter(path => new RegExp('/languages/(fr|nl|de|en|es|it|la)/').test(path) && !path.includes('/languages/${code}/'))`;
    const de = inBrowserGraph(new URL('../dist/languages/de/index.js', import.meta.url).href, `
      console.log(JSON.stringify({ pack: namespace.germanPack.language, others: ${others('de')} }));
    `);
    expect(de).toEqual({ pack: 'de', others: [] });
    const locale = inBrowserGraph(new URL('../dist/i18n/locales/nl/index.js', import.meta.url).href, `
      console.log(JSON.stringify({ catalog: typeof namespace.nl, packs: urls.filter(url => new URL(url).pathname.includes('/languages/')) }));
    `);
    expect(locale).toEqual({ catalog: 'object', packs: [] });
  });

  it('builds from a clean dist: every built file has its source', () => {
    const dist = fileURLToPath(new URL('../dist/', import.meta.url));
    const orphans = readdirSync(dist, { recursive: true, encoding: 'utf8' })
      .filter(path => /\.(js|d\.ts|js\.map|d\.ts\.map)$/u.test(path))
      .map(path => path.replace(/\.(d\.ts\.map|js\.map|d\.ts|js)$/u, '.ts'))
      .filter(source => !existsSync(new URL(`../src/${source}`, import.meta.url)));
    expect(orphans).toEqual([]);
    const manifest: { scripts: Record<string, string> } = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8'));
    expect(manifest.scripts.build).toMatch(/rmSync\('dist'.*&& tsc -p tsconfig\.build\.json$/u);
  });

  it('packages only compiled runtime code and directly related documentation', () => {
    const output = execFileSync('npm', ['pack', '--dry-run', '--json', '--ignore-scripts'], { cwd: root, encoding: 'utf8' });
    const packages: { files: { path: string }[] }[] = JSON.parse(output);
    const paths = packages[0]?.files.map(file => file.path);
    expect(paths).toBeDefined();
    expect(paths).toContain('dist/index.js');
    expect(paths).toContain('dist/index.d.ts');
    expect(paths).toContain('dist/cli.js');
    expect(paths).toContain('dist/core/index.js');
    expect(paths).toContain('dist/core/index.d.ts');
    expect(paths).toContain('dist/equivalence/index.js');
    expect(paths).toContain('dist/equivalence/index.d.ts');
    for (const code of ['fr', 'nl', 'de', 'en', 'es', 'it', 'la']) expect(paths).toContain(`dist/languages/${code}/index.js`);
    for (const locale of ['en', 'nl']) expect(paths).toContain(`dist/i18n/locales/${locale}/index.js`);
    // Nothing whose source is gone: every packed build file has a source under src/.
    expect(paths?.filter(path => path.startsWith('dist/') && !existsSync(new URL(`../src/${path.slice(5).replace(/\.(d\.ts\.map|js\.map|d\.ts|js)$/u, '.ts')}`, import.meta.url)))).toEqual([]);
    expect(paths).toContain('docs/pack-authoring.md');
    expect(paths).toContain('README.md');
    expect(paths).toContain('docs/api.md');
    expect(paths?.some(path => /(^|\/)(tests|fixtures|scripts|node_modules|\.cache|\.github)(\/|$)|\.html$/u.test(path))).toBe(false);
    expect(readFileSync(new URL('../dist/cli.js', import.meta.url), 'utf8')).toMatch(/^#!\/usr\/bin\/env node/u);
    const manifest: { dependencies?: Record<string, string> } = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8'));
    expect(Object.keys(manifest.dependencies ?? {})).toEqual([]);
  });
});
