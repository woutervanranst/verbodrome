/**
 * The findings of the stint-1 review (`.superpowers/sdd/lang-es/stint-1-review.md`), one block per finding: the forms
 * the review found wrong or missing, and the explanation defects.
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
function row(infinitive: string, mood: string, tense: string): string[] {
  const byTarget = new Map<string, string[]>();
  for (const form of conjugated(infinitive, { mood, tense }).forms) {
    const key = resolvedTargetKey(form.target);
    byTarget.set(key, [...byTarget.get(key) ?? [], bare(form)]);
  }
  return [...byTarget.values()].map(forms => forms.join(' / '));
}
const analysisOf = (infinitive: string) => packs.es.engine(parseConjugationOptions({ language: 'es', infinitive })).analysis;
const ids = (infinitive: string) => analysisOf(infinitive).steps!.map(s => s.rule);
const explained = (form: ConjugatedForm, locale = 'en') =>
  engine.explain('es', form, locale).sections.flatMap(section => section.steps.map(s => s.text)).join('\n');

describe('review C4: every -eír verb follows reír, every -oír verb follows oír', () => {
  it('conjugates unlisted -eír verbs like reír', () => {
    expect(row('sofreír', 'indicative', 'present')).toEqual(['sofrío', 'sofríes', 'sofríe', 'sofreímos', 'sofreís', 'sofríen']);
    expect(row('sofreír', 'indicative', 'simple_past')[2]).toBe('sofrió');
    expect(row('sofreír', 'subjunctive', 'present')[3]).toBe('sofriamos');
    expect(texts('sofreír', { mood: 'gerund', tense: 'present' })).toEqual(['sofriendo']);
    expect(row('refreír', 'indicative', 'present')[0]).toBe('refrío');
    expect(row('engreír', 'indicative', 'present')[0]).toBe('engrío');
    expect(row('desleír', 'indicative', 'present')[0]).toBe('deslío');
    expect(row('reír', 'indicative', 'present')).toEqual(['río', 'ríes', 'ríe', 'reímos', 'reís', 'ríen']);
    expect(ids('engreír')).toContain('es.classify.eir');
    expect(ids('engreír')).not.toContain('es.classify.prefixed');
    expect(analysisOf('engreír').classification).toBe('reír');
    expect(analysisOf('reír').classification).toBe('reír');
  });

  it('conjugates unlisted -oír verbs like oír', () => {
    expect(row('entreoír', 'indicative', 'present')).toEqual(['entreoigo', 'entreoyes', 'entreoye', 'entreoímos', 'entreoís', 'entreoyen']);
    expect(row('desoír', 'subjunctive', 'present')[0]).toBe('desoiga');
    expect(row('entreoír', 'indicative', 'simple_past')[2]).toBe('entreoyó');
    expect(ids('entreoír')).toContain('es.classify.oir');
    expect(analysisOf('entreoír').classification).toBe('oír');
  });
});

describe('review C1: pudrir and podrir are one verb', () => {
  it('gives pudr- everywhere but the participle podrido, and podrir as a second infinitive', () => {
    for (const verb of ['pudrir', 'podrir']) {
      expect(texts(verb, { mood: 'participle' })).toEqual(['podrido']);
      expect(texts(verb, { mood: 'infinitive', tense: 'present' })).toEqual(['pudrir', 'podrir']);
      expect(texts(verb, { mood: 'indicative', tense: 'perfect', person: 1, number: 'singular' })).toEqual(['yo he podrido']);
      expect(row(verb, 'indicative', 'present')[0]).toBe('pudro');
      expect(row(verb, 'indicative', 'future')[0]).toBe('pudriré');
      expect(row(verb, 'imperative', 'present')[3]).toBe('pudrid');
    }
    expect(conjugated('pudrir', { mood: 'infinitive', tense: 'present' }).forms.map(form => form.variant.pattern)).toEqual([null, 'podrir']);
    expect(analysisOf('podrir').classification).toBe('pudrir');
  });
});

describe('review M2 and row 8: derivatives listed with their base', () => {
  it('takes the participle and the stem vowel of the listed base', () => {
    expect(texts('devolver', { mood: 'participle' })).toEqual(['devuelto']);
    expect(row('devolver', 'indicative', 'present')[0]).toBe('devuelvo');
    expect(texts('descubrir', { mood: 'participle' })).toEqual(['descubierto']);
    expect(texts('entreabrir', { mood: 'participle' })).toEqual(['entreabierto']);
    expect(row('recocer', 'indicative', 'present')).toEqual(['recuezo', 'recueces', 'recuece', 'recocemos', 'recocéis', 'recuecen']);
    expect(analysisOf('devolver').classification).toBe('volver');
    expect(ids('devolver')).toEqual(['es.classify.conjugation', 'es.classify.lexicon']);
  });
});

describe('review M3: models and assumptions', () => {
  it('names construir as the model of -uir verbs and assumes nothing for ui', () => {
    expect(analysisOf('huir').classification).toBe('construir');
    expect(analysisOf('argüir').classification).toBe('construir');
    expect(ids('cuidar')).not.toContain('es.classify.assume-diphthong');
    expect(ids('blaular')).toContain('es.classify.assume-diphthong');
  });
});

describe('review C2 and E1: the regular participle of a doublet is derived, not listed', () => {
  it('explains freído by the participle rule and frito as the listed word', () => {
    const [frito, freido] = conjugated('freír', { mood: 'participle' }).forms;
    expect(explained(freido!)).toContain('Participle: add -ido to fre-');
    expect(explained(freido!)).not.toContain('irregular');
    expect(freido!.ruleIds).toEqual(['es.stem.root', 'es.end.participle', 'es.orth.accent-hiatus']);
    expect(frito!.ruleIds).toEqual(['es.cell.participle']);
    expect(explained(conjugated('imprimir', { mood: 'participle' }).forms[1]!, 'nl')).toContain('Participio: voeg -ido toe aan imprim-');
  });
});

describe('review I1, I2 and rows 7, 9-14: missing stem-changing verbs and prefixes', () => {
  it.each([
    ['denegar', 'deniego'], ['desterrar', 'destierro'], ['acrecentar', 'acreciento'], ['recalentar', 'recaliento'], ['desalentar', 'desaliento'],
    ['replegar', 'repliego'], ['restregar', 'restriego'], ['remendar', 'remiendo'], ['deshelar', 'deshielo'], ['desmembrar', 'desmiembro'],
    ['ensangrentar', 'ensangriento'], ['desatender', 'desatiendo'], ['sobrentender', 'sobrentiendo'], ['sobreentender', 'sobreentiendo'],
    ['desentender', 'desentiendo'], ['malentender', 'malentiendo'], ['distender', 'distiendo'], ['interferir', 'interfiero'],
    ['conferir', 'confiero'], ['deferir', 'defiero'], ['disentir', 'disiento'], ['subvertir', 'subvierto'], ['reconvertir', 'reconvierto'],
    ['malherir', 'malhiero'], ['demoler', 'demuelo'], ['remorder', 'remuerdo'], ['condoler', 'conduelo'], ['destorcer', 'destuerzo'],
    ['holgar', 'huelgo'], ['agorar', 'agüero'], ['descolgar', 'descuelgo'], ['desaprobar', 'desapruebo'], ['reencontrar', 'reencuentro'],
    ['recontar', 'recuento'], ['resonar', 'resueno'], ['desconsolar', 'desconsuelo'], ['revolcar', 'revuelco'], ['amolar', 'amuelo'],
    ['desvestir', 'desvisto'], ['reexpedir', 'reexpido'], ['amnistiar', 'amnistío'], ['triar', 'trío'], ['retrotraer', 'retrotraigo'],
  ])('%s → %s', (verb, first) => expect(row(verb, 'indicative', 'present')[0]).toBe(first));

  it('raises the vowel of the new -ir verbs and inherits through retro-', () => {
    expect(row('interferir', 'indicative', 'simple_past')[2]).toBe('interfirió');
    expect(row('disentir', 'indicative', 'simple_past')[2]).toBe('disintió');
    expect(row('retrotraer', 'indicative', 'simple_past')[0]).toBe('retrotraje');
    expect(ids('retrotraer')).toContain('es.classify.prefixed');
    expect(row('revolcar', 'indicative', 'simple_past')[0]).toBe('revolqué');
  });
});

describe('controller rulings on variants', () => {
  it('gives errar the American erro beside yerro, tagged by region', () => {
    const forms = conjugated('errar', { mood: 'indicative', tense: 'present', person: 1, number: 'singular' }).forms;
    expect(forms.map(form => form.text)).toEqual(['yo yerro', 'yo erro']);
    expect(forms[1]!.variant).toMatchObject({ region: 'America' });
    expect(row('errar', 'indicative', 'present')[3]).toBe('erramos');
    expect(ids('errar')).toContain('es.classify.regional-variant');
  });

  it('gives engrosar the regular conjugation first and the o-ue one beside it', () => {
    expect(row('engrosar', 'indicative', 'present')[0]).toBe('engroso / engrueso');
  });

  it('puts the irregular future of the decir family first', () => {
    expect(row('predecir', 'indicative', 'future')[0]).toBe('prediré / predeciré');
    expect(row('contradecir', 'indicative', 'future')[0]).toBe('contradiré / contradeciré');
    expect(row('desdecir', 'conditional', 'present')[0]).toBe('desdiría / desdeciría');
    expect(row('bendecir', 'indicative', 'future')[0]).toBe('bendeciré');
  });

  it('puts iros first and tags idos', () => {
    const forms = conjugated('irse', { mood: 'imperative', tense: 'present', person: 2, number: 'plural' }).forms;
    expect(forms.map(form => form.text)).toEqual(['iros', 'idos']);
    expect(forms.map(form => form.variant.pattern)).toEqual(['iros', 'idos']);
    expect(explained(forms[0]!)).toContain('infinitive ir');
  });
});

describe('review I3 and rows 15-17: defective verbs (NGLE §4.14)', () => {
  const unavailable = (verb: string, options: Record<string, unknown>) => conjugated(verb, options).unavailableTargets;
  it('keeps only the third persons of concernir, atañer, acaecer and acontecer', () => {
    for (const [verb, third] of [['concernir', ['él concierne', 'ellos conciernen']], ['atañer', ['él atañe', 'ellos atañen']],
      ['acaecer', ['él acaece', 'ellos acaecen']], ['acontecer', ['él acontece', 'ellos acontecen']]] as const) {
      expect(texts(verb, { mood: 'indicative', tense: 'present' })).toEqual(third);
      expect(unavailable(verb, { mood: 'indicative', tense: 'present' }).map(u => u.reason)).toEqual(Array(4).fill('defective'));
      expect(unavailable(verb, { mood: 'imperative' })).toHaveLength(10);
    }
    expect(texts('acaecer', { mood: 'subjunctive', tense: 'present', person: 3, number: 'singular' })).toEqual(['que él acaezca']);
    expect(texts('concernir', { mood: 'gerund', tense: 'present' })).toEqual(['concerniendo']);
  });

  it('leaves balbucir without its -zc- forms', () => {
    expect(unavailable('balbucir', { mood: 'indicative', tense: 'present' }).map(u => `${u.target.person}${u.target.number}`)).toEqual(['1singular']);
    expect(texts('balbucir', { mood: 'indicative', tense: 'present', person: 2, number: 'singular' })).toEqual(['tú balbuces']);
    expect(unavailable('balbucir', { mood: 'subjunctive', tense: 'present' })).toHaveLength(6);
    expect(texts('balbucir', { mood: 'imperative', tense: 'present' })).toEqual(['balbuce', 'balbucid']);
    expect(unavailable('balbucir', { mood: 'imperative', tense: 'negative' })).toHaveLength(5);
  });

  it('explains each kind of gap, the future subjunctive of soler included', () => {
    const soler = unavailable('soler', { mood: 'subjunctive', tense: 'future' })[0]!;
    expect(engine.explain('es', soler, 'en').sections[0]!.steps[0]!.text).toContain('future subjunctive');
    const concernir = unavailable('concernir', { mood: 'indicative', tense: 'present' })[0]!;
    expect(engine.explain('es', concernir, 'nl').sections[0]!.steps[0]!.text).toContain('derde persoon');
  });
});

describe('review I4 and row 18: weather verbs have no subject', () => {
  it('gives llover its third person singular only, without a pronoun', () => {
    expect(texts('llover', { mood: 'indicative', tense: 'present' })).toEqual(['llueve']);
    expect(texts('llover', { mood: 'indicative', tense: 'perfect' })).toEqual(['ha llovido']);
    expect(texts('nevar', { mood: 'subjunctive', tense: 'present' })).toEqual(['que nieve']);
    expect(conjugated('llover', { gender: 'feminine', mood: 'indicative', tense: 'present' }).forms).toEqual([]);
    expect(conjugated('llover', { subject: '3sg.f', mood: 'indicative', tense: 'present' }).unavailableTargets.map(u => u.reason)).toEqual(['impersonal']);
    expect(conjugated('llover', { subject: '2sg.formal', mood: 'indicative', tense: 'present' }).unavailableTargets.map(u => u.reason)).toEqual(['impersonal']);
    expect(conjugated('llover', { mood: 'indicative', tense: 'present', person: 3, number: 'singular' }).forms[0]!.ruleIds).not.toContain('es.clause.subject');
  });
});

export { analysisOf, bare, conjugated, explained, ids, row, texts };
