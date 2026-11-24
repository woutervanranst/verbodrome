# Seven-Language Engine — Plan 2: Core Completion and Dutch

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Finish the staged core's contract (subjects and gender, multi-paradigm verbs, lexeme-aware cells, a stable authoring surface), then move Dutch onto it with explanations in Dutch and English and output identical to the frozen snapshot except for two decided behaviour changes.

**Architecture:** Part A changes hook signatures every language pack implements, so it lands before any real pack exists; the toy pack in `tests/toy/` is updated alongside and stays the worked example. Part B rebuilds Dutch as a `StagedGrammar` in shadow mode: the new pack is compared against the frozen snapshot query by query with a shrinking pending list while the legacy resolver still serves `conjugate`, then the pack is switched and the legacy files are deleted.

**Tech Stack:** TypeScript 7 strict, Node 26, Vitest 5, npm workspaces. No new dependencies.

**Spec:** `docs/superpowers/specs/2026-11-24-seven-language-engine-design.md`

**Builds on:** Plan 1 (`docs/superpowers/plans/2026-11-24-seven-language-engine-01-foundation.md`), including its final-review fix wave. Read `src/core/staged.ts`, `clause.ts`, `periphrasis.ts`, `pack.ts`, `fork.ts`, `derivation.ts` and `tests/toy/pack.ts` before starting any task: they are the contracts this plan extends.

## Global Constraints

- All paths are relative to `packages/conjugation-engine/` unless they start with `apps/` or `docs/`.
- Branch `feat/seven-language-engine`; one commit per task; every commit keeps `npm run typecheck && npm test` green at the workspace root and `npm run corpus:check` passing.
- The engine keeps zero runtime dependencies; nothing under `src/` imports `node:*` (except `src/cli.ts`), `scripts/` or `tests/`.
- French output must not change at all in this plan (`tests/characterization.test.ts`, French half; `tests/corpus.test.ts`).
- Dutch output must match the frozen snapshot exactly, except for entries in `tests/characterization/intended-diffs.json`, each with `reason` (more than 30 characters) and an `https://` `source`. The only permitted reasons are the two behaviour changes in Task 10. Nothing under `tests/characterization/*.gz` or `*.queries.json` is edited.
- `tests/fixtures/*` stay byte-identical; new optional corpus fields are omitted when absent.
- The six consuming app files compile unchanged: `apps/verbodrome/src/trainer/{forms,prompt,distractors,question}.ts`, `apps/verbodrome/src/config/{tenses,verbs}.ts`. In particular the Dutch options `pronoun`, `inversion`, `reflexive`, `auxiliary`, `classHint`, `stems`, `separablePrefix`, `inseparablePrefix` keep their names and meaning, and `apps/verbodrome/tests` stay green.
- Every Dutch rule has an English and a Dutch message and a citation; `tests/i18n/completeness.test.ts` passes for the Dutch pack. Dutch grammar citations use e-ANS (`https://e-ans.ivdnt.org/…`) and the Taalunie Leidraad on `https://woordenlijst.org/…`, as `docs/grammar.md` already does; a rule is never cited to the scraped corpus source.
- Rule ids are `nl.<stage>.<name>` in kebab case. Messages are written for a learner: one sentence, naming the forms involved through `{before}` / `{after}` and params, no jargon the trainer's audience (secondary-school pupils) would not know.

## Review Focus

1. **A verb with two paradigms and an explicit hint.** `voorkomen` with `separablePrefix: 'voor'` must return only that paradigm, exactly as today. → Task 2 and Task 10 tests.
2. **A subject asked for that the tense does not have** (`subject: 'u'` with the imperative, or a formal slot on a non-finite mood). Expected: `INVALID_TARGET`, as for any filter that matches nothing. → Task 1 test.
3. **Explaining every form.** No form of any snapshot query may make `explain` throw in `en` or `nl`. → Task 9 test (the spec's runtime i18n check).
4. **An invented verb that looks prefixed but is not** (`bezemen`, `gebeuren`-like `geblieken`, `verfen`). Expected: the pack does not strip `be-` / `ge-` / `ver-` when the remainder is not a plausible stem; behaviour identical to the snapshot. → Task 6 tests.
5. **A reflexive verb in inversion with a separable particle** (`zich opwinden`, inverted). Expected: order and parts identical to the legacy output. → Task 8 test against the snapshot plus one explicit case.

---

## Part A — Core completion

### Task 1: Subject slots and subject gender

**Files:**
- Modify: `src/core/pack.ts`, `src/core/engine.ts`, `src/core/target.ts`, `src/core/clause.ts`, `src/core/staged.ts`, `src/core/options.ts`, `src/types.ts`, `src/index.ts`, `src/cli.ts`, `tests/toy/pack.ts`, `tests/toy/messages.ts`
- Test: `tests/core/subjects.test.ts`

**Interfaces:**
- Produces (`src/core/pack.ts`):

```ts
export interface SubjectSlot {
  readonly id: string;                         // unique within the pack, e.g. '3sg.f', '2sg.formal'
  readonly person: Person; readonly number: GrammaticalNumber;
  readonly pronoun: string | null;             // null for pro-drop languages' unmarked subject
  readonly gender?: Gender; readonly register?: 'formal' | 'informal';
  readonly default: boolean;                   // part of an unfiltered query
}
// on LanguagePack:
readonly subjects?: readonly SubjectSlot[];
/** Slots to expand for this query. Default: the slot named by the common `subject` option, else every default slot. */
subjectsFor?(query: Readonly<Record<string, unknown>>): readonly SubjectSlot[];
```

- `LanguagePack.genderedTargets?: boolean` — set by packs where the subject's gender changes the verb phrase (French, Italian, Latin).
- `ResolvedTarget` gains optional `subject?: string` (slot id). `target.gender` is the slot's gender only when the pack sets `genderedTargets`; otherwise it stays `null` and the slot's gender is informational (Dutch `zij` / `het`, German `sie` / `es`, English `she` / `it`), which keeps the frozen Dutch targets unchanged. Both fields are absent/`null` for packs without `subjects`, so legacy French and Dutch targets are unchanged.
- Common option `subject` (a slot id), accepted only for packs that declare `subjects`; unknown id → `INVALID_REQUEST`.
- `ClauseContext.subject: SubjectSlot | null`.
- `targetKey` / `resolvedTargetKey` include the subject id when present; keys without it are unchanged.
- Root export `getSubjects(language): readonly SubjectSlot[]` (empty for packs without slots). CLI: `--subject <id>`, and form labels show the subject id when a target has one.

Expansion for a finite catalogue entry of a pack with `subjects`: for each `[person, number]` of the entry, one target per slot returned by `subjectsFor(query)` with that person and number, in slot order. An entry's `persons` that no selected slot matches contributes nothing; if the whole query then has no target, `INVALID_TARGET`.

- [ ] **Step 1: Failing tests** (`tests/core/subjects.test.ts`, toy gains slots `mi tu il ila(f, non-default) Vu(2sg formal, non-default, conjugates as 3sg) nos vos ils`):

```ts
it('expands default slots only', () => { /* unfiltered present: 6 targets, subjects mi tu il nos vos ils; no gender set */ });
it('returns a non-default slot on request', () => { /* subject: '3sg.f' → 'ila placat', target.subject '3sg.f'; target.gender null without genderedTargets, 'feminine' for a copy of the toy pack with genderedTargets: true */ });
it('conjugates a formal slot with the person it governs', () => { /* subject: '2sg.formal' → 'Vu placat' */ });
it('rejects an unknown subject and a subject on a pack without slots', () => { /* INVALID_REQUEST both; fr: 'Unknown fr option: subject.' */ });
it('rejects a subject the tense does not have', () => { /* imperative + '2sg.formal' when the toy imperative lists only [2, sg] default → INVALID_TARGET */ });
it('keeps legacy targets structurally unchanged', () => { /* fr target has no `subject` key */ });
```

- [ ] **Step 2:** run `npx vitest run tests/core/subjects.test.ts` — FAIL.
- [ ] **Step 3:** implement; the toy's clause takes its pronoun from `context.subject`.
- [ ] **Step 4:** `npm run typecheck && npm test` at the root — PASS.
- [ ] **Step 5:** commit `feat(conjugation-engine): subject slots and subject gender for staged packs`.

### Task 2: Several paradigms for one lemma

**Files:**
- Modify: `src/core/staged.ts`, `src/types.ts`, `src/i18n/explain.ts`, `tests/toy/pack.ts`, `tests/toy/messages.ts`
- Test: `tests/core/staged.test.ts`

**Interfaces:**
- `StagedGrammar.classify(query): Fork<X>` — one outcome per paradigm, each with its own steps and tags (`pattern` names the paradigm, `condition` says when it applies). At least one outcome, otherwise `GENERATION_FAILURE`.
- The executor runs every construction once per lexeme; a lexeme's tags merge into each of its forms (so `variant.pattern` / `variant.condition` tell the paradigms apart) and its classification steps are that paradigm's.
- `VerbAnalysis` gains optional `alternatives?: readonly VerbAnalysis[]`: the top-level analysis is the first paradigm; `alternatives` lists the others and is absent when there is one. `availability` is asked per lexeme; a target unavailable in every paradigm is reported once.
- `explain(analysis)` renders one section per paradigm.

- [ ] **Step 1: Failing tests:** a toy verb with a separable and an inseparable reading returns both sets of forms (`variant.pattern` `separable` / `inseparable`, different participles and auxiliaries, never crossed); with the toy's prefix hint only one; `analysis.alternatives` has length 1; single-paradigm verbs have no `alternatives` key.
- [ ] **Step 2–5:** run (FAIL), implement, gate, commit `feat(conjugation-engine): several paradigms for one lemma`.

### Task 3: Lexeme-aware cells and periphrases

**Files:**
- Modify: `src/core/staged.ts`, `src/core/periphrasis.ts`, `tests/toy/pack.ts`, `tests/toy/messages.ts`
- Test: `tests/core/staged.test.ts`

**Interfaces:**
- `StagedGrammar.cellOf(target: ResolvedTarget, lexeme: X): Cell | null`.
- `Periphrasis.applies?(lexeme: LexemeBase): boolean` — a periphrasis without it applies to every lexeme. `validateGrammar` is unchanged; "no periphrasis applies and `cellOf` is null" stays a `GENERATION_FAILURE` naming target and lemma.

- [ ] **Step 1: Failing tests:** a toy "deponent" class whose perfect is one word for ordinary verbs and participle + auxiliary for deponents, selected through `cellOf(target, lexeme)` and `applies`; the ordinary verb gets no periphrasis step, the deponent does.
- [ ] **Step 2–5:** run (FAIL), implement, gate, commit `feat(conjugation-engine): lexeme-aware cells and periphrases`.

### Task 4: Grammar vocabulary and part features for all seven languages

**Files:**
- Modify: `src/core/grammar.ts`, `src/types.ts`, `src/core/clause.ts`, `src/core/pack.ts`, `src/parts.ts`, `src/cli.ts`, `tests/toy/pack.ts`
- Test: `tests/core/staged.test.ts`, `tests/cli.test.ts`, `tests/options.typecheck.ts`

**Interfaces:**
- `Case` gains `'vocative'`. `UnavailableTarget.reason` gains `'noPassive'`. `VerbForm` gains `'gerund' | 'gerundive' | 'supine' | 'futureParticiple'`.
- `PartFeatures` gains optional `voice?: Voice | null`, `case?: Case | null`, `aspect?: 'progressive' | null`; `cellFeatures` copies the cell's voice and agreement case.
- `ClauseContext.agreeing: readonly Cell[]` — the cells that will take the agreement (empty when `agreements` is asked for nothing), so a pack no longer infers it from the target's mood. The toy's `agreements` uses it.
- `wordPart(rendering, word, options?: { joinBefore?: ConjugationPart['joinBefore']; onsetFlags?: Readonly<Record<string, boolean>> })`; `PackRendering.onset(text, flags: Readonly<Record<string, boolean>>)` (French keeps reading `flags.aspiratedH`).
- CLI form labels append voice, agreement case, `variant.region` and the subject id when present.

- [ ] **Step 1: Failing tests:** a toy passive part carries `features.voice === 'passive'`; a declined toy participle carries `features.case`; `agreements` receives the participle cell in `agreeing`; the CLI label of a French form is unchanged (existing tests) and a helper-level test shows voice and region in a label.
- [ ] **Step 2–5:** run (FAIL), implement, gate (French and Dutch snapshots unchanged), commit `feat(conjugation-engine): grammar vocabulary and part features for all target languages`.

### Task 5: Authoring surface on `./core`, schema tied to the registry

**Files:**
- Create: `src/core/index.ts`
- Modify: `package.json` (`exports`), `src/index.ts`, `src/core/options.ts`, `src/core/pack.ts`, `src/options.ts`, `src/core/spec.ts`, `tests/package.test.ts`, `tests/options.typecheck.ts`, `docs/api.md`

**Interfaces:**
- `package.json` exports gain `"./core"` → `dist/core/index.js` (+ types). `src/core/index.ts` exports the whole pack-authoring API: `createEngine`, `stagedEngine`, `validateGrammar`, `defineRules`, `step`, `one`, `chain`, `combine`, `mergeTags`, `applyJunctureRules`, `wordPart`, `grammaticalPart`, the catalogue helpers, the usage ranking, and every type a pack author names (`LanguagePack`, `SubjectSlot`, `CatalogueEntry`, `PackRendering`, `OptionSchema`, `FieldSpec`, `StagedGrammar`, `ClauseGrammar`, `ClauseContext`, `ChainWord`, `Periphrasis`, `ChainElement`, `VerbRef`, `Cell`, `LexemeBase`, `Unavailability`, `Fork`, `Outcome`, `VariantTags`, `JunctureRule`, `Juncture`, `RuleInfo`, `Stage`, `StepKind`, `StepParam`, `ParamKind`, `TermRef`, `Work`, `Citation`, `Catalog`).
- The root (`src/index.ts`) keeps the consumer API only (`conjugate`, `explain`, `getCatalogue`, `getSubjects`, `languages`, `renderParts`, options builder and parser, `ConjugationError`, result and option types, `Explanation` types, `Locale`, `DerivationStep`) plus `createEngine`, `packs` and `locales` so a consumer can assemble a custom engine. Authoring names exported from the root by Plan 1 are removed from it.
- A pack's schema is typed against its spec: `OptionSchema<Fields extends string>` and `LanguagePack<L>['options']: OptionSchema<keyof LanguageRegistry[L]['context'] | 'auxiliary' | 'classHint' | 'stems'>` for registered languages, so a missing or extra field is a compile error.
- The builder throws at construction when a schema field or mood name collides with a builder method.
- `LanguageSpec` constrains `nonFinite` to the mood keys of `tenses` (a spec that violates it fails to compile).

- [ ] **Step 1: Failing tests:** `tests/package.test.ts` imports the built package's `./core` subpath and finds `stagedEngine`, and asserts the root no longer exports it; a typecheck case shows a pack schema with a field missing from its spec is rejected; a runtime test builds a pack whose schema has a field named `build` and expects the constructor to throw.
- [ ] **Step 2–5:** run (FAIL), implement, gate (`apps/verbodrome` builds and its tests pass), commit `refactor(conjugation-engine): pack-authoring API on the ./core subpath`.

### Task 6: Corpus model for seven languages

**Files:**
- Modify: `scripts/corpus/model.ts`, `scripts/corpus/languages/{fr,nl,index}.ts`, `scripts/corpus/parsers/{fr,nl}.ts`, `scripts/corpus/import.ts`, `tests/corpus.test.ts`, `tests/corpus-parser.test.ts`, `docs/grammar.md`

**Interfaces:**
- `corpusCell(fields: { … })` takes one object instead of eight positional parameters. `CorpusCell.pronoun` is typed `string | null`. New optional cell fields, omitted from the JSON when absent: `voice`, `subject` (slot id), `variant` (`{ pattern?: string; region?: string }`), `scope: 'unmodelled'` with `reason`, `heading` (source heading path, for remap audit). `CorpusFile.pattern` becomes `string` (`'default'` stays the value for ordinary files).
- `CorpusLanguage.query(file)` returns `readonly { label: string; options: Record<string, unknown> }[]`; `applicable(file, cell, forms, label)` is called per labelled query and a cell is satisfied only by forms from queries whose `applicable` returns them, so a cell can no longer pass on another query's forms by accident. `CorpusLanguage` gains `remaps?: readonly { heading: string; occurrence: number; target: …; reason: string; source: string }[]` and `unmodelled?: Readonly<Record<string, string>>` (reason code → explanation).
- Shared helper `infinitiveFromFileName(name: string): string` in `model.ts`.
- `import.ts --only` refuses to run when the existing manifest's revision differs from the pinned one.
- Fixture JSON for French and Dutch is byte-identical after re-import.

- [ ] **Step 1: Failing test:** `tests/corpus.test.ts` uses labelled queries; add a unit test that a cell is not satisfied by a form coming from a query whose `applicable` rejects it.
- [ ] **Step 2–4:** run (FAIL), implement, re-import (`npm run corpus:import -- --source /Users/wouter/Downloads/VerbodromeX && git diff --exit-code -- tests/fixtures` → exit 0), gate, `npm run corpus:check`.
- [ ] **Step 5:** commit `refactor(conjugation-engine): corpus model ready for seven languages`.

---

## Part B — Dutch on the staged core

The legacy implementation is the specification of behaviour: `src/languages/nl/index.ts` (resolution, composition, word order), `rules.ts` (present, past, participles, imperative), `orthography.ts` (`nativeStem`, `weakSuffixes`, `gePrefix`, `strongPastPlural`), `exceptions.ts` (lexicon, prefix tables, loans). The frozen snapshot (`tests/characterization/nl.*`, 1,478 queries) is the acceptance test. Each task below moves one stage; none changes what Dutch produces.

File layout after Part B (`src/languages/nl/`): `spec.ts`, `catalogue.ts` (with subject slots), `options.ts`, `rendering.ts`, `lexicon.ts`, `stems.ts`, `paradigms.ts`, `orthography.ts`, `periphrasis.ts`, `clause.ts`, `rules.ts` (the `defineRules` table), `sources.ts`, `grammar.ts` (assembles the `StagedGrammar`), `pack.ts`; messages in `src/i18n/locales/{en,nl}/nl.ts`. The legacy `index.ts`, old `rules.ts`, `exceptions.ts` are deleted in Task 10 (the name `rules.ts` is reused; until Task 10 the new table lives in `rule-table.ts` and is renamed there).

### Task 7: Dutch lexicon, classification and stems

**Files:**
- Create: `src/languages/nl/lexicon.ts`, `stems.ts`, `rule-table.ts`, `sources.ts`, `grammar.ts`, `src/i18n/locales/en/nl.ts`, `src/i18n/locales/nl/nl.ts`, `tests/nl/stems.test.ts`, `tests/nl/shadow.test.ts`, `tests/nl/shadow-pending.txt`
- Modify: `src/i18n/locales/{en,nl}/index.ts`, `src/languages/nl/catalogue.ts` (subject slots)

**Interfaces:**
- Produces: `dutchGrammar: StagedGrammar<DutchLexeme>` (partial: only the stages this task covers are real, the rest throw a clearly named "not migrated yet" error) and `shadowDutch = createEngine({ nl: { ...dutchPack, engine: query => stagedEngine(dutchGrammar, dutchPack.rendering, query) } }, catalogs)` built inside the shadow test.
- `tests/nl/shadow.test.ts`: for every Dutch snapshot query not listed in `shadow-pending.txt` (one header line per pending query), `characterize` through the shadow engine equals the frozen block; and the pending file may only shrink (`expect(pending.length).toBeLessThanOrEqual(PINNED)`, the constant lowered in each task). Task 7 starts with every query pending.
- Lexicon data moves verbatim from `exceptions.ts` (re-exported from the old path until Task 10 so the legacy resolver keeps working). `DutchLexeme extends LexemeBase` adds the principal parts and flags the stages need.
- Subject slots: `ik`, `jij` (default) / `je`, `u` (formal), `hij` (default) / `zij` / `ze` / `het`, `wij` (default) / `we`, `jullie`, `zij` plural (default) / `ze` plural; `subjectsFor` implements the legacy `pronoun` option (a pronoun text selects every slot with that pronoun), so `pronoun: 'u'`, `'het'`, `'ze'` behave as in the snapshot.
- Rules (ids fixed here; one message each in `en` and `nl`, one citation each): `nl.classify.lexicon`, `nl.classify.default-weak` (assumption), `nl.classify.loan`, `nl.classify.separable`, `nl.classify.inseparable`, `nl.classify.default-hebben` (assumption), `nl.stem.drop-en`, `nl.stem.undouble-consonant`, `nl.stem.lengthen-vowel`, `nl.stem.unstressed-e` (assumption when inferred), `nl.stem.devoice` (v→f, z→s in writing), `nl.stem.lexical` (listed stem).

- [ ] **Step 1: Failing tests** `tests/nl/stems.test.ts` — the present stem and its steps for `werken` (`werk`; drop-en), `bakken` (`bak`; drop-en, undouble), `lopen` (`loop`; drop-en, lengthen), `leven` (`leef`; drop-en, lengthen, devoice), `reizen` (`reis`), `wandelen` (`wandel`; unstressed-e), `zorven` invented (`zorf`), `trapen` invented (`traap`), `kunnen` (lexical); assumptions of an unlisted verb equal the four English sentences the legacy engine emits today (they are in the snapshot's `A` lines).
- [ ] **Step 2:** run — FAIL.
- [ ] **Step 3:** implement classification and stem formation as recorded rules; write messages and citations (e-ANS 2.3 for classes, Leidraad 11.1–11.2 for stem spelling).
- [ ] **Step 4:** gate; `tests/i18n/completeness.test.ts` now covers `nl`.
- [ ] **Step 5:** commit `feat(conjugation-engine): Dutch lexicon, classification and stems as recorded rules`.

### Task 8: Dutch endings, spelling rules, compound tenses and clause

**Files:**
- Create: `src/languages/nl/paradigms.ts`, `orthography.ts` (new content; the legacy file's functions move to where the legacy resolver still needs them), `periphrasis.ts`, `clause.ts`, `tests/nl/forms.test.ts`
- Modify: `src/languages/nl/grammar.ts`, `rule-table.ts`, `sources.ts`, both message files, `tests/nl/shadow-pending.txt`

**Interfaces:**
- Rules: `nl.end.present` (–, -t, -t, -en), `nl.end.present-t-drop` (stem ends in t), `nl.end.inversion-t-drop` (jij/je after the verb), `nl.end.past-weak` with `nl.orth.dental-kofschip` (-te after voiceless final sound of the underlying stem, else -de), `nl.end.past-strong`, `nl.end.past-plural-strong`, `nl.part.ge-prefix`, `nl.part.ge-blocked` (inseparable prefix), `nl.part.ge-diaeresis` (geë-), `nl.part.weak` (-d / -t), `nl.part.strong` (listed), `nl.part.present` (infinitive + d), `nl.imp.stem`, `nl.cell.lexical` (listed whole form: ben, bent, is, kunt…), `nl.periphrasis.perfect`, `.pluperfect`, `.future`, `.future-perfect`, `.conditional`, `.conditional-perfect`, `nl.clause.subject`, `nl.clause.inversion`, `nl.clause.reflexive`, `nl.clause.particle-final`, `nl.clause.particle-attached`.
- Six periphrases exactly as the legacy composition builds them, including the `wezen` spoken alternative (a second `Periphrasis` entry with its `condition` text identical to today's) and auxiliary forks for verbs taking both `hebben` and `zijn` (`condition` text identical to today's).
- Availability: impersonal, singular-only and no-imperative verbs through `availability`, with the same reasons, English explanations and source URL as today.

- [ ] **Step 1: Failing tests** `tests/nl/forms.test.ts` — explanations (rule ids in order) for `ik werkte` (drop-en, past-weak, dental-kofschip → te), `ik leefde` (underlying v → de although written f), `gewerkt`, `verhuisd` (ge-blocked), `geëindigd` (diaeresis), `ik heb gewerkt` (auxiliary steps present on the auxiliary part, periphrasis step on the form), `werk jij` (inversion-t-drop), `ik sta op` / `opgestaan` (particle), `zich vergissen` inverted (the Review Focus case, exact text from the snapshot).
- [ ] **Step 2:** run — FAIL.
- [ ] **Step 3:** implement; after each stage re-run the shadow test and delete from `shadow-pending.txt` every query that now matches; lower `PINNED`.
- [ ] **Step 4:** gate. The pending list must be empty except for queries affected by Task 10's two behaviour changes (list them in the report).
- [ ] **Step 5:** commit `feat(conjugation-engine): Dutch endings, spelling, compound tenses and clause on the staged core`.

### Task 9: Explain every Dutch form; CLI in the chosen locale

**Files:**
- Create: `tests/i18n/runtime.test.ts`
- Modify: `src/cli.ts`, `tests/cli.test.ts`, message files as needed

**Interfaces:**
- `tests/i18n/runtime.test.ts`: for every Dutch snapshot query, every form and every unavailable target of the shadow engine explains in `en` and `nl` without throwing, and no rendered step text contains `{` or `undefined`. (This file is the spec's runtime i18n check; later language plans add their language to its list.)
- CLI: with `--locale`, an unavailable target's reason is printed through `explain` in that locale; `--explain` step lines are tested end to end against the built CLI once Dutch is switched (Task 10 enables the test).

- [ ] **Steps:** failing test, run, fix messages or term resolution until green, gate, commit `test(conjugation-engine): every Dutch form explains in English and Dutch`.

### Task 10: Switch Dutch, apply the two decided behaviour changes, delete the legacy code

**Files:**
- Modify: `src/languages/nl/pack.ts` (engine = staged), `rule-table.ts` → `rules.ts`, `tests/characterization/intended-diffs.json`, `tests/characterization.test.ts` (pinned ledger count), `tests/nl.test.ts`, `tests/novel.test.ts`, `tests/query.test.ts` where they pin the old behaviour of the two changes, `scripts/corpus/languages/nl.ts`, `docs/grammar.md` → `docs/grammar/nl.md` (Dutch section moved and rewritten as a rule inventory with citations), `README.md`
- Delete: `src/languages/nl/index.ts` (legacy resolver), legacy `rules.ts`, `exceptions.ts`, `tests/nl/shadow.test.ts`, `tests/nl/shadow-pending.txt`

**Behaviour changes (decided with the user; the only permitted ledger entries):**
1. **Unknown verb starting with a known separable particle** (`opzorpen`): split it (`ik zorp op`, `opgezorpt`), recorded as assumption `nl.classify.assume-separable`, overridable with `separablePrefix` / `inseparablePrefix` (an empty-string `inseparablePrefix` is not a valid hint; "treat as one word" is expressed with `classHint` as today). The particle list is the closed list of Dutch separable particles from e-ANS; a remainder that is not a plausible stem (no vowel, or shorter than two letters before `-en`) is not split. Citation: e-ANS on separable compound verbs.
2. **Lemma that is both separable and inseparable** (`voorkomen`, `overleggen`, `doorlopen`, `overlopen`, `ondergaan`): instead of `AMBIGUOUS_CLASSIFICATION`, return both paradigms (Task 2), `variant.pattern` `separable` / `inseparable`, each with its own auxiliary and a `condition` gloss. With a prefix hint, only that paradigm, exactly as today.

Each affected snapshot query gets ledger entries (`was` / `now` lines) with a reason naming the change and the e-ANS URL. Queries not affected must match with no entry.

- [ ] **Step 1:** update the three pinning tests to the new behaviour (failing).
- [ ] **Step 2:** switch the pack; implement the two changes; generate ledger entries with a throwaway script that diffs old and new blocks for the affected queries only, review them by hand, and commit the ledger (the script is not committed).
- [ ] **Step 3:** delete the legacy files and the shadow test; rename the rule table.
- [ ] **Step 4:** gate, `npm run corpus:check` (all 10,764 Dutch cells pass with the staged pack; the `het` and reflexive special cases still go through `scripts/corpus/languages/nl.ts`), `npm run build && npm test -w verbodrome`.
- [ ] **Step 5:** CLI spot checks recorded in the report: `npm run cli -- nl opzorpen --explain --locale nl`, `nl voorkomen`, `nl leven --mood indicative --tense past --person 1 --number singular --explain`.
- [ ] **Step 6:** commit `feat(conjugation-engine): Dutch runs on the staged core and explains itself`.
