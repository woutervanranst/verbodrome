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

/** 0 for the form marked for the asked region, 1 for an unmarked one, 2 for the other region; without a region, GB as unmarked. */
function regionRank(region: string | null, wanted: unknown): number {
  if (wanted === 'GB' || wanted === 'US') return region === wanted ? 0 : region === null ? 1 : 2;
  return region === 'US' ? 1 : 0;
}

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
  /** The gendered third person singular slots (er / sie / es, he / she / it) give their gender to their forms' `target.gender`. */
  genderedTargets: true,
  options: englishOptions,
  /** With a `region`, a form spelled for the other region is left out; a form without a region stays. */
  acceptsForm: (query, form) => query.region === undefined || inRegion(form.variant.region, query.region),
  /**
   * Standard before literary usage; then, with a `region`, the form marked for it before an unmarked one (ageing for GB,
   * kidnaped for US); without one, unmarked and British forms before American ones (the pack's British default). Forms
   * that tie keep the lexicon's order: LDOCE's, or AHD's first form for `region: 'US'` (burned).
   */
  rank: (form: GeneratedForm, query) => usageRank[form.variant.usage] * 10 + regionRank(form.variant.region ?? null, query.region),
  engine: query => stagedEngine(englishGrammar, englishRendering, query),
  rules: englishRules,
  works: englishWorks,
  citations: englishCitations,
};
