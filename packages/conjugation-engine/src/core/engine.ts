import { ConjugationError } from '../errors.js';
import { deepFreeze } from '../parts.js';
import type {
  ConjugatedForm, ConjugationOptions, ConjugationPart, ConjugationResult, GeneratedForm, GrammaticalNumber, Language,
  Person, RenderContext, ResolvedTarget, UnavailableTarget, Voice,
} from '../types.js';
import { parseOptions } from './options.js';
import { packFor } from './pack.js';
import type { CatalogueEntry, LanguagePack } from './pack.js';
import { renderWith } from './render.js';
import { resolvedTargetKey, targetKey } from './target.js';

export interface Engine {
  conjugate(options: unknown): ConjugationResult;
  getCatalogue(language: string): readonly CatalogueEntry[];
  renderParts(language: string, parts: readonly ConjugationPart[], context?: RenderContext): string;
  /** Every grammatical target the query's filters select, in catalogue order. */
  expandTargets(options: Readonly<Record<string, unknown>>): ResolvedTarget[];
  readonly languages: readonly string[];
}

export function catalogueLabels(catalogue: readonly CatalogueEntry[], target: ResolvedTarget): { mood: string; tense: string } {
  const entry = catalogue.find(item => item.mood === target.mood && item.tense === target.tense);
  if (!entry) throw new ConjugationError('GENERATION_FAILURE', `Missing catalogue entry for ${targetKey(target)}.`);
  return { mood: entry.moodLabel, tense: entry.tenseLabel };
}

/** The single person/number slot of a non-finite entry. */
const nonFinite: readonly (readonly [null, null])[] = [[null, null]];

/** The one "voice" of an entry without a voice dimension. */
const noVoice: readonly (Voice | undefined)[] = [undefined];

/** Targets in catalogue order: per entry, voice-major (the whole active paradigm, then the passive), then person/number. */
function expandTargets(pack: LanguagePack, options: Readonly<Record<string, unknown>>): ResolvedTarget[] {
  const targets: ResolvedTarget[] = [];
  for (const entry of pack.catalogue) {
    if (options.mood !== undefined && options.mood !== entry.mood) continue;
    if (options.tense !== undefined && options.tense !== entry.tense) continue;
    const slots: readonly (readonly [Person | null, GrammaticalNumber | null])[] = entry.finite ? entry.persons : nonFinite;
    for (const voice of entry.voices?.length ? entry.voices : noVoice) {
      // Like person on a non-finite entry: asking for a voice excludes entries without one.
      if (options.voice !== undefined && options.voice !== voice) continue;
      for (const [person, number] of slots) {
        if (options.number !== undefined && options.number !== number) continue;
        if (options.person !== undefined && options.person !== person) continue;
        const target: ResolvedTarget = {
          mood: entry.mood, tense: entry.tense, person, number, gender: null, agreement: null, ...(voice ? { voice } : {}),
        };
        if (pack.acceptsTarget && !pack.acceptsTarget(options, target)) continue;
        targets.push(target);
      }
    }
  }
  if (!targets.length) {
    throw new ConjugationError('INVALID_TARGET', 'The grammatical filters do not match any supported target.');
  }
  return targets;
}

/** What makes two forms the same form: target, parts and variant, ignoring spelling system and derivation steps. */
function signature(form: GeneratedForm): string {
  const { orthography: _, ...variant } = form.variant;
  const parts = form.parts.map(({ steps: _steps, ...part }) => part);
  return JSON.stringify([resolvedTargetKey(form.target), parts, variant]);
}

/**
 * An engine over the given packs, keyed by language code; only those languages are accepted.
 * Throws INVALID_REQUEST when a key differs from its pack's `language`.
 */
export function createEngine(packs: Readonly<Record<string, LanguagePack>>): Engine {
  for (const [language, pack] of Object.entries(packs)) {
    if (pack.language !== language) {
      throw new ConjugationError('INVALID_REQUEST', `The pack registered as ${language} is the pack for ${pack.language}.`);
    }
  }
  const registry: Readonly<Record<string, LanguagePack>> = Object.freeze({ ...packs });

  function conjugate(options: unknown): ConjugationResult {
    const query = parseOptions(registry, options);
    const pack = packFor(registry, query.language);
    const targets = expandTargets(pack, query);
    const engine = pack.engine(query);
    const unique = new Map<string, GeneratedForm>();
    const unavailableTargets: UnavailableTarget[] = [];
    let generatedCount = 0;
    for (const target of targets) {
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
        if (pack.acceptsForm && !pack.acceptsForm(query, form)) continue;
        const key = signature(form);
        const previous = unique.get(key);
        if (!previous) unique.set(key, form);
        // The first form keeps its parts and steps. A form with steps keeps the ruleIds its steps derive; a form without
        // steps (French, Dutch) collects the ruleIds of every form that collapsed into it.
        else unique.set(key, {
          ...previous,
          variant: { ...previous.variant, orthography: previous.variant.orthography === form.variant.orthography ? form.variant.orthography : 'both' },
          ruleIds: previous.steps ? previous.ruleIds : [...new Set([...previous.ruleIds, ...form.ruleIds])],
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
    const forms: ConjugatedForm[] = [...byTarget.values()].flatMap(group =>
      group.sort((a, b) => pack.rank(a, query) - pack.rank(b, query)).map((form, index) => ({
        ...form, text: renderWith(pack.rendering, form.parts), preferred: index === 0,
        labels: catalogueLabels(pack.catalogue, form.target),
      })));
    return deepFreeze({
      language: query.language as Language, verbId: engine.verbId, query: query as ConjugationOptions,
      status: forms.length ? unavailableTargets.length ? 'partiallyAvailable' : 'available' : 'unavailable',
      forms, unavailableTargets, analysis: engine.analysis,
    });
  }

  return {
    conjugate,
    getCatalogue: language => packFor(registry, language).catalogue,
    renderParts: (language, parts, context) => renderWith(packFor(registry, language).rendering, parts, context),
    expandTargets: options => expandTargets(packFor(registry, options.language), options),
    languages: Object.freeze(Object.keys(registry)),
  };
}
