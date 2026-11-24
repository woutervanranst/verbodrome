import { variantRank } from '../../core/pack.js';
import type { LanguagePack } from '../../core/pack.js';
import type { DutchConjugationOptions, DutchPronoun, GrammaticalNumber, Person } from '../../types.js';
import { dutchCatalogue } from './catalogue.js';
import { resolveDutch } from './index.js';
import { dutchOptions } from './options.js';
import { dutchRendering } from './rendering.js';
import { dutchRules } from './rule-table.js';
import { dutchCitations, dutchWorks } from './sources.js';

function pronounMatches(pronoun: DutchPronoun, person: Person, number: GrammaticalNumber): boolean {
  if (pronoun === 'ik') return person === 1 && number === 'singular';
  if (['jij', 'je', 'u'].includes(pronoun)) return person === 2 && number === 'singular';
  if (pronoun === 'hij' || pronoun === 'het') return person === 3 && number === 'singular';
  if (pronoun === 'wij' || pronoun === 'we') return person === 1 && number === 'plural';
  if (pronoun === 'jullie') return person === 2 && number === 'plural';
  return person === 3;
}

/**
 * The legacy resolver still conjugates; the rules of the staged grammar that is replacing it are declared with their
 * works and citations, which changes no output. The subject slots (`dutchSubjects`) join the pack when the staged
 * grammar serves it: a slot would add `subject` to every finite target.
 */
export const dutchPack: LanguagePack<'nl'> = {
  language: 'nl',
  label: 'Dutch',
  catalogue: dutchCatalogue,
  rendering: dutchRendering,
  options: dutchOptions,
  /** A `pronoun` keeps only the finite slots it can be the subject of. */
  acceptsTarget(query, target) {
    const { pronoun } = query as DutchConjugationOptions;
    return !pronoun || target.person === null || target.number === null || pronounMatches(pronoun, target.person, target.number);
  },
  rank: form => variantRank(form.variant, 'rectified'),
  engine: query => resolveDutch(query as DutchConjugationOptions),
  rules: dutchRules,
  works: dutchWorks,
  citations: dutchCitations,
};
