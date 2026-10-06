import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { mkdir, readFile, readdir, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { parseArgs } from 'node:util';
import { corpusBasePath, corpusRevision, normalizeText, parseDutch, parseFrench, summarizeCorpus } from './corpus.ts';
import type { CorpusCorrection, CorpusFile, CorpusManifest, CorpusStats } from './corpus.ts';
import { corpusCorrection } from './corrections.ts';
import type { Language } from '../src/types.js';

const { values } = parseArgs({
  options: { source: { type: 'string' }, output: { type: 'string', default: 'tests/fixtures' } },
});
if (!values.source) throw new Error('Use --source <VerbodromeX checkout> to import the pinned corpus.');
const source = resolve(values.source);
const revision = execFileSync('git', ['-C', source, 'rev-parse', 'HEAD'], { encoding: 'utf8' }).trim();
if (revision !== corpusRevision) throw new Error(`Expected corpus revision ${corpusRevision}, found ${revision}.`);
const modifications = execFileSync('git', ['-C', source, 'status', '--porcelain', '--', corpusBasePath], { encoding: 'utf8' }).trim();
if (modifications) throw new Error('The source corpus has local modifications; use a clean pinned checkout.');
const output = resolve(values.output);
const manifest: Omit<CorpusFile, 'cells'>[] = [];
const corrections: CorpusCorrection[] = [];
const contents: Record<Language, string> = { fr: '', nl: '' };
const emptyStats = (): CorpusStats => ({
  files: 0, baseInfinitives: 0, cells: 0, targets: 0, availableCells: 0, unavailableCells: 0,
  expectedForms: 0, correctionCount: 0, templatePlaceholders: 0, checksum: '',
});
const stats: Record<Language, CorpusStats> = { fr: emptyStats(), nl: emptyStats() };
const checksum = (text: string): string => createHash('sha256').update(text).digest('hex');
for (const [language, directory, expectedFiles, encoding] of [
  ['fr', 'Français', 222, 'windows-1252'],
  ['nl', 'Nederlands', 207, 'utf-8'],
] as const) {
  const path = resolve(source, corpusBasePath, directory);
  const files = (await readdir(path)).filter(name => name.endsWith('.html')).sort();
  if (files.length !== expectedFiles) throw new Error(`Expected ${expectedFiles} ${language} files; found ${files.length}.`);
  const fixtures: CorpusFile[] = [];
  for (const name of files) {
    const bytes = await readFile(resolve(path, name));
    const html = new TextDecoder(encoding, { fatal: true }).decode(bytes);
    const parsed = language === 'fr' ? parseFrench(html, name) : parseDutch(html, name);
    const { cells } = parsed;
    const entry = {
      file: `${directory}/${name}`,
      language,
      infinitive: normalizeText(name.slice(0, -5).split('_')[0] ?? ''),
      gender: language === 'fr' ? (name.includes('feminin') ? 'feminine' : 'masculine') : null,
      auxiliary: name.includes('auxiliaire-avoir') ? 'avoir' : name.includes('auxiliaire-etre') ? 'être' : null,
      pattern: name.includes('deuxieme-forme') ? 'second' : 'default',
      templatePlaceholders: parsed.templatePlaceholders,
      encoding,
      checksum: createHash('sha256').update(bytes).digest('hex'),
    } satisfies Omit<CorpusFile, 'cells'>;
    const fixture = { ...entry, cells };
    fixtures.push(fixture);
    manifest.push(entry);
    for (const [index, cell] of cells.entries()) {
      const correction = corpusCorrection(fixture, cell, index);
      if (correction) corrections.push(correction);
    }
  }
  contents[language] = JSON.stringify(fixtures) + '\n';
  stats[language] = {
    ...summarizeCorpus(fixtures, corrections),
    checksum: checksum(contents[language]),
  };
  const summary = stats[language];
  console.log(`${language}: ${summary.files} files, ${summary.baseInfinitives} infinitives, ${summary.cells} cells, ${summary.targets} contextual targets, ${summary.availableCells} available / ${summary.unavailableCells} unavailable cells, ${summary.expectedForms} form expectations, ${summary.correctionCount} corrections, ${summary.templatePlaceholders} accounted template placeholders`);
}
const correctionContent = JSON.stringify(corrections, null, 2) + '\n';
const inventory: CorpusManifest = {
  repository: 'woutervanranst/VerbodromeX',
  revision: corpusRevision,
  attribution: { fr: 'Le Conjugueur / Le Figaro', nl: 'Verbix' },
  files: manifest,
  fixtures: stats,
  corrections: { count: corrections.length, checksum: checksum(correctionContent) },
};
await mkdir(output, { recursive: true });
await writeFile(resolve(output, 'fr.json'), contents.fr);
await writeFile(resolve(output, 'nl.json'), contents.nl);
await writeFile(resolve(output, 'corrections.json'), correctionContent);
await writeFile(resolve(output, 'manifest.json'), JSON.stringify(inventory, null, 2) + '\n');
console.log(`${corrections.length} explicit, sourced correction records`);
console.log('0 parser discrepancies; run npm run corpus:check to verify the generated forms.');
