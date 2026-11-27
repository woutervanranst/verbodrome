import { describe, expect, it } from 'vitest';
import { createEngine } from '../../src/core/engine.js';
import { locales } from '../../src/i18n/locales/index.js';
import { parseConjugationOptions } from '../../src/index.js';
import { packs } from '../../src/languages/index.js';
import { spanishGrammar } from '../../src/languages/es/grammar.js';
import type { VerbAnalysis } from '../../src/types.js';

const engine = createEngine(packs, locales);

/** The analysis of a parsed query, from the pack's engine before any target is built. */
function analysisOf(infinitive: string, extra: Record<string, unknown> = {}): VerbAnalysis {
  return packs.es.engine(parseConjugationOptions({ language: 'es', infinitive, ...extra })).analysis;
}
const ids = (infinitive: string, extra = {}) => analysisOf(infinitive, extra).steps!.map(s => s.rule);
const classified = (infinitive: string, extra: Record<string, unknown> = {}) =>
  spanishGrammar.classify({ language: 'es', infinitive, ...extra }).map(outcome => outcome.value);

describe('Spanish classification', () => {
  it('classifies regular verbs and records the assumption', () => {
    expect(ids('amar')).toEqual(['es.classify.conjugation', 'es.classify.assume-regular']);
    expect(analysisOf('amar')).toMatchObject({ classification: 'amar', classificationSource: 'regularRule', reflexive: false, auxiliaries: ['haber'] });
    expect(analysisOf('temer').classification).toBe('temer');
    expect(analysisOf('partir').classification).toBe('partir');
    expect(classified('amar')[0]).toMatchObject({ infinitive: 'amar', conjugation: 'ar', prefix: '', base: 'amar', root: 'am', alternation: null, particle: null });
  });

  it('reads reflexive infinitives', () => {
    expect(analysisOf('levantarse')).toMatchObject({ lemma: 'levantarse', reflexive: true });
    expect(ids('levantarse')[0]).toBe('es.classify.reflexive');
    expect(classified('levantarse')[0]).toMatchObject({ infinitive: 'levantar', reflexive: true });
    expect(analysisOf('levantar', { reflexive: true })).toMatchObject({ lemma: 'levantar', reflexive: true });
    expect(analysisOf('irse')).toMatchObject({ lemma: 'irse', reflexive: true, classification: 'ir' });
  });

  it('restores the tilde of -eír/-oír', () => {
    expect(analysisOf('reir').lemma).toBe('reír');
    expect(analysisOf('REIR').lemma).toBe('reír');
    expect(analysisOf('oir').lemma).toBe('oír');
    expect(analysisOf('sonreirse')).toMatchObject({ lemma: 'sonreírse', reflexive: true });
    expect(ids('sonreir')).toContain('es.classify.restore-accent');
    expect(ids('reír')).not.toContain('es.classify.restore-accent');
  });

  it('inherits strong irregularity only through the closed prefix list', () => {
    expect(analysisOf('componer')).toMatchObject({ classification: 'poner', classificationSource: 'lexicon' });
    expect(classified('componer')[0]).toMatchObject({ prefix: 'com', base: 'poner', root: 'compon' });
    expect(classified('predisponer')[0]).toMatchObject({ prefix: 'predis', base: 'poner' });
    expect(classified('contraer')[0]).toMatchObject({ prefix: 'con', base: 'traer' });
    expect(ids('protener')).toContain('es.classify.prefixed');
    expect(ids('blotener')).toContain('es.classify.assume-regular');
    expect(analysisOf('blotener').classification).toBe('temer');
    expect(analysisOf('pretender').classification).toBe('temer');      // never tender's diphthong
    expect(analysisOf('contestar').classification).toBe('amar');
    expect(analysisOf('comandar').classification).toBe('amar');        // not com + andar
    expect(analysisOf('prever').classification).toBe('ver');          // explicit short-base map
    expect(classified('prever')[0]).toMatchObject({ prefix: 'pre', base: 'ver' });
    expect(analysisOf('detener')).toMatchObject({ classification: 'tener' });
    expect(classified('detener')[0]!.alternation).toBe('e-ie');
  });

  it('uses suffix families', () => {
    expect(analysisOf('traducir')).toMatchObject({ classification: 'conducir', classificationSource: 'lexicon' });
    expect(ids('traducir')).toContain('es.classify.family');
    expect(analysisOf('describir').classification).toBe('escribir');
  });

  it('reads the lexicon and its stem-vowel classes', () => {
    expect(ids('sentir')).toEqual(['es.classify.conjugation', 'es.classify.lexicon']);
    expect(analysisOf('sentir').classification).toBe('sentir');
    expect(analysisOf('pensar').classification).toBe('acertar');
    expect(analysisOf('dormir').classification).toBe('dormir');
    expect(analysisOf('tener').classification).toBe('tener');
    expect(analysisOf('guiar')).toMatchObject({ classification: 'enviar', classificationSource: 'lexicon' });
    expect(classified('discernir')[0]).toMatchObject({ alternation: 'e-ie', raising: false });
    expect(classified('sentir')[0]).toMatchObject({ alternation: 'e-ie', raising: true });
    expect(classified('erguir')[0]!.alternation).toEqual([{ value: 'e-ie', pattern: 'ye' }, { value: 'e-i', pattern: 'i' }]);
    expect(classified('evacuar')[0]!.stress).toBe('both');
    expect(classified('construir')[0]!.yInsertion).toBe(true);
    expect(classified('seguir')[0]!.yInsertion).toBe(false);
    expect(classified('conocer')[0]!.zc).toBe(true);
    expect(classified('mecer')[0]!.zc).toBe(false);
  });

  it('records only the assumptions that decide a form', () => {
    expect(ids('flobiar')).toContain('es.classify.assume-glide');
    expect(ids('flobiar', { stems: { stress: 'hiatus' } })).not.toContain('es.classify.assume-glide');
    expect(ids('flobiar', { stems: { stress: 'hiatus' } })).toContain('es.classify.hint');
    expect(ids('blaular')).toContain('es.classify.assume-diphthong');
    expect(ids('blorecer')).toContain('es.classify.assume-zc');
    expect(ids('blorecer', { stems: { zc: false } })).not.toContain('es.classify.assume-zc');
    expect(ids('plontuar')).toContain('es.classify.uar-stress');
    expect(classified('plontuar')[0]!.stress).toBe('hiatus');
    expect(classified('rimiguar')[0]!.stress).toBe('diphthong');
    expect(ids('blorpar')).not.toContain('es.classify.assume-glide');
    expect(ids('blorpar')).toEqual(['es.classify.conjugation', 'es.classify.assume-regular']);
    expect(analysisOf('flobiar').assumptions).toHaveLength(2);
  });

  it('accepts hints and rejects contradicting ones', () => {
    expect(analysisOf('plentar', { classHint: 'e-ie' })).toMatchObject({ classificationSource: 'explicitHint', classification: 'acertar' });
    expect(ids('plentar', { classHint: 'e-ie' })).not.toContain('es.classify.assume-regular');
    expect(analysisOf('flentir', { classHint: 'e-ie' }).classification).toBe('sentir');
    expect(analysisOf('tredir', { classHint: 'e-i' }).classification).toBe('pedir');
    expect(analysisOf('tener', { classHint: 'e-ie' }).classification).toBe('tener');
    expect(() => analysisOf('tener', { classHint: 'e-i' })).toThrow(expect.objectContaining({ code: 'INVALID_HINT' }));
    expect(() => analysisOf('plentar', { classHint: 'e-i' })).toThrow(expect.objectContaining({ code: 'INVALID_HINT' }));
    expect(() => analysisOf('levantarse', { reflexive: false })).toThrow(expect.objectContaining({ code: 'INVALID_HINT' }));
    expect(() => analysisOf('xyz')).toThrow(expect.objectContaining({ code: 'INVALID_INFINITIVE' }));
    expect(() => analysisOf('ar')).toThrow(expect.objectContaining({ code: 'INVALID_INFINITIVE' }));
  });

  it('returns both paradigms of apostar, one with a hint', () => {
    expect(analysisOf('apostar').alternatives).toHaveLength(1);
    expect(analysisOf('apostar')).toMatchObject({ classification: 'contar', pattern: 'o-ue' });
    expect(analysisOf('apostar').alternatives![0]).toMatchObject({ classification: 'amar', pattern: 'regular' });
    expect(ids('apostar')).toContain('es.classify.two-paradigms');
    expect(analysisOf('apostar', { classHint: 'o-ue' }).alternatives).toBeUndefined();
    expect(analysisOf('apostar', { classHint: 'regular' }).classification).toBe('amar');
  });

  it('explains every classification step in English and Dutch', () => {
    for (const [verb, extra] of [['amar', {}], ['sonreirse', {}], ['componer', {}], ['traducir', {}], ['plontuar', {}], ['flobiar', {}],
      ['blaular', {}], ['blorecer', {}], ['plentar', { classHint: 'e-ie' }], ['apostar', {}]] as const) {
      const analysis = analysisOf(verb, extra);
      for (const locale of ['en', 'nl']) {
        const text = engine.explain('es', analysis, locale).sections.flatMap(section => section.steps.map(s => s.text)).join('\n');
        expect(text).not.toMatch(/[{}]|undefined/u);
      }
    }
  });
});
