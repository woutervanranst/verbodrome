# Verbodrome

Franse vervoegingen oefenen, voor Vlaamse scholen. Two parts in one npm workspace:

| Path | What |
|---|---|
| [`packages/conjugation-engine`](packages/conjugation-engine/README.md) | Standalone rule-based French/Dutch conjugation engine (TypeScript, browser-safe ESM, CLI). No UI, no exercise logic. Any app can depend on it. |
| [`apps/verbodrome`](apps/verbodrome/README.md) | The trainer: a static single-page site built on `conjugation-engine`. Dutch prompt, French answers, picker for verbs and tenses per school level. |

The engine is leading: the app contains no conjugation tables. Verbs, tenses and school levels are configuration in `apps/verbodrome/src/config/`.

## Getting started

Node 22.18 or newer.

```sh
npm ci
npm run dev        # build the engine, then serve the app locally
npm test           # engine tests, then app tests
npm run typecheck
npm run build      # static site in apps/verbodrome/dist
```

## Hosting

`apps/verbodrome/dist` is a plain static site with relative paths; it works on any static host and under a sub-path.

`.github/workflows/pages.yml` deploys it to GitHub Pages on every push to `main`. One-time setup: repository **Settings → Pages → Source: GitHub Actions**.
