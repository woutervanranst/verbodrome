import { ConjugationError } from '../errors.js';
import { deepFreeze } from '../parts.js';
import type { DerivationStep, Stage, StepKind, TermRef } from '../core/derivation.js';
import type { CatalogueEntry, LanguagePack } from '../core/pack.js';
import type { Citation } from '../core/sources.js';
import type { ConjugatedForm, ResolvedTarget, UnavailableTarget, VerbAnalysis } from '../types.js';
import type { Catalog } from './catalog.js';
import { formatMessage } from './format.js';
import type { MessageArg } from './format.js';

export interface ExplainedStep {
  readonly text: string;
  readonly rule: string;
  readonly stage: Stage;
  readonly kind: StepKind;
  readonly before: string | null;
  readonly after: string | null;
  readonly citations: readonly (Citation & { readonly title: string })[];
}

export interface Explanation {
  readonly summary: string;
  /** One per part that has steps (`part` is its index, `title` its text), then one with `part: null` for the form-level steps. */
  readonly sections: readonly { readonly part: number | null; readonly title: string; readonly steps: readonly ExplainedStep[] }[];
}

export type Explainable = ConjugatedForm | UnavailableTarget | VerbAnalysis;

/** What rendering a step needs: the pack (catalogue, works, citations), one locale's merged catalog, and the mood a tense term is looked up in. */
export interface StepContext {
  readonly pack: LanguagePack;
  readonly catalog: Catalog;
  readonly locale: string;
  /**
   * The mood of what the step describes: for a part's steps the word's own mood (its `features.mood`), for form-level
   * steps and an unavailable target the target's mood; null when there is none (an analysis, a word without a mood).
   */
  readonly mood: string | null;
}

function failure(message: string): never {
  throw new ConjugationError('GENERATION_FAILURE', message);
}

/** Formats the catalog message `key`; a missing message or a message that cannot be formatted is a GENERATION_FAILURE naming the key. */
function message(ctx: Pick<StepContext, 'catalog' | 'locale'>, key: string, args: Readonly<Record<string, MessageArg>>): string {
  if (!Object.hasOwn(ctx.catalog, key)) failure(`No ${ctx.locale} message for "${key}".`);
  try {
    return formatMessage(ctx.catalog[key]!, args, ctx.locale);
  } catch (error) {
    if (error instanceof SyntaxError || error instanceof RangeError) failure(`The ${ctx.locale} message "${key}" cannot be formatted: ${error.message}`);
    throw error;
  }
}

function entryOf(pack: LanguagePack, predicate: (entry: CatalogueEntry) => boolean): CatalogueEntry | undefined {
  return pack.catalogue.find(predicate);
}

/**
 * A term as text. A mood or tense is the native label from the catalogue; every other kind is the catalog message
 * `term.<kind>.<id>`. A tense is looked up in the context's mood; without one (or when that mood has no such tense) it
 * resolves only if every catalogue entry with that tense id has the same label.
 */
function termText(ref: TermRef, ctx: StepContext): string {
  const { term, id } = ref;
  if (term === 'mood') {
    const entry = entryOf(ctx.pack, e => e.mood === id);
    if (!entry) failure(`The ${ctx.pack.language} catalogue has no mood "${id}".`);
    return entry!.moodLabel;
  }
  if (term === 'tense') {
    const own = ctx.mood === null ? undefined : entryOf(ctx.pack, e => e.mood === ctx.mood && e.tense === id);
    if (own) return own.tenseLabel;
    const labels = new Set(ctx.pack.catalogue.filter(e => e.tense === id).map(e => e.tenseLabel));
    if (labels.size === 1) return [...labels][0]!;
    return failure(labels.size
      ? `The tense "${id}" has several labels in the ${ctx.pack.language} catalogue and no mood to choose by.`
      : `The ${ctx.pack.language} catalogue has no tense "${id}".`);
  }
  const key = `term.${term}.${id}`;
  if (!Object.hasOwn(ctx.catalog, key)) failure(`No ${ctx.locale} label for the ${term} "${id}" (message "${key}").`);
  return message(ctx, key, {});
}

/** The text of one step: the rule's catalog message over the step's params, `before` and `after` (null becomes empty). */
export function renderStep(step: DerivationStep, ctx: StepContext): string {
  const args: Record<string, MessageArg> = {};
  for (const [name, value] of Object.entries(step.params)) {
    args[name] = typeof value === 'object' ? termText(value, ctx) : value;
  }
  args.before = step.before ?? '';
  args.after = step.after ?? '';
  return message(ctx, step.rule, args);
}

function citationsFor(rule: string, pack: LanguagePack): ExplainedStep['citations'] {
  const cited = pack.citations !== undefined && Object.hasOwn(pack.citations, rule) ? pack.citations[rule]! : [];
  return (Array.isArray(cited) ? cited as readonly Citation[] : [cited as Citation]).map(citation => {
    const work = pack.works !== undefined && Object.hasOwn(pack.works, citation.work) ? pack.works[citation.work] : undefined;
    if (!work) failure(`The citation of ${rule} names the work "${citation.work}", which ${pack.language} does not list.`);
    return { ...citation, title: work!.title };
  });
}

function explainStep(step: DerivationStep, ctx: StepContext): ExplainedStep {
  return {
    text: renderStep(step, ctx), rule: step.rule, stage: step.stage, kind: step.kind,
    before: step.before, after: step.after, citations: citationsFor(step.rule, ctx.pack),
  };
}

/** The section for `steps`, or none when there are none; the title is only looked up for a section that exists. */
function section(
  ctx: StepContext, part: number | null, title: () => string, steps: readonly DerivationStep[] | undefined,
): Explanation['sections'] {
  return steps?.length ? [{ part, title: title(), steps: steps.map(s => explainStep(s, ctx)) }] : [];
}

function labelsOf(pack: LanguagePack, target: ResolvedTarget): { mood: string; tense: string } {
  const entry = entryOf(pack, e => e.mood === target.mood && e.tense === target.tense);
  if (!entry) failure(`The ${pack.language} catalogue has no ${target.mood}/${target.tense}.`);
  return { mood: entry!.moodLabel, tense: entry!.tenseLabel };
}

/** Explains a form, an unavailable target or a verb analysis, told apart by shape. Throws GENERATION_FAILURE for a rule or term without text. */
export function explainSubject(pack: LanguagePack, catalog: Catalog, locale: string, subject: Explainable): Explanation {
  const ctx = (mood: string | null): StepContext => ({ pack, catalog, locale, mood });
  const invalid = (): ConjugationError => new ConjugationError('INVALID_REQUEST', 'Only a form, an unavailable target or a verb analysis can be explained.');
  if (typeof subject !== 'object' || subject === null) throw invalid();
  let explanation: Explanation;
  if ('parts' in subject) {
    const c = ctx(subject.target.mood);
    const sections = [
      // A word's steps name its own tenses: an auxiliary in the indicative past inside a conditional is in the indicative.
      ...subject.parts.flatMap((part, index) => section(ctx(part.features.mood), index, () => part.text, part.steps)),
      ...section(c, null, () => message(c, 'explain.section.form', {}), subject.steps),
    ];
    explanation = { summary: message(c, 'explain.summary.form', { text: subject.text, ...subject.labels }), sections };
  } else if ('reason' in subject) {
    const c = ctx(subject.target.mood);
    const sections = section(c, null, () => message(c, 'explain.section.availability', {}), subject.step ? [subject.step] : undefined);
    explanation = {
      summary: message(c, 'explain.summary.unavailable', { ...labelsOf(pack, subject.target), reason: subject.reason }), sections,
    };
  } else if ('classification' in subject) {
    const c = ctx(null);
    const sections = section(c, null, () => message(c, 'explain.section.classify', {}), subject.steps);
    explanation = { summary: message(c, 'explain.summary.analysis', { lemma: subject.lemma, classification: subject.classification }), sections };
  } else {
    throw invalid();
  }
  return deepFreeze(explanation);
}

/** The steps of an explanation as plain lines, part by part and then the form-level steps, each indented. */
export function explanationLines(explanation: Explanation, indent = '    '): string[] {
  return explanation.sections.flatMap(s => s.steps.map(step => `${indent}${step.text}`));
}
