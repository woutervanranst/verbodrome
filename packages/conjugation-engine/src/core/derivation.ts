import { ConjugationError } from '../errors.js';

export type Stage = 'classify' | 'stem' | 'ending' | 'orthography' | 'periphrasis' | 'clause' | 'availability';
export type StepKind = 'rule' | 'lexical' | 'assumption' | 'unavailable';
export type TermKind = 'mood' | 'tense' | 'person' | 'number' | 'gender' | 'voice' | 'case';

/** Points at a grammatical term (a mood, tense, person...) so a step can name it without hard-coding its label. */
export interface TermRef { readonly term: TermKind; readonly id: string }
export type StepParam = string | number | TermRef;
export type ParamKind = 'text' | 'number' | 'term';

export interface RuleInfo {
  readonly id: string;
  readonly stage: Stage;
  readonly kind: StepKind;
  readonly params: Readonly<Record<string, ParamKind>>;
}

export interface DerivationStep {
  readonly rule: string;
  readonly stage: Stage;
  readonly kind: StepKind;
  readonly before: string | null;
  readonly after: string | null;
  readonly params: Readonly<Record<string, StepParam>>;
}

/** Declares a pack's rules; ids are the object keys. `kind` defaults to 'rule', `params` to {}. */
export function defineRules<const T extends Record<string, { stage: Stage; kind?: StepKind; params?: Record<string, ParamKind> }>>(
  defs: T,
): { readonly [K in keyof T & string]: RuleInfo & { readonly id: K } } {
  const rules: Record<string, RuleInfo> = {};
  for (const [id, def] of Object.entries(defs)) {
    rules[id] = { id, stage: def.stage, kind: def.kind ?? 'rule', params: { ...def.params } };
  }
  return rules as { readonly [K in keyof T & string]: RuleInfo & { readonly id: K } };
}

function matchesKind(value: unknown, kind: ParamKind): boolean {
  switch (kind) {
    case 'text': return typeof value === 'string';
    case 'number': return typeof value === 'number';
    case 'term': {
      if (typeof value !== 'object' || value === null) return false;
      const ref = value as Partial<TermRef>;
      return typeof ref.term === 'string' && typeof ref.id === 'string';
    }
  }
}

/** Builds a step; throws GENERATION_FAILURE when params do not match the rule's declared params (missing, extra, or wrong kind). */
export function step(
  rule: RuleInfo,
  before: string | null,
  after: string | null,
  params: Readonly<Record<string, StepParam>> = {},
): DerivationStep {
  for (const [name, kind] of Object.entries(rule.params)) {
    if (!Object.hasOwn(params, name)) {
      throw new ConjugationError('GENERATION_FAILURE', `Rule ${rule.id} is missing parameter "${name}".`);
    }
    if (!matchesKind(params[name], kind)) {
      throw new ConjugationError('GENERATION_FAILURE', `Rule ${rule.id} parameter "${name}" must be of kind ${kind}.`);
    }
  }
  for (const name of Object.keys(params)) {
    if (!Object.hasOwn(rule.params, name)) {
      throw new ConjugationError('GENERATION_FAILURE', `Rule ${rule.id} does not declare parameter "${name}".`);
    }
  }
  return { rule: rule.id, stage: rule.stage, kind: rule.kind, before, after, params: { ...params } };
}
