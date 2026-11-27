/**
 * Stems and endings (GD §4.2-4.3). A productive verb takes its group's stem and ending set; a principal part (a `stems`
 * hint, or a family's part) takes the formation endings of the cell it feeds. Every stem and ending records
 * its step; the spelling rules (`orthography.ts`) apply afterwards.
 */
import { step } from '../../core/derivation.js';
import type { DerivationStep, RuleInfo } from '../../core/derivation.js';
import { one } from '../../core/fork.js';
import type { Fork } from '../../core/fork.js';
import type { Cell } from '../../core/staged.js';
import { ConjugationError } from '../../errors.js';
import type { FrenchStemHints } from '../../types.js';
import { cellNames, values } from './family.js';
import type { CellName, FamilyFlags, FamilyParadigm, PrincipalParts, SingularSet, Theme } from './family.js';
import type { FrenchLexeme } from './grammar.js';
import {
  future, groupEndings, imperfect, presentPlural, presentSingular, simplePast, subjunctive, subjunctiveImperfect,
} from './paradigms.js';
import { frenchRules } from './rules.js';

const finiteRows: Readonly<Record<string, number>> = {
  'indicative.present': 0, 'indicative.imperfect': 1, 'indicative.simple_past': 2, 'indicative.future': 3,
  'subjunctive.present': 4, 'subjunctive.imperfect': 5, 'conditional.present': 6,
};

/** The position of a cell in the 51-cell vocabulary (`cellNames`). */
export function cellIndex(cell: Cell): number {
  if (cell.kind === 'nonFinite') {
    if (cell.form === 'infinitive') return 50;
    if (cell.form === 'presentParticiple') return 45;
    return 46 + (cell.agreement?.gender === 'feminine' ? 1 : 0) + (cell.agreement?.number === 'plural' ? 2 : 0);
  }
  const slot = (cell.number === 'plural' ? 3 : 0) + cell.person - 1;
  if (cell.mood === 'imperative') return slot === 1 ? 42 : slot === 3 ? 43 : 44;
  const row = finiteRows[`${cell.mood}.${cell.tense}`];
  if (row === undefined) throw new ConjugationError('GENERATION_FAILURE', `No French cell for ${cell.mood}/${cell.tense}.`);
  return row * 6 + slot;
}

export const cellNameOf = (cell: Cell): CellName => cellNames[cellIndex(cell)]!;

/** The staged cell a cell name stands for (a past participle with its agreement). */
export function cellOfName(name: CellName): Cell {
  const index = cellNames.indexOf(name);
  if (index < 42) {
    const moodTense = Object.entries(finiteRows).find(([, row]) => row === Math.floor(index / 6))![0].split('.');
    const slot = index % 6;
    return { kind: 'finite', mood: moodTense[0]!, tense: moodTense[1]!, person: (slot % 3 + 1) as 1 | 2 | 3, number: slot < 3 ? 'singular' : 'plural' };
  }
  if (index <= 44) {
    const [person, number] = ([[2, 'singular'], [1, 'plural'], [2, 'plural']] as const)[index - 42]!;
    return { kind: 'finite', mood: 'imperative', tense: 'present', person, number };
  }
  if (index === 45) return { kind: 'nonFinite', form: 'presentParticiple' };
  if (index === 50) return { kind: 'nonFinite', form: 'infinitive' };
  const offset = index - 46;
  return { kind: 'nonFinite', form: 'pastParticiple', agreement: { gender: offset % 2 ? 'feminine' : 'masculine', number: offset >= 2 ? 'plural' : 'singular' } };
}

/** A principal part's name, as GD §4.2 writes it. */
export type PartName = 'P1' | 'P2' | 'P3' | 'F' | 'PS' | 'PP' | 'PPF' | 'SJ1' | 'SJ2';

/** The part that feeds a cell (GD §4.2), with the default parts written out. */
export function feedingPart(index: number): PartName | null {
  if (index < 42) {
    const row = Math.floor(index / 6);
    const slot = index % 6;
    switch (row) {
      case 0: return slot < 3 ? 'P1' : slot === 5 ? 'P3' : 'P2';
      case 1: return 'P2';
      case 2: case 5: return 'PS';
      case 3: case 6: return 'F';
      default: return slot === 3 || slot === 4 ? 'SJ2' : 'SJ1';
    }
  }
  if (index === 42) return 'P1';
  if (index <= 45) return 'P2';
  if (index <= 49) return 'PP';
  return null;
}

/** A part with its defaults: P3 is P2, SJ1 is P3, SJ2 is P2. */
export function partValues(parts: PrincipalParts, name: PartName): readonly string[] {
  if (name === 'P3' && parts.P3 === undefined) return values(parts.P2);
  if (name === 'SJ1' && parts.SJ1 === undefined) return partValues(parts, 'P3');
  if (name === 'SJ2' && parts.SJ2 === undefined) return values(parts.P2);
  return values(parts[name]);
}

/** The principal parts a `stems` hint gives (legacy `hintCells`), and the hint each part comes from. */
export interface HintedParts { readonly parts: PrincipalParts; readonly from: Readonly<Partial<Record<PartName, string>>> }

export function hintedParts(hints: FrenchStemHints, group: 'er' | 'ir' | 're' | null): HintedParts {
  const parts: { -readonly [K in keyof PrincipalParts]: PrincipalParts[K] } = {};
  const from: Partial<Record<PartName, string>> = {};
  if (hints.singular) {
    parts.P1 = hints.singular;
    parts.set = group === 'er' ? 'e' : 's';
    from.P1 = 'singular';
  }
  if (hints.plural) {
    parts.P2 = hints.plural;
    from.P2 = 'plural';
  }
  const third = hints.thirdPlural ?? hints.plural;
  if (third) {
    parts.P3 = third;
    from.P3 = hints.thirdPlural ? 'thirdPlural' : 'plural';
  }
  if (hints.future) {
    parts.F = hints.future;
    from.F = 'future';
  }
  if (hints.past) {
    parts.PS = hints.past;
    parts.theme = hints.pastVowel ?? (group === 'er' ? 'a' : 'i');
    from.PS = 'past';
  }
  if (hints.pastParticiple) {
    parts.PP = hints.pastParticiple;
    from.PP = 'pastParticiple';
  }
  return { parts, from };
}

/** The part that feeds `cell` for a hinted lexeme, if its hint gives one (SJ1 and SJ2 follow P3 and P2). */
function hintedPart(lexeme: FrenchLexeme, index: number): { readonly name: PartName; readonly source: PartName } | null {
  if (lexeme.hints === null) return null;
  const name = feedingPart(index);
  if (name === null) return null;
  const source: PartName = name === 'SJ1' ? 'P3' : name === 'SJ2' ? 'P2' : name;
  return Object.hasOwn(hintedParts(lexeme.hints, lexeme.group).from, source) ? { name, source } : null;
}

/** Whether a `stems` hint gives the part that feeds `cell`. */
export const hintedCell = (lexeme: FrenchLexeme, cell: Cell): boolean => hintedPart(lexeme, cellIndex(cell)) !== null;

/** The stem of a productive verb: the infinitive without -er, -ir (-ïr) or -re. */
export const groupStem = (lemma: string): string => lemma.slice(0, -2);

/** The rule an ending of the cell at `index` records. */
function endingRule(index: number) {
  if (index < 42) {
    const row = Math.floor(index / 6);
    if (row === 0) return frenchRules[index % 6 < 3 ? 'fr.end.present-singular' : 'fr.end.present-plural'];
    return frenchRules[(['', 'fr.end.imperfect', 'fr.end.simple-past', 'fr.end.future', 'fr.end.subjunctive', 'fr.end.subjunctive-imperfect', 'fr.end.imperfect'] as const)[row] as 'fr.end.imperfect'];
  }
  if (index <= 44) return frenchRules['fr.end.imperative'];
  if (index === 45) return frenchRules['fr.end.present-participle'];
  if (index <= 49) return frenchRules['fr.end.past-participle'];
  return frenchRules['fr.end.infinitive'];
}

/** The ending step: the stem, then the stem with its ending; none for an empty ending, which changes nothing. */
function endingStep(index: number, stem: string, ending: string): DerivationStep[] {
  if (ending === '') return [];
  const rule = endingRule(index);
  return [step(rule, stem, stem + ending, rule.id === 'fr.end.infinitive' ? {} : { ending })];
}

/** The formation ending of the cell at `index` on a part (GD §4.3), given the part's ending set and theme. */
export function formationEnding(index: number, stem: string, set: SingularSet | undefined, theme: Theme | undefined): string {
  if (index < 42) {
    const row = Math.floor(index / 6);
    const slot = index % 6;
    switch (row) {
      case 0: return slot < 3 ? presentSingular[set ?? 's'][slot]! : presentPlural[slot - 3]!;
      case 1: case 6: return imperfect[slot]!;
      case 2: return simplePast[theme ?? 'i'][slot]!;
      case 3: return future[slot]!;
      case 4: return subjunctive[slot]!;
      default: return subjunctiveImperfect[theme ?? 'i'][slot]!;
    }
  }
  if (index === 42) {
    // The present 2sg, without its s after e or a (aime, cueille, va).
    const present = presentSingular[set ?? 's'][1]!;
    return /[ea]s$/u.test(stem + present) ? present.slice(0, -1) : present;
  }
  if (index === 43) return 'ons';
  if (index === 44) return 'ez';
  if (index === 45) return 'ant';
  const plainStem = stem.replace(/û$/u, 'u');
  if (index === 46) return '';
  if (index === 47) return 'e';
  if (index === 48) return /[sx]$/u.test(plainStem) ? '' : 's';
  return 'es';
}

/** Cells a family's flags rule out (GD §4.7): persons an impersonal or third-person verb lacks, its imperative, and the
 * agreeing forms of an invariable participle. */
export function masked(flags: FamilyFlags, index: number): boolean {
  if (index < 42) {
    const slot = index % 6;
    if (flags.impersonal === 'singular') return slot !== 2;
    if (flags.impersonal === 'figurativePlural' || flags.thirdPersonOnly) return slot !== 2 && slot !== 5;
    return false;
  }
  if (index <= 44) return Boolean(flags.noImperative || flags.impersonal || flags.thirdPersonOnly);
  return index >= 47 && index <= 49 && flags.invariableParticiple === true;
}

/** The infinitive without the letters a family's parts replace: what every part is added to. */
export function familyPrefix(lexeme: FrenchLexeme): string {
  return lexeme.lemma.slice(0, lexeme.lemma.length - lexeme.family!.strip);
}

/** The step a family part records, by the part and whether the family writes it out or takes its default. */
function partRule(parts: PrincipalParts, name: PartName, index: number): RuleInfo {
  switch (name) {
    case 'P1': return frenchRules['fr.stem.present-singular'];
    case 'P2': return frenchRules['fr.stem.nous'];
    case 'P3': return frenchRules['fr.stem.ils'];
    case 'F': return frenchRules['fr.stem.future'];
    case 'PS': return frenchRules['fr.stem.past'];
    case 'PP': return frenchRules['fr.stem.participle'];
    case 'SJ1': return parts.SJ1 !== undefined ? frenchRules['fr.stem.subjunctive'] : frenchRules['fr.stem.ils'];
    default: return parts.SJ2 !== undefined ? frenchRules[index === 45 ? 'fr.stem.participle-from-subjunctive' : 'fr.stem.subjunctive'] : frenchRules['fr.stem.nous'];
  }
}

/** The stems of `values` with the family's prefix, each with the step of the part they come from. */
function partStems(lexeme: FrenchLexeme, stems: readonly string[], rule: RuleInfo, theme?: string): Fork<string> {
  const prefix = familyPrefix(lexeme);
  return stems.flatMap(value => one(prefix + value, [step(rule, lexeme.lemma, prefix + value, rule.id === 'fr.stem.past' ? { theme: theme ?? 'i' } : {})]));
}

/**
 * The imperative series of a family: the ordinary one (present 2sg without its s after e or a, nous and vous of the
 * present), or, for être, avoir, savoir and vouloir, the subjunctive's; with several SJ2 values one series each.
 */
function imperativeSeries(lexeme: FrenchLexeme, index: number): readonly ('regular' | string)[] {
  const { parts } = lexeme.paradigm as FamilyParadigm;
  if (!lexeme.family!.flags.imperativeFromSubjunctive) return ['regular'];
  const nous = partValues(parts, 'P2')[0];
  return partValues(parts, 'SJ2').map(value => value === nous ? 'regular' : index === 42 ? 'subjunctive' : value);
}

/** The stems of a family cell from its principal parts (GD §4.2). A cell the family lacks has none (`availability` says why). */
function familyStems(lexeme: FrenchLexeme, index: number): Fork<string> {
  const family = lexeme.family!;
  const paradigm = lexeme.paradigm as FamilyParadigm;
  const { parts } = paradigm;
  // A cell the family lacks has no stem; `availability` declares such targets, so this is never reached for one.
  if (paradigm.gaps.includes(cellNames[index]!) || masked(family.flags, index)) return [];
  if (index === 50) return one(lexeme.lemma);
  let stems: Fork<string>;
  if (index >= 42 && index <= 44) {
    stems = imperativeSeries(lexeme, index).flatMap(series => {
      if (series === 'regular') {
        const name: PartName = index === 42 ? 'P1' : 'P2';
        return partStems(lexeme, partValues(parts, name), partRule(parts, name, index));
      }
      const values = series === 'subjunctive' ? partValues(parts, 'SJ1') : [series];
      return partStems(lexeme, values, frenchRules['fr.stem.imperative-from-subjunctive']);
    });
  } else if (index === 45 && family.flags.presentParticipleFromSubjunctive) {
    stems = partStems(lexeme, partValues(parts, 'SJ2'), frenchRules['fr.stem.participle-from-subjunctive']);
  } else if (index >= 47 && index <= 49) {
    const feminine = index !== 48 && parts.PPF !== undefined;
    const values = feminine ? partValues(parts, 'PPF') : partValues(parts, 'PP').map(value => value.replace(/û$/u, 'u'));
    stems = partStems(lexeme, values, frenchRules['fr.stem.participle']);
  } else {
    const name = feedingPart(index)!;
    stems = partStems(lexeme, partValues(parts, name), partRule(parts, name, index), parts.theme);
  }
  return stems;
}

/**
 * The stems of a cell (GD §4.2): a hinted part where a `stems` hint gives one, the group stem of a productive verb, or
 * the principal part of a family that feeds the cell.
 */
export function frenchStem(lexeme: FrenchLexeme, cell: Cell): Fork<string> {
  const index = cellIndex(cell);
  const hinted = hintedPart(lexeme, index);
  if (hinted !== null) {
    const { parts, from } = hintedParts(lexeme.hints!, lexeme.group);
    const stems = partValues(parts, hinted.source);
    const plain = index >= 47 && index <= 49 ? stems.map(stem => stem.replace(/û$/u, 'u')) : stems;
    return plain.flatMap(stem => one(stem, [step(frenchRules['fr.stem.hint'], lexeme.lemma, stem, { part: from[hinted.source]! })]));
  }
  if (lexeme.group !== null) {
    const stem = groupStem(lexeme.lemma);
    return one(stem, [step(frenchRules['fr.stem.group-stem'], lexeme.lemma, stem)]);
  }
  if (lexeme.family !== null) return familyStems(lexeme, index);
  // A verb defined by its principal parts has no form the parts do not give, except its infinitive.
  return index === 50 ? one(lexeme.lemma) : [];
}

/** Whether `stem` is a subjunctive stem the imperative 2sg of a family borrows (sache, aie, veuille). */
function subjunctiveImperative(lexeme: FrenchLexeme, stem: string): boolean {
  if (!lexeme.family?.flags.imperativeFromSubjunctive) return false;
  const prefix = familyPrefix(lexeme);
  const { parts } = lexeme.paradigm as FamilyParadigm;
  return partValues(parts, 'SJ1').some(value => prefix + value === stem) && !partValues(parts, 'P1').some(value => prefix + value === stem);
}

/** The ending of a cell on `stem` (GD §4.3): the group's set for a productive stem, the formation endings for a part. */
export function frenchEnding(lexeme: FrenchLexeme, cell: Cell, stem: string): Fork<string> {
  const index = cellIndex(cell);
  const hinted = hintedPart(lexeme, index);
  let ending: string;
  if (hinted !== null) {
    const { parts } = hintedParts(lexeme.hints!, lexeme.group);
    ending = formationEnding(index, stem, parts.set, parts.theme);
  } else if (lexeme.group !== null) {
    ending = groupEndings[lexeme.group][index]!;
  } else if (index === 50) {
    ending = '';
  } else if (lexeme.family !== null) {
    const { parts } = lexeme.paradigm as FamilyParadigm;
    // The subjunctive 2sg without its s after e: sache, aie, veuille.
    ending = index === 42 && subjunctiveImperative(lexeme, stem) ? 'e' : formationEnding(index, stem, parts.set, parts.theme);
  } else {
    return [];
  }
  // The passé simple and the imperfect subjunctive are literary tenses (GD §4.5).
  const literary = (index >= 12 && index < 18) || (index >= 30 && index < 36);
  return one(ending, endingStep(index, stem, ending), literary ? { usage: 'literary' } : {});
}

/**
 * The words of a family cell that no formation rule makes (GD §5.2): its suppletive cells, and the imperative cells
 * that follow a listed present (va, faites, dites) or a listed subjunctive (sois). Null for every other cell.
 */
export function frenchCell(lexeme: FrenchLexeme, cell: Cell): Fork<string> | null {
  if (lexeme.family === null) return null;
  const index = cellIndex(cell);
  if (hintedPart(lexeme, index) !== null) return null;
  const { cells } = lexeme.paradigm as FamilyParadigm;
  const prefix = familyPrefix(lexeme);
  const listed = (words: readonly string[], drop: boolean) => words.flatMap(word => {
    const whole = prefix + (drop && /[ea]s$/u.test(word) ? word.slice(0, -1) : word);
    return one(whole, [step(frenchRules['fr.stem.suppletive'], lexeme.lemma, whole)]);
  });
  const own = cells[cellNames[index]!];
  if (own) return listed(own, false);
  if (index < 42 || index > 44) return null;
  const series = imperativeSeries(lexeme, index);
  const source = cells[(series.every(value => value === 'subjunctive') ? 'subj.2s' : ['pres.2s', 'pres.1p', 'pres.2p'][index - 42]) as CellName];
  if (!source || (series.some(value => value !== 'regular') && !series.every(value => value === 'subjunctive'))) return null;
  return listed(source, index === 42);
}
