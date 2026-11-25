import { readFile, writeFile } from 'node:fs/promises';
import { characterize, snapshotFile } from './serialize.ts';
import type { CharacterizationQuery } from './serialize.ts';

// Writes tests/characterization/<language>.tsv.gz. To inspect a snapshot: gunzip -c tests/characterization/fr.tsv.gz | less
const directory = new URL('../../tests/characterization/', import.meta.url);

for (const language of ['fr', 'nl'] as const) {
  const queries = JSON.parse(await readFile(new URL(`${language}.queries.json`, directory), 'utf8')) as CharacterizationQuery[];
  await writeFile(new URL(`${language}.tsv.gz`, directory), snapshotFile(queries.map(query => characterize(query))));
  console.log(`${language}: ${queries.length} queries`);
}
