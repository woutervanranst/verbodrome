import type { FrenchStemHints } from '../../types.js';
import type { ModelKind } from './table.js';

const vowelEndings = {
  a: [['ai', 'as', 'a', 'âmes', 'âtes', 'èrent'], ['asse', 'asses', 'ât', 'assions', 'assiez', 'assent']],
  i: [['is', 'is', 'it', 'îmes', 'îtes', 'irent'], ['isse', 'isses', 'ît', 'issions', 'issiez', 'issent']],
  u: [['us', 'us', 'ut', 'ûmes', 'ûtes', 'urent'], ['usse', 'usses', 'ût', 'ussions', 'ussiez', 'ussent']],
  in: [['ins', 'ins', 'int', 'înmes', 'întes', 'inrent'], ['insse', 'insses', 'înt', 'inssions', 'inssiez', 'inssent']],
} as const;
const imperfect = ['ais', 'ais', 'ait', 'ions', 'iez', 'aient'];
const future = ['ai', 'as', 'a', 'ons', 'ez', 'ont'];

/**
 * Builds full forms for the cells that explicit principal-part hints determine.
 * Cell numbers follow the ending-table layout (see table.ts). Cells without a hint
 * are absent, so a known model keeps its own forms for them.
 */
export function hintCells(hints: FrenchStemHints, kind: ModelKind): Map<number, string[]> {
  const cells = new Map<number, string[]>();
  const set = (cell: number, text: string): void => { cells.set(cell, [text]); };
  if (hints.singular) {
    const endings = kind === 'er' ? ['e', 'es', 'e'] : ['s', 's', /[dt]$/u.test(hints.singular) ? '' : 't'];
    endings.forEach((ending, index) => set(index, hints.singular + ending));
    set(42, kind === 'er' ? `${hints.singular}e` : `${hints.singular}s`);
  }
  if (hints.plural) {
    set(3, `${hints.plural}ons`);
    set(4, `${hints.plural}ez`);
    imperfect.forEach((ending, index) => set(6 + index, hints.plural + ending));
    set(27, `${hints.plural}ions`);
    set(28, `${hints.plural}iez`);
    set(43, `${hints.plural}ons`);
    set(44, `${hints.plural}ez`);
    set(45, `${hints.plural}ant`);
  }
  const third = hints.thirdPlural ?? hints.plural;
  if (third && (hints.thirdPlural || hints.plural)) {
    set(5, `${third}ent`);
    [[24, 'e'], [25, 'es'], [26, 'e'], [29, 'ent']].forEach(([cell, ending]) => set(cell as number, third + (ending as string)));
  }
  if (hints.future) {
    future.forEach((ending, index) => set(18 + index, hints.future + ending));
    imperfect.forEach((ending, index) => set(36 + index, hints.future + ending));
  }
  if (hints.past) {
    const vowel = hints.pastVowel ?? (kind === 'er' ? 'a' : 'i');
    const [past, subjunctive] = vowelEndings[vowel];
    past.forEach((ending, index) => set(12 + index, hints.past + ending));
    subjunctive.forEach((ending, index) => set(30 + index, hints.past + ending));
  }
  if (hints.pastParticiple) {
    const participle = hints.pastParticiple;
    const plural = /[sx]$/u.test(participle) ? participle : `${participle}s`;
    set(46, participle);
    set(47, `${participle}e`);
    set(48, plural);
    set(49, `${participle}es`);
  }
  return cells;
}

export function completeHints(hints: FrenchStemHints | undefined): hints is FrenchStemHints {
  return Boolean(hints?.singular && hints.plural && hints.future && hints.past && hints.pastVowel && hints.pastParticiple);
}
