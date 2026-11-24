import { ConjugationError } from '../errors.js';
import type { LanguageEngine } from '../languages/adapter.js';
import type {
  ConjugationPart, GeneratedForm, GenerationResult, Mood, ResolvedTarget, Tense, UnavailableTarget, VerbAnalysis,
} from '../types.js';
import type { ChainWord, ClauseContext, ClauseGrammar } from './clause.js';
import type { DerivationStep } from './derivation.js';
import { chain, combine, one } from './fork.js';
import type { Fork, Outcome, VariantTags } from './fork.js';
import type { Agreement, GrammaticalNumber, Person, Voice } from './grammar.js';
import { applyJunctureRules } from './juncture.js';
import type { JunctureRule } from './juncture.js';
import type { PackRendering } from './pack.js';
import { periphrasesFor, periphrasisStep, reportedAuxiliary, usesPerfectAuxiliary } from './periphrasis.js';
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
  /**
   * Why `target` has no form for `lexeme` (defective, impersonal, no imperative), with the rule and source that say so;
   * null when it has forms. This is the only place a pack declares that a target has no form: when an available target
   * ends with no form (a stage returned [], or every branch was dropped), generation fails with GENERATION_FAILURE
   * naming the target, the lemma and the stage that came back empty.
   */
  availability(lexeme: X, target: ResolvedTarget): Unavailability | null;
  /**
   * Whole-word lexical override (suppletive cells); null = derive by stages. [] is no word at all: a missing form is
   * declared through `availability`, not here.
   */
  cell?(lexeme: X, cell: Cell): Fork<string> | null;
  /** The stems of a cell. [] leaves the cell without a word: a missing form is declared through `availability`. */
  stem(lexeme: X, cell: Cell): Fork<string>;
  /**
   * The ending to add to `stem`; its steps record the stem and the stem plus ending. [] drops this stem's branch; when
   * no stem has an ending, the cell has no word, and a missing form is declared through `availability` instead.
   */
  ending(lexeme: X, cell: Cell, stem: string): Fork<string>;
  readonly orthography: readonly JunctureRule<{ readonly lexeme: X; readonly cell: Cell }>[];
  readonly periphrases: readonly Periphrasis[];
  readonly clause: ClauseGrammar<X>;
}

/** The stages whose hooks can leave an available target without a form. */
type FormStage = 'cell' | 'stem' | 'ending' | 'orthography' | 'agreements' | 'assemble';

/** One word's outcomes, and the stage that left it none when there are none. */
interface Synthesis { readonly words: Fork<string>; readonly emptyAt: FormStage | null }

function synthesis<X extends LexemeBase>(grammar: StagedGrammar<X>, lexeme: X, cell: Cell): Synthesis {
  const lexical = grammar.cell?.(lexeme, cell) ?? null;
  if (lexical !== null) return { words: lexical, emptyAt: lexical.length ? null : 'cell' };
  const stems = grammar.stem(lexeme, cell);
  if (!stems.length) return { words: [], emptyAt: 'stem' };
  const junctures = chain(stems, stem => chain(grammar.ending(lexeme, cell, stem), ending => one({ stem, ending })));
  if (!junctures.length) return { words: [], emptyAt: 'ending' };
  const words = chain(junctures, juncture =>
    chain(applyJunctureRules(grammar.orthography, juncture, { lexeme, cell }), spelled => one(spelled.stem + spelled.ending)));
  return { words, emptyAt: words.length ? null : 'orthography' };
}

/**
 * One cell of one lexeme: the grammar's whole-word form if it has one, otherwise stem → ending → spelling rules, as
 * the product of their forks. Each outcome's steps are the word-level steps. Not cached; `stagedEngine` memoises it.
 */
export function synthesize<X extends LexemeBase>(grammar: StagedGrammar<X>, lexeme: X, cell: Cell): Fork<string> {
  return synthesis(grammar, lexeme, cell).words;
}

/** Grammars that passed `validateGrammar`; `stagedEngine` validates any other grammar the first time it is given it. */
const validated = new WeakSet<object>();

/**
 * Checks a grammar's periphrasis declarations. `stagedEngine` runs it the first time it is given a grammar; a pack may
 * also call it at module load to fail there. Throws GENERATION_FAILURE naming the periphrasis when its rule is not of
 * stage 'periphrasis'; when its chain uses `perfectAuxiliary` but its rule does not declare exactly one param,
 * `auxiliary` of kind text, or its chain does not use it and the rule declares params; when its chain has no verb; or
 * when it `reports` a perfect auxiliary its chain does not use. Nesting depends on `cellOf`, so generation checks it.
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
    if (periphrasis.reports === 'perfectAuxiliary' && !usesPerfectAuxiliary(periphrasis)) {
      fail('reports perfectAuxiliary, which its chain does not use');
    }
  }
  validated.add(grammar);
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
  /** The perfect auxiliary this run uses, if any; the form may report another verb (`reportedAuxiliary`). */
  readonly auxiliary: string | null;
  readonly slots: readonly Slot<X>[];
}

/** The first stage that left a branch of a target without a form, and the verb it was building. */
interface EmptyStage { readonly stage: FormStage; readonly lemma: string }

/** Notes where a target's branches come back empty; only the first is kept. */
function emptyStages(): { note(stage: FormStage, lemma: string): void; first(): EmptyStage | null } {
  let first: EmptyStage | null = null;
  return {
    note(stage, lemma) {
      first ??= { stage, lemma };
    },
    first: () => first,
  };
}

/** The pattern and usage a periphrasis adds to its forms, after the labels of their words. */
function periphrasisTags({ pattern, usage }: Periphrasis): VariantTags {
  return { ...(pattern === undefined ? {} : { pattern }), ...(usage === undefined ? {} : { usage }) };
}

/**
 * A LanguageEngine for one query: classifies the verb once, then builds each target from a simple cell or from the
 * periphrases that match it, synthesising every verb in the chain through the same grammar and letting the clause
 * grammar order the words. Synthesis and lexemes named by periphrases are memoised for this engine instance only.
 * Validates the grammar the first time it is given it. The analysis and every generated form are copies, so freezing
 * a result never freezes data the pack keeps (its lexicon, or forks and steps it reuses).
 */
export function stagedEngine<X extends LexemeBase>(
  grammar: StagedGrammar<X>,
  rendering: PackRendering,
  query: Readonly<Record<string, unknown>>,
): LanguageEngine {
  if (!validated.has(grammar)) validateGrammar(grammar);
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

  const synthesized = new Map<X, Map<string, Synthesis>>();
  function synth(of: X, cell: Cell): Synthesis {
    let cells = synthesized.get(of);
    if (!cells) {
      cells = new Map();
      synthesized.set(of, cells);
    }
    const key = cellKey(cell);
    let result = cells.get(key);
    if (!result) {
      result = synthesis(grammar, of, cell);
      cells.set(key, result);
    }
    return result;
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
  function wordsFor(slot: Slot<X>, agreement: Agreement | null, noteEmpty: (stage: FormStage, lemma: string) => void): Fork<ChainWord> {
    if (slot.kind === 'word') return one({ role: slot.role, text: slot.text, lemma: null, cell: null, steps: [] });
    const cell: Cell = slot.agree && agreement !== null && slot.cell.kind === 'nonFinite' ? { ...slot.cell, agreement } : slot.cell;
    const { words, emptyAt } = synth(slot.lexeme, cell);
    if (emptyAt !== null) noteEmpty(emptyAt, slot.lexeme.lemma);
    return words.map(outcome => ({
      value: { role: slot.role, text: outcome.value, lemma: slot.lexeme.lemma, cell, steps: outcome.steps },
      steps: [],
      tags: outcome.tags,
    }));
  }

  function build(target: ResolvedTarget, construction: Construction<X>, noteEmpty: (stage: FormStage, lemma: string) => void): GeneratedForm[] {
    const { periphrasis, auxiliary, slots } = construction;
    const context: ClauseContext<X> = { query, lexeme, target, auxiliary, rendering };
    const agreements = slots.some(slot => slot.kind === 'verb' && slot.agree) ? grammar.clause.agreements(context) : one(null);
    // Classification tags apply to every form; the periphrasis step opens the form-level steps.
    const opening = one(null, periphrasis ? [periphrasisStep(periphrasis, auxiliary)] : [], classified.tags);
    const agreed = chain(opening, () => agreements);
    if (!agreed.length) noteEmpty('agreements', lexeme.lemma);
    const assembled = chain(agreed, agreement => {
      const resolved: ResolvedTarget = agreement === null ? target : { ...target, agreement };
      const words = combine<ChainWord[]>(slots.map(slot => wordsFor(slot, agreement, noteEmpty)));
      // Words whose tags cannot combine leave nothing to assemble, which counts against the assemble stage.
      const forms = chain(words, chainWords => chain(grammar.clause.assemble(chainWords, { ...context, target: resolved }), parts =>
        one({ target: resolved, parts })));
      if (!forms.length) noteEmpty('assemble', lexeme.lemma);
      return forms;
    });
    const built = periphrasis ? chain(assembled, form => one(form, [], periphrasisTags(periphrasis))) : assembled;
    const reported = periphrasis ? reportedAuxiliary(periphrasis, auxiliary) : null;
    return built.map(({ value: { target: resolved, parts }, steps, tags }) => ({
      target: resolved,
      parts,
      variant: {
        orthography: tags.orthography ?? 'both',
        auxiliary: reported,
        pattern: tags.pattern ?? null,
        usage: tags.usage ?? 'standard',
        condition: tags.condition ?? null,
        region: tags.region ?? null,
      },
      ruleIds: ruleIdsOf(steps, parts),
      steps,
    }));
  }

  return {
    verbId: lexeme.verbId,
    analysis: structuredClone({
      lemma: lexeme.lemma,
      classification: lexeme.classId,
      classificationSource: lexeme.classSource,
      reflexive: lexeme.reflexive,
      auxiliaries: lexeme.auxiliaries,
      // Rule ids; an engine with an English catalog replaces them with the rendered steps.
      assumptions: [...new Set(classified.steps.filter(s => s.kind === 'assumption').map(s => s.rule))],
      steps: classified.steps,
    }),
    generate(target): GenerationResult {
      const absent = grammar.availability(lexeme, target);
      if (absent) {
        return structuredClone({
          forms: [],
          // The rule id; an engine with an English catalog replaces it with the rendered step.
          unavailable: [{ target, reason: absent.reason, explanation: absent.step.rule, source: absent.source, step: absent.step }],
        });
      }
      const empty = emptyStages();
      const forms = constructions(target).flatMap(construction => build(target, construction, empty.note));
      if (!forms.length) throw new ConjugationError('GENERATION_FAILURE', noFormMessage(target, lexeme.lemma, empty.first()));
      return structuredClone({ forms, unavailable: [] });
    },
  };
}

/** Why an available target ended without a form, and where a pack declares a target that has none. */
function noFormMessage(target: ResolvedTarget, lemma: string, empty: EmptyStage | null): string {
  const where = empty === null
    ? 'no periphrasis ran, because the verb lists no perfect auxiliary'
    : `the ${empty.stage} stage came back empty${empty.lemma === lemma ? '' : ` for ${empty.lemma}`}`;
  return `No form for ${targetKey(target)} of ${lemma}: ${where}. A target without a form must be declared unavailable through availability.`;
}

/** Distinct rule ids of a form's own steps and its parts' steps, in order. */
function ruleIdsOf(steps: readonly DerivationStep[], parts: readonly ConjugationPart[]): string[] {
  return [...new Set([...steps, ...parts.flatMap(part => part.steps ?? [])].map(s => s.rule))];
}
