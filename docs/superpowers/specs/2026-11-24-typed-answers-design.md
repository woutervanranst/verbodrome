# Typed answers — design

## Intent

Picking a card tests recognition; typing the French form tests **recall**. Typing is a second, harder way to answer that the learner switches on. Questions, the coach, repeats and "Mijn resultaten" stay the same; only the answering step differs.

## Decided

- **Whole phrase.** The field starts empty; the learner types subject and verb (`j'ai parlé`, `que nous soyons`, `parle !`).
- **Accents count.** A missing accent is wrong (`accent vergeten`, the same category as the existing card trap); a different accent is wrong (`verkeerd accent`). Both come back as repeats.
- **Where to switch.** First section of the picker, above *Tijden*: "Antwoorden — Kies hoe je je antwoorden wil geven: multiple choice of zelf typen." with a sliding **Multiple choice | Typen** switch. Saved with the settings.
- **Field.** Placeholder in the field's own serif, italic and muted, so it sits on the caret's line.

## Calls made while building (easy to change)

- Ignored when checking: capitals, spacing, apostrophe style, a closing `!`.
- ×1.5 XP for a right typed answer (`APP.typedXpFactor`).
- Enter checks; Enter or Space goes on. Digits are typed, not card picks.
- Accent buttons `é è ê ë à â î ï ô û ù ç œ` (`APP.accentKeys`).
- A typed *spelfout* is not re-offered as a card in a later repeat; accent slips are.
- A real form with the same Dutch meaning in a tense outside the selection counts as a wrong tense.
- Logged answers carry `typed: true`.

## Approaches

1. **Chosen:** turn the typed text into the same `Option` a card produces (`correct`, `label`, `nl`, `kind`). Log, repeats, feedback and report work unchanged, and a typed slip that matches a card's trap gets that card's label.
2. Rejected: a separate typed-answer type threaded through log, repeats, feedback and report — touches everything for no gain.

## Known limits

- An agreement slip (`nous sommes allé`) is a *spelfout*: there is no agreement trap among the card distractors yet.
