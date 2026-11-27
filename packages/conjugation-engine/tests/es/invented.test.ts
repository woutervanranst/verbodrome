/**
 * Invented verbs (grammar design §8.1): one row per rule, with the forms derived by hand from the rules and the
 * assumptions the analysis must record. Through the public API only.
 */
import { describe, expect, it } from 'vitest';
import { conjugate, renderParts } from '../../src/index.js';

type Query = Readonly<Record<string, unknown>>;
const bare = (infinitive: string, options: Query): string[] =>
  conjugate({ language: 'es', infinitive, ...options } as never).forms.map(form => renderParts('es', form.parts, { bare: true }));
const at = (mood: string, tense: string, person?: 1 | 2 | 3, number?: 'singular' | 'plural'): Query =>
  ({ mood, tense, ...(person === undefined ? {} : { person, number }) });
const assumptions = (infinitive: string, options: Query = {}): string[] =>
  conjugate({ language: 'es', infinitive, mood: 'infinitive', tense: 'present', ...options } as never).analysis.steps!.map(s => s.rule);

/** Forms by cell: `[mood, tense, person?, number?]` with the bare forms of that cell (one target unless no person is given). */
type Row = readonly [Query, readonly string[]];
const ind = (tense: string, person: 1 | 2 | 3, number: 'singular' | 'plural' = 'singular') => at('indicative', tense, person, number);
const sub = (tense: string, person: 1 | 2 | 3, number: 'singular' | 'plural' = 'singular') => at('subjunctive', tense, person, number);
const imp = (person: 1 | 2 | 3, number: 'singular' | 'plural' = 'singular') => at('imperative', 'present', person, number);

const verbs: readonly { verb: string; options?: Query; rows: readonly Row[]; steps?: readonly string[]; absent?: readonly string[] }[] = [
  {
    verb: 'blorpar', steps: ['es.classify.assume-regular'], rows: [
      [ind('present', 1), ['blorpo']], [ind('simple_past', 1), ['blorpé']], [ind('simple_past', 3), ['blorpó']], [ind('imperfect', 1, 'plural'), ['blorpábamos']],
      [sub('present', 1), ['blorpe']], [sub('imperfect', 1), ['blorpara', 'blorpase']], [sub('future', 1), ['blorpare']],
      [imp(2, 'plural'), ['blorpad']], [at('gerund', 'present'), ['blorpando']], [at('participle', 'past'), ['blorpado']],
    ],
  },
  { verb: 'fluzar', rows: [[ind('simple_past', 1), ['flucé']], [sub('present', 1), ['fluce']], [sub('present', 1, 'plural'), ['flucemos']], [ind('simple_past', 3), ['fluzó']]] },
  { verb: 'trobacar', rows: [[ind('simple_past', 1), ['trobaqué']], [sub('present', 1), ['trobaque']], [ind('simple_past', 3), ['trobacó']]] },
  { verb: 'drolgar', rows: [[ind('simple_past', 1), ['drolgué']], [sub('present', 1), ['drolgue']]] },
  { verb: 'rimiguar', rows: [[ind('present', 1), ['rimiguo']], [ind('simple_past', 1), ['rimigüé']], [sub('present', 1), ['rimigüe']], [ind('simple_past', 3), ['rimiguó']]] },
  {
    verb: 'plontuar', steps: ['es.classify.uar-stress'], rows: [
      [ind('present', 1), ['plontúo']], [ind('present', 2), ['plontúas']], [sub('present', 1), ['plontúe']], [ind('present', 1, 'plural'), ['plontuamos']], [ind('simple_past', 1), ['plontué']],
    ],
  },
  { verb: 'flobiar', steps: ['es.classify.assume-glide'], rows: [[ind('present', 1), ['flobio']], [ind('simple_past', 1), ['flobié']], [sub('present', 1), ['flobie']]] },
  { verb: 'flobiar', options: { stems: { stress: 'hiatus' } }, absent: ['es.classify.assume-glide'], rows: [[ind('present', 1), ['flobío']], [sub('present', 1), ['flobíe']]] },
  { verb: 'blaular', steps: ['es.classify.assume-diphthong'], rows: [[ind('present', 1), ['blaulo']]] },
  { verb: 'blaular', options: { stems: { stress: 'hiatus' } }, rows: [[ind('present', 1), ['blaúlo']]] },
  {
    verb: 'troger', rows: [
      [ind('present', 1), ['trojo']], [sub('present', 1), ['troja']], [sub('present', 1, 'plural'), ['trojamos']], [ind('present', 2), ['troges']], [ind('simple_past', 1), ['trogí']],
    ],
  },
  { verb: 'blorecer', steps: ['es.classify.assume-zc'], rows: [[ind('present', 1), ['blorezco']], [sub('present', 1), ['blorezca']], [ind('present', 2), ['bloreces']]] },
  { verb: 'blorecer', options: { stems: { zc: false } }, absent: ['es.classify.assume-zc'], rows: [[ind('present', 1), ['blorezo']], [sub('present', 1), ['bloreza']]] },
  {
    verb: 'treer', rows: [
      [ind('present', 1), ['treo']], [ind('simple_past', 1), ['treí']], [ind('simple_past', 2), ['treíste']], [ind('simple_past', 3), ['treyó']],
      [ind('simple_past', 3, 'plural'), ['treyeron']], [at('gerund', 'present'), ['treyendo']], [at('participle', 'past'), ['treído']], [sub('imperfect', 1), ['treyera', 'treyese']],
    ],
  },
  {
    verb: 'fluñir', rows: [
      [ind('present', 1), ['fluño']], [ind('simple_past', 3), ['fluñó']], [ind('simple_past', 3, 'plural'), ['fluñeron']], [at('gerund', 'present'), ['fluñendo']], [sub('imperfect', 1), ['fluñera', 'fluñese']],
    ],
  },
  {
    verb: 'plostuir', rows: [
      [ind('present', 1), ['plostuyo']], [ind('present', 2), ['plostuyes']], [ind('present', 1, 'plural'), ['plostuimos']], [ind('present', 2, 'plural'), ['plostuís']],
      [ind('simple_past', 1), ['plostuí']], [ind('simple_past', 3), ['plostuyó']], [at('gerund', 'present'), ['plostuyendo']], [at('participle', 'past'), ['plostuido']],
    ],
  },
  {
    verb: 'bladucir', steps: ['es.classify.family'], rows: [
      [ind('present', 1), ['bladuzco']], [ind('simple_past', 1), ['bladuje']], [ind('simple_past', 3), ['bladujo']], [ind('simple_past', 3, 'plural'), ['bladujeron']],
      [sub('imperfect', 1), ['bladujera', 'bladujese']], [at('participle', 'past'), ['bladucido']],
    ],
  },
  {
    verb: 'blorparse', rows: [
      [ind('present', 1), ['me blorpo']], [imp(2), ['blórpate']], [imp(3), ['blórpese']], [imp(1, 'plural'), ['blorpémonos']], [imp(2, 'plural'), ['blorpaos']],
      [imp(3, 'plural'), ['blórpense']], [at('imperative', 'negative', 2, 'singular'), ['no te blorpes']], [at('infinitive', 'present'), ['blorparse']],
      [at('gerund', 'present'), ['blorpándose']], [at('infinitive', 'past'), ['haberse blorpado']],
    ],
  },
  {
    verb: 'plentar', options: { classHint: 'e-ie' }, steps: ['es.classify.hint'], absent: ['es.classify.assume-regular'], rows: [
      [ind('present', 1), ['pliento']], [ind('present', 2), ['plientas']], [ind('present', 1, 'plural'), ['plentamos']], [sub('present', 1), ['pliente']],
      [sub('present', 1, 'plural'), ['plentemos']], [imp(2), ['plienta']],
    ],
  },
  {
    verb: 'flentir', options: { classHint: 'e-ie' }, rows: [
      [ind('present', 1), ['fliento']], [ind('present', 2), ['flientes']], [ind('present', 1, 'plural'), ['flentimos']], [ind('simple_past', 3), ['flintió']],
      [ind('simple_past', 3, 'plural'), ['flintieron']], [sub('present', 1), ['flienta']], [sub('present', 1, 'plural'), ['flintamos']],
      [at('gerund', 'present'), ['flintiendo']], [sub('imperfect', 1), ['flintiera', 'flintiese']], [at('participle', 'past'), ['flentido']],
    ],
  },
  {
    verb: 'tredir', options: { classHint: 'e-i' }, rows: [
      [ind('present', 1), ['trido']], [ind('present', 1, 'plural'), ['tredimos']], [ind('simple_past', 3), ['tridió']], [sub('present', 1), ['trida']],
      [sub('present', 1, 'plural'), ['tridamos']], [at('gerund', 'present'), ['tridiendo']], [at('participle', 'past'), ['tredido']],
    ],
  },
  {
    verb: 'protener', steps: ['es.classify.prefixed'], rows: [
      [ind('present', 1), ['protengo']], [ind('simple_past', 1), ['protuve']], [ind('future', 1), ['protendré']], [imp(2), ['protén']], [at('participle', 'past'), ['protenido']],
    ],
  },
  { verb: 'blotener', steps: ['es.classify.assume-regular'], rows: [[ind('present', 1, 'plural'), ['blotenemos']], [ind('present', 3), ['blotene']]] },
  { verb: 'reir', steps: ['es.classify.restore-accent'], rows: [[ind('present', 1), ['río']], [ind('simple_past', 3), ['rio']], [ind('present', 1, 'plural'), ['reímos']]] },
  // Rule classes (controller ruling): any -eír verb follows reír, any -oír verb follows oír.
  { verb: 'blodeír', steps: ['es.classify.eir'], rows: [[ind('present', 1), ['blodío']], [ind('simple_past', 3), ['blodió']], [at('gerund', 'present'), ['blodiendo']]] },
  { verb: 'trasoír', steps: ['es.classify.oir'], rows: [[ind('present', 1), ['trasoigo']], [ind('present', 2), ['trasoyes']], [ind('simple_past', 3), ['trasoyó']]] },
];

describe('Spanish invented verbs (grammar design §8.1)', () => {
  it.each(verbs.map(entry => [`${entry.verb}${entry.options ? ` ${JSON.stringify(entry.options)}` : ''}`, entry] as const))('%s', (_, entry) => {
    for (const [query, forms] of entry.rows) expect(bare(entry.verb, { ...entry.options, ...query }), JSON.stringify(query)).toEqual(forms);
    const steps = assumptions(entry.verb, entry.options);
    for (const id of entry.steps ?? []) expect(steps).toContain(id);
    for (const id of entry.absent ?? []) expect(steps).not.toContain(id);
  });
});
