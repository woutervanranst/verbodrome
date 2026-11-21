/**
 * CONFIGURATION — app-level settings.
 */
export const APP = {
  /** Answer tickets per question (4–12). Verbs with few forms may show fewer. */
  optionCount: 10,
  /** Move on by itself after a correct answer. */
  autoAdvance: true,
  autoAdvanceMs: 1800,
  /**
   * Optional photo behind the scene, relative to the site root, e.g. 'assets/paris.png'
   * (put the file in `public/assets/`). With `null` the dusk sky is drawn in CSS.
   */
  backdropPhoto: null as string | null,
} as const;
