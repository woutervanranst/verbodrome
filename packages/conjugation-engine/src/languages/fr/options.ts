import { ConjugationError } from '../../errors.js';
import type { OptionSchema } from '../../core/options.js';

/** French option fields, in validation order. */
export const frenchOptions: OptionSchema = {
  fields: {
    stems: {
      kind: 'stems',
      words: ['singular', 'plural', 'thirdPlural', 'future', 'past', 'pastParticiple'],
      enums: { pastVowel: ['a', 'i', 'u', 'in'] },
    },
    gender: { kind: 'enum', values: ['masculine', 'feminine'] },
    auxiliary: { kind: 'enum', values: ['avoir', 'être'] },
    classHint: { kind: 'enum', values: ['er', 'ir', 're'] },
    reflexiveObject: { kind: 'enum', values: ['direct', 'indirect'] },
    aspiratedH: { kind: 'boolean' },
    preferredOrthography: { kind: 'enum', values: ['rectified', 'traditional'] },
    agreement: { kind: 'agreement', required: false },
    precedingDirectObject: { kind: 'agreement', required: true },
    model: { kind: 'word', pattern: /^[\p{L}\p{M}-]+$/u, code: 'INVALID_HINT', message: 'model must be a French model infinitive.' },
  },
  check(options) {
    const future = (options.stems as { future?: unknown } | undefined)?.future;
    if (typeof future === 'string' && !future.endsWith('r')) {
      throw new ConjugationError('INVALID_HINT', 'A French future stem must include its final r.');
    }
  },
};
