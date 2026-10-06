import { readFile } from 'node:fs/promises';
import type { CorpusManifest } from './corpus.ts';

const manifest: CorpusManifest = JSON.parse(await readFile(new URL('../tests/fixtures/manifest.json', import.meta.url), 'utf8'));
for (const language of ['fr', 'nl'] as const) {
  const stats = manifest.fixtures[language];
  console.log(`${language}: ${stats.files} files / ${stats.cells} cells / ${stats.targets} contextual targets; verified ${stats.expectedForms} form expectations and ${stats.unavailableCells} unavailable cells; ${stats.correctionCount} sourced corrections; ${stats.templatePlaceholders} structural placeholders`);
}
