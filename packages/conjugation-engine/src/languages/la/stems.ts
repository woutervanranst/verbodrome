/**
 * The three stems and what each feeds (A&G §164; GD §4.2): the present stem, the perfect stem (perfect system, active)
 * and the supine stem (perfect and future participles, supine). Each comes with the steps that say where it is from.
 */
import { step } from '../../core/derivation.js';
import type { DerivationStep } from '../../core/derivation.js';
import { one } from '../../core/fork.js';
import type { Fork, VariantTags } from '../../core/fork.js';
import type { LatinLexeme, StemSource } from './lexicon.js';
import { latinRules } from './rules.js';

const sourceTags = (source: StemSource): VariantTags => source.kind === 'listed'
  ? { ...(source.usage ? { usage: source.usage } : {}), ...(source.pattern ? { pattern: source.pattern } : {}) } : {};

/** The present stem of the lexeme: amāre without -re gives amā-; a stem the lexicon gives (fī-) is lexical. */
export function presentStem(lexeme: LatinLexeme): Fork<string> {
  const present = lexeme.presentStem;
  if (present === null) return [];
  return one(present.stem, [present.lexical
    ? step(latinRules['la.stem.lexical'], lexeme.lemma, present.stem)
    : step(latinRules['la.stem.present'], present.from, present.stem, { ending: present.ending })]);
}

/** A stem the lexicon gives for one kind of form (vel- for velim, eunt- for euntis, faciend- for faciendus). */
export function lexicalStem(lexeme: LatinLexeme, kind: string): Fork<string> | null {
  const stem = lexeme.stems[kind];
  return stem === undefined ? null : one(stem, [step(latinRules['la.stem.lexical'], lexeme.lemma, stem)]);
}

function defaultSteps(source: Extract<StemSource, { kind: 'default' }>, regularRule: 'la.stem.perfect-regular' | 'la.stem.supine-regular',
  junctionRule: 'la.stem.s-junction' | 'la.stem.t-junction'): DerivationStep[] {
  const steps: DerivationStep[] = [];
  if (source.suffix !== '' || source.joined !== source.base) steps.push(step(latinRules[regularRule], source.base, source.joined, { suffix: source.suffix }));
  if (source.junction) steps.push(step(latinRules[junctionRule], source.joined, source.stem, { consonant: source.junction.consonant, result: source.junction.result }));
  return steps;
}

/** The perfect stems, the first preferred: from the principal part (tēxī → tēx-) or the default of an unknown verb. */
export function perfectStems(lexeme: LatinLexeme): Fork<string> {
  return lexeme.perfectStems.map(source => ({
    value: source.stem,
    steps: source.kind === 'listed'
      ? [step(latinRules['la.stem.perfect'], source.part, source.stem)]
      : defaultSteps(source, 'la.stem.perfect-regular', 'la.stem.s-junction'),
    tags: sourceTags(source),
  }));
}

/** The supine stems: from the principal part (amātum → amāt-) or the default of an unknown verb (treg + t → trect-). */
export function supineStems(lexeme: LatinLexeme): Fork<string> {
  return lexeme.supineStems.map(source => ({
    value: source.stem,
    steps: source.kind === 'listed'
      ? source.participle
        ? [step(latinRules['la.stem.participle'], source.part.replace(/um$/u, 'us'), source.stem)]
        : [step(latinRules['la.stem.supine'], source.part, source.stem)]
      : defaultSteps(source, 'la.stem.supine-regular', 'la.stem.t-junction'),
    tags: sourceTags(source),
  }));
}

/** The stems of the future participle: the listed ones (morit- of moritūrus), else the supine stems. */
export function futureParticipleStems(lexeme: LatinLexeme): Fork<string> {
  if (!lexeme.futureParticipleStems.length) return supineStems(lexeme);
  return lexeme.futureParticipleStems.map(source => ({
    value: source.stem, steps: [step(latinRules['la.stem.lexical'], lexeme.lemma, source.stem)], tags: sourceTags(source),
  }));
}
