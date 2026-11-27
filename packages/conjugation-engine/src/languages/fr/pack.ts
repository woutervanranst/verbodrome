import type { LanguagePack } from '../../core/pack.js';
import { stagedEngine } from '../../core/staged.js';
import type { FrenchConjugationOptions } from '../../types.js';
import { frenchCatalogue, frenchSubjects } from './catalogue.js';
import { frenchGrammar } from './grammar.js';
import { frenchOptions } from './options.js';
import { frenchRank } from './rank.js';
import { frenchRendering } from './rendering.js';
import { frenchRules } from './rules.js';
import { frenchCitations, frenchWorks } from './sources.js';

/**
 * French on the staged core (GD): six genderless subject slots whose gender the clause shows form by form (il / elle,
 * je suis allé / allée), so targets are gendered.
 */
export const frenchPack: LanguagePack<'fr'> = {
  language: 'fr',
  label: 'French',
  catalogue: frenchCatalogue,
  rendering: frenchRendering,
  options: frenchOptions,
  subjects: frenchSubjects,
  genderedTargets: true,
  /** An `agreement` filter keeps only participle forms that agree as asked. */
  acceptsForm(query, form) {
    const { agreement } = query as FrenchConjugationOptions;
    if (!agreement || !Object.keys(agreement).length) return true;
    const actual = form.target.agreement;
    return actual !== null
      && (!agreement.gender || actual.gender === agreement.gender)
      && (!agreement.number || actual.number === agreement.number);
  },
  rank: frenchRank,
  engine: query => stagedEngine(frenchGrammar, frenchRendering, query),
  rules: frenchRules,
  works: frenchWorks,
  citations: frenchCitations,
};
