# Seven-Language Engine — Plan 4: Tense Equivalence

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** `equivalentTenses(from, to, tense)`: for a tense of one registered language, the ranked tenses of another that a trainer can ask for, with scores, match type, register and localized notes, backed by a checked-in snapshot of the whole source × target matrix.

**Architecture:** A pivot. Each language maps every one of its catalogue tenses to weighted links to a closed inventory of 41 language-neutral tense concepts (`src/equivalence/<code>.ts`, a total map whose type is derived from the language's tenses in the registry, so a missing tense is a compile error). A pure function (`derive.ts`) turns two maps into a ranked list: shared concepts first, a fixed relaxation ladder when none is shared, per-pair overrides last. Part A builds the module with French and Dutch and the snapshot machinery; Part B is one small task per further language (de, es, it, la, en), each runnable as soon as that language is registered.

**Tech Stack:** TypeScript 7 strict (`exactOptionalPropertyTypes`, `noUncheckedIndexedAccess`), Node 26, Vitest 5 (`toMatchFileSnapshot`). No new dependencies.

**Spec:** `docs/superpowers/specs/2026-11-24-seven-language-engine-design.md` (section "Tense equivalence"). Design input: `docs/superpowers/research/2026-11-24-core-architecture-and-french-rebuild-design.md` (section E, notes N6 and N7) and section 10 of each `docs/superpowers/research/2026-11-24-{fr,de,en,es,it,la}-grammar-design.md`.

**Builds on:** Plans 1–3 (the registry, `getCatalogue`, the message catalogs and their completeness gate, the French and Dutch catalogues). It reads `src/languages/registry.ts` (`Language`, `LanguageRegistry`), `src/types.ts` (`MoodFor`, `TenseFor`), `src/i18n/locales/`, `src/i18n/format.ts` and `src/errors.ts`; it modifies none of the language packs. The grammar-design tables are the data source; where this plan differs from them it says so in "Reconciliation" and "Open questions".

## Global Constraints

- All paths are relative to `packages/conjugation-engine/` unless they start with `apps/` or `docs/`.
- Branch `feat/seven-language-engine`; one commit per task; every commit keeps `npm run typecheck && npm test` green at the workspace root. Start from a clean tree: the uncommitted edits to `src/core/pack.ts`, `tests/i18n/completeness.test.ts`, `tests/pack.test.ts` and `tests/toy/pack.ts` belong to another work item and this plan does not touch them (it needs no edit to the completeness test: that test already compares the key sets of the merged `en` and `nl` catalogs, which will include the `eq.*` keys).
- The engine keeps zero runtime dependencies. Nothing under `src/` imports `node:*`, `scripts/` or `tests/`. `src/equivalence/` imports only types from `src/languages/` and `src/i18n/` (erased at build) plus `ConjugationError` from `src/errors.ts`, so the `./equivalence` subpath loads without the packs and passes the "no Node imports" graph walk of `tests/package.test.ts`.
- French and Dutch conjugation output is unchanged: no file under `src/languages/`, `src/core/`, `scripts/` or `tests/characterization/` is modified, and `npm run corpus:check` still passes.
- The app compiles unchanged and is not switched to the new function: no file under `apps/` is modified. A test reads `apps/verbodrome/src/trainer/prompt.ts` as text, only as a drift guard for the acceptance tables (the later step that switches the app deletes that guard with the tables).
- Public API: `equivalentTenses(from, to, tense, options?)` is exported from the package root and from the new `./equivalence` subpath (`package.json` `exports`), typed so that `tense` is a `{ mood, tense }` valid for `from`. It does not depend on `createEngine`: equivalence is static data over the registry's languages.
- Totality: for every `L` in `Language`, `src/equivalence/index.ts` holds a map `satisfies LanguageMap<L>`; for every catalogue tense of `L` the map has a key, in catalogue order, with at least one link. A missing tense is a compile error; a tense the language does not have is a compile error.
- Weights are multiples of 0.1 in (0, 1]; a score is the product of two weights rounded to two decimals.
- Notes are message keys `eq.*` in the core catalogs of `en` and `nl` (`src/i18n/locales/{en,nl}/equivalence/`), identical key sets, plain text with no placeholders and no straight apostrophe, so `locales[locale][key]` is the displayed text. The English text in this plan is the text; the Dutch text is the plan author's and needs a Dutch reader's pass (Open questions).
- Languages arrive at different times. Part A maps exactly the languages in `LanguageRegistry` when it runs; each Part B task assumes its language is registered and is otherwise independent of the others.

## Review Focus

1. **A tense with no counterpart.** Latin supine, gerundive, future participle and future infinitive have no counterpart in any other language, and English progressives and perfect infinitives sit awkwardly in Dutch and French. Expected: `equivalentTenses` never returns an empty array; it returns one `{ match: 'none', tense: null }` entry whose `notes` name why (`eq.note.no-counterpart` plus the source tense's own note, for example `eq.la.supine`), and an English progressive is never `none` (`en` present progressive → `nl` indicative present 0.90, note `eq.en.progressive`). A passive Latin tense asked into a language without a modelled passive returns the active tenses flagged `approximate` with `eq.note.passive-not-modelled`. → Task 3 (ladder never relaxes finiteness, time, relative time or polarity; `none` and voice cases), Task 5 (voice), Task 6 (expectation rows), B4 (passive).
2. **A literary tense.** French passé simple, passé antérieur, subjonctif imparfait and plus-que-parfait, Italian passato remoto and trapassato remoto, Spanish pretérito anterior are `literary`; Spanish subjunctive future and future perfect are `dated`. Expected: a literary tense never outranks a standard tense of equal score (`la` perfect → `fr` lists passé composé before passé simple, both 1.00); a dated target is offered only when nothing else corresponds and then flagged `approximate` with `relaxed: ['register']` (`de` subjunctive future → `es` subjunctive future); each result carries the `register` of the target tense so a trainer can filter. → Task 3, Task 6, B2.
3. **A subjunctive (or conditional) into a language without one.** French subjunctive into Dutch has no subjunctive tense; English subjunctive, Latin subjunctive and German Konjunktiv I into Dutch likewise; German subjunctive future into French (French has subjunctives, but no future one). Expected: top result is the indicative tense of the same time reference and relative time, `match: 'approximate'`, `relaxed: ['mood']`, note `eq.note.no-subjunctive`; the four French subjunctives reproduce the app's `SUBJUNCTIVE` table; a negative imperative into a language without one is the plain imperative with `eq.note.negation-added`, never `none`. → Task 3, Task 6, B1–B4.
4. **The two-way asymmetry of passé composé against simple past and present perfect.** French passé composé → Dutch perfect (0.80), but French passé simple → Dutch past (0.70) while Dutch past → French imparfait first (1.00), passé composé and passé simple after it (0.70); French passé composé → Spanish simple past first (1.00), Spanish simple past → French passé composé first; French passé composé → English present perfect 0.80 before simple past 0.60, while English simple past → French passé composé 0.60. A reader must not assume `equivalentTenses(a, b, t)[0]` inverts `equivalentTenses(b, a, ·)`. → Task 6 (both directions pinned), B2, B5.
5. **Non-finite forms.** Gerund, perfect infinitive, perfect participle and perfect gerund: Dutch has no gerund (French gérondif → Dutch present participle 0.50, note `eq.nl.gerund-as-participle`), no perfect infinitive or participle (stand-in on the past participle, `approximate`, 0.40, note saying how to build it), German has no gerund at all (`none`). Expected: finiteness is never relaxed, so an infinitive never answers a participle; stand-in links are used only when the language is the target (the Dutch past participle is not offered as "equivalent" of a French perfect infinitive when Dutch is the source). → Task 3 (`only`), Task 4, Task 6.

---

## Design (read before Task 1)

### The concept model

A concept is defined by dimensions; the names make the matrix reviewable, the dimensions drive the ladder. Voice is not a dimension of a concept: a passive Latin tense looks up the same concept and `equivalentTenses` takes a `voice` qualifier (design note N7). Two concepts never share all dimensions (a test).

Dimensions: `finiteness` (`finite | infinitive | participle | gerund | verbalAdjective | supine`), `mood` (`indicative | subjunctive | conditional | imperative`, `null` for non-finite), `time` (`past | present | future`: reference time), `relative` (`anterior | simultaneous | posterior`: event against reference), `aspect` (`neutral | perfective | imperfective | progressive`), optional `remoteness: 'near'`, optional `polarity: 'negative'`.

| Id | finiteness | mood | time | relative | aspect | remoteness | polarity |
|---|---|---|---|---|---|---|---|
| `PRESENT` | finite | indicative | present | simultaneous | neutral |  |  |
| `PRESENT_PROGRESSIVE` | finite | indicative | present | simultaneous | progressive |  |  |
| `PAST_PERFECTIVE` | finite | indicative | past | simultaneous | perfective |  |  |
| `PAST_IMPERFECTIVE` | finite | indicative | past | simultaneous | imperfective |  |  |
| `PAST_PROGRESSIVE` | finite | indicative | past | simultaneous | progressive |  |  |
| `PRESENT_PERFECT` | finite | indicative | present | anterior | neutral |  |  |
| `PRESENT_PERFECT_PROGRESSIVE` | finite | indicative | present | anterior | progressive |  |  |
| `PLUPERFECT` | finite | indicative | past | anterior | neutral |  |  |
| `PLUPERFECT_PROGRESSIVE` | finite | indicative | past | anterior | progressive |  |  |
| `PAST_ANTERIOR` | finite | indicative | past | anterior | perfective |  |  |
| `FUTURE` | finite | indicative | future | simultaneous | neutral |  |  |
| `FUTURE_PROGRESSIVE` | finite | indicative | future | simultaneous | progressive |  |  |
| `FUTURE_PERFECT` | finite | indicative | future | anterior | neutral |  |  |
| `FUTURE_PERFECT_PROGRESSIVE` | finite | indicative | future | anterior | progressive |  |  |
| `NEAR_FUTURE` | finite | indicative | present | posterior | neutral | near |  |
| `RECENT_PAST` | finite | indicative | present | anterior | neutral | near |  |
| `COND_PRESENT` | finite | conditional | present | simultaneous | neutral |  |  |
| `COND_PROGRESSIVE` | finite | conditional | present | simultaneous | progressive |  |  |
| `COND_PERFECT` | finite | conditional | present | anterior | neutral |  |  |
| `COND_PERFECT_PROGRESSIVE` | finite | conditional | present | anterior | progressive |  |  |
| `SUBJ_PRESENT` | finite | subjunctive | present | simultaneous | neutral |  |  |
| `SUBJ_IMPERFECT` | finite | subjunctive | past | simultaneous | imperfective |  |  |
| `SUBJ_PERFECT` | finite | subjunctive | present | anterior | neutral |  |  |
| `SUBJ_PLUPERFECT` | finite | subjunctive | past | anterior | neutral |  |  |
| `SUBJ_FUTURE` | finite | subjunctive | future | simultaneous | neutral |  |  |
| `SUBJ_FUTURE_PERFECT` | finite | subjunctive | future | anterior | neutral |  |  |
| `IMP_PRESENT` | finite | imperative | present | simultaneous | neutral |  |  |
| `IMP_NEGATIVE` | finite | imperative | present | simultaneous | neutral |  | negative |
| `IMP_FUTURE` | finite | imperative | future | simultaneous | neutral |  |  |
| `IMP_PERFECT` | finite | imperative | present | anterior | neutral |  |  |
| `INF_PRESENT` | infinitive | null | present | simultaneous | neutral |  |  |
| `INF_PERFECT` | infinitive | null | present | anterior | neutral |  |  |
| `INF_FUTURE` | infinitive | null | future | simultaneous | neutral |  |  |
| `PART_PRESENT` | participle | null | present | simultaneous | neutral |  |  |
| `PART_PAST` | participle | null | past | anterior | neutral |  |  |
| `PART_PERFECT` | participle | null | present | anterior | neutral |  |  |
| `PART_FUTURE` | participle | null | future | simultaneous | neutral |  |  |
| `GERUND` | gerund | null | present | simultaneous | neutral |  |  |
| `GERUND_PERFECT` | gerund | null | present | anterior | neutral |  |  |
| `GERUNDIVE` | verbalAdjective | null | future | simultaneous | neutral |  |  |
| `SUPINE` | supine | null | present | simultaneous | neutral |  |  |

41 concepts. Differences from note N7: `PAST_PERFECT_PROGRESSIVE` is named `PLUPERFECT_PROGRESSIVE` (consistent with `PLUPERFECT`); `PART_PAST` has `time: past` (N7 gave it `present`, the same as `PART_PERFECT`, which would make two concepts identical); `SUBJ_IMPERFECT` has `aspect: imperfective` (so that relaxing only the mood from a subjunctive imperfect reaches the indicative imperfective); N7's `IMP_PERFECT`, `PART_PERFECT` and `GERUND_PERFECT` are kept.

### Reconciliation of the designs' concept names

| Design term (where) | Concept id |
|---|---|
| `IMPERATIVE*` (en), `IMPERATIVE` (it) | `IMP_PRESENT` |
| `INFINITIVE*` (en), `INFINITIVE` (it) | `INF_PRESENT` |
| `INFINITIVE_PERFECT` (it) | `INF_PERFECT` |
| `PRESENT_PARTICIPLE*` (en), `PARTICIPLE_PRESENT` (it) | `PART_PRESENT` |
| `PAST_PARTICIPLE*` (en), `PARTICIPLE_PAST` (it) | `PART_PAST` |
| `COND_PAST*` (en), `COND_PAST` (it) | `COND_PERFECT` |
| `SUBJ_PAST*` (en), `SUBJ_PAST` (it: congiuntivo imperfetto) | `SUBJ_IMPERFECT` |
| `SUBJ_PERFECT*`, `SUBJ_PLUPERFECT*`, `FUTURE_PERFECT*` (en) | same name, no star |
| `PRESENT (0.9, aspect progressive)` etc. (en progressive tenses) | the progressive concept at weight 1 (`PRESENT_PROGRESSIVE`, `PAST_PROGRESSIVE`, `PRESENT_PERFECT_PROGRESSIVE`, `PLUPERFECT_PROGRESSIVE`, `FUTURE_PROGRESSIVE`, `FUTURE_PERFECT_PROGRESSIVE`, `COND_PROGRESSIVE`, `COND_PERFECT_PROGRESSIVE`) **and** the design's non-progressive link at the design's weight |
| `PAST_PERFECT_PROGRESSIVE` (N7) | `PLUPERFECT_PROGRESSIVE` |
| `EPISTEMIC_PRESENT`, `EPISTEMIC_PAST`, `FUTURE_IN_PAST` (it) | dropped: same dimensions as `PRESENT`, `FUTURE_PERFECT`, `COND_PERFECT`; the reading becomes a note (`eq.it.future-supposition`, `eq.it.cond-past-future-in-past`); Open questions |
| it `indicative.past_anterior`: `PLUPERFECT 0.6` only | `PAST_ANTERIOR 1` **and** `PLUPERFECT 0.6`, both literary (N7 lists the trapassato remoto under `PAST_ANTERIOR`, as fr and es do) |
| fr/de/es/la names (`PRESENT`, `PAST_PERFECTIVE`, `FUTURE`, `IMP_FUTURE`, `GERUNDIVE`, `SUPINE`, …) | unchanged |

A language map may also carry two additions the designs do not have, both explained in the map: `only: 'target'` (a stand-in link, used only when the language is the target) and `only: 'source'` (a link used only when the language is the source). Both need a note.

### Derivation rules (`derive.ts` implements exactly this)

Key of a tense: `` `${mood}.${tense}` ``. A map lists a language's tenses in catalogue order; that order is the final tie-break. A link is *source-usable* unless `only: 'target'`, *target-usable* unless `only: 'source'`. `register` defaults to `standard`; rank `standard 0 < literary 1 < dated 2`.

1. Source links `S` = the source-usable links of `maps[from][key]`.
2. Levels 0 to 4 (only level 0 when `from === to`; the ladder never runs when the identity entry already exists). At each level, every target tense `k'` (except the tense itself when `from === to`) is scored over all pairs `(s ∈ S, t ∈ links of k' that are target-usable)` that are *compatible at that level*; its score is the highest `round2(s.weight × t.weight)` (ties: first `s`, then first `t` in map order), with the register of that `t`. Compatible at level `L` means: `finiteness`, `time`, `relative` and `polarity` equal (never relaxed); `remoteness` equal, or `L ≥ 2`; `aspect` equal, or `L ≥ 3`; `mood` equal, or `L ≥ 4` and `moodRelaxation[s.mood]` contains `t.mood` (`subjunctive → indicative`, `conditional → indicative`; nothing else, so an imperative is never relaxed). A `dated` target link is admitted at level 0 only when `s.register` is `dated`, and from level 1 on always (register is relaxed at level 1).
3. The first level with at least one scored tense is the result level; all tenses scored at that level are the candidates (a tense scored at level 0 is never recomputed at a higher level).
4. For each candidate: `relaxed` is the subset of `register` (target `dated`, source not), `remoteness`, `aspect`, `mood` (in that order) on which the best pair actually differs; `match` is `exact` when `relaxed` is empty and `t.only !== 'target'`, else `approximate`; `via = [s.concept, t.concept]`; `notes` = unique, in this order: `s.note`, `t.note`, then one note per relaxation (`register` → `eq.note.relaxed-register`, `remoteness` → `eq.note.relaxed-remoteness`, `aspect` → `eq.note.relaxed-aspect`, `mood` → `eq.note.no-conditional` when the source concept's mood is `conditional`, else `eq.note.no-subjunctive`).
5. Sort candidates by score descending, then register rank of the target link ascending, then catalogue order. When `from === to`, put the identity entry first: the tense itself, score 1, `exact`, `via` = `[c, c]` for the first source-usable link's concept `c`, that link's register, no notes.
6. Apply the pair override for `(from, to, key)` if there is one. `replace`: the override's tenses, in order, replace the list. `prepend`: they go first and are removed from the derived list. `exclude`: they are removed. An override entry has `match: 'override'`, `score: 1`, `via: null`, `notes: [note]` or `[]`, and the register of the first link of that tense in the target map.
7. If the list is empty: one entry `{ match: 'none', tense: null, rank: 0, score: 0, relaxed: [], via: null, notes }` with `notes` = `eq.note.no-counterpart` followed by the unique notes of all source-usable links of the source tense.
8. Voice: with `options.voice === 'passive'`, a `from` outside `passiveLanguages` throws `ConjugationError('INVALID_REQUEST', ...)`. A `to` outside `passiveLanguages` turns every `exact` entry into `approximate` and appends `eq.note.passive-not-modelled` to every found entry (a `none` entry is unchanged). A `to` inside it leaves the list as it is.
9. `rank` is the 1-based position of a found entry; `none` has rank 0.

### Result shape and matrix format

```ts
export type Relaxation = 'register' | 'remoteness' | 'aspect' | 'mood';
export type MatchType = 'exact' | 'approximate' | 'override';
export interface EquivalentFound {                     // derive.ts, `tense` as a 'mood.tense' key
  readonly match: MatchType; readonly tense: string; readonly rank: number; readonly score: number;
  readonly register: Register; readonly relaxed: readonly Relaxation[];
  readonly via: readonly [source: ConceptId, target: ConceptId] | null; readonly notes: readonly NoteKey[];
}
export interface EquivalentNone {
  readonly match: 'none'; readonly tense: null; readonly rank: 0; readonly score: 0;
  readonly relaxed: readonly []; readonly via: null; readonly notes: readonly NoteKey[];
}
```

The matrix snapshot `tests/equivalence/matrix.tsv`: a header line `from<TAB>tense<TAB>to<TAB>ranked<TAB>notes`, then one line per (from language, tense, to language) in this order: from-languages sorted by code, tenses in catalogue order, to-languages sorted by code. `ranked` joins the entries with ` | `; an entry is `<mood.tense> <score to 2 decimals> <match>`, where `<match>` is `exact`, `override`, or `approximate(<relaxed joined by +>)` (`approximate` alone when `relaxed` is empty); a `none` entry is the word `none`. `notes` joins, in the same order, each entry's notes comma-joined (`-` when empty) with ` | `. Examples (fr and nl only; these exact lines must appear):

```
fr	indicative.perfect	nl	indicative.perfect 0.80 exact | indicative.past 0.70 exact	- | eq.fr.perfect.spoken-past
fr	subjunctive.imperfect	nl	indicative.past 1.00 approximate(mood) | indicative.perfect 0.60 approximate(aspect+mood)	eq.note.no-subjunctive | eq.nl.perfect.spoken-past,eq.note.relaxed-aspect,eq.note.no-subjunctive
fr	indicative.simple_past	fr	indicative.simple_past 1.00 exact | indicative.perfect 1.00 exact	- | eq.fr.perfect.spoken-past
fr	gerund.present	nl	participle.present 0.50 exact	eq.nl.gerund-as-participle
```

With fr and nl registered the file has 1 + 74 lines; in general 1 + (total catalogue tenses of the registered languages) × (number of registered languages). Tense counts: fr 25, nl 12, de 19, es 23, it 22, la 21, en 24 (total 146; all seven: 1,022 data lines).

---

# Part A — The module with French and Dutch

### Task 1: Note catalogs

**Files:**
- Create: `src/i18n/locales/en/equivalence/{index,shared,fr,nl}.ts`, `src/i18n/locales/nl/equivalence/{index,shared,fr,nl}.ts`, `tests/equivalence/notes.test.ts`
- Modify: `src/i18n/locales/en/index.ts`, `src/i18n/locales/nl/index.ts`

**Interfaces:**
- Produces: in each locale, `shared.ts` exports `sharedNotes`, `fr.ts` `frNotes`, `nl.ts` `nlNotes` (each `{ 'eq.…': '…' } as const`); `index.ts` exports `equivalence = { ...sharedNotes, ...frNotes, ...nlNotes }`. The `nl` files are `as const satisfies Record<keyof typeof <the en counterpart>, string>`, so a key missing from either locale is a type error. The locale catalogs become `{ ...core, ...equivalence }` (a language plan later adds its own `...de` beside it).
- Key prefixes: `shared.ts` holds `eq.note.*` (ladder, none, voice, negation) and `eq.pair.*` (pair overrides); `<code>.ts` holds `eq.<code>.*`. Part B tasks add `de`, `es`, `it`, `la`, `en` files the same way.
- Downstream type: `NoteKey = keyof typeof equivalence` (English index), exported from `src/equivalence/concepts.ts` in Task 2.

Shared keys (12):

| Key | English | Dutch |
|---|---|---|
| `eq.note.no-counterpart` | The target language has no tense in its catalogue that corresponds to this form. | De doeltaal heeft in haar catalogus geen tijd die bij deze vorm past. |
| `eq.note.relaxed-register` | Only a dated tense corresponds to this form; it is hardly used today. | Alleen een verouderde tijd komt hiermee overeen; die wordt nu nauwelijks nog gebruikt. |
| `eq.note.relaxed-remoteness` | The target language does not mark nearness in time; the plain tense is used. | De doeltaal markeert geen nabijheid in de tijd; de gewone tijd wordt gebruikt. |
| `eq.note.relaxed-aspect` | The target language does not mark this aspect in a separate tense; the closest tense is used. | De doeltaal markeert dit aspect niet in een aparte tijd; de dichtstbijzijnde tijd wordt gebruikt. |
| `eq.note.no-subjunctive` | The target language has no subjunctive tense that corresponds to this one; the indicative is used. | De doeltaal heeft geen aanvoegende tijd die hierbij past; de aantonende wijs wordt gebruikt. |
| `eq.note.no-conditional` | The target language has no conditional tense that corresponds to this one; the indicative is used. | De doeltaal heeft geen voorwaardelijke tijd die hierbij past; de aantonende wijs wordt gebruikt. |
| `eq.note.negation-added` | The negative imperative is the plain imperative plus a negation word; the tense itself is the same. | De ontkennende gebiedende wijs is de gewone gebiedende wijs met een ontkenning; de tijd zelf is dezelfde. |
| `eq.note.passive-not-modelled` | The passive of the target language is not modelled; the active tense is given. | De lijdende vorm van de doeltaal is niet gemodelleerd; de bedrijvende tijd wordt gegeven. |
| `eq.pair.fr-nl.near-future` | French aller plus infinitive corresponds to Dutch gaan plus infinitive: ask for the present tense of gaan and add the infinitive. | Frans aller plus infinitief komt overeen met Nederlands gaan plus infinitief: vraag de onvoltooid tegenwoordige tijd van gaan en voeg de infinitief toe. |
| `eq.pair.fr-nl.recent-past` | French venir de plus infinitive is rendered in Dutch with the perfect and the word net. | Frans venir de plus infinitief wordt in het Nederlands weergegeven met de voltooid tegenwoordige tijd en het woord net. |
| `eq.pair.fr-nl.hortative` | The French first person plural imperative is built in Dutch with laten we plus infinitive. | De Franse eerste persoon meervoud van de gebiedende wijs wordt in het Nederlands gevormd met laten we plus infinitief. |
| `eq.pair.subjunctive-clause` | Dutch has no subjunctive: it renders this form with the indicative, usually in a subordinate clause. | Het Nederlands heeft geen aanvoegende wijs: deze vorm wordt met de aantonende wijs weergegeven, meestal in een bijzin. |

French key (1):

| Key | English | Dutch |
|---|---|---|
| `eq.fr.perfect.spoken-past` | In speech the passé composé is the ordinary tense for finished past events; the passé simple is only written. | In gesproken taal is de passé composé de gewone tijd voor afgeronde gebeurtenissen; de passé simple komt alleen in geschreven taal voor. |

Dutch keys (7):

| Key | English | Dutch |
|---|---|---|
| `eq.nl.present-future` | Dutch often uses the present tense for the future, usually with a time word (ik kom morgen). | In het Nederlands staat de onvoltooid tegenwoordige tijd vaak voor de toekomst, meestal met een tijdsaanduiding (ik kom morgen). |
| `eq.nl.perfect.spoken-past` | In Dutch the perfect is the usual tense for finished events in conversation; the simple past is used for narration. | In het Nederlands is de voltooid tegenwoordige tijd de gewone tijd voor afgeronde gebeurtenissen in gesprek; de onvoltooid verleden tijd dient om te vertellen. |
| `eq.nl.gerund-as-participle` | Dutch has no gerund; the present participle stands in for it, often after al (al lopend). | Het Nederlands heeft geen gerundium; het tegenwoordig deelwoord neemt die plaats in, vaak na al (al lopend). |
| `eq.nl.compound-inf-perfect` | Dutch has no perfect infinitive tense in its catalogue: build it from the past participle plus hebben or zijn (gewerkt hebben). | Het Nederlands heeft in zijn catalogus geen voltooide onbepaalde wijs: vorm hem met het voltooid deelwoord plus hebben of zijn (gewerkt hebben). |
| `eq.nl.compound-part-perfect` | Dutch has no compound participle tense in its catalogue: build it from the past participle plus the participle of hebben or zijn (gewerkt hebbende). | Het Nederlands heeft in zijn catalogus geen samengesteld deelwoord: vorm het met het voltooid deelwoord plus het deelwoord van hebben of zijn (gewerkt hebbende). |
| `eq.nl.compound-gerund-perfect` | Dutch has no perfect gerund: build it with na, the past participle and te hebben or te zijn (na gewerkt te hebben). | Het Nederlands heeft geen voltooid gerundium: vorm het met na, het voltooid deelwoord en te hebben of te zijn (na gewerkt te hebben). |
| `eq.nl.compound-imp-perfect` | Dutch has no perfect imperative tense in its catalogue: build it from the past participle plus the imperative of hebben or zijn (heb gewerkt). | Het Nederlands heeft in zijn catalogus geen voltooide gebiedende wijs: vorm hem met het voltooid deelwoord plus de gebiedende wijs van hebben of zijn (heb gewerkt). |

- [ ] **Step 1: Write the failing test** `tests/equivalence/notes.test.ts`: (a) every key of `locales.en` that starts with `eq.` is in `locales.nl` and the reverse; there are exactly 20 at this point (12 + 1 + 7: assert `>= 20`, so Part B does not break it); (b) for every `eq.*` message in both locales, `placeholders(text).size === 0` and `formatMessage(text, {}, locale) === text` (this fails on a straight apostrophe or brace); (c) every file in `src/i18n/locales/en/equivalence/` other than `index.ts` is imported dynamically (`readdirSync` + `import()`), its keys all start with its prefix (`eq.note.`/`eq.pair.` for `shared`, `eq.<file>.` otherwise), no key occurs in two files, and the merged `locales.en` has no `eq.` key that is in none of them; (d) spot check of the English text: `locales.en['eq.note.no-counterpart'] === 'The target language has no tense in its catalogue that corresponds to this form.'` and `locales.nl['eq.pair.fr-nl.near-future']` starts with `Frans aller`.
- [ ] **Step 2:** `npx vitest run tests/equivalence/notes.test.ts` — FAIL (no `eq.` keys).
- [ ] **Step 3:** Create the six message files (en and nl) from the tables above and register `equivalence` in both locale indexes.
- [ ] **Step 4:** `npx vitest run tests/equivalence/notes.test.ts tests/i18n` — PASS; `npm run typecheck` — PASS.
- [ ] **Step 5:** Commit `feat(conjugation-engine): equivalence note catalogs`.

### Task 2: Concept inventory and map types

**Files:**
- Create: `src/equivalence/concepts.ts`, `tests/equivalence/concepts.test.ts`

**Interfaces:**
- Produces (`src/equivalence/concepts.ts`):

```ts
export type Finiteness = 'finite' | 'infinitive' | 'participle' | 'gerund' | 'verbalAdjective' | 'supine';
export type ConceptMood = 'indicative' | 'subjunctive' | 'conditional' | 'imperative' | null;
export type Time = 'past' | 'present' | 'future';
export type Relative = 'anterior' | 'simultaneous' | 'posterior';
export type Aspect = 'neutral' | 'perfective' | 'imperfective' | 'progressive';
export interface ConceptDef {
  readonly finiteness: Finiteness; readonly mood: ConceptMood; readonly time: Time; readonly relative: Relative;
  readonly aspect: Aspect; readonly remoteness?: 'near'; readonly polarity?: 'negative';
}
export const concepts: { readonly [id in ConceptId]: ConceptDef };   // the 41 rows of the table above, in that order; `as const satisfies Record<string, ConceptDef>`
export type ConceptId = keyof typeof concepts;
export type Register = 'standard' | 'literary' | 'dated';
export type NoteKey = keyof typeof import('../i18n/locales/en/equivalence/index.js').equivalence;   // written as an `import type` + `typeof`
export interface ConceptLink {
  readonly concept: ConceptId; readonly weight: number; readonly register?: Register;
  readonly note?: NoteKey; readonly only?: 'source' | 'target';
}
export function link(concept: ConceptId, weight: number,
  extra?: { readonly register?: Register; readonly note?: NoteKey; readonly only?: 'source' | 'target' }): ConceptLink;
export const moodRelaxation: Readonly<Record<'subjunctive' | 'conditional', readonly ['indicative']>>;
export type TenseKeyFor<L extends Language> = { [M in MoodFor<L>]: `${M}.${TenseFor<L, M> & string}` }[MoodFor<L>];
export type LanguageMap<L extends Language> = { readonly [K in TenseKeyFor<L>]: readonly [ConceptLink, ...ConceptLink[]] };
```

  (`Language`, `MoodFor`, `TenseFor` from `../types.js`, type-only.) `link` returns an object with only the keys it was given (`exactOptionalPropertyTypes`).

- [ ] **Step 1: Write the failing test** `tests/equivalence/concepts.test.ts`: `Object.keys(concepts)` has length 41 and its first, last and middle entries are `PRESENT`, `SUPINE`, `COND_PRESENT` (positions 0, 40, 16); no two concepts have equal `(finiteness, mood, time, relative, aspect, remoteness ?? null, polarity ?? null)`; `concepts.NEAR_FUTURE` equals `{ finiteness: 'finite', mood: 'indicative', time: 'present', relative: 'posterior', aspect: 'neutral', remoteness: 'near' }`; `concepts.PART_PAST.time === 'past'` and `concepts.PART_PERFECT.time === 'present'`; `concepts.SUPINE.finiteness === 'supine'` and `concepts.GERUNDIVE.finiteness === 'verbalAdjective'`; every non-finite concept has `mood: null` and every finite one a mood; `link('PRESENT', 1)` deep-equals `{ concept: 'PRESENT', weight: 1 }` (no `undefined` keys) and `link('PRESENT', 0.5, { note: 'eq.nl.present-future' })` has the note; `moodRelaxation` is `{ subjunctive: ['indicative'], conditional: ['indicative'] }`.
- [ ] **Step 2:** `npx vitest run tests/equivalence/concepts.test.ts` — FAIL (module missing).
- [ ] **Step 3:** Implement `src/equivalence/concepts.ts`: the 41 definitions from the table, then the types and `link`.
- [ ] **Step 4:** `npx vitest run tests/equivalence/concepts.test.ts && npm run typecheck` — PASS.
- [ ] **Step 5:** Commit `feat(conjugation-engine): tense concept inventory`.

### Task 3: The derivation

**Files:**
- Create: `src/equivalence/derive.ts`, `tests/equivalence/derive.test.ts`

**Interfaces:**
- Consumes: `ConceptLink`, `ConceptId`, `Register`, `NoteKey`, `concepts`, `moodRelaxation` (Task 2).
- Produces (`src/equivalence/derive.ts`): the types `Relaxation`, `MatchType`, `EquivalentFound`, `EquivalentNone` and
  `export type RawEquivalent = EquivalentFound | EquivalentNone;` (see "Result shape"), and

```ts
export interface RawOverride {
  readonly from: string; readonly to: string; readonly tense: string;
  readonly mode: 'replace' | 'prepend' | 'exclude';
  readonly result: readonly { readonly tense: string; readonly note?: NoteKey }[];
  readonly reason: string;
}
export interface EquivalenceData {
  readonly maps: Readonly<Record<string, Readonly<Record<string, readonly ConceptLink[]>>>>;  // language -> key -> links, catalogue order
  readonly overrides: readonly RawOverride[];
  readonly passiveLanguages: readonly string[];
}
export interface EquivalenceOptions { readonly voice?: 'active' | 'passive' }
export function deriveEquivalents(data: EquivalenceData, from: string, to: string, tense: string,
  options?: EquivalenceOptions): readonly RawEquivalent[];
```

  Pure and synchronous; knows no language by name; throws nothing for unknown input except the voice rule (callers validate); returns frozen arrays of frozen entries.

- [ ] **Step 1: Write the failing tests** `tests/equivalence/derive.test.ts`. A helper `run(sourceLinks, targetMap, options?)` builds `EquivalenceData` with languages `aa` (one tense `indicative.t` with `sourceLinks`) and `bb` (`targetMap`, tense keys as given), no overrides, `passiveLanguages: []`, and returns `deriveEquivalents(data, 'aa', 'bb', 'indicative.t')` as `[tense, score, match, relaxed, notes]` tuples. Each row below is one `it`:

| Test | source links | target map | expected |
|---|---|---|---|
| ranks by the product of the weights | `PAST_PERFECTIVE 0.8`, `PRESENT_PERFECT 1` | `indicative.a: [PAST_PERFECTIVE 0.9]`, `indicative.b: [PRESENT_PERFECT 0.5]` | `a 0.72`, `b 0.5`, both `exact` |
| uses the best pair of one tense | as above | `indicative.a: [PAST_PERFECTIVE 0.9, PRESENT_PERFECT 0.9]` | one entry `a 0.9` |
| ties: standard before literary before catalogue order | `PAST_PERFECTIVE 1` | `x: [… 1 literary]`, `y: [… 1]`, `z: [… 1]` | `y`, `z`, `x` |
| rounds products to two decimals | `PAST_PERFECTIVE 0.9` | `a: [PAST_PERFECTIVE 0.9]` | score `0.81` |
| a dated target is not offered while a standard one exists | `FUTURE 1` | `old: [FUTURE 1 dated]`, `new: [FUTURE 0.5]` | only `new` |
| a dated target alone is offered at the register step | `FUTURE 1` | `old: [FUTURE 1 dated]` | `old 1 approximate`, relaxed `['register']`, notes `['eq.note.relaxed-register']` |
| a dated source admits a dated target | `FUTURE 1 dated` | `old: [FUTURE 1 dated]` | `old 1 exact` |
| relaxes remoteness | `RECENT_PAST 1` | `p: [PRESENT_PERFECT 1]` | `p 1 approximate`, `['remoteness']`, `['eq.note.relaxed-remoteness']` |
| relaxes aspect | `PAST_ANTERIOR 1` | `p: [PLUPERFECT 1]` | `['aspect']`, `['eq.note.relaxed-aspect']` |
| relaxes mood from the subjunctive | `SUBJ_PRESENT 1` | `p: [PRESENT 1]` | `['mood']`, `['eq.note.no-subjunctive']` |
| relaxes mood from the conditional | `COND_PRESENT 1` | `p: [PRESENT 1]` | `['mood']`, `['eq.note.no-conditional']` |
| relaxes aspect and mood together | `SUBJ_IMPERFECT 1` | `p: [PAST_PERFECTIVE 1]` | `['aspect', 'mood']`, notes `['eq.note.relaxed-aspect', 'eq.note.no-subjunctive']` |
| stops at the first level with a result | `SUBJ_IMPERFECT 1` | `p: [PAST_IMPERFECTIVE 0.5]`, `q: [PAST_PERFECTIVE 1]` | `q 1` (relaxed `['aspect', 'mood']`) then `p 0.5` (relaxed `['mood']`), both at the mood level; and with an extra `r: [SUBJ_IMPERFECT 0.3]`: only `r` (exact) |
| never relaxes the imperative's mood | `IMP_PRESENT 1` | `p: [PRESENT 1]` | `none` |
| never relaxes finiteness | `GERUND 1` | `p: [PART_PRESENT 1]` | `none` |
| never relaxes time | `FUTURE 1` | `p: [PRESENT 1]` | `none` |
| never relaxes relative time | `INF_PERFECT 1` | `p: [INF_PRESENT 1]` | `none` |
| never relaxes polarity | `IMP_NEGATIVE 1` | `p: [IMP_PRESENT 1]` | `none` |
| `only: 'target'` is ignored as a source | `INF_PERFECT 1 only target note eq.nl.compound-inf-perfect`, `PART_PAST 1` | `p: [PART_PAST 1]` | one entry `p 1` (never an `INF_PERFECT` match) |
| `only: 'target'` is used as a target and is approximate | `INF_PERFECT 1` | `p: [PART_PAST 1, INF_PERFECT 0.4 only target note eq.nl.compound-inf-perfect]` | `p 0.4 approximate`, relaxed `[]`, notes `['eq.nl.compound-inf-perfect']` |
| `only: 'source'` is ignored as a target | `IMP_PRESENT 1` | `p: [IMP_NEGATIVE 1, IMP_PRESENT 0.6 only source note eq.note.negation-added]` | `none` |
| notes: source, then target, then relaxation, unique | `SUBJ_PRESENT 1 note eq.note.negation-added` | `p: [PRESENT 1 note eq.note.negation-added]` | notes `['eq.note.negation-added', 'eq.note.no-subjunctive']` |
| `none` carries the notes of the source links | `SUPINE 1 note eq.la.supine` | `p: [PRESENT 1]` | `[{ match: 'none', tense: null, rank: 0, score: 0, notes: ['eq.note.no-counterpart', 'eq.la.supine'] }]` |

  Further `it`s with their own data: (1) identity: language `aa` onto itself, tense with `PAST_PERFECTIVE 1 literary` and a sibling `PAST_PERFECTIVE 1`: result `[the tense (rank 1, score 1, exact, register literary, via ['PAST_PERFECTIVE','PAST_PERFECTIVE']), the sibling (rank 2, score 1)]`; a tense with no sibling: a one-entry list, never `none`, and no relaxed entries even when a relaxed match exists (same-language never runs the ladder). (2) overrides: `replace` yields exactly the override's tenses in order (`match: 'override'`, score 1, `via: null`, register of the target map's first link of that tense, note in `notes`), `prepend` puts them first and removes the same tenses from the derived list, `exclude` removes them, and an `exclude` that empties the list gives the `none` entry with `eq.note.no-counterpart`; ranks are 1..n. (3) voice: `passiveLanguages: ['bb']` and `{ voice: 'passive' }` leaves an `aa → bb` list unchanged; with `passiveLanguages: ['aa']` the same call turns every `exact` into `approximate` and appends `eq.note.passive-not-modelled`, leaves `none` alone, and `{ voice: 'passive' }` from `bb` throws `ConjugationError` with code `INVALID_REQUEST`. (4) the result is frozen (`Object.isFrozen` on the array and on an entry).
- [ ] **Step 2:** `npx vitest run tests/equivalence/derive.test.ts` — FAIL (module missing).
- [ ] **Step 3:** Implement `deriveEquivalents` as in "Derivation rules". One loop over levels, one scoring pass per level; the compatibility test is a small pure function of `(sourceConcept, targetConcept, level)` returning the differing dimensions or `null`.
- [ ] **Step 4:** `npx vitest run tests/equivalence/derive.test.ts && npm run typecheck` — PASS.
- [ ] **Step 5:** Commit `feat(conjugation-engine): tense equivalence derivation`.

### Task 4: French and Dutch maps and the registry

**Files:**
- Create: `src/equivalence/fr.ts`, `src/equivalence/nl.ts`, `src/equivalence/index.ts` (registry part only; the function comes in Task 5), `tests/equivalence/maps.test.ts`, `tests/equivalence/maps.typecheck.ts`

**Interfaces:**
- Consumes: `link`, `LanguageMap` (Task 2).
- Produces: `fr` and `nl` (maps, below); in `src/equivalence/index.ts`:

```ts
export const maps = { fr, nl } satisfies { readonly [L in Language]: LanguageMap<L> };
export const passiveLanguages: readonly Language[] = [];       // la joins it in Part B (B4)
export const equivalenceData: EquivalenceData;                 // { maps, overrides: [], passiveLanguages } until Task 5 adds overrides
```

  `satisfies { [L in Language]: … }` is what makes an unmapped registered language a compile error. Each map file starts `import { link } from './concepts.js'; import type { LanguageMap } from './concepts.js';`. Map key order is the catalogue order (a test).

French (25 tenses). Source: the French design section 10; `fr` is as the design has it.

```ts
export const fr = {
  'indicative.present': [link('PRESENT', 1)],
  'indicative.perfect': [link('PAST_PERFECTIVE', 1, { note: 'eq.fr.perfect.spoken-past' }), link('PRESENT_PERFECT', 0.8)],
  'indicative.imperfect': [link('PAST_IMPERFECTIVE', 1)],
  'indicative.pluperfect': [link('PLUPERFECT', 1)],
  'indicative.simple_past': [link('PAST_PERFECTIVE', 1, { register: 'literary' })],
  'indicative.past_anterior': [link('PAST_ANTERIOR', 1, { register: 'literary' })],
  'indicative.future': [link('FUTURE', 1)],
  'indicative.future_perfect': [link('FUTURE_PERFECT', 1)],
  'indicative.near_future': [link('NEAR_FUTURE', 1), link('FUTURE', 0.6)],
  'indicative.recent_past': [link('RECENT_PAST', 1), link('PRESENT_PERFECT', 0.5)],
  'subjunctive.present': [link('SUBJ_PRESENT', 1)],
  'subjunctive.past': [link('SUBJ_PERFECT', 1)],
  'subjunctive.imperfect': [link('SUBJ_IMPERFECT', 1, { register: 'literary' })],
  'subjunctive.pluperfect': [link('SUBJ_PLUPERFECT', 1, { register: 'literary' })],
  'conditional.present': [link('COND_PRESENT', 1)],
  'conditional.past': [link('COND_PERFECT', 1)],
  'imperative.present': [link('IMP_PRESENT', 1)],
  'imperative.past': [link('IMP_PERFECT', 1)],
  'infinitive.present': [link('INF_PRESENT', 1)],
  'infinitive.past': [link('INF_PERFECT', 1)],
  'participle.present': [link('PART_PRESENT', 1)],
  'participle.past': [link('PART_PAST', 1)],
  'participle.perfect': [link('PART_PERFECT', 1)],
  'gerund.present': [link('GERUND', 1)],
  'gerund.past': [link('GERUND_PERFECT', 1)],
} satisfies LanguageMap<'fr'>;
```

Dutch (12 tenses). There is no Dutch table in the designs: this is derived from the app's mapping (note N6), the Dutch catalogue and the German design. The Dutch weights resolve N6's passé composé wrinkle without an override: the perfect links `PRESENT_PERFECT 1` and `PAST_PERFECTIVE 0.6`, the past `PAST_IMPERFECTIVE 1` and `PAST_PERFECTIVE 0.7`. With the French weights (`indicative.perfect`: `PAST_PERFECTIVE 1`, `PRESENT_PERFECT 0.8`) this gives fr perfect → nl perfect 0.80 over nl past 0.70, and fr simple past → nl past 0.70 over nl perfect 0.60. The margins are thin on purpose: they are pinned by the acceptance test (Task 6), and changing a Dutch or French weight without re-running it is the way to break the trainer. The four `only: 'target'` links on the past participle are the stand-ins the app composes by hand (participle plus auxiliary).

```ts
export const nl = {
  'indicative.present': [link('PRESENT', 1), link('FUTURE', 0.4, { note: 'eq.nl.present-future' })],
  'indicative.past': [link('PAST_IMPERFECTIVE', 1), link('PAST_PERFECTIVE', 0.7)],
  'indicative.future': [link('FUTURE', 1)],
  'indicative.perfect': [link('PRESENT_PERFECT', 1), link('PAST_PERFECTIVE', 0.6, { note: 'eq.nl.perfect.spoken-past' })],
  'indicative.pluperfect': [link('PLUPERFECT', 1)],
  'indicative.future_perfect': [link('FUTURE_PERFECT', 1)],
  'conditional.present': [link('COND_PRESENT', 1)],
  'conditional.past': [link('COND_PERFECT', 1)],
  'imperative.present': [link('IMP_PRESENT', 1)],
  'infinitive.present': [link('INF_PRESENT', 1)],
  'participle.present': [link('PART_PRESENT', 1), link('GERUND', 0.5, { note: 'eq.nl.gerund-as-participle' })],
  'participle.past': [
    link('PART_PAST', 1),
    link('INF_PERFECT', 0.4, { note: 'eq.nl.compound-inf-perfect', only: 'target' }),
    link('PART_PERFECT', 0.4, { note: 'eq.nl.compound-part-perfect', only: 'target' }),
    link('GERUND_PERFECT', 0.4, { note: 'eq.nl.compound-gerund-perfect', only: 'target' }),
    link('IMP_PERFECT', 0.4, { note: 'eq.nl.compound-imp-perfect', only: 'target' }),
  ],
} satisfies LanguageMap<'nl'>;
```

- [ ] **Step 1: Write the failing tests.** `tests/equivalence/maps.test.ts`, over `Object.entries(maps)` of the registry (so Part B needs no edit): (a) `Object.keys(maps).sort()` equals `[...languages].sort()`; (b) for each language, `Object.keys(maps[code])` equals `getCatalogue(code).map(e => `${e.mood}.${e.tense}`)` in order, and no mood or tense id contains a `.`; (c) every link's `concept` is in `concepts`, its `weight` is a multiple of 0.1 in (0, 1], its `note` (if any) is a key of both `locales.en` and `locales.nl`, a link with `only` has a `note`; (d) each tense has at least one source-usable and one target-usable link; (e) `passiveLanguages` equals the registered languages whose catalogue has an entry with `voices` including `'passive'`; (f) tense counts: `Object.keys(maps.fr).length === 25` and `Object.keys(maps.nl).length === 12`. `tests/equivalence/maps.typecheck.ts` (compiled by `npm run typecheck`, like `tests/options.typecheck.ts`): `TenseKeyFor<'fr'>` accepts `'indicative.near_future'` and rejects `'indicative.past'` (`// @ts-expect-error`); `LanguageMap<'fr'>` rejects `fr` minus `'indicative.present'` (destructure it away) and `LanguageMap<'nl'>` rejects `{ ...nl, 'indicative.near_future': [link('NEAR_FUTURE', 1)] }`; `link('PRESENT', 1, { note: 'eq.no-such-key' })` and `link('NO_SUCH', 1)` do not compile.
- [ ] **Step 2:** `npx vitest run tests/equivalence/maps.test.ts` — FAIL.
- [ ] **Step 3:** Write `fr.ts`, `nl.ts` and the registry part of `index.ts`.
- [ ] **Step 4:** `npx vitest run tests/equivalence && npm run typecheck` — PASS (the typecheck proves the `@ts-expect-error` lines are all needed).
- [ ] **Step 5:** Commit `feat(conjugation-engine): French and Dutch tense maps`.

### Task 5: Overrides, `equivalentTenses` and the public API

**Files:**
- Create: `src/equivalence/overrides.ts`, `tests/equivalence/api.test.ts`, `tests/equivalence/api.typecheck.ts`
- Modify: `src/equivalence/index.ts`, `src/index.ts`, `package.json` (`exports`), `tests/package.test.ts`

**Interfaces:**
- Produces (`src/equivalence/overrides.ts`):

```ts
export interface PairOverride<F extends Language = Language, T extends Language = Language> {
  readonly from: F; readonly to: T; readonly tense: TenseKeyFor<F>;
  readonly mode: 'replace' | 'prepend' | 'exclude';
  readonly result: readonly { readonly tense: TenseKeyFor<T>; readonly note?: NoteKey }[];
  readonly reason: string;                       // why this pair does not line up; more than 30 characters
}
export function override<F extends Language, T extends Language>(entry: PairOverride<F, T>): RawOverride;
export const overrides: readonly RawOverride[];
```

- Produces (`src/equivalence/index.ts`):

```ts
export type TenseRef<L extends Language> = { [M in MoodFor<L>]: { readonly mood: M; readonly tense: TenseFor<L, M> } }[MoodFor<L>];
export type TenseEquivalent<L extends Language = Language> =
  | (Omit<EquivalentFound, 'tense'> & { readonly tense: TenseRef<L> }) | EquivalentNone;
export function equivalentTenses<F extends Language, T extends Language>(
  from: F, to: T, tense: TenseRef<F>, options?: EquivalenceOptions): readonly TenseEquivalent<T>[];
export interface MatrixRow { readonly from: Language; readonly tense: string; readonly to: Language; readonly results: readonly RawEquivalent[] }
export function equivalenceMatrix(): readonly MatrixRow[];   // canonical order of "Result shape and matrix format"
export type { EquivalenceOptions, Relaxation, MatchType, EquivalentNone, ConceptId, Register, NoteKey };
```

  `equivalentTenses` validates (`from` or `to` not a registered language: `ConjugationError('UNSUPPORTED_LANGUAGE', ...)` naming the registered ones; a tense not in the map: `INVALID_TARGET`), calls `deriveEquivalents(equivalenceData, ...)` and converts `tense` keys to `{ mood, tense }` objects (split at the first `.`). `equivalenceData.overrides` becomes `overrides`.
- The root `src/index.ts` adds `export { equivalentTenses } from './equivalence/index.js';` and `export type { TenseEquivalent, TenseRef, EquivalenceOptions } from './equivalence/index.js';`. `package.json` `exports` gains `"./equivalence": { "types": "./dist/equivalence/index.d.ts", "import": "./dist/equivalence/index.js" }`.

Overrides of this task (all fr → nl; `mode: 'prepend'`):

| Source tense | Result | Note | Reason (the `reason` field, verbatim) |
|---|---|---|---|
| `indicative.near_future` | `indicative.present` | `eq.pair.fr-nl.near-future` | `The app shows the Dutch gaan plus infinitive, which is the present of gaan; the pivot alone ranks the Dutch future (0.60) first.` |
| `indicative.recent_past` | `indicative.perfect` | `eq.pair.fr-nl.recent-past` | `The pivot already ranks the Dutch perfect first (0.50); the override only attaches the note that the app adds the word net.` |
| `imperative.present` | `imperative.present` | `eq.pair.fr-nl.hortative` | `The pivot already ranks the Dutch imperative first; the override only attaches the note that the first person plural is laten we plus infinitive.` |

Foreseen overrides for other pairs (added by the Part B task of the language named, not now): `es → nl` `subjunctive.pluperfect` → prepend `indicative.pluperfect` (B2); `la → nl` `subjunctive.imperfect` → prepend `indicative.past`, `subjunctive.pluperfect` → prepend `indicative.pluperfect` (B4); all with note `eq.pair.subjunctive-clause`. Reason: those subjunctives also link `COND_PRESENT`/`COND_PERFECT` at 0.5–0.6, which is an exact match and so ranks the Dutch conditional first and hides the ladder's better answer (the indicative of the clause), which a Dutch reader of a Latin subordinate clause expects.

- [ ] **Step 1: Write the failing tests.** `tests/equivalence/api.test.ts`: (a) `equivalentTenses('fr', 'nl', { mood: 'indicative', tense: 'perfect' })[0]` is `{ match: 'exact', tense: { mood: 'indicative', tense: 'perfect' }, rank: 1, score: 0.8, register: 'standard', relaxed: [], via: ['PRESENT_PERFECT', 'PRESENT_PERFECT'], notes: [] }`; (b) the result array and its entries are frozen; (c) `equivalentTenses('xx' as never, 'nl', …)` throws `ConjugationError` with code `UNSUPPORTED_LANGUAGE`, and `equivalentTenses('fr', 'nl', { mood: 'indicative', tense: 'past' } as never)` throws `INVALID_TARGET`; (d) the `./equivalence` export and the root export are the same function (`import * as sub from '../../src/equivalence/index.js'` against `../../src/index.js`); (e) every override in `overrides`: `from`, `to` registered, `tense` and each result tense are keys of the respective maps, `reason.length > 30`, every note defined in both locales, and **it changes something**: `deriveEquivalents({ ...equivalenceData, overrides: [] }, …)` differs from the result with it (order, `match` or notes); (f) `equivalentTenses('fr', 'fr', …, { voice: 'passive' })` throws `INVALID_REQUEST` (while `passiveLanguages` has no member). `tests/equivalence/api.typecheck.ts`: `equivalentTenses('fr', 'nl', { mood: 'indicative', tense: 'perfect' })` compiles and its `[0]` narrows by `match === 'none'`; `{ mood: 'indicative', tense: 'past' }` as a French tense, `{ mood: 'infinitive', tense: 'present', extra: 1 }`, and `'de'` (not registered until B1 — use `'xx'`) as a language do not compile (`@ts-expect-error`); the result's `tense` for a `'nl'` target is typed as a Dutch tense, so `r.tense.mood === 'subjunctive'` is a type error for a `'nl'` target (`@ts-expect-error`). In `tests/package.test.ts`, in the style of its existing graph test: `inBrowserGraph(new URL('../dist/equivalence/index.js', import.meta.url).href, …)` runs `namespace.equivalentTenses('fr', 'nl', { mood: 'indicative', tense: 'perfect' })` and prints its first entry's `tense.tense` (`perfect`), and the self-referencing import `conjugation-engine/equivalence` loads through `package.json`.
- [ ] **Step 2:** `npx vitest run tests/equivalence/api.test.ts` — FAIL.
- [ ] **Step 3:** Implement `overrides.ts` (the `override` helper only types and returns the entry; the three rows above), complete `index.ts`, add the root and `exports` lines.
- [ ] **Step 4:** `npm run build && npx vitest run tests/equivalence tests/package.test.ts && npm run typecheck` — PASS.
- [ ] **Step 5:** Commit `feat(conjugation-engine): equivalentTenses and the ./equivalence subpath`.

### Task 6: The matrix snapshot, identity, totality and the fr → nl acceptance

**Files:**
- Create: `tests/equivalence/matrix.ts`, `tests/equivalence/matrix.test.ts`, `tests/equivalence/matrix.tsv` (generated), `tests/equivalence/fr-nl.test.ts`, `tests/equivalence/expected.test.ts`, `tests/equivalence/expectations/{types,core}.ts`
- Modify: `package.json` (script)

**Interfaces:**
- `tests/equivalence/matrix.ts`: `formatMatrix(rows: readonly MatrixRow[]): string`, exactly the format of "Result shape and matrix format" (header line, one line per row, trailing newline).
- `package.json` script `"equivalence:matrix": "vitest run tests/equivalence/matrix.test.ts -u"` (the one way to regenerate the snapshot; Part B uses it).
- `tests/equivalence/expectations/<code>.ts` (every file): `import type { Expectation } from './types.js'; export const expectations: readonly Expectation[] = [ …rows… ];`.
- `tests/equivalence/expectations/types.ts`:

```ts
export type Expectation = readonly [
  from: Language, tense: string, to: Language, top: string | null, score: number, match: MatchType | 'none',
  extra?: { readonly relaxed?: readonly Relaxation[]; readonly notes?: readonly NoteKey[]; readonly second?: string },
];
```

  Reading a row: the first entry of `equivalentTenses(from, key, to)` has tense `top` (`null` for `none`), `score`, `match`; its `relaxed` and `notes` equal `extra.relaxed ?? []` and `extra.notes ?? []`; the second entry's tense is `extra.second`, and there is no second entry when `second` is absent. `expected.test.ts` imports every file in `tests/equivalence/expectations/` except `types.ts` (`readdirSync` + `import()`), and runs each row whose `from` and `to` are both in `languages` (`it.skipIf` otherwise, so a row for a language not yet merged is skipped, never wrong).

- [ ] **Step 1: Write the failing tests.**
  - `matrix.test.ts`: `await expect(formatMatrix(equivalenceMatrix())).toMatchFileSnapshot('./matrix.tsv')`; plus: (totality) the rows' `(from, tense, to)` triples equal exactly `languages × getCatalogue(from) × languages` (146-style counting: for fr+nl, 74 rows); (identity) for every row with `from === to`, `results[0].tense` is the tense itself with `rank 1`, `score 1`, `match 'exact'`; (no empty result without a note) every row has at least one result; every `none` and every `approximate` entry has at least one note; every entry of every row has `notes` that are all keys of both locales; (language-independent ranks) in every row ranks are 1..n in order and scores are non-increasing; (the four sample lines) the four lines of the "Result shape and matrix format" section occur in the formatted text.
  - `fr-nl.test.ts` (the acceptance test). It reads `../../../../apps/verbodrome/src/trainer/prompt.ts` as text and parses the `DIRECT` table (`'indicative.present': ['indicative', 'present'],` lines between `const DIRECT` and `};`) and the `SUBJUNCTIVE` table (`'subjunctive.present': 'present',` lines): the drift guard asserts 10 and 4 entries, so a change in the app fails here first. Then: for every `DIRECT` entry `[frKey, [mood, tense]]`, `equivalentTenses('fr', 'nl', fr)[0]` is `{ mood, tense }` with `match` `exact`, or (for `indicative.past_anterior`) `approximate` with `relaxed ['aspect']`; for every `SUBJUNCTIVE` entry `[frKey, tense]` the top is `indicative.<tense>`, `approximate`, `relaxed ['mood']`, notes include `eq.note.no-subjunctive`. The app composes the rest by hand; they are pinned as constants in the same file, every French catalogue tense appears in exactly one of the tables (25 = 10 + 4 + 11), and `getCatalogue('fr')` is checked against it:

| French tense | Top Dutch tense | Score | Match | Notes of the top entry |
|---|---|---|---|---|
| `indicative.near_future` | `indicative.present` | 1 | `override` | `eq.pair.fr-nl.near-future` (second: `indicative.future` 0.60) |
| `indicative.recent_past` | `indicative.perfect` | 1 | `override` | `eq.pair.fr-nl.recent-past` |
| `imperative.present` | `imperative.present` | 1 | `override` | `eq.pair.fr-nl.hortative` |
| `imperative.past` | `participle.past` | 0.4 | `approximate` | `eq.nl.compound-imp-perfect` |
| `infinitive.present` | `infinitive.present` | 1 | `exact` | none |
| `infinitive.past` | `participle.past` | 0.4 | `approximate` | `eq.nl.compound-inf-perfect` |
| `participle.present` | `participle.present` | 1 | `exact` | none |
| `participle.past` | `participle.past` | 1 | `exact` | none |
| `participle.perfect` | `participle.past` | 0.4 | `approximate` | `eq.nl.compound-part-perfect` |
| `gerund.present` | `participle.present` | 0.5 | `exact` | `eq.nl.gerund-as-participle` |
| `gerund.past` | `participle.past` | 0.4 | `approximate` | `eq.nl.compound-gerund-perfect` |

    and the scores of the ten `DIRECT` rows are `present 1, perfect 0.8, imperfect 1, pluperfect 1, simple_past 0.7, past_anterior 1, future 1, future_perfect 1, conditional.present 1, conditional.past 1`; the four `SUBJUNCTIVE` rows score `1, 1, 1, 1`.
  - `expected.test.ts` with `expectations/core.ts` (fr and nl only):

```ts
  ['nl', 'indicative.present', 'fr', 'indicative.present', 1, 'exact', { second: 'indicative.future' }],
  ['nl', 'indicative.past', 'fr', 'indicative.imperfect', 1, 'exact', { second: 'indicative.perfect' }],
  ['nl', 'indicative.perfect', 'fr', 'indicative.perfect', 0.8, 'exact', { second: 'indicative.simple_past' }],
  ['nl', 'indicative.pluperfect', 'fr', 'indicative.pluperfect', 1, 'exact'],
  ['nl', 'conditional.past', 'fr', 'conditional.past', 1, 'exact'],
  ['nl', 'imperative.present', 'fr', 'imperative.present', 1, 'exact'],
  ['nl', 'participle.present', 'fr', 'participle.present', 1, 'exact', { second: 'gerund.present' }],
  ['nl', 'participle.past', 'fr', 'participle.past', 1, 'exact'],
  ['fr', 'indicative.simple_past', 'fr', 'indicative.simple_past', 1, 'exact', { second: 'indicative.perfect' }],
  ['nl', 'indicative.past', 'nl', 'indicative.past', 1, 'exact', { second: 'indicative.perfect' }],
  ['fr', 'participle.perfect', 'fr', 'participle.perfect', 1, 'exact'],
```

- [ ] **Step 2:** `npx vitest run tests/equivalence` — FAIL (no matrix helper; snapshot absent).
- [ ] **Step 3:** Write `matrix.ts` and the test files, add the `equivalence:matrix` script, run `npm run equivalence:matrix` to write `tests/equivalence/matrix.tsv`.
- [ ] **Step 4:** Read the generated file: 75 lines; the four sample lines are present; no `none` entry in any `fr → nl` row; `fr → nl` has `indicative.perfect` first for `indicative.perfect` and `indicative.past` first for `indicative.simple_past`. `npx vitest run tests/equivalence` — PASS (run it twice: the second run must not change the file, `git status --short tests/equivalence/matrix.tsv` shows only the first creation).
- [ ] **Step 5:** Commit `test(conjugation-engine): tense equivalence matrix snapshot and fr to nl acceptance`.

### Task 7: Documentation and the registered-language sweep

**Files:**
- Modify: `docs/pack-authoring.md` (registration table, new section 11), `docs/api.md` (new section "Tense equivalence"), `README.md` (one line)

**Interfaces:** none (text).

- [ ] **Step 1: Registered-language sweep.** Read `src/languages/registry.ts`. For every language other than `fr` and `nl` that is registered now, the typecheck of Task 4 already fails for it; run its Part B task (B1 de, B2 es, B3 it, B4 la, B5 en) now, before this task's text steps, one commit each. Expected after the sweep: `npm run typecheck && npm test` green and `tests/equivalence/matrix.tsv` has `1 + (sum of tenses) × (languages)` lines. If only `fr` and `nl` are registered, there is nothing to do.
- [ ] **Step 2:** `docs/pack-authoring.md`: add to the Registration table the rows `src/equivalence/<code>.ts` (the language's total tense map, from its design section 10 as reconciled in `docs/superpowers/plans/2026-11-24-seven-language-engine-04-equivalence.md`), `src/equivalence/index.ts` (`import` + the `maps` entry; `passiveLanguages` for a language with voices), `src/i18n/locales/{en,nl}/equivalence/<code>.ts` and `…/index.ts` (the language's note keys; `import` + spread), `tests/equivalence/expectations/<code>.ts` (rows) and `tests/equivalence/matrix.tsv` (regenerated with `npm run equivalence:matrix`, never hand-edited). Add `## 11. Tense equivalence`: what a map is, the dimensions, `only`, the ladder, how to add a language, how to read a result (`match`, `relaxed`, `register`, `notes`, `none`). Plain ` ```ts ` fences only (not `signature` or `toy`).
- [ ] **Step 3:** `docs/api.md`: a section with a worked call (`equivalentTenses('fr', 'nl', { mood: 'indicative', tense: 'perfect' })` and its result), the result fields, the voice option, and the advice for a trainer: use `[0]` when `match` is `exact` or `override`; treat `approximate` as "ask, but show the note"; treat `none` as "compose by hand or skip"; show a `literary` or `dated` tense only when asked for.
- [ ] **Step 4:** `README.md`: one line under the package description: `Tense equivalence between any two languages: equivalentTenses(from, to, tense).`
- [ ] **Step 5:** `npm run typecheck && npm test` at the root — PASS (`tests/docs.test.ts` still green). Commit `docs(conjugation-engine): tense equivalence`.

---

# Part B — One task per further language

Each task runs as soon as its language is in `LanguageRegistry` (the pack merged). Each is independent of the other four. What a language plan's "equivalence map" step means (`src/equivalence/<code>.ts` "if the module exists"): do the Part B task of this plan, not the language design's section 10, which this plan supersedes where they differ (see "Reconciliation" and "Open questions"). If a stub `src/equivalence/<code>.ts` already exists, replace it.

**Shared files each Part B task touches, exactly:**
- `src/equivalence/index.ts`: one `import { <code> } from './<code>.js';` and one `<code>,` in the `maps` object; B4 also adds `'la'` to `passiveLanguages`.
- `src/i18n/locales/en/equivalence/index.ts` and `src/i18n/locales/nl/equivalence/index.ts`: one import and one spread each (`...<code>Notes`).
- `src/equivalence/overrides.ts`: B2 and B4 append rows; nothing else touches it.
- `tests/equivalence/matrix.tsv`: regenerated, never hand-edited. After merging another worktree, a conflict in this file is resolved by taking either side and running `npm run equivalence:matrix`.
- Nothing else: not the registry, not `src/languages/`, not `package.json`, not any test outside `tests/equivalence/`.

Every Part B task has the same five steps (the specifics are in the task):

- [ ] **Step 1: Failing test.** Create `tests/equivalence/expectations/<code>.ts` with the rows given. `npx vitest run tests/equivalence` — FAIL (`maps.test.ts` (a) and the rows of this language fail: no map).
- [ ] **Step 2:** Create the language's note files (en and nl) from the table, register them in the two locale indexes.
- [ ] **Step 3:** Create `src/equivalence/<code>.ts` from the table, register it in `src/equivalence/index.ts` (and the overrides/`passiveLanguages` lines the task names). `npm run typecheck` — PASS (totality: it fails for a missing or extra tense).
- [ ] **Step 4:** `npm run equivalence:matrix && npx vitest run tests/equivalence tests/i18n`. Expected: PASS; `wc -l tests/equivalence/matrix.tsv` equals `1 + (sum of tenses of the registered languages) × (number of registered languages)`; every line of the other languages' rows that does not involve `<code>` is unchanged (`git diff tests/equivalence/matrix.tsv` shows only added lines for the new language's rows as source or target, plus changed result lists where the new language is a target).
- [ ] **Step 5:** Commit `feat(conjugation-engine): <language> tense equivalence map`.

### Task B1: German (`de`, 19 tenses)

**Files:** Create `src/equivalence/de.ts`, `src/i18n/locales/{en,nl}/equivalence/de.ts`, `tests/equivalence/expectations/de.ts`; modify the shared files above.

**Interfaces:** `de` is `satisfies LanguageMap<'de'>`; note file exports `deNotes` (key prefix `eq.de.`). The design's section 10 is followed link for link (the German design says "20 entries" but its table has 19: Open questions); the German Konjunktiv II simple tense `subjunctive.past` carries `SUBJ_IMPERFECT 1` and `COND_PRESENT 0.9`, the würde-form `conditional.present` carries `COND_PRESENT 1`.

```ts
export const de = {
  'indicative.present': [link('PRESENT', 1), link('FUTURE', 0.5, { note: 'eq.de.present-future' })],
  'indicative.past': [link('PAST_IMPERFECTIVE', 1, { note: 'eq.de.past-written' }), link('PAST_PERFECTIVE', 0.8)],
  'indicative.perfect': [link('PRESENT_PERFECT', 1), link('PAST_PERFECTIVE', 0.9, { note: 'eq.de.perfect-spoken' })],
  'indicative.pluperfect': [link('PLUPERFECT', 1)],
  'indicative.future': [link('FUTURE', 1, { note: 'eq.de.future-supposition' })],
  'indicative.future_perfect': [link('FUTURE_PERFECT', 1)],
  'subjunctive.present': [link('SUBJ_PRESENT', 1, { note: 'eq.de.subjunctive-reported' })],
  'subjunctive.perfect': [link('SUBJ_PERFECT', 1, { note: 'eq.de.subjunctive-reported' })],
  'subjunctive.future': [link('SUBJ_FUTURE', 1, { note: 'eq.de.subjunctive-reported' })],
  'subjunctive.future_perfect': [link('SUBJ_FUTURE_PERFECT', 1, { note: 'eq.de.subjunctive-reported' })],
  'subjunctive.past': [link('SUBJ_IMPERFECT', 1, { note: 'eq.de.subjunctive-unreal' }), link('COND_PRESENT', 0.9)],
  'subjunctive.pluperfect': [link('SUBJ_PLUPERFECT', 1, { note: 'eq.de.subjunctive-unreal' }), link('COND_PERFECT', 0.9)],
  'conditional.present': [link('COND_PRESENT', 1)],
  'conditional.past': [link('COND_PERFECT', 0.6, { note: 'eq.de.conditional-past-rare' })],
  'imperative.present': [link('IMP_PRESENT', 1)],
  'infinitive.present': [link('INF_PRESENT', 1)],
  'infinitive.perfect': [link('INF_PERFECT', 1)],
  'participle.present': [link('PART_PRESENT', 1)],
  'participle.past': [link('PART_PAST', 1)],
} satisfies LanguageMap<'de'>;
```

Notes (7):

| Key | English | Dutch |
|---|---|---|
| `eq.de.present-future` | German often uses the present tense for the future, with a time word (ich komme morgen). | Het Duits gebruikt de tegenwoordige tijd vaak voor de toekomst, met een tijdsaanduiding (ich komme morgen). |
| `eq.de.past-written` | The Präteritum is the written narrative past; in speech German prefers the Perfekt. | Het Präteritum is de geschreven vertellende verleden tijd; in gesproken taal verkiest het Duits het Perfekt. |
| `eq.de.perfect-spoken` | The Perfekt is the usual spoken past and also covers finished events. | Het Perfekt is de gewone gesproken verleden tijd en dekt ook afgeronde gebeurtenissen. |
| `eq.de.future-supposition` | Futur I also expresses a supposition (er wird krank sein). | Futur I drukt ook een vermoeden uit (er wird krank sein). |
| `eq.de.subjunctive-reported` | Konjunktiv I is the form of reported speech. | Konjunktiv I is de vorm van de indirecte rede. |
| `eq.de.subjunctive-unreal` | Konjunktiv II expresses the unreal or the polite; in speech the würde form usually takes its place. | Konjunktiv II drukt het onwerkelijke of beleefde uit; in gesproken taal komt meestal de würde-vorm in de plaats. |
| `eq.de.conditional-past-rare` | The würde form with a perfect infinitive is rare; hätte plus past participle is preferred. | De würde-vorm met een voltooide infinitief is zeldzaam; hätte plus voltooid deelwoord verdient de voorkeur. |

Rows (`tests/equivalence/expectations/de.ts`; `de → it`, `de → la`, `de → es` rows live in the files of those languages when they exist):

```ts
  ['fr', 'indicative.perfect', 'de', 'indicative.perfect', 0.9, 'exact', { notes: ['eq.fr.perfect.spoken-past', 'eq.de.perfect-spoken'], second: 'indicative.past' }],
  ['de', 'indicative.past', 'fr', 'indicative.imperfect', 1, 'exact', { notes: ['eq.de.past-written'], second: 'indicative.perfect' }],
  ['de', 'indicative.past', 'nl', 'indicative.past', 1, 'exact', { notes: ['eq.de.past-written'], second: 'indicative.perfect' }],
  ['nl', 'indicative.perfect', 'de', 'indicative.perfect', 1, 'exact', { second: 'indicative.past' }],
  ['de', 'subjunctive.future', 'fr', 'indicative.future', 1, 'approximate', { relaxed: ['mood'], notes: ['eq.de.subjunctive-reported', 'eq.note.no-subjunctive'], second: 'indicative.near_future' }],
  ['de', 'subjunctive.past', 'fr', 'subjunctive.imperfect', 1, 'exact', { notes: ['eq.de.subjunctive-unreal'], second: 'conditional.present' }],
  ['de', 'subjunctive.past', 'nl', 'conditional.present', 0.9, 'exact'],
  ['de', 'infinitive.perfect', 'fr', 'infinitive.past', 1, 'exact'],
  ['de', 'infinitive.perfect', 'nl', 'participle.past', 0.4, 'approximate', { notes: ['eq.nl.compound-inf-perfect'] }],
  ['de', 'indicative.perfect', 'en', 'indicative.perfect', 1, 'exact', { second: 'indicative.past' }],
  ['en', 'indicative.perfect_progressive', 'de', 'indicative.present', 0.5, 'exact', { notes: ['eq.en.duration'], second: 'indicative.perfect' }],
  ['fr', 'gerund.present', 'de', null, 0, 'none', { notes: ['eq.note.no-counterpart'] }],
  ['de', 'indicative.present', 'fr', 'indicative.present', 1, 'exact', { second: 'indicative.future' }],
```

### Task B2: Spanish (`es`, 23 tenses)

**Files:** Create `src/equivalence/es.ts`, `src/i18n/locales/{en,nl}/equivalence/es.ts`, `tests/equivalence/expectations/es.ts`; modify the shared files above and `src/equivalence/overrides.ts` (one row).

**Interfaces:** `es` is `satisfies LanguageMap<'es'>`; `esNotes` (prefix `eq.es.`). Additions to the design's section 10: `imperative.negative` also links `IMP_PRESENT 0.6` with `only: 'source'` and note `eq.note.negation-added` (polarity is never relaxed, so without it a Spanish negative imperative would have no counterpart in French, German, Dutch, English or Latin). The two `dated` links (subjunctive future and future perfect) are the only `dated` links in the whole inventory. Override to add:

```ts
override({ from: 'es', to: 'nl', tense: 'subjunctive.pluperfect', mode: 'prepend',
  result: [{ tense: 'indicative.pluperfect', note: 'eq.pair.subjunctive-clause' }],
  reason: 'The Spanish -ra pluperfect subjunctive links COND_PERFECT 0.5, an exact match that ranks the Dutch conditional past first and hides the indicative pluperfect that renders a Spanish subordinate clause.' }),
```

```ts
export const es = {
  'indicative.present': [link('PRESENT', 1)],
  'indicative.perfect': [link('PRESENT_PERFECT', 1, { note: 'eq.es.perfect-spain' }), link('PAST_PERFECTIVE', 0.6)],
  'indicative.imperfect': [link('PAST_IMPERFECTIVE', 1)],
  'indicative.pluperfect': [link('PLUPERFECT', 1)],
  'indicative.simple_past': [link('PAST_PERFECTIVE', 1)],
  'indicative.past_anterior': [link('PAST_ANTERIOR', 1, { register: 'literary' })],
  'indicative.future': [link('FUTURE', 1, { note: 'eq.es.future-conjecture' })],
  'indicative.future_perfect': [link('FUTURE_PERFECT', 1)],
  'conditional.present': [link('COND_PRESENT', 1)],
  'conditional.past': [link('COND_PERFECT', 1)],
  'subjunctive.present': [link('SUBJ_PRESENT', 1)],
  'subjunctive.past': [link('SUBJ_PERFECT', 1)],
  'subjunctive.imperfect': [link('SUBJ_IMPERFECT', 1)],
  'subjunctive.pluperfect': [link('SUBJ_PLUPERFECT', 1), link('COND_PERFECT', 0.5, { note: 'eq.es.subjunctive-pluperfect-conditional' })],
  'subjunctive.future': [link('SUBJ_FUTURE', 1, { register: 'dated' })],
  'subjunctive.future_perfect': [link('SUBJ_FUTURE_PERFECT', 1, { register: 'dated' })],
  'imperative.present': [link('IMP_PRESENT', 1)],
  'imperative.negative': [link('IMP_NEGATIVE', 1), link('IMP_PRESENT', 0.6, { note: 'eq.note.negation-added', only: 'source' })],
  'infinitive.present': [link('INF_PRESENT', 1)],
  'infinitive.past': [link('INF_PERFECT', 1)],
  'gerund.present': [link('GERUND', 1)],
  'gerund.past': [link('GERUND_PERFECT', 1)],
  'participle.past': [link('PART_PAST', 1)],
} satisfies LanguageMap<'es'>;
```

Notes (3):

| Key | English | Dutch |
|---|---|---|
| `eq.es.perfect-spain` | In Spain the pretérito perfecto compuesto expresses a recent past; much of Latin America uses the simple past instead. | In Spanje drukt het pretérito perfecto compuesto een recent verleden uit; in een groot deel van Latijns-Amerika staat de enkelvoudige verleden tijd in de plaats. |
| `eq.es.future-conjecture` | The future also expresses conjecture (será verdad). | De toekomende tijd drukt ook een vermoeden uit (será verdad). |
| `eq.es.subjunctive-pluperfect-conditional` | The -ra form of this tense also serves in conditional sentences (hubiera ido). | De -ra-vorm van deze tijd dient ook in voorwaardelijke zinnen (hubiera ido). |

Rows:

```ts
  ['fr', 'indicative.perfect', 'es', 'indicative.simple_past', 1, 'exact', { notes: ['eq.fr.perfect.spoken-past'], second: 'indicative.perfect' }],
  ['es', 'indicative.simple_past', 'fr', 'indicative.perfect', 1, 'exact', { notes: ['eq.fr.perfect.spoken-past'], second: 'indicative.simple_past' }],
  ['es', 'subjunctive.future', 'fr', 'indicative.future', 1, 'approximate', { relaxed: ['mood'], notes: ['eq.note.no-subjunctive'], second: 'indicative.near_future' }],
  ['de', 'subjunctive.future', 'es', 'subjunctive.future', 1, 'approximate', { relaxed: ['register'], notes: ['eq.de.subjunctive-reported', 'eq.note.relaxed-register'] }],
  ['es', 'imperative.negative', 'it', 'imperative.negative', 1, 'exact', { second: 'imperative.present' }],
  ['es', 'imperative.negative', 'fr', 'imperative.present', 0.6, 'exact', { notes: ['eq.note.negation-added'] }],
  ['es', 'subjunctive.pluperfect', 'nl', 'indicative.pluperfect', 1, 'override', { notes: ['eq.pair.subjunctive-clause'], second: 'conditional.past' }],
  ['es', 'indicative.perfect', 'en', 'indicative.perfect', 1, 'exact', { notes: ['eq.es.perfect-spain'], second: 'indicative.perfect_progressive' }],
  ['en', 'indicative.past', 'es', 'indicative.simple_past', 0.6, 'exact', { notes: ['eq.en.past-both'], second: 'indicative.imperfect' }],
  ['fr', 'imperative.present', 'es', 'imperative.present', 1, 'exact'],
  ['es', 'subjunctive.future', 'es', 'subjunctive.future', 1, 'exact'],
  ['es', 'indicative.past_anterior', 'nl', 'indicative.pluperfect', 1, 'approximate', { relaxed: ['aspect'], notes: ['eq.note.relaxed-aspect'] }],
```

### Task B3: Italian (`it`, 22 tenses)

**Files:** Create `src/equivalence/it.ts`, `src/i18n/locales/{en,nl}/equivalence/it.ts`, `tests/equivalence/expectations/it.ts`; modify the shared files above.

**Interfaces:** `it` is `satisfies LanguageMap<'it'>`; `itNotes` (prefix `eq.it.`). Differences from the design's section 10 (all in "Reconciliation"): names reconciled; `indicative.past_anterior` is `PAST_ANTERIOR 1` plus `PLUPERFECT 0.6`, both literary; `EPISTEMIC_*` and `FUTURE_IN_PAST` links dropped and the weights of the other link raised to 1 (`indicative.future` `FUTURE 1`, `indicative.future_perfect` `FUTURE_PERFECT 1`, `conditional.past` `COND_PERFECT 1`), the reading kept as a note; `imperative.negative` gets the source-only `IMP_PRESENT 0.6` as in Spanish.

```ts
export const it = {
  'indicative.present': [link('PRESENT', 1)],
  'indicative.perfect': [link('PRESENT_PERFECT', 0.6, { note: 'eq.it.perfect-spoken' }), link('PAST_PERFECTIVE', 0.4)],
  'indicative.imperfect': [link('PAST_IMPERFECTIVE', 1)],
  'indicative.pluperfect': [link('PLUPERFECT', 1)],
  'indicative.simple_past': [link('PAST_PERFECTIVE', 1, { register: 'literary', note: 'eq.it.simple-past-remote' })],
  'indicative.past_anterior': [link('PAST_ANTERIOR', 1, { register: 'literary' }), link('PLUPERFECT', 0.6, { register: 'literary' })],
  'indicative.future': [link('FUTURE', 1, { note: 'eq.it.future-supposition' })],
  'indicative.future_perfect': [link('FUTURE_PERFECT', 1)],
  'subjunctive.present': [link('SUBJ_PRESENT', 1)],
  'subjunctive.past': [link('SUBJ_PERFECT', 1)],
  'subjunctive.imperfect': [link('SUBJ_IMPERFECT', 1)],
  'subjunctive.pluperfect': [link('SUBJ_PLUPERFECT', 1)],
  'conditional.present': [link('COND_PRESENT', 1)],
  'conditional.past': [link('COND_PERFECT', 1, { note: 'eq.it.cond-past-future-in-past' })],
  'imperative.present': [link('IMP_PRESENT', 1)],
  'imperative.negative': [link('IMP_NEGATIVE', 1), link('IMP_PRESENT', 0.6, { note: 'eq.note.negation-added', only: 'source' })],
  'infinitive.present': [link('INF_PRESENT', 1)],
  'infinitive.past': [link('INF_PERFECT', 1)],
  'participle.present': [link('PART_PRESENT', 1)],
  'participle.past': [link('PART_PAST', 1)],
  'gerund.present': [link('GERUND', 1)],
  'gerund.past': [link('GERUND_PERFECT', 1)],
} satisfies LanguageMap<'it'>;
```

Notes (4):

| Key | English | Dutch |
|---|---|---|
| `eq.it.perfect-spoken` | In northern and spoken Italian the passato prossimo replaces the passato remoto. | In het noordelijke en gesproken Italiaans vervangt het passato prossimo het passato remoto. |
| `eq.it.simple-past-remote` | The passato remoto is the narrative or remote past, still common in the south. | Het passato remoto is de vertellende of verre verleden tijd, nog gewoon in het zuiden. |
| `eq.it.future-supposition` | The future also expresses supposition (sarà vero). | De toekomende tijd drukt ook een vermoeden uit (sarà vero). |
| `eq.it.cond-past-future-in-past` | The conditional past also expresses the future seen from the past (disse che sarebbe venuto). | De voorwaardelijke verleden tijd drukt ook de toekomst uit gezien vanuit het verleden (disse che sarebbe venuto). |

Rows:

```ts
  ['fr', 'indicative.simple_past', 'it', 'indicative.simple_past', 1, 'exact', { notes: ['eq.it.simple-past-remote'], second: 'indicative.perfect' }],
  ['it', 'indicative.perfect', 'fr', 'indicative.perfect', 0.48, 'exact', { notes: ['eq.it.perfect-spoken'], second: 'indicative.simple_past' }],
  ['it', 'indicative.past_anterior', 'es', 'indicative.past_anterior', 1, 'exact', { second: 'indicative.pluperfect' }],
  ['fr', 'gerund.past', 'it', 'gerund.past', 1, 'exact'],
  ['it', 'conditional.past', 'fr', 'conditional.past', 1, 'exact', { notes: ['eq.it.cond-past-future-in-past'] }],
  ['it', 'indicative.future', 'nl', 'indicative.future', 1, 'exact', { notes: ['eq.it.future-supposition'], second: 'indicative.present' }],
  ['en', 'subjunctive.past', 'it', 'subjunctive.imperfect', 1, 'exact', { notes: ['eq.en.subjunctive-irrealis'] }],
  ['it', 'indicative.past_anterior', 'nl', 'indicative.pluperfect', 0.6, 'exact'],
```

### Task B4: Latin (`la`, 21 tenses; voices)

**Files:** Create `src/equivalence/la.ts`, `src/i18n/locales/{en,nl}/equivalence/la.ts`, `tests/equivalence/expectations/la.ts`, `tests/equivalence/voice.test.ts`; modify the shared files above (`passiveLanguages` gains `'la'`) and `src/equivalence/overrides.ts` (two rows).

**Interfaces:** `la` is `satisfies LanguageMap<'la'>`; `laNotes` (prefix `eq.la.`). The map is the design's section 10 plus notes on the four tenses without a counterpart elsewhere (`infinitive.future`, `participle.future`, `participle.gerundive`, `supine.present`) and on the imperative future. Voice is not a concept dimension: every Latin map entry describes the active tense and the passive of the same tense is the same entry asked with `{ voice: 'passive' }`. Overrides to add:

```ts
override({ from: 'la', to: 'nl', tense: 'subjunctive.imperfect', mode: 'prepend',
  result: [{ tense: 'indicative.past', note: 'eq.pair.subjunctive-clause' }],
  reason: 'The Latin imperfect subjunctive links COND_PRESENT 0.6, an exact match that ranks the Dutch conditional first and hides the indicative past that renders a Latin subordinate clause (cum amaret).' }),
override({ from: 'la', to: 'nl', tense: 'subjunctive.pluperfect', mode: 'prepend',
  result: [{ tense: 'indicative.pluperfect', note: 'eq.pair.subjunctive-clause' }],
  reason: 'The Latin pluperfect subjunctive links COND_PERFECT 0.6, an exact match that ranks the Dutch conditional past first and hides the indicative pluperfect that renders a Latin subordinate clause (cum amavisset).' }),
```

```ts
export const la = {
  'indicative.present': [link('PRESENT', 1)],
  'indicative.imperfect': [link('PAST_IMPERFECTIVE', 1)],
  'indicative.future': [link('FUTURE', 1)],
  'indicative.perfect': [link('PAST_PERFECTIVE', 1, { note: 'eq.la.perfect-both' }), link('PRESENT_PERFECT', 1)],
  'indicative.pluperfect': [link('PLUPERFECT', 1)],
  'indicative.future_perfect': [link('FUTURE_PERFECT', 1)],
  'subjunctive.present': [link('SUBJ_PRESENT', 1)],
  'subjunctive.imperfect': [link('SUBJ_IMPERFECT', 1), link('COND_PRESENT', 0.6, { note: 'eq.la.subjunctive-unreal' })],
  'subjunctive.perfect': [link('SUBJ_PERFECT', 1)],
  'subjunctive.pluperfect': [link('SUBJ_PLUPERFECT', 1), link('COND_PERFECT', 0.6, { note: 'eq.la.subjunctive-unreal' })],
  'imperative.present': [link('IMP_PRESENT', 1)],
  'imperative.future': [link('IMP_FUTURE', 1, { note: 'eq.la.imperative-future' }), link('IMP_PRESENT', 0.4)],
  'infinitive.present': [link('INF_PRESENT', 1)],
  'infinitive.perfect': [link('INF_PERFECT', 1)],
  'infinitive.future': [link('INF_FUTURE', 1, { note: 'eq.la.infinitive-future' })],
  'participle.present': [link('PART_PRESENT', 1)],
  'participle.perfect': [link('PART_PAST', 1, { note: 'eq.la.deponent-participle' })],
  'participle.future': [link('PART_FUTURE', 1, { note: 'eq.la.participle-future' })],
  'participle.gerundive': [link('GERUNDIVE', 1, { note: 'eq.la.gerundive' })],
  'gerund.present': [link('GERUND', 1)],
  'supine.present': [link('SUPINE', 1, { note: 'eq.la.supine' })],
} satisfies LanguageMap<'la'>;
```

Notes (8):

| Key | English | Dutch |
|---|---|---|
| `eq.la.perfect-both` | The Latin perfect covers both the perfect (I have loved) and the historic past (I loved). | Het Latijnse perfectum dekt zowel het voltooid tegenwoordige (ik heb bemind) als het verleden (ik beminde). |
| `eq.la.subjunctive-unreal` | Unreal conditions use the subjunctive; this tense stands for the conditional of other languages. | Irreële voorwaarden gebruiken de coniunctivus; deze tijd staat voor de voorwaardelijke wijs van andere talen. |
| `eq.la.imperative-future` | The future imperative is used for formal and legal commands. | De imperativus futuri wordt gebruikt voor formele en juridische bevelen. |
| `eq.la.deponent-participle` | The perfect participle of a deponent verb has an active meaning. | Het participium perfectum van een deponens heeft een actieve betekenis. |
| `eq.la.infinitive-future` | Latin has a future infinitive (amaturum esse); other languages express it with a clause. | Het Latijn heeft een infinitivus futuri (amaturum esse); andere talen drukken dit met een bijzin uit. |
| `eq.la.participle-future` | The future participle (amaturus) means about to do; other languages use a periphrasis. | Het participium futuri (amaturus) betekent op het punt staan te doen; andere talen gebruiken een omschrijving. |
| `eq.la.gerundive` | The gerundive (amandus) means to be done or must be done; other languages use a periphrasis. | Het gerundivum (amandus) betekent te doen of moet gedaan worden; andere talen gebruiken een omschrijving. |
| `eq.la.supine` | The supine expresses purpose after verbs of motion (venit spectatum); other languages use an infinitive clause. | Het supinum drukt doel uit na werkwoorden van beweging (venit spectatum); andere talen gebruiken een infinitiefzin. |

Rows:

```ts
  ['la', 'indicative.perfect', 'fr', 'indicative.perfect', 1, 'exact', { notes: ['eq.la.perfect-both', 'eq.fr.perfect.spoken-past'], second: 'indicative.simple_past' }],
  ['fr', 'indicative.imperfect', 'la', 'indicative.imperfect', 1, 'exact'],
  ['la', 'subjunctive.imperfect', 'nl', 'indicative.past', 1, 'override', { notes: ['eq.pair.subjunctive-clause'], second: 'conditional.present' }],
  ['la', 'infinitive.future', 'en', null, 0, 'none', { notes: ['eq.note.no-counterpart', 'eq.la.infinitive-future'] }],
  ['la', 'supine.present', 'fr', null, 0, 'none', { notes: ['eq.note.no-counterpart', 'eq.la.supine'] }],
  ['la', 'participle.gerundive', 'la', 'participle.gerundive', 1, 'exact'],
  ['la', 'imperative.future', 'es', 'imperative.present', 0.4, 'exact'],
  ['de', 'subjunctive.past', 'la', 'subjunctive.imperfect', 1, 'exact', { notes: ['eq.de.subjunctive-unreal'] }],
  ['la', 'gerund.present', 'nl', 'participle.present', 0.5, 'exact', { notes: ['eq.nl.gerund-as-participle'] }],
  ['la', 'participle.perfect', 'fr', 'participle.past', 1, 'exact', { notes: ['eq.la.deponent-participle'] }],
  ['en', 'participle.present', 'la', 'participle.present', 0.6, 'exact', { second: 'gerund.present' }],
  ['la', 'participle.future', 'en', null, 0, 'none', { notes: ['eq.note.no-counterpart', 'eq.la.participle-future'] }],
  ['la', 'infinitive.perfect', 'nl', 'participle.past', 0.4, 'approximate', { notes: ['eq.nl.compound-inf-perfect'] }],
```

Voice test (`tests/equivalence/voice.test.ts`, extra to the five steps): `equivalentTenses('la', 'la', { mood: 'indicative', tense: 'perfect' }, { voice: 'passive' })` equals the active call; `equivalentTenses('la', 'fr', { mood: 'indicative', tense: 'perfect' }, { voice: 'passive' })` is the active list with every entry `approximate` and `notes` ending `eq.note.passive-not-modelled` (first entry `indicative.perfect`, score 1, notes `['eq.la.perfect-both', 'eq.fr.perfect.spoken-past', 'eq.note.passive-not-modelled']`); `equivalentTenses('fr', 'la', …, { voice: 'passive' })` throws `INVALID_REQUEST`; a `none` entry (`la` supine, passive) is unchanged; `passiveLanguages` is `['la']`.

### Task B5: English (`en`, 24 tenses)

**Files:** Create `src/equivalence/en.ts`, `src/i18n/locales/{en,nl}/equivalence/en.ts`, `tests/equivalence/expectations/en.ts`; modify the shared files above.

**Interfaces:** `en` is `satisfies LanguageMap<'en'>`; the note file exports `enNotes` (prefix `eq.en.`; the file is `src/i18n/locales/en/equivalence/en.ts` and `…/nl/equivalence/en.ts`: name the export `enNotes` so it does not collide with the `en` catalog). Each progressive tense links its own progressive concept at 1 and the design's link at the design's weight (Reconciliation); `participle.present` is `PART_PRESENT 0.6` and `GERUND 0.4`; English has no perfect infinitive, perfect participle or perfect gerund in the catalogue, so a French `infinitive.past` into English is `none` (Open questions).

```ts
export const en = {
  'indicative.present': [link('PRESENT', 1)],
  'indicative.past': [link('PAST_PERFECTIVE', 0.6, { note: 'eq.en.past-both' }), link('PAST_IMPERFECTIVE', 0.4)],
  'indicative.perfect': [link('PRESENT_PERFECT', 1)],
  'indicative.pluperfect': [link('PLUPERFECT', 1)],
  'indicative.future': [link('FUTURE', 1)],
  'indicative.future_perfect': [link('FUTURE_PERFECT', 1)],
  'indicative.present_progressive': [link('PRESENT_PROGRESSIVE', 1), link('PRESENT', 0.9, { note: 'eq.en.progressive' })],
  'indicative.past_progressive': [link('PAST_PROGRESSIVE', 1), link('PAST_IMPERFECTIVE', 0.9, { note: 'eq.en.progressive' })],
  'indicative.perfect_progressive': [
    link('PRESENT_PERFECT_PROGRESSIVE', 1),
    link('PRESENT_PERFECT', 0.5, { note: 'eq.en.duration' }),
    link('PRESENT', 0.5, { note: 'eq.en.duration' }),
  ],
  'indicative.pluperfect_progressive': [
    link('PLUPERFECT_PROGRESSIVE', 1),
    link('PLUPERFECT', 0.5, { note: 'eq.en.duration' }),
    link('PAST_IMPERFECTIVE', 0.5, { note: 'eq.en.duration' }),
  ],
  'indicative.future_progressive': [link('FUTURE_PROGRESSIVE', 1), link('FUTURE', 0.9, { note: 'eq.en.progressive' })],
  'indicative.future_perfect_progressive': [link('FUTURE_PERFECT_PROGRESSIVE', 1), link('FUTURE_PERFECT', 0.9, { note: 'eq.en.progressive' })],
  'conditional.present': [link('COND_PRESENT', 1)],
  'conditional.past': [link('COND_PERFECT', 1)],
  'conditional.present_progressive': [link('COND_PROGRESSIVE', 1), link('COND_PRESENT', 0.9, { note: 'eq.en.progressive' })],
  'conditional.past_progressive': [link('COND_PERFECT_PROGRESSIVE', 1), link('COND_PERFECT', 0.9, { note: 'eq.en.progressive' })],
  'subjunctive.present': [link('SUBJ_PRESENT', 1, { note: 'eq.en.subjunctive-mandative' })],
  'subjunctive.past': [link('SUBJ_IMPERFECT', 1, { note: 'eq.en.subjunctive-irrealis' })],
  'subjunctive.perfect': [link('SUBJ_PERFECT', 1)],
  'subjunctive.pluperfect': [link('SUBJ_PLUPERFECT', 1)],
  'imperative.present': [link('IMP_PRESENT', 1)],
  'infinitive.present': [link('INF_PRESENT', 1)],
  'participle.present': [link('PART_PRESENT', 0.6), link('GERUND', 0.4, { note: 'eq.en.ing-both' })],
  'participle.past': [link('PART_PAST', 1)],
} satisfies LanguageMap<'en'>;
```

Notes (6):

| Key | English | Dutch |
|---|---|---|
| `eq.en.progressive` | The English progressive stresses an action in progress; other languages use the plain tense, or a periphrasis such as aan het plus infinitive in Dutch. | De Engelse progressive benadrukt een handeling die bezig is; andere talen gebruiken de gewone tijd, of een omschrijving zoals aan het plus infinitief in het Nederlands. |
| `eq.en.duration` | The perfect progressive expresses a duration up to the reference time; many languages use the plain present or past with a time phrase (ik wacht al een uur). | De perfect progressive drukt een duur tot het referentiemoment uit; veel talen gebruiken de gewone tegenwoordige of verleden tijd met een tijdsbepaling (ik wacht al een uur). |
| `eq.en.past-both` | The English simple past covers both finished events and ongoing states; other languages split them between two tenses. | De Engelse simple past dekt zowel afgeronde gebeurtenissen als voortdurende toestanden; andere talen verdelen die over twee tijden. |
| `eq.en.subjunctive-mandative` | The present subjunctive is used after verbs of demand and in formal English (that he be told). | De tegenwoordige aanvoegende wijs staat na werkwoorden van eis en in formeel Engels (that he be told). |
| `eq.en.subjunctive-irrealis` | The past subjunctive marks the unreal after if (if I were); French uses the imperfect after si and Dutch the simple past. | De aanvoegende verleden tijd markeert het onwerkelijke na if (if I were); het Frans gebruikt de imparfait na si en het Nederlands de onvoltooid verleden tijd. |
| `eq.en.ing-both` | The -ing form serves both as a participle and as a gerund. | De -ing-vorm dient zowel als deelwoord als als gerundium. |

Rows:

```ts
  ['fr', 'indicative.perfect', 'en', 'indicative.perfect', 0.8, 'exact', { second: 'indicative.past' }],
  ['en', 'indicative.past', 'fr', 'indicative.perfect', 0.6, 'exact', { notes: ['eq.en.past-both', 'eq.fr.perfect.spoken-past'], second: 'indicative.simple_past' }],
  ['en', 'indicative.present_progressive', 'fr', 'indicative.present', 0.9, 'exact', { notes: ['eq.en.progressive'] }],
  ['en', 'indicative.perfect_progressive', 'nl', 'indicative.present', 0.5, 'exact', { notes: ['eq.en.duration'], second: 'indicative.perfect' }],
  ['en', 'subjunctive.past', 'nl', 'indicative.past', 1, 'approximate', { relaxed: ['mood'], notes: ['eq.en.subjunctive-irrealis', 'eq.note.no-subjunctive'], second: 'indicative.perfect' }],
  ['fr', 'subjunctive.imperfect', 'en', 'subjunctive.past', 1, 'exact', { notes: ['eq.en.subjunctive-irrealis'] }],
  ['fr', 'indicative.near_future', 'en', 'indicative.future', 0.6, 'exact', { second: 'indicative.future_progressive' }],
  ['en', 'indicative.present_progressive', 'en', 'indicative.present_progressive', 1, 'exact', { second: 'indicative.present' }],
  ['en', 'participle.present', 'fr', 'participle.present', 0.6, 'exact', { second: 'gerund.present' }],
  ['en', 'indicative.pluperfect_progressive', 'nl', 'indicative.past', 0.5, 'exact', { notes: ['eq.en.duration'], second: 'indicative.pluperfect' }],
  ['nl', 'indicative.present', 'en', 'indicative.present', 1, 'exact', { second: 'indicative.present_progressive' }],
```

---

## Open questions

1. **Return shape.** The design input types the result `readonly TenseEquivalent[]` and requires "no empty result without a note". An empty array has nowhere for a note, so this plan makes the array never empty: no counterpart is a single `{ match: 'none', tense: null }` entry with notes. Callers must test `match === 'none'`. The alternative is an object `{ matches, notes }`. Decide before the trainer is switched.
2. **French and Dutch weights.** N6 offers Dutch weights or an override; this plan takes the weights (nl perfect `PAST_PERFECTIVE 0.6`, nl past `PAST_PERFECTIVE 0.7`, against the fr perfect's `0.8` on `PRESENT_PERFECT`). The margins (0.80 against 0.70, 0.70 against 0.60) are real but small; the acceptance test pins them. If the Dutch weights are ever tuned for other pairs, pin fr → nl with `replace` overrides instead.
3. **No Dutch design table.** The brief points at "the table in the German design's tense-concepts section" for Dutch; that section has no Dutch table. The Dutch map is derived from N6, the app's tables and the Dutch catalogue; the weights not forced by the acceptance test (`FUTURE 0.4` on the Dutch present, `GERUND 0.5` on the present participle, the stand-in weight 0.4) are the plan author's.
4. **Italian design.** (a) `EPISTEMIC_PRESENT`, `EPISTEMIC_PAST` and `FUTURE_IN_PAST` cannot be told apart from `PRESENT`, `FUTURE_PERFECT` and `COND_PERFECT` by the dimensions: dropped, weights raised, reading as a note. Adding a `modality: 'epistemic'` dimension would restore them. (b) The design maps the trapassato remoto to `PLUPERFECT 0.6` only; N7, French and Spanish use `PAST_ANTERIOR`; this plan has both.
5. **German design.** Says 20 catalogue entries; its table lists 19. The map has 19; the German pack's catalogue decides (the totality test will say). Its `conditional.past` weight 0.6 for `COND_PERFECT` is rare by the design's own note; Dutch `conditional.past` therefore does not rank it first in `nl → de` (`subjunctive.pluperfect` 0.9 does).
6. **English design.** Links progressives only to non-progressive concepts; this plan adds the progressive concepts at 1 (identity and `en → en` ranking need them). English has no perfect infinitive or participle in the catalogue; French `infinitive.past`, `participle.perfect`, `gerund.past` and `imperative.past` into English are `none`. A stand-in on `participle.past` like the Dutch one is possible; not done because the design is silent.
7. **French passé composé into English.** With the designs' weights, fr perfect → en gives present perfect 0.80 before simple past 0.60 (the French passé composé links `PRESENT_PERFECT 0.8`). A trainer author may want the simple past first for narrative questions; the fix is a `fr → en` `prepend` override or a lower French `PRESENT_PERFECT` weight, which would also move fr → nl. Left as the designs have it and pinned in the `en` rows.
8. **Source-only and target-only links** (`only`), and `IMP_PRESENT 0.6` on the Spanish and Italian negative imperatives, are not in the designs. Without them polarity (never relaxed, by the brief) leaves the negative imperatives and the compound non-finite forms with no counterpart.
9. **The register step of the ladder** is given a concrete meaning (admit `dated` target links); the brief's ladder starts with register but the designs mark only Spanish subjunctive future and future perfect `dated`. If more tenses become `dated`, they are offered only when nothing else corresponds.
10. **Voice.** Only Latin has a modelled passive. `voice: 'passive'` applies to tenses a language lists with voices; for Latin participles, gerund and supine (no voices) a passive request is treated like an active one. Out of scope: deponent verbs (active meaning, passive form) and the Latin periphrastic conjugations.
11. **Concept dimensions.** `PART_PAST` has `time: past` (N7: `present`); `SUBJ_IMPERFECT` has `aspect: imperfective`; German Konjunktiv II "Präteritum" is `SUBJ_IMPERFECT` with `COND_PRESENT 0.9`, which makes `de subjunctive.past → fr` offer the subjonctif imparfait (literary) before the conditionnel (0.90); a trainer may prefer the opposite.
12. **Noise.** Lists carry every shared concept however weak (`nl indicative.present → fr indicative.near_future 0.24`). No threshold is applied; a trainer can cut below 0.3. The matrix is long (1,022 lines at seven languages) by design, so changes are visible.
13. **Dutch note texts** are the plan author's; a Dutch reader should check them (especially `eq.nl.perfect.spoken-past`, `eq.la.*`, `eq.en.*`). They are free of apostrophes and braces on purpose.
14. **Person-level information** (the first person plural imperative is `laten we`; `ik` vs formal slots) is not tense-level equivalence: it appears only as notes (`eq.pair.fr-nl.hortative`).
15. **Coordination with the language plans.** Their "equivalence map stub if the module exists" step is replaced by the Part B task. Because the registry map is `satisfies { [L in Language]: LanguageMap<L> }`, a language registered after Part A does not compile until its map exists: its language plan must run the Part B task in the same branch, or do it right after merging. A language plan that wrote a partial stub must replace it, not extend it.

---

## Controller rulings on the open questions (binding for implementers)

1. **Return shape (open question 1).** `equivalentTenses(from, to, tense)` returns `{ readonly matches: readonly TenseEquivalent[]; readonly notes: readonly string[] }`. `matches` is ranked and may be empty; `notes` holds the note keys that apply to the query as a whole (for example why there is no counterpart). There is no `match: 'none'` entry and no entry with `tense: null`. "No empty result without a note" means: when `matches` is empty, `notes` is not. Adjust the tasks, tests and matrix format of this plan accordingly.
2. **French passé composé → English (open question 5).** The approved design fixes the order: simple past first, present perfect second (with a note that the present perfect applies when the result still matters). Achieve it through the English weights if that does not disturb other pairs, otherwise through a `fr → en` override; pin it in the expectation rows.
3. **Italian epistemic and future-in-the-past readings (open question 3):** dropping the duplicate concepts and keeping the reading as a note is accepted; adding `PAST_ANTERIOR` for the trapassato remoto is accepted.
4. **German catalogue count (open question 4):** the catalogue in the German pack as implemented is authoritative; the map must be total over it.
5. **Stand-ins and the register step (open questions 6 and 7):** accepted as proposed.
6. **Dutch note texts** were written by the plan author and need a Dutch reader; they are flagged for the user's review in the final summary, not a blocker.
7. The remaining open questions are left to the implementer, who records each decision in the task report.
