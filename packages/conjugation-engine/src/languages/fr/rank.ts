/**
 * The order of the forms of one French target (GD §6.4): standard before literary before dated usage, the preferred
 * spelling first (`preferredOrthography`, rectified by default); then, among forms equal in both, a verb's paradigms in
 * order and, within one paradigm, its avoir forms before its être forms. The last key matters only for a verb with
 * two auxiliaries and two conditional pasts of the same usage (the dated paradigms of choir and faillir), where the
 * engine builds the constructions before the auxiliaries.
 */
import { variantRank } from '../../core/pack.js';
import type { FrenchConjugationOptions, GeneratedForm } from '../../types.js';
import { familyFor } from './classify.js';
import { canonicalLemma } from './lexicon.js';

/** The position of the paradigm a form comes from, by the first label of its pattern. */
function paradigmIndex(form: GeneratedForm, query: Readonly<Record<string, unknown>>): number {
  const label = form.variant.pattern?.split('.')[0];
  if (label === undefined) return 0;
  if (label === 'keep-y') return 1;
  const lemma = canonicalLemma(String(query.infinitive).replace(/^(se |s')/u, ''));
  const index = familyFor(lemma)?.family.paradigms.findIndex(paradigm => paradigm.pattern === label) ?? -1;
  return Math.max(index, 0);
}

export function frenchRank(form: GeneratedForm, query: Readonly<Record<string, unknown>>): number {
  const base = variantRank(form.variant, (query as FrenchConjugationOptions).preferredOrthography ?? 'rectified');
  const auxiliary = form.variant.auxiliary;
  if (auxiliary !== 'avoir' && auxiliary !== 'être') return base;
  return base + paradigmIndex(form, query) * 0.01 + (auxiliary === 'être' ? 0.001 : 0);
}
