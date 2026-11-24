import { ConjugationError } from '../../errors.js';
import type { LanguagePack } from '../../core/pack.js';
import type { ItalianGender, ItalianStemHints } from './spec.js';

const genders = ['masculine', 'feminine'] as const satisfies readonly ItalianGender[];

/** What each stem hint must end in: a future stem in r (vedr), a strong past in i (presi), a participle in o (preso). */
const stemEndings: Readonly<Record<'future' | 'past' | 'participle', readonly [string, string]>> = {
  future: ['r', 'An Italian future stem must include its final r (vedr).'],
  past: ['i', 'An Italian passato remoto hint is the io form, ending in -i (presi).'],
  participle: ['o', 'An Italian past participle hint is the masculine singular form, ending in -o (preso).'],
};

/** Italian option fields, in validation order. */
export const italianOptions: LanguagePack<'it'>['options'] = {
  fields: {
    stems: { kind: 'stems', words: ['past', 'participle', 'future'], enums: { stressedI: [true, false] } },
    auxiliary: { kind: 'enum', values: ['avere', 'essere'] },
    classHint: { kind: 'enum', values: ['isc', 'plain'] },
    reflexive: { kind: 'boolean' },
    gender: { kind: 'enum', values: genders },
  },
  check(options) {
    const stems = (options.stems ?? {}) as ItalianStemHints;
    for (const [key, [ending, message]] of Object.entries(stemEndings)) {
      const value = stems[key as keyof typeof stemEndings];
      if (typeof value === 'string' && !value.endsWith(ending)) throw new ConjugationError('INVALID_HINT', message);
    }
  },
};
