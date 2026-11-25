import type { ComparesSpelling } from '../../core/compare.js';
import { variantRank } from '../../core/pack.js';
import type { LanguagePack, SubjectSlot } from '../../core/pack.js';
import { stagedEngine } from '../../core/staged.js';
import type { Agreement } from '../../core/grammar.js';
import type { GeneratedForm } from '../../types.js';
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

/**
 * With the `agreement` option, a declined non-finite form is kept only when every key the query gives matches its
 * agreement; finite forms are always kept (GD §6.3).
 */
function latinAcceptsForm(query: Readonly<Record<string, unknown>>, form: GeneratedForm): boolean {
  const asked = query.agreement as Partial<Agreement> | undefined;
  const agreement = form.target.agreement;
  if (asked === undefined || agreement === null || form.target.person !== null) return true;
  return (asked.gender === undefined || asked.gender === agreement.gender) && (asked.number === undefined || asked.number === agreement.number)
    && (asked.case === undefined || asked.case === agreement.case);
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
  acceptsForm: latinAcceptsForm,
  rank: form => variantRank(form.variant, 'rectified'),
  engine: query => stagedEngine(latinGrammar, latinRendering, query),
  rules: latinRules,
  works: latinWorks,
  citations: latinCitations,
  compareKey: latinKey,
};
