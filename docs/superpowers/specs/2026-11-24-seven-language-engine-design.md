# Seven-language, rule-first conjugation engine

## Context

`packages/conjugation-engine` conjugates French and Dutch. The goal is one engine for **fr, nl, de, en, es, it, la** in which every language:

- derives forms from the grammatical rules of an authoritative source instead of looking them up;
- can explain any form step by step (stem → ending → spelling change → compound tense → clause), each step citing its source;
- applies the rules to invented verbs, recording every default it had to assume;
- is tested against the scraped VerbodromeX tables, which are treated as a fallible oracle.

French and Dutch move onto the same structure. A tense-equivalence table lets the trainer build translated questions for any source → target pair later.

Why now: the two existing engines are built differently (French = 113 ending tables since commit `927302b`, Dutch = rule code), two languages are hard-coded across shared modules, and nothing in the engine explains a form — the trainer's explanation text is hand-written in the app.

### Decisions taken with the user

| Topic | Decision |
|---|---|
| Architecture | Common spine, rules as code; data only for regular ending sets and a lexicon of irregular stems / principal parts |
| French | Rebuilt rule-first, keeping suffix-selected families from yesterday's rewrite; **no regressions** |
| Explanations | Structured steps; text in Dutch + English via ICU message catalogs, expandable to more locales |
| Tense equivalence | Pivot through shared tense concepts, with per-pair overrides |
| Delivery | One branch, one PR; ordered commits that each stay green |

My calls (not asked, correct me if wrong): the trainer app is only kept compiling and passing; moving it to engine explanations is a follow-up. Scope stays affirmative active-voice paradigms, plus passive/deponent for Latin. The engine keeps zero runtime dependencies.

## Approaches considered

- **A. Common spine, rules as code (chosen).** Same stages and file layout per language; rules are small functions that record their step.
- **B. Generic interpreter, grammar as data.** Most uniform, but agreement, separable prefixes, deponents and stress need escape hatches and the rule language becomes hard to debug.
- **C. Shared explanation contract only.** Cheapest; leaves seven differently built engines.
- Rejected outright: ending tables everywhere with explanations bolted on — cannot reason from rules.

## Target layout

```
packages/conjugation-engine/src/
  core/         spec + registry types, pack contract, derivation, rule runner, forks,
                periphrasis executor, orchestration, render, options schema
  i18n/         ICU-subset formatter, explain(); locales/{en,nl}/<lang>.ts
  equivalence/  concepts, <lang>.ts maps, overrides
  languages/<lang>/
    catalogue.ts    moods, tenses, subject slots, native labels
    lexicon.ts      irregular families: stems / principal parts, flags      (data)
    paradigms.ts    regular ending sets                                     (data)
    stems.ts        stem formation rules                                    (code)
    orthography.ts  spelling rules                                          (code)
    periphrasis.ts  compound tenses as chains                               (data)
    clause.ts       pronouns, clitics, word order, sandhi
    sources.ts      citation per rule id
```

## Core design

**Types (`core/spec.ts`, `languages/registry.ts`).** A closed `LanguageRegistry` interface maps each language code to a `LanguageSpec` (tenses per mood, non-finite moods, subject slots, auxiliaries, class hints, stem hints, named variants, extra target dimensions, agreement, context options). `Language`, `Mood`, `Tense`, `TensesFor<L>`, `ConjugationOptionsFor<L>` are derived from it by mapped types; no pairwise conditionals. `FrenchTenses`, `DutchTenses`, `FrenchConjugationOptions`, `DutchConjugationOptions` remain as aliases because the app imports them.

New shared features:

| Need | Modelled as |
|---|---|
| Latin voice | target dimension `voice`; deponents report `noPassive` |
| Latin declined participles | `Agreement.case`, gender gains `neuter`; default citation forms |
| Sie / usted / Lei / u | `SubjectSlot { id, person, number, pronoun, register, default }` per pack |
| English progressive | separate tense ids with `features.aspect` |
| Negative imperative (es, it) | tense `imperative.negative` |
| -ra/-se, y/i, conditionnel 2e forme | `variant.pattern`; region labels in new `variant.region` |
| Separable prefixes (de, nl) | `lexeme.particle { text, separable }`, placed by the clause |
| Macrons (la) | lexicon and output carry them; input accepted without; `normalizeForComparison()` exported |

**Subject gender.** Gender is a shared target dimension, not a French option. Omitting `gender` in a query returns every gender, each form tagged with `target.gender`; passing it filters. Each pack declares where gender shows:

| Language | Where gender is visible |
|---|---|
| fr | `elle` / `elles`; participle agreement with être verbs and reflexives (`je suis allée`, `nous sommes allées`) |
| it | `lei`; participle agreement with essere verbs and reflexives (`sono andata`, `siamo andate`) |
| la | perfect passive and deponent periphrasis in three genders (`amāta sum`, `amātum est`) |
| es | pronoun only (`ella`, `nosotras`, `vosotras`, `ellas`); participle with haber is invariable |
| de, nl, en | 3rd singular pronoun only (`sie` / `es`, `zij` / `het`, `she` / `it`) |

What an unfiltered query returns (my call, keeps today's output stable):

- Where gender changes the verb phrase (fr, it, la), all genders are returned, as French does today.
- Pronoun-only gender (`zij` / `het`, `sie` / `es`, `she` / `it`, `ella`, `nosotras`) and formal subjects (`u`, `Sie`, `usted`, `Lei`) are non-default subject slots: returned only when asked for via `gender` or `subject`. So a Dutch 3sg query still returns `hij` alone and the Dutch snapshot stays exact.
- Gender is a target dimension, not a variant, so the "extra forms must carry a variant tag" guard compares within one gender.

Agreement is a clause-stage rule that records its own step ("with être the participle agrees with the subject: feminine → + e"). French already works this way (`gender`, `agreement`, `_feminin` corpus files); the snapshot is taken with and without `gender` so that behaviour is pinned.

**Pack contract (`core/pack.ts`).** The orchestrator talks to one small contract, `LanguageEngine.generate(target)`. A `LanguagePack` supplies `catalogue`, `options` (declarative validation schema), `rendering` (onset, sandhi, bare omission), `rank`, optional target and form filters, `rules`, `works`, `citations`, and an `engine(query)` factory. Rule-first packs build that factory with `stagedEngine(grammar)`, where a `StagedGrammar` has the stage hooks `classify`, `availability`, `cellOf`, optional whole-cell `cell`, `stem`, `ending`, ordered `orthography` rules, `periphrases` and `clause`. Stages return `Fork<T>` = list of outcomes with variant tags and steps; an empty fork is a defective cell. The existing French and Dutch resolvers plug in as `engine` unchanged until they are migrated.

Core owns:

- `synthesize(pack, lexeme, cell)`: stem → ending → orthography, cross-product of forks, memoised per (lexeme, cell).
- The periphrasis executor: compound tenses are flat chains of `{verb: main | perfectAuxiliary | {lemma}, form, agree?}` and literal words. Auxiliaries are conjugated through the same pack, so their steps come for free.
- Dedup on a signature that excludes steps; a form is born `orthography: 'both'` unless a spelling-sensitive rule fired (replaces today's outer spelling loop).
- Sandhi (elision) stays a render-time function over parts, because the app recombines parts and re-renders.

**Derivation (`core/derivation.ts`).** `DerivationStep { rule, stage, kind: rule | lexical | assumption | unavailable, before, after, params }`. Rules are declared as metadata with `defineRules({...})` (id, stage, kind, param kinds); stage functions build steps with `step(rule, before, after, params)`, and spelling rules are `JunctureRule`s whose steps the runner records. Rule ids form a union type from each pack's `rules` object. Steps attach to parts (word level), forms (periphrasis, clause, agreement) and `analysis` (classification, assumptions). Unavailable targets carry a step too. `ruleIds` stays as a derived, deprecated field.

**Citations (`sources.ts`).** `satisfies Record<RuleId, Citation | Citation[]>` — a rule without a citation is a type error.

**i18n.** One file per (locale, language): `i18n/locales/en/fr.ts` etc., flat ICU strings, `satisfies Record<RuleId | TermKey, string>` so a missing translation fails typecheck. Built-in formatter for the subset used (`{arg}`, `plural`, `select`, nesting, escaping). Tense and person names are term references resolved before formatting. `tests/i18n.test.ts` checks placeholders against rule params, identical key sets across locales, and that every step emitted across corpus and snapshot runs formats in both locales.

**Public API.** `conjugate`, `explain(form | unavailableTarget | analysis, locale)`, `equivalentTenses(from, to, tense)`, `getCatalogue`, `getSubjects`, `languages`, `renderParts`, `normalizeForComparison`, options builder, `createEngine({ packs, locales })`. Subpath exports: `./core`, `./languages/<lang>`, `./locales/<locale>`, `./equivalence`. New part and feature fields are optional, so the six consuming app files need no change (`apps/verbodrome/src/trainer/{forms,prompt,distractors,question}.ts`, `src/config/{tenses,verbs}.ts`).

## Trainer: accept feminine answers

The one functional app change in this work. Today `apps/verbodrome/src/trainer/forms.ts` queries `gender: 'masculine'`, so a typed `je suis allée` is marked wrong.

- `verbForms()` queries without a gender filter. Card text and the displayed correct answer stay masculine, as in a classic table.
- `FrForm.accepted` additionally holds the feminine variants for slots where the Dutch prompt does not fix gender: 1s, 2s, 1p, 2p, and 3p (`zij` is gender-neutral, so `elles sont allées` is accepted). For 3s the prompt says `hij`, so only `il` forms are accepted.
- `accepted` already feeds both the typed-answer check (`trainer/typed.ts:46`) and the wrong-answer filter (`trainer/distractors.ts:126`), so feminine forms are accepted when typed and never shown as a wrong card.
- Verbs with avoir are unaffected: `j'ai mangée` stays wrong.
- Tests in `apps/verbodrome/tests/typed.test.ts`: `je suis allée`, `nous sommes allées`, `je me suis méfiée`, `elles sont allées` accepted; `il est allée` and `j'ai mangée` rejected.

## Tense equivalence

- About 40 named concepts (`PRESENT`, `PAST_PERFECTIVE`, `PAST_IMPERFECTIVE`, `PRESENT_PERFECT`, `PLUPERFECT`, `COND_PRESENT`, `SUBJ_PRESENT`, `IMP_NEGATIVE`, `GERUND`, `SUPINE`, …), each defined by finiteness, mood, time, relative time, aspect.
- `equivalence/<lang>.ts`: a total map from every catalogue tense to weighted concept links with optional note and register; a missing tense is a type error.
- `equivalentTenses` ranks by shared-concept weight, then register, then catalogue order. With no shared concept it relaxes register → remoteness → aspect → mood and flags the result `approximate`. Finiteness and time are never relaxed.
- `PairOverride { from, to, tense, mode: replace | prepend | exclude }` for pairs that do not line up.
- Notes are message keys in the same catalogs.
- Tests: the full matrix as a checked-in snapshot (`tests/equivalence/matrix.tsv`), identity, no empty result without a note, and fr → nl reproducing the mapping tables in `apps/verbodrome/src/trainer/prompt.ts`.

## No-regression net for French and Dutch

First commit, generated by the untouched engine:

- `tests/characterization/{fr,nl}.verbs.txt`: corpus verbs, every lemma named in `fr/models.ts`, `fr/lexicon.ts`, `nl/exceptions.ts`, the app's 90 verbs with their hints, the derivatives `927302b` fixed, and invented probes at every selector boundary. Extra configurations: reflexive, traditional orthography, hinted queries, `u` / `het` / inversion, error cases.
- `tests/characterization/{fr,nl}.tsv`: per form the target, text, part roles, variant metadata, `preferred`, order; per verb the analysis and unavailable targets. Steps and labels excluded.
- `tests/characterization/intended-diffs.json`: `{ query, target, was, now, reason, source }`. The test applies the ledger and requires exact equality; unused entries fail; the count is pinned.

Known intended diffs to expect: today's mute-e rule is an ending whitelist, so invented `bleder` gives `je blede`; the rule-first engine will give `je blède`. Each such case gets a ledger entry.

## French rebuild

- **Sources (my call):** French rules are re-sourced away from Le Conjugueur, which is the same site as the scraped oracle. Primary: Grevisse & Goosse, *Le Bon Usage* (print, cited by §) and the 1990 *Rectifications de l'orthographe* (Journal officiel); lexical authority: the Dictionnaire de l'Académie française, 9th edition, whose entries carry conjugation tables, with CNRTL/TLFi as cross-check; Banque de dépannage linguistique (OQLF) for rule pages that can be linked. URLs are verified when the pack is built. Existing Le Conjugueur links stay only as secondary references.
- Principal parts extracted from the 113 tables are a starting point, not evidence: each family is checked against the Académie table before it is kept, and intended-diff ledger entries cite the independent authority.
- **Productive classes:** the 19 productive models become three ending sets plus orthography rules (`c-cedilla`, `g-e`, `mute-e-grave`, `closed-e-grave`, `eler-eter`, `y-to-i`, `1990-circumflex-iu`, `diaeresis-ir`, `t-after-dental`).
- **Families:** `lexicon.ts` keeps today's selection mechanics (listed lemma first, longest suffix, `except`, `exceptEndings`); each family stores principal parts relative to the stripped infinitive instead of an ending table.
- **Formation rules (`stems.ts`):** present-singular stem → present 1–3sg, imperative 2sg; nous stem → present 1–2pl, imparfait, present participle, subjunctive 1–2pl, imperative 1–2pl; ils stem → present 3pl, subjunctive sg + 3pl; future stem → futur, conditionnel; past stem + theme vowel → passé simple, subjonctif imparfait; past participle → agreement forms and compounds; optional subjunctive stem.
- **Measured:** about 80% of the non-productive paradigms reduce to principal parts alone; true cell overrides concentrate in about ten verbs (être, avoir, aller, faire, pouvoir, savoir, vouloir, valoir, dire, seoir).
- Multi-pattern models (payer, asseoir, ouïr, choir, faillir) become several principal-part sets with `pattern` and `usage`. Model flags move onto the family entry. `analysis.classification`, `model`, `classHint` and `stems` hints keep their meaning; hints now pass through orthography.
- **Bootstrap:** a one-off dev script extracts principal parts and residual cells from the 113 validated tables; the result is hand-reviewed. Nothing is retyped.
- Built in shadow mode against the snapshot with a shrinking pending list, then switched over and `models.ts`, `table.ts`, `principal.ts` deleted.

## Dutch migration

`exceptions.ts` → `lexicon.ts` (data unchanged); `nativeStem` splits into recorded rules (drop -en, undouble consonant, lengthen vowel, devoice v/z); 't kofschip, `ge-` prefix and strong past plural become cited rules; compound tenses become six periphrasis chains; subject, reflexive, inversion and particle placement move to `clause.ts`; `pronoun` becomes subject slots. Dutch goes first because it is already rule-shaped.

## Corpus tooling

```
scripts/corpus/
  model.ts
  parsers/<lang>.ts         one parser per language (en and it share a helper)
  languages/<lang>.ts       directory, encoding, expected files, section map, unmodelled reasons
  corrections/<lang>.ts
  import.ts  report.ts
tests/fixtures/<lang>.json  corrections.json  manifest.json  remaps.json
tests/goldens/<lang>/*.json
```

- Source: the pinned VerbodromeX revision `3a9a01de…`; all seven directories are tracked there (139 de / 145 en / 89 es / 222 fr / 20 it / 18 la / 207 nl files). Fixtures stay neutral, as decided in commit `5e7d30d`: no source file names, encodings, file checksums or site names in fixtures or manifest; the pin is the revision check, the clean-checkout check and the per-language file counts.
- Mislabelled source headings (Reverso Konjunktiv "Präteritum", verbix subjunctive "Present") are template-level remaps with a reason and URL, counted and pinned.
- Real source bugs (`shaked`, `flys`, `diging`, `ho stato`, `ihr bewegte`) are per-cell corrections with reason and authority URL, as today.
- Corpus cells the engine does not model stay in the fixture as `scope: 'unmodelled'`, counted and pinned.
- New guards: every catalogue entry must be covered by corpus cells or goldens; extra generated forms must carry a variant tag.
- Italian (20 verbs) and Latin (18) get two extra tiers (decided with the user):
  - **Authority cells** (`tests/goldens/<lang>/authority/`): exact expectations only for what the grammar actually prints — model paradigms, irregular forms, principal parts — each file citing its section. Never engine-generated; worth a human spot-check.
  - **Second oracle** (`scripts/corpus/sources/wiktionary.ts`, fixtures alongside the others): full tables for about 50–60 further verbs per language imported from Wiktionary at pinned page revisions. It is another engine's output, so it is treated exactly like the scraped data: every cell must pass, deviations go through the corrections ledger with an authority URL. Wiktionary text is CC BY-SA; the fixtures record page title and revision id for attribution.

## Per-language design

Every lexicon entry is verified against the language's lexical authority, never copied from the scraped corpus. Full rule inventories, test-verb tables and correction lists from the design passes go into `docs/grammar/<lang>.md` as each pack is built.

### German (de)

- **Sources:** grammis (Leibniz-Institut für Deutsche Sprache) for inflection, e.g. `grammis.ids-mannheim.de/progr@mm/4071–4076, 4119, 4047` and `systematische-grammatik/439, 1283, 232, 1219, 290`; Rat für deutsche Rechtschreibung, Amtliches Regelwerk 2024 (§19, §25, §26, §34) for spelling; Duden online and DWDS per lemma for principal parts. Print-only claims (complete strong-verb list, obligatory imperative `-e`, `zu` placement) cite the Duden-Grammatik by chapter.
- **Catalogue:** Indikativ Präsens, Präteritum, Perfekt, Plusquamperfekt, Futur I, Futur II; Konjunktiv I (present, perfect, future, future_perfect) and Konjunktiv II (past, pluperfect) under `subjunctive`; würde-forms under `conditional`; Imperativ du / wir / ihr / Sie; Infinitiv Präsens / Perfekt; Partizip I / II. `Sie` is a subject slot. Out: passive, Ersatzinfinitiv, subordinate word order, reflexives (later, like Dutch).
- **Classes:** weak (default), strong, mixed, preterite-present modals, irregular (sein, haben, werden, tun); infinitive shapes `-en`, `-eln`, `-ern`; stem-final dental, obstruent + nasal, sibilant; stress (`-ieren` and a short list block `ge-`); simplex / inseparable / separable / dual prefix.
- **Rules (about 35):** stem from infinitive; secondary present stem for strong 2sg/3sg (lexical); weak preterite `-te`; Konjunktiv II by umlaut of the strong preterite; `e`-insertion after dental and obstruent + nasal; 2sg `-t` after sibilants; `-eln`/`-ern` endings; `ie`+`e` contraction; Partizip II with `ge-` blocking and infixing; imperative from the e/i stem; `wir` / `Sie` imperatives from Konjunktiv I; verb-second and clause-final particle.
- **Lexicon:** about 185–200 roots holding infinitive, secondary present stem, preterite, participle, auxiliary, and Konjunktiv II only when not derivable. Dual-class verbs (bewegen, erschrecken, hängen, schaffen, schleifen, wiegen, wachsen, senden, wenden) carry two labelled paradigms. Side lists: simplex verbs that look prefixed, verbs that must not inherit (beantragen, veranlassen, handhaben…), dual-prefix lemmas, non-initial stress, weak verbs taking sein.
- **Invented verbs:** weak, haben, initial stress by default, each recorded as an assumption. Prefixed derivatives inherit only when the prefixes are from the closed lists, the root is in the lexicon, and the lemma is not on the no-inherit list. Tests: schlinken, fralten, blagnen, plaxen, trissen, wumpeln, flompieren, verschlinken, aufschlinken, umschlinken, plus inheritance (verschlafen, herumfahren) and real regulars absent from the corpus (machen, arbeiten, atmen, reisen, sammeln, studieren, anerkennen).
- **Corpus (Reverso, 139 files, 19 rows by position):** rows are grouped by repeated pronoun label because the `font-style:ormal` marker is unreliable; variant pages are assigned by content. Remaps: Konjunktiv I "Präteritum" → `subjunctive.perfect`, Konjunktiv II "Präteritum" → `subjunctive.pluperfect`, Konjunktiv II "Futur I / II" → `conditional.present / past`. About 12 correction rules covering roughly 500 cells: pre-1996 `ß` spellings (muß, ißt, gewußt), `ihr bewegte`, `sie beginne`, `sein wir` / `sein Sie`, modal imperatives, personal forms of geschehen and gelingen, wrong auxiliary for erschrecken / schleifen / wachsen, `schriee`.

### English (en)

- **Sources:** Huddleston & Pullum, *The Cambridge Grammar of the English Language* (ch. 3, 18) and Quirk et al. (ch. 3) as print authorities; Cambridge "English Grammar Today" pages for the spelling rules; Oxford Learner's Dictionaries (British) and Merriam-Webster (American) per lemma. Caveat: these four sites refused automated fetching during planning, so their URLs must be opened by hand before they are cited.
- **Catalogue:** indicative present, past, perfect, pluperfect, future, future_perfect and their six progressive counterparts; conditional present / past and progressives; subjunctive present (plain form), past (irrealis *were*), perfect, pluperfect; imperative 2sg / 1pl (*let's*) / 2pl; to-infinitive; `-ing` form and past participle. Out: negation, questions and do-support, contractions, *shall*, passive, modal lemmas.
- **Rules (about 12):** `-s`, `-ed`, `-ing`; `-es` after sibilants and consonant + `o`; consonant + `y` → `ies` / `ied`; silent-`e` drop; `-ie` → `-ying`; `-c` → `-ck`; consonant doubling (single final consonant other than w/x/y after a single vowel letter in a stressed final syllable, `qu` counting as a consonant); British vs American final `l`, both emitted with region labels.
- **Lexicon:** about 200 entries holding past and past participle only; homographs as two paradigms (lie, hang, shine); region and usage labels (gotten, dove, pled, burnt). Prefixed verbs inherit through a closed prefix list with a no-inherit list (behave, relay, welcome).
- **Invented verbs:** regular by default; a polysyllable ending in vowel + consonant is assumed not to have final stress unless it parses as prefix + monosyllable; hint `stress: 'final'`. Tests: glorp, blit, frobe, glish, bliz, plory, floy, snie, zamic, squip, trimbit, reblit, outswim, frandel, and real regulars, since the corpus has none (walk, stop, hope/hop, try, panic, travel, prefer, visit, quiz, veto).
- **Corpus (verbix, 145 files, 23 blocks by position):** remap the second subjunctive "Present" → `subjunctive.perfect`, "Imperfect" → `subjunctive.past`, "Gerund" → `participle.present`; `(U)` / `(E)` become region labels. About 12 correction rules covering roughly 350–400 cells: `diging`, `flys`, `teachs`, `shaked`, `striked`, `shutted`, `casted`, `spitted`, `slidden`, `bended`, past `sung` / `span`.

### Dutch (nl) alignment with German

Shared in code: the derivative resolver (particles + bound prefix + lexicon root), separable-particle placement, the `ge-` circumfix skeleton, alternate and dual-paradigm lexeme types. Kept separate because they only look alike: weak dental selection, final devoicing, open/closed-syllable respelling, `ge-` blocking by stress, the principal parts each language needs.

### Spanish (es)

- **Sources:** RAE/ASALE *Nueva gramática de la lengua española*, ch. 4 "La flexión verbal" (§4.9 vowel-final roots, §4.10 vowel alternation, §4.11 consonant alternation, §4.12 strong preterites and participles, §4.13 haber/ser/ir/estar/dar, §4.14 defectives, §4.15 models, §4.16 irregular-verb index); *Ortografía* 2010 for spelling and accents; DLE and DPD per verb. Caveat: `rae.es` and `dle.rae.es` refuse automated fetching.
- **Catalogue:** indicative present, perfect, imperfect, pluperfect, simple_past, past_anterior, future, future_perfect; conditional present / past; subjunctive present, past, imperfect and pluperfect (one tense each, variants `ra` / `se`), future and future_perfect (tagged dated); imperative tú / usted / nosotros / vosotros / ustedes and `imperative.negative`; infinitive, gerund (simple and compound), participle. `usted` / `ustedes` are subject slots. Out: voseo (hook left), passive, `estar` + gerund.
- **Rules (about 45):** root from infinitive; stressed-root diphthongs e→ie, o→ue (lexical flag); `-ir` raising e→i, o→u; `zc` before a/o; `y` insertion in `-uir`; subjunctive stem from 1sg present; imperfect and future subjunctive from 3pl preterite; strong preterite stems with their own ending set; contracted future stems. Orthography: c/qu, g/gu, z/c, g/j, gu/gü, unstressed i → y between vowels, i absorbed after ñ / ll. **Written accents are computed** from stress position and syllabification, never stored (`dio`, `guie`, `actúo`, `levántate` fall out of the rules). Clause: proclitic / enclitic pronouns, `levantaos` (drop d), `levantémonos` (drop s), negative imperative.
- **Lexicon:** about 50 irregular bases; a diphthong / raising lemma list (about 150 to start, from NGLE §4.16); hiatus lists for `-iar` and root-internal hiatus (about 120). Strong irregularity inherits through a closed prefix list onto bases of five letters or more (componer ← poner); short bases use explicit lists (prever, deshacer); **vowel alternation never inherits by prefix** (pretender is not tender).
- **Invented verbs:** regular, no diphthongisation, `-iar` as diphthong, vowel + `-cer` → `zc`; each an assumption. Tests: blorpar, fluzar (flucé), trobacar (trobaqué), drolgar, rimiguar (rimigüé), plontuar (plontúo), troger (trojo), blorecer (blorezco), treer (treyó), fluñir (fluñó), plostuir (plostuyo), bladucir (bladuje), blorparse (blórpate, blorpémonos), and hinted plentar / flentir / tredir.
- **Corpus (elconjugador, 89 files, 64 cells):** read whole-cell text and split `/` alternates inside the bold segment only (`p<b>udrí/odrí</b>` → pudrí, podrí). Remaps: "Past perfect" → `past_anterior`, "Past future" → `future_perfect`, subjunctive "Past" → `subjunctive.past`, "Imperfect (2)" → variant `se`, "Gerundive" → `gerund`. About 60–70 corrected cells: abolir (now fully conjugated per RAE), `adquiste`, missing accents in ahincar, superseded accents `guió` / `rió`, podrir, `electo` as participle.

### Italian (it)

- **Sources:** Treccani (*Enciclopedia dell'Italiano*, *La grammatica italiana*: coniugazione verbale, indicativo passato remoto, imperativo, verbi incoativi, avere o essere); Serianni, *Grammatica italiana*, ch. XI as print authority; Treccani *Vocabolario* per verb; DOP for accents.
- **Catalogue:** indicativo presente, passato prossimo, imperfetto, trapassato prossimo, passato remoto, trapassato remoto, futuro semplice / anteriore; congiuntivo ×4; condizionale ×2; imperativo tu / Lei / noi / voi / Loro and `imperative.negative`; infinito, participio, gerundio. Out: the corpus's `avente` + participle (not an Italian form), passive, `stare` + gerund.
- **Rules (about 35):** `-isc-` in root-stressed cells; long stem for contracted infinitives (fare → fac-, dire → dic-, bere → bev-, `-durre` → `-duc-`); congiuntivo from 1sg present; future `-ar-` → `-er-` and lexical syncope (andrò, vedrò, berrò); strong passato remoto in 1sg / 3sg / 3pl only, other persons weak; `-care` / `-gare` add h; `-ciare` / `-giare` drop i; `-iare`, `-gliare`, `-gnare`; final accent; monosyllabic imperatives (va', da', fa', sta', di'); auxiliary essere / avere with subject agreement; enclitics and clitic doubling (dammi).
- **Lexicon:** about 170 irregular bases; non-`isc` list (about 55), essere list (about 120), dual-auxiliary list (about 40), stressed-i `-iare` list (about 25). Family inheritance by distinctive suffix (`-porre`, `-durre`, `-trarre`, `-mettere`, `-prendere`…) with a closed prefix list; short bases by explicit list (rifare, predire; not restare, mandare).
- **Invented verbs:** regular, `-ire` → `-isc-`, avere, unstressed i in `-iare`. Tests: blorpare, flugare (flughi), tricare, sbonciare (sboncerò), trebiare, frogliare, strognare, blendere, tronire (tronisco), sbradurre (sbradussi, sbradotto), blorparsi.
- **Corpus (verbix, 20 files):** remap congiuntivo "Passato prossimo" → `subjunctive.past`, "Trapassato prossimo" → `subjunctive.pluperfect`. About 90 corrected cells of 1,920: essere built with avere (45), `avente` slots dropped, `tradunente`, imperative `sapete` → `sappiate`, imperatives of potere / dovere unavailable, `vò`, `dànno`, `venente`.
- **Extra tests:** authority cells from Treccani (irregular forms as printed, model paradigms from Serianni) plus Wiktionary tables for about 50 further verbs (parlare, cercare, pagare, cominciare, studiare, inviare, leggere, scrivere, prendere, mettere, porre, condurre, piacere, conoscere, finire, capire, dormire, lavarsi…).

### Latin (la)

- **Sources:** Allen & Greenough, *New Latin Grammar* (Dickinson College Commentaries, `dcc.dickinson.edu/grammar/latin`: §§163–178 endings and stems, §§181–183 peculiarities, §§190–192 deponents, §§197–204 irregular verbs, §211 principal parts); Bennett, *New Latin Grammar* as the text source for paradigms, because A&G's paradigm tables are images; Lewis & Short for principal parts.
- **Catalogue:** indicative ×6 and subjunctive ×4, each in active and passive voice; imperative present and future; infinitive present / perfect / future; participles present, perfect, future; gerundive; gerund; supine. Default output is the citation form; full declension through a `case` filter. Alternates `-ēre` for `-ērunt` and `-re` for `-ris` as literary variants. Out for now: contracted perfects (amāsse), periphrastic conjugations as tenses.
- **Rules (about 40):** three stems from four principal parts and which tenses each feeds; theme-vowel contraction and weakening per conjugation; `-iō` verbs; vowel shortening before final -m / -t / -nt / -r, before nt / nd, and before another vowel; future in `-bō` (1st, 2nd) vs `-am` (3rd, 4th); personal endings active and passive; perfect system; imperatives incl. dīc, dūc, fac, fer; deponent mapping (passive morphology, active sense, some active forms kept); semi-deponents; perfect passive = participle + esse with gender agreement; future infinitives.
- **Lexicon:** regular 1st, 2nd and 4th conjugation verbs need no entry. About 60 irregular, defective and impersonal entries; about 250 principal-part entries for core-vocabulary verbs; about 40 compound families stored once on the base (`-cipiō, -cipere, -cēpī, -ceptum`).
- **Identifying a verb:** four principal parts, or 1sg + infinitive, or infinitive alone. Output carries macrons; lookup and answer comparison use a macron-insensitive key. Macron-less `-ere` is assumed 3rd conjugation unless the 1sg shows otherwise; the engine never invents vowel length. Each inference is an assumption.
- **Invented verbs:** default perfects `-āvī` / `-ātum` (1st), `-uī` / `-itum` (2nd), `-īvī` / `-ītum` (4th); 3rd conjugation gets a sigmatic default, clearly marked as assumed. Tests: blorpāre, flūdēre, tregere, blapiō / blapere, plundīre, deponent blorpārī, trapī, mundīrī.
- **Corpus (cactus2000, 18 files):** compared at two levels: macron-insensitive (must pass with form corrections only) and macron-sensitive (with a ledger of macron fixes). About 250 corrected cells of 3,300: `sēcūtus` → `secūtus`, `largitus` → `largītus`, deponent future imperatives, `amāntor`, perfect-subjunctive vowel length, invented `potendī` / `mālēns` / `fiēns`, `īre` passive.
- **Extra tests:** authority cells from A&G and Bennett (model and irregular paradigms, principal parts from §211) plus Wiktionary tables for about 60 further verbs (laudō, dō, stō, habeō, videō, regō, dūcō, mittō, faciō, fugiō, veniō, cōnor, loquor, ūtor, prōsum, edō, coepī, meminī…).

### Shared helpers

- **Romance (fr, es, it):** the sound-preserving consonant alternation engine (one mechanism, a grapheme table per language), the stem-source table ("which principal part feeds which cells"), the root-stressed cell set, the family resolver (longest suffix, closed prefixes, exception lists), the clitic placement framework, the BE / HAVE auxiliary policy with participle agreement.
- **Germanic (de, nl, en):** see Dutch alignment above.
- Kept separate because they only look alike: Spanish diphthongs vs French é/è, `-isc-` vs `-iss-`, strong preterites, written accents, imperatives and pronoun dropping.
- Latin shares the pack contract, the recipe executor, the stem-source table and the family resolver; everything else is Latin-only.

### Verification of lexicon entries

RAE, DLE, Cambridge, Oxford Learner's, Merriam-Webster, Perseus and Logeion refuse automated fetching. Entries that rest on them are verified by opening the page in the browser (Chrome tools) during implementation; anything verified only against a secondary source is flagged as such in `sources.ts`. Facts that the design passes recalled from memory are re-checked before they enter a lexicon.

## Behaviour decisions

| Question | Decision |
|---|---|
| Unknown verb that starts with a known separable particle (de `aufschlinken`, nl `opzorpen`) | Decided with the user: split it, record the assumption, accept a hint. Dutch refuses to infer this today, so Dutch behaviour changes; each changed result is an intended-diff ledger entry. |
| Lemma that is genuinely both separable and inseparable (de `umziehen`, nl `voorkomen`) | Decided with the user: return both paradigms, labelled. Dutch throws `AMBIGUOUS_CLASSIFICATION` today; same ledger treatment. The trainer passes explicit prefix hints for its Dutch verbs, so it is unaffected. |
| Pre-1996 German spellings in the corpus (`muß`, `ißt`, `gewußt`) | My call: the engine emits current spelling only; one ledger rule drops the old forms. |

## Commit sequence (one branch, one PR)

Branch `feat/seven-language-engine` from `main`. Step 0: save this design as `docs/superpowers/specs/2026-11-24-seven-language-engine-design.md`; detailed task plans are written per commit group before it is built.

| # | Commit | Green at this point |
|---|---|---|
| 1 | Characterization snapshots for fr and nl | everything + snapshot |
| 2 | Registry types, generic options/builder, pack dispatch, render behind the pack, generic CLI; old engines wrapped as packs | typecheck, all tests, snapshot unchanged, app compiles |
| 3 | Core: derivation, rule runner, forks, periphrasis executor, clause contract, i18n formatter, `explain`; exercised by a test-only toy pack with a passive dimension, a separable particle and an agreeing participle | core unit tests |
| 4 | Corpus tooling split per source and language, manifest v2 | fr/nl fixtures byte-identical |
| 5 | Dutch on the spine, with en + nl messages and citations | nl snapshot exact, corpus, i18n completeness |
| 6 | French in shadow mode (productive → families → suppletives), then switch and delete tables | fr snapshot exact modulo ledger, corpus, app tests |
| 7 | Equivalence: concepts, fr/nl maps, matrix snapshot | matrix snapshot, fr → nl acceptance |
| 8–12 | de, en, es, it, la — each: pack, locales, citations, equivalence map, parser, corrections, fixtures, goldens, invented-verb tests | per-language corpus, goldens, coverage |
| 13 | Trainer accepts feminine answers; subpath exports; docs (`docs/architecture.md` replacing `PLAN.md`, `docs/grammar/<lang>.md`, `api.md`), README | full workspace build and test |

Order of the new languages: German first (it reuses the Germanic helpers proven on Dutch and stresses word order and separable verbs), then Spanish, Italian, Latin, English. After commit 5 the language packs are independent of each other and can be built in parallel worktrees and merged in this order; shared touch points are one-liners (`registry.ts`, pack and locale indexes, `package.json` exports) or regenerated files (`manifest.json`, `matrix.tsv`).

## Scale

This is a large body of work: seven packs, about 250 rules with text in two locales, and lexicons of roughly 200 (de), 200 (en), 50 + 270 list entries (es), 170 + 240 list entries (it), 60 + 250 (la) verified entries, plus the French and Dutch migrations. The commit order is the review order.

## Verification

- `npm run typecheck && npm test` at the workspace root after every commit.
- `npm run corpus:check -w conjugation-engine`: every corpus cell for all seven languages passes with pinned counts.
- Characterization test: fr and nl output identical to the pre-refactor snapshot, apart from ledger entries.
- `tests/novel.test.ts` extended: invented verbs per language with independently written expectations.
- `tests/i18n.test.ts`: every rule id has en + nl text; every emitted step formats.
- CLI spot checks, e.g. `npm run cli -w conjugation-engine -- de schlinken --explain --locale nl`.
- `npm run build && npm test -w verbodrome`: the trainer still builds and its tests pass.
