import type { Agreement, ConjugatedForm, DutchPronoun, Gender, Language, Mood, Person, ResolvedTarget, Tense } from '../../src/types.js';

export const corpusRevision = '3a9a01de3982049f9267326b4a4bd94f468d9439';
export const corpusBasePath = 'code/VerbodromeX.Database.Parsers/SourceFiles';

export interface CorpusCell {
  readonly target: Pick<ResolvedTarget, 'mood' | 'tense' | 'person' | 'number' | 'agreement'>;
  readonly original: string;
  readonly expected: readonly string[];
  readonly sourceUnavailable: boolean;
  readonly construction: string | null;
  readonly availabilityMarker: 'dash' | 'notused' | null;
  readonly pronoun: DutchPronoun | null;
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
  readonly pattern: 'default' | 'second';
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
  readonly checksum: string;
}

export interface CorpusManifest {
  readonly revision: string;
  readonly files: readonly Omit<CorpusFile, 'cells'>[];
  /** One entry per language that has corpus data, in `corpusLanguages` order. */
  readonly fixtures: Readonly<Partial<Record<Language, CorpusStats>>>;
  readonly corrections: { readonly count: number; readonly checksum: string };
}

export function summarizeCorpus(files: readonly CorpusFile[], corrections: readonly CorpusCorrection[]): Omit<CorpusStats, 'checksum'> {
  const ledger = new Map(corrections.map(correction => [`${correction.file}:${correction.cell}`, correction]));
  const targets = new Set<string>();
  let cells = 0;
  let unavailableCells = 0;
  let expectedForms = 0;
  let correctionCount = 0;
  for (const file of files) for (const [index, cell] of file.cells.entries()) {
    const correction = ledger.get(`${file.file}:${index}`);
    const target = correction?.correctedTarget ?? cell.target;
    targets.add(JSON.stringify([
      file.file, target.mood, target.tense, target.person, target.number,
      target.agreement?.gender ?? null, target.agreement?.number ?? null,
    ]));
    cells++;
    if (correction) correctionCount++;
    if (correction?.unavailable ?? cell.sourceUnavailable) unavailableCells++;
    else {
      const expected = correction?.expected ?? cell.expected;
      if (!expected.length) throw new Error(`Unaccounted available cell: ${file.file}:${index}.`);
      expectedForms += expected.length;
    }
  }
  return {
    files: files.length, baseInfinitives: new Set(files.map(file => file.infinitive)).size,
    cells, targets: targets.size, availableCells: cells - unavailableCells, unavailableCells,
    expectedForms, correctionCount,
    templatePlaceholders: files.reduce((count, file) => count + file.templatePlaceholders, 0),
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

export function corpusCell(mood: Mood, tense: Tense, original: string, index: number, agreement: Agreement | null = null, construction: string | null = null, notused = false, pronoun: DutchPronoun | null = null): CorpusCell {
  const finite = !['infinitive', 'participle', 'gerund'].includes(mood);
  const person: Person | null = finite ? ((index % 3) === 0 ? 1 : (index % 3) === 1 ? 2 : 3) : null;
  return {
    target: { mood, tense, person, number: finite ? (index < 3 ? 'singular' : 'plural') : null, agreement },
    original, expected: alternatives(original), sourceUnavailable: original === '-' || notused, construction,
    availabilityMarker: notused ? 'notused' : original === '-' ? 'dash' : null,
    pronoun,
  };
}

/**
 * Everything one language contributes to the corpus tooling. The import script (plain Node, no engine at runtime)
 * uses `directory` through `correction`; the corpus test also uses `query` and `applicable`, which run the engine.
 * Implementations may import engine types but never engine code.
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
  /** Engine queries whose generated forms, taken together, cover a fixture file. */
  query(file: CorpusFile): readonly Record<string, unknown>[];
  /** Which of the forms already matching the cell's (corrected) target answer the cell. */
  applicable(file: CorpusFile, cell: CorpusCell, forms: readonly ConjugatedForm[]): readonly ConjugatedForm[];
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
