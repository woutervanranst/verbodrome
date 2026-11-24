import { usageRank } from '../../core/fork.js';
import type { LanguagePack } from '../../core/pack.js';
import { stagedEngine } from '../../core/staged.js';
import type { GeneratedForm } from '../../types.js';
import { englishCatalogue, englishSubjects } from './catalogue.js';
import { englishGrammar } from './grammar.js';
import { englishOptions } from './options.js';
import { englishRendering } from './rendering.js';
import { englishRules } from './rules.js';
import { englishCitations, englishWorks } from './sources.js';

/** Whether a form of `region` (null: no region) belongs to the standard the query asks for. */
function inRegion(region: string | null | undefined, wanted: unknown): boolean {
  return region === null || region === undefined || region === wanted;
}

export const englishPack: LanguagePack<'en'> = {
  language: 'en',
  label: 'English',
  catalogue: englishCatalogue,
  rendering: englishRendering,
  subjects: englishSubjects,
  options: englishOptions,
  /** With a `region`, a form spelled for the other region is left out; a form without a region stays. */
  acceptsForm: (query, form) => query.region === undefined || inRegion(form.variant.region, query.region),
  /** Standard before literary usage, then the asked region (British by default) before the other. */
  rank: (form: GeneratedForm, query) => usageRank[form.variant.usage] * 10 + (inRegion(form.variant.region, query.region ?? 'GB') ? 0 : 1),
  engine: query => stagedEngine(englishGrammar, englishRendering, query),
  rules: englishRules,
  works: englishWorks,
  citations: englishCitations,
};
