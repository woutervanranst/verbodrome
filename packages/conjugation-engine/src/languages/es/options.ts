import type { OptionSchema } from '../../core/options.js';
import type { OptionFieldsFor } from '../../core/pack.js';

/**
 * Spanish option fields, in validation order. A `classHint` that contradicts a listed verb is rejected by `classify`
 * (INVALID_HINT), since the schema does not see the lexicon.
 */
export const spanishOptions: OptionSchema<OptionFieldsFor<'es'>> = {
  fields: {
    stems: { kind: 'stems', words: [], enums: { stress: ['hiatus', 'diphthong'], zc: [true, false] } },
    auxiliary: { kind: 'enum', values: ['haber'] },
    classHint: { kind: 'enum', values: ['regular', 'e-ie', 'o-ue', 'u-ue', 'i-ie', 'e-i'] },
    reflexive: { kind: 'boolean' },
    gender: { kind: 'enum', values: ['masculine', 'feminine'] },
  },
};
