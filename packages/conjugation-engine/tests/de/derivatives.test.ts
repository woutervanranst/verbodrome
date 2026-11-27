/**
 * Derivatives: which prefixed and particle verbs inherit a listed root's forms, how stacked prefixes are read, and
 * which perfect auxiliary a derivative takes. Every expected form is the DWDS grammar line of the lemma
 * (https://www.dwds.de/wb/<lemma>).
 */
import { describe, expect, it } from 'vitest';
import { conjugate } from '../../src/index.js';
import type { GrammaticalNumber, Person } from '../../src/types.js';

const result = (lemma: string, mood: string, tense?: string, person?: Person, number?: GrammaticalNumber, extra: Record<string, unknown> = {}) =>
  conjugate({
    language: 'de', infinitive: lemma, mood, ...(tense === undefined ? {} : { tense }),
    ...(person === undefined ? {} : { person, number }), ...extra,
  } as never);
const texts = (...args: Parameters<typeof result>) => result(...args).forms.map(f => f.text);
const ich = (lemma: string, tense: string, extra: Record<string, unknown> = {}) => texts(lemma, 'indicative', tense, 1, 'singular', extra);
const er = (lemma: string, tense: string) => texts(lemma, 'indicative', tense, 3, 'singular');
const participle = (lemma: string) => texts(lemma, 'participle', 'past');
const analysis = (lemma: string, extra: Record<string, unknown> = {}) => conjugate({ language: 'de', infinitive: lemma, mood: 'infinitive', tense: 'present', ...extra } as never).analysis;
const ruleIds = (lemma: string, extra: Record<string, unknown> = {}) => (analysis(lemma, extra).steps ?? []).map(s => s.rule);

describe('German derivatives', () => {
  it('does not inherit a strong root for a verb that only looks derived', () => {
    expect(ich('begleiten', 'past')).toEqual(['ich begleitete']);
    expect(ich('begleiten', 'perfect')).toEqual(['ich habe begleitet']);
    expect(participle('begleiten')).toEqual(['begleitet']);
    expect(ich('verleiden', 'past')).toEqual(['ich verleidete']);
    expect(ich('verleiden', 'perfect')).toEqual(['ich habe verleidet']);
    expect(ruleIds('begleiten')).not.toContain('de.classify.derivative');
    // Real derivatives keep inheriting: DWDS behängte / behing, behängt / behangen.
    expect(er('behängen', 'past')).toEqual(['er behängte', 'er behing']);
    expect(participle('erhängen')).toEqual(['erhängt', 'erhangen']);
    for (const [lemma, past, part] of [
      ['beantragen', 'beantragte', 'beantragt'], ['veranlassen', 'veranlasste', 'veranlasst'], ['handhaben', 'handhabte', 'gehandhabt'],
      ['bewillkommnen', 'bewillkommnete', 'bewillkommnet'], ['beauftragen', 'beauftragte', 'beauftragt'],
      ['verunglücken', 'verunglückte', 'verunglückt'], ['frühstücken', 'frühstückte', 'gefrühstückt'],
      ['langweilen', 'langweilte', 'gelangweilt'], ['wetteifern', 'wetteiferte', 'gewetteifert'], ['ratschlagen', 'ratschlagte', 'geratschlagt'],
      ['beherbergen', 'beherbergte', 'beherbergt'], ['bemitleiden', 'bemitleidete', 'bemitleidet'], ['umringen', 'umringte', 'umringt'],
      ['bevormunden', 'bevormundete', 'bevormundet'],
    ] as const) {
      expect([lemma, ...texts(lemma, 'indicative', 'past', 3, 'singular'), ...participle(lemma)]).toEqual([lemma, `er ${past}`, part]);
    }
  });

  it('reads stacked prefixes and particles from the outside in', () => {
    expect(ich('missverstehen', 'past')).toEqual(['ich missverstand']);
    expect(ich('missverstehen', 'perfect')).toEqual(['ich habe missverstanden']);
    expect(texts('missverstehen', 'subjunctive', 'past', 1, 'singular')).toEqual(['ich missverstände', 'ich missverstünde']);
    expect(er('bevorstehen', 'present')).toEqual(['er steht bevor']);
    expect(er('bevorstehen', 'past')).toEqual(['er stand bevor']);
    expect(er('bevorstehen', 'perfect')).toEqual(['er hat bevorgestanden']);
    expect(ich('auferstehen', 'perfect')).toEqual(['ich bin auferstanden']);
    expect(ich('auferstehen', 'present')).toEqual(['ich erstehe auf']);
    expect(ich('wiederherstellen', 'present')).toEqual(['ich stelle wieder her']);
    expect(participle('wiederherstellen')).toEqual(['wiederhergestellt']);
    expect(ich('vorbereiten', 'past')).toEqual(['ich bereitete vor']);
    expect(participle('vorbereiten')).toEqual(['vorbereitet']);
    expect(ich('zubereiten', 'past')).toEqual(['ich bereitete zu']);
    expect(participle('zubereiten')).toEqual(['zubereitet']);
    expect(ich('abbestellen', 'past')).toEqual(['ich bestellte ab']);
    expect(participle('abbestellen')).toEqual(['abbestellt']);
    expect(ich('einbeziehen', 'past')).toEqual(['ich bezog ein']);
    expect(participle('einbeziehen')).toEqual(['einbezogen']);
  });

  it("gives a derivative the auxiliary DWDS lists for it, never the root's blindly", () => {
    expect(ich('gefallen', 'perfect')).toEqual(['ich habe gefallen']);
    expect(ich('besteigen', 'perfect')).toEqual(['ich habe bestiegen']);
    expect(ich('befallen', 'perfect')).toEqual(['ich habe befallen']);
    expect(ich('betreten', 'perfect')).toEqual(['ich habe betreten']);
    expect(ich('beitreten', 'perfect')).toEqual(['ich bin beigetreten']);
    expect(ich('bestehen', 'perfect')).toEqual(['ich habe bestanden']);
    expect(ich('verstehen', 'perfect')).toEqual(['ich habe verstanden']);
    expect(ich('begehen', 'perfect')).toEqual(['ich habe begangen']);
    expect(ich('entstehen', 'perfect')).toEqual(['ich bin entstanden']);
    expect(ich('vergehen', 'perfect')).toEqual(['ich bin vergangen']);
    expect(ich('verfallen', 'perfect')).toEqual(['ich bin verfallen']);
    expect(ich('einschlafen', 'perfect')).toEqual(['ich bin eingeschlafen']);
    expect(ich('aufstehen', 'perfect')[0]).toBe('ich bin aufgestanden');
    expect(result('aufstehen', 'indicative', 'perfect', 1, 'singular').forms.every(f => f.variant.region === null)).toBe(true);
  });

  it("assumes haben behind an inseparable prefix and the root's auxiliary behind a particle, both overridable", () => {
    // zerkriechen and hinschwinden are not in DWDS: invented derivatives of the sein verbs kriechen and schwinden.
    expect(ich('zerkriechen', 'perfect')).toEqual(['ich habe zerkrochen']);
    expect(analysis('zerkriechen').assumptions).toEqual([expect.stringContaining('haben')]);
    expect(ich('zerkriechen', 'perfect', { auxiliary: 'sein' })).toEqual(['ich bin zerkrochen']);
    expect(ich('hinschwinden', 'perfect')).toEqual(['ich bin hingeschwunden']);
    expect(ruleIds('hinschwinden')).toContain('de.classify.assume-root-auxiliary');
    expect(ich('hinschwinden', 'perfect', { auxiliary: 'haben' })).toEqual(['ich habe hingeschwunden']);
    // A listed auxiliary refuses a contradicting hint.
    expect(() => ich('gefallen', 'perfect', { auxiliary: 'sein' })).toThrow(expect.objectContaining({ code: 'INVALID_HINT' }));
  });

  it('knows the common inseparable verbs with über-, unter- and durch-', () => {
    expect(ich('überleben', 'perfect')).toEqual(['ich habe überlebt']);
    expect(ich('übernachten', 'present')).toEqual(['ich übernachte']);
    expect(texts('unterlaufen', 'indicative', 'perfect', 3, 'singular').slice(0, 1)).toEqual(['er ist unterlaufen']);
    const byPattern = (lemma: string, tense: string) => {
      const groups: Record<string, string[]> = {};
      for (const form of result(lemma, 'indicative', tense, 1, 'singular').forms) (groups[form.variant.pattern ?? 'none'] ??= []).push(form.text);
      return groups;
    };
    expect(byPattern('überfallen', 'perfect')).toEqual({ separable: ['ich bin übergefallen'], inseparable: ['ich habe überfallen'] });
    expect(byPattern('überholen', 'present')).toEqual({ separable: ['ich hole über'], inseparable: ['ich überhole'] });
    expect(byPattern('durchdringen', 'perfect')).toEqual({ separable: ['ich bin durchgedrungen'], inseparable: ['ich habe durchdrungen'] });
    // DWDS prints a rarer separable übernehmen ('sling over, put on'); the common inseparable reading comes first.
    expect(texts('übernehmen', 'indicative', 'past', 1, 'singular')).toEqual(['ich übernahm', 'ich nahm über']);
    // Reflexive in use, inseparable in form (DWDS): the forms of the lemma are the inseparable ones.
    for (const [lemma, past, part] of [
      ['überschneiden', 'überschnitt', 'überschnitten'], ['überfressen', 'überfraß', 'überfressen'], ['hintersinnen', 'hintersann', 'hintersonnen'],
      ['unterwinden', 'unterwand', 'unterwunden'],
    ] as const) {
      expect([lemma, ...ich(lemma, 'past'), ...participle(lemma)]).toEqual([lemma, `ich ${past}`, part]);
    }
  });

  it('takes the auxiliaries DWDS prints for the remaining derivatives', () => {
    expect(ich('erstehen', 'perfect')).toEqual(['ich habe erstanden', 'ich bin erstanden']);
    expect(ich('verstieben', 'perfect')).toEqual(['ich bin verstiebt', 'ich bin verstoben']);
    expect(ich('durchfrieren', 'perfect')).toEqual(['ich bin durchgefroren']);
    for (const lemma of ['erweichen', 'zerweichen', 'vergären', 'versalzen', 'verschießen', 'verbacken']) {
      const auxiliaries = ich(lemma, 'perfect').map(text => text.split(' ')[1]);
      expect([lemma, ...new Set(auxiliaries)]).toEqual([lemma, 'habe', 'bin']);
    }
  });

  it('puts the assumptions first, each naming the option that overrides it', () => {
    const steps = analysis('verschlafen').steps ?? [];
    const firstRule = steps.findIndex(s => s.kind !== 'assumption');
    expect(steps.slice(firstRule).some(s => s.kind === 'assumption')).toBe(false);
    for (const lemma of ['schlinken', 'aufschlinken', 'umschlinken', 'heissen', 'verschlafen', 'zerkriechen']) {
      for (const sentence of analysis(lemma).assumptions) expect(sentence, lemma).toMatch(/option/u);
    }
  });
});
