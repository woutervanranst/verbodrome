# English (en) grammar design for the staged engine

Scope: the approved design's "English (en)" section (`docs/superpowers/specs/2026-11-24-seven-language-engine-design.md`), written against the core contract as it stands after Plan 2 Part A (`docs/superpowers/plans/2026-11-24-seven-language-engine-02-core-completion-and-dutch.md`; Task 1, subject slots, is already on the branch as `6dcad74`). Implementation plan: `docs/superpowers/plans/2026-11-24-seven-language-engine-09-en.md`.

Status marks: **[V]** the page was read (by me, or by a fetch agent I dispatched with a fixed URL list; the forms quoted are the agent's verbatim transcription), **[S]** confirmed only from a search-result snippet, **[U]** stated from memory or from a print work not opened; must be checked before it enters code.

## Deviations from the approved design

| # | Approved design says | This design does | Why |
|---|---|---|---|
| D1 | Lexical authorities Oxford Learner's (GB) and Merriam-Webster (US) | **LDOCE online** (Longman, British, prints `British English` / `American English` labels) and **American Heritage Dictionary 5th ed. online** are the primary lexical authorities; OALD and M-W stay as hand-check URLs | OALD, M-W, Collins and Britannica all returned HTTP 403 again on 2026-11-24; LDOCE and AHD load, and both print inflected forms and labels. 118 lemma pages were read through them for this design. |
| D2 | Cambridge "English Grammar Today" for spelling | **DfE, National Curriculum in England, English Appendix 1: Spelling** (statutory, 2013) and the **University of Twente English Style Guide** (adapted from the European Commission DGT guide) for the spelling rules; Cambridge EGT kept as a hand-check URL | EGT 403; the DfE PDF and the UT page load and state the rules (pages below). |
| D3 | Oracle has "23 blocks by position" | **22 `<p>` blocks**: 1 nominal block with 3 cells + 21 person blocks; **126 cells per file** | Counted in all 145 files: every file has the identical 22-block structure (section 9). |
| D4 | "About 12 correction rules covering roughly 350–400 cells", including past `sung` | **14 correction rules, 480 cells**. Past `sung` is **not** an error (AHD: "sang or sung") and becomes a `US` variant. Added: `born` in active perfects (bear), wrong region tags on `rid` and `strive`. | Every cell diffed against a reference generator built from the verified lexicon (section 9.5). |
| D5 | Hint `stress: 'final'` | Hint `stress: 'final' \| 'nonFinal'`, plus `classHint: 'regular' \| 'irregular'`, `stems: { past, pastParticiple }` for invented irregulars, and a **`region: 'GB' \| 'US'`** option (filter + preference) | Two-way stress override is needed to correct a wrong default in both directions; `region` lets the trainer prefer one standard. Pack-local, one schema field each. |
| D6 | Homographs lie, hang, shine | Same three. `bid` is **one** paradigm with literary alternates (`bade`, `bidden`), not a homograph. spit/wind/weave second verbs left out (open question Q3). | LDOCE prints bid³ as "literary"; AHD prints one entry "bade or bid, bidden or bid". |
| D7 | — | No availability rules: no English verb in scope is defective; modal verbs (`must`, `ought`, `shall`, `should`, `would`, `could`, `might`, `may`) are rejected at classification with `INVALID_INFINITIVE`. | `beware` was considered; LDOCE's label "[intransitive, transitive only in imperative and infinitive]" does not support a clean defective paradigm. |
| D8 | — | Progressive tense ids keep `*_progressive`; their native labels say **continuous** ("Present continuous") | Dutch- and Flemish-school English uses "continuous"; CGEL uses "progressive" (kept in ids and explanations' citations). |
| D9 | `(U)` / `(E)` become region labels | They are kept as ` (US)` / ` (GB)` suffixes on the expected texts of the **172 tagged cells** only, and the English corpus module's `applicable` compares those cells against `text + ' (' + region + ')'`; untagged cells compare plain text | The shared corpus model has one `variant` per cell, but these cells carry a different region per alternate (`got; gotten (U)`, `ridded (E); rid (U)`). Pack-local, no model change. |

## 1. Sources

| Role | Title | URL | Status |
|---|---|---|---|
| Print grammar (primary) | R. Huddleston & G. K. Pullum, *The Cambridge Grammar of the English Language* (CUP 2002), ch. 3 "The verb" (Huddleston), ch. 18 "Inflectional morphology and related matters" | https://doi.org/10.1017/9781316423530 | [U] print; section numbers below are to be confirmed in the book; cambridge.org contents/sample pages 403 |
| Print grammar | R. Quirk, S. Greenbaum, G. Leech, J. Svartvik, *A Comprehensive Grammar of the English Language* (Longman 1985), ch. 3 "Verbs and the verb phrase" | — | [U] print |
| Official spelling | Department for Education, *The national curriculum in England: English Appendix 1: Spelling* (2013) | https://assets.publishing.service.gov.uk/media/5a7ccc06ed915d63cc65ce61/English_Appendix_1_-_Spelling.pdf | [V] p. 3 (Year 1 "Adding s and es"), p. 8 (Year 2: y→i, e-drop with "Exception: being", one-syllable doubling with "x is never doubled"), p. 11 (Years 3–4: doubling in a stressed last syllable — forgetting, beginning, preferred; not when unstressed — gardening, limited) |
| Style guide | University of Twente, *English Style Guide*, "Tricky spelling of common words" (adapted from the EC DGT guide) | https://www.utwente.nl/en/language-centre/translation-editing-services/english-styleguide/tricky/spelling/ | [V] "Follow the convention of doubling a final -l after a short vowel…"; exception parallel → paralleled; other consonants only if the last syllable is stressed; benefited, combated, focused, targeted vs formatted, handicapped, kidnapped, worshipped |
| Lexical, British (primary) | *Longman Dictionary of Contemporary English* online | `https://www.ldoceonline.com/dictionary/<lemma>` | [V] 60 irregular + 58 spelling-evidence lemmas (sections 5, 8) |
| Lexical, American (primary) | *The American Heritage Dictionary of the English Language*, 5th ed. online | `https://www.ahdictionary.com/word/search.html?q=<lemma>` | [V] same 118 lemmas |
| Hand-check, British | Oxford Learner's Dictionaries | `https://www.oxfordlearnersdictionaries.com/definition/english/<lemma>` | refused (403) — open by hand |
| Hand-check, American | Merriam-Webster | `https://www.merriam-webster.com/dictionary/<lemma>` | refused (403) — open by hand |
| Hand-check, spelling | Cambridge Dictionary, *English Grammar Today*, "Spelling" | https://dictionary.cambridge.org/grammar/british-grammar/spelling | refused (403) — open by hand |
| Hand-check, spelling | European Commission DGT, *English Style Guide* (Nov. 2023), spelling chapter | https://commission.europa.eu/system/files/2023-11/styleguide_english_dgt_en.pdf | refused (403) — open by hand |
| Snippet only | Britannica Dictionary "Ask the Editor: doubling the final consonant" ("At the end of a word, don't count w, x, or y as a consonant") | https://www.britannica.com/dictionary/eb/qa/Doubling-the-final-consonant-before-adding-ed-or-ing | [S] page 403 |

Rule areas and what they rest on:

| Area | Rests on |
|---|---|
| Verb paradigm (plain form, 3sg present, preterite, gerund-participle, past participle; irrealis *were*) | CGEL ch. 3 §1 [U]; Quirk §3.1–3.4 [U]; AHD *were* "Past subjunctive of be" [V] |
| Compound tenses, progressive, perfect, *will/would* futures and conditionals | CGEL ch. 3 (§4 perfect, §5 progressive) [U]; Quirk ch. 4 [U] |
| Mandative (present) subjunctive = plain form; irrealis *were* | CGEL ch. 3 §1.7 and ch. 11 [U]; AHD *were* [V] |
| *let's* imperative | LDOCE *let's* "the short form of 'let us', used especially to make suggestions" [V]; CGEL ch. 10 [U] |
| -s / -es, -ies, -ied, -ying, e-drop, doubling | DfE Appendix 1 pp. 3, 8, 11 [V]; CGEL ch. 18 §2 [U]; Quirk §3.5–3.6 [U] |
| -es after consonant + o; -ie → -ying; -c → -ck; keep e after e/o/y | LDOCE + AHD per lemma: veto, echo, die, tie, panic, picnic, agree, hoe, dye [V] |
| British vs American final l | UT style guide [V]; LDOCE `travelled British English, traveled American English` (travel, cancel, label, model, equal, fuel, dial) [V]; AHD same lemmas [V] |
| Principal parts and their labels | LDOCE + AHD per lemma (section 5) |

## 2. Catalogue

Moods and tenses (`EnglishTenses`); every finite entry has `allPersons` except the imperative.

| Mood (`moodLabel`) | Tense id | `tenseLabel` | Simple / periphrastic | Example (walk, 3sg he) |
|---|---|---|---|---|
| indicative (Indicative) | present | Present simple | simple | he walks |
| | past | Past simple | simple | he walked |
| | perfect | Present perfect | have (present) + past participle | he has walked |
| | pluperfect | Past perfect | have (past) + pp | he had walked |
| | future | Future simple | `will` + plain | he will walk |
| | future_perfect | Future perfect | `will` + have (plain) + pp | he will have walked |
| | present_progressive | Present continuous | be (present) + -ing | he is walking |
| | past_progressive | Past continuous | be (past) + -ing | he was walking |
| | perfect_progressive | Present perfect continuous | have (present) + been + -ing | he has been walking |
| | pluperfect_progressive | Past perfect continuous | have (past) + been + -ing | he had been walking |
| | future_progressive | Future continuous | `will` + be (plain) + -ing | he will be walking |
| | future_perfect_progressive | Future perfect continuous | `will` + have + been + -ing | he will have been walking |
| conditional (Conditional) | present | Conditional simple | `would` + plain | he would walk |
| | past | Conditional perfect | `would` + have + pp | he would have walked |
| | present_progressive | Conditional continuous | `would` + be + -ing | he would be walking |
| | past_progressive | Conditional perfect continuous | `would` + have + been + -ing | he would have been walking |
| subjunctive (Subjunctive) | present | Present | simple (plain form, all persons) | (that) he walk; (that) he be |
| | past | Past | simple (= past form; *were* for be, all persons) | (if) he walked; (if) he were |
| | perfect | Perfect | have (plain) + pp | (that) he have walked |
| | pluperfect | Pluperfect | have (past) + pp | (if) he had walked |
| imperative (Imperative) | present | Imperative | 2sg, 2pl: plain, no subject; 1pl: `let's` + plain | walk; let's walk |
| infinitive (Infinitive) | present | To-infinitive | `to` + plain | to walk |
| participle (Participle) | present | -ing form | simple | walking |
| | past | Past participle | simple | walked |

24 entries. Imperative persons: `[[2,'singular'],[1,'plural'],[2,'plural']]`. Non-finite moods: `infinitive`, `participle`. No voices (active only).

Internal non-finite cell forms (never catalogue targets on their own): `plain` (the bare verb in chains), `presentParticiple` (-ing), `pastParticiple`.

Subject slots (no `genderedTargets`; gender is informational, as for Dutch `zij`/`het`):

| id | person | number | pronoun | gender | default |
|---|---|---|---|---|---|
| 1sg | 1 | singular | I | — | yes |
| 2sg | 2 | singular | you | — | yes |
| 3sg.m | 3 | singular | he | masculine | yes |
| 3sg.f | 3 | singular | she | feminine | no |
| 3sg.n | 3 | singular | it | neuter | no |
| 1pl | 1 | plural | we | — | yes |
| 2pl | 2 | plural | you | — | yes |
| 3pl | 3 | plural | they | — | yes |

No register slots (English has no T/V distinction). The clause omits the pronoun in the imperative.

Option schema (`EnglishSpec`):

| Field | Kind | Values | Meaning |
|---|---|---|---|
| `auxiliary` | enum | `have` | Accepted for schema uniformity (Plan 2 Task 5 types the schema against the spec); every English verb already takes have, so it changes nothing |
| `classHint` | enum | `regular`, `irregular` | Selects the paradigms of that class (hang/lie/shine); `irregular` on an unlisted verb needs `stems`; a class the lemma does not have → `INVALID_HINT` |
| `stems` | stems | words `past`, `pastParticiple` | An invented irregular verb's principal parts; both required together; not allowed with `classHint: 'regular'` |
| `stress` | enum | `final`, `nonFinal` | Overrides the stress decision for consonant doubling and the British l |
| `region` | enum | `GB`, `US` | Keeps only forms without a region or of this region, and ranks this region first |

Left out, with reason: negation, questions and do-support, contractions (`I'll`), `shall` futures, passive voice, modal verbs as lemmas (all per the approved design); subjunctive progressives (`that he be walking`) and perfect infinitive / perfect participle (`to have walked`, `having walked`) — not in the approved catalogue and not in the oracle; phrasal and prepositional verbs (multiword input is rejected).

## 3. Classification

Order in `classify(query)`:

1. **Normalise.** The core already lowercases and NFC-normalises the infinitive. A leading `to ` is stripped (`to walk` → `walk`, no step: it is input normalisation, not grammar). Anything still containing a space, apostrophe or hyphen → `INVALID_INFINITIVE` ("Give one English verb without particles, e.g. walk."). A modal (`must ought shall should would could might may`) → `INVALID_INFINITIVE` ("<x> is a modal verb; modal verbs are not conjugated."). `can` and `will` are not rejected: they are also ordinary regular verbs (can = put in cans; will = bequeath), see risk R4.
2. **Lexicon.** A lemma in `irregulars` yields one outcome per paradigm (`hang`, `lie`, `shine` have two). Steps: `en.classify.homograph` (only for two-paradigm lemmas) then `en.classify.lexicon` (or `en.classify.suppletive` for `be`).
3. **Inheritance.** Otherwise, for each prefix in `inheritPrefixes` that the lemma starts with (longest first): if `lemma` is in `noInherit` → stop, regular, step `en.classify.no-inherit`; if the remainder is a lexicon lemma other than `be` / `have` and has ≥ 2 letters → inherit (step `en.classify.prefixed`); else, if the remainder itself starts with a prefix and its own remainder is a lexicon lemma (two prefixes at most: `misunderstand` = mis + under + stand), inherit the same way. A derivative inherits **only the first paradigm** of a homograph (`underlie` → underlay / underlain, never `underlied`; `overhang` → overhung; `outshine` → outshone) and **only standard-usage alternates** (`outbid` → outbid, never `outbade`); region alternates are inherited (`misspell` → misspelt GB / misspelled US). The derivative's forms are the base's forms with the prefix prepended; its -s / -ing follow the spelling rules on the whole lemma, with `finalStress` true (the base is the stressed part).
4. **Default.** Otherwise the verb is regular: assumption `en.classify.assume-regular`.
5. **Hints.** `classHint: 'regular'` keeps only regular paradigms (step `en.classify.hint-regular`, no assumption); `'irregular'` keeps only irregular ones. `stems: { past, pastParticiple }` on an unlisted verb builds an irregular paradigm from the hint (`classSource: 'explicitHint'`, step `en.classify.hint-irregular`); on a listed verb → `INVALID_HINT`.
6. **Spelling-relevant lexical flags** (steps only when the flag is set): `keepsE` (`en.classify.keeps-e`: be, singe), `plainS` (`en.classify.plain-s`: solo), `lNotDoubled` (`en.classify.l-not-doubled`: parallel), `doublesUnstressed` (`en.classify.doubles-unstressed`: format, handicap, kidnap, program, worship).
7. **Stress** — decided only when it matters, i.e. when the lemma ends in a single vowel letter + a doubling consonant (section 4.4 predicate `vc`) or in a British-l environment. Monosyllable → stressed, no step. Otherwise, first match wins: `stress` hint (`en.classify.stress-hint`); inherited derivative (stressed, no extra step: the `prefixed` step explains it); `finalStress` / `nonFinalStress` lists (`en.classify.stress-listed`); prefix + monosyllable parse (`en.classify.assume-final-stress`, assumption); else `en.classify.assume-nonfinal-stress` (assumption).

**Syllables from spelling.** Vowel letters `a e i o u`, and `y` when it follows a consonant letter; `u` after `q` is part of the consonant `qu`. A *vowel group* is a maximal run of vowel letters, except that a word-final `ial` or `uel` counts its two vowels as two groups (di·al, tri·al, fu·el, du·el; LDOCE/AHD dial, fuel [V]). A word is a monosyllable when it has exactly one vowel group. (Only applied to words ending in vowel + consonant, so silent final e never arises.)

**Prefix + monosyllable parse** (stress default). `stressPrefixes` = ab, ac, ad, be, com, con, de, dis, em, en, ex, for, fore, im, in, inter, mis, ob, out, over, per, pre, pro, re, sub, sur, trans, un, under, up, with. The lemma parses when, for some prefix P (longest first), the remainder R has ≥ 3 letters, one vowel group, and its initial consonant letters (before the first vowel; `qu` counts) are one of the legal onsets: b c d f g h j k l m n p qu r s t v w y z bl br ch cl cr dr dw fl fr gl gr kn ph pl pr sc sch scr sh shr sk sl sm sn sp spl spr squ st str sw th thr tr tw wh wr. Examples: re·blit, pre·fer, com·pel, ex·cel, con·trol ✓; pro·ffer ✗ (ff), re·ckon ✗ (ck), ex·it ✗ (vowel), de·velop ✗ (two groups).

Side lists (lexicon module):

| List | Members | Source |
|---|---|---|
| `inheritPrefixes` (11) | be, for, fore, mis, out, over, re, un, under, up, with | CGEL ch. 18 / Quirk App. I on prefixation [U]; members chosen so that no listed base gives a wrong verb in section 5's tables |
| `noInherit` | behave, belie, befit, refit, outfit, relay, welcome | behave ≠ be+have; belie, befit, refit, outfit, relay are regular (AHD/LDOCE to verify [U]); welcome is unreachable with this prefix list and kept as a guard (approved design) |
| never a base | be, have | suppletive |
| `finalStress` (real regular verbs the parse misses or that are too common to leave to an assumption) | abet, abhor, acquit, admit, appal, commit, compel, concur, confer, control, defer, deter, dispel, distil, emit, enrol, equip, excel, expel, extol, fulfil, impel, incur, infer, instil, occur, omit, patrol, permit, prefer, propel, rebel, recur, refer, regret, remit, repel, submit, transfer, transmit | LDOCE/AHD [V] for admit, compel, control, excel, occur, patrol, prefer, fulfil, enrol, instil; the others [U] (verify in Task 2) |
| `nonFinalStress` (the parse would wrongly say final) | combat, conquer, enter, interpret, profit; debit, prosper [U] | LDOCE/AHD [V] combated, conquered, entered, interpreted, profited |
| `doublesUnstressed` | format, handicap (always doubled); kidnap, program, worship (doubled, plus a single-consonant `US` variant) | UT guide [V]; LDOCE "kidnapped… also kidnaped American English", "worshipped… also worshiped American English" [V]; AHD "programmed… or programed" [V] |
| `keepsE` | be (being), singe (singeing) | DfE p. 8 "Exception: being" [V]; AHD/LDOCE singeing [V] |
| `plainS` | solo (solos) | AHD "soloed, soloing, solos" [V] |
| `lNotDoubled` | parallel (paralleled in both) | UT guide [V]; LDOCE "paralleled… also parallelled British English" (the GB variant is left out, Q5) [V] |
| `modals` (rejected) | must, ought, shall, should, would, could, might, may | approved design ("modal lemmas out") |

Classes (`analysis.classification`): `regular`, `irregular`, `suppletive` (`be`). `auxiliaries: ['have']` for every verb; `reflexive: false`; `particle: null`.

## 4. Rule inventory

Rule ids are `en.<stage>.<name>`; stage `stem` holds the whole-word lexical cells (`en.cell.*`), as the toy's `xx.lex.present` does. Messages are learner English (one sentence); the Dutch texts are the implementer's, using the Dutch school terms in the note under each table. Citation keys: `cgel`, `quirk`, `dfe`, `utwente`, `ldoce`, `ahd` (works in section 1).

### 4.1 classify

| id | kind | params | Statement (en) | Trigger | Citation | Example |
|---|---|---|---|---|---|---|
| en.classify.lexicon | lexical | past, participle | `{before}` is an irregular verb: past `{past}`, past participle `{participle}`. | lemma in `irregulars` | ldoce + ahd (lemma URL) | swim → swam, swum |
| en.classify.suppletive | lexical | — | `{before}` is completely irregular: its forms are listed one by one. | lemma `be` | cgel ch. 3 §1 [U]; ahd *be* | be |
| en.classify.homograph | lexical | meaning | This paradigm of `{before}` means "`{meaning}`". | lemma with two paradigms | ldoce (lemma); ahd | hang: "kill someone by hanging" |
| en.classify.prefixed | rule | prefix, base | `{before}` is `{prefix}-` + `{base}`, so it has the irregular forms of `{base}`. | section 3 step 3 | quirk App. I [U] + ldoce (base) | outswim = out + swim |
| en.classify.no-inherit | lexical | prefix, base | `{before}` looks like `{prefix}-` + `{base}` but is a regular verb. | lemma in `noInherit` | ahd (lemma) | behave |
| en.classify.assume-regular | assumption | — | Assuming `{before}` is regular (-ed): it is not in the list of irregular verbs. | no lexicon, no inheritance, no hint | cgel ch. 18 [U]; ldoce | glorp |
| en.classify.hint-regular | rule | — | You asked for the regular forms of `{before}`. | `classHint: 'regular'` | cgel ch. 3 [U] | hang → hanged |
| en.classify.hint-irregular | rule | past, participle | You gave the past `{past}` and the past participle `{participle}` of `{before}`. | `stems` hint | cgel ch. 3 [U] | glorp + glarp, glorpen |
| en.classify.stress-listed | lexical | stress | `{before}` is stressed on {stress, select, final {its last syllable} other {an earlier syllable}}. | lemma in `finalStress` / `nonFinalStress` | ldoce/ahd (lemma) | prefer; enter |
| en.classify.stress-hint | rule | stress | You said `{before}` is stressed on {stress, select, final {its last syllable} other {an earlier syllable}}. | `stress` hint | dfe p. 11 | trimbit + final |
| en.classify.assume-final-stress | assumption | prefix | Assuming the last syllable of `{before}` is stressed: it looks like the prefix `{prefix}-` plus a one-syllable root. | prefix + monosyllable parse | dfe p. 11; cgel ch. 18 [U] | reblit |
| en.classify.assume-nonfinal-stress | assumption | — | Assuming the last syllable of `{before}` is not stressed: spelling does not show stress. | polysyllable, no list, no parse | dfe p. 11 | trimbit, travel |
| en.classify.keeps-e | lexical | — | `{before}` keeps its final e before -ing. | `keepsE` | dfe p. 8 (being); ahd singe | singeing |
| en.classify.doubles-unstressed | lexical | — | `{before}` doubles its last consonant although its last syllable is not stressed. | `doublesUnstressed` | utwente; ldoce/ahd | kidnapped |
| en.classify.l-not-doubled | lexical | — | `{before}` never doubles its final l. | `lNotDoubled` | utwente | paralleled |
| en.classify.plain-s | lexical | — | `{before}` takes only -s in the 3rd person singular. | `plainS` | ahd solo | solos |

### 4.2 Whole-word cells (stage `stem`, kind lexical)

| id | params | Statement | Trigger | Citation | Example |
|---|---|---|---|---|---|
| en.cell.past-listed | — | The past of `{before}` is `{after}`. | listed past alternate (indicative past, subjunctive past) | ldoce + ahd (lemma) | swim → swam |
| en.cell.participle-listed | — | The past participle of `{before}` is `{after}`. | listed participle alternate | ldoce + ahd | swim → swum; be → been |
| en.cell.has | — | The 3rd person singular present of have is has. | have, indicative present 3sg | ahd *have* | has |
| en.cell.be | person, number, tense | be: {tense}, {person} {number} is `{after}`. | be, indicative present / past | cgel ch. 3 §1 [U]; ahd *be* | am, is, was, were |
| en.cell.irrealis-were | — | In the past subjunctive be is were for every person. | be, subjunctive past | ahd *were* "Past subjunctive of be" [V]; cgel ch. 3 §1 [U] | (if) I were |

Listed alternates carry tags: `region` from the lexicon; `usage: 'literary'` for bade / bidden; and in a cell with two or more alternates each alternate gets `pattern: 'irregular'` (listed) or `pattern: 'regular'` (the `+ed` alternate, derived by the regular rules through `synthesize` on a regular copy of the lexeme, so its steps are the -ed and spelling steps).

### 4.3 ending

| id | params | Statement | Trigger (cell) | Ending | Citation | Example |
|---|---|---|---|---|---|---|
| en.end.present-plain | person, number | Present, {person} {number}: the plain form, no ending. | indicative present, not 3sg | ∅ | cgel ch. 3 §1 [U] | I walk |
| en.end.third-s | — | Present, 3rd person singular: add -s to `{before}`. | indicative present 3sg | s | dfe p. 3 | walks |
| en.end.past-ed | — | Regular past: add -ed to `{before}`. | indicative past; subjunctive past (regular) | ed | dfe p. 3 | walked |
| en.end.irrealis-past | — | The past subjunctive has the same form as the past tense. | subjunctive past (precedes past-ed or past-listed) | — | cgel ch. 3 §1 [U] | (if) he walked |
| en.end.subjunctive-plain | — | The present subjunctive is the plain form `{after}` for every person. | subjunctive present | ∅ | cgel ch. 3 [U] | (that) he walk |
| en.end.imperative-plain | — | The imperative is the plain form `{after}`. | imperative 2sg / 2pl | ∅ | cgel ch. 10 [U] | walk |
| en.end.plain-form | — | The plain form `{after}` has no ending. | non-finite `plain` (inside compound tenses) | ∅ | cgel ch. 3 [U] | (will) walk |
| en.end.ing | — | -ing form: add -ing to `{before}`. | `presentParticiple` | ing | dfe p. 3 | walking |
| en.end.participle-ed | — | Regular past participle: add -ed to `{before}`. | `pastParticiple` (regular) | ed | dfe p. 3 | walked |

Ending set as data (regular paradigm; listed cells bypass it):

| Cell | 1sg | 2sg | 3sg | 1pl | 2pl | 3pl |
|---|---|---|---|---|---|---|
| indicative present | ∅ | ∅ | s | ∅ | ∅ | ∅ |
| indicative past | ed | ed | ed | ed | ed | ed |
| subjunctive present | ∅ | ∅ | ∅ | ∅ | ∅ | ∅ |
| subjunctive past | ed | ed | ed | ed | ed | ed |
| imperative | — | ∅ | — | (let's + plain) | ∅ | — |

Non-finite: plain ∅, presentParticiple `ing`, pastParticiple `ed`.

### 4.4 orthography (JunctureRules, in this order)

Definitions used by the predicates (on the stem as it stands at that rule):
- *vowel letter*: a e i o u. *single vowel before the final consonant* (`sv`): the letter before the final consonant is a vowel letter and the letter before that is not a vowel letter, or is the `u` of `qu` (q-u-i-t, e-q-u-i-p, s-q-u-i-p count).
- *doubling consonant*: b d f g j k l m n p q r s t v z (not c — see ck —, h, w, x, y).
- `vc` = ends in a doubling consonant with `sv`.

| # | id | kind | Statement | Exact trigger | Change | Citation | Examples |
|---|---|---|---|---|---|---|---|
| 1 | en.orth.es-sibilant | rule | After s, x, z, sh and ch the ending -s is written -es: `{before}` → `{after}`. | ending `s`; stem ends in s, x, z, sh, ch | s → es | dfe p. 3 ("catches") | watches, fixes, glishes, quizzes |
| 2 | en.orth.es-o | rule | After a consonant + o, -s is written -es: `{before}` → `{after}`. | ending `s`; stem ends consonant letter + o; not `plainS` | s → es | ldoce/ahd veto, echo [V] | goes, does, vetoes, echoes; solo → solos (plainS); radio → radios (vowel + o) |
| 3 | en.orth.y-to-i | rule | After a consonant, y becomes i before -es and -ed: `{before}` → `{after}`. | stem ends consonant letter + y; ending `s` or `ed` | y → i; s → es | dfe p. 8 ("flies, tries… copied") | tries, tried, plories |
| 4 | en.orth.ie-to-y | rule | ie becomes y before -ing: `{before}` → `{after}`. | stem ends ie; ending `ing` | ie → y | ldoce/ahd die, tie [V] | dying, tying, snying |
| 5 | en.orth.e-plus-ed | rule | The verb already ends in e, so -ed adds only -d: `{before}` → `{after}`. | stem ends e; ending `ed` | ed → d | dfe p. 8 ("hiked") | hoped, agreed, hoed, dyed, died |
| 6 | en.orth.drop-e | rule | The silent e is dropped before -ing: `{before}` → `{after}`. | stem ends e preceded by a consonant letter or u; ending `ing`; not `keepsE` | drop e | dfe p. 8 ("hiking"; "Exception: being") | hoping, frobing, arguing, gluing, queuing; not seeing, hoeing, dyeing, singeing |
| 7 | en.orth.c-to-ck | rule | A final c after one vowel becomes ck before -ed and -ing: `{before}` → `{after}`. | stem ends vowel letter + c with `sv`; ending `ed` or `ing` | c → ck | ldoce/ahd panic, picnic [V] | panicked, picnicking, zamicked |
| 8 | en.orth.double-consonant | rule | One consonant after one vowel in a stressed last syllable is doubled before a vowel: `{before}` → `{after}`. (param `consonant`) | `vc`; ending `ed`, `ing`, or `es` when the consonant is z; and (lexeme `finalStress` or `doublesUnstressed`); not (final l and not `finalStress`) | double final consonant | dfe pp. 8, 11 [V]; utwente [V] | stopped, quizzes, preferring, compelled, kidnapped |
| 9 | en.orth.double-l-british | rule | British spelling doubles a final l after one vowel even without stress: `{before}` → `{after}`. (outcome tagged `region: 'GB'`) | stem ends l with `sv`, or ends `ial` / `uel`; ending `ed` or `ing`; not `finalStress`; not `lNotDoubled` | GB: double l; US: unchanged | utwente [V]; ldoce travel, cancel, label, model, equal, fuel, dial [V] | GB travelled / US traveled |
| 10 | en.orth.single-l-american | rule | American spelling keeps one l: `{after}`. (the US outcome of #9 carries this step explicitly, since the runner records no step for an unchanged juncture) | US branch of #9 | — | ahd travel, cancel… [V] | traveled |
| 11 | en.orth.single-consonant-american | rule | American spelling may keep one consonant: `{after}`. | US variant branch of #8 for `doublesUnstressed` members flagged `usSingle` (kidnap, program, worship); outcome tagged `region: 'US'`, `pattern: 'variant'` | — | ldoce kidnap, worship; ahd program [V] | kidnaped, programed, worshiped |

Notes on the predicates:
- `-es` doubling (#8 with `es`) is limited to final z: quiz → quizzes (AHD [V]); final s is not doubled before -es: gas → gases (AHD "gases or gasses", first form [V]), focus → focuses. Before -ed/-ing a monosyllabic s doubles: gassed, gassing (AHD, LDOCE [V]).
- x, w, y never double (DfE p. 8 for x [V]; w, y [S]): fixed, snowed, played, floyed.
- -ee / -oe / -ye keep their e before -ing because #6 requires a consonant or u before the e.
- A polysyllable ending in `ial` / `uel` counts as one vowel group by the syllable rule but is two syllables (di·al, fu·el); #9 names these endings explicitly. A real verb ending in -ial / -uel without British doubling is not known [U].

### 4.5 non-finite

Covered by `en.end.ing`, `en.end.participle-ed`, `en.cell.participle-listed` and the `to` periphrasis (`en.periphrasis.to-infinitive`, section 6).

### 4.6 periphrasis (18 rules, all kind rule, no params)

| id | Statement | Citation |
|---|---|---|
| en.periphrasis.perfect | Present perfect: the present of have plus the past participle. | cgel ch. 3 §4 [U]; quirk 4.18 [U] |
| en.periphrasis.pluperfect | Past perfect: had plus the past participle. | cgel ch. 3 §4 [U] |
| en.periphrasis.future | Future: will plus the plain form. | cgel ch. 3 §9 [U]; quirk 4.42 [U] |
| en.periphrasis.future-perfect | Future perfect: will have plus the past participle. | cgel ch. 3 [U] |
| en.periphrasis.present-progressive | Present continuous: the present of be plus the -ing form. | cgel ch. 3 §5 [U]; quirk 4.25 [U] |
| en.periphrasis.past-progressive | Past continuous: the past of be plus the -ing form. | cgel ch. 3 §5 [U] |
| en.periphrasis.perfect-progressive | Present perfect continuous: has/have been plus the -ing form. | cgel ch. 3 §5 [U] |
| en.periphrasis.pluperfect-progressive | Past perfect continuous: had been plus the -ing form. | cgel ch. 3 §5 [U] |
| en.periphrasis.future-progressive | Future continuous: will be plus the -ing form. | cgel ch. 3 §5 [U] |
| en.periphrasis.future-perfect-progressive | Future perfect continuous: will have been plus the -ing form. | cgel ch. 3 §5 [U] |
| en.periphrasis.conditional | Conditional: would plus the plain form. | cgel ch. 3 §9 [U]; quirk 4.61 [U] |
| en.periphrasis.conditional-perfect | Conditional perfect: would have plus the past participle. | cgel ch. 3 [U] |
| en.periphrasis.conditional-progressive | Conditional continuous: would be plus the -ing form. | cgel ch. 3 [U] |
| en.periphrasis.conditional-perfect-progressive | Conditional perfect continuous: would have been plus the -ing form. | cgel ch. 3 [U] |
| en.periphrasis.subjunctive-perfect | Perfect subjunctive: have (for every person) plus the past participle. | cgel ch. 3 §1 [U] |
| en.periphrasis.subjunctive-pluperfect | Pluperfect subjunctive: had plus the past participle. | cgel ch. 3 §1 [U] |
| en.periphrasis.lets | First person plural imperative: let's plus the plain form. | ldoce *let's* [V]; cgel ch. 10 [U] |
| en.periphrasis.to-infinitive | To-infinitive: to plus the plain form. | cgel ch. 3 §1 [U]; quirk 3.54 [U] |

### 4.7 clause

| id | kind | params | Statement | Trigger | Citation |
|---|---|---|---|---|---|
| en.clause.subject | rule | pronoun | The subject `{pronoun}` comes before the verb. | finite, not imperative | cgel ch. 2 [U] |
| en.clause.imperative-subject | rule | — | The imperative is used without a subject. | imperative | cgel ch. 10 [U] |

### 4.8 availability

None (D7). `availability` always returns null.

Dutch terms the implementer should use in the `nl` messages: plain form = *hele werkwoord (zonder to)*; 3rd person singular = *derde persoon enkelvoud*; past simple = *past simple / onvoltooid verleden tijd*; past participle = *voltooid deelwoord*; -ing form = *-ing-vorm*; present/past continuous = *present/past continuous (duurvorm)*; present perfect = *present perfect (voltooid tegenwoordige tijd)*; subjunctive = *aanvoegende wijs*; imperative = *gebiedende wijs*; conditional = *voorwaardelijke wijs*; irregular verb = *onregelmatig werkwoord*; stressed syllable = *beklemtoonde lettergreep*; British/American spelling = *Britse/Amerikaanse spelling*. Flemish and Dutch textbooks name the English tenses in English ("present simple", "present continuous"); keep those names in Dutch messages.

Rule count: 16 classify + 5 cell + 9 ending + 11 orthography + 18 periphrasis + 2 clause = **61 rules**.

## 5. Lexicon

Entry type (`src/languages/en/lexicon.ts`):

```ts
type Region = 'GB' | 'US';
/** One past or participle form; `form: null` is the regular -ed form, derived by the spelling rules. */
interface Alternate { readonly form: string | null; readonly region?: Region; readonly usage?: 'literary' }
interface Paradigm {
  readonly past: readonly Alternate[];          // preference order; [] = regular -ed only
  readonly participle: readonly Alternate[];
  readonly label?: string;                      // pattern tag of a homograph paradigm: 'hung', 'hanged'
  readonly meaning?: string;                    // condition gloss of a homograph paradigm
}
interface IrregularEntry { readonly paradigms: readonly Paradigm[]; readonly finalStress?: true }
```

Stored: past and past participle alternates only, with labels. Derived: plain, 3sg -s (except `has`), -ing, every compound. `be` stores its finite cells; `have` stores `has`.

**Labelling policy** (applied to every entry): a form printed in the LDOCE header with "American English" / "especially American English" → `US`; with "British English" / "especially British English" → `GB`; a form printed by AHD but not by the LDOCE header → `US`; forms printed unlabelled by both → no region. LDOCE's order sets preference (GB is the default preferred region). Sense-restricted forms (hanged, shined, weaved, winded, LDOCE knit³) are homograph paradigms or left out. AHD `born` (bear) is excluded: AHD's usage note restricts it to passive constructions about birth, and the catalogue is active.

Notation below: `past / participle`; `+ed` is the regular form; `(US)`, `(GB)`, `(lit.)` are labels; first form = preferred.

### 5.1 Verified entries [V] (LDOCE + AHD, 2026-11-24)

| Lemma | Past | Participle | Evidence (LDOCE header ‖ AHD) |
|---|---|---|---|
| awake | awoke, awaked (US) | awoken, awaked (US) | awoke, awoken ‖ awoke or awaked, awaked or awoken |
| bear | bore | borne | bore, borne ‖ borne or born + usage note |
| beat | beat | beaten, beat (US) | beaten ‖ beaten or beat |
| bend | bent | bent | bent ‖ bent |
| bet | bet, +ed | bet, +ed | bet (LBD: or betted) ‖ bet or betted |
| bid | bid, bade (lit.) | bid, bidden (lit.) | bid² bid; bid³ literary bade or bid, bid or bidden ‖ bade or bid, bidden or bid |
| broadcast | broadcast, +ed (US) | broadcast, +ed (US) | broadcast ‖ broadcast or broadcasted |
| burn | burnt, +ed | burnt, +ed | burnt or burned ‖ burned or burnt |
| cast | cast | cast | cast ‖ cast |
| dive | +ed, dove (US) | +ed | dived also dove AmE; pp dived ‖ dived or dove, dived |
| dream | +ed, dreamt | +ed, dreamt | dreamed or dreamt ‖ dreamed or dreamt |
| dwell | dwelt, +ed | dwelt, +ed | dwelt or dwelled ‖ dwelt or dwelled |
| fit | +ed, fit (US) | +ed, fit (US) | fitted also fit AmE ‖ fitted or fit, fitted |
| forbid | forbade, forbad (US) | forbidden, forbid (US) | forbade, forbidden ‖ forbade or forbad, forbidden or forbid |
| forecast | forecast, +ed | forecast, +ed | forecast or forecasted ‖ same |
| forget | forgot | forgotten, forgot (US) | forgot, forgotten ‖ forgotten or forgot |
| get | got | got, gotten (US) | got; pp got BrE, gotten AmE ‖ got, gotten or got |
| hang ① "hang up, be suspended" | hung | hung | hung ‖ hung |
| hang ② "kill by hanging" | +ed | +ed | sense 3 hanged ‖ v.tr.3 hanged |
| input | +ed, input | +ed, input | inputted or input ‖ inputted or input |
| kneel | knelt, +ed (US) | knelt, +ed (US) | knelt or kneeled AmE ‖ knelt or kneeled |
| knit | +ed, knit | +ed, knit | knitted (senses 1–2), knit (3–4) ‖ knit or knitted |
| lean | +ed, leant (GB) | +ed, leant (GB) | leaned or leant esp. BrE ‖ leaned |
| leap | leapt (GB), +ed (US) | leapt (GB), +ed (US) | leapt esp. BrE, leaped esp. AmE ‖ leaped or leapt |
| learn | +ed, learnt (GB) | +ed, learnt (GB) | learned or learnt esp. BrE ‖ learned also learnt |
| lie ① "be flat, be situated" | lay | lain | lay, lain ‖ lay, lain |
| lie ② "say something untrue" | +ed | +ed | lied ‖ lied |
| light | lit, +ed | lit, +ed | lit or lighted ‖ lighted or lit |
| mow | +ed | mown, +ed | mowed; mown or mowed ‖ mowed, mowed or mown |
| plead | +ed, pled (US) | +ed, pled (US) | pleaded also pled esp. AmE ‖ pleaded or pled |
| prove | +ed | +ed, proven (US) | proved; proved or proven esp. AmE ‖ proved, proved or proven |
| quit | quit, +ed (GB) | quit, +ed (GB) | quit, also quitted BrE ‖ quit also quitted |
| rid | rid, +ed | rid, +ed | rid (verb table rid/ridded) ‖ rid or ridded |
| sew | +ed | sewn, +ed | sewed; sewn or sewed ‖ sewed, sewn or sewed |
| shine ① "give out light" | shone | shone | shone ‖ shone |
| shine ② "polish" | +ed | +ed | sense 4 shined ‖ v.tr.2 shined |
| show | +ed | shown, +ed (US) | showed; shown ‖ showed, shown or showed |
| shrink | shrank, shrunk (US) | shrunk, shrunken (US) | shrank; shrunk ‖ shrank or shrunk, shrunk or shrunken |
| shut | shut | shut | shut ‖ shut |
| sing | sang, sung (US) | sung | sang; sung ‖ sang or sung, sung |
| sink | sank, sunk (US) | sunk | sank or sunk AmE; sunk ‖ sank or sunk, sunk |
| slay | slew, +ed (US) | slain, +ed (US) | slew; slain ‖ slew or slayed, slain or slayed (punctuation uncertain: recheck) |
| slide | slid | slid | slid ‖ slid |
| smell | smelt (GB), +ed (US) | smelt (GB), +ed (US) | smelled esp. AmE or smelt BrE ‖ smelled or smelt |
| sneak | +ed, snuck (US) | +ed, snuck (US) | sneaked or snuck AmE ‖ sneaked or snuck |
| sow | +ed | sown, +ed | sowed; sown or sowed ‖ sowed, sown or sowed |
| speed | sped, +ed | sped, +ed | sped or speeded ‖ sped or speeded |
| spell | spelt (GB), +ed (US) | spelt (GB), +ed (US) | spelt esp. BrE or spelled esp. AmE ‖ spelled or spelt |
| spill | spilt (GB), +ed (US) | spilt (GB), +ed (US) | spilt esp. BrE or spilled esp. AmE ‖ spilled or spilt |
| spin | spun | spun | spun (verb table also shows span) ‖ spun |
| spit | spat, spit (US) | spat, spit (US) | spat or spit AmE ‖ spit¹ spat or spit (spit² "impale": spitted) |
| spoil | +ed, spoilt (GB) | +ed, spoilt (GB) | spoiled or spoilt BrE ‖ spoiled or spoilt |
| spring | sprang, sprung (US) | sprung | sprang or sprung AmE; sprung ‖ sprang or sprung, sprung |
| stink | stank, stunk (US) | stunk | stank; stunk ‖ stank or stunk, stunk |
| strike | struck | struck, stricken (US) | struck ‖ struck, struck or stricken |
| strive | strove, +ed (US) | striven, +ed (US) | strove; striven ‖ strove or strived, striven or strived |
| swell | +ed | swollen, +ed (US) | swelled; swollen ‖ swelled, swelled or swollen |
| thrive | +ed, throve | +ed, thriven (US) | thrived or throve; thrived ‖ thrived or throve, thrived or thriven |
| tread | trod, +ed (US) | trodden, trod (US), +ed (US) | trod, trodden ‖ trod or treaded, trodden or trod or treaded |
| wake | woke, +ed (US) | woken, +ed (US) | woke, woken ‖ woke or waked, waked or woken |
| weave | wove | woven | wove, woven (sense 4 weaved) ‖ wove, woven (some senses weaved) |
| wet | wet, +ed | wet, +ed | wet or wetted ‖ wet or wetted |
| wind | wound | wound | wind² wound ‖ wind² wound |

Homographs: hang, lie, shine (two paradigms each, `label` = the past form, `meaning` = the gloss above).

### 5.2 Entries to verify in Task 2 [U] (forms from memory; the implementer confirms each in LDOCE + AHD and applies the labelling policy)

| Pattern | Lemma: past / participle |
|---|---|
| Suppletive / special | be: am·are·is, was·were / been; have: has / had / had; do: did / done; go: went / gone |
| No change | burst, cost, cut, hit, hurt, let, put, read, set, shed, slit, split, spread, thrust (each X / X) |
| Past = participle, -t/-d or vowel change | bind bound; bleed bled; breed bred; bring brought; build built; buy bought; catch caught; cling clung; creep crept; deal dealt; dig dug; feed fed; feel felt; fight fought; find found; flee fled; fling flung; grind ground; hear heard; hold held; keep kept; lay laid; lead led; leave left; lend lent; lose lost; make made; mean meant; meet met; pay paid; say said; seek sought; sell sold; send sent; shoot shot; sit sat; sleep slept; sling slung; slink slunk; spend spent; stand stood; stick stuck; sting stung; string strung; sweep swept; swing swung; teach taught; tell told; think thought; weep wept; win won; wring wrung |
| -en / -n participle | arise arose arisen; begin began begun (finalStress); bite bit bitten; blow blew blown; break broke broken; choose chose chosen; draw drew drawn; drive drove driven; eat ate eaten; fall fell fallen; fly flew flown; forsake forsook forsaken; freeze froze frozen; give gave given; grow grew grown; hide hid hidden; know knew known; ride rode ridden; rise rose risen; see saw seen; shake shook shaken; speak spoke spoken; steal stole stolen; swear swore sworn; take took taken; tear tore torn; throw threw thrown; wear wore worn; write wrote written; beget begot begotten (finalStress); smite smote smitten; stride strode stridden |
| Regular past, -n participle | hew hewed hewn/+ed; saw sawed sawn/+ed; shear sheared shorn/+ed; strew strewed strewn/+ed |
| Past ≠ participle, vowel only | come came come; drink drank drunk; ring rang rung; run ran run; swim swam swum |
| Non-derivable compounds | browbeat browbeat browbeaten; babysit babysat babysat; hamstring hamstrung hamstrung; partake partook partaken; proofread proofread proofread; waylay waylaid waylaid |

`forbid`, `forget` and `beget` also carry `finalStress: true` (forbidding, forgetting).

Totals: 60 verified lemmas (section 5.1, three of them with two paradigms) + 117 to verify (5.2) = **177 lemmas**, 180 paradigms (about 200 with the derivatives they cover). Every oracle verb not in these lists is reached by inheritance: become, forgive, mislay, mistake, overcome, overtake, understand, undertake, upset, withdraw, withstand (11 of the 145 oracle files), which exercises section 3 step 3 against the oracle.

Verification in Task 2: for each 5.2 lemma, fetch the LDOCE and AHD URLs, apply the labelling policy, and record the result in `sources.ts` (`lexiconChecked: Record<lemma, 'ldoce+ahd' | 'ldoce' | 'ahd'>`); a lemma checked against only one of the two is listed in `secondaryOnly` with the reason. Disagreements are opened by hand in OALD / M-W.

## 6. Periphrases and clause

Chains (`verb` elements name simple cells; literal words are `word` elements; no element agrees):

| Target | Chain | `variant.auxiliary` (default: first named lemma) |
|---|---|---|
| indicative.perfect | {lemma have} indicative.present · main pastParticiple | have |
| indicative.pluperfect | {have} indicative.past · main pastParticiple | have |
| indicative.future | word `will` (moodMarker) · main plain | null |
| indicative.future_perfect | `will` · {have} plain · main pastParticiple | have |
| indicative.present_progressive | {be} indicative.present · main presentParticiple | be |
| indicative.past_progressive | {be} indicative.past · main presentParticiple | be |
| indicative.perfect_progressive | {have} indicative.present · {be} pastParticiple · main presentParticiple | have |
| indicative.pluperfect_progressive | {have} indicative.past · {be} pastParticiple · main presentParticiple | have |
| indicative.future_progressive | `will` · {be} plain · main presentParticiple | be |
| indicative.future_perfect_progressive | `will` · {have} plain · {be} pastParticiple · main presentParticiple | have |
| conditional.present | word `would` (moodMarker) · main plain | null |
| conditional.past | `would` · {have} plain · main pastParticiple | have |
| conditional.present_progressive | `would` · {be} plain · main presentParticiple | be |
| conditional.past_progressive | `would` · {have} plain · {be} pastParticiple · main presentParticiple | have |
| subjunctive.perfect | {have} plain · main pastParticiple | have |
| subjunctive.pluperfect | {have} indicative.past · main pastParticiple | have |
| imperative.present, 1pl only | word `let's` (moodMarker) · main plain | null |
| infinitive.present | word `to` (particle) · main plain | null |

`have` is named by lemma (`{ lemma: 'have' }`), not as `perfectAuxiliary`: English has one perfect auxiliary, so the rules declare no `auxiliary` param; `analysis.auxiliaries` is still `['have']`. `cellOf(target, lexeme)` returns a cell for indicative present/past, subjunctive present/past, imperative 2sg/2pl, participle present/past, and null for every target in the table above (so the imperative 1pl and the infinitive go through their periphrases).

Clause (`assemble`): finite non-imperative targets get `context.subject.pronoun` as a `subject` part first (step `en.clause.subject`), then the chain words in recipe order; the imperative gets no subject (step `en.clause.imperative-subject`); non-finite targets get the chain only. No clitics, particles, inversion, reflexives, agreement (`agreements` → `one(null)`), sandhi or elision; `rendering.sandhi` → null, `bareOmits` → false, `onset` vowel/consonant by first letter. The role `moodMarker` for `will` / `would` / `let's` is the closest role the core allows for a literal word (risk R5). The negative imperative is out of scope (no do-support).

## 7. Worked derivations (learner explanation, English)

1. **he walks** (walk, regular). Analysis: `en.classify.assume-regular` "Assuming walk is regular (-ed): it is not in the list of irregular verbs." Word: `en.end.third-s` "Present, 3rd person singular: add -s to walk." → walks. Form: `en.clause.subject` "The subject he comes before the verb."
2. **he watches**: `en.end.third-s` (watch → watchs) · `en.orth.es-sibilant` "After s, x, z, sh and ch the ending -s is written -es: watchs → watches."
3. **he goes** (go, irregular past only): `en.classify.lexicon` "go is an irregular verb: past went, past participle gone." · `en.end.third-s` · `en.orth.es-o` "After a consonant + o, -s is written -es: gos → goes."
4. **she tried** (`subject: '3sg.f'`): `en.end.past-ed` (try → tryed) · `en.orth.y-to-i` "After a consonant, y becomes i before -es and -ed: tryed → tried." · subject she.
5. **dying**: `en.end.ing` (die → dieing) · `en.orth.ie-to-y` "ie becomes y before -ing: dieing → dying."
6. **hoped / hoping**: `en.end.past-ed` (hopeed) · `en.orth.e-plus-ed` "The verb already ends in e, so -ed adds only -d: hopeed → hoped." / `en.end.ing` · `en.orth.drop-e` "The silent e is dropped before -ing: hopeing → hoping."
7. **panicked**: `en.end.past-ed` · `en.orth.c-to-ck` "A final c after one vowel becomes ck before -ed and -ing: paniced → panicked."
8. **stopped; preferring**: stop is one syllable: `en.orth.double-consonant` "One consonant after one vowel in a stressed last syllable is doubled before a vowel: stoped → stopped." prefer: analysis `en.classify.stress-listed` "prefer is stressed on its last syllable." → preferring.
9. **travelled (GB) / traveled (US)**: analysis `en.classify.assume-nonfinal-stress` "Assuming the last syllable of travel is not stressed: spelling does not show stress." GB form: `en.end.past-ed` · `en.orth.double-l-british` "British spelling doubles a final l after one vowel even without stress: traveled → travelled." US form: `en.end.past-ed` · `en.orth.single-l-american` "American spelling keeps one l: traveled." Each form carries `variant.region`; `I would have travelled` never combines with a US word.
10. **I swam; I have swum**: `en.classify.lexicon` "swim is an irregular verb: past swam, past participle swum." · word `en.cell.past-listed` "The past of swim is swam." Perfect: form step `en.periphrasis.perfect` "Present perfect: the present of have plus the past participle."; part *have*: `en.end.present-plain`; part *swum*: `en.cell.participle-listed`; `variant.auxiliary` have.
11. **they had been singing**: form `en.periphrasis.pluperfect-progressive`; parts: had (`en.cell.past-listed`), been (`en.cell.participle-listed`), singing (`en.end.ing`).
12. **(if) I were; (that) he be**: subjunctive past of be: `en.cell.irrealis-were` "In the past subjunctive be is were for every person." Subjunctive present: `en.end.subjunctive-plain` "The present subjunctive is the plain form be for every person."
13. **let's go**: form `en.periphrasis.lets` "First person plural imperative: let's plus the plain form."; `en.clause.imperative-subject`; part go: `en.end.plain-form`.
14. **reblitted** (invented): analysis `en.classify.assume-regular`, `en.classify.assume-final-stress` "Assuming the last syllable of reblit is stressed: it looks like the prefix re- plus a one-syllable root." Word: `en.end.past-ed` · `en.orth.double-consonant` (reblited → reblitted). With `stress: 'nonFinal'`: `en.classify.stress-hint`, reblited.
15. **outswam** (invented derivative): `en.classify.prefixed` "outswim is out- + swim, so it has the irregular forms of swim." · `en.cell.past-listed` "The past of outswim is outswam."; outswimming by `en.orth.double-consonant` (stressed: inherited).
16. **hung / hanged**: two paradigms. Paradigm 1: `en.classify.homograph` "This paradigm of hang means "hang up, be suspended"." · `en.classify.lexicon` → hung, tagged `pattern: 'hung'`, `condition: 'hang up, be suspended'`. Paradigm 2: homograph "…kill by hanging" · regular → hanged, `pattern: 'hanged'`. `classHint: 'regular'` returns only hanged.

## 8. Test data

### 8a. Invented verbs (one per rule; all regular unless stated; GB form first)

| Verb | 3sg | Past = participle | -ing | Rule / assumption exercised |
|---|---|---|---|---|
| glorp | glorps | glorped | glorping | assume-regular; no doubling after two consonants |
| blit | blits | blitted | blitting | double-consonant (monosyllable) |
| frobe | frobes | frobed | frobing | e-plus-ed, drop-e |
| glish | glishes | glished | glishing | es-sibilant (sh) |
| glotch | glotches | glotched | glotching | es-sibilant (ch) |
| flox | floxes | floxed | floxing | es-sibilant (x); x never doubles |
| bliz | blizzes | blizzed | blizzing | es-sibilant + double z before -es |
| plaw | plaws | plawed | plawing | w never doubles |
| plory | plories | ploried | plorying | y-to-i, -ying keeps y |
| floy | floys | floyed | floying | vowel + y unchanged |
| snie | snies | snied | snying | ie-to-y, e-plus-ed |
| sklee | sklees | skleed | skleeing | -ee keeps e before -ing |
| ploe | ploes | ploed | ploeing | -oe keeps e |
| blye | blyes | blyed | blyeing | -ye keeps e |
| plargue | plargues | plargued | plarguing | drop-e after u |
| ploto | plotoes | plotoed | plotoing | es-o |
| zamic | zamics | zamicked | zamicking | c-to-ck; no stress assumption (c never doubles) |
| squip | squips | squipped | squipping | qu counts as a consonant: monosyllable |
| trimbit | trimbits | trimbited | trimbiting | assume-nonfinal-stress |
| trimbit + `stress: 'final'` | trimbits | trimbitted | trimbitting | stress-hint |
| reblit | reblits | reblitted | reblitting | assume-final-stress (re-) |
| reblit + `stress: 'nonFinal'` | reblits | reblited | rebliting | stress-hint |
| frandel | frandels | frandelled (GB) / frandeled (US) | frandelling (GB) / frandeling (US) | assume-nonfinal-stress; British l |
| outswim | outswims | outswam / outswum | outswimming | prefixed (out + swim) |
| glorp + `stems: { past: 'glarp', pastParticiple: 'glorpen' }` | glorps | glarp / glorpen | glorping | hint-irregular; `classSource: 'explicitHint'` |

### 8b. Real verbs outside the oracle (all forms [V] in LDOCE and/or AHD, 2026-11-24)

Regular: walk walks walked walking; stop stopped stopping; hope hoped hoping; hop hopped hopping; try tries tried trying; panic panicked panicking; picnic picnicked picnicking; travel travelled/travelling (GB) traveled/traveling (US); cancel, label, model, equal, fuel, dial (same GB/US pattern); compel compelled; control controlled; patrol patrolled; excel excelled; prefer preferred; occur occurred; admit admitted; visit visited; benefit benefited; focus focused focuses; target targeted; combat combated; enter entered; conquer conquered; profit profited; interpret interpreted; offer offered; develop developed; format formatted; handicap handicapped; kidnap kidnapped + kidnaped (US); program programmed + programed (US); worship worshipped + worshiped (US); parallel paralleled (no region); quiz quizzes quizzed quizzing; veto vetoes vetoed vetoing; echo echoes; die died dying; tie tied tying; dye dyed dyeing; hoe hoed hoeing; singe singed singeing; agree agreed agreeing; argue argued arguing; glue glued gluing; queue queued queuing; solo solos soloed soloing; gas gases gassed gassing; fulfil fulfilled (BrE lemma), fulfill fulfilled (AmE lemma).

Irregular, not in the oracle: dive dived + dove (US) / dived; prove proved / proved + proven (US); learn learned + learnt (GB); spell spelt (GB) + spelled (US); sneak sneaked + snuck (US); light lit + lighted; spring sprang + sprung (US) / sprung; awake awoke + awaked (US) / awoken + awaked (US); show showed / shown + showed (US); sew sewed / sewn + sewed; thrive thrived + throve / thrived + thriven (US); input inputted + input; slay — excluded from tests until AHD's punctuation is rechecked.

Inheritance and its limits: misspell → misspelt (GB) / misspelled (US) [derived from 5.1 spell]; underlie → underlay / underlain only; outbid → outbid only; behave → behaved (no-inherit); relay → relayed (no-inherit) [U: relayed to confirm in AHD].

### 8c. Not applicable (Italian / Latin only).

## 9. Oracle

### 9.1 Page structure

- 145 files `<lemma>.html`, ASCII bytes declared UTF-8 (`encoding: 'utf-8'`); all irregular verbs; no regular verb at all.
- Content between the comments `<!-- #BeginEditable "Full_width_text" -->` and `<!-- #EndEditable -->`. Slice the string there before loading it with cheerio: the "Verbs conjugated like …" table after the end comment is another `<p>` and must not be read.
- Inside the slice: exactly **22 `<p>` elements**, in this order (identical in all 145 files):

| p# | `h2` / `h3` context | first `<b>` text | Rows | Target(s) |
|---|---|---|---|---|
| 0 | Nominal Forms | Infinitive: / Participle: / Gerund: | 3 labelled values | infinitive.present; participle.past; **participle.present (remap R3)** |
| 1 | Indicative | Present | 6 | indicative.present |
| 2 | Indicative | Perfect | 6 | indicative.perfect |
| 3 | Indicative | Past | 6 | indicative.past |
| 4 | Indicative | Pluperfect | 6 | indicative.pluperfect |
| 5 | Indicative | Future | 6 | indicative.future |
| 6 | Indicative | Future perfect | 6 | indicative.future_perfect |
| 7 | Subjunctive | Present | 6 | subjunctive.present |
| 8 | Subjunctive | Present (2nd occurrence) | 6 | **subjunctive.perfect (remap R1)** |
| 9 | Subjunctive | Imperfect | 6 | **subjunctive.past (remap R2)** |
| 10 | Subjunctive | Pluperfect | 6 | subjunctive.pluperfect |
| 11 | Conditional | Present | 6 | conditional.present |
| 12 | Conditional | Perfect | 6 | conditional.past |
| 13 | Imperative | (no `<b>`) | 6 lines: 3 blank, you / we / you | imperative.present 2sg, 1pl, 2pl |
| 14 | h2 "Progressive (Continuous) Forms", Indicative | Present | 6 | indicative.present_progressive |
| 15 | … | Perfect | 6 | indicative.perfect_progressive |
| 16 | … | Past | 6 | indicative.past_progressive |
| 17 | … | Pluperfect | 6 | indicative.pluperfect_progressive |
| 18 | … | Future | 6 | indicative.future_progressive |
| 19 | … | Future perfect | 6 | indicative.future_perfect_progressive |
| 20 | Progressive, Conditional | Present | 6 | conditional.present_progressive |
| 21 | Progressive, Conditional | Perfect | 6 | conditional.past_progressive |

Heading text: the first `<b>` of the `<p>`, whitespace-collapsed (it often begins with `<br>`). The parser asserts the 22 headings above in order and throws naming the file otherwise.

### 9.2 Rows and cells

- Split the `<p>` inner HTML on `<br>`; drop whitespace-only segments and the heading. A person row is `<font …><span>PRONOUN</span>&nbsp;…</font>` followed by one or more `<span class="normal|irregular|orto">` values; the classes are the site's own regular/irregular/spelling marks and are ignored.
- **Alternates** are the value `<span>`s, separated by text `; ` (1,054 one-separator rows, 72 two-separator rows: spit, strike). An alternate after the first that has fewer words (ignoring tags) takes the missing leading words from the first: `have betted; bet` → `have betted`, `have bet`. (The shared `alternatives()` helper cannot be used: it splits `ridded (E); rid (U)` wrongly.)
- **Region tags** `(U)` → `US`, `(E)` → `GB`: stripped from the word and re-attached as the suffix ` (US)` / ` (GB)` of that expected text. 172 cells carry a tag (get 37, rid 49, strike 37, strive 49).
- **Expected text** of a person row: `PRONOUN + ' ' + alternate` (I / you / he / we / you / they); `he` is the default `3sg.m` slot. `original` = the row text as printed (pronoun, alternates joined by `; `, tags kept).
- **Nominal**: `to arise` (the to-infinitive, kept with *to*), participle, gerund — no pronoun; `person`/`number` null.
- **Imperative**: lines 0, 2, 5 are a blank `<span class="normal"> </span>` → template placeholders (3 per file, **435** total), not cells. Lines 1, 3, 4 become cells at `corpusCell` indexes 1, 3, 4 (2sg, 1pl, 2pl); the row label (`you`, `we`) is dropped. `Let&#180;s` (U+00B4) → `let's`: the acute accent becomes an apostrophe and the sentence-initial capital is lowered; typographic normalisation, not a correction (145 cells; pinned in the parser test).
- Cells per file: 3 + 20 × 6 + 3 = **126**; no dash or empty cell; every cell available.

### 9.3 Remaps (template-level, with reason and URL)

| # | Heading (occurrence) | Target | Cells | Reason | Source |
|---|---|---|---|---|---|
| R1 | Subjunctive › Present #2 | subjunctive.perfect | 870 | The second "Present" block holds have + past participle (`have arisen` for every person): the perfect subjunctive. | CGEL ch. 3 §1 [U]; AHD *were* (past subjunctive of be) for the system https://www.ahdictionary.com/word/search.html?q=were |
| R2 | Subjunctive › Imperfect | subjunctive.past | 870 | English has no imperfect; the block is the past (irrealis) subjunctive (`were` for every person of be). | same |
| R3 | Nominal Forms › Gerund | participle.present | 145 | The "gerund" is the -ing form (CGEL: gerund-participle), the catalogue's participle.present. | DfE Appendix 1 p. 3 ("–ing… added to verbs") https://assets.publishing.service.gov.uk/media/5a7ccc06ed915d63cc65ce61/English_Appendix_1_-_Spelling.pdf |

"Conditional › Perfect" → conditional.past and the Progressive blocks are ordinary section-map entries (the labels are correct names).

### 9.4 Unmodelled cells

None (`unmodelled: {}`): every oracle cell maps to a catalogue target.

### 9.5 Source errors (corrections)

Found by diffing every cell against a reference generator built from section 5.1 and the rules of section 4. Each rule below is one `if (file.infinitive === …)` branch in `scripts/corpus/corrections/en.ts`.

| # | File | Cells (blocks) | Source form(s) | Correct | Authority | Cells |
|---|---|---|---|---|---|---|
| C1 | dig | gerund + 8 progressive blocks | `diging` | `digging` | DfE p. 8 (one-syllable doubling); LDOCE dig | 49 |
| C2 | fly | indicative present 3sg | `flys` | `flies` | DfE p. 8 ("flies, tries") | 1 |
| C3 | teach | indicative present 3sg | `teachs` | `teaches` | DfE p. 3 ("catches") | 1 |
| C4 | shake | indicative past, subjunctive past | `shaked` | `shook` | LDOCE / AHD shake [U: confirm page] | 12 |
| C5 | strike | participle, past ×2, 6 perfect blocks | alternate `striked` | drop it (struck; stricken US) | LDOCE strike "struck" [V]; AHD "struck, struck or stricken" [V] | 49 |
| C6 | shut | same 49 | alternate `shutted` | drop | LDOCE / AHD "shut" [V] | 49 |
| C7 | cast | same 49 | alternate `casted` | drop | LDOCE / AHD "cast" [V] | 49 |
| C8 | spit | same 49 | alternate `spitted` (the regular past of spit² "impale") | drop | LDOCE "spat or spit American English"; AHD spit¹ "spat or spit" [V] | 49 |
| C9 | slide | participle + 6 perfect blocks | alternate `slidden` | drop | LDOCE / AHD "slid" [V] | 37 |
| C10 | bend | participle + 6 perfect blocks | alternate `bended` | drop | LDOCE / AHD "bent" [V] | 37 |
| C11 | bear | participle + 6 perfect blocks | alternate `born` | drop | AHD usage note: born only in passive constructions about birth [V]; LDOCE "borne" [V] | 37 |
| C12 | spin | indicative past, subjunctive past | alternate `span` | drop | LDOCE header "spun"; AHD "spun" [V] (LDOCE verb table shows span unlabelled: hand-check OALD) | 12 |
| C13 | rid | participle, past ×2, 6 perfect blocks | `ridded (E); rid (U)` | `ridded; rid` (no regions) | AHD "rid or ridded"; LDOCE "rid" (verb table rid/ridded), neither regional [V] | 49 |
| C14 | strive | same 49 | `strove (E)`, `striven (E)` | `strove`, `striven` (no region); `strived (US)` kept | LDOCE "strove… striven" unlabelled; AHD "strove or strived, striven or strived" [V] | 49 |
| | | | | | **Total** | **480** |

Not errors (kept, matched by labelled engine variants): past `sung` (AHD), `shrunk` / `stunk` past (AHD, US), `betted` (AHD, LDOCE business), `quitted` (GB), `waked` (US), `kneeled` (US), `pleaded` (regular main form), `trod` participle (US), `forbad` (US), `got; gotten (U)`, `stricken (U)`, `bade`, `bidden` (literary), `hanged; hung`, `lay; lied` / `lain; lied`, `shone; shined` (two paradigms).

### 9.6 Expected totals (pin these)

| Quantity | Value |
|---|---|
| Files / infinitives | 145 / 145 |
| Cells per file / cells | 126 / 18,270 |
| Template placeholders | 435 |
| Available / unavailable cells | 18,270 / 0 |
| Expected forms after corrections | 19,005 (19,324 before) |
| Correction rules / corrected cells | 14 / 480 |
| Remaps / remapped cells | 3 / 1,885 |
| Unmodelled cells | 0 |
| Region-tagged cells | 172 |
| Normalised `Let´s` cells | 145 |

## 10. Tense concepts (for the equivalence table)

Concept names follow the approved design where it names them; names marked * are proposals for the concept list.

| Tense | Concept links (weight) | Notes |
|---|---|---|
| indicative.present | PRESENT (1.0) | habitual / general present; nl OTT, fr présent |
| indicative.past | PAST_PERFECTIVE (0.6), PAST_IMPERFECTIVE (0.4) | the simple past covers both; fr passé composé / passé simple vs imparfait; nl OVT |
| indicative.perfect | PRESENT_PERFECT (1.0) | not a narrative past (unlike fr passé composé, nl VTT) |
| indicative.pluperfect | PLUPERFECT (1.0) | |
| indicative.future | FUTURE (1.0) | |
| indicative.future_perfect | FUTURE_PERFECT* (1.0) | |
| indicative.present_progressive | PRESENT (0.9, aspect progressive) | nl "aan het + inf", fr "être en train de" |
| indicative.past_progressive | PAST_IMPERFECTIVE (0.9) | fr imparfait |
| indicative.perfect_progressive | PRESENT_PERFECT (0.5), PRESENT (0.5) | duration up to now: "I have been waiting for an hour" = nl "ik wacht al een uur", fr "j'attends depuis une heure" |
| indicative.pluperfect_progressive | PLUPERFECT (0.5), PAST_IMPERFECTIVE (0.5) | fr "j'attendais depuis" |
| indicative.future_progressive | FUTURE (0.9) | |
| indicative.future_perfect_progressive | FUTURE_PERFECT* (0.9) | |
| conditional.present | COND_PRESENT (1.0) | |
| conditional.past | COND_PAST* (1.0) | |
| conditional.present_progressive | COND_PRESENT (0.9) | |
| conditional.past_progressive | COND_PAST* (0.9) | |
| subjunctive.present | SUBJ_PRESENT (1.0) | mandative, formal register; more common in AmE |
| subjunctive.past | SUBJ_PAST* / irrealis (1.0) | "if I were": fr imparfait after *si*, de Konjunktiv II, nl OVT |
| subjunctive.perfect | SUBJ_PERFECT* (1.0) | rare |
| subjunctive.pluperfect | SUBJ_PLUPERFECT* (1.0) | "if I had known": fr plus-que-parfait after *si* |
| imperative.present | IMPERATIVE* (1.0) | 1pl = hortative (let's) |
| infinitive.present | INFINITIVE* (1.0) | |
| participle.present | PRESENT_PARTICIPLE* (0.6), GERUND (0.4) | one form serves both |
| participle.past | PAST_PARTICIPLE* (1.0) | |

## 11. Open questions and risks

| # | Item |
|---|---|
| Q1 | Section numbers in CGEL and Quirk are from memory [U]; confirm in print (or drop to chapter level) before `sources.ts` cites them. |
| Q2 | OALD / M-W / Cambridge EGT / EC style guide must be opened by hand for: spin (span), shake, slay (AHD punctuation), and every 5.2 lemma where LDOCE and AHD disagree. |
| Q3 | Second verbs left out: spit² (spitted), wind¹ (winded), weave (weaved), knit (sense-restricted knit kept as an unlabelled alternate). Adding them as homograph paradigms would also make C8 unnecessary. |
| Q4 | Optional spelling variants not generated: focussed, benefitted, combatted, parallelled (GB), eying, glueing, queueing (GB), ageing (GB), bussed/busses. A learner typing them in the trainer is marked wrong. |
| Q5 | AHD-only forms are labelled US by policy; some (benefitted is not generated anyway; `forbad`, `beat` participle) may be general rather than American. |
| R1 | **Locale `en` vs language `en`.** `src/i18n/locales/en/index.ts` exports `const en` (the English *locale* catalog); the English *pack's* messages for that locale live in `src/i18n/locales/en/en.ts` and for Dutch in `src/i18n/locales/nl/en.ts`. Importing `{ en }` from `./en.js` inside `locales/en/index.ts` collides with `export const en`. Export the pack messages as `english` from both files (and Dutch as `dutch`, whatever Plan 2 Task 7 chose). `Locale` (`'en' \| 'nl'`) and `Language` (now including `'en'`) are both string unions: `explain(language, form, locale)` with the two arguments swapped still typechecks when both are `'en'`; tests must use `--locale nl` / `'nl'` to catch a swap. |
| R2 | The completeness gate merges catalogs flat: English rule ids are `en.*`, core keys are `term.*` / `explain.*`, so no key collides; a future core key starting `en.` would. |
| R3 | Two paradigms give identical present / -ing forms twice (`he hangs` with pattern hung and with pattern hanged). Correct per contract; the trainer must dedupe by text. |
| R4 | `can` and `will` conjugate as regular lexical verbs (cans, canned), which a learner may not expect. |
| R5 | The core's literal-word roles are `linker \| particle \| moodMarker`; `will`, `would`, `let's` use `moodMarker`. If Plan 2 or later adds an `auxiliary` word role, switch. |
| R6 | Stress heuristics on unlisted real verbs: any regular verb that parses as prefix + monosyllable but is stressed earlier (like conquer, enter) gets a wrong doubled form with an assumption; the `nonFinalStress` list is the fix. Task 2 pins the heuristic over the 58 evidence verbs of section 8b. |
| R7 | Contractions (`I'll`, `he's`) and `shall` are out; typed trainer answers using them are wrong for the engine. |
| R8 | Region is a fork constraint: every compound form inherits the region of its words; a form with no regional word has no region and survives either `region` filter. |
