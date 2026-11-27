/**
 * The invented verbs of design §8.1, cell by cell, with the assumptions each records. A spelling without macrons in
 * -ere (or -eri) has two readings (controller ruling 4): `reading` keeps the forms of the paradigm whose pattern is the
 * given first person.
 */
import { describe, expect, it } from 'vitest';
import { conjugate, ConjugationError } from '../../src/index.js';
import type { VerbAnalysis } from '../../src/types.js';
import { explainIds, form, forms } from './helpers.js';

const reading = (pattern: string, infinitive: string, mood: string, tense?: string, voice?: string, extra: Record<string, unknown> = {}): string[] =>
  conjugate({ language: 'la', infinitive, mood, ...(tense ? { tense } : {}), ...(voice ?? (['indicative', 'subjunctive', 'imperative'].includes(mood) ? 'active' : undefined) ? { voice: voice ?? 'active' } : {}), ...extra } as never)
    .forms.filter(f => f.variant.pattern?.split('.').includes(pattern)).map(f => f.text);
const analysis = (infinitive: string, extra: Record<string, unknown> = {}): VerbAnalysis =>
  conjugate({ language: 'la', infinitive, mood: 'infinitive', tense: 'present', ...extra } as never).analysis;
const assumptions = (a: VerbAnalysis): string[] => a.steps!.filter(s => s.kind === 'assumption').map(s => s.rule.replace('la.classify.', ''));

describe('invented verbs (design §8.1)', () => {
  it('blorpāre', () => {
    expect(forms('blorpāre', 'indicative', 'present')).toEqual(['blorpō', 'blorpās', 'blorpat', 'blorpāmus', 'blorpātis', 'blorpant']);
    expect(forms('blorpāre', 'indicative', 'imperfect')[0]).toBe('blorpābam');
    expect(forms('blorpāre', 'indicative', 'future')).toEqual(['blorpābō', 'blorpābis', 'blorpābit', 'blorpābimus', 'blorpābitis', 'blorpābunt']);
    expect(forms('blorpāre', 'indicative', 'perfect').slice(-3)).toEqual(['blorpāvērunt', 'blorpārunt', 'blorpāvēre']); // blorpārunt: syncope, literary
    expect(forms('blorpāre', 'indicative', 'pluperfect')[0]).toBe('blorpāveram');
    expect(forms('blorpāre', 'indicative', 'future_perfect')[0]).toBe('blorpāverō');
    expect(forms('blorpāre', 'subjunctive', 'present').slice(0, 2)).toEqual(['blorpem', 'blorpēs']);
    expect(forms('blorpāre', 'subjunctive', 'imperfect')[0]).toBe('blorpārem');
    expect(forms('blorpāre', 'subjunctive', 'perfect').slice(0, 3)).toEqual(['blorpāverim', 'blorpārim', 'blorpāverīs']);
    expect(forms('blorpāre', 'imperative', 'present')).toEqual(['blorpā', 'blorpāte']);
    expect(forms('blorpāre', 'imperative', 'future')).toEqual(['blorpātō', 'blorpātō', 'blorpātōte', 'blorpantō']);
    expect(forms('blorpāre', 'indicative', 'present', 'passive').slice(0, 3)).toEqual(['blorpor', 'blorpāris', 'blorpāre']);
    expect(forms('blorpāre', 'indicative', 'present', 'passive').at(-1)).toBe('blorpantur');
    expect(forms('blorpāre', 'indicative', 'perfect', 'passive', { subject: '3sg' })).toEqual(['blorpātus est', 'blorpāta est', 'blorpātum est']);
    expect(forms('blorpāre', 'infinitive')).toEqual(['blorpāre', 'blorpārī', 'blorpāvisse', 'blorpāsse', 'blorpātus esse', 'blorpātūrus esse', 'blorpātum īrī']);
    expect(forms('blorpāre', 'participle')).toEqual(['blorpāns', 'blorpātus', 'blorpātūrus', 'blorpandus']);
    expect(forms('blorpāre', 'participle', 'present', undefined, { agreement: { case: 'genitive', gender: 'masculine', number: 'singular' } })).toEqual(['blorpantis']);
    expect(forms('blorpāre', 'gerund')).toEqual(['blorpandī']);
    expect(forms('blorpāre', 'supine', undefined, undefined, { agreement: {} })).toEqual(['blorpātum', 'blorpātū']);
    expect(assumptions(analysis('blorpāre'))).toEqual(['assume-quantity', 'assume-passive', 'default-parts']);
    expect(forms('amāre', 'participle', 'perfect', undefined, { agreement: { case: 'vocative', gender: 'masculine', number: 'singular' } })).toEqual(['amāte']);
  });

  it('flūdēre', () => {
    expect(forms('flūdēre', 'indicative', 'present')).toEqual(['flūdeō', 'flūdēs', 'flūdet', 'flūdēmus', 'flūdētis', 'flūdent']);
    expect(forms('flūdēre', 'indicative', 'imperfect')[0]).toBe('flūdēbam');
    expect(forms('flūdēre', 'indicative', 'future')[0]).toBe('flūdēbō');
    expect(forms('flūdēre', 'subjunctive', 'present')[0]).toBe('flūdeam');
    expect(forms('flūdēre', 'subjunctive', 'imperfect')[0]).toBe('flūdērem');
    expect(forms('flūdēre', 'imperative', 'present')).toEqual(['flūdē', 'flūdēte']);
    expect(forms('flūdēre', 'imperative', 'future')).toEqual(['flūdētō', 'flūdētō', 'flūdētōte', 'flūdentō']);
    expect(forms('flūdēre', 'indicative', 'present', 'passive').slice(0, 4)).toEqual(['flūdeor', 'flūdēris', 'flūdēre', 'flūdētur']);
    expect(forms('flūdēre', 'infinitive', 'present', 'passive')).toEqual(['flūdērī']);
    expect(forms('flūdēre', 'indicative', 'perfect', 'active', { subject: '1sg' })).toEqual(['flūduī']);
    expect(forms('flūdēre', 'supine')).toEqual(['flūditum']);
    expect(forms('flūdēre', 'indicative', 'perfect', 'passive', { subject: '1sg.m' })).toEqual(['flūditus sum']);
    expect(forms('flūdēre', 'participle')).toEqual(['flūdēns', 'flūditus', 'flūditūrus', 'flūdendus']);
    expect(assumptions(analysis('flūdēre'))).toEqual(['assume-quantity', 'assume-passive', 'default-parts']);
  });

  it('tregere, third-conjugation reading', () => {
    const third = (mood: string, tense?: string, voice?: string, extra: Record<string, unknown> = {}): string[] => reading('tregō', 'tregere', mood, tense, voice, extra);
    expect(third('indicative', 'present')).toEqual(['tregō', 'tregis', 'tregit', 'tregimus', 'tregitis', 'tregunt']);
    expect(third('indicative', 'imperfect')[0]).toBe('tregēbam');
    expect(third('indicative', 'future')).toEqual(['tregam', 'tregēs', 'treget', 'tregēmus', 'tregētis', 'tregent']);
    expect(third('subjunctive', 'present').slice(0, 2)).toEqual(['tregam', 'tregās']);
    expect(third('subjunctive', 'imperfect')[0]).toBe('tregerem');
    expect(third('imperative', 'present')).toEqual(['trege', 'tregite']);
    expect(third('imperative', 'future')).toEqual(['tregitō', 'tregitō', 'tregitōte', 'treguntō']);
    expect(third('indicative', 'present', 'passive')).toEqual(['tregor', 'tregeris', 'tregere', 'tregitur', 'tregimur', 'tregiminī', 'treguntur']);
    expect(third('indicative', 'future', 'passive', { subject: '2sg' })).toEqual(['tregēris', 'tregēre']);
    expect(third('infinitive', 'present', 'passive')).toEqual(['tregī']);
    expect(third('indicative', 'perfect', 'active', { subject: '1sg' })).toEqual(['trexī']);
    expect(third('supine')).toEqual(['trectum']);
    expect(third('indicative', 'perfect', 'passive', { subject: '1sg.m' })).toEqual(['trectus sum']);
    expect(third('participle')).toEqual(['tregēns', 'trectus', 'trectūrus', 'tregendus', 'tregundus']);
    expect(third('participle', 'present', undefined, { agreement: { case: 'genitive', gender: 'masculine', number: 'singular' } })).toEqual(['tregentis']);
    expect(third('gerund')).toEqual(['tregendī', 'tregundī']);
    const trexi = conjugate({ language: 'la', infinitive: 'tregere', mood: 'indicative', tense: 'perfect', voice: 'active', subject: '1sg' }).forms
      .find(f => f.variant.pattern === 'tregō')!;
    expect(explainIds(trexi)).toEqual(['la.stem.perfect-regular', 'la.stem.s-junction', 'la.end.perfect']);
    expect(assumptions(analysis('tregere'))).toEqual(['assume-third', 'assume-consonant-stem', 'assume-quantity', 'assume-passive', 'default-sigmatic']);
    expect(assumptions(analysis('tregere').alternatives![0]!)).toEqual(['assume-second', 'assume-quantity', 'assume-passive', 'default-parts']);
  });

  it('tregere with tregeō is of the second conjugation only', () => {
    const q = { stems: { present: 'tregeō' } };
    expect(forms('tregere', 'indicative', 'present', 'active', q).slice(0, 3)).toEqual(['tregeō', 'tregēs', 'treget']);
    expect(forms('tregere', 'indicative', 'imperfect', 'active', q)[0]).toBe('tregēbam');
    expect(forms('tregere', 'indicative', 'future', 'active', q)[0]).toBe('tregēbō');
    expect(forms('tregere', 'indicative', 'perfect', 'active', { ...q, subject: '1sg' })).toEqual(['treguī']);
    expect(forms('tregere', 'supine', undefined, undefined, q)).toEqual(['tregitum']);
    expect(assumptions(analysis('tregere', q))).toEqual(['assume-quantity', 'assume-passive', 'default-parts']);
  });

  it('blapiō / blapere keeps and drops the i', () => {
    const q = { stems: { present: 'blapiō' } };
    expect(forms('blapere', 'indicative', 'present', 'active', q)).toEqual(['blapiō', 'blapis', 'blapit', 'blapimus', 'blapitis', 'blapiunt']);
    expect(forms('blapere', 'indicative', 'imperfect', 'active', q)[0]).toBe('blapiēbam');
    expect(forms('blapere', 'indicative', 'future', 'active', q).slice(0, 2)).toEqual(['blapiam', 'blapiēs']);
    expect(forms('blapere', 'subjunctive', 'present', 'active', q).slice(0, 2)).toEqual(['blapiam', 'blapiās']);
    expect(forms('blapere', 'subjunctive', 'imperfect', 'active', q)[0]).toBe('blaperem');
    expect(forms('blapere', 'imperative', 'present', 'active', q)).toEqual(['blape', 'blapite']);
    expect(forms('blapere', 'imperative', 'future', 'active', q)).toEqual(['blapitō', 'blapitō', 'blapitōte', 'blapiuntō']);
    expect(forms('blapere', 'indicative', 'present', 'passive', q)).toEqual(['blapior', 'blaperis', 'blapere', 'blapitur', 'blapimur', 'blapiminī', 'blapiuntur']);
    expect(forms('blapere', 'infinitive', 'present', 'passive', q)).toEqual(['blapī']);
    expect(forms('blapere', 'participle', 'present', undefined, { ...q, agreement: { case: 'genitive', gender: 'masculine', number: 'singular' } })).toEqual(['blapientis']);
    expect(forms('blapere', 'participle', 'gerundive', undefined, q)[0]).toBe('blapiendus');
    expect(forms('blapere', 'gerund', undefined, undefined, q)[0]).toBe('blapiendī');
    expect(forms('blapere', 'indicative', 'perfect', 'active', { ...q, subject: '1sg' })).toEqual(['blapsī']);
    expect(forms('blapere', 'supine', undefined, undefined, q)).toEqual(['blaptum']);
    expect(assumptions(analysis('blapere', q))).toEqual(['assume-quantity', 'assume-passive', 'default-sigmatic']);
  });

  it('plundīre', () => {
    expect(forms('plundīre', 'indicative', 'present')).toEqual(['plundiō', 'plundīs', 'plundit', 'plundīmus', 'plundītis', 'plundiunt']);
    expect(forms('plundīre', 'indicative', 'imperfect')[0]).toBe('plundiēbam');
    expect(forms('plundīre', 'indicative', 'future').slice(0, 2)).toEqual(['plundiam', 'plundiēs']);
    expect(forms('plundīre', 'subjunctive', 'present').slice(0, 2)).toEqual(['plundiam', 'plundiās']);
    expect(forms('plundīre', 'subjunctive', 'imperfect')[0]).toBe('plundīrem');
    expect(forms('plundīre', 'imperative', 'present')).toEqual(['plundī', 'plundīte']);
    expect(forms('plundīre', 'imperative', 'future')).toEqual(['plundītō', 'plundītō', 'plundītōte', 'plundiuntō']);
    expect(forms('plundīre', 'indicative', 'present', 'passive')).toEqual(['plundior', 'plundīris', 'plundīre', 'plundītur', 'plundīmur', 'plundīminī', 'plundiuntur']);
    expect(forms('plundīre', 'infinitive', 'present', 'passive')).toEqual(['plundīrī']);
    expect(forms('plundīre', 'participle', 'present', undefined, { agreement: { case: 'genitive', gender: 'masculine', number: 'singular' } })).toEqual(['plundientis']);
    expect(forms('plundīre', 'participle', 'gerundive')).toEqual(['plundiendus', 'plundiundus']);
    expect(forms('plundīre', 'indicative', 'perfect', 'active', { subject: '1sg' })).toEqual(['plundīvī', 'plundiī']); // plundiī: v-loss (A&G §181.b)
    expect(forms('plundīre', 'supine')).toEqual(['plundītum']);
  });

  it('blorpārī is deponent', () => {
    expect(forms('blorpārī', 'indicative', 'present')).toEqual(['blorpor', 'blorpāris', 'blorpāre', 'blorpātur', 'blorpāmur', 'blorpāminī', 'blorpantur']);
    expect(forms('blorpārī', 'indicative', 'imperfect')[0]).toBe('blorpābar');
    expect(forms('blorpārī', 'indicative', 'future').slice(0, 2)).toEqual(['blorpābor', 'blorpāberis']);
    expect(forms('blorpārī', 'subjunctive', 'present').slice(0, 2)).toEqual(['blorper', 'blorpēris']);
    expect(forms('blorpārī', 'subjunctive', 'imperfect')[0]).toBe('blorpārer');
    expect(forms('blorpārī', 'imperative', 'present')).toEqual(['blorpāre', 'blorpāminī']);
    expect(forms('blorpārī', 'imperative', 'future')).toEqual(['blorpātor', 'blorpātor', 'blorpantor']);
    expect(forms('blorpārī', 'indicative', 'perfect', 'active', { subject: '1sg.f' })).toEqual(['blorpāta sum']);
    expect(forms('blorpārī', 'infinitive')).toEqual(['blorpārī', 'blorpātus esse', 'blorpātūrus esse']);
    expect(forms('blorpārī', 'participle')).toEqual(['blorpāns', 'blorpātus', 'blorpātūrus', 'blorpandus']);
    expect(forms('blorpārī', 'gerund')).toEqual(['blorpandī']);
    expect(forms('blorpārī', 'supine')).toEqual(['blorpātum']);
    expect(conjugate({ language: 'la', infinitive: 'blorpārī', voice: 'passive' }).forms).toEqual([]);
    expect(assumptions(analysis('blorpārī'))).toEqual(['assume-deponent', 'assume-quantity', 'default-parts']);
  });

  it('trapī', () => {
    expect(forms('trapī', 'indicative', 'present')).toEqual(['trapor', 'traperis', 'trapere', 'trapitur', 'trapimur', 'trapiminī', 'trapuntur']);
    expect(forms('trapī', 'indicative', 'imperfect')[0]).toBe('trapēbar');
    expect(forms('trapī', 'indicative', 'future').slice(0, 2)).toEqual(['trapar', 'trapēris']);
    expect(forms('trapī', 'subjunctive', 'present').slice(0, 2)).toEqual(['trapar', 'trapāris']);
    expect(forms('trapī', 'subjunctive', 'imperfect')[0]).toBe('traperer');
    expect(forms('trapī', 'imperative', 'present')).toEqual(['trapere', 'trapiminī']);
    expect(forms('trapī', 'imperative', 'future')).toEqual(['trapitor', 'trapitor', 'trapuntor']);
    expect(forms('trapī', 'indicative', 'perfect', 'active', { subject: '1sg.m' })).toEqual(['traptus sum']);
    expect(forms('trapī', 'participle', 'present')).toEqual(['trapēns']);
    expect(forms('trapī', 'participle', 'gerundive')[0]).toBe('trapendus');
    expect(forms('trapī', 'supine')).toEqual(['traptum']);
    expect(assumptions(analysis('trapī'))).toEqual(['assume-deponent', 'assume-consonant-stem', 'assume-quantity', 'default-sigmatic']);
  });

  it('mundīrī', () => {
    expect(forms('mundīrī', 'indicative', 'present')).toEqual(['mundior', 'mundīris', 'mundīre', 'mundītur', 'mundīmur', 'mundīminī', 'mundiuntur']);
    expect(forms('mundīrī', 'indicative', 'imperfect')[0]).toBe('mundiēbar');
    expect(forms('mundīrī', 'indicative', 'future').slice(0, 2)).toEqual(['mundiar', 'mundiēris']);
    expect(forms('mundīrī', 'subjunctive', 'imperfect')[0]).toBe('mundīrer');
    expect(forms('mundīrī', 'imperative', 'present')).toEqual(['mundīre', 'mundīminī']);
    expect(forms('mundīrī', 'imperative', 'future')).toEqual(['mundītor', 'mundītor', 'mundiuntor']);
    expect(forms('mundīrī', 'indicative', 'perfect', 'active', { subject: '1sg.m' })).toEqual(['mundītus sum']);
    expect(forms('mundīrī', 'participle', 'present')).toEqual(['mundiēns']);
    expect(forms('mundīrī', 'participle', 'gerundive')[0]).toBe('mundiendus');
    expect(assumptions(analysis('mundīrī'))).toEqual(['assume-deponent', 'assume-quantity', 'default-parts']);
  });

  it('look-alikes stay regular', () => {
    expect(forms('dūcāre', 'imperative', 'present')[0]).toBe('dūcā');
    expect(forms('dūcāre', 'indicative', 'perfect', 'active', { subject: '1sg' })).toEqual(['dūcāvī']);
    expect(explainIds(form('dūcāre', 'imperative', 'present', '2sg'))).not.toContain('la.end.short-imperative');
    expect(reading('recapō', 'recapere', 'indicative', 'present').slice(0, 2)).toEqual(['recapō', 'recapis']);
    expect(reading('recapō', 'recapere', 'indicative', 'perfect', 'active', { subject: '1sg' })).toEqual(['recapsī']);
    expect(analysis('recapere').steps!.map(s => s.rule)).not.toContain('la.classify.compound');
    expect(() => conjugate({ language: 'la', infinitive: 'trānsesse' })).toThrow(ConjugationError);
  });

  it('bluere + bluō, flēscere, frolere: the third-conjugation defaults', () => {
    const blu = { stems: { present: 'bluō' } };
    expect(forms('bluere', 'indicative', 'perfect', 'active', { ...blu, subject: '1sg' })).toEqual(['bluī']);
    expect(forms('bluere', 'supine', undefined, undefined, blu)).toEqual(['blūtum']);
    expect(assumptions(analysis('bluere', blu))).toContain('default-uo');
    expect(forms('flēscere', 'indicative', 'perfect', 'active', { subject: '1sg' })).toEqual(['flēvī']);
    expect(forms('flēscere', 'supine')).toEqual(['flētum']);
    expect(assumptions(analysis('flēscere'))).toEqual(['assume-consonant-stem', 'assume-quantity', 'assume-passive', 'default-sco']);
    expect(reading('frolō', 'frolere', 'indicative', 'perfect', 'active', { subject: '1sg' })).toEqual(['froluī']);
    expect(reading('frolō', 'frolere', 'supine')).toEqual(['frolitum']);
    expect(assumptions(analysis('frolere'))).toEqual(['assume-third', 'assume-consonant-stem', 'assume-quantity', 'assume-passive', 'default-u']);
  });

  it('rejects a passive infinitive and an impossible infinitive', () => {
    expect(() => analysis('amārī')).toThrow(/amāre/u);
    expect(() => analysis('blesse')).toThrow(ConjugationError);
    expect(() => analysis('trānsesse')).toThrow(ConjugationError);
  });
});
