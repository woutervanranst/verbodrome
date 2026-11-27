/**
 * French classification (GD §3): from the query to one lexeme per paradigm, with every classification step and
 * assumption recorded. The checks, their order, codes and messages are those of the legacy resolver.
 */
import { step } from '../../core/derivation.js';
import type { DerivationStep } from '../../core/derivation.js';
import type { Fork, VariantTags } from '../../core/fork.js';
import { renderWith } from '../../core/render.js';
import { ConjugationError } from '../../errors.js';
import { grammaticalPart } from '../../parts.js';
import type { FrenchConjugationOptions } from '../../types.js';
import type { FamilyEntry } from './family.js';
import { frenchFamilies } from './families.js';
import type { FrenchLexeme, ProductiveParadigm } from './grammar.js';
import {
  aspiratedH, canonicalLemma, dualAuxiliary, essentialReflexives, etreVerbs, indirectReflexives, knownAvoirVerbs, restrictions,
} from './lexicon.js';
import { groupOf, isListedProductive, productiveLabel, productiveLabels } from './paradigms.js';
import type { Group } from './paradigms.js';
import { frenchRendering } from './rendering.js';
import { frenchRules } from './rules.js';

/** The family an infinitive selects, by the selector that matched: its listed lemma, or the longest suffix. */
export interface FamilyChoice { readonly family: FamilyEntry; readonly selector: string; readonly listed: boolean }

/**
 * The family of an infinitive (GD §3): an entry that lists it, otherwise the entry with the longest suffix that ends it,
 * skipping entries whose `except` lists it or whose `exceptEndings` end it; null for a productive verb.
 */
export function familyFor(lemma: string): FamilyChoice | null {
  let best: FamilyChoice | null = null;
  for (const family of frenchFamilies) {
    if (family.except.includes(lemma) || family.exceptEndings.some(ending => lemma.endsWith(ending))) continue;
    if (family.lemmas.includes(lemma)) return { family, selector: lemma, listed: true };
    for (const suffix of family.suffixes) {
      if (lemma.endsWith(suffix) && (best === null || suffix.length > best.selector.length)) best = { family, selector: suffix, listed: suffix === lemma };
    }
  }
  return best;
}

/** The model an infinitive reports with no hint: its family, or the label its productive group's rules compute (GD §3.2). */
export function labelOf(lemma: string): string | null {
  const family = familyFor(lemma);
  if (family) return family.family.id;
  const group = groupOf(lemma);
  return group === null ? null : productiveLabel(lemma, group);
}

/** Whether an infinitive is listed by name, not covered by a suffix (replaces `isListedFrenchLemma`). */
export function isListedLemma(lemma: string): boolean {
  const family = familyFor(lemma);
  return family ? family.listed : groupOf(lemma) !== null && isListedProductive(lemma);
}

type Source = FrenchLexeme['classSource'];

/** Where the forms of a verb come from: a family, a productive group, or the principal parts a hint gives. */
type ClassChoice =
  | { readonly kind: 'family'; readonly family: FamilyEntry; readonly source: Source; readonly steps: readonly DerivationStep[] }
  | { readonly kind: 'productive'; readonly group: Group; readonly source: Source; readonly steps: readonly DerivationStep[] }
  | { readonly kind: 'parts'; readonly steps: readonly DerivationStep[] };

const invalidHint = (message: string) => new ConjugationError('INVALID_HINT', message);

/** A productive class: its group step, how it was chosen, and the model its spelling makes it follow. */
function productive(lemma: string, group: Group, source: Source, how: readonly DerivationStep[]): ClassChoice {
  const label = productiveLabel(lemma, group);
  // An assumed regular verb is not restated as a fact: the assumption says which group is read, and why.
  const groupStep = source === 'regularRule' ? [] : [step(frenchRules['fr.classify.group'], lemma, null, { group })];
  const model = ['aimer', 'finir', 'rompre'].includes(label) ? [] : [step(frenchRules['fr.classify.spelling-model'], lemma, null, { model: label })];
  return { kind: 'productive', group, source, steps: [...groupStep, ...how, ...model] };
}

/** The family or class a `model` hint names: a family whose selector ends the infinitive, or the infinitive's own label. */
function modelHint(lemma: string, model: string): ClassChoice {
  const hintStep = step(frenchRules['fr.classify.model-hint'], lemma, null, { model });
  const family = frenchFamilies.find(entry => entry.id === model);
  if (family) {
    const fits = [...family.suffixes, ...family.lemmas].some(selector => lemma.endsWith(selector));
    if (fits && family.strip <= lemma.length) return { kind: 'family', family, source: 'explicitHint', steps: [hintStep] };
  } else if (productiveLabels.includes(model)) {
    const group = groupOf(lemma);
    if (group !== null && productiveLabel(lemma, group) === model) return productive(lemma, group, 'explicitHint', [hintStep]);
  }
  throw invalidHint('An irregular French model must be a known suffix of the requested infinitive.');
}

/** How the verb is conjugated (GD §3 steps 3-4), with the hint checks of the legacy resolver in its order. */
function classOf(lemma: string, options: FrenchConjugationOptions): ClassChoice {
  const { classHint, model, stems } = options;
  const modelClass = model === 'aimer' ? 'er' : model === 'finir' ? 'ir' : model === 'rendre' ? 're' : undefined;
  if (classHint && model && classHint !== modelClass) throw invalidHint('French classHint and model must describe the same regular class.');
  const explicit = classHint ?? modelClass;
  if (explicit) {
    const fits = explicit === 'ir' ? /[iï]r$/u.test(lemma) && !lemma.endsWith('oir') : lemma.endsWith(explicit);
    if (!fits) throw invalidHint(`French class ${explicit} is incompatible with ${lemma}.`);
    return productive(lemma, explicit, 'explicitHint', [step(frenchRules['fr.classify.class-hint'], lemma, null, { group: explicit })]);
  }
  if (model) return modelHint(lemma, model);
  const chosen = familyFor(lemma);
  if (chosen) {
    const { family, selector, listed } = chosen;
    const how = listed
      ? step(frenchRules['fr.classify.lexicon'], lemma, null, { family: family.id })
      : step(frenchRules['fr.classify.family-suffix'], null, null, { lemma, family: family.id, suffix: selector });
    return { kind: 'family', family, source: 'lexicon', steps: [how] };
  }
  const group = groupOf(lemma);
  if (group !== null) {
    if (isListedProductive(lemma)) {
      return productive(lemma, group, 'lexicon', [step(frenchRules['fr.classify.lexicon'], lemma, null, { family: productiveLabel(lemma, group) })]);
    }
    return productive(lemma, group, 'regularRule', [step(frenchRules['fr.classify.assume-regular'], null, null, { lemma, group })]);
  }
  if (stems?.singular && stems.plural && stems.future && stems.past && stems.pastVowel && stems.pastParticiple) {
    return { kind: 'parts', steps: [step(frenchRules['fr.classify.principal-parts-hint'], lemma, null)] };
  }
  throw new ConjugationError('AMBIGUOUS_CLASSIFICATION', `No productive French model for ${lemma}; provide a compatible model or complete principal parts.`);
}

/** Whether the verb has compound tenses at all: a past participle in some paradigm, and no `compounds: 'none'`. */
function hasCompounds(choice: ClassChoice, options: FrenchConjugationOptions): boolean {
  if (choice.kind === 'productive') return true;
  if (choice.kind === 'parts') return Boolean(options.stems?.pastParticiple);
  const { family } = choice;
  return family.flags.compounds !== 'none' && family.paradigms.some(paradigm => paradigm.parts.PP !== undefined);
}

/** One paradigm of the chosen class, with the tags that mark it when there are several. */
interface Paradigm { readonly paradigm: FrenchLexeme['paradigm']; readonly tags: VariantTags }

function paradigmsOf(choice: ClassChoice, lemma: string): readonly Paradigm[] {
  if (choice.kind === 'family') {
    return choice.family.paradigms.map(paradigm => ({
      paradigm,
      tags: paradigm.pattern === null ? {} : { pattern: paradigm.pattern, ...(paradigm.usage === 'dated' ? { usage: 'dated' as const } : {}) },
    }));
  }
  if (choice.kind === 'productive' && productiveLabel(lemma, choice.group) === 'payer') {
    return (['y-to-i', 'keep-y'] as const).map(pattern => ({ paradigm: { pattern } satisfies ProductiveParadigm, tags: { pattern } }));
  }
  return [{ paradigm: { pattern: null }, tags: {} }];
}

/** The steps with the assumptions first, each part in its own order. */
const assumptionsFirst = (steps: readonly DerivationStep[]): DerivationStep[] =>
  [...steps.filter(s => s.kind === 'assumption'), ...steps.filter(s => s.kind !== 'assumption')];

/**
 * One lexeme per paradigm of the queried verb (GD §3), in output order. Throws INVALID_INFINITIVE, INVALID_HINT and
 * AMBIGUOUS_CLASSIFICATION with the legacy messages.
 */
export function classifyFrench(query: Readonly<Record<string, unknown>>): Fork<FrenchLexeme> {
  const options = query as FrenchConjugationOptions;
  const infinitive = String(options.infinitive);
  const input = infinitive.replace(/^(se |s')/u, '');
  const prefixed = input !== infinitive;
  const reflexive = prefixed || essentialReflexives.has(input);
  if (!/^[\p{L}][\p{L}\p{M}'-]*$/u.test(input)) throw new ConjugationError('INVALID_INFINITIVE', 'Expected a French infinitive, optionally prefixed with se or s\'.');
  const { classHint } = options;
  if (classHint && !(classHint === 'ir' ? /[iï]r$/u.test(input) : input.endsWith(classHint))) {
    throw invalidHint(`Class ${classHint} is incompatible with ${input}.`);
  }
  const lemma = canonicalLemma(input);
  const opening: DerivationStep[] = [];
  // « The se in front of laver marks a pronominal verb: se laver is conjugated with a reflexive pronoun. »
  if (prefixed) opening.push(step(frenchRules['fr.classify.reflexive'], input, infinitive));
  if (essentialReflexives.has(input)) opening.push(step(frenchRules['fr.classify.essentially-pronominal'], input, null));
  if (lemma !== input) opening.push(step(frenchRules['fr.classify.canonical-spelling'], input, lemma));
  const choice = classOf(lemma, options);
  const source: Source = choice.kind === 'parts' ? 'explicitHint' : choice.source;
  const family = choice.kind === 'family' ? choice.family : null;
  const label = choice.kind === 'family' ? choice.family.id : choice.kind === 'productive' ? productiveLabel(lemma, choice.group) : 'principal-parts';

  // Auxiliaries (GD §3 step 6).
  const possible = reflexive ? ['être'] : dualAuxiliary.has(lemma) ? ['avoir', 'être'] : [etreVerbs.has(lemma) ? 'être' : 'avoir'];
  const { auxiliary } = options;
  if (auxiliary && (reflexive || source === 'lexicon' || etreVerbs.has(lemma) || knownAvoirVerbs.has(lemma)) && !possible.includes(auxiliary)) {
    throw invalidHint(`${lemma} does not accept auxiliary ${auxiliary} in this model.`);
  }
  // The auxiliary is a lexical fact only for a verb a list names (each checked in the Académie's table); for any other
  // verb it is an assumption. A verb without compound tenses (gésir, seoir, the infinitive-only verbs) records neither.
  const auxiliarySteps: DerivationStep[] = [];
  if (reflexive) auxiliarySteps.push(step(frenchRules['fr.classify.aux-pronominal'], lemma, null));
  else if (dualAuxiliary.has(lemma)) auxiliarySteps.push(step(frenchRules['fr.classify.aux-dual'], lemma, null));
  else if (etreVerbs.has(lemma)) auxiliarySteps.push(step(frenchRules['fr.classify.aux-etre'], lemma, null));
  else if (!hasCompounds(choice, options)) { /* no compound tense: no auxiliary to state */ }
  else if (knownAvoirVerbs.has(lemma)) auxiliarySteps.push(step(frenchRules['fr.classify.aux-avoir'], lemma, null));
  else if (!auxiliary) auxiliarySteps.push(step(frenchRules['fr.classify.assume-avoir'], null, null));
  if (auxiliary) auxiliarySteps.push(step(frenchRules['fr.classify.aux-hint'], lemma, null, { auxiliary }));

  // The reflexive pronoun as object, and the participle hints that contradict the verb (GD §3 step 7).
  const { reflexiveObject, precedingDirectObject } = options;
  if (reflexiveObject === 'indirect' && essentialReflexives.has(lemma)) {
    throw invalidHint(`${lemma} is essentially pronominal; its participle agrees with the subject.`);
  }
  if (precedingDirectObject && family?.flags.invariableParticiple) {
    throw invalidHint(`${lemma} has an invariant verbal participle in this model; a preceding quantity does not license object agreement.`);
  }
  const indirect = reflexiveObject === 'indirect' || (reflexiveObject === undefined && indirectReflexives.has(lemma));
  const objectSteps: DerivationStep[] = [];
  if (reflexive && indirect) objectSteps.push(step(frenchRules['fr.classify.indirect-reflexive'], lemma, null));
  else if (reflexive && reflexiveObject === undefined && !essentialReflexives.has(lemma)) {
    objectSteps.push(step(frenchRules['fr.classify.assume-direct-reflexive'], null, null));
  }

  // Initial h (GD §3 step 8).
  const aspirated = options.aspiratedH ?? aspiratedH.has(lemma);
  const hSteps: DerivationStep[] = [];
  if (lemma.startsWith('h') && aspirated) hSteps.push(step(frenchRules['fr.classify.aspirated-h'], lemma, null));
  else if (lemma.startsWith('h') && options.aspiratedH === undefined) hSteps.push(step(frenchRules['fr.classify.assume-mute-h'], null, null));

  const hints = options.stems && Object.keys(options.stems).length ? options.stems : null;
  // A plural hint without thirdPlural also gives the ils stem (and the subjunctive's): recorded as an assumption.
  const hintSteps = hints?.plural && !hints.thirdPlural ? [step(frenchRules['fr.classify.assume-ils-stem'], null, hints.plural)] : [];
  const verbId = reflexive ? renderWith(frenchRendering, [
    grammaticalPart(frenchRendering, 'reflexivePronoun', 'se'),
    grammaticalPart(frenchRendering, 'lexicalVerb', lemma, lemma, {}, 'space', aspirated),
  ]) : lemma;
  const paradigms = paradigmsOf(choice, lemma);
  return paradigms.map(({ paradigm, tags }) => ({
    value: {
      lemma, verbId, classId: label, classSource: hints ? 'explicitHint' : source, reflexive, auxiliaries: auxiliary ? [auxiliary] : possible,
      particle: null, group: choice.kind === 'productive' ? choice.group : null, family, paradigm, label, hints,
      indirect: reflexive && indirect, aspiratedH: aspirated, auxiliaryChoice: possible.length > 1, restriction: restrictions[lemma] ?? {},
    },
    // The assumptions come first, in the order the analysis lists them; the facts follow.
    steps: assumptionsFirst([
      ...opening, ...choice.steps,
      ...(paradigms.length > 1 ? [step(frenchRules['fr.classify.paradigm'], lemma, null, { pattern: paradigm.pattern! })] : []),
      ...auxiliarySteps, ...objectSteps, ...hSteps, ...hintSteps,
    ]),
    tags,
  }));
}

/** The lexeme of a verb a periphrasis names (être, avoir, aller, venir): its first paradigm, without hints. */
export function frenchLexemeOf(lemma: string): FrenchLexeme {
  return classifyFrench({ language: 'fr', infinitive: lemma })[0]!.value;
}
