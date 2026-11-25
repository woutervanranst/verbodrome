/**
 * Spanish stems (grammar design §4.2), the endings added to them, and the whole words the lexicon stores. The stem of a
 * cell is the root, the lexicon's stored stem (with the prefix of a derivative in front), or a stem derived from
 * another cell: the present subjunctive from the first person present, the imperfect and future subjunctive from the
 * third person plural preterite. Variant stems (yazc/yazg/yag, erguir's two alternations) are tagged outcomes.
 */
import { step } from '../../core/derivation.js';
import type { DerivationStep } from '../../core/derivation.js';
import { chain, one } from '../../core/fork.js';
import type { Fork, VariantTags } from '../../core/fork.js';
import { applyJunctureRules } from '../../core/juncture.js';
import type { Cell } from '../../core/staged.js';
import type { SpanishLexeme } from './classify.js';
import type { Alternation, Variant } from './lexicon.js';
import { spanishOrthography, withDiacritic } from './orthography.js';
import { cellEnding, imperativeSource, isRaisingCell, isRootStressed, slotOf, themeVowel } from './paradigms.js';
import { spanishRules as rules } from './rules.js';
import { nuclei, stripAccents, writeAccent } from './syllables.js';

type FiniteCell = Extract<Cell, { kind: 'finite' }>;

/** A lexical value as tagged variants; a single value carries no tag. */
function variantsOf<T>(value: T | readonly Variant<T>[]): readonly { value: T; tags: VariantTags }[] {
  if (!Array.isArray(value)) return [{ value: value as T, tags: {} }];
  return (value as readonly Variant<T>[]).map(variant => ({
    value: variant.value,
    tags: {
      pattern: variant.pattern,
      ...(variant.usage === undefined ? {} : { usage: variant.usage }),
      ...(variant.region === undefined ? {} : { region: variant.region }),
      ...(variant.condition === undefined ? {} : { condition: variant.condition }),
    },
  }));
}

/** Each stored stem with the derivative's prefix and the step that names it. */
function stored(lexeme: SpanishLexeme, value: string | readonly Variant<string>[], make: (stem: string) => DerivationStep): Fork<string> {
  return variantsOf(value).map(({ value: stem, tags }) => ({ value: lexeme.prefix + stem, steps: [make(lexeme.prefix + stem)], tags }));
}

/** The root of the derived forms: the infinitive minus -ar/-er/-ir, or the lexicon's root (podrir: pudr-). */
export function rootOf(lexeme: SpanishLexeme): Fork<string> {
  if (lexeme.entry.root !== undefined) return one(lexeme.root, [step(rules['es.stem.lexical'], lexeme.infinitive, lexeme.root, { stem: lexeme.root })]);
  return infinitiveRoot(lexeme);
}

/** The infinitive minus its ending, which the infinitive and the participle are built on. */
function infinitiveRoot(lexeme: SpanishLexeme): Fork<string> {
  const root = lexeme.infinitive.slice(0, -2);
  return one(root, [step(rules['es.stem.root'], lexeme.infinitive, root, { ending: `-${lexeme.conjugation}` })]);
}

const diphthongs: Readonly<Record<Exclude<Alternation, 'e-i'>, readonly [string, string]>> = {
  'e-ie': ['e', 'ie'], 'o-ue': ['o', 'ue'], 'u-ue': ['u', 'ue'], 'i-ie': ['i', 'ie'],
};

/** `text` with the last `from` replaced by `to`. */
function replaceLast(text: string, from: string, to: string): string {
  const at = text.lastIndexOf(from);
  return at < 0 ? text : text.slice(0, at) + to + text.slice(at + from.length);
}

/** The stem-vowel alternation in a root-stressed cell, or the raising of an -ir verb's vowel where the ending has no stressed i. */
function alternated(lexeme: SpanishLexeme, cell: Cell, stem: string): Fork<string> {
  const { alternation } = lexeme;
  if (alternation === null) return one(stem);
  const options = variantsOf<Alternation>(alternation);
  if (isRootStressed(lexeme, cell)) {
    const outcomes = options.map(({ value, tags }) => {
      if (value === 'e-i') {
        const changed = replaceLast(stem, 'e', 'i');
        return { value: changed, steps: [step(rules['es.stem.e-i'], stem, changed)], tags };
      }
      const [from, to] = diphthongs[value];
      const changed = replaceLast(stem, from, to);
      return { value: changed, steps: [step(rules['es.stem.diphthong'], stem, changed, { from, to })], tags };
    });
    return outcomes.length === 1 ? [{ ...outcomes[0]!, tags: {} }] : outcomes;
  }
  if (lexeme.raising && isRaisingCell(cell)) {
    // Every alternation of an -ir verb with raising rises the same way, so the variants agree here.
    const [from, to] = options[0]!.value === 'o-ue' ? ['o', 'u'] : ['e', 'i'];
    const changed = replaceLast(stem, from, to);
    return one(changed, [step(rules['es.stem.raising'], stem, changed, { from, to })]);
  }
  return one(stem);
}

/** The first letter of the cell's ending. */
const endingStart = (lexeme: SpanishLexeme, cell: Cell): string => cellEnding(lexeme, cell).choices[0]!.ending.text.charAt(0);

/** zc after a vowel and y after the u of -uir, before an ending that starts with a / o (zc) or a / e / o (y). */
function consonantInsertions(lexeme: SpanishLexeme, cell: Cell, root: string): Fork<string> {
  const start = endingStart(lexeme, cell);
  if (lexeme.zc && /[aeiou]c$/u.test(root) && /[ao]/u.test(start)) {
    const changed = `${root.slice(0, -1)}zc`;
    return one(changed, [step(rules['es.stem.zc'], root, changed)]);
  }
  if (lexeme.yInsertion && /[aeo]/u.test(start)) return one(`${root}y`, [step(rules['es.stem.y-insertion'], root, `${root}y`)]);
  return one(root);
}

const presentCell = (person: FiniteCell['person'], number: FiniteCell['number'], mood: 'indicative' | 'subjunctive'): FiniteCell =>
  ({ kind: 'finite', mood, tense: 'present', person, number });

/** The stem of a present indicative cell. */
function presentStem(lexeme: SpanishLexeme, cell: FiniteCell): Fork<string> {
  const { present1 } = lexeme.entry;
  if (slotOf(cell) === 0 && present1 !== undefined) {
    return stored(lexeme, present1, stem => step(rules['es.stem.present-1sg'], lexeme.infinitive, stem, { stem }));
  }
  return chain(rootOf(lexeme), root => chain(consonantInsertions(lexeme, cell, root), stem => alternated(lexeme, cell, stem)));
}

/** The stem of a present subjunctive cell: the lexicon's, the first person's (teng-, conozc-), or the root. */
function subjunctiveStem(lexeme: SpanishLexeme, cell: FiniteCell): Fork<string> {
  const { entry } = lexeme;
  if (entry.subjunctive !== undefined) {
    return stored(lexeme, entry.subjunctive, stem => step(rules['es.stem.lexical'], lexeme.infinitive, stem, { stem }));
  }
  const fromFirst = (stem: string) => step(rules['es.stem.subjunctive-from-1sg'], lexeme.infinitive, stem, { stem });
  if (entry.present1 !== undefined) return stored(lexeme, entry.present1, fromFirst);
  return chain(rootOf(lexeme), root => chain(consonantInsertions(lexeme, cell, root), stem =>
    stem.endsWith('zc') ? one(stem, [fromFirst(stem)]) : alternated(lexeme, cell, stem)));
}

/** The third person plural preterite without -ron (amaron → ama-), the base of the imperfect and future subjunctive. */
function preteriteBase(lexeme: SpanishLexeme): Fork<string> {
  const thirdPlural: FiniteCell = { kind: 'finite', mood: 'indicative', tense: 'simple_past', person: 3, number: 'plural' };
  return chain(synthesizeWord(lexeme, thirdPlural), word => {
    const base = word.slice(0, -3);
    return one(base, [step(rules['es.stem.preterite-3pl'], word, base, { base })]);
  });
}

/** The stems of a cell (grammar design §4.2). */
export function stemFork(lexeme: SpanishLexeme, cell: Cell): Fork<string> {
  const { entry } = lexeme;
  if (cell.kind === 'nonFinite') {
    if (cell.form === 'gerund') return chain(rootOf(lexeme), root => alternated(lexeme, cell, root));
    return infinitiveRoot(lexeme);
  }
  switch (`${cell.mood}.${cell.tense}`) {
    case 'indicative.present': return presentStem(lexeme, cell);
    case 'subjunctive.present': return subjunctiveStem(lexeme, cell);
    case 'imperative.present': {
      const source = imperativeSource(cell);
      if (source === 'tu') return presentStem(lexeme, presentCell(3, 'singular', 'indicative'));
      if (source === 'vosotros') return rootOf(lexeme);
      return subjunctiveStem(lexeme, presentCell(cell.person, cell.number, 'subjunctive'));
    }
    case 'indicative.imperfect':
      return entry.imperfect === undefined ? rootOf(lexeme)
        : stored(lexeme, entry.imperfect, stem => step(rules['es.stem.lexical'], lexeme.infinitive, stem, { stem }));
    case 'indicative.simple_past':
      if (entry.preterite !== undefined) {
        return stored(lexeme, entry.preterite, stem => step(rules['es.stem.strong-preterite'], lexeme.infinitive, stem, { stem }));
      }
      if (lexeme.family === 'ducir') {
        return chain(rootOf(lexeme), root => one(`${root.slice(0, -1)}j`, [step(rules['es.stem.ducir-preterite'], root, `${root.slice(0, -1)}j`)]));
      }
      return chain(rootOf(lexeme), root => alternated(lexeme, cell, root));
    case 'indicative.future':
    case 'conditional.present': {
      if (entry.future !== undefined) {
        return stored(lexeme, entry.future, stem => step(rules['es.stem.future-lexical'], lexeme.infinitive, stem, { stem }));
      }
      // The whole infinitive, without the tilde of -eír / -oír (reiré), on the lexicon's root where it has one (pudrir-).
      const stem = `${lexeme.root}${themeVowel[lexeme.conjugation]}r`;
      return one(stem, [step(rules['es.stem.future-infinitive'], lexeme.infinitive, stem)]);
    }
    case 'subjunctive.imperfect':
    case 'subjunctive.future':
      return preteriteBase(lexeme);
    default: return rootOf(lexeme);
  }
}

/** The endings to add to `stem` (grammar design §4.3); the steps record the stem and the stem plus the ending. */
export function endingFork(lexeme: SpanishLexeme, cell: Cell, stem: string): Fork<string> {
  const { choices, rule, named } = cellEnding(lexeme, cell);
  return choices.map(({ ending, tags }) => ({
    value: ending.text,
    steps: [step(rules[rule], stem, stem + ending.text, named ? { ending: ending.text } : {})],
    tags,
  }));
}

/** The stressed vowel of a stored whole word: its tilde, or the default stress of its letters. */
function storedStress(word: string): number {
  const accented = [...word].findIndex(letter => /[áéíóú]/u.test(letter));
  if (accented >= 0) return accented;
  const plain = stripAccents(word);
  const groups = nuclei(plain, -1);
  const vowelOrNs = /[aeiou]$/u.test(plain) || /[aeiou][ns]$/u.test(plain);
  const group = groups[groups.length - (vowelOrNs && groups.length > 1 ? 2 : 1)]!;
  return group.find(index => /[aeo]/u.test(plain[index]!)) ?? group.at(-1)!;
}

/**
 * A stored whole word of the base with the derivative's prefix in front, written with the tilde its stress calls for
 * (compón, detén); the stress stays on the base's syllable.
 */
function prefixed(lexeme: SpanishLexeme, word: string): { word: string; steps: DerivationStep[] } {
  if (lexeme.prefix === '') return { word, steps: [] };
  const whole = lexeme.prefix + stripAccents(word);
  const accent = writeAccent(whole, lexeme.prefix.length + storedStress(word));
  if (accent.written === whole) return { word: whole, steps: [] };
  const rule = accent.kind === 'hiatus' ? step(rules['es.orth.accent-hiatus'], whole, accent.written)
    : step(rules['es.orth.accent-general'], whole, accent.written, { stress: accent.stress });
  return { word: accent.written, steps: [rule] };
}

/** One lexical whole word: the prefix, the tilde, the diacritic tilde, each with its step after the lexical one. */
function lexicalWords(lexeme: SpanishLexeme, value: string | readonly Variant<string>[], rule: 'es.cell.lexical' | 'es.cell.imperative-short' | 'es.cell.participle' | 'es.cell.gerund'): Fork<string> {
  return variantsOf(value).map(({ value: word, tags }) => {
    const form = lexeme.prefix === '' ? word : lexeme.prefix + stripAccents(word);
    const withPrefix = prefixed(lexeme, word);
    const marked = withDiacritic(lexeme, withPrefix.word);
    return { value: marked.word, steps: [step(rules[rule], lexeme.lemma, form, { form }), ...withPrefix.steps, ...marked.steps], tags };
  });
}

/** The key of a finite cell in `entry.cells`. */
const cellKey = (cell: FiniteCell): string => `${cell.mood}.${cell.tense}.${cell.person}${cell.number === 'singular' ? 'sg' : 'pl'}`;

/** The whole word the lexicon stores for a cell (grammar design §4.2, `es.cell.*`), or null to derive it. */
export function lexicalCell(lexeme: SpanishLexeme, cell: Cell): Fork<string> | null {
  const { entry } = lexeme;
  if (cell.kind === 'finite') {
    const listed = entry.cells?.[cellKey(cell)];
    if (listed !== undefined) return lexicalWords(lexeme, listed, 'es.cell.lexical');
    if (cell.mood === 'imperative' && imperativeSource(cell) === 'tu' && entry.imperative2sg !== undefined) {
      return lexicalWords(lexeme, entry.imperative2sg, 'es.cell.imperative-short');
    }
    return null;
  }
  if (cell.form === 'gerund' && entry.gerund !== undefined) return lexicalWords(lexeme, entry.gerund, 'es.cell.gerund');
  if ((cell.form === 'participle' || cell.form === 'compound-participle') && entry.participle !== undefined) {
    const { participle } = entry;
    const kept = typeof participle === 'string' ? participle
      : participle.filter(variant => cell.form === 'participle' || variant.compound !== false);
    // Tags tell the two participles of a doublet apart; a single participle has none.
    const single = typeof kept === 'string' ? kept : kept.length === 1 ? kept[0]!.value : kept;
    return lexicalWords(lexeme, single, 'es.cell.participle');
  }
  return null;
}

/** One word of a cell as the grammar builds it: the lexical word, or stem + ending + spelling. */
export function synthesizeWord(lexeme: SpanishLexeme, cell: Cell): Fork<string> {
  const lexical = lexicalCell(lexeme, cell);
  if (lexical !== null) return lexical;
  return chain(stemFork(lexeme, cell), stem => chain(endingFork(lexeme, cell, stem), ending =>
    chain(applyJunctureRules(spanishOrthography, { stem, ending }, { lexeme, cell }), spelled => one(spelled.stem + spelled.ending))));
}
