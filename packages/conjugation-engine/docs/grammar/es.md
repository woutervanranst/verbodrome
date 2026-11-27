# Spanish grammar: rules, defaults and limits

The Spanish pack (`src/languages/es/`) derives every form by recorded rules from the NGLE (RAE & ASALE, *Nueva gramática de
la lengua española*, 2009, chapter 4), the *Ortografía de la lengua española* (2010) and the DLE / DPD entries of each
verb. Written accents are never stored in stems or endings: they are computed from the stressed vowel and the
syllables (only whole-word lexical forms such as *éramos* carry a stored tilde).

**Read this first.** The RAE sites (rae.es, dle.rae.es) refused automated reading and no browser was available while the
pack was built. No NGLE, Ortografía, DLE, DPD or GTG page was read by the implementer: every such citation carries
"(unverified: not yet read)" in its locator, every lexicon lemma is recorded as unchecked in `verification.ts`, and the
section "Unverified against the RAE" below lists the pages to open by hand.

## How a form is built

1. **Classify** (`classify.ts`). In this order:
   1. Strip a reflexive `-se`, and restore the tilde of an unaccented `-eír` / `-oír`.
   2. Take the conjugation from the ending (`-ar`, `-er`, `-ir`).
   3. Look the verb up in the lexicon (two-paradigm lemmas give two outcomes: apostar, aterrar, atestar).
   4. Otherwise, a strong base after a closed prefix (componer = com + poner, retrotraer = retro + traer).
   5. Otherwise, a derivative the lexicon lists with its base (prever → ver, devolver → volver, sofreír → freír). desosar and desovar keep the h of hueso / huevo lexically (deshueso, deshuevo).
   6. Otherwise, a suffix family or rule class: `-ducir`, `-scribir`, `-eír` (like reír) or `-oír` (like oír).
   7. Otherwise, a regular verb with recorded assumptions.

   Hints come last: `classHint`, `stems.stress`, `stems.zc`.
2. **Stem** (`stems.ts`). Root-stressed cells take the diphthong or e→i. In -ir verbs, cells whose ending has no stressed i take the raised vowel. Then come the stored 1sg stem and the subjunctive built on it, zc, y after -uir / oír, the strong preterite and -duj-, the future stem, and the third-person-plural preterite base of the imperfect and future subjunctive. Lexical whole words (ser, ir, haber, the short tú commands, irregular participles) come from the `cell` hook. A doublet participle (frito / freído) returns the listed word and the derived one.
3. **Ending** (`paradigms.ts`). The ending sets of the grammar design §4.3. Each ending carries the position of its stressed vowel, or `root` for a root-stressed cell.
4. **Spelling** (`orthography.ts`), in order:
   1. the consonant spellings c/qu, g/gu, gu/gü, z/c, c/z, g/j, gu/g, qu/c;
   2. unstressed i → y;
   3. the i absorbed after ñ, ll, i or a strong j;
   4. ü → u before y;
   5. hue- / ye- only at the very start of a word (huelo, yerro; desuello has none);
   6. güe after g;
   7. then the accent: hiatus tilde, general rules, no tilde on a monosyllable, the diacritic of dé / sé.

   Verbs with both stresses (agriar, evacuar) fork in the hiatus rule into a `diphthong` form and a `hiatus` form. Each form records why.
5. **Compound tenses** (`periphrasis.ts`): haber in a simple tense plus the participle (pack form `compound-participle`), and the negative imperative, `no` plus the present subjunctive.
6. **Clause** (`clause.ts`). Word order: que (subjunctive) · subject pronoun (not for a command, nor for a weather verb) · no · proclitic reflexive pronoun · auxiliary · verb.
   - **Enclitics:** the pronoun is attached to the end of an affirmative command, an infinitive or a gerund (to haber in their compound forms).
   - **Dropped letters:** the vosotros command loses its -d before os, the nosotros command its -s before nos.
   - **Accent:** the longer word keeps its stress and is re-written by the accent rules (levántate).
   - **irse:** idos (keeps its d, the form the RAE recommends) comes first; iros (the infinitive with os, also valid) follows, tagged `iros`.
   - **No pronoun:** weather verbs (llueve) and third-person-only verbs (concierne) render no subject pronoun.
7. **Availability** (`grammar.ts`):
   - weather verbs: only the third person singular, without a pronoun;
   - soler: no future tenses, conditional or imperative;
   - concernir, atañer, acaecer, acontecer: third persons only, without a pronoun;
   - balbucir: no -zc- forms;
   - embaír: only the forms whose ending begins with i;
   - haber: no imperative.

## Subjects and gender

The default subjects are yo, tú, él, nosotros, vosotros and ellos (slots `1sg` … `3pl`). ella, nosotras, vosotras and
ellas (`3sg.f`, `1pl.f`, `2pl.f`, `3pl.f`) come with `gender: 'feminine'` or by `subject`. usted and ustedes
(`2sg.formal`, `2pl.formal`, `register: 'formal'`) are formal address and, as in every pack, come only when `subject`
names them, in the imperative too (`subject: '2sg.formal', mood: 'imperative'` gives hable). A slot's gender is its
forms' `target.gender` (él, nosotros: masculine; ella, nosotras: feminine; yo, tú, usted: none): the participle after
haber does not agree, so the subject is the only place a Spanish form shows gender.

## The written accent (`syllables.ts`)

- **Vowel letters.** The vowel letters are a e i o u ü, with their accented forms. These are not vowels:
  - the silent u of gue / gui / que / qui;
  - y, except at the end of a word after a vowel (estoy).

  An h between two vowels does not separate them (prohíbo, rehúso, ahínco).
- **The stressed vowel.**
  - An ending-stressed cell counts its stressed vowel from the end of the word.
  - A root-stressed cell takes the last vowel of the stem after the prefix. A final i or u after a consonant is a glide (cambio), unless the verb is a hiatus verb (envío) or the stem has no other vowel (guío, río).
  - In a group of vowels the stress takes the open vowel, or for a hiatus verb the close one.
  - Two open vowels are never one group (acaece).
  - A stem the lexicon stores never uses the hiatus flag (oigo, traigo).
- **Syllable nuclei.** Two touching vowels share a nucleus unless:
  - both are open, or
  - the close one is the stressed one.

  ui / iu always share one, but an open vowel before them does not join them: re-huí, not one syllable *rehui*.
- **The tilde.**
  - A stressed i or u beside an open vowel takes the hiatus tilde.
  - Otherwise, a one-syllable word takes none (dio, guio, rio, hui).
  - Otherwise the general rules apply:
    - the last syllable stressed: a tilde if the word ends in a vowel, n or s;
    - the second-to-last: a tilde if it does not;
    - an earlier syllable: always.
  - A tilde goes on the open vowel of its nucleus, and on the second of ui / iu.

## Defaults and assumptions

An unlisted verb is regular and records `es.classify.assume-regular`. It also records, only where they decide a form:
- `es.classify.assume-glide`: an -iar verb is stressed like cambiar;
- `es.classify.assume-diphthong`: a root group of an open and a close vowel is one syllable, like causar;
- `es.classify.assume-zc`: a vowel + -cer / -cir verb inserts zc like conocer.

Some classes need no assumption because a rule decides them:
- **-uar** (`es.classify.uar-stress`): stressed u, except after g or c;
- **-iar with no other vowel in the stem** (`es.classify.iar-single-vowel`): ciar, criar, fiar, guiar, liar, piar, triar and invented fliar stress the i (cío); their one-syllable preterites still take no tilde (crie, lio, guio). Longer -iar verbs keep the diphthong default as an assumption unless they are on the hiatus list (enviar, gloriar);
- **-eír / -oír** (`es.classify.eir`, `es.classify.oir`).

A class hint that does not fit the stem (e-ie on a verb whose stem has no e) is `INVALID_HINT`.

Vowel alternation is never inherited through a guessed prefix (pretender is regular). A strong base inherits only through the closed prefix list, and the step `es.classify.prefixed` records it.

## Variants

Every form beyond the first in a target carries a tag (the first may carry one too, as frito `irregular` does):
- `ra` / `se` (imperfect and pluperfect subjunctive);
- `usage: 'dated'` (future subjunctive);
- `diphthong` / `hiatus` (both stresses);
- `irregular` / `regular` (frito / freído, impreso / imprimido, provisto / proveído; predeciré before prediré; contradiré, desdiré, antediré and interdiré before their regular forms; yace before yaz; satisfaz before satisface; roo before roigo and royo). The regular form is always derived by the rules (`regularToo` in the lexicon); only the irregular one is stored;
- the stored variants (yacer `zc` / `zg` / `g`, roer `ig` / `y` beside the regular roo, raer `ig` / `y`, erguir `ye` / `i`, ir `vamos` / `vayamos`);
- `iros` (idos, first, is untagged);
- `pudrir` / `podrir`;
- errar's `regular` with `region: 'America'` (erro);
- engrosar, cimentar and emparentar `regular` / `ue` or `ie`; atestar 'to cram' `ie` / `regular`.

Two cases need a word on their own:
- **apostar, aterrar, atestar** carry their paradigm's `pattern` and `condition`.
- **No adjectival participles.** electo, preso, bendito, maldito, bienquisto and malquisto are adjectives, not participles of their verbs (NGLE §4.12, controller ruling): they are not generated.

## Out of scope

- voseo (room is left for a `2sg.vos` slot);
- the passive;
- estar + gerund and the other periphrases;
- existential *hay* (haber is modelled as the auxiliary);
- object clitics other than the reflexive;
- negation outside the negative imperative;
- participle agreement in adjectival use;
- archaic forms (plugo, habed);
- the figurative plural of weather verbs.

## Corpus

**Source.** 89 pages (one verb each), 124 cells per page plus 4 template placeholders.

**Totals.** 11,036 cells: 10,791 available and 245 unavailable. 116 corrections, 6 remaps, 0 unmodelled cells.

**Guard.** The extra-forms guard is on (`requireTaggedExtras`).

**Remaps.** The page labels "Past perfect", "Past future" (in both moods), the subjunctive "Past" and "Gerundive" are remapped to:
- the past anterior;
- the future perfect (both moods);
- the subjunctive past;
- the gerund (simple and compound).

**Corrections** (`scripts/corpus/corrections/es.ts`):

| Verb | Cells | Why |
|---|---|---|
| abolir | 29 | fully conjugated now; the page leaves the root-stressed forms empty and cuts `no abol-` |
| soler | 40 | compound tenses, gerund and participle exist; only the future tenses, conditional and imperative are lacking |
| llover | 18 | a weather verb has no subject pronoun (él llueve → llueve) |
| ahincar | 14 | hiatus tilde through h (ahínco) |
| guiar | 5 | no tilde on monosyllables since 2010 (guie, guio, guiais) |
| reír | 3 | the same (rio, riais) |
| adquirir | 2 | adquiriste, adquiristeis |
| podrir | 2 | pudr- only (pudrí, pudriré); podrí / podriré are regional |
| salir, valer | 1 each | saldrías, valdrías |
| elegir | 1 | electo is an adjective, not a second participle |

## Lexicon verification

`src/languages/es/verification.ts` is a hand record, one line per lexicon lemma (408).
- **What each line holds:** the lemma's DLE page, `raeRead: false`, and the pages actually read instead:
  - English Wiktionary conjugation tables for 26 lemmas, read through a look-up helper on 24 Nov 2026;
  - engrosar, read by the implementer on 27 Nov 2026;
  - the RAE note on iros, for ir.
- **What a secondary page does:** it does not verify an entry.
- **The check:** `tests/es/verification.test.ts` matches the record against the lexicon in both directions.
- **For the ledger,** the implementer also read en.wiktionary abolir, adquirir, ahincar, pudrir, elegir and llover on 27 Nov 2026.

**Secondary-source disagreements kept as the design or the rulings have them:**
- anticuar: anticúo;
- auxiliar: both stresses;
- the contradecir / desdecir futures: irregular first, regular tagged.

## Unverified against the RAE

Open these by hand; a page that contradicts the pack changes the rule (and the ledger), never the other way round.

**Grammar and orthography.**
- NGLE, chapter 4 (§4.3–4.16 as cited per rule), online at https://www.rae.es/gram%C3%A1tica/morfolog%C3%ADa/ .
- Ortografía 2010, §3.4.1–3.4.5, at:
  - https://www.rae.es/ortograf%C3%ADa/reglas-de-acentuaci%C3%B3n
  - https://www.rae.es/ortograf%C3%ADa/palabras-con-hiato
  - https://www.rae.es/ortograf%C3%ADa/formas-verbales-con-pronombres-cl%C3%ADticos

**DPD entries** (https://www.rae.es/dpd/<entry>), one per claim:
- abolir: fully conjugated;
- pudrir: one verb, podrido, podrí regional;
- soler: future, conditional and imperative lacking; compounds exist;
- llover: impersonal, no subject;
- concernir, atañer: third persons;
- balbucir: no -zc- forms;
- haber: no imperative;
- averiguar: -guar / -cuar unstressed u, except anticuar; adecuar, evacuar and licuar admit both;
- errar: erro in America;
- engrosar: regular usual;
- predecir (regular future first), contradecir, desdecir: futures;
- atestar, cimentar, emparentar: regular conjugation beside the e→ie one;
- embaír: defective;
- desosar, desovar: deshueso, deshuevo;
- bendecir, maldecir: regular future and participle;
- yacer, roer, raer, satisfacer: variant lists;
- erguir: yergo / irgo;
- ir: vamos / vayamos;
- pronombres personales átonos: d- and s-drop;
- conducir, leer, reír, oír: rule classes;
- ayuda/lemas-con-superindice: apostar, aterrar, atestar.

**GTG** (https://www.rae.es/gtg/<term>):
- futuro-simple-de-subjuntivo, futuro-compuesto-de-subjuntivo: dated future subjunctive;
- imperativo: negative imperative;
- verbo-regular: consonant spellings.

**DLE** (https://dle.rae.es/<lemma>): the conjugation table of every lemma in `verification.ts`. In particular:
- the stem-vowel lists of `lexicon.ts`: the alternation lemmas, including those added after the stint-1 and whole-pack reviews;
- the hiatus and both-stress lists;
- the doublet participles of freír, imprimir and proveer.

**Expected forms.** The forms of `tests/es/real.test.ts` and `tests/es/invented.test.ts` are derived from the rules above, not read from the DLE.

## Rule inventory

94 rules. "(secondary only)" marks the rules whose only source the implementer could read is a secondary copy of an RAE text (`secondaryOnly` in `sources.ts`). Every RAE citation is marked "(unverified: not yet read)".

### classify

| Rule | Kind | What it says (English message) | Sources |
|---|---|---|---|
| `es.classify.conjugation` | rule | {before} ends in {ending}, so its regular model is {model}. | [ngle: §4.3, §4.6 (unverified: not yet read)](https://www.rae.es/gram%C3%A1tica/morfolog%C3%ADa/) |
| `es.classify.reflexive` | rule | {before} is reflexive: the verb is {base}, and every form takes a reflexive pronoun (me, te, se, nos, os). | [dpd: «pronombres personales átonos» (unverified: not yet read)](https://www.rae.es/dpd/pronombres%20personales%20%C3%A1tonos) |
| `es.classify.restore-accent` (secondary only) | rule | Infinitives in -eír and -oír always have an accent on the i, so {before} is written {after}. | [orto: §3.4.2 (unverified: not yet read)](https://www.rae.es/ortograf%C3%ADa/palabras-con-hiato); [dpd-tilde: §2.2.2](https://induccion.urosario.edu.co/sites/default/files/2023-02/material-de-apoyo-la-tilde-segun-la-rae.pdf) |
| `es.classify.lexicon` | lexical | {checked, select, yes {The DLE lists {before}} other {This pack's lexicon lists {before} (not yet checked against the DLE)}}{own, select, yes {: it is a model verb of its own} other {: it is conjugated like {model}}}. | [dle: the verb's entry and its conjugation table (unverified: not yet read)](https://dle.rae.es/) |
| `es.classify.two-paradigms` | lexical | {checked, select, yes {The DLE lists {before}} other {This pack's lexicon lists {before} (not yet checked against the DLE)}} with two conjugations of different meaning; this one is conjugated like {model}. | [dle: the numbered homographs of the verb (unverified: not yet read)](https://dle.rae.es/); [dpd: «lemas con superíndice» (unverified: not yet read)](https://www.rae.es/dpd/ayuda/lemas-con-superindice) |
| `es.classify.prefixed` | lexical | {before} is {prefix} + {base}, so it has the same irregular forms as {base}. | [ngle: §4.16 (unverified: not yet read)](https://www.rae.es/gram%C3%A1tica/morfolog%C3%ADa/) |
| `es.classify.family` | rule | Verbs ending in {suffix} share their irregular forms, so {before} is conjugated like {model}. | [ngle: §4.11, §4.12 (unverified: not yet read)](https://www.rae.es/gram%C3%A1tica/morfolog%C3%ADa/); [dpd: «conducir» (unverified: not yet read)](https://www.rae.es/dpd/conducir) |
| `es.classify.eir` | rule | {before} ends in -eír, so it is conjugated like reír: its e becomes i where the stem is stressed (río) or the ending has no stressed i (rio). | [ngle: §4.10 (unverified: not yet read)](https://www.rae.es/gram%C3%A1tica/morfolog%C3%ADa/); [dpd: «reír» (unverified: not yet read)](https://www.rae.es/dpd/reír) |
| `es.classify.both-stress` | lexical | {checked, select, yes {The DLE lists {before}} other {This pack's lexicon lists {before} (not yet checked against the DLE)}}: it can be stressed like {diphthong} or like {hiatus}, and both are correct. | [ngle: §4.9 (unverified: not yet read)](https://www.rae.es/gram%C3%A1tica/morfolog%C3%ADa/); [dpd: «averiguar» (unverified: not yet read)](https://www.rae.es/dpd/averiguar); [aml-minucias: licuo y licúo](https://academia.org.mx/consultas/obras-de-consulta-en-linea/diccionario-minucias-del-lenguaje/item/licuo-y-licuo) |
| `es.classify.variants` | lexical | {before} has more than one accepted form in some tenses; each extra form is tagged with its variant. | [dle: the verb's conjugation table (unverified: not yet read)](https://dle.rae.es/) |
| `es.classify.regional-variant` | lexical | {region, select, America {In much of Latin America} other {In {region}}}, {before} is also conjugated without the change of the stem vowel. | [dpd: «errar» (unverified: not yet read)](https://www.rae.es/dpd/errar) |
| `es.classify.oir` | rule | {before} ends in -oír, so it is conjugated like oír (oigo, oyes). | [ngle: §4.11 (unverified: not yet read)](https://www.rae.es/gram%C3%A1tica/morfolog%C3%ADa/); [dpd: «oír» (unverified: not yet read)](https://www.rae.es/dpd/oír) |
| `es.classify.uar-stress` | rule | In -uar verbs like {before} the u is stressed on its own when the stem is stressed (actúo), but not after g or c (averiguo). | [ngle: §4.9 (unverified: not yet read)](https://www.rae.es/gram%C3%A1tica/morfolog%C3%ADa/); [dpd: «averiguar» (unverified: not yet read)](https://www.rae.es/dpd/averiguar); [aml-minucias: licuo y licúo](https://academia.org.mx/consultas/obras-de-consulta-en-linea/diccionario-minucias-del-lenguaje/item/licuo-y-licuo) |
| `es.classify.iar-single-vowel` | rule | The i of {before} has no other vowel before it in the stem to give the stress to, so it is stressed on its own where the stem is stressed: {form}. | [ngle: §4.9 (unverified: not yet read)](https://www.rae.es/gram%C3%A1tica/morfolog%C3%ADa/); [orto-novedades: item 4](https://www.edu.xunta.gal/centros/cpicovaterrena/system/files/Principales%20novedades%20de%20la%20Ortograf%C3%ADa%20de%20la%20RAE.pdf) |
| `es.classify.hint` | rule | The hint {hint} decides how {before} is conjugated. | [ngle: §4.10 (unverified: not yet read)](https://www.rae.es/gram%C3%A1tica/morfolog%C3%ADa/) |
| `es.classify.assume-regular` | assumption | {before} is not in the dictionary, so it is taken to be regular, with no vowel change in the stem. | [ngle: §4.6 (unverified: not yet read)](https://www.rae.es/gram%C3%A1tica/morfolog%C3%ADa/) |
| `es.classify.assume-glide` | assumption | The {vowel} before -ar in {before} is taken to share a syllable with the next vowel, as in cambiar (cambio), not as in enviar (envío). | [ngle: §4.9 (unverified: not yet read)](https://www.rae.es/gram%C3%A1tica/morfolog%C3%ADa/) |
| `es.classify.assume-diphthong` | assumption | The vowels {vowels} in {before} are taken to form one syllable, as in causar (causo), not as in aislar (aíslo). | [ngle: §4.9 (unverified: not yet read)](https://www.rae.es/gram%C3%A1tica/morfolog%C3%ADa/) |
| `es.classify.assume-zc` | assumption | {before} is taken to add a z before the c, as conocer does (conozco). | [ngle: §4.11 (unverified: not yet read)](https://www.rae.es/gram%C3%A1tica/morfolog%C3%ADa/) |

### stem

| Rule | Kind | What it says (English message) | Sources |
|---|---|---|---|
| `es.stem.root` | rule | {empty, select, yes {{before} has no stem: its forms are built on the ending alone} other {Drop {ending} from {before} to get the stem {after}-}}. | [ngle: §4.3 (unverified: not yet read)](https://www.rae.es/gram%C3%A1tica/morfolog%C3%ADa/) |
| `es.stem.diphthong` | rule | The stem is stressed here, so its {from} becomes {to}: {before}- becomes {after}-. | [ngle: §4.10 (unverified: not yet read)](https://www.rae.es/gram%C3%A1tica/morfolog%C3%ADa/) |
| `es.stem.e-i` | rule | The stem is stressed here, so its e becomes i: {before}- becomes {after}-. | [ngle: §4.10 (unverified: not yet read)](https://www.rae.es/gram%C3%A1tica/morfolog%C3%ADa/) |
| `es.stem.raising` | rule | In this -ir verb the {from} of the stem becomes {to} when the ending has no stressed i: {before}- becomes {after}-. | [ngle: §4.10 (unverified: not yet read)](https://www.rae.es/gram%C3%A1tica/morfolog%C3%ADa/) |
| `es.stem.present-1sg` | lexical | {before} has its own stem {stem}- in the yo form of the present. | [ngle: §4.11 (unverified: not yet read)](https://www.rae.es/gram%C3%A1tica/morfolog%C3%ADa/); [dle: the verb's conjugation table (unverified: not yet read)](https://dle.rae.es/) |
| `es.stem.subjunctive-from-1sg` | rule | The present subjunctive is built on the stem of the yo form of the present: {stem}-. | [ngle: §4.11 (unverified: not yet read)](https://www.rae.es/gram%C3%A1tica/morfolog%C3%ADa/) |
| `es.stem.zc` | rule | After a vowel, the c of {before}- becomes zc before a or o: {after}-. | [ngle: §4.11 (unverified: not yet read)](https://www.rae.es/gram%C3%A1tica/morfolog%C3%ADa/) |
| `es.stem.y-insertion` | rule | {before}- adds a y before an ending that does not start with i, as the verbs in -uir do: {after}-. | [ngle: §4.9 (unverified: not yet read)](https://www.rae.es/gram%C3%A1tica/morfolog%C3%ADa/) |
| `es.stem.strong-preterite` | lexical | {before} has the irregular preterite stem {stem}-. | [ngle: §4.12 (unverified: not yet read)](https://www.rae.es/gram%C3%A1tica/morfolog%C3%ADa/) |
| `es.stem.ducir-preterite` | rule | Verbs in -ducir form the preterite on -duj-: {before}- becomes {after}-. | [ngle: §4.12 (unverified: not yet read)](https://www.rae.es/gram%C3%A1tica/morfolog%C3%ADa/); [dpd: «conducir» (unverified: not yet read)](https://www.rae.es/dpd/conducir) |
| `es.stem.future-infinitive` | rule | The future and the conditional are built on the whole infinitive: {after}-. | [ngle: §4.5 (unverified: not yet read)](https://www.rae.es/gram%C3%A1tica/morfolog%C3%ADa/) |
| `es.stem.future-lexical` | lexical | {before} has the short future and conditional stem {stem}-. | [ngle: §4.15 (unverified: not yet read)](https://www.rae.es/gram%C3%A1tica/morfolog%C3%ADa/); [dle: the verb's conjugation table (unverified: not yet read)](https://dle.rae.es/) |
| `es.stem.preterite-3pl` | rule | This tense is built on the ellos form of the preterite without -ron: {before} gives {base}-. | [ngle: §4.5 (unverified: not yet read)](https://www.rae.es/gram%C3%A1tica/morfolog%C3%ADa/) |
| `es.stem.lexical` | lexical | The dictionary gives {before} the stem {stem}- here. | [dle: the verb's conjugation table (unverified: not yet read)](https://dle.rae.es/) |
| `es.stem.hue` | lexical | {before} keeps the h of its base word (hueso, huevo) where the stem is stressed: {after}-. | [dle: desosar, desovar (unverified: not yet read)](https://dle.rae.es/); [orto: the letters h and y (unverified: not yet read)](https://www.rae.es/ortograf%C3%ADa/reglas-de-acentuaci%C3%B3n) |
| `es.cell.lexical` | lexical | The lexicon lists this form of {before} as a whole word: {form}. | [ngle: §4.13 (unverified: not yet read)](https://www.rae.es/gram%C3%A1tica/morfolog%C3%ADa/); [dle: the verb's conjugation table (unverified: not yet read)](https://dle.rae.es/) |
| `es.cell.imperative-short` | lexical | The tú command of {before} is short: {form}. | [ngle: §4.15 (unverified: not yet read)](https://www.rae.es/gram%C3%A1tica/morfolog%C3%ADa/); [dle: the verb's conjugation table (unverified: not yet read)](https://dle.rae.es/) |
| `es.cell.participle` | lexical | {before} has an irregular participle: {form}. | [ngle: §4.12 (unverified: not yet read)](https://www.rae.es/gram%C3%A1tica/morfolog%C3%ADa/) |
| `es.cell.gerund` | lexical | {before} has an irregular gerund: {form}. | [ngle: §4.15 (unverified: not yet read)](https://www.rae.es/gram%C3%A1tica/morfolog%C3%ADa/); [dle: the verb's conjugation table (unverified: not yet read)](https://dle.rae.es/) |
| `es.cell.infinitive-variant` | lexical | {before} has a second infinitive with the same forms: {form}. | [dpd: «pudrir» (unverified: not yet read)](https://www.rae.es/dpd/pudrir) |

### ending

| Rule | Kind | What it says (English message) | Sources |
|---|---|---|---|
| `es.end.present` | rule | Present: add -{ending} to {before}-. | [ngle: §4.4–4.6 (unverified: not yet read)](https://www.rae.es/gram%C3%A1tica/morfolog%C3%ADa/) |
| `es.end.imperfect` | rule | Imperfect: add -{ending} to {before}- (-aba- for -ar verbs, -ía- for -er and -ir verbs). | [ngle: §4.4–4.6 (unverified: not yet read)](https://www.rae.es/gram%C3%A1tica/morfolog%C3%ADa/) |
| `es.end.preterite` | rule | Preterite: add -{ending} to {before}-. | [ngle: §4.4–4.6 (unverified: not yet read)](https://www.rae.es/gram%C3%A1tica/morfolog%C3%ADa/) |
| `es.end.preterite-strong` | rule | Irregular preterite: add -{ending} to {before}-; the yo and él forms end in an unstressed -e and -o. | [ngle: §4.12 (unverified: not yet read)](https://www.rae.es/gram%C3%A1tica/morfolog%C3%ADa/) |
| `es.end.future` | rule | Future: add -{ending} to {before}-. | [ngle: §4.4–4.6 (unverified: not yet read)](https://www.rae.es/gram%C3%A1tica/morfolog%C3%ADa/) |
| `es.end.conditional` | rule | Conditional: add -{ending} to {before}- (-ía- and the person ending). | [ngle: §4.4–4.6 (unverified: not yet read)](https://www.rae.es/gram%C3%A1tica/morfolog%C3%ADa/) |
| `es.end.subjunctive-present` | rule | Present subjunctive: -ar verbs take e and -er and -ir verbs take a, so add -{ending} to {before}-. | [ngle: §4.4–4.6 (unverified: not yet read)](https://www.rae.es/gram%C3%A1tica/morfolog%C3%ADa/) |
| `es.end.subjunctive-imperfect` | rule | Imperfect subjunctive: add -{ending} to {before}-; the -ra and the -se forms are both correct. | [ngle: §4.4–4.6, §24.2c (unverified: not yet read)](https://www.rae.es/gram%C3%A1tica/morfolog%C3%ADa/) |
| `es.end.subjunctive-future` | rule | Future subjunctive, now used only in legal texts and set phrases: add -{ending} to {before}-. | [ngle: §4.4–4.6 (unverified: not yet read)](https://www.rae.es/gram%C3%A1tica/morfolog%C3%ADa/); [gtg: «futuro simple de subjuntivo» (unverified: not yet read)](https://www.rae.es/gtg/futuro-simple-de-subjuntivo) |
| `es.end.imperative-tu` | rule | The tú command is the same as the él form of the present: {after}. | [ngle: §4.6, §4.15 (unverified: not yet read)](https://www.rae.es/gram%C3%A1tica/morfolog%C3%ADa/) |
| `es.end.imperative-vosotros` | rule | The vosotros command is the stem, the vowel of the infinitive (a, e or i) and -d: {after}. | [ngle: §4.6, §4.15 (unverified: not yet read)](https://www.rae.es/gram%C3%A1tica/morfolog%C3%ADa/) |
| `es.end.imperative-subjunctive` | rule | The usted, nosotros and ustedes commands use the present subjunctive: {after}. | [ngle: §4.6, §4.15 (unverified: not yet read)](https://www.rae.es/gram%C3%A1tica/morfolog%C3%ADa/) |
| `es.end.infinitive` | rule | The infinitive is the dictionary form: {after}. | [ngle: §4.6 (unverified: not yet read)](https://www.rae.es/gram%C3%A1tica/morfolog%C3%ADa/) |
| `es.end.gerund` | rule | Gerund: add -{ending} to {before}- (-ando for -ar verbs, -iendo for -er and -ir verbs). | [ngle: §4.6 (unverified: not yet read)](https://www.rae.es/gram%C3%A1tica/morfolog%C3%ADa/) |
| `es.end.participle` | rule | Participle: add -{ending} to {before}- (-ado for -ar verbs, -ido for -er and -ir verbs). | [ngle: §4.6 (unverified: not yet read)](https://www.rae.es/gram%C3%A1tica/morfolog%C3%ADa/) |

### orthography

| Rule | Kind | What it says (English message) | Sources |
|---|---|---|---|
| `es.orth.c-qu` | rule | Before {vowel}, c is written qu to keep the k sound: {before} becomes {after}. | [orto: the letters c, z, g and j (unverified: not yet read)](https://www.rae.es/ortograf%C3%ADa/reglas-de-acentuaci%C3%B3n); [gtg: «verbo regular» (unverified: not yet read)](https://www.rae.es/gtg/verbo-regular) |
| `es.orth.g-gu` | rule | Before {vowel}, g is written gu to keep the hard g sound: {before} becomes {after}. | [orto: the letters c, z, g and j (unverified: not yet read)](https://www.rae.es/ortograf%C3%ADa/reglas-de-acentuaci%C3%B3n); [gtg: «verbo regular» (unverified: not yet read)](https://www.rae.es/gtg/verbo-regular) |
| `es.orth.gu-diaeresis` | rule | Before {vowel}, gu is written gü so that the u is still pronounced: {before} becomes {after}. | [orto: the diaeresis (unverified: not yet read)](https://www.rae.es/ortograf%C3%ADa/reglas-de-acentuaci%C3%B3n); [dpd: «averiguar» (unverified: not yet read)](https://www.rae.es/dpd/averiguar) |
| `es.orth.z-c` | rule | Before {vowel}, z is written c: {before} becomes {after}. | [orto: the letters c, z, g and j (unverified: not yet read)](https://www.rae.es/ortograf%C3%ADa/reglas-de-acentuaci%C3%B3n); [gtg: «verbo regular» (unverified: not yet read)](https://www.rae.es/gtg/verbo-regular) |
| `es.orth.c-z` | rule | Before {vowel}, this c is written z to keep its sound: {before} becomes {after}. | [orto: the letters c, z, g and j (unverified: not yet read)](https://www.rae.es/ortograf%C3%ADa/reglas-de-acentuaci%C3%B3n); [gtg: «verbo regular» (unverified: not yet read)](https://www.rae.es/gtg/verbo-regular) |
| `es.orth.g-j` | rule | Before {vowel}, this g is written j to keep its sound: {before} becomes {after}. | [orto: the letters c, z, g and j (unverified: not yet read)](https://www.rae.es/ortograf%C3%ADa/reglas-de-acentuaci%C3%B3n); [gtg: «verbo regular» (unverified: not yet read)](https://www.rae.es/gtg/verbo-regular) |
| `es.orth.gu-g` | rule | Before {vowel}, gu is written g: {before} becomes {after}. | [orto: the letters c, z, g and j (unverified: not yet read)](https://www.rae.es/ortograf%C3%ADa/reglas-de-acentuaci%C3%B3n); [gtg: «verbo regular» (unverified: not yet read)](https://www.rae.es/gtg/verbo-regular) |
| `es.orth.qu-c` | rule | Before {vowel}, qu is written c: {before} becomes {after}. | [orto: the letters c, z, g and j (unverified: not yet read)](https://www.rae.es/ortograf%C3%ADa/reglas-de-acentuaci%C3%B3n); [gtg: «verbo regular» (unverified: not yet read)](https://www.rae.es/gtg/verbo-regular) |
| `es.orth.u-diaeresis-y` | rule | Before y the u needs no diaeresis: {before} becomes {after}. | [orto: the diaeresis (unverified: not yet read)](https://www.rae.es/ortograf%C3%ADa/reglas-de-acentuaci%C3%B3n); [ngle: §4.9 (unverified: not yet read)](https://www.rae.es/gram%C3%A1tica/morfolog%C3%ADa/) |
| `es.orth.i-y` | rule | An unstressed i between vowels is written y: {before} becomes {after}. | [ngle: §4.9 (unverified: not yet read)](https://www.rae.es/gram%C3%A1tica/morfolog%C3%ADa/); [dpd: «leer» (unverified: not yet read)](https://www.rae.es/dpd/leer) |
| `es.orth.i-absorbed` | rule | After {letter} the unstressed i of the ending disappears: {before} becomes {after}. | [ngle: §4.9 (unverified: not yet read)](https://www.rae.es/gram%C3%A1tica/morfolog%C3%ADa/) |
| `es.orth.initial-diphthong` | rule | A word cannot begin with ue or ie: ue at the start is written hue, and ie is written ye, so {before} becomes {after}. | [orto: the letters h and y (unverified: not yet read)](https://www.rae.es/ortograf%C3%ADa/reglas-de-acentuaci%C3%B3n); [ngle: §4.10 (unverified: not yet read)](https://www.rae.es/gram%C3%A1tica/morfolog%C3%ADa/) |
| `es.orth.g-diphthong` | rule | After g the diphthong ue is written üe so that the u is pronounced: {before} becomes {after}. | [orto: the diaeresis (unverified: not yet read)](https://www.rae.es/ortograf%C3%ADa/reglas-de-acentuaci%C3%B3n) |
| `es.orth.accent-hiatus` (secondary only) | rule | The stressed i or u stands next to a, e or o in a syllable of its own, so it takes an accent: {before} becomes {after}. | [orto: §3.4.2 (unverified: not yet read)](https://www.rae.es/ortograf%C3%ADa/palabras-con-hiato); [dpd-tilde: §2.2.2](https://induccion.urosario.edu.co/sites/default/files/2023-02/material-de-apoyo-la-tilde-segun-la-rae.pdf) |
| `es.orth.both-stress` | rule | This verb has two accepted stresses; {reading, select, hiatus {in this form the i or u is stressed on its own} other {in this form the i or u shares a syllable with the next vowel}}: {after}. | [ngle: §4.9 (unverified: not yet read)](https://www.rae.es/gram%C3%A1tica/morfolog%C3%ADa/); [aml-minucias: licuo y licúo](https://academia.org.mx/consultas/obras-de-consulta-en-linea/diccionario-minucias-del-lenguaje/item/licuo-y-licuo) |
| `es.orth.accent-general` (secondary only) | rule | {stress, select, final {The stress falls on the last syllable and the word ends in a vowel, n or s} penultimate {The stress falls on the second-to-last syllable and the word does not end in a vowel, n or s} other {The stress falls on the third syllable from the end}}, so it takes an accent: {before} becomes {after}. | [orto: §3.4.1 (unverified: not yet read)](https://www.rae.es/ortograf%C3%ADa/reglas-de-acentuaci%C3%B3n); [dpd-tilde: §1.1](https://induccion.urosario.edu.co/sites/default/files/2023-02/material-de-apoyo-la-tilde-segun-la-rae.pdf) |
| `es.orth.monosyllable` (secondary only) | rule | {before} has one syllable, so it takes no accent. | [orto: §3.4.3 (unverified: not yet read)](https://www.rae.es/ortograf%C3%ADa/reglas-de-acentuaci%C3%B3n); [orto-novedades: item 4](https://www.edu.xunta.gal/centros/cpicovaterrena/system/files/Principales%20novedades%20de%20la%20Ortograf%C3%ADa%20de%20la%20RAE.pdf) |
| `es.orth.diacritic` (secondary only) | rule | {after} keeps an accent to tell it apart from the word {word}. | [orto: §3.4.3 (unverified: not yet read)](https://www.rae.es/ortograf%C3%ADa/reglas-de-acentuaci%C3%B3n); [dpd-tilde: §3.1](https://induccion.urosario.edu.co/sites/default/files/2023-02/material-de-apoyo-la-tilde-segun-la-rae.pdf) |

### periphrasis

| Rule | Kind | What it says (English message) | Sources |
|---|---|---|---|
| `es.periphrasis.perfect` | rule | Present perfect: the present of {auxiliary} plus the participle. | [ngle: §4.15 (model tables) (unverified: not yet read)](https://www.rae.es/gram%C3%A1tica/morfolog%C3%ADa/) |
| `es.periphrasis.pluperfect` | rule | Pluperfect: the imperfect of {auxiliary} plus the participle. | [ngle: §4.15 (model tables) (unverified: not yet read)](https://www.rae.es/gram%C3%A1tica/morfolog%C3%ADa/) |
| `es.periphrasis.past-anterior` | rule | Past anterior: the preterite of {auxiliary} plus the participle. | [ngle: §4.15 (model tables) (unverified: not yet read)](https://www.rae.es/gram%C3%A1tica/morfolog%C3%ADa/) |
| `es.periphrasis.future-perfect` | rule | Future perfect: the future of {auxiliary} plus the participle. | [ngle: §4.15 (model tables) (unverified: not yet read)](https://www.rae.es/gram%C3%A1tica/morfolog%C3%ADa/) |
| `es.periphrasis.conditional-perfect` | rule | Conditional perfect: the conditional of {auxiliary} plus the participle. | [ngle: §4.15 (model tables) (unverified: not yet read)](https://www.rae.es/gram%C3%A1tica/morfolog%C3%ADa/) |
| `es.periphrasis.subjunctive-perfect` | rule | Perfect subjunctive: the present subjunctive of {auxiliary} plus the participle. | [ngle: §4.15 (model tables) (unverified: not yet read)](https://www.rae.es/gram%C3%A1tica/morfolog%C3%ADa/) |
| `es.periphrasis.subjunctive-pluperfect` | rule | Pluperfect subjunctive: the imperfect subjunctive of {auxiliary}, in -ra or -se, plus the participle. | [ngle: §4.15 (model tables) (unverified: not yet read)](https://www.rae.es/gram%C3%A1tica/morfolog%C3%ADa/) |
| `es.periphrasis.subjunctive-future-perfect` | rule | Future perfect subjunctive, now rare: the future subjunctive of {auxiliary} plus the participle. | [ngle: §4.15 (model tables) (unverified: not yet read)](https://www.rae.es/gram%C3%A1tica/morfolog%C3%ADa/); [gtg: «futuro compuesto de subjuntivo» (unverified: not yet read)](https://www.rae.es/gtg/futuro-compuesto-de-subjuntivo) |
| `es.periphrasis.infinitive-perfect` | rule | Perfect infinitive: the infinitive {auxiliary} plus the participle. | [ngle: §4.15 (model tables) (unverified: not yet read)](https://www.rae.es/gram%C3%A1tica/morfolog%C3%ADa/) |
| `es.periphrasis.gerund-perfect` | rule | Perfect gerund: the gerund of {auxiliary} plus the participle. | [ngle: §4.15 (model tables) (unverified: not yet read)](https://www.rae.es/gram%C3%A1tica/morfolog%C3%ADa/) |
| `es.periphrasis.negative-imperative` | rule | A negative command is no plus the present subjunctive. | [gtg: «imperativo» (unverified: not yet read)](https://www.rae.es/gtg/imperativo) |

### clause

| Rule | Kind | What it says (English message) | Sources |
|---|---|---|---|
| `es.clause.subject` | rule | The subject pronoun {pronoun} comes first; Spanish often leaves it out. | [ngle: §4.4 (unverified: not yet read)](https://www.rae.es/gram%C3%A1tica/morfolog%C3%ADa/) |
| `es.clause.que` | rule | Subjunctive forms are listed after que. | [ngle: §4.5 (unverified: not yet read)](https://www.rae.es/gram%C3%A1tica/morfolog%C3%ADa/) |
| `es.clause.proclitic` | rule | The reflexive pronoun {pronoun} goes before the conjugated verb. | [dpd: «pronombres personales átonos» (unverified: not yet read)](https://www.rae.es/dpd/pronombres%20personales%20%C3%A1tonos) |
| `es.clause.enclitic` | rule | After an affirmative command, an infinitive or a gerund the pronoun {pronoun} is attached to the end: {before} becomes {after}. | [dpd: «pronombres personales átonos» (unverified: not yet read)](https://www.rae.es/dpd/pronombres%20personales%20%C3%A1tonos) |
| `es.clause.enclitic-d-drop` | rule | The vosotros command loses its -d before os: {before} becomes {after}. | [dpd: «pronombres personales átonos» (unverified: not yet read)](https://www.rae.es/dpd/pronombres%20personales%20%C3%A1tonos); [rae-iros: paragraphs 1–2](https://www.rae.es/gram%C3%A1tica/docs/%C2%ABiros%C2%BB%20imperativo.pdf) |
| `es.clause.enclitic-s-drop` | rule | The nosotros command loses its -s before nos: {before} becomes {after}. | [dpd: «pronombres personales átonos» (unverified: not yet read)](https://www.rae.es/dpd/pronombres%20personales%20%C3%A1tonos) |
| `es.clause.enclitic-accent` (secondary only) | rule | The stress stays on the same vowel, which is now on {stress, select, final {the last syllable} penultimate {the second-to-last syllable} other {the third syllable from the end}}, so the longer word follows the accent rules: {before} becomes {after}. | [orto: §3.4.5 (unverified: not yet read)](https://www.rae.es/ortograf%C3%ADa/formas-verbales-con-pronombres-cl%C3%ADticos); [dpd-tilde: §4.3](https://induccion.urosario.edu.co/sites/default/files/2023-02/material-de-apoyo-la-tilde-segun-la-rae.pdf) |
| `es.clause.iros` | rule | The RAE also accepts iros, the infinitive ir with os attached, as the vosotros command of irse: {before} becomes {after}. | [rae-iros: paragraphs 1–2](https://www.rae.es/gram%C3%A1tica/docs/%C2%ABiros%C2%BB%20imperativo.pdf); [ngle: §4.13i (unverified: not yet read)](https://www.rae.es/gram%C3%A1tica/morfolog%C3%ADa/) |

### availability

| Rule | Kind | What it says (English message) | Sources |
|---|---|---|---|
| `es.avail.impersonal` | unavailable | This verb describes the weather and has no subject: only the third person singular, without a pronoun (llueve). | [ngle: §4.14 (unverified: not yet read)](https://www.rae.es/gram%C3%A1tica/morfolog%C3%ADa/); [dpd: «llover» (unverified: not yet read)](https://www.rae.es/dpd/llover) |
| `es.avail.defective` | unavailable | {kind, select, soler {{verb} has no future tenses (not even the future subjunctive), no conditional and no imperative} third {{verb} is used only in the third person: its subject is a thing or an event} iendings {{verb} is used only in the forms whose ending begins with i (embaímos, embaía)} other {{verb} has no forms with -zc-; balbucear is used instead}}. | [ngle: §4.14 (unverified: not yet read)](https://www.rae.es/gram%C3%A1tica/morfolog%C3%ADa/); [dpd: «soler» (unverified: not yet read)](https://www.rae.es/dpd/soler); [dpd: «concernir» (unverified: not yet read)](https://www.rae.es/dpd/concernir); [dpd: «balbucir» (unverified: not yet read)](https://www.rae.es/dpd/balbucir) |
| `es.avail.no-imperative` | unavailable | haber as an auxiliary has no imperative. | [dpd: «haber» (unverified: not yet read)](https://www.rae.es/dpd/haber) |

## Limits

- **No RAE page was read** except the iros note. The rule statements and lexicon lists rest on the grammar design's snippets and on secondary pages.
- **The stem-vowel lists are not exhaustive.** An unlisted real verb with a stem change (for example a rare derivative) comes out regular, with the assumption recorded. No systematic sweep of the NGLE §4.16 index was possible.
- **Two steps are recorded on unchanged words** (guio: `es.orth.monosyllable`; agrio: `es.orth.both-stress`), under the named exception to rule 14 of the pack-authoring guide.
