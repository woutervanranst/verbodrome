/**
 * The Spanish ending sets (grammar design §4.3) as data, and which set and person a cell takes. Endings carry no tilde:
 * `stress` is the stressed vowel counted in vowel letters from the end of the word, or 'root' when the stem is stressed;
 * the orthography stage writes the tilde from it.
 */
import type { VariantTags } from '../../core/fork.js';
import type { Cell } from '../../core/staged.js';
import { ConjugationError } from '../../errors.js';
import type { SpanishLexeme } from './classify.js';
import type { SpanishRuleId } from './rules.js';

export interface Ending { readonly text: string; readonly stress: number | 'root' }

/** Six endings, singular 1-2-3 then plural 1-2-3, written `text:stress` with R for a root-stressed one. */
function set(spec: string): readonly Ending[] {
  return spec.split(' ').map(item => {
    const [text, stress] = item.split(':') as [string, string];
    return { text, stress: stress === 'R' ? 'root' : Number(stress) };
  });
}

export const endingSets = {
  presentAr: set('o:R as:R a:R amos:2 ais:2 an:R'),
  presentEr: set('o:R es:R e:R emos:2 eis:2 en:R'),
  presentIr: set('o:R es:R e:R imos:2 is:1 en:R'),
  imperfectAr: set('aba:2 abas:2 aba:2 abamos:3 abais:3 aban:2'),
  imperfectErIr: set('ia:2 ias:2 ia:2 iamos:3 iais:3 ian:2'),
  preteriteAr: set('e:1 aste:2 o:1 amos:2 asteis:3 aron:2'),
  preteriteErIr: set('i:1 iste:2 io:1 imos:2 isteis:3 ieron:2'),
  preteriteStrong: set('e:R iste:2 o:R imos:2 isteis:3 ieron:2'),
  future: set('e:1 as:1 a:1 emos:2 eis:2 an:1'),
  conditional: set('ia:2 ias:2 ia:2 iamos:3 iais:3 ian:2'),
  subjunctivePresentAr: set('e:R es:R e:R emos:2 eis:2 en:R'),
  subjunctivePresentErIr: set('a:R as:R a:R amos:2 ais:2 an:R'),
  subjunctiveImperfectRa: set('ra:2 ras:2 ra:2 ramos:3 rais:3 ran:2'),
  subjunctiveImperfectSe: set('se:2 ses:2 se:2 semos:3 seis:3 sen:2'),
  subjunctiveFuture: set('re:2 res:2 re:2 remos:3 reis:3 ren:2'),
} as const;

/** The theme vowel of a conjugation. */
export const themeVowel = { ar: 'a', er: 'e', ir: 'i' } as const;

/** One ending a cell can take, with the tags of its forms. */
export interface EndingChoice { readonly ending: Ending; readonly tags: VariantTags }

/** The endings of a cell and the rule that adds them; `param` says whether the rule names the ending. */
export interface CellEnding {
  readonly choices: readonly EndingChoice[];
  readonly rule: SpanishRuleId;
  readonly named: boolean;
}

type FiniteCell = Extract<Cell, { kind: 'finite' }>;

export function slotOf(cell: { readonly person: 1 | 2 | 3; readonly number: 'singular' | 'plural' }): number {
  return (cell.number === 'plural' ? 3 : 0) + cell.person - 1;
}

/** Whether the strong preterite endings apply: a lexical strong stem, or the -ducir family. */
export function hasStrongPreterite(lexeme: SpanishLexeme): boolean {
  return lexeme.entry.preterite !== undefined || lexeme.family === 'ducir';
}

/** What an imperative cell is built like: the tú form of the present, the vosotros -d form, or the subjunctive. */
export function imperativeSource(cell: FiniteCell): 'tu' | 'vosotros' | 'subjunctive' {
  if (cell.person === 2) return cell.number === 'singular' ? 'tu' : 'vosotros';
  return 'subjunctive';
}

const one = (ending: Ending, tags: VariantTags = {}): readonly EndingChoice[] => [{ ending, tags }];

function finiteEnding(lexeme: SpanishLexeme, cell: FiniteCell): CellEnding {
  const slot = slotOf(cell);
  const pick = (endings: readonly Ending[]): Ending => endings[slot]!;
  const erIr = lexeme.conjugation !== 'ar';
  const present = lexeme.conjugation === 'ar' ? endingSets.presentAr : lexeme.conjugation === 'er' ? endingSets.presentEr : endingSets.presentIr;
  const subjunctive = erIr ? endingSets.subjunctivePresentErIr : endingSets.subjunctivePresentAr;
  switch (`${cell.mood}.${cell.tense}`) {
    case 'indicative.present': return { choices: one(pick(present)), rule: 'es.end.present', named: true };
    case 'indicative.imperfect': return { choices: one(pick(erIr ? endingSets.imperfectErIr : endingSets.imperfectAr)), rule: 'es.end.imperfect', named: true };
    case 'indicative.simple_past': {
      if (hasStrongPreterite(lexeme)) return { choices: one(pick(endingSets.preteriteStrong)), rule: 'es.end.preterite-strong', named: true };
      const er = erIr || lexeme.entry.preteriteConjugation === 'er';
      return { choices: one(pick(er ? endingSets.preteriteErIr : endingSets.preteriteAr)), rule: 'es.end.preterite', named: true };
    }
    case 'indicative.future': return { choices: one(pick(endingSets.future)), rule: 'es.end.future', named: true };
    case 'conditional.present': return { choices: one(pick(endingSets.conditional)), rule: 'es.end.conditional', named: true };
    case 'subjunctive.present': return { choices: one(pick(subjunctive)), rule: 'es.end.subjunctive-present', named: true };
    case 'subjunctive.imperfect': return {
      choices: [{ ending: pick(endingSets.subjunctiveImperfectRa), tags: { pattern: 'ra' } }, { ending: pick(endingSets.subjunctiveImperfectSe), tags: { pattern: 'se' } }],
      rule: 'es.end.subjunctive-imperfect', named: true,
    };
    case 'subjunctive.future': return { choices: one(pick(endingSets.subjunctiveFuture), { usage: 'dated' }), rule: 'es.end.subjunctive-future', named: true };
    case 'imperative.present': {
      const source = imperativeSource(cell);
      if (source === 'tu') return { choices: one(present[2]!), rule: 'es.end.imperative-tu', named: false };
      if (source === 'vosotros') return { choices: one({ text: `${themeVowel[lexeme.conjugation]}d`, stress: 1 }), rule: 'es.end.imperative-vosotros', named: false };
      return { choices: one(pick(subjunctive)), rule: 'es.end.imperative-subjunctive', named: false };
    }
    default: throw new ConjugationError('GENERATION_FAILURE', `No Spanish simple tense ${cell.mood}/${cell.tense}.`);
  }
}

/** The endings of a cell (finite, or the infinitive, gerund and participle). */
export function cellEnding(lexeme: SpanishLexeme, cell: Cell): CellEnding {
  if (cell.kind === 'finite') return finiteEnding(lexeme, cell);
  const ar = lexeme.conjugation === 'ar';
  switch (cell.form) {
    case 'infinitive': return { choices: one({ text: `${themeVowel[lexeme.conjugation]}r`, stress: 1 }), rule: 'es.end.infinitive', named: false };
    case 'gerund': return { choices: one({ text: ar ? 'ando' : 'iendo', stress: 2 }), rule: 'es.end.gerund', named: true };
    case 'participle':
    case 'compound-participle': return { choices: one({ text: ar ? 'ado' : 'ido', stress: 2 }), rule: 'es.end.participle', named: true };
    default: throw new ConjugationError('GENERATION_FAILURE', `No Spanish form ${cell.form}.`);
  }
}

/** Where a cell's ending puts the stress (all of a cell's endings agree on it). */
export function stressOf(lexeme: SpanishLexeme, cell: Cell): number | 'root' {
  return cellEnding(lexeme, cell).choices[0]!.ending.stress;
}

/** Whether the cell is root-stressed (grammar design §4.2, cells R). */
export function isRootStressed(lexeme: SpanishLexeme, cell: Cell): boolean {
  return cell.kind === 'finite' && cell.tense !== 'simple_past' && stressOf(lexeme, cell) === 'root';
}

/** Whether an -ir verb's alternating vowel rises in this cell (§4.2, cells Q: the ending has no stressed i). */
export function isRaisingCell(cell: Cell): boolean {
  if (cell.kind === 'nonFinite') return cell.form === 'gerund';
  const slot = slotOf(cell);
  if (cell.mood === 'indicative' && cell.tense === 'simple_past') return slot === 2 || slot === 5;
  if (cell.mood === 'subjunctive' && cell.tense === 'present') return slot === 3 || slot === 4;
  if (cell.mood === 'imperative') return imperativeSource(cell) === 'subjunctive' && slot === 3;
  return false;
}
