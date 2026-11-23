import { describe, expect, it } from 'vitest';
import { conjugate } from '../src/index.js';
import { frenchModels, selectModel } from '../src/languages/fr/models.js';
import { cellTexts, parseTable } from '../src/languages/fr/table.js';
import type { FrenchConjugationOptions } from '../src/types.js';

function texts(options: FrenchConjugationOptions): string[] {
  return conjugate({ gender: 'masculine', ...options }).forms.map(form => form.text);
}

describe('French model inventory', () => {
  it('keeps every model internally consistent', () => {
    const ids = new Set<string>();
    // A listed lemma may equal another model's suffix (dire vs -dire): the listed lemma wins.
    const claimed = { suffixes: new Map<string, string>(), lemmas: new Map<string, string>() };
    for (const model of frenchModels) {
      expect(ids.has(model.id), model.id).toBe(false);
      ids.add(model.id);
      expect(model.paradigms.length, model.id).toBeGreaterThan(0);
      for (const kind of ['suffixes', 'lemmas'] as const) {
        for (const selector of model[kind]) {
          expect(model.strip, `${model.id} strips more than ${selector}`).toBeLessThanOrEqual(selector.length);
          expect(claimed[kind].get(selector), `${selector} is claimed by two models`).toBeUndefined();
          claimed[kind].set(selector, model.id);
        }
      }
    }
  });

  it('prefers listed lemmas, then the longest suffix, and honours exclusions', () => {
    expect(selectModel('naître')?.model.id).toBe('naître');
    expect(selectModel('connaître')?.model.id).toBe('connaître');
    expect(selectModel('prévaloir')?.model.id).toBe('prévaloir');
    expect(selectModel('équivaloir')?.model.id).toBe('valoir');
    expect(selectModel('racheter')?.model.id).toBe('lever');
    expect(selectModel('cacheter')?.model.id).toBe('feuilleter');
    expect(selectModel('dépecer')?.model.id).toBe('dépecer');
    expect(selectModel('placer')?.model.id).toBe('placer');
    expect(selectModel('ressentir')?.model.id).toBe('partir');
    expect(selectModel('assortir')?.model.id).toBe('finir');
    expect(selectModel('asservir')?.model.id).toBe('finir');
    expect(selectModel('appauvrir')?.model.id).toBe('finir');
    expect(selectModel('glouloir')).toBeUndefined();
  });

  it('reports the conjugation model, which the model hint accepts back', () => {
    const analysis = (infinitive: string): [string, string] => {
      const { classification, classificationSource } = conjugate({ language: 'fr', infinitive, mood: 'infinitive', tense: 'present' }).analysis;
      return [classification, classificationSource];
    };
    expect(analysis('parler')).toEqual(['aimer', 'regularRule']);
    expect(analysis('placer')).toEqual(['placer', 'regularRule']);
    expect(analysis('lever')).toEqual(['lever', 'regularRule']);
    expect(analysis('finir')).toEqual(['finir', 'regularRule']);
    expect(analysis('rendre')).toEqual(['rendre', 'regularRule']);
    expect(analysis('venir')).toEqual(['venir', 'lexicon']);
    expect(analysis('conduire')).toEqual(['cuire', 'lexicon']);
    for (const infinitive of ['ploucer', 'atteindre', 'parler', 'brumir']) {
      const options = { language: 'fr', infinitive, mood: 'indicative', tense: 'present' } as const;
      const inferred = conjugate(options);
      const hinted = conjugate({ ...options, model: inferred.analysis.classification });
      expect(hinted.forms.map(form => form.text), infinitive).toEqual(inferred.forms.map(form => form.text));
    }
  });

  it('parses alternatives, spellings, grave stems and empty endings', () => {
    const paradigm = parseTable(`
      ^e t:erai/r:^erai 0 - a/b ez
      a a a a a a
      a a a a a a
      a a a a a a
      a a a a a a
      a a a a a a
      a a a a a a
      a a a a a a a a er
    `);
    expect(cellTexts('céd', paradigm.cells[0] ?? null, 'traditional', true)).toEqual(['cède']);
    expect(cellTexts('céd', paradigm.cells[1] ?? null, 'traditional', true)).toEqual(['céderai']);
    expect(cellTexts('céd', paradigm.cells[1] ?? null, 'rectified', true)).toEqual(['cèderai']);
    expect(cellTexts('rend', paradigm.cells[2] ?? null, 'rectified', false)).toEqual(['rend']);
    expect(cellTexts('x', paradigm.cells[3] ?? null, 'rectified', false)).toBeNull();
    expect(cellTexts('x', paradigm.cells[4] ?? null, 'rectified', false)).toEqual(['xa', 'xb']);
    expect(cellTexts('traîn', paradigm.cells[5] ?? null, 'rectified', true)).toEqual(['trainez']);
    expect(() => parseTable('e es e')).toThrow(/Malformed/u);
  });
});

describe('suffix families cover unlisted derivatives', () => {
  const present = (infinitive: string, person: 1 | 2 | 3, number: 'singular' | 'plural'): string[] =>
    texts({ language: 'fr', infinitive, mood: 'indicative', tense: 'present', person, number });

  it.each([
    ['conduire', 'nous conduisons'], ['construire', 'nous construisons'], ['atteindre', 'nous atteignons'],
    ['plaindre', 'nous plaignons'], ['enjoindre', 'nous enjoignons'], ['paraître', 'nous paraissons'],
    ['inscrire', 'nous inscrivons'], ['circonvenir', 'nous circonvenons'], ['compromettre', 'nous compromettons'],
    ['enquérir', 'nous enquérons'], ['taire', 'nous taisons'], ['suffire', 'nous suffisons'],
    ['maudire', 'nous maudissons'], ['entrouvrir', 'nous entrouvrons'], ['raire', 'nous rayons'],
  ])('conjugates %s', (infinitive, expected) => {
    expect(present(infinitive, 1, 'plural')).toEqual([expected]);
  });

  it('separates look-alike second-group verbs from third-group families', () => {
    expect(present('démentir', 1, 'singular')).toEqual(['je démens']);
    expect(present('assortir', 1, 'singular')).toEqual(["j'assortis"]);
    expect(present('impartir', 1, 'plural')).toEqual(['nous impartissons']);
    expect(present('appauvrir', 1, 'plural')).toEqual(['nous appauvrissons']);
  });

  it('keeps family-specific stems, participles and simple pasts', () => {
    expect(present('rebattre', 1, 'singular')).toEqual(['je rebats']);
    expect(present('foutre', 3, 'singular')).toEqual(['il fout']);
    expect(texts({ language: 'fr', infinitive: 'inclure', mood: 'indicative', tense: 'simple_past', person: 1, number: 'singular' })).toEqual(["j'inclus"]);
    expect(texts({ language: 'fr', infinitive: 'inclure', mood: 'participle', tense: 'past', agreement: { gender: 'feminine', number: 'singular' } })).toEqual(['incluse']);
    expect(texts({ language: 'fr', infinitive: 'exclure', mood: 'participle', tense: 'past', agreement: { gender: 'feminine', number: 'singular' } })).toEqual(['exclue']);
    expect(texts({ language: 'fr', infinitive: 'taire', mood: 'participle', tense: 'past', agreement: { gender: 'feminine', number: 'singular' } })).toEqual(['tue']);
    expect(texts({ language: 'fr', infinitive: 'suffire', mood: 'participle', tense: 'past' })).toEqual(['suffi']);
    expect(texts({ language: 'fr', infinitive: 'dissoudre', mood: 'participle', tense: 'past', agreement: { gender: 'feminine', number: 'singular' } })).toEqual(['dissoute']);
  });

  it('marks infinitive-only and participle-only verbs unavailable elsewhere', () => {
    const accroire = conjugate({ language: 'fr', infinitive: 'accroire', mood: 'indicative', tense: 'present', person: 1, number: 'singular' });
    expect(accroire.forms).toEqual([]);
    expect(accroire.unavailableTargets[0]?.reason).toBe('defective');
    expect(texts({ language: 'fr', infinitive: 'accroire', mood: 'infinitive', tense: 'present' })).toEqual(['accroire']);
    expect(texts({ language: 'fr', infinitive: 'férir', mood: 'participle', tense: 'past', agreement: { gender: 'masculine', number: 'singular' } })).toEqual(['féru']);
  });
});

describe('-er spelling classes', () => {
  const first = (infinitive: string, tense: 'present' | 'future', preferredOrthography: 'rectified' | 'traditional' = 'rectified'): string[] =>
    texts({ language: 'fr', infinitive, mood: 'indicative', tense, person: 1, number: 'singular', preferredOrthography });

  it('distinguishes doubling from grave -eler/-eter verbs in both spellings', () => {
    expect(first('amonceler', 'present', 'traditional')).toEqual(["j'amoncelle", "j'amoncèle"]);
    expect(first('cacheter', 'present', 'traditional')).toEqual(['je cachette', 'je cachète']);
    expect(first('épeler', 'present', 'traditional')).toEqual(["j'épelle", "j'épèle"]);
    expect(first('racheter', 'present')).toEqual(['je rachète']);
    expect(first('harceler', 'present')).toEqual(['je harcèle']);
    expect(first('rappeler', 'present')).toEqual(['je rappelle']);
    expect(first('projeter', 'present')).toEqual(['je projette']);
  });

  it('applies è only to mute or closed e, not to loanword spellings', () => {
    expect(first('dépecer', 'present')).toEqual(['je dépèce']);
    expect(first('annexer', 'present')).toEqual(["j'annexe"]);
    expect(first('vexer', 'present')).toEqual(['je vexe']);
    expect(first('interviewer', 'present')).toEqual(["j'interviewe"]);
    expect(first('speeder', 'present')).toEqual(['je speede']);
  });

  it('keeps y in -eyer verbs and the irregular future only in envoyer', () => {
    expect(first('grasseyer', 'future')).toEqual(['je grasseyerai']);
    expect(first('convoyer', 'future')).toEqual(['je convoierai']);
    expect(first('renvoyer', 'future')).toEqual(['je renverrai']);
  });
});
