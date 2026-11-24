# French (fr): grammar design for the rule-first rebuild

French already works through a legacy implementation: 113 suffix-selected ending tables (`src/languages/fr/models.ts`), stem hints mapped onto cells (`principal.ts`) and a hand-written composer (`index.ts`). This document designs the replacement: a `StagedGrammar` in which a verb family stores principal parts, tenses come from formation rules, spelling changes are recorded rules, and only truly suppletive cells are listed words. Everything below is measured against the legacy output, which is frozen in `packages/conjugation-engine/tests/characterization/fr.{queries.json,tsv.gz}` (1,003 queries, 153,980 lines).

Status marks: **[V]** I or a verification agent opened the page and it states the rule; **[S]** seen only in a search snippet or secondary source; **[U]** stated from memory, to be verified where indicated. **[M]** = measured by a read-only script against the built `dist/` of the legacy engine (scripts kept out of the repo; method in §5.2).

Decisions taken before this design and not reopened: French becomes a `StagedGrammar`; families keep today's selection mechanics; no regressions except sourced ledger entries for whitelist boundaries; sources move away from Le Conjugueur; principal parts are bootstrapped by a one-off script and checked against the Académie; subject gender is part of the target; option names, `analysis.classification`, `model`, variant labels, order, `usage`, `condition` and assumption sentences are frozen by the snapshot.

---

## 1. Sources

| Role | Title | URL | Status |
|---|---|---|---|
| Primary, rules (print) | Grevisse & Goosse, *Le Bon Usage*, 16e éd., De Boeck 2016 | print (online edition lebonusage.com needs a login) | [U] for every § number except those below |
| Primary, participle agreement (print, § via secondary) | *Le Bon Usage*, §§ 904 ff. (with être / no auxiliary), 907 ff. (with avoir), 916 ff. (pronominal verbs); edition not stated by the citing source | cited in fr.wikipedia.org/wiki/Accord_du_participe_passé_en_français | [S] |
| Primary, orthography | *Les rectifications de l'orthographe*, Journal officiel, Documents administratifs n° 100, 6 décembre 1990 (facsimile) | https://academie-francaise.fr/sites/academie-francaise.fr/files/rectifications.pdf | [V] |
| Primary, orthography (Académie annex, numbering §1–§8, differs from the JO's II.1–II.7) | Académie française, *Rectifications de l'orthographe* | https://www.dictionnaire-academie.fr/annexes/rectifications-orthographe.html | [V] |
| Lexical authority | Dictionnaire de l'Académie française, 9e éd.: entry `…/article/A9xNNNN`, full conjugation table `…/conjuguer/A9xNNNN` | https://www.dictionnaire-academie.fr/ | [V] (loads by automated fetch) |
| Lexical cross-check | CNRTL / TLFi | https://www.cnrtl.fr/definition/<lemme> | [V] |
| Linkable rule pages | OQLF, Banque de dépannage linguistique (Vitrine linguistique; old bdl.oqlf.gouv.qc.ca URLs are retired, the numeric id is stable) | https://vitrinelinguistique.oqlf.gouv.qc.ca/<id>/… | [V] |
| Secondary only (kept where already used) | Le Conjugueur (same site as the scraped oracle) | https://leconjugueur.lefigaro.fr/ | not used for any rule |

Verified pages and what they state (short French quotes):

| Key | URL (OQLF = vitrinelinguistique.oqlf.gouv.qc.ca, ACAD = www.dictionnaire-academie.fr) | States | Status |
|---|---|---|---|
| OQLF-24212 | OQLF/24212 (verbes du 1er groupe au présent) | « cédille au c pour conserver le son [s] devant o »; « aux verbes en -ger … un e après le g »; -guer keeps u; « ce e devient un è devant une syllabe contenant un e muet »; é → è « dans la dernière syllabe prononcée »; -oyer/-uyer y → i before mute e, -ayer « on peut maintenir le y ou le changer en i », -eyer keep y | [V] |
| OQLF-24655 | OQLF/24655 (formes du futur simple) | « il cèdera »; « ils payeront (ou : ils paieront) »; « se lèvera » | [V] |
| OQLF-23169 | OQLF/23169 (rectifications -eler/-eter) | 1990: « accent grave et une consonne simple devant une syllabe contenant un e instable »; « appeler, jeter et leurs dérivés (y compris interpeler) … conservent leur conjugaison traditionnelle »; both spellings correct | [V] |
| OQLF-23165 | OQLF/23165 (accent aigu → grave) | « verbes du type céder … accent grave au futur et au conditionnel » | [V] |
| OQLF-23166 | OQLF/index.php?id=23166 (circonflexe, rectifications) | « disparait sur les lettres i et u … sauf … fonction distinctive ou dans les terminaisons verbales »; exceptions dû, mûr, sûr, jeûne, « les formes de croitre qui … se confondraient avec celles de croire »; « il connait, il parait, il plait » | [V] |
| OQLF-23701 | OQLF/23701 (circonflexe dans les formes verbales) | traditional: il clôt, il gît, il plaît; crû, dû, mû; tu croîs; endings âmes, ât… | [V] |
| OQLF-24237 | OQLF/24237 (formes du subjonctif) | -asse … -ât …; -isse … -ît … | [V] |
| OQLF-24222 / 24221 / 22942 / 22940 | participe passé avec être; avec avoir; occasionnellement pronominaux; essentiellement pronominaux | « s'accorde avec le sujet »; « avec le complément direct si celui-ci est placé avant le verbe »; « elle s'est lavée » / « elle s'est lavé les mains », « elles se sont parlé »; essentially pronominal verbs agree with the subject | [V] |
| OQLF-24206 / 24203 | pronoms avec l'impératif; impératif | « trait d'union entre le verbe et les pronoms »; « Lève-toi », « vas-y » | [V] |
| OQLF-21737 / 21745 | élision obligatoire; élision interdite | élision de je, me, te, se, que, de « devant voyelle ou h muet »; « pas d'élision devant le h dit aspiré » | [V] |
| OQLF-23838 | emplois du verbe asseoir | « je m'assieds ou je m'assois »; « asseoir et assoir sont aujourd'hui admises » | [V] |
| OQLF-26577171 | fiche GDT « verbe défectif » | falloir, pleuvoir, ouïr as examples | [V] |
| JO-1990 II.3a | rectifications.pdf, II rule 3a | « sur le modèle de semer les futurs et conditionnels des verbes du type céder : je cèderai » | [V] |
| JO-1990 II.4 | rule 4 | circumflex on i/u « n'est plus obligatoire » except conjugation endings and « dû, jeûne, … mûr et sûr, et le verbe croître »; « On écrit désormais mu …, plait »; rule 4a names « conditionnel passé deuxième forme » as the plus-que-parfait du subjonctif | [V] |
| JO-1990 II.5 | rule 5 | « sur le modèle de peler et d'acheter … exception que pour appeler (et rappeler) et jeter (et les verbes de sa famille) » | [V] |
| JO-1990 III.10 | Liste H, Anomalies | « assoir, rassoir, sursoir (au lieu de asseoir, etc.) »; note: « j'assois … j'assoirai (mais je surseoirai) » | [V] |
| JO-1990 III.13 | Anomalies | « interpeler (au lieu de interpeller) » | [V] |
| ACAD céder A9C1222 | entry + /conjuguer | « je céderai◇ ou je cèderai » (1990 note) | [V] |
| ACAD acheter A9A0377 / appeler A9A2203 / payer A9P1095 | entries | j'achète, j'achèterai; j'appelle, j'appellerai; payer « comme Balayer », « paie ou paye », « paierai ou payerai » | [V] |
| ACAD asseoir A9A2823 | entry | both series in full; « asseoir ou assoir » (annex §7) | [V] |
| ACAD faillir A9F0105 / choir A9C2105 / gésir A9G0655 / clore A9C2658 | entries | faillir défectif, « je faux, je faudrai … désuètes », table like finir with « faillis ou faux »; choir « je chois ; je chus ; je choirai ou (vieilli) je cherrai … qu'il chût ; chu »; gésir « il gît◇ » (git allowed); clore « Je clos, tu clos, il clôt » (no 1990 mark) | [V] |
| ACAD croître A9C5057 / absoudre A9A0175 / résoudre A9R2080 | entries | « je croîs … je crûs ; je croîtrai … crû, crue » (no 1990 mark); absoudre « pas de passé simple … absous◇, absoute » (absout allowed); résoudre « résolu … plus rarement, résous◇ » | [V] |
| CNRTL faillir / choir | TLFi | faillir: rare outside infinitive, passé simple, future, compounds (cites Grevisse 1969 § 701); choir: « je, tu chois, il choit », « cherra et choira », « chu, fém. chue » | [V] |

Per rule area:

| Area | Rests on |
|---|---|
| Groups, endings, formation of tenses from stems | *Le Bon Usage* (conjugation chapter, § [U]); OQLF-24212, OQLF-24655, OQLF-24237 [V]; Académie tables `/conjuguer/` for every family [V] |
| ç, ge, è (mute e), è (closed é), y → i | OQLF-24212, OQLF-24655 [V]; JO-1990 II.3a for the future/conditional of céder [V] |
| -eler/-eter | JO-1990 II.5, OQLF-23169, ACAD acheter/appeler [V] |
| Circumflex (1990), î before t (traditional), croître | JO-1990 II.4, OQLF-23166, OQLF-23701, ACAD croître/gésir [V] |
| assoir, interpeler, absout | JO-1990 III.10, III.13, ACAD asseoir/absoudre [V] |
| Past-participle agreement | OQLF-24222, 24221, 22942, 22940 [V]; *Le Bon Usage* §§ 904 ff., 907 ff., 916 ff. [S] |
| Auxiliary choice (être list, dual verbs) | *Le Bon Usage* (§ [U]); Académie entries per verb [V when opened at implementation]; the lists are legacy data and are not changed |
| Elision, imperative hyphen | OQLF-21737, 21745, 24206, 24203 [V] |
| Defective verbs | Académie entries [V for faillir, choir, gésir, clore]; CNRTL; OQLF-26577171 [V] |
| Conditionnel passé 2e forme | JO-1990 II.4a (names it) [V]; *Le Bon Usage* (§ [U]) |
| Near future, recent past | *Le Bon Usage* (§ [U]) — semi-auxiliaries aller / venir de; no linkable page verified, open question O7 |

---

## 2. Catalogue

Unchanged from `src/languages/fr/catalogue.ts` (the snapshot pins it):

| Mood id (label) | Tense ids (labels) | Formation | Persons |
|---|---|---|---|
| indicative (Indicatif) | present (Présent), perfect (Passé composé), imperfect (Imparfait), pluperfect (Plus-que-parfait), simple_past (Passé simple), past_anterior (Passé antérieur), future (Futur simple), future_perfect (Futur antérieur), near_future (Futur proche), recent_past (Passé récent) | simple: present, imperfect, simple_past, future; periphrastic: the rest | 1–3 sg/pl |
| subjunctive (Subjonctif) | present, past, imperfect, pluperfect | simple: present, imperfect | 1–3 sg/pl |
| conditional (Conditionnel) | present, past (two constructions: `past-first`, `past-second` literary) | simple: present | 1–3 sg/pl |
| imperative (Impératif) | present, past | simple: present | 2sg, 1pl, 2pl |
| infinitive (Infinitif) | present, past | simple: present | — |
| participle (Participe) | present, past, perfect (Passé (forme composée)) | simple: present, past | — |
| gerund (Gérondif) | present, past | simple: present (en + participle) | — |

Voices: active only (no `voices` on entries). `usage`: `literary` for simple_past, past_anterior, subjunctive imperfect/pluperfect and `past-second`; `dated` for dated paradigms (ouïr#ois, choir ×2, faillir#faux); else `standard`.

**Subject slots.** Six, all default, all without gender:

| id | person | number | pronoun | gender | default |
|---|---|---|---|---|---|
| `1sg` | 1 | singular | je | — | yes |
| `2sg` | 2 | singular | tu | — | yes |
| `3sg` | 3 | singular | il (elle when the form is feminine) | — | yes |
| `1pl` | 1 | plural | nous | — | yes |
| `2pl` | 2 | plural | vous | — | yes |
| `3pl` | 3 | plural | ils (elles when feminine) | — | yes |

The imperative entries declare `slots: ['2sg', '1pl', '2pl']` (`CatalogueEntry.slots`), as the toy does. `genderedTargets: true`. The subject's gender reaches `target.gender` through a new optional clause hook, `ClauseGrammar.subjectGenders(context): Fork<Gender | null>` (§6.3), not through the slot. Why not eight slots (je, tu, il, elle, …): the snapshot has one target per person and number, so a third-person target that is unavailable prints one `U` line (1,072 such lines in the snapshot [M]); with `il` and `elle` as two slots every one of them would print twice, and an impersonal `il faut` would need its own genderless `il` slot. Six genderless slots plus a gender fork reproduce the legacy expansion exactly (see "Deviations"). `subjectsFor` is the default (`subject` option names one slot); the `gender` option filters the fork, not the slots.

**Options** (unchanged names and meaning; `src/languages/fr/options.ts`): `stems` {singular, plural, thirdPlural, future, past, pastParticiple: stem; pastVowel: a/i/u/in}, `gender` (masculine/feminine), `auxiliary` (avoir/être), `classHint` (er/ir/re), `reflexiveObject` (direct/indirect), `aspiratedH` (boolean), `preferredOrthography` (rectified/traditional), `agreement` ({gender?, number?}), `precedingDirectObject` ({gender, number}, required), `model` (word); cross-check: `stems.future` ends in r. New common option after the switch: `subject` (one of the six ids).

**Left out:** passive voice, negation, interrogative inversion, surcomposé tenses, imperative with object pronouns other than the reflexive, `on` (not in the snapshot; a later non-default slot would not change any existing target).

---

## 3. Classification

Order of `classify(query)` (each line records the step named in brackets):

1. Strip `se ` / `s'`; reflexive if stripped or if the lemma is essentially pronominal (`méfier, souvenir, enfuir, abstenir, évanouir, repentir`) [`fr.classify.reflexive`, `fr.classify.essentially-pronominal`]. Reject anything not `^[\p{L}][\p{L}\p{M}'-]*$` (INVALID_INFINITIVE).
2. Map a 1990 infinitive to the lemma that identifies the verb: `…assoir → …asseoir`, `sursoir → surseoir`, `interpeler → interpeller`, `…aitre/…oitre → …aître/…oître` [`fr.classify.canonical-spelling`]. Same regexes as `canonicalLemma`.
3. Hint checks (same codes and conditions as today): `classHint` must fit the lemma (`ir`: ends `ir`/`ïr` and not `oir`) else INVALID_HINT; `classHint` and `model ∈ {aimer, finir, rendre}` must agree else INVALID_HINT.
4. Choose the paradigm source:
   - **Explicit class** (`classHint`, or `model` ∈ {aimer, finir, rendre}): the productive class of that group [`fr.classify.class-hint`]; source `explicitHint`.
   - **`model` naming a family**: the family, if one of its selectors (suffix or listed lemma) ends the lemma and its strip fits, else INVALID_HINT "An irregular French model must be a known suffix of the requested infinitive." [`fr.classify.model-hint`]. A productive id other than aimer/finir/rendre is accepted when it equals the label the rules compute for the lemma (§3.2), else INVALID_HINT.
   - **Otherwise** the family selector (below); if none, the productive class by ending (`-er` / `-ir`, `-ïr` not `-oir` / `-re`); if none and the `stems` hint is complete (singular, plural, future, past, pastVowel, pastParticiple), class `principal-parts` [`fr.classify.principal-parts-hint`]; else AMBIGUOUS_CLASSIFICATION (glouloir, plotoir).
5. Several paradigms → one `classify` outcome each, tag `pattern` (and `usage: dated` where the legacy paradigm is dated) [`fr.classify.paradigm`]: payer-class (`y-to-i`, `keep-y`), asseoir (`assois`, `assieds`), ouïr (`ouïs`, `ois` dated), choir (`choirai`, `cherrai`, both dated), échoir (`échoit`, `échet`), faillir (`faillis`, `faudrai`, `faille`, `faux` dated). Order = legacy paradigm order.
6. Auxiliaries [`fr.classify.aux-*`]: reflexive → [être]; dual list → [avoir, être]; être list → [être]; else [avoir] (with `fr.classify.assume-avoir` when the verb is not known: source not lexicon and not in the être/dual/known-avoir lists, not reflexive, no `auxiliary` option). `auxiliary` option narrows to that one; it is INVALID_HINT when the verb is reflexive, from the lexicon, or in the être or known-avoir list and the auxiliary is not among its auxiliaries.
7. Reflexive object [`fr.classify.indirect-reflexive`, `fr.classify.assume-direct-reflexive`]: indirect if `reflexiveObject: 'indirect'`, or unset and the lemma is in `parler, téléphoner, mentir, nuire, succéder, sourire`. `reflexiveObject: 'indirect'` on an essentially pronominal verb → INVALID_HINT. `precedingDirectObject` on an invariable-participle verb → INVALID_HINT.
8. Initial h [`fr.classify.aspirated-h`, `fr.classify.assume-mute-h`]: aspirated if `aspiratedH` option, else if listed (`haïr, hacher, haleter, hanter, harceler, hâter, hisser, huer, hurler`).

**Family selector (unchanged mechanics).** A lemma listed in an entry's `lemmas` selects it; otherwise the entry with the longest suffix that ends the lemma, skipping entries whose `except` lists the lemma or whose `exceptEndings` end it. Productive classes take part in the same search through their spelling-subclass selectors only for the *label* (§3.2); their forms come from rules.

**Classification source** (`analysis.classificationSource`): `explicitHint` when a non-empty `stems` hint, a `classHint` or a `model` was given; else `lexicon` when the chosen entry is a family or the selector equals the lemma (appeler, jeter, celer, peler…); else `regularRule`.

**Assumptions** (`analysis.assumptions`, English messages must equal today's strings exactly; they are in the snapshot's `A` lines):

| Rule id (kind assumption) | When | English text (exact) |
|---|---|---|
| `fr.classify.assume-regular` | source of the class choice is `regularRule` (also when hints then make the analysis `explicitHint`) | `{lemma} uses the regular {group} model; lexical meaning and nonproductive classes cannot be inferred from spelling.` |
| `fr.classify.family-suffix` | family chosen by a suffix that is not the whole lemma | `{lemma} is inflected like {family} from its -{suffix} ending.` |
| `fr.classify.assume-avoir` | see step 6 | `An unlisted non-reflexive verb defaults to avoir.` |
| `fr.classify.assume-direct-reflexive` | reflexive, no `reflexiveObject`, not essential, not in the indirect list | `The reflexive pronoun is assumed direct; specify indirect-object context when needed.` |
| `fr.classify.assume-mute-h` | lemma starts with h, no `aspiratedH` option, not listed | `An unlisted initial h is assumed mute.` |

Order of assumptions = this table's order. Hints that override them: `classHint`, `model`, `stems`, `auxiliary`, `reflexiveObject`, `aspiratedH`.

**Inheritance by prefixed derivatives** works only through suffix selectors, exactly as today: a derivative inherits a family when the family lists a suffix that ends it (`-venir` covers devenir, circonvenir; `-crire` covers inscrire); exclusions are the `except` lists (partir: impartir, répartir, assortir, désassortir, rassortir, réassortir; servir: asservir) and `exceptEndings` (-ir excludes -oir). There is no prefix stripping and no minimum base length beyond the suffix itself.

### 3.1 Productive classes

| Group | Detection | Stem S | Ending set | Label (`classification`) |
|---|---|---|---|---|
| er | ends `er` | lemma − `er` | ER (§4.3) | computed, §3.2 |
| ir | ends `ir` or `ïr`, not `oir` | lemma − `ir`/`ïr` | IR | `finir`, or `ïr` when the infinitive has ï |
| re | ends `re` | lemma − `re` | RE | `rendre` when S ends in d or t, else `rompre` |

### 3.2 The label of a productive verb is computed from the rules that apply

| Condition on S (first match wins) | Label |
|---|---|
| S ends `el`/`et` and the -eler/-eter list class is DOUBLE | `appeler` (el) / `jeter` (et) |
| … list class is FORK | `renouveler` (el) / `feuilleter` (et) |
| mute-e trigger (`fr.orth.mute-e-grave`, §4.4) | `dépecer` if S ends in c, else `lever` |
| closed-é trigger | `rapiécer` (c), `protéger` (g), else `céder` |
| S ends in c | `placer` |
| S ends in g | `manger` |
| S ends in `ay` | `payer` |
| S ends in `oy`/`uy` | `nettoyer` |
| S ends in `ey`/`éy` | `grasseyer` |
| otherwise | `aimer` |

[M] Over all 158 productive lemmas of the snapshot and 41 extra probes this reproduces the legacy model id for every lemma except the three whitelist probes `bleder`, `crebler`, `pequer` (legacy `aimer`, now `lever`).

---

## 4. Rule inventory

Notation: S = stem at the juncture, E = ending; V = `[aeiouyàâäéèêëîïôöùûüœæ]`; ONSET = `bl|br|ch|cl|cr|dr|fl|fr|gl|gn|gr|gu|ph|pl|pr|qu|th|tr|vr|[bcdfgjklmnprstvz]` (one consonant sound, or a consonant + l/r cluster that opens the next syllable — the legacy `closedE` list plus c and g); MUTE(E) ⇔ E ∈ {e, es, ent} or (E starts with `er` and |E| > 2). Citations use the keys of §1. Every rule has an English statement here; Dutch messages are written by the implementer (terms: *stam*, *uitgang*, *werkwoordgroep* — use *eerste/tweede/derde groep* as French school grammar does; *voltooid deelwoord*; *stomme e*; *cedille*; *trema*; *accent grave / circonflexe*; *hulpwerkwoord*).

### 4.1 Classify

| Rule id | Kind | Statement | Trigger | Params | Citation | Example |
|---|---|---|---|---|---|---|
| fr.classify.reflexive | rule | se/s' marks a pronominal verb, conjugated with a reflexive pronoun | prefix | — | OQLF-22942 | se laver → laver, pronominal |
| fr.classify.essentially-pronominal | lexical | this verb exists only as a pronominal verb | essential list | — | OQLF-22940 | méfier → se méfier |
| fr.classify.canonical-spelling | rule | the 1990 spelling of the infinitive names the same verb | step 2 regexes | — | JO-1990 III.10, III.13, II.4 | assoir → asseoir |
| fr.classify.lexicon | lexical | the verb is listed; it follows family {family} | listed lemma or selector = lemma | family | ACAD (entry of the verb) | venir → venir |
| fr.classify.family-suffix | assumption | see §3 | suffix selector | lemma, family, suffix | ACAD (entry of the family head) | conduire → cuire, -uire |
| fr.classify.group | rule | an infinitive in -er/-ir/-re belongs to group {group} | §3.1 | group | Le Bon Usage [U]; OQLF-24212 | parler → er |
| fr.classify.assume-regular | assumption | see §3 | unlisted productive | lemma, group | Le Bon Usage [U] | blouper |
| fr.classify.spelling-model | rule | its spelling makes it follow model {model} | §3.2 | model | OQLF-24212 | placer → placer |
| fr.classify.class-hint | rule | the class given by the hint is used | classHint / model aimer, finir, rendre | group | — (hint) | ressortir + ir |
| fr.classify.model-hint | rule | the family given by the hint is used | model | model | — (hint) | atteindre + peindre |
| fr.classify.principal-parts-hint | rule | the given principal parts define the verb | complete stems | — | — (hint) | — |
| fr.classify.paradigm | lexical | this verb has several accepted conjugations; this is {pattern} | multi-paradigm family | pattern | ACAD asseoir, payer, faillir, choir | payer → y-to-i |
| fr.classify.aux-etre | lexical | listed with être | être list | — | Le Bon Usage [U]; ACAD | aller |
| fr.classify.aux-dual | lexical | takes avoir or être by construction or sense | dual list | — | Le Bon Usage [U]; ACAD | monter |
| fr.classify.aux-avoir | lexical | takes avoir | known-avoir list or lexicon | — | Le Bon Usage [U] | aimer |
| fr.classify.aux-pronominal | rule | a pronominal verb takes être | reflexive | — | OQLF-22942 | se laver |
| fr.classify.aux-hint | rule | the auxiliary given by the hint is used | auxiliary option | auxiliary | — | descendre + avoir |
| fr.classify.assume-avoir | assumption | see §3 | step 6 | — | Le Bon Usage [U] | blouper |
| fr.classify.indirect-reflexive | lexical / rule | the reflexive pronoun is an indirect object | list or option | — | OQLF-22942 | se parler |
| fr.classify.assume-direct-reflexive | assumption | see §3 | step 7 | — | OQLF-22942 | s'asseoir |
| fr.classify.aspirated-h | lexical | initial h is aspirated: no elision | list or option | — | OQLF-21745 | haïr |
| fr.classify.assume-mute-h | assumption | see §3 | step 8 | — | OQLF-21737 | hérouper → j'héroupe |

### 4.2 Stem (formation from principal parts)

A paradigm has principal parts relative to the stripped infinitive (prefix = lemma minus the entry's `strip` letters): **P1** present-singular stem with its ending set (`e`: e/es/e, `s`: s/s/t, `x`: x/x/t), **P2** nous stem, **P3** ils stem (default P2), **F** future stem (ends in r), **PS** past stem with theme vowel (a, i, u, in, ï), **PP** past participle (optional **PPF** feminine base), optional **SJ1** (subjunctive sg + 3pl, default P3) and **SJ2** (subjunctive 1pl/2pl, default P2), flags `imperativeFromSubjunctive`, `presentParticipleFromSubjunctive`. Any part may hold several values (a fork, in listed order). For a productive class the parts are implicit: P1=P2=P3=S, F = S + class future marker, PS = S, PP = S + é/i/u, and the class ending set already contains the class vowel (fin-**iss**-ons); §4.3.

| Rule id | Kind | Principal part → cells it feeds | Example |
|---|---|---|---|
| fr.stem.group-stem | rule | productive: S = infinitive minus -er/-ir/-re → every simple cell | aimer → aim- |
| fr.stem.present-singular | lexical | P1 → present 1–3sg; imperative 2sg via the present 2sg | venir: vien- → viens, vient |
| fr.stem.nous | lexical | P2 → present 1pl/2pl, imparfait, participe présent, subjunctive 1pl/2pl, imperative 1pl/2pl | venir: ven- → venons, venais, venant |
| fr.stem.ils | lexical | P3 → present 3pl; subjunctive sg + 3pl when there is no SJ1 | venir: vienn- → viennent, vienne |
| fr.stem.future | lexical / rule | F → future, conditional; productive: the infinitive (re: minus final e) | venir: viendr-; rendre: rendr- |
| fr.stem.past | lexical | PS + theme → passé simple, subjunctive imperfect | venir: v- + in → vins, vinsse |
| fr.stem.participle | lexical | PP → past participle (all four forms), every compound tense | venir: venu |
| fr.stem.subjunctive | lexical | SJ1/SJ2 → subjunctive present | faire: fass- |
| fr.stem.imperative-from-subjunctive | lexical | être, avoir, savoir, vouloir#2: imperative = subjunctive (2sg drops -s after e; 1pl/2pl = SJ2 + ons/ez) | savoir: sache, sachons, sachez |
| fr.stem.participle-from-subjunctive | lexical | avoir, savoir: participe présent = SJ2 + ant | ayant, sachant |
| fr.stem.hint | rule | a `stems` hint replaces principal part {part} | blouper + future bloupr |
| fr.stem.suppletive | lexical | a listed whole word for this cell (§5.3) | être: es |
| fr.stem.listed-spelling | lexical | a listed spelling variant with no rule behind it (open questions O1, O2) | clore: clot (rectified) |

### 4.3 Ending

Formation endings (families, hints):

| Rule id | Cells | Endings |
|---|---|---|
| fr.end.present-singular | present 1–3sg on P1 | set e: e es e · set s: s s t · set x: x x t |
| fr.end.present-plural | present 1pl/2pl on P2, 3pl on P3 | ons ez · ent |
| fr.end.imperfect | imparfait on P2; conditional on F | ais ais ait ions iez aient |
| fr.end.future | future on F | ai as a ons ez ont |
| fr.end.simple-past | passé simple on PS, by theme | a: ai as a âmes âtes èrent · i: is is it îmes îtes irent · u: us us ut ûmes ûtes urent · in: ins ins int înmes întes inrent · ï: ïs ïs ït ïmes ïtes ïrent |
| fr.end.subjunctive | subjunctive present on SJ1 (sg, 3pl) and SJ2 (1pl/2pl) | e es e · ions iez · ent |
| fr.end.subjunctive-imperfect | on PS, by theme | a: asse asses ât assions assiez assent · i: isse isses ît issions issiez issent · u: usse usses ût ussions ussiez ussent · in: insse insses înt inssions inssiez inssent · ï: ïsse ïsses ït ïssions ïssiez ïssent |
| fr.end.imperative | 2sg = present 2sg, final s dropped after e or a (aime, cueille, va); 1pl/2pl = present 1pl/2pl (so dites, faites follow the present) | — |
| fr.end.present-participle | on P2 | ant |
| fr.end.past-participle | on PP | m.sg ∅ · f.sg e · m.pl s (∅ after s, x) · f.pl es; final û → u outside m.sg (dû, due, dus); PPF replaces PP in the feminine (absoute) |
| fr.end.infinitive | the lemma | — |

Productive ending sets (generated in Task 1 from the legacy `aimer`, `finir`, `rompre` tables with their spelling marks removed; rows: present, imparfait, passé simple, futur, subj. présent, subj. imparfait, conditionnel, then imp. 2sg 1pl 2pl, ppres, pp m.sg f.sg m.pl f.pl, infinitive):

| Row | ER | IR | RE |
|---|---|---|---|
| présent | e es e ons ez ent | is is it issons issez issent | s s t ons ez ent |
| imparfait | ais ais ait ions iez aient | issais issais issait issions issiez issaient | ais ais ait ions iez aient |
| passé simple | ai as a âmes âtes èrent | is is it îmes îtes irent | is is it îmes îtes irent |
| futur | erai eras era erons erez eront | irai iras ira irons irez iront | rai ras ra rons rez ront |
| subj. présent | e es e ions iez ent | isse isses isse issions issiez issent | e es e ions iez ent |
| subj. imparfait | asse asses ât assions assiez assent | isse isses ît issions issiez issent | isse isses ît issions issiez issent |
| conditionnel | erais erais erait erions eriez eraient | irais irais irait irions iriez iraient | rais rais rait rions riez raient |
| impératif, ppres, pp, inf | e ons ez · ant · é ée és ées · er | is issons issez · issant · i ie is ies · ir | s ons ez · ant · u ue us ues · re |

The ER future/conditional keep the infinitive's `er` inside the ending (lev + erai), so the four -er spelling rules share one trigger, MUTE(E). A `future` hint replaces this by F + ai (blouprai), as today.

### 4.4 Orthography (juncture rules, in this order)

| # | Rule id | Statement | Exact trigger | Fork / tags | Citation | Example |
|---|---|---|---|---|---|---|
| 1 | fr.orth.eler-eter | -eler/-eter verbs double l/t before a mute syllable | group er; S ends `el`/`et`; MUTE(E); list class by listed lemma then longest suffix: DOUBLE {suffixes appeler, jeter} → double in both spellings; FORK {suffixes eler, eter, cacheter, tacheter} → traditional doubles, rectified leaves S for rule 2; GRAVE {suffixes geler, ciseler, marteler, modeler, harceler, écarteler, démanteler, encasteler, acheter, bégueter, corseter, crocheter, fileter, fureter, haleter; lemmas celer, déceler, receler, peler} → nothing (rule 2 writes è) | FORK: orthography traditional / rectified | JO-1990 II.5; OQLF-23169; ACAD appeler, acheter | appel+e → appelle; renouvel+e → renouvelle (t) / renouvèle (r) |
| 2 | fr.orth.mute-e-grave | the mute e of the last stem syllable becomes è before a mute syllable | group er; S matches `(^|[^V]|[gq]u)e(ONSET)$`; MUTE(E) | — | OQLF-24212; OQLF-24655 | lev+e → lève; achet+erai → achèterai; dépec+e → dépèce |
| 3 | fr.orth.closed-e-grave | é of the last stem syllable becomes è before a mute syllable; in the future and conditional only in 1990 spelling | group er; S matches `é(ONSET)$`; MUTE(E) | E starts `er`: traditional é / rectified è | OQLF-24212; JO-1990 II.3a; ACAD céder | céd+e → cède; céd+erai → céderai (t) / cèderai (r) |
| 4 | fr.orth.c-cedilla | c becomes ç before a, o, u to keep /s/ | S ends c; E starts `[aoâôuû]` | — | OQLF-24212 | plac+ons → plaçons |
| 5 | fr.orth.g-e | g takes e before a, o to keep /ʒ/ | S ends g; E starts `[aoâô]` | — | OQLF-24212 | mang+ons → mangeons |
| 6 | fr.orth.y-to-i | y becomes i before a mute syllable | group er; S ends y; MUTE(E); `oy`/`uy`: always; `ay`: only in the `y-to-i` paradigm; `ey`/`éy`: never | (payer's choice is a paradigm, §3 step 5) | OQLF-24212; OQLF-24655; ACAD payer | nettoy+e → nettoie; pay+e → paie (y-to-i) |
| 7 | fr.orth.diaeresis | in a verb spelt with ï, an ending's i is written ï (î too) | infinitive contains ï; E starts `[iî]` | — | Le Bon Usage [U]; ACAD haïr (to verify) | blou+is → blouïs; ha+ît → haït |
| 8 | fr.orth.t-after-dental | the 3sg t is not written after d, t or c | E = t in present 3sg (s set / RE); S ends `[dtc]` | — | Le Bon Usage [U]; ACAD rendre, vaincre (to verify) | rend+t → rend; vainc+t → vainc |
| 9 | fr.orth.tt-singular | -ttre verbs keep one t in the singular present and imperative | group re; S ends `tt`; cells present 1–3sg, imperative 2sg | — | Le Bon Usage [U]; ACAD battre, mettre (they show bats, mets) | blett+s → blets (new; intended diff) |
| 10 | fr.orth.circumflex-before-t | in traditional spelling, i before t takes a circumflex in -aître/-oître verbs, plaire and gésir; not in 1990 spelling | lexeme flag `circumflexBeforeT`; S ends i; E starts t | traditional î / rectified i | OQLF-23701; JO-1990 II.4 (« plait »); ACAD gésir | connai+t → connaît (t) / connait (r) |
| 11 | fr.orth.croitre-homograph | croître keeps or takes a circumflex where it would be spelt like croire | lexeme croître; cells present sg, imperative 2sg (î, stored in P1), passé simple and subj. imperfect (u of the ending → û), PP m.sg (stored crû) | both spellings | JO-1990 II.4; OQLF-23166; ACAD croître | cr+us → crûs |
| 12 | fr.orth.1990-circumflex | 1990 spelling drops the circumflex on i and u of the stem; endings keep theirs | S contains î or û; not protected (croître forms of rule 11; dû; jeûne(s)) | traditional unchanged / rectified without | JO-1990 II.4; OQLF-23166 | traîn+e → traine (r); connaîtr+ai → connaitrai (r); mû → mu (r) |
| 13 | fr.orth.1990-assoir | 1990 spelling writes assoir, sursoir (e of -eoi- dropped) | lexemes asseoir, surseoir; S contains `seoi` | traditional / rectified | JO-1990 III.10; ACAD asseoir; OQLF-23838 | asseoir+ai → assoirai (r) |
| 14 | fr.orth.1990-interpeler | 1990 spelling writes interpeler, conjugated like appeler (ll only before a mute syllable) | lexeme interpeller; rectified branch; S ends `ll`; not MUTE(E) → `l` | traditional / rectified | JO-1990 III.13; OQLF-23169 | interpell+ons → interpelons (r) |
| 15 | fr.orth.1990-absout | 1990 spelling writes absout, dissout like the feminine | lexeme of the -soudre family; PP m.sg/m.pl | traditional absous / rectified absout, absouts | ACAD absoudre (◇) | absous → absout (r) |

A form is born `orthography: 'both'`; only rules 1, 3, 10, 12–15 (and `fr.stem.listed-spelling`) tag `traditional`/`rectified`. Rules 1–6 and 14 fire only on the er group or the named lexemes, so family stems that contain c, g, e or y (recevoir, croire, …) are never respelt: families store their parts in traditional spelling, ç included (P1 `reçoi`).

[M] The three ending sets plus rules 1–8 reproduce all 51 cells × 2 spellings of all 19 productive models for every productive lemma in the snapshot (158) and 41 further probes (real: traîner, goûter, interviewer, speeder, annexer, vexer, ficeler, épeler, étiqueter, becqueter, crocheter, racheter, cacheter, harceler, déceler, peler, sevrer, célébrer, régner, sécher, abréger, créer, agréer, essuyer, ennuyer, appuyer, balayer, bégayer, faseyer, employer, reléguer…). The only cells that differ are the whitelist boundaries: `bleder`, `crebler`, `pequer` (21 cells each: present 1–3sg + 3pl, future ×6, subj. sg + 3pl, conditional ×6, imperative 2sg; legacy e, rules è) and, with rule 9, `blettre` (4 cells). Two predicates were found by measurement: the e must follow a consonant letter or `gu`/`qu` (bégueter, speeder) and the infinitive's `er` is not a mute ending.

### 4.5 Periphrasis

| Rule id | Chain (VerbRef · form) | Reports | Example |
|---|---|---|---|
| fr.periphrasis.perfect | perfectAuxiliary ind.present · main pastParticiple (agree) | aux | j'ai aimé |
| fr.periphrasis.pluperfect | perfectAuxiliary ind.imperfect · main pp (agree) | aux | j'étais allé |
| fr.periphrasis.past-anterior | perfectAuxiliary ind.simple_past · main pp (agree) | aux | j'eus aimé |
| fr.periphrasis.future-perfect | perfectAuxiliary ind.future · main pp (agree) | aux | j'aurai aimé |
| fr.periphrasis.subjunctive-past | perfectAuxiliary subj.present · main pp (agree) | aux | que j'aie aimé |
| fr.periphrasis.subjunctive-pluperfect | perfectAuxiliary subj.imperfect · main pp (agree) | aux | que j'eusse aimé |
| fr.periphrasis.conditional-past (pattern `past-first`) | perfectAuxiliary cond.present · main pp (agree) | aux | j'aurais aimé |
| fr.periphrasis.conditional-past-second (pattern `past-second`, usage literary) | perfectAuxiliary subj.imperfect · main pp (agree) | aux | j'eusse aimé |
| fr.periphrasis.imperative-past | perfectAuxiliary imp.present · main pp (agree) | aux | aie aimé |
| fr.periphrasis.infinitive-past | perfectAuxiliary infinitive · main pp (agree) | aux | avoir aimé |
| fr.periphrasis.participle-perfect | perfectAuxiliary presentParticiple · main pp (agree) | aux | ayant aimé |
| fr.periphrasis.gerund-past | word `en` (moodMarker) · perfectAuxiliary presentParticiple · main pp (agree) | aux | en ayant aimé |
| fr.periphrasis.near-future | {aller} ind.present · main infinitive | aller | je vais aimer |
| fr.periphrasis.recent-past | {venir} ind.present · word `de` (linker) · main infinitive | venir | je viens d'aimer |

Citations: Le Bon Usage [U] for the compound tenses; JO-1990 II.4a [V] names the second conditional; near future / recent past O7. Where `usage: literary` comes from: the `ending` hook tags every passé simple and subjunctive imperfect word `usage: 'literary'`; a compound form inherits it from its auxiliary word (j'eus aimé, que j'eusse aimé, j'eusse aimé), and `past-second` also declares it. A dated paradigm's `usage: 'dated'` (classify tag) wins over literary, as `mergeTags` and the legacy code both do. Periphrases carry no `applies`: every French verb uses every recipe (availability removes the ones a defective verb lacks).

### 4.6 Clause

| Rule id | Statement | Trigger | Params | Citation |
|---|---|---|---|---|
| fr.clause.subject | the subject pronoun precedes the verb | finite, not imperative | pronoun | Le Bon Usage [U] |
| fr.clause.subject-gender | a third-person subject is il/ils or elle/elles; a participle that agrees with the subject shows its gender | subjectGenders fork (§6.3) | gender (term) | OQLF-24222 |
| fr.clause.impersonal-subject | an impersonal verb has only the neuter il | lexeme impersonal (falloir; pleuvoir sg) | — | OQLF-26577171; ACAD falloir (to open) |
| fr.clause.que | the subjunctive is cited after que | mood subjunctive | — | Le Bon Usage [U] |
| fr.clause.gerund-en | the gerund is en + participe présent | mood gerund | — | Le Bon Usage [U] |
| fr.clause.reflexive-pronoun | a pronominal verb takes me/te/se/nous/vous/se before the verb (before the auxiliary in compound tenses, before the infinitive in near future/recent past) | reflexive | pronoun | OQLF-22942 |
| fr.clause.reflexive-imperative | in the affirmative imperative the pronoun follows with a hyphen; te becomes toi | reflexive, imperative present | pronoun | OQLF-24206, 24203 |
| fr.clause.agree-subject | with être the participle agrees with the subject | aux être, not invariable, not indirect reflexive, no preceding object | — | OQLF-24222 |
| fr.clause.agree-object | with avoir (and a pronominal verb) the participle agrees with a preceding direct object | precedingDirectObject | — | OQLF-24221, 22942 |
| fr.clause.no-agreement-avoir | with avoir and no preceding direct object the participle does not agree | aux avoir | — | OQLF-24221 |
| fr.clause.no-agreement-indirect | the reflexive pronoun is an indirect object: no agreement | indirect reflexive | — | OQLF-22942 |
| fr.clause.invariable-participle | this participle never agrees (été, dormi, plu, fallu, ri…) | flag | — | ACAD per verb; corpus corrections already cite CNRTL |
| fr.clause.participle-forms | the past participle on its own is given in its four forms | participle/past | — | OQLF-24222 |
| fr.clause.elision | je, me, te, se, que, de lose their e before a vowel or mute h (recorded from a dry run of `sandhi`; rendering stays render-time) | sandhi dry run | word | OQLF-21737, 21745 |

### 4.7 Availability (kind unavailable)

| Rule id | Reason | Trigger | Example |
|---|---|---|---|
| fr.avail.defective | defective | the feeding principal part is absent or the cell is in the entry's `gaps`; for compound targets: no PP, or `compounds: none`, or `compounds: nonFinite` and a finite target | clore imparfait; gésir compounds |
| fr.avail.third-person-only | defective | entry or restriction `thirdPersonOnly` and person 1/2 | seoir 1sg; advenir 1sg |
| fr.avail.impersonal | impersonal | `impersonal` and person ≠ 3, or `singular` and plural | falloir 1sg, 3pl |
| fr.avail.no-imperative | noImperative | `noImperative` (entry or restriction) and mood imperative | pouvoir, faillir, falloir, advenir |
| fr.avail.pronominal-imperative-past | noImperative | reflexive and imperative/past | se laver |

Precedence (the legacy code assigns in this order and the last applicable wins, so the reason printed is): pronominal-imperative-past > no-imperative > impersonal > defective (cells) > third-person-only. Near future / recent past are available iff the infinitive is (corpus correction for clore already relies on this).

**Count:** 22 classify + 13 stem + 11 ending + 15 orthography + 14 periphrasis + 14 clause + 5 availability = **94 rules**.

---

## 5. Lexicon

### 5.1 Entry type and files

`src/languages/fr/families.ts` (generated once by the bootstrap script, then hand-reviewed; never retyped): one `FamilyEntry` per legacy non-productive model — `{ id, lemmas, suffixes, except, exceptEndings, strip, paradigms: [{ pattern, usage, parts, gaps, cells, spellings }], flags }` with `parts` = P1 (+set), P2, P3, F, PS (+theme), PP (+PPF), SJ1, SJ2, each `string | readonly string[]` (several values = fork in order); `gaps` = cells absent although their part exists; `cells` = suppletive whole words (§5.3); `spellings` = listed spelling variants (`fr.stem.listed-spelling`); `flags` = `invariableParticiple`, `impersonal`, `thirdPersonOnly`, `noImperative`, `compounds`, `imperativeFromSubjunctive`, `presentParticipleFromSubjunctive`, `circumflexBeforeT`, `verified` (Académie id and date). Productive labels and the -eler/-eter lists live in `src/languages/fr/paradigms.ts`. `src/languages/fr/lexicon.ts` keeps its current side lists verbatim: être list (24), dual list (16), known-avoir list (19), indirect reflexives (6), essential reflexives (6), aspirated h (9), restrictions (advenir: third person only + no imperative; ensuivre: third person only), `canonicalLemma`.

### 5.2 Measured reduction of the 113 models

Method [M]: for every legacy model paradigm (121 paradigms: 19 productive models with payer ×2 = 20, 94 families = 101), take the cell texts relative to the stripped stem (`cellTexts('', cell, spelling)`), read P1/P2/P3/F/PS/PP/SJ1/SJ2 off cells 0/3/5/18/12/46/24/27 (falling back to 3rd-person, imparfait or participle cells for defective verbs), re-derive all 51 cells with §4.2–4.3 (imperative and participe présent rules included), and compare both spellings. Productive models were checked separately with the real rules (§4.4 [M]). Result:

| Bucket | Paradigms | After the rebuild |
|---|---:|---|
| Productive (3 ending sets + rules) | 20 | no data per verb |
| Family, principal parts only (incl. invariable participle, e-set verbs, SJ stems, imperative/ppres from the subjunctive) | 58 | parts |
| Family, parts + spelling rule (circumflex-before-t, 1990 circumflex, 1990-assoir, 1990-interpeler, 1990-absout, croître homograph, diaeresis) | 13 | parts + rules |
| Family with forked parts (ouïr#ois future ×3, déchoir future ×2, vouloir SJ2 and imperative, pouvoir 1sg) | 4 | parts with several values |
| Defective (parts + availability; person, impersonal or tense gaps) | 23 | parts + flags + `gaps` |
| Suppletive cells | 9 entries | 28 whole-word cells in total (below) |

Residual whole-word cells (everything formation rules do not produce) [M]: **être** 10 (es, est, sommes, êtes, sont; subj. sois, sois, soit, soyons, soyez — soient, imperative and the rest derive from P1 sui·s, P2 ét, F ser, PS f·u, SJ1 soi, SJ2 soy), **avoir** 7 (ai, as, a, ont; subj. ait, ayons, ayez), **aller** 3 (vas, va, vont; imperative va derives from vas), **faire** 2 (faites, font; imperative faites derives from the present), **dire/redire** 1 (dites), **pouvoir** 1 (1sg alternative puis after peux), **seoir** 1 (participe présent séant before seyant), **messeoir** 1 (messéant), **échoir** 1 per paradigm (échéant). Total 28. Listed spellings with no rule behind them: clore/enclore 3sg rectified `clot` (2 cells), croître participle f.sg/m.pl/f.pl rectified `crûe, crûs, crûes` (3) — open questions O1/O2.

Compared with the earlier estimate (design input §F: ~68 zero-mismatch paradigms; overrides in about ten verbs): savoir, valoir and vouloir need no cells once the subjunctive stem and the subjunctive imperative/participle are formation rules; faire needs 2 rather than 3; être 10 rather than 24.

Per model (P = productive, F = family, D = defective, S = suppletive; parts are relative to the stripped stem, `·s` = singular ending set, `PS=x·u` = past stem x with theme u; "gaps" lists cells absent beyond what the flags and missing parts already explain):

| Model (paradigm) | Selectors (`=` lemma, `-` suffix) | Class after rebuild | Principal parts | Flags; gaps | Residual cells; alternatives |
|---|---|---|---|---|---|
| aimer | -er | P-er | — |  | — |
| placer | -cer | P-er + c-cedilla | — |  | — |
| manger | -ger | P-er + g-e | — |  | — |
| lever | =celer, =déceler, =receler, =peler, -emer, -ener, -eper, -erer, -eser, -ever, -evrer, -geler, -ciseler, -marteler, -modeler, -harceler, -écarteler, -démanteler, -encasteler, -acheter, -bégueter, -corseter, -crocheter, -fileter, -fureter, -haleter | P-er + mute-e-grave (è-list for -eler/-eter) | — |  | — |
| dépecer | -ecer | P-er + mute-e-grave + c-cedilla | — |  | — |
| céder | -éber, -éder, -éfer, -éjer, -éker, -éler, -émer, -éner, -éper, -érer, -éser, -éter, -éver, -ézer, -ébler, -ébrer, -écher, -écler, -écrer, -édrer, -éfler, -éfrer, -égler, -égner, -égrer, -éguer, -épher, -épler, -éprer, -équer, -éther, -étrer, -évrer | P-er + closed-e-grave (fut/cond fork) | — (spelling: F r:cèder t:céder) |  | — |
| rapiécer | -écer | P-er + closed-e-grave + c-cedilla | — (spelling: F r:rapiècer t:rapiécer) |  | — |
| protéger | -éger | P-er + closed-e-grave + g-e | — (spelling: F r:protèger t:protéger) |  | — |
| appeler | -appeler | P-er + eler-eter (double) | — |  | — |
| jeter | -jeter | P-er + eler-eter (double) | — |  | — |
| renouveler | -eler | P-er + eler-eter (trad double / 1990 è) | — (spelling: P1 r:renouvèl t:renouvell; P3 r:renouvèl t:renouvell; F r:renouvèler t:renouveller) |  | — |
| feuilleter | -eter, -cacheter, -tacheter | P-er + eler-eter (trad double / 1990 è) | — (spelling: P1 r:feuillèt t:feuillett; P3 r:feuillèt t:feuillett; F r:feuillèter t:feuilletter) |  | — |
| payer#y-to-i | -ayer | P-er, 2 paradigms (y-to-i / keep-y) | — |  | — |
| payer#keep-y | -ayer | P-er, 2 paradigms (y-to-i / keep-y) | — |  | — |
| nettoyer | -oyer, -uyer | P-er + y-to-i | — |  | — |
| grasseyer | -eyer, -éyer | P-er (y kept) | — |  | — |
| finir | -ir; not -oir | P-ir | — |  | — |
| ïr | -ïr | P-ir + diaeresis | — |  | — |
| rendre | -dre, -tre | P-re + t-after-dental | — |  | — |
| rompre | -re | P-re | — |  | — |
| être | =être | S | P1=sui ·s P2=ét F=ser PS=f·u PP=été SJ1=soi SJ2=soy | invariable | pres es, est, sommes, êtes, sont; subj sois, sois, soit, soyons, soyez (10) |
| avoir | =avoir | S | P2=av F=aur PS=e·u PP=eu SJ1=ai SJ2=ay |  | pres ai, as, a, ont; subj ait, ayons, ayez (7) |
| aller | =aller | S | P1=vai ·s P2=all F=ir PS=all·a PP=allé SJ1=aill |  | pres vas, va, vont (3) |
| falloir | =falloir | D impersonal sg | P1=fau ·x P2=fall F=faudr PS=fall·u PP=fallu SJ1=faill | invariable, impersonal:singular, noImperative; gaps: ppres. | none |
| pleuvoir | -pleuvoir | D impersonal (fig. pl.) | P1=pleu ·x P2=pleuv P3=pleuv F=pleuvr PS=pl·u PP=plu | invariable, impersonal:figurativePlural, noImperative | none |
| pouvoir | =pouvoir | F+SJ, alt. 1sg | P1=peu ·x P2=pouv P3=peuv F=pourr PS=p·u PP=pu SJ1=puiss SJ2=puiss | invariable, noImperative | pres.1s alternative puis (1); alternatives: pres.1s=peux/puis |
| savoir | =savoir | F+SJ, imp./ppres from subj. | P1=sai ·s P2=sav P3=sav F=saur PS=s·u PP=su SJ1=sach SJ2=sach |  | none |
| gésir | =gésir | D + circ-before-t | P1=gi ·s P2=gis P3=gis | compounds:none; gaps: subj (all), imp (all) | none |
| seoir | =seoir | D 3rd person, no compounds | P1=sied ·s P2=sé P3=sié F=siér PP=sis | invariable, thirdPersonOnly, compounds:none | ppres séant (1, before seyant); alternatives: ppres=séant/seyant |
| messeoir | =messeoir | D 3rd person, no compounds | P1=messied ·s P2=messé P3=messié F=messiér PP=messis | invariable, thirdPersonOnly, compounds:none | ppres messéant (1); alternatives: ppres=messéant/messeyant |
| ouïr#ouïs | =ouïr | F + diaeresis; ois: F-fork | P1=ouï ·s P2=ouïss P3=ouïss F=ouïr PS=ou·ï PP=ouï |  | none |
| ouïr#ois (dated) | =ouïr | F + diaeresis; ois: F-fork | P1=oi ·s P2=oy P3=oi F=ouïr PS=ou·ï PP=ouï |  | none; alternatives: fut.1s=ouïrai/orrai/oirai; … (12 cells) |
| choir#choirai (dated) | =choir | D (dated) | P1=choi ·s P2=choy P3=choi F=choir PS=ch·u PP=chu | gaps: impf (all), subj (all), sipf.1s/2s/1p/2p/3p, imp (all), ppres. | none |
| choir#cherrai (dated) | =choir | D (dated) | P1=choi ·s P2=choy P3=choi F=cherr PS=ch·u PP=chu | gaps: impf (all), subj (all), sipf.1s/2s/1p/2p/3p, imp (all), ppres. | none |
| échoir#échoit | -échoir | D 3rd person | P1=échoi ·s P2=éché P3=échoi F=échoir PS=éch·u PP=échu | thirdPersonOnly | ppres échéant (1) |
| échoir#échet | -échoir | D 3rd person | P1=éche ·s P2=éché P3=éché F=écherr PS=éch·u PP=échu | thirdPersonOnly | ppres échéant (1) |
| déchoir | -déchoir | D, F-fork | P1=déchoi ·s P2=déchoy P3=déchoi F=déchoir PS=déch·u PP=déchu | gaps: impf (all), imp (all), ppres. | none; alternatives: fut.1s=déchoirai/décherrai; … (12 cells) |
| croître | =croître | F + croitre-homograph | P1=croî ·s P2=croiss P3=croiss F=croitr PP=crû (spelling: F r:croitr t:croîtr) |  | listed spelling: pp.fs/mp/fp rectified crûe, crûs, crûes (3) |
| accroître | -accroître, -décroître, -recroître | F + circ-before-t, 1990 | P1=croi ·s P2=croiss P3=croiss F=croitr PS=cr·u PP=cru (spelling: F r:croitr t:croîtr) |  | none |
| naître | =naître, =renaître | F + circ-before-t, 1990 | P1=nai ·s P2=naiss P3=naiss F=naitr PS=naqu·i PP=né (spelling: F r:naitr t:naîtr) |  | none |
| paître | =paître | D (no ps; finite compounds none) + circ | P1=pai ·s P2=paiss P3=paiss F=paitr PP=pu (spelling: F r:paitr t:paîtr) | compounds:nonFinite | none |
| repaître | -repaître | F + circ-before-t, 1990 | P1=repai ·s P2=repaiss P3=repaiss F=repaitr PS=rep·u PP=repu (spelling: F r:repaitr t:repaîtr) |  | none |
| connaître | -aître | F + circ-before-t, 1990 | P1=ai ·s P2=aiss P3=aiss F=aitr PS=·u PP=u (spelling: F r:aitr t:aîtr) |  | none |
| mouvoir | =mouvoir | F + 1990 (mû→mu) | P1=meu ·s P2=mouv P3=meuv F=mouvr PS=m·u PP=mu (spelling: PP r:mu t:mû) |  | none |
| émouvoir | -émouvoir, -promouvoir | F | P1=meu ·s P2=mouv P3=meuv F=mouvr PS=m·u PP=mu |  | none |
| dire | =dire, =redire | F+1 lexical cell | P1=di ·s P2=dis P3=dis F=dir PS=d·i PP=dit |  | pres dites (1) |
| interdire | -dire | F | P1=di ·s P2=dis P3=dis F=dir PS=d·i PP=dit |  | none |
| écrire | -crire | F | P1=cri ·s P2=criv P3=criv F=crir PS=criv·i PP=crit |  | none |
| lire | -lire | F | P1=li ·s P2=lis P3=lis F=lir PS=l·u PP=lu |  | none |
| rire | -rire | F, invariable pp | P1=ri ·s P2=ri P3=ri F=rir PS=r·i PP=ri | invariable | none |
| cuire | -uire | F | P1=ui ·s P2=uis P3=uis F=uir PS=uis·i PP=uit |  | none |
| confire | -confire | F | P1=fi ·s P2=fis P3=fis F=fir PS=f·i PP=fit |  | none |
| conclure | -clure | F | P1=clu ·s P2=clu P3=clu F=clur PS=cl·u PP=clu |  | none |
| plaire | -plaire | F + circ-before-t, invariable pp | P1=plai ·s P2=plais P3=plais F=plair PS=pl·u PP=plu | invariable | none |
| faire | -faire | S | P1=fai ·s P2=fais F=fer PS=f·i PP=fait SJ1=fass SJ2=fass |  | pres faites, font (2) |
| traire | =raire, -traire | D (no ps) | P1=rai ·s P2=ray P3=rai F=rair PP=rait |  | none |
| résoudre | -résoudre | F | P1=résou ·s P2=résolv P3=résolv F=résoudr PS=résol·u PP=résolu |  | none |
| absoudre | -soudre | D (no ps) + 1990-absout | P1=sou ·s P2=solv P3=solv F=soudr PP=sout (spelling: PP r:sout t:sous) |  | none |
| coudre | -coudre | F | P1=coud ·s P2=cous P3=cous F=coudr PS=cous·i PP=cousu |  | none |
| moudre | -moudre | F | P1=moud ·s P2=moul P3=moul F=moudr PS=moul·u PP=moulu |  | none |
| craindre | -aindre | F | P1=ain ·s P2=aign P3=aign F=aindr PS=aign·i PP=aint |  | none |
| peindre | -eindre | F | P1=ein ·s P2=eign P3=eign F=eindr PS=eign·i PP=eint |  | none |
| joindre | -oindre | F | P1=oin ·s P2=oign P3=oign F=oindr PS=oign·i PP=oint |  | none |
| prendre | -prendre | F | P1=prend ·s P2=pren P3=prenn F=prendr PS=pr·i PP=pris |  | none |
| battre | -battre | F | P1=bat ·s P2=batt P3=batt F=battr PS=batt·i PP=battu |  | none |
| mettre | -mettre | F | P1=met ·s P2=mett P3=mett F=mettr PS=m·i PP=mis |  | none |
| vaincre | -vaincre | F | P1=vainc ·s P2=vainqu P3=vainqu F=vaincr PS=vainqu·i PP=vaincu |  | none |
| vivre | -vivre | F | P1=vi ·s P2=viv P3=viv F=vivr PS=véc·u PP=vécu |  | none |
| suivre | -suivre | F | P1=sui ·s P2=suiv P3=suiv F=suivr PS=suiv·i PP=suivi |  | none |
| boire | -boire | F | P1=boi ·s P2=buv P3=boiv F=boir PS=b·u PP=bu |  | none |
| croire | -croire | F | P1=croi ·s P2=croy P3=croi F=croir PS=cr·u PP=cru |  | none |
| clore | -clore | D + listed spelling | P1=clo ·s P2=clos P3=clos F=clor PP=clos | gaps: pres.1p/2p, impf (all), imp.1p/2p | listed spelling: pres.3s rectified clot (1) |
| acquérir | -quérir | F | P1=quier ·s P2=quér P3=quièr F=querr PS=qu·i PP=quis |  | none |
| assaillir | -assaillir, -tressaillir, -défaillir | F (e-set) | P1=aill ·e P2=aill P3=aill F=aillir PS=aill·i PP=ailli |  | none |
| faillir#faillis | -faillir | F, 4 paradigms | P1=failli ·s P2=failliss P3=failliss F=faillir PS=faill·i PP=failli | noImperative | none |
| faillir#faudrai | -faillir | F, 4 paradigms | P1=failli ·s P2=failliss P3=failliss F=faudr PS=faill·i PP=failli | noImperative | none |
| faillir#faille | -faillir | F, 4 paradigms | P1=failli ·s P2=failliss P3=failliss F=faudr PS=faill·i PP=failli SJ1=faill SJ2=faill | noImperative | none |
| faillir#faux (dated) | -faillir | F, 4 paradigms | P1=fau ·x P2=faill P3=faill F=faillir PS=faill·i PP=failli SJ1=failliss SJ2=failliss | noImperative | none |
| bouillir | -bouillir | F | P1=bou ·s P2=bouill P3=bouill F=bouillir PS=bouill·i PP=bouilli |  | none |
| cueillir | -cueillir | F (e-set) | P1=cueill ·e P2=cueill P3=cueill F=cueiller PS=cueill·i PP=cueilli |  | none |
| courir | -courir | F | P1=cour ·s P2=cour P3=cour F=courr PS=cour·u PP=couru |  | none |
| mourir | -mourir | F | P1=meur ·s P2=mour P3=meur F=mourr PS=mour·u PP=mort |  | none |
| ouvrir | -ouvrir, -ffrir | F (e-set) | P1=r ·e P2=r P3=r F=rir PS=r·i PP=ert |  | none |
| dormir | -dormir | F, invariable pp | P1=dor ·s P2=dorm P3=dorm F=dormir PS=dorm·i PP=dormi | invariable | none |
| endormir | -ndormir | F | P1=dor ·s P2=dorm P3=dorm F=dormir PS=dorm·i PP=dormi |  | none |
| partir | -partir, -sortir, -sentir, -mentir, -repentir; except impartir, répartir, assortir, désassortir, rassortir, réassortir | F | P1= ·s P2=t P3=t F=tir PS=t·i PP=ti |  | none |
| servir | -servir; except asservir | F | P1=ser ·s P2=serv P3=serv F=servir PS=serv·i PP=servi |  | none |
| fuir | -fuir | F | P1=fui ·s P2=fuy P3=fui F=fuir PS=fu·i PP=fui |  | none |
| haïr | -haïr | F + diaeresis | P1=hai ·s P2=haïss P3=haïss F=haïr PS=ha·ï PP=haï |  | none |
| tenir | -tenir | F | P1=tien ·s P2=ten P3=tienn F=tiendr PS=t·in PP=tenu |  | none |
| venir | -venir | F | P1=vien ·s P2=ven P3=vienn F=viendr PS=v·in PP=venu |  | none |
| vêtir | -vêtir | F | P1=vêt ·s P2=vêt P3=vêt F=vêtir PS=vêt·i PP=vêtu |  | none |
| asseoir#assois | -asseoir | F, 2 paradigms + 1990-assoir | P1=assoi ·s P2=assoy P3=assoi F=assoir PS=ass·i PP=assis (spelling: F r:assoir t:asseoir) |  | none |
| asseoir#assieds | -asseoir | F, 2 paradigms + 1990-assoir | P1=assied ·s P2=assey P3=assey F=assiér PS=ass·i PP=assis |  | none |
| surseoir | -surseoir | F + 1990-assoir | P1=sursoi ·s P2=sursoy P3=sursoi F=sursoir PS=surs·i PP=sursis (spelling: F r:sursoir t:surseoir) |  | none |
| voir | -voir | F | P1=voi ·s P2=voy P3=voi F=verr PS=v·i PP=vu |  | none |
| prévoir | -prévoir | F | P1=prévoi ·s P2=prévoy P3=prévoi F=prévoir PS=prév·i PP=prévu |  | none |
| pourvoir | -pourvoir | F | P1=pourvoi ·s P2=pourvoy P3=pourvoi F=pourvoir PS=pourv·u PP=pourvu |  | none |
| recevoir | -cevoir | F | P1=çoi ·s P2=cev P3=çoiv F=cevr PS=ç·u PP=çu |  | none |
| devoir | -devoir | F (dû kept) | P1=doi ·s P2=dev P3=doiv F=devr PS=d·u PP=dû |  | none |
| valoir | -valoir | F+SJ | P1=vau ·x P2=val P3=val F=vaudr PS=val·u PP=valu SJ1=vaill |  | none |
| vouloir | -vouloir | F+SJ-fork, imp. fork | P1=veu ·x P2=voul P3=veul F=voudr PS=voul·u PP=voulu SJ1=veuill |  | none; alternatives: subj.1p=voulions/veuillions; … (5 cells) |
| envoyer | -envoyer | P-er + y-to-i + lexical F enverr | P1=envoi ·e P2=envoy P3=envoi F=enverr PS=envoy·a PP=envoyé |  | none |
| interpeller | =interpeller | P-er/F + 1990-interpeler | P1=ll ·e P2=l P3=ll F=ller PS=l·a PP=lé (spelling: P2 r:l t:ll; PS r:l t:ll; PP r:lé t:llé) |  | none |
| taire | =taire | F | P1=ai ·s P2=ais P3=ais F=air PS=·u PP=u |  | none |
| suffire | =suffire | F, invariable pp | P1=fi ·s P2=fis P3=fis F=fir PS=f·i PP=fi | invariable | none |
| circoncire | =circoncire | F | P1=i ·s P2=is P3=is F=ir PS=·i PP=is |  | none |
| frire | =frire | D | P1=ri ·s F=rir PP=rit |  | none |
| maudire | =maudire | F | P1=di ·s P2=diss P3=diss F=dir PS=d·i PP=dit |  | none |
| nuire | -nuire, -luire | F, invariable pp | P1=ui ·s P2=uis P3=uis F=uir PS=uis·i PP=ui | invariable | none |
| bruire | =bruire | D | P1=ui ·s P2=uiss P3=uiss F=uir PP=uit | invariable; gaps: pres.1p/2p, impf.1s/2s/1p/2p, subj.1s/2s/1p/2p, imp (all) | none |
| braire | =braire | D 3rd person | P1=ai ·s P2=ay P3=ai F=air PP=ait | invariable, thirdPersonOnly | none |
| foutre | -foutre | F | P1=fou ·s P2=fout P3=fout F=foutr PS=fout·i PP=foutu |  | none |
| inclure | -inclure, -occlure, -reclure | F | P1=clu ·s P2=clu P3=clu F=clur PS=cl·u PP=clus |  | none |
| enclore | -enclore | D + listed spelling | P1=clo ·s P2=clos P3=clos F=clor PP=clos | gaps: impf (all), imp.1p/2p | listed spelling: pres.3s rectified clot (1) |
| prévaloir | -prévaloir | F | P1=vau ·x P2=val P3=val F=vaudr PS=val·u PP=valu |  | none |
| ester | =accroire, =assavoir, =bienvenir, =courre, =ester, =malfaire, =méfaire, =quérir, =ravoir | D infinitive only |  |  | none |
| férir | =férir | D inf.+pp | PP=ru |  | none |
| issir | =issir | D inf.+pp | PP=su |  | none |
| rassir | =rassir | D inf.+pp | PP=is |  | none |
| occire | =occire | D inf.+pp | PP=is |  | none |

Notes to the table: `ouvrir` strips 3 letters (`-rir`), so its P1 is `r·e` (ouv|r|e); `partir` strips `tir`, P1 empty (par|s, par|t). `traire` covers raire. The `ester` entry covers accroire, assavoir, bienvenir, courre, ester, malfaire, méfaire, quérir, ravoir (infinitive only). seoir/messeoir/échoir: the bootstrap reads P2 off the participe présent; review sets P2 to `sey`/`messey`/`échoy` (imparfait) and lists the participe présent as the residual cell, which is what the totals above count.

### 5.3 How legacy concepts map onto the staged contract

| Legacy | Staged |
|---|---|
| Model selection (`selectModel`, `except`, `exceptEndings`, listed lemma first) | `families.ts` selectors, same function moved to `lexicon` lookup; productive labels computed (§3.2) |
| Multi-pattern model (payer, asseoir, ouïr, choir, échoir, faillir) | `classify` returns one outcome per paradigm, tagged `pattern` (+ `usage: dated`); payer's two paradigms are the productive er class with the `y-to-i` choice as a lexeme property |
| `invariableParticiple` | flag → `agreements` returns `[null]`; standalone participle one form |
| `impersonal: singular / figurativePlural` | flag → `availability` (`impersonal`) + `subjectGenders` returns `[null]` (il) for the impersonal subject; figurative plural forms carry `condition: 'figurative'` (a tag on the `assemble` outcome of 3pl targets) |
| `thirdPersonOnly`, `noImperative`, restrictions (advenir, ensuivre) | `availability` |
| `compounds: none / nonFinite` | `availability` for periphrastic targets |
| cells `-` | missing principal part, or `gaps` |
| alternatives `a/b` in a cell | part with several values (fork, untagged), or a `cells` entry with several words |
| `t:`/`r:` alternatives | spelling rules (§4.4) or `spellings` |
| `^` (grave stem) | rules 2 and 3 |
| `hintCells` (`stems` option) | `fr.stem.hint` replaces P1/P2/P3/F/PS(+pastVowel)/PP, then the same endings and spelling rules (new: spelling rules now apply to hinted stems) |
| `firstForm(knownLexeme(aux))` | `lexemeOf('être' / 'avoir' / 'aller' / 'venir')` through the same grammar |
| dual auxiliaries | `LexemeBase.auxiliaries = [avoir, être]`; one periphrasis run per auxiliary; `condition` `${aux}: auxiliary choice depends on construction or lexical sense.` added by the clause when the lexeme has two auxiliaries |
| `reflexive && imperative past → noImperative` | `fr.avail.pronominal-imperative-past` |

### 5.4 Verification

Every family's parts are checked against the Académie's table `https://www.dictionnaire-academie.fr/conjuguer/<id>` (id from the entry search; 12 ids already known: céder A9C1222, acheter A9A0377, appeler A9A2203, payer A9P1095, asseoir A9A2823, faillir A9F0105, clore A9C2658, choir A9C2105, gésir A9G0655, croître A9C5057, absoudre A9A0175, résoudre A9R2080). The representative lemma of each family is the first listed lemma, else the first suffix used as a word (connaître for -aître, cuire for -uire). A family is kept when the Académie table gives the same parts (alternatives may be a subset); every disagreement becomes an open question for the user, never a silent change, because the snapshot must still match. The verification date and id go into `flags.verified`; a family whose table could not be opened is flagged `secondaryOnly` in `sources.ts`.

---

## 6. Periphrases and clause

### 6.1 Compound tenses

§4.5. Auxiliary forms come from the lexicon entries of être/avoir/aller/venir (first form of the cell, as today). `variant.auxiliary` reports the perfect auxiliary for the twelve compound tenses, `aller` for near_future and `venir` for recent_past (the snapshot shows `aller`/`venir` in that column), and nothing for simple tenses.

### 6.2 Word order and parts (roles as in the snapshot: m s r a v l)

| Target | Parts |
|---|---|
| finite simple (not imperative) | [que] subject [reflexive] verb |
| imperative present | verb [reflexive, joinBefore hyphen; 2sg te → toi] |
| imperative past | auxiliary pp (no subject; pronominal: unavailable) |
| compound finite | [que] subject [reflexive] auxiliary pp |
| near future / recent past | [que] subject aller/venir [de] [reflexive] infinitive |
| infinitive present / past | [reflexive] infinitive · [reflexive] auxiliary pp |
| participle present | [reflexive] participle |
| participle past | participle only (no reflexive pronoun even for pronominal verbs: `lavé`) |
| participle perfect | [reflexive] étant/ayant pp |
| gerund present / past | en [reflexive] participle · en [reflexive] auxiliary pp |

Reflexive pronoun: me te se nous vous se by person; `se` without person. Features as today: subject {person, number, gender = target.gender}; reflexive {person, number}; lexical verb: cell features (finite: mood, tense, person, number, verbForm finite; pp: mood participle, tense past, gender/number of the agreement or null when invariable, verbForm pastParticiple; infinitive and present participle as today); `phonology.onset` of lexical-verb parts uses `onsetFlags: { aspiratedH }`. Elision stays render-time in `frenchRendering.sandhi` (unchanged: je, me, te, se, que, de before vowel or mute h).

### 6.3 Subject gender and agreement (exact legacy logic)

New optional core hook (Deviations D1): `ClauseGrammar.subjectGenders?(context): Fork<Gender | null>`. In `stagedEngine`'s `build` it runs after the opening (periphrasis step, paradigm tags) and before `agreements`; each outcome replaces `target.gender` in the context that `agreements` and `assemble` see and in the form's resolved target; its steps are form-level steps. Absent hook: `one(target.gender)`, so Dutch, the toy and every other pack are unchanged. It is consulted for every target (finite or not), not only for packs with `genderedTargets`. French:

| Situation | subjectGenders | agreements (only when an `agree` element exists) |
|---|---|---|
| non-finite target | [null] | standalone pp: invariable → [null]; impersonal → [m.sg]; else genders (`agreement.gender` › `gender` › both) × numbers (`agreement.number` › both), gender-major. Compound non-finite: as the compound row with target gender/number null |
| impersonal subject (falloir; pleuvoir singular) | [null] (il) | invariable → [null] |
| person 3 | `gender` option › [masculine, feminine] | compound rows below |
| person 1/2, compound with être, participle not invariable, not (reflexive and (indirect or precedingDirectObject)) | `gender` option › [masculine, feminine] | — |
| person 1/2 otherwise | [null] | — |
| compound: invariable participle | — | [null] |
| compound: precedingDirectObject and (avoir or reflexive) | — | [precedingDirectObject] |
| compound: avoir, or reflexive indirect | — | [masculine singular] (so `j'ai aimé` has agreement m.sg, as the snapshot shows) |
| compound: être otherwise | — | gender: target.gender › `agreement.gender` › `gender` › both; number: target.number › `agreement.number` › both |

`agreements` returns `[null]` whenever `context.agreeing` holds no `pastParticiple` cell (the core also asks it for the simple infinitive and present participle, which never agree). `acceptsForm` (the `agreement` filter, keeps only forms whose `target.agreement` matches) and `rank` (`variantRank` with `preferredOrthography`, default rectified) are unchanged. `condition` texts, set as tags on the `assemble` outcome: `figurative` on plural forms of a `figurativePlural` verb; `{aux}: auxiliary choice depends on construction or lexical sense.` on compound forms of a verb whose lexeme lists two auxiliaries (after the `auxiliary` option has narrowed the list, so a hinted query has no condition, as today).

### 6.4 Order of forms within a target

Legacy nesting: paradigm › spelling pass › auxiliary › subject gender › construction › agreement › cell alternatives; then dedup (forms equal except spelling merge to `both`), grouping by resolved target in first-seen order, stable sort by `rank` (usage × 10 + spelling). The staged executor's order: paradigm (classify fork) › periphrasis › auxiliary › subjectGenders › agreements › word forks (alternatives, then spelling forks); same dedup, grouping and sort. The two differ only in where the spelling pass and the construction loop sit; this changes output only when two forms of one resolved target with the same rank come from different constructions or auxiliaries and one of them has a spelling split, with `preferredOrthography: 'traditional'`. [M] No snapshot query has such a pair (dual-auxiliary verbs have no split masculine-singular participle; `past-first`/`past-second` differ in usage), so **no reorder ledger entry is expected**; the shadow test proves it. The current core already iterates as required (read in `src/core/staged.ts` after Plan 2 Tasks 1–4): `generate` loops paradigms in classify order, `constructions` loops periphrases in declaration order and auxiliaries in `lexeme.auxiliaries` order, and forks keep their order through `chain`/`combine`.

### 6.5 Elision, hyphen, h

Render-time sandhi (unchanged); `fr.clause.elision` is recorded on the form from a dry run so explanations mention j', m', qu', d'. `aspiratedH` reaches the onset of every lexical-verb part (so `je hais`, `je viens de haïr`). Negative imperative: out of scope.

---

## 7. Worked derivations

1. **nous plaçons** (placer, ind. present 1pl): `fr.classify.group` (er) → `fr.classify.spelling-model` (placer) → `fr.stem.group-stem` placer → plac- → `fr.end.present-plural` plac + ons → `fr.orth.c-cedilla` placons → plaçons → `fr.clause.subject` nous plaçons. Spelling-neutral: `both`.
2. **je lève / je lèverai** (lever): stem lev-, ending e / erai (both mute); `fr.orth.mute-e-grave`: S `lev` matches `(^|[^V]|[gq]u)e(ONSET)$` (l + e + v) → lèv → lève, lèverai, in both spellings.
3. **je cède / je cèderai, je céderai** (céder): `fr.orth.closed-e-grave` → cède (both); future: rectified cèderai, traditional céderai (two forms, rectified preferred by default).
4. **il renouvelle / il renouvèle** (renouveler, ind. present 3sg): `fr.orth.eler-eter` FORK → renouvelle (traditional) and unchanged renouvel+e (rectified) → `fr.orth.mute-e-grave` → renouvèle (rectified).
5. **j'appelle** (appeler): `fr.orth.eler-eter` DOUBLE in both spellings; mute-e does not fire (ll); `fr.clause.subject` je + elision at render time → j'appelle.
6. **je paie / je paye** (payer, two paradigms): `fr.classify.paradigm` y-to-i → `fr.orth.y-to-i` pay+e → paie; paradigm keep-y → paye. Every cell of payer appears twice with pattern `y-to-i` then `keep-y`, even where equal (nous payons ×2), as in the snapshot.
7. **nous mangeons** (manger): `fr.orth.g-e` mang+ons → mangeons.
8. **ils viennent** (venir, family): `fr.classify.lexicon` venir → `fr.stem.ils` vienn- → `fr.end.present-plural` ent → viennent. **nous vînmes**: `fr.stem.past` v- theme in → `fr.end.simple-past` înmes → vînmes (literary).
9. **il connaît / il connait** (connaître, selected by the suffix -aître): `fr.classify.family-suffix` records the assumption "connaître is inflected like connaître from its -aître ending." (the snapshot's A line has it, because the selector is not the whole lemma) → `fr.stem.present-singular` conn + ai- → `fr.end.present-singular` t → `fr.orth.circumflex-before-t`: traditional connaît, rectified connait.
10. **que je sache / sache** (savoir): `fr.stem.subjunctive` sach- + e → que je sache; imperative 2sg: `fr.stem.imperative-from-subjunctive` saches → sache.
11. **je suis allée** (aller, ind. perfect 1sg, feminine): `fr.periphrasis.perfect` (auxiliary être) → `subjectGenders` [masculine, feminine] (`fr.clause.subject-gender`) → feminine: agreement feminine singular (`fr.clause.agree-subject`) → auxiliary word: être ind. present 1sg from P1 sui·s (`fr.stem.present-singular`, `fr.end.present-singular`) = suis; participle allé + e (`fr.end.past-participle`) → je suis allée; target `indicative/perfect/1/singular/feminine/feminine.singular`.
12. **elle s'est lavé** (se laver, reflexiveObject indirect, ind. perfect 3sg feminine): `fr.classify.indirect-reflexive` → `fr.clause.no-agreement-indirect` (agreement m.sg) → subject elle, reflexive se, auxiliary est, pp lavé → elle s'est lavé (elision at render time); target `…/3/singular/feminine/masculine.singular`.
13. **il faut** (falloir): `fr.clause.impersonal-subject`, target gender null; `je` slot: `fr.avail.impersonal` → `U indicative/present/1/singular impersonal`.
14. **lave-toi** (se laver, imperative 2sg): `fr.clause.reflexive-imperative` te → toi, hyphen.
15. **je blède** (invented bleder): `fr.classify.group` + `fr.classify.assume-regular` (assumption) + `fr.classify.assume-avoir` (assumption) → `fr.classify.spelling-model` lever → `fr.orth.mute-e-grave` bled+e → blède. Legacy gave `je blede`; this is ledger class L1 (§9.3).
16. **je blets** (invented blettre): RE class, `fr.orth.tt-singular` blett+s → blets; `il blet` (+ t-after-dental). Ledger class L2.
17. **nous blaçons** (invented blouper with `stems: { plural: 'blac' }`, not in the snapshot): `fr.stem.hint` → blac + ons → `fr.orth.c-cedilla` → blaçons (legacy blacons).

---

## 8. Test data

### 8.1 Invented verbs (expected forms; one per rule)

| Verb | Rule shown | Expected (rectified default; traditional where it differs) |
|---|---|---|
| bloupeler | eler-eter FORK | je bloupèle (r), je bloupelle (t); nous bloupelons; je bloupèlerai / bloupellerai |
| zorappeler | eler-eter DOUBLE (suffix appeler) | je zorappelle (both); je zorappellerai |
| zéger | closed-é + g-e | je zège; nous zégeons; je zègerai (r) / zégerai (t) |
| zeguer | mute-e (gu onset) | je zègue; nous zeguons |
| blecer | mute-e + c-cedilla (label dépecer) | je blèce; nous bleçons |
| blécer | closed-é + c-cedilla (label rapiécer) | je blèce; nous bléçons; je blècerai / blécerai |
| ploucer | c-cedilla | nous plouçons; il plouça |
| glonger | g-e | nous glongeons; je glongeais |
| bloyer | y-to-i | je bloie; je bloierai; nous bloyons |
| blayer | two paradigms | je blaie (y-to-i), je blaye (keep-y) |
| bleyer | y kept | je bleye; je bleyerai |
| blouïr | diaeresis | je blouïs; nous blouïssons; il blouït (ps); qu'il blouït (subj. impf) |
| plordre | RE + t-after-dental | je plords, il plord; nous plordons; plordu |
| blettre | tt-singular | je blets, il blet; nous blettons; blettu |
| zompre | RE | il zompt; zompu |
| brumir | IR | nous brumissons; il brumit; brumi |
| blouper + stems {future: 'bloupr'} | hint | je blouprai (as today) |
| blouper + stems {plural: 'blac'} | hint through c-cedilla (new) | nous blaçons; je blaçais |
| hérouper | assume-mute-h | j'héroupe; assumption "An unlisted initial h is assumed mute."; with `aspiratedH: true`: je héroupe |
| se blouper | pronominal + assume-direct-reflexive | je me bloupe; je me suis bloupé / bloupée; bloupe-toi |

### 8.2 Real verbs absent from the oracle (forms to be checked in the Académie table before they enter a test)

| Verb | Expected | Verify at |
|---|---|---|
| traîner | je traine (r) / je traîne (t) | ACAD traîner `/conjuguer/` |
| jeûner | je jeûne in both spellings (1990 exception jeûne) — legacy gives jeune (r): deliberate change outside the snapshot | JO-1990 II.4 [V]; ACAD jeûner |
| mûrir | je mûris (t) / je muris (r) — legacy keeps û: deliberate change | JO-1990 II.4; ACAD mûrir |
| épeler | j'épèle (r) / j'épelle (t) | ACAD épeler |
| ficeler | je ficèle (r) / je ficelle (t) | ACAD ficeler |
| abréger | j'abrège; j'abrègerai (r) / j'abrégerai (t) | ACAD abréger |
| sevrer | je sèvre | ACAD sevrer |
| employer | j'emploie; j'emploierai | ACAD employer |
| conduire | nous conduisons; conduit | ACAD conduire |
| paraître | il paraît (t) / il parait (r) | ACAD paraître |
| complaire | il complaît (t) / il complait (r); complu (invariable) | ACAD complaire |
| dissoudre | dissous (t) / dissout (r), dissoute | ACAD dissoudre |
| rasseoir | je rassieds / je rassois; rassoir (r) | ACAD rasseoir |

---

## 9. Oracle, snapshot and intended differences

### 9.1 Corpus oracle (exists; no new parser)

`tests/fixtures/fr.json`: 222 files, 84 infinitives, 26,196 cells (23,963 available, 2,233 unavailable), 23,995 expected forms, 125 corrections (sources CNRTL), 0 placeholders; queries and the figurative-pleuvoir `applicable` filter in `scripts/corpus/languages/fr.ts`. The staged pack must keep `npm run corpus:check` green with the same pins; fixtures stay byte-identical. No remaps, no unmodelled cells.

### 9.2 Snapshot

1,003 queries, 1,003 blocks: 995 analysis lines, 8 error blocks, 24,131 (query, mood/tense) sections of F/U lines (11,593 simple, 12,538 periphrastic), 5,226 U lines [M].

### 9.3 Intended differences (the only expected ledger entries)

| Class | Queries in `fr.queries.json` | Legacy → staged | Lines | Authority |
|---|---|---|---|---|
| L1 mute-e whitelist (`-eder`, `-ebler`, `-equer` not listed in legacy `muteE`) | `{"infinitive":"bleder"}`, `{"gender":"masculine","infinitive":"bleder"}`, same two for crebler and pequer | A line classification aimer → lever; present 1–3sg/3pl, future, subj. sg/3pl, conditional, imperative 2sg: blede → blède, creble → crèble, peque → pèque (both spellings) | 3 × (1 A + 29 F) + 3 × (1 A + 21 F) = **156** | OQLF-24212 (« ce e devient un è devant une syllabe contenant un e muet »), https://vitrinelinguistique.oqlf.gouv.qc.ca/24212 |
| L2 -ttre singular | `{"infinitive":"blettre"}`, `{"gender":"masculine","infinitive":"blettre"}` | je bletts → je blets, tu bletts → tu blets, il/elle blett → blet, imperative bletts → blets | 5 + 4 = **9** | Académie battre/mettre tables (`/conjuguer/`, to be opened in Task 8; Le Bon Usage [U]) |

Total predicted: **165 ledger entries**, all line replacements (`was`/`now`), no insertions, no reorders. Hint pass-through changes no snapshot line (the three hinted queries are `blouper` with `future: bloupr` or `{}`). Any other difference found by the shadow test is a bug in the new pack.

Deliberate behaviour changes outside the snapshot (listed in `docs/grammar/fr.md`): every unlisted `-e?C?er` verb with an ONSET cluster now takes è (zeger, blecher, bleguer, zecher, blefer: je zège…); hinted stems pass through spelling rules; the 1990 circumflex rule applies to every group (mûrir → murir) and protects jeûne(s) (legacy wrote jeune); `model` naming a productive label must equal the computed label (legacy accepted e.g. `model: 'rompre'` for any `-re`, giving `il rendt`).

---

## 10. Tense concepts

| Tense | Concepts (weight) | Notes |
|---|---|---|
| indicative.present | PRESENT 1 | |
| indicative.perfect | PAST_PERFECTIVE 1, PRESENT_PERFECT 0.8 | spoken narrative past |
| indicative.imperfect | PAST_IMPERFECTIVE 1 | |
| indicative.pluperfect | PLUPERFECT 1 | |
| indicative.simple_past | PAST_PERFECTIVE 1 (register literary) | |
| indicative.past_anterior | PAST_ANTERIOR 1 (literary) | |
| indicative.future | FUTURE 1 | |
| indicative.future_perfect | FUTURE_PERFECT 1 | |
| indicative.near_future | NEAR_FUTURE 1, FUTURE 0.6 | |
| indicative.recent_past | RECENT_PAST 1, PRESENT_PERFECT 0.5 | |
| subjunctive.present / past / imperfect / pluperfect | SUBJ_PRESENT / SUBJ_PERFECT / SUBJ_IMPERFECT (literary) / SUBJ_PLUPERFECT (literary) 1 | |
| conditional.present / past | COND_PRESENT / COND_PERFECT 1 | `past-second` literary |
| imperative.present / past | IMP_PRESENT / IMP_PERFECT 1 | |
| infinitive.present / past | INF_PRESENT / INF_PERFECT 1 | |
| participle.present / past / perfect | PART_PRESENT / PART_PAST / PART_PERFECT 1 | |
| gerund.present / past | GERUND / GERUND_PERFECT 1 | |

The fr → nl acceptance table (`apps/verbodrome/src/trainer/prompt.ts`) is the equivalence plan's concern (design input N6).

---

## 11. Deviations from the approved design

| # | Approved design says | This design | Why |
|---|---|---|---|
| D1 | Subject gender via slots, French returns all genders; dispatch lists eight slots (je, tu, il, elle, nous, vous, ils, elles) | Six genderless slots; a new optional core hook `ClauseGrammar.subjectGenders` forks the subject gender per form (il/elle; je with an agreeing participle) | Eight slots double the snapshot's 1,072 third-person `U` lines and give `il faut` a masculine target; the hook reproduces the legacy expansion exactly and is what Italian (io sono andato/andata) and Latin need too. One additive, optional core change (French plan Task 2) |
| D2 | "Model flags move unchanged onto the family entry" | Also new flags `imperativeFromSubjunctive`, `presentParticipleFromSubjunctive`, `circumflexBeforeT`, and `gaps` | Removes savoir/vouloir/valoir cell overrides; Grevisse's description of these verbs |
| D3 | Orthography rule list in the spec (c-cedilla … t-after-dental) | Adds tt-singular, circumflex-before-t, croitre-homograph, 1990-assoir, 1990-interpeler, 1990-absout | The legacy `t:`/`r:` splits of families need named rules; tt-singular fixes a whitelist boundary (blettre) |
| D4 | "about ten verbs" with cell overrides | 9 entries, 28 cells, plus 5 listed spellings | measured |
| D5 | Spec lists `paradigms.ts` for "regular ending sets" and `lexicon.ts` for families | Families in `families.ts` (generated); `lexicon.ts` keeps the existing side lists | `lexicon.ts` already exists with that content and is imported by the legacy resolver until the switch |

## 12. Open questions and risks

| # | Item | Proposal |
|---|---|---|
| O1 | Legacy croître participle rectified `crûe, crûs, crûes`; Académie (A9C5057) writes `crû, crue`, and JO-1990 II.4 only removes accents | Keep (snapshot) as `fr.stem.listed-spelling`, flagged secondary-only; ask the user whether to ledger crue/crus/crues as an intended diff |
| O2 | Legacy clore/enclore rectified `il clot`; 1990 rule 4 concerns i and u only; Académie A9C2658 writes il clôt without a 1990 mark | Same as O1 |
| O3 | Legacy rectified infinitive/future `croitre`, `croitrai` | Supported by OQLF-23166 (writes "croitre"); keep |
| O4 | Le Bon Usage § numbers for conjugation rules were not found online | Implementer cites OQLF/Académie/JO [V]; adds § locators from a print copy, or leaves them out (no [U] citation is shipped) |
| O5 | Per-paradigm availability: the core reports a target unavailable only when every paradigm says so, and asks each available paradigm for forms (an available paradigm without forms is a GENERATION_FAILURE) | [M] every French multi-paradigm entry (choir, échoir, faillir, asseoir, ouïr, payer) has the same gaps and flags in each paradigm, so nothing changes; `availability` must still answer per paradigm, never from the union |
| O6 | Dual-auxiliary `condition` text is per form, not per lexeme | Set by the clause from `context.auxiliary` and `lexeme.auxiliaries.length` |
| O7 | Near future / recent past have no verified linkable rule page | Look up OQLF ("futur proche", "passé récent") at implementation; otherwise cite Le Bon Usage [U] and flag |
| R1 | The app re-renders French parts (distractors, question); part features or onsets could drift without changing the snapshot text | The shadow test additionally deep-compares `parts` (minus steps) for the app's 90 verbs (Task 6) |
| R2 | `analysis.alternatives` appears for payer/asseoir/… | Not serialized in the snapshot; check `tests/query.test.ts` and app tests for whole-object equality |
