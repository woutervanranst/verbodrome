/**
 * Real verbs that are not in the corpus (grammar design §8.2, updated for the controller's rulings). The DLE tables
 * could not be opened (rae.es refuses automated reading, no browser): these expectations are derived from the cited
 * rules and are unverified against the DLE; see the stint report. Through the public API only.
 */
import { describe, expect, it } from 'vitest';
import { conjugate, renderParts } from '../../src/index.js';

type Person = 1 | 2 | 3;
type Number = 'singular' | 'plural';
type Query = Readonly<Record<string, unknown>>;
const bare = (infinitive: string, options: Query): string[] =>
  conjugate({ language: 'es', infinitive, ...options } as never).forms.map(form => renderParts('es', form.parts, { bare: true }));
const ind = (tense: string, person: Person, number: Number = 'singular'): Query => ({ mood: 'indicative', tense, person, number });
const sub = (tense: string, person: Person, number: Number = 'singular'): Query => ({ mood: 'subjunctive', tense, person, number });
const imp = (person: Person, number: Number = 'singular'): Query => ({ mood: 'imperative', tense: 'present', person, number });
const gerund: Query = { mood: 'gerund', tense: 'present' };
const participle: Query = { mood: 'participle' };

const verbs: readonly (readonly [string, readonly (readonly [Query, readonly string[]])[]])[] = [
  ['enviar', [[ind('present', 1), ['envío']], [ind('present', 2), ['envías']], [ind('present', 1, 'plural'), ['enviamos']], [ind('simple_past', 1), ['envié']],
    [ind('simple_past', 3), ['envió']], [sub('present', 1), ['envíe']], [sub('present', 2, 'plural'), ['enviéis']], [imp(2), ['envía']]]],
  ['cambiar', [[ind('present', 1), ['cambio']], [ind('present', 2), ['cambias']], [ind('simple_past', 1), ['cambié']], [ind('simple_past', 3), ['cambió']], [sub('present', 1), ['cambie']]]],
  ['continuar', [[ind('present', 1), ['continúo']], [ind('present', 2), ['continúas']], [ind('present', 1, 'plural'), ['continuamos']], [sub('present', 1), ['continúe']]]],
  ['aislar', [[ind('present', 1), ['aíslo']], [ind('present', 2), ['aíslas']], [ind('present', 1, 'plural'), ['aislamos']], [sub('present', 1), ['aísle']]]],
  ['rehusar', [[ind('present', 1), ['rehúso']], [imp(2), ['rehúsa']], [ind('present', 1, 'plural'), ['rehusamos']]]],
  ['construir', [[ind('present', 1), ['construyo']], [ind('present', 1, 'plural'), ['construimos']], [ind('present', 2, 'plural'), ['construís']], [ind('simple_past', 1), ['construí']],
    [ind('simple_past', 3), ['construyó']], [ind('imperfect', 1), ['construía']], [gerund, ['construyendo']], [participle, ['construido']]]],
  ['huir', [[ind('present', 1), ['huyo']], [ind('present', 2, 'plural'), ['huis']], [ind('present', 1, 'plural'), ['huimos']], [ind('simple_past', 1), ['hui']],
    [ind('simple_past', 3), ['huyó']], [ind('imperfect', 1), ['huía']], [gerund, ['huyendo']], [participle, ['huido']]]],
  ['rehuir', [[ind('present', 1), ['rehúyo']], [ind('simple_past', 1), ['rehuí']], [ind('present', 2, 'plural'), ['rehuís']]]],
  ['leer', [[ind('present', 1), ['leo']], [ind('simple_past', 1), ['leí']], [ind('simple_past', 2), ['leíste']], [ind('simple_past', 3), ['leyó']],
    [ind('simple_past', 3, 'plural'), ['leyeron']], [gerund, ['leyendo']], [participle, ['leído']]]],
  ['freír', [[ind('present', 1), ['frío']], [ind('present', 1, 'plural'), ['freímos']], [ind('simple_past', 3), ['frio']], [ind('simple_past', 3, 'plural'), ['frieron']],
    [sub('present', 1), ['fría']], [sub('present', 2, 'plural'), ['friais']], [gerund, ['friendo']], [participle, ['frito', 'freído']]]],
  ['sofreír', [[ind('present', 1), ['sofrío']], [participle, ['sofrito', 'sofreído']]]],
  ['sonreír', [[ind('present', 1), ['sonrío']], [ind('present', 1, 'plural'), ['sonreímos']], [ind('simple_past', 3), ['sonrió']], [sub('present', 2, 'plural'), ['sonriáis']], [gerund, ['sonriendo']]]],
  ['entreoír', [[ind('present', 1), ['entreoigo']], [ind('present', 3), ['entreoye']]]],
  ['conducir', [[ind('present', 1), ['conduzco']], [ind('simple_past', 1), ['conduje']], [ind('simple_past', 3), ['condujo']], [ind('simple_past', 3, 'plural'), ['condujeron']],
    [sub('imperfect', 1), ['condujera', 'condujese']], [gerund, ['conduciendo']]]],
  ['componer', [[ind('present', 1), ['compongo']], [ind('simple_past', 1), ['compuse']], [ind('future', 1), ['compondré']], [imp(2), ['compón']], [participle, ['compuesto']]]],
  ['deshacer', [[ind('present', 1), ['deshago']], [ind('simple_past', 1), ['deshice']], [ind('simple_past', 3), ['deshizo']], [ind('future', 1), ['desharé']], [imp(2), ['deshaz']], [participle, ['deshecho']]]],
  ['rehacer', [[ind('present', 1), ['rehago']], [ind('simple_past', 1), ['rehíce']], [ind('simple_past', 3), ['rehízo']], [ind('future', 1), ['reharé']], [imp(2), ['rehaz']], [participle, ['rehecho']]]],
  ['prever', [[ind('present', 1), ['preveo']], [ind('present', 2), ['prevés']], [ind('present', 3), ['prevé']], [ind('present', 1, 'plural'), ['prevemos']], [ind('present', 3, 'plural'), ['prevén']],
    [ind('simple_past', 1), ['preví']], [ind('simple_past', 3), ['previó']], [sub('present', 1), ['prevea']], [participle, ['previsto']]]],
  ['mantener', [[ind('present', 1), ['mantengo']], [ind('present', 2), ['mantienes']], [ind('simple_past', 1), ['mantuve']], [ind('future', 1), ['mantendré']], [imp(2), ['mantén']], [sub('present', 1), ['mantenga']]]],
  ['retrotraer', [[ind('present', 1), ['retrotraigo']], [ind('simple_past', 3, 'plural'), ['retrotrajeron']]]],
  ['morir', [[ind('present', 1), ['muero']], [ind('present', 1, 'plural'), ['morimos']], [ind('simple_past', 3), ['murió']], [ind('simple_past', 3, 'plural'), ['murieron']],
    [sub('present', 1, 'plural'), ['muramos']], [gerund, ['muriendo']], [participle, ['muerto']]]],
  ['vestirse', [[ind('present', 1), ['me visto']], [ind('present', 1, 'plural'), ['nos vestimos']], [ind('simple_past', 3), ['se vistió']], [imp(2), ['vístete']],
    [imp(1, 'plural'), ['vistámonos']], [imp(2, 'plural'), ['vestíos']], [gerund, ['vistiéndose']]]],
  ['sentarse', [[ind('present', 1), ['me siento']], [imp(2), ['siéntate']], [imp(1, 'plural'), ['sentémonos']], [imp(2, 'plural'), ['sentaos']], [gerund, ['sentándose']]]],
  ['reírse', [[ind('present', 1), ['me río']], [ind('simple_past', 3), ['se rio']], [imp(2), ['ríete']], [imp(1, 'plural'), ['riámonos']], [imp(2, 'plural'), ['reíos']], [gerund, ['riéndose']]]],
  ['dormirse', [[ind('present', 1), ['me duermo']], [ind('simple_past', 3), ['se durmió']], [imp(2), ['duérmete']], [imp(1, 'plural'), ['durmámonos']], [imp(2, 'plural'), ['dormíos']]]],
  ['irse', [[ind('present', 1), ['me voy']], [imp(2), ['vete']], [imp(3), ['váyase']], [imp(1, 'plural'), ['vámonos', 'vayámonos']], [imp(2, 'plural'), ['iros', 'idos']], [gerund, ['yéndose']]]],
  ['cerrar', [[ind('present', 1), ['cierro']], [ind('present', 1, 'plural'), ['cerramos']]]],
  ['contar', [[ind('present', 1), ['cuento']], [ind('present', 1, 'plural'), ['contamos']]]],
  ['entender', [[ind('present', 1), ['entiendo']], [ind('present', 1, 'plural'), ['entendemos']]]],
  ['pretender', [[ind('present', 1), ['pretendo']], [ind('present', 2), ['pretendes']]]],
  ['devolver', [[ind('present', 1), ['devuelvo']], [ind('present', 1, 'plural'), ['devolvemos']], [participle, ['devuelto']]]],
  ['escribir', [[participle, ['escrito']]]],
  ['abrir', [[participle, ['abierto']]]],
  ['romper', [[participle, ['roto']]]],
  ['imprimir', [[participle, ['impreso', 'imprimido']]]],
  ['nevar', [[ind('present', 3), ['nieva']], [ind('present', 1), []]]],
  ['estudiar', [[ind('present', 1), ['estudio']], [ind('present', 2, 'plural'), ['estudiáis']], [ind('simple_past', 1), ['estudié']], [sub('present', 2, 'plural'), ['estudiéis']]]],
  ['argüir', [[ind('present', 1), ['arguyo']], [ind('present', 1, 'plural'), ['argüimos']], [ind('simple_past', 1), ['argüí']], [ind('simple_past', 3), ['arguyó']], [gerund, ['arguyendo']], [participle, ['argüido']]]],
  ['concernir', [[ind('present', 3), ['concierne']], [ind('present', 1), []]]],
  ['pudrir', [[ind('present', 1), ['pudro']], [participle, ['podrido']]]],
];

describe('Spanish real verbs outside the corpus (grammar design §8.2)', () => {
  it.each(verbs)('%s', (verb, rows) => {
    for (const [query, forms] of rows) expect(bare(verb, query), JSON.stringify(query)).toEqual(forms);
  });
});
