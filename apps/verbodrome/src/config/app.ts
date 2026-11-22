/**
 * CONFIGURATION — app-level settings.
 */
export const APP = {
  /** Answer cards per question (4–12). Verbs with few forms may show fewer. */
  optionCount: 10,
  /** Move on by itself after a correct answer. */
  autoAdvance: true,
  autoAdvanceMs: 1800,
  /**
   * Optional photo behind the scene, relative to the site root, e.g. 'assets/paris.png'
   * (the file lives in `public/assets/`). With `null` the dusk sky is drawn in CSS.
   */
  backdropPhoto: 'assets/paris.jpg' as string | null,
  /** Verb used to illustrate each tense in the picker ("je parlais"). */
  exampleVerb: 'parler',
} as const;
