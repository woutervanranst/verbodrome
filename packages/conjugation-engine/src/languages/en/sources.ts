import type { Citation, Work } from '../../core/sources.js';
import type { englishRules } from './rules.js';

/** The works the English pack cites (design §1). */
export const englishWorks = {
  cgel: {
    id: 'cgel', title: 'The Cambridge Grammar of the English Language', author: 'Rodney Huddleston and Geoffrey K. Pullum', year: 2002,
    url: 'https://doi.org/10.1017/9781316423530',
  },
  quirk: {
    id: 'quirk', title: 'A Comprehensive Grammar of the English Language',
    author: 'Randolph Quirk, Sidney Greenbaum, Geoffrey Leech and Jan Svartvik', year: 1985,
  },
  dfe: {
    id: 'dfe', title: 'The national curriculum in England: English Appendix 1: Spelling', author: 'Department for Education', year: 2013,
    url: 'https://assets.publishing.service.gov.uk/media/5a7ccc06ed915d63cc65ce61/English_Appendix_1_-_Spelling.pdf',
  },
  utwente: {
    id: 'utwente', title: 'English Style Guide: Tricky spelling of common words', author: 'University of Twente Language Centre',
    url: 'https://www.utwente.nl/en/language-centre/translation-editing-services/english-styleguide/tricky/spelling/',
  },
  ldoce: { id: 'ldoce', title: 'Longman Dictionary of Contemporary English Online', author: 'Pearson Longman', url: 'https://www.ldoceonline.com/' },
  ahd: {
    id: 'ahd', title: 'The American Heritage Dictionary of the English Language, 5th edition', author: 'Houghton Mifflin Harcourt',
    url: 'https://www.ahdictionary.com/',
  },
} as const satisfies Record<string, Work>;

/** Where each rule is described. */
export const englishCitations = {} as const satisfies Record<keyof typeof englishRules, Citation | readonly Citation[]>;
