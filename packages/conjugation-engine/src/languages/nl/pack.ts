import { variantRank } from '../../core/pack.js';
import type { LanguagePack } from '../../core/pack.js';
import { stagedEngine } from '../../core/staged.js';
import { dutchCatalogue, dutchSubjects, dutchSubjectsFor } from './catalogue.js';
import { dutchGrammar } from './grammar.js';
import { dutchOptions } from './options.js';
import { dutchRendering } from './rendering.js';
import { dutchRules } from './rules.js';
import { dutchCitations, dutchWorks } from './sources.js';

/**
 * Dutch on the staged core: every form is derived by the recorded rules of `grammar.ts` and explains itself. A target is
 * one subject slot (`dutchSubjects`); the `pronoun` option selects the slots with that pronoun, the `subject` option one
 * slot.
 */
export const dutchPack: LanguagePack<'nl'> = {
  language: 'nl',
  label: 'Dutch',
  catalogue: dutchCatalogue,
  rendering: dutchRendering,
  options: dutchOptions,
  subjects: dutchSubjects,
  subjectsFor: dutchSubjectsFor,
  rank: form => variantRank(form.variant, 'rectified'),
  engine: query => stagedEngine(dutchGrammar, dutchRendering, query),
  rules: dutchRules,
  works: dutchWorks,
  citations: dutchCitations,
};
