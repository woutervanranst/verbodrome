import { describe, expect, it } from 'vitest';
import { createEngine } from '../../src/core/engine.js';
import { locales } from '../../src/i18n/locales/index.js';
import { packs } from '../../src/languages/index.js';

const engine = createEngine(packs, locales);
const result = (infinitive: string, options: Record<string, unknown>) => engine.conjugate({ language: 'es', infinitive, ...options });
const forms = (infinitive: string, options: Record<string, unknown>) => result(infinitive, options).forms;
const texts = (infinitive: string, options: Record<string, unknown>) => forms(infinitive, options).map(form => form.text);
const unavailable = (infinitive: string, options: Record<string, unknown>) => result(infinitive, options).unavailableTargets;

describe('Spanish compound tenses and non-finite forms', () => {
  it('builds every compound tense on haber', () => {
    expect(texts('amar', { mood: 'indicative', tense: 'perfect', person: 1, number: 'singular' })).toEqual(['yo he amado']);
    expect(texts('amar', { mood: 'indicative', tense: 'pluperfect', person: 3, number: 'plural' })).toEqual(['ellos habían amado']);
    expect(texts('amar', { mood: 'indicative', tense: 'past_anterior', person: 1, number: 'singular' })).toEqual(['yo hube amado']);
    expect(texts('amar', { mood: 'indicative', tense: 'future_perfect', person: 2, number: 'singular' })).toEqual(['tú habrás amado']);
    expect(texts('amar', { mood: 'conditional', tense: 'past', person: 1, number: 'plural' })).toEqual(['nosotros habríamos amado']);
    expect(texts('amar', { mood: 'subjunctive', tense: 'past', person: 1, number: 'singular' })).toEqual(['que yo haya amado']);
    expect(texts('amar', { mood: 'subjunctive', tense: 'pluperfect', person: 1, number: 'plural' })).toEqual(['que nosotros hubiéramos amado', 'que nosotros hubiésemos amado']);
    expect(forms('amar', { mood: 'subjunctive', tense: 'pluperfect', person: 1, number: 'plural' }).map(form => form.variant.pattern)).toEqual(['ra', 'se']);
    expect(forms('amar', { mood: 'subjunctive', tense: 'future_perfect', person: 3, number: 'singular' })[0]!.variant).toMatchObject({ usage: 'dated', auxiliary: 'haber' });
    expect(texts('amar', { mood: 'subjunctive', tense: 'future_perfect', person: 3, number: 'singular' })).toEqual(['que él hubiere amado']);
    expect(forms('amar', { mood: 'indicative', tense: 'perfect', person: 1, number: 'singular' })[0]!.ruleIds[0]).toBe('es.periphrasis.perfect');
  });

  it('builds the non-finite forms', () => {
    expect(texts('amar', { mood: 'infinitive' })).toEqual(['amar', 'haber amado']);
    expect(texts('poner', { mood: 'infinitive', tense: 'past' })).toEqual(['haber puesto']);
    expect(texts('amar', { mood: 'gerund' })).toEqual(['amando', 'habiendo amado']);
    expect(texts('reír', { mood: 'infinitive', tense: 'present' })).toEqual(['reír']);
    expect(texts('sentir', { mood: 'gerund', tense: 'present' })).toEqual(['sintiendo']);
    expect(texts('leer', { mood: 'gerund', tense: 'present' })).toEqual(['leyendo']);
    expect(texts('ir', { mood: 'gerund', tense: 'present' })).toEqual(['yendo']);
    expect(texts('leer', { mood: 'participle' })).toEqual(['leído']);
    expect(texts('podrir', { mood: 'participle' })).toEqual(['podrido']);
    expect(texts('componer', { mood: 'participle' })).toEqual(['compuesto']);
    expect(texts('prever', { mood: 'participle' })).toEqual(['previsto']);
    expect(texts('describir', { mood: 'participle' })).toEqual(['descrito']);
  });

  it('keeps doublet participles apart and out of the compound tenses where the lexicon says so', () => {
    expect(texts('freír', { mood: 'participle' })).toEqual(['frito', 'freído']);
    expect(forms('freír', { mood: 'participle' }).map(form => form.variant.pattern)).toEqual(['irregular', 'regular']);
    expect(texts('freír', { mood: 'indicative', tense: 'perfect', person: 1, number: 'singular' })).toEqual(['yo he frito', 'yo he freído']);
    // NGLE §4.12 (controller ruling): electo, preso, bendito and maldito are adjectives, not participles of the verb.
    expect(texts('elegir', { mood: 'participle' })).toEqual(['elegido']);
    expect(texts('prender', { mood: 'participle' })).toEqual(['prendido']);
    expect(texts('bendecir', { mood: 'participle' })).toEqual(['bendecido']);
    expect(texts('elegir', { mood: 'indicative', tense: 'perfect', person: 1, number: 'singular' })).toEqual(['yo he elegido']);
    expect(texts('imprimir', { mood: 'participle' })).toEqual(['impreso', 'imprimido']);
    expect(texts('proveer', { mood: 'participle' })).toEqual(['provisto', 'proveído']);
    expect(texts('sofreír', { mood: 'participle' })).toEqual(['sofrito', 'sofreído']);
    expect(texts('reimprimir', { mood: 'participle' })).toEqual(['reimpreso', 'reimprimido']);
  });

  it('builds the negative imperative on the present subjunctive', () => {
    // Formal address comes only on request: usted and ustedes are asked for by their slots.
    expect(texts('amar', { mood: 'imperative', tense: 'negative' })).toEqual(['no ames', 'no amemos', 'no améis']);
    expect(texts('amar', { mood: 'imperative', tense: 'negative', subject: '2sg.formal' })).toEqual(['no ame']);
    expect(texts('amar', { mood: 'imperative', tense: 'negative', subject: '2pl.formal' })).toEqual(['no amen']);
    expect(texts('ir', { mood: 'imperative', tense: 'negative' })).toEqual(['no vayas', 'no vayamos', 'no vayáis']);
    expect(texts('ir', { mood: 'imperative', tense: 'negative', subject: '2sg.formal' })).toEqual(['no vaya']);
    expect(texts('ir', { mood: 'imperative', tense: 'negative', subject: '2pl.formal' })).toEqual(['no vayan']);
    expect(forms('amar', { mood: 'imperative', tense: 'negative', person: 2, number: 'singular' })[0]!.variant.auxiliary).toBeNull();
    expect(engine.renderParts('es', forms('amar', { mood: 'imperative', tense: 'negative', person: 2, number: 'singular' })[0]!.parts, { bare: true })).toBe('no ames');
  });

  it('declares impersonal, defective and imperative-less verbs unavailable', () => {
    expect(unavailable('llover', { mood: 'indicative', tense: 'present' }).map(u => u.reason)).toEqual(Array(5).fill('impersonal'));
    expect(texts('llover', { mood: 'indicative', tense: 'present' })).toEqual(['llueve']);       // review I4: no subject
    expect(texts('llover', { mood: 'indicative', tense: 'perfect' })).toEqual(['ha llovido']);
    expect(unavailable('llover', { mood: 'imperative' }).map(u => u.reason)).toEqual(Array(6).fill('impersonal'));
    expect(unavailable('llover', { mood: 'imperative', subject: '2sg.formal' }).map(u => u.reason)).toEqual(Array(2).fill('impersonal'));
    expect(texts('llover', { mood: 'gerund', tense: 'present' })).toEqual(['lloviendo']);
    expect(unavailable('haber', { mood: 'imperative' })).toHaveLength(6);
    expect(unavailable('haber', { mood: 'imperative' }).every(u => u.reason === 'noImperative')).toBe(true);
    expect(unavailable('haber', { mood: 'imperative', subject: '2pl.formal' }).map(u => u.reason)).toEqual(['noImperative', 'noImperative']);
    expect(texts('abolir', { mood: 'indicative', tense: 'present', person: 1, number: 'singular' })).toEqual(['yo abolo']);
    expect(texts('soler', { mood: 'indicative', tense: 'perfect', person: 1, number: 'singular' })).toEqual(['yo he solido']);
    expect(texts('soler', { mood: 'gerund', tense: 'present' })).toEqual(['soliendo']);
    expect(texts('soler', { mood: 'indicative', tense: 'present', person: 1, number: 'singular' })).toEqual(['yo suelo']);
    expect(unavailable('soler', {}).map(u => `${u.target.mood}.${u.target.tense}`)).toEqual(expect.arrayContaining(['indicative.future', 'conditional.past', 'imperative.present', 'subjunctive.future_perfect']));
    // GD §5.6: 46 gaps with usted and ustedes, whose two commands each are asked for by their slots.
    expect(unavailable('soler', {})).toHaveLength(42);
    expect(unavailable('soler', { mood: 'imperative', subject: '2sg.formal' })).toHaveLength(2);
    expect(unavailable('soler', { mood: 'imperative', subject: '2pl.formal' })).toHaveLength(2);
    expect(unavailable('soler', {}).every(u => u.reason === 'defective')).toBe(true);
    expect(unavailable('soler', {})[0]!.source).toMatch(/^https:\/\//u);
  });

  it('explains compound forms and unavailable targets in English and Dutch without gaps', () => {
    for (const verb of ['amar', 'levantarse', 'irse', 'freír', 'llover', 'soler', 'haber']) {
      const conjugated = result(verb, {});
      for (const locale of ['en', 'nl']) {
        for (const item of [...conjugated.forms, ...conjugated.unavailableTargets]) {
          const text = engine.explain('es', item, locale).sections.flatMap(section => section.steps.map(s => s.text)).join('\n');
          expect(text).not.toMatch(/[{}]|undefined/u);
        }
      }
    }
  });
});
