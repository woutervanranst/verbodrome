import { expandTargets, labelsFor, resolvedTargetKey, targetKey } from './catalogue.js';
import { ConjugationError } from './errors.js';
import { resolveFrench } from './languages/fr/index.js';
import { resolveDutch } from './languages/nl/index.js';
import { parseConjugationOptions } from './options.js';
import { deepFreeze } from './parts.js';
import { renderParts } from './render.js';
import type { ConjugatedForm, ConjugationOptions, ConjugationResult, GeneratedForm, UnavailableTarget } from './types.js';

function signature(form: GeneratedForm): string {
  const { orthography: _, ...variant } = form.variant;
  return JSON.stringify([resolvedTargetKey(form.target), form.parts, variant]);
}

function matchesAgreement(options: ConjugationOptions, form: GeneratedForm): boolean {
  if (options.language !== 'fr' || !options.agreement || !Object.keys(options.agreement).length) return true;
  const agreement = form.target.agreement;
  return agreement !== null
    && (!options.agreement.gender || agreement.gender === options.agreement.gender)
    && (!options.agreement.number || agreement.number === options.agreement.number);
}

export function conjugate(options: ConjugationOptions): ConjugationResult {
  const query = parseConjugationOptions(options);
  const engine = query.language === 'fr' ? resolveFrench(query) : resolveDutch(query);
  const unique = new Map<string, GeneratedForm>();
  const unavailableTargets: UnavailableTarget[] = [];
  let generatedCount = 0;
  for (const target of expandTargets(query)) {
    const generation = engine.generate(target);
    if (!generation.forms.length && !generation.unavailable.length) {
      throw new ConjugationError('GENERATION_FAILURE', `No generation or availability decision for ${targetKey(target)}.`);
    }
    unavailableTargets.push(...generation.unavailable);
    generatedCount += generation.forms.length;
    for (const form of generation.forms) {
      if (targetKey(form.target) !== targetKey(target) || !form.parts.length) {
        throw new ConjugationError('GENERATION_FAILURE', 'The language adapter returned an invalid target or empty components.');
      }
      if (!matchesAgreement(query, form)) continue;
      const key = signature(form);
      const previous = unique.get(key);
      if (!previous) unique.set(key, form);
      else unique.set(key, {
        ...previous,
        variant: { ...previous.variant, orthography: previous.variant.orthography === form.variant.orthography ? form.variant.orthography : 'both' },
        ruleIds: [...new Set([...previous.ruleIds, ...form.ruleIds])],
      });
    }
  }
  if (!unique.size && generatedCount > 0) {
    throw new ConjugationError('INVALID_TARGET', 'The agreement filters do not match any compatible form.');
  }
  const byTarget = new Map<string, GeneratedForm[]>();
  for (const form of unique.values()) {
    const key = resolvedTargetKey(form.target);
    const group = byTarget.get(key) ?? [];
    group.push(form);
    byTarget.set(key, group);
  }
  const spelling = query.language === 'fr' ? query.preferredOrthography ?? 'rectified' : 'rectified';
  const rank = (form: GeneratedForm): number =>
    (form.variant.usage === 'standard' ? 0 : form.variant.usage === 'literary' ? 10 : 20)
    + (form.variant.orthography === 'both' || form.variant.orthography === spelling ? 0 : 1);
  const forms: ConjugatedForm[] = [...byTarget.values()].flatMap(group =>
    group.sort((a, b) => rank(a) - rank(b)).map((form, index) => ({
      ...form, text: renderParts(query.language, form.parts), preferred: index === 0,
      labels: labelsFor(query.language, form.target),
    })));
  return deepFreeze({
    language: query.language, verbId: engine.verbId, query,
    status: forms.length ? unavailableTargets.length ? 'partiallyAvailable' : 'available' : 'unavailable',
    forms, unavailableTargets, analysis: engine.analysis,
  });
}
