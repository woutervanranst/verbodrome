import { conjugate } from 'conjugation-engine';
import type { ConjugatedForm, ConjugationResult } from 'conjugation-engine';
import { TENSES } from '../config/tenses';
import type { TenseDef } from '../config/tenses';

/** One askable French form: the preferred phrase for a tense and grammatical slot. */
export interface FrForm {
  readonly tense: TenseDef;
  /** `1s`…`3p` for finite forms, `-` for non-finite ones. */
  readonly slot: string;
  /** Text as shown on a card, e.g. "j'ai été", "sois !". */
  readonly text: string;
  /** Every accepted spelling/variant for this slot, in card form. Never used as a wrong answer. */
  readonly accepted: readonly string[];
  /** Subject pronoun as rendered ("je", "ils"), or null for subjectless forms. */
  readonly subject: string | null;
  readonly form: ConjugatedForm;
}

export interface VerbForms {
  readonly infinitive: string;
  readonly analysis: ConjugationResult['analysis'];
  /** True when the engine restricts the verb to impersonal "il" (falloir, pleuvoir). */
  readonly impersonal: boolean;
  readonly all: readonly FrForm[];
  readonly byTense: ReadonlyMap<string, readonly FrForm[]>;
}

export const SLOT_ORDER = ['1s', '2s', '3s', '1p', '2p', '3p', '-'] as const;

export function slotOf(form: ConjugatedForm): string {
  const { person, number } = form.target;
  return person === null || number === null ? '-' : `${person}${number === 'singular' ? 's' : 'p'}`;
}

/** Card text: imperatives carry their exclamation mark so they read as commands. */
export function display(form: ConjugatedForm): string {
  return form.target.mood === 'imperative' ? `${form.text} !` : form.text;
}

/** Agreeing participles: keep the dictionary (masculine singular) form only. */
function isBaseAgreement(form: ConjugatedForm): boolean {
  if (form.target.person !== null) return true;
  const agreement = form.target.agreement;
  return agreement === null || (agreement.gender === 'masculine' && agreement.number === 'singular');
}

const cache = new Map<string, VerbForms>();

/**
 * All French forms of a verb, straight from conjugation-engine (one wildcard query).
 * Subjects are masculine, as in a classic conjugation table.
 */
export function verbForms(infinitive: string): VerbForms {
  const cached = cache.get(infinitive);
  if (cached) return cached;

  const result = conjugate({ language: 'fr', infinitive, gender: 'masculine' });
  const grouped = new Map<string, ConjugatedForm[]>();
  for (const form of result.forms) {
    if (!isBaseAgreement(form)) continue;
    const key = `${form.target.mood}.${form.target.tense}|${slotOf(form)}`;
    const list = grouped.get(key);
    if (list) list.push(form); else grouped.set(key, [form]);
  }

  const all: FrForm[] = [];
  const byTense = new Map<string, FrForm[]>();
  for (const tense of TENSES) {
    const forms: FrForm[] = [];
    for (const slot of SLOT_ORDER) {
      const variants = grouped.get(`${tense.id}|${slot}`);
      if (!variants?.length) continue;
      const preferred = variants.find(variant => variant.preferred) ?? variants[0]!;
      forms.push({
        tense, slot,
        text: display(preferred),
        accepted: [...new Set(variants.map(display))],
        subject: preferred.parts.find(part => part.role === 'subject')?.text ?? null,
        form: preferred,
      });
    }
    if (forms.length) byTense.set(tense.id, forms);
    all.push(...forms);
  }

  const value: VerbForms = {
    infinitive,
    analysis: result.analysis,
    impersonal: result.unavailableTargets.some(target => target.reason === 'impersonal'),
    all, byTense,
  };
  cache.set(infinitive, value);
  return value;
}

/** One representative form of a tense, for illustration: "je parlais", "parle !", "parlant". */
export function exampleOf(infinitive: string, tenseId: string): string | null {
  const forms = verbForms(infinitive).byTense.get(tenseId) ?? [];
  return (forms.find(form => form.slot === '1s') ?? forms.find(form => form.slot === '2s') ?? forms[0])?.text ?? null;
}

export function formAt(forms: VerbForms, tenseId: string, slot: string): FrForm | undefined {
  return forms.byTense.get(tenseId)?.find(form => form.slot === slot);
}
