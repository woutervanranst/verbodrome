# Rule-based TypeScript conjugation engine

This is the approved planning snapshot, retained with the implementation. References below to an empty repository or remaining implementation work describe the planning stage. The implemented API, rule boundaries, corpus accounting, and usage are documented in [README.md](README.md), [docs/api.md](docs/api.md), and [docs/grammar.md](docs/grammar.md).

## Problem and approach

Build a conjugation engine for French (`fr`) and Dutch (`nl`) that generates forms from grammatical rules, with compact, explicit lexical exceptions. It must work without a pre-existing conjugation table, including for invented verbs within supported regular classes.

Generation will produce grammatical components first. A separate, reusable renderer will join those components into complete conjugated phrases. This preserves the information a future exercise system needs to recombine authentic components, without implementing a distractor generator or exercise UI.

The public API will be `conjugate(options)`, with language-dependent TypeScript options and an optional fluent builder. Missing grammatical constraints act as wildcards. Results contain all matching accepted forms, each with its own resolved grammatical identity and ordered components.

## Current state and investigation

- The current repository has no tracked application files, package manifest, TypeScript configuration, implementation, or tests. This is a greenfield package, not a modification of an existing engine. Preserve the existing `.github/hooks` configuration.
- The reference repository contains historical HTML conjugation tables and C# parsers, not the requested rule-based TypeScript engine.
- Reference snapshot: `woutervanranst/VerbodromeX`, commit `3a9a01de3982049f9267326b4a4bd94f468d9439`.

| Corpus | HTML files | Distinct base infinitives | Observed structure |
|---|---:|---:|---|
| Français | 222 | 84 | Le Conjugueur tables; feminine, second-pattern, and auxiliary variants |
| Nederlands | 207 | 207 | Verbix tables; regular, strong, mixed, and irregular verbs |

Important findings:

- Inspected French HTML files require Windows-1252 decoding. Inspected Dutch files are UTF-8 with HTML entities. Encoding must be explicit in the importer; do not silently replace undecodable characters.
- The French HTML includes more than the legacy parser imports: infinitif présent, conditionnel passé deuxième forme, all four simple past-participle agreement forms, futur proche, and passé récent.
- The legacy French parser calls `ayant aimé` a passive participle. It is an active compound participial construction; do not inherit that classification.
- The Dutch parser already rewrites source spellings such as `geëten` and `gemoogd`. Audit these against authoritative grammar instead of blindly inheriting its replacements or discarding alternatives.
- Dutch `vergissen.html` omits required reflexive pronouns. e-ANS explicitly identifies `zich vergissen` as obligatorily reflexive. The new engine must produce correct phrases and record this corpus correction.
- Raw GitHub/API retrieval was unavailable without authenticated repository access. An authenticated, no-checkout reference clone is available in the session's `files/verbodromex-reference` directory. Corpus tooling must support authenticated Git access or a local source checkout; ordinary tests must not depend on network access.
- Corpus listings and representative files were inspected, but the complete fixture extraction and cell-level reconciliation remain implementation work.

## Confirmed scope and decisions

- One npm package, strict TypeScript, a browser-safe ESM library, a separate Node CLI, and Vitest tests. No web framework or monorepo.
- Support every grammatical form represented in the two supplied corpora, including compound and non-finite forms. Include French literary forms, tagged appropriately.
- Use language-neutral public identifiers, mapped to native display labels. French labels follow Bescherelle where its tables provide them.
- Prefer 1990-rectified French spelling for canonical ordering, while retaining accepted traditional alternatives. Both remain valid; changing preference must not silently remove accepted answers.
- Return full phrases with conventional subject/context components, including French subjunctive `que`, auxiliaries, and required reflexive pronouns. Imperatives and non-finite forms do not acquire invented subjects.
- Include optional French gender, agreement, auxiliary, and lexical-class context; Dutch pronoun/formality, inversion, reflexive, separability, and stem context.
- Omitted grammatical filters expand to all compatible targets or agreement/auxiliary alternatives. Explicit constraints narrow results.
- Authoritative grammar wins over corpus errors. Corrections require explicit provenance and regression tests, not skipped assertions.
- Defer passive voice, negation, `gij/ge` paradigms, general sentence generation, adjectival uses of participles, distractor generation, and exercise UI.
- Do not add the originally suggested positional six-argument API: the confirmed object API replaces it.

## Public query API and builder

Examples:

```ts
conjugate({ language: 'fr', infinitive: 'aimer' });

conjugate({
  language: 'fr',
  infinitive: 'aimer',
  mood: 'indicative',
  tense: 'present',
});

conjugate({
  language: 'fr',
  infinitive: 'aller',
  mood: 'indicative',
  tense: 'perfect',
  person: 1,
  number: 'plural',
  gender: 'feminine',
});

conjugate(
  conjugationOptions('fr', 'aller')
    .indicative('perfect')
    .person(1, 'plural')
    .gender('feminine')
    .build(),
);
```

The last two requests are equivalent and include `nous sommes allées`.

### Query semantics

- Require `language` and `infinitive`; allow omission of mood, tense, person, number, and relevant agreement constraints.
- Define `ConjugationOptions` as a discriminated union of French and Dutch query types. Model supported mood/tense combinations and language-specific options with proper types, not an untyped option bag.
- Omission means wildcard, not a guessed grammatical value. No literal `'*'` syntax is needed initially.
- Non-finite requests omit person and grammatical person-number inputs. Resolved targets represent these as `null`; participle agreement gender/number are separate features.
- Enumerate compatible entries from the language's valid target catalogue, not an unconstrained Cartesian product. An explicit person filter excludes targets for which person is inapplicable.
- French imperative slots are second-person singular, first-person plural, and second-person plural. Do not fabricate third-person imperative slots.
- Explicitly incompatible filters, unsupported identifiers, or invalid hints produce a typed request error. An otherwise valid slot missing for a defective verb is a grammatical unavailability result instead.
- Missing relevant gender or a known auxiliary choice retains compatible alternatives with per-form features and usage conditions. For example, an unrestricted first-person-plural perfect of `aller` retains both `nous sommes allés` and `nous sommes allées`.
- Wildcards concern grammatical targets, not arbitrary stem strings, unknown lexical classes, sentence paraphrases, or every rendering style. Lexical hints and rendering context retain documented defaults.
- Pronoun/register and word order are explicit rendering context with conventional chart defaults. Do not claim to enumerate every colloquial pronoun spelling or possible sentence wording.
- The builder is a thin typed construction/validation layer over the same query object. It contains no second implementation of conjugation rules.

## Structured result contract

Use a flat `forms` array, as requested, but move the fully resolved target onto each form so wildcard queries do not lose grammatical identity.

Illustrative result, with some metadata fields abbreviated:

```ts
{
  language: 'fr',
  verbId: 'aimer',
  query: {
    mood: 'indicative',
    tense: 'perfect',
    person: 1,
    number: 'plural',
  },
  status: 'available',
  forms: [
    {
      target: {
        mood: 'indicative',
        tense: 'perfect',
        person: 1,
        number: 'plural',
        gender: null,
      },
      text: 'nous avons aimé',
      preferred: true,
      parts: [
        {
          role: 'subject',
          text: 'nous',
          features: { person: 1, number: 'plural' },
        },
        {
          role: 'auxiliary',
          text: 'avons',
          lemma: 'avoir',
          features: {
            mood: 'indicative',
            tense: 'present',
            person: 1,
            number: 'plural',
          },
        },
        {
          role: 'lexicalVerb',
          text: 'aimé',
          lemma: 'aimer',
          features: { verbForm: 'pastParticiple', person: null },
        },
      ],
      variant: { auxiliary: 'avoir' },
      ruleIds: ['fr.indicative.perfect', 'fr.group1.past-participle'],
    },
  ],
  unavailableTargets: [],
  analysis: {
    classification: 'group1',
    classificationSource: 'regularRule',
    assumptions: [],
  },
}
```

Contract invariants:

- `verbId` is a stable normalized grammatical identity, not the HTML filename variant. Preserve reflexive identity and underlying lexical lemmas separately where necessary.
- Every form carries a concrete mood, tense, applicable person/number, agreement/context information, native labels, and any meaningful variant distinctions.
- `forms` contains every accepted generated variant within the requested grammatical and rendering context. Canonical ordering is a preference, not an acceptance filter.
- Include variant-specific orthography, agreement, auxiliary, pattern/sense conditions, and literary/common usage where they distinguish forms. Never independently cross-mix incompatible variant stems or constructions.
- Each concrete target has deterministic preferred-form ordering. A wildcard query has no single arbitrary top-level display answer; every item already has a string `text`.
- Ordered `parts` are generated by the grammatical pipeline. Never recover them by splitting or reparsing final `text`.
- Roles include `moodMarker`, `subject`, `reflexivePronoun`, `auxiliary`, `lexicalVerb`, and, where needed, `particle` or `linker`.
- Parts are grammatical components, not necessarily individual words. A compound can have multiple auxiliaries, including an infinitive auxiliary after the lexical participle.
- Preserve the grammatical features of each component itself. An auxiliary in a perfect construction has its own simple tense; a lexical infinitive/participle has no invented finite person.
- Preserve unelided component text and lexical rendering information. `je` stays `je`, `que` stays `que`, and `se` stays `se` even when the displayed phrase elides them.
- Retain phonological onset/elision information, including mute versus aspirated `h`, and relevant joining/word-order context. Do not bake `j'` into a subject component.
- Deduplicate only equivalent target/component/variant records. Identical text for different grammatical targets or agreement identities must not erase those identities.
- Return `status: 'available'`, `'partiallyAvailable'`, or `'unavailable'` according to matched targets. `unavailableTargets` records concrete targets and sourced reasons for defective/impersonal restrictions.
- Generation failures, invalid queries, and unsupported classifications are typed errors, not success-shaped empty arrays or fabricated regular forms.
- Keep the result serializable and immutable from the caller's perspective.

## Generation and rendering architecture

Pipeline:

1. Normalize and validate the query and infinitive.
2. Resolve the lexical class, principal parts, supported variants, auxiliary/reflexive metadata, and explicit hints.
3. Expand omitted grammatical filters through the supported target catalogue.
4. Apply availability masks and generate stems/endings for each compatible target.
5. Compose ordered subjects, markers, reflexive pronouns, auxiliaries, lexical forms, and particles.
6. Render each generated component sequence, retaining its underlying components and variant identity.
7. Deduplicate equivalent records and order results deterministically.

Use two language adapters behind a small shared interface. Share types, query orchestration, availability/error handling, result assembly, and rendering entry points, not a speculative universal grammar framework.

Export a pure component renderer, such as `renderParts(language, parts, context)`. It applies contextual joining/elision but does not regenerate a swapped verb, enforce agreement, or repair deliberately mismatched components.

Examples the structure and renderer must support:

- Original parts `je` + `aime` render as `j'aime`. Replacing the lexical component with genuine `fais` renders `je fais`, not `j'fais`.
- Subject `nous` from `nous aimons` plus lexical component `aime` from `j'aime` renders `nous aime`.
- Marker/subject `que` + `tu` from `que tu fasses` plus lexical component `faisons` from `nous faisons` renders `que tu faisons`.
- A perfect exposes `avons` separately from `aimé`; Dutch future perfect exposes finite `zal`, lexical `gewerkt`, and infinitive auxiliary `hebben` separately.
- Reflexive imperatives retain proper ordering and hyphenation; Dutch separable verbs retain a separate particle when it is actually detached.

These are fixed component-contract tests, not a distractor generator. Bound prefixes inside a lexical form need not become separate space-delimited components.

## Language coverage and rule design

### French

Native headings follow the verified Bescherelle active tables: Indicatif, Conditionnel, Subjonctif, Impératif, Infinitif, Participe. Preserve corpus-supported Gérondif and periphrastic constructions with accurate supplementary labels.

| Mood identifier | Supported tense identifiers | Native labels |
|---|---|---|
| `indicative` | `present`, `perfect`, `imperfect`, `pluperfect`, `simple_past`, `past_anterior`, `future`, `future_perfect` | Présent, Passé composé, Imparfait, Plus-que-parfait, Passé simple, Passé antérieur, Futur simple, Futur antérieur |
| `indicative` | `near_future`, `recent_past` | Futur proche, Passé récent; identify as periphrastic |
| `subjunctive` | `present`, `past`, `imperfect`, `pluperfect` | Présent, Passé, Imparfait, Plus-que-parfait |
| `conditional` | `present`, `past` | Présent, Passé; first/second past constructions retained as tagged variants |
| `imperative` | `present`, `past` | Présent, Passé |
| `infinitive` | `present`, `past` | Présent, Passé |
| `participle` | `present`, `past`, `perfect` | Présent, Passé, compound participial form; not a passive label |
| `gerund` | `present`, `past` | Gérondif présent, Gérondif passé |

Implement:

- Productive `-er` and regular `-ir/-issant` rules; explicit third-group families and regular `-re` models where applicable.
- Stem derivation for imperfect, subjunctive, future/conditional, past simple, and imperfect subjunctive; shared auxiliary composition for compound forms.
- Orthographic transformations for `-cer`, `-ger`, `-guer`, `-yer`, mute `e`, `é/è`, `-eler/-eter`, doubled consonants, circumflexes, and diaereses. Apply transformations according to the actual grammatical environment.
- Rectified/traditional alternatives with explicit exception boundaries, including `appeler`/`jeter` families, rather than blanket accent removal.
- Principal-part exceptions and narrowly scoped overrides for irregular families, suppletive verbs, alternate paradigms, defective verbs, and their verified derivatives.
- Auxiliary selection, gender/number agreement, preceding-direct-object context with `avoir`, and distinct reflexive agreement rules. Do not assume all reflexive participles simply agree with the subject.
- Required clitics, subjunctive markers, imperative placement, and non-finite composition.

Unknown verbs use documented regular defaults for productive classes, including second-group `-ir`. Non-productive or genuinely ambiguous families require compatible class/principal-part hints when no justified default exists. The result must disclose classification assumptions.

### Dutch

Use Taalunie's official Leidraad for spelling and e-ANS for conjugation, grammatical restrictions, auxiliaries, and reflexivity.

| Mood identifier | Supported tense identifiers | Native labels |
|---|---|---|
| `indicative` | `present`, `past`, `future`, `perfect`, `pluperfect`, `future_perfect` | Onvoltooid tegenwoordige tijd, Onvoltooid verleden tijd, Onvoltooid tegenwoordige toekomende tijd, Voltooid tegenwoordige tijd, Voltooid verleden tijd, Voltooid tegenwoordige toekomende tijd |
| `conditional` | `present`, `past` | Onvoltooid verleden toekomende tijd, Voltooid verleden toekomende tijd |
| `imperative` | `present` | Gebiedende wijs; modern standard form |
| `infinitive` | `present` | Onbepaalde wijs |
| `participle` | `present`, `past` | Tegenwoordig deelwoord, Voltooid deelwoord |

Dutch subjunctive, archaic imperative paradigms, and additional non-corpus periphrases are not initial public targets.

Implement:

- Stem derivation with vowel length, open/closed syllables, consonant simplification, and final `v/f` and `z/s` spelling.
- Preserve the underlying stem/voicing information needed to choose weak past and participle endings correctly: `leven -> leefde`, not `leefte`.
- Present person/number endings, final-`t` suppression, real `-dt`, and inversion-specific second-person `jij/je` behavior. Do not drop `t` for inverted `u`.
- Weak past `-de/-te`, plural past forms, past-participle `d/t`, `ge-` placement/suppression, and present participles.
- Separable/inseparable prefix behavior based on verified lexical metadata or explicit hints, not naive prefix stripping.
- Strong/mixed/irregular principal parts, vowel alternation families, auxiliary/modal exceptions, and accepted alternatives.
- `hebben/zijn` composition, `zullen/zouden` future/conditional composition, and required reflexive pronouns.
- Modern productive English-loan rules, with origin/stem/pronunciation hints when spelling alone cannot determine the form.

Unknown ordinary Dutch verbs default to weak conjugation. Stress, pronunciation, separability, strong principal parts, and semantic auxiliary selection cannot always be inferred from an invented spelling; expose explicit hints and assumptions rather than pretending otherwise.

### Exception-data boundary

> **Revision.** French morphology now uses suffix-selected conjugation models: compact per-model ending tables appended to a stripped stem, documented in [grammar.md](grammar.md#conjugation-models). Tables are per model, never per verb, except for suppletive verbs; compound tenses remain composed. The Dutch boundary below is unchanged.

Permitted runtime data: lexical class/family membership, exceptional principal parts, truly suppletive cell overrides, auxiliary/reflexive/availability metadata, and accepted variant conditions.

Forbidden runtime approach: import the corpus as complete verb-by-mood-by-tense-by-person answer tables, precompute all those tables into production data, or call an external conjugation service. Regular forms and compound tenses must remain derived from rules.

## Corpus-driven test suite

Create a reproducible development-only importer for the pinned snapshot:

- Accept an authenticated Git snapshot or local source checkout. Cache original HTML locally and exclude it from production/package exports.
- Inventory all 429 HTML files and retain file paths, checksums, encoding, base lemma, and variant context in a manifest.
- Parse actual DOM structure and headings, not the legacy parser's fixed cell indices or line offsets.
- Import every conjugation section, non-finite form, agreement form, alternative, and unavailable marker, including sections omitted by the legacy parsers.
- Decode HTML entities and normalize Unicode/apostrophe typography without removing meaningful accents, diaereses, or spelling distinctions.
- Preserve full alternative relationships; do not blindly split on the first slash or create Cartesian combinations of incompatible variants.
- Store normalized grammatical facts as test fixtures with attribution, plus a separate sourced corrections ledger. Review provenance/redistribution before committing fixture material; do not republish site prose, advertising, or original copyrighted HTML as package content.
- Each correction records source file/target, original content, corrected interpretation, reason, and authoritative URL. Incorrect source entries still receive assertions against the corrected engine behavior.
- Corpus tables are not exhaustive inventories of all accepted modern alternatives. Assert inclusion of every validated corpus form, and test complete accepted variant sets separately against grammar-grounded goldens.
- Report file/cell/target counts, verified forms, unavailable forms, corrections, and parser discrepancies. Fail on unaccounted cells, unexplained mismatches, or silent skipping.
- Normal test runs are offline and use fixtures. Corpus refresh is an explicit command, not a startup dependency.

## Intended files and tooling

```text
package.json / package-lock.json
tsconfig.json / tsconfig.build.json
vitest.config.ts
.gitignore
src/index.ts
src/types.ts
src/catalogue.ts
src/options.ts
src/conjugate.ts
src/render.ts
src/errors.ts
src/cli.ts
src/languages/fr/{index,models,table,lexicon,principal}.ts
src/languages/nl/{index,rules,orthography,exceptions}.ts
scripts/import-corpus.ts
tests/fixtures/{manifest,fr,nl,corrections}.json
tests/{options,catalogue,render,query,fr,nl,corpus,cli}.test.ts
README.md
docs/api.md
docs/grammar.md
.github/workflows/ci.yml
```

Keep modules small enough to follow, without requiring every family to have its own file. Adjust subdivisions only when the implementation warrants it.

- Compile ESM/declarations with `tsc`; isolate Node-only imports to CLI/import tooling.
- Use Node's argument parsing rather than a heavyweight CLI framework.
- Use an HTML parser such as Cheerio only in development tooling. No corpus-parser or Node runtime dependency in the library entry point.
- Use scripts for `typecheck`, `test`, `build`, `cli`, and explicit corpus import.

## CLI behavior

Use `verbodrome <language> <infinitive>` plus optional grammatical flags, mapping directly to the query object:

```text
verbodrome fr aimer --mood indicative --tense present --person 1 --number plural
verbodrome fr aimer --mood indicative --tense present
verbodrome nl werken --json
```

- For a single resolved target, print its preferred rendered form by default.
- For a wildcard query matching multiple targets, print all matching accepted forms with mood/tense/person/number labels and any distinguishing agreement/variant information.
- `--json` returns the full structured result without informational noise on stdout.
- Offer bare-phrase projection through the component renderer, omitting finite subjects/subjunctive context while retaining necessary auxiliaries, reflexives, gerund `en`, and linkers.
- Display genuinely unavailable targets explicitly. Use nonzero exit codes for invalid requests, generation failures, or a request with no available conjugation; do not treat ordinary partial availability in a broad query as an engine failure.

## Validation and acceptance criteria

- Type-check the library, builder, CLI, tooling, and tests; compile and import the built ESM entry point.
- Guard the library/Node-tooling boundary so browser consumers do not import filesystem, process, network, or CLI dependencies.
- Account for 100% of the pinned corpus files and extracted cells. All validated/corrected supported forms must match; no unexplained omissions or mismatches.
- Cover every public catalogue slot using regular models, and exercise all supported finite person/number combinations and non-finite applicability rules.
- Add independently specified invented-verb goldens, not expectations generated by the engine under test. Examples include French `blouper -> nous bloupons`, `ploucer -> nous plouçons`, `glonger -> nous glongeons`, `brumir -> nous brumissons`, and Dutch `zorpen -> ik zorp / ik zorpte / gezorpt`.
- Add deterministic generated regular-verb cases and rule invariants; assert that invented examples have no lexical exception entries.
- Test real verbs outside the corpus and verified derivative-family boundaries, not only the listed model infinitives.
- Test complete accepted sets for alternations such as `je paie/je paye`, rectified/traditional spellings, alternate irregular paradigms, agreement, and auxiliary choices.
- Test wildcard results against explicit expected target inventories and against the union of corresponding precise requests. Narrowing a query must be equivalent to filtering the broader result under the same context.
- Verify per-component grammatical identity, unelided text, ordering, multiple auxiliaries, reflexive joining, and the fixed recombination examples above.
- Verify unavailable versus invalid versus failed generation, including `falloir` and other defective paradigms.
- Spawn the built CLI to check precise, wildcard, bare, JSON, and error output behavior.
- Run targeted Vitest selectors during implementation, then `npm run typecheck`, `npm test`, and `npm run build` for final verification. CI runs the same offline checks from the lockfile.

## Implementation todos

All implementation todos start pending. Dependency tracking is mirrored into session SQL, not Markdown checkboxes.

| ID | Todo | Prerequisites |
|---|---|---|
| `scaffolding-package` | Scaffolding the npm/TypeScript/Vitest package and library/CLI build boundary | None |
| `defining-query-contract` | Defining language catalogues, wildcard options, typed builder, result/components, and domain errors | `scaffolding-package` |
| `building-corpus-fixtures` | Building the pinned importer, complete inventory, fixtures, correction ledger, and parser tests | `scaffolding-package`, `defining-query-contract` |
| `implementing-component-renderer` | Implementing contextual rendering and authentic-component contract tests | `defining-query-contract` |
| `implementing-french-engine` | Implementing French rules, compact exceptions, variants, availability, and component generation | `defining-query-contract`, `building-corpus-fixtures`, `implementing-component-renderer` |
| `implementing-dutch-engine` | Implementing Dutch rules, compact exceptions, variants, availability, and component generation | `defining-query-contract`, `building-corpus-fixtures`, `implementing-component-renderer` |
| `wiring-wildcard-engine` | Wiring query expansion, language dispatch, result assembly, ordering, filtering, and error semantics | `implementing-component-renderer`, `implementing-french-engine`, `implementing-dutch-engine` |
| `adding-cli-wrapper` | Adding the thin CLI with precise/wildcard/bare/JSON rendering and explicit errors | `wiring-wildcard-engine` |
| `documenting-and-wiring-ci` | Documenting APIs, grammar sources, defaults/boundaries, corpus refresh, and adding offline CI | `wiring-wildcard-engine`, `adding-cli-wrapper` |
| `verifying-rule-engine` | Completing corpus reconciliation, novel-verb/variant/component coverage, and final package/CLI verification | `building-corpus-fixtures`, `wiring-wildcard-engine`, `adding-cli-wrapper`, `documenting-and-wiring-ci` |

French and Dutch adapter work is independent once the shared contract, renderer, and fixtures are ready. No agent orchestration is required to execute this plan.

## Sources

French grammar and terminology:

- [Le Conjugueur rule index](https://leconjugueur.lefigaro.fr/regle)
- [Verb groups and family boundaries](https://leconjugueur.lefigaro.fr/frlesgroupes.php)
- [First-group present and spelling rules](https://leconjugueur.lefigaro.fr/fr_present_indicatif_groupe1.php)
- [Orthographic revisions](https://leconjugueur.lefigaro.fr/fr_nouvelle_orthographe.php)
- [Past participles](https://leconjugueur.lefigaro.fr/regle/conjugaison/participe_passe.html)
- [Reflexive agreement](https://leconjugueur.lefigaro.fr/fraccordpronominal.php)
- [Verified Bescherelle active table headings](https://conjugaison.bescherelle.com/verbes/aimer)
- [French conjugation overview supplied by the user](https://en.wikipedia.org/wiki/French_conjugation)

Authoritative Dutch sources:

- [Taalunie: official spelling authority and Leidraad](https://taalunie.org/dossiers/45/spelling)
- [Leidraad chapter 11: native verbs](https://woordenlijst.org/zoeken/leidraad/11.html)
- [11.1: stems](https://woordenlijst.org/zoeken/leidraad/11/1.html)
- [11.2: present and inversion](https://woordenlijst.org/zoeken/leidraad/11/2.html)
- [11.3: weak past](https://woordenlijst.org/zoeken/leidraad/11/3.html)
- [11.4: weak past participles](https://woordenlijst.org/zoeken/leidraad/11/4.html)
- [12.2: English-loan verbs and accepted alternatives](https://woordenlijst.org/zoeken/leidraad/12/2.html)
- [e-ANS: conjugation chapter](https://e-ans.ivdnt.org/topics/pid/ans0203lingtopic)
- [e-ANS: regular conjugation overview](https://e-ans.ivdnt.org/topics/pid/ans020303lingtopic)
- [e-ANS: imperative](https://e-ans.ivdnt.org/topics/pid/ans02030205lingtopic)
- [e-ANS: auxiliary choice](https://e-ans.ivdnt.org/topics/pid/ans0203020804lingtopic)
- [e-ANS: necessary reflexivity, including zich vergissen](https://e-ans.ivdnt.org/topics/pid/ans020204lingtopic)
- [Dutch conjugation overview supplied by the user](https://nl.wikipedia.org/wiki/Werkwoordsvervoegingen_in_het_Nederlands)

Pinned reference corpora and legacy parsing evidence:

- [French source directory](https://github.com/woutervanranst/VerbodromeX/tree/3a9a01de3982049f9267326b4a4bd94f468d9439/code/VerbodromeX.Database.Parsers/SourceFiles/Fran%C3%A7ais)
- [Dutch source directory](https://github.com/woutervanranst/VerbodromeX/tree/3a9a01de3982049f9267326b4a4bd94f468d9439/code/VerbodromeX.Database.Parsers/SourceFiles/Nederlands)
- `code/VerbodromeX.Database.Parsers/LanguageParsers/Français.cs`
- `code/VerbodromeX.Database.Parsers/LanguageParsers/Nederlands.cs`

## Considerations

- No repository files have been changed during planning. The reference clone and this plan are session artifacts.
- Grammar, spelling, pronunciation, stress, lexical meaning, and auxiliary choice are not always recoverable from the infinitive alone. Document the exact regular defaults and hint requirements.
- “All forms” means all supported catalogue targets and accepted variants in the declared context, not every possible sentence, dialect, phonetic spelling, or unknown lexical interpretation.
- Do not reduce testing to a high percentage of corpus matches: complete accounting, sourced reconciliation, genuine novel-verb behavior, wildcard correctness, and component preservation are separate acceptance requirements.
- The result must enable future recombination, but no distractor-selection, correctness-classification service, exercise persistence, or exercise UI is part of this implementation.
