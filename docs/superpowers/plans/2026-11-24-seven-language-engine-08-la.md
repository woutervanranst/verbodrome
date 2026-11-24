# Seven-Language Engine — Plan 8: Latin Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** A Latin (`la`) language pack on the staged core that conjugates real and invented verbs in both voices with macrons, explains every form in English and Dutch with a citation per rule, and passes the scraped corpus at two levels (form and vowel length), the authority cells transcribed from Allen & Greenough and Bennett, and 63 pinned en.wiktionary tables.

**Architecture:** A `StagedGrammar<LatinLexeme>` assembled from small modules in `src/languages/la/` (lexicon with families and side lists, compound resolver, classification, three-stem formation, ending tables, quantity rules, declension helper, compound-tense chains, clause), mirroring Plan 2 Part B's Dutch layout. Voice is a target dimension; deponents are active targets built from passive morphology; a perfect system that is a compound for some verbs and one word for others is chosen per lexeme by `cellOf(target, lexeme)` returning `null` plus `Periphrasis.applies`. Subject slots have no pronoun; compound forms come in three genders through the clause's agreement fork; non-finite forms decline in full only when the query carries `agreement`.

**Tech Stack:** TypeScript 7 strict, Node 26, Vitest 5, npm workspaces, cheerio (dev only, corpus scripts). No new dependencies.

**Spec:** `docs/superpowers/specs/2026-11-24-seven-language-engine-design.md` (section "Latin (la)") and the grammar design `docs/superpowers/research/2026-11-24-la-grammar-design.md` (cited below as **GD §n**; it holds every rule table, ending set, list, expected form and oracle error — this plan does not repeat them).

**Builds on:** Plan 2 Part A (subject slots, `classify` → `Fork`, `cellOf(target, lexeme)`, `Periphrasis<X>.applies`, `ClauseContext.subject` / `agreeing`, part features `voice` / `case`, reason `noPassive`, the `agreement` field with `cases`) and Part B (Dutch layout, `tests/i18n/runtime.test.ts`, the widened corpus model). Read `src/core/*.ts`, `tests/toy/pack.ts` (its deponent past is the worked example of `cellOf` + `applies`), `src/languages/nl/*`, `scripts/corpus/*` and `packages/conjugation-engine/docs/pack-authoring.md` before Task 1.

## Global Constraints

- All paths are relative to `packages/conjugation-engine/` unless they start with `docs/` or are the repository root `README.md`.
- Branch `feat/seven-language-engine` (or the Latin worktree branched from it); one commit per task; every commit keeps `npm run typecheck && npm test` green at the workspace root and `npm run corpus:check` passing.
- The pack touches only its own files: `src/languages/la/**`, `src/i18n/locales/{en,nl}/la.ts`, `scripts/corpus/parsers/la.ts`, `scripts/corpus/languages/la.ts`, `scripts/corpus/corrections/la.ts`, `scripts/corpus/sources/wiktionary-la.ts`, `scripts/corpus/corrections/wiktionary-la.ts`, `tests/la/**`, `tests/goldens/la/**`, `tests/fixtures/la.json`, `tests/fixtures/wiktionary-la.json`, `docs/grammar/la.md`.
- Shared files get one-line registrations only, exactly these: `src/languages/registry.ts` (import + `la: LatinSpec;`), `src/languages/index.ts` (import + `la: latinPack`), `src/i18n/locales/en/index.ts` and `nl/index.ts` (import + `...la`), `src/types.ts` (one `export type { … } from './languages/la/spec.js';` line), `scripts/corpus/languages/index.ts` (add `latin`), `tests/corpus.test.ts` (one `pinned.la` line), `tests/i18n/runtime.test.ts` (add `'la'`), `README.md` (one language-list line), `src/equivalence/index.ts` (one line, only if the equivalence module exists). Regenerated, not hand-edited: `tests/fixtures/manifest.json`, `tests/fixtures/corrections.json` (via `--only la`). One conditional shared change, only if absent when Task 1 starts: `normalizeForComparison` (GD §6.6) in `src/core/pack.ts`, `src/core/engine.ts`, `src/index.ts` — if another pack has added it, use it.
- French and Dutch output must not change: `tests/characterization.test.ts`, the fr/nl halves of `tests/corpus.test.ts` and `tests/fixtures/{fr,nl}.json` stay byte-identical.
- Zero runtime dependencies; nothing under `src/` imports `node:*` (except `src/cli.ts`), `scripts/` or `tests/`.
- Every rule has an `en` and an `nl` message and a citation; `tests/i18n/completeness.test.ts` passes for `la`. Rule ids are `la.<stage>.<name>`, exactly the 86 ids of GD §4, introduced by the task that first records them. The `en` text is the one in GD §4; the implementer writes `nl` with the Dutch school-grammar terms listed at the top of GD §4. A param is never named `before`/`after`; assumption rules take no `tense` term; an apostrophe directly before `{` is doubled.
- Rules are cited to Allen & Greenough (DCC edition, `https://dcc.dickinson.edu/grammar/latin/<slug>`, or the 1903 page scan `https://dcc.dickinson.edu/sites/default/files/AGnnn.jpg`), to Bennett (`https://www.gutenberg.org/files/15665/15665-h/15665-h.htm#sectNNN`) or to Lewis & Short (`https://logeion.uchicago.edu/<lemma>`) — never to the scraped corpus site and never to Wiktionary.
- Lexicon entries are verified against the A&G print (§§191–192, 209–212 scans) or Lewis & Short via Logeion, never copied from the scraped corpus or Wiktionary; `sources.ts` records `lexiconVerification[lemma] = { url, status: 'ag-print' | 'ls' | 'secondary' }`, and an entry checked only against a secondary source is `secondary`.
- Output carries macrons in NFC (ā ē ī ō ū); input with or without macrons is accepted; the engine never adds a macron to a stem vowel it does not know (GD §3.3).
- No expected form in any test is generated by the engine. Corpus and Wiktionary fixtures are imported from their sources; authority cells are transcribed from the page; invented-verb expectations come from GD §8.1.
- Wiktionary fetches: sequential, ≥ 20 s apart, `maxlag=5`, honour `Retry-After`, generic `User-Agent` without personal or project data; raw responses cached outside the repository.

## Review Focus

1. **Input without macrons.** `monere` must find *moneō* (second conjugation, no assumption); unknown `tregere` must be third conjugation with `la.classify.assume-third` and output *tregō, trexī* without inventing a long vowel; `tregere` with `stems: { present: 'tregeō' }` must be second (*tregēs*). → Task 2 and Task 7 tests.
2. **A verb with two paradigms.** Macron-less `parere` returns *pāreō* and *pariō* (two paradigms, `variant.pattern` *pāreō* / *pariō*, `analysis.alternatives` of length 1); `pārēre` or `stems.present: 'pariō'` returns one; `occidere` returns *occīdō* and *occidō*. → Task 2 test.
3. **A passive infinitive typed as the lemma.** `amārī` is `INVALID_INFINITIVE` pointing to `voice: 'passive'`, while `hortārī` is a deponent whose passive targets report `noPassive` and whose perfect is *hortātus sum*. → Task 2 and Task 4 tests.
4. **An invented verb that looks irregular.** `dūcāre` has imperative *dūcā*, never *dūc*; `recapere` is not a compound of *capiō* (no *-cipiō*); `trānsesse` is not a compound of *sum*; `conficere` is *cōnficere* with imperative *cōnfice*. → Task 2 and Task 7 tests.
5. **A form with two accepted spellings or quantities.** The perfect subjunctive is *amāverīs* (standard) while A&G prints *amāveris*: answer comparison through `normalizeForComparison('la', …)` treats them alike; literary *amāre* beside *amāris* and *amāvēre* beside *amāvērunt* carry `usage: 'literary'`. → Task 1 and Task 3 tests.

---

### Task 1: Pack skeleton

**Files:**
- Create: `src/languages/la/spec.ts`, `catalogue.ts`, `options.ts`, `rendering.ts`, `key.ts`, `rules.ts`, `sources.ts`, `grammar.ts`, `pack.ts`; `src/i18n/locales/en/la.ts`, `src/i18n/locales/nl/la.ts`
- Modify (one line each): `src/languages/registry.ts`, `src/languages/index.ts`, `src/i18n/locales/en/index.ts`, `src/i18n/locales/nl/index.ts`, `src/types.ts`; conditionally `src/core/pack.ts`, `src/core/engine.ts`, `src/index.ts` (comparison key, see Interfaces)
- Test: `tests/la/pack.test.ts`

**Interfaces:**
- Produces (`spec.ts`): `LatinTenses` (GD §2.1), `LatinClassHint = 'first' | 'second' | 'third' | 'thirdIo' | 'fourth'`, `LatinGender = 'masculine' | 'feminine' | 'neuter'`, `LatinStemHints = { present?: string; perfect?: string; supine?: string; semiDeponent?: boolean }`, `LatinSpec extends LanguageSpec` with `nonFinite: 'infinitive' | 'participle' | 'gerund' | 'supine'`, `auxiliary: never`, `classHint: LatinClassHint`, `stems: LatinStemHints`, `context: { readonly voice?: Voice; readonly gender?: LatinGender; readonly agreement?: Partial<Agreement> }`.
- Produces: `latinCatalogue` (21 entries, GD §2.1 order and labels, voices `['active', 'passive']` on entries 1–15); `latinSubjects` (24 slots, GD §2.2 order: for each person/number the ungendered default slot, then `.m`, `.f`, `.n`, all `pronoun: null`); `latinOptions` (GD §2.3 fields in that order, `check` as GD §2.3; add `auxiliary: { kind: 'enum', values: [] }` only if the typed schema requires the key); `latinRendering` (GD §6.5).
- Produces (`key.ts`): `latinKey(text: string): string` (GD §3.2 step 1). If `normalizeForComparison` is not yet a root export: add `PackRendering.compareKey?(text: string): string` (default NFC, lowercase, trimmed, single spaces) in `src/core/pack.ts`, `Engine.normalizeForComparison(language, text)` in `src/core/engine.ts`, and the root export `normalizeForComparison(language: Language, text: string): string` in `src/index.ts`; `latinRendering.compareKey = latinKey`. If it exists, only set `compareKey` (or the hook it uses).
- Produces: `latinRules = defineRules({})` (filled task by task), `latinWorks` with ids `ag`, `ag-print`, `bennett`, `ls` (GD §1.1; `url` https), `latinCitations satisfies Record<keyof typeof latinRules, Citation | readonly Citation[]>`, `lexiconVerification` (empty), message objects `la` in both locale files `satisfies Record<keyof typeof latinRules, string>`.
- Produces (`pack.ts`): `latinPack: LanguagePack<'la'>` with `label: 'Latin'`, `subjects: latinSubjects`, `subjectsFor(query)` (`subject` → that slot; else `gender` → the six slots of that gender; else the six default slots), `genderedTargets: true`, `acceptsForm` (GD §6.3; a stub returning true until Task 4), `rank: form => variantRank(form.variant, 'rectified')`, `engine: query => stagedEngine(latinGrammar, latinRendering, query)`, `rules`, `works`, `citations`.
- Produces (`grammar.ts`): `latinGrammar: StagedGrammar<LatinLexeme>` whose hooks throw `GENERATION_FAILURE` "Latin <hook> is not built yet" until Tasks 2–4; `LatinLexeme` is a placeholder `interface LatinLexeme extends LexemeBase {}` in `lexicon.ts` until Task 2.

- [ ] **Step 1: Write the failing test** `tests/la/pack.test.ts`:

```ts
it('registers Latin', () => { expect(languages).toContain('la'); });
it('has the 21 catalogue entries in order', () => {
  expect(getCatalogue('la').map(e => `${e.mood}.${e.tense}`)).toEqual([
    'indicative.present', 'indicative.imperfect', 'indicative.future', 'indicative.perfect', 'indicative.pluperfect',
    'indicative.future_perfect', 'subjunctive.present', 'subjunctive.imperfect', 'subjunctive.perfect', 'subjunctive.pluperfect',
    'imperative.present', 'imperative.future', 'infinitive.present', 'infinitive.perfect', 'infinitive.future',
    'participle.present', 'participle.perfect', 'participle.future', 'participle.gerundive', 'gerund.present', 'supine.present']);
  expect(getCatalogue('la')[5]).toMatchObject({ moodLabel: 'Indicativus', tenseLabel: 'Futurum exactum', voices: ['active', 'passive'] });
  expect(getCatalogue('la')[18]!.voices).toBeUndefined();
});
it('declares 24 pronoun-less subject slots', () => {
  const slots = getSubjects('la');
  expect(slots.slice(0, 4).map(s => [s.id, s.gender ?? null, s.default])).toEqual([
    ['1sg', null, true], ['1sg.m', 'masculine', false], ['1sg.f', 'feminine', false], ['1sg.n', 'neuter', false]]);
  expect(slots).toHaveLength(24);
  expect(slots.every(s => s.pronoun === null)).toBe(true);
});
it('expands targets', () => {
  expect(expandTargets({ language: 'la', infinitive: 'amāre' })).toHaveLength(144);
  const feminine = expandTargets({ language: 'la', infinitive: 'amāre', gender: 'feminine', mood: 'indicative', tense: 'perfect', voice: 'passive' });
  expect(feminine.map(t => [t.subject, t.gender])).toEqual([
    ['1sg.f', 'feminine'], ['2sg.f', 'feminine'], ['3sg.f', 'feminine'], ['1pl.f', 'feminine'], ['2pl.f', 'feminine'], ['3pl.f', 'feminine']]);
});
it('validates options', () => {
  expect(() => parseConjugationOptions({ language: 'la', infinitive: 'amāre', agreement: { case: 'vocative' } })).not.toThrow();
  expect(() => parseConjugationOptions({ language: 'la', infinitive: 'amāre', agreement: { case: 'locative' } })).toThrow('agreement.case');
  expect(() => parseConjugationOptions({ language: 'la', infinitive: 'amāre', stems: { perfect: 'amāv' } })).toThrow(ConjugationError);
  expect(() => parseConjugationOptions({ language: 'la', infinitive: 'hortārī', stems: { present: 'hortō' } })).toThrow(ConjugationError);
  expect(() => parseConjugationOptions({ language: 'la', infinitive: 'amāre', auxiliary: 'esse' })).toThrow(ConjugationError);
  expect(() => parseConjugationOptions({ language: 'la', infinitive: 'amāre', subject: '3sg.f', gender: 'masculine' })).toThrow(ConjugationError);
});
it('compares without macrons', () => {
  expect(normalizeForComparison('la', 'Amāverīs')).toBe(normalizeForComparison('la', 'amaveris'));
  expect(normalizeForComparison('la', 'jubeō')).toBe('iubeo');
  expect(normalizeForComparison('fr', 'Été')).toBe('été'); // other languages keep their diacritics
});
it('the CLI lists Latin', () => { /* spawn dist/cli.js --help as tests/cli.test.ts does; stdout contains 'Latin (la)' */ });
```

- [ ] **Step 2:** `npx vitest run tests/la/pack.test.ts` — FAIL (`la` is not a language).
- [ ] **Step 3:** Implement the files above and the shared one-line registrations (and the comparison hook if absent).
- [ ] **Step 4:** `npm run typecheck && npm test` at the root — PASS, including `tests/i18n/completeness.test.ts` (no Latin rules yet) and the unchanged French and Dutch snapshots.
- [ ] **Step 5:** Commit `feat(conjugation-engine): Latin pack skeleton, catalogue, subject slots and options`.

### Task 2: Lexicon, compounds and classification

**Files:**
- Create: `src/languages/la/lexicon.ts` (GD §5.1–5.4), `compounds.ts` (GD §3.4), `classify.ts` (GD §3.2–3.6)
- Modify: `src/languages/la/grammar.ts` (`classify`, `lexemeOf`), `rules.ts` (the 17 `la.classify.*` rules of GD §4.1), `sources.ts` (their citations; `lexiconVerification`), both message files
- Test: `tests/la/classify.test.ts`

**Interfaces:**
- Produces (`lexicon.ts`): `LatinEntry`, `LatinLexeme`, `LatinLack`, `LexicalForm` exactly as GD §5.1 (with `perfectSystem`); `latinLexicon: Readonly<Record<string, LatinEntry>>` keyed by `latinKey(infinitive)` with homographs as arrays, i.e. `Readonly<Record<string, readonly LatinEntry[]>>`; side lists `noInherit`, `impersonalPassive`, `homographs` (GD §5.4).
- Produces (`compounds.ts`): `prefixAllomorphs: readonly { prefix: string; form: string; before: RegExp }[]` (GD §3.4 table) and `resolveCompound(key: string): readonly { prefix: string; base: string; entry: LatinEntry; vary: boolean }[]` (macron-insensitive, longest allomorph first, one prefix, minimum root of three letters unless the family lists its prefixes, never for `noInherit` lemmas).
- Produces (`classify.ts`): `classifyLatin(query): Fork<LatinLexeme>` (GD §3.2 in order, steps and assumptions of GD §4.1, homograph tags `pattern` = 1sg with macrons, `condition` = gloss) and `lexemeOfLatin(lemma): LatinLexeme` for *esse* and *īre*.
- Rules introduced: `la.classify.lexicon`, `.compound`, `.conjugation`, `.io`, `.deponent`, `.semi-deponent`, `.assume-third`, `.assume-second-deponent`, `.assume-consonant-stem`, `.assume-quantity`, `.assume-passive`, `.assume-compound`, `.default-parts`, `.default-sigmatic`, `.default-uo`, `.default-sco`, `.default-u`.

- [ ] **Step 1: Verify the lexicon by hand.** Transcribe the principal parts of GD §5.2–5.3 from the 1903 scans (AG093–AG095, AG104–AG137; URL pattern in GD §1.1) — the DCC text of §§209–212 is the checklist, the scan decides; check each stem quantity not marked by A&G in Lewis & Short via `https://logeion.uchicago.edu/<lemma>` (Perseus refuses scripts: open by hand). Record `lexiconVerification[lemma]`. Group K and the impersonal-passive list are [U] in GD: drop any lemma L&S contradicts and say so in the commit message.
- [ ] **Step 2: Write the failing test** `tests/la/classify.test.ts`, with `analysis = (infinitive, extra = {}) => latinPack.engine(parseConjugationOptions({ language: 'la', infinitive, ...extra })).analysis` and `ids = (a) => a.steps!.map(s => s.rule)`:

```ts
it('finds lexicon verbs without macrons', () => {
  const a = analysis('monere');
  expect(a).toMatchObject({ lemma: 'monēre', classification: 'second', classificationSource: 'lexicon', assumptions: [] });
  expect(ids(a)).toEqual(['la.classify.lexicon']);
  expect(analysis('tegere').lemma).toBe('tegere');
});
it('records every assumption for an invented verb', () => {
  expect(ids(analysis('tregere'))).toEqual(['la.classify.conjugation', 'la.classify.assume-third',
    'la.classify.assume-consonant-stem', 'la.classify.assume-quantity', 'la.classify.assume-passive', 'la.classify.default-sigmatic']);
  const second = analysis('tregere', { stems: { present: 'tregeō' } });
  expect(second.classification).toBe('second');
  expect(ids(second)).not.toContain('la.classify.assume-third');
  expect(ids(analysis('blorpāre'))).toEqual(['la.classify.conjugation', 'la.classify.assume-quantity', 'la.classify.assume-passive', 'la.classify.default-parts']);
  expect(ids(analysis('flēscere'))).toContain('la.classify.default-sco');
  expect(ids(analysis('frolere'))).toContain('la.classify.default-u');
});
it('classifies deponents and semi-deponents', () => {
  expect(analysis('hortari')).toMatchObject({ lemma: 'hortārī', classification: 'first-deponent' });
  expect(analysis('blorpari').classification).toBe('first-deponent');
  expect(ids(analysis('trapī'))).toContain('la.classify.assume-consonant-stem');
  expect(analysis('audēre').classification).toBe('second-semi-deponent');
  expect(analysis('patī').classification).toBe('thirdIo-deponent');
});
it('returns both paradigms of a macron-less homograph', () => {
  const a = analysis('parere');
  expect(a.alternatives).toHaveLength(1);
  expect([a.lemma, a.alternatives![0]!.lemma].sort()).toEqual(['parere', 'pārēre']);
  expect(analysis('pārēre').alternatives).toBeUndefined();
  expect(analysis('parere', { stems: { present: 'pariō' } }).alternatives).toBeUndefined();
  expect(analysis('occidere').alternatives).toHaveLength(1);
});
it('resolves compounds through their families only', () => {
  const accipere = analysis('accipere');
  expect(accipere.steps!.find(s => s.rule === 'la.classify.compound')!.params).toMatchObject({ prefix: 'ac', base: 'capiō' });
  expect(analysis('conficere').lemma).toBe('cōnficere');
  expect(ids(analysis('recapere'))).not.toContain('la.classify.compound');
  expect(analysis('ambire')).toMatchObject({ classification: 'fourth' });
  expect(ids(analysis('ambire'))).not.toContain('la.classify.compound');
  expect(analysis('abesse').classification).toBe('irregular');
});
it('rejects a passive infinitive and an impossible infinitive', () => {
  expect(() => analysis('amārī')).toThrow(/voice: 'passive'/u);
  expect(() => analysis('blesse')).toThrow(ConjugationError);
  expect(() => analysis('trānsesse')).toThrow(ConjugationError);
});
it('keeps the lexicon verified', () => {
  for (const [key, entries] of Object.entries(latinLexicon)) for (const entry of entries)
    expect(lexiconVerification[entry.present ?? entry.infinitive], key).toBeDefined();
  // pins filled in after Step 1: irregular ≈ 60, principal parts ≈ 300, families 32
});
```

- [ ] **Step 3:** `npx vitest run tests/la/classify.test.ts` — FAIL.
- [ ] **Step 4:** Implement; write the 17 rules, their `en` messages (GD §4.1 text), `nl` messages and citations; pin the lexicon counts in the last test.
- [ ] **Step 5:** `npm run typecheck && npm test` — PASS. Commit `feat(conjugation-engine): Latin lexicon, compound families and classification`.

### Task 3: Stems, endings and quantity rules for the simple finite tenses

**Files:**
- Create: `src/languages/la/stems.ts` (GD §4.2), `paradigms.ts` (ending sets, GD §4.6), `endings.ts`, `orthography.ts` (GD §4.4)
- Modify: `src/languages/la/grammar.ts` (`cellOf` for finite targets, `cell`, `stem`, `ending`, `orthography`, a minimal `clause` that returns the verb words as parts, `availability` returning null), `lexicon.ts` (whole-word cells of GD §5.2), `rules.ts`, `sources.ts`, message files
- Test: `tests/la/finite.test.ts`

**Interfaces:**
- Consumes: `LatinLexeme` (Task 2).
- Produces (`grammar.ts`): `cellOf(target, lexeme)` for finite targets exactly as GD §6.2 (deponent active present-system targets → a cell with `voice: 'passive'`; perfect-system targets of `perfectSystem: 'participle'` lexemes and all perfect-system passive targets → `null`, filled by Task 4's periphrases).
- Produces (`paradigms.ts`): `endingsFor(stemClass, cellKey): readonly string[]` returning the underlying endings of GD §4.6 (cell key `${mood}.${tense}.${voice}`), plus `perfectEndings`, `passiveReVariant(ending): string | null`.
- Produces (`stems.ts`): `presentStem(lexeme): Fork<string>`, `perfectStems(lexeme): Fork<string>`, `supineStems(lexeme): Fork<string>`, each with its steps (`la.stem.*`), including the default-stem junctions of GD §3.3.
- Produces (`orthography.ts`): the seven `JunctureRule`s of GD §4.4 in that order, exported as `latinOrthography`, and `quantityProblems(word: string, lexeme?: LatinLexeme): string[]` (the lint of GD §4.4, reused by tests and Task 8).
- Rules introduced: the 8 `la.stem.*` rules, the 19 finite `la.end.*` rules of GD §4.3 (first table), the 7 `la.orth.*` rules, and `la.lex.cell`.

- [ ] **Step 1: Write the failing test** `tests/la/finite.test.ts`. Shared helpers in `tests/la/helpers.ts` (used by every later Latin test): `forms(infinitive, mood, tense?, voice?, extra = {})` returns the texts of `conjugate({ language: 'la', infinitive, mood, tense, voice, ...extra }).forms` in output order, where `voice` defaults to `'active'` for the finite moods and is omitted for the others unless given (an omitted `tense` is omitted too); `form(infinitive, mood, tense, subject)` returns the single preferred form of that target; `explainIds(form)` returns the rule ids of its part steps in order:

```ts
it('conjugates the five models in the present system', () => {
  expect(forms('amāre', 'indicative', 'present')).toEqual(['amō', 'amās', 'amat', 'amāmus', 'amātis', 'amant']);
  expect(forms('monēre', 'subjunctive', 'present')).toEqual(['moneam', 'moneās', 'moneat', 'moneāmus', 'moneātis', 'moneant']);
  expect(forms('tegere', 'indicative', 'future')).toEqual(['tegam', 'tegēs', 'teget', 'tegēmus', 'tegētis', 'tegent']);
  expect(forms('capere', 'indicative', 'present')).toEqual(['capiō', 'capis', 'capit', 'capimus', 'capitis', 'capiunt']);
  expect(forms('audīre', 'indicative', 'imperfect')).toEqual(['audiēbam', 'audiēbās', 'audiēbat', 'audiēbāmus', 'audiēbātis', 'audiēbant']);
  expect(forms('capere', 'subjunctive', 'imperfect')[0]).toBe('caperem');
  expect(forms('capere', 'imperative', 'future')).toEqual(['capitō', 'capitō', 'capitōte', 'capiuntō']);
  expect(forms('tegere', 'imperative', 'present')).toEqual(['tege', 'tegite']);
});
it('explains amat and amem step by step', () => {
  expect(explainIds(form('amāre', 'indicative', 'present', '3sg'))).toEqual(['la.stem.present', 'la.end.personal', 'la.orth.short-final']);
  expect(explainIds(form('amāre', 'subjunctive', 'present', '1sg'))).toEqual(['la.stem.present', 'la.end.subjunctive', 'la.orth.a-lost', 'la.orth.short-final']);
  expect(explainIds(form('capere', 'indicative', 'present', '2sg'))).toContain('la.orth.io-drop-i');
});
it('gives the passive with the literary -re beside -ris', () => {
  const second = conjugate({ language: 'la', infinitive: 'amāre', mood: 'indicative', tense: 'present', voice: 'passive', subject: '2sg' }).forms;
  expect(second.map(f => [f.text, f.variant.usage, f.variant.pattern])).toEqual([['amāris', 'standard', null], ['amāre', 'literary', 're']]);
  expect(forms('tegere', 'indicative', 'present', 'passive').slice(0, 4)).toEqual(['tegor', 'tegeris', 'tegere', 'tegitur']);
  expect(forms('tegere', 'indicative', 'future', 'passive')).toContain('tegēris');
});
it('builds the active perfect system on the perfect stem', () => {
  expect(forms('amāre', 'indicative', 'perfect')).toEqual(['amāvī', 'amāvistī', 'amāvit', 'amāvimus', 'amāvistis', 'amāvērunt', 'amāvēre']);
  expect(forms('amāre', 'subjunctive', 'perfect')).toEqual(['amāverim', 'amāverīs', 'amāverit', 'amāverīmus', 'amāverītis', 'amāverint']);
  expect(forms('amāre', 'indicative', 'future_perfect')).toEqual(['amāverō', 'amāveris', 'amāverit', 'amāverimus', 'amāveritis', 'amāverint']);
  expect(explainIds(form('tegere', 'indicative', 'perfect', '1sg'))).toEqual(['la.stem.perfect', 'la.end.perfect']);
  expect(forms('tegere', 'indicative', 'perfect')[0]).toBe('tēxī');
});
it('conjugates the irregular verbs', () => {
  expect(forms('esse', 'indicative', 'present')).toEqual(['sum', 'es', 'est', 'sumus', 'estis', 'sunt']);
  expect(forms('esse', 'subjunctive', 'imperfect').slice(0, 2)).toEqual(['essem', 'forem']);
  expect(forms('ferre', 'indicative', 'present')).toEqual(['ferō', 'fers', 'fert', 'ferimus', 'fertis', 'ferunt']);
  expect(forms('ferre', 'subjunctive', 'imperfect')[0]).toBe('ferrem');
  expect(forms('īre', 'indicative', 'present')).toEqual(['eō', 'īs', 'it', 'īmus', 'ītis', 'eunt']);
  expect(forms('īre', 'indicative', 'future')[0]).toBe('ībō');
  expect(forms('īre', 'imperative', 'future')).toEqual(['ītō', 'ītō', 'ītōte', 'euntō']);
  expect(forms('īre', 'indicative', 'perfect').slice(0, 4)).toEqual(['iī', 'īvī', 'īstī', 'īvistī']);
  expect(forms('velle', 'indicative', 'present')).toEqual(['volō', 'vīs', 'vult', 'volumus', 'vultis', 'volunt']);
  expect(forms('nōlle', 'indicative', 'present')[1]).toBe('nōn vīs');
  expect(forms('dare', 'indicative', 'present')).toEqual(['dō', 'dās', 'dat', 'damus', 'datis', 'dant']);
  expect(forms('dare', 'subjunctive', 'present').slice(0, 2)).toEqual(['dem', 'dēs']);
  expect(forms('fierī', 'indicative', 'present')).toEqual(['fīō', 'fīs', 'fit', 'fīmus', 'fītis', 'fīunt']);
});
it('shortens the imperative of dīcō, dūcō, faciō, ferō only', () => {
  expect(forms('dūcere', 'imperative', 'present')).toEqual(['dūc', 'dūcite']);
  expect(forms('ēdūcere', 'imperative', 'present')[0]).toBe('ēdūc');
  expect(forms('facere', 'imperative', 'present')[0]).toBe('fac');
  expect(forms('ferre', 'imperative', 'present')).toEqual(['fer', 'ferte']);
  expect(forms('cōnficere', 'imperative', 'present')[0]).toBe('cōnfice');
  expect(forms('dūcāre', 'imperative', 'present')[0]).toBe('dūcā');
});
it('conjugates a deponent with passive endings in the active', () => {
  expect(forms('hortārī', 'indicative', 'present')).toEqual(['hortor', 'hortāris', 'hortāre', 'hortātur', 'hortāmur', 'hortāminī', 'hortantur']);
  // the 2nd plural is declared unavailable in Task 4; ask for the singular only here
  expect(forms('hortārī', 'imperative', 'future', 'active', { number: 'singular' })).toEqual(['hortātor', 'hortātor']);
});
it('never breaks a quantity rule in the model paradigms', () => {
  for (const infinitive of ['amāre', 'monēre', 'tegere', 'capere', 'audīre', 'hortārī', 'ferre', 'īre'])
    for (const tense of ['present', 'imperfect', 'future'])
      for (const f of conjugate({ language: 'la', infinitive, mood: 'indicative', tense, voice: 'active' }).forms)
        expect(quantityProblems(f.text), f.text).toEqual([]);
});
```

- [ ] **Step 2:** `npx vitest run tests/la/finite.test.ts` — FAIL.
- [ ] **Step 3:** Implement. `ending` picks from `paradigms.ts` by stem class and cell, applies `la.end.athematic` for *ferō* (GD §4.3 trigger), `la.end.optative` for *velim/nōlim/mālim*, adds the tagged `la.end.re` / `la.end.ere` second outcome; `cell` returns the lexicon's whole words with `la.lex.cell` (*sum*, *nōn vīs*, *dās*, contracted *eō* forms); `la.end.short-imperative` is a lexical step on the imperative 2sg of `shortImperative` lexemes except compounds in *-ficiō*. The future-imperative 2pl of deponents and the perfect-system forms of `perfectSystem: 'participle'` lexemes are not asked here (Task 4).
- [ ] **Step 4:** `npm run typecheck && npm test` — PASS.
- [ ] **Step 5:** Commit `feat(conjugation-engine): Latin stems, endings and quantity rules for the simple finite tenses`.

### Task 4: Non-finite forms, compound tenses, clause and availability

**Files:**
- Create: `src/languages/la/declension.ts` (GD §6.3, tables of GD §4.6), `periphrasis.ts` (GD §6.1), `clause.ts` (GD §6.3–6.4), `availability.ts` (GD §4.5)
- Modify: `src/languages/la/grammar.ts` (`cellOf` for non-finite and periphrastic targets per GD §6.2, `availability`, `clause`, `periphrases`), `endings.ts` (non-finite endings), `pack.ts` (`acceptsForm`), `rules.ts`, `sources.ts`, message files
- Test: `tests/la/nonfinite.test.ts`, `tests/la/compound.test.ts`, `tests/la/availability.test.ts`

**Interfaces:**
- Produces (`declension.ts`): `declineUs(stem: string, agreement: Agreement): Fork<string>`, `declineNs(stemVowelForm: string, agreement: Agreement): Fork<string>` (with the tagged second forms of GD §4.3), `agreementsFor(form: LatinNonFiniteForm, query, lexeme): readonly Agreement[]` (GD §6.3 table), `LatinNonFiniteForm` = the ten form ids of GD §6.1.
- Produces (`periphrasis.ts`): `latinPeriphrases: readonly Periphrasis<LatinLexeme>[]` exactly the eleven rows of GD §6.1 (`applies` reads `lexeme.perfectSystem`, `lexeme.flags`, `lexeme.entry?.infinitive`).
- Produces (`clause.ts`): `latinClause: ClauseGrammar<LatinLexeme>` — `agreements` per GD §6.3 (finite compounds by subject: `context.target.gender` ?? `context.subject?.gender` ?? all three; impersonal passive neuter singular; non-finite by `agreementsFor`), `assemble` per GD §6.4 (no subject part; recipe order; `la.clause.deponent` / `la.clause.semi-deponent` form steps; non-finite features).
- Produces (`availability.ts`): `latinAvailability(lexeme, target): Unavailability | null` implementing the ten `la.avail.*` rules with their reasons (`noPassive`, `impersonal`, `noImperative`, `defective`) and `source` = the cited URL.
- Produces (`pack.ts`): `acceptsForm(query, form)` per GD §6.3 (non-finite forms filtered by the given agreement keys; finite forms always kept).
- Rules introduced: the 11 non-finite `la.end.*` rules, the 9 `la.periphrasis.*`, the 4 `la.clause.*`, the 10 `la.avail.*` rules of GD §4.3 and §4.5 (86 in total after this task).

- [ ] **Step 1: Write the failing tests.** `tests/la/nonfinite.test.ts`:

```ts
it('gives citation forms without agreement', () => {
  expect(forms('amāre', 'participle')).toEqual(['amāns', 'amātus', 'amātūrus', 'amandus']);
  expect(forms('amāre', 'gerund')).toEqual(['amandī']);
  expect(forms('amāre', 'supine')).toEqual(['amātum']);
  expect(forms('amāre', 'infinitive')).toEqual(['amāre', 'amārī', 'amāvisse', 'amātus esse', 'amātūrus esse', 'amātum īrī']);
  expect(forms('tegere', 'participle', 'gerundive')).toEqual(['tegendus', 'tegundus']); // second: usage 'dated', pattern 'undus'
  expect(forms('audīre', 'participle', 'present')).toEqual(['audiēns']);
  expect(forms('īre', 'participle', 'present')).toEqual(['iēns']);
});
it('declines in full when agreement is asked', () => {
  const present = conjugate({ language: 'la', infinitive: 'amāre', mood: 'participle', tense: 'present', agreement: {} }).forms;
  expect(present.filter(f => f.target.agreement!.gender === 'masculine').map(f => f.text)).toEqual([
    'amāns', 'amantis', 'amantī', 'amantem', 'amante', 'amantī', 'amāns',
    'amantēs', 'amantium', 'amantibus', 'amantēs', 'amantīs', 'amantibus', 'amantēs']);
  expect(present.find(f => f.text === 'amantī' && f.target.agreement!.case === 'ablative')!.variant.pattern).toBe('adjectival');
  expect(forms('amāre', 'participle', 'perfect', undefined, { agreement: { case: 'genitive', number: 'plural' } })).toEqual(['amātōrum', 'amātārum', 'amātōrum']);
  expect(forms('amāre', 'participle', 'perfect', undefined, { agreement: { case: 'vocative', gender: 'masculine', number: 'singular' } })).toEqual(['amāte']);
  expect(forms('amāre', 'gerund', undefined, undefined, { agreement: {} })).toEqual(['amandī', 'amandō', 'amandum', 'amandō']);
  expect(forms('amāre', 'supine', undefined, undefined, { agreement: {} })).toEqual(['amātum', 'amātū']);
  expect(forms('amāre', 'infinitive', 'future', 'active', { agreement: { gender: 'masculine', number: 'singular', case: 'accusative' } })).toEqual(['amātūrum esse']);
  expect(forms('esse', 'infinitive', 'future', 'active', { agreement: { gender: 'masculine', number: 'singular', case: 'accusative' } })).toEqual(['futūrum esse', 'fore']);
});
it('drops a target the agreement excludes without failing', () => {
  const r = conjugate({ language: 'la', infinitive: 'amāre', agreement: { gender: 'masculine' } });
  expect(r.forms.some(f => f.target.mood === 'gerund')).toBe(false);
  expect(r.forms.some(f => f.target.mood === 'indicative' && f.target.tense === 'present')).toBe(true);
});
```

`tests/la/compound.test.ts`:

```ts
it('returns three genders for a compound form, once for a simple one', () => {
  const perfect = conjugate({ language: 'la', infinitive: 'amāre', mood: 'indicative', tense: 'perfect', voice: 'passive', subject: '1sg' }).forms;
  expect(perfect.map(f => [f.text, f.target.agreement!.gender, f.variant.auxiliary])).toEqual([
    ['amātus sum', 'masculine', 'esse'], ['amāta sum', 'feminine', 'esse'], ['amātum sum', 'neuter', 'esse']]);
  expect(perfect[0]!.steps!.map(s => s.rule)).toEqual(['la.periphrasis.perfect', 'la.clause.agree-subject']);
  expect(forms('amāre', 'indicative', 'present', 'active', { subject: '1sg' })).toEqual(['amō']);
  expect(forms('amāre', 'indicative', 'perfect', 'passive', { subject: '3sg.f' })).toEqual(['amāta est']);
  expect(forms('amāre', 'subjunctive', 'pluperfect', 'passive', { gender: 'neuter', person: 3, number: 'plural' })).toEqual(['amāta essent']);
});
it('builds the perfect of deponents, semi-deponents and fīō as participle + esse in the active', () => {
  const hortatus = conjugate({ language: 'la', infinitive: 'hortārī', mood: 'indicative', tense: 'perfect', voice: 'active', subject: '1sg.m' }).forms;
  expect(hortatus.map(f => f.text)).toEqual(['hortātus sum']);
  expect(hortatus[0]!.ruleIds).toEqual(expect.arrayContaining(['la.periphrasis.perfect', 'la.clause.deponent']));
  expect(forms('hortārī', 'infinitive', 'perfect', 'active')).toEqual(['hortātus esse']);
  expect(forms('audēre', 'indicative', 'perfect', 'active', { subject: '1sg.m' })).toEqual(['ausus sum']);
  expect(forms('audēre', 'indicative', 'future', 'active', { subject: '1sg' })).toEqual(['audēbō']);
  expect(forms('fierī', 'indicative', 'perfect', 'active', { subject: '3sg.n' })).toEqual(['factum est']);
  expect(forms('fierī', 'infinitive', 'future', 'active')).toEqual(['factum īrī']);
  expect(forms('amāre', 'indicative', 'perfect', 'active', { subject: '1sg' })).toEqual(['amāvī']); // no periphrasis step
});
it('makes the passive of intransitive eō impersonal', () => {
  expect(forms('īre', 'indicative', 'perfect', 'passive', { subject: '3sg.m' })).toEqual(['itum est']);
  expect(forms('īre', 'participle', 'gerundive')).toEqual(['eundum']);
});
it('gives faciō the passive of fīō', () => {
  expect(forms('facere', 'indicative', 'present', 'passive', { subject: '1sg' })).toEqual(['fīō']);
  expect(forms('facere', 'infinitive', 'present', 'passive')).toEqual(['fierī']);
  expect(forms('facere', 'indicative', 'perfect', 'passive', { subject: '1sg.m' })).toEqual(['factus sum']);
});
```

`tests/la/availability.test.ts` (`unavailable(query)` = `[reason, step.rule]` of each unavailable target):

```ts
it('declares every missing form with its reason', () => {
  expect(unavailable({ infinitive: 'hortārī', mood: 'indicative', tense: 'present', voice: 'passive', subject: '1sg' })).toEqual([['noPassive', 'la.avail.no-passive']]);
  expect(unavailable({ infinitive: 'īre', mood: 'indicative', tense: 'present', voice: 'passive', subject: '1sg' })).toEqual([['impersonal', 'la.avail.impersonal-passive']]);
  expect(unavailable({ infinitive: 'posse', mood: 'imperative', tense: 'present', subject: '2sg' })).toEqual([['noImperative', 'la.avail.no-imperative']]);
  expect(unavailable({ infinitive: 'mālle', mood: 'participle', tense: 'present' })).toEqual([['defective', 'la.avail.no-participle']]);
  expect(unavailable({ infinitive: 'esse', mood: 'gerund' })).toEqual([['defective', 'la.avail.no-gerund']]);
  expect(unavailable({ infinitive: 'coepisse', mood: 'indicative', tense: 'present', subject: '1sg' })).toEqual([['defective', 'la.avail.no-present']]);
  expect(unavailable({ infinitive: 'oportēre', mood: 'indicative', tense: 'present', subject: '1sg' })).toEqual([['impersonal', 'la.avail.impersonal']]);
  expect(forms('oportēre', 'indicative', 'present', 'active', { subject: '3sg' })).toEqual(['oportet']);
  expect(unavailable({ infinitive: 'amāre', mood: 'imperative', tense: 'future', voice: 'passive', subject: '2pl' })).toEqual([['defective', 'la.avail.no-future-imperative-plural']]);
  expect(unavailable({ infinitive: 'hortārī', mood: 'imperative', tense: 'future', voice: 'active', subject: '2pl' })).toEqual([['defective', 'la.avail.no-future-imperative-plural']]);
  expect(unavailable({ infinitive: 'posse', mood: 'infinitive', tense: 'future', voice: 'active' })).toEqual([['defective', 'la.avail.no-supine']]);
});
it('never leaves an available target without a form', () => {
  for (const infinitive of ['amāre', 'monēre', 'tegere', 'capere', 'audīre', 'hortārī', 'sequī', 'patī', 'esse', 'posse', 'velle', 'nōlle', 'mālle', 'ferre', 'īre', 'fierī', 'audēre', 'dare', 'edere'])
    expect(() => conjugate({ language: 'la', infinitive, agreement: {} }), infinitive).not.toThrow();
});
```

- [ ] **Step 2:** `npx vitest run tests/la/nonfinite.test.ts tests/la/compound.test.ts tests/la/availability.test.ts` — FAIL.
- [ ] **Step 3:** Implement. Non-finite cells per GD §6.2; `ending` for non-finite cells applies the participle/gerund/supine suffix, then `declineUs`/`declineNs` for a non-citation agreement; the citation agreement records no declension step. *fore* is a lexical cell of *esse* returning *fore* for every agreement (GD §6.1). `availability` is checked by the core before `cellOf`, so deponent passive targets never reach a stage.
- [ ] **Step 4:** `npm run typecheck && npm test` — PASS (completeness gate now covers 86 rules).
- [ ] **Step 5:** Commit `feat(conjugation-engine): Latin non-finite forms, declension, compound tenses, clause and availability`.

### Task 5: Corpus parser and language module

The shared corpus test compares every file of every registered corpus language, so the fixture cannot land before its ledger without breaking the gate. This task therefore builds and tests the parser and the module against a synthetic page and does **not** register Latin in `scripts/corpus/languages/index.ts`; Task 6 registers, imports and makes it green.

**Files:**
- Create: `scripts/corpus/parsers/la.ts`, `scripts/corpus/languages/la.ts`, `scripts/corpus/corrections/la.ts` (returns null for now), `tests/la/corpus-parser.test.ts`, `tests/la/samples/synthetic-page.html` (hand-written in the source template's markup with invented forms; no source text is copied)
- Test: `tests/la/corpus-parser.test.ts`

**Interfaces:**
- Produces (`parsers/la.ts`): `latinCellsPerFile = 185`; `parseLatin(html: string, name: string): ParsedCorpus` implementing GD §9.1–9.2 exactly: canonical cell order of the GD §9.2 table; `subject: '<p><n>.m'` on finite cells; `voice` on finite and infinitive cells; agreement per the table (infinitive perfect `{ masculine, singular, accusative }` only when the row has two words); ` / ` alternatives split whole-row; `NO PASSIVE` and absent participle sections synthesized as `-` cells counted in `templatePlaceholders`; the gerund row 0 as `scope: 'unmodelled'`, reason `gerund-nominative`; throws when the `h1` lemma differs from `LATIN_FILES[name]`, on an unknown heading, or when the count is not 185.
- Produces (`languages/la.ts`): `LATIN_FILES` (GD §9.4) and `latin: CorpusLanguage` — `language: 'la'`, `directory: 'Latina'`, `encoding: 'windows-1252'`, `expectedFiles: 18`, `cellsPerFile: 185`, `parse: parseLatin`, `context: name => ({ infinitive: LATIN_FILES[name], gender: 'masculine', auxiliary: null, pattern: 'default' })`, `correction: latinCorrection`, `query: file => [{ label: 'masculine', options: { language: 'la', infinitive: file.infinitive, gender: 'masculine', agreement: {} } }]`, `applicable: (_f, _c, forms) => forms`, `remaps: []`, `unmodelled: { 'gerund-nominative': '<GD §9.2 text>' }`.

- [ ] **Step 1: Write the synthetic page** with the exact block, heading and `<br>` structure of GD §9.1 (unclosed infinitive value `div`s included), one ` / ` alternative, a `NO PASSIVE` block and no gerund/gerundive section, and invented forms (*blorpō* …).
- [ ] **Step 2: Write the failing test** `tests/la/corpus-parser.test.ts`:

```ts
const page = readFileSync(new URL('./samples/synthetic-page.html', import.meta.url), 'utf8');
it('reads 185 cells in canonical order', () => {
  const { cells, templatePlaceholders } = parseLatin(page, 'blorpare.html'); // LATIN_FILES gets a test-only entry via a parameter, see Step 3
  expect(cells).toHaveLength(185);
  expect(templatePlaceholders).toBe(69 + 15);
  expect(cells[0]).toMatchObject({ target: { mood: 'indicative', tense: 'present', voice: 'active', person: 1, number: 'singular' }, subject: '1sg.m', expected: ['blorpō'] });
});
it('maps the infinitives, participles, gerund and supine', () => {
  const { cells } = parseLatin(page, 'blorpare.html');
  expect(cells[62]!.target).toMatchObject({ mood: 'infinitive', tense: 'future', voice: 'active', agreement: { gender: 'masculine', number: 'singular', case: 'accusative' } });
  expect(cells[139]!.target.agreement).toEqual({ gender: 'masculine', number: 'singular', case: 'genitive' });
  expect(cells[178]).toMatchObject({ scope: 'unmodelled', reason: 'gerund-nominative' });
  expect(cells[184]!.target).toMatchObject({ mood: 'supine', agreement: { gender: 'masculine', number: 'singular', case: 'ablative' } });
});
it('splits whole-row alternatives and synthesizes absent blocks', () => {
  const { cells } = parseLatin(page, 'blorpare.html');
  expect(cells.find(c => c.original.includes(' / '))!.expected).toHaveLength(2);
  expect(cells.slice(69, 138).every(c => c.sourceUnavailable)).toBe(true);
});
it('fails loudly', () => {
  expect(() => parseLatin('<html></html>', 'amare.html')).toThrow('185 Latin cells');
  expect(() => parseLatin(page.replace('Conjugation: blorp', 'Conjugation: x'), 'blorpare.html')).toThrow('lemma');
});
```

- [ ] **Step 3:** `npx vitest run tests/la/corpus-parser.test.ts` — FAIL. Implement; `parseLatin(html, name, files = LATIN_FILES)` takes the file map as an optional third parameter so the test can add `blorpare.html → blorpāre`.
- [ ] **Step 4:** `npx vitest run tests/la/corpus-parser.test.ts` — PASS; `npm run typecheck && npm test` — PASS (Latin is not yet a corpus language).
- [ ] **Step 5:** Commit `feat(conjugation-engine): Latin corpus parser and language module`.

### Task 6: Corpus green — import, two ledgers, two comparison levels, over-generation guard

**Files:**
- Modify (one line each): `scripts/corpus/languages/index.ts` (add `latin`), `tests/corpus.test.ts` (`la: { files: 18, infinitives: 18, cells: 3_330, placeholders: 819 }`)
- Modify: `scripts/corpus/corrections/la.ts`
- Create: `tests/fixtures/la.json` (imported), `tests/la/corpus-levels.test.ts`; regenerated `tests/fixtures/manifest.json`, `tests/fixtures/corrections.json`

**Interfaces:**
- Produces (`corrections/la.ts`): `latinFormCorrection(file, cell, index, draft)` and `latinMacronCorrection(file, cell, index, draft)` applying the two tables of GD §9.5 to one `CorrectionDraft`, and `latinCorrection(file, cell, index): CorpusCorrection | null` = form then macron on one draft, `finish()`. Every reason is longer than 30 characters and names the rule; every source is the `https://` URL of the GD §9.5 authority.

- [ ] **Step 1: Import.** `npm run corpus:import -- --source /Users/wouter/Downloads/VerbodromeX --only la` (the pinned checkout; the script refuses another revision). `git diff --exit-code -- tests/fixtures/fr.json tests/fixtures/nl.json` → exit 0. The import prints 18 files, 3,330 cells, 819 placeholders.
- [ ] **Step 2: Write the failing test** `tests/la/corpus-levels.test.ts` (fixture `la.json`, the engine's forms from `latin.query`):

```ts
it('passes macron-insensitively with the form ledger alone', () => {
  // for every cell: apply latinFormCorrection only; compare latinKey(expected) against latinKey(generated texts of the target)
});
it('keeps the macron ledger to vowel length', () => {
  // for every cell where latinMacronCorrection changes something: latinKey(before) === latinKey(after) for every form
});
it('pins the ledgers', () => {
  expect(formCorrectionCount).toBe(107);
  expect(macronCorrectionCount).toBe(147);
  expect(corrections.filter(c => c.file.startsWith('la/'))).toHaveLength(254);
});
it('never generates an untagged extra form', () => {
  // for every available cell (after both ledgers): each generated form of the cell's target whose text is not expected
  // has variant.usage !== 'standard' or variant.pattern !== null; a standard untagged extra fails with the cell's location
});
it('covers every catalogue entry', () => {
  // the set of `${mood}.${tense}` (and voice) of the fixture's cells contains every latinCatalogue entry
});
```

- [ ] **Step 3:** `npx vitest run tests/corpus.test.ts tests/la/corpus-levels.test.ts` — FAIL (no ledger).
- [ ] **Step 4:** Implement both ledgers from GD §9.5 (form: deponent future imperatives 15, *fuam* 4, *posse* gerundive/gerund 14, *mālēns* 10, *fīō* 38, *īre* 26; macron: *secūtus* 54, *largītus* 54, *amantor* 1, *audiuntor* 1, *volēns* 1, perfect subjunctive 36). Re-import (`--only la`) to regenerate `corrections.json` and the manifest. Any cell that still fails is either an engine bug (fix it, with a test in the owning task's test file) or a newly found source error (add it with its authority and update GD §9.5 and the pinned counts in the same commit).
- [ ] **Step 5:** `npm run typecheck && npm test && npm run corpus:check` — PASS; the report line reads `la: 18 files / 3330 cells …`.
- [ ] **Step 6:** Commit `test(conjugation-engine): Latin corpus green at form and vowel-length level with sourced ledgers`.

### Task 7: Invented verbs, real verbs outside the oracles, runtime explanations

**Files:**
- Create: `tests/la/invented.test.ts`, `tests/la/real.test.ts`
- Modify (one line): `tests/i18n/runtime.test.ts` (add `'la'`); message files if a step does not render
- Test: the files above

**Interfaces:**
- Consumes: the whole pack (Tasks 1–4).

- [ ] **Step 1: Write the failing tests.** `tests/la/invented.test.ts` checks every row of GD §8.1 cell by cell (expected forms and the listed assumption rule ids, in order, from `analysis.steps`), for example:

```ts
it('tregere', () => {
  expect(forms('tregere', 'indicative', 'present')).toEqual(['tregō', 'tregis', 'tregit', 'tregimus', 'tregitis', 'tregunt']);
  expect(forms('tregere', 'indicative', 'future')).toEqual(['tregam', 'tregēs', 'treget', 'tregēmus', 'tregētis', 'tregent']);
  expect(forms('tregere', 'indicative', 'perfect', 'active', { subject: '1sg' })).toEqual(['trexī']);
  expect(forms('tregere', 'supine')).toEqual(['trectum']);
  expect(explainIds(form('tregere', 'indicative', 'perfect', '1sg'))).toEqual(['la.stem.perfect-regular', 'la.stem.s-junction', 'la.end.perfect']);
  expect(forms('tregere', 'indicative', 'present', 'passive').slice(1, 3)).toEqual(['tregeris', 'tregere']);
  expect(forms('tregere', 'indicative', 'future', 'passive', { subject: '2sg' })).toEqual(['tregēris', 'tregēre']);
  expect(forms('tregere', 'participle', 'present')).toEqual(['tregēns']);
});
it('blapiō / blapere keeps and drops the i', () => {
  const q = { stems: { present: 'blapiō' } };
  expect(forms('blapere', 'indicative', 'present', 'active', q)).toEqual(['blapiō', 'blapis', 'blapit', 'blapimus', 'blapitis', 'blapiunt']);
  expect(forms('blapere', 'imperative', 'present', 'active', q)).toEqual(['blape', 'blapite']);
  expect(forms('blapere', 'participle', 'gerundive', undefined, q)[0]).toBe('blapiendus');
  expect(forms('blapere', 'indicative', 'perfect', 'active', { ...q, subject: '1sg' })).toEqual(['blapsī']);
});
it('blorpārī is deponent', () => {
  expect(forms('blorpārī', 'indicative', 'present').slice(0, 3)).toEqual(['blorpor', 'blorpāris', 'blorpāre']);
  expect(forms('blorpārī', 'indicative', 'perfect', 'active', { subject: '1sg.f' })).toEqual(['blorpāta sum']);
  expect(conjugate({ language: 'la', infinitive: 'blorpārī', voice: 'passive' }).forms).toEqual([]);
});
it('look-alikes stay regular', () => {
  expect(forms('dūcāre', 'imperative', 'present')[0]).toBe('dūcā');
  expect(forms('recapere', 'indicative', 'perfect', 'active', { subject: '1sg' })).toEqual(['recapsī']);
  expect(() => conjugate({ language: 'la', infinitive: 'trānsesse' })).toThrow(ConjugationError);
});
```

  plus `flūdēre`, `tregere` + `tregeō`, `plundīre`, `trapī`, `mundīrī`, `bluere` + `bluō`, `flēscere`, `frolere`, `amārī`, `blesse` from GD §8.1, and a vocative check (`amāre` perfect participle `{ case: 'vocative', gender: 'masculine', number: 'singular' }` → *amāte*). `tests/la/real.test.ts` checks every row of GD §8.2 (principal parts and the listed derived forms), each `it` naming its authority in a comment.
- [ ] **Step 2:** `npx vitest run tests/la/invented.test.ts tests/la/real.test.ts tests/i18n/runtime.test.ts` — FAIL (runtime: Latin not listed yet; invented/real: whatever the pack still gets wrong).
- [ ] **Step 3:** Fix the pack where a test exposes a bug (never the expectation, unless GD is shown wrong by an authority — then fix GD in the same commit); make every Latin step render in `en` and `nl` for every form and unavailable target the runtime test explains (the 18 oracle verbs, the invented verbs, `agreement: {}` queries).
- [ ] **Step 4:** `npm run typecheck && npm test` — PASS.
- [ ] **Step 5:** Commit `test(conjugation-engine): Latin invented verbs, real verbs and explanations in English and Dutch`.

### Task 8: Authority cells

**Files:**
- Create: `tests/goldens/la/authority/*.json` (the files of GD §8.3), `tests/la/authority.test.ts`
- Test: `tests/la/authority.test.ts`

**Interfaces:**
- Consumes: the JSON format and admission rule of GD §8.3; `quantityProblems` (Task 3).

- [ ] **Step 1: Transcribe.** For each file of GD §8.3, type the printed forms from the 1903 page scans (URL pattern GD §1.1; viewing a scan at 1,500 px is legible) and from Bennett's text; apply the admission rule (lint, `disputed`, `excluded`); expand "amātus (-a, -um) sum" to three agreement cells; record `transcribedBy` and `checkedAgainst`. Use a throwaway extraction script for Bennett if helpful; do not commit it; never fill a cell from engine output.
- [ ] **Step 2: Write the failing test** `tests/la/authority.test.ts`:

```ts
it.each(files)('$file', ({ query, cells, excluded, disputed }) => {
  // every cell: the engine's forms for the cell's target (query + mood, tense, voice, subject or agreement) include
  // every printed form exactly (macron-sensitive); a cell with `unavailable: true` generates nothing
  // every `excluded` / `disputed` entry names a reason of more than 30 characters
});
it('admits only forms that pass the quantity lint', () => {
  for (const { cells } of files) for (const c of cells) for (const f of c.forms) expect(quantityProblems(f)).toEqual([]);
});
it('pins the transcription', () => {
  expect(files).toHaveLength(/* number of files of GD §8.3 */);
  expect(cellCount).toBe(/* pinned after Step 1, about 3,300 */);
});
```

- [ ] **Step 3:** `npx vitest run tests/la/authority.test.ts` — FAIL until the pack is right; a failing cell is an engine bug or a transcription error: re-check the scan before touching the engine.
- [ ] **Step 4:** `npm run typecheck && npm test` — PASS; ask the user for a spot check of five random cells per file (note the request in the commit message).
- [ ] **Step 5:** Commit `test(conjugation-engine): Latin authority cells from Allen & Greenough and Bennett`.

### Task 9: en.wiktionary second oracle

**Files:**
- Create: `scripts/corpus/sources/wiktionary-la.ts` (pins, fetch CLI, parser), `scripts/corpus/corrections/wiktionary-la.ts`, `tests/fixtures/wiktionary-la.json` (imported), `tests/la/wiktionary.test.ts`, `tests/la/wiktionary-samples/{amo,conor,facio}.html` (only the conjugation `NavFrame` cut from real responses, with a CC BY-SA 4.0 attribution comment naming title and revision at the top)
- Test: `tests/la/wiktionary.test.ts`

**Interfaces:**
- Produces (`wiktionary-la.ts`):

```ts
export const wiktionaryPins: { readonly pages: readonly { title: string; lemma: string; revid: number }[];
  readonly modules: Readonly<Record<string, number>> };          // the 63 pages of GD §8.4; Module:la-verb 93344416 and Module:la-verb/data
export interface WiktionaryPage { readonly title: string; readonly lemma: string; readonly revid: number; readonly url: string;
  readonly history: string; readonly cells: readonly CorpusCell[] }   // the shared corpus cell shape, mapping of GD §8.4
export interface WiktionaryFixture { readonly licence: 'CC BY-SA 4.0'; readonly licenceUrl: 'https://creativecommons.org/licenses/by-sa/4.0/';
  readonly attribution: string; readonly retrieved: string; readonly modules: Readonly<Record<string, number>>; readonly pages: readonly WiktionaryPage[] }
export function parseWiktionaryLatin(html: string, lemma: string): readonly CorpusCell[];
```

  CLI: `node --experimental-strip-types scripts/corpus/sources/wiktionary-la.ts --cache <dir> [--accept-modules]` checks the module revisions (refuses on a change unless `--accept-modules`), fetches each pinned page with `action=parse&oldid=…&prop=text&formatversion=2&maxlag=5` (GD §8.4), sequential and ≥ 20 s apart, honouring `Retry-After`, caching raw JSON in `--cache`, parses and writes the fixture (about 25 minutes).
- Produces (`corrections/wiktionary-la.ts`): `wiktionaryLatinCorrection(page, cell, index): CorpusCorrection | null` with the four categories of GD §8.4, each reason longer than 30 characters with an A&G, Bennett or L&S URL (never Wiktionary itself).

- [ ] **Step 1: Write the failing parser test** against the samples:

```ts
it('reads tagged cells and alternatives', () => {
  const amo = parseWiktionaryLatin(sample('amo'), 'amō');
  expect(cell(amo, 'indicative', 'present', 'passive', '2sg.m').expected).toEqual(['amāris', 'amāre']);
  expect(cell(amo, 'subjunctive', 'perfect', 'active', '2sg.m').expected).toEqual(['amāverīs', 'amārīs']); // second dropped by the ledger
  expect(cell(amo, 'infinitive', 'future', 'active').target.agreement).toEqual({ gender: 'masculine', number: 'singular', case: 'accusative' });
  expect(cell(amo, 'participle', 'gerundive').expected).toEqual(['amandus']);
  expect(amo.filter(c => c.scope === 'unmodelled').map(c => c.reason)).toEqual(expect.arrayContaining(['archaic-sigmatic', 'not-in-catalogue']));
});
it('treats deponent forms as active', () => {
  const conor = parseWiktionaryLatin(sample('conor'), 'cōnor');
  expect(cell(conor, 'indicative', 'present', 'active', '1sg.m').expected).toEqual(['cōnor']);
  expect(cell(conor, 'imperative', 'future', 'active', '3pl.m').expected).toEqual(['cōnantor']);
});
it('selects the right verb on a shared page and fails loudly', () => {
  expect(() => parseWiktionaryLatin(sample('facio'), 'faciō')).not.toThrow();
  expect(() => parseWiktionaryLatin(sample('facio'), 'legō')).toThrow('No Latin conjugation table for legō');
});
```

- [ ] **Step 2:** `npx vitest run tests/la/wiktionary.test.ts` — FAIL. Implement the parser; run the CLI once; review the fixture by eye for five verbs (one per group of GD §8.4).
- [ ] **Step 3:** Add the oracle test to `tests/la/wiktionary.test.ts`: for every page and cell, apply the ledger, then every expected form is among the texts the engine generates for the cell's target with the query `{ language: 'la', infinitive: <lemma's infinitive>, gender: 'masculine', agreement: {} }`; unavailable cells generate nothing; every page carries `title`, `revid`, `url`, `history` and the fixture carries the licence and attribution; the ledger is reproducible (re-running `wiktionaryLatinCorrection` gives the stored ledger) and every entry has a reason over 30 characters and an `https://` source that is not on wiktionary.org. Write the ledger (GD §8.4 categories 1–4); pin pages (63), cells, unmodelled cells and ledger size after the first green run.
- [ ] **Step 4:** `npm run typecheck && npm test` — PASS.
- [ ] **Step 5:** Commit `test(conjugation-engine): en.wiktionary second oracle for 63 Latin verbs with a sourced ledger`.

### Task 10: Documentation and equivalence map

**Files:**
- Create: `docs/grammar/la.md`; `src/equivalence/la.ts` only if `src/equivalence/` exists (then one line in `src/equivalence/index.ts`)
- Modify (one line): `README.md` (language list)
- Test: `tests/la/docs.test.ts`

**Interfaces:**
- Consumes: `latinRules`, `latinCitations`, `latinWorks`, the ledgers, GD §10.

- [ ] **Step 1: Write the failing test** `tests/la/docs.test.ts`: every key of `latinRules` occurs in `docs/grammar/la.md`; the doc names the counts the tests pin (3,330 cells, 254 corrections, 63 Wiktionary pages, the authority-cell count); if `src/equivalence/la.ts` exists, it maps every `latinCatalogue` entry.
- [ ] **Step 2:** `npx vitest run tests/la/docs.test.ts` — FAIL.
- [ ] **Step 3:** Write `docs/grammar/la.md`: sources and licences (A&G DCC edition and scans, Bennett, L&S via Logeion, Wiktionary CC BY-SA 4.0 with the attribution sentence); the rule inventory (id, English statement, trigger, citation URL) from `rules.ts` + `sources.ts`; defaults and their assumptions (GD §3.3); subject slots and the gender decision (GD §2.2); the `agreement` option and citation forms (GD §6.3); limits (GD §2.4); corrections summary (scraped oracle form and macron ledgers, Wiktionary ledger, with counts); the tense-concept table of GD §10 (or `src/equivalence/la.ts` with those weights). Add the README line `- Latin (la): rule-first, both voices, macrons, explanations in English and Dutch`.
- [ ] **Step 4:** `npm run typecheck && npm test && npm run corpus:check` — PASS. CLI spot checks recorded in the commit message: `npm run cli -- la tregere --explain --locale nl`, `npm run cli -- la hortārī --mood indicative --tense perfect` (active forms shown, passive reported as no passive), `npm run cli -- la parere --mood indicative --tense present`.
- [ ] **Step 5:** Commit `docs(conjugation-engine): Latin grammar reference and equivalence map`.

---

## Self-review against the spec

| Spec item (approved design, "Latin (la)") | Task |
|---|---|
| Sources A&G (DCC), Bennett, L&S | 1 (`latinWorks`), 2 (lexicon), every rule's citation |
| Catalogue: indicative ×6, subjunctive ×4 in both voices; imperative present/future; infinitive ×3; participles; gerundive; gerund; supine; citation forms; full declension via `agreement` with `cases` | 1, 3, 4 |
| `-ēre` / `-re` literary variants; contracted perfects and periphrastic conjugations out | 3; GD §2.4 |
| Three stems; theme-vowel contraction; -iō verbs; vowel shortening; -bō vs -am; personal endings; imperatives *dīc, dūc, fac, fer* | 3 |
| Deponents (`noPassive`), semi-deponents, perfect passive = participle + esse with gender agreement, future infinitives | 4 |
| Lexicon: irregular/defective/impersonal ≈ 60, principal parts, ≈ 40 compound families stored once | 2 |
| Identification: principal parts, 1sg + infinitive, infinitive alone; macrons in output, macron-insensitive key; macron-less -ere → 3rd with assumption | 1 (`latinKey`), 2 |
| Invented verbs and default perfects | 2, 7 |
| Scraped oracle at two levels with ledgers | 5, 6 |
| Authority cells; Wiktionary second oracle for ≈ 60 verbs | 8, 9 |
| Docs, equivalence, README | 10 |
