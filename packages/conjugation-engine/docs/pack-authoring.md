# Writing a language pack

This is the reference for adding a language to the engine. It documents the contract as the code has it: every `ts signature` block is a declaration copied from the source file named after it, and every `ts toy` block is lifted from `tests/toy/pack.ts` (or its messages), the invented language `xx` that exercises every hook and is known to compile and pass. `tests/docs.test.ts` fails when either drifts. Read this guide, the toy pack and your language's plan, and you can write a pack.

Everything a pack is written with is exported from `conjugation-engine/core` (`src/core/index.ts`); inside this package, import the source files by path. The package root (`conjugation-engine`) is the consumer API (`conjugate`, `renderParts`, `getCatalogue`, ...), plus `createEngine`, `packs` and `locales` so a consumer can assemble an engine of its own.

A pack derives every form by recorded rules. A rule is a step (`rule`, `before`, `after`, params); the steps of a form are what `explain` turns into sentences, in English and Dutch, with citations. So a pack is three things that must agree: the grammar (code), the rules it records (ids, params, messages, citations) and the catalogue of what exists (moods, tenses, persons, voices).

## 1. The stages and their hooks

A language's grammar is a `StagedGrammar<X>` where `X` is the pack's lexeme type: an interface extending `LexemeBase` with whatever lexical data the pack needs (the toy's `ToyLexeme` adds `base`, `present`, `listedStems`, `hasParticiple`, `longPlural`, `deponent`). `stagedEngine(grammar, rendering, query)` turns it into the `LanguageEngine` a pack's `engine(query)` returns. For one query it runs `classify` once, then for each target builds the cell (a word) or the periphrasis (several words), orders the words with the clause grammar, and collects the steps.

```ts signature src/core/staged.ts
export interface StagedGrammar<X extends LexemeBase = LexemeBase> {
  classify(query: Readonly<Record<string, unknown>>): Fork<X>;
  lexemeOf(lemma: string): X;
  cellOf(target: ResolvedTarget, lexeme: X): Cell | null;
  availability(lexeme: X, target: ResolvedTarget): Unavailability | null;
  cell?(lexeme: X, cell: Cell): Fork<string> | null;
  stem(lexeme: X, cell: Cell): Fork<string>;
  ending(lexeme: X, cell: Cell, stem: string): Fork<string>;
  readonly orthography: readonly JunctureRule<{ readonly lexeme: X; readonly cell: Cell }>[];
  readonly periphrases: readonly Periphrasis<X>[];
  readonly clause: ClauseGrammar<X>;
}
```

The order for one target of one paradigm: `availability` (is there a form at all?), `cellOf` (is it one word, and which?), then per cell `cell` / `stem` -> `ending` -> `orthography`; for a periphrasis, the cells of its verbs the same way, then `clause.subjectGenders` (optional), `clause.agreements` and `clause.assemble`. The hook names below are checked against the toy grammar by `tests/docs.test.ts`.

A hook that has nothing to say returns `one(value)` (a one-outcome fork without steps), `null` where the type allows it, or `[]` where an empty fork is meaningful. An empty fork never means "this form does not exist" (see section 7).

### The types the hooks are written against

A target is what the engine asks a grammar to build. `mood` and `tense` are the pack's own ids (the registry's `Mood` and `Tense` once the pack is registered); `person` and `number` are `null` for a non-finite target; `gender` is the subject slot's gender in a pack with `genderedTargets`, otherwise `null`; `agreement` is `null` until `clause.agreements` has chosen one (it is set in `assemble`'s `target`); `voice` is present only for catalogue entries that have voices (active is `'active'` there); `subject` is the slot id, present only on finite targets of a pack with slots.

```ts signature src/types.ts
export interface ResolvedTarget {
  readonly mood: Mood;
  readonly tense: Tense;
  readonly person: Person | null;
  readonly number: GrammaticalNumber | null;
  readonly gender: Gender | null;
  readonly agreement: Agreement | null;
  readonly voice?: Voice | null;
  readonly subject?: string;
}
```

A lexeme is what `classify` produces for a verb and the hooks read. A pack's own lexeme type extends it.

```ts signature src/core/grammar.ts
export interface LexemeBase {
  readonly lemma: string;
  readonly verbId: string;
  readonly classId: string;
  readonly classSource: VerbAnalysis['classificationSource'];
  readonly reflexive: boolean;
  readonly auxiliaries: readonly string[];
  readonly particle: { readonly text: string; readonly separable: boolean } | null;
}
```

`lemma` is the infinitive as queried (after normalisation); `verbId` identifies the verb in results; `classId` is the conjugation class or model the verb follows (`analysis.classification`), and `classSource` says where that came from (`lexicon`, `regularRule` for a productive default, `explicitHint` for an option); `reflexive` marks a reflexive verb (the clause adds the pronoun); `auxiliaries` are the perfect auxiliaries in output order, which a periphrasis using `perfectAuxiliary` runs once for each; `particle` is a verbal particle that the clause places (`separable` says whether it splits off), or `null`.

The grammatical vocabulary that cells and agreements use:

```ts signature src/core/grammar.ts
export type Person = 1 | 2 | 3;
export type GrammaticalNumber = 'singular' | 'plural';
export type Gender = 'masculine' | 'feminine' | 'neuter';
export type Voice = 'active' | 'passive';
export type Case = 'nominative' | 'genitive' | 'dative' | 'accusative' | 'ablative' | 'vocative';
```
```ts signature src/core/grammar.ts
export interface Agreement {
  readonly gender: Gender;
  readonly number: GrammaticalNumber;
  readonly case?: Case;
}
```

### `classify`

```ts signature src/core/staged.ts
classify(query: Readonly<Record<string, unknown>>): Fork<X>;
```

Reads the parsed query (`query.infinitive`, and the pack's own hints such as `auxiliary` or a prefix), and returns one outcome per paradigm of the verb: its lexeme, the classification steps (including every `assumption`), and tags that mark the paradigm. Most lemmas have one paradigm; see section 5 for several. Throw a `ConjugationError` (`INVALID_INFINITIVE`, `INVALID_HINT`, `AMBIGUOUS_CLASSIFICATION`) for input the pack cannot conjugate; an empty fork is a GENERATION_FAILURE. Lexical hints are read here, never by the core. The toy's `classify`:

```ts toy
classify(query) {
  const lemma = String(query.infinitive);
  if (!/^\p{L}+a$/u.test(lemma)) throw new ConjugationError('INVALID_INFINITIVE', 'A toy infinitive is one word ending in -a.');
  return withAuxiliaryHint(lemma, withPrefixHint(lemma, paradigmsOf(lemma), query.prefix), query.auxiliary);
},
```

### `lexemeOf`

```ts signature src/core/staged.ts
lexemeOf(lemma: string): X;
```

The lexeme of a verb a periphrasis names by lemma (an auxiliary such as `haba`). It has one paradigm and no hints; the engine memoises it per engine. The toy passes its function straight in (`lexemeOf,`):

```ts toy
function lexemeOf(lemma: string, reading?: Reading): ToyLexeme {
  const listed = Object.hasOwn(lexicon, lemma);
  const entry: Entry = listed ? lexicon[lemma]! : {};
  const chosen = reading ?? entry.readings?.[0];
```

### `cellOf`

```ts signature src/core/staged.ts
cellOf(target: ResolvedTarget, lexeme: X): Cell | null;
```

Which simple cell the target maps to for this lexeme, or `null` when the target is periphrastic for it (a tense can be one word for one verb and a compound for another: a deponent's perfect). When it returns a cell, that cell builds the target and no periphrasis runs; when it returns `null`, the periphrases that match the target and apply to the lexeme build it, and none is a GENERATION_FAILURE. The engine also calls it for the finite elements of a periphrasis, with a voiceless target of the element's mood and tense (person, number and gender from the real target, no agreement) and the lexeme of the verb the element names; it then returns the active cell, or `null` if that mood and tense are periphrastic for that verb (periphrases never nest). A `nonFinite` chain element is not asked of `cellOf`: its cell is built directly from the element (section 6).

```ts signature src/core/staged.ts
export type Cell =
  | {
    readonly kind: 'finite'; readonly mood: string; readonly tense: string;
    readonly person: Person; readonly number: GrammaticalNumber; readonly voice?: Voice;
  }
  | { readonly kind: 'nonFinite'; readonly form: string; readonly agreement?: Agreement; readonly voice?: Voice };
```

A cell speaks the pack's own mood, tense and form ids. An absent `voice` means active: write `voice` only for a marked voice, so the cell of an active target and the cell a chain element asks for are one cell and share one synthesis. The toy's `cellOf`, end:

```ts toy
if (target.mood !== 'indicative' || !simple) return null;
// Active is the unmarked voice, so an active cell is the same cell a periphrasis asks for.
return {
kind: 'finite', mood: 'indicative', tense: target.tense, person: target.person, number: target.number,
...(target.voice === 'passive' ? { voice: 'passive' as const } : {}),
};
```

### `availability`

```ts signature src/core/staged.ts
availability(lexeme: X, target: ResolvedTarget): Unavailability | null;
```
```ts signature src/core/staged.ts
export interface Unavailability { readonly reason: UnavailableTarget['reason']; readonly step: DerivationStep; readonly source: string }
```

Why the target has no form for this lexeme, or `null`. The reason is `'impersonal' | 'defective' | 'noImperative' | 'noPassive'`; the step is a rule of kind `unavailable`, stage `availability`; `source` says where the grammar states it. This is the only way a pack declares that a form does not exist (section 7). It is asked once per paradigm: a target is unavailable only when every paradigm says so.

```ts toy
availability(lexeme, target) {
  const needsParticiple = target.tense === 'perfect' || (target.mood === 'participle' && target.tense === 'past');
  if (lexeme.hasParticiple || !needsParticiple) return null;
  return { reason: 'defective', step: step(toyRules['xx.avail.no-participle'], null, null), source: 'Toy grammar §4' };
},
```

### `cell`

```ts signature src/core/staged.ts
cell?(lexeme: X, cell: Cell): Fork<string> | null;
```

Optional whole-word override (suppletive verbs): the form of the cell as a lexical fact, or `null` to derive it by the stages. `[]` is no word at all, not a missing form. The toy's (its formal 3sg form is marked, see Marks in section 4):

```ts toy
cell(lexeme, cell) {
  if (!lexeme.present || cell.kind !== 'finite' || cell.mood !== 'indicative' || cell.tense !== 'present' || cell.voice === 'passive') return null;
  const word = itemAt(lexeme.present, slot(cell));
  const steps = [step(toyRules['xx.lex.present'], lexeme.lemma, word)];
  if (lexeme.formal === null || slot(cell) !== 2) return one(word, steps);
```

A cell that mixes listed words with derived ones (a listed alternative beside the regular form, a strong past beside a weak one) returns them all from `cell`, and takes the derived ones from the same stem → ending → orthography path the engine runs for a cell without listed words:

```ts signature src/core/staged.ts
export function deriveWords<X extends LexemeBase>(grammar: StagedGrammar<X>, lexeme: X, cell: Cell): Fork<string>
```

### `stem`

```ts signature src/core/staged.ts
stem(lexeme: X, cell: Cell): Fork<string>;
```

The stems of a cell; more than one outcome is more than one derivation (a listed stem beside the derived one; the engine removes duplicate forms). Record how the stem came about (`before` the lemma, `after` the stem).

```ts toy
stem(lexeme, cell) {
  const stem = lexeme.base.slice(0, -1);
  const derived = one(stem, [step(toyRules['xx.stem.drop-a'], lexeme.base, stem)]);
  const listed = cell.kind === 'finite' ? lexeme.listedStems[`${cell.person}.${cell.number}`] : undefined;
  return listed === undefined ? derived : [...derived, ...one(listed, [step(toyRules['xx.stem.listed'], lexeme.base, listed)])];
},
```

### `ending`

```ts signature src/core/staged.ts
ending(lexeme: X, cell: Cell, stem: string): Fork<string>;
```

The ending to add to one stem. Its steps record the stem and the stem plus ending (`before` = stem, `after` = stem + ending); `[]` drops that stem's branch. The toy's ending for the simple past:

```ts toy
if (cell.tense === 'simple_past') {
  const personal = itemAt(simplePastEndings, slot(cell));
  return one(personal, [step(toyRules['xx.end.simple-past'], stem, stem + personal, { ending: personal })]);
}
```

### `orthography`

```ts signature src/core/staged.ts
readonly orthography: readonly JunctureRule<{ readonly lexeme: X; readonly cell: Cell }>[];
```

Spelling rules applied, in order, at the stem/ending boundary (see `JunctureRule` in section 4). A rule that changes the written form records one step; a rule that returns two outcomes makes spelling variants, tagged (`orthography: 'traditional'` / `'rectified'`).

```ts toy
orthography: [cQu, phF],
```

### `periphrases`

```ts signature src/core/staged.ts
readonly periphrases: readonly Periphrasis<X>[];
```

The compound tenses, as recipes (section 6). A grammar with no compound tenses has `[]`.

```ts toy
periphrases,
```

### `clause.subjectGenders`

```ts signature src/core/clause.ts
subjectGenders?(context: ClauseContext<X>): Fork<Gender | null>;
```

Optional. The subject genders a form shows when its subject slot has none: French `il` / `elle` in the third person, and `je suis allé` / `je suis allée` where a participle agrees with a genderless subject. It runs for every target, finite or not, after the periphrasis step and before `agreements`; each outcome becomes the form's `target.gender` and the target `agreements` and `assemble` see, and its steps are form-level steps (so `explain` lists them with the form). A gender is a target dimension, not a variant: the outcomes are separate targets of one slot, each with its own preferred form. Without the hook the form keeps the target's own gender (the slot's, in a pack with `genderedTargets`), with no step, so a pack that does not define it is unaffected. Return `one(target.gender)` where nothing forks (an impersonal subject has no gender to show); an empty fork leaves the target without a form, a GENERATION_FAILURE naming the `subjectGenders` stage. Why not one slot per gender (`il`, `elle`): a target that is unavailable, or a form that does not show the gender, would then come twice. The toy forks its genderless `mi` in a perfect with esta:

```ts toy
subjectGenders({ target, auxiliary }) {
  if (target.subject !== '1sg' || auxiliary !== 'esta') return one(target.gender);
  return genders.flatMap(gender =>
    one(gender, [step(toyRules['xx.clause.subject-gender'], null, null, { gender: { term: 'gender', id: gender } })]));
},
```

### `clause.agreements`

```ts signature src/core/clause.ts
agreements(context: ClauseContext<X>): Fork<Agreement | null>;
```

For a target with agreeing cells (`context.agreeing` is not empty), the agreements to generate: a fork of `{ gender, number, case? }` (each outcome a separate form), with the rule that explains the choice. `one(null)` when nothing agrees. It is not called when `agreeing` is empty. Its `context.target` has the gender `subjectGenders` chose, which a participle that agrees with the subject follows.

```ts toy
agreements({ target, agreeing, auxiliary }) {
  // `agreeing` has the cells that would agree: the past participle of a compound tense or of the target itself, the
  // present participle or the infinitive of a simple non-finite target.
  const pastParticiple = agreeing.some(cell => cell.kind === 'nonFinite' && cell.form === 'participle');
  if (!pastParticiple || (auxiliary !== null && auxiliary !== 'esta')) return one(null);
  const number = target.number ?? 'singular';
  // A subject gender (from `subjectGenders`) decides the participle's; a target without one has both.
  return (target.gender === null ? genders : [target.gender]).flatMap(gender =>
    one({ gender, number }, [step(toyRules['xx.agree.gender'], null, null, { gender: { term: 'gender', id: gender } })]));
},
```

### `clause.assemble`

```ts signature src/core/clause.ts
assemble(words: readonly ChainWord[], context: ClauseContext<X>): Fork<readonly ConjugationPart[]>;
```

Orders the verb chain (given in recipe order) and adds the subject, clitics and particles, returning the parts of the form. Its outcome steps are clause-level steps of the form; each part carries its own word's steps, which `wordPart` copies. The toy's (it builds the verbs, places a separable particle, and adds the pronoun of the subject slot):

```ts toy
assemble(words, { lexeme, target, subject, rendering }) {
  const particle = lexeme.particle;
  const separated = particle !== null && particle.separable
    && words.some(word => word.role === 'lexicalVerb' && word.cell?.kind === 'finite');
  const verbs = words.map(word => {
    const features = word.cell?.kind === 'nonFinite' ? nonFiniteFeatures[word.cell.form] ?? {} : {};
    if (word.role !== 'lexicalVerb' || particle === null || separated) return wordPart(rendering, word, features);
    const attached = particle.text + word.text;
    const attachStep = step(toyRules['xx.clause.particle-attached'], word.text, attached, { particle: particle.text });
    return wordPart(rendering, { ...word, text: attached, steps: [...word.steps, attachStep] }, features);
  });
  const pronoun = target.mood === 'imperative' ? null : subject?.pronoun ?? null;
  const subjectParts = subject === null || pronoun === null ? [] : [grammaticalPart(
    rendering, 'subject', pronoun, null, { person: subject.person, number: subject.number, gender: subject.gender ?? null },
  )];
  if (!separated) return one([...subjectParts, ...verbs]);
```

## 2. File layout, registration, assembly and testing

A pack for language `de` lives in `src/languages/de/`:

| File | Holds |
|---|---|
| `spec.ts` | `GermanSpec extends LanguageSpec<GermanTenses>`: the tenses by mood, `nonFinite`, the `auxiliary`, `classHint`, `stems` and `subject` unions, and the `context` options. Its types are what `ConjugationOptions` is made of. |
| `catalogue.ts` | the `CatalogueEntry` list (moods, tenses, labels, persons, voices, slots) and the subject slots |
| `options.ts` | the option schema |
| `rendering.ts` | `PackRendering` (onset, sandhi, bareOmits) |
| `rules.ts` | `defineRules({...})`: every rule the pack records |
| `sources.ts` | the works and the citation of each rule |
| `lexicon.ts`, `stems.ts`, `paradigms.ts`, `orthography.ts`, `periphrasis.ts`, `clause.ts`, `classify.ts` | the grammar's parts, as large as the language needs |
| `grammar.ts` | the `StagedGrammar`, ending with `validateGrammar(grammar)` |
| `pack.ts` | the `LanguagePack` |

The messages live in `src/i18n/locales/en/de.ts` and `src/i18n/locales/nl/de.ts`; tests in `tests/de/`; the language's grammar notes in `docs/grammar/de.md`.

### The spec

The spec is the language's entry in the type-level registry. It extends `LanguageSpec<Tenses>`, naming its own tenses so that `nonFinite` is checked against them:

```ts signature src/core/spec.ts
export interface LanguageSpec<Tenses extends Record<string, string> = Record<string, string>> {
  tenses: Tenses;
  nonFinite: keyof Tenses & string;
  auxiliary: string;
  classHint: string;
  stems: object;
  subject: string;
  context: object;
}
```

`tenses` maps each mood to the union of its tense ids; `nonFinite` is the union of the moods without person and number, and every member must be a key of `tenses` (a spec that names a mood it does not have does not compile); `auxiliary`, `classHint` and `stems` are the types of the shared options (`never` for an option the language does not have, an object type for `stems`); `subject` is the union of the pack's subject slot ids, and `never` for a pack without slots (the `subject` option and `.subject()` builder method then do not type-check); `context` is an object type of every other option of the language, optional members (`{ readonly voice?: 'active' | 'passive' }`). `FrenchSpec` and `DutchSpec` (`src/languages/{fr,nl}/spec.ts`) are the worked examples.

### Registration

Registering a language is one line or one import in each of these shared files. Nothing else in `src/` knows the language list (the CLI help, the builder and the default engine are built from `packs`).

| File | What is added |
|---|---|
| `src/languages/registry.ts` | `import type { GermanSpec } from './de/spec.js';` and `de: GermanSpec;` in `LanguageRegistry`. This makes `Language`, `MoodFor<'de'>`, `ConjugationOptionsFor<'de'>` and the builder know the language. |
| `src/languages/index.ts` | `import { germanPack } from './de/pack.js';` and `de: germanPack` in `packs`, which is checked `satisfies { [L in Language]: LanguagePack<L> }` |
| `src/i18n/locales/en/index.ts`, `src/i18n/locales/nl/index.ts` | `import { de } from './de.js';` and `{ ...core, ...de }` in the catalog |
| `src/types.ts` | `export type { ... } from './languages/de/spec.js';` for the spec's public types, and `export type GermanConjugationOptions = ConjugationOptionsFor<'de'>;` beside the French and Dutch ones |
| `scripts/corpus/languages/index.ts` | the language's `CorpusLanguage` in the list, when it has corpus data (section 10) |
| `tests/corpus.test.ts` | its row in the `pinned` table (a language in the list but not in the table fails) |
| `tests/pack.test.ts`, `tests/options.test.ts`, `tests/cli.test.ts`, `tests/package.test.ts` | the assertions that pin the list of languages: `expect(languages).toEqual(['fr', 'nl'])`, the message `Language must be one of: fr, nl.` (`tests/pack.test.ts`, `tests/options.test.ts`, `tests/cli.test.ts`), and the registered language codes in the `./core` / root check of `tests/package.test.ts`. `grep -rn "Language must be one of\|'fr', 'nl'" tests` finds them. |
| `README.md`, `docs/api.md` | the list of languages the package conjugates |
| `src/equivalence/<code>.ts` | the language's total tense map (section 11), from its design's section 10 as reconciled in `docs/superpowers/plans/2026-11-24-seven-language-engine-04-equivalence.md` |
| `src/equivalence/index.ts` | `import { de } from './de.js';` and `de` in `maps`, which is checked `satisfies { readonly [L in Language]: LanguageMap<L> }`, so a registered language without a map does not compile; for a language whose catalogue has a passive voice, the code in `passiveLanguages` and its voiced tenses in `passiveTenses` |
| `src/i18n/locales/en/equivalence/<code>.ts`, `src/i18n/locales/nl/equivalence/<code>.ts` and their `index.ts` | the language's equivalence notes (`eq.<code>.*`, exported as `deNotes`); `import` and `...deNotes` in each `index.ts` |
| `tests/equivalence/expectations/<code>.ts` | the pinned lookups of the language (section 11) |
| `tests/equivalence/matrix.tsv` | regenerated with `npm run equivalence:matrix`, never edited by hand; read the diff |

`tests/i18n/completeness.test.ts` needs no edit for a new language: it runs over every registered pack, and it fails for a registered pack that declares no `rules`. Only its list of legacy packs (`fr`, the pack that has not started migrating to the staged engine) names languages, and a new pack is never added to it.

A registered pack's option schema is typed against its spec (section 3); the toy `xx` is not registered, so it uses the generic `OptionSchema`.

### Assembling the pack

The pack object ties the parts together. The contract:

```ts signature src/core/pack.ts
export interface LanguagePack<L extends string = string> {
  readonly language: L;
  readonly label: string;
  readonly catalogue: readonly CatalogueEntry[];
  readonly rendering: PackRendering;
  readonly options: OptionSchema<OptionFieldsFor<L>>;
  readonly subjects?: readonly SubjectSlot[];
  subjectsFor?(query: Readonly<Record<string, unknown>>): readonly SubjectSlot[];
  readonly genderedTargets?: boolean;
  acceptsTarget?(query: Readonly<Record<string, unknown>>, target: ResolvedTarget): boolean;
  acceptsForm?(query: Readonly<Record<string, unknown>>, form: GeneratedForm): boolean;
  rank(form: GeneratedForm, query: Readonly<Record<string, unknown>>): number;
  engine(query: Readonly<Record<string, unknown>>): LanguageEngine;
  readonly rules?: Readonly<Record<string, RuleInfo>>;
  readonly works?: Readonly<Record<string, Work>>;
  readonly citations?: Readonly<Record<string, Citation | readonly Citation[]>>;
  compareKey?(text: string): string;
}
```

For a staged pack, `engine` is `query => stagedEngine(grammar, rendering, query)`. The toy's:

```ts toy
export const toyPack: LanguagePack<'xx'> = {
  language: 'xx',
  label: 'Toy',
  catalogue: toyCatalogue,
  rendering: toyRendering,
  subjects: toySubjects,
  options: {
    fields: {
      voice: { kind: 'enum', values: ['active', 'passive'] },
      auxiliary: { kind: 'enum', values: ['haba', 'esta', 'epha'] },
      prefix: { kind: 'enum', values: ['separable', 'inseparable'] },
    },
  },
  rank: form => variantRank(form.variant, 'rectified'),
  engine: query => stagedEngine(toyGrammar, toyRendering, query),
  rules: toyRules,
  works: toyWorks,
  citations: toyCitations,
};
```

`language` is the code the pack is registered under (`createEngine` rejects a pack registered under another code); `label` is its English name in CLI help. `rules` is mandatory for a staged pack. Without it `explain` has nothing to resolve, assumptions and unavailability reasons stay rule ids instead of becoming sentences, and `tests/i18n/completeness.test.ts` does not check the pack's messages and citations at all: that gate skips a pack without `rules`, which is why it now fails for a registered pack that has none (only the legacy `fr` may). `works` and `citations` give every rule its source (section 8). `subjects` is omitted for a language without subject slots. `compareKey` is the key two spellings of an answer are compared by (`Engine.normalizeForComparison` and the root `normalizeForComparison` call it); without it a pack gets `plainComparisonKey`, which keeps accents. Latin's removes macrons.

### Testing a pack

Every pack is tested through `createEngine`, never through a resolver: build an engine over the pack and the catalogs, then `conjugate`, `expandTargets` and `explain` through it. This is exactly how the toy is tested:

```ts
import { createEngine } from '../../src/core/engine.js';
import { locales } from '../../src/i18n/locales/index.js';
import { en as toyEn, nl as toyNl } from '../toy/messages.js';
import { toyPack } from '../toy/pack.js';

const catalogs = { en: { ...locales.en, ...toyEn }, nl: { ...locales.nl, ...toyNl } };
const toy = createEngine({ xx: toyPack }, catalogs);
const forms = toy.conjugate({ language: 'xx', infinitive: 'placa', mood: 'indicative', tense: 'present', voice: 'active' }).forms;
```

### The characterization ledger

A language that existed before the staged core has a frozen snapshot of its old output: `tests/characterization/<language>.queries.json` (the queries) and `<language>.tsv.gz` (the complete output of `conjugate` for each, written once by `npm run characterize:write`, never regenerated and never edited). To inspect it: `gunzip -c tests/characterization/<language>.tsv.gz | less`. Each query is a block: the header line `# {query as JSON, keys sorted}`, then an `A` line (analysis), `F` lines (forms, in engine order) and `U` lines (unavailable targets), or a single `E` line with the error code. `tests/characterization.test.ts` requires the current engine to reproduce every block exactly, apart from the intended differences in `tests/characterization/intended-diffs.json`. Each entry has a `reason` of more than 30 characters, saying which approved change or which correction it records and why, and an `https://` `source` (the authority: e-ANS, the Leidraad, woordenlijst.org, ...). The file lists the line-level and block-level entries sorted by `query`, then the sentence-level entries sorted by the sentence they reword. An entry takes one of three forms:

- **Line-level**, for a block that changes in a few lines: `was` is the frozen line and `now` the line that replaces it; `was: null` adds `now` (after the line given in `after`, directly after the `A` line when `after` is `null`, at the end of the block when `after` is absent); `now: null` removes `was`. A reorder is a removal plus an insertion.

```json
{ "query": "# {\"infinitive\":\"zorpen\",\"language\":\"nl\"}", "was": "F\t...\tgezorpt\t...", "now": "F\t...\tgezorpd\t...", "reason": "...", "source": "https://..." }
```

- **Block-level**, for a block that changes throughout (most of its lines, or an `E` block that becomes a paradigm): the whole frozen block of `query` is superseded by the block with the same header in `tests/characterization/<language>.accepted.tsv.gz`, which has the line format and gzip of the frozen file.

```json
{ "query": "# {\"infinitive\":\"voorkomen\",\"language\":\"nl\"}", "block": true, "reason": "...", "source": "https://..." }
```

- **Sentence-level**, for one assumption sentence reworded or removed throughout the snapshot (a message that stopped being true): in the analysis (`A`) line of every block that lists the sentence `was` among its assumptions, it becomes `now`, or is removed when `now` is null. It is applied after the line-level entries of a block and never to an accepted block, so the new text must not depend on the verb (no `{before}`), and it must apply to at least one block. A sentence that disappears from only some blocks (because those verbs are now listed) is not a sentence-level change: give those blocks line-level entries for their `A` line.

```json
{ "sentence": { "was": "Old sentence.", "now": "New sentence." }, "reason": "...", "source": "https://..." }
```

After adding or removing a block-level entry, or after an intended change to the output of a query that has one, run `npm run characterize:accept`: it writes each language's accepted file from the current engine for exactly the block-level entries' queries (and removes the file of a language without any), so read the accepted blocks it wrote before you commit them. The test enforces: a query has one block-level entry or only line-level ones; every accepted block has exactly one block-level entry and every block-level entry an accepted block; every line-level and block-level entry is applied exactly once and every sentence-level entry at least once (an unused entry fails). The number of entries of each form is pinned (`LINE_ENTRY_COUNT`, `BLOCK_ENTRY_COUNT`, `SENTENCE_ENTRY_COUNT`); raise them in the commit that adds the entries. A language with no frozen snapshot has no ledger; its tests are its own.

## 3. Catalogue, subjects, options, rendering and rank

### The catalogue

```ts signature src/core/pack.ts
export interface CatalogueEntry {
  readonly mood: Mood; readonly tense: Tense; readonly moodLabel: string; readonly tenseLabel: string; readonly finite: boolean;
  readonly persons: readonly (readonly [Person, GrammaticalNumber])[];
  readonly voices?: readonly Voice[];
  readonly slots?: readonly string[];
}
```

An entry is a mood and tense with its native labels (these are what `explain` prints for a `mood` or `tense` term). A finite entry lists its `persons` (person and number slots in output order); a non-finite entry has none. `voices`, in output order, gives the entry a voice dimension (each slot becomes one target per voice, active first); a pack with voices declares a `voice` enum option to filter by. The helper builds entries:

```ts signature src/core/pack.ts
export function moodEntries(
  mood: Mood,
  moodLabel: string,
  persons: readonly (readonly [Person, GrammaticalNumber])[],
  tenses: readonly (readonly [Tense, string])[],
  options: { readonly slots?: readonly string[] } = {},
): CatalogueEntry[]
```

`allPersons` (singular 1-2-3, then plural 1-2-3) and `noPersons` are the usual `persons`. An entry is finite when it has persons or when it has `slots`; an entry with neither is non-finite (infinitive, participle, gerund...) and has no `slots` key. The toy:

```ts toy
...moodEntries('indicative', 'Indicative', allPersons, [['present', 'Present'], ['past', 'Past'], ['perfect', 'Perfect'], ['future', 'Future'], ['simple_past', 'Simple past']]).map(voiced),
```

`slots` lists the ids of the subject slots a finite entry has. They replace `persons` for expansion (`persons` is ignored when `slots` is present), so an entry with `slots` needs no persons: `moodEntries('imperative', 'Imperative', noPersons, [['present', 'Present']], { slots: ['2sg'] })` is a finite entry whose targets are exactly the listed slots, each at its own person and number. An entry known to be non-finite (`finite: false`) cannot have slots. `createEngine` rejects (INVALID_REQUEST, naming language, mood and tense) a non-finite entry that has `slots`, a finite entry whose `slots` is an empty array, and an entry that lists a slot the pack does not declare.

### Subject slots

```ts signature src/core/pack.ts
export interface SubjectSlot {
  readonly id: string;
  readonly person: Person;
  readonly number: GrammaticalNumber;
  readonly pronoun: string | null;
  readonly gender?: Gender;
  readonly register?: 'formal' | 'informal';
  readonly default: boolean;
}
```

A pack with `subjects` gets one target per selected slot and accepts the common `subject` option (a slot id). The verb agrees with the slot's `person` and `number`, which need not be what the subject addresses: the toy's formal `Vu` is a slot with person 3. `pronoun` is `null` for a pro-drop language's unmarked subject. `register` is data for the clause and the app; the core does not read it. The slot's `gender` becomes `target.gender` only when the pack sets `genderedTargets: true` (French, Italian, Latin: the verb phrase changes with it); otherwise it is for the clause to read through `ClauseContext.subject`. A slot without a gender can still show one form by form: `clause.subjectGenders` (section 1) forks it.

- `default`: the slot is part of a query that names no subject. Within one person and number, slots expand in the order of `pack.subjects`.
- `subjectsFor(query)` (optional): the slots to expand for this query, out of `subjects`; the person and number filters apply afterwards. The default is `defaultSubjectsFor(subjects, query)`: the slot the `subject` option names, else every default slot. Whatever order it returns, the core uses the pack's order, and a slot it returns that the pack did not declare is a GENERATION_FAILURE.
- `CatalogueEntry.slots`: described above. The German imperative lists `du`, `wir`, `ihr` and `Sie` and never the third-person plural slot that shares the person and number of `Sie`. The toy's imperative:

```ts toy
...moodEntries('imperative', 'Imperative', noPersons, [['present', 'Present']], { slots: ['2sg'] }),
```

- A slot id is unique, contains no `/` and is not a voice name (`active`, `passive`): it becomes a segment of the target key. `createEngine` rejects a pack that breaks this.
- With the `subject` option given, entries without persons (non-finite) are left out, as with `person` and `voice`. A target carries `subject` only in a pack with slots.

The toy declares:

```ts toy
{ id: '3sg.f', person: 3, number: 'singular', pronoun: 'ila', gender: 'feminine', default: false },
{ id: '2sg.formal', person: 3, number: 'singular', pronoun: 'Vu', register: 'formal', default: false },
```

### The option schema

The common keys (`language`, `infinitive`, `mood`, `tense`, `person`, `number`, and `subject` for a pack with slots) are validated by the core. The pack's own keys are its schema:

```ts signature src/core/options.ts
export interface OptionSchema<Fields extends string = string> {
  readonly fields: { readonly [K in Fields]: FieldSpec };
  check?(options: Readonly<Record<string, unknown>>): void;
}
```

`fields` are validated in declaration order; `check` runs after every field is valid and throws a `ConjugationError` for a combination (`INVALID_HINT`). An unknown key is `Unknown <language> option: <key>.`; options are cloned and `undefined` values dropped before the pack sees them. The `FieldSpec` kinds:

```ts signature src/core/options.ts
export type FieldSpec =
  | { readonly kind: 'enum'; readonly values: readonly (string | number | boolean)[] }
  | { readonly kind: 'boolean' }
  | { readonly kind: 'word'; readonly pattern: RegExp; readonly code: ConjugationErrorCode; readonly message: string }
  | { readonly kind: 'agreement'; readonly required: boolean; readonly genders: readonly Gender[]; readonly cases?: readonly Case[] }
  | { readonly kind: 'stems'; readonly words: readonly string[]; readonly enums: Readonly<Record<string, readonly unknown[]>> };
```

`enum` is one of `values`; `boolean` is `true` or `false`; `word` is a string matching `pattern` (anything else throws `code` with `message`; the value is NFC-normalised and lower-cased like the infinitive); `agreement` is `{ gender?, number? }` (plus `case?` when `cases` is given), `required` demanding gender and number; `stems` is an object of grammatical stem words and enums, no other keys. The toy:

```ts toy
voice: { kind: 'enum', values: ['active', 'passive'] },
auxiliary: { kind: 'enum', values: ['haba', 'esta', 'epha'] },
prefix: { kind: 'enum', values: ['separable', 'inseparable'] },
```

For a registered language the schema is typed against its spec: `LanguagePack<L>['options']` is `OptionSchema<OptionFieldsOf<LanguageRegistry[L]>>`, the union of the keys of the spec's `context` and `'auxiliary' | 'classHint' | 'stems'`:

```ts signature src/core/spec.ts
export type OptionFieldsOf<S extends LanguageSpec> = (keyof S['context'] & string) | 'auxiliary' | 'classHint' | 'stems';
```

A missing or an extra field is a compile error, so the options type and the validator cannot drift. The fields drive the CLI flags and the options builder too: the builder gets one method per mood and per field, and throws at construction (`INVALID_REQUEST`) when a field or mood is named like a builder method (`build`, `mood`, `tense`, `person`, `number`, `subject`...) or like another mood or field. The three shared fields keep the builder's own methods.

Other optional pack members: `acceptsTarget(query, target)` (a target filter from the pack's options, such as Dutch `pronoun`) and `acceptsForm(query, form)` (a form filter after generation, such as French `agreement`).

### Rendering and rank

```ts signature src/core/pack.ts
export interface PackRendering {
  onset(text: string, flags: Readonly<Record<string, boolean>>): Onset;
  sandhi(left: ConjugationPart, right: ConjugationPart): string | null;
  bareOmits(part: ConjugationPart): boolean;
}
```

`onset` classifies the first sound of `text` (`'vowel' | 'consonant' | 'muteH' | 'aspiratedH'`); `flags` are the pack's own phonological hints for the word (`wordPart` options `onsetFlags`; French reads `aspiratedH`), and a rendering ignores flags it does not know. `sandhi` is the text of `left` when it fuses with `right` (French elision: `je` + `aime` -> `j'`), or `null`; the renderer then joins without a space. `bareOmits` says which parts a bare form (`{ bare: true }`) drops besides subjects. The toy has none of these:

```ts toy
export const toyRendering: PackRendering = {
  onset: text => /^[aeiou]/u.test(text) ? 'vowel' : 'consonant',
  sandhi: () => null,
  bareOmits: () => false,
};
```

```ts signature src/core/pack.ts
rank(form: GeneratedForm, query: Readonly<Record<string, unknown>>): number;
```

The sort key within one target; lower sorts first, and the first form of a target is `preferred`. `variantRank(variant, preferred)` gives standard before literary before dated usage, then the preferred spelling first; most packs use it: `rank: form => variantRank(form.variant, 'rectified')`.

## 4. Rules, steps and forks

### Rules and steps

```ts signature src/core/derivation.ts
export function defineRules<const T extends Record<string, { stage: Stage; kind?: StepKind; params?: Record<string, ParamKind> }>>(
  defs: T,
): { readonly [K in keyof T & string]: RuleInfo & { readonly id: K } }
```
```ts signature src/core/derivation.ts
export function step(
  rule: RuleInfo,
  before: string | null,
  after: string | null,
  params: Readonly<Record<string, StepParam>> = {},
): DerivationStep
```

`defineRules` declares the pack's rules; the ids are the object keys, `kind` defaults to `'rule'` and `params` to `{}`. The result is what `pack.rules` is, and what `step` takes:

```ts signature src/core/derivation.ts
export type Stage = 'classify' | 'stem' | 'ending' | 'orthography' | 'periphrasis' | 'clause' | 'availability';
export type StepKind = 'rule' | 'lexical' | 'assumption' | 'unavailable';
export type TermKind = 'mood' | 'tense' | 'person' | 'number' | 'gender' | 'voice' | 'case';
export interface TermRef { readonly term: TermKind; readonly id: string }
export type StepParam = string | number | TermRef;
export type ParamKind = 'text' | 'number' | 'term';
```
```ts signature src/core/derivation.ts
export interface RuleInfo {
  readonly id: string;
  readonly stage: Stage;
  readonly kind: StepKind;
  readonly params: Readonly<Record<string, ParamKind>>;
}
```
```ts signature src/core/derivation.ts
export interface DerivationStep {
  readonly rule: string;
  readonly stage: Stage;
  readonly kind: StepKind;
  readonly before: string | null;
  readonly after: string | null;
  readonly params: Readonly<Record<string, StepParam>>;
}
```

A rule has the stage it belongs to and a kind: `rule` (a grammatical rule), `lexical` (a fact read from the lexicon), `assumption` (a guess the pack made, listed in `analysis.assumptions`) or `unavailable` (the reason a form does not exist). `params` name the extra values the message may use: `text` (a string), `number`, or `term` (a `TermRef`, a grammatical term whose label the catalog supplies). The toy's:

```ts toy
'xx.end.present': { stage: 'ending', params: { ending: 'text', person: 'term', number: 'term' } },
'xx.end.past': { stage: 'ending', params: { ending: 'text', tense: 'term' } },
```

`step(rule, before, after, params?)` builds a `DerivationStep`; it throws GENERATION_FAILURE when the params do not match the rule's declaration (missing, extra, or of the wrong kind). `before` and `after` are the texts the rule changed (`null` when the step is not about a change), and every message may use them as `{before}` and `{after}`. A term param is `{ term: 'person', id: '1' }`:

```ts toy
step(toyRules['xx.end.present'], stem + marker, stem + marker + personal, {
  ending: personal, person: { term: 'person', id: String(cell.person) }, number: { term: 'number', id: cell.number },
}),
```

A `mood` or `tense` term is labelled from the catalogue, a tense in the mood of the word the step belongs to (section 8); the other kinds are the core catalog's `term.<kind>.<id>` messages (person `1`-`3`, number, gender, voice, case).

### Forks and outcomes

```ts signature src/core/fork.ts
export interface Outcome<T> {
  readonly value: T;
  readonly steps: readonly DerivationStep[];
  readonly tags: VariantTags;
  readonly marks?: Marks;
}
```
```ts signature src/core/fork.ts
export type Fork<T> = readonly Outcome<T>[];
```
```ts signature src/core/fork.ts
export function one<T>(value: T, steps: readonly DerivationStep[] = [], tags: VariantTags = {}, marks: Marks = []): Fork<T>
```
```ts signature src/core/fork.ts
export function chain<A, B>(fork: Fork<A>, next: (value: A) => Fork<B>): Fork<B>
```
```ts signature src/core/fork.ts
export function combine<T extends readonly unknown[]>(forks: { [K in keyof T]: Fork<T[K]> }): Fork<T>
```

A `Fork` is every way a rule can come out; each outcome carries its value, the steps taken, its variant tags and its marks. `one(value, steps?, tags?, marks?)` is a single outcome. `chain(fork, next)` continues every outcome through `next`, concatenating steps and merging tags and marks; `combine([forkA, forkB])` is the product of forks in order. Branches whose tags conflict are dropped. More than one outcome in a hook's fork means more than one accepted form (variants), and the engine removes forms that come out identical.

### Marks

```ts signature src/core/fork.ts
export type Marks = readonly string[];
```
```ts signature src/core/fork.ts
export function mergeMarks(a: Marks | undefined, b: Marks | undefined): Marks
```

A cell sometimes has words that only some clauses use, and the cell cannot tell which clause it is in: the cell of an auxiliary is not given the subject, and a word-order option is the clause's. Dutch gives the 2nd person singular present a form after the verb (werk jij) and an extra formal form (u heeft). Such a cell returns every word and marks each one; the clause reads the marks on its words (`ChainWord.marks`) and returns `[]` for a combination that is not its own. Because the filter only removes combinations, the forms keep the order of the words. Marks are names the pack chooses. They merge as a set (both sides' marks, the first side's first, each once: `mergeMarks`), they move from the word's outcome into the `ChainWord`, and they never reach a form, its variant or its steps. Never use a step or a variant tag to signal the clause: a step is an explanation and a tag is part of the form. The toy marks esa's 3sg present, whose formal form esu is Vu's, and its clause keeps the word marked for its subject:

```ts toy
return [...one(word, steps, {}, ['informal']), ...one(lexeme.formal, [step(toyRules['xx.lex.formal'], lexeme.lemma, lexeme.formal)], {}, ['formal'])];
```
```ts toy
const unmarked = subject?.register === 'formal' ? 'informal' : 'formal';
if (words.some(word => word.marks?.includes(unmarked))) return [];
```

How to use marks, step by step:

1. Name the marks as constants the cell and the clause share (Dutch: `afterVerb = 'after-verb'`, `formal = 'formal'` and `spoken = 'spoken'` in `src/languages/nl/paradigms.ts`).
2. Set them where the word is made: the fourth argument of `one(value, steps, tags, marks)`, or `marks` on an `Outcome` you build yourself, in `cell`, `stem`, `ending` or a juncture rule. A word made by `deriveWords` or the engine's stem → ending → orthography carries the marks of every outcome it was made from (`chain`, `combine` and the juncture rules merge them with `mergeMarks`), so a mark set on an ending reaches the finished word.
3. Read them in `clause.assemble`, from `ChainWord.marks` of each word, and return `[]` for a combination the clause does not use, or set the variant condition a mark stands for (Dutch: the clause keeps the forms marked `after-verb` only after inversion with jij or je, the forms marked `formal` only for u, and labels the infinitive marked `spoken` with its condition: `src/languages/nl/clause.ts`).
4. Leave the steps alone: a marked word records the steps of the rules that made it, as any other word. A mark is never shown, never reaches a form, its variant or its explanation, and never replaces a step: if a learner should see why a word is used, that is a rule with a message.

An outcome without marks has no `marks` key, so existing deep-equal tests do not change. `tests/core/derivation.test.ts` (merging) and `tests/core/subjects.test.ts` (the toy's clause filtering by marks) show the behaviour.

### Variant tags

```ts signature src/core/fork.ts
interface TagValues {
  readonly orthography: 'rectified' | 'traditional';
  readonly pattern: string;
  readonly usage: FormVariant['usage'];
  readonly region: string;
  readonly condition: string;
}
```
```ts signature src/core/fork.ts
export type VariantTags = { readonly [K in keyof TagValues]?: TagValues[K] };
```
```ts signature src/core/fork.ts
export function mergeTags(a: VariantTags, b: VariantTags): VariantTags | null
```

Tags label a variant and end up on the form as `variant.orthography`, `.pattern`, `.usage`, `.condition` and `.region` (`orthography` is `'both'` when no tag names one). They merge when outcomes combine, in two kinds:

- Constraints, `orthography` (`'rectified' | 'traditional'`) and `region` (a string): two different values cannot combine and the branch is dropped. This is how a rectified spelling of the stem is never joined with a traditional spelling of the auxiliary.
- Labels: `pattern` labels join with `.` (each once, in order), `condition` labels join with `; `, and `usage` (`'standard' | 'literary' | 'dated'`) is the most marked one (`usageRank`: standard 0, literary 1, dated 2).

A pattern label is non-empty and contains no `.`; a condition label is non-empty. The toy marks a literary variant:

```ts toy
return [...regular, ...one('amusse', [step(toyRules['xx.end.long'], stem, `${stem}amusse`, { ending: 'amusse' })], { usage: 'literary', pattern: 'long' })];
```

### Juncture rules

```ts signature src/core/juncture.ts
export interface Juncture { readonly stem: string; readonly ending: string }
```
```ts signature src/core/juncture.ts
export interface JunctureRule<C> {
  readonly info: RuleInfo;
  apply(juncture: Juncture, context: C): Fork<Juncture> | null;
  describe?(before: Juncture, after: Juncture, context: C): Readonly<Record<string, StepParam>>;
}
```
```ts signature src/core/juncture.ts
export function applyJunctureRules<C>(rules: readonly JunctureRule<C>[], start: Juncture, context: C): Fork<Juncture>
```

A spelling rule sees the stem and ending that meet. `apply` returns `null` when the rule does not apply, one outcome for a change, several outcomes (tagged) for spelling variants. `describe` returns the step's params. The engine applies the rules in order to every live branch and records one step per rule that changed `stem + ending`; a rule that changes nothing records none. The toy's:

```ts toy
const cQu: JunctureRule<SpellingContext> = {
  info: toyRules['xx.orth.c-qu'],
  apply: j => j.stem.endsWith('c') && j.ending.startsWith('e') ? one({ stem: `${j.stem.slice(0, -1)}qu`, ending: j.ending }) : null,
  describe: (_, after) => ({ vowel: after.ending.charAt(0) }),
};
```

## 5. Several paradigms of one lemma

A lemma can have more than one complete conjugation (a verb separable in one sense and inseparable in another; a verb with two auxiliaries and two meanings). `classify` returns one outcome per paradigm, in output order. Each outcome has its own lexeme, its own classification steps (and assumptions), and tags that mark it: `pattern` names the paradigm and `condition` says when it applies. The tags merge into every form of that paradigm, so the forms carry `variant.pattern` and `variant.condition`. Paradigms never share auxiliaries, participles or a particle: every form comes from one paradigm's lexeme, and the forms of a target come paradigm by paradigm.

The toy's `apvena`:

```ts toy
return readings.map(reading => {
  const lexeme = lexemeOf(lemma, reading);
  const rule = reading.separable ? toyRules['xx.classify.separable'] : toyRules['xx.classify.inseparable'];
  return {
    value: lexeme,
    steps: [...classification(lexeme), step(rule, lemma, null, { particle: lexeme.particle!.text })],
    tags: { pattern: reading.separable ? 'separable' : 'inseparable', condition: reading.condition },
  };
});
```

The analysis of a lemma with several paradigms is the first paradigm's, with the others in `analysis.alternatives` (each without alternatives of its own); each paradigm's analysis also has its `pattern` and `condition` when it is tagged with them (the staged engine fills them only when the lemma has several paradigms; a hint that leaves one paradigm gives an analysis without them, although the forms stay tagged). `explain` of an analysis has one section per paradigm, titled with the pattern label (section 8). A target that is available but comes back empty in one paradigm is a GENERATION_FAILURE naming the paradigm; a target is unavailable only when every paradigm's `availability` says so.

Lexical hints are read in `classify` and narrow the outcomes: the toy's `prefix` option keeps the paradigms whose particle is of the kind it names, and its `auxiliary` option keeps the paradigms that take that auxiliary and narrows each to it; a hint that leaves no paradigm is an `INVALID_HINT`:

```ts toy
const kept = paradigms.filter(({ value: { particle } }) => particle !== null && particle.separable === (hint === 'separable'));
if (!kept.length) throw new ConjugationError('INVALID_HINT', `${lemma} has no ${String(hint)} particle.`);
return kept;
```

## 6. Compound tenses

### Periphrasis

```ts signature src/core/periphrasis.ts
export type VerbRef = 'main' | 'perfectAuxiliary' | { readonly lemma: string };
export type ChainElement =
  | { readonly verb: VerbRef; readonly finite: { readonly mood: string; readonly tense: string } }
  | { readonly verb: VerbRef; readonly nonFinite: string; readonly agree?: true }
  | { readonly word: string; readonly role: 'linker' | 'particle' | 'moodMarker' };
export interface Periphrasis<X extends LexemeBase = LexemeBase> {
  readonly mood: string;
  readonly tense: string;
  readonly voice?: Voice;
  readonly applies?: (lexeme: X) => boolean;
  readonly rule: RuleInfo;
  readonly chain: readonly ChainElement[];
  readonly pattern?: string;
  readonly usage?: FormVariant['usage'];
  readonly reports?: VerbRef;
}
```

A compound tense is a recipe: the `chain` lists its words in order. A verb element names a simple cell of the same grammar: `finite` is a mood and tense (person and number come from the target; the mood may differ from the target's, as the toy's conditional uses the indicative past), `nonFinite` is a non-finite form (`'participle'`, `'infinitive'`, ... the pack's form ids as `cellOf` and `ending` know them). Periphrases never nest: a finite element must be a simple cell for the verb it names (`cellOf` returning `null` there is a GENERATION_FAILURE). A `word` element is literal text.

- `verb`: `'main'` is the queried verb (in the paradigm being built), `'perfectAuxiliary'` its perfect auxiliary (the recipe runs once per entry of `lexeme.auxiliaries`), `{ lemma }` a verb named outright (conjugated through `lexemeOf`). The `'main'` verb's word gets the role `lexicalVerb`; any other verb reference (`perfectAuxiliary` or a named lemma) gets the role `auxiliary`.
- `finite`: the engine asks `cellOf` for the active cell of that mood and tense for the verb the element names. `nonFinite`: the element's cell is built directly from it, `{ kind: 'nonFinite', form, agreement? }` with no voice (the agreement is added when the element is `agree` and the clause has chosen one); `cellOf` is not consulted.
- `agree: true`: the element takes the agreement `clause.agreements` chooses.
- `voice`: matched exactly. A periphrasis without `voice` builds only targets without a voice, so a pack whose catalogue has voices writes `voice: 'active'` on its active compound tenses (the toy's perfect does).
- `applies(lexeme)`: whether the recipe builds the target for the verb being conjugated (never an auxiliary the chain names): a deponent verb's perfect is a compound where an ordinary verb's is one word. Absent: every verb. A target the verb's `cellOf` already maps to a cell is built from that cell, and no periphrasis runs for it.
- `rule`: of stage `periphrasis`. It declares exactly one text param `auxiliary` when the chain uses `perfectAuxiliary` and no params otherwise; `validateGrammar` checks this.
- `pattern`, `usage`: the tags of the forms this recipe builds. Several recipes for one target are named variants.
- `reports`: see below.

`validateGrammar(grammar)` checks the declarations once (the rule's stage and params, at least one verb in the chain, `reports` a perfect auxiliary only if the chain uses one); `stagedEngine` runs it the first time it sees a grammar, and a pack calls it at module load to fail early:

```ts signature src/core/staged.ts
export function validateGrammar<X extends LexemeBase>(grammar: StagedGrammar<X>): void
```

The toy:

```ts toy
{
  mood: 'indicative', tense: 'perfect', voice: 'active', rule: toyRules['xx.periphrasis.perfect'],
  chain: [{ verb: 'perfectAuxiliary', finite: present }, agreeingParticiple],
},
{
  // Only a deponent verb: an ordinary verb's simple past is a cell.
  mood: 'indicative', tense: 'simple_past', rule: toyRules['xx.periphrasis.deponent-past'], applies: lexeme => lexeme.deponent,
  chain: [{ verb: { lemma: 'esta' }, finite: present }, agreeingParticiple],
},
```

### What `variant.auxiliary` reports

A form's `variant.auxiliary` is the verb it reports: by default the perfect auxiliary when the chain uses one, otherwise the first verb the chain names by lemma, otherwise `null`. `reports` overrides it: a `VerbRef` (`'main'` for none). A simple cell reports none.

### The clause context

```ts signature src/core/clause.ts
export interface ClauseContext<X extends LexemeBase> {
  readonly query: Readonly<Record<string, unknown>>;
  readonly lexeme: X;
  readonly target: ResolvedTarget;
  readonly subject: SubjectSlot | null;
  readonly agreeing: readonly Cell[];
  readonly auxiliary: string | null;
  readonly rendering: PackRendering;
}
```

`query` is the parsed query; `lexeme` the queried verb in the paradigm being built; `target` the target being built (in `agreements` and `assemble`, with the gender `subjectGenders` chose for this form in `target.gender`, and in `assemble` with the `agreement` chosen for it in `target.agreement`); `subject` the slot `target.subject` names, with its pronoun and its gender even where the target has none (`null` without slots); `agreeing` the cells that take the agreement: for a periphrasis the cells of its `agree` elements, for a simple non-finite target its own cell, empty otherwise (the cells carry no agreement yet, also in `assemble`); `auxiliary` the perfect auxiliary this run uses, or `null`; `rendering` the pack's rendering, for building parts.

### Words and parts

`assemble` receives the chain as `ChainWord`s:

```ts signature src/core/clause.ts
export interface ChainWord {
  readonly role: 'auxiliary' | 'lexicalVerb' | 'linker' | 'particle' | 'moodMarker';
  readonly text: string;
  readonly lemma: string | null;
  readonly cell: Cell | null;
  readonly steps: readonly DerivationStep[];
  readonly marks?: Marks;
  readonly voice?: Voice;
}
```

`cell` and `lemma` are `null` for literal words; `steps` are the word's own (stem, ending, spelling); `marks` are the marks of the outcome the word was synthesised as (section 4). `voice` is set by the engine on the verb words of a periphrasis that declares a marked voice. `wordPart` builds the part of a word:

```ts signature src/core/clause.ts
export function wordPart(rendering: PackRendering, word: ChainWord, features?: Partial<PartFeatures>, options?: WordPartOptions): ConjugationPart;
export function wordPart(rendering: PackRendering, word: ChainWord, options: WordPartOptions): ConjugationPart;
```
```ts signature src/core/clause.ts
export interface WordPartOptions {
  readonly joinBefore?: ConjugationPart['joinBefore'];
  readonly onsetFlags?: Readonly<Record<string, boolean>>;
}
```

The part carries the word's steps. Its features come from its cell (person, number, mood, tense, `verbForm: 'finite'` for a finite cell; agreement gender, number and case for a non-finite one), and `features` adds or overrides them: a non-finite word's mood, tense and `verbForm` are the pack's to name (the toy's `nonFiniteFeatures`), and so are `aspect` and a gerund's, gerundive's or supine's `verbForm`. A pack with no features to add passes the options as the third argument, `wordPart(rendering, word, { joinBefore: 'hyphen' })`; the two objects are told apart by their keys (`joinBefore`, `onsetFlags`), and an object that mixes them is a GENERATION_FAILURE. `joinBefore` is `'space'` (default), `'hyphen'` or `'attached'`; `onsetFlags` is what `rendering.onset` is asked with (default `{ aspiratedH: false }`). For parts that belong to no chain word (a subject pronoun, a literal particle) use `grammaticalPart`:

```ts signature src/parts.ts
export function grammaticalPart(
  rendering: PackRendering,
  role: PartRole,
  text: string,
  lemma: string | null = null,
  features: Partial<PartFeatures> = {},
  joinBefore: ConjugationPart['joinBefore'] = 'space',
  aspiratedH = false,
  onsetFlags?: Readonly<Record<string, boolean>>,
): ConjugationPart
```

The part and its features:

```ts signature src/types.ts
export type PartRole = 'moodMarker' | 'subject' | 'reflexivePronoun' | 'auxiliary' | 'lexicalVerb' | 'particle' | 'linker';
export type VerbForm =
  | 'finite' | 'infinitive' | 'presentParticiple' | 'pastParticiple' | 'gerund' | 'gerundive' | 'supine' | 'futureParticiple';
export type Onset = 'vowel' | 'consonant' | 'muteH' | 'aspiratedH';
```
```ts signature src/types.ts
export interface PartFeatures {
  readonly mood: Mood | null;
  readonly tense: Tense | null;
  readonly person: Person | null;
  readonly number: GrammaticalNumber | null;
  readonly gender: Gender | null;
  readonly verbForm: VerbForm | null;
  readonly voice?: Voice | null;
  readonly case?: Case | null;
  readonly aspect?: 'progressive' | null;
}
```
```ts signature src/types.ts
export interface ConjugationPart {
  readonly role: PartRole;
  readonly text: string;
  readonly lemma: string | null;
  readonly features: PartFeatures;
  readonly phonology: { readonly onset: Onset };
  readonly joinBefore: 'space' | 'hyphen' | 'attached';
  readonly steps?: readonly DerivationStep[];
}
```

`PartRole`: `subject` is the pronoun the clause adds; `moodMarker` a word that marks the mood (French subjunctive `que`, a Latin `ut`); `reflexivePronoun` the reflexive pronoun of a reflexive verb; `auxiliary` any verb of a chain other than the queried one; `lexicalVerb` the queried verb; `particle` a detached verbal particle (a separable prefix at the end of the clause); `linker` a literal word between verbs (`a`, `en`, `to`). `VerbForm`, the `verbForm` feature: `finite` for a conjugated word; `infinitive`; `presentParticiple` and `pastParticiple` for the participles; `gerund` for a language's gerund (French gérondif, Spanish and Italian gerundio, English `-ing` form used as one); and the Latin forms `gerundive`, `supine` and `futureParticiple`. `Onset` is what `rendering.onset` returns. `phonology.onset` of a part is the `onset` of its text.

Part features: `mood`, `tense`, `person`, `number`, `gender`, `verbForm`, and optional `voice`, `case` and `aspect: 'progressive'`. The `voice` of a part is the voice of the construction it belongs to: for a simple target the cell's voice; for a periphrasis that declares a marked `voice`, every verb part of the chain. Active is never written: it is the absence of the field, whether the grammar wrote `voice: 'active'` or left it out. A literal word of a periphrasis and a subject pronoun have none. A `case` is the case of a declined word (a Latin participle), from its agreement.

## 7. Availability

`availability` is the only way a pack declares that a form does not exist. Return an `Unavailability` (reason, the rule's step, a source) and the target is reported in `result.unavailableTargets`, with the explanation in English when the engine has an English catalog. An empty fork from any other hook (`stem`, `ending`, `cell`, `orthography`, `agreements`, `assemble`), or a periphrasis that does not run, for a target that `availability` did not exclude, is a GENERATION_FAILURE that names the target, the lemma and the stage that came back empty: the engine treats it as a pack bug, not as a gap in the language. The reasons are `'impersonal'` (a verb used only in the third person singular), `'defective'` (a verb lacking this form), `'noImperative'` and `'noPassive'` (the language or verb has none). Cite unavailability like any rule: the step's rule is `kind: 'unavailable'`, stage `availability`, with a message and a citation (section 8); the `source` string is a short human reference. An assumption rule, by contrast, is a guess the pack makes about a verb it does not know (`kind: 'assumption'`, stage `classify`).

## 8. Messages and citations

Every rule has a message in each locale (`en` and `nl`), whose key is the rule id. The pack's messages are an object per locale, merged into the locale catalog in `src/i18n/locales/<locale>/index.ts`. The toy types them `satisfies Record<keyof typeof toyRules, string>` so a rule without a message (or a message without a rule) is a compile error. A message is written for a learner: one sentence, naming the forms involved with `{before}` and `{after}` and the rule's params, with no jargon.

```ts toy
'xx.end.present': 'Present, {person} {number}: add -{ending}.',
'xx.end.past': '{tense}: add -{ending} to {before}-.',
```

The text is the ICU subset of `src/i18n/format.ts`: literal text, `{name}`, `{n, plural, =0 {...} one {...} other {...}}` with `#` for the number (exact matches `=N` and the categories `zero`, `one`, `two`, `few`, `many`, `other`), `{x, select, a {...} other {...}}`, and nesting; `other` is required. Anything else is a SyntaxError that the completeness gate reports: the `number`, `date` and `selectordinal` argument types and plural offsets are not supported. An apostrophe directly before `{` quotes it, so write `''` (`l''{noun}`); the completeness gate fails a single one.

Terms: a `person`, `number`, `gender`, `voice` or `case` param is the core catalog's `term.<kind>.<id>` message. A `mood` or `tense` param is the catalogue's native label, and a tense is looked up in the mood of what the step describes: for a word's steps, the word's own mood (`part.features.mood`, which is why `assemble` must set it on every word whose steps name a tense, as `wordPart` does for a finite cell and `features` does for a non-finite one); for form-level steps and an unavailable target, the target's mood; an auxiliary in the indicative past inside a conditional is labelled as an indicative past. Assumption steps have no target, so an assumption rule takes no `tense` param (a `mood` term is fine).

Pattern labels: where `explain` shows a paradigm's pattern (the title of a paradigm of an analysis with several), the catalog message `<language>.label.pattern.<label>` is used when it exists, and the raw label otherwise. The key is looked up on the whole pattern string of the paradigm: a pattern joined across stages (`a.b`) is shown raw unless the pack defines a key for the joined string (`xx.label.pattern.a.b`). The completeness gate does not require these keys, but a key defined in `en` must be defined in `nl` (the gate compares the key sets of the locales):

```ts toy
'xx.label.pattern.separable': 'separable particle',
```

Citations: a pack lists the works it cites once in `works` (keyed by `Work.id`) and cites each rule in `citations` (rule id to one `Citation` or several):

```ts signature src/core/sources.ts
export interface Work {
  readonly id: string;
  readonly title: string;
  readonly author?: string;
  readonly year?: number;
  readonly url?: `https://${string}`;
}
```
```ts signature src/core/sources.ts
export interface Citation {
  readonly work: string;
  readonly locator: string;
  readonly url?: `https://${string}`;
}
```

```ts toy
const grammarCitation = (locator: string): Citation => ({ work: 'toy', locator });
```

`tests/i18n/completeness.test.ts` is the gate every pack with rules passes: each rule id starts with `<language>.` (`core.` is the core's); no two packs, and no pack and the core, define the same key; every rule has a well-formed message in every locale (it parses, formats, uses only the rule's params and `before` / `after`, treats a number param as a number, has no apostrophe directly before a placeholder); `en` and `nl` define the same keys; every rule has a citation to a listed work; every work and citation url is `https`; and every registered pack declares `rules`, except the legacy `fr`.

## 9. The rules a pack must follow

1. A pack declares "no form" only through `availability`. An empty fork for an available target is a GENERATION_FAILURE.
2. Every rule id starts with the pack's language code and a dot (`de.stem.umlaut`); `core.` is reserved. The second segment names the stage or kind by convention, as in the toy: `classify`, `assume` (assumptions), `avail` (availability), `lex` (whole-word lexical cells), `stem`, `end` (endings), `orth` (spelling), `periphrasis`, `agree`, `clause`; only the prefix is checked.
3. A rule may not declare params named `before` or `after`; `defineRules` throws.
4. An assumption rule takes no `tense` term param (assumptions have no target to look the mood up in).
5. Variant labels are non-empty, and a `pattern` label contains no `.`, because pattern labels from different stages are joined with `.`.
6. `clause.assemble` sets `features.mood` on every word whose steps name a tense: explanations resolve a word's tense label in that word's own mood.
7. Slot ids are unique within the pack, are not a voice name (`active`, `passive`) and contain no `/`.
8. In messages, an apostrophe directly before `{` is doubled (`''`).
9. A periphrasis whose chain uses `perfectAuxiliary` has a rule with exactly one text param `auxiliary`; one that does not has a rule with no params.
10. A periphrasis built on a named auxiliary reports that auxiliary as `variant.auxiliary` unless it declares `reports`.
11. A cell speaks the pack's own ids; an active cell has no `voice`; an active periphrasis in a pack with voices says `voice: 'active'`.
12. Nothing under `src/` imports `node:*` (except `src/cli.ts`), `scripts/` or `tests/`, and the engine has no runtime dependencies. The characterization snapshots stay green except for entries in `tests/characterization/intended-diffs.json`, line-level or block-level, each with its reason and source (section 2, "The characterization ledger").
13. A staged pack declares `rules`, `works` and `citations`.
14. A step explains what a rule did to this form, and only that: a rule that changed nothing records no step, and a step is never a signal for another stage. A clause that must tell words of one cell apart reads their marks (section 4), never their steps or variant tags. One named exception: a spelling rule that decides *against* a change the learner would expect (Spanish *guio* takes no tilde because it is one syllable; *agrio* is the accepted form without the hiatus tilde) may record its step on the unchanged word. It does so by putting the step in the outcome it returns (`one(juncture, [step(...)])`), which the runner keeps although the text did not change; it never does so to signal another stage.

## 10. Corpus

The corpus is the reference data a pack's output is checked against: a table of conjugations per language, parsed from a pinned source into checked-in fixtures (`tests/fixtures/`), with corrections that cite authoritative sources, and a test (`tests/corpus.test.ts`) that compares every cell with the engine. The corpus section of `docs/grammar.md` ("Corpus provenance and refresh") has the pin, the reproduction steps, the accounting rules and the exact comparison rule. To add a language `xx` that is registered in `src/languages/registry.ts`:

1. `scripts/corpus/parsers/xx.ts`: `parseXx(html, name)` returns the language's cells with `corpusCell({ mood, tense, original, index, ... })` (cheerio, `normalizeText`, `alternatives` from `../model.ts`). Set `subject` (the slot id) on every finite cell of a language with slots, `voice` where the page has voices, `variant` for a page-labelled variant, `heading` on cells a remap corrects, `scope: 'unmodelled'` with a `reason` for cells the engine does not model, and `expected` when the page's rows are not in `a/b` notation. Throw on any missing, repeated or unaccounted section.
2. `scripts/corpus/corrections/xx.ts`: corrections through `startCorrection(...)`; every reason has an `https://` source and more than 30 characters.
3. `scripts/corpus/languages/xx.ts`: a `CorpusLanguage` with `language`, `directory`, `encoding`, `expectedFiles`, `cellsPerFile`, `parse`, `correction`, `context(name)` (neutral infinitive, gender, auxiliary and a `pattern`, `'default'` for an ordinary file), optional `remaps` (a correction of mood and tense, and where needed person, number, subject and voice, for the cells of the nth run (or `'all'` runs) under a page heading, with reason and `https://` source; every other run of a remapped heading must be listed in `unremapped`), `unmodelled` (reason codes; those cells are counted as their own partition and not compared) and `requireTaggedExtras` (extra generated forms in the resolved target of an expected form must carry a variant tag), `query(file)` (labelled queries `{ label, options }` that together cover every modelled cell) and `applicable(file, cell, forms, label)` (which of a query's forms answer a cell; language special cases live here, never in the test).
4. Add it to `scripts/corpus/languages/index.ts` and its row to the `pinned` table of `tests/corpus.test.ts`.
5. `npm run corpus:import -- --source <pinned checkout> --only xx` writes `tests/fixtures/xx.json` and updates the manifest, corrections and `remaps.json`, leaving the other languages byte-identical; then `npm run corpus:check`. Update the counts in `docs/grammar.md` and `README.md`.

Scripts import only types from `src/` (erased at runtime). Fixtures hold no source file names, encodings or checksums of the original pages.

## 11. Tense equivalence

`equivalentTenses(from, to, tense)` answers a trainer's question: a learner of `to` is shown a tense of `from`; which tense of `to` should the question ask for? It does not compare two languages directly. Each language maps every one of its catalogue tenses to weighted links to a closed inventory of 41 language-neutral concepts (`src/equivalence/concepts.ts`), and the derivation (`src/equivalence/derive.ts`) compares the two maps through those concepts. A pack is not involved: the maps read only the types of the registry, so the `./equivalence` subpath loads without the packs.

### The concepts

A concept is a point in seven dimensions: `finiteness` (`finite`, `infinitive`, `participle`, `gerund`, `verbalAdjective`, `supine`), `mood` (`indicative`, `subjunctive`, `conditional`, `imperative`; `null` for a non-finite concept), `time` (the reference time: `past`, `present`, `future`), `relative` (the event against the reference: `anterior`, `simultaneous`, `posterior`), `aspect` (`neutral`, `perfective`, `imperfective`, `progressive`), and the optional `remoteness: 'near'` and `polarity: 'negative'`. No two concepts share all seven. `PRESENT_PERFECT` is a finite indicative present anterior; `PAST_PERFECTIVE` a finite indicative past simultaneous perfective; `NEAR_FUTURE` a present posterior near; `IMP_NEGATIVE` an imperative with negative polarity. Voice is not a dimension: a passive tense looks up the concept of its active tense.

### A map

`src/equivalence/<code>.ts` exports one object, `satisfies LanguageMap<'<code>'>`: a key `mood.tense` for every catalogue tense, in catalogue order, and nothing else (a missing or a foreign tense does not compile), each with at least one link. A link is built with `link(concept, weight, extra?)`:

```ts
export const fr = {
  'indicative.present': [link('PRESENT', 1)],
  'indicative.perfect': [link('PAST_PERFECTIVE', 1, { note: 'eq.fr.perfect.spoken-past' }), link('PRESENT_PERFECT', 0.8)],
  'indicative.simple_past': [link('PAST_PERFECTIVE', 1, { register: 'literary' })],
  // ...
} satisfies LanguageMap<'fr'>;
```

- `weight`: a multiple of 0.1 in (0, 1], how well the concept describes the tense. A score is the product of a source and a target weight, rounded to two decimals. Weights are relative: the French passé composé is first a perfective past (1) and only then a present perfect (0.8), so it ranks the Dutch perfect (0.80) above the Dutch past (0.70, whose perfective link weighs 0.7).
- `register`: `standard` (the default), `literary` or `dated`, the register of the tense in that use. A literary tense sorts after a standard one of equal score; a dated one is offered only when nothing else corresponds, not even with the mood relaxed.
- `note`: a key `eq.<code>.*` (or a shared `eq.note.*`) of the core catalogs, attached to every match that goes through this link.
- `only: 'target'`: a stand-in, used only when the language is the target. The Dutch past participle links `INF_PERFECT 0.4` this way: a French perfect infinitive asks for it (with the note that says to add hebben or zijn), but a Dutch past participle never answers as a perfect infinitive. `only: 'source'` is the reverse (the Spanish and Italian negative imperatives link `IMP_PRESENT 0.6` so that a language without a negative imperative gets its plain imperative). A link with `only` has a note.

### The derivation

For a source tense, every target tense is scored over the pairs (source link, target link) whose concepts are compatible, and its score is the best product. Compatible means equal in every dimension at first; if no target tense is compatible, a fixed ladder relaxes, one step at a time, until one is: remoteness, then aspect (never *to* a progressive from a source that is not progressive: a past anterior is never "I had been eating"), then mood (a subjunctive or a conditional to the indicative, never anything else, so an imperative never relaxes), and last the register (a `dated` target link, for a source that is not dated: "er werde kommen" is "vendrá", and the archaic "viniere" is offered only when even the indicative does not correspond). Finiteness, time, relative time and polarity never relax: an infinitive never answers a participle, a future never a present. The first step that finds a match is the result; matches sort by score, then by register, then by catalogue order. Within one language, the tense itself comes first and the ladder never runs.

A pair override in `src/equivalence/overrides.ts` corrects the few lookups where the concepts alone do not give what a learner expects (`replace`, `prepend` or `exclude` tenses of the derived list, with a note and a `reason` of more than 30 characters). The French near future into Dutch, for example, puts the present (of gaan, plus an infinitive) before the Dutch future. `tests/equivalence/api.test.ts` fails for an override that changes nothing.

### Reading a result

```ts
const { matches, notes } = equivalentTenses('fr', 'nl', { mood: 'indicative', tense: 'perfect' });
// matches[0]: { match: 'exact', tense: { mood: 'indicative', tense: 'perfect' }, rank: 1, score: 0.8, register: 'standard', relaxed: [], via: ['PRESENT_PERFECT', 'PRESENT_PERFECT'], notes: [] }
```

- `match`: `exact` (a shared concept), `approximate` (the ladder relaxed the dimensions named in `relaxed`, or the match is a stand-in), `override` (a pair override; `score` 1, `via` null).
- `register`: the target tense's, so a trainer can leave out literary and dated tenses.
- `notes`: message keys of the core catalogs, in order: the source link's, the target link's, then one per relaxation (`eq.note.relaxed-aspect`, `eq.note.no-subjunctive`, ...). `locales[locale][key]` is the text, and `equivalenceNotes[locale][key]` on the `./equivalence` subpath. A note speaks to the learner: it names the forms (je vais manger: ik ga eten), never the engine or its catalogue.
- `matches` may be empty: no tense of the target corresponds (a Latin supine, a French gerund into German). The result's own `notes` then say why: `eq.note.no-counterpart`, then the source tense's notes. They are empty whenever there is a match.
- `{ voice: 'passive' }` looks up the passive of the source tense. Only a language in `passiveLanguages` (its catalogue has a passive voice) can be the source; a tense it does not list in `passiveTenses` (a Latin participle, gerund or supine) is looked up as active; a target without a modelled passive gets its active tenses: every exact match turns approximate, and every match (overrides included) gets `eq.note.passive-not-modelled`.

### Adding a language

1. Read the language's catalogue (`src/languages/<code>/catalogue.ts`): the map follows it, tense for tense.
2. Write `tests/equivalence/expectations/<code>.ts`: the lookups a learner of the language would check first (its narrative past both ways, its subjunctives into Dutch, its tenses without a counterpart), as `[from, tense, to, top, score, match, extra?]` rows (`tests/equivalence/expectations/types.ts`). A row states what a teacher would accept, never a copy of what the derivation happens to return: pin a `second` match only when it is an answer too (`null` when there must be none), and leave a weak relative unpinned.
3. Write the notes, `src/i18n/locales/{en,nl}/equivalence/<code>.ts`, plain text without placeholders or a straight apostrophe (the Dutch file is typed `satisfies Record<keyof typeof english, string>` against the English one, so neither can miss a key), and spread them in both `index.ts` files. `tests/equivalence/notes.test.ts` checks the prefix and that both locales agree.
4. Write `src/equivalence/<code>.ts` and register it in `src/equivalence/index.ts`. `npm run typecheck` fails from the moment the language is registered in `src/languages/registry.ts` until it has a map, and until the map is total.
5. `npm run equivalence:matrix`, then read the new and changed lines of `tests/equivalence/matrix.tsv` pair by pair, as a learner translating a question from one language into the other would. Fix a wrong line in the map (or, rarely, with an override), never in the snapshot.
