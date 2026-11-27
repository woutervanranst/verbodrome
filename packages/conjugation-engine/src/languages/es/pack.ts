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
   * The slot `subject` names; else, with `gender`, every slot of that gender or of none (feminine: yo, tú, ella, nosotras,
   * vosotras, ellas); else the default slots. usted and ustedes are formal address: as in every pack, they come only when
   * `subject` names them, in the imperative too.
   */
  subjectsFor(query) {
    if (query.subject !== undefined) return spanishSubjects.filter(slot => slot.id === query.subject);
    if (query.gender !== undefined) return spanishSubjects.filter(slot => !formal(slot) && (slot.gender === undefined || slot.gender === query.gender));
    return spanishSubjects.filter(slot => slot.default);
  },
  /** The gendered slots (él, ella, nosotros, nosotras ...) give their gender to their forms' `target.gender`. */
  genderedTargets: true,
  rank: form => variantRank(form.variant, 'rectified'),
  engine: query => stagedEngine(spanishGrammar, spanishRendering, query),
  rules: spanishRules,
  works: spanishWorks,
  citations: spanishCitations,
};
