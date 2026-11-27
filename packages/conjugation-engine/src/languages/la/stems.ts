/**
 * The three stems and what each feeds (A&G §164; GD §4.2): the present stem, the perfect stem (perfect system, active)
 * and the supine stem (perfect and future participles, supine). Each comes with the steps that say where it is from.
 */
import { step } from '../../core/derivation.js';
import type { DerivationStep } from '../../core/derivation.js';
import { one } from '../../core/fork.js';
import type { Fork, VariantTags } from '../../core/fork.js';
import { latinKey } from './key.js';
import type { LatinConjugation, LatinLexeme, StemSource } from './lexicon.js';
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
  const tags = lexeme.entry?.stemTags?.[kind] ?? {};
  return stem === undefined ? null : one(stem, [step(latinRules['la.stem.lexical'], lexeme.lemma, stem)], tags);
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

// The default stems of a verb the lexicon does not have (GD §3.3): the junction phonology of -s- and -t- (A&G §15).

/** The perfect -s- of a stop stem (GD §3.3; A&G §15; Bennett §118.3.a). */
export function sJunction(root: string): DefaultStem {
  const joined = `${root}s`;
  const make = (consonant: string, result: string, stem: string): DefaultStem =>
    ({ kind: 'default', base: root, suffix: 's', joined, junction: stem === joined ? null : { consonant, result }, stem });
  const key = latinKey(root);
  if (/(?:qu|gu)$/u.test(key)) return make(root.slice(-2), 'x', `${root.slice(0, -2)}x`);
  if (/[cgh]$/u.test(key)) return make(root.slice(-1), 'x', `${root.slice(0, -1)}x`);
  if (key.endsWith('b')) return make('b', 'p', `${root.slice(0, -1)}ps`);
  if (/[dt]$/u.test(key)) {
    // As in the supine: ss after a short or unmarked vowel, s after a long vowel, a diphthong or a consonant (A&G §15).
    const before = root.slice(0, -1);
    const single = /(?:[āēīōū]|ae|au|oe|[^aeiouāēīōū])$/u.test(before);
    return make(root.slice(-1), single ? 's' : 'ss', `${before}${single ? 's' : 'ss'}`);
  }
  if (key.endsWith('m')) return make('m', 'mp', `${root}ps`);
  if (key.endsWith('r')) return make('r', 's', `${root.slice(0, -1)}ss`);
  return make('', '', joined);
}

/** The supine -t- of a stop stem (A&G §178 Note 1; Bennett §119.1.a). */
export function tJunction(root: string): DefaultStem {
  const joined = `${root}t`;
  const make = (consonant: string, result: string, stem: string): DefaultStem =>
    ({ kind: 'default', base: root, suffix: 't', joined, junction: stem === joined ? null : { consonant, result }, stem });
  const key = latinKey(root);
  if (/(?:qu|gu)$/u.test(key)) return make(root.slice(-2), 'c', `${root.slice(0, -2)}ct`);
  if (/[cgh]$/u.test(key)) return make(root.slice(-1), 'c', `${root.slice(0, -1)}ct`);
  if (key.endsWith('b')) return make('b', 'p', `${root.slice(0, -1)}pt`);
  if (/[dt]$/u.test(key)) {
    // ss after a short or unmarked vowel, s after a long vowel, a diphthong or a consonant.
    const before = root.slice(0, -1);
    const single = /(?:[āēīōū]|ae|au|oe|[^aeiouāēīōū])$/u.test(before);
    return make(root.slice(-1), single ? 's' : 'ss', `${before}${single ? 's' : 'ss'}`);
  }
  if (key.endsWith('m')) return make('m', 'mp', `${root}pt`);
  if (key.endsWith('r')) return make('r', 's', `${root.slice(0, -1)}st`);
  return make('', '', joined);
}

type DefaultStem = Extract<StemSource, { kind: 'default' }>;

const regular = (base: string, suffix: string): DefaultStem =>
  ({ kind: 'default', base, suffix, joined: base + suffix, junction: null, stem: base + suffix });

export type DefaultRule = 'la.classify.default-parts' | 'la.classify.default-sigmatic' | 'la.classify.default-uo' | 'la.classify.default-sco' | 'la.classify.default-u';

/** The default perfect and supine of an unknown verb (GD §3.3) and the assumption that names them. */
export function defaults(conjugation: Exclude<LatinConjugation, 'irregular'>, root: string, stem: string): { perfect: StemSource; supine: StemSource; rule: DefaultRule } {
  switch (conjugation) {
    case 'first': case 'fourth':
      return { perfect: regular(stem, 'v'), supine: regular(stem, 't'), rule: 'la.classify.default-parts' };
    case 'second':
      return { perfect: regular(root, 'u'), supine: regular(root, 'it'), rule: 'la.classify.default-parts' };
    case 'third': case 'thirdIo': {
      const key = latinKey(root);
      if (key.endsWith('sc')) return { perfect: regular(root.slice(0, -2), 'v'), supine: regular(root.slice(0, -2), 't'), rule: 'la.classify.default-sco' };
      if (/(?:[cghbpdt]|qu|gu)$/u.test(key)) return { perfect: sJunction(root), supine: tJunction(root), rule: 'la.classify.default-sigmatic' };
      if (key.endsWith('u')) {
        return { perfect: regular(root, ''), supine: { ...regular(root, 't'), stem: `${root.slice(0, -1)}ūt`, joined: `${root.slice(0, -1)}ūt` }, rule: 'la.classify.default-uo' };
      }
      return { perfect: regular(root, 'u'), supine: regular(root, 'it'), rule: 'la.classify.default-u' };
    }
  }
}
