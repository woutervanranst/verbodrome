# API and CLI reference

## Entry points

```ts
import {
  conjugate,
  conjugationOptions,
  parseConjugationOptions,
  renderParts,
  getCatalogue,
  ConjugationError,
} from 'verbodrome';
import type { ConjugationOptions, ConjugationResult, ConjugationPart } from 'verbodrome';
```

`conjugate(options: ConjugationOptions): ConjugationResult` is synchronous and has no I/O or production dependencies. `ConjugationOptions` is a discriminated union of French and Dutch requests. `parseConjugationOptions(unknown)` validates an incoming payload before passing it to the same engine.

The ESM library runs in modern browsers supporting `structuredClone`. Node-only CLI and corpus-import modules are not reachable from the library entry point.

## Query semantics

Only `language` and `infinitive` are required. Mood, tense, person, finite number, and applicable agreement filters are optional; omission means wildcard, not a guessed value. Use identifiers from the tables below, not literal `'*'`, native display labels, or `null`.

Infinitives and lexical spelling hints are normalized to NFC/lowercase with straight apostrophes. Validation rejects unknown fields, wrong-language options, empty stems, invalid mood/tense combinations, and incompatible grammatical filters. Input objects are cloned; permitted `undefined` values become omitted fields without mutating the caller.

Finite `person` is `1 | 2 | 3`; finite `number` is `'singular' | 'plural'`. Explicit non-finite requests omit both. A finite person or number filter excludes non-finite targets from a wildcard query. For participle agreement, use `agreement.number`, not top-level `number`.

French imperative slots are `2 singular`, `1 plural`, and `2 plural`. Modern Dutch imperatives have `2 singular` and `2 plural`, often with identical text. Invalid slots are request errors; defective verbs return grammatical unavailability for otherwise supported slots.

Wildcards enumerate grammatical targets and accepted morphological variants in the declared context. They do not enumerate arbitrary lexical meanings, spellings of unknown stems, dialects, subject-pronoun choices, or every sentence construction.

## Supported moods and tenses

`getCatalogue(language)` returns immutable mood/tense entries with `finite`, `moodLabel`, and `tenseLabel`. Its 25 French entries expand to 109 base grammatical slots; the 12 Dutch entries expand to 53. Agreement and variant identities can increase the number of returned forms.

### French

| Mood | Tense IDs and native labels |
|---|---|
| `indicative` / Indicatif | `present`: Présent; `perfect`: Passé composé; `imperfect`: Imparfait; `pluperfect`: Plus-que-parfait; `simple_past`: Passé simple; `past_anterior`: Passé antérieur; `future`: Futur simple; `future_perfect`: Futur antérieur; `near_future`: Futur proche; `recent_past`: Passé récent |
| `subjunctive` / Subjonctif | `present`: Présent; `past`: Passé; `imperfect`: Imparfait; `pluperfect`: Plus-que-parfait |
| `conditional` / Conditionnel | `present`: Présent; `past`: Passé |
| `imperative` / Impératif | `present`: Présent; `past`: Passé |
| `infinitive` / Infinitif | `present`: Présent; `past`: Passé |
| `participle` / Participe | `present`: Présent; `past`: Passé; `perfect`: Passé (forme composée) |
| `gerund` / Gérondif | `present`: Présent; `past`: Passé |

The conditional past includes tagged `past-first` and literary `past-second` constructions. `near_future`, `recent_past`, compound participles, and gerunds supplement the core Bescherelle headings. `ayant aimé` is an active compound participial construction, not passive voice.

### Dutch

| Mood | Tense IDs and native labels |
|---|---|
| `indicative` / Aantonende wijs | `present`: Onvoltooid tegenwoordige tijd; `past`: Onvoltooid verleden tijd; `future`: Onvoltooid tegenwoordige toekomende tijd; `perfect`: Voltooid tegenwoordige tijd; `pluperfect`: Voltooid verleden tijd; `future_perfect`: Voltooid tegenwoordige toekomende tijd |
| `conditional` / Voorwaardelijke wijs | `present`: Onvoltooid verleden toekomende tijd; `past`: Voltooid verleden toekomende tijd |
| `imperative` / Gebiedende wijs | `present`: Tegenwoordig |
| `infinitive` / Onbepaalde wijs | `present`: Tegenwoordig |
| `participle` / Deelwoord | `present`: Tegenwoordig deelwoord; `past`: Voltooid deelwoord |

## French context and lexical hints

| Option | Values / meaning |
|---|---|
| `gender` | `masculine` / `feminine`: subject context and the fallback gender of an isolated agreeing participle |
| `agreement` | Optional `{ gender?, number? }` filters on actual participle agreement |
| `precedingDirectObject` | Complete `{ gender, number }`: agreement with an explicitly supplied preceding direct object |
| `reflexiveObject` | `direct` / `indirect`: the role of a reflexive pronoun |
| `auxiliary` | `avoir` / `être`: narrow a known choice or provide an unlisted verb's lexical auxiliary |
| `preferredOrthography` | `rectified` (default) / `traditional`: ordering preference, never an acceptance filter |
| `aspiratedH` | Boolean pronunciation hint for initial `h` |
| `classHint` | `er` / `ir` / `re`: explicitly choose a compatible regular morphological class |
| `model` | `aimer`, `finir`, `rendre`, or a curated irregular model that is a suffix of the requested infinitive |
| `stems` | Principal-part hints described below |

Known reflexive or auxiliary restrictions reject contradictory hints. A `se `/`s'` infinitive is reflexive; a small list of obligatorily reflexive verbs is recognized automatically. In compound reflexives, direct pronouns normally trigger subject agreement, indirect ones do not, and preceding-direct-object context is handled separately.

Omitted gender retains relevant alternatives: `aller` with first-person plural perfect gives both `nous sommes allés` and `nous sommes allées`. An `avoir` construction does not gain meaningless masculine/feminine duplicates for `je`, `tu`, `nous`, or `vous`; its unagreed participle has the masculine-singular baseline. Invariant verbal participles instead carry `null` agreement, gender, and number. An explicit agreement filter cannot match an invariant participle.

An explicit regular model takes precedence over automatic family detection. For example:

```ts
conjugate({
  language: 'fr', infinitive: 'ressortir',
  model: 'finir', auxiliary: 'avoir',
  mood: 'indicative', tense: 'present',
  person: 3, number: 'singular', gender: 'masculine',
}).forms[0]?.text; // il ressortit
```

Without that model, `ressortir` uses the `sortir` morphology. Model/class hints select morphology; lexical meaning and auxiliary context remain separate. Do not force a regular class on an irregular verb unless that is the interpretation you intend. If both `classHint` and `model` are supplied, they must specify the same regular class.

French `stems` supports `singular`, `plural`, `thirdPlural`, `future`, `past`, `pastVowel`, and `pastParticiple`. Stems exclude the endings generated by their model; `future` must include its final `r`. `pastVowel` is `a | i | u | in`. For a regular `brumir` profile the corresponding pieces are `brumi`, `brumiss`, `brumiss`, `brumir`, `brum`, `i`, and `brumi`. Hints replace stems, not a known model's literal suppletive cell overrides. An unrecognized non-productive infinitive such as `-oir` requires a compatible irregular model or complete principal parts.

## Dutch context and lexical hints

| Option | Values / meaning |
|---|---|
| `pronoun` | `ik`, `jij`, `je`, `u`, `hij`, `zij`, `ze`, `het`, `wij`, `we`, `jullie` |
| `inversion` | Put the finite verb before its subject; inverted `jij`/`je` drops present `t`, inverted `u` does not |
| `reflexive` | Boolean; `zich ` and known obligatory reflexives cannot be disabled |
| `auxiliary` | `hebben` / `zijn`: narrow or supply lexical perfect-auxiliary context |
| `classHint` | `weak`, `strong`, or `loan` |
| `separablePrefix` | Verified or explicitly supplied separable prefix |
| `inseparablePrefix` | Verified or explicitly supplied inseparable prefix |
| `stems` | Written stem, principal parts, stress, and suffix hints described below |

Pronouns constrain compatible person/number slots. `u` means formal second-person singular chart context, not an implicit plural addressee. `zij` and `ze` can match third-person singular or plural; omission uses conventional chart pronouns. Impersonal weather verbs use `het`. Bare past participles remain lexical forms without an invented subject/reflexive pronoun.

Dutch `stems` supports `stem`, `pastSingular`, `pastPlural`, `pastParticiple`, `pastSuffix: 'd' | 't' | 'both'`, and `unstressedFinalSyllable`. An unknown `strong` verb requires past-singular and past-participle principal parts; a plural hint avoids unjustified inferred vowel/voicing alternation. An unknown `loan` requires an explicit written/pronounced stem, including any silent `e`. Prefix hints and lexical principal parts apply to the base verb when a derivative is composed.

Unknown prefix strings are not stripped automatically. Ambiguous known spellings such as `voorkomen` require a separable/inseparable hint. Strong verbs and verified prefixed senses reject incompatible weak-class, prefix, or auxiliary hints.

```ts
conjugate({
  language: 'nl', infinitive: 'opzorpen',
  separablePrefix: 'op',
  mood: 'indicative', tense: 'perfect',
  person: 1, number: 'singular',
}).forms[0]?.text; // ik heb opgezorpt
```

## Results, variants, and errors

`ConjugationResult` contains `language`, normalized `verbId`, cloned `query`, `status`, flat `forms`, `unavailableTargets`, and `analysis`. `analysis` identifies the lexical lemma, classification, source (`lexicon`, `regularRule`, or `explicitHint`), reflexivity, auxiliaries, and regular-default assumptions.

Each form contains:

- `target`: resolved mood/tense, finite person/number or `null`, relevant subject gender or `null`, and separate participle agreement or `null`.
- `text`, native `labels`, `preferred`, ordered `parts`, and diagnostic `ruleIds`.
- `variant`: orthography (`rectified`, `traditional`, `both`), auxiliary, correlated pattern, usage (`standard`, `literary`, `dated`), and any construction/sense condition.

There is one preferred form per fully resolved target, not one answer for an entire wildcard result. Standard usage is preferred to literary/dated variants, then the requested French spelling preference applies. Dutch orthography is `both` because that distinction is French-specific. Identical strings may remain distinct across targets or meaningful pattern/condition identities; callers must not deduplicate solely by `text`.

`status` is `available`, `partiallyAvailable`, or `unavailable`. Every `unavailableTargets` record gives its target, reason (`impersonal`, `defective`, `noImperative`), explanation, and source. For example, a first-person present of `falloir` is unavailable, while its broad query is partially available.

Invalid requests and failed generation throw `ConjugationError`, with a stable `code`: `INVALID_REQUEST`, `UNSUPPORTED_LANGUAGE`, `INVALID_INFINITIVE`, `INVALID_TARGET`, `INVALID_HINT`, `AMBIGUOUS_CLASSIFICATION`, or `GENERATION_FAILURE`. An empty adapter result without an availability decision is a generation failure, not grammatical unavailability.

## Components and rendering

Parts are generated before strings, not recovered by splitting them. Roles are `moodMarker`, `subject`, `reflexivePronoun`, `auxiliary`, `lexicalVerb`, `particle`, and `linker`. Each part carries underlying text, lexical lemma where applicable, its own grammatical features, onset (`vowel`, `consonant`, `muteH`, `aspiratedH`), and joining style.

Underlying `je`, `que`, `se`, and `de` remain unelided. Auxiliary features identify the auxiliary's actual simple mood/tense; non-finite lexical features have no finite person. Dutch future perfect can contain both finite `zal` and final infinitive `hebben`.

`renderParts(language, parts, { bare? })` is pure. It recomputes joining and French elision from the replacement components but does not regenerate verbs or repair mismatches. Authentic recombinations deliberately render as `je fais`, `nous aime`, and `que tu faisons`. This enables a later exercise application without implementing distractor selection.

Bare projection removes subjects and French subjunctive `que`, while preserving auxiliaries, reflexives, gerund `en`, linkers, and detached particles.

## Builder

`conjugationOptions(language, infinitive)` offers mood-specific methods such as `.indicative('perfect')`, `.subjunctive('present')`, and `.participle('past')`, plus the applicable option setters above. `.build()` returns the language-specific query after runtime validation; it has no independent conjugation logic.

Language-specific methods and mood-specific tense arguments are checked by TypeScript. The generic `.mood()`/`.tense()` setters and constraints added after a non-finite method are checked for their combined compatibility at `.build()`.

## CLI flags and exit codes

```text
verbodrome <fr|nl> <infinitive> [options]
```

Quote multiword reflexive infinitives, for example `verbodrome fr "se laver"`.

Common flags: `--mood`, `--tense`, `--person`, `--number`, `--auxiliary`, `--class`, `--stems '<JSON>'`, `--json`, `--bare`, `--help`.

French flags: `--gender`, `--agreement '<JSON>'`, `--preceding-direct-object '<JSON>'`, `--reflexive-object`, `--model`, `--aspirated-h`, `--orthography`.

Dutch flags: `--pronoun`, `--inversion`, `--reflexive` / `--no-reflexive`, `--separable-prefix`, `--inseparable-prefix`.

The CLI maps these directly to API fields (`--class` to `classHint`, `--orthography` to `preferredOrthography`). Plain single-target output is the preferred phrase; wildcard output includes native target labels and meaningful variant distinctions. Unavailable targets are displayed explicitly.

`--json` always returns the complete structured result, even with `--bare`. Invalid requests emit diagnostics only on stderr. Exit codes are **0** for available/partially available requests or help, **1** for invalid requests/classification or argument errors, **2** for internal generation failure, and **3** when no requested grammatical form is available.
