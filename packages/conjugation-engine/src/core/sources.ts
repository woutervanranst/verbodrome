/** A grammar or reference work a language pack cites; a pack lists its works once, keyed by `id`. */
export interface Work {
  readonly id: string;
  readonly title: string;
  readonly author?: string;
  readonly year?: number;
  readonly url?: `https://${string}`;
}

/** Where in a work a rule is described: the work's id in `pack.works`, and a locator such as a section or page. */
export interface Citation {
  readonly work: string;
  readonly locator: string;
  readonly url?: `https://${string}`;
}
