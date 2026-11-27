# Grammar, defaults, and corpus provenance

Every language runs on the staged core ([architecture.md](architecture.md)): forms are derived by recorded rules from a
lexicon, endings and spelling rules, compound tenses are recipes over auxiliaries, and every rule cites its source.
Each language has a grammar page with its rule inventory and sources, its defaults and assumptions for verbs it does
not know, its lexicon and how it was checked, its corpus corrections and its limits:

- French: [grammar/fr.md](grammar/fr.md)
- Dutch: [grammar/nl.md](grammar/nl.md)
- English: [grammar/en.md](grammar/en.md)
- German: [grammar/de.md](grammar/de.md)
- Spanish: [grammar/es.md](grammar/es.md)
- Italian: [grammar/it.md](grammar/it.md)
- Latin: [grammar/la.md](grammar/la.md)

To add coverage, prefer a productive rule or a verified lexicon entry over a per-verb table; to add a language, follow
[pack-authoring.md](pack-authoring.md).

## Shared scope

The engine generates conjugated phrases, including the non-finite and compound constructions each catalogue lists;
Latin also has the passive voice, and Spanish and Italian the negative imperative. Other negation, questions, arbitrary
complements, attributive participles, general sentence generation, dialect inventories, distractor generation, exercise
persistence and UI are outside this package.

Omitted filters mean all supported grammatical targets and accepted variants under the declared context, not all
possible meanings of an infinitive. The analysis of a result exposes the classification and every assumption; hints
supply the lexical or pronunciation facts that spelling cannot show.

## Corpus provenance and refresh

The corpus is a pinned revision (**`3a9a01de3982049f9267326b4a4bd94f468d9439`**) of a third-party collection of
conjugation tables, one directory per language. Only normalised grammatical facts, their grammatical context, fixture
checksums and the corrections with their sources are kept, in development fixtures (`tests/fixtures/`); the original
pages, their prose and layout are not redistributed, and the fixtures hold no source file names, encodings or site
names. The rights in the original tables stay with their owners; this project grants no licence to them.

Accounting per language (`npm run corpus:check` prints it; `tests/docs.test.ts` checks this table against
`tests/fixtures/manifest.json`):

| Language | Files | Cells | Contextual targets | Available cells | Unavailable cells | Unmodelled cells | Form expectations | Ledger records | Structural placeholders |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| `fr` | 222 | 26,196 | 24,777 | 23,759 | 2,437 | 0 | 23,791 | 460 | 0 |
| `nl` | 207 | 10,764 | 10,764 | 10,646 | 118 | 0 | 10,994 | 406 | 1,030 |
| `en` | 145 | 18,270 | 18,270 | 18,270 | 0 | 0 | 19,005 | 480 | 435 |
| `de` | 139 | 12,788 | 12,788 | 12,704 | 84 | 0 | 14,031 | 416 | 0 |
| `es` | 89 | 11,036 | 9,879 | 10,791 | 245 | 0 | 10,791 | 116 | 356 |
| `it` | 20 | 1,920 | 1,900 | 1,888 | 12 | 20 | 1,917 | 67 | 20 |
| `la` | 18 | 3,330 | 3,330 | 2,226 | 1,086 | 18 | 2,234 | 254 | 819 |

Targets are distinct corrected grammatical identities within each source file's context, not the public catalogue
count. Form expectations count the accepted alternatives of available cells. Structural placeholders are template
slots a page prints for a form that does not exist (Dutch: five invalid slots in each six-slot imperative template;
zullen has none). Every cell is accounted for: available, unavailable or unmodelled, with no skips or thresholds. The
corpus tables are not exhaustive inventories of modern variants, so goldens and invented-verb tests check complete
accepted sets separately; Italian and Latin also have authority cells and a Wiktionary second oracle
([architecture.md](architecture.md#the-corpus-tooling)).

`tests/fixtures/manifest.json` inventories every file with its neutral identity and grammatical context, the pinned
revision, a checksum of each fixture file and the accounting per language. `corrections.json` records, per corrected
cell, the file, the zero-based cell index, the original target and text, the corrected interpretation, the reason and
an authoritative URL; the corrections are reproduced independently of the engine. `remaps.json` records the remaps (a
page that prints the wrong heading over a whole table: the heading, its occurrence, the corrected mood and tense and,
where the page also gets them wrong, person, number, subject slot and voice, with reason and URL). A remap's
`occurrence` is the zero-based index of a run of consecutive cells under its heading, or `all`; every run of a
remapped heading must be remapped or listed by the language as intentionally left alone, otherwise the corpus test
fails. The fixture stores the corrected target and the cell keeps its `heading` as the audit trail. Cells the engine
does not model carry `scope: 'unmodelled'` and a reason the language declares; they are their own partition of the
accounting (`available + unavailable + unmodelled = cells`) and are not compared.

### Reproduce fixtures

With a clean checkout of the reference corpus at the pinned revision (the importer reads the language directories
under `corpusBasePath`, `scripts/corpus/model.ts`):

```sh
npm run corpus:import -- --source <checkout>
npm run corpus:check
```

The importer requires the exact revision and rejects local modifications of the source corpus. `--output <directory>`
selects another fixture destination, and `--only <language>` re-imports one language while keeping the others as the
previous import left them (it refuses to run when the existing manifest is from another revision). Each language lives
in `scripts/corpus/languages/<language>.ts` (page parser, sourced corrections, remaps, unmodelled reasons, and the
labelled engine queries the corpus test uses); `scripts/corpus/languages/index.ts` lists them. Re-importing the pinned
checkout must leave `tests/fixtures` byte-identical. Changing the pin is an intentional reviewed change. The Wiktionary
fixtures of Italian and Latin are fetched by `scripts/corpus/sources/wiktionary-it.ts` and `wiktionary-la.ts` at pinned
page revisions.

### How a cell is compared

Each labelled query of a file is run once and its forms are narrowed to the cell's corrected target, voice and subject (and agreement, compared by gender, number and case). The language's `applicable(file, cell, forms, label)` then keeps, per query, the forms that answer the cell, and the kept forms of all queries are taken together; a query whose `applicable` returns nothing for a cell contributes nothing, so a form from a query that rejects the cell never satisfies it. An available cell needs every expected form among those forms, an unavailable cell needs none. A language that sets `requireTaggedExtras` also fails any generated form beyond the expected ones that has no variant tag (a pattern, a region, a usage other than standard, or an orthography other than `both`), unless its `acceptsUntagged` excuses it (German: a form labelled with a condition, and 30 reviewed forms its tests pin); only forms in the same resolved target (gender, agreement, voice and subject included) as a form that is expected are looked at, so the other gender of a compound form is not an extra; French and Dutch do not opt in because their fixtures predate the guard.

Ordinary tests and CI use the checked-in fixtures and never fetch grammar or corpus pages.
