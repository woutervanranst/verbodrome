# Seven-Language Engine — Plan 3: French rebuilt as a rule-first staged pack

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the legacy French resolver (113 suffix-selected ending tables) by a `StagedGrammar` in which families store principal parts, tenses come from formation rules, ç / ge / è / y→i / -eler, -eter / 1990 spellings are recorded rules, only 28 suppletive cells are listed, and every form explains itself in English and Dutch — with output identical to the frozen snapshot except 165 sourced ledger entries at whitelist boundaries.

**Architecture:** Shadow mode, as Plan 2 Part B did for Dutch: the new grammar is built beside the legacy resolver, compared with the frozen snapshot section by section through a shrinking pending list, then switched in and the legacy tables deleted. A one-off script bootstraps the family lexicon from the 113 validated tables; nothing is retyped. One additive core hook (`ClauseGrammar.subjectGenders`) lets six genderless subject slots reproduce the legacy gender fork exactly.

**Tech Stack:** TypeScript 7 strict, Node 26, Vitest 5, npm workspaces. No new dependencies.

**Spec:** `docs/superpowers/specs/2026-11-24-seven-language-engine-design.md` (sections "French rebuild", "No-regression net", "Subject gender") and the grammar design `docs/superpowers/research/2026-11-24-fr-grammar-design.md`, cited as **GD §n**. GD holds the rule tables, ending sets, the per-model reduction table, the agreement table and the ledger prediction; this plan points at it instead of repeating it. Design input: `docs/superpowers/research/2026-11-24-core-architecture-and-french-rebuild-design.md` §F and notes N1–N5.

**Builds on:** Plan 2 Tasks 1–4 (landed: `LanguagePack.subjects` / `subjectsFor` / `genderedTargets`, `CatalogueEntry.slots`, `classify` returning a `Fork` of paradigms with `analysis.alternatives`, per-paradigm `availability`, `cellOf(target, lexeme)`, `Periphrasis<X>` with `applies` / `reports`, `ClauseContext.subject` / `agreeing`, agreement on simple non-finite targets, `wordPart(…, { onsetFlags })`) and Plan 2 Task 5 (the `./core` authoring surface and `OptionSchema<OptionFieldsOf<Spec>>`) when it has landed. Read `src/core/staged.ts`, `clause.ts`, `periphrasis.ts`, `pack.ts`, `fork.ts`, `juncture.ts`, `tests/toy/pack.ts` and the pack-authoring guide `packages/conjugation-engine/docs/pack-authoring.md` before Task 2. The legacy implementation is the behaviour specification: `src/languages/fr/index.ts` (resolution, auxiliaries, agreement, composition), `models.ts`, `table.ts`, `principal.ts`, `lexicon.ts`.

## Global Constraints

- All paths are relative to `packages/conjugation-engine/` unless they start with `apps/` or `docs/`.
- Branch `feat/seven-language-engine` (or the worktree branch assigned to this plan); one commit per task; every commit keeps `npm run typecheck && npm test` green at the workspace root and `npm run corpus:check` passing. Commit messages end with `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`.
- Until Task 8, public French output must not change at all: the registered pack keeps the legacy `engine`; the new grammar runs only inside `tests/fr/`.
- From Task 8 on, French output must equal the frozen snapshot except for entries in `tests/characterization/intended-diffs.json`, each with `reason` (> 30 characters) and an `https://` `source`. The only permitted French differences are GD §9.3 classes L1 and L2 (165 differing lines in GD's prediction), recorded as block-level entries for the affected probe-verb queries (see `docs/pack-authoring.md`, "The characterization ledger"). Nothing under `tests/characterization/*.gz` or `*.queries.json` is edited.
- Dutch output must not change (Dutch half of `tests/characterization.test.ts`, `tests/nl*`, Dutch corpus).
- `tests/fixtures/*` stay byte-identical; the French corpus pins (222 files, 84 infinitives, 26,196 cells, 125 corrections) stay green.
- The six consuming app files compile unchanged: `apps/verbodrome/src/trainer/{forms,prompt,distractors,question}.ts`, `apps/verbodrome/src/config/{tenses,verbs}.ts`; `npm run build && npm test -w verbodrome` passes (the trainer reads French forms, parts and their roles, features and onsets, `preferred`, `analysis` and `unavailableTargets[].reason`). The French options `gender`, `agreement`, `precedingDirectObject`, `reflexiveObject`, `auxiliary`, `classHint`, `model`, `stems`, `aspiratedH`, `preferredOrthography` keep their names and meaning; `analysis.classification` keeps reporting the legacy model ids and `model:` accepts them back.
- Paths this plan touches: `src/languages/fr/**`, `src/i18n/locales/{en,nl}/fr.ts`, `tests/fr/**`, `scripts/fr/**` (deleted in Task 8), `docs/grammar/fr.md`; the existing French tests `tests/{fr,fr-models,novel,errors,cli,characterization}.test.ts`; and these shared lines only:
  - `src/core/clause.ts`, `src/core/staged.ts`: the optional `subjectGenders` hook (Task 2, additive; the only core change)
  - `tests/core/staged.test.ts`, `tests/toy/pack.ts`, `tests/toy/messages.ts`: the toy exercises the hook (Task 2)
  - `src/i18n/locales/en/index.ts`, `src/i18n/locales/nl/index.ts`: spread `fr` (Task 3)
  - `tests/i18n/runtime.test.ts`: `'fr'` in its language list (Task 7; the file comes from Plan 2 Task 9)
  - `src/types.ts`: `FrenchSubject` beside the other French type exports (Task 2)
  - `scripts/characterize/build-queries.ts` and the `characterize:queries` script in `package.json`: deleted (Task 8; the script's header says this plan deletes it)
  - `docs/grammar.md`: the French section moves to `docs/grammar/fr.md` (Task 8); package `README.md`: one line (Task 8)
- Zero runtime dependencies; nothing under `src/` imports `node:*` (except `src/cli.ts`), `scripts/` or `tests/`.
- Every French rule has an English and a Dutch message and a citation; `tests/i18n/completeness.test.ts` passes for `fr`. Rule ids are exactly those of GD §4 (`fr.<stage>.<name>`, kebab case; 94 rules). Messages: one sentence for a secondary-school learner, forms named through `{before}` / `{after}` and declared params; Dutch terms per GD §4 intro. The English messages of the five assumption rules reproduce today's sentences character for character (GD §3).
- Citations use the verified sources of GD §1 (Académie 9e `https://www.dictionnaire-academie.fr/…`, JO 1990 facsimile `https://academie-francaise.fr/sites/academie-francaise.fr/files/rectifications.pdf`, OQLF `https://vitrinelinguistique.oqlf.gouv.qc.ca/<id>`, CNRTL). A rule is never cited to Le Conjugueur or to the corpus. *Le Bon Usage* is cited by § only where the § was checked in a copy; otherwise not at all.
- Lexicon entries come from the bootstrap script (never retyped) and are checked family by family against the Académie table `https://www.dictionnaire-academie.fr/conjuguer/<id>`; a family that could not be checked, and the five listed spellings of GD §5.2, are flagged in `sources.ts` (`secondaryOnly`).

## Review Focus

1. **An invented verb that looks like an irregular one or sits on a whitelist boundary**: `bleder` (now `je blède`, label `lever`), `blettre` (now `je blets`), `zenir` (stays finir: `je zenis`), `blouvoir` (selected by `-voir`: inflected like voir). → Task 3 tests, Task 8 ledger.
2. **A verb with several paradigms**: `payer` (every cell twice, `y-to-i` then `keep-y`, even `nous payons`), `s'asseoir` future (`je m'assoirai` rectified, `je m'assiérai` both, `je m'asseoirai` traditional, in that order), `faillir` (four paradigms, one dated). → Tasks 3–5, shadow test.
3. **A reflexive in a compound tense, with and without agreement**: `je me suis assise`; `elle s'est lavé` with `reflexiveObject: 'indirect'`; `nous nous sommes parlé`; and the pronominal imperative `lave-toi` (past imperative unavailable). → Task 6.
4. **A form with two accepted spellings**: `je cèderai` / `je céderai`, `il connait` / `il connaît`, `interpeler` / `interpeller`, with `preferredOrthography: 'traditional'` flipping `preferred`. → Tasks 3–5.
5. **Input in 1990 spelling or without diacritics**: `assoir`, `interpeler`, `connaitre` must name the traditional lemma (`verbId` `asseoir`, `interpeller`, `connaître`); `connaitre` and `connaître` give identical blocks. → Task 3 test.

---

### Task 1: Bootstrap script and generated principal-part lexicon

**Files:**
- Create: `scripts/fr/bootstrap-families.ts`, `src/languages/fr/families.ts` (generated), `src/languages/fr/ending-sets.ts` (generated), `tests/fr/bootstrap.test.ts`

**Interfaces:**
- `scripts/fr/bootstrap-families.ts` (run with `node --experimental-strip-types --import ./scripts/characterize/register.ts scripts/fr/bootstrap-families.ts`): reads `frenchModels` and `cellTexts`, and exports two pure functions the test uses:

```ts
export interface PrincipalParts {
  readonly P1?: Part; readonly set?: 'e' | 's' | 'x'; readonly P2?: Part; readonly P3?: Part; readonly F?: Part;
  readonly PS?: Part; readonly theme?: 'a' | 'i' | 'u' | 'in' | 'ï'; readonly PP?: Part; readonly PPF?: Part;
  readonly SJ1?: Part; readonly SJ2?: Part;
}
type Part = string | readonly string[];                 // several values = a fork, in this order
export interface FamilyParadigm {
  readonly pattern: string | null; readonly usage: 'standard' | 'dated';
  readonly parts: PrincipalParts;                         // traditional spelling, relative to the stripped stem
  readonly gaps: readonly CellName[];                     // cells absent although their part exists
  readonly cells: Readonly<Partial<Record<CellName, readonly string[]>>>;      // suppletive whole words
  readonly spellings: Readonly<Partial<Record<CellName, { readonly rectified: readonly string[] }>>>; // listed spellings (GD O1, O2)
}
export interface FamilyEntry {
  readonly id: string; readonly lemmas: readonly string[]; readonly suffixes: readonly string[];
  readonly except: readonly string[]; readonly exceptEndings: readonly string[]; readonly strip: number;
  readonly paradigms: readonly FamilyParadigm[];
  readonly flags: { invariableParticiple?: true; impersonal?: 'singular' | 'figurativePlural'; thirdPersonOnly?: true;
    noImperative?: true; compounds?: 'nonFinite' | 'none'; imperativeFromSubjunctive?: true;
    presentParticipleFromSubjunctive?: true; circumflexBeforeT?: true; verified?: { readonly academie: string; readonly date: string } };
}
export function extract(model: FrenchModel): FamilyEntry;                      // GD §5.2 method
export function derive(entry: FamilyEntry, paradigm: number, cell: number): readonly string[] | null; // traditional, GD §4.2–4.3, no spelling rules
```

  `CellName` is the 51-cell vocabulary of GD §5.2 (`pres.1s` … `inf`). `extract` reads parts off cells 0/3/5/18/12/46/24/27 with the fallbacks of GD §5.2, detects `imperativeFromSubjunctive` (imperative 1pl = SJ2 + ons ≠ P2 + ons) and `presentParticipleFromSubjunctive`, turns `a/b` alternatives that line up along a whole part into a part with several values, lists remaining mismatches as `cells` and present-but-underived cells as `gaps`, and sets `circumflexBeforeT` on the -aître/-oître, plaire and gésir families. For seoir, messeoir and échoir it takes P2 from the imparfait (sey-, messey-, échoy-), leaving the participe présent as the residual cell (GD §5.2 notes).
- Running the script writes `src/languages/fr/families.ts` (`export const frenchFamilies: readonly FamilyEntry[]`, the 94 non-productive models in `models.ts` order, with a header saying it was generated once from `models.ts` at commit `<sha>` and is maintained by hand from now on) and `src/languages/fr/ending-sets.ts` (`erEndings`, `irEndings`, `reEndings`: 51 endings each from the `aimer`, `finir`, `rompre` tables with `^`, `t:`/`r:` marks removed, rows as GD §4.3). It writes nothing else.

- [ ] **Step 1: Failing test** `tests/fr/bootstrap.test.ts`:

```ts
import { frenchModels } from '../../src/languages/fr/models.js';
import { cellTexts } from '../../src/languages/fr/table.js';
import { frenchFamilies } from '../../src/languages/fr/families.js';
import { erEndings, irEndings, reEndings } from '../../src/languages/fr/ending-sets.js';
import { derive } from '../../scripts/fr/bootstrap-families.ts';

it('has one family per non-productive model, in model order', () => { /* ids equal frenchModels.filter(m => !m.productive).map(m => m.id): 94 */ });
it('derives every traditional cell of every family exactly, apart from its listed cells', () => {
  /* for each entry e, paradigm p, cell i: (e.paradigms[p].cells[name(i)] ?? derive(e, p, i)) deep-equals
     cellTexts('', model.paradigms[p].cells[i], 'traditional', model.kind === 'er'); 101 paradigms × 51 cells */
});
it('lists exactly the measured suppletive cells', () => {
  /* count of `cells` entries per family: être 10, avoir 7, aller 3, faire 2, dire 1, pouvoir 1, seoir 1, messeoir 1,
     échoir 1 + 1; total 28 (GD §5.2) */
});
it('leaves exactly the measured spelling obligations to the rules', () => {
  /* cells whose legacy rectified and traditional texts differ: gésir 1, croître 16, accroître 14, naître 14, paître 14,
     repaître 14, connaître 14, mouvoir 1, plaire 1, absoudre 2, clore 1, enclore 1, asseoir#assois 13, asseoir#assieds 1,
     surseoir 13, interpeller 30 — 150 in total; each is assigned to a GD §4.4 rule or to `spellings` */
});
it('generates the three productive ending sets', () => {
  expect(erEndings.slice(0, 6)).toEqual(['e', 'es', 'e', 'ons', 'ez', 'ent']);
  expect(irEndings[3]).toBe('issons'); expect(reEndings[2]).toBe('t'); expect(erEndings[18]).toBe('erai');
});
```

- [ ] **Step 2:** `npx vitest run tests/fr/bootstrap.test.ts` — FAIL (no script, no generated files).
- [ ] **Step 3:** write the script, run it once, review the two generated files by hand against GD §5.2's table (same parts, gaps, alternatives and residual cells); fix the script, not the output, until they match.
- [ ] **Step 4:** run the test — PASS; `npm run typecheck && npm test` at the root.
- [ ] **Step 5:** commit `feat(conjugation-engine): French principal-part lexicon bootstrapped from the model tables`.

### Task 2: Subject slots, spec, options and the shadow harness; the `subjectGenders` hook

**Files:**
- Modify: `src/core/clause.ts`, `src/core/staged.ts`, `tests/core/staged.test.ts`, `tests/toy/pack.ts`, `tests/toy/messages.ts`, `src/languages/fr/catalogue.ts`, `src/languages/fr/spec.ts`, `src/types.ts`
- Create: `src/languages/fr/rules.ts`, `src/languages/fr/sources.ts`, `src/languages/fr/clause.ts`, `src/languages/fr/grammar.ts`, `tests/fr/shadow.ts` (helper), `tests/fr/shadow.test.ts`, `tests/fr/shadow-pending.txt`

**Interfaces:**
- Core (GD §6.3, Deviation D1):

```ts
// src/core/clause.ts, on ClauseGrammar<X>
/**
 * The subject genders a form of this construction shows when its subject slot has none (French: il/elle, and je/tu/nous/vous
 * when a participle agrees with the subject; none for an impersonal il). Each outcome becomes the form's target.gender
 * and the target that agreements and assemble see; its steps are form-level steps. Absent: the target's own gender.
 */
subjectGenders?(context: ClauseContext<X>): Fork<Gender | null>;
```

  In `build` (`src/core/staged.ts`): `chain(opening, () => clause.subjectGenders?.(context) ?? one(target.gender))`, then per gender a context with `target: { ...target, gender }` for `agreements` and `assemble`; an empty fork counts against a new `FormStage` `'subjectGenders'`. Toy: `ila`'s feminine already comes from the slot; the toy gains `subjectGenders` returning `[masculine, feminine]` for the 1sg slot `mi` only when the auxiliary is `esta`, so `mi esto apvenado` / `mi esto apvenada` are two targets with genders.
- French slots (GD §2): `frenchSubjects` = `1sg je`, `2sg tu`, `3sg il`, `1pl nous`, `2pl vous`, `3pl ils`, all default, no gender; imperative entries get `slots: ['2sg', '1pl', '2pl']`; `FrenchSpec` gains the subject union `FrenchSubject = '1sg' | '2sg' | '3sg' | '1pl' | '2pl' | '3pl'` in the form Plan 2 Task 5 gives specs (exported from `src/types.ts`). The registered `frenchPack` does **not** get the slots yet.
- `src/languages/fr/rules.ts`: `frenchRules = defineRules({...})` with all 94 ids of GD §4 and their params (stage, kind, params exactly as GD §4 tables). `sources.ts`: `frenchWorks` (académie, jo1990, academie-annexe, oqlf, cnrtl, bon-usage) and `frenchCitations satisfies Record<keyof typeof frenchRules, Citation | readonly Citation[]>`, filled in the task that implements each rule (a placeholder citation is not allowed; until a rule is implemented, its id is absent from both and added with its message in the same task).
- `src/languages/fr/grammar.ts`: `frenchGrammar: StagedGrammar<FrenchLexeme>`; stages not yet migrated throw `ConjugationError('GENERATION_FAILURE', 'fr.<stage> not migrated yet')`. `FrenchLexeme extends LexemeBase` adds `{ group: 'er' | 'ir' | 're' | null; family: FamilyEntry | null; paradigm: FamilyParadigm | ProductiveParadigm; label: string; hints: FrenchStemHints | null; indirect: boolean; aspiratedH: boolean; restriction: LexicalRestriction }`.
- `src/languages/fr/clause.ts`: the clause skeleton: `subjectGenders` (GD §6.3 rows for simple targets: impersonal [null], person 3 by `gender` option or both, else [null]), `assemble` for simple targets (GD §6.2 rows 1, 2, infinitive, participles, gerund; subject from `context.subject.pronoun`, elle/elles when `target.gender` is feminine), `agreements` for the standalone participle (GD §6.3 first row).
- `tests/fr/shadow.ts`: `shadowFrench(query)` = `characterize` (from `scripts/characterize/serialize.ts`) run through `createEngine({ ...packs, fr: { ...frenchPack, subjects: frenchSubjects, genderedTargets: true, catalogue: frenchCatalogueWithSlots, engine: q => stagedEngine(frenchGrammar, frenchPack.rendering, q) } }, catalogs)`; `sections(lines)` splits a block into `analysis` (the A line), `error` (the E line) and one section per `mood/tense` holding that tense's F lines then its U lines, in block order.
- `tests/fr/shadow-pending.txt`: one line per pending section, `<query header>\t<section>` (section = `analysis`, `error` or `mood/tense`), in query order. `tests/fr/shadow.test.ts`: for every snapshot query, every section not listed must equal the frozen one; a query with no pending section must equal its frozen block line for line (this checks order across tenses and the U-line position); `pending.length ≤ PINNED`; a listed section that now matches fails the test with "remove it from shadow-pending.txt". `FR_SHADOW_UPDATE=1 npx vitest run tests/fr/shadow.test.ts` rewrites the file with the listed sections that still differ and never adds one. Task 2 starts with all 25,134 sections listed (24,131 tense sections, 995 analysis, 8 error; GD §9.2).

- [ ] **Step 1: Failing tests:** `tests/core/staged.test.ts` — the toy 1sg with `esta` yields two targets differing only in `gender` (`masculine` / `feminine`) and agreement, the hook's step is on each form, and a toy copy without the hook produces exactly today's forms; `tests/fr/shadow.test.ts` exists with `PINNED = 25_134` and the full pending file; a unit test in `tests/fr/clause.test.ts`: `subjectGenders` gives `[masculine, feminine]` for 3sg, `[null]` for 1sg in the present, `[null]` for falloir's 3sg, `[feminine]` with `gender: 'feminine'`.
- [ ] **Step 2:** run — FAIL.
- [ ] **Step 3:** implement the hook, the toy change, slots, spec, rules table, sources, clause skeleton, grammar shell and the harness.
- [ ] **Step 4:** gate (Dutch and French snapshots unchanged; toy, i18n completeness and Dutch tests green).
- [ ] **Step 5:** commit `feat(conjugation-engine): French subject slots, subject-gender hook and shadow harness`.

### Task 3: Classification, productive classes and spelling rules

**Files:**
- Create: `src/languages/fr/classify.ts`, `src/languages/fr/paradigms.ts`, `src/languages/fr/orthography.ts`, `src/languages/fr/stems.ts` (productive part), `src/i18n/locales/en/fr.ts`, `src/i18n/locales/nl/fr.ts`, `tests/fr/classify.test.ts`, `tests/fr/productive.test.ts`
- Modify: `src/languages/fr/grammar.ts`, `rules.ts`, `sources.ts`, `src/i18n/locales/{en,nl}/index.ts`, `tests/fr/shadow-pending.txt`, `tests/fr/shadow.test.ts` (PINNED)

**Interfaces:**
- `classify.ts`: `classifyFrench(query): Fork<FrenchLexeme>` implementing GD §3 steps 1–8 with the same error codes and messages as `resolveFrench`; `familyFor(lemma)` (listed lemma, longest suffix, `except`, `exceptEndings`) over `frenchFamilies`; `labelOf(lemma)` (GD §3.2); `isListedLemma(lemma)` (replaces `isListedFrenchLemma`). `lexemeOf(lemma)` for être/avoir/aller/venir.
- `paradigms.ts`: the ER/IR/RE sets (re-exported from `ending-sets.ts`), the formation ending sets of GD §4.3, the -eler/-eter lists DOUBLE/FORK/GRAVE (data as GD §4.4 rule 1).
- `orthography.ts`: `frenchOrthography: readonly JunctureRule<{ lexeme: FrenchLexeme; cell: Cell }>[]` = GD §4.4 rules 1–9 and 12 (for the er group) in that order, with the exact triggers given there; rules 10, 11, 13–15 are added in Task 4.
- Rules implemented here (messages en + nl, citations): all `fr.classify.*`, `fr.stem.group-stem`, `fr.stem.hint`, all `fr.end.*`, `fr.orth.eler-eter`, `mute-e-grave`, `closed-e-grave`, `c-cedilla`, `g-e`, `y-to-i`, `diaeresis`, `t-after-dental`, `tt-singular`, `1990-circumflex`.

- [ ] **Step 1: Failing tests:**

```ts
// tests/fr/classify.test.ts
it.each([['parler', 'aimer', 'regularRule'], ['placer', 'placer', 'regularRule'], ['lever', 'lever', 'regularRule'],
  ['appeler', 'appeler', 'lexicon'], ['finir', 'finir', 'regularRule'], ['rendre', 'rendre', 'regularRule'],
  ['venir', 'venir', 'lexicon'], ['conduire', 'cuire', 'lexicon'], ['bleder', 'lever', 'regularRule']])(
  'labels %s as %s (%s)', /* analysis.classification and classificationSource through the shadow engine */);
it('reproduces the legacy assumption sentences', () => {
  /* blouper: ['blouper uses the regular er model; lexical meaning and nonproductive classes cannot be inferred from spelling.',
     'An unlisted non-reflexive verb defaults to avoir.']; conduire: ['conduire is inflected like cuire from its -uire ending.'];
     s'asseoir: ['The reflexive pronoun is assumed direct; specify indirect-object context when needed.'] */
});
it('maps 1990 infinitives to the traditional lemma', () => { /* assoir → verbId asseoir; interpeler → interpeller; connaitre and connaître give identical shadow blocks */ });
it('keeps the legacy hint errors', () => { /* ressortir + model aimer → INVALID_HINT; + model finir + classHint re → INVALID_HINT; glouloir → AMBIGUOUS_CLASSIFICATION; dormir + precedingDirectObject → INVALID_HINT */ });
it('returns payer as two paradigms in order', () => { /* patterns ['y-to-i', 'keep-y']; analysis.alternatives has length 1 */ });

// tests/fr/productive.test.ts — words through synthesize(frenchGrammar, lexeme, cell), with rule ids in order
it('nous plaçons: group-stem, present-plural, c-cedilla', …);
it('je lève / je lèverai: mute-e-grave in both spellings', …);
it('je cède; je cèderai (rectified) and je céderai (traditional): closed-e-grave fork', …);
it('il renouvelle (traditional) / il renouvèle (rectified); j\'appelle in both; je rachète; je cachette / je cachète', …);
it('je paie (y-to-i paradigm) / je paye (keep-y); je nettoie; je grasseye', …);
it('nous mangeons; je blouïs, il blouït (passé simple); il rend; il rompt; je blets, il blet', …);
it('je traine (rectified) / je traîne (traditional); j\'interviewe, je speede, j\'annexe unchanged', …);
it('reproduces every productive model table for every productive snapshot lemma', () => {
  /* for the 158 snapshot lemmas whose legacy model is productive (and the 19 model ids): every cell, both spellings, equals
     legacy cellTexts, except bleder, crebler, pequer (21 cells each) and blettre (4 cells) — GD §4.4 [M] */
});
it('passes hinted stems through spelling rules', () => { /* blouper + stems {plural: 'blac'} → nous blaçons; + {future: 'bloupr'} → je blouprai */ });
```

- [ ] **Step 2:** run — FAIL.
- [ ] **Step 3:** implement classification and the productive pipeline (`stem`, `ending`, `orthography` for productive lexemes; the `ending` hook tags passé simple and subjunctive imperfect words `usage: 'literary'`, GD §4.5); messages and citations for every rule implemented; spread `fr` in both locale indexes.
- [ ] **Step 4:** `FR_SHADOW_UPDATE=1 npx vitest run tests/fr/shadow.test.ts`; then the analysis and error sections of all queries and the simple-tense sections (indicative present/imperfect/simple_past/future, subjunctive present/imperfect, conditional present, imperative present, infinitive present, participle present/past, gerund present) of productive non-reflexive verbs must be gone from the pending file except those of bleder, crebler, pequer, blettre (GD §9.3); lower `PINNED` to the new count; gate (`tests/i18n/completeness.test.ts` now covers `fr`).
- [ ] **Step 5:** commit `feat(conjugation-engine): French classification, productive classes and spelling rules as recorded rules`.

### Task 4: Families from principal parts; formation rules

**Files:**
- Modify: `src/languages/fr/stems.ts`, `orthography.ts`, `grammar.ts`, `rules.ts`, `sources.ts`, `families.ts` (`verified` flags), `src/i18n/locales/{en,nl}/fr.ts`, `tests/fr/shadow-pending.txt`, `tests/fr/shadow.test.ts`
- Create: `tests/fr/families.test.ts`

**Interfaces:**
- `stem(lexeme, cell)` for families: the part GD §4.2 names for the cell (prefix + relative part), forks for parts with several values, `fr.stem.*` steps (kind lexical); imperative 2sg from the present 2sg (s dropped after e/a), 1pl/2pl from the present; `imperativeFromSubjunctive` and `presentParticipleFromSubjunctive`; `PPF`. `cell(lexeme, cell)` returns the entry's `cells` (and the imperative cells that follow a listed present, e.g. `dites`) with `fr.stem.suppletive`, and the `spellings` with `fr.stem.listed-spelling` (tagged rectified/traditional).
- Orthography gains GD §4.4 rules 10 (`circumflex-before-t`), 11 (`croitre-homograph`), 13 (`1990-assoir`), 14 (`1990-interpeler`), 15 (`1990-absout`); rule 12 now covers family stems with its protected list (croître forms of rule 11, `dû`, `jeûne(s)`).
- Académie check: for each family open `https://www.dictionnaire-academie.fr/conjuguer/<id>` (browser tools if the fetch is refused), compare the parts, set `flags.verified = { academie: '<id>', date: '2026-…' }`; disagreements go to the report as open questions and do not change the data.

- [ ] **Step 1: Failing tests** `tests/fr/families.test.ts`:

```ts
it('derives every family table cell for cell', () => {
  /* for every legacy non-productive model paradigm, its representative lemma (first lemma, else first suffix as a word)
     and every cell and spelling: synthesize(frenchGrammar, lexeme, cell) texts equal legacy cellTexts (stem = lemma minus strip),
     cells absent in the legacy table being declared by availability (Task 5 makes that half pass; here: present cells only) */
});
it('explains ils viennent: family venir, ils-stem vienn-, ending -ent', …);
it('explains nous vînmes: past stem v-, theme in, ending -înmes, usage literary', …);
it('explains il connaît (traditional) / il connait (rectified): circumflex-before-t', …);
it('explains je m\'assoirai (rectified) / je m\'asseoirai (traditional) and je m\'assiérai: 1990-assoir, two paradigms', …);
it('explains que je sache and the imperative sache: subjunctive stem, imperative from subjunctive', …);
it('keeps dû in both spellings and writes mu (rectified) / mû (traditional) for mouvoir', …);
it('writes nous interpelons (rectified) / nous interpellons (traditional), j\'interpelle in both', …);
it('writes absout (rectified) / absous (traditional), absoute in both', …);
it('derives croître: je croîs, je crûs, crû in both spellings; croitrai (rectified)', …);
```

- [ ] **Step 2:** run — FAIL.
- [ ] **Step 3:** implement; Académie check as above.
- [ ] **Step 4:** shadow update; the analysis and simple-tense sections of every non-defective family verb (and of être/avoir/aller/faire/dire in the cells they have) must be gone; lower `PINNED`; gate.
- [ ] **Step 5:** commit `feat(conjugation-engine): French families from principal parts and formation rules`.

### Task 5: Suppletive verbs, defective verbs, availability

**Files:**
- Create: `src/languages/fr/availability.ts`, `tests/fr/defective.test.ts`
- Modify: `src/languages/fr/grammar.ts`, `rules.ts`, `sources.ts`, both message files, `tests/fr/shadow-pending.txt`, `tests/fr/shadow.test.ts`

**Interfaces:**
- `availability(lexeme, target)` per paradigm (GD §4.7): reason precedence pronominal-imperative-past > no-imperative > impersonal > defective (cells, compounds) > third-person-only; a simple target is available iff its feeding part exists and the cell is not in `gaps` (near future / recent past: iff the infinitive exists); a periphrastic target iff PP exists and `compounds` allows it (`nonFinite`: only infinitive/participle/gerund compounds). `source` = the citation URL of the rule (Académie entry of the verb where known).
- `fr.avail.*` rules with messages and citations; `restrictions` (advenir, ensuivre) from `lexicon.ts`.

- [ ] **Step 1: Failing tests** `tests/fr/defective.test.ts` (shadow engine; `U` lines exactly as the snapshot):

```ts
it('falloir: only il faut; 1sg and 3pl impersonal; no present participle (defective); no imperative', …);
it('pleuvoir: il pleut; ils pleuvent and elles pleuvent with condition figurative', …);
it('clore: il clot (rectified) / il clôt (traditional); imparfait defective in all persons; nous allons clore available', …);
it('gésir: no compound tense (defective), no subjunctive', …);
it('seoir: il sied, séant then seyant; je: defective; compounds defective', …);
it('advenir: 1sg defective, imperative noImperative; ensuivre: 3rd person only', …);
it('ester / accroire: infinitive only; férir: féru as participle, everything else defective', …);
it('reports a target once when every paradigm of choir lacks it', …);
it('se laver: imperative past is noImperative for every person', …);
```

- [ ] **Step 2:** run — FAIL.
- [ ] **Step 3:** implement.
- [ ] **Step 4:** shadow update; every simple-tense section of every verb must now be gone except the GD §9.3 ones; lower `PINNED`; gate.
- [ ] **Step 5:** commit `feat(conjugation-engine): French suppletive and defective verbs, availability as recorded rules`.

### Task 6: Auxiliaries, compound tenses, agreement, reflexives, near future, recent past, elision

**Files:**
- Create: `src/languages/fr/periphrasis.ts`, `tests/fr/clause.test.ts` (extend), `tests/fr/shadow-parts.test.ts`
- Modify: `src/languages/fr/clause.ts`, `grammar.ts`, `rules.ts`, `sources.ts`, both message files, `tests/fr/shadow-pending.txt`, `tests/fr/shadow.test.ts`

**Interfaces:**
- `frenchPeriphrases: readonly Periphrasis<FrenchLexeme>[]`: the 14 recipes of GD §4.5 in that order (conditional past: `past-first` before `past-second` with `usage: 'literary'`); near future / recent past name `{ lemma: 'aller' }` / `{ lemma: 'venir' }` and so report them.
- Clause complete (GD §6.2–6.3): `subjectGenders` and `agreements` exactly as the GD §6.3 table; `assemble` for compound, periphrastic and reflexive orders, the `figurative` and dual-auxiliary `condition` tags, `fr.clause.elision` recorded from a dry run of `frenchRendering.sandhi`; part features and onsets as GD §6.2 (`wordPart(rendering, word, { onsetFlags: { aspiratedH } })` for lexical verbs).
- `tests/fr/shadow-parts.test.ts`: for every snapshot query with `gender: 'masculine'` (the trainer's query), the legacy `conjugate` and the shadow engine give deep-equal forms once `steps`, `ruleIds` and `target.subject` are removed (parts with features, onset, joinBefore and lemma; variant; target; text; preferred), and equal `analysis` minus `steps`/`alternatives`, and equal `unavailableTargets` minus `explanation`/`source`/`step`.

- [ ] **Step 1: Failing tests** (`tests/fr/clause.test.ts`; texts and target lines as the snapshot shows them):

```ts
it('aller perfect 1sg: je suis allé (masculine/masculine.singular), je suis allée (feminine/feminine.singular)', …);
it('monter perfect: j\'ai monté, je suis monté, je suis montée; il a monté, il est monté (preferred 0), elle a monté, elle est montée — in this order, conditions from the dual auxiliary', …);
it('aimer + precedingDirectObject feminine plural: nous avons aimées', …);
it('se laver indirect: je me suis lavé (-/masculine.singular), elle s\'est lavé (feminine/masculine.singular)', …);
it('s\'asseoir: je me suis assise (assois then assieds); s\'être assis for masculine plural', …);
it('reflexive near future and recent past: je vais me laver; je viens de me laver; je vais m\'asseoir (rectified assoir first)', …);
it('conditional past: j\'aurais aimé (past-first, standard), j\'eusse aimé (past-second, literary, preferred 0); y-to-i.past-first for payer', …);
it('participle forms: monté, montés, montée, montées; dormi only (invariable); fallu; ayant aimé; en ayant aimé', …);
it('elision and aspirated h: j\'aime, qu\'il aille, je viens d\'aimer; je hais (aspirated), j\'hais with aspiratedH false', …);
it('records the steps of je suis allée: periphrasis, subject gender, agree-subject, auxiliary word, participle ending', …);
```

- [ ] **Step 2:** run — FAIL.
- [ ] **Step 3:** implement; after each sub-step run the shadow update.
- [ ] **Step 4:** the pending file now holds exactly the 40 sections of GD §9.3 (bleder, crebler, pequer × {plain, gender masculine} × {analysis, indicative/present, indicative/future, subjunctive/present, conditional/present, imperative/present}; blettre × 2 × {indicative/present, imperative/present}); set `PINNED = 40`; `tests/fr/shadow-parts.test.ts` green; gate.
- [ ] **Step 5:** commit `feat(conjugation-engine): French compound tenses, agreement and clause on the staged core`.

### Task 7: Explain every French form in English and Dutch

**Files:**
- Modify: `tests/i18n/runtime.test.ts` (add `'fr'`, using the French shadow engine until Task 8), message files and citations as needed

**Interfaces:**
- The runtime check of Plan 2 Task 9 covers French: for every French snapshot query, every form, every unavailable target and the analysis explain in `en` and `nl` without throwing, and no rendered step contains `{` or `undefined`; every word whose steps name a tense carries `features.mood` (context rule from Plan 1).

- [ ] **Step 1:** add `fr` to the language list — FAIL where messages or term resolution are missing.
- [ ] **Step 2:** run `npx vitest run tests/i18n/runtime.test.ts`.
- [ ] **Step 3:** fix messages, params or features (never by weakening the test); check by hand the English and Dutch explanation of: nous plaçons, je cèderai, il renouvèle, je paie, ils viennent, il connaît, que je sache, je suis allée, elle s'est lavé, il faut, lave-toi, je blède (GD §7 items 1–15).
- [ ] **Step 4:** gate.
- [ ] **Step 5:** commit `test(conjugation-engine): every French form explains in English and Dutch`.

### Task 8: Switch French, ledger the intended differences, delete the legacy tables

**Files:**
- Modify: `src/languages/fr/pack.ts` (staged engine, `subjects`, `genderedTargets: true`, catalogue with slots, `rules`, `works`, `citations`), `src/languages/fr/catalogue.ts`, `tests/characterization/intended-diffs.json`, `tests/characterization.test.ts` (French's intended differences are block-level entries for the affected probe-verb queries, added to the two pinned counts, `LINE_ENTRY_COUNT` and `BLOCK_ENTRY_COUNT`, as they stand when French merges), `tests/fr.test.ts`, `tests/errors.test.ts`, `tests/novel.test.ts`, `tests/fr-models.test.ts` (rewritten), `tests/cli.test.ts`, `tests/query.test.ts` if it pins `ruleIds`/`explanation`/`source` of French, `docs/grammar.md` → `docs/grammar/fr.md`, `README.md`, `package.json` (drop `characterize:queries`)
- Delete: `src/languages/fr/index.ts`, `models.ts`, `table.ts`, `principal.ts`, `scripts/fr/bootstrap-families.ts`, `scripts/characterize/build-queries.ts`, `tests/fr/bootstrap.test.ts`, `tests/fr/families.test.ts` (it reads `models.ts`; the snapshot keeps covering every model), `tests/fr/shadow.ts`, `tests/fr/shadow.test.ts`, `tests/fr/shadow-pending.txt`, `tests/fr/shadow-parts.test.ts`

**Ledger (GD §9.3; the only permitted French entries):** 156 L1 entries (bleder, crebler, pequer: `A` line `aimer` → `lever` and every changed `F` line, plain and `gender: masculine` queries), reason "Rule-first: the mute e of the last stem syllable becomes è before a mute ending whatever consonant follows; the legacy engine only knew -emer, -ener, -eper, -erer, -eser, -ever, -evrer, -ecer.", source `https://vitrinelinguistique.oqlf.gouv.qc.ca/24212`; 9 L2 entries (blettre), reason "Rule-first: -ttre verbs keep one t in the singular present and imperative (bats, mets); the legacy engine wrote bletts.", source the Académie `conjuguer` URL of mettre (opened and checked in this task). Generated by a throwaway script that diffs old and new blocks for these 8 queries only, reviewed by hand, not committed.

- [ ] **Step 1:** update the pinning tests to the new state (failing): `tests/fr-models.test.ts` rewritten against `families.ts` and `classify.ts` (selector consistency: no selector claimed twice; `familyFor` examples of today's test; labels and `model:` echo; the -er spelling class expectations; family derivative expectations — keep every current assertion that is about output); `tests/fr.test.ts` and `tests/novel.test.ts` use `conjugate` (or `getSubjects('fr')` to pass the slot when calling `generate` directly) and `isListedLemma`; `tests/errors.test.ts` spies on `frenchPack.engine` instead of `resolveFrench`; `tests/cli.test.ts`: `fr aimer --subject 1sg` now succeeds (the "language without slots" case moves to the toy or is dropped if no registered pack lacks slots), and the `--explain` expectations for French show step lines.
- [ ] **Step 2:** switch the pack; write the ledger; run `npx vitest run tests/characterization.test.ts` until French matches with exactly the block-level entries of the GD §9.3 L1 and L2 queries (`npm run characterize:accept` writes their accepted blocks).
- [ ] **Step 3:** delete the legacy files and the shadow tests; move the French section of `docs/grammar.md` to `docs/grammar/fr.md` rewritten as GD's rule inventory with citations, defaults, the reduction table summary, the listed spellings and open questions O1–O7, and the deliberate behaviour changes of GD §9.3; README French line.
- [ ] **Step 4:** gate: `npm run typecheck && npm test` at the root; `npm run corpus:check` (French 26,196 cells pass with the staged pack); `npm run build && npm test -w verbodrome`.
- [ ] **Step 5:** CLI spot checks recorded in the report: `npm run cli -- fr bleder --mood indicative --tense present --person 1 --number singular --explain --locale nl`; `fr céder --mood indicative --tense future --person 1 --number singular --explain`; `fr "se laver" --mood indicative --tense perfect --person 3 --number singular --gender feminine --explain --locale nl`; `fr falloir --mood indicative --tense present --person 1 --number singular --explain` (unavailable, impersonal).
- [ ] **Step 6:** commit `feat(conjugation-engine): French runs on the staged core and explains itself`.
