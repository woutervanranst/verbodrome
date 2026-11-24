import { ConjugationError } from '../../errors.js';
import type { OptionSchema } from '../../core/options.js';
import type { OptionFieldsFor } from '../../core/pack.js';

const prefix = (key: string) => ({
  kind: 'word', pattern: /^\p{L}+$/u, code: 'INVALID_HINT', message: `${key} must be a nonempty prefix.`,
}) as const;

/** German option fields, in validation order. */
export const germanOptions: OptionSchema<OptionFieldsFor<'de'>> = {
  fields: {
    stems: {
      kind: 'stems',
      words: ['present2', 'preterite', 'subjunctive', 'participle'],
      enums: { unstressedFirstSyllable: [true, false] },
    },
    auxiliary: { kind: 'enum', values: ['haben', 'sein'] },
    classHint: { kind: 'enum', values: ['weak', 'strong', 'mixed'] },
    separablePrefix: prefix('separablePrefix'),
    inseparablePrefix: prefix('inseparablePrefix'),
  },
  check(options) {
    if (options.separablePrefix !== undefined && options.inseparablePrefix !== undefined) {
      throw new ConjugationError('INVALID_HINT', 'A prefix cannot be both separable and inseparable.');
    }
  },
};
