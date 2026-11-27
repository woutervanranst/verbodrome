# Italian (it) grammar design

Design for the Italian language pack of the seven-language engine (`packages/conjugation-engine`). It is written against the core contract as landed by Plan 2 Part A tasks 1–4 (`LanguagePack.subjects` / `subjectsFor` / `genderedTargets`, `CatalogueEntry.slots`, `ClauseContext.subject` / `agreeing`, generic `Periphrasis<X>` with `applies` / `reports`, `classify` → `Fork` with `analysis.alternatives`, `cellOf(target, lexeme)`) and as Plan 2 tasks 5–6 will finish it (the `./core` authoring surface, labelled corpus queries, remaps, `scope: 'unmodelled'`). Implementers also read `packages/conjugation-engine/docs/pack-authoring.md`. The approved design's "Italian (it)" section is the agreed scope; deviations are listed in §12. The implementation plan is `docs/superpowers/plans/2026-11-24-seven-language-engine-07-it.md`.

Status marks: **[V]** page opened and read during this design pass (2026-11-24); **[S]** confirmed only from a search-result snippet; **[U]** stated from memory, must be checked before it enters code. Every Treccani *Vocabolario* header quoted below was fetched verbatim on 2026-11-24 (40 entries; the raw text is reproduced in the plan's Task 2 fixture list).

---

## 1. Sources

### 1.1 Works

| id (`works`) | Role | Title | URL | Status |
|---|---|---|---|---|
| `treccani-edi` | grammar (rules) | *Enciclopedia dell'Italiano*, Istituto della Enciclopedia Italiana, 2010–2011 (signed entries) | https://www.treccani.it/enciclopedia/ | [V] entries below |
| `treccani-lgi` | grammar (rules) | *La grammatica italiana*, Treccani, 2012 | https://www.treccani.it/enciclopedia/ | [V] entries below |
| `treccani-voc` | lexical authority | *Vocabolario Treccani* online | https://www.treccani.it/vocabolario/ | [V] 40 verb headers |
| `serianni` | print grammar | L. Serianni, *Grammatica italiana. Italiano comune e lingua letteraria*, UTET 1989, cap. XI "Il verbo" | — (print) | [U]: no paragraph number below is verified; locators are filled in by hand from the book |
| `dop` | accents / spelling | B. Migliorini, C. Tagliavini, P. Fiorelli, *DOP – Dizionario d'ortografia e di pronunzia*, RAI | https://www.dizionario.rai.it/ | [U]: not fetched; open by hand. Used only as a second witness for accents |
| `wiktionary-en` | second oracle (data, never cited for a rule) | English Wiktionary, `{{it-conj}}` tables rendered by Module:it-verb | https://en.wiktionary.org/ | [V] tables fetched and parsed for all 63 pages |

### 1.2 Pages, per rule area

| Area | Page (work: entry) | URL | Status | What it states (short) |
|---|---|---|---|---|
| Three conjugations, theme vowels, `-isc-` cells, future from infinitive + *habeo* (`amarò > amerò`), syncope in `porre`/`condurre`, root alternation (`tolgo/tolsi/tolto`, `caddi`, `bevvi`, `ruppi`, `tenni`, `mossi`), imperative only 2nd persons | edi: *Coniugazione verbale* (R. Cimaglia, 2010) §2.1–2.3, §3d–e, §4.1–4.5 | https://www.treccani.it/enciclopedia/coniugazione-verbale_(Enciclopedia-dell'Italiano)/ | [V] | §2.1 classes; §2.3 imperative 2sg = indicative 2sg in II/III; §3d `amare habeo > amarò > amerò`; §4.4 consonant doubling in strong pasts |
| Passato remoto endings, rhizotonic type, weak 2sg/1pl/2pl | edi: *Passato remoto* (E. Wiberg, 2011) §2a–b | https://www.treccani.it/enciclopedia/passato-remoto_(Enciclopedia-dell'Italiano)/ | [V] | `-ai -asti -ò -ammo -aste -arono`; `-ei/-etti -esti -è/-ette -emmo -este -erono/-ettero`; `-ii -isti -ì -immo -iste -irono`; rhizotonic `feci, fece, scrissi, scrisse, vidi, vide`; 2sg/1pl/2pl keep the arhizotonic form (`facesti, scrivemmo, vedeste`) |
| `-isc-` (incoativi) | lgi: *Incoativi, verbi* | https://www.treccani.it/enciclopedia/verbi-incoativi_(La-grammatica-italiana)/ | [V] | `-isc-` in 1–2–3sg and 3pl present indicative and subjunctive, and in imperative 2sg and "3a persona singolare e plurale" (`inser-isc-i!, guar-isc-a!, reag-isc-ano!`) |
| `-ire` with both forms, `-gnire`, participio presente `-ente/-iente` | lgi: *Terza coniugazione* | https://www.treccani.it/enciclopedia/terza-coniugazione_(La-grammatica-italiana)/ | [V] | both forms: `applaudire, mentire, inghiottire, assorbire, nutrire` (`io mento / io mentisco`); `insigniamo` (i kept); part. pres. `-ente` or `-iente` |
| `-ei/-etti`, `-cere/-gere`, `-gnere`, participle `-ciuto`, mobile diphthong | lgi: *Seconda coniugazione* | https://www.treccani.it/enciclopedia/seconda-coniugazione_(La-grammatica-italiana)/ | [V] | both series common; stem in `t` → `-ei` (`battei`, `*battetti`); otherwise `-etti` more common (`credetti`, less common `credei`); "consultare il dizionario"; `spegniamo`; `taciuto, cresciuto` (diacritic i); `mi siedo / ci sediamo`, `tiene / tenete` |
| First-conjugation spelling (`-care/-gare`, `-ciare/-giare/-sciare`, `-iare`, `-gliare`, `-chiare/-ghiare`, `-gnare`, `-eare`) | lgi: *Prima coniugazione* | https://www.treccani.it/enciclopedia/prima-coniugazione_(La-grammatica-italiana)/ | [V] | `sporchiamo, vagherà`; `rinuncerò, danneggeremo, lascerò`; `taglierai`; `fischiamo, ringhi`; `sogniamo, lagniate` (`sognamo` "sconsigliabile"); stressed `invìi, scìino`; unstressed `studi, ripudino`; `allineeremo, creerei` |
| Imperative, monosyllabic forms, negative imperative, `sii/abbi/sappi/vogli` | lgi: *Imperativo* | https://www.treccani.it/enciclopedia/imperativo_(La-grammatica-italiana)/ | [V] | only 2sg/2pl; 3sg, 3pl, 1pl from the "congiuntivo esortativo"; `stai/sta'`, `vai/va'`, `fai/fa'`, `dai/da'` (bare `sta, va, fa, da` archaic; `stà, và` wrong); negative 2sg = infinitive (`non parlare, non alzarti`), clitic before or after; `sii, abbi, sappi, vogli`, `siate, abbiate, sappiate, vogliate` |
| Auxiliary selection | lgi: *Avere o essere?* | https://www.treccani.it/enciclopedia/avere-o-essere_(La-grammatica-italiana)/ | [V] | transitive → avere; reflexive → essere (`mi sono lavato, mi ero vestito`); impersonal → essere; intransitive: no fixed rule (`ho parlato, ho dormito`; `sono nato, sono cresciuto, sono andato, sono partito`; `ho camminato, ho viaggiato`) |
| Auxiliary selection, dual verbs, weather verbs | edi: *Ausiliari, verbi* (R. Cimaglia, 2010) §3 | https://www.treccani.it/enciclopedia/verbi-ausiliari_(Enciclopedia-dell'Italiano)/ | [V] | reflexive/reciprocal "si avrà sempre essere"; dual with meaning change `ho corso molto / sono corso via`; weather verbs oscillate (`aveva nevicato / era piovuto`) |
| Unaccusatives | edi: *Inaccusativi, verbi* | https://www.treccani.it/enciclopedia/verbi-inaccusativi_(Enciclopedia-dell'Italiano)/ | [S] | `Luca ha corso nel parco / Luca è corso a casa` |
| Per-verb auxiliary notes | lgi: *Vivere: avere o essere?*, *Scivolare: avere o essere?* | https://www.treccani.it/enciclopedia/vivere-avere-o-essere_(La-grammatica-italiana)/ | [S] | some verbs take either; avere stresses duration |
| Participle agreement | lgi: *Concordanza* | https://www.treccani.it/enciclopedia/concordanza_(La-grammatica-italiana)/ | [V] | with essere "il participio concorda in genere e numero con il soggetto"; mixed genders → masculine plural; pronominal verb + object: subject or (less often) object |
| Congiuntivo tense names | lgi: *Congiuntivo* | https://www.treccani.it/enciclopedia/congiuntivo_(La-grammatica-italiana)/ | [V] | "ha quattro tempi: presente, imperfetto, passato, trapassato" (basis for the two oracle remaps) |
| Enclisis, clitic doubling | edi: *Parole enclitiche* (L. Gaeta, 2011) §2–3 | https://www.treccani.it/enciclopedia/parole-enclitiche_(Enciclopedia-dell'Italiano)/ | [V] | obligatory with affirmative imperative, infinitive, gerund; "con imperativi monosillabici la consonante iniziale del pronome si rafforza": `dagli, dammi, dillo, vacci, fallo`; infinitive drops `-e` (`farlo, prenderne`) |
| `gli` not doubled | edi: *Clitici* | https://www.treccani.it/enciclopedia/clitici_(Enciclopedia-dell'Italiano)/ | [S] | `/ʎ/` of gli already long |
| Clitic doubling after andare, fare, dare, dire, stare | voc: *enclisi* | https://www.treccani.it/vocabolario/enclisi/ | [S] | |
| Written accent | edi: *Accento grafico* (S. Demartini; §1 A. Viviani, 2010) | https://www.treccani.it/enciclopedia/accento-grafico_(Enciclopedia-dell'Italiano)/ | [V] | obligatory on final-stressed polysyllables "anche quando sono composti da monosillabi" (`trentatré`); `dà` vs `da`; `più, già, giù`; `fa, va, sta` never accented; imperatives `fa', va', da', di', sta'`; "dà (è presente!)" |
| Accented monosyllables | lgi: *Monosillabi accentati e non accentati* | https://www.treccani.it/enciclopedia/monosillabi-accentati-e-non-accentati_(La-grammatica-italiana)/ | [S] | |
| Syncope in the future (`vederò > vedrò`) | edi: *Sincope* | https://www.treccani.it/enciclopedia/sincope_(Enciclopedia-dell'Italiano)/ | [S] | |
| Per-verb forms | voc: entries listed in §5.3 | https://www.treccani.it/vocabolario/<entry>/ | [V] | headers quoted per verb |
| Paradigm tables, congiuntivo from 1sg present, 2pl subjunctive from 1pl, compound tenses of *essere*, defectives (*solere*, *potere*, *dovere*), courtesy *Lei/Loro* agreement | serianni cap. XI | print | [U] | to transcribe by hand; until then every rule citing only Serianni also cites a [V] Treccani page or the Vocabolario |

Rule areas with no [V] grammar page and therefore cited to the Vocabolario's per-verb data plus Serianni [U]: the congiuntivo-presente derivation from the 1sg stem (`it.stem.subjunctive-from-1sg`), the 2pl subjunctive from the 1pl stem, and the participio presente as a productive form. The implementer adds the Serianni § numbers by hand (plan Task 2 step) and flags them in `sources.ts` until then.

---

## 2. Catalogue

### 2.1 Moods and tenses (22 entries, catalogue order)

| id | Native label (mood / tense) | Kind | Persons |
|---|---|---|---|
| `indicative.present` | Indicativo / Presente | simple | all six |
| `indicative.perfect` | Indicativo / Passato prossimo | periphrastic | all six |
| `indicative.imperfect` | Indicativo / Imperfetto | simple | all six |
| `indicative.pluperfect` | Indicativo / Trapassato prossimo | periphrastic | all six |
| `indicative.simple_past` | Indicativo / Passato remoto | simple | all six |
| `indicative.past_anterior` | Indicativo / Trapassato remoto | periphrastic | all six |
| `indicative.future` | Indicativo / Futuro semplice | simple | all six |
| `indicative.future_perfect` | Indicativo / Futuro anteriore | periphrastic | all six |
| `subjunctive.present` | Congiuntivo / Presente | simple | all six |
| `subjunctive.past` | Congiuntivo / Passato | periphrastic | all six |
| `subjunctive.imperfect` | Congiuntivo / Imperfetto | simple | all six |
| `subjunctive.pluperfect` | Congiuntivo / Trapassato | periphrastic | all six |
| `conditional.present` | Condizionale / Presente | simple | all six |
| `conditional.past` | Condizionale / Passato | periphrastic | all six |
| `imperative.present` | Imperativo / Presente | simple | `slots: ['2sg', '3sg.formal', '1pl', '2pl', '3pl.formal']` (§2.2) |
| `imperative.negative` | Imperativo / Negativo | simple cell + clause particle | same `slots` |
| `infinitive.present` | Infinito / Presente | simple | — |
| `infinitive.past` | Infinito / Passato | periphrastic | — |
| `participle.present` | Participio / Presente | simple | — |
| `participle.past` | Participio / Passato | simple, agreeing (4 forms) | — |
| `gerund.present` | Gerundio / Presente | simple | — |
| `gerund.past` | Gerundio / Passato | periphrastic | — |

Voices: none (active only; no `voices` on any entry). Spec: `ItalianSpec extends LanguageSpec<ItalianTenses>` with `subject: '1sg' | '2sg' | '3sg.m' | '3sg.f' | '3sg.formal' | '1pl' | '2pl' | '3pl' | '3pl.formal'`; `ItalianTenses = { indicative: 'present'|'perfect'|'imperfect'|'pluperfect'|'simple_past'|'past_anterior'|'future'|'future_perfect'; subjunctive: 'present'|'past'|'imperfect'|'pluperfect'; conditional: 'present'|'past'; imperative: 'present'|'negative'; infinitive: 'present'|'past'; participle: 'present'|'past'; gerund: 'present'|'past' }`, `nonFinite: 'infinitive'|'participle'|'gerund'`. Ids follow the French ones wherever the tense is the same.

### 2.2 Subject slots (`italianSubjects`, `genderedTargets: true`)

| id | person | number | pronoun | gender | register | default |
|---|---|---|---|---|---|---|
| `1sg` | 1 | singular | `io` | — | — | yes |
| `2sg` | 2 | singular | `tu` | — | informal | yes |
| `3sg.m` | 3 | singular | `lui` | masculine | — | yes |
| `3sg.f` | 3 | singular | `lei` | feminine | — | yes |
| `3sg.formal` | 3 | singular | `Lei` | — | formal | no |
| `1pl` | 1 | plural | `noi` | — | — | yes |
| `2pl` | 2 | plural | `voi` | — | informal | yes |
| `3pl` | 3 | plural | `loro` | — | — | yes |
| `3pl.formal` | 3 | plural | `Loro` | — | formal | no |

Decisions:
- **Courtesy forms are third person** (`person: 3`). *Lei/Loro* govern the third person in Italian, so `Lei è andata` needs no person mapping and every chain element (the auxiliary) is conjugated correctly by the core without passing the slot into chain-element targets. They are non-default, as the approved design asks. *Loro* as a plural courtesy pronoun is formal and receding; its slot is kept because the approved catalogue lists it.
- **Imperative 3rd persons belong to the courtesy slots only.** Both imperative entries declare `CatalogueEntry.slots: ['2sg', '3sg.formal', '1pl', '2pl', '3pl.formal']`, so `lui`/`lei`/`loro` never get an imperative target. An unfiltered imperative therefore returns `tu`, `noi`, `voi` (the formal slots are not default); `subject: '3sg.formal'` returns `parli`. (Treccani *Incoativi* labels these forms "3a persona … dell'imperativo"; Treccani *Imperativo* calls them congiuntivo esortativo; en.wiktionary heads them `Lei` / `Loro`.)
- **Gender.** The pronoun shows gender only in `lui`/`lei`; for every other slot the gender shows only in an agreeing participle. Those slots carry no gender; the clause's `agreements` forks masculine and feminine where a participle agrees (essere compounds, reflexives, the bare participle). So `io sono andato` and `io sono andata` are two forms of one target, distinguished by `target.agreement`, and `io parlo` is not duplicated. `target.gender` is set only for `3sg.m`/`3sg.f`. This makes feminine compound forms first-class: they are generated by every unfiltered query, carry `target.agreement.gender = 'feminine'` and `features.gender` on the participle part, and are selected by `gender: 'feminine'`.
- **Pro-drop.** Forms are rendered **with** the subject pronoun as a `subject` part (`io parlo`, `lei è andata`) like the other non-Latin packs, so the gender of `lei` is visible as the approved design's table says. The pro-drop form is `renderParts(parts, { bare: true })` (`parlo`, `è andata`), which the trainer uses to accept answers typed without a pronoun. The imperative and every non-finite form have no subject part. *Lei/Loro* are written with a capital (en.wiktionary and most school grammars do; lower case is also accepted in usage [U]).
- **Oracle mapping.** The scraped tables print the pronoun in a separate column; the parser reads the row as printed (`io` + `parlo` → `io parlo`) for finite non-imperative rows, and the imperative rows without the pronoun (§9).

### 2.3 Options (`italianOptions`, validation order)

| Field | Kind | Values | Meaning |
|---|---|---|---|
| `stems` | stems | words `past` (strong passato remoto 1sg, e.g. `presi`), `participle` (m.sg, e.g. `preso`), `future` (stem ending in `r`, e.g. `vedr`); enums `stressedI: [true, false]` | hints for unknown verbs; each replaces the matching assumption |
| `auxiliary` | enum | `avere`, `essere` | narrows the verb's auxiliaries to one; INVALID_HINT if the verb cannot take it |
| `classHint` | enum | `isc`, `plain` | for `-ire` only: with or without `-isc-`; INVALID_HINT on `-are`/`-ere` |
| `reflexive` | boolean | | conjugate a non-reflexive lemma reflexively (`lavare` + `reflexive: true` = `lavarsi`) |
| `gender` | enum | `masculine`, `feminine` | keeps the slots and agreements of that gender (drops `3sg.m` for feminine, the masculine agreement forks) |

`subject` is the core's common option (§2.2 ids). Checks (`check`): `stems.future` must end in `r`; `stems.past` must end in `i`; `stems.participle` must end in `o`.

### 2.4 Left out, and why

| Left out | Why |
|---|---|
| Passive (`essere/venire` + participle) | approved design: active only |
| `stare` + gerund, `stare per`, `andare` + participle | periphrases outside the paradigm (approved design) |
| The oracle's `avente` + participle | not an Italian form; cells kept as `scope: 'unmodelled'` (§9) |
| Object clitics (`dammi, dillo, l'ho vista`), agreement with a preceding object clitic | only reflexive pronouns are in scope; the doubling rule is implemented for reflexive imperatives (`fatti, datti`) |
| Pronominal verbs with `ne`/`la` (`andarsene, farcela`) | INVALID_INFINITIVE with a message naming the limit |
| Elision of reflexive pronouns (`m'alzo`) | optional; the full form `mi alzo` is standard |
| Archaic, poetic, popular forms the Vocabolario marks `ant.`, `poet.`, `pop.`, `dial.` (`vo'` for voglio, `volsi`, `vadi`, `fia`, `diè`) | not generated; where the oracle has them, a correction (§9.4) |
| Participle with enclitic (`lavatosi`, `lavantesi`) | absolute-construction forms; second-oracle cells `scope: 'unmodelled'` |
| Optional diacritic accents on non-final syllables (`dànno`, `dètte`) | not part of standard spelling (Treccani *Accento grafico*: accent obligatory only on final-stressed words and homograph monosyllables) |

---

## 3. Classification

### 3.1 Classes

| `classId` | Detected by | Stem | Examples |
|---|---|---|---|
| `are` | infinitive ends in `-are` | infinitive − `are` | parlare, cercare, studiare |
| `ere` | ends in `-ere` | infinitive − `ere` | credere, temere, prendere |
| `ire-isc` | ends in `-ire`, `isc: 'yes'` | infinitive − `ire` (+ `isc` in root-stressed cells) | finire, capire |
| `ire` | ends in `-ire`, `isc: 'no'` | infinitive − `ire` | dormire, partire |
| `ire-both` | listed, `isc: 'both'` | both, two paradigms (§3.5) | applaudire, mentire |
| `contracted` | lemma or family in the contracted list; conjugated as `ere` on the long stem | long stem | fare `fac-`, dire `dic-`, bere `bev-`, porre `pon-`, trarre `tra-`, -durre `-duc-` |
| `irregular` | listed with whole-cell overrides | — | essere, avere, andare, dare, stare |

The class label in `analysis.classification` is the `classId`. A lexicon entry may additionally carry strong principal parts (§5) without changing class.

### 3.2 Order of classification (`classify(query): Fork<ItalianLexeme>`)

1. Normalize (NFC, lower case; done by the core). Reject anything not matching `/^[a-zàèéìòù]+$/` after a trailing `si` is removed, and lemmas ending in `-sene`, `-sela`, `-cela` (INVALID_INFINITIVE, "pronominal verbs with ne/la are not supported").
2. **Reflexive.** A lemma ending in `rsi` is reflexive: base = lemma − `si` + `e` (`lavarsi → lavare`, `accorgersi → accorgere`, `porsi → porre`, `farsi → fare`). Step `it.classify.reflexive`. `reflexive: true` on a non-reflexive lemma does the same with step `it.classify.hint`.
3. **Lexicon lookup** of the base: listed lemma → its entry, `classSource: 'lexicon'`, step `it.classify.lexicon`.
4. **Family** (§3.4): base = prefix + family base → entry derived from the family base, step `it.classify.family`; an unlisted `-durre`/`-porre`/`-trarre` lemma also gets `it.classify.assume-family` (assumption).
5. **No-inherit list** (§3.4): step `it.classify.no-inherit`, then continue as unlisted.
6. **Ending**: `-are`/`-ere`/`-ire` → class, step `it.classify.conjugation` (param `ending`). Anything else (including an unknown `-rre` that is not a family) → INVALID_INFINITIVE ("an infinitive ends in -are, -ere, -ire or is a contracted verb such as porre, trarre, condurre").
7. **Lexical side lists**, each recording its step: `isc` lists (§5.4), auxiliary lists, stressed-i list, palatal list.
8. **Defaults for an unlisted verb**, each an assumption: `it.classify.assume-regular` (not for a family member, whose strong parts come from its base); for `-ire` `it.classify.assume-isc`; `it.classify.assume-avere`; for `-iare` (not `-ciare/-giare/-sciare/-gliare/-chiare/-ghiare`, where the i is graphic) `it.classify.assume-unstressed-i`.
9. **Hints** override (step `it.classify.hint`, param `hint`): `classHint` replaces the `isc` decision (and its assumption); `auxiliary` narrows the list; `stems.stressedI`, `stems.past`, `stems.participle`, `stems.future` replace the default they name.
10. Reflexive lexemes get `auxiliaries: ['essere']` with step `it.classify.reflexive-essere` (Treccani *Ausiliari, verbi* §3: "si avrà sempre essere"), overriding the auxiliary list and the avere assumption.

### 3.3 Defaults and their assumptions (exact English messages are in §4.1)

| Default | Applies to | Rule id | Hint that overrides |
|---|---|---|---|
| regular, no strong forms, no syncopated future | every unlisted verb | `it.classify.assume-regular` | `stems.past`, `stems.participle`, `stems.future` |
| `-isc-` | unlisted `-ire` | `it.classify.assume-isc` | `classHint: 'plain'` |
| auxiliary avere | unlisted, non-reflexive | `it.classify.assume-avere` | `auxiliary: 'essere'` |
| unstressed i (`studio, studi`) | unlisted `-iare` with a non-graphic i | `it.classify.assume-unstressed-i` | `stems.stressedI: true` |
| family of an unlisted `-durre/-porre/-trarre` lemma | `sbradurre` | `it.classify.assume-family` | none (these endings have no other model) |
| `-ere` passato remoto: both `-ei` and `-etti` (`-etti` first; stem in `t`: `-ei` only) | unlisted `-ere` | rule, not an assumption (Treccani *Seconda coniugazione*) | `stems.past` |

### 3.4 Derivatives inherit safely

| Mechanism | Members | Condition |
|---|---|---|
| **Distinctive-suffix families** (any prefix) | `-durre` (condurre, dedurre, indurre, introdurre, produrre, ridurre, sedurre, tradurre…), `-porre` (comporre, disporre, esporre, imporre, opporre, porre, proporre, supporre…), `-trarre` (attrarre, contrarre, distrarre, estrarre, sottrarre, ritrarre…) | lemma ends in the suffix; remainder (possibly empty) is any letter string; unlisted ones record `it.classify.assume-family` |
| **Prefix families** (closed prefix list) | `-mettere`, `-prendere`, `-scrivere`, `-tenere`, `-venire`, `-correre`, `-cogliere`, `-togliere`, `-volgere`, `-muovere`, `-chiudere`, `-cludere`, `-scendere`, `-tendere`, `-vincere`, `-giungere`, `-durre`, `-cedere` (only `concedere`, `succedere`: listed, not family), `-sistere` (regular, listed for essere) | remainder ∈ closed prefix list; base length ≥ 6 letters |
| **Short bases** (explicit list only) | fare: rifare, disfare, sopraffare, contraffare, strafare, assuefare, liquefare, putrefare, rarefare, stupefare, tumefare, soddisfare (own entry); dire: predire, contraddire, disdire, ridire, interdire, benedire, maledire (own entries for `-ii`/`-icevo` variants); dare: ridare; stare: sottostare, soprastare, ristare | listed lemmas only |
| **Closed prefix list** | a, ab, ac, ad, af, ag, al, am, an, ap, ar, as, at, av, co, com, con, cor, col, contra, contro, de, di, dis, e, es, ex, im, in, ir, inter, intra, intro, o, ob, op, per, pre, pro, re, ri, s, sc, so, sop, sor, sot, sotto, sopra, sovra, sov, stra, sub, super, tra, tras | exact prefix match, longest first |
| **No-inherit list** (look derived, are regular or another family) | restare, prestare, costare, contrastare (not stare); mandare, guardare, sudare, ricordare (not dare); ardire, spedire, sparire, smentire, nutrire (not dire / not the `-ire` lexeme); provvedere (`provvederò`, not `prevedrò` pattern) and every `-vedere` except listed; dipendere, spendere (not a `-pendere` family); ammettere? no (inherits); sorprendere? inherits | step `it.classify.no-inherit` |

What a family passes on: present stems, strong past, strong participle, future stem, subjunctive and imperative overrides, `isc`. What it never passes on: **auxiliary** (each derivative is looked up in the auxiliary lists; otherwise avere is assumed: `percorrere` avere, `accorrere` essere [U]), and the monosyllabic imperatives (`predire → predici`, `rifare → rifai, rifa'`; verified for predire, rifare on en.wiktionary only).

The written accent of a derived monosyllable is added by `it.orth.final-accent` (`fa → rifà`, `sta → sottostà`, `do → ridò`).

### 3.5 Several paradigms for one lemma

Only `ire-both` verbs (applaudire, mentire, inghiottire, assorbire, nutrire, … §5.4) return two outcomes: `pattern: 'isc'` and `pattern: 'plain'`, each with its classification step and the same auxiliaries; `classHint` selects one. Apparire/comparire/scomparire are not two paradigms: their lexicon entry lists both present stems (`appaio` / `apparisco`) as variants of one paradigm (Vocabolario: "appàio o apparisco … appàiono o apparìscono"). Dual auxiliaries are not paradigms either (§6.3).

---

## 4. Rule inventory

Conventions: stage token in the id is `classify`, `avail`, `stem`, `cell` (stage `stem`, kind lexical: whole word), `end`, `orth`, `periphrasis`, `clause`. Messages are one learner-level English sentence; `{before}`/`{after}` are always available. Dutch school-grammar terms to use in the nl messages: *infinitief*, *stam*, *uitgang*, *tegenwoordige tijd*, *onvoltooid verleden tijd* (imperfetto), *passato remoto* (keep the Italian name), *toekomende tijd*, *voorwaardelijke wijs*, *aanvoegende wijs* (congiuntivo), *gebiedende wijs*, *voltooid deelwoord*, *tegenwoordig deelwoord*, *gerundium*, *hulpwerkwoord*, *wederkerend voornaamwoord*, *beleefdheidsvorm*. Citations: short work id + locator; URLs from §1.2.

### 4.1 Classify and availability

| id | kind | params | Message (en) | Trigger | Citation | Example |
|---|---|---|---|---|---|---|
| `it.classify.lexicon` | lexical | — | `{before} is in the lexicon: it follows the {after} pattern.` | listed lemma | voc entry | `venire → irregular` |
| `it.classify.conjugation` | rule | `ending` text | `{before} ends in -{ending}: it follows the -{ending} conjugation.` | unlisted, by ending | edi *Coniugazione verbale* §2.1 | `blorpare → are` |
| `it.classify.contracted` | lexical | `stem` text | `{before} is a shortened infinitive; its other forms are built on the long stem {stem}-.` | fare, dire, bere, porre/trarre/-durre families | edi *Coniugazione verbale* §4 (syncope `porre < ponere`, `condurre < conducere`) | `tradurre → traduc-` |
| `it.classify.reflexive` | rule | — | `{before} ends in -si: a reflexive verb, conjugated like {after} with mi, ti, si, ci, vi, si.` | lemma ends in `rsi` | lgi *Avere o essere?* | `lavarsi → lavare` |
| `it.classify.reflexive-essere` | rule | — | `Reflexive verbs always form their compound tenses with essere.` | reflexive lexeme | edi *Ausiliari* §3 | |
| `it.classify.family` | rule | `prefix`, `base` text | `{before} is {prefix} + {base}: it is conjugated like {base}.` | §3.4 | voc entry of the base | `comporre = com + porre` |
| `it.classify.assume-family` | assumption | `base` text | `{before} is not in the lexicon; assuming it is conjugated like the other verbs in -{base}.` | unlisted `-durre/-porre/-trarre` | edi *Coniugazione verbale* §4 | `sbradurre` |
| `it.classify.no-inherit` | lexical | `base` text | `{before} only looks like {base} with a prefix; it is conjugated on its own.` | §3.4 list | voc entry | `restare` |
| `it.classify.assume-regular` | assumption | — | `{before} is not in the lexicon: assuming it is regular.` | unlisted | serianni XI [U]; edi *Coniugazione verbale* §4.1 | |
| `it.classify.isc` | lexical | — | `{before} adds -isc- in the forms stressed on the stem.` | `isc: 'yes'` | lgi *Incoativi* | `finire` |
| `it.classify.no-isc` | lexical | — | `{before} does not add -isc-.` | `isc: 'no'` | voc entry (`io dòrmo`) ; lgi *Terza coniugazione* | `dormire` |
| `it.classify.isc-both` | lexical | — | `{before} has forms with and without -isc-.` | `isc: 'both'` | lgi *Terza coniugazione* | `mentire` |
| `it.classify.assume-isc` | assumption | — | `Assuming {before} adds -isc-, as most verbs in -ire do.` | unlisted `-ire` | edi *Coniugazione verbale* §4.1 (the isc subclass is the growing one) | `tronire` |
| `it.classify.auxiliary` | lexical | `auxiliary` text | `{before} forms its compound tenses with {auxiliary}.` | listed in an auxiliary list | voc entry ("aus. essere") | `venire` |
| `it.classify.assume-avere` | assumption | — | `Assuming {before} forms its compound tenses with avere, like most verbs.` | unlisted, not reflexive | lgi *Avere o essere?* | |
| `it.classify.stressed-i` | lexical | — | `In {before} the i of the stem is stressed (io {after}), so it is kept before another i.` | stressed-i list; `after` = 1sg | lgi *Prima coniugazione* | `inviare → invio` |
| `it.classify.assume-unstressed-i` | assumption | — | `Assuming the i of {before} is not stressed, as in studiare.` | unlisted `-iare` (non-graphic i) | lgi *Prima coniugazione* | `trebiare` |
| `it.classify.hint` | rule | `hint` text | `Following your hint: {hint}.` | any hint used | — (cites serianni XI [U] for the hinted pattern) | |
| `it.avail.no-imperative` | unavailable | — | `This verb has no imperative.` | `noImperative` (potere, dovere, parere [U], solere) | voc *potere2*, *dovere2* ("manca l'imperativo") | |
| `it.avail.impersonal` | unavailable | — | `This verb is impersonal: it is used only in the third person.` | `impersonal` (weather verbs), persons 1–2, imperative | edi *Ausiliari* §3 (atmosferici); voc *piovere* [U for personal use] | `piovere` |
| `it.avail.defective` | unavailable | `tense` term | `This verb has no {tense}.` | `defective` tense list (solere: future, conditional; sapere, potere, parere: present participle) | voc *sapere2* ("Il part. pres. manca"), *parere2*, *potere2* ("solo come agg. e sost."), *solere* | |

### 4.2 Stems and whole words

| id | kind | params | Message (en) | Trigger | Citation | Example |
|---|---|---|---|---|---|---|
| `it.stem.infinitive` | rule | `ending` text | `Remove -{ending} from {before}: the stem is {after}-.` | every regular cell | edi *Coniugazione verbale* §2.1 | `parlare → parl-` |
| `it.stem.long` | rule | — | `This form is built on the long stem {after}-.` | contracted class | edi *Coniugazione verbale* §4 | `fare → fac-` (facevo) |
| `it.stem.isc` | rule | — | `Add -isc- in the forms stressed on the stem: {before} → {after}.` | `isc` lexeme; present ind./subj. 1–3sg, 3pl; imperative 2sg, 3sg, 3pl | lgi *Incoativi* | `fin- → finisc-` |
| `it.stem.lexical` | lexical | — | `The lexicon gives the stem {after}- for this form.` | lexical present / 1pl stems (§5.2) | voc entry | `venire → veng-` |
| `it.stem.subjunctive-from-1sg` | rule | `base` text | `The present subjunctive is built on the stem of io {base}: {after}-.` | subjunctive 1–3sg, 3pl; imperative 3sg/3pl | serianni XI [U]; voc entries (`vengo/venga`, `esco/esca`, `salgo/salga`) | `vengo → veng-` |
| `it.stem.subjunctive-from-1pl` | rule | `base` text | `The noi and voi forms of the present subjunctive are built on noi {base}: {after}-.` | subjunctive 1–2pl | serianni XI [U]; voc (`dobbiamo, dobbiate`; `sappiamo, sappiate`) | `dobbiamo → dobb-` |
| `it.stem.strong-past` | lexical | — | `Strong passato remoto: io, lui/lei and loro use the stem {after}-.` | strong lexeme, simple_past 1sg, 3sg, 3pl | edi *Passato remoto* §2b | `prendere → pres-` |
| `it.stem.future` | rule | — | `The future and the conditional are built on the infinitive without its final -e: {after}-.` | `ere`/`ire`/contracted, regular | edi *Coniugazione verbale* §3d | `credere → creder-` |
| `it.stem.future-syncope` | lexical | — | `The future and the conditional of this verb use the short stem {after}-.` | lexical future stem | voc entries (`andrò, verrò, berrò, dovrò…`); edi *Sincope* [S] | `vedere → vedr-` |
| `it.stem.strong-participle` | lexical | — | `Irregular past participle: it is built on {after}-.` | lexical participle | voc entry | `prendere → pres-` (preso) |
| `it.stem.palatal` | lexical | — | `The c of {before} stays soft before a and o, so it is written ci: {after}-.` | palatal list (cucire, cuocere, …) and cell vowel a/o | lgi *Seconda coniugazione* (diacritic i); voc *cuocere* | `cuc- → cuci-` (cucio) |
| `it.cell.lexical` | lexical | — | `{after} is an irregular form that has to be learnt.` | whole-word overrides (§5.2) | voc entry | `essere → sono`, `fare → fa'` |

### 4.3 Endings (data in §4.6)

| id | params | Message (en) | Trigger | Citation |
|---|---|---|---|---|
| `it.end.present` | `ending` text, `person` term, `number` term | `Present, {person} {number}: add -{ending}.` | indicative present | edi *Coniugazione verbale* §2 |
| `it.end.imperfect` | `ending` | `Imperfetto: add -{ending}.` | indicative imperfect | edi *Coniugazione verbale* §2 |
| `it.end.past` | `ending` | `Passato remoto: add -{ending}.` | weak passato remoto, every person of a weak verb, 2sg/1pl/2pl of a strong one | edi *Passato remoto* §2a |
| `it.end.past-etti` | `ending` | `Passato remoto, the equally common -etti series: add -{ending}.` | `-ere` weak, 1sg/3sg/3pl, stem not ending in t | lgi *Seconda coniugazione* |
| `it.end.past-strong` | `ending` | `Strong passato remoto: add -{ending} to the strong stem.` | strong 1sg (-i), 3sg (-e), 3pl (-ero) | edi *Passato remoto* §2b |
| `it.end.future` | `ending` | `Future: add -{ending}.` | indicative future | edi *Coniugazione verbale* §3d |
| `it.end.future-ar-er` | `ending` | `In the future and the conditional, -are verbs use -e- instead of -a-: add -{ending}.` | `are` class, future/conditional, no lexical stem | edi *Coniugazione verbale* §3d (`amarò > amerò`) |
| `it.end.conditional` | `ending` | `Conditional: add -{ending}.` | conditional present | edi *Coniugazione verbale* §3e |
| `it.end.subjunctive-present` | `ending` | `Present subjunctive: add -{ending}.` | subjunctive present | serianni XI [U]; lgi *Prima coniugazione* (`ripudino`) |
| `it.end.subjunctive-imperfect` | `ending` | `Imperfect subjunctive: add -{ending}.` | subjunctive imperfect | serianni XI [U] |
| `it.end.imperative` | `ending` | `Imperative: add -{ending}.` | imperative 2sg (`-a` / `-i`), 2pl (= indicative 2pl) | lgi *Imperativo*; edi *Coniugazione verbale* §2.3 |
| `it.end.imperative-subjunctive` | — | `For Lei, noi and Loro the imperative uses the present subjunctive: {after}.` | imperative 3sg, 1pl, 3pl; 2pl of essere/avere/sapere/volere | lgi *Imperativo* |
| `it.end.infinitive` | — | `Infinitive: {after}.` | infinitive cell (the lemma's base) | — (edi *Coniugazione verbale* §2.1) |
| `it.end.gerund` | `ending` | `Gerund: add -{ending}.` | gerund | serianni XI [U] |
| `it.end.present-participle` | `ending` | `Present participle: add -{ending}.` | participle present | lgi *Terza coniugazione* (`-ente/-iente`) |
| `it.end.participle` | `ending` | `Past participle: add -{ending}.` | participle past (`-ato/-uto/-ito`, agreement `-o/-a/-i/-e`) | serianni XI [U]; lgi *Concordanza* |

### 4.4 Spelling rules (`orthography`, in this order)

| # | id | params | Message (en) | Exact trigger (predicate on the juncture `stem`+`ending` and the lexeme) | Citation | Example |
|---|---|---|---|---|---|---|
| 1 | `it.orth.velar-h` | `letter` text (`c`/`g`) | `c and g keep their hard sound before e and i, so they are written {letter}h: {before} becomes {after}.` | lexeme class `are`; stem ends in `c` or `g`; ending starts with `e` or `i` | lgi *Prima coniugazione* | `cerc+i → cerchi`, `pag+erò → pagherò` |
| 2 | `it.orth.palatal-i-drop` | — | `The i after c or g only marks the soft sound; before e and i it is not written: {before} becomes {after}.` | class `are`; stem ends in `ci`, `gi` (incl. `sci`); lexeme not stressed-i; ending starts with `e` or `i` | lgi *Prima coniugazione* | `cominci+erò → comincerò`, `mangi+i → mangi`, `lasci+iamo → lasciamo` |
| 3 | `it.orth.i-merge` | — | `The unstressed i of the stem and the i of the ending are written once: {before} becomes {after}.` | class `are`; stem ends in `i` (after rule 2 has not fired); ending starts with `i`; NOT (lexeme stressed-i AND cell is root-stressed: present ind./subj. 1–3sg, 3pl, imperative 2sg, 3sg, 3pl) | lgi *Prima coniugazione* | `studi+i → studi`, `tagli+iamo → tagliamo`, `invi+iamo → inviamo`; not `invi+i` (`invii`) |
| 4 | `it.orth.participle-ci` | — | `Before -uto the c keeps its soft sound with an i: {before} becomes {after}.` | class `ere`; regular participle; stem ends in `c` (incl. `sc`) | lgi *Seconda coniugazione* (`taciuto, cresciuto`) | `conosc+uto → conosciuto`, `flac+uto → flaciuto` |
| 5 | `it.orth.final-accent` | — | `A word of several syllables stressed on its last vowel is written with an accent: {before} becomes {after}.` | the word was formed by prefixing a family member to a base form that is a stressed monosyllable ending in a vowel (`fa, fo, sta, sto, do, da, so, sa, va`); applied in the family resolver as a juncture on prefix + base form | edi *Accento grafico* §1 ("anche quando sono composti da monosillabi") | `ri+fa → rifà`, `sotto+sta → sottostà`, `ri+do → ridò` |

Not rules (recorded here so nobody adds them): `-gnare/-gnere/-gnire` keep the i of `-iamo/-iate` by plain concatenation (`sogn+iamo = sogniamo`); `-gliare` before `e` keeps the i by plain concatenation (`tagli+erò = taglierò`); `-cere/-gere` verbs change pronunciation, not spelling (`vinco / vinci`); the accent of final-stressed endings (`parlò, finì, parlerà, credé`) is part of the ending data (acute `é` on the closed `-é` of the passato remoto [U]: `poté` — DOP to confirm; the Vocabolario prints `credé`-type forms only with pronunciation marks).

### 4.5 Periphrases and clause

| id | stage | params | Message (en) | Citation |
|---|---|---|---|---|
| `it.periphrasis.perfect` | periphrasis | `auxiliary` | `Passato prossimo: the present of {auxiliary} plus the past participle.` | lgi *Avere o essere?* |
| `it.periphrasis.pluperfect` | periphrasis | `auxiliary` | `Trapassato prossimo: the imperfetto of {auxiliary} plus the past participle.` | serianni XI [U]; lgi *Avere o essere?* (`mi ero vestito`) |
| `it.periphrasis.past-anterior` | periphrasis | `auxiliary` | `Trapassato remoto: the passato remoto of {auxiliary} plus the past participle.` | serianni XI [U] |
| `it.periphrasis.future-perfect` | periphrasis | `auxiliary` | `Futuro anteriore: the future of {auxiliary} plus the past participle.` | serianni XI [U] |
| `it.periphrasis.subjunctive-past` | periphrasis | `auxiliary` | `Congiuntivo passato: the present subjunctive of {auxiliary} plus the past participle.` | lgi *Congiuntivo* |
| `it.periphrasis.subjunctive-pluperfect` | periphrasis | `auxiliary` | `Congiuntivo trapassato: the imperfect subjunctive of {auxiliary} plus the past participle.` | lgi *Congiuntivo* |
| `it.periphrasis.conditional-past` | periphrasis | `auxiliary` | `Condizionale passato: the conditional of {auxiliary} plus the past participle.` | serianni XI [U] |
| `it.periphrasis.infinitive-past` | periphrasis | `auxiliary` | `Past infinitive: {auxiliary} plus the past participle.` | serianni XI [U] |
| `it.periphrasis.gerund-past` | periphrasis | `auxiliary` | `Past gerund: the gerund of {auxiliary} plus the past participle.` | serianni XI [U] |
| `it.clause.subject` | clause | `pronoun` text | `Subject pronoun {pronoun}; in Italian it is often left out.` | serianni XI [U] |
| `it.clause.formal-subject` | clause | `pronoun` text | `Polite address: {pronoun} takes the verb in the third person.` | lgi *Imperativo*; serianni [U] |
| `it.clause.agree-subject` | clause | `gender` term, `number` term | `With essere the past participle agrees with the subject: {gender} {number}.` | lgi *Concordanza* |
| `it.clause.avere-invariable` | clause | — | `With avere the past participle does not change: it ends in -o.` | lgi *Concordanza* (masculine is the default with avere) |
| `it.clause.participle-forms` | clause | `gender` term, `number` term | `Past participle, {gender} {number}.` | lgi *Concordanza* |
| `it.clause.reflexive-pronoun` | clause | `pronoun` text | `The reflexive pronoun {pronoun} goes before the verb.` | lgi *Avere o essere?* (`mi sono lavato`) |
| `it.clause.enclitic` | clause | `pronoun` text | `The pronoun {pronoun} is attached to the end of the verb: {before} becomes {after}.` | edi *Parole enclitiche* §2–3 |
| `it.clause.infinitive-e-drop` | clause | — | `Before an attached pronoun the infinitive loses its final -e: {before} becomes {after}.` | edi *Parole enclitiche* §3 (`far-lo`) |
| `it.clause.enclitic-doubling` | clause | `pronoun` text | `After a one-syllable imperative the apostrophe goes and the first consonant of {pronoun} doubles: {before} becomes {after}.` | edi *Parole enclitiche* §2; voc *enclisi* [S]; edi *Clitici* [S] (not gli) |
| `it.clause.negative-infinitive` | clause | — | `Negative imperative for tu: non plus the infinitive.` | lgi *Imperativo* |
| `it.clause.negative` | clause | — | `Negative imperative: non before the imperative form.` | lgi *Imperativo* |

Total: 21 classify/availability + 12 stem/cell + 16 ending + 5 spelling + 9 periphrasis + 11 clause = **74 rules**.

### 4.6 Ending sets (data, `paradigms.ts`)

Order: 1sg 2sg 3sg 1pl 2pl 3pl. Accents are part of the data.

| Set | `are` | `ere` (and contracted) | `ire` |
|---|---|---|---|
| present indicative | o i a iamo ate ano | o i e iamo ete ono | o i e iamo ite ono |
| imperfect | avo avi ava avamo avate avano | evo evi eva evamo evate evano | ivo ivi iva ivamo ivate ivano |
| passato remoto weak | ai asti ò ammo aste arono | ei esti é emmo este erono; `-etti` series: etti – ette – – ettero | ii isti ì immo iste irono |
| passato remoto strong (1sg, 3sg, 3pl) | — | i – e – – ero | i – e – – ero (venni, apparvi) |
| future (regular: theme + personal; lexical stem: personal only) | erò erai erà eremo erete eranno | erò erai erà eremo erete eranno | irò irai irà iremo irete iranno; personal: ò ai à emo ete anno |
| conditional | erei eresti erebbe eremmo ereste erebbero | erei … | irei iresti irebbe iremmo ireste irebbero; personal: ei esti ebbe emmo este ebbero |
| present subjunctive | i i i iamo iate ino | a a a iamo iate ano | a a a iamo iate ano |
| imperfect subjunctive | assi assi asse assimo aste assero | essi essi esse essimo este essero | issi issi isse issimo iste issero |
| imperative 2sg / 2pl | a / ate | i / ete | i / ite |
| infinitive / gerund / part. pres. / part. pass. | are / ando / ante / ato | ere / endo / ente / uto | ire / endo / ente (lexical iente) / ito |
| participle agreement | o (m.sg) a (f.sg) i (m.pl) e (f.pl) replace the final o | | |

`-ere` weak passato remoto: both series for 1sg/3sg/3pl; `-etti` series ranked first except when the stem ends in `t` (then only `-ei`; Treccani marks `*battetti`). Lexical exceptions: `potere` (`potei`, less common `potetti`: both, `-ei` first, Vocabolario).

---

## 5. Lexicon

### 5.1 Entry type

```ts
interface ItalianEntry {
  readonly class: 'are' | 'ere' | 'ire' | 'contracted' | 'irregular';
  readonly long?: string;                         // long stem of a contracted infinitive: 'fac', 'dic', 'bev', 'pon', 'tra', 'duc'
  readonly isc?: 'yes' | 'no' | 'both';            // -ire only; absent on a listed -ire verb = 'no' (listing implies knowledge)
  readonly present?: Partial<Record<'1sg'|'2sg'|'3sg'|'1pl'|'2pl'|'3pl', readonly string[]>>; // lexical stems
  readonly subjunctive?: readonly string[];        // present-subjunctive sg/3pl stems when not from io (sapp, si, abbi, di, sti, facc)
  readonly past?: readonly string[];               // strong 1sg forms; '' + whole cells for essere/dare/stare
  readonly pastSeries?: 'ei' | 'etti' | 'both';    // -ere weak passato remoto override
  readonly participle?: readonly string[];         // m.sg strong forms, first preferred ('visto', 'veduto')
  readonly future?: readonly string[];             // future/conditional stems with r, first preferred ('morir','morr')
  readonly presentParticiple?: readonly string[] | null; // lexical forms; null = none (defective)
  readonly cells?: Readonly<Record<string, readonly WholeForm[]>>; // 'indicative.present.3.singular': [{ text: 'fa' }]
  readonly auxiliaries?: readonly { readonly lemma: 'avere' | 'essere'; readonly condition?: string }[];
  readonly flags?: readonly ('stressedI' | 'palatal' | 'noImperative' | 'impersonal')[];
  readonly defective?: readonly string[];          // 'participle.present', 'indicative.future', …
  readonly usage?: Readonly<Record<string, 'literary' | 'dated'>>; // per alternative form, e.g. { vo: 'literary' }
}
```

`WholeForm = { text, usage?, pattern? }`. Derived (never stored): imperfect, congiuntivo imperfetto, gerund, weak passato remoto persons, compound tenses, participle agreement, every cell of a regular verb, the subjunctive from the 1sg stem, the imperative from indicative/subjunctive.

### 5.2 Irregular bases (about 170 with families), by pattern

Forms marked [V] are printed in the Treccani Vocabolario header fetched on 2026-11-24 (non-final pronunciation accents removed, e.g. `vèngo → vengo`); [W] only in en.wiktionary's table; [U] from memory, to be verified against the Vocabolario (`https://www.treccani.it/vocabolario/<lemma>/`, or `<lemma>1/`, `<lemma>2/`: for avere, dare, fare, dovere, potere, volere, sapere, mangiare, sedere, udire, piacere, parere the verb is `<lemma>2/`; apparire is found through the site search) before it is entered.

**A. Whole-cell verbs (cells stored)**

| Lemma | Stored | Status |
|---|---|---|
| essere | pres. sono sei è siamo siete sono; impf. ero eri era eravamo eravate erano; p.r. fui fosti fu fummo foste furono; fut. sar-; cong. sia (×3) siamo siate siano; cong. impf. fossi… ; imp. sii, siate; part. pass. stato; part. pres. essente (raro → `usage: literary`); ger. essendo; aux essere ("I tempi composti si coniugano con l'aus. essere: sono stato") | [V] |
| avere | pres. ho hai ha abbiamo avete hanno; p.r. ebbi (strong stem ebb-; avesti…); fut. avr-; cong. abbi- (abbia); imp. abbi, abbiate; part. pres. avente; aux avere | [V] |
| andare | pres. vado (literary vo) vai va andiamo andate vanno; cong. vada… vadano; fut. andr- (anderò "meno com." → not generated [V]); imp. vai, va' (bare `va` archaic per lgi *Imperativo*: not generated); aux essere | [V] |
| dare | pres. do dai dà diamo date danno; p.r. diedi/detti desti diede/dette demmo deste diedero/dettero; fut. dar-; cong. dia… diano; cong. impf. dessi…; imp. dai, da'; part. pres. dante | [V] |
| stare | pres. sto stai sta stiamo state stanno; cong. stia… stiano; imp. stai, sta'; fut. star-; cong. impf. stessi; p.r. stetti stesti stette stemmo steste stettero; aux essere; part. pres. stante | [V] |
| fare (contracted `fac`) | pres. faccio (literary fo) fai fa facciamo fate fanno; p.r. strong fec- (feci, facesti…); fut. far-; imp. fai, fa'; cong. facc-; part. pass. fatto; part. pres. facente (faciente) | [V] |
| dire (contracted `dic`) | pres. dico dici dice diciamo dite dicono; p.r. dissi, dicesti…; fut. dir-; imp. di' (`dì` variant not generated), dite; part. pass. detto; part. pres. dicente; ger. dicendo | [V] |
| sapere | pres. so sai sa sappiamo sapete sanno; cong. sapp-; imp. sappi, sappiate; fut. sapr-; p.r. seppi, sapesti…; part. pres. none | [V] |
| potere | pres. posso puoi può possiamo potete possono; p.r. potei (potetti less common); fut. potr-; cong. possa… ; part. pres. none (potente "solo come agg. e sost."); noImperative | [V] |
| dovere | pres. devo/debbo devi deve dobbiamo dovete devono/debbono; cong. deva/debba … dobbiamo dobbiate devano/debbano; fut. dovr-; noImperative | [V] |
| volere | pres. voglio vuoi vuole vogliamo volete vogliono; fut. vorr-; p.r. volli volesti volle volemmo voleste vollero; part. pres. volente; imp. vogli, vogliate | [V] |

**B. Lexical present stems (+ strong parts)**: venire (veng-/vien-; venni; verr-; venuto; veniente) [V] · tenere (teng-/tien-; tenni; terr-) [W][U] · rimanere (rimang-; rimasi; rimarr-; rimasto) [V] · salire (salg-; salii; salente/saliente; aux essere, avere when transitive) [V] · valere (valg-; valsi; varr-; valso; aux essere, avere in some senses) [V] · parere (pai-/par-, 1pl paiamo; parvi; parr-; parso; no part. pres.; aux essere) [V] · porre (pong-/pon-; posi; porr-; posto; ponente) [V] · trarre (tragg-/tra-, `trai, trae, traiamo, traete`; trassi; trarr-; tratto; traente; imp. trai, traete) [V] · -durre (-duc-; -dussi; -durr-; -dotto; -ducente) [V tradurre, condurre] · uscire (esc- when stressed; aux essere) [V] · udire (od- when stressed; udir-/udr-) [V] · morire (muoi-/muor-; morir-/morr-; morto; morente; aux essere) [V] · sedere (sied- when stressed; sedei/sedetti; seder-, siederò spoken → both; seduto) [V] · cuocere (palatal; cuoc- stressed, cuoc-/coc- unstressed; cossi; cotto; cocente) [V] · piacere (piacc- 1sg/1pl/3pl; piacqui; piaciuto; aux essere) [V] · tacere, giacere (as piacere; tacqui, giacqui; aux avere / essere) [W][U] · nuocere (noc-/nuoc-; nocqui; nociuto) [U] · scegliere, togliere, cogliere, sciogliere (`-lg-` before o/a: scelgo, scelga; scelsi; scelto) [W][U] · dolere (dolg-; dolsi; dorr-; aux essere/avere) [U] · solere (sogli-/suol-; part. solito; defective) [V] · apparire / comparire / scomparire (appai-/apparisc- both; apparvi, apparsi, apparii; apparso; aux essere) [V apparire] · muovere family (muov- stressed, muov-/mov- unstressed [U]; mossi; mosso) · cadere (caddi; cadr-; aux essere) [V] · bere (bev-; bevvi/bevetti; berr-) [V] · vedere (vidi; vedr-; visto/veduto) [W] · vivere (vissi; vivr-; vissuto; aux essere, avere in some senses) [V] · godere (godr-) [U].

**C. Strong passato remoto and participle, regular present** (1sg past / participle) [U unless marked]: accendere accesi/acceso [V] · aprire aprii, apersi/aperto [V] · coprire, offrire (offrii/offersi, offerto [W]), soffrire · prendere presi/preso [W] · chiudere chiusi/chiuso · rendere resi/reso · scendere scesi/sceso (aux essere/avere) · spendere spesi/speso · tendere tesi/teso · appendere appesi/appeso · difendere, offendere -fesi/-feso · ridere risi/riso · dividere divisi/diviso · decidere decisi/deciso · uccidere uccisi/ucciso · ccludere family -clusi/-cluso · rodere, esplodere -osi/-oso · invadere, evadere, persuadere -asi/-aso · mordere morsi/morso · perdere persi/perso (also perdei, perdetti; perduto) · correre corsi/corso [V] · chiedere chiesi/chiesto · rispondere risposi/risposto [W] · nascondere nascosi/nascosto · porgere, sorgere, scorgere, accorgersi -orsi/-orto · spargere sparsi/sparso · emergere, immergere -ersi/-erso · giungere, ungere, pungere -unsi/-unto · spingere, tingere, fingere, dipingere -insi/-into · stringere strinsi/stretto · piangere piansi/pianto · vincere vinsi/vinto · torcere torsi/torto · volgere family volsi/volto · assolvere, risolvere -olsi/-olto · esprimere family -essi/-esso · scuotere, percuotere -ossi/-osso · discutere discussi/discusso · mettere family misi/messo · leggere family lessi/letto [W] · reggere, correggere ressi/retto · proteggere protessi/protetto · friggere frissi/fritto · distruggere distrussi/distrutto · scrivere family scrissi/scritto [W] · conoscere conobbi/conosciuto [W] · crescere crebbi/cresciuto (aux essere) · nascere nacqui/nato (aux essere) [W] · rompere ruppi/rotto [W] · piovere piovve (impersonal; aux essere or avere) [V].

### 5.3 Lexical authority fetched for this design

Vocabolario headers [V] (2026-11-24): essere `essere1/`, avere `avere2/`, andare `andare1/`, venire, dare `dare2/`, stare, fare `fare2/`, dire, bere, tradurre, dovere `dovere2/`, potere `potere2/`, volere `volere2/`, sapere `sapere2/`, salire, uscire, cadere, accendere, aprire, mangiare `mangiare2/`, finire, apparire (site search), sedere `sedere2/`, cuocere, porre, morire, udire `udire2/`, piacere `piacere2/`, rimanere, valere, parere `parere2/`, trarre, condurre, solere, piovere, correre, vivere, sognare, inviare, sciare `sciare1/`. Every other entry is verified the same way at implementation (plan Task 2), and an entry verified only on en.wiktionary is flagged `secondary` in `sources.ts`.

### 5.4 Side lists

| List | Lemmas | Status |
|---|---|---|
| **non-isc `-ire`** (~55) | aprire, riaprire, coprire, ricoprire, scoprire, riscoprire, offrire, soffrire, avvertire, convertire, divertire, invertire, pervertire, sovvertire, bollire, ribollire, cucire, scucire, ricucire, sdrucire, dormire, fuggire, rifuggire, sfuggire, partire (= leave; ripartire 'divide' is isc), pentirsi, seguire, conseguire, inseguire, perseguire, proseguire, sentire, acconsentire, assentire, consentire, dissentire, presentire, risentire, servire, vestire, investire, rivestire, travestire, morire, salire, risalire, uscire, riuscire, venire (+ family), udire, apparire*, comparire*, scomparire* (*both stems, §3.5) | [U] each: Vocabolario header `(io X-o …)` |
| **both isc and plain** (~12) | applaudire, assorbire, inghiottire, mentire, nutrire [V lgi *Terza coniugazione*]; aborrire, languire, tossire, eseguire, muggire, ruggire, starnutire [U] | |
| **isc traps** (look plain, take isc) | smentire [V lgi *Incoativi*: `smentiscano`], sparire, ardire, spedire, ripartire ('divide'), asservire | [U] except smentire |
| **essere** (~120) | andare, venire (+family: avvenire, divenire, intervenire, pervenire, provenire, svenire, sopravvenire), arrivare, giungere, partire, entrare, uscire, riuscire, tornare, ritornare, restare, rimanere, stare, essere, diventare, nascere, morire, cadere, accadere, scadere, avvenire, succedere, capitare, sembrare, parere, apparire, comparire, scomparire, sparire, svanire, costare, bastare, piacere, dispiacere, giacere, mancare, occorrere, emergere, sorgere, risorgere, evadere, fuggire, sfuggire, scappare, ingrassare, dimagrire, invecchiare, impazzire, arrossire, impallidire, ammalarsi (refl.), esistere, consistere, sussistere, dipendere, derivare, risultare, crescere, decrescere, appassire, sbocciare, tramontare, piovere*, nevicare*, … (*dual) | [V] for andare, venire, stare, uscire, cadere, piacere, rimanere, parere, apparire, morire, salire (intr.), essere; rest [U] |
| **dual** (~40) with condition glosses | correre (essere: towards a goal; avere: the action in itself) [V]; vivere (essere; avere in some senses) [V]; salire, scendere (essere intransitive; avere transitive) [V salire]; valere [V]; piovere, nevicare, grandinare, tuonare, lampeggiare (essere; avere for longer duration) [V piovere]; cominciare, finire, iniziare, terminare, passare, cambiare, aumentare, diminuire, migliorare, peggiorare, bruciare, guarire, affondare, saltare, volare, atterrare, decollare, emigrare, durare, vivere, sopravvivere, convivere, ricorrere, crescere, avanzare, continuare, mancare, servire, dovere/potere/volere (servile: the auxiliary of the infinitive; here avere first, essere second) [V dovere2, potere2] | [U] for the unmarked |
| **stressed-i `-iare`** (~18) | inviare, rinviare, avviare, riavviare, deviare, sviare, traviare, fuorviare, ovviare, obliare, spiare, espiare, sciare, desiare, ravviare, disviare, pigiare? (no: graphic i), and the `-iare` lemmas where the Vocabolario prints `io …ìo` | [V] inviare (`io invìo`), sciare (`io scìo`); rest [U] |
| **palatal** | cucire, scucire, ricucire, sdrucire, cuocere, ricuocere, stracuocere | [V] cuocere, [W] cucire |
| **no imperative** | potere, dovere [V]; parere [W][U]; solere [W][U] | |
| **impersonal** | piovere, nevicare, grandinare, tuonare, lampeggiare, piovigginare, diluviare, gelare (intr.) | [U]: verify each; personal figurative uses (`piovono critiche`) are not modelled — available only for the unmarked third persons `3sg.m` and `3pl` (`3sg.f`, 1st and 2nd persons, imperative: `it.avail.impersonal`); the clause emits no subject part (`piove`, `piovono`) |
| **defective** | solere: future, conditional, imperative; sapere, potere, parere: participle.present | [V] |

---

## 6. Periphrases and clause

### 6.1 Compound tenses (all `applies` to every lexeme; `reports: 'perfectAuxiliary'`)

| Target | Chain |
|---|---|
| `indicative.perfect` | `perfectAuxiliary` indicative.present · `main` participle (agree) |
| `indicative.pluperfect` | `perfectAuxiliary` indicative.imperfect · `main` participle (agree) |
| `indicative.past_anterior` | `perfectAuxiliary` indicative.simple_past · `main` participle (agree) |
| `indicative.future_perfect` | `perfectAuxiliary` indicative.future · `main` participle (agree) |
| `subjunctive.past` | `perfectAuxiliary` subjunctive.present · `main` participle (agree) |
| `subjunctive.pluperfect` | `perfectAuxiliary` subjunctive.imperfect · `main` participle (agree) |
| `conditional.past` | `perfectAuxiliary` conditional.present · `main` participle (agree) |
| `infinitive.past` | `perfectAuxiliary` nonFinite infinitive · `main` participle (agree) |
| `gerund.past` | `perfectAuxiliary` nonFinite gerund · `main` participle (agree) |

The auxiliary of `essere` is `essere` (`sono stato`, `fui stato`). Auxiliaries are conjugated through the pack, so their own steps (`it.cell.lexical` for `sono`) come for free. Trapassato remoto of an essere verb: `fui andato` (Serianni [U]).

### 6.2 Agreement (`clause.agreements(context)`)

| Situation | Agreement fork | Step |
|---|---|---|
| auxiliary `avere` | `one(null)` → participle cell without agreement = m.sg `-o` | `it.clause.avere-invariable` |
| auxiliary `essere` (incl. every reflexive), finite target | number = target number; gender = slot gender (`3sg.m`/`3sg.f`), else `query.gender`, else fork masculine, feminine | `it.clause.agree-subject` (gender, number) per outcome |
| auxiliary `essere`, non-finite target (`essere andato`) | the four agreements (m.sg, f.sg, m.pl, f.pl), filtered by `query.gender` | `it.clause.agree-subject` |
| bare `participle.past` target | four agreements, filtered by `query.gender` | `it.clause.participle-forms` |
| any other agreeing cell (none today) | `one(null)` | — |

For a lexeme with two auxiliaries, each outcome also carries the auxiliary's `condition` tag from the lexicon (`correre`: `towards a goal` for essere, `the action in itself` for avere), so the two compound forms are told apart by `variant.auxiliary` and `variant.condition`. Mixed-gender plural is masculine (Treccani *Concordanza*); the engine does not model mixed subjects beyond that.

### 6.3 Word order and particles (`clause.assemble`)

| Construction | Order (parts) | Example |
|---|---|---|
| finite, non-reflexive | subject · verb chain | `io ho parlato` |
| finite, reflexive | subject · reflexive pronoun (`mi ti si ci vi si`; Lei/Loro `si`) · verb chain | `lei si è lavata` |
| imperative tu/noi/voi, reflexive | verb + enclitic (joinBefore `attached`) | `lavati`, `laviamoci`, `lavatevi` |
| imperative after `va' da' fa' di' sta'`, reflexive | apostrophe dropped, clitic consonant doubled (not `gli`) | `fa'+ti → fatti`, `da'+ti → datti` |
| imperative Lei/Loro (subjunctive forms) | proclitic | `si lavi`, `si lavino` |
| negative imperative tu | `non` · infinitive; reflexive: two forms, `non ti lavare` (proclitic, ranked first) and `non lavarti` (enclitic, `-e` dropped), `pattern: 'proclitic' / 'enclitic'` | `non parlare` |
| negative imperative other persons | `non` · imperative form; reflexive noi/voi: proclitic and enclitic forms (`non ci laviamo` / `non laviamoci`); Lei/Loro: proclitic only | `non parli` |
| infinitive / gerund, reflexive | enclitic `si` (`-e` dropped on the infinitive) | `lavarsi`, `lavandosi` |
| infinitive past / gerund past, reflexive | enclitic on the auxiliary | `essersi lavato`, `essendosi lavato` |
| participle, reflexive | no clitic (the `lavatosi` type is unmodelled) | `lavato` |

`non` is a part with role `particle` (never omitted by `bare`). No sandhi or elision at render time (`PackRendering.sandhi` returns null; `bareOmits` returns false).

---

## 7. Worked derivations (English explanation as a learner reads it)

1. **`io parlo`** — `it.classify.conjugation` (parlare ends in -are) → `it.classify.assume-regular` / or lexicon if listed → `it.stem.infinitive` (parl-) → `it.end.present` (-o, 1st person singular) → `it.clause.subject` (io).
2. **`tu cerchi`** — `it.stem.infinitive` (cerc-) → `it.end.present` (-i) → `it.orth.velar-h` (cerci → cerchi).
3. **`io comincerò`** — `it.stem.infinitive` (cominci-) → `it.end.future-ar-er` (-erò: cominci + erò) → `it.orth.palatal-i-drop` (comincierò → comincerò).
4. **`tu studi`** — `it.stem.infinitive` (studi-) → `it.end.present` (-i) → `it.orth.i-merge` (studii → studi).
5. **`tu invii` / `noi inviamo`** — `it.classify.stressed-i` (io invio) → `it.stem.infinitive` (invi-) → `it.end.present` (-i): no merge, the i is stressed → `invii`; 1pl: `it.end.present` (-iamo) → `it.orth.i-merge` (inviiamo → inviamo).
6. **`che io venga`** — `it.classify.lexicon` (venire) → `it.stem.subjunctive-from-1sg` (base vengo: veng-) → `it.end.subjunctive-present` (-a).
7. **`lui prese` / `noi prendemmo`** — `it.stem.strong-past` (pres-) → `it.end.past-strong` (-e); 1pl: `it.stem.infinitive` (prend-) → `it.end.past` (-emmo).
8. **`loro finiscono`** — `it.classify.isc` → `it.stem.infinitive` (fin-) → `it.stem.isc` (fin- → finisc-) → `it.end.present` (-ono).
9. **`tronisco`** (invented) — analysis: `it.classify.conjugation` (-ire), `it.classify.assume-regular`, `it.classify.assume-isc`, `it.classify.assume-avere`; form: `it.stem.infinitive` (tron-) → `it.stem.isc` (tronisc-) → `it.end.present` (-o).
10. **`io sono andata`** — form: `it.periphrasis.perfect` (auxiliary essere) → `it.clause.agree-subject` (feminine singular) → `it.clause.subject` (io); auxiliary part `sono`: `it.cell.lexical`; participle part: `it.stem.infinitive` (and-) → `it.end.participle` (-ata).
11. **`lei si è lavata`** — analysis: `it.classify.reflexive` (lavarsi → lavare), `it.classify.reflexive-essere`; form: `it.periphrasis.perfect` (essere) → `it.clause.agree-subject` (feminine singular, from the slot `lei`) → `it.clause.subject` (lei) → `it.clause.reflexive-pronoun` (si).
12. **`fatti`** (farsi, imperative tu) — `it.cell.lexical` (fa') → `it.clause.enclitic-doubling` (fa' + ti → fatti).
13. **`non ti lavare` / `non lavarti`** — cell infinitive (`it.end.infinitive`: lavare) → `it.clause.negative-infinitive`; proclitic: `it.clause.reflexive-pronoun` (ti); enclitic: `it.clause.infinitive-e-drop` (lavare → lavar) → `it.clause.enclitic` (lavar → lavarti).
14. **`sbradussi`** (invented) — `it.classify.contracted` (long stem sbraduc-), `it.classify.assume-family` (-durre) → `it.stem.strong-past` (sbraduss-) → `it.end.past-strong` (-i).
15. **`lui rifà`** — `it.classify.family` (ri + fare) → whole form `fa` of fare (`it.cell.lexical`) → `it.orth.final-accent` (rifa → rifà).
16. **`conosciuto`** — `it.stem.infinitive` (conosc-) → `it.end.participle` (-uto) → `it.orth.participle-ci` (conoscuto → conosciuto).
17. **`sappiate`** (imperative voi) — `it.stem.subjunctive-from-1pl` (sappiamo: sapp-) → `it.end.imperative-subjunctive`.
18. **`Lei è andato` / `Lei è andata`** — `it.periphrasis.perfect` (essere) → `it.clause.agree-subject` (masculine singular | feminine singular) → `it.clause.formal-subject` (Lei).

---

## 8. Test data

### 8.1 Invented verbs (expected forms written by hand; bare forms unless a subject is shown)

| Verb | Rule under test | Key forms | Assumptions |
|---|---|---|---|
| blorpare | regular `are` | blorpo, blorpi, blorpa, blorpiamo, blorpate, blorpano; blorpavo; blorpai, blorpò, blorparono; blorperò; blorperei; cong. blorpi, blorpino; cong. impf. blorpassi; imp. blorpa, (Lei) blorpi, blorpiamo, blorpate, (Loro) blorpino; non blorpare; blorpando, blorpante, blorpato; ho blorpato | regular, avere |
| flugare | velar-h (g) | flugo, flughi, fluga, flughiamo, flugate, flugano; flugherò; cong. flughi, flughino; flugai, flugò | regular, avere |
| tricare | velar-h (c) | trico, trichi, trichiamo; tricherò; cong. trichino | regular, avere |
| sbonciare | palatal-i-drop | sboncio, sbonci, sboncia, sbonciamo, sbonciate; sboncerò, sboncerei; cong. sbonci, sboncino; sbonciai | regular, avere |
| sbasciare | palatal-i-drop after sc | sbascio, sbasci, sbasciamo; sbascerò | regular, avere |
| trongiare | palatal-i-drop (g) | trongio, trongi, trongiamo; trongerò | regular, avere |
| trebiare | i-merge, unstressed default | trebio, trebi, trebia, trebiamo, trebiate, trebiano; cong. trebi, trebino; trebierò | regular, avere, unstressed i |
| trebiare + `stems: { stressedI: true }` | stressed i kept | trebio, trebii, trebiamo; cong. trebii, trebiino; imp. (Loro) trebiino | regular, avere |
| frogliare | -gliare | froglio, frogli, frogliamo; froglierò; cong. froglino | regular, avere |
| strognare | -gnare (no rule) | strogno, strogni, strogniamo, strognate; cong. strogniamo, strogniate, strognino; never `strognamo` | regular, avere |
| blendere | regular `ere`, both p.r. series | blendo, blendi, blende, blendiamo, blendete, blendono; blendevo; blendetti/blendei, blendesti, blendette/blendé, blendemmo, blendeste, blendettero/blenderono; blenderò; cong. blenda, blendiate; blendessi; imp. blendi; blenduto; blendendo; blendente | regular, avere |
| flattere | stem in t → -ei only | flattei, flatté, flatterono; never `flattetti` | regular, avere |
| flacere | participle-ci | flaco, flaci, flace; flaciuto | regular, avere |
| tronire | isc default | tronisco, tronisci, tronisce, troniamo, tronite, troniscono; cong. tronisca, troniscano; imp. tronisci, (Lei) tronisca; tronivo; tronii, tronì; tronirò; tronito; tronendo; tronente | regular, isc, avere |
| tronire + `classHint: 'plain'` | plain -ire | trono, troni, trone, troniamo, tronite, tronono; cong. trona | regular, avere |
| sbradurre | -durre family | sbraduco, sbraduci, sbraduce, sbraduciamo, sbraducete, sbraducono; sbraducevo; sbradussi, sbraducesti, sbradusse, sbradussero; sbradurrò; sbradurrei; cong. sbraduca; sbraducessi; imp. sbraduci; sbradotto; sbraducendo; sbraducente | family -durre, avere |
| stramettere | prefix family (stra + mettere) | stramisi, stramise, stramettesti; stramesso | avere (not inherited) |
| blomettere | not a prefix → regular (stem in t: `-ei` only) | blomettei, blomettesti, blometté; blomettuto; never `blomisi`, `blomettetti` | regular, avere |
| blorparsi | reflexive | io mi blorpo, lei si blorpa, noi ci blorpiamo; io mi sono blorpato / blorpata; noi ci siamo blorpati / blorpate; imp. blorpati, (Lei) si blorpi, blorpiamoci, blorpatevi; non ti blorpare / non blorparti; blorparsi; blorpandosi; essersi blorpato | regular (reflexive → essere, no avere assumption) |
| blorpare + `auxiliary: 'essere'` | hint | sono blorpato / sono blorpata | regular |

### 8.2 Real verbs outside the scraped oracle (bare forms; status of each form)

| Verb | Forms | Where verified |
|---|---|---|
| sporcare, vagare | sporchiamo; vagherà | lgi *Prima coniugazione* [V] |
| rinunciare, danneggiare, lasciare | rinuncerò; danneggeremo; lascerò | lgi *Prima coniugazione* [V] |
| tagliare, fischiare, ringhiare | taglierai; fischiamo; ringhi (2sg) | lgi *Prima coniugazione* [V] |
| sognare | sogniamo, sognate, cong. sogniamo, sogniate | lgi *Prima coniugazione*; voc *sognare* [V] |
| inviare, sciare | invii (2sg), invio; sciino (cong. 3pl), scio | lgi *Prima coniugazione*; voc [V] |
| studiare, ripudiare | studi (2sg); ripudino (cong. 3pl) | lgi *Prima coniugazione* [V] |
| allineare, creare | allineeremo; creerei | lgi *Prima coniugazione* [V] |
| finire, capire, preferire, contribuire | finisco, finisci, finisce, finiscono; capisci; preferisce; contribuiscono | lgi *Incoativi*; edi *Coniugazione verbale* [V] |
| definire, favorire, obbedire, smentire | cong. definisca, favorisca, obbedisca; smentiscano | lgi *Incoativi* [V] |
| inserire, guarire, reagire | imp. inserisci; (Lei) guarisca; (Loro) reagiscano | lgi *Incoativi* [V] |
| mentire, inghiottire, insignire | mento / mentisco; inghiotti / inghiottisci; insigniamo | lgi *Terza coniugazione* [V] |
| partire | parto, parti, parte, partono | edi *Coniugazione verbale* [V] |
| battere, credere, vendere | battei; credetti / credei; vendei / vendetti, vendesti | lgi *Seconda coniugazione*; edi *Passato remoto* [V] |
| vincere, stringere, spegnere | cong. vinca; stringo; spegniamo | lgi *Seconda coniugazione* [V] |
| tacere, crescere | taciuto; cresciuto | lgi *Seconda coniugazione* [V] |
| sedersi, tenere | mi siedo, ci sediamo; tiene, tenete | lgi *Seconda coniugazione* [V] |
| togliere, prendere, rompere, muovere | tolgo, tolsi, tolto; prendo, presi; ruppi; mossi | edi *Coniugazione verbale* [V] |
| cantare, fare, scrivere, vedere | cantai, cantasti; feci, fece, facesti; scrissi, scrisse, scrivemmo; vidi, vide, vedeste | edi *Passato remoto* [V] |
| parlare, venire, correre | imp. parla, parlate; vieni, venite; corri, correte; non parlare | lgi *Imperativo* [V] |
| alzarsi | non alzarti (neg. imp. tu) | lgi *Imperativo* [V] |
| amare, lavarsi, vestirsi, nascere, crescere, andare, partire, camminare, viaggiare, dormire | ho amato; mi sono lavato; mi ero vestito; sono nato; sono cresciuto; sono andato; sono partito; ho camminato; ho viaggiato; ho dormito | lgi *Avere o essere?* [V] |
| arrivare | (lei) è arrivata | lgi *Concordanza* ("Laura è arrivata") [V] |
| correre | ho corso; sono corso | edi *Ausiliari* §3 [V] |
| porre, trarre, morire, udire, piacere, rimanere, valere, parere, sedere, cuocere, apparire, solere, piovere, vivere | forms of the Vocabolario headers (§5.2) | voc [V] |

### 8.3 Authority cells (`tests/goldens/it/authority/*.json`)

Exact expectations only for forms a source prints, one file per source page, never engine-generated. File schema: `{ source: { work, entry, url, retrieved: '2026-11-24' }, cells: [{ lemma, query: { mood, tense, person?, number?, subject? }, forms: string[], printed: string, excluded?: { form: string, reason: string }[] }] }`, where `printed` is the text as the page shows it (with Treccani's pronunciation accents, hyphens such as `sporc-hiamo`) and `forms` is the normalized spelling. Normalization from `printed`: remove `-` segmentation marks; remove grave/acute accents on any vowel that is not the word's last letter (`vèngo → vengo`, `invìi → invii`, `sarèi → sarei`), keep them on the last letter (`verrò`, `poté`); remove diaeresis and dot-below (`invïato → inviato`, `rimaṡi → rimasi`); drop bracketed pronunciation notes (`‹ò›`, `〈dò〉`) and bracketed `ant./poet./pop./dial./tosc.` alternatives. The comparison is bare text (no subject) and asks that every listed form is generated for that target and that no `excluded` form is. `excluded` holds unbracketed alternatives the page prints that this design deliberately does not generate, each with its reason: `dò` (dare io) and `dànno` (optional diacritic accent; *Accento grafico*), `dètte` (pronunciation mark), `dà`/`va`/`fa`/`sta` as imperatives and `dì` (dire imperative) (lgi *Imperativo*, edi *Accento grafico*: `fa', va', da', di', sta'`), `anderò`/`anderei` (Vocabolario "meno com."; not in the first en.wiktionary table either). Every other unbracketed alternative must be generated (e.g. `fo` beside `faccio`, `deva` beside `debba`, `sederò` and `siederò`, `cociamo` beside `cuociamo`).

| File | Cells (count) | Source |
|---|---|---|
| `prima-coniugazione.json` | 16 (§8.2 rows 1–8) | lgi *Prima coniugazione* |
| `incoativi.json` | 11 | lgi *Incoativi* |
| `terza-coniugazione.json` | 5 | lgi *Terza coniugazione* |
| `seconda-coniugazione.json` | 10 | lgi *Seconda coniugazione* |
| `passato-remoto.json` | 13 | edi *Passato remoto* |
| `coniugazione-verbale.json` | 14 | edi *Coniugazione verbale* |
| `imperativo.json` | 22 (`parla, parlate, vieni, venite, corri, correte, stai, sta', vai, va', fai, fa', dai, da', sii, abbi, sappi, vogli, siate, abbiate, sappiate, vogliate, non parlare, non alzarti`) | lgi *Imperativo* |
| `ausiliari.json` | 13 (compound forms above, incl. `è arrivata`, `ho corso`, `sono corso`) | lgi *Avere o essere?*, *Concordanza*; edi *Ausiliari* |
| `vocabolario.json` | every form in the 40 headers of §5.3 that the header prints for a modelled cell, excluding bracketed alternatives (≈ 420 cells) | voc |
| `serianni.json` | model paradigms amare, temere, servire, finire, essere, avere — **transcribed by hand from the print book with page numbers; empty until then** | serianni [U] |

### 8.4 Second oracle: en.wiktionary tables (decision and specification)

**Which Wiktionary.** English Wiktionary. Its tables come from Module:it-verb, with per-verb specs, footnoted variants, a machine-readable inflection tag on every form (`class="… form-of lang-it 1|s|pres|ind-form-of …"`) and the orthographic spelling of each form in the link's `title` attribute (the displayed text carries stress marks: `pàrlo` → title `parlo`). Italian Wiktionary's `Appendice:Coniugazioni/Italiano/<verb>` pages are generated by `{{It-conj|stem|class|aux|overrides}}` from sparse hand-written overrides and show visible errors (the `andare` appendix, revision 4043876, has `prem3s=annò` and no `fut1s`). Both verified 2026-11-24.

**Fetch, pinned.**
- Pin list: `scripts/corpus/sources/wiktionary-it.ts` holds `{ title, revid }` for each verb plus `modules: { 'Module:it-verb': 88555991, 'Module:it-common': 79032535, 'Template:it-conj': 67345439, 'Module:romance utilities': 93472717, 'Module:inflection utilities': 93431792 }` (revisions current on 2026-11-24).
- Fetch one page: `GET https://en.wiktionary.org/w/api.php?action=parse&oldid=<revid>&prop=text|revid|templates&format=json&formatversion=2&maxlag=5`. `action=parse` renders the pinned page revision **with the current modules**, so the importer first queries `action=query&prop=revisions&titles=<module titles joined by |>&rvprop=ids&format=json&formatversion=2` and refuses to run when a module revision differs from the pin (option `--accept-modules` re-pins after a human compares the diff of the fixture).
- New pins: `action=query&prop=revisions&titles=<≤50 titles>&rvprop=ids|timestamp&format=json&formatversion=2`.
- Politeness: sequential, one request every 20 s (2026-11-24: requests 0.3 s and 4 s apart were refused with "You are making too many requests to the API"; 12–20 s worked), honour `Retry-After`, a generic `User-Agent` naming the tool (no personal data).
- Licence and attribution: Wiktionary text is CC BY-SA 4.0. The fixture `tests/fixtures/wiktionary-it.json` records per verb `title`, `revid`, `url: https://en.wiktionary.org/w/index.php?title=<title>&oldid=<revid>`, `history: https://en.wiktionary.org/w/index.php?title=<title>&action=history`, plus top-level `licence: 'CC BY-SA 4.0'`, `attribution: 'English Wiktionary contributors'`, `modules` (the pins) and `retrieved`. This fixture is therefore not neutral, by necessity of the licence; the scraped-corpus fixtures stay neutral.

**Parser (`parseWiktionaryItalian(html, title)`).** Input: the `text` of the parse response.
1. Take the `<h2 id="Italian">` section up to the next `mw-heading2`; inside it the first `<h4>` (or `<h3>`) whose id starts with `Conjugation`; inside that, the **first** `table.roa-inflection-table` only (later tables are "Including lesser-used forms:" and "Apocopic forms"; they are ignored). No Italian section or no table → throw.
2. Rows `tr`. Row header = `th > span[title]` (Italian label: `infinito`, `verbo ausiliare`, `gerundio`, `participio presente`, `participio passato`, `indicativo`, `presente`, `imperfetto`, `passato remoto`, `futuro semplice`, `condizionale presente`, `congiuntivo`, `congiuntivo presente`, `congiuntivo imperfetto`, `imperativo`, `imperativo negativo`). A row of only `th` sets the current mood (`indicativo`, `congiuntivo`, `imperativo`); the imperative's form row has no header and follows the `imperativo` header row.
3. Non-finite rows pair each `th` label with the next `td`.
4. Finite rows: six `td`, order 1sg 2sg 3sg 1pl 2pl 3pl. Imperative rows: first `td` empty (1sg); then tu, Lei, noi, voi, Loro.
5. A `td`: remove `<sup>` footnote markers but record their numbers; split the alternatives on the top-level `,` between `span.Latn` groups; an alternative's text = its `a[title]` values (suffix ` (page does not exist)` removed) and `strong.selflink` (= the page title) joined by spaces (`mi lavo`, `non lavarti`); text without links has non-final accents stripped. `—` or `-` → unavailable cell; empty → blank (no cell).
6. Footnotes: the `roa-footnote-inner-div` after the table maps numbers to notes; each form stores its notes. Forms are all expected regardless of the note (they are the main table); the corrections ledger may drop a noted form with a reason.
7. Normalize like the corpus (`normalizeText`), deduplicate alternatives (stress variants collapse: `parlerèbbe`, `parlerébbe` → `parlerebbe`).

**Cells per verb:** infinitive, gerund, present participle, past participle, auxiliary (special cell: list of lemmas with notes), 24 indicative (present, imperfect, passato remoto, future), 6 conditional, 12 subjunctive, 5 imperative, 5 negative imperative = **57**; 63 pages (60 verbs absent from the scraped oracle + 3 controls) → 3,591 cells minus blanks (counted and pinned).

**Mapping to targets.** Finite 3sg → slot `3sg.m` (pronoun not compared); imperative 3sg/3pl → `3sg.formal`/`3pl.formal`; comparison on **bare** text (Wiktionary prints no subjects). Reflexive verbs: finite cells carry the clitic (`mi lavo`), matching the engine's bare text. Auxiliary cell: the set of auxiliaries equals `analysis.auxiliaries` (and `analysis.alternatives` for two-paradigm verbs). Unmodelled reasons: `participle-enclitic` (reflexive `participio presente/passato` such as `lavantesi`, `lavatosi`).

**The 60 verbs and 3 controls** (page revisions current on 2026-11-24):

| Rule/class covered | Verbs (revid) |
|---|---|
| regular `are`, essere | parlare 95361365, arrivare 89824946 |
| velar-h | cercare 93064583, pagare 92967541 |
| palatal-i-drop | cominciare 90563718 (dual aux), viaggiare 91807455, lasciare 90560226 |
| `-iare` unstressed / stressed / graphic | studiare 89347598, inviare 92164839, sciare 92185768 |
| `-gliare`, `-gnare` | tagliare 91081103, sognare 71374081 |
| regular `ere`, both p.r. series | credere 93068412, temere 95591318 |
| strong p.r. + participle | leggere 90560159, scrivere 90560296, prendere 83543888, mettere 92930158, chiudere 80611967, rispondere 88485717, rompere 89607184, conoscere 89542567 (participle-ci), correre 92710863 (dual) |
| future syncope | vedere 89962297, vivere 92965713 (dual), rimanere 71257969, tenere 90986711, valere 91977481, parere 91220143, morire 90560311, udire 83407020 |
| lexical present stems | scegliere 88487566, sedere 88180102, piacere 90660573, tacere 93763510, cuocere 88492138 (palatal), muovere 93740130, apparire 91401087 |
| contracted / families | porre 93588648, comporre 90563367, condurre 87608980, produrre 93134352, trarre 89195317, rifare 90563591 (final accent), predire 83047409 |
| essere verbs | nascere 92729603, partire 89923410 |
| `-ire` isc / plain / special | finire 89794925 (dual), capire 95433745, preferire 71374093, dormire 88348335, sentire 92117564, seguire 93623641, offrire 88489221, cucire 88481418 (palatal) |
| reflexive | lavarsi 77623237, vestirsi 77623251, accorgersi 91568522 |
| impersonal, defective | piovere 91071642, solere 91569586 |
| oracle-overlap controls (also in the scraped corpus) | andare 95823997, essere 95493711, dovere 95603598 |

Observed Wiktionary points that will need ledger entries or engine variants (from the 60 parsed tables): `prendere` aux `essere` noted "Also in the meaning 'to happen unexpectedly'" (idiom; drop); `arrivare` and `morire` aux `avere` (sense-restricted; drop); `muovere` aux essere (intransitive; add to the dual list); `piovere` personal 1st/2nd persons (impersonal in the engine; unavailable); `vedere` part. pres. `veggente` (adjective/noun; drop); `cuocere` `coc-` forms "Now rare" (Vocabolario has `cociamo/cocete` as alternatives: generate as variants); `sedere` future `sederò` and `siederò` (both, Vocabolario); `temere` and `dovere` `-ei` forms footnoted "Traditional" (generated); the mechanical present participles `capente, prendente, studiante` (generated by rule, so they pass); `sentire`, `essere`, `dovere` blank present participle (no expectation).

---

## 9. Oracle (scraped verbix pages, `Italiano/`, 20 files)

### 9.1 Page structure

- Encoding: ASCII with HTML entities (`&egrave;`, `&ograve;`, `&agrave;`); declared UTF-8; decode as `utf-8` (fatal) and let cheerio decode entities; NFC.
- Content between `<!-- #BeginEditable "Full_width_text" -->` and `<!-- #EndEditable -->`. Five `div.column` blocks with `<h3>`: `Nominal Forms`, `Indicativo`, `Congiuntivo`, `Condizionale`, `Imperativo`.
- **Nominal Forms**: one table row with two `td.verbtable > p`. First `p`: four labelled lines `<b>Infinito:</b>`, `<b>Participio presente:</b>`, `<b>Gerundio:</b>`, `<b>Participio passato:</b>`, each followed by one or more `span` (class `normal`/`irregular`) separated by `; ` (alternates, e.g. `salente; saliente`), ended by `<br>`. Second `p`: exactly three `span` lines: (1) `avere|essere` + participle, (2) `avendo|essendo` + participle, (3) `avente|essente` + participle. Assert the prefixes.
- **Finite blocks**: each `td > p` holds one tense: a `<b>` label (strip `<br>` and whitespace) then six lines split on `<br>`; each line = `font > span.normal` (pronoun label `io|tu|lui|noi|voi|loro`) followed by one or more form spans separated by `; `. Span classes: `normal`, `irregular` (irregular form), `orto` (spelling change, e.g. `mangi`), `notused`. Classes other than `notused` carry no meaning for the parser.
- Indicativo order: Presente, Passato prossimo, Imperfetto, Trapassato prossimo, Futuro, Futuro anteriore, Passato remoto, Trapassato remoto. Congiuntivo: Presente, Passato prossimo, Imperfetto, Trapassato prossimo. Condizionale: Presente, Passato.
- **Imperativo**: malformed markup (`<tr>`/`<td>` outside a table; the HTML parser drops those tags and keeps the `p.verbtable`). Take the `p` inside the Imperativo column; six lines: line 0 is a template placeholder (empty span, or `io` + empty `notused` span in potere); lines 1–5 labelled `tu`, `lui`, `noi`, `voi`, `loro`.
- `notused` span → `sourceUnavailable: true` (potere's imperative, all five).

### 9.2 Cells, order and label map (96 cells per file)

| # | Source label | Target | Expected text |
|---|---|---|---|
| 0 | Infinito | `infinitive.present` | form |
| 1 | Participio presente | `participle.present` | form(s) |
| 2 | Gerundio | `gerund.present` | form |
| 3 | Participio passato | `participle.past` (no agreement → any of the four) | form |
| 4 | second column line 1 | `infinitive.past` | `avere acceso` |
| 5 | second column line 2 | `gerund.past` | `avendo acceso` |
| 6 | second column line 3 | — `scope: 'unmodelled'`, reason `compound-participle` | |
| 7–54 | Indicativo × 8 tenses × 6 | `indicative.*`, subjects `1sg 2sg 3sg.m 1pl 2pl 3pl` | `pronoun + ' ' + form` (`io sono andato`, `lui è andato`) |
| 55–78 | Congiuntivo × 4 × 6 | `subjunctive.present`, **`subjunctive.past`** (label "Passato prossimo", remap), `subjunctive.imperfect`, **`subjunctive.pluperfect`** (label "Trapassato prossimo", remap) | `pronoun + ' ' + form` |
| 79–90 | Condizionale × 2 × 6 | `conditional.present`, `conditional.past` | `pronoun + ' ' + form` |
| 91–95 | Imperativo tu, lui, noi, voi, loro | `imperative.present` subjects `2sg`, **`3sg.formal`** (remap), `1pl`, `2pl`, **`3pl.formal`** (remap) | form only |

Totals: 20 files, 96 cells each = **1,920 cells**; **20 template placeholders** (imperative io line).

### 9.3 Remaps (template level, `italian.remaps`)

| Heading (occurrence) | Target | Reason | Source | Cells |
|---|---|---|---|---|
| Congiuntivo / "Passato prossimo" (2nd occurrence in the page) | `subjunctive.past` | The congiuntivo has four tenses, presente, imperfetto, passato and trapassato; "passato prossimo" is an indicative label. | https://www.treccani.it/enciclopedia/congiuntivo_(La-grammatica-italiana)/ | 120 |
| Congiuntivo / "Trapassato prossimo" (2nd occurrence) | `subjunctive.pluperfect` | same | same | 120 |
| Imperativo / row "lui" | `imperative.present`, subject `3sg.formal` | The third-person imperative is the courtesy form addressed to Lei (taken from the present subjunctive), not an order to a third party. | https://www.treccani.it/enciclopedia/imperativo_(La-grammatica-italiana)/ | 20 |
| Imperativo / row "loro" | `imperative.present`, subject `3pl.formal` | same, for Loro | same | 20 |

4 remaps, 280 cells.

### 9.4 Source errors and corrections (`scripts/corpus/corrections/it.ts`)

| File | Cell(s) | Source | Correct | Authority | Cells |
|---|---|---|---|---|---|
| essere | every compound cell: indicative perfect, pluperfect, future_perfect, past_anterior; subjunctive past, pluperfect; conditional past (7 × 6) | `ho stato … abbiamo stato` | `sono stato … siamo stati` (essere forms, participle agreeing in number) | https://www.treccani.it/vocabolario/essere1/ ("I tempi composti si coniugano con l'aus. essere: sono stato") + Concordanza | 42 |
| essere | infinitive.past, gerund.past | `avere stato`, `avendo stato` | `essere stato`, `essendo stato` | same | 2 |
| dare | indicative.present 3pl | `loro dànno` | `loro danno` | https://www.treccani.it/enciclopedia/accento-grafico_(Enciclopedia-dell'Italiano)/ (accent only on final stress and homograph monosyllables; the Vocabolario's `dànno` is an optional diacritic) | 1 |
| dare | simple_past 3sg alternates | `diede; dette; dètte` | `diede; dette` (drop `dètte`) | same (non-final accent is a pronunciation mark; Vocabolario prints `dètte` as the pronunciation of `dette`) | 1 |
| volere | indicative.present 1sg alternates | `voglio; vò` | `voglio` | https://www.treccani.it/vocabolario/volere2/ (`vòglio [tosc., in proclisi, vo']`: regional, written vo', not vò) | 1 |
| volere | simple_past 1sg, 3sg, 3pl alternates | `volli; volsi` etc. | `volli`, `volle`, `vollero` | same (`[ant. vòlsi]`) | 3 |
| sapere | imperative 2pl | `sapete` | `sappiate` | https://www.treccani.it/vocabolario/sapere2/ ("imperat. sappi, sappiate") | 1 |
| sapere | participle.present | `sapiente` | unavailable | same ("Il part. pres. manca (sapiènte ha solo funzione di agg. o di sost.)") | 1 |
| potere | participle.present | `potente` | unavailable | https://www.treccani.it/vocabolario/potere2/ ("part. pres. potènte, solo come agg. e sost.") | 1 |
| dovere | imperative 2sg, 3sg.formal, 1pl, 2pl, 3pl.formal | `devi, debba, dobbiamo, dovete, debbano` | unavailable | https://www.treccani.it/vocabolario/dovere2/ ("manca l'imperativo") | 5 |
| tradurre | participle.present | `tradunente` | `traducente` | https://www.treccani.it/vocabolario/tradurre/ ("Part. pres. traducènte") | 1 |
| tradurre | gerund.present | `tradunendo` | `traducendo` | same (forms on the stem traduc-) + https://www.treccani.it/enciclopedia/coniugazione-verbale_(Enciclopedia-dell'Italiano)/ | 1 |
| venire | participle.present | `venente` | `veniente` | https://www.treccani.it/vocabolario/venire/ ("part. pres. veniènte") | 1 |

**Expected totals: 61 corrections** (13 ledger rules), **4 remaps** (280 cells), **20 unmodelled cells** (`compound-participle`), **20 template placeholders**, 1,920 cells, 20 files, 20 infinitives. Unavailable cells after corrections: 5 (potere imperative, source) + 5 (dovere imperative) + 2 (sapere, potere participle) = 12.

Checked and not errors: `vado; vo` (Vocabolario: tosc./letter. vo → generated as `usage: 'literary'`), `fare` imperative `fa'; fai`, `andare` `va'; vai`, `dare` `da'; dai`, `stare` `sta'; stai`, `aprire` `aprii; apersi`, `bere` `bevvi; bevetti`, `dovere`/`potere` `-ei`/`-etti` doublets, `salire` `salente; saliente`, `essere` `essente` (Vocabolario: "raro"), `avere` `avente`, `dovente` (generated by rule; no authority says it is missing).

---

## 10. Tense concepts (for the equivalence table)

| Tense | Concepts (weight) | Note |
|---|---|---|
| indicative.present | PRESENT (1.0) | also near future |
| indicative.perfect | PRESENT_PERFECT (0.6), PAST_PERFECTIVE (0.4) | in northern and spoken use it replaces the passato remoto |
| indicative.imperfect | PAST_IMPERFECTIVE (1.0) | |
| indicative.pluperfect | PLUPERFECT (1.0) | |
| indicative.simple_past | PAST_PERFECTIVE (1.0), register literary/remote | narrative, southern spoken |
| indicative.past_anterior | PLUPERFECT (0.6), register literary | after temporal conjunctions with a passato remoto |
| indicative.future | FUTURE (0.8), EPISTEMIC_PRESENT (0.2) | `sarà vero` |
| indicative.future_perfect | FUTURE_PERFECT (0.8), EPISTEMIC_PAST (0.2) | |
| subjunctive.present / past / imperfect / pluperfect | SUBJ_PRESENT / SUBJ_PERFECT / SUBJ_PAST / SUBJ_PLUPERFECT (1.0 each) | |
| conditional.present | COND_PRESENT (1.0) | |
| conditional.past | COND_PAST (0.7), FUTURE_IN_PAST (0.3) | `disse che sarebbe venuto` |
| imperative.present | IMPERATIVE (1.0) | |
| imperative.negative | IMP_NEGATIVE (1.0) | |
| infinitive.present / past | INFINITIVE / INFINITIVE_PERFECT | |
| participle.present / past | PARTICIPLE_PRESENT / PARTICIPLE_PAST | |
| gerund.present / past | GERUND / GERUND_PERFECT | |

---

## 11. Open questions and risks

1. **Plan 2 corpus model and subjects.** The landed core puts the subject id into `targetKey` (`src/core/target.ts`); Plan 2 Task 6 adds `subject` to corpus cells. The Italian corpus module assumes the corpus test matches a cell's `subject` against `form.target.subject`; if Plan 2 lands differently, the Italian `applicable` filters by subject itself.
2. **`gender` option.** Plan 2 has no common `gender` option; Italian declares its own. If a later plan promotes `gender` to the core, the Italian field is removed.
3. **Serianni [U].** No chapter XI paragraph is verified. Rules resting on Serianni alone (subjunctive from the 1sg/1pl stems, the trapassato remoto `fui andato`, the participio presente as productive) carry a Treccani or Vocabolario citation as well until the § numbers are filled in by hand.
4. **DOP not fetched.** The acute `-é` of `poté, credé, temé` rests on Italian orthographic convention [U]; verify on DOP or the Vocabolario before the ending table is final.
5. **Participio presente.** Treated as productive (`-ante/-ente`) with lexical `-iente` forms and three defectives. Many generated forms are rare; the trainer should not drill them.
6. **Weather verbs.** 3rd person only (3sg and 3pl) is a modelling choice; figurative personal uses (`piovono critiche`) exist. Verify each lemma's Vocabolario entry.
7. **Wiktionary churn.** Module:it-verb changes regularly; the module pin makes re-import fail loudly instead of silently changing the fixture.
8. **Spanish/Italian consistency.** Italian renders subject pronouns (bare rendering for pro-drop). If the Spanish pack decides otherwise, align at merge time.

## 12. Deviations from the approved design

| Approved design says | This design does | Why |
|---|---|---|
| Rules "about 35" | 74 rule ids | the count includes the 9 periphrasis rules, 11 clause rules and separate classify/assumption ids, which every pack needs for explanations |
| Corrections "about 90 of 1,920" incl. "`avente` slots dropped", "imperatives of potere/dovere unavailable", "`dànno`", "`vò`", "`venente`" | 61 corrections; `avente` cells are 20 `unmodelled` cells, not corrections; potere's imperative is already `notused` in the source; `tradunendo` (gerund) added | counted cell by cell on the 20 pages |
| `scripts/corpus/sources/wiktionary.ts` | `scripts/corpus/sources/wiktionary-it.ts` and `tests/fixtures/wiktionary-it.json` | Italian and Latin plans run in parallel worktrees; a shared new file would conflict. Latin can extract a shared helper later |
| Imperative "tu / Lei / noi / voi / Loro" | catalogue persons 2sg, 3sg, 1pl, 2pl, 3pl; 3rd persons only through the courtesy slots `3sg.formal`/`3pl.formal` (person 3) | Lei/Loro govern the 3rd person; avoids a person mapping the core cannot pass to chain elements |
| Invented-verb list | adds `sbasciare`, `trongiare`, `flattere`, `flacere`, `stramettere`, `blomettere` and hinted variants | one test per rule (§8.1) |
| Wiktionary second oracle "about 50" verbs | 60 verbs + 3 controls that are also in the scraped corpus | needed to cover every rule and class (§8.4 table) |
| Stressed-i list "about 25" | about 18 | the Vocabolario's `-ìo` verbs are fewer; the list grows when one is found |
