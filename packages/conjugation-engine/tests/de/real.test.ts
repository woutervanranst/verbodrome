/**
 * Real verbs outside the corpus, and lemma facts the corrections rest on (GD §8.2). Each expected form was checked in
 * the DWDS inflection table of the lemma (https://www.dwds.de/lemma/flexion/<lemma>), and where named in Duden's
 * conjugation table (https://www.duden.de/konjugation/<lemma>).
 */
import { describe, expect, it } from 'vitest';
import { conjugate } from '../../src/index.js';
import type { GrammaticalNumber, Person } from '../../src/types.js';

type Query = Record<string, unknown>;
const forms = (lemma: string, mood: string, tense: string, person?: Person, number?: GrammaticalNumber, extra: Query = {}) =>
  conjugate({ language: 'de', infinitive: lemma, mood, tense, ...(person === undefined ? {} : { person, number }), ...extra } as never).forms.map(f => f.text);
const at = (lemma: string, mood: string, tense: string, cells: readonly (readonly [Person, GrammaticalNumber])[]) =>
  cells.flatMap(([person, number]) => forms(lemma, mood, tense, person, number));
const sg = (person: Person) => [person, 'singular'] as const;
const pl = (person: Person) => [person, 'plural'] as const;
const imperative = (lemma: string) => forms(lemma, 'imperative', 'present', 2, 'singular');

describe('German real verbs outside the corpus', () => {
  it('weak verbs: machen, arbeiten, atmen, reisen, studieren, rechnen, öffnen, mixen, küssen, wagen', () => {
    expect([...at('machen', 'indicative', 'present', [sg(2), sg(3)]), ...at('machen', 'indicative', 'past', [sg(1)]), ...at('machen', 'indicative', 'perfect', [sg(1)])])
      .toEqual(['du machst', 'er macht', 'ich machte', 'ich habe gemacht']);
    expect(imperative('machen')).toEqual(['mach', 'mache']);
    expect([...at('arbeiten', 'indicative', 'present', [sg(2), sg(3)]), ...at('arbeiten', 'indicative', 'past', [sg(1)]), ...forms('arbeiten', 'participle', 'past')])
      .toEqual(['du arbeitest', 'er arbeitet', 'ich arbeitete', 'gearbeitet']);
    expect(imperative('arbeiten')).toEqual(['arbeite']);
    expect([...at('atmen', 'indicative', 'present', [sg(2), sg(3)]), ...at('atmen', 'indicative', 'past', [sg(1)]), ...forms('atmen', 'participle', 'past')])
      .toEqual(['du atmest', 'er atmet', 'ich atmete', 'geatmet']);
    expect(imperative('atmen')).toEqual(['atme']);
    expect([...at('reisen', 'indicative', 'present', [sg(2), sg(3)]), ...at('reisen', 'indicative', 'past', [sg(1)]), ...at('reisen', 'indicative', 'perfect', [sg(1)])])
      .toEqual(['du reist', 'er reist', 'ich reiste', 'ich bin gereist']);
    expect(imperative('reisen')).toEqual(['reis', 'reise']);
    expect([...at('studieren', 'indicative', 'present', [sg(2)]), ...at('studieren', 'indicative', 'past', [sg(1)]), ...at('studieren', 'indicative', 'perfect', [sg(1)])])
      .toEqual(['du studierst', 'ich studierte', 'ich habe studiert']);
    expect(imperative('studieren')).toEqual(['studier', 'studiere']);
    expect([...at('rechnen', 'indicative', 'present', [sg(2), sg(3)]), ...imperative('rechnen')]).toEqual(['du rechnest', 'er rechnet', 'rechne']);
    expect([...at('öffnen', 'indicative', 'present', [sg(2)]), ...imperative('öffnen')]).toEqual(['du öffnest', 'öffne']);
    expect([...at('mixen', 'indicative', 'present', [sg(2)]), ...at('küssen', 'indicative', 'present', [sg(2)]), ...imperative('küssen')])
      .toEqual(['du mixt', 'du küsst', 'küss', 'küsse']);
    expect([...at('wagen', 'indicative', 'past', [sg(1)]), ...forms('wagen', 'participle', 'past')]).toEqual(['ich wagte', 'gewagt']);
  });

  it('-eln and -ern: sammeln, wandern, ändern, lächeln', () => {
    expect(at('sammeln', 'indicative', 'present', [sg(1)])).toEqual(['ich sammele', 'ich sammle']);
    expect(at('sammeln', 'subjunctive', 'present', [sg(2), pl(2)])).toEqual(['du sammelst', 'du sammlest', 'ihr sammelt', 'ihr sammlet']);
    expect([...at('sammeln', 'indicative', 'past', [sg(1)]), ...forms('sammeln', 'participle', 'past'), ...imperative('sammeln')])
      .toEqual(['ich sammelte', 'gesammelt', 'sammele', 'sammle']);
    expect([...at('wandern', 'indicative', 'present', [sg(1)]), ...at('wandern', 'subjunctive', 'present', [sg(2)]), ...at('wandern', 'indicative', 'perfect', [sg(1)])])
      .toEqual(['ich wandere', 'ich wandre', 'du wanderst', 'ich bin gewandert']);
    expect(imperative('wandern')).toEqual(['wandere', 'wandre']);
    expect([...at('ändern', 'indicative', 'present', [sg(1)]), ...at('ändern', 'subjunctive', 'present', [sg(2)])]).toEqual(['ich ändere', 'ich ändre', 'du änderst']);
    expect(at('lächeln', 'indicative', 'present', [sg(1)])).toEqual(['ich lächele', 'ich lächle']);
  });

  it('derivatives: anerkennen, verschlafen, herumfahren', () => {
    const anerkennen = conjugate({ language: 'de', infinitive: 'anerkennen', mood: 'indicative', tense: 'present', person: 1, number: 'singular' }).forms;
    expect(anerkennen.map(f => [f.text, f.variant.pattern])).toEqual([['ich erkenne an', 'separable'], ['ich anerkenne', 'inseparable']]);
    expect(at('anerkennen', 'indicative', 'past', [sg(1)])).toEqual(['ich erkannte an', 'ich anerkannte']);
    expect(at('anerkennen', 'indicative', 'perfect', [sg(1)])).toEqual(['ich habe anerkannt', 'ich habe anerkannt']);
    expect(at('anerkennen', 'subjunctive', 'past', [sg(1)])).toEqual(['ich erkennte an', 'ich anerkennte']);
    expect(imperative('anerkennen')).toEqual(['erkenn an', 'erkenne an', 'anerkenn', 'anerkenne']);
    expect([...at('verschlafen', 'indicative', 'present', [sg(2), sg(3)]), ...at('verschlafen', 'indicative', 'past', [sg(1)]),
      ...at('verschlafen', 'subjunctive', 'past', [sg(1)]), ...at('verschlafen', 'indicative', 'perfect', [sg(1)])])
      .toEqual(['du verschläfst', 'er verschläft', 'ich verschlief', 'ich verschliefe', 'ich habe verschlafen']);
    expect(imperative('verschlafen')).toEqual(['verschlaf', 'verschlafe']);
    expect([...at('herumfahren', 'indicative', 'present', [sg(2)]), ...at('herumfahren', 'indicative', 'past', [sg(1)]),
      ...at('herumfahren', 'subjunctive', 'past', [sg(1)]), ...at('herumfahren', 'indicative', 'perfect', [sg(1)])])
      .toEqual(['du fährst herum', 'ich fuhr herum', 'ich führe herum', 'ich bin herumgefahren', 'ich habe herumgefahren']);
  });

  it('weather and third-person verbs: regnen, geschehen, gelingen', () => {
    expect([...at('regnen', 'indicative', 'present', [sg(3)]), ...at('regnen', 'indicative', 'past', [sg(3)]), ...at('regnen', 'indicative', 'perfect', [sg(3)])])
      .toEqual(['es regnet', 'es regnete', 'es hat geregnet']);
    const regnen = conjugate({ language: 'de', infinitive: 'regnen', mood: 'indicative', tense: 'present' });
    expect(regnen.unavailableTargets.map(u => [u.target.person, u.target.number, u.reason])).toEqual([
      [1, 'singular', 'impersonal'], [2, 'singular', 'impersonal'], [1, 'plural', 'impersonal'], [2, 'plural', 'impersonal'], [3, 'plural', 'impersonal']]);
    expect(conjugate({ language: 'de', infinitive: 'regnen', mood: 'imperative' }).unavailableTargets.map(u => u.reason)).toEqual(['noImperative', 'noImperative', 'noImperative']);
    expect(conjugate({ language: 'de', infinitive: 'geschehen', mood: 'imperative' }).forms).toEqual([]);
    expect([...at('gelingen', 'indicative', 'present', [sg(1)]), ...imperative('gelingen')]).toEqual(['ich gelinge', 'geling', 'gelinge']);
  });

  it('strong and irregular verbs: kommen, gehen, sein, haben, backen, schreien', () => {
    // kämst, kämt: Duden's table only (DWDS prints kämest, kämet); the engine marks them Duden only.
    expect(at('kommen', 'subjunctive', 'past', [sg(2), pl(2)])).toEqual(['du kämest', 'du kämst', 'ihr kämet', 'ihr kämt']);
    expect(at('gehen', 'subjunctive', 'past', [sg(2)])).toEqual(['du gingest']);
    expect([...at('sein', 'subjunctive', 'present', [sg(2), pl(2)]), ...at('sein', 'subjunctive', 'past', [sg(2), pl(2)])])
      .toEqual(['du seiest', 'du seist', 'ihr seiet', 'du wärest', 'du wärst', 'ihr wäret', 'ihr wärt']);
    expect(conjugate({ language: 'de', infinitive: 'sein', mood: 'imperative' }).forms.map(f => f.text)).toEqual(['sei', 'seien wir', 'seid']);
    expect(conjugate({ language: 'de', infinitive: 'sein', mood: 'imperative', subject: '2.formal' }).forms.map(f => f.text)).toEqual(['seien Sie']);
    expect(imperative('haben')).toEqual(['hab', 'habe']);
    expect(at('backen', 'indicative', 'present', [sg(3)])).toEqual(['er backt', 'er bäckt']);
    expect(at('backen', 'indicative', 'past', [sg(1)])).toEqual(['ich backte', 'ich buk']);
    expect(at('backen', 'subjunctive', 'past', [sg(1)])).toEqual(['ich backte', 'ich büke']);
    expect(at('schreien', 'indicative', 'past', [sg(2), pl(1)])).toEqual(['du schriest', 'wir schrien']);
    expect(at('schreien', 'subjunctive', 'past', [sg(1), sg(2), pl(1)])).toEqual(['ich schrie', 'du schriest', 'wir schrien']);
    expect(forms('schreien', 'participle', 'past')).toEqual(['geschrien']);
  });

  it('the du-form of the strong Präteritum and the du-imperative after d and t', () => {
    expect(at('finden', 'indicative', 'past', [sg(2)])).toEqual(['du fandest', 'du fandst']);
    expect(at('halten', 'indicative', 'past', [sg(2)])).toEqual(['du hieltest', 'du hieltst']);
    expect(at('bitten', 'indicative', 'past', [sg(2)])).toEqual(['du batest', 'du batst']);
    expect(at('tun', 'indicative', 'past', [sg(2)])).toEqual(['du tatest', 'du tatst']);
    expect([...imperative('finden'), ...imperative('halten'), ...imperative('bitten'), ...imperative('tun')]).toEqual(['finde', 'halte', 'bitte', 'tu', 'tue']);
    expect([...at('lesen', 'indicative', 'past', [sg(2)]), ...at('essen', 'indicative', 'past', [sg(2)]), ...at('sitzen', 'indicative', 'past', [sg(2)])])
      .toEqual(['du lasest', 'du last', 'du aßest', 'du aßt', 'du saßest', 'du saßt']);
  });

  it('Konjunktiv II doublets: helfen, gewinnen, stehlen', () => {
    expect(at('helfen', 'subjunctive', 'past', [sg(1)])).toEqual(['ich hälfe', 'ich hülfe']);
    expect(at('gewinnen', 'subjunctive', 'past', [sg(1)])).toEqual(['ich gewänne', 'ich gewönne']);
    // gewönne: DWDS va. (dated); stöhle: Duden's table only.
    expect(at('stehlen', 'subjunctive', 'past', [sg(1)])).toEqual(['ich stähle', 'ich stöhle']);
  });

  it('modal verbs: the würde-form and no imperative', () => {
    expect(at('können', 'conditional', 'present', [sg(1)])).toEqual(['ich würde können']);
    expect(at('können', 'conditional', 'past', [sg(1)])).toEqual(['ich würde gekonnt haben']);
    expect(conjugate({ language: 'de', infinitive: 'können', mood: 'imperative' }).unavailableTargets.map(u => u.reason)).toEqual(['noImperative', 'noImperative', 'noImperative']);
  });

  it('lemmas the classification must not split: beantragen, bedingen, beugen, überzeugen; heissen read as heißen', () => {
    expect([...at('beantragen', 'indicative', 'past', [sg(1)]), ...forms('beantragen', 'participle', 'past')]).toEqual(['ich beantragte', 'beantragt']);
    expect([...at('bedingen', 'indicative', 'past', [sg(3)]), ...forms('bedingen', 'participle', 'past')]).toEqual(['er bedingte', 'bedingt']);
    expect([...at('beugen', 'indicative', 'present', [sg(1)]), ...forms('beugen', 'participle', 'past')]).toEqual(['ich beuge', 'gebeugt']);
    expect([...at('überzeugen', 'indicative', 'present', [sg(1)]), ...forms('überzeugen', 'participle', 'past')]).toEqual(['ich überzeuge', 'überzeugt']);
    const heissen = conjugate({ language: 'de', infinitive: 'heissen', mood: 'indicative', tense: 'present', person: 2, number: 'singular' });
    expect([heissen.analysis.lemma, ...heissen.forms.map(f => f.text)]).toEqual(['heißen', 'du heißt']);
  });
});
