import { ConjugationError, conjugate } from '../../src/index.js';
import type { ConjugationOptions, ConjugationResult, PartRole, ResolvedTarget } from '../../src/index.js';

export type CharacterizationQuery = { readonly language: 'fr' | 'nl'; readonly infinitive: string } & Readonly<Record<string, unknown>>;

/** One recorded, sourced difference between the frozen output and the current engine output. */
export interface IntendedDiff {
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

function analysisLine(result: ConjugationResult): string {
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
 */
export function characterize(query: CharacterizationQuery): string[] {
  const header = queryHeader(query);
  let result: ConjugationResult;
  try {
    result = conjugate(query as unknown as ConjugationOptions);
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
