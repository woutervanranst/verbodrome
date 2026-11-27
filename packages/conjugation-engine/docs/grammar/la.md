# Latin grammar: rules, defaults and limits

The Latin pack (`src/languages/la/`) builds every form of the classical paradigm from recorded rules and explains each
step in English and Dutch, with a citation per rule. Forms are written with macrons for long vowels (no breves); input is
compared through a macron-insensitive key.

## Sources and licences

- **Allen and Greenough, *New Latin Grammar* (1903).** The rules cite the Dickinson College Commentaries edition
  (`https://dcc.dickinson.edu/grammar/latin/…`, CC BY-SA) and the page scans of the 1903 print (`AG<page + 12>.jpg`).
  The paradigms, principal parts and authority cells were read on the scans.
- **Bennett, *New Latin Grammar* (1918),** Project Gutenberg #15665 (public domain), for the second reading of the
  paradigms and the long ī of the perfect subjunctive (§101).
- **Lewis and Short, *A Latin Dictionary* (1879),** read through Logeion, for verbs and principal parts A&G does not print.
- **English Wiktionary** (CC BY-SA 4.0, `https://creativecommons.org/licenses/by-sa/4.0/`): English Wiktionary
  contributors; adapted: the Latin conjugation tables were parsed into cells. The tables of 63 pages at pinned
  revisions are a second oracle in `tests/fixtures/wiktionary-la.json`, which records each page's title, revision, URL
  and history URL. Wiktionary is data, never a rule's citation or a correction's authority.
- **The scraped corpus** (18 pages) is another engine's output, compared through two ledgers. Its fixture is neutral.

Every lexicon entry records how it was checked (`checked`: the A&G scan, the A&G text, Lewis and Short, Bennett only, or
unverified); `lexiconVerification` in `sources.ts` keys one record per entry.

## How a form is built

- **Classification** (`la.classify.*`), each decision a step:
  1. the input is normalised (NFC; j → i for look-up; macrons kept in the output);
  2. principal parts, a first person, or the infinitive alone; a passive infinitive of a verb the lexicon has as active
     is rejected, not read as a deponent; an unknown verb given with a passive infinitive (`-ārī, -ērī, -ī, -īrī`) or a
     first person in -or is assumed to be deponent (`la.classify.assume-deponent`);
  3. the lexicon (487 look-up entries, 69 irregular, defective and impersonal verbs), looked up with macrons first, then
     by the macron-insensitive key. A typed breve means "short" (*capĕre* is *capere*) and never reaches the output.
     Lengths that fit no spelling of a verb the lexicon knows (*regēre*, *āmāre*) are taken as a slip: the lexicon verb,
     with the assumption `la.classify.assume-spelling` naming its spelling. Of two homographs the common verb comes first
     (*veniō* before *vēneō*, *occīdō* before *occidō*: the list `rarerHomographs`);
  4. compound families (36 with a form or prefix list of their own): the weakened compound form (`-cipiō, -cēpī,
     -ceptum`), prefix assimilation, the compounds of sum, ferō, eō, dō and stō; an unlisted prefix of a family that
     varies is an assumption;
  5. the ending, then the defaults (below). A macron-less `-ere` (or `-eri`) that the lexicon does not settle gives two
     paradigms, the third and the second conjugation, each with its assumption.
- **A cell**: stem (present, perfect or supine stem; `la.stem.*`), ending (`la.end.*`), then the juncture rules in order:
  syncope of the perfect, loss of v in -īvī perfects, -iō drops i, the root of eō, the a lost before a vowel, short before a vowel, short before nt,
  short final vowel, long before ns, ii contracted before s, the short imperative (`la.orth.*`). Whole words the lexicon
  lists record `la.lex.cell`; the compounds of sum build on sum's words (`la.lex.sum-compound`, `la.lex.pot-sum`); faciō's
  present-system passive is fīō's active (`la.lex.passive-fio`).
- **Variants**: `-re` beside `-ris` and `-ēre` beside `-ērunt` (literary); the contracted perfects of A&G §181
  (*amāstī, amārim, amāsse, nōram; audīstī, audīsse*: literary, never preferred, `la.orth.syncope`); the v-less forms of
  -īvī perfects, which A&G §181.b says these perfects "regularly" have (*audiī, audiit, audieram*: standard, pattern
  `iī`, after the full form, `la.orth.v-loss`); `-undus` beside `-endus` (dated); fīō's
  bracketed forms and *volt, voltis* (dated); *forem* beside *essem* and *fore* beside *futūrus esse*.
- **Compound tenses** (`la.periphrasis.*`): the perfect passive system and the deponent perfect are participle + sum;
  the future infinitives are the participle + esse and the supine + īrī.
- **Voice** is a target dimension. A deponent's forms are active targets with passive morphology; its passive is
  unavailable (`la.avail.no-passive`). A semi-deponent has the active present system and the participle in the perfect.

## Compound families

A compound takes its family's form: the weakened form where A&G prints one (`-cipiō, -cēpī, -ceptum`), else the
simple verb's. "Compounds, with the exception of dō, stō, sistō, discō, poscō, omit the reduplication" (Bennett §118.4.a
Note 1; `la.classify.compound-reduplication`): *respondeō, respondī*; *attondeō, attondī*; *contundō, contudī*.

The parenthesised compound forms of the A&G §§209–212 rows the lexicon is transcribed from:

| A&G | Print | Decision |
|---|---|---|
| §209 crepō | -crepāvī; Note: *discrepuī or -crepāvī, increpuī or -crepāvī* | limit: the compounds take crepuī only |
| §209 iuvō | (ad-iuvō) | modelled: *adiuvō, adiūvī, adiūtum* |
| §209 necō | necāt- (-nect-), Note 2 "except in composition" | limit: *ēnecō* takes necāvī |
| §209 Note | micō: *dīmicāvī, ēmicuī*; plicō and its compounds | limit: not modelled |
| §209 Note | stō: *cōnstō … exstō*; dō: *circum-, inter-, pessum-, satis-, super-, vēnum-dō* | modelled (entries) |
| §210 | (cō)nīveō, (ab)oleō, teneō (-tineō), misceō mixt- (mist-) | modelled |
| §210 | tondeō -totondī (-tondī) | modelled: the reduplication rule, *dētondeō* with both perfects (L&S) |
| §211.a | quatiō (-cussī), frendō (fress-), nectō (nexuī), -liciō (*ēlicuī, -licit-*) | modelled |
| §211.a | unguō (ungō) | limit: the spelling *ungō* is not an entry |
| §211.b | pungō (-pūnxī), tendō (-tendī), parcō (parsī), pariō (paritūrus), tundō (-tūs-), -dō | modelled |
| §211.b | pangō, pepigī (-pēgī) | limit: the compounds' present *-pingō* is not printed |
| §211.c–f | alō (alit-), iaciō (-iciō, -iect-), lavō (laut-), nōscō (*cō-gnit-, ā-gnit-*), pandō (pass-), pīnsō (pīnst-, pīst-), sīdō (-sēdī), vellō (-vulsī), ruō (ruitūrus), fugiō (fugitūrus), tollō (*sustulī, sublātum*) | modelled |
| §211.f | bibō (pōtus) | limit: *pōtus* is not generated as bibō's participle |
| §212 | amiciō (-cuī), saliō (-siliō, saliī, -sult-), hauriō (hausūrus) | modelled |

Verbs whose entry takes no prefix (`prefixes: []`), each a decision: mordeō and pendeō (their compounds lack the perfect
or differ: *dēmordeō, remordeō, dēpendeō, impendeō, prōpendeō* are entries, L&S); fallō (its compound *refellō* has no
supine: an entry); pariō (its compounds are fourth-conjugation entries: *reperiō, comperiō*); parcō, pangō, tingō
(no compound in the lexicon; *attingō, contingō* belong to tangō); tollō (*attollō, extollō* lack the perfect: not
modelled); the -dō compounds, *calefaciō, benefaciō, satisfaciō*, the compounds of sum and stō and the defective verbs
(they are compounds or have none); sum, possum, volō, nōlō, mālō, dō, eō's listed compounds, queō, fīō, vēneō, ambiō;
edō (*comedō, exedō* are not modelled: a limit).

## Subjects, gender and agreement

There are 24 subject slots, none with a pronoun (Latin is pro-drop): for each of the six persons an ungendered slot
(`1sg`, the default), which the simple forms use, and a masculine, feminine and neuter slot (`1sg.m`, `1sg.f`, `1sg.n`),
which the compound forms use because their participle agrees with the subject (*amātus sum, amāta sum, amātum est*).
Without a gender every gender is generated; `gender: 'feminine'` keeps the feminine slots.

Declined forms (participles, gerundive, gerund, supine, the participle in an infinitive) default to the citation form:
nominative masculine singular (*amāns, amātūrus esse*), the genitive of the gerund (*amandī*), the supine in -um. The
option `agreement` asks for full declension; its fields `gender`, `number` and `case` narrow it (`agreement: {}` is all
cases). An impersonal passive and an impersonal verb stand in the neuter singular (*itum est, licitum est*).

## Defaults and assumptions

| Default | Assumption | What replaces it |
|---|---|---|
| macron-less -ere / -eri | `la.classify.assume-third`, `la.classify.assume-second` (two paradigms); `la.classify.assume-third-deponent`, `la.classify.assume-second-deponent` | the macron (-ēre) or the first person (-eō, -ō) |
| no first person in -iō | `la.classify.assume-consonant-stem` | `stems.present` |
| vowel lengths of the stem | `la.classify.assume-quantity` | macrons in the input |
| a full passive | `la.classify.assume-passive` | — |
| regular perfect and supine | `la.classify.default-parts`, `default-sigmatic`, `default-uo`, `default-sco`, `default-u` | principal parts, `stems.perfect`, `stems.supine` |
| an unlisted compound of a varying family | `la.classify.assume-compound` | principal parts |

## Availability

`availability` is the only place a form is declared missing: deponents and verbs without a passive (`no-passive`);
intransitive verbs, whose passive is impersonal in the third singular (`impersonal-passive`); impersonal verbs (third
singular, infinitives and the gerund, A&G §207; `impersonal`); verbs without an imperative, supine, perfect, present
system, participle or gerund as the grammar prints them; the second plural future imperative of the passive; and the
defective verbs (āiō, inquam, fārī, quaesō, cedo, salvē, avē; coepī, meminī, ōdī, nōvisse; dō's *dor, der*), which keep
only the attested cells (`la.avail.not-attested`).

## Corpus and oracles

- **Scraped corpus:** 18 pages, 3,330 cells (3,312 compared, 18 unmodelled gerund rows that repeat the infinitive, 819
  template placeholders), compared at two levels. The form ledger (107 cells) makes the macron-insensitive comparison
  pass: deponent future imperatives, *fuam*, possum's gerund, *mālēns*, fīō, eō. The macron ledger (147 cells) changes
  vowel length only: *secūtus, largītus, amantor, audiuntor, volēns* and the perfect subjunctive's long ī (Bennett
  §101). 254 sourced corrections in all; extra forms must carry a variant tag.
- **Authority cells:** 13 files, 1,249 cells of forms the 1903 A&G print shows (§§170, 184–188, 190, 198–204), 21 of
  them printed as missing, transcribed by hand from the scans (`tests/goldens/la/authority/`). Old forms the print names
  (*fuam, siem, faxō, nēvīs*) are `excluded`; the short i of the perfect subjunctive is `disputed` (A&G short, Bennett
  long; the engine follows Bennett).
- **Second oracle:** en.wiktionary tables of 63 pinned pages (Module:la-verb 93344416), 6,678 cells, 196 of them
  unmodelled (sigmatic rows, future perfect and perfect potential infinitives). They are compared through a 602-cell
  ledger (`scripts/corpus/corrections/wiktionary-la.ts`) whose reasons cite A&G, Bennett or Lewis and Short. The oracle
  found engine defects that were fixed with tests: the compounds of sum lacked *forem, fore*; sciō's imperative
  *scītō*; *stātūrus, lautūrus, lōtūrus, nāscitūrus*; queō's syncopated perfect; the gerund of impersonal verbs.

## Limits

Not generated:
- old, archaic and early forms the grammars name as such: *fuam, siem, duim, escit*, the -ier infinitive, -ībam/-ībō in
  the fourth conjugation, *dīce, dūce, face*, *dīxtī*-type forms, *nēvīs, māvolō*;
- the sigmatic future and aorist (*faxō, faxim*);
- the future perfect and perfect potential infinitives (*amātum fore, amātūrum fuisse*);
- the periphrastic conjugations as paradigms (*amātūrus sum, amandus sum*);
- *coeptus est* with a passive infinitive, and queō's passive with a passive infinitive (constructions);
- the uncontracted *-iistī, -iisse* of eō and the -īvī perfects;
- edō's athematic forms (*ēs, ēst, ēsse*) are listed whole beside its regular, derived forms: the assimilation of d
  before s and t is not a rule of this pack.

The syncope rule follows A&G §181 by shape: it also contracts perfects such as *lāvī* and *cāvī* in -āvī, as the rule
reads. The perfect subjunctive has a long ī in *-erīs, -erīmus, -erītis* (Bennett), against A&G's print.

## Rule inventory

| Rule | Stage | Kind | Message (en) | Citation |
|---|---|---|---|---|
| `la.classify.lexicon` | classify | lexical | {before} is in the lexicon: {parts}. | [A&G §172](https://dcc.dickinson.edu/grammar/latin/four-conjugations); [Lewis & Short](https://logeion.uchicago.edu/) |
| `la.classify.compound` | classify | rule | {before} is {prefix}- + {base}; compounds of {base} go {parts}. | [A&G §267.a, Note 2](https://dcc.dickinson.edu/grammar/latin/compound-words); [A&G §16](https://dcc.dickinson.edu/grammar/latin/phonetic-changes) |
| `la.classify.compound-reduplication` | classify | rule | Compounds drop the reduplication of the perfect: {before} → {after}. | [Bennett §118 (4.a, Notes 1–2)](https://www.gutenberg.org/files/15665/15665-h/15665-h.htm#sect118); [A&G §177.c](https://dcc.dickinson.edu/grammar/latin/perfect-stem) |
| `la.classify.conjugation` | classify | rule | {before} ends in -{ending}: {conjugation, select, first {first} second {second} third {third} thirdIo {third (-iō)} fourth {fourth} other {irregular}} conjugation. | [A&G §171](https://dcc.dickinson.edu/grammar/latin/four-conjugations); [Bennett §98](https://www.gutenberg.org/files/15665/15665-h/15665-h.htm#sect98) |
| `la.classify.io` | classify | rule | The first person {after} ends in -iō: a third-conjugation verb in -iō, which keeps its i before a, o, u and long ē. | [A&G §179.c.1](https://dcc.dickinson.edu/grammar/latin/forms-conjugation); [A&G §188](https://dcc.dickinson.edu/grammar/latin/3rd-conjugation-io-verbs); [Bennett §109](https://www.gutenberg.org/files/15665/15665-h/15665-h.htm#sect109) |
| `la.classify.deponent` | classify | rule | {before} has a passive infinitive: the verb is deponent, with passive forms and active meaning. | [A&G §190](https://dcc.dickinson.edu/grammar/latin/deponent-verbs); [A&G §156.b](https://dcc.dickinson.edu/grammar/latin/verb-conjugations) |
| `la.classify.semi-deponent` | classify | lexical | {before} is semi-deponent: active forms in the present system, passive forms with active meaning in the perfect system. | [A&G §192](https://dcc.dickinson.edu/grammar/latin/deponent-verbs); [Bennett §114](https://www.gutenberg.org/files/15665/15665-h/15665-h.htm#sect114) |
| `la.classify.assume-third` | classify | assumption | No macron marks the e of -ere: this paradigm reads the verb as third conjugation (-ere); the second-conjugation reading (-ēre) is given beside it. | [A&G §171](https://dcc.dickinson.edu/grammar/latin/four-conjugations) |
| `la.classify.assume-second-deponent` | classify | assumption | No macron marks the e of -eri: this paradigm reads the verb as a second-conjugation deponent (-ērī); the third-conjugation reading (-ī) is given beside it. | [A&G §190](https://dcc.dickinson.edu/grammar/latin/deponent-verbs) |
| `la.classify.assume-second` | classify | assumption | No macron marks the e of -ere: this paradigm reads the verb as second conjugation (-ēre); write -ēre, or give the first person in -eō, to keep only this reading. | [A&G §171](https://dcc.dickinson.edu/grammar/latin/four-conjugations) |
| `la.classify.assume-third-deponent` | classify | assumption | No macron marks the e of -eri: this paradigm reads the verb as a third-conjugation deponent (-ī); write -ērī, or give the first person in -eor, for the second conjugation. | [A&G §190](https://dcc.dickinson.edu/grammar/latin/deponent-verbs) |
| `la.classify.assume-consonant-stem` | classify | assumption | Without a first person in -iō the verb is not taken to be an -iō verb. | [A&G §188](https://dcc.dickinson.edu/grammar/latin/3rd-conjugation-io-verbs) |
| `la.classify.assume-quantity` | classify | assumption | The lengths of the stem vowels are not known: vowels written without a macron are left without one. | [A&G §10](https://dcc.dickinson.edu/grammar/latin/quantity-syllables) |
| `la.classify.assume-spelling` | classify | assumption | The lexicon has this verb as {after}: the vowel lengths written in {before} are taken to be a slip. | [A&G §10](https://dcc.dickinson.edu/grammar/latin/quantity-syllables); [A&G §172](https://dcc.dickinson.edu/grammar/latin/four-conjugations) |
| `la.classify.assume-deponent` | classify | assumption | {before} is not in the lexicon: a verb given with a passive infinitive is taken to be deponent; give its active infinitive for the passive of an active verb. | [A&G §190](https://dcc.dickinson.edu/grammar/latin/deponent-verbs); [A&G §156.b](https://dcc.dickinson.edu/grammar/latin/verb-conjugations) |
| `la.classify.assume-passive` | classify | assumption | The verb is assumed to have a full passive, as a transitive verb does. | [A&G §154.a](https://dcc.dickinson.edu/grammar/latin/verb-conjugations); [A&G §208.d](https://dcc.dickinson.edu/grammar/latin/impersonal-verbs) |
| `la.classify.assume-compound` | classify | assumption | Compounds of {base} vary; {prefix}- + {base} is assumed to follow the listed compound form. | [Bennett §118 (4.a, Note 1)](https://www.gutenberg.org/files/15665/15665-h/15665-h.htm#sect118) |
| `la.classify.default-parts` | classify | assumption | Not in the lexicon: the regular {conjugation, select, first {first-conjugation} second {second-conjugation} fourth {fourth-conjugation} other {}} perfect and supine are assumed. | [A&G §179.a.2, b.2, d](https://dcc.dickinson.edu/grammar/latin/forms-conjugation) |
| `la.classify.default-sigmatic` | classify | assumption | Not in the lexicon: an s-perfect is assumed, the commonest third-conjugation type for a stem in a stop consonant. | [A&G §177.b](https://dcc.dickinson.edu/grammar/latin/perfect-stem); [A&G §211.a](https://dcc.dickinson.edu/grammar/latin/classified-lists-verbs-3rd-conjugation) |
| `la.classify.default-uo` | classify | assumption | Not in the lexicon: a verb in -uō is assumed to have the perfect -uī and the supine -ūtum. | [A&G §211.f](https://dcc.dickinson.edu/grammar/latin/classified-lists-verbs-3rd-conjugation) |
| `la.classify.default-sco` | classify | assumption | Not in the lexicon: an inceptive in -scō is assumed to drop -sc- and add -vī and -tum. | [A&G §211.c](https://dcc.dickinson.edu/grammar/latin/classified-lists-verbs-3rd-conjugation) |
| `la.classify.default-u` | classify | assumption | Not in the lexicon: a stem in l, m, n, r, s or x is assumed to have the perfect -uī and the supine -itum. | [A&G §211.c](https://dcc.dickinson.edu/grammar/latin/classified-lists-verbs-3rd-conjugation) |
| `la.stem.present` | stem | rule | Present stem: {before} without -{ending} gives {after}-. | [A&G §175](https://dcc.dickinson.edu/grammar/latin/present-stem); [Bennett §97](https://www.gutenberg.org/files/15665/15665-h/15665-h.htm#sect97) |
| `la.stem.perfect` | stem | lexical | Perfect stem from the principal part {before}: {after}-. | [A&G §172](https://dcc.dickinson.edu/grammar/latin/four-conjugations); [A&G §169](https://dcc.dickinson.edu/grammar/latin/perfect-system) |
| `la.stem.perfect-regular` | stem | rule | Perfect stem: {before} + -{suffix}- gives {after}-. | [A&G §177.a–b](https://dcc.dickinson.edu/grammar/latin/perfect-stem) |
| `la.stem.supine` | stem | lexical | Supine stem from the principal part {before}: {after}-. | [A&G §178](https://dcc.dickinson.edu/grammar/latin/formation-supine) |
| `la.stem.supine-regular` | stem | rule | Supine stem: {before} + -{suffix}- gives {after}-. | [A&G §178.a–b](https://dcc.dickinson.edu/grammar/latin/formation-supine) |
| `la.stem.s-junction` | stem | rule | Before the s of the perfect, {consonant} becomes {result}: {before} → {after}. | [A&G §15](https://dcc.dickinson.edu/grammar/latin/phonetic-changes); [Bennett §118 (3.a)](https://www.gutenberg.org/files/15665/15665-h/15665-h.htm#sect118) |
| `la.stem.t-junction` | stem | rule | Before the t of the supine, {consonant} becomes {result}: {before} → {after}. | [A&G §178 Note 1](https://dcc.dickinson.edu/grammar/latin/formation-supine); [Bennett §119 (1.a)](https://www.gutenberg.org/files/15665/15665-h/15665-h.htm#sect119) |
| `la.stem.lexical` | stem | lexical | The lexicon gives the stem {after}- here. | [A&G §§202–203](https://dcc.dickinson.edu/grammar/latin/irregular-verbs-d%C5%8D-e%C5%8D-and-ade%C5%8D); [A&G §199](https://dcc.dickinson.edu/grammar/latin/irregular-verbs-vol%C5%8D-n%C5%8Dl%C5%8D-m%C4%81l%C5%8D) |
| `la.stem.participle` | stem | lexical | Participle stem from the principal part {before}: {after}-. | [A&G §190](https://dcc.dickinson.edu/grammar/latin/deponent-verbs); [A&G §172](https://dcc.dickinson.edu/grammar/latin/four-conjugations) |
| `la.lex.cell` | stem | lexical | {after} is a listed form of {before}. | [A&G §170](https://dcc.dickinson.edu/grammar/latin/sum); [A&G §198](https://dcc.dickinson.edu/grammar/latin/irregular-verbs-compounds-sum); [A&G §199](https://dcc.dickinson.edu/grammar/latin/irregular-verbs-vol%C5%8D-n%C5%8Dl%C5%8D-m%C4%81l%C5%8D); [A&G §§202–203](https://dcc.dickinson.edu/grammar/latin/irregular-verbs-d%C5%8D-e%C5%8D-and-ade%C5%8D); [A&G §204](https://dcc.dickinson.edu/grammar/latin/irregular-verbs-f%C4%AB%C5%8D); [Bennett §100](https://www.gutenberg.org/files/15665/15665-h/15665-h.htm#sect100) |
| `la.lex.sum-compound` | stem | lexical | {after} is {prefix}- + {before}, the form of sum. | [A&G §198](https://dcc.dickinson.edu/grammar/latin/irregular-verbs-compounds-sum); [Bennett §125](https://www.gutenberg.org/files/15665/15665-h/15665-h.htm#sect125) |
| `la.lex.pot-sum` | stem | lexical | {after} is pot- + {before}, the form of sum: pot- before a vowel, pos- before s, and potess- becomes poss-. | [A&G §198.b](https://dcc.dickinson.edu/grammar/latin/irregular-verbs-compounds-sum); [A&G p. 109](https://dcc.dickinson.edu/sites/default/files/AG121.jpg) |
| `la.lex.passive-fio` | stem | lexical | The present-system passive of {before} is supplied by fīō: {after}. | [A&G §204](https://dcc.dickinson.edu/grammar/latin/irregular-verbs-f%C4%AB%C5%8D); [A&G p. 115](https://dcc.dickinson.edu/sites/default/files/AG127.jpg) |
| `la.end.personal` | ending | rule | Present {voice}, {person} {number}: add the personal ending -{ending}. | [A&G §163](https://dcc.dickinson.edu/grammar/latin/personal-endings); [A&G p. 89](https://dcc.dickinson.edu/sites/default/files/AG101.jpg) |
| `la.end.thematic` | ending | rule | Ending of the third conjugation (also used here): connecting vowel and personal ending -{ending} (i before most endings, u before -nt, e before -r). | [A&G §179.c.1, d](https://dcc.dickinson.edu/grammar/latin/forms-conjugation); [A&G §176.b](https://dcc.dickinson.edu/grammar/latin/present-stem) |
| `la.end.imperfect` | ending | rule | Imperfect: add -bā- (third and fourth conjugations -ēbā-) and the personal ending: -{ending}. | [A&G §168.b](https://dcc.dickinson.edu/grammar/latin/present-system); [A&G §179.c.1, d](https://dcc.dickinson.edu/grammar/latin/forms-conjugation) |
| `la.end.future-b` | ending | rule | Future of the first and second conjugations: add -{ending}. | [A&G §168.c](https://dcc.dickinson.edu/grammar/latin/present-system); [A&G §183](https://dcc.dickinson.edu/grammar/latin/peculiarities) |
| `la.end.future-e` | ending | rule | Future of the third and fourth conjugations: add -{ending} (a in the first person, ē in the others). | [A&G §168.d](https://dcc.dickinson.edu/grammar/latin/present-system) |
| `la.end.subjunctive` | ending | rule | Present subjunctive: add the mood vowel and ending -{ending}. | [A&G §168.e](https://dcc.dickinson.edu/grammar/latin/present-system); [A&G §179.a.1, b.1](https://dcc.dickinson.edu/grammar/latin/forms-conjugation) |
| `la.end.imperfect-subjunctive` | ending | rule | Imperfect subjunctive: add -rē- and the personal ending: -{ending}. | [A&G §168.f](https://dcc.dickinson.edu/grammar/latin/present-system) |
| `la.end.perfect` | ending | rule | Perfect: add -{ending} to the perfect stem. | [A&G §163.a](https://dcc.dickinson.edu/grammar/latin/personal-endings); [A&G §169.a](https://dcc.dickinson.edu/grammar/latin/perfect-system) |
| `la.end.pluperfect` | ending | rule | Pluperfect: add -{ending} to the perfect stem. | [A&G §169.b](https://dcc.dickinson.edu/grammar/latin/perfect-system) |
| `la.end.future-perfect` | ending | rule | Future perfect: add -{ending} to the perfect stem. | [A&G §169.c](https://dcc.dickinson.edu/grammar/latin/perfect-system) |
| `la.end.perfect-subjunctive` | ending | rule | Perfect subjunctive: add -{ending} to the perfect stem. | [Bennett §101](https://www.gutenberg.org/files/15665/15665-h/15665-h.htm#sect101); [A&G §169.d Note](https://dcc.dickinson.edu/grammar/latin/perfect-system) |
| `la.end.pluperfect-subjunctive` | ending | rule | Pluperfect subjunctive: add -{ending} to the perfect stem. | [A&G §169.e](https://dcc.dickinson.edu/grammar/latin/perfect-system) |
| `la.end.imperative` | ending | rule | Imperativus {tense}: add -{ending}. | [A&G §163.b](https://dcc.dickinson.edu/grammar/latin/personal-endings); [A&G §179.e](https://dcc.dickinson.edu/grammar/latin/forms-conjugation); [A&G p. 93](https://dcc.dickinson.edu/sites/default/files/AG105.jpg) |
| `la.end.infinitive` | ending | rule | Infinitivus {tense}: add -{ending}. | [A&G §166](https://dcc.dickinson.edu/grammar/latin/verb-endings); [A&G §175](https://dcc.dickinson.edu/grammar/latin/present-stem) |
| `la.end.ere` | ending | rule | Literary alternative: -ēre for -ērunt. | [A&G §163.a](https://dcc.dickinson.edu/grammar/latin/personal-endings); [A&G p. 93](https://dcc.dickinson.edu/sites/default/files/AG105.jpg); [Bennett §101](https://www.gutenberg.org/files/15665/15665-h/15665-h.htm#sect101) |
| `la.end.re` | ending | rule | Literary alternative: -re for -ris in the second person singular. | [A&G p. 94](https://dcc.dickinson.edu/sites/default/files/AG106.jpg); [A&G p. 104](https://dcc.dickinson.edu/sites/default/files/AG116.jpg); [Bennett §96](https://www.gutenberg.org/files/15665/15665-h/15665-h.htm#sect96) |
| `la.end.short-imperative` | orthography | lexical | dīcō, dūcō, faciō, ferō and their compounds drop the -e of the present imperative singular: {before} → {after}. | [A&G §182](https://dcc.dickinson.edu/grammar/latin/peculiarities); [Bennett §116 (3)](https://www.gutenberg.org/files/15665/15665-h/15665-h.htm#sect116) |
| `la.end.athematic` | ending | rule | Like ferō, this verb adds -{ending} straight to the root, without a connecting vowel. | [A&G §174](https://dcc.dickinson.edu/grammar/latin/present-stem); [A&G §200 fn. 3, §201](https://dcc.dickinson.edu/grammar/latin/irregular-verbs-fer%C5%8D-and-ed%C5%8D); [Bennett §129](https://www.gutenberg.org/files/15665/15665-h/15665-h.htm#sect129) |
| `la.end.optative` | ending | rule | This verb forms its present subjunctive with -ī-: -{ending}. | [A&G §168.e Note 2](https://dcc.dickinson.edu/grammar/latin/present-system) |
| `la.end.present-participle` | ending | rule | Present participle: add -{ending} (genitive -ntis). | [A&G §158.a](https://dcc.dickinson.edu/grammar/latin/forms-participle); [A&G §166](https://dcc.dickinson.edu/grammar/latin/verb-endings) |
| `la.end.perfect-participle` | ending | rule | Perfect participle: the supine stem + -us, -a, -um. | [A&G §158.c](https://dcc.dickinson.edu/grammar/latin/forms-participle) |
| `la.end.future-participle` | ending | rule | Future participle: the supine stem + -ūrus, -a, -um. | [A&G §158.b](https://dcc.dickinson.edu/grammar/latin/forms-participle); [Bennett §119 (4)](https://www.gutenberg.org/files/15665/15665-h/15665-h.htm#sect119) |
| `la.end.gerundive` | ending | rule | Gerundive: add -{ending}. | [A&G §158.d](https://dcc.dickinson.edu/grammar/latin/forms-participle); [A&G §166](https://dcc.dickinson.edu/grammar/latin/verb-endings) |
| `la.end.gerund` | ending | rule | Gerund: add -{ending}. | [A&G §159.a](https://dcc.dickinson.edu/grammar/latin/gerund-and-supine); [A&G p. 93](https://dcc.dickinson.edu/sites/default/files/AG105.jpg) |
| `la.end.supine` | ending | rule | Supine: add -{ending} to the supine stem. | [A&G §159.b](https://dcc.dickinson.edu/grammar/latin/gerund-and-supine) |
| `la.end.undus` | ending | rule | Older alternative: -und- for -end- in the gerund and gerundive. | [A&G §179 fn. 2](https://dcc.dickinson.edu/grammar/latin/forms-conjugation); [Bennett §116 (2)](https://www.gutenberg.org/files/15665/15665-h/15665-h.htm#sect116) |
| `la.end.decline-us` | ending | rule | Declension, {case} {gender} {number}: -{ending}, like bonus. | [A&G §110](https://dcc.dickinson.edu/grammar/latin/1st-and-2nd-declension-adjectives-%C4%81-o-stems) |
| `la.end.decline-ns` | ending | rule | Declension, {case} {gender} {number}: -{ending}, like egēns. | [A&G §§117.b, 118](https://dcc.dickinson.edu/grammar/latin/3rd-declension-adjectives-classification-and-paradigms) |
| `la.end.ablative-i` | ending | rule | Ablative -ī, used when the participle serves as an adjective. | [A&G §121.a](https://dcc.dickinson.edu/grammar/latin/3rd-declension-adjectives-case-forms-consonant-stems) |
| `la.end.accusative-is` | ending | rule | Accusative plural -īs beside -ēs. | [A&G §121.c](https://dcc.dickinson.edu/grammar/latin/3rd-declension-adjectives-case-forms-consonant-stems) |
| `la.orth.io-drop-i` | orthography | rule | Verbs in -iō drop the i of the stem before a consonant, ĭ, ī or ĕ: {before} → {after}. | [A&G §179.c.1](https://dcc.dickinson.edu/grammar/latin/forms-conjugation); [A&G §188](https://dcc.dickinson.edu/grammar/latin/3rd-conjugation-io-verbs); [Bennett §109](https://www.gutenberg.org/files/15665/15665-h/15665-h.htm#sect109) |
| `la.orth.eo-root` | orthography | rule | The root ī of eō becomes e before a, o and u: {before} → {after}. | [A&G §203 fn. 1](https://dcc.dickinson.edu/grammar/latin/irregular-verbs-d%C5%8D-e%C5%8D-and-ade%C5%8D) |
| `la.orth.a-lost` | orthography | rule | The stem vowel a is lost before another vowel: {before} → {after}. | [A&G §179.a.1](https://dcc.dickinson.edu/grammar/latin/forms-conjugation); [A&G p. 92](https://dcc.dickinson.edu/sites/default/files/AG104.jpg); [A&G p. 94](https://dcc.dickinson.edu/sites/default/files/AG106.jpg) |
| `la.orth.short-before-vowel` | orthography | rule | A vowel before another vowel is short: {before} → {after}. | [A&G §10.a](https://dcc.dickinson.edu/grammar/latin/quantity-syllables); [Bennett §5 (2.b)](https://www.gutenberg.org/files/15665/15665-h/15665-h.htm#sect5); [A&G §204](https://dcc.dickinson.edu/grammar/latin/irregular-verbs-f%C4%AB%C5%8D) |
| `la.orth.short-before-nt` | orthography | rule | A vowel before nt or nd is short: {before} → {after}. | [A&G §10.e](https://dcc.dickinson.edu/grammar/latin/quantity-syllables); [A&G §167](https://dcc.dickinson.edu/grammar/latin/verb-endings); [Bennett §5 (2.a)](https://www.gutenberg.org/files/15665/15665-h/15665-h.htm#sect5) |
| `la.orth.short-final` | orthography | rule | A long vowel is short before a final m, t or r: {before} → {after}. | [A&G §167](https://dcc.dickinson.edu/grammar/latin/verb-endings) |
| `la.orth.long-before-ns` | orthography | rule | A vowel before ns or nf is long: {before} → {after}. | [A&G §10.d](https://dcc.dickinson.edu/grammar/latin/quantity-syllables); [Bennett §5 (1.a)](https://www.gutenberg.org/files/15665/15665-h/15665-h.htm#sect5) |
| `la.orth.ii-contraction` | orthography | rule | In the perfect of eō, ii before s contracts to ī: {before} → {after}. | [A&G §203.c](https://dcc.dickinson.edu/grammar/latin/irregular-verbs-d%C5%8D-e%C5%8D-and-ade%C5%8D); [A&G p. 114](https://dcc.dickinson.edu/sites/default/files/AG126.jpg) |
| `la.orth.syncope` | orthography | rule | Syncopated perfect, chiefly literary: the v and the next vowel drop before s or r, and the vowels contract: {before} → {after}. | [A&G §181.a](https://dcc.dickinson.edu/grammar/latin/peculiarities); [A&G p. 91](https://dcc.dickinson.edu/sites/default/files/AG103.jpg); [Bennett §116](https://www.gutenberg.org/files/15665/15665-h/15665-h.htm#sect116) |
| `la.orth.v-loss` | orthography | rule | Perfects in -īvī often drop the v: {before} → {after}. | [A&G §181.b](https://dcc.dickinson.edu/grammar/latin/peculiarities); [A&G p. 91](https://dcc.dickinson.edu/sites/default/files/AG103.jpg); [Bennett §116](https://www.gutenberg.org/files/15665/15665-h/15665-h.htm#sect116) |
| `la.periphrasis.perfect` | periphrasis | rule | Perfect: the perfect participle with the present of esse. | [A&G §179.g](https://dcc.dickinson.edu/grammar/latin/forms-conjugation); [A&G §164.3.a](https://dcc.dickinson.edu/grammar/latin/stems); [A&G p. 94](https://dcc.dickinson.edu/sites/default/files/AG106.jpg); [Bennett §102](https://www.gutenberg.org/files/15665/15665-h/15665-h.htm#sect102) |
| `la.periphrasis.pluperfect` | periphrasis | rule | Pluperfect: the perfect participle with the imperfect of esse. | [A&G §179.g](https://dcc.dickinson.edu/grammar/latin/forms-conjugation); [A&G p. 94](https://dcc.dickinson.edu/sites/default/files/AG106.jpg); [Bennett §102](https://www.gutenberg.org/files/15665/15665-h/15665-h.htm#sect102) |
| `la.periphrasis.future-perfect` | periphrasis | rule | Future perfect: the perfect participle with the future of esse. | [A&G §179.g](https://dcc.dickinson.edu/grammar/latin/forms-conjugation); [A&G p. 94](https://dcc.dickinson.edu/sites/default/files/AG106.jpg); [Bennett §102](https://www.gutenberg.org/files/15665/15665-h/15665-h.htm#sect102) |
| `la.periphrasis.perfect-subjunctive` | periphrasis | rule | Perfect subjunctive: the perfect participle with the present subjunctive of esse. | [A&G §179.g](https://dcc.dickinson.edu/grammar/latin/forms-conjugation); [A&G p. 94](https://dcc.dickinson.edu/sites/default/files/AG106.jpg); [Bennett §102](https://www.gutenberg.org/files/15665/15665-h/15665-h.htm#sect102) |
| `la.periphrasis.pluperfect-subjunctive` | periphrasis | rule | Pluperfect subjunctive: the perfect participle with the imperfect subjunctive of esse. | [A&G §179.g](https://dcc.dickinson.edu/grammar/latin/forms-conjugation); [A&G p. 94](https://dcc.dickinson.edu/sites/default/files/AG106.jpg); [Bennett §102](https://www.gutenberg.org/files/15665/15665-h/15665-h.htm#sect102) |
| `la.periphrasis.perfect-infinitive` | periphrasis | rule | Perfect infinitive: the perfect participle with esse. | [A&G §164.3.a](https://dcc.dickinson.edu/grammar/latin/stems); [A&G §166](https://dcc.dickinson.edu/grammar/latin/verb-endings) |
| `la.periphrasis.future-infinitive` | periphrasis | rule | Future infinitive: the future participle with esse. | [A&G §164.3.b](https://dcc.dickinson.edu/grammar/latin/stems); [A&G §190.c](https://dcc.dickinson.edu/grammar/latin/deponent-verbs) |
| `la.periphrasis.future-infinitive-passive` | periphrasis | rule | Future passive infinitive: the supine in -um with īrī, the passive infinitive of īre. | [A&G §164.3.c](https://dcc.dickinson.edu/grammar/latin/stems); [A&G §203.a](https://dcc.dickinson.edu/grammar/latin/irregular-verbs-d%C5%8D-e%C5%8D-and-ade%C5%8D) |
| `la.periphrasis.fore` | periphrasis | rule | fore is used for futūrus esse. | [A&G §170.a](https://dcc.dickinson.edu/grammar/latin/sum) |
| `la.clause.agree-subject` | clause | rule | The participle agrees with the subject: {gender} {number}. | [A&G §179.g](https://dcc.dickinson.edu/grammar/latin/forms-conjugation); [Bennett §102](https://www.gutenberg.org/files/15665/15665-h/15665-h.htm#sect102) |
| `la.clause.agree-impersonal` | clause | rule | Impersonal passive: the participle stands in the neuter singular. | [A&G §§207, 208.d](https://dcc.dickinson.edu/grammar/latin/impersonal-verbs); [A&G p. 114](https://dcc.dickinson.edu/sites/default/files/AG126.jpg) |
| `la.clause.deponent` | clause | rule | Deponent verb: this passive form has an active meaning. | [A&G §190](https://dcc.dickinson.edu/grammar/latin/deponent-verbs) |
| `la.clause.semi-deponent` | clause | rule | Semi-deponent verb: in the perfect system it uses a passive form with active meaning. | [A&G §192](https://dcc.dickinson.edu/grammar/latin/deponent-verbs) |
| `la.avail.no-passive` | availability | unavailable | {before} has no passive{reason, select, deponent {: it is a deponent verb, whose passive forms have an active meaning} semiDeponent {: it is semi-deponent, with passive forms only in the perfect system} impersonal {: it is impersonal} other {}}. | [A&G §190](https://dcc.dickinson.edu/grammar/latin/deponent-verbs); [A&G §170](https://dcc.dickinson.edu/grammar/latin/sum); [A&G §199](https://dcc.dickinson.edu/grammar/latin/irregular-verbs-vol%C5%8D-n%C5%8Dl%C5%8D-m%C4%81l%C5%8D) |
| `la.avail.impersonal-passive` | availability | unavailable | {before} is intransitive: its passive is used only impersonally, in the third person singular. | [A&G §208.d](https://dcc.dickinson.edu/grammar/latin/impersonal-verbs); [A&G p. 114](https://dcc.dickinson.edu/sites/default/files/AG126.jpg) |
| `la.avail.impersonal` | availability | unavailable | {before} is impersonal: it has only the third person singular. | [A&G §207](https://dcc.dickinson.edu/grammar/latin/impersonal-verbs) |
| `la.avail.no-imperative` | availability | unavailable | {before} has no imperative. | [A&G p. 109](https://dcc.dickinson.edu/sites/default/files/AG121.jpg); [A&G p. 110](https://dcc.dickinson.edu/sites/default/files/AG122.jpg); [A&G p. 115](https://dcc.dickinson.edu/sites/default/files/AG127.jpg) |
| `la.avail.no-supine` | availability | unavailable | {before} has no supine stem, so this form does not exist. | [A&G §191.a](https://dcc.dickinson.edu/grammar/latin/deponent-verbs); [A&G §210.a](https://dcc.dickinson.edu/grammar/latin/classified-lists-verbs-1st-and-2nd-conjugations) |
| `la.avail.no-perfect` | availability | unavailable | {before} has no perfect stem, so this form does not exist. | [A&G §206](https://dcc.dickinson.edu/grammar/latin/defective-verbs) |
| `la.avail.no-present` | availability | unavailable | {before} has only the perfect system. | [A&G §205](https://dcc.dickinson.edu/grammar/latin/defective-verbs); [Bennett §133](https://www.gutenberg.org/files/15665/15665-h/15665-h.htm#sect133) |
| `la.avail.no-participle` | availability | unavailable | {before} has no {tense} participle. | [A&G §170.b](https://dcc.dickinson.edu/grammar/latin/sum); [A&G p. 110](https://dcc.dickinson.edu/sites/default/files/AG122.jpg); [A&G p. 115](https://dcc.dickinson.edu/sites/default/files/AG127.jpg) |
| `la.avail.no-gerund` | availability | unavailable | {before} has no gerund or gerundive. | [A&G §170](https://dcc.dickinson.edu/grammar/latin/sum); [A&G p. 109](https://dcc.dickinson.edu/sites/default/files/AG121.jpg); [A&G p. 110](https://dcc.dickinson.edu/sites/default/files/AG122.jpg); [A&G p. 115](https://dcc.dickinson.edu/sites/default/files/AG127.jpg) |
| `la.avail.no-future-imperative-plural` | availability | unavailable | Passive forms have no future imperative in the second person plural. | [A&G §163.b](https://dcc.dickinson.edu/grammar/latin/personal-endings); [A&G p. 94](https://dcc.dickinson.edu/sites/default/files/AG106.jpg); [A&G p. 104](https://dcc.dickinson.edu/sites/default/files/AG116.jpg) |
| `la.avail.not-attested` | availability | unavailable | The grammar prints no such form of {before}: only some of its forms are attested. | [A&G §206](https://dcc.dickinson.edu/grammar/latin/defective-verbs); [A&G p. 113](https://dcc.dickinson.edu/sites/default/files/AG125.jpg); [A&G p. 115](https://dcc.dickinson.edu/sites/default/files/AG127.jpg) |
