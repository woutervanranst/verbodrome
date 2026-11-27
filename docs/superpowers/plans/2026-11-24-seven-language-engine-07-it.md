# Seven-Language Engine — Plan 7: Italian Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** An Italian (`it`) language pack on the staged core that conjugates real and invented verbs by recorded rules, explains every form in English and Dutch with a citation per rule, and passes the scraped corpus (with a sourced ledger), the Treccani authority cells and an en.wiktionary second oracle.

**Architecture:** A `StagedGrammar<ItalianLexeme>` assembled from small modules in `src/languages/it/` (lexicon and side lists, family resolver, stems, ending tables, spelling rules, nine compound-tense chains, clause), mirroring Plan 2 Part B's Dutch layout. Subject slots carry `lui`/`lei` gender; every other gender difference comes from the clause's agreement fork on the past participle. Test evidence comes in four tiers: invented verbs, authority cells (only what Treccani prints), the scraped corpus (20 pages) and en.wiktionary tables (63 pages) — the last two with corrections ledgers.

**Tech Stack:** TypeScript 7 strict, Node 26, Vitest 5, npm workspaces, cheerio (dev only, corpus scripts). No new dependencies.

**Spec:** `docs/superpowers/specs/2026-11-24-seven-language-engine-design.md` (section "Italian (it)") and the grammar design `docs/superpowers/research/2026-11-24-it-grammar-design.md` (cited below as **GD §n**; it holds every rule table, list and expected form — this plan does not repeat them).

**Builds on:** Plan 2 Part A — landed: subject slots (`LanguagePack.subjects` / `subjectsFor` / `genderedTargets`, `CatalogueEntry.slots`, the typed `subject` option and `LanguageSpec.subject`), `classify` → `Fork` with `analysis.alternatives`, `cellOf(target, lexeme)`, generic `Periphrasis<X>` with `applies` and `reports`, `ClauseContext.subject` and `agreeing`, part features; still to land: the `./core` subpath (Task 5) and the corpus model with labelled queries, remaps and `scope: 'unmodelled'` (Task 6) — and Part B (Dutch layout; `tests/i18n/runtime.test.ts`). Read `src/core/*.ts`, `tests/toy/pack.ts` (its formal slot `2sg.formal` with person 3 and its slot-listing imperative are the model for Italian), `src/languages/nl/*`, `scripts/corpus/*` and the pack-authoring guide `packages/conjugation-engine/docs/pack-authoring.md` before Task 1.

## Global Constraints

- All paths are relative to `packages/conjugation-engine/` unless they start with `docs/` or the repository root (`README.md`).
- Branch `feat/seven-language-engine` (or the Italian worktree branched from it); one commit per task; every commit keeps `npm run typecheck && npm test` green at the workspace root and `npm run corpus:check` passing.
- The pack touches only its own files: `src/languages/it/**`, `src/i18n/locales/{en,nl}/it.ts`, `scripts/corpus/parsers/it.ts`, `scripts/corpus/languages/it.ts`, `scripts/corpus/corrections/it.ts`, `scripts/corpus/sources/wiktionary-it.ts`, `scripts/corpus/corrections/wiktionary-it.ts`, `tests/it/**`, `tests/goldens/it/**`, `tests/fixtures/it.json`, `tests/fixtures/wiktionary-it.json`, `docs/grammar/it.md`.
- Shared files get one-line registrations only, exactly these: `src/languages/registry.ts` (import + `it: ItalianSpec;`), `src/languages/index.ts` (import + `it: italianPack`), `src/i18n/locales/en/index.ts` and `nl/index.ts` (import + `...it`), `src/types.ts` (one `export type { … } from './languages/it/spec.js';` line), `scripts/corpus/languages/index.ts` (add `italian`), `tests/corpus.test.ts` (one `pinned.it` line), `tests/i18n/runtime.test.ts` (add `'it'`), `README.md` (one language-list line), `src/equivalence/index.ts` (one line, only if the equivalence module exists). Regenerated, not hand-edited: `tests/fixtures/manifest.json`, `tests/fixtures/corrections.json` (via `--only it`).
- French and Dutch output must not change: `tests/characterization.test.ts`, the fr/nl halves of `tests/corpus.test.ts` and `tests/fixtures/{fr,nl}.json` stay byte-identical.
- Zero runtime dependencies; nothing under `src/` imports `node:*` (except `src/cli.ts`), `scripts/` or `tests/`.
- Every rule has an `en` and an `nl` message and a citation; `tests/i18n/completeness.test.ts` passes for `it`. Rule ids are `it.<stage>.<name>` in kebab case, exactly the 74 ids of GD §4. Messages are one learner-level sentence; a param is never named `before`/`after`; assumption rules take no `tense` term; an apostrophe directly before `{` is doubled (`''`). The English text of each message is the one in GD §4; Dutch texts are written by the implementer using the school-grammar terms listed in GD §4.
- Rules are cited to Treccani (*Enciclopedia dell'Italiano*, *La grammatica italiana*, *Vocabolario*) with the URLs of GD §1.2, to Serianni ch. XI (print), or to DOP — never to the scraped corpus site and never to Wiktionary or another conjugator. Anything cited only to Serianni or DOP before its locator is checked by hand is marked `unverified: true` in `sources.ts`.
- Lexicon entries are verified against the Treccani Vocabolario (`https://www.treccani.it/vocabolario/<entry>/`), never copied from the scraped corpus or from Wiktionary; an entry verified only against en.wiktionary is marked `secondary` in `lexiconVerification` (`sources.ts`).
- No expected form in any test is generated by the engine. Corpus and Wiktionary fixtures are imported from their sources; authority cells are transcribed from the page; invented-verb expectations come from GD §8.1.
- Wiktionary fetches: sequential, ≥ 20 s apart, `maxlag=5`, honour `Retry-After`, generic `User-Agent` without personal or project data.

## Review Focus

1. **An invented verb that looks irregular.** `blomettere` (`blo` is not a prefix) must conjugate regularly (`blomettei` — stem in t, so no `-etti` —, `blomettuto`, assumption `it.classify.assume-regular`); `stramettere` (`stra` + `mettere`) must inherit (`stramisi`, `stramesso`) but assume avere; `restare` must not become `stare`. → Task 2 and Task 7 tests.
2. **A verb with two paradigms or two auxiliaries.** `mentire` returns `mento` (`pattern: 'plain'`) and `mentisco` (`pattern: 'isc'`), and only one with `classHint`; `correre` returns `ho corso` and `sono corso`, told apart by `variant.auxiliary` and `variant.condition`; `apparire` is one paradigm with `appaio` and `apparisco`. → Task 2 and Task 4 tests.
3. **A reflexive imperative.** `farsi` tu → `fatti` (never `fa'ti`, `faiti`); `lavarsi` negative tu → `non ti lavare` (first) and `non lavarti`; Lei → `si lavi`. → Task 4 test.
4. **A form with two accepted spellings.** `andare` io → `vado` (preferred) and `vo` (`usage: 'literary'`); `credere` io p.r. → `credetti` and `credei`; `dovere` io → `devo`, `debbo`; `sognare` noi → `sogniamo` and never `sognamo`. → Task 3 tests.
5. **Input with dictionary stress accents or capitals.** `créscere`, `Parlàre`, `PARLARE` classify exactly like `crescere`/`parlare` (non-final accents removed in `classify`, no error); final-accent forms stay distinct targets (`parlo` indicative present 1sg vs `parlò` simple_past 3sg). → Task 2 test.

---

### Task 1: Pack skeleton

**Files:**
- Create: `src/languages/it/spec.ts`, `catalogue.ts`, `options.ts`, `rendering.ts`, `rules.ts`, `sources.ts`, `grammar.ts`, `pack.ts`; `src/i18n/locales/en/it.ts`, `src/i18n/locales/nl/it.ts`
- Modify (one line each): `src/languages/registry.ts`, `src/languages/index.ts`, `src/i18n/locales/en/index.ts`, `src/i18n/locales/nl/index.ts`, `src/types.ts`
- Test: `tests/it/pack.test.ts`

**Interfaces:**
- Produces (`spec.ts`): `ItalianTenses` (GD §2.1), `ItalianClassHint = 'isc' | 'plain'`, `ItalianGender = 'masculine' | 'feminine'`, `ItalianStemHints = { past?: string; participle?: string; future?: string; stressedI?: boolean }`, `ItalianSubject = '1sg' | '2sg' | '3sg.m' | '3sg.f' | '3sg.formal' | '1pl' | '2pl' | '3pl' | '3pl.formal'`, `ItalianSpec extends LanguageSpec<ItalianTenses>` with `nonFinite: 'infinitive' | 'participle' | 'gerund'`, `subject: ItalianSubject`, `auxiliary: 'avere' | 'essere'`, `classHint: ItalianClassHint`, `stems: ItalianStemHints`, `context: { readonly reflexive?: boolean; readonly gender?: ItalianGender }`.
- Produces: `italianCatalogue: readonly CatalogueEntry[]` (22 entries, GD §2.1 order and labels; both imperative entries carry `slots: ['2sg', '3sg.formal', '1pl', '2pl', '3pl.formal']`, as the toy's imperative lists its slots); `italianSubjects: readonly SubjectSlot[]` (GD §2.2, ids `1sg 2sg 3sg.m 3sg.f 3sg.formal 1pl 2pl 3pl 3pl.formal`); `italianOptions` typed through `LanguagePack<'it'>['options']` (fields `reflexive`, `gender`, `auxiliary`, `classHint`, `stems`) (GD §2.3 incl. `check`); `italianRendering: PackRendering` (`sandhi` → null, `bareOmits` → false, vowel/consonant onset); `italianRules` = `defineRules({...})` with **all 74 ids of GD §4** and their stage, kind and params; `italianWorks` (ids `treccani-edi`, `treccani-lgi`, `treccani-voc`, `serianni`, `dop`); `italianCitations satisfies Record<keyof typeof italianRules, Citation | readonly Citation[]>`; `en`/`nl` message objects `satisfies Record<keyof typeof italianRules, string>` exported as `it`.
- Produces (`pack.ts`): `italianPack: LanguagePack<'it'>` with `label: 'Italian'`, `subjects`, `subjectsFor(query)` = `defaultSubjectsFor(italianSubjects, query)` without the gendered slot of the other gender when `query.gender` is set, `genderedTargets: true`, `rank(form)` = `variantRank(form.variant, 'rectified')` then pattern order as generated, `engine: query => stagedEngine(italianGrammar, italianRendering, query)`, `rules`, `works`, `citations`.
- Produces (`grammar.ts`): `italianGrammar: StagedGrammar<ItalianLexeme>` whose hooks throw `GENERATION_FAILURE` "Italian <stage> is not built yet" until Tasks 2–4 replace them; `ItalianLexeme` is declared in Task 2's `lexicon.ts` (here a placeholder `interface ItalianLexeme extends LexemeBase {}` in `lexicon.ts`).

- [ ] **Step 1: Write the failing test** `tests/it/pack.test.ts`:

```ts
it('registers Italian', () => { expect(languages).toContain('it'); });
it('has the 22 catalogue entries in order', () => {
  expect(getCatalogue('it').map(e => `${e.mood}.${e.tense}`)).toEqual([
    'indicative.present', 'indicative.perfect', 'indicative.imperfect', 'indicative.pluperfect', 'indicative.simple_past',
    'indicative.past_anterior', 'indicative.future', 'indicative.future_perfect', 'subjunctive.present', 'subjunctive.past',
    'subjunctive.imperfect', 'subjunctive.pluperfect', 'conditional.present', 'conditional.past', 'imperative.present',
    'imperative.negative', 'infinitive.present', 'infinitive.past', 'participle.present', 'participle.past', 'gerund.present', 'gerund.past']);
  expect(getCatalogue('it')[4]!.tenseLabel).toBe('Passato remoto');
});
it('declares the subject slots', () => {
  expect(getSubjects('it').map(s => [s.id, s.pronoun, s.default])).toEqual([
    ['1sg', 'io', true], ['2sg', 'tu', true], ['3sg.m', 'lui', true], ['3sg.f', 'lei', true], ['3sg.formal', 'Lei', false],
    ['1pl', 'noi', true], ['2pl', 'voi', true], ['3pl', 'loro', true], ['3pl.formal', 'Loro', false]]);
  expect(getSubjects('it').find(s => s.id === '3sg.formal')!.person).toBe(3);
});
it('validates options', () => {
  expect(() => parseConjugationOptions({ language: 'it', infinitive: 'vedere', stems: { future: 'ved' } })).toThrow(ConjugationError);
  expect(() => parseConjugationOptions({ language: 'it', infinitive: 'x', gender: 'neuter' })).toThrow('Invalid gender');
});
it('the CLI lists Italian', () => { /* spawn dist/cli.js --help as tests/cli.test.ts does; stdout contains 'Italian (it)' */ });
```

- [ ] **Step 2:** `npx vitest run tests/it/pack.test.ts` — FAIL (`it` is not a language).
- [ ] **Step 3:** Implement the files above and the shared one-line registrations. Write all 74 rule definitions, both message files (English text from GD §4) and all citations now, so the completeness gate covers the pack from this commit on.
- [ ] **Step 4:** `npm run typecheck && npm test` at the root — PASS, including `tests/i18n/completeness.test.ts` for `it`.
- [ ] **Step 5:** Commit `feat(conjugation-engine): Italian pack skeleton, catalogue, subjects, rules and messages`.

### Task 2: Lexicon, families and classification

**Files:**
- Create: `src/languages/it/lexicon.ts` (entries, GD §5.1–5.2), `lists.ts` (side lists, GD §5.4), `families.ts` (GD §3.4), `classify.ts`
- Modify: `src/languages/it/grammar.ts` (`classify`, `lexemeOf`), `sources.ts` (`lexiconVerification`), message files if wording changes
- Test: `tests/it/classify.test.ts`

**Interfaces:**
- Produces (`lexicon.ts`): `ItalianEntry` (GD §5.1), `italianLexicon: Readonly<Record<string, ItalianEntry>>`, and

```ts
export interface ItalianLexeme extends LexemeBase {
  readonly base: string;                       // lemma without -si (lavare for lavarsi)
  readonly conjugation: 'are' | 'ere' | 'ire';
  readonly root: string;                       // stem before endings: parl, cred, fin, fac, conduc
  readonly isc: 'yes' | 'no';                  // one paradigm; 'both' becomes two lexemes
  readonly stressedI: boolean;
  readonly palatal: boolean;
  readonly entry: ItalianEntry | null;         // own or inherited lexical data
  readonly family: { readonly prefix: string; readonly base: string } | null;
  readonly auxiliaryConditions: Readonly<Record<string, string>>; // condition gloss per auxiliary (dual verbs)
}
```

- Produces (`families.ts`): `resolveFamily(base: string): { prefix: string; base: string; entry: ItalianEntry; assumed: boolean } | null` and `noInherit: ReadonlySet<string>`; (`classify.ts`): `classifyItalian(query): Fork<ItalianLexeme>` implementing GD §3.2 in order; `lexemeOfItalian(lemma): ItalianLexeme` for auxiliaries.
- Produces (`sources.ts`): `lexiconVerification: Readonly<Record<string, { url: \`https://${string}\`; status: 'vocabolario' | 'secondary' }>>`.

- [ ] **Step 1: Verify the lexicon by hand.** For every lemma in GD §5.2 and §5.4, open its Vocabolario entry (URL rules in GD §5.2), compare the header with the planned entry, record `lexiconVerification[lemma]`. Entries marked [U] in GD §5 that the Vocabolario contradicts follow the Vocabolario; note each change in the commit message. Fill Serianni locators in `sources.ts` where the book is at hand; otherwise leave `unverified: true`.
- [ ] **Step 2: Write the failing test** `tests/it/classify.test.ts` (`analysis` from `conjugate({ language: 'it', infinitive, mood: 'infinitive' })`, `ruleIds(steps)` = rule ids in order):

```ts
it('classifies by ending with assumptions', () => {
  const a = analysis('blorpare');
  expect(a.classification).toBe('are');
  expect(ruleIds(a.steps)).toEqual(['it.classify.conjugation', 'it.classify.assume-regular', 'it.classify.assume-avere']);
  expect(ruleIds(analysis('tronire').steps)).toContain('it.classify.assume-isc');
  expect(ruleIds(analysis('trebiare').steps)).toContain('it.classify.assume-unstressed-i');
  expect(ruleIds(analysis('sbonciare').steps)).not.toContain('it.classify.assume-unstressed-i'); // graphic i
});
it('reads the lexicon and side lists', () => {
  expect(analysis('venire')).toMatchObject({ classification: 'ire', classificationSource: 'lexicon', auxiliaries: ['essere'] });
  expect(analysis('essere').classification).toBe('irregular');
  expect(analysis('dormire').classification).toBe('ire');
  expect(analysis('finire').classification).toBe('ire-isc');
  expect(analysis('correre').auxiliaries).toEqual(['essere', 'avere']);
  expect(ruleIds(analysis('inviare').steps)).toContain('it.classify.stressed-i');
  expect(analysis('smentire').classification).toBe('ire-isc');
});
it('returns two paradigms for isc/plain verbs', () => {
  const a = analysis('mentire');
  expect(a.alternatives).toHaveLength(1);
  expect(analysis('mentire', { classHint: 'plain' }).alternatives).toBeUndefined();
});
it('handles reflexives', () => {
  const a = analysis('lavarsi');
  expect(a).toMatchObject({ lemma: 'lavarsi', reflexive: true, auxiliaries: ['essere'] });
  expect(ruleIds(a.steps)).toEqual(expect.arrayContaining(['it.classify.reflexive', 'it.classify.reflexive-essere']));
  expect(ruleIds(a.steps)).not.toContain('it.classify.assume-avere');
  expect(analysis('lavare', { reflexive: true }).reflexive).toBe(true);
});
it('inherits through families safely', () => {
  expect(ruleIds(analysis('comporre').steps)).toContain('it.classify.family');
  expect(ruleIds(analysis('sbradurre').steps)).toEqual(expect.arrayContaining(['it.classify.contracted', 'it.classify.assume-family']));
  expect(ruleIds(analysis('stramettere').steps)).toEqual(expect.arrayContaining(['it.classify.family', 'it.classify.assume-avere']));
  expect(ruleIds(analysis('blomettere').steps)).toContain('it.classify.assume-regular');
  expect(ruleIds(analysis('restare').steps)).toContain('it.classify.no-inherit');
  expect(analysis('percorrere').auxiliaries).toEqual(['avere']);           // auxiliary never inherited from correre
});
it('applies hints', () => {
  expect(analysis('tronire', { classHint: 'plain' }).classification).toBe('ire');
  expect(analysis('correre', { auxiliary: 'avere' }).auxiliaries).toEqual(['avere']);
  expect(() => analysis('venire', { auxiliary: 'avere' })).toThrow(expect.objectContaining({ code: 'INVALID_HINT' }));
  expect(() => analysis('parlare', { classHint: 'isc' })).toThrow(expect.objectContaining({ code: 'INVALID_HINT' }));
});
it('rejects what it cannot model and tolerates dictionary accents', () => {
  for (const bad of ['andarsene', 'farcela', 'blorrre', 'parlar']) expect(() => analysis(bad)).toThrow(expect.objectContaining({ code: 'INVALID_INFINITIVE' }));
  expect(analysis('créscere').lemma).toBe('crescere');
  expect(analysis('Parlàre').lemma).toBe('parlare');
});
it('verifies every lexicon lemma', () => {
  for (const lemma of Object.keys(italianLexicon)) expect(lexiconVerification[lemma], lemma).toBeDefined();
});
```

- [ ] **Step 3:** `npx vitest run tests/it/classify.test.ts` — FAIL.
- [ ] **Step 4:** Implement `lexicon.ts`, `lists.ts`, `families.ts`, `classify.ts`; wire `classify` and `lexemeOf` into `italianGrammar`. Two-paradigm verbs return two outcomes tagged `pattern: 'isc' | 'plain'`.
- [ ] **Step 5:** `npm run typecheck && npm test` — PASS.
- [ ] **Step 6:** Commit `feat(conjugation-engine): Italian lexicon, families and classification with cited assumptions`.

### Task 3: Stems, endings and spelling rules for the simple finite tenses

**Files:**
- Create: `src/languages/it/paradigms.ts` (ending tables, GD §4.6), `stems.ts`, `orthography.ts`
- Modify: `src/languages/it/grammar.ts` (`cellOf` for simple finite cells, `cell`, `stem`, `ending`, `orthography`)
- Test: `tests/it/simple.test.ts`

**Interfaces:**
- Consumes: `ItalianLexeme`, `italianLexicon` (Task 2).
- Produces: `cellOfItalian(target, lexeme): Cell | null` — simple finite targets → their own cell (imperative person 3 is an `imperative/present` cell of person 3, built from the subjunctive by `it.end.imperative-subjunctive`); `imperative.negative` 2sg → `{ kind: 'nonFinite', form: 'infinitive' }`, its other persons → the `imperative/present` cell of that person; `infinitive.present`, `gerund.present`, `participle.present`, `participle.past` → non-finite cells `infinitive`, `gerund`, `presentParticiple`, `participle`; the nine periphrastic targets of GD §6.1 → null; `stemOf(lexeme, cell): Fork<string>`, `endingOf(lexeme, cell, stem): Fork<string>`, `wholeCell(lexeme, cell): Fork<string> | null`; `italianSpelling: readonly JunctureRule<{ lexeme: ItalianLexeme; cell: Cell }>[]` = `[velarH, palatalIDrop, iMerge, participleCi, finalAccent]` in that order with the triggers of GD §4.4. `it.orth.final-accent` is applied by `wholeCell` when a family member's form is the base's monosyllable plus a prefix.

- [ ] **Step 1: Write the failing test** `tests/it/simple.test.ts` with `bare(infinitive, mood, tense, options?)` = bare texts in catalogue/slot order (one entry per target; alternatives joined with `/` in rank order):

```ts
it('conjugates regular verbs', () => {
  expect(bare('parlare', 'indicative', 'present')).toEqual(['parlo', 'parli', 'parla', 'parla', 'parliamo', 'parlate', 'parlano']); // lui, lei
  expect(bare('credere', 'indicative', 'simple_past')).toEqual(['credetti/credei', 'credesti', 'credette/credé', 'credette/credé', 'credemmo', 'credeste', 'credettero/crederono']);
  expect(bare('battere', 'indicative', 'simple_past')[0]).toBe('battei');
  expect(bare('dormire', 'subjunctive', 'present')[0]).toBe('dorma');
});
it('applies each spelling rule with its step', () => {
  expect(form('cercare', 'indicative', 'present', '2sg')).toMatchObject({ text: 'tu cerchi', rules: expect.arrayContaining(['it.orth.velar-h']) });
  expect(bareOf('pagare', 'indicative', 'future', '1sg')).toBe('pagherò');
  expect(form('cominciare', 'indicative', 'future', '1sg').rules).toContain('it.orth.palatal-i-drop'); // comincerò
  expect(bareOf('lasciare', 'indicative', 'present', '1pl')).toBe('lasciamo');
  expect(bareOf('studiare', 'indicative', 'present', '2sg')).toBe('studi');
  expect(bareOf('inviare', 'indicative', 'present', '2sg')).toBe('invii');
  expect(bareOf('inviare', 'indicative', 'present', '1pl')).toBe('inviamo');
  expect(bareOf('sciare', 'subjunctive', 'present', '3pl')).toBe('sciino');
  expect(bareOf('sciare', 'indicative', 'future', '1sg')).toBe('scierò');
  expect(bareOf('tagliare', 'indicative', 'future', '2sg')).toBe('taglierai');
  expect(bare('sognare', 'indicative', 'present')).toContain('sogniamo');
  expect(bare('sognare', 'indicative', 'present').join('/')).not.toContain('sognamo');
  expect(bareOf('rifare', 'indicative', 'present', '3sg.m')).toBe('rifà');
  expect(form('rifare', 'indicative', 'present', '3sg.m').rules).toContain('it.orth.final-accent');
});
it('uses -isc- and lexical stems', () => {
  expect(bare('finire', 'indicative', 'present')).toEqual(['finisco', 'finisci', 'finisce', 'finisce', 'finiamo', 'finite', 'finiscono']);
  expect(bareOf('venire', 'subjunctive', 'present', '1sg')).toBe('venga');
  expect(form('venire', 'subjunctive', 'present', '1sg').rules).toContain('it.stem.subjunctive-from-1sg');
  expect(bareOf('dovere', 'subjunctive', 'present', '2pl')).toBe('dobbiate');
  expect(bareOf('uscire', 'indicative', 'present', '1pl')).toBe('usciamo');
  expect(bareOf('cucire', 'indicative', 'present', '1sg')).toBe('cucio');
  expect(bareOf('apparire', 'indicative', 'present', '1sg')).toBe('appaio/apparisco');
});
it('builds strong pasts and syncopated futures', () => {
  expect(bare('prendere', 'indicative', 'simple_past')).toEqual(['presi', 'prendesti', 'prese', 'prese', 'prendemmo', 'prendeste', 'presero']);
  expect(bare('vedere', 'indicative', 'future')[0]).toBe('vedrò');
  expect(bareOf('bere', 'conditional', 'present', '3pl')).toBe('berrebbero');
  expect(bareOf('morire', 'indicative', 'future', '1sg')).toBe('morirò/morrò');
  expect(bareOf('tradurre', 'indicative', 'imperfect', '1sg')).toBe('traducevo');
  expect(bareOf('porre', 'indicative', 'present', '1sg')).toBe('pongo');
});
it('keeps two accepted spellings with their labels', () => {
  const vado = forms('andare', 'indicative', 'present', '1sg');
  expect(vado.map(f => [bareText(f), f.variant.usage, f.preferred])).toEqual([['vado', 'standard', true], ['vo', 'literary', false]]);
  expect(bareOf('dovere', 'indicative', 'present', '1sg')).toBe('devo/debbo');
});
it('builds imperatives', () => {
  expect(bare('parlare', 'imperative', 'present')).toEqual(['parla', 'parliamo', 'parlate']);             // tu noi voi
  expect(bare('parlare', 'imperative', 'present', { subject: '3sg.formal' })).toEqual(['parli']);
  expect(bare('fare', 'imperative', 'present')[0]).toBe("fai/fa'");
  expect(bare('dire', 'imperative', 'present')[0]).toBe("di'");
  expect(bare('sapere', 'imperative', 'present')).toEqual(['sappi', 'sappiamo', 'sappiate']);
  expect(bare('parlare', 'imperative', 'negative')).toEqual(['non parlare', 'non parliamo', 'non parlate']);
  expect(bareOf('finire', 'imperative', 'present', '3pl.formal')).toBe('finiscano');
});
it('keeps final-accent forms apart', () => {
  expect(bareOf('parlare', 'indicative', 'present', '1sg')).toBe('parlo');
  expect(bareOf('parlare', 'indicative', 'simple_past', '3sg.m')).toBe('parlò');
});
it('explains a form step by step', () => {
  expect(form('cominciare', 'indicative', 'future', '1sg').rules).toEqual(
    ['it.clause.subject', 'it.stem.infinitive', 'it.end.future-ar-er', 'it.orth.palatal-i-drop']);
});
```

(`form(...).rules` = the form's `ruleIds`: its own clause-level steps first, then each part's word-level steps, as `ruleIdsOf` in `src/core/staged.ts` orders them; the last test pins GD §7 derivation 3.)

- [ ] **Step 2:** `npx vitest run tests/it/simple.test.ts` — FAIL.
- [ ] **Step 3:** Implement `paradigms.ts`, `stems.ts`, `orthography.ts` and the hooks. The clause's subject part is already needed here: implement `clause.assemble` for finite simple forms (subject part, `it.clause.subject` / `it.clause.formal-subject`) and `agreements` returning `one(null)`; Task 4 completes the clause.
- [ ] **Step 4:** `npm run typecheck && npm test` — PASS.
- [ ] **Step 5:** Commit `feat(conjugation-engine): Italian stems, endings and spelling rules for the simple tenses`.

### Task 4: Non-finite forms, compound tenses, clause and availability

**Files:**
- Create: `src/languages/it/periphrasis.ts` (nine chains, GD §6.1), `clause.ts` (GD §6.2–6.3), `availability.ts`
- Modify: `src/languages/it/grammar.ts`, `stems.ts`/`paradigms.ts` (infinitive, gerund, participles)
- Test: `tests/it/compound.test.ts`

**Interfaces:**
- Produces: `italianPeriphrases: readonly Periphrasis<ItalianLexeme>[]` (rule ids `it.periphrasis.*`, each declaring `auxiliary: 'text'`); `italianClause: ClauseGrammar<ItalianLexeme>`; `availabilityOf(lexeme, target): Unavailability | null` (reasons: `noImperative` for `it.avail.no-imperative`, `impersonal` for `it.avail.impersonal`, `defective` for `it.avail.defective`; `source` = the citation URL).
- `agreements(context)` attaches the lexicon's condition gloss for `context.auxiliary` as a `condition` tag when the lexeme has two auxiliaries.

- [ ] **Step 1: Write the failing test** `tests/it/compound.test.ts`:

```ts
it('builds essere compounds with agreement for every gender', () => {
  expect(texts('andare', 'indicative', 'perfect')).toEqual(['io sono andato', 'io sono andata', 'tu sei andato', 'tu sei andata',
    'lui è andato', 'lei è andata', 'noi siamo andati', 'noi siamo andate', 'voi siete andati', 'voi siete andate', 'loro sono andati', 'loro sono andate']);
  const f = formWith('andare', 'indicative', 'perfect', '1sg', 'feminine');
  expect(f.target.agreement).toEqual({ gender: 'feminine', number: 'singular' });
  expect(f.rules).toEqual(expect.arrayContaining(['it.periphrasis.perfect', 'it.clause.agree-subject', 'it.cell.lexical']));
  expect(texts('andare', 'indicative', 'perfect', { gender: 'feminine' })).not.toContain('lui è andato');
  expect(texts('essere', 'indicative', 'past_anterior')[0]).toBe('io fui stato');
});
it('keeps avere participles invariable', () => {
  expect(texts('mangiare', 'indicative', 'perfect')).toEqual(['io ho mangiato', 'tu hai mangiato', 'lui ha mangiato', 'lei ha mangiato', 'noi abbiamo mangiato', 'voi avete mangiato', 'loro hanno mangiato']);
  expect(formWith('mangiare', 'indicative', 'perfect', '1sg').rules).toContain('it.clause.avere-invariable');
});
it('conjugates the courtesy forms in the third person', () => {
  expect(texts('andare', 'indicative', 'perfect', { subject: '3sg.formal' })).toEqual(['Lei è andato', 'Lei è andata']);
  expect(texts('parlare', 'indicative', 'present', { subject: '3pl.formal' })).toEqual(['Loro parlano']);
});
it('returns both auxiliaries of a dual verb, labelled', () => {
  const forms = all('correre', 'indicative', 'perfect', '1sg');
  expect(forms.map(f => [f.text, f.variant.auxiliary])).toEqual([['io sono corso', 'essere'], ['io sono corsa', 'essere'], ['io ho corso', 'avere']]);
  expect(forms.every(f => f.variant.condition)).toBe(true);
});
it('builds reflexive forms', () => {
  expect(texts('lavarsi', 'indicative', 'present')[0]).toBe('io mi lavo');
  expect(texts('lavarsi', 'indicative', 'perfect')).toContain('lei si è lavata');
  expect(bare('lavarsi', 'imperative', 'present')).toEqual(['lavati', 'laviamoci', 'lavatevi']);
  expect(bare('lavarsi', 'imperative', 'present', { subject: '3sg.formal' })).toEqual(['si lavi']);
  expect(bare('lavarsi', 'imperative', 'negative')[0]).toBe('non ti lavare/non lavarti');
  expect(bare('farsi', 'imperative', 'present')[0]).toBe('fatti');
  expect(formWith('farsi', 'imperative', 'present', '2sg').rules).toContain('it.clause.enclitic-doubling');
  expect(bare('lavarsi', 'infinitive', 'present')).toEqual(['lavarsi']);
  expect(bare('lavarsi', 'gerund', 'present')).toEqual(['lavandosi']);
  expect(bare('lavarsi', 'infinitive', 'past')[0]).toBe('essersi lavato');
});
it('builds non-finite forms', () => {
  expect(bare('andare', 'participle', 'past')).toEqual(['andato', 'andata', 'andati', 'andate']);
  expect(bare('conoscere', 'participle', 'past')[0]).toBe('conosciuto');
  expect(bare('tradurre', 'gerund', 'present')).toEqual(['traducendo']);
  expect(bare('venire', 'participle', 'present')).toEqual(['veniente']);
  expect(bare('salire', 'participle', 'present')).toEqual(['salente/saliente']);
  expect(bare('accendere', 'infinitive', 'past')).toEqual(['avere acceso']);
  expect(bare('cadere', 'gerund', 'past')[0]).toBe('essendo caduto');
});
it('declares missing forms through availability', () => {
  expectUnavailable('potere', 'imperative', 'present', 'noImperative');
  expectUnavailable('dovere', 'imperative', 'negative', 'noImperative');
  expectUnavailable('sapere', 'participle', 'present', 'defective');
  const piove = conjugate({ language: 'it', infinitive: 'piovere', mood: 'indicative', tense: 'present' });
  expect(piove.forms.map(f => [f.text, f.target.subject])).toEqual([['piove', '3sg.m'], ['piovono', '3pl']]);
  expect(piove.unavailableTargets.map(u => [u.target.subject, u.reason])).toEqual([
    ['1sg', 'impersonal'], ['2sg', 'impersonal'], ['3sg.f', 'impersonal'], ['1pl', 'impersonal'], ['2pl', 'impersonal']]);
});
it('explains every form of a full query in both locales', () => {
  for (const verb of ['andare', 'lavarsi', 'correre', 'sbradurre']) for (const f of conjugate({ language: 'it', infinitive: verb }).forms) {
    for (const locale of ['en', 'nl']) expect(() => explain('it', f, locale)).not.toThrow();
  }
});
```

(An impersonal verb has no subject: its clause emits no subject part, and `availability` keeps only the unmarked third persons `3sg.m` and `3pl`, so `piove` is not doubled by the `lei` slot. GD §5.4 "impersonal".)

- [ ] **Step 2:** `npx vitest run tests/it/compound.test.ts` — FAIL.
- [ ] **Step 3:** Implement `periphrasis.ts`, `clause.ts`, `availability.ts` and the non-finite stems/endings. If the core's executor does not pass the agreement chosen by `agreements` into chain-element cells or rejects a `condition` tag from `agreements`, stop and report it as a core interface issue instead of working around it in the pack.
- [ ] **Step 4:** `npm run typecheck && npm test` — PASS.
- [ ] **Step 5:** Commit `feat(conjugation-engine): Italian compound tenses, agreement, reflexive clause and availability`.

### Task 5: Corpus parser and language module

The language is registered in `corpusLanguages` only in Task 6: `tests/corpus.test.ts` runs every registered file, so registering before the ledger exists would break the gate. This task therefore tests the parser on hand-written page fragments.

**Files:**
- Create: `scripts/corpus/parsers/it.ts`, `scripts/corpus/languages/it.ts`, `tests/it/corpus-parser.test.ts`, `tests/it/verbix-page.ts` (a test helper that builds a page in the source's markup)

**Interfaces:**
- Produces: `parseItalian(html: string, name: string): ParsedCorpus` and `italianCellsPerFile = 96` (GD §9.1–9.2: cell order, pronoun-prefixed expectations, `subject` on every finite cell, `heading` on remapped cells, cell 6 `scope: 'unmodelled'` reason `compound-participle`, imperative line 0 counted as a template placeholder, `notused` → `sourceUnavailable`). Cells are built with the object form of `corpusCell` (Plan 2 Task 6).
- Produces: `italian: CorpusLanguage` — `directory: 'Italiano'`, `encoding: 'utf-8'`, `expectedFiles: 20`, `cellsPerFile: 96`, `context` via `infinitiveFromFileName`, `correction: italianCorrection` (Task 6; a stub returning null here), `remaps` (the four of GD §9.3 with reason and URL), `unmodelled: { 'compound-participle': 'Italian has no compound participle; the source pairs avente/essente with the past participle mechanically.' }`, `query(file)` = labelled queries `default` (`{ language: 'it', infinitive }`), `formal-sg` (`{ …, mood: 'imperative', subject: '3sg.formal' }`), `formal-pl` (`{ …, mood: 'imperative', subject: '3pl.formal' }`); `applicable(file, cell, forms, label)` keeps forms whose `target.subject` equals the cell's `subject`, from the `formal-*` queries exactly when that subject is formal.
- Produces (test helper): `verbixPage(spec: { infinitive: string; nominal: string[][]; compound: [string, string, string]; finite: Record<'Indicativo' | 'Congiuntivo' | 'Condizionale', [label: string, rows: string[][]][]>; imperative: string[][]; notused?: boolean }): string` reproducing GD §9.1 markup exactly: `<font color=#007F00 face=Courier><span class="normal">io</span>&nbsp;…</font><span class="irregular">vado</span>; <span class="irregular">vo</span><br>`, `<b><br> Imperfetto</b>`, entities for accented letters (`&egrave;`), and the Imperativo `<tr><td>` without a `<table>`.

- [ ] **Step 1: Write the failing test** `tests/it/corpus-parser.test.ts`:

```ts
const page = verbixPage(andareLike);                  // andare's rows as listed in GD §9 (hand-written in the test file)
it('reads 96 cells in order', () => { expect(parseItalian(page, 'andare.html').cells).toHaveLength(96); });
it('reads rows with their pronouns, alternates and entities', () => {
  const cells = parseItalian(page, 'andare.html').cells;
  expect(cells[7]).toMatchObject({ target: { mood: 'indicative', tense: 'present', person: 1, number: 'singular' }, subject: '1sg', expected: ['io vado', 'io vo'] });
  expect(cells[9]!.expected).toEqual(['lui va']);
  expect(cells[13]!.expected).toEqual(['io sono andato']);                       // Passato prossimo, row io
  expect(cells[91]).toMatchObject({ target: { mood: 'imperative', person: 2 }, expected: ["va'", 'vai'] });
});
it('maps the mislabelled congiuntivo headings and the courtesy imperative', () => {
  const cells = parseItalian(page, 'andare.html').cells;
  expect(cells[61]).toMatchObject({ target: { mood: 'subjunctive', tense: 'past' }, heading: 'Congiuntivo/Passato prossimo', expected: ['io sia andato'] });
  expect(cells[92]).toMatchObject({ target: { mood: 'imperative', person: 3, number: 'singular' }, subject: '3sg.formal', expected: ['vada'] });
});
it('keeps the compound participle unmodelled, counts the placeholder, reads notused', () => {
  const parsed = parseItalian(page, 'andare.html');
  expect(parsed.cells[6]).toMatchObject({ scope: 'unmodelled', reason: 'compound-participle' });
  expect(parsed.templatePlaceholders).toBe(1);
  expect(parseItalian(verbixPage({ ...andareLike, notused: true }), 'potere.html').cells[91]!.sourceUnavailable).toBe(true);
});
it('fails loudly on a page it does not recognise', () => { expect(() => parseItalian('<html></html>', 'x.html')).toThrow('96 Italian cells'); });
```

- [ ] **Step 2:** `npx vitest run tests/it/corpus-parser.test.ts` — FAIL.
- [ ] **Step 3:** Implement `parsers/it.ts` and `languages/it.ts` (not yet registered).
- [ ] **Step 4:** `npm run typecheck && npm test` — PASS.
- [ ] **Step 5:** Commit `feat(conjugation-engine): Italian corpus parser and language module`.

### Task 6: Corpus green — fixtures, corrections ledger and over-generation guard

**Files:**
- Create: `scripts/corpus/corrections/it.ts`, `tests/fixtures/it.json` (imported), `tests/it/overgeneration.test.ts`
- Modify (one line each): `scripts/corpus/languages/index.ts` (add `italian`), `tests/corpus.test.ts` (`it: { files: 20, infinitives: 20, cells: 1_920, placeholders: 20 }`); regenerated `tests/fixtures/manifest.json`, `tests/fixtures/corrections.json`

**Interfaces:**
- Produces: `italianCorrection(file, cell, index): CorpusCorrection | null` implementing exactly the 13 rules of GD §9.4 with their reasons (> 30 characters) and URLs; 61 records.

- [ ] **Step 1: Register and import.** Add `italian` to `corpusLanguages` and the pin line; run `npm run corpus:import -- --source <pinned corpus checkout> --only it` (the pinned checkout; the script refuses another revision); `git diff --exit-code -- tests/fixtures/fr.json tests/fixtures/nl.json` → exit 0.
- [ ] **Step 2: Write the failing tests.** In `tests/it/overgeneration.test.ts`:

```ts
it('imports the pages as GD §9 describes', () => {
  expect(cell('dare', 'indicative', 'simple_past', '3sg.m').expected).toEqual(['lui diede', 'lui dette', 'lui dètte']);
  expect(cell('salire', 'participle', 'present').expected).toEqual(['salente', 'saliente']);
  expect(italianFixture.flatMap(f => f.cells).filter(c => c.scope === 'unmodelled')).toHaveLength(20);
});
it('pins the ledger', () => {
  const ledger = corrections.filter(c => c.file.startsWith('it/'));
  expect(ledger).toHaveLength(61);
  expect(ledger.filter(c => c.unavailable)).toHaveLength(7);       // dovere imperative ×5, sapere and potere participle.present
});
it('tags every extra form', () => {
  for (const file of italianFixture) for (const { options } of italian.query(file)) {
    // group conjugate(options).forms by resolvedTargetKey (subject and agreement included); within a group every form after
    // the first differs from the first in variant.auxiliary, pattern, usage, condition, orthography or region
  }
});
```

- [ ] **Step 3:** `npm run corpus:check` — FAIL on the 13 groups of GD §9.4 (and on any engine bug, which is fixed in the engine with a test in the owning task's file, never in the ledger).
- [ ] **Step 4:** Implement the ledger rules; re-import `--only it`.
- [ ] **Step 5:** `npm run typecheck && npm test && npm run corpus:check` — PASS; the report line for `it` reads 20 files / 1920 cells, 61 sourced corrections, 20 structural placeholders.
- [ ] **Step 6:** Commit `feat(conjugation-engine): Italian corpus passes with a sourced corrections ledger`.

### Task 7: Invented verbs, real verbs, authority cells and runtime explanations

**Files:**
- Create: `tests/it/novel.test.ts`, `tests/it/authority.test.ts`, `tests/goldens/it/authority/{prima-coniugazione,incoativi,terza-coniugazione,seconda-coniugazione,passato-remoto,coniugazione-verbale,imperativo,ausiliari,vocabolario,serianni}.json`
- Modify (one line): `tests/i18n/runtime.test.ts` (add `'it'`)

**Interfaces:**
- Consumes: the whole pack. Authority file schema and normalization: GD §8.3.

- [ ] **Step 1: Transcribe the authority files.** Open each page of GD §8.3 and copy what it prints into `printed`, with the target; derive `forms` by the normalization of GD §8.3 by hand (no script). `vocabolario.json` takes the forms of the 40 headers of GD §5.3 that belong to modelled cells; bracketed `ant./poet./pop./dial./tosc.` alternatives are left out; the unbracketed alternatives GD §8.3 names as not generated go into the cell's `excluded` list with that reason (`dò`, `dànno`, `dètte`, imperative `dà`/`va`/`fa`/`sta`/`dì`, `anderò`). `serianni.json` stays `{ "source": …, "cells": [] }` until someone with the book fills it.
- [ ] **Step 2: Write the failing tests.**
  - `tests/it/novel.test.ts`: one `it` per row of GD §8.1 asserting the listed forms (bare text; reflexive rows with the shown subjects) and the listed assumptions (rule ids from `analysis.steps` of kind `assumption`), e.g.:

```ts
it('blendere: regular -ere with both passato remoto series', () => {
  expect(bare('blendere', 'indicative', 'simple_past')).toEqual(['blendetti/blendei', 'blendesti', 'blendette/blendé', 'blendette/blendé', 'blendemmo', 'blendeste', 'blendettero/blenderono']);
  expect(bare('blendere', 'participle', 'past')[0]).toBe('blenduto');
});
it('flattere: -ei only after t', () => { expect(bare('flattere', 'indicative', 'simple_past')[0]).toBe('flattei'); });
it('sbradurre: the -durre family', () => {
  expect(bareOf('sbradurre', 'indicative', 'simple_past', '3pl')).toBe('sbradussero');
  expect(bare('sbradurre', 'participle', 'past')[0]).toBe('sbradotto');
  expect(assumptions('sbradurre')).toEqual(['it.classify.assume-family', 'it.classify.assume-avere']);
});
it('stramettere vs blomettere', () => {
  expect(bareOf('stramettere', 'indicative', 'simple_past', '1sg')).toBe('stramisi');
  expect(bareOf('blomettere', 'indicative', 'simple_past', '1sg')).toBe('blomettei');            // stem in t: -ei only
});
it('blorparsi: reflexive, essere, agreement', () => {
  expect(texts('blorparsi', 'indicative', 'perfect').slice(0, 2)).toEqual(['io mi sono blorpato', 'io mi sono blorpata']);
  expect(assumptions('blorparsi')).toEqual(['it.classify.assume-regular']);
});
```

  - `tests/it/authority.test.ts`: for every file in `tests/goldens/it/authority/`, every cell's `forms` are all among the bare texts generated for its query (with the cell's `subject` when given) and none of its `excluded` forms is; the file count is pinned (10) and the non-empty cell total is pinned after Step 1.
  - `tests/i18n/runtime.test.ts`: Italian queries are every corpus verb, every GD §8.1 verb and every authority lemma, unfiltered and with `subject: '3sg.formal'`.
- [ ] **Step 3:** `npx vitest run tests/it tests/i18n` — FAIL (new tests) until the engine matches; fix engine bugs with a test in the owning task's test file; never edit an expectation to match the engine without a source.
- [ ] **Step 4:** `npm run typecheck && npm test` — PASS.
- [ ] **Step 5:** Commit `test(conjugation-engine): Italian invented verbs, Treccani authority cells and runtime explanations`.

### Task 8: en.wiktionary second oracle

Split from Task 7 because it adds a network importer, a second parser and its own ledger, which a reviewer can accept or reject independently of the hand-written tests.

**Files:**
- Create: `scripts/corpus/sources/wiktionary-it.ts` (pins, fetch CLI, parser), `scripts/corpus/corrections/wiktionary-it.ts`, `tests/fixtures/wiktionary-it.json` (imported), `tests/it/wiktionary.test.ts`

**Interfaces:**
- Produces (`wiktionary-it.ts`):

```ts
export const wiktionaryPins: { readonly pages: readonly { title: string; revid: number }[]; readonly modules: Readonly<Record<string, number>> };
export interface WiktionaryCell { readonly key: string; readonly mood: string; readonly tense: string; readonly subject: string | null;
  readonly forms: readonly { text: string; notes: readonly string[] }[]; readonly unavailable: boolean; readonly scope?: 'unmodelled'; readonly reason?: string }
export interface WiktionaryPage { readonly title: string; readonly revid: number; readonly url: string; readonly history: string;
  readonly auxiliaries: readonly { lemma: string; notes: readonly string[] }[]; readonly cells: readonly WiktionaryCell[] }
export interface WiktionaryFixture { readonly licence: 'CC BY-SA 4.0'; readonly attribution: string; readonly retrieved: string;
  readonly modules: Readonly<Record<string, number>>; readonly pages: readonly WiktionaryPage[] }
export function parseWiktionaryItalian(html: string, title: string): Omit<WiktionaryPage, 'revid' | 'url' | 'history'>;
```

  CLI: `node --experimental-strip-types scripts/corpus/sources/wiktionary-it.ts [--accept-modules]` fetches the module revisions, refuses on a mismatch unless `--accept-modules`, fetches every pinned page with `action=parse&oldid=…` (GD §8.4), parses and writes the fixture. Pins: the 63 titles and revisions and the 5 module revisions of GD §8.4.
- Produces (`corrections/wiktionary-it.ts`): `wiktionaryItalianCorrection(page, cell): { expected: string[]; unavailable: boolean; reason: string; source: string } | null`, each with a reason (> 30 characters) and a Treccani URL.

- [ ] **Step 1: Write the failing parser test** in `tests/it/wiktionary.test.ts` against three small HTML fixtures cut from real responses and stored under `tests/it/wiktionary-samples/{parlare,lavarsi,andare}.html` (only the conjugation `NavFrame`; keep the CC BY-SA attribution comment at the top of each sample):

```ts
it('parses a regular table', () => {
  const p = parseWiktionaryItalian(sample('parlare'), 'parlare');
  expect(p.cells).toHaveLength(57 - 1);                              // auxiliary is separate
  expect(cell(p, 'indicative.present.1sg').forms.map(f => f.text)).toEqual(['parlo']);
  expect(cell(p, 'conditional.present.3sg').forms.map(f => f.text)).toEqual(['parlerebbe']);   // stress variants collapse
  expect(cell(p, 'imperative.negative.2sg').forms.map(f => f.text)).toEqual(['non parlare']);
  expect(p.auxiliaries).toEqual([{ lemma: 'avere', notes: [] }]);
});
it('reads clitics, alternatives and footnotes', () => {
  expect(cell(parse('lavarsi'), 'imperative.negative.2sg').forms.map(f => f.text)).toEqual(['non lavarti', 'non ti lavare']);
  expect(cell(parse('lavarsi'), 'participle.past').scope).toBe('unmodelled');
  expect(cell(parse('andare'), 'imperative.present.2sg').forms.map(f => f.text)).toEqual(['vai', "va'"]);
  expect(cell(parse('andare'), 'indicative.present.3sg').forms[0]!.notes).toEqual(['With syntactic gemination after the verb.']);
});
it('uses only the first table', () => { expect(cell(parse('andare'), 'indicative.present.1sg').forms.map(f => f.text)).toEqual(['vado']); });
```

- [ ] **Step 2:** `npx vitest run tests/it/wiktionary.test.ts` — FAIL.
- [ ] **Step 3:** Implement the parser; run the CLI once (about 25 minutes at 20 s per request); review the fixture by eye for five verbs; add the oracle test to `tests/it/wiktionary.test.ts`: for every page and cell, apply the ledger, then every expected form is among the bare texts the engine generates for the cell's target (finite 3sg → `3sg.m`, imperative 3rd persons → formal slots), unavailable cells generate nothing, the auxiliary set equals `analysis.auxiliaries`; pin pages (63), cells, blanks, unmodelled cells and ledger size after the first green run. Expected ledger entries are listed at the end of GD §8.4.
- [ ] **Step 4:** `npm run typecheck && npm test` — PASS.
- [ ] **Step 5:** Commit `test(conjugation-engine): en.wiktionary second oracle for 63 Italian verbs with a sourced ledger`.

### Task 9: Documentation and equivalence map

**Files:**
- Create: `docs/grammar/it.md`; `src/equivalence/it.ts` only if `src/equivalence/` exists
- Modify (one line each): `README.md` (language list), `src/equivalence/index.ts` (if it exists)
- Test: `tests/it/docs.test.ts`

- [ ] **Step 1: Write the failing test** `tests/it/docs.test.ts`: `docs/grammar/it.md` mentions every rule id of `italianRules` exactly once in its rule table, and states the counts `1,920`, `61` and `63`; if `src/equivalence/it.ts` exists, every catalogue tense has at least one concept link (the equivalence module's own completeness test also covers it).
- [ ] **Step 2:** `npx vitest run tests/it/docs.test.ts` — FAIL.
- [ ] **Step 3:** Write `docs/grammar/it.md`: rule inventory (id, statement, trigger, citation URL) generated by hand from `rules.ts` + `sources.ts`; defaults and their assumptions; subject slots and the pro-drop decision; limits (GD §2.4); corrections summary (scraped corpus and Wiktionary, with counts); the tense-concept table (GD §10) when no equivalence module exists, otherwise `src/equivalence/it.ts` with those weights. Add the README line `- Italian (it): rule-first, explanations in English and Dutch`.
- [ ] **Step 4:** `npm run typecheck && npm test && npm run corpus:check` — PASS; CLI spot checks recorded in the commit message: `npm run cli -w conjugation-engine -- it sbradurre --explain --locale nl`, `… it lavarsi --mood imperative`, `… it andare --mood indicative --tense perfect --subject 3sg.formal`.
- [ ] **Step 5:** Commit `docs(conjugation-engine): Italian grammar reference and tense concepts`.
