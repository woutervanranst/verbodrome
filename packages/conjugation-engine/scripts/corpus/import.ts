import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { mkdir, readFile, readdir, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { parseArgs } from 'node:util';
import { applyRemaps, corpusBasePath, corpusRevision, summarizeCorpus } from './model.ts';
import type { CorpusCorrection, CorpusFile, CorpusManifest, CorpusRemapRecord, CorpusStats } from './model.ts';
import { corpusLanguages } from './languages/index.ts';
import type { Language } from '../../src/types.js';

const { values } = parseArgs({
  options: {
    source: { type: 'string' },
    output: { type: 'string', default: 'tests/fixtures' },
    only: { type: 'string' },
  },
});
if (!values.source) throw new Error('Use --source <VerbodromeX checkout> to import the pinned corpus.');
const selected = values.only ? corpusLanguages.filter(language => language.language === values.only) : corpusLanguages;
if (!selected.length) {
  throw new Error(`Unknown corpus language ${values.only}; choose from ${corpusLanguages.map(language => language.language).join(', ')}.`);
}
const source = resolve(values.source);
const revision = execFileSync('git', ['-C', source, 'rev-parse', 'HEAD'], { encoding: 'utf8' }).trim();
if (revision !== corpusRevision) throw new Error(`Expected corpus revision ${corpusRevision}, found ${revision}.`);
const modifications = execFileSync('git', ['-C', source, 'status', '--porcelain', '--', corpusBasePath], { encoding: 'utf8' }).trim();
if (modifications) throw new Error('The source corpus has local modifications; use a clean pinned checkout.');
const output = resolve(values.output);
const checksum = (text: string): string => createHash('sha256').update(text).digest('hex');

// With --only, the other languages keep what the previous import left in the output directory.
const previous = selected.length === corpusLanguages.length ? null : {
  manifest: JSON.parse(await readFile(resolve(output, 'manifest.json'), 'utf8')) as CorpusManifest,
  corrections: JSON.parse(await readFile(resolve(output, 'corrections.json'), 'utf8')) as CorpusCorrection[],
  remaps: JSON.parse(await readFile(resolve(output, 'remaps.json'), 'utf8')) as CorpusRemapRecord[],
};
if (previous && previous.manifest.revision !== corpusRevision) {
  throw new Error(`The existing import in ${output} is from revision ${previous.manifest.revision}, not ${corpusRevision}; run without --only to re-import every language.`);
}

const manifest: Omit<CorpusFile, 'cells'>[] = [];
const corrections: CorpusCorrection[] = [];
const remapRecords: CorpusRemapRecord[] = [];
const contents = new Map<Language, string>();
const stats: [Language, CorpusStats][] = [];
for (const language of corpusLanguages) {
  if (!selected.includes(language)) {
    const kept = previous?.manifest.files.filter(file => file.language === language.language) ?? [];
    const keptStats = previous?.manifest.fixtures[language.language];
    if (!kept.length || !keptStats) throw new Error(`No previous ${language.language} import in ${output}; run without --only first.`);
    const ids = new Set(kept.map(file => file.file));
    manifest.push(...kept);
    corrections.push(...(previous?.corrections ?? []).filter(correction => ids.has(correction.file)));
    remapRecords.push(...(previous?.remaps ?? []).filter(remap => remap.language === language.language));
    stats.push([language.language, keptStats]);
    continue;
  }
  const path = resolve(source, corpusBasePath, language.directory);
  const names = (await readdir(path)).filter(name => name.endsWith('.html')).sort();
  if (names.length !== language.expectedFiles) {
    throw new Error(`Expected ${language.expectedFiles} ${language.language} files; found ${names.length}.`);
  }
  const fixtures: CorpusFile[] = [];
  const languageCorrections: CorpusCorrection[] = [];
  const languageRemaps = (language.remaps ?? []).map(remap => ({ language: language.language, ...remap }));
  const remapped = languageRemaps.map(() => false);
  for (const name of names) {
    const html = new TextDecoder(language.encoding, { fatal: true }).decode(await readFile(resolve(path, name)));
    const page = language.parse(html, name);
    const { cells, matched } = applyRemaps(page.cells, languageRemaps);
    for (const [i, hit] of matched.entries()) remapped[i] ||= hit;
    const parsed = { ...page, cells };
    for (const [index, cell] of cells.entries()) {
      if ((cell.scope === 'unmodelled') && !(cell.reason && cell.reason in (language.unmodelled ?? {}))) {
        throw new Error(`${name}: cell ${index} is unmodelled for the undeclared reason ${cell.reason}.`);
      }
    }
    const context = language.context(name);
    // Neutral fixture id built from the grammatical variant, not from the source file name.
    const id = [language.language, context.infinitive, context.pattern === 'default' ? '' : context.pattern,
      context.gender === 'feminine' ? 'feminine' : '', context.auxiliary ?? ''].filter(Boolean).join('/');
    const entry = {
      file: id,
      language: language.language,
      ...context,
      templatePlaceholders: parsed.templatePlaceholders,
    } satisfies Omit<CorpusFile, 'cells'>;
    const fixture = { ...entry, cells: parsed.cells };
    fixtures.push(fixture);
    manifest.push(entry);
    for (const [index, cell] of parsed.cells.entries()) {
      const correction = language.correction(fixture, cell, index);
      if (correction) languageCorrections.push(correction);
    }
  }
  for (const [i, hit] of remapped.entries()) {
    if (!hit) throw new Error(`${language.language}: remap "${languageRemaps[i]?.heading}" #${languageRemaps[i]?.occurrence} matches no cell.`);
  }
  corrections.push(...languageCorrections);
  remapRecords.push(...languageRemaps);
  const content = JSON.stringify(fixtures) + '\n';
  contents.set(language.language, content);
  const summary: CorpusStats = { ...summarizeCorpus(fixtures, languageCorrections, languageRemaps), checksum: checksum(content) };
  stats.push([language.language, summary]);
  console.log(`${language.language}: ${summary.files} files, ${summary.baseInfinitives} infinitives, ${summary.cells} cells, ${summary.targets} contextual targets, ${summary.availableCells} available / ${summary.unavailableCells} unavailable cells, ${summary.expectedForms} form expectations, ${summary.correctionCount} corrections, ${summary.templatePlaceholders} accounted template placeholders`);
}
const correctionContent = JSON.stringify(corrections, null, 2) + '\n';
const remapContent = JSON.stringify(remapRecords, null, 2) + '\n';
const inventory: CorpusManifest = {
  revision: corpusRevision,
  files: manifest,
  fixtures: Object.fromEntries(stats),
  corrections: { count: corrections.length, checksum: checksum(correctionContent) },
};
await mkdir(output, { recursive: true });
for (const [language, content] of contents) await writeFile(resolve(output, `${language}.json`), content);
await writeFile(resolve(output, 'corrections.json'), correctionContent);
await writeFile(resolve(output, 'remaps.json'), remapContent);
await writeFile(resolve(output, 'manifest.json'), JSON.stringify(inventory, null, 2) + '\n');
console.log(`${corrections.length} explicit, sourced correction records, ${remapRecords.length} remaps`);
console.log('0 parser discrepancies; run npm run corpus:check to verify the generated forms.');
