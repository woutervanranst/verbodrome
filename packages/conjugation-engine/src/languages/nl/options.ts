import { ConjugationError } from '../../errors.js';
import type { OptionSchema } from '../../core/options.js';

const prefix = (key: string) => ({
  kind: 'word', pattern: /^[\p{L}\p{M}]+$/u, code: 'INVALID_HINT', message: `${key} must be a nonempty prefix.`,
}) as const;

/** Dutch option fields, in validation order. */
export const dutchOptions: OptionSchema = {
  fields: {
    stems: {
      kind: 'stems',
      words: ['stem', 'pastSingular', 'pastPlural', 'pastParticiple'],
      enums: { pastSuffix: ['d', 't', 'both'], unstressedFinalSyllable: [true, false] },
    },
    auxiliary: { kind: 'enum', values: ['hebben', 'zijn'] },
    classHint: { kind: 'enum', values: ['weak', 'strong', 'loan'] },
    pronoun: { kind: 'enum', values: ['ik', 'jij', 'je', 'u', 'hij', 'zij', 'ze', 'het', 'wij', 'we', 'jullie'] },
    inversion: { kind: 'boolean' },
    reflexive: { kind: 'boolean' },
    separablePrefix: prefix('separablePrefix'),
    inseparablePrefix: prefix('inseparablePrefix'),
  },
  check(options) {
    if (options.separablePrefix !== undefined && options.inseparablePrefix !== undefined) {
      throw new ConjugationError('INVALID_HINT', 'A prefix cannot be both separable and inseparable.');
    }
  },
};
