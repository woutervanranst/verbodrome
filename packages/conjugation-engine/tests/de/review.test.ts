/**
 * The forms, labels and explanations the stint-1 review found wrong, one expectation each. Sources: DWDS grammar line
 * and inflection table of the lemma, Duden's entry where it is named.
 */
import { describe, expect, it } from 'vitest';
import { conjugate, explain } from '../../src/index.js';
import { de as dutch } from '../../src/i18n/locales/nl/de.js';
import type { ConjugatedForm, GrammaticalNumber, Person } from '../../src/types.js';

const result = (lemma: string, mood: string, tense?: string, person?: Person, number?: GrammaticalNumber, extra: Record<string, unknown> = {}) =>
  conjugate({
    language: 'de', infinitive: lemma, mood, ...(tense === undefined ? {} : { tense }),
    ...(person === undefined ? {} : { person, number }), ...extra,
  } as never);
const texts = (...args: Parameters<typeof result>) => result(...args).forms.map(f => f.text);
const labelled = (...args: Parameters<typeof result>) => result(...args).forms.map(f => [f.text, f.variant.usage, f.variant.pattern]);
const explained = (form: ConjugatedForm, locale: 'en' | 'nl' = 'en') => explain('de', form, locale).sections.flatMap(s => s.steps);
const formOf = (text: string, ...args: Parameters<typeof result>) => result(...args).forms.find(f => f.text === text)!;

describe('German forms the review found wrong', () => {
  it('gives knien one du-imperative', () => {
    expect(texts('knien', 'imperative', 'present', 2, 'singular')).toEqual(['knie']);
  });

  it('folds melken, triefen, dingen, glimmen and stieben into one paradigm with tagged older forms', () => {
    expect(result('melken', 'infinitive', 'present').analysis).not.toHaveProperty('alternatives');
    expect(labelled('melken', 'indicative', 'past', 1, 'singular')).toEqual([['ich melkte', 'standard', 'weak'], ['ich molk', 'standard', 'alternate']]);
    expect(texts('melken', 'indicative', 'perfect', 1, 'singular')).toEqual(['ich habe gemelkt', 'ich habe gemolken']);
    expect(texts('melken', 'indicative', 'present', 3, 'singular')).toEqual(['er melkt', 'er milkt']);
    expect(labelled('triefen', 'indicative', 'past', 1, 'singular')).toEqual([['ich triefte', 'standard', 'weak'], ['ich troff', 'literary', null]]);
    expect(texts('triefen', 'indicative', 'perfect', 1, 'singular')).toEqual(['ich bin getrieft', 'ich habe getrieft']);
    expect(texts('dingen', 'indicative', 'past', 1, 'singular')).toEqual(['ich dingte', 'ich dang']);
    expect(texts('dingen', 'participle', 'past')).toEqual(['gedingt', 'gedungen']);
    expect(texts('glimmen', 'indicative', 'past', 1, 'singular')).toEqual(['ich glomm', 'ich glimmte']);
    expect(texts('stieben', 'indicative', 'past', 1, 'singular')).toEqual(['ich stiebte', 'ich stob']);
  });

  it('labels each reading of a dual-prefix verb truthfully, also in the compound tenses', () => {
    const conditions = (lemma: string) => result(lemma, 'indicative', 'perfect', 1, 'singular').forms.map(f => [f.text, f.variant.condition]);
    expect(conditions('umziehen')).toEqual([
      ['ich bin umgezogen', 'move house'], ['ich habe umgezogen', 'change clothes, change someone'], ['ich habe umzogen', 'surround, cover']]);
    for (const lemma of ['umziehen', 'durchlaufen', 'übersetzen', 'umfahren', 'durchbrechen', 'übertreten']) {
      for (const [text, condition] of conditions(lemma)) expect(condition ?? '', `${lemma}: ${String(text)}`).not.toMatch(/;/u);
    }
    expect(result('umziehen', 'indicative', 'present', 1, 'singular').forms.map(f => f.variant.condition)).toEqual(['move house; change clothes', 'surround, cover']);
    expect(result('schleifen', 'indicative', 'perfect', 1, 'singular').forms.map(f => f.variant.condition).join(' ')).not.toMatch(/Duden/u);
  });
});

describe('German explanations the review found wrong', () => {
  it('records no vowel change where nothing changes', () => {
    const gebaert = formOf('er gebärt', 'gebären', 'indicative', 'present', 3, 'singular');
    expect(explained(gebaert).map(s => s.rule)).not.toContain('de.stem.present2');
  });

  it('says the du-imperative keeps the changed vowel of the du and er forms', () => {
    const erlisch = formOf('erlisch', 'erlöschen', 'imperative', 'present', 2, 'singular');
    expect(explained(erlisch).find(s => s.rule === 'de.stem.imperative-i')!.text).toMatch(/change the vowel to i or ie/u);
  });

  it('puts ge- after a separable particle, and says so', () => {
    const steps = explained(formOf('ich habe abgeschrieben', 'abschreiben', 'indicative', 'perfect', 1, 'singular'));
    expect(steps.map(s => s.rule)).toContain('de.stem.ge-after-particle');
    expect(steps.map(s => s.rule)).not.toContain('de.stem.ge-prefix');
  });

  it('says a stressed particle that does not separate is not an inseparable prefix', () => {
    const inseparable = result('widerspiegeln', 'infinitive', 'present').analysis.alternatives![0]!;
    expect(inseparable.steps!.map(s => s.rule)).toContain('de.classify.unseparated');
    expect(inseparable.steps!.map(s => s.rule)).not.toContain('de.classify.inseparable');
  });

  it('uses het for the German tense names in Dutch', () => {
    for (const [id, text] of Object.entries(dutch)) {
      expect(text, id).not.toMatch(/\bde (Präteritum|Präsens|Perfekt|Plusquamperfekt)\b|(^|[.:] )(Zwakke|Sterke) Präteritum|\been (zwakke|sterke) Präteritum/u);
    }
  });

  it('records es only where the subject was not es already', () => {
    const neuter = conjugate({ language: 'de', infinitive: 'regnen', mood: 'indicative', tense: 'present', subject: '3sg.n' }).forms[0]!;
    expect((neuter.steps ?? []).map(s => s.rule)).not.toContain('de.clause.impersonal-es');
    const plain = result('regnen', 'indicative', 'present', 3, 'singular').forms[0]!;
    expect((plain.steps ?? []).map(s => s.rule)).toContain('de.clause.impersonal-es');
  });

  it('shows that a form rests on Duden only', () => {
    const tue = formOf('tue', 'tun', 'imperative', 'present', 2, 'singular');
    expect(explained(tue).map(s => s.rule)).toContain('de.stem.duden-only');
    const stoehle = formOf('ich stöhle', 'stehlen', 'subjunctive', 'past', 1, 'singular');
    expect(explained(stoehle).map(s => s.rule)).toContain('de.stem.duden-only');
    const bin = formOf('ich bin gestanden', 'stehen', 'indicative', 'perfect', 1, 'singular');
    expect(explained(bin).map(s => s.rule)).toContain('de.clause.duden-only');
  });
});
