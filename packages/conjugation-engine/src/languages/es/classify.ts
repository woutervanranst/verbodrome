/**
 * Spanish classification (grammar design §3): the infinitive's conjugation, then the lexicon, a prefixed strong base, a
 * suffix family or the regular default with the assumptions that decide a form, then the hints.
 */
import { step } from '../../core/derivation.js';
import type { DerivationStep } from '../../core/derivation.js';
import type { Fork, VariantTags } from '../../core/fork.js';
import type { LexemeBase } from '../../core/grammar.js';
import { ConjugationError } from '../../errors.js';
import type { SpanishClassHint, SpanishStemHints } from './spec.js';
import {
  alternations, bothStressVerbs, entries, families, hiatusVerbs, listedDerivatives, noInherit, prefixes, strongBases,
  twoParadigms, zcExceptions,
} from './lexicon.js';
import type { Alternation, SpanishEntry, Variant } from './lexicon.js';
import { spanishRules as rules } from './rules.js';

export type Conjugation = 'ar' | 'er' | 'ir';
export type Stress = 'hiatus' | 'diphthong' | 'both';

export interface SpanishLexeme extends LexemeBase {
  /** The infinitive without -se, with its tilde (reír). */
  readonly infinitive: string;
  readonly conjugation: Conjugation;
  /** The prefix through which the verb inherits its base's forms (com- of componer), or ''. */
  readonly prefix: string;
  /** The lemma whose lexical data the verb uses (poner for componer), or the infinitive itself. */
  readonly base: string;
  /** The stem of the derived forms: the infinitive minus its ending (compon-), or the lexicon's root (podrir: pudr-). */
  readonly root: string;
  /** The stem-vowel alternation; erguir has two, tagged. */
  readonly alternation: Alternation | readonly Variant<Alternation>[] | null;
  /** An -ir verb whose alternating e or o rises to i or u where the ending has no stressed i (sintió, durmamos). */
  readonly raising: boolean;
  readonly stress: Stress;
  readonly zc: boolean;
  readonly yInsertion: boolean;
  /** The suffix family the verb belongs to: -ducir or -scribir. */
  readonly family: 'ducir' | 'scribir' | null;
  /** The lexicon entry (the base's for a prefixed verb), `{}` for an unlisted verb. */
  readonly entry: SpanishEntry;
}

const regularModels: Readonly<Record<Conjugation, string>> = { ar: 'amar', er: 'temer', ir: 'partir' };

/** One way the lexicon reads the verb, before the hints. */
interface Reading {
  readonly entry: SpanishEntry;
  readonly alternation: Alternation | readonly Variant<Alternation>[] | null;
  readonly prefix: string;
  readonly base: string;
  /** The model a listed reading names, if any. */
  readonly model: string | null;
  readonly family: 'ducir' | 'scribir' | null;
  readonly stress: Stress | null;
  readonly listed: boolean;
  /** Where the class comes from: the lexicon, or a rule class (-eír, -oír) that needs no entry. */
  readonly source: 'lexicon' | 'regularRule';
  readonly steps: readonly DerivationStep[];
  readonly tags: VariantTags;
}

/** The lexical data of a lemma listed in the lexicon (not a two-paradigm one), or null. */
function listedData(lemma: string): { entry: SpanishEntry; alternation: Reading['alternation']; stress: Stress | null } | null {
  const entry = Object.hasOwn(entries, lemma) ? entries[lemma] : undefined;
  const alternation = Object.hasOwn(alternations, lemma) ? alternations[lemma] : undefined;
  const stress = hiatusVerbs.has(lemma) ? 'hiatus' : bothStressVerbs.has(lemma) ? 'both' : null;
  if (entry === undefined && alternation === undefined && stress === null) return null;
  return { entry: entry ?? {}, alternation: entry?.alternation ?? alternation ?? null, stress: entry?.stress ?? stress };
}

function conjugationOf(infinitive: string): Conjugation {
  return infinitive.endsWith('ar') ? 'ar' : infinitive.endsWith('er') ? 'er' : 'ir';
}

/** The model a stem-vowel alternation follows. */
function alternationModel(alternation: Alternation, infinitive: string, raising: boolean): string {
  const conjugation = conjugationOf(infinitive);
  switch (alternation) {
    case 'e-ie': return conjugation === 'ar' ? 'acertar' : conjugation === 'er' ? 'entender' : raising ? 'sentir' : 'discernir';
    case 'o-ue': return conjugation === 'ar' ? 'contar' : conjugation === 'er' ? 'mover' : 'dormir';
    case 'u-ue': return 'jugar';
    case 'i-ie': return 'adquirir';
    case 'e-i': return infinitive.endsWith('eír') ? 'reír' : infinitive.endsWith('ñir') ? 'ceñir' : 'pedir';
  }
}

/** The model a stress class follows, where it differs from the regular one. */
function stressModel(stress: Stress, infinitive: string): string | null {
  const conjugation = conjugationOf(infinitive);
  if (infinitive.endsWith('iar')) return stress === 'hiatus' ? 'enviar' : stress === 'both' ? 'anunciar' : null;
  if (infinitive.endsWith('uar')) return stress === 'hiatus' ? 'actuar' : 'averiguar';
  if (stress !== 'hiatus') return null;
  const close = closeOfLastGroup(infinitive) ?? 'i';
  if (conjugation === 'ar') return close === 'u' ? 'aunar' : 'aislar';
  return close === 'u' ? 'reunir' : 'prohibir';
}

const zcPattern = /[aeiouáéíóú]c(?:er|ir|ír)$/u;

/** The prefix and strong base of a derivative (P + B, P from the closed list, possibly several), or null. */
function strongDerivation(lemma: string): { prefix: string; base: string } | null {
  if (noInherit.has(lemma)) return null;
  for (const prefix of prefixes) {
    if (!lemma.startsWith(prefix) || lemma.length === prefix.length) continue;
    const rest = lemma.slice(prefix.length);
    if (strongBases.includes(rest)) return { prefix, base: rest };
    const deeper = strongDerivation(rest);
    if (deeper !== null) return { prefix: prefix + deeper.prefix, base: deeper.base };
  }
  return null;
}

/** The last run of vowel letters in the root (silent u of gu/qu ignored), as text; '' when the root has no vowel. */
function lastVowelRun(infinitive: string): string {
  const rootLength = infinitive.length - 2;
  const isVowel = (index: number): boolean => {
    const letter = infinitive[index] ?? '';
    if (!/[aeiouü]/u.test(letter)) return false;
    return !(letter === 'u' && /[gq]/u.test(infinitive[index - 1] ?? '') && /[eiéí]/u.test(infinitive[index + 1] ?? ''));
  };
  let end = rootLength - 1;
  while (end >= 0 && !isVowel(end)) end--;
  if (end < 0) return '';
  let start = end;
  while (start > 0 && isVowel(start - 1)) start--;
  return infinitive.slice(start, end + 1);
}

function closeOfLastGroup(infinitive: string): 'i' | 'u' | null {
  const run = lastVowelRun(infinitive);
  return run.includes('u') ? 'u' : run.includes('i') ? 'i' : null;
}

/** The readings the lexicon gives an infinitive: two for a two-paradigm lemma, one otherwise. */
function readingsOf(infinitive: string): Reading[] {
  const none = { prefix: '', base: infinitive, family: null, source: 'lexicon' } as const;
  if (Object.hasOwn(twoParadigms, infinitive)) {
    return twoParadigms[infinitive]!.map(({ entry, pattern, condition }) => {
      const alternation = entry.alternation ?? null;
      const model = typeof alternation === 'string' ? alternationModel(alternation, infinitive, true) : regularModels[conjugationOf(infinitive)];
      return {
        ...none, entry, alternation, model, stress: null, listed: true,
        steps: [step(rules['es.classify.two-paradigms'], infinitive, model, { model })], tags: { pattern, condition },
      };
    });
  }
  const listed = listedData(infinitive);
  if (listed !== null) {
    const model = modelOfListed(infinitive, listed);
    return [{ ...none, ...listed, model, listed: true, steps: [step(rules['es.classify.lexicon'], infinitive, model, { model })], tags: {} }];
  }
  // A strong base through the closed prefix list, or a derivative the lexicon lists with its base.
  const strong = strongDerivation(infinitive);
  const listedBase = Object.hasOwn(listedDerivatives, infinitive) ? listedDerivatives[infinitive]! : null;
  const derivation = strong ?? (listedBase === null ? null : { prefix: infinitive.slice(0, -listedBase.length), base: listedBase });
  if (derivation !== null) {
    const [base] = readingsOf(derivation.base);
    const model = base?.model ?? derivation.base;
    return [{
      entry: base?.entry ?? {}, alternation: base?.alternation ?? null, stress: base?.stress ?? null, family: base?.family ?? null, model,
      prefix: derivation.prefix, base: derivation.base, listed: true, source: 'lexicon', tags: {},
      steps: [strong === null
        ? step(rules['es.classify.lexicon'], infinitive, model, { model })
        : step(rules['es.classify.prefixed'], infinitive, model, { prefix: derivation.prefix, base: derivation.base })],
    }];
  }
  const family = families.find(({ suffix }) => infinitive.endsWith(suffix) && infinitive.length > suffix.length);
  if (family?.suffix === 'eír') {
    // Every -eír verb is conjugated like reír: e→i where the stem is stressed or the ending has no stressed i.
    return [{
      ...none, entry: {}, alternation: 'e-i', stress: 'hiatus', model: 'reír', listed: true, source: 'regularRule', tags: {},
      steps: [step(rules['es.classify.eir'], infinitive, 'reír')],
    }];
  }
  if (family?.suffix === 'oír') {
    // Every -oír verb is conjugated like oír (oigo, oyes), on its own prefix.
    const prefix = infinitive.slice(0, -3);
    const oir = listedData('oír')!;
    return [{
      ...none, entry: oir.entry, alternation: null, stress: 'hiatus', model: 'oír', prefix, base: 'oír', listed: true, source: 'regularRule', tags: {},
      steps: [step(rules['es.classify.oir'], infinitive, 'oír')],
    }];
  }
  if (family !== undefined) {
    return [{
      ...none, entry: {}, alternation: null, stress: null, family: family.suffix === 'ducir' ? 'ducir' : 'scribir', model: family.model, listed: true, tags: {},
      steps: [step(rules['es.classify.family'], infinitive, family.model, { suffix: `-${family.suffix}`, model: family.model })],
    }];
  }
  return [{ ...none, entry: {}, alternation: null, stress: null, model: null, listed: false, source: 'regularRule', steps: [], tags: {} }];
}

function modelOfListed(infinitive: string, listed: NonNullable<ReturnType<typeof listedData>>): string {
  if (listed.entry.model !== undefined) return listed.entry.model;
  if (Object.hasOwn(entries, infinitive)) return infinitive;
  const { alternation } = listed;
  if (typeof alternation === 'string') return alternationModel(alternation, infinitive, listed.entry.raising !== false);
  return (listed.stress === null ? null : stressModel(listed.stress, infinitive)) ?? regularModels[conjugationOf(infinitive)];
}

/** Whether a reading's alternation agrees with a class hint. */
function agrees(alternation: Reading['alternation'], hint: SpanishClassHint): boolean {
  if (hint === 'regular') return alternation === null;
  if (alternation === null) return false;
  return typeof alternation === 'string' ? alternation === hint : alternation.some(variant => variant.value === hint);
}

interface Parsed {
  readonly lemma: string;
  readonly infinitive: string;
  readonly reflexive: boolean;
  readonly steps: readonly DerivationStep[];
}

/** Splits off -se and restores the tilde of -eír / -oír; throws INVALID_INFINITIVE for anything that is not a verb. */
function parse(query: Readonly<Record<string, unknown>>): Parsed {
  const typed = String(query.infinitive);
  const reflexiveForm = /(?:ar|er|ir|ír)se$/u.test(typed);
  let infinitive = reflexiveForm ? typed.slice(0, -2) : typed;
  if (!/^[a-zñáéíóúü]*(?:ar|er|ir|ír)$/u.test(infinitive) || ['ar', 'er', 'ír'].includes(infinitive)) {
    throw new ConjugationError('INVALID_INFINITIVE', 'A Spanish infinitive ends in -ar, -er or -ir (-se for a reflexive verb).');
  }
  if (reflexiveForm && query.reflexive === false) {
    throw new ConjugationError('INVALID_HINT', `${typed} is reflexive: it cannot be conjugated with reflexive: false.`);
  }
  const steps: DerivationStep[] = [];
  if (/[eo]ir$/u.test(infinitive)) {
    const restored = `${infinitive.slice(0, -2)}ír`;
    steps.push(step(rules['es.classify.restore-accent'], infinitive, restored));
    infinitive = restored;
  }
  const lemma = reflexiveForm ? `${infinitive}se` : infinitive;
  const reflexive = reflexiveForm || query.reflexive === true;
  if (reflexive) steps.push(step(rules['es.classify.reflexive'], lemma, infinitive, { base: infinitive }));
  return { lemma, infinitive, reflexive, steps };
}

/** The lexeme of one reading of `parsed`, with its classification steps, after the hints. */
function lexemeFor(parsed: Parsed, reading: Reading, query: Readonly<Record<string, unknown>>): { lexeme: SpanishLexeme; steps: DerivationStep[] } {
  const { infinitive } = parsed;
  const conjugation = conjugationOf(infinitive);
  const classHint = query.classHint as SpanishClassHint | undefined;
  const stems = (query.stems ?? {}) as SpanishStemHints;
  const steps: DerivationStep[] = [step(rules['es.classify.conjugation'], infinitive, regularModels[conjugation], {
    ending: `-${conjugation}`, model: regularModels[conjugation],
  }), ...reading.steps];
  const hinted: DerivationStep[] = [];

  let alternation = reading.alternation;
  if (classHint !== undefined) {
    alternation = classHint === 'regular' ? null : typeof alternation === 'object' && alternation !== null
      ? alternation.find(variant => variant.value === classHint)?.value ?? null : classHint;
    hinted.push(step(rules['es.classify.hint'], infinitive, null, { hint: classHint }));
  }

  // Stress: the lexicon's class, the -uar rule, or the -iar / vowel-group default with its assumption.
  // -eír / -oír: the i of the ending and of an e-i stem is stressed on its own (ríe, sonríe), like a hiatus verb's.
  let stress: Stress = reading.stress ?? (/[eo]ír$/u.test(infinitive) ? 'hiatus' : 'diphthong');
  const assumptions: DerivationStep[] = [];
  if (stems.stress !== undefined) {
    stress = stems.stress;
    hinted.push(step(rules['es.classify.hint'], infinitive, null, { hint: `stress: ${stems.stress}` }));
  } else if (reading.stress === null && !reading.listed) {
    if (infinitive.endsWith('uar')) {
      stress = /[gc]uar$/u.test(infinitive) ? 'diphthong' : 'hiatus';
      steps.push(step(rules['es.classify.uar-stress'], infinitive, null));
    } else if (infinitive.endsWith('iar')) {
      assumptions.push(step(rules['es.classify.assume-glide'], infinitive, null, { vowel: 'i' }));
    } else {
      const run = lastVowelRun(infinitive);
      if (run.length === 2 && /[aeo]/u.test(run) && /[iuü]/u.test(run)) assumptions.push(step(rules['es.classify.assume-diphthong'], infinitive, null, { vowels: run }));
    }
  }

  // zc: vowel + -cer/-cir unless listed without it; -ducir always.
  const entry = reading.entry;
  const zcByRule = reading.family === 'ducir'
    || (zcPattern.test(infinitive) && !zcExceptions.has(infinitive) && !zcExceptions.has(reading.base) && entry.present1 === undefined);
  let zc = zcByRule;
  if (stems.zc !== undefined) {
    zc = stems.zc;
    hinted.push(step(rules['es.classify.hint'], infinitive, null, { hint: `zc: ${String(stems.zc)}` }));
  } else if (zcByRule && !reading.listed) {
    assumptions.push(step(rules['es.classify.assume-zc'], infinitive, null));
  }

  const raising = conjugation === 'ir' && alternation !== null && entry.raising !== false;
  const yInsertion = entry.yInsertion === true || (/[uü](?:ir|ír)$/u.test(infinitive) && !/[gq]u(?:ir|ír)$/u.test(infinitive));
  const hintChanged = classHint !== undefined && !reading.listed || stems.stress !== undefined || stems.zc !== undefined;
  const model = reading.listed && !(stems.stress !== undefined || stems.zc !== undefined)
    ? reading.model ?? infinitive
    : (typeof alternation === 'string' ? alternationModel(alternation, infinitive, raising) : null)
      ?? stressModel(stress, infinitive) ?? (zc ? (conjugation === 'er' ? 'conocer' : 'lucir') : null)
      ?? (yInsertion ? 'construir' : null) ?? regularModels[conjugation];
  const regularAssumption = !reading.listed && classHint === undefined ? [step(rules['es.classify.assume-regular'], infinitive, null)] : [];

  const lexeme: SpanishLexeme = {
    lemma: parsed.lemma,
    verbId: parsed.lemma,
    classId: model,
    classSource: hintChanged ? 'explicitHint' : reading.listed ? reading.source : 'regularRule',
    reflexive: parsed.reflexive,
    auxiliaries: ['haber'],
    particle: null,
    infinitive,
    conjugation,
    prefix: reading.prefix,
    base: reading.base,
    root: entry.root === undefined ? infinitive.slice(0, -2) : reading.prefix + entry.root,
    alternation,
    raising,
    stress,
    zc,
    yInsertion,
    family: reading.family,
    entry,
  };
  return { lexeme, steps: [...steps, ...regularAssumption, ...assumptions, ...hinted] };
}

/** The paradigms of the queried verb (grammar design §3.2), narrowed by `classHint`. */
export function classifySpanish(query: Readonly<Record<string, unknown>>): Fork<SpanishLexeme> {
  const parsed = parse(query);
  const classHint = query.classHint as SpanishClassHint | undefined;
  if (classHint === 'e-i' && !/(?:ir|ír)$/u.test(parsed.infinitive)) {
    throw new ConjugationError('INVALID_HINT', `The e-i alternation exists only in -ir verbs, not in ${parsed.infinitive}.`);
  }
  let readings = readingsOf(parsed.infinitive);
  if (classHint !== undefined && readings.some(reading => reading.listed)) {
    readings = readings.filter(reading => agrees(reading.alternation, classHint));
    if (!readings.length) throw new ConjugationError('INVALID_HINT', `${parsed.infinitive} has no ${classHint} conjugation.`);
  }
  return readings.map(reading => {
    const { lexeme, steps } = lexemeFor(parsed, reading, query);
    return { value: lexeme, steps: [...parsed.steps, ...steps], tags: reading.tags };
  });
}

/** The lexeme of a verb a periphrasis names (haber): its first paradigm, without hints. */
export function spanishLexemeOf(lemma: string): SpanishLexeme {
  const [first] = classifySpanish({ infinitive: lemma });
  if (first === undefined) throw new ConjugationError('GENERATION_FAILURE', `No Spanish paradigm for ${lemma}.`);
  return first.value;
}
