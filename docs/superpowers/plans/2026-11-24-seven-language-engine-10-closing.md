# Seven-Language Engine — Closing Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Finish the seven-language branch: the trainer accepts feminine answers, the package exposes its subpaths and builds cleanly, shared helpers are used where two packs do the same thing, the documentation describes what exists, and the whole branch gets one final review.

**Architecture:** No new architecture. One functional app change (`apps/verbodrome/src/trainer/forms.ts`), packaging and build hygiene in `packages/conjugation-engine`, a measured consolidation of duplicated pack logic into `src/languages/shared/`, and documentation. Everything is guarded by the existing gates and the fr/nl characterization snapshots.

**Tech Stack:** Node 26, TypeScript 7 strict, Vitest 5, npm workspaces. The engine keeps zero runtime dependencies.

**Spec:** `docs/superpowers/specs/2026-11-24-seven-language-engine-design.md` (sections "Trainer: accept feminine answers", "Public API", "Shared helpers", commit 13 of the commit sequence).

**Precondition:** plans 01–09 and plan 04 (equivalence, parts A and B) are merged on `feat/seven-language-engine`.

## Global Constraints

- Work on `feat/seven-language-engine` only. No push, no pull request.
- The six consuming app files compile unchanged except `apps/verbodrome/src/trainer/forms.ts`: `src/trainer/{prompt,distractors,question}.ts`, `src/config/{tenses,verbs}.ts`.
- French and Dutch output stays identical to `tests/characterization/{fr,nl}.tsv.gz` apart from the existing ledger; the pinned counts (133 line / 311 block / 1 sentence) do not change in this plan.
- No fixture, golden, corrections ledger or manifest changes in this plan. `npm run corpus:check -w conjugation-engine` prints the same per-language lines before and after.
- The engine keeps zero runtime dependencies.
- Gates after every task, from the repository root: `npm run typecheck`, `npm test -w conjugation-engine`, `npm test -w verbodrome`, `npm run corpus:check -w conjugation-engine`, `npm run build`.
- Explanations exist in `en` and `nl`; any new message key is added to both catalogs.
- Documentation states only what the code does today; every count in a document is produced by a command named next to it or checked by `tests/docs.test.ts`.

## Review Focus

1. A typed feminine answer for a subject the Dutch prompt fixes as masculine (`il est allée` for "hij") — must stay wrong.
2. A feminine participle with avoir (`j'ai mangée`) — must stay wrong; agreement with avoir is never accepted.
3. A feminine form appearing as a wrong-answer card for a question whose correct answer is its masculine twin — must never be offered as a distractor.
4. A consumer importing a subpath (`conjugation-engine/languages/de`) from the built package, not from source — the export map must resolve after a clean build, and `npm pack --dry-run` must list no file whose source was deleted.
5. A helper moved into `src/languages/shared/` that changes the order of forms or steps for one pack — the characterization snapshot and each language's corpus line must be unchanged.

---

### Task 1: Trainer accepts feminine answers

**Files:**
- Modify: `apps/verbodrome/src/trainer/forms.ts`
- Test: `apps/verbodrome/tests/typed.test.ts`, `apps/verbodrome/tests/forms.test.ts` (create if absent)

**Interfaces:**
- Consumes: `conjugate({ language: 'fr', infinitive })` without `gender` returns every gender; each form carries `target.gender` (`'masculine' | 'feminine' | null`).
- Produces: `FrForm` unchanged in shape. `FrForm.text`, `FrForm.subject`, `FrForm.form` are the masculine preferred form as today. `FrForm.accepted` additionally holds the feminine forms of the same tense and slot for slots `1s`, `2s`, `1p`, `2p`, `3p` — never for `3s`, never for non-finite forms.

- [ ] **Step 1: Write the failing tests** in `apps/verbodrome/tests/typed.test.ts`, using the file's existing helper for checking a typed answer against a question (read the file first and follow its style):

  | verb, tense, slot | typed | expected |
  |---|---|---|
  | aller, passé composé, 1s | `je suis allée` | accepted |
  | aller, passé composé, 1p | `nous sommes allées` | accepted |
  | se méfier, passé composé, 1s | `je me suis méfiée` | accepted |
  | aller, passé composé, 3p | `elles sont allées` | accepted |
  | aller, passé composé, 3s | `il est allée` | rejected |
  | aller, passé composé, 3s | `elle est allée` | rejected (the prompt says "hij") |
  | manger, passé composé, 1s | `j'ai mangée` | rejected |
  | aller, passé composé, 1s | `je suis allé` | accepted (unchanged) |

  And in a forms test: `formAt(verbForms('aller'), <passé composé id>, '1s')` has `text === 'je suis allé'`, `accepted` contains both `je suis allé` and `je suis allée`; for `3s`, `accepted` equals `['il est allé']`; for `parler` present `1s`, `accepted` equals `['je parle']` (no duplicates from the two genders); `verbForms('aller').all.length` equals the count before the change (record it in the test as a literal after measuring on the unchanged code).

- [ ] **Step 2: Run** `npm test -w verbodrome` — the new accept cases fail, the reject cases pass.

- [ ] **Step 3: Implement in `verbForms()`.** Query without `gender`. Group by tense and slot as today, but keep two lists per key: masculine-or-ungendered forms (`target.gender !== 'feminine'`) and feminine forms. `text`, `subject`, `form` and the base of `accepted` come from the first list exactly as today. For slots `1s`, `2s`, `1p`, `2p`, `3p`, append `display()` of the feminine forms to `accepted`, deduplicated. Update the doc comment ("Subjects are masculine on cards; feminine answers are accepted where the prompt leaves gender open").

- [ ] **Step 4: Distractor check.** Add a test in the distractor test file: for `aller` passé composé `1s`, across 50 seeded draws no wrong-answer card has the text `je suis allée`. (`distractors.ts:126` filters on `accepted`; the test pins it.)

- [ ] **Step 5: Run** all gates. `apps/verbodrome` builds; the five other consuming files are untouched (`git diff --stat` shows only `forms.ts` under `src/`).

- [ ] **Step 6: Commit** `feat(verbodrome): accept feminine answers where the prompt leaves gender open`.

### Task 2: Package exports and a clean build

**Files:**
- Modify: `packages/conjugation-engine/package.json`, `packages/conjugation-engine/tests/package.test.ts`
- Create (only where missing): `src/languages/<lang>/index.ts` public entry per language, `src/i18n/locales/<locale>/index.ts`, `src/equivalence/index.ts` (exists after plan 04)

**Interfaces:**
- Produces the export map:
  - `.` and `./core` (unchanged)
  - `./languages/fr|nl|de|en|es|it|la` → `dist/languages/<lang>/index.js`, each exporting its `LanguagePack` as a named export (`frenchPack`, … — keep the existing names) and its catalogue types
  - `./locales/en|nl` → `dist/i18n/locales/<locale>/index.js`
  - `./equivalence` → `dist/equivalence/index.js`
- `scripts.build` becomes `node -e "require('node:fs').rmSync('dist',{recursive:true,force:true})" && tsc -p tsconfig.build.json` (no new dependency).
- `description`: `Rule-based conjugation for French, Dutch, German, English, Spanish, Italian and Latin, with step-by-step explanations`.

- [ ] **Step 1: Failing test** in `tests/package.test.ts`: for every key of the export map, `import(<package name>/<subpath>)` through the workspace link resolves and exposes the documented named export; `createEngine({ packs: [the de pack], locales: [the en locale] })` built only from subpath imports conjugates `machen`; after `npm run build`, every `.js` file under `dist/` has a matching `.ts` source under `src/` (walk both trees).
- [ ] **Step 2: Run** — fails on the missing subpaths (and on stale `dist` files if any exist).
- [ ] **Step 3: Implement** the export map, the clean step and the description.
- [ ] **Step 4: Run** all gates, then `npm pack --dry-run -w conjugation-engine` and check the file list contains no path without a source.
- [ ] **Step 5: Commit** `build(conjugation-engine): subpath exports per language, locale and equivalence; clean dist before building`.

### Task 3: Shared helpers where two packs do the same thing

The spec lists Germanic helpers shared by de/nl/en and Romance helpers shared by fr/es/it. Today `src/languages/shared/` holds only `germanic.ts`, used by German. This task consolidates what is literally the same mechanism and leaves alone what only looks alike (the spec's "kept separate" lists are binding).

**Files:**
- Modify: `src/languages/shared/germanic.ts`, `src/languages/nl/*` (derivative resolution, particle placement, dual paradigms)
- Create: `src/languages/shared/romance.ts` only if step 1 finds a mechanism implemented twice
- Test: `tests/shared/*.test.ts`

- [ ] **Step 1: Measure before moving.** Write `.superpowers/sdd/closing/shared-audit.md` (scratch, not committed): for each candidate — derivative resolver (particles + bound prefix + lexicon root), separable-particle placement, the `ge-` circumfix skeleton, dual-paradigm fork (de/nl); family resolver (longest suffix, closed prefixes, exception lists), sound-preserving consonant alternation, BE/HAVE auxiliary policy with participle agreement, clitic placement (fr/es/it) — name the functions in each pack, state whether the logic is the same mechanism with different data, and decide move / leave with one line of reason. A candidate is moved only when two packs contain the same algorithm; a helper with one caller is not created.
- [ ] **Step 2: Dutch onto `shared/germanic.ts`.** Dutch uses `splitDerivative`, `placeParticle` and `paradigmFork` with its own `ParticleTables`, including outside-in resolution of nested prefixes. The Dutch characterization snapshot and corpus line stay exact; if a Dutch result would change, stop moving that function and record why in the audit file.
- [ ] **Step 3: Romance consolidation** for each candidate the audit marked "move": extract to `shared/romance.ts` with the per-language table as a parameter; each pack's rule keeps its own rule id, citation and messages (rules stay in the pack; only the mechanism moves).
- [ ] **Step 4: Unit tests** for every shared function with a two-language table each.
- [ ] **Step 5: Shared corpus guard.** `requireTaggedExtras` in `scripts/corpus` / `tests/corpus.test.ts` accepts an optional per-language predicate `acceptsUntagged(form): boolean`; German's private guard and its pinned list of 30 untagged preferred forms move onto it. The pinned count stays 30.
- [ ] **Step 6: Run** all gates; `corpus:check` lines identical to before the task (diff the captured output).
- [ ] **Step 7: Commit** `refactor(conjugation-engine): shared Germanic and Romance mechanisms, one corpus guard`.

### Task 4: Documentation

**Files:**
- Create: `packages/conjugation-engine/docs/architecture.md`
- Delete: `packages/conjugation-engine/docs/PLAN.md`
- Modify: `packages/conjugation-engine/README.md`, `README.md`, `packages/conjugation-engine/docs/api.md`, `packages/conjugation-engine/docs/grammar.md`, `packages/conjugation-engine/tests/docs.test.ts`

- [ ] **Step 1: Extend `tests/docs.test.ts` first** so stale numbers fail: the README language table (rules, lexicon entries, corpus files and cells, corrections per language) is compared with values computed from the packs and `tests/fixtures/manifest.json`; `docs/grammar.md` links one existing `docs/grammar/<lang>.md` per registered language; `docs/api.md` names every export of `src/index.ts` and every subpath of the export map; no document mentions `PLAN.md`.
- [ ] **Step 2: `docs/architecture.md`** (replaces `PLAN.md`): the stages (classify → lexeme → availability → stem → ending → orthography → periphrasis → clause → rank) with one worked example traced through them; the pack contract and where data ends and code begins; derivation steps and `explain`; i18n catalogs and the completeness gates; subject slots and gender; variants, region and usage; the corpus tooling (fallible oracles, corrections ledgers, remaps, unmodelled cells, authority cells, the Wiktionary second oracle); the characterization net; tense equivalence; how to add a language (pointer to `pack-authoring.md`). Diagrams as plain text.
- [ ] **Step 3: README (package):** what it is, the seven languages with the computed table, install and a ten-line usage example covering `conjugate`, `explain` in `nl`, an invented verb with its assumptions, `equivalentTenses('fr', 'nl', …)`, `normalizeForComparison('la', …)`; a "Known limits" section listing per language the parked items from the ledger (one line each, no internal ids); sources and licences (Wiktionary CC BY-SA attribution, each language's authorities). Root `README.md`: one paragraph and the link.
- [ ] **Step 4: `docs/api.md` and `docs/grammar.md`** brought in line with the exports and the seven grammar references.
- [ ] **Step 5: Run** all gates.
- [ ] **Step 6: Commit** `docs: architecture, README and API reference for the seven-language engine`.

### Task 5: Final whole-branch review, one fix wave, finish

- [ ] **Step 1: Review package** over `git merge-base main HEAD`..`HEAD`, excluding fixtures, goldens, `.gz`, `docs/superpowers` and the characterization snapshots; handed to one reviewer on the most capable model, with pointers to both ledgers' parked lines.
- [ ] **Step 2: The reviewer checks in particular:**
  - consistency across the seven packs (file layout, naming, rule ids, how lexical facts versus rules are recorded, how assumptions are recorded for invented verbs);
  - every hunk under `src/core` since the foundation plan, and whether any pack works around the core instead of through it (the French `rank` tiebreak and the build order behind it; the rule-14 exception in `docs/pack-authoring.md` and each use of it);
  - gender modelling: French `subjectGenders` versus Italian gendered slots — whether a consumer can treat them alike;
  - Italian lexicon entries marked "read" but not pinned against their dictionary header; Spanish and English entries verified against secondary sources only;
  - the trainer change against the Review Focus list;
  - licence and attribution text for every third-party source; no personal or project-identifying data in any fetch script.
- [ ] **Step 3: One fix wave** by one implementer with the complete findings list; one scoped re-review of the fix range; residual findings are ruled on in the ledger.
- [ ] **Step 4: Finish.** Collect every `Ruling:` line of both ledgers into the final message with its cost if wrong; list the open decisions for the user (below); use superpowers:finishing-a-development-branch. Nothing is pushed and no pull request is opened without the user saying so.

## Open decisions carried to the user (not tasks)

1. woordenlijst.org licence for the three script-compiled Dutch tables — blocks any push.
2. Commit-trailer rewrite before a push.
3. French: `sursoirai`; pronominal past imperative; `absoudre` / `gésir` / `paître` gaps; `méfaire`.
4. Spanish lexicon unverified against the RAE; English verified against LDOCE and AHD only.
5. Dutch: keep separability inference; lexicon corrections beyond the approved ones; equivalence note texts need a Dutch reader.
6. German: generic "unknown first element + known root → return both"; a `colloquial` usage value in core (`lad`).
7. Italian and French model subject gender differently.
8. Latin: archaic forms not generated; authority cells cover 13 of ~22 planned files with a single transcriber.
9. Credentials in the VerbodromeX source tree to rotate.
