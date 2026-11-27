/**
 * German stems (GD §4.2): the present stem of the infinitive, the listed stems (du/er stem, Präteritum, Konjunktiv II,
 * Partizip II) and the rules that derive the others (Konjunktiv II by Umlaut, the i-stem of the du-imperative, ge-).
 * The `cell` hook gives the whole words the lexicon lists.
 */
import { step } from '../../core/derivation.js';
import type { DerivationStep } from '../../core/derivation.js';
import { one } from '../../core/fork.js';
import type { Fork, VariantTags } from '../../core/fork.js';
import type { Cell } from '../../core/staged.js';
import type { GermanLexeme } from './classify.js';
import type { Alternate, CellKey, SlotKey } from './lexicon.js';
import { germanRules as rules } from './rules.js';

export type FiniteCell = Extract<Cell, { kind: 'finite' }>;

/** The -el / -er subclass: sammeln, wandern, feiern (not lernen, not -ieren). */
export const isElEr = (base: string): boolean => base.length > 4 && /[^e]e[lr]n$/u.test(base);

/** The infinitive minus -en, or minus -n after -el, -er, -ie and a vowel: fahr, sammel, knie, tu, sei. */
export function presentStem(base: string): string {
  if (isElEr(base) || /[^e]ien$/u.test(base) || !base.endsWith('en')) return base.slice(0, -1);
  return base.slice(0, -2);
}

export const slotOf = (cell: FiniteCell): SlotKey => `${cell.person}${cell.number === 'singular' ? 'sg' : 'pl'}` as SlotKey;
export const indexOf = (cell: FiniteCell): number => (cell.number === 'plural' ? 3 : 0) + cell.person - 1;

const alternates = (value: string | readonly Alternate[]): readonly Alternate[] => typeof value === 'string' ? [{ text: value }] : value;
const tagsOf = ({ usage, pattern }: Alternate): VariantTags => ({ ...(usage === undefined ? {} : { usage }), ...(pattern === undefined ? {} : { pattern }) });

/** The step that says a listed form rests on Duden only (none for a form DWDS prints). */
export const dudenOnly = (item: Alternate, base: string): DerivationStep[] =>
  item.source === 'duden' ? [step(rules['de.stem.duden-only'], base, item.text)] : [];

/** The Präteritum stems of a verb with an entry, each with whether it takes the weak -te. */
export function preteriteStems(lexeme: GermanLexeme): readonly { readonly stem: Alternate; readonly weak: boolean }[] {
  const entry = lexeme.entry!;
  const weakClass = lexeme.conjugation === 'mixed' || lexeme.conjugation === 'preteritePresent'
    || (lexeme.conjugation === 'irregular' && alternates(entry.participle)[0]!.text.endsWith('t'));
  return alternates(entry.preterite).map(stem => ({ stem, weak: weakClass || stem.pattern === 'weak' }));
}

/** Whether `stem` takes the weak Präteritum endings (-te…) in this lexeme: a weak verb's, or a weak listed Präteritum. */
export function takesWeakPreterite(lexeme: GermanLexeme, stem: string): boolean {
  if (lexeme.entry === null) return true;
  return preteriteStems(lexeme).some(item => item.weak && item.stem.text === stem);
}

/** The vowel change of the du/er stem gives the du-imperative its i-stem: geb → gib, nehm → nimm (not fahr → fähr). */
export function iStem(stem: string, present2: string): boolean {
  let start = 0;
  while (start < stem.length && stem[start] === present2[start]) start++;
  return /i/u.test(present2.slice(start)) && !/i/u.test(stem.slice(start)) && start < present2.length;
}

const UMLAUT: Readonly<Record<string, string>> = { a: 'ä', o: 'ö', u: 'ü' };

/** The Umlaut of the last a, o, u or au of `stem`: fuhr → führ, lief → lief (none to change). */
export function umlaut(stem: string): string {
  const match = /(au|[aou])([^aeiouäöüy]*)$/u.exec(stem);
  if (!match || /[aeiouäöüy]/u.test(stem.slice(match.index + match[1]!.length))) return stem;
  const vowel = match[1] === 'au' ? 'äu' : UMLAUT[match[1]!]!;
  return stem.slice(0, match.index) + vowel + match[2];
}

/** One Partizip II of a lexeme: its stem with or without ge-, its ending, the steps and tags that made it. */
export interface ParticiplePart { readonly stem: string; readonly ending: 'en' | 'n' | 't'; readonly steps: readonly DerivationStep[]; readonly tags: VariantTags }

function geSteps(lexeme: GermanLexeme, core: string): { readonly stem: string; readonly steps: DerivationStep[] } {
  if (lexeme.geBlocked === 'prefix') return { stem: core, steps: [step(rules['de.stem.ge-blocked-prefix'], core, core, { prefix: lexeme.prefix! })] };
  if (lexeme.geBlocked === 'stress') return { stem: core, steps: [step(rules['de.stem.ge-blocked-stress'], core, core)] };
  if (lexeme.particle !== null) {
    return { stem: `ge${core}`, steps: [step(rules['de.stem.ge-after-particle'], core, `ge${core}`, { particle: lexeme.particle.text })] };
  }
  return { stem: `ge${core}`, steps: [step(rules['de.stem.ge-prefix'], core, `ge${core}`)] };
}

/** The Partizip II stems of a lexeme: the present stem of a weak verb, or the listed Partizip II without ge- and ending. */
export function participleParts(lexeme: GermanLexeme): readonly ParticiplePart[] {
  if (lexeme.entry === null) {
    const stem = presentStem(lexeme.base);
    const base = step(rules['de.stem.present'], lexeme.base, stem);
    const { stem: withGe, steps } = geSteps(lexeme, stem);
    const parts: ParticiplePart[] = [{ stem: withGe, ending: 't', steps: [base, ...steps], tags: {} }];
    if (lexeme.participleWithGe !== null) {
      parts.push({ stem: `ge${stem}`, ending: 't', steps: [base, step(rules['de.stem.ge-prefix'], stem, `ge${stem}`)], tags: { pattern: 'alternate' } });
    }
    return parts;
  }
  return alternates(lexeme.entry.participle).map(item => {
    const text = item.text;
    const ending: ParticiplePart['ending'] = /[^e]ien$/u.test(text) || text.endsWith('en') ? 'en' : text.endsWith('n') ? 'n' : 't';
    const withoutEnding = /[^e]ien$/u.test(text) ? text.slice(0, -1) : text.slice(0, -ending.length);
    // A listed Partizip II has ge- unless the verb has a prefix; the rule puts it back.
    const core = lexeme.prefix === null && withoutEnding.startsWith('ge') ? withoutEnding.slice(2) : withoutEnding;
    const { stem, steps } = geSteps(lexeme, core);
    return { stem, ending, steps: [step(rules['de.stem.participle'], lexeme.base, core), ...steps], tags: tagsOf(item) };
  });
}

/** The listed whole words of a cell (sein → bin, the du-imperative sieh / siehe), or null to derive it. */
export function germanCell(lexeme: GermanLexeme, cell: Cell): Fork<string> | null {
  if (cell.kind !== 'finite' || lexeme.entry === null) return null;
  const key = `${cell.mood}.${cell.tense}.${slotOf(cell)}` as CellKey;
  const listed = lexeme.entry.cells?.[key] ?? (key === 'imperative.present.2sg' ? lexeme.entry.imperative : undefined);
  if (listed === undefined) return null;
  return listed.flatMap(item => one(item.text, [step(rules['de.stem.lexical-cell'], lexeme.base, item.text), ...dudenOnly(item, lexeme.base)], tagsOf(item)));
}

/** The stems of a cell. */
export function germanStem(lexeme: GermanLexeme, cell: Cell): Fork<string> {
  const stem = presentStem(lexeme.base);
  const present = step(rules['de.stem.present'], lexeme.base, stem);
  if (cell.kind === 'nonFinite') {
    if (cell.form === 'pastParticiple') {
      // Two listed participles with one stem (gesalzen, gesalzt) are one stem here; the ending stage gives both endings.
      const parts = participleParts(lexeme);
      return parts.filter((part, index) => parts.findIndex(other => other.stem === part.stem) === index)
        .map(part => ({ value: part.stem, steps: part.steps, tags: part.tags }));
    }
    return one(stem, [present]);
  }
  const entry = lexeme.entry;
  // A listed stem equal to the derived one changes nothing: it records no step of its own (gebären: er gebärt).
  const listed = (rule: keyof typeof rules, from: string, items: readonly Alternate[], before: readonly DerivationStep[] = [present]): Fork<string> =>
    items.flatMap(item => one(item.text, item.text === from ? [...before] : [...before, step(rules[rule], from, item.text)], tagsOf(item)));
  if (cell.mood === 'indicative' && cell.tense === 'present') {
    if (entry === null || cell.number === 'plural' || cell.person === 1 && lexeme.conjugation !== 'preteritePresent') return one(stem, [present]);
    if (lexeme.conjugation === 'preteritePresent') return listed('de.stem.present-singular', stem, [{ text: entry.presentSingular! }]);
    return entry.present2 === undefined ? one(stem, [present]) : listed('de.stem.present2', stem, alternates(entry.present2));
  }
  if (cell.mood === 'indicative' && cell.tense === 'past') {
    if (entry === null) return one(stem, [present]);
    return preteriteStems(lexeme).flatMap(({ stem: item }) => one(item.text, [step(rules['de.stem.preterite'], lexeme.base, item.text)], tagsOf(item)));
  }
  if (cell.mood === 'subjunctive' && cell.tense === 'past') return subjunctiveStems(lexeme, stem, present);
  if (cell.mood === 'imperative' && cell.person === 2 && cell.number === 'singular' && entry?.present2 !== undefined) {
    const changed = alternates(entry.present2)[0]!.text;
    if (lexeme.root !== 'werden' && iStem(stem, changed)) return one(changed, [present, step(rules['de.stem.imperative-i'], stem, changed)]);
  }
  return one(stem, [present]);
}

/** Konjunktiv II: the weak verb's Präteritum, a listed stem, or the Präteritum stem with Umlaut. */
function subjunctiveStems(lexeme: GermanLexeme, stem: string, present: DerivationStep): Fork<string> {
  const entry = lexeme.entry;
  if (entry === null) return one(stem, [present, step(rules['de.stem.subjunctive-weak'], lexeme.base, stem)]);
  if (entry.subjunctive !== undefined) {
    return entry.subjunctive.flatMap(item => one(item.text, [step(rules['de.stem.subjunctive-lexical'], lexeme.base, item.text), ...dudenOnly(item, lexeme.base)], tagsOf(item)));
  }
  return preteriteStems(lexeme).flatMap(({ stem: item, weak }) => {
    const preterite = step(rules['de.stem.preterite'], lexeme.base, item.text);
    if (weak) return one(item.text, [preterite, step(rules['de.stem.subjunctive-weak'], lexeme.base, item.text)], tagsOf(item));
    const changed = umlaut(item.text);
    const rule = changed === item.text ? rules['de.stem.subjunctive-plain'] : rules['de.stem.subjunctive-umlaut'];
    return one(changed, [preterite, step(rule, item.text, changed)], tagsOf(item));
  });
}
