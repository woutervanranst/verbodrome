import { describe, expect, it } from 'vitest';
import { createEngine } from '../../src/core/engine.js';
import { resolvedTargetKey } from '../../src/core/target.js';
import { locales } from '../../src/i18n/locales/index.js';
import { parseConjugationOptions } from '../../src/index.js';
import { packs } from '../../src/languages/index.js';
import type { ConjugatedForm, GrammaticalNumber, Person } from '../../src/types.js';

const engine = createEngine(packs, locales);
const conjugated = (infinitive: string, options: Record<string, unknown>) => engine.conjugate({ language: 'es', infinitive, ...options }).forms;
const bare = (form: ConjugatedForm) => engine.renderParts('es', form.parts, { bare: true });

/** Per target, in catalogue order, the bare texts of its forms joined with ' / '. */
function row(infinitive: string, mood: string, tense: string, extra: Record<string, unknown> = {}): string[] {
  const byTarget = new Map<string, string[]>();
  for (const form of conjugated(infinitive, { mood, tense, ...extra })) {
    const key = resolvedTargetKey(form.target);
    byTarget.set(key, [...byTarget.get(key) ?? [], bare(form)]);
  }
  return [...byTarget.values()].map(texts => texts.join(' / '));
}
const texts = (infinitive: string, options: Record<string, unknown>) => conjugated(infinitive, options).map(form => form.text);
const form = (infinitive: string, mood: string, tense: string, person: Person, number: GrammaticalNumber) =>
  conjugated(infinitive, { mood, tense, person, number });
const analysisOf = (infinitive: string) => packs.es.engine(parseConjugationOptions({ language: 'es', infinitive })).analysis;

describe('Spanish simple tenses', () => {
  it('conjugates the regular models with computed accents', () => {
    expect(row('amar', 'indicative', 'present')).toEqual(['amo', 'amas', 'ama', 'amamos', 'amáis', 'aman']);
    expect(row('amar', 'indicative', 'imperfect')).toEqual(['amaba', 'amabas', 'amaba', 'amábamos', 'amabais', 'amaban']);
    expect(row('amar', 'indicative', 'simple_past')).toEqual(['amé', 'amaste', 'amó', 'amamos', 'amasteis', 'amaron']);
    expect(row('amar', 'indicative', 'future')).toEqual(['amaré', 'amarás', 'amará', 'amaremos', 'amaréis', 'amarán']);
    expect(row('amar', 'conditional', 'present')).toEqual(['amaría', 'amarías', 'amaría', 'amaríamos', 'amaríais', 'amarían']);
    expect(row('amar', 'subjunctive', 'present')).toEqual(['ame', 'ames', 'ame', 'amemos', 'améis', 'amen']);
    expect(row('amar', 'subjunctive', 'imperfect')).toEqual(['amara / amase', 'amaras / amases', 'amara / amase', 'amáramos / amásemos', 'amarais / amaseis', 'amaran / amasen']);
    expect(row('amar', 'subjunctive', 'future')).toEqual(['amare', 'amares', 'amare', 'amáremos', 'amareis', 'amaren']);
    expect(row('temer', 'indicative', 'imperfect')).toEqual(['temía', 'temías', 'temía', 'temíamos', 'temíais', 'temían']);
    expect(row('partir', 'indicative', 'present')).toEqual(['parto', 'partes', 'parte', 'partimos', 'partís', 'parten']);
    expect(row('partir', 'indicative', 'simple_past')).toEqual(['partí', 'partiste', 'partió', 'partimos', 'partisteis', 'partieron']);
  });

  it('applies stem-vowel alternation, raising and the stem of the first person', () => {
    expect(row('sentir', 'indicative', 'simple_past')).toEqual(['sentí', 'sentiste', 'sintió', 'sentimos', 'sentisteis', 'sintieron']);
    expect(row('dormir', 'subjunctive', 'present')).toEqual(['duerma', 'duermas', 'duerma', 'durmamos', 'durmáis', 'duerman']);
    expect(row('pedir', 'indicative', 'present')).toEqual(['pido', 'pides', 'pide', 'pedimos', 'pedís', 'piden']);
    expect(row('jugar', 'subjunctive', 'present')).toEqual(['juegue', 'juegues', 'juegue', 'juguemos', 'juguéis', 'jueguen']);
    expect(row('adquirir', 'indicative', 'present')[0]).toBe('adquiero');
    expect(row('conocer', 'subjunctive', 'present')[0]).toBe('conozca');
    expect(row('conducir', 'indicative', 'simple_past')).toEqual(['conduje', 'condujiste', 'condujo', 'condujimos', 'condujisteis', 'condujeron']);
    expect(row('tener', 'indicative', 'present')).toEqual(['tengo', 'tienes', 'tiene', 'tenemos', 'tenéis', 'tienen']);
    expect(row('tener', 'subjunctive', 'present')[3]).toBe('tengamos');
    expect(row('erguir', 'indicative', 'present')).toEqual(['yergo / irgo', 'yergues / irgues', 'yergue / irgue', 'erguimos', 'erguís', 'yerguen / irguen']);
    expect(row('erguir', 'subjunctive', 'present')[3]).toBe('irgamos');
  });

  it('writes spelling changes and computed accents', () => {
    expect(row('guiar', 'indicative', 'simple_past')).toEqual(['guie', 'guiaste', 'guio', 'guiamos', 'guiasteis', 'guiaron']);
    expect(row('guiar', 'indicative', 'present')).toEqual(['guío', 'guías', 'guía', 'guiamos', 'guiais', 'guían']);
    expect(row('reír', 'subjunctive', 'present')).toEqual(['ría', 'rías', 'ría', 'riamos', 'riais', 'rían']);
    expect(row('reír', 'indicative', 'simple_past')).toEqual(['reí', 'reíste', 'rio', 'reímos', 'reísteis', 'rieron']);
    expect(row('ahincar', 'indicative', 'present')).toEqual(['ahínco', 'ahíncas', 'ahínca', 'ahincamos', 'ahincáis', 'ahíncan']);
    expect(row('averiguar', 'subjunctive', 'present')).toEqual(['averigüe', 'averigües', 'averigüe', 'averigüemos', 'averigüéis', 'averigüen']);
    expect(row('avergonzar', 'indicative', 'present')[0]).toBe('avergüenzo');
    expect(row('oler', 'indicative', 'present')[0]).toBe('huelo');
    expect(row('errar', 'indicative', 'present')[0]).toBe('yerro');
    expect(row('influir', 'indicative', 'present')).toEqual(['influyo', 'influyes', 'influye', 'influimos', 'influís', 'influyen']);
    expect(row('bruñir', 'indicative', 'simple_past')[5]).toBe('bruñeron');
    expect(row('leer', 'indicative', 'simple_past')).toEqual(['leí', 'leíste', 'leyó', 'leímos', 'leísteis', 'leyeron']);
    expect(row('argüir', 'indicative', 'simple_past')[2]).toBe('arguyó');
    expect(row('sacar', 'indicative', 'simple_past')[0]).toBe('saqué');
    expect(row('cazar', 'subjunctive', 'present')[0]).toBe('cace');
    expect(row('coger', 'indicative', 'present')[0]).toBe('cojo');
    expect(row('distinguir', 'indicative', 'present')[0]).toBe('distingo');
    expect(row('delinquir', 'indicative', 'present')[0]).toBe('delinco');
    expect(row('vencer', 'indicative', 'present')[0]).toBe('venzo');
    expect(row('enviar', 'indicative', 'present')).toEqual(['envío', 'envías', 'envía', 'enviamos', 'enviáis', 'envían']);
    expect(row('actuar', 'indicative', 'present')[0]).toBe('actúo');
    expect(row('evacuar', 'indicative', 'present')).toEqual(['evacuo / evacúo', 'evacuas / evacúas', 'evacua / evacúa', 'evacuamos', 'evacuáis', 'evacuan / evacúan']);
    expect(row('reunir', 'subjunctive', 'present')[0]).toBe('reúna');
    expect(row('prohibir', 'indicative', 'present')[0]).toBe('prohíbo');
    expect(row('rehuir', 'indicative', 'simple_past')).toEqual(['rehuí', 'rehuiste', 'rehuyó', 'rehuimos', 'rehuisteis', 'rehuyeron']);
    expect(row('rehuir', 'indicative', 'present')).toEqual(['rehúyo', 'rehúyes', 'rehúye', 'rehuimos', 'rehuís', 'rehúyen']);
    expect(row('rehuir', 'imperative', 'present')[3]).toBe('rehuid');
    expect(form('rehuir', 'imperative', 'present', 2, 'plural')[0]!.ruleIds).not.toContain('es.orth.monosyllable');
  });

  it('builds the imperfect and future subjunctive on the preterite', () => {
    expect(row('tener', 'subjunctive', 'imperfect')[3]).toEqual('tuviéramos / tuviésemos');      // row joins a cell's forms with ' / '
    expect(row('sentir', 'subjunctive', 'imperfect')[0]).toBe('sintiera / sintiese');
    expect(row('leer', 'subjunctive', 'future')[0]).toBe('leyere');
    expect(row('ir', 'subjunctive', 'imperfect')[0]).toBe('fuera / fuese');
    expect(row('decir', 'subjunctive', 'imperfect')[5]).toBe('dijeran / dijesen');
  });

  it('conjugates the irregular verbs from their lexical parts', () => {
    expect(row('dar', 'subjunctive', 'present')).toEqual(['dé', 'des', 'dé', 'demos', 'deis', 'den']);
    expect(row('dar', 'indicative', 'simple_past')).toEqual(['di', 'diste', 'dio', 'dimos', 'disteis', 'dieron']);
    expect(row('estar', 'indicative', 'present')).toEqual(['estoy', 'estás', 'está', 'estamos', 'estáis', 'están']);
    expect(row('estar', 'indicative', 'simple_past')[0]).toBe('estuve');
    expect(row('ver', 'indicative', 'present')).toEqual(['veo', 'ves', 've', 'vemos', 'veis', 'ven']);
    expect(row('ver', 'indicative', 'imperfect')[0]).toBe('veía');
    expect(row('ser', 'indicative', 'present')).toEqual(['soy', 'eres', 'es', 'somos', 'sois', 'son']);
    expect(row('ser', 'subjunctive', 'present')).toEqual(['sea', 'seas', 'sea', 'seamos', 'seáis', 'sean']);
    expect(row('saber', 'indicative', 'present')[0]).toBe('sé');
    expect(row('haber', 'indicative', 'present')).toEqual(['he', 'has', 'ha', 'hemos', 'habéis', 'han']);
    expect(row('haber', 'subjunctive', 'present')[0]).toBe('haya');
    expect(row('hacer', 'indicative', 'simple_past')[2]).toBe('hizo');
    expect(row('poner', 'indicative', 'future')[0]).toBe('pondré');
    expect(row('salir', 'conditional', 'present')[1]).toBe('saldrías');
    expect(row('yacer', 'indicative', 'present')[0]).toBe('yazco / yazgo / yago');
    expect(row('podrir', 'indicative', 'future')[0]).toBe('pudriré');
    expect(row('predecir', 'indicative', 'future')[0]).toBe('predeciré / prediré');
    expect(row('oír', 'indicative', 'present')).toEqual(['oigo', 'oyes', 'oye', 'oímos', 'oís', 'oyen']);
  });

  it('inherits through prefixes and computes the accent on the whole word', () => {
    expect(row('componer', 'indicative', 'simple_past')[0]).toBe('compuse');
    expect(row('rehacer', 'indicative', 'simple_past')).toEqual(['rehíce', 'rehiciste', 'rehízo', 'rehicimos', 'rehicisteis', 'rehicieron']);
    expect(row('deshacer', 'indicative', 'simple_past')[0]).toBe('deshice');
    expect(row('prever', 'indicative', 'present')).toEqual(['preveo', 'prevés', 'prevé', 'prevemos', 'prevéis', 'prevén']);
    expect(row('prever', 'indicative', 'simple_past')).toEqual(['preví', 'previste', 'previó', 'previmos', 'previsteis', 'previeron']);
    expect(row('detener', 'indicative', 'present')[1]).toBe('detienes');
    expect(row('pretender', 'indicative', 'present')[0]).toBe('pretendo');
  });

  it('builds the affirmative imperative', () => {
    expect(row('amar', 'imperative', 'present')).toEqual(['ama', 'ame', 'amemos', 'amad', 'amen']);
    expect(row('poner', 'imperative', 'present')[0]).toBe('pon');
    expect(row('componer', 'imperative', 'present')[0]).toBe('compón');
    expect(row('detener', 'imperative', 'present')[0]).toBe('detén');
    expect(row('ser', 'imperative', 'present')).toEqual(['sé', 'sea', 'seamos', 'sed', 'sean']);
    expect(row('ir', 'imperative', 'present')).toEqual(['ve', 'vaya', 'vamos / vayamos', 'id', 'vayan']);
    expect(row('dormir', 'imperative', 'present')).toEqual(['duerme', 'duerma', 'durmamos', 'dormid', 'duerman']);
    expect(row('oír', 'imperative', 'present')[3]).toBe('oíd');
    expect(row('satisfacer', 'imperative', 'present')[0]).toBe('satisfaz / satisface');
    expect(row('prever', 'imperative', 'present')[0]).toBe('prevé');
  });

  it('gives finite forms their subject pronoun and que', () => {
    expect(texts('amar', { mood: 'indicative', tense: 'present', person: 1, number: 'singular' })).toEqual(['yo amo']);
    expect(texts('amar', { mood: 'subjunctive', tense: 'present', person: 1, number: 'singular' })).toEqual(['que yo ame']);
    expect(texts('amar', { mood: 'imperative', tense: 'present', person: 2, number: 'singular' })).toEqual(['ama']);
    expect(bare(form('amar', 'subjunctive', 'present', 1, 'singular')[0]!)).toBe('ame');
  });

  it('records the steps of each form', () => {
    expect(form('sentir', 'indicative', 'simple_past', 3, 'singular')[0]!.ruleIds).toEqual(
      ['es.clause.subject', 'es.stem.root', 'es.stem.raising', 'es.end.preterite', 'es.orth.accent-general']);   // form-level steps first, then the verb part's
    expect(analysisOf('sentir').steps!.map(s => s.rule)).toEqual(['es.classify.conjugation', 'es.classify.lexicon']);
    expect(form('guiar', 'indicative', 'simple_past', 3, 'singular')[0]!.ruleIds).toContain('es.orth.monosyllable');
    expect(form('amar', 'subjunctive', 'present', 1, 'singular')[0]!.ruleIds.slice(0, 2)).toEqual(['es.clause.que', 'es.clause.subject']);
    expect(form('amar', 'subjunctive', 'imperfect', 1, 'singular').map(f => f.variant.pattern)).toEqual(['ra', 'se']);
    expect(form('amar', 'subjunctive', 'future', 1, 'singular')[0]!.variant.usage).toBe('dated');
    expect(form('dar', 'subjunctive', 'present', 1, 'singular')[0]!.ruleIds).toContain('es.orth.diacritic');
    expect(form('yacer', 'indicative', 'present', 1, 'singular').map(f => f.variant.pattern)).toEqual(['zc', 'zg', 'g']);
  });

  it('explains every simple form in English and Dutch without gaps', () => {
    for (const verb of ['amar', 'sentir', 'guiar', 'averiguar', 'tener', 'dar', 'ser', 'ir', 'componer', 'erguir', 'evacuar', 'leer', 'blorecer']) {
      for (const tense of ['present', 'imperfect', 'simple_past', 'future']) {
        for (const item of conjugated(verb, { mood: 'indicative', tense })) {
          for (const locale of ['en', 'nl']) {
            const text = engine.explain('es', item, locale).sections.flatMap(section => section.steps.map(s => s.text)).join('\n');
            expect(text).not.toMatch(/[{}]|undefined/u);
          }
        }
      }
      for (const mood of ['subjunctive', 'imperative', 'conditional']) {
        for (const item of conjugated(verb, { mood, tense: mood === 'subjunctive' ? 'imperfect' : 'present' })) {
          expect(engine.explain('es', item, 'nl').sections.length).toBeGreaterThan(0);
        }
      }
    }
  });
});
