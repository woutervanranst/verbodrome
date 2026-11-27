# German (de) grammar design

Input for `docs/superpowers/plans/2026-11-24-seven-language-engine-05-de.md`. The approved design's "German (de)" section (`docs/superpowers/specs/2026-11-24-seven-language-engine-design.md`) is the scope; where this research departs from it, §12 says so. The pack is written against the core contract after Plan 2 Part A (`LanguagePack.subjects` / `subjectsFor`, `CatalogueEntry.slots`, `LanguageSpec<Tenses>` with its `subject` union, `classify` returning a `Fork` of paradigms with `analysis.alternatives`, `cellOf(target, lexeme)`, `Periphrasis<X>` with `applies` and `reports`, `ClauseContext.subject` and `agreeing`, the `./core` authoring surface, labelled corpus queries, remaps, `scope: 'unmodelled'`); `packages/conjugation-engine/docs/pack-authoring.md` is the authoring guide.

Status marks: [V] page opened and it states the claim; [S] seen only in a search snippet; [U] from memory, to verify where the row says. Every form in §7 and §8 is marked unless it is mechanical from a [V] rule.

## 1. Sources

All URLs below were opened during this design pass (no site refused automated fetching; Duden needs disambiguated slugs such as `haben_Hilfsverb`, `backen_herstellen`, `sein_Verb_Vollverb`, and a plain slug for a homograph returns 404). grammis quotes came through a summarising fetch: re-read the wording before pasting a quote into a message or `sources.ts`.

| Key | Role | Title | URL | Status |
|---|---|---|---|---|
| G-4047 | inflection | grammis, Propädeutische Grammatik: Verbflexion nach Tempus und Modus | https://grammis.ids-mannheim.de/progr@mm/4047 | [V] |
| G-4069 | inflection | … Verbflexion | https://grammis.ids-mannheim.de/progr@mm/4069 | [V] |
| G-4070 | inflection | … Verbflexion nach Person und Numerus | https://grammis.ids-mannheim.de/progr@mm/4070 | [V] |
| G-4071 | inflection | … Flexionsklassen der Verben | https://grammis.ids-mannheim.de/progr@mm/4071 | [V] |
| G-4073 | inflection | … Schwache Verben (incl. the list of mixed verbs) | https://grammis.ids-mannheim.de/progr@mm/4073 | [V] |
| G-4074 | inflection | … Starke Verben (≈170 verbs, Ablaut tables, strong/weak doublets) | https://grammis.ids-mannheim.de/progr@mm/4074 | [V] |
| G-4075 | inflection | … Flexion der Modalverben | https://grammis.ids-mannheim.de/progr@mm/4075 | [V] |
| G-4076 | inflection | … Flexion der Hilfsverben | https://grammis.ids-mannheim.de/progr@mm/4076 | [V] |
| G-4119 | inflection | … Schwa bei den Flexionsmarkern der Verbflexion | https://grammis.ids-mannheim.de/progr@mm/4119 | [V] |
| SG-439 | inflection | grammis, Systematische Grammatik: Formenbestand (Indikativ und Konjunktiv) | https://grammis.ids-mannheim.de/systematische-grammatik/439 | [V] |
| SG-1275 | inflection | … Imperativ: Formenbestand | https://grammis.ids-mannheim.de/systematische-grammatik/1275 | [V] |
| SG-290 | inflection | … Imperativparadigma und Aufforderungsformen (Sie-, wir-Form) | https://grammis.ids-mannheim.de/systematische-grammatik/290 | [V] |
| SG-1283 | inflection | … Partizip II | https://grammis.ids-mannheim.de/systematische-grammatik/1283 | [V] |
| SG-1285 | word formation | … verbal prefixes (be-, ent-, er-, ver-, zer-; miss-) | https://grammis.ids-mannheim.de/systematische-grammatik/1285 | [V] |
| SG-232 | tense | … Formenbestand des deutschen Tempussystems | https://grammis.ids-mannheim.de/systematische-grammatik/232 | [V] |
| SG-312 | mood | … Würde-Formen ("Konjunktiv Präteritum von werden + Infinitiv vom Voll- oder Modalverb") | https://grammis.ids-mannheim.de/systematische-grammatik/312 | [V] |
| SG-1219 | auxiliary | … Bestimmung des Perfekthilfsverbs | https://grammis.ids-mannheim.de/systematische-grammatik/1219 | [V] |
| SG-380 | modals | … Modalverben ("bilden aber keinen Imperativ") | https://grammis.ids-mannheim.de/systematische-grammatik/380 | [V] |
| F-109 | prefixes | grammis, Grammatik in Fragen und Antworten: Präverbfügungen und Komposita (separable vs. inseparable; dual prefixes "mit jedem einzelnen Verb mitlernen") | https://grammis.ids-mannheim.de/fragen/109 | [V] |
| F-162 | mood | … würde-Periphrase statt Konjunktiv Präteritum | https://grammis.ids-mannheim.de/fragen/162 | [V] |
| VG-2269 | clause | grammis, Verbalkomplex: rechte Satzklammer (finite verb second, particle and infinite verbs at the end) | https://grammis.ids-mannheim.de/vggf/2269 | [V] |
| R | spelling | Rat für deutsche Rechtschreibung, *Amtliches Regelwerk der deutschen Rechtschreibung. Regeln und Wörterverzeichnis*, 2024 (PDF ISBN 978-3-948831-66-0) | https://www.rechtschreibrat.com/DOX/RfdR_Amtliches-Regelwerk_2024.pdf | [V] |
| R-html | spelling | same, HTML rendering on grammis (A 2.3 = §25–26) | https://grammis.ids-mannheim.de/rechtschreibung/6180 | [V] |
| DS-imp | usage | Duden Sprachwissen: Bildung des Imperativs | https://www.duden.de/sprachwissen/sprachratgeber/Bildung-des-Imperativs | [V] |
| DS-modal | usage | Duden Sprachwissen: Modalverben ("keine Imperative") | https://www.duden.de/sprachwissen/sprachratgeber/modalverben | [V] |
| DS-wuerde | usage | Duden Sprachwissen: Konjunktiv II oder würde-Form | https://www.duden.de/sprachwissen/sprachratgeber/Konjunktiv-2-oder-w%C3%BCrde-Form | [V] |
| LEX-dwds | lexicon | DWDS entry (grammar line) and inflection table per lemma | `https://www.dwds.de/wb/<lemma>`, `https://www.dwds.de/lemma/flexion/<lemma>` (`#1/#2` for homographs) | [V] pattern |
| LEX-duden | lexicon (cross-check) | Duden online entry and conjugation table | `https://www.duden.de/rechtschreibung/<slug>`, `https://www.duden.de/konjugation/<slug>` (ä→ae, ß→sz in slugs) | [V] pattern |
| DG | print | Duden. Die Grammatik (Duden Band 4), 10th ed., Berlin: Dudenverlag 2022, chapter "Das Verb: Flexion" | print only | [U] (cite by chapter) |

Regelwerk paragraphs used (all [V] in the PDF text): §2 (doubling after short vowel: *muss, wusste*), §13 (ä from a), §16 (äu from au: *er läuft*), §19 ("Folgen auf -ee oder -ie die Flexionsendungen … -e, -en … so entfällt ein e": *sie schrien, geschrien*), §25 + E1 + E2 (ß after long vowel / diphthong; *fließen – er floss*; "In der Schweiz und in Liechtenstein kann immer ss geschrieben werden"), §26 (2sg -st after s, ss, ß, x, z loses its s: *du reist, du reißt, du mixt, du sitzt*), §33(3) (inseparable compounds with stress on the second part: *übersetzen, umfahren, wiederholen*), §34 (separable compounds written together only in infinitives, participles and verb-final position).

### 1.1 Which source each rule area rests on

| Rule area | Sources |
|---|---|
| Classes, productivity of weak verbs, ge- placement with prefixes | G-4071, G-4069 |
| Personal endings, present and Präteritum | SG-439, G-4070 |
| Schwa after d/t and obstruent + nasal; none after a vowel-changed dental stem (*du giltst*) | G-4073, G-4119, SG-439 |
| 2sg after s-sounds | R §26, G-4119; archaic *-est* variant: SG-439 |
| -eln / -ern | G-4119 (*sammeln*, *ich sammele / sammle*) |
| Strong verbs: present vowel change, Ablaut, doublets | G-4070, G-4074 |
| Konjunktiv I, Konjunktiv II by umlaut (*gäbe, stürbe, würfe, begänne/begönne, stände/stünde*) | SG-439 |
| Mixed verbs (list and umlauted Konjunktiv II stem) | G-4073 |
| Modals and wissen; no imperative | G-4075, SG-380, DS-modal |
| sein, haben, werden | G-4076 |
| Imperative: e→i stem, -e optional / obligatory, plural = 2pl, Sie / wir forms | SG-1275, DS-imp, SG-290 |
| Partizip II and ge- | SG-1283, G-4071 |
| Prefix inventory, separable vs inseparable | SG-1285, F-109, R §33–34 |
| Tenses, perfect auxiliary selection | SG-232, SG-1219 |
| würde-form (incl. modal verbs) | SG-312, F-162, DS-wuerde |
| Verb-second clause, particle at the end | VG-2269 |
| `ie` + `e` contraction | R §19 |
| Every lexicon entry | LEX-dwds (authority), LEX-duden (cross-check) |

### 1.2 Claims no online authority states (cite DG by chapter, flagged `print: true` in `sources.ts`)

1. Partizip I = infinitive stem + *-end* (*lachend, sammelnd, tuend*): not on grammis or Duden Sprachwissen.
2. 3sg without an extra *-t* after a vowel-changed stem in *t* (*er hält, tritt, gilt, ficht*): grammis shows only *rät* and *du giltst*.
3. o → ö in the present (*stoßen – stößt*) stated as a rule (grammis gives a→ä, e→i/ie, au→äu with examples only).
4. A closed list of strong verbs: grammis says "ca. 170" and gives frequency tables; the lexicon list in §5.2 is checked lemma by lemma at DWDS instead.
5. Dual particles: stress decides separability, but which reading a verb has "muss man mit jedem einzelnen Verb mitlernen" (F-109) — hence lexical lists plus a recorded assumption.
6. Denominal *be-/ver-* + particle verbs are weak and inseparable (*beantragen, veranlassen*).
7. Impersonal weather verbs and the third-person-only *geschehen*: only shown by Duden conjugation tables (persons 1/2 printed as "–"), never stated as a rule.

DS-imp and SG-1275 disagree on the imperative *-e* after *d/t*: Duden calls it obligatory ("wenn der Verbstamm auf d/t oder Konsonant plus m/n endet"), grammis says "meist". §4.3 follows the DWDS tables per lemma (§8.3).

## 2. Catalogue

### 2.1 Moods and tenses (20 entries, catalogue order)

| Id | moodLabel | tenseLabel | Built | Persons |
|---|---|---|---|---|
| `indicative.present` | Indikativ | Präsens | simple | 6 |
| `indicative.past` | Indikativ | Präteritum | simple | 6 |
| `indicative.perfect` | Indikativ | Perfekt | haben/sein (Präsens) + Partizip II | 6 |
| `indicative.pluperfect` | Indikativ | Plusquamperfekt | haben/sein (Präteritum) + Partizip II | 6 |
| `indicative.future` | Indikativ | Futur I | werden (Präsens) + Infinitiv | 6 |
| `indicative.future_perfect` | Indikativ | Futur II | werden (Präsens) + Partizip II + haben/sein | 6 |
| `subjunctive.present` | Konjunktiv I | Präsens | simple | 6 |
| `subjunctive.perfect` | Konjunktiv I | Perfekt | haben/sein (Konj. I) + Partizip II | 6 |
| `subjunctive.future` | Konjunktiv I | Futur I | werden (Konj. I) + Infinitiv | 6 |
| `subjunctive.future_perfect` | Konjunktiv I | Futur II | werden (Konj. I) + Partizip II + haben/sein | 6 |
| `subjunctive.past` | Konjunktiv II | Präteritum | simple | 6 |
| `subjunctive.pluperfect` | Konjunktiv II | Plusquamperfekt | haben/sein (Konj. II) + Partizip II | 6 |
| `conditional.present` | Konjunktiv II (würde-Form) | Futur I | würde + Infinitiv | 6 |
| `conditional.past` | Konjunktiv II (würde-Form) | Futur II | würde + Partizip II + haben/sein | 6 |
| `imperative.present` | Imperativ | Präsens | simple (+ pronoun for wir / Sie) | `slots` 2sg, 1pl, 2pl, 2.formal (persons [2,sg] [1,pl] [2,pl] [3,pl]) |
| `infinitive.present` | Infinitiv | Präsens | simple | – |
| `infinitive.perfect` | Infinitiv | Perfekt | Partizip II + haben/sein | – |
| `participle.present` | Partizip | Partizip I | simple | – |
| `participle.past` | Partizip | Partizip II | simple | – |

`subjunctive` is built with two `moodEntries` calls so that its entries carry two mood labels (Konjunktiv I for present/perfect/future/future_perfect, Konjunktiv II for past/pluperfect). The labels follow the Duden conjugation tables ("Konjunktiv II Futur I: ich würde fragen"). Voices: none (active only; no `voices` key).

### 2.2 Subject slots

| id | person | number | pronoun | gender | register | default |
|---|---|---|---|---|---|---|
| `1sg` | 1 | singular | ich | – | – | yes |
| `2sg` | 2 | singular | du | – | informal | yes |
| `3sg` | 3 | singular | er | masculine | – | yes |
| `3sg.f` | 3 | singular | sie | feminine | – | no |
| `3sg.n` | 3 | singular | es | neuter | – | no |
| `1pl` | 1 | plural | wir | – | – | yes |
| `2pl` | 2 | plural | ihr | – | informal | yes |
| `3pl` | 3 | plural | sie | – | – | yes |
| `2.formal` | 3 | plural | Sie | – | formal | no |

`genderedTargets` is not set: gender is pronoun-only (spec table "Subject gender"). `Sie` addresses one or several people and always conjugates as third person plural, so it is one slot; its id names the addressee (`2`), like the toy's `2sg.formal`. The imperative entry declares `slots: ['2sg', '1pl', '2pl', '2.formal']` (`CatalogueEntry.slots`, which replaces `persons` for expansion; the core's own doc names this German case), so an unfiltered query gives du / wir / ihr, `subject: '2.formal'` gives `backen Sie`, and the default `3pl` slot never reaches the imperative. `{ mood: 'imperative', person: 3 }` without `subject` and `{ mood: 'imperative', subject: '3sg.f' }` are `INVALID_TARGET`. The spec's `subject` type is the union of the nine ids.

### 2.3 Options (`germanOptions`, validation order)

| Field | Kind | Values | Meaning |
|---|---|---|---|
| `stems` | stems | words `present2`, `preterite`, `subjunctive`, `participle`; enum `unstressedFirstSyllable: true \| false` | principal parts for an unlisted verb, or overriding listed ones; `present2` is the 2sg/3sg stem (`fähr`), `subjunctive` the Konjunktiv II stem (`führ`), `participle` the whole Partizip II (`gefahren`) |
| `auxiliary` | enum | `haben`, `sein` | narrows the perfect auxiliaries to one; INVALID_HINT if a listed verb cannot take it |
| `classHint` | enum | `weak`, `strong`, `mixed` | selects one paradigm of a dual-class verb; for an unlisted verb `strong`/`mixed` need `stems.preterite` and `stems.participle` (else INVALID_HINT) |
| `separablePrefix` | word `/^[\p{L}]+$/u` | | the lemma's separable particle; INVALID_HINT when not a proper prefix, or when the lexicon lists the lemma as inseparable-only |
| `inseparablePrefix` | word | | the lemma's unstressed prefix (blocks ge-, never separates) |
| `check` | | | `separablePrefix` and `inseparablePrefix` together → INVALID_HINT (as Dutch) |

The common `subject` option (a slot id from §2.2) comes from the core.

### 2.4 Left out, and why

| Left out | Reason |
|---|---|
| Passive (Vorgangs-, Zustandspassiv) | spec scope: active voice only |
| Reflexive verbs (`sich waschen`) | spec: later, like Dutch; `sich …` input is INVALID_INFINITIVE with that reason |
| Ersatzinfinitiv (`hat … kommen können`), modal + infinitive clauses | spec |
| Subordinate-clause word order, questions, negation | spec; the clause builds main-clause (verb-second) order only |
| zu-infinitive, Partizip I + zu | not in the catalogue, so `zu` placement is not needed |
| Old spelling (pre-1996 `ß` after short vowel, `geschrieen`) | spec decision: current spelling only |
| Regional present forms (Swiss `ss` output, Austrian `ist gestanden` as default) | `sein` for stehen/liegen/sitzen is emitted with `region: 'south'`, never as the preferred form |

## 3. Classification

### 3.1 Classes

| `classification` | Detected by | Stores | Example |
|---|---|---|---|
| `weak` | default for anything unlisted | nothing | machen, schlinken (invented) |
| `strong` | lexicon | present2?, preterite, participle, KII?, auxiliaries | fahren, geben |
| `mixed` | lexicon | preterite stem (Rückumlaut), participle, KII stem | brennen, bringen, denken |
| `preteritePresent` | lexicon (6 modals + wissen) | present singular stem, preterite stem, participle, KII stem | können, wissen |
| `irregular` | lexicon | whole-word cells | sein, haben, werden, tun |

Subclasses that change rules, all detected from spelling of the present stem `S` (infinitive minus `-en`, or minus `-n` after `-el`/`-er`, or after a vowel: `tu-n`):

| Subclass | Predicate on `S` | Effect |
|---|---|---|
| dental | `/[dt]$/` | schwa before `-st`, `-t`, `-te` (`de.orth.schwa-dental`) |
| obstruent + nasal | `/(?:[bdfgkpstvxzß]\|ch)[mn]$/` | schwa as above (`de.orth.schwa-nasal`); `lernen`, `qualmen`, `wohnen`, `kämmen` do not match |
| sibilant | `/(?:s\|ß\|z\|x)$/` (incl. `ss`, `tz`) | 2sg `-t` (`de.orth.sibilant-2sg`); `sch` does not match (`du wäschst`) |
| -el / -er | infinitive matches `/[^aeiouäöü]e[lr]n$/` | `-n` for `-en` etc. (`de.orth.el-er-schwa`), e-elision in `-le` (`de.orth.el-elision`) |
| vowel-final | `/(?:ie\|[aeiouäöüy])$/` (`tu`, `schrie`) | `ie` + `e` contraction (`de.orth.ie-contraction`) |
| -ieren | infinitive ends in `ieren` and the part before `ieren` contains a vowel letter (`stud-ieren`; not `zieren`, `frieren`, `schmieren`) | Partizip II without ge- (`de.stem.ge-blocked-stress`) |

### 3.2 Order of classification (`classify(query): Fork<GermanLexeme>`)

1. Reject `sich …` (INVALID_INFINITIVE, "Reflexive verbs are not supported yet.") and anything not `/^\p{L}+$/u` ending in `n`.
2. **Hints first**: `separablePrefix` / `inseparablePrefix` / `classHint` / `stems` / `auxiliary` override everything below; each applied hint records `de.classify.hint` (params `hint`, `value`); `classificationSource: 'explicitHint'`.
3. **Exact lexicon entry** → `de.classify.lexicon` (lexical, after = class). A dual-class entry yields one outcome per paradigm (§3.5), a dual-prefix entry one per reading.
4. **Transliteration** (only when 3 misses): replace `ae oe ue` by `ä ö ü` and `ss` by `ß` in every combination; if exactly one result is a lexicon lemma, use it and record `de.classify.transliteration` (assumption, params `written`, `read`). Bare vowels are never re-umlauted (`wagen` must stay `wagen`, not `wägen`).
5. **Derivative split** (shared resolver, §3.4): particle(s) + optional inseparable prefix + root. If the root (or root after transliteration) is a lexicon entry and the lemma is not on the no-inherit list, the lexeme inherits the root's parts with the prefix prepended → `de.classify.derivative` (params `prefix`, `root`). Otherwise the root is classified as unlisted (step 6) and the prefix still applies.
6. **Unlisted**: `weak` with `de.classify.default-weak` (assumption); auxiliary `haben` with `de.classify.default-haben` (assumption) unless `auxiliary` is hinted; if no inseparable prefix and not `-ieren`: initial stress with `de.classify.default-stress` (assumption), i.e. ge- in Partizip II.

### 3.3 Separable and inseparable prefixes (closed lists)

| List | Members |
|---|---|
| Inseparable (`de.classify.inseparable`) | be, emp, ent, er, ge, miss, ver, zer |
| Dual (stressed = separable, unstressed = inseparable) | durch, hinter, über, um, unter, voll, wider, wieder |
| Separable (`de.classify.separable`) | ab, an, auf, aus, bei, da, dabei, dagegen, daher, dahin, daneben, dar, davon, davor, dazu, dazwischen, ein, empor, entgegen, entlang, entzwei, fest, fort, frei, gegenüber, heim, her, herab, heran, herauf, heraus, herbei, herein, herüber, herum, herunter, hervor, hin, hinab, hinauf, hinaus, hinein, hinüber, hinunter, hinweg, hinzu, hoch, los, mit, nach, nieder, vor, voran, voraus, vorbei, vorüber, vorweg, weg, weiter, zu, zurecht, zurück, zusammen, zuvor |

Particles are matched longest first (`herum` before `her`, `hinein` before `hin`). A particle may be followed by an inseparable prefix (`an-er-kennen`, `an-ver-trauen`, `auf-er-stehen`).

**Plausible remainder** (both splits): the remainder minus its infinitive ending has ≥ 2 letters, contains a vowel letter, and begins with a vowel or a German onset from the closed list `b bl br ch d dr f fl fr g gl gn gr h j k kl kn kr l m n p pf pfl pfr pl pr qu r s sch schl schm schn schr schw sk sl sm sn sp spl spr st str t tr ts tsch v w wr z zw`. So `beten` (`t`), `erben` (`b`), `zucken` (`ck`), `herrschen` (`rsch`) are never split.

**Unknown verb with a separable or dual particle** (decided with the user): split it, record `de.classify.assume-separable` (assumption, param `particle`), accept `inseparablePrefix` to override. Dual particles are treated the same way, but the message says the particle may also be unstressed (`umschlinken` → `ich schlinke um`).

**Unknown verb with an inseparable prefix**: `de.classify.inseparable` (rule, not an assumption: these prefixes are never separable and never stressed), so `verschlinken` → `verschlinkt`.

### 3.4 Derivatives inherit safely

| Guard | Data |
|---|---|
| Closed prefix lists only (§3.3) | `handhaben`, `frühstücken`, `ratschlagen` are never split: `hand`, `früh`, `rat` are not particles |
| Root must be a lexicon entry, and ≥ 4 letters (`gehen`, `tun`, `sein` never inherit through a prefix unless the derivative is listed) | listed short derivatives: `angehen`, `ausgehen`, `begehen`, `vergehen`, `abtun`, `antun`, `zutun`… resolve through the derivative-of-short-root list in `lexicon.ts` |
| Inseparable prefix directly followed by a separable particle forms a denominal weak verb (`de.classify.denominal`): never inherits | beantragen, beauftragen, veranlassen, veranschlagen, veranstalten, beabsichtigen, beanspruchen, beanstanden, verabreden, vereinbaren |
| No-inherit list (`de.classify.not-derived`, rule, params `root`) | bedingen (weak, not `bedang`), bereiten ('prepare', weak; the 'break in a horse' reading is not modelled), erlöschen/verlöschen are listed themselves (löschen is weak), handhaben, willfahren |
| Simplex lookalikes (never split; ordinary unlisted weak verbs) | angeln, ankern, beben, beichten, beugen, dauern, einigen, entern, festigen, geizen, hindern, mitteln, abonnieren, animieren, annoncieren, antizipieren |
| Inseparable readings of dual particles (listed: no assumption) | überzeugen, überraschen, übernehmen, überweisen, übertreiben, überprüfen, überqueren, überwinden, übersehen, überlegen*, übersetzen*, unterrichten, unterschreiben, unterstützen, unterbrechen, untersuchen, unterscheiden, unterdrücken, unterhalten*, umarmen, umgeben, umfassen, umringen, durchqueren, durchsuchen*, widersprechen, widerstehen, wiederholen*, hinterlassen, hintergehen, vollenden, vollziehen, vollbringen (`*` = dual-prefix lemma, §3.5) |
| Auxiliary of a derivative | inherited from the root with `de.classify.assume-root-auxiliary` (assumption, param `root`) unless the derivative is on the derivative-auxiliary list: vertreten haben, bekommen haben, begehen haben, entstehen sein, erscheinen sein, verschwinden sein, entkommen sein, gestehen haben, verstehen haben, umziehen (§3.5) |

### 3.5 Several paradigms for one lemma (`classify` returns several outcomes)

| Lemma | Outcome tags `pattern` / `condition` | Paradigm A | Paradigm B |
|---|---|---|---|
| bewegen | `weak` 'set in motion' / `strong` 'induce' | bewegt, bewegte, hat bewegt | bewegt, bewog, hat bewogen |
| erschrecken | `weak` 'transitive: frighten' / `strong` 'intransitive: be frightened' | erschreckt, erschreckte, hat erschreckt | erschrickt, erschrak, ist erschrocken |
| hängen | `weak` 'transitive: hang up' / `strong` 'intransitive: hang' | hängte, hat gehängt | hing, hat gehangen (south: ist) |
| schaffen | `strong` 'create' / `weak` 'manage' | schuf, hat geschaffen | schaffte, hat geschafft |
| schleifen | `strong` 'sharpen' / `weak` 'drag; raze' | schliff, hat / ist geschliffen (Duden table) | schleifte, hat / (seltener) ist geschleift (DWDS, Duden) |
| wiegen | `strong` 'weigh' / `weak` 'rock' | wog, hat gewogen | wiegte, hat gewiegt |
| wachsen | `strong` 'grow' / `weak` 'wax' | wächst, wuchs, ist gewachsen | wachst, wachste, hat gewachst |
| senden | `mixed` 'send' / `weak` 'broadcast' | sandte, hat gesandt, KII sendete | sendete, hat gesendet |
| wenden | `mixed` 'turn (oneself)' / `weak` 'turn over' | wandte, hat gewandt, KII wendete | wendete, hat gewendet |
| backen | `weak` / `strong` (no difference in sense; DWDS prints two unlabeled sets, Duden marks *buk* veraltend) | backt, backte, KII backte, hat gebacken | bäckt, buk (dated), KII büke (dated), hat gebacken |
| umziehen, umfahren, umgehen, umschreiben, umstellen, übersetzen, überlegen, überziehen, übergehen, übertreten, unterhalten, unterstellen, unterziehen, durchbrechen, durchlaufen, durchschauen, durchsetzen, durchsuchen, wiederholen, widerspiegeln | `separable` / `inseparable` (condition = gloss of each reading) | `ich ziehe um`, umgezogen | `ich umziehe`, umzogen |

`classHint` selects by class, `separablePrefix` / `inseparablePrefix` by reading; then exactly one outcome remains, with the steps of that paradigm only. Paradigm order in the table is output order. Glosses are the `condition` strings (English, as Dutch conditions are).

### 3.6 Defaults and the assumption each records

| Default | Rule id (assumption) | Overridden by |
|---|---|---|
| weak | `de.classify.default-weak` | `classHint` + `stems` |
| perfect with haben | `de.classify.default-haben` | `auxiliary` |
| stress on the first syllable (ge-) | `de.classify.default-stress` | `stems.unstressedFirstSyllable: true` |
| unknown particle verb is separable | `de.classify.assume-separable` | `inseparablePrefix` |
| derivative takes the root's auxiliary | `de.classify.assume-root-auxiliary` | `auxiliary` |
| `ae/oe/ue/ss` read as `ä/ö/ü/ß` | `de.classify.transliteration` | typing the umlaut |

## 4. Rule inventory

Citation keys (`[G-4074]`, `[R §25 E2]`, `[DG]`, `[LEX]`…) are defined in §1. `[LEX]` means the lexicon entry's own DWDS/Duden URL. Messages are written by the implementer from the statement column (en) and translated (nl); terms whose Dutch school-grammar name matters: Präteritum = *onvoltooid verleden tijd* (say "Präteritum" in both locales, it is the German name the learner sees), Partizip II = *voltooid deelwoord*, Partizip I = *tegenwoordig deelwoord*, Konjunktiv = *aanvoegende wijs* (keep "Konjunktiv I/II"), scheidbaar/onscheidbaar voorvoegsel, sterk/zwak/gemengd werkwoord, Umlaut (keep), stam, uitgang, hulpwerkwoord.

### 4.1 classify (`stage: 'classify'`)

| Rule id | Kind | Params | Statement (en) | Trigger | Cite | Example |
|---|---|---|---|---|---|---|
| `de.classify.lexicon` | lexical | – | {before} is listed as a {after} verb. | exact lexicon hit | [LEX] [G-4071] | fahren → strong |
| `de.classify.derivative` | rule | `prefix`, `root` | {before} is {prefix} + {root}, so it takes the forms of {root}. | §3.2 step 5, root listed | [G-4071] [SG-1285] [F-109] | verschlafen → schlafen |
| `de.classify.separable` | rule | `particle` | {particle}- is a separable particle: it is stressed and stands apart from the conjugated verb. | listed separable particle | [SG-1285] [R §34] | herumfahren |
| `de.classify.inseparable` | rule | `prefix` | {prefix}- is an inseparable prefix: it is never stressed and never separated. | §3.3 inseparable list, or a hinted / listed dual particle | [SG-1285] [F-109] | verschlinken |
| `de.classify.assume-separable` | assumption | `particle` | Assuming {particle}- is a separable particle, because the verb is not in the lexicon. | unlisted lemma, plausible split at a separable or dual particle | [SG-1285] [F-109] | aufschlinken, umschlinken |
| `de.classify.denominal` | rule | `prefix` | A verb with {prefix}- before a separable particle is formed from a noun: it is weak and inseparable. | inseparable prefix + separable particle | [DG] | beantragen |
| `de.classify.not-derived` | rule | `root` | {before} is not formed from {root}: it is conjugated on its own. | no-inherit list | [LEX] | bedingen |
| `de.classify.default-weak` | assumption | – | Assuming a weak verb, because the verb is not in the lexicon. | unlisted root | [G-4071] (weak is the productive class) | schlinken |
| `de.classify.default-haben` | assumption | – | Assuming the perfect is formed with haben. | unlisted, no `auxiliary` hint | [SG-1219] | schlinken |
| `de.classify.default-stress` | assumption | – | Assuming the stress is on the first syllable, so Partizip II takes ge-. | unlisted, no prefix, not `-ieren` | [G-4071] | geschlinkt |
| `de.classify.ieren` | rule | – | Verbs in -ieren are stressed on -ier-, so Partizip II has no ge-. | §3.1 `-ieren` predicate | [G-4071] [SG-1283] | studieren |
| `de.classify.assume-root-auxiliary` | assumption | `root` | Assuming the perfect auxiliary of {root}. | derivative not on the derivative-auxiliary list | [SG-1219] | verschlafen |
| `de.classify.transliteration` | assumption | `written`, `read` | Reading {written} as {read}. | §3.2 step 4 | [R §25 E2] | heissen → heißen |
| `de.classify.hint` | rule | `hint`, `value` | As requested, {hint} is {value}. | any applied hint | [G-4071] | `classHint: 'weak'` |

### 4.2 stem (`stage: 'stem'`)

| Rule id | Kind | Params | Statement | Trigger | Cite | Example |
|---|---|---|---|---|---|---|
| `de.stem.present` | rule | – | Drop the infinitive ending: the stem is {after}-. | every present-system cell | [G-4071] | fahren → fahr- |
| `de.stem.present2` | lexical | – | Strong verbs change the vowel in the du and er forms: {before}- becomes {after}-. | `present2` listed; ind.present 2sg/3sg | [G-4074] [LEX] | fahr- → fähr- |
| `de.stem.present-singular` | lexical | – | The singular present of {before} has its own stem {after}-. | preteritePresent, ind.present sg | [G-4075] [LEX] | könn- → kann- |
| `de.stem.preterite` | lexical | – | The Präteritum stem of {before} is {after}-. | strong / mixed / preteritePresent, ind.past | [G-4074] [LEX] | fahr- → fuhr- |
| `de.stem.subjunctive-umlaut` | rule | – | Konjunktiv II: the Präteritum stem with Umlaut, {before}- → {after}-. | strong, no listed KII; last vowel a/o/u/au | [SG-439] [R §13] [R §16] | fuhr- → führ- |
| `de.stem.subjunctive-plain` | rule | – | Konjunktiv II keeps the Präteritum stem {after}-, which has no vowel to umlaut. | strong, last vowel i / ie / ei / e | [SG-439] | blieb- |
| `de.stem.subjunctive-lexical` | lexical | – | The Konjunktiv II stem of {before} is {after}-. | listed KII (doublets, mixed, modals) | [LEX] | starb- → stürb- |
| `de.stem.subjunctive-weak` | rule | – | Weak verbs form Konjunktiv II like the Präteritum. | weak | [G-4073] [SG-439] | machte |
| `de.stem.imperative-i` | rule | – | Verbs that change e to i(e) use {after}- in the du-imperative, without -e. | present2 vowel i/ie, infinitive stem vowel not; not werden | [SG-1275] [G-4074] | geb- → gib |
| `de.stem.participle` | lexical | – | The Partizip II stem of {before} is {after}-. | strong / mixed / preteritePresent / irregular | [G-4074] [LEX] | fahr- |
| `de.stem.ge-prefix` | rule | – | Partizip II takes ge- because the first syllable is stressed: {after}. | no inseparable prefix, not blocked by stress | [G-4071] [SG-1283] | gefahr- |
| `de.stem.ge-blocked-prefix` | rule | `prefix` | No ge-: the verb starts with the unstressed prefix {prefix}-. | `lexeme.prefix` set | [G-4071] [SG-1283] | verschlaf- |
| `de.stem.ge-blocked-stress` | rule | – | No ge-: the first syllable is not stressed. | `-ieren`, non-initial-stress list, or hint | [SG-1283] | studier- |
| `de.stem.lexical-cell` | lexical | – | {before} is irregular here: the whole form is {after}. | `cell` hook (§5.4) | [G-4076] [G-4075] [LEX] | sein → bin |

### 4.3 ending (`stage: 'ending'`)

| Rule id | Kind | Params | Statement | Trigger | Cite | Example |
|---|---|---|---|---|---|---|
| `de.end.present` | rule | `ending`, `person`, `number` | Präsens, {person} {number}: add -{ending}. | ind.present | [SG-439] [G-4070] | fahr + e → fahre |
| `de.end.preterite-present` | rule | `ending` | Modal verbs and wissen have no ending in the ich and er forms of the Präsens. | preteritePresent, ind.present sg (`ending` '' or 'st') | [G-4075] | kann, kannst |
| `de.end.preterite-weak` | rule | `ending` | Weak Präteritum: add -te and the ending -{ending}. | weak / mixed / preteritePresent / haben, ind.past | [SG-439] [G-4073] | mach + te + n → machten |
| `de.end.preterite-strong` | rule | `ending` | Strong Präteritum: the ich and er forms have no ending; otherwise add -{ending}. | strong, ind.past | [SG-439] | fuhr + en → fuhren |
| `de.end.preterite-2sg` | rule | – | The du-form of the strong Präteritum after {before} has two endings, -st and -est. | strong ind.past 2sg, stem ends in s ß z x sch d t. After d/t: -st first, -est tagged `pattern: 'long'`; after s ß z x sch: -est first, -st (→ -t by §26) tagged `pattern: 'short'` | [SG-439] [LEX] | fand + st, fand + est; las + est, las + st → last |
| `de.end.subjunctive-i` | rule | `ending` | Konjunktiv I: the infinitive stem plus -{ending}. | subj.present (not sein) | [SG-439] | fahr + est |
| `de.end.subjunctive-ii` | rule | `ending` | Konjunktiv II: add -{ending} to the Konjunktiv II stem. | subj.past, strong / mixed / preteritePresent / irregular | [SG-439] | führ + e |
| `de.end.subjunctive-ii-short` | rule | – | In the du and ihr forms the e of the ending may be dropped. | subj.past 2sg/2pl when the KII stem is umlauted (differs from the Präteritum stem) and does not end in a dental, an obstruent + nasal or s ß z x; tag `pattern: 'short'` | [LEX] (Duden table *kommen*: "kämest, kämst") | kämst, kämt, wärst |
| `de.end.imperative-singular` | rule | `ending` | du-imperative: the stem plus -{ending}. | imperative 2sg; §4.3.1 | [SG-1275] [DS-imp] | komme / komm |
| `de.end.imperative-plural` | rule | – | ihr-imperative: the ihr-form of the Präsens without the pronoun. | imperative 2pl | [SG-1275] | fahrt, arbeitet |
| `de.end.imperative-polite` | rule | – | wir- and Sie-imperative: the plural form of the Präsens (seien for sein), followed by the pronoun. | imperative 1pl, formal | [SG-290] | fahren wir, fahren Sie |
| `de.end.infinitive` | rule | – | The infinitive is the stem plus -en (-n after -el, -er and a vowel). | infinitive.present | [G-4071] | fahren, sammeln, tun |
| `de.end.participle-weak` | rule | – | Weak Partizip II ends in -t. | weak / mixed / preteritePresent / haben | [SG-1283] | gemacht |
| `de.end.participle-strong` | rule | – | Strong Partizip II ends in -en. | strong | [SG-1283] | gefahren |
| `de.end.present-participle` | rule | – | Partizip I: the infinitive stem plus -end. | participle.present | [DG] | fahrend, sammelnd, tuend |

#### 4.3.1 du-imperative endings

| Stem | Forms (first = preferred; second tagged) | Source |
|---|---|---|
| i-stem (`de.stem.imperative-i`) | bare only: gib, nimm, lies, iss, hilf, tritt, gilt, ficht | [SG-1275] [LEX] |
| obstruent + nasal | `-e` only: atme, rechne, öffne | [SG-1275] [DS-imp] [LEX] |
| `-el` / `-er` | `-e` only, stem e kept first, dropped second (`pattern: 'elided'`): sammele / sammle, wandere / wandre | [SG-1275] [DS-imp] [LEX] |
| `d` / `t` (weak, strong, mixed) | `-e` only: arbeite, finde, halte, biete. DWDS prints the bare form as `(ugs.)` and Duden Sprachwissen calls the -e "verbindlich"; colloquial forms are not emitted | [DS-imp] [LEX] |
| otherwise | bare first, `-e` second (`pattern: 'long'`), as DWDS orders them: komm / komme, mach / mache, bring / bringe, brenn / brenne | [SG-1275] [LEX] |
| listed (`GermanEntry.imperative`) | sei; hab / habe; werde; sieh / siehe; wisse; tu / tue (tue: Duden); lad / lade (laden: DWDS *lädt* set, unmarked) | [LEX] |

Ending sets (`paradigms.ts`, data; person order 1sg 2sg 3sg 1pl 2pl 3pl):

| Set | 1sg | 2sg | 3sg | 1pl | 2pl | 3pl |
|---|---|---|---|---|---|---|
| present | e | st | t | en | t | en |
| present, preterite-present | – | st | – | en | t | en |
| preterite weak (after `te`) | – | st | – | n | t | n |
| preterite strong | – | st | – | en | t | en |
| Konjunktiv I | e | est | e | en | et | en |
| Konjunktiv II (strong, mixed, modal, haben, werden) | e | est | e | en | et | en |
| imperative | 2sg `e` / – ; 1pl `en` ; 2pl `t` ; formal `en` | | | | | |

### 4.4 orthography (`JunctureRule`s, applied in this order)

| Rule id | Statement | Trigger (stem `S`, ending `E`, cell) | Outcomes | Cite | Example |
|---|---|---|---|---|---|
| `de.orth.ie-contraction` | After -ie the e of the ending is dropped: {before} → {after}. | `S` ends `ie`, `E` starts `e` | one | [R §19] | schrie + en → schrien; schrie + e → schrie (KII) |
| `de.orth.el-er-schwa` | After unstressed -el and -er the ending loses its e: {before} → {after}. | `S` ends `el`/`er` (§3.1), `E` ∈ {en, est, et, end} | one; for `-el` with `est`/`et` a second outcome drops the stem e instead (`sammlest`), `pattern: 'elided'` | [G-4119] [LEX] | sammel + en → sammeln; sammel + est → sammelst / sammlest |
| `de.orth.el-elision` | Before the ending -e, the e of -el or -er may be dropped: {before} → {after}. | `S` ends `el`/`er`, `E` = `e` | unchanged first, elided second with `pattern: 'elided'` | [G-4119] [LEX] | sammele / sammle; wandere / wandre |
| `de.orth.schwa-dental` | After d or t an e is inserted before the ending: {before} → {after}. | `S` `/[dt]$/`, `E` ∈ {st, t, te…, tet} (starts with s or t); not a `present2` stem; not the strong Präteritum du-form (decided by `de.end.preterite-2sg`) | one | [G-4073] [G-4119] [SG-439] | arbeit + st → arbeitest; fand + t → fandet |
| `de.orth.schwa-nasal` | After a consonant + m or n an e is inserted before the ending: {before} → {after}. | `S` `/(?:[bdfgkpstvxzß]\|ch)[mn]$/`, same `E` | one | [G-4073] [G-4119] | atm + t → atmet |
| `de.orth.t-merge` | The er-form of {before} gets no second t. | `present2` stem ends `t`, `E` = `t` | one | [G-4119] (*rät*) [DG] | hält + t → hält |
| `de.orth.sibilant-2sg` | After s, ß, z or x the du-ending -st loses its s: {before} → {after}. | `S` `/(s\|ß\|z\|x)$/`, `E` = `st`, present or Präteritum | one (the archaic -est of the Präsens, DWDS *reisest (va.)*, SG-439 "archaisch", is not emitted) | [R §26] [G-4119] | reis + st → reist; las + st → last |

### 4.5 periphrasis (`stage: 'periphrasis'`), see §6.1 for the chains

`de.periphrasis.perfect`, `.pluperfect`, `.future`, `.future-perfect`, `.subjunctive-perfect`, `.subjunctive-pluperfect`, `.subjunctive-future`, `.subjunctive-future-perfect`, `.conditional`, `.conditional-perfect`, `.infinitive-perfect` — each one sentence naming the auxiliary form and the non-finite form ("Perfekt: the Präsens of {auxiliary} plus Partizip II."). Rules whose chain uses `perfectAuxiliary` declare exactly one param `auxiliary` (text); the others declare none (`validateGrammar`). Cite [SG-232] (perfect, pluperfect, future, future perfect), [SG-312] (würde-forms, "vom Voll- oder Modalverb") and [SG-1219] (haben/sein).

### 4.6 clause (`stage: 'clause'`)

| Rule id | Params | Statement | Trigger | Cite |
|---|---|---|---|---|
| `de.clause.subject` | – | Main clause: subject, then the conjugated verb; other verb forms go to the end. | finite target, not imperative | [VG-2269] |
| `de.clause.particle-final` | `particle` | The separable particle {particle} goes to the end of the clause. | `lexeme.particle.separable` and the lexical verb is finite | [VG-2269] [R §34] |
| `de.clause.particle-attached` | `particle` | The particle {particle} is written together with {before}: {after}. | separable particle, lexical verb non-finite | [R §34] |
| `de.clause.imperative-pronoun` | `pronoun` | In this imperative the pronoun {pronoun} follows the verb and cannot be left out. | imperative 1pl / formal | [SG-290] |
| `de.clause.impersonal-es` | – | Weather verbs have es as their subject. | impersonal list, 3sg | [LEX] (Duden *regnen*: "unpersönlich") |

### 4.7 availability (`stage: 'availability'`, kind `unavailable`)

| Rule id | Reason | Statement | Trigger | Cite |
|---|---|---|---|---|
| `de.avail.third-person-only` | `defective` | This verb is only used in the third person. | `thirdPersonOnly` (geschehen); person 1/2, or subject `2.formal` | [LEX] (Duden table *geschehen*: persons 1/2 "–") [DG] |
| `de.avail.no-imperative` | `noImperative` | This verb has no imperative. | modals, third-person-only and impersonal verbs | [G-4075] [SG-380] [DS-modal] |
| `de.avail.impersonal` | `impersonal` | Weather verbs have only the es-form. | `impersonal`; any finite target but 3sg | [LEX] (Duden *regnen*) |
Rule count: 14 classify + 14 stem + 15 ending + 7 orthography + 11 periphrasis + 5 clause + 3 availability = **69**.

## 5. Lexicon

### 5.1 Entry type and what is derived

```ts
type Auxiliary = 'haben' | 'sein';
interface AuxiliaryUse { readonly verb: Auxiliary; readonly condition?: string; readonly region?: 'south' }
interface Alternate { readonly text: string; readonly usage?: 'dated' | 'literary'; readonly pattern?: string }
interface GermanEntry {
  readonly class: 'strong' | 'mixed' | 'preteritePresent' | 'irregular';
  readonly present2?: string | readonly Alternate[];   // du/er stem: 'fähr', 'gib', 'lies', 'hält'
  readonly presentSingular?: string;                    // preteritePresent: 'kann', 'weiß'
  readonly preterite: string | readonly Alternate[];   // 'fuhr'; mixed / modal / haben: stem before -te ('brann', 'konn', 'hat')
  readonly participle: string;                          // Partizip II as printed for this lemma: 'gefahren', 'befohlen'
  readonly subjunctive?: readonly Alternate[];          // Konjunktiv II stems when not derivable: [{text:'hälf'},{text:'hülf', pattern:'alternate'}]
  readonly imperative?: readonly Alternate[];           // whole du-imperatives when not derivable (sieh / siehe)
  readonly auxiliaries: readonly AuxiliaryUse[];        // output order
  readonly cells?: Readonly<Record<CellKey, readonly Alternate[]>>; // whole words: 'indicative.present.1sg' → [{text:'bin'}]
  readonly flags?: readonly ('thirdPersonOnly' | 'noImperative' | 'impersonal' | 'nonInitialStress')[];
  readonly source: `https://www.dwds.de/${string}`;    // the table the entry was verified against
  readonly crossCheck?: `https://www.duden.de/${string}`;
}
```

| Stored | Derived by rule |
|---|---|
| present2 (only if it differs), preterite stem, Partizip II, auxiliaries | present stem, all endings, Konjunktiv I, Partizip I, infinitive, imperative (except listed), Konjunktiv II by umlaut, ge- / no ge-, every compound tense |
| Konjunktiv II only when umlaut does not give it: doublets (helfen, schwimmen…), e→ü/ö forms (sterben → stürb, werfen → würf), all mixed and modal verbs (brennt-, dächt-, könnt-, sollt-) | |
| whole-word cells only for sein, haben (hast, hat), werden (wird; Präteritum wurde…), tun (tun 1pl/3pl), modals and wissen | |

Labels: DWDS is the lexical authority for forms and their marks (`(va.)` on a listed alternate → `usage: 'dated'`; `(ugs.)` → not emitted; rule-level archaic variants such as Präsens *du reisest* or Präteritum *ihr aßet* are not emitted either); Duden is the cross-check, and a Duden "veraltend" on a form DWDS leaves unmarked also makes it `dated`; a Duden "seltener/auch" form DWDS lists without mark is `pattern: 'alternate'`. Conflicts are recorded in `sources.ts` next to the entry. A form only one authority prints is kept and flagged `crossCheck: undefined`.

### 5.2 Root lemmas (184), by pattern

Parts in the order 3sg present (only if changed) · Präteritum · Partizip II · auxiliary (h = haben, s = sein, h/s both) · Konjunktiv II if lexical. Rows marked [V] were checked at DWDS/Duden during this design (§1, §8); everything else is [U] and is verified at DWDS during Task 2 (that check is part of the task, not optional).

| Pattern | Lemmas |
|---|---|
| 1a ei–i–i | beißen biss gebissen h · gleichen glich geglichen h · gleiten glitt geglitten s · greifen griff gegriffen h · kneifen kniff gekniffen h · leiden litt gelitten h · pfeifen pfiff gepfiffen h · reißen riss gerissen h/s · reiten ritt geritten s/h [V] · schleichen schlich geschlichen s · schleifen (dual, §3.5) · schmeißen schmiss geschmissen h · schneiden schnitt geschnitten h · schreiten schritt geschritten s · spleißen spliss gesplissen h · streichen strich gestrichen h/s [V] · streiten stritt gestritten h · weichen wich gewichen s |
| 1b ei–ie–ie | bleiben blieb geblieben s · gedeihen gedieh gediehen s · leihen lieh geliehen h · meiden mied gemieden h · preisen pries gepriesen h · reiben rieb gerieben h · scheiden schied geschieden h/s · scheinen schien geschienen h · schreiben schrieb geschrieben h · schreien schrie geschrien h [V] · schweigen schwieg geschwiegen h · speien spie gespien h [V] · steigen stieg gestiegen s · treiben trieb getrieben h/s [V] · weisen wies gewiesen h · zeihen zieh geziehen h |
| 2a ie–o–o (long) | biegen bog gebogen h/s · bieten bot geboten h · fliegen flog geflogen s/h · fliehen floh geflohen s · frieren fror gefroren h/s · schieben schob geschoben h · stieben stob gestoben s/h · verlieren verlor verloren h · wiegen (dual) · ziehen zog gezogen h/s |
| 2b ie–o–o (short) | fließen floss geflossen s · genießen genoss genossen h · gießen goss gegossen h · kriechen kroch gekrochen s · riechen roch gerochen h · schießen schoss geschossen h/s · schließen schloss geschlossen h · sieden sott / siedete gesotten h · sprießen spross gesprossen s · triefen triefte / troff (dated) getrieft h · verdrießen verdross verdrossen h |
| 2c other → o–o | lügen log gelogen h · trügen trog getrogen h · saugen sog / saugte gesogen / gesaugt h · heben hob gehoben h · schwören schwor / schwur (dated) [V] geschworen h, KII schwöre / schwüre (dated) [V] · gären gor / gärte gegoren / gegärt h/s · wägen wog gewogen h · bewegen (dual) · erwägen erwog erwogen h · melken melkte / molk (dated) gemolken h · quellen quillt quoll gequollen s · schmelzen schmilzt schmolz geschmolzen s/h [V] · schwellen schwillt schwoll geschwollen s · dreschen drischt drosch gedroschen h · fechten ficht focht gefochten h · flechten flicht flocht geflochten h · scheren schor geschoren h · glimmen glomm / glimmte geglommen h · klimmen klomm geklommen s · erlöschen erlischt erlosch erloschen s · verlöschen verlischt verlosch verloschen s · saufen säuft soff gesoffen h |
| 3a i–a–u | binden band gebunden h · dingen dingte / dang gedungen h · dringen drang gedrungen s/h · finden fand gefunden h · gelingen gelang gelungen s [V] · klingen klang geklungen h · misslingen misslang misslungen s [V] · ringen rang gerungen h · schinden schindete geschunden h · schlingen schlang geschlungen h · schwinden schwand geschwunden s · schwingen schwang geschwungen h · singen sang gesungen h · sinken sank gesunken s · springen sprang gesprungen s · stinken stank gestunken h · trinken trank getrunken h · winden wand gewunden h · wringen wrang gewrungen h · zwingen zwang gezwungen h |
| 3b i–a–o | beginnen begann begonnen h, KII begänne / begönne (dated) [V] · gewinnen gewann gewonnen h, KII gewänne / gewönne (dated) [V] · rinnen rann geronnen s · sinnen sann gesonnen h · spinnen spann gesponnen h · schwimmen schwamm geschwommen s/h [V], KII schwämme / schwömme (dated) [V] |
| 3c e–a–o (e→i) | bergen birgt barg geborgen h · bersten birst barst geborsten s · gelten gilt galt gegolten h, KII gälte / gölte (dated) [V] · helfen hilft half geholfen h, KII hälfe, hülfe [V] · schelten schilt schalt gescholten h · sterben stirbt starb gestorben s, KII stürbe [V] · verderben verdirbt verdarb verdorben s/h, KII verdürbe (Duden) / verdärbe (DWDS) [V] · werben wirbt warb geworben h, KII würbe · werfen wirft warf geworfen h, KII würfe |
| 4 e–a–o (e→i/ie) | befehlen befiehlt befahl befohlen h, KII befähle / beföhle (dated) [V] · brechen bricht brach gebrochen h/s · empfehlen empfiehlt empfahl empfohlen h, KII empfähle / empföhle (dated) [V] · gebären gebiert / gebärt gebar geboren h · nehmen nimmt nahm genommen h · sprechen spricht sprach gesprochen h · stechen sticht stach gestochen h · stehlen stiehlt stahl gestohlen h, KII stähle [V] · treffen trifft traf getroffen h · erschrecken (dual) · kommen kam gekommen s |
| 5 e–a–e | essen isst aß gegessen h · fressen frisst fraß gefressen h · geben gibt gab gegeben h · genesen genas genesen s · geschehen geschieht geschah geschehen s, thirdPersonOnly · lesen liest las gelesen h [V] · messen misst maß gemessen h · sehen sieht sah gesehen h, imperative sieh / siehe [V] · treten tritt trat getreten s/h · vergessen vergisst vergaß vergessen h · bitten bat gebeten h [V] · liegen lag gelegen h, s (region south) [V] · sitzen saß gesessen h, s (south) [V] |
| 6 a–u–a | backen (two sets, §3.5) [V] · fahren fährt fuhr gefahren s/h · graben gräbt grub gegraben h · laden lädt lud geladen h · mahlen mahlte gemahlen h · schaffen (dual) · schlagen schlägt schlug geschlagen h · tragen trägt trug getragen h · wachsen (dual) · waschen wäscht wusch gewaschen h |
| 7 reduplicating | blasen bläst blies geblasen h · braten brät briet gebraten h · fallen fällt fiel gefallen s · fangen fängt fing gefangen h · halten hält hielt gehalten h · hängen (dual) · hauen haute / hieb gehauen h · heißen hieß geheißen h · laufen läuft lief gelaufen s · lassen lässt ließ gelassen h · raten rät riet geraten h · rufen rief gerufen h · salzen salzte gesalzen h · schlafen schläft schlief geschlafen h · spalten spaltete gespalten h · stoßen stößt stieß gestoßen h/s · gehen ging gegangen s · stehen stand gestanden h, s (south) [V], KII stände, stünde [V] |
| mixed | dünken dünkte / deuchte (dated) gedünkt h, KII dünkte · brennen brannte gebrannt h, KII brennte · bringen brachte gebracht h, KII brächte · denken dachte gedacht h, KII dächte · kennen kannte gekannt h, KII kennte · nennen nannte genannt h, KII nennte · rennen rannte gerannt s, KII rennte · senden, wenden (dual) |
| preterite-present | dürfen darf durfte gedurft h, KII dürfte · können kann konnte gekonnt h, KII könnte · mögen mag mochte gemocht h, KII möchte · müssen muss musste gemusst h, KII müsste · sollen soll sollte gesollt h, KII sollte · wollen will wollte gewollt h, KII wollte · wissen weiß wusste gewusst h, KII wüsste — modals have `noImperative` [V Duden Sprachwissen]; wissen has `wisse` [V] |
| irregular | sein (cells: bin bist ist sind seid sind; KI sei seiest/seist sei seien seiet seien; imperative sei, seid, seien), war, gewesen s [V] · haben (hast, hat), hatte, gehabt h, KII hätte, imperative hab / habe [V] · werden (wirst, wird), wurde / ward (dated), geworden s, KII würde, imperative werde [V] · tun (tun 1pl/3pl), tat, getan h, imperative tu / tue |

### 5.3 Side lists (`lexicon.ts`)

| List | Members | Verify at |
|---|---|---|
| Weak verbs with sein | reisen [V], wandern [V], begegnen, folgen, landen (s/h), klettern, stolpern, eilen, rasen, rutschen, platzen, passieren, explodieren, marschieren (s/h), segeln (s/h), joggen (s/h), tauchen (s/h), starten (s/h), stürzen (s/h), erwachen, verreisen, verwelken, erstarren, flüchten, kentern, wachsen-type `ist` verbs not in §5.2 | DWDS GL per lemma |
| Dual auxiliary with conditions | every `h/s` in §5.2; condition texts are the authority's sense labels (e.g. fahren: s 'movement', h 'drive a vehicle / transport') | DWDS GL, Duden "Perfektbildung mit …" |
| Regional sein (`region: 'south'`) | stehen, liegen, sitzen, hängen (strong) [V Duden] | Duden GL |
| Derivative auxiliary overrides | vertreten h, bekommen h, begehen h, gestehen h, verstehen h, entstehen s, erscheinen s, verschwinden s, entkommen s, umziehen (separable s/h [V], inseparable h [V]) | DWDS |
| Derivatives of short roots (gehen, tun, sein, stehen: root < 5 letters) | ausgehen, angehen, eingehen, umgehen*, vergehen, begehen, entgehen, abtun, antun, zutun, auftun, dastehen, aufstehen, verstehen, entstehen, bestehen, gestehen | DWDS |
| Dual-class lemmas | §3.5 (10, incl. backen) | DWDS homograph tables `#1/#2` [V] |
| Dual-prefix lemmas | §3.5 (20) plus anerkennen (separable; unseparated reading `pattern: 'inseparable'`, condition 'less common, especially Swiss') [V] | DWDS GL |
| Inseparable readings of dual particles | §3.4 | DWDS |
| Simplex lookalikes, no-inherit, denominal | §3.4 | DWDS (that the lemma is weak) |
| Non-initial stress (no ge-, no `-ieren`) | frohlocken, kredenzen, posaunen, prophezeien, kasteien, benedeien, rumoren, schmarotzen, trompeten, miauen, krakeelen, offenbaren (+ ge- variant `geoffenbart`, dated) | DWDS (participle) |
| Third person only | geschehen [V Duden table] | Duden konjugation |
| Impersonal (weather) | regnen, schneien, hageln, nieseln, donnern, blitzen | Duden "unpersönlich" |

All side-list members are [U] unless marked; Task 2 verifies each at the URL pattern in the last column and stores the URL.

## 6. Periphrases and clause

### 6.1 Chains (`periphrasis.ts`: `readonly Periphrasis<GermanLexeme>[]`, recipe order = output order after the subject)

| Target | Rule | Chain | `reports` |
|---|---|---|---|
| indicative.perfect | `de.periphrasis.perfect` | perfectAuxiliary indicative.present · main `pastParticiple` | perfect auxiliary (default) |
| indicative.pluperfect | `.pluperfect` | perfectAuxiliary indicative.past · main `pastParticiple` | perfect auxiliary |
| indicative.future | `.future` | {lemma: werden} indicative.present · main `infinitive` | werden (default: first named verb) |
| indicative.future_perfect | `.future-perfect` | werden indicative.present · main `pastParticiple` · perfectAuxiliary `infinitive` | perfect auxiliary |
| subjunctive.perfect | `.subjunctive-perfect` | perfectAuxiliary subjunctive.present · main `pastParticiple` | perfect auxiliary |
| subjunctive.pluperfect | `.subjunctive-pluperfect` | perfectAuxiliary subjunctive.past · main `pastParticiple` | perfect auxiliary |
| subjunctive.future | `.subjunctive-future` | werden subjunctive.present · main `infinitive` | werden |
| subjunctive.future_perfect | `.subjunctive-future-perfect` | werden subjunctive.present · main `pastParticiple` · perfectAuxiliary `infinitive` | perfect auxiliary |
| conditional.present | `.conditional` | werden subjunctive.past · main `infinitive` | werden |
| conditional.past | `.conditional-perfect` | werden subjunctive.past · main `pastParticiple` · perfectAuxiliary `infinitive` | perfect auxiliary |
| infinitive.perfect | `.infinitive-perfect` | main `pastParticiple` · perfectAuxiliary `infinitive` | perfect auxiliary |

No periphrasis needs `applies` (Plan 2 Task 3): every lexeme uses every chain. A verb with two auxiliaries (`fahren`) runs each chain once per `AuxiliaryUse`, in lexicon order; `clause.assemble` reads `context.auxiliary`, finds that use on the lexeme and tags the form with its `condition` and `region`. Non-finite form ids: `infinitive`, `presentParticiple`, `pastParticiple` (the core's `VerbForm` names).

### 6.2 Clause (`clause.ts`)

| Element | Rule |
|---|---|
| Agreement | none: `agreements` returns `one(null)` (German participles do not agree) |
| Order, finite target | subject pronoun (`context.subject.pronoun`; `es` for impersonal verbs in 3sg, step `de.clause.impersonal-es`) · finite verb · non-finite verbs in recipe order · separable particle. Step `de.clause.subject`. |
| Order, imperative | 2sg / 2pl: verb (· particle), no pronoun. 1pl / formal: verb · `wir` / `Sie` (· particle), step `de.clause.imperative-pronoun` |
| Separable particle | lexical verb finite → particle part (role `particle`) at the very end, step `de.clause.particle-final` (`ich schreibe ab`, `schreiben Sie ab`); lexical verb non-finite → prefixed to that word, step `de.clause.particle-attached` (`abgeschrieben`, `abschreiben`, `abschreibend`, `ich werde abschreiben`) — this is the shared helper `placeParticle` (§6.4) |
| Inseparable prefix | part of the synthesized word; the clause does nothing |
| Reflexives, negation, questions, subordinate order | out (§2.4) |
| Pronoun dropping, sandhi | none; `rendering.sandhi` returns null, `bareOmits` false; `onset` vowel/consonant by first letter (`ä ö ü` vowels) |
| Capitalisation | `Sie` is emitted capitalised as data; the infinitive input is lower-cased by the core |

### 6.3 Which auxiliary `variant.auxiliary` reports

Perfect-system targets report `haben` or `sein`; Futur I, Konjunktiv I Futur I and `conditional.present` report `werden` (the chain's first named verb). Simple targets report `null`.

### 6.4 Germanic helpers shared with Dutch (`src/languages/shared/germanic.ts`, created by the German plan; Dutch adopts them after Plan 2)

| Shared (same mechanism, data per language) | Signature (Plan 5 Task 2 / Task 4) |
|---|---|
| Derivative resolver: closed particle and prefix lists, plausibility predicate, longest match, particle-then-prefix stacking, no-inherit and lookalike lists, lexicon root lookup | `splitDerivative(lemma, tables): readonly DerivativeSplit[]` with `DerivativeSplit = { particle: string \| null; prefix: string \| null; root: string }` |
| Separable-particle placement in a verb-second main clause | `placeParticle(words: readonly ChainWord[], particle: LexemeBase['particle']): { words: ChainWord[]; final: string \| null }` |
| Several paradigms per lemma (dual class, dual prefix) as tagged outcomes | `paradigmFork<X>(choices: readonly { pattern: string; condition: string; lexeme: X; steps: readonly DerivationStep[] }[]): Fork<X>` |

| Only looks alike — keep per language | Why |
|---|---|
| ge- in Partizip II | German blocks it by stress (`-ieren`, listed non-initial stress) and by inseparable prefixes; Dutch only by prefixes and adds the diaeresis `geë-`. The "circumfix skeleton" of the approved design reduces to ge- + core in the word plus `placeParticle` attaching the particle, so nothing beyond `placeParticle` is shared. |
| Weak dental suffix | German `-te`/`-t` with schwa after dental and obstruent + nasal; Dutch selects `-de`/`-te` by 't kofschip on the underlying stem. |
| Stem spelling | German keeps the stem (no open/closed-syllable respelling, no final devoicing in writing); Dutch respells (`lopen → loop`, `leven → leef`). |
| Principal parts | German: present2, preterite, Partizip II, Konjunktiv II; Dutch: past singular, past plural, participle. |
| Imperative | German has du / wir / ihr / Sie with an i-stem rule; Dutch has one stem form. |

## 7. Worked derivations

Each line is one step as `explain` would print it in English (rule id in brackets). Analysis steps come first, then word steps, then form steps.

1. **du arbeitest** — arbeiten is not in the lexicon: assuming a weak verb [`de.classify.default-weak`]; assuming haben [`default-haben`]; assuming first-syllable stress [`default-stress`]. Drop the infinitive ending: arbeit- [`de.stem.present`]. Präsens, 2nd person singular: add -st → arbeitst [`de.end.present`]. After t an e is inserted: arbeitst → arbeitest [`de.orth.schwa-dental`]. Subject first: du arbeitest [`de.clause.subject`].
2. **er fährt** — fahren is listed as a strong verb [`de.classify.lexicon`]. fahr- [`de.stem.present`]; du/er forms change the vowel: fahr- → fähr- [`de.stem.present2`]; add -t → fährt [`de.end.present`]; er fährt [`de.clause.subject`].
3. **wir fuhren** — strong [`lexicon`]; Präteritum stem fuhr- [`de.stem.preterite`]; strong Präteritum, add -en → fuhren [`de.end.preterite-strong`].
4. **ich führe** (Konjunktiv II) — fuhr- [`de.stem.preterite`]; Präteritum stem with Umlaut: fuhr- → führ- [`de.stem.subjunctive-umlaut`]; add -e → führe [`de.end.subjunctive-ii`].
5. **du kämst** — käm- as in 4; add -est → kämest [`de.end.subjunctive-ii`]; second form: the e is often dropped → kämst, `pattern: 'short'` [`de.end.subjunctive-ii-short`].
6. **du reist** — weak assumptions; reis- [`de.stem.present`]; add -st → reisst [`de.end.present`]; after s the ending -st becomes -t → reist [`de.orth.sibilant-2sg`].
7. **ich sammele / ich sammle** — weak assumptions; drop -n: sammel- [`de.stem.present`]; add -e → sammele [`de.end.present`]; second form: the e of -el is dropped → sammle, `pattern: 'short'` [`de.orth.el-elision`].
8. **er hält** — halten strong [`lexicon`]; hält- [`de.stem.present2`]; add -t → hältt [`de.end.present`]; no extra -t after the changed stem → hält [`de.orth.t-merge`]. (No e-insertion: `de.orth.schwa-dental` does not apply to a present2 stem.)
9. **wir schrien** — schreien strong [`lexicon`]; schrie- [`de.stem.preterite`]; add -en → schrieen [`de.end.preterite-strong`]; after -ie the e of the ending is dropped → schrien [`de.orth.ie-contraction`].
10. **studiert** (Partizip II) — -ieren verbs are stressed on -ier- [`de.classify.ieren`]; studier- [`de.stem.present`]; no ge-: the first syllable is not stressed [`de.stem.ge-blocked-stress`]; add -t → studiert [`de.end.participle-weak`].
11. **ich schreibe ab** — abschreiben is ab + schreiben and takes its forms [`de.classify.derivative`]; ab- is a separable particle [`de.classify.separable`]; schreib- [`de.stem.present`]; add -e [`de.end.present`]; subject first [`de.clause.subject`]; the particle ab goes to the end [`de.clause.particle-final`].
12. **abgeschrieben** — as 11 for the analysis; Partizip II stem schrieb- [`de.stem.participle`]; ge- because the first syllable is stressed → geschrieb- [`de.stem.ge-prefix`]; add -en → geschrieben [`de.end.participle-strong`]; the particle is written together with it → abgeschrieben [`de.clause.particle-attached`].
13. **ich bin gefahren** — Perfekt: the Präsens of sein plus Partizip II [`de.periphrasis.perfect`, auxiliary sein]; sein is irregular, the whole form is bin [`de.stem.lexical-cell`]; gefahren as in 12 (fahr-, ge-, -en); subject first. The form carries `condition` 'movement'; the second form `ich habe gefahren` carries 'drive a vehicle / transport'.
14. **ich würde fahren** — würde-Form: the Konjunktiv II of werden plus the infinitive [`de.periphrasis.conditional`]; werden's Konjunktiv II stem is würd- [`de.stem.subjunctive-lexical`]; add -e → würde [`de.end.subjunctive-ii`]; fahr- + -en → fahren [`de.end.infinitive`].
15. **er sei gekommen** — Konjunktiv I Perfekt: the Konjunktiv I of sein plus Partizip II [`de.periphrasis.subjunctive-perfect`]; sei [`de.stem.lexical-cell`]; komm- → gekomm- → gekommen.
16. **gib!** — geben strong [`lexicon`]; e→i verbs use gib- in the du-imperative without -e [`de.stem.imperative-i`]; ending none [`de.end.imperative-singular`].
17. **ich schlinke auf / aufgeschlinkt** (invented) — assuming auf- is separable [`de.classify.assume-separable`, particle auf]; assuming weak, haben, first-syllable stress [`default-weak`, `default-haben`, `default-stress`]; schlink- + -e; particle at the end [`de.clause.particle-final`]. Partizip II: ge- → geschlink-, -t → geschlinkt, particle attached → aufgeschlinkt.
18. **ich verschlief** — verschlafen is ver + schlafen [`de.classify.derivative`]; ver- is inseparable [`de.classify.inseparable`]; assuming the auxiliary of schlafen [`de.classify.assume-root-auxiliary`]; Präteritum stem verschlief- [`de.stem.preterite`]; no ending [`de.end.preterite-strong`].
19. **seien Sie!** (`subject: '2.formal'`) — sein's Sie-imperative is the whole form seien [`de.stem.lexical-cell`]; the pronoun Sie follows the verb [`de.clause.imperative-pronoun`].

## 8. Test data

### 8.1 Invented verbs (one per rule; forms follow mechanically from the [V] rules in §4)

Subjects are the default slots. "imp" lists du-imperatives in output order.

| Verb | Exercises | Expected |
|---|---|---|
| schlinken | default-weak, default-haben, default-stress; looks like trinken | ich schlinke, du schlinkst, er schlinkt; ich schlinkte, ihr schlinktet; KI du schlinkest; KII ich schlinkte; ich habe geschlinkt; imp schlink / schlinke; schlinkend. Analysis assumptions exactly `[default-weak, default-haben, default-stress]` |
| schlinken + `classHint: 'strong'`, `stems: { preterite: 'schlank', participle: 'geschlunken' }` | hints | ich schlank, wir schlanken, du schlankst; KII ich schlänke, du schlänkest / schlänkst; ich habe geschlunken; `classificationSource: 'explicitHint'`; no `default-weak` |
| schlinken + `auxiliary: 'sein'` | auxiliary hint | ich bin geschlinkt; no `default-haben` |
| fralten | schwa-dental | du fraltest, er fraltet, ihr fraltet; ich fraltete, du fraltetest; gefraltet; imp fralte (only); KI du fraltest |
| blagnen | schwa-nasal | du blagnest, er blagnet; ich blagnete; geblagnet; imp blagne (only) |
| plaxen | sibilant `x` | du plaxt, er plaxt; du plaxtest; geplaxt; imp plax / plaxe |
| trissen | sibilant `ss` | du trisst, er trisst, ihr trisst; ich trisste; getrisst; imp triss / trisse |
| wumpeln | el-er-schwa, el-elision | ich wumpele / wumple, du wumpelst, wir wumpeln, ihr wumpelt; ich wumpelte; gewumpelt; wumpelnd; KI ich wumpele / wumple, du wumpelst / wumplest; imp wumpele / wumple |
| flompieren | `-ieren` | er flompiert; ich flompierte; ich habe flompiert; assumptions `[default-weak, default-haben]` (no `default-stress`) |
| verschlinken | inseparable prefix on an unknown root | ich verschlinke; ich verschlinkte; ich habe verschlinkt; steps include `de.classify.inseparable` (prefix ver) |
| aufschlinken | assume-separable | ich schlinke auf; ich schlinkte auf; ich habe aufgeschlinkt; ich werde aufschlinken; ich würde aufschlinken; imp schlink auf / schlinke auf; schlinken wir auf; schlinkt auf; (`2.formal`) schlinken Sie auf; aufschlinkend; aufgeschlinkt haben |
| umschlinken | dual particle, default and hint | default: ich schlinke um, umgeschlinkt, `assume-separable` (particle um); with `inseparablePrefix: 'um'`: ich umschlinke, ich habe umschlinkt, no ge- |
| beschlinken + `separablePrefix: 'be'` | invalid hint | INVALID_HINT (be- is never separable) |

### 8.2 Real verbs outside the oracle, and lemma facts the corrections rest on

All [V] at DWDS (`https://www.dwds.de/lemma/flexion/<lemma>`) and, where noted, Duden (`https://www.duden.de/konjugation/<slug>`).

| Verb | Expected | Status / note |
|---|---|---|
| machen | du machst, er macht; ich machte; ich habe gemacht; imp mach / mache | [V] DWDS, Duden |
| arbeiten | du arbeitest, er arbeitet; ich arbeitete; gearbeitet; imp arbeite (only) | [V] DWDS (`arbeit` ugs.), Duden |
| atmen | du atmest, er atmet; ich atmete; geatmet; imp atme | [V] |
| reisen | du reist, er reist; ich reiste; ich bin gereist; imp reis / reise | [V] DWDS GL "ist gereist" |
| sammeln | ich sammele / sammle; KI du sammelst / sammlest, ihr sammelt / sammlet; ich sammelte; gesammelt; imp sammele / sammle | [V] DWDS (Duden table lacks *sammlest*) |
| wandern | ich wandere / wandre; KI du wanderst; ich bin gewandert; imp wandere / wandre | [V] DWDS |
| ändern | ich ändere / ändre; KI du änderst | [V] DWDS |
| lächeln | ich lächele / lächle | [V] |
| studieren | du studierst; ich studierte; ich habe studiert; imp studier / studiere | [V] |
| anerkennen | `separable`: ich erkenne an, ich erkannte an, ich habe anerkannt, KII ich erkennte an, imp erkenn an / erkenne an; `inseparable` (condition 'less common, especially Swiss'): ich anerkenne, ich anerkannte | [V] DWDS (two sets), Duden ("seltener", "besonders schweizerisch") |
| verschlafen | du verschläfst, er verschläft; ich verschlief; KII ich verschliefe; ich habe verschlafen; imp verschlaf / verschlafe | [V] DWDS; no Duden entry |
| herumfahren | du fährst herum; ich fuhr herum; KII ich führe herum; ich bin herumgefahren and ich habe herumgefahren | [V] DWDS, Duden |
| rechnen, öffnen | du rechnest, er rechnet, imp rechne; du öffnest, imp öffne | [V] |
| mixen, küssen | du mixt; du küsst, imp küss / küsse | [V] |
| regnen | es regnet, es regnete, es hat geregnet; ich/du/wir/ihr/sie targets unavailable (`impersonal`); no imperative | [V] Duden table (3rd person, "unpersönlich"); DWDS has a full table — conflict noted in `sources.ts` |
| kommen | KII du kämest / kämst, ihr kämet / kämt | [V] Duden table; DWDS only *kämest* |
| gehen | KII du gingest (no short form: stem not umlauted) | [V] DWDS, Duden |
| sein | KI du seiest / seist, ihr seiet; KII du wärest / wärst, ihr wäret / wärt; imp sei, seid, seien wir, seien Sie | [V] DWDS, Duden; *seien Sie* in Duden examples |
| haben | imp hab / habe | [V] |
| backen | er backt and er bäckt; ich backte and ich buk (dated); KII ich backte and ich büke (dated) | [V] DWDS two sets; Duden "veraltend: buk" |
| schreien | Präteritum du schriest, wir schrien; KII ich schrie, du schriest, wir schrien; geschrien | [V] DWDS, Duden; R §19 |
| gelingen | full paradigm: ich gelinge; imp geling / gelinge | [V] DWDS table, Duden Bsp "geling[e]!" |
| geschehen | 3rd person only; no imperative | [V] Duden table; DWDS conflicts (full table, *geschieh*) |
| finden / halten / bitten / tun | Präteritum du fandst / fandest, du hieltst / hieltest, du batst / batest, du tatst / tatest; imp finde, halte, bitte (only); tu / tue | [V] DWDS (bare `d/t` imperative ugs.), Duden Bsp |
| lesen / essen / sitzen | Präteritum du lasest / last, du aßest / aßt, du saßest / saßt | [V] DWDS |
| helfen, gewinnen, stehlen | KII hälfe / hülfe; gewänne / gewönne (dated); stähle / stöhle | [V] DWDS (+ Duden for *stöhle*) |
| können | ich würde können; ich würde gekonnt haben; imperative unavailable | [V] SG-312 (würde + Modalverb); Duden Sprachwissen (no imperative) |
| beantragen, bedingen, beugen, überzeugen, wagen, heissen | ich beantragte, beantragt; bedingte, bedingt; ich beuge, gebeugt; ich überzeuge, überzeugt; ich wagte, gewagt (not *wog*); heissen → heißen paradigm with `de.classify.transliteration` | [U] verify the first four at DWDS in Task 7 |

### 8.3 Second oracle / authority cells

Not applicable to German (the approved design reserves them for Italian and Latin).

## 9. Oracle

Directory `Deutsch`, 139 files, UTF-8 (decode with `fatal: true`), file names NFC, pinned revision `3a9a01de…` (checked: clean). Every file was parsed for this design; the counts below come from that run.

### 9.1 Page structure

- `div#ctl00_ch_divSimple` holds 11 and `div#ctl00_ch_divComplex` 8 data blocks: every file has exactly 19 `<font face="Arial" size="2">` elements, always in the same order (positional identity; the headings are read only to assert it).
- A block's text is split into rows at `<br>`. Blocks with a tense heading start with `<u><i>Heading</i></u><br>`; that first row is the heading, not data.
- Inside a row, each `<i>` is a segment. `color:maroon` marks the pronoun in finite blocks; in the imperative block maroon also marks the pronoun *wir* / *Sie* and, in the ihr-row, the ending (`back` + `t`). The row text is the concatenation of all segments with whitespace collapsed (`ge` + `backen ` + `haben` → `gebacken haben`).
- `font-style:normal` / `ormal` / `rmal` / `mal` mark row 1–4 of a group. They agree with the label grouping in all 139 files (1,521 continuation rows, no conflict) but are corrupted strings, so the parser groups by label and uses the marker only as a test cross-check.
- An empty row (`<br>` directly after `<br>`) is a placeholder for a missing form: 96 in total (geschehen 18, the six modals 78).
- 119 files offer a "Variant1 / Variant2" selector; those are exactly the files with a cell of more than one row (1,443 such cells). The page shows both variants interleaved; which row belongs to which variant is not marked, so rows are assigned by content: every row is an expected form of its cell, and the engine's paradigms (pattern-tagged) must produce each.

### 9.2 The 19 blocks, cells and remaps

| # | h3 / u heading | Cells | Catalogue target | Remap |
|---|---|---|---|---|
| 0 | Infinitiv Präsens | 1 | infinitive.present | |
| 1 | Partizip / Präsens | 1 | participle.present | |
| 2 | Partizip / Perfekt | 1 | participle.past | |
| 3 | Indikativ / Präsens | 6 | indicative.present | |
| 4 | Indikativ / Präteritum | 6 | indicative.past | |
| 5 | Indikativ / Futur I | 6 | indicative.future | |
| 6 | Imperativ | 4 | imperative.present: 2sg, 1pl, 2pl, `2.formal` | |
| 7 | Konjunktiv I / Präsens | 6 | subjunctive.present | |
| 8 | Konjunktiv I / Futur I | 6 | subjunctive.future | |
| 9 | Konjunktiv II / Präsens | 6 | subjunctive.past | R1: the simple Konjunktiv II is built on the Präteritum stem; grammis calls it Konjunktiv Präteritum [SG-439] |
| 10 | Konjunktiv II / Futur I | 6 | conditional.present | R2: würde + Infinitiv is the würde-form [SG-312] |
| 11 | Infinitiv Perfekt | 1 | infinitive.perfect | |
| 12 | Indikativ / Perfekt | 6 | indicative.perfect | |
| 13 | Indikativ / Plusquamperfekt | 6 | indicative.pluperfect | |
| 14 | Indikativ / Futur II | 6 | indicative.future_perfect | |
| 15 | Konjunktiv I / Präteritum | 6 | subjunctive.perfect | R3: *habe gebacken* is Konjunktiv I Perfekt [SG-439] [SG-232] |
| 16 | Konjunktiv I / Futur II | 6 | subjunctive.future_perfect | |
| 17 | Konjunktiv II / Präteritum | 6 | subjunctive.pluperfect | R4: *hätte gebacken* is Konjunktiv II Plusquamperfekt [SG-439] |
| 18 | Konjunktiv II / Futur II | 6 | conditional.past | R5: würde + Infinitiv Perfekt [SG-312] |

92 cells per file, 12,788 cells. Remaps are template-level (`german.remaps`, `occurrence: 0` = first occurrence, as in the other packs, `heading` = `"<h3>/<u>"` exactly as printed, e.g. `"Konjunktiv II/Präsens"`): 5 remaps covering 5 × 6 × 139 = 4,170 cells; each remapped cell carries `heading`. The source URL of R1/R3/R4 is SG-439, of R2/R5 SG-312.

### 9.3 Parsing rules (exact)

1. Finite blocks: drop the heading row; walk the rows; a row whose label (trimmed maroon text) equals the previous row's label continues that group, any other non-empty row opens a group, an empty row opens an empty group. Exactly 6 groups are required, and a labelled group's label must be `ich, du, er/sie/es, wir, ihr, sie/Sie` at its position (else throw `<file>: <heading>: …`).
2. Each row's text must start with its label + space; the label is replaced by the default slot's pronoun (`er/sie/es` → `er`, `sie/Sie` → `sie`), so expected texts are `er backt`, `sie backen`. Never pass these texts through `alternatives()` (it splits on `/`); the parser sets `expected` to the group's row texts.
3. Imperative block (no heading): a row is `1pl` if it has a maroon segment `wir`, `2.formal` if it has a maroon segment `Sie`; rows before the first `wir` row are `2sg`, rows between the last `wir` row and the first `Sie` row are `2pl`; any other row throws. Texts keep the pronoun (`backen wir`, `ziehen Sie um`); empty rows are placeholders of their slot.
4. Non-finite blocks: every non-empty row is an alternate of the one cell.
5. Cell fields: `target` per §9.2 (`person`/`number` from the slot; `2.formal` is person 3 plural), `subject` = slot id (`1sg … 3pl`, `2.formal`) on finite cells, `original` = the rows joined with ` | ` (`-` for an empty group), `expected` = the rows, `sourceUnavailable` = no rows, `availabilityMarker: 'dash'` for an empty group, `heading` on remapped cells. `templatePlaceholders` = 0 (empty rows are cells, not extra slots).

### 9.4 Queries and applicability

| Label | Options | Answers |
|---|---|---|
| `default` | `{ language: 'de', infinitive }` | every cell whose `subject` is not `2.formal` |
| `formal` | `{ language: 'de', infinitive, mood: 'imperative', subject: '2.formal' }` | the imperative `2.formal` cell |

Unmodelled cells: none (`unmodelled: {}`; count 0).

### 9.5 Source errors (corrections ledger, `scripts/corpus/corrections/de.ts`)

| # | Error (rule in the ledger) | Files | Cells | Correct form | Authority URL |
|---|---|---|---|---|---|
| C1 | Pre-1996 `ß` after a short vowel shown as an alternate (`muß`, `ißt`, `gewußt`, `iß`, `laß`, `müßte`): drop the alternate whose ß → ss form (any subset of its ß) is also in the cell | beißen 4, essen 5, fließen 4, genießen 4, gießen 4, lassen 5, messen 5, müssen 55, reißen 4, schießen 4, schließen 4, verdrießen 4, vergessen 5, wissen 58 | 165 | the ss form already in the cell | https://www.rechtschreibrat.com/DOX/RfdR_Amtliches-Regelwerk_2024.pdf (§2, §25 E1) |
| C2 | `ihr bewegte` in indicative.past and subjunctive.past | bewegen | 2 | ihr bewegtet | https://www.dwds.de/lemma/flexion/bewegen |
| C3 | Konjunktiv I 3pl without -n (`sie beginne`) | beginnen, gerinnen, gewinnen | 3 | sie beginnen / gerinnen / gewinnen | https://grammis.ids-mannheim.de/systematische-grammatik/439 |
| C4 | Konjunktiv I 1pl with the Präteritum stem (`wir schworen`) | schwören | 1 | wir schwören | https://grammis.ids-mannheim.de/systematische-grammatik/439 |
| C5 | `sein wir`, `sein Sie` | sein | 2 | seien wir, seien Sie | https://grammis.ids-mannheim.de/systematische-grammatik/290 |
| C6 | Imperative of modal verbs (wir / ihr / Sie rows filled) | dürfen, können, mögen, müssen, sollen, wollen | 18 | unavailable | https://www.duden.de/sprachwissen/sprachratgeber/modalverben |
| C7 | 1st/2nd-person forms of geschehen in the compound tenses and its wir/Sie imperative | geschehen | 42 | unavailable | https://www.duden.de/konjugation/geschehen |
| C8 | Weak (transitive) erschrecken built with sein (`ich bin erschreckt`) in the 7 compound tenses | erschrecken | 43 | ich habe erschreckt, erschreckt haben (strong rows keep sein) | https://www.dwds.de/wb/erschrecken |
| C9 | Weak wachsen ('wax') built with sein (`ich bin gewachst`) | wachsen | 43 | ich habe gewachst (strong rows keep sein) | https://www.dwds.de/wb/wachsen |
| C10 | Konjunktiv II `schriee, schrieest, schrieen, schrieet` | schreien | 6 | schrie, schriest, schrie, schrien, schriet, schrien | https://www.dwds.de/lemma/flexion/schreien (and R §19) |
| C11 | würde-forms of modal verbs left empty | the six modals | 72 | ich würde können; ich würde gekonnt haben … | https://grammis.ids-mannheim.de/systematische-grammatik/312 |
| C12 | Colloquial bare du-imperative of a d/t-stem verb (`find`, `halt`) | bieten, binden, bitten, empfinden, finden, gleiten, halten, leiden, meiden, raten, reiten, scheiden, schneiden, schreiten, schwinden [U: not checked, same pattern], streiten | 16 | finde, halte … (the -e form already in the cell) | https://www.duden.de/sprachwissen/sprachratgeber/Bildung-des-Imperativs |

12 rules, **412 corrected cells** (müssen's ihr-imperative falls under C1 and C6 and is one ledger record). The approved design's candidates `gelingen` personal forms and `schleifen` auxiliary are **not** errors (§12).

### 9.6 Expected totals (pin these in `tests/corpus.test.ts`)

| Quantity | Value |
|---|---|
| files / infinitives | 139 / 139 |
| cells per file / cells | 92 / 12,788 |
| template placeholders | 0 |
| source-unavailable cells (empty groups) | 96 |
| corrected cells (ledger records) | 412 |
| unavailable after corrections | 84 (geschehen 18 + 42 = 60; modals 6 + 18 = 24) |
| available after corrections | 12,704 |
| expected forms after corrections | 14,035 (raw 14,213) |
| remaps / remapped cells | 5 / 4,170 |
| unmodelled cells | 0 |

Note: unavailable after corrections = 96 empty − 72 modal würde-cells made available + 18 modal imperatives + 42 geschehen cells = 84.

## 10. Tense concepts (for `src/equivalence/de.ts`, concept ids from the architecture note N7)

| Tense | Concept links (weight) | Note |
|---|---|---|
| indicative.present | PRESENT 1; FUTURE 0.5 | German uses the Präsens for future reference with a time adverb |
| indicative.past | PAST_IMPERFECTIVE 1; PAST_PERFECTIVE 0.8 | written narrative past; covers both aspects |
| indicative.perfect | PRESENT_PERFECT 1; PAST_PERFECTIVE 0.9 | the usual spoken past |
| indicative.pluperfect | PLUPERFECT 1 | |
| indicative.future | FUTURE 1 | also supposition (*er wird krank sein*) |
| indicative.future_perfect | FUTURE_PERFECT 1 | |
| subjunctive.present | SUBJ_PRESENT 1 | reported speech (Konjunktiv I) |
| subjunctive.perfect | SUBJ_PERFECT 1 | |
| subjunctive.future | SUBJ_FUTURE 1 | reported speech only |
| subjunctive.future_perfect | SUBJ_FUTURE_PERFECT 1 | |
| subjunctive.past | SUBJ_IMPERFECT 1; COND_PRESENT 0.9 | Konjunktiv II: unreal present; replaces Konj. I where that equals the indicative |
| subjunctive.pluperfect | SUBJ_PLUPERFECT 1; COND_PERFECT 0.9 | unreal past (*hätte gemacht*) |
| conditional.present | COND_PRESENT 1 | würde-form; the usual spoken unreal present |
| conditional.past | COND_PERFECT 0.6 | rare; *hätte … gemacht* is preferred |
| imperative.present | IMP_PRESENT 1 | |
| infinitive.present / .perfect | INF_PRESENT 1 / INF_PERFECT 1 | |
| participle.present / .past | PART_PRESENT 1 / PART_PAST 1 | |

## 11. Open questions and risks

| # | Question / risk | Proposed handling |
|---|---|---|
| 1 | DWDS and Duden disagree on primacy of some doublets (gewinnen, schwimmen, empfehlen KII; *verdürbe* vs *verdärbe*) and on person restrictions (geschehen, regnen). | DWDS decides forms and marks; Duden-only forms are kept when the oracle or Duden needs them, flagged; every conflict is a comment in `sources.ts`. |
| 2 | Colloquial forms (DWDS `ugs.`: *halt!*, *find!*, *ich sammel*) are not emitted, so the trainer would reject a typed *Halt!*. | Needs a core `usage: 'colloquial'` value to emit them labelled; out of this plan's file scope — raise when the trainer moves to German. |
| 3 | The würde-form of modals is generated (SG-312 includes "Modalverb"; Duden calls it "seltener") although the oracle leaves it empty (C11, 72 cells). | Kept as standard; a learner-facing app may rank it after *könnte* via the equivalence notes. |
| 4 | Unknown verbs with a dual particle are assumed separable; many real *über-/unter-* verbs are inseparable. | Lexical inseparable list (§3.4) covers the common ones; assumption step recorded; `inseparablePrefix` overrides. Extend the list from the trainer's verb list. |
| 5 | Plausibility of particle splits cannot catch every simplex lookalike (`abonnieren`, `hindern`, `dauern`). | Lookalike list + assumption step; Review Focus item 3. |
| 6 | Derivative auxiliaries are guessed from the root (`de.classify.assume-root-auxiliary`). | Recorded as an assumption; override list for oracle and common verbs. |
| 7 | Rule-level archaic variants (*du reisest*, *ihr aßet*, *hübe*) are not emitted although DWDS prints them `(va.)`. | Deliberate: only listed alternates carry `usage: 'dated'`. |
| 8 | `sein` also forms the Sie-request with the indicative (*Sind Sie so nett!*, SG-290). | Not emitted; only *seien Sie*. |
| 9 | The imperative's `[3, plural]` exists only for `Sie`. | Resolved by `CatalogueEntry.slots` (Plan 2 Task 1); `{ mood: 'imperative', person: 3 }` without `subject` is INVALID_TARGET (tested). |
| 10 | Corpus cells need an explicit `expected` list (German texts contain `/` in labels and alternates are rows, not `;`-separated). | If Plan 2's `corpusCell(fields)` has no `expected` field, Task 5 adds an optional one (one shared line, listed in the plan). |

## 12. Deviations from the approved design

| Approved design says | This design | Why |
|---|---|---|
| Rules "about 35" | 69 rule ids | the count includes 11 periphrasis, 14 classification (with every assumption a separate id, as the brief requires) and 5 clause rules; the morphological core is ≈ 36 |
| Lexicon "about 185–200 roots" | 184 roots + side lists (≈ 150 more lemmas) | the closed strong/mixed inventory is about 170 (G-4074) plus mixed, modal and irregular verbs; derivatives are resolved, not listed |
| Remaps: Konj. I "Präteritum", Konj. II "Präteritum", Konj. II "Futur I / II" (4) | 5 remaps | the simple Konjunktiv II is headed "Präsens" in every file and must map to `subjunctive.past` (R1) |
| Correction: "personal forms of geschehen and gelingen" | geschehen only | no authority restricts gelingen: DWDS prints a full table, Duden gives *geling[e]!* (§8.2) |
| Correction: "wrong auxiliary for erschrecken / schleifen / wachsen" | erschrecken and wachsen only | *ist geschliffen* / *ist geschleift* are in Duden and DWDS (§3.5) |
| Correction: `schriee` | all six Konjunktiv II cells of schreien | DWDS and Duden print *schrie, schriest, schrien* (and R §19) |
| "About 12 correction rules covering roughly 500 cells" | 12 rules, 412 cells | adds C11 (modal würde-forms, 72) and C12 (colloquial d/t imperatives, 16), drops gelingen and schleifen |
| "obligatory imperative -e" as a print-only claim | online: Duden Sprachwissen and grammis SG-1275 (they disagree on d/t) | resolved per lemma with DWDS marks |
| "zu placement" print-only | not needed | no zu-infinitive in the catalogue |
| Shared "ge- circumfix skeleton" | not shared beyond `placeParticle` | ge- blocking differs (stress in German, `geë-` in Dutch); §6.4 |
| Dual-class list of 9 | 10 (+ backen) | DWDS prints two unlabeled sets (bäckt/buk and backt/backte) that the oracle interleaves |
| Authority split "Duden online and DWDS per lemma" | DWDS decides, Duden cross-checks | DWDS tables label variants explicitly (`va.`, `ugs.`); Duden orders doublets alphabetically |
