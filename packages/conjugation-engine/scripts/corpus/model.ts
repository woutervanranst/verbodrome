import type { Voice } from '../../src/core/grammar.js';
import type { Agreement, ConjugatedForm, FormVariant, Gender, GrammaticalNumber, Language, Mood, Person, ResolvedTarget, Tense } from '../../src/types.js';

export const corpusRevision = '3a9a01de3982049f9267326b4a4bd94f468d9439';
export const corpusBasePath = 'code/VerbodromeX.Database.Parsers/SourceFiles';

/** The page's own label of a variant: a named pattern and/or a region. */
export interface CorpusCellVariant {
  readonly pattern?: string;
  readonly region?: string;
}

export interface CorpusCell {
  readonly target: Pick<ResolvedTarget, 'mood' | 'tense' | 'person' | 'number' | 'agreement'>;
  readonly original: string;
  readonly expected: readonly string[];
  readonly sourceUnavailable: boolean;
  readonly construction: string | null;
  readonly availabilityMarker: 'dash' | 'notused' | null;
  /** The subject pronoun the page prints with the form, when the language has pronoun options (Dutch `het`); otherwise null. */
  readonly pronoun: string | null;
  // The fields below are omitted from the JSON when absent, so fixtures that predate them stay byte-identical.
  readonly voice?: Voice;
  /** The id of the pack's subject slot this cell answers (`1sg`, `2.formal`, ...). */
  readonly subject?: string;
  /** The page's own variant label for this cell (a named pattern, a region); how it narrows the engine's forms is the language's `applicable`. */
  readonly variant?: CorpusCellVariant;
  /** `unmodelled`: the cell is counted but never compared with the engine; `reason` is a key of `CorpusLanguage.unmodelled`. */
  readonly scope?: 'unmodelled';
  readonly reason?: string;
  /** The page's heading path above this cell, set on cells a remap corrects (the audit trail). */
  readonly heading?: string;
}

export interface ParsedCorpus {
  readonly cells: readonly CorpusCell[];
  readonly templatePlaceholders: number;
}

export interface CorpusFile {
  readonly file: string;
  readonly language: Language;
  readonly infinitive: string;
  readonly gender: Gender | null;
  readonly auxiliary: string | null;
  /** `'default'` for an ordinary file; otherwise the name of the page variant (French `second`). */
  readonly pattern: string;
  readonly templatePlaceholders: number;
  readonly cells: readonly CorpusCell[];
}

export interface CorpusCorrection {
  readonly file: string;
  readonly cell: number;
  readonly original: string;
  readonly expected: readonly string[];
  readonly unavailable: boolean;
  readonly reason: string;
  readonly source: string;
  readonly target: CorpusCell['target'];
  readonly correctedTarget: CorpusCell['target'] | null;
}

export interface CorpusStats {
  readonly files: number;
  readonly baseInfinitives: number;
  readonly cells: number;
  readonly targets: number;
  readonly availableCells: number;
  readonly unavailableCells: number;
  readonly expectedForms: number;
  readonly correctionCount: number;
  readonly templatePlaceholders: number;
  /** Cells with `scope: 'unmodelled'`; omitted when zero. `availableCells + unavailableCells + unmodelledCells = cells`. */
  readonly unmodelledCells?: number;
  /** Number of remaps the language declares; omitted when zero. */
  readonly remaps?: number;
  readonly checksum: string;
}

/** What a remap corrects: mood and tense always, and any of person, number, subject slot and voice that the page also gets wrong. */
export interface CorpusRemapTarget {
  readonly mood: Mood;
  readonly tense: Tense;
  readonly person?: Person | null;
  readonly number?: GrammaticalNumber | null;
  readonly subject?: string;
  readonly voice?: Voice;
}

/**
 * A fix for a page whose headings are wrong, applied when the page is parsed. A "run" is a stretch of consecutive
 * cells whose `heading` is `heading`; `occurrence` is the 0-based index of the run among the runs of that heading in
 * the file (a heading printed twice on a page gives runs 0 and 1), or `'all'` for every run. Every cell in the run
 * takes the fields `target` names (person, number, subject and voice only when given, so the others stay as parsed).
 * The fixture stores the corrected target; `tests/fixtures/remaps.json` records the remap with its reason.
 */
export interface CorpusRemap {
  readonly heading: string;
  readonly occurrence: number | 'all';
  readonly target: CorpusRemapTarget;
  /** Why the page is wrong, longer than 30 characters. */
  readonly reason: string;
  /** An `https://` authority for the corrected target. */
  readonly source: string;
}

/** A run of a remapped heading the language leaves alone on purpose, with the reason (longer than 30 characters). */
export interface CorpusUnremapped {
  readonly heading: string;
  readonly occurrence: number;
  readonly reason: string;
}

/** A remap as written to `remaps.json`. */
export interface CorpusRemapRecord extends CorpusRemap {
  readonly language: Language;
}

export interface CorpusManifest {
  readonly revision: string;
  readonly files: readonly Omit<CorpusFile, 'cells'>[];
  /** One entry per language that has corpus data, in `corpusLanguages` order. */
  readonly fixtures: Readonly<Partial<Record<Language, CorpusStats>>>;
  readonly corrections: { readonly count: number; readonly checksum: string };
}

export function summarizeCorpus(files: readonly CorpusFile[], corrections: readonly CorpusCorrection[], remaps: readonly CorpusRemapRecord[] = []): Omit<CorpusStats, 'checksum'> {
  const ledger = new Map(corrections.map(correction => [`${correction.file}:${correction.cell}`, correction]));
  const targets = new Set<string>();
  let cells = 0;
  let unavailableCells = 0;
  let expectedForms = 0;
  let correctionCount = 0;
  let unmodelledCells = 0;
  for (const file of files) for (const [index, cell] of file.cells.entries()) {
    const correction = ledger.get(`${file.file}:${index}`);
    const target = correction?.correctedTarget ?? cell.target;
    targets.add(JSON.stringify([
      file.file, target.mood, target.tense, target.person, target.number,
      target.agreement?.gender ?? null, target.agreement?.number ?? null,
      target.agreement?.case ?? null, cell.voice ?? null, cell.subject ?? null,
    ]));
    cells++;
    if (correction) correctionCount++;
    // Unmodelled cells are their own partition: neither available nor unavailable, and they bring no form expectations.
    if (cell.scope === 'unmodelled') unmodelledCells++;
    else if (correction?.unavailable ?? cell.sourceUnavailable) unavailableCells++;
    else {
      const expected = correction?.expected ?? cell.expected;
      if (!expected.length) throw new Error(`Unaccounted available cell: ${file.file}:${index}.`);
      expectedForms += expected.length;
    }
  }
  return {
    files: files.length, baseInfinitives: new Set(files.map(file => file.infinitive)).size,
    cells, targets: targets.size, availableCells: cells - unavailableCells - unmodelledCells, unavailableCells,
    expectedForms, correctionCount,
    templatePlaceholders: files.reduce((count, file) => count + file.templatePlaceholders, 0),
    ...unmodelledCells ? { unmodelledCells } : {},
    ...remaps.length ? { remaps: remaps.length } : {},
  };
}

export function normalizeText(text: string): string {
  return text.normalize('NFC').replace(/[’ʼ]/gu, "'").replace(/\s+/gu, ' ').trim();
}

export function alternatives(text: string): string[] {
  if (!text || text === '-') return [];
  const words = text.replace(/;\s+/gu, ';').split(' ');
  if (words.filter(word => /[;/]/u.test(word)).length > 1) {
    throw new Error(`Correlated alternatives need an explicit source interpretation: ${text}`);
  }
  let results = [''];
  for (const word of words) {
    const variants = word.split(/[;/]/u);
    const prefix = variants[0]?.match(/^(.*')/u)?.[1] ?? '';
    const expanded = variants.map((variant, i) => i > 0 && prefix && !variant.includes("'") ? prefix + variant : variant);
    results = results.flatMap(result => expanded.map(variant => normalizeText(`${result} ${variant}`)));
  }
  return [...new Set(results)];
}

/** The infinitive a source file name starts with: the part before the first `_`, without `.html`, normalised. */
export function infinitiveFromFileName(name: string): string {
  return normalizeText(name.replace(/\.html$/u, '').split('_')[0] ?? '');
}

export interface CorpusCellFields {
  readonly mood: Mood;
  readonly tense: Tense;
  /** The text the page prints; `'-'` for an empty cell. */
  readonly original: string;
  /** Position within the table's six (or three, or one) rows; gives person and number of a finite cell. */
  readonly index: number;
  readonly agreement?: Agreement | null | undefined;
  readonly construction?: string | null | undefined;
  /** The page marks the cell as not used (as opposed to a dash). */
  readonly notused?: boolean | undefined;
  readonly pronoun?: string | null | undefined;
  /** The expected forms when the page does not use the `a/b` and `a; b` alternative notation (German rows, for one). */
  readonly expected?: readonly string[] | undefined;
  readonly voice?: Voice | undefined;
  readonly subject?: string | undefined;
  readonly variant?: CorpusCellVariant | undefined;
  readonly scope?: 'unmodelled' | undefined;
  readonly reason?: string | undefined;
  readonly heading?: string | undefined;
}

/** Builds a cell; person and number of a finite cell come from `index` (0-2 singular, 3-5 plural, persons 1-3). Optional fields are omitted when absent. */
export function corpusCell(fields: CorpusCellFields): CorpusCell {
  const { mood, tense, original, index, agreement = null, construction = null, notused = false, pronoun = null } = fields;
  if ((fields.scope === undefined) !== (fields.reason === undefined)) {
    throw new Error(`A cell has a scope and a reason together or neither: ${original}.`);
  }
  const finite = !['infinitive', 'participle', 'gerund'].includes(mood);
  const person: Person | null = finite ? ((index % 3) === 0 ? 1 : (index % 3) === 1 ? 2 : 3) : null;
  return {
    target: { mood, tense, person, number: finite ? (index < 3 ? 'singular' : 'plural') : null, agreement },
    original, expected: fields.expected ? [...new Set(fields.expected)] : alternatives(original), sourceUnavailable: original === '-' || notused, construction,
    availabilityMarker: notused ? 'notused' : original === '-' ? 'dash' : null,
    pronoun,
    ...fields.voice ? { voice: fields.voice } : {},
    ...fields.subject ? { subject: fields.subject } : {},
    ...fields.variant ? { variant: fields.variant } : {},
    ...fields.scope ? { scope: fields.scope } : {},
    ...fields.reason ? { reason: fields.reason } : {},
    ...fields.heading ? { heading: fields.heading } : {},
  };
}

/** The runs of consecutive cells whose heading is `heading`, as indices, in page order. */
export function headingRuns(cells: readonly CorpusCell[], heading: string): number[][] {
  const runs: number[][] = [];
  let previous: string | undefined;
  for (const [index, cell] of cells.entries()) {
    if (cell.heading === heading) {
      if (previous === heading) runs[runs.length - 1]?.push(index);
      else runs.push([index]);
    }
    previous = cell.heading;
  }
  return runs;
}

/** Indices of the cells in the `occurrence`th run (from 0) of the heading, or in every run for `'all'`; empty when there is no such run. */
export function remapRun(cells: readonly CorpusCell[], heading: string, occurrence: number | 'all'): number[] {
  const runs = headingRuns(cells, heading);
  return occurrence === 'all' ? runs.flat() : runs[occurrence] ?? [];
}

/** Applies the remaps in order; `matched[i]` tells whether remap `i` found any cell in these cells. */
export function applyRemaps(cells: readonly CorpusCell[], remaps: readonly CorpusRemap[]): { cells: CorpusCell[]; matched: boolean[] } {
  const result = [...cells];
  const matched = remaps.map(remap => {
    const run = remapRun(cells, remap.heading, remap.occurrence);
    const { mood, tense, person, number, subject, voice } = remap.target;
    for (const index of run) {
      const cell = result[index];
      if (!cell) continue;
      result[index] = {
        ...cell,
        target: { ...cell.target, mood, tense, ...person !== undefined ? { person } : {}, ...number !== undefined ? { number } : {} },
        ...subject !== undefined ? { subject } : {},
        ...voice !== undefined ? { voice } : {},
      };
    }
    return run.length > 0;
  });
  return { cells: result, matched };
}

/**
 * The runs of a remapped heading that no remap covers and the language does not list as intentionally unremapped:
 * a heading some remap names has every one of its runs either remapped (its `occurrence`, or `'all'`) or exempted.
 */
export function uncoveredRuns(
  cells: readonly CorpusCell[], remaps: readonly CorpusRemap[], unremapped: readonly CorpusUnremapped[],
): { heading: string; occurrence: number }[] {
  const uncovered: { heading: string; occurrence: number }[] = [];
  for (const heading of new Set(remaps.map(remap => remap.heading))) {
    for (const occurrence of headingRuns(cells, heading).keys()) {
      const covered = remaps.some(remap => remap.heading === heading && (remap.occurrence === 'all' || remap.occurrence === occurrence))
        || unremapped.some(exempt => exempt.heading === heading && exempt.occurrence === occurrence);
      if (!covered) uncovered.push({ heading, occurrence });
    }
  }
  return uncovered;
}

/** True when the variant carries a label that sets a form apart from the default one: a pattern, a region, a non-standard usage or an orthography other than `both`. */
export function hasVariantTag(variant: FormVariant): boolean {
  return variant.pattern !== null || (variant.region ?? null) !== null || variant.usage !== 'standard' || variant.orthography !== 'both';
}

/**
 * The forms beyond the expected ones that carry no variant tag; the guard for languages with `requireTaggedExtras`
 * wants none. An extra is looked for only among the forms that share a resolved target (`targetId`, the engine's
 * `resolvedTargetKey`: it includes gender, agreement, voice and subject) with a form whose text is expected, so forms
 * of another gender or subject in the same cell are not extras. `accepts` excuses the extras a language has reviewed
 * (`CorpusLanguage.acceptsUntagged`).
 */
export function untaggedExtras(
  forms: readonly ConjugatedForm[], expected: readonly string[], targetId: (target: ResolvedTarget) => string,
  accepts: (form: ConjugatedForm) => boolean = () => false,
): ConjugatedForm[] {
  const answered = new Set(forms.filter(form => expected.includes(form.text)).map(form => targetId(form.target)));
  return forms.filter(form => answered.has(targetId(form.target)) && !expected.includes(form.text) && !hasVariantTag(form.variant) && !accepts(form));
}

export interface CellVerdict {
  readonly satisfied: boolean;
  /** Expected forms that no candidate has (available cell). */
  readonly missing: string[];
  /** Candidate texts of a cell that should have none (unavailable cell). */
  readonly unexpected: string[];
}

/** An available cell is satisfied when every expected form is the text of a candidate; an unavailable cell when there is no candidate. */
export function cellSatisfied(candidates: readonly ConjugatedForm[], expected: readonly string[], unavailable: boolean): CellVerdict {
  const texts = new Set(candidates.map(form => form.text));
  const missing = unavailable ? [] : expected.filter(text => !texts.has(text));
  const unexpected = unavailable ? [...texts] : [];
  return { satisfied: !missing.length && !unexpected.length, missing, unexpected };
}

/**
 * The forms that can answer a cell: for every query label, `applicable` narrows the forms that query generated for the
 * cell's target, and the results are taken together. A query whose `applicable` returns nothing contributes nothing.
 */
export function candidateForms(
  language: Pick<CorpusLanguage, 'applicable'>, file: CorpusFile, cell: CorpusCell, byLabel: ReadonlyMap<string, readonly ConjugatedForm[]>,
): ConjugatedForm[] {
  return [...byLabel].flatMap(([label, forms]) => language.applicable(file, cell, forms, label));
}

/** One engine query the corpus test runs for a file: `options` go through `parseConjugationOptions`, `label` is unique within the file. */
export interface CorpusQuery {
  readonly label: string;
  readonly options: Record<string, unknown>;
}

/**
 * Everything one language contributes to the corpus tooling. The import script (plain Node, no engine at runtime)
 * uses `directory` through `correction`, `remaps` and `unmodelled`; the corpus test also uses `query`, `applicable` and
 * `requireTaggedExtras`, which run the engine. Implementations may import engine types but never engine code.
 *
 * How the test compares a cell (a cell with `scope: 'unmodelled'` is counted but skipped):
 * 1. Every query of `query(file)` is run, once per file; labels must be unique and non-empty.
 * 2. For each query, the forms it generated are narrowed to the cell's (corrected) target, voice and subject, and to
 *    the cell's agreement (gender, number and case, compared field by field) when it has one. This generic match stays
 *    in the test (`targetKey` is engine code).
 * 3. `applicable(file, cell, forms, label)` is called once per query with those forms and returns the ones that answer
 *    the cell (return `forms` unchanged to accept them all, `[]` to reject the cell for that query). The candidates
 *    of the cell are the results of all labels taken together: a query whose `applicable` returns nothing contributes
 *    nothing, so a cell is never satisfied by a form from a query that rejects it.
 * 4. An available cell is satisfied when every expected form is the text of a candidate; an unavailable cell when
 *    there is no candidate at all.
 * 5. With `requireTaggedExtras`, every candidate beyond the expected forms must carry a variant tag
 *    (`hasVariantTag`) or be one the language's `acceptsUntagged` excuses; any other untagged extra fails the cell.
 *    Only candidates that share a resolved target (gender, agreement, voice and subject included) with a form whose
 *    text is expected are looked at, so a form of another gender or subject in the same cell (Italian `sono andato` /
 *    `sono andata`) is not an extra.
 *
 * Remaps and unmodelled cells: a cell with `scope: 'unmodelled'` is counted but skipped by the comparison; it is its
 * own partition of the accounting (`available + unavailable + unmodelled = cells`). A remap's `occurrence` is the
 * 0-based index of a run of consecutive cells carrying its `heading` (or `'all'`); the audit fails for a run of a
 * remapped heading that is neither remapped nor listed in `unremapped`.
 */
export interface CorpusLanguage {
  readonly language: Language;
  /** Directory under `corpusBasePath` in the pinned checkout. */
  readonly directory: string;
  /** TextDecoder label, decoded with `fatal: true`. */
  readonly encoding: string;
  readonly expectedFiles: number;
  readonly cellsPerFile: number;
  parse(html: string, name: string): ParsedCorpus;
  /** Neutral fixture identity from a source file name. */
  context(name: string): Pick<CorpusFile, 'infinitive' | 'gender' | 'auxiliary' | 'pattern'>;
  correction(file: CorpusFile, cell: CorpusCell, index: number): CorpusCorrection | null;
  /** Fixes for wrong page headings, applied by the importer right after `parse` (see `CorpusRemap`); written to `remaps.json`. */
  readonly remaps?: readonly CorpusRemap[];
  /** Runs of a remapped heading that are deliberately left as the page prints them; every other run of a remapped heading must be remapped (`uncoveredRuns`). */
  readonly unremapped?: readonly CorpusUnremapped[];
  /** Reason codes of cells with `scope: 'unmodelled'` mapped to what the source shows that the engine does not model. Every code must be used. */
  readonly unmodelled?: Readonly<Record<string, string>>;
  /** Opt in to the extra-forms guard (step 5). French and Dutch do not: their fixtures predate it. */
  readonly requireTaggedExtras?: boolean;
  /**
   * The untagged extras the guard (step 5) excuses for this language: forms reviewed one by one, which the language's
   * own tests pin. Absent: none.
   */
  acceptsUntagged?(form: ConjugatedForm, file: CorpusFile): boolean;
  /**
   * The fixtures carry no subject ids: the source pages have no subject slots (French and Dutch), so a cell answers the
   * forms of its person and number whichever slot the engine gives them. Without it, a cell must name its slot.
   */
  readonly fixturesWithoutSubjects?: boolean;
  /** Labelled engine queries whose forms, taken together (step 3), cover every modelled cell of a fixture file. */
  query(file: CorpusFile): readonly CorpusQuery[];
  /** Which of the forms of query `label` that already match the cell's target answer the cell (step 3). */
  applicable(file: CorpusFile, cell: CorpusCell, forms: readonly ConjugatedForm[], label: string): readonly ConjugatedForm[];
}

/** Accumulates the edits one language makes to a cell; `finish` yields the ledger record, or null when nothing changed. */
export interface CorrectionDraft {
  expected: string[];
  unavailable: boolean;
  correctedTarget: CorpusCell['target'] | null;
  /** Rewrites every expected form; records the reason only when the result differs. */
  change(reason: string, url: string, transform: (text: string) => string): void;
  markUnavailable(reason: string, url: string): void;
  /** Records a reason and source for an edit made directly on the draft's fields. */
  note(reason: string, url: string): void;
  finish(): CorpusCorrection | null;
}

export function startCorrection(file: CorpusFile, cell: CorpusCell, index: number): CorrectionDraft {
  const reasons: string[] = [];
  let source = '';
  const draft: CorrectionDraft = {
    expected: [...cell.expected],
    unavailable: cell.sourceUnavailable,
    correctedTarget: null,
    change(reason, url, transform) {
      const corrected = draft.expected.map(transform);
      if (JSON.stringify(corrected) !== JSON.stringify(draft.expected)) {
        draft.expected = corrected;
        reasons.push(reason);
        source = url;
      }
    },
    markUnavailable(reason, url) {
      if (!draft.unavailable) {
        draft.expected = [];
        draft.unavailable = true;
        reasons.push(reason);
        source = url;
      }
    },
    note(reason, url) {
      reasons.push(reason);
      source = url;
    },
    finish() {
      return reasons.length ? {
        file: file.file, cell: index, original: cell.original, expected: draft.expected, unavailable: draft.unavailable,
        reason: reasons.join(' '), source, target: cell.target, correctedTarget: draft.correctedTarget,
      } : null;
    },
  };
  return draft;
}
