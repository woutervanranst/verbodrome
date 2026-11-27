import { variantRank } from '../../core/pack.js';
import type { LanguagePack } from '../../core/pack.js';
import { stagedEngine } from '../../core/staged.js';
import { germanCatalogue, germanSubjects } from './catalogue.js';
import { germanGrammar } from './grammar.js';
import { germanOptions } from './options.js';
import { germanRendering } from './rendering.js';
import { germanRules } from './rules.js';
import { germanCitations, germanWorks } from './sources.js';

/** German: a staged pack whose subject slots include sie, es and formal Sie; generation order decides among equal ranks. */
export const germanPack: LanguagePack<'de'> = {
  language: 'de',
  label: 'German',
  catalogue: germanCatalogue,
  rendering: germanRendering,
  options: germanOptions,
  subjects: germanSubjects,
  rank: form => variantRank(form.variant, 'rectified'),
  engine: query => stagedEngine(germanGrammar, germanRendering, query),
  rules: germanRules,
  works: germanWorks,
  citations: germanCitations,
};
