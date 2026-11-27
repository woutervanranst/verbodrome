/**
 * Regression tests for the stint-1 review: every wrong form of its tables, with the form LDOCE and AHD print, and its
 * findings on labels, hints and explanations.
 */
import { describe, expect, it } from 'vitest';
import { conjugate, explain, parseConjugationOptions } from '../../src/index.js';
import type { ConjugatedForm } from '../../src/index.js';

const forms = (infinitive: string, mood: string, tense: string, extra: Record<string, unknown> = {}): readonly ConjugatedForm[] => {
  const finite = mood !== 'participle' && mood !== 'infinitive';
  const person = finite && extra.person === undefined && extra.number === undefined && extra.subject === undefined ? { person: 3, number: 'singular' } : {};
  return conjugate(parseConjugationOptions({ language: 'en', infinitive, mood, tense, ...person, ...extra })).forms;
};
const texts = (infinitive: string, mood: string, tense: string, extra: Record<string, unknown> = {}) =>
  forms(infinitive, mood, tense, extra).map(f => f.text.replace(/^he /u, ''));
const labelled = (infinitive: string, mood: string, tense: string) =>
  forms(infinitive, mood, tense).map(f => [f.text.replace(/^he /u, ''), f.variant.region, f.variant.usage]);
const analysis = (q: Record<string, unknown>) =>
  conjugate(parseConjugationOptions({ language: 'en', mood: 'participle', tense: 'past', ...q })).analysis;
const rules = (q: Record<string, unknown>) => analysis(q).steps!.map(s => s.rule);

describe('forms the review found wrong', () => {
  it('never inherits a marked variant of the base', () => {
    for (const verb of ['rewrite', 'underwrite', 'overwrite']) expect(texts(verb, 'participle', 'past'), verb).toEqual([`${verb.slice(0, -1)}ten`]);
    expect(texts('reprove', 'participle', 'past')).toEqual(['reproved']);
    expect(rules({ infinitive: 'reprove' })).toEqual(['en.classify.no-inherit']);
    expect(texts('retread', 'indicative', 'past')).toEqual(['retreaded']);
    expect(texts('outsing', 'indicative', 'past')).toEqual(['outsang']);
    expect(texts('reawake', 'indicative', 'past')).toEqual(['reawoke']);
    expect(texts('misspell', 'indicative', 'past')).toEqual(['misspelt', 'misspelled']);
    expect(forms('misspell', 'indicative', 'past').map(f => f.variant.region)).toEqual([null, null]);
  });

  it('writes -s or -es as the dictionaries do, and assumes it where spelling cannot tell', () => {
    expect(texts('stomach', 'indicative', 'present')).toEqual(['stomachs']);
    expect(texts('psych', 'indicative', 'present')).toEqual(['psyches']); // LDOCE verb table and AHD both print psyches
    for (const verb of ['demo', 'disco', 'photo', 'ditto']) expect(texts(verb, 'indicative', 'present'), verb).toEqual([`${verb}s`]);
    expect(texts('tango', 'indicative', 'present')).toEqual(['tangoes', 'tangos']); // LDOCE tangoes, AHD tangos
    expect(texts('veto', 'indicative', 'present')).toEqual(['vetoes']);
    expect(texts('echo', 'indicative', 'present')).toEqual(['echoes']);
    expect(rules({ infinitive: 'blorto' })).toEqual(['en.classify.assume-regular', 'en.classify.assume-es']);
    expect(analysis({ infinitive: 'blorto' }).steps![1]!.params).toEqual({ letters: 'o' });
    expect(rules({ infinitive: 'attach' })).toEqual(['en.classify.assume-regular', 'en.classify.assume-es']);
    expect(rules({ infinitive: 'watch' })).toEqual(['en.classify.assume-regular']);
    expect(texts('blorto', 'indicative', 'present', { sEnding: 's' })).toEqual(['blortos']);
    expect(rules({ infinitive: 'blorto', sEnding: 's' })).toEqual(['en.classify.assume-regular', 'en.classify.es-hint']);
    expect(() => analysis({ infinitive: 'demo', sEnding: 'es' })).toThrow(expect.objectContaining({ code: 'INVALID_HINT' }));
    expect(() => analysis({ infinitive: 'go', sEnding: 's' })).toThrow(expect.objectContaining({ code: 'INVALID_HINT' }));
  });

  it.each([
    ['offset', 'offset', 'offsetting'], ['typeset', 'typeset', 'typesetting'], ['sublet', 'sublet', 'subletting'],
    ['preset', 'preset', 'presetting'], ['inset', 'inset', 'insetting'], ['prepay', 'prepaid', 'prepaying'],
    ['inlay', 'inlaid', 'inlaying'], ['breastfeed', 'breastfed', 'breastfeeding'], ['ghostwrite', 'ghostwrote', 'ghostwriting'],
    ['interweave', 'interwove', 'interweaving'], ['interbreed', 'interbred', 'interbreeding'],
    ['allot', 'allotted', 'allotting'], ['annul', 'annulled', 'annulling'],
    ['debut', 'debuted', 'debuting'], ['eavesdrop', 'eavesdropped', 'eavesdropping'], ['sidestep', 'sidestepped', 'sidestepping'],
    ['zigzag', 'zigzagged', 'zigzagging'], ['bivouac', 'bivouacked', 'bivouacking'], ['beseech', 'besought', 'beseeching'],
  ])('%s', (verb, past, ing) => {
    expect(texts(verb, 'indicative', 'past')[0]).toBe(past);
    expect(texts(verb, 'participle', 'present')).toEqual([ing]);
  });

  it('gives the participles of compounds and the variants the dictionaries print', () => {
    expect(texts('ghostwrite', 'participle', 'past')).toEqual(['ghostwritten']);
    expect(texts('interweave', 'participle', 'past')).toEqual(['interwoven']);
    expect(texts('retrofit', 'indicative', 'past')).toEqual(['retrofitted', 'retrofit']);
    expect(labelled('retrofit', 'indicative', 'past')[1]).toEqual(['retrofit', null, 'dated']);
    expect(texts('beseech', 'indicative', 'past')).toEqual(['besought', 'beseeched']);
    expect(texts('wed', 'indicative', 'past')).toEqual(['wedded', 'wed']);
    expect(texts('shoe', 'indicative', 'past')).toEqual(['shod', 'shoed']);
    expect(labelled('shoe', 'participle', 'past')).toEqual([['shod', null, 'standard'], ['shodden', null, 'dated']]);
    expect(texts('output', 'indicative', 'past')).toEqual(['output', 'outputted']);
    expect(texts('output', 'participle', 'present')).toEqual(['outputting']);
  });

  it('doubles the consonant of a final-stressed verb in both spellings, with the variants LDOCE and AHD print', () => {
    expect(labelled('corral', 'indicative', 'past')).toEqual([['corralled', null, 'standard'], ['corraled', 'US', 'standard']]);
    expect(labelled('nonplus', 'indicative', 'past')).toEqual([['nonplussed', null, 'standard'], ['nonplused', null, 'dated']]);
    expect(labelled('program', 'indicative', 'past')).toEqual([['programmed', null, 'standard'], ['programed', null, 'dated']]);
    expect(labelled('kidnap', 'indicative', 'past')).toEqual([['kidnapped', null, 'standard'], ['kidnaped', 'US', 'standard']]);
    expect(texts('bus', 'indicative', 'past')).toEqual(['bused', 'bussed']);
    expect(texts('bus', 'participle', 'present')).toEqual(['busing', 'bussing']);
  });

  it('forks British and American l for verbs stressed on the first syllable', () => {
    for (const verb of ['devil', 'revel', 'bevel']) {
      expect(labelled(verb, 'indicative', 'past'), verb).toEqual([[`${verb}led`, 'GB', 'standard'], [`${verb}ed`, 'US', 'standard']]);
    }
  });

  it('adds ageing and parallelled as British variants', () => {
    expect(labelled('age', 'participle', 'present')).toEqual([['aging', null, 'standard'], ['ageing', 'GB', 'standard']]);
    expect(labelled('parallel', 'indicative', 'past')).toEqual([['paralleled', null, 'standard'], ['parallelled', 'GB', 'standard']]);
    expect(texts('parallel', 'indicative', 'past', { region: 'US' })).toEqual(['paralleled']);
  });
});

describe('region and usage labels', () => {
  it.each([
    ['awake', 'indicative', 'past', [['awoke', null, 'standard'], ['awaked', null, 'dated']]],
    ['awake', 'participle', 'past', [['awoken', null, 'standard'], ['awaked', null, 'dated']]],
    ['beat', 'participle', 'past', [['beaten', null, 'standard'], ['beat', null, 'dated']]],
    ['broadcast', 'indicative', 'past', [['broadcast', null, 'standard'], ['broadcasted', null, 'dated']]],
    ['forbid', 'indicative', 'past', [['forbade', null, 'standard'], ['forbad', null, 'dated']]],
    ['forbid', 'participle', 'past', [['forbidden', null, 'standard'], ['forbid', null, 'dated']]],
    ['forget', 'participle', 'past', [['forgotten', null, 'standard'], ['forgot', null, 'dated']]],
    ['show', 'participle', 'past', [['shown', null, 'standard'], ['showed', null, 'dated']]],
    ['shrink', 'indicative', 'past', [['shrank', null, 'standard'], ['shrunk', null, 'dated']]],
    ['shrink', 'participle', 'past', [['shrunk', null, 'standard'], ['shrunken', null, 'dated']]],
    ['sing', 'indicative', 'past', [['sang', null, 'standard'], ['sung', null, 'dated']]],
    ['slay', 'indicative', 'past', [['slew', null, 'standard'], ['slayed', null, 'dated']]],
    ['stink', 'indicative', 'past', [['stank', null, 'standard'], ['stunk', null, 'dated']]],
    ['strike', 'participle', 'past', [['struck', null, 'standard'], ['stricken', null, 'dated']]],
    ['strive', 'participle', 'past', [['striven', null, 'standard'], ['strived', null, 'dated']]],
    ['swell', 'participle', 'past', [['swollen', null, 'standard'], ['swelled', null, 'dated']]],
    ['thrive', 'participle', 'past', [['thrived', null, 'standard'], ['thriven', null, 'dated']]],
    ['tread', 'participle', 'past', [['trodden', null, 'standard'], ['trod', null, 'dated'], ['treaded', null, 'dated']]],
    ['wake', 'indicative', 'past', [['woke', null, 'standard'], ['waked', null, 'dated']]],
    ['slink', 'indicative', 'past', [['slunk', null, 'standard'], ['slinked', null, 'dated']]],
    ['bite', 'participle', 'past', [['bitten', null, 'standard'], ['bit', null, 'dated']]],
    ['hide', 'participle', 'past', [['hidden', null, 'standard'], ['hid', null, 'dated']]],
    ['write', 'participle', 'past', [['written', null, 'standard'], ['writ', null, 'dated']]],
    ['beget', 'participle', 'past', [['begotten', null, 'standard'], ['begot', null, 'dated']]],
    ['smite', 'participle', 'past', [['smitten', null, 'standard'], ['smote', null, 'dated']]],
    ['sink', 'indicative', 'past', [['sank', null, 'standard'], ['sunk', 'US', 'standard']]],
    ['get', 'participle', 'past', [['got', null, 'standard'], ['gotten', 'US', 'standard']]],
  ])('%s %s %s', (verb, mood, tense, expected) => {
    expect(labelled(verb, mood, tense)).toEqual(expected);
  });

  it('never prefers a dated form, whatever the region', () => {
    expect(forms('sing', 'indicative', 'past', { region: 'US' }).map(f => [f.text, f.preferred])).toEqual([['he sang', true], ['he sung', false]]);
  });

  it('refuses a class hint that leaves no form in the asked region', () => {
    expect(() => forms('spell', 'indicative', 'past', { classHint: 'regular', region: 'GB' }))
      .toThrow(expect.objectContaining({ code: 'INVALID_HINT', message: expect.stringContaining('British') }));
  });
});

describe('hints and analysis', () => {
  it('refuses a stress hint that contradicts a listed stress, and keeps the hint for unlisted verbs', () => {
    expect(() => analysis({ infinitive: 'begin', stress: 'nonFinal' })).toThrow(expect.objectContaining({ code: 'INVALID_HINT' }));
    expect(() => analysis({ infinitive: 'enter', stress: 'final' })).toThrow(expect.objectContaining({ code: 'INVALID_HINT' }));
    expect(rules({ infinitive: 'prefer', stress: 'final' })).toEqual(['en.classify.listed-regular', 'en.classify.stress-listed']);
    expect(texts('trimbit', 'indicative', 'past', { stress: 'final' })).toEqual(['trimbitted']);
  });

  it('does not assume what the side lists record', () => {
    expect(rules({ infinitive: 'prefer' })).toEqual(['en.classify.listed-regular', 'en.classify.stress-listed']);
    expect(rules({ infinitive: 'kidnap' })).toEqual(['en.classify.listed-regular', 'en.classify.doubles-unstressed']);
    expect(rules({ infinitive: 'parallel' })).toEqual(['en.classify.listed-regular', 'en.classify.l-not-doubled']);
    expect(rules({ infinitive: 'debut' })).toEqual(['en.classify.listed-regular', 'en.classify.silent-consonant']);
    expect(rules({ infinitive: 'can' })).toEqual(['en.classify.listed-regular', 'en.classify.not-modal']);
    expect(rules({ infinitive: 'beware' })).toEqual(['en.classify.listed-regular', 'en.classify.mostly-imperative']);
  });

  it('says which dictionary an entry was checked in when it was only one', () => {
    expect(analysis({ infinitive: 'typeset' }).steps![0]).toMatchObject({ rule: 'en.classify.lexicon', params: { source: 'ahd' } });
    expect(analysis({ infinitive: 'swim' }).steps![0]!.params.source).toBe('both');
    const typeset = explain('en', analysis({ infinitive: 'typeset' }), 'en').sections[0]!.steps[0]!.text;
    expect(typeset).toContain('American Heritage Dictionary only');
  });
});

describe('explanations the review found wrong', () => {
  const stepText = (verb: string, mood: string, tense: string, rule: string, locale: 'en' | 'nl', extra: Record<string, unknown> = {}) => {
    const form = forms(verb, mood, tense, extra)[0]!;
    return explain('en', form, locale).sections.flatMap(s => s.steps).find(s => s.rule === rule)?.text;
  };

  it('names only the suffix this form takes when a consonant doubles', () => {
    expect(stepText('gas', 'indicative', 'past', 'en.orth.double-consonant', 'en')).toBe('One s after one vowel at the end of a stressed syllable is doubled before -ed: gased becomes gassed.');
    expect(stepText('quiz', 'indicative', 'present', 'en.orth.double-consonant', 'en')).toBe('One z after one vowel at the end of a stressed syllable is doubled before -es: quizes becomes quizzes.');
    expect(stepText('gas', 'indicative', 'past', 'en.orth.double-consonant', 'nl')).toContain('voor -ed:');
  });

  it('writes the British l, be and the prefixed verb plainly', () => {
    expect(stepText('dial', 'indicative', 'past', 'en.orth.double-l-british', 'en')).toBe('British spelling doubles a final l after a vowel even without stress: dialed becomes dialled.');
    expect(stepText('be', 'indicative', 'present', 'en.cell.be', 'en')).toBe('Present simple of be, 3rd person singular: is.');
    expect(stepText('be', 'indicative', 'present', 'en.cell.be', 'nl')).toBe('Present simple van be, 3e persoon enkelvoud: is.');
    const outswim = explain('en', analysis({ infinitive: 'outswim' }), 'nl').sections[0]!.steps[0]!.text;
    expect(outswim).toBe('outswim is out- + swim, dus het is onregelmatig zoals swim: out- + de vormen van swim.');
    expect(explain('en', analysis({ infinitive: 'be' }), 'nl').sections[0]!.steps[0]!.text).toBe('be is helemaal onregelmatig: elke vorm staat apart in de lijst.');
  });

  it('glosses the paradigms of a homograph in the locale of the explanation', () => {
    const hang = explain('en', analysis({ infinitive: 'hang' }), 'nl');
    expect(hang.sections.map(s => s.title)).toEqual(['Het werkwoord (hung: hangen, ophangen)', 'Het werkwoord (hanged: iemand ophangen als straf)']);
    expect(hang.sections[1]!.steps[0]!.text).toBe('Deze vormen van hang horen bij de betekenis "iemand ophangen als straf".');
    expect(explain('en', analysis({ infinitive: 'lie' }), 'en').sections[1]!.steps[0]!.text).toBe('This paradigm of lie means "say something untrue".');
  });
});
