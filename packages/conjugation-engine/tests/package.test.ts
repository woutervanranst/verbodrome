import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const root = fileURLToPath(new URL('../', import.meta.url));

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

  it('packages only compiled runtime code and directly related documentation', () => {
    const output = execFileSync('npm', ['pack', '--dry-run', '--json', '--ignore-scripts'], { cwd: root, encoding: 'utf8' });
    const packages: { files: { path: string }[] }[] = JSON.parse(output);
    const paths = packages[0]?.files.map(file => file.path);
    expect(paths).toBeDefined();
    expect(paths).toContain('dist/index.js');
    expect(paths).toContain('dist/index.d.ts');
    expect(paths).toContain('dist/cli.js');
    expect(paths).toContain('README.md');
    expect(paths).toContain('docs/api.md');
    expect(paths?.some(path => /(^|\/)(tests|fixtures|scripts|node_modules|\.cache|\.github)(\/|$)|\.html$/u.test(path))).toBe(false);
    expect(readFileSync(new URL('../dist/cli.js', import.meta.url), 'utf8')).toMatch(/^#!\/usr\/bin\/env node/u);
    const manifest: { dependencies?: Record<string, string> } = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8'));
    expect(Object.keys(manifest.dependencies ?? {})).toEqual([]);
  });
});
