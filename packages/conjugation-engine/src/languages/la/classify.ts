/**
 * Identifying a Latin verb (GD §3): the lexicon (directly or as a compound of a family), then the infinitive's ending,
 * with every inference recorded as an assumption. The engine never invents the length of a stem vowel: the long vowels
 * it adds belong to the endings and suffixes the cited sections print.
 */
import { step } from '../../core/derivation.js';
import type { DerivationStep } from '../../core/derivation.js';
import type { Fork, Outcome, VariantTags } from '../../core/fork.js';
import { ConjugationError } from '../../errors.js';
import { resolveCompound } from './compounds.js';
import type { CompoundMatch } from './compounds.js';
import { transitiveEoPrefixes } from './irregulars.js';
import { hasQuantityMarks, latinKey } from './key.js';
import { compoundGlosses, impersonalPassive, latinLexicon, rarerHomographs } from './lexicon.js';
import type { LatinConjugation, LatinEntry, LatinLexeme, LatinStemClass, LexicalForm, PresentStem, StemSource } from './lexicon.js';
import { latinRules } from './rules.js';
import type { LatinClassHint, LatinStemHints } from './spec.js';

const stemClassOf: Readonly<Record<Exclude<LatinConjugation, 'irregular'>, LatinStemClass>> = {
  first: 'a', second: 'e', third: 'consonant', thirdIo: 'io', fourth: 'i',
};

const without = (word: string, ending: string): string => word.slice(0, word.length - ending.length);

/**
 * A listed principal part as a stem source: tēxī → tēx, amātum → amāt, moritūrus → morit. An alternative after the
 * first is tagged with its own spelling as pattern (and `usage` where the entry says so).
 */
function listed(parts: readonly string[] | undefined, ending: (part: string) => string, hinted = false,
  extra: { usage?: LexicalForm['usage']; participle?: boolean } = {}): StemSource[] {
  return (parts ?? []).map((part, index) => ({
    kind: 'listed', part, stem: without(part, ending(part)), hinted,
    ...(index === 0 ? {} : { pattern: part, ...(extra.usage ? { usage: extra.usage } : {}) }),
    ...(extra.participle ? { participle: true } : {}),
  }));
}

const perfectEnding = (part: string): string => part.endsWith('ī') ? 'ī' : 'i';
/** An impersonal verb's perfect is printed in the third person singular (licuit): its stem is that minus -it. */
const impersonalPerfectEnding = (part: string): string => part.endsWith('it') ? 'it' : perfectEnding(part);
const supineEnding = (part: string): string => part.endsWith('us') ? 'us' : 'um';

/** The present stem of an entry (GD §4.2): from the infinitive for a, e, i and consonant stems, from the 1sg for -iō verbs. */
function presentOf(entry: LatinEntry, stemClass: LatinStemClass, deponent: boolean): PresentStem | null {
  if (entry.lacks?.includes('present')) return null;
  const lexical = entry.stems?.present;
  if (lexical !== undefined) return { from: entry.infinitive, ending: '', stem: lexical, lexical: true };
  const infinitive = entry.infinitive;
  const strip = (from: string, ending: string): PresentStem | null =>
    from.endsWith(ending) ? { from, ending, stem: without(from, ending), lexical: false } : null;
  switch (stemClass) {
    case 'a': case 'e': case 'i':
      return strip(infinitive, deponent ? 'rī' : 're');
    case 'consonant':
      return strip(infinitive, deponent ? 'ī' : 'ere') ?? (entry.present ? strip(entry.present, 'ō') : null);
    case 'io':
      return entry.present ? strip(entry.present, deponent ? 'or' : 'ō') : null;
  }
}

function principalParts(entry: LatinEntry, participleSystem: boolean): string {
  const participle = entry.supine?.[0]?.replace(/um$/u, 'us');
  return [
    ...(entry.present ? [entry.present] : []), entry.infinitive,
    ...(participleSystem ? participle ? [`${participle} sum`] : [] : [...(entry.perfect?.slice(0, 1) ?? []), ...(entry.supine?.slice(0, 1) ?? [])]),
  ].join(', ');
}

/** The lexeme of a lexicon entry (or a compound's entry); `hints` replace its perfect and supine. */
export function lexemeFromEntry(entry: LatinEntry, hints: LatinStemHints = {}, extra: Partial<LatinLexeme> = {}): LatinLexeme {
  const deponent = entry.voice === 'deponent';
  const voiceClass = entry.voice ?? 'active';
  const stemClass = entry.stemClass ?? stemClassOf[entry.conjugation as Exclude<LatinConjugation, 'irregular'>];
  const perfectSystem = voiceClass !== 'active' || entry.flags?.includes('perfectOnParticiple') ? 'participle' : 'stem';
  const lacks = new Set(entry.lacks ?? []);
  const passive = voiceClass !== 'active' ? 'none'
    : entry.passive ?? (entry.present !== null && impersonalPassive.has(entry.present) ? 'impersonal' : 'personal');
  return {
    lemma: entry.infinitive, verbId: entry.infinitive,
    classId: `${entry.conjugation}${deponent ? '-deponent' : voiceClass === 'semiDeponent' ? '-semi-deponent' : ''}`,
    classSource: 'lexicon', reflexive: false, auxiliaries: [], particle: null,
    key: latinKey(entry.infinitive), entry, family: null, conjugation: entry.conjugation, stemClass, voiceClass, perfectSystem,
    presentStem: presentOf(entry, stemClass, deponent),
    perfectStems: perfectSystem === 'stem' && !lacks.has('perfect')
      ? hints.perfect ? listed([hints.perfect], perfectEnding, true)
      : listed(entry.perfect, entry.impersonal ? impersonalPerfectEnding : perfectEnding, false, { ...(entry.alternativeUsage ? { usage: entry.alternativeUsage } : {}) })
      : [],
    supineStems: hints.supine ? listed([hints.supine], supineEnding, true, { participle: voiceClass !== 'active' })
      : lacks.has('supineStem') ? [] : listed(entry.supine, supineEnding, false, { participle: voiceClass !== 'active' && !entry.impersonal }),
    futureParticipleStems: listed(entry.futureParticiple, () => 'ūrus'),
    passive, impersonal: entry.impersonal === true, lacks, flags: new Set(entry.flags ?? []), cells: entry.cells ?? {},
    stems: entry.stems ?? {}, principalParts: principalParts(entry, perfectSystem === 'participle'), weakened: false,
    ...extra,
  };
}

/** The entry a compound has: the family's form behind the allomorph, with what the simple verb passes on. */
function compoundEntry({ prefix, allomorph, family }: CompoundMatch): LatinEntry {
  const base = family.base;
  const join = (word: string): string => allomorph + word;
  const own = family.overrides[prefix];
  const eoFamily = base.flags?.includes('eoRoot') === true;
  const present = join(family.present);
  const lacks = (base.lacks ?? []).filter(lack => !family.weakened || (lack !== 'perfect' && lack !== 'supineStem'));
  if (family.weakened && !family.perfect && base.voice === undefined) lacks.push('perfect');
  if (family.weakened && !family.supine) lacks.push('supineStem');
  const passive = eoFamily ? transitiveEoPrefixes.has(prefix) ? undefined : 'impersonal' : base.passive === 'none' ? 'none' : undefined;
  // A compound may well be transitive where its simple verb is not (ēgredior urbem): `intransitive` is not inherited.
  const flags = (base.flags ?? []).filter(flag => flag !== 'intransitive' && (!family.weakened || (flag !== 'shortImperative' && flag !== 'passiveIsFio')));
  const gloss = compoundGlosses[present];
  return {
    present, infinitive: join(family.infinitive), conjugation: base.conjugation,
    ...(own ? { perfect: own.perfect } : family.perfect ? { perfect: family.perfect.map(join) } : {}),
    ...(own ? { supine: own.supine } : family.supine ? { supine: family.supine.map(join) } : {}),
    ...(base.alternativeUsage ? { alternativeUsage: base.alternativeUsage } : {}),
    ...(!family.weakened && base.futureParticiple ? { futureParticiple: base.futureParticiple.map(join) } : {}),
    ...(base.stemClass ? { stemClass: base.stemClass } : {}), ...(base.voice ? { voice: base.voice } : {}),
    ...(passive ? { passive } : {}), ...(lacks.length ? { lacks } : {}), ...(flags.length ? { flags } : {}),
    ...(base.cells ? { cells: Object.fromEntries(Object.entries(base.cells).map(([key, forms]) => [key, forms.map(form => ({ ...form, text: join(form.text) }))])) } : {}),
    ...(base.stems ? { stems: Object.fromEntries(Object.entries(base.stems).map(([key, stem]) => [key, join(stem)])) } : {}),
    ...(gloss ? { gloss } : {}), ...(base.usage ? { usage: base.usage } : {}),
    source: base.source, checked: base.checked,
  };
}

function compoundParts(match: CompoundMatch): string {
  const { family } = match;
  return [family.present, family.infinitive, family.perfect?.[0], family.supine?.[0]].filter(part => part !== undefined).map(part => `-${part}`).join(', ');
}

/** The steps that say what a lexicon (or compound) paradigm is. */
function lexiconSteps(typed: string, lexeme: LatinLexeme, match: CompoundMatch | null): DerivationStep[] {
  const steps: DerivationStep[] = match === null
    ? [step(latinRules['la.classify.lexicon'], typed, null, { parts: lexeme.principalParts })]
    : [step(latinRules['la.classify.compound'], typed, lexeme.lemma, { prefix: match.allomorph, base: match.family.base.present!, parts: compoundParts(match) })];
  if (lexeme.voiceClass === 'deponent') steps.push(step(latinRules['la.classify.deponent'], lexeme.lemma, null));
  if (lexeme.voiceClass === 'semiDeponent') steps.push(step(latinRules['la.classify.semi-deponent'], lexeme.lemma, null));
  if (match && (match.family.vary || (match.family.assumeUnlisted && !match.family.overrides[match.prefix]))) {
    steps.push(step(latinRules['la.classify.assume-compound'], null, null, { prefix: match.allomorph, base: match.family.base.present! }));
  }
  return steps;
}

interface Candidate { readonly entry: LatinEntry; readonly match: CompoundMatch | null }

/** Every lexicon paradigm `key` names (GD §3.2 step 2), narrowed by the macrons typed and by the hints. */
function lexiconParadigms(typed: string, key: string, hints: LatinStemHints, classHint: LatinClassHint | undefined): Fork<LatinLexeme> {
  // An entry found under another key only by an alternative spelling (edō under ēsse) answers only to that spelling.
  const keyed = (latinLexicon[key] ?? []).filter((entry, _, all) => latinKey(entry.infinitive) === key
    || (entry.spellings ?? []).some(spelling => spelled(spelling) === spelled(typed)) || all.every(other => latinKey(other.infinitive) !== key));
  const direct = keyed.map((entry): Candidate => ({ entry, match: null }));
  let candidates = direct.length ? direct : resolveCompound(key).map((match): Candidate => ({ entry: compoundEntry(match), match }));
  candidates.sort((a, b) => Number(rarerHomographs.has(a.entry.present ?? '')) - Number(rarerHomographs.has(b.entry.present ?? '')));
  // Typed macrons choose: the spelling that equals the typed one, else one it fits (pārere fits pārēre only).
  const byMacrons = <T>(list: readonly T[], typedText: string, spellings: (item: T) => readonly string[]): readonly T[] => {
    if (!hasQuantityMarks(typedText)) return list;
    const equal = list.filter(item => spellings(item).some(spelling => spelled(spelling) === spelled(typedText)));
    return equal.length ? equal : list.filter(item => spellings(item).some(spelling => compatible(typedText, spelling)));
  };
  const fitting = byMacrons(candidates, typed, ({ entry }) => [entry.infinitive, ...entry.spellings ?? []]);
  // Lengths that fit no spelling of a verb the lexicon knows are a slip: the lexicon verb, with an assumption that says so.
  const misspelled = fitting.length === 0 && candidates.length > 0;
  candidates = misspelled ? candidates : [...fitting];
  const present = hints.present;
  if (present !== undefined) {
    const keyed = candidates.filter(({ entry }) => entry.present !== null && latinKey(entry.present) === latinKey(present));
    candidates = [...byMacrons(keyed, present, ({ entry }) => [entry.present!])];
  }
  if (classHint !== undefined) candidates = candidates.filter(({ entry }) => entry.conjugation === classHint);
  const several = candidates.length > 1;
  return candidates.map(({ entry, match }): Outcome<LatinLexeme> => {
    const lexeme = lexemeFromEntry(entry, hints, match ? { family: { prefix: match.allomorph, base: match.family.base.present! }, weakened: match.family.weakened } : {});
    const tags: VariantTags = {
      ...(several ? { ...(entry.present ? { pattern: entry.present } : {}), ...(entry.gloss ? { condition: entry.gloss } : {}) } : {}),
      ...(entry.usage ? { usage: entry.usage } : {}),
    };
    const steps = lexiconSteps(typed, lexeme, match);
    if (misspelled) steps.splice(1, 0, step(latinRules['la.classify.assume-spelling'], typed, lexeme.lemma));
    return { value: lexeme, steps, tags };
  });
}

/** The spelling a typed word is compared in: NFC, lower case, j written i (GD §3.2 step 1). */
const spelled = (text: string): string => text.normalize('NFC').toLowerCase().replace(/j/gu, 'i');

/** A vowel typed with a breve (ĕ): the user says it is short. */
const breved = (char: string): boolean => /\u0306/u.test(char.normalize('NFD'));

/** `text` without breves: the pack writes long vowels only (GD §6.6), so a typed breve never reaches the output. */
export const withoutBreves = (text: string): string => text.normalize('NFD').replace(/\u0306/gu, '').normalize('NFC');

/**
 * Whether a typed spelling fits a lexicon spelling: the same letters, every vowel typed with a macron long in the
 * lexicon too, and every vowel typed with a breve short there (a vowel typed without a mark is not a claim; pārere
 * fits pārēre, not parere; capĕre fits capere).
 */
export function compatible(typed: string, spelling: string): boolean {
  const a = [...spelled(typed)];
  const b = [...spelled(spelling)];
  if (a.length !== b.length) return false;
  return a.every((char, index) => {
    const other = b[index]!;
    if (char === other) return true;
    if (latinKey(char) !== latinKey(other)) return false;
    return breved(char) ? latinKey(other) === other : latinKey(char) === char;
  });
}

/** The lexicon's perfects by key (amāvī → amāre), to tell a perfect typed as an infinitive. */
const perfectsByKey: ReadonlyMap<string, LatinEntry> = new Map(Object.values(latinLexicon).flat()
  .flatMap(entry => entry.impersonal ? [] : (entry.perfect ?? []).map(perfect => [latinKey(perfect), entry] as const)));

/**
 * A passive infinitive of a verb the lexicon has (amārī, tegī, gerī, quaerī) is not a deponent, and a perfect (amāvī)
 * is not an infinitive: GD §3.2 step 3. The query is rejected and the message names the verb to conjugate.
 */
function rejectPassiveInfinitive(typed: string, key: string): void {
  const perfect = perfectsByKey.get(key);
  if (perfect) throw new ConjugationError('INVALID_INFINITIVE', `${typed} is the perfect of ${perfect.infinitive}: give the infinitive ${perfect.infinitive}.`);
  const active = [...key.endsWith('ri') ? [`${key.slice(0, -2)}re`] : [], ...key.endsWith('i') ? [`${key.slice(0, -1)}ere`] : []];
  for (const candidate of active) {
    const entries = latinLexicon[candidate] ?? resolveCompound(candidate).map(compoundEntry);
    const verb = entries.find(entry => entry.voice !== 'deponent');
    if (verb) {
      throw new ConjugationError('INVALID_INFINITIVE', `${typed} is the present passive infinitive of ${verb.infinitive}: conjugate ${verb.infinitive} with voice: 'passive'.`);
    }
  }
}

const invalid = (): never => {
  throw new ConjugationError('INVALID_INFINITIVE', 'A Latin infinitive ends in -re, or -rī / -ī for a deponent; irregular verbs (esse, posse, velle, ferre, īre, fierī) must be in the lexicon.');
};

/** What the infinitive's ending says (GD §3.2 step 4). */
interface Reading {
  readonly conjugation: Exclude<LatinConjugation, 'irregular'>;
  readonly deponent: boolean;
  /** The typed infinitive without its ending. */
  readonly root: string;
  readonly ending: string;
  readonly assumeThird: boolean;
  readonly assumeSecondDeponent: boolean;
}

function readEnding(typed: string, key: string, present: string | undefined): Reading {
  const marks = hasQuantityMarks(typed);
  const presentKey = present === undefined ? undefined : latinKey(present);
  const read = (conjugation: Reading['conjugation'], deponent: boolean, length: number, extra: Partial<Reading> = {}): Reading => ({
    conjugation, deponent, root: typed.slice(0, typed.length - length), ending: typed.slice(typed.length - length),
    assumeThird: false, assumeSecondDeponent: false, ...extra,
  });
  if (key.endsWith('are')) return read('first', false, 3);
  if (key.endsWith('ire')) return read('fourth', false, 3);
  if (key.endsWith('ere')) {
    if (typed.endsWith('ēre') || presentKey?.endsWith('eo')) return read('second', false, 3);
    return read('third', false, 3, { assumeThird: !marks && presentKey === undefined });
  }
  if (key.endsWith('ari')) return read('first', true, 3);
  if (key.endsWith('iri')) return read('fourth', true, 3);
  // A diphthong ae, oe before -ri is not the ē of -ērī (blaerī: third conjugation).
  if (key.endsWith('eri') && !/[ao]eri$/u.test(key)) {
    if (/ēr[īi]$/u.test(typed) || presentKey?.endsWith('eor')) return read('second', true, 3);
    if (marks || (presentKey?.endsWith('or') && !presentKey.endsWith('eor'))) return read('third', true, 1);
    return read('second', true, 3, { assumeSecondDeponent: true });
  }
  if (key.endsWith('i') && key.length > 1) return read('third', true, 1);
  return invalid();
}

/** The perfect -s- of a stop stem (GD §3.3; A&G §15; Bennett §118.3.a). */
function sJunction(root: string): DefaultStem {
  const joined = `${root}s`;
  const make = (consonant: string, result: string, stem: string): DefaultStem =>
    ({ kind: 'default', base: root, suffix: 's', joined, junction: stem === joined ? null : { consonant, result }, stem });
  const key = latinKey(root);
  if (/(?:qu|gu)$/u.test(key)) return make(root.slice(-2), 'x', `${root.slice(0, -2)}x`);
  if (/[cgh]$/u.test(key)) return make(root.slice(-1), 'x', `${root.slice(0, -1)}x`);
  if (key.endsWith('b')) return make('b', 'p', `${root.slice(0, -1)}ps`);
  if (/[dt]$/u.test(key)) return make(root.slice(-1), 's', `${root.slice(0, -1)}s`);
  if (key.endsWith('m')) return make('m', 'mp', `${root}ps`);
  if (key.endsWith('r')) return make('r', 's', `${root.slice(0, -1)}ss`);
  return make('', '', joined);
}

/** The supine -t- of a stop stem (A&G §178 Note 1; Bennett §119.1.a). */
function tJunction(root: string): DefaultStem {
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

type DefaultRule = 'la.classify.default-parts' | 'la.classify.default-sigmatic' | 'la.classify.default-uo' | 'la.classify.default-sco' | 'la.classify.default-u';

/** The default perfect and supine of an unknown verb (GD §3.3) and the assumption that names them. */
function defaults(conjugation: Reading['conjugation'], root: string, stem: string): { perfect: StemSource; supine: StemSource; rule: DefaultRule } {
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

const canonicalEnding: Readonly<Record<Reading['conjugation'], readonly [string, string]>> = {
  first: ['āre', 'ārī'], second: ['ēre', 'ērī'], third: ['ere', 'ī'], thirdIo: ['ere', 'ī'], fourth: ['īre', 'īrī'],
};

const vowelOf: Readonly<Record<Reading['conjugation'], string>> = { first: 'ā', second: 'ē', third: '', thirdIo: 'i', fourth: 'ī' };

type ReadingAssumption = 'la.classify.assume-third' | 'la.classify.assume-second' | 'la.classify.assume-second-deponent' | 'la.classify.assume-third-deponent';

/**
 * The paradigm of a verb the lexicon does not have (GD §3.2 steps 4 and 5) in one reading of its ending; `assumption`
 * names the reading when the spelling allows another (no macron on the e of -ere or -eri).
 */
function ruleParadigm(typed: string, reading: Reading, hints: LatinStemHints, classHint: LatinClassHint | undefined, assumption: ReadingAssumption | null): Outcome<LatinLexeme> {
  const presentHint = hints.present;
  const presentKey = presentHint === undefined ? undefined : latinKey(presentHint);
  const io = presentKey !== undefined && /io(?:r)?$/u.test(presentKey) && (reading.conjugation === 'third' || classHint === 'thirdIo');
  const conjugation: Reading['conjugation'] = classHint ?? (io ? 'thirdIo' : reading.conjugation);
  const deponent = reading.deponent;
  const semiDeponent = hints.semiDeponent === true && !deponent;
  const root = reading.root;
  const lemma = root + canonicalEnding[conjugation][deponent ? 1 : 0];
  const stem = conjugation === 'thirdIo' && presentHint !== undefined ? without(presentHint, deponent ? 'or' : 'ō') : root + vowelOf[conjugation];
  const present: PresentStem = conjugation === 'thirdIo' && presentHint !== undefined
    ? { from: presentHint, ending: deponent ? 'or' : 'ō', stem, lexical: false }
    : { from: lemma, ending: conjugation === 'third' || conjugation === 'thirdIo' ? deponent ? 'ī' : 'ere' : deponent ? 'rī' : 're', stem, lexical: false };
  const { perfect, supine, rule } = defaults(conjugation, root, stem);
  const perfectSystem = deponent || semiDeponent ? 'participle' : 'stem';
  const perfects = perfectSystem === 'participle' ? [] : hints.perfect ? listed([hints.perfect], perfectEnding, true) : [perfect];
  const supines = hints.supine ? listed([hints.supine], supineEnding, true) : [supine];
  const defaulted = (perfectSystem === 'stem' && !hints.perfect) || !hints.supine;

  const steps: DerivationStep[] = [
    step(latinRules['la.classify.conjugation'], typed, null, { ending: reading.ending, conjugation }),
  ];
  // Not in the lexicon, a passive infinitive could also be the passive of an unknown active verb: deponent is assumed.
  if (deponent) steps.push(step(latinRules['la.classify.assume-deponent'], typed, null));
  if (semiDeponent) steps.push(step(latinRules['la.classify.semi-deponent'], typed, null));
  if (io && classHint === undefined) steps.push(step(latinRules['la.classify.io'], null, presentHint!));
  if (assumption !== null) steps.push(step(latinRules[assumption], null, null));
  if (classHint === undefined && conjugation === 'third') steps.push(step(latinRules['la.classify.assume-consonant-stem'], null, null));
  steps.push(step(latinRules['la.classify.assume-quantity'], null, null));
  if (!deponent && !semiDeponent) steps.push(step(latinRules['la.classify.assume-passive'], null, null));
  if (defaulted) {
    steps.push(rule === 'la.classify.default-parts'
      ? step(latinRules[rule], null, null, { conjugation })
      : step(latinRules[rule], null, null));
  }

  const voiceClass = deponent ? 'deponent' : semiDeponent ? 'semiDeponent' : 'active';
  const participle = supines[0] && `${supines[0].stem}us`;
  // The first person: the a of the first conjugation is lost, a long ē or ī is short before the vowel (A&G §§10.a, 179.a.1).
  const firstPerson = (conjugation === 'first' ? present.stem.replace(/ā$/u, '') : present.stem.replace(/ē$/u, 'e').replace(/ī$/u, 'i')) + (deponent ? 'or' : 'ō');
  const parts = [presentHint ?? firstPerson, lemma,
    ...(perfectSystem === 'participle' ? participle ? [`${participle} sum`] : [] : [`${perfects[0]!.stem}ī`, `${supines[0]!.stem}um`])];
  const lexeme: LatinLexeme = {
    lemma, verbId: lemma, classId: `${conjugation}${deponent ? '-deponent' : semiDeponent ? '-semi-deponent' : ''}`,
    classSource: classHint === undefined ? 'regularRule' : 'explicitHint', reflexive: false, auxiliaries: [], particle: null,
    key: latinKey(lemma), entry: null, family: null, conjugation, stemClass: stemClassOf[conjugation], voiceClass, perfectSystem,
    presentStem: present, perfectStems: perfects, supineStems: supines, futureParticipleStems: [],
    passive: voiceClass === 'active' ? 'personal' : 'none', impersonal: false, lacks: new Set(), flags: new Set(), cells: {}, stems: {},
    principalParts: parts.join(', '), weakened: false,
  };
  const tags: VariantTags = assumption === null ? {} : { pattern: parts[0]!, condition: conditionOf[assumption] };
  return { value: lexeme, steps, tags };
}

/** The condition of each reading of an ending without macrons. */
const conditionOf: Readonly<Record<ReadingAssumption, string>> = {
  'la.classify.assume-third': 'read as third conjugation (-ere)',
  'la.classify.assume-second': 'read as second conjugation (-ēre)',
  'la.classify.assume-second-deponent': 'read as second-conjugation deponent (-ērī)',
  'la.classify.assume-third-deponent': 'read as third-conjugation deponent (-ī)',
};

/** The paradigms of the queried verb (GD §3.2). */
export function classifyLatin(query: Readonly<Record<string, unknown>>): Fork<LatinLexeme> {
  const typed = String(query.infinitive).normalize('NFC');
  const key = latinKey(typed);
  const hints = (query.stems ?? {}) as LatinStemHints;
  const classHint = query.classHint as LatinClassHint | undefined;
  const paradigms = lexiconParadigms(typed, key, hints, classHint);
  if (paradigms.length) return paradigms;
  rejectPassiveInfinitive(typed, key);
  // A breve says "short" (the e of -ĕre: third conjugation); it is read, then dropped from the spelling built on.
  const marked = readEnding(typed, key, hints.present);
  const plain = withoutBreves(typed);
  const reading = { ...marked, root: withoutBreves(marked.root), ending: withoutBreves(marked.ending) };
  if (classHint === undefined && reading.assumeThird) {
    // No macron on the e of -ere and no first person: both conjugations are possible, so both paradigms are returned.
    return [
      ruleParadigm(plain, reading, hints, classHint, 'la.classify.assume-third'),
      ruleParadigm(plain, { ...reading, conjugation: 'second' }, hints, classHint, 'la.classify.assume-second'),
    ];
  }
  if (classHint === undefined && reading.assumeSecondDeponent) {
    return [
      ruleParadigm(plain, reading, hints, classHint, 'la.classify.assume-second-deponent'),
      ruleParadigm(plain, { ...reading, conjugation: 'third', root: plain.slice(0, -1), ending: plain.slice(-1) }, hints, classHint, 'la.classify.assume-third-deponent'),
    ];
  }
  return [ruleParadigm(plain, reading, hints, classHint, null)];
}

/** The lexeme of a verb a periphrasis names (esse, īre). */
export function lexemeOfLatin(lemma: string): LatinLexeme {
  const entry = (latinLexicon[latinKey(lemma)] ?? []).find(candidate => candidate.infinitive === lemma);
  if (!entry) throw new ConjugationError('GENERATION_FAILURE', `${lemma} is not in the Latin lexicon.`);
  return lexemeFromEntry(entry);
}
