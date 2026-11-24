# Seven-Language Engine — Plan 5: German (de)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add German as a rule-first `StagedGrammar` pack that conjugates listed, derived and invented verbs (separable, inseparable and dual particles, several paradigms per lemma), explains every form in English and Dutch with citations, and passes all 12,788 cells of the German oracle through a sourced corrections ledger.

**Architecture:** A new pack under `src/languages/de/` with Dutch's Part B layout (`spec`, `catalogue` with subject slots, `options`, `rendering`, `lexicon`, `stems`, `paradigms`, `orthography`, `periphrasis`, `clause`, `rules`, `sources`, `grammar`, `pack`) plus `classify.ts` (lexicon lookup, derivative resolution, assumptions, several paradigms). The Germanic mechanisms that Dutch will share — the derivative splitter, separable-particle placement, the multi-paradigm fork — go into a new `src/languages/shared/germanic.ts`; Dutch adopts it in a later plan. Compound tenses are eleven periphrasis chains; the clause builds main-clause (verb-second) order.

**Tech Stack:** TypeScript 7 strict, Node 26, Vitest 5, npm workspaces, cheerio (dev only, corpus parser). No new dependencies.

**Spec:** `docs/superpowers/specs/2026-11-24-seven-language-engine-design.md` (section "German (de)", "Behaviour decisions") and the grammar design `docs/superpowers/research/2026-11-24-de-grammar-design.md`, cited below as **GD §n**. The GD holds every rule table, ending set, lexicon list, side list and oracle error; this plan points at it instead of repeating it.

**Builds on:** Plan 2 Parts A and B (subject slots via `LanguagePack.subjects` / `subjectsFor` / `genderedTargets`, `CatalogueEntry.slots`, `LanguageSpec<Tenses>` with a `subject` union, `ClauseContext.subject`, `classify` returning a `Fork`, `cellOf(target, lexeme)`, `Periphrasis.applies`, `ClauseContext.agreeing`, the `./core` authoring surface, `corpusCell(fields)`, labelled corpus queries, `remaps`, `unmodelled`). Read `docs/pack-authoring.md` (the pack-authoring guide), `src/core/staged.ts`, `clause.ts`, `periphrasis.ts`, `pack.ts`, `spec.ts`, `fork.ts`, `juncture.ts`, `tests/toy/pack.ts` and the migrated Dutch pack (`src/languages/nl/`) before starting. If a Plan 2 interface differs from the names used here, make the smallest change that fits, keep these names in the German code, and list it under "Interface deviations" in the task report.

## Global Constraints

- All paths are relative to `packages/conjugation-engine/` unless they start with `apps/` or `docs/`.
- Branch `feat/seven-language-engine` (or the worktree branch assigned for parallel packs); one commit per task; every commit keeps `npm run typecheck && npm test` green at the workspace root and `npm run corpus:check` passing.
- The pack touches only its own paths: `src/languages/de/`, `src/i18n/locales/{en,nl}/de.ts`, `scripts/corpus/{parsers,languages,corrections}/de.ts`, `tests/de/`, `tests/fixtures/de.json`, `docs/grammar/de.md`, `src/equivalence/de.ts` (only if `src/equivalence/` exists), and the new shared module `src/languages/shared/germanic.ts` (created here; Dutch adopts it later, nothing in `src/languages/nl/` changes). Shared files get exactly these one-line registrations (an import line counts with its entry):
  - `src/languages/registry.ts`: `de: GermanSpec;`
  - `src/languages/index.ts`: `de: germanPack` in `packs`
  - `src/types.ts`: `export type { GermanClassHint, GermanSpec, GermanStemHints, GermanSubject, GermanTenses } from './languages/de/spec.js';` and `export type GermanConjugationOptions = ConjugationOptionsFor<'de'>;`
  - `src/i18n/locales/en/index.ts` and `src/i18n/locales/nl/index.ts`: spread the `de` messages
  - `scripts/corpus/languages/index.ts`: `german` in `corpusLanguages`
  - `tests/corpus.test.ts`: `de: { files: 139, infinitives: 139, cells: 12_788, placeholders: 0 },`
  - `tests/i18n/runtime.test.ts`: `'de'` in its language list
  - `tests/pack.test.ts` and `tests/options.test.ts`: the registered-language list and the message `Language must be one of: fr, nl, de.` (whichever packs are registered when this merges)
  - `scripts/corpus/model.ts`: an optional `expected?: readonly string[]` in `corpusCell`'s argument, only if Plan 2 did not add one (GD §11 #10)
  - `README.md` (package): German in the language list and the corpus table
  - `src/equivalence/index.ts`: the `de` map, only if that module exists
  - regenerated, not hand-edited: `tests/fixtures/manifest.json`, `tests/fixtures/corrections.json` (re-run `corpus:import` after merging another pack), `tests/equivalence/matrix.tsv` if the equivalence module exists.
- French and Dutch output must not change: `tests/characterization.test.ts` and the fr/nl halves of `tests/corpus.test.ts` stay green with no new ledger entry.
- Zero runtime dependencies; nothing under `src/` imports `node:*` (except `src/cli.ts`), `scripts/` or `tests/`.
- Every rule has an English and a Dutch message and a citation; `tests/i18n/completeness.test.ts` passes for `de`. Rule ids are `de.<stage>.<name>` in kebab case, exactly as in GD §4. Messages are one sentence for a secondary-school learner, naming forms through `{before}` / `{after}` and declared params; GD §4 (intro) lists the Dutch school-grammar terms. A rule is never cited to the oracle's site or any conjugator. Claims GD §1.2 lists as print-only cite the Duden-Grammatik by chapter and are marked `print: true` in `sources.ts`.
- Lexicon entries are verified against the DWDS inflection table (`https://www.dwds.de/lemma/flexion/<lemma>`) with Duden (`https://www.duden.de/konjugation/<slug>`) as cross-check, under the label policy of GD §5.1; the URL is stored on the entry; nothing is copied from the oracle. Entries resting on one authority only, and DWDS/Duden conflicts, are listed in `sources.ts` (`lexiconNotes`).
- Only current spelling (Amtliches Regelwerk 2024) is emitted: no `ß` after a short vowel, no `geschrieen`. Colloquial forms (DWDS `ugs.`) are not emitted.
- Commit messages end with `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`.

## Review Focus

1. **An invented verb that looks like an irregular one.** `schlinken` must come out weak (`schlinkte`, `geschlinkt`) with the three assumptions `de.classify.default-weak`, `default-haben`, `default-stress`; with `classHint: 'strong'` and `stems: { preterite: 'schlank', participle: 'geschlunken' }` it gives `schlank`, `schlänke`, `geschlunken` and no `default-weak`. → Task 2 and Task 7 tests.
2. **A verb with two paradigms.** `umziehen` returns `ich ziehe um` / `ich bin umgezogen` (`pattern: 'separable'`) and `ich umziehe` / `ich habe umzogen` (`'inseparable'`), never crossed; `separablePrefix: 'um'` leaves one; `bewegen` gives `bewegte` and `bewog`, `classHint: 'strong'` only `bewog`. → Task 2 and Task 4 tests.
3. **An unknown verb that starts like a prefixed one.** `umschlinken` → assumed separable (`ich schlinke um`); `überzeugen` → inseparable without assumption; `beugen` and `angeln` → not split (`gebeugt`, `geangelt`); `beantragen` → weak and inseparable (`beantragt`, never `beantrug`). → Task 2 tests.
4. **Formal Sie and the imperative.** Unfiltered imperative: du / wir / ihr only; `subject: '2.formal'` → `Sie backen`, `backen Sie`, `seien Sie`; `{ mood: 'imperative', subject: '3sg.f' }` and `{ mood: 'imperative', person: 3 }` → `INVALID_TARGET`. → Task 1 and Task 4 tests.
5. **Input without ß or umlaut, and old spelling.** `heissen` → the heißen paradigm with `de.classify.transliteration`; `muessen` → müssen; `wagen` stays weak `wagte` (never `wägen`); no generated form anywhere equals a form the old-spelling correction removed (`muß`, `iß`, `gewußt`). → Task 2 test and Task 6 guard.

---

### Task 1: Pack skeleton, catalogue and subject slots

**Files:**
- Create: `src/languages/de/{spec,catalogue,options,rendering,rules,sources,grammar,pack}.ts`, `src/i18n/locales/en/de.ts`, `src/i18n/locales/nl/de.ts`, `tests/de/pack.test.ts`
- Modify (one line each, see Global Constraints): `src/languages/registry.ts`, `src/languages/index.ts`, `src/types.ts`, `src/i18n/locales/en/index.ts`, `src/i18n/locales/nl/index.ts`, `tests/pack.test.ts`, `tests/options.test.ts`

**Interfaces:**
- Produces (`spec.ts`):

```ts
export type GermanTenses = {
  indicative: 'present' | 'past' | 'perfect' | 'pluperfect' | 'future' | 'future_perfect';
  subjunctive: 'present' | 'perfect' | 'future' | 'future_perfect' | 'past' | 'pluperfect';
  conditional: 'present' | 'past';
  imperative: 'present';
  infinitive: 'present' | 'perfect';
  participle: 'present' | 'past';
};
export type GermanClassHint = 'weak' | 'strong' | 'mixed';
export interface GermanStemHints {
  readonly present2?: string; readonly preterite?: string; readonly subjunctive?: string; readonly participle?: string;
  readonly unstressedFirstSyllable?: boolean;
}
export type GermanSubject = '1sg' | '2sg' | '3sg' | '3sg.f' | '3sg.n' | '1pl' | '2pl' | '3pl' | '2.formal';
export interface GermanSpec extends LanguageSpec<GermanTenses> {
  tenses: GermanTenses; nonFinite: 'infinitive' | 'participle'; auxiliary: 'haben' | 'sein';
  classHint: GermanClassHint; stems: GermanStemHints; subject: GermanSubject;
  context: { readonly separablePrefix?: string; readonly inseparablePrefix?: string };
}
```

- `catalogue.ts`: `germanCatalogue` (20 entries, GD §2.1 order and labels; `subjunctive` from two `moodEntries` calls labelled `Konjunktiv I` / `Konjunktiv II`; imperative persons `[[2,'singular'],[1,'plural'],[2,'plural'],[3,'plural']]` and `slots: ['2sg', '1pl', '2pl', '2.formal']`, as the toy's imperative does) and `germanSubjects: readonly SubjectSlot[]` (9 slots, GD §2.2 order).
- `options.ts`: `germanOptions: OptionSchema<OptionFieldsFor<'de'>>` (exactly `stems`, `auxiliary`, `classHint`, `separablePrefix`, `inseparablePrefix`; GD §2.3, fields in that order; prefix fields `kind: 'word'`, `code: 'INVALID_HINT'`; `check` rejects both prefix hints).
- `rendering.ts`: `germanRendering: PackRendering` (`onset`: vowel when the text starts with `a e i o u ä ö ü` case-insensitively, else consonant; `sandhi` → null; `bareOmits` → false).
- `rules.ts`: `germanRules = defineRules({})` (filled from Task 2 on); `type GermanRuleId = keyof typeof germanRules`.
- `sources.ts`: `germanWorks` (GD §1 keys as ids, lower-case: `grammis-4071`, `sg-439`, `regelwerk-2024`, `duden-sprachwissen`, `dwds`, `duden`, `duden-grammatik`…), `germanCitations satisfies Record<GermanRuleId, Citation | readonly Citation[]>`, `printOnly: ReadonlySet<GermanRuleId>`, `lexiconNotes: Readonly<Record<string, string>>`.
- `grammar.ts`: `germanGrammar: StagedGrammar<GermanLexeme>` whose not-yet-built hooks throw `ConjugationError('GENERATION_FAILURE', 'German <hook> is not built yet.')`; `GermanLexeme` is `LexemeBase` until Task 2.
- `pack.ts`: `germanPack: LanguagePack<'de'>` with `label: 'German'`, `subjects: germanSubjects` (default `subjectsFor`, no `acceptsTarget`), `rank: form => variantRank(form.variant, 'rectified')` (generation order decides among equally ranked forms), `engine: query => stagedEngine(germanGrammar, germanRendering, query)`, `rules`, `works`, `citations`.

- [ ] **Step 1: Write the failing test** `tests/de/pack.test.ts`

```ts
const engine = createEngine(packs);
const targets = (options: Record<string, unknown>) => engine.expandTargets({ language: 'de', infinitive: 'machen', ...options });

it('lists the German catalogue', () => {
  expect(getCatalogue('de').map(e => `${e.mood}.${e.tense}`)).toEqual([
    'indicative.present', 'indicative.past', 'indicative.perfect', 'indicative.pluperfect', 'indicative.future',
    'indicative.future_perfect', 'subjunctive.present', 'subjunctive.perfect', 'subjunctive.future',
    'subjunctive.future_perfect', 'subjunctive.past', 'subjunctive.pluperfect', 'conditional.present', 'conditional.past',
    'imperative.present', 'infinitive.present', 'infinitive.perfect', 'participle.present', 'participle.past']);
  const past = getCatalogue('de').find(e => e.mood === 'subjunctive' && e.tense === 'past')!;
  expect([past.moodLabel, past.tenseLabel]).toEqual(['Konjunktiv II', 'Präteritum']);
});
it('declares the subject slots', () => {
  expect(getSubjects('de').map(s => [s.id, s.pronoun, s.person, s.number, s.default])).toEqual([
    ['1sg', 'ich', 1, 'singular', true], ['2sg', 'du', 2, 'singular', true], ['3sg', 'er', 3, 'singular', true],
    ['3sg.f', 'sie', 3, 'singular', false], ['3sg.n', 'es', 3, 'singular', false], ['1pl', 'wir', 1, 'plural', true],
    ['2pl', 'ihr', 2, 'plural', true], ['3pl', 'sie', 3, 'plural', true], ['2.formal', 'Sie', 3, 'plural', false]]);
});
it('expands the imperative to du, wir, ihr and, on request, Sie', () => {
  expect(targets({ mood: 'imperative' }).map(t => t.subject)).toEqual(['2sg', '1pl', '2pl']);
  expect(targets({ mood: 'imperative', subject: '2.formal' }).map(t => [t.person, t.number, t.subject])).toEqual([[3, 'plural', '2.formal']]);
  expect(() => targets({ mood: 'imperative', subject: '3sg.f' })).toThrow(expect.objectContaining({ code: 'INVALID_TARGET' }));
  expect(() => targets({ mood: 'imperative', person: 3 })).toThrow(expect.objectContaining({ code: 'INVALID_TARGET' }));
});
it('validates German options', () => {
  expect(parseConjugationOptions({ language: 'de', infinitive: ' UMZIEHEN ', separablePrefix: 'UM' }))
    .toEqual({ language: 'de', infinitive: 'umziehen', separablePrefix: 'um' });
  expect(() => parseConjugationOptions({ language: 'de', infinitive: 'umziehen', separablePrefix: 'um', inseparablePrefix: 'um' }))
    .toThrow(expect.objectContaining({ code: 'INVALID_HINT' }));
  expect(() => parseConjugationOptions({ language: 'de', infinitive: 'x', classHint: 'irregular' })).toThrow(expect.objectContaining({ code: 'INVALID_REQUEST' }));
});
it('is listed by the CLI', () => { /* spawn dist/cli.js --help; stdout contains 'German (de):' */ });
```

- [ ] **Step 2:** run `npx vitest run tests/de/pack.test.ts` — FAIL (no `de` pack).
- [ ] **Step 3:** implement the modules and the registrations; update the two language-list assertions in `tests/pack.test.ts` and `tests/options.test.ts`.
- [ ] **Step 4:** root gate `npm run typecheck && npm test` — PASS (the completeness gate checks a pack with no rules).
- [ ] **Step 5:** commit `feat(conjugation-engine): German pack skeleton with catalogue and subject slots`.

### Task 2: Lexicon and classification

**Files:**
- Create: `src/languages/shared/germanic.ts`, `src/languages/de/lexicon.ts`, `src/languages/de/classify.ts`, `tests/de/germanic.test.ts`, `tests/de/classify.test.ts`
- Modify: `src/languages/de/{rules,sources,grammar}.ts`, `src/i18n/locales/{en,nl}/de.ts`

**Interfaces:**
- `shared/germanic.ts` (language-neutral; no German data):

```ts
export interface ParticleTables {
  readonly separable: readonly string[]; readonly dual: readonly string[]; readonly inseparable: readonly string[];
  readonly onsets: readonly string[];            // valid word-initial consonant clusters (GD §3.3)
  readonly infinitiveEnding: RegExp;             // de: /(?:e?n)$/u
}
export interface DerivativeSplit { readonly particle: string | null; readonly prefix: string | null; readonly root: string }
/** Every analysis of `lemma` into [separable or dual particle] + [inseparable prefix] + root, longest particle first, plausible roots only. The unsplit reading is not included. */
export function splitDerivative(lemma: string, tables: ParticleTables): readonly DerivativeSplit[];
export function isPlausibleRoot(root: string, tables: ParticleTables): boolean;   // GD §3.3 "Plausible remainder"
/** One outcome per paradigm, tagged `{ pattern, condition }`, carrying that paradigm's own classification steps. */
export function paradigmFork<X>(choices: readonly { readonly pattern: string; readonly condition?: string; readonly lexeme: X; readonly steps: readonly DerivationStep[] }[]): Fork<X>;
```

- `lexicon.ts`: the types `Auxiliary`, `AuxiliaryUse`, `Alternate`, `GermanEntry` exactly as GD §5.1; `DualEntry = { readonly paradigms: readonly { readonly pattern: string; readonly condition?: string; readonly entry: GermanEntry | WeakEntry }[] }` with `WeakEntry = { readonly class: 'weak'; readonly auxiliaries: readonly AuxiliaryUse[]; readonly source: string }`; `germanLexicon: Readonly<Record<string, GermanEntry | DualEntry>>` (GD §5.2, 184 roots incl. the 10 dual-class lemmas of GD §3.5); `dualPrefixLemmas: Readonly<Record<string, { separable: { condition: string; auxiliaries?: readonly AuxiliaryUse[] }; inseparable: { condition: string; auxiliaries?: readonly AuxiliaryUse[] } }>>`; side lists named after GD §3.4 / §5.3: `weakWithSein`, `derivativeAuxiliaries`, `shortRootDerivatives`, `inseparableReadings`, `lookalikes`, `noInherit`, `denominalPrefixes` (be, ver), `nonInitialStress`, `impersonalVerbs`; `germanParticles: ParticleTables` (GD §3.3).
- `classify.ts`:

```ts
export interface GermanLexeme extends LexemeBase {
  readonly base: string;                         // the word without its separable particle: 'verschlafen', 'erkennen'
  readonly root: string;                         // the lexicon or unlisted root: 'schlafen', 'kennen', 'schlinken'
  readonly prefix: string | null;                // inseparable prefix in `base`
  readonly conjugation: 'weak' | 'strong' | 'mixed' | 'preteritePresent' | 'irregular';
  readonly entry: GermanEntry | null;            // with the prefix already prepended to every stored part
  readonly auxiliaryUses: readonly AuxiliaryUse[]; // LexemeBase.auxiliaries = these verbs, in order
  readonly geBlocked: 'prefix' | 'stress' | null;
  readonly flags: ReadonlySet<'thirdPersonOnly' | 'noImperative' | 'impersonal'>;
}
export function classifyGerman(query: Readonly<Record<string, unknown>>): Fork<GermanLexeme>;  // GD §3.2 in that order
export function germanLexemeOf(lemma: string): GermanLexeme;                                  // haben, sein, werden
```

- Rules (`stage: 'classify'`, GD §4.1, all 14): `de.classify.lexicon`, `.derivative`, `.separable`, `.inseparable`, `.assume-separable`, `.denominal`, `.not-derived`, `.default-weak`, `.default-haben`, `.default-stress`, `.ieren`, `.assume-root-auxiliary`, `.transliteration`, `.hint` — kinds and params as GD §4.1. `classificationSource`: `lexicon` when the lemma or its root is listed, `explicitHint` when a hint decides the class or a prefix, else `regularRule`.

- [ ] **Step 1: Write the failing tests.** `tests/de/germanic.test.ts`: `splitDerivative('herumfahren')` → `[{ particle: 'herum', prefix: null, root: 'fahren' }, { particle: 'her', … root: 'umfahren' }]` in that order; `'anerkennen'` → first `{ particle: 'an', prefix: 'er', root: 'kennen' }`; `'beten'`, `'erben'`, `'zuckern'`, `'herrschen'` → `[]`; `isPlausibleRoot('ugen')` true (vowel onset), `isPlausibleRoot('ckern')` false. `tests/de/classify.test.ts`. Until Task 3 nothing can be generated, so every test goes through `analyse(query) = germanPack.engine(parseConjugationOptions({ language: 'de', ...query })).analysis` (`analysis(lemma, hints?)`, `ids` = its step rules, `assumptions` = the rules of its `assumption` steps):

```ts
expect(analysis('fahren')).toMatchObject({ classification: 'strong', classificationSource: 'lexicon', auxiliaries: ['sein', 'haben'] });
expect(assumptions('machen')).toEqual(['de.classify.default-weak', 'de.classify.default-haben', 'de.classify.default-stress']);
expect(assumptions('studieren')).toEqual(['de.classify.default-weak', 'de.classify.default-haben']);
expect(ids('studieren')).toContain('de.classify.ieren');
expect(stepsOf('verschlafen').map(s => [s.rule, s.params])).toEqual([
  ['de.classify.derivative', { prefix: 'ver', root: 'schlafen' }], ['de.classify.inseparable', { prefix: 'ver' }],
  ['de.classify.assume-root-auxiliary', { root: 'schlafen' }]]);   // classification 'strong'
expect(analysis('herumfahren').auxiliaries).toEqual(['sein', 'haben']);
expect(ids('aufschlinken')).toEqual(['de.classify.assume-separable', 'de.classify.default-weak', 'de.classify.default-haben', 'de.classify.default-stress']);
expect(stepOf('umschlinken', 'de.classify.assume-separable').params).toEqual({ particle: 'um' });
expect(ids('umschlinken', { inseparablePrefix: 'um' })).toContain('de.classify.hint');       // and no assume-separable
expect(ids('überzeugen')).toEqual(expect.arrayContaining(['de.classify.inseparable']));        // no assume-separable
expect(ids('beugen')).not.toContain('de.classify.inseparable');                              // lookalike, not split
expect(ids('beantragen')).toContain('de.classify.denominal');                                // classification 'weak'
expect(stepOf('bedingen', 'de.classify.not-derived').params).toEqual({ root: 'dingen' });
expect(analysis('umziehen').alternatives).toHaveLength(1);                                    // two paradigms
expect(analysis('umziehen', { separablePrefix: 'um' })).not.toHaveProperty('alternatives');
expect(analysis('bewegen', { classHint: 'strong' })).not.toHaveProperty('alternatives');
expect(analysis('heissen')).toMatchObject({ lemma: 'heißen', classification: 'strong' });
expect(stepOf('heissen', 'de.classify.transliteration').params).toEqual({ written: 'heissen', read: 'heißen' });
expect(analysis('muessen').lemma).toBe('müssen');
expect(analysis('wagen')).toMatchObject({ lemma: 'wagen', classification: 'weak' });
expect(() => analyse({ infinitive: 'sich waschen' })).toThrow(invalid('INVALID_INFINITIVE', 'Reflexive verbs are not supported yet.'));
expect(() => analyse({ infinitive: 'verschlafen', separablePrefix: 'ver' })).toThrow(invalid('INVALID_HINT'));
expect(() => analyse({ infinitive: 'schlinken', classHint: 'strong' })).toThrow(invalid('INVALID_HINT'));
expect(analyse({ infinitive: 'fahren', auxiliary: 'haben' }).auxiliaries).toEqual(['haben']);
expect(() => analyse({ infinitive: 'kommen', auxiliary: 'haben' })).toThrow(invalid('INVALID_HINT'));
```

  A lexicon test: every `GermanEntry.source` starts with `https://www.dwds.de/`; every dual entry has two paradigms with distinct `pattern`; every side-list lemma is a string matching `/^\p{Ll}+n$/u`.
- [ ] **Step 2:** run — FAIL.
- [ ] **Step 3: Verify the lexicon.** For each lemma of GD §5.2 and §5.3 open `https://www.dwds.de/lemma/flexion/<lemma>` (Duden as cross-check), enter the parts under the label policy of GD §5.1, store the URL in `source`, and record every conflict or single-authority entry in `lexiconNotes`. Rows GD marks [V] were checked in the design pass; everything else is checked now. Never consult the oracle files for a form.
- [ ] **Step 4:** implement `germanic.ts`, `lexicon.ts`, `classify.ts`, the 14 rules with en + nl messages and citations (GD §4.1); `grammar.classify = classifyGerman`, `grammar.lexemeOf = germanLexemeOf`.
- [ ] **Step 5:** root gate — PASS; commit `feat(conjugation-engine): German lexicon and classification with a shared Germanic derivative resolver`.

### Task 3: Stems, endings and spelling rules for the simple finite tenses

**Files:**
- Create: `src/languages/de/{stems,paradigms,orthography}.ts`, `tests/de/simple.test.ts`
- Modify: `src/languages/de/{grammar,rules,sources}.ts`, both message files

**Interfaces:**
- `stems.ts`: `germanStem(lexeme: GermanLexeme, cell: Cell): Fork<string>` and `germanCell(lexeme: GermanLexeme, cell: Cell): Fork<string> | null` (the `cell` hook: listed whole words and listed imperatives, GD §5.1).
- `paradigms.ts`: the ending sets of GD §4.3 as data; `germanEnding(lexeme: GermanLexeme, cell: Cell, stem: string): Fork<string>`.
- `orthography.ts`: `germanOrthography: readonly JunctureRule<{ readonly lexeme: GermanLexeme; readonly cell: Cell }>[]` in GD §4.4 order.
- `grammar.ts`: `cellOf(target, lexeme)` returns finite cells for indicative.present/past, subjunctive.present/past and imperative.present (the imperative `[3, plural]` cell is the Sie-form), non-finite cells `infinitive` / `presentParticiple` / `pastParticiple`, and null for the eleven periphrastic targets (built in Task 4).
- Rules: GD §4.2 (14), §4.3 (15), §4.4 (7), with their variant tags (`pattern: 'short' | 'long' | 'elided' | 'alternate'`, `usage: 'dated'` on listed dated alternates).

- [ ] **Step 1: Write the failing tests** `tests/de/simple.test.ts`, at word level with `synthesize(germanGrammar, lexeme, cell)` from `src/core/staged.js` (texts in output order; `ids` = the outcome's step rules):

```ts
expect(words('arbeiten', present(2, 'singular'))).toEqual(['arbeitest']);
expect(ids('arbeiten', present(2, 'singular'))).toEqual(['de.stem.present', 'de.end.present', 'de.orth.schwa-dental']);
expect(ids('fahren', present(3, 'singular'))).toEqual(['de.stem.present', 'de.stem.present2', 'de.end.present']);   // fährt
expect(words('halten', present(3, 'singular'))).toEqual(['hält']);           // de.orth.t-merge, no schwa
expect(words('halten', present(2, 'singular'))).toEqual(['hältst']);
expect(words('reisen', present(2, 'singular'))).toEqual(['reist']);          // de.orth.sibilant-2sg
expect(words('sammeln', present(1, 'singular'))).toEqual(['sammele', 'sammle']);   // second: pattern 'elided'
expect(words('sammeln', present(1, 'plural'))).toEqual(['sammeln']);
expect(words('sammeln', subjunctiveI(2, 'singular'))).toEqual(['sammelst', 'sammlest']);
expect(words('wandern', present(1, 'singular'))).toEqual(['wandere', 'wandre']);
expect(words('atmen', present(3, 'singular'))).toEqual(['atmet']);           // de.orth.schwa-nasal
expect(words('lernen', present(3, 'singular'))).toEqual(['lernt']);
expect(words('schreien', past(1, 'plural'))).toEqual(['schrien']);          // de.orth.ie-contraction
expect(words('schreien', subjunctiveII(1, 'singular'))).toEqual(['schrie']);
expect(words('finden', past(2, 'singular'))).toEqual(['fandst', 'fandest']);  // second: pattern 'long'
expect(words('lesen', past(2, 'singular'))).toEqual(['lasest', 'last']);      // second: pattern 'short'
expect(words('finden', past(2, 'plural'))).toEqual(['fandet']);
expect(words('fahren', subjunctiveII(1, 'singular'))).toEqual(['führe']);   // de.stem.subjunctive-umlaut
expect(words('kommen', subjunctiveII(2, 'singular'))).toEqual(['kämest', 'kämst']);
expect(words('gehen', subjunctiveII(2, 'singular'))).toEqual(['gingest']);
expect(words('helfen', subjunctiveII(1, 'singular'))).toEqual(['hälfe', 'hülfe']);
expect(words('brennen', subjunctiveII(1, 'singular'))).toEqual(['brennte']);
expect(words('können', present(1, 'singular'))).toEqual(['kann']);
expect(words('können', subjunctiveII(1, 'singular'))).toEqual(['könnte']);
expect(words('sein', present(1, 'singular'))).toEqual(['bin']);             // de.stem.lexical-cell
expect(words('sein', subjunctiveI(2, 'singular'))).toEqual(['seiest', 'seist']);
expect(words('sein', subjunctiveII(2, 'plural'))).toEqual(['wäret', 'wärt']);
expect(words('werden', present(3, 'singular'))).toEqual(['wird']);
expect(words('backen', past(1, 'singular'), 'weak')).toEqual(['backte']);   // paradigm by classHint
expect(usageOf('backen', past(1, 'singular'), 'strong')).toEqual({ buk: 'dated' });
expect(words('geben', imperative(2, 'singular'))).toEqual(['gib']);        // de.stem.imperative-i
expect(words('kommen', imperative(2, 'singular'))).toEqual(['komm', 'komme']);
expect(words('finden', imperative(2, 'singular'))).toEqual(['finde']);
expect(words('atmen', imperative(2, 'singular'))).toEqual(['atme']);
expect(words('sammeln', imperative(2, 'singular'))).toEqual(['sammele', 'sammle']);
expect(words('tun', imperative(2, 'singular'))).toEqual(['tu', 'tue']);
expect(words('sehen', imperative(2, 'singular'))).toEqual(['sieh', 'siehe']);
expect(words('fahren', imperative(2, 'plural'))).toEqual(['fahrt']);
expect(words('sein', imperative(3, 'plural'))).toEqual(['seien']);
```

  plus: every stem, ending and orthography rule of GD §4.2–4.4 appears in at least one asserted `ids` list (a test collects them and compares with `germanRules`).
- [ ] **Step 2:** run — FAIL.
- [ ] **Step 3:** implement stems, endings, the seven juncture rules and the lexical `cell` hook; messages and citations (GD §4.2–4.4).
- [ ] **Step 4:** root gate — PASS; commit `feat(conjugation-engine): German stems, endings and spelling rules for the simple tenses`.

### Task 4: Non-finite forms, compound tenses, clause and availability

**Files:**
- Create: `src/languages/de/{periphrasis,clause}.ts`, `tests/de/compound.test.ts`, `tests/de/clause.test.ts`
- Modify: `src/languages/shared/germanic.ts` (add `placeParticle`), `src/languages/de/{grammar,rules,sources}.ts`, both message files

**Interfaces:**
- `germanic.ts`: `placeParticle(words: readonly ChainWord[], particle: LexemeBase['particle']): { readonly words: readonly ChainWord[]; readonly final: string | null }` — finite lexical verb: words unchanged, `final` = the particle; otherwise the particle is prefixed to the lexical-verb word's text, `final` = null.
- `periphrasis.ts`: `germanPeriphrases: readonly Periphrasis<GermanLexeme>[]` (no `applies`; `reports` left at its default) — the eleven chains of GD §6.1 with rules `de.periphrasis.*` (GD §4.5); `validateGrammar(germanGrammar)` at module load.
- `clause.ts`: `germanClause: ClauseGrammar<GermanLexeme>` — `agreements` → `one(null)`; `assemble` per GD §6.2: subject from `context.subject` (or `es` for impersonal verbs), V2 order, imperative pronoun after the verb for `1pl` / `2.formal`, particle via `placeParticle`, and the `condition` / `region` of the `AuxiliaryUse` matching `context.auxiliary` as tags.
- `grammar.ts`: `availability(lexeme, target)` per GD §4.7 (3 rules); `stagedEngine` unchanged.
- Rules: `de.periphrasis.*` (11), `de.clause.*` (5), `de.avail.*` (3).

- [ ] **Step 1: Write the failing tests.** `tests/de/compound.test.ts` (texts via `conjugate`, `{ text, auxiliary, condition, pattern }` per form, preferred first):

```ts
expect(forms('fahren', 'indicative', 'perfect', 1, 'singular')).toEqual([
  { text: 'ich bin gefahren', auxiliary: 'sein', condition: expect.any(String) },
  { text: 'ich habe gefahren', auxiliary: 'haben', condition: expect.any(String) }]);
expect(texts('machen', 'indicative', 'perfect', 1, 'singular')).toEqual(['ich habe gemacht']);
expect(texts('studieren', 'participle', 'past')).toEqual(['studiert']);
expect(texts('verschlafen', 'participle', 'past')).toEqual(['verschlafen']);
expect(texts('schreien', 'participle', 'past')).toEqual(['geschrien']);
expect(texts('sammeln', 'participle', 'present')).toEqual(['sammelnd']);
expect(texts('tun', 'participle', 'present')).toEqual(['tuend']);
expect(texts('sein', 'participle', 'present')).toEqual(['seiend']);
expect(forms('fahren', 'indicative', 'future', 1, 'singular')).toEqual([{ text: 'ich werde fahren', auxiliary: 'werden' }]);
expect(texts('fahren', 'conditional', 'present', 1, 'singular')).toEqual(['ich würde fahren']);
expect(texts('kommen', 'subjunctive', 'perfect', 3, 'singular')).toEqual(['er sei gekommen']);
expect(texts('kommen', 'subjunctive', 'perfect', 2, 'singular')).toEqual(['du seiest gekommen', 'du seist gekommen']);
expect(texts('machen', 'subjunctive', 'pluperfect', 1, 'singular')).toEqual(['ich hätte gemacht']);
expect(texts('machen', 'indicative', 'future_perfect', 1, 'singular')).toEqual(['ich werde gemacht haben']);
expect(texts('machen', 'conditional', 'past', 1, 'singular')).toEqual(['ich würde gemacht haben']);
expect(texts('fahren', 'infinitive', 'perfect')).toEqual(['gefahren sein', 'gefahren haben']);
expect(texts('können', 'conditional', 'present', 1, 'singular')).toEqual(['ich würde können']);
expect(unavailable('können', 'imperative')).toEqual([['noImperative', 'de.avail.no-imperative'], ['noImperative', 'de.avail.no-imperative'], ['noImperative', 'de.avail.no-imperative']]);
expect(unavailable('geschehen', 'indicative', 'present', 1, 'singular')).toEqual([['defective', 'de.avail.third-person-only']]);
expect(texts('geschehen', 'indicative', 'present', 3, 'singular')).toEqual(['er geschieht']);
expect(texts('regnen', 'indicative', 'present', 3, 'singular')).toEqual(['es regnet']);   // de.clause.impersonal-es
expect(unavailable('regnen', 'indicative', 'present', 1, 'singular')).toEqual([['impersonal', 'de.avail.impersonal']]);
expect(texts('stehen', 'indicative', 'perfect', 1, 'singular')).toEqual(['ich habe gestanden', 'ich bin gestanden']);  // second: region 'south'
```

  `tests/de/clause.test.ts`:

```ts
expect(parts('abschreiben', 'indicative', 'present', 1, 'singular')).toEqual([['subject', 'ich'], ['lexicalVerb', 'schreibe'], ['particle', 'ab']]);
expect(clauseIds('abschreiben', 'indicative', 'present', 1, 'singular')).toEqual(['de.clause.subject', 'de.clause.particle-final']);
expect(texts('abschreiben', 'indicative', 'perfect', 1, 'singular')).toEqual(['ich habe abgeschrieben']);
expect(texts('abschreiben', 'indicative', 'future', 1, 'singular')).toEqual(['ich werde abschreiben']);
expect(texts('abschreiben', 'imperative', 'present', 2, 'singular')).toEqual(['schreib ab', 'schreibe ab']);
expect(texts('abschreiben', 'imperative', 'present', 1, 'plural')).toEqual(['schreiben wir ab']);
expect(conjugate({ language: 'de', infinitive: 'abschreiben', mood: 'imperative', subject: '2.formal' }).forms.map(f => f.text)).toEqual(['schreiben Sie ab']);
expect(conjugate({ language: 'de', infinitive: 'sein', mood: 'imperative', subject: '2.formal' }).forms.map(f => f.text)).toEqual(['seien Sie']);
expect(conjugate({ language: 'de', infinitive: 'backen', mood: 'indicative', tense: 'present', subject: '2.formal' }).forms.map(f => f.text)).toEqual(['Sie backen']);
expect(conjugate({ language: 'de', infinitive: 'machen', mood: 'indicative', tense: 'present', subject: '3sg.n' }).forms.map(f => f.text)).toEqual(['es macht']);
expect(conjugate({ language: 'de', infinitive: 'machen', mood: 'indicative', tense: 'present', subject: '3sg.f' }).forms.map(f => f.text)).toEqual(['sie macht']);
// two paradigms, never crossed (Review Focus 2)
expect(byPattern('umziehen', 'indicative', 'perfect', 1, 'singular')).toEqual({
  separable: ['ich bin umgezogen', 'ich habe umgezogen'], inseparable: ['ich habe umzogen'] });
expect(byPattern('umziehen', 'indicative', 'present', 1, 'singular')).toEqual({ separable: ['ich ziehe um'], inseparable: ['ich umziehe'] });
expect(byPattern('bewegen', 'indicative', 'past', 1, 'singular')).toEqual({ weak: ['ich bewegte'], strong: ['ich bewog'] });
```

- [ ] **Step 2:** run — FAIL.
- [ ] **Step 3:** implement `placeParticle`, the periphrases, the clause and availability; messages and citations.
- [ ] **Step 4:** root gate — PASS; `npm run cli -- de abschreiben --explain --locale nl` prints every step without `{`.
- [ ] **Step 5:** commit `feat(conjugation-engine): German compound tenses, clause, particles and availability`.

### Task 5: Corpus parser, language module, ledger and fixtures

Tasks 5 and 6 of the uniform skeleton are split differently here (as in the Spanish plan): the ledger moves into this task because importing the fixtures registers 12,788 cells with `tests/corpus.test.ts`, which must stay green at this commit. Task 6 keeps the guards.

**Files:**
- Create: `scripts/corpus/parsers/de.ts`, `scripts/corpus/languages/de.ts`, `scripts/corpus/corrections/de.ts`, `tests/de/parser.test.ts`, `tests/fixtures/de.json` (generated)
- Modify: `scripts/corpus/languages/index.ts` (one line), `tests/corpus.test.ts` (one pinned line), `scripts/corpus/model.ts` (only the optional `expected`, see Global Constraints), `tests/fixtures/{manifest,corrections}.json` (regenerated)

**Interfaces:**
- `parsers/de.ts`: `export const germanCellsPerFile = 92; export function parseGerman(html: string, file: string): ParsedCorpus` — GD §9.1–9.3 exactly: 19 `font[face="Arial"][size="2"]` blocks under `#ctl00_ch_divSimple` (11) and `#ctl00_ch_divComplex` (8), headings asserted against GD §9.2, rows split at `<br>`, groups by repeated maroon label, imperative rows by the maroon `wir` / `Sie`, labels replaced by the default pronouns, `expected` set from the rows (never through `alternatives()`), `original` = rows joined by ` | ` (or `-`), `subject`, `heading` on remapped cells, `templatePlaceholders: 0`.
- `languages/de.ts`: `export const german: CorpusLanguage` — `directory: 'Deutsch'`, `encoding: 'utf-8'`, `expectedFiles: 139`, `cellsPerFile: 92`, `context` → `{ infinitive: infinitiveFromFileName(name), gender: null, auxiliary: null, pattern: 'default' }`, the two labelled queries and `applicable` of GD §9.4, `remaps` = the 5 rows of GD §9.2 (`{ heading, occurrence: 0, target: { mood, tense }, reason, source }`), `unmodelled: {}`.
- `corrections/de.ts`: `export function germanCorrection(file, cell, index): CorpusCorrection | null` — the 12 rows of GD §9.5, one block per row, literal expected strings (C1 drops by the ß → ss partner test, C8/C9 rewrite `bin/bist/ist/sind/seid`, `war…`, `sei…`, `wäre…`, `sein` → the haben forms only in rows whose participle is `erschreckt` / `gewachst`, C11 builds the würde texts from the six literal participles `gedurft gekonnt gemocht gemusst gesollt gewollt`), reason > 30 characters, the `https://` source of GD §9.5.

- [ ] **Step 1: Write the failing parser test** `tests/de/parser.test.ts` with small inline HTML built from the page template (never copied source files):

```ts
const row = (label: string, form: string, style = 'normal') =>
  `<tt></tt><i style="font-style:${style};color:maroon">${label} </i><tt></tt><i style="font-style:${style};color:#003EAD">${form}</i><br>`;
expect(finiteCells('Präteritum', [row('ich', 'bewegte'), row('ich', 'bewog', 'ormal'), row('du', 'bewegtest'), …]).map(c => [c.subject, c.expected]))
  .toEqual([['1sg', ['ich bewegte', 'ich bewog']], ['2sg', ['du bewegtest']], …]);
expect(finiteCells('Präsens', [row('er/sie/es', 'backt'), …])[2].expected).toEqual(['er backt']);
expect(finiteCells('Präsens', ['<br>', '<br>', '<br>', row('er/sie/es', 'geschieht'), '<br>', '<br>', row('sie/Sie', 'geschehen')]).map(c => c.sourceUnavailable))
  .toEqual([true, true, false, true, true, false]);
expect(imperativeCells(['umziehe', 'umzieh', 'ziehe um', 'zieh um', 'umziehen|wir', 'ziehen|wir|um', 'umzieh|t', 'zieh|t|um', 'umziehen|Sie', 'ziehen|Sie|um'])
  .map(c => [c.subject, c.expected])).toEqual([
  ['2sg', ['umziehe', 'umzieh', 'ziehe um', 'zieh um']], ['1pl', ['umziehen wir', 'ziehen wir um']],
  ['2pl', ['umzieht', 'zieht um']], ['2.formal', ['umziehen Sie', 'ziehen Sie um']]]);
expect(cellOfBlock(9).target).toMatchObject({ mood: 'subjunctive', tense: 'past' });            // remap R1
expect(cellOfBlock(9).heading).toBe('Konjunktiv II/Präsens');
expect(() => parseGerman(pageWith18Blocks, 'bad.html')).toThrow('bad.html: expected 19 German blocks');
expect(() => finiteCells('Präsens', sevenGroups)).toThrow('expected 6 person groups');
```

- [ ] **Step 2:** run — FAIL.
- [ ] **Step 3:** implement the three modules; register `german`; add the pinned line; run `npm run corpus:import -- --source /Users/wouter/Downloads/VerbodromeX --only de` (refuses on a wrong revision; the checkout is read only and nothing in it is executed). Expected console line: `de: 139 files, 139 infinitives, 12788 cells, 12788 contextual targets, 12704 available / 84 unavailable cells, 14035 form expectations, 412 corrections, 0 accounted template placeholders`.
- [ ] **Step 4:** `npm run corpus:check` — every German cell passes; `git diff --stat -- tests/fixtures/fr.json tests/fixtures/nl.json` is empty. A failing cell is either an engine bug (fix it in the pack with a test in `tests/de/`) or a source error missing from GD §9.5 (add a ledger row with an authority URL and report it); never a silent skip.
- [ ] **Step 5:** commit `feat(conjugation-engine): German corpus import with a sourced corrections ledger`.

### Task 6: Corpus guards

**Files:**
- Create: `tests/de/corpus-guards.test.ts`

**Interfaces:**
- Consumes: `tests/fixtures/de.json`, `tests/fixtures/corrections.json`, `german` (Task 5), `conjugate`.

- [ ] **Step 1: Write the guard tests:**
  - **over-generation**: in every target of every German fixture query, every form after the preferred one has a non-null `variant.pattern`, `condition` or `region`, or a non-standard `usage` — the engine never returns two indistinguishable forms. ("Extra" is read as "beyond the preferred form": the preferred form may be one the oracle omits, e.g. `brenn`, `kenn`, `hab`, whose tagged partner `brenne` / `habe` is the oracle's.) Known tagged extras that must appear: `ich habe gefahren` (condition), `brenne` (`pattern: 'long'`), `schwur` (`usage: 'dated'`), `kämst` (`'short'`), `leihe` (`'long'`), `ich bin gestanden` (`region: 'south'`).
  - **old spelling** (Review Focus 5): no generated form of any German fixture query equals a form that correction C1 removed, and none contains `geschrieen`, `gespieen` or `daß`.
  - **coverage**: every `germanCatalogue` entry is the target of at least one fixture cell; the `subject` ids in `de.json` are exactly `1sg 2sg 3sg 1pl 2pl 3pl 2.formal` (`3sg.f` and `3sg.n` are asserted in Task 4).
  - **remap audit**: every cell with a `heading` has the target its remap names, and there are 5 × 6 × 139 = 4,170 such cells.
  - **ledger shape**: exactly 412 German records; every `source` host is one of `www.rechtschreibrat.com`, `grammis.ids-mannheim.de`, `www.dwds.de`, `www.duden.de`.
- [ ] **Step 2:** run — the guards should pass; if over-generation fails, tag the variant in the pack (never relax the guard).
- [ ] **Step 3:** root gate — PASS.
- [ ] **Step 4:** commit `test(conjugation-engine): German corpus guards for variants, spelling, coverage and remaps`.

### Task 7: Independent tests: invented verbs, real verbs outside the oracle, explanations

**Files:**
- Create: `tests/de/invented.test.ts`, `tests/de/real.test.ts`
- Modify: `tests/i18n/runtime.test.ts` (add `'de'`; its German query set is every fixture verb plus the GD §8.1 and §8.2 verbs, unfiltered and with `subject: '2.formal'`)

**Interfaces:**
- Consumes: the public API only (`conjugate`, `explain`).

- [ ] **Step 1: Write the tests.** `invented.test.ts`: one `it` per GD §8.1 row, asserting the listed forms per target (output order) and, where the row names them, the exact assumption ids in `analysis.steps` (e.g. `schlinken` → `['de.classify.default-weak', 'de.classify.default-haben', 'de.classify.default-stress']`; `flompieren` → no `default-stress`; `aufschlinken` → `assume-separable` with `{ particle: 'auf' }`; `beschlinken` + `separablePrefix: 'be'` → `INVALID_HINT`). `real.test.ts`: one `it` per GD §8.2 row. Before committing `real.test.ts`, open each verb's DWDS table, tick it in the task report and verify the four [U] rows (beantragen, bedingen, beugen, überzeugen); a form that differs from DWDS is fixed in the test (and in the engine if needed), never kept.
- [ ] **Step 2:** run — FAIL only where the pack is wrong; fix the pack (each fix with the smallest test that shows it).
- [ ] **Step 3:** root gate including `tests/i18n/runtime.test.ts` (every German form and unavailable target explains in `en` and `nl` without `{` or `undefined`).
- [ ] **Step 4:** commit `test(conjugation-engine): German invented and out-of-corpus verbs, explained in both locales`.

### Task 8: Documentation and equivalence map

**Files:**
- Create: `docs/grammar/de.md`; `src/equivalence/de.ts` only if `src/equivalence/` exists (else the table goes into `docs/grammar/de.md`)
- Modify: `README.md` (package; language list and corpus table row: German, 139 files, 139 infinitives, 12,788 cells), `src/equivalence/index.ts` (one line, only if it exists)

**Interfaces:**
- `src/equivalence/de.ts` (if present): the total map of GD §10, typed like the French and Dutch maps.

- [ ] **Step 1:** write `docs/grammar/de.md`: rule inventory by stage with citations and URLs (generated from `germanRules` / `germanCitations` by a throwaway script, then edited), classification order and defaults (GD §3), the shared Germanic helpers and what stays per language (GD §6.4), what is out (GD §2.4), corrections summary with counts (GD §9.5), remaps, `printOnly` and `lexiconNotes`.
- [ ] **Step 2:** if `src/equivalence/` exists: add the map, regenerate `tests/equivalence/matrix.tsv` with its script, run its tests.
- [ ] **Step 3:** root gate; `npm run build && npm test -w verbodrome`.
- [ ] **Step 4:** CLI spot checks recorded in the report: `npm run cli -w conjugation-engine -- de schlinken --explain --locale nl`, `de umziehen --mood indicative --tense perfect`, `de aufschlinken --mood imperative --subject 2.formal --explain`, `de heissen --person 2 --number singular --mood indicative --tense present`.
- [ ] **Step 5:** commit `docs(conjugation-engine): German grammar notes and tense equivalence`.
