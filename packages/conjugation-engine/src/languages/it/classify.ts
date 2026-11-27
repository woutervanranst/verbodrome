import { step } from '../../core/derivation.js';
import type { DerivationStep } from '../../core/derivation.js';
import type { Fork, Outcome } from '../../core/fork.js';
import { ConjugationError } from '../../errors.js';
import { derivedDifferently, noInherit, resolveFamily } from './families.js';
import type { Family } from './families.js';
import { italianLexicon } from './lexicon.js';
import type { Auxiliary, ItalianEntry, ItalianLexeme } from './lexicon.js';
import { avereVerbs, dualVerbs, essereVerbs, impersonalVerbs, iscBothVerbs, iscVerbs, nonIscVerbs, palatalVerbs, stressedIVerbs } from './lists.js';
import { italianRules as R } from './rules.js';
import { readPages } from './verification.js';

const onSideList = (lemma: string): boolean => [nonIscVerbs, iscVerbs, essereVerbs, avereVerbs, stressedIVerbs, palatalVerbs, impersonalVerbs]
  .some(list => list.has(lemma)) || Object.hasOwn(iscBothVerbs, lemma) || Object.hasOwn(dualVerbs, lemma);
import type { ItalianStemHints } from './spec.js';

/** -ciare, -giare, -sciare, -gliare, -chiare, -ghiare: the i only marks the sound of the consonant before it. */
const graphicI = /(?:c|g|gl|ch|gh)iare$/u;

/** The query's infinitive without the Vocabolario's stress marks (créscere, invïare). */
function withoutAccents(text: string): string {
  return text.normalize('NFD').replace(/\p{M}/gu, '').normalize('NFC');
}

function invalid(message: string): never {
  throw new ConjugationError('INVALID_INFINITIVE', message);
}

/** The infinitive a reflexive lemma is built on: lavarsi → lavare, porsi → porre, tradursi → tradurre. */
function reflexiveBase(lemma: string): string {
  const stem = lemma.slice(0, -2);
  const contracted = `${stem}re`;
  if (contracted.endsWith('rre') && (Object.hasOwn(italianLexicon, contracted) || resolveFamily(contracted) !== null)) return contracted;
  return `${stem}e`;
}

const conjugations = ['are', 'ere', 'ire'] as const;
type Conjugation = typeof conjugations[number];

function endingOf(base: string): Conjugation {
  const ending = conjugations.find(end => base.endsWith(end) && base.length > end.length);
  if (ending === undefined) {
    invalid(`${base} is not an Italian infinitive: an infinitive ends in -are, -ere, -ire or is a contracted verb such as porre, trarre, condurre.`);
  }
  return ending;
}

/** What classification knows before the paradigms are split. */
interface Known {
  readonly entry: ItalianEntry | null;
  readonly family: Family | null;
  readonly listed: boolean;
  readonly conjugation: Conjugation;
  readonly root: string;
  readonly classLabel: string;
}

/** Steps 3–6 of grammar design §3.2: lexicon, family, no-inherit list, ending. */
function lookUp(base: string, steps: DerivationStep[], hints: ItalianStemHints): Known {
  if (Object.hasOwn(italianLexicon, base)) {
    const entry = italianLexicon[base]!;
    const conjugation = entry.class === 'contracted' ? 'ere' : entry.class === 'irregular' ? endingOf(base) : entry.class;
    steps.push(step(R['it.classify.lexicon'], base, entry.class === 'ire' && entry.isc === 'yes' ? 'ire-isc' : entry.class));
    return { entry, family: null, listed: true, conjugation, root: entry.long ?? base.slice(0, -3), classLabel: entry.class };
  }
  const family = resolveFamily(base);
  if (family !== null) {
    const { entry } = family;
    if (family.suffix !== null) {
      steps.push(step(R['it.classify.suffix-family'], base, null, { suffix: family.suffix, model: family.base }));
    } else {
      steps.push(step(R['it.classify.family'], base, null, { prefix: family.prefix, base: family.base }));
      if (family.doubled) steps.push(step(R['it.classify.prefix-doubling'], null, base, { prefix: family.prefix, base: family.base }));
    }
    // A derived verb whose header was not read is taken to follow its base: that inference is an assumption.
    if (family.assumed) steps.push(step(R['it.classify.assume-family'], base, null, { base: family.base }));
    const conjugation = entry.class === 'contracted' ? 'ere' : entry.class === 'irregular' ? endingOf(base) : entry.class;
    return { entry, family, listed: !family.assumed, conjugation, root: entry.long ?? base.slice(0, -3), classLabel: entry.class };
  }
  const lookalike = noInherit.get(base);
  if (lookalike !== undefined) steps.push(step(R['it.classify.no-inherit'], base, null, { base: lookalike }));
  const source = derivedDifferently.get(base);
  if (source !== undefined) steps.push(step(R['it.classify.derived-differently'], base, null, { base: source }));
  const conjugation = endingOf(base);
  steps.push(step(R['it.classify.conjugation'], base, conjugation, { ending: conjugation }));
  // Hints that give every strong part leave nothing to assume.
  const hinted = hints.past !== undefined && hints.participle !== undefined && (conjugation === 'are' || hints.future !== undefined);
  // A verb on a side list whose Vocabolario page was read is known to be regular apart from what its list says.
  if (!hinted && !(onSideList(base) && Object.hasOwn(readPages, base))) steps.push(step(R['it.classify.assume-regular'], base, null));
  return { entry: null, family: null, listed: false, conjugation, root: base.slice(0, -3), classLabel: conjugation };
}

type Isc = 'yes' | 'no' | 'both';

/** Step 7–9 for -isc-: the lexicon, the side lists, the default, then the hint. */
function iscOf(base: string, known: Known, hint: unknown, steps: DerivationStep[]): Isc | null {
  if (known.conjugation !== 'ire') {
    if (hint !== undefined) throw new ConjugationError('INVALID_HINT', `${base} is not an -ire verb, so it cannot take the class hint ${String(hint)}.`);
    return null;
  }
  const listed: Isc | undefined = known.entry?.class === 'ire' ? known.entry.isc ?? 'no'
    : iscVerbs.has(base) ? 'yes' : nonIscVerbs.has(base) ? 'no' : Object.hasOwn(iscBothVerbs, base) ? 'both' : undefined;
  if (listed === undefined) {
    if (hint === 'isc' || hint === 'plain') {
      steps.push(step(R['it.classify.hint'], base, null, { hint: `classHint: ${hint}` }));
      return hint === 'isc' ? 'yes' : 'no';
    }
    steps.push(step(R['it.classify.assume-isc'], base, null));
    return 'yes';
  }
  const rule = listed === 'yes' ? R['it.classify.isc'] : listed === 'no' ? R['it.classify.no-isc'] : R['it.classify.isc-both'];
  steps.push(step(rule, base, null));
  if (hint !== undefined && listed !== 'both' && (hint === 'isc') !== (listed === 'yes')) {
    throw new ConjugationError('INVALID_HINT', `${base} ${listed === 'yes' ? 'always adds' : 'never adds'} -isc-, so it cannot take the class hint ${String(hint)}.`);
  }
  return listed;
}

/** Whether the i of an -iare verb is stressed: the hint, the list, the graphic i, or the unstressed default. */
function stressedIOf(base: string, known: Known, hints: ItalianStemHints, steps: DerivationStep[]): boolean {
  if (known.conjugation !== 'are' || !base.endsWith('iare')) {
    if (hints.stressedI !== undefined) throw new ConjugationError('INVALID_HINT', `${base} is not an -iare verb, so the stressed-i hint does not apply.`);
    return false;
  }
  if (hints.stressedI !== undefined) {
    steps.push(step(R['it.classify.hint'], base, null, { hint: `stems.stressedI: ${String(hints.stressedI)}` }));
    return hints.stressedI;
  }
  if (stressedIVerbs.has(base) || known.entry?.flags?.includes('stressedI')) {
    steps.push(step(R['it.classify.stressed-i'], base, `${known.root}o`));
    return true;
  }
  if (graphicI.test(base)) return false;
  steps.push(step(R['it.classify.assume-unstressed-i'], base, null));
  return false;
}

/** The perfect auxiliaries (step 7, 8, 9 and 10): reflexive, lexicon, side lists, default; then the hint narrows them. */
function auxiliariesOf(base: string, known: Known, reflexive: boolean, hint: unknown, steps: DerivationStep[]): readonly Auxiliary[] {
  if (reflexive) {
    steps.push(step(R['it.classify.reflexive-essere'], base, null));
    if (hint !== undefined && hint !== 'essere') throw new ConjugationError('INVALID_HINT', `${base} is reflexive, so it forms its compound tenses with essere only.`);
    return [{ lemma: 'essere' }];
  }
  const listed = (known.family === null ? known.entry?.auxiliaries : undefined)
    ?? (Object.hasOwn(dualVerbs, base) ? dualVerbs[base] : essereVerbs.has(base) ? [{ lemma: 'essere' as const }]
      : avereVerbs.has(base) ? [{ lemma: 'avere' as const }] : undefined);
  // The auxiliary is per lemma. Only an unlisted prefix derivative of a verb that takes essere only is assumed to take
  // essere too (an assumption, which the hint overrides); a listed derivative has its own entry in the lists.
  const family = known.family;
  const baseAuxiliaries = family !== null && family.suffix === null && family.assumed ? italianLexicon[family.base]?.auxiliaries : undefined;
  if (listed === undefined && hint === undefined && baseAuxiliaries?.length && baseAuxiliaries.every(auxiliary => auxiliary.lemma === 'essere')) {
    steps.push(step(R['it.classify.assume-inherit-auxiliary'], base, null, { auxiliary: 'essere', base: family!.base }));
    return [{ lemma: 'essere' }];
  }
  if (listed === undefined) {
    if (hint === 'essere' || hint === 'avere') {
      steps.push(step(R['it.classify.hint'], base, null, { hint: `auxiliary: ${hint}` }));
      return [{ lemma: hint }];
    }
    steps.push(step(R['it.classify.assume-avere'], base, null));
    return [{ lemma: 'avere' }];
  }
  if (listed.length === 2) {
    steps.push(step(R['it.classify.auxiliaries'], base, null, { first: listed[0]!.lemma, second: listed[1]!.lemma }));
  } else {
    for (const auxiliary of listed) steps.push(step(R['it.classify.auxiliary'], base, null, { auxiliary: auxiliary.lemma }));
  }
  if (hint === undefined) return listed;
  const kept = listed.filter(auxiliary => auxiliary.lemma === hint);
  if (!kept.length) throw new ConjugationError('INVALID_HINT', `${base} does not form its compound tenses with ${String(hint)}.`);
  if (kept.length < listed.length) steps.push(step(R['it.classify.hint'], base, null, { hint: `auxiliary: ${String(hint)}` }));
  return kept;
}

/** The lexical data of the verb with the stem hints of the query in place of what they name. */
function withHints(base: string, entry: ItalianEntry | null, known: Known, hints: ItalianStemHints, steps: DerivationStep[]): ItalianEntry | null {
  const hinted: { -readonly [K in keyof ItalianEntry]?: ItalianEntry[K] } = {};
  if (hints.past !== undefined) {
    hinted.past = [hints.past];
    hinted.pastSeries = [`=${hints.past}`];
    steps.push(step(R['it.classify.hint'], base, null, { hint: `stems.past: ${hints.past}` }));
  }
  if (hints.participle !== undefined) {
    hinted.participle = [hints.participle];
    steps.push(step(R['it.classify.hint'], base, null, { hint: `stems.participle: ${hints.participle}` }));
  }
  if (hints.future !== undefined) {
    hinted.future = [hints.future];
    steps.push(step(R['it.classify.hint'], base, null, { hint: `stems.future: ${hints.future}` }));
  }
  if (!Object.keys(hinted).length) return entry;
  return { ...(entry ?? { class: known.conjugation }), ...hinted };
}

function lexemeFor(
  lemma: string, base: string, known: Known, entry: ItalianEntry | null, isc: 'yes' | 'no', stressedI: boolean, reflexive: boolean,
  auxiliaries: readonly Auxiliary[],
): ItalianLexeme {
  const classId = known.conjugation === 'ire' && known.classLabel === 'ire' ? (isc === 'yes' ? 'ire-isc' : 'ire') : known.classLabel;
  const conditions = Object.fromEntries(auxiliaries.length > 1
    ? auxiliaries.flatMap(auxiliary => auxiliary.condition === undefined ? [] : [[auxiliary.lemma, auxiliary.condition]]) : []);
  return {
    lemma,
    verbId: reflexive && !/rsi$/u.test(lemma) ? `${lemma} (reflexive)` : lemma,
    classId,
    classSource: known.listed ? 'lexicon' : 'regularRule',
    reflexive,
    auxiliaries: auxiliaries.map(auxiliary => auxiliary.lemma),
    particle: null,
    base,
    conjugation: known.conjugation,
    root: known.root,
    isc,
    stressedI,
    palatal: palatalVerbs.has(base) || (entry?.flags?.includes('palatal') ?? false),
    entry,
    family: known.family === null ? null : { prefix: known.family.prefix, base: known.family.base },
    auxiliaryConditions: conditions,
    impersonal: impersonalVerbs.has(base) || (entry?.flags?.includes('impersonal') ?? false),
  };
}

/**
 * The paradigms of the queried verb (grammar design §3.2): normalisation, reflexive, lexicon, family, no-inherit list,
 * ending, side lists, defaults, hints, and essere for a reflexive. A verb with and without -isc- has two paradigms,
 * tagged `plain` and `isc`, in the Vocabolario's order; the class hint keeps one.
 */
export function classifyItalian(query: Readonly<Record<string, unknown>>): Fork<ItalianLexeme> {
  const lemma = withoutAccents(String(query.infinitive));
  if (/(?:sene|sela|cela)$/u.test(lemma)) invalid(`${lemma}: pronominal verbs with ne or la (andarsene, farcela) are not supported.`);
  if (!/^[a-z]+$/u.test(lemma)) invalid(`${lemma} is not an Italian infinitive: write one word in letters.`);
  const steps: DerivationStep[] = [];
  const reflexiveLemma = lemma.endsWith('rsi');
  const base = reflexiveLemma ? reflexiveBase(lemma) : lemma;
  if (reflexiveLemma) steps.push(step(R['it.classify.reflexive'], lemma, base));
  else if (query.reflexive === true) steps.push(step(R['it.classify.hint'], lemma, null, { hint: 'reflexive' }));
  const reflexive = reflexiveLemma || query.reflexive === true;
  const hints = (query.stems ?? {}) as ItalianStemHints;

  const known = lookUp(base, steps, hints);
  if (known.entry?.class === 'contracted') steps.push(step(R['it.classify.contracted'], base, known.root, { stem: known.root }));
  const isc = iscOf(base, known, query.classHint, steps);
  const stressedI = stressedIOf(base, known, hints, steps);
  const entry = withHints(base, known.entry, known, hints, steps);
  const auxiliaries = auxiliariesOf(base, known, reflexive, query.auxiliary, steps);

  const senses = readings[base];
  if (senses !== undefined) return sensesOf(lemma, base, known, entry, stressedI, reflexive, senses, steps, query);
  if (isc !== 'both') return [{ value: lexemeFor(lemma, base, known, entry, isc ?? 'no', stressedI, reflexive, auxiliaries), steps, tags: {} }];
  const order: readonly ('isc' | 'plain')[] = iscBothVerbs[base] === 'isc' || known.entry?.iscFirst ? ['isc', 'plain'] : ['plain', 'isc'];
  const paradigms = order.map((pattern): Outcome<ItalianLexeme> => ({
    value: lexemeFor(lemma, base, known, entry, pattern === 'isc' ? 'yes' : 'no', stressedI, reflexive, auxiliaries),
    steps, tags: { pattern },
  }));
  if (query.classHint === undefined) return paradigms;
  const kept = paradigms.filter(paradigm => paradigm.tags.pattern === query.classHint);
  return kept.map(paradigm => ({ ...paradigm, steps: [...steps, step(R['it.classify.hint'], base, null, { hint: `classHint: ${String(query.classHint)}` })] }));
}

/**
 * Verbs with two senses conjugated differently (Vocabolario ripartire1 "dividere": ripartisco, avere; ripartire2
 * "partire di nuovo": riparto, essere): one paradigm each, tagged with its pattern and the sense as its condition.
 */
const readings: Readonly<Record<string, readonly { readonly pattern: 'plain' | 'isc'; readonly condition: string; readonly auxiliary: 'avere' | 'essere' }[]>> = {
  ripartire: [
    { pattern: 'plain', condition: 'to leave again', auxiliary: 'essere' },
    { pattern: 'isc', condition: 'to divide, to share out', auxiliary: 'avere' },
  ],
};

function sensesOf(
  lemma: string, base: string, known: Known, entry: ItalianEntry | null, stressedI: boolean, reflexive: boolean,
  senses: NonNullable<typeof readings[string]>, steps: readonly DerivationStep[], query: Readonly<Record<string, unknown>>,
): Fork<ItalianLexeme> {
  const kept = senses.filter(sense => query.classHint === undefined || query.classHint === sense.pattern)
    .filter(sense => query.auxiliary === undefined || query.auxiliary === sense.auxiliary);
  if (!kept.length) throw new ConjugationError('INVALID_HINT', `${base} has no sense with these hints.`);
  return kept.map(sense => {
    const auxiliary = reflexive ? 'essere' : sense.auxiliary;
    const own = [
      step(sense.pattern === 'isc' ? R['it.classify.isc'] : R['it.classify.no-isc'], base, null),
      step(R['it.classify.auxiliary'], base, null, { auxiliary }),
    ];
    return {
      value: lexemeFor(lemma, base, known, entry, sense.pattern === 'isc' ? 'yes' : 'no', stressedI, reflexive, [{ lemma: auxiliary }]),
      steps: [...steps.filter(s => s.rule !== 'it.classify.assume-isc' && s.rule !== 'it.classify.assume-avere'), ...own],
      tags: { pattern: sense.pattern, condition: sense.condition },
    };
  });
}

/** The lexeme of an auxiliary or another verb a periphrasis names. */
export function lexemeOfItalian(lemma: string): ItalianLexeme {
  return classifyItalian({ infinitive: lemma })[0]!.value;
}
