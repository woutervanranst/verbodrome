import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { conjugate, parseConjugationOptions } from '../src/index.js';
import { resolvedTargetKey, targetKey } from '../src/catalogue.js';
import { candidateForms, cellSatisfied, corpusRevision, hasVariantTag, remapRun, summarizeCorpus, uncoveredRuns, untaggedExtras } from '../scripts/corpus/model.ts';
import type { CorpusCell, CorpusCorrection, CorpusFile, CorpusLanguage, CorpusManifest, CorpusRemapRecord } from '../scripts/corpus/model.ts';
import { corpusLanguages } from '../scripts/corpus/languages/index.ts';
import type { ConjugatedForm, FormVariant, Language, ResolvedTarget } from '../src/types.js';

/** Pinned accounting per corpus language; a corpus language missing here fails the test. */
const pinned: Readonly<Partial<Record<Language, {
  files: number; infinitives: number; cells: number; modelled: number; unmodelled: number; placeholders: number; remaps: number;
}>>> = {
  fr: { files: 222, infinitives: 84, cells: 26_196, modelled: 26_196, unmodelled: 0, placeholders: 0, remaps: 0 },
  nl: { files: 207, infinitives: 207, cells: 10_764, modelled: 10_764, unmodelled: 0, placeholders: 1_030, remaps: 0 },
  en: { files: 145, infinitives: 145, cells: 18_270, modelled: 18_270, unmodelled: 0, placeholders: 435, remaps: 3 },
  de: { files: 139, infinitives: 139, cells: 12_788, modelled: 12_788, unmodelled: 0, placeholders: 0, remaps: 5 },
  es: { files: 89, infinitives: 89, cells: 11_036, modelled: 11_036, unmodelled: 0, placeholders: 356, remaps: 6 },
  it: { files: 20, infinitives: 20, cells: 1_920, modelled: 1_900, unmodelled: 20, placeholders: 20, remaps: 3 },
  la: { files: 18, infinitives: 18, cells: 3_330, modelled: 3_312, unmodelled: 18, placeholders: 819, remaps: 0 },
};

const read = (name: string): string => readFileSync(new URL(`./fixtures/${name}.json`, import.meta.url), 'utf8');
const manifest = JSON.parse(read('manifest')) as CorpusManifest;
const files = corpusLanguages.flatMap(language => JSON.parse(read(language.language)) as CorpusFile[]);
const corrections = JSON.parse(read('corrections')) as CorpusCorrection[];
const remapRecords = JSON.parse(read('remaps')) as CorpusRemapRecord[];
const ledger = new Map(corrections.map(correction => [`${correction.file}:${correction.cell}`, correction]));
const languageOf = (file: CorpusFile) => {
  const language = corpusLanguages.find(candidate => candidate.language === file.language);
  if (!language) throw new Error(`No corpus language for ${file.file}.`);
  return language;
};

/**
 * Forms generated for the cell's (corrected) grammatical target, voice and subject; the language narrows them further.
 * For a language whose fixtures carry no subject ids (`fixturesWithoutSubjects`), a cell without one answers the forms
 * of its person and number whichever slot the engine gives them; otherwise the slot must match too.
 */
function targetForms(language: Pick<CorpusLanguage, 'fixturesWithoutSubjects'>, target: CorpusCell['target'], cell: CorpusCell, forms: readonly ConjugatedForm[]): ConjugatedForm[] {
  const wanted: ResolvedTarget = {
    ...target, gender: null,
    ...(cell.voice ? { voice: cell.voice } : {}),
    ...(cell.subject ? { subject: cell.subject } : {}),
  };
  const anySlot = language.fixturesWithoutSubjects === true && cell.subject === undefined;
  const keyOf = (form: ConjugatedForm): string => {
    if (!anySlot) return targetKey(form.target);
    const { subject: _, ...withoutSubject } = form.target;
    return targetKey(withoutSubject);
  };
  return forms.filter(form => {
    if (keyOf(form) !== targetKey(wanted)) return false;
    const agreement = form.target.agreement;
    return !target.agreement || (agreement !== null && agreement.gender === target.agreement.gender
      && agreement.number === target.agreement.number && agreement.case === target.agreement.case);
  });
}

describe('complete pinned corpus accounting', () => {
  it('retains every file, grammatical cell, template placeholder, and fixture checksum', () => {
    expect(manifest.revision).toBe(corpusRevision);
    const total = corpusLanguages.reduce((sum, language) => sum + (pinned[language.language]?.files ?? 0), 0);
    expect(manifest.files).toHaveLength(total);
    expect(files).toHaveLength(total);
    expect(new Set(files.map(file => file.file)).size).toBe(total);
    for (const language of corpusLanguages) {
      const pins = pinned[language.language];
      expect(pins, `${language.language} has no pinned accounting`).toBeDefined();
      const stats = manifest.fixtures[language.language];
      expect(stats, `${language.language} is missing from the manifest`).toBeDefined();
      if (!pins || !stats) continue;
      const subset = files.filter(file => file.language === language.language);
      expect(language.expectedFiles).toBe(pins.files);
      expect(subset).toHaveLength(pins.files);
      expect(new Set(subset.map(file => file.infinitive)).size).toBe(pins.infinitives);
      expect(subset.reduce((sum, file) => sum + file.cells.length, 0)).toBe(pins.cells);
      expect(subset.reduce((sum, file) => sum + file.templatePlaceholders, 0)).toBe(pins.placeholders);
      const unmodelled = subset.reduce((sum, file) => sum + file.cells.filter(cell => cell.scope === 'unmodelled').length, 0);
      expect(unmodelled).toBe(pins.unmodelled);
      expect(pins.cells - unmodelled).toBe(pins.modelled);
      expect(stats.unmodelledCells ?? 0).toBe(pins.unmodelled);
      expect(stats.remaps ?? 0).toBe(pins.remaps);
      expect((language.remaps ?? []).length).toBe(pins.remaps);
      expect(createHash('sha256').update(read(language.language)).digest('hex')).toBe(stats.checksum);
      const remaps = remapRecords.filter(record => record.language === language.language);
      expect(summarizeCorpus(subset, corrections, remaps)).toEqual((({ checksum: _, ...rest }) => rest)(stats));
      expect(stats.availableCells + stats.unavailableCells + (stats.unmodelledCells ?? 0)).toBe(stats.cells);
      for (const file of subset) expect(file.cells).toHaveLength(language.cellsPerFile);
    }
    expect(Object.keys(manifest.fixtures)).toEqual(corpusLanguages.map(language => language.language));
    for (const file of files) {
      const { cells: _, ...metadata } = file;
      expect(manifest.files.find(entry => entry.file === file.file)).toEqual(metadata);
    }
  });

  it('keeps a reproducible sourced ledger, never silent skips or engine-generated expectations', () => {
    expect(ledger.size).toBe(corrections.length);
    expect(corrections.length).toBe(manifest.corrections.count);
    expect(createHash('sha256').update(read('corrections')).digest('hex')).toBe(manifest.corrections.checksum);
    const reproduced = files.flatMap(file => file.cells.flatMap((cell, index) => {
      const correction = languageOf(file).correction(file, cell, index);
      return correction ? [correction] : [];
    }));
    expect(reproduced).toEqual(corrections);
    for (const correction of corrections) {
      const file = files.find(file => file.file === correction.file);
      expect(file?.cells[correction.cell]?.original).toBe(correction.original);
      expect(correction.source).toMatch(/^https:\/\//u);
      expect(correction.reason.length).toBeGreaterThan(30);
    }
  });

  it('records every remap with its reason and source, and every remapped cell carries the corrected target', () => {
    expect(remapRecords).toEqual(corpusLanguages.flatMap(language => (language.remaps ?? []).map(remap => ({ language: language.language, ...remap }))));
    for (const remap of remapRecords) {
      expect(remap.source).toMatch(/^https:\/\//u);
      expect(remap.reason.length).toBeGreaterThan(30);
      expect(remap.occurrence === 'all' || (Number.isInteger(remap.occurrence) && remap.occurrence >= 0)).toBe(true);
      const { subject, voice, ...onTarget } = remap.target;
      const matched = files.filter(file => file.language === remap.language).flatMap(file => {
        const run = remapRun(file.cells, remap.heading, remap.occurrence);
        for (const index of run) {
          const cell = file.cells[index];
          expect(cell?.target, `${file.file}:${index}`).toMatchObject(onTarget);
          if (subject !== undefined) expect(cell?.subject, `${file.file}:${index}`).toBe(subject);
          if (voice !== undefined) expect(cell?.voice, `${file.file}:${index}`).toBe(voice);
        }
        return run;
      });
      expect(matched.length, `remap ${remap.heading} #${remap.occurrence} matches no cell`).toBeGreaterThan(0);
    }
  });

  it('leaves no run of a remapped heading that is neither remapped nor listed as intentionally unremapped', () => {
    for (const language of corpusLanguages) {
      for (const file of files.filter(file => file.language === language.language)) {
        expect(uncoveredRuns(file.cells, language.remaps ?? [], language.unremapped ?? []), file.file).toEqual([]);
      }
      for (const exempt of language.unremapped ?? []) expect(exempt.reason.length).toBeGreaterThan(30);
    }
  });

  it('accounts for unmodelled cells with a declared reason, and declares no unused reason', () => {
    for (const language of corpusLanguages) {
      const used = new Set<string>();
      for (const file of files.filter(file => file.language === language.language)) {
        for (const [index, cell] of file.cells.entries()) {
          if (cell.scope !== 'unmodelled') {
            expect(cell.reason, `${file.file}:${index} has a reason without the scope`).toBeUndefined();
            continue;
          }
          expect(Object.keys(language.unmodelled ?? {}), `${file.file}:${index}`).toContain(cell.reason);
          used.add(cell.reason ?? '');
        }
      }
      expect([...used].sort()).toEqual(Object.keys(language.unmodelled ?? {}).sort());
    }
  });

  it.each(files)('$file', file => {
    const language = languageOf(file);
    const queries = language.query(file);
    expect(new Set(queries.map(query => query.label)).size, `${file.file}: query labels must be unique`).toBe(queries.length);
    for (const query of queries) expect(query.label).not.toBe('');
    const generated = new Map(queries.map(query => [query.label, conjugate(parseConjugationOptions(query.options)).forms] as const));
    for (const [index, cell] of file.cells.entries()) {
      if (cell.scope === 'unmodelled') continue;
      const correction = ledger.get(`${file.file}:${index}`);
      const expected = correction?.expected ?? cell.expected;
      const unavailable = correction?.unavailable ?? cell.sourceUnavailable;
      const target = correction?.correctedTarget ?? cell.target;
      const byLabel = new Map([...generated].map(([label, forms]) => [label, targetForms(language, target, cell, forms)] as const));
      const candidates = candidateForms(language, file, cell, byLabel);
      const location = `${file.file}:${index} ${target.mood}/${target.tense}/${target.person ?? '-'}/${target.number ?? '-'} ${cell.original}`;
      if (!unavailable) expect(expected.length, location).toBeGreaterThan(0);
      const verdict = cellSatisfied(candidates, expected, unavailable);
      expect(verdict.missing, `${location}: missing ${verdict.missing.join(', ')}; generated ${candidates.map(form => form.text).join(' | ')}`).toEqual([]);
      expect(verdict.unexpected, `${location}: an unavailable cell has candidates`).toEqual([]);
      if (!unavailable && language.requireTaggedExtras) {
        const untagged = untaggedExtras(candidates, expected, resolvedTargetKey, form => language.acceptsUntagged?.(form, file) ?? false).map(form => form.text);
        expect(untagged, `${location}: generated beyond the expected forms without a variant tag`).toEqual([]);
      }
    }
  });
});

describe('how a cell is compared with the engine', () => {
  const variant: FormVariant = { orthography: 'both', auxiliary: null, pattern: null, usage: 'standard', condition: null };
  const target: ResolvedTarget = { mood: 'indicative', tense: 'present', person: 1, number: 'singular', gender: null, agreement: null };
  const form = (text: string, tags: Partial<FormVariant> = {}): ConjugatedForm => ({
    target, parts: [], variant: { ...variant, ...tags }, ruleIds: [], text, preferred: true, labels: { mood: 'indicative', tense: 'present' },
  });
  const cell: CorpusCell = {
    target, original: 'x', expected: ['x'], sourceUnavailable: false, construction: null, availabilityMarker: null, pronoun: null,
  };
  const file: CorpusFile = {
    file: 'xx/x', language: 'fr', infinitive: 'x', gender: null, auxiliary: null, pattern: 'default', templatePlaceholders: 0, cells: [cell],
  };
  const answers = (label: string): CorpusLanguage['applicable'] => (_file, _cell, forms, asked) => asked === label ? forms : [];

  it('is satisfied only by forms from queries whose applicable accepts the cell', () => {
    const byLabel = new Map([['a', [form('x')]], ['b', [form('y')]]]);
    const onlyA = candidateForms({ applicable: answers('a') }, file, cell, byLabel);
    expect(onlyA.map(candidate => candidate.text)).toEqual(['x']);
    // The form `y` came from a query that rejects the cell, so it contributes nothing.
    const onlyB = candidateForms({ applicable: answers('b') }, file, cell, byLabel);
    expect(onlyB.map(candidate => candidate.text)).toEqual(['y']);
    expect(onlyB.some(candidate => candidate.text === cell.expected[0])).toBe(false);
    expect(candidateForms({ applicable: answers('c') }, file, cell, byLabel)).toEqual([]);
  });

  it('lets a cell without a subject id answer any slot only for a language whose fixtures carry none', () => {
    const slotted: ConjugatedForm = { ...form('x'), target: { ...target, subject: '1sg' } };
    expect(targetForms({ fixturesWithoutSubjects: true }, target, cell, [slotted])).toEqual([slotted]);
    expect(targetForms({}, target, cell, [slotted])).toEqual([]);
    // A cell that names its slot answers only that slot, flag or not.
    expect(targetForms({ fixturesWithoutSubjects: true }, target, { ...cell, subject: '1sg' }, [slotted])).toEqual([slotted]);
    expect(targetForms({ fixturesWithoutSubjects: true }, target, { ...cell, subject: '3sg' }, [slotted])).toEqual([]);
  });

  it('takes the forms of every label that accepts the cell together', () => {
    const byLabel = new Map([['a', [form('x')]], ['b', [form('y')]]]);
    const both = candidateForms({ applicable: (_file, _cell, forms) => forms }, file, cell, byLabel);
    expect(both.map(candidate => candidate.text).sort()).toEqual(['x', 'y']);
  });

  it('passes the label and the narrowed forms to applicable', () => {
    const seen: string[] = [];
    candidateForms({ applicable: (_file, _cell, forms, label) => { seen.push(`${label}:${forms.map(f => f.text)}`); return forms; } }, file, cell,
      new Map([['a', [form('x'), form('z')]], ['b', []]]));
    expect(seen).toEqual(['a:x,z', 'b:']);
  });

  it('recognises non-default variant tags', () => {
    expect(hasVariantTag(variant)).toBe(false);
    expect(hasVariantTag({ ...variant, pattern: 'strong' })).toBe(true);
    expect(hasVariantTag({ ...variant, region: 'GB' })).toBe(true);
    expect(hasVariantTag({ ...variant, region: null })).toBe(false);
    expect(hasVariantTag({ ...variant, usage: 'literary' })).toBe(true);
    expect(hasVariantTag({ ...variant, usage: 'dated' })).toBe(true);
    expect(hasVariantTag({ ...variant, orthography: 'rectified' })).toBe(true);
    expect(hasVariantTag({ ...variant, orthography: 'traditional' })).toBe(true);
    // An auxiliary or a condition alone is not a variant tag of the corpus guard.
    expect(hasVariantTag({ ...variant, auxiliary: 'have', condition: 'figurative' })).toBe(false);
  });

  it('is satisfied by a cell whose every expected form is a candidate, and reports what is missing', () => {
    expect(cellSatisfied([form('x'), form('y')], ['x', 'y'], false)).toEqual({ satisfied: true, missing: [], unexpected: [] });
    expect(cellSatisfied([form('x'), form('z')], ['x'], false).satisfied).toBe(true);
    expect(cellSatisfied([form('x')], ['x', 'y'], false)).toEqual({ satisfied: false, missing: ['y'], unexpected: [] });
    expect(cellSatisfied([], ['x', 'y'], false)).toMatchObject({ satisfied: false, missing: ['x', 'y'] });
  });

  it('is satisfied by an unavailable cell only when there is no candidate', () => {
    expect(cellSatisfied([], [], true)).toEqual({ satisfied: true, missing: [], unexpected: [] });
    expect(cellSatisfied([form('x')], [], true)).toEqual({ satisfied: false, missing: [], unexpected: ['x'] });
  });

  describe('the extra-forms guard', () => {
    const inTarget = (text: string, change: Partial<ResolvedTarget>, tags: Partial<FormVariant> = {}): ConjugatedForm =>
      ({ ...form(text, tags), target: { ...target, ...change } });
    const male = { gender: 'masculine', number: 'singular' } as const;
    const female = { gender: 'feminine', number: 'singular' } as const;

    it('fails an untagged second spelling in the resolved target of an expected form', () => {
      expect(untaggedExtras([form('x'), form('y')], ['x'], resolvedTargetKey).map(extra => extra.text)).toEqual(['y']);
    });

    it('accepts a tagged second spelling, and a form that is expected', () => {
      const forms = [form('x'), form('z', { pattern: 'variant' }), form('w', { region: 'US' }), form('v', { usage: 'dated' })];
      expect(untaggedExtras(forms, ['x'], resolvedTargetKey)).toEqual([]);
      expect(untaggedExtras([form('x'), form('y')], ['x', 'y'], resolvedTargetKey)).toEqual([]);
      expect(untaggedExtras([form('x'), form('y', { region: 'GB' })], ['x', 'y'], resolvedTargetKey)).toEqual([]);
    });

    it('ignores forms that differ only in agreement gender or in subject gender', () => {
      const agreeing = [inTarget('sono andato', { agreement: male }), inTarget('sono andata', { agreement: female })];
      expect(untaggedExtras(agreeing, ['sono andato'], resolvedTargetKey)).toEqual([]);
      const gendered = [inTarget('sono andato', { gender: 'masculine' }), inTarget('sono andata', { gender: 'feminine' })];
      expect(untaggedExtras(gendered, ['sono andato'], resolvedTargetKey)).toEqual([]);
    });

    it('still fails an untagged extra inside the expected form\'s own gendered target', () => {
      const forms = [inTarget('sono andato', { agreement: male }), inTarget('son andato', { agreement: male }), inTarget('sono andata', { agreement: female })];
      expect(untaggedExtras(forms, ['sono andato'], resolvedTargetKey).map(extra => extra.text)).toEqual(['son andato']);
    });

    it('excuses only the untagged extras a language\'s own predicate accepts', () => {
      const forms = [form('x'), form('y'), form('z'), form('w', { condition: 'only with an object' })];
      const reviewed = (extra: ConjugatedForm) => extra.text === 'y';
      expect(untaggedExtras(forms, ['x'], resolvedTargetKey, reviewed).map(extra => extra.text)).toEqual(['z', 'w']);
      const conditioned = (extra: ConjugatedForm) => extra.variant.condition !== null;
      expect(untaggedExtras(forms, ['x'], resolvedTargetKey, conditioned).map(extra => extra.text)).toEqual(['y', 'z']);
    });

    it('lets every language that opts in excuse forms only through `acceptsUntagged`', () => {
      const opted = corpusLanguages.filter(language => language.requireTaggedExtras).map(language => language.language);
      expect(opted.sort()).toEqual(['de', 'en', 'es', 'it', 'la']);
      expect(corpusLanguages.filter(language => language.acceptsUntagged !== undefined).map(language => language.language)).toEqual(['de']);
    });
  });
});
