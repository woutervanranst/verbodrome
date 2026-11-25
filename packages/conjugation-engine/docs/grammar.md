# Grammar, defaults, and corpus provenance

## Rule-first architecture

`src/conjugate.ts` validates a query, resolves the language model, expands valid catalogue slots, applies grammatical availability, composes components, renders them, and deduplicates/orders equivalent records. French and Dutch adapters share contracts and orchestration, not a speculative universal grammar.

French morphology is model-driven (see below); Dutch morphology is rule-driven with principal parts. Lexical auxiliary/reflexive/availability metadata is kept separately from morphology, and compound constructions are always composed, never stored. Test fixtures, HTML parsers, filesystem/network access, and the CLI are not imported by the library.

To add French coverage, add or widen a model selector, or add a model, with an independent regression. To add Dutch coverage, prefer a productive rule or a verified principal-part entry. Do not add per-verb answer tables for verbs a model can cover. Adding another language requires its typed options, catalogue, adapter, validation/dispatch, sources, and tests.

## French

The primary grammar is [Le Conjugueur's rule index](https://leconjugueur.lefigaro.fr/regle). Core native headings follow [Bescherelle's active aimer table](https://conjugaison.bescherelle.com/verbes/aimer). The supplied [French conjugation overview](https://en.wikipedia.org/wiki/French_conjugation) is supplementary.

| Rule area | Source |
|---|---|
| Productive groups and irregular family boundaries | [Verb groups](https://leconjugueur.lefigaro.fr/frlesgroupes.php) |
| First-group endings and spelling environments | [First-group present](https://leconjugueur.lefigaro.fr/fr_present_indicatif_groupe1.php) |
| 1990 alternatives, accents, `-eler/-eter`, `-é(.)er`, assoir | [Orthographic revisions](https://leconjugueur.lefigaro.fr/fr_nouvelle_orthographe.php) |
| Past-participle formation | [Participe passé](https://leconjugueur.lefigaro.fr/regle/conjugaison/participe_passe.html) |
| Subject versus preceding-direct-object agreement | [Past-participle agreement](https://leconjugueur.lefigaro.fr/fraccord_participe_passe.php) |
| Direct/indirect and essential reflexives | [Pronominal agreement](https://leconjugueur.lefigaro.fr/fraccordpronominal.php) |
| Literary imperfect subjunctive | [Formation](https://leconjugueur.lefigaro.fr/regle/conjugaison/imparfait_subjonctif.html) |
| `aller + infinitif`, `venir de + infinitif` | [Futur proche and passé récent](https://leconjugueur.lefigaro.fr/frfuturproche.php) |

### Conjugation models

`src/languages/fr/models.ts` lists the French conjugation models. A model has selectors, a strip length, and one or more ending tables:

- **Selection.** An infinitive listed in a model's `lemmas` uses it. Otherwise the model with the longest matching `suffixes` entry wins (`prévaloir` over `valoir`, `-ecer` over `-cer`), unless the infinitive is in that model's `except` list or ends with one of its `exceptEndings`. A family is therefore covered by one suffix: `-eindre` covers atteindre, éteindre, and peindre; `-uire` covers conduire and construire.
- **Forms.** The stem is the infinitive minus `strip` letters; each table cell is appended to it. Eight rows hold the indicative present, imperfect, simple past, and future, the subjunctive present and imperfect, the conditional, and a last row with the three imperatives, the present participle, the four past participles, and the infinitive.
- **Cell notation.** `-` marks a missing form, `/` separates accepted alternatives, `t:`/`r:` restrict an alternative to traditional/1990 spelling, `^` rewrites the stem's last `e`/`é` to `è` (lever → lève, céder → cède), and `0` is an empty ending.
- **Model flags** record invariant participles, impersonal use, third-person-only verbs, missing imperatives, and restricted compound tenses. Verb-level restrictions that a shared model cannot express (advenir within the venir family) live in `lexicon.ts`.

Productive models cover regular `-er` (with spelling classes for `-cer`, `-ger`, mute `e`, closed `é`, `-eler/-eter` doubling or grave, and `-yer`), second-group `-ir/-issant`, and regular `-re`. In 1990 spelling, `-er` stems also drop circumflexes on `i` and `u`. Irregular families and suppletive verbs have their own tables; defective verbs mark missing cells.

Important boundaries are explicit selectors: appeler/jeter families double in both spellings; other `-eler/-eter` verbs double traditionally and take `è` in 1990 spelling, except a closed list (geler, modeler, acheter, harceler, …) that takes `è` in both; envoyer/renvoyer keep their irregular future while other `-voyer` verbs do not; accroître and émouvoir do not inherit every accent of croître/mouvoir.

Suffix membership does not override a different productive class: [asservir](https://leconjugueur.lefigaro.fr/conjugaison/verbe/asservir.html) uses second-group `asservissons`, not servir's pattern. [Convenir](https://leconjugueur.lefigaro.fr/conjugaison/verbe/convenir_auxiliaire-etre.html) retains both lexical auxiliary choices, and [advenir](https://leconjugueur.lefigaro.fr/conjugaison/verbe/advenir.html) is restricted to third-person uses.

Traditional interpeller and rectified interpeler share one grammatical identity. Their non-mute forms differ (`interpellons/interpelons`, `interpellé/interpelé`) while `j'interpelle` and `j'interpellerai` retain doubling. The [Académie française entry](https://www.dictionnaire-academie.fr/article/A9I1744*) explicitly gives interpeler the appeler model.

Accepted traditional and rectified spellings remain separate answers where they differ. Homograph-protecting circumflexes are not blanket-removed. In particular, `croître` has preferred rectified participles `crûe/crûs/crûes` alongside traditional `crue/crus/crues`; finite `je crûs` and `que je crûsse` keep their accents. The specific inflections are corroborated by [crûe](https://fr.wiktionary.org/wiki/cr%C3%BBe) and [crûs](https://fr.wiktionary.org/wiki/cr%C3%BBs), in addition to the primary homography rule. Changing spelling preference changes ordering, not acceptance.

Verbal participles marked invariant have no invented agreement identity. The [dormir model](https://leconjugueur.lefigaro.fr/conjugaison/verbe/dormir.html), for example, distinguishes invariant `dormi` from agreeing `endormi/endormie` and `rendormi/rendormie`.

### French defaults and limits

Unlisted infinitives use the model their ending selects. An ending shared by an irregular family selects that family, and the analysis records the inference as an assumption. Otherwise `-er`, `-ir`, and `-re` use the productive models; unfamiliar `-ir` defaults to second-group morphology, not a guessed third-group exception. Endings that no model claims, such as an unknown `-oir`, need a compatible model or principal parts. Explicit regular hints can select a different morphological interpretation, as with the [second ressortir model](https://leconjugueur.lefigaro.fr/conjugaison/verbe/ressortir_deuxieme-forme.html).

Unlisted non-reflexives default to `avoir`; known dual auxiliaries preserve conditioned choices. Spelling cannot determine transitivity, lexical sense, or a preceding object. An unlisted initial `h` is assumed mute unless `aspiratedH` is provided. Unclassified reflexive pronouns are assumed direct unless indirect context is supplied.

Availability follows explicit lexical restrictions. Weather `pleuvoir` is impersonal; its accepted plural interpretation is tagged `figurative` using the [figurative paradigm](https://leconjugueur.lefigaro.fr/conjugaison/verbe/pleuvoir_deuxieme-forme.html). `paître` compounds are restricted, with isolated `pu` surviving in specialized use. Defective seoir/messeoir and other literary models do not get fabricated missing paradigms.

Reflexive past imperatives are marked unavailable in the current reference-paradigm scope; the [se laver table](https://leconjugueur.lefigaro.fr/conjugaison/verbe/laver_pronominal.html) supplies present imperatives but no past ones. This is a scoped paradigm decision, not a general sentence-generation claim.

## Dutch

Dutch runs on the staged core. Its rule inventory with sources, its defaults and assumptions, the two behaviour changes
of the switch and its limits are in [grammar/nl.md](grammar/nl.md).

## Shared scope

The engine generates active conjugated phrases, including supported non-finite and compound constructions. Passive voice, negation, arbitrary complements, attributive/adjectival participles, general sentence generation, dialect inventories, distractor generation, exercise persistence, and UI are outside this package's current scope.

Omitted filters mean all supported grammatical targets and accepted variants under the declared context, not all possible meanings of an infinitive. Runtime analysis exposes classification and assumptions; hints must supply lexical/pronunciation information that grammar cannot recover from spelling alone.

## Corpus provenance and refresh

Reference repository: [woutervanranst/VerbodromeX](https://github.com/woutervanranst/VerbodromeX), pinned commit **`3a9a01de3982049f9267326b4a4bd94f468d9439`**.

- [French source facts](https://github.com/woutervanranst/VerbodromeX/tree/3a9a01de3982049f9267326b4a4bd94f468d9439/code/VerbodromeX.Database.Parsers/SourceFiles/Fran%C3%A7ais): Le Conjugueur / Le Figaro, decoded as Windows-1252.
- [Dutch source facts](https://github.com/woutervanranst/VerbodromeX/tree/3a9a01de3982049f9267326b4a4bd94f468d9439/code/VerbodromeX.Database.Parsers/SourceFiles/Nederlands): Verbix, decoded as UTF-8.

Only normalized grammatical facts, contextual metadata, fixture checksums, and correction provenance are included in development fixtures. Original HTML, site prose, advertisements, and page layouts are not redistributed in the package. Source attribution remains with the respective sites; this project does not assign a new license to their original material.

`scripts/corpus/import.ts` parses actual DOM sections and headings, decodes entities with fatal encoding checks, preserves meaningful accents and correlated alternatives, and rejects missing/unaccounted cells. It does not import the legacy C# parser's fixed offsets or its misleading passive-participle classification.

| Language | Files | Cells | Contextual targets | Available cells | Unavailable cells | Form expectations | Ledger records | Structural placeholders |
|---|---:|---:|---:|---:|---:|---:|---:|---:|
| `fr` | 222 | 26,196 | 24,804 | 23,963 | 2,233 | 23,995 | 125 | 0 |
| `nl` | 207 | 10,764 | 10,764 | 10,646 | 118 | 10,994 | 406 | 1,030 |

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

The corpus test compares a cell as follows. Each labelled query of a file is run once and its forms are narrowed to the cell's corrected target, voice and subject (and agreement, compared by gender, number and case). The language's `applicable(file, cell, forms, label)` then keeps, per query, the forms that answer the cell, and the kept forms of all queries are taken together; a query whose `applicable` returns nothing for a cell contributes nothing, so a form from a query that rejects the cell never satisfies it. An available cell needs every expected form among those forms, an unavailable cell needs none. A language that sets `requireTaggedExtras` also fails any generated form beyond the expected ones that has no variant tag (a pattern, a region, a usage other than standard, or an orthography other than `both`); only forms in the same resolved target (gender, agreement, voice and subject included) as a form that is expected are looked at, so the other gender of a compound form is not an extra; French and Dutch do not opt in because their fixtures predate the guard.

Ordinary tests and CI use checked-in fixtures and never fetch grammar/corpus pages. CI installs development tooling from the npm lockfile, type-checks, builds, and runs the offline suite, including compiled CLI, ESM/package, browser-boundary, and full corpus checks.
