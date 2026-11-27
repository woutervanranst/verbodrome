# French grammar: rules, defaults and limits

French runs on the staged core: a verb is classified into one or more paradigms, every simple cell is built from a stem,
an ending and spelling rules, compound tenses are recipes over auxiliaries, and the clause orders the words. Every form
records its steps, which `explain` renders in English and Dutch with the sources below (CLI `--explain`). The design is
`docs/superpowers/research/2026-11-24-fr-grammar-design.md` (GD); this page is the reference for what the code does.

Sources: the Dictionnaire de l'Académie française, 9th edition (articles and `/conjuguer/` tables), the 1990
*Rectifications de l'orthographe* (Journal officiel, Documents administratifs n° 100), the OQLF's Banque de dépannage
linguistique (BDL) and the TLFi (CNRTL). *Le Bon Usage* is not cited: no § number was checked in a copy. Le Conjugueur
is not used for any rule.

## How a form is built

1. **Classification** (`classify.ts`). `se`/`s'` marks a pronominal verb; a 1990 infinitive names the traditional lemma
   (`assoir` → asseoir, `interpeler` → interpeller, `connaitre` → connaître). The verb is a **family** of
   `families.ts` when an entry lists it or one of its suffixes ends it (longest suffix wins, `except` and `exceptEndings`
   skip); otherwise a **productive** verb of the -er, -ir (-ïr, not -oir) or -re group. `classHint`, `model` and a
   complete `stems` hint override this as before. A verb with several accepted conjugations has one paradigm each,
   tagged `pattern` (payer: `y-to-i`, `keep-y`; asseoir: `assois`, `assieds`; ouïr, choir, échoir, faillir), with
   `usage: dated` for the dated ones.
2. **Stems and endings** (`stems.ts`, `paradigms.ts`). A productive verb takes the infinitive minus its ending and the
   51 endings of its group. A family stores principal parts (GD §4.2): P1 (present singular, ending set e/s/x), P2
   (nous: also imparfait, participe présent, subjunctive 1pl/2pl, imperative 1pl/2pl), P3 (ils, default P2), F (future and
   conditional), PS with its theme vowel (passé simple, imperfect subjunctive), PP (past participle, optional feminine
   base PPF), SJ1/SJ2 (subjunctive, defaults P3/P2). Être, avoir, savoir and vouloir take their imperative from the
   subjunctive, avoir and savoir their participe présent too. 28 suppletive cells are listed words (être 10, avoir 7,
   aller 3, faire 2, dire 1, pouvoir 1, seoir 1, messeoir 1, échoir 2). The passé simple and imperfect subjunctive are
   tagged literary.
3. **Spelling** (`orthography.ts`): the sixteen rules below, in order, at the stem/ending boundary. A form is born in both
   spellings; only the -eler/-eter fork, the future of céder-type verbs and the 1990 rules split it into a traditional
   and a rectified form.
4. **Availability** (`availability.ts`): the first reason that applies, in this order: pronominal past imperative, no
   imperative, impersonal, a missing cell or compound, third person only.
5. **Compound tenses** (`periphrasis.ts`): twelve recipes on the perfect auxiliary (one run per auxiliary of the verb),
   plus the near future (aller + infinitive) and the recent past (venir de + infinitive). The conditional past has two
   constructions: `past-first` and the literary `past-second` (the pluperfect subjunctive).
6. **Clause** (`clause.ts`). The six subject slots (je, tu, il, nous, vous, ils) have no gender; the clause shows it form
   by form through the core hook `subjectGenders`: il/elle and ils/elles in the third person, and je, tu, nous, vous
   where a participle agrees with the subject (`je suis allé` / `je suis allée`); none for an impersonal il. The past
   participle agrees with the subject after être, with a preceding direct object after avoir or in a pronominal verb, and
   not at all after avoir or with an indirect reflexive; an invariable participle never agrees. Word order: [que] subject
   [reflexive] verbs; the reflexive pronoun just before the infinitive after aller / venir de; verb-hyphen-pronoun in the
   imperative (te becomes toi); en in the gerund. Elision stays a rendering step and is recorded from a dry run.
   A verb with two auxiliaries says which one each compound form uses (`condition`); the plural of pleuvoir is
   `figurative`.

## Rule inventory

### Classification

| Rule | Kind | Message (en) | Sources |
|---|---|---|---|
| `fr.classify.reflexive` | rule | The se in front of {before} marks a pronominal verb: {after} is conjugated with a reflexive pronoun. | [BDL: Verbes occasionnellement pronominaux](https://vitrinelinguistique.oqlf.gouv.qc.ca/22942/la-grammaire/le-verbe/accord-du-participe-passe/avec-lauxiliaire-etre/accord-du-participe-passe-des-verbes-occasionnellement-pronominaux) |
| `fr.classify.essentially-pronominal` | lexical | {before} only exists as a pronominal verb, so it always takes a reflexive pronoun. | [BDL: Verbes essentiellement pronominaux](https://vitrinelinguistique.oqlf.gouv.qc.ca/22940/la-grammaire/le-verbe/accord-du-participe-passe/avec-lauxiliaire-etre/accord-du-participe-passe-des-verbes-essentiellement-pronominaux) |
| `fr.classify.canonical-spelling` | rule | {before} is the 1990 spelling of {after}, which names the same verb. | [JO 1990: III, Liste H : assoir, interpeler ; II.4 : connaitre](https://www.academie-francaise.fr/sites/academie-francaise.fr/files/rectifications.pdf); [BDL: ASSEOIR et ASSOIR](https://vitrinelinguistique.oqlf.gouv.qc.ca/23838/la-grammaire/le-verbe/conjugaison/emplois-du-verbe-asseoir) |
| `fr.classify.lexicon` | lexical | {before} is listed in the dictionary and is conjugated like {family}. | Académie: article et tableau de conjugaison du verbe |
| `fr.classify.family-suffix` | assumption | {lemma} is inflected like {family} from its -{suffix} ending. | Académie: article et tableau de conjugaison du verbe |
| `fr.classify.group` | rule | The infinitive {before} ends in -{group}, so it takes the regular endings of the -{group} verbs. | [BDL: Grammaire traditionnelle : trois groupes](https://vitrinelinguistique.oqlf.gouv.qc.ca/24654/la-grammaire/le-verbe/conjugaison/verbes-reguliers-et-irreguliers); [Académie: céder (verbe du 1er groupe), conjugaison](https://www.dictionnaire-academie.fr/conjuguer/A9C1222) |
| `fr.classify.assume-regular` | assumption | {lemma} uses the regular {group} model; lexical meaning and nonproductive classes cannot be inferred from spelling. | [BDL: Verbes réguliers en -er : seule conjugaison productive](https://vitrinelinguistique.oqlf.gouv.qc.ca/24654/la-grammaire/le-verbe/conjugaison/verbes-reguliers-et-irreguliers) |
| `fr.classify.spelling-model` | rule | The spelling of {before} makes it follow the model {model}. | [BDL: Radical des verbes réguliers](https://vitrinelinguistique.oqlf.gouv.qc.ca/24212/la-grammaire/le-verbe/conjugaison/radical-des-verbes-reguliers-au-present-de-lindicatif) |
| `fr.classify.class-hint` | rule | The class you gave makes {before} a regular -{group} verb. | [BDL: Verbes réguliers et irréguliers](https://vitrinelinguistique.oqlf.gouv.qc.ca/24654/la-grammaire/le-verbe/conjugaison/verbes-reguliers-et-irreguliers) |
| `fr.classify.model-hint` | rule | The model you gave makes {before} conjugate like {model}. | Académie: article et tableau de conjugaison du verbe |
| `fr.classify.principal-parts-hint` | rule | The principal parts you gave make every form of {before}. | [BDL: Radical des verbes irréguliers](https://vitrinelinguistique.oqlf.gouv.qc.ca/24214/la-grammaire/le-verbe/conjugaison/radical-des-verbes-irreguliers-au-present-de-lindicatif); [BDL: Passé simple](https://vitrinelinguistique.oqlf.gouv.qc.ca/24207/la-grammaire/le-verbe/conjugaison/formes-du-passe-simple) |
| `fr.classify.paradigm` | lexical | {before} has more than one accepted conjugation; this one is {pattern}. | [Académie: payer, conjugaison](https://www.dictionnaire-academie.fr/conjuguer/A9P1095); [Académie: asseoir, conjugaison](https://www.dictionnaire-academie.fr/conjuguer/A9A2823); [Académie: faillir, conjugaison](https://www.dictionnaire-academie.fr/conjuguer/A9F0105); [Académie: choir, conjugaison](https://www.dictionnaire-academie.fr/conjuguer/A9C2105) |
| `fr.classify.aux-etre` | lexical | {before} forms its compound tenses with être. | [BDL: Emploi de l’auxiliaire être](https://vitrinelinguistique.oqlf.gouv.qc.ca/24584/la-grammaire/le-verbe/auxiliaires/tableau-synthese-de-lemploi-des-auxiliaires-avoir-et-etre); [Académie: aller, conjugaison](https://www.dictionnaire-academie.fr/conjuguer/A9A1226) |
| `fr.classify.aux-dual` | lexical | {before} takes avoir or être in its compound tenses, depending on how it is used. | [BDL: Emploi de avoir ou de être](https://vitrinelinguistique.oqlf.gouv.qc.ca/24224/la-grammaire/le-verbe/auxiliaires/emploi-des-auxiliaires-avoir-et-etre); [BDL: Tableau-synthèse](https://vitrinelinguistique.oqlf.gouv.qc.ca/24584/la-grammaire/le-verbe/auxiliaires/tableau-synthese-de-lemploi-des-auxiliaires-avoir-et-etre) |
| `fr.classify.aux-avoir` | lexical | {before} forms its compound tenses with avoir. | [BDL: Emploi de l’auxiliaire avoir](https://vitrinelinguistique.oqlf.gouv.qc.ca/24224/la-grammaire/le-verbe/auxiliaires/emploi-des-auxiliaires-avoir-et-etre) |
| `fr.classify.aux-pronominal` | rule | A pronominal verb forms its compound tenses with être. | [BDL: Verbes pronominaux](https://vitrinelinguistique.oqlf.gouv.qc.ca/24224/la-grammaire/le-verbe/auxiliaires/emploi-des-auxiliaires-avoir-et-etre) |
| `fr.classify.aux-hint` | rule | The compound tenses use the auxiliary you gave: {auxiliary}. | [BDL: Emploi de avoir ou de être](https://vitrinelinguistique.oqlf.gouv.qc.ca/24224/la-grammaire/le-verbe/auxiliaires/emploi-des-auxiliaires-avoir-et-etre) |
| `fr.classify.assume-avoir` | assumption | An unlisted non-reflexive verb defaults to avoir. | [BDL: Emploi de l’auxiliaire avoir : la plupart des verbes intransitifs](https://vitrinelinguistique.oqlf.gouv.qc.ca/24224/la-grammaire/le-verbe/auxiliaires/emploi-des-auxiliaires-avoir-et-etre) |
| `fr.classify.indirect-reflexive` | lexical | Here the reflexive pronoun is an indirect object (to oneself), so the past participle does not agree with it. | [BDL: Le pronom réfléchi est complément indirect](https://vitrinelinguistique.oqlf.gouv.qc.ca/22942/la-grammaire/le-verbe/accord-du-participe-passe/avec-lauxiliaire-etre/accord-du-participe-passe-des-verbes-occasionnellement-pronominaux) |
| `fr.classify.assume-direct-reflexive` | assumption | The reflexive pronoun is assumed direct; specify indirect-object context when needed. | [BDL: Le pronom réfléchi est le complément direct](https://vitrinelinguistique.oqlf.gouv.qc.ca/22942/la-grammaire/le-verbe/accord-du-participe-passe/avec-lauxiliaire-etre/accord-du-participe-passe-des-verbes-occasionnellement-pronominaux) |
| `fr.classify.aspirated-h` | lexical | The h of {before} is aspirated: je, que and de keep their e in front of it. | [BDL: Élision interdite devant le h aspiré](https://vitrinelinguistique.oqlf.gouv.qc.ca/21745/lorthographe/elision-et-apostrophe/elision-interdite) |
| `fr.classify.assume-mute-h` | assumption | An unlisted initial h is assumed mute. | [BDL: Élision devant le h muet](https://vitrinelinguistique.oqlf.gouv.qc.ca/21737/lorthographe/elision-et-apostrophe/elision-obligatoire) |

### Stems

| Rule | Kind | Message (en) | Sources |
|---|---|---|---|
| `fr.stem.group-stem` | rule | Take the infinitive ending off {before}: the stem is {after}-. | [BDL: Radical des verbes réguliers](https://vitrinelinguistique.oqlf.gouv.qc.ca/24212/la-grammaire/le-verbe/conjugaison/radical-des-verbes-reguliers-au-present-de-lindicatif); [BDL: Verbes réguliers](https://vitrinelinguistique.oqlf.gouv.qc.ca/24654/la-grammaire/le-verbe/conjugaison/verbes-reguliers-et-irreguliers) |
| `fr.stem.present-singular` | lexical | The stem of the present singular of {before} is {after}-. | [BDL: Radical des verbes irréguliers au présent](https://vitrinelinguistique.oqlf.gouv.qc.ca/24214/la-grammaire/le-verbe/conjugaison/radical-des-verbes-irreguliers-au-present-de-lindicatif); [BDL: Terminaisons -s, -s, -t ; -x, -x, -t ; -e, -es, -e](https://vitrinelinguistique.oqlf.gouv.qc.ca/24213/la-grammaire/le-verbe/conjugaison/terminaison-des-verbes-reguliers-et-irreguliers-au-present-de-lindicatif) |
| `fr.stem.nous` | lexical | The stem of nous in the present of {before} is {after}-; the imparfait and the present participle use it too. | [BDL: Radical de l’imparfait : celui de la 1re personne du pluriel](https://vitrinelinguistique.oqlf.gouv.qc.ca/24195/la-grammaire/le-verbe/conjugaison/formes-de-limparfait); [BDL: Radical des verbes irréguliers au présent](https://vitrinelinguistique.oqlf.gouv.qc.ca/24214/la-grammaire/le-verbe/conjugaison/radical-des-verbes-irreguliers-au-present-de-lindicatif) |
| `fr.stem.ils` | lexical | The stem of ils in the present of {before} is {after}-; the present subjunctive uses it too. | [BDL: Modification du radical au subjonctif présent](https://vitrinelinguistique.oqlf.gouv.qc.ca/24237/la-grammaire/le-verbe/conjugaison/formes-du-subjonctif); [BDL: Radical des verbes irréguliers au présent](https://vitrinelinguistique.oqlf.gouv.qc.ca/24214/la-grammaire/le-verbe/conjugaison/radical-des-verbes-irreguliers-au-present-de-lindicatif) |
| `fr.stem.future` | lexical | The future stem of {before} is {after}-; the conditionnel uses it too. | [BDL: Formes du futur simple](https://vitrinelinguistique.oqlf.gouv.qc.ca/24655/la-grammaire/le-verbe/conjugaison/formes-du-futur-simple); [BDL: Formes du conditionnel](https://vitrinelinguistique.oqlf.gouv.qc.ca/24137/la-grammaire/le-verbe/conjugaison/formes-du-conditionnel) |
| `fr.stem.past` | lexical | The passé simple stem of {before} is {after}-, with the vowel {theme}. | [BDL: Terminaisons en -is, -us, -ins](https://vitrinelinguistique.oqlf.gouv.qc.ca/24207/la-grammaire/le-verbe/conjugaison/formes-du-passe-simple) |
| `fr.stem.participle` | lexical | The past participle of {before} is built on {after}. | Académie: article et tableau de conjugaison du verbe; [BDL: Synthèse des règles d’accord](https://vitrinelinguistique.oqlf.gouv.qc.ca/24222/la-grammaire/le-verbe/accord-du-participe-passe/avec-lauxiliaire-etre/synthese-des-regles-daccord-du-participe-passe-employe-avec-etre) |
| `fr.stem.subjunctive` | lexical | The present subjunctive of {before} has a stem of its own: {after}-. | [BDL: Modification du radical pour plusieurs verbes irréguliers](https://vitrinelinguistique.oqlf.gouv.qc.ca/24237/la-grammaire/le-verbe/conjugaison/formes-du-subjonctif) |
| `fr.stem.imperative-from-subjunctive` | lexical | The imperative of {before} is taken from its subjunctive: {after}-. | [BDL: Avoir, être, savoir et vouloir](https://vitrinelinguistique.oqlf.gouv.qc.ca/24203/la-grammaire/le-verbe/conjugaison/formes-de-limperatif); [Académie: savoir, conjugaison](https://www.dictionnaire-academie.fr/conjuguer/A9S0657) |
| `fr.stem.participle-from-subjunctive` | lexical | The present participle of {before} is built on its subjunctive stem {after}-. | [Académie: savoir (sachant), conjugaison](https://www.dictionnaire-academie.fr/conjuguer/A9S0657); [Académie: avoir (ayant), conjugaison](https://www.dictionnaire-academie.fr/conjuguer/A9A3461) |
| `fr.stem.hint` | rule | The {part} stem you gave is used here: {after}-. | [BDL: Radical des verbes irréguliers](https://vitrinelinguistique.oqlf.gouv.qc.ca/24214/la-grammaire/le-verbe/conjugaison/radical-des-verbes-irreguliers-au-present-de-lindicatif) |
| `fr.stem.suppletive` | lexical | {after} is an irregular form of {before}: learn it by heart. | [BDL: Avoir, être et aller ; dites, faites](https://vitrinelinguistique.oqlf.gouv.qc.ca/24213/la-grammaire/le-verbe/conjugaison/terminaison-des-verbes-reguliers-et-irreguliers-au-present-de-lindicatif); Académie: article et tableau de conjugaison du verbe |
| `fr.stem.listed-spelling` | lexical | Beside {before}, the Académie’s table also prints {after}. | [Académie: enclore : il enclôt ou enclot, conjugaison](https://www.dictionnaire-academie.fr/conjuguer/A9E1359); [Académie: éclore : il éclôt ou éclot, conjugaison](https://www.dictionnaire-academie.fr/conjuguer/A9E0262) |

### Endings

| Rule | Kind | Message (en) | Sources |
|---|---|---|---|
| `fr.end.present-singular` | rule | Present singular: add -{ending} to {before}-. | [BDL: Terminaisons du présent](https://vitrinelinguistique.oqlf.gouv.qc.ca/24213/la-grammaire/le-verbe/conjugaison/terminaison-des-verbes-reguliers-et-irreguliers-au-present-de-lindicatif) |
| `fr.end.present-plural` | rule | Present plural: add -{ending} to {before}-. | [BDL: Terminaisons du présent](https://vitrinelinguistique.oqlf.gouv.qc.ca/24213/la-grammaire/le-verbe/conjugaison/terminaison-des-verbes-reguliers-et-irreguliers-au-present-de-lindicatif) |
| `fr.end.imperfect` | rule | Imparfait or conditionnel ending: add -{ending} to {before}-. | [BDL: Formes de l’imparfait](https://vitrinelinguistique.oqlf.gouv.qc.ca/24195/la-grammaire/le-verbe/conjugaison/formes-de-limparfait); [BDL: Formes du conditionnel](https://vitrinelinguistique.oqlf.gouv.qc.ca/24137/la-grammaire/le-verbe/conjugaison/formes-du-conditionnel) |
| `fr.end.future` | rule | Futur simple: add -{ending} to {before}-. | [BDL: Formes du futur simple](https://vitrinelinguistique.oqlf.gouv.qc.ca/24655/la-grammaire/le-verbe/conjugaison/formes-du-futur-simple) |
| `fr.end.simple-past` | rule | Passé simple: add -{ending} to {before}-. | [BDL: Formes du passé simple](https://vitrinelinguistique.oqlf.gouv.qc.ca/24207/la-grammaire/le-verbe/conjugaison/formes-du-passe-simple) |
| `fr.end.subjunctive` | rule | Present subjunctive: add -{ending} to {before}-. | [BDL: Le subjonctif présent](https://vitrinelinguistique.oqlf.gouv.qc.ca/24237/la-grammaire/le-verbe/conjugaison/formes-du-subjonctif) |
| `fr.end.subjunctive-imperfect` | rule | Imperfect subjunctive: add -{ending} to {before}-. | [BDL: Le subjonctif imparfait](https://vitrinelinguistique.oqlf.gouv.qc.ca/24237/la-grammaire/le-verbe/conjugaison/formes-du-subjonctif) |
| `fr.end.imperative` | rule | Imperative: add -{ending} to {before}-. | [BDL: Formes de l’impératif](https://vitrinelinguistique.oqlf.gouv.qc.ca/24203/la-grammaire/le-verbe/conjugaison/formes-de-limperatif) |
| `fr.end.present-participle` | rule | Present participle: add -{ending} to {before}-. | [Académie: céder (participe présent), conjugaison](https://www.dictionnaire-academie.fr/conjuguer/A9C1222); [BDL: La forme en -ant](https://vitrinelinguistique.oqlf.gouv.qc.ca/22915/la-grammaire/le-verbe/modes/distinction-entre-le-participe-present-et-ladjectif-participe) |
| `fr.end.past-participle` | rule | Past participle: add -{ending} to {before}-. | [Académie: céder (participe passé), conjugaison](https://www.dictionnaire-academie.fr/conjuguer/A9C1222); [BDL: Synthèse des règles d’accord](https://vitrinelinguistique.oqlf.gouv.qc.ca/24222/la-grammaire/le-verbe/accord-du-participe-passe/avec-lauxiliaire-etre/synthese-des-regles-daccord-du-participe-passe-employe-avec-etre) |
| `fr.end.infinitive` | rule | The infinitive is {after}. | [BDL: Terminaisons de l’infinitif](https://vitrinelinguistique.oqlf.gouv.qc.ca/24654/la-grammaire/le-verbe/conjugaison/verbes-reguliers-et-irreguliers) |

### Spelling (in this order)

| Rule | Kind | Message (en) | Sources |
|---|---|---|---|
| `fr.orth.eler-eter` | rule | Before a silent e the l or t of the stem is doubled: {before} becomes {after}. | [JO 1990: II.5](https://www.academie-francaise.fr/sites/academie-francaise.fr/files/rectifications.pdf); [BDL: Verbes en -eler et en -eter](https://vitrinelinguistique.oqlf.gouv.qc.ca/23169/lorthographe/rectifications-de-lorthographe/rectifications-liees-aux-consonnes-doubles/rectifications-liees-a-la-conjugaison-des-verbes-en-eler-et-en-eter); [Académie: appeler, conjugaison](https://www.dictionnaire-academie.fr/conjuguer/A9A2203); [Académie: acheter, conjugaison](https://www.dictionnaire-academie.fr/conjuguer/A9A0377) |
| `fr.orth.mute-e-grave` | rule | Before a silent e the e of the stem is said open and written è: {before} becomes {after}. | [BDL: Verbes en -e.er](https://vitrinelinguistique.oqlf.gouv.qc.ca/24212/la-grammaire/le-verbe/conjugaison/radical-des-verbes-reguliers-au-present-de-lindicatif); [BDL: Futur simple](https://vitrinelinguistique.oqlf.gouv.qc.ca/24655/la-grammaire/le-verbe/conjugaison/formes-du-futur-simple); [Académie: acheter, conjugaison](https://www.dictionnaire-academie.fr/conjuguer/A9A0377) |
| `fr.orth.closed-e-grave` | rule | Before a silent e the é of the stem becomes è: {before} becomes {after}. | [BDL: Verbes en -é.er](https://vitrinelinguistique.oqlf.gouv.qc.ca/24212/la-grammaire/le-verbe/conjugaison/radical-des-verbes-reguliers-au-present-de-lindicatif); [JO 1990: II.3 a](https://www.academie-francaise.fr/sites/academie-francaise.fr/files/rectifications.pdf); [BDL: Accent grave au futur et au conditionnel](https://vitrinelinguistique.oqlf.gouv.qc.ca/23165/lorthographe/rectifications-de-lorthographe/rectifications-liees-aux-accents-et-au-trema/rectifications-liees-au-remplacement-de-laccent-aigu-par-laccent-grave); [Académie: céder, conjugaison](https://www.dictionnaire-academie.fr/conjuguer/A9C1222) |
| `fr.orth.c-cedilla` | rule | c takes a cedilla before a, o or u so that it keeps its s sound: {before} becomes {after}. | [BDL: Verbes en -cer](https://vitrinelinguistique.oqlf.gouv.qc.ca/24212/la-grammaire/le-verbe/conjugaison/radical-des-verbes-reguliers-au-present-de-lindicatif); [BDL: C cédille](https://vitrinelinguistique.oqlf.gouv.qc.ca/24207/la-grammaire/le-verbe/conjugaison/formes-du-passe-simple) |
| `fr.orth.g-e` | rule | g takes an e before a or o so that it stays soft: {before} becomes {after}. | [BDL: Verbes en -ger](https://vitrinelinguistique.oqlf.gouv.qc.ca/24212/la-grammaire/le-verbe/conjugaison/radical-des-verbes-reguliers-au-present-de-lindicatif); [BDL: Verbes en -ger](https://vitrinelinguistique.oqlf.gouv.qc.ca/24195/la-grammaire/le-verbe/conjugaison/formes-de-limparfait) |
| `fr.orth.y-to-i` | rule | y becomes i before a silent e: {before} becomes {after}. | [BDL: Verbes en -yer](https://vitrinelinguistique.oqlf.gouv.qc.ca/24212/la-grammaire/le-verbe/conjugaison/radical-des-verbes-reguliers-au-present-de-lindicatif); [BDL: Verbes en -oyer, -uyer, -ayer](https://vitrinelinguistique.oqlf.gouv.qc.ca/24137/la-grammaire/le-verbe/conjugaison/formes-du-conditionnel); [Académie: payer, conjugaison](https://www.dictionnaire-academie.fr/conjuguer/A9P1095) |
| `fr.orth.diaeresis` | rule | This verb is spelt with ï, so the i of its ending is written ï too: {before} becomes {after}. | [Académie: haïr, conjugaison](https://www.dictionnaire-academie.fr/conjuguer/A9H0071); [BDL: Haïr et ouïr : le tréma](https://vitrinelinguistique.oqlf.gouv.qc.ca/24207/la-grammaire/le-verbe/conjugaison/formes-du-passe-simple) |
| `fr.orth.t-after-dental` | rule | After d, t or c the t of the third person singular is not written: {before} becomes {after}. | [BDL: Radical en d, t ou c à la 3e personne du singulier](https://vitrinelinguistique.oqlf.gouv.qc.ca/24213/la-grammaire/le-verbe/conjugaison/terminaison-des-verbes-reguliers-et-irreguliers-au-present-de-lindicatif) |
| `fr.orth.tt-singular` | rule | In the present singular an -ttre verb keeps only one t, as in il met: {before} becomes {after}. | [Académie: battre, conjugaison](https://www.dictionnaire-academie.fr/conjuguer/A9B0652); [Académie: mettre, conjugaison](https://www.dictionnaire-academie.fr/conjuguer/A9M1992) |
| `fr.orth.circumflex-before-t` | rule | Before the t of il the stem vowel takes a circumflex: {before} becomes {after}. | [BDL: Il clôt, il gît, il plaît](https://vitrinelinguistique.oqlf.gouv.qc.ca/23701/lorthographe/accents-trema-et-cedille/accent-circonflexe/laccent-circonflexe-dans-les-formes-verbales); [JO 1990: II.4 : plait](https://www.academie-francaise.fr/sites/academie-francaise.fr/files/rectifications.pdf); [Académie: gésir, conjugaison](https://www.dictionnaire-academie.fr/conjuguer/A9G0655); [Académie: clore, conjugaison](https://www.dictionnaire-academie.fr/conjuguer/A9C2658) |
| `fr.orth.croitre-homograph` | rule | croître keeps a circumflex here so that it is not spelt like croire: {before} becomes {after}. | [JO 1990: II.4 b : le verbe croître](https://www.academie-francaise.fr/sites/academie-francaise.fr/files/rectifications.pdf); [BDL: Exceptions : croître](https://vitrinelinguistique.oqlf.gouv.qc.ca/23166/lorthographe/rectifications-de-lorthographe/rectifications-liees-aux-accents-et-au-trema/rectifications-liees-a-laccent-circonflexe); [Académie: croître, conjugaison](https://www.dictionnaire-academie.fr/conjuguer/A9C5057) |
| `fr.orth.1990-circumflex` | rule | In the 1990 spelling i and u lose their circumflex: {before} becomes {after}. | [JO 1990: II.4](https://www.academie-francaise.fr/sites/academie-francaise.fr/files/rectifications.pdf); [BDL: Accent circonflexe : rectifications](https://vitrinelinguistique.oqlf.gouv.qc.ca/23166/lorthographe/rectifications-de-lorthographe/rectifications-liees-aux-accents-et-au-trema/rectifications-liees-a-laccent-circonflexe) |
| `fr.orth.1990-assoir` | rule | The 1990 spelling drops the e of -eoi-: {before} becomes {after}. | [JO 1990: III, Liste H : assoir, rassoir, sursoir](https://www.academie-francaise.fr/sites/academie-francaise.fr/files/rectifications.pdf); [BDL: ASSEOIR et ASSOIR](https://vitrinelinguistique.oqlf.gouv.qc.ca/23838/la-grammaire/le-verbe/conjugaison/emplois-du-verbe-asseoir) |
| `fr.orth.1990-sursoir-future` | rule | In the 1990 spelling the future and the conditionnel are built on the infinitive sursoir: {before} becomes {after}. The Académie prints only the forms with -seoi- (surseoirai). | [JO 1990: III, Liste H : sursoir (l’infinitif)](https://www.academie-francaise.fr/sites/academie-francaise.fr/files/rectifications.pdf) |
| `fr.orth.1990-interpeler` | rule | The 1990 spelling writes interpeler with one l, doubled only before a silent e: {before} becomes {after}. | [JO 1990: III, Anomalies : interpeler](https://www.academie-francaise.fr/sites/academie-francaise.fr/files/rectifications.pdf); [BDL: Appeler, jeter et leurs dérivés, y compris interpeler](https://vitrinelinguistique.oqlf.gouv.qc.ca/23169/lorthographe/rectifications-de-lorthographe/rectifications-liees-aux-consonnes-doubles/rectifications-liees-a-la-conjugaison-des-verbes-en-eler-et-en-eter) |
| `fr.orth.1990-absout` | rule | The 1990 spelling ends the masculine in t, like the feminine absoute: {before} becomes {after}. | [JO 1990: III, Liste : absout, absoute](https://www.academie-francaise.fr/sites/academie-francaise.fr/files/rectifications.pdf); [Académie: absoudre, conjugaison](https://www.dictionnaire-academie.fr/conjuguer/A9A0175) |

### Compound tenses

| Rule | Kind | Message (en) | Sources |
|---|---|---|---|
| `fr.periphrasis.perfect` | rule | Passé composé: the present of {auxiliary} plus the past participle. | [BDL: Avoir et être forment les temps composés](https://vitrinelinguistique.oqlf.gouv.qc.ca/24224/la-grammaire/le-verbe/auxiliaires/emploi-des-auxiliaires-avoir-et-etre); [Académie: céder (passé composé), conjugaison](https://www.dictionnaire-academie.fr/conjuguer/A9C1222) |
| `fr.periphrasis.pluperfect` | rule | Plus-que-parfait: the imparfait of {auxiliary} plus the past participle. | [BDL: Avoir et être forment les temps composés](https://vitrinelinguistique.oqlf.gouv.qc.ca/24224/la-grammaire/le-verbe/auxiliaires/emploi-des-auxiliaires-avoir-et-etre); [Académie: céder (plus-que-parfait), conjugaison](https://www.dictionnaire-academie.fr/conjuguer/A9C1222) |
| `fr.periphrasis.past-anterior` | rule | Passé antérieur: the passé simple of {auxiliary} plus the past participle. | [BDL: Avoir et être forment les temps composés](https://vitrinelinguistique.oqlf.gouv.qc.ca/24224/la-grammaire/le-verbe/auxiliaires/emploi-des-auxiliaires-avoir-et-etre); [Académie: céder (passé antérieur), conjugaison](https://www.dictionnaire-academie.fr/conjuguer/A9C1222) |
| `fr.periphrasis.future-perfect` | rule | Futur antérieur: the future of {auxiliary} plus the past participle. | [BDL: Avoir et être forment les temps composés](https://vitrinelinguistique.oqlf.gouv.qc.ca/24224/la-grammaire/le-verbe/auxiliaires/emploi-des-auxiliaires-avoir-et-etre); [Académie: céder (futur antérieur), conjugaison](https://www.dictionnaire-academie.fr/conjuguer/A9C1222) |
| `fr.periphrasis.subjunctive-past` | rule | Past subjunctive: the present subjunctive of {auxiliary} plus the past participle. | [BDL: Le subjonctif passé](https://vitrinelinguistique.oqlf.gouv.qc.ca/24237/la-grammaire/le-verbe/conjugaison/formes-du-subjonctif); [Académie: céder (subjonctif passé), conjugaison](https://www.dictionnaire-academie.fr/conjuguer/A9C1222) |
| `fr.periphrasis.subjunctive-pluperfect` | rule | Pluperfect subjunctive: the imperfect subjunctive of {auxiliary} plus the past participle. | [JO 1990: II.4 a : plus-que-parfait du subjonctif](https://www.academie-francaise.fr/sites/academie-francaise.fr/files/rectifications.pdf); [Académie: céder (subjonctif plus-que-parfait), conjugaison](https://www.dictionnaire-academie.fr/conjuguer/A9C1222) |
| `fr.periphrasis.conditional-past` | rule | Past conditional: the conditionnel of {auxiliary} plus the past participle. | [BDL: Avoir et être forment les temps composés](https://vitrinelinguistique.oqlf.gouv.qc.ca/24224/la-grammaire/le-verbe/auxiliaires/emploi-des-auxiliaires-avoir-et-etre); [Académie: céder (conditionnel passé), conjugaison](https://www.dictionnaire-academie.fr/conjuguer/A9C1222) |
| `fr.periphrasis.conditional-past-second` | rule | Literary past conditional: the imperfect subjunctive of {auxiliary} plus the past participle. | [JO 1990: II.4 a : conditionnel passé deuxième forme](https://www.academie-francaise.fr/sites/academie-francaise.fr/files/rectifications.pdf) |
| `fr.periphrasis.imperative-past` | rule | Past imperative: the imperative of {auxiliary} plus the past participle. | [BDL: Impératif passé](https://vitrinelinguistique.oqlf.gouv.qc.ca/24203/la-grammaire/le-verbe/conjugaison/formes-de-limperatif); [Académie: céder (impératif passé), conjugaison](https://www.dictionnaire-academie.fr/conjuguer/A9C1222) |
| `fr.periphrasis.infinitive-past` | rule | Past infinitive: {auxiliary} plus the past participle. | [BDL: Avoir et être forment les temps composés](https://vitrinelinguistique.oqlf.gouv.qc.ca/24224/la-grammaire/le-verbe/auxiliaires/emploi-des-auxiliaires-avoir-et-etre) |
| `fr.periphrasis.participle-perfect` | rule | Compound participle: the present participle of {auxiliary} plus the past participle. | [Académie: céder (ayant cédé), conjugaison](https://www.dictionnaire-academie.fr/conjuguer/A9C1222); [BDL: Avoir et être forment les temps composés](https://vitrinelinguistique.oqlf.gouv.qc.ca/24224/la-grammaire/le-verbe/auxiliaires/emploi-des-auxiliaires-avoir-et-etre) |
| `fr.periphrasis.gerund-past` | rule | Past gerund: en, the present participle of {auxiliary}, then the past participle. | [BDL: Gérondif : en + forme en -ant](https://vitrinelinguistique.oqlf.gouv.qc.ca/22915/la-grammaire/le-verbe/modes/distinction-entre-le-participe-present-et-ladjectif-participe); [BDL: Avoir et être forment les temps composés](https://vitrinelinguistique.oqlf.gouv.qc.ca/24224/la-grammaire/le-verbe/auxiliaires/emploi-des-auxiliaires-avoir-et-etre) |
| `fr.periphrasis.near-future` | rule | Futur proche: the present of aller plus the infinitive. | [BDL: Le futur proche : aller au présent suivi d’un infinitif](https://vitrinelinguistique.oqlf.gouv.qc.ca/24122/la-grammaire/le-verbe/temps-grammaticaux/futur/le-futur-proche) |
| `fr.periphrasis.recent-past` | rule | Passé récent: the present of venir, then de, then the infinitive. | [TLFi: venir : semi-auxiliaire du passé récent, venir de + inf.](https://www.cnrtl.fr/definition/venir) |

### Clause

| Rule | Kind | Message (en) | Sources |
|---|---|---|---|
| `fr.clause.subject` | rule | The subject pronoun {pronoun} comes before the verb. | [Académie: céder, conjugaison](https://www.dictionnaire-academie.fr/conjuguer/A9C1222); [BDL: Formes de l’impératif, introduction](https://vitrinelinguistique.oqlf.gouv.qc.ca/24203/la-grammaire/le-verbe/conjugaison/formes-de-limperatif) |
| `fr.clause.subject-gender` | rule | This form is for a {gender} subject. | [BDL: Synthèse des règles d’accord](https://vitrinelinguistique.oqlf.gouv.qc.ca/24222/la-grammaire/le-verbe/accord-du-participe-passe/avec-lauxiliaire-etre/synthese-des-regles-daccord-du-participe-passe-employe-avec-etre); [Académie: céder, conjugaison](https://www.dictionnaire-academie.fr/conjuguer/A9C1222) |
| `fr.clause.impersonal-subject` | rule | This verb is impersonal: its only subject is the neutral il, which never becomes elle. | [Académie: article falloir](https://www.dictionnaire-academie.fr/article/A9F0145) |
| `fr.clause.que` | rule | The subjunctive is given after que, the way it is used in a clause. | [Académie: céder, conjugaison](https://www.dictionnaire-academie.fr/conjuguer/A9C1222); [BDL: Le subjonctif présent](https://vitrinelinguistique.oqlf.gouv.qc.ca/24237/la-grammaire/le-verbe/conjugaison/formes-du-subjonctif) |
| `fr.clause.gerund-en` | rule | The gerund is en followed by the present participle. | [BDL: Participe présent](https://vitrinelinguistique.oqlf.gouv.qc.ca/22915/la-grammaire/le-verbe/modes/distinction-entre-le-participe-present-et-ladjectif-participe) |
| `fr.clause.reflexive-pronoun` | rule | A pronominal verb takes the reflexive pronoun {pronoun} before the verb. | [Académie: asseoir (voix pronominale), conjugaison](https://www.dictionnaire-academie.fr/conjuguer/A9A2823); [BDL: Le pronom réfléchi](https://vitrinelinguistique.oqlf.gouv.qc.ca/22942/la-grammaire/le-verbe/accord-du-participe-passe/avec-lauxiliaire-etre/accord-du-participe-passe-des-verbes-occasionnellement-pronominaux) |
| `fr.clause.reflexive-imperative` | rule | In the imperative the reflexive pronoun follows the verb, joined by a hyphen: -{pronoun}. | [BDL: Trait d’union](https://vitrinelinguistique.oqlf.gouv.qc.ca/24206/la-grammaire/les-pronoms/pronoms-personnels/pronoms-personnels-employes-avec-un-verbe-a-limperatif); [Académie: asseoir (voix pronominale), conjugaison](https://www.dictionnaire-academie.fr/conjuguer/A9A2823) |
| `fr.clause.agree-subject` | rule | With être the past participle agrees with the subject in gender and number. | [BDL: Le participe passé employé avec être s’accorde avec le sujet](https://vitrinelinguistique.oqlf.gouv.qc.ca/24222/la-grammaire/le-verbe/accord-du-participe-passe/avec-lauxiliaire-etre/synthese-des-regles-daccord-du-participe-passe-employe-avec-etre) |
| `fr.clause.agree-object` | rule | The past participle agrees with the direct object that comes before the verb. | [BDL: Accord avec le complément direct placé avant le verbe](https://vitrinelinguistique.oqlf.gouv.qc.ca/24221/la-grammaire/le-verbe/accord-du-participe-passe/avec-lauxiliaire-avoir/synthese-des-regles-daccord-du-participe-passe-employe-avec-avoir); [BDL: Verbes occasionnellement pronominaux](https://vitrinelinguistique.oqlf.gouv.qc.ca/22942/la-grammaire/le-verbe/accord-du-participe-passe/avec-lauxiliaire-etre/accord-du-participe-passe-des-verbes-occasionnellement-pronominaux) |
| `fr.clause.no-agreement-avoir` | rule | With avoir and no direct object before the verb, the past participle stays masculine singular. | [BDL: Sans complément direct placé avant : pas d’accord](https://vitrinelinguistique.oqlf.gouv.qc.ca/24221/la-grammaire/le-verbe/accord-du-participe-passe/avec-lauxiliaire-avoir/synthese-des-regles-daccord-du-participe-passe-employe-avec-avoir) |
| `fr.clause.no-agreement-indirect` | rule | The reflexive pronoun is an indirect object here, so the past participle stays masculine singular. | [BDL: Le pronom réfléchi est complément indirect : pas d’accord](https://vitrinelinguistique.oqlf.gouv.qc.ca/22942/la-grammaire/le-verbe/accord-du-participe-passe/avec-lauxiliaire-etre/accord-du-participe-passe-des-verbes-occasionnellement-pronominaux) |
| `fr.clause.invariable-participle` | rule | This past participle never changes: it has no feminine or plural form. | [Académie: dormir, conjugaison](https://www.dictionnaire-academie.fr/conjuguer/A9D3072); [Académie: falloir, conjugaison](https://www.dictionnaire-academie.fr/conjuguer/A9F0145) |
| `fr.clause.participle-forms` | rule | The past participle on its own, in its {gender} {number} form. | [Académie: céder, conjugaison](https://www.dictionnaire-academie.fr/conjuguer/A9C1222) |
| `fr.clause.elision` | rule | {word} becomes {after} before a vowel or a mute h. | [BDL: Élision obligatoire](https://vitrinelinguistique.oqlf.gouv.qc.ca/21737/lorthographe/elision-et-apostrophe/elision-obligatoire); [BDL: Élision interdite devant le h aspiré](https://vitrinelinguistique.oqlf.gouv.qc.ca/21745/lorthographe/elision-et-apostrophe/elision-interdite) |

### Availability

| Rule | Kind | Message (en) | Sources |
|---|---|---|---|
| `fr.avail.defective` | unavailable | This verb is defective: this form is not used. | [Académie: article clore (verbe défectif)](https://www.dictionnaire-academie.fr/article/A9C2658); [Académie: article gésir (verbe défectif)](https://www.dictionnaire-academie.fr/article/A9G0655) |
| `fr.avail.third-person-only` | unavailable | This verb is only used in the third person (il, elle, ils, elles). | [Académie: article seoir (uniquement à la 3e personne)](https://www.dictionnaire-academie.fr/article/A9S1259) |
| `fr.avail.impersonal` | unavailable | This verb is impersonal: it only exists with il, so this person has no form. | [Académie: article falloir (verbe impersonnel)](https://www.dictionnaire-academie.fr/article/A9F0145); [BDL: Verbes essentiellement impersonnels](https://vitrinelinguistique.oqlf.gouv.qc.ca/24584/la-grammaire/le-verbe/auxiliaires/tableau-synthese-de-lemploi-des-auxiliaires-avoir-et-etre) |
| `fr.avail.no-imperative` | unavailable | This verb has no imperative. | [Académie: pouvoir (sans impératif), conjugaison](https://www.dictionnaire-academie.fr/conjuguer/A9P3829); [Académie: falloir (sans impératif), conjugaison](https://www.dictionnaire-academie.fr/conjuguer/A9F0145) |
| `fr.avail.pronominal-imperative-past` | unavailable | A pronominal verb is not given a past imperative. | [BDL: Impératif passé : formes du subjonctif passé, aucune forme pronominale donnée](https://vitrinelinguistique.oqlf.gouv.qc.ca/24203/la-grammaire/le-verbe/conjugaison/formes-de-limperatif) |

## Defaults and assumptions

An assumption is recorded first in the analysis and is never restated as a fact:

| Assumption | When |
|---|---|
| `fr.classify.assume-regular` | an unlisted verb is read as a regular -er, -ir or -re verb |
| `fr.classify.family-suffix` | an unlisted verb is conjugated like the family whose suffix it ends with (conduire like cuire) |
| `fr.classify.assume-avoir` | an unlisted non-reflexive verb defaults to avoir |
| `fr.classify.assume-direct-reflexive` | the reflexive pronoun of an unlisted pronominal verb is assumed direct |
| `fr.classify.assume-mute-h` | an unlisted initial h is assumed mute |

`preferredOrthography` (default rectified) only orders the two spellings; both stay answers.

## The family lexicon

`families.ts` has one entry per family (95, 102 paradigms), generated once from the former model tables and maintained
by hand. 90 families are marked `verified` against the Académie's conjugation table of their representative verb
(checked 2026-11-25): the forms both print agree, alternatives being allowed to be a subset. The rest are listed in
`frenchSecondaryOnly` (`sources.ts`).

## Spellings no checked authority supports

These are kept until the user decides (`frenchSecondaryOnly`):

- surseoir: rectified future and conditional sursoir- (`fr.orth.1990-sursoir-future`), built on the 1990 infinitive
  sursoir (JO 1990 III, Liste H). Secondary source only: note (a) to the same Liste H reads "j'assoirai … (mais je
  surseoirai)", and the Académie prints only surseoirai. The traditional surseoirai stays; the rectified form is
  preferred by the general rule (rectified first).
- bruire: past participle bruit; the Académie gives brui (invariable).
- rassir: kept as infinitive and participle (rassis) only; the Académie conjugates it like finir (rassi).
- issir: no entry in the 9th edition (8th edition A8I1568-A only).

Two cells carry a second word that the Académie's table prints after « ou », in both spellings and after the derived
one (`fr.stem.listed-spelling`): il enclôt ou enclot (enclore, A9E1359) and il éclôt ou éclot (éclore, A9E0262).
croître's participle is crû, crue, crus, crues and clore's 3sg il clôt, in both spellings (JO 1990 II.4; Académie
A9C5057, A9C2658); the former listed rectified crûe, crûs, crûes and il clot are gone.

## Intended differences from the frozen snapshot

Line entries in `tests/characterization/intended-diffs.json` (each with its reason and an Académie, JO 1990 or BDL
source; corpus fixtures that held the old form have a sourced correction in `tests/fixtures/corrections.json`):

- bleder, crebler, pequer: the mute e of the last stem syllable becomes è before a mute ending whatever consonant
  follows (je blède, je crèble, je pèque; analysis `lever` instead of `aimer`). The former tables only knew -emer,
  -ener, -eper, -erer, -eser, -ever, -evrer, -ecer. Source: BDL 24212.
- blettre: -ttre verbs keep one t in the singular present and the imperative (je blets, il blet, blets), as battre and
  mettre do in the Académie's tables; the former tables wrote bletts, blett.
- Auxiliaries: an avoir that no checked table gives is recorded as the assumption `fr.classify.assume-avoir` (invented
  verbs of a family, férir, issir, ensuivre); paraître takes avoir or être (Académie A9P0487); atteindre is listed with
  avoir (A9A3024).
- croître: participle crû, crue, crus, crues in both spellings (A9C5057). clore: il clôt in both spellings (A9C2658).
  enclore: il enclôt and il enclot in both spellings, enclôt first (A9E1359). asseoir (assois): future and conditional
  assoir- in both spellings (A9A2823). faillir: avoir only, invariable participle; an `auxiliary: 'être'` hint is now
  refused (A9F0105). Invented verbs of these families and of devoir (…du in the 1990 spelling, JO 1990 II.4) follow.

Behaviour changes outside the snapshot: every unlisted -e(C)er verb whose consonant opens a syllable takes è (zeger,
blecher); hinted stems go through the spelling rules (blouper + `stems.plural: 'blac'` → nous blaçons); the 1990
circumflex rule applies to every group (mûrir → murir) and keeps jeûne(s), and dû only for devoir itself (redevoir:
redu, traditionally redû); `model` naming a productive model must be the one the verb's spelling gives. Outside the
snapshot the Académie's tables also give apparaître, réapparaître, disparaître, éclore, redescendre and ressusciter
avoir or être, and redevenir être.

## Open questions for the user

1. The unsupported forms above (surseoir, bruire, rassir, issir): keep or ledger a change.
2. Forms the Académie prints that French lacks: the imperative of gésir (gis, gisons, gisez), choir (chois), déchoir and
   faillir; the passé simple and imperfect subjunctive of absoudre (absolus); frire's participe présent (friant); braire
   in every person; choir's chussent.
3. Forms French has that the Académie does not print: paître's future, subjunctive and conditional; clore's and
   enclore's present plural, future, subjunctive and conditional; bruire's present singular, future and conditional;
   échoir's imparfait; the participles of seoir and messeoir; férir's féru (the Académie gives the infinitive only).
4. Participles the Académie marks invariable that French declines: bouillir, prévaloir, surseoir, déchoir, choir and
   croître (intransitive), raire.
5. The pronominal past imperative: French reports it unavailable, the Académie prints sois-toi assis (asseoir).

## Limits

Active voice only; no negation, inversion, surcomposé tenses or object pronouns other than the reflexive; no `on`.
Spelling cannot tell transitivity, lexical sense or a preceding object: the hints `auxiliary`, `reflexiveObject`,
`precedingDirectObject`, `agreement` and `aspiratedH` supply them.
