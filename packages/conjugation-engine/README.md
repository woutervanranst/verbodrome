# conjugation-engine

A rule-based TypeScript conjugation engine for French, Dutch, German, English, Spanish, Italian and Latin. Every form
is derived by recorded rules from a lexicon, endings and spelling rules, and explains itself step by step in English
and Dutch, with the grammar or dictionary each rule comes from. Invented verbs work too: what the engine had to assume
about them is reported. It has no runtime dependencies, runs in the browser (ESM) and in Node, and comes with a CLI.

| Language | Code | Rules | Lexicon entries | Corpus files | Corpus cells | Corrections |
|---|---|---:|---:|---:|---:|---:|
| French | `fr` | 97 | 95 | 222 | 26,196 | 460 |
| Dutch | `nl` | 62 | 228 | 207 | 10,764 | 406 |
| English | `en` | 68 | 198 | 145 | 18,270 | 480 |
| German | `de` | 80 | 184 | 139 | 12,788 | 416 |
| Spanish | `es` | 94 | 72 | 89 | 11,036 | 116 |
| Italian | `it` | 82 | 177 | 20 | 1,920 | 67 |
| Latin | `la` | 100 | 500 | 18 | 3,330 | 254 |
| **Total** |  | 583 | 1,454 | 840 | 84,304 | 2,199 |

Rules: the rules a pack records (each with a message in both locales and a citation). Lexicon entries: the pack's main
lexicon (French verb families, Dutch listed verbs, English irregular verbs, German roots, Spanish irregular bases,
Italian entries, Latin principal-part entries); side lists are not counted. Corpus files and cells: the reference
tables the engine is checked against; corrections: the cells of those tables corrected with a cited authority.
`tests/docs.test.ts` computes every number of this table from the packs and `tests/fixtures/manifest.json`, and
`npm run corpus:check` prints the full accounting.

## Install and use

From a checkout, with Node **26 or newer**:

```sh
npm ci
npm run build
node dist/cli.js nl opzorpen --mood indicative --tense perfect --person 1 --number singular   # ik heb opgezorpt
```

```ts
import { conjugate, explain, equivalentTenses, normalizeForComparison } from 'conjugation-engine';

const [form] = conjugate({ language: 'fr', infinitive: 'aller', mood: 'indicative', tense: 'perfect', person: 1, number: 'singular', gender: 'feminine' }).forms;
form.text;                                    // je suis allée
explain('fr', form, 'nl').sections;           // ... "Met être past het voltooid deelwoord zich aan het onderwerp aan, in geslacht en getal."
const invented = conjugate({ language: 'de', infinitive: 'schlinken', mood: 'indicative', tense: 'past', person: 1, number: 'singular' });
invented.forms[0].text;                       // ich schlinkte
invented.analysis.assumptions;                // ['Assuming a weak verb, because the verb is not in the lexicon; ...', ...]
equivalentTenses('fr', 'nl', { mood: 'indicative', tense: 'simple_past' }).matches[0].tense; // { mood: 'indicative', tense: 'past' }
normalizeForComparison('la', 'amāvī') === normalizeForComparison('la', 'amavi');            // true
```

Omitted filters are wildcards: `conjugate({ language: 'nl', infinitive: 'werken' })` gives every form of every tense.
Each form has its resolved target, its parts (subject, auxiliary, verb, particle ...), its variant labels and whether
it is the preferred one; results are frozen and JSON-serialisable. The package root also exports `createEngine`,
`packs` and `locales`, and the subpaths `conjugation-engine/languages/<code>`, `conjugation-engine/locales/<locale>`,
`conjugation-engine/equivalence` and `conjugation-engine/core` let an application load only what it uses.

- [docs/architecture.md](docs/architecture.md): how a form is built, stage by stage, and how the engine is checked.
- [docs/api.md](docs/api.md): the API, the options of each language, the catalogues and the CLI.
- [docs/grammar.md](docs/grammar.md): one grammar page per language (rules, sources, defaults, limits) and the corpus.
- [docs/pack-authoring.md](docs/pack-authoring.md): how to add a language.

## Development

```sh
npm run typecheck
npm test                 # builds first; includes the compiled CLI and package checks
npm run corpus:check     # the corpus comparison and its accounting per language
```

The tests use checked-in fixtures and make no network requests. Fixtures, goldens and tooling are development-only and
are not in the npm package.

## Known limits

The grammar page of each language lists its limits in full. In short:

- **French**
  - A verb with two auxiliaries carries an English sentence in `variant.condition`, also on the near future and recent past.
  - The past imperative of a pronominal verb is reported unavailable with the reason `noImperative`.
  - méfaire is reported unavailable throughout, although the Académie prints a conjugation for it.
  - apparaître gives "j'ai apparu" before "je suis apparu", where the Académie prefers être.
- **Dutch**
  - An unlisted verb in -eren stressed on the last syllable is read as unstressed (ik arrester); pass `stems: { unstressedFinalSyllable: false }`.
  - An unlisted separable verb with over- or onder- is kept whole (ik overkook); pass `separablePrefix`.
  - beteren ("get better") takes only zijn; the reflexive zich beteren (with hebben) is not modelled.
  - beamen is offered in one reading, not its second lemma; how gelen is read is not settled.
  - The explanation of an unlisted particle verb (teruggeven, opeten) does not say that its auxiliary comes from the base verb.
- **English**
  - Unlisted compound verbs are conjugated as regular verbs (backstop: backstoped; also humbug, shrink-wrap, test-drive, sight-read, crosscut, telecast, catnap).
  - rappel is not labelled as American.
  - writ appears as an unlabelled second past participle of write.
  - The lexicon is checked against the Longman Dictionary of Contemporary English and the American Heritage Dictionary only.
- **German**
  - An unlisted noun or adjective + verb compound is conjugated as a weak simple verb, with an assumption (plumfahren: geplumfahrt).
  - einhängen and umhängen have weak forms only.
  - A reflexive-only verb is conjugated without its pronoun.
  - The explanation of du last (lesen) is correct but awkward.
  - Part of the lexicon is checked against DWDS only, without a Duden table.
- **Spanish**
  - No lexicon entry has been checked against the RAE's dictionary (DLE); a few were checked against secondary sources only.
  - Rare stem-changing verbs outside the checked lists come out regular, with an assumption.
  - Existential hay and voseo are not modelled.
  - The variants of cimentar and emparentar rest on Wiktionary only.
- **Italian**
  - empire's passato remoto in -ei (empiei) is not generated.
  - rifulgere, genuflettere, collidere, discernere and splendere are conjugated as regular verbs, with an assumption.
  - Rare irregular verbs not in the lexicon come out regular, with an assumption.
  - sedere with essere rests on a secondary source.
  - Not every lexicon entry is pinned against its dictionary entry.
  - A few explanations contain a redundant sentence.
  - Subject gender is carried by the subject slots (lui, lei), while French forks it form by form: a consumer cannot treat the two alike.
  - There are no authority cells from Serianni's grammar.
- **Latin**
  - Archaic forms are not generated.
  - tonāre gives its third person singular twice (one per reading).
  - The perfect forms triī and triit are not checked against an attestation.
  - The imperative of nescīre is not checked against a source.
  - The authority cells cover part of the grammar sections, each transcribed once without a second check.
  - The Dutch explanations use the core Dutch grammar terms for Latin categories, which differ from Latin school usage.
- **Tense equivalence**
  - A few lookups return no match where a trainer has to compose the prompt itself; the result's notes say why.
  - The Spanish, Italian and Latin imperfect subjunctive into French ranks the indicative imparfait first (right after si; after que French uses the subjonctif présent, which only a note says).
  - The French imparfait into English lists the past perfect progressive third.
  - The English past into German gives Präteritum and Perfekt the same score; catalogue order puts Präteritum first.
  - The Dutch wording of the equivalence notes is provisional.

## Sources and licences

The rules cite the grammars and dictionaries they come from; each pack's `sources.ts` and its grammar page list them:

- French: the Dictionnaire de l'Académie française (9th edition), the 1990 *Rectifications de l'orthographe*, the OQLF's
  Banque de dépannage linguistique and the TLFi (CNRTL).
- Dutch: the e-ANS (Instituut voor de Nederlandse Taal), the Leidraad and the Woordenlijst Nederlandse Taal
  (Nederlandse Taalunie).
- German: grammis (Leibniz-Institut für Deutsche Sprache), the Amtliches Regelwerk (Rat für deutsche Rechtschreibung),
  DWDS and Duden.
- English: Huddleston and Pullum, Quirk et al., the Longman Dictionary of Contemporary English and the American Heritage
  Dictionary.
- Spanish: the RAE and ASALE (*Nueva gramática*, *Ortografía*, *Diccionario de la lengua española*, *Diccionario
  panhispánico de dudas*).
- Italian: Treccani (*Enciclopedia dell'Italiano*, *La grammatica italiana*, *Vocabolario*), Serianni and the DOP.
- Latin: Allen and Greenough (Dickinson College Commentaries edition, CC BY-SA, and the 1903 scans), Bennett (Project
  Gutenberg, public domain) and Lewis and Short.

Third-party material in the repository:

- **Woordenlijst Nederlandse Taal.** Its content is © Nederlandse Taalunie, all rights reserved; the terms of use of
  the Instituut voor de Nederlandse Taal allow use for non-commercial or private purposes and do not allow reproducing
  it or making it available to others without written permission. The Dutch pack cites it for facts about single verbs
  checked by hand. Three lexicon tables in `src/languages/nl/lexicon.ts` (`simplexVerbs`, `dualInseparableVerbs` and
  the counts of `dualPrefixCounts`) were compiled from its lexicon service by script, and they ship in the package. The
  repository holds no permission for that; whether the tables may stay is an open question. Attribution: "Woordenlijst
  Nederlandse Taal, © Nederlandse Taalunie (woordenlijst.org)".
- **Wiktionary.** The Italian and Latin second-oracle fixtures (`tests/fixtures/wiktionary-it.json`,
  `tests/fixtures/wiktionary-la.json`) are adapted from English Wiktionary conjugation tables, CC BY-SA 4.0
  (https://creativecommons.org/licenses/by-sa/4.0/). Attribution: English Wiktionary contributors; adapted (parsed
  into cells). Each fixture records the licence, the attribution and the title and revision of every page. They are
  test data and are not in the npm package.
- **The reference corpus.** The corpus fixtures hold normalised grammatical facts read from a pinned revision of a
  third-party collection of conjugation tables, with the corrections and their sources. No original pages are
  included, and the fixtures are not in the npm package. The rights in the original tables stay with their owners; this
  project grants no licence to them.
