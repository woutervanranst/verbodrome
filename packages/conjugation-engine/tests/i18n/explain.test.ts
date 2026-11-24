import { describe, expect, it } from 'vitest';
import { createEngine } from '../../src/core/engine.js';
import { defineRules, step } from '../../src/core/derivation.js';
import { conjugate, explain } from '../../src/index.js';
import { stagedEngine } from '../../src/core/staged.js';
import { explanationLines } from '../../src/i18n/explain.js';
import { locales } from '../../src/i18n/locales/index.js';
import type { ConjugatedForm, UnavailableTarget, VerbAnalysis } from '../../src/types.js';
import { en as toyEn, nl as toyNl } from '../toy/messages.js';
import { toyCatalogue, toyGrammar, toyPack, toyRendering, toyRules } from '../toy/pack.js';

const catalogs = { en: { ...locales.en, ...toyEn }, nl: { ...locales.nl, ...toyNl } };
const toy = createEngine({ xx: toyPack }, catalogs);
type Query = Readonly<Record<string, unknown>>;

/** The one active-voice form a query yields. */
function only(query: Query): ConjugatedForm {
  const forms = toy.conjugate(query).forms.filter(form => form.target.voice !== 'passive');
  expect(forms).toHaveLength(1);
  return forms[0]!;
}

const presentPlural = { language: 'xx', infinitive: 'placa', mood: 'indicative', tense: 'present', person: 1, number: 'plural' } as const;
const perfectFeminine = { language: 'xx', infinitive: 'vena', mood: 'indicative', tense: 'perfect', person: 3, number: 'singular', voice: 'active' } as const;

describe('explain', () => {
  it('explains a derived form step by step in English and Dutch', () => {
    const form = only(presentPlural);
    const verb = (locale: 'en' | 'nl') => toy.explain('xx', form, locale).sections.find(s => s.title === 'placamos')!;
    expect(verb('en').steps.map(s => s.text)).toEqual(['Drop -a from placa: plac-.', 'Present, 1st person plural: add -amos.']);
    expect(verb('en').steps[0]!.citations).toEqual([{ work: 'toy', locator: '§1', title: 'Toy Grammar' }]);
    expect(verb('nl').steps[0]!.text).toBe('Laat -a weg van placa: plac-.');
    expect(verb('nl').steps[1]!.text).toBe('Tegenwoordige tijd, 1e persoon meervoud: voeg -amos toe.');
    expect(verb('en').steps[1]).toMatchObject({ rule: 'xx.end.present', stage: 'ending', kind: 'rule', before: 'plac', after: 'placamos' });
    expect(toy.explain('xx', form, 'en').summary).toBe('nos placamos: Indicative, Present');
  });

  it('explains a compound form part by part, then the form-level steps', () => {
    const forms = toy.conjugate(perfectFeminine).forms;
    const feminine = forms.find(f => f.text === 'il estat venada')!;
    const english = toy.explain('xx', feminine, 'en');
    expect(english.sections.map(s => [s.part, s.title, s.steps.map(x => x.text)])).toEqual([
      [1, 'estat', ['Drop -a from esta: est-.', 'Present, 3rd person singular: add -at.']],
      [2, 'venada', ['Drop -a from vena: ven-.', 'Past participle: add -ada to ven-.']],
      [null, 'The whole form', ['Perfect: the present of esta plus the past participle.', 'The participle agrees in gender: feminine.']],
    ]);
    const dutch = toy.explain('xx', feminine, 'nl');
    expect(dutch.sections.map(s => [s.part, s.title, s.steps.map(x => x.text)])).toEqual([
      [1, 'estat', ['Laat -a weg van esta: est-.', 'Tegenwoordige tijd, 3e persoon enkelvoud: voeg -at toe.']],
      [2, 'venada', ['Laat -a weg van vena: ven-.', 'Voltooid deelwoord: voeg -ada toe aan ven-.']],
      [null, 'De hele vorm', ['Perfectum: de tegenwoordige tijd van esta plus het voltooid deelwoord.', 'Het deelwoord komt overeen in geslacht: vrouwelijk.']],
    ]);
    expect(explanationLines(english)).toEqual(english.sections.flatMap(s => s.steps.map(x => `    ${x.text}`)));
    expect(explanationLines(english, '> ')[0]).toBe('> Drop -a from esta: est-.');
    expect(Object.isFrozen(english)).toBe(true);
  });

  it('gives every citation of a rule and the title of its work', () => {
    const analysis = toy.conjugate({ language: 'xx', infinitive: 'placa' }).analysis;
    const assumption = toy.explain('xx', analysis, 'en').sections[0]!.steps.find(s => s.kind === 'assumption')!;
    expect(assumption.citations).toEqual([
      { work: 'toy', locator: '§1', title: 'Toy Grammar' },
      { work: 'toy-lexicon', locator: 'Entries', url: 'https://example.org/toy-lexicon#entries', title: 'The Toy Lexicon' },
    ]);
  });

  it('explains unavailability and assumptions', () => {
    const solea = toy.conjugate({ language: 'xx', infinitive: 'solea', mood: 'indicative', tense: 'perfect', person: 1, number: 'singular', voice: 'active' });
    const unavailable = toy.explain('xx', solea.unavailableTargets[0]!, 'en');
    expect(unavailable.summary).toBe('Indicative, Perfect: unavailable (defective)');
    expect(unavailable.sections).toEqual([{
      part: null, title: 'Availability',
      steps: [expect.objectContaining({ rule: 'xx.avail.no-participle', kind: 'unavailable', text: expect.stringContaining('no participle') })],
    }]);
    expect(toy.explain('xx', solea.unavailableTargets[0]!, 'nl').summary).toBe('Indicative, Perfect: niet beschikbaar (defectief)');

    const analysis = toy.conjugate({ language: 'xx', infinitive: 'placa' }).analysis;
    const explained = toy.explain('xx', analysis, 'en');
    expect(explained.summary).toBe('placa: a-verb');
    expect(explained.sections).toHaveLength(1);
    expect(explained.sections[0]).toMatchObject({ part: null, title: 'The verb' });
    expect(explained.sections[0]!.steps.map(s => s.text)).toEqual(['placa ends in -a: class a-verb.', 'Assuming the verb is regular: it is not in the lexicon.']);
  });

  it('explains each paradigm of an analysis in its own section, in order', () => {
    const analysis = toy.conjugate({ language: 'xx', infinitive: 'apvena' }).analysis;
    const english = toy.explain('xx', analysis, 'en');
    expect(english.summary).toBe('apvena: a-verb');
    expect(english.sections.map(s => [s.part, s.title, s.steps.map(x => x.text)])).toEqual([
      [null, 'The verb (separable)', ['apvena is listed in the lexicon as a-verb.', 'In this meaning apvena has a separable particle, ap: it splits off from the conjugated verb.']],
      [null, 'The verb (inseparable)', ['apvena is listed in the lexicon as a-verb.', 'In this meaning apvena has an inseparable particle, ap: it always stays on the verb.']],
    ]);
    expect(toy.explain('xx', analysis, 'nl').sections.map(s => s.steps[1]!.text)).toEqual([
      'In deze betekenis heeft apvena een scheidbaar partikel, ap: het komt los van het vervoegde werkwoord.',
      'In deze betekenis heeft apvena een onscheidbaar partikel, ap: het blijft altijd aan het werkwoord vast.',
    ]);
    expect(toy.explain('xx', analysis, 'nl').sections.map(s => s.title)).toEqual(['Het werkwoord (separable)', 'Het werkwoord (inseparable)']);
    // An alternative is an analysis of its own: with no alternatives of its own, it has the plain title.
    expect(toy.explain('xx', analysis.alternatives![0]!, 'en').sections).toEqual([{ ...english.sections[1], title: 'The verb' }]);
    // A paradigm without a pattern label keeps the plain title.
    const { pattern: _, ...unlabelled } = analysis.alternatives![0]!;
    expect(toy.explain('xx', { ...analysis, alternatives: [unlabelled] }, 'en').sections.map(s => s.title)).toEqual(['The verb (separable)', 'The verb']);

    const inseparable = toy.conjugate({ ...perfectFeminine, infinitive: 'apvena', prefix: 'inseparable' }).forms[0]!;
    expect(toy.explain('xx', inseparable, 'en').sections.map(s => [s.part, s.title, s.steps.map(x => x.text)])).toEqual([
      [1, 'habat', ['Drop -a from haba: hab-.', 'Present, 3rd person singular: add -at.']],
      [2, 'apvenido', [
        'Drop -a from vena: ven-.', 'Past participle after the inseparable particle ap: add -ido to ven-.',
        'The particle ap attaches to the verb: venido becomes apvenido.',
      ]],
      [null, 'The whole form', ['Perfect: the present of haba plus the past participle.']],
    ]);
  });

  it('explains a target a language has no passive for, and has a label for the vocative', () => {
    const noPassive = createEngine({
      xx: { ...toyPack, engine: query => stagedEngine({
        ...toyGrammar,
        availability: (lexeme, target) => target.voice === 'passive'
          ? { reason: 'noPassive', step: step(toyRules['xx.avail.no-participle'], null, null), source: 'Toy grammar §4' } : toyGrammar.availability(lexeme, target),
      }, toyRendering, query) },
    }, catalogs);
    const [unavailable] = noPassive.conjugate({ ...presentPlural, voice: 'passive' }).unavailableTargets;
    expect(unavailable!.reason).toBe('noPassive');
    expect(noPassive.explain('xx', unavailable!, 'en').summary).toBe('Indicative, Present: unavailable (no passive)');
    expect(noPassive.explain('xx', unavailable!, 'nl').summary).toBe('Indicative, Present: niet beschikbaar (geen lijdende vorm)');
    expect([locales.en['term.case.vocative'], locales.nl['term.case.vocative']]).toEqual(['vocative', 'vocatief']);
  });

  it('renders the explanation of an unavailable target in English when the engine has an English catalog', () => {
    const query = { language: 'xx', infinitive: 'solea', mood: 'indicative', tense: 'perfect', person: 1, number: 'singular', voice: 'active' };
    const [unavailable] = toy.conjugate(query).unavailableTargets;
    expect(unavailable!.explanation).toBe('This verb has no participle, so the perfect and the past participle do not exist.');
    expect(unavailable!.step!.rule).toBe('xx.avail.no-participle');
    expect(createEngine({ xx: toyPack }, { nl: catalogs.nl }).conjugate(query).unavailableTargets[0]!.explanation).toBe('xx.avail.no-participle');
    expect(createEngine({ xx: toyPack }).conjugate(query).unavailableTargets[0]!.explanation).toBe('xx.avail.no-participle');
  });

  it('renders a staged pack\'s assumptions in English when the engine has an English catalog', () => {
    const query = { language: 'xx', infinitive: 'placa' };
    expect(toy.conjugate(query).analysis.assumptions).toEqual(['Assuming the verb is regular: it is not in the lexicon.']);
    expect(createEngine({ xx: toyPack }, { nl: catalogs.nl }).conjugate(query).analysis.assumptions).toEqual(['xx.assume.unlisted']);
    expect(createEngine({ xx: toyPack }).conjugate(query).analysis.assumptions).toEqual(['xx.assume.unlisted']);
    expect(toy.conjugate({ language: 'xx', infinitive: 'vena' }).analysis.assumptions).toEqual([]);
    // Every paradigm's assumptions, not only the first's.
    const twice = { ...toyGrammar, classify: (q: Query) => [...toyGrammar.classify(q), ...toyGrammar.classify(q)] };
    const engine = createEngine({ xx: { ...toyPack, engine: q => stagedEngine(twice, toyRendering, q) } }, catalogs);
    expect(engine.conjugate(query).analysis.alternatives!.map(a => a.assumptions)).toEqual([['Assuming the verb is regular: it is not in the lexicon.']]);
  });

  it('fails loudly on a rule without text', () => {
    const form = only(presentPlural);
    const broken = createEngine({ xx: toyPack }, { en: {}, nl: {} });
    expect(() => broken.explain('xx', form, 'en')).toThrow(expect.objectContaining({ code: 'GENERATION_FAILURE', message: expect.stringContaining('xx.stem.drop-a') }));
    // A missing core message fails the same way.
    const noCore = createEngine({ xx: toyPack }, { en: toyEn });
    const infinitive = only({ language: 'xx', infinitive: 'placa', mood: 'infinitive', tense: 'present' });
    expect(() => noCore.explain('xx', infinitive, 'en')).toThrow(expect.objectContaining({ code: 'GENERATION_FAILURE', message: expect.stringContaining('explain.summary.form') }));
  });

  it('fails loudly on a message that cannot be formatted, naming it', () => {
    const form = only(presentPlural);
    for (const source of ['Drop {before', 'Drop {unknown}']) {
      const bad = createEngine({ xx: toyPack }, { en: { ...catalogs.en, 'xx.stem.drop-a': source } });
      expect(() => bad.explain('xx', form, 'en')).toThrow(expect.objectContaining({ code: 'GENERATION_FAILURE', message: expect.stringContaining('xx.stem.drop-a') }));
    }
  });

  it('rejects an unknown locale, language or subject', () => {
    const form = only(presentPlural);
    expect(() => toy.explain('xx', form, 'fr')).toThrow(expect.objectContaining({ code: 'INVALID_REQUEST' }));
    expect(() => createEngine({ xx: toyPack }).explain('xx', form, 'en')).toThrow(expect.objectContaining({ code: 'INVALID_REQUEST' }));
    expect(() => toy.explain('zz', form, 'en')).toThrow(expect.objectContaining({ code: 'UNSUPPORTED_LANGUAGE' }));
    expect(() => toy.explain('xx', { text: 'x' } as unknown as ConjugatedForm, 'en')).toThrow(expect.objectContaining({ code: 'INVALID_REQUEST' }));
    expect(() => toy.explain('xx', null as unknown as ConjugatedForm, 'en')).toThrow(expect.objectContaining({ code: 'INVALID_REQUEST' }));
  });

  it('returns no sections for a pack that records no steps yet', () => {
    const aimer = conjugate({ language: 'fr', infinitive: 'aimer', mood: 'infinitive' });
    expect(explain('fr', aimer.forms[0]!, 'en').sections).toEqual([]);
    expect(explain('fr', aimer.forms[0]!, 'en').summary).toBe('aimer: Infinitif, Présent');
    expect(explain('fr', aimer.analysis, 'nl').sections).toEqual([]);
    const falloir = conjugate({ language: 'fr', infinitive: 'falloir', mood: 'indicative', tense: 'present', person: 1, number: 'singular' });
    expect(explain('fr', falloir.unavailableTargets[0] as UnavailableTarget, 'en').sections).toEqual([]);
    expect(explain('nl', conjugate({ language: 'nl', infinitive: 'werken', mood: 'infinitive' }).forms[0]!, 'nl').sections).toEqual([]);
  });
});

describe('explain terms and arguments', () => {
  const rules = defineRules({
    'xx.test.terms': { stage: 'periphrasis', params: { mood: 'term', tense: 'term', person: 'term', gender: 'term', voice: 'term' } },
    'xx.test.count': { stage: 'clause', params: { count: 'number' } },
    'xx.test.bare': { stage: 'clause' },
  });
  const messages = {
    'xx.test.terms': 'mood={mood} tense={tense} person={person} gender={gender} voice={voice}',
    'xx.test.count': '{count, plural, one {# word} other {# words}}',
    'xx.test.bare': '[{before}][{after}]',
  };
  // The infinitive's present has its own label, so a tense is only found through the target's mood.
  const labelled = { ...toyPack, catalogue: toyCatalogue.map(e => e.mood === 'infinitive' ? { ...e, tenseLabel: 'Infinitive present' } : e) };
  const engine = createEngine({ xx: labelled }, { en: { ...catalogs.en, ...messages }, nl: { ...catalogs.nl, ...messages } });
  const terms = (tense: string, person = '1') => step(rules['xx.test.terms'], null, null, {
    mood: { term: 'mood', id: 'indicative' }, tense: { term: 'tense', id: tense }, person: { term: 'person', id: person },
    gender: { term: 'gender', id: 'feminine' }, voice: { term: 'voice', id: 'passive' },
  });
  const withSteps = (form: ConjugatedForm, ...steps: ConjugatedForm['steps'] & object): ConjugatedForm => ({ ...form, steps });

  it('renders moods and tenses with the catalogue label and every other term from the catalog', () => {
    const indicative = withSteps(only(presentPlural), terms('present'));
    expect(engine.explain('xx', indicative, 'en').sections.at(-1)!.steps[0]!.text)
      .toBe('mood=Indicative tense=Present person=1st person gender=feminine voice=passive');
    expect(engine.explain('xx', indicative, 'nl').sections.at(-1)!.steps[0]!.text)
      .toBe('mood=Indicative tense=Present person=1e persoon gender=vrouwelijk voice=lijdend');
    // A tense with several labels follows the form's own mood.
    const infinitive = withSteps(only({ language: 'xx', infinitive: 'placa', mood: 'infinitive', tense: 'present' }), terms('present'));
    expect(engine.explain('xx', infinitive, 'en').sections.at(-1)!.steps[0]!.text).toContain('tense=Infinitive present');
  });

  it('names a word\'s tense in that word\'s own mood and a form-level tense in the form\'s mood', () => {
    // The auxiliary vadit is the indicative past inside the conditional's past, which has another label.
    const conditional = only({ language: 'xx', infinitive: 'placa', mood: 'conditional', tense: 'past', person: 3, number: 'singular' });
    expect(conditional.parts[1]!.features).toMatchObject({ mood: 'indicative', tense: 'past' });
    const explained = engine.explain('xx', withSteps(conditional, ...conditional.steps!, terms('past')), 'en');
    expect(explained.sections.map(s => [s.part, s.title, s.steps.map(x => x.text)])).toEqual([
      [1, 'vadit', ['Drop -a from vada: vad-.', 'Past: add -it to vad-.']],
      [2, 'placa', ['Drop -a from placa: plac-.', 'Infinitive: add -a to plac-.']],
      [null, 'The whole form', [
        'Future in the past: the past of vada, then the infinitive.',
        'mood=Indicative tense=Future in the past person=1st person gender=feminine voice=passive',
      ]],
    ]);
    expect(engine.explain('xx', conditional, 'nl').sections[0]!.steps[1]!.text).toBe('Past: voeg -it toe aan vad-.');
    expect(explained.summary).toBe('il vadit placa: Conditional, Future in the past');
  });

  it('fails on a term without a label, naming it', () => {
    const fail = (subject: ConjugatedForm | VerbAnalysis, text: string) =>
      expect(() => engine.explain('xx', subject, 'en')).toThrow(expect.objectContaining({ code: 'GENERATION_FAILURE', message: expect.stringContaining(text) }));
    fail(withSteps(only(presentPlural), terms('present', '4')), 'term.person.4');
    fail(withSteps(only(presentPlural), terms('pluperfect')), 'pluperfect');
    fail(withSteps(only(presentPlural), step(rules['xx.test.terms'], null, null, {
      mood: { term: 'mood', id: 'optative' }, tense: { term: 'tense', id: 'present' }, person: { term: 'person', id: '1' },
      gender: { term: 'gender', id: 'feminine' }, voice: { term: 'voice', id: 'passive' },
    })), 'optative');
    // Without a form there is no mood to choose the infinitive's label by.
    const analysis = { ...toy.conjugate({ language: 'xx', infinitive: 'placa' }).analysis, steps: [terms('present')] };
    fail(analysis, 'present');
  });

  it('passes numbers through and a missing before or after as an empty string', () => {
    const form = withSteps(only(presentPlural),
      step(rules['xx.test.count'], null, null, { count: 1 }), step(rules['xx.test.count'], null, null, { count: 2 }),
      step(rules['xx.test.bare'], null, 'x'), step(rules['xx.test.bare'], 'y', null));
    expect(engine.explain('xx', form, 'en').sections.at(-1)!.steps.map(s => s.text)).toEqual(['1 word', '2 words', '[][x]', '[y][]']);
  });
});
