# Grammar, defaults, and corpus provenance

## Rule-first architecture

`src/conjugate.ts` validates a query, resolves the language model, expands valid catalogue slots, applies grammatical availability, composes components, renders them, and deduplicates/orders equivalent records. French and Dutch adapters share contracts and orchestration, not a speculative universal grammar.

Runtime exception data contains principal parts, truly suppletive overrides, verified family membership, and lexical auxiliary/reflexive/availability metadata. Regular stems/endings and compound constructions are derived. Test fixtures, HTML parsers, filesystem/network access, and the CLI are not imported by the library.

To add coverage, prefer a productive rule or a verified principal-part/family entry with an independent regression. Do not replace a rule with verb-by-mood-by-tense-by-person answer tables. Adding another language requires its typed options, catalogue, adapter, validation/dispatch, sources, and tests.

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

Implemented rules include productive `-er`, second-group `-ir/-issant`, a regular `rendre`-like `-re` model, and compact third-group principal parts/families. Orthography covers `-cer/-ger`, vowel/consonant environments, `-yer`, mute `e`, `é/è`, doubling boundaries, circumflexes, and diaereses. Future/imperfect/subjunctive stems and shared auxiliaries derive compound and literary forms.

Important exception boundaries are explicit: appeler/jeter families retain doubling; irregular envoyer/renvoyer future stems are not overwritten by productive `-er` rules; accroître and émouvoir do not inherit every accent of croître/mouvoir. Only verified derivative prefixes are recognized automatically.

Suffix membership does not override a different productive class: [asservir](https://leconjugueur.lefigaro.fr/conjugaison/verbe/asservir.html) uses second-group `asservissons`, not servir's pattern. [Convenir](https://leconjugueur.lefigaro.fr/conjugaison/verbe/convenir_auxiliaire-etre.html) retains both lexical auxiliary choices, and [advenir](https://leconjugueur.lefigaro.fr/conjugaison/verbe/advenir.html) is restricted to third-person uses.

Traditional interpeller and rectified interpeler share one grammatical identity. Their non-mute forms differ (`interpellons/interpelons`, `interpellé/interpelé`) while `j'interpelle` and `j'interpellerai` retain doubling. The [Académie française entry](https://www.dictionnaire-academie.fr/article/A9I1744*) explicitly gives interpeler the appeler model.

Accepted traditional and rectified spellings remain separate answers where they differ. Homograph-protecting circumflexes are not blanket-removed. In particular, `croître` has preferred rectified participles `crûe/crûs/crûes` alongside traditional `crue/crus/crues`; finite `je crûs` and `que je crûsse` keep their accents. The specific inflections are corroborated by [crûe](https://fr.wiktionary.org/wiki/cr%C3%BBe) and [crûs](https://fr.wiktionary.org/wiki/cr%C3%BBs), in addition to the primary homography rule. Changing spelling preference changes ordering, not acceptance.

Verbal participles marked invariant have no invented agreement identity. The [dormir model](https://leconjugueur.lefigaro.fr/conjugaison/verbe/dormir.html), for example, distinguishes invariant `dormi` from agreeing `endormi/endormie` and `rendormi/rendormie`.

### French defaults and limits

Unlisted `-er`, `-ir`, and compatible `-re` infinitives use the documented regular models; unfamiliar `-ir` defaults to second-group morphology, not a guessed third-group exception. Other non-productive spellings need a compatible model or principal parts. Explicit regular hints can select a different morphological interpretation, as with the [second ressortir model](https://leconjugueur.lefigaro.fr/conjugaison/verbe/ressortir_deuxieme-forme.html).

Unlisted non-reflexives default to `avoir`; known dual auxiliaries preserve conditioned choices. Spelling cannot determine transitivity, lexical sense, or a preceding object. An unlisted initial `h` is assumed mute unless `aspiratedH` is provided. Unclassified reflexive pronouns are assumed direct unless indirect context is supplied.

Availability follows explicit lexical restrictions. Weather `pleuvoir` is impersonal; its accepted plural interpretation is tagged `figurative` using the [figurative paradigm](https://leconjugueur.lefigaro.fr/conjugaison/verbe/pleuvoir_deuxieme-forme.html). `paître` compounds are restricted, with isolated `pu` surviving in specialized use. Defective seoir/messeoir and other literary models do not get fabricated missing paradigms.

Reflexive past imperatives are marked unavailable in the current reference-paradigm scope; the [se laver table](https://leconjugueur.lefigaro.fr/conjugaison/verbe/laver_pronominal.html) supplies present imperatives but no past ones. This is a scoped paradigm decision, not a general sentence-generation claim.

## Dutch

[Taalunie's official spelling authority](https://taalunie.org/dossiers/45/spelling) and its Leidraad provide the normative spelling rules; [e-ANS](https://e-ans.ivdnt.org/topics/pid/ans0203lingtopic), maintained by the Instituut voor de Nederlandse Taal, provides grammar. The supplied [Dutch conjugation overview](https://nl.wikipedia.org/wiki/Werkwoordsvervoegingen_in_het_Nederlands) is supplementary.

| Rule area | Authoritative source |
|---|---|
| Open/closed syllables, written stems, consonants, `v/f`, `z/s` | [Leidraad 11.1](https://woordenlijst.org/zoeken/leidraad/11/1.html) |
| Present endings, final `t`, real `dt`, jij/je versus u inversion | [Leidraad 11.2](https://woordenlijst.org/zoeken/leidraad/11/2.html) |
| Weak past `-de/-te`, underlying voicing | [Leidraad 11.3](https://woordenlijst.org/zoeken/leidraad/11/3.html) |
| Weak participles and `ge-` | [Leidraad 11.4](https://woordenlijst.org/zoeken/leidraad/11/4.html) |
| English loans, silent `e`, pronunciation-dependent alternatives | [Leidraad 12.2](https://woordenlijst.org/zoeken/leidraad/12/2.html) |
| Grammatical conjugation | [e-ANS chapter 2.3](https://e-ans.ivdnt.org/topics/pid/ans0203lingtopic) |
| Modern imperative | [e-ANS 2.3.2.5](https://e-ans.ivdnt.org/topics/pid/ans02030205lingtopic) |
| Perfect auxiliary choice | [e-ANS 2.3.2.8.iv](https://e-ans.ivdnt.org/topics/pid/ans0203020804lingtopic) |
| Obligatory reflexivity, including zich vergissen | [e-ANS 2.2.4](https://e-ans.ivdnt.org/topics/pid/ans020204lingtopic) |

Native stemming keeps underlying voicing separate from written devoicing: `leven` has written `leef` but takes `-de`, not `-te`. Rules handle vowel length, final consonants, `ge-` placement and diaeresis, weak endings, inversion, and compound auxiliaries. Strong/mixed verbs store principal parts rather than complete paradigms; their person endings and compounds remain generated.

Prefix models separate particles only in constructions that actually detach them. For example, `opstaan` generates `ik sta op` but `ik ben opgestaan`. Inseparable derivatives retain their bound prefix and suppress inappropriate `ge-`. Personal `invriezen/bevriezen` models do not inherit the weather paradigm's impersonal restrictions.

### Dutch defaults and limits

An unlisted ordinary `-en` verb defaults to weak native conjugation and `hebben`. Ordinary open/closed syllables are inferred; an explicit written stem or stress hint handles spellings that do not determine pronunciation. Unknown strong verbs need principal parts, and unknown loans need a stem and, where necessary, a `d/t/both` suffix hint.

Stress and lexical sense govern separability and sometimes auxiliary choice. Unknown prefixes are not guessed by stripping letters. Known ambiguous spellings require an explicit separable/inseparable prefix. Known lexical auxiliary choices are not freely replaced; passive-shaped or contradictory hints are errors.

Dutch chart defaults use conventional subjects, not every pronoun/register variation. `u` uses formal singular context and retains present `t` under inversion. `gij/ge`, Dutch subjunctives, and archaic imperative paradigms are not initial public targets.

## Shared scope

The engine generates active conjugated phrases, including supported non-finite and compound constructions. Passive voice, negation, arbitrary complements, attributive/adjectival participles, general sentence generation, dialect inventories, distractor generation, exercise persistence, and UI are outside this package's current scope.

Omitted filters mean all supported grammatical targets and accepted variants under the declared context, not all possible meanings of an infinitive. Runtime analysis exposes classification and assumptions; hints must supply lexical/pronunciation information that grammar cannot recover from spelling alone.

## Corpus provenance and refresh

Reference repository: [woutervanranst/VerbodromeX](https://github.com/woutervanranst/VerbodromeX), pinned commit **`3a9a01de3982049f9267326b4a4bd94f468d9439`**.

- [French source facts](https://github.com/woutervanranst/VerbodromeX/tree/3a9a01de3982049f9267326b4a4bd94f468d9439/code/VerbodromeX.Database.Parsers/SourceFiles/Fran%C3%A7ais): Le Conjugueur / Le Figaro, decoded as Windows-1252.
- [Dutch source facts](https://github.com/woutervanranst/VerbodromeX/tree/3a9a01de3982049f9267326b4a4bd94f468d9439/code/VerbodromeX.Database.Parsers/SourceFiles/Nederlands): Verbix, decoded as UTF-8.

Only normalized grammatical facts, contextual metadata, checksums, and correction provenance are included in development fixtures. Original HTML, site prose, advertisements, and page layouts are not redistributed in the package. Source attribution remains with the respective sites; this project does not assign a new license to their original material.

`scripts/import-corpus.ts` parses actual DOM sections and headings, decodes entities with fatal encoding checks, preserves meaningful accents and correlated alternatives, and rejects missing/unaccounted cells. It does not import the legacy C# parser's fixed offsets or its misleading passive-participle classification.

| Language | Files | Cells | Contextual targets | Available cells | Unavailable cells | Form expectations | Ledger records | Structural placeholders |
|---|---:|---:|---:|---:|---:|---:|---:|---:|
| `fr` | 222 | 26,196 | 24,804 | 23,963 | 2,233 | 23,995 | 125 | 0 |
| `nl` | 207 | 10,764 | 10,764 | 10,646 | 118 | 10,994 | 406 | 1,030 |

Targets in this report are distinct corrected grammatical identities **within each source-file context**; they are not the public base-catalogue count. Form expectations count accepted alternatives for available cells, including repeated contexts, not unique global strings.

French tables have 118 cells per file, including conditional second-form and participle agreement rows. Dutch tables have 52 grammatical cells per file; the extra modern plural imperative is independently tested. `span.notused` is an availability marker even when a disabled Dutch cell still displays a mechanically generated spelling. Five invalid slots in each six-slot imperative template are explicitly counted as structural placeholders; `zullen` has no such template, giving 1,030 rather than 1,035.

`tests/fixtures/manifest.json` inventories all 429 files with original byte checksums, encodings, grammatical context, fixture hashes, and accounting. `corrections.json` records file, zero-based cell index, original target/text, corrected interpretation, reason, and authoritative URL. Corrections are reproduced independently of the engine.

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

The importer requires the exact revision and rejects local source-corpus modifications. `--output <directory>` can select another fixture destination. Changing the reference pin is an intentional reviewed change, not an automatic update to the latest remote data.

Ordinary tests and CI use checked-in fixtures and never fetch grammar/corpus pages. CI installs development tooling from the npm lockfile, type-checks, builds, and runs the offline suite, including compiled CLI, ESM/package, browser-boundary, and full corpus checks.
