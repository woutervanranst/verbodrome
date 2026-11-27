import { defaultSubjectsFor } from '../../core/pack.js';
import type { LanguagePack } from '../../core/pack.js';
import { stagedEngine } from '../../core/staged.js';
import { italianCatalogue, italianSubjects } from './catalogue.js';
import { italianGrammar } from './grammar.js';
import { italianOptions } from './options.js';
import { italianRendering } from './rendering.js';
import { italianRules } from './rules.js';
import { italianCitations, italianWorks } from './sources.js';

export const italianPack: LanguagePack<'it'> = {
  language: 'it',
  label: 'Italian',
  catalogue: italianCatalogue,
  rendering: italianRendering,
  options: italianOptions,
  subjects: italianSubjects,
  /** The default slots (or the one named); with `gender`, the gendered slot of the other gender (lui or lei) is left out. */
  subjectsFor(query) {
    const slots = defaultSubjectsFor(italianSubjects, query);
    return query.gender === undefined ? slots : slots.filter(slot => slot.gender === undefined || slot.gender === query.gender);
  },
  genderedTargets: true,
  engine: query => stagedEngine(italianGrammar, italianRendering, query),
  rules: italianRules,
  works: italianWorks,
  citations: italianCitations,
};
