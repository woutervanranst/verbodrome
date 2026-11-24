# verbodrome (trainer app)

A static single-page trainer for Dutch-speaking pupils drilling French conjugations. A Dutch prompt is shown large over a Paris backdrop; the learner picks the right French form from ten answer cards (multiple choice) or types it (see [Typing](#typing)), then gets a comparison with their answer, the formation rule and the full conjugation.

All forms come from [`conjugation-engine`](../../packages/conjugation-engine/README.md) at runtime. There is no backend.

## Configuration

Everything a teacher or maintainer would want to change lives in `src/config/`:

| File | Controls |
|---|---|
| `verbs.ts` | The verb list: French infinitive, Dutch counterpart, picker group and school level. Adding a verb is one line. |
| `tenses.ts` | At which level each tense is introduced. The list of tenses itself comes from the engine's catalogue. |
| `levels.ts` | The school levels (Lager onderwijs, 1e/2e/3e graad secundair, Extra) and their line colours. Levels are cumulative. |
| `app.ts` | Number of answer cards, auto-advance, XP bonus for typed answers, the accent buttons under the answer field, optional backdrop photo. |

The Dutch counterparts in `verbs.ts` are a first pass and should be reviewed by a teacher. Per verb you can set:

- engine hints for a Dutch verb the engine cannot classify on its own (`separablePrefix`, `inseparablePrefix`, `stems`, …);
- `complement`: a fixed word before the verb, as in *geboren worden* for `naître`;
- `tail`: a fixed word after the verb, as in *houden van* for `aimer`;
- `exclude`: tense ids never asked for that verb, e.g. `{ exclude: ['indicative.near_future'] }` on `aller` to avoid *hij gaat gaan*.

`tenses.ts` also holds the time axis (nog vroeger → verleden → nu → straks → later) that orders the tenses in the picker. Picking **Extra** selects everything: it sits on top of the 3e graad.

### Backdrop photo

`public/assets/paris.jpg` is the photo from the design. Set `backdropPhoto: null` in `src/config/app.ts` to use the dusk sky drawn in CSS/SVG instead.

## How it works

`src/trainer/` is plain TypeScript without UI:

- `forms.ts` — French forms of a verb from one wildcard engine query (preferred variant per slot; all accepted variants are remembered so they are never offered as wrong answers).
- `prompt.ts` — the Dutch prompt. Dutch verb forms come from the engine; this arranges them where Dutch has no one-to-one tense (futur proche, passé récent, subjonctif as a *dat*-clause, impératif, non-finite forms).
- `distractors.ts` — plausible wrong answers, made by recombining or editing the engine's grammatical parts (wrong auxiliary, regularised stem, indicative after *que*, …). The engine itself never produces wrong forms.
- `question.ts` — picks verb, tense and person from the selection and assembles the options. The tense name is shown with the prompt only when another selected tense gives the same Dutch prompt.
- `question.ts` also keeps the subject fixed: wrong answers taken from other persons are said with the asked subject (*je partent*), so the pronoun never gives the answer away.
- `typed.ts` — checks a typed answer and turns it into the same option a card would be, so the log, repeats, feedback and report treat both ways of answering alike (see [Typing](#typing)).
- `coach.ts` — decides what to ask next from the answer log, and schedules missed questions to come back. Its `COACH` constant holds the tuning (see below).
- `report.ts` — the numbers behind "Mijn resultaten".
- `rules.ts`, `diff.ts`, `score.ts`, `selection.ts` — feedback text, highlight, XP/streak, quick-picks.

`src/ui/` holds the React components; `src/styles.css` the look.

### Typing

The first section of the picker, **Antwoorden**, switches between *Multiple choice* and *Typen*. In typing mode the learner types the whole phrase (*j'ai parlé*, *que nous soyons*, *parle !*) into one field; buttons under it insert é è ê ë à â î ï ô û ù ç œ at the caret. Enter checks the answer, Enter or Space goes on.

A typed answer is checked in this order:

1. **Right** when it matches the form or one of its accepted spellings. Capitals, extra spaces, the kind of apostrophe and a closing `!` do not count.
2. **A wrong answer a card could have shown** — another person, another tense, a made-up trap — gets exactly that card's label (*verward met imparfait*, *vorm van een andere persoon*, *verkeerd hulpwerkwoord*, …). Other persons count with their own subject too (*nous partons* for *je pars*).
3. **Accents:** the right letters with accents left out is *accent vergeten* (the same category as the card trap); a different accent is *verkeerd accent*. Both are wrong answers.
4. **The same with an accent off:** a card's wrong answer typed without its accents is named after the bigger mistake.
5. Anything else is a **spelfout**.

A right typed answer earns `typedXpFactor` (1.5×) the XP. A typed *spelfout* that comes back as a repeat is not shown as a card if the learner switches back to multiple choice.

### The coach

- **Repeats.** A missed question returns after 4–8 other questions, with the card that was wrongly picked among the options again. Answered right, it returns once more 15 questions later and is then cleared; missed again, it starts over. At most one question in three is a repeat. The feedback says whether it was the exact same mistake, the same kind, a different one, or right this time.
- **What needs work.** Every tense and every verb has a skill between 0 and 1 that follows recent answers. Weak tenses and verbs are drawn about three times as often as strong ones; tenses answered fewer than twice get a bonus so they are tried early.
- **Easy ones.** After two misses in a row, the next two questions take the strongest tense and a verb that goes well. They are not announced.

### Storage

Everything is kept in the browser's `localStorage`, on the learner's own device, through `src/storage/store.ts`:

| Key | Contents |
|---|---|
| `verbodrome:v2:settings` | chosen verbs and tenses, answer mode (`cards` or `typing`), first-visit flag |
| `verbodrome:v2:progress` | XP and record streak |
| `verbodrome:v2:history` | answer log (last 5000 answers, typed ones marked `typed`) and the questions waiting to be repeated |

Each document is validated when read, so damaged or outdated data falls back to defaults. Values from the first version (`fr-conj-v1`, `verbodrome-traject-v1`, `verbodrome-welkom-v1`) are carried over once.

## Scripts

```sh
npm run dev -w verbodrome      # dev server (builds the engine first)
npm test -w verbodrome         # trainer logic tests
npm run build -w verbodrome    # static site in dist/
npm run preview -w verbodrome  # serve the built site
```
