import type { ComparesSpelling } from '../../core/compare.js';
import { variantRank } from '../../core/pack.js';
import type { LanguagePack, SubjectSlot } from '../../core/pack.js';
import { stagedEngine } from '../../core/staged.js';
import { latinCatalogue, latinSubjects } from './catalogue.js';
import { latinGrammar } from './grammar.js';
import { latinKey } from './key.js';
import { latinOptions } from './options.js';
import { latinRendering } from './rendering.js';
import { latinRules } from './rules.js';
import { latinCitations, latinWorks } from './sources.js';

/** The named slot; else the six slots of the asked gender; else the six ungendered default slots (GD §2.2). */
function latinSubjectsFor(query: Readonly<Record<string, unknown>>): readonly SubjectSlot[] {
  if (query.subject !== undefined) return latinSubjects.filter(slot => slot.id === query.subject);
  if (query.gender !== undefined) return latinSubjects.filter(slot => slot.gender === query.gender);
  return latinSubjects.filter(slot => slot.default);
}

export const latinPack: LanguagePack<'la'> & ComparesSpelling = {
  language: 'la',
  label: 'Latin',
  catalogue: latinCatalogue,
  rendering: latinRendering,
  options: latinOptions,
  subjects: latinSubjects,
  subjectsFor: latinSubjectsFor,
  genderedTargets: true,
  acceptsForm: () => true,
  rank: form => variantRank(form.variant, 'rectified'),
  engine: query => stagedEngine(latinGrammar, latinRendering, query),
  rules: latinRules,
  works: latinWorks,
  citations: latinCitations,
  compareKey: latinKey,
};
