# Architecture

The engine conjugates by rule. A language is a **pack**: data (lexicon, endings, catalogue, citations, messages) and a
grammar written as small functions that record what they did. The core runs every pack the same way and owns
everything that is not a fact about one language: option validation, target expansion, synthesis, compound tenses,
deduplication, ranking, rendering and explanations. This page describes that machinery as the code has it today; the
contract a pack is written against, hook by hook, is in [pack-authoring.md](pack-authoring.md).

```text
src/
  index.ts            the package root: conjugate, explain, getCatalogue, equivalentTenses, ...
  core/               the pack contract, the staged engine, forks, derivation steps, periphrasis, clause, rendering
  i18n/               the ICU-subset formatter, explain(), and the message catalogs locales/{en,nl}/<language>.ts
  equivalence/        tense concepts, one tense map per language, pair overrides
  languages/<code>/   one pack per language (fr, nl, en, de, es, it, la)
  languages/shared/   mechanisms two or more packs share, with the data passed in (germanic.ts, romance.ts)
scripts/              corpus import and report, characterization snapshots (development only)
tests/                unit tests per pack, corpus, goldens, characterization, docs drift guards
```

## The stages

`conjugate(query)` validates the query against the pack's option schema, expands it into **targets** (mood, tense,
person, number, subject slot, voice; a wildcard is every target the catalogue has) and hands each target to the pack's
engine. Every built-in pack builds its engine with `stagedEngine(grammar)`, which runs the same stages for every
language:

```text
query ──► classify ──► lexeme(s) ─┬─► availability ──► (no form: an unavailable target, with its rule)
          (once per query;        │
           one lexeme per         └─► cellOf ─┬─► one word:  stem ──► ending ──► orthography
           paradigm)                          │
                                              └─► compound:  periphrasis (a recipe of auxiliary words, each
                                                             synthesised by stem ──► ending ──► orthography)
                                                                   │
                                  clause: subject gender ──► agreement ──► assemble (subject, pronouns, word order)
                                                                   │
                         core: deduplicate ──► rank within each target (first = preferred) ──► render text
```

- **classify** reads the infinitive and the pack's hints and returns one lexeme per paradigm of the verb (most verbs
  have one; a verb separable in one sense and inseparable in another has two, each tagged with its `pattern` and
  `condition`). Everything it guesses about a verb it does not know is recorded as an **assumption** step.
- **availability** is the only place a pack says a form does not exist (impersonal, defective, no imperative, no
  passive), with its rule and source. An available target that the later stages leave without a form is a
  `GENERATION_FAILURE`, never a silent gap.
- **stem, ending, orthography** build one word: the stem (from the lexicon or by rule), the ending, then the spelling
  rules that apply at the boundary between them. The core memoises a word per lexeme and cell, and takes the product
  of the outcomes of each stage, so two stems or two spellings give two forms.
- **periphrasis**: a compound tense is a recipe (`Periphrasis`): a chain of verbs and literal words, such as "the
  present of the perfect auxiliary, then the past participle". Its verbs are conjugated through the same pack, so the
  auxiliary's own steps come for free.
- **clause** decides the subject's gender where the form shows it, the agreement of an agreeing participle, and the
  order of the words: subject pronoun, reflexive or clitic pronoun, verbs, a separable particle at the end.
- **deduplicate, rank, render**: forms that come out identical are merged; within one target the pack's `rank` sorts
  them (most packs: standard before literary before dated, then the preferred spelling) and the first is `preferred`;
  the parts are rendered into `text` with the pack's sandhi (French elision).

### One form traced through the stages

`conjugate({ language: 'nl', infinitive: 'opzorpen', mood: 'indicative', tense: 'perfect', person: 1, number: 'singular' })`
returns `ik heb opgezorpt`. The verb is invented, so the analysis records what was assumed; each step below is the
English text `explain` gives for it (CLI: `node dist/cli.js nl opzorpen --mood indicative --tense perfect --person 1
--number singular --explain`).

```text
classify      (assumption) opzorpen is not in the lexicon and starts with the separable particle op, so it is
              conjugated as a separable verb; ...
              (assumption) An unlisted Dutch verb defaults to the weak native model.
              (assumption) Ordinary open/closed syllables are inferred; ...
              (assumption) An unlisted verb defaults to hebben; lexical meaning may require zijn.
availability  nothing to say: the target exists
periphrasis   Present perfect: the present tense of hebben + the past participle.
  heb         stem         Take -en off hebben: hebb-.
                           A word does not end in a double consonant, so hebb- becomes heb-.
              ending       1st person singular present: the stem alone, heb.
  opgezorpt   stem         Take -en off zorpen: zorp-.
              ending       Weak verb: in the past participle a t comes after the stem: zorpt.
              orthography  p is one of the sounds of 't kofschip (t, k, f, s, ch, p), so the ending starts with t: zorpt.
                           The past participle starts with ge-: gezorpt.
              clause       op is written together with the verb: gezorpt becomes opgezorpt.
clause        The subject is ik.
rank          one form for the target, so it is the preferred one
```

## The pack contract: where data ends and code begins

A pack (`LanguagePack`) gives the core its catalogue (moods, tenses, persons, subject slots, voices, native labels),
its option schema, its rendering (onset, sandhi), its `rank`, its rules, works and citations, and an `engine(query)`
factory. A staged pack's grammar (`StagedGrammar`) has one function per stage. The split inside a pack:

- **Data**: the lexicon (principal parts, irregular stems, lexical flags such as an auxiliary or a missing imperative),
  ending tables, side lists (verbs that look prefixed but are not, verbs that do not inherit from their base), the
  catalogue, the citations of every rule and the messages of every rule in English and Dutch.
- **Code**: the rules that turn the data into words (stem formation, endings, spelling, agreement, word order), each
  recording a step. A rule is code; whether a given verb is an exception to it is data.

Where two packs run literally the same mechanism with different data, it lives in `src/languages/shared/`:
`germanic.ts` (separable-particle placement and the paradigm fork, used by German and Dutch; the derivative splitter,
used by German) and `romance.ts` (the sound-preserving respelling of a stem's last consonant, a grapheme table per
language, used by French, Spanish and Italian). The rule ids, citations and messages stay in each pack.

## Derivation steps and `explain`

Every stage records `DerivationStep`s: the rule id, the stage, the kind (`rule`, `lexical`, `assumption`,
`unavailable`), the text before and after, and the rule's parameters. Steps attach where they belong: word steps on
each part (`part.steps`), form steps on the form (`form.steps`: periphrasis, agreement, clause), classification steps
and assumptions on the analysis, and the reason for a missing form on the unavailable target. A step is never a signal
between stages; a clause that must tell two words of one cell apart reads their **marks** instead.

`explain(language, subject, locale)` turns the steps of a form, an analysis or an unavailable target into sentences in
`en` or `nl`, each with its citations. The CLI prints them with `--explain`.

## Messages and the completeness gates

Messages live in `src/i18n/locales/<locale>/<language>.ts`, flat ICU-subset strings keyed by rule id; a tense or a
person in a message is a term resolved from the catalogue's native labels or the core terms. Two gates keep them
complete: TypeScript (`satisfies Record<RuleId, string>`), and `tests/i18n/completeness.test.ts`, which checks for
every registered pack that each rule has a well-formed message in both locales using only its declared parameters, that
both locales have the same keys, and that every rule has a citation to a listed work with an `https` URL.

## Subject slots and gender

A finite target is a **subject slot** (`1sg`, `3sg.f`, `2sg.u`, `2.formal`, ...): its person, number, pronoun, an
optional gender and register, and whether it belongs to a query that names no subject (`default`). Non-default slots
(Dutch u, German Sie, Spanish usted, English she) are returned only when asked for with `subject` or a pack option.

Gender is a target dimension. Where it changes the verb phrase it is returned without being asked for: French forks
the subject's gender form by form (`clause.subjectGenders`: il / elle, and je suis allé / allée where the participle
agrees); Italian carries it on its gendered subject slots (lui, lei: è andato, è andata); Latin declines the participle
of its compound forms in all three genders (amātus, amāta, amātum sum), with gendered slots on request. A query with
`gender` keeps one. Each form's `target.gender` and `target.agreement` say which it is.

## Variants, region and usage

Several forms of one target are **variants**, labelled on `form.variant`: `orthography` (French traditional and 1990
spellings; `both` when they agree), `pattern` (a named alternative or a paradigm), `usage` (`standard`, `literary`,
`dated`), `region` (English GB / US, the southern German sein-perfect) and `condition` (when a form applies: the
meaning that selects an auxiliary or a paradigm). Labels are tags on the outcomes of the stages, merged as outcomes
combine; incompatible tags (a rectified stem with a traditional auxiliary) drop the branch.

## The corpus tooling

The engine is checked against reference data it never imports at run time (`scripts/corpus/`, `tests/fixtures/`):

- **Fallible oracles.** The conjugation tables of a pinned third-party corpus are parsed into neutral fixtures (no
  source file names, encodings or site names) and treated as another engine's output: every cell must be generated,
  and where the corpus is wrong, the cell is corrected rather than skipped.
- **Corrections ledgers.** `scripts/corpus/corrections/<language>.ts` corrects cells, each with its reason and an
  authority URL; `tests/fixtures/corrections.json` is the result.
- **Remaps.** A page that prints the wrong heading over a whole table is remapped by heading, with a reason and source;
  every run of a remapped heading must be remapped or listed as deliberately left alone.
- **Unmodelled cells.** Cells the engine does not model at all (`scope: 'unmodelled'`, with a declared reason) are
  counted as their own partition and not compared.
- **The extra-forms guard.** For a language that opts in, a generated form beyond the expected ones must carry a
  variant tag, or be one its tests have reviewed and pinned.
- **Authority cells** (`tests/goldens/<language>/authority/`, Italian and Latin): exact expectations for what a grammar
  prints (model paradigms, irregular forms, principal parts), each file citing its section.
- **Second oracle** (`scripts/corpus/sources/wiktionary-*.ts`, Italian and Latin): Wiktionary tables at pinned page
  revisions, compared like the corpus, with their own corrections. Wiktionary text is CC BY-SA 4.0; the fixtures
  record the licence, the attribution and each page's title and revision.

`npm run corpus:check` runs the comparison and prints the accounting per language.

## The characterization net

French and Dutch existed before the staged core. Their old output is frozen in `tests/characterization/<language>.tsv.gz`
(written once, never regenerated) and `tests/characterization.test.ts` requires the current engine to reproduce it
exactly, apart from the intended differences in `tests/characterization/intended-diffs.json`, each with a reason and an
authority URL. The number of ledger entries is pinned, so a new difference is a reviewed decision.

## Tense equivalence

`equivalentTenses(from, to, tense)` answers which tense of `to` a trainer should ask for when it shows a tense of
`from`. Each language maps every catalogue tense to weighted links to a closed set of language-neutral concepts
(finiteness, mood, time, relative time, aspect, remoteness, polarity); the derivation compares two maps through those
concepts, relaxes a fixed ladder (remoteness, aspect, mood, register) when nothing matches, and applies the few pair
overrides. It reads no pack, so the `conjugation-engine/equivalence` subpath loads without them. Details:
[api.md](api.md#tense-equivalence) and section 11 of [pack-authoring.md](pack-authoring.md).

## Adding a language

Write the pack, its messages, citations, equivalence map, corpus language and tests, and register it in the handful
of shared files that list the languages. [pack-authoring.md](pack-authoring.md) is the step-by-step guide, with an
invented toy language that exercises every hook.
