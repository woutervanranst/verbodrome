/**
 * Dev-only, run once (plan 3 Task 1): bootstraps the French family lexicon from the legacy model tables, so that no
 * principal part is retyped. It reads `frenchModels` and their cells, extracts each non-productive model's principal
 * parts (GD §5.2), lists what the formation rules cannot produce (suppletive cells, gaps, listed spellings), and writes
 * `src/languages/fr/families.ts` and `src/languages/fr/ending-sets.ts`. It writes nothing else. Deleted with the legacy
 * tables in Task 8; from then on `families.ts` is maintained by hand.
 *
 * Run from packages/conjugation-engine:
 *   node --experimental-strip-types --import ./scripts/characterize/register.ts scripts/fr/bootstrap-families.ts
 *
 * `derive` is the reference formation the bootstrap test checks the data with: GD §4.2-4.3 plus the spelling rules that
 * act in traditional spelling (t after a dental, the circumflex before t, the croître homograph). `spellingRulesOf`
 * simulates the rules that write the rectified spelling (GD §4.4 rules 10, 12-15) and the listed spellings.
 */
import { execSync } from 'node:child_process';
import { writeFileSync } from 'node:fs';
import { cellNames, values } from '../../src/languages/fr/family.js';
import type { CellName, FamilyEntry, FamilyFlags, FamilyParadigm, Part, PrincipalParts, SingularSet, Theme } from '../../src/languages/fr/family.js';
import { frenchModels } from '../../src/languages/fr/models.js';
import type { FrenchModel } from '../../src/languages/fr/models.js';
import { cellTexts } from '../../src/languages/fr/table.js';
import type { Spelling } from '../../src/languages/fr/table.js';

export type { CellName, FamilyEntry, FamilyParadigm, PrincipalParts } from '../../src/languages/fr/family.js';

interface Juncture { readonly stem: string; readonly ending: string }

type Words = readonly string[] | null;

const presentSingular: Readonly<Record<SingularSet, readonly string[]>> = { e: ['e', 'es', 'e'], s: ['s', 's', 't'], x: ['x', 'x', 't'] };
const presentPlural = ['ons', 'ez', 'ent'];
const imperfect = ['ais', 'ais', 'ait', 'ions', 'iez', 'aient'];
const future = ['ai', 'as', 'a', 'ons', 'ez', 'ont'];
const subjunctive = ['e', 'es', 'e', 'ions', 'iez', 'ent'];
const simplePast: Readonly<Record<Theme, readonly string[]>> = {
  a: ['ai', 'as', 'a', 'âmes', 'âtes', 'èrent'],
  i: ['is', 'is', 'it', 'îmes', 'îtes', 'irent'],
  u: ['us', 'us', 'ut', 'ûmes', 'ûtes', 'urent'],
  in: ['ins', 'ins', 'int', 'înmes', 'întes', 'inrent'],
  ï: ['ïs', 'ïs', 'ït', 'ïmes', 'ïtes', 'ïrent'],
};
const subjunctiveImperfect: Readonly<Record<Theme, readonly string[]>> = {
  a: ['asse', 'asses', 'ât', 'assions', 'assiez', 'assent'],
  i: ['isse', 'isses', 'ît', 'issions', 'issiez', 'issent'],
  u: ['usse', 'usses', 'ût', 'ussions', 'ussiez', 'ussent'],
  in: ['insse', 'insses', 'înt', 'inssions', 'inssiez', 'inssent'],
  ï: ['ïsse', 'ïsses', 'ït', 'ïssions', 'ïssiez', 'ïssent'],
};

const index = (name: CellName): number => cellNames.indexOf(name);
const nameOf = (cell: number): CellName => cellNames[cell]!;
const equal = (a: Words, b: Words): boolean => JSON.stringify(a) === JSON.stringify(b);
const unique = (words: readonly string[]): string[] => [...new Set(words)];
const join = (junctures: readonly Juncture[]): string[] => unique(junctures.map(j => j.stem + j.ending));
const on = (stems: readonly string[], ending: string): Juncture[] => stems.map(stem => ({ stem, ending }));

/** What derivation needs to know of an entry besides one paradigm. */
interface Lexical { readonly id: string; readonly flags: FamilyFlags; readonly tail: string }

/** The infinitive's last `strip` letters, which the parts replace (the infinitive relative to the stripped stem). */
function tailOf(lemmas: readonly string[], suffixes: readonly string[], strip: number): string {
  const representative = lemmas[0] ?? suffixes[0] ?? '';
  return representative.slice(representative.length - strip);
}

/** Cells the entry's flags rule out: persons an impersonal or third-person verb lacks, the imperative, the agreeing participles. */
function masked(flags: FamilyFlags, cell: number): boolean {
  if (cell < 42) {
    const slot = cell % 6;
    if (flags.impersonal === 'singular') return slot !== 2;
    if (flags.impersonal === 'figurativePlural' || flags.thirdPersonOnly) return slot !== 2 && slot !== 5;
    return false;
  }
  if (cell <= 44) return Boolean(flags.noImperative || flags.impersonal || flags.thirdPersonOnly);
  if (cell >= 47 && cell <= 49) return Boolean(flags.invariableParticiple);
  return false;
}

/** Drops the final s of an imperative 2sg after e or a (aime, cueille, va). */
function dropS(j: Juncture): Juncture {
  const word = j.stem + j.ending;
  if (!/[ea]s$/u.test(word)) return j;
  return j.ending ? { stem: j.stem, ending: j.ending.slice(0, -1) } : { stem: j.stem.slice(0, -1), ending: '' };
}

/** The past participle without the circumflex of a final û, which only the masculine singular keeps (dû, due). */
const plainParticiple = (pp: string): string => pp.replace(/û$/u, 'u');

/**
 * The junctures of one cell by the formation rules, before the spelling rules that differ by spelling: GD §4.2-4.3, the
 * t after a dental (rule 8) and the croître homograph (rule 11). Cells the paradigm lists replace derivation where
 * another cell is built from them (the imperative from the present or the subjunctive). Null when the part is missing.
 */
function formation(lexical: Lexical, paradigm: Pick<FamilyParadigm, 'parts' | 'cells'>, cell: number): Juncture[] | null {
  const { parts } = paradigm;
  const P1 = values(parts.P1);
  const P2 = values(parts.P2);
  const P3 = parts.P3 === undefined ? P2 : values(parts.P3);
  const SJ1 = parts.SJ1 === undefined ? P3 : values(parts.SJ1);
  const SJ2 = parts.SJ2 === undefined ? P2 : values(parts.SJ2);
  const F = values(parts.F);
  const PS = values(parts.PS);
  const PP = values(parts.PP);
  const some = (junctures: Juncture[]): Juncture[] | null => junctures.length ? junctures : null;
  /** Another cell's junctures: its listed words if the paradigm lists it, else its formation. */
  const reference = (name: CellName): Juncture[] | null => {
    const listed = paradigm.cells[name];
    return listed ? listed.map(word => ({ stem: word, ending: '' })) : formation(lexical, paradigm, index(name));
  };
  const past = (endings: Readonly<Record<Theme, readonly string[]>>, slot: number): Juncture[] | null => {
    if (!PS.length || parts.theme === undefined) return null;
    const ending = endings[parts.theme][slot]!;
    // Rule 11: croître writes û where its forms would be spelt like croire's.
    return on(PS, lexical.id === 'croître' ? ending.replace(/^u/u, 'û') : ending);
  };
  if (cell < 42) {
    const row = Math.floor(cell / 6);
    const slot = cell % 6;
    switch (row) {
      case 0: {
        if (slot < 3) {
          if (!P1.length || parts.set === undefined) return null;
          const ending = presentSingular[parts.set][slot]!;
          // Rule 8: the 3sg t is not written after d, t or c.
          return P1.map(stem => ({ stem, ending: ending === 't' && /[dtc]$/u.test(stem) ? '' : ending }));
        }
        return some(on(slot === 5 ? P3 : P2, presentPlural[slot - 3]!));
      }
      case 1: return some(on(P2, imperfect[slot]!));
      case 2: return past(simplePast, slot);
      case 3: return some(on(F, future[slot]!));
      case 4: return some(on(slot === 3 || slot === 4 ? SJ2 : SJ1, subjunctive[slot]!));
      case 5: return past(subjunctiveImperfect, slot);
      default: return some(on(F, imperfect[slot]!));
    }
  }
  const name = nameOf(cell);
  if (name === 'imp.2s' || name === 'imp.1p' || name === 'imp.2p') {
    const present = name === 'imp.2s' ? 'pres.2s' : name === 'imp.1p' ? 'pres.1p' : 'pres.2p';
    const regular = (): Juncture[] => (reference(present) ?? []).map(j => name === 'imp.2s' ? dropS(j) : j);
    if (!lexical.flags.imperativeFromSubjunctive) return some(regular());
    // One series per SJ2 value: the nous stem's is the ordinary imperative, any other is the subjunctive's.
    return some(SJ2.flatMap(stem => {
      if (stem === P2[0]) return regular();
      if (name === 'imp.2s') return (reference('subj.2s') ?? []).map(dropS);
      return [{ stem, ending: name === 'imp.1p' ? 'ons' : 'ez' }];
    }));
  }
  switch (name) {
    case 'ppres': return some(on(lexical.flags.presentParticipleFromSubjunctive ? SJ2 : P2, 'ant'));
    case 'pp.ms': return some(on(PP, ''));
    case 'pp.fs': return some(on(parts.PPF === undefined ? PP.map(plainParticiple) : values(parts.PPF), 'e'));
    case 'pp.mp': return some(PP.map(plainParticiple).map(stem => ({ stem, ending: /[sx]$/u.test(stem) ? '' : 's' })));
    case 'pp.fp': return some(on(parts.PPF === undefined ? PP.map(plainParticiple) : values(parts.PPF), 'es'));
    default: return [{ stem: lexical.tail, ending: '' }];
  }
}

/** Rule 10, traditional branch: the stem vowel before the 3sg t takes a circumflex (connaît, plaît, gît, clôt). */
function circumflexBeforeT(lexical: Lexical, cell: number, j: Juncture, spelling: Spelling): Juncture {
  if (!lexical.flags.circumflexBeforeT || nameOf(cell) !== 'pres.3s' || j.ending !== 't') return j;
  if (j.stem.endsWith('o')) return { stem: `${j.stem.slice(0, -1)}ô`, ending: j.ending };
  if (j.stem.endsWith('i') && spelling === 'traditional') return { stem: `${j.stem.slice(0, -1)}î`, ending: j.ending };
  return j;
}

function deriveWith(lexical: Lexical, paradigm: Pick<FamilyParadigm, 'parts' | 'cells' | 'gaps'>, cell: number): string[] | null {
  if (masked(lexical.flags, cell) || paradigm.gaps.includes(nameOf(cell))) return null;
  const junctures = formation(lexical, paradigm, cell);
  return junctures && join(junctures.map(j => circumflexBeforeT(lexical, cell, j, 'traditional')));
}

function lexicalOf(entry: FamilyEntry): Lexical {
  return { id: entry.id, flags: entry.flags, tail: tailOf(entry.lemmas, entry.suffixes, entry.strip) };
}

/**
 * The traditional words of `cell` in paradigm `paradigm` of `entry`, by the formation rules and the spelling rules that
 * act in traditional spelling; null for a cell the verb does not have (missing part, gap or flag). It does not read the
 * cell's own listed words (the caller prefers those); it does read listed cells that another cell is built from.
 */
export function derive(entry: FamilyEntry, paradigm: number, cell: number): readonly string[] | null {
  return deriveWith(lexicalOf(entry), entry.paradigms[paradigm]!, cell);
}

const mute = (ending: string): boolean => ['e', 'es', 'ent'].includes(ending) || (ending.startsWith('er') && ending.length > 2);

/** Cells of croître whose circumflex rule 11 keeps or adds: present singular, imperative 2sg, passé simple, subj. imperfect, masc. sg. participle. */
function croitreHomograph(cell: number): boolean {
  const name = nameOf(cell);
  return ['pres.1s', 'pres.2s', 'pres.3s', 'imp.2s', 'pp.ms'].includes(name) || name.startsWith('ps.') || name.startsWith('subjimpf.');
}

/** The rectified-spelling rules of GD §4.4 that act on families, in order; each returns the juncture, changed or not. */
const rectifiedRules: readonly { readonly id: string; apply(lexical: Lexical, cell: number, j: Juncture): Juncture }[] = [
  {
    id: 'fr.orth.1990-circumflex',
    apply: (lexical, cell, j) => {
      if (!/[îû]/u.test(j.stem)) return j;
      if (lexical.id === 'croître' && croitreHomograph(cell)) return j;
      if (lexical.id === 'devoir' && nameOf(cell) === 'pp.ms') return j;
      return { stem: j.stem.replace(/î/gu, 'i').replace(/û/gu, 'u'), ending: j.ending };
    },
  },
  {
    id: 'fr.orth.1990-assoir',
    apply: (lexical, _, j) => (lexical.id === 'asseoir' || lexical.id === 'surseoir') && j.stem.includes('seoi')
      ? { stem: j.stem.replace('seoi', 'soi'), ending: j.ending } : j,
  },
  {
    id: 'fr.orth.1990-interpeler',
    apply: (lexical, _, j) => {
      if (lexical.id !== 'interpeller') return j;
      const at = j.stem.lastIndexOf('ll');
      if (at < 0 || mute((j.stem + j.ending).slice(at + 2))) return j;
      return { stem: j.stem.slice(0, at) + j.stem.slice(at + 1), ending: j.ending };
    },
  },
  {
    id: 'fr.orth.1990-absout',
    apply: (lexical, cell, j) => {
      const name = nameOf(cell);
      if (lexical.id !== 'absoudre' || (name !== 'pp.ms' && name !== 'pp.mp') || !j.stem.endsWith('sous')) return j;
      return { stem: `${j.stem.slice(0, -1)}t`, ending: name === 'pp.mp' ? 's' : '' };
    },
  },
];

/** The rectified words of a cell by the rules alone (no listed spellings), and the ids of the rules that changed them. */
function rectifiedByRules(lexical: Lexical, paradigm: Pick<FamilyParadigm, 'parts' | 'cells' | 'gaps'>, cell: number): { words: Words; rules: string[] } {
  if (masked(lexical.flags, cell) || paradigm.gaps.includes(nameOf(cell))) return { words: null, rules: [] };
  const listed = paradigm.cells[nameOf(cell)];
  const raw = listed ? listed.map(word => ({ stem: word, ending: '' })) : formation(lexical, paradigm, cell);
  if (!raw) return { words: null, rules: [] };
  const rules = new Set<string>();
  const words = join(raw.map(start => {
    const traditional = circumflexBeforeT(lexical, cell, start, 'traditional');
    let j = circumflexBeforeT(lexical, cell, start, 'rectified');
    if (j.stem + j.ending !== traditional.stem + traditional.ending) rules.add('fr.orth.circumflex-before-t');
    for (const rule of rectifiedRules) {
      const next = rule.apply(lexical, cell, j);
      if (next.stem + next.ending !== j.stem + j.ending) rules.add(rule.id);
      j = next;
    }
    return j;
  }));
  return { words, rules: [...rules] };
}

/**
 * The rectified words of a cell and the rules (GD §4.4 ids, or `fr.stem.listed-spelling`) that make them differ from the
 * traditional ones; no rules for a cell spelt alike in both.
 */
export function spellingRulesOf(entry: FamilyEntry, paradigm: number, cell: number): { readonly words: Words; readonly rules: readonly string[] } {
  const chosen = entry.paradigms[paradigm]!;
  const listed = chosen.spellings[nameOf(cell)];
  if (listed) return { words: listed.rectified, rules: ['fr.stem.listed-spelling'] };
  return rectifiedByRules(lexicalOf(entry), chosen, cell);
}

/** The stems of `words` without `suffix`, when every word has it. */
function strip(words: Words, suffix: string): string[] | null {
  if (!words?.length || !words.every(word => word.endsWith(suffix))) return null;
  return words.map(word => word.slice(0, word.length - suffix.length));
}

const asPart = (stems: readonly string[]): Part => stems.length === 1 ? stems[0]! : [...stems];

/** The past stem and theme vowel read off a passé simple 1sg or 3sg, or a subjunctive imperfect 3sg. */
function pastOf(texts: (cell: number) => Words): { readonly stems: string[]; readonly theme: Theme } | null {
  const readings: readonly (readonly [number, readonly (readonly [string, Theme])[]])[] = [
    [index('ps.1s'), [['ins', 'in'], ['ai', 'a'], ['ïs', 'ï'], ['is', 'i'], ['us', 'u'], ['ûs', 'u']]],
    [index('ps.3s'), [['int', 'in'], ['ït', 'ï'], ['it', 'i'], ['ut', 'u'], ['ût', 'u'], ['a', 'a']]],
    [index('subjimpf.3s'), [['înt', 'in'], ['ït', 'ï'], ['ît', 'i'], ['ût', 'u'], ['ât', 'a']]],
  ];
  for (const [cell, endings] of readings) {
    const words = texts(cell);
    if (!words) continue;
    for (const [ending, theme] of endings) {
      const stems = strip(words, ending);
      if (stems) return { stems, theme };
    }
  }
  return null;
}

/** Principal parts and flags read off one paradigm's traditional cells (GD §5.2, with the fallbacks for defective verbs). */
function partsOf(texts: (cell: number) => Words): { readonly parts: PrincipalParts; readonly flags: FamilyFlags } {
  const parts: { -readonly [K in keyof PrincipalParts]: PrincipalParts[K] } = {};
  const flags: { -readonly [K in keyof FamilyFlags]: FamilyFlags[K] } = {};
  // P1 and its ending set from the 1sg; a verb without a 1sg (impersonal, third person only) from the 3sg.
  const first = texts(index('pres.1s'))?.[0];
  const third = texts(index('pres.3s'))?.[0];
  if (first !== undefined) {
    const set = (['e', 'x', 's'] as const).find(ending => first.endsWith(ending));
    if (set) Object.assign(parts, { P1: first.slice(0, -1), set });
  } else if (third !== undefined) {
    const stem = third.endsWith('t') ? third.slice(0, -1) : third;
    Object.assign(parts, { P1: stem, set: /[ae]u$/u.test(stem) ? 'x' : 's' });
  }
  const P2 = strip(texts(index('pres.1p')), 'ons') ?? strip(texts(index('impf.3s')), 'ait') ?? strip(texts(index('impf.1s')), 'ais')
    ?? strip(texts(index('impf.3p')), 'aient') ?? strip(texts(index('ppres')), 'ant');
  if (P2) parts.P2 = asPart(P2);
  const P3 = strip(texts(index('pres.3p')), 'ent');
  if (P3 && !equal(P3, P2)) parts.P3 = asPart(P3);
  const F = strip(texts(index('fut.1s')), 'ai') ?? strip(texts(index('fut.3s')), 'a') ?? strip(texts(index('cond.3s')), 'ait');
  if (F) parts.F = asPart(F);
  const past = pastOf(texts);
  if (past) Object.assign(parts, { PS: asPart(past.stems), theme: past.theme });
  const PP = texts(index('pp.ms'));
  if (PP?.length) {
    parts.PP = asPart(PP);
    const feminine = strip(texts(index('pp.fs')), 'e');
    if (feminine && !equal(feminine, PP.map(plainParticiple))) parts.PPF = asPart(feminine);
  }
  // SJ1: the reading that derives the most singular and 3pl subjunctive cells (être's soient beside sois).
  const subjunctiveCells = (['subj.1s', 'subj.2s', 'subj.3s', 'subj.3p'] as const).map(index);
  const candidates = [
    strip(texts(index('subj.1s')), 'e'), strip(texts(index('subj.3p')), 'ent'),
    strip(texts(index('subj.3s')), 'e'), strip(texts(index('subj.2s')), 'es'),
  ].filter((stems): stems is string[] => stems !== null);
  const score = (stems: readonly string[]) => subjunctiveCells.filter(cell =>
    equal(texts(cell), stems.map(stem => stem + subjunctive[cell % 6]!))).length;
  const SJ1 = candidates.reduce<string[] | null>((best, stems) => best === null || score(stems) > score(best) ? stems : best, null);
  if (SJ1 && !equal(SJ1, P3 ?? P2)) parts.SJ1 = asPart(SJ1);
  // SJ2 from the subjunctive 1pl/2pl, or (être, avoir) from the imperative that follows the subjunctive.
  const SJ2 = strip(texts(index('subj.1p')), 'ions') ?? strip(texts(index('subj.2p')), 'iez') ?? strip(texts(index('imp.1p')), 'ons')
    ?? strip(texts(index('subj.1p')), 'ons');
  if (SJ2 && !equal(SJ2, P2)) {
    parts.SJ2 = asPart(SJ2);
    const imperative = texts(index('imp.1p'));
    if (imperative && !equal(imperative, (P2 ?? []).map(stem => `${stem}ons`)) && equal(imperative, SJ2.map(stem => `${stem}ons`))) {
      flags.imperativeFromSubjunctive = true;
    }
    const participle = texts(index('ppres'));
    if (participle && !equal(participle, (P2 ?? []).map(stem => `${stem}ant`)) && equal(participle, SJ2.map(stem => `${stem}ant`))) {
      flags.presentParticipleFromSubjunctive = true;
    }
  }
  // Rule 10: a 3sg spelt with a circumflex the singular stem does not have (connaît, plaît, gît, clôt).
  if (typeof parts.P1 === 'string' && parts.set === 's' && third !== undefined
    && ((third.endsWith('ît') && parts.P1.endsWith('i')) || (third.endsWith('ôt') && parts.P1.endsWith('o')))) {
    flags.circumflexBeforeT = true;
  }
  return { parts, flags };
}

/** The family entry of a non-productive legacy model (GD §5.2). */
export function extract(model: FrenchModel): FamilyEntry {
  const tables = model.paradigms.map(paradigm => (spelling: Spelling) => (cell: number): Words =>
    cellTexts('', paradigm.cells[cell]!, spelling, model.kind === 'er'));
  const read = tables.map(table => partsOf(table('traditional')));
  const flags: { -readonly [K in keyof FamilyFlags]: FamilyFlags[K] } = {
    ...(model.invariableParticiple ? { invariableParticiple: true } : {}),
    ...(model.impersonal ? { impersonal: model.impersonal } : {}),
    ...(model.thirdPersonOnly ? { thirdPersonOnly: true } : {}),
    ...(model.noImperative ? { noImperative: true } : {}),
    ...(model.compounds === 'all' ? {} : { compounds: model.compounds }),
  };
  for (const key of ['imperativeFromSubjunctive', 'presentParticipleFromSubjunctive', 'circumflexBeforeT'] as const) {
    if (read.some(paradigm => paradigm.flags[key])) flags[key] = true;
  }
  const lexical: Lexical = { id: model.id, flags, tail: tailOf(model.lemmas, model.suffixes, model.strip) };
  const paradigms = model.paradigms.map((paradigm, p): FamilyParadigm => {
    const traditional = tables[p]!('traditional');
    const rectified = tables[p]!('rectified');
    const { parts } = read[p]!;
    const cells: Partial<Record<CellName, readonly string[]>> = {};
    const gaps: CellName[] = [];
    // In table order, so the imperative sees the listed present and subjunctive cells it is built from.
    cellNames.forEach((name, cell) => {
      const expected = traditional(cell);
      const derived = deriveWith(lexical, { parts, cells, gaps: [] }, cell);
      if (expected === null && derived !== null) gaps.push(name);
      else if (expected !== null && !equal(derived, expected)) cells[name] = expected;
    });
    const spellings: Partial<Record<CellName, { readonly rectified: readonly string[] }>> = {};
    cellNames.forEach((name, cell) => {
      const expected = rectified(cell);
      if (!equal(rectifiedByRules(lexical, { parts, cells, gaps }, cell).words, expected)) spellings[name] = { rectified: expected ?? [] };
    });
    return { pattern: paradigm.pattern, usage: paradigm.usage, parts, gaps, cells, spellings };
  });
  return {
    id: model.id, lemmas: model.lemmas, suffixes: model.suffixes, except: model.except, exceptEndings: model.exceptEndings,
    strip: model.strip, paradigms, flags,
  };
}

/** A value as TypeScript source: single-quoted strings, inline arrays and objects, keys quoted only where needed. */
function literal(value: unknown): string {
  if (value === null) return 'null';
  if (typeof value === 'string') return `'${value.replace(/\\/gu, '\\\\').replace(/'/gu, "\\'")}'`;
  if (typeof value === 'number' || typeof value === 'boolean') return String(value);
  if (Array.isArray(value)) return `[${value.map(literal).join(', ')}]`;
  const entries = Object.entries(value as Record<string, unknown>).filter(([, item]) => item !== undefined);
  if (!entries.length) return '{}';
  return `{ ${entries.map(([key, item]) => `${/^[A-Za-z_$][\w$]*$/u.test(key) ? key : literal(key)}: ${literal(item)}`).join(', ')} }`;
}

function familiesSource(entries: readonly FamilyEntry[], commit: string): string {
  const body = entries.map(entry => [
    '  {',
    `    id: ${literal(entry.id)}, lemmas: ${literal(entry.lemmas)}, suffixes: ${literal(entry.suffixes)},`,
    `    except: ${literal(entry.except)}, exceptEndings: ${literal(entry.exceptEndings)}, strip: ${entry.strip},`,
    '    paradigms: [',
    ...entry.paradigms.map(paradigm => `      ${literal(paradigm)},`),
    '    ],',
    `    flags: ${literal(entry.flags)},`,
    '  },',
  ].join('\n')).join('\n');
  return `/**
 * The French verb families: one entry per non-productive conjugation model, with its selectors and, per paradigm, the
 * principal parts the formation rules derive every simple cell from (GD §4.2, §5). Parts are in traditional spelling and
 * relative to the infinitive minus its last \`strip\` letters.
 *
 * Generated once from \`models.ts\` at commit ${commit} by \`scripts/fr/bootstrap-families.ts\`, and maintained by hand from
 * now on.
 */
import type { FamilyEntry } from './family.js';

export const frenchFamilies: readonly FamilyEntry[] = [
${body}
];
`;
}

function endingSetsSource(commit: string): string {
  const set = (id: string): string => {
    const model = frenchModels.find(candidate => candidate.id === id)!;
    const endings = cellNames.map((_, cell) => cellTexts('', model.paradigms[0]!.cells[cell]!, 'traditional', false)![0]!);
    const rows = [0, 6, 12, 18, 24, 30, 36, 42].map(start => endings.slice(start, start === 42 ? 51 : start + 6));
    return rows.map(row => `  ${row.map(literal).join(', ')},`).join('\n');
  };
  return `/**
 * The ending sets of the three productive groups, 51 endings each in cell order (GD §4.3): present, imparfait, passé
 * simple, futur, subjonctif présent, subjonctif imparfait, conditionnel; then imperative 2sg/1pl/2pl, participe présent,
 * the four past participles and the infinitive. The er set keeps the infinitive's er inside the future and conditional
 * endings (lev + erai), so the er spelling rules share one trigger.
 *
 * Generated once from the aimer, finir and rompre tables of \`models.ts\` at commit ${commit} by
 * \`scripts/fr/bootstrap-families.ts\`, and maintained by hand from now on.
 */

export const erEndings: readonly string[] = [
${set('aimer')}
];

export const irEndings: readonly string[] = [
${set('finir')}
];

export const reEndings: readonly string[] = [
${set('rompre')}
];
`;
}

if (import.meta.main) {
  const commit = execSync('git rev-parse --short HEAD', { encoding: 'utf8' }).trim();
  const entries = frenchModels.filter(model => !model.productive).map(extract);
  writeFileSync(new URL('../../src/languages/fr/families.ts', import.meta.url), familiesSource(entries, commit));
  writeFileSync(new URL('../../src/languages/fr/ending-sets.ts', import.meta.url), endingSetsSource(commit));
  console.log(`fr: ${entries.length} families, ${entries.reduce((sum, entry) => sum + entry.paradigms.length, 0)} paradigms`);
}
