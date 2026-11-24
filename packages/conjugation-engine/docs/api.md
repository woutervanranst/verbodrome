# API and CLI reference

## Entry points

```ts
import {
  conjugate,
  conjugationOptions,
  parseConjugationOptions,
  renderParts,
  getCatalogue,
  explain,
  languages,
  createEngine,
  ConjugationError,
} from 'conjugation-engine';
import type { ConjugationOptions, ConjugationResult, ConjugationPart } from 'conjugation-engine';
```

`conjugate(options: ConjugationOptions): ConjugationResult` is synchronous and has no I/O or production dependencies. `ConjugationOptions` is a discriminated union of French and Dutch requests. `parseConjugationOptions(unknown)` validates an incoming payload before passing it to the same engine.

Each language is a pack: its catalogue, rendering rules and resolver. `languages` lists the built-in ones (`['fr', 'nl']`); an unknown language throws `UNSUPPORTED_LANGUAGE` naming them. `createEngine(packs, catalogs?)` builds an engine with the same `conjugate`, `getCatalogue`, `renderParts` and `expandTargets`, plus `explain`, over a chosen set of packs, accepting only those languages. `catalogs` maps a locale to its message catalog (see Explanations); without them the engine cannot `explain`.

The ESM library runs in modern browsers supporting `structuredClone`. Node-only CLI and corpus-import modules are not reachable from the library entry point.

## Query semantics

Only `language` and `infinitive` are required. Mood, tense, person, finite number, and applicable agreement filters are optional; omission means wildcard, not a guessed value. Use identifiers from the tables below, not literal `'*'`, native display labels, or `null`.

Infinitives and lexical spelling hints are normalized to NFC/lowercase with straight apostrophes. Validation rejects unknown fields, wrong-language options, empty stems, invalid mood/tense combinations, and incompatible grammatical filters. Input objects are cloned; permitted `undefined` values become omitted fields without mutating the caller.

Finite `person` is `1 | 2 | 3`; finite `number` is `'singular' | 'plural'`. Explicit non-finite requests omit both. A finite person or number filter excludes non-finite targets from a wildcard query. For participle agreement, use `agreement.number`, not top-level `number`.

French imperative slots are `2 singular`, `1 plural`, and `2 plural`. Modern Dutch imperatives have `2 singular` and `2 plural`, often with identical text. Invalid slots are request errors; defective verbs return grammatical unavailability for otherwise supported slots.

Wildcards enumerate grammatical targets and accepted morphological variants in the declared context. They do not enumerate arbitrary lexical meanings, spellings of unknown stems, dialects, subject-pronoun choices, or every sentence construction.

## Supported moods and tenses

`getCatalogue(language)` returns immutable mood/tense entries with `finite`, `persons` (the person/number slots of a finite entry, in output order; empty when non-finite), `moodLabel`, and `tenseLabel`. Its 25 French entries expand to 109 base grammatical slots; the 12 Dutch entries expand to 53. Agreement and variant identities can increase the number of returned forms.

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
| `model` | `aimer`, `finir`, `rendre` (regular classes), or the id of a conjugation model with a selector that the requested infinitive ends with |
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

French `stems` supports `singular`, `plural`, `thirdPlural`, `future`, `past`, `pastVowel`, and `pastParticiple`. Stems exclude the endings generated by their model; `future` must include its final `r`. `pastVowel` is `a | i | u | in`. For a regular `brumir` profile the corresponding pieces are `brumi`, `brumiss`, `brumiss`, `brumir`, `brum`, `i`, and `brumi`. Each hint replaces the cells it determines (for example, `future` replaces the future and conditional) and leaves the model's other cells unchanged. An infinitive whose ending no model claims, such as an unknown `-oir`, requires a compatible model or complete principal parts.

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

`ConjugationResult` contains `language`, normalized `verbId`, cloned `query`, `status`, flat `forms`, `unavailableTargets`, and `analysis`. `analysis` identifies the lexical lemma, classification, source (`lexicon`, `regularRule`, or `explicitHint`), reflexivity, auxiliaries, and regular-default assumptions. For French, `classification` is the conjugation model the verb follows (`aimer`, `placer`, `finir`, `rendre`, `venir`, …); passing it back as `model` selects the same inflection. Use `classificationSource === 'regularRule'` to tell productive models from irregular families.

Each form contains:

- `target`: resolved mood/tense, finite person/number or `null`, relevant subject gender or `null`, and separate participle agreement or `null`.
- `text`, native `labels`, `preferred`, ordered `parts`, and diagnostic `ruleIds`.
- `variant`: orthography (`rectified`, `traditional`, `both`), auxiliary, correlated pattern, usage (`standard`, `literary`, `dated`), and any construction/sense condition.

There is one preferred form per fully resolved target, not one answer for an entire wildcard result. Standard usage is preferred to literary/dated variants, then the requested French spelling preference applies. Dutch orthography is `both` because that distinction is French-specific. Identical strings may remain distinct across targets or meaningful pattern/condition identities; callers must not deduplicate solely by `text`.

`status` is `available`, `partiallyAvailable`, or `unavailable`. Every `unavailableTargets` record gives its target, reason (`impersonal`, `defective`, `noImperative`), explanation, and source. For example, a first-person present of `falloir` is unavailable, while its broad query is partially available.

Invalid requests and failed generation throw `ConjugationError`, with a stable `code`: `INVALID_REQUEST`, `UNSUPPORTED_LANGUAGE`, `INVALID_INFINITIVE`, `INVALID_TARGET`, `INVALID_HINT`, `AMBIGUOUS_CLASSIFICATION`, or `GENERATION_FAILURE`. An empty adapter result without an availability decision is a generation failure, not grammatical unavailability.

## Explanations

A pack built on the staged engine records, for every form, the rule applied at each step: `form.steps` (periphrasis, agreement and clause rules) and `part.steps` (the stem, ending and spelling rules of one word); `analysis.steps` holds the classification steps and `unavailableTarget.step` the availability rule. French and Dutch record no steps yet.

`explain(language, subject, locale)` turns those steps into text. The subject is a `ConjugatedForm`, an `UnavailableTarget` or a `VerbAnalysis`; the locale is `'en'` or `'nl'`. The result is `{ summary, sections }`. A form has one section per part that has steps (`part` is the part's index, `title` its text) followed by one with `part: null` for the form-level steps; an unavailable target and an analysis have one section with `part: null`; a subject without steps has none. Each step is `{ text, rule, stage, kind, before, after, citations }`, where each citation is `{ work, locator, url?, title }` and `title` is the cited work's title. `explain` throws `INVALID_REQUEST` for an unknown locale and `GENERATION_FAILURE` for a rule or term that has no text.

Text comes from message catalogs: `Record<string, string>` per locale, in the ICU subset described in `src/i18n/format.ts` (`{name}`, `plural`, `select`, `''` for an apostrophe; an apostrophe directly before a placeholder quotes it, so write `l''{noun}`). A rule's id is the key of its message, and the message may use the rule's declared params, `{before}` and `{after}` (empty when the step has none). A `mood` or `tense` param is rendered with the native label of the pack's catalogue entry (a tense is looked up in the form's own mood); a `person`, `number`, `gender`, `voice` or `case` param is the catalog message `term.<kind>.<id>`. Each locale's catalog is the core catalog (`src/i18n/locales/<locale>/core.ts`) merged with the messages of every language pack for that locale.

With an `en` catalog, a staged pack's `analysis.assumptions` are the English text of its assumption steps; without one they are rule ids.

A staged pack declares `rules` (the `defineRules` result), `works` (the grammars it cites, keyed by id) and `citations` (rule id to one citation or several, each `{ work, locator, url? }`). `tests/i18n/completeness.test.ts` checks every pack that declares rules: each rule has a well-formed message in every locale whose placeholders are declared params, `en` and `nl` have the same keys, every rule has a citation to a listed work, and every url is `https`.

The staged-pack authoring API is exported for language packs: `stagedEngine`, `validateGrammar`, `StagedGrammar`, `ClauseGrammar`, `Periphrasis`, `ChainElement`, `Cell`, `LexemeBase`, `Fork`, `Outcome`, `one`, `chain`, `combine`, `JunctureRule`, `defineRules`, `step` and `RuleInfo`.

## Components and rendering

Parts are generated before strings, not recovered by splitting them. Roles are `moodMarker`, `subject`, `reflexivePronoun`, `auxiliary`, `lexicalVerb`, `particle`, and `linker`. Each part carries underlying text, lexical lemma where applicable, its own grammatical features, onset (`vowel`, `consonant`, `muteH`, `aspiratedH`; Dutch uses only `vowel` and `consonant`), and joining style.

Underlying `je`, `que`, `se`, and `de` remain unelided. Auxiliary features identify the auxiliary's actual simple mood/tense; non-finite lexical features have no finite person. Dutch future perfect can contain both finite `zal` and final infinitive `hebben`.

`renderParts(language, parts, { bare? })` is pure. It recomputes joining and French elision from the replacement components but does not regenerate verbs or repair mismatches. Authentic recombinations deliberately render as `je fais`, `nous aime`, and `que tu faisons`. This enables a later exercise application without implementing distractor selection.

Bare projection removes subjects and French subjunctive `que`, while preserving auxiliaries, reflexives, gerund `en`, linkers, and detached particles.

## Builder

`conjugationOptions(language, infinitive)` returns a builder with the language-independent setters `.mood()`, `.tense()`, `.person()`, `.number()`, `.auxiliary()`, `.classHint()` and `.stems()`, plus methods installed from the language's pack: one per mood in its catalogue (`.indicative('perfect')`, `.subjunctive('present')`, `.participle('past')`; the tense argument is optional and clears any tense when omitted) and one per language-specific option (`.gender('feminine')`, `.pronoun('u')`; boolean options such as `.inversion()` default to `true`). A language only has the methods of its own moods and options, so Dutch has no `.gerund()` or `.gender()`. `.build()` returns the language-specific query after runtime validation; it has no independent conjugation logic.

Which keys a query may carry, and how each value is validated, is declared per language as an option schema on its pack (`pack.options`). Adding a language means writing its pack and schema; the validator and the builder need no changes.

Language-specific methods and mood-specific tense arguments are checked by TypeScript. The generic `.mood()`/`.tense()` setters and constraints added after a non-finite method are checked for their combined compatibility at `.build()`.

## CLI flags and exit codes

```text
conjugation-engine <fr|nl> <infinitive> [options]
```

Quote multiword reflexive infinitives, for example `conjugation-engine fr "se laver"`.

Common flags: `--mood`, `--tense`, `--person`, `--number`, `--json`, `--bare`, `--explain`, `--locale`, `--help`.

`--explain` prints, under each form line, one line per derivation step indented by four spaces: each part's steps in part order, then the form-level steps. A language that records no steps prints none. `--locale <en|nl>` (default `en`) chooses the language of those lines; an unknown locale is `INVALID_REQUEST`. With `--json`, `--explain` adds an `explanation` field to every form.

Every other flag is derived from the option schema of the registered language packs, so a new language needs no CLI changes. A flag is the kebab-case of an option field (`aspiratedH` becomes `--aspirated-h`); a boolean field accepts `--x` and `--no-x` (giving both is an error); `agreement` and `stems` fields take JSON; an enum field lists its allowed values. `--help` prints one section per language, headed by the pack's `label` (for example `Dutch (nl):`), with that language's flags and values. A flag the chosen language does not declare is rejected by the engine as `Unknown <language> option: <key>.`.

Flags by language today:

- French: `--stems '<JSON>'`, `--gender`, `--auxiliary`, `--class`, `--reflexive-object`, `--aspirated-h` / `--no-aspirated-h`, `--orthography`, `--agreement '<JSON>'`, `--preceding-direct-object '<JSON>'`, `--model`.
- Dutch: `--stems '<JSON>'`, `--auxiliary`, `--class`, `--pronoun`, `--inversion` / `--no-inversion`, `--reflexive` / `--no-reflexive`, `--separable-prefix`, `--inseparable-prefix`.

Flags map directly to API fields; the two short aliases are `--class` for `classHint` and `--orthography` for `preferredOrthography`. Plain single-target output is the preferred phrase; wildcard output includes native target labels and meaningful variant distinctions. Unavailable targets are displayed explicitly.

`--json` always returns the complete structured result, even with `--bare`. Invalid requests emit diagnostics only on stderr. Exit codes are **0** for available/partially available requests or help, **1** for invalid requests/classification or argument errors, **2** for internal generation failure, and **3** when no requested grammatical form is available.
