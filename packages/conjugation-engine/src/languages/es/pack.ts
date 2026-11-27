import { variantRank } from '../../core/pack.js';
import type { LanguagePack, SubjectSlot } from '../../core/pack.js';
import { stagedEngine } from '../../core/staged.js';
import { spanishCatalogue, spanishSubjects } from './catalogue.js';
import { spanishGrammar } from './grammar.js';
import { spanishOptions } from './options.js';
import { spanishRendering } from './rendering.js';
import { spanishRules } from './rules.js';
import { spanishCitations, spanishWorks } from './sources.js';

const formal = (slot: SubjectSlot): boolean => slot.register === 'formal';

export const spanishPack: LanguagePack<'es'> = {
  language: 'es',
  label: 'Spanish',
  catalogue: spanishCatalogue,
  rendering: spanishRendering,
  options: spanishOptions,
  subjects: spanishSubjects,
  /**
   * The slot `subject` names; else, with `gender`, every slot of that gender or of none (feminine: yo, tú, ella, usted,
   * nosotras, vosotras, ellas, ustedes); else the default slots plus usted and ustedes, so that an unfiltered query
   * has the formal commands.
   */
  subjectsFor(query) {
    if (query.subject !== undefined) return spanishSubjects.filter(slot => slot.id === query.subject);
    if (query.gender !== undefined) return spanishSubjects.filter(slot => slot.gender === undefined || slot.gender === query.gender);
    return spanishSubjects.filter(slot => slot.default || formal(slot));
  },
  /** Without a `subject`, usted and ustedes appear only in the imperative: elsewhere they repeat the third person. */
  acceptsTarget(query, target) {
    if (query.subject !== undefined || target.mood === 'imperative') return true;
    return !spanishSubjects.some(slot => slot.id === target.subject && formal(slot));
  },
  rank: form => variantRank(form.variant, 'rectified'),
  engine: query => stagedEngine(spanishGrammar, spanishRendering, query),
  rules: spanishRules,
  works: spanishWorks,
  citations: spanishCitations,
};
