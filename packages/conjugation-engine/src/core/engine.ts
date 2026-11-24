import { ConjugationError } from '../errors.js';
import { deepFreeze } from '../parts.js';
import type {
  ConjugatedForm, ConjugationOptions, ConjugationPart, ConjugationResult, GeneratedForm, GrammaticalNumber, Language,
  Person, RenderContext, ResolvedTarget, UnavailableTarget, VerbAnalysis, Voice,
} from '../types.js';
import { explainSubject, renderStep } from '../i18n/explain.js';
import type { Explainable, Explanation, StepContext } from '../i18n/explain.js';
import type { Catalog } from '../i18n/catalog.js';
import { parseOptions } from './options.js';
import { defaultSubjectsFor, packFor } from './pack.js';
import type { CatalogueEntry, LanguagePack, SubjectSlot } from './pack.js';
import { renderWith } from './render.js';
import { resolvedTargetKey, targetKey } from './target.js';

export interface Engine {
  conjugate(options: unknown): ConjugationResult;
  getCatalogue(language: string): readonly CatalogueEntry[];
  /** The subject slots of `language`, in the pack's order; empty for a pack without slots. */
  getSubjects(language: string): readonly SubjectSlot[];
  renderParts(language: string, parts: readonly ConjugationPart[], context?: RenderContext): string;
  /** Every grammatical target the query's filters select, in catalogue order. */
  expandTargets(options: Readonly<Record<string, unknown>>): ResolvedTarget[];
  /**
   * A form, an unavailable target or a verb analysis, step by step in the catalog of `locale`. A subject without steps
   * (French and Dutch for now) has no sections. Throws INVALID_REQUEST for a locale the engine has no catalog for and
   * GENERATION_FAILURE for a rule or term without text.
   */
  explain(language: string, subject: Explainable, locale: string): Explanation;
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

/** The one "subject" of a target without a subject slot: a non-finite one, or any target of a pack without slots. */
const noSubject: readonly (SubjectSlot | null)[] = [null];

const noSubjects: readonly SubjectSlot[] = Object.freeze([]);

/**
 * The subject slots a query expands, in the order of the pack's `subjects` whatever order `subjectsFor` returns them
 * in; null for a pack without slots.
 */
function selectedSubjects(pack: LanguagePack, options: Readonly<Record<string, unknown>>): readonly SubjectSlot[] | null {
  const subjects = pack.subjects ?? noSubjects;
  if (!subjects.length) return null;
  const chosen = new Set((pack.subjectsFor?.(options) ?? defaultSubjectsFor(subjects, options)).map(slot => slot.id));
  return subjects.filter(slot => chosen.has(slot.id));
}

/** The slot `target.subject` names, or null for a target without one. */
function subjectOf(pack: LanguagePack, target: ResolvedTarget): SubjectSlot | null {
  return target.subject === undefined ? null : pack.subjects?.find(slot => slot.id === target.subject) ?? null;
}

/**
 * Targets in catalogue order: per entry, voice-major (the whole active paradigm, then the passive), then person/number,
 * then, for a pack with subject slots, one target per selected slot of that person and number.
 */
function expandTargets(pack: LanguagePack, options: Readonly<Record<string, unknown>>): ResolvedTarget[] {
  const selected = selectedSubjects(pack, options);
  const targets: ResolvedTarget[] = [];
  for (const entry of pack.catalogue) {
    if (options.mood !== undefined && options.mood !== entry.mood) continue;
    if (options.tense !== undefined && options.tense !== entry.tense) continue;
    // Like person on a non-finite entry: asking for a subject excludes entries without one.
    if (options.subject !== undefined && !entry.finite) continue;
    const slots: readonly (readonly [Person | null, GrammaticalNumber | null])[] = entry.finite ? entry.persons : nonFinite;
    for (const voice of entry.voices?.length ? entry.voices : noVoice) {
      // Like person on a non-finite entry: asking for a voice excludes entries without one.
      if (options.voice !== undefined && options.voice !== voice) continue;
      for (const [person, number] of slots) {
        if (options.number !== undefined && options.number !== number) continue;
        if (options.person !== undefined && options.person !== person) continue;
        const subjects = selected === null || person === null ? noSubject : selected.filter(slot => slot.person === person && slot.number === number);
        for (const subject of subjects) {
          const target: ResolvedTarget = {
            mood: entry.mood, tense: entry.tense, person, number,
            gender: subject !== null && pack.genderedTargets ? subject.gender ?? null : null,
            agreement: null, ...(voice ? { voice } : {}), ...(subject ? { subject: subject.id } : {}),
          };
          if (pack.acceptsTarget && !pack.acceptsTarget(options, target)) continue;
          targets.push(target);
        }
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
 * An engine over the given packs, keyed by language code; only those languages are accepted. `catalogs` are the message
 * catalogs by locale, each already merged from the core messages and the packs' messages for that locale.
 * Throws INVALID_REQUEST when a key differs from its pack's `language` or a pack declares one subject slot id twice.
 */
export function createEngine(packs: Readonly<Record<string, LanguagePack>>, catalogs: Readonly<Record<string, Catalog>> = {}): Engine {
  for (const [language, pack] of Object.entries(packs)) {
    if (pack.language !== language) {
      throw new ConjugationError('INVALID_REQUEST', `The pack registered as ${language} is the pack for ${pack.language}.`);
    }
    const ids = (pack.subjects ?? noSubjects).map(slot => slot.id);
    const repeated = ids.find((id, index) => ids.indexOf(id) !== index);
    if (repeated !== undefined) throw new ConjugationError('INVALID_REQUEST', `The ${language} pack declares the subject ${repeated} twice.`);
  }
  const registry: Readonly<Record<string, LanguagePack>> = Object.freeze({ ...packs });
  const messages: Readonly<Record<string, Catalog>> = Object.freeze({ ...catalogs });

  function catalogFor(locale: unknown): Catalog {
    const catalog = typeof locale === 'string' && Object.hasOwn(messages, locale) ? messages[locale] : undefined;
    if (!catalog) {
      throw new ConjugationError('INVALID_REQUEST', `Locale must be one of: ${Object.keys(messages).join(', ') || '(none: this engine has no catalogs)'}.`);
    }
    return catalog;
  }

  /**
   * The English context for a staged pack's steps once the engine has an English catalog; otherwise null (the packs' own
   * strings stay). `mood` is the mood a tense term is looked up in.
   */
  function englishContext(pack: LanguagePack, mood: string | null): StepContext | null {
    return pack.rules && Object.hasOwn(messages, 'en') ? { pack, catalog: catalogFor('en'), locale: 'en', mood } : null;
  }

  /** A staged pack's assumptions as English text. Assumptions have no target, so their rules cannot name a tense. */
  function analysisWithText(pack: LanguagePack, analysis: VerbAnalysis): VerbAnalysis {
    const ctx = englishContext(pack, null);
    if (!ctx || !analysis.steps) return analysis;
    const assumptions = analysis.steps.filter(s => s.kind === 'assumption').map(s => renderStep(s, ctx));
    return { ...analysis, assumptions: [...new Set(assumptions)] };
  }

  /** A staged pack's unavailable target with the English sentence of its step as the explanation. */
  function unavailableWithText(pack: LanguagePack, unavailable: UnavailableTarget): UnavailableTarget {
    const ctx = englishContext(pack, unavailable.target.mood);
    return ctx && unavailable.step ? { ...unavailable, explanation: renderStep(unavailable.step, ctx) } : unavailable;
  }

  function conjugate(options: unknown): ConjugationResult {
    const query = parseOptions(registry, options);
    const pack = packFor(registry, query.language);
    const targets = expandTargets(pack, query);
    const engine = pack.engine(query);
    const unique = new Map<string, GeneratedForm>();
    const unavailableTargets: UnavailableTarget[] = [];
    let generatedCount = 0;
    for (const target of targets) {
      const generation = engine.generate(target, subjectOf(pack, target));
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
      forms, unavailableTargets: unavailableTargets.map(u => unavailableWithText(pack, u)), analysis: analysisWithText(pack, engine.analysis),
    });
  }

  return {
    conjugate,
    getCatalogue: language => packFor(registry, language).catalogue,
    getSubjects: language => packFor(registry, language).subjects ?? noSubjects,
    renderParts: (language, parts, context) => renderWith(packFor(registry, language).rendering, parts, context),
    expandTargets: options => expandTargets(packFor(registry, options.language), options),
    explain: (language, subject, locale) => explainSubject(packFor(registry, language), catalogFor(locale), locale, subject),
    languages: Object.freeze(Object.keys(registry)),
  };
}
