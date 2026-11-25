/**
 * The French families (GD §4.2, §5): every cell of every legacy family table comes out of the principal parts by the
 * formation and spelling rules, or from a listed cell, with the steps that explain it. Deleted with the legacy tables
 * (Task 8): the snapshot keeps covering every model.
 */
import { describe, expect, it } from 'vitest';
import type { Outcome } from '../../src/core/fork.js';
import { synthesize } from '../../src/core/staged.js';
import { classifyFrench } from '../../src/languages/fr/classify.js';
import { cellNames } from '../../src/languages/fr/family.js';
import type { CellName } from '../../src/languages/fr/family.js';
import { frenchGrammar } from '../../src/languages/fr/grammar.js';
import { frenchModels } from '../../src/languages/fr/models.js';
import { cellOfName } from '../../src/languages/fr/stems.js';
import { cellTexts } from '../../src/languages/fr/table.js';

function words(infinitive: string, name: CellName, paradigm = 0, query: Readonly<Record<string, unknown>> = {}) {
  const lexeme = classifyFrench({ language: 'fr', infinitive, ...query })[paradigm]!.value;
  return synthesize(frenchGrammar, lexeme, cellOfName(name)).map((outcome: Outcome<string>) => ({
    word: outcome.value, orthography: outcome.tags.orthography ?? 'both', usage: outcome.tags.usage ?? 'standard',
    steps: outcome.steps.map(step => [step.rule, step.before, step.after]),
  }));
}
const texts = (infinitive: string, name: CellName, paradigm = 0) =>
  words(infinitive, name, paradigm).map(item => item.orthography === 'both' ? item.word : `${item.word} (${item.orthography})`);

describe('French families', () => {
  it('derives every family table cell for cell', () => {
    const mismatches: string[] = [];
    let compared = 0;
    for (const model of frenchModels.filter(candidate => !candidate.productive)) {
      const lemma = model.lemmas[0] ?? model.suffixes[0]!;
      const stem = lemma.slice(0, lemma.length - model.strip);
      // The model hint picks this family even where its first suffix is a word another family lists (dire).
      const paradigms = classifyFrench({ language: 'fr', infinitive: lemma, model: model.id });
      expect(paradigms.map(outcome => outcome.value.label)).toEqual(model.paradigms.map(() => model.id));
      model.paradigms.forEach((paradigm, p) => {
        cellNames.forEach((name, cell) => {
          for (const spelling of ['rectified', 'traditional'] as const) {
            const expected = cellTexts(stem, paradigm.cells[cell]!, spelling, model.kind === 'er');
            if (expected === null) continue;
            compared++;
            const actual = synthesize(frenchGrammar, paradigms[p]!.value, cellOfName(name))
              .filter(outcome => (outcome.tags.orthography ?? spelling) === spelling).map(outcome => outcome.value);
            if (JSON.stringify(actual) !== JSON.stringify(expected)) {
              mismatches.push(`${lemma}#${p} ${name} ${spelling}: ${JSON.stringify(actual)} ≠ ${JSON.stringify(expected)}`);
            }
          }
        });
      });
    }
    expect(mismatches).toEqual([]);
    expect(compared).toBeGreaterThan(8000);
  });

  it('explains ils viennent: family venir, ils-stem vienn-, ending -ent', () => {
    expect(classifyFrench({ language: 'fr', infinitive: 'venir' })[0]!.value.label).toBe('venir');
    expect(words('venir', 'pres.3p')).toEqual([{
      word: 'viennent', orthography: 'both', usage: 'standard',
      steps: [['fr.stem.ils', 'venir', 'vienn'], ['fr.end.present-plural', 'vienn', 'viennent']],
    }]);
  });

  it('explains nous vînmes: past stem v-, theme in, ending -înmes, usage literary', () => {
    expect(words('venir', 'ps.1p')).toEqual([{
      word: 'vînmes', orthography: 'both', usage: 'literary',
      steps: [['fr.stem.past', 'venir', 'v'], ['fr.end.simple-past', 'v', 'vînmes']],
    }]);
    expect(texts('devenir', 'ps.3p')).toEqual(['devinrent']);
  });

  it('explains il connaît (traditional) / il connait (rectified): circumflex-before-t', () => {
    const forms = words('connaître', 'pres.3s');
    expect(forms.map(item => [item.word, item.orthography])).toEqual([['connaît', 'traditional'], ['connait', 'rectified']]);
    expect(forms[0]!.steps.at(-1)).toEqual(['fr.orth.circumflex-before-t', 'connait', 'connaît']);
    expect(texts('connaître', 'fut.1s')).toEqual(['connaîtrai (traditional)', 'connaitrai (rectified)']);
    expect(texts('plaire', 'pres.3s')).toEqual(['plaît (traditional)', 'plait (rectified)']);
  });

  it('explains je m\'assoirai (rectified) / je m\'asseoirai (traditional) and je m\'assiérai: 1990-assoir, two paradigms', () => {
    const paradigms = classifyFrench({ language: 'fr', infinitive: 's\'asseoir' });
    expect(paradigms.map(outcome => outcome.tags.pattern)).toEqual(['assois', 'assieds']);
    expect(texts('s\'asseoir', 'fut.1s', 0)).toEqual(['asseoirai (traditional)', 'assoirai (rectified)']);
    expect(words('s\'asseoir', 'fut.1s', 0)[1]!.steps.at(-1)![0]).toBe('fr.orth.1990-assoir');
    expect(texts('s\'asseoir', 'fut.1s', 1)).toEqual(['assiérai']);
    expect(texts('s\'asseoir', 'pres.1s', 1)).toEqual(['assieds']);
    expect(texts('s\'asseoir', 'pres.3s', 1)).toEqual(['assied']);
  });

  it('explains que je sache and the imperative sache: subjunctive stem, imperative from subjunctive', () => {
    expect(words('savoir', 'subj.1s')[0]!.steps).toEqual([['fr.stem.subjunctive', 'savoir', 'sach'], ['fr.end.subjunctive', 'sach', 'sache']]);
    expect(words('savoir', 'imp.2s')).toEqual([{
      word: 'sache', orthography: 'both', usage: 'standard',
      steps: [['fr.stem.imperative-from-subjunctive', 'savoir', 'sach'], ['fr.end.imperative', 'sach', 'sache']],
    }]);
    expect(texts('savoir', 'imp.1p')).toEqual(['sachons']);
    expect(texts('savoir', 'ppres')).toEqual(['sachant']);
    expect(texts('vouloir', 'imp.2s')).toEqual(['veux', 'veuille']);
    expect(texts('avoir', 'imp.2s')).toEqual(['aie']);
    expect(texts('être', 'imp.2s')).toEqual(['sois']);
    expect(texts('être', 'pres.2p')).toEqual(['êtes']);
    expect(words('être', 'pres.2p')[0]!.steps).toEqual([['fr.stem.suppletive', 'être', 'êtes']]);
    expect(texts('aller', 'imp.2s')).toEqual(['va']);
    expect(texts('redire', 'imp.2p')).toEqual(['redites']);
  });

  it('keeps dû in both spellings and writes mu (rectified) / mû (traditional) for mouvoir', () => {
    expect(texts('devoir', 'pp.ms')).toEqual(['dû']);
    expect(texts('devoir', 'pp.fs')).toEqual(['due']);
    expect(texts('mouvoir', 'pp.ms')).toEqual(['mû (traditional)', 'mu (rectified)']);
    expect(texts('émouvoir', 'pp.ms')).toEqual(['ému']);
  });

  it('writes nous interpelons (rectified) / nous interpellons (traditional), j\'interpelle in both', () => {
    expect(texts('interpeller', 'pres.1p')).toEqual(['interpellons (traditional)', 'interpelons (rectified)']);
    expect(texts('interpeller', 'pres.1s')).toEqual(['interpelle']);
    expect(texts('interpeller', 'fut.1s')).toEqual(['interpellerai']);
    expect(texts('interpeller', 'inf')).toEqual(['interpeller (traditional)', 'interpeler (rectified)']);
  });

  it('writes absout (rectified) / absous (traditional), absoute in both', () => {
    expect(texts('absoudre', 'pp.ms')).toEqual(['absous (traditional)', 'absout (rectified)']);
    expect(texts('absoudre', 'pp.mp')).toEqual(['absous (traditional)', 'absouts (rectified)']);
    expect(texts('absoudre', 'pp.fs')).toEqual(['absoute']);
  });

  it('derives croître: je croîs, je crûs, crû in both spellings; croitrai (rectified)', () => {
    expect(texts('croître', 'pres.1s')).toEqual(['croîs']);
    expect(texts('croître', 'ps.1s')).toEqual(['crûs']);
    expect(words('croître', 'ps.1s')[0]!.steps.at(-1)![0]).toBe('fr.orth.croitre-homograph');
    expect(texts('croître', 'pp.ms')).toEqual(['crû']);
    expect(texts('croître', 'fut.1s')).toEqual(['croîtrai (traditional)', 'croitrai (rectified)']);
    expect(texts('accroître', 'ps.1s')).toEqual(['accrus']);
    expect(texts('accroître', 'pres.3s')).toEqual(['accroît (traditional)', 'accroit (rectified)']);
  });

  it('lists the spellings no rule writes: il clôt / il clot, crue / crûe', () => {
    expect(texts('clore', 'pres.3s')).toEqual(['clôt (traditional)', 'clot (rectified)']);
    expect(words('clore', 'pres.3s')[1]!.steps.at(-1)).toEqual(['fr.stem.listed-spelling', 'clôt', 'clot']);
    expect(texts('croître', 'pp.fs')).toEqual(['crue (traditional)', 'crûe (rectified)']);
  });
});
