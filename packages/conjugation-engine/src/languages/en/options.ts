import { ConjugationError } from '../../errors.js';
import type { OptionSchema } from '../../core/options.js';
import type { OptionFieldsOf } from '../../core/spec.js';
import type { EnglishSpec, EnglishStemHints } from './spec.js';

/** English option fields, in validation order (design §2). */
export const englishOptions: OptionSchema<OptionFieldsOf<EnglishSpec>> = {
  fields: {
    stems: { kind: 'stems', words: ['past', 'pastParticiple'], enums: {} },
    // Every English verb takes have; the field exists for schema uniformity and changes nothing.
    auxiliary: { kind: 'enum', values: ['have'] },
    classHint: { kind: 'enum', values: ['regular', 'irregular'] },
    stress: { kind: 'enum', values: ['final', 'nonFinal'] },
    region: { kind: 'enum', values: ['GB', 'US'] },
  },
  check(options) {
    const stems = options.stems as EnglishStemHints | undefined;
    if (stems === undefined) return;
    if (stems.past === undefined || stems.pastParticiple === undefined) {
      throw new ConjugationError('INVALID_HINT', 'The stems hint gives an irregular verb\'s past and pastParticiple together.');
    }
    if (options.classHint === 'regular') {
      throw new ConjugationError('INVALID_HINT', 'A regular verb takes no stems hint: its past and past participle end in -ed.');
    }
  },
};
