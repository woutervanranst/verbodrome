import { grammaticalPart } from '../parts.js';
import type { ConjugationPart, Mood, PartFeatures, ResolvedTarget, Tense } from '../types.js';
import type { DerivationStep } from './derivation.js';
import type { Fork } from './fork.js';
import type { Agreement, LexemeBase } from './grammar.js';
import type { PackRendering, SubjectSlot } from './pack.js';
import type { Cell } from './staged.js';

/** One word of the verb chain as synthesised: `cell` and `lemma` are null for literal words, `steps` are word-level. */
export interface ChainWord {
  readonly role: 'auxiliary' | 'lexicalVerb' | 'linker' | 'particle' | 'moodMarker';
  readonly text: string;
  readonly lemma: string | null;
  readonly cell: Cell | null;
  readonly steps: readonly DerivationStep[];
}

export interface ClauseContext<X extends LexemeBase> {
  readonly query: Readonly<Record<string, unknown>>;
  /** The queried verb, in the paradigm being built. */
  readonly lexeme: X;
  /** The target being built; in `assemble`, with the agreement chosen for this form. */
  readonly target: ResolvedTarget;
  /**
   * The slot `target.subject` names: its pronoun, and its gender even where the target has none (`genderedTargets`
   * unset). Null for a target without a subject slot.
   */
  readonly subject: SubjectSlot | null;
  /**
   * The cells that will take the agreement `agreements` chooses: for a periphrasis, the cells of its `agree` elements;
   * for a simple non-finite target, that target's own cell; empty otherwise. The cells carry no agreement yet, also in
   * `assemble`, where `target.agreement` holds the one chosen.
   */
  readonly agreeing: readonly Cell[];
  /** The perfect auxiliary this run uses, or null. */
  readonly auxiliary: string | null;
  /** The pack's rendering, for building parts. */
  readonly rendering: PackRendering;
}

export interface ClauseGrammar<X extends LexemeBase> {
  /** Agreement contexts to generate for elements marked `agree`; [null-valued outcome] when nothing agrees. */
  agreements(context: ClauseContext<X>): Fork<Agreement | null>;
  /**
   * Orders the verb chain (given in recipe order) and adds subject, clitics, particles. Outcome steps are clause-level
   * steps of the form; each part carries its word's steps (see `wordPart`).
   */
  assemble(words: readonly ChainWord[], context: ClauseContext<X>): Fork<readonly ConjugationPart[]>;
}

/**
 * Features a cell implies: person, number, mood and tense for a finite word, agreement (and its case) for a non-finite
 * one, and the voice of either when the cell has one (an active cell has none).
 */
function cellFeatures(cell: Cell | null): Partial<PartFeatures> {
  if (cell === null) return {};
  if (cell.kind === 'finite') {
    // A cell carries its pack's own mood and tense ids, which are the registry's once the pack is registered.
    return {
      mood: cell.mood as Mood, tense: cell.tense as Tense, person: cell.person, number: cell.number, verbForm: 'finite',
      ...(cell.voice ? { voice: cell.voice } : {}),
    };
  }
  return {
    gender: cell.agreement?.gender ?? null, number: cell.agreement?.number ?? null,
    ...(cell.agreement?.case ? { case: cell.agreement.case } : {}), ...(cell.voice ? { voice: cell.voice } : {}),
  };
}

/** What `wordPart` can set beyond the word's features. */
export interface WordPartOptions {
  /** How the part joins the word before it; default `'space'`. */
  readonly joinBefore?: ConjugationPart['joinBefore'];
  /** The phonological flags `rendering.onset` is asked with; default `{ aspiratedH: false }`. */
  readonly onsetFlags?: Readonly<Record<string, boolean>>;
}

/**
 * The part for a chain word, carrying the word's steps. Features come from its cell; `features` adds or overrides
 * them (a non-finite word's mood, tense and verbForm are the pack's to name, and so are `aspect` and a gerund's or
 * supine's `verbForm`).
 */
export function wordPart(
  rendering: PackRendering, word: ChainWord, features: Partial<PartFeatures> = {}, options: WordPartOptions = {},
): ConjugationPart {
  return {
    ...grammaticalPart(
      rendering, word.role, word.text, word.lemma, { ...cellFeatures(word.cell), ...features },
      options.joinBefore, false, options.onsetFlags,
    ),
    steps: word.steps,
  };
}
