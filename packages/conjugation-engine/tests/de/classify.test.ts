import { describe, expect, it } from 'vitest';
import type { DerivationStep } from '../../src/core/derivation.js';
import { parseConjugationOptions } from '../../src/index.js';
import { classifyGerman, germanLexemeOf } from '../../src/languages/de/classify.js';
import {
  denominalPrefixes, derivativeAuxiliaries, derivedParadigms, dualPrefixLemmas, germanLexicon, impersonalVerbs, inseparableReadings,
  lookalikes, noInherit, nonInitialStress, particleVerbs, shortRootDerivatives, weakWithSein,
} from '../../src/languages/de/lexicon.js';
import { dudenOnly } from '../../src/languages/de/sources.js';
import { verification } from '../../src/languages/de/verification.js';
import type { DualEntry, GermanEntry } from '../../src/languages/de/lexicon.js';
import { germanPack } from '../../src/languages/de/pack.js';
import type { VerbAnalysis } from '../../src/types.js';

const analyse = (query: Record<string, unknown>): VerbAnalysis =>
  germanPack.engine(parseConjugationOptions({ language: 'de', ...query })).analysis;
const analysis = (lemma: string, hints: Record<string, unknown> = {}) => analyse({ infinitive: lemma, ...hints });
const stepsOf = (lemma: string, hints: Record<string, unknown> = {}): readonly DerivationStep[] => analysis(lemma, hints).steps ?? [];
const ids = (lemma: string, hints: Record<string, unknown> = {}) => stepsOf(lemma, hints).map(s => s.rule);
const assumptions = (lemma: string, hints: Record<string, unknown> = {}) => stepsOf(lemma, hints).filter(s => s.kind === 'assumption').map(s => s.rule);
const stepOf = (lemma: string, rule: string, hints: Record<string, unknown> = {}): DerivationStep => {
  const found = stepsOf(lemma, hints).find(s => s.rule === rule);
  if (!found) throw new Error(`${lemma} has no step ${rule}: ${ids(lemma, hints).join(', ')}`);
  return found;
};
const invalid = (code: string, message?: string) => expect.objectContaining({ code, ...(message === undefined ? {} : { message }) });

describe('German classification', () => {
  it('reads listed verbs from the lexicon', () => {
    expect(analysis('fahren')).toMatchObject({ classification: 'strong', classificationSource: 'lexicon', auxiliaries: ['sein', 'haben'] });
    expect(stepsOf('fahren').map(s => [s.rule, s.before, s.after])).toEqual([['de.classify.lexicon', 'fahren', 'strong']]);
    expect(analysis('brennen')).toMatchObject({ classification: 'mixed', auxiliaries: ['haben'] });
    expect(analysis('können')).toMatchObject({ classification: 'preteritePresent', auxiliaries: ['haben'] });
    expect(analysis('sein')).toMatchObject({ classification: 'irregular', auxiliaries: ['sein'] });
    expect(analysis('reisen')).toMatchObject({ classification: 'weak', classificationSource: 'lexicon', auxiliaries: ['sein'], assumptions: [] });
  });

  it('assumes a weak verb with haben and initial stress for an unlisted verb', () => {
    expect(analysis('machen')).toMatchObject({ classification: 'weak', classificationSource: 'regularRule', auxiliaries: ['haben'] });
    expect(assumptions('machen')).toEqual(['de.classify.default-weak', 'de.classify.default-haben', 'de.classify.default-stress']);
    expect(assumptions('schlinken')).toEqual(['de.classify.default-weak', 'de.classify.default-haben', 'de.classify.default-stress']);
    expect(assumptions('studieren')).toEqual(['de.classify.default-weak', 'de.classify.default-haben']);
    expect(ids('studieren')).toContain('de.classify.ieren');
    expect(ids('frieren')).not.toContain('de.classify.ieren');
  });

  it('resolves derivatives of listed roots', () => {
    // DWDS lists "hat verschlafen", so no auxiliary is assumed (the plan had assume-root-auxiliary last).
    expect(stepsOf('verschlafen').map(s => [s.rule, s.params])).toEqual([
      ['de.classify.derivative', { prefix: 'ver', root: 'schlafen' }], ['de.classify.inseparable', { prefix: 'ver' }]]);
    // An unlisted inseparable derivative assumes haben, first among its steps.
    expect(stepsOf('verfressen').map(s => [s.rule, s.params])).toEqual([
      ['de.classify.assume-prefix-haben', {}], ['de.classify.derivative', { prefix: 'ver', root: 'fressen' }], ['de.classify.inseparable', { prefix: 'ver' }]]);
    expect(analysis('verschlafen')).toMatchObject({ classification: 'strong', classificationSource: 'lexicon', auxiliaries: ['haben'] });
    expect(analysis('herumfahren').auxiliaries).toEqual(['sein', 'haben']);
    expect(ids('herumfahren')).toEqual(['de.classify.assume-root-auxiliary', 'de.classify.derivative', 'de.classify.separable']);
    // Outside in: an + erkennen, then er + kennen.
    expect(stepsOf('anerkennen').filter(s => s.rule === 'de.classify.derivative').map(s => s.params)).toEqual([
      { prefix: 'an', root: 'erkennen' }, { prefix: 'er', root: 'kennen' }]);
    expect(analysis('vertreten')).toMatchObject({ classification: 'strong', auxiliaries: ['haben'], assumptions: [] });
    expect(analysis('vorbereiten')).toMatchObject({ classification: 'weak' });
    expect(ids('vorbereiten')).toContain('de.classify.not-derived');
    expect(analysis('gerinnen')).toMatchObject({ classification: 'strong', auxiliaries: ['sein'], assumptions: [] });
    expect(analysis('aufheissen')).toMatchObject({ lemma: 'aufheißen', classification: 'strong' });
    expect(ids('vorbeugen')).toEqual(['de.classify.assume-root-auxiliary', 'de.classify.derivative', 'de.classify.separable', 'de.classify.lexicon']);
  });

  it('assumes an unknown verb with a particle is separable', () => {
    expect(ids('aufschlinken')).toEqual(['de.classify.assume-separable', 'de.classify.default-weak', 'de.classify.default-haben', 'de.classify.default-stress']);
    expect(stepOf('aufschlinken', 'de.classify.assume-separable').params).toEqual({ particle: 'auf' });
    expect(stepOf('umschlinken', 'de.classify.assume-separable').params).toEqual({ particle: 'um' });
    expect(ids('umschlinken', { inseparablePrefix: 'um' })).toContain('de.classify.hint');
    expect(ids('umschlinken', { inseparablePrefix: 'um' })).not.toContain('de.classify.assume-separable');
    expect(analysis('umschlinken', { inseparablePrefix: 'um' }).classificationSource).toBe('explicitHint');
    // The prefix of an unknown remainder is a guess (bereitstellen is not be- + reitstellen): an assumption, first.
    expect(ids('verschlinken')).toEqual(['de.classify.assume-inseparable', 'de.classify.default-weak', 'de.classify.default-haben']);
  });

  it('knows inseparable readings, lookalikes, denominal and non-derived verbs', () => {
    expect(ids('überzeugen')).toEqual(expect.arrayContaining(['de.classify.inseparable']));
    expect(ids('überzeugen')).not.toContain('de.classify.assume-separable');
    expect(ids('beugen')).not.toContain('de.classify.inseparable');
    expect(analysis('angeln')).toMatchObject({ classification: 'weak', assumptions: [] });
    expect(ids('beantragen')).toContain('de.classify.denominal');
    expect(analysis('beantragen').classification).toBe('weak');
    expect(stepOf('bedingen', 'de.classify.not-derived').params).toEqual({ root: 'dingen' });
    expect(analysis('bedingen').classification).toBe('weak');
  });

  it('returns several paradigms of one lemma, narrowed by hints', () => {
    expect(analysis('umziehen').alternatives).toHaveLength(1);
    expect([analysis('umziehen').pattern, analysis('umziehen').alternatives?.[0]?.pattern]).toEqual(['separable', 'inseparable']);
    expect(analysis('umziehen', { separablePrefix: 'um' })).not.toHaveProperty('alternatives');
    expect(analysis('umziehen', { inseparablePrefix: 'um' }).auxiliaries).toEqual(['haben']);
    expect([analysis('bewegen').pattern, analysis('bewegen').alternatives?.[0]?.pattern]).toEqual(['weak', 'strong']);
    expect(analysis('bewegen', { classHint: 'strong' })).not.toHaveProperty('alternatives');
    expect(analysis('bewegen', { classHint: 'strong' }).classification).toBe('strong');
  });

  it('reads ss and ae, oe, ue as ß and umlauts only to reach a listed verb', () => {
    expect(analysis('heissen')).toMatchObject({ lemma: 'heißen', classification: 'strong' });
    expect(stepOf('heissen', 'de.classify.transliteration').params).toEqual({ written: 'heissen', read: 'heißen' });
    expect(analysis('muessen').lemma).toBe('müssen');
    expect(analysis('wagen')).toMatchObject({ lemma: 'wagen', classification: 'weak' });
    expect(analysis('küssen').lemma).toBe('küssen');
  });

  it('applies and checks hints', () => {
    expect(analyse({ infinitive: 'fahren', auxiliary: 'haben' }).auxiliaries).toEqual(['haben']);
    expect(analyse({ infinitive: 'schlinken', auxiliary: 'sein' })).toMatchObject({ auxiliaries: ['sein'], assumptions: expect.not.arrayContaining(['de.classify.default-haben']) });
    expect(analyse({ infinitive: 'schlinken', classHint: 'strong', stems: { preterite: 'schlank', participle: 'geschlunken' } }))
      .toMatchObject({ classification: 'strong', classificationSource: 'explicitHint' });
    expect(assumptions('schlinken', { classHint: 'strong', stems: { preterite: 'schlank', participle: 'geschlunken' } })).not.toContain('de.classify.default-weak');
    expect(assumptions('schlinken', { stems: { unstressedFirstSyllable: true } })).toEqual(['de.classify.default-weak', 'de.classify.default-haben']);
    expect(() => analyse({ infinitive: 'sich waschen' })).toThrow(invalid('INVALID_INFINITIVE', 'Reflexive verbs are not supported yet.'));
    expect(() => analyse({ infinitive: 'machenx' })).toThrow(invalid('INVALID_INFINITIVE'));
    expect(() => analyse({ infinitive: 'verschlafen', separablePrefix: 'ver' })).toThrow(invalid('INVALID_HINT'));
    expect(() => analyse({ infinitive: 'beschlinken', separablePrefix: 'be' })).toThrow(invalid('INVALID_HINT'));
    expect(() => analyse({ infinitive: 'überzeugen', separablePrefix: 'über' })).toThrow(invalid('INVALID_HINT'));
    expect(() => analyse({ infinitive: 'machen', separablePrefix: 'auf' })).toThrow(invalid('INVALID_HINT'));
    expect(() => analyse({ infinitive: 'schlinken', classHint: 'strong' })).toThrow(invalid('INVALID_HINT'));
    expect(() => analyse({ infinitive: 'fahren', classHint: 'weak' })).toThrow(invalid('INVALID_HINT'));
    expect(() => analyse({ infinitive: 'kommen', auxiliary: 'haben' })).toThrow(invalid('INVALID_HINT'));
  });

  it('gives auxiliaries and periphrasis verbs their own lexemes', () => {
    expect(germanLexemeOf('haben')).toMatchObject({ lemma: 'haben', conjugation: 'irregular', particle: null });
    expect(germanLexemeOf('werden')).toMatchObject({ lemma: 'werden', auxiliaries: ['sein'] });
    expect(classifyGerman({ language: 'de', infinitive: 'abschreiben' })[0]!.value)
      .toMatchObject({ base: 'schreiben', root: 'schreiben', prefix: null, particle: { text: 'ab', separable: true } });
    expect(classifyGerman({ language: 'de', infinitive: 'verschlafen' })[0]!.value)
      .toMatchObject({ base: 'verschlafen', root: 'schlafen', prefix: 'ver', geBlocked: 'prefix', entry: { preterite: 'verschlief', participle: 'verschlafen' } });
  });
});

describe('German lexicon', () => {
  const isDual = (entry: GermanEntry | DualEntry): entry is DualEntry => 'paradigms' in entry;

  it('records how every listed lemma was checked, and claims no check for an entry built from hints', () => {
    const lemmas = [
      ...Object.keys(germanLexicon), ...Object.keys(weakWithSein), ...Object.keys(derivativeAuxiliaries), ...Object.keys(shortRootDerivatives),
      ...Object.keys(dualPrefixLemmas), ...Object.keys(inseparableReadings), ...lookalikes, ...Object.keys(noInherit), ...Object.keys(nonInitialStress),
      ...impersonalVerbs, ...Object.keys(particleVerbs), ...Object.keys(derivedParadigms),
    ];
    for (const lemma of lemmas) expect(verification[lemma], lemma).toBeDefined();
    expect(verification.unterstellen).toEqual({ dwds: null, duden: expect.arrayContaining([expect.stringMatching(/^https:\/\/www\.duden\.de\//u)]) });
    expect(dudenOnly).toEqual(['unterstellen']);
    expect(stepsOf('unterstellen').map(s => s.rule)).toContain('de.classify.duden-only');
    const hinted = classifyGerman({ language: 'de', infinitive: 'schlinken', classHint: 'strong', stems: { preterite: 'schlank', participle: 'geschlunken' } })[0]!.value.entry!;
    expect(hinted).toMatchObject({ hinted: true });
    expect(hinted).not.toHaveProperty('source');
  });

  it('verifies every entry at DWDS', () => {
    for (const [lemma, entry] of Object.entries(germanLexicon)) {
      const entries = isDual(entry) ? entry.paradigms.map(p => p.entry) : [entry];
      for (const one of entries) expect(one.source, lemma).toMatch(/^https:\/\/www\.dwds\.de\//u);
    }
  });

  it('gives a dual entry two paradigms with distinct patterns', () => {
    const duals = Object.entries(germanLexicon).filter(([, entry]) => isDual(entry));
    // The ten of the design, and four where DWDS prints a weak and a strong conjugation of the same verb with labels
    // (melken, triefen, dingen, glimmen and stieben are one paradigm with tagged older forms).
    expect(duals.map(([lemma]) => lemma).sort()).toEqual([
      'backen', 'bewegen', 'erschrecken', 'gären', 'hängen', 'saugen', 'schaffen', 'schleifen', 'senden',
      'sieden', 'spleißen', 'wachsen', 'wenden', 'wiegen'].sort());
    for (const [, entry] of duals) {
      const patterns = (entry as DualEntry).paradigms.map(p => p.pattern);
      expect(patterns).toHaveLength(2);
      expect(new Set(patterns).size).toBe(2);
    }
  });

  it('holds side lists of lower-case lemmas', () => {
    const lists = [
      Object.keys(weakWithSein), Object.keys(derivativeAuxiliaries), Object.keys(shortRootDerivatives), Object.keys(inseparableReadings),
      lookalikes, Object.keys(noInherit), Object.keys(nonInitialStress), impersonalVerbs, Object.keys(dualPrefixLemmas), Object.keys(particleVerbs),
    ];
    for (const lemma of lists.flat()) expect(lemma).toMatch(/^\p{Ll}+n$/u);
    expect(denominalPrefixes).toEqual(['be', 'ver']);
    expect(Object.keys(germanLexicon)).toHaveLength(184);
  });
});
