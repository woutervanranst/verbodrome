# German grammar: rules, defaults and limits

German runs on the staged core (`src/languages/de/`): every form is derived by recorded rules, and every step explains
itself in English and Dutch with its source. The lexical authorities are the inflection tables of the
[DWDS](https://www.dwds.de) (`https://www.dwds.de/lemma/flexion/<lemma>`, with the grammar line of the dictionary entry
`https://www.dwds.de/wb/<lemma>` for auxiliaries and readings) and, as cross-check, the conjugation tables of
[Duden online](https://www.duden.de) (`https://www.duden.de/konjugation/<slug>`, homograph slugs included). The rules
follow grammis (IDS Mannheim: Propädeutische Grammatik, Systematische Grammatik, Grammatik in Fragen und Antworten),
the [Amtliches Regelwerk 2024](https://www.rechtschreibrat.com/DOX/RfdR_Amtliches-Regelwerk_2024.pdf) and, for the
three claims no online authority states, the Duden-Grammatik (Duden 4, 10th ed., 2022) by chapter. Only current
spelling is emitted: never `muß`, `ißt`, `gewußt` or `geschrieen`. A rule is never cited to the scraped corpus.

## How a form is built

- **Classification** (`classify.ts`, `lexicon.ts`), in this order:
  1. `sich …` and anything that is not one word ending in -n are refused (reflexive verbs are not supported yet).
  2. Hints (`classHint`, `stems`, `auxiliary`, `separablePrefix`, `inseparablePrefix`) override what they name. A hint
     that contradicts a listed fact is an `INVALID_HINT` (`gefallen` with `auxiliary: 'sein'`, `separablePrefix: 'be'`).
  3. A listed lemma: the 184 root entries, and the side lists below. A lemma with two classes (bewegen, schaffen, …)
     or two prefix readings (umziehen, übersetzen, …) gives one paradigm per class or reading, each tagged.
  4. Transliteration: `ae oe ue ss` read as `ä ö ü ß` when exactly one reading is a listed lemma (heissen → heißen,
     muessen → müssen); bare vowels are never umlauted (wagen stays wagen).
  5. **Derivatives, from the outside in.** A separable particle (or a stack: wieder + her + stellen) comes off first;
     then an inseparable prefix (be emp ent er ge miss ver zer) or a dual particle read inseparably; what is left is
     analysed the same way until a listed root, a listed derivative or nothing listed remains. missverstehen is miss +
     verstehen, verstehen is ver + stehen: missverstand, missverstanden. ge- is blocked whenever an inseparable prefix
     stands directly before the root, also behind a particle (vorbereitet, abbestellt, einbezogen, anerkannt).
     Compound particles are single list entries, checked at DWDS (überein, hinterher, umher, vorher, auseinander,
     vorwärts, zugute …: stimmt überein, setzt auseinander). A verb whose first part is a noun, an adjective or a verb
     is separable only when it is listed (`particleVerbs`, 64 lemmas checked at DWDS: nimmt teil, lernt kennen, stellt
     bereit, erhält aufrecht, macht wieder gut).
  6. Anything else is a weak verb with initial stress and haben, each an assumption. An inseparable prefix in front of a
     remainder the lexicon does not know is an assumption too (`assume-inseparable`), and so is the decision not to
     split an unlisted word that ends in a listed verb (`assume-unsplit`: heiraten is not hei + raten). There is no
     generic "unknown first part + known verb → separable" rule: it would split heiraten, ratschlagen, wallfahren and
     beinhalten. An unlisted particle verb with a noun or adjective first part therefore comes out wrong (a weak simplex,
     with the assumptions shown) until it is listed or the `separablePrefix` option names its first part; -ieren loans
     are never split (generieren, verifizieren).
- **Not every lookalike is a derivative.** A verb inherits a root's strong forms only when it really is prefix or
  particle + that root. Weak verbs formed from a noun or adjective that only look derived are listed (`noInherit`):
  begleiten (Geleit), verleiden (leid), umringen (Ring), bekneifen, bepreisen, beringen, bescheren, beschwingen,
  erweichen, zerweichen, gehaben, beschaffen, verschaffen, durchweichen, bedingen, bereiten, handhaben, willfahren.
  An inseparable prefix directly before a separable particle makes a denominal weak verb (beantragen, veranlassen,
  bevormunden), unless the rest is a verb of its own (bedauern, behindern, verhindern are be-/ver- + dauern, hindern).
  The list was found by checking every prefix + listed-root lemma DWDS has (686 lemmas) against its DWDS grammar line.
- **Derivatives of the two-paradigm roots** (schaffen, wenden, senden, hängen, wachsen, wiegen, schleifen, bewegen,
  saugen, gären, sieden, backen, spleißen) take only the paradigms their own DWDS entry gives (`derivedParadigms`, 174
  lemmas, each with the auxiliary DWDS gives it): abschaffen weak only, erschaffen strong only, verwenden mixed and
  weak, aufhängen weak with the strong forms as a regional Nebenform. The root's sense glosses ('create', 'wax') never
  carry over. An unrecorded derivative of such a root takes both paradigms, labelled by pattern, with the
  `assume-root-paradigm` assumption.
- **Stems and endings** (`stems.ts`, `paradigms.ts`): the present stem, the listed present2 (du/er vowel change), the
  Präteritum stem, the Partizip II and the Konjunktiv II stem; weak verbs derive -te / -t, strong verbs take the listed
  stems. The short Konjunktiv II forms (kämst, kämt) are emitted only on the stems whose Duden table prints them (41
  verbs; verdürbst, never verdärbst; none for rinnen).
- **Spelling** (`orthography.ts`): schwa after a dental and after obstruent + nasal (arbeitest, atmet,
  bewillkommnete), -t for -st after a sibilant (reist), -el / -er stems (sammle, wandre), ie + e contraction (schrie),
  t + t merging (rät).
- **Compound tenses** (`periphrasis.ts`): eleven chains with haben / sein, werden and würde.
- **Clause** (`clause.ts`): main-clause (verb-second) order; a separable particle goes to the end, stacked particles as
  one word except after wieder (ich stimme überein, ich sage vorher; ich stelle wieder her); the impersonal verbs take
  es.
- **Availability**: modal verbs have no imperative; regnen-type verbs are impersonal; geschehen has third-person forms
  only.

## Labels

- `pattern`: `weak` / `strong` / `mixed` on the paradigms of a two-class verb, `separable` / `inseparable` on the
  readings of a dual-prefix verb, `long` / `short` / `alternate` on cell variants (brenne, kämst, hälfe).
- `condition`: the sense a paradigm or an auxiliary belongs to ('move house' for ich bin umgezogen, 'change clothes'
  for ich habe umgezogen). An auxiliary's own condition replaces the reading's on the compound forms, so a form never
  carries the condition of another reading.
- `usage`: `dated` where DWDS writes "va." or Duden "veraltend" / "veraltet" (schwur, begönne, buk, milk), `literary` for "gehoben"
  (troff). `region: 'south'` only on the sein-perfect of stehen, liegen, sitzen and the strong hängen; a region is
  never inherited by a derivative (aufstehen, verstehen).
- An explicit usage mark in either dictionary (selten, veraltend, veraltet, ugs., landsch.) beats an unmarked listing
  in the other; the order inside a generated table is not evidence. Colloquial forms (ugs.) are not emitted.
- Two-class verbs with a difference in sense keep two paradigms (bewegen, erschrecken, hängen, schaffen, schleifen,
  wiegen, wachsen, senden, wenden, saugen, gären, sieden, spleißen, backen). melken, triefen, dingen, glimmen and
  stieben are one paradigm, the other set tagged (melkte / molk; gemolken first, as Duden's "häufiger", gemelkt
  weak; milkst, milkt, milk dated).
- Konjunktiv II doublets are both emitted with the label the dictionaries give: hülfe / hälfe (Duden "selten
  hälfest"), stände / stünde, begänne / begönne dated, schwämme / schwömme dated (DWDS va.; Duden's "schwömmest, auch
  schwämmest" is recorded as a conflict), verdürbe (Duden) / verdärbe (DWDS only).
- laden's du-imperative is lade only: the table of the modelled lädt set marks lad ugs.

## Side lists (`lexicon.ts`)

| List | Members | What it decides |
|---|---|---|
| `derivativeAuxiliaries`, `shortRootDerivatives` | 194 + 16 derivatives (gefallen, besteigen, befallen, betreten: haben; entstehen, vergehen, verfallen, auferstehen, beitreten, einschlafen: sein; fehlschlagen, schwerfallen: sein; …) | the auxiliary of a derivative, from its DWDS grammar line |
| `derivedParadigms` | 174 derivatives of the two-paradigm roots | the paradigms (and their auxiliaries) of each, from its DWDS entry |
| `inseparableReadings` | 104 lemmas (überzeugen, überleben, übernachten, unterlaufen, …) | a dual particle read as an inseparable prefix, without an assumption |
| `dualPrefixLemmas` | 74 lemmas (umziehen, übersetzen, überfallen, überholen, durchdringen, übernehmen, anerkennen, widerspiegeln, …) | two readings, separable first unless the inseparable one is the common one (übernehmen) |
| `noInherit`, `lookalikes` | 18 + 16 lemmas | not derived from the root they resemble; never split |
| `particleVerbs` | 64 lemmas (bevorstehen, teilnehmen, stattfinden, fernsehen, wahrnehmen, kennenlernen, preisgeben, bereitstellen, bekanntgeben, fertigstellen, aufrechterhalten, wehtun, leidtun, klarkommen, sitzenbleiben, wiedergutmachen …) | a separable first part outside the closed list |
| `weakWithSein`, `impersonalVerbs`, `nonInitialStress` | 48, 6, 13 lemmas | sein with a weak verb (aufwachen, zurückkehren, verunglücken, verhungern, vereinsamen, spazieren …; a particle in front is split); impersonal verbs; no ge- after an unstressed first syllable |
| `shortSubjunctive` | 41 verbs, by stem | the short Konjunktiv II (kämst) only on the stems Duden prints it for |

## Defaults and assumptions

Every assumption comes first in the analysis and names the option that overrides it.

| Default | Rule (assumption) | Overridden by |
|---|---|---|
| an unknown verb is weak | `de.classify.default-weak` | `classHint` + `stems` |
| perfect with haben | `de.classify.default-haben` | `auxiliary` |
| stress on the first syllable (ge-) | `de.classify.default-stress` | `stems.unstressedFirstSyllable` |
| an unknown particle verb is separable | `de.classify.assume-separable` | `inseparablePrefix` |
| an unlisted derivative with an inseparable prefix takes haben | `de.classify.assume-prefix-haben` | `auxiliary` |
| an unlisted particle verb takes its root's auxiliary (general labels only) | `de.classify.assume-root-auxiliary` | `auxiliary` |
| a verb formed from a noun takes haben | `de.classify.default-haben` | `auxiliary` |
| an unrecorded derivative of a two-paradigm root has both paradigms | `de.classify.assume-root-paradigm` | `classHint` |
| an inseparable prefix in front of an unknown remainder | `de.classify.assume-inseparable` | `separablePrefix`, or `stems.unstressedFirstSyllable: false` (beamen → gebeamt) |
| an unlisted word ending in a listed verb is not split | `de.classify.assume-unsplit` | `separablePrefix` |
| `ae oe ue ss` read as `ä ö ü ß` | `de.classify.transliteration` | typing the umlaut or ß |

## Lexicon verification

`src/languages/de/verification.ts` records, per lemma, the pages that were actually opened and read: 824 lemmas (the
184 root entries and every side-list lemma), fetched between 2026-11-24 and 2026-11-27. 493 were read in DWDS and Duden.
The 242 lemmas added in the last round (derivatives of the two-paradigm roots, particle verbs, weak verbs with sein)
were read in their DWDS dictionary entry (`/wb/`, the grammar line), not in a Duden table.

**Secondary source only.** The forms and facts below rest on one authority; each is marked in the form's explanation
(`de.stem.duden-only`, `de.stem.dwds-only`, `de.clause.duden-only`, `de.classify.duden-only`: "Duden prints X; DWDS does
not") and noted in `lexiconNotes`.

| Rests on one dictionary | Marked where |
|---|---|
| the du-imperative tue (DWDS: tu) | `de.stem.duden-only` |
| the Konjunktiv II stöhle (stehlen) and verdürbe (verderben), Duden only; verdärbe and schälte (schelten), DWDS only | `de.stem.duden-only`, `de.stem.dwds-only` |
| the short Konjunktiv II forms of 41 verbs (kämst, kämt, gäbst, führt …), DWDS prints the -est / -et forms only | `de.stem.duden-only` |
| the sein-perfect of stehen, liegen and sitzen in the south | `de.clause.duden-only` |
| ist geschliffen (schleifen, 'slide on an ice track', regional) | `de.clause.duden-only` |
| unterstellen (both readings): DWDS has no inflection table | `de.classify.duden-only` |

**Read in DWDS only** (no Duden conjugation table was found under the plain slug or the homograph slugs Duden's
search listed; sehen, lassen, heißen and schaffen may have one under a slug the search did not show): begeben,
bekneifen, bergen, beschlagen, besteigen, dingen, durchbeißen, durchbiegen, durchfließen, durchgären, durchschießen,
durchschleifen, durchschmelzen, durchspinnen, durchstoßen, durchtreiben, entfahren, entfliegen, entfließen, entglimmen,
entlaufen, entschreiten, entsinken, entspringen, entsteigen, erfließen, erglimmen, erklingen, erliegen, ersaufen,
ertrinken, erwägen, gelingen, glimmen, heißen, hintertreiben, lassen, misslingen, mitteln, saugen, schaffen, scheren,
schmeißen, schmelzen, sehen, sprießen, stieben, triefen, umfangen, umpfeifen, umreißen, umschießen, umsingen,
unterfangen, unterfliegen, unterliegen, verfliegen, verfrieren, verglimmen, vergären, verklingen, verlaufen, versaufen,
verschwellen, verspringen, vollhauen, volllaufen, vollschlagen, widerrufen, widerscheinen, widerspiegeln,
wiederschlagen, wiedertreffen, wägen, zerfallen, zerlaufen, zerspringen, zerstieben, zerweichen, überfließen,
überreiten, überschießen, überschlagen, überschreiben, überspringen, übersteigen, übertragen, überwiegen (88), and
the 242 lemmas of the last round named above.

Where DWDS prints more than is modelled (a weak homograph, a second table, a reflexive-only or regional reading) or
where DWDS and Duden disagree, `lexiconNotes` in `src/languages/de/sources.ts` says so per lemma.

## Rule inventory

80 rules. "print only" marks the claims no online authority states (`printOnly` in `sources.ts`): they cite the
Duden-Grammatik by chapter.

### classify

| Rule | Kind | What it says (English message) | Sources |
|---|---|---|---|
| `de.classify.lexicon` | lexical | {before} is listed in the lexicon as {after, select, weak {a weak verb} strong {a strong verb} mixed {a mixed verb} preteritePresent {a verb conjugated like the modal verbs} irregular {an irregular verb} other {a {after} verb}}. | [DWDS: Flexionstabelle des Lemmas (lemma/flexion)](https://www.dwds.de); [Duden: Konjugationstabelle des Lemmas (cross-check)](https://www.duden.de); [grammis 4071: Flexionsklassen der Verben](https://grammis.ids-mannheim.de/progr@mm/4071) |
| `de.classify.derivative` | rule | {before} is {prefix} + {root}, so it takes the forms of {root}. | [grammis 4071: Flexionsklassen der Verben](https://grammis.ids-mannheim.de/progr@mm/4071); [SG-1285: Explizite Verbderivate: Präfixverben mit be-, ent-, er-, ver-, zer-](https://grammis.ids-mannheim.de/systematische-grammatik/1285); [grammis F-109: Verbkomposita und Präverbfügungen: trennbare und untrennbare Verben](https://grammis.ids-mannheim.de/fragen/109) |
| `de.classify.separable` | rule | {particle}- is a separable particle: it is stressed and stands apart from the conjugated verb. | [grammis F-109: Verbkomposita und Präverbfügungen: trennbare und untrennbare Verben](https://grammis.ids-mannheim.de/fragen/109); [grammis 4071: Flexionsklassen der Verben: Partizip II bei festem Präfix und abtrennbarem Präverb](https://grammis.ids-mannheim.de/progr@mm/4071); [Amtliches Regelwerk 2024: § 34 (Zusammensetzungen mit Verben: Partikeln)](https://www.rechtschreibrat.com/DOX/RfdR_Amtliches-Regelwerk_2024.pdf) |
| `de.classify.inseparable` | rule | {prefix}- is an inseparable prefix here: it always stays on the verb. | [SG-1285: Explizite Verbderivate: Präfixverben mit be-, ent-, er-, ver-, zer-](https://grammis.ids-mannheim.de/systematische-grammatik/1285); [grammis F-109: Verbkomposita und Präverbfügungen: trennbare und untrennbare Verben](https://grammis.ids-mannheim.de/fragen/109); [grammis 4071: Flexionsklassen der Verben: Partizip II bei festem Präfix und abtrennbarem Präverb](https://grammis.ids-mannheim.de/progr@mm/4071) |
| `de.classify.assume-separable` | assumption | {particle, select, durch {Assuming {particle}- is stressed and separable, because the verb is not in the lexicon; unstressed, it would be an inseparable prefix; the option inseparablePrefix overrides this.} hinter {Assuming {particle}- is stressed and separable, because the verb is not in the lexicon; unstressed, it would be an inseparable prefix; the option inseparablePrefix overrides this.} über {Assuming {particle}- is stressed and separable, because the verb is not in the lexicon; unstressed, it would be an inseparable prefix; the option inseparablePrefix overrides this.} um {Assuming {particle}- is stressed and separable, because the verb is not in the lexicon; unstressed, it would be an inseparable prefix; the option inseparablePrefix overrides this.} unter {Assuming {particle}- is stressed and separable, because the verb is not in the lexicon; unstressed, it would be an inseparable prefix; the option inseparablePrefix overrides this.} voll {Assuming {particle}- is stressed and separable, because the verb is not in the lexicon; unstressed, it would be an inseparable prefix; the option inseparablePrefix overrides this.} wider {Assuming {particle}- is stressed and separable, because the verb is not in the lexicon; unstressed, it would be an inseparable prefix; the option inseparablePrefix overrides this.} wieder {Assuming {particle}- is stressed and separable, because the verb is not in the lexicon; unstressed, it would be an inseparable prefix; the option inseparablePrefix overrides this.} other {Assuming {particle}- is a separable particle, because the verb is not in the lexicon; the option inseparablePrefix overrides this.}} | [grammis F-109: Verbkomposita und Präverbfügungen: trennbare und untrennbare Verben](https://grammis.ids-mannheim.de/fragen/109); [grammis 4071: Flexionsklassen der Verben: Partizip II bei festem Präfix und abtrennbarem Präverb](https://grammis.ids-mannheim.de/progr@mm/4071) |
| `de.classify.denominal` | rule, print only | {before} is formed from a noun with {prefix}- (the rest starts like a particle but is not a verb): it is weak and inseparable. | Duden-Grammatik: Das Verb: Flexion, Präfix- und Partikelverben |
| `de.classify.not-derived` | rule | {before} is not formed from {root}: it is conjugated on its own. | [DWDS: Flexionstabelle des Lemmas (lemma/flexion)](https://www.dwds.de); [Duden: Konjugationstabelle des Lemmas (cross-check)](https://www.duden.de) |
| `de.classify.default-weak` | assumption | Assuming a weak verb, because the verb is not in the lexicon; the option classHint (with stems) overrides this. | [grammis 4071: Flexionsklassen der Verben: die schwache Flexion ist produktiv](https://grammis.ids-mannheim.de/progr@mm/4071) |
| `de.classify.default-haben` | assumption | Assuming the perfect is formed with haben; the option auxiliary overrides this. | [SG-1219: Bestimmung des Perfekthilfsverbs](https://grammis.ids-mannheim.de/systematische-grammatik/1219) |
| `de.classify.default-stress` | assumption | Assuming the stress is on the first syllable, so Partizip II takes ge-; the option stems.unstressedFirstSyllable overrides this. | [grammis 4071: Flexionsklassen der Verben: Partizip II mit ge-](https://grammis.ids-mannheim.de/progr@mm/4071) |
| `de.classify.ieren` | rule | Verbs in -ieren are stressed on -ier-, so Partizip II has no ge-. | [grammis 4071: Flexionsklassen der Verben: Partizip II ohne ge-](https://grammis.ids-mannheim.de/progr@mm/4071); [SG-1283: Partizip II](https://grammis.ids-mannheim.de/systematische-grammatik/1283) |
| `de.classify.assume-root-auxiliary` | assumption | Assuming {before} forms its perfect with the same auxiliary as {root}; the option auxiliary overrides this. | [SG-1219: Bestimmung des Perfekthilfsverbs](https://grammis.ids-mannheim.de/systematische-grammatik/1219) |
| `de.classify.assume-prefix-haben` | assumption | Assuming {before} forms its perfect with haben, as most verbs with an inseparable prefix do; the option auxiliary overrides this. | [SG-1219: Bestimmung des Perfekthilfsverbs](https://grammis.ids-mannheim.de/systematische-grammatik/1219); [SG-1285: Explizite Verbderivate: Präfixverben mit be-, ent-, er-, ver-, zer-](https://grammis.ids-mannheim.de/systematische-grammatik/1285) |
| `de.classify.unseparated` | rule | {particle}- is stressed but stays on the verb in this reading. | [grammis F-109: Verbkomposita und Präverbfügungen: trennbare und untrennbare Verben](https://grammis.ids-mannheim.de/fragen/109); [DWDS: Flexionstabelle des Lemmas (lemma/flexion)](https://www.dwds.de); [Duden: Konjugationstabelle des Lemmas (cross-check)](https://www.duden.de) |
| `de.classify.assume-root-paradigm` | assumption | Assuming {before} has both conjugations of {root}, because the lexicon does not record which one it takes; the option classHint overrides this. | [grammis 4071: Flexionsklassen der Verben](https://grammis.ids-mannheim.de/progr@mm/4071); [DWDS: Flexionstabelle des Lemmas (lemma/flexion)](https://www.dwds.de); [Duden: Konjugationstabelle des Lemmas (cross-check)](https://www.duden.de) |
| `de.classify.assume-inseparable` | assumption | Assuming {prefix}- is an inseparable prefix here, because the rest of the verb is not in the lexicon; the option separablePrefix overrides this, or stems.unstressedFirstSyllable: false when the verb has no prefix at all. | [SG-1285: Explizite Verbderivate: Präfixverben mit be-, ent-, er-, ver-, zer-](https://grammis.ids-mannheim.de/systematische-grammatik/1285); [grammis F-109: Verbkomposita und Präverbfügungen: trennbare und untrennbare Verben](https://grammis.ids-mannheim.de/fragen/109) |
| `de.classify.assume-unsplit` | assumption | Assuming {before} is one word and not split before {root}, because the lexicon does not list it as a particle verb; the option separablePrefix overrides this. | [grammis F-109: Verbkomposita und Präverbfügungen: trennbare und untrennbare Verben](https://grammis.ids-mannheim.de/fragen/109); [grammis 4071: Flexionsklassen der Verben](https://grammis.ids-mannheim.de/progr@mm/4071) |
| `de.classify.particle-verb` | lexical | {before} is listed as a particle verb: {particle} is its separable first part. | [grammis F-109: Verbkomposita und Präverbfügungen: trennbare und untrennbare Verben](https://grammis.ids-mannheim.de/fragen/109); [DWDS: Flexionstabelle des Lemmas (lemma/flexion)](https://www.dwds.de); [Duden: Konjugationstabelle des Lemmas (cross-check)](https://www.duden.de) |
| `de.classify.duden-only` | lexical | {before} is checked in Duden only: DWDS has no table for it. | [Duden: Konjugationstabelle des Lemmas](https://www.duden.de) |
| `de.classify.transliteration` | assumption | Reading {written} as {read}: ss stands for ß, and ae, oe, ue for ä, ö, ü (no option overrides this: type ß or the umlaut). | [Amtliches Regelwerk 2024: § 25 E2 (ss für ß)](https://www.rechtschreibrat.com/DOX/RfdR_Amtliches-Regelwerk_2024.pdf) |
| `de.classify.hint` | rule | As requested, {hint} is {value}. | [grammis 4071: Flexionsklassen der Verben](https://grammis.ids-mannheim.de/progr@mm/4071) |

### stem

| Rule | Kind | What it says (English message) | Sources |
|---|---|---|---|
| `de.stem.present` | rule | Drop the infinitive ending of {before}: the stem is {after}-. | [grammis 4071: Verbale Stammparadigmen](https://grammis.ids-mannheim.de/progr@mm/4071) |
| `de.stem.present2` | lexical | Strong verbs change their vowel in the du and er forms: {before}- becomes {after}-. | [grammis 4074: Starke Verben: Vokalwechsel im Präsens](https://grammis.ids-mannheim.de/progr@mm/4074); [DWDS: Flexionstabelle des Lemmas (lemma/flexion)](https://www.dwds.de); [Duden: Konjugationstabelle des Lemmas (cross-check)](https://www.duden.de) |
| `de.stem.present-singular` | lexical | This verb has its own stem in the singular of the Präsens: {before}- becomes {after}-. | [grammis 4075: Flexion der Modalverben](https://grammis.ids-mannheim.de/progr@mm/4075); [DWDS: Flexionstabelle des Lemmas (lemma/flexion)](https://www.dwds.de); [Duden: Konjugationstabelle des Lemmas (cross-check)](https://www.duden.de) |
| `de.stem.preterite` | lexical | The Präteritum stem of {before} is {after}-. | [grammis 4074: Starke Verben: Ablaut](https://grammis.ids-mannheim.de/progr@mm/4074); [DWDS: Flexionstabelle des Lemmas (lemma/flexion)](https://www.dwds.de); [Duden: Konjugationstabelle des Lemmas (cross-check)](https://www.duden.de) |
| `de.stem.subjunctive-umlaut` | rule | Konjunktiv II: the Präteritum stem with Umlaut, {before}- becomes {after}-. | [SG-439: Konjunktiv Präteritum](https://grammis.ids-mannheim.de/systematische-grammatik/439); [Amtliches Regelwerk 2024: § 13 (ä), § 16 (äu)](https://www.rechtschreibrat.com/DOX/RfdR_Amtliches-Regelwerk_2024.pdf) |
| `de.stem.subjunctive-plain` | rule | Konjunktiv II keeps the Präteritum stem {after}-: it has no a, o or u to take an Umlaut. | [SG-439: Konjunktiv Präteritum](https://grammis.ids-mannheim.de/systematische-grammatik/439) |
| `de.stem.subjunctive-lexical` | lexical | The Konjunktiv II stem of {before} is {after}-. | [DWDS: Flexionstabelle des Lemmas (lemma/flexion)](https://www.dwds.de); [Duden: Konjugationstabelle des Lemmas (cross-check)](https://www.duden.de) |
| `de.stem.subjunctive-weak` | rule | Konjunktiv II of a weak Präteritum is the same as the Präteritum, on the stem {after}-. | [grammis 4073: Schwache Verben](https://grammis.ids-mannheim.de/progr@mm/4073); [SG-439: Konjunktiv Präteritum](https://grammis.ids-mannheim.de/systematische-grammatik/439) |
| `de.stem.imperative-i` | rule | Verbs whose du and er forms change the vowel to i or ie keep {after}- in the du-imperative, without -e. | [SG-1275: Imperativ Singular: mit Vokalwechsel und ohne auslautendes e](https://grammis.ids-mannheim.de/systematische-grammatik/1275); [grammis 4074: Starke Verben](https://grammis.ids-mannheim.de/progr@mm/4074) |
| `de.stem.participle` | lexical | The Partizip II stem of {before} is {after}-. | [grammis 4074: Starke Verben: Stammformen](https://grammis.ids-mannheim.de/progr@mm/4074); [DWDS: Flexionstabelle des Lemmas (lemma/flexion)](https://www.dwds.de); [Duden: Konjugationstabelle des Lemmas (cross-check)](https://www.duden.de) |
| `de.stem.ge-prefix` | rule | Partizip II takes ge- because the first syllable is stressed: {after}-. | [grammis 4071: Bildung des Partizip II](https://grammis.ids-mannheim.de/progr@mm/4071); [SG-1283: Partizip II](https://grammis.ids-mannheim.de/systematische-grammatik/1283) |
| `de.stem.ge-after-particle` | rule | Partizip II takes ge- before the stem, behind the particle {particle}-: {after}-. | [grammis 4071: Flexionsklassen der Verben: Partizip II bei festem Präfix und abtrennbarem Präverb](https://grammis.ids-mannheim.de/progr@mm/4071); [SG-1283: Partizip II](https://grammis.ids-mannheim.de/systematische-grammatik/1283) |
| `de.stem.ge-blocked-prefix` | rule | No ge-: the unstressed prefix {prefix}- stands right before the stem. | [grammis 4071: Flexionsklassen der Verben: Partizip II bei festem Präfix und abtrennbarem Präverb](https://grammis.ids-mannheim.de/progr@mm/4071); [SG-1283: Partizip II](https://grammis.ids-mannheim.de/systematische-grammatik/1283) |
| `de.stem.ge-blocked-stress` | rule | No ge-: the first syllable of the verb is not stressed. | [SG-1283: Partizip II](https://grammis.ids-mannheim.de/systematische-grammatik/1283) |
| `de.stem.lexical-cell` | lexical | {before} is irregular here: the whole form is {after}. | [DWDS: Flexionstabelle des Lemmas (lemma/flexion)](https://www.dwds.de); [Duden: Konjugationstabelle des Lemmas (cross-check)](https://www.duden.de) |
| `de.stem.duden-only` | lexical | Duden prints {after}; DWDS does not. | [Duden: Konjugationstabelle des Lemmas](https://www.duden.de) |
| `de.stem.dwds-only` | lexical | DWDS prints {after}; Duden does not. | [DWDS: Flexionstabelle des Lemmas (lemma/flexion)](https://www.dwds.de) |

### end

| Rule | Kind | What it says (English message) | Sources |
|---|---|---|---|
| `de.end.present` | rule | Präsens, {person} {number}: add -{ending}. | [SG-439: Indikativ Präsens](https://grammis.ids-mannheim.de/systematische-grammatik/439); [grammis 4070: Verbflexion nach Person und Numerus](https://grammis.ids-mannheim.de/progr@mm/4070) |
| `de.end.preterite-present` | rule | {ending, select, st {Modal verbs and wissen add -st in the du-form of the Präsens.} other {Modal verbs and wissen have no ending in the ich and er forms of the Präsens.}} | [grammis 4075: Flexion der Modalverben: endungslose 1. und 3. Person Singular](https://grammis.ids-mannheim.de/progr@mm/4075) |
| `de.end.preterite-weak` | rule | Weak Präteritum: add -{ending}, that is -te and the personal ending. | [SG-439: Indikativ Präteritum: schwache Verben](https://grammis.ids-mannheim.de/systematische-grammatik/439); [grammis 4073: Schwache Verben](https://grammis.ids-mannheim.de/progr@mm/4073) |
| `de.end.preterite-strong` | rule | {ending, select, en {Strong Präteritum: add -en.} t {Strong Präteritum: add -t.} st {Strong Präteritum: add -st.} other {Strong Präteritum: the ich and er forms have no ending.}} | [SG-439: Indikativ Präteritum: starke Verben](https://grammis.ids-mannheim.de/systematische-grammatik/439) |
| `de.end.preterite-2sg` | rule | The du-form of the strong Präteritum after {before}- has two endings, -est and -st: {after}. | [SG-439: e-Einfügung in der 2. Person Singular Präteritum](https://grammis.ids-mannheim.de/systematische-grammatik/439); [DWDS: Flexionstabelle des Lemmas (lemma/flexion)](https://www.dwds.de); [Duden: Konjugationstabelle des Lemmas (cross-check)](https://www.duden.de) |
| `de.end.subjunctive-i` | rule | Konjunktiv I: the stem of the infinitive plus -{ending}. | [SG-439: Konjunktiv Präsens](https://grammis.ids-mannheim.de/systematische-grammatik/439) |
| `de.end.subjunctive-ii` | rule | Konjunktiv II: add -{ending} to the Konjunktiv II stem. | [SG-439: Konjunktiv Präteritum](https://grammis.ids-mannheim.de/systematische-grammatik/439) |
| `de.end.subjunctive-ii-short` | rule | In the du and ihr forms of Konjunktiv II the e of the ending may be dropped: {after}. | [grammis 4119: Schwa im Konjunktiv](https://grammis.ids-mannheim.de/progr@mm/4119); [Duden: Konjugationstabelle des Lemmas (Konjunktiv II, du- und ihr-Form)](https://www.duden.de) |
| `de.end.imperative-singular` | rule | {ending, select, e {du-imperative: the stem plus -e.} other {du-imperative: the stem without an ending.}} | [SG-1275: Imperativ Singular](https://grammis.ids-mannheim.de/systematische-grammatik/1275); [Duden Sprachwissen: Bildung des Imperativs](https://www.duden.de/sprachwissen/sprachratgeber) |
| `de.end.imperative-plural` | rule | ihr-imperative: the ihr-form of the Präsens without the pronoun. | [SG-1275: Imperativ Plural](https://grammis.ids-mannheim.de/systematische-grammatik/1275) |
| `de.end.imperative-polite` | rule | wir- and Sie-imperative: the plural form of the Präsens, followed by the pronoun. | [SG-290: Distanzform und Adhortativform](https://grammis.ids-mannheim.de/systematische-grammatik/290) |
| `de.end.infinitive` | rule | The infinitive is the stem plus -en (-n after -el, -er and a vowel). | [grammis 4071: Verbale Stammparadigmen](https://grammis.ids-mannheim.de/progr@mm/4071) |
| `de.end.participle-weak` | rule | A weak Partizip II ends in -t. | [SG-1283: Partizip II](https://grammis.ids-mannheim.de/systematische-grammatik/1283) |
| `de.end.participle-strong` | rule | A strong Partizip II ends in -en (-n after a vowel). | [SG-1283: Partizip II](https://grammis.ids-mannheim.de/systematische-grammatik/1283) |
| `de.end.present-participle` | rule, print only | Partizip I: the stem of the infinitive plus -end. | Duden-Grammatik: Das Verb: Flexion, Partizip I |

### orth

| Rule | Kind | What it says (English message) | Sources |
|---|---|---|---|
| `de.orth.ie-contraction` | rule | After -ie the e of the ending is dropped: {before} becomes {after}. | [Amtliches Regelwerk 2024: § 19](https://www.rechtschreibrat.com/DOX/RfdR_Amtliches-Regelwerk_2024.pdf) |
| `de.orth.el-er-schwa` | rule | After unstressed -el or -er one e is dropped, from the ending or (with -el) from the stem: {before} becomes {after}. | [grammis 4119: Verbstämme auf -el und -er](https://grammis.ids-mannheim.de/progr@mm/4119); [DWDS: Flexionstabelle des Lemmas (lemma/flexion)](https://www.dwds.de); [Duden: Konjugationstabelle des Lemmas (cross-check)](https://www.duden.de) |
| `de.orth.el-elision` | rule | Before the ending -e the e of -el or -er may be dropped: {before} becomes {after}. | [grammis 4119: Verbstämme auf -el und -er: sammele, sammle](https://grammis.ids-mannheim.de/progr@mm/4119); [DWDS: Flexionstabelle des Lemmas (lemma/flexion)](https://www.dwds.de); [Duden: Konjugationstabelle des Lemmas (cross-check)](https://www.duden.de) |
| `de.orth.schwa-dental` | rule | After d or t an e is inserted before the ending: {before} becomes {after}. | [grammis 4073: Schwache Verben](https://grammis.ids-mannheim.de/progr@mm/4073); [grammis 4119: Schwa nach Dentalen](https://grammis.ids-mannheim.de/progr@mm/4119); [SG-439: Indikativ Präsens: e-Einfügung](https://grammis.ids-mannheim.de/systematische-grammatik/439) |
| `de.orth.schwa-nasal` | rule | After a consonant followed by m or n an e is inserted before the ending: {before} becomes {after}. | [grammis 4073: Schwache Verben](https://grammis.ids-mannheim.de/progr@mm/4073); [grammis 4119: Schwa nach Obstruent und Nasal](https://grammis.ids-mannheim.de/progr@mm/4119); [SG-439: Indikativ Präsens: e-Einfügung](https://grammis.ids-mannheim.de/systematische-grammatik/439) |
| `de.orth.t-merge` | rule, print only | A changed stem that ends in t takes no second t in the er-form: {before} becomes {after}. | [grammis 4119: Schwa bei den Flexionsmarkern](https://grammis.ids-mannheim.de/progr@mm/4119); Duden-Grammatik: Das Verb: Flexion, Präsens starker Verben |
| `de.orth.sibilant-2sg` | rule | After s, ß, z or x the du-ending -st loses its s: {before} becomes {after}. | [Amtliches Regelwerk 2024: § 26](https://www.rechtschreibrat.com/DOX/RfdR_Amtliches-Regelwerk_2024.pdf); [grammis 4119: Schwa bei den Flexionsmarkern](https://grammis.ids-mannheim.de/progr@mm/4119) |

### periphrasis

| Rule | Kind | What it says (English message) | Sources |
|---|---|---|---|
| `de.periphrasis.perfect` | rule | Perfekt: the Präsens of {auxiliary} plus Partizip II. | [SG-232: Formenbestand des deutschen Tempussystems](https://grammis.ids-mannheim.de/systematische-grammatik/232); [SG-1219: Bestimmung des Perfekthilfsverbs](https://grammis.ids-mannheim.de/systematische-grammatik/1219) |
| `de.periphrasis.pluperfect` | rule | Plusquamperfekt: the Präteritum of {auxiliary} plus Partizip II. | [SG-232: Formenbestand des deutschen Tempussystems](https://grammis.ids-mannheim.de/systematische-grammatik/232); [SG-1219: Bestimmung des Perfekthilfsverbs](https://grammis.ids-mannheim.de/systematische-grammatik/1219) |
| `de.periphrasis.future` | rule | Futur I: the Präsens of werden plus the infinitive. | [SG-232: Formenbestand des deutschen Tempussystems](https://grammis.ids-mannheim.de/systematische-grammatik/232) |
| `de.periphrasis.future-perfect` | rule | Futur II: the Präsens of werden, Partizip II and the infinitive {auxiliary}. | [SG-232: Formenbestand des deutschen Tempussystems](https://grammis.ids-mannheim.de/systematische-grammatik/232); [SG-1219: Bestimmung des Perfekthilfsverbs](https://grammis.ids-mannheim.de/systematische-grammatik/1219) |
| `de.periphrasis.subjunctive-perfect` | rule | Konjunktiv I Perfekt: the Konjunktiv I of {auxiliary} plus Partizip II. | [SG-232: Formenbestand des deutschen Tempussystems](https://grammis.ids-mannheim.de/systematische-grammatik/232); [SG-439: Formenbestand: Konjunktiv](https://grammis.ids-mannheim.de/systematische-grammatik/439); [SG-1219: Bestimmung des Perfekthilfsverbs](https://grammis.ids-mannheim.de/systematische-grammatik/1219) |
| `de.periphrasis.subjunctive-pluperfect` | rule | Konjunktiv II Plusquamperfekt: the Konjunktiv II of {auxiliary} plus Partizip II. | [SG-232: Formenbestand des deutschen Tempussystems](https://grammis.ids-mannheim.de/systematische-grammatik/232); [SG-439: Formenbestand: Konjunktiv](https://grammis.ids-mannheim.de/systematische-grammatik/439); [SG-1219: Bestimmung des Perfekthilfsverbs](https://grammis.ids-mannheim.de/systematische-grammatik/1219) |
| `de.periphrasis.subjunctive-future` | rule | Konjunktiv I Futur I: the Konjunktiv I of werden plus the infinitive. | [SG-232: Formenbestand des deutschen Tempussystems](https://grammis.ids-mannheim.de/systematische-grammatik/232); [SG-439: Formenbestand: Konjunktiv](https://grammis.ids-mannheim.de/systematische-grammatik/439) |
| `de.periphrasis.subjunctive-future-perfect` | rule | Konjunktiv I Futur II: the Konjunktiv I of werden, Partizip II and the infinitive {auxiliary}. | [SG-232: Formenbestand des deutschen Tempussystems](https://grammis.ids-mannheim.de/systematische-grammatik/232); [SG-439: Formenbestand: Konjunktiv](https://grammis.ids-mannheim.de/systematische-grammatik/439); [SG-1219: Bestimmung des Perfekthilfsverbs](https://grammis.ids-mannheim.de/systematische-grammatik/1219) |
| `de.periphrasis.conditional` | rule | würde-form: the Konjunktiv II of werden (würde) plus the infinitive. | [SG-312: Würde-Formen: Konjunktiv Präteritum von werden + Infinitiv vom Voll- oder Modalverb](https://grammis.ids-mannheim.de/systematische-grammatik/312); [grammis F-162: Der Konjunktiv und die würde-Form](https://grammis.ids-mannheim.de/fragen/162) |
| `de.periphrasis.conditional-perfect` | rule | würde-form of the past: the Konjunktiv II of werden (würde), Partizip II and the infinitive {auxiliary}. | [SG-312: Würde-Formen: Konjunktiv Präteritum von werden + Infinitiv vom Voll- oder Modalverb](https://grammis.ids-mannheim.de/systematische-grammatik/312); [SG-1219: Bestimmung des Perfekthilfsverbs](https://grammis.ids-mannheim.de/systematische-grammatik/1219) |
| `de.periphrasis.infinitive-perfect` | rule | Infinitiv Perfekt: Partizip II plus the infinitive {auxiliary}. | [SG-232: Formenbestand des deutschen Tempussystems](https://grammis.ids-mannheim.de/systematische-grammatik/232); [SG-1219: Bestimmung des Perfekthilfsverbs](https://grammis.ids-mannheim.de/systematische-grammatik/1219) |

### clause

| Rule | Kind | What it says (English message) | Sources |
|---|---|---|---|
| `de.clause.subject` | rule | Main clause: the subject, then the conjugated verb; the other verb forms go to the end. | [grammis VG-2269: Satzklammer: linke und rechte Satzklammer, Verbpartikel](https://grammis.ids-mannheim.de/vggf/2269) |
| `de.clause.particle-final` | rule | The separable particle {particle} goes to the end of the clause. | [grammis VG-2269: Satzklammer: linke und rechte Satzklammer, Verbpartikel](https://grammis.ids-mannheim.de/vggf/2269); [Amtliches Regelwerk 2024: § 34](https://www.rechtschreibrat.com/DOX/RfdR_Amtliches-Regelwerk_2024.pdf) |
| `de.clause.particle-attached` | rule | The particle {particle} is written together with {before}: {after}. | [Amtliches Regelwerk 2024: § 34](https://www.rechtschreibrat.com/DOX/RfdR_Amtliches-Regelwerk_2024.pdf); [grammis 4071: Flexionsklassen der Verben: Partizip II bei festem Präfix und abtrennbarem Präverb](https://grammis.ids-mannheim.de/progr@mm/4071) |
| `de.clause.imperative-pronoun` | rule | In this imperative the pronoun {pronoun} follows the verb and cannot be left out. | [SG-290: Distanzform und Adhortativform](https://grammis.ids-mannheim.de/systematische-grammatik/290) |
| `de.clause.impersonal-es` | rule | Weather verbs have es as their subject: {before} becomes {after}. | [Duden: Konjugationstabelle regnen (unpersönlich)](https://www.duden.de) |
| `de.clause.duden-only` | lexical | Only Duden prints this auxiliary here, DWDS does not. | [Duden: Konjugationstabelle des Lemmas (Perfekt: habe/bin)](https://www.duden.de) |

### avail

| Rule | Kind | What it says (English message) | Sources |
|---|---|---|---|
| `de.avail.third-person-only` | unavailable | This verb is only used in the third person. | [Duden: Konjugationstabelle geschehen (1. und 2. Person: –)](https://www.duden.de); Duden-Grammatik: Das Verb: Flexion, defektive Verben |
| `de.avail.no-imperative` | unavailable | This verb has no imperative. | [grammis 4075: Flexion der Modalverben](https://grammis.ids-mannheim.de/progr@mm/4075); [SG-380: Modalverb: bilden keinen Imperativ](https://grammis.ids-mannheim.de/systematische-grammatik/380); [Duden Sprachwissen: Modalverben und ihre Bedeutung](https://www.duden.de/sprachwissen/sprachratgeber) |
| `de.avail.impersonal` | unavailable | Weather verbs have only the es-form. | [Duden: Konjugationstabelle regnen (unpersönlich)](https://www.duden.de) |

## Corpus

139 pages, 92 cells each (12,788 cells), compared with every form of two queries per verb: the default query answers
every cell but the Sie-imperative, a `subject: '2.formal'` imperative query answers that one (`scripts/corpus/`). A
page cell lists its forms row by row; every row must be among the engine's forms. The shared extra-forms guard
(`requireTaggedExtras`) is on: a generated form beyond the page's must carry a tag. German's `acceptsUntagged`
(`scripts/corpus/languages/de.ts`) excuses a form told apart by its condition (the auxiliary of fliehen, fahren,
schieben) and the reviewed preferred forms the page lacks because it prints only the second one (`reviewedUntagged`,
30: the -est Präteritum after d / t, brenn, kenn, nenn, renn, bekenn, hab, and hülfe); `tests/de/corpus-guards.test.ts`
pins the 30 and requires each to be generated, so a new one fails the corpus test and a vanished one fails the pin.
Two more guards there: every form after the preferred one of a target carries a pattern, condition, region or
non-standard usage, and no generated form is a spelling the 1996 reform replaced.

Remaps (the page prints the wrong tense name over a whole block; 4,170 cells):

| Heading | Target | Source |
|---|---|---|
| Konjunktiv II / Präsens | subjunctive past (Konjunktiv Präteritum: gäbe) | [grammis SG-439](https://grammis.ids-mannheim.de/systematische-grammatik/439) |
| Konjunktiv II / Futur I | conditional present (würde + Infinitiv) | [grammis SG-312](https://grammis.ids-mannheim.de/systematische-grammatik/312) |
| Konjunktiv I / Präteritum | subjunctive perfect (habe gebacken) | [grammis SG-439](https://grammis.ids-mannheim.de/systematische-grammatik/439) |
| Konjunktiv II / Präteritum | subjunctive pluperfect (hätte gebacken) | [grammis SG-439](https://grammis.ids-mannheim.de/systematische-grammatik/439) |
| Konjunktiv II / Futur II | conditional past (würde gebacken haben) | [grammis SG-312](https://grammis.ids-mannheim.de/systematische-grammatik/312) |

Corrections (`scripts/corpus/corrections/de.ts`; 416 records, 14,031 form expectations and 84 unavailable cells after
them):

| # | Page | Correct | Cells | Source |
|---|---|---|---|---|
| C1 | the pre-1996 ß spelling beside the ss form (muß, ißt, gewußt, laß, müßte) | the ss form only | 165 | Amtliches Regelwerk 2024 |
| C2 | ihr bewegte | ihr bewegtet | 2 | DWDS bewegen |
| C3 | sie beginne, gerinne, gewinne (Konjunktiv I) | sie beginnen … | 3 | grammis SG-439 |
| C4 | wir schworen (Konjunktiv I) | wir schwören | 1 | grammis SG-439 |
| C5 | sein wir, sein Sie | seien wir, seien Sie | 2 | grammis SG-290 |
| C6 | wir / ihr / Sie imperatives of the modal verbs | unavailable | 18 | Duden Sprachwissen, Modalverben |
| C7 | ich / du / wir / ihr forms of geschehen in the compound tenses, its wir / Sie imperative | unavailable | 42 | Duden geschehen |
| C8 | ich bin erschreckt (weak, transitive) | ich habe erschreckt | 43 | DWDS erschrecken |
| C9 | ich bin gewachst (weak, 'wax') | ich habe gewachst | 43 | DWDS wachsen |
| C10 | ich schriee, du schrieest … (Konjunktiv II) | ich schrie, du schriest … | 6 | DWDS schreien |
| C11 | the würde-forms of the modal verbs left empty | ich würde können, ich würde gekonnt haben … | 72 | grammis SG-312 |
| C12 | the bare du-imperative of 19 d/t-stem verbs (find, halt, lad, lad ein, lad aus), which DWDS marks ugs. | finde, halte, lade | 19 | DWDS, per lemma |
| C13 | du erloschest beside du erloschst | du erloschst | 1 | DWDS erlöschen |

müssen's ihr-imperative falls under C1 and C6 and is one record. For laden, einladen and ausladen the DWDS table of
the modelled lädt set marks lad ugs. (the table of the ladet set prints it unmarked).

## Shared Germanic helpers (`src/languages/shared/germanic.ts`)

| Shared (same mechanism, data per language) | What German passes in | What Dutch passes in |
|---|---|---|
| `splitDerivative(lemma, tables)`, `isPlausibleRoot(root, tables)`: closed particle and prefix lists, longest match, particle then prefix, a plausible remainder (vowel letter, an onset from the closed list) | `germanParticles`: the separable, dual and inseparable lists, the onsets, the vowel letters `[aeiouyäöü]` and the digraph `qu` | not used: Dutch judges a remainder by its lexicon and its own spelling rules (`spelledPrefix` in `nl/lexicon.ts`: openen is not op + enen, naaien not na + aien) |
| `placeParticle(words, particle)`: a separable particle to the end of a verb-second main clause | the lexeme's particle (several words for a stack: wieder her) | the lexeme's particle, after the unstressed prefix of the rest is on the verb (uit + verkocht) |
| `paradigmFork(choices)`: several paradigms of one lemma as tagged outcomes | the paradigms of a two-class or dual-prefix lemma | the readings of an ambiguous prefix verb (voorkomen, bedelen) |

What stays per language: the ge- rule (German blocks it by stress and inseparable prefixes, Dutch also writes geë-),
the weak dental suffix (German -te with schwa after a dental; Dutch 't kofschip), stem spelling (Dutch respells open
and closed syllables), the principal parts and the imperative. The German outside-in analysis (`analyseBase` in
`classify.ts`), the denominal rule, the lookalike and no-inherit lists and the transliteration are German policy.

## Out of scope

- The passive, reflexive verbs (`sich waschen` is refused; a verb DWDS gives only reflexively, such as überschneiden,
  is conjugated without the pronoun), the Ersatzinfinitiv, subordinate-clause order, questions and negation, the
  zu-infinitive.
- Old spelling and colloquial forms (DWDS ugs.): never emitted.
- Regional forms beyond the southern sein-perfect of stehen, liegen, sitzen and hängen.
- The tense-concept equivalence map (planned separately).

## Limits

- A homograph's second paradigm is modelled only where the lexicon lists it; DWDS's weak ¹weichen, ²quellen,
  ²schwellen, ¹verlöschen, ²heißen, ³raten, ²winden, ²backen, the weak tables of fechten and flechten and the strong
  bedang / beritt are not (`lexiconNotes`). A derivative inherits the modelled homograph only (verfechten: verfocht,
  not also verfechtete).
- Regional and colloquial separable readings DWDS prints for hinterlassen and hintergehen, and the reflexive separable
  übersehen, are not modelled; überbinden (Swiss: band über, überbunden) and the second participle durchfroren are not
  either.
- An unlisted derivative's auxiliary is an assumption (haben behind an inseparable prefix, the root's behind a
  particle, with general labels only); the `auxiliary` option overrides it.
- **Separable verbs outside the lists.** A particle verb whose first part is a noun, an adjective or a verb is
  separable only when `particleVerbs` lists it; any other (an unlisted counterpart of teilnehmen or bereitstellen)
  comes out as a weak verb with its assumptions shown (`assume-unsplit`, or `assume-inseparable` for a be-/ge- start),
  until the `separablePrefix` option names its first part. A generic split would be wrong for heiraten, ratschlagen,
  wallfahren and beinhalten. rückwärts is not a list particle (DWDS prints no forms for rückwärtsfahren).
- Derivatives of the two-paradigm roots: einhängen and umhängen keep the weak paradigm only (DWDS's hing ein and the
  landschaftlich umhing are not modelled); a derivative DWDS does not have takes both paradigms by assumption.
- erbleichen's strong Nebenform (erblich, erblichen), danksagen (dankgesagt) and notlanden (notgelandet) are not
  modelled.
- A prefix assumed in front of an unknown remainder blocks ge- (beamt) until `stems.unstressedFirstSyllable: false`
  is given (gebeamt).
- Stress is read from the lists or assumed initial; an unlisted verb with an unstressed first syllable gets ge- until
  `stems.unstressedFirstSyllable` is given.
