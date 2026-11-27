import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
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
    expect(paths).toContain('docs/pack-authoring.md');
    expect(paths).toContain('README.md');
    expect(paths).toContain('docs/api.md');
    expect(paths?.some(path => /(^|\/)(tests|fixtures|scripts|node_modules|\.cache|\.github)(\/|$)|\.html$/u.test(path))).toBe(false);
    expect(readFileSync(new URL('../dist/cli.js', import.meta.url), 'utf8')).toMatch(/^#!\/usr\/bin\/env node/u);
    const manifest: { dependencies?: Record<string, string> } = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8'));
    expect(Object.keys(manifest.dependencies ?? {})).toEqual([]);
  });
});
