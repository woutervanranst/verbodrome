import { ConjugationError } from '../../errors.js';
import type { OptionSchema } from '../../core/options.js';
import type { OptionFieldsOf } from '../../core/spec.js';
import { latinSubjects } from './catalogue.js';
import { latinKey } from './key.js';
import type { LatinGender, LatinSpec } from './spec.js';

const genders = ['masculine', 'feminine', 'neuter'] as const satisfies readonly LatinGender[];

/** A deponent infinitive ends in -rī or -ī (hortārī, sequī); fierī is the active infinitive of fīō. */
export function isDeponentInfinitive(infinitive: string): boolean {
  const key = latinKey(infinitive);
  return key.endsWith('i') && !key.endsWith('fieri');
}

function hint(message: string): never {
  throw new ConjugationError('INVALID_HINT', message);
}

/** Latin option fields, in validation order (GD §2.3). Latin has no choice of auxiliary, so `auxiliary` takes no value. */
export const latinOptions: OptionSchema<OptionFieldsOf<LatinSpec>> = {
  fields: {
    stems: { kind: 'stems', words: ['present', 'perfect', 'supine'], enums: { semiDeponent: [true, false] } },
    classHint: { kind: 'enum', values: ['first', 'second', 'third', 'thirdIo', 'fourth'] },
    voice: { kind: 'enum', values: ['active', 'passive'] },
    gender: { kind: 'enum', values: genders },
    agreement: {
      kind: 'agreement', required: false, genders,
      cases: ['nominative', 'genitive', 'dative', 'accusative', 'ablative', 'vocative'],
    },
    auxiliary: { kind: 'enum', values: [] },
  },
  check(options) {
    const infinitive = String(options.infinitive);
    const deponent = isDeponentInfinitive(infinitive);
    const stems = (options.stems ?? {}) as { present?: string; perfect?: string; supine?: string; semiDeponent?: boolean };
    if (stems.present !== undefined) {
      const present = latinKey(stems.present);
      if (!present.endsWith('o') && !present.endsWith('or')) hint('stems.present must be the first person singular present, ending in -ō or -or.');
      if (present.endsWith('or') && !deponent) hint(`stems.present ends in -or, which belongs to a deponent; ${infinitive} is not a deponent infinitive.`);
      if (present.endsWith('o') && deponent) hint(`stems.present ends in -ō, but ${infinitive} is a deponent infinitive: its first person ends in -or.`);
    }
    if (stems.perfect !== undefined && !latinKey(stems.perfect).endsWith('i')) {
      hint('stems.perfect must be the first person singular perfect, ending in -ī.');
    }
    if (stems.supine !== undefined && !/(?:um|us)$/u.test(latinKey(stems.supine))) {
      hint('stems.supine must be the supine in -um or the perfect participle in -us.');
    }
    if (stems.semiDeponent === true && (deponent || stems.perfect !== undefined)) {
      hint('stems.semiDeponent needs an active infinitive and no stems.perfect: a semi-deponent forms its perfect from the participle.');
    }
    if (options.subject !== undefined && options.gender !== undefined) {
      const slot = latinSubjects.find(subject => subject.id === options.subject);
      if (slot?.gender !== undefined && slot.gender !== options.gender) {
        throw new ConjugationError('INVALID_REQUEST', `The subject ${String(options.subject)} is ${slot.gender}, not ${String(options.gender)}.`);
      }
    }
  },
};
