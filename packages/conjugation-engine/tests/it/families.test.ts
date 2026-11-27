import { describe, expect, it } from 'vitest';
import { conjugate, explain } from '../../src/index.js';
import { bare, bareOf, texts } from './helpers.js';

const steps = (infinitive: string) => conjugate({ language: 'it', infinitive, mood: 'infinitive', tense: 'present' }).analysis.steps!;
const explained = (infinitive: string, locale: 'en' | 'nl') =>
  explain('it', conjugate({ language: 'it', infinitive, mood: 'infinitive', tense: 'present' }).analysis, locale).sections.flatMap(s => s.steps.map(t => t.text));

/**
 * Derived verbs whose Vocabolario header says "coniug. come X" (or prints the strong forms): io of the passato remoto
 * and the past participle (review of stint 1, wrong-form table).
 */
const derived: readonly (readonly [string, string, string])[] = [
  ['raccogliere', 'raccolsi', 'raccolto'], ['raggiungere', 'raggiunsi', 'raggiunto'], ['rimpiangere', 'rimpiansi', 'rimpianto'],
  ['appartenere', 'appartenni', 'appartenuto'], ['sottintendere', 'sottintesi', 'sottinteso'], ['equivalere', 'equivalsi', 'equivalso'],
  ['comprimere', 'compressi', 'compresso'], ['reprimere', 'repressi', 'represso'], ['opprimere', 'oppressi', 'oppresso'],
  ['sopprimere', 'soppressi', 'soppresso'], ['deprimere', 'depressi', 'depresso'], ['imprimere', 'impressi', 'impresso'],
  ['dissolvere', 'dissolsi', 'dissolto'], ['sostenere', 'sostenni', 'sostenuto'], ['scommettere', 'scommisi', 'scommesso'],
  ['ottenere', 'ottenni', 'ottenuto'], ['mantenere', 'mantenni', 'mantenuto'], ['attendere', 'attesi', 'atteso'],
  ['sorprendere', 'sorpresi', 'sorpreso'], ['comprendere', 'compresi', 'compreso'], ['permettere', 'permisi', 'permesso'],
  ['ammettere', 'ammisi', 'ammesso'], ['descrivere', 'descrissi', 'descritto'], ['iscrivere', 'iscrissi', 'iscritto'],
  ['soccorrere', 'soccorsi', 'soccorso'], ['interrompere', 'interruppi', 'interrotto'], ['convincere', 'convinsi', 'convinto'],
  ['coinvolgere', 'coinvolsi', 'coinvolto'], ['accogliere', 'accolsi', 'accolto'], ['aggiungere', 'aggiunsi', 'aggiunto'],
  ['intravedere', 'intravidi', 'intravisto/intraveduto'], ['rinascere', 'rinacqui', 'rinato'], ['confondere', 'confusi', 'confuso'],
  ['diffondere', 'diffusi', 'diffuso'], ['illudere', 'illusi', 'illuso'], ['incidere', 'incisi', 'inciso'], ['presumere', 'presunsi', 'presunto'],
  ['connettere', 'connettei/connessi', 'connesso'], ['sommergere', 'sommersi', 'sommerso'], ['struggere', 'strussi', 'strutto'],
];

describe('Italian derived verbs and families', () => {
  it.each(derived)('%s: %s, %s', (infinitive, past, participle) => {
    expect(bareOf(infinitive, 'indicative', 'simple_past', '1sg')).toBe(past);
    expect(bare(infinitive, 'participle', 'past')[0]).toBe(participle);
  });

  it('gives the -sistere verbs their participle in -sistito (C1)', () => {
    for (const verb of ['esistere', 'consistere', 'sussistere', 'insistere', 'resistere', 'assistere', 'persistere', 'coesistere']) {
      expect(bare(verb, 'participle', 'past')[0], verb).toBe(`${verb.slice(0, -3)}ito`);
    }
    expect(texts('consistere', 'indicative', 'perfect', { subject: '3sg.m' })).toEqual(['lui è consistito']);
    expect(texts('insistere', 'indicative', 'perfect', { subject: '1sg' })).toEqual(['io ho insistito']);
    expect(texts('resistere', 'indicative', 'perfect', { subject: '1sg' })).toEqual(['io ho resistito']);
  });

  it('keeps present stems of derived verbs (C2)', () => {
    expect(bareOf('appartenere', 'indicative', 'present', '1sg')).toBe('appartengo');
    expect(bareOf('raccogliere', 'indicative', 'present', '1sg')).toBe('raccolgo');
    expect(bareOf('equivalere', 'indicative', 'future', '1sg')).toBe('equivarrò');
    expect(bareOf('possedere', 'indicative', 'present', '1sg')).toBe('possiedo');
  });

  it('does not derive lookalikes (C2)', () => {
    expect(bare('trasalire', 'indicative', 'present')).toEqual(['trasalisco', 'trasalisci', 'trasalisce', 'trasalisce', 'trasaliamo', 'trasalite', 'trasaliscono']);
    expect(conjugate({ language: 'it', infinitive: 'trasalire', mood: 'infinitive', tense: 'present' }).analysis.auxiliaries).toEqual(['avere', 'essere']);
    expect(steps('trasalire').map(s => s.rule)).toContain('it.classify.no-inherit');
    for (const verb of ['restare', 'mandare', 'contare', 'costare']) expect(steps(verb).map(s => s.rule), verb).not.toContain('it.classify.family');
  });

  it('inherits an essere-only auxiliary, and only that (I3)', () => {
    expect(texts('rinascere', 'indicative', 'perfect', { subject: '1sg' })).toEqual(['io sono rinato', 'io sono rinata']);
    expect(texts('ricadere', 'indicative', 'perfect', { subject: '1sg' })[0]).toBe('io sono ricaduto');
    expect(texts('riapparire', 'indicative', 'perfect', { subject: '1sg' })[0]).toBe('io sono riapparso');
    // The auxiliary is per lemma (controller ruling C2): a listed derivative has its own, an unlisted one assumes essere.
    expect(steps('rinascere').map(s => s.rule)).toContain('it.classify.auxiliary');
    expect(steps('stravenire').filter(s => s.kind === 'assumption').map(s => s.rule)).toEqual(['it.classify.assume-family', 'it.classify.assume-inherit-auxiliary']);
    expect(explained('stravenire', 'en')).toContain('Assuming stravenire takes essere in its compound tenses, like venire.');
    expect(texts('stravenire', 'indicative', 'perfect', { subject: '1sg', auxiliary: 'avere' })).toEqual(['io ho stravenuto']);
    expect(texts('ripercorrere', 'indicative', 'perfect', { subject: '1sg' })).toEqual(['io ho ripercorso']); // correre is dual: not inherited
  });

  it('records an unlisted derivation as an assumption (I4)', () => {
    expect(steps('stramettere').filter(s => s.kind === 'assumption').map(s => s.rule)).toEqual(['it.classify.assume-family', 'it.classify.assume-avere']);
    expect(explained('stramettere', 'en')).toContain('stramettere is not in the lexicon: assuming it is conjugated like mettere.');
    expect(steps('ottenere').map(s => s.rule)).not.toContain('it.classify.assume-family');
  });

  it('names real words in family steps (explanation defects 4–6)', () => {
    expect(explained('sostenere', 'en')).toEqual(expect.arrayContaining([
      'sostenere is sos + tenere: it is conjugated like tenere.']));
    expect(explained('ammettere', 'en')).toEqual(expect.arrayContaining([
      'ammettere is a + mettere: it is conjugated like mettere.', 'After a- the first consonant of mettere is doubled: ammettere.']));
    expect(explained('soprassedere', 'en')).toContain('soprassedere is sopra + sedere: it is conjugated like sedere.');
    expect(explained('scommettere', 'en')).toContain('scommettere is scom + mettere: it is conjugated like mettere.');
    expect(explained('ridurre', 'en')).toContain('ridurre ends in -durre: it is conjugated like condurre.');
    expect(explained('smentire', 'en')).toContain('smentire comes from mentire but is not conjugated like it.');
    expect(explained('soffrire', 'en').join(' ')).not.toContain('s + offrire');
    expect(explained('finire', 'en')).toContain('finire forms its compound tenses with avere or essere, depending on the use; each form says which use it has.');
  });

  it('resolves the derivatives of the whole-word irregulars (I2)', () => {
    expect(bare('riavere', 'indicative', 'present')).toEqual(['riò', 'riai', 'rià', 'rià', 'riabbiamo', 'riavete', 'rianno']);
    expect(bareOf('riavere', 'indicative', 'simple_past', '1sg')).toBe('riebbi');
    expect(bareOf('riavere', 'indicative', 'future', '1sg')).toBe('riavrò');
    expect(bare('risapere', 'indicative', 'present').slice(0, 3)).toEqual(['risò', 'risai', 'risà']);
    expect(bareOf('risapere', 'indicative', 'simple_past', '1sg')).toBe('riseppi');
    expect(bareOf('riandare', 'indicative', 'future', '1sg')).toBe('riandrò');
    expect(texts('riandare', 'indicative', 'perfect', { subject: '1sg' })[0]).toBe('io sono riandato');
    expect(bareOf('ristare', 'indicative', 'present', '1sg')).toBe('ristò');
  });

  it('gives soddisfare and disfare the regular present the Vocabolario prints (I6)', () => {
    expect(bare('soddisfare', 'indicative', 'present')).toEqual([
      'soddisfaccio/soddisfò/soddisfo', 'soddisfai/soddisfi', 'soddisfà/soddisfa', 'soddisfà/soddisfa', 'soddisfacciamo/soddisfiamo', 'soddisfate', 'soddisfanno/soddisfano']);
    expect(bare('soddisfare', 'subjunctive', 'present')).toEqual([
      'soddisfaccia/soddisfi', 'soddisfaccia/soddisfi', 'soddisfaccia/soddisfi', 'soddisfaccia/soddisfi', 'soddisfacciamo', 'soddisfacciate', 'soddisfacciano/soddisfino']);
    expect(bareOf('disfare', 'subjunctive', 'present', '2pl')).toBe('disfacciate/disfiate');
  });

  it('records the prefix of a derived verb\'s irregular word (I7)', () => {
    const rifa = conjugate({ language: 'it', infinitive: 'rifare', mood: 'indicative', tense: 'present', subject: '3sg.m' }).forms[0]!;
    expect(rifa.ruleIds).toEqual(['it.clause.subject', 'it.cell.lexical', 'it.cell.prefix', 'it.orth.final-accent']);
    expect(explain('it', rifa, 'en').sections.flatMap(s => s.steps.map(t => t.text))).toEqual([
      'fa is an irregular form that has to be learnt.', 'rifa is the prefix ri- with fa, the irregular form of fare.',
      'A word of several syllables stressed on its last vowel is written with an accent: rifa becomes rifà.', 'Subject pronoun lui; in Italian it is often left out.']);
  });

  it('covers the common irregular verbs of the sweep (I9)', () => {
    expect(bare('spegnere', 'indicative', 'present')).toEqual(['spengo', 'spegni', 'spegne', 'spegne', 'spegniamo', 'spegnete', 'spengono']);
    for (const [verb, past, participle] of [['spegnere', 'spensi', 'spento'], ['assumere', 'assunsi', 'assunto'], ['dirigere', 'diressi', 'diretto'],
      ['redigere', 'redassi', 'redatto'], ['cingere', 'cinsi', 'cinto'], ['ardere', 'arsi', 'arso'], ['radere', 'rasi', 'raso'],
      ['fondere', 'fusi', 'fuso'], ['sconfiggere', 'sconfissi', 'sconfitto'], ['affliggere', 'afflissi', 'afflitto'],
      ['distinguere', 'distinsi', 'distinto'], ['espellere', 'espulsi', 'espulso'], ['espandere', 'espansi', 'espanso']] as const) {
      expect(bareOf(verb, 'indicative', 'simple_past', '1sg'), verb).toBe(past);
      expect(bare(verb, 'participle', 'past')[0], verb).toBe(participle);
    }
    expect(bare('seppellire', 'participle', 'past')[0]).toBe('sepolto/seppellito');
  });
});
