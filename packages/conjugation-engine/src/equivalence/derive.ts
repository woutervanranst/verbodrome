/**
 * The derivation of tense equivalents: from the tense maps of two languages, the ranked tenses of the target that
 * correspond to one tense of the source. Pure and synchronous; it knows no language by name and validates nothing
 * but the voice (its callers check languages and tenses).
 *
 * 1. The source links are the links of the source tense that are not `only: 'target'`.
 * 2. Every target tense is scored over the pairs (source link, target link that is not `only: 'source'`) that are
 *    compatible at a level of the ladder: 0 exact, 1 register (a `dated` target link), 2 remoteness, 3 aspect,
 *    4 mood (subjunctive or conditional to indicative). Finiteness, time, relative time and polarity never relax.
 *    Its score is the best `weight × weight`, rounded to two decimals. The first level that scores a tense is the
 *    result; within one language only level 0 runs, and the tense itself comes first.
 * 3. Candidates sort by score, then by the register of the target link, then by catalogue (map) order.
 * 4. A pair override of the source tense replaces, prepends to or excludes from the list.
 * 5. With no match, the result's own notes say why: `eq.note.no-counterpart` and the source links' notes.
 * 6. A passive lookup into a language without a modelled passive flags every exact match approximate with a note.
 */
import { ConjugationError } from '../errors.js';
import { concepts, moodRelaxation } from './concepts.js';
import type { ConceptDef, ConceptId, ConceptLink, ConceptMood, NoteKey, Register } from './concepts.js';

/** A dimension the ladder relaxed to reach a match, in ladder order. */
export type Relaxation = 'register' | 'remoteness' | 'aspect' | 'mood';
/** `exact`: a shared concept; `approximate`: a relaxed one or a stand-in; `override`: a pair override's answer. */
export type MatchType = 'exact' | 'approximate' | 'override';

/** One ranked target tense, as a `mood.tense` key. */
export interface EquivalentFound {
  readonly match: MatchType;
  readonly tense: string;
  /** 1-based position in the list. */
  readonly rank: number;
  /** The product of the two link weights, rounded to two decimals; 1 for an override. */
  readonly score: number;
  /** The register of the target link: a trainer can leave out `literary` and `dated` tenses. */
  readonly register: Register;
  readonly relaxed: readonly Relaxation[];
  /** The source and target concepts of the best pair; `null` for an override. */
  readonly via: readonly [source: ConceptId, target: ConceptId] | null;
  readonly notes: readonly NoteKey[];
}

/** The ranked matches, and the notes of the lookup as a whole (never empty when there is no match). */
export interface RawEquivalence {
  readonly matches: readonly EquivalentFound[];
  readonly notes: readonly NoteKey[];
}

export interface RawOverride {
  readonly from: string;
  readonly to: string;
  readonly tense: string;
  readonly mode: 'replace' | 'prepend' | 'exclude';
  readonly result: readonly { readonly tense: string; readonly note?: NoteKey }[];
  readonly reason: string;
}

export interface EquivalenceData {
  /** Language, then tense key, then its links; keys in catalogue order. */
  readonly maps: Readonly<Record<string, Readonly<Record<string, readonly ConceptLink[]>>>>;
  readonly overrides: readonly RawOverride[];
  /** The languages whose passive is modelled: a passive lookup may start only from one of them. */
  readonly passiveLanguages: readonly string[];
}

export interface EquivalenceOptions {
  /** The voice of the source tense; `active` when absent. */
  readonly voice?: 'active' | 'passive';
}

/** The highest level of the ladder: exact, register, remoteness, aspect, mood. */
const MOOD_LEVEL = 4;

const registerRank: Readonly<Record<Register, number>> = { standard: 0, literary: 1, dated: 2 };

const relaxationNotes: Readonly<Record<Exclude<Relaxation, 'mood'>, NoteKey>> = {
  register: 'eq.note.relaxed-register',
  remoteness: 'eq.note.relaxed-remoteness',
  aspect: 'eq.note.relaxed-aspect',
};

const registerOf = (link: ConceptLink): Register => link.register ?? 'standard';

const unique = <T>(values: readonly T[]): T[] => [...new Set(values)];

function relaxesTo(from: ConceptMood, to: ConceptMood): boolean {
  if (from !== 'subjunctive' && from !== 'conditional') return false;
  return (moodRelaxation[from] as readonly ConceptMood[]).includes(to);
}

/**
 * The dimensions on which two concepts differ, if the ladder at `level` may relax all of them; `null` when it may not
 * (or when they differ in a dimension that never relaxes).
 */
function conceptDifferences(source: ConceptDef, target: ConceptDef, level: number): Relaxation[] | null {
  if (source.finiteness !== target.finiteness || source.time !== target.time || source.relative !== target.relative
    || source.polarity !== target.polarity) return null;
  const relaxed: Relaxation[] = [];
  if (source.remoteness !== target.remoteness) {
    if (level < 2) return null;
    relaxed.push('remoteness');
  }
  if (source.aspect !== target.aspect) {
    if (level < 3) return null;
    relaxed.push('aspect');
  }
  if (source.mood !== target.mood) {
    if (level < MOOD_LEVEL || !relaxesTo(source.mood, target.mood)) return null;
    relaxed.push('mood');
  }
  return relaxed;
}

/** What a pair of links relaxes at `level`, or `null` when the pair is not compatible there. */
function pairDifferences(source: ConceptLink, target: ConceptLink, level: number): Relaxation[] | null {
  const datedTarget = registerOf(target) === 'dated' && registerOf(source) !== 'dated';
  if (datedTarget && level < 1) return null;
  const relaxed = conceptDifferences(concepts[source.concept], concepts[target.concept], level);
  if (relaxed === null) return null;
  return datedTarget ? ['register', ...relaxed] : relaxed;
}

const round2 = (value: number): number => Math.round(value * 100) / 100;

interface Candidate {
  readonly tense: string;
  readonly order: number;
  readonly score: number;
  readonly source: ConceptLink;
  readonly target: ConceptLink;
  readonly relaxed: readonly Relaxation[];
}

/** Every target tense scored at `level`, in map order. */
function scoreLevel(sources: readonly ConceptLink[], target: Readonly<Record<string, readonly ConceptLink[]>>,
  skip: string | null, level: number): Candidate[] {
  const candidates: Candidate[] = [];
  Object.entries(target).forEach(([tense, links], order) => {
    if (tense === skip) return;
    let best: Candidate | null = null;
    for (const source of sources) {
      for (const link of links) {
        if (link.only === 'source') continue;
        const relaxed = pairDifferences(source, link, level);
        if (relaxed === null) continue;
        const score = round2(source.weight * link.weight);
        if (best === null || score > best.score) best = { tense, order, score, source, target: link, relaxed };
      }
    }
    if (best !== null) candidates.push(best);
  });
  return candidates;
}

function found(candidate: Candidate): Omit<EquivalentFound, 'rank'> {
  const { source, target, relaxed } = candidate;
  const notes: NoteKey[] = [];
  if (source.note !== undefined) notes.push(source.note);
  if (target.note !== undefined) notes.push(target.note);
  for (const relaxation of relaxed) {
    if (relaxation !== 'mood') notes.push(relaxationNotes[relaxation]);
    else notes.push(concepts[source.concept].mood === 'conditional' ? 'eq.note.no-conditional' : 'eq.note.no-subjunctive');
  }
  return {
    match: relaxed.length === 0 && target.only !== 'target' ? 'exact' : 'approximate',
    tense: candidate.tense,
    score: candidate.score,
    register: registerOf(target),
    relaxed,
    via: [source.concept, target.concept],
    notes: unique(notes),
  };
}

function overridden(entries: readonly Omit<EquivalentFound, 'rank'>[], override: RawOverride,
  target: Readonly<Record<string, readonly ConceptLink[]>>): Omit<EquivalentFound, 'rank'>[] {
  const named = new Set(override.result.map(entry => entry.tense));
  const rest = entries.filter(entry => !named.has(entry.tense));
  if (override.mode === 'exclude') return rest;
  const given = override.result.map((entry): Omit<EquivalentFound, 'rank'> => {
    const first = target[entry.tense]?.[0];
    return {
      match: 'override', tense: entry.tense, score: 1, register: first ? registerOf(first) : 'standard',
      relaxed: [], via: null, notes: entry.note === undefined ? [] : [entry.note],
    };
  });
  return override.mode === 'replace' ? given : [...given, ...rest];
}

function freezeEntry(entry: Omit<EquivalentFound, 'rank'>, rank: number): EquivalentFound {
  return Object.freeze({
    ...entry,
    rank,
    relaxed: Object.freeze([...entry.relaxed]),
    via: entry.via === null ? null : Object.freeze([entry.via[0], entry.via[1]] as const),
    notes: Object.freeze([...entry.notes]),
  });
}

export function deriveEquivalents(data: EquivalenceData, from: string, to: string, tense: string,
  options: EquivalenceOptions = {}): RawEquivalence {
  const passive = options.voice === 'passive';
  if (passive && !data.passiveLanguages.includes(from)) {
    throw new ConjugationError('INVALID_REQUEST', `A passive lookup needs a language with a modelled passive (${data.passiveLanguages.join(', ') || 'none'}), not ${from}.`);
  }
  const sources = (data.maps[from]?.[tense] ?? []).filter(link => link.only !== 'target');
  const target = data.maps[to] ?? {};
  const same = from === to;

  let candidates: Candidate[] = [];
  for (let level = 0; level <= (same ? 0 : MOOD_LEVEL) && candidates.length === 0; level++) {
    candidates = scoreLevel(sources, target, same ? tense : null, level);
  }
  candidates.sort((a, b) => b.score - a.score || registerRank[registerOf(a.target)] - registerRank[registerOf(b.target)] || a.order - b.order);
  let entries = candidates.map(found);

  const own = sources[0];
  if (same && own !== undefined) {
    entries.unshift({ match: 'exact', tense, score: 1, register: registerOf(own), relaxed: [], via: [own.concept, own.concept], notes: [] });
  }
  for (const override of data.overrides) {
    if (override.from === from && override.to === to && override.tense === tense) entries = overridden(entries, override, target);
  }

  if (entries.length === 0) {
    const notes: NoteKey[] = ['eq.note.no-counterpart', ...sources.flatMap(link => link.note === undefined ? [] : [link.note])];
    return Object.freeze({ matches: Object.freeze([]), notes: Object.freeze(unique(notes)) });
  }
  if (passive && !data.passiveLanguages.includes(to)) {
    entries = entries.map(entry => ({
      ...entry,
      match: entry.match === 'exact' ? 'approximate' : entry.match,
      notes: unique([...entry.notes, 'eq.note.passive-not-modelled']),
    }));
  }
  return Object.freeze({
    matches: Object.freeze(entries.map((entry, index) => freezeEntry(entry, index + 1))),
    notes: Object.freeze([]),
  });
}
