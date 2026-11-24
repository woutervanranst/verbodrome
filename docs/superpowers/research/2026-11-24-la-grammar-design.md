# Latin (la) grammar design

Design for the Latin language pack of the seven-language engine (`packages/conjugation-engine`). It is written against the core contract as it stands after Plan 2 Part A (subject slots via `LanguagePack.subjects` / `subjectsFor` / `genderedTargets` / `CatalogueEntry.slots`; `classify` → `Fork` of paradigms with `analysis.alternatives`; `cellOf(target, lexeme)`; `Periphrasis<X>` with `applies` and `reports`; `ClauseContext.subject` and `agreeing`; part features `voice` / `case`; `Case` with `vocative`; reason `noPassive`; `VerbForm` with `gerund`, `gerundive`, `supine`, `futureParticiple`; `agreement` fields with `genders` and `cases`). The approved design's "Latin (la)" section is the agreed scope; deviations are in §12. The implementation plan is `docs/superpowers/plans/2026-11-24-seven-language-engine-08-la.md`; implementers also read `packages/conjugation-engine/docs/pack-authoring.md`.

Status marks: **[V]** page opened and read during this design pass (2026-11-24); **[S]** confirmed only from a search-result snippet or inferred from a verified neighbour (page numbers); **[U]** stated from memory, to be checked before it enters code.

Decisions in one paragraph: classical Latin as Allen & Greenough (A&G) and Bennett print it; output carries macrons, input and answer comparison do not need them; voice is a target dimension; deponents are active targets built from passive morphology and report `noPassive`; the perfect system of deponents, semi-deponents and *fīō* is participle + *esse* through `cellOf` → `null` + `Periphrasis.applies`; an unfiltered query has one ungendered subject per person and returns the three genders only where a participle agrees (compound forms), as `target.agreement`; non-finite forms default to one citation form and decline fully when the query carries `agreement`; contracted perfects (*amāsse*) and the periphrastic conjugations are out; the scraped oracle is compared macron-insensitively (form ledger only) and macron-sensitively (plus a macron ledger); two extra evidence tiers: authority cells transcribed from the 1903 A&G print and Bennett, and 63 pinned en.wiktionary tables.

---

## 1. Sources

### 1.1 Works (`latinWorks`)

| id | Role | Title | URL | Status |
|---|---|---|---|---|
| `ag` | rule grammar (primary) | J. H. Allen & J. B. Greenough, *New Latin Grammar* (1903), ed. M. Ayer, Dickinson College Commentaries 2014 | https://dcc.dickinson.edu/grammar/latin/index | [V] all verb chapters §§153–212 read as text |
| `ag-print` | exact paradigm forms | Page scans of the 1903 print on DCC, file `AGnnn.jpg` = print page nnn − 12 | https://dcc.dickinson.edu/sites/default/files/AG104.jpg | [V] pp. 92–94, 98, 104, 109, 110, 114, 115 viewed; other pages [S] by the offset |
| `bennett` | paradigm text | C. E. Bennett, *New Latin Grammar* (1908/1918), Project Gutenberg #15665, anchors `#sectNNN` | https://www.gutenberg.org/files/15665/15665-h/15665-h.htm | [V] read through the mirror https://gutenberg.pglaf.org/1/5/6/6/15665/15665-h/15665-h.htm (gutenberg.org answered 503 "maintenance" on 2026-11-24) |
| `ls` | lexical authority | C. T. Lewis & C. Short, *A Latin Dictionary* (1879), via Logeion | https://logeion.uchicago.edu/sequor | [V] entries *sequor*, *largior*, *tego*, *amo* read through Logeion's JSON endpoint; Perseus answers 403 (open by hand) |
| `wiktionary` | second oracle (data only, never cited for a rule) | English Wiktionary, `{{la-conj}}` rendered by `Module:la-verb` | https://en.wiktionary.org/ | [V] 65 pages fetched at pinned revisions and parsed; licence CC BY-SA 4.0 (siteinfo `rightsinfo`) |

Caveats found while reading:

- The DCC *re-typeset* paradigm images contain errors (e.g. `mīrāntor`, `mīrāns, -āntis`, a present active imperative plural printed `-re`, missing macrons in `mirēris`). Exact forms are taken only from the 1903 page scans (`ag-print`), never from the re-typeset images.
- Bennett's Gutenberg text has transcription errors (§113 `vererī`, `largiris`, `sectūtus`, `mīramur`, `mirātus`, `largitūrus`; §101 `amāvīssēmus`; §102 `amāti`; §115 `amendus`, `amantus`; §131 `fīerī`). An authority cell admits a Bennett form only when it passes the quantity lint of §4.4 or agrees with the A&G print (§8.3).
- L&S does not mark hidden quantities nor the final vowel of the perfect (`tĕgo, xi, ctum`; `ămo, āvi, ātum`); A&G §10 says "all vowels known to be long are marked". Principal parts therefore come from A&G §§172–173, 191–192, 209–212 first and from L&S only for verbs A&G does not list.
- Authorities disagree on the perfect subjunctive: A&G §169.d and the p. 93 paradigm print `amāveris, amāverimus, amāveritis`; Bennett §101 prints `amāverīs, amāverīmus, amāverītis` (as does Wiktionary). Decision in §4.3.

### 1.2 Pages per rule area (all `ag` URLs are `https://dcc.dickinson.edu/grammar/latin/<slug>`)

| Area | Locator | URL slug / anchor | Status | What it states |
|---|---|---|---|---|
| Voice, moods, six tenses, four participles, gerund only oblique, supine acc./abl. | A&G §§153–155 | `verb-conjugations` | [V] | Indicative six tenses, subjunctive four, imperative present+future, infinitive three; participles: present, future (active), perfect, gerundive (passive) |
| Deponents and semi-deponents defined | A&G §156.b–c | `verb-conjugations` | [V] | *hortor, sequor*; *audeō, audēre, ausus sum* |
| Participle uses | A&G §158 | `forms-participle` | [V] | -ns; -ūrus; -tus/-sus with *esse* forms passive tenses; gerundive -ndus |
| Gerund nominative supplied by the infinitive; supine | A&G §159 | `gerund-and-supine` | [V] | "The Gerund is found only in the oblique cases. A corresponding nominative is supplied by the Infinitive." |
| Perfect definite / historical | A&G §161 | `tenses` | [V] | perfect = *I have written* and *I wrote* |
| Personal endings, perfect endings, imperative endings | A&G §163 (tables); print p. 89 | `personal-endings` | [V] table images | -ō/-m -s -t -mus -tis -nt; -r -ris (-re) -tur -mur -minī -ntur; -ī -istī -it -imus -istis -ērunt/-ēre; -tō -tōte -ntō, -tor -ntor |
| Three stems and what each feeds | A&G §164 | `stems` | [V] | quoted in §4.2 |
| Ending = tense/mood sign + personal ending; shortening | A&G §§165–167 | `verb-endings` | [V] | §167 "A long vowel is shortened before the personal endings -m (-r), -t, -nt (-ntur)" |
| Present system formation | A&G §168 | `present-system` | [V] | -bam; -bō (1st, 2nd); -am, -ēs (3rd, 4th); subj. -ē-/-ā-; Note 2 optative -im, -īs; imperf. subj. -rem |
| Perfect system formation | A&G §169 | `perfect-system` | [V] | -ī, -istī; -eram; -erō; -erim, -eris (Note: "-īs, -īt, -īmus, -ītis are sometimes found"); -issem |
| *sum* | A&G §170; print pp. 81–83 | `sum` | [V] | no gerund or supine, only the future participle; §170.a *forem*, *fore*; Note: *fuam, fuās, fuat, fuant* old |
| Four conjugations; principal parts | A&G §§171–173 | `four-conjugations` | [V] | §172 parts = pres. ind., pres. inf., perf. ind., neuter perf. participle (or fut. part.) |
| Present stem; -iō verbs | A&G §§174–176 | `present-stem` | [V] | §175 drop -re; §176.b 3rd conj. e/o → i/u, *tegĕ-ris* |
| Perfect stem types | A&G §177 | `perfect-stem` | [V] | v/u; s (*tēx-ī* for *tēg-s-ī*); reduplication; lengthening; unchanged |
| Supine stem; t → s; b+t → pt; g+t → ct | A&G §178 | `formation-supine` | [V] | Notes 1–4 |
| Formation per conjugation | A&G §179 | `forms-conjugation` | [V] | ā lost before -ō, → ē in subj.; 2nd -ā- subj.; 3rd ĕ lost/u/ĭ/ē/ā; -iō verbs lose i "before a consonant, and also before ĭ, ī, and ĕ (except in the Future, the Participle, the Gerund, and the Gerundive)"; 4th takes 3rd-conj. endings in 3pl pres., impf., fut., pres. subj.; imperative 2sg = present stem; fn. 2 gerundive -endus/-undus |
| Contraction, v-loss | A&G §181 | `peculiarities` | [V] | *amāsse, audiī* (out of scope except *eō*) |
| *dīc, dūc, fac, fer* | A&G §182 | `peculiarities` | [V] | "with their compounds … but compounds in -ficiō retain it (cōnfice)"; §182.a *scītō* |
| Archaic forms | A&G §183 | `peculiarities` | [V] | *-ībam, -ībō* (regular in *eō*), *-im*, *-sim/-sō*, *-ier*, *-āssō* |
| Paradigms 1st–4th, -iō | A&G §§184–188; print pp. 92–103 | `1st-conjugation` … `3rd-conjugation-io-verbs` | [V] pp. 92–94, 98 | models *amō, moneō, tegō, audiō, capiō*; *amāris (-re)*, *amāvērunt (-ēre)*, *amāvisse or amāsse* |
| Parallel forms | A&G §189 | `parallel-forms` | [V] | *lavō, lavāre or lavere* |
| Deponents, list of irregular deponents | A&G §§190–191; print pp. 103–106 | `deponent-verbs` | [V] p. 104 | *mīror, vereor, sequor, partior*; fut. imp. *mīrātor*; §190.c future infinitive always active; §190.d gerundive only transitive or impersonal |
| Semi-deponents | A&G §192 | `deponent-verbs` | [V] | *audeō ausus, gaudeō gāvīsus, fīdō fīsus, soleō solitus* |
| Periphrastic conjugations (out of scope) | A&G §§193–196 | `periphrastic-conjugations` | [V] | *amātum īrī* "may also be classed as a periphrastic form" |
| Irregular verbs; *sum* compounds, *prōsum, possum* | A&G §§197–198; pp. 108–109 | `irregular-verbs-compounds-sum` | [V] p. 109 | *prōd-* before *e*; *possum* participle "potēns (adjective)" |
| *volō, nōlō, mālō* | A&G §199; pp. 109–110 | `irregular-verbs-vol%C5%8D-n%C5%8Dl%C5%8D-m%C4%81l%C5%8D` | [V] pp. 109–110 | *vīs, vult (volt)*; *nōn vīs*; *māvīs*; imperative only *nōlī*; participles *volēns, nōlēns*, none for *mālō*; no gerund printed |
| *ferō*, compounds; *edō* | A&G §§200–201; pp. 110–111 | `irregular-verbs-fer%C5%8D-and-ed%C5%8D` | [V] p. 110 | *fers, fert, ferris (-re)*; compound table *attulī allātum* …; *edō* root forms |
| *dō*; *eō*, *adeō* passive | A&G §§202–203; pp. 113–114 | `irregular-verbs-d%C5%8D-e%C5%8D-and-ade%C5%8D` | [V] p. 114 | *iī (īvī)*, *īsse (īvisse)*, *iēns, euntis*, gerundive *eundum*, *itum est*; fn. 1 ī → e before a, o, u; §203.c ii before s → ī |
| *fīō* | A&G §204; p. 115 | `irregular-verbs-f%C4%AB%C5%8D` | [V] p. 115 | `[fīmus], [fītis]`, `[fī, fīte, fītō, ——]` "not used in good prose"; *fierī, factus esse, factum īrī*; participles *factus*, gerundive *faciendus*; compounds -ficiō / -faciō |
| Defective verbs | A&G §§205–206; pp. 116–119 | `defective-verbs` | [V] | *coepī, meminī, ōdī*; *āiō, inquam, fārī, queō* |
| Impersonal verbs, impersonal passive | A&G §§207–208 | `impersonal-verbs` | [V] | table with *pūgnātum est, pūgnātum īrī*; §208.d *ītur, ventum est* |
| Principal-part lists | A&G §§209–212; pp. 121–125 | `classified-lists-verbs-1st-and-2nd-conjugations`, `classified-lists-verbs-3rd-conjugation`, `classified-lists-verbs-4th-conjugation` | [V] | the lists of §5.3 |
| Vowel quantity | A&G §§9–10 | `quantity-syllables` | [V] | §10.a vowel before vowel short; §10.d before *ns, nf, gn* long; §10.e before *nd, nt* short |
| Consonant changes; prefix assimilation | A&G §§15–16 | `phonetic-changes` | [V] | §15 *g, c, h* + *s* → *x*; *g, h* + *t* → *ct*; *b* → *p* before *t*; *m_s, m_t* → *mps, mpt*; dental → *s*; §16 *ad, com/con, in → im, ob, sub, dis → dif/dir, ex → ef, red, sēd* |
| Compounds with prepositions; vowel weakening | A&G §§264–267 | `compound-words` | [V] | §267.a list; Note 2 "Short a … weakened to i before one consonant, to e before two"; §267.b *amb-, dis-, por-, red-, sēd-* |
| Adjective declension (-us -a -um) | A&G §110 | `1st-and-2nd-declension-adjectives-%C4%81-o-stems` | [V] image | *bonus* type |
| Present participle declension | A&G §§114–121 | `3rd-declension-adjectives-classification-and-paradigms`, `3rd-declension-adjectives-case-forms-consonant-stems` | [V] | *egēns*: abl. *egentī (-e)*, acc. pl. *egentīs (-ēs)*; §121.a participles used as such regularly ablative *-e* |
| Quantity of vowels | Bennett §5 | `#sect5` | [V] | long before *nf, ns*; short before *nt, nd* and before a vowel |
| Personal endings, stems, conjugations, principal parts | Bennett §§96–99 | `#sect96` … `#sect99` | [V] | passive 2sg "-rīs, -re" |
| Paradigms | Bennett §§100–111 | `#sect100` … `#sect111` | [V] | *sum, amō, moneō, regō, audiō, capiō*; perfect subjunctive *-erīs*; passive 2sg "or -re" in imperfect, future, subjunctives; future infinitive *amātūrus esse* |
| Deponents, semi-deponents | Bennett §§112–114 | `#sect112` … `#sect114` | [V] | *mīror, vereor, sequor, largior (largītus), patior*; fut. imp. *-tor* |
| Peculiarities, -undus, short imperatives | Bennett §116 | `#sect116` | [V] | §116.2 "-undus, -undī often occur"; §116.3 *dīc, dūc, fac*, compounds of *faciō* in *-fice* |
| Stem formation | Bennett §§117–119 | `#sect117` … `#sect119` | [V] | §118.3.a dental lost before *-sī*, guttural + *s* → *x*, *b* → *p*; §118.4.a Note 1 compounds lose reduplication except *dō, stō, sistō, discō, poscō*; §119.1.a *dt, tt* → *ss* "often simplified to s"; §119.4 *iuvātūrus, lavātūrus, paritūrus, ruitūrus, secātūrus, fruitūrus, moritūrus, oritūrus* |
| Principal-part lists | Bennett §§120–123 | `#sect120` … `#sect123` | [V] | second reading of A&G §§209–212 |
| Irregular, defective, impersonal | Bennett §§124–138 | `#sect124` … `#sect138` | [V] | *possum* "potēns (as an adjective)"; *volō … nōlēns*, no participle for *mālō*; *fīō … Fut. factum īrī, Ger. faciendus*; *eō* "Gerundive, eundum"; *edō* *ēs, ēst, ēsse, ēssem* |

### 1.3 What rests on what

| Rule area (§4) | Rests on |
|---|---|
| Classification by infinitive | A&G §171; Bennett §98 |
| Deponents / semi-deponents | A&G §§156, 190–192; Bennett §§112–114 |
| Three stems | A&G §§164, 172, 175, 177, 178; Bennett §§97, 117–119 |
| Endings | A&G §§163, 166, 168, 169, 179; Bennett §§96, 101–111 |
| Quantity rules | A&G §§10, 167; Bennett §5 |
| Default perfects | A&G §§177, 179, 209–212 |
| Short imperatives | A&G §182; Bennett §116.3 |
| Irregulars | A&G §§170, 197–204; Bennett §§124–132 |
| Availability | A&G §§170, 190.d, 191.a, 198–199, 203–208, 210.a |
| Compounds | A&G §§16, 200.a, 204.a–b, 209.a Note, 264–267; Bennett §118.4.a |
| Declension | A&G §§110, 117–121, 155.b–c, 159 |

## 2. Catalogue

### 2.1 Entries (`latinCatalogue`, 21 entries, catalogue order)

Native labels are the Latin school terms Dutch and English textbooks use, written without macrons. Voices: `['active', 'passive']` wherever marked V.

| # | mood.tense | moodLabel / tenseLabel | Finite / persons | V | Simple or periphrastic |
|---|---|---|---|---|---|
| 1 | indicative.present | Indicativus / Praesens | all six | V | simple |
| 2 | indicative.imperfect | Indicativus / Imperfectum | all six | V | simple |
| 3 | indicative.future | Indicativus / Futurum | all six | V | simple |
| 4 | indicative.perfect | Indicativus / Perfectum | all six | V | active simple; passive, and active of deponents / semi-deponents / *fīō*: participle + *esse* |
| 5 | indicative.pluperfect | Indicativus / Plusquamperfectum | all six | V | as 4 |
| 6 | indicative.future_perfect | Indicativus / Futurum exactum | all six | V | as 4 |
| 7 | subjunctive.present | Coniunctivus / Praesens | all six | V | simple |
| 8 | subjunctive.imperfect | Coniunctivus / Imperfectum | all six | V | simple |
| 9 | subjunctive.perfect | Coniunctivus / Perfectum | all six | V | as 4 |
| 10 | subjunctive.pluperfect | Coniunctivus / Plusquamperfectum | all six | V | as 4 |
| 11 | imperative.present | Imperativus / Praesens | [2,sg], [2,pl] | V | simple |
| 12 | imperative.future | Imperativus / Futurum | [2,sg], [3,sg], [2,pl], [3,pl] | V | simple |
| 13 | infinitive.present | Infinitivus / Praesens | non-finite | V | simple |
| 14 | infinitive.perfect | Infinitivus / Perfectum | non-finite | V | active simple (*amāvisse*); passive and deponent: participle + *esse* |
| 15 | infinitive.future | Infinitivus / Futurum | non-finite | V | active: future participle + *esse* (*esse* also *fore*; *fīō*: *factum īrī*); passive: supine + *īrī* |
| 16 | participle.present | Participium / Praesens | non-finite | – | simple, declined |
| 17 | participle.perfect | Participium / Perfectum | non-finite | – | simple, declined |
| 18 | participle.future | Participium / Futurum | non-finite | – | simple, declined |
| 19 | participle.gerundive | Participium / Gerundivum | non-finite | – | simple, declined (A&G §155.a counts it among the four participles) |
| 20 | gerund.present | Gerundium / Gerundium | non-finite | – | simple; genitive, dative, accusative, ablative |
| 21 | supine.present | Supinum / Supinum | non-finite | – | simple; accusative, ablative |

An unfiltered query has 144 targets: 120 finite indicative/subjunctive, 12 imperative, 6 infinitive, 6 participle/gerund/supine. Non-finite moods (`LatinSpec.nonFinite`): `infinitive | participle | gerund | supine`.

`LatinTenses = { indicative: 'present' | 'imperfect' | 'future' | 'perfect' | 'pluperfect' | 'future_perfect'; subjunctive: 'present' | 'imperfect' | 'perfect' | 'pluperfect'; imperative: 'present' | 'future'; infinitive: 'present' | 'perfect' | 'future'; participle: 'present' | 'perfect' | 'future' | 'gerundive'; gerund: 'present'; supine: 'present' }`.

### 2.2 Subject slots (`latinSubjects`, `genderedTargets: true`)

Latin drops the subject pronoun (A&G prints none in its paradigms), so every slot has `pronoun: null`. Order: for each person/number, the ungendered default slot, then masculine, feminine, neuter.

| id | person | number | gender | default |
|---|---|---|---|---|
| `1sg` | 1 | singular | – | true |
| `1sg.m` / `1sg.f` / `1sg.n` | 1 | singular | masculine / feminine / neuter | false |
| `2sg`, `2sg.m`, `2sg.f`, `2sg.n` | 2 | singular | –, m, f, n | true, false, false, false |
| `3sg`, `3sg.m`, `3sg.f`, `3sg.n` | 3 | singular | –, m, f, n | as above |
| `1pl`, `1pl.m`, `1pl.f`, `1pl.n` | 1 | plural | –, m, f, n | as above |
| `2pl`, `2pl.m`, `2pl.f`, `2pl.n` | 2 | plural | –, m, f, n | as above |
| `3pl`, `3pl.m`, `3pl.f`, `3pl.n` | 3 | plural | –, m, f, n | as above |

`subjectsFor(query)`: the slot named by `subject`; else, when `gender` is given, the six slots of that gender; else the six default slots.

**Decision: an unfiltered query returns the three genders for every compound form, and only there.** A simple form (*amō*) does not change with the subject's gender, so tripling it would add two identical forms per cell; a compound form does change (*amātus / amāta / amātum sum*, Bennett §102 prints "amātus (-a, -um) sum", A&G p. 94). With the ungendered default slot, `clause.agreements` returns masculine, feminine and neuter for an agreeing participle (in that order, so the masculine form sorts first as in a classic table), each as `target.agreement = { gender, number, case: 'nominative' }`; `target.gender` stays null. With `gender` or `subject: '3sg.f'` the target carries that gender and the participle takes it alone. This keeps the approved design's rule ("where gender changes the verb phrase, all genders are returned") without duplicating simple forms, and the guard "extra forms carry a variant tag" compares within one `resolvedTargetKey`, which includes the agreement. The oracle is masculine only: its query asks `gender: 'masculine'` (§9.4). An impersonal passive (*itum est*) is neuter singular whatever slot is asked (§6.2).

### 2.3 Options (`latinOptions`, validation order)

| Field | Kind | Values | Meaning |
|---|---|---|---|
| `stems` | stems | words `present` (1sg present: *amō, hortor, capiō*), `perfect` (1sg perfect active: *amāvī*), `supine` (*amātum*, or the perfect participle *amātus*, normalised to *-um*); enums `semiDeponent: [true, false]` | principal parts beyond the infinitive (§3.5) |
| `classHint` | enum | `first`, `second`, `third`, `thirdIo`, `fourth` | conjugation, overrides inference |
| `voice` | enum | `active`, `passive` | target filter (as the toy pack) |
| `gender` | enum | `masculine`, `feminine`, `neuter` | selects the gendered subject slots |
| `agreement` | agreement | `required: false`, genders m/f/n, cases `nominative, genitive, dative, accusative, ablative, vocative` | present (even `{}`) → non-finite forms are declined in full and filtered by the given keys; absent → citation forms only (§6.3) |

`LatinSpec`: `auxiliary: never` (Latin has no auxiliary choice; if the typed schema of Plan 2 Task 5 requires the key, declare `auxiliary: { kind: 'enum', values: [] }`), `classHint: LatinClassHint`, `stems: LatinStemHints`, `context: { voice?, gender?, agreement? }`.

`check(options)`, all `INVALID_HINT`: `stems.present` must end in -ō or -or (*-or* only with a deponent infinitive, *-ō* only with an active one); `stems.perfect` must end in -ī; `stems.supine` must end in -um or -us; `semiDeponent: true` requires an active infinitive and no `perfect`. `INVALID_REQUEST` when `subject` and `gender` are both given and the slot has another gender.

### 2.4 Left out, and why

| Left out | Why / what happens |
|---|---|
| Contracted and v-less perfects (*amāsse, amārunt, audiī, audīstī*, A&G §181) | out of scope per the approved design; exception: *eō* and compounds, whose *iī, īstī, īsse, īssem* are the standard forms (A&G §203.b–c) |
| Periphrastic conjugations (*amātūrus sum, amandus est*, A&G §§193–196) | out per the approved design; the gerundive and future participle themselves are in |
| Sigmatic futures / aorists (*faxō, faxim, amāssō*), *-ier* infinitives, *-ībam/-ībō* in the 4th conjugation, *duim*, *siem*, *fuam* (A&G §§170 Note, 183) | archaic; not generated |
| Archaic spellings (*volt, voltis*, A&G p. 109; *quom*) | not generated |
| Future perfect passive infinitive (*amātum fore*), "perfect potential" (*amātūrum fuisse*) | not in A&G's paradigms; Wiktionary rows are `unmodelled` |
| *amātus fuī / fueram* (A&G p. 94 fn. 1) | "sometimes used"; not generated |
| Negative imperative (*nōlī amāre*, *nē amāveris*) | syntax, not a paradigm cell (A&G §450) |
| Gerund nominative | does not exist (A&G §159.a); the oracle row is `unmodelled` |
| Locative-like supine in -ū as dative | modelled as ablative only (Bennett §101 prints "Abl. amātū") |
| Enclitics (*-que, -ne*), word order variants (*sum amātus*) | not paradigm cells; the participle precedes *esse* as both grammars print |

## 3. Classification

### 3.1 Classes (`classId`)

| classId | Present stem class (`stemClass`) | Example | Detected from |
|---|---|---|---|
| `first` | `a` (stem in ā) | *amāre, amā-* | infinitive -āre / deponent -ārī |
| `second` | `e` (stem in ē) | *monēre, monē-* | -ēre / -ērī |
| `third` | `consonant` (root, thematic vowel in the endings) | *tegere, teg-* | -ere / -ī (deponent) |
| `thirdIo` | `io` (root + i) | *capere, capi-* | -ere / -ī **and** 1sg in -iō / -ior (lexicon or `stems.present`) |
| `fourth` | `i` (stem in ī) | *audīre, audī-* | -īre / -īrī |
| `irregular` | lexical | *esse, posse, velle, ferre, īre, fierī, edere, dare* | lexicon only |

Voice class (`voiceClass`): `active`, `deponent` (infinitive -rī / -ī, or 1sg -or), `semiDeponent` (lexicon or `stems.semiDeponent`). `classId` = conjugation, plus `-deponent` / `-semi-deponent` (e.g. `third-deponent`).

### 3.2 Order of classification (`classify(query): Fork<LatinLexeme>`)

1. **Key.** `latinKey(text)` = NFD, remove U+0304 (macron) and U+0306 (breve), NFC, lowercase, `j` → `i`. The same function is the pack's `normalizeForComparison` (§6.6).
2. **Lexicon.** Every lexicon entry whose infinitive key equals the query's key (directly listed, or compound of a family, §3.4). If the query's infinitive carries at least one macron, keep only entries whose macron spelling equals it; if `stems.present` is given, keep only entries whose 1sg key equals its key. Each remaining entry is one paradigm: step `la.classify.lexicon` (or `la.classify.compound`), tags `{ pattern: <1sg with macrons>, condition: <gloss> }` only when more than one remains (§3.6).
3. **Passive infinitive of a lexicon verb.** If nothing matched and the key ends in -rī / -ī, and replacing -ārī/-ērī/-īrī by -āre/-ēre/-īre, or -ī by -ere, gives a non-deponent lexicon verb: `INVALID_INFINITIVE` "*amārī* is the present passive infinitive of *amāre*: conjugate *amāre* with `voice: 'passive'`."
4. **Ending.** Otherwise classify by the infinitive (macron spelling as given): -āre → first; -ēre → second; -īre → fourth; -ere (no macron on that e) → third, with assumption `la.classify.assume-third` when the whole input has no macron and no `stems.present` in -eō; -ārī → first deponent; -ērī → second deponent; -īrī → fourth deponent; -ī after anything else → third deponent; macron-less -eri → second deponent with `la.classify.assume-second-deponent` unless `stems.present` ends in -or without -e- before it (*queror* type → third). `stems.present` in -iō / -ior with -ere / -ī → `thirdIo` (`la.classify.io`); third conjugation without such a 1sg → `la.classify.assume-consonant-stem`. `classHint` overrides all of this (`classificationSource: 'explicitHint'`). Anything else (*blesse*, *trānsesse*) → `INVALID_INFINITIVE` "A Latin infinitive ends in -re, or -rī / -ī for a deponent; irregular verbs (esse, posse, velle, ferre, īre, fierī) must be in the lexicon."
5. **Assumptions for a verb outside the lexicon** (each a step of kind `assumption`, collected in `analysis.assumptions`): `la.classify.assume-quantity` (unmarked stem vowels are taken as written, no macron added), `la.classify.assume-passive` (full personal passive, i.e. transitive; not for deponents), and the default principal parts of §3.3 unless `stems` gives them.

### 3.3 Default principal parts for unknown verbs (assumptions)

The engine never invents vowel length in the stem; the long vowels below belong to the suffix pattern the cited section prints.

| Class | Condition (on the root = infinitive minus -āre/-ēre/-ere/-īre) | Perfect | Supine | Rule | Citation |
|---|---|---|---|---|---|
| first | always | root + āvī | root + ātum | `la.classify.default-parts` (`conjugation: first`) | A&G §179.a.2 |
| second | always | root + uī | root + itum | `la.classify.default-parts` (`second`) | A&G §179.b.2 |
| fourth | always | root + īvī | root + ītum | `la.classify.default-parts` (`fourth`) | A&G §179.d |
| third / thirdIo | root ends in a stop: c, g, h, qu, gu, b, p, d, t | sigmatic: root + s with `la.stem.s-junction` | root + t with `la.stem.t-junction` | `la.classify.default-sigmatic` | A&G §177.b, §211.a; Bennett §118.3 |
| third | root ends in u (1sg -uō) | root + ī (*-uī*) | root with ū + tum (*-ūtum*) | `la.classify.default-uo` | A&G §211.f |
| third | root ends in -sc (inceptive) | root − sc + vī | root − sc + tum | `la.classify.default-sco` | A&G §211.c (*crēscō crēvī crētum*) |
| third | root ends in l, m, n, r, s, x | root + uī | root + itum | `la.classify.default-u` | A&G §211.c (*alō, colō, gemō, molō, pōnō*) |
| deponents | same table, participle instead of perfect (*-ātus, -itus, -tus, -ītus*) | – | as above | same rule ids | A&G §190 |

Junction tables (perfect -s-, supine -t-; A&G §15, §178 Note 1; Bennett §§118.3.a, 119.1.a):

| Root-final | + s (perfect) | + t (supine) |
|---|---|---|
| c, g, h, qu, gu | x (*trex-*; *ung-* → *unx-*) | ct |
| b, p | ps | pt |
| d, t | s (dental lost) | ss after a short or unmarked vowel, s after a long vowel, diphthong or consonant |
| m | mps | mpt |
| r | ss (*gessī*) | st (*gestum*) |

### 3.4 Compounds and families

A compound is **prefix allomorph + family key**. Inheritance is a recorded rule step (`la.classify.compound`), not an assumption, because the family entry states the compound form; it is an assumption (`la.classify.assume-compound`) only for families marked `compoundsVary` (*currō*: *-currī / -cucurrī*).

**Closed prefix list with assimilation** (A&G §16, §267.a–b; the allomorph is valid only before the listed onsets):

| Prefix | Allomorphs (onset of the base) |
|---|---|
| ab | ā (m, v), abs (c, t), au (f in *auferō, aufugiō*), ab (elsewhere) |
| ad | ac (c, q), af (f), ag (g), al (l), ap (p), ar (r), as (s), at (t), a (sc, sp, st, gn), ad (elsewhere) |
| ante, circum (circu before i), inter (intel before l), per (pel before l), post, prae, praeter, super | unchanged |
| com | co (vowel, h), col (l), cor (r), com (b, p, m), cōn (f, s; A&G §10.d), con (elsewhere) |
| dē, ē / ex | ē (b, d, g, l, m, n, r, v), ef (f), ex (elsewhere) |
| dis | dī (d, g, l, m, r, v), dif (f), dir (vowel), dis (elsewhere) |
| in | im (b, m, p), il (l), ir (r), īn (f, s; A&G §10.d), in (elsewhere) |
| ob | oc (c), of (f), og (g), op (p), o (m: *omittō*), ob (elsewhere) |
| prō | prōd (vowel: *prōdeō, prōdesse*), prō (elsewhere) |
| re / red | red (vowel, h), re (elsewhere) |
| sē / sēd | sēd (vowel), sē (elsewhere) |
| sub | suc (c), suf (f), sug (g), sum (m), sup (p), sur (r), sus (c, p, t in *suscipiō, sustineō*), sub (elsewhere) |
| trāns | trā (d, i, l, m, n), trāns (elsewhere) |

Parsing is macron-insensitive, longest allomorph first; output keeps the allomorph with the quantity of the table (*conficere* → *cōnficere*). One prefix only.

**Family entries** store the compound form of the principal parts once on the base (A&G §267 Note 2, §204.a, §209.a Note, §211):

| Base | Compound form | Notes |
|---|---|---|
| capiō | -cipiō, -cipere, -cēpī, -ceptum | *accipiō, recipiō, suscipiō* |
| faciō | -ficiō, -ficere, -fēcī, -fectum (imperative *-fice*) | *benefaciō, calefaciō, satisfaciō* keep *-faciō*, passive *-fīō* (A&G §204.b) |
| iaciō | -iciō, -icere, -iēcī, -iectum | *ēiciō, ēiectus* (A&G §267 Note 2) |
| rapiō | -ripiō, -ripere, -ripuī, -reptum | |
| laciō | -liciō, -licere, -lexī, -lectum | *ēliciō -licuī -licitum* listed (A&G §211.a) |
| speciō | -spiciō, -spicere, -spexī, -spectum | |
| quatiō | -cutiō, -cutere, -cussī, -cussum | |
| cadō | -cidō, -cidere, -cidī, -cāsum | |
| caedō | -cīdō, -cīdere, -cīdī, -cīsum | |
| canō | -cinō, -cinere, -cinuī, -centum | |
| tangō | -tingō, -tingere, -tigī, -tāctum | |
| emō | -imō, -imere, -ēmī, -ēmptum | not *cōmō, dēmō, prōmō, sūmō* (own entries, -mpsī) |
| legō | -ligō, -ligere, -lēgī, -lēctum | *intellegō, neglegō, dīligō*: -lēxī (A&G §211 fn. 2) |
| regō | -rigō, -rigere, -rēxī, -rēctum | *pergō, surgō* own entries |
| agō | -igō, -igere, -ēgī, -āctum | *cōgō, dēgō* own entries |
| premō | -primō, -primere, -pressī, -pressum | |
| sedeō | -sideō, -sidēre, -sēdī, -sessum | |
| teneō | -tineō, -tinēre, -tinuī, -tentum | |
| habeō | -hibeō, -hibēre, -hibuī, -hibitum | |
| statuō | -stituō, -stituere, -stituī, -stitūtum | |
| claudō | -clūdō, -clūdere, -clūsī, -clūsum | |
| plaudō | -plōdō, -plōdere, -plōsī, -plōsum | [U] verify L&S |
| quaerō | -quīrō, -quīrere, -quīsīvī, -quīsītum | |
| saliō | -siliō, -silīre, -siluī, -sultum | |
| placeō | -pliceō, -plicēre, -plicuī, -plicitum | *displiceō* |
| dō (1st) | only *circum-, inter-, pessum-, satis-, super-, vēnum-dō* (A&G §209.a Note) | |
| -dō (3rd) | -dō, -dere, -didī, -ditum (*abdō, addō, condō, crēdō, dēdō, ēdō, indō, perdō, prōdō, reddō, subdō, trādō, vēndō*) | |
| stō | *cōnstō, īnstō, praestō, restō …* -stitī (A&G §209.a Note) | explicit prefix list |
| sistō | keeps reduplication *-stitī* in compounds (Bennett §118.4.a Note 1) | |
| currō | -currō, -currere, -currī (also -cucurrī), -cursum | `compoundsVary` |
| pellō | -pellō, -pellere, -pulī, -pulsum | |
| tendō | -tendō, -tendere, -tendī, -tentum | |
| pendō, parcō, fallō, pungō | reduplication lost in compounds | |
| discō, poscō | reduplication kept | |
| sum | ab, ad, dē, in, inter, ob, prae, prō(d), sub, super; *possum* separate | A&G §198 explicit list |
| eō | ab, ad, ante, circum, co, ex, in, inter, ob, per, prae, praeter, prōd, red, sub, trāns, vēn (*vēneō*) | A&G §203; *ambiō* is regular 4th (no-inherit, A&G §203.d) |
| ferō | the table of A&G §200.a (*afferō attulī allātum, auferō abstulī ablātum, cōnferō contulī collātum, differō distulī dīlātum, efferō extulī ēlātum, īnferō intulī illātum, offerō obtulī oblātum, referō rettulī relātum, sufferō sustulī sublātum*) | listed forms, not derived |
| fīō | *-fīō* only after *bene, cale, satis* … | A&G §204.b–c |

Families with a weakened compound form inherit **only** in that form: *recapere* is not a compound of *capiō* (A&G §267 Note 2), it is an unknown third-conjugation verb. Families whose compounds keep the simple form (*mittō, dūcō, dīcō, scrībō, pōnō, vertō, veniō, sentiō, vocō, portō …*) inherit with the simple parts. **Minimum base length:** the family key's root (infinitive minus its ending) has at least three letters, otherwise only the family's own closed prefix list applies (*dō, stō, sum, eō, agō, emō*). **No-inherit list** (own entries or regular): *ambiō, intellegō, neglegō, dīligō, cōgō, dēgō, cōmō, dēmō, prōmō, sūmō, pergō, surgō, aperiō, operiō, reperiō, comperiō, dēbeō, praebeō, exerceō, coerceō, circumdō, vēneō, redeō, prōdeō*.

### 3.5 Hints

| Hint | Effect | Step |
|---|---|---|
| `classHint` | sets the conjugation; skips `assume-third` / `assume-consonant-stem` | `la.classify.conjugation` with `classificationSource: 'explicitHint'` |
| `stems.present` | disambiguates 2nd/3rd (*-eō*), -iō verbs, deponent 1sg, homographs (§3.6) | `la.classify.io` / lexicon filter |
| `stems.perfect`, `stems.supine` | replace the default principal parts; skip their assumptions | `la.stem.perfect` / `la.stem.supine` become kind `lexical` from the hint |
| `stems.semiDeponent: true` | active present system, participle + *esse* perfect system; the participle comes from `stems.supine` | `la.classify.semi-deponent` |

### 3.6 Several paradigms for one lemma

A macron-less key that matches more than one lexicon entry returns all of them, in lexicon order, as separate paradigms (`analysis.alternatives`), each tagged `pattern: <1sg with macrons>` and `condition: <English gloss>`. Lexicon homograph sets: *parere* (*pāreō* 'obey' / *pariō* 'give birth'), *occidere* (*occīdō* 'kill' / *occidō* 'fall'), *incidere*, *concidere*, *decidere*, *recidere* (same pair), *edere* (*edō* 'eat' / *ēdō* 'give out'), *iacere* (*iaceō* 'lie' / *iaciō* 'throw'), *venire* (*veniō* 'come' / *vēneō* 'be sold'), *pendere* (*pendeō* 'hang' / *pendō* 'weigh'). A macron in the input or `stems.present` selects one. Parallel forms of one verb (A&G §189: *lavō, lavāre or lavere*) are separate keys, not homographs: *lavere* is its own lexicon entry whose paradigm carries `usage: 'literary'`.

## 4. Rule inventory

86 rules. Citation shorthand: **AG/slug** = `https://dcc.dickinson.edu/grammar/latin/<slug>` (slugs in §1.2); **AGp N** = the 1903 page scan `https://dcc.dickinson.edu/sites/default/files/AG<N+12>.jpg`; **B§N** = `https://www.gutenberg.org/files/15665/15665-h/15665-h.htm#sectN`; **LS** = `https://logeion.uchicago.edu/<lemma>`. Messages: the English text below is the `en` message (params in braces, `{before}`/`{after}` always available); the implementer writes `nl`. Dutch school-grammar terms that matter: *stam* (praesensstam, perfectumstam, supinumstam), *uitgang*, *persoonsuitgang*, *tijdteken / modusteken*, *verbindingsklinker*, *deponens*, *semideponens*, *activum / passivum*, *coniunctivus*, *imperativus (praesens / futurum)*, *infinitivus praesentis / perfecti / futuri*, *participium praesentis (PPA) / perfecti (PPP) / futuri (PFA)*, *gerundium*, *gerundivum*, *supinum*, naamvallen *nominativus, genitivus, dativus, accusativus, ablativus, vocativus*, *mannelijk / vrouwelijk / onzijdig*, *samengesteld werkwoord*, *klinkerverzwakking*, *assimilatie*.

### 4.1 Classify (`stage: 'classify'`)

| id | kind | en message | Trigger | params | Citation | Example |
|---|---|---|---|---|---|---|
| `la.classify.lexicon` | lexical | {before} is in the lexicon: {parts}. | key matches a listed entry | parts: text | AG/four-conjugations §172; LS | *monere* → *moneō, monēre, monuī, monitum* |
| `la.classify.compound` | rule | {before} is {prefix}- + {base}; compounds of {base} go {parts}. | prefix allomorph (§3.4) + family key | prefix, base, parts: text | AG/compound-words §267.a + Note 2; AG/phonetic-changes §16 | *accipere* → ac- + *capiō*: *-cipiō, -cipere, -cēpī, -ceptum* |
| `la.classify.conjugation` | rule | {before} ends in -{ending}: {conjugation, select, first {first} second {second} third {third} thirdIo {third (-iō)} fourth {fourth} other {irregular}} conjugation. | infinitive ending (§3.2 step 4) or `classHint` | ending, conjugation: text | AG/four-conjugations §171; B§98 | *blorpāre* → first |
| `la.classify.io` | rule | The first person {after} ends in -iō: a third-conjugation verb in -iō, which keeps its i before a, o, u and long ē. | 1sg -iō/-ior with -ere/-ī | – | AG/forms-conjugation §179.c.1; AG/3rd-conjugation-io-verbs §188; B§109 | *blapere* + *blapiō* |
| `la.classify.deponent` | rule | {before} has a passive infinitive: the verb is deponent, with passive forms and active meaning. | -rī / -ī, or 1sg -or | – | AG/deponent-verbs §190; AG/verb-conjugations §156.b | *hortārī* |
| `la.classify.semi-deponent` | lexical | {before} is semi-deponent: active forms in the present system, passive forms with active meaning in the perfect system. | lexicon flag or `stems.semiDeponent` | – | AG/deponent-verbs §192; B§114 | *audēre* |
| `la.classify.assume-third` | assumption | No macron marks the e of -ere, so the verb is taken to be of the third conjugation; write -ēre or give the first person in -eō for the second. | -ere, input without any macron, no `stems.present` in -eō, not in lexicon | – | AG/four-conjugations §171 | *tregere* |
| `la.classify.assume-second-deponent` | assumption | No macron marks -eri, so the verb is taken to be a second-conjugation deponent (-ērī). | macron-less -eri, not in lexicon | – | AG/deponent-verbs §190 | *blorperi* |
| `la.classify.assume-consonant-stem` | assumption | Without a first person in -iō the verb is not taken to be an -iō verb. | third conj., no 1sg, not in lexicon | – | AG/3rd-conjugation-io-verbs §188 | *tregere*, *trapī* |
| `la.classify.assume-quantity` | assumption | The lengths of the stem vowels are not known: vowels written without a macron are left without one. | not in lexicon | – | AG/quantity-syllables §10 ("all vowels known to be long are marked") | *tregere* |
| `la.classify.assume-passive` | assumption | The verb is assumed to have a full passive, as a transitive verb does. | not in lexicon, not deponent | – | AG/verb-conjugations §154.a; AG/impersonal-verbs §208.d | *blorpāre* |
| `la.classify.assume-compound` | assumption | Compounds of {base} vary; {prefix}- + {base} is assumed to follow the listed compound form. | family `compoundsVary` | prefix, base: text | B§118 (Note 1) | *accurrere* |
| `la.classify.default-parts` | assumption | Not in the lexicon: the regular {conjugation, select, first {first-conjugation} second {second-conjugation} fourth {fourth-conjugation} other {}} perfect and supine are assumed. | first, second, fourth outside the lexicon | conjugation: text | AG/forms-conjugation §179.a.2, b.2, d | *blorpāvī, blorpātum* |
| `la.classify.default-sigmatic` | assumption | Not in the lexicon: an s-perfect is assumed, the commonest third-conjugation type for a stem in a stop consonant. | third, root ends in a stop | – | AG/perfect-stem §177.b; AG/classified-lists-verbs-3rd-conjugation §211.a | *trexī, trectum* |
| `la.classify.default-uo` | assumption | Not in the lexicon: a verb in -uō is assumed to have the perfect -uī and the supine -ūtum. | third, root ends in u | – | AG/classified-lists-verbs-3rd-conjugation §211.f | *bluō → bluī, blūtum* |
| `la.classify.default-sco` | assumption | Not in the lexicon: an inceptive in -scō is assumed to drop -sc- and add -vī and -tum. | third, root ends in sc | – | AG/classified-lists-verbs-3rd-conjugation §211.c | *flēscō → flēvī, flētum* |
| `la.classify.default-u` | assumption | Not in the lexicon: a stem in l, m, n, r, s or x is assumed to have the perfect -uī and the supine -itum. | third, root ends in l, m, n, r, s, x | – | AG/classified-lists-verbs-3rd-conjugation §211.c | *frolere → froluī, frolitum* |

### 4.2 Stems (`stage: 'stem'`)

A&G §164 (AG/stems) decides which stem feeds which cell; `stems.ts` implements exactly this table:

| Stem | Feeds |
|---|---|
| present (`amā-, monē-, teg-, capi-, audī-`) | present, imperfect, future indicative; present and imperfect subjunctive; both imperatives; present infinitive; present participle; gerundive; gerund — active and passive |
| perfect (`amāv-, monu-, tēx-, cēp-, audīv-`) | perfect, pluperfect, future perfect indicative; perfect and pluperfect subjunctive; perfect infinitive — active only |
| supine (`amāt-, monit-, tēct-, capt-, audīt-`) | perfect participle (→ perfect-system passive and deponent perfect system, perfect passive infinitive); future participle (→ future active infinitive); supine (→ future passive infinitive) |

| id | kind | en message | Trigger | params | Citation | Example |
|---|---|---|---|---|---|---|
| `la.stem.present` | rule | Present stem: {before} without -{ending} gives {after}-. | every present-system cell | ending: text | AG/present-stem §175; B§97 | *amāre* → *amā-*; *tegere* → *teg-*; *hortārī* → *hortā-* |
| `la.stem.perfect` | lexical | Perfect stem from the principal part {before}: {after}-. | perfect-system active cell, listed or hinted perfect | – | AG/four-conjugations §172; AG/perfect-system §169 | *tēxī* → *tēx-* |
| `la.stem.perfect-regular` | rule | Perfect stem: {before} + -{suffix}- gives {after}-. | default perfect (§3.3) | suffix: text | AG/perfect-stem §177.a–b | *blorpā-* + v → *blorpāv-* |
| `la.stem.supine` | lexical | Supine stem from the principal part {before}: {after}-. | participles, supine, listed or hinted | – | AG/formation-supine §178 | *amātum* → *amāt-* |
| `la.stem.supine-regular` | rule | Supine stem: {before} + -{suffix}- gives {after}-. | default supine | suffix: text | AG/formation-supine §178.a–b | *monē-* → *monit-* |
| `la.stem.s-junction` | rule | Before the s of the perfect, {consonant} becomes {result}: {before} → {after}. | default sigmatic perfect | consonant, result: text | AG/phonetic-changes §15; B§118 (3.a) | *treg-s-* → *trex-* |
| `la.stem.t-junction` | rule | Before the t of the supine, {consonant} becomes {result}: {before} → {after}. | default supine of a stop stem | consonant, result: text | AG/formation-supine §178 Note 1; B§119 (1.a) | *treg-t-* → *trect-* |
| `la.stem.lexical` | lexical | The lexicon gives the stem {after}- here. | listed special stems (*eō*: *eunt-, eund-*; *dō*: *da-*; *volō*: *vel-*; *ferō* perfect *tul-*, supine *lāt-*) | – | AG/irregular-verbs-d%C5%8D-e%C5%8D-and-ade%C5%8D §§202–203; AG/irregular-verbs-vol%C5%8D-n%C5%8Dl%C5%8D-m%C4%81l%C5%8D §199 | *euntis* |

### 4.3 Endings (`stage: 'ending'`; data in §4.6)

| id | kind | en message | Trigger | params | Citation | Example |
|---|---|---|---|---|---|---|
| `la.end.personal` | rule | Present {voice}, {person} {number}: add the personal ending -{ending}. | present indicative of stem classes a, e, i (not i-class 3pl) | ending: text; person, number, voice: term | AG/personal-endings §163; AGp 89 | *amā-* + *s* |
| `la.end.thematic` | rule | Third conjugation: connecting vowel and personal ending -{ending} (i before most endings, u before -nt, e before -r). | present indicative of consonant / io classes; i-class 3pl | ending: text | AG/forms-conjugation §179.c.1, §179.d; AG/present-stem §176.b | *teg-* + *unt*; *audī-* + *unt* |
| `la.end.imperfect` | rule | Imperfect: add -bā- (third and fourth conjugations -ēbā-) and the personal ending: -{ending}. | indicative imperfect | ending: text | AG/present-system §168.b; §179.c.1, d | *amā-* + *bās* |
| `la.end.future-b` | rule | Future of the first and second conjugations: add -{ending}. | indicative future, classes a, e (and *eō*) | ending: text | AG/present-system §168.c; AG/peculiarities §183 | *amā-* + *bō* |
| `la.end.future-e` | rule | Future of the third and fourth conjugations: add -{ending} (a in the first person, ē in the others). | indicative future, classes consonant, io, i | ending: text | AG/present-system §168.d | *teg-* + *ēs* |
| `la.end.subjunctive` | rule | Present subjunctive: add the mood vowel and ending -{ending}. | subjunctive present | ending: text | AG/present-system §168.e; AG/forms-conjugation §179.a.1, b.1 | *amā-* + *ēs*; *monē-* + *ās* |
| `la.end.imperfect-subjunctive` | rule | Imperfect subjunctive: add -rē- and the personal ending: -{ending}. | subjunctive imperfect | ending: text | AG/present-system §168.f | *amā-* + *rēs*; *teg-* + *erēs* |
| `la.end.perfect` | rule | Perfect: add -{ending} to the perfect stem. | indicative perfect active | ending: text | AG/personal-endings §163.a; AG/perfect-system §169.a | *amāv-* + *istī* |
| `la.end.pluperfect` | rule | Pluperfect: add -{ending} to the perfect stem. | indicative pluperfect active | ending: text | AG/perfect-system §169.b | *amāv-* + *erās* |
| `la.end.future-perfect` | rule | Future perfect: add -{ending} to the perfect stem. | indicative future_perfect active | ending: text | AG/perfect-system §169.c | *amāv-* + *eris* |
| `la.end.perfect-subjunctive` | rule | Perfect subjunctive: add -{ending} to the perfect stem. | subjunctive perfect active | ending: text | B§101; AG/perfect-system §169.d Note | *amāv-* + *erīs* |
| `la.end.pluperfect-subjunctive` | rule | Pluperfect subjunctive: add -{ending} to the perfect stem. | subjunctive pluperfect active | ending: text | AG/perfect-system §169.e | *amāv-* + *issēs* |
| `la.end.imperative` | rule | {tense} imperative: add -{ending}. | imperative cells; an empty ending is written `-` | ending: text; tense: term | AG/personal-endings §163.b; AG/forms-conjugation §179.e; AGp 93 | *amā-* + *tō* |
| `la.end.infinitive` | rule | {tense} infinitive: add -{ending}. | present active/passive, perfect active infinitive | ending: text; tense: term | AG/verb-endings §166 (table); AG/present-stem §175 | *amā-* + *re*; *teg-* + *ī*; *amāv-* + *isse* |
| `la.end.ere` | rule | Literary alternative: -ēre for -ērunt. | perfect 3pl active, every verb with a perfect stem; tags `usage: 'literary', pattern: 'ēre'` | – | AG/personal-endings §163.a; AGp 93 "amāvērunt (-ēre)"; B§101 | *amāvēre* |
| `la.end.re` | rule | Literary alternative: -re for -ris in the second person singular. | passive-form 2sg in -ris of present, imperfect, future indicative and present, imperfect subjunctive (also deponents); tags `usage: 'literary', pattern: 're'` | – | AGp 94 "amāris (-re)", "amāberis (-re)"; AGp 104; B§96 | *amāre* (2sg), *tegere* (2sg) |
| `la.end.short-imperative` | lexical | {before} drops the -e of the present imperative singular. | *dīcō, dūcō, faciō, ferō* and their compounds, but not compounds in *-ficiō* | – | AG/peculiarities §182; B§116 (3) | *dūc*, *ēdūc*, *fac*, but *cōnfice* |
| `la.end.athematic` | rule | Like ferō, this verb adds endings in s, t and r straight to the root, without a connecting vowel. | *ferō* (+ compounds): wherever the long-stem ending (class a/e/i column of §4.6) of the cell starts with s, t or r, that ending is added to *fer-* directly (*fers, fert, fertis, ferris, fertur, ferre, ferrī, ferrem, ferte, fertō, fertor*); otherwise the consonant-class ending (*ferō, ferimus, ferunt, ferēbam, feram, feriminī, feruntō*); *edō* athematic alternatives on the root *ēd-* → *ēs-* (*ēs, ēst, ēstis, ēsse, ēssem*, `pattern: 'athematic'`) | – | AG/present-stem §174; AG/irregular-verbs-fer%C5%8D-and-ed%C5%8D §200 fn. 3, §201; B§128–129 | *fer-* + *t* → *fert*; *fer-* + *rī* → *ferrī* |
| `la.end.optative` | rule | This verb forms its present subjunctive with -ī-: -{ending}. | *velim, nōlim, mālim* (and *sim, possim, edim* as lexical cells) | ending: text | AG/present-system §168.e Note 2 | *vel-* + *īs* |

Non-finite endings and declension:

| id | kind | en message | Trigger | params | Citation | Example |
|---|---|---|---|---|---|---|
| `la.end.present-participle` | rule | Present participle: add -{ending} (genitive -ntis). | participle.present | ending: text | AG/forms-participle §158.a; AG/verb-endings §166 table | *amā-* + *ns*; *teg-* + *ens* |
| `la.end.perfect-participle` | rule | Perfect participle: the supine stem + -us, -a, -um. | participle.perfect and every participle in a compound | – | AG/forms-participle §158.c | *amāt-us* |
| `la.end.future-participle` | rule | Future participle: the supine stem + -ūrus, -a, -um. | participle.future, future infinitive | – | AG/forms-participle §158.b; B§119 (4) | *amāt-ūrus* |
| `la.end.gerundive` | rule | Gerundive: add -{ending}. | participle.gerundive | ending: text | AG/forms-participle §158.d; AG/verb-endings §166 | *ama-ndus*, *audi-endus* |
| `la.end.gerund` | rule | Gerund: add -{ending}. | gerund | ending: text | AG/gerund-and-supine §159.a; AGp 93 | *ama-ndī* |
| `la.end.supine` | rule | Supine: add -{ending} to the supine stem. | supine; supine in a future passive infinitive | ending: text | AG/gerund-and-supine §159.b | *amāt-um*, *amāt-ū* |
| `la.end.undus` | rule | Older alternative: -und- for -end- in the gerund and gerundive. | gerund and gerundive of classes consonant, io, i; tags `usage: 'dated', pattern: 'undus'` | – | AG/forms-conjugation §179 fn. 2; B§116 (2) | *tegundus*, *audiundī* |
| `la.end.decline-us` | rule | {case} {gender} {number}: -{ending}, like bonus. | perfect / future participle, gerundive, gerund (neuter singular) with a non-citation agreement | ending: text; case, gender, number: term | AG/1st-and-2nd-declension-adjectives-%C4%81-o-stems §110 | *amāta*, *amātōrum*, *amāte* (voc.) |
| `la.end.decline-ns` | rule | {case} {gender} {number}: -{ending}, like egēns. | present participle with a non-citation agreement | ending: text; case, gender, number: term | AG/3rd-declension-adjectives-classification-and-paradigms §§117.b, 118 | *amantis*, *amantium* |
| `la.end.ablative-i` | rule | Ablative -ī, used when the participle serves as an adjective. | present participle ablative singular; second form after -e; `pattern: 'adjectival'` | – | AG/3rd-declension-adjectives-case-forms-consonant-stems §121.a | *amantī* (abl.) |
| `la.end.accusative-is` | rule | Accusative plural -īs beside -ēs. | present participle acc. pl. masc./fem.; second form; `pattern: 'is'` | – | AG/3rd-declension-adjectives-case-forms-consonant-stems §121.c; §118 table | *amantīs* |

**Perfect subjunctive decision.** One standard form with long ī (*-erim, -erīs, -erit, -erīmus, -erītis, -erint*, Bennett §101; A&G §169.d explains the ī as the original optative sign and says "-īs, -īt, -īmus, -ītis are sometimes found"). A&G's printed short forms (p. 93) are recorded as a disputed authority reading (§8.3); the scraped oracle's short forms get macron corrections (§9.5). The future perfect keeps short i in both grammars (*-eris, -erimus, -eritis*).

### 4.4 Spelling and quantity (`orthography`, juncture rules in this order)

| # | id | en message | Exact trigger on {stem, ending} and lexeme | Citation | Example |
|---|---|---|---|---|---|
| 1 | `la.orth.io-drop-i` | Verbs in -iō drop the i of the stem before a consonant, ĭ, ī or ĕ: {before} → {after}. | `stemClass: 'io'`, stem ends in i, ending starts with a consonant, i, ī or e not followed by long mark (ē keeps i); not for gerund, gerundive, present participle (A&G's exceptions; the future starts with a or ē and is unaffected) | AG/forms-conjugation §179.c.1; AG/3rd-conjugation-io-verbs §188; B§109 | *capi + is → capis*; *capi + ere → capere*; *capi + ī → capī*; but *capi + endus → capiendus* |
| 2 | `la.orth.eo-root` | The root ī of eō becomes e before a, o and u: {before} → {after}. | `eoRoot` lexemes (*eō*, compounds, *queō, nequeō*), stem ends in ī, ending starts with a, o or u | AG/irregular-verbs-d%C5%8D-e%C5%8D-and-ade%C5%8D §203 fn. 1 | *ī + ō → eō*; *ī + unt → eunt*; *ī + ām → eam* |
| 3 | `la.orth.a-lost` | The stem vowel a is lost before another vowel: {before} → {after}. | stem ends in ā or a (*dō*), ending starts with a vowel | AG/forms-conjugation §179.a.1; AGp 92 fn. 1; AGp 94 fn. 2 | *amā + ō → amō*; *amā + ēs → amēs*; *amā + or → amor* |
| 4 | `la.orth.short-before-vowel` | A vowel before another vowel is short: {before} → {after}. | stem ends in ē or ī, ending starts with a vowel; except `longBeforeVowel` lexemes (*fīō*) when the ending does not start with *er* | AG/quantity-syllables §10.a; B§5 (2.b); AG/irregular-verbs-f%C4%AB%C5%8D §204 | *monē + ō → moneō*; *audī + unt → audiunt*; *fī + unt → fīunt* (kept) |
| 5 | `la.orth.short-before-nt` | A vowel before nt or nd is short: {before} → {after}. | a long vowel immediately before *nt* or *nd* anywhere in stem + ending | AG/quantity-syllables §10.e; AG/verb-endings §167; B§5 (2.a) | *amā + nt → amant*; *amā + ndus → amandus*; *teg + ēnt → tegent* |
| 6 | `la.orth.short-final` | A long vowel is short before a final m, t or r: {before} → {after}. | the last vowel of the word is long and the word ends in vowel + m, t or r | AG/verb-endings §167 | *amā + t → amat*; *amā + bām → amābam*; *teg + ār → tegar*; *amāv + erīt → amāverit* |
| 7 | `la.orth.long-before-ns` | A vowel before ns or nf is long: {before} → {after}. | a short vowel immediately before *ns* / *nf* | AG/quantity-syllables §10.d; B§5 (1.a) | *teg + ens → tegēns*; *audi + ens → audiēns*; *i + ens → iēns* |

Quantity lint (used by tests and by the authority-cell admission rule of §8.3): no long vowel before *nt*, *nd*, or another vowel (except *fī-* before a vowel other than *er*, and Greek names); no short vowel before *ns*, *nf*.

### 4.5 Periphrasis, clause, availability, lexical

Examples (before → after) for these rules are the worked derivations §7.11–7.18 and the availability rows of §8.1–8.2 (*hortārī* passive → `noPassive`; *īre* passive 1sg → `impersonal`; *posse* imperative → `noImperative`).

| id | stage / kind | en message | Trigger | params | Citation |
|---|---|---|---|---|---|
| `la.periphrasis.perfect` | periphrasis / rule | Perfect: the perfect participle with the present of esse. | §6.1 | – | AG/forms-conjugation §179.g; AG/stems §164.3.a; AGp 94; B§102 |
| `la.periphrasis.pluperfect` | periphrasis | Pluperfect: the perfect participle with the imperfect of esse. | §6.1 | – | same |
| `la.periphrasis.future-perfect` | periphrasis | Future perfect: the perfect participle with the future of esse. | §6.1 | – | same |
| `la.periphrasis.perfect-subjunctive` | periphrasis | Perfect subjunctive: the perfect participle with the present subjunctive of esse. | §6.1 | – | same |
| `la.periphrasis.pluperfect-subjunctive` | periphrasis | Pluperfect subjunctive: the perfect participle with the imperfect subjunctive of esse. | §6.1 | – | same |
| `la.periphrasis.perfect-infinitive` | periphrasis | Perfect infinitive: the perfect participle with esse. | §6.1 | – | AG/stems §164.3.a; AG/verb-endings §166 table |
| `la.periphrasis.future-infinitive` | periphrasis | Future infinitive: the future participle with esse. | §6.1 | – | AG/stems §164.3.b; AG/deponent-verbs §190.c |
| `la.periphrasis.future-infinitive-passive` | periphrasis | Future passive infinitive: the supine in -um with īrī, the passive infinitive of īre. | §6.1 | – | AG/stems §164.3.c; AG/irregular-verbs-d%C5%8D-e%C5%8D-and-ade%C5%8D §203.a |
| `la.periphrasis.fore` | periphrasis | fore is used for futūrus esse. | *sum* and compounds with `fore` | – | AG/sum §170.a |
| `la.clause.agree-subject` | clause / rule | The participle agrees with the subject: {gender} {number}. | finite compound forms; infinitive compounds with a requested agreement | gender, number: term | AG/forms-conjugation §179.g; B§102 "amātus (-a, -um) sum" |
| `la.clause.agree-impersonal` | clause / rule | Impersonal passive: the participle stands in the neuter singular. | compound passive of a `passive: 'impersonal'` lexeme | – | AG/impersonal-verbs §§207 table, 208.d; AGp 114 "itum est" |
| `la.clause.deponent` | clause / rule | Deponent verb: this passive form has an active meaning. | active target of a deponent | – | AG/deponent-verbs §190 |
| `la.clause.semi-deponent` | clause / rule | Semi-deponent verb: in the perfect system it uses a passive form with active meaning. | perfect-system active target of a semi-deponent | – | AG/deponent-verbs §192 |
| `la.avail.no-passive` | availability / unavailable (`noPassive`) | {before} has no passive: it is deponent or intransitive. | every passive target of deponents, semi-deponents, *fīō*, and lexemes with `passive: 'none'` (*sum* and compounds, *possum, volō, nōlō, mālō*) | – | AG/deponent-verbs §190; AG/sum §170; AG/irregular-verbs-vol%C5%8D-n%C5%8Dl%C5%8D-m%C4%81l%C5%8D §199 |
| `la.avail.impersonal-passive` | availability (`impersonal`) | {before} is intransitive: its passive is used only impersonally, in the third person singular. | `passive: 'impersonal'`, passive target with person ≠ 3 or number ≠ singular; passive imperatives; participle.perfect | – | AG/impersonal-verbs §208.d; AGp 114 |
| `la.avail.impersonal` | availability (`impersonal`) | {before} is impersonal: it has only the third person singular. | `impersonal` lexemes, finite target not 3sg | – | AG/impersonal-verbs §207 |
| `la.avail.no-imperative` | availability (`noImperative`) | {before} has no imperative. | lexeme `lacks` imperative (*possum, volō, mālō*, impersonals) | – | AGp 109–110 |
| `la.avail.no-supine` | availability (`defective`) | {before} has no supine stem, so this form does not exist. | lexeme `lacks` supineStem: perfect participle, supine, perfect-system passive, perfect/future passive infinitive; future participle and future active infinitive too unless the entry lists a future participle | – | AG/deponent-verbs §191.a; AG/classified-lists-verbs-1st-and-2nd-conjugations §210.a |
| `la.avail.no-perfect` | availability (`defective`) | {before} has no perfect stem, so this form does not exist. | lexeme `lacks` perfect: perfect-system active cells, perfect active infinitive | – | AG/defective-verbs §206 |
| `la.avail.no-present` | availability (`defective`) | {before} has only the perfect system. | *coepī, meminī, ōdī*: present-system cells (except *mementō, mementōte*), present participle, gerund, gerundive | – | AG/defective-verbs §205; B§133 |
| `la.avail.no-participle` | availability (`defective`) | {before} has no {tense} participle. | lexeme `lacks` presentParticiple (*mālō*, *sum*, *fīō*) or futureParticiple (*fīō*) | tense: text | AG/sum §170.b; AGp 110, 115 |
| `la.avail.no-gerund` | availability (`defective`) | {before} has no gerund or gerundive. | lexeme `lacks` gerund (*sum* and compounds, *possum, volō, nōlō, mālō*; gerund only for *fīō*) | – | AG/sum §170; AGp 109–110, 115 |
| `la.avail.no-future-imperative-plural` | availability (`defective`) | Passive forms have no future imperative in the second person plural. | imperative.future 2pl, passive target or deponent active target | – | AG/personal-endings §163.b; AGp 94–95; AGp 104 |
| `la.lex.cell` | stem / lexical | {after} is a listed form of {before}. | whole-word cells (§5.1 `cells`) | – | the section of the verb (A&G §§170, 198–205; B§§100, 125–133) |

(`la.avail.no-participle` uses a text param `tense` with values `present` / `future` rendered through `select` in the message; it is not a term, so it is allowed on an unavailable rule.)

### 4.6 Ending sets (data, `paradigms.ts`)

Written in **underlying** form (before §4.4); stem classes a = first (*amā-*), e = second (*monē-*), c = consonant (*teg-*), io (*capi-*), i = fourth (*audī-*). Order 1sg, 2sg, 3sg, 1pl, 2pl, 3pl.

| Cell | a, e | i | c, io |
|---|---|---|---|
| present ind. active | ō, s, t, mus, tis, nt | ō, s, t, mus, tis, **unt** | ō, is, it, imus, itis, unt |
| present ind. passive | or, ris, tur, mur, minī, ntur | or, ris, tur, mur, minī, **untur** | or, eris, itur, imur, iminī, untur |
| imperfect ind. active | bām, bās, bāt, bāmus, bātis, bānt | ēbām, ēbās, ēbāt, ēbāmus, ēbātis, ēbānt | as i |
| imperfect ind. passive | bār, bāris, bātur, bāmur, bāminī, bāntur | ēbār, ēbāris, ēbātur, ēbāmur, ēbāminī, ēbāntur | as i |
| future active | bō, bis, bit, bimus, bitis, bunt | ām, ēs, ēt, ēmus, ētis, ēnt | as i |
| future passive | bor, beris, bitur, bimur, biminī, buntur | ār, ēris, ētur, ēmur, ēminī, ēntur | as i |
| present subj. active | a: ēm, ēs, ēt, ēmus, ētis, ēnt; e: ām, ās, āt, āmus, ātis, ānt | ām, ās, āt, āmus, ātis, ānt | as i |
| present subj. passive | a: ēr, ēris, ētur, ēmur, ēminī, ēntur; e: ār, āris, ātur, āmur, āminī, āntur | ār, āris, ātur, āmur, āminī, āntur | as i |
| imperfect subj. active | rēm, rēs, rēt, rēmus, rētis, rēnt | rēm … | erēm, erēs, erēt, erēmus, erētis, erēnt |
| imperfect subj. passive | rēr, rēris, rētur, rēmur, rēminī, rēntur | rēr … | erēr, erēris, erētur, erēmur, erēminī, erēntur |
| imperative present active 2sg, 2pl | –, te | –, te | e, ite |
| imperative present passive 2sg, 2pl | re, minī | re, minī | ere, iminī |
| imperative future active 2sg, 3sg, 2pl, 3pl | tō, tō, tōte, ntō | tō, tō, tōte, untō | itō, itō, itōte, untō |
| imperative future passive 2sg, 3sg, 3pl | tor, tor, ntor | tor, tor, untor | itor, itor, untor |
| infinitive present active / passive | re / rī | re / rī | ere / ī |
| present participle (nom. sg. / oblique stem) | ns / nt- | ens / ent- | ens / ent- |
| gerundive / gerund stem | nd- | end- (dated und-) | end- (dated und-) |
| *eō* and compounds, *queō* (stem ī, class i, but imperfect and future of classes a, e: *ībam, ībō*, A&G §183) | present ō→*eō*, s, t, mus, tis, unt→*eunt*; imperfect bām; future bō; subj. ām→*eam*; imperative –, te; tō, tō, tōte, untō→*euntō* | | |

Perfect system, all classes (perfect stem): perfect ī, istī, it, imus, istis, ērunt (+ ēre literary); pluperfect erām, erās, erāt, erāmus, erātis, erānt; future perfect erō, eris, erit, erimus, eritis, erint; perfect subjunctive erīm, erīs, erīt, erīmus, erītis, erīnt; pluperfect subjunctive issēm, issēs, issēt, issēmus, issētis, issēnt; infinitive isse.

Passive 2sg *-re* variants (`la.end.re`): ris → re, beris → bere, ēris → ēre, āris → āre, eris → ere, rēris → rēre, bāris → bāre.

Declension (`declension.ts`, the shared helper of §6.3):

| | sg nom | gen | dat | acc | abl | voc | pl nom | gen | dat | acc | abl | voc |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| -us masc. | us | ī | ō | um | ō | e | ī | ōrum | īs | ōs | īs | ī |
| -us fem. | a | ae | ae | am | ā | a | ae | ārum | īs | ās | īs | ae |
| -us neut. | um | ī | ō | um | ō | um | a | ōrum | īs | a | īs | a |
| -ns masc./fem. | ns | ntis | ntī | ntem | nte (+ ntī) | ns | ntēs | ntium | ntibus | ntēs (+ ntīs) | ntibus | ntēs |
| -ns neut. | ns | ntis | ntī | ns | nte (+ ntī) | ns | ntia | ntium | ntibus | ntia | ntibus | ntia |
| gerund (neut. sg.) | – | ndī | ndō | ndum | ndō | – | | | | | | |
| supine (masc. sg.) | – | – | – | um | ū | – | | | | | | |

The -ns rows attach to the present-participle stem with its connecting vowel (*amā-ns, ama-ntis*; *teg-ēns, teg-entis*; *capi-ēns, capi-entis*; *i-ēns*, *eō*: oblique *eunt-* lexical).

## 5. Lexicon

### 5.1 Entry type (`lexicon.ts`)

```ts
export type LatinConjugation = 'first' | 'second' | 'third' | 'thirdIo' | 'fourth' | 'irregular';
export type LatinLack = 'present' | 'perfect' | 'supineStem' | 'imperative' | 'presentParticiple' | 'futureParticiple' | 'gerund';
export interface LexicalForm { readonly text: string; readonly usage?: 'standard' | 'literary' | 'dated'; readonly pattern?: string }
export interface LatinEntry {
  readonly present: string | null;                  // 1sg present as A&G prints it: 'amō', 'hortor'; null for coepī, meminī, ōdī
  readonly infinitive: string;                      // 'amāre', 'hortārī', 'coepisse' (defectives keyed by the perfect infinitive)
  readonly perfect?: readonly string[];             // 1sg perfect active, first = preferred: ['iī', 'īvī']; absent for deponents
  readonly supine?: readonly string[];              // 'amātum'; for deponents and semi-deponents the participle's neuter ('hortātum')
  readonly futureParticiple?: readonly string[];    // only when it is not supine stem + ūrus: 'moritūrus', 'ārsūrus'
  readonly conjugation: LatinConjugation;
  readonly voice?: 'deponent' | 'semiDeponent';
  readonly passive?: 'impersonal' | 'none';         // default: personal
  readonly impersonal?: true;
  readonly lacks?: readonly LatinLack[];
  readonly cells?: Readonly<Record<string, readonly LexicalForm[]>>; // whole words, key 'indicative.present.active.2s', 'presentInfinitive', …
  readonly stems?: Readonly<Record<string, string>>;  // special stems: present 'da', presentParticipleOblique 'eunt', gerund 'eund'
  readonly flags?: readonly ('shortImperative' | 'athematic' | 'eoRoot' | 'longBeforeVowel' | 'fore' | 'passiveIsFio')[];
  readonly compound?: { readonly present: string; readonly infinitive: string; readonly perfect?: readonly string[];
    readonly supine?: readonly string[]; readonly prefixes?: readonly string[]; readonly vary?: true };
  readonly gloss?: string;                          // English gloss, only for homographs (§3.6), used as `condition`
  readonly usage?: 'literary' | 'dated';            // paradigm-level label (lavere)
  readonly source: { readonly work: 'ag' | 'bennett' | 'ls'; readonly locator: string };
}
export interface LatinLexeme extends LexemeBase {   // classId, lemma (= infinitive with macrons), auxiliaries: []
  readonly key: string; readonly entry: LatinEntry | null; readonly family: { readonly prefix: string; readonly base: string } | null;
  readonly conjugation: LatinConjugation; readonly stemClass: 'a' | 'e' | 'consonant' | 'io' | 'i';
  readonly voiceClass: 'active' | 'deponent' | 'semiDeponent';
  readonly perfectSystem: 'stem' | 'participle';    // 'participle' for deponents, semi-deponents and fīō (§6.2)
  readonly presentStem: string | null; readonly perfectStems: readonly LexicalForm[]; readonly supineStems: readonly LexicalForm[];
  readonly futureParticipleStems: readonly LexicalForm[]; readonly passive: 'personal' | 'impersonal' | 'none';
  readonly impersonal: boolean; readonly lacks: ReadonlySet<LatinLack>; readonly flags: ReadonlySet<string>;
  readonly cells: Readonly<Record<string, readonly LexicalForm[]>>; readonly principalParts: string; // 'amō, amāre, amāvī, amātum'
}
```

Stored: the principal parts as the authority prints them (A&G §172: 1sg present, infinitive, 1sg perfect, supine / neuter perfect participle) and the exceptions above. Derived: everything else, by §4. Regular first-, second- and fourth-conjugation verbs need no entry for their forms; they get one only to fix stem quantities (§5.3 group H). Every entry records its `source`; `sources.ts` adds `lexiconVerification[lemma] = { url, status: 'ag-print' | 'ls' | 'secondary' }` filled during implementation. No entry is copied from the scraped oracle or from Wiktionary.

### 5.2 Irregular, defective and impersonal entries (60)

| Group | Lemmas (principal parts as printed; [V] = read in A&G/Bennett text this pass) | Source |
|---|---|---|
| *sum* | *sum, esse, fuī, futūrus* — all present-system cells lexical; `fore`; lacks presentParticiple, supineStem (future participle listed), gerund; `passive: 'none'` [V] | A&G §170; B§100 |
| *sum* compounds (10) | *absum (āfuī), adsum (adfuī), dēsum (dēfuī; deesse), īnsum (īnfuī), intersum, obsum (obfuī), praesum, prōsum (prōfuī; prōd- before e), subsum, supersum*; *absēns, praesēns* present participles [V] | A&G §198; B§125 |
| *possum* | *possum, posse, potuī*; participle *potēns* (adjective) listed; lacks imperative, supineStem, gerund [V] | A&G §198.b; AGp 109; B§126 |
| *volō, nōlō, mālō* | *volō, velle, voluī; nōlō, nōlle, nōluī; mālō, mālle, māluī*; present indicative, subjunctive (*velim …*), imperfect subjunctive (*vellem …*), infinitive lexical; *nōn vīs, nōn vult, nōn vultis* as one lexical word each; imperative only *nōlī, nōlīte, nōlītō, nōlītōte, nōluntō*; participles *volēns, nōlēns*, none for *mālō*; no gerund, no supine stem [V] | A&G §199; AGp 109–110; B§130 |
| *ferō* | *ferō, ferre, tulī, lātum*; `athematic`, `shortImperative` [V] | A&G §200; B§129 |
| *edō, comedō* | *edō, edere / ēsse, ēdī, ēsum*; athematic alternatives *ēs, ēst, ēstis, ēsse, ēssem …* (`pattern: 'athematic'`), *edim* (dated) [V] | A&G §201; B§128 |
| *dō* | *dō, dare, dedī, datum*; stem *da* short (`stems.present: 'da'`), cells *dās* (ind. pres. 2sg), *dā* (imp. 2sg) [V] | A&G §202; B§127 |
| *eō* | *eō, īre, iī (īvī), itum*; `eoRoot`; cells for the perfect system with contraction (*iī, īstī, iit, iimus, īstis, iērunt; ieram; ierō; ierim; īssem; īsse*) and *īv-* forms `usage: 'literary', pattern: 'v'`; stems *eunt-* (participle oblique), *eund-* (gerund, gerundive); gerundive neuter only; `passive: 'impersonal'` [V] | A&G §203; AGp 114; B§132 |
| *queō, nequeō* | *queō, quīre, quīvī (quiī), quitum*; like *eō*, lacks imperative, gerund [V text; forms U] | A&G §206.d; B§137 |
| *fīō* | *fīō, fierī, factus sum*; `longBeforeVowel`; *fīmus, fītis* and imperatives *fī, fīte, fītō* `usage: 'dated'` (A&G brackets); future infinitive *factum īrī*; gerundive *faciendus*; lacks presentParticiple, futureParticiple, gerund (not gerundive), supine target; `passive: 'none'`; perfect system via the participle *factus* [V] | A&G §204; AGp 115; B§131 |
| *faciō* | *faciō, facere, fēcī, factum*; `shortImperative`; `passiveIsFio`: passive present-system cells and present passive infinitive are *fīō*'s active forms [V] | A&G §204 |
| *dīcō, dūcō* | regular third conjugation with `shortImperative` [V] | A&G §182 |
| *tollō* | *tollō, tollere, sustulī, sublātum* [V] | A&G §211.f Note |
| defectives | *coepī, coepisse* (*coeptūrus, coeptus*), *meminī, meminisse* (imperative *mementō, mementōte*), *ōdī, ōdisse* (*ōsūrus*), *āiō*, *inquam*, *fārī* (deponent), *quaesō*, *cedo*, *salvē*, *avē* [V] | A&G §§205–206; B§§133–137 |
| impersonals (17) | *licet (licuit, licitum est), oportet (oportuit), decet (decuit), libet (libuit, libitum est), piget (piguit, pigitum est), pudet (puduit, puditum est), paenitet (paenituit), taedet (pertaesum est), miseret, pluit, ningit, tonat, fulgurat, grandinat, rōrat, vesperāscit, lūcīscit* [V lemmas; perfects of *taedet, miseret, ningit* U] | A&G §§207–208 |
| parallel / special | *lavō* (*lāvī; lautum, lōtum, lavātum*), *lavere* (literary), *vēneō* (*vēnum* + *eō*), *ambiō* (regular 4th + *ambībat*) [V] | A&G §§189, 203.d, 211.e |

### 5.3 Principal-part entries (≈ 310), grouped by pattern

All lemmas below are printed with their principal parts in A&G §§191–192, 209–212 [V as DCC text]; the implementer transcribes the parts from the 1903 scans AG133–AG137 (pp. 121–125) and AG115–AG118 (pp. 103–106), which also settles the DCC text's typos (*tenu* = *tenuī*, *morde* = *mordeō*, *nūpsi* = *nūpsī*, *prōmō -mpt* without hyphen), and cross-checks the stem quantities in L&S.

| Group | Lemmas |
|---|---|
| A. 1st conj., irregular perfect/supine (A&G §209.a, 15) | crepō, cubō, dō, domō, fricō, iuvō, micō, necō, plicō (compounds), pōtō, secō, sonō, stō, tonō, vetō |
| B. 2nd conj. keeping ē (§210.b, 5) | dēleō, fleō, neō, vieō, -pleō (compleō …) |
| C. 2nd conj. special (§210.c, 45) | algeō, ārdeō, audeō, augeō, (ab)oleō, caveō, cēnseō, cieō, (cō)nīveō, doceō, faveō, ferveō, foveō, fulgeō, gaudeō, haereō, indulgeō, iubeō, liqueō, lūceō, lūgeō, maneō, misceō, mordeō, moveō, mulceō, mulgeō, pendeō, prandeō, rīdeō, sedeō, soleō, sorbeō, spondeō, strīdeō, suādeō, teneō, tergeō, tondeō, torqueō, torreō, turgeō, urgeō, videō, voveō |
| D. 3rd conj. s-perfect (§211.a, 59) | angō, carpō, cēdō, cingō, claudō, cōmō, coquō, -cutiō, dēmō, dīcō, dīvidō, dūcō, ēmungō, fīgō, fingō, flectō, -flīgō, fluō, frendō, frīgō, gerō, iungō, laedō, -liciō, lūdō, mergō, mittō, nectō, nūbō, pectō, pergō, pingō, plangō, plaudō, plectō, premō, prōmō, quatiō, rādō, regō, rēpō, rōdō, scalpō, scrībō, sculpō, serpō, spargō, -spiciō, -stinguō, stringō, struō, sūgō, sūmō, surgō, tegō, temnō, tergō, tingō, trahō, trūdō, unguō, ūrō, vādō, vehō, vīvō |
| E. 3rd conj. reduplicated (§211.b, 19) | cadō, caedō, canō, currō, discō, -dō (abdō …), fallō, pangō, parcō, pariō, pellō, pendō, poscō, pungō, sistō, tangō, tendō, tundō |
| F. 3rd conj. -uī / -vī (§211.c, 31) | alō, cernō, colō, compēscō, cōnsulō, crēscō, -cumbō, depsō, fremō, gemō, gignō, metō, molō, occulō, (ad)olēscō, pāscō, percellō, pōnō, quiēscō, rapiō, scīscō, serō (sow), serō (entwine), sinō, spernō, sternō, stertō, strepō, suēscō, texō, tremō, vomō |
| G. 3rd conj. -īvī, lengthened, unchanged (§211.d–f, 63) | arcessō, capessō, cupiō, incessō, lacessō, petō, quaerō, rudō, sapiō, terō; agō, capiō, edō, emō, faciō, fodiō, frangō, fugiō, fundō, iaciō, lavō, legō, linō, linquō, nōscō, rumpō, scabō, vincō; acuō, arguō, bibō, -cendō, (con)gruō, cūdō, facessō, -fendō, findō, īcō, imbuō, luō, mandō, metuō, minuō, -nuō, pandō, pīnsō, prehendō, ruō, scandō, scindō, sīdō, solvō, spuō, statuō, sternuō, strīdō, suō, tribuō, (ex)uō, vellō, verrō, vertō, vīsō, volvō; no perfect: claudō (limp), fatīscō, hīscō, vergō |
| H. 4th conj. special (§212.b, 17) | amiciō, aperiō, comperiō, farciō, feriō, fulciō, hauriō, operiō, reperiō, saepiō, saliō, sanciō, sarciō, sentiō, sepeliō, veniō, vinciō |
| I. Deponents (§191, 34 + §191.a, 7) | adsentior, apīscor (adipīscor), dēfetīscor, expergīscor, experior, fateor, fruor, fungor, gradior (-gredior), īrāscor, lābor, loquor, mētior, -minīscor, morior, nancīscor, nāscor, nītor, oblīvīscor, opperior, ōrdior, orior, pacīscor, patior (-petior), -plector, proficīscor, queror, reor, revertor, ringor, sequor, tueor, ulcīscor, ūtor; no supine: dēvertor, diffiteor, fatīscor, līquor, medeor, reminīscor, vescor |
| J. Semi-deponents (§192, 4 + compounds) | audeō (ausus), gaudeō (gāvīsus), fīdō (fīsus), soleō (solitus); cōnfīdō, diffīdō |
| K. Regular deponents and verbs whose stem quantity matters (≈ 45; quantities [U], verify in L&S) | hortor, mīror, cōnor, arbitror, cōnspicor, mōror, precor, vēnor, polliceor, vereor, mereor, misereor, largior (largītus [V] L&S), partior, potior, mentior, blandior, sortior; cēnō, clāmō, cōgitō, cūrō, dēclārō, dōnō, ēducō, exīstimō, explōrō, fēstīnō, iūdicō, labōrō, līberō, mōnstrō, mūtō, nāvigō, nōminō, nūntiō, ōrnō, ōrō, pūgnō, rēgnō, sānō, spērō, vāstō, vītō; audiō, dormiō, fīniō, mūniō, nesciō, sciō, serviō |

Counts to pin in Task 2 after transcription: groups A–H about 255 (the lists as printed, minus lemmas already in §5.2), I–J 47, K about 45, §5.2 about 60, families 32 (§3.4 table). The approved design's "about 250 principal-part entries" becomes about 300 because A&G's own lists are taken whole.

### 5.4 Side lists (all in `lexicon.ts`, each entry cited)

| List | Members | Citation |
|---|---|---|
| homographs | §3.6 | LS per lemma |
| no-inherit | §3.4 | A&G §§203.d, 211 fn. 2; LS |
| `passive: 'impersonal'` (intransitive) | eō (simple), veniō, currō, cadō, stō, sedeō, iaceō, pūgnō, ambulō, parcō, noceō, pāreō, faveō, serviō, studeō, persuādeō, resistō; compounds of *eō* except *adeō, ineō, obeō, praetereō, subeō, trānseō, circumeō* (transitive, full passive) | A&G §§203.a, 208.d; LS (U per lemma) |
| `lacks: ['supineStem']` | the §§209–212 entries printed with "—" for the supine (e.g. *micō, tonō, algeō, angō, canō, discō, poscō, compēscō, fremō, gemō, metuō, rēpō, serpō, strepō, tremō, vomō, capessō, rudō, sapiō, scabō, spuō, sternuō, strīdō, fulgeō, lūceō, lūgeō, turgeō, urgeō, ferveō, sorbeō, liqueō, cōnīveō, strīdeō*), §191.a deponents, A&G §210.a (*arceō, careō, egeō, timeō*) | A&G §§191.a, 209–212 |
| `futureParticiple` exceptions | ārdeō *ārsūrus*, hauriō *hausūrus*, pariō *paritūrus*, ruō *ruitūrus*, iuvō *iuvātūrus*, lavō *lavātūrus*, secō *secātūrus*, fruor *fruitūrus*, morior *moritūrus*, orior *oritūrus*, ōdī *ōsūrus*, sum *futūrus*, parcō *parsūrus*, stō *-stātūrus* | A&G §§191, 209–212; B§119.4 |
| `shortImperative` | dīcō, dūcō, faciō, ferō and compounds; not *-ficiō* | A&G §182 |
| `eoRoot` | eō and compounds, queō, nequeō | A&G §203 fn. 1, §206.d |

## 6. Periphrases and clause

### 6.1 Compound tenses (`periphrasis.ts`)

Non-finite form ids of the Latin grammar (`Cell.form`): `presentInfinitive`, `presentInfinitivePassive`, `perfectInfinitive`, `presentParticiple`, `perfectParticiple`, `futureParticiple`, `gerundive`, `gerund`, `supine`, `fore`. Voice is part of the form id, because a chain element cannot carry a voice. No periphrasis uses `perfectAuxiliary` (`LexemeBase.auxiliaries` is `[]`); every chain names *esse* or *īre* by lemma, so `variant.auxiliary` reports `'esse'` (or `'īre'`), and `fore` reports `null`.

`PP` = `{ verb: 'main', nonFinite: 'perfectParticiple', agree: true }`; `ESSE(m, t)` = `{ verb: { lemma: 'esse' }, finite: { mood: m, tense: t } }`.

| Target (mood/tense/voice) | Chain | `applies(lexeme)` | Rule |
|---|---|---|---|
| indicative/perfect/passive | PP, ESSE(indicative, present) | every lexeme (availability removes deponents etc.) | `la.periphrasis.perfect` |
| indicative/perfect/active | PP, ESSE(indicative, present) | `perfectSystem === 'participle'` (deponent, semi-deponent, *fīō*) | `la.periphrasis.perfect` |
| indicative/pluperfect/passive, /active | PP, ESSE(indicative, imperfect) | as above | `la.periphrasis.pluperfect` |
| indicative/future_perfect/… | PP, ESSE(indicative, future) | as above | `la.periphrasis.future-perfect` |
| subjunctive/perfect/… | PP, ESSE(subjunctive, present) | as above | `la.periphrasis.perfect-subjunctive` |
| subjunctive/pluperfect/… | PP, ESSE(subjunctive, imperfect) | as above | `la.periphrasis.pluperfect-subjunctive` |
| infinitive/perfect/passive, /active | PP, `{ verb: { lemma: 'esse' }, nonFinite: 'presentInfinitive' }` | passive: every lexeme; active: `perfectSystem === 'participle'` | `la.periphrasis.perfect-infinitive` |
| infinitive/future/active | `{ verb: 'main', nonFinite: 'futureParticiple', agree: true }`, *esse* `presentInfinitive` | every lexeme except *fīō* | `la.periphrasis.future-infinitive` |
| infinitive/future/active (*esse*) | `{ verb: 'main', nonFinite: 'fore', agree: true }` | `flags.fore` | `la.periphrasis.fore` |
| infinitive/future/passive | `{ verb: 'main', nonFinite: 'supine' }`, `{ verb: { lemma: 'īre' }, nonFinite: 'presentInfinitivePassive' }` | every lexeme | `la.periphrasis.future-infinitive-passive` |
| infinitive/future/active (*fīō*) | same chain as the line above | `entry.infinitive === 'fierī'` | `la.periphrasis.future-infinitive-passive` |

`fore` is invariable: its lexical cell returns *fore* for every agreement, and it is `agree: true` only so that it appears once per requested agreement like *futūrus esse* (the oracle cell "futūrum esse / fore" has an accusative agreement).

### 6.2 `cellOf(target, lexeme)` per class

| Target | ordinary verb (*amō*) | deponent (*hortor*) | semi-deponent (*audeō*) | *fīō* |
|---|---|---|---|---|
| present system, active (ind., subj., imp.) | finite cell, no voice | finite cell **`voice: 'passive'`** (passive endings) | finite cell | finite cell (lexical where listed) |
| present system, passive | finite cell `voice: 'passive'` | — (`la.avail.no-passive`, cellOf not asked) | — (`no-passive`) | — |
| perfect system, active | finite cell on the perfect stem | **null** → `PP + esse` periphrasis (`applies`) | **null** → periphrasis | **null** → periphrasis |
| perfect system, passive | **null** → periphrasis | — | — | — |
| infinitive present active / passive | `presentInfinitive` / `presentInfinitivePassive` | `presentInfinitivePassive` / — | `presentInfinitive` / — | lexical *fierī* / — |
| infinitive perfect active | `perfectInfinitive` | null → periphrasis | null → periphrasis | null → periphrasis |
| infinitive perfect passive, future (both) | null → periphrasis | active only | active only | active only (*factum īrī*) |
| participles, gerundive, gerund, supine | `presentParticiple`, `perfectParticiple`, `futureParticiple`, `gerundive`, `gerund`, `supine` | same | same | `perfectParticiple`, `gerundive`; others unavailable |
| chain element ESSE(m, t) asked with *esse* | the simple finite cell of *sum* | | | |

### 6.3 Agreement (`clause.agreements(context)`) and the declension helper

`declension.ts` exports `declineUs(stem, agreement): Fork<string>` and `declineNs(nominative, obliqueStem, agreement): Fork<string>` from the tables of §4.6 with their steps (`la.end.decline-us`, `la.end.decline-ns`, plus the tagged second forms `la.end.ablative-i`, `la.end.accusative-is`), and `agreementsFor(form, query, lexeme): readonly Agreement[]` below. The citation agreement records no declension step (the participle's own ending step explains it).

| Agreeing cell (`context.agreeing[0].form`) | `query.agreement` absent (citation) | `query.agreement` present (filtered later by `acceptsForm`) |
|---|---|---|
| `perfectParticiple` / `futureParticiple` in a **finite** compound | the subject: `target.gender` or the slot's gender, else masculine, feminine, neuter; `number` = target's; `case: 'nominative'`; step `la.clause.agree-subject` | same (the `agreement` option does not filter finite forms) |
| same, impersonal passive (`passive: 'impersonal'`) | `{ neuter, singular, nominative }`, step `la.clause.agree-impersonal` | same |
| participle in an **infinitive** compound, *fore* | `{ masculine, singular, nominative }` (A&G table "-tus (-ta, -tum) esse"; B§101 "amātūrus esse") | 3 genders × 2 numbers × cases nominative, accusative; impersonal passive: neuter singular only |
| simple `presentParticiple`, `perfectParticiple`, `futureParticiple`, `gerundive` | `{ masculine, singular, nominative }`; impersonal gerundive (*eundum*): `{ neuter, singular, nominative }` | 3 × 2 × 6 cases; impersonal gerundive: neuter singular nominative and accusative |
| `gerund` | `{ neuter, singular, genitive }` | neuter singular × genitive, dative, accusative, ablative |
| `supine` | `{ masculine, singular, accusative }` | masculine singular × accusative, ablative |

`acceptsForm(query, form)`: when `query.agreement` is present and the form's target is non-finite with an agreement, keep it only if every given key (`gender`, `number`, `case`) matches; finite forms are always kept. Ordering inside a target follows the fork order above: masculine, feminine, neuter; singular before plural; cases in the order nominative, genitive, dative, accusative, ablative, vocative.

### 6.4 Assembly (`clause.assemble`)

- No subject part: every slot has `pronoun: null` (pro-drop); targets still carry `subject`.
- Word order as recipe: participle, then the form of *esse* (*amātus sum*, *amātum esse*, *amātum īrī*), as both grammars print. No clitics, reflexives or particles; no sandhi (`rendering.sandhi` → null; elision is metrical, not orthographic).
- A deponent's active form (simple or compound) gets the form-level step `la.clause.deponent`; a semi-deponent's perfect-system active form gets `la.clause.semi-deponent`.
- Part features for non-finite words (`wordPart(rendering, word, features)`): `presentInfinitive` → `{ mood: 'infinitive', tense: 'present', verbForm: 'infinitive' }`; `presentInfinitivePassive` → same + `voice: 'passive'`; `perfectInfinitive` → tense `perfect`; `presentParticiple` → `{ participle, present, presentParticiple }`; `perfectParticiple` → `{ participle, perfect, pastParticiple }`; `futureParticiple` → `{ participle, future, futureParticiple }`; `gerundive` → `{ participle, gerundive, gerundive }`; `gerund` → `{ gerund, present, gerund }`; `supine` → `{ supine, present, supine }`; `fore` → `{ infinitive, future, infinitive }`. A deponent's finite parts carry `voice: 'passive'` (the morphology) while the target is active.
- Negative imperative: none (out of scope, §2.4).

### 6.5 Rendering

`onset`: vowel when the first letter is a vowel (with or without macron), else consonant; `sandhi`: null; `bareOmits`: false.

### 6.6 Comparison key

`normalizeForComparison` for Latin = `latinKey` (§3.2): `amāverīs`, `amaveris` and `AMAVERIS` compare equal; `iubeō` = `jubeo`. `v`/`u` are not merged (A&G and Bennett write consonantal *v*). If the root API has no `normalizeForComparison(language, text)` when this pack is built, Task 1 adds it as the smallest shared change: optional `PackRendering.compareKey?(text): string` (default: NFC, lowercase, trimmed, single spaces) and a root export delegating to it.

## 7. Worked derivations (English explanation as a learner reads it)

Rule ids in brackets, in recorded order; classification steps are in `analysis`, word steps on the part, form steps on the form.

1. **amat** (*amāre*, indicative present active 3sg). The verb: *amāre* is in the lexicon: amō, amāre, amāvī, amātum [`la.classify.lexicon`]. Present stem: *amāre* without -re gives *amā-* [`la.stem.present`]. Present active, 3rd person singular: add the personal ending -t [`la.end.personal`]: *amāt*. A long vowel is short before a final m, t or r: *amāt* → *amat* [`la.orth.short-final`].
2. **amō**: *amā-* + -ō [`la.stem.present`, `la.end.personal`]; the stem vowel a is lost before another vowel: *amāō* → *amō* [`la.orth.a-lost`].
3. **moneō / monent**: *monē-* + -ō; a vowel before another vowel is short: *monēō* → *moneō* [`la.orth.short-before-vowel`]. *monē-* + -nt: a vowel before nt is short: *monēnt* → *monent* [`la.orth.short-before-nt`].
4. **tegunt / tegeris / tegēris**: *teg-* + third-conjugation ending -unt [`la.stem.present`, `la.end.thematic`] → *tegunt*. Present passive 2sg: -eris → *tegeris*; future passive 2sg: -ēris [`la.end.future-e`] → *tegēris*; literary second forms *tegere*, *tegēre* [`la.end.re`].
5. **capis / capiunt / capiendus** (*capere*, 1sg *capiō*): *capi-* + -is: verbs in -iō drop the i before a consonant, ĭ, ī or ĕ: *capiis* → *capis* [`la.orth.io-drop-i`]; *capi-* + -unt stays *capiunt*; the gerundive keeps the i: *capi-* + -endus → *capiendus* [`la.end.gerundive`, no io step].
6. **audiunt / audiēbam / audiēns**: *audī-* + -unt [`la.end.thematic`]: *audīunt* → *audiunt* [`la.orth.short-before-vowel`]. *audī-* + -ēbām [`la.end.imperfect`] → *audiēbām* [`short-before-vowel`] → *audiēbam* [`short-final`]. *audī-* + -ens [`la.end.present-participle`] → *audiens* [`short-before-vowel`] → *audiēns* [`la.orth.long-before-ns`].
7. **amābunt vs teget**: first conjugation future: *amā-* + -bunt [`la.end.future-b`]. Third conjugation: *teg-* + -ēt [`la.end.future-e`] → *teget* [`short-final`].
8. **amem**: present subjunctive: *amā-* + -ēm [`la.end.subjunctive`]; *amāēm* → *amēm* [`la.orth.a-lost`] → *amem* [`la.orth.short-final`].
9. **tēxī** (*tegere*, lexicon): perfect stem from the principal part *tēxī*: *tēx-* [`la.stem.perfect`]; perfect: add -ī [`la.end.perfect`].
10. **trexī** (invented *tregere*): the verb: *tregere* ends in -ere: third conjugation [`la.classify.conjugation`]; assumptions: no macron marks the e, so third conjugation [`la.classify.assume-third`]; not an -iō verb [`la.classify.assume-consonant-stem`]; stem vowels left unmarked [`la.classify.assume-quantity`]; full passive [`la.classify.assume-passive`]; s-perfect assumed [`la.classify.default-sigmatic`]. Word: perfect stem *treg-* + -s- gives *tregs-* [`la.stem.perfect-regular`]; before the s of the perfect, g becomes x: *tregs-* → *trex-* [`la.stem.s-junction`]; add -ī [`la.end.perfect`] → *trexī*.
11. **amāta est** (`subject: '3sg.f'`, perfect passive): form: Perfect: the perfect participle with the present of esse [`la.periphrasis.perfect`]; the participle agrees with the subject: feminine singular [`la.clause.agree-subject`]. Words: *amāt-* (supine stem) [`la.stem.supine`], perfect participle [`la.end.perfect-participle`], nominative feminine singular: -a [`la.end.decline-us`] → *amāta*; *est* is a listed form of *esse* [`la.lex.cell`]. Unfiltered, the same target gives *amātus est*, *amāta est*, *amātum est* (agreement m, f, n).
12. **hortātus sum** (deponent, indicative perfect **active**): the verb has a passive infinitive: deponent [`la.classify.deponent`]. `cellOf` returns null for its perfect, so the deponent periphrasis applies [`la.periphrasis.perfect`]; agreement [`la.clause.agree-subject`]; deponent verb: this passive form has an active meaning [`la.clause.deponent`]. The passive target says: *hortārī* has no passive [`la.avail.no-passive`].
13. **hortor**: present stem *hortā-* (drop -rī) [`la.stem.present`]; present active (deponent: passive endings) 1sg -or [`la.end.personal`, voice passive]; *hortāor* → *hortor* [`la.orth.a-lost`]; form step [`la.clause.deponent`].
14. **dūc** vs invented **dūcā**: *dūcere* is in the lexicon; present imperative: add -e [`la.end.imperative`] → *dūce*; *dūcere* drops the -e of the imperative singular [`la.end.short-imperative`] → *dūc*. Invented *dūcāre* is first conjugation [`la.classify.conjugation`] and is not listed, so its imperative is *dūcā* [`la.end.imperative`] with no short-imperative step.
15. **fert / ferunt / ferrī**: like ferō, this verb adds endings in s, t and r straight to the root: *fer-* + -t → *fert* [`la.end.athematic`]; *fer-* + -rī → *ferrī* [`la.end.athematic`]. 3pl: the long-stem ending -nt does not start with s, t or r, so the third-conjugation ending is used: *fer-* + -unt → *ferunt* [`la.end.thematic`].
16. **eunt / ībō**: stem *ī-* [`la.stem.present`] + -unt [`la.end.thematic`]; the root ī of eō becomes e before a, o and u: *īunt* → *eunt* [`la.orth.eo-root`]. Future *ī-* + -bō [`la.end.future-b`] → *ībō*.
17. **itum est** (*īre*, passive perfect 3sg): *īre* is intransitive: impersonal passive [`la.avail.impersonal-passive` for every other person]; Perfect [`la.periphrasis.perfect`]; impersonal passive: the participle stands in the neuter singular [`la.clause.agree-impersonal`] → *itum est*.
18. **amātūrum esse** (`agreement: { gender: 'masculine', number: 'singular', case: 'accusative' }`): Future infinitive: the future participle with esse [`la.periphrasis.future-infinitive`]; *amāt-* + -ūrus [`la.end.future-participle`], accusative masculine singular -um [`la.end.decline-us`] → *amātūrum*; *esse* [`la.lex.cell`]. Without `agreement` the citation form is *amātūrus esse*.
19. **amantis**: *amā-* + -ns, oblique *-nt-* [`la.end.present-participle`]; genitive masculine singular -ntis [`la.end.decline-ns`] → *amāntis* → *amantis* [`la.orth.short-before-nt`].
20. **cōnficiō** (input *conficere*, not listed): *conficere* is cōn- + *faciō*: compounds of *faciō* go -ficiō, -ficere, -fēcī, -fectum [`la.classify.compound`]; the prefix keeps its long ō before f (A&G §10.d) — output *cōnficiō, cōnficere, cōnfēcī, cōnfectum*; imperative *cōnfice* (no short imperative: compounds in -ficiō keep the -e).

## 8. Test data

### 8.1 Invented verbs (expectations written by hand from §§3–6; bare forms)

| Query | Key forms (target → form) | Assumptions (rule ids) | Rules exercised |
|---|---|---|---|
| `blorpāre` | pres. *blorpō, blorpās, blorpat, blorpāmus, blorpātis, blorpant*; impf. *blorpābam*; fut. *blorpābō, blorpābunt*; perf. *blorpāvī, blorpāvērunt* (+ *blorpāvēre* literary); plpf. *blorpāveram*; fut. perf. *blorpāverō*; subj. *blorpem, blorpēs*; impf. subj. *blorpārem*; perf. subj. *blorpāverim, blorpāverīs*; imp. *blorpā, blorpāte*; fut. imp. *blorpātō, blorpantō*; passive *blorpor, blorpāris* (+ *blorpāre*), *blorpantur*; perf. pass. *blorpātus / blorpāta / blorpātum est*; inf. *blorpāre, blorpārī, blorpāvisse, blorpātus esse, blorpātūrus esse, blorpātum īrī*; part. *blorpāns* (gen. *blorpantis*), *blorpātus*, *blorpātūrus*, gerundive *blorpandus*; gerund *blorpandī*; supine *blorpātum, blorpātū* | `assume-quantity`, `assume-passive`, `default-parts` | a-lost, short-final, short-before-nt, ere, re |
| `flūdēre` | *flūdeō, flūdēs, flūdet, flūdent*; *flūdēbam*; *flūdēbō*; *flūdeam*; *flūdērem*; *flūdē, flūdēte*; *flūdētō, flūdentō*; passive *flūdeor, flūdēris, flūdētur*; *flūdērī*; perf. *flūduī*; supine *flūditum*; *flūditus sum*; part. *flūdēns, flūdentis*; gerundive *flūdendus*; fut. part. *flūditūrus* | `assume-quantity`, `assume-passive`, `default-parts` | short-before-vowel, short-before-nt |
| `tregere` | *tregō, tregis, tregit, tregimus, tregitis, tregunt*; *tregēbam*; fut. *tregam, tregēs, treget, tregent*; subj. *tregam, tregās*; *tregerem*; *trege, tregite*; *tregitō, treguntō*; passive *tregor, tregeris, tregitur, treguntur*; fut. pass. 2sg *tregēris*; *tregī*; perf. *trexī*; supine *trectum*; *trectus sum*; *trectūrus*; *tregēns, tregentis*; *tregendus* (+ *tregundus* dated); *tregendī* | `assume-third`, `assume-consonant-stem`, `assume-quantity`, `assume-passive`, `default-sigmatic` | thematic, future-e, s-junction, t-junction, long-before-ns |
| `tregere` + `stems: { present: 'tregeō' }` | second conjugation: *tregeō, tregēs, treget*; *tregēbam*; *tregēbō*; *treguī*; *tregitum* | `assume-quantity`, `assume-passive`, `default-parts` (no `assume-third`) | |
| `blapere` + `stems: { present: 'blapiō' }` | *blapiō, blapis, blapit, blapimus, blapitis, blapiunt*; *blapiēbam*; *blapiam, blapiēs*; subj. *blapiam, blapiās*; *blaperem*; *blape, blapite*; *blapitō, blapiuntō*; *blapior, blaperis, blapitur, blapiuntur*; *blapī*; *blapiēns, blapientis*; *blapiendus*; *blapiendī*; perf. *blapsī*; supine *blaptum* | `assume-quantity`, `assume-passive`, `default-sigmatic` | io-drop-i (incl. its exceptions), io |
| `plundīre` | *plundiō, plundīs, plundit, plundīmus, plundītis, plundiunt*; *plundiēbam*; *plundiam, plundiēs*; subj. *plundiam, plundiās*; *plundīrem*; *plundī, plundīte*; *plundītō, plundiuntō*; *plundior, plundīris, plundītur, plundiuntur*; *plundīrī*; *plundiēns, plundientis*; *plundiendus*; perf. *plundīvī*; supine *plundītum* | `assume-quantity`, `assume-passive`, `default-parts` | short-before-vowel |
| `blorpārī` | active: *blorpor, blorpāris* (+ *blorpāre*), *blorpātur, blorpāmur, blorpāminī, blorpantur*; *blorpābar*; *blorpābor, blorpāberis*; *blorper, blorpēris*; *blorpārer*; imp. *blorpāre, blorpāminī*; fut. imp. *blorpātor, blorpātor, blorpantor* (2pl unavailable); perf. *blorpātus sum*; inf. *blorpārī, blorpātus esse, blorpātūrus esse*; *blorpāns*; *blorpātūrus*; *blorpātus*; *blorpandus*; *blorpandī*; *blorpātum*; every passive target `noPassive` | `assume-quantity`, `default-parts` (no `assume-passive`) | deponent, clause.deponent, no-passive, no-future-imperative-plural |
| `trapī` | *trapor, traperis, trapitur, trapimur, trapiminī, trapuntur*; *trapēbar*; *trapar, trapēris*; subj. *trapar, trapāris*; *traperer*; imp. *trapere, trapiminī*; *trapitor, trapuntor*; *traptus sum*; *trapēns*; *trapendus*; *traptum* | `assume-consonant-stem`, `assume-quantity`, `default-sigmatic` | t-junction (p + t) |
| `mundīrī` | *mundior, mundīris, mundītur, mundīmur, mundīminī, mundiuntur*; *mundiēbar*; *mundiar, mundiēris*; *mundīrer*; *mundīre, mundīminī*; *mundītor, mundiuntor*; *mundītus sum*; *mundiēns*; *mundiendus* | `assume-quantity`, `default-parts` | |
| `dūcāre` (look-alike of *dūcō*) | imp. *dūcā*, never *dūc*; perf. *dūcāvī* | `assume-quantity`, `assume-passive`, `default-parts` | no `short-imperative` |
| `recapere` | third conjugation, *recapiō* not derived: *recapō, recapis*; perf. *recapsī* | `assume-third`, `assume-consonant-stem`, … | not a compound (§3.4) |
| `bluere` + `stems: { present: 'bluō' }` | perf. *bluī*; supine *blūtum* | `default-uo` | |
| `flēscere` | perf. *flēvī*; supine *flētum* (the input has a macron, so no `assume-third`) | `assume-consonant-stem`, `default-sco` | |
| `frolere` | perf. *froluī*; supine *frolitum* | `assume-third`, `default-u` | |
| `amārī` | `INVALID_INFINITIVE` (passive infinitive of *amāre*) | – | §3.2 step 3 |
| `blesse`, `trānsesse` | `INVALID_INFINITIVE` | – | §3.2 step 4; *trāns* is not on *sum*'s prefix list |

### 8.2 Real verbs outside both oracles (principal parts [V] A&G lists; derived forms by rule)

| Verb | Expected forms | Verified against |
|---|---|---|
| *secō* | *secuī, sectum*, fut. part. *secātūrus* | A&G §209.a fn. 1; B§119.4 |
| *crepō* | *crepuī, crepitum* | A&G §209.a |
| *vetō* | *vetuī, vetitum* | A&G §209.a |
| *augeō* | *auxī, auctum*; *auxeram*; *auctus sum* | A&G §210.c |
| *rīdeō* | *rīsī, rīsum* | A&G §210.c, §164 fn. |
| *claudō* | *clausī, clausum*; compound *inclūdō, inclūsī, inclūsum* | A&G §211.a; §3.4 family |
| *gerō* | *gessī, gestum* | A&G §211.a |
| *vīvō* | *vīxī, vīctum* | A&G §211.a |
| *trahō* | *trāxī, trāctum* | A&G §211.a |
| *caedō* | *cecīdī, caesum*; compound *occīdō, occīdī, occīsum* | A&G §211.b; §3.4 |
| *cadō* | *cecidī, cāsum*; compound *occidō, occidī, occāsum* | A&G §211.b |
| *tangō* | *tetigī, tāctum*; *contingō, contigī, contāctum* | A&G §211.b |
| *quaerō* | *quaesīvī, quaesītum*; *requīrō, requīsīvī* | A&G §211.d |
| *frangō* | *frēgī, frāctum* | A&G §211.e |
| *vertō* | *vertī, versum* | A&G §211.f |
| *sepeliō* | *sepelīvī, sepultum* | A&G §212.b |
| *hauriō* | *hausī, haustum*, *hausūrus* | A&G §212.b |
| *oblīvīscor* | *oblītus sum*; *oblīvīscī* | A&G §191 |
| *orior* | *ortus sum*, *oritūrus*; *orīrī* | A&G §191; B§119.4 |
| *fīdō* | *fīdō, fīdere, fīsus sum*: *fīdēbam, fīsus sum* | A&G §192 |
| *prōsum* | *prōsum, prōdes, prōdest, prōsumus, prōdestis, prōsunt; prōderam; prōfuī; prōdesse* | A&G §198.a; B§125 |
| *possum* imperative | `noImperative` | AGp 109 |
| *mālō* participle | `defective` | AGp 110 |
| *coepī* | *coepistī, coeperam, coepisse, coeptūrus*; present `defective` | A&G §205; B§133 |
| *meminī* | imp. *mementō, mementōte* | B§133 |
| *faciō* passive | *fīō, fīs, fit*; *factus sum*; *fierī*; imp. *fac* | A&G §204 |
| *afferō* | *attulī, allātum*; *affert* | A&G §200.a |
| *adeō* passive | *adeor, adīris, adītur, adīmur, adīminī, adeuntur*; *aditus sum*; *adīrī* | AGp 114 |

### 8.3 Authority cells (`tests/goldens/la/authority/*.json`)

Exact expectations only for forms a grammar prints, each file citing its section and page; never generated by the engine; transcribed by hand from the 1903 A&G scans (and Bennett's text, cross-read). File format:

```json
{ "work": "ag", "section": "§184", "pages": "92–95", "scan": ["https://dcc.dickinson.edu/sites/default/files/AG104.jpg"],
  "verb": "amāre", "query": { "language": "la", "infinitive": "amāre" },
  "cells": [ { "mood": "indicative", "tense": "present", "voice": "active", "subject": "3sg", "forms": ["amat"] } ],
  "excluded": [ { "mood": "infinitive", "tense": "perfect", "voice": "active", "printed": "amāsse", "reason": "contracted perfect, out of scope" } ],
  "disputed": [ { "mood": "subjunctive", "tense": "perfect", "voice": "active", "subject": "2sg", "printed": "amāveris", "other": "amāverīs (Bennett §101)", "reason": "authorities differ on the quantity of -eri-; the engine follows Bennett" } ],
  "transcribedBy": "<initials>", "checkedAgainst": "AG104–AG107 scans" }
```

Admission rule: a printed form becomes a cell when it passes the quantity lint of §4.4; a form both grammars print differently goes to `disputed` with both readings; a Bennett form that only Gutenberg's text has (no A&G counterpart) needs the lint and, if it fails, goes to `excluded` as a transcription error (list of known ones in §1.1). Compound forms printed as "amātus (-a, -um) sum" become three cells with agreement.

| File | Section, pages, scans | Content |
|---|---|---|
| `ag-170-sum.json` | §170, pp. 81–83, AG093–AG095 | *sum*: all printed cells incl. *forem*, *fore*; *fuam* to `excluded` |
| `ag-184-amo.json` | §184, pp. 92–95, AG104–AG107 | active and passive; *amāsse* excluded; perfect subjunctive disputed |
| `ag-185-moneo.json`, `ag-186-tego.json`, `ag-187-audio.json`, `ag-188-capio.json` | pp. 96–103, AG108–AG115 | same layout |
| `ag-190-deponents.json` | pp. 103–106, AG115–AG118 | *mīror, vereor, sequor, partior* (and the p. 105 -iō deponent if printed) |
| `ag-192-semideponents.json` | p. 106 | principal parts *audeō ausus, gaudeō gāvīsus, fīdō fīsus, soleō solitus* |
| `ag-198-possum-prosum.json`, `ag-199-volo.json`, `ag-200-fero.json`, `ag-201-edo.json`, `ag-202-do.json`, `ag-203-eo.json`, `ag-204-fio.json`, `ag-205-defective.json`, `ag-207-impersonal.json` | pp. 108–120 | printed cells only; bracketed *fīō* forms with `usage: 'dated'` |
| `ag-209-212-principal-parts.json` | pp. 121–125, AG133–AG137 | per lemma: 1sg present, 1sg perfect, supine (from the printed stem + -um), future participle where printed; entries printed with "—" become `unavailable` cells |
| `bennett-100-113.json`, `bennett-124-133.json` | B§§100–113, 124–133 | second reading of the same paradigms plus *regō* and *largior* (§113) |

Expected size: about 1,900 A&G cells and 1,400 Bennett cells (counts pinned in Task 8).

### 8.4 Second oracle: en.wiktionary (`scripts/corpus/sources/wiktionary-la.ts`)

**Presence and parseability [V].** All 65 candidate pages exist and have a Latin `{{la-conj}}` table. In the rendered HTML the table is `div.NavFrame` whose `div.NavHead` reads "Conjugation of *lemma* (…)", with the lemma in `i.mention`; inside, `table.roa-inflection-table`. Every synthetic form is `span.form-of.lang-la` whose class token before `-form-of` is the tag set, `|`-separated (HTML-escaped `&#124;`): person `1|2|3`, number `s|p`, tense `pres|impf|fut|perf|plup|futp|sigm`, voice `act|pass`, mood `ind|sub|imp|inf|part|ger|sup`, case `gen|dat|acc|abl` for gerund and supine; e.g. `2|s|pres|pass|ind`. Several spans in one `td`, separated by `,<br />`, are alternatives; `sup.roa-red-superscript` marks a footnote whose text follows the table. Compound infinitives (*amātūrum esse, amātum īrī, amātum esse*) are plain text in the non-finite block, identified by row header (`present`, `future`, `perfect`, `future perfect`, `perfect potential`) × column (infinitive active, infinitive passive, participle active, participle passive). The compound passive finite rows hold no forms ("amātus + present active indicative of sum") and are skipped. Deponent tables tag the passive-morphology forms `act` (matching this design), perfect participle `perf|act|part`, gerundive `fut|pass|part`. Pages hold several languages (cut the section from `id="Latin"` to the next `h2`) and sometimes several Latin verbs (*dico*: *dīcō*, *dicō*; *edo*: *edō*, *ēdō*; *lego*: *legō*, *lēgō*): select the `NavFrame` whose mention equals the pinned lemma.

**Fetch (pinned).** Latest revision ids: `GET https://en.wiktionary.org/w/api.php?action=query&prop=revisions&titles=<t1>|…&rvprop=ids|timestamp&format=json&formatversion=2`. Rendered table of a pinned revision: `GET https://en.wiktionary.org/w/api.php?action=parse&oldid=<revid>&prop=text&format=json&formatversion=2&maxlag=5`. Templates and modules render at fetch time, so the module revision is pinned too: `Module:la-verb` was revision **93344416** (2026-10-01) and its data module `Module:la-verb/data`; the CLI records both and refuses on a change unless `--accept-modules`. Sequential requests, at least 20 s apart (the Italian plan's pacing; this pass hit HTTP 429 at 2 s and recovered after `Retry-After`), honour `Retry-After`, generic `User-Agent` with no personal or project data. The raw responses are cached outside the repository (`--cache <dir>`); only the parsed fixture is committed.

**Licence and attribution.** Wiktionary text is CC BY-SA 4.0 (`https://creativecommons.org/licenses/by-sa/4.0/`). `tests/fixtures/wiktionary-la.json` records `licence`, an attribution sentence, the retrieval date, the module revisions, and per page `title`, `revid`, `url` (`https://en.wiktionary.org/w/index.php?title=<title>&oldid=<revid>`) and `history` (`…&action=history`).

**Cell mapping.** Finite tags → `{mood, tense, voice, subject: '<p><n>.m'}` (the query is `gender: 'masculine', agreement: {}` as for the scraped oracle); `pres|act|inf` → infinitive/present/active; `perf|act|inf` → infinitive/perfect/active; text cells: future/perfect infinitive with a participle → agreement `{ masculine, singular, accusative }`, *-um īrī* → no agreement; participles → `{ masculine, singular, nominative }`; `fut|pass|part` → participle.gerundive; gerund → `{ neuter, singular, case }`; supine → `{ masculine, singular, case }`. `unmodelled` (reason codes): rows `sigmatic future`, `sigmatic aorist` (`archaic-sigmatic`, A&G §183); infinitive rows `future perfect` (*amātum fore*) and `perfect potential` (`not-in-catalogue`). Corrections ledger (`scripts/corpus/corrections/wiktionary-la.ts`): (1) drop non-first alternatives of a cell that carries a footnote whose text says "syncopated" (A&G §181) or "pre-classical" / "Old Latin" / "-ier" / "Late Latin" (A&G §183); (2) drop rare alternatives the engine does not generate, each with its authority (e.g. *currī* beside *cucurrī*, *tetinī*, *reperī*, *posīvī*, *postus*, *danunt*, *duim*, *dūce*, *face*, *scī*, *adiistī*); (3) semi-deponent *audeō*: Wiktionary's active perfect *ausī …* (31 cells) → *ausus sum …* (A&G §192); (4) eventual disagreements of class (impersonal passives of *sedeō, cadō, stō, veniō, redeō*: checked cell by cell). Expected from a dry parse: 63 pages, about 5,990 catalogue cells, about 196 unmodelled cells, about 1,100 alternatives, of which about 270 sit in footnoted cells; the ledger is expected at 400–700 cells and is pinned after the first green run.

**Pinned pages (63; revision ids as fetched 2026-11-24).**

| Group | Title (lemma) revid |
|---|---|
| 1st | laudo (laudō) 91253289; voco (vocō) 92157931; do (dō) 95738857; sto (stō) 95667056; iuvo (iuvō) 95812981; lavo (lavō) 93022497; domo (domō) 93027338 |
| 2nd | habeo 95435211; video 95651802; doceo 92132826; teneo 95487886; maneo 92135207; moveo 93757459; sedeo 95661542; iubeo 95373048; deleo (dēleō) 92898473 |
| 3rd | rego 95630481; duco (dūcō) 93525620; dico (dīcō) 93571430; mitto 92143833; scribo (scrībō) 93430203; ago 95833994; lego (legō) 95663605; vinco 93022134; curro 92497249; cado 93529776; pello 95116778; pono (pōnō) 95558372; peto 95747588; tollo 92694110 |
| 3rd -iō | facio 95536661; fugio 95807224; iacio 92164638; cupio 91189872; accipio 90523009 |
| 4th | venio 95454082; sentio 91682652; aperio 92131087; scio 93764232; reperio 95611116 |
| deponents | conor (cōnor) 93741446; miror (mīror) 92504693; loquor 91218125; utor (ūtor) 92157735; nascor (nāscor) 92691944; morior 95814849; gradior 92533011; experior 93157442; fateor 92133351 |
| semi-deponents | audeo 93011657; gaudeo 92133693 |
| irregular | edo (edō) 95827258; prosum (prōsum) 95315740; absum 90534852; adeo (adeō) 92771498; redeo 90538779; aufero (auferō) 89352052; queo 90134691 |
| defective, impersonal | coepi (coepī) 92552567; memini (meminī) 88835284; odi (ōdī) 93635383; oportet 90779502; pluit 95632538 |

Considered and left out: *soleo* (Wiktionary: "no future, no imperative", active perfect *soluī*, against A&G §192) and *licet* (Wiktionary lists third person plural *licent*, A&G §207 only the singular); both would only fill the ledger. Every verb the approved design names (*laudō, dō, stō, habeō, videō, regō, dūcō, mittō, faciō, fugiō, veniō, cōnor, loquor, ūtor, prōsum, edō, coepī, meminī*) is in.

## 9. Oracle (scraped pages, directory `Latina/`, 18 files)

All 18 files read in full for this design (with a throwaway reader in the scratch directory, never run inside the source tree).

### 9.1 Page structure

- Files: `amare, audire, capere, esse, ferre, fieri, hortari, ire, largiri, malle, monere, nolle, pati, posse, sequi, tegere, velle, vereri` + `.html`. ASCII bytes with numeric entities (`am&#257;re`); decode as `windows-1252` (`fatal: true`), entities give the macrons. Masculine pages only (feminine and neuter are links, not files).
- The lemma with macrons is the `h1` "Conjugation: am&#257;re". The parser checks it against `LATIN_FILES[name]` (§9.4).
- Body = from that `h1` to `<a id='end'>`. Three blocks introduced by `<td colspan="3" class="tima2|timp2|timz2"><b>ACTIVE | PASSIVE | NO PASSIVE | PARTICIPLE</b></td>`.
- Inside a block, every heading is `div.tima1|tima2|tima3` (active), `div.timp1|timp2|timp3` (passive), `div.timz1` (participles), immediately followed by a value `div` whose own text nodes, split at `<br>`, are the rows; the HTML is malformed (the infinitive value `div`s are not closed, so the next heading is nested inside): take only the value `div`'s child nodes **before its first child `div`**. Drop the trailing empty row. In participle blocks an empty row separates singular from plural.
- Alternatives inside a row: ` / ` (27 rows). Split on ` / ` for the whole row (*futūrum esse / fore* is two complete forms); do not use the shared `alternatives()` (it splits per word and rejects this).
- `-` is an unavailable row.

### 9.2 Cells: order and label map (185 per file)

| # | Heading (block) | Rows → target | Agreement / subject |
|---|---|---|---|
| 0–35 | Indicative present … future perfect (ACTIVE) | 6 rows each, 1sg…3pl → indicative.<tense>/active | `subject: '<p><n>.m'` |
| 36–59 | Subjunctive present, imperfect, perfect, pluperfect (ACTIVE; in the page order present, imperfect, then after the infinitives perfect, pluperfect) | subjunctive.<tense>/active | same |
| 60–62 | Infinitive present / perfect / future (ACTIVE) | infinitive.<tense>/active | present: none; perfect: `{m, sg, accusative}` when the row has two words (deponents, *fīō*), else none; future: `{m, sg, accusative}` |
| 63–64 | Imperative present (ACTIVE) | imperative.present/active 2sg, 2pl | `2sg.m`, `2pl.m` |
| 65–68 | Imperative future (ACTIVE) | imperative.future/active 2sg, 3sg, 2pl, 3pl | `.m` slots |
| 69–137 | the same 69 under PASSIVE | voice passive; infinitive perfect `{m, sg, accusative}`, infinitive future none (supine + *īrī*) | |
| 69–137 | NO PASSIVE (deponents, *esse, posse, velle, nōlle, mālle, fierī*) | 69 synthesized `-` cells (template placeholders) | |
| 138–147 | Participle present active | participle.present: sg nom, gen, dat, acc, abl; pl nom, gen, dat, acc, abl | `{masculine, number, case}` |
| 148–157 | Participle future active | participle.future | same |
| 158–167 | Participle perfect passive | participle.perfect (for deponents it is the perfect participle of active meaning; no remap needed, participles have no voice) | same |
| 168–172 / 173–177 | Gerundive (1st heading: singular; 2nd heading: plural) | participle.gerundive | same |
| 178 | Gerund row 0 (the present infinitive repeated) | `scope: 'unmodelled'`, reason `gerund-nominative` | – |
| 179–182 | Gerund rows 1–4 | gerund genitive, dative, accusative, ablative | `{neuter, singular, case}` |
| 183–184 | Supine | supine accusative, ablative | `{masculine, singular, case}` |
| 168–182 | absent (*esse, velle, nōlle, mālle*) | 15 synthesized `-` cells; row 178 still `unmodelled` | |

Remaps: **none**. The headings name the right slots; the one misleading row (the gerund "nominative") is `unmodelled` rather than remapped, because four files lack the section and a remap to the infinitive would expect a form in a synthesized `-` cell. `unmodelled`: `{ 'gerund-nominative': 'The gerund has no nominative; the infinitive serves (A&G §159.a). The row repeats the present infinitive, which the Infinitive present cell already checks.' }`.

### 9.3 Expected totals

| Item | Count |
|---|---|
| files / infinitives | 18 / 18 |
| cells per file / total | 185 / 3,330 |
| template placeholders (synthesized `-`: 11 NO PASSIVE blocks × 69 + 4 missing participle sections × 15) | 819 |
| literal `-` rows | 200 |
| rows with alternatives | 27 |
| unmodelled cells (gerund row 0; 14 real + 4 synthesized) | 18 |
| remaps | 0 |
| corrections | 254 (107 form + 147 macron) |
| after corrections: unavailable / available / unmodelled | 1,086 / 2,226 / 18 |

### 9.4 Language module

`LATIN_FILES` (file name → infinitive): amare *amāre*, audire *audīre*, capere *capere*, esse *esse*, ferre *ferre*, fieri *fierī*, hortari *hortārī*, ire *īre*, largiri *largīrī*, malle *mālle*, monere *monēre*, nolle *nōlle*, pati *patī*, posse *posse*, sequi *sequī*, tegere *tegere*, velle *velle*, vereri *verērī* (macron-less file names cannot classify *monere*; §3.2). Query: one labelled query `masculine` = `{ language: 'la', infinitive, gender: 'masculine', agreement: {} }`; `applicable` keeps all forms of the cell's target (agreement and subject are part of the target).

### 9.5 Source errors and corrections (`scripts/corpus/corrections/la.ts`)

Form level (the macron-insensitive comparison passes with these alone):

| File | Cells | Source | Correct | Authority | Cells |
|---|---|---|---|---|---|
| hortari, largiri, pati, sequi, vereri | imperative future active 2sg, 3sg, 3pl | *hortāto / hortātor*, *hortanto / hortantor* | *hortātor*, *hortantor* (deponents have only the passive-form future imperative) | AGp 104 (§190); B§113 | 15 |
| esse | subjunctive present 1sg, 2sg, 3sg, 3pl | *sim / fuam*, *sīs / fuas* … | *sim, sīs, sit, sint* (*fuam* is archaic) | AG/sum §170 Note | 4 |
| posse | gerundive (10), gerund rows 1–4 (4) | *potendus …*, *potendī …* | unavailable | AGp 109; B§126 | 14 |
| malle | participle present (10) | *mālēns …* | unavailable | AGp 110; B§130 | 10 |
| fieri | infinitive future | *factūrum esse* | *factum īrī* (corrected target: no agreement) | AGp 115; B§131 | 1 |
| fieri | participle present (10), future (10), gerund rows 1–4, supine (2), imperative future 3pl | *fiēns …, factūrus …, fiendī …, factum/factū, fīuntō* | unavailable | AGp 115 | 27 |
| fieri | gerundive (10) | *fiendus …* | *faciendus …* | AGp 115; B§131 | 10 |
| ire | passive perfect, pluperfect, future perfect, perfect subj., pluperfect subj. 3sg | *itus est …* | *itum est …* (impersonal passive, neuter) | AGp 114 (§203.a); AG/impersonal-verbs §§207–208.d | 5 |
| ire | passive infinitive perfect | *itum esse* `{m, sg, acc}` | same text, corrected target `{neuter, singular, accusative}` | AG/impersonal-verbs §207 table | 1 |
| ire | participle perfect (10) | *itus …* | unavailable (A&G prints no perfect participle for *eō*) | AGp 114; B§132 | 10 |
| ire | gerundive (10) | *eundus …* | unavailable (only impersonal *eundum*, A&G §190.d) | AGp 114; AG/deponent-verbs §190.d | 10 |

Macron level (only vowel length changes; the test asserts `latinKey(before) === latinKey(after)` for every entry of this ledger):

| File | Cells | Source | Correct | Authority | Cells |
|---|---|---|---|---|---|
| sequi | every form with *sēcūt-* (perfect system 30, perfect and future infinitive 2, participles future and perfect 20, supine 2) | *sēcūtus* | *secūtus* | AGp 104 (§190); A&G §191; LS *sequor* "sĕcūtus" | 54 |
| largiri | every form with *largit-* (same 54 cells) | *largitus* | *largītus* | B§113; LS *largior* "ītus" | 54 |
| amare | imperative future passive 3pl | *amāntor* | *amantor* | AG/quantity-syllables §10.e | 1 |
| audire | imperative future passive 3pl | *audīuntor* | *audiuntor* | AG/quantity-syllables §10.a | 1 |
| velle | participle present nom. sg. | *volens* | *volēns* | AG/quantity-syllables §10.d; AGp 110 | 1 |
| amare, audire, capere, esse, ferre, ire, malle, monere, nolle, posse, tegere, velle | subjunctive perfect active 2sg, 1pl, 2pl | *amāveris, amāverimus, amāveritis* | *amāverīs, amāverīmus, amāverītis* | B§101 (+ A&G §169.d Note on the original ī) | 36 |

Checked and **not** errors: *amāns*, *iēns, euntis*, *potēns*, *forem*, *fore*, *nōn vīs*, *iī / īvī*, *īstī*, *tēxī, tēctum*, *fīmus*, *fī, fīte, fītō* (dated forms the engine generates), all `-` rows (§4.5 availability explains each), the accusative *amātūrum esse* (mapped, not corrected).

## 10. Tense concepts (for the equivalence table)

Concept ids from the architecture research note N7; voice is a qualifier on the lookup (`voice: 'passive'`), not a separate concept.

| Latin tense | Concept links (weight) | Note |
|---|---|---|
| indicative.present | PRESENT (1) | |
| indicative.imperfect | PAST_IMPERFECTIVE (1) | |
| indicative.future | FUTURE (1) | |
| indicative.perfect | PAST_PERFECTIVE (1), PRESENT_PERFECT (1) | A&G §161: perfect definite and historical |
| indicative.pluperfect | PLUPERFECT (1) | |
| indicative.future_perfect | FUTURE_PERFECT (1) | |
| subjunctive.present | SUBJ_PRESENT (1) | |
| subjunctive.imperfect | SUBJ_IMPERFECT (1), COND_PRESENT (0.6) | unreal present conditions use the imperfect subjunctive (A&G §517 [U]: section number from memory) |
| subjunctive.perfect | SUBJ_PERFECT (1) | |
| subjunctive.pluperfect | SUBJ_PLUPERFECT (1), COND_PERFECT (0.6) | unreal past conditions (A&G §517 [U]) |
| imperative.present | IMP_PRESENT (1) | |
| imperative.future | IMP_FUTURE (1), IMP_PRESENT (0.4) | legal and formal commands (A&G §§448–449, referred to from §162 [V]; content [U]) |
| infinitive.present / perfect / future | INF_PRESENT / INF_PERFECT / INF_FUTURE (1) | |
| participle.present | PART_PRESENT (1) | |
| participle.perfect | PART_PAST (1) | deponents: active meaning |
| participle.future | PART_FUTURE (1) | |
| participle.gerundive | GERUNDIVE (1) | |
| gerund.present | GERUND (1) | |
| supine.present | SUPINE (1) | |

## 11. Open questions and risks

| # | Question / risk | Handling |
|---|---|---|
| 1 | `normalizeForComparison` is in the approved public API but not yet in the core. | Task 1 adds the hook and root export if absent (§6.6); coordinate with whoever lands first. |
| 2 | Plan 2 Task 5 may type a pack's schema against its spec and require an `auxiliary` field. | Declare `auxiliary: { kind: 'enum', values: [] }` if required (§2.3). |
| 3 | Plan 2 Task 6 (corpus model with `subject`, `voice`, `scope: 'unmodelled'`, labelled queries) has not landed at the time of writing. | The Latin parser targets that model; if a field is named differently, follow Plan 2 and adjust §9.2 names only. |
| 4 | Perfect subjunctive quantity: A&G short, Bennett long. | One standard form (long, §4.3); 36 macron corrections; A&G cells `disputed`. Revisit if the user prefers A&G. |
| 5 | The over-generation guard compares within one `resolvedTargetKey`; non-standard variants (*-re, -ēre, -undus, ablative -ī, accusative -īs*, *īvī* forms of *eō*) carry tags. | Task 6 asserts this for every cell. |
| 6 | Wiktionary renders through current Lua modules; a re-fetch can differ. | Module revisions pinned and checked; a mismatch needs `--accept-modules` and a reviewed fixture diff. 429 responses observed. |
| 7 | Authority transcription: DCC re-typeset tables and Bennett's Gutenberg text contain errors. | Transcribe from the 1903 scans; admission rule of §8.3; human spot check. |
| 8 | Gender of the supine (masculine, as a fourth-declension verbal noun) is a modelling convention needed because `Agreement.gender` is required. | Documented; no grammar prints a gender for the supine. |
| 9 | *volō* gerund: A&G and Bennett print none; Wiktionary may list *volendī*. | Engine: `no-gerund`; ledger entry if Wiktionary differs [U]. |
| 10 | Intransitive (impersonal-passive) list is partly from memory [U] beyond A&G's examples. | Verify each lemma in L&S during Task 2; unknown verbs assume a full passive (assumption). |
| 11 | Homograph glosses are English strings in `variant.condition`. | Same convention as the other packs' conditions. |
| 12 | Hidden quantities of A&G list verbs not marked in L&S (e.g. *tēxī*). | A&G print is authoritative; L&S only cross-checks. |

## 12. Deviations from the approved design

1. **Rule count.** 86 rules instead of "about 40": each tense formation, each quantity rule, each declension and each availability reason is its own cited rule, and the default perfect for the third conjugation is split by stem type (§3.3).
2. **Third-conjugation default.** The approved "sigmatic default" applies only to roots in a stop; roots in a liquid, nasal, s or x default to *-uī, -itum*, roots in u to *-uī, -ūtum*, inceptives to *-vī, -tum* (A&G §211.a, c, f). All are assumptions.
3. **Perfect subjunctive.** Confirmed as a macron correction of the oracle, but the reason is an authority disagreement (A&G short, Bennett long), not an oracle slip; the engine follows Bennett (§4.3).
4. **Corrections.** 254 cells (107 form, 147 macron) of 3,330, close to "about 250"; *amāntor*, *sēcūtus*, *largitus*, deponent future imperatives, *potendī*, *mālēns*, *fiēns* confirmed. "*īre* passive" is narrower than suggested: the impersonal 3sg passive is right except its masculine participle (*itus est* → *itum est*); the masculine perfect participle and gerundive of *eō* are the other *īre* errors. New: *fīō* has no future participle, gerund or supine and its future infinitive is *factum īrī* (A&G p. 115).
5. **Remaps.** None; the gerund "nominative" row is `unmodelled` (18 cells) instead (§9.2).
6. **Infinitive citation form.** The future active and perfect passive infinitives default to the nominative (*amātūrus esse*, *amātus esse*) as A&G and Bennett print them; the oracle's and Wiktionary's accusative (*amātūrum esse*) is a declined form reached with `agreement`, not a correction.
7. **Catalogue ids.** Gerundive is `participle.gerundive` (A&G §155.a lists it among the four participles); gerund and supine are moods with tense `present`. Declension includes the vocative.
8. **Subject slots.** Ungendered default slots plus non-default gendered ones; compound forms come in three genders through `target.agreement`, simple forms once (§2.2). This meets "all genders are returned where gender changes the verb phrase" without tripling simple forms.
9. **Principal parts.** "§211 principal parts" in the approved design: principal parts are defined in §172 and listed in §§209–212 (§211 is the third conjugation only); A&G's lists are taken whole (about 300 entries instead of about 250). L&S does not mark hidden quantities, so A&G is the primary lexical source and L&S the cross-check (Perseus refuses fetching; Logeion answered).
10. **Contracted forms of *eō*.** Contracted perfects are out, except *eō* and compounds, whose *īstī, īsse, īssem* are the standard forms (A&G §203.c).
11. **Second oracle list.** 63 verbs; *soleō* and *licet* dropped (Wiktionary contradicts A&G on their class); every verb the approved design names is in.
12. **Wiktionary helper.** Per-language files (`scripts/corpus/sources/wiktionary-la.ts`, `tests/fixtures/wiktionary-la.json`), mirroring the Italian plan, instead of one shared `scripts/corpus/sources/wiktionary.ts`, so the parallel worktrees do not collide.
