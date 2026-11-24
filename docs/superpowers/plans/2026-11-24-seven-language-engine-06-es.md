# Seven-Language Engine — Plan 6: Spanish (es)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add Spanish as a rule-first `StagedGrammar` pack that conjugates any regular, irregular or invented verb, computes every written accent from stress and syllables, explains each form in English and Dutch with citations, and passes all 11,036 cells of the Spanish oracle through a sourced corrections ledger.

**Architecture:** A new pack under `src/languages/es/` mirroring Dutch's Part B layout (`spec`, `catalogue` with subject slots, `options`, `rendering`, `lexicon`, `stems`, `paradigms`, `orthography`, `periphrasis`, `clause`, `rules`, `sources`, `grammar`, `pack`) plus two Spanish-only modules: `classify.ts` (lexicon lookup, prefix inheritance, assumptions) and `syllables.ts` (stress, orthographic syllables, tilde). Accents are never stored: endings carry a stress position, and the last orthography rules write the tilde. Compound tenses and the negative imperative are periphrasis chains; reflexive pronouns, `que`, the subject pronoun and enclitic re-accentuation belong to the clause.

**Tech Stack:** TypeScript 7 strict, Node 26, Vitest 5, npm workspaces, cheerio (dev only, corpus parser). No new dependencies.

**Spec:** `docs/superpowers/specs/2026-11-24-seven-language-engine-design.md` (section "Spanish (es)"), and the grammar design `docs/superpowers/research/2026-11-24-es-grammar-design.md` — cited below as **GD §n**. The GD holds every rule table, ending set, lexicon list and oracle error; this plan points at it instead of repeating it.

**Builds on:** Plan 2 Part A. Landed (commits `6dcad74`…`f5cb5d7`): `LanguagePack.subjects` / `subjectsFor` / `genderedTargets`, `CatalogueEntry.slots`, `LanguageSpec<Tenses>` with a `subject` slot-id union, schemas typed `OptionSchema<OptionFieldsFor<L>>`, `StagedGrammar.classify(query): Fork<X>` with `analysis.alternatives`, `cellOf(target, lexeme)`, `Periphrasis<X>` with `applies` and `reports`, `ClauseContext.subject` and `.agreeing`, `wordPart(rendering, word, features?, options?)`, part features `voice` / `case` / `aspect`; `LexemeBase` lives in `src/core/grammar.ts`. Still to come and assumed here: the `./core` authoring surface (Task 5) and the labelled corpus model with remaps and `scope: 'unmodelled'` (Task 6); if a task starts before they land, import from `src/core/*` and follow whatever names Task 6 fixed. Read `packages/conjugation-engine/docs/pack-authoring.md` (the pack-authoring guide), `src/core/staged.ts`, `clause.ts`, `periphrasis.ts`, `pack.ts`, `fork.ts`, `juncture.ts`, `tests/toy/pack.ts` and the Dutch pack (`src/languages/nl/`) before starting.

## Global Constraints

- All paths are relative to `packages/conjugation-engine/` unless they start with `apps/` or `docs/`.
- Branch `feat/seven-language-engine` (or the worktree branch assigned for parallel packs); one commit per task; every commit keeps `npm run typecheck && npm test` green at the workspace root and `npm run corpus:check` passing.
- The pack touches only its own paths: `src/languages/es/`, `src/i18n/locales/{en,nl}/es.ts`, `scripts/corpus/{parsers,languages,corrections}/es.ts`, `tests/es/`, `tests/fixtures/es.json`, `docs/grammar/es.md`, `src/equivalence/es.ts` (only if `src/equivalence/` exists). Shared files get exactly these one-line registrations (an import line counts with its entry):
  - `src/languages/registry.ts`: `es: SpanishSpec;`
  - `src/languages/index.ts`: `es: spanishPack` in `packs`
  - `src/types.ts`: `export type { SpanishClassHint, SpanishSpec, SpanishStemHints, SpanishSubject, SpanishTenses } from './languages/es/spec.js';`
  - `src/i18n/locales/en/index.ts` and `src/i18n/locales/nl/index.ts`: spread the `es` messages
  - `scripts/corpus/languages/index.ts`: `spanish` in `corpusLanguages`
  - `tests/corpus.test.ts`: `es: { files: 89, infinitives: 89, cells: 11_036, placeholders: 356 },`
  - `tests/i18n/runtime.test.ts`: `'es'` in its language list
  - `README.md` (package): Spanish in the language list
  - `src/equivalence/index.ts`: the `es` map, only if that module exists
  - regenerated, not hand-edited: `tests/fixtures/manifest.json`, `tests/fixtures/corrections.json` (re-run `corpus:import` after merging another pack), and `tests/equivalence/matrix.tsv` if the equivalence module exists.
- French and Dutch output must not change: `tests/characterization.test.ts` and the fr/nl halves of `tests/corpus.test.ts` stay green with no new ledger entry.
- Zero runtime dependencies; nothing under `src/` imports `node:*` (except `src/cli.ts`), `scripts/` or `tests/`.
- Every rule has an English and a Dutch message and a citation; `tests/i18n/completeness.test.ts` passes for `es`. Rule ids are `es.<stage>.<name>` in kebab case, exactly as in GD §4. Messages are one sentence for a secondary-school learner, naming forms through `{before}` / `{after}` and the declared params; GD §4.10 lists the Dutch terms to use. A rule never cites the oracle's site or any conjugator.
- Lexicon entries are verified against the DLE conjugation table (`https://dle.rae.es/<lemma>`) or the DPD entry (`https://www.rae.es/dpd/<lemma>`) by opening them in the browser (Chrome tools); nothing is copied from the oracle. A rule whose only source the implementer could open is secondary (Fundéu, university pages) is listed in `secondaryOnly` in `sources.ts` (Task 2), as the approved design requires.
- Written accents are computed, never stored in stems or endings (whole-word lexical forms such as `éramos` are the only stored tildes).
- Commit messages end with `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`.

## Review Focus

1. **Input without diacritics.** `reir`, `oir`, `sonreir`, `REIR` must classify as `reír` / `oír` / `sonreír` (step `es.classify.restore-accent`) and output only accented forms (`río`, `reímos`). → Task 2 test `restores the tilde of -eír/-oír`.
2. **An invented verb that looks like an irregular one.** `pretender` stays regular (`pretendo`), `protener` inherits tener (`protengo`, `protén`), `blotener` does not (`blotenemos`), `bladucir` gives `bladuje`, `blorecer` gives `blorezco` with assumption `es.classify.assume-zc`. → Task 2 and Task 7 tests.
3. **A reflexive imperative.** `levántate`, `levantaos`, `levantémonos`, `no te levantes`; `irse` → `vete`, `idos`, `vámonos`; `reírse` → `reíos`; `vestirse` → `vestíos`, `vistámonos`. → Task 4 test `places and re-accents reflexive pronouns`.
4. **A form with two accepted spellings or variants.** `amara` / `amase` both returned, `ra` first, each tagged; `yazco` / `yazgo` / `yago`; `frito` / `freído`; and only the 2010 spelling `guio` (never `guió`). Every form beyond the first in a cell carries `variant.pattern`. → Task 3 test and Task 6 guard.
5. **A formal subject in the imperative.** An unfiltered query returns the usted and ustedes commands (`ame`, `amen`, `subject` `2sg.formal` / `2pl.formal`); `subject: '2sg.formal'` gives `usted ama`; `subject: '3sg', mood: 'imperative'` is `INVALID_TARGET`. → Task 1 test.

---

### Task 1: Pack skeleton, catalogue and subject slots

**Files:**
- Create: `src/languages/es/{spec,catalogue,options,rendering,rules,sources,grammar,pack}.ts`, `src/i18n/locales/en/es.ts`, `src/i18n/locales/nl/es.ts`, `tests/es/pack.test.ts`
- Modify (one line each, see Global Constraints): `src/languages/registry.ts`, `src/languages/index.ts`, `src/types.ts`, `src/i18n/locales/en/index.ts`, `src/i18n/locales/nl/index.ts`

**Interfaces:**
- Produces (`spec.ts`): `SpanishTenses` exactly as GD §2.1; `SpanishClassHint = 'regular' | 'e-ie' | 'o-ue' | 'u-ue' | 'i-ie' | 'e-i'`; `SpanishStemHints { readonly stress?: 'hiatus' | 'diphthong'; readonly zc?: boolean }`; `SpanishSubject` = the 12 slot ids of GD §2.2; `SpanishSpec extends LanguageSpec<SpanishTenses> { tenses: SpanishTenses; nonFinite: 'infinitive' | 'gerund' | 'participle'; auxiliary: 'haber'; classHint: SpanishClassHint; stems: SpanishStemHints; subject: SpanishSubject; context: { readonly reflexive?: boolean; readonly gender?: 'masculine' | 'feminine' } }`.
- `catalogue.ts`: `spanishCatalogue: readonly CatalogueEntry[]` (23 entries, GD §2.1 order and labels; both imperative entries with persons `[[2,'singular'],[3,'singular'],[1,'plural'],[2,'plural'],[3,'plural']]` and `slots: ['2sg', '2sg.formal', '1pl', '1pl.f', '2pl', '2pl.f', '2pl.formal']`, as the toy does for its imperative) and `spanishSubjects: readonly SubjectSlot[]` (12 slots, GD §2.2 order).
- `options.ts`: `spanishOptions: OptionSchema<OptionFieldsFor<'es'>>` (GD §2.3, fields in that order; the type rejects a missing or extra field).
- `rendering.ts`: `spanishRendering: PackRendering` (onset vowel/consonant, `sandhi` → null, `bareOmits` → `part.role === 'moodMarker' && part.text === 'que'`).
- `rules.ts`: `spanishRules = defineRules({})` (filled from Task 2 on); `type SpanishRuleId = keyof typeof spanishRules`.
- `sources.ts`: `spanishWorks` (GD §1 works, ids `ngle`, `orto`, `dle`, `dpd`, plus the secondary works), `spanishCitations satisfies Record<SpanishRuleId, Citation | readonly Citation[]>`, `secondaryOnly: ReadonlySet<SpanishRuleId>`.
- `grammar.ts`: `spanishGrammar: StagedGrammar<SpanishLexeme>` whose not-yet-built hooks throw `ConjugationError('GENERATION_FAILURE', 'Spanish <hook> is not built yet.')`; `SpanishLexeme` is declared in Task 2 (`LexemeBase` until then).
- `pack.ts`: `spanishPack: LanguagePack<'es'>` with `label: 'Spanish'`, `subjects: spanishSubjects`, `subjectsFor` (adds the two formal slots to an unfiltered query) and `acceptsTarget` (drops formal slots outside the imperative unless `subject` is given) exactly as GD §2.2, `rank: form => variantRank(form.variant, 'rectified')`, `engine: query => stagedEngine(spanishGrammar, spanishRendering, query)`, `rules`, `works`, `citations`.

- [ ] **Step 1: Write the failing test** `tests/es/pack.test.ts`

```ts
import { createEngine } from '../../src/core/engine.js';
import { packs } from '../../src/languages/index.js';
const engine = createEngine(packs);
const targets = (options: Record<string, unknown>) => engine.expandTargets({ language: 'es', infinitive: 'amar', ...options });

it('lists the Spanish catalogue and subjects', () => {
  expect(getCatalogue('es').map(e => `${e.mood}.${e.tense}`)).toEqual([
    'indicative.present', 'indicative.perfect', 'indicative.imperfect', 'indicative.pluperfect', 'indicative.simple_past',
    'indicative.past_anterior', 'indicative.future', 'indicative.future_perfect', 'conditional.present', 'conditional.past',
    'subjunctive.present', 'subjunctive.past', 'subjunctive.imperfect', 'subjunctive.pluperfect', 'subjunctive.future',
    'subjunctive.future_perfect', 'imperative.present', 'imperative.negative', 'infinitive.present', 'infinitive.past',
    'gerund.present', 'gerund.past', 'participle.past',
  ]);
  expect(getSubjects('es').map(s => s.id)).toEqual(['1sg', '2sg', '3sg', '3sg.f', '2sg.formal', '1pl', '1pl.f', '2pl', '2pl.f', '3pl', '3pl.f', '2pl.formal']);
});
it('expands an unfiltered query to 111 targets with formal imperatives', () => {
  const all = targets({});
  expect(all).toHaveLength(111);
  expect(all.filter(t => t.mood === 'indicative' && t.tense === 'present').map(t => t.subject)).toEqual(['1sg', '2sg', '3sg', '1pl', '2pl', '3pl']);
  expect(all.filter(t => t.mood === 'imperative' && t.tense === 'present').map(t => t.subject)).toEqual(['2sg', '2sg.formal', '1pl', '2pl', '2pl.formal']);
  expect(all.every(t => t.gender === null)).toBe(true);
});
it('selects formal and feminine slots on request', () => {
  expect(targets({ subject: '2sg.formal' })).toHaveLength(18);
  expect(targets({ gender: 'feminine', mood: 'indicative', tense: 'present' }).map(t => t.subject)).toEqual(['1sg', '2sg', '3sg.f', '1pl.f', '2pl.f', '3pl.f']);
});
it('rejects a subject the tense does not have', () => {
  // conjugate validates options and expands targets before the (stub) grammar runs; the imperative's `slots` exclude 3sg
  expect(() => conjugate({ language: 'es', infinitive: 'amar', subject: '3sg', mood: 'imperative' })).toThrow(expect.objectContaining({ code: 'INVALID_TARGET' }));
  expect(() => conjugate({ language: 'es', infinitive: 'amar', subject: 'vos' })).toThrow(expect.objectContaining({ code: 'INVALID_REQUEST' }));
});
it('shows Spanish in the CLI help', () => { /* run dist/cli.js --help, expect stdout to contain 'Spanish (es):' */ });
```

- [ ] **Step 2:** `npx vitest run tests/es/pack.test.ts` — FAIL (no `es` pack).
- [ ] **Step 3:** implement the files above and the five one-line registrations.
- [ ] **Step 4:** `npm run typecheck && npm test` at the root — PASS (French and Dutch characterization unchanged; completeness passes with no Spanish rules yet).
- [ ] **Step 5:** commit `feat(conjugation-engine): Spanish pack skeleton with catalogue and subject slots`.

### Task 2: Lexicon and classification

**Files:**
- Create: `src/languages/es/lexicon.ts`, `src/languages/es/classify.ts`, `tests/es/classify.test.ts`
- Modify: `src/languages/es/{grammar,rules,sources}.ts`, `src/i18n/locales/{en,nl}/es.ts`

**Interfaces:**
- Consumes: `spanishRules`, `spanishCitations` (Task 1).
- Produces (`lexicon.ts`): `SpanishEntry` and `Variant<T>` exactly as GD §5.1; `entries: Readonly<Record<string, SpanishEntry>>` (GD §5.2), `twoParadigms` (GD §5.2 last paragraph), `alternations: Readonly<Record<string, Alternation>>` (GD §5.3), `hiatusVerbs`, `bothStressVerbs` (GD §5.4), and the side lists `zcExceptions`, `strongBases`, `prefixes`, `noInherit`, `shortBaseDerivatives`, `families`, `diacritics` (GD §5.5). Lists are data only; each lemma verified per Global Constraints before it is added (record the date in a header comment, not per lemma).
- Produces (`classify.ts`):

```ts
export interface SpanishLexeme extends LexemeBase {   // LexemeBase: src/core/grammar.ts
  readonly infinitive: string;          // without -se, with its tilde (reír)
  readonly conjugation: 'ar' | 'er' | 'ir';
  readonly prefix: string;              // '' unless inherited (com- of componer)
  readonly base: string;                // lemma whose data it uses (poner), or itself
  readonly root: string;                // infinitive minus ending (compon-), or entry.root
  readonly alternation: Alternation | readonly Variant<Alternation>[] | null;   // erguir: two tagged alternations
  readonly raising: boolean;
  readonly stress: 'hiatus' | 'diphthong' | 'both';
  readonly zc: boolean;
  readonly yInsertion: boolean;
  readonly entry: SpanishEntry;          // {} for unlisted verbs
}
export function classifySpanish(query: Readonly<Record<string, unknown>>): Fork<SpanishLexeme>;
export function spanishLexemeOf(lemma: string): SpanishLexeme;   // for haber in chains
```

  `auxiliaries` is `['haber']`, `particle` null, `classId` the model (GD §3.1), `classSource` per GD §3.2. A two-paradigm lemma returns two outcomes tagged `{ pattern, condition }`; any variant alternation (erguir) is resolved later in the stem stage, not here.
- Rules added (GD §4.1, all 13): `es.classify.conjugation`, `.reflexive`, `.restore-accent`, `.lexicon`, `.two-paradigms`, `.prefixed`, `.family`, `.uar-stress`, `.hint`, `.assume-regular`, `.assume-glide`, `.assume-diphthong`, `.assume-zc`.

- [ ] **Step 1: Write the failing test** `tests/es/classify.test.ts` — through `conjugate(...).analysis` (or `spanishGrammar.classify` directly where only steps are compared):

```ts
const ids = (infinitive: string, extra = {}) => analysisOf(infinitive, extra).steps.map(s => s.rule);
it('classifies regular verbs and records the assumption', () => {
  expect(ids('amar')).toEqual(['es.classify.conjugation', 'es.classify.assume-regular']);
  expect(analysisOf('amar')).toMatchObject({ classification: 'amar', classificationSource: 'regularRule', reflexive: false, auxiliaries: ['haber'] });
});
it('reads reflexive infinitives', () => expect(analysisOf('levantarse')).toMatchObject({ lemma: 'levantarse', reflexive: true }));
it('restores the tilde of -eír/-oír', () => {
  expect(analysisOf('reir').lemma).toBe('reír');
  expect(ids('sonreir')).toContain('es.classify.restore-accent');
});
it('inherits strong irregularity only through the closed prefix list', () => {
  expect(analysisOf('componer')).toMatchObject({ classification: 'poner', classificationSource: 'lexicon' });
  expect(ids('protener')).toContain('es.classify.prefixed');
  expect(ids('blotener')).toContain('es.classify.assume-regular');
  expect(analysisOf('pretender').classification).toBe('temer');      // never tender's diphthong
  expect(analysisOf('contestar').classification).toBe('amar');
  expect(analysisOf('prever').classification).toBe('ver');          // explicit short-base map
});
it('uses suffix families', () => expect(analysisOf('traducir')).toMatchObject({ classification: 'conducir' }));
it('records only the assumptions that decide a form', () => {
  expect(ids('flobiar')).toContain('es.classify.assume-glide');
  expect(ids('flobiar', { stems: { stress: 'hiatus' } })).not.toContain('es.classify.assume-glide');
  expect(ids('blaular')).toContain('es.classify.assume-diphthong');
  expect(ids('blorecer')).toContain('es.classify.assume-zc');
  expect(ids('plontuar')).toContain('es.classify.uar-stress');
  expect(ids('blorpar')).not.toContain('es.classify.assume-glide');
});
it('accepts hints and rejects contradicting ones', () => {
  expect(analysisOf('plentar', { classHint: 'e-ie' })).toMatchObject({ classificationSource: 'explicitHint', classification: 'acertar' });
  expect(() => analysisOf('tener', { classHint: 'e-i' })).toThrow(expect.objectContaining({ code: 'INVALID_HINT' }));
  expect(() => analysisOf('levantarse', { reflexive: false })).toThrow(expect.objectContaining({ code: 'INVALID_HINT' }));
  expect(() => analysisOf('xyz')).toThrow(expect.objectContaining({ code: 'INVALID_INFINITIVE' }));
});
it('returns both paradigms of apostar, one with a hint', () => {
  expect(analysisOf('apostar').alternatives).toHaveLength(1);
  expect(analysisOf('apostar', { classHint: 'o-ue' }).alternatives).toBeUndefined();
});
```

- [ ] **Step 2:** run — FAIL.
- [ ] **Step 3:** implement `lexicon.ts`, `classify.ts` (algorithm GD §3.2–3.3; the vowel-group test for `assume-diphthong` is "the root's last run of vowel letters, ignoring the silent u of qu/gu, has two letters and one is i or u"); wire `classify` and `lexemeOf` into `spanishGrammar`; add the 13 rules with en + nl messages and citations (GD §4.1 cite column; `secondaryOnly` per GD §1).
- [ ] **Step 4:** `npx vitest run tests/es tests/i18n/completeness.test.ts`, then the root gate — PASS.
- [ ] **Step 5:** commit `feat(conjugation-engine): Spanish lexicon and classification with recorded assumptions`.

### Task 3: Stems, endings, spelling and accents for the simple finite tenses

**Files:**
- Create: `src/languages/es/{syllables,stems,paradigms,orthography,clause}.ts`, `tests/es/syllables.test.ts`, `tests/es/simple.test.ts`
- Modify: `src/languages/es/{grammar,rules,sources}.ts`, both message files

**Interfaces:**
- Produces (`syllables.ts`, pure):

```ts
export function vowelIndices(word: string): number[];                     // GD §4.5 step 1
export function rootStress(stem: string, base: { prefixLength: number; hiatus: boolean; stored: boolean }): number | null;  // step 2, null = no vowel
export function endingStress(word: string, fromEnd: number): number;      // n-th vowel letter from the end
export function nuclei(word: string, stressed: number): number[][];       // step 3
export type Accent = { kind: 'hiatus' | 'general' | 'monosyllable' | 'none'; stress: 'final' | 'penultimate' | 'antepenultimate'; written: string };
export function writeAccent(word: string, stressed: number): Accent;      // step 4 (no diacritics)
```

- `paradigms.ts`: the ending sets of GD §4.3 as data: `{ text: string; stress: number | 'root' }[]` per set.
- `stems.ts`: `stemFork(lexeme, cell): Fork<string>` applying GD §4.2 (root, diphthong, e-i, raising, present-1sg, subjunctive-from-1sg, zc, y-insertion, strong preterite, `-ducir`, future stems, preterite-3pl base, lexical stems; variant stems such as `yazc|yazg|yag` and erguir's two alternations become tagged outcomes).
- `grammar.ts`: `cellOf(target, lexeme)` returns a finite cell for the simple indicative, conditional, subjunctive and `imperative.present` targets, `null` otherwise; `cell(lexeme, cell)` serves `entry.cells`, `imperative2sg` (`es.cell.*`); `ending` reads `paradigms.ts` and tags `subjunctive.imperfect` outcomes `{ pattern: 'ra' }` then `{ pattern: 'se' }` and `subjunctive.future` outcomes `{ usage: 'dated' }`.
- `orthography.ts`: `spanishOrthography: readonly JunctureRule<{ lexeme: SpanishLexeme; cell: Cell }>[]` in GD §4.4 order. The four accent rules compute the stressed vowel from `(lexeme, cell, juncture)`: ending-stressed cells by `endingStress(stem + ending, set.stress)`, root-stressed cells by `rootStress(stem, …)` (ending's first vowel when null). `es.orth.monosyllable` returns its step on an unchanged juncture (the runner keeps a rule's own steps).
- `clause.ts` (first part): `agreements` → `one(null)`; `assemble` adds `que` (`es.clause.que`, subjunctive moods) and the subject pronoun from `context.subject` (`es.clause.subject`) before the verb word; imperative targets get no subject part.
- Rules added: GD §4.2 (18), §4.3 (15), §4.4 (17), `es.clause.subject`, `es.clause.que`.

- [ ] **Step 1: Write the failing tests.**

`tests/es/syllables.test.ts` — `writeAccent` on the stressed index the grammar would pass:

```ts
it.each([
  ['amabamos', 2, 'amábamos'], ['envio', 3, 'envío'], ['actuo', 3, 'actúo'], ['aislo', 1, 'aíslo'], ['prohibo', 4, 'prohíbo'],
  ['construi', 7, 'construí'], ['hui', 2, 'hui'], ['huis', 2, 'huis'], ['huido', 2, 'huido'], ['construia', 7, 'construía'],
  ['guio', 3, 'guio'], ['guiais', 3, 'guiais'], ['rio', 2, 'rio'], ['sonrio', 5, 'sonrió'], ['dio', 2, 'dio'],
  ['averiguais', 7, 'averiguáis'], ['estas', 3, 'estás'], ['levantate', 3, 'levántate'], ['levantaos', 6, 'levantaos'],
  ['reios', 2, 'reíos'], ['estoy', 3, 'estoy'], ['preves', 4, 'prevés'],
])('%s with stress at %i → %s', (word, stressed, written) => expect(writeAccent(word, stressed).written).toBe(written));
it('finds root stress with glides, hiatus and stored stems', () => {
  expect(rootStress('cambi', { prefixLength: 0, hiatus: false, stored: false })).toBe(1);
  expect(rootStress('envi', { prefixLength: 0, hiatus: true, stored: false })).toBe(3);
  expect(rootStress('gui', { prefixLength: 0, hiatus: false, stored: false })).toBe(2);
  expect(rootStress('oig', { prefixLength: 0, hiatus: true, stored: true })).toBe(0);
  expect(rootStress('prev', { prefixLength: 3, hiatus: false, stored: false })).toBeNull();
});
```

`tests/es/simple.test.ts` — bare texts (`renderParts('es', form.parts, { bare: true })`) per target, plus rule-id sequences:

```ts
expect(row('amar', 'indicative', 'imperfect')).toEqual(['amaba', 'amabas', 'amaba', 'amábamos', 'amabais', 'amaban']);
expect(row('sentir', 'indicative', 'simple_past')).toEqual(['sentí', 'sentiste', 'sintió', 'sentimos', 'sentisteis', 'sintieron']);
expect(row('dormir', 'subjunctive', 'present')).toEqual(['duerma', 'duermas', 'duerma', 'durmamos', 'durmáis', 'duerman']);
expect(row('conocer', 'subjunctive', 'present')[0]).toBe('conozca');
expect(row('guiar', 'indicative', 'simple_past')).toEqual(['guie', 'guiaste', 'guio', 'guiamos', 'guiasteis', 'guiaron']);
expect(row('reír', 'subjunctive', 'present')).toEqual(['ría', 'rías', 'ría', 'riamos', 'riais', 'rían']);
expect(row('ahincar', 'indicative', 'present')).toEqual(['ahínco', 'ahíncas', 'ahínca', 'ahincamos', 'ahincáis', 'ahíncan']);
expect(row('averiguar', 'subjunctive', 'present')).toEqual(['averigüe', 'averigües', 'averigüe', 'averigüemos', 'averigüéis', 'averigüen']);
expect(row('avergonzar', 'indicative', 'present')[0]).toBe('avergüenzo');
expect(row('oler', 'indicative', 'present')[0]).toBe('huelo');
expect(row('errar', 'indicative', 'present')[0]).toBe('yerro');
expect(row('influir', 'indicative', 'present')).toEqual(['influyo', 'influyes', 'influye', 'influimos', 'influís', 'influyen']);
expect(row('bruñir', 'indicative', 'simple_past')[5]).toBe('bruñeron');
expect(row('tener', 'subjunctive', 'imperfect')[3]).toEqual('tuviéramos / tuviésemos');      // row joins a cell's forms with ' / '
expect(row('dar', 'subjunctive', 'present')).toEqual(['dé', 'des', 'dé', 'demos', 'deis', 'den']);
expect(row('estar', 'indicative', 'present')).toEqual(['estoy', 'estás', 'está', 'estamos', 'estáis', 'están']);
expect(row('ver', 'indicative', 'present')).toEqual(['veo', 'ves', 've', 'vemos', 'veis', 'ven']);
expect(row('yacer', 'indicative', 'present')[0]).toBe('yazco / yazgo / yago');
expect(row('amar', 'imperative', 'present')).toEqual(['ama', 'ame', 'amemos', 'amad', 'amen']);
expect(row('poner', 'imperative', 'present')[0]).toBe('pon');
expect(texts('amar', { mood: 'indicative', tense: 'present', person: 1, number: 'singular' })).toEqual(['yo amo']);
expect(texts('amar', { mood: 'subjunctive', tense: 'present', person: 1, number: 'singular' })).toEqual(['que yo ame']);
expect(form('sentir', 'indicative', 'simple_past', 3, 'singular')[0].ruleIds).toEqual(
  ['es.clause.subject', 'es.stem.root', 'es.stem.raising', 'es.end.preterite', 'es.orth.accent-general']);   // form-level steps first, then the verb part's
expect(analysisOf('sentir').steps.map(s => s.rule)).toEqual(['es.classify.conjugation', 'es.classify.lexicon']);
expect(form('guiar', 'indicative', 'simple_past', 3, 'singular')[0].ruleIds).toContain('es.orth.monosyllable');
expect(form('amar', 'subjunctive', 'imperfect', 1, 'singular').map(f => f.variant.pattern)).toEqual(['ra', 'se']);
expect(form('amar', 'subjunctive', 'future', 1, 'singular')[0].variant.usage).toBe('dated');
```

(`row(verb, mood, tense)` = per target in catalogue order, the bare texts of its forms joined with ` / `; `form(...)` = the `ConjugatedForm`s of one target; `ruleIds` is the core's derived list: the form's own steps, then each part's.)

- [ ] **Step 2:** run — FAIL.
- [ ] **Step 3:** implement; spot-check `npm run cli -w conjugation-engine -- es sentir --mood indicative --tense simple_past --explain` (steps in order, no `{`).
- [ ] **Step 4:** root gate — PASS (completeness covers the 52 new rules).
- [ ] **Step 5:** commit `feat(conjugation-engine): Spanish stems, endings, spelling rules and computed accents`.

### Task 4: Non-finite forms, compound tenses, clause and availability

**Files:**
- Create: `src/languages/es/periphrasis.ts`, `tests/es/compound.test.ts`, `tests/es/clause.test.ts`
- Modify: `src/languages/es/{grammar,clause,rules,sources}.ts`, both message files

**Interfaces:**
- `periphrasis.ts`: `spanishPeriphrases: readonly Periphrasis<SpanishLexeme>[]` — the 11 chains of GD §4.6, none with `applies`; the perfect chains end in `{ verb: 'main', nonFinite: 'compound-participle' }` (the participle outcomes minus those marked `compound: false`, so `he elegido` but participle `elegido` / `electo`); the negative imperative has no `perfectAuxiliary` and declares no params.
- `grammar.ts`: `cellOf` adds non-finite cells `infinitive`, `gerund`, `participle` (`participle` outcomes tagged `regular` / `irregular` only for doublets); `availability(lexeme, target)` implements GD §4.8 (`impersonal`, `defective` for soler per GD §5.6, `noImperative` for haber), each with its step and the source URL of its citation.
- `clause.ts`: full `assemble` per GD §6 — order `que` · subject (`context.subject.pronoun`) · `no` · proclitic · auxiliary · verb; enclitics on affirmative imperative, infinitive, gerund (on haber in compound non-finite forms) as `grammaticalPart(rendering, 'reflexivePronoun', pronoun, null, {}, 'attached')`, the verb part (`wordPart(rendering, word, features)`) carrying the text re-accented through `writeAccent` with the verb's original stress; d-drop (not for `ir`: `idos`, plus the `iros` variant) and s-drop. `agreements` stays `one(null)` (`context.agreeing` is never used: Spanish participles do not agree).
- Rules added: GD §4.6 (11), `es.clause.proclitic`, `.enclitic`, `.enclitic-d-drop`, `.enclitic-s-drop`, `.enclitic-accent`, GD §4.8 (3).

- [ ] **Step 1: Write the failing tests.**

`tests/es/compound.test.ts`:

```ts
expect(texts('amar', { mood: 'indicative', tense: 'past_anterior', person: 1, number: 'singular' })).toEqual(['yo hube amado']);
expect(texts('amar', { mood: 'subjunctive', tense: 'pluperfect', person: 1, number: 'plural' })).toEqual(['que nosotros hubiéramos amado', 'que nosotros hubiésemos amado']);
expect(forms('amar', { mood: 'subjunctive', tense: 'future_perfect', person: 3, number: 'singular' })[0].variant).toMatchObject({ usage: 'dated', auxiliary: 'haber' });
expect(texts('poner', { mood: 'infinitive', tense: 'past' })).toEqual(['haber puesto']);
expect(texts('amar', { mood: 'gerund' })).toEqual(['amando', 'habiendo amado']);
expect(texts('freír', { mood: 'participle' })).toEqual(['frito', 'freído']);
expect(texts('elegir', { mood: 'participle' })).toEqual(['elegido', 'electo']);
expect(texts('elegir', { mood: 'indicative', tense: 'perfect', person: 1, number: 'singular' })).toEqual(['yo he elegido']);
expect(texts('amar', { mood: 'imperative', tense: 'negative' })).toEqual(['no ames', 'no ame', 'no amemos', 'no améis', 'no amen']);
expect(unavailable('llover', { mood: 'indicative', tense: 'present' }).map(u => u.reason)).toEqual(Array(5).fill('impersonal'));
expect(texts('llover', { mood: 'indicative', tense: 'present' })).toEqual(['él llueve']);
expect(unavailable('haber', { mood: 'imperative' })).toHaveLength(10);
expect(texts('abolir', { mood: 'indicative', tense: 'present', person: 1, number: 'singular' })).toEqual(['yo abolo']);
expect(texts('soler', { mood: 'indicative', tense: 'perfect', person: 1, number: 'singular' })).toEqual(['yo he solido']);
expect(texts('soler', { mood: 'gerund', tense: 'present' })).toEqual(['soliendo']);
expect(unavailable('soler', {}).map(u => `${u.target.mood}.${u.target.tense}`)).toEqual(expect.arrayContaining(['indicative.future', 'conditional.past', 'imperative.present', 'subjunctive.future_perfect']));
expect(unavailable('soler', {})).toHaveLength(46);   // GD §5.6
expect(unavailable('soler', {}).every(u => u.reason === 'defective')).toBe(true);
```

`tests/es/clause.test.ts` (Review Focus 3):

```ts
it('places and re-accents reflexive pronouns', () => {
  expect(texts('levantarse', { mood: 'imperative', tense: 'present' })).toEqual(['levántate', 'levántese', 'levantémonos', 'levantaos', 'levántense']);
  expect(texts('levantarse', { mood: 'imperative', tense: 'negative' })).toEqual(['no te levantes', 'no se levante', 'no nos levantemos', 'no os levantéis', 'no se levanten']);
  expect(texts('levantarse', { mood: 'indicative', tense: 'perfect', person: 1, number: 'singular' })).toEqual(['yo me he levantado']);
  expect(texts('levantarse', { mood: 'gerund' })).toEqual(['levantándose', 'habiéndose levantado']);
  expect(texts('irse', { mood: 'imperative', tense: 'present' })).toEqual(['vete', 'váyase', 'vámonos', 'vayámonos', 'idos', 'iros', 'váyanse']);   // iros: GD §11 row 3
  expect(texts('reírse', { mood: 'imperative', tense: 'present', person: 2, number: 'plural' })).toEqual(['reíos']);
  expect(texts('vestirse', { mood: 'imperative', tense: 'present', person: 1, number: 'plural' })).toEqual(['vistámonos']);
  expect(bare('levantarse', { mood: 'subjunctive', tense: 'present', person: 1, number: 'singular' })).toEqual(['me levante']);
});
it('gives the formal subject its pronoun', () => {
  expect(texts('amar', { subject: '2sg.formal', mood: 'indicative', tense: 'present' })).toEqual(['usted ama']);
  expect(texts('amar', { gender: 'feminine', mood: 'indicative', tense: 'present', person: 3 })).toEqual(['ella ama', 'ellas aman']);
});
it('explains enclitic re-accentuation', () => {
  expect(ruleIdsOfForm('levantarse', 'imperative', 'present', 1, 'plural')).toEqual(expect.arrayContaining(['es.clause.enclitic', 'es.clause.enclitic-s-drop', 'es.clause.enclitic-accent']));
});
```

(`irse` 1pl: `vámonos` comes from ir's `vamos`, `vayámonos` from `vayamos`; both tagged.)

- [ ] **Step 2:** run — FAIL.
- [ ] **Step 3:** implement.
- [ ] **Step 4:** root gate — PASS; CLI spot check `npm run cli -w conjugation-engine -- es levantarse --mood imperative --explain --locale nl` prints steps, no `{` or `undefined`.
- [ ] **Step 5:** commit `feat(conjugation-engine): Spanish compound tenses, clitics and defective verbs`.

### Task 5: Corpus parser, language module, ledger and fixtures

Tasks 5 and 6 of the uniform skeleton are split differently here: the ledger moves into this task because importing the fixtures registers 11,036 cells with `tests/corpus.test.ts`, which must stay green at this commit (Global Constraints). Task 6 keeps the guards.

**Files:**
- Create: `scripts/corpus/parsers/es.ts`, `scripts/corpus/languages/es.ts`, `scripts/corpus/corrections/es.ts`, `tests/es/parser.test.ts`, `tests/fixtures/es.json` (generated)
- Modify: `scripts/corpus/languages/index.ts` (one line), `tests/corpus.test.ts` (one pinned line), `tests/fixtures/{manifest,corrections}.json` (regenerated)

**Interfaces:**
- `parsers/es.ts`: `export const spanishCellsPerFile = 124; export function parseSpanish(html: string, file: string): ParsedCorpus` — GD §9.2–9.3 exactly (28 content cells, heading-path check, bold-segment alternates, pronoun labels, subjects, variants, headings, 4 placeholders).
- `languages/es.ts`: `export const spanish: CorpusLanguage` — GD §9.4, with `remaps` = the 6 rows of GD §9.5 (`{ heading, occurrence: 0, target: { mood, tense }, reason, source }`) and `unmodelled: {}`.
- `corrections/es.ts`: `export function spanishCorrection(file, cell, index): CorpusCorrection | null` — the rows of GD §9.6, one `if` block per row, literal expected strings (never generated), reason > 30 characters, `https://` source.

- [ ] **Step 1: Write the failing parser test** `tests/es/parser.test.ts` with inline HTML built from the page template (one finite column, one imperative column, the participle table):

```ts
expect(lines('<td valign="top">(yo) p<b>udrí/odrí</b><br />(t&uacute;) p<b>udriste</b>…</td>')[0]).toEqual({ original: 'yo pudrí/podrí', expected: ['yo pudrí', 'yo podrí'] });
expect(cellFor('(ns) am<b>amos</b>', 3)).toMatchObject({ expected: ['nosotros amamos'], subject: '1pl' });
expect(cellFor('que (&eacute;l) am<b>e</b>', 2).expected).toEqual(['que él ame']);
expect(imperativeCells('-<br />am<b>a</b><br />am<b>e</b>…').map(c => c.subject)).toEqual(['2sg', '2sg.formal', '1pl', '2pl', '2pl.formal']);
expect(() => parseSpanish('<html></html>', 'bad.html')).toThrow('28 Spanish table cells');
expect(() => parseSpanish(pageWithHeading('Indicative', 'Present tense'), 'bad.html')).toThrow('unexpected heading');
```

- [ ] **Step 2:** run — FAIL.
- [ ] **Step 3:** implement the three modules; register `spanish`; add the pinned line; run `npm run corpus:import -- --source /Users/wouter/Downloads/VerbodromeX --only es` (refuses on a wrong revision; the checkout is read only and nothing in it is executed). Expected console line: `es: 89 files, 89 infinitives, 11036 cells, …, 97 corrections, 356 accounted template placeholders`.
- [ ] **Step 4:** `npm run corpus:check` — every Spanish cell passes; `git diff --stat -- tests/fixtures/fr.json tests/fixtures/nl.json` is empty. Any failing cell is either an engine bug (fix it in the pack, with a test in `tests/es/`) or a source error missing from GD §9.6 (add a ledger row with an authority, and note it in the task report).
- [ ] **Step 5:** commit `feat(conjugation-engine): Spanish corpus import with a sourced corrections ledger`.

### Task 6: Corpus guards

**Files:**
- Create: `tests/es/corpus-guards.test.ts`

**Interfaces:**
- Consumes: `tests/fixtures/es.json`, `spanish` (Task 5), `conjugate`.

- [ ] **Step 1: Write the guard tests:**
  - **over-generation**: for every Spanish fixture cell, the applicable generated forms whose text is not expected (after the ledger) all have a non-null `variant.pattern` or a non-standard `usage` (Review Focus 4). Known extras that must appear: yacer `yazco`, `yago`; roer `roigo`, `royo`; erguir `irgo`; satisfacer `satisface`; predecir `prediré`; ir `vamos`; elegir `electo` in the first participle column.
  - **coverage**: every `spanishCatalogue` entry is the target of at least one fixture cell.
  - **remap audit**: every cell whose `heading` is one of the 6 remap headings has that remap's target, and there are `(6 + 6 + 6 + 6 + 1 + 1) × 89 = 2,314` such cells.
  - **ledger shape**: the Spanish corrections number exactly the pinned count from Task 5 and every `source` host is `www.rae.es`, `dle.rae.es` or a host listed in `spanishWorks`.
- [ ] **Step 2:** run — the guards should pass; if the over-generation guard fails, tag the variant in the pack (never relax the guard).
- [ ] **Step 3:** root gate — PASS.
- [ ] **Step 4:** commit `test(conjugation-engine): Spanish corpus guards for variants, coverage and remaps`.

### Task 7: Independent tests: invented verbs, real verbs outside the oracle, explanations

**Files:**
- Create: `tests/es/invented.test.ts`, `tests/es/real.test.ts`
- Modify: `tests/i18n/runtime.test.ts` (add `'es'` to its language list; its Spanish query set is every fixture verb plus the GD §8.1 verbs, unfiltered)

**Interfaces:**
- Consumes: the public API only (`conjugate`, `explain`, `renderParts`).

- [ ] **Step 1: Write the tests.** `invented.test.ts`: one `it` per GD §8.1 row, asserting the listed forms (bare text, per target) and, where the row names one, the assumption ids in `analysis.steps`. `real.test.ts`: one `it` per GD §8.2 row. Before committing `real.test.ts`, open each verb's DLE conjugation table and tick it in the task report; a form that differs from the DLE is fixed in the test (and in the engine if needed), never kept.
- [ ] **Step 2:** run — FAIL only where the pack is wrong; fix the pack (each fix with the smallest test that shows it).
- [ ] **Step 3:** root gate including `tests/i18n/runtime.test.ts` (every Spanish form and unavailable target explains in `en` and `nl` without `{` or `undefined`).
- [ ] **Step 4:** commit `test(conjugation-engine): Spanish invented and out-of-corpus verbs, explained in both locales`.

### Task 8: Documentation and equivalence map

**Files:**
- Create: `docs/grammar/es.md`; `src/equivalence/es.ts` only if `src/equivalence/` exists (else the table goes in `docs/grammar/es.md`)
- Modify: `README.md` (package; language list and corpus table row: Spanish, 89 files, 89 infinitives, 11,036 cells), `src/equivalence/index.ts` (one line, only if it exists)

**Interfaces:**
- `src/equivalence/es.ts` (if present): the total map of GD §10, typed like the French and Dutch maps.

- [ ] **Step 1:** write `docs/grammar/es.md`: rule inventory grouped by stage with each citation and URL (generated from `spanishRules` / `spanishCitations` by a throwaway script, then edited), defaults and assumptions (GD §3.2), what is out (GD §2.4), the accent algorithm (GD §4.5), corrections summary (GD §9.6 with counts), remaps, the `secondaryOnly` list.
- [ ] **Step 2:** if `src/equivalence/` exists: add the map and regenerate `tests/equivalence/matrix.tsv` with its script; run its tests.
- [ ] **Step 3:** root gate; `npm run build && npm test -w verbodrome`.
- [ ] **Step 4:** CLI spot checks recorded in the report: `npm run cli -w conjugation-engine -- es guiar --mood indicative --tense simple_past --explain`, `es levantarse --mood imperative --explain --locale nl`, `es blorecer`, `es reir --person 3 --number singular --mood indicative --tense simple_past`.
- [ ] **Step 5:** commit `docs(conjugation-engine): Spanish grammar notes and tense equivalence`.
