import { variantRank } from '../../core/pack.js';
import type { LanguagePack } from '../../core/pack.js';
import type { FrenchConjugationOptions } from '../../types.js';
import { frenchCatalogue } from './catalogue.js';
import { resolveFrench } from './index.js';
import { frenchOptions } from './options.js';
import { frenchRendering } from './rendering.js';

export const frenchPack: LanguagePack<'fr'> = {
  language: 'fr',
  label: 'French',
  catalogue: frenchCatalogue,
  rendering: frenchRendering,
  options: frenchOptions,
  /** An `agreement` filter keeps only participle forms that agree as asked. */
  acceptsForm(query, form) {
    const { agreement } = query as FrenchConjugationOptions;
    if (!agreement || !Object.keys(agreement).length) return true;
    const actual = form.target.agreement;
    return actual !== null
      && (!agreement.gender || actual.gender === agreement.gender)
      && (!agreement.number || actual.number === agreement.number);
  },
  rank: (form, query) => variantRank(form.variant, (query as FrenchConjugationOptions).preferredOrthography ?? 'rectified'),
  // Resolved at call time rather than captured, so a spy on resolveFrench (tests/errors.test.ts) intercepts it.
  engine: query => resolveFrench(query as FrenchConjugationOptions),
};
