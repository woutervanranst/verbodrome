# conjugation-engine

A rule-based TypeScript conjugation engine for **French (`fr`)** and **Dutch (`nl`)**, with a small Node CLI and a browser-safe ESM API.

Forms are derived from stems, endings, spelling rules, and auxiliary constructions. Compact lexical data supplies irregular principal parts, verified families, and grammatical restrictions. The production engine does **not** import conjugation tables, read test fixtures, or call an external service. Invented verbs work within the documented regular models.

## Quick start

From a checkout, with Node **22.18 or newer**:

```sh
npm ci
npm run build

npm run cli -- fr ploucer --mood indicative --tense present --person 1 --number plural
# nous plouçons

npm run cli -- nl zorpen --mood indicative --tense past --person 1 --number singular
# ik zorpte
```

The built package exposes `conjugate(options)`:

```ts
import { conjugate, conjugationOptions, renderParts } from 'conjugation-engine';

const result = conjugate({
  language: 'fr',
  infinitive: 'aller',
  mood: 'indicative',
  tense: 'perfect',
  person: 1,
  number: 'plural',
  gender: 'feminine',
});

result.forms[0]?.text; // nous sommes allées
result.forms[0]?.parts; // subject nous, auxiliary sommes, lexicalVerb allées

// The builder constructs the same validated query.
conjugate(
  conjugationOptions('fr', 'aller')
    .indicative('perfect')
    .person(1, 'plural')
    .gender('feminine')
    .build(),
);

const payer = conjugate({
  language: 'fr', infinitive: 'payer',
  mood: 'indicative', tense: 'present', person: 1, number: 'singular',
});
payer.forms.map(form => form.text); // ['je paie', 'je paye']

const form = result.forms[0];
if (form) renderParts('fr', form.parts, { bare: true }); // sommes allées
```

Omitted grammatical filters are **wildcards**:

```ts
conjugate({ language: 'nl', infinitive: 'werken' }); // all supported targets
conjugate({ language: 'fr', infinitive: 'aimer', mood: 'indicative', tense: 'present' });
conjugate({ language: 'fr', infinitive: 'aimer', mood: 'participle', tense: 'past' });
```

Each returned form has its own resolved target, native mood/tense labels, accepted-variant metadata, preferred ordering, and reusable grammatical components. Non-finite forms have `null` person/number; participle agreement is represented separately. Results are immutable and JSON-serializable.

French labels follow Bescherelle terminology. French 1990 spelling is preferred without discarding accepted traditional alternatives. Dutch spelling follows Taalunie's official Leidraad, with grammar from e-ANS. Unknown French `-er`, second-group `-ir`, and modeled `-re` verbs use regular defaults; unknown ordinary Dutch verbs default to weak conjugation. Pronunciation, stress, lexical sense, and irregular classification may need hints.

See [the API reference](docs/api.md) for the complete query contract and CLI flags, [grammar and corpus documentation](docs/grammar.md) for rules, defaults, sources, and limitations, and [the approved implementation plan](PLAN.md).

## CLI

```sh
node dist/cli.js fr aimer --mood indicative --tense present
node dist/cli.js fr aller --mood indicative --tense perfect --person 1 --number plural --gender feminine
node dist/cli.js nl werken --json
node dist/cli.js fr faire --mood subjunctive --tense present --person 2 --number singular --bare
node dist/cli.js --help
```

An installed local package also provides the `conjugation-engine` executable. For one resolved target, plain output is its preferred phrase. Wildcards print labelled variants and any unavailable targets. `--json` returns the full result; `--bare` changes plain presentation only. Invoke the executable or `node dist/cli.js` directly when stdout must contain only JSON, without npm's own script banners.

## Development and corpus coverage

```sh
npm run typecheck
npm test                 # builds first; includes the compiled CLI/package checks
npm run corpus:check     # offline corpus/parser checks and accounting report
```

The test oracle is pinned to VerbodromeX commit `3a9a01de3982049f9267326b4a4bd94f468d9439`.

| Corpus | Files | Base infinitives | Grammatical cells | Form expectations | Unavailable cells |
|---|---:|---:|---:|---:|---:|
| French | 222 | 84 | 26,196 | 23,995 | 2,233 |
| Dutch | 207 | 207 | 10,764 | 10,994 | 118 |

All **36,960 cells** are accounted for, including unavailable forms. The Dutch parser also accounts for **1,030 structural imperative placeholders**. A separate reproducible ledger contains **531 sourced correction/provenance records**; mistakes are corrected explicitly rather than skipped. Independent invented-verb goldens, accepted-variant sets, component recombination, and wildcard equivalence complement corpus inclusion assertions.

Ordinary tests make no grammar-site or corpus network requests. Fixtures and import tooling are development-only and excluded from the npm package. [Corpus refresh instructions and attribution](docs/grammar.md#corpus-provenance-and-refresh) are documented separately.
