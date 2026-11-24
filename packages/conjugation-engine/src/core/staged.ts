import { ConjugationError } from '../errors.js';
import type { LanguageEngine } from '../languages/adapter.js';
import type {
  ConjugationPart, FormVariant, GeneratedForm, GenerationResult, Mood, ResolvedTarget, Tense, UnavailableTarget, VerbAnalysis,
} from '../types.js';
import type { ChainWord, ClauseContext, ClauseGrammar } from './clause.js';
import type { DerivationStep } from './derivation.js';
import { chain, combine, one } from './fork.js';
import type { Fork, Outcome } from './fork.js';
import type { Agreement, GrammaticalNumber, Person, Voice } from './grammar.js';
import { applyJunctureRules } from './juncture.js';
import type { JunctureRule } from './juncture.js';
import type { PackRendering } from './pack.js';
import { periphrasesFor, periphrasisStep, usesPerfectAuxiliary } from './periphrasis.js';
import type { ChainElement, Periphrasis, VerbRef } from './periphrasis.js';
import { targetKey } from './target.js';

/** What every staged grammar knows about a verb; a grammar extends it with its own lexical data. */
export interface LexemeBase {
  readonly lemma: string;
  readonly verbId: string;
  readonly classId: string;
  readonly classSource: VerbAnalysis['classificationSource'];
  readonly reflexive: boolean;
  /** Perfect auxiliaries, in output order; a periphrasis using `perfectAuxiliary` runs once per entry. */
  readonly auxiliaries: readonly string[];
  /** A verbal particle (de/nl prefix); the clause places it. */
  readonly particle: { readonly text: string; readonly separable: boolean } | null;
}

/**
 * One word-sized paradigm cell, in the pack's own mood, tense and form ids. An absent `voice` means active, the
 * unmarked voice: a grammar writes `voice` only for a marked voice (the passive), so the cell of an active target and
 * the cell a finite chain element asks for (which never has a voice) are one cell and share one synthesis.
 */
export type Cell =
  | {
    readonly kind: 'finite'; readonly mood: string; readonly tense: string;
    readonly person: Person; readonly number: GrammaticalNumber; readonly voice?: Voice;
  }
  | { readonly kind: 'nonFinite'; readonly form: string; readonly agreement?: Agreement; readonly voice?: Voice };

export interface Unavailability { readonly reason: UnavailableTarget['reason']; readonly step: DerivationStep; readonly source: string }

export interface StagedGrammar<X extends LexemeBase = LexemeBase> {
  /** Steps include classification and every assumption made. Throws ConjugationError for unusable input. */
  classify(query: Readonly<Record<string, unknown>>): Outcome<X>;
  /** Lexeme for an auxiliary or other verb named by a periphrasis. */
  lexemeOf(lemma: string): X;
  /**
   * Which simple cell a simple catalogue target maps to, or null when the target is periphrastic. Also called with the
   * voiceless targets the engine builds for finite chain elements (the element's mood and tense; the target's person,
   * number and gender; no agreement, no voice), for which it returns the active cell, or null if that mood and tense
   * are periphrastic (periphrases do not nest).
   */
  cellOf(target: ResolvedTarget): Cell | null;
  availability(lexeme: X, target: ResolvedTarget): Unavailability | null;
  /** Whole-word lexical override (suppletive cells); null = derive by stages. */
  cell?(lexeme: X, cell: Cell): Fork<string> | null;
  stem(lexeme: X, cell: Cell): Fork<string>;
  /** The ending to add to `stem`; its steps record the stem and the stem plus ending. */
  ending(lexeme: X, cell: Cell, stem: string): Fork<string>;
  readonly orthography: readonly JunctureRule<{ readonly lexeme: X; readonly cell: Cell }>[];
  readonly periphrases: readonly Periphrasis[];
  readonly clause: ClauseGrammar<X>;
}

/**
 * One cell of one lexeme: the grammar's whole-word form if it has one, otherwise stem → ending → spelling rules, as
 * the product of their forks. Each outcome's steps are the word-level steps. Not cached; `stagedEngine` memoises it.
 */
export function synthesize<X extends LexemeBase>(grammar: StagedGrammar<X>, lexeme: X, cell: Cell): Fork<string> {
  const lexical = grammar.cell?.(lexeme, cell) ?? null;
  if (lexical !== null) return lexical;
  return chain(grammar.stem(lexeme, cell), stem =>
    chain(grammar.ending(lexeme, cell, stem), ending =>
      chain(applyJunctureRules(grammar.orthography, { stem, ending }, { lexeme, cell }), juncture =>
        one(juncture.stem + juncture.ending))));
}

/**
 * Checks a grammar's periphrasis declarations; a pack calls it once at module load. Throws GENERATION_FAILURE naming
 * the periphrasis when its rule is not of stage 'periphrasis'; when its chain uses `perfectAuxiliary` but its rule does
 * not declare exactly one param, `auxiliary` of kind text, or its chain does not use it and the rule declares params;
 * or when its chain has no verb. Nesting depends on `cellOf`, so generation checks it.
 */
export function validateGrammar<X extends LexemeBase>(grammar: StagedGrammar<X>): void {
  for (const periphrasis of grammar.periphrases) {
    const { mood, tense, voice, rule } = periphrasis;
    const fail = (reason: string): never => {
      throw new ConjugationError('GENERATION_FAILURE', `Periphrasis ${mood}/${tense}${voice ? `/${voice}` : ''} (${rule.id}) ${reason}.`);
    };
    if (rule.stage !== 'periphrasis') fail(`has a rule of stage ${rule.stage}; it must be periphrasis`);
    const params = Object.keys(rule.params);
    if (usesPerfectAuxiliary(periphrasis)) {
      if (params.length !== 1 || rule.params.auxiliary !== 'text') {
        fail('uses perfectAuxiliary, so its rule must declare exactly one param: auxiliary, of kind text');
      }
    } else if (params.length) {
      fail('has a chain without perfectAuxiliary, so its rule must declare no params');
    }
    if (!periphrasis.chain.some(element => 'verb' in element)) fail('has no verb in its chain');
  }
}

/** A stable key for a cell, independent of property order. */
function cellKey(cell: Cell): string {
  return cell.kind === 'finite'
    ? JSON.stringify([cell.kind, cell.mood, cell.tense, cell.person, cell.number, cell.voice ?? null])
    : JSON.stringify([
      cell.kind, cell.form, cell.voice ?? null,
      cell.agreement?.gender ?? null, cell.agreement?.number ?? null, cell.agreement?.case ?? null,
    ]);
}

/** A chain element resolved for one target and auxiliary: a verb in a simple cell, or a literal word. */
type Slot<X extends LexemeBase> =
  | { readonly kind: 'verb'; readonly role: 'auxiliary' | 'lexicalVerb'; readonly lexeme: X; readonly cell: Cell; readonly agree: boolean }
  | { readonly kind: 'word'; readonly role: 'linker' | 'particle' | 'moodMarker'; readonly text: string };

/** How one target is built: a simple cell (no periphrasis), or one run of a periphrasis with one auxiliary. */
interface Construction<X extends LexemeBase> {
  readonly periphrasis: Periphrasis | null;
  readonly auxiliary: string | null;
  readonly slots: readonly Slot<X>[];
}

/** How marked each usage is; a new usage value does not compile until it is ranked here. */
const usageRank: Readonly<Record<FormVariant['usage'], number>> = { standard: 0, literary: 1, dated: 2 };

/** The most marked of the usages given: dated over literary over standard. */
function markedUsage(...usages: readonly (FormVariant['usage'] | undefined)[]): FormVariant['usage'] {
  return usages.reduce<FormVariant['usage']>(
    (marked, usage) => usage !== undefined && usageRank[usage] > usageRank[marked] ? usage : marked, 'standard');
}

/**
 * A LanguageEngine for one query: classifies the verb once, then builds each target from a simple cell or from the
 * periphrases that match it, synthesising every verb in the chain through the same grammar and letting the clause
 * grammar order the words. Synthesis and lexemes named by periphrases are memoised for this engine instance only.
 */
export function stagedEngine<X extends LexemeBase>(
  grammar: StagedGrammar<X>,
  rendering: PackRendering,
  query: Readonly<Record<string, unknown>>,
): LanguageEngine {
  const classified = grammar.classify(query);
  const lexeme = classified.value;

  const lexemes = new Map<string, X>();
  function lexemeNamed(lemma: string): X {
    let named = lexemes.get(lemma);
    if (!named) {
      named = grammar.lexemeOf(lemma);
      lexemes.set(lemma, named);
    }
    return named;
  }

  const synthesized = new Map<X, Map<string, Fork<string>>>();
  function synth(of: X, cell: Cell): Fork<string> {
    let cells = synthesized.get(of);
    if (!cells) {
      cells = new Map();
      synthesized.set(of, cells);
    }
    const key = cellKey(cell);
    let fork = cells.get(key);
    if (!fork) {
      fork = synthesize(grammar, of, cell);
      cells.set(key, fork);
    }
    return fork;
  }

  function verbOf(ref: VerbRef, auxiliary: string | null): X {
    if (ref === 'main') return lexeme;
    if (ref === 'perfectAuxiliary') {
      if (auxiliary === null) throw new ConjugationError('GENERATION_FAILURE', 'A perfect auxiliary element ran without an auxiliary.');
      return lexemeNamed(auxiliary);
    }
    return lexemeNamed(ref.lemma);
  }

  function slotFor(periphrasis: Periphrasis, element: ChainElement, target: ResolvedTarget, auxiliary: string | null): Slot<X> {
    if ('word' in element) return { kind: 'word', role: element.role, text: element.word };
    const role = element.verb === 'main' ? 'lexicalVerb' : 'auxiliary';
    const verb = verbOf(element.verb, auxiliary);
    if ('nonFinite' in element) {
      return { kind: 'verb', role, lexeme: verb, cell: { kind: 'nonFinite', form: element.nonFinite }, agree: element.agree === true };
    }
    const { mood, tense } = element.finite;
    if (target.person === null || target.number === null) {
      throw new ConjugationError('GENERATION_FAILURE', `Periphrasis ${periphrasis.rule.id} has a finite ${mood}/${tense} element, but ${targetKey(target)} has no person.`);
    }
    // A chain element names a simple cell; the voiceless target of that mood and tense must have one.
    const cell = grammar.cellOf({
      mood: mood as Mood, tense: tense as Tense, person: target.person, number: target.number, gender: target.gender, agreement: null,
    });
    if (cell === null) {
      throw new ConjugationError('GENERATION_FAILURE', `Periphrasis ${periphrasis.rule.id} uses ${mood}/${tense}, which is periphrastic itself; periphrases do not nest.`);
    }
    return { kind: 'verb', role, lexeme: verb, cell, agree: false };
  }

  function constructions(target: ResolvedTarget): Construction<X>[] {
    const cell = grammar.cellOf(target);
    if (cell !== null) {
      // A simple non-finite form asks the clause for agreement, as an `agree` chain element does; a finite one never does.
      const slot: Slot<X> = { kind: 'verb', role: 'lexicalVerb', lexeme, cell, agree: cell.kind === 'nonFinite' };
      return [{ periphrasis: null, auxiliary: null, slots: [slot] }];
    }
    const periphrases = periphrasesFor(grammar.periphrases, target);
    if (!periphrases.length) {
      throw new ConjugationError('GENERATION_FAILURE', `No simple cell or periphrasis builds ${targetKey(target)}.`);
    }
    return periphrases.flatMap(periphrasis => (usesPerfectAuxiliary(periphrasis) ? lexeme.auxiliaries : [null]).map(auxiliary => ({
      periphrasis, auxiliary, slots: periphrasis.chain.map(element => slotFor(periphrasis, element, target, auxiliary)),
    })));
  }

  /** The words a slot can be; a verb's synthesis steps move into the word, so the fork's own steps stay form-level. */
  function wordsFor(slot: Slot<X>, agreement: Agreement | null): Fork<ChainWord> {
    if (slot.kind === 'word') return one({ role: slot.role, text: slot.text, lemma: null, cell: null, steps: [] });
    const cell: Cell = slot.agree && agreement !== null && slot.cell.kind === 'nonFinite' ? { ...slot.cell, agreement } : slot.cell;
    return synth(slot.lexeme, cell).map(outcome => ({
      value: { role: slot.role, text: outcome.value, lemma: slot.lexeme.lemma, cell, steps: outcome.steps },
      steps: [],
      tags: outcome.tags,
    }));
  }

  function build(target: ResolvedTarget, construction: Construction<X>): GeneratedForm[] {
    const { periphrasis, auxiliary, slots } = construction;
    const context: ClauseContext<X> = { query, lexeme, target, auxiliary, rendering };
    const agreements = slots.some(slot => slot.kind === 'verb' && slot.agree) ? grammar.clause.agreements(context) : one(null);
    // Classification tags apply to every form; the periphrasis step opens the form-level steps.
    const opening = one(null, periphrasis ? [periphrasisStep(periphrasis, auxiliary)] : [], classified.tags);
    const built = chain(opening, () => chain(agreements, agreement => {
      const resolved: ResolvedTarget = agreement === null ? target : { ...target, agreement };
      const words = combine<ChainWord[]>(slots.map(slot => wordsFor(slot, agreement)));
      return chain(words, chainWords => chain(grammar.clause.assemble(chainWords, { ...context, target: resolved }), parts =>
        one({ target: resolved, parts })));
    }));
    return built.map(({ value: { target: resolved, parts }, steps, tags }) => ({
      target: resolved,
      parts,
      variant: {
        orthography: tags.orthography ?? 'both',
        auxiliary,
        pattern: [tags.pattern, periphrasis?.pattern].filter(Boolean).join('.') || null,
        usage: markedUsage(tags.usage, periphrasis?.usage),
        condition: tags.condition ?? null,
        region: tags.region ?? null,
      },
      ruleIds: ruleIdsOf(steps, parts),
      steps,
    }));
  }

  return {
    verbId: lexeme.verbId,
    analysis: {
      lemma: lexeme.lemma,
      classification: lexeme.classId,
      classificationSource: lexeme.classSource,
      reflexive: lexeme.reflexive,
      auxiliaries: lexeme.auxiliaries,
      // Rule ids; an engine with an English catalog replaces them with the rendered steps.
      assumptions: [...new Set(classified.steps.filter(s => s.kind === 'assumption').map(s => s.rule))],
      steps: classified.steps,
    },
    generate(target): GenerationResult {
      const absent = grammar.availability(lexeme, target);
      if (absent) {
        return {
          forms: [],
          // The rule id; an engine with an English catalog replaces it with the rendered step.
          unavailable: [{ target, reason: absent.reason, explanation: absent.step.rule, source: absent.source, step: absent.step }],
        };
      }
      return { forms: constructions(target).flatMap(construction => build(target, construction)), unavailable: [] };
    },
  };
}

/** Distinct rule ids of a form's own steps and its parts' steps, in order. */
function ruleIdsOf(steps: readonly DerivationStep[], parts: readonly ConjugationPart[]): string[] {
  return [...new Set([...steps, ...parts.flatMap(part => part.steps ?? [])].map(s => s.rule))];
}
