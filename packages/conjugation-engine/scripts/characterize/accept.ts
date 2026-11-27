import { readFile, rm, writeFile } from 'node:fs/promises';
import { characterize, isBlockDiff, queryHeader, snapshotFile } from './serialize.ts';
import type { CharacterizationQuery, IntendedDiff } from './serialize.ts';

// Writes tests/characterization/<language>.accepted.tsv.gz: for each block-level entry of intended-diffs.json, the block
// of its query as the current engine writes it, in the order of <language>.queries.json, in the format of the frozen
// snapshot. It never writes the frozen <language>.tsv.gz. A language without block-level entries has no accepted file.
// Run it after adding or removing a block-level entry, or after an intended change to an accepted block.
const directory = new URL('../../tests/characterization/', import.meta.url);
const ledger = JSON.parse(await readFile(new URL('intended-diffs.json', directory), 'utf8')) as IntendedDiff[];
const wanted = new Set(ledger.filter(isBlockDiff).map(entry => entry.query));
const written = new Set<string>();

for (const language of ['fr', 'nl'] as const) {
  const queries = JSON.parse(await readFile(new URL(`${language}.queries.json`, directory), 'utf8')) as CharacterizationQuery[];
  const accepted = queries.filter(query => wanted.has(queryHeader(query)));
  const file = new URL(`${language}.accepted.tsv.gz`, directory);
  for (const query of accepted) written.add(queryHeader(query));
  if (accepted.length) await writeFile(file, snapshotFile(accepted.map(query => characterize(query))));
  else await rm(file, { force: true });
  console.log(`${language}: ${accepted.length} accepted blocks`);
}

const unknown = [...wanted].filter(header => !written.has(header));
if (unknown.length) throw new Error(`Block-level entries for queries that are in no query list:\n${unknown.join('\n')}`);
