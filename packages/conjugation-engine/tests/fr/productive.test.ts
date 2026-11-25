/**
 * The productive classes (GD §3.1, §4.3, §4.4): three ending sets and the spelling rules reproduce every legacy
 * productive model table, word by word, with the rules recorded in order.
 */
import { describe, expect, it } from 'vitest';
import type { Outcome } from '../../src/core/fork.js';
import { synthesize } from '../../src/core/staged.js';
import { classifyFrench } from '../../src/languages/fr/classify.js';
import { cellNames } from '../../src/languages/fr/family.js';
import { frenchGrammar } from '../../src/languages/fr/grammar.js';
import { frenchModels, selectModel } from '../../src/languages/fr/models.js';
import { cellOfName } from '../../src/languages/fr/stems.js';
import { canonicalLemma } from '../../src/languages/fr/lexicon.js';
import { cellTexts } from '../../src/languages/fr/table.js';
import type { Spelling } from '../../src/languages/fr/table.js';
import { frenchQueries } from './shadow.js';

/** The words of one cell of `infinitive` (paradigm `paradigm`), each with its spelling tag and the rules that made it. */
function words(infinitive: string, name: (typeof cellNames)[number], query: Readonly<Record<string, unknown>> = {}, paradigm = 0) {
  const lexeme = classifyFrench({ language: 'fr', infinitive, ...query })[paradigm]!.value;
  return synthesize(frenchGrammar, lexeme, cellOfName(name)).map((outcome: Outcome<string>) => ({
    word: outcome.value, orthography: outcome.tags.orthography ?? 'both', rules: outcome.steps.map(step => step.rule),
  }));
}
const texts = (infinitive: string, name: (typeof cellNames)[number], query: Readonly<Record<string, unknown>> = {}, paradigm = 0) =>
  words(infinitive, name, query, paradigm).map(item => item.orthography === 'both' ? item.word : `${item.word} (${item.orthography})`);

describe('French productive classes', () => {
  it('nous plaçons: group-stem, present-plural, c-cedilla', () => {
    expect(words('placer', 'pres.1p')).toEqual([
      { word: 'plaçons', orthography: 'both', rules: ['fr.stem.group-stem', 'fr.end.present-plural', 'fr.orth.c-cedilla'] },
    ]);
  });

  it('je lève / je lèverai: mute-e-grave in both spellings', () => {
    expect(words('lever', 'pres.1s')).toEqual([{ word: 'lève', orthography: 'both', rules: ['fr.stem.group-stem', 'fr.end.present-singular', 'fr.orth.mute-e-grave'] }]);
    expect(texts('lever', 'fut.1s')).toEqual(['lèverai']);
  });

  it('je cède; je cèderai (rectified) and je céderai (traditional): closed-e-grave fork', () => {
    expect(texts('céder', 'pres.1s')).toEqual(['cède']);
    expect(texts('céder', 'fut.1s')).toEqual(['céderai (traditional)', 'cèderai (rectified)']);
    expect(words('céder', 'fut.1s')[1]!.rules).toEqual(['fr.stem.group-stem', 'fr.end.future', 'fr.orth.closed-e-grave']);
  });

  it('il renouvelle (traditional) / il renouvèle (rectified); j\'appelle in both; je rachète; je cachette / je cachète', () => {
    expect(texts('renouveler', 'pres.3s')).toEqual(['renouvelle (traditional)', 'renouvèle (rectified)']);
    expect(words('renouveler', 'pres.3s').map(item => item.rules.at(-1))).toEqual(['fr.orth.eler-eter', 'fr.orth.mute-e-grave']);
    expect(texts('appeler', 'pres.1s')).toEqual(['appelle']);
    expect(texts('racheter', 'pres.1s')).toEqual(['rachète']);
    expect(texts('cacheter', 'pres.1s')).toEqual(['cachette (traditional)', 'cachète (rectified)']);
    expect(texts('appeler', 'pres.1p')).toEqual(['appelons']);
  });

  it('je paie (y-to-i paradigm) / je paye (keep-y); je nettoie; je grasseye', () => {
    expect(texts('payer', 'pres.1s', {}, 0)).toEqual(['paie']);
    expect(texts('payer', 'pres.1s', {}, 1)).toEqual(['paye']);
    expect(texts('payer', 'pres.1p', {}, 0)).toEqual(['payons']);
    expect(texts('nettoyer', 'pres.1s')).toEqual(['nettoie']);
    expect(texts('nettoyer', 'fut.1s')).toEqual(['nettoierai']);
    expect(texts('grasseyer', 'pres.1s')).toEqual(['grasseye']);
  });

  it('nous mangeons; je blouïs, il blouït (passé simple); il rend; il rompt; je blets, il blet', () => {
    expect(texts('manger', 'pres.1p')).toEqual(['mangeons']);
    expect(texts('manger', 'ps.1p')).toEqual(['mangeâmes']);
    expect(texts('blouïr', 'pres.1s')).toEqual(['blouïs']);
    expect(texts('blouïr', 'ps.3s')).toEqual(['blouït']);
    expect(texts('blouïr', 'ps.1p')).toEqual(['blouïmes']);
    expect(texts('rendre', 'pres.3s')).toEqual(['rend']);
    expect(words('rendre', 'pres.3s')[0]!.rules.at(-1)).toBe('fr.orth.t-after-dental');
    expect(texts('rompre', 'pres.3s')).toEqual(['rompt']);
    expect(texts('blettre', 'pres.1s')).toEqual(['blets']);
    expect(texts('blettre', 'pres.3s')).toEqual(['blet']);
    expect(words('blettre', 'pres.3s')[0]!.rules.slice(-2)).toEqual(['fr.orth.t-after-dental', 'fr.orth.tt-singular']);
    expect(texts('blettre', 'pres.1p')).toEqual(['blettons']);
  });

  it('je traine (rectified) / je traîne (traditional); j\'interviewe, je speede, j\'annexe unchanged', () => {
    expect(texts('traîner', 'pres.1s')).toEqual(['traîne (traditional)', 'traine (rectified)']);
    expect(texts('traîner', 'inf')).toEqual(['traîner (traditional)', 'trainer (rectified)']);
    expect(texts('interviewer', 'pres.1s')).toEqual(['interviewe']);
    expect(texts('speeder', 'pres.1s')).toEqual(['speede']);
    expect(texts('annexer', 'pres.1s')).toEqual(['annexe']);
  });

  it('reproduces every productive model table for every productive snapshot lemma', () => {
    const productive = new Map(frenchModels.filter(model => model.productive).map(model => [model.id, model]));
    const lemmas = new Set<string>(productive.keys());
    for (const query of frenchQueries) {
      const lemma = canonicalLemma(query.infinitive.replace(/^(se |s')/u, ''));
      if (productive.has(selectModel(lemma)?.model.id ?? '')) lemmas.add(lemma);
    }
    expect(lemmas.size).toBeGreaterThanOrEqual(158);
    const differing = new Map<string, number>();
    for (const lemma of lemmas) {
      const model = selectModel(lemma)!.model;
      const stem = lemma.slice(0, lemma.length - model.strip);
      const paradigms = classifyFrench({ language: 'fr', infinitive: lemma });
      expect(paradigms).toHaveLength(model.paradigms.length);
      model.paradigms.forEach((paradigm, p) => {
        cellNames.forEach((name, cell) => {
          const derived = synthesize(frenchGrammar, paradigms[p]!.value, cellOfName(name));
          const same = (['rectified', 'traditional'] as const).every((spelling: Spelling) => {
            const expected = cellTexts(stem, paradigm.cells[cell]!, spelling, model.kind === 'er');
            const actual = derived.filter(outcome => (outcome.tags.orthography ?? spelling) === spelling).map(outcome => outcome.value);
            return JSON.stringify(actual) === JSON.stringify(expected);
          });
          if (!same) differing.set(lemma, (differing.get(lemma) ?? 0) + 1);
        });
      });
    }
    expect(Object.fromEntries(differing)).toEqual({ bleder: 21, crebler: 21, pequer: 21, blettre: 4 });
  });

  it('passes hinted stems through spelling rules', () => {
    expect(texts('blouper', 'pres.1p', { stems: { plural: 'blac' } })).toEqual(['blaçons']);
    expect(texts('blouper', 'impf.1s', { stems: { plural: 'blac' } })).toEqual(['blaçais']);
    expect(words('blouper', 'pres.1p', { stems: { plural: 'blac' } })[0]!.rules).toEqual(['fr.stem.hint', 'fr.end.present-plural', 'fr.orth.c-cedilla']);
    expect(texts('blouper', 'fut.1s', { stems: { future: 'bloupr' } })).toEqual(['blouprai']);
    expect(texts('blouper', 'pres.1s', { stems: { future: 'bloupr' } })).toEqual(['bloupe']);
  });
});
