import { startCorrection } from '../model.ts';
import type { CorpusCell, CorpusCorrection, CorpusFile } from '../model.ts';

/**
 * An auxiliary the source tabulates for a verb that the Académie does not give it: that table's compound cells are
 * unavailable, and its queries ask the engine without the auxiliary (`languages/fr.ts`).
 */
export const withdrawnAuxiliaries: Readonly<Record<string, { readonly auxiliary: 'avoir' | 'être'; readonly reason: string; readonly source: string }>> = {
  faillir: {
    auxiliary: 'être',
    reason: 'The Académie conjugates faillir with avoir only (ayant failli; its table offers no être), so the source’s être table has no compound forms.',
    source: 'https://www.dictionnaire-academie.fr/conjuguer/A9F0105',
  },
};

/** A compound cell: auxiliary + past participle (the participle perfect included, the past participle itself not). */
export const compound = ({ mood, tense }: CorpusCell['target']): boolean =>
  (['perfect', 'pluperfect', 'past_anterior', 'future_perfect', 'past'].includes(tense) && mood !== 'participle') || (mood === 'participle' && tense === 'perfect');

export function frenchCorrection(file: CorpusFile, cell: CorpusCell, index: number): CorpusCorrection | null {
  const draft = startCorrection(file, cell, index);
  const { mood, tense, person, number } = cell.target;
  const withdrawn = withdrawnAuxiliaries[file.infinitive];
  if (withdrawn && withdrawn.auxiliary === file.auxiliary && compound(cell.target)) draft.markUnavailable(withdrawn.reason, withdrawn.source);
  if (file.infinitive === 'faillir' && mood === 'participle' && tense === 'past' && !draft.unavailable) {
    draft.correctedTarget = { ...cell.target, agreement: null };
    draft.expected = ['failli'];
    draft.note('The Académie: « Le participe passé de ce verbe est toujours invariable » (failli); the source’s agreement headings collapse to one target.',
      'https://www.dictionnaire-academie.fr/conjuguer/A9F0105');
  }
  if (file.infinitive === 'croître' && (compound(cell.target) || (mood === 'participle' && tense === 'past'))) {
    draft.change('The participle of croître is crû, crue, crus, crues: JO 1990 II.4 keeps only the circumflex of crû, and the Académie prints no crûe, crûs, crûes.',
      'https://www.dictionnaire-academie.fr/conjuguer/A9C5057',
      text => text.replace(/(^| )crû(e|s|es)(?= |$)/gu, '$1cru$2'));
  }
  if (['falloir', 'pleuvoir', 'seoir', 'messeoir', 'être', 'dormir', 'plaire', 'pouvoir', 'rire'].includes(file.infinitive) && mood === 'participle' && tense === 'past' && !draft.unavailable) {
    draft.correctedTarget = { ...cell.target, agreement: null };
    draft.note('This invariant verbal participle has no grammatical gender/number inflection; repeated source agreement headings collapse to one applicable target. Adjectival uses are outside scope.',
      `https://www.cnrtl.fr/definition/${encodeURIComponent(file.infinitive)}`);
  }
  if (file.infinitive === 'déchoir' && mood === 'subjunctive' && tense === 'imperfect' && person === 2 && number === 'singular') {
    draft.change('The source substitutes a present-subjunctive cell under the imperfect heading; the past-simple stem gives déchusses.',
      'https://www.cnrtl.fr/definition/d%C3%A9choir',
      text => text.replace('déchoies', 'déchusses'));
  }
  if (file.infinitive === 'clore' && draft.unavailable && (tense === 'near_future' || tense === 'recent_past') && number === 'plural' && (person === 1 || person === 2)) {
    const prefix = person === 1 ? 'nous' : 'vous';
    const phrase = tense === 'near_future' ? `${prefix} ${person === 1 ? 'allons' : 'allez'} clore`
      : `${prefix} ${person === 1 ? 'venons' : 'venez'} de clore`;
    draft.expected = [phrase];
    draft.unavailable = false;
    draft.note('Periphrases conjugate aller/venir, not clore: a defective clore present-plural stem does not suppress its infinitive.',
      'https://www.cnrtl.fr/definition/clore');
  }
  if (['seoir', 'messeoir'].includes(file.infinitive) && ((mood === 'participle' && tense === 'perfect')
    || (mood === 'infinitive' && tense === 'past') || (mood === 'gerund' && tense === 'past'))) {
    draft.markUnavailable('This defective verb exists only in simple forms; the source mechanically inserts an auxiliary before an isolated sis/messis.',
      `https://www.cnrtl.fr/definition/${file.infinitive}`);
  }
  if (file.infinitive === 'messeoir') {
    draft.change('The alternate present participle retains the mes- prefix; seyant alone belongs to seoir.',
      'https://www.cnrtl.fr/definition/messeoir',
      text => text.replace(/(^| )seyant(?= |$)/gu, '$1messeyant'));
  }
  if (file.infinitive === 'pleuvoir' && file.pattern === 'second') {
    draft.change('The figurative plural retains third-group stems: plurent, pleuvront, plussent; the historical table incorrectly analogizes first-group endings.',
      'https://www.cnrtl.fr/definition/pleuvoir',
      text => text.replace(/pleuvèrent/gu, 'plurent').replace(/pleuver/gu, 'pleuvr').replace(/pleuvassent/gu, 'plussent'));
  }
  return draft.finish();
}
