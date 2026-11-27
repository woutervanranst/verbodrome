The implemented core differs from the sketches in sections A to D (it is described in docs/superpowers/plans/2026-11-24-seven-language-engine-01-foundation.md and -02-core-completion-and-dutch.md); sections E to I remain the design input for later plans.

# Design: 7-language rule-first conjugation engine (architecture A)

All findings below come from reading the repo and running read-only probes against the current `dist/` build; nothing was modified and no plan file was written.

## 0. Things the existing code makes harder than the decisions assume

| # | Finding | Consequence for the plan |
|---|---|---|
| 1 | "Reproduce the snapshot cell for cell" conflicts with "first principles" at whitelist boundaries. The current engine gives invented `bleder` → `je blede`, `crebler` → `je creble`, `pequer` → `je peque` (the mute-e rule is a whitelist of `-emer/-ener/-eper/-erer/-eser/-ever/-evrer/-ecer`), and `blettre` → `je bletts`. | The snapshot must include invented boundary probes. Expect a handful of intended diffs here; each needs a ledger entry, not silent drift. |
| 2 | `tests/corpus.test.ts` only checks `expected ⊆ generated`. Over-generation is invisible. | fr/nl are covered by the exact-match snapshot. The five new languages need an "untagged extra form" guard plus exact-set goldens (section H). |
| 3 | Spelling is an outer loop (`for spelling of spellings`), and `conjugate.ts` dedups by `JSON.stringify(parts)` and merges to `orthography: 'both'`. Once parts carry derivations, the two runs differ in steps. | Replace the outer loop with forking rules: a form is born `both` unless a spelling-sensitive rule fired. Dedup on a signature that excludes steps. |
| 4 | The app recombines parts across forms and re-renders (`distractors.ts` `swap`, `question.ts` `inPerson`), relying on render-time elision from `phonology.onset`. | Sandhi must stay a render-time function over parts. It cannot be baked into text at clause assembly. |
| 5 | `prompt.ts` builds a `ConjugationPart` literal with all six `features` keys. | Any new part or feature field must be optional, or that file breaks. |
| 6 | `docs/grammar.md` says the manifest holds original byte checksums. It does not: entries are `{file, language, infinitive, gender, auxiliary, pattern, templatePlaceholders}`. | Add per-file `sha256` and `encoding` in manifest v2; this is what actually pins the five new directories. |
| 7 | Stem hints currently overwrite cells and bypass spelling (`hints.plural + 'ons'`). | In the rebuild, hints become principal parts and pass through orthography rules. Pin hinted queries in the snapshot. |

The pin itself generalises for free. `<pinned corpus checkout>` is at `3a9a01de…`, clean, and all seven directories are tracked at that commit (139 / 145 / 89 / 222 / 20 / 18 / 207 files).

## A. Core types

Use a closed registry, not module augmentation. The package ships all seven packs, and augmentation would only be visible to consumers who import the augmenting file.

```ts
// src/core/spec.ts
export interface LanguageSpec {
tenses: Record<string, string>;   // mood -> tense ids (today's FrenchTenses shape)
nonFinite: string;                // moods without person/number
subject: string;                  // subject-slot ids
auxiliary: string;
classHint: string;
stems: object;                    // principal-part hints
variant: string;                  // named variant series ('ra' | 'se', 'y-to-i', …)
dimensions: object;               // extra target dimensions, e.g. { voice: 'active' | 'passive' }
agreement: object;                // { gender; number } or { gender; number; case }
context: object;                  // remaining language-specific options
}

// src/languages/registry.ts  (one line per language; the only shared edit point)
export interface LanguageRegistry {
fr: FrenchSpec; nl: DutchSpec; de: GermanSpec; en: EnglishSpec;
es: SpanishSpec; it: ItalianSpec; la: LatinSpec;
}
export type Language = keyof LanguageRegistry;
type S<L extends Language> = LanguageRegistry[L];

export type TensesFor<L extends Language> = S<L>['tenses'];
export type MoodFor<L extends Language> = keyof TensesFor<L> & string;
export type TenseFor<L extends Language, M extends MoodFor<L> = MoodFor<L>> = TensesFor<L>[M];
export type Mood  = { [L in Language]: MoodFor<L> }[Language];
export type Tense = { [L in Language]: TenseFor<L> }[Language];

type Finite<L extends Language> = { person?: Person; number?: GrammaticalNumber; subject?: S<L>['subject'] };
type NonFinite = { person?: never; number?: never; subject?: never };
type TargetQuery<L extends Language> =
| ({ mood?: undefined; tense?: TenseFor<L> } & Finite<L>)
| { [M in MoodFor<L>]: { mood: M; tense?: TenseFor<L, M> }
      & (M extends S<L>['nonFinite'] ? NonFinite : Finite<L>) }[MoodFor<L>];

export type ConjugationOptionsFor<L extends Language> = {
language: L; infinitive: string;
auxiliary?: S<L>['auxiliary']; classHint?: S<L>['classHint']; stems?: S<L>['stems'];
agreement?: Partial<S<L>['agreement']>;
} & Partial<S<L>['dimensions']> & S<L>['context'] & TargetQuery<L>;
export type ConjugationOptions = { [L in Language]: ConjugationOptionsFor<L> }[Language];

// kept as aliases: the app imports these names
export type FrenchTenses = TensesFor<'fr'>;  export type DutchTenses = TensesFor<'nl'>;
export type FrenchConjugationOptions = ConjugationOptionsFor<'fr'>;
export type DutchConjugationOptions  = ConjugationOptionsFor<'nl'>;
```

Target, catalogue and subject slots:

```ts
export interface ResolvedTarget {
mood: Mood; tense: Tense; person: Person | null; number: GrammaticalNumber | null;
gender: Gender | null; agreement: Agreement | null;      // unchanged fields
subject: string | null;                                  // new: slot id ('Sie', 'usted', 'u')
voice: 'active' | 'passive' | null;                      // null everywhere except la
}
export interface Agreement { gender: Gender; number: GrammaticalNumber; case?: Case }  // Gender gains 'neuter'

export interface SubjectSlot {
id: string; person: Person; number: GrammaticalNumber;   // agreement the verb sees
pronoun: string | null; gender?: Gender; register?: 'formal' | 'informal';
default: boolean;                                        // appears in the chart without being asked for
}
export interface CatalogueEntry<L extends Language = Language> {
mood: MoodFor<L>; tense: TenseFor<L>; moodLabel: string; tenseLabel: string; finite: boolean;  // unchanged
slots: readonly string[];                // replaces the hard-coded imperative-person logic in expandTargets
formation: 'simple' | 'periphrastic';
features: { aspect?: 'progressive'; polarity?: 'negative' };
voices?: readonly ('active' | 'passive')[];
}
```

Where each missing feature goes:

| Feature | Modelled as | Shared or specific |
|---|---|---|
| Latin voice | Target dimension `voice` (orthogonal to every tense). Deponents: `availability` returns `noPassive`; active cells use passive morphology. | Dimension type in `LatinSpec`; expansion in core |
| Latin participle case/gender | `Agreement.case` plus `neuter`. Latin context option `declension: 'citation' \| 'full'`, default citation (nom. sg., three genders). | Agreement mechanism shared with the French past participle |
| Formality (Sie, usted, Lei, u) | `SubjectSlot` with `register`. Verb agreement comes from the slot's person/number. Dutch `pronoun` stays as an alias of `subject`. | Slot model in core; slot lists per pack |
| Voseo | Not in initial scope. The slot model leaves room (slot is not the same as person × number). | — |
| English progressive | Separate tense ids (`present_progressive`, …) with `features.aspect`. Periphrastic recipe. | Per pack |
| Negative imperative (es/it) | Tense id `imperative.negative` with `features.polarity`. The clause adds `no`/`non`. | Per pack |
| -ra/-se, conditionnel passé 2e forme, payer y/i | `variant.pattern`, typed by `S<L>['variant']`. One slot, several named variants. | `FormVariant` shared |
| English (U)/(E) | New `variant.region: string \| null` | Shared field |
| Separable prefixes (de/nl) | `LexemeBase.particle { text, separable }`, placed by the clause. Options `separablePrefix`/`inseparablePrefix` via a shared `PrefixHints` type in both specs. | Shared type, per-pack rules |
| Macrons (la) | Lexicon and output carry macrons. Input accepted with or without. `RenderContext.macrons?: false` strips. `normalizeForComparison(language, text)` exported for answer checking. Unknown stem quantities on invented verbs are an assumption step. | Per pack |

Builder: one generic class plus mapped sugar installed from the pack catalogue at construction. The only conditional type is on booleans, none on language pairs.

```ts
type MoodSugar<L extends Language, Self> = { [M in MoodFor<L>]: (tense?: TenseFor<L, M>) => Self };
type ContextSugar<L extends Language, Self> = { [K in keyof S<L>['context']]-?:
(...a: S<L>['context'][K] extends boolean | undefined ? [v?: boolean] : [v: NonNullable<S<L>['context'][K]>]) => Self };
export type Builder<L extends Language> = BuilderCore<L> & MoodSugar<L, Builder<L>> & ContextSugar<L, Builder<L>>;
// BuilderCore: mood, tense, person, number, subject, auxiliary, classHint, stems, agreement, build(): ConjugationOptionsFor<L>
```

`tests/options.typecheck.ts` keeps passing unchanged (`.gender()` on nl, `.gerund()` on nl and `.auxiliary('hebben')` on fr stay errors). Add a type-level test that no context key collides with a mood or core method name.

## B. LanguagePack contract

```ts
// src/core/pack.ts
export interface LanguagePack<L extends Language> {
readonly language: L;
readonly catalogue: readonly CatalogueEntry<L>[];          // catalogue.ts
readonly subjects: readonly SubjectSlot[];                 // clause.ts
readonly options: OptionSchema<L>;                         // declarative validation, replaces if/else in options.ts
readonly rules: Readonly<Record<string, RuleDef>>;         // union of stems/orthography/clause/… rule tables
readonly citations: Readonly<Record<string, Citation | readonly Citation[]>>;  // sources.ts
readonly periphrases: readonly Periphrasis<L>[];           // periphrasis.ts
classify(query: ParsedQuery<L>, trace: Trace): Lexeme<L>;                      // stage 1
availability(lexeme: Lexeme<L>, target: ResolvedTarget): Unavailability | null;
stem(lexeme: Lexeme<L>, cell: Cell<L>, trace: Trace): Fork<Stem>;              // stage 2 (stems.ts + lexicon.ts)
ending(lexeme: Lexeme<L>, cell: Cell<L>, stem: Stem, trace: Trace): Fork<Ending>;  // stage 3 (paradigms.ts)
readonly orthography: readonly RuleDef<Juncture>[];        // stage 4, ordered; core runs them
readonly clause: ClauseGrammar<L>;                         // stage 6
rank(variant: FormVariant, query: ParsedQuery<L>): readonly number[];
}

export interface LexemeBase {
lemma: string; verbId: string; classId: string;
classSource: 'lexicon' | 'regularRule' | 'explicitHint';
reflexive: boolean; auxiliaries: readonly string[];
particle: { text: string; separable: boolean } | null;
steps: readonly DerivationStep[];                          // classification steps and assumptions
}
export type Cell<L extends Language> =
| { kind: 'finite'; mood: MoodFor<L>; tense: TenseFor<L>; person: Person; number: GrammaticalNumber; voice?: Voice }
| { kind: 'nonFinite'; form: string; agreement?: Agreement; voice?: Voice };
export interface Juncture { stem: string; ending: string; cell: Cell<Language>; lexeme: LexemeBase }

export interface Outcome<T> { value: T; tags: VariantTags; steps: readonly DerivationStep[] }
export type Fork<T> = readonly Outcome<T>[];                 // [] means no form (defective cell)
export interface VariantTags { orthography?: 'rectified' | 'traditional'; pattern?: string;
usage?: Usage; region?: string; condition?: MessageRef }
```

Core owns `synthesize(pack, lexeme, cell): Fork<Word>`. It composes stem → ending → orthography, takes the cross-product of forks, drops branches whose tags conflict, and is memoised per (lexeme, cell). Auxiliary words and participles are therefore derived once and their frozen step arrays are shared across forms.

Compound tenses are flat chains (data), run by one shared executor:

```ts
export interface Periphrasis<L extends Language> {
target: { mood: MoodFor<L>; tense: TenseFor<L>; voice?: Voice };
rule: string;                                              // explanation rule id
chain: readonly ChainElement<L>[];
variants?: readonly { pattern: string; usage?: Usage; chain: readonly ChainElement<L>[] }[];
}
export type ChainElement<L extends Language> =
| { verb: VerbRef; form: 'finite'; as: { mood: MoodFor<L>; tense: TenseFor<L> } }  // takes the target's person/number
| { verb: VerbRef; form: string; agree?: 'subject' | 'object' }                    // non-finite id
| { word: string; role: 'linker' | 'particle' };
type VerbRef = 'main' | 'perfectAuxiliary' | { lemma: string };
```

| Target | Chain |
|---|---|
| fr `indicative.perfect` | perfectAuxiliary finite ind.present · main pastParticiple (agree) |
| fr `conditional.past` variant `past-second` (literary) | perfectAuxiliary finite subj.imperfect · main pastParticiple |
| fr `recent_past` | `venir` finite ind.present · word `de` · main infinitive |
| nl/de future perfect | `zullen`/`werden` finite ind.present · main pastParticiple · perfectAuxiliary infinitive |
| en present perfect progressive | `have` finite · `be` pastParticiple · main presentParticiple |
| la perfect passive | main perfectParticiple (agree subject) · `esse` finite ind.present |

The executor resolves each `VerbRef` through the same pack (`pack.classify`, memoised) and synthesises each element with full steps. It forks over `lexeme.auxiliaries` and over `variants`, records one `<lang>.periphrasis.*` step, and hands the chain to `clause.assemble`. A test asserts every chain element references a simple cell, so there is no recursion.

```ts
export interface ClauseGrammar<L extends Language> {
assemble(chain: VerbChain, ctx: ClauseContext<L>, trace: Trace): Fork<readonly ConjugationPart[]>;
    // subject, mood marker (que), reflexive clitic, negative particle, particle placement, inversion, verb-final
agreement(chain: VerbChain, ctx: ClauseContext<L>, trace: Trace): Fork<Agreement | null>;
onset(text: string, lexeme: LexemeBase): Onset;            // replaces the French regex in parts.ts
sandhi(left: ConjugationPart, right: ConjugationPart): string | null;   // render-time: je + vowel → j'
bareOmits(part: ConjugationPart): boolean;                 // replaces the hard-coded 'que' test in render.ts
}
```

`renderParts(language, parts, ctx)` keeps its signature and delegates to `pack.clause`. `assemble` dry-runs `sandhi` so the elision is also recorded as a step.

**Worked example 1: `nous plaçons` (placer, indicative present, 1pl)**

| Stage | Rule | before → after |
|---|---|---|
| classify | `fr.classify.productive-er` (no family suffix matches; ends in -er) | `placer` → class `er` |
| stem | `fr.stem.infinitive-minus-er` | `placer` → `plac-` |
| ending | `fr.ending.present.er` (paradigms row, slot 1pl) | `plac-` → `plac+ons` |
| orthography | `fr.orth.c-cedilla` (c before a/o/u keeps /s/) | `plac+ons` → `plaç+ons` |
| clause | `fr.clause.subject-pronoun` | `plaçons` → `nous plaçons` |

No spelling-sensitive rule fired, so the form is born `orthography: 'both'`.

**Worked example 2: `ich habe geschlinkt` (invented schlinken, Perfekt, 1sg)**

| Stage | Rule | Result |
|---|---|---|
| classify | `de.classify.default-weak` (assumption), `de.classify.no-prefix` (assumption), `de.classify.default-haben` (assumption) | weak, no particle, aux `haben` |
| periphrasis | `de.periphrasis.perfekt`: perfectAuxiliary finite ind.present · main partizip2 | chain of two |
| aux word | `haben` via the same pack: stem `hab-`, ending `-e` | `habe` |
| main stem | `de.stem.infinitive-minus-en` | `schlink-` |
| main prefix | `de.participle.ge-prefix` (initial stress, no inseparable prefix, not -ieren) | `ge+schlink` |
| main ending | `de.participle.weak-t` (no e-insertion: stem does not end in d/t) | `geschlinkt` |
| clause | `de.clause.verb-second`, `de.clause.participle-final` | `[subject ich][auxiliary habe][lexicalVerb geschlinkt]` |

The sentence bracket is represented by part order. Consumers insert complements after the finite part, as `prompt.ts` `mainClause` already does for Dutch.

## C. Derivation and explanation model

```ts
export type Stage = 'classify' | 'stem' | 'ending' | 'orthography' | 'periphrasis' | 'clause' | 'availability';
export type StepParam = string | number | TermRef;           // TermRef = { term: 'tense' | 'person' | …; language?: Language; id: string }
export interface DerivationStep {
readonly rule: string;                                     // registry key, e.g. 'fr.orth.c-cedilla'
readonly stage: Stage;
readonly kind: 'rule' | 'lexical' | 'assumption' | 'unavailable';
readonly before: string | null; readonly after: string | null;
readonly params: Readonly<Record<string, StepParam>>;
}
export interface RuleDef<State = unknown, P extends Record<string, StepParam> = Record<string, StepParam>> {
readonly id: string; readonly stage: Stage; readonly kind?: DerivationStep['kind'];
readonly params: { readonly [K in keyof P]: 'text' | 'number' | 'term' };   // runtime schema; P is inferred from it
when?(state: State): boolean;
apply?(state: State): State | readonly { state: State; tags: VariantTags }[];   // an array means a fork
describe(before: State, after: State): P;
}
```

- **Minimal boilerplate.** Transforming rules are declared with `rule({...})`. The core runner `applyRules(rules, state, trace)` evaluates `when`, calls `apply`, and records the step with before/after text itself. Authors never push steps. Non-transforming decisions (class choice, stem pick, auxiliary choice) use the one-liner `trace.note(ruleDef, params, before?, after?)`.
- **Registry.** Each pack exports `rules = {...} as const satisfies Record<string, RuleDef>`. `RuleId` is the union of the keys across packs plus `core.*`. No hand-maintained list.
- **Attachment.** `ConjugationPart.steps?` holds the word-level steps. `GeneratedForm.steps` holds the clause, periphrasis and agreement steps. `analysis.steps` holds classification.
- **Assumptions.** These are `kind: 'assumption'` steps in `analysis.steps`. `analysis.assumptions: string[]` stays, rendered from them with the `en` catalog. Making those `en` messages identical to today's strings keeps `query.test.ts` and the snapshot green.
- **Unavailability.** `UnavailableTarget` gains `step: DerivationStep` (`kind: 'unavailable'`). `explanation` and `source` stay as rendered fields, and `reason` gains `'noPassive'`.
- **`lexical` vs `rule`.** `lexical` marks "listed in the lexicon" (learn by heart); `rule` marks a productive rule. The UI can distinguish them.

Citations (`languages/<lang>/sources.ts`):

```ts
export interface Work { id: string; title: string; author?: string; year?: number; url?: `https://${string}` }
export interface Citation { work: string; locator: string; url?: `https://${string}` }   // '§ 791', 'Leidraad 11.3'
export const citations = { 'fr.orth.c-cedilla': {...}, … } satisfies Record<FrRuleId, Citation | readonly Citation[]>;
```

A missing citation is a type error. Suggested primary works:

| Language | Works |
|---|---|
| fr | Grevisse, Académie, the 1990 Rectifications; the existing Le Conjugueur / CNRTL links stay |
| nl | e-ANS, Taalunie Leidraad (as today) |
| de | Duden Grammatik, IDS grammis, the official spelling rules |
| en | Huddleston & Pullum; Quirk et al. |
| es | RAE-ASALE Nueva gramática, DLE conjugation models |
| it | Treccani; Serianni |
| la | Allen & Greenough (public domain, stable § URLs) |

Messages:

```ts
// src/i18n/locales/<locale>/<lang>.ts  — flat ICU strings; one file per (locale, language) so parallel work never conflicts
export const fr = {
'fr.orth.c-cedilla': 'Before {vowel}, c becomes ç so that it keeps the sound /s/: {before} → {after}.',
'term.fr.indicative.present': 'présent',
} satisfies Record<FrRuleId | FrTermKey, string>;            // missing key = typecheck failure = build failure
```

- **ICU subset.** Literal text, `{arg}`, `{n, plural, =0{} one{} other{}}` with `#`, `{x, select, a{} other{}}`, nesting, and `'` escaping. Nothing else. A built-in formatter of roughly 120 lines, using `Intl.PluralRules`, keeps the engine at zero dependencies.
- **Enumerated params.** Tense names and persons are `TermRef`s. `explain` resolves them through `term.*` keys before formatting, so messages need no giant `select` blocks.
- **Test-level checks** (`tests/i18n.test.ts`):
- every message parses within the subset;
- `placeholders(message) ⊆ keys(rule.params)`, with argument kinds matching (plural needs a number);
- both locales have identical key sets;
- every step emitted across the whole corpus and snapshot runs formats in `en` and `nl` without throwing.

```ts
export function explain(form: ConjugatedForm, locale: Locale): Explanation;
export interface Explanation { summary: string; sections: readonly {
part: number | null; title: string;
steps: readonly { text: string; rule: string; kind: DerivationStep['kind']; before: string | null; after: string | null;
                  citations: readonly (Citation & { work: Work })[] }[] }[] }
```

## D. Public API and compatibility

```ts
// root: all packs and both locales registered — the same convenience as today
conjugate(options): ConjugationResult                 // forms gain steps; parts gain steps?; variant gains region
explain(form | unavailableTarget | analysis, locale): Explanation
equivalentTenses(from, to, tense): readonly TenseEquivalent[]
getCatalogue(language), getSubjects(language), languages
conjugationOptions, parseConjugationOptions, renderParts, normalizeForComparison, wordPart(text)
// tree-shakable:
createEngine({ packs, locales })                      // returns the same functions bound to a subset
```

Package exports (`"sideEffects": false`): `.`, `./core`, `./languages/{fr,nl,de,en,es,it,la}`, `./locales/{en,nl}`, `./equivalence`. `ruleIds` stays as a derived, deprecated array (`steps.map(s => s.rule)`). `package.test.ts` extends to the subpaths and to the "no Node imports" graph walk.

Compatibility with the app (six importing files, plus `rules.ts` indirectly):

| File | What it uses | Breaks? | Minimal adaptation |
|---|---|---|---|
| `config/tenses.ts` | `getCatalogue('fr')` fields `mood, tense, moodLabel, tenseLabel, finite`; type `FrenchTenses` | No (five fields and alias kept; the app sorts with its own order) | none |
| `config/verbs.ts` | `Pick<DutchConjugationOptions, 'separablePrefix' \| 'inseparablePrefix' \| 'auxiliary' \| 'classHint' \| 'stems' \| 'reflexive'>` | No, provided those six keys keep their names in `DutchSpec` | none |
| `trainer/forms.ts` | Wildcard `conjugate`, `form.target.*`, `text`, `preferred`, `parts[].role`, `analysis`, `unavailableTargets[].reason === 'impersonal'` | No | none |
| `trainer/prompt.ts` | Hand-built `ConjugationPart` literal; `features.verbForm`; roles; `variant.auxiliary`; `renderParts('nl')` | Only if a part or feature field becomes required | Keep new fields optional → zero change. Optionally switch the literal to `wordPart(text)` (one line). |
| `trainer/distractors.ts` | Spreads parts and overrides `text`/`phonology.onset`; `renderParts('fr', parts, { bare })` | Only if elision moves out of render or `Onset` values change | none (constraint 4 above) |
| `trainer/question.ts` | `renderParts('fr', recombinedParts)` | Same | none |
| `trainer/rules.ts` | `analysis.lemma`, `classificationSource === 'regularRule'`, `auxiliaries` | No | none now; the follow-up replaces it with `explain()` |

`apps/verbodrome/tests/trainer.test.ts` pins concrete strings and stays green if the fr/nl snapshots hold.

## E. Equivalence

A closed inventory of about 40 named concepts, each defined by dimensions. The names make the matrix reviewable; the dimensions drive the fallback.

```ts
export interface ConceptDef {
finiteness: 'finite' | 'infinitive' | 'participle' | 'gerund' | 'verbalAdjective' | 'supine';
mood: 'indicative' | 'subjunctive' | 'conditional' | 'imperative' | null;
time: 'past' | 'present' | 'future';                       // reference time
relative: 'anterior' | 'simultaneous' | 'posterior';       // event vs reference (perfect = anterior)
aspect: 'neutral' | 'perfective' | 'imperfective' | 'progressive';
remoteness?: 'near'; polarity?: 'negative'; voice?: 'passive';
}
// ids: PRESENT, PRESENT_PROGRESSIVE, PAST_PERFECTIVE, PAST_IMPERFECTIVE, PAST_PROGRESSIVE, PRESENT_PERFECT, PLUPERFECT,
// PAST_ANTERIOR, FUTURE, FUTURE_PERFECT, NEAR_FUTURE, RECENT_PAST, COND_PRESENT, COND_PERFECT, SUBJ_PRESENT, SUBJ_IMPERFECT,
// SUBJ_PERFECT, SUBJ_PLUPERFECT, SUBJ_FUTURE, IMP_PRESENT, IMP_NEGATIVE, IMP_FUTURE, IMP_PERFECT, INF_PRESENT, INF_PERFECT,
// INF_FUTURE, PART_PRESENT, PART_PAST, PART_PERFECT, PART_FUTURE, GERUND, GERUND_PERFECT, GERUNDIVE, SUPINE, …

// src/equivalence/<lang>.ts — a total map: a missing tense is a type error
export const fr = {
'indicative.perfect': [{ concept: 'PAST_PERFECTIVE', weight: 1, note: 'eq.fr.perfect.spoken-past' },
                       { concept: 'PRESENT_PERFECT', weight: 0.8 }],
'indicative.simple_past': [{ concept: 'PAST_PERFECTIVE', weight: 1, register: 'literary' }],
} satisfies Record<TenseKeyFor<'fr'>, readonly ConceptLink[]>;

export interface PairOverride { from: Language; to: Language; tense: string;
mode: 'replace' | 'prepend' | 'exclude'; result: readonly { tense: string; note?: MessageKey }[] }

export interface TenseEquivalent { tense: { mood: string; tense: string }; rank: number; score: number;
match: 'exact' | 'approximate' | 'override'; via: readonly ConceptId[]; notes: readonly MessageKey[] }
```

- **Ranking.** Score is the maximum over shared concepts of `weight_from × weight_to`. Ties break on target register (standard before literary), then catalogue order.
- **Fallback.** With no shared concept, a fixed relaxation ladder applies: register → remoteness → aspect → mood (subjunctive → indicative; conditional → indicative). Finiteness and time are never relaxed. Results are flagged `approximate` and carry a note such as `eq.note.no-subjunctive`.
- **Notes.** These are message keys in the same catalogs (`i18n/locales/*/equivalence.ts`), under the same completeness tests.
- **Tests.**
- `toMatchFileSnapshot('tests/equivalence/matrix.tsv')`: one row per (from, tense, to), about 840 rows at seven languages, each showing the ranked list with score, match type and notes.
- Identity: `equivalentTenses(L, L, t)[0]` is `t`.
- No empty result without a note.
- Acceptance: the fr→nl top results reproduce the `DIRECT` and `SUBJUNCTIVE` tables in `apps/verbodrome/src/trainer/prompt.ts`.

## F. French rebuild

**Measured reduction.** I derived every non-productive table in `models.ts` from six principal parts with a deliberately crude script (read the parts off cells 0/3/5/18/12/46 and apply the classic rules below). Results over 94 models / 101 paradigms:

| Bucket | Paradigms | Storage after rebuild |
|---|---:|---|
| Zero mismatches, no alternates, no spelling split | 56 | Principal parts only (5 of these are infinitive/participle-only defectives: ester group, férir, issir, rassir, occire) |
| Zero mismatches, but spelling split or alternates (-aître family, mouvoir, absoudre, asseoir ×2, surseoir, interpeller, ouïr#ois) | 12 | Principal parts plus orthography rules or forks (î before t, mû/mu, assoir/asseoir, ll/l); ouïr gets three future stems |
| Only the feminine/plural participle differs (rire, plaire, dormir, suffire, nuire) | 5 | Principal parts plus `invariableParticiple` flag |
| Person-restricted (falloir, pleuvoir, seoir, messeoir, échoir ×2, braire) | 7 | Principal parts plus person mask; seoir/messeoir need 1–2 cell overrides |
| Needs a subjunctive stem (pouvoir, savoir, valoir, vouloir, faillir#faille, #faux) | 6 | Extra optional stem; at most 3 cell overrides (puis/peux, sache/sachant, veuille) |
| Small (dire `dites`; faillir#faillis, #faudrai no imperative) | 3 | 2 cells, or a flag |
| Tense-gap defectives (choir ×2, déchoir, gésir, bruire, clore, enclore) | 7 | Principal parts plus per-tense availability mask |
| Suppletive (être 24 cells, avoir 13, aller 8, faire 9 before the subjunctive stem) and croître (homograph circumflex rule) | 5 | Cell overrides for four verbs; a rule for croître |

So roughly 80% of family paradigms become pure stem data. True cell overrides concentrate in about ten verbs, mostly être and avoir. The 68 zero-mismatch figure is a lower bound, since the script had no subjunctive stem, flags or masks.

**Formation rules** (`fr/stems.ts`, one rule id each):

| Principal part | Feeds |
|---|---|
| P1 present-singular stem + ending set (`s/s/t`, `x/x/t`, `e/es/e`; `t` drops after d/t/c) | Ind. present 1–3sg; imperative 2sg |
| P2 nous stem | Ind. present 1–2pl; imparfait; participe présent; subj. present 1–2pl; imperative 1–2pl |
| P3 ils stem (default P2) | Ind. present 3pl; subj. present sg and 3pl |
| F future stem (default: infinitive, minus final `e`) | Futur; conditionnel |
| PS past stem + theme vowel a/i/u/in | Passé simple; subj. imparfait |
| PP past participle | Feminine/plural (s/x invariant; û only in masc. sg.); all compounds |
| SUBJ (optional; sg/3pl and pl stems) | Subj. present where it is not P3/P2 |

**(a) Productive classes.** The 19 productive models collapse to three ending sets (`er`, `ir`, `re`) in `paradigms.ts` plus orthography rules:

- `fr.orth.c-cedilla`, `fr.orth.g-e`
- `fr.orth.mute-e-grave`
- `fr.orth.closed-e-grave` (forks traditional/rectified in future and conditional)
- `fr.orth.eler-eter` (appeler/jeter double in both spellings; a closed list takes è in both; the rest fork)
- `fr.orth.y-to-i` (-oyer/-uyer obligatory; -ayer forks into `y-to-i`/`keep-y`; -eyer never)
- `fr.orth.1990-circumflex-iu`
- `fr.orth.diaeresis-ir`
- `fr.orth.t-after-dental`

**(b) Families.** `lexicon.ts` keeps today's selector mechanics verbatim (`lemmas`, `suffixes`, `except`, `exceptEndings`, longest suffix wins, listed lemma first). `strip` + tables become `stems` expressed relative to the stripped infinitive, so derivatives still work.

**(c) Suppletives.** Same entry type with `cells: Partial<Record<CellKey, readonly string[]>>`.

What carries over:

- **Multi-pattern models** become multiple principal-part sets per family, each with `pattern` and `usage` (payer: one set plus a forking rule; asseoir: two sets; faillir: four; choir: two, dated).
- **Model flags** (`invariableParticiple`, `impersonal`, `thirdPersonOnly`, `noImperative`, `compounds`) move unchanged onto the family entry and are read by `availability`.
- **`analysis.classification`** keeps reporting today's ids (`aimer`, `placer`, `lever`, `cuire`, …). For productive verbs it is a label computed from which orthography rules apply. `model:` accepts it back, as `fr-models.test.ts` requires.
- **`classHint`** forces the productive class.
- **`stems` hints** map one-to-one onto P1/P2/P3/F/PS/PP and now go through orthography.

**Bootstrap aid.** A one-off dev script extracts principal parts and residual cells from the 113 validated tables, generalising the analysis above. The lexicon is generated once from known-good data and then hand-reviewed. It is not retyped.

**Characterization snapshot** (first commit, generated by the untouched engine):

| Aspect | Choice |
|---|---|
| Verb list (`tests/characterization/fr.verbs.txt`, about 450–500 lemmas) | 84 corpus verbs; every lemma, `except` entry and id in `models.ts`; every lemma in `lexicon.ts`; the 90 app verbs; the derivatives the rewrite fixed; about 80 invented probes at every selector boundary (one per productive suffix and per family suffix, plus near-misses such as bleder, blexer, zenir, blettre) |
| Extra configurations | Reflexive (about 40); `preferredOrthography: 'traditional'` for verbs with any spelling split; the hinted queries from `fr.test.ts` and `query.test.ts`; error cases recorded as `ERR <code>` (e.g. glouloir) |
| Captured per form | Target key, text, part-role string (one letter per part), orthography, auxiliary, pattern, usage, condition, `preferred`, order |
| Captured per verb | `verbId`, classification, `classificationSource`, reflexive, auxiliaries, assumptions, unavailable targets with reason |
| Excluded | `ruleIds`/steps, labels |
| Format | Plain sorted TSV, one block per query: `tests/characterization/{fr,nl}.tsv` |
| Size | Measured: 201 French lemmas give 31,869 forms and 1.8 MB (about 9 KB per verb, 151 KB gzipped). Expect 5–6 MB for French and about 1.5 MB for Dutch (207 corpus verbs measured at 0.82 MB). |
| Intended diffs | `tests/characterization/intended-diffs.json`: `{ query, target, was, now, reason (>30 chars), source (https) }`. The test applies the ledger to the snapshot and requires exact equality. An unused entry fails. The entry count is pinned. |

## G. Dutch migration

| Today | New home | Change |
|---|---|---|
| `nl/exceptions.ts` `dutchExceptions`, `dutchLoans`, separable/inseparable tables | `nl/lexicon.ts` | Data unchanged; `presentCells`/`formalPresent` become cell overrides |
| `nl/orthography.ts` `nativeStem` | `nl/stems.ts` | Split into recorded rules: drop -en, undouble consonant, lengthen vowel, devoice v/z (keeps `underlying`) |
| `weakSuffixes` ('t kofschip), `gePrefix`, `strongPastPlural` | `nl/orthography.ts` plus `nl/stems.ts` (participle prefix) | Each becomes a `rule()` with a Leidraad citation |
| `nl/rules.ts` present/past/participle/imperative | `nl/paradigms.ts` (ending sets) plus `stem`/`ending` hooks | Inversion t-drop becomes a clause rule |
| Compound and future block in `nl/index.ts` | `nl/periphrasis.ts` (six recipes) | Runs through the shared executor; the `wezen` alternate is a variant |
| Subject, reflexive, inversion, particle placement in `nl/index.ts` | `nl/clause.ts` | `pronoun` → subject slots (`u`, `het`, `je`, `ze`, `we` as non-default slots) |
| `availability()`, error checks | Pack `availability` plus `options` schema | Same error codes |
| Catalogue in `src/catalogue.ts` | `nl/catalogue.ts` | Imperative slots become data |

Same safety net: the snapshot covers the 207 corpus verbs, every lexicon lemma, the app's Dutch counterparts with their hints, and invented probes. Queries cover the wildcard, `pronoun: 'u'`, `pronoun: 'het'`, `inversion: true` and reflexive. Dutch goes first: it is already rule-shaped, so it proves the spine before French.

## H. Corpus tooling

```
scripts/corpus/
model.ts                      CorpusCell / CorpusFile / CorpusCorrection / stats
sources/{leconjugueur,verbix-old,verbix-html5,reverso,elconjugador,cactus2000}.ts   one parser per site template
languages/<lang>.ts           { directory, encoding, expectedFiles, parser, sectionMap, fileContext(name), unmodelled[] }
corrections/<lang>.ts         corpusCorrection(file, cell, index)
import.ts  report.ts
tests/fixtures/<lang>.json  corrections/<lang>.json  manifest.json  remaps.json
tests/goldens/<lang>/*.json     independently sourced, same CorpusFile model plus provenance
```

`verbix-html5` is shared by en and it, parameterised by heading map.

```ts
export interface CorpusCell {
target: { mood: string; tense: string; person: Person | null; number: GrammaticalNumber | null;
          agreement: Agreement | null; voice?: Voice };
heading: string;                         // original source heading path, for remap audit
scope: 'modelled' | 'unmodelled';        // unmodelled cells carry a reason code registered in languages/<lang>.ts
original: string; expected: readonly string[];
sourceUnavailable: boolean; availabilityMarker: string | null;
variant: { pattern?: string; region?: string } | null;   // generalises `construction`: -ra/-se, (U)/(E), Reverso alternates
subject: string | null;                                  // generalises `pronoun`
}
```

- **Mislabelled headings** (Reverso Konjunktiv compounds labelled "Präteritum"; verbix subjunctive perfect labelled "Present") are template-level remaps, not corrections. The `sectionMap` is keyed by heading path and occurrence and yields a target with a reason and URL. The parser throws if a file lacks the expected duplicate heading. Remaps are written to `remaps.json` and their count is pinned. This avoids thousands of identical ledger rows while keeping the "every deviation has a reason and an authority" rule.
- **Real source bugs** (shaked, flys, diging, "ho stato", "ihr bewegte") stay per-cell corrections in `corrections/<lang>.ts`, under the same rule as today (reason over 30 characters, https authority).
- **Manifest v2**, per language: files, cells, modelled and unmodelled cells, available and unavailable cells, expected forms, corrections, remaps, placeholders, fixture checksum. Per file: raw-byte `sha256`, encoding, grammatical context. All counts are pinned in the test per language, as today.
- **Corpus cells the engine does not model** stay in the fixture with `scope: 'unmodelled'`. They are counted and pinned (`modelled + unmodelled = cells`), so nothing is skipped silently.
- **Engine features with no corpus counterpart** are caught by a coverage test. Every catalogue entry (× voice) must be covered by modelled corpus cells or by `tests/goldens/<lang>` for a minimum number of verbs. Otherwise the test fails and names the entry.
- **Over-generation guard** for the new languages: where a corpus cell has one form and the engine yields more, every extra must carry a non-default variant tag (pattern, usage, region or orthography). Untagged extras fail.
- **Italian and Latin goldens** must be transcribed from named sources (Allen & Greenough §§ for Latin; Treccani tables for Italian) with a per-file citation, never engine-generated. A person should spot-check them. A model-authored golden is not independent evidence.
- **Pin guarantee.** One revision check, as today. `git status --porcelain -- <SourceFiles>` already covers all seven directories, including untracked files. Add expected file counts and per-file byte hashes. Add `--only <lang>` so one language can be re-imported without rewriting other fixtures; the pin is still verified.
- **Encodings.** Declare them per language and decode with `fatal: true`. I sampled one file per directory: Deutsch is UTF-8; English and Italiano declare UTF-8; Español declares iso-8859-15; Latina declares ISO-8859-1 (both ASCII with entities in the sample). Confirm across all files at import.

## I. Implementation sequence (one branch, one PR)

| # | Commit | Green at this point |
|---|---|---|
| 1 | `test: characterization snapshots for fr and nl` — verb lists, generator script, exact-match test, empty diff ledger. No source change. | Everything, plus the snapshot |
| 2 | `refactor(types): LanguageRegistry, generic options/builder, per-pack catalogue and slots, pack dispatch, declarative option schema, render/onset behind the pack, generic CLI` — the old engines wrapped as packs | Typecheck (including `options.typecheck.ts`), all tests, snapshot unchanged, app compiles |
| 3 | `feat(core): derivation, rule runner, forks, periphrasis executor, clause contract, i18n formatter, explain, sources types` — exercised by a toy test-only pack that touches every stage | Core unit tests; existing behaviour untouched |
| 4 | `refactor(corpus): per-source parsers, per-language modules, manifest v2 with byte hashes` | fr/nl fixture checksums byte-identical |
| 5 | `feat(nl): Dutch on the spine` with en + nl messages and citations | nl snapshot exact, corpus, i18n completeness |
| 6a–c | `feat(fr): …` in shadow mode — productive classes and orthography; then families; then suppletives and defectives. The new pack is compared against the snapshot with a shrinking `fr-pending.txt` ratchet while the old engine still serves `conjugate`. | Ratchet only shrinks; public output unchanged |
| 6d | `feat(fr): switch to the rule-first pack; delete models.ts, table.ts, principal.ts` | fr snapshot exact modulo ledger; corpus; `fr-models.test.ts` rewritten against the lexicon; app tests |
| 7 | `feat(equivalence): concepts, fr/nl maps, matrix snapshot` | Matrix snapshot; fr→nl acceptance |
| 8–12 | `feat(de)`, `feat(en)`, `feat(es)`, `feat(it)`, `feat(la)` — each: pack files, locales, citations, equivalence map, parser, corrections, fixtures, goldens, invented-verb tests | Per-language corpus, goldens, coverage, completeness |
| 13 | `chore: app adaptation, subpath exports, docs (api, grammar per language, architecture replacing PLAN.md), README, version` | Full workspace build and test |

**Parallelism.** After 3 and 4, the work in 5, 6, 7 and 8–12 is independent (use worktrees, merged in order into the one branch). I would still land 5 before fanning out, so the spine is proven on a real language. The shared touch points are one-liners or generated files: `registry.ts`, the packs map, the locale indexes, `package.json` exports, `manifest.json` and `matrix.tsv` (regenerate the last two at each integration).

**Risks and mitigations:**

| Risk | Mitigation |
|---|---|
| The French rebuild regresses silently | Snapshot from commit 1; shadow ratchet; lexicon bootstrapped by script from the validated tables |
| First-principles rules disagree with whitelisted behaviour | Boundary probes in the snapshot; each difference is a ledger entry with a source, reviewed in the PR |
| The core abstraction is shaped by fr/nl and breaks on Latin (voice, deponents, declension) or German (bracket, separable verbs) | The toy pack in commit 3 includes a passive dimension, a separable particle and an agreeing participle. Do Latin or German first among the new languages. |
| Translation volume (about 60–100 rules per language × 2 locales) | Type-level completeness; one message per rule; terms resolved outside ICU; per-(locale, language) files |
| Thin and partly wrong oracles for it/la | Transcribed goldens with citations; the coverage test names uncovered catalogue entries |
| Explanations drift from the computation | Steps are produced by the same rule runner that computes the form; there is no separate explanation path |
| Fixture, snapshot and derivation bloat | Plain TSV (git compresses it); memoised words share step arrays |
| PR size | The commit order is the review order; each commit is independently green |

### Critical Files for Implementation
- <repository root>/packages/conjugation-engine/src/types.ts
- <repository root>/packages/conjugation-engine/src/conjugate.ts
- <repository root>/packages/conjugation-engine/src/languages/fr/models.ts
- <repository root>/packages/conjugation-engine/src/languages/nl/index.ts
- <repository root>/packages/conjugation-engine/scripts/corpus.ts

## Additional notes

These notes hold the detail behind sections F and E. Everything under N1 to N5 was measured by running a read-only script against `packages/conjugation-engine/dist/` (built 24 Nov 11:04, newer than the sources). N6 and N7 are design proposals and were not validated against any catalogue.

### N1. Method and limits of the principal-part analysis

- **Input.** `frenchModels` from `dist/languages/fr/models.js` and `cellTexts` from `dist/languages/fr/table.js`. Only the 94 non-productive models (101 paradigms) were analysed.
- **Representative lemma.** The model's first `lemmas` entry, else its first `suffixes` entry used as if it were an infinitive. For suffix-only families the forms below are therefore relative to the suffix (connaître prints `ait`, `aitrai`; absoudre prints `sout`).
- **Principal parts read.** First alternative of cells 0 (1sg present), 3 (1pl present), 5 (3pl present), 18 (1sg future), 12 (1sg passé simple), 46 (masc. sg. participle), 50 (infinitive).
- **Derivation rules applied.**
- Present singular: ending set chosen from the 1sg (`-e` → e/es/e; `-x` → x/x/t; `-s` → s/s/t, with the `t` dropped after d, t or c). Imperative 2sg is taken as equal to the 1sg.
- 1pl stem: 2pl, imparfait, participe présent, subjunctive 1pl/2pl, imperative 1pl/2pl.
- 3pl stem: subjunctive singular and 3pl.
- Future stem: futur and conditionnel.
- Passé simple: theme vowel detected from the 1sg (`ai`, `is`, `us`, `ins`, `ïs`); gives passé simple and subjunctive imparfait.
- Participle: feminine `+e`, plural `+s` unless it ends in s/x, with final `û` reduced to `u` outside masc. sg.
- **Comparison.** Derived form against the first alternative of each of the 51 cells, in rectified spelling. A cell with more than one alternative is counted separately as an alternate. A cell whose alternatives differ between rectified and traditional is counted as a spelling split.
- **Limits.**
- The script has no subjunctive stem, no flags and no person or tense masks. A missing 1sg makes it predict "no form" for the whole tense, which is why person-restricted verbs show as mismatches.
- It checks first alternatives only.
- Under traditional spelling a few more cells mismatch: one each for accroître, naître, paître, repaître and connaître (the `î` before `t`); absoudre 2; plaire 4; clore 4; enclore 9; gésir 10. Croître has 12 instead of 15.
- **The 19 productive models were not measured.** The claim that they collapse to three ending sets plus orthography rules comes from reading the tables and the earlier rule code (`git show 927302b^:packages/conjugation-engine/src/languages/fr/orthography.ts`, function `erStem`). The French plan should verify it with the shadow comparison.

The script (run with `node --input-type=module -e '…'` from `packages/conjugation-engine`; it writes nothing):

```js
import { frenchModels } from "./dist/languages/fr/models.js";
import { cellTexts } from "./dist/languages/fr/table.js";
const IMPF=["ais","ais","ait","ions","iez","aient"], FUT=["ai","as","a","ons","ez","ont"];
const PS={a:["ai","as","a","âmes","âtes","èrent"],i:["is","is","it","îmes","îtes","irent"],u:["us","us","ut","ûmes","ûtes","urent"],in:["ins","ins","int","înmes","întes","inrent"]};
const SI={a:["asse","asses","ât","assions","assiez","assent"],i:["isse","isses","ît","issions","issiez","issent"],u:["usse","usses","ût","ussions","ussiez","ussent"],in:["insse","insses","înt","inssions","inssiez","inssent"]};
const P=["1s","2s","3s","1p","2p","3p"], ROW=["pres","impf","ps","fut","subj","subjimpf","cond"];
const name=i=>i<42?ROW[Math.floor(i/6)]+"."+P[i%6]:["imp.2s","imp.1p","imp.2p","ppres","pp.ms","pp.fs","pp.mp","pp.fp","inf"][i-42];
function expected(model, paradigm, sp){
const lemma = model.lemmas[0] ?? model.suffixes[0];
const stem = lemma.slice(0, lemma.length - model.strip);
const get = i => cellTexts(stem, paradigm.cells[i], sp, model.kind==="er");
const first = i => { const v=get(i); return v && v.length ? v[0] : null; };
const exp = new Array(51).fill(undefined);
const p1s=first(0);
if(p1s){ let S,e;
  if(p1s.endsWith("e")){S=p1s.slice(0,-1);e=["e","es","e"];}
  else if(p1s.endsWith("x")){S=p1s.slice(0,-1);e=["x","x","t"];}
  else if(p1s.endsWith("s")){S=p1s.slice(0,-1);e=["s","s",/[dtc]$/.test(S)?"":"t"];}
  else {S=p1s;e=["","s",""];}
  exp[0]=S+e[0];exp[1]=S+e[1];exp[2]=S+e[2];exp[42]=p1s; } else {exp[0]=exp[1]=exp[2]=exp[42]=null;}
const p1p=first(3);
if(p1p && p1p.endsWith("ons")){const Q=p1p.slice(0,-3);exp[3]=p1p;exp[4]=Q+"ez";IMPF.forEach((x,i)=>exp[6+i]=Q+x);exp[45]=Q+"ant";exp[27]=Q+"ions";exp[28]=Q+"iez";exp[43]=Q+"ons";exp[44]=Q+"ez";}
else {[3,4,6,7,8,9,10,11,45,27,28,43,44].forEach(i=>exp[i]=p1p?"?":null);}
const p3p=first(5);
if(p3p && p3p.endsWith("ent")){const Q=p3p.slice(0,-3);exp[5]=p3p;exp[24]=Q+"e";exp[25]=Q+"es";exp[26]=Q+"e";exp[29]=Q+"ent";}
else {[5,24,25,26,29].forEach(i=>exp[i]=p3p?"?":null);}
const f=first(18);
if(f && f.endsWith("ai")){const F=f.slice(0,-2);FUT.forEach((x,i)=>exp[18+i]=F+x);IMPF.forEach((x,i)=>exp[36+i]=F+x);}
else {for(let i=18;i<24;i++)exp[i]=null;for(let i=36;i<42;i++)exp[i]=null;}
const ps=first(12);
if(ps){const v=ps.endsWith("ins")?"in":ps.endsWith("ai")?"a":ps.endsWith("is")?"i":ps.endsWith("us")?"u":ps.endsWith("ïs")?"ï":null;
  if(v==="ï"){const Q=ps.slice(0,-2);PS.i.forEach((x,i)=>exp[12+i]=Q+x.replace(/^[iî]/,"ï"));SI.i.forEach((x,i)=>exp[30+i]=Q+x.replace(/^[iî]/,"ï"));}
  else if(v){const Q=ps.slice(0,-PS[v][0].length);PS[v].forEach((x,i)=>exp[12+i]=Q+x);SI[v].forEach((x,i)=>exp[30+i]=Q+x);}
  else {for(let i=12;i<18;i++)exp[i]="?";for(let i=30;i<36;i++)exp[i]="?";}
} else {for(let i=12;i<18;i++)exp[i]=null;for(let i=30;i<36;i++)exp[i]=null;}
const pp=first(46);
if(pp){const b=pp.replace(/û$/,"u");exp[46]=pp;exp[47]=b+"e";exp[48]=/[sx]$/.test(b)?b:b+"s";exp[49]=b+"es";}
else {exp[46]=exp[47]=exp[48]=exp[49]=null;}
exp[50]=first(50);
return {exp,get};
}
for(const m of frenchModels){ if(m.productive) continue;
for(const p of m.paradigms){
  const R=expected(m,p,"rectified"), T=expected(m,p,"traditional");
  const bad=[],alts=[],sp=[];
  for(let i=0;i<51;i++){const a=R.get(i),t=T.get(i);const a0=a&&a.length?a[0]:null;
    if(a0!==R.exp[i]) bad.push(name(i)+"="+a0+" (derived "+R.exp[i]+")");
    if(a&&a.length>1) alts.push(name(i)+"="+a.join("/"));
    if(JSON.stringify(a)!==JSON.stringify(t)) sp.push(name(i)+" r:"+(a?a.join("/"):"-")+" t:"+(t?t.join("/"):"-"));}
  if(!bad.length&&!alts.length&&!sp.length) continue;
  const flags=[m.invariableParticiple&&"invariablePP",m.impersonal&&"impersonal:"+m.impersonal,m.thirdPersonOnly&&"3rdOnly",m.noImperative&&"noImperative",m.compounds!=="all"&&"compounds:"+m.compounds].filter(Boolean).join(",");
  console.log("### "+m.id+(m.paradigms.length>1?"#"+p.pattern:"")+(p.usage!=="standard"?" ("+p.usage+")":"")+(flags?" ["+flags+"]":""));
  if(bad.length) console.log("  residual("+bad.length+"): "+bad.join("; "));
  if(alts.length) console.log("  alternates("+alts.length+"): "+alts.join("; "));
  if(sp.length) console.log("  spelling("+sp.length+"): "+sp.join("; "));
}
}
```

Cell labels used below: `pres`, `impf`, `ps` (passé simple), `fut`, `subj`, `subjimpf`, `cond`, each with `1s`…`3p`; `imp.2s/1p/2p`; `ppres`; `pp.ms/fs/mp/fp`; `inf`.

### N2. Bucket assignment of all 94 non-productive models (101 paradigms)

| Bucket | Count | Members |
|---|---:|---|
| 1. Zero mismatches, no alternates, no spelling split | 56 | ouïr#ouïs, émouvoir, interdire, écrire, lire, cuire, confire, conclure, traire, résoudre, coudre, moudre, craindre, peindre, joindre, prendre, battre, mettre, vaincre, vivre, suivre, boire, croire, acquérir, assaillir, bouillir, cueillir, courir, mourir, ouvrir, endormir, partir, servir, fuir, haïr, tenir, venir, vêtir, voir, prévoir, pourvoir, recevoir, devoir, envoyer, taire, circoncire, frire, maudire, foutre, inclure, prévaloir, ester, férir, issir, rassir, occire |
| 2. Zero mismatches, with spelling split or alternates | 12 | accroître, naître, paître, repaître, connaître, mouvoir, absoudre, asseoir#assois, asseoir#assieds, surseoir, interpeller, ouïr#ois |
| 3. Only the feminine/plural participle differs | 5 | rire, plaire, dormir, suffire, nuire |
| 4. Person-restricted | 7 | falloir, pleuvoir, seoir, messeoir, échoir#échoit, échoir#échet, braire |
| 5. Needs a subjunctive stem | 6 | pouvoir, savoir, valoir, vouloir, faillir#faille, faillir#faux |
| 6. Small | 3 | dire, faillir#faillis, faillir#faudrai |
| 7. Tense-gap defectives | 7 | choir#choirai, choir#cherrai, déchoir, gésir, bruire, clore, enclore |
| 8. Suppletive, plus croître | 5 | être, avoir, aller, faire, croître |

Remarks on bucket 1:

- ester (which also covers accroire, assavoir, bienvenir, courre, malfaire, méfaire, quérir, ravoir), férir, issir, rassir and occire have only an infinitive and/or participle; they are "clean" because every other cell is empty.
- Defectives such as traire, frire and circoncire are clean because their gaps coincide with what the missing principal part predicts.
- prévaloir is clean while valoir is not: its subjunctive is regular.
- None of the 56 carries a model flag.

Model flags in the current inventory (all on non-clean models):

| Model | Flags |
|---|---|
| être | invariableParticiple |
| falloir | invariableParticiple, impersonal: singular, noImperative |
| pleuvoir | invariableParticiple, impersonal: figurativePlural, noImperative |
| pouvoir | invariableParticiple, noImperative |
| gésir | compounds: none |
| seoir, messeoir | invariableParticiple, thirdPersonOnly, compounds: none |
| échoir | thirdPersonOnly |
| paître | compounds: nonFinite |
| rire, plaire, dormir, suffire, nuire, bruire | invariableParticiple |
| faillir | noImperative |
| braire | invariableParticiple, thirdPersonOnly |

Verb-level restrictions outside the models live in `lexicon.ts` (`advenir`: third person only, no imperative; `ensuivre`: third person only).

### N3. Residual cells per model (actual form, with what the six parts would have produced)

**Bucket 8: suppletive**

- **être (24).**
- Present: `es`, `est`, `sommes`, `êtes`, `sont` (1sg `suis` is the principal part).
- Imparfait: all six (`étais … étaient`); participe présent `étant`. The 1pl `sommes` yields no stem.
- Subjunctive: all six (`sois, sois, soit, soyons, soyez, soient`).
- Imperative: `sois, soyons, soyez`.
- Participle: no feminine or plural (covered by the invariable flag).
- Passé simple, future and conditional derive cleanly from `fus` and `serai`.
- **avoir (13).**
- Present: `as`, `a`, `ont`.
- Subjunctive: all six (`aie, aies, ait, ayons, ayez, aient`).
- Imperative: `aie, ayons, ayez`.
- Participe présent: `ayant`.
- **aller (8).**
- Present: `vas`, `va`, `vont`.
- Subjunctive singular and 3pl: `aille, ailles, aille, aillent` (1pl/2pl `allions, alliez` derive from the 1pl stem).
- Imperative 2sg: `va`.
- **faire (9).**
- Present: `faites`, `font`.
- Subjunctive: all six (`fasse … fassent`).
- Imperative 2pl: `faites`.
- With a subjunctive stem `fass-`, three cells remain.
- **croître (15).**
- Passé simple and subjunctive imparfait carry `û` throughout (`crûs, crûs, crût, crûmes, crûtes, crûrent`; `crûsse … crûssent`).
- Rectified participles are `crûe, crûs, crûes` (traditional `crue, crus, crues`).
- Spelling split in 16 cells: future and conditional `croitr-`/`croîtr-`, the three participles, and the infinitive `croitre`/`croître`.

**Bucket 5: subjunctive stem**

- **pouvoir (12).** Subjunctive all six on `puiss-`; no imperative (flag); invariable participle (flag). Alternate: 1sg present `peux/puis`.
- **savoir (10).** Subjunctive all six on `sach-`; imperative `sache, sachons, sachez`; participe présent `sachant`.
- **valoir (4).** Subjunctive singular and 3pl on `vaill-` (1pl/2pl regular).
- **vouloir (4).** Subjunctive singular and 3pl on `veuill-`. Alternates in five cells: subjunctive 1pl `voulions/veuillions`, 2pl `vouliez/veuilliez`; imperative `veux/veuille`, `voulons/veuillons`, `voulez/veuillez`.
- **faillir#faille (9).** Subjunctive all six on `faill-` (`faille … faillent`); no imperative (flag).
- **faillir#faux (9, dated).** Subjunctive all six on `failliss-` although the present is `faux, faux, faut, faillons…`; no imperative (flag).

**Bucket 6: small**

- **dire (2).** `dites` in present 2pl and imperative 2pl.
- **faillir#faillis (3), faillir#faudrai (3).** Only the missing imperative (flag).

**Bucket 4: person-restricted** (forms exist only where listed; a person mask plus stems covers them)

- **falloir.** 3sg only: `faut, fallait, fallut, faudra, faille, fallût, faudrait`. Subjunctive `faille` needs a subjunctive stem.
- **pleuvoir.** 3sg and 3pl: `pleut`; `pleuvait/pleuvaient`; `plut/plurent`; `pleuvra/pleuvront`; `plût/plussent`; `pleuvrait/pleuvraient`; `pleuvant`.
- **seoir.** `sied`; `seyait/seyaient`; `siéra/siéront`; `siérait/siéraient`; participe présent `séant/seyant` (alternate); no passé simple.
- **messeoir.** Same pattern with the prefix: `messied`, `messeyait…`, `messiéra…`, `messéant/messeyant`.
- **échoir#échoit.** `échoit`; `échoyait/échoyaient`; `échut/échurent`; `échoira/échoiront`; `échût/échussent`; `échoirait/échoiraient`; `échéant`.
- **échoir#échet.** `échet`; future `écherra/écherront`; conditional `écherrait/écherraient`; the rest as above.
- **braire.** `brait`; `brayait/brayaient`; `braira/brairont`; `brairait/brairaient`; `brayant`; no passé simple.

**Bucket 7: tense gaps** (cells the stems would produce but the model lacks, unless marked "extra")

- **choir#choirai, choir#cherrai (21 each, dated).**
- No imparfait, no present subjunctive, no imperative, no participe présent.
- Subjunctive imparfait has only the 3sg (`chût`).
- The two paradigms differ only in the future stem (`choir-` / `cherr-`).
- **déchoir (10).** No imparfait, no imperative, no participe présent. Alternates in all twelve future and conditional cells (`déchoir-/décherr-`).
- **gésir (9).** No present subjunctive, no imperative. Spelling split: 3sg `git`/`gît`. No compounds (flag).
- **bruire (9).** This one mixes person and tense gaps.
- Imparfait exists only in 3sg/3pl (`bruissait, bruissaient`).
- Subjunctive 1sg/2sg and imperative 2sg are missing.
- Participe présent `bruissant` is an extra relative to the stems.
- Participle is invariable (flag).
- **clore (3).** Subjunctive 1pl/2pl `closions, closiez` and participe présent `closant` exist although the present has no 1pl. Spelling split: 3sg `clot`/`clôt`.
- **enclore (8).** No imparfait; no imperative 1pl/2pl. Spelling split: 3sg `enclot`/`enclôt`.

**Bucket 3: invariable participle only**

- rire, plaire, dormir, suffire, nuire: the three feminine/plural participle cells are empty. plaire also has the spelling split `plait`/`plaît` in the 3sg.

**Bucket 2: spelling splits and alternates only**

- **accroître, naître, paître, repaître, connaître (14 cells each).** Present 3sg (`-ait`/`-aît`, `accroit`/`accroît`), all twelve future and conditional cells, and the infinitive.
- **mouvoir (1).** Participle `mu`/`mû`.
- **absoudre (2).** Participle masc. sg. `-sout`/`-sous`, masc. pl. `-souts`/`-sous`.
- **asseoir#assois (13).** Future and conditional `assoir-`/`asseoir-`, and the infinitive `assoir`/`asseoir`.
- **asseoir#assieds (1).** Infinitive only.
- **surseoir (13).** Future and conditional `sursoir-`/`surseoir-`, and the infinitive.
- **interpeller (30).** Single `l` in rectified, double in traditional, in every cell whose ending is not mute: present and imperative 1pl/2pl, all imparfait, all passé simple, subjunctive 1pl/2pl, all subjunctive imparfait, participe présent, four participles, infinitive. The mute-ending cells keep `ll` in both spellings.
- **ouïr#ois (12, dated).** Three future stems in every future and conditional cell (`ouïr-/orr-/oir-`).

### N4. What the lexicon entry type needs, as implied by N2 and N3

| Need | Evidence |
|---|---|
| Six principal parts, each optional | Bucket 1, including the infinitive-only and participle-only verbs |
| Several values for one principal part | ouïr#ois and déchoir future stems; seoir participe présent |
| Optional subjunctive stem pair (singular/3pl, and 1pl/2pl) | pouvoir, savoir, faire, valoir, vouloir, aller, falloir, faillir |
| Person mask and per-tense availability mask | Buckets 4 and 7; bruire needs both |
| Cell overrides, including cells present despite a missing stem | être, avoir, aller, faire, dire, savoir, clore, bruire |
| Spelling-dependent stems or orthography rules that fork | Bucket 2, croître, plaire, clore, enclore, gésir |
| Several principal-part sets per family with `pattern` and `usage` | ouïr, choir, échoir, faillir, asseoir |

### N5. Probe results on the current engine (indicative present, 1sg)

| Invented verb | Current output | Model selected |
|---|---|---|
| bleder | je blede | aimer |
| crebler | je creble | aimer |
| pequer | je peque | aimer |
| blefer | je blefe | aimer |
| blexer | je blexe | aimer |
| pléxer | je pléxe | aimer |
| zeter | je zète (rectified), je zette (traditional) | feuilleter |
| zeler | je zèle (rectified), je zelle (traditional) | renouveler |
| gléter | je glète | céder |
| glécer | je glèce | rapiécer |
| glèger | je glège | manger |
| bloyer | je bloie | nettoyer |
| blayer | je blaie, je blaye | payer |
| bleyer | je bleye | grasseyer |
| blouïr | je blouïs | ïr |
| zoudre | je zouds | rendre |
| blettre | je bletts | rendre |
| zaindre | je zains | craindre (lexicon) |
| blaître | je blais | connaître (lexicon) |
| zuire | je zuis | cuire (lexicon) |
| zenir | je zenis | finir |
| zire, zlore, zure, zompre | je zis, je zlos, je zus, je zomps | rompre |
| glouloir | error `AMBIGUOUS_CLASSIFICATION` | none |

Wildcard output sizes: aimer 152 forms, aller 196, werken (nl) 55.

### N6. Equivalence: a wrinkle the plan must resolve

The app's `DIRECT` table in `apps/verbodrome/src/trainer/prompt.ts` maps French to Dutch as follows, and section E names it as the acceptance check:

| French | Dutch |
|---|---|
| indicative.present | indicative.present |
| indicative.perfect | indicative.perfect |
| indicative.imperfect | indicative.past |
| indicative.pluperfect | indicative.pluperfect |
| indicative.simple_past | indicative.past |
| indicative.past_anterior | indicative.pluperfect |
| indicative.future | indicative.future |
| indicative.future_perfect | indicative.future_perfect |
| conditional.present | conditional.present |
| conditional.past | conditional.past |

The `SUBJUNCTIVE` table maps subjunctive present, past, imperfect and pluperfect to Dutch indicative present, perfect, past and pluperfect, shown as a `dat` clause. Near future, recent past, imperatives and non-finite forms are composed by hand in that file.

The example weights in section E (French passé composé: `PAST_PERFECTIVE` 1, `PRESENT_PERFECT` 0.8) do not on their own put the Dutch perfect first. If the Dutch simple past links `PAST_PERFECTIVE` at weight 1, it wins or ties. The plan has to choose one of:

- Dutch weights that favour the perfect for a completed past event (Dutch perfect: `PAST_PERFECTIVE` 1 and `PRESENT_PERFECT` 1; Dutch past: `PAST_PERFECTIVE` below 1, `PAST_IMPERFECTIVE` 1), or
- a fr→nl pair override for `indicative.perfect`.

Two entries are fallbacks by construction. Dutch has no anterior past, so `past_anterior` reaches the pluperfect by relaxing aspect. Dutch has no subjunctive, so the four subjunctive rows relax mood and carry a note.

### N7. Proposed full concept inventory (41 concepts)

This is a proposal. The example tenses for de, en, es, it and la come from general grammar knowledge; those catalogues do not exist yet, and each language's catalogue decides which concepts it links.

Voice is treated as an orthogonal qualifier on the lookup, not as separate concept ids. A Latin passive tense looks up the same concept with `voice: 'passive'`; a target language without a modelled passive returns an approximate match with a note.

Finite indicative (all `finiteness: finite`, `mood: indicative`):

| Id | time | relative | aspect | Typical members |
|---|---|---|---|---|
| PRESENT | present | simultaneous | neutral | fr présent, nl present, de Präsens, en simple present, es/it presente, la present |
| PRESENT_PROGRESSIVE | present | simultaneous | progressive | en present progressive |
| PAST_PERFECTIVE | past | simultaneous | perfective | fr passé simple (literary) and passé composé (spoken), es pretérito perfecto simple, it passato remoto, en simple past, la perfect (historic) |
| PAST_IMPERFECTIVE | past | simultaneous | imperfective | fr imparfait, es/it imperfect, la imperfect; nl past, de Präteritum |
| PAST_PROGRESSIVE | past | simultaneous | progressive | en past progressive |
| PRESENT_PERFECT | present | anterior | neutral | en present perfect, nl perfect, de Perfekt, es pretérito perfecto compuesto, it passato prossimo, fr passé composé |
| PRESENT_PERFECT_PROGRESSIVE | present | anterior | progressive | en |
| PLUPERFECT | past | anterior | neutral | fr plus-que-parfait, nl pluperfect, de Plusquamperfekt, en past perfect, es pluscuamperfecto, it trapassato prossimo, la pluperfect |
| PAST_PERFECT_PROGRESSIVE | past | anterior | progressive | en |
| PAST_ANTERIOR | past | anterior | perfective | fr passé antérieur, es pretérito anterior, it trapassato remoto |
| FUTURE | future | simultaneous | neutral | all seven |
| FUTURE_PROGRESSIVE | future | simultaneous | progressive | en |
| FUTURE_PERFECT | future | anterior | neutral | fr futur antérieur, nl future perfect, de Futur II, en future perfect, es futuro perfecto, it futuro anteriore, la future perfect |
| FUTURE_PERFECT_PROGRESSIVE | future | anterior | progressive | en |
| NEAR_FUTURE | present | posterior | neutral, `remoteness: near` | fr futur proche |
| RECENT_PAST | present | anterior | neutral, `remoteness: near` | fr passé récent |

Conditional (`mood: conditional`):

| Id | time | relative | aspect | Typical members |
|---|---|---|---|---|
| COND_PRESENT | present | simultaneous | neutral | fr conditionnel présent, nl conditional present, de Konjunktiv II / würde form, en conditional, es condicional simple, it condizionale presente |
| COND_PERFECT | present | anterior | neutral | fr conditionnel passé, nl conditional past, de Konjunktiv II Plusquamperfekt, en conditional perfect, es condicional compuesto, it condizionale passato |
| COND_PROGRESSIVE | present | simultaneous | progressive | en |
| COND_PERFECT_PROGRESSIVE | present | anterior | progressive | en |

Subjunctive (`mood: subjunctive`):

| Id | time | relative | Typical members |
|---|---|---|---|
| SUBJ_PRESENT | present | simultaneous | fr, es, it, la; de Konjunktiv I Präsens; en present subjunctive |
| SUBJ_IMPERFECT | past | simultaneous | fr subjonctif imparfait, es imperfecto (-ra/-se), it imperfetto, la imperfect; de Konjunktiv II Präteritum; en past subjunctive |
| SUBJ_PERFECT | present | anterior | fr subjonctif passé, es perfecto, it passato, la perfect; de Konjunktiv I Perfekt |
| SUBJ_PLUPERFECT | past | anterior | fr, es, it trapassato, la; de Konjunktiv II Plusquamperfekt |
| SUBJ_FUTURE | future | simultaneous | es futuro de subjuntivo; de Konjunktiv I Futur I |
| SUBJ_FUTURE_PERFECT | future | anterior | es; de Konjunktiv I Futur II |

Imperative (`mood: imperative`):

| Id | time | relative | Extra | Typical members |
|---|---|---|---|---|
| IMP_PRESENT | present | simultaneous | | all seven |
| IMP_NEGATIVE | present | simultaneous | `polarity: negative` | es, it |
| IMP_FUTURE | future | simultaneous | | la |
| IMP_PERFECT | present | anterior | | fr impératif passé |

Non-finite (`mood: null`):

| Id | finiteness | time / relative | Typical members |
|---|---|---|---|
| INF_PRESENT | infinitive | present / simultaneous | all seven |
| INF_PERFECT | infinitive | present / anterior | fr infinitif passé, la perfect infinitive, de Infinitiv Perfekt, en perfect infinitive, es infinitivo compuesto, it infinito passato |
| INF_FUTURE | infinitive | future / simultaneous | la |
| PART_PRESENT | participle | present / simultaneous | fr, nl, de Partizip I, en, it, la |
| PART_PAST | participle | present / anterior | fr, nl, de Partizip II, en, es, it, la perfect participle |
| PART_PERFECT | participle | present / anterior (compound) | fr "ayant aimé", en "having loved" |
| PART_FUTURE | participle | future / simultaneous | la |
| GERUND | gerund | present / simultaneous | fr gérondif présent, es gerundio, it gerundio presente, la gerund, en -ing form |
| GERUND_PERFECT | gerund | present / anterior | fr gérondif passé, es gerundio compuesto, it gerundio passato |
| GERUNDIVE | verbalAdjective | future / simultaneous | la |
| SUPINE | supine | present / simultaneous | la |
