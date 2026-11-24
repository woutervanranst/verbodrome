# Spanish (es) grammar design for the staged engine

Scope: the approved design's "Spanish (es)" section (`docs/superpowers/specs/2026-11-24-seven-language-engine-design.md`). Contract: the core after Plan 2 Part A (`docs/superpowers/plans/2026-11-24-seven-language-engine-02-core-completion-and-dutch.md`); its Tasks 1–4 have landed (subject slots with `CatalogueEntry.slots`, `classify` returning a `Fork`, `cellOf(target, lexeme)`, `Periphrasis<X>` with `applies` / `reports`, `ClauseContext.subject` / `agreeing`), and the names below are those of `src/core/` at commit `f5cb5d7`. Pack authors also read `packages/conjugation-engine/docs/pack-authoring.md`. Status marks: **[V]** page read, **[S]** search snippet only, **[U]** from memory, to be checked where stated. Every rule, ending set and oracle claim below was also run through a throwaway prototype of exactly these rules (not committed) against all 11,036 oracle cells: apart from llover and soler (availability) and the source errors of §9.6, the prototype reproduces every cell, and it produced every invented and out-of-corpus form in §8.

## 1. Sources

`rae.es` and `dle.rae.es` again refused automated fetching (HTTP 403, 24 Nov 2026), as did fundeu.es, udep.edu.pe and cvc.cervantes.es. Facts from those sites below rest on search-result snippets **[S]** and must be confirmed by opening the URL by hand (Chrome) before the rule ships; secondary pages that reproduce the RAE text were read **[V]**.

### 1.1 Works

| Id (`sources.ts`) | Role | Title | URL | Status |
|---|---|---|---|---|
| `ngle` | grammar (primary) | RAE & ASALE, *Nueva gramática de la lengua española* (2009), ch. 4 "La flexión verbal" | section titles: https://www.asale.org/sites/default/files/Indice_contenidos_gramatica.pdf; online text: https://www.rae.es/gram%C3%A1tica/morfolog%C3%ADa/ (by hand) | ToC [V]; contents [S] |
| `orto` | orthography (primary) | RAE & ASALE, *Ortografía de la lengua española* (2010) | https://www.rae.es/ortograf%C3%ADa/reglas-de-acentuaci%C3%B3n, …/palabras-con-hiato, …/palabras-con-diptongo, …/formas-verbales-con-pronombres-cl%C3%ADticos (by hand) | [S] |
| `orto-novedades` | orthography (secondary copy of an RAE text) | RAE, "Principales novedades de la *Ortografía de la lengua española* (2010)" | https://www.edu.xunta.gal/centros/cpicovaterrena/system/files/Principales%20novedades%20de%20la%20Ortograf%C3%ADa%20de%20la%20RAE.pdf | [V] |
| `dpd-tilde` | orthography (secondary copy of an RAE text) | DPD (2005), entry "tilde²", reproduced by Universidad del Rosario | https://induccion.urosario.edu.co/sites/default/files/2023-02/material-de-apoyo-la-tilde-segun-la-rae.pdf | [V] |
| `dle` | lexicon (primary) | RAE, *Diccionario de la lengua española*, entry + conjugation table | `https://dle.rae.es/<lemma>` (by hand) | [S] |
| `dpd` | usage (primary) | RAE & ASALE, *Diccionario panhispánico de dudas* | `https://www.rae.es/dpd/<entry>` (by hand) | [S] |
| `gtg` | terms | RAE, *Glosario de términos gramaticales* | `https://www.rae.es/gtg/<term>` (by hand) | [S] |
| `nrfh-abolir` | secondary | Ponce de León, "Verbos defectivos… el caso de abolir", *NRFH* (2021) | https://www.redalyc.org/journal/602/60266067008/html/ | [V] |
| `aml-minucias` | secondary | Academia Mexicana de la Lengua, *Minucias del lenguaje*, "licuo y licúo" | https://academia.org.mx/consultas/obras-de-consulta-en-linea/diccionario-minucias-del-lenguaje/item/licuo-y-licuo | [V] |
| `saarland` | secondary | Universität des Saarlandes, course notes "Irregularidad sistemática" | https://www.aula.uni-saarland.de/wp-content/uploads/2026/09/Envio_3_1_Irregularidad-sistematica_rev_.pdf | [V] |

Corroboration only, never cited in `sources.ts`: Bello, *Gramática de la lengua castellana* (1847), Wikisource, §§497–500, 509–510, 549–556, 597 (historical, [V]); Wikilengua "-iar (verbos)" and "Verbo defectivo" ([V], last resort).

### 1.2 NGLE chapter 4 (section titles [V] from the ASALE table of contents)

§4.1–4.2 morphological information and segmentation · §4.3 theme vowel · §4.4 person and number · §4.5 tense and mood · §4.6 regular conjugation · §4.7 voseo · §4.8 stress in verb forms · §4.9 *verbos vocálicos* (-iar/-uar, -uir) · §4.10 vowel alternation (incl. §4.10o adquirir/inquirir) · §4.11 consonant alternation (zc, -go) · §4.12 strong preterites and irregular participles · §4.13 haber, ser, ir, estar, dar · §4.14 defective verbs · §4.15 conjugation models (tables) · §4.16 index of irregular verbs. The approved design's mapping (§4.9–4.16) is confirmed.

### 1.3 Rule areas and what they rest on

| Area | Rests on | Status |
|---|---|---|
| Endings, theme vowels, regular models | ngle §4.3–4.6, §4.15 | [S] |
| Stress in verb forms; written accent (general rules, hiatus incl. intervening h, `ui`/`iu` as diphthong, monosyllables since 2010, diacritic dé/sé, enclitics) | orto (§3.4.1–3.4.5, numbers [S]); verified text: `orto-novedades` ("fie, fio, fiais, fieis… guie, guio, guiais, guieis… rio, riais… deben escribirse ahora obligatoriamente sin tilde"; "Dos vocales cerradas distintas… huir, incluido") and `dpd-tilde` §1.1, §2.2.2 ("La presencia de una hache intercalada no exime de la obligación de tildar… prohíbe"), §3.1 (dé, sé), §4.3 (enclitics follow the general rules) | [V] via copies |
| -iar / -uar stress classes | ngle §4.9 (models enviar, actuar, cambiar); DPD averiguar ("La u que precede a la desinencia es átona… -guar y… -cuar (salvo anticuar)"; adecuar, evacuar, licuar admit both); `aml-minucias` | [S] / [V] |
| Root-internal hiatus (aislar, reunir, prohibir, ahincar) | DPD conjugation models ("La i del grupo /ai/ es tónica… aislar"); DLE ahincar "Conjug. c. aislar" (table: ahíncas) | [S] |
| Vowel alternation, lexical, never by prefix | ngle §4.10 ("algunos verbos diptongan o no… en función de su etimología y de su significado"); adquirir §4.10o; DPD *lemas con superíndice* (aterrar) | [S] |
| zc, velar -g-, y-insertion, i → y | ngle §4.11, §4.9; DPD conducir, leer ("-i- se escribe -y- (leyendo, leyó…)") | [S] |
| i absorbed after ñ / ll | ngle §4.9 (locator [U]); Bello §500 | [U] / historical [V] |
| Strong preterites, -ducir, irregular participles (incl. elegir/electo, freír, imprimir, prender) | ngle §4.12 ("Algunos verbos tienen dos formas de participio vigentes… elegir o reelegir, freír, imprimir, prender"); DPD conducir, elegir, maldecir, predecir, contradecir | [S] |
| haber, ser, ir, estar, dar | ngle §4.13; DPD haber (imperative "habe y habed… carecen de uso en la actualidad") | [S] |
| Defectives: abolir (now full), soler, weather verbs | ngle §4.14; DPD abolir, soler, llover; `nrfh-abolir` | [S] / [V] |
| Enclitic -d / -s loss, idos / iros | DPD *pronombres personales átonos* ("pierde la -d final cuando se le añade el enclítico os… idos"; "Delante del enclítico nos se pierde obligatoriamente la -s"); RAE note on iros https://www.rae.es/gram%C3%A1tica/docs/%C2%ABiros%C2%BB%20imperativo.pdf | [S] |
| -ra / -se, future subjunctive dated | ngle §24.2c (via UDEP, paraphrase); GTG *futuro simple de subjuntivo* ("se mantiene hoy, como rasgo arcaizante, en los textos jurídicos y en los administrativos") | [S] |
| Negative imperative = no + present subjunctive; que and subject pronoun in tables | ngle §4.5 (locator [U]); GTG *imperativo* (by hand) | [U] |
| Per-verb forms | DLE conjugation tables, DPD entries | by hand |

`secondaryOnly` (in `sources.ts`, until the `orto` pages are opened by hand): `es.orth.accent-hiatus`, `es.orth.accent-general`, `es.orth.monosyllable`, `es.orth.diacritic`, `es.clause.enclitic-accent`, `es.classify.restore-accent`.

### 1.4 URLs to open by hand

DPD: `abolir`, `elegir`, `pudrir`, `adquirir`, `ahincar`, `hiato`, `tilde`, `soler`, `llover`, `haber`, `ir`, `pronombres%20personales%20%C3%A1tonos`, `conducir`, `leer`, `bendecir`, `maldecir`, `predecir`, `contradecir`, `desdecir`, `apostar`, `errar`, `averiguar`, `yacer`, `roer`, `raer`, `satisfacer`, `ayuda/lemas-con-superindice`, `ayuda/modelos-de-conjugacion-verbal` (all under `https://www.rae.es/dpd/`). GTG: `futuro-simple-de-subjuntivo`, `futuro-compuesto-de-subjuntivo`, `verbo-regular`, `verbo-defectivo`, `imperativo`. NGLE online: `https://www.rae.es/gram%C3%A1tica/morfolog%C3%ADa/` → *los verbos irregulares (I) verbos vocálicos* … *(VI) verbos defectivos*, *índice alfabético de verbos irregulares*. RAE usage note on irgo: `https://www.rae.es/buen-uso-espa%C3%B1ol/notas`. DLE: every lexicon lemma.

### 1.5 Deviations from the approved design

1. **"64 cells"** in the approved design counts the 64 `<td>` elements of a page; the corpus has **124 cells per file** (one per form slot) plus 4 template placeholders.
2. **electo is not corrected.** NGLE §4.12 lists elegir among verbs with two participles in force and the DLE tables give "haber elegido o electo"; only the DPD advises against electo in compound tenses. The pack generates `electo` as the `irregular` participle (`participle.past` only, condition `adjectival`), never in compound tenses; the oracle's second-participle cell then passes as is.
3. **soler is corrected, not only marked defective.** The DPD says soler is not used in the future, conditional and imperative, and that its (rare) compound tenses exist, the perfect most of all; the DLE table lists soliendo and solido. The oracle blanks all compound tenses, the gerund and the participle: 40 corrected cells. Corrections total **97** cells, not the 60–70 estimated.
4. **podrí / podriré** are not errors but American variants (DPD pudrir: o forms accepted in America in some tenses). The pack models the general u paradigm; the two alternates are dropped in the ledger with that reason, and generating them with `region` is listed in §11.
5. **-uar is a rule, -cuar has both stresses** (DPD averiguar): `-guar`/`-cuar` unstressed u, except anticuar; adecuar, evacuar, licuar both. Only `-iar` and root vowel groups need lists, so the hiatus lists hold about 95 lemmas, not 120.
6. **84 rules**, not about 45: each compound tense and spelling alternation has its own rule so the explanation can name it.
7. **The negative imperative** is a periphrasis chain (`no` + present subjunctive) whose words the clause orders, rather than a form the clause builds alone; behaviour is as specified.
8. **predecir's future**: DPD says both are possible, the regular one predominant, so `predeciré` comes first and `prediré` is a tagged variant; contradecir keeps the irregular `contradiré` (the regular one is regional). **iros** is generated beside idos (RAE note).
9. The design's subjunctive "Past" → `subjunctive.past` remap is kept for the audit trail although the id already matches; `Imperfect (2)` / `Pluperfect (2)` are variant columns, not remaps.

## 2. Catalogue

### 2.1 Tenses

Mood labels: Indicativo, Condicional, Subjuntivo, Imperativo, Infinitivo, Gerundio, Participio. Tense labels are the NGLE names (§1.2).

| Id | Native label | Built | Persons | Variants / usage |
|---|---|---|---|---|
| `indicative.present` | Presente | simple | 6 | |
| `indicative.perfect` | Pretérito perfecto compuesto | haber `indicative.present` + participle | 6 | |
| `indicative.imperfect` | Pretérito imperfecto | simple | 6 | |
| `indicative.pluperfect` | Pretérito pluscuamperfecto | haber `indicative.imperfect` + participle | 6 | |
| `indicative.simple_past` | Pretérito perfecto simple | simple | 6 | |
| `indicative.past_anterior` | Pretérito anterior | haber `indicative.simple_past` + participle | 6 | |
| `indicative.future` | Futuro simple | simple | 6 | |
| `indicative.future_perfect` | Futuro compuesto | haber `indicative.future` + participle | 6 | |
| `conditional.present` | Condicional simple | simple | 6 | |
| `conditional.past` | Condicional compuesto | haber `conditional.present` + participle | 6 | |
| `subjunctive.present` | Presente | simple | 6 | |
| `subjunctive.past` | Pretérito perfecto compuesto | haber `subjunctive.present` + participle | 6 | |
| `subjunctive.imperfect` | Pretérito imperfecto | simple | 6 | `pattern` `ra` (first) / `se` |
| `subjunctive.pluperfect` | Pretérito pluscuamperfecto | haber `subjunctive.imperfect` + participle | 6 | `ra` / `se`, inherited from the auxiliary word |
| `subjunctive.future` | Futuro simple | simple | 6 | `usage: 'dated'` |
| `subjunctive.future_perfect` | Futuro compuesto | haber `subjunctive.future` + participle | 6 | `usage: 'dated'` |
| `imperative.present` | Afirmativo | simple | 2sg, 3sg, 1pl, 2pl, 3pl | |
| `imperative.negative` | Negativo | `no` + `subjunctive.present` | 2sg, 3sg, 1pl, 2pl, 3pl | |
| `infinitive.present` | Simple | simple | – | |
| `infinitive.past` | Compuesto | haber `infinitive` + participle | – | |
| `gerund.present` | Simple | simple | – | |
| `gerund.past` | Compuesto | haber `gerund` + participle | – | |
| `participle.past` | Participio | simple | – | `pattern` `regular` / `irregular` only for verbs with two participles |

The NGLE counts the conditional as a tense of the indicative; the catalogue keeps a separate `conditional` mood like French and Dutch so the equivalence table lines up. `SpanishSpec extends LanguageSpec<SpanishTenses>`; `SpanishTenses` (in `spec.ts`): `indicative: 'present' | 'perfect' | 'imperfect' | 'pluperfect' | 'simple_past' | 'past_anterior' | 'future' | 'future_perfect'`, `conditional: 'present' | 'past'`, `subjunctive: 'present' | 'past' | 'imperfect' | 'pluperfect' | 'future' | 'future_perfect'`, `imperative: 'present' | 'negative'`, `infinitive: 'present' | 'past'`, `gerund: 'present' | 'past'`, `participle: 'past'`; `nonFinite: 'infinitive' | 'gerund' | 'participle'`.

### 2.2 Subject slots

Order is output order inside one person and number. `pronoun` is the rendered subject part.

| Id | Person | Number | Pronoun | Gender | Register | Default |
|---|---|---|---|---|---|---|
| `1sg` | 1 | singular | yo | – | – | yes |
| `2sg` | 2 | singular | tú | – | informal | yes |
| `3sg` | 3 | singular | él | masculine | – | yes |
| `3sg.f` | 3 | singular | ella | feminine | – | no |
| `2sg.formal` | 3 | singular | usted | – | formal | no |
| `1pl` | 1 | plural | nosotros | masculine | – | yes |
| `1pl.f` | 1 | plural | nosotras | feminine | – | no |
| `2pl` | 2 | plural | vosotros | masculine | informal | yes |
| `2pl.f` | 2 | plural | vosotras | feminine | informal | no |
| `3pl` | 3 | plural | ellos | masculine | – | yes |
| `3pl.f` | 3 | plural | ellas | feminine | – | no |
| `2pl.formal` | 3 | plural | ustedes | – | formal | no |

`genderedTargets` is not set: gender shows in the pronoun only (participles after haber are invariable), so `target.gender` stays `null`.

**Imperative slots (`CatalogueEntry.slots`)**: both imperative entries list `slots: ['2sg', '2sg.formal', '1pl', '1pl.f', '2pl', '2pl.f', '2pl.formal']`, so each command is expanded at its slot's own person and number and the third-person subjects él/ella/ellos/ellas have no imperative (their jussive `que venga` is a subjunctive): `subject: '3sg', mood: 'imperative'` is `INVALID_TARGET` without any pack code. The other finite entries list no `slots` and take every selected slot of their persons.

**`subjectsFor(query)`**: `subject` given → that slot; else `gender` given → every slot whose gender is that gender or absent (`feminine`: yo, tú, ella, usted, nosotras, vosotras, ellas, ustedes); else the default slots plus `2sg.formal` and `2pl.formal` (so the usted/ustedes commands are part of an unfiltered query).

**`acceptsTarget(query, target)`**: when the query names no `subject`, a target of a non-imperative entry with a formal slot is dropped (usted/ustedes appear in the indicative, conditional and subjunctive only when asked for). Net effect: an unfiltered query returns `yo amo … ellos aman` and the commands `ama, ame, amemos, amad, amen` with subjects `2sg, 2sg.formal, 1pl, 2pl, 2pl.formal`; 111 targets in all.

`SpanishSpec.subject` (the registry's slot-id union) = `'1sg' | '2sg' | '3sg' | '3sg.f' | '2sg.formal' | '1pl' | '1pl.f' | '2pl' | '2pl.f' | '3pl' | '3pl.f' | '2pl.formal'`.

**Voseo (out, room left):** a later `2sg.vos` slot (pronoun `vos`, person 2, singular, `region`) needs its own cells (`amás`, `tenés`, `amá`). The pack's `cellOf(target, lexeme)` already receives `target.subject`, so voseo maps such targets to pack-internal tense ids (`present-vos`, `imperative-vos`) with their own ending rows; nothing in the slot model or the cell type has to change.

### 2.3 Options (`options.ts`)

| Field | Kind | Values | Meaning |
|---|---|---|---|
| `stems` | `stems` | words: none; enums: `stress: ['hiatus', 'diphthong']`, `zc: [true, false]` | override the stress class of `-iar` / root vowel groups; force or block `zc` for vowel + `-cer/-cir` |
| `auxiliary` | enum | `haber` | the only perfect auxiliary (accepted for interface parity; `ser`/`estar` periphrases are out) |
| `classHint` | enum | `regular`, `e-ie`, `o-ue`, `u-ue`, `i-ie`, `e-i` | stem-vowel alternation for an unlisted verb, or the paradigm of a two-paradigm lemma |
| `reflexive` | boolean | | conjugate with reflexive pronouns; `reflexive: false` with an infinitive in `-se` is `INVALID_HINT` |
| `gender` | enum | `masculine`, `feminine` | selects gendered subject slots (§2.2) |

No `check`: a `classHint` that contradicts a lexicon verb (no paradigm with that alternation) is rejected by `classify` with `INVALID_HINT`, since the schema does not see the lexicon. Common option used: `subject`.

### 2.4 Left out

Voseo (§2.2); passive (`ser` + participle); `estar` + gerund and other periphrases (`ir a`, `acabar de`); existential `hay` (haber is modelled as the auxiliary: `ha`); object clitics other than the reflexive; negation outside the negative imperative; participle agreement in adjectival use (`amada`, `amados`); archaic forms (`plugo`, `he` / `habed`, `vide`); Bello's tense names (copretérito, pospretérito) as labels.

## 3. Classification

### 3.1 Classes

`classId` is the NGLE model verb the lemma follows (shown to learners as "follows the model of …"):

| Class | Detected by | Lexical? |
|---|---|---|
| conjugation `ar` / `er` / `ir` | infinitive (without `-se`) ends in `ar`, `er`, `ir` or `ír` | rule |
| regular models `amar`, `temer`, `partir` | conjugation, nothing else applies | default |
| vowel alternation `acertar`/`entender` (e→ie), `contar`/`mover` (o→ue), `jugar` (u→ue), `adquirir` (i→ie), `pedir` (e→i), `sentir` (e→ie + raising), `dormir` (o→ue + raising), `discernir` (e→ie, no raising) | lexicon list (§5.3) or `classHint` | **lexical, never inherited by prefix** |
| stress class `enviar` / `actuar` (hiatus) vs `anunciar` / `averiguar` (diphthong); root-internal hiatus `aislar`, `reunir`, `prohibir` | `-iar` and root vowel groups: lexicon list (§5.4) or `stems.stress`; `-uar`: rule (§4.1) | lexical except `-uar` |
| velar / zc / y-insertion | `zc`: vowel + `-cer`/`-cir` (rule, exception list); y: `-uir` not `-guir`/`-quir` (rule); velar `-g-`: lexicon | rule + lexical |
| strong (irregular) bases | lexicon (§5.2); derivatives by prefix (§3.3); `-ducir` family | lexical |
| impersonal / defective | lexicon flag | lexical |

### 3.2 Order of classification (`classify.ts`)

1. Infinitive: strip a final `se` when the rest ends in `ar|er|ir|ír` → reflexive (`es.classify.reflexive`). The rest must match `^[a-zñáéíóúü]+(ar|er|ir|ír)$`, else `INVALID_INFINITIVE`. An unaccented `-eir` / `-oir` is restored to `-eír` / `-oír` (`es.classify.restore-accent`; every such infinitive has the hiatus tilde).
2. Conjugation from the ending (`es.classify.conjugation`).
3. Exact lemma in the lexicon → its paradigms (`es.classify.lexicon`; two-paradigm lemmas → `es.classify.two-paradigms`, one `Outcome` per paradigm with `pattern` and `condition`).
4. Else prefixed derivative of a strong base (§3.3) → `es.classify.prefixed`.
5. Else suffix family: `-ducir` (zc + strong `-duj-`), `-scribir` (participle `-scrito`) → `es.classify.family`.
6. Else regular. Record `es.classify.assume-regular` (no vowel alternation), plus, only where they decide a form: `es.classify.assume-glide` (`-iar` not on the hiatus list → like `anunciar`), `es.classify.assume-diphthong` (root vowel group `ai au ei eu oi ou` in the last root syllable not on the hiatus list → like `causar`), `es.classify.assume-zc` (vowel + `-cer/-cir` not on the exception list → like `conocer`). `-uar` is decided by rule `es.classify.uar-stress` (hiatus; `-guar` and `-cuar` diphthong, anticuar hiatus, adecuar/evacuar/licuar both), not assumed.
7. Hints last: `classHint` (`es.classify.hint`) replaces the alternation (and records no `assume-regular`); `stems.stress` replaces the stress class; `stems.zc` the zc decision. Each hint records `es.classify.hint` with the hint as param.

`analysis.classificationSource`: `lexicon` (3–5), `regularRule` (6), `explicitHint` (7).

### 3.3 Prefixed derivatives (inheritance)

- **Strong irregularity inherits** when the lemma is `P + B`, `P` in the closed prefix list, `B` a strong base of **five letters or more** in the lexicon, and the lemma is not on the no-inherit list. The derivative takes `B`'s stored principal parts with `P` prepended; stress and written accents are computed on the whole word with the stress position taken from the base (`detén`, `compón`, `rehíce`, `prevés`). Whole-word forms of the base (`pon`, `ten`, `ven`, `haz`, `sal`) are prefixed in the `cell` hook and passed through `writeAccent` there, recording `es.orth.accent-general` when a tilde appears.
- **Closed prefix list** (longest match first): `a ab abs ad ante bien circun co com con contra de des di dis e en entre equi ex im in inter man mal o ob pos pre pro re sobre sos su sub super sus tras trans yuxta`.
- **Strong bases ≥ 5 letters**: `andar caber hacer poner querer saber salir tener traer valer venir` (+ `poder`, `estar`, `haber`, `decir`, which have no automatic derivatives). Expected derivatives: `desandar`; `deshacer rehacer contrahacer`; `componer descomponer recomponer disponer predisponer indisponer exponer imponer oponer proponer suponer presuponer reponer deponer posponer anteponer contraponer interponer sobreponer superponer yuxtaponer transponer trasponer`; `bienquerer malquerer`; `resaber`; `sobresalir`; `abstener atener contener detener entretener mantener obtener retener sostener`; `abstraer atraer contraer detraer distraer extraer maltraer retraer substraer sustraer`; `equivaler prevaler`; `avenir contravenir convenir desavenir devenir intervenir prevenir provenir reconvenir sobrevenir`.
- **No-inherit list** (explicit entries instead): `decir` (its derivatives `bendecir maldecir predecir contradecir desdecir` differ in future, imperative and participle), `satisfacer` (`satis` + `facer`, its own entry).
- **Short bases (< 5 letters) by explicit map only**: `ver → prever entrever rever`; `caer → decaer recaer`; `oír → desoír`; `reír → sonreír engreír desleír`; `leer → releer`; `creer → descreer`; `roer → corroer`; `dar`, `ir`, `ser`: none. This keeps `volver`, `mover`, `llover`, `hervir`, `mandar`, `pedir` away from `ver`, `dar`, `ir`.
- **Vowel alternation never inherits**: `pretender` is not `tender`, `contestar` is not `estar`. Every alternating lemma, derived or not, is listed in §5.3 (`atender`, `entender`, `extender` are listed; `pretender` is not).

Test probes: `componer` (inherits), `pretender` (regular, `pretendo`), `contestar` (regular), `detener` (`detén`), `prever` (`prevés`, `prevé`), invented `protener` (inherits, records `es.classify.prefixed`), invented `blotener` (`blo` is not a prefix: regular + assumption).

## 4. Rule inventory

Citations use the work ids of §1.1 (`ngle`, `orto`, `orto-novedades`, `dpd-tilde`, `dle`, `dpd`, `gtg`); `[U locator]` marks a section number not yet seen; every `dle`/`dpd` lemma URL is `https://dle.rae.es/<lemma>` / `https://www.rae.es/dpd/<lemma>`. Params `before`/`after` are implicit. Messages: one English sentence each, written by the implementer from the statement column; Dutch terms that matter in §4.10.

### 4.1 Classify (stage `classify`)

| Id | Kind | Statement | Trigger | Params | Cite | Example |
|---|---|---|---|---|---|---|
| `es.classify.conjugation` | rule | The ending of the infinitive gives the conjugation and its regular model. | infinitive ends `ar`/`er`/`ir`/`ír` | `ending`, `model` | ngle §4.3, §4.6 | amar → 1st, model amar |
| `es.classify.reflexive` | rule | An infinitive in -se is the reflexive form of the verb. | `-se` stripped, or `reflexive: true` | `base` | dpd pronombres personales átonos | levantarse → levantar |
| `es.classify.restore-accent` | rule | Infinitives in -eír and -oír always carry a tilde. | `/[eo]ir(se)?$/` typed without tilde | – | orto §3.4.2; dpd-tilde §2.2.2 | reir → reír |
| `es.classify.lexicon` | lexical | The verb is listed with its own model. | exact lemma | `model` | dle lemma | tener → tener |
| `es.classify.two-paradigms` | lexical | The verb has two conjugations with different meanings. | lemma with two entries | `model` | dle homographs; dpd lemas con superíndice | apostar → contar / amar |
| `es.classify.prefixed` | lexical | A prefixed verb conjugates like its base. | §3.3 | `prefix`, `base` | ngle §4.16 | componer = com + poner |
| `es.classify.family` | rule | Verbs in this ending share their irregular forms. | `-ducir`, `-scribir` | `suffix`, `model` | ngle §4.11, §4.12; dpd conducir | traducir → conducir |
| `es.classify.uar-stress` | rule | -uar verbs stress the u in root-stressed forms (actúo); after g or c the u stays unstressed (averiguo), except anticuar; adecuar, evacuar and licuar allow both. | `/uar$/` | – | ngle §4.9; dpd averiguar | actuar → actúo |
| `es.classify.hint` | rule | The hint sets the stem class. | `classHint` / `stems` | `hint` | ngle §4.10 | plentar + e-ie |
| `es.classify.assume-regular` | assumption | Not in the lexicon: assumed regular, without a stem-vowel change. | unlisted, no `classHint` | – | ngle §4.6 | blorpar |
| `es.classify.assume-glide` | assumption | The i before the ending is assumed to share a syllable with it (like anunciar). | unlisted `-iar` | `vowel` | ngle §4.9 | flobiar → flobio |
| `es.classify.assume-diphthong` | assumption | The vowels of the root are assumed to form one syllable (like causar). | unlisted, last root vowel group of two vowels with a close one | `vowels` | ngle §4.9 | blaular → blaulo |
| `es.classify.assume-zc` | assumption | Assumed to insert z like conocer (conozco). | unlisted vowel + `-cer`/`-cir` | – | ngle §4.11 | blorecer → blorezco |

### 4.2 Stem (stage `stem`)

Root-stressed cells **R** = present indicative 1sg 2sg 3sg 3pl; present subjunctive 1sg 2sg 3sg 3pl; imperative 2sg, 3sg, 3pl (and the negative imperative through the subjunctive). Raising cells **Q** (`-ir` verbs only) = present subjunctive 1pl 2pl; preterite 3sg 3pl; every imperfect and future subjunctive cell; gerund. Rule of thumb behind Q: the ending has no stressed `i`.

| Id | Kind | Statement | Trigger | Params | Cite | Example |
|---|---|---|---|---|---|---|
| `es.stem.root` | rule | Drop -ar, -er or -ir to get the root. | always | `ending` | ngle §4.3 | amar → am- |
| `es.stem.diphthong` | rule | In stressed position the root vowel becomes a diphthong. | alternation `e-ie`/`o-ue`/`u-ue`/`i-ie`, cell ∈ R, last occurrence of the vowel in the root | `from`, `to` | ngle §4.10 | pens- → piens- |
| `es.stem.e-i` | rule | In stressed position e becomes i. | alternation `e-i`, cell ∈ R | – | ngle §4.10 | ped- → pid- |
| `es.stem.raising` | rule | In -ir verbs of these classes the root e or o becomes i or u when the ending has no stressed i. | `-ir` with alternation (`raising !== false`), cell ∈ Q | `from`, `to` | ngle §4.10 | sent- → sint-ió |
| `es.stem.present-1sg` | lexical | This verb has its own stem in the first person singular present. | lexicon `present1` | `stem` | ngle §4.11; dle lemma | ten- → teng- |
| `es.stem.subjunctive-from-1sg` | rule | The present subjunctive is built on the stem of the first person singular present. | cell = present subjunctive (or command from it) and a `present1` or zc stem exists | `stem` | ngle §4.11 | teng-o → teng-a |
| `es.stem.zc` | rule | After a vowel, the c of -cer/-cir verbs becomes zc before a and o. | root ends vowel + `c`, `-cer`/`-cir`, not on the zc exception list, ending starts a/o | – | ngle §4.11 | conoc- → conozc-o |
| `es.stem.y-insertion` | rule | -uir verbs add y after the root before an ending that does not begin with i. | `-uir` not `-guir`/`-quir` (and `oír`, `desoír`), ending starts a/e/o | – | ngle §4.9 | constru- → construy-o |
| `es.stem.strong-preterite` | lexical | This verb has an irregular preterite stem, stressed on the stem in the 1st and 3rd person singular. | lexicon `preterite` | `stem` | ngle §4.12 | tuv- |
| `es.stem.ducir-preterite` | rule | -ducir verbs form the preterite on -duj-. | `-ducir` | – | ngle §4.12; dpd conducir | conduc- → conduj- |
| `es.stem.future-infinitive` | rule | The future and conditional are built on the whole infinitive. | no lexical future | – | ngle §4.5 | amar-é |
| `es.stem.future-lexical` | lexical | This verb has a shortened future stem. | lexicon `future` | `stem` | ngle §4.15; dle lemma | tendr- |
| `es.stem.preterite-3pl` | rule | The imperfect and future subjunctive are built on the 3rd person plural preterite without -ron. | those cells | `base` | ngle §4.5 | amaron → ama-ra |
| `es.stem.lexical` | lexical | The lexicon lists this stem. | `imperfect` (ver: ve-), `root` (podrir: pudr-) | `stem` | dle lemma | ve-ía |
| `es.cell.lexical` | lexical | This form is irregular and listed whole. | lexicon `cells` (ser, ir, haber, estar 1sg, dar 1sg, saber 1sg) | `form` | ngle §4.13; dle lemma | soy |
| `es.cell.imperative-short` | lexical | The tú command of this verb is short. | lexicon `imperative2sg` | `form` | ngle §4.15; dle lemma | pon |
| `es.cell.participle` | lexical | This verb has an irregular participle. | lexicon `participle` | `form` | ngle §4.12 | puesto |
| `es.cell.gerund` | lexical | This verb has an irregular gerund. | lexicon `gerund` | `form` | ngle §4.15; dle lemma | pudiendo, yendo |

zc exception list: `hacer`, `satisfacer` (and `-hacer` derivatives), `cocer`, `escocer`, `recocer`, `mecer`, `remecer`, `decir` and its derivatives, `yacer` (three listed variants). Verbs with a consonant before `-cer`/`-cir` (`vencer`, `ejercer`, `zurcir`, `esparcir`) never meet the trigger; they get only `es.orth.c-z`.

### 4.3 Ending sets (stage `ending`)

Stress column: `R` = root-stressed (stress computed on the stem, §4.5), a number = the stressed vowel counted in vowel letters (`a e i o u ü`, glides included, not `y`) from the end of the **word** (`amabais`: i 1, a 2, **a 3**), which survives the `i → y` and i-absorption rules because they never touch the stressed vowel or anything after it. Endings are stored without tildes; tildes are written by §4.5.

| Set | 1sg | 2sg | 3sg | 1pl | 2pl | 3pl |
|---|---|---|---|---|---|---|
| present `ar` | o R | as R | a R | amos 2 | ais 2 | an R |
| present `er` | o R | es R | e R | emos 2 | eis 2 | en R |
| present `ir` | o R | es R | e R | imos 2 | is 1 | en R |
| imperfect `ar` | aba 2 | abas 2 | aba 2 | abamos 3 | abais 3 | aban 2 |
| imperfect `er`/`ir` | ia 2 | ias 2 | ia 2 | iamos 3 | iais 3 | ian 2 |
| preterite `ar` | e 1 | aste 2 | o 1 | amos 2 | asteis 3 | aron 2 |
| preterite `er`/`ir` | i 1 | iste 2 | io 1 | imos 2 | isteis 3 | ieron 2 |
| preterite strong (all conj.) | e R | iste 2 | o R | imos 2 | isteis 3 | ieron 2 |
| future (on future stem) | e 1 | as 1 | a 1 | emos 2 | eis 2 | an 1 |
| conditional (on future stem) | ia 2 | ias 2 | ia 2 | iamos 3 | iais 3 | ian 2 |
| present subjunctive `ar` | e R | es R | e R | emos 2 | eis 2 | en R |
| present subjunctive `er`/`ir` | a R | as R | a R | amos 2 | ais 2 | an R |
| imperfect subjunctive `ra` | ra 2 | ras 2 | ra 2 | ramos 3 | rais 3 | ran 2 |
| imperfect subjunctive `se` | se 2 | ses 2 | se 2 | semos 3 | seis 3 | sen 2 |
| future subjunctive | re 2 | res 2 | re 2 | remos 3 | reis 3 | ren 2 |

The three subjunctive sets attach to the preterite-3pl base (`ama-`, `comie-`, `tuvie-`, `dije-`), whose last vowel is the stressed one. Imperative: 2sg = the present indicative 3sg form (`es.end.imperative-tu`); 2pl = future stem minus `r` + `d`, stress 1 (`es.end.imperative-vosotros`: amad, comed, vivid, pudrid); 3sg, 1pl, 3pl = present subjunctive cells (`es.end.imperative-subjunctive`). Non-finite: infinitive = the lemma (`es.end.infinitive`); gerund `ando` 2 / `iendo` 2; participle `ado` 2 / `ido` 2.

| Id | Kind | Statement | Params | Cite |
|---|---|---|---|---|
| `es.end.present` | rule | Present: add the personal ending. | `ending` | ngle §4.4–4.6 |
| `es.end.imperfect` | rule | Imperfect: -aba- for -ar verbs, -ía- for -er/-ir verbs. | `ending` | ngle §4.4–4.6 |
| `es.end.preterite` | rule | Preterite: add the ending. | `ending` | ngle §4.4–4.6 |
| `es.end.preterite-strong` | rule | Strong preterite: unstressed -e and -o in the 1st and 3rd person singular. | `ending` | ngle §4.12 |
| `es.end.future` | rule | Future: add the ending to the future stem. | `ending` | ngle §4.4–4.6 |
| `es.end.conditional` | rule | Conditional: add -ía- to the future stem. | `ending` | ngle §4.4–4.6 |
| `es.end.subjunctive-present` | rule | Present subjunctive: -ar verbs take e, -er and -ir verbs take a. | `ending` | ngle §4.4–4.6 |
| `es.end.subjunctive-imperfect` | rule | Imperfect subjunctive: -ra or -se after the preterite base; both are correct. | `ending` | ngle §4.4–4.6, §24.2c |
| `es.end.subjunctive-future` | rule | Future subjunctive (now rare): -re after the preterite base. | `ending` | ngle §4.4–4.6; gtg futuro simple de subjuntivo |
| `es.end.imperative-tu` | rule | The tú command is the same as the él form of the present. | – | ngle §4.6, §4.15 |
| `es.end.imperative-vosotros` | rule | The vosotros command replaces the -r of the infinitive with -d. | – | ngle §4.6, §4.15 |
| `es.end.imperative-subjunctive` | rule | The usted, nosotros and ustedes commands use the present subjunctive. | – | ngle §4.6, §4.15 |
| `es.end.infinitive` | rule | The infinitive is the dictionary form. | – | ngle §4.6 |
| `es.end.gerund` | rule | Gerund: -ando for -ar verbs, -iendo for -er/-ir verbs. | `ending` | ngle §4.6 |
| `es.end.participle` | rule | Participle: -ado for -ar verbs, -ido for -er/-ir verbs. | `ending` | ngle §4.6 |

### 4.4 Orthography (stage `orthography`, `JunctureRule`s in this order)

All rules in §4.4, §4.6 and §4.7 are of kind `rule`.

"Front" = ending starts with `e`/`i`; "back" = starts with `a`/`o`. The consonant's sound is read from the infinitive: `-car` /k/, `-zar` and `-cer`/`-cir` /θ/, `-gar` and `-guir` /g/, `-ger`/`-gir` /x/, `-quir` /k/, `-guar` /gw/.

| Id | Statement | Trigger (stem end · ending start · lexeme) | Params | Cite | Example |
|---|---|---|---|---|---|
| `es.orth.c-qu` | c is written qu before e. | `c` · front · `-car` | `vowel` | orto (letters c, z, g, j); gtg verbo-regular | saqu-é |
| `es.orth.g-gu` | g is written gu before e. | `g` · front · `-gar` | `vowel` | orto (letters c, z, g, j); gtg verbo-regular | pagu-é |
| `es.orth.gu-diaeresis` | gu is written gü before e so the u is still pronounced. | `gu` · front · `-guar` | `vowel` | orto (diéresis); dpd averiguar | averigü-é |
| `es.orth.z-c` | z is written c before e. | `z` · front · `-zar` | `vowel` | orto (letters c, z, g, j); gtg verbo-regular | cac-é |
| `es.orth.c-z` | c is written z before a and o. | `c` not `zc` · back · `-cer`/`-cir` | `vowel` | orto (letters c, z, g, j); gtg verbo-regular | venz-o, hiz-o |
| `es.orth.g-j` | g is written j before a and o. | `g` · back · `-ger`/`-gir` | `vowel` | orto (letters c, z, g, j); gtg verbo-regular | coj-o |
| `es.orth.gu-g` | gu is written g before a and o. | `gu` · back · `-guir` | `vowel` | orto (letters c, z, g, j); gtg verbo-regular | disting-o |
| `es.orth.qu-c` | qu is written c before a and o. | `qu` · back · `-quir` | `vowel` | orto (letters c, z, g, j); gtg verbo-regular | delinc-o |
| `es.orth.u-diaeresis-y` | ü loses its diaeresis before y. | `üy` | – | orto (diéresis); ngle §4.9 | argüy-o → arguy-o |
| `es.orth.i-y` | An unstressed i between vowels is written y. | stem ends in a pronounced vowel (`a e o u ü`, not the silent u of gu/qu) · ending starts with unstressed `i` + vowel | – | ngle §4.9; dpd leer | le-ió → le-yó |
| `es.orth.i-absorbed` | After ñ, ll, j or i the unstressed i of the ending disappears. | stem ends `ñ`, `ll`, `j` (strong preterite) or `i` · ending starts with unstressed `i` + vowel | `after` | ngle §4.9 [U locator] | bruñ-ió → bruñ-ó; dij-ieron → dij-eron; ri-ió → ri-ó |
| `es.orth.initial-diphthong` | A word cannot begin with ue or ie: it is written hue or ye. | stem starts `ue` (or `desue`: desosar) → `hue`; starts `ie` → `ye` | – | orto (h, y) [U locator]; ngle §4.10 | uel- → huel-; ierr- → yerr- |
| `es.orth.g-diphthong` | After g the diphthong ue is written üe. | alternation `o-ue`, cell ∈ R, the alternating o follows `g` in the root (avergonzar, degollar, agorar) | – | orto (diéresis) [U locator] | averguenz- → avergüenz- |
| `es.orth.accent-hiatus` | A stressed i or u next to a, e or o is written with a tilde. | stressed vowel ∈ {i, u}, an adjacent vowel letter (h between allowed) ∈ {a, e, o} | – | orto §3.4.2; dpd-tilde §2.2.2 | envio → envío; prohibo → prohíbo |
| `es.orth.accent-general` | The general rules decide whether the stressed vowel gets a tilde. | §4.5 step 4 | `stress` (`final`, `penultimate`, `antepenultimate`) | orto §3.4.1; dpd-tilde §1.1 | amabamos → amábamos |
| `es.orth.monosyllable` | A one-syllable word takes no tilde. | word is one syllable and has two or more vowel letters (step recorded although nothing changes) | – | orto §3.4.3; orto-novedades | dio, guio, rio, hui |
| `es.orth.diacritic` | dé (from dar) and sé (from saber and ser) keep a tilde to tell them from de and se. | final word `de` of dar, `se` of saber / ser | `word` | orto §3.4.3; dpd-tilde §3.1 | de → dé |

### 4.5 Stress, syllables and the written accent (`syllables.ts`)

Pure functions; the accent rules (`es.orth.accent-*`, `es.clause.enclitic-accent`) call them.

1. **Vowel letters**: `a e i o u ü`, and `á é í ó ú` if present. Not vowels: `u` in `que qui gue gui` (silent) and in `qu` generally; `y` except word-final after a vowel (`hoy`, `estoy`: counts as a close vowel for syllables, as a consonant for the ending rules). `h` between two vowel letters is transparent (`prohíbo`, `rehúso`, `ahínco`).
2. **Stressed vowel**:
   - ending-stressed cell: the n-th vowel letter from the end of the word (§4.3);
   - root-stressed cell: on the stem (for a derivative, on the base part only; the prefix never takes the stress): take the stem's last vowel letter; if it is a close vowel (`i`, `u`) at the very end of the stem after a consonant, it is a glide unless the lexeme is a hiatus verb or the stem has no other vowel (`gui-`, `ri-`, `fi-`), so step back to the previous vowel; then, in a run of adjacent vowel letters (a vowel group), the stress goes to the open vowel (`a e o`) unless the lexeme is a hiatus verb, which puts it on the close vowel. Stems that the lexicon stores (`present1`, strong preterite) never use the hiatus flag (`oig-o`, `traig-o`);
   - stem with no vowel (`v-es`, `d-as`): the first vowel of the ending.
3. **Syllable nuclei** (orthographic, Ortografía 2010): walk the vowel letters; two adjacent ones stay in one nucleus unless (a) both are open, or (b) one of them is the stressed vowel and is close while the other is open. `iu`/`ui` always form one nucleus. `h` between vowels does not split.
4. **Tilde**: (a) stressed close vowel with an adjacent open vowel → tilde on it (`es.orth.accent-hiatus`); else (b) one nucleus → none (`es.orth.monosyllable` when two or more vowel letters); else (c) last nucleus stressed (aguda): tilde iff the word ends in `a e i o u`, or in `n`/`s` after a vowel letter; penultimate (llana): tilde iff it does not; earlier (esdrújula): always (`es.orth.accent-general`). Position of the tilde: the stressed vowel if it is alone or open; in a nucleus with an open vowel, the open vowel; in `ui`/`iu`, the second.
5. **Diacritic**: §4.4 last row.

Checks the implementation must pass (all verified by the prototype): amábamos, estás, envío, actúo, aíslo, reúno, prohíbo, rehúso, ahínco, enraízo, construí, construía, huí→hui, huis, huido, oís, reís, reímos, leíste, cayó, guio, guie, guiais, rio, riais, sonrió, frio, dio, vio, fue, dé, sé, averigüé, averiguáis, estudiéis, levántate, levantaos, levantémonos, reíos, vestíos, vámonos, prevés, detén, rehíce.

### 4.6 Periphrasis (stage `periphrasis`)

`spanishPeriphrases: readonly Periphrasis<SpanishLexeme>[]` (no `applies`: every chain builds its tense for every verb). Every perfect chain is `[{ verb: 'perfectAuxiliary', finite: X }, { verb: 'main', nonFinite: 'compound-participle' }]` (no `agree`); rule param `auxiliary`; `lexeme.auxiliaries` is `['haber']` for every verb, including haber (`he habido`). `compound-participle` is a pack-internal form: the participle's outcomes minus those the lexicon marks `compound: false` (electo, preso), so `he elegido` but `participle.past` = elegido, electo.

| Id | Mood/tense | Auxiliary element | Example | Cite |
|---|---|---|---|---|
| `es.periphrasis.perfect` | indicative.perfect | finite indicative/present | he amado | ngle §4.15 (model tables) |
| `es.periphrasis.pluperfect` | indicative.pluperfect | finite indicative/imperfect | había amado | ngle §4.15 (model tables) |
| `es.periphrasis.past-anterior` | indicative.past_anterior | finite indicative/simple_past | hube amado | ngle §4.15 (model tables) |
| `es.periphrasis.future-perfect` | indicative.future_perfect | finite indicative/future | habré amado | ngle §4.15 (model tables) |
| `es.periphrasis.conditional-perfect` | conditional.past | finite conditional/present | habría amado | ngle §4.15 (model tables) |
| `es.periphrasis.subjunctive-perfect` | subjunctive.past | finite subjunctive/present | haya amado | ngle §4.15 (model tables) |
| `es.periphrasis.subjunctive-pluperfect` | subjunctive.pluperfect | finite subjunctive/imperfect | hubiera / hubiese amado | ngle §4.15 (model tables) |
| `es.periphrasis.subjunctive-future-perfect` | subjunctive.future_perfect (`usage: 'dated'`) | finite subjunctive/future | hubiere amado | ngle §4.15 (model tables) |
| `es.periphrasis.infinitive-perfect` | infinitive.past | nonFinite `infinitive` | haber amado | ngle §4.15 (model tables) |
| `es.periphrasis.gerund-perfect` | gerund.past | nonFinite `gerund` | habiendo amado | ngle §4.15 (model tables) |
| `es.periphrasis.negative-imperative` | imperative.negative | chain `[{ word: 'no', role: 'moodMarker' }, { verb: 'main', finite: { mood: 'subjunctive', tense: 'present' } }]`, no params | no ames | gtg imperativo [U] |

### 4.7 Clause (stage `clause`)

| Id | Statement | Trigger | Params | Cite | Example |
|---|---|---|---|---|---|
| `es.clause.subject` | The subject pronoun comes first; Spanish often leaves it out. | finite, not imperative | `pronoun` | ngle §4.4 | yo amo |
| `es.clause.que` | Subjunctive forms are listed after que. | mood subjunctive | – | ngle §4.5 [U] | que yo ame |
| `es.clause.proclitic` | The reflexive pronoun goes before a conjugated verb. | reflexive, finite chain (incl. negative imperative) | `pronoun` | dpd pronombres personales átonos | me levanto, no te levantes |
| `es.clause.enclitic` | After an affirmative command, an infinitive or a gerund the pronoun is attached to the end. | reflexive, affirmative imperative / infinitive / gerund (on haber in the compounds) | `pronoun` | dpd pronombres personales átonos | levanta + te |
| `es.clause.enclitic-d-drop` | The vosotros command loses its -d before os (not idos). | 2pl imperative + `os`, lemma ≠ ir | – | dpd pronombres personales átonos | levantad + os → levantaos |
| `es.clause.enclitic-s-drop` | The nosotros command loses its -s before nos. | 1pl imperative + `nos` | – | dpd pronombres personales átonos | levantemos + nos → levantémonos |
| `es.clause.enclitic-accent` | The stress stays where it was; the longer word follows the accent rules. | after enclitic attachment, accent changed | `stress` | orto §3.4.5; dpd-tilde §4.3 | levantate → levántate |

Pronouns by slot person/number: me te se nos os se (usted/ustedes: se); non-finite: se.

### 4.8 Availability (stage `availability`, kind `unavailable`)

| Id | Reason | Trigger | Cite |
|---|---|---|---|
| `es.avail.impersonal` | `impersonal` | lexicon `impersonal` (llover, nevar, granizar, lloviznar, diluviar, relampaguear, tronar in its weather sense): every finite target except 3sg; all imperatives | ngle §4.14 / DPD llover |
| `es.avail.defective` | `defective` | lexicon `defective: 'soler'`: the cells of §5.6 | DPD soler |
| `es.avail.no-imperative` | `noImperative` | haber (auxiliary): both imperative tenses | DPD haber |

### 4.9 Count

84 rules: classify 13, stem 18 (incl. 4 `es.cell.*`), ending 15, orthography 17, periphrasis 11, clause 7, availability 3. The approved design estimated about 45; the difference is that every compound tense and every spelling alternation is its own rule so that each explanation can name it.

### 4.10 Terms for the Dutch messages

Use the names Dutch secondary schools use for Spanish: `presente`, `pretérito indefinido` (= perfecto simple; give both), `pretérito imperfecto`, `pretérito perfecto`, `pluscuamperfecto`, `futuro`, `condicional`, `subjuntivo`, `imperativo`, `gerundio`, `participio`. Spelling: `klemtoon`, `lettergreep`, `tweeklank` (diptongo), `hiaat`, `accent` for the tilde (not "tilde", which Dutch pupils know as `ñ`'s mark), `laatste / voorlaatste / derde lettergreep van achteren` for aguda / llana / esdrújula, `stam`, `uitgang`, `wederkerend voornaamwoord`.

## 5. Lexicon (`lexicon.ts`)

### 5.1 Entry type

```ts
type Alternation = 'e-ie' | 'o-ue' | 'u-ue' | 'i-ie' | 'e-i';
interface Variant<T> { readonly value: T; readonly pattern: string; readonly usage?: FormVariant['usage']; readonly region?: string }
interface SpanishEntry {
  readonly model?: string;                              // classId shown to learners; default the lemma
  readonly alternation?: Alternation | readonly Variant<Alternation>[];   // erguir: e-ie (yergo) and e-i (irgo)
  readonly raising?: false;                             // discernir, concernir, cernir, adquirir, inquirir
  readonly stress?: 'hiatus' | 'diphthong' | 'both';
  readonly present1?: string | readonly Variant<string>[];   // stored 1sg present stem: teng, quep, yazc|yazg|yag
  readonly subjunctive?: string;                        // only when ≠ present1 (saber: sep, haber: hay)
  readonly preterite?: string;                          // strong stem
  readonly preteriteConjugation?: 'er';                 // dar: di, diste, dio
  readonly future?: string | readonly Variant<string>[];
  readonly imperative2sg?: string | readonly Variant<string>[];
  readonly participle?: string | readonly (Variant<string> & { readonly compound?: false })[];   // false: not after haber (electo)
  readonly gerund?: string;
  readonly imperfect?: string;                          // ver: ve-
  readonly root?: string;                               // podrir: pudr- everywhere but infinitive and participle
  readonly endingStress?: true;                         // estar, dar: está, estén, das
  readonly yInsertion?: true;                           // oír, desoír
  readonly cells?: Readonly<Partial<Record<CellKey, string>>>;   // whole words, written with tildes
  readonly impersonal?: true;
  readonly defective?: 'soler';
  readonly noImperative?: true;
}
// CellKey = `${mood}.${tense}.${person}${'sg' | 'pl'}` for finite cells ('indicative.present.1sg'), or the form name ('participle').
// Two-paradigm lemmas: Readonly<Record<string, readonly { entry: SpanishEntry; pattern: string; condition: string }[]>>
```

Derived, never stored: present subjunctive (from `present1`), imperfect and future subjunctive (from the preterite 3pl), conditional (from the future stem), every compound tense, imperative (from present and subjunctive), regular gerund and participle, all written accents.

### 5.2 Irregular, defective and participle entries (about 90 lemmas)

Forms in this table are stated from memory **[U]**; they agree with the oracle where the oracle has the verb (marked ●), but the lexicon must be checked against each DLE conjugation table (`https://dle.rae.es/<lemma>`, "Conjugar" tab) before it is committed.

| Lemma | Stored parts |
|---|---|
| ser ● | cells: present soy eres es somos sois son; imperfect era eras era éramos erais eran; preterite fui fuiste fue fuimos fuisteis fueron; subjunctive sea…; imperative2sg `se` (→ sé by diacritic); participle sido; gerund siendo |
| ir ● | cells: present voy vas va vamos vais van; imperfect iba ibas iba íbamos ibais iban; preterite fui…; subjunctive vaya…; imperative 2sg ve, 1pl `vamos` (pattern `vamos`) / `vayamos` (pattern `vayamos`) [U: DPD `ir`]; gerund yendo; 2pl + os: `idos` (keeps its d) and `iros` (pattern `iros`, accepted by the RAE note, [S]) |
| haber ● | cells: present he has ha hemos habéis han; subjunctive stem hay-; preterite hub-; future habr-; noImperative |
| estar ● | cells: present 1sg estoy; endingStress; preterite estuv- |
| dar ● | cells: present 1sg doy; endingStress; preteriteConjugation `er` (di, diste, dio, dimos, disteis, dieron) |
| ver ● | present1 ve- (veo, vea); imperfect ve-; participle visto |
| hacer ● | present1 hag; preterite hic (hizo by `es.orth.c-z`); future har; imperative2sg haz; participle hecho |
| satisfacer ● | present1 satisfag; preterite satisfic; future satisfar; imperative2sg satisfaz / satisface; participle satisfecho |
| decir ● | alternation e-i; present1 dig; preterite dij; future dir; imperative2sg di; participle dicho (gerund diciendo by raising) |
| predecir ● | e-i; present1 predig; preterite predij; future predecir (pattern `regular`, first) / predir (pattern `irregular`) [S: DPD predecir, regular forms predominate]; participle predicho; imperative2sg regular (predice, not predí) |
| contradecir | e-i; present1 contradig; preterite contradij; future contradir [S: DPD, the regular one is regional]; participle contradicho; imperative2sg contradice |
| desdecir | as contradecir [U: DPD desdecir] |
| bendecir, maldecir | e-i; present1 bendig/maldig; preterite bendij/maldij; future and conditional regular; participle bendecido/maldecido, the only form for compound tenses [S: DPD maldecir]; imperative2sg bendice/maldice |
| poner ● | present1 pong; preterite pus; future pondr; imperative2sg pon; participle puesto |
| tener ● | e-ie; present1 teng; preterite tuv; future tendr; imperative2sg ten |
| venir ● | e-ie (raising: viniendo); present1 veng; preterite vin; future vendr; imperative2sg ven |
| querer ● | e-ie; preterite quis; future querr |
| poder ● | o-ue; preterite pud; future podr; gerund pudiendo |
| saber ● | cells: present 1sg `se` (→ sé); subjunctive sep; preterite sup; future sabr |
| caber ● | present1 quep; preterite cup; future cabr |
| andar ● | preterite anduv |
| traer ● | present1 traig; preterite traj |
| caer ● | present1 caig |
| oír ● | present1 oig; yInsertion |
| salir ● | present1 salg; future saldr; imperative2sg sal |
| valer ● | present1 valg; future valdr |
| asir ● | present1 asg |
| yacer ● | present1 yazc / yazg / yag (patterns `zc`, `zg`, `g`); imperative2sg yace / yaz [U: DPD yacer] |
| placer ● | (zc by rule: plazco); no stored preterite (`plugo` archaic, out) |
| roer ● | present1 ro / roig / roy (patterns `o`, `ig`, `y`) [U: DPD roer] |
| raer ● | present1 raig / ra (indicative raigo / rao) with subjunctive raig / ray (raiga / raya) [U: DLE raer — verify which pairs are listed] |
| erguir ● | alternation e-ie (`yergo`, pattern `ye`) / e-i (`irgo`, pattern `i`); raising (irguió, irguiendo) |
| podrir ● | root pudr (all forms but the infinitive); participle podrido |
| freír | e-i; participle frito (pattern `irregular`, first) / freído (pattern `regular`), both in compound tenses |
| elegir ●, reelegir | e-i; participle elegido (pattern `regular`) / electo (pattern `irregular`, condition `adjectival`, `compound: false`) [S: NGLE §4.12, DPD elegir] |
| prender | participle prendido / preso (pattern `irregular`, `compound: false`) [S: NGLE §4.12; verify DPD prender] |
| reír ● / sonreír | e-i (hiatus by `-eír`) |
| morir | o-ue; participle muerto |
| escribir (+ `-scribir` family) | participle escrito |
| abrir, entreabrir, reabrir | participle -abierto |
| cubrir, descubrir, encubrir, recubrir | participle -cubierto |
| romper | participle roto |
| imprimir | participle impreso / imprimido |
| proveer | participle provisto / proveído |
| volver, devolver, envolver, revolver, desenvolver | o-ue; participle -vuelto |
| resolver, absolver, disolver | o-ue; participle -suelto |
| adquirir ●, inquirir | i-ie; raising false |
| discernir ●, concernir, cernir | e-ie; raising false |
| jugar ● | u-ue |
| oler ●, desosar ● | o-ue (initial-diphthong rule gives huel-, deshues-) |
| errar ● | e-ie (yerr-) [U: DPD errar on `erro` in America — if confirmed, a second variant `region`] |
| argüir, redargüir | y-insertion; ü→u before y |
| conducir ● (`-ducir` family: producir ●, traducir, reducir, deducir, inducir, introducir, seducir, aducir, reproducir) | zc + strong `-duj-` by rule; nothing stored |
| abolir ●, agredir, transgredir | no entry needed: fully conjugated today (§9.6) |
| soler ● | o-ue; defective `soler` (§5.6) |
| llover ● (o-ue), nevar (e-ie), granizar, lloviznar, diluviar, relampaguear | impersonal |

Two-paradigm lemmas [U, verify in DLE where the homographs are numbered]: `apostar` (o-ue 'to bet' / regular 'to post'), `aterrar` (e-ie 'to cover with earth' / regular 'to terrify'), `atestar` (e-ie 'to cram' / regular 'to testify').

### 5.3 Vowel-alternation list (about 205 lemmas; lexical; verify each lemma's "Conjug. c. …" model in the DLE)

- **e→ie, -ar (model acertar)**: acertar alentar apacentar apretar arrendar asentar aserrar atravesar aventar calentar cegar cerrar comenzar concertar confesar decentar desconcertar desenterrar despertar desplegar empedrar empezar● encerrar encomendar enmendar enterrar errar● escarmentar fregar gobernar helar herrar invernar manifestar mentar merendar negar nevar pensar● plegar quebrar recomendar regar● renegar reventar segar sembrar sentar serrar sosegar soterrar temblar tentar tropezar.
- **e→ie, -er (model entender)**: ascender atender cerner condescender contender defender● descender encender entender extender heder hender perder tender trascender verter (+ tener●, querer●, venir● as irregular bases).
- **e→ie + raising, -ir (model sentir)**: adherir advertir arrepentir asentir consentir controvertir convertir desmentir diferir digerir divertir herir hervir inferir ingerir invertir mentir pervertir preferir presentir proferir referir requerir resentir revertir sentir● sugerir transferir zaherir; **without raising (model discernir)**: cernir concernir discernir●.
- **o→ue, -ar (model contar)**: acordar acostar almorzar apostar¹ aprobar avergonzar● colar colgar● comprobar concordar consolar contar costar degollar demostrar descontar desollar desosar● encontrar● engrosar esforzar forzar● mostrar poblar probar recordar recostar reforzar renovar reprobar rodar rogar soldar soltar sonar soñar tostar trocar● tronar volar volcar.
- **o→ue, -er (model mover)**: absolver cocer● conmover devolver disolver doler envolver escocer llover● moler morder mover● oler● promover remover resolver retorcer revolver soler● torcer volver● (+ poder●).
- **o→ue + raising, -ir (model dormir)**: dormir● morir.
- **e→i, -ir (model pedir)**: ceñir colegir competir concebir conseguir constreñir corregir derretir desteñir despedir elegir● embestir expedir freír gemir henchir impedir investir medir pedir● perseguir proseguir reelegir regir reír● rendir reñir● repetir revestir seguir● servir sonreír teñir travestir vestir (+ decir● family, erguir●).
- **i→ie**: adquirir● inquirir. **u→ue**: jugar●.

### 5.4 Stress lists (lexical)

- **-iar with hiatus (model enviar)** [U, verify DLE "Conjug. c. enviar"]: aliar ampliar ansiar arriar ataviar averiar aviar chirriar confiar contrariar criar desafiar desataviar descarriar desconfiar desliar desvariar desviar enfriar enviar escalofriar espiar esquiar estriar expiar extasiar extraviar fiar guiar● hastiar inventariar liar malcriar piar porfiar reenviar resfriar rociar vaciar variar, and the `-grafiar` verbs (autografiar biografiar cablegrafiar caligrafiar cartografiar cinematografiar coreografiar fotografiar mecanografiar radiografiar taquigrafiar telegrafiar). About 55.
- **-iar with both stresses** (`stress: 'both'`, patterns `diphthong` first, `hiatus`) [U, DPD]: agriar auxiliar expatriar historiar paliar repatriar vidriar.
- **-uar** needs no list (rule `es.classify.uar-stress`) except: `anticuar` (hiatus, anticúo) and `adecuar evacuar licuar` (`stress: 'both'`, `diphthong` first) [S: DPD averiguar; V: aml-minucias].
- **Root-internal hiatus (model aislar / reunir / prohibir)** [U, verify DLE]: ahijar ahilar ahincar● ahitar ahuchar ahumar ahusar airar● aislar amohinar arcaizar aullar● aunar aupar cohibir descafeinar desenraizar embaular enraizar● europeizar hebraizar homogeneizar judaizar maullar prohibir● prohijar rehilar rehuir rehundir rehusar reunir● sobrehilar. About 32. Contrast (diphthong, no entry): causar, pausar, peinar, reinar, embaucar, desahuciar.

### 5.5 Side lists

`zcExceptions` (§4.2); `strongBases`, `prefixes`, `noInherit`, `shortBaseDerivatives` (§3.3); `families`: `-ducir`, `-scribir`; `impersonal` and `defective` flags (§4.8); `diacritics`: `{ dar: 'de', saber: 'se', ser: 'se' }`.

### 5.6 soler

soler is defective [S: DPD soler — "No se emplea en futuro, condicional e imperativo"; "Entre los tiempos compuestos, cuyo uso es muy raro, el más usado es el pretérito perfecto compuesto"]. The DLE table lists every form, soliendo and solido included [S]. The pack therefore declares `es.avail.defective` for: `indicative.future`, `indicative.future_perfect`, `conditional.present`, `conditional.past`, `imperative.present`, `imperative.negative`, and, because the future subjunctive is a future and archaic for every verb, `subjunctive.future` and `subjunctive.future_perfect` (8 tenses: 46 targets in an unfiltered query). Everything else is generated: present (suelo), imperfect (solía), preterite (solí, rare), the compound tenses (he solido, había solido, hube solido, haya solido, hubiera/hubiese solido), subjunctive present and imperfect, infinitive, `haber solido`, `soliendo`, `habiendo solido`, `solido`. Open question (§11): whether `hube solido` and `soliendo` deserve a `usage` label once the DPD page is read.

### 5.7 Verification route

Each lemma's model is checked on its DLE page ("Conjug. c. contar" etc., and the conjugation table behind "Conjugar") by opening it in Chrome during implementation, as the approved design requires; the DPD entry is checked where §5.2 marks [U: DPD …]. `sources.ts` flags every rule whose only reachable source was secondary (§1). Nothing is copied from the oracle.

## 6. Periphrases and clause

- **Chains**: §4.6. `variant.auxiliary` reports `haber` for every perfect chain (default `reports`); the negative imperative reports none.
- **Word order** (left to right): `que` (subjunctive moods) · subject pronoun (finite non-imperative) · `no` (negative imperative) · proclitic reflexive · auxiliary · lexical verb. Examples: `que yo me haya levantado`, `no te levantes`, `nosotros nos hemos levantado`.
- **Enclitics**: affirmative imperative, infinitive and gerund take the reflexive attached (a `reflexivePronoun` part built with `grammaticalPart(rendering, 'reflexivePronoun', pronoun, null, {}, 'attached')`, the verb part with `wordPart(rendering, word, features)`); in compound non-finite forms it attaches to haber (`haberse levantado`, `habiéndose levantado`). The verb part's text is the re-accented verb (`levánta` + `te`), so `renderParts` and `bare` rendering give `levántate`; the steps are `es.clause.enclitic`, then `es.clause.enclitic-d-drop` / `-s-drop` when they apply, then `es.clause.enclitic-accent`. The participle never takes the pronoun.
- **Pro-drop decision**: finite forms are rendered **with** the subject pronoun as a `subject` part (`yo amo`, `que yo ame`, `usted ama`), because the formal and feminine slots are otherwise indistinguishable and the French and Dutch packs do the same; Spanish omits the pronoun in normal use, and `renderParts(parts, { bare: true })` gives exactly that form (`amo`, `ame`: `bareOmits` drops `que`, never `no`). The oracle's `(yo)`, `(tú)`, `(él)`, `(ns)`, `(vs)`, `(ellos)` (parentheses = optional) map to the slots `1sg 2sg 3sg 1pl 2pl 3pl` and their pronouns yo tú él nosotros vosotros ellos.
- **Parts**: `moodMarker` for `que` and `no`; `subject`; `reflexivePronoun`; `auxiliary`; `lexicalVerb`. Rendering: `onset` vowel/consonant (no sandhi), `sandhi` → null, `bareOmits` → `role === 'moodMarker' && text === 'que'`.
- **Agreement**: `agreements` always returns `one(null)` (participles invariable).

## 7. Worked derivations (as a learner reads them)

1. **amábamos** — root: drop -ar → am- (`es.stem.root`); imperfect: add -abamos (`es.end.imperfect`); stress on the third vowel from the end → esdrújula → tilde (`es.orth.accent-general`): amábamos.
2. **saqué** — sac- (`es.stem.root`); preterite -e (`es.end.preterite`); c → qu before e (`es.orth.c-qu`): saque; stressed last syllable ending in a vowel → tilde (`es.orth.accent-general`): saqué.
3. **averigüe** (present subjunctive) — averigu-; ending -e (`es.end.subjunctive-present`); gu → gü before e (`es.orth.gu-diaeresis`).
4. **piensan** — pens-; stressed e → ie (`es.stem.diphthong`): piens-; ending -an (`es.end.present`).
5. **sintió** — sent-; -ir verb, ending without stressed i → e becomes i (`es.stem.raising`); -ió (`es.end.preterite`); aguda ending in a vowel → sintió.
6. **conozca** — conoc-; zc (`es.stem.zc`): conozc-; subjunctive built on the 1sg stem (`es.stem.subjunctive-from-1sg`); -a.
7. **construyó / construyo** — constru-; preterite -ió; unstressed i between u and o → y (`es.orth.i-y`): construyó (tilde: aguda). Present: y added before -o (`es.stem.y-insertion`): construyo.
8. **envío / cambio** — envi-; enviar is a hiatus verb (lexicon) → stress on the i; -o; stressed i next to o → tilde (`es.orth.accent-hiatus`). cambi- (not on the list) → the i is a glide, stress on a → cambio, no tilde; for an unlisted -iar verb the analysis records `es.classify.assume-glide`.
9. **guio / rio** — gui- (u silent) + -o (`es.end.preterite`): the unstressed i and the stressed o make one syllable, and a one-syllable word takes no tilde (`es.orth.monosyllable`, Ortografía 2010), although the stressed final vowel would otherwise call for one. reír: ri- (`es.stem.raising`) + -ió; the ending's i is absorbed after the root's i (`es.orth.i-absorbed`) → rio, again one syllable.
10. **tuve / tuviéramos** — lexicon: strong preterite tuv- (`es.stem.strong-preterite`); -e, unstressed (`es.end.preterite-strong`): tuve. tuvieron → tuvie- (`es.stem.preterite-3pl`); -ramos (`es.end.subjunctive-imperfect`, pattern `ra`); third vowel from the end → tuviéramos.
11. **habíamos levantado** (pluperfect, nosotros, of levantarse) — `es.periphrasis.pluperfect` (auxiliary haber); haber: hab- + -íamos (`es.end.imperfect`, tilde by hiatus); levant- + -ado (`es.end.participle`); clause: nosotros (`es.clause.subject`), nos before the auxiliary (`es.clause.proclitic`): nosotros nos habíamos levantado.
12. **levantémonos** — subjunctive 1pl levantemos (`es.end.imperative-subjunctive`); nos attaches (`es.clause.enclitic`); -s dropped before nos (`es.clause.enclitic-s-drop`); stress stays on te, now the third syllable from the end → tilde (`es.clause.enclitic-accent`).
13. **no te levantes** — `es.periphrasis.negative-imperative`; subjunctive 2sg levantes; te before the verb (`es.clause.proclitic`).
14. **compón** — componer = com + poner (`es.classify.prefixed`); short command pon (`es.cell.imperative-short`) with the prefix; stress on the base's syllable → aguda ending in n → tilde.
15. **blorezco** (invented blorecer) — not listed (`es.classify.assume-regular`), vowel + -cer → assumed like conocer (`es.classify.assume-zc`); blorec- → blorezc- (`es.stem.zc`); -o.
16. **dé** — d- + -e (subjunctive); one syllable, no tilde by the general rules; diacritic tilde (`es.orth.diacritic`).

## 8. Test data

### 8.1 Invented verbs (one per rule; expected forms derived by hand from §4 and confirmed by the prototype)

| Verb (query) | Key forms | Proves |
|---|---|---|
| blorpar | blorpo, blorpé, blorpó, blorpábamos, blorpe, blorpara / blorpase, blorpare, blorpad, blorpando, blorpado; analysis assumption `es.classify.assume-regular` | regular `-ar`, accents |
| fluzar | flucé, fluce, flucemos, fluzó | `es.orth.z-c` |
| trobacar | trobaqué, trobaque, trobacó | `es.orth.c-qu` |
| drolgar | drolgué, drolgue | `es.orth.g-gu` |
| rimiguar | rimiguo, rimigüé, rimigüe, rimiguó | `-guar` diphthong + `es.orth.gu-diaeresis` |
| plontuar | plontúo, plontúas, plontúe, plontuamos, plontué | `es.classify.uar-stress` + hiatus tilde |
| flobiar | flobio, flobié, flobie; assumption `es.classify.assume-glide`; with `stems: { stress: 'hiatus' }`: flobío, flobíe | `-iar` default and hint |
| blaular | blaulo; assumption `es.classify.assume-diphthong`; with `stress: 'hiatus'`: blaúlo | root vowel group |
| troger | trojo, troja, trojamos, troges, trogí | `es.orth.g-j` |
| blorecer | blorezco, blorezca, bloreces; assumption `es.classify.assume-zc`; with `stems: { zc: false }`: blorezo, bloreza | `es.stem.zc` |
| treer | treo, treí, treíste, treyó, treyeron, treyendo, treído, treyera | `es.orth.i-y` + hiatus tildes |
| fluñir | fluño, fluñó, fluñeron, fluñendo, fluñera | `es.orth.i-absorbed` |
| plostuir | plostuyo, plostuyes, plostuimos, plostuís, plostuí, plostuyó, plostuyendo, plostuido | `es.stem.y-insertion` |
| bladucir | bladuzco, bladuje, bladujo, bladujeron, bladujera, bladucido | `-ducir` family |
| blorparse | me blorpo, blórpate, blórpese, blorpémonos, blorpaos, blórpense, no te blorpes, blorparse, blorpándose, haberse blorpado | clitics |
| plentar + `classHint: 'e-ie'` | pliento, plientas, plentamos, pliente, plentemos, plienta (imp.) | hint diphthong |
| flentir + `classHint: 'e-ie'` | fliento, flientes, flentimos, flintió, flintieron, flienta, flintamos, flintiendo, flintiera, flentido | diphthong + raising |
| tredir + `classHint: 'e-i'` | trido, tredimos, tridió, trida, tridamos, tridiendo, tredido | e→i + raising |
| protener | protengo, protuve, protendré, protén, protenido; `es.classify.prefixed` | inheritance |
| blotener | blotenemos, blotene (regular; no inheritance) | closed prefix list |
| reir (typed without tilde) | río, rio, reímos; step `es.classify.restore-accent` | input without diacritics |

### 8.2 Real verbs absent from the oracle

Forms [U] from memory and confirmed by the prototype; verify each against `https://dle.rae.es/<lemma>` (conjugation table) before committing the test.

| Verb | Forms |
|---|---|
| enviar | envío, envías, enviamos, envié, envió, envíe, enviéis, envía (imp.) |
| cambiar | cambio, cambias, cambié, cambió, cambie |
| continuar | continúo, continúas, continuamos, continúe |
| aislar | aíslo, aíslas, aislamos, aísle |
| rehusar | rehúso, rehúsa, rehusamos |
| construir | construyo, construimos, construís, construí, construyó, construía, construyendo, construido |
| huir | huyo, huis, huimos, hui, huyó, huía, huyendo, huido |
| leer | leo, leí, leíste, leyó, leyeron, leyendo, leído |
| freír | frío, freímos, frio, frieron, fría, friais, friendo, frito / freído |
| sonreír | sonrío, sonreímos, sonrió, sonriáis, sonriendo |
| conducir | conduzco, conduje, condujo, condujeron, condujera, conduciendo |
| componer | compongo, compuse, compondré, compón, compuesto |
| deshacer | deshago, deshice, deshizo, desharé, deshaz, deshecho |
| rehacer | rehago, rehíce, rehízo, reharé, rehaz, rehecho |
| prever | preveo, prevés, prevé, prevemos, prevén, preví, previó, prevea, previsto |
| mantener | mantengo, mantienes, mantuve, mantendré, mantén, mantenga |
| morir | muero, morimos, murió, murieron, muramos, muriendo, muerto |
| vestirse | me visto, nos vestimos, se vistió, vístete, vistámonos, vestíos, vistiéndose |
| sentarse | me siento, siéntate, sentémonos, sentaos, sentándose |
| reírse | me río, se rio, ríete, riámonos, reíos, riéndose |
| dormirse | me duermo, se durmió, duérmete, durmámonos, dormíos |
| irse | me voy, vete, váyase, vámonos / vayámonos, idos / iros, yéndose |
| cerrar / contar / entender | cierro, cerramos; cuento, contamos; entiendo, entendemos |
| pretender | pretendo, pretendes (no diphthong) |
| devolver | devuelvo, devolvemos, devuelto |
| escribir / abrir / romper | escrito; abierto; roto |
| nevar | nieva (3sg only; other persons unavailable, reason `impersonal`) |
| estudiar | estudio, estudiáis, estudié, estudiéis |
| argüir | arguyo, argüimos, argüí, arguyó, arguyendo, argüido |

### 8.3 Italian / Latin tiers

Not applicable to Spanish.

## 9. Oracle (elconjugador print pages)

### 9.1 Files

89 files `<infinitive>.html` in `SourceFiles/Español/` (file names NFC, e.g. `bruñir.html`, `oír.html`), one verb each, no variant pages. Each file is one line of HTML, declared `charset=iso-8859-15`; every byte is ASCII and non-ASCII letters are entities (`&aacute; &eacute; &iacute; &oacute; &uacute; &uuml; &ntilde; &nbsp; &gt;`). Decode with `iso-8859-15` (fatal); cheerio decodes the entities. Every file has exactly 64 `<td>` elements and 9 `<table>`s; the approved design's "64 cells" counts these `<td>`s, not corpus cells.

### 9.2 Structure

- Table 1 (title): `td[0]` logo, `td[1]` `<b><font>infinitive</font></b>`, `td[2]` an alternation note such as `(e &gt; ie)` on 33 pages (untrusted, ignored).
- Then blocks: a heading table (`<font size="4" color="#4186CB"><b>Indicative</b></font>`, or two headings `Infinitive` / `Gerundive` side by side) and a content table whose header rows are `tr[bgcolor="#EEEEEE"]` with `td > b > i` labels and whose content rows hold `td[valign="top"]`.
- 28 content `td[valign="top"]` in document order, with these heading paths (block / column label) and lines (`<br />`-separated):

| # | Heading path | Lines | Target |
|---|---|---|---|
| 1 | Indicative / Present | 6 | indicative.present |
| 2 | Indicative / Present perfect | 6 | indicative.perfect |
| 3 | Indicative / Imperfect | 6 | indicative.imperfect |
| 4 | Indicative / Pluperfect | 6 | indicative.pluperfect |
| 5 | Indicative / Simple past | 6 | indicative.simple_past |
| 6 | Indicative / Past perfect | 6 | indicative.past_anterior **(remap)** |
| 7 | Indicative / Future | 6 | indicative.future |
| 8 | Indicative / Past future | 6 | indicative.future_perfect **(remap)** |
| 9 | Indicative / Conditional | 6 | conditional.present |
| 10 | Indicative / Past conditional | 6 | conditional.past |
| 11 | Indicative / Imperative | 6 (line 0 is `-`) | imperative.present, lines 1–5 |
| 12 | Indicative / Imperative negative | 6 (line 0 is `-`) | imperative.negative, lines 1–5 |
| 13 | Subjunctive / Present | 6 | subjunctive.present |
| 14 | Subjunctive / Past | 6 | subjunctive.past **(remap)** |
| 15 | Subjunctive / Imperfect | 6 | subjunctive.imperfect, variant `ra` |
| 16 | Subjunctive / Pluperfect | 6 | subjunctive.pluperfect, variant `ra` |
| 17 | Subjunctive / Imperfect (2) | 6 | subjunctive.imperfect, variant `se` |
| 18 | Subjunctive / Pluperfect (2) | 6 | subjunctive.pluperfect, variant `se` |
| 19 | Subjunctive / Future | 6 | subjunctive.future |
| 20 | Subjunctive / Past future | 6 | subjunctive.future_perfect **(remap)** |
| 21 | Infinitive / Present | 1 | infinitive.present |
| 22 | Infinitive / Past | 1 | infinitive.past |
| 23 | Gerundive / Present | 1 | gerund.present **(remap)** |
| 24 | Gerundive / Past | 1 | gerund.past **(remap)** |
| 25 | Participle / Participle past (occurrence 0) | 1 | participle.past |
| 26 | Participle / Participle past (occurrence 1) | 1 | participle.past, variant `irregular` (the second participle: `-` on 88 pages, `electo` on elegir, which the engine generates) |
| 27–28 | Participle / `&nbsp;` | 1 (`&nbsp;`) | template placeholders |

### 9.3 Parsing (`scripts/corpus/parsers/es.ts`)

1. Collect the 28 `td[valign="top"]`; anything else → throw `${file}: expected 28 Spanish table cells`. Compute each one's heading path from the page (block heading spanning its column, then the column's `b i` label) and compare with the table above; a mismatch throws.
2. Split the cell's inner HTML on `<br\s*/?>`. Finite columns must have 6 lines, non-finite 1.
3. Per line, **before** stripping tags: if a `<b>…</b>` segment contains `/`, split its content on `/` and rebuild the line once per alternative with the text outside the segment re-attached (`p<b>udrí/odrí</b>` → `pudrí`, `podrí`), and join the rebuilt lines with `/` as the cell's `original` so `alternatives()` expands them (`yo pudrí/podrí` → `yo pudrí`, `yo podrí`). Only one such segment per line occurs (podrir ×2); more than one → throw.
4. Strip tags, decode entities, `normalizeText`. Replace the pronoun labels: `(yo)`→`yo`, `(tú)`→`tú`, `(él)`→`él`, `(ns)`→`nosotros`, `(vs)`→`vosotros`, `(ellos)`→`ellos`; subjunctive lines keep their leading `que`. A label at another line index → throw.
5. `-` → source-unavailable cell. A line ending in `-` after letters (`no abol-`, abolir imperative negative 2pl) is kept as its `original` and fixed in the ledger.
6. Cell fields: target from the table; `subject` = `1sg 2sg 3sg 1pl 2pl 3pl` by line index, except imperative lines 2 and 5 → `2sg.formal`, `2pl.formal`; `variant.pattern` for columns 15–18 and 26; `heading` = the path (with ` #1` for the second `Participle past`); `pronoun` null.
7. Placeholders: imperative line 0 (must be `-`) ×2 and the two `&nbsp;` cells → `templatePlaceholders: 4` per file.

### 9.4 Language module (`scripts/corpus/languages/es.ts`)

`directory: 'Español'`, `encoding: 'iso-8859-15'`, `expectedFiles: 89`, `cellsPerFile: 124`, `context(name)` = `{ infinitive: infinitiveFromFileName(name), gender: null, auxiliary: null, pattern: 'default' }` (reflexive `levantarse` keeps its `-se`), `query(file)` = `[{ label: 'default', options: { language: 'es', infinitive } }]`, `applicable(file, cell, forms)` = forms whose `variant.pattern` (split on `.`) contains `cell.variant.pattern` when the cell has one, else all forms; `unmodelled: {}` (none).

### 9.5 Remaps (template level, 6)

| Heading | Target | Reason | Source |
|---|---|---|---|
| Indicative / Past perfect | indicative.past_anterior | holds hube amado, the pretérito anterior; "past perfect" names the pluperfect, listed separately | NGLE §4.3 (tense names) |
| Indicative / Past future | indicative.future_perfect | holds habré amado, the futuro compuesto, not a future-in-the-past | NGLE §4.3 |
| Subjunctive / Past | subjunctive.past | holds haya amado (pretérito perfecto compuesto); "past subjunctive" usually means amara | NGLE §4.3 |
| Subjunctive / Past future | subjunctive.future_perfect | holds hubiere amado, the futuro compuesto de subjuntivo | NGLE §4.3 |
| Gerundive / Present | gerund.present | holds amando, the gerundio; a gerundive is a Latin verbal adjective | NGLE §4.3 / GTG gerundio |
| Gerundive / Past | gerund.past | holds habiendo amado, the gerundio compuesto | NGLE §4.3 |

`Imperfect (2)` / `Pluperfect (2)` and the second `Participle past` are variant columns, not remaps.

### 9.6 Source errors (corrections ledger, 97 cells)

| File | Cells (count) | Source | Correct | Authority |
|---|---|---|---|---|
| abolir | ind. present 1sg 2sg 3sg 3pl; perfect same 4; subj. present 6; subj. past 6; imperative 2sg 3sg 1pl 3pl; negative imperative 2sg 3sg 1pl 3pl (28) | `-` | abolo aboles abole abolen; he/has/ha/han abolido; que yo abola…; que yo haya abolido…; abole abola abolamos abolan; no abolas, no abola, no abolamos, no abolan | DPD abolir |
| abolir | negative imperative 2pl (1) | `no abol-` | no aboláis | DPD abolir |
| adquirir | preterite 2sg, 2pl (2) | adquiste, adquisteis | adquiriste, adquiristeis | DLE adquirir (conjugation) |
| ahincar | present 1sg 2sg 3sg 3pl; subj. present 1sg 2sg 3sg 3pl; imperative 2sg 3sg 3pl; negative imperative 2sg 3sg 3pl (14) | ahinco, ahinque… | ahínco, ahínque… | Ortografía 2010 hiatus rule; DLE ahincar |
| guiar | present 2pl; preterite 1sg, 3sg; subj. present 2pl; negative imperative 2pl (5) | guiáis, guié, guió, guiéis, no guiéis | guiais, guie, guio, guieis, no guieis | Ortografía 2010 monosyllables |
| reír | preterite 3sg; subj. present 2pl; negative imperative 2pl (3) | rió, riáis, no riáis | rio, riais, no riais | Ortografía 2010 monosyllables |
| podrir | preterite 1sg; future 1sg (2) | pudrí/podrí; pudriré/podriré | pudrí; pudriré — the o forms are an American variant outside the infinitive and participle; the pack models the general u paradigm | DPD pudrir |
| salir | conditional 2sg (1) | saldías | saldrías | DLE salir |
| valer | conditional 2sg (1) | valdías | valdrías | DLE valer |
| soler | indicative perfect, pluperfect, past anterior; subjunctive past, pluperfect `ra`, pluperfect `se` (6 each = 36); infinitive past, gerund present, gerund past, participle (4) — 40 | `-` | yo he solido…; yo había solido…; yo hube solido…; que yo haya solido…; que yo hubiera solido…; que yo hubiese solido…; haber solido; soliendo; habiendo solido; solido | DPD soler (compound tenses rare but used; only future, conditional, imperative lacking); DLE soler table |

The ledger is code in `scripts/corpus/corrections/es.ts` (one block per row, reason > 30 characters, `https://` source), never derived from the engine.

### 9.7 Expected totals

89 files · 89 infinitives · 124 cells per file · **11,036 cells** · **356 template placeholders** (4 per file) · 312 `-` cells in the source (88 second participles, llover 100, soler 86, abolir 28, haber imperative 10) · **6 remaps** · **0 unmodelled** · **97 corrected cells** (abolir 29, soler 40, ahincar 14, guiar 5, reír 3, adquirir 2, podrir 2, salir 1, valer 1). After the ledger, 244 cells stay unavailable (88 + 100 + 46 + 10) and every one of them matches an engine availability decision or an absent second participle. llover (3sg only, no imperative) and haber (no imperative) need no correction.

## 10. Tense concepts

| Tense | Concept links (weight) | Notes |
|---|---|---|
| indicative.present | PRESENT 1 | |
| indicative.perfect | PRESENT_PERFECT 1, PAST_PERFECTIVE 0.6 | recent past in Spain; much of America prefers the simple past |
| indicative.imperfect | PAST_IMPERFECTIVE 1 | |
| indicative.pluperfect | PLUPERFECT 1 | |
| indicative.simple_past | PAST_PERFECTIVE 1 | |
| indicative.past_anterior | PAST_ANTERIOR 1 (register literary) | rare outside writing |
| indicative.future | FUTURE 1 | also conjecture (será) |
| indicative.future_perfect | FUTURE_PERFECT 1 | |
| conditional.present | COND_PRESENT 1 | |
| conditional.past | COND_PERFECT 1 | |
| subjunctive.present | SUBJ_PRESENT 1 | |
| subjunctive.past | SUBJ_PERFECT 1 | |
| subjunctive.imperfect | SUBJ_IMPERFECT 1 | ra / se |
| subjunctive.pluperfect | SUBJ_PLUPERFECT 1, COND_PERFECT 0.5 | -ra form in conditional sentences (hubiera ido) |
| subjunctive.future | SUBJ_FUTURE 1 (register dated) | legal and set phrases |
| subjunctive.future_perfect | SUBJ_FUTURE_PERFECT 1 (dated) | |
| imperative.present | IMP_PRESENT 1 | |
| imperative.negative | IMP_NEGATIVE 1 | |
| infinitive.present / past | INF_PRESENT 1 / INF_PERFECT 1 | |
| gerund.present / past | GERUND 1 / GERUND_PERFECT 1 | |
| participle.past | PART_PAST 1 | |

## 11. Open questions and risks

| # | Question or risk | Proposed handling |
|---|---|---|
| 1 | Every [S] fact rests on a search snippet because rae.es/dle.rae.es refuse automated fetching. | Open each URL of §1.4 in Chrome during Tasks 2–5; a page that contradicts this document changes the rule and the ledger, never the other way round. |
| 2 | soler: the DPD wording on solí, soliendo and solido was not seen; the compound tenses are "muy raros". | §5.6 generates them; if the DPD page restricts them, move those tenses to `es.avail.defective` and drop the matching ledger rows (the oracle then needs no soler correction). |
| 3 | American variants: podrí/podriré (DPD pudrir), erro (DPD errar), iros. | podrir and errar: general forms only for now; a later `region` variant (`variant.region`) can add them without touching the stem rules. iros is generated (pattern `iros`) only if the RAE note confirms it; otherwise drop it from the Task 4 test. |
| 4 | Variant lists not seen in an authority: raer (raigo/rao; raiga/raya), roer (roo/roigo/royo), yacer (yazco/yazgo/yago; yace/yaz), satisfacer (satisfaz/satisface), ir 1pl (vamos/vayamos), the -iar "both" list. | Verify on the DLE tables; any variant not listed there is removed from the lexicon (and from §8/§9 expectations). |
| 5 | Pro-drop: forms render with the subject pronoun. | The trainer must compare typed answers with `renderParts(…, { bare: true })` as well, or Spanish learners will be marked wrong for "amo". |
| 6 | The usted/ustedes commands need the formal slots selected in an unfiltered query, while the other tenses must not show them: `subjectsFor` adds them, `acceptsTarget` removes them outside the imperative (§2.2). | Works with the landed contract (`CatalogueEntry.slots` handles the rest); if the core later lets an entry mark slots as default for that entry only, drop both hooks. |
| 7 | Learners typing pre-2010 spellings (guió, rió, huí, guiáis). | The engine emits only current spelling (as German emits only post-1996 spelling); the trainer may keep a list of superseded spellings to answer "correct, but the 2010 Ortografía drops this tilde". |
| 8 | llover/nevar in figurative plural use (llueven críticas, NGLE §4.14). | Out of scope; the impersonal paradigm only. |
| 9 | `es.orth.monosyllable` records a step on an unchanged juncture. | `applyJunctureRules` keeps a rule's own steps even when the text does not change (`src/core/juncture.ts`); a test pins it (Task 3). |
| 10 | Shared CLI flags (`classHint`, `gender`, `stems`) show the first registered pack's values in `--help`. | Cosmetic, outside this pack; note in the task report. |
| 11 | Plan 2 Task 6 leaves the remap `target` type open. | This design writes `{ mood, tense }`; adjust to whatever Task 6 fixed. |
| 12 | Compound tenses of rare verbs (hube solido) and the pretérito anterior are rare; the equivalence map marks the past anterior literary, the forms are not tagged. | Revisit if the trainer needs to hide rare forms. |
