# Seven-Language Engine — Plan 1: Foundation

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Freeze today's French and Dutch behaviour in a snapshot, make the engine's shared modules language-agnostic, and add the rule-first core (derivation steps, forks, staged engine, compound-tense executor, explanations) that every language pack will be built on.

**Architecture:** The orchestrator keeps talking to one small contract, `LanguageEngine.generate(target)`. A `LanguagePack` supplies catalogue, option schema, rendering hooks and an `engine(query)` factory. The existing French and Dutch resolvers plug in unchanged; new packs build their `engine` with `stagedEngine(grammar)`, which runs classify → stem → ending → orthography → periphrasis → clause and records a `DerivationStep` for every rule applied. A test-only toy pack proves the staged path before any real language uses it.

**Tech Stack:** TypeScript 7 (strict, `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`, `verbatimModuleSyntax`), Node 26, Vitest 5, npm workspaces. No new dependencies.

**Spec:** `docs/superpowers/specs/2026-11-24-seven-language-engine-design.md`

This is plan 1 of a series. Later plans: 2 Dutch on the spine, 3 French rebuild, 4 tense equivalence, 5–9 de / es / it / la / en, 10 trainer + exports + docs.

## Global Constraints

- All paths below are relative to `packages/conjugation-engine/` unless they start with `apps/` or `docs/`.
- Branch `feat/seven-language-engine`; one commit per task; every commit keeps `npm run typecheck && npm test` green at the workspace root.
- The engine keeps zero runtime dependencies; nothing under `src/` may import `node:*`, `scripts/` or `tests/` (enforced by `tests/package.test.ts`).
- French and Dutch output must not change in this plan: `tests/characterization.test.ts` (Task 1) and `tests/corpus.test.ts` stay green with an empty intended-diff ledger and byte-identical `tests/fixtures/*`.
- The six consuming app files must compile unchanged: `apps/verbodrome/src/trainer/{forms,prompt,distractors,question}.ts`, `apps/verbodrome/src/config/{tenses,verbs}.ts`. New fields on `ConjugationPart`, `PartFeatures`, `ResolvedTarget`, `GeneratedForm` are optional.
- Public names that stay exported with the same meaning: `conjugate`, `conjugationOptions`, `ConjugationOptionsBuilder`, `parseConjugationOptions`, `renderParts`, `getCatalogue`, `ConjugationError`, and the types `FrenchTenses`, `DutchTenses`, `FrenchConjugationOptions`, `DutchConjugationOptions`, `ConjugatedForm`, `ConjugationPart`, `ConjugationResult`, `CatalogueEntry`.
- Error codes are unchanged. Error messages may change only where they name the language list.
- Corpus fixtures stay neutral (commit `5e7d30d`): no source file names, encodings, file checksums or site names in `tests/fixtures/` or the manifest; parser modules are named by language.
- Commit messages end with `Co-Authored-By: Claude Fable 5.2 <noreply@anthropic.com>`.

## Review Focus

1. **A query that used to conjugate now throws (or the reverse).** Expected: the characterization test reports it as a changed block, not as a crash. → Task 1 test `records errors as E lines`.
2. **An unregistered language code.** Expected: `UNSUPPORTED_LANGUAGE` naming the registered languages, from `conjugate`, `getCatalogue` and `renderParts` alike. → Task 3 test.
3. **Variant branches that contradict each other** (a traditional-only stem with a rectified-only ending). Expected: the branch is dropped, never emitted with mixed tags. → Task 6 test `drops conflicting branches`.
4. **A rule without message text, reached from plain JavaScript where the type check does not apply.** Expected: `explain` throws a `ConjugationError('GENERATION_FAILURE')` naming the rule id and locale, never prints `undefined`. → Task 9 test.
5. **A malformed catalog message** (unbalanced brace, unsupported ICU type, placeholder the rule never supplies). Expected: caught by the completeness test, not at render time. → Tasks 8 and 9 tests.

---

### Task 1: Characterization snapshots for French and Dutch

**Files:**
- Create: `scripts/characterize/serialize.ts`, `scripts/characterize/build-queries.ts`, `scripts/characterize/write.ts`
- Create: `tests/characterization/{fr,nl}.queries.json`, `tests/characterization/{fr,nl}.tsv`, `tests/characterization/intended-diffs.json`
- Create: `tests/characterization.test.ts`
- Modify: `package.json` (scripts), `tsconfig.json` only if `scripts/characterize` is not already included by the `scripts` glob

**Interfaces:**
- Produces: `characterize(query: CharacterizationQuery): string[]` and `queryHeader(query: CharacterizationQuery): string` from `scripts/characterize/serialize.ts`, where `type CharacterizationQuery = { readonly language: 'fr' | 'nl'; readonly infinitive: string } & Readonly<Record<string, unknown>>`.
- Produces: ledger entry type `IntendedDiff { readonly query: string; readonly was: string | null; readonly now: string | null; readonly reason: string; readonly source: string }` (`query` is the header line; `was` / `now` are whole lines, `null` for an added or removed line).

Line format (tab-separated; `-` for null; arrays joined with `,`; one block per query, blocks separated by a blank line):

```
# {"infinitive":"aller","language":"fr"}          header: JSON with keys sorted
A  verbId  classification  classificationSource  reflexive(1|0)  auxiliaries  assumptions(joined with " | ")
F  mood/tense/person/number/gender/agreementGender.agreementNumber  text  roles  orthography  auxiliary  pattern  usage  condition  preferred(1|0)
U  mood/tense/person/number  reason
E  ERROR_CODE                                      the whole block when conjugate throws ConjugationError
```

`roles` is one letter per part: `m` moodMarker, `s` subject, `r` reflexivePronoun, `a` auxiliary, `v` lexicalVerb, `p` particle, `l` linker. Form order is the order `conjugate` returns. `ruleIds` and `labels` are not captured.

- [ ] **Step 1: Write the failing test** `tests/characterization.test.ts`

```ts
describe.each(['fr', 'nl'] as const)('characterization: %s', language => {
  it('reproduces the frozen output, apart from recorded intended differences', () => {
    // for every query in <language>.queries.json: expected = stored block with the ledger applied;
    // expect(characterize(query)).toEqual(expected), message = header line
  });
});
it('records errors as E lines', () => {
  expect(characterize({ language: 'fr', infinitive: 'plotoir' })).toEqual(['# {"infinitive":"plotoir","language":"fr"}', 'E\tAMBIGUOUS_CLASSIFICATION']);
});
it('keeps a sourced ledger with no unused entries', () => {
  expect(ledger).toHaveLength(0);                       // pinned; raised deliberately by later plans
  // every entry: reason.length > 30, source starts with https://, and was applied exactly once
});
it('pins the query inventory', () => {
  expect(queries.fr.length).toBe(FR_QUERY_COUNT);       // constants written after Step 4
  expect(queries.nl.length).toBe(NL_QUERY_COUNT);
});
```

- [ ] **Step 2: Run** `npx vitest run tests/characterization.test.ts` — expected: FAIL, module `scripts/characterize/serialize.ts` not found.

- [ ] **Step 3: Implement `serialize.ts`** with the format above, importing `conjugate` and `ConjugationError` from `../../src/index.js`. Non-`ConjugationError` exceptions propagate.

- [ ] **Step 4: Implement `build-queries.ts`** and run it once: `node --experimental-strip-types scripts/characterize/build-queries.ts`. It writes the two `queries.json` files (sorted, deduplicated by header). This script reads engine internals that plan 3 deletes; it is removed there, the JSON files stay.

French queries:
  - Lemmas: every `infinitive` in `tests/fixtures/fr.json`; every `id`, `lemmas[]` and `except[]` entry of `frenchModels`; every member of `etreVerbs`, `dualAuxiliary`, `knownAvoirVerbs`, `indirectReflexives`, `essentialReflexives`, `aspiratedH` and key of `restrictions`; every `fr` of `VERBS` in `apps/verbodrome/src/config/verbs.ts`; the derivatives `conduire construire atteindre plaindre paraître inscrire circonvenir compromettre démentir inclure rebattre annexer interviewer amonceler cacheter décrire taire suffire maudire nuire luire foutre raire asservir convenir advenir ressortir interpeller interpeler assoir`.
  - Invented probes: for every entry of every model's `suffixes`, `'zo' + suffix` when the suffix starts with a consonant, else `'zol' + suffix`; plus `bleder crebler pequer blexer zenir blettre glouloir plotoir blouvoir blouper ploucer glonger brumir plordre`.
  - Per lemma: `{language, infinitive}`, `{…, gender: 'masculine'}`; `{…, preferredOrthography: 'traditional'}` when the wildcard result has any form whose `variant.orthography !== 'both'`; `{…, auxiliary}` once per auxiliary when `analysis.auxiliaries.length > 1`.
  - Reflexive: `se ` / `s'` + lemma (elide before a vowel or h) for the reflexive sets and the first 30 corpus infinitives.
  - Every options literal passed to `conjugate`, `first` or `parseConjugationOptions` in `tests/fr.test.ts`, `tests/query.test.ts`, `tests/novel.test.ts`, `tests/fr-models.test.ts` that carries `model`, `classHint`, `stems`, `auxiliary`, `agreement`, `precedingDirectObject`, `reflexiveObject` or `aspiratedH` (copied by hand into a `hinted` array in the script).

Dutch queries:
  - Lemmas: every `infinitive` in `tests/fixtures/nl.json`; every key of `dutchExceptions`, `separableVerbs`, `inseparableDerivatives`, `inseparableVerbs`, `dutchLoans`; every `nl` counterpart in `VERBS` together with its hint options; `voorkomen overleggen doorlopen overlopen ondergaan`; invented `zorpen zorven zollen trapen opzorpen verzorpen bezorpelen wandelen blieken`.
  - Per lemma: `{language, infinitive}`, `{…, pronoun: 'u'}`, `{…, pronoun: 'het'}`, `{…, inversion: true}`.
  - Reflexive `zich ` + lemma for `vergissen schamen bemoeien` and the first 10 corpus infinitives; hinted literals from `tests/nl.test.ts`, `tests/query.test.ts`, `tests/novel.test.ts` as above.

- [ ] **Step 5: Implement `write.ts`** (reads the queries, writes `<language>.tsv`) and add scripts `"characterize:queries"` and `"characterize:write"` to `package.json`. Run `npm run characterize:write`. Write `intended-diffs.json` as `[]`. Put the two query counts into the test.

- [ ] **Step 6: Run** `npm test` in `packages/conjugation-engine` — expected: PASS, including the new file. Check `wc -c tests/characterization/*.tsv` is in the low megabytes.

- [ ] **Step 7: Commit** `test(conjugation-engine): characterization snapshots for French and Dutch`.

---

### Task 2: Language registry and derived types

**Files:**
- Create: `src/core/spec.ts`, `src/languages/registry.ts`, `src/languages/fr/spec.ts`, `src/languages/nl/spec.ts`
- Modify: `src/types.ts`
- Test: `tests/options.typecheck.ts` (extend), existing suite

**Interfaces:**
- Produces (`src/core/spec.ts`):

```ts
export interface LanguageSpec {
  tenses: Record<string, string>;   // mood -> tense ids
  nonFinite: string;                // moods without person/number
  auxiliary: string;
  classHint: string;
  stems: object;
  context: object;                  // every other language-specific option
}
```

- Produces (`src/languages/registry.ts`): `interface LanguageRegistry { fr: FrenchSpec; nl: DutchSpec }`, `type Language = keyof LanguageRegistry`.
- Produces (`src/types.ts`): `TensesFor<L>`, `MoodFor<L>`, `TenseFor<L, M extends MoodFor<L> = MoodFor<L>>`, `Mood`, `Tense` (unions over all languages), `ConjugationOptionsFor<L>`, `ConjugationOptions` (union over `Language`), and the aliases `FrenchTenses = TensesFor<'fr'>`, `DutchTenses = TensesFor<'nl'>`, `FrenchConjugationOptions = ConjugationOptionsFor<'fr'>`, `DutchConjugationOptions = ConjugationOptionsFor<'nl'>`.

`FrenchSpec.context` holds `gender`, `agreement`, `precedingDirectObject`, `reflexiveObject`, `model`, `aspiratedH`, `preferredOrthography`; `DutchSpec.context` holds `pronoun`, `inversion`, `reflexive`, `separablePrefix`, `inseparablePrefix`. The mood/tense maps, hint types and `DutchPronoun` move verbatim from `types.ts` into the two spec files and are re-exported from `types.ts`.

`ConjugationOptionsFor<L>` = `{ language: L; infinitive: string; auxiliary?; classHint?; stems? } & context & TargetQuery<L>`, with `TargetQuery` keeping today's finite / non-finite discrimination but reading the non-finite moods from the spec. No conditional type may mention a language literal.

- [ ] **Step 1: Extend `tests/options.typecheck.ts`** with assertions that the derived unions are exact:

```ts
type Equal<A, B> = (<T>() => T extends A ? 1 : 2) extends (<T>() => T extends B ? 1 : 2) ? true : false;
export const moods: Equal<Mood, 'indicative' | 'subjunctive' | 'conditional' | 'imperative' | 'infinitive' | 'participle' | 'gerund'> = true;
export const dutchMoods: Equal<MoodFor<'nl'>, 'indicative' | 'conditional' | 'imperative' | 'infinitive' | 'participle'> = true;
export const frenchSubjunctive: Equal<TenseFor<'fr', 'subjunctive'>, 'present' | 'past' | 'imperfect' | 'pluperfect'> = true;
```

- [ ] **Step 2: Run** `npm run typecheck` — expected: FAIL (`TenseFor` takes one type argument).
- [ ] **Step 3: Implement** the spec files, the registry and the derived types.
- [ ] **Step 4: Run** `npm run typecheck && npm test` at the workspace root — expected: PASS with every existing `@ts-expect-error` still firing.
- [ ] **Step 5: Commit** `refactor(conjugation-engine): derive language types from a registry`.

---

### Task 3: Language packs, generic orchestration and rendering

**Files:**
- Create: `src/core/pack.ts`, `src/core/engine.ts`, `src/languages/index.ts`, `src/languages/fr/catalogue.ts`, `src/languages/nl/catalogue.ts`, `src/languages/fr/pack.ts`, `src/languages/nl/pack.ts`
- Modify: `src/conjugate.ts`, `src/catalogue.ts`, `src/render.ts`, `src/parts.ts`, `src/index.ts`, `src/languages/fr/index.ts`, `src/languages/nl/index.ts` (call sites of `grammaticalPart` only)
- Test: `tests/pack.test.ts` (new), `tests/options.test.ts` (language-list message)

**Interfaces:**
- Consumes: Task 2 types.
- Produces (`src/core/pack.ts`):

```ts
export interface CatalogueEntry {
  readonly mood: Mood; readonly tense: Tense; readonly moodLabel: string; readonly tenseLabel: string; readonly finite: boolean;
  /** Finite entries: the person/number slots that exist, in output order. Empty for non-finite entries. */
  readonly persons: readonly (readonly [Person, GrammaticalNumber])[];
}
export interface PackRendering {
  onset(text: string, flags: { readonly aspiratedH?: boolean }): Onset;
  /** Text of `left` when it fuses with `right` (French elision), or null. The renderer then joins without a space. */
  sandhi(left: ConjugationPart, right: ConjugationPart): string | null;
  bareOmits(part: ConjugationPart): boolean;
}
export interface LanguagePack<L extends string = string> {
  readonly language: L;
  readonly catalogue: readonly CatalogueEntry[];
  readonly rendering: PackRendering;
  /** Extra target filter from language-specific options (Dutch `pronoun`). */
  acceptsTarget?(query: Readonly<Record<string, unknown>>, target: ResolvedTarget): boolean;
  /** Extra form filter after generation (French `agreement`). */
  acceptsForm?(query: Readonly<Record<string, unknown>>, form: GeneratedForm): boolean;
  /** Sort key within one target; lower sorts first. */
  rank(form: GeneratedForm, query: Readonly<Record<string, unknown>>): number;
  engine(query: Readonly<Record<string, unknown>>): LanguageEngine;
}
```

- Produces (`src/core/engine.ts`): `createEngine(packs: Readonly<Record<string, LanguagePack>>): Engine` with `Engine { conjugate(options: unknown): ConjugationResult; getCatalogue(language: string): readonly CatalogueEntry[]; renderParts(language: string, parts: readonly ConjugationPart[], context?: RenderContext): string; expandTargets(options): ResolvedTarget[]; readonly languages: readonly string[] }`. Unknown language → `ConjugationError('UNSUPPORTED_LANGUAGE', 'Language must be one of: fr, nl.')` (list from the registered packs).
- Produces (`src/languages/index.ts`): `export const packs = { fr: frenchPack, nl: dutchPack } satisfies { [L in Language]: LanguagePack<L> }`.
- `src/index.ts` builds the default engine from `packs` and re-exports the typed `conjugate`, `getCatalogue`, `renderParts`; it additionally exports `createEngine`, `languages` and the pack types.
- `grammaticalPart` gains a required first parameter `rendering: PackRendering` and computes `phonology.onset` through it. French onset: today's regex. Dutch onset: `'vowel'` for an initial vowel letter, else `'consonant'` — **except** that the characterization snapshot does not capture onset and the app never reads Dutch onsets, so `heb` changing from `muteH` to `consonant` is allowed and is asserted in the new test.

Behaviour moved, not changed: imperative slots become `persons` data (fr: 2sg, 1pl, 2pl; nl: 2sg, 2pl); Dutch `pronounMatches` becomes `dutchPack.acceptsTarget`; `matchesAgreement` becomes `frenchPack.acceptsForm`; the usage/orthography rank becomes `rank` in each pack; `canElide` becomes `frenchPack.rendering.sandhi`; the `que` test becomes `bareOmits`. Output order of `expandTargets` must stay number-major (`singular` 1-2-3, then `plural`), which the `persons` order encodes.

- [ ] **Step 1: Write the failing test** `tests/pack.test.ts`

```ts
it('lists registered languages and rejects others by name', () => {
  expect(languages).toEqual(['fr', 'nl']);
  for (const call of [() => conjugate({ language: 'xx', infinitive: 'a' } as never), () => getCatalogue('xx' as never), () => renderParts('xx' as never, [])]) {
    expect(call).toThrow(expect.objectContaining({ code: 'UNSUPPORTED_LANGUAGE', message: 'Language must be one of: fr, nl.' }));
  }
});
it('keeps imperative slots as catalogue data', () => {
  const imperative = (l: 'fr' | 'nl') => getCatalogue(l).find(e => e.mood === 'imperative' && e.tense === 'present')!.persons;
  expect(imperative('fr')).toEqual([[2, 'singular'], [1, 'plural'], [2, 'plural']]);
  expect(imperative('nl')).toEqual([[2, 'singular'], [2, 'plural']]);
});
it('computes onsets per language', () => {
  const part = (l: 'fr' | 'nl', verb: string) => conjugate({ language: l, infinitive: verb, mood: 'indicative', tense: 'present', person: 1, number: 'singular' }).forms[0]!.parts.at(-1)!;
  expect(part('fr', 'habiter').phonology.onset).toBe('muteH');
  expect(part('nl', 'hebben').phonology.onset).toBe('consonant');
});
it('runs a pack that is not in the default registry', () => {
  const engine = createEngine({ fr: packs.fr });
  expect(engine.languages).toEqual(['fr']);
  expect(engine.conjugate({ language: 'fr', infinitive: 'aimer', mood: 'infinitive' }).forms[0]!.text).toBe('aimer');
});
```

- [ ] **Step 2: Run** `npx vitest run tests/pack.test.ts` — expected: FAIL (`languages` is not exported).
- [ ] **Step 3: Implement.** `createEngine` holds the orchestration now in `conjugate.ts` (dedup, grouping, ranking, labels, freeze) with every `language === 'fr'` branch replaced by a pack hook. `conjugate.ts`, `catalogue.ts` and `render.ts` become thin typed wrappers over the default engine so existing imports in tests keep working.
- [ ] **Step 4: Update** `tests/options.test.ts` and `tests/cli.test.ts` where they pin the text `Language must be fr or nl.`.
- [ ] **Step 5: Run** `npm run typecheck && npm test` at the workspace root — expected: PASS; characterization and corpus unchanged.
- [ ] **Step 6: Commit** `refactor(conjugation-engine): language packs behind a generic engine`.

---

### Task 4: Declarative option schemas and a generic builder

**Files:**
- Create: `src/core/options.ts`, `src/languages/fr/options.ts`, `src/languages/nl/options.ts`
- Modify: `src/options.ts`, `src/core/pack.ts` (add `readonly options: OptionSchema`), `src/languages/{fr,nl}/pack.ts`, `docs/api.md` (builder section)
- Test: `tests/options.test.ts`, `tests/options.typecheck.ts`

**Interfaces:**
- Produces (`src/core/options.ts`):

```ts
export type FieldSpec =
  | { readonly kind: 'enum'; readonly values: readonly (string | number | boolean)[] }
  | { readonly kind: 'boolean' }
  | { readonly kind: 'word'; readonly pattern: RegExp; readonly code: ConjugationErrorCode; readonly message: string }
  | { readonly kind: 'agreement'; readonly required: boolean }
  | { readonly kind: 'stems'; readonly words: readonly string[]; readonly enums: Readonly<Record<string, readonly unknown[]>> };
export interface OptionSchema {
  readonly fields: Readonly<Record<string, FieldSpec>>;
  /** Cross-field checks; throws ConjugationError. */
  check?(options: Readonly<Record<string, unknown>>): void;
}
export function parseOptions(packs: Readonly<Record<string, LanguagePack>>, value: unknown): Record<string, unknown>;
```

- `parseConjugationOptions(value: unknown): ConjugationOptions` keeps its signature and delegates to `parseOptions`.
- `class ConjugationOptionsBuilder<L extends Language>` keeps the language-independent methods (`mood`, `tense`, `person`, `number`, `auxiliary`, `classHint`, `stems`, `build`). `conjugationOptions<L>(language, infinitive)` returns `Builder<L> = ConjugationOptionsBuilder<L> & MoodSugar<L> & ContextSugar<L>`: one method per mood of `L` (optional tense argument, clears `tense` when omitted) and one per key of `L`'s `context` (boolean keys default to `true`). The sugar methods are installed in the constructor from the pack's catalogue and schema.

Every existing validation outcome is preserved: same error codes for the same inputs, including `INVALID_HINT` for a French future stem without final `r` (in `frenchOptions.check`) and for a prefix that is both separable and inseparable (in `dutchOptions.check`). String normalisation (NFC, lowercase, apostrophes, spaces) applies to `infinitive`, every `word` field and every word inside `stems`.

- [ ] **Step 1: Add failing tests** to `tests/options.test.ts`

```ts
it('derives accepted option keys from the pack schema', () => {
  expect(() => parseConjugationOptions({ language: 'nl', infinitive: 'werken', aspiratedH: true }))
    .toThrow(expect.objectContaining({ code: 'INVALID_REQUEST', message: 'Unknown nl option: aspiratedH.' }));
});
it('installs builder sugar per language', () => {
  expect(conjugationOptions('nl', 'werken').inversion().build()).toMatchObject({ inversion: true });
  expect('gerund' in conjugationOptions('nl', 'werken')).toBe(false);
  expect(conjugationOptions('fr', 'aimer').gerund().build()).toMatchObject({ mood: 'gerund' });
});
```

and to `tests/options.typecheck.ts` a check that no context key collides with a builder method: `export const noCollision: Extract<keyof LanguageRegistry[Language]['context'], keyof ConjugationOptionsBuilder<Language> | Mood> extends never ? true : false = true;`

- [ ] **Step 2: Run** `npx vitest run tests/options.test.ts` — expected: FAIL on `'gerund' in …`.
- [ ] **Step 3: Implement** the schema validator, the two schemas and the builder.
- [ ] **Step 4: Run** `npm run typecheck && npm test` at the workspace root — expected: PASS; every `@ts-expect-error` in `options.typecheck.ts` still fires.
- [ ] **Step 5: Commit** `refactor(conjugation-engine): declarative option schemas and generic builder`.

---

### Task 5: Language-agnostic CLI

**Files:**
- Modify: `src/cli.ts`, `README.md` (CLI section), `docs/api.md` (CLI section)
- Test: `tests/cli.test.ts`

**Interfaces:**
- Consumes: `packs` and each pack's `options.fields`.
- Flags are derived from the union of all packs' fields: kebab-case of the field name; `boolean` fields accept `--x` and `--no-x`; `agreement` and `stems` fields take JSON. The existing aliases `--class` (`classHint`) and `--orthography` (`preferredOrthography`) remain. `--help` prints one usage line `conjugation-engine <fr|nl> <infinitive> [options]` (language list from `languages`) followed by the common flags and one section per language listing its flags.

- [ ] **Step 1: Add a failing test** to `tests/cli.test.ts`: `--help` output contains the line `Dutch (nl):` followed by `--separable-prefix`, and `conjugation-engine xx aimer` exits 1 with stderr `UNSUPPORTED_LANGUAGE: Language must be one of: fr, nl.`
- [ ] **Step 2: Run** `npm test -- tests/cli.test.ts` — expected: FAIL.
- [ ] **Step 3: Implement**; add `readonly label: string` (English language name) to `LanguagePack` for the section headings.
- [ ] **Step 4: Run** `npm test` — expected: PASS, all prior CLI tests included.
- [ ] **Step 5: Commit** `refactor(conjugation-engine): derive CLI flags from language packs`.

---

### Task 6: Derivation steps, forks and spelling-rule runner

**Files:**
- Create: `src/core/derivation.ts`, `src/core/fork.ts`, `src/core/juncture.ts`
- Modify: `src/types.ts` (`DerivationStep` re-export; optional `steps` on `ConjugationPart` and `GeneratedForm`; optional `steps` on `VerbAnalysis`; optional `step` on `UnavailableTarget`; `region?: string | null` on `FormVariant`)
- Test: `tests/core/derivation.test.ts`

**Interfaces:**
- Produces (`src/core/derivation.ts`):

```ts
export type Stage = 'classify' | 'stem' | 'ending' | 'orthography' | 'periphrasis' | 'clause' | 'availability';
export type StepKind = 'rule' | 'lexical' | 'assumption' | 'unavailable';
export type TermKind = 'mood' | 'tense' | 'person' | 'number' | 'gender' | 'voice' | 'case';
export interface TermRef { readonly term: TermKind; readonly id: string }
export type StepParam = string | number | TermRef;
export type ParamKind = 'text' | 'number' | 'term';
export interface RuleInfo { readonly id: string; readonly stage: Stage; readonly kind: StepKind; readonly params: Readonly<Record<string, ParamKind>> }
export interface DerivationStep { readonly rule: string; readonly stage: Stage; readonly kind: StepKind; readonly before: string | null; readonly after: string | null; readonly params: Readonly<Record<string, StepParam>> }
/** Declares a pack's rules; ids are the object keys. `kind` defaults to 'rule', `params` to {}. */
export function defineRules<const T extends Record<string, { stage: Stage; kind?: StepKind; params?: Record<string, ParamKind> }>>(defs: T): { readonly [K in keyof T & string]: RuleInfo & { readonly id: K } };
/** Builds a step; throws GENERATION_FAILURE when params do not match the rule's declared params (missing, extra, or wrong kind). */
export function step(rule: RuleInfo, before: string | null, after: string | null, params?: Readonly<Record<string, StepParam>>): DerivationStep;
```

- Produces (`src/core/fork.ts`):

```ts
export interface VariantTags { readonly orthography?: 'rectified' | 'traditional'; readonly pattern?: string; readonly usage?: FormVariant['usage']; readonly region?: string; readonly condition?: string }
export interface Outcome<T> { readonly value: T; readonly steps: readonly DerivationStep[]; readonly tags: VariantTags }
export type Fork<T> = readonly Outcome<T>[];                 // [] = no form
export function one<T>(value: T, steps?: readonly DerivationStep[], tags?: VariantTags): Fork<T>;
export function mergeTags(a: VariantTags, b: VariantTags): VariantTags | null;   // null when one key holds two different values
export function chain<A, B>(fork: Fork<A>, next: (value: A) => Fork<B>): Fork<B>; // steps concatenated, tags merged, conflicting branches dropped
export function combine<T extends readonly unknown[]>(forks: { [K in keyof T]: Fork<T[K]> }): Fork<T>;
```

- Produces (`src/core/juncture.ts`):

```ts
export interface Juncture { readonly stem: string; readonly ending: string }
export interface JunctureRule<C> {
  readonly info: RuleInfo;
  /** null = rule does not apply. More than one outcome = spelling variants (tagged). */
  apply(juncture: Juncture, context: C): Fork<Juncture> | null;
  /** Step params; defaults to {}. */
  describe?(before: Juncture, after: Juncture, context: C): Readonly<Record<string, StepParam>>;
}
/** Applies rules in order to every live branch; records one step per rule that changed stem + ending. */
export function applyJunctureRules<C>(rules: readonly JunctureRule<C>[], start: Juncture, context: C): Fork<Juncture>;
```

- [ ] **Step 1: Write failing tests** `tests/core/derivation.test.ts`

```ts
const rules = defineRules({
  'xx.orth.c-cedilla': { stage: 'orthography', params: { vowel: 'text' } },
  'xx.orth.variant': { stage: 'orthography' },
});
it('records one step per rule that changed the spelling', () => {
  const cedilla: JunctureRule<null> = { info: rules['xx.orth.c-cedilla'],
    apply: j => /c$/.test(j.stem) && /^[ao]/.test(j.ending) ? one({ stem: j.stem.slice(0, -1) + 'ç', ending: j.ending }) : null,
    describe: (_, after) => ({ vowel: after.ending[0]! }) };
  expect(applyJunctureRules([cedilla], { stem: 'plac', ending: 'ons' }, null)).toEqual([{
    value: { stem: 'plaç', ending: 'ons' }, tags: {},
    steps: [{ rule: 'xx.orth.c-cedilla', stage: 'orthography', kind: 'rule', before: 'placons', after: 'plaçons', params: { vowel: 'o' } }],
  }]);
  expect(applyJunctureRules([cedilla], { stem: 'plac', ending: 'ez' }, null)[0]!.steps).toEqual([]);
});
it('drops conflicting branches', () => {
  const a = [...one('x', [], { orthography: 'traditional' }), ...one('y', [], { orthography: 'rectified' })];
  expect(chain(a, v => one(v + '!', [], { orthography: 'rectified' })).map(o => o.value)).toEqual(['y!']);
  expect(mergeTags({ pattern: 'a' }, { pattern: 'b' })).toBeNull();
});
it('rejects a step whose params do not match the rule', () => {
  expect(() => step(rules['xx.orth.c-cedilla'], 'a', 'b', {})).toThrow(expect.objectContaining({ code: 'GENERATION_FAILURE' }));
  expect(() => step(rules['xx.orth.c-cedilla'], 'a', 'b', { vowel: 3 })).toThrow(expect.objectContaining({ code: 'GENERATION_FAILURE' }));
});
```

- [ ] **Step 2: Run** `npx vitest run tests/core/derivation.test.ts` — expected: FAIL, modules not found.
- [ ] **Step 3: Implement** the three modules and the optional type fields.
- [ ] **Step 4: Run** `npm run typecheck && npm test` — expected: PASS.
- [ ] **Step 5: Commit** `feat(conjugation-engine): derivation steps, forks and spelling-rule runner`.

---

### Task 7: Staged engine, compound-tense executor and toy pack

**Files:**
- Create: `src/core/staged.ts`, `src/core/periphrasis.ts`, `src/core/clause.ts`
- Create: `tests/toy/pack.ts`, `tests/core/staged.test.ts`
- Modify: `src/types.ts` (`Voice = 'active' | 'passive'`; optional `voice?: Voice | null` on `ResolvedTarget`; `Gender` gains `'neuter'`; `Agreement` gains optional `case?: Case` with `Case = 'nominative' | 'genitive' | 'dative' | 'accusative' | 'ablative'`), `src/core/pack.ts` (optional `voices?` on `CatalogueEntry`), `src/core/engine.ts` (target expansion over `voices`; dedup signature excludes `steps`)

**Interfaces:**
- Consumes: Task 6.
- Produces (`src/core/staged.ts`):

```ts
export interface LexemeBase {
  readonly lemma: string; readonly verbId: string;
  readonly classId: string; readonly classSource: VerbAnalysis['classificationSource'];
  readonly reflexive: boolean; readonly auxiliaries: readonly string[];
  readonly particle: { readonly text: string; readonly separable: boolean } | null;
}
export type Cell =
  | { readonly kind: 'finite'; readonly mood: string; readonly tense: string; readonly person: Person; readonly number: GrammaticalNumber; readonly voice?: Voice }
  | { readonly kind: 'nonFinite'; readonly form: string; readonly agreement?: Agreement; readonly voice?: Voice };
export interface Unavailability { readonly reason: UnavailableTarget['reason']; readonly step: DerivationStep; readonly source: string }
export interface StagedGrammar<X extends LexemeBase = LexemeBase> {
  /** Steps include classification and every assumption made. Throws ConjugationError for unusable input. */
  classify(query: Readonly<Record<string, unknown>>): Outcome<X>;
  /** Lexeme for an auxiliary or other verb named by a periphrasis. */
  lexemeOf(lemma: string): X;
  /** Which simple cell a simple catalogue target maps to, or null when the target is periphrastic. */
  cellOf(target: ResolvedTarget): Cell | null;
  availability(lexeme: X, target: ResolvedTarget): Unavailability | null;
  /** Whole-word lexical override (suppletive cells); null = derive by stages. */
  cell?(lexeme: X, cell: Cell): Fork<string> | null;
  stem(lexeme: X, cell: Cell): Fork<string>;
  ending(lexeme: X, cell: Cell, stem: string): Fork<string>;
  readonly orthography: readonly JunctureRule<{ readonly lexeme: X; readonly cell: Cell }>[];
  readonly periphrases: readonly Periphrasis[];
  readonly clause: ClauseGrammar<X>;
}
export function synthesize<X extends LexemeBase>(grammar: StagedGrammar<X>, lexeme: X, cell: Cell): Fork<string>;  // memoised per (lexeme, cell)
export function stagedEngine<X extends LexemeBase>(grammar: StagedGrammar<X>, rendering: PackRendering, query: Readonly<Record<string, unknown>>): LanguageEngine;
```

- Produces (`src/core/periphrasis.ts`):

```ts
export type VerbRef = 'main' | 'perfectAuxiliary' | { readonly lemma: string };
export type ChainElement =
  | { readonly verb: VerbRef; readonly finite: { readonly mood: string; readonly tense: string } }   // person/number from the target
  | { readonly verb: VerbRef; readonly nonFinite: string; readonly agree?: true }
  | { readonly word: string; readonly role: 'linker' | 'particle' | 'moodMarker' };
export interface Periphrasis {
  readonly mood: string; readonly tense: string; readonly voice?: Voice;
  readonly rule: RuleInfo;                 // stage 'periphrasis'
  readonly chain: readonly ChainElement[];
  readonly pattern?: string; readonly usage?: FormVariant['usage'];   // several entries for one target = named variants
}
```

- Produces (`src/core/clause.ts`):

```ts
export interface ChainWord { readonly role: 'auxiliary' | 'lexicalVerb' | 'linker' | 'particle' | 'moodMarker'; readonly text: string; readonly lemma: string | null; readonly cell: Cell | null; readonly steps: readonly DerivationStep[] }
export interface ClauseContext<X extends LexemeBase> { readonly query: Readonly<Record<string, unknown>>; readonly lexeme: X; readonly target: ResolvedTarget; readonly auxiliary: string | null }
export interface ClauseGrammar<X extends LexemeBase> {
  /** Agreement contexts to generate for elements marked `agree`; [null-valued outcome] when nothing agrees. */
  agreements(context: ClauseContext<X>): Fork<Agreement | null>;
  /** Orders the verb chain and adds subject, clitics, particles. Steps are clause-level steps. */
  assemble(words: readonly ChainWord[], context: ClauseContext<X>): Fork<readonly ConjugationPart[]>;
}
```

Executor rules: a simple target is `[{ verb: 'main', … }]` built from `cellOf`; a periphrastic target runs every matching `Periphrasis` once per entry of `lexeme.auxiliaries` when its chain contains `perfectAuxiliary` (the form's `variant.auxiliary` is that lemma), otherwise once. Each verb element is synthesised through the same grammar, so its steps are attached to its part. A chain element must reference a simple cell (`cellOf`-style): periphrases never nest. Each produced form carries `steps` = one `periphrasis` step (when periphrastic) + agreement and clause steps; each part carries its word-level `steps`; `analysis.steps` = the classification steps, and `analysis.assumptions` stays a `string[]` filled later by the i18n layer (Task 9) — until then it holds the rule ids of the `assumption` steps. `ruleIds` = distinct rule ids of all steps of the form and its parts.

Toy pack (`tests/toy/pack.ts`, language id `xx`, never exported from `src/`): infinitives end in `-a`; present endings `-o -as -at -amos -etes -ant`; perfect = `haba` (present) + participle `-ado`, agreeing in gender (`-ada`) when the auxiliary is `esta`; passive voice present = stem + `ur` + ending; one spelling rule `xx.orth.c-qu` (stem-final `c` → `qu` before `e`, so `placa` 2pl is `plaquetes`); a separable particle `ap` (`apzorpa` → `zorpo ap`, participle `apzorpado`), one suppletive verb `esa` with whole-cell present forms, and one verb with two auxiliaries. It exists to exercise every hook, not to model a language.

- [ ] **Step 1: Write failing tests** `tests/core/staged.test.ts` using `createEngine({ xx: toyPack })`:

```ts
it('derives a simple form through stem, ending and spelling with one step each', () => {
  const form = only({ language: 'xx', infinitive: 'placa', mood: 'indicative', tense: 'present', person: 1, number: 'plural' });
  expect(form.text).toBe('nos placamos');
  expect(form.parts.at(-1)!.steps!.map(s => s.rule)).toEqual(['xx.stem.drop-a', 'xx.end.present']);
  const second = only({ language: 'xx', infinitive: 'placa', mood: 'indicative', tense: 'present', person: 2, number: 'plural' });
  expect(second.parts.at(-1)!.text).toBe('plaquetes');
  expect(second.parts.at(-1)!.steps!.map(s => s.rule)).toEqual(['xx.stem.drop-a', 'xx.end.present', 'xx.orth.c-qu']);
});
it('conjugates the auxiliary through the same grammar', () => {
  const form = only({ language: 'xx', infinitive: 'zorpa', mood: 'indicative', tense: 'perfect', person: 3, number: 'singular' });
  expect(form.text).toBe('il habat zorpado');
  expect(form.steps!.map(s => s.rule)).toContain('xx.periphrasis.perfect');
  expect(form.parts.find(p => p.role === 'auxiliary')!.steps!.length).toBeGreaterThan(0);
});
it('forks over auxiliaries and agreement', () => { /* two-auxiliary verb: variant.auxiliary in {haba, esta}; esta forms exist in 2 genders */ });
it('places a separable particle and keeps it attached in non-finite forms', () => { /* zorpo ap / apzorpado */ });
it('supports a voice dimension', () => { /* target.voice === 'passive' → 'placur…' ; default query returns both voices */ });
it('uses whole-cell lexical forms with a lexical step', () => { /* esa → 'so', step kind 'lexical' */ });
it('reports unavailable targets with a step', () => { /* defective toy verb: unavailableTargets[0].step.kind === 'unavailable' */ });
it('deduplicates forms that differ only in steps', () => { /* two rule paths to one spelling → one form */ });
it('rejects a periphrasis that references a periphrastic cell', () => { /* GENERATION_FAILURE */ });
```

- [ ] **Step 2: Run** `npx vitest run tests/core/staged.test.ts` — expected: FAIL, modules not found.
- [ ] **Step 3: Implement** `staged.ts`, `periphrasis.ts`, `clause.ts`, the type additions and the toy pack.
- [ ] **Step 4: Run** `npm run typecheck && npm test` at the workspace root — expected: PASS; characterization unchanged (French and Dutch do not use the staged path yet).
- [ ] **Step 5: Commit** `feat(conjugation-engine): staged engine and compound-tense executor`.

---

### Task 8: ICU-subset message formatter

**Files:**
- Create: `src/i18n/format.ts`
- Test: `tests/i18n/format.test.ts`

**Interfaces:**
- Produces:

```ts
export type MessageArg = string | number;
/** Placeholder names with the kind the message requires. Throws SyntaxError with the offset on anything outside the subset. */
export function placeholders(source: string): ReadonlyMap<string, 'any' | 'number' | 'select'>;
export function formatMessage(source: string, args: Readonly<Record<string, MessageArg>>, locale: string): string;
```

Subset: literal text; `{name}`; `{name, plural, =N {…} one {…} other {…}}` with `#` (categories from `Intl.PluralRules(locale)`, `other` required); `{name, select, key {…} other {…}}` (`other` required); nesting; ICU apostrophe escaping (`''` → `'`, `'{…}'` literal). Anything else (`number`, `date`, `selectordinal`, offsets) is a `SyntaxError`. A missing argument at format time throws `RangeError` naming the placeholder.

- [ ] **Step 1: Write failing tests**

```ts
it.each([
  ['Drop {ending} → {stem}-', { ending: '-er', stem: 'plac' }, 'en', 'Drop -er → plac-'],
  ['{n, plural, one {# letter} other {# letters}}', { n: 1 }, 'en', '1 letter'],
  ['{n, plural, one {# letter} other {# letters}}', { n: 2 }, 'nl', '2 letters'],
  ['{aux, select, être {agrees} other {invariable}}', { aux: 'être' }, 'en', 'agrees'],
  ["It''s '{literal}' {x}", { x: 'ok' }, 'en', "It's {literal} ok"],
  ['{g, select, f {{n, plural, one {une} other {des}}} other {x}}', { g: 'f', n: 2 }, 'en', 'des'],
])('formats %s', (source, args, locale, expected) => expect(formatMessage(source, args, locale)).toBe(expected));
it.each(['{a', '{a, number}', '{a, plural, one {x}}', '{a, select, x {y}}', 'x } y'])('rejects %s', source =>
  expect(() => placeholders(source)).toThrow(SyntaxError));
it('reports placeholder kinds', () =>
  expect([...placeholders('{a} {n, plural, other {#}} {s, select, other {{b}}}')]).toEqual([['a', 'any'], ['n', 'number'], ['s', 'select'], ['b', 'any']]));
it('names a missing argument', () => expect(() => formatMessage('{a}', {}, 'en')).toThrow(/\ba\b/));
```

- [ ] **Step 2: Run** `npx vitest run tests/i18n/format.test.ts` — expected: FAIL.
- [ ] **Step 3: Implement** a single-pass recursive-descent parser with a parse cache keyed by source.
- [ ] **Step 4: Run** `npm test` — expected: PASS; `tests/package.test.ts` still finds no Node import under `src/`.
- [ ] **Step 5: Commit** `feat(conjugation-engine): ICU-subset message formatter`.

---

### Task 9: Catalogs, citations and `explain`

**Files:**
- Create: `src/core/sources.ts`, `src/i18n/catalog.ts`, `src/i18n/explain.ts`, `src/i18n/locales/en/core.ts`, `src/i18n/locales/nl/core.ts`, `src/i18n/locales/{en,nl}/index.ts`
- Create: `tests/toy/messages.ts`, `tests/i18n/explain.test.ts`, `tests/i18n/completeness.test.ts`
- Modify: `src/core/pack.ts`, `src/core/engine.ts`, `src/index.ts`, `src/cli.ts` (`--explain`, `--locale <en|nl>`), `tests/toy/pack.ts`, `docs/api.md`

**Interfaces:**
- Produces (`src/core/sources.ts`): `interface Work { readonly id: string; readonly title: string; readonly author?: string; readonly year?: number; readonly url?: \`https://${string}\` }`, `interface Citation { readonly work: string; readonly locator: string; readonly url?: \`https://${string}\` }`.
- `LanguagePack` gains optional `readonly rules?: Readonly<Record<string, RuleInfo>>`, `readonly works?: Readonly<Record<string, Work>>`, `readonly citations?: Readonly<Record<string, Citation | readonly Citation[]>>`. (Optional because French and Dutch have none until plans 2 and 3.)
- Produces (`src/i18n/catalog.ts`): `type Locale = 'en' | 'nl'`, `type Catalog = Readonly<Record<string, string>>`, `type Catalogs = Readonly<Record<Locale, Catalog>>`. Key namespaces: a rule id is its own key; `term.person.<1|2|3>`, `term.number.<singular|plural>`, `term.gender.<…>`, `term.voice.<…>`, `term.case.<…>` live in `core.ts`; `explain.summary` and `explain.section.<stage>` too. `TermRef`s of kind `mood` / `tense` resolve to the catalogue's native label, not to a catalog key.
- `createEngine(packs, catalogs?)` — the engine exposes `explain`; the default engine in `src/index.ts` is built with `{ en, nl }` from `src/i18n/locales`.
- Produces (`src/i18n/explain.ts`):

```ts
export interface ExplainedStep { readonly text: string; readonly rule: string; readonly stage: Stage; readonly kind: StepKind; readonly before: string | null; readonly after: string | null; readonly citations: readonly (Citation & { readonly title: string })[] }
export interface Explanation { readonly summary: string; readonly sections: readonly { readonly part: number | null; readonly title: string; readonly steps: readonly ExplainedStep[] }[] }
// Engine method and typed root export:
explain(language: Language, subject: ConjugatedForm | UnavailableTarget | VerbAnalysis, locale: Locale): Explanation
```

Sections: one per part that has steps (`part` = its index, `title` = the part text), then one with `part: null` for form-level steps. A form without steps (French and Dutch until their plans) yields `sections: []`. `analysis.assumptions` is now the `en` rendering of the `assumption` steps for staged packs.

Each staged pack's message files use `satisfies Record<keyof typeof rules, string>` so a missing key fails `tsc`. The toy pack's `tests/toy/messages.ts` provides `en` and `nl`.

- [ ] **Step 1: Write failing tests**

`tests/i18n/explain.test.ts`:

```ts
it('explains a derived form step by step in English and Dutch', () => {
  const form = only({ language: 'xx', infinitive: 'placa', mood: 'indicative', tense: 'present', person: 1, number: 'plural' });
  const verb = (locale: 'en' | 'nl') => toy.explain('xx', form, locale).sections.find(s => s.title === 'placamos')!;
  expect(verb('en').steps.map(s => s.text)).toEqual(['Drop -a from placa: plac-.', 'Present, 1st person plural: add -amos.']);
  expect(verb('en').steps[0]!.citations).toEqual([{ work: 'toy', locator: '§1', title: 'Toy Grammar' }]);
  expect(verb('nl').steps[0]!.text).toBe('Laat -a weg van placa: plac-.');
});
it('explains unavailability and assumptions', () => { /* explain(unavailableTarget) and explain(analysis) each yield one section */ });
it('fails loudly on a rule without text', () => {
  const broken = createEngine({ xx: toyPack }, { en: {}, nl: {} });
  expect(() => broken.explain('xx', form, 'en')).toThrow(expect.objectContaining({ code: 'GENERATION_FAILURE', message: expect.stringContaining('xx.stem.drop-a') }));
});
it('returns no sections for a pack that records no steps yet', () => {
  expect(explain('fr', conjugate({ language: 'fr', infinitive: 'aimer', mood: 'infinitive' }).forms[0]!, 'en').sections).toEqual([]);
});
```

`tests/i18n/completeness.test.ts` (runs over every registered pack plus the toy pack; this file is the gate later plans extend by registering their pack):

```ts
// for each pack with rules, for each locale:
//   every rule id has a message; the message parses; its placeholders ⊆ the rule's declared params ∪ {before, after};
//   a 'number' placeholder is declared 'number'; every rule id has a citation; every citation.work exists in pack.works
// en and nl catalogs have identical key sets
```

- [ ] **Step 2: Run** `npx vitest run tests/i18n` — expected: FAIL.
- [ ] **Step 3: Implement.** `before` and `after` are always available to a message as placeholders. Add `--explain` (prints each step's text indented under its form) and `--locale` to the CLI with a test in `tests/cli.test.ts` that `fr aimer --mood infinitive --explain` prints the form and no step lines.
- [ ] **Step 4: Run** `npm run typecheck && npm test` at the workspace root — expected: PASS.
- [ ] **Step 5: Commit** `feat(conjugation-engine): explanations from localized rule catalogs`.

---

### Task 10: Corpus tooling per language

**Files:**
- Create: `scripts/corpus/model.ts`, `scripts/corpus/parsers/{fr,nl}.ts`, `scripts/corpus/languages/{fr,nl}.ts`, `scripts/corpus/languages/index.ts`, `scripts/corpus/corrections/{fr,nl}.ts`, `scripts/corpus/import.ts`, `scripts/corpus/report.ts`
- Delete: `scripts/corpus.ts`, `scripts/corrections.ts`, `scripts/import-corpus.ts`, `scripts/report-corpus.ts`
- Modify: `package.json` (script paths), `.github/workflows/ci.yml` (report path), `tests/corpus.test.ts`, `tests/corpus-parser.test.ts`, `docs/grammar.md` (refresh instructions; drop the stale claim that the manifest holds byte checksums and encodings)

**Interfaces:**
- Produces (`scripts/corpus/languages/<lang>.ts`):

```ts
export interface CorpusLanguage {
  readonly language: Language;
  readonly directory: string;                 // under corpusBasePath in the pinned checkout
  readonly encoding: string;                  // TextDecoder label, decoded with fatal: true
  readonly expectedFiles: number;
  readonly cellsPerFile: number;
  parse(html: string, name: string): ParsedCorpus;
  /** Neutral fixture identity from a source file name. */
  context(name: string): Pick<CorpusFile, 'infinitive' | 'gender' | 'auxiliary' | 'pattern'>;
  correction(file: CorpusFile, cell: CorpusCell, index: number): CorpusCorrection | null;
  /** Engine query for a fixture file, and which generated forms answer a cell (moves the pleuvoir / `het` special cases out of the test). */
  query(file: CorpusFile): readonly Record<string, unknown>[];
  applicable(file: CorpusFile, cell: CorpusCell, forms: readonly ConjugatedForm[]): readonly ConjugatedForm[];
}
```

- `scripts/corpus/languages/index.ts`: `export const corpusLanguages: readonly CorpusLanguage[]`.
- `import.ts` accepts `--source <checkout>` (required), `--output` and `--only <language>`; the revision and clean-checkout checks are unchanged and cover the whole `SourceFiles` directory.
- Fixture files, the manifest shape and `corrections.json` are unchanged.

- [ ] **Step 1: Rewrite `tests/corpus.test.ts`** to iterate `corpusLanguages` (file counts, cell counts and placeholder totals come from a pinned table in the test keyed by language: `fr: { files: 222, infinitives: 84, cells: 26_196, placeholders: 0 }`, `nl: { files: 207, infinitives: 207, cells: 10_764, placeholders: 1_030 }`) and to call `language.query` / `language.applicable` instead of the inline special cases. Point `tests/corpus-parser.test.ts` at the new parser modules.
- [ ] **Step 2: Run** `npx vitest run tests/corpus.test.ts` — expected: FAIL, `scripts/corpus/languages/index.ts` not found.
- [ ] **Step 3: Move the code** into the new modules without changing behaviour.
- [ ] **Step 4: Verify the fixtures are reproduced byte for byte:**

Run: `npm run corpus:import -- --source /Users/wouter/Downloads/VerbodromeX && git diff --exit-code -- tests/fixtures`
Expected: exit 0, no diff. Then `npm run corpus:import -- --source /Users/wouter/Downloads/VerbodromeX --only nl && git diff --exit-code -- tests/fixtures` — expected: exit 0.

- [ ] **Step 5: Run** `npm run typecheck && npm test && npm run corpus:check` — expected: PASS, with the report printing the same two lines as before.
- [ ] **Step 6: Commit** `refactor(conjugation-engine): corpus tooling per language`.
