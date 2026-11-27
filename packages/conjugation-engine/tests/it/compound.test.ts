import { describe, expect, it } from 'vitest';
import { conjugate, explain } from '../../src/index.js';
import { all, bare, bareText, formWith, texts } from './helpers.js';

function expectUnavailable(infinitive: string, mood: string, tense: string, reason: string): void {
  const result = conjugate({ language: 'it', infinitive, mood, tense } as never);
  expect(result.forms).toEqual([]);
  expect(result.unavailableTargets.length).toBeGreaterThan(0);
  expect(result.unavailableTargets.every(u => u.reason === reason)).toBe(true);
}

describe('Italian compound tenses and clause', () => {
  it('builds essere compounds with agreement for every gender', () => {
    expect(texts('andare', 'indicative', 'perfect')).toEqual(['io sono andato', 'io sono andata', 'tu sei andato', 'tu sei andata',
      'lui è andato', 'lei è andata', 'noi siamo andati', 'noi siamo andate', 'voi siete andati', 'voi siete andate', 'loro sono andati', 'loro sono andate']);
    const f = formWith('andare', 'indicative', 'perfect', '1sg', 'feminine');
    expect(f.target.agreement).toEqual({ gender: 'feminine', number: 'singular' });
    expect(f.rules).toEqual(expect.arrayContaining(['it.periphrasis.perfect', 'it.clause.agree-subject', 'it.cell.lexical']));
    expect(f.rules.slice(0, 3)).toEqual(['it.periphrasis.perfect', 'it.clause.agree-subject', 'it.clause.subject']);
    expect(texts('andare', 'indicative', 'perfect', { gender: 'feminine' })).not.toContain('lui è andato');
    expect(texts('andare', 'indicative', 'perfect', { gender: 'feminine' })).toContain('lei è andata');
    expect(texts('essere', 'indicative', 'past_anterior')[0]).toBe('io fui stato');
    expect(texts('arrivare', 'indicative', 'pluperfect', { subject: '3sg.f' })).toEqual(['lei era arrivata']);
    expect(texts('nascere', 'subjunctive', 'past', { subject: '1pl' })).toEqual(['noi siamo nati', 'noi siamo nate']);
  });

  it('keeps avere participles invariable', () => {
    expect(texts('mangiare', 'indicative', 'perfect')).toEqual(['io ho mangiato', 'tu hai mangiato', 'lui ha mangiato', 'lei ha mangiato', 'noi abbiamo mangiato', 'voi avete mangiato', 'loro hanno mangiato']);
    expect(formWith('mangiare', 'indicative', 'perfect', '1sg').rules).toContain('it.clause.avere-invariable');
    expect(texts('prendere', 'conditional', 'past', { subject: '3pl' })).toEqual(['loro avrebbero preso']);
    expect(texts('vedere', 'indicative', 'future_perfect', { subject: '2sg' })).toEqual(['tu avrai visto', 'tu avrai veduto']);
  });

  it('conjugates the courtesy forms in the third person', () => {
    expect(texts('andare', 'indicative', 'perfect', { subject: '3sg.formal' })).toEqual(['Lei è andato', 'Lei è andata']);
    expect(texts('parlare', 'indicative', 'present', { subject: '3pl.formal' })).toEqual(['Loro parlano']);
  });

  it('returns both auxiliaries of a dual verb, labelled', () => {
    const forms = all('correre', 'indicative', 'perfect', { subject: '1sg' });
    expect(forms.map(f => [f.text, f.variant.auxiliary])).toEqual([['io sono corso', 'essere'], ['io sono corsa', 'essere'], ['io ho corso', 'avere']]);
    expect(forms.every(f => f.variant.condition)).toBe(true);
    expect(forms.map(f => f.variant.condition)).toEqual(['towards a goal', 'towards a goal', 'the action in itself']);
    expect(texts('correre', 'indicative', 'perfect', { subject: '1sg', auxiliary: 'avere' })).toEqual(['io ho corso']);
  });

  it('builds reflexive forms', () => {
    expect(texts('lavarsi', 'indicative', 'present')[0]).toBe('io mi lavo');
    expect(texts('lavarsi', 'indicative', 'perfect')).toContain('lei si è lavata');
    expect(texts('lavarsi', 'indicative', 'perfect').slice(0, 2)).toEqual(['io mi sono lavato', 'io mi sono lavata']);
    expect(formWith('lavarsi', 'indicative', 'perfect', '3sg.f').rules.slice(0, 4))
      .toEqual(['it.periphrasis.perfect', 'it.clause.agree-subject', 'it.clause.subject', 'it.clause.reflexive-pronoun']);
    expect(bare('lavarsi', 'imperative', 'present')).toEqual(['lavati', 'laviamoci', 'lavatevi']);
    expect(bare('lavarsi', 'imperative', 'present', { subject: '3sg.formal' })).toEqual(['si lavi']);
    expect(bare('lavarsi', 'imperative', 'present', { subject: '3pl.formal' })).toEqual(['si lavino']);
    expect(bare('lavarsi', 'imperative', 'negative')[0]).toBe('non ti lavare/non lavarti');
    expect(bare('lavarsi', 'imperative', 'negative')[1]).toBe('non ci laviamo/non laviamoci');
    expect(bare('lavarsi', 'imperative', 'negative', { subject: '3sg.formal' })).toEqual(['non si lavi']);
    expect(all('lavarsi', 'imperative', 'negative', { subject: '2sg' }).map(f => f.variant.pattern)).toEqual(['proclitic', 'enclitic']);
    expect(formWith('lavarsi', 'imperative', 'negative', '2sg').rules).toEqual(expect.arrayContaining(['it.clause.negative-infinitive', 'it.clause.reflexive-pronoun']));
    expect(bare('farsi', 'imperative', 'present')[0]).toBe('fatti');
    expect(formWith('farsi', 'imperative', 'present', '2sg').rules).toContain('it.clause.enclitic-doubling');
    expect(formWith('farsi', 'imperative', 'present', '2sg').parts.map(p => [p.role, p.text])).toEqual([['lexicalVerb', 'fat'], ['reflexivePronoun', 'ti']]);
    expect(bare('lavarsi', 'infinitive', 'present')).toEqual(['lavarsi']);
    expect(bare('porsi', 'infinitive', 'present')).toEqual(['porsi']);
    expect(bare('lavarsi', 'gerund', 'present')).toEqual(['lavandosi']);
    expect(bare('lavarsi', 'infinitive', 'past')[0]).toBe('essersi lavato');
    expect(bare('lavarsi', 'gerund', 'past')[0]).toBe('essendosi lavato');
    expect(bare('lavarsi', 'participle', 'past')[0]).toBe('lavato');
    expect(texts('lavare', 'indicative', 'present', { reflexive: true, subject: '1pl' })).toEqual(['noi ci laviamo']);
  });

  it('builds non-finite forms', () => {
    expect(bare('andare', 'participle', 'past')).toEqual(['andato', 'andata', 'andati', 'andate']);
    expect(all('andare', 'participle', 'past')[0]!.ruleIds).toContain('it.clause.participle-forms');
    expect(bare('conoscere', 'participle', 'past')[0]).toBe('conosciuto');
    expect(bare('tradurre', 'gerund', 'present')).toEqual(['traducendo']);
    expect(bare('venire', 'participle', 'present')).toEqual(['veniente']);
    expect(bare('salire', 'participle', 'present')).toEqual(['salente/saliente']);
    expect(bare('accendere', 'infinitive', 'past')).toEqual(['avere acceso']);
    expect(bare('cadere', 'gerund', 'past')[0]).toBe('essendo caduto');
    expect(bare('cadere', 'infinitive', 'past')).toEqual(['essere caduto', 'essere caduta', 'essere caduti', 'essere cadute']);
    expect(bare('andare', 'participle', 'past', { gender: 'feminine' })).toEqual(['andata', 'andate']);
  });

  it('declares missing forms through availability', () => {
    expectUnavailable('potere', 'imperative', 'present', 'noImperative');
    expectUnavailable('dovere', 'imperative', 'negative', 'noImperative');
    expectUnavailable('sapere', 'participle', 'present', 'defective');
    expectUnavailable('solere', 'indicative', 'future', 'defective');
    expectUnavailable('piovere', 'imperative', 'present', 'impersonal');
    // Weather verbs (controller ruling): the third person singular only, both auxiliaries, a masculine singular participle.
    const piove = conjugate({ language: 'it', infinitive: 'piovere', mood: 'indicative', tense: 'present' });
    expect(piove.forms.map(f => [f.text, f.target.subject])).toEqual([['piove', '3sg.m']]);
    expect(piove.unavailableTargets.map(u => [u.target.subject, u.reason])).toEqual([
      ['1sg', 'impersonal'], ['2sg', 'impersonal'], ['3sg.f', 'impersonal'], ['1pl', 'impersonal'], ['2pl', 'impersonal'], ['3pl', 'impersonal']]);
    expect(texts('piovere', 'indicative', 'perfect')).toEqual(['è piovuto', 'ha piovuto']);
    expect(bare('nevicare', 'gerund', 'past')).toEqual(['essendo nevicato', 'avendo nevicato']);
    expect(bare('piovere', 'participle', 'past')).toEqual(['piovuto']);
    expect(bare('piovere', 'participle', 'past', { gender: 'feminine' })).toEqual(['piovuto']);
    expect(bare('piovere', 'infinitive', 'past')).toEqual(['essere piovuto', 'avere piovuto']);
    expect(conjugate({ language: 'it', infinitive: 'sapere', mood: 'participle', tense: 'present' }).unavailableTargets[0]!.explanation)
      .toBe('This verb has no Participio Presente.');
    expect(explain('it', conjugate({ language: 'it', infinitive: 'sapere', mood: 'participle', tense: 'present' }).unavailableTargets[0]!, 'nl').sections[0]!.steps[0]!.text)
      .toBe('Dit werkwoord heeft geen Participio Presente.');
    // solere: only the simple indicative (not the future), the subjunctive, the present infinitive and solito (Vocabolario).
    for (const [mood, tense] of [['indicative', 'perfect'], ['indicative', 'future'], ['conditional', 'present'], ['conditional', 'past'],
      ['subjunctive', 'past'], ['infinitive', 'past'], ['gerund', 'past'], ['participle', 'present']] as const) {
      expectUnavailable('solere', mood, tense, 'defective');
    }
    expect(bare('solere', 'indicative', 'present')).toEqual(['soglio', 'suoli', 'suole', 'suole', 'sogliamo', 'solete', 'sogliono']);
    expect(bare('solere', 'participle', 'past')[0]).toBe('solito');
  });

  it('explains every form of a full query in both locales', () => {
    for (const verb of ['andare', 'lavarsi', 'correre', 'sbradurre', 'mentire', 'piovere', 'farsi']) {
      const result = conjugate({ language: 'it', infinitive: verb });
      for (const f of result.forms) {
        for (const locale of ['en', 'nl'] as const) expect(() => explain('it', f, locale), `${verb}: ${bareText(f)}`).not.toThrow();
      }
      for (const u of result.unavailableTargets) for (const locale of ['en', 'nl'] as const) expect(() => explain('it', u, locale)).not.toThrow();
      for (const locale of ['en', 'nl'] as const) expect(() => explain('it', result.analysis, locale)).not.toThrow();
    }
  });
});
