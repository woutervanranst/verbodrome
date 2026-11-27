import { describe, expect, it } from 'vitest';
import { explain } from '../../src/index.js';
import { bare, bareOf, bareText, form, forms } from './helpers.js';

describe('Italian simple tenses', () => {
  it('conjugates regular verbs', () => {
    expect(bare('parlare', 'indicative', 'present')).toEqual(['parlo', 'parli', 'parla', 'parla', 'parliamo', 'parlate', 'parlano']); // lui, lei
    expect(bare('credere', 'indicative', 'simple_past')).toEqual(['credetti/credei', 'credesti', 'credette/credé', 'credette/credé', 'credemmo', 'credeste', 'credettero/crederono']);
    expect(bare('battere', 'indicative', 'simple_past')[0]).toBe('battei');
    expect(bare('dormire', 'subjunctive', 'present')[0]).toBe('dorma');
    expect(bare('parlare', 'indicative', 'imperfect')).toEqual(['parlavo', 'parlavi', 'parlava', 'parlava', 'parlavamo', 'parlavate', 'parlavano']);
    expect(bare('parlare', 'indicative', 'simple_past')).toEqual(['parlai', 'parlasti', 'parlò', 'parlò', 'parlammo', 'parlaste', 'parlarono']);
    expect(bare('parlare', 'subjunctive', 'present')).toEqual(['parli', 'parli', 'parli', 'parli', 'parliamo', 'parliate', 'parlino']);
    expect(bare('parlare', 'subjunctive', 'imperfect')).toEqual(['parlassi', 'parlassi', 'parlasse', 'parlasse', 'parlassimo', 'parlaste', 'parlassero']);
    expect(bare('parlare', 'conditional', 'present')).toEqual(['parlerei', 'parleresti', 'parlerebbe', 'parlerebbe', 'parleremmo', 'parlereste', 'parlerebbero']);
    expect(bare('dormire', 'indicative', 'simple_past')).toEqual(['dormii', 'dormisti', 'dormì', 'dormì', 'dormimmo', 'dormiste', 'dormirono']);
    expect(bare('credere', 'indicative', 'future')).toEqual(['crederò', 'crederai', 'crederà', 'crederà', 'crederemo', 'crederete', 'crederanno']);
  });

  it('applies each spelling rule with its step', () => {
    expect(form('cercare', 'indicative', 'present', '2sg')).toMatchObject({ text: 'tu cerchi', rules: expect.arrayContaining(['it.orth.velar-h']) });
    expect(bareOf('pagare', 'indicative', 'future', '1sg')).toBe('pagherò');
    expect(form('cominciare', 'indicative', 'future', '1sg').rules).toContain('it.orth.palatal-i-drop'); // comincerò
    expect(bareOf('lasciare', 'indicative', 'present', '1pl')).toBe('lasciamo');
    expect(bareOf('mangiare', 'indicative', 'present', '2sg')).toBe('mangi');
    expect(bareOf('studiare', 'indicative', 'present', '2sg')).toBe('studi');
    expect(form('studiare', 'indicative', 'present', '2sg').rules).toContain('it.orth.i-merge');
    expect(bareOf('inviare', 'indicative', 'present', '2sg')).toBe('invii');
    expect(bareOf('inviare', 'indicative', 'present', '1pl')).toBe('inviamo');
    expect(bareOf('sciare', 'subjunctive', 'present', '3pl')).toBe('sciino');
    expect(bareOf('sciare', 'indicative', 'future', '1sg')).toBe('scierò');
    expect(bareOf('tagliare', 'indicative', 'future', '2sg')).toBe('taglierai');
    expect(bareOf('ripudiare', 'subjunctive', 'present', '3pl')).toBe('ripudino');
    expect(bareOf('fischiare', 'indicative', 'present', '1pl')).toBe('fischiamo');
    expect(bareOf('sporcare', 'indicative', 'present', '1pl')).toBe('sporchiamo');
    expect(bare('sognare', 'indicative', 'present')).toContain('sogniamo');
    expect(bare('sognare', 'indicative', 'present').join('/')).not.toContain('sognamo');
    expect(bareOf('rifare', 'indicative', 'present', '3sg.m')).toBe('rifà');
    expect(form('rifare', 'indicative', 'present', '3sg.m').rules).toContain('it.orth.final-accent');
    expect(bareOf('ridare', 'indicative', 'present', '1sg')).toBe('ridò');
    expect(bareOf('sottostare', 'indicative', 'present', '3sg.m')).toBe('sottostà');
  });

  it('uses -isc- and lexical stems', () => {
    expect(bare('finire', 'indicative', 'present')).toEqual(['finisco', 'finisci', 'finisce', 'finisce', 'finiamo', 'finite', 'finiscono']);
    expect(bareOf('venire', 'subjunctive', 'present', '1sg')).toBe('venga');
    expect(form('venire', 'subjunctive', 'present', '1sg').rules).toContain('it.stem.subjunctive-from-1sg');
    expect(bareOf('dovere', 'subjunctive', 'present', '2pl')).toBe('dobbiate');
    expect(form('dovere', 'subjunctive', 'present', '2pl').rules).toContain('it.stem.subjunctive-from-1pl');
    expect(bareOf('uscire', 'indicative', 'present', '1pl')).toBe('usciamo');
    expect(bareOf('uscire', 'indicative', 'present', '1sg')).toBe('esco');
    expect(bareOf('cucire', 'indicative', 'present', '1sg')).toBe('cucio');
    expect(form('cucire', 'indicative', 'present', '1sg').rules).toContain('it.stem.palatal');
    expect(bareOf('apparire', 'indicative', 'present', '1sg')).toBe('appaio/apparisco');
    expect(bare('mentire', 'indicative', 'present')[0]).toBe('mento/mentisco');
    expect(forms('mentire', 'indicative', 'present', '1sg').map(f => [bareText(f), f.variant.pattern])).toEqual([['mento', 'plain'], ['mentisco', 'isc']]);
    expect(bare('cuocere', 'indicative', 'present')).toEqual(['cuocio', 'cuoci', 'cuoce', 'cuoce', 'cuociamo/cociamo', 'cuocete/cocete', 'cuociono']);
    expect(bareOf('scegliere', 'indicative', 'present', '1pl')).toBe('scegliamo');
    expect(bare('togliere', 'indicative', 'present')).toEqual(['tolgo', 'togli', 'toglie', 'toglie', 'togliamo', 'togliete', 'tolgono']);
    expect(bareOf('parere', 'subjunctive', 'present', '1pl')).toBe('paiamo');
  });

  it('builds strong pasts and syncopated futures', () => {
    expect(bare('prendere', 'indicative', 'simple_past')).toEqual(['presi', 'prendesti', 'prese', 'prese', 'prendemmo', 'prendeste', 'presero']);
    expect(bare('vedere', 'indicative', 'future')[0]).toBe('vedrò');
    expect(bareOf('bere', 'conditional', 'present', '3pl')).toBe('berrebbero');
    expect(bareOf('morire', 'indicative', 'future', '1sg')).toBe('morirò/morrò');
    expect(bareOf('tradurre', 'indicative', 'imperfect', '1sg')).toBe('traducevo');
    expect(bareOf('porre', 'indicative', 'present', '1sg')).toBe('pongo');
    expect(bareOf('porre', 'indicative', 'future', '1sg')).toBe('porrò');
    expect(bareOf('aprire', 'indicative', 'simple_past', '1sg')).toBe('aprii/apersi');
    expect(bareOf('perdere', 'indicative', 'simple_past', '3pl')).toBe('persero/perdettero');
    expect(bareOf('fare', 'indicative', 'simple_past', '2sg')).toBe('facesti');
    expect(bareOf('comporre', 'indicative', 'simple_past', '3sg.m')).toBe('compose');
    expect(bareOf('produrre', 'indicative', 'future', '1sg')).toBe('produrrò');
    expect(bareOf('sbradurre', 'indicative', 'simple_past', '3pl')).toBe('sbradussero');
    expect(bare('essere', 'indicative', 'simple_past')).toEqual(['fui', 'fosti', 'fu', 'fu', 'fummo', 'foste', 'furono']);
    expect(bareOf('dare', 'indicative', 'simple_past', '1sg')).toBe('diedi/detti');
    expect(bareOf('potere', 'indicative', 'simple_past', '3sg.m')).toBe('poté/potette');
  });

  it('keeps two accepted spellings with their labels', () => {
    const vado = forms('andare', 'indicative', 'present', '1sg');
    expect(vado.map(f => [bareText(f), f.variant.usage, f.preferred])).toEqual([['vado', 'standard', true], ['vo', 'literary', false]]);
    // fo: printed unlabelled beside faccio (controller ruling): a standard variant, never the preferred form.
    expect(forms('fare', 'indicative', 'present', '1sg').map(f => [bareText(f), f.variant.usage, f.preferred])).toEqual([['faccio', 'standard', true], ['fo', 'standard', false]]);
    expect(bareOf('dovere', 'indicative', 'present', '1sg')).toBe('devo/debbo');
  });

  it('builds imperatives', () => {
    expect(bare('parlare', 'imperative', 'present')).toEqual(['parla', 'parliamo', 'parlate']); // tu noi voi
    expect(bare('parlare', 'imperative', 'present', { subject: '3sg.formal' })).toEqual(['parli']);
    expect(bare('fare', 'imperative', 'present')[0]).toBe("fai/fa'");
    expect(bare('fare', 'imperative', 'present')[2]).toBe('fate');
    expect(bare('dire', 'imperative', 'present')).toEqual(["di'", 'diciamo', 'dite']);
    expect(bare('sapere', 'imperative', 'present')).toEqual(['sappi', 'sappiamo', 'sappiate']);
    expect(form('sapere', 'imperative', 'present', '2pl').rules).toEqual(['it.stem.subjunctive-from-1pl', 'it.end.subjunctive-present', 'it.end.imperative-subjunctive']);
    expect(explain('it', form('essere', 'imperative', 'present', '2pl'), 'en').sections.flatMap(s => s.steps.map(t => t.text)))
      .toContain('This imperative form is the present subjunctive: siate.');
    expect(bare('essere', 'imperative', 'present')).toEqual(['sii', 'siamo', 'siate']);
    expect(bare('venire', 'imperative', 'present')).toEqual(['vieni', 'veniamo', 'venite']);
    expect(bare('predire', 'imperative', 'present')[0]).toBe('predici');
    expect(bare('rifare', 'imperative', 'present')[0]).toBe("rifai/rifa'");
    expect(bare('parlare', 'imperative', 'negative')).toEqual(['non parlare', 'non parliamo', 'non parlate']);
    expect(form('parlare', 'imperative', 'negative', '2sg').rules).toContain('it.clause.negative-infinitive');
    expect(bareOf('finire', 'imperative', 'present', '3pl.formal')).toBe('finiscano');
  });

  it('keeps final-accent forms apart', () => {
    expect(bareOf('parlare', 'indicative', 'present', '1sg')).toBe('parlo');
    expect(bareOf('parlare', 'indicative', 'simple_past', '3sg.m')).toBe('parlò');
  });

  it('explains a form step by step', () => {
    expect(form('cominciare', 'indicative', 'future', '1sg').rules).toEqual(
      ['it.clause.subject', 'it.stem.infinitive', 'it.end.future-ar-er', 'it.orth.palatal-i-drop']);
    expect(form('finire', 'indicative', 'present', '3pl').rules).toEqual(['it.clause.subject', 'it.stem.infinitive', 'it.stem.isc', 'it.end.present']);
    expect(form('prendere', 'indicative', 'simple_past', '3sg.m').rules).toEqual(['it.clause.subject', 'it.stem.strong-past', 'it.end.past-strong']);
    expect(form('parlare', 'indicative', 'present', '3sg.formal')).toMatchObject({ text: 'Lei parla', rules: ['it.clause.formal-subject', 'it.stem.infinitive', 'it.end.present'] });
  });
});
