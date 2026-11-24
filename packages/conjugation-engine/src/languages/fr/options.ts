import { ConjugationError } from '../../errors.js';
import type { OptionSchema } from '../../core/options.js';
import type { FrenchGender } from './spec.js';

/** French has no neuter, and its participles do not decline. */
const genders = ['masculine', 'feminine'] as const satisfies readonly FrenchGender[];

/** French option fields, in validation order. */
export const frenchOptions: OptionSchema = {
  fields: {
    stems: {
      kind: 'stems',
      words: ['singular', 'plural', 'thirdPlural', 'future', 'past', 'pastParticiple'],
      enums: { pastVowel: ['a', 'i', 'u', 'in'] },
    },
    gender: { kind: 'enum', values: genders },
    auxiliary: { kind: 'enum', values: ['avoir', 'être'] },
    classHint: { kind: 'enum', values: ['er', 'ir', 're'] },
    reflexiveObject: { kind: 'enum', values: ['direct', 'indirect'] },
    aspiratedH: { kind: 'boolean' },
    preferredOrthography: { kind: 'enum', values: ['rectified', 'traditional'] },
    agreement: { kind: 'agreement', required: false, genders },
    precedingDirectObject: { kind: 'agreement', required: true, genders },
    model: { kind: 'word', pattern: /^[\p{L}\p{M}-]+$/u, code: 'INVALID_HINT', message: 'model must be a French model infinitive.' },
  },
  check(options) {
    const future = (options.stems as { future?: unknown } | undefined)?.future;
    if (typeof future === 'string' && !future.endsWith('r')) {
      throw new ConjugationError('INVALID_HINT', 'A French future stem must include its final r.');
    }
  },
};
