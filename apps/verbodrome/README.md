# verbodrome (trainer app)

A static single-page trainer for Dutch-speaking pupils drilling French conjugations. A Dutch prompt is shown on a Paris street plaque; the learner picks the right French form from ten métro tickets, then gets a comparison with their answer, the formation rule and the full conjugation.

All forms come from [`conjugation-engine`](../../packages/conjugation-engine/README.md) at runtime. There is no backend.

## Configuration

Everything a teacher or maintainer would want to change lives in `src/config/`:

| File | Controls |
|---|---|
| `verbs.ts` | The verb list: French infinitive, Dutch counterpart, picker group and school level. Adding a verb is one line. |
| `tenses.ts` | At which level each tense is introduced. The list of tenses itself comes from the engine's catalogue. |
| `levels.ts` | The school levels (Lager onderwijs, 1e/2e/3e graad secundair, Extra) and their line colours. Levels are cumulative. |
| `app.ts` | Number of answer tickets, auto-advance, optional backdrop photo. |

The Dutch counterparts in `verbs.ts` are a first pass and should be reviewed by a teacher. A Dutch verb the engine cannot classify on its own takes engine hints there (`separablePrefix`, `inseparablePrefix`, `stems`, …); `complement` adds a fixed word, as in *geboren worden* for `naître`.

### Backdrop photo

By default the dusk sky and rooftops are drawn in CSS/SVG. To use a photo instead, put it in `public/assets/` and set `backdropPhoto: 'assets/paris.png'` in `src/config/app.ts`.

## How it works

`src/trainer/` is plain TypeScript without UI:

- `forms.ts` — French forms of a verb from one wildcard engine query (preferred variant per slot; all accepted variants are remembered so they are never offered as wrong answers).
- `prompt.ts` — the Dutch prompt. Dutch verb forms come from the engine; this arranges them where Dutch has no one-to-one tense (futur proche, passé récent, subjonctif as a *dat*-clause, impératif, non-finite forms).
- `distractors.ts` — plausible wrong answers, made by recombining or editing the engine's grammatical parts (wrong auxiliary, regularised stem, indicative after *que*, …). The engine itself never produces wrong forms.
- `question.ts` — picks verb, tense and person from the selection and assembles the options. The tense name is shown with the prompt only when another selected tense gives the same Dutch prompt.
- `rules.ts`, `diff.ts`, `score.ts`, `selection.ts` — feedback text, highlight, XP/streak, quick-picks.

`src/ui/` holds the React components; `src/styles.css` the look.

Progress (`xp`, `best`) and the chosen traject are kept in the browser's `localStorage`.

## Scripts

```sh
npm run dev -w verbodrome      # dev server (builds the engine first)
npm test -w verbodrome         # trainer logic tests
npm run build -w verbodrome    # static site in dist/
npm run preview -w verbodrome  # serve the built site
```
