# Grammar, defaults, and corpus provenance

## Rule-first architecture

`src/conjugate.ts` validates a query, resolves the language model, expands valid catalogue slots, applies grammatical availability, composes components, renders them, and deduplicates/orders equivalent records. French and Dutch adapters share contracts and orchestration, not a speculative universal grammar.

French and Dutch morphology are rule-driven with principal parts (see their grammar pages). Lexical auxiliary/reflexive/availability metadata is kept separately from morphology, and compound constructions are always composed, never stored. Test fixtures, HTML parsers, filesystem/network access, and the CLI are not imported by the library.

To add French or Dutch coverage, prefer a productive rule or a verified principal-part entry (a French family in `families.ts`, checked against the Académie's table). Do not add per-verb answer tables for verbs a model can cover. Adding another language requires its typed options, catalogue, adapter, validation/dispatch, sources, and tests.

## French

French runs on the staged core. Its rule inventory with sources, its defaults and assumptions, the family lexicon, the
intended differences of the switch, the open questions for the user and its limits are in [grammar/fr.md](grammar/fr.md).

## Dutch

Dutch runs on the staged core. Its rule inventory with sources, its defaults and assumptions, the two behaviour changes
of the switch and its limits are in [grammar/nl.md](grammar/nl.md).

## English

English runs on the staged core. Its rule inventory with sources, its labelling policy, side lists, defaults and
assumptions, the dictionary checks of its lexicon, its corpus corrections and its limits are in [grammar/en.md](grammar/en.md).

## Shared scope

The engine generates active conjugated phrases, including supported non-finite and compound constructions. Passive voice, negation, arbitrary complements, attributive/adjectival participles, general sentence generation, dialect inventories, distractor generation, exercise persistence, and UI are outside this package's current scope.

Omitted filters mean all supported grammatical targets and accepted variants under the declared context, not all possible meanings of an infinitive. Runtime analysis exposes classification and assumptions; hints must supply lexical/pronunciation information that grammar cannot recover from spelling alone.

## Corpus provenance and refresh

Reference repository: [woutervanranst/VerbodromeX](https://github.com/woutervanranst/VerbodromeX), pinned commit **`3a9a01de3982049f9267326b4a4bd94f468d9439`**.

- [French source facts](https://github.com/woutervanranst/VerbodromeX/tree/3a9a01de3982049f9267326b4a4bd94f468d9439/code/VerbodromeX.Database.Parsers/SourceFiles/Fran%C3%A7ais): Le Conjugueur / Le Figaro, decoded as Windows-1252.
- [Dutch source facts](https://github.com/woutervanranst/VerbodromeX/tree/3a9a01de3982049f9267326b4a4bd94f468d9439/code/VerbodromeX.Database.Parsers/SourceFiles/Nederlands): Verbix, decoded as UTF-8.
- [English source facts](https://github.com/woutervanranst/VerbodromeX/tree/3a9a01de3982049f9267326b4a4bd94f468d9439/code/VerbodromeX.Database.Parsers/SourceFiles/English): decoded as UTF-8.

Only normalized grammatical facts, contextual metadata, fixture checksums, and correction provenance are included in development fixtures. Original HTML, site prose, advertisements, and page layouts are not redistributed in the package. Source attribution remains with the respective sites; this project does not assign a new license to their original material.

`scripts/corpus/import.ts` parses actual DOM sections and headings, decodes entities with fatal encoding checks, preserves meaningful accents and correlated alternatives, and rejects missing/unaccounted cells. It does not import the legacy C# parser's fixed offsets or its misleading passive-participle classification.

| Language | Files | Cells | Contextual targets | Available cells | Unavailable cells | Form expectations | Ledger records | Structural placeholders |
|---|---:|---:|---:|---:|---:|---:|---:|---:|
| `fr` | 222 | 26,196 | 24,804 | 23,963 | 2,233 | 23,995 | 125 | 0 |
| `nl` | 207 | 10,764 | 10,764 | 10,646 | 118 | 10,994 | 406 | 1,030 |
| `en` | 145 | 18,270 | 18,270 | 18,270 | 0 | 19,005 | 480 | 435 |

Targets in this report are distinct corrected grammatical identities **within each source-file context**; they are not the public base-catalogue count. Form expectations count accepted alternatives for available cells, including repeated contexts, not unique global strings.

French tables have 118 cells per file, including conditional second-form and participle agreement rows. Dutch tables have 52 grammatical cells per file; the extra modern plural imperative is independently tested. `span.notused` is an availability marker even when a disabled Dutch cell still displays a mechanically generated spelling. Five invalid slots in each six-slot imperative template are explicitly counted as structural placeholders; `zullen` has no such template, giving 1,030 rather than 1,035.

`tests/fixtures/manifest.json` inventories all 429 files with their neutral identity and grammatical context, and records the pinned revision, a checksum of each fixture file, and the accounting per language. It holds no source file names, encodings, or checksums of the original pages. `corrections.json` records file, zero-based cell index, original target/text, corrected interpretation, reason, and authoritative URL. Corrections are reproduced independently of the engine. `remaps.json` records, per language, the remaps (a page that prints the wrong heading over a whole table: heading, occurrence, the corrected mood and tense and, where the page also gets them wrong, person, number, subject slot and voice, reason, authoritative URL); it is empty for French and Dutch. A remap's `occurrence` is the zero-based index of a run of consecutive cells carrying its `heading` (a heading printed twice on a page gives runs 0 and 1), or `all` for every run; every run of a remapped heading must be remapped or listed by the language as intentionally unremapped, otherwise the corpus test fails. The fixture stores the corrected target, and the cell keeps its `heading` as the audit trail. Cells the engine does not model at all carry `scope: 'unmodelled'` and a reason declared by the language; they are their own partition of the accounting (`available + unavailable + unmodelled = cells`; they have no form expectations; the modelled count `cells - unmodelled` and the unmodelled count are pinned in `tests/corpus.test.ts`) and are not compared. The manifest adds `unmodelledCells` and `remaps` to a language's accounting only when they are not zero.

Examples include restoring missing vergissen reflexives, correcting gegeten/gemogen/gebannen, using the right Dutch perfect auxiliary, and fixing historical figurative pleuvoir stems. Repeated invariant French participle headings normalize to one applicable target. Accepted modern spelling is not a source mistake merely because it differs from traditional spelling.

All 36,960 cells receive availability or inclusion assertions, with **no skips or percentage threshold**. Corpus tables are not exhaustive modern variant inventories, so independent grammar goldens check complete accepted sets and invented verbs separately.

### Reproduce fixtures

Use an existing clean checkout at the pinned commit, or create an ignored reference cache with your configured Git authentication:

```sh
git clone --filter=blob:none --no-checkout https://github.com/woutervanranst/VerbodromeX.git .cache/verbodromex-reference
git -C .cache/verbodromex-reference sparse-checkout init --cone
git -C .cache/verbodromex-reference sparse-checkout set \
  'code/VerbodromeX.Database.Parsers/SourceFiles/Français' \
  'code/VerbodromeX.Database.Parsers/SourceFiles/Nederlands'
git -C .cache/verbodromex-reference checkout --detach 3a9a01de3982049f9267326b4a4bd94f468d9439

npm run corpus:import -- --source .cache/verbodromex-reference
npm run corpus:check
```

The importer requires the exact revision and rejects local source-corpus modifications. `--output <directory>` can select another fixture destination, and `--only <language>` re-imports one language while keeping the others as the previous import left them. `--only` refuses to run when the existing manifest is from another revision than the pinned one. Each language lives in `scripts/corpus/languages/<language>.ts` (page parser, sourced corrections, remaps, unmodelled reasons, and the labelled engine queries the corpus test uses); `scripts/corpus/languages/index.ts` lists them. Re-importing the pinned checkout must leave `tests/fixtures` byte-identical. Changing the reference pin is an intentional reviewed change, not an automatic update to the latest remote data.

The corpus test compares a cell as follows. Each labelled query of a file is run once and its forms are narrowed to the cell's corrected target, voice and subject (and agreement, compared by gender, number and case). The language's `applicable(file, cell, forms, label)` then keeps, per query, the forms that answer the cell, and the kept forms of all queries are taken together; a query whose `applicable` returns nothing for a cell contributes nothing, so a form from a query that rejects the cell never satisfies it. An available cell needs every expected form among those forms, an unavailable cell needs none. A language that sets `requireTaggedExtras` also fails any generated form beyond the expected ones that has no variant tag (a pattern, a region, a usage other than standard, or an orthography other than `both`), unless its `acceptsUntagged` excuses it (German: a form labelled with a condition, and 30 reviewed forms its tests pin); only forms in the same resolved target (gender, agreement, voice and subject included) as a form that is expected are looked at, so the other gender of a compound form is not an extra; French and Dutch do not opt in because their fixtures predate the guard.

Ordinary tests and CI use checked-in fixtures and never fetch grammar/corpus pages. CI installs development tooling from the npm lockfile, type-checks, builds, and runs the offline suite, including compiled CLI, ESM/package, browser-boundary, and full corpus checks.
