import { ConjugationError } from '../errors.js';
import { deepFreeze } from '../parts.js';
import type {
  ConjugatedForm, ConjugationOptions, ConjugationOptionsFor, ConjugationPart, ConjugationResult, GeneratedForm, GrammaticalNumber, Language,
  Person, RenderContext, ResolvedTarget, UnavailableTarget, VerbAnalysis, Voice,
} from '../types.js';
import { explainSubject, renderStep } from '../i18n/explain.js';
import type { Explainable, Explanation, StepContext } from '../i18n/explain.js';
import type { Catalog } from '../i18n/catalog.js';
import { comparisonKey } from './compare.js';
import { parseOptions } from './options.js';
import { defaultSubjectsFor, packFor, variantRank } from './pack.js';
import type { CatalogueEntry, LanguagePack, SubjectSlot } from './pack.js';
import { renderWith } from './render.js';
import { resolvedTargetKey, targetKey } from './target.js';

export interface Engine {
  /** Any query; it is validated at run time. An engine from `createEngine` types it (`TypedEngine`). */
  conjugate(options: unknown): ConjugationResult;
  getCatalogue(language: string): readonly CatalogueEntry[];
  /** The subject slots of `language`, in the pack's order; empty for a pack without slots. */
  getSubjects(language: string): readonly SubjectSlot[];
  renderParts(language: string, parts: readonly ConjugationPart[], context?: RenderContext): string;
  /** Every grammatical target the query's filters select, in catalogue order. */
  expandTargets(options: Readonly<Record<string, unknown>>): ResolvedTarget[];
  /**
   * A form, an unavailable target or a verb analysis, step by step in the catalog of `locale`. A subject without steps
   * has no sections. Throws INVALID_REQUEST for a locale the engine has no catalog for and
   * GENERATION_FAILURE for a rule or term without text.
   */
  explain(language: string, subject: Explainable, locale: string): Explanation;
  /** The key answers in `language` are compared by: the pack's `compareKey`, or `plainComparisonKey`. */
  normalizeForComparison(language: string, text: string): string;
  readonly languages: readonly string[];
}

/**
 * The query an engine over the languages `L` accepts: the typed options of a registered language (`ConjugationOptionsFor`),
 * or, for a pack that is not registered (a pack under development, the test toy), any object.
 */
export type EngineQuery<L extends string> = L extends Language ? ConjugationOptionsFor<L> : Readonly<Record<string, unknown>>;

/** The engine `createEngine` builds over the languages `L`: `conjugate` takes the typed query of each of them. */
export interface TypedEngine<L extends string> extends Engine {
  conjugate(options: EngineQuery<L>): ConjugationResult;
}

export function catalogueLabels(catalogue: readonly CatalogueEntry[], target: ResolvedTarget): { mood: string; tense: string } {
  const entry = catalogue.find(item => item.mood === target.mood && item.tense === target.tense);
  if (!entry) throw new ConjugationError('GENERATION_FAILURE', `Missing catalogue entry for ${targetKey(target)}.`);
  return { mood: entry.moodLabel, tense: entry.tenseLabel };
}

/** The one "voice" of an entry without a voice dimension. */
const noVoice: readonly (Voice | undefined)[] = [undefined];

/** The voices a target key can name after its person and number. */
const voiceNames: readonly Voice[] = ['active', 'passive'];

const noSubjects: readonly SubjectSlot[] = Object.freeze([]);

/**
 * The subject slots a query expands, in the order of the pack's `subjects` whatever order `subjectsFor` returns them
 * in; null for a pack without slots.
 */
function selectedSubjects(pack: LanguagePack, options: Readonly<Record<string, unknown>>): readonly SubjectSlot[] | null {
  const subjects = pack.subjects ?? noSubjects;
  if (!subjects.length) return null;
  const chosen = new Set((pack.subjectsFor?.(options) ?? defaultSubjectsFor(subjects, options)).map(slot => slot.id));
  const declared = new Set(subjects.map(slot => slot.id));
  const unknown = [...chosen].find(id => !declared.has(id));
  if (unknown !== undefined) {
    throw new ConjugationError('GENERATION_FAILURE', `The ${pack.language} pack's subjectsFor returned the slot ${unknown}, which the pack does not declare in subjects.`);
  }
  return subjects.filter(slot => chosen.has(slot.id));
}

/** The slot `target.subject` names, or null for a target without one. */
function subjectOf(pack: LanguagePack, target: ResolvedTarget): SubjectSlot | null {
  return target.subject === undefined ? null : pack.subjects?.find(slot => slot.id === target.subject) ?? null;
}

/** One person, number and subject slot an entry's targets are made for; all null for a non-finite entry. */
interface Candidate {
  readonly person: Person | null;
  readonly number: GrammaticalNumber | null;
  readonly subject: SubjectSlot | null;
}

/**
 * What an entry expands to before the voice: its `slots` among the selected ones, each at its own person and number;
 * otherwise each of its persons, with every selected slot of that person and number (or none, for a pack without slots).
 */
function candidatesOf(entry: CatalogueEntry, selected: readonly SubjectSlot[] | null): Candidate[] {
  if (!entry.finite) return [{ person: null, number: null, subject: null }];
  if (selected === null) return entry.persons.map(([person, number]) => ({ person, number, subject: null }));
  const { slots } = entry;
  if (slots !== undefined) return selected.filter(slot => slots.includes(slot.id)).map(subject => ({ person: subject.person, number: subject.number, subject }));
  return entry.persons.flatMap(([person, number]) =>
    selected.filter(slot => slot.person === person && slot.number === number).map(subject => ({ person, number, subject })));
}

/**
 * Targets in catalogue order: per entry, voice-major (the whole active paradigm, then the passive), then person/number,
 * then, for a pack with subject slots, one target per selected slot of that person and number. An entry that lists
 * `slots` has exactly those of the selected slots, each at its own person and number.
 */
function expandTargets(pack: LanguagePack, options: Readonly<Record<string, unknown>>): ResolvedTarget[] {
  const selected = selectedSubjects(pack, options);
  const targets: ResolvedTarget[] = [];
  for (const entry of pack.catalogue) {
    if (options.mood !== undefined && options.mood !== entry.mood) continue;
    if (options.tense !== undefined && options.tense !== entry.tense) continue;
    // Like person on a non-finite entry: asking for a subject excludes entries without one.
    if (options.subject !== undefined && !entry.finite) continue;
    const candidates = candidatesOf(entry, selected);
    for (const voice of entry.voices?.length ? entry.voices : noVoice) {
      // Like person on a non-finite entry: asking for a voice excludes entries without one.
      if (options.voice !== undefined && options.voice !== voice) continue;
      for (const { person, number, subject } of candidates) {
        if (options.number !== undefined && options.number !== number) continue;
        if (options.person !== undefined && options.person !== person) continue;
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
 * Throws INVALID_REQUEST when a key differs from its pack's `language`, a pack declares one subject slot id twice or an id
 * that clashes with a voice name or contains `/`, or a catalogue entry lists a slot the pack does not declare,
 * has slots though it is not finite, or is finite with an empty slots list.
 */
export function createEngine<const P extends Readonly<Record<string, LanguagePack>>>(packs: P, catalogs: Readonly<Record<string, Catalog>> = {}): TypedEngine<keyof P & string> {
  for (const [language, pack] of Object.entries(packs)) {
    if (pack.language !== language) {
      throw new ConjugationError('INVALID_REQUEST', `The pack registered as ${language} is the pack for ${pack.language}.`);
    }
    const ids = (pack.subjects ?? noSubjects).map(slot => slot.id);
    const repeated = ids.find((id, index) => ids.indexOf(id) !== index);
    if (repeated !== undefined) throw new ConjugationError('INVALID_REQUEST', `The ${language} pack declares the subject ${repeated} twice.`);
    // A slot id is a segment of the target key, next to the voice: it must not look like another segment.
    const clash = ids.find(id => id.includes('/') || (voiceNames as readonly string[]).includes(id));
    if (clash !== undefined) {
      throw new ConjugationError('INVALID_REQUEST', `The ${language} pack names a subject slot "${clash}", which would clash with the other segments of a target key: a slot id contains no "/" and is not a voice name.`);
    }
    for (const entry of pack.catalogue) {
      const where = `${language} pack's ${entry.mood}/${entry.tense} entry`;
      if (!entry.finite && entry.slots !== undefined) {
        throw new ConjugationError('INVALID_REQUEST', `The ${where} is not finite, so it has no subject slots; remove its slots.`);
      }
      if (entry.finite && entry.slots?.length === 0) {
        throw new ConjugationError('INVALID_REQUEST', `The ${where} lists no subject slots: an empty slots list would leave it without a target (omit slots to use its persons).`);
      }
      const unknown = entry.slots?.find(id => !ids.includes(id));
      if (unknown !== undefined) {
        throw new ConjugationError('INVALID_REQUEST', `The ${language} pack lists the subject slot ${unknown} in ${entry.mood}/${entry.tense}, but does not declare it.`);
      }
    }
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

  /**
   * A staged pack's assumptions as English text, in the analysis and in each of its alternatives. Assumptions have no
   * target, so their rules cannot name a tense.
   */
  function analysisWithText(pack: LanguagePack, analysis: VerbAnalysis): VerbAnalysis {
    const ctx = englishContext(pack, null);
    if (!ctx) return analysis;
    const withText = (paradigm: VerbAnalysis): VerbAnalysis => paradigm.steps ? {
      ...paradigm, assumptions: [...new Set(paradigm.steps.filter(s => s.kind === 'assumption').map(s => renderStep(s, ctx)))],
    } : paradigm;
    const rendered = withText(analysis);
    return analysis.alternatives ? { ...rendered, alternatives: analysis.alternatives.map(withText) } : rendered;
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
        // steps (a pack assembled without the types) collects the ruleIds of every form that collapsed into it.
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
    // Standard before literary before dated, then the 1990 spelling, unless the pack ranks its own way.
    const rankOf = (form: GeneratedForm): number => pack.rank ? pack.rank(form, query) : variantRank(form.variant, 'rectified');
    const byTarget = new Map<string, GeneratedForm[]>();
    for (const form of unique.values()) {
      const key = resolvedTargetKey(form.target);
      const group = byTarget.get(key) ?? [];
      group.push(form);
      byTarget.set(key, group);
    }
    const forms: ConjugatedForm[] = [...byTarget.values()].flatMap(group =>
      group.sort((a, b) => rankOf(a) - rankOf(b)).map((form, index) => ({
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
    normalizeForComparison: (language, text) => comparisonKey(packFor(registry, language), text),
    languages: Object.freeze(Object.keys(registry)),
  };
}
