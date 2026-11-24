import { ConjugationError } from '../errors.js';
import { grammaticalPart } from '../parts.js';
import type { ConjugationPart, Mood, PartFeatures, ResolvedTarget, Tense } from '../types.js';
import type { DerivationStep } from './derivation.js';
import type { Fork } from './fork.js';
import type { Agreement, Gender, LexemeBase, Voice } from './grammar.js';
import type { PackRendering, SubjectSlot } from './pack.js';
import type { Cell } from './staged.js';

/** One word of the verb chain as synthesised: `cell` and `lemma` are null for literal words, `steps` are word-level. */
export interface ChainWord {
  readonly role: 'auxiliary' | 'lexicalVerb' | 'linker' | 'particle' | 'moodMarker';
  readonly text: string;
  readonly lemma: string | null;
  readonly cell: Cell | null;
  readonly steps: readonly DerivationStep[];
  /**
   * The voice of the periphrasis this word belongs to, set by the engine on the verb words of a periphrasis that declares
   * a marked `voice` (the passive); absent otherwise, and for literal words. `wordPart` gives the part this voice, so
   * every verb of a passive compound carries it, whatever its own cell. A simple target's word has its cell's voice.
   */
  readonly voice?: Voice;
}

export interface ClauseContext<X extends LexemeBase> {
  readonly query: Readonly<Record<string, unknown>>;
  /** The queried verb, in the paradigm being built. */
  readonly lexeme: X;
  /**
   * The target being built; in `agreements` and `assemble`, with the gender `subjectGenders` chose for this form, and in
   * `assemble` with the agreement chosen for it too.
   */
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
  /**
   * The subject genders a form of this construction shows when its subject slot has none (French: il/elle, and
   * je/tu/nous/vous when a participle agrees with the subject; none for an impersonal il). Each outcome becomes the form's
   * `target.gender` and the target that `agreements` and `assemble` see; its steps are form-level steps. Optional and
   * consulted for every target: absent, the target's own gender (one outcome, no step). An empty fork leaves the target
   * without a form, which is a GENERATION_FAILURE naming this stage.
   */
  subjectGenders?(context: ClauseContext<X>): Fork<Gender | null>;
  /** Agreement contexts to generate for elements marked `agree`; [null-valued outcome] when nothing agrees. */
  agreements(context: ClauseContext<X>): Fork<Agreement | null>;
  /**
   * Orders the verb chain (given in recipe order) and adds subject, clitics, particles. Outcome steps are clause-level
   * steps of the form; each part carries its word's steps (see `wordPart`).
   */
  assemble(words: readonly ChainWord[], context: ClauseContext<X>): Fork<readonly ConjugationPart[]>;
}

/** The `voice` feature for `voice`: only a marked voice is written, since active is the absence of the field. */
function markedVoice(voice: Voice | undefined): { readonly voice?: Voice } {
  return voice === undefined || voice === 'active' ? {} : { voice };
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
      ...markedVoice(cell.voice),
    };
  }
  return {
    gender: cell.agreement?.gender ?? null, number: cell.agreement?.number ?? null,
    ...(cell.agreement?.case ? { case: cell.agreement.case } : {}), ...markedVoice(cell.voice),
  };
}

/** What `wordPart` can set beyond the word's features. */
export interface WordPartOptions {
  /** How the part joins the word before it; default `'space'`. */
  readonly joinBefore?: ConjugationPart['joinBefore'];
  /** The phonological flags `rendering.onset` is asked with; default `{ aspiratedH: false }`. */
  readonly onsetFlags?: Readonly<Record<string, boolean>>;
}

const optionKeys: readonly string[] = ['joinBefore', 'onsetFlags'];

/**
 * The part for a chain word, carrying the word's steps. Features come from its cell, and its voice is the word's own
 * (`ChainWord.voice`, the voice of its periphrasis) or else its cell's; `features` adds or overrides them (a non-finite
 * word's mood, tense and verbForm are the pack's to name, and so are `aspect` and a gerund's or supine's `verbForm`).
 * `options` set how the part joins and its onset flags. A pack that has no features to add passes the options as the
 * third argument: `wordPart(rendering, word, { joinBefore: 'hyphen' })`.
 */
export function wordPart(rendering: PackRendering, word: ChainWord, features?: Partial<PartFeatures>, options?: WordPartOptions): ConjugationPart;
export function wordPart(rendering: PackRendering, word: ChainWord, options: WordPartOptions): ConjugationPart;
export function wordPart(
  rendering: PackRendering, word: ChainWord, third: Partial<PartFeatures> | WordPartOptions = {}, fourth?: WordPartOptions,
): ConjugationPart {
  // Options are told from features by their own keys: every key of an options object is `joinBefore` or `onsetFlags`.
  const keys = Object.keys(third);
  const optionLike = keys.filter(key => optionKeys.includes(key));
  if (optionLike.length > 0 && (optionLike.length < keys.length || fourth !== undefined)) {
    throw new ConjugationError('GENERATION_FAILURE', `wordPart was given ${keys.join(', ')} as one object: options (${optionKeys.join(', ')}) and features are separate arguments.`);
  }
  const [features, options]: [Partial<PartFeatures>, WordPartOptions] = optionLike.length > 0
    ? [{}, third as WordPartOptions] : [third as Partial<PartFeatures>, fourth ?? {}];
  return {
    ...grammaticalPart(
      rendering, word.role, word.text, word.lemma, { ...cellFeatures(word.cell), ...markedVoice(word.voice), ...features },
      options.joinBefore, false, options.onsetFlags,
    ),
    steps: word.steps,
  };
}
