/**
 * The findings of the whole-pack review (`.superpowers/sdd/lang-es/whole-pack-review.md`) and the controller's last-round
 * rulings, one block per finding.
 */
import { describe, expect, it } from 'vitest';
import { createEngine } from '../../src/core/engine.js';
import { resolvedTargetKey } from '../../src/core/target.js';
import { locales } from '../../src/i18n/locales/index.js';
import { parseConjugationOptions } from '../../src/index.js';
import { packs } from '../../src/languages/index.js';
import type { ConjugatedForm } from '../../src/types.js';

const engine = createEngine(packs, locales);
const conjugated = (infinitive: string, options: Record<string, unknown> = {}) => engine.conjugate({ language: 'es', infinitive, ...options });
const bare = (form: ConjugatedForm) => engine.renderParts('es', form.parts, { bare: true });
const texts = (infinitive: string, options: Record<string, unknown>) => conjugated(infinitive, options).forms.map(form => form.text);
function row(infinitive: string, mood: string, tense: string, extra: Record<string, unknown> = {}): string[] {
  const byTarget = new Map<string, string[]>();
  for (const form of conjugated(infinitive, { mood, tense, ...extra }).forms) {
    const key = resolvedTargetKey(form.target);
    byTarget.set(key, [...byTarget.get(key) ?? [], bare(form)]);
  }
  return [...byTarget.values()].map(forms => forms.join(' / '));
}
const one = (infinitive: string, mood: string, tense: string, person?: 1 | 2 | 3, number?: 'singular' | 'plural') =>
  conjugated(infinitive, { mood, tense, ...(person === undefined ? {} : { person, number }) }).forms;
const analysisOf = (infinitive: string, extra: Record<string, unknown> = {}) => packs.es.engine(parseConjugationOptions({ language: 'es', infinitive, ...extra })).analysis;
const ids = (infinitive: string, extra: Record<string, unknown> = {}) => analysisOf(infinitive, extra).steps!.map(s => s.rule);
const explained = (subject: Parameters<typeof engine.explain>[1], locale = 'en') =>
  engine.explain('es', subject, locale).sections.flatMap(section => section.steps.map(s => s.text)).join('\n');

describe('C1: the h of hue- only at the start of a word; desosar and desovar are lexical', () => {
  it('conjugates desollar without an h and keeps it in deshueso, deshuevo, huelo', () => {
    expect(row('desollar', 'indicative', 'present')).toEqual(['desuello', 'desuellas', 'desuella', 'desollamos', 'desolláis', 'desuellan']);
    expect(row('desollar', 'subjunctive', 'present')[0]).toBe('desuelle');
    expect(row('desollar', 'imperative', 'present')[0]).toBe('desuella');
    expect(row('desosar', 'indicative', 'present')[0]).toBe('deshueso');
    expect(row('desovar', 'indicative', 'present')[0]).toBe('deshuevo');
    expect(row('desosar', 'indicative', 'present')[3]).toBe('desosamos');
    expect(row('oler', 'indicative', 'present')[0]).toBe('huelo');
    expect(row('desolar', 'indicative', 'present')[0]).toBe('desuelo');
    expect(row('descollar', 'indicative', 'present')[0]).toBe('descuello');
    expect(row('desconsolar', 'indicative', 'present')[0]).toBe('desconsuelo');
    expect(one('desosar', 'indicative', 'present', 1, 'singular')[0]!.ruleIds).toContain('es.stem.hue');
    expect(explained(one('oler', 'indicative', 'present', 1, 'singular')[0]!)).not.toContain('des-');
  });
});

describe('C2 and I2: regular variants are derived by rule, the irregular one is the lexical item', () => {
  const ruleIds = (forms: readonly ConjugatedForm[]) => forms.map(form => form.ruleIds.filter(id => id.startsWith('es.stem') || id.startsWith('es.end') || id.startsWith('es.cell')));
  it('derives predeciré first and lists prediré second; the other -decir verbs the other way round', () => {
    expect(row('predecir', 'indicative', 'future')[0]).toBe('predeciré / prediré');
    expect(row('predecir', 'conditional', 'present')[0]).toBe('predeciría / prediría');
    const [regular, irregular] = one('predecir', 'indicative', 'future', 1, 'singular');
    expect(ruleIds([regular!])[0]).toEqual(['es.stem.future-infinitive', 'es.end.future']);
    expect(ruleIds([irregular!])[0]).toEqual(['es.stem.future-lexical', 'es.end.future']);
    expect([regular!.variant.pattern, irregular!.variant.pattern]).toEqual(['regular', 'irregular']);
    expect(row('contradecir', 'indicative', 'future')[0]).toBe('contradiré / contradeciré');
    expect(row('desdecir', 'conditional', 'present')[0]).toBe('desdiría / desdeciría');
    for (const [verb, first, preterite, command] of [['antedecir', 'antedigo', 'antedije', 'antedice'], ['interdecir', 'interdigo', 'interdije', 'interdice'],
      ['contradecir', 'contradigo', 'contradije', 'contradice'], ['desdecir', 'desdigo', 'desdije', 'desdice'], ['predecir', 'predigo', 'predije', 'predice']]) {
      expect(row(verb!, 'indicative', 'present')[0]).toBe(first);
      expect(row(verb!, 'indicative', 'simple_past')[0]).toBe(preterite);
      expect(row(verb!, 'imperative', 'present')[0]).toBe(command);
    }
    expect(row('antedecir', 'indicative', 'future')[0]).toBe('antediré / antedeciré');
    expect(row('bendecir', 'indicative', 'future')[0]).toBe('bendeciré');
  });

  it('derives the regular tú command of yacer and satisfacer', () => {
    expect(row('yacer', 'imperative', 'present')[0]).toBe('yace / yaz');
    expect(row('satisfacer', 'imperative', 'present')[0]).toBe('satisfaz / satisface');
    const [yace, yaz] = one('yacer', 'imperative', 'present', 2, 'singular');
    expect(ruleIds([yace!])[0]).toEqual(['es.stem.root', 'es.end.imperative-tu']);
    expect(ruleIds([yaz!])[0]).toEqual(['es.cell.imperative-short']);
    expect(explained(yace!)).not.toContain('short');
  });

  it('derives roo by the regular rules beside roigo and royo', () => {
    expect(row('roer', 'indicative', 'present')[0]).toBe('roo / roigo / royo');
    expect(row('roer', 'subjunctive', 'present')[0]).toBe('roa / roiga / roya');
    const [roo] = one('roer', 'indicative', 'present', 1, 'singular');
    expect(ruleIds([roo!])[0]).toEqual(['es.stem.root', 'es.end.present']);
    expect(roo!.variant.pattern).toBe('regular');
  });
});

describe('C3: the i of a one-vowel -iar stem takes the stress by rule', () => {
  it.each([['ciar', 'cío'], ['criar', 'crío'], ['fiar', 'fío'], ['guiar', 'guío'], ['liar', 'lío'], ['piar', 'pío'], ['triar', 'trío'], ['fliar', 'flío']])('%s → %s', (verb, form) => {
    expect(row(verb, 'indicative', 'present')[0]).toBe(form);
    expect(ids(verb)).toContain('es.classify.iar-single-vowel');
    expect(ids(verb)).not.toContain('es.classify.assume-glide');
  });
  it('keeps the 2010 monosyllables and the diphthong default of longer stems', () => {
    expect(row('criar', 'indicative', 'simple_past')[0]).toBe('crie');
    expect(row('liar', 'indicative', 'simple_past')[2]).toBe('lio');
    expect(row('guiar', 'indicative', 'simple_past')[2]).toBe('guio');
    expect(ids('flobiar')).toContain('es.classify.assume-glide');
    expect(row('gloriar', 'indicative', 'present')[0]).toBe('glorío');
    expect(row('sahumar', 'indicative', 'present')[0]).toBe('sahúmo');
    expect(explained(analysisOf('ciar'))).toContain('cío');
  });
});

describe('I1: idos is the preferred form, iros a valid variant with its own step', () => {
  it('puts idos first', () => {
    const forms = one('irse', 'imperative', 'present', 2, 'plural');
    expect(forms.map(form => form.text)).toEqual(['idos', 'iros']);
    expect(forms.map(form => form.variant.pattern)).toEqual([null, 'iros']);
    expect(forms[1]!.ruleIds).toContain('es.clause.iros');
    expect(forms[0]!.preferred).toBe(true);
  });
});

describe('I4 and I5: weather verbs and third-person-only verbs have no pronoun, in either slot set', () => {
  it('shows llueve once with the feminine slots, and no pronoun on concernir', () => {
    expect(texts('llover', { gender: 'feminine', mood: 'indicative', tense: 'present' })).toEqual(['llueve']);
    expect(texts('llover', { subject: '3sg.f', mood: 'indicative', tense: 'perfect' })).toEqual(['ha llovido']);
    expect(texts('llover', { mood: 'indicative', tense: 'present' })).toEqual(['llueve']);
    expect(texts('concernir', { mood: 'indicative', tense: 'present' })).toEqual(['concierne', 'conciernen']);
    expect(texts('acontecer', { gender: 'feminine', mood: 'indicative', tense: 'simple_past' })).toEqual(['aconteció', 'acontecieron']);
    expect(texts('acaecer', { mood: 'subjunctive', tense: 'present' })).toEqual(['que acaezca', 'que acaezcan']);
    const unavailable = conjugated('llover', { subject: '2sg.formal', mood: 'indicative', tense: 'present' }).unavailableTargets[0]!;
    expect(explained(unavailable)).toContain('has no subject');
  });
});

describe('I6: a class hint that does not fit the stem is rejected', () => {
  it.each([['ploldar', 'e-ie'], ['trondir', 'e-ie'], ['plandar', 'o-ue'], ['flantar', 'u-ue'], ['blandir', 'i-ie']])('%s + %s', (verb, hint) => {
    expect(() => conjugated(verb, { classHint: hint })).toThrow(expect.objectContaining({ code: 'INVALID_HINT' }));
  });
  it('accepts a fitting hint', () => expect(row('plentar', 'indicative', 'present', { classHint: 'e-ie' })[0]).toBe('pliento'));
});

describe('I7 and M4: the lexical step says whether the entry was checked, and names variants', () => {
  it('says the entry is not yet checked against the DLE, without a tautology', () => {
    const en = explained(analysisOf('errar'));
    expect(en).toContain('not yet checked against the DLE');
    expect(en).not.toContain('conjugated like errar');
    expect(explained(analysisOf('pensar'), 'nl')).toContain('nog niet nagekeken in het DLE');
    expect(ids('engrosar')).toContain('es.classify.variants');
    expect(ids('yacer')).toContain('es.classify.variants');
    expect(ids('tener')).not.toContain('es.classify.variants');
  });
  it('M3: names Latin America in the regional step, in both locales', () => {
    expect(explained(analysisOf('errar'))).toContain('much of Latin America');
    expect(explained(analysisOf('errar'), 'nl')).toContain('Latijns-Amerika');
  });
  it('M2: labels the paradigms in Dutch', () => {
    const titles = engine.explain('es', analysisOf('apostar'), 'nl').sections.map(section => section.title).join(' ');
    expect(titles).not.toMatch(/\((regular|o-ue)\)/u);
  });
  it('M6: explains suppletive cells as listed forms', () => {
    expect(explained(one('ir', 'indicative', 'imperfect', 1, 'singular')[0]!)).toContain('lists this form');
  });
});

export { analysisOf, explained, ids, texts };
