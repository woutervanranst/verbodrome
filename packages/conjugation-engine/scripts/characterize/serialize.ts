import { gunzipSync, gzipSync } from 'node:zlib';
import { ConjugationError, conjugate } from '../../src/index.js';
import type { ConjugationResult, Engine, PartRole, ResolvedTarget } from '../../src/index.js';

export type CharacterizationQuery = { readonly language: 'fr' | 'nl'; readonly infinitive: string } & Readonly<Record<string, unknown>>;

/**
 * One recorded, sourced difference between the frozen output and the current engine output, in one of three forms:
 * a line-level entry (`LineDiff`) changes one line of a frozen block; a block-level entry (`BlockDiff`) supersedes the
 * whole frozen block by the block with the same header in `tests/characterization/<language>.accepted.tsv.gz`; a
 * sentence-level entry (`SentenceDiff`) rewords or removes one assumption sentence in the analysis line of every frozen
 * block that has it.
 */
export type IntendedDiff = LineDiff | BlockDiff | SentenceDiff;

/** A line-level entry: one line of the frozen block of `query` replaced, removed or added. */
export interface LineDiff {
  /** The header line of the query the difference belongs to. */
  readonly query: string;
  /** The frozen line, or null when the line is new. */
  readonly was: string | null;
  /** The line that replaces it, or null when the line is removed. */
  readonly now: string | null;
  /**
   * Only for an added line (`was: null`): the existing line it goes directly after, or null for the start of the forms
   * section (directly after the analysis line). Absent, the line goes at the end of the block. A reorder is a removal
   * plus an insertion.
   */
  readonly after?: string | null;
  readonly reason: string;
  readonly source: string;
}

/**
 * A block-level entry: the whole frozen block of `query` is superseded by the accepted block with the same header,
 * written by `npm run characterize:accept` from the current engine. For a change that touches most lines of a block.
 */
export interface BlockDiff {
  /** The header line of the query whose block is superseded. */
  readonly query: string;
  readonly block: true;
  readonly reason: string;
  readonly source: string;
}

/**
 * A sentence-level entry: in the analysis (`A`) line of every frozen block that lists the assumption sentence `was`,
 * that sentence becomes `now`, or is removed when `now` is null. For a sentence reworded throughout the snapshot; it must
 * apply to at least one block.
 */
export interface SentenceDiff {
  readonly sentence: { readonly was: string; readonly now: string | null };
  readonly reason: string;
  readonly source: string;
}

/** Whether a ledger entry is block-level. */
export function isBlockDiff(entry: IntendedDiff): entry is BlockDiff {
  return 'block' in entry && entry.block === true;
}

/** Whether a ledger entry is sentence-level. */
export function isSentenceDiff(entry: IntendedDiff): entry is SentenceDiff {
  return 'sentence' in entry;
}

/** The analysis line `line` with the assumption sentence `was` replaced by `now` (removed when null), or null when it does not list `was`. */
export function replaceSentence(line: string, was: string, now: string | null): string | null {
  if (!line.startsWith('A\t')) return null;
  const cells = line.split('\t');
  const sentences = cells[6] === '-' || cells[6] === undefined ? [] : cells[6].split(' | ');
  if (!sentences.includes(was)) return null;
  const next = sentences.flatMap(sentence => (sentence === was ? (now === null ? [] : [now]) : [sentence]));
  cells[6] = next.length ? next.join(' | ') : '-';
  return cells.join('\t');
}

const ROLE_LETTER: Readonly<Record<PartRole, string>> = {
  moodMarker: 'm', subject: 's', reflexivePronoun: 'r', auxiliary: 'a', lexicalVerb: 'v', particle: 'p', linker: 'l',
};

function sortKeys(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(sortKeys);
  if (value !== null && typeof value === 'object') {
    return Object.fromEntries(Object.entries(value).sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0)).map(([key, item]) => [key, sortKeys(item)]));
  }
  return value;
}

/** The header line of a query block: `# ` followed by the query as JSON with keys sorted recursively. */
export function queryHeader(query: CharacterizationQuery): string {
  return `# ${JSON.stringify(sortKeys(query))}`;
}

/** `-` stands for null, an undefined value and an empty list. */
const cell = (value: string | number | null | undefined): string => (value === null || value === undefined || value === '' ? '-' : String(value));
const list = (values: readonly string[], separator: string): string => (values.length ? values.join(separator) : '-');

function targetCells(target: ResolvedTarget): string {
  const agreement = target.agreement ? `${target.agreement.gender}.${target.agreement.number}` : null;
  return [target.mood, target.tense, target.person, target.number, target.gender, agreement].map(cell).join('/');
}

/** The `A` line of a block: the verb id and the analysis of a result. */
export function analysisLine(result: Pick<ConjugationResult, 'verbId' | 'analysis'>): string {
  const { analysis } = result;
  return ['A', result.verbId, analysis.classification, analysis.classificationSource, analysis.reflexive ? 1 : 0,
    list(analysis.auxiliaries, ','), list(analysis.assumptions, ' | ')].map(cell).join('\t');
}

function formLine(form: ConjugationResult['forms'][number]): string {
  const { variant } = form;
  return ['F', targetCells(form.target), form.text, form.parts.map(part => ROLE_LETTER[part.role]).join(''), variant.orthography,
    variant.auxiliary, variant.pattern, variant.usage, variant.condition, form.preferred ? 1 : 0].map(cell).join('\t');
}

/**
 * Serializes the complete output of `conjugate` for one query as the lines of one block:
 * the header, the analysis, every form in engine order, every unavailable target.
 * A `ConjugationError` becomes a single `E` line; any other exception propagates.
 * `engine` is the package's default engine unless another is given (a test may pass one of its own).
 */
export function characterize(query: CharacterizationQuery, engine: Pick<Engine, 'conjugate'> = { conjugate }): string[] {
  const header = queryHeader(query);
  let result: ConjugationResult;
  try {
    result = engine.conjugate(query);
  } catch (error) {
    if (error instanceof ConjugationError) return [header, `E\t${error.code}`];
    throw error;
  }
  return [
    header,
    analysisLine(result),
    ...result.forms.map(formLine),
    ...result.unavailableTargets.map(item => ['U', targetCells(item.target).split('/').slice(0, 4).join('/'), item.reason].join('\t')),
  ];
}

/** The bytes of a snapshot file: its blocks, separated by a blank line, gzipped at level 9 (the same bytes for the same blocks). */
export function snapshotFile(blocks: readonly (readonly string[])[]): Buffer {
  return gzipSync(`${blocks.map(lines => lines.join('\n')).join('\n\n')}\n`, { level: 9 });
}

/** The blocks of a snapshot file, keyed by header line; a header that occurs twice is an error. */
export function snapshotBlocks(file: Uint8Array): Map<string, string[]> {
  const blocks = new Map<string, string[]>();
  for (const block of gunzipSync(file).toString('utf8').split('\n\n')) {
    const lines = block.replace(/\n$/u, '').split('\n');
    const header = lines[0] ?? '';
    if (blocks.has(header)) throw new Error(`Snapshot has two blocks for ${header}`);
    blocks.set(header, lines);
  }
  return blocks;
}
